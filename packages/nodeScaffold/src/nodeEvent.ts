import { onScopeDispose, watch } from "vue";
import { useNodeId, useVueFlow } from "@vue-flow/core";
import type { ValidConnectionFunc } from "@vue-flow/core";
import { useNodeInputs } from "./nodeInputs";
import type { NodeInputValue, NodeOutput } from "./values";

export type NodeEventCallbacks = {
  delete: () => void | Promise<void>;
  save: (reason?: "reload") => void | Promise<void>;
  copy: () => Record<string, unknown> | Promise<Record<string, unknown>>;
  canConnect: ValidConnectionFunc;
  [name: `input:${string}`]: (values: NodeInputValue[]) => void;
  [name: `output:${string}`]: (output: NodeOutput | undefined) => void;
};
type NodeEventListeners = {
  [name in "delete" | "save" | "copy" | "canConnect"]: Set<NodeEventCallbacks[name]>;
};

// 挂在共享画布实例上，让独立 UMD 共用注册表；不会进入画布 JSON。
const nodeEventsKey = Symbol.for("toonflow.nodeEvents");

export function useNodeEvent(nodeId = useNodeId(), canvas = useVueFlow()) {
  if (!nodeId) throw new Error("请在节点组件中使用 useNodeEvent()，或传入节点 ID");
  const { getSourceValue, getTargetValues } = useNodeInputs(canvas);
  const flow = canvas as ReturnType<typeof useVueFlow> & {
    [nodeEventsKey]?: Map<string, NodeEventListeners>;
  };
  const registry = flow[nodeEventsKey] ?? new Map<string, NodeEventListeners>();
  if (!flow[nodeEventsKey]) Object.defineProperty(flow, nodeEventsKey, { value: registry });

  function on<name extends keyof NodeEventCallbacks>(name: name, callback: NodeEventCallbacks[name]) {
    if (name.startsWith("input:")) {
      return watch(
        () => getTargetValues(nodeId, name.slice(6)),
        values => (callback as NodeEventCallbacks[`input:${string}`])(values),
        { deep: true, immediate: true },
      );
    }
    if (name.startsWith("output:")) {
      return watch(
        () => getSourceValue(nodeId, name.slice(7)),
        output => (callback as NodeEventCallbacks[`output:${string}`])(output),
        { deep: true, immediate: true },
      );
    }
    if (name !== "delete" && name !== "save" && name !== "copy" && name !== "canConnect") throw new Error(`未知节点事件：${name}`);
    let events = registry.get(nodeId);
    if (!events) {
      events = { delete: new Set(), save: new Set(), copy: new Set(), canConnect: new Set() };
      registry.set(nodeId, events);
    }
    const listeners = events[name as "delete" | "save" | "copy" | "canConnect"] as Set<NodeEventCallbacks[name]>;
    listeners.add(callback);
    const off = () => {
      if (listeners.delete(callback) && !events.delete.size && !events.save.size && !events.copy.size && !events.canConnect.size) registry.delete(nodeId);
    };
    onScopeDispose(off);
    return off;
  }

  function emit(name: "delete"): Promise<void>;
  function emit(name: "save", reason?: "reload"): Promise<void>;
  function emit(name: "copy"): Promise<Record<string, unknown>>;
  function emit(name: "canConnect", ...args: Parameters<ValidConnectionFunc>): boolean;
  function emit(...args: ["delete"] | ["save", "reload"?] | ["copy"] | ["canConnect", ...Parameters<ValidConnectionFunc>]) {
    const events = registry.get(nodeId);
    if (args[0] === "canConnect") {
      return [...events?.canConnect ?? []].every(callback => callback(args[1], args[2]) === true);
    }
    if (args[0] === "copy") {
      return (async () => {
        const node = canvas.findNode(nodeId);
        const data: Record<string, unknown> = {};
        for (const callback of [...events?.copy ?? []]) Object.assign(data, await callback());
        if (canvas.findNode(nodeId) !== node || registry.get(nodeId) !== events) throw new Error("节点已切换，请重新复制");
        return data;
      })();
    }
    return (async () => {
      if (args[0] === "delete") {
        const node = canvas.findNode(nodeId);
        // 删除前完成已有文件写入，保证立即撤销时能读回最新内容。
        for (const callback of [...events?.save ?? []]) await callback();
        if (canvas.findNode(nodeId) !== node || registry.get(nodeId) !== events) throw new Error("节点已切换，请重新操作");
      }
      for (const callback of [...events?.[args[0]] ?? []]) {
        if (args[0] === "save" && args[1]) await callback(args[1]);
        else await callback();
      }
    })();
  }

  return { on, emit };
}
