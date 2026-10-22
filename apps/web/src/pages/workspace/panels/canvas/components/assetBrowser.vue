<template>
  <div class="assetBrowser" role="region" aria-label="素材库">
    <aside class="browserSidebar" aria-label="素材目录">
      <button class="allAssets" :class="{ active: folder === '.' }" type="button" :disabled="navigationLocked" @click="navigateTo('.')">
        <icon-layout-grid :size="19" aria-hidden="true" />
        <span>全部素材</span>
        <span class="assetCount">{{ allFiles.length }}</span>
      </button>
      <div class="directoryHeading"><span>文件夹</span><span>{{ allEntries.length - allFiles.length }}</span></div>
      <el-scrollbar class="directoryScroll">
        <el-tree class="directoryTree" :data="directoryTree" nodeKey="path" :props="{ label: 'name' }" :icon="IconChevronRight" :currentNodeKey="folder === '.' ? undefined : folder" :expandOnClickNode="false" defaultExpandAll highlightCurrent emptyText="" @nodeClick="selectDirectory">
          <template #default="{ data, node }">
            <span class="directoryEntry" :title="data.name" :aria-disabled="navigationLocked" @contextmenu.prevent.stop="emit('menu', $event, data.source)">
              <component :is="node.expanded && !node.isLeaf ? IconFolderOpen : IconFolder" :size="17" aria-hidden="true" />
              <span>{{ data.name }}</span>
            </span>
          </template>
        </el-tree>
      </el-scrollbar>
    </aside>

    <section class="browserMain">
      <header class="browserHeader">
        <nav class="breadcrumb" aria-label="当前目录">
          <button type="button" :disabled="navigationLocked" @click="navigateTo('.')">素材库</button>
          <template v-for="part in breadcrumb" :key="part.path">
            <icon-chevron-right :size="13" aria-hidden="true" />
            <button type="button" :disabled="navigationLocked" :aria-current="part.path === folder ? 'page' : undefined" @click="navigateTo(part.path)">{{ part.name }}</button>
          </template>
        </nav>
        <div class="headingRow">
          <div class="directoryTitle">
            <div class="titleLine">
              <h2>{{ currentDirectory?.name ?? '全部素材' }}</h2>
              <el-button v-if="currentDirectory" class="directoryMore" text :icon="IconDots" :aria-label="'更多 ' + currentDirectory.name" title="目录操作" @click="emit('menu', $event, currentDirectory)" />
            </div>
            <p>{{ scopeFiles.length }} 个素材<span v-if="scopeDirectories.length"> · {{ scopeDirectories.length }} 个文件夹</span></p>
          </div>
          <div class="headerActions">
            <el-input v-model="searchQuery" class="searchInput" :prefixIcon="IconSearch" :placeholder="folder === '.' ? '搜索全部素材' : '搜索当前文件夹'" aria-label="搜索素材" clearable @keydown.esc.stop="searchQuery = ''" />
            <el-button class="createButton" :icon="IconFolderPlus" :disabled="newFolderParent !== undefined || loading" @click="emit('startFolder')">新建文件夹</el-button>
            <el-button class="exportButton" :icon="IconDownload" :loading="exporting" :disabled="!scopeEntries.length || loading || exporting" @click="emit('export')">导出</el-button>
          </div>
        </div>
        <div class="filterRow" role="group" aria-label="素材类型">
          <button v-for="item in filters" :key="item.value" class="filterButton" :class="{ active: selectedKind === item.value }" type="button" :aria-pressed="selectedKind === item.value" @click="selectedKind = item.value">
            {{ item.label }}<span>{{ item.count }}</span>
          </button>
        </div>
      </header>

      <form v-if="newFolderParent !== undefined" class="newFolderRow" @submit.prevent="emit('saveFolder')">
        <icon-folder-plus :size="20" aria-hidden="true" />
        <el-input ref="folderInput" v-model="newFolderName" class="folderNameInput" aria-label="新文件夹名称" :disabled="folderSaving" @keydown.esc.prevent.stop="emit('cancelFolder')" />
        <el-button type="primary" nativeType="submit" :loading="folderSaving" :disabled="!newFolderName.trim()">创建</el-button>
        <el-button text :disabled="folderSaving" @click="emit('cancelFolder')">取消</el-button>
      </form>

      <el-scrollbar v-loading="loading" class="assetScroll" aria-label="素材列表">
        <div v-if="displayEntries.length" class="assetGrid">
          <article v-for="entry in displayEntries" :key="entry.path" class="assetCard" :draggable="entry.type === 'file'" @dragstart="emit('drag', $event, entry)" @contextmenu.prevent.stop="emit('menu', $event, entry)">
            <component :is="entry.type === 'directory' || mediaKind(entry) ? 'button' : 'div'" class="assetOpen" :type="entry.type === 'directory' || mediaKind(entry) ? 'button' : undefined" :disabled="entry.type === 'directory' && navigationLocked" :aria-label="entry.type === 'directory' ? '打开文件夹 ' + entry.name : mediaKind(entry) ? '预览素材 ' + entry.name : undefined" @click="openEntry(entry)">
              <span class="assetVisual" :class="entry.type === 'directory' ? 'folderVisual' : mediaKind(entry) + 'Visual'">
                <el-image v-if="mediaKind(entry) === 'image'" class="assetImage" :src="assetUrl(entry.path)" fit="cover" loading="lazy" draggable="false">
                  <template #error><span class="imageError"><icon-photo :size="38" aria-hidden="true" /></span></template>
                </el-image>
                <icon-folder v-else-if="entry.type === 'directory'" :size="58" stroke="1.25" aria-hidden="true" />
                <template v-else-if="mediaKind(entry) === 'video'"><mentionThumbnail class="assetVideo" :thumbnail="{ url: entry.path, mimeType: mentionAssetType(entry.path).mimeType }" globalAsset><icon-video class="mediaBackdrop" :size="76" stroke="1" aria-hidden="true" /></mentionThumbnail><span class="playButton"><icon-player-play :size="22" fill="currentColor" aria-hidden="true" /></span></template>
                <icon-music v-else-if="mediaKind(entry) === 'audio'" :size="52" stroke="1.25" aria-hidden="true" />
                <icon-file v-else :size="52" stroke="1.25" aria-hidden="true" />
                <span v-if="mediaKind(entry)" class="mediaBadge">{{ typeLabel(entry) }}</span>
              </span>
              <span class="assetName" :title="entry.name">{{ entry.name }}</span>
            </component>
            <div class="cardFooter">
              <span class="assetDetails" :title="entry.path">{{ entry.type === 'directory' ? `${entry.children?.length ?? 0} 个项目` : folder === '.' && entry.path.includes('/') ? entry.path.slice(0, entry.path.lastIndexOf('/')) : typeLabel(entry) }}</span>
              <el-button class="moreButton" text :icon="IconDots" :aria-label="'更多 ' + entry.name" title="更多操作" @click="emit('menu', $event, entry)" />
            </div>
          </article>
        </div>
        <div v-else-if="!loading" class="emptyState">
          <icon-search v-if="searchQuery.trim()" :size="40" stroke="1.25" aria-hidden="true" />
          <icon-folder v-else :size="44" stroke="1.25" aria-hidden="true" />
          <span>{{ searchQuery.trim() ? '没有找到匹配的素材' : '暂无素材' }}</span>
        </div>
      </el-scrollbar>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import type { InputInstance } from "element-plus";
