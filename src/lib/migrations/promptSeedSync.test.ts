import { describe, it, expect, beforeEach, afterEach } from "vitest";
import knexFactory, { type Knex } from "knex";
import {
  syncGuardedPromptSeeds,
  ensureAudioBindPromptSeeded,
  LEGACY_SCRIPT_ASSET_EXTRACTION_ZH,
} from "./promptSeedSync";
import { getSeedPrompt, SEED_PROMPT_TYPES } from "@/lib/prompts";

let db: Knex;

async function createTables() {
  await db.schema.createTable("o_prompt", (t) => {
    t.integer("id");
    t.string("name");
    t.string("type");
    t.text("data");
    t.text("useData");
  });
}

beforeEach(async () => {
  db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
  await createTables();
});

afterEach(async () => {
  await db.destroy();
});

describe("syncGuardedPromptSeeds", () => {
  it("cập nhật bản ghi còn khớp seed hiện tại (zh)", async () => {
    await db("o_prompt").insert({
      id: 1,
      type: "scriptAssetExtraction",
      data: getSeedPrompt("scriptAssetExtraction", "zh"),
    });
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.data).toBe(getSeedPrompt("scriptAssetExtraction", "zh"));
  });

  it("cập nhật bản ghi khớp seed cũ (legacy, seed trước refactor của initDB.ts) lên seed hiện tại", async () => {
    // LEGACY_SCRIPT_ASSET_EXTRACTION_ZH is the old src/lib/initDB.ts seed text for
    // scriptAssetExtraction, byte-distinct from the current (fixDB-derived) seed text — a row still
    // holding it has never been edited by a user and must be recognized via the legacy variant list.
    expect(LEGACY_SCRIPT_ASSET_EXTRACTION_ZH).not.toBe(getSeedPrompt("scriptAssetExtraction", "zh"));
    await db("o_prompt").insert({ id: 1, type: "scriptAssetExtraction", data: LEGACY_SCRIPT_ASSET_EXTRACTION_ZH });
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(0);
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.data).toBe(getSeedPrompt("scriptAssetExtraction", "zh"));
  });

  it("nội dung tình cờ giống một chuỗi ngẫu nhiên (không phải seed) vẫn bị bỏ qua", async () => {
    await db("o_prompt").insert({ id: 1, type: "scriptAssetExtraction", data: "not a seed value at all" });
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
  });

  it("không đè lên bản ghi người dùng đã sửa (so khớp đúng từng byte)", async () => {
    const userEdited = "Nội dung tôi tự viết lại hoàn toàn, không phải seed.";
    await db("o_prompt").insert({ id: 1, type: "scriptAssetExtraction", data: userEdited });
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.skipped).toBe(1);
    expect(result.updated).toBe(0);
    const row = await db("o_prompt").where("id", 1).first();
    expect(row.data).toBe(userEdited);
  });

  it("không đè lên videoPromptGeneration đã sửa, vẫn cập nhật scriptAssetExtraction chưa sửa", async () => {
    const userEdited = "Bản video prompt tôi tự sửa.";
    await db("o_prompt").insert([
      { id: 1, type: "scriptAssetExtraction", data: getSeedPrompt("scriptAssetExtraction", "zh") },
      { id: 2, type: "videoPromptGeneration", data: userEdited },
    ]);
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.updated).toBe(1);
    expect(result.skipped).toBe(1);
    const script = await db("o_prompt").where("id", 1).first();
    const video = await db("o_prompt").where("id", 2).first();
    expect(script.data).toBe(getSeedPrompt("scriptAssetExtraction", "zh"));
    expect(video.data).toBe(userEdited);
  });

  it("bỏ qua khi không có bản ghi cho loại prompt đó", async () => {
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.updated).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("chạy lại lần hai không thay đổi gì (idempotent)", async () => {
    await db("o_prompt").insert([
      { id: 1, type: "scriptAssetExtraction", data: getSeedPrompt("scriptAssetExtraction", "zh") },
      { id: 2, type: "videoPromptGeneration", data: getSeedPrompt("videoPromptGeneration", "zh") },
    ]);
    await syncGuardedPromptSeeds(db, "zh");
    const before = await db("o_prompt").select("*").orderBy("id");
    const second = await syncGuardedPromptSeeds(db, "zh");
    const after = await db("o_prompt").select("*").orderBy("id");
    expect(second.updated).toBe(2); // still "matches a seed variant" — but content unchanged, no write issued
    expect(after).toEqual(before);
  });

  it("bảng o_prompt chưa tồn tại thì không lỗi, trả về 0/0", async () => {
    await db.schema.dropTable("o_prompt");
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result).toEqual({ updated: 0, skipped: 0 });
  });

  it("đồng bộ cả bốn loại seed prompt (bug: eventExtraction/audioBindPrompt trước đây không bao giờ được đồng bộ lại)", async () => {
    // Driven off SEED_PROMPT_TYPES so a fifth prompt type added later cannot be silently
    // forgotten by the guarded sync.
    expect(SEED_PROMPT_TYPES).toEqual(
      expect.arrayContaining(["eventExtraction", "scriptAssetExtraction", "videoPromptGeneration", "audioBindPrompt"]),
    );
    await db("o_prompt").insert(
      SEED_PROMPT_TYPES.map((type, index) => ({
        id: index + 1,
        type,
        data: getSeedPrompt(type, "zh"),
      })),
    );
    const result = await syncGuardedPromptSeeds(db, "en");
    expect(result.updated).toBe(SEED_PROMPT_TYPES.length);
    expect(result.skipped).toBe(0);
    for (const type of SEED_PROMPT_TYPES) {
      const row = await db("o_prompt").where("type", type).first();
      expect(row.data).toBe(getSeedPrompt(type, "en"));
    }
  });

  it("không đè lên eventExtraction hoặc audioBindPrompt đã bị người dùng sửa", async () => {
    const eventEdited = "Nội dung eventExtraction tôi tự sửa.";
    const audioEdited = "Nội dung audioBindPrompt tôi tự sửa.";
    await db("o_prompt").insert([
      { id: 1, type: "eventExtraction", data: eventEdited },
      { id: 2, type: "audioBindPrompt", data: audioEdited },
    ]);
    const result = await syncGuardedPromptSeeds(db, "zh");
    expect(result.skipped).toBe(2);
    expect(result.updated).toBe(0);
    const event = await db("o_prompt").where("id", 1).first();
    const audio = await db("o_prompt").where("id", 2).first();
    expect(event.data).toBe(eventEdited);
    expect(audio.data).toBe(audioEdited);
  });
});

