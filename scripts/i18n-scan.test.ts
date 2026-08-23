import { describe, it, expect } from "vitest";
import { stripComments, scanText } from "./i18n-scan";

describe("stripComments", () => {
  it("bỏ comment dòng", () => {
    expect(stripComments('const a = 1; // 停止消息')).not.toContain("停止");
  });

  it("bỏ comment khối", () => {
    expect(stripComments("/* 处理未捕获的异常 */\nconst a = 1;")).not.toContain("处理");
  });

  it("giữ lại chuỗi trông giống comment", () => {
    expect(stripComments('const a = "http://x/y // 更新成功";')).toContain("更新成功");
  });
});

describe("scanText", () => {
  it("báo chuỗi CJK trong mã", () => {
    const hits = scanText('res.send(success("更新成功"));', { stripComments: true });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("更新成功");
    expect(hits[0].line).toBe(1);
  });

  it("bỏ qua CJK nằm trong comment khi được yêu cầu", () => {
    expect(scanText("// 停止消息", { stripComments: true })).toHaveLength(0);
  });

  it("báo CJK trong comment khi không strip", () => {
    expect(scanText("// 停止消息", { stripComments: false })).toHaveLength(1);
  });
});

describe("scanText - pragma i18n-ignore", () => {
  it("bỏ qua chuỗi CJK trên dòng có pragma i18n-ignore", () => {
    const hits = scanText('const a = "跳过这个"; // i18n-ignore', { stripComments: false });
    expect(hits).toHaveLength(0);
  });

  it("bỏ qua chuỗi CJK khi dòng ngay phía trên có pragma i18n-ignore", () => {
    const hits = scanText('// i18n-ignore\nconst a = "跳过这个";', { stripComments: false });
    expect(hits).toHaveLength(0);
  });

  it("không trả về hit bị bỏ qua trong kết quả CjkHit[]", () => {
    const hits = scanText(
      '// i18n-ignore\nconst a = "跳过这个";\nconst b = "不跳过";',
      { stripComments: false }
    );
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("不跳过");
  });
});
