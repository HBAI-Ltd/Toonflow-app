import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import knexFactory, { type Knex } from "knex";
import { localeFromHeader, getLocale, setLocale, LANGUAGE_SETTING_KEY, getPromptLanguage, setPromptLanguage, PROMPT_LANGUAGE_SETTING_KEY } from "./locale";
import { SEED_PROMPT_TYPES, getSeedPrompt } from "@/lib/prompts";

// locale.ts lazily `await import("@/lib/migrations/promptSeedSync")` from inside writeLocaleIfChanged
// (only reached once o_setting is actually written), so a plain top-level import of that module here
// wouldn't be able to observe/count calls made through the dynamic import. This wraps the real
// syncGuardedPromptSeeds in a plain counting function — deliberately NOT a vi.fn()/vi.spyOn() mock,
// because those get torn down by the `vi.restoreAllMocks()` in the "getLocale — đồng bộ o_setting theo
// header" describe's afterEach below (it runs for every test in that block, including ones that touch
// this same module transitively); a plain closure survives that untouched. Real behaviour runs by
// default; `syncImplOverride` lets one test substitute a failing implementation without disturbing any
// other test.
let syncCallCount = 0;
let syncImplOverride: ((knex: unknown, locale: unknown) => Promise<unknown>) | null = null;
vi.mock("@/lib/migrations/promptSeedSync", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/migrations/promptSeedSync")>();
  return {
    ...actual,
    syncGuardedPromptSeeds: async (knex: unknown, locale: unknown) => {
      syncCallCount++;
      return syncImplOverride ? syncImplOverride(knex, locale) : actual.syncGuardedPromptSeeds(knex as never, locale as never);
    },
  };
});

// getLocale/setLocale lazily `await import("@/utils")` inside the function body (deliberate — see
// the comment in locale.ts — so unit tests don't boot real SQLite). vi.mock is hoisted above this
// file's own top-level statements, so the mocked db instance must be reachable through a
// vi.hoisted() holder rather than a plain outer `let`, which would still be in its temporal dead
// zone when the factory below runs.
const { getMockDb, setMockDb } = vi.hoisted(() => {
  let current: any;
  return {
    getMockDb: () => current,
    setMockDb: (db: any) => {
      current = db;
    },
  };
});

vi.mock("@/utils", () => {
  // syncGuardedPromptSeeds (invoked transitively via writeLocaleIfChanged in the "locale change"
  // describe block below) calls `knex.schema.hasTable(...)`, so the mocked db needs a `.schema`
  // that forwards to whatever real knex instance the current test wired up via setMockDb, not just
  // the callable query-builder proxy the earlier tests in this file needed.
  const dbFn: any = (...args: unknown[]) => getMockDb()(...args);
  Object.defineProperty(dbFn, "schema", { get: () => getMockDb().schema });
  return { default: { db: dbFn } };
});

describe("localeFromHeader", () => {
  it("nhận locale hợp lệ", () => {
    expect(localeFromHeader("vi")).toBe("vi");
    expect(localeFromHeader("EN")).toBe("en");
  });

  it("ánh xạ mã đầy đủ của giao diện về locale backend", () => {
    expect(localeFromHeader("vi-VN")).toBe("vi");
    expect(localeFromHeader("zh-CN")).toBe("zh");
    expect(localeFromHeader("en-US")).toBe("en");
  });

  it("trả null với giá trị không hỗ trợ", () => {
    expect(localeFromHeader("ja-JP")).toBeNull();
    expect(localeFromHeader(undefined)).toBeNull();
    expect(localeFromHeader(["vi"])).toBeNull();
  });
});

