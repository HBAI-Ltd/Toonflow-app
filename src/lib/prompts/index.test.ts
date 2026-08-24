import { describe, it, expect } from "vitest";
import { getSeedPrompt, getSeedVariants, SEED_PROMPT_TYPES, type LocaleText } from "./index";
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

  it("cả bốn prompt seed đã có đủ en/vi, khác hẳn văn bản zh, và chứa đúng nội dung dịch (không phải placeholder)", () => {
    // Mỗi cặp (type, locale) có một cụm từ ổn định, đặc trưng riêng cho bản dịch đó -> một
    // placeholder rỗng hay copy-paste nhầm từ locale khác sẽ làm assertion náy fail, khác với việc
    // chỉ kiểm tra length > 0 và !== zh (một placeholder bất kỳ cũng thoả cả hai điều kiện đó).
    const STABLE_SUBSTRING: Record<string, { en: string; vi: string }> = {
      eventExtraction: {
        en: "# Event Extraction Instructions",
        vi: "# Chỉ dẫn trích xuất sự kiện",
      },
      scriptAssetExtraction: {
        en: "You are a professional script content analysis assistant.",
        vi: "Bạn là trợ lý phân tích nội dung kịch bản chuyên nghiệp",
      },
      videoPromptGeneration: {
        en: "# Video Prompt Generation Skill",
        vi: "# Skill sinh prompt video",
      },
      audioBindPrompt: {
        en: "You are a voice matching assistant.",
        vi: "Bạn là trợ lý so khớp chất giọng.",
      },
    };

    const named: [string, LocaleText][] = [
      ["eventExtraction", eventExtraction],
      ["scriptAssetExtraction", scriptAssetExtraction],
      ["audioBindPrompt", audioBindPrompt],
      ["videoPromptGeneration", videoPromptGeneration],
    ];

    for (const [type, map] of named) {
      for (const locale of ["en", "vi"] as const) {
        expect(map[locale]?.length ?? 0).toBeGreaterThan(0);
        expect(map[locale]).not.toBe(map.zh);
        expect(map[locale]).toContain(STABLE_SUBSTRING[type][locale]);
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
