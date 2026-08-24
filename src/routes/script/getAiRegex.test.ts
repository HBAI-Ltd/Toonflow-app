import type { AddressInfo } from "net";
import express from "express";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// getAiRegex's systemPrompt is sent straight into u.Ai.Text().invoke() — model-facing, so it
// must follow prompt_language, not content_language. See src/i18n/locale.ts.

let db: Knex;
let capturedSystem: string | undefined;

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => db(...(args as [string])),
    Ai: {
      Text: () => ({
        invoke: async ({ system }: { system?: string }) => {
          capturedSystem = system;
          return { text: "REGEX" };
        },
      }),
    },
  },
}));

async function setSetting(key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

describe("getAiRegex — model-facing system prompt follows prompt_language", () => {
  let app: express.Express;
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });

    const { default: getAiRegexRouter } = await import("./getAiRegex");
    app = express();
    app.use(express.json());
    app.use("/getAiRegex", getAiRegexRouter);
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await db.destroy();
  });

  async function call() {
    capturedSystem = undefined;
    const res = await fetch(`${baseUrl}/getAiRegex`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: "some script text" }),
    });
    await res.json();
    return capturedSystem;
  }

  it("prompt_language=en wins over content_language=vi", async () => {
    await setSetting("content_language", "vi");
    await setSetting("prompt_language", "en");
    const system = await call();
    expect(system).toContain("You are a regular expression expert");
  });

  it("prompt_language=vi is used even when content_language=en", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    const system = await call();
    expect(system).toContain("Bạn là chuyên gia biểu thức chính quy");
  });
});