import { IconChevronRight, IconDots, IconFile, IconFolder, IconFolderOpen, IconFolderPlus, IconLayoutGrid, IconMusic, IconPhoto, IconPlayerPlay, IconSearch, IconVideo , IconDownload} from "@tabler/icons-vue";
import { mentionAssetType } from "@toonflow/server/agent/mentionSources";
import mentionThumbnail from "@/components/agent/mentionThumbnail.vue";

type AssetEntry = { name: string; path: string; type: "file" | "directory"; children?: AssetEntry[]; draft?: boolean };
type MediaKind = "image" | "audio" | "video";
type DirectoryEntry = { name: string; path: string; children: DirectoryEntry[]; source: AssetEntry };

const props = defineProps<{
  entries: AssetEntry[];
  loading?: boolean;
  newFolderParent?: string;
  folderSaving?: boolean;
  exporting?: boolean;
  mediaKind: (entry: AssetEntry) => MediaKind | undefined;
  assetUrl: (path: string) => string;
}>();
const folder = defineModel<string>("folder", { default: "." });
const searchQuery = defineModel<string>("searchQuery", { default: "" });
const newFolderName = defineModel<string>("newFolderName", { default: "" });
const emit = defineEmits<{
  startFolder: [];
  saveFolder: [];
  cancelFolder: [];
  preview: [entry: AssetEntry];
  export: [];
  menu: [event: MouseEvent, entry: AssetEntry];
  drag: [event: DragEvent, entry: AssetEntry];
}>();

