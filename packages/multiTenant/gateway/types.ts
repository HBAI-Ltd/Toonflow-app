import type { BillingCredit, BillingReleaseMetadata, BillingSettlement, BillingSnapshot, BillingUsage } from "@toonflow/multi-tenant-billing/config";
import type { ManagedModelProvider, ModelPrice, ModelProvider, ModelRoute } from "@toonflow/multi-tenant-models/config";

export type ModelType = ModelRoute["type"];
export type ModelExecution<T = unknown> = { route: ModelRoute; revision: number; upstream: T; legacyFormat?: true };
export type ModelActor = { id: string; role: "user" | "admin" };
export type ModelRequestContext = {
  actor: ModelActor | null;
  requestId: string;
  payload: unknown;
  scope?: string;
  recoverExisting?: boolean;
};
export type AvailableModel = {
  target: ModelRoute["target"];
  providerId: string;
  providerLabel: string;
  modelId: string;
  label: string;
  type: ModelType;
};
export type PublicModel = {
  providerId: "multiTenant";
  providerLabel: string;
  routeId: string;
  modelId: string;
  label: string;
  salePrice: ModelPrice;
  priceLabel: string;
};
export type ModelOutcome =
  | { kind: "usage"; usage: BillingUsage }
  | { kind: "notSubmitted" }
  | { kind: "rejected" | "failed" | "cancelled"; delivered: boolean }
  | { kind: "unknown" };
export type ModelFinalization = BillingSettlement | { status: "held" };
export type ModelRunFailure = Error & { billing?: ModelFinalization; status?: number; code?: string };
export type ModelMap = { [K in ModelType]: unknown };

export type ModelCatalogResources<Cloud> = { cloud: Cloud | null; providers: ModelProvider[] };
export type ModelExecutionResources<Cloud> = { cloud(): Promise<Cloud>; providers(): Promise<ModelProvider[]> };

export interface ModelSource<T, Cloud extends Record<string, unknown>> {
  available(type: ModelType, resources: ModelCatalogResources<Cloud>): Promise<AvailableModel[]>;
  resolve(route: ModelRoute, resources: ModelExecutionResources<Cloud>): Promise<T>;
}

export interface ModelAdapter<T, Public, Cloud extends Record<string, unknown>> {
  sources: Record<ModelRoute["target"], ModelSource<T, Cloud>>;
  restore(value: unknown, route: ModelRoute): T;
  publicModel(execution: ModelExecution<T>): Public;
  validate(execution: ModelExecution<T>, request: unknown): void;
  maximumUsage(execution: ModelExecution<T>, request: unknown): BillingUsage;
  restoreLegacy?(value: unknown): ModelExecution<T> | undefined;
}

export type ModelGatewayOptions<Upstreams extends ModelMap, Catalogs extends ModelMap, Cloud extends Record<string, unknown>> = {
  enabled(): boolean;
  formatPrice(price: ModelPrice): string;
  adapters: { [K in ModelType]: ModelAdapter<Upstreams[K], Catalogs[K], Cloud> };
  cloud: {
    parse(value: unknown): Cloud;
    load(token: string, signal?: AbortSignal): Promise<Cloud>;
  };
  providers: {
    legacy(): Promise<ModelProvider[]>;
    normalize(providers: ModelProvider[]): Promise<ModelProvider[]> | ModelProvider[];
    describe(providers: ModelProvider[]): Promise<ManagedModelProvider[]> | ManagedModelProvider[];
    inspect(kind: ModelProvider["kind"], source: string, config: ModelProvider["config"], models?: unknown): Promise<ManagedModelProvider> | ManagedModelProvider;
  };
};

export type ModelRunInput<Upstream, Value> = {
  execution: ModelExecution<Upstream>;
  context: ModelRequestContext;
  execute(chargeId: string | undefined): Promise<{ value: Value; outcome: ModelOutcome }>;
  failure(): ModelOutcome;
};
export type ModelReservationRelease = { released: boolean; snapshot: BillingSnapshot };
export type { BillingCredit, BillingReleaseMetadata, BillingUsage };
