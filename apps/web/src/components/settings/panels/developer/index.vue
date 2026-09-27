<template>
  <div class="developerPanel">
    <div class="developer" :class="{ blurred: developerLocked }" :inert="developerLocked">
      <div class="developerRow">
        <div class="toolDescription">
          <h3>{{ t("developer.devtoolsTitle") }}</h3>
          <p>{{ t("developer.devtoolsDescription") }}</p>
        </div>
        <el-button type="primary" :icon="IconTerminal2" :loading="opening" :disabled="!isDesktop" @click="openDevTools">{{ t("developer.openDevtools") }}</el-button>
      </div>
      <el-text v-if="!isDesktop" type="info">{{ t("developer.devtoolsBrowserHint") }}</el-text>
      <el-text v-if="requestError" type="danger" role="alert">{{ getErrorDisplay(requestError) }}</el-text>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>{{ t("developer.firstRunGuide") }}</h3>
          <p>{{ t(hello.completed ? 'developer.guideCompleted' : 'developer.guideIncomplete') }}</p>
        </div>
        <el-button :icon="IconRefresh" :loading="resettingHello" :disabled="importingStorage || writingStorage" @click="resetHello">{{ t("developer.resetGuide") }}</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>{{ t("developer.providerToolTitle") }}</h3>
          <p>{{ t("developer.providerToolDescription") }}</p>
        </div>
        <el-button :icon="IconCode" @click="providerDebugVisible = true">{{ t("developer.openProviderTool") }}</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>{{ t("developer.systemPromptTitle") }}</h3>
          <p>{{ t("developer.systemPromptDescription") }}</p>
        </div>
        <el-button :icon="IconEdit" @click="systemPromptVisible = true">{{ t("developer.editPrompt") }}</el-button>
      </div>
      <div class="developerRow">
        <div class="toolDescription">
          <h3>{{ t("developer.customUpdateSource") }}</h3>
          <p>{{ t("developer.customUpdateDescription") }}</p>
        </div>
        <div class="updateSourceEditor">
          <el-input v-model="customUpdateUrl" placeholder="https://example.com/desktopUpdates" :aria-label="t('developer.customUpdateUrlLabel')" clearable :disabled="savingUpdateUrl" @keyup.enter="saveCustomUpdateUrl" />
          <el-button type="primary" :loading="savingUpdateUrl" @click="saveCustomUpdateUrl">{{ t("common.save") }}</el-button>
        </div>
      </div>
      <el-text v-if="updateUrlError" type="danger" role="alert">{{ getErrorDisplay(updateUrlError) }}</el-text>
      <div class="pluginInstaller">
        <div class="installerHeader">
          <h3>{{ t("developer.installManually") }}</h3>
          <el-select v-model="installType" class="typeSelect" :disabled="!!installing" :aria-label="t('developer.pluginTypeLabel')">
            <el-option v-for="(item, type) in installTypes" :key="type" :label="item.label" :value="type" />
            <el-option :label="t('developer.agentUnavailable')" value="agent" disabled />
          </el-select>
        </div>
        <div class="toolDescription">
          <p>{{ t("developer.installDescription", { description: selectedInstaller.description }) }}</p>
        </div>
        <el-checkbox v-model="forceInstall" :disabled="!!installing">{{ t("developer.forceInstall") }}</el-checkbox>
        <input ref="fileInput" class="fileInput" type="file" :accept="selectedInstaller.accept" @change="installFile" />
        <el-button :icon="IconFileUpload" :loading="installing === 'file'" :disabled="!!installing" @click="fileInput?.click()">{{ t("developer.chooseLocalFile", { type: selectedInstaller.label }) }}</el-button>
        <div class="urlInstaller">
          <el-input v-model="pluginUrl" :disabled="!!installing" :placeholder="`https://example.com/${selectedInstaller.example}`" :aria-label="t('developer.fileUrlLabel', { type: selectedInstaller.label })" clearable @keyup.enter="installUrl" />
          <el-button type="primary" :icon="IconDownload" :loading="installing === 'url'" :disabled="!!installing || !pluginUrl.trim()" @click="installUrl">{{ t("developer.installFromUrl") }}</el-button>
        </div>
        <el-text v-if="installError" type="danger" role="alert">{{ getErrorDisplay(installError) }}</el-text>
        <el-text v-else-if="installedName" type="success" role="status">{{ t("developer.installed", { name: installedName }) }}</el-text>
      </div>
      <div class="storageManager">
        <div class="developerRow">
          <div class="toolDescription">
            <h3>{{ t("developer.browserStorage") }}</h3>
            <p>{{ t("developer.storageDescription") }}</p>
          </div>
          <div class="storageToolbar">
            <input ref="storageFileInput" type="file" accept=".json,application/json" hidden @change="importStorage" />
            <el-button :icon="IconFileUpload" :loading="importingStorage" :disabled="storageBusy" @click="storageFileInput?.click()">{{ t("common.import") }}</el-button>
            <el-button :icon="IconDownload" :disabled="storageBusy" @click="exportStorage">{{ t("common.export") }}</el-button>
            <el-button :icon="IconRefresh" :disabled="storageBusy" @click="loadStorage">{{ t("common.refreshList") }}</el-button>
          </div>
        </div>
        <el-text v-if="storageError" type="danger" role="alert">{{ getErrorDisplay(storageError) }}</el-text>
        <el-text v-else-if="storageMessage" type="success" role="status">{{ storageMessage }}</el-text>
        <div v-for="entry in storageEntries" :key="entry.key" class="storageItem">
          <div class="storageHeader">
            <span class="storageKey">{{ entry.key || t('developer.emptyKey') }}</span>
            <div class="storageActions">
              <el-button :icon="IconEdit" text :disabled="storageBusy" :aria-label="t('developer.editStorageLabel', { key: entry.key })" @click="editStorage(entry)">{{ t("common.edit") }}</el-button>
              <el-popconfirm :title="t('developer.storageDeleteConfirm')" :confirmButtonText="t('common.delete')" :cancelButtonText="t('common.cancel')" @confirm="writeStorage(entry, null)">
                <template #reference>
                  <el-button :icon="IconTrash" type="danger" text :disabled="storageBusy" :aria-label="t('developer.deleteStorageLabel', { key: entry.key })">{{ t("common.delete") }}</el-button>
                </template>
              </el-popconfirm>
            </div>
          </div>
          <template v-if="editingKey === entry.key">
            <el-input v-model="storageValue" type="textarea" :rows="5" :disabled="storageBusy" :aria-label="t('developer.storageValueLabel', { key: entry.key })" />
            <div class="storageActions">
              <el-button :disabled="storageBusy" @click="editingKey = null">{{ t("common.cancel") }}</el-button>
              <el-button type="primary" :loading="writingStorage" :disabled="storageBusy" @click="writeStorage(entry, storageValue)">{{ t("common.save") }}</el-button>
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
      <h3>{{ t("developer.unlockTitle") }}</h3>
      <p>{{ t("developer.unlockWarning") }}</p>
      <el-button type="primary" @click="confirmDeveloper">{{ t("common.continue") }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from "../../i18n";
import { computed, defineAsyncComponent, ref, shallowRef, watch } from "vue";
import { useRouter } from "vue-router";
import { useDeveloperStore } from "@/stores/developer";
import { useHelloStore } from "@/stores/hello";
import { saveSettings, settings } from "@/stores/settings";
import saveFile from "@/lib/saveFile";
import { installPluginFile } from "../../installPluginFile";
import { ElMessage } from "element-plus";
import axios from "axios";
import { IconCode, IconTerminal2, IconFileUpload, IconDownload, IconRefresh, IconEdit, IconTrash } from "@tabler/icons-vue";
import { createDisplayError, getErrorDisplay } from "@toonflow/i18n";

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
const updateUrlError = shallowRef<Error>();

async function saveCustomUpdateUrl() {
  if (savingUpdateUrl.value) return;
  const url = customUpdateUrl.value.trim();
  updateUrlError.value = undefined;
  try {
    if (url && !URL.canParse(url)) throw createDisplayError("请输入有效的 HTTP(S) 目录地址", () => t("developer.invalidUpdateUrl"));
    if (url) {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password || parsed.search || parsed.hash || url.length > 2048)
        throw createDisplayError("请输入不含账号、查询参数或锚点的 HTTP(S) 目录地址", () => t("developer.invalidUpdateUrlDetails"));
    }
    savingUpdateUrl.value = true;
    await saveSettings(current => ({
      desktopUpdateCustomUrl: url,
      ...(url || current.desktopUpdateSource !== "custom" ? {} : { desktopUpdateSource: "official" }),
    }));
    customUpdateUrl.value = url;
    ElMessage.success(t("developer.updateSourceSaved"));
  } catch (error) {
    updateUrlError.value = axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message
      ? new Error(error.response.data.message)
      : error instanceof Error ? error : createDisplayError("保存更新源失败", () => t("developer.updateSourceSaveFailed"));
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
    ElMessage.error(t("developer.resetGuideFailed"));
  } finally {
    resettingHello.value = false;
  }
}

