import { inject, onScopeDispose, ref } from "vue";
import { createPluginServer, type PluginServer } from "./index.ts";

export const pluginServerKey = "toonflow.pluginServer";
export type PluginServerFactory = () => PluginServer;

export function reactivePluginServer(server: PluginServer): PluginServer {
  const revision = ref(0);
  const unsubscribe = server.subscribe(() => { revision.value++; });
  return new Proxy(server, {
    get(target, key, receiver) {
      if (key === "url" || key === "status" || key === "error") void revision.value;
      if (key === "dispose") return () => { target.dispose(); unsubscribe(); };
      return Reflect.get(target, key, receiver);
    },
  });
}

export function usePluginServerFactory(): PluginServerFactory {
  return inject<PluginServerFactory>(pluginServerKey, () => reactivePluginServer(createPluginServer({
    send() { throw new Error("当前宿主未提供插件服务能力"); },
    subscribe() { return () => {}; },
  })));
}

export function usePluginServer(): PluginServer {
  const server = usePluginServerFactory()();
  onScopeDispose(() => { server.dispose(); });
  return server;
}
