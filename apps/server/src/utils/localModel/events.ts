import { EventEmitter, on } from "node:events";
import type { LocalModelItem } from "@/types/localModels";

type Change = [] | [id: string, progress?: LocalModelItem["progress"]];
const changes = new EventEmitter<{ change: Change }>();

export function notifyModelCatalogChange() {
  changes.emit("change");
}

export function notifyModelChange(id: string, progress?: LocalModelItem["progress"]) {
  changes.emit("change", id, progress && { ...progress });
}

export function modelChanges(signal: AbortSignal) {
  return on(changes, "change", { signal }) as AsyncIterableIterator<Change>;
}
