import type { ToolContext } from "@toonflow/tools-scaffold/runtime";
import type { LocalModelDefinition } from "@toonflow/plugin-server/localModels";
import { getStatus } from "@/utils/localModel";
import { runLocalModel } from "@/utils/localModel/inference";
import { mutatePluginModel } from "@/utils/localModel/pluginChanges";
import { requireDirectModelAccess } from "@/utils/multiTenant/gateway";

export type ModelPlugin = { kind: "node" | "tool"; name: string; revision: string };

export function createPluginModelContext(owner?: ModelPlugin): ToolContext["model"] {
  async function change(action: "register" | "update" | "remove", input: LocalModelDefinition | string) {
    requireDirectModelAccess();
    if (!owner) throw Object.assign(new Error("只有已安装的全局工具或节点配套服务可以修改自己的本地模型"), { status: 403 });
    await mutatePluginModel({ kind: owner.kind, name: owner.name }, action, input, owner.revision);
  }
  return {
    async list(signal) {
      requireDirectModelAccess();
      signal?.throwIfAborted();
      const { items } = await getStatus();
      signal?.throwIfAborted();
      return items;
    },
    run: runLocalModel,
    register: definition => change("register", definition),
    update: definition => change("update", definition),
    remove: id => change("remove", id),
  };
}
