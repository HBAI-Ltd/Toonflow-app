import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  occurrences,
  countCJK,
  extractLiteralTerms,
  extractHeadingLevels,
  countTableLines,
  countCodeFences,
  countImageRefs,
  stripLiteralTerms,
  checkSidecarFile,
  checkCJKBudgetForFile,
  checkSidecars,
  buildBudget,
  normalizeBudgetLocale,
  validateLiteralAllowance,
  type Budget,
} from "./i18n-check-sidecars";

describe("occurrences", () => {
  it("đếm chuỗi con thô, không dedupe", () => {
    expect(occurrences("远景", "远景 大远景 远景")).toBe(3); // "大远景" cũng chứa "远景" nên tính cả
  });
  it("trả 0 khi needle rỗng hoặc không xuất hiện", () => {
    expect(occurrences("", "abc")).toBe(0);
    expect(occurrences("xyz", "abc")).toBe(0);
  });
});

describe("countCJK", () => {
  it("đếm đúng ký tự CJK, bỏ qua ASCII", () => {
    expect(countCJK("苏晚卿 is a character. 凌玄 too.")).toBe(5);
  });
  it("trả 0 khi không có CJK", () => {
    expect(countCJK("hello world")).toBe(0);
  });
});

describe("extractLiteralTerms", () => {
  it("chỉ lấy entry keep-zh-literal / never-translate có zh chứa CJK", () => {
    const registry = {
      terms: [
        { zh: "远景", policy: "keep-zh-literal" },
        { zh: "大远景", policy: "never-translate" },
        { zh: "duration", policy: "never-translate" }, // không có CJK, phải bị loại
        { zh: "近景", policy: "translate-label" }, // policy khác, phải bị loại
      ],
    };
    expect(extractLiteralTerms(registry)).toEqual(["远景", "大远景"]);
  });

  it("khử trùng lặp zh giống hệt nhau", () => {
    const registry = {
      terms: [
        { zh: "远景", policy: "keep-zh-literal" },
        { zh: "远景", policy: "never-translate" },
      ],
    };
    expect(extractLiteralTerms(registry)).toEqual(["远景"]);
  });
});

describe("extractHeadingLevels", () => {
  it("đọc đúng chuỗi cấp heading ATX", () => {
    const text = "# A\n## B\n### C\n### D\n## E\nkhông phải heading";
    expect(extractHeadingLevels(text)).toEqual([1, 2, 3, 3, 2]);
  });

  it("bỏ qua dòng # bên trong khối code, không tính là heading", () => {
    const text = ["# Real heading", "```bash", "# đây là comment bash, không phải heading", "echo hi", "```", "## Real heading 2"].join("\n");
    expect(extractHeadingLevels(text)).toEqual([1, 2]);
  });
});

describe("countTableLines", () => {
  it("đếm dòng bắt đầu bằng | sau khi trim", () => {
    const text = "| a | b |\n|---|---|\n| 1 | 2 |\nkhông phải bảng";
    expect(countTableLines(text)).toBe(3);
  });

  it("bỏ qua dòng bắt đầu bằng | bên trong khối code", () => {
    const text = ["| thật | bảng |", "```", "| giả | trong code |", "```"].join("\n");
    expect(countTableLines(text)).toBe(1);
  });
});

describe("countCodeFences", () => {
  it("đếm số hàng rào ```", () => {
    const text = "```bash\necho hi\n```\ntext\n```\nfoo\n```";
    expect(countCodeFences(text)).toBe(4);
  });
});

describe("countImageRefs", () => {
  it("đếm token @图N và @图片N", () => {
    const text = "xem @图1 và @图片23 rồi @图片4";
    expect(countImageRefs(text)).toBe(3);
  });
});

describe("stripLiteralTerms", () => {
  it("xoá đúng cả token lồng nhau bất kể thứ tự truyền vào (luôn xoá token dài nhất trước)", () => {
    expect(stripLiteralTerms("远景 大远景 近景", ["远景", "大远景"])).toBe("  近景");
    expect(stripLiteralTerms("远景 大远景 近景", ["大远景", "远景"])).toBe("  近景");
  });
});

