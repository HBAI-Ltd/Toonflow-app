import fs from "fs";
import os from "os";
import path from "path";
import type { AddressInfo } from "net";
import express from "express";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// generateVideoPrompt.ts resolves the model-prompt file (data/modelPrompt) through
// prompt_language, not content_language — see src/i18n/locale.ts getPromptLanguage and
// src/routes/setting/modelMap/bindingPrompt.ts. This exercises exactly that: a canonical binding
// must follow whatever prompt_language is set at generation time, while an explicit
// locale-suffixed binding (a deliberate pin from Settings → Model Map) must ignore it.
let tmpRoot: string;
let modelPromptRoot: string;
let db: Knex;
let capturedSystem: string | undefined;

vi.mock("@/utils", () => {
  const dbFn: any = (...args: unknown[]) => db(...(args as [string]));
  Object.defineProperty(dbFn, "schema", { get: () => db.schema });
  return {
    default: {
      db: dbFn,
      getPath: (parts: string[] | string) => {
        const arr = Array.isArray(parts) ? parts : [parts];
        return path.join(tmpRoot, ...arr);
      },
      getArtPrompt: () => "VISUAL_MANUAL",
      error: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
      Ai: {
        Text: () => ({
          invoke: async ({ system }: { system?: string }) => {
            capturedSystem = system;
            return { text: "GENERATED" };
          },
        }),
      },
    },
  };
});

async function setPromptLanguageRow(value: string | null) {
  await db("o_setting").where("key", "prompt_language").del();
  if (value !== null) await db("o_setting").insert({ key: "prompt_language", value });
}

describe("generateVideoPrompt — model-prompt resolution follows prompt_language", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "genvideoprompt-test-"));
    modelPromptRoot = path.join(tmpRoot, "modelPrompt", "video");
    fs.mkdirSync(modelPromptRoot, { recursive: true });
    fs.writeFileSync(path.join(modelPromptRoot, "wan2.6Single-imageFirstFrameMode.md"), "ZH_DIRFALLBACK", "utf-8");
    fs.writeFileSync(path.join(modelPromptRoot, "wan2.6Single-imageFirstFrameMode.en.md"), "EN_DIRFALLBACK", "utf-8");

    fs.writeFileSync(path.join(modelPromptRoot, "boundPrompt.md"), "ZH_BOUND", "utf-8");
    fs.writeFileSync(path.join(modelPromptRoot, "boundPrompt.en.md"), "EN_BOUND", "utf-8");
    fs.writeFileSync(path.join(modelPromptRoot, "boundPrompt.vi.md"), "VI_BOUND", "utf-8");

    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("o_videoTrack", (t) => {
      t.integer("id");
      t.text("state");
      t.text("prompt");
      t.text("reason");
    });
    await db.schema.createTable("o_project", (t) => {
      t.integer("id");
      t.text("artStyle");
    });
    await db.schema.createTable("o_prompt", (t) => {
      t.integer("id");
      t.text("type");
      t.text("data");
      t.text("useData");
    });
    await db.schema.createTable("o_modelPrompt", (t) => {
      t.integer("id");
      t.text("vendorId");
      t.text("model");
      t.text("path");
      t.text("fileName");
    });
    await db.schema.createTable("o_assets2Storyboard", (t) => {
      t.integer("storyboardId");
      t.integer("assetId");
    });
    await db.schema.createTable("o_assets", (t) => {
      t.integer("id");
      t.text("type");
      t.text("name");
      t.integer("imageId");
      t.text("assetsId");
    });
    await db.schema.createTable("o_image", (t) => {
      t.integer("id");
      t.text("filePath");
    });
    await db.schema.createTable("o_assetsRole2Audio", (t) => {
      t.integer("assetsAudioId");
      t.integer("assetsRoleId");
    });

    await db("o_videoTrack").insert({ id: 1, state: "生成中" });
    await db("o_project").insert({ id: 1, artStyle: "无" });
    await db("o_prompt").insert({ id: 1, type: "videoPromptGeneration", data: "FALLBACK_SEED" });

    const { default: generateVideoPromptRouter } = await import("./generateVideoPrompt");
    app = express();
    app.use(express.json());
    app.use("/generateVideoPrompt", generateVideoPromptRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.destroy();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  async function generate(model: string) {
    capturedSystem = undefined;
    const res = await fetch(`${baseUrl}/generateVideoPrompt`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ trackId: 1, projectId: 1, info: [], model, mode: "startEndRequired" }),
    });
    await res.json();
    return capturedSystem;
  }

  it("no binding, prompt_language absent (defaults en): dir-fallback file resolves the en sidecar", async () => {
    await setPromptLanguageRow(null);
    const system = await generate("vendorX:wan2.6-fake");
    expect(system).toBe("EN_DIRFALLBACK");
  });

  it("no binding, prompt_language=zh: dir-fallback file resolves the zh original (no zh sidecar)", async () => {
    await setPromptLanguageRow("zh");
    const system = await generate("vendorX:wan2.6-fake");
    expect(system).toBe("ZH_DIRFALLBACK");
  });

  it("bound to canonical path: follows prompt_language — changes when the setting changes", async () => {
    await db("o_modelPrompt").insert({ vendorId: "vendorY", model: "modelY", path: "video/boundPrompt.md", fileName: "boundPrompt.md" });

    await setPromptLanguageRow("en");
    expect(await generate("vendorY:modelY")).toBe("EN_BOUND");

    await setPromptLanguageRow("vi");
    expect(await generate("vendorY:modelY")).toBe("VI_BOUND");

    await setPromptLanguageRow("zh");
    expect(await generate("vendorY:modelY")).toBe("ZH_BOUND");
  });

  it("bound to an explicit locale-suffixed path: pins that language regardless of prompt_language", async () => {
    await db("o_modelPrompt").insert({ vendorId: "vendorZ", model: "modelZ", path: "video/boundPrompt.vi.md", fileName: "boundPrompt.vi.md" });

    await setPromptLanguageRow("en");
    expect(await generate("vendorZ:modelZ")).toBe("VI_BOUND");

    await setPromptLanguageRow("zh");
    expect(await generate("vendorZ:modelZ")).toBe("VI_BOUND");
  });
});
