import { onScopeDispose, shallowRef, watch, type WatchSource } from "vue";
import { useRouter } from "vue-router";
import type { NodeToolInfo } from "@toonflow/tools-scaffold/runtime";
import { invalidateNodeModels } from "@toonflow/nodes-scaffold/nodeAi";
import { saveSettings, settings } from "@/stores/settings";
import { useWorkspaceStore } from "@/stores/workspace";

type ControlCall = { type: "call"; callId: string; name: string; args: Record<string, unknown>; directory?: string };
type WorkspaceControl = {
  getState(): { directory: string | null; canvasId: string | null; panel: string; tools: NodeToolInfo[]; document?: unknown };
  call(request: ControlCall, signal: AbortSignal): Promise<unknown>;
  flushSave(): Promise<void>;
};
const workspaceControl = shallowRef<WorkspaceControl>();

export function registerWorkspaceControl(control: WorkspaceControl) {
  workspaceControl.value = control;
  onScopeDispose(() => { if (workspaceControl.value === control) workspaceControl.value = undefined; });
}

export function waitForControlValue<T>(read: WatchSource<T | undefined>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    let stop = () => {};
    const cancel = () => { stop(); reject(signal.reason); };
    signal.addEventListener("abort", cancel, { once: true });
    stop = watch(read, value => {
      if (value === undefined) return;
      stop();
      signal.removeEventListener("abort", cancel);
      resolve(value);
    }, { flush: "post" });
    const value = typeof read === "function" ? read() : read.value;
    if (value !== undefined) {
      stop();
      signal.removeEventListener("abort", cancel);
      resolve(value);
    }
  });
}

