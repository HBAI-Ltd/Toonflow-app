import { describe, it, expect, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import { stripComments, scanText, runScan, loadRegisteredTerms, type ScanTarget } from "./i18n-scan";

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

  it("không lệch pha khi regex literal chứa cả hai loại dấu nháy (regression: /['\"]/ từng làm tokenizer coi nhầm phần còn lại của file là bên trong chuỗi)", () => {
    const src = 'const r = /^([\'"])([\\s\\S]*)\\1$/;\nconst b = 1; // 未激活';
    expect(stripComments(src)).not.toContain("未激活");
  });

  it("vẫn phát hiện CJK ở dòng sau một regex literal chứa dấu nháy", () => {
    const src = 'const r = /^([\'"])([\\s\\S]*)\\1$/;\nres.send(success("更新成功"));';
    const hits = scanText(src, { stripComments: true });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("更新成功");
  });

  it("không coi phép chia là mở đầu regex (division vs regex heuristic)", () => {
    // a / b — đây là phép chia, không phải regex; ký tự `/` thứ hai bên dưới phải
    // được coi là chia tiếp, không phải mở một regex literal mới nuốt phần còn lại.
    const src = 'const x = a / b / "更新成功";';
    expect(stripComments(src)).toContain("更新成功");
  });

  it("không lệch pha khi phép chia sau `}` có dấu `/` thứ hai cùng dòng bên trong chuỗi (regression: canStartRegex() coi `}` là điểm mở regex)", () => {
    // {a:1} / "http://x.com/y" / total — đây là phép chia (object literal rồi chia),
    // không phải regex, dù ký tự `/` thứ hai xuất hiện cùng dòng (bên trong chuỗi URL).
    // Comment CJK ở dòng SAU phải vẫn được strip đúng.
    const src = 'const rate = {a:1} / "http://x.com/y" / total;\nconst z = 1; // 后续注释2';
    expect(stripComments(src)).not.toContain("后续注释2");
  });

  it("vẫn báo hit CJK trong chuỗi thật ở dòng sau khi gặp phép chia sau `}` cùng mẫu", () => {
    const src = 'const rate = {a:1} / "http://x.com/y" / total;\nres.send(success("更新成功"));';
    const hits = scanText(src, { stripComments: true });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("更新成功");
  });

  it("regex thật trên một dòng chứa cả hai loại dấu nháy vẫn được lexer là regex, và chuỗi CJK ở dòng sau vẫn được báo", () => {
    const src = 'const r = /[\'"]/g;\nres.send(success("更新成功"));';
    const hits = scanText(src, { stripComments: true });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("更新成功");
  });

  it("regex thật chỉ chứa một dấu nháy đơn không cặp (vd. /'/g, có thật trong data/vendor/volcengineSd2.ts) vẫn được lexer đúng, không bị coi là mở một chuỗi mới lệch pha", () => {
    // Regression: bắt cặp dấu nháy một cách mù quáng bên trong ứng viên regex (fix ban
    // đầu cho lỗi phép-chia-sau-`}`) từng khiến /'/g bị từ chối làm regex vì không có
    // dấu nháy thứ hai để khớp cặp — khiến dấu `'` sau đó bị coi là mở chuỗi thật, nuốt
    // mất comment CJK ở dòng sau.
    const src = 'str.replace(/\'/g, "%27");\n// 后续注释3';
    expect(stripComments(src)).not.toContain("后续注释3");
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

describe("scanText - pragma i18n-ignore (stripComments: true, cấu hình thật của yarn i18n:scan)", () => {
  it("bỏ qua chuỗi CJK khi pragma nằm trong comment cùng dòng (regression: pragma bị strip mất trước khi kiểm tra)", () => {
    const hits = scanText('const a = "跳过这个"; // i18n-ignore', { stripComments: true });
    expect(hits).toHaveLength(0);
  });

  it("bỏ qua chuỗi CJK khi dòng ngay phía trên có pragma i18n-ignore trong comment", () => {
    const hits = scanText('// i18n-ignore\nconst a = "跳过这个";', { stripComments: true });
    expect(hits).toHaveLength(0);
  });

  it("không trả về hit bị bỏ qua trong kết quả CjkHit[], vẫn báo dòng không có pragma", () => {
    const hits = scanText(
      '// i18n-ignore\nconst a = "跳过这个";\nconst b = "不跳过";',
      { stripComments: true }
    );
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("不跳过");
  });
});

describe("scanText - pragma i18n-ignore (stripComments: false)", () => {
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

describe("scanText - dải Unicode mở rộng (fullwidth/CJK punctuation)", () => {
  it("bắt được dấu chấm câu fullwidth CJK (U+3000-303F)", () => {
    const hits = scanText('const a = "a【b】c";', { stripComments: true });
    expect(hits.map((h) => h.text)).toEqual(["【", "】"]);
  });

  it("bắt được dấu chấm câu fullwidth ASCII (U+FF00-FF60)", () => {
    const hits = scanText('const a = "x（y；z）";', { stripComments: true });
    expect(hits.map((h) => h.text).join("")).toBe("（；）");
  });

  it("vẫn bắt được ký tự Hán như trước (U+4E00-9FFF)", () => {
    const hits = scanText('const a = "你好";', { stripComments: true });
    expect(hits.map((h) => h.text)).toEqual(["你好"]);
  });
});

describe("scanLines - jsonKeyExemptions", () => {
  it("bỏ qua dòng có key nằm trong jsonKeyExemptions", () => {
    const source = '{\n  "a.b": "包含中文",\n  "c.d": "另一个中文"\n}';
    const hits = scanText(source, { stripComments: false, jsonKeyExemptions: new Set(["a.b"]) });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("另一个中文");
  });
});

// Token thật lấy từ docs/i18n/prompt-terms.json (policy keep-zh-literal), dùng làm registeredTerms
// giả lập trong test — không đọc registry thật ở đây, chỉ dùng đúng cách các token đã biết để
// dựng ca kiểm thử cho phần lồng nhau (远景 là chuỗi con của 大远景).
const SHOT_SIZE_TERMS = ["远景", "大远景", "全景", "中景", "近景", "特写", "大特写", "静止"];

describe("scanText - registeredTerms (token khớp máy trong docs/i18n/prompt-terms.json)", () => {
  // Trong file thật, token nằm giữa dấu ngoặc/pipe ASCII (vd. "Extreme wide shot (远景)"), nên mỗi
  // chuỗi CJK khớp regex CJK đúng bằng một token — dùng dấu ngoặc ASCII ở đây để mô phỏng đúng ranh
  // giới đó, tránh dấu câu fullwidth (，。：) nối liền các token thành một match CJK duy nhất.
  it("bỏ qua chuỗi CJK chỉ gồm một token đã đăng ký", () => {
    const hits = scanText("Shot size (远景), stay (静止).", { stripComments: false, registeredTerms: SHOT_SIZE_TERMS });
    expect(hits).toHaveLength(0);
  });

  it("vẫn báo chuỗi CJK có phần NGOÀI token đã đăng ký, dù có chứa một token đã đăng ký", () => {
    // "中全景" = "中" (chưa đăng ký) + "全景" (đã đăng ký) — phần "中" phải khiến hit vẫn bị báo.
    const hits = scanText("Shot size (中全景).", { stripComments: false, registeredTerms: SHOT_SIZE_TERMS });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("中全景");
  });

  it("token lồng nhau: 远景 là chuỗi con của 大远景 — 大远景 (cả hai đều đã đăng ký) vẫn được bỏ qua nguyên vẹn", () => {
    const hits = scanText("Shot size (大远景).", { stripComments: false, registeredTerms: SHOT_SIZE_TERMS });
    expect(hits).toHaveLength(0);
  });

  it("token lồng nhau nhưng có phần thừa chưa đăng ký vẫn phải báo", () => {
    // "超大远景" = "超" (chưa đăng ký) + "大远景" (đã đăng ký) — phần "超" phải khiến hit vẫn bị báo.
    const hits = scanText("Shot size (超大远景).", { stripComments: false, registeredTerms: SHOT_SIZE_TERMS });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("超大远景");
  });

  it("không có registeredTerms (undefined) thì hành vi y hệt trước đây — mọi CJK đều bị báo", () => {
    const hits = scanText("Shot size (远景), stay (静止).", { stripComments: false });
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.text)).toEqual(["远景", "静止"]);
  });

  it("pragma i18n-ignore vẫn hoạt động y như cũ khi registeredTerms có mặt (chuỗi chưa dịch thật, không phải token)", () => {
    const hits = scanText('const a = "未翻译文本"; // i18n-ignore', {
      stripComments: true,
      registeredTerms: SHOT_SIZE_TERMS,
    });
    expect(hits).toHaveLength(0);
  });

  it("pragma i18n-ignore không che giấu chuỗi chưa dịch thật khi KHÔNG có pragma, dù registeredTerms có mặt", () => {
    const hits = scanText('const a = "未翻译文本";', { stripComments: true, registeredTerms: SHOT_SIZE_TERMS });
    expect(hits).toHaveLength(1);
    expect(hits[0].text).toBe("未翻译文本");
  });
});

describe("loadRegisteredTerms", () => {
  it("đọc registry lúc chạy — không hardcode danh sách token", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-scan-registry-"));
    try {
      fs.mkdirSync(path.join(dir, "docs/i18n"), { recursive: true });
      fs.writeFileSync(
        path.join(dir, "docs/i18n/prompt-terms.json"),
        JSON.stringify({
          terms: [
            { zh: "远景", policy: "keep-zh-literal" },
            { zh: "已完成", policy: "never-translate" },
            { zh: "duration", policy: "never-translate" }, // ASCII thuần — không phải CJK, phải bị loại
            { zh: "推进", policy: "translate-label" }, // policy khác — không phải literal, phải bị loại
          ],
        }),
      );
      const terms = loadRegisteredTerms(dir);
      expect(terms.sort()).toEqual(["已完成", "远景"]);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("runScan - phạm vi áp dụng registeredTerms (chỉ hai target sidecar skill, không lan sang target khác)", () => {
  let dir: string;

  afterEach(() => {
    if (dir) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("bỏ qua token đăng ký trong data/skills/**/README.en.md nhưng vẫn báo cùng chuỗi đó trong src/**/*.ts", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-scan-runscan-"));
    fs.mkdirSync(path.join(dir, "data/skills/foo"), { recursive: true });
    fs.mkdirSync(path.join(dir, "src"), { recursive: true });
    fs.writeFileSync(path.join(dir, "data/skills/foo/README.en.md"), "Shot size: 远景, stay 静止.\n");
    fs.writeFileSync(path.join(dir, "src/example.ts"), 'const shot = "远景"; // not a comment CJK\n');

    const targets: ScanTarget[] = [
      { glob: "data/skills/**/README.en.md", stripComments: false, registeredTerms: ["远景", "静止"] },
      { glob: "src/**/*.ts", stripComments: true },
    ];
    const result = await runScan(dir, targets);
    expect(result.total).toBe(1);
    expect(result.hits).toHaveLength(1);
    expect(result.hits[0].file).toBe("src/example.ts");
    expect(result.hits[0].text).toBe("远景");
  });

  it("chuỗi chưa dịch thật trong README.en.md (không phải token đăng ký) vẫn bị báo", async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-scan-runscan-real-"));
    fs.mkdirSync(path.join(dir, "data/skills/foo"), { recursive: true });
    fs.writeFileSync(path.join(dir, "data/skills/foo/README.en.md"), "Shot size: 远景, but this line 未翻译.\n");

    const targets: ScanTarget[] = [
      { glob: "data/skills/**/README.en.md", stripComments: false, registeredTerms: ["远景"] },
    ];
    const result = await runScan(dir, targets);
    expect(result.total).toBe(1);
    expect(result.hits[0].text).toBe("未翻译");
  });
});