const folderInput = ref<InputInstance>();
const selectedKind = ref<"all" | MediaKind | "other">("all");
const navigationLocked = computed(() => props.folderSaving || props.newFolderParent !== undefined);
const allEntries = computed(() => {
  const items: AssetEntry[] = [];
  function collectEntries(entries: AssetEntry[]) {
    for (const entry of entries) {
      if (entry.draft) continue;
      items.push(entry);
      if (entry.children) collectEntries(entry.children);
    }
  }
  collectEntries(props.entries);
  return items;
});
const allFiles = computed(() => allEntries.value.filter(entry => entry.type === "file"));
const currentDirectory = computed(() => allEntries.value.find(entry => entry.path === folder.value && entry.type === "directory"));
const scopeEntries = computed(() => folder.value === "." ? allFiles.value : (currentDirectory.value?.children ?? []).filter(entry => !entry.draft));
const scopeFiles = computed(() => scopeEntries.value.filter(entry => entry.type === "file"));
const scopeDirectories = computed(() => scopeEntries.value.filter(entry => entry.type === "directory"));
const directoryTree = computed(() => {
  function foldersOnly(entries: AssetEntry[]): DirectoryEntry[] {
    return entries.filter(entry => entry.type === "directory" && !entry.draft).map(entry => ({ name: entry.name, path: entry.path, children: foldersOnly(entry.children ?? []), source: entry }));
  }
  return foldersOnly(props.entries);
});
const breadcrumb = computed(() => folder.value === "." ? [] : folder.value.split("/").map((name, index, parts) => ({ name, path: parts.slice(0, index + 1).join("/") })));
const filters = computed(() => [
  { value: "all" as const, label: "全部", count: scopeFiles.value.length },
  { value: "image" as const, label: "图片", count: scopeFiles.value.filter(entry => props.mediaKind(entry) === "image").length },
  { value: "video" as const, label: "视频", count: scopeFiles.value.filter(entry => props.mediaKind(entry) === "video").length },
  { value: "audio" as const, label: "音频", count: scopeFiles.value.filter(entry => props.mediaKind(entry) === "audio").length },
  { value: "other" as const, label: "其他", count: scopeFiles.value.filter(entry => !props.mediaKind(entry)).length },
]);
const displayEntries = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase();
  return scopeEntries.value.filter(entry => {
    if (query && !entry.name.toLocaleLowerCase().includes(query)) return false;
    if (selectedKind.value === "all") return true;
    return entry.type === "file" && (props.mediaKind(entry) ?? "other") === selectedKind.value;
  }).toSorted((left, right) => Number(right.type === "directory") - Number(left.type === "directory") || left.name.localeCompare(right.name, "zh-CN", { numeric: true }));
});

function selectDirectory(entry: DirectoryEntry) {
  navigateTo(entry.path);
}

function navigateTo(path: string) {
  if (navigationLocked.value) return;
  folder.value = path;
  selectedKind.value = "all";
}

function openEntry(entry: AssetEntry) {
  if (entry.type === "directory") navigateTo(entry.path);
  else if (props.mediaKind(entry)) emit("preview", entry);
}

function typeLabel(entry: AssetEntry) {
  if (entry.type === "directory") return "文件夹";
  const kind = props.mediaKind(entry);
  return kind === "image" ? "图片" : kind === "video" ? "视频" : kind === "audio" ? "音频" : entry.name.split(".").length > 1 ? entry.name.split(".").at(-1)?.toLocaleUpperCase() + " 文件" : "文件";
}

watch(() => props.newFolderParent, async parent => {
  if (parent === undefined) return;
  await nextTick();
  folderInput.value?.select();
}, { immediate: true });

watch(allEntries, () => {
  if (folder.value !== "." && !currentDirectory.value) folder.value = ".";
});
</script>

