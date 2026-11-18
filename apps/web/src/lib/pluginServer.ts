import { createPluginServer } from "@toonflow/plugin-server";
import { pluginServerLimits, type PluginServerTransport, type ToHostMessage, type ToPluginMessage } from "@toonflow/plugin-server/protocol";
import { reactivePluginServer } from "@toonflow/plugin-server/vue";
import { locale, t } from "@toonflow/i18n/vue";
import http from "@/lib/http";

type OwnerConnection = {
  connectionId: string;
  token: string;
  controller: AbortController;
  ready: Promise<void>;
};

export function createPluginServerHost() {
  const lifetime = new AbortController();
  const listeners = new Set<(message: ToPluginMessage) => void>();
  const services = new Set<string>();
  const registering = new Set<string>();
  let connection: OwnerConnection | undefined;
  let connecting: Promise<OwnerConnection> | undefined;
  let sending = Promise.resolve();
  let queuedBytes = 0;

  function emit(message: ToPluginMessage) {
    if (message.type === "registered") { registering.delete(message.requestId); services.add(message.serviceId); }
    if (message.type === "registerFailed") registering.delete(message.requestId);
    if (message.type === "serviceClosed") services.delete(message.serviceId);
    for (const listener of [...listeners]) listener(message);
  }

  function disconnect(error: unknown, current = connection) {
    if (!current || connection !== current) return;
    connection = undefined;
    current.controller.abort(error);
    const message = error instanceof Error ? error.message : String(error);
    for (const requestId of [...registering]) emit({ type: "registerFailed", requestId, error: message });
    for (const serviceId of [...services]) emit({ type: "serviceClosed", serviceId, error: message });
  }

  async function connect() {
    lifetime.signal.throwIfAborted();
    if (connection) {
      const current = connection;
      await current.ready;
      current.controller.signal.throwIfAborted();
      return current;
    }
    if (connecting) return connecting;
    const pending = (async () => {
      const credentials = await http<{ connectionId: string; token: string }>({
        method: "POST", url: "/api/pluginServer/connect", data: {}, signal: lifetime.signal,
      });
      lifetime.signal.throwIfAborted();
      const controller = new AbortController();
      const ready = Promise.withResolvers<void>();
      const current = connection = { ...credentials, controller, ready: ready.promise };
      const signal = AbortSignal.any([lifetime.signal, controller.signal]);
      const timer = setTimeout(() => controller.abort(new Error(t`插件服务连接超时`)), pluginServerLimits.requestMs);
      const stream = async () => {
        try {
          const response = await fetch(`/api/pluginServer/events?connectionId=${encodeURIComponent(current.connectionId)}`, {
            headers: { Authorization: `Bearer ${current.token}`, "x-toonflow-workspace": "1", "Accept-Language": locale.value }, signal,
          });
          if (!response.ok || !response.body) throw new Error(t`插件服务连接失败（${response.status}）`);
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
          let pending = "";
          let data: string[] = [];
          try {
            while (true) {
              const chunk = await reader.read();
              if (chunk.done) throw new Error(t`插件服务连接已断开，请重新启动服务`);
              signal.throwIfAborted();
              pending += chunk.value;
              if (pending.length > pluginServerLimits.bodyBytes * 2) throw new Error(t`插件服务消息超过大小限制`);
              const lines = pending.split("\n");
              pending = lines.pop() ?? "";
              for (const raw of lines) {
                const line = raw.replace(/\r$/, "");
                if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
                if (line || !data.length) continue;
                const message = JSON.parse(data.join("\n"));
                data = [];
                if (message?.type === "ready") { clearTimeout(timer); ready.resolve(); }
                else emit(message as ToPluginMessage);
              }
            }
          } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
        } catch (error) { ready.reject(error); disconnect(error, current); }
        finally { clearTimeout(timer); }
      };
      void stream();
      await ready.promise;
      signal.throwIfAborted();
      return current;
    })();
    connecting = pending;
    try { return await pending; }
    finally { if (connecting === pending) connecting = undefined; }
  }

  const transport: PluginServerTransport = {
    send(message: ToHostMessage) {
      lifetime.signal.throwIfAborted();
      const target = connection;
      const bytes = new TextEncoder().encode(JSON.stringify(message)).byteLength;
      if (queuedBytes + bytes > pluginServerLimits.bodyBytes * 4) throw new Error(t`插件服务发送队列已满`);
      queuedBytes += bytes;
      const operation = sending.then(async () => {
        const current = message.type === "register" ? await connect() : message.type === "cancelRegister" ? connection : target;
        if (message.type === "cancelRegister" && !current) return;
        if (!current || current !== connection) throw new Error(t`插件服务连接已失效`);
        current.controller.signal.throwIfAborted();
        if (message.type === "register") registering.add(message.requestId);
        try {
          await http({ method: "POST", url: "/api/pluginServer/message", data: { connectionId: current.connectionId, message },
            headers: { Authorization: `Bearer ${current.token}` }, signal: AbortSignal.any([lifetime.signal, current.controller.signal]),
          });
          if (message.type === "unregister") services.delete(message.serviceId);
          if (message.type === "cancelRegister") registering.delete(message.requestId);
        } catch (error) { disconnect(error, current); throw error; }
      }).finally(() => { queuedBytes -= bytes; });
      sending = operation.catch(() => {});
      return operation;
    },
    subscribe(listener) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  };
  const pageHidden = () => disconnect(new Error(t`页面已离开，插件服务连接已关闭`));
  window.addEventListener("pagehide", pageHidden);
  return {
    createServer: () => reactivePluginServer(createPluginServer(transport, { signal: lifetime.signal })),
    dispose() {
      window.removeEventListener("pagehide", pageHidden);
      disconnect(new Error(t`创作页面已关闭`));
      lifetime.abort(new Error(t`创作页面已关闭`));
      listeners.clear();
    },
  };
}
