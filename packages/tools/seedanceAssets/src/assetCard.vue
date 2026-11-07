<template>
  <div class="assetCard">
    <strong>官方肖像素材库</strong>
    <p v-if="tool.status === 'running'">正在处理…</p>
    <p v-else-if="tool.status === 'interrupted'">操作已停止，请核对官方状态。</p>
    <p v-else-if="tool.status === 'error'">{{ tool.result || '操作失败，请核对官方状态。' }}</p>
    <template v-else-if="result">
      <template v-if="result.action === 'startAuthentication'">
        <p><a v-if="link" :href="link" target="_blank" rel="noopener noreferrer">打开官方真人认证页面</a><span v-else-if="opening">正在准备认证链接…</span></p>
        <p v-if="openError" role="alert">{{ openError }}</p>
        <p>请由本人完成认证，然后告知助手继续查询认证结果。</p>
        <p>会话 ID：{{ result.sessionId }}；失效时间：{{ expiresAt }}</p>
      </template>
      <p v-else-if="result.action === 'finishAuthentication'">认证已完成，素材组：{{ result.groupId }}</p>
      <template v-else-if="result.action === 'listGroups' || result.action === 'listAssets'">
        <p v-if="!items.length">当前页没有素材。</p>
        <ul v-else>
          <li v-for="item in items" :key="item.id">
            {{ item.name || item.id }}（{{ item.id }}）<template v-if="item.mediaType"> · {{ item.mediaType }}</template><template v-if="item.status"> · {{ item.status }}</template><template v-if="item.errorCode"> · {{ item.errorCode }}</template>
          </li>
        </ul>
        <p v-if="result.nextToken">还有下一页，可继续查询。</p>
      </template>
      <p v-else-if="result.action === 'getAsset' && asset">
        {{ asset.name || asset.id }}（{{ asset.id }}） · {{ asset.mediaType }} · {{ asset.status }}<template v-if="asset.errorCode"> · {{ asset.errorCode }}</template>
      </p>
      <p v-else-if="result.action === 'createAsset'">素材已提交：{{ result.assetId }}；请查询官方处理状态。</p>
      <template v-else-if="result.action === 'selectAssets'">
        <p>已更新视频节点 {{ result.nodeId }} 的官方素材引用，共 {{ selectedCount }} 项。</p>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import axios from "axios";
import type { ToolCall } from "@toonflow/tools-scaffold/runtime";

const props = defineProps<{ tool: ToolCall; directory?: string }>();
type Item = { id: string; name?: string; mediaType?: string; status?: string; errorCode?: string };
type Result = { action?: string; sessionId?: string; expiresAt?: string; groupId?: string; assetId?: string; nodeId?: string; nextToken?: string; items?: Item[]; asset?: Item; assets?: Item[] };
const result = computed<Result | undefined>(() => {
  if (props.tool.status !== "success" || !props.tool.result) return;
  try { return JSON.parse(props.tool.result) as Result; } catch { return; }
});
const items = computed(() => Array.isArray(result.value?.items) ? result.value.items : []);
const asset = computed(() => result.value?.asset);
const selectedCount = computed(() => Array.isArray(result.value?.assets) ? result.value.assets.length : 0);
const expiresAt = computed(() => result.value?.expiresAt ? new Date(result.value.expiresAt).toLocaleString() : "未知");
const opening = ref(false);
const openError = ref("");
const link = ref("");

watch([() => result.value?.sessionId, () => props.directory], async ([id, directory], _previous, onCleanup) => {
  const controller = new AbortController();
  onCleanup(() => { controller.abort(); });
  link.value = "";
  opening.value = false;
  openError.value = "";
  if (!id) return;
  if (!directory) { openError.value = "请打开认证发起时的工作区"; return; }
  opening.value = true;
  try {
    const { data } = await axios.post<{ code: number; data: { url: string } }>("/api/tools/clientLink", {
      name: "seedanceAssets", id, directory,
    }, { headers: { "x-toonflow-workspace": "1" }, signal: controller.signal });
    if (controller.signal.aborted) return;
    if (data.code !== 200) throw new Error("无法获取认证链接");
    const url = new URL(data.data.url);
    if (!["https://ark.volcengine.com", "https://h5-v2.kych5.com"].includes(url.origin) || url.username || url.password) throw new Error("认证链接无效");
    link.value = url.href;
  } catch {
    if (!controller.signal.aborted) openError.value = "无法获取认证链接，会话可能已完成、过期或随服务重启失效，请核对后重新发起";
  } finally { if (!controller.signal.aborted) opening.value = false; }
}, { immediate: true });
</script>

<style scoped lang="scss">
.assetCard {
  padding: 12px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  font-size: 13px;
  overflow-wrap: anywhere;

  p { margin: 8px 0 0; }
  ul { margin: 8px 0 0; padding-left: 20px; }
  a { color: var(--el-color-primary); }
}
</style>