describe("ensureAudioBindPromptSeeded", () => {
  it("chèn bản ghi khi chưa tồn tại", async () => {
    await ensureAudioBindPromptSeeded(db, "zh");
    const row = await db("o_prompt").where("type", "audioBindPrompt").first();
    expect(row).toBeTruthy();
    expect(row.data).toBe(getSeedPrompt("audioBindPrompt", "zh"));
    expect(row.name).toBe("Voice Binding");
  });

  it("không chèn thêm khi đã tồn tại, kể cả khi người dùng đã sửa nội dung", async () => {
    await db("o_prompt").insert({ id: 1, type: "audioBindPrompt", name: "Voice Binding", data: "nội dung tôi tự sửa" });
    await ensureAudioBindPromptSeeded(db, "zh");
    const rows = await db("o_prompt").where("type", "audioBindPrompt").select("*");
    expect(rows.length).toBe(1);
    expect(rows[0].data).toBe("nội dung tôi tự sửa");
  });

  it("chạy lại nhiều lần không tạo thêm bản ghi", async () => {
    await ensureAudioBindPromptSeeded(db, "zh");
    await ensureAudioBindPromptSeeded(db, "zh");
    const rows = await db("o_prompt").where("type", "audioBindPrompt").select("*");
    expect(rows.length).toBe(1);
  });
});
