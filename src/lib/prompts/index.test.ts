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

  it("locale đã có bản dịch thì trả về đúng bản dịch đó, chưa có thì fallback về zh", () => {
    for (const type of ALL_TYPES) {
      const map = { eventExtraction, scriptAssetExtraction, videoPromptGeneration, audioBindPrompt }[type];
      const zhText = getSeedPrompt(type, "zh");
      expect(zhText.length).toBeGreaterThan(0);
      for (const locale of ALL_LOCALES) {
        const own = map[locale];
        expect(getSeedPrompt(type, locale)).toBe(own !== undefined && own !== "" ? own : zhText);
      }
    }
  });

  it("ba prompt seed nhỏ đã có đủ en/vi và khác hẳn văn bản zh", () => {
    for (const map of [eventExtraction, scriptAssetExtraction, audioBindPrompt]) {
      for (const locale of ["en", "vi"] as const) {
        expect(map[locale]?.length ?? 0).toBeGreaterThan(0);
        expect(map[locale]).not.toBe(map.zh);
      }
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
