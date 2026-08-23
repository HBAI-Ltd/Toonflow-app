import { describe, it, expect } from "vitest";
import { success, error } from "./responseFormat";

describe("success", () => {
  // Known limitation, not a specification: success() is sync with no locale
  // parameter, so it always falls back to DEFAULT_LOCALE (en) regardless of
  // the request's actual locale. vi/zh callers currently get an English
  // message unless they pass one explicitly. See the i18n-ignore comment on
  // success() in responseFormat.ts.
  it("khi không truyền locale, luôn rơi về tiếng Anh mặc định (hạn chế đã biết, chưa phải hành vi đúng)", () => {
    expect(success(null).message).toBe("Success");
  });

  it("giữ nguyên thông báo được truyền vào", () => {
    expect(success(null, "Đã cập nhật").message).toBe("Đã cập nhật");
  });

  it("giữ nguyên code và data", () => {
    expect(success({ a: 1 })).toMatchObject({ code: 200, data: { a: 1 } });
  });
});

describe("error", () => {
  it("giữ code 400", () => {
    expect(error("boom")).toMatchObject({ code: 400, message: "boom", data: null });
  });
});
