import { computed, type ComputedRef } from "vue";
import { useVueFlow } from "@vue-flow/core";
import type { Connection, Node } from "@vue-flow/core";
import { isTypeCompatible, type NodeData, type NodeHandle } from "./connection";
import { isNodeOutput, type NodeInputValue, type NodeOutput } from "./values";

type Nodes = Node<NodeData>[] | ReadonlyMap<string, Node<NodeData>>;

function findNode(nodes: Nodes, id: string) {
  return Array.isArray(nodes) ? nodes.find(node => node.id === id) : nodes.get(id);
}

export function getTargetSources(targetId: string, targetHandleId: string, nodes: Nodes, edges: Connection[]) {
  const target = findNode(nodes, targetId)?.data?.handles?.find(handle => handle.type === "target" && handle.id === targetHandleId);
  if (!target) return [];

  return edges.filter(edge => edge.target === targetId && edge.targetHandle === targetHandleId).flatMap(edge => {
    const sourceNode = findNode(nodes, edge.source);
    const source = sourceNode?.data?.handles?.find(handle => handle.type === "source" && handle.id === edge.sourceHandle);
    return sourceNode && source && isTypeCompatible(source.dataType, target.dataType) ? [{ node: sourceNode, handle: source }] : [];
  });
}

function readSourceValue(node: Node<NodeData>, handle: NodeHandle): NodeOutput | undefined {
  const outputs = node.data?.outputs;
  if (!outputs) return;
  // 先读取 key，让端口首次新增输出时也能触发监听。
  const output = outputs[handle.id];
  if (output === undefined || !Object.hasOwn(outputs, handle.id)) return;
  if (!isNodeOutput(output) || !isTypeCompatible(output.dataType, handle.dataType)) {
    throw new Error(`节点 ${node.id} 的输出端口 ${handle.id} 值不符合类型声明`);
  }
  return output;
}

export function getSourceValue(sourceId: string, sourceHandleId: string, nodes: Nodes): NodeOutput | undefined {
  const node = findNode(nodes, sourceId);
  const handle = node?.data?.handles?.find(handle => handle.type === "source" && handle.id === sourceHandleId);
  return node && handle ? readSourceValue(node, handle) : undefined;
}

export function getTargetValues(targetId: string, targetHandleId: string, nodes: Nodes, edges: Connection[]): NodeInputValue[] {
  const target = findNode(nodes, targetId)?.data?.handles?.find(handle => handle.type === "target" && handle.id === targetHandleId);
  if (!target) return [];

  return getTargetSources(targetId, targetHandleId, nodes, edges).flatMap<NodeInputValue>(({ node, handle }) => {
    const output = readSourceValue(node, handle);
    if (!output) return [{ source: node.id, sourceHandle: handle.id, dataType: handle.dataType, value: undefined }];
    if (!isTypeCompatible(output.dataType, target.dataType)) return [];
    return [{ ...output, source: node.id, sourceHandle: handle.id }];
  });
}

const targetEdgesKey = Symbol.for("toonflow.targetEdges");

export function useNodeInputs(canvas = useVueFlow()) {
  const flow = canvas as typeof canvas & { [targetEdgesKey]?: ComputedRef<Map<string, Connection[]>> };
  const { nodeLookup } = canvas;
  // ACT: 按画布共享分组，保留重复边和原顺序；不依赖 VueFlow 会合并重复端点的连接索引。
  const targetEdges = flow[targetEdgesKey] ?? computed(() => Map.groupBy(canvas.getEdges.value, edge => edge.target));
  if (!flow[targetEdgesKey]) Object.defineProperty(flow, targetEdgesKey, { value: targetEdges });
  return {
    getTargetSources: (targetId: string, targetHandleId: string) => getTargetSources(targetId, targetHandleId, nodeLookup.value, targetEdges.value.get(targetId) ?? []),
    getTargetValues: (targetId: string, targetHandleId: string) => getTargetValues(targetId, targetHandleId, nodeLookup.value, targetEdges.value.get(targetId) ?? []),
    getSourceValue: (sourceId: string, sourceHandleId: string) => getSourceValue(sourceId, sourceHandleId, nodeLookup.value),
  };
}

/** @deprecated 使用 useNodeInputs；保留已发布节点源码的兼容入口。 */
export const useNodeTools = useNodeInputs;
