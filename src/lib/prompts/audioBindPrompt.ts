import type { LocaleText } from "./types";

// i18n-ignore — literal AI prompt sent to the model, not user-facing text. en/vi are pending — only
// zh is populated here; getSeedPrompt() falls back to zh for those locales until a later task fills
// them in. Moved verbatim from src/lib/initDB.ts (identical to the copy previously duplicated in
// src/lib/fixDB.ts).
export const audioBindPrompt: LocaleText = {
  zh: `你是一个音色匹配助手。\n你的任务是：根据给定角色资产的名称与描述，从候选音频列表中选出最合适的音色。\n匹配规则：\n1. 优先根据角色性别、年龄、性格等特征与音色描述进行语义匹配；\n2. 同一角色仅可匹配一个音色；\n3. 若候选列表中没有合适的音色，则无需返回 audioId；`, // i18n-ignore — literal AI prompt sent to the model, not user-facing text. en/vi pending.
};
