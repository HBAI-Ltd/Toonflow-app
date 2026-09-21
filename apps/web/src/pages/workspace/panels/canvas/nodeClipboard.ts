import type { Node } from "@vue-flow/core";
import { isNodeOutput } from "@toonflow/nodes-scaffold/values";
import { writeClipboardText } from "@/lib/clipboard";

export const nodeClipboardCommand = /^toonflow:paste-node:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

type ClipboardNode = { type: string; data: Record<string, unknown> };
type ClipboardEntry = { command: string; directory: string; node: ClipboardNode };

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

export async function copyNodeToClipboard(node: Pick<Node, "type" | "data">, directory: string) {
  if (!node.type) throw new Error("节点类型无效");
  if (!directory) throw new Error("请先打开项目");
  const command = `toonflow:paste-node:${crypto.randomUUID()}`;
  const snapshot: ClipboardNode = { type: node.type, data: JSON.parse(JSON.stringify(node.data ?? {})) };
  await accessClipboard({ command, directory, node: snapshot });
  await writeClipboardText(command);
}

export async function readClipboardNode(command: string, directory: string) {
  if (!nodeClipboardCommand.test(command)) return;
  const entry = await accessClipboard();
  if (!entry || entry.command !== command) throw new Error("节点剪贴数据已失效，请重新复制");
  const node = entry.node;
  if (!node || typeof node.type !== "string" || !node.type || !node.data || typeof node.data !== "object" || Array.isArray(node.data)) {
    throw new Error("节点剪贴数据格式错误，请重新复制");
  }
  const hasWorkspaceFile = Object.values(node.data.outputs ?? {}).some(output => isNodeOutput(output)
    && typeof output.value === "object" && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(output.value.url));
  if (hasWorkspaceFile && entry.directory !== directory) {
    throw new Error(entry.directory ? "此节点引用工作区文件，不能跨项目粘贴" : "节点剪贴数据缺少工作目录，请重新复制");
  }
  return node;
}
