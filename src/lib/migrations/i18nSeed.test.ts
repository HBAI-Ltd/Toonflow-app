import { describe, it, expect, beforeEach, afterEach } from "vitest";
import knexFactory, { type Knex } from "knex";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { migrateI18nSeed } from "./i18nSeed";

let db: Knex;
let vendorDir: string;

async function createTables() {
  await db.schema.createTable("o_agentDeploy", (t) => {
    t.integer("id");
    t.string("key");
    t.string("name");
    t.string("desc");
  });
  await db.schema.createTable("o_prompt", (t) => {
    t.integer("id");
    t.string("name");
    t.string("type");
  });
  await db.schema.createTable("o_tasks", (t) => {
    t.integer("id");
    t.string("taskClass");
  });
}

beforeEach(async () => {
  db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
  await createTables();
  vendorDir = fs.mkdtempSync(path.join(os.tmpdir(), "i18nSeed-vendor-"));
});

afterEach(async () => {
  await db.destroy();
  fs.rmSync(vendorDir, { recursive: true, force: true });
});

describe("migrateI18nSeed — o_agentDeploy", () => {
  it("cập nhật bản ghi còn khớp nguyên văn seed tiếng Trung", async () => {
    await db("o_agentDeploy").insert({
      id: 1,
      key: "scriptAgent",
      name: "剧本Agent",
      desc: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型",
    });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(result.agentDeploy.updated).toBe(1);
    const row = await db("o_agentDeploy").where("id", 1).first();
    expect(row.name).toBe("Script Agent");
    expect(row.desc).toBe(
      "Reads the source text to generate the story skeleton and adaptation strategy. A model with strong text comprehension and generation ability is recommended.",
    );
  });

  it("không đè lên bản ghi người dùng đã sửa", async () => {
    await db("o_agentDeploy").insert({
      id: 1,
      key: "scriptAgent",
      name: "Tên tôi tự đặt",
      desc: "Mô tả tôi tự viết",
    });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const row = await db("o_agentDeploy").where("id", 1).first();
    expect(row.name).toBe("Tên tôi tự đặt");
    expect(row.desc).toBe("Mô tả tôi tự viết");
    expect(result.agentDeploy.skipped).toBeGreaterThan(0);
  });

  it("chạy lại nhiều lần không đổi kết quả", async () => {
    await db("o_agentDeploy").insert({
      id: 1,
      key: "scriptAgent",
      name: "剧本Agent",
      desc: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型",
    });
    await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const second = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(second.agentDeploy.updated).toBe(0);
  });

  it("bỏ qua khoá key không xác định", async () => {
    await db("o_agentDeploy").insert({ id: 1, key: "unknownKey", name: "随便", desc: "随便" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const row = await db("o_agentDeploy").where("id", 1).first();
    expect(row.name).toBe("随便");
    expect(result.agentDeploy.updated).toBe(0);
  });
});

describe("migrateI18nSeed — o_prompt", () => {
  it("cập nhật name còn khớp nguyên văn seed tiếng Trung", async () => {
    await db("o_prompt").insert({ id: 1, type: "eventExtraction", name: "事件提取" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(result.prompt.updated).toBe(1);
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.name).toBe("Event Extraction");
  });

  it("không đè lên name người dùng đã sửa", async () => {
    await db("o_prompt").insert({ id: 1, type: "eventExtraction", name: "Tên tôi tự đặt" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.name).toBe("Tên tôi tự đặt");
    expect(result.prompt.skipped).toBeGreaterThan(0);
  });
});

describe("migrateI18nSeed — locale zh không được ghi đè dữ liệu tiếng Trung của người dùng", () => {
  it("agentDeploy: locale zh -> 0 bản ghi được cập nhật, giá trị tiếng Trung giữ nguyên", async () => {
    await db("o_agentDeploy").insert({
      id: 1,
      key: "scriptAgent",
      name: "剧本Agent",
      desc: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型",
    });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "zh" });
    expect(result.agentDeploy.updated).toBe(0);
    expect(result.agentDeploy.skipped).toBe(0);
    const row = await db("o_agentDeploy").where("id", 1).first();
    expect(row.name).toBe("剧本Agent");
    expect(row.desc).toBe("用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型");
  });

  it("prompt: locale zh -> 0 bản ghi được cập nhật, giá trị tiếng Trung giữ nguyên", async () => {
    await db("o_prompt").insert({ id: 1, type: "eventExtraction", name: "事件提取" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "zh" });
    expect(result.prompt.updated).toBe(0);
    expect(result.prompt.skipped).toBe(0);
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.name).toBe("事件提取");
  });
});

describe("migrateI18nSeed — o_tasks.taskClass", () => {
  it("chuyển taskClass tiếng Trung cũ sang bản dịch theo locale", async () => {
    await db("o_tasks").insert({ id: 1, taskClass: "角色图生成" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(result.taskClass.updated).toBe(1);
    const row = await db("o_tasks").where("id", 1).first();
    expect(row.taskClass).toBe("Character Image Generation");
  });

  it("dịch sang tiếng Việt khi locale là vi", async () => {
    await db("o_tasks").insert({ id: 1, taskClass: "角色图生成" });
    await migrateI18nSeed(db, { vendorDir, locale: "vi" });
    const row = await db("o_tasks").where("id", 1).first();
    expect(row.taskClass).toBe("Tạo ảnh nhân vật");
  });

  it("giữ nguyên taskClass không xác định (giá trị người dùng/khác)", async () => {
    await db("o_tasks").insert({ id: 1, taskClass: "Some Custom Value" });
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const row = await db("o_tasks").where("id", 1).first();
    expect(row.taskClass).toBe("Some Custom Value");
    expect(result.taskClass.updated).toBe(0);
  });

  it("chạy lại nhiều lần không đổi kết quả", async () => {
    await db("o_tasks").insert({ id: 1, taskClass: "角色图生成" });
    await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const second = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(second.taskClass.updated).toBe(0);
  });
});

describe("migrateI18nSeed — vendor files", () => {
  const TARGET_FILE = "atlascloud.ts";
  // Real pre-translation content of data/vendor/atlascloud.ts as of commit 67d4e1c (parent of the
  // vendor-translation commit 25bd959) — its sha256 is exactly the hash baked into the migration.
  const OLD_CONTENT = fs.readFileSync(
    path.join(__dirname, "__fixtures__", "atlascloud_old.ts.txt"),
    "utf-8",
  );
  // Sanity check the fixture itself, so a stale fixture fails loudly instead of silently no-op'ing.
  const OLD_HASH = "d3b6523f05a4e8d82ab1f4da8cc2a78fefd2f6f87bff31bdb10581069381866f";

  it("fixture khớp đúng hash tiền-dịch đã biết", () => {
    expect(crypto.createHash("sha256").update(OLD_CONTENT, "utf-8").digest("hex")).toBe(OLD_HASH);
  });

  it("thay thế file vendor có hash khớp bản gốc trước dịch", async () => {
    fs.writeFileSync(path.join(vendorDir, TARGET_FILE), OLD_CONTENT);
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const newContent = fs.readFileSync(path.join(vendorDir, TARGET_FILE), "utf-8");
    expect(newContent).not.toBe(OLD_CONTENT);
    // The replacement must be the translated bundled source for this vendor.
    const vendorData = (await import("../vendor.json")).default as Record<string, string>;
    expect(newContent).toBe(vendorData["atlascloud.ts"]);
    expect(result.vendorFiles.updated).toBe(1);
  });

  it("không đè file vendor mà người dùng đã sửa (hash không khớp)", async () => {
    fs.writeFileSync(path.join(vendorDir, TARGET_FILE), "// user customised content\n");
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(fs.readFileSync(path.join(vendorDir, TARGET_FILE), "utf-8")).toBe("// user customised content\n");
    expect(result.vendorFiles.skipped).toBeGreaterThan(0);
  });

  it("bỏ qua khi file vendor không tồn tại trên đĩa", async () => {
    const result = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(fs.existsSync(path.join(vendorDir, TARGET_FILE))).toBe(false);
    expect(result.vendorFiles.updated).toBe(0);
  });

  it("chạy lại nhiều lần không đổi kết quả — lần 2 không update lại file đã thay", async () => {
    fs.writeFileSync(path.join(vendorDir, TARGET_FILE), OLD_CONTENT);
    const first = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const contentAfterFirst = fs.readFileSync(path.join(vendorDir, TARGET_FILE), "utf-8");
    const second = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const contentAfterSecond = fs.readFileSync(path.join(vendorDir, TARGET_FILE), "utf-8");
    expect(first.vendorFiles.updated).toBe(1);
    expect(second.vendorFiles.updated).toBe(0);
    expect(contentAfterSecond).toBe(contentAfterFirst);
  });

  it("chạy lại nhiều lần không đổi kết quả với file không khớp", async () => {
    fs.writeFileSync(path.join(vendorDir, TARGET_FILE), "// user customised content\n");
    await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const second = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    expect(second.vendorFiles.updated).toBe(0);
  });
});

describe("migrateI18nSeed — idempotent toàn cục và không đè dữ liệu người dùng", () => {
  it("chạy toàn bộ migration hai lần trên dữ liệu hỗn hợp (seed cũ + đã sửa) không đổi ở lần 2", async () => {
    const OLD_CONTENT = fs.readFileSync(
      path.join(__dirname, "__fixtures__", "atlascloud_old.ts.txt"),
      "utf-8",
    );
    // A realistic mixed install: some rows still hold the old Chinese seed, some were edited by
    // the user, and the vendor file was never touched.
    await db("o_agentDeploy").insert([
      { id: 1, key: "scriptAgent", name: "剧本Agent", desc: "用于读取原文生成故事骨架、改编策略，建议使用具备强大文本理解和生成能力的模型" },
      { id: 2, key: "productionAgent", name: "Tên tôi tự đặt", desc: "Mô tả tôi tự viết" },
    ]);
    await db("o_prompt").insert([
      { id: 1, type: "eventExtraction", name: "事件提取" },
      { id: 2, type: "audioBindPrompt", name: "Tên khác của tôi" },
    ]);
    await db("o_tasks").insert([
      { id: 1, taskClass: "角色图生成" },
      { id: 2, taskClass: "Giá trị người dùng đặt" },
    ]);
    fs.writeFileSync(path.join(vendorDir, "atlascloud.ts"), OLD_CONTENT);

    const first = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const snapshotAfterFirst = {
      agentDeploy: await db("o_agentDeploy").select("*").orderBy("id"),
      prompt: await db("o_prompt").select("*").orderBy("id"),
      tasks: await db("o_tasks").select("*").orderBy("id"),
      vendorFile: fs.readFileSync(path.join(vendorDir, "atlascloud.ts"), "utf-8"),
    };

    // Sanity: the seed rows changed, the user-edited rows did not.
    expect(snapshotAfterFirst.agentDeploy[0].name).toBe("Script Agent");
    expect(snapshotAfterFirst.agentDeploy[1].name).toBe("Tên tôi tự đặt");
    expect(snapshotAfterFirst.prompt[0].name).toBe("Event Extraction");
    expect(snapshotAfterFirst.prompt[1].name).toBe("Tên khác của tôi");
    expect(snapshotAfterFirst.tasks[0].taskClass).toBe("Character Image Generation");
    expect(snapshotAfterFirst.tasks[1].taskClass).toBe("Giá trị người dùng đặt");
    expect(first.updated).toBeGreaterThan(0);
    expect(first.skipped).toBeGreaterThan(0);

    const second = await migrateI18nSeed(db, { vendorDir, locale: "en" });
    const snapshotAfterSecond = {
      agentDeploy: await db("o_agentDeploy").select("*").orderBy("id"),
      prompt: await db("o_prompt").select("*").orderBy("id"),
      tasks: await db("o_tasks").select("*").orderBy("id"),
      vendorFile: fs.readFileSync(path.join(vendorDir, "atlascloud.ts"), "utf-8"),
    };

    expect(second.updated).toBe(0);
    expect(snapshotAfterSecond).toEqual(snapshotAfterFirst);
  });
});

describe("migrateI18nSeed — cách ly lỗi", () => {
  it("lỗi bên trong không lan ra ngoài khi gọi qua safeMigrateI18nSeed", async () => {
    const { safeMigrateI18nSeed } = await import("./i18nSeed");
    // Pass a knex whose query throws to simulate a failure deep inside the migration.
    const throwingDb = {
      schema: { hasTable: async () => true },
      // Calling this fake as a function (i.e. `knex("o_agentDeploy")`) throws — that's the point.
    } as unknown as Knex;
    await expect(safeMigrateI18nSeed(throwingDb, { vendorDir, locale: "en" })).resolves.not.toThrow();
  });
});
