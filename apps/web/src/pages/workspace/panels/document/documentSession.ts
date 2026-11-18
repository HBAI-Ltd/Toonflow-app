import { markRaw, ref, shallowReactive, type Component } from "vue";
import axios from "axios";
import type { ExtContext, ExtDefinition, ExtResource } from "@toonflow/ext-scaffold/runtime";
import useWorkspaceFiles, { type TextSnapshot } from "@/lib/workspaceFiles";
import { writeClipboardText } from "@/lib/clipboard";
import { extensionConfig, saveExtensionConfig } from "./extensions";
import { t } from "@toonflow/i18n/vue";

type NodeState = { dirty: boolean; error: string; deleted: boolean };
type NodeObserver = (onState: (state: NodeState) => void) => Promise<{ release(): void; flushSave(): Promise<void> }>;
export function documentError(error: unknown) {
  return axios.isAxiosError(error) ? error.response?.data?.message || error.message : error instanceof Error ? error.message : t`文档操作失败`;
}

export function createDocumentSession(resource: ExtResource, extension: ExtDefinition, mountNode: ExtContext["mountNode"], observeNode?: NodeObserver, onDeleted?: () => void, openFile?: ExtContext["openFile"]) {
  const files = useWorkspaceFiles(resource.directory);
  let disposed = false;
  let revision = 0;
  let readController: AbortController | undefined;
  let refreshing: Promise<void> | undefined;
  let queuedRevision = -1;
  let saving = Promise.resolve();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disk: TextSnapshot | undefined;
  let nodeLease: Awaited<ReturnType<NodeObserver>> | undefined;
  const loading = ref(true);
  const extensionDisabled = ref(false);
  const locks = ref(0);
  const context = shallowReactive<Omit<ExtContext, "server">>({
    resource, files, text: "", error: "", dirty: false, active: true,
    get loading() { return loading.value || locks.value > 0 || extensionDisabled.value; },
    get config() { return extensionConfig(extension.id); },
    saveConfig: config => saveExtensionConfig(extension.id, config),
    writeClipboardText, mountNode,
    openFile: openFile ?? (async () => { throw new Error("当前宿主不支持打开链接文件"); }),
    updateText(text) {
      if (disposed || context.loading || !extension.text || context.text === text) return;
      cancelRead();
      context.text = text;
      context.dirty = true;
      context.error = "";
      revision++;
      clearTimeout(timer);
      timer = setTimeout(() => { void flushSave().catch(() => {}); }, 400);
    },
    flushSave,
  });

  function cancelRead() {
    readController?.abort();
    readController = undefined;
    refreshing = undefined;
    loading.value = false;
  }

  async function flushSave() {
    if (resource.kind === "canvasNode") {
      try { await session.ready; }
      catch (error) { if (nodeLease || context.dirty) throw error; }
      return nodeLease?.flushSave();
    }
    while (!disposed) {
      clearTimeout(timer);
      if (context.dirty && queuedRevision !== revision) {
        const currentRevision = revision;
        const text = context.text;
        queuedRevision = currentRevision;
        // ACT: 保存始终绑定打开时的目录和文件，排队期间切换 Tab 不改变写入目标。
        saving = saving.catch(() => {}).then(async () => {
          if (disposed) return;
          if (!disk) throw new Error("文件尚未读取，不能保存");
          const nextRevision = await files.writeTextSnapshot(resource.path, text, disk);
          disk = { ...disk, text, revision: nextRevision };
        }).then(() => {
          if (disposed || currentRevision !== revision) return;
          context.dirty = false;
          context.error = "";
          session.conflict = false;
        }).catch(error => {
          if (queuedRevision === currentRevision) queuedRevision = -1;
          context.error = documentError(error);
          session.conflict = axios.isAxiosError(error) && error.response?.status === 409 && error.response?.data?.data?.code === "ESTALE";
          throw error;
        });
      }
      const pending = saving;
      await pending;
      // 保存期间仍可继续输入；退出工作区前必须一并落盘等待期间产生的新版本。
      if (pending === saving && !context.dirty) return;
    }
  }

  const session = shallowReactive({
    context, extension, component: undefined as Component | undefined,
    closing: false, handleId: "", conflict: false, extensionChanged: false,
    get extensionDisabled() { return extensionDisabled.value; },
    set extensionDisabled(value: boolean) { extensionDisabled.value = value; },
    ready: Promise.resolve(),
    lock() {
      locks.value++;
      let released = false;
      return () => {
        if (released) return;
        released = true;
        locks.value--;
      };
    },
    async load() {
      if (disposed) return;
      cancelRead();
      const controller = readController = new AbortController();
      loading.value = true;
      context.error = "";
      try {
        const [module, snapshot] = await Promise.all([
          extension.load(), extension.text ? files.readTextSnapshot(resource.path, { signal: controller.signal }) : Promise.resolve(undefined),
        ]);
        if (disposed || controller.signal.aborted) return;
        disk = snapshot;
        context.text = snapshot?.text ?? "";
        if (observeNode && !nodeLease) {
          const lease = await observeNode(state => {
            if (disposed || controller.signal.aborted) return;
            context.dirty = state.dirty;
            context.error = state.error;
            if (state.deleted) onDeleted?.();
          });
          if (disposed || controller.signal.aborted) { lease.release(); return; }
          nodeLease = lease;
        }
        session.component = markRaw(module.default);
      } catch (error) {
        if (disposed || controller.signal.aborted) return;
        context.error = documentError(error);
        controller.abort();
        throw error;
      } finally {
        if (readController === controller) { readController = undefined; loading.value = false; }
      }
    },
    async reloadDisk() {
      if (!extension.text || disposed) return;
      clearTimeout(timer);
      cancelRead();
      const controller = readController = new AbortController();
      const release = session.lock();
      try {
        await saving.catch(() => {});
        if (disposed || controller.signal.aborted) return;
        saving = Promise.resolve();
        const snapshot = await files.readTextSnapshot(resource.path, { signal: controller.signal });
        if (disposed || controller.signal.aborted) return;
        disk = snapshot;
        context.text = snapshot.text;
        context.dirty = false;
        context.error = "";
        session.conflict = false;
        revision++;
        queuedRevision = -1;
      } catch (error) {
        if (disposed || controller.signal.aborted) return;
        context.error = documentError(error);
        throw error;
      } finally {
        if (readController === controller) readController = undefined;
        release();
      }
    },
    refreshDisk(): Promise<void> {
      if (!extension.text || disposed || context.loading || context.dirty) return Promise.resolve();
      if (refreshing) return refreshing;
      const currentRevision = revision;
      const controller = readController = new AbortController();
      refreshing = (async () => {
        try {
          const snapshot = await files.readTextSnapshot(resource.path, { signal: controller.signal });
          if (disposed || controller.signal.aborted || context.dirty || context.loading || currentRevision !== revision) return;
          disk = snapshot;
          context.text = snapshot.text;
          context.error = "";
        } catch (error) {
          if (!disposed && !controller.signal.aborted && currentRevision === revision) throw error;
        } finally {
          if (readController === controller) { readController = undefined; refreshing = undefined; }
        }
      })();
      return refreshing;
    },
    cancelSave() { clearTimeout(timer); disposed = true; cancelRead(); nodeLease?.release(); },
  });
  session.ready = session.load();
  void session.ready.catch(() => {});
  return session;
}

export type DocumentSession = ReturnType<typeof createDocumentSession>;
export type TabAction = "close" | "closeOthers" | "closeRight" | "closeAll" | "reopen" | "splitRight" | "splitDown" | "keepOpen";
export type EditorView = { preview: boolean; description: string; location?: ExtContext["location"] };
export type EditorParams = { session: DocumentSession; view: EditorView; close: () => Promise<void>; action: (action: TabAction) => void };
