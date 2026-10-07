import type { NodeAiModel } from "@toonflow/nodes-scaffold/nodeAi";

export function groupNodeModels<T extends Pick<NodeAiModel, "providerId" | "providerLabel">>(models: readonly T[]) {
  return [...Map.groupBy(models, item => item.providerId)].map(([id, items]) => ({
    id, label: items[0]!.providerLabel, models: items,
  })).sort((left, right) => Number(right.id === "tfRouter") - Number(left.id === "tfRouter"));
}
