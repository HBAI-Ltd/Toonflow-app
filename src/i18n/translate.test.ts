import { describe, it, expect } from "vitest";
import { t, isLocale } from "./translate";
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

  it("lùi về zh khi locale thiếu khoá", () => {
    expect(t("test.onlyInZh", {}, "en")).toBe("仅中文");
  });

  it("trả về chính key khi không locale nào có", () => {
    expect(t("khong.ton.tai", {}, "en")).toBe("khong.ton.tai");
  });
});
