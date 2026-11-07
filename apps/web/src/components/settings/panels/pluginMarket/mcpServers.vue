<template>
  <div class="mcpServers">
    <div class="mcpToolbar">
      <el-text size="small" type="info">{{ localSupported ? "连接本地或远程 MCP 服务，供 Agent 调用工具。" : "连接远程 MCP 服务，供 Agent 调用工具。" }}</el-text>
      <el-button v-if="canManage" size="small" type="primary" :icon="IconPlus" :disabled="loading" @click="openEditor()">添加 MCP</el-button>
    </div>
    <el-alert v-if="listError" class="listError" :title="listError" type="error" :closable="false" showIcon>
      <el-button size="small" @click="refreshKey++">重试</el-button>
    </el-alert>
    <div v-loading="loading" class="serverList" :aria-busy="loading">
      <el-card v-for="server in servers" :key="server.id" class="serverCard" shadow="never">
        <div class="serverHeader">
          <h3 class="serverName">{{ server.name }}</h3>
          <el-tag size="small" type="info">{{ transportLabels[server.transport] }}</el-tag>
        </div>
        <p v-if="canManage" class="serverAddress">{{ server.transport === "stdio" ? server.command : server.url }}</p>
        <el-text v-if="server.transport === 'stdio' && !localSupported" type="warning" size="small">当前平台不支持本地 MCP。</el-text>
        <el-text v-else-if="server.loadError" type="danger" size="small">{{ server.loadError }}</el-text>
        <div class="serverFooter">
          <label v-if="canManage" class="serverToggle">
            <span>{{ server.enabled ? "已启用" : "已禁用" }}</span>
            <el-switch
              :modelValue="server.enabled"
              size="small"
              :loading="pendingServers.has(server.id)"
              :disabled="loading || pendingServers.has(server.id) || (server.transport === 'stdio' && !localSupported)"
              :aria-label="`启用 ${server.name}`"
              @change="setEnabled(server, $event === true)" />
          </label>
          <el-text v-else size="small" type="info">{{ server.enabled ? "已启用" : "已禁用" }}</el-text>
          <div v-if="canManage" class="serverActions">
            <el-button size="small" :disabled="loading || pendingServers.has(server.id)" @click="openEditor(server)">编辑</el-button>
            <el-popconfirm
              :title="`确定删除“${server.name}”吗？`"
              width="240"
              confirmButtonText="删除"
              cancelButtonText="取消"
              confirmButtonType="danger"
              hideIcon
              @confirm="removeServer(server)">
              <template #reference>
                <el-button size="small" :loading="pendingServers.has(server.id)" :disabled="loading || pendingServers.has(server.id)">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog
      v-model="editorVisible"
      :title="form.id ? '编辑 MCP' : '添加 MCP'"
      width="min(680px, calc(100vw - 32px))"
      alignCenter
      appendToBody
      destroyOnClose
      :closeOnClickModal="false"
      :closeOnPressEscape="!saving"
      :showClose="!saving"
      @close="testController?.abort()">
      <el-scrollbar maxHeight="min(62dvh, calc(100dvh - 240px))">
        <div class="dialogContent">
          <el-form v-if="!form.id" labelPosition="top" :disabled="saving" @submit.prevent>
            <el-form-item class="methodField" label="添加方式">
              <el-segmented v-model="creationMode" :options="creationMethods" block ariaLabel="添加 MCP 的方式">
                <template #default="{ item }">
                  <span class="methodOption">
                    <component :is="item.icon" :size="16" aria-hidden="true" />
                    {{ item.label }}
                  </span>
                </template>
              </el-segmented>
            </el-form-item>
          </el-form>
          <el-form v-if="creationMode === 'quick'" class="serverForm" labelPosition="top" :disabled="saving || testing" @submit.prevent="saveServer">
            <div class="connectionFields">
              <el-form-item label="名称" required>
                <el-input v-model="form.name" autocomplete="off" :maxlength="100" />
              </el-form-item>
              <el-form-item label="连接方式">
                <el-select v-model="form.transport" aria-label="MCP 连接方式">
                  <el-option v-for="(label, transport) in transportLabels" :key="transport" :value="transport" :label :disabled="transport === 'stdio' && !localSupported" />
                </el-select>
              </el-form-item>
            </div>
            <template v-if="form.transport === 'stdio'">
              <el-form-item label="启动命令" required>
                <el-input v-model="form.command" class="codeInput" autocomplete="off" dir="ltr" />
                <el-text class="fieldHint" size="small" type="info">{{ localSupported ? "命令在运行 TTLflow 的电脑或服务端执行。" : "当前平台不支持本地 MCP，请改用远程连接。" }}</el-text>
              </el-form-item>
              <el-form-item label="参数（每行一个）">
                <el-input v-model="form.args" class="codeInput" type="textarea" :rows="3" resize="vertical" autocomplete="off" dir="ltr" />
                <el-text class="fieldHint" size="small" type="info">每行作为一个完整参数，路径含空格时无需加引号。</el-text>
              </el-form-item>
            </template>
            <el-form-item v-else label="服务地址" required>
              <el-input v-model="form.url" class="codeInput" autocomplete="off" dir="ltr" />
            </el-form-item>
            <el-collapse v-model="expandedSettings" class="moreSettings">
              <el-collapse-item name="advanced">
                <template #title>
                  <span>更多设置</span>
                  <el-text v-if="settingsSummary" class="settingsSummary" size="small" type="info">{{ settingsSummary }}</el-text>
                </template>
                <template v-if="form.transport === 'stdio'">
                  <el-form-item label="工作目录（可选）">
                    <el-input v-model="form.cwd" class="codeInput" autocomplete="off" dir="ltr" />
                  </el-form-item>
                  <el-form-item label="环境变量（JSON，可选）">
                    <el-input v-model="form.env" class="codeInput" type="textarea" :rows="4" autocomplete="off" spellcheck="false" dir="ltr" />
                  </el-form-item>
                </template>
                <el-form-item v-else label="请求头（JSON，可选）">
                  <el-input v-model="form.headers" class="codeInput" type="textarea" :rows="4" autocomplete="off" spellcheck="false" dir="ltr" />
                </el-form-item>
              </el-collapse-item>
            </el-collapse>
            <div class="enabledRow">
              <label class="enabledControl">
                <el-switch v-model="form.enabled" size="small" aria-label="启用 MCP 服务" />
                <span>启用此 MCP</span>
              </label>
              <el-text size="small" type="info">保存后在下一轮 Agent 对话生效</el-text>
            </div>
          </el-form>
          <mcpImportForm
            v-else-if="editorVisible"
            :key="creationMode"
            ref="importForm"
            :mode="creationMode"
            :localSupported
            @busy="saving = $event"
            @saved="finishImport" />
        </div>
      </el-scrollbar>
      <template #footer>
        <div class="editorFooter">
          <div v-if="feedbackVisible" class="connectionStatus" :class="{ hasError: !!editorError && !testing }" role="status" aria-live="polite" :aria-busy="testing">
            <template v-if="testing">
              <icon-loader-2 class="loadingIcon" :size="16" aria-hidden="true" />
              <span>正在连接并读取工具…</span>
            </template>
            <template v-else-if="editorError">
              <icon-alert-circle class="errorIcon" :size="16" aria-hidden="true" />
              <span class="errorText">{{ editorError }}</span>
            </template>
            <template v-else-if="testResult">
              <icon-circle-check class="successIcon" :size="16" aria-hidden="true" />
              <span>连接成功</span>
              <el-text size="small" type="info">{{ testResult.tools.length }} 个工具</el-text>
              <el-popover v-if="testResult.tools.length" placement="top-start" width="min(420px, calc(100vw - 48px))" trigger="click" :showArrow="false">
                <template #reference><el-button size="small" type="primary" link>查看工具</el-button></template>
                <el-scrollbar maxHeight="300px">
                  <div class="toolList">
                    <div v-for="tool in testResult.tools" :key="tool.name" class="toolItem">
                      <div class="toolName">{{ tool.name }}</div>
                      <p v-if="tool.description" class="toolDescription">{{ tool.description }}</p>
                    </div>
                  </div>
                </el-scrollbar>
              </el-popover>
            </template>
          </div>
          <div class="editorActions">
            <el-button :disabled="saving" @click="editorVisible = false">取消</el-button>
            <template v-if="creationMode === 'quick'">
              <el-button :loading="testing" :disabled="saving || (form.transport === 'stdio' && !localSupported)" @click="testConnection">{{ testing ? "连接中…" : "测试连接" }}</el-button>
              <el-button type="primary" :loading="saving" :disabled="testing || (form.transport === 'stdio' && !localSupported)" @click="saveServer">保存</el-button>
            </template>
            <el-button v-else type="primary" :loading="saving" :disabled="!importForm?.ready" @click="importForm?.importServers()">导入</el-button>
          </div>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import axios from "axios";