function confirmDeveloper() {
  developerStore.developerConfirmed = true;
  loadStorage();
}

const installTypes = computed(() => ({
  node: { label: t("plugins.node"), accept: ".umd.js", example: "imageNode.umd.js", description: t("developer.nodePackageDescription") },
  skill: { label: t("plugins.skill"), accept: ".zip,.md,.tar,.tar.gz,.tgz", example: "skill.zip", description: t("developer.skillPackageDescription") },
  tool: { label: t("plugins.tool"), accept: ".tool.js", example: "mediaGeneration.tool.js", description: t("developer.toolPackageDescription") },
}));
const installType = ref<"node" | "skill" | "tool">("node");
const selectedInstaller = computed(() => installTypes.value[installType.value]);
const fileInput = ref<HTMLInputElement>();
const pluginUrl = ref("");
const forceInstall = ref(false);
const installing = ref<"file" | "url" | "">("");
const installError = shallowRef<Error>();
const installedName = ref("");
watch(installType, () => {
  pluginUrl.value = "";
  installError.value = undefined;
  installedName.value = "";
});
const storageEntries = ref<{ key: string; value: string }[]>([]);
const storageError = shallowRef<Error>();
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
    // ACT: localStorage 没有事务，写入失败时恢复本次编辑的项。
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
  storageError.value = undefined;
  storageMessage.value = "";
  try {
    const data: unknown = JSON.parse((await file.text()).replace(/^\uFEFF/, ""));
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.values(data).some(value => typeof value !== "string")) {
      throw createDisplayError("请选择键值均为字符串的 JSON 对象，例如 {\"key\":\"value\"}。", () => t("developer.invalidStorageJson"));
    }
    const entries = Object.entries(data) as [string, string][];
    saveStorage(entries);
    loadStorage();
    storageMessage.value = t("developer.storageImported", { count: entries.length });
  } catch (err) {
    storageError.value = err instanceof Error ? err : createDisplayError("导入缓存失败", () => t("developer.storageImportFailed"));
  } finally {
    importingStorage.value = false;
  }
}

