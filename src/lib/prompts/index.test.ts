import { describe, it, expect } from "vitest";
import { getSeedPrompt, getSeedVariants, SEED_PROMPT_TYPES } from "./index";
import { eventExtraction } from "./eventExtraction";
import { scriptAssetExtraction } from "./scriptAssetExtraction";
import { videoPromptGeneration } from "./videoPromptGeneration";
import { audioBindPrompt } from "./audioBindPrompt";

const ALL_TYPES = SEED_PROMPT_TYPES;
const ALL_LOCALES = ["en", "vi", "zh"] as const;

describe("getSeedPrompt — locale resolution", () => {
  it("trả về đúng văn bản zh cho từng loại prompt", () => {
    expect(getSeedPrompt("eventExtraction", "zh")).toBe(eventExtraction.zh);
    expect(getSeedPrompt("scriptAssetExtraction", "zh")).toBe(scriptAssetExtraction.zh);
    expect(getSeedPrompt("videoPromptGeneration", "zh")).toBe(videoPromptGeneration.zh);
    expect(getSeedPrompt("audioBindPrompt", "zh")).toBe(audioBindPrompt.zh);
  });

  it("en/vi chưa có nội dung, mọi locale đều fallback về đúng văn bản zh", () => {
    for (const type of ALL_TYPES) {
      const zhText = getSeedPrompt(type, "zh");
      expect(zhText.length).toBeGreaterThan(0);
      for (const locale of ALL_LOCALES) {
        expect(getSeedPrompt(type, locale)).toBe(zhText);
      }
    }
  });

  it("en/vi rỗng hoặc không tồn tại trong LocaleText của từng prompt", () => {
    for (const type of ALL_TYPES) {
      const map = { eventExtraction, scriptAssetExtraction, videoPromptGeneration, audioBindPrompt }[type];
      expect(map.en ?? "").toBe("");
      expect(map.vi ?? "").toBe("");
    }
  });
});

describe("getSeedVariants", () => {
  it("chứa văn bản zh hiện tại của mỗi loại prompt", () => {
    for (const type of ALL_TYPES) {
      const variants = getSeedVariants(type);
      expect(variants).toContain(getSeedPrompt(type, "zh"));
    }
  });

  it("không có phần tử trùng lặp", () => {
    for (const type of ALL_TYPES) {
      const variants = getSeedVariants(type);
      expect(new Set(variants).size).toBe(variants.length);
    }
  });
});