import { t, translate } from "@toonflow/i18n/vue";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { IconPlus, IconFileCode, IconPackage, IconCircleCheck, IconAlertCircle, IconLoader2 } from "@tabler/icons-vue";
import mcpImportForm from "./mcpImportForm.vue";

type McpServerConfig = {
  id?: string;
  name: string;
  transport: "stdio" | "http" | "sse";
  enabled: boolean;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  url?: string;
  headers?: Record<string, string>;
  loadError?: string;
};
type TestResult = { tools: { name: string; description?: string }[]; serverName?: string };
const { visible = true } = defineProps<{ visible?: boolean }>();
const transportLabels = { stdio: "本地（stdio）", http: "远程（Streamable HTTP）", sse: "远程（SSE）" };
const requestHeaders = { "x-toonflow-workspace": "1" };
const servers = ref<(McpServerConfig & { id: string })[]>([]);
const canManage = ref(false);
const localSupported = ref(false);
const creationMethods = computed(() => [
  { label: "快速创建", value: "quick", icon: IconPlus },
  { label: "从 JSON 导入", value: "json", icon: IconFileCode },
  { label: "导入 DXT 包", value: "dxt", icon: IconPackage, disabled: !localSupported.value },
]);
const loading = ref(false);
const listError = ref("");
const refreshKey = ref(0);
const pendingServers = ref(new Set<string>());
const editorVisible = ref(false);
const creationMode = ref<"quick" | "json" | "dxt">("quick");
const expandedSettings = ref<string[]>([]);
const importForm = ref<InstanceType<typeof mcpImportForm>>();
const saving = ref(false);
const testing = ref(false);
const editorError = ref("");
const testResult = ref<TestResult>();
const feedbackVisible = computed(() => creationMode.value === "quick" && (testing.value || !!editorError.value || !!testResult.value));
const form = ref({
  id: undefined as string | undefined, name: "", transport: "stdio" as McpServerConfig["transport"],
  enabled: true, command: "", args: "", cwd: "", env: "", url: "", headers: "",
});
const settingsSummary = computed(() => {
  const local = form.value.transport === "stdio";
  const parts = local && form.value.cwd.trim() ? [translate("已配置工作目录")] : [];
  const value = local ? form.value.env : form.value.headers;
  const label = local ? translate("环境变量") : translate("请求头");
  if (value.trim()) {
    try {
      const config = JSON.parse(value);
      parts.push(config && typeof config === "object" && !Array.isArray(config) ? t`${label} ${Object.keys(config).length} 项` : t`${label}已填写`);
    } catch { parts.push(t`${label}已填写`); }
  }
  return parts.join(" · ");
});
const controller = new AbortController();
let testController: AbortController | undefined;
let originalArgs: string[] = [];
onBeforeUnmount(() => {
  controller.abort();
  testController?.abort();
});
watch(form, () => { testResult.value = undefined; }, { deep: true, flush: "sync" });
watch(creationMode, () => {
  testController?.abort();
  testResult.value = undefined;
  editorError.value = "";
});
watch(
  () => [visible, refreshKey.value],
  async (_value, _previous, onCleanup) => {
    if (!visible) {
      editorVisible.value = false;
      testController?.abort();
      return;
    }
    const listController = new AbortController();
    onCleanup(() => listController.abort());
    loading.value = true;
    listError.value = "";
    canManage.value = false;
    try {
      const { data } = await axios.get<{ code: number; data: { servers: (McpServerConfig & { id: string })[]; canManage: boolean; localSupported: boolean }; message?: string }>(
        "/api/mcp/servers/list", { headers: requestHeaders, signal: listController.signal }
      );
      if (listController.signal.aborted) return;
      if (data.code !== 200) throw new Error(data.message || "读取 MCP 服务失败");
      if (!Array.isArray(data.data?.servers) || data.data.servers.some(server =>
        !server || typeof server.id !== "string" || typeof server.name !== "string"
        || !Object.hasOwn(transportLabels, server.transport) || typeof server.enabled !== "boolean"
      )) throw new Error("MCP 服务列表格式错误");
      servers.value = data.data.servers;
      canManage.value = data.data.canManage === true;
      localSupported.value = data.data.localSupported === true;
    } catch (cause) {
      if (!listController.signal.aborted) listError.value = errorMessage(cause);
    } finally {
      if (!listController.signal.aborted) loading.value = false;
    }
  },
  { immediate: true }
);

