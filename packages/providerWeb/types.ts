export type MediaProviderModel = {
  id: string;
  label: string;
  type: "text" | "image" | "video" | "audio";
  [key: string]: unknown;
};

export type MediaProvider = {
  fileName: string;
  id: string;
  label: string;
  icon?: string;
  version?: string;
  readme?: string;
  modelsUrl?: string;
  rules?: Record<string, unknown>[];
  models: MediaProviderModel[];
  revision: string;
  loadError?: string;
};
