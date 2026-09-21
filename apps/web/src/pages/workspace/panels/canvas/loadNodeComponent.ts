import type { NodeTypesObject } from "@vue-flow/core";

type NodeComponent = Exclude<NodeTypesObject[string], string>;

const components = new Map<string, NodeComponent>();
const requests = new Map<string, Promise<NodeComponent>>();

export function loadNodeComponent(name: string, url: string, force = false): Promise<NodeComponent> {
  const pending = requests.get(name);
  if (pending) return pending;
  const nodeWindow = window as typeof window & { toonflowNodes?: NodeTypesObject };
  const cached = components.get(name) ?? (Object.hasOwn(nodeWindow.toonflowNodes ?? {}, name) ? nodeWindow.toonflowNodes?.[name] : undefined);
  if (!force && cached && (typeof cached === "object" || typeof cached === "function")) {
    components.set(name, cached);
    return Promise.resolve(cached);
  }
  components.delete(name);
  // ACT: 同名节点只加载一份脚本，所有画布共享进行中的重载，避免互相清除全局导出。
  const request = new Promise<NodeComponent>((resolve, reject) => {
    delete nodeWindow.toonflowNodes?.[name];
    const script = document.createElement("script");
    script.src = force ? `${url}${url.includes("?") ? "&" : "?"}reload=${crypto.randomUUID()}` : url;
    script.onload = () => {
      script.remove();
      const component = nodeWindow.toonflowNodes?.[name];
      if (!Object.hasOwn(nodeWindow.toonflowNodes ?? {}, name) || !component || (typeof component !== "object" && typeof component !== "function")) {
        reject(new Error(`节点脚本未导出 ${name} 组件`));
        return;
      }
      resolve(component);
    };
    script.onerror = () => {
      script.remove();
      delete nodeWindow.toonflowNodes?.[name];
      reject(new Error("节点脚本加载失败"));
    };
    document.head.append(script);
  }).then(component => {
    components.set(name, component);
    return component;
  }).finally(() => requests.delete(name));
  requests.set(name, request);
  return request;
}
