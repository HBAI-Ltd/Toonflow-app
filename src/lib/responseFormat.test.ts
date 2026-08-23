import { describe, it, expect } from "vitest";
import { success, error } from "./responseFormat";

describe("success", () => {
  it("mặc định trả thông báo tiếng Anh", () => {
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
