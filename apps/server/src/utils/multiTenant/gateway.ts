import { dirname } from "node:path";
import { createModelGateway } from "@toonflow/multi-tenant-gateway";
import conf from "@/utils/conf";
import { cloudSchema, formatModelPrice, loadModelCloud, modelAdapters } from "./modelAdapters";
import type { Cloud, ModelCapabilities, ModelUpstreams } from "./modelAdapters";
import { providerAdapters } from "./providerAdapters";
import { isEnabled } from "./mode";

export const modelGateway = createModelGateway<ModelUpstreams, ModelCapabilities, Cloud>(dirname(conf.path), {
  enabled: isEnabled,
  formatPrice: formatModelPrice,
  adapters: modelAdapters,
  cloud: { parse: value => cloudSchema.parse(value), load: loadModelCloud },
  providers: providerAdapters,
});

export function requireDirectModelAccess() {
  if (modelGateway.enabled()) throw Object.assign(new Error("多租户模式下只能使用已发布的平台模型"), { status: 403 });
}
