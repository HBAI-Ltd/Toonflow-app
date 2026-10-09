<template>
  <component v-if="error" :is="UI.ErrorComponent" variant="image" :message="error" />
  <component v-else :is="COMPONENT_RENDERERS.image" :key="directory + image.node.url" v-bind="image" :node="resolvedNode" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import axios from "axios";
import { COMPONENT_RENDERERS, UI, useContext, type ImageNodeRendererProps } from "vue-stream-markdown";
import useWorkspaceFiles from "@/lib/workspaceFiles";

const props = defineProps<{ image: ImageNodeRendererProps; directory: string }>();
const imageUrl = ref("");
const loading = ref(false);
const error = ref("");
const remoteImage = computed(() => /^(?:https?:)?\/\//i.test(props.image.node.url));
const workspaceImage = computed(() => remoteImage.value || (!!props.image.node.url && !/^(?:[a-z][a-z\d+.-]*:|[\\/]|#)/i.test(props.image.node.url)));
const resolvedNode = computed(() => workspaceImage.value
  ? { ...props.image.node, url: imageUrl.value, loading: !!props.image.node.loading || loading.value }
  : props.image.node);
const { parsedNodes, provideContext } = useContext();
// ACT: 落盘图片按单张预览；多图切换需集中维护解析后的地址，避免重新请求原网址或相对路径。
provideContext({ parsedNodes: computed(() => workspaceImage.value ? [resolvedNode.value] : parsedNodes.value) });

watch([() => props.directory, () => props.image.node.url, () => props.image.node.loading] as const, async ([directory, url, streaming], _previous, onCleanup) => {
  imageUrl.value = "";
  loading.value = false;
  error.value = "";
  if (!workspaceImage.value || streaming) return;
  loading.value = true;
  let cancelled = false;
  let release = () => {};
  onCleanup(() => { cancelled = true; release(); });
  try {
    const files = useWorkspaceFiles(directory);
    const saved = remoteImage.value ? await files.importImage(url.startsWith("//") ? `https:${url}` : url) : undefined;
    if (cancelled) return;
    const path = saved?.path ?? decodeURIComponent(url.split(/[?#]/, 1)[0]!);
    const preview = files.acquireUrl(path, saved?.mimeType);
    release = preview.release;
    const resolvedUrl = await preview.url;
    if (!cancelled) imageUrl.value = resolvedUrl;
  } catch (cause) {
    if (!cancelled) error.value = axios.isAxiosError<{ message?: string }>(cause)
      ? cause.response?.data?.message || "图片保存或读取失败"
      : cause instanceof Error ? cause.message : "图片保存或读取失败";
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });
</script>
