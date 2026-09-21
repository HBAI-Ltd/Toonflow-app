import * as vueRuntime from "vue";
import * as elementPlusRuntime from "element-plus";
import axios from "axios";
import formCreate from "@form-create/element-ui";
import type { Component } from "vue";

type ToolRenderer = { name: string; tools: string[]; url: string };
const toolWindow = window as typeof window & {
  toonflowToolHost?: { vue: typeof vueRuntime; elementPlus: typeof elementPlusRuntime; axios: typeof axios; formCreate: typeof formCreate };
  toonflowToolViews?: Record<string, Record<string, Component>>;
};
toolWindow.toonflowToolHost = { vue: vueRuntime, elementPlus: elementPlusRuntime, axios, formCreate };
const componentLoads = new Map<string, Promise<Record<string, Component>>>();
let rendererRequest: Promise<ToolRenderer[]> | undefined;

export async function loadToolComponent(toolName: string): Promise<Component | undefined> {
  // ACT: 只合并并发查询；新卡片重新查询安装状态，组件按内容版本复用。
  rendererRequest ??= axios.get<{ code: number; data: ToolRenderer[]; message?: string }>("/api/tools/renderers")
    .then(({ data }) => {
      if (data.code !== 200 || !Array.isArray(data.data)) throw new Error(data.message || "工具界面列表无效");
      return data.data;
    }).finally(() => { rendererRequest = undefined; });
  const matches = (await rendererRequest).filter(item => Array.isArray(item?.tools) && item.tools.includes(toolName));
  if (matches.length > 1) throw new Error(`工具界面名称重复：${toolName}`);
  const renderer = matches[0];
  if (!renderer) return;
  if (!/^[a-z][a-zA-Z0-9]*$/.test(renderer.name) ||
    !new RegExp(`^/api/tools/client\\?name=${renderer.name}&version=[a-f0-9]{64}$`).test(renderer.url)) {
    throw new Error("工具界面地址无效");
  }
  let pending = componentLoads.get(renderer.url);
  if (!pending) {
    pending = new Promise<Record<string, Component>>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = renderer.url;
      script.onload = () => {
        script.remove();
        const components = toolWindow.toonflowToolViews?.[renderer.name];
        if (!components || typeof components !== "object") reject(new Error(`工具包未导出界面：${renderer.name}`));
        else resolve(components);
      };
      script.onerror = () => { script.remove(); reject(new Error("工具界面脚本加载失败")); };
      document.head.append(script);
    }).catch(error => { componentLoads.delete(renderer.url); throw error; });
    componentLoads.set(renderer.url, pending);
  }
  const components = await pending;
  const component = Object.hasOwn(components, toolName) ? components[toolName] : undefined;
  if (!component || (typeof component !== "object" && typeof component !== "function")) {
    throw new Error(`工具包未导出 ${toolName} 组件`);
  }
  return vueRuntime.markRaw(component);
}
