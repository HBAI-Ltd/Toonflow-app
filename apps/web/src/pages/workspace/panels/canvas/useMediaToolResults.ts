import { provide, shallowReactive } from "vue";
import { isNode, type Edge, type Node, type useVueFlow } from "@vue-flow/core";
import type { MediaToolResults, MediaToolResultState } from "@toonflow/node-shared/mediaTools";

export function useMediaToolResults(flow: ReturnType<typeof useVueFlow>) {
  const pending = shallowReactive(new Map<string, MediaToolResultState>());
  const isPersistent = (element: Node | Edge) => isNode(element)
    ? !pending.has(element.id)
    : !pending.has(element.source) && !pending.has(element.target);

  function getSnapshot() {
    const snapshot = flow.toObject();
    snapshot.nodes = snapshot.nodes.filter(isPersistent);
    snapshot.edges = snapshot.edges.filter(isPersistent);
    return snapshot;
  }

  const results: MediaToolResults = {
    add(node, state) {
      const current = flow.findNode(node.id);
      if (current || pending.has(node.id)) {
        if (!current || pending.get(node.id) !== state) throw new Error("处理结果节点已变化，请重新操作");
        if (current.type === node.type) flow.updateNodeData(node.id, { label: node.data?.label });
        else flow.updateNode(node.id, { type: node.type, data: { label: node.data?.label } });
        return;
      }
      pending.set(node.id, state);
      flow.addNodes({ ...node, selectable: false, connectable: false, deletable: false });
    },
    discard(ids) {
      const removed = ids.filter(id => pending.has(id));
      for (const id of removed) {
        const node = flow.findNode(id);
        if (node) node.deletable = true;
      }
      flow.removeNodes(removed);
      for (const id of removed) pending.delete(id);
    },
    commit(nodes) {
      if (nodes.some(node => !pending.has(node.id) || !flow.findNode(node.id))) throw new Error("处理结果节点已变化，请重新操作");
      for (const node of nodes) {
        const current = flow.findNode(node.id)!;
        // 已挂载的素材插件持有这个响应式输出对象，沿用画布导出节点的写入方式。
        const outputs = Object.assign(current.data.outputs ?? {}, node.data.outputs);
        flow.updateNode(node.id, { data: { ...current.data, ...node.data, outputs },
          selectable: node.selectable, connectable: node.connectable, deletable: node.deletable });
        pending.delete(node.id);
      }
    },
  };
  provide("mediaToolResults", results);
  provide("pendingMediaToolResult", (id: string) => pending.get(id));

  function cancelAll() {
    for (const state of new Set(pending.values())) state.cancel();
    results.discard([...pending.keys()]);
  }
  return { pending, isPersistent, getSnapshot, cancelAll };
}
