import { describe, it, expect } from "vitest";
import { t, isLocale, createTranslator } from "./translate";
import { DEFAULT_LOCALE, FALLBACK_LOCALE, LOCALES } from "./types";

describe("hằng số locale", () => {
  it("có đúng ba locale", () => {
    expect([...LOCALES]).toEqual(["en", "vi", "zh"]);
    expect(DEFAULT_LOCALE).toBe("en");
    expect(FALLBACK_LOCALE).toBe("zh");
  });

  it("isLocale nhận đúng giá trị hợp lệ", () => {
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("t", () => {
  it("tra được chuỗi theo locale", () => {
    expect(t("common.success", {}, "en")).toBe("Success");
    expect(t("common.success", {}, "vi")).toBe("Thành công");
    expect(t("common.success", {}, "zh")).toBe("成功");
  });

  it("nội suy biến", () => {
    expect(t("common.itemCount", { count: 3 }, "en")).toBe("3 items");
  });

  it("trả về chính key khi không locale nào có", () => {
    expect(t("khong.ton.tai", {}, "en")).toBe("khong.ton.tai");
  });
});

// Uses a synthetic fixture catalog via createTranslator() instead of a test-only key checked
// into the shipped src/i18n/locales/zh.json — that file ships in the app bundle, so it should
// only ever hold real translations.
describe("createTranslator — fallback về locale mặc định (FALLBACK_LOCALE)", () => {
  it("lùi về zh khi locale được yêu cầu thiếu khoá", () => {
    const translate = createTranslator({
      en: {},
      vi: {},
      zh: { "test.onlyInZh": "仅中文" },
    });
    expect(translate("test.onlyInZh", {}, "en")).toBe("仅中文");
  });
});
