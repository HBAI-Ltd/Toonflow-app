import { createHash } from "node:crypto";
import { z } from "zod";
import { calculateModelPrice, createModelRouting } from "@toonflow/multi-tenant-models";
import { getPublicModelId, modelRouteSchema, modelRoutesSchema, modelRoutingRevisionSchema, publicModelIdSchema, modelProviderSchema, modelProvidersSchema } from "@toonflow/multi-tenant-models/config";
import type { ManagedModelProvider, ModelProvider, ModelRoute, ProviderConfigurationSnapshot } from "@toonflow/multi-tenant-models/config";
import { createBilling } from "@toonflow/multi-tenant-billing";
import { billingUsageSchema } from "@toonflow/multi-tenant-billing/config";
import type { BillingCredit, BillingReleaseMetadata, BillingUsage } from "@toonflow/multi-tenant-billing/config";
import type { AvailableModel, ModelExecution, ModelFinalization, ModelGatewayOptions, ModelMap, ModelOutcome, ModelRequestContext, ModelRunFailure, ModelRunInput, ModelType, ModelExecutionResources, PublicModel } from "./types";

export type * from "./types";

const modelTypes = ["text", "image", "video", "audio"] as const;
const modelTargets = ["backend", "toonflowCloud"] as const;
const revisionSchema = z.number().int().min(1).max(2147483647);
const providerConfigurationSchema = z.strictObject({ providers: modelProvidersSchema });
const managedProviderSchema = modelProviderSchema.extend({
  models: z.array(z.looseObject({ id: z.string().min(1), label: z.string().min(1), type: z.enum(modelTypes) })),
  rules: z.array(z.record(z.string(), z.unknown())).optional(),
  version: z.string().optional(), icon: z.string().optional(), readme: z.string().optional(),
});
const executionSchema = z.strictObject({
  kind: z.literal("multiTenantModelExecution"), route: modelRouteSchema, revision: revisionSchema, upstream: z.unknown(),
});
const contextSchema = z.strictObject({
  actor: z.object({ id: z.string().min(1).max(64), role: z.enum(["user", "admin"]) }).nullable(),
  requestId: z.uuid(), payload: z.unknown(), scope: z.string().min(1).max(4096).optional(), recoverExisting: z.boolean().optional(),
});
const outcomeSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("usage"), usage: billingUsageSchema }),
  z.strictObject({ kind: z.literal("notSubmitted") }),
  z.strictObject({ kind: z.enum(["rejected", "failed", "cancelled"]), delivered: z.boolean() }),
  z.strictObject({ kind: z.literal("unknown") }),
]);

function fail(message: string, status = 400): never { throw Object.assign(new Error(message), { status }); }

function matchesPublicModel(route: ModelRoute, modelId: string) {
  return getPublicModelId(route) === modelId || route.id === modelId;
}

async function access<T>(operation: () => Promise<T> | T, message: string) {
  try { return await operation(); }
  catch (cause) {
    if (cause instanceof z.ZodError) throw cause;
    const status = (cause as { status?: number } | null)?.status;
    if (status && status >= 400 && status <= 599) throw cause;
    fail(message, 503);
  }
}

function hashRequest(value: unknown) {
  const json = JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
    ? Object.fromEntries(Object.entries(item).sort(([left], [right]) => left.localeCompare(right))) : item);
  return createHash("sha256").update(json).digest("hex");
}

function runFailure(cause: unknown, settlement: ModelFinalization | undefined): ModelRunFailure {
  const failure = cause as { status?: unknown; code?: unknown } | null;
  const status = cause instanceof z.ZodError ? 400 : failure?.status;
  const code = failure?.code;
  return Object.assign(new Error(cause instanceof Error ? cause.message : "模型请求失败", { cause }), {
    ...(typeof status === "number" && status >= 400 && status <= 599 ? { status } : {}),
    ...(typeof code === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(code) ? { code } : {}),
    ...(settlement ? { billing: settlement } : {}),
  });
}

