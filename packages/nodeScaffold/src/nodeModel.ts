import { onScopeDispose } from "vue";
import { createLocalModelClient } from "@toonflow/plugin-server/localModelClient";

export * from "@toonflow/plugin-server/localModelClient";

export function useNodeModel() {
  const lifetime = new AbortController();
  onScopeDispose(() => lifetime.abort());
  return createLocalModelClient(lifetime.signal);
}
