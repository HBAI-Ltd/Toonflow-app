import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import knexFactory, { type Knex } from "knex";
import { localeFromHeader, getLocale, LANGUAGE_SETTING_KEY } from "./locale";

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

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => getMockDb()(...args),
  },
}));

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
    const wrapped = (...args: Parameters<Knex>) => {
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
