import { describe, it, expect } from "vitest";
import { localeFromHeader } from "./locale";

describe("localeFromHeader", () => {
  it("nhận locale hợp lệ", () => {
    expect(localeFromHeader("vi")).toBe("vi");
    expect(localeFromHeader("EN")).toBe("en");
  });

  it("ánh xạ mã đầy đủ của giao diện về locale backend", () => {
    expect(localeFromHeader("vi-VN")).toBe("vi");
    expect(localeFromHeader("zh-CN")).toBe("zh");
    expect(localeFromHeader("en-US")).toBe("en");
  });

  it("trả null với giá trị không hỗ trợ", () => {
    expect(localeFromHeader("ja-JP")).toBeNull();
    expect(localeFromHeader(undefined)).toBeNull();
    expect(localeFromHeader(["vi"])).toBeNull();
  });
});
