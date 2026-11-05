import { lstat, mkdir, readFile } from "@toonflow/file";
import { join } from "node:path";
import { SessionManager } from "@earendil-works/pi-coding-agent";
import type { FileEntry } from "@earendil-works/pi-coding-agent";
import { writeWorkspaceFile } from "@/utils/workspace/files";
import { assertStorageDirectory } from "./storage";
import { sanitizeHostingError } from "./policy";

const maximumHistoryBytes = 20 * 1024 * 1024;
type HostedHistory = {
  dirty: boolean;
  pending?: Promise<void>;
  failure?: unknown;
  schedule(): void;
};
const histories = new WeakMap<SessionManager, HostedHistory>();

export async function createHostedHistory(options: {
  cwd: string; directory: string; path?: string; parentSession?: string;
  onFailure?: (cause: unknown) => void;
}) {
  const { cwd, directory, onFailure } = options;
  await assertStorageDirectory(directory);
  let entries: FileEntry[] | undefined;
  if (options.path) {
    await assertStorageDirectory(options.path);
    const info = await lstat(options.path);
    if (!info.isFile()) throw Object.assign(new Error("会话必须是普通文件"), { status: 400 });
    if (info.size > maximumHistoryBytes) throw Object.assign(new Error("对话历史不能超过 20 MiB"), { status: 413 });
    const content = await readFile(options.path, "utf8");
    if (Buffer.byteLength(content) > maximumHistoryBytes) throw Object.assign(new Error("对话历史不能超过 20 MiB"), { status: 413 });
    try {
      entries = content.split("\n").filter(line => line.trim()).map(line => JSON.parse(line));
      const header = entries[0];
      if (!header || header.type !== "session" || typeof header.id !== "string"
        || (header.version !== undefined && typeof header.version !== "number")) throw new Error();
      if (entries.slice(1).some(entry => entry?.type === "session")) throw new Error();
    } catch {
      throw Object.assign(new Error("会话文件损坏，无法继续对话"), { status: 400 });
    }
  }
  let history: SessionManager;
  try {
    // SDK 在内存模式中执行旧版本迁移；结构校验随后检查迁移后的追加树，不会触发原生文件写入。
    history = SessionManager.inMemory(cwd, options.parentSession ? { parentSession: options.parentSession } : undefined, entries);
    const ids = new Set<string>();
    for (const entry of history.getEntries()) {
      if (!entry || typeof entry.type !== "string" || typeof entry.id !== "string" || !entry.id
        || ids.has(entry.id) || (entry.parentId !== null && !ids.has(entry.parentId))) throw new Error();
      ids.add(entry.id);
    }
  } catch {
    throw Object.assign(new Error("会话文件损坏，无法继续对话"), { status: 400 });
  }
  const header = history.getHeader()!;
  const path = options.path ?? join(directory, `${header.timestamp.replace(/[:.]/g, "-")}_${history.getSessionId()}.jsonl`);
  history.getSessionFile = () => path;
  history.getSessionDir = () => directory;
  let exclusive = !options.path;
  const state: HostedHistory = {
    dirty: true,
    schedule() {
      if (state.pending || state.failure) return;
      // ACT: 只保留正在保存的一个快照和 dirty 标记，后续追加合并为下一次最新快照。
      state.pending = Promise.resolve().then(async () => {
        while (state.dirty) {
          state.dirty = false;
          const lines: string[] = [];
          let bytes = 0;
          for (const entry of [history.getHeader(), ...history.getEntries()]) {
            const snapshot = entry?.type === "message" && entry.message.role === "assistant" && entry.message.errorMessage
              ? { ...entry, message: { ...entry.message, errorMessage: sanitizeHostingError(entry.message.errorMessage) } } : entry;
            const line = `${JSON.stringify(snapshot)}\n`;
            bytes += Buffer.byteLength(line);
            if (bytes > maximumHistoryBytes) throw Object.assign(new Error("对话历史不能超过 20 MiB"), { status: 413 });
            lines.push(line);
          }
          await assertStorageDirectory(directory);
          await mkdir(directory, { recursive: true, mode: 0o700 });
          await writeWorkspaceFile(path, lines.join(""), exclusive);
          exclusive = false;
        }
      }).catch(cause => {
        state.failure = cause;
        onFailure?.(cause);
      }).finally(() => {
        state.pending = undefined;
        if (state.dirty && !state.failure) state.schedule();
      });
    },
  };
  histories.set(history, state);
  history._persist = () => {
    state.dirty = true;
    state.schedule();
  };
  return history;
}

export async function flushHostedHistory(history: SessionManager) {
  const state = histories.get(history);
  if (!state) return;
  while (state.dirty || state.pending) {
    if (state.failure) throw state.failure;
    if (state.dirty) state.schedule();
    await state.pending;
  }
  if (state.failure) throw state.failure;
}
