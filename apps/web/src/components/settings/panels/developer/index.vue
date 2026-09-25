<template>
  <div class="developerPanel">
    <div class="developer" :class="{ blurred: developerLocked }" :inert="developerLocked">
      <div class="developerRow">
        <div class="toolDescription">
          <h3>开发者工具</h3>
          <p>查看页面结构、控制台与网络请求。</p>
        </div>
        <el-button type="primary" :icon="IconTerminal2" :loading="opening" :disabled="!isDesktop" @click="openDevTools">打开 DevTools</el-button>
      </div>
      <el-text v-if="!isDesktop" type="info">浏览器模式请从浏览器菜单打开开发者工具。</el-text>
      <el-text v-if="requestError" type="danger" role="alert">{{ requestError }}</el-text>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>首次使用引导</h3>
          <p>当前{{ hello.completed ? '已完成' : '未完成' }}。重置后打开引导页，保留已配置的模型。</p>
        </div>
        <el-button :icon="IconRefresh" :loading="resettingHello" :disabled="importingStorage || writingStorage" @click="resetHello">重置并打开引导页</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>供应商开发工具</h3>
          <p>授权读取本地供应商文件，调试生成接口与媒体结果。</p>
        </div>
        <el-button :icon="IconCode" @click="providerDebugVisible = true">开发供应商</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>Agent 系统提示词</h3>
          <p>编辑 Agent 的基础指令，保存后下一条消息生效。</p>
        </div>
        <el-button :icon="IconEdit" @click="systemPromptVisible = true">编辑提示词</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>自定义更新源</h3>
          <p>填写更新清单和安装包所在的目录地址，保存后可在关于页选择。</p>
        </div>
        <div class="updateSourceEditor">
          <el-input v-model="customUpdateUrl" placeholder="https://example.com/desktopUpdates" aria-label="自定义更新源目录地址" clearable :disabled="savingUpdateUrl" @keyup.enter="saveCustomUpdateUrl" />
          <el-button type="primary" :loading="savingUpdateUrl" @click="saveCustomUpdateUrl">保存</el-button>
        </div>
      </div>
      <el-text v-if="updateUrlError" type="danger" role="alert">{{ updateUrlError }}</el-text>
      <div class="pluginInstaller">
        <div class="installerHeader">
          <h3>手动安装插件</h3>
          <el-select v-model="installType" class="typeSelect" :disabled="!!installing" aria-label="安装插件类型">
            <el-option v-for="(item, type) in installTypes" :key="type" :label="item.label" :value="type" />
            <el-option label="Agent（暂未开放）" value="agent" disabled />
          </el-select>
        </div>
        <div class="toolDescription">
          <p>{{ selectedInstaller.description }}支持本地文件或文件直链，安装后可在插件市场查看。</p>
        </div>
        <el-checkbox v-model="forceInstall" :disabled="!!installing">强制安装（允许覆盖同版本或降级）</el-checkbox>
        <input ref="fileInput" class="fileInput" type="file" :accept="selectedInstaller.accept" @change="installFile" />
        <el-button :icon="IconFileUpload" :loading="installing === 'file'" :disabled="!!installing" @click="fileInput?.click()">选择本地{{ selectedInstaller.label }}文件</el-button>
        <div class="urlInstaller">
          <el-input v-model="pluginUrl" :disabled="!!installing" :placeholder="`https://example.com/${selectedInstaller.example}`" :aria-label="`${selectedInstaller.label}文件地址`" clearable @keyup.enter="installUrl" />
          <el-button type="primary" :icon="IconDownload" :loading="installing === 'url'" :disabled="!!installing || !pluginUrl.trim()" @click="installUrl">从 URL 安装</el-button>
        </div>
        <el-text v-if="installError" type="danger" role="alert">{{ installError }}</el-text>
        <el-text v-else-if="installedName" type="success" role="status">{{ installedName }} 已安装</el-text>
      </div>
      <div class="storageManager">
        <div class="developerRow">
          <div class="toolDescription">
            <h3>浏览器持久缓存</h3>
            <p>管理当前站点的 localStorage。修改重新加载后生效；首次使用引导请通过上方按钮重置。导入会覆盖同名项，保留其他项。</p>
          </div>
          <div class="storageToolbar">
            <input ref="storageFileInput" type="file" accept=".json,application/json" hidden @change="importStorage" />
            <el-button :icon="IconFileUpload" :loading="importingStorage" :disabled="storageBusy" @click="storageFileInput?.click()">导入</el-button>
            <el-button :icon="IconDownload" :disabled="storageBusy" @click="exportStorage">导出</el-button>
            <el-button :icon="IconRefresh" :disabled="storageBusy" @click="loadStorage">刷新列表</el-button>
          </div>
        </div>
        <el-text v-if="storageError" type="danger" role="alert">{{ storageError }}</el-text>
        <el-text v-else-if="storageMessage" type="success" role="status">{{ storageMessage }}</el-text>
        <div v-for="entry in storageEntries" :key="entry.key" class="storageItem">
          <div class="storageHeader">
            <span class="storageKey">{{ entry.key || '（空键名）' }}</span>
            <div class="storageActions">
              <el-button :icon="IconEdit" text :disabled="storageBusy" :aria-label="`修改 ${entry.key}`" @click="editStorage(entry)">修改</el-button>
              <el-popconfirm title="确定删除这条缓存？" confirmButtonText="删除" cancelButtonText="取消" @confirm="writeStorage(entry, null)">
                <template #reference>
                  <el-button :icon="IconTrash" type="danger" text :disabled="storageBusy" :aria-label="`删除 ${entry.key}`">删除</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <template v-if="editingKey === entry.key">
            <el-input v-model="storageValue" type="textarea" :rows="5" :disabled="storageBusy" :aria-label="`${entry.key} 的值`" />
            <div class="storageActions">
              <el-button :disabled="storageBusy" @click="editingKey = null">取消</el-button>
              <el-button type="primary" :loading="writingStorage" :disabled="storageBusy" @click="writeStorage(entry, storageValue)">保存</el-button>
            </div>
          </template>
          <div v-else class="storageValue">{{ entry.value }}</div>
        </div>
      </div>
    </div>
    <providerDebugDialog v-if="providerDebugVisible" v-model="providerDebugVisible" />
    <systemPromptDialog v-if="systemPromptVisible" v-model="systemPromptVisible" />
    <div v-if="developerLocked" class="developerConfirm">
      <icon-code :size="28" aria-hidden="true" />
      <h3>确认进入开发者选项</h3>
      <p>此功能仅供开发调试，普通用户请勿开启。安装未知节点或修改、清除缓存可能导致程序异常或数据丢失。请确认你了解相关风险后继续，系统将记住你的选择。</p>
      <el-button type="primary" @click="confirmDeveloper">确认并继续</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useDeveloperStore } from "@/stores/developer";
