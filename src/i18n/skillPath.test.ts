import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { localizedSkillPath, readLocalizedSkill, canonicalSkillPath, resolveSkillReadPath, skillPathLocale } from "./skillPath";

describe("localizedSkillPath", () => {
  it("chèn hậu tố locale trước phần mở rộng", () => {
    expect(localizedSkillPath("/a/b/README.md", "en")).toBe("/a/b/README.en.md");
    expect(localizedSkillPath("/a/b/README.md", "vi")).toBe("/a/b/README.vi.md");
  });

  it("locale zh dùng thẳng file gốc", () => {
    expect(localizedSkillPath("/a/b/README.md", "zh")).toBe("/a/b/README.md");
  });

  it("giữ nguyên phần còn lại của đường dẫn", () => {
    expect(localizedSkillPath("/x/art_prompt/art_scene.md", "en")).toBe("/x/art_prompt/art_scene.en.md");
  });
});

// data/skills/art_skills/2D_90s_japanese_anime chứa sidecar .en.md/.vi.md thật
// đi kèm bản gốc README.md, dùng làm fixture thay vì dựng file giả.
const ART_SKILL_DIR = path.resolve(__dirname, "../../data/skills/art_skills/2D_90s_japanese_anime");
const README_ZH = path.join(ART_SKILL_DIR, "README.md");
const README_EN = path.join(ART_SKILL_DIR, "README.en.md");
const README_VI = path.join(ART_SKILL_DIR, "README.vi.md");
// prefix.md không có sidecar cho bất kỳ locale nào -> dùng để kiểm tra fallback.
const PREFIX_ZH = path.join(ART_SKILL_DIR, "prefix.md");

describe("readLocalizedSkill", () => {
  it("có sidecar -> trả nội dung sidecar, không phải bản gốc", () => {
    const zhContent = fs.readFileSync(README_ZH, "utf-8");
    const enContent = fs.readFileSync(README_EN, "utf-8");
    const viContent = fs.readFileSync(README_VI, "utf-8");
    expect(enContent).not.toBe(zhContent);
    expect(viContent).not.toBe(zhContent);

    expect(readLocalizedSkill(README_ZH, "en")).toBe(enContent);
    expect(readLocalizedSkill(README_ZH, "vi")).toBe(viContent);
  });

  it("không có sidecar -> lùi về nội dung bản gốc", () => {
    // prefix.md chỉ tồn tại ở dạng gốc (zh), không có prefix.en.md/prefix.vi.md.
    expect(fs.existsSync(localizedSkillPath(PREFIX_ZH, "en"))).toBe(false);
    expect(fs.existsSync(localizedSkillPath(PREFIX_ZH, "vi"))).toBe(false);

    const zhContent = fs.readFileSync(PREFIX_ZH, "utf-8");
    expect(readLocalizedSkill(PREFIX_ZH, "en")).toBe(zhContent);
    expect(readLocalizedSkill(PREFIX_ZH, "vi")).toBe(zhContent);
  });

  it("locale zh đọc thẳng bản gốc, không thử đường dẫn sidecar", () => {
    const zhContent = fs.readFileSync(README_ZH, "utf-8");
    expect(readLocalizedSkill(README_ZH, "zh")).toBe(zhContent);
  });

  describe("khi không có file nào tồn tại", () => {
    let tmpDir: string;

    afterEach(() => {
      if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it("trả chuỗi rỗng, không throw", () => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "skillpath-test-"));
      const missingPath = path.join(tmpDir, "README.md");

      expect(() => readLocalizedSkill(missingPath, "en")).not.toThrow();
      expect(readLocalizedSkill(missingPath, "en")).toBe("");
      expect(readLocalizedSkill(missingPath, "zh")).toBe("");
    });
  });
});

describe("canonicalSkillPath", () => {
  it("sidecar en/vi -> quy về bản gốc .md", () => {
    expect(canonicalSkillPath("/a/b/foo.en.md")).toBe("/a/b/foo.md");
    expect(canonicalSkillPath("/a/b/foo.vi.md")).toBe("/a/b/foo.md");
  });

  it("bản gốc (không có hậu tố locale) -> trả nguyên trạng", () => {
    expect(canonicalSkillPath("/a/b/foo.md")).toBe("/a/b/foo.md");
  });

  it("không nhận nhầm tên file trùng ngẫu nhiên với hậu tố locale, ví dụ zh không phải sidecar suffix", () => {
    // zh là FALLBACK_LOCALE, không có sidecar .zh.md nào cả -> không bị coi là sidecar
    expect(canonicalSkillPath("/a/b/foo.zh.md")).toBe("/a/b/foo.zh.md");
  });
});

describe("skillPathLocale", () => {
  it("sidecar en/vi -> trả về đúng locale của hậu tố", () => {
    expect(skillPathLocale("/a/b/foo.en.md")).toBe("en");
    expect(skillPathLocale("/a/b/foo.vi.md")).toBe("vi");
  });

  it("bản gốc (không có hậu tố locale) -> trả về null", () => {
    expect(skillPathLocale("/a/b/foo.md")).toBeNull();
  });

  it("zh không phải hậu tố sidecar hợp lệ -> trả về null", () => {
    expect(skillPathLocale("/a/b/foo.zh.md")).toBeNull();
  });
});

describe("resolveSkillReadPath", () => {
  let tmpDir: string;
  let baseFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "resolve-read-path-test-"));
    baseFile = path.join(tmpDir, "foo.md");
    fs.writeFileSync(baseFile, "noi dung goc (zh)", "utf-8");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("zh luôn trả về chính bản gốc, kể cả khi sidecar tồn tại", () => {
    fs.writeFileSync(localizedSkillPath(baseFile, "vi"), "sidecar vi", "utf-8");
    expect(resolveSkillReadPath(baseFile, "zh")).toBe(baseFile);
  });

  it("có sidecar cho locale -> trả về đường dẫn sidecar", () => {
    const viSidecar = localizedSkillPath(baseFile, "vi");
    fs.writeFileSync(viSidecar, "sidecar vi", "utf-8");
    expect(resolveSkillReadPath(baseFile, "vi")).toBe(viSidecar);
  });

  it("không có sidecar cho locale -> lùi về bản gốc", () => {
    expect(resolveSkillReadPath(baseFile, "en")).toBe(baseFile);
  });
});
