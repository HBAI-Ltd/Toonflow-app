import type { AddressInfo } from "net";
import express from "express";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// extractAssets.ts mixes person-facing API responses (error/success, errorReason) with
// model-facing tool schema/description/system+user prompt content sent to u.Ai.Text().invoke().
// The former must follow content_language, the latter prompt_language. See
// .superpowers/followups/prompt-language-remaining-sites-report.md.

let db: Knex;
let capturedInvoke: { messages: any; tools: any } | undefined;

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => db(...(args as [string])),
    error: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
    Ai: {
      Text: () => ({
        invoke: async ({ messages, tools }: { messages: any; tools: any }) => {
          capturedInvoke = { messages, tools };
          return { text: "done" };
        },
      }),
    },
  },
}));

async function setSetting(key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

async function waitFor(check: () => boolean, timeoutMs = 2000) {
  const start = Date.now();
  while (!check()) {
    if (Date.now() - start > timeoutMs) throw new Error("timed out waiting for condition");
    await new Promise((r) => setTimeout(r, 10));
  }
}

describe("extractAssets — model-facing prompt follows prompt_language, person-facing responses follow content_language", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("o_script", (t) => {
      t.integer("id");
      t.text("name");
      t.text("content");
      t.integer("extractState");
      t.text("errorReason");
      t.integer("projectId");
    });
    await db.schema.createTable("o_prompt", (t) => {
      t.integer("id");
      t.text("type");
      t.text("data");
      t.text("useData");
    });
    await db.schema.createTable("o_assets", (t) => {
      t.integer("id");
      t.integer("projectId");
      t.text("name");
      t.text("type");
      t.text("describe");
      t.bigInteger("startTime");
    });
    await db.schema.createTable("o_scriptAssets", (t) => {
      t.integer("scriptId");
      t.integer("assetId");
    });
    await db("o_script").insert({ id: 1, name: "Ep1", content: "once upon a time", extractState: 0, projectId: 1 });
    await db("o_prompt").insert({ id: 1, type: "scriptAssetExtraction", data: "BASE_PROMPT" });

    const { default: extractAssetsRouter } = await import("./extractAssets");
    app = express();
    app.use(express.json());
    app.use("/extractAssets", extractAssetsRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;

    capturedInvoke = undefined;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.destroy();
  });

  async function post(body: unknown) {
    const res = await fetch(`${baseUrl}/extractAssets`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  it("resultTool description and prompt content (model-facing) follow prompt_language=en, ignoring content_language=vi", async () => {
    await setSetting("content_language", "vi");
    await setSetting("prompt_language", "en");
    await post({ scriptIds: [1], projectId: 1 });
    await waitFor(() => capturedInvoke !== undefined);
    expect(capturedInvoke!.tools.resultTool.description).toBe("This tool must be called to return the result.");
    expect(capturedInvoke!.messages[0].content).toContain("Extract the assets involved in the script");
    expect(capturedInvoke!.messages[1].content).not.toContain("kịch bản");
  });

  it("resultTool description and prompt content follow prompt_language=vi even when content_language=en", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    await post({ scriptIds: [1], projectId: 1 });
    await waitFor(() => capturedInvoke !== undefined);
    expect(capturedInvoke!.tools.resultTool.description).toBe("Phải gọi công cụ này để trả về kết quả.");
    expect(capturedInvoke!.messages[0].content).toContain("Trích xuất các tài nguyên xuất hiện trong kịch bản");
  });

  it("person-facing API responses follow content_language, ignoring prompt_language", async () => {
    await setSetting("content_language", "vi");
    await setSetting("prompt_language", "en");
    const noScripts = await post({ scriptIds: [], projectId: 1 });
    expect(noScripts.message).toContain("Vui lòng chọn kịch bản trước");
  });

  it("person-facing 'started' success message follows content_language=en even when prompt_language=vi", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    const started = await post({ scriptIds: [1], projectId: 1 });
    expect(started.data).toBe("Asset extraction started.");
  });
});