import { useHelloStore } from "@/stores/hello";
import { saveSettings, settings } from "@/stores/settings";
import saveFile from "@/lib/saveFile";
import { installPluginFile } from "../../installPluginFile";
import { ElMessage } from "element-plus";
import axios from "axios";
import { IconCode, IconTerminal2, IconFileUpload, IconDownload, IconRefresh, IconEdit, IconTrash } from "@tabler/icons-vue";

const developerStore = useDeveloperStore();
const hello = useHelloStore();
const router = useRouter();
const resettingHello = ref(false);
const providerDebugDialog = defineAsyncComponent(() => import("./providerDebugDialog.vue"));
const providerDebugVisible = ref(false);
const systemPromptDialog = defineAsyncComponent(() => import("./systemPromptDialog.vue"));
const systemPromptVisible = ref(false);
const developerLocked = computed(() => !developerStore.developerConfirmed);
const customUpdateUrl = ref(typeof settings.value.desktopUpdateCustomUrl === "string" ? settings.value.desktopUpdateCustomUrl : "");
const savingUpdateUrl = ref(false);
const updateUrlError = ref("");

async function saveCustomUpdateUrl() {
  if (savingUpdateUrl.value) return;
  const url = customUpdateUrl.value.trim();
  updateUrlError.value = "";
  try {
    if (url && !URL.canParse(url)) throw new Error("请输入有效的 HTTP(S) 目录地址");
    if (url) {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || url.length > 2048)
        throw new Error("请输入不含账号、查询参数或锚点的 HTTP(S) 目录地址");
    }
    savingUpdateUrl.value = true;
    await saveSettings(current => ({
      desktopUpdateCustomUrl: url,
      ...(url || current.desktopUpdateSource !== "custom" ? {} : { desktopUpdateSource: "official" }),
    }));
    customUpdateUrl.value = url;
    ElMessage.success("自定义更新源已保存");
  } catch (error) {
    updateUrlError.value = axios.isAxiosError<{ message?: string }>(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : "保存更新源失败";
  } finally {
    savingUpdateUrl.value = false;
  }
}