function errorMessage(cause: unknown) {
  return axios.isAxiosError(cause) ? cause.response?.data?.message || cause.message : cause instanceof Error ? cause.message : translate("操作失败");
}

function openEditor(server?: McpServerConfig) {
  if (!canManage.value || loading.value || (server?.id && pendingServers.value.has(server.id))) return;
  originalArgs = [...(server?.args ?? [])];
  form.value = {
    id: server?.id, name: server?.name ?? "", transport: server?.transport ?? (localSupported.value ? "stdio" : "http"),
    enabled: server?.enabled ?? true, command: server?.command ?? "", args: originalArgs.join("\n"),
    cwd: server?.cwd ?? "", env: server?.env ? JSON.stringify(server.env, null, 2) : "",
    url: server?.url ?? "", headers: server?.headers ? JSON.stringify(server.headers, null, 2) : "",
  };
  editorError.value = "";
  creationMode.value = "quick";
  expandedSettings.value = [];
  testResult.value = undefined;
  editorVisible.value = true;
}

function finishImport(count: number) {
  editorVisible.value = false;
  refreshKey.value++;
  ElMessage.success(`已导入 ${count} 个 MCP 服务`);
}

function parseRecord(value: string, label: string): Record<string, string> | undefined {
  if (!value.trim()) return undefined;
  let parsed: unknown;
  try { parsed = JSON.parse(value); }
  catch { throw new Error(`${label}必须是有效的 JSON 对象`); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed) || Object.values(parsed).some(item => typeof item !== "string")) {
    throw new Error(`${label}必须是 JSON 对象，所有值均为字符串`);
  }
  return parsed as Record<string, string>;
}

