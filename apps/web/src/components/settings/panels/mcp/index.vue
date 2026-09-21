<template>
  <div class="mcpPanel">
    <section class="settingSection" aria-labelledby="mcpEnabledTitle">
      <div class="settingHeader">
        <h3 id="mcpEnabledTitle">开启 MCP</h3>
        <el-switch :modelValue="mcpSettings.enabled" :loading="saving" aria-label="开启 MCP" @change="(value) => setEnabled(value === true)" />
      </div>
      <p class="description">允许外部 Coding 工具和 Agent 操作 Toonflow。开启后，将客户端配置添加到对应工具中。</p>
    </section>

    <section class="settingSection" aria-labelledby="mcpConnectionTitle">
      <div class="settingHeader">
        <h3 id="mcpConnectionTitle">连接状态</h3>
        <el-button text :icon="IconRefresh" :loading="loading" :disabled="saving" @click="refreshStatus">刷新</el-button>
      </div>
      <el-alert v-if="statusError" :title="statusError" type="error" :closable="false" showIcon />
      <template v-else-if="status">
        <div class="connectionState">
          <el-tag :type="status.enabled ? 'success' : 'info'" effect="plain">{{ status.enabled ? "已开启" : "已关闭" }}</el-tag>
          <span v-if="status.enabled">{{ status.connections.length }} 个界面已连接</span>
        </div>
        <ul v-if="status.enabled && status.connections.length" class="connectionList">
          <li v-for="connection in status.connections" :key="connection.id">
            <span>{{ connection.state.directory || "首页" }}</span>
            <small v-if="connection.state.directory">{{ connection.state.panel === "document" ? "文档" : "画布" }}</small>
          </li>
        </ul>
      </template>
      <p class="description">画布与节点操作需要 Toonflow 界面保持打开。</p>
    </section>

    <section class="settingSection" aria-labelledby="mcpEndpointTitle">
      <h3 id="mcpEndpointTitle">服务地址</h3>
      <div class="portSetting">
        <label for="mcpPort">首选本地端口</label>
        <el-input-number id="mcpPort" v-model="portDraft" :min="1" :max="65535" :precision="0" controlsPosition="right" size="small" :disabled="saving" />
        <el-button size="small" :loading="saving" :disabled="portDraft === undefined || portDraft === (status?.preferredPort ?? mcpSettings.port)" @click="savePort">保存</el-button>
      </div>
      <p class="description">默认 10588，占用时自动顺延。保存后自动切换 MCP 端口，地址变化后请重新复制客户端配置。</p>
      <el-input :modelValue="status?.endpoint ?? ''" readonly aria-label="MCP 服务地址" />
      <p v-if="status?.port" class="description">当前本地监听端口：{{ status.port }}</p>
      <p v-if="status?.port && status.port !== status.preferredPort && !status.error" class="description">首选端口 {{ status.preferredPort }} 已被占用，已顺延至 {{ status.port }}。</p>
      <el-alert v-if="status?.error" class="listenerError" :title="status.error" type="error" :closable="false" showIcon />
      <div class="actions">
        <el-button :icon="IconCopy" :disabled="!mcpSettings.enabled || !status?.endpoint || saving" @click="copyConfig('http')">复制 HTTP 配置</el-button>
        <el-button v-if="status?.stdio" :icon="IconTerminal2" :disabled="!mcpSettings.enabled || saving" @click="copyConfig('stdio')">复制 stdio 配置</el-button>
      </div>
      <p class="description">HTTP 配置包含访问凭证，请仅提供给可信的客户端。</p>
    </section>

    <section class="settingSection" aria-labelledby="mcpSkillTitle">
      <h3 id="mcpSkillTitle">Toonflow Skill</h3>
      <p class="description">教外部 Agent 组合使用 Toonflow 工具。将 SKILL.md 安装到对应 Coding 工具的技能目录。</p>
      <div class="actions">
        <el-button :icon="IconFileText" :loading="skillAction === 'view'" :disabled="!!skillAction" @click="handleSkill('view')">查看 Skill</el-button>
        <el-button :icon="IconCopy" :loading="skillAction === 'copy'" :disabled="!!skillAction" @click="handleSkill('copy')">复制</el-button>
        <el-button :icon="IconDownload" :loading="skillAction === 'download'" :disabled="!!skillAction" @click="handleSkill('download')">导出 Skill</el-button>
      </div>
    </section>

    <el-dialog v-model="skillVisible" title="Toonflow Skill" width="min(760px, calc(100vw - 32px))" alignCenter appendToBody>
      <div class="skillContent"><messageMarkdown :content="skillContent" /></div>
    </el-dialog>
    <el-dialog v-model="copyVisible" :title="`复制 ${copyTitle}`" width="min(680px, calc(100vw - 32px))" alignCenter appendToBody @opened="copyInput?.select()">
      <p class="copyHint">浏览器无法自动复制，请选中文本后手动复制。{{ copyHasCredential ? "此配置包含访问凭证，请仅提供给可信的客户端。" : "" }}</p>
      <el-input ref="copyInput" :modelValue="copyContent" type="textarea" :autosize="{ minRows: 8, maxRows: 18 }" readonly :aria-label="copyTitle" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import axios from "axios";
import { ElMessage, type InputInstance } from "element-plus";
import { IconCopy, IconDownload, IconFileText, IconRefresh, IconTerminal2 } from "@tabler/icons-vue";
import { saveSettings, settings } from "@/stores/settings";
import saveFile from "@/lib/saveFile";
import { writeClipboardText } from "@/lib/clipboard";
import messageMarkdown from "@/components/messageMarkdown.vue";

