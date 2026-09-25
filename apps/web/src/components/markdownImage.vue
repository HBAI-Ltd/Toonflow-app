<template>
  <component v-if="failed" :is="UI.ErrorComponent" variant="image" />
  <component v-else :is="COMPONENT_RENDERERS.image" :key="directory + image.node.url" v-bind="image" :node="resolvedNode" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { COMPONENT_RENDERERS, UI, useContext, type ImageNodeRendererProps } from "vue-stream-markdown";
import useWorkspaceFiles from "@/lib/workspaceFiles";

const props = defineProps<{ image: ImageNodeRendererProps; directory: string }>();
const imageUrl = ref("");
const loading = ref(false);
const failed = ref(false);
const workspaceImage = computed(() => !!props.image.node.url && !/^(?:[a-z][a-z\d+.-]*:|[\\/]|#)/i.test(props.image.node.url));
const resolvedNode = computed(() => workspaceImage.value
  ? { ...props.image.node, url: imageUrl.value, loading: !!props.image.node.loading || loading.value }
  : props.image.node);
const { parsedNodes, provideContext } = useContext();
// ACT: 工作区图片按单张预览；多图切换需集中维护解析后的地址，避免直接请求原始相对路径。
provideContext({ parsedNodes: computed(() => workspaceImage.value ? [resolvedNode.value] : parsedNodes.value) });

watch(() => [props.directory, props.image.node.url, props.image.node.loading] as const, async ([directory, url, streaming], _previous, onCleanup) => {
  imageUrl.value = "";
  loading.value = false;
  failed.value = false;
  if (!workspaceImage.value || streaming) return;
  loading.value = true;
  let cancelled = false;
  let release = () => {};
  onCleanup(() => { cancelled = true; release(); });
  try {
    const path = decodeURIComponent(url.split(/[?#]/, 1)[0]!);
    const preview = useWorkspaceFiles(directory).acquireUrl(path);
    release = preview.release;
    const resolvedUrl = await preview.url;
    if (!cancelled) imageUrl.value = resolvedUrl;
  } catch {
    if (!cancelled) failed.value = true;
  } finally {
    if (!cancelled) loading.value = false;
  }
}, { immediate: true });
</script>