function serverFromForm(): McpServerConfig {
  const value = form.value;
  const name = value.name.trim();
  if (!name) throw new Error("请填写 MCP 名称");
  const server: McpServerConfig = { ...(value.id ? { id: value.id } : {}), name, transport: value.transport, enabled: value.enabled };
  if (value.transport === "stdio") {
    if (!localSupported.value) throw new Error("当前平台不支持本地 MCP，请改用远程连接");
    const command = value.command.trim();
    if (!command) throw new Error("请填写启动命令");
    return {
      ...server, command, args: value.args === originalArgs.join("\n") ? [...originalArgs] : value.args ? value.args.split(/\r?\n/) : [],
      ...(value.cwd.trim() ? { cwd: value.cwd.trim() } : {}), env: parseRecord(value.env, translate("环境变量")),
    };
  }
  const url = value.url.trim();
  if (!URL.canParse(url) || !["http:", "https:"].includes(new URL(url).protocol)) throw new Error("请输入有效的 HTTP 或 HTTPS 服务地址");
  return { ...server, url, headers: parseRecord(value.headers, translate("请求头")) };
}

async function saveServer() {
  if (!canManage.value || saving.value || testing.value) return;
  editorError.value = "";
  try {
    const server = serverFromForm();
    saving.value = true;
    const { data } = await axios.put("/api/mcp/servers/save", { server }, { headers: requestHeaders, signal: controller.signal });
    if (controller.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "保存 MCP 服务失败");
    editorVisible.value = false;
    refreshKey.value++;
    ElMessage.success("MCP 服务已保存");
  } catch (cause) {
    if (!controller.signal.aborted) editorError.value = errorMessage(cause);
  } finally { saving.value = false; }
}

async function testConnection() {
  if (!canManage.value || saving.value || testing.value) return;
  editorError.value = "";
  testResult.value = undefined;
  const currentController = new AbortController();
  testController = currentController;
  try {
    const server = serverFromForm();
    testing.value = true;
    const { data } = await axios.post<{ code: number; data: TestResult; message?: string }>(
      "/api/mcp/servers/test", { server }, { headers: requestHeaders, signal: currentController.signal }
    );
    if (currentController.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "MCP 连接失败");
    if (!Array.isArray(data.data?.tools)) throw new Error("MCP 工具列表格式错误");
    testResult.value = data.data;
  } catch (cause) {
    if (!currentController.signal.aborted) editorError.value = errorMessage(cause);
  } finally {
    if (testController === currentController) testing.value = false;
  }
}