async function exportStorage() {
  storageError.value = undefined;
  storageMessage.value = "";
  try {
    const data = readStorage();
    await saveFile(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }), "toonflowLocalStorage.json");
  } catch (err) {
    storageError.value = err instanceof Error ? err : createDisplayError("导出缓存失败", () => t("developer.storageExportFailed"));
  }
}

function loadStorage() {
  storageError.value = undefined;
  storageMessage.value = "";
  try {
    storageEntries.value = Object.entries(readStorage()).sort(([left], [right]) => left.localeCompare(right)).map(([key, value]) => ({ key, value }));
    editingKey.value = null;
  } catch (err) {
    storageError.value = err instanceof Error ? err : createDisplayError("读取缓存失败", () => t("developer.storageReadFailed"));
  }
}

function editStorage(entry: { key: string; value: string }) {
  editingKey.value = entry.key;
  storageValue.value = entry.value;
}

function writeStorage(entry: { key: string; value: string }, value: string | null) {
  if (storageBusy.value) return;
  writingStorage.value = true;
  storageError.value = undefined;
  storageMessage.value = "";
  try {
    if (readStorage()[entry.key] !== entry.value) throw createDisplayError("这条数据已发生变化，请刷新列表后重试。", () => t("developer.storageChanged"));
    saveStorage([[entry.key, value]]);
    if (editingKey.value === entry.key) editingKey.value = null;
    loadStorage();
    storageMessage.value = t("developer.storageSaved");
  } catch (err) {
    storageError.value = err instanceof Error ? err : createDisplayError("更新缓存失败", () => t("developer.storageUpdateFailed"));
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
  installError.value = undefined;
  installedName.value = "";
  try {
    if (file) {
      installedName.value = await installPluginFile(type, file, forceInstall.value);
    } else {
      const { data } = await axios.post(`/api/${type}s/install`, { url: pluginUrl.value.trim(), force: forceInstall.value }, { headers: { "x-toonflow-workspace": "1" } });
      if (data.code !== 200) throw data.message ? new Error(data.message) : createDisplayError("安装失败", () => t("developer.installFailed"));
      installedName.value = data.data.name;
      window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type, name: data.data.name } }));
    }
  } catch (err) {
    installError.value = axios.isAxiosError<{ message?: string }>(err)
      ? err.response?.data.message ? new Error(err.response.data.message) : createDisplayError("安装失败，请检查网络后重试", () => t("developer.installNetworkFailed"))
      : err instanceof Error ? err : createDisplayError("安装失败", () => t("developer.installFailed"));
  } finally {
    installing.value = "";
  }
}

const isDesktop = new URLSearchParams(window.location.search).get("desktop") === "1";
const opening = ref(false);
const requestError = shallowRef<Error>();

async function openDevTools() {
  if (!isDesktop || opening.value) return;
  opening.value = true;
  requestError.value = undefined;
  try {
    const response = await fetch("/api/desktop/devtools", { method: "POST", headers: { "x-toonflow-desktop": "1" } });
    if (!response.ok) {
      const message = (await response.json()).message;
      throw message ? new Error(message) : createDisplayError("打开开发者工具失败，请重试。", () => t("developer.openDevtoolsFailed"));
    }
  } catch (error) {
    requestError.value = error instanceof Error ? error : createDisplayError("打开开发者工具失败，请重试。", () => t("developer.openDevtoolsFailed"));
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
