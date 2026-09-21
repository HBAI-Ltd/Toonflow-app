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
  version?: string;
  readme?: string;
  models: MediaProviderModel[];
  revision: string;
  loadError?: string;
};
