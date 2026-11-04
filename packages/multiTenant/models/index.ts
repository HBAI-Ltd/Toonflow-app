import { openDatabase } from "@toonflow/multi-tenant-db";
import type { AdminDatabase } from "@toonflow/multi-tenant-db";
import { z } from "zod";
import { modelProvidersSchema, modelRoutesSchema, modelRoutingRevisionSchema } from "./config";
import type { ModelProvider, ModelRoute, ModelRoutingSnapshot } from "./config";
import { createModelSecret, modelCipherSchema } from "./secret";

export { getPublicModelId, modelAmountSchema, modelPriceSchema, modelRouteSchema, modelRoutesSchema, modelRoutingRevisionSchema, publicModelIdSchema, modelProviderSchema, modelProvidersSchema } from "./config";
export type { ManagedModelProvider, ModelPrice, ModelProvider, ModelRoute, ModelRoutingSnapshot, ProviderConfigurationSnapshot } from "./config";
export { calculateModelPrice } from "./pricing";
export type { ModelPriceUsage } from "./pricing";

const configurationSchema = z.strictObject({ routes: modelRoutesSchema, cloudCipher: modelCipherSchema.optional(), providerCipher: modelCipherSchema.optional() });
const storedSchema = z.object({ configuration: configurationSchema, revision: z.number().int().min(1).max(2147483647) });
type Configuration = z.infer<typeof configurationSchema>;
type State = { configuration: Configuration; revision: number };

function fail(message: string, status: number): never { throw Object.assign(new Error(message), { status }); }
function snapshot(state: State): ModelRoutingSnapshot {
  return { routes: state.configuration.routes, revision: state.revision, cloudConfigured: !!state.configuration.cloudCipher };
}

export function createModelRouting(dataDirectory: string) {
  let database: Promise<AdminDatabase | undefined> | undefined;
  const secret = createModelSecret(dataDirectory);
  async function getDatabase() {
    if (database) return database;
    const opening = openDatabase(dataDirectory, false);
    database = opening;
    try {
      const current = await opening;
      if (!current && database === opening) database = undefined;
      return current;
    } catch (cause) {
      if (database === opening) database = undefined;
      throw cause;
    }
  }
  async function readState(db?: AdminDatabase): Promise<State> {
    const record = await db?.getModelRouting();
    if (!record) return { configuration: { routes: [] }, revision: 0 };
    const parsed = storedSchema.safeParse(record);
    if (!parsed.success) fail("模型路由配置无效，请检查数据库记录", 503);
    return parsed.data;
  }
  async function editableState(expectedRevision: number) {
    const db = await getDatabase();
    if (!db || !await db.getAdmin()) fail("请先设置超级管理员账号", 409);
    const state = await readState(db);
    if (state.revision !== expectedRevision) fail("模型路由已被更新，请重新加载后再保存", 409);
    return { db, state };
  }
  async function write(db: AdminDatabase, configuration: Configuration, expectedRevision: number) {
    await db.initializeModelRouting();
    if (!await db.writeModelRouting(configuration, expectedRevision)) fail("模型路由已被更新，请重新加载后再保存", 409);
    return snapshot({ configuration, revision: expectedRevision + 1 });
  }
  return {
    async read(): Promise<ModelRoutingSnapshot> {
      return snapshot(await readState(await getDatabase()));
    },
    async save(routes: ModelRoute[], expectedRevision: number): Promise<ModelRoutingSnapshot> {
      const values = modelRoutesSchema.parse(routes);
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const { db, state } = await editableState(revision);
      const retained = new Set(values.map(route => route.id));
      if (state.configuration.routes.some(route => !retained.has(route.id))) fail("不能移除已有模型路由，请改为停用", 400);
      return write(db, { ...state.configuration, routes: values }, revision);
    },
    async readCloud(expectedRevision?: number): Promise<Record<string, unknown> | null> {
      const state = await readState(await getDatabase());
      if (expectedRevision !== undefined && state.revision !== z.number().int().min(0).max(2147483647).parse(expectedRevision)) {
        fail("模型路由已被更新，请重新加载后再保存", 409);
      }
      return state.configuration.cloudCipher ? secret.open(state.configuration.cloudCipher, "cloud") : null;
    },
    async saveCloud(payload: Record<string, unknown>, expectedRevision: number): Promise<ModelRoutingSnapshot> {
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const { db, state } = await editableState(revision);
      const cloudCipher = await secret.seal(payload, "cloud");
      return write(db, { ...state.configuration, cloudCipher }, revision);
    },
    async readProviders(expectedRevision?: number): Promise<Record<string, unknown> | null> {
      const state = await readState(await getDatabase());
      if (expectedRevision !== undefined && state.revision !== z.number().int().min(0).max(2147483647).parse(expectedRevision)) {
        fail("模型路由已被更新，请重新加载后再保存", 409);
      }
      return state.configuration.providerCipher ? secret.open(state.configuration.providerCipher, "providers") : null;
    },
    async saveProviders(payload: { providers: ModelProvider[] }, expectedRevision: number): Promise<ModelRoutingSnapshot> {
      const providers = modelProvidersSchema.parse(payload.providers);
      const revision = modelRoutingRevisionSchema.parse(expectedRevision);
      const { db, state } = await editableState(revision);
      const providerCipher = await secret.seal(JSON.parse(JSON.stringify({ providers })), "providers");
      return write(db, { ...state.configuration, providerCipher }, revision);
    },
    sealExecution(payload: Record<string, unknown>) { return secret.seal(payload, "execution"); },
    openExecution(value: string) { return secret.open(value, "execution"); },
  };
}