async function resetHello() {
  if (storageBusy.value) return;
  resettingHello.value = true;
  try {
    await hello.reset();
    loadStorage();
    await router.replace("/hello");
  } catch {
    ElMessage.error("重置引导失败，请重试");
  } finally {
    resettingHello.value = false;
  }
}

function confirmDeveloper() {
  developerStore.developerConfirmed = true;
  loadStorage();
}

const installTypes = {
  node: { label: "节点", accept: ".umd.js", example: "imageNode.umd.js", description: "选择脚手架打包的 .umd.js 文件。" },
  skill: { label: "技能", accept: ".zip,.md,.tar,.tar.gz,.tgz", example: "skill.zip", description: "支持包含技能与资源的 .zip 包、SKILL.md，以及 .tar、.tar.gz、.tgz 包。" },
  tool: { label: "工具", accept: ".tool.js", example: "mediaGeneration.tool.js", description: "选择脚手架打包的 .tool.js 文件。" },
};
const installType = ref<keyof typeof installTypes>("node");
const selectedInstaller = computed(() => installTypes[installType.value]);
const fileInput = ref<HTMLInputElement>();
const pluginUrl = ref("");
const forceInstall = ref(false);
const installing = ref<"file" | "url" | "">("");
const installError = ref("");
const installedName = ref("");
watch(installType, () => {
  pluginUrl.value = "";
  installError.value = "";
  installedName.value = "";
});
const storageEntries = ref<{ key: string; value: string }[]>([]);
const storageError = ref("");
const editingKey = ref<string | null>(null);
const storageValue = ref("");
const storageFileInput = ref<HTMLInputElement>();
const importingStorage = ref(false);
const writingStorage = ref(false);
const storageBusy = computed(() => importingStorage.value || writingStorage.value || resettingHello.value);
const storageMessage = ref("");

function readStorage() {
  return Object.fromEntries(Object.keys(localStorage).map(key => [key, localStorage.getItem(key) ?? ""]));
}

function saveStorage(entries: [string, string | null][]) {
  const previous = entries.map(([key]) => [key, localStorage.getItem(key)] as const);
  try {
    for (const [key, value] of entries) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
  } catch (error) {
    // ACT: localStorage 没有事务，写入失败时恢复本次修改的项。
    for (const [key, value] of previous.reverse()) {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    }
    throw error;
  }
}

async function importStorage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || storageBusy.value) return;
  importingStorage.value = true;
  storageError.value = "";
  storageMessage.value = "";
  try {
    const data: unknown = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.values(data).some(value => typeof value !== "string")) {
      throw new Error("请选择键值均为字符串的 JSON 对象，例如 {\"key\":\"value\"}。");
    }
    const entries = Object.entries(data) as [string, string][];
    saveStorage(entries);
    loadStorage();
    storageMessage.value = `已导入 ${entries.length} 项，重新加载页面后生效。`;
  } catch (err) {
    storageError.value = err instanceof Error ? err.message : "导入缓存失败";
  } finally {
    importingStorage.value = false;
  }
}

async function exportStorage() {
  storageError.value = "";
  storageMessage.value = "";
  try {
    const data = readStorage();
    await saveFile(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "toonflowLocalStorage.json");
  } catch (err) {
    storageError.value = err instanceof Error ? err.message : "导出缓存失败";
  }
}

function loadStorage() {
  storageError.value = "";
  storageMessage.value = "";
  try {
    storageEntries.value = Object.entries(readStorage()).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => ({ key, value }));
    editingKey.value = null;
  } catch (err) {
    storageError.value = err instanceof Error ? err.message : "读取缓存失败";
  }
}

function editStorage(entry: { key: string; value: string }) {
  editingKey.value = entry.key;
  storageValue.value = entry.value;
}

