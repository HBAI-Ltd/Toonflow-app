<template>
  <el-button :icon="IconHistory" :disabled="disabled" text title="历史记录" aria-label="历史记录" @click.stop="visible = true">历史记录</el-button>
  <el-dialog v-model="visible" :title="`${mediaType === 'image' ? '图片' : '视频'}历史记录`" width="min(760px, calc(100vw - 32px))" appendToBody destroyOnClose>
    <div v-loading="loading" class="mediaHistory nodrag nopan nowheel" @pointerdown.stop @mousedown.stop @dblclick.stop @keydown.stop>
      <el-alert v-if="loadError" :title="loadError" type="error" :closable="false" />
      <el-empty v-else-if="!loading && !items.length" description="暂无历史记录" />
      <template v-else-if="items.length">
        <div class="historyContent">
          <div class="historyList" aria-label="历史文件">
            <button
              v-for="item in pageItems"
              :key="item.url"
              type="button"
              class="historyItem"
              :class="{ selected: selected?.url === item.url }"
              :aria-pressed="selected?.url === item.url"
              :title="item.url"
              @click="selected = item">
              <span class="fileName">{{ item.url.split('/').at(-1) }}</span>
              <span v-if="item.url === current?.url.replaceAll('\\', '/')" class="currentLabel">当前结果</span>
            </button>
          </div>
          <div class="historyPreview" v-loading="!!selected && !previewReady && !previewError" :aria-busy="preparingPreview">
            <el-alert v-if="previewError" :title="previewError" type="error" :closable="false" />
            <img v-else-if="mediaSrc && mediaType === 'image'" :src="mediaSrc" alt="历史图片预览" @load="readPreview" @error="previewFailed" />
            <video v-else-if="mediaSrc" :src="mediaSrc" controls playsinline preload="auto" aria-label="历史视频预览" @loadeddata="readPreview" @error="previewFailed" />
          </div>
        </div>
        <el-pagination v-model:currentPage="page" :pageSize="pageSize" :total="items.length" layout="prev, pager, next" hideOnSinglePage />
      </template>
    </div>
    <template #footer>
      <el-button @click="visible = false">关闭</el-button>
      <el-button type="primary" :disabled="disabled || loading || !selected || !previewUrl || !previewReady || !!previewError" @click="selectOutput">设为当前结果</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useNode } from "@vue-flow/core";
import { ElAlert, ElButton, ElDialog, ElEmpty, ElLoading, ElPagination } from "element-plus";
import { IconHistory } from "@tabler/icons-vue";
import { useNodeFiles } from "@toonflow/nodes-scaffold/workspaceFiles";
import type { NodeMediaValue } from "@toonflow/nodes-scaffold/values";
import { useMediaPreview } from "../mediaPreview";
import { getMediaMimeType } from "../mediaTypes";

const props = defineProps<{ mediaType: "image" | "video"; current?: NodeMediaValue; disabled?: boolean }>();
const emit = defineEmits<{ select: [value: NodeMediaValue] }>();
const vLoading = ElLoading.directive;
const { id } = useNode();
const files = useNodeFiles();
const visible = ref(false);
const loading = ref(false);
const loadError = ref("");
const previewReadError = ref("");
const previewReady = ref(false);
const items = ref<NodeMediaValue[]>([]);
const selected = ref<NodeMediaValue>();
const page = ref(1);
const pageSize = 20;
const pageItems = computed(() => items.value.slice((page.value - 1) * pageSize, page.value * pageSize));
const previewFile = computed(() => visible.value ? selected.value : undefined);
watch(previewFile, () => { previewReadError.value = ""; }, { flush: "sync" });
// ACT: 目录列表仅保存路径，每页显示 20 条，只读取选中文件；海量目录需服务端分页时再扩展 list。
const previewUrl = files.useFileUrl(previewFile, () => { previewReadError.value = "历史文件读取失败，文件可能已被移动或删除"; });
const { src: mediaSrc, preparing: preparingPreview, error: mediaError, handleError, handleLoaded } = useMediaPreview(previewUrl, () => props.mediaType);
const previewError = computed(() => previewReadError.value || mediaError.value);
watch([previewFile, mediaSrc], () => { previewReady.value = false; }, { flush: "sync" });

watch(() => props.disabled, disabled => { if (disabled) visible.value = false; });
watch(visible, async (open, _previous, onCleanup) => {
  let cancelled = false;
  onCleanup(() => { cancelled = true; });
  items.value = [];
  selected.value = undefined;
  loadError.value = "";
  page.value = 1;
  if (!open) return;
  loading.value = true;
  try {
    const { entries } = await files.getWorkspaceFiles().list(`assets/${id}`).catch((error: { response?: { data?: { data?: { code?: string } } } }) => {
      if (error.response?.data?.data?.code !== "ENOENT") throw error;
      return { entries: [] };
    });
    if (cancelled) return;
    const results = new Map<string, NodeMediaValue>();
    for (const entry of entries) {
      const mimeType = getMediaMimeType({ name: entry.name, type: "" });
      if (entry.type === "file" && mimeType?.startsWith(`${props.mediaType}/`)) {
        const url = entry.path.replaceAll("\\", "/");
        results.set(url, { url, mimeType });
      }
    }
    // ACT: 副本使用新 ID，但当前结果仍可能引用原节点文件；只补当前结果，不继承原目录的全部历史。
    const current = props.current && { ...props.current, url: props.current.url.replaceAll("\\", "/") };
    if (current) results.set(current.url, current);
    items.value = [...results.values()].sort((left, right) => left.url.localeCompare(right.url, "zh-CN", { numeric: true }));
    selected.value = current ?? items.value[0];
    page.value = Math.floor(Math.max(0, items.value.findIndex(item => item.url === selected.value?.url)) / pageSize) + 1;
  } catch (error) {
    if (!cancelled) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      loadError.value = message || (error instanceof Error ? error.message : "历史记录读取失败");
    }
  } finally {
    if (!cancelled) loading.value = false;
  }
});

function readPreview(event: Event) {
  previewReady.value = handleLoaded(event);
}

function previewFailed(event: Event) {
  previewReady.value = false;
  handleError(event);
}

function selectOutput() {
  if (props.disabled || loading.value || !selected.value || !previewUrl.value || !previewReady.value || previewError.value) return;
  emit("select", { ...selected.value });
  visible.value = false;
}
</script>

<style scoped lang="scss">
.mediaHistory {
  min-height: 300px;

  .historyContent {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) minmax(0, 2fr);
    gap: 16px;

    .historyList {
      height: 360px;
      overflow: auto;

      .historyItem {
        display: block;
        width: 100%;
        padding: 10px;
        border: 1px solid transparent;
        border-radius: var(--el-border-radius-base);
        background: transparent;
        color: var(--el-text-color-primary);
        font: inherit;
        text-align: left;
        cursor: pointer;

        &:hover { background: var(--el-fill-color-light); }
        &.selected { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
        &:focus-visible { outline: 2px solid var(--el-color-primary); outline-offset: -2px; }
        .fileName { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .currentLabel { color: var(--el-color-primary); font-size: 12px; }
      }
    }

    .historyPreview {
      display: grid;
      place-items: center;
      height: 360px;
      min-width: 0;
      background: var(--el-fill-color-light);
      border-radius: var(--el-border-radius-base);

      img, video { width: 100%; max-height: 360px; object-fit: contain; }
    }
  }

  .el-pagination { justify-content: center; margin-top: 16px; }
}
</style>
