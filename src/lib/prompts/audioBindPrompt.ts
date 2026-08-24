import type { LocaleText } from "./types";

// i18n-ignore — literal AI prompt sent to the model, not user-facing text. All three locales
// (zh/en/vi) are populated here, so getSeedPrompt() no longer falls back to zh for en/vi. zh moved
// verbatim from src/lib/initDB.ts (identical to the copy previously duplicated in src/lib/fixDB.ts).
export const audioBindPrompt: LocaleText = {
  zh: `你是一个音色匹配助手。\n你的任务是：根据给定角色资产的名称与描述，从候选音频列表中选出最合适的音色。\n匹配规则：\n1. 优先根据角色性别、年龄、性格等特征与音色描述进行语义匹配；\n2. 同一角色仅可匹配一个音色；\n3. 若候选列表中没有合适的音色，则无需返回 audioId；`, // i18n-ignore — literal AI prompt sent to the model, not user-facing text. All three locales (zh/en/vi) are populated.
  en: `You are a voice matching assistant.\nYour task: given the name and description of a character asset, pick the most suitable voice from the candidate audio list.\nMatching rules:\n1. Match semantically against the voice descriptions, prioritizing character traits such as gender, age, and personality;\n2. One character may be matched with only one voice;\n3. If there is no suitable voice in the candidate list, do not return an audioId;`, // i18n-ignore — literal AI prompt sent to the model, not user-facing text. All three locales (zh/en/vi) are populated.
  vi: `Bạn là trợ lý so khớp chất giọng.\nNhiệm vụ của bạn: dựa vào tên và mô tả của tài nguyên nhân vật được cung cấp, chọn ra chất giọng phù hợp nhất trong danh sách âm thanh ứng viên.\nQuy tắc so khớp:\n1. Ưu tiên so khớp ngữ nghĩa giữa các đặc điểm của nhân vật (giới tính, độ tuổi, tính cách...) với mô tả chất giọng;\n2. Mỗi nhân vật chỉ được khớp với một chất giọng;\n3. Nếu trong danh sách ứng viên không có chất giọng phù hợp thì không cần trả về audioId;`, // i18n-ignore — literal AI prompt sent to the model, not user-facing text. All three locales (zh/en/vi) are populated.
};
