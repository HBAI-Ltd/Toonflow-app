import type { NodeTypesObject } from "@vue-flow/core";
import { shallowReactive, type Component } from "vue";
import * as vueRuntime from "vue";
import * as vueFlowRuntime from "@vue-flow/core";
import * as elementPlusRuntime from "element-plus";
// ACT: 节点拿到的是完整 element-plus 运行时，宿主却只按需加载自己用到的组件样式（如滑块样式只在打开界面设置后才有），
// 节点里的滑块、开关等会不可见；这里随共享运行时加载完整样式。宿主覆盖写在 html:root 下，优先级更高，不受加载顺序影响。
import "element-plus/theme-chalk/index.css";
import * as threeRuntime from "three";
import * as modelIcons from "@toonflow/model-icons";
import { runAgentLoop } from "@earendil-works/pi-agent-core";
import { createAssistantMessageEventStream } from "@earendil-works/pi-ai";
import { createTranslator } from "@toonflow/i18n/vue";

type NodeComponent = Exclude<NodeTypesObject[string], string>;

const components = shallowReactive(new Map<string, NodeComponent>());
const requests = new Map<string, Promise<NodeComponent>>();
// 节点 UMD 脚本从这里取宿主共享的运行时；画布与白模预演都经此加载节点。
(window as typeof window & { toonflowNodeHost?: unknown }).toonflowNodeHost = {
  vue: vueRuntime, vueFlow: vueFlowRuntime, elementPlus: elementPlusRuntime, three: threeRuntime, modelIcons, ai: { runAgentLoop, createAssistantMessageEventStream },
  i18n: { createTranslator },
};

export function getNodeIcon(type?: string): Component | undefined {
  if (!type?.startsWith("remote-")) return;
  return (components.get(type.slice(7)) as { icon?: Component } | undefined)?.icon;
}

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
  const request = (async () => {
    const scriptUrl = force ? `${url}${url.includes("?") ? "&" : "?"}reload=${crypto.randomUUID()}` : url;
    const response = await fetch(scriptUrl);
    if (!response.ok) throw new Error(`节点脚本加载失败（HTTP ${response.status}）`);
    const code = await response.text();
    if (code.includes("toonflowTiptapHost")) await import("@/lib/tiptapHost");
    return new Promise<NodeComponent>((resolve, reject) => {
      delete nodeWindow.toonflowNodes?.[name];
      const script = document.createElement("script");
      script.src = scriptUrl;
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
    });
  })().then(component => {
    components.set(name, component);
    return component;
  }).finally(() => requests.delete(name));
  requests.set(name, request);
  return request;
}