describe("checkSidecarFile — literal preservation", () => {
  it("báo fail khi literal bị dịch mất, thông báo nêu đúng token và cả hai số đếm", () => {
    const zh = "中景 中景 中景 中景 中景"; // 5 lần
    const en = "medium shot 中景 中景 medium shot medium"; // chỉ còn 3 lần
    const problems = checkSidecarFile(zh, en, ["中景"]);
    const literalProblems = problems.filter((p) => p.check === "literal");
    expect(literalProblems).toHaveLength(1);
    expect(literalProblems[0].detail).toContain("中景");
    expect(literalProblems[0].detail).toContain("3");
    expect(literalProblems[0].detail).toContain("5");
  });

  it("pass khi literal giữ nguyên số lần", () => {
    const zh = "远景 一段文字 远景";
    const en = "wide shot 远景 text 远景";
    const problems = checkSidecarFile(zh, en, ["远景"]);
    expect(problems.filter((p) => p.check === "literal")).toEqual([]);
  });

  it("đếm đúng token lồng nhau 远景 bên trong 大远景", () => {
    // bản gốc: 远景 xuất hiện thô 3 lần (1 độc lập + 2 lồng trong 大远景 x2), 大远景 xuất hiện 2 lần
    const zh = "远景 大远景 大远景";
    // bản dịch giữ nguyên toàn bộ chuỗi zh -> phải pass cả hai token
    const en = "wide shot 远景 大远景 大远景";
    const problems = checkSidecarFile(zh, en, ["远景", "大远景"]);
    expect(problems.filter((p) => p.check === "literal")).toEqual([]);
  });

  it("fail khi token lồng nhau bị dịch mất một phần", () => {
    const zh = "远景 大远景 大远景"; // 远景: 3 lần thô, 大远景: 2 lần
    const en = "wide shot 远景 大远景"; // mất một 大远景 -> 远景 còn 2 lần thô, 大远景 còn 1 lần
    const problems = checkSidecarFile(zh, en, ["远景", "大远景"]);
    const literalProblems = problems.filter((p) => p.check === "literal");
    expect(literalProblems.length).toBeGreaterThanOrEqual(1);
    const terms = literalProblems.map((p) => p.detail);
    expect(terms.some((d) => d.includes("大远景"))).toBe(true);
  });
});

describe("checkSidecarFile — structural parity", () => {
  it("fail khi lệch chuỗi cấp heading (không chỉ lệch số lượng)", () => {
    const zh = "# A\n## B\n## C\n### D";
    const en = "# A\n## B\n### C\n## D"; // cùng 4 heading, nhưng cấp 3/2 đảo chỗ
    const problems = checkSidecarFile(zh, en, []);
    const structProblems = problems.filter((p) => p.check === "structure" && p.detail.includes("heading"));
    expect(structProblems).toHaveLength(1);
  });

  it("pass khi chuỗi cấp heading khớp hệt", () => {
    const zh = "# A\n## B\n## C\n### D";
    const en = "# A2\n## B2\n## C2\n### D2";
    const problems = checkSidecarFile(zh, en, []);
    expect(problems.filter((p) => p.check === "structure" && p.detail.includes("heading"))).toEqual([]);
  });

  it("fail khi số dòng bảng khác nhau", () => {
    const zh = "| a | b |\n|---|---|\n| 1 | 2 |";
    const en = "| a | b |\n|---|---|";
    const problems = checkSidecarFile(zh, en, []);
    expect(problems.some((p) => p.check === "structure" && p.detail.includes("bảng"))).toBe(true);
  });

  it("fail khi số hàng rào code khác nhau", () => {
    const zh = "```\ncode\n```";
    const en = "text không có code";
    const problems = checkSidecarFile(zh, en, []);
    expect(problems.some((p) => p.check === "structure" && p.detail.toLowerCase().includes("hàng rào"))).toBe(true);
  });

  it("fail khi số token ảnh @图N khác nhau", () => {
    const zh = "xem @图1 và @图片2";
    const en = "see @图1";
    const problems = checkSidecarFile(zh, en, []);
    expect(problems.some((p) => p.check === "structure" && p.detail.includes("ảnh"))).toBe(true);
  });

  it("không tính dòng # trong khối code là heading khi so parity", () => {
    const zh = ["# Real", "```bash", "# comment", "```", "## Real2"].join("\n");
    const en = ["# Real", "```bash", "# comment translated but still not heading", "```", "## Real2"].join("\n");
    const problems = checkSidecarFile(zh, en, []);
    expect(problems.filter((p) => p.check === "structure" && p.detail.includes("heading"))).toEqual([]);
  });
});

