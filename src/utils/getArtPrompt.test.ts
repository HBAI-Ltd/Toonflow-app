import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// getArtPrompt reads data/skills content that's assembled into prompts sent to an AI model, so its
// locale resolution must be driven by an explicit `locale` argument (prompt_language at the call
// site), never a global/content_language lookup. Mock getPath so this never touches the real
// data/ directory.
let tmpRoot: string;

vi.mock("./getPath", () => ({
  default: (parts: string[] | string) => {
    const arr = Array.isArray(parts) ? parts : [parts];
    return path.join(tmpRoot, ...arr);
  },
}));

describe("getArtPrompt — resolves a locale variant when one exists on disk", () => {
  let baseDir: string;

  beforeAll(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "getartprompt-test-"));
    baseDir = path.join(tmpRoot, "skills", "art_skills", "some_style");
    fs.mkdirSync(baseDir, { recursive: true });
    fs.writeFileSync(path.join(baseDir, "prefix.md"), "ZH_PREFIX", "utf-8");
    fs.writeFileSync(path.join(baseDir, "prefix.en.md"), "EN_PREFIX", "utf-8");
    fs.writeFileSync(path.join(baseDir, "art_character.md"), "ZH_CHARACTER", "utf-8");
    fs.writeFileSync(path.join(baseDir, "art_character.en.md"), "EN_CHARACTER", "utf-8");
    // No vi sidecar for art_scene — only the zh original exists.
    fs.writeFileSync(path.join(baseDir, "art_scene.md"), "ZH_SCENE", "utf-8");
  });

  afterAll(() => {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("defaults to DEFAULT_LOCALE (en) when no locale argument is passed", async () => {
    const { getArtPrompt } = await import("./getArtPrompt");
    expect(getArtPrompt("some_style", "art_skills", "art_character")).toBe("EN_PREFIX\nEN_CHARACTER");
  });

  it("locale=en resolves the .en.md sidecar for both prefix and target file", async () => {
    const { getArtPrompt } = await import("./getArtPrompt");
    expect(getArtPrompt("some_style", "art_skills", "art_character", "en")).toBe("EN_PREFIX\nEN_CHARACTER");
  });

  it("locale=zh always reads the original (no sidecar for zh)", async () => {
    const { getArtPrompt } = await import("./getArtPrompt");
    expect(getArtPrompt("some_style", "art_skills", "art_character", "zh")).toBe("ZH_PREFIX\nZH_CHARACTER");
  });

  it("locale=vi with no vi sidecar for the target file falls back to the zh original for that file, but still resolves the prefix's own variant availability", async () => {
    const { getArtPrompt } = await import("./getArtPrompt");
    // prefix.md has no .vi.md sidecar either, so both fall back to the zh original.
    expect(getArtPrompt("some_style", "art_skills", "art_scene", "vi")).toBe("ZH_PREFIX\nZH_SCENE");
  });

  it("style directory does not exist -> empty string", async () => {
    const { getArtPrompt } = await import("./getArtPrompt");
    expect(getArtPrompt("no_such_style", "art_skills", "art_character", "en")).toBe("");
  });
});
