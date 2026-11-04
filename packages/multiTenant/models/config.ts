import { z } from "zod";

export const modelAmountSchema = z.string().regex(/^(?:0|[1-9]\d{0,9})(?:\.\d{1,6})?$/).pipe(z.string()
  .refine(value => BigInt(value.split(".")[0]!) < 1000000000n
    || BigInt(value.split(".")[0]!) === 1000000000n && /^0*$/.test(value.split(".")[1] ?? ""), "模型价格不能超过 1000000000"));
const currencySchema = z.enum(["CNY", "USD"]);
const publicModelIdMessage = "对外模型 ID 须为 1 到 128 个字符，以字母或数字开头，仅支持字母、数字、点、下划线、冒号和短横线";
export const publicModelIdSchema = z.string().trim().min(1, publicModelIdMessage).max(128, publicModelIdMessage)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/, publicModelIdMessage);

export const modelPriceSchema = z.discriminatedUnion("mode", [
  z.strictObject({
    mode: z.literal("perMillionTokens"), currency: currencySchema,
    input: modelAmountSchema, output: modelAmountSchema, cacheRead: modelAmountSchema, cacheWrite: modelAmountSchema,
  }),
  z.strictObject({ mode: z.literal("perRequest"), currency: currencySchema, amount: modelAmountSchema }),
  z.strictObject({ mode: z.literal("perSecond"), currency: currencySchema, amount: modelAmountSchema }),
]);

export const modelRouteSchema = z.strictObject({
  id: z.uuid(),
  publicId: publicModelIdSchema.optional(),
  label: z.string().trim().min(1).max(128),
  type: z.enum(["text", "image", "video", "audio"]),
  enabled: z.boolean(),
  target: z.enum(["backend", "toonflowCloud"]),
  providerId: z.string().trim().min(1).max(96),
  upstreamModelId: z.string().trim().min(1).max(256),
  salePrice: modelPriceSchema,
  costPrice: modelPriceSchema.nullable(),
}).refine(route => [route.salePrice, route.costPrice].filter(price => price !== null).every(price =>
  route.type === "text" ? price.mode === "perMillionTokens"
    : route.type === "video" ? price.mode !== "perMillionTokens" : price.mode === "perRequest"),
"文本模型须按百万 Token 计价，图片与音频须按次计价，视频可按次或按秒计价");

export const modelRoutesSchema = z.array(modelRouteSchema).max(500)
  .refine(routes => new Set(routes.map(route => route.id)).size === routes.length, "模型路由 ID 不能重复")
  .refine(routes => {
    const identifiers = new Map<string, string>();
    return routes.every(route => [route.id, getPublicModelId(route)].every(identifier => {
      const owner = identifiers.get(identifier);
      if (owner !== undefined && owner !== route.id) return false;
      identifiers.set(identifier, route.id);
      return true;
    }));
  }, "对外模型 ID 不能重复，也不能与其他路由的内部 ID 相同");
export const modelRoutingRevisionSchema = z.number().int().min(0).max(2147483646);
export type ModelPrice = z.infer<typeof modelPriceSchema>;
export type ModelRoute = z.infer<typeof modelRouteSchema>;
export type ModelRoutingSnapshot = { routes: ModelRoute[]; revision: number; cloudConfigured: boolean };

export function getPublicModelId(route: Pick<ModelRoute, "id" | "publicId">) {
  return route.publicId ?? route.id;
}

export const modelProviderSchema = z.strictObject({
  kind: z.enum(["text", "media"]),
  id: z.string().trim().min(1).max(96).regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,95}$/),
  label: z.string().trim().min(1).max(128),
  source: z.string().min(1).max(2 * 1024 * 1024).optional(),
  config: z.record(z.string(), z.json()),
});
export const modelProvidersSchema = z.array(modelProviderSchema).max(100)
  .refine(providers => new Set(providers.map(provider => JSON.stringify([provider.kind, provider.id]))).size === providers.length,
    "供应商 ID 不能重复");
export type ModelProvider = z.infer<typeof modelProviderSchema>;
export type ManagedModelProvider = ModelProvider & {
  models: { id: string; label: string; type: ModelRoute["type"]; [key: string]: unknown }[];
  rules?: Record<string, unknown>[];
  version?: string;
  icon?: string;
  readme?: string;
};
export type ProviderConfigurationSnapshot = { providers: ManagedModelProvider[]; revision: number; cloudConfigured: boolean };
