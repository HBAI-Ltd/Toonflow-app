import type { LocalModelItem } from "@toonflow/plugin-server/localModels";
import type { LocalModelRunRequest, LocalModelRunResult } from "@toonflow/plugin-server/localModelInference";
export type { LocalModelItem } from "@toonflow/plugin-server/localModels";

export type ModelRunner = (request: LocalModelRunRequest, signal?: AbortSignal) => Promise<LocalModelRunResult>;
export type ResolveModelRunner = (model: Readonly<Pick<LocalModelItem, "id" | "version" | "fileName"> & { sha256: string }>) => ModelRunner | undefined;

export type LocalModelsStatus = Pick<LocalModelItem, "version" | "fileName" | "sources" | "installed" | "installing"> & {
  directory: string;
  target: string;
  items: LocalModelItem[];
};