export function createModelGateway<Upstreams extends ModelMap, Catalogs extends ModelMap, Cloud extends Record<string, unknown>>(
  dataDirectory: string,
  options: ModelGatewayOptions<Upstreams, Catalogs, Cloud>,
) {
  const routing = createModelRouting(dataDirectory);
  const billing = createBilling(dataDirectory);
  const routeAccess = <T>(operation: () => Promise<T> | T) => access(operation, "模型路由配置访问失败");
  const billingAccess = <T>(operation: () => Promise<T> | T) => access(operation, "模型账务处理失败，请联系管理员");
  const read = () => routeAccess(() => routing.read());

  function requirePublicModel(type: ModelType, providerId: string, modelId: string) {
    z.enum(modelTypes).parse(type);
    if (!options.enabled()) fail("多租户模型路由尚未开启", 403);
    const parsed = publicModelIdSchema.safeParse(modelId);
    if (providerId !== "multiTenant" || !parsed.success) fail("请选择已发布的平台模型");
    return parsed.data;
  }

  async function readCloud(revision: number): Promise<Cloud> {
    const raw = await routeAccess(() => routing.readCloud(revision));
    if (!raw) fail("请先配置平台 Toonflow 云端凭据", 503);
    try { return options.cloud.parse(raw); }
    catch { fail("平台 Toonflow 云端配置无效", 503); }
  }

  async function providerAccess<T>(operation: () => Promise<T> | T, status: 400 | 503 = 503) {
    try { return await operation(); }
    catch { fail(status === 400 ? "供应商配置无效，请检查后重试" : "平台供应商配置读取失败，请联系管理员", status); }
  }

  async function readProviders(revision: number) {
    const raw = await routeAccess(() => routing.readProviders(revision));
    return providerAccess(async () => {
      const providers = raw === null ? modelProvidersSchema.parse(await options.providers.legacy())
        : providerConfigurationSchema.parse(raw).providers;
      return modelProvidersSchema.parse(await options.providers.normalize(providers));
    });
  }

  async function describeProviders(providers: ModelProvider[], status: 400 | 503 = 503) {
    return providerAccess(async () => {
      const described = z.array(managedProviderSchema).parse(await options.providers.describe(providers));
      const identities = new Set(providers.map(provider => JSON.stringify([provider.kind, provider.id])));
      if (described.length !== identities.size || described.some(provider => !identities.delete(JSON.stringify([provider.kind, provider.id])))) {
        throw new Error("供应商配置无效，请检查后重试");
      }
      return described;
    }, status);
  }

  function executionResources(revision: number): ModelExecutionResources<Cloud> {
    let cloud: Promise<Cloud> | undefined;
    let providers: Promise<ModelProvider[]> | undefined;
    return { cloud: () => cloud ??= readCloud(revision), providers: () => providers ??= readProviders(revision) };
  }

  async function available() {
    const snapshot = await read();
    const providers = await readProviders(snapshot.revision);
    const cloud = snapshot.cloudConfigured ? await readCloud(snapshot.revision) : null;
    const models: AvailableModel[] = [];
    const seen = new Set<string>();
    for (const type of modelTypes) {
      for (const target of modelTargets) {
        for (const model of await routeAccess(() => options.adapters[type].sources[target].available(type, { cloud, providers }))) {
          if (model.type !== type || model.target !== target) continue;
          const key = JSON.stringify([model.type, model.target, model.providerId, model.modelId]);
          if (seen.has(key)) continue;
          seen.add(key);
          models.push(model);
        }
      }
    }
    return models;
  }

  function readUpstream<K extends ModelType>(type: K, route: ModelRoute, revision: number, resources = executionResources(revision)) {
    const source = options.adapters[type].sources[route.target];
    return routeAccess(() => source.resolve(route, resources));
  }

  async function resolve<K extends ModelType>(type: K, providerId: string, modelId: string, snapshot?: string, request?: unknown): Promise<ModelExecution<Upstreams[K]>> {
    const publicModelId = requirePublicModel(type, providerId, modelId);
    const adapter = options.adapters[type];
    let execution: ModelExecution<Upstreams[K]>;
    if (snapshot !== undefined) {
      const raw = await routeAccess(() => routing.openExecution(snapshot));
      const parsed = executionSchema.safeParse(raw);
      if (parsed.success) {
        execution = { route: parsed.data.route, revision: parsed.data.revision,
          upstream: await routeAccess(() => adapter.restore(parsed.data.upstream, parsed.data.route)) };
      } else {
        const legacy = await routeAccess(() => adapter.restoreLegacy?.(raw));
        if (!legacy) fail("媒体任务路由快照无效", 409);
        execution = { ...legacy, legacyFormat: true };
      }
      if (!matchesPublicModel(execution.route, publicModelId) || execution.route.type !== type || !execution.route.enabled
        || !revisionSchema.safeParse(execution.revision).success) fail("媒体任务路由快照无效", 409);
    } else {
      const current = await read();
      const route = current.routes.find(item => matchesPublicModel(item, publicModelId) && item.type === type && item.enabled);
      if (!route) fail("平台模型不存在或已停用", 404);
      execution = { route, revision: current.revision, upstream: await readUpstream(type, route, current.revision) };
    }
    if (request !== undefined) await routeAccess(() => adapter.validate(execution, request));
    return execution;
  }

  function quote(execution: ModelExecution, usage: BillingUsage) {
    const price = calculateModelPrice(execution.route.salePrice, usage);
    return price ? { ...price, revision: execution.revision } : null;
  }

  async function reserve<K extends ModelType>(execution: ModelExecution<Upstreams[K]>, context: ModelRequestContext) {
    if (!options.enabled()) fail("多租户模型路由尚未开启", 403);
    const input = contextSchema.parse(context);
    if (!input.actor) fail("请先登录 Toonflow", 401);
    const route = modelRouteSchema.parse(execution.route);
    const revision = revisionSchema.parse(execution.revision);
    const adapter = options.adapters[route.type];
    const checked = { route, revision, upstream: await routeAccess(() => adapter.restore(execution.upstream, route)) };
    await routeAccess(() => adapter.validate(checked, input.payload));
    if (input.actor.role === "admin") return undefined;
    const maximumUsage = await routeAccess(() => adapter.maximumUsage(checked, input.payload));
    let requestHash: string;
    if (execution.legacyFormat) {
      if (!input.scope || !input.payload || typeof input.payload !== "object" || Array.isArray(input.payload)) fail("媒体任务路由快照无效", 409);
      // ACT: 旧任务只保留原哈希协议以恢复已存在预占；新执行统一使用显式 scope，不由调用方拼接哈希。
      requestHash = hashRequest({ owner: input.actor.id, routeId: route.id, revision, request: { ...input.payload, directory: input.scope } });
    } else {
      requestHash = hashRequest({ owner: input.actor.id, routeId: route.id, revision, payload: input.payload, scope: input.scope });
    }
    const result = await billingAccess(() => billing.reserve({
      userId: input.actor!.id, requestId: input.requestId, requestHash, route, revision, maximumUsage, recoverExisting: input.recoverExisting,
    }));
    return result.id;
  }

  async function finalize(chargeId: string | undefined, userId: string | undefined, outcome: ModelOutcome,
    finalizationOptions?: { missingOkay?: boolean }): Promise<ModelFinalization | undefined> {
    if (!chargeId) return undefined;
    if (!userId) fail("计费记录归属不一致，请联系管理员", 503);
    const evidence = outcomeSchema.parse(outcome);
    if (evidence.kind === "usage") return billingAccess(() => billing.settle(chargeId, userId, evidence.usage));
    const canRelease = evidence.kind === "notSubmitted" || evidence.kind !== "unknown" && !evidence.delivered;
    let current;
    try { current = await billingAccess(() => billing.getCharge(chargeId, userId)); }
    catch (cause) {
      if (canRelease && finalizationOptions?.missingOkay && (cause as { status?: number } | null)?.status === 404) return undefined;
      throw cause;
    }
    if (current.status !== "reserved") return { ...current, status: current.status, capped: false };
    if (!canRelease) return { status: "held" };
    try { await billingAccess(() => billing.release(chargeId, userId)); }
    catch (cause) {
      if (finalizationOptions?.missingOkay && (cause as { status?: number } | null)?.status === 404) return undefined;
      throw cause;
    }
    const terminal = await billingAccess(() => billing.getCharge(chargeId, userId));
    if (terminal.status === "reserved") return { status: "held" };
    return { ...terminal, status: terminal.status, capped: false };
  }

  return {
    enabled: options.enabled,
    read,
    available,
    async save(input: ModelRoute[], expectedRevision: number) {
      const routes = modelRoutesSchema.parse(input);
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const current = await read();
      if (current.revision !== revision) fail("模型路由已被更新，请重新加载后再保存", 409);
      const bindings = routes.filter(route => {
        if (!route.enabled) return false;
        const previous = current.routes.find(item => item.id === route.id);
        return !previous?.enabled || route.type !== previous.type || route.target !== previous.target
          || route.providerId !== previous.providerId || route.upstreamModelId !== previous.upstreamModelId;
      });
      if (bindings.length) {
        const models = await available();
        if (bindings.some(route => !models.some(model => model.type === route.type && model.target === route.target
          && model.providerId === route.providerId && model.modelId === route.upstreamModelId))) {
          fail("启用的模型路由必须绑定可用的上游模型");
        }
      }
      await billingAccess(() => billing.initialize());
      return routeAccess(() => routing.save(routes, revision));
    },
    async getProviders(): Promise<ProviderConfigurationSnapshot> {
      const current = await read();
      return { providers: await describeProviders(await readProviders(current.revision)),
        revision: current.revision, cloudConfigured: current.cloudConfigured };
    },
    async saveProviders(input: ModelProvider[], expectedRevision: number): Promise<ProviderConfigurationSnapshot> {
      const values = modelProvidersSchema.parse(input);
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const current = await read();
      if (current.revision !== revision) fail("模型路由已被更新，请重新加载后再保存", 409);
      const previous = await readProviders(revision);
      const providers = await providerAccess(async () => modelProvidersSchema.parse(await options.providers.normalize(values)), 400);
      const submitted = new Set(values.map(provider => JSON.stringify([provider.kind, provider.id])));
      if (providers.length !== submitted.size || providers.some(provider => !submitted.delete(JSON.stringify([provider.kind, provider.id])))) {
        fail("供应商配置无效，请检查后重试");
      }
      const retained = new Set(providers.map(provider => JSON.stringify([provider.kind, provider.id])));
      if (previous.some(provider => !retained.has(JSON.stringify([provider.kind, provider.id])))) fail("不能移除已有供应商，请保留供应商 ID");
      const described = await describeProviders(providers, 400);
      const previousModels = await describeProviders(previous);
      const hasBinding = (available: ManagedModelProvider[], route: ModelRoute) => available.some(provider =>
        provider.id === route.providerId && provider.kind === (route.type === "text" ? "text" : "media")
          && provider.models.some(model => model.id === route.upstreamModelId && model.type === route.type));
      if (current.routes.some(route => route.enabled && route.target === "backend"
        && hasBinding(previousModels, route) && !hasBinding(described, route))) {
        fail("启用的模型路由必须绑定可用的上游模型");
      }
      const saved = await routeAccess(() => routing.saveProviders({ providers }, revision));
      return { providers: described, revision: saved.revision, cloudConfigured: saved.cloudConfigured };
    },
    inspectProvider(kind: ModelProvider["kind"], source: string, config: ModelProvider["config"], models?: unknown): Promise<ManagedModelProvider> {
      const input = z.strictObject({ kind: z.enum(["text", "media"]), source: z.string().min(1).max(2 * 1024 * 1024),
        config: z.record(z.string(), z.json()) }).parse({ kind, source, config });
      return providerAccess(async () => managedProviderSchema.parse(await options.providers.inspect(input.kind, input.source, input.config, models)), 400);
    },
    async configureCloud(token: string | undefined, expectedRevision: number, signal?: AbortSignal) {
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const current = await read();
      if (current.revision !== revision) fail("模型路由已被更新，请重新加载后再保存", 409);
      const accountToken = token === undefined ? z.string().trim().min(1).max(16384).parse((await readCloud(revision)).accountToken)
        : z.string().trim().min(1).max(16384).parse(token);
      signal?.throwIfAborted();
      let cloud: Cloud;
      try { cloud = await options.cloud.load(accountToken, signal); }
      catch {
        if (signal?.aborted) fail("请求已取消", 499);
        fail("平台 Toonflow 云端配置获取失败", 502);
      }
      try { cloud = options.cloud.parse(cloud); }
      catch { fail("平台 Toonflow 云端配置无效", 502); }
      signal?.throwIfAborted();
      return routeAccess(() => routing.saveCloud(JSON.parse(JSON.stringify(cloud)), revision));
    },
    resolve,
    async capture<K extends ModelType>(type: K, providerId: string, modelId: string, request: unknown) {
      const execution = await resolve(type, providerId, modelId, undefined, request);
      return routeAccess(() => routing.sealExecution(JSON.parse(JSON.stringify({ kind: "multiTenantModelExecution", ...execution }))));
    },
    async catalog<K extends ModelType>(types: readonly K[]): Promise<(Catalogs[K] & PublicModel)[]> {
      if (!options.enabled()) fail("多租户模型路由尚未开启", 403);
      const current = await read();
      const resources = executionResources(current.revision);
      const catalog: (Catalogs[K] & PublicModel)[] = [];
      for (const route of current.routes) {
        if (!route.enabled || !types.includes(route.type as K)) continue;
        const adapter = options.adapters[route.type as K];
        const execution = { route, revision: current.revision,
          upstream: await readUpstream(route.type as K, route, current.revision, resources) };
        const label = options.formatPrice(route.salePrice);
        const attributes = await routeAccess(() => adapter.publicModel(execution));
        if (!attributes || typeof attributes !== "object" || Array.isArray(attributes)) fail("平台模型能力配置无效", 503);
        catalog.push({ ...attributes, providerId: "multiTenant", providerLabel: "Toonflow", routeId: route.id, modelId: getPublicModelId(route),
          label: `${route.label} · ${label}`, salePrice: route.salePrice, priceLabel: label });
      }
      return catalog;
    },
    quote,
    async quoteRequest<K extends ModelType>(type: K, providerId: string, modelId: string, request: unknown) {
      const execution = await resolve(type, providerId, modelId, undefined, request);
      const result = quote(execution, await routeAccess(() => options.adapters[type].maximumUsage(execution, request)));
      if (!result) fail("当前模型暂时无法报价");
      return result;
    },
    reserve,
    async reserveSnapshot<K extends ModelType>(type: K, providerId: string, modelId: string, snapshot: string, request: unknown, context: ModelRequestContext) {
      return reserve(await resolve(type, providerId, modelId, snapshot, request), context);
    },
    finalize,
    getCharge(chargeId: string, userId: string) { return billingAccess(() => billing.getCharge(chargeId, userId)); },
    async run<K extends ModelType, Value>(input: ModelRunInput<Upstreams[K], Value>) {
      const chargeId = await reserve(input.execution, input.context);
      let result: { value: Value; outcome: ModelOutcome };
      try { result = await input.execute(chargeId); }
      catch (cause) {
        let settlement: ModelFinalization | undefined;
        try { settlement = await finalize(chargeId, input.context.actor?.id, input.failure()); }
        catch (error) { throw runFailure(error, { status: "held" }); }
        throw runFailure(cause, settlement);
      }
      // ACT: 结算失败只能保留预占，不能回到 execute 的失败分支将已交付内容退款。
      let settlement: ModelFinalization | undefined;
      try { settlement = await finalize(chargeId, input.context.actor?.id, result.outcome); }
      catch (cause) { throw runFailure(cause, { status: "held" }); }
      return { value: result.value, billing: settlement };
    },
    readBalance(userId: string) { return billingAccess(() => billing.read(userId)); },
    credit(input: BillingCredit) { return billingAccess(() => billing.credit(input)); },
    async releaseReservation(userId: string, requestId: string, metadata: BillingReleaseMetadata) {
      const previous = await billingAccess(() => billing.getCharge(requestId, userId));
      await billingAccess(() => billing.release(requestId, userId, metadata));
      const current = await billingAccess(() => billing.getCharge(requestId, userId));
      return { released: previous.status === "reserved" && current.status === "released", snapshot: await billingAccess(() => billing.read(userId)) };
    },
  };
}