type McpStatus = {
  enabled: boolean;
  connections: { id: string; state: { directory?: string; panel?: string; canvasId?: string } }[];
  endpoint: string | null;
  stdio: { command: string; args: string[] } | null;
  preferredPort: number;
  port: number | null;
  error: string | null;
};

const headers = { "x-toonflow-workspace": "1" };
const mcpSettings = computed(() => {
  const raw = settings.value.mcp;
  const value = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return {
    enabled: value.enabled === true,
    token: typeof value.token === "string" ? value.token : "",
    port: typeof value.port === "number" && Number.isInteger(value.port) && value.port >= 1 && value.port <= 65535 ? value.port : 10588,
  };
});
const portDraft = ref<number | undefined>(mcpSettings.value.port);
watch(() => mcpSettings.value.port, port => { portDraft.value = port; });
const status = ref<McpStatus>();
const statusError = ref("");
const loading = ref(false);
const saving = ref(false);
const skillContent = ref("");
const skillVisible = ref(false);
const skillAction = ref<"view" | "copy" | "download" | "">("");
const copyVisible = ref(false);
const copyContent = ref("");
const copyTitle = ref("");
const copyHasCredential = ref(false);
const copyInput = ref<InputInstance>();

function errorMessage(error: unknown) {
  return axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "操作失败";
}

async function refreshStatus() {
  loading.value = true;
  statusError.value = "";
  try {
    const { data } = await axios.get<{ code: number; data: McpStatus; message?: string }>("/api/mcp/status", { headers });
    if (data.code !== 200) throw new Error(data.message || "读取 MCP 状态失败");
    if (portDraft.value === (status.value?.preferredPort ?? mcpSettings.value.port)) portDraft.value = data.data.preferredPort;
    status.value = data.data;
  } catch (error) {
    statusError.value = errorMessage(error);
  } finally {
    loading.value = false;
  }
}

async function setEnabled(enabled: boolean) {
  saving.value = true;
  try {
    await saveSettings(current => {
      const raw = current.mcp;
      const mcp = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
      let token = typeof mcp.token === "string" ? mcp.token : "";
      if (enabled && !token) token = Array.from(crypto.getRandomValues(new Uint8Array(32)), value => value.toString(16).padStart(2, "0")).join("");
      return { mcp: { ...mcp, enabled, token } };
    });
    await refreshStatus();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function savePort() {
  const port = portDraft.value;
  if (port === undefined || !Number.isInteger(port) || port < 1 || port > 65535) {
    ElMessage.error("端口必须是 1 到 65535 的整数");
    return;
  }
  saving.value = true;
  try {
    await saveSettings(current => {
      const raw = current.mcp;
      const mcp = raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
      return { mcp: { ...mcp, port } };
    });
    await refreshStatus();
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    saving.value = false;
  }
}

async function copyConfig(transport: "http" | "stdio") {
  if (!status.value || !mcpSettings.value.enabled) return;
  const config = transport === "stdio" ? status.value.stdio : {
    url: status.value.endpoint,
    headers: { Authorization: `Bearer ${mcpSettings.value.token}` },
  };
  if (!config) return;
  await copyText(JSON.stringify({ mcpServers: { toonflow: config } }, null, 2), "MCP 配置", transport === "http");
}

async function copyText(content: string, title: string, hasCredential = false) {
  try {
    await writeClipboardText(content);
    ElMessage.success(`${title}已复制`);
    return;
  } catch {
    // ACT: HTTP 页面或剪贴板权限受限时保留手动复制入口。
  }
  copyContent.value = content;
  copyTitle.value = title;
  copyHasCredential.value = hasCredential;
  copyVisible.value = true;
}

async function handleSkill(action: "view" | "copy" | "download") {
  skillAction.value = action;
  try {
    const readSkill = () => axios.get<Blob>("/api/mcp/skill", { headers, responseType: "blob" }).then(({ data }) => data);
    if (action === "download") {
      await saveFile(readSkill, "SKILL.md");
      return;
    }
    skillContent.value ||= await (await readSkill()).text();
    if (action === "view") skillVisible.value = true;
    else await copyText(skillContent.value, "Skill");
  } catch (error) {
    ElMessage.error(errorMessage(error));
  } finally {
    skillAction.value = "";
  }
}

onMounted(refreshStatus);
</script>

<style lang="scss" scoped>
.mcpPanel {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 4px 8px;

  .settingSection {
    min-width: 0;

    h3 {
      margin: 0 0 12px;
      color: var(--el-text-color-primary);
      font-size: 14px;
      font-weight: 600;
    }

    .settingHeader {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;

      h3 { margin: 0; }
    }

    .description {
      margin: 8px 0 0;
      color: var(--el-text-color-secondary);
      font-size: 12px;
      line-height: 1.6;
    }

    .portSetting {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;

      .el-input-number { width: 120px; }
    }

    .description + .el-input { margin-top: 12px; }

    .listenerError { margin-top: 8px; }

    .connectionState, .actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
      font-size: 13px;

      .el-button { margin-left: 0; }
    }

    .connectionList {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0;
      margin: 12px 0 0;
      list-style: none;

      li {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        overflow-wrap: anywhere;

        small { flex-shrink: 0; color: var(--el-text-color-secondary); }
      }
    }
  }
}

.skillContent {
  max-height: 65vh;
  overflow: auto;
}

.copyHint {
  margin: 0 0 12px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.6;
}
</style>
