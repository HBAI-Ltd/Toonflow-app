import { z } from "zod";

export const localModelOwnerSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("node"), name: z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/) }),
  z.strictObject({ kind: z.literal("tool"), name: z.string().max(96).regex(/^[a-z][a-zA-Z0-9]*$/) }),
  z.strictObject({ kind: z.literal("ext"), name: z.string().max(96).regex(/^ext-[a-z][a-zA-Z0-9]*$/) }),
]);
export type LocalModelOwner = z.infer<typeof localModelOwnerSchema>;

export const localModelKeySchema = z.string().max(64).regex(/^[a-z][a-zA-Z0-9]*$/);
export const localModelDefinitionSchema = z.strictObject({
  id: localModelKeySchema,
  name: z.string().trim().min(1).max(150),
  displayName: z.string().trim().min(1).max(150).optional(),
  description: z.string().trim().max(1000).optional(),
  version: z.string().trim().min(1).max(100),
  fileName: z.string().max(160).regex(/^[^<>:"/\\|?*\x00-\x1f.][^<>:"/\\|?*\x00-\x1f]*$/)
    .refine(name => !/[. ]$/.test(name) && !/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name), "无效的模型文件名"),
  size: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  sha256: z.string().regex(/^[0-9a-f]{64}$/i).transform(value => value.toLowerCase()),
  sources: z.array(z.strictObject({
    id: z.string().min(1).max(40).regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/),
    label: z.string().trim().min(1).max(100),
    url: z.string().max(4096).refine(value => {
      if (!URL.canParse(value)) return false;
      const url = new URL(value);
      return url.protocol === "https:" && !url.username && !url.password && !url.hash;
    }, "下载源必须是不含凭据和片段的 HTTPS 地址"),
  })).max(16).refine(items => new Set(items.map(item => item.id)).size === items.length, "下载源 ID 不能重复"),
});
export type LocalModelDefinition = z.infer<typeof localModelDefinitionSchema>;
export const localModelDefinitionsSchema = z.array(localModelDefinitionSchema).max(128)
  .refine(items => new Set(items.map(item => item.id)).size === items.length, "同一插件的本地模型 ID 不能重复");

export function mergeLocalModelDeclarations(declared: unknown, embedded: unknown) {
  const models = localModelDefinitionsSchema.parse(declared === undefined ? [] : declared);
  if (embedded === undefined) return models;
  const byId = new Map(models.map(model => [model.id, model]));
  for (const model of localModelDefinitionsSchema.parse(embedded)) {
    const previous = byId.get(model.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(model)) throw new Error(`节点与配套工具的模型声明冲突：${model.id}`);
    byId.set(model.id, model);
  }
  return localModelDefinitionsSchema.parse([...byId.values()]);
}

export function localModelId(owner: LocalModelOwner, key: string) {
  return `${owner.kind}:${owner.name}:${key}`;
}

export type LocalModelItem = Omit<LocalModelDefinition, "sha256"> & {
  owner?: LocalModelOwner;
  /** 当前部署可执行此模型。installed 仅表示本机已安装权重。 */
  canRun: boolean;
  /** 部署适配器已提供此模型的推理，可省略本机权重。组合操作仍可能需要其他资源。 */
  remoteAvailable?: boolean;
  /** 当前部署执行该功能所需的其他模型和运行库。 */
  requiredAssetIds: string[];
  installed: boolean;
  installing: boolean;
  /** 安装期间已写入的字节数与清单文件大小。校验并提交成功后以 installed 为准。 */
  progress?: { phase: "downloading" | "importing" | "verifying"; received: number; total: number };
};
