import { inject, onScopeDispose, ref, watch } from "vue";
import { useNode, useVueFlow, type Node } from "@vue-flow/core";
import { ElMessage } from "element-plus";
import { uploadNodeFile, useNodeFiles } from "@toonflow/nodes-scaffold/runtime";
import { showNodeError } from "@toonflow/node-shared/showNodeError";
import type { PanoramaCapture } from "./imagePanorama";

export function usePanoramaCapture(source: () => string) {
  const { node } = useNode();
  const { addNodes, addEdges, removeNodes, findNode, getNodes, nodeTypes } = useVueFlow();
  const files = useNodeFiles();
  const getCanvas = inject<(() => { id: string } | undefined) | undefined>("canvas", undefined);
  const getDirectory = inject<(() => string) | undefined>("workspaceDirectory", undefined);
  const batchHistory = inject<(action: () => Promise<void>) => Promise<void>>("batchCanvasHistory", action => action());
  const saving = ref(false);
  let operation: AbortController | undefined;
  let disposed = false;

  watch([source, () => getCanvas?.()?.id, () => {
    try { return getDirectory?.(); } catch { return undefined; }
  }], () => operation?.abort(), { flush: "sync" });
  onScopeDispose(() => { disposed = true; operation?.abort(); });

  async function saveCapture(payload: PanoramaCapture) {
    if (saving.value || disposed) return;
    const controller = operation = new AbortController();
    const pendingIds: string[] = [];
    const createdNodes: Node[] = [];
    let workspace: ReturnType<typeof files.getWorkspaceFiles> | undefined;
    let committed = false;
    saving.value = true;
    try {
      if (![1, 4, 12].includes(payload.count) || !Number.isInteger(payload.columns) || payload.columns < 1 || payload.columns > payload.count
        || ![1, payload.count].includes(payload.images.length) || payload.images.some(image => !Number.isSafeInteger(image.width) || image.width < 1
          || !Number.isSafeInteger(image.height) || image.height < 1 || !image.blob.size || image.blob.type !== "image/png")) {
        throw new Error("截图内容无效，请重新截图");
      }
      if (!source() || findNode(node.id) !== node) throw new Error("原图片节点已变化，请重新打开全景预览");
      if (!nodeTypes?.value?.["remote-imageNode"]) throw new Error("请先启用图片节点插件");
      const grouped = payload.images.length > 1;
      if (grouped && !nodeTypes?.value?.canvasGroup) throw new Error("当前画布不支持分组");
      workspace = files.getWorkspaceFiles();
      for (const image of payload.images) {
        controller.signal.throwIfAborted();
        const id = crypto.randomUUID();
        pendingIds.push(id);
        const path = await uploadNodeFile(workspace, id, new File([image.blob], "panorama.png", { type: "image/png" }));
        controller.signal.throwIfAborted();
        createdNodes.push({
          id, type: "remote-imageNode", position: { x: 0, y: 0 },
          data: { label: `${node.data.label || "图片"} · ${image.label}`, outputs: { image: { dataType: "IMAGE", value: { url: path, mimeType: "image/png" } } } },
        });
      }
      if (findNode(node.id) !== node || !nodeTypes?.value?.["remote-imageNode"] || (grouped && !nodeTypes?.value?.canvasGroup)) {
        throw new Error("画布节点已变化，请重新截图");
      }
      const columns = grouped ? payload.columns : 1;
      const rows = Math.ceil(createdNodes.length / columns);
      const nodeWidth = Math.max(...payload.images.map(image => 240 * image.width / image.height + 18));
      // ACT: 图片节点预览高 240，预留 300 高含标题；最多 12 张，按整体矩形向下避让已有节点。
      const nodeHeight = 300;
      const paddingX = grouped ? 24 : 0;
      const paddingTop = grouped ? 40 : 0;
      const width = columns * (nodeWidth + 40) - 40 + paddingX * 2;
      const height = rows * (nodeHeight + 40) - 40 + paddingTop + (grouped ? 24 : 0);
      const x = node.computedPosition.x + (node.dimensions.width || 320) + 80;
      let y = node.computedPosition.y;
      for (const other of [...getNodes.value].sort((left, right) => left.computedPosition.y - right.computedPosition.y)) {
        const position = other.computedPosition;
        if (position.x < x + width && position.x + (other.dimensions.width || 320) > x
          && position.y < y + height && position.y + (other.dimensions.height || 300) > y) {
          y = position.y + (other.dimensions.height || 300) + 40;
        }
      }
      const groupId = grouped ? crypto.randomUUID() : undefined;
      createdNodes.forEach((item, index) => {
        item.position = { x: paddingX + index % columns * (nodeWidth + 40) + (grouped ? 0 : x), y: paddingTop + Math.floor(index / columns) * (nodeHeight + 40) + (grouped ? 0 : y) };
        if (groupId) { item.parentNode = groupId; item.expandParent = false; }
      });
      const nodes: Node[] = groupId ? [{
        id: groupId, type: "canvasGroup", position: { x, y },
        style: { width: `${width}px`, height: `${height}px` }, connectable: false, expandParent: false,
        data: { label: `${node.data.label || "图片"} · 全景 ${payload.count} 宫格` },
      }, ...createdNodes] : createdNodes;
      await batchHistory(async () => {
        controller.signal.throwIfAborted();
        try {
          addNodes(nodes);
          addEdges(createdNodes.map(item => ({ id: crypto.randomUUID(), source: node.id, sourceHandle: "image", target: item.id, targetHandle: "in" })));
          committed = true;
        } catch (error) {
          removeNodes(nodes.map(item => item.id), true, false);
          throw error;
        }
      });
      ElMessage.success(grouped ? `已创建 ${createdNodes.length} 张截图并成组连线` : "已创建截图并连接原节点");
    } catch (error) {
      if (!controller.signal.aborted) showNodeError(error, "全景截图保存失败");
    } finally {
      if (!committed && workspace) {
        const cleanup = await Promise.allSettled(pendingIds.map(id => workspace!.remove(`assets/${id}`, true)));
        const failure = cleanup.find(result => result.status === "rejected" && result.reason?.response?.data?.data?.code !== "ENOENT");
        if (failure?.status === "rejected") showNodeError(failure.reason, "全景截图中断，临时图片清理失败");
      }
      saving.value = false;
      operation = undefined;
    }
  }

  return { saving, saveCapture };
}