export function useMcpControl() {
  const router = useRouter();
  const workspaceStore = useWorkspaceStore();
  const calls = new Map<string, AbortController>();
  const readSettings = () => JSON.parse(JSON.stringify(settings.value, (key, value) =>
    /(?:api.?key|token|password|secret)$/i.test(key) && value ? "[REDACTED]" : value));
  const getState = () => ({
    directory: null, canvasId: null, panel: router.currentRoute.value.path.slice(1), tools: [] as NodeToolInfo[],
    ...workspaceControl.value?.getState(),
    projectList: workspaceStore.projectList,
  });
  watch(() => workspaceStore.project?.directory, () => {
    for (const controller of calls.values()) controller.abort(new Error("工作区已切换，本次调用已停止"));
  }, { flush: "sync" });

  watch(() => {
    const config = settings.value.mcp as { enabled?: boolean; token?: string } | undefined;
    return config?.enabled === true && config.token ? config.token : "";
  }, (token, _previous, onCleanup) => {
    if (!token) return;
    const lifetime = new AbortController();
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    onCleanup(() => {
      lifetime.abort();
      clearTimeout(reconnect);
      for (const controller of calls.values()) controller.abort(new Error("MCP 连接已关闭"));
    });

    async function connect() {
      const connectionId = crypto.randomUUID();
      const connection = new AbortController();
      const signal = AbortSignal.any([lifetime.signal, connection.signal]);
      const headers = { Authorization: `Bearer ${token}`, "x-toonflow-workspace": "1" };
      let revision = 0;
      async function post(path: "state" | "result", body: object, callSignal?: AbortSignal) {
        const response = await fetch(`/api/mcp/control/${path}`, {
          method: "POST", headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId, ...(path === "state" ? { revision: ++revision } : {}), ...body }), signal,
        });
        if (path === "result" && response.status === 404 && callSignal?.aborted) return;
        if (!response.ok) throw new Error(`MCP ${path} 请求失败（${response.status}）`);
      }
      let stopState = () => {};
      const connectionCalls = new Map<string, AbortController>();
      async function execute(request: ControlCall) {
        const controller = new AbortController();
        calls.set(request.callId, controller);
        connectionCalls.set(request.callId, controller);
        const callSignal = AbortSignal.any([signal, controller.signal, AbortSignal.timeout(120000)]);
        let result: unknown;
        let error: string | undefined;
        try {
          callSignal.throwIfAborted();
          if (request.name === "getAppState") result = getState();
          else if (request.name === "getSettings") result = readSettings();
          else if (request.name === "updateSettings") {
            const patch = request.args.patch;
            if (!patch || typeof patch !== "object" || Array.isArray(patch)) throw new Error("设置 patch 必须是对象");
            if (Object.hasOwn(patch, "mcp") || Object.hasOwn(patch, "stores")) throw new Error("MCP 不允许修改连接配置或持久化 Store");
            JSON.stringify(patch, (_key, value) => {
              if (value === "[REDACTED]") throw new Error("不能将脱敏占位符保存为设置，请填写实际值");
              return value;
            });
            await saveSettings(() => { callSignal.throwIfAborted(); return patch as Record<string, unknown>; });
            result = readSettings();
          } else if (request.name === "refreshResources") {
            const { type, name, removedProviderId } = request.args;
            if (type !== "node" && type !== "tool" && type !== "skill" && type !== "provider") throw new Error("未知资源类型");
            if (type === "provider") {
              if (typeof removedProviderId === "string" && removedProviderId) await saveSettings(current => {
                callSignal.throwIfAborted();
                const configs = current.mediaProviderConfigs;
                if (!configs || typeof configs !== "object" || Array.isArray(configs) || !Object.hasOwn(configs, removedProviderId)) return;
                const next = { ...configs } as Record<string, unknown>;
                delete next[removedProviderId];
                return { mediaProviderConfigs: next };
              });
              invalidateNodeModels("media");
            }
            window.dispatchEvent(new CustomEvent("toonflow:plugin-installed", { detail: { type, name: typeof name === "string" ? name : "" } }));
            result = { refreshed: true };
          } else if (request.name === "openProject") {
            const directory = request.args.directory;
            if (typeof directory !== "string" || !directory.trim()) throw new Error("缺少工作目录");
            await workspaceControl.value?.flushSave();
            callSignal.throwIfAborted();
            // ACT: 切换项目会取消旧画布调用；当前打开项目命令属于应用层。
            calls.delete(request.callId);
            await workspaceStore.openProject(directory, directory, callSignal);
            const openedDirectory = workspaceStore.project?.directory;
            calls.set(request.callId, controller);
            callSignal.throwIfAborted();
            await router.push("/workspace");
            await waitForControlValue(() => workspaceControl.value, callSignal);
            callSignal.throwIfAborted();
            if (router.currentRoute.value.path !== "/workspace" || workspaceStore.project?.directory !== openedDirectory) throw new Error("工作区打开已取消");
            result = getState();
          } else {
            const control = workspaceControl.value;
            if (!control) throw new Error("请先打开工作区");
            if (request.directory && request.directory !== control.getState().directory) throw new Error("工作区已切换，请重新读取应用状态");
            result = await control.call(request, callSignal);
          }
        } catch (reason) {
          error = reason instanceof Error ? reason.message : String(reason);
        }
        try {
          if (!signal.aborted) {
            await post("state", { state: getState() });
            await post("result", { callId: request.callId, ...(error ? { error } : { result: result ?? null }) }, callSignal);
          }
        } finally {
          calls.delete(request.callId);
          connectionCalls.delete(request.callId);
        }
      }
      try {
        const response = await fetch(`/api/mcp/control/events?connectionId=${encodeURIComponent(connectionId)}`, { headers, signal });
        if (!response.ok || !response.body) throw new Error(`MCP 连接失败（${response.status}）`);
        stopState = watch(() => JSON.stringify(getState()), state => {
          void post("state", { state: JSON.parse(state) }).catch(error => { if (!signal.aborted) connection.abort(error); });
        }, { immediate: true, flush: "post" });
        const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
        let pending = "";
        let data: string[] = [];
        try {
          while (true) {
            const { value, done } = await reader.read();
            signal.throwIfAborted();
            if (done) break;
            pending += value;
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            for (const rawLine of lines) {
              const line = rawLine.replace(/\r$/, "");
              if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
              if (line || !data.length) continue;
              const event = JSON.parse(data.join("\n")) as ControlCall | { type: "cancel"; callId: string };
              data = [];
              if (event.type === "cancel") connectionCalls.get(event.callId)?.abort(new Error("MCP 调用已取消"));
              else if (event.type === "call") void execute(event).catch(error => { if (!signal.aborted) connection.abort(error); });
            }
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
      } catch (error) {
        if (!signal.aborted) console.warn("MCP 控制连接已中断", error);
      } finally {
        stopState();
        connection.abort();
        if (!lifetime.signal.aborted) reconnect = setTimeout(() => void connect(), 3000);
      }
    }
    void connect();
  }, { immediate: true });
}
