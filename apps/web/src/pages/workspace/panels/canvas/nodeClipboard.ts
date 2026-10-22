import type { Edge, GraphEdge, GraphNode, Node } from "@vue-flow/core";
import { isNodeOutput } from "@toonflow/nodes-scaffold/values";
import { writeClipboardText } from "@/lib/clipboard";

export const nodeClipboardCommand = /^toonflow:paste-node:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type ClipboardNode = { type: string; data: Record<string, unknown> };
type ClipboardEntry = { command: string; directory: string; node?: ClipboardNode; nodes?: Node[]; edges?: Edge[] };

async function openClipboardDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("toonflow.nodeClipboard", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("nodes");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function accessClipboard(entry?: ClipboardEntry) {
  const database = await openClipboardDatabase();
  try {
    return await new Promise<ClipboardEntry | undefined>((resolve, reject) => {
      const transaction = database.transaction("nodes", entry ? "readwrite" : "readonly");
      const store = transaction.objectStore("nodes");
      // ACT: 只保留最近一次快照；旧命令失效，不累计复制历史。
      const request = entry ? store.put(entry, "latest") : store.get("latest");
      transaction.oncomplete = () => resolve(entry ?? request.result);
      transaction.onabort = () => reject(transaction.error ?? new Error("节点剪贴数据读写失败"));
    });
  } finally {
    database.close();
  }
}

export function copyNodeToClipboard(node: Pick<Node, "type" | "data" | "style">, directory: string) {
  return copyNodesToClipboard([{ ...node, id: crypto.randomUUID(), position: { x: 0, y: 0 } }], [], directory);
}

export async function copyNodesToClipboard(nodes: Node[], edges: Edge[], directory: string) {
  if (!directory) throw new Error("请先打开项目");
  if (!nodes.length || nodes.some(node => !node.type)) throw new Error("节点类型无效");
  const command = `toonflow:paste-node:${crypto.randomUUID()}`;
  const ids = new Set(nodes.map(node => node.id));
  // ACT: 与画布序列化一样移除运行态字段，保留分组、尺寸及节点自定义持久配置。
  const snapshot = JSON.parse(JSON.stringify({
    nodes: nodes.map(node => {
      const { computedPosition, handleBounds, selected, dimensions, isParent, resizing, dragging, events, initialized, ...saved } = node as GraphNode & { initialized?: boolean };
      return { ...saved, data: saved.data ?? {} };
    }),
    edges: edges.filter(edge => ids.has(edge.source) && ids.has(edge.target)).map(edge => {
      const { selected, sourceNode, targetNode, sourceX, sourceY, targetX, targetY, events, ...saved } = edge as GraphEdge;
      return saved;
    }),
  })) as { nodes: Node[]; edges: Edge[] };
  await accessClipboard({ command, directory, ...snapshot });
  await writeClipboardText(command);
}

export async function readClipboardNodes(command: string, directory: string) {
  if (!nodeClipboardCommand.test(command)) return;
  const entry = await accessClipboard();
  if (!entry || entry.command !== command) throw new Error("节点剪贴数据已失效，请重新复制");
  const nodes = entry.nodes ?? (entry.node ? [{ ...entry.node, id: "clipboardNode", position: { x: 0, y: 0 } }] : undefined);
  const edges = entry.edges ?? [];
  if (!Array.isArray(nodes) || !nodes.length || !Array.isArray(edges) || nodes.some(node => !node
    || typeof node.id !== "string" || !node.id || typeof node.type !== "string" || !node.type
    || !node.data || typeof node.data !== "object" || Array.isArray(node.data)
    || !node.position || !Number.isFinite(node.position.x) || !Number.isFinite(node.position.y)
    || (node.parentNode !== undefined && (typeof node.parentNode !== "string" || node.parentNode === node.id)))) {
    throw new Error("节点剪贴数据格式错误，请重新复制");
  }
  const ids = new Set(nodes.map(node => node.id));
  if (ids.size !== nodes.length || nodes.some(node => node.parentNode !== undefined && !ids.has(node.parentNode))
    || edges.some(edge => !edge || typeof edge.id !== "string" || !edge.id || !ids.has(edge.source) || !ids.has(edge.target)
      || (edge.sourceHandle != null && typeof edge.sourceHandle !== "string")
      || (edge.targetHandle != null && typeof edge.targetHandle !== "string"))
    || new Set(edges.map(edge => edge.id)).size !== edges.length) {
    throw new Error("节点剪贴数据格式错误，请重新复制");
  }
  const parents = new Map(nodes.map(node => [node.id, node.parentNode]));
  const checked = new Set<string>();
  for (const node of nodes) {
    const path = new Set<string>();
    let id: string | undefined = node.id;
    while (id && !checked.has(id)) {
      if (path.has(id)) throw new Error("节点剪贴数据格式错误，请重新复制");
      path.add(id);
      id = parents.get(id);
    }
    path.forEach(id => checked.add(id));
  }
  const hasWorkspaceFile = nodes.some(node => Object.values(node.data.outputs ?? {}).some(output => isNodeOutput(output)
    && typeof output.value === "object" && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(output.value.url)));
  if (hasWorkspaceFile && entry.directory !== directory) {
    throw new Error(entry.directory ? "此节点引用工作区文件，不能跨项目粘贴" : "节点剪贴数据缺少工作目录，请重新复制");
  }
  return { nodes, edges };
}
