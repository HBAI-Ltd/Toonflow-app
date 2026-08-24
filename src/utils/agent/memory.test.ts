import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Memory.generateSummary/judgeSummaryRelevance feed u.Ai.Text().invoke() directly as system/user
// content, and getTools() builds tool description/schema/result text the model reads — all of
// this must follow prompt_language, not content_language. See src/i18n/locale.ts.

const { getMockDb, setMockDb } = vi.hoisted(() => {
  let current: any;
  return {
    getMockDb: () => current,
    setMockDb: (db: any) => {
      current = db;
    },
  };
});

let capturedSystem: string | undefined;
let capturedMessages: any;

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => getMockDb()(...args),
    Ai: {
      Text: () => ({
        invoke: async ({ system, messages }: { system?: string; messages?: any }) => {
          capturedSystem = system;
          capturedMessages = messages;
          return { text: "[]" };
        },
      }),
    },
  },
}));

vi.mock("./embedding", () => ({
  getEmbedding: async () => [1, 0, 0],
  cosineSimilarity: (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0),
}));

async function setSetting(db: Knex, key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

describe("Memory — model-facing text follows prompt_language, not content_language", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("memories", (t) => {
      t.text("id");
      t.text("isolationKey");
      t.text("type");
      t.text("role");
      t.text("name");
      t.text("content");
      t.text("embedding");
      t.text("relatedMessageIds");
      t.integer("summarized");
      t.bigInteger("createTime");
    });
    setMockDb(db);
    capturedSystem = undefined;
    capturedMessages = undefined;
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("generateSummary system prompt: prompt_language=en wins over content_language=vi", async () => {
    await setSetting(db, "content_language", "vi");
    await setSetting(db, "prompt_language", "en");
    const { default: Memory } = await import("./memory");
    const memory = new Memory("productionAgent", "iso-1");
    await memory.add("user", "msg1");
    await memory.add("user", "msg2");
    await memory.add("user", "msg3"); // messagesPerSummary default = 3 -> triggers generateSummary
    expect(capturedSystem).toContain("memory compression assistant");
    expect(capturedSystem).not.toContain("nén trí nhớ");
  });

  it("generateSummary system prompt: prompt_language=vi is used even when content_language=en", async () => {
    await setSetting(db, "content_language", "en");
    await setSetting(db, "prompt_language", "vi");
    const { default: Memory } = await import("./memory");
    const memory = new Memory("productionAgent", "iso-2");
    await memory.add("user", "msg1");
    await memory.add("user", "msg2");
    await memory.add("user", "msg3");
    expect(capturedSystem).toContain("nén trí nhớ");
  });

  it("judgeSummaryRelevance (via deepRetrieve): follows prompt_language, not content_language", async () => {
    await setSetting(db, "content_language", "en");
    await setSetting(db, "prompt_language", "vi");
    const { default: Memory } = await import("./memory");
    const memory = new Memory("productionAgent", "iso-3");
    await db("memories").insert({
      id: "s1",
      isolationKey: "iso-3",
      type: "summary",
      content: "some summary",
      embedding: JSON.stringify([1, 0, 0]),
      relatedMessageIds: "[]",
      summarized: 0,
      createTime: Date.now(),
    });
    await memory.deepRetrieve("keyword");
    expect(capturedSystem).toContain("trợ lý truy xuất thông tin");
  });

  it("getTools(): description/keywordDescribe/notFound resolve per the locale passed in (caller is responsible for passing prompt_language)", async () => {
    const { default: Memory } = await import("./memory");
    const memory = new Memory("productionAgent", "iso-4");

    const enTools = memory.getTools("en");
    expect(enTools.deepRetrieve.description).toBe("Deep-search memory: use this tool when you need to recall detailed historical information related to a keyword");

    const viTools = memory.getTools("vi");
    expect(viTools.deepRetrieve.description).toBe("Truy xuất trí nhớ chuyên sâu: dùng công cụ này khi bạn cần nhớ lại thông tin lịch sử chi tiết liên quan đến một từ khóa");
  });
});
