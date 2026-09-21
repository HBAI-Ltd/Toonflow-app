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

// 共享 Vue Flow 实例上的注册表供各 UMD 访问，不进入画布 JSON。
const nodeToolsKey = Symbol.for("toonflow.nodeTools");

function getRegistry(flow: ReturnType<typeof useVueFlow>) {
  const host = flow as typeof flow & { [nodeToolsKey]?: Map<string, RegisteredNodeTool> };
  if (!host[nodeToolsKey]) Object.defineProperty(host, nodeToolsKey, { value: new Map<string, RegisteredNodeTool>() });
  return host[nodeToolsKey]!;
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
    const registry = getRegistry(useVueFlow());
    const name = `node:${definition.name}` as const;
    const key = `${nodeId}:${name}`;
    const entry: RegisteredNodeTool = {
      nodeId, name, description: definition.description.trim(),
      parameters,
      async execute(args, context) {
        const parsed = await definition.parameters.parseAsync(args);
        context.signal?.throwIfAborted();
        return definition.execute(parsed, context);
      },
    };
    registry.set(key, entry);
    const unregister = () => { if (registry.get(key) === entry) registry.delete(key); };
    onScopeDispose(unregister);
    return unregister;
  },
};

// 在画布 setup 中创建，每次发送消息时获取本轮可调用的节点函数快照。
export function useNodeToolsContext() {
  const flow = useVueFlow();
  const registry = getRegistry(flow);
  return (): NodeToolsContext => {
    const entries = new Map([...registry].filter(([, entry]) => flow.findNode(entry.nodeId)));
    return {
      tools: [...entries.values()].map(({ execute: _execute, ...info }) => ({
        ...info,
        nodeLabel: String(flow.findNode(info.nodeId)?.data.label ?? flow.findNode(info.nodeId)?.label ?? info.nodeId),
      })),
      async call({ nodeId, name, args }, signal) {
        const timeout = AbortSignal.timeout(120000);
        const callSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
        callSignal.throwIfAborted();
        const key = `${nodeId}:${name}`;
        const entry = entries.get(key);
        if (!entry) throw new Error(`节点未注册函数 ${name}，请先通过 getCanvas 查询可用节点函数`);
        if (registry.get(key) !== entry || !flow.findNode(nodeId)) throw new Error("节点函数已卸载或不属于本轮画布");
        let cancel: () => void = () => {};
        try {
          const result = await Promise.race([
            Promise.resolve().then(() => {
              callSignal.throwIfAborted();
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
    };
  };
}