describe("checkCJKBudgetForFile", () => {
  it("pass khi CJK còn sót đúng bằng ngân sách", () => {
    const translated = "text 苏晚卿 more text"; // 3 ký tự CJK còn sót sau khi strip literalTerms=[]
    const result = checkCJKBudgetForFile(translated, [], 3);
    expect(result.actual).toBe(3);
    expect(result.problem).toBeUndefined();
    expect(result.isNew).toBe(false);
  });

  it("fail khi CJK còn sót vượt ngân sách dù chỉ 1 ký tự", () => {
    const translated = "text 苏晚卿凌 more"; // 4 ký tự CJK
    const result = checkCJKBudgetForFile(translated, [], 3);
    expect(result.actual).toBe(4);
    expect(result.problem).toBeDefined();
    expect(result.problem?.check).toBe("cjk-budget");
  });

  it("không fail khi file chưa có trong budget, đánh dấu isNew", () => {
    const translated = "text 苏晚卿凌玄 more"; // 5 CJK, không có ngân sách ghi trước
    const result = checkCJKBudgetForFile(translated, [], undefined);
    expect(result.problem).toBeUndefined();
    expect(result.isNew).toBe(true);
    expect(result.actual).toBe(5);
  });

  it("strip literal terms trước khi đếm CJK còn sót", () => {
    const translated = "远景 苏晚卿"; // 远景 là literal term (giữ nguyên, không tính), 苏晚卿 là CJK còn sót thật
    const result = checkCJKBudgetForFile(translated, ["远景"], 3);
    expect(result.actual).toBe(3);
    expect(result.problem).toBeUndefined();
  });
});

describe("checkSidecars — end-to-end trên thư mục tạm", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function write(relPath: string, content: string) {
    const abs = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  }

  it("báo sạch với bộ ba hợp lệ, đủ trong ngân sách", () => {
    write("skills/a/foo.md", "# A\n远景 苏晚卿");
    write("skills/a/foo.en.md", "# A\n远景 (wide shot) — Su Wanqing");
    write("skills/a/foo.vi.md", "# A\n远景 (toàn cảnh) — Tô Vãn Khanh");
    const skillsDir = path.join(dir, "skills");
    const budget: Budget = {
      "skills/a/foo.md": { en: countCJK("(wide shot) — Su Wanqing"), vi: countCJK("(toàn cảnh) — Tô Vãn Khanh") },
    };
    const report = checkSidecars(dir, skillsDir, ["远景"], budget);
    expect(report.hasHardFail).toBe(false);
    expect(report.missingSidecars).toEqual([]);
    expect(report.newInBudget).toEqual([]);
  });

  it("liệt kê bản gốc thiếu sidecar mà không fail", () => {
    write("skills/a/foo.md", "# A\n nội dung");
    const skillsDir = path.join(dir, "skills");
    const report = checkSidecars(dir, skillsDir, [], {});
    expect(report.hasHardFail).toBe(false);
    expect(report.missingSidecars).toContain("skills/a/foo.md");
  });

  it("file chưa có trong budget không fail, xuất hiện trong danh sách file mới", () => {
    write("skills/a/foo.md", "# A\n苏晚卿");
    write("skills/a/foo.en.md", "# A\nSu Wanqing");
    write("skills/a/foo.vi.md", "# A\nTo Van Khanh");
    const skillsDir = path.join(dir, "skills");
    const report = checkSidecars(dir, skillsDir, [], {});
    expect(report.hasHardFail).toBe(false);
    expect(report.newInBudget).toContain("skills/a/foo.md");
  });

  it("fail cứng khi literal bị dịch mất trong bộ ba thật", () => {
    write("skills/a/foo.md", "# A\n中景 中景");
    write("skills/a/foo.en.md", "# A\nmedium shot");
    write("skills/a/foo.vi.md", "# A\n中景 中景");
    const skillsDir = path.join(dir, "skills");
    const report = checkSidecars(dir, skillsDir, ["中景"], {});
    expect(report.hasHardFail).toBe(true);
    const enFile = report.files.find((f) => f.file === "skills/a/foo.en.md");
    expect(enFile?.problems.some((p) => p.check === "literal")).toBe(true);
  });
});

