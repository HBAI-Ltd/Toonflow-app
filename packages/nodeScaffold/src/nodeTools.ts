import { getCurrentScope, onScopeDispose } from "vue";
import { z } from "zod";
import { useNodeId, useVueFlow } from "@vue-flow/core";
import type { NodeToolInfo, NodeToolsContext } from "@toonflow/tools-scaffold/runtime";

export { z };
export type { NodeToolCall, NodeToolInfo, NodeToolsContext } from "@toonflow/tools-scaffold/runtime";

export interface NodeToolDefinition<Schema extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  parameters: Schema;
  execute(args: z.output<Schema>, context: { signal?: AbortSignal }): unknown | Promise<unknown>;
}

type RegisteredNodeTool = NodeToolInfo & Pick<NodeToolDefinition, "execute">;
type NodeToolsIndex = { nodes: Map<string, Map<string, RegisteredNodeTool>>; version: number };

// 共享 Vue Flow 实例上的注册表供各 UMD 访问，不进入画布 JSON。
const nodeToolsKey = Symbol.for("toonflow.nodeTools");
const nodeToolsIndexKey = Symbol.for("toonflow.nodeToolsIndex");

function getRegistry(flow: ReturnType<typeof useVueFlow>) {
  const host = flow as typeof flow & {
    [nodeToolsKey]?: Map<string, RegisteredNodeTool>;
    [nodeToolsIndexKey]?: NodeToolsIndex;
  };
  if (!host[nodeToolsKey]) Object.defineProperty(host, nodeToolsKey, { value: new Map<string, RegisteredNodeTool>() });
  const registry = host[nodeToolsKey]!;
  if (!host[nodeToolsIndexKey]) {
    const index: NodeToolsIndex = { nodes: new Map(), version: 0 };
    const add = (entry: RegisteredNodeTool) => {
      let node = index.nodes.get(entry.nodeId);
      if (!node) index.nodes.set(entry.nodeId, node = new Map());
      node.set(entry.name, entry);
    };
    const remove = (entry: RegisteredNodeTool) => {
      const node = index.nodes.get(entry.nodeId);
      if (node?.get(entry.name) !== entry) return;
      node.delete(entry.name);
      if (!node.size) index.nodes.delete(entry.nodeId);
    };
    for (const entry of registry.values()) add(entry);
    // ACT: 旧 UMD 仍写原 Map；在共享 Map 上同步索引，避免每次读取扫描全部节点函数。
    Object.defineProperties(registry, {
      set: { value(this: Map<string, RegisteredNodeTool>, key: string, entry: RegisteredNodeTool) {
        const previous = this.get(key);
        Map.prototype.set.call(this, key, entry);
        if (this === registry && previous !== entry) {
          if (previous) remove(previous);
          add(entry);
          index.version++;
        }
        return this;
      } },
      delete: { value(this: Map<string, RegisteredNodeTool>, key: string) {
        const entry = this.get(key);
        const deleted = Map.prototype.delete.call(this, key);
        if (this === registry && deleted) {
          remove(entry!);
          index.version++;
        }
        return deleted;
      } },
      clear: { value(this: Map<string, RegisteredNodeTool>) {
        const size = this.size;
        Map.prototype.clear.call(this);
        if (this === registry && size) {
          index.nodes.clear();
          index.version++;
        }
      } },
    });
    Object.defineProperty(host, nodeToolsIndexKey, { value: index });
  }
  return { registry, index: host[nodeToolsIndexKey]! };
}

export const nodeTools = {
  register<Schema extends z.ZodType>(definition: NodeToolDefinition<Schema>) {
    if (!getCurrentScope()) throw new Error("请在节点 setup 中注册 nodeTools");
    const nodeId = useNodeId();
    if (!nodeId) throw new Error("当前组件不属于画布节点");
    if (!/^[a-z][a-zA-Z0-9]{0,63}$/.test(definition.name)) throw new Error("节点函数名必须使用小驼峰，最多 64 个字符");
    const parameters = z.toJSONSchema(definition.parameters, { io: "input", target: "draft-07" });
    if (!definition.description.trim() || parameters.type !== "object" || typeof definition.execute !== "function") {
      throw new Error("节点函数需要描述、Zod 对象参数和 execute 方法");
    }
    const { registry } = getRegistry(useVueFlow());
    const name = `node:${definition.name}` as const;
    const key = `${nodeId}:${name}`;
    const entry: RegisteredNodeTool = {
      nodeId, name, description: definition.description.trim(),
      parameters,
      async execute(args, context) {
        const parsed = await definition.parameters.safeParseAsync(args);
        if (!parsed.success) {
          throw new Error(`节点函数 ${name} 参数校验失败，未执行。请按以下 parameters 修正 args；需要其他操作时，用 getNodeTools 查询此节点的函数后分别调用，不要原样重试。${JSON.stringify({
            nodeId, name, description: entry.description, parameters, issues: parsed.error.issues,
          })}`);
        }
        context.signal?.throwIfAborted();
        return definition.execute(parsed.data, context);
      },
    };
    registry.set(key, entry);
    const unregister = () => { if (registry.get(key) === entry) registry.delete(key); };
    onScopeDispose(unregister);
    return unregister;
  },
};

// 在画布 setup 中创建，按需读取当前节点函数，不复制全量注册表。
export function useNodeToolsContext() {
  const flow = useVueFlow();
  const { registry, index } = getRegistry(flow);
  function* list(nodeIds: string[], names?: string[]): IterableIterator<NodeToolInfo> {
    const nameSet = names ? new Set(names) : undefined;
    for (const nodeId of new Set(nodeIds)) {
      const node = flow.findNode(nodeId);
      if (!node) continue;
      for (const entry of index.nodes.get(nodeId)?.values() ?? []) {
        if (nameSet && !nameSet.has(entry.name)) continue;
        const { execute: _execute, ...info } = entry;
        yield { ...info, nodeLabel: String(node.data.label ?? node.label ?? nodeId) };
      }
    }
  }
  return (): NodeToolsContext => ({
    get tools() { return [...list([...index.nodes.keys()])]; },
    get version() { return index.version; },
    list,
    async call({ nodeId, name, args }, signal) {
      const timeout = AbortSignal.timeout(120000);
      const callSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
      callSignal.throwIfAborted();
      const key = `${nodeId}:${name}`;
      const entry = registry.get(key);
      if (!entry) throw new Error(`节点未注册函数 ${name}，请先通过 getNodeTools 查询可用节点函数`);
      if (!flow.findNode(nodeId)) throw new Error("节点函数已卸载或不属于本轮画布");
      let cancel: () => void = () => {};
      try {
        const result = await Promise.race([
          Promise.resolve().then(() => {
            callSignal.throwIfAborted();
            if (registry.get(key) !== entry || !flow.findNode(nodeId)) throw new Error("节点函数已卸载或不属于本轮画布");
            return entry.execute(args, { signal: callSignal });
          }),
          new Promise<never>((_resolve, reject) => {
            cancel = () => reject(callSignal.reason);
            callSignal.addEventListener("abort", cancel, { once: true });
          }),
        ]);
        callSignal.throwIfAborted();
        return result ?? null;
      } finally {
        callSignal.removeEventListener("abort", cancel);
      }
    },
  });
}
