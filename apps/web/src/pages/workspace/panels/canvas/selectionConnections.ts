import type { Connection, GraphNode, useVueFlow } from "@vue-flow/core";
import { isTypeCompatible, validateConnection, type NodeHandle } from "@toonflow/nodes-scaffold/connection";
import { useNodeInputs } from "@toonflow/nodes-scaffold/nodeInputs";

export function getSelectionConnections(
  sources: GraphNode[],
  target: GraphNode,
  flow: ReturnType<typeof useVueFlow>,
  targetHandleId?: string,
): Connection[] | undefined {
  if (!sources.length || flow.findNode(target.id) !== target || target.connectable === false) return;
  const targets = (target.data.handles as NodeHandle[] | undefined)
    ?.filter(handle => handle.type === "target" && (targetHandleId === undefined || handle.id === targetHandleId)) ?? [];
  if (!targets.length) return;
  const existingBySource = Map.groupBy(useNodeInputs(flow).getTargetEdges(target.id), edge => edge.source);
  const choices: { source: GraphNode; candidates: Connection[] }[] = [];
  for (const source of new Set(sources)) {
    if (flow.findNode(source.id) !== source || source.id === target.id || source.connectable === false) return;
    const candidates = ((source.data.handles as NodeHandle[] | undefined) ?? [])
      .filter(handle => handle.type === "source")
      .flatMap(handle => targets.filter(targetHandle => isTypeCompatible(handle.dataType, targetHandle.dataType))
        .map(targetHandle => ({ source: source.id, sourceHandle: handle.id, target: target.id, targetHandle: targetHandle.id })));
    if (!candidates.length) return;
    const existing = existingBySource.get(source.id);
    if (!existing || !candidates.some(connection => existing.some(edge => edge.sourceHandle === connection.sourceHandle && edge.targetHandle === connection.targetHandle))) {
      choices.push({ source, candidates });
    }
  }

  const connections: Connection[] = [];
  if (!choices.length) return connections;
  const nextChoice = choices.map(() => 0);
  const pendingEdges = [...flow.getEdges.value];
  // ACT: 端口规则可检查任意候选边，须按原序回溯；多解时最坏仍为组合搜索，显式游标可处理大选区。
  while (connections.length < choices.length) {
    const index = connections.length;
    const { source, candidates } = choices[index]!;
    const connection = candidates[nextChoice[index]!];
    if (!connection) {
      if (!index) return;
      nextChoice[index] = 0;
      connections.pop();
      pendingEdges.pop();
      continue;
    }
    nextChoice[index] = nextChoice[index]! + 1;
    if (!validateConnection(connection, { sourceNode: source, targetNode: target, nodes: flow.getNodes.value, edges: pendingEdges })) continue;
    connections.push(connection);
    if (connections.length === choices.length) break;
    pendingEdges.push({
      ...connection, id: crypto.randomUUID(), type: "default", selected: false, data: {}, events: {},
      sourceNode: source, targetNode: target,
      sourceX: source.computedPosition.x, sourceY: source.computedPosition.y,
      targetX: target.computedPosition.x, targetY: target.computedPosition.y,
    });
  }
  return connections;
}
