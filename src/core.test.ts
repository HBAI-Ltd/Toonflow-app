import { describe, it, expect } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { isRouteModule } from "./core";

/**
 * `src/core.ts` sinh `src/router.ts` bằng cách glob mọi file .ts dưới src/routes.
 * Một module tiện ích đặt nhầm chỗ (không có `export default`) sẽ sinh ra
 * `app.use(path, undefined)` và app chết ngay lúc khởi động với
 * "argument handler must be a function".
 *
 * Không test nào bắt được lỗi đó vì `yarn test` và `yarn lint` đều không khởi
 * động server. Các test dưới đây khoá lại bộ lọc.
 */
describe("isRouteModule", () => {
  let dir: string;
  const write = (name: string, body: string) => {
    dir ??= fs.mkdtempSync(path.join(os.tmpdir(), "core-test-"));
    const p = path.join(dir, name);
    fs.writeFileSync(p, body, "utf-8");
    return p;
  };

  it("nhận file có export default là hàm", () => {
    expect(isRouteModule(write("a.ts", 'export default function h() {}\n'))).toBe(true);
  });

  it("nhận export default dạng biểu thức", () => {
    expect(isRouteModule(write("b.ts", 'const r = 1;\nexport default r;\n'))).toBe(true);
  });

  it("LOẠI module tiện ích chỉ có named export", () => {
    expect(isRouteModule(write("c.ts", 'export function isShipped() { return true; }\n'))).toBe(false);
  });

  it("không bị đánh lừa bởi chữ 'export default' trong bình luận", () => {
    expect(isRouteModule(write("d.ts", '// export default không nằm ở đây\nexport const x = 1;\n'))).toBe(false);
  });

  it("không bị đánh lừa bởi 'export default' trong chuỗi", () => {
    expect(isRouteModule(write("e.ts", 'export const s = "export default foo";\n'))).toBe(false);
  });

  it("nhận `export { x as default }`", () => {
    expect(isRouteModule(write("f.ts", 'const x = 1;\nexport { x as default };\n'))).toBe(true);
  });
});
