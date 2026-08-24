import fs from "fs";
import os from "os";
import path from "path";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// useSkill()'s returned prompt/tools are read by the model (agent system prompt + tool
// schema/results), so they must follow prompt_language. Its thrown errors are surfaced to
// whoever is watching the run, so they must follow content_language instead. See
// src/i18n/locale.ts and .superpowers/followups/prompt-language-remaining-sites-report.md.

let tmpRoot: string;
let skillsDir: string;

const { getMockDb, setMockDb } = vi.hoisted(() => {
  let current: any;
  return {
    getMockDb: () => current,
    setMockDb: (db: any) => {
      current = db;
    },
  };
});

vi.mock("@/utils", () => ({
  default: { db: (...args: unknown[]) => getMockDb()(...args) },
}));

vi.mock("@/utils/getPath", () => ({
  default: (parts: string[] | string) => {
    const arr = Array.isArray(parts) ? parts : [parts];
    return path.join(tmpRoot, ...arr);
  },
}));

async function setSetting(db: Knex, key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

describe("skillsTools.useSkill — prompt vs content locale split", () => {
  let db: Knex;

  beforeEach(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "skillstools-test-"));
    skillsDir = path.join(tmpRoot, "skills");
    fs.mkdirSync(skillsDir, { recursive: true });
    fs.writeFileSync(
      path.join(skillsDir, "test_skill.md"),
      ["---", "name: test_skill", "description: a test skill", "---", "", "body"].join("\n"),
      "utf-8",
    );

    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    setMockDb(db);
  });

  afterEach(async () => {
    await db.destroy();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("returned prompt (model-facing) follows prompt_language, ignoring content_language", async () => {
    await setSetting(db, "content_language", "vi");
    await setSetting(db, "prompt_language", "en");
    const { useSkill } = await import("./skillsTools");
    const { prompt } = await useSkill({ mainSkill: ["test_skill"] as any });
    expect(prompt).toContain("## Skills");
    expect(prompt).toContain("The following skills provide specialized instructions");
    expect(prompt).not.toContain("Các kỹ năng sau cung cấp");
  });

  it("returned prompt follows prompt_language=vi even when content_language=en", async () => {
    await setSetting(db, "content_language", "en");
    await setSetting(db, "prompt_language", "vi");
    const { useSkill } = await import("./skillsTools");
    const { prompt } = await useSkill({ mainSkill: ["test_skill"] as any });
    expect(prompt).toContain("Các kỹ năng sau cung cấp chỉ dẫn chuyên biệt");
  });

  it("returned tools' description (model-facing) follows prompt_language, not content_language", async () => {
    await setSetting(db, "content_language", "vi");
    await setSetting(db, "prompt_language", "en");
    const { useSkill } = await import("./skillsTools");
    const { tools } = await useSkill({ mainSkill: ["test_skill"] as any });
    expect((tools.activate_skill as any).description).toContain("Activate a skill");
  });

  it("thrown mainSkillNotFound error (person-facing) follows content_language, ignoring prompt_language", async () => {
    await setSetting(db, "content_language", "vi");
    await setSetting(db, "prompt_language", "en");
    const { useSkill } = await import("./skillsTools");
    await expect(useSkill({ mainSkill: ["does_not_exist"] as any })).rejects.toThrow("Không tồn tại tệp kỹ năng chính");
  });

  it("thrown mainSkillNotFound error follows content_language=en even when prompt_language=vi", async () => {
    await setSetting(db, "content_language", "en");
    await setSetting(db, "prompt_language", "vi");
    const { useSkill } = await import("./skillsTools");
    await expect(useSkill({ mainSkill: ["does_not_exist"] as any })).rejects.toThrow("Main skill file does not exist");
  });

  // F2 — skill body: thân skill kích hoạt (activate_skill) phải theo prompt_language, không phải
  // luôn đọc thẳng bản gốc .md (zh). Thiết lập sidecar test_skill.en.md/.vi.md để phân biệt.
  describe("F2 — activate_skill body follows prompt_language", () => {
    beforeEach(() => {
      fs.writeFileSync(
        path.join(skillsDir, "test_skill.en.md"),
        ["---", "name: test_skill", "description: a test skill", "---", "", "EN_BODY"].join("\n"),
        "utf-8",
      );
      fs.writeFileSync(
        path.join(skillsDir, "test_skill.vi.md"),
        ["---", "name: test_skill", "description: a test skill", "---", "", "VI_BODY"].join("\n"),
        "utf-8",
      );
    });

    it("prompt_language=en -> activate_skill trả nội dung từ test_skill.en.md, không phải bản gốc zh", async () => {
      await setSetting(db, "content_language", "vi");
      await setSetting(db, "prompt_language", "en");
      const { useSkill } = await import("./skillsTools");
      const { tools } = await useSkill({ mainSkill: ["test_skill"] as any });
      const result = await (tools.activate_skill as any).execute({ name: "test_skill" });
      expect(result.content).toContain("EN_BODY");
      expect(result.content).not.toContain("VI_BODY");
      expect(result.content).not.toContain("\nbody");
    });

    it("prompt_language=vi -> activate_skill trả nội dung từ test_skill.vi.md", async () => {
      await setSetting(db, "content_language", "en");
      await setSetting(db, "prompt_language", "vi");
      const { useSkill } = await import("./skillsTools");
      const { tools } = await useSkill({ mainSkill: ["test_skill"] as any });
      const result = await (tools.activate_skill as any).execute({ name: "test_skill" });
      expect(result.content).toContain("VI_BODY");
      expect(result.content).not.toContain("EN_BODY");
    });

    it("prompt_language không có sidecar (zh) -> lùi về bản gốc", async () => {
      await setSetting(db, "content_language", "en");
      await setSetting(db, "prompt_language", "zh");
      const { useSkill } = await import("./skillsTools");
      const { tools } = await useSkill({ mainSkill: ["test_skill"] as any });
      const result = await (tools.activate_skill as any).execute({ name: "test_skill" });
      expect(result.content).toContain("\nbody");
      expect(result.content).not.toContain("EN_BODY");
      expect(result.content).not.toContain("VI_BODY");
    });
  });
});

// F1 — scanSkills không được để sidecar dịch (foo.en.md/foo.vi.md) rò vào danh sách skill,
// kể cả khi cả ba biến thể (gốc + en + vi) cùng tồn tại trong thư mục.
describe("scanSkills — loại trừ sidecar dịch, chỉ trả bản gốc", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "scanskills-test-"));
    fs.writeFileSync(path.join(tmpDir, "storyboard_prompt_techniques.md"), "zh body", "utf-8");
    fs.writeFileSync(path.join(tmpDir, "storyboard_prompt_techniques.en.md"), "en body", "utf-8");
    fs.writeFileSync(path.join(tmpDir, "storyboard_prompt_techniques.vi.md"), "vi body", "utf-8");
    fs.writeFileSync(path.join(tmpDir, "storyboard_table_techniques.md"), "zh body 2", "utf-8");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("chỉ trả về hai bản gốc, không trả sidecar .en.md/.vi.md", async () => {
    const { scanSkills } = await import("./skillsTools");
    const entries = await scanSkills(path.join(tmpDir, "*.md").replace(/\\/g, "/"));
    const basenames = entries.map((p) => path.basename(p)).sort();
    expect(basenames).toEqual(["storyboard_prompt_techniques.md", "storyboard_table_techniques.md"]);
  });
});
