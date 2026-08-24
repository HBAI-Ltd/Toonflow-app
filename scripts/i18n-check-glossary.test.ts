import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import os from "os";
import path from "path";
import {
  normalizeGloss,
  extractGlossPairs,
  findGlossConflicts,
  scanGlossary,
  countUnregisteredTokens,
  formatGlossaryReport,
  UNREGISTERED_SHOT_TOKENS,
  type GlossOccurrence,
} from "./i18n-check-glossary";

const occ = (o: Partial<GlossOccurrence>): GlossOccurrence => ({
  file: "a.en.md",
  locale: "en",
  zh: "全景",
  gloss: "Wide shot",
  normalized: "wide shot",
  line: 1,
  ...o,
});

describe("normalizeGloss", () => {
  it("bỏ khoảng trắng thừa, hạ chữ thường, chuẩn hoá NFC", () => {
    expect(normalizeGloss("  Wide   Shot ")).toBe("wide shot");
    // "ổ" dạng tổ hợp (o + dấu rời) phải chuẩn hoá về dạng dựng sẵn
    expect(normalizeGloss("cổ phong")).toBe(normalizeGloss("cổ phong"));
  });

  it("KHÔNG so khớp mờ hơn thế — 'close-up' và 'close up' là hai chú giải khác nhau", () => {
    expect(normalizeGloss("close-up")).not.toBe(normalizeGloss("close up"));
  });
});

describe("extractGlossPairs", () => {
  it("bắt hướng bản-dịch-trước: `Wide shot (全景)`", () => {
    expect(extractGlossPairs("| Wide shot (全景) | x |")).toEqual([{ zh: "全景", gloss: "Wide shot", line: 1 }]);
  });

  it("bắt hướng tiếng-Trung-trước: `已完成 (completed)`", () => {
    expect(extractGlossPairs("khi trạng thái là 已完成 (completed)")).toEqual([{ zh: "已完成", gloss: "completed", line: 1 }]);
  });

  it("bắt tên màu truyền thống: `Moon white (月白)`", () => {
    expect(extractGlossPairs("- Moon white (月白) #EEF]")).toEqual([{ zh: "月白", gloss: "Moon white", line: 1 }]);
  });

  it("bỏ qua dấu nhấn mạnh markdown quanh chú giải", () => {
    expect(extractGlossPairs("**Trung cảnh** (中景)")).toEqual([{ zh: "中景", gloss: "Trung cảnh", line: 1 }]);
  });

  it("nhận cả ngoặc đơn toàn rộng （）", () => {
    expect(extractGlossPairs("Wide shot（全景）")).toEqual([{ zh: "全景", gloss: "Wide shot", line: 1 }]);
  });

  it("ghi đúng số dòng và bỏ qua nội dung trong khối code", () => {
    const text = ["dòng một", "```", "Wide shot (全景)", "```", "Close-up (特写)"].join("\n");
    expect(extractGlossPairs(text)).toEqual([{ zh: "特写", gloss: "Close-up", line: 5 }]);
  });

  it("bỏ qua ngoặc không phải chú giải: hai bên cùng tiếng Trung, hoặc chú giải rỗng", () => {
    expect(extractGlossPairs("角色（苏晚卿）")).toEqual([]);
    expect(extractGlossPairs("(全景)")).toEqual([]);
    expect(extractGlossPairs("中景 ()")).toEqual([]);
  });

  it("bỏ qua văn xuôi dài trước ngoặc — đó không phải chú giải", () => {
    expect(extractGlossPairs("the camera pushes in slowly toward her face here (推进)")).toEqual([]);
  });
});

describe("findGlossConflicts", () => {
  it("loại 2 — nhiều chuỗi zh khác nhau, cùng một chú giải, cùng một locale", () => {
    const conflicts = findGlossConflicts([
      occ({ zh: "近景", gloss: "close-up", normalized: "close-up", file: "a.en.md" }),
      occ({ zh: "特写", gloss: "Close-up", normalized: "close-up", file: "b.en.md" }),
    ]);
    expect(conflicts.sharedGloss).toHaveLength(1);
    expect(conflicts.sharedGloss[0].locale).toBe("en");
    expect(conflicts.sharedGloss[0].gloss).toBe("close-up");
    expect(conflicts.sharedGloss[0].zhVariants.map((v) => v.zh).sort()).toEqual(["特写", "近景"]);
    expect(conflicts.splitGloss).toHaveLength(0);
  });

  it("loại 1 — một chuỗi zh, nhiều chú giải khác nhau, cùng một locale", () => {
    const conflicts = findGlossConflicts([
      occ({ locale: "vi", zh: "古风", gloss: "cổ phong", normalized: "cổ phong", file: "a.vi.md" }),
      occ({ locale: "vi", zh: "古风", gloss: "cổ trang", normalized: "cổ trang", file: "b.vi.md" }),
    ]);
    expect(conflicts.splitGloss).toHaveLength(1);
    expect(conflicts.splitGloss[0].zh).toBe("古风");
    expect(conflicts.splitGloss[0].glossVariants.map((v) => v.gloss).sort()).toEqual(["cổ phong", "cổ trang"]);
    expect(conflicts.sharedGloss).toHaveLength(0);
  });

  it("không báo xung đột khi hai locale khác nhau dùng chung một chú giải", () => {
    const conflicts = findGlossConflicts([
      occ({ locale: "en", zh: "近景", normalized: "close-up" }),
      occ({ locale: "vi", zh: "特写", normalized: "close-up" }),
    ]);
    expect(conflicts.sharedGloss).toHaveLength(0);
    expect(conflicts.splitGloss).toHaveLength(0);
  });

  it("không báo gì khi cùng zh và cùng chú giải lặp ở nhiều file", () => {
    const conflicts = findGlossConflicts([occ({ file: "a.en.md" }), occ({ file: "b.en.md" })]);
    expect(conflicts.sharedGloss).toHaveLength(0);
    expect(conflicts.splitGloss).toHaveLength(0);
  });
});