function writeStorage(entry: { key: string; value: string }, value: string | null) {
  if (storageBusy.value) return;
  writingStorage.value = true;
  storageError.value = "";
  storageMessage.value = "";
  try {
    if (readStorage()[entry.key] !== entry.value) throw new Error("这条数据已发生变化，请刷新列表后重试。");
    saveStorage([[entry.key, value]]);
    if (editingKey.value === entry.key) editingKey.value = null;
    loadStorage();
    storageMessage.value = "已保存，重新加载页面后生效。";
  } catch (err) {
    storageError.value = err instanceof Error ? err.message : "更新缓存失败";
  } finally {
    writingStorage.value = false;
  }
}

loadStorage();

async function installFile(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file || installing.value) return;
  await installPlugin("file", file);
}

async function installUrl() {
  if (!pluginUrl.value.trim() || installing.value) return;
  await installPlugin("url");
}

async function installPlugin(sourceType: "file" | "url", file?: File) {
  const type = installType.value;
  installing.value = sourceType;
  installError.value = "";
  installedName.value = "";
  try {
    if (file) {
      installedName.value = await installPluginFile(type, file, forceInstall.value);
    } else {
      const { data } = await axios.post(`/api/${type}s/install`, { url: pluginUrl.value.trim(), force: forceInstall.value }, { headers: { "x-toonflow-workspace": "1" } });
      if (data.code !== 200) throw new Error(data.message || "安装失败");
      installedName.value = data.data.name;
      window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type, name: data.data.name } }));
    }
  } catch (err) {
    installError.value = axios.isAxiosError<{ message?: string }>(err) ? err.response?.data.message || "安装失败，请检查网络后重试" : err instanceof Error ? err.message : "安装失败";
  } finally {
    installing.value = "";
  }
}

const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const opening = ref(false);
const requestError = ref("");

async function openDevTools() {
  if (!isDesktop || opening.value) return;
  opening.value = true;
  requestError.value = "";
  try {
    const response = await fetch("/api/desktop/devtools", { method: "POST", headers: { "x-toonflow-desktop": "1" } });
    if (!response.ok) throw new Error((await response.json()).message || "打开开发者工具失败，请重试。");
  } catch (error) {
    requestError.value = error instanceof Error ? error.message : "打开开发者工具失败，请重试。";
  } finally {
    opening.value = false;
  }
}
</script>

<style lang="scss" scoped>
.developerPanel {
  position: relative;
  height: 100%;
  overflow: hidden;

  .developer {
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    &.blurred { filter: blur(6px); user-select: none; pointer-events: none; }
    display: flex;
    flex-direction: column;
    gap: 16px;

    .toolDescription {
      h3 { margin: 0 0 8px; font-size: 14px; color: var(--el-text-color-primary); }
      p { margin: 0; font-size: 13px; line-height: 1.6; color: var(--el-text-color-secondary); }
    }

    .pluginInstaller {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      margin-top: 16px;

      .installerHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        width: 100%;

        h3 { margin: 0; font-size: 14px; color: var(--el-text-color-primary); }
        .typeSelect { width: 160px; }
      }

      .fileInput { display: none; }
      .urlInstaller {
        display: flex;
        flex-wrap: wrap;
        width: 100%;
        gap: 12px;

        .el-input { flex: 1; min-width: 200px; }
      }
    }

    .developerRow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;

      .updateSourceEditor {
        display: flex;
        flex: 1;
        flex-wrap: wrap;
        gap: 8px;
        min-width: min(100%, 280px);

        .el-input { flex: 1; min-width: 200px; }
      }
    }

    .storageManager {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
      min-width: 0;

      .storageToolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-button { margin-left: 0; }
      }

      .storageItem {
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px;
        border-radius: var(--el-border-radius-base);
        background: var(--el-fill-color-light);

        .storageHeader {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;

          .storageKey { overflow-wrap: anywhere; font-size: 13px; font-weight: 500; }
        }

        .storageActions { display: flex; justify-content: flex-end; flex-shrink: 0; }
        .storageValue { white-space: pre-wrap; overflow-wrap: anywhere; max-height: 120px; overflow: auto; font-size: 13px; color: var(--el-text-color-secondary); }
      }
    }
  }

  .developerConfirm {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 24px;
    overflow-y: auto;
    text-align: center;
    background: color-mix(in srgb, var(--el-bg-color) 75%, transparent);

    h3 { margin: 0; font-size: 16px; }
    p { margin: 0; max-width: 320px; line-height: 1.6; color: var(--el-text-color-secondary); }
  }
}
</style>