describe("buildBudget", () => {
  it("ghi CJK còn sót, key đã sắp theo alphabet", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-update-"));
    try {
      fs.mkdirSync(path.join(dir, "skills/z"), { recursive: true });
      fs.mkdirSync(path.join(dir, "skills/a"), { recursive: true });
      fs.writeFileSync(path.join(dir, "skills/z/foo.md"), "内容");
      fs.writeFileSync(path.join(dir, "skills/z/foo.en.md"), "苏晚卿");
      fs.writeFileSync(path.join(dir, "skills/z/foo.vi.md"), "凌玄凌玄");
      fs.writeFileSync(path.join(dir, "skills/a/bar.md"), "内容");
      fs.writeFileSync(path.join(dir, "skills/a/bar.en.md"), "no cjk here");
      fs.writeFileSync(path.join(dir, "skills/a/bar.vi.md"), "no cjk here either");
      const skillsDir = path.join(dir, "skills");
      const budget = buildBudget(dir, skillsDir, []);
      expect(Object.keys(budget)).toEqual(["skills/a/bar.md", "skills/z/foo.md"]);
      expect(budget["skills/z/foo.md"]).toEqual({ en: 3, vi: 4 });
      expect(budget["skills/a/bar.md"]).toEqual({ en: 0, vi: 0 });
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("chỉ ghi ngân sách cho bộ ba có đủ cả en và vi", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-update2-"));
    try {
      fs.mkdirSync(path.join(dir, "skills/a"), { recursive: true });
      fs.writeFileSync(path.join(dir, "skills/a/onlyzh.md"), "内容");
      const skillsDir = path.join(dir, "skills");
      const budget = buildBudget(dir, skillsDir, []);
      expect(budget).toEqual({});
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// D1 — miễn trừ literal theo file/token (literalAllowance)
// ---------------------------------------------------------------------------

describe("normalizeBudgetLocale", () => {
  it("chuẩn hoá dạng number cũ thành residualCjk, literalAllowance rỗng", () => {
    expect(normalizeBudgetLocale(12)).toEqual({ residualCjk: 12, literalAllowance: {} });
  });

  it("chuẩn hoá dạng object mới, giữ nguyên literalAllowance", () => {
    const raw = { residualCjk: 5, literalAllowance: { "推进": { expected: 0, reason: "abc" } } };
    expect(normalizeBudgetLocale(raw)).toEqual({ residualCjk: 5, literalAllowance: raw.literalAllowance });
  });

  it("trả undefined khi input undefined (file chưa có trong budget)", () => {
    expect(normalizeBudgetLocale(undefined)).toBeUndefined();
  });
});

describe("validateLiteralAllowance", () => {
  it("báo lỗi khi thiếu reason, reason rỗng, hoặc reason chỉ khoảng trắng", () => {
    const errors = validateLiteralAllowance({
      "推进": { expected: 0, reason: "" },
      "固定": { expected: 0, reason: "   " },
      "拉远": { expected: 0 } as unknown as { expected: number; reason: string },
    });
    expect(errors).toHaveLength(3);
    for (const e of errors) expect(e.toLowerCase()).toContain("reason");
  });

  it("pass khi mọi miễn trừ có reason không rỗng", () => {
    const errors = validateLiteralAllowance({
      "推进": { expected: 0, reason: "bản gốc dùng 推进叙事 theo nghĩa văn xuôi" },
    });
    expect(errors).toEqual([]);
  });
});

describe("checkSidecarFile — literalAllowance ghi đè số đếm yêu cầu (D1)", () => {
  it("dùng expected trong literalAllowance thay vì số đếm bản gốc khi token là văn xuôi", () => {
    const zh = "如果立刻推进叙事，笑声会被剪断"; // 推进 xuất hiện 1 lần, nghĩa văn xuôi
    const en = "If you advance the narrative at once, the laughter is cut off"; // không còn 推进
    const problems = checkSidecarFile(zh, en, ["推进"], {
      "推进": { expected: 0, reason: "bản gốc dùng 推进叙事 theo nghĩa văn xuôi (đẩy mạch truyện), không phải giá trị vận máy" },
    });
    expect(problems.filter((p) => p.check === "literal")).toEqual([]);
  });

  it("vẫn fail nếu số đếm thực tế khác expected trong miễn trừ", () => {
    const zh = "推进 推进";
    const en = "advance 推进"; // còn 1 lần, miễn trừ yêu cầu 0
    const problems = checkSidecarFile(zh, en, ["推进"], { "推进": { expected: 0, reason: "lý do hợp lệ" } });
    const literalProblems = problems.filter((p) => p.check === "literal");
    expect(literalProblems).toHaveLength(1);
    expect(literalProblems[0].detail).toContain("miễn trừ");
  });

  it("không có miễn trừ thì hành vi giữ nguyên như cũ: phải bằng số đếm bản gốc", () => {
    const zh = "推进 推进";
    const en = "推进"; // chỉ còn 1 trong khi bản gốc 2, không miễn trừ
    const problems = checkSidecarFile(zh, en, ["推进"]);
    expect(problems.filter((p) => p.check === "literal")).toHaveLength(1);
  });

  it("thông báo lỗi literal gợi ý cả hai lối thoát: khôi phục token hoặc thêm miễn trừ", () => {
    const zh = "中景 中景";
    const en = "medium shot";
    const problems = checkSidecarFile(zh, en, ["中景"]);
    const detail = problems.find((p) => p.check === "literal")!.detail;
    expect(detail).toContain("khôi phục");
    expect(detail).toContain("miễn trừ");
  });
});

describe("checkSidecars — literalAllowance từ budget (D1, end-to-end)", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-d1-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  function write(relPath: string, content: string) {
    const abs = path.join(dir, relPath);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  }

  it("pass khi bản dịch khớp expected trong literalAllowance dù khác số đếm bản gốc", () => {
    write("skills/a/foo.md", "如果立刻推进叙事，笑声会被剪断");
    write("skills/a/foo.en.md", "If you advance the narrative at once, the laughter is cut off");
    write("skills/a/foo.vi.md", "Nếu đẩy tự sự đi tiếp ngay thì tiếng cười bị cắt ngang");
    const skillsDir = path.join(dir, "skills");
    const allowance = { "推进": { expected: 0, reason: "văn xuôi, không phải giá trị vận máy" } };
    const budget: Budget = {
      "skills/a/foo.md": {
        en: { residualCjk: 0, literalAllowance: allowance },
        vi: { residualCjk: 0, literalAllowance: allowance },
      },
    };
    const report = checkSidecars(dir, skillsDir, ["推进"], budget);
    expect(report.hasHardFail).toBe(false);
  });

  it("hard fail kèm thông báo rõ ràng khi literalAllowance thiếu reason", () => {
    write("skills/a/foo.md", "推进");
    write("skills/a/foo.en.md", "advance");
    write("skills/a/foo.vi.md", "đẩy");
    const skillsDir = path.join(dir, "skills");
    const budget: Budget = {
      "skills/a/foo.md": {
        en: { residualCjk: 0, literalAllowance: { "推进": { expected: 0, reason: "" } } },
        vi: 0,
      },
    };
    const report = checkSidecars(dir, skillsDir, ["推进"], budget);
    expect(report.hasHardFail).toBe(true);
    const enFile = report.files.find((f) => f.file === "skills/a/foo.en.md");
    expect(enFile?.problems.some((p) => p.detail.toLowerCase().includes("reason"))).toBe(true);
  });
});

describe("buildBudget — giữ nguyên literalAllowance đã có khi --update (D1)", () => {
  it("chỉ cập nhật residualCjk, không đụng literalAllowance", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-d1-update-"));
    try {
      fs.mkdirSync(path.join(dir, "skills/a"), { recursive: true });
      fs.writeFileSync(path.join(dir, "skills/a/foo.md"), "推进");
      fs.writeFileSync(path.join(dir, "skills/a/foo.en.md"), "advance 苏晚卿"); // 2 CJK còn sót sau strip 推进 (không xuất hiện)
      fs.writeFileSync(path.join(dir, "skills/a/foo.vi.md"), "day");
      const skillsDir = path.join(dir, "skills");
      const previousBudget: Budget = {
        "skills/a/foo.md": {
          en: { residualCjk: 99, literalAllowance: { "推进": { expected: 0, reason: "lý do cũ" } } },
          vi: 0,
        },
      };
      const budget = buildBudget(dir, skillsDir, ["推进"], previousBudget);
      expect(budget["skills/a/foo.md"].en).toEqual({
        residualCjk: countCJK("advance 苏晚卿"),
        literalAllowance: { "推进": { expected: 0, reason: "lý do cũ" } },
      });
      expect(budget["skills/a/foo.md"].vi).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("không tự sinh literalAllowance cho file chưa từng có miễn trừ", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-sidecars-d1-update2-"));
    try {
      fs.mkdirSync(path.join(dir, "skills/a"), { recursive: true });
      fs.writeFileSync(path.join(dir, "skills/a/bar.md"), "内容");
      fs.writeFileSync(path.join(dir, "skills/a/bar.en.md"), "no cjk here");
      fs.writeFileSync(path.join(dir, "skills/a/bar.vi.md"), "no cjk here either");
      const skillsDir = path.join(dir, "skills");
      const budget = buildBudget(dir, skillsDir, [], {});
      expect(budget["skills/a/bar.md"].en).toBe(0);
      expect(budget["skills/a/bar.md"].vi).toBe(0);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
