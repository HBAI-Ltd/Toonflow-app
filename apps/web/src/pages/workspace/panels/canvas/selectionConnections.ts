import type { Connection, GraphEdge, GraphNode } from "@vue-flow/core";
import { isTypeCompatible, validateConnection, type NodeHandle } from "@toonflow/nodes-scaffold/connection";

export function getSelectionConnections(
  sources: GraphNode[],
  target: GraphNode,
  nodes: GraphNode[],
  edges: GraphEdge[],
  targetHandleId?: string,
): Connection[] | undefined {
  if (!sources.length || !nodes.includes(target) || target.connectable === false
    || sources.some(source => !nodes.includes(source) || source.id === target.id || source.connectable === false)) return;
  const targets = (target.data.handles as NodeHandle[] | undefined)
    ?.filter(handle => handle.type === "target" && (targetHandleId === undefined || handle.id === targetHandleId)) ?? [];
  const pendingEdges = [...edges];
  const connections: Connection[] = [];

  // ACT: 少量节点端口用回溯避免贪心误配；组合数很大时再改用约束匹配。
  function match(index: number): boolean {
    if (index === sources.length) return true;
    const source = sources[index]!;
    const candidates = ((source.data.handles as NodeHandle[] | undefined) ?? [])
      .filter(handle => handle.type === "source")
      .flatMap(handle => targets.filter(targetHandle => isTypeCompatible(handle.dataType, targetHandle.dataType))
        .map(targetHandle => ({ source: source.id, sourceHandle: handle.id, target: target.id, targetHandle: targetHandle.id })));
    if (candidates.some(connection => pendingEdges.some(edge => edge.source === connection.source && edge.target === connection.target
      && edge.sourceHandle === connection.sourceHandle && edge.targetHandle === connection.targetHandle))) return match(index + 1);
    for (const connection of candidates) {
      if (!validateConnection(connection, { sourceNode: source, targetNode: target, nodes, edges: pendingEdges })) continue;
      connections.push(connection);
      pendingEdges.push({
        ...connection, id: crypto.randomUUID(), type: "default", selected: false, data: {}, events: {},
        sourceNode: source, targetNode: target,
        sourceX: source.computedPosition.x, sourceY: source.computedPosition.y,
        targetX: target.computedPosition.x, targetY: target.computedPosition.y,
      });
      if (match(index + 1)) return true;
      connections.pop();
      pendingEdges.pop();
    }
    return false;
  }

  return match(0) ? connections : undefined;
}
