<template>
  <el-dropdown ref="menu" trigger="contextmenu" virtualTriggering :virtualRef="menuAnchor" placement="bottom-start" :showArrow="false" :hideOnClick="false" popperClass="assetActionMenu" @command="handleCommand" @visibleChange="(opened: boolean) => { if (!opened) moveVisible = false; }">
    <template #dropdown>
      <el-dropdown-menu v-if="activeEntry">
        <el-dropdown-item command="move" :disabled="busy">
          <el-popover v-model:visible="moveVisible" trigger="hover" placement="right-start" :width="220" :offset="0" :showArrow="false" :showAfter="0" :hideAfter="150" appendTo=".assetActionMenu">
            <template #reference>
              <span class="moveTrigger"><span class="moveLabel">{{ t("moveTo") }}</span><icon-chevron-right :size="14" /></span>
            </template>
            <div class="moveDestinations" role="menu" :aria-label="t('moveToFolder')" @click.stop @keydown.stop>
              <el-button text :icon="IconFolderPlus" :disabled="busy" role="menuitem" @click="createMoveFolder">{{ t("newFolder") }}</el-button>
              <el-scrollbar maxHeight="260px">
                <el-button v-for="item in moveFolders" :key="item.path" text :icon="IconFolder" :disabled="busy || destinationDisabled(item.path)" role="menuitem" :title="item.label" @click="moveTo(item.path)">{{ item.label }}</el-button>
              </el-scrollbar>
            </div>
          </el-popover>
        </el-dropdown-item>
        <el-dropdown-item v-if="activeEntry.type === 'file'" command="download" divided>{{ t("download") }}</el-dropdown-item>
        <el-dropdown-item command="rename" :disabled="busy">{{ t("rename") }}</el-dropdown-item>
        <el-dropdown-item class="deleteAction" command="delete" :disabled="busy || !!activeEntry.children?.length" :title="activeEntry.children?.length ? t('deleteFolderAssetsFirst') : undefined">{{ t("delete") }}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { t } from "@/pages/i18n";
import { getErrorDisplay } from "@toonflow/i18n";
import { computed, nextTick, ref, shallowRef } from "vue";
import axios from "axios";
import saveFile from "@/lib/saveFile";
import { ElMessage, ElMessageBox, type DropdownInstance } from "element-plus";
import { IconChevronRight, IconFolder, IconFolderPlus } from "@tabler/icons-vue";

type AssetEntry = { name: string; path: string; type: "file" | "directory"; children?: AssetEntry[] };
const props = defineProps<{ entries: AssetEntry[] }>();
const emit = defineEmits<{ changed: [path?: string, target?: string] }>();
const menu = ref<DropdownInstance>();
const menuAnchor = shallowRef({ getBoundingClientRect: () => new DOMRect() });
const activeEntry = shallowRef<AssetEntry>();
const moveVisible = ref(false);
const busy = ref(false);
const parentPath = computed(() => activeEntry.value?.path.split("/").slice(0, -1).join("/") || ".");
const moveFolders = computed(() => {
  function flatten(items: AssetEntry[]): { label: string; path: string }[] {
    return items.filter(item => item.type === "directory").flatMap(item => [
      { label: item.path, path: item.path },
      ...flatten(item.children ?? []),
    ]);
  }
  return [{ label: t("assetLibraryRoot"), path: "." }, ...flatten(props.entries)];
});

function destinationDisabled(path: string) {
  const entry = activeEntry.value;
  return path === parentPath.value || (entry?.type === "directory" && (path === entry.path || path.startsWith(entry.path + "/")));
}

async function openMenu(event: MouseEvent, entry: AssetEntry) {
  menu.value?.handleClose();
  moveVisible.value = false;
  activeEntry.value = entry;
  const target = event.currentTarget as HTMLElement;
  const rect = event.type === "contextmenu" ? new DOMRect(event.clientX, event.clientY, 0, 0) : target.getBoundingClientRect();
  menuAnchor.value = { getBoundingClientRect: () => rect };
  await nextTick();
  menu.value?.handleOpen();
}

function closeMenu() {
  moveVisible.value = false;
  menu.value?.handleClose();
}

function showError(error: unknown) {
  if (error === "cancel" || error === "close") return;
  ElMessage.error(axios.isAxiosError<{ message: string }>(error) ? error.response?.data.message || error.message : getErrorDisplay(error));
}

async function relocate(entry: AssetEntry, target: string) {
  busy.value = true;
  try {
    await axios.post("/api/assets/rename", { path: entry.path, target });
    emit("changed", entry.path, target);
  } finally {
    busy.value = false;
  }
}

async function moveTo(directory: string) {
  const entry = activeEntry.value!;
  closeMenu();
  try {
    await relocate(entry, directory === "." ? entry.name : directory + "/" + entry.name);
  } catch (error) {
    showError(error);
  }
}

async function createMoveFolder() {
  const entry = activeEntry.value!;
  closeMenu();
  try {
    const { value } = await ElMessageBox.prompt(t("theNewFolderWillBe"), t("newFolder"), {
      inputValue: "新建文件夹",
      inputPattern: /^[^\\/]+$/,
      inputValidator: value => !!value?.trim() || t("enterAFolderName"),
      inputErrorMessage: t("nameCannotContainSlashes"),
      confirmButtonText: t("createAndMove"),
      cancelButtonText: t("cancel"),
    });
    const name = value.trim();
    await axios.post("/api/assets/mkdir", { path: name });
    await relocate(entry, name + "/" + entry.name);
  } catch (error) {
    showError(error);
    emit("changed");
  }
}

async function handleCommand(command: string) {
  if (command === "move") {
    moveVisible.value = true;
    return;
  }
  const entry = activeEntry.value!;
  const parent = parentPath.value;
  closeMenu();
  try {
    if (command === "download") {
      await saveFile(() => axios.get<Blob>("/api/assets/read", { params: { path: entry.path, download: true }, responseType: "blob" }).then(({ data }) => data), entry.name);
    }
    if (command === "rename") {
      const { value } = await ElMessageBox.prompt(t("name"), t("rename"), {
        inputValue: entry.name,
        inputPattern: /^[^\\/]+$/,
        inputValidator: value => !!value?.trim() || t("enterAName"),
        inputErrorMessage: t("nameCannotContainSlashes"),
        confirmButtonText: t("save"),
        cancelButtonText: t("cancel"),
      });
      await relocate(entry, parent === "." ? value.trim() : parent + "/" + value.trim());
    }
    if (command === "delete") {
      await ElMessageBox.confirm(t("deleteAssetConfirm", { name: entry.name }), t("deleteAsset"), { type: "warning", confirmButtonText: t("delete"), cancelButtonText: t("cancel") });
      busy.value = true;
      try {
        await axios.delete("/api/assets/remove", { data: { path: entry.path } });
        emit("changed", entry.path);
      } finally {
        busy.value = false;
      }
    }
  } catch (error) {
    showError(error);
  }
}

defineExpose({ openMenu });
</script>

<style lang="scss" scoped>
.moveTrigger {
  display: flex;
  align-items: center;
  width: 100%;
}

.moveLabel {
  flex: 1;
  min-width: 132px;
}

:global(.assetActionMenu .deleteAction:not(.is-disabled)) {
  color: var(--el-color-danger);
}

.moveDestinations {
  .el-button {
    display: flex;
    justify-content: flex-start;
    width: 100%;
    margin: 0;
    padding: 8px;
    font-weight: normal;

    :deep(> span) {
      display: block;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}
</style>
