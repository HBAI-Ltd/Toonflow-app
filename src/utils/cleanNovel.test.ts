import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// CleanNovel.processChapter builds the event-extraction user message with t(...) and sends it
// straight into u.Ai.Text().invoke() — model-facing, so it must follow prompt_language, not
// content_language. See src/i18n/locale.ts.

const { getMockDb, setMockDb } = vi.hoisted(() => {
  let current: any;
  return {
    getMockDb: () => current,
    setMockDb: (db: any) => {
      current = db;
    },
  };
});

let capturedMessages: any;

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => getMockDb()(...args),
    getPrompts: async () => "SYSTEM_PROMPT",
    error: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
    Ai: {
      Text: () => ({
        invoke: async ({ messages }: { messages: any }) => {
          capturedMessages = messages;
          return { text: "OK" };
        },
      }),
    },
  },
}));

async function setSetting(db: Knex, key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

describe("CleanNovel — event-extraction user prompt follows prompt_language", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("o_prompt", (t) => {
      t.integer("id");
      t.text("type");
      t.text("data");
      t.text("useData");
    });
    setMockDb(db);
    capturedMessages = undefined;
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("prompt_language=en wins over content_language=vi", async () => {
    await setSetting(db, "content_language", "vi");
    await setSetting(db, "prompt_language", "en");
    const { default: CleanNovel } = await import("./cleanNovel");
    const cn = new CleanNovel(1);
    await cn.start([{ id: 1, chapterIndex: 1, reel: 1, chapter: "C1", chapterData: "text" } as any], 1);
    expect(capturedMessages[0].content).toContain("Based on the following novel chapter number");
    expect(capturedMessages[0].content).not.toContain("Dựa trên số chương");
  });

  it("prompt_language=vi is used even when content_language=en", async () => {
    await setSetting(db, "content_language", "en");
    await setSetting(db, "prompt_language", "vi");
    const { default: CleanNovel } = await import("./cleanNovel");
    const cn = new CleanNovel(1);
    await cn.start([{ id: 1, chapterIndex: 1, reel: 1, chapter: "C1", chapterData: "text" } as any], 1);
    expect(capturedMessages[0].content).toContain("Dựa trên số chương tiểu thuyết sau");
  });
});