describe("scanGlossary + countUnregisteredTokens (đọc đĩa, dùng thư mục tạm)", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-check-glossary-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });
  const write = (rel: string, content: string) => {
    const abs = path.join(dir, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, "utf-8");
  };

  it("gom chú giải từ mọi sidecar và báo cả hai loại xung đột", () => {
    write("skills/a/x.md", "近景 特写");
    write("skills/a/x.en.md", "Close-up (近景) and close up (特写)");
    write("skills/a/x.vi.md", "Cận cảnh (近景) và đặc tả (特写)");
    write("skills/b/y.md", "近景");
    write("skills/b/y.en.md", "Medium close shot (近景)");
    write("skills/b/y.vi.md", "Cận cảnh (近景)");

    const report = scanGlossary(dir, path.join(dir, "skills"));
    // en: 近景 có hai chú giải khác nhau → loại 1
    const split = report.conflicts.splitGloss.find((c) => c.zh === "近景" && c.locale === "en");
    expect(split).toBeDefined();
    expect(split!.glossVariants).toHaveLength(2);
    // không có loại 2 vì "close-up" và "close up" khác nhau sau chuẩn hoá
    expect(report.conflicts.sharedGloss).toHaveLength(0);
  });

  it("--paths giới hạn phạm vi quét", () => {
    write("skills/a/x.md", "近景");
    write("skills/a/x.en.md", "Close-up (近景)");
    write("skills/a/x.vi.md", "Cận cảnh (近景)");
    write("skills/b/y.md", "近景");
    write("skills/b/y.en.md", "Medium shot (近景)");
    write("skills/b/y.vi.md", "Trung cảnh (近景)");

    const all = scanGlossary(dir, path.join(dir, "skills"));
    expect(all.conflicts.splitGloss.length).toBeGreaterThan(0);
    const scoped = scanGlossary(dir, path.join(dir, "skills"), ["skills/a"]);
    expect(scoped.conflicts.splitGloss).toHaveLength(0);
    expect(scoped.occurrences.every((o) => o.file.startsWith("skills/a/"))).toBe(true);
  });

  it("E2 — chỉ báo token có số đếm sidecar THẤP HƠN bản gốc", () => {
    write("skills/a/x.md", "跟拍 跟拍 空镜");
    write("skills/a/x.en.md", "跟拍 跟拍 empty shot"); // 空镜 bị dịch mất
    write("skills/a/x.vi.md", "跟拍 跟拍 空镜"); // giữ nguyên
    const rows = countUnregisteredTokens(dir, path.join(dir, "skills"), ["跟拍", "空镜", "缓拉"]);
    expect(rows).toEqual([{ file: "skills/a/x.md", token: "空镜", zh: 1, en: 0, vi: 1 }]);
  });

  it("danh sách token E2 đúng theo phán quyết đã chốt (中近景 đã đăng ký vào prompt-terms.json nên rời khỏi danh sách này)", () => {
    expect(UNREGISTERED_SHOT_TOKENS).toEqual(["手持微晃", "稳定器流动", "跟拍", "空镜", "大远景", "缓拉", "大全景", "一镜到底"]);
  });
});

describe("formatGlossaryReport", () => {
  it("xếp loại 2 TRƯỚC loại 1 vì nguy hiểm hơn", () => {
    const out = formatGlossaryReport(
      findGlossConflicts([
        occ({ zh: "近景", normalized: "close-up", gloss: "close-up" }),
        occ({ zh: "特写", normalized: "close-up", gloss: "close-up", file: "b.en.md" }),
        occ({ locale: "vi", zh: "古风", normalized: "cổ phong", gloss: "cổ phong", file: "c.vi.md" }),
        occ({ locale: "vi", zh: "古风", normalized: "cổ trang", gloss: "cổ trang", file: "d.vi.md" }),
      ]),
    );
    const idxShared = out.indexOf("近景");
    const idxSplit = out.indexOf("古风");
    expect(idxShared).toBeGreaterThan(-1);
    expect(idxSplit).toBeGreaterThan(-1);
    expect(idxShared).toBeLessThan(idxSplit);
  });

  it("in được cả khi không còn xung đột nào", () => {
    expect(formatGlossaryReport({ sharedGloss: [], splitGloss: [] })).toContain("0");
  });
});
