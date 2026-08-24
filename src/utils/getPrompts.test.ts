import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { eventExtraction } from "@/lib/prompts/eventExtraction";

// getPrompts("event") feeds the AI model directly (see src/utils/cleanNovel.ts), so it must
// resolve through prompt_language (getPromptLanguage), not content_language.
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

describe("getPrompts('event') — follows prompt_language, not content_language", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    setMockDb(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("prompt_language absent (defaults en), content_language set to vi -> returns the English seed", async () => {
    await db("o_setting").insert({ key: "content_language", value: "vi" });
    const { getPrompts } = await import("./getPrompts");
    expect(await getPrompts("event")).toBe(eventExtraction.en);
  });

  it("prompt_language=vi, content_language=en -> returns the Vietnamese seed", async () => {
    await db("o_setting").insert({ key: "prompt_language", value: "vi" });
    await db("o_setting").insert({ key: "content_language", value: "en" });
    const { getPrompts } = await import("./getPrompts");
    expect(await getPrompts("event")).toBe(eventExtraction.vi);
  });

  it("unknown type -> undefined", async () => {
    const { getPrompts } = await import("./getPrompts");
    expect(await getPrompts("nope")).toBeUndefined();
  });
});