describe("getLocale — đồng bộ o_setting theo header", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.integer("id");
      t.string("key");
      t.string("value");
    });
    setMockDb(db);
  });

  afterEach(async () => {
    await db.destroy();
    vi.restoreAllMocks();
  });

  function req(lang?: string) {
    return { headers: lang === undefined ? {} : { "x-toonflow-lang": lang } };
  }

  /**
   * Wraps a real knex instance so every `insert`/`update` issued through it is counted, without
   * touching knex internals — each `db(table)` call in locale.ts gets a fresh query builder, so
   * patching those two methods on that fresh builder intercepts every write it makes.
   */
  function withWriteCounter(realDb: Knex) {
    let writes = 0;
    const wrapped: any = (...args: Parameters<Knex>) => {
      const builder: any = (realDb as any)(...args);
      const origInsert = builder.insert.bind(builder);
      const origUpdate = builder.update.bind(builder);
      builder.insert = (...a: unknown[]) => {
        writes++;
        return origInsert(...a);
      };
      builder.update = (...a: unknown[]) => {
        writes++;
        return origUpdate(...a);
      };
      return builder;
    };
    // The locale-change trigger now also runs syncGuardedPromptSeeds(db, locale), which calls
    // `knex.schema.hasTable("o_prompt")` — forward `.schema` so that resolves against the real
    // (o_prompt-less) db here instead of throwing "Cannot read properties of undefined".
    wrapped.schema = realDb.schema;
    return { wrapped, getWrites: () => writes };
  }

  it("header trùng giá trị đã lưu: không ghi gì vào DB", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "vi" });
    const { wrapped, getWrites } = withWriteCounter(db);
    setMockDb(wrapped);

    const locale = await getLocale(req("vi-VN"));
    expect(locale).toBe("vi");
    expect(getWrites()).toBe(0);
    const row = await db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
    expect(row.value).toBe("vi");
  });

  it("header khác giá trị đã lưu: ghi đúng một lần và trả về locale mới", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "en" });
    const { wrapped, getWrites } = withWriteCounter(db);
    setMockDb(wrapped);

    const locale = await getLocale(req("vi-VN"));
    expect(locale).toBe("vi");
    expect(getWrites()).toBe(1);
    const rows = await db("o_setting").where("key", LANGUAGE_SETTING_KEY).select("*");
    expect(rows.length).toBe(1);
    expect(rows[0].value).toBe("vi");
  });

  it("header khác giá trị đã lưu nhưng chưa có bản ghi nào: chèn mới đúng một lần", async () => {
    const { wrapped, getWrites } = withWriteCounter(db);
    setMockDb(wrapped);

    const locale = await getLocale(req("vi-VN"));
    expect(locale).toBe("vi");
    expect(getWrites()).toBe(1);
    const rows = await db("o_setting").where("key", LANGUAGE_SETTING_KEY).select("*");
    expect(rows.length).toBe(1);
    expect(rows[0].value).toBe("vi");
  });

  it("header không hợp lệ: không ghi gì, trả về giá trị đã lưu", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "vi" });
    const { wrapped, getWrites } = withWriteCounter(db);
    setMockDb(wrapped);

    const locale = await getLocale(req("ja-JP"));
    expect(locale).toBe("vi");
    expect(getWrites()).toBe(0);
    const row = await db("o_setting").where("key", LANGUAGE_SETTING_KEY).first();
    expect(row.value).toBe("vi"); // unchanged
  });

  it("lỗi DB khi ghi vẫn trả về locale đã phân giải và không throw", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "en" });
    const brokenDb = () => {
      throw new Error("simulated db failure");
    };
    setMockDb(brokenDb);
    await expect(getLocale(req("vi-VN"))).resolves.toBe("vi");
  });
});

describe("getPromptLanguage — mặc định 'en' khi chưa có bản ghi", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.integer("id");
      t.string("key");
      t.string("value");
    });
    setMockDb(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("chưa có bản ghi prompt_language (cài đặt cũ chưa migrate) -> trả 'en'", async () => {
    expect(await getPromptLanguage()).toBe("en");
  });

  it("đã có bản ghi hợp lệ -> trả đúng giá trị đã lưu", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "vi" });
    expect(await getPromptLanguage()).toBe("vi");
  });

  it("bản ghi mang giá trị không hợp lệ -> lùi về 'en'", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "ja" });
    expect(await getPromptLanguage()).toBe("en");
  });

  it("prompt_language độc lập với content_language: đổi content_language không ảnh hưởng", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "vi" });
    expect(await getPromptLanguage()).toBe("en");
    expect(await getLocale()).toBe("vi");
  });
});