async function setEnabled(server: McpServerConfig, enabled: boolean) {
  if (!canManage.value || loading.value || !server.id || pendingServers.value.has(server.id)) return;
  pendingServers.value.add(server.id);
  try {
    const { data } = await axios.post("/api/mcp/servers/setEnabled", { id: server.id, enabled }, { headers: requestHeaders, signal: controller.signal });
    if (controller.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "更新 MCP 状态失败");
    server.enabled = enabled;
  } catch (cause) {
    if (!controller.signal.aborted) ElMessage.error(errorMessage(cause));
  } finally { pendingServers.value.delete(server.id); }
}

async function removeServer(server: McpServerConfig) {
  if (!canManage.value || loading.value || !server.id || pendingServers.value.has(server.id)) return;
  pendingServers.value.add(server.id);
  try {
    const { data } = await axios.delete("/api/mcp/servers/remove", { data: { id: server.id }, headers: requestHeaders, signal: controller.signal });
    if (controller.signal.aborted) return;
    if (data.code !== 200) throw new Error(data.message || "删除 MCP 服务失败");
    servers.value = servers.value.filter(item => item.id !== server.id);
    ElMessage.success("MCP 服务已删除");
  } catch (cause) {
    if (!controller.signal.aborted) {
      ElMessage.error(errorMessage(cause));
      refreshKey.value++;
    }
  } finally { pendingServers.value.delete(server.id); }
}
</script>

<style scoped lang="scss">
.mcpServers {
  .mcpToolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }
  .listError { margin-bottom: 12px; }
  .serverList {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
    gap: 12px;
    min-height: 48px;
    .serverCard {
      min-width: 0;
      :deep(.el-card__body) { padding: 16px; }
      .serverHeader {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        .serverName { margin: 0; font-size: 14px; overflow-wrap: anywhere; }
        .el-tag { flex-shrink: 0; }
      }
      .serverAddress { color: var(--el-text-color-secondary); font-size: 12px; overflow-wrap: anywhere; }
      .serverFooter {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 16px;
        .serverToggle {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }
        .serverActions { display: flex; gap: 8px; .el-button { margin-left: 0; } }
      }
    }
  }
}
.dialogContent {
  padding: 8px 4px;
  .methodField {
    .methodOption {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 4px 0;
    }
  }
  .serverForm {
    .connectionFields {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: 16px;
    }
    .el-select { width: 100%; }
    .codeInput {
      :deep(.el-input__inner), :deep(.el-textarea__inner) {
        font-family: "Cascadia Code", "SFMono-Regular", Consolas, monospace;
        font-size: 13px;
        line-height: 1.6;
      }
    }
    .fieldHint { display: block; margin-top: 6px; line-height: 1.5; }
    .moreSettings {
      margin-bottom: 14px;
      --el-collapse-border-color: var(--el-border-color-lighter);
      .settingsSummary { margin-left: 12px; font-weight: 400; }
      :deep(.el-collapse-item__content) { padding-bottom: 0; }
    }
    .enabledRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      .enabledControl {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--el-text-color-regular);
      }
    }
    @media (max-width: 520px) {
      .connectionFields { grid-template-columns: minmax(0, 1fr); gap: 0; }
      .enabledRow { align-items: flex-start; flex-direction: column; gap: 6px; }
    }
  }
}
.editorFooter {
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  .connectionStatus {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
    color: var(--el-text-color-regular);
    text-align: left;
    font-size: 13px;
    > svg { flex-shrink: 0; }
    .loadingIcon { animation: statusSpin 1s linear infinite; }
    .successIcon { color: var(--el-color-success); }
    .errorIcon { margin-top: 2px; color: var(--el-color-danger); }
    &.hasError { align-items: flex-start; }
    .errorText {
      flex: 1;
      min-width: 0;
      max-height: 72px;
      overflow-y: auto;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      line-height: 1.5;
    }
    @media (prefers-reduced-motion: reduce) {
      .loadingIcon { animation: none; }
    }
  }
  .editorActions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    .el-button { margin-left: 0; }
  }
}
.toolList {
  .toolItem {
    padding: 10px 4px;
    overflow-wrap: anywhere;
    & + .toolItem { border-top: 1px solid var(--el-border-color-lighter); }
    .toolName { font-size: 13px; font-weight: 600; color: var(--el-text-color-primary); }
    .toolDescription { margin: 6px 0 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }
  }
}
@keyframes statusSpin {
  to { transform: rotate(360deg); }
}
</style>
