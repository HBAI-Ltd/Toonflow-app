import { nextTick, watch, type Ref } from "vue";
import { useVueFlow, type XYPosition } from "@vue-flow/core";
import { useNodeEvent, useNodeToolsContext, validateConnection } from "@toonflow/nodes-scaffold/runtime";
import { canvasSchemas, type CanvasContext, type CanvasToolCall } from "@toonflow/tool-canvas/runtime";
import { arrangeCanvas } from "./arrangeCanvas";
import { canvasEdgeSummary, canvasNodeSummary, createCanvasQueries, isCanvasRead } from "./canvasQueries";

export function useCanvasTools(options: {
  availableNodes: Ref<{ type: string; label: string }[]>;
  flushSave(): Promise<void>;
  menu(): {
    getCanvases(): { id: string; name: string }[];
    addCanvas(name?: string, signal?: AbortSignal): Promise<string>;
    switchCanvas(canvasId: string, signal?: AbortSignal): Promise<void>;
    renameCanvas(canvasId: string, name: string, signal?: AbortSignal): Promise<void>;
  };
  getCanvasBinding(): { id: string; signal: AbortSignal };
  resolveCanvasContext?(id: string): CanvasContext | undefined;
}) {
  const flow = useVueFlow();
  const getNodeTools = useNodeToolsContext();
  let nodeRevision = 0;
  let edgeRevision = 0;
  // 只跟踪列表结构，不深读节点 data；批量更新合并到同一 tick。
  watch(flow.nodes, () => nodeRevision++, { deep: 1 });
  watch(flow.edges, () => edgeRevision++, { deep: 1 });
  const readCanvas = createCanvasQueries({
    nodes: () => flow.nodes.value,
    edges: () => flow.edges.value,
    findNode: flow.findNode,
    viewport: () => flow.viewport.value,
    selectedCount: () => flow.getSelectedNodes.value.length,
    nodeRevision: () => nodeRevision,
    edgeRevision: () => edgeRevision,
    canvases: () => options.menu().getCanvases(),
    nodeTypes: () => options.availableNodes.value,
    nodeTools: getNodeTools,
  });

  function findNode(nodeId: string) {
    const node = flow.findNode(nodeId);
    if (!node) throw new Error(`节点不存在：${nodeId}`);
    return node;
  }

  function nodeInfo(nodeId: string) {
    const node = findNode(nodeId);
    return { node: { ...canvasNodeSummary(node), position: { x: node.position.x, y: node.position.y } } };
  }

  function nodePosition(position: XYPosition) {
    if (!flow.snapToGrid.value) return position;
    const [x, y] = flow.snapGrid.value;
    return { x: Math.round(position.x / x) * x, y: Math.round(position.y / y) * y };
  }

  return (id: string, canvasSignal: AbortSignal, workspaceSignal: AbortSignal): CanvasContext => {
    let redirected: CanvasContext | undefined;
    return {
      get id() { return redirected?.id ?? options.getCanvasBinding().id; },
      // 函数定义通过 getNodeTools 按需发现，初始化消息不携带节点清单。
      tools: [],
      getNodeLabel(nodeId) {
        if (redirected) return redirected.getNodeLabel?.(nodeId);
        const node = flow.findNode(nodeId);
        const label = node?.data.label ?? node?.label;
        return typeof label === "string" && label.trim() ? label : undefined;
      },
      async call(request, signal) {
        if (redirected) return redirected.call(request, signal);
        canvasSignal.throwIfAborted();
        id = options.getCanvasBinding().id;
        const changesCanvas = request.name === "addCanvas" || request.name === "switchCanvas" || request.name === "renameCanvas";
        const callSignal = AbortSignal.any([workspaceSignal, ...(changesCanvas ? [] : [canvasSignal]), AbortSignal.timeout(120000), ...(signal ? [signal] : [])]);
        callSignal.throwIfAborted();
        let cancel = () => {};
        try {
          return await Promise.race([
            Promise.resolve().then(async () => {
              canvasSignal.throwIfAborted();
              let result = await execute(request, callSignal, id);
              callSignal.throwIfAborted();
              if (changesCanvas) {
                const nextContext = options.resolveCanvasContext?.(String(result));
                if (nextContext) {
                  redirected = nextContext;
                  return nextContext.call({ name: "getCanvas", args: {} }, callSignal);
                }
                const binding = options.getCanvasBinding();
                if (binding.id !== result) throw new Error("画布已再次切换，请重新发送消息");
                binding.signal.throwIfAborted();
                id = binding.id;
                canvasSignal = binding.signal;
                result = await execute({ name: "getCanvas", args: {} }, callSignal, id);
              }
              if (!isCanvasRead(request.name) && request.name !== "selectNodes") await options.flushSave();
              callSignal.throwIfAborted();
              canvasSignal.throwIfAborted();
              return result;
            }),
            new Promise<never>((_resolve, reject) => {
              cancel = () => reject(callSignal.reason);
              callSignal.addEventListener("abort", cancel, { once: true });
            }),
          ]);
        } finally {
          callSignal.removeEventListener("abort", cancel);
        }
      },
      };
  };

  async function execute(request: CanvasToolCall, signal: AbortSignal, canvasId: string): Promise<unknown> {
    signal.throwIfAborted();
    if (isCanvasRead(request.name)) {
      await nextTick();
      signal.throwIfAborted();
      return readCanvas(request, canvasId, signal);
    }
    switch (request.name) {
      case "addCanvas": {
        const { name } = canvasSchemas.addCanvas.parse(request.args);
        return options.menu().addCanvas(name, signal);
      }
      case "switchCanvas": {
        const { canvasId: targetId } = canvasSchemas.switchCanvas.parse(request.args);
        await options.menu().switchCanvas(targetId, signal);
        return targetId;
      }
      case "renameCanvas": {
        const { canvasId: targetId = canvasId, name } = canvasSchemas.renameCanvas.parse(request.args);
        const nextName = name.trim();
        const renamedId = options.menu().getCanvases().find(canvas => canvas.id === targetId)?.name === nextName
          ? targetId : `${targetId.slice(0, targetId.lastIndexOf("/") + 1)}${nextName}.json`;
        await options.menu().renameCanvas(targetId, nextName, signal);
        return targetId === canvasId ? renamedId : canvasId;
      }
      case "addNode": {
        const args = canvasSchemas.addNode.parse(request.args);
        const type = options.availableNodes.value.find(node => node.type === args.type);
        if (!type) throw new Error("节点类型未启用或尚未加载，请先查询 getCanvas");
        const id = crypto.randomUUID();
        flow.addNodes({ id, type: type.type, position: nodePosition(args.position), data: { label: args.label ?? type.label } });
        await nextTick();
        signal.throwIfAborted();
        return nodeInfo(id);
      }
      case "deleteNodes": {
        const { nodeIds } = canvasSchemas.deleteNodes.parse(request.args);
        const idSet = new Set(nodeIds);
        const nodes = nodeIds.map(findNode);
        nodes.forEach(node => {
          if (node.deletable === false) throw new Error(`节点不允许删除：${node.id}`);
          if (flow.getNodes.value.some(item => item.parentNode === node.id && !idSet.has(item.id))) {
            throw new Error(`请先删除此节点的子节点：${node.id}`);
          }
          if (flow.getConnectedEdges(node.id).some(edge => edge.deletable === false)) throw new Error(`节点存在不可删除的连接：${node.id}`);
        });
        for (const node of nodes) {
          await useNodeEvent(node.id, flow).emit("delete");
          signal.throwIfAborted();
          if (flow.findNode(node.id) !== node) throw new Error("节点已被替换，请重新查询画布");
        }
        const edgeIds = flow.getEdges.value.filter(edge => idSet.has(edge.source) || idSet.has(edge.target)).map(edge => edge.id);
        flow.removeNodes(nodeIds, true);
        await nextTick();
        return { nodeIds, removedEdgeIds: edgeIds.slice(0, 100), removedEdgeCount: edgeIds.length, truncated: edgeIds.length > 100 };
      }
      case "moveNodes": {
        const { moves } = canvasSchemas.moveNodes.parse(request.args);
        moves.forEach(move => { if (findNode(move.nodeId).draggable === false) throw new Error(`节点不允许移动：${move.nodeId}`); });
        moves.forEach(move => flow.updateNode(move.nodeId, { position: nodePosition(move.position) }));
        await nextTick();
        return { nodes: moves.map(move => nodeInfo(move.nodeId)) };
      }
      case "renameNodes": {
        const { renames } = canvasSchemas.renameNodes.parse(request.args);
        renames.forEach(rename => findNode(rename.nodeId));
        renames.forEach(rename => flow.updateNodeData(rename.nodeId, { label: rename.label }));
        await nextTick();
        return { nodes: renames.map(rename => nodeInfo(rename.nodeId)) };
      }
      case "connectNodes": {
        const { connections } = canvasSchemas.connectNodes.parse(request.args);
        const edges = [...flow.getEdges.value];
        const entries = connections.map(connection => {
          const sourceNode = findNode(connection.source);
          const targetNode = findNode(connection.target);
          if (!flow.nodesConnectable.value || sourceNode.connectable === false || targetNode.connectable === false) {
            throw new Error(`节点不允许连接：${connection.source} -> ${connection.target}`);
          }
          const existing = edges.find(edge => edge.source === connection.source && edge.target === connection.target
            && edge.sourceHandle === connection.sourceHandle && edge.targetHandle === connection.targetHandle);
          if (existing) return { id: existing.id, connection, isNew: false };
          if (!validateConnection(connection, { sourceNode, targetNode, nodes: flow.getNodes.value, edges })) {
            throw new Error(`连接无效：${connection.source} -> ${connection.target}，请检查端口方向、数据类型以及目标节点的连接规则`);
          }
          const id = crypto.randomUUID();
          // ACT: 候选边只参与本批校验，全部通过后再一次提交画布。
          edges.push({
            ...connection, id, type: "default", selected: false, data: {}, events: {}, sourceNode, targetNode,
            sourceX: sourceNode.computedPosition.x, sourceY: sourceNode.computedPosition.y,
            targetX: targetNode.computedPosition.x, targetY: targetNode.computedPosition.y,
          });
          return { id, connection, isNew: true };
        });
        flow.addEdges(entries.filter(entry => entry.isNew).map(entry => ({ id: entry.id, ...entry.connection })));
        await nextTick();
        return { edges: entries.map(entry => canvasEdgeSummary(flow.findEdge(entry.id)!)) };
      }
      case "deleteEdges": {
        const { edgeIds } = canvasSchemas.deleteEdges.parse(request.args);
        edgeIds.forEach(edgeId => {
          const edge = flow.findEdge(edgeId);
          if (!edge) throw new Error(`连线不存在：${edgeId}`);
          if (edge.deletable === false) throw new Error(`连线不允许删除：${edgeId}`);
        });
        const nodeIds = [...new Set(edgeIds.flatMap(id => {
          const edge = flow.findEdge(id)!;
          return [edge.source, edge.target];
        }))];
        flow.removeEdges(edgeIds);
        await nextTick();
        return { edgeIds, nodes: nodeIds.map(id => nodeInfo(id)) };
      }
      case "selectNodes": {
        const { nodeIds } = canvasSchemas.selectNodes.parse(request.args);
        const nodes = nodeIds.map(findNode);
        if (nodes.some(node => node.selectable === false)) throw new Error("节点不允许选择");
        flow.removeSelectedElements();
        flow.addSelectedNodes(nodes);
        await nextTick();
        const selected = flow.getSelectedNodes.value;
        return { selectedNodeIds: selected.slice(0, 100).map(node => node.id), selectedCount: selected.length, truncated: selected.length > 100 };
      }
      case "arrangeCanvas": {
        canvasSchemas.arrangeCanvas.parse(request.args);
        const { arrangedNodeIds, viewport } = await arrangeCanvas(flow, signal);
        return { arrangedNodeIds: arrangedNodeIds.slice(0, 100), arrangedCount: arrangedNodeIds.length, truncated: arrangedNodeIds.length > 100, viewport };
      }
      case "fitCanvas": {
        const { nodeIds } = canvasSchemas.fitCanvas.parse(request.args);
        nodeIds?.forEach(findNode);
        await nextTick();
        signal.throwIfAborted();
        flow.updateNodeInternals(nodeIds ?? flow.getNodes.value.map(node => node.id));
        const fitted = await flow.fitView({ nodes: nodeIds, padding: 0.2, duration: 0 });
        signal.throwIfAborted();
        return { fitted, nodeIds: nodeIds?.slice(0, 100), nodeCount: nodeIds?.length ?? flow.nodes.value.length, truncated: (nodeIds?.length ?? 0) > 100, viewport: { ...flow.viewport.value } };
      }
      case "nodeTools": {
        const args = canvasSchemas.nodeTools.parse(request.args);
        return getNodeTools().call(args, signal);
      }
      default: throw new Error(`未知画布操作：${request.name}`);
    }
  }
}