<style scoped lang="scss">
.assetBrowser {
  display: flex;
  flex: 1;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  color: var(--el-text-color-primary);

  button:focus-visible {
    outline: 2px solid var(--el-color-primary);
    outline-offset: -2px;
  }

  .browserSidebar {
    display: flex;
    flex: 0 0 210px;
    flex-direction: column;
    min-width: 0;
    padding: 2px 12px 2px 2px;

    .allAssets {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 10px 12px;
      border: 0;
      border-radius: var(--el-border-radius-base);
      color: var(--el-text-color-regular);
      background: transparent;
      font: inherit;
      font-size: 14px;
      cursor: pointer;

      &.active {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &:hover { background: var(--el-fill-color-light); }
      &.active:hover { background: var(--el-color-primary-light-9); }

      .assetCount {
        margin-left: auto;
        font-size: 12px;
        font-variant-numeric: tabular-nums;
        opacity: 0.75;
      }
    }

    .directoryHeading {
      display: flex;
      justify-content: space-between;
      margin: 14px 12px 6px;
      color: var(--el-text-color-secondary);
      font-size: 12px;
    }

    .directoryScroll {
      flex: 1;
      min-height: 0;

      .directoryTree {
        background: transparent;
        --el-tree-node-hover-bg-color: var(--el-fill-color);

        :deep(.el-tree-node__content) {
          height: 38px;
          border-radius: var(--el-border-radius-base);
        }

        :deep(.el-tree-node.is-current > .el-tree-node__content) {
          color: var(--el-color-primary);
          background: var(--el-color-primary-light-9);
        }

        .directoryEntry {
          display: flex;
          flex: 1;
          align-items: center;
          gap: 8px;
          min-width: 0;
          padding-right: 10px;
          font-size: 13px;

          svg { flex-shrink: 0; }
          span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        }
      }
    }
  }

  .browserMain {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    min-height: 0;

    .browserHeader {
      padding: 0 20px;

      .breadcrumb {
        display: flex;
        align-items: center;
        gap: 7px;
        min-height: 20px;
        overflow-x: auto;
        color: var(--el-text-color-placeholder);
        font-size: 12px;

        svg { flex-shrink: 0; }

        button {
          flex-shrink: 0;
          max-width: 180px;
          overflow: hidden;
          padding: 2px 0;
          border: 0;
          color: var(--el-text-color-secondary);
          background: transparent;
          font: inherit;
          text-overflow: ellipsis;
          white-space: nowrap;
          cursor: pointer;

          &:hover { color: var(--el-color-primary); }
          &[aria-current="page"] { color: var(--el-text-color-primary); }
        }
      }

      .headingRow {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        margin-top: 12px;

        .directoryTitle {
          min-width: 0;

          .titleLine {
            display: flex;
            align-items: center;
            gap: 6px;

            h2 {
              overflow: hidden;
              margin: 0;
              font-size: 18px;
              font-weight: 600;
              line-height: 1.5;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .directoryMore { flex-shrink: 0; padding: 6px; }
          }

          p { margin: 5px 0 0; color: var(--el-text-color-secondary); font-size: 12px; }
        }

        .headerActions {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          gap: 12px;

          .searchInput { width: 230px; }
          .createButton { margin-left: 0; }
        }
      }

      .filterRow {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        scrollbar-width: none;
        margin-top: 20px;
        padding-bottom: 0;

        &::-webkit-scrollbar { display: none; }

        .filterButton {
          display: inline-flex;
          flex-shrink: 0;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          border: 0;
          border-radius: var(--ui-radius-large);
          color: var(--el-text-color-secondary);
          background: transparent;
          font: inherit;
          font-size: 13px;
          cursor: pointer;

          span { opacity: 0.6; font-size: 12px; font-variant-numeric: tabular-nums; }
          &:hover { color: var(--el-text-color-primary); }
          &.active { color: var(--el-text-color-primary); background: var(--el-fill-color); font-weight: 600; }
        }
      }
    }

    .newFolderRow {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      gap: 10px;
      margin: 16px 20px 0;
      padding: 12px;
      border: 1px solid var(--el-border-color-light);
      border-radius: var(--el-border-radius-base);
      background: var(--el-fill-color-light);

      > svg { flex-shrink: 0; color: var(--el-text-color-secondary); }
      .folderNameInput { max-width: 320px; }
      :deep(.el-button + .el-button) { margin-left: 0; }
    }

    .assetScroll {
      flex: 1;
      min-height: 0;

      .assetGrid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
        padding: 20px;

        .assetCard {
          min-width: 0;
          overflow: hidden;
          border: 1px solid var(--el-border-color-lighter);
          border-radius: var(--ui-radius-large);
          background: var(--el-bg-color-overlay);
          transition: border-color 0.15s;

          &:hover { border-color: var(--el-border-color); }
          &:focus-within { border-color: var(--el-color-primary-light-5); }

          .assetOpen {
            display: block;
            width: 100%;
            padding: 0;
            border: 0;
            color: inherit;
            background: transparent;
            font: inherit;
            text-align: left;
            cursor: default;

            &[type="button"] { cursor: pointer; }

            .assetVisual {
              position: relative;
              display: flex;
              align-items: center;
              justify-content: center;
              aspect-ratio: 4 / 3;
              overflow: hidden;
              color: var(--el-text-color-placeholder);
              background: var(--el-fill-color-light);

              &.folderVisual, &.videoVisual, &.audioVisual { color: var(--el-text-color-secondary); }

              .assetImage {
                width: 100%;
                height: 100%;

                .imageError { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: var(--el-text-color-placeholder); }
              }

              .assetVideo {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                border-radius: 0;

                .mediaBackdrop { opacity: 0.14; }
              }

              .playButton {
                position: absolute;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 43px;
                height: 43px;
                border: 1px solid var(--el-border-color-lighter);
                border-radius: 50%;
                background: var(--el-bg-color-overlay);

                svg { margin-left: 2px; }
              }

              .mediaBadge {
                position: absolute;
                bottom: 9px;
                left: 10px;
                padding: 3px 7px;
                border-radius: var(--ui-radius-small);
                color: var(--el-text-color-regular);
                background: color-mix(in srgb, var(--el-bg-color-overlay) 90%, transparent);
                font-size: 12px;
                line-height: 15px;
              }
            }

            .assetName {
              display: block;
              overflow: hidden;
              padding: 13px 13px 0;
              font-size: 14px;
              font-weight: 500;
              line-height: 20px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
          }

          .cardFooter {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            padding: 1px 7px 7px 13px;

            .assetDetails { min-width: 0; overflow: hidden; color: var(--el-text-color-secondary); font-size: 12px; text-overflow: ellipsis; white-space: nowrap; }
            .moreButton { flex-shrink: 0; width: 27px; height: 27px; padding: 4px; color: var(--el-text-color-secondary); }
          }
        }
      }

      .emptyState {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        min-height: 250px;
        padding: 40px 20px;
        color: var(--el-text-color-placeholder);
        font-size: 13px;
      }
    }
  }
}

@media (max-width: 1000px) {
  .assetBrowser {
    .browserSidebar { flex-basis: 180px; }
    .browserMain {
      .browserHeader {
        padding: 0 20px;
        .headingRow {
          align-items: flex-start;
          flex-direction: column;
          gap: 14px;
          .headerActions { width: 100%; .searchInput { flex: 1; width: auto; } }
        }
        .filterRow { margin-top: 18px; }
      }
      .newFolderRow { margin-right: 20px; margin-left: 20px; }
      .assetScroll .assetGrid { gap: 14px; padding: 20px; grid-template-columns: repeat(auto-fill, minmax(158px, 1fr)); }
    }
  }
}

@media (max-width: 640px) {
  .assetBrowser {
    flex-direction: column;
    .browserSidebar {
      flex: 0 0 auto;
      padding: 10px 12px;
      .allAssets { padding: 9px 10px; }
      .directoryHeading { margin: 12px 10px 6px; }
      .directoryScroll { flex: 0 1 auto; max-height: 120px; }
    }
    .browserMain {
      .browserHeader { padding: 14px 14px 0; }
      .newFolderRow { gap: 6px; margin-right: 14px; margin-left: 14px; padding: 8px; > svg { display: none; } }
      .assetScroll .assetGrid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 16px 14px; }
    }
  }
}
</style>
