import type { MediaProviderModel } from "./types";

export type ProviderKind = "text" | "media";
export type ProviderConfiguration = {
  kind: ProviderKind;
  id: string;
  label: string;
  source?: string;
  config: Record<string, unknown>;
};
export type ProviderDescription = ProviderConfiguration & {
  models: MediaProviderModel[];
  rules?: Record<string, unknown>[];
  version?: string;
  icon?: string;
  readme?: string;
};
export type ProviderInspection = {
  kind: ProviderKind;
  source: string;
  config: Record<string, unknown>;
  models?: MediaProviderModel[];
};