describe("đổi prompt_language → đồng bộ lại prompt seed (không cần khởi động lại)", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.integer("id");
      t.string("key");
      t.string("value");
    });
    await db.schema.createTable("o_prompt", (t) => {
      t.integer("id");
      t.string("name");
      t.string("type");
      t.text("data");
      t.text("useData");
    });
    await db("o_prompt").insert(
      SEED_PROMPT_TYPES.map((type, index) => ({
        id: index + 1,
        type,
        data: getSeedPrompt(type, "zh"),
      })),
    );
    setMockDb(db);
    syncCallCount = 0;
    syncImplOverride = null;
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("setPromptLanguage sang ngôn ngữ mới đồng bộ lại cả bốn prompt seed chưa sửa", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "zh" });

    await setPromptLanguage("en");

    expect(syncCallCount).toBe(1);
    for (const type of SEED_PROMPT_TYPES) {
      const row = await db("o_prompt").where("type", type).first();
      expect(row.data).toBe(getSeedPrompt(type, "en"));
    }
  });

  it("prompt đã bị người dùng sửa thì không bị đổi khi chuyển prompt_language, các prompt chưa sửa khác vẫn được đồng bộ", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "zh" });
    const edited = "Nội dung tôi tự viết lại hoàn toàn, không phải seed.";
    await db("o_prompt").where("type", "eventExtraction").update({ data: edited });

    await setPromptLanguage("en");

    const editedRow = await db("o_prompt").where("type", "eventExtraction").first();
    expect(editedRow.data).toBe(edited);
    const untouchedType = SEED_PROMPT_TYPES.find((t) => t !== "eventExtraction")!;
    const otherRow = await db("o_prompt").where("type", untouchedType).first();
    expect(otherRow.data).toBe(getSeedPrompt(untouchedType, "en"));
  });

  it("gọi setPromptLanguage với đúng giá trị hiện tại: không ghi DB, không đồng bộ prompt", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "vi" });

    await setPromptLanguage("vi");

    expect(syncCallCount).toBe(0);
    const row = await db("o_prompt").where("type", "eventExtraction").first();
    expect(row.data).toBe(getSeedPrompt("eventExtraction", "zh")); // untouched
  });

  it("chưa có bản ghi prompt_language: setPromptLanguage chèn mới và vẫn đồng bộ prompt", async () => {
    await setPromptLanguage("vi");

    expect(syncCallCount).toBe(1);
    const setting = await db("o_setting").where("key", PROMPT_LANGUAGE_SETTING_KEY).first();
    expect(setting.value).toBe("vi");
  });

  it("lỗi trong lúc đồng bộ prompt không làm hỏng request đổi prompt_language, chỉ log lỗi ra console", async () => {
    await db("o_setting").insert({ key: PROMPT_LANGUAGE_SETTING_KEY, value: "zh" });
    const boom = new Error("simulated prompt sync failure");
    syncImplOverride = async () => {
      throw boom;
    };
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(setPromptLanguage("en")).resolves.toBeUndefined();

    const setting = await db("o_setting").where("key", PROMPT_LANGUAGE_SETTING_KEY).first();
    expect(setting.value).toBe("en"); // the prompt_language change itself still took effect
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});

describe("đổi content_language KHÔNG đồng bộ lại prompt seed — chỉ prompt_language mới đồng bộ", () => {
  let db: Knex;

  beforeEach(async () => {
    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.integer("id");
      t.string("key");
      t.string("value");
    });
    await db.schema.createTable("o_prompt", (t) => {
      t.integer("id");
      t.string("name");
      t.string("type");
      t.text("data");
      t.text("useData");
    });
    await db("o_prompt").insert(
      SEED_PROMPT_TYPES.map((type, index) => ({
        id: index + 1,
        type,
        data: getSeedPrompt(type, "zh"),
      })),
    );
    setMockDb(db);
    syncCallCount = 0;
    syncImplOverride = null;
  });

  afterEach(async () => {
    await db.destroy();
  });

  it("setLocale sang ngôn ngữ mới KHÔNG đồng bộ prompt seed", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "zh" });

    await setLocale("en");

    expect(syncCallCount).toBe(0);
    const row = await db("o_prompt").where("type", "eventExtraction").first();
    expect(row.data).toBe(getSeedPrompt("eventExtraction", "zh")); // untouched
  });

  it("header đổi content_language (qua getLocale) cũng KHÔNG đồng bộ prompt seed", async () => {
    await db("o_setting").insert({ key: LANGUAGE_SETTING_KEY, value: "zh" });

    const locale = await getLocale({ headers: { "x-toonflow-lang": "en-US" } });

    expect(locale).toBe("en");
    expect(syncCallCount).toBe(0);
    const row = await db("o_prompt").where("type", "eventExtraction").first();
    expect(row.data).toBe(getSeedPrompt("eventExtraction", "zh"));
  });
});
