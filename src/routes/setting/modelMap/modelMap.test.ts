import fs from "fs";
import os from "os";
import path from "path";
import type { AddressInfo } from "net";
import express from "express";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { canonicalSkillPath, readLocalizedSkill } from "@/i18n";

// data/modelPrompt thật không được đụng tới trong test này: mock u.getPath để trỏ mọi route về
// một thư mục tạm, và mock u.db bằng một bộ nhớ trong-tiến-trình đơn giản cho bảng o_modelPrompt
// (đủ để tái hiện chuỗi where/andWhere/select/first/update/insert mà các route dùng).
let modelPromptRoot: string;
let tmpRoot: string;

type Row = Record<string, any>;
let modelPromptTable: Row[] = [];

function makeQuery(rows: () => Row[]) {
  const filters: Row = {};
  const builder: any = {
    where(key: string, val?: any) {
      if (typeof key === "object") Object.assign(filters, key);
      else filters[key] = val;
      return builder;
    },
    andWhere(key: string, val: any) {
      filters[key] = val;
      return builder;
    },
    select: () => builder,
    first: async () => rows().find((r) => Object.entries(filters).every(([k, v]) => r[k] === v)),
    update: async (patch: Row) => {
      rows().forEach((r) => {
        if (Object.entries(filters).every(([k, v]) => r[k] === v)) Object.assign(r, patch);
      });
    },
    insert: async (row: Row) => {
      rows().push({ id: rows().length + 1, ...row });
    },
  };
  return builder;
}

vi.mock("@/utils", () => ({
  default: {
    getPath: (parts: string[] | string) => {
      const arr = Array.isArray(parts) ? parts : [parts];
      // route luôn gọi u.getPath(["modelPrompt"]); arr[0] === "modelPrompt" trong mọi route đang test.
      return path.join(tmpRoot, ...arr);
    },
    db: (table: string) => {
      if (table === "o_modelPrompt") return makeQuery(() => modelPromptTable);
      // o_setting: getLocale (khi có header) gọi u.db("o_setting")... best-effort, lỗi bị nuốt
      // (xem persistLocaleFromHeader trong src/i18n/locale.ts) -> trả bảng rỗng là đủ.
      return makeQuery(() => []);
    },
  },
}));

const app = express();

describe("modelMap routes (getPromptList/bindingPrompt/deletePrompt/updatePrompt/savePrompt)", () => {
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "modelmap-test-"));
    modelPromptRoot = path.join(tmpRoot, "modelPrompt");
    fs.mkdirSync(path.join(modelPromptRoot, "video"), { recursive: true });

    // "mode": bản gốc zh (đặt tên trùng shipped list trong src/lib/shippedPrompts.ts) + 2 sidecar en/vi,
    // y hệt cấu trúc data/modelPrompt/video/ thật (4 mode x 3 file).
    fs.writeFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.md"), "zh content", "utf-8");
    fs.writeFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.en.md"), "en content", "utf-8");
    fs.writeFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.vi.md"), "vi content", "utf-8");

    // Prompt do người dùng tự thêm, cùng thư mục video/ nhưng tên khác — không nằm trong shipped
    // list, không có sidecar nào.
    fs.writeFileSync(path.join(modelPromptRoot, "video", "myCustomPrompt.md"), "custom content", "utf-8");

    const { default: getPromptListRouter } = await import("./getPromptList");
    const { default: bindingPromptRouter } = await import("./bindingPrompt");
    const { default: deletePromptRouter } = await import("./deletePrompt");
    const { default: updatePromptRouter } = await import("./updatePrompt");
    const { default: savePromptRouter } = await import("./savePrompt");

    app.use(express.json());
    app.use("/getPromptList", getPromptListRouter);
    app.use("/bindingPrompt", bindingPromptRouter);
    app.use("/deletePrompt", deletePromptRouter);
    app.use("/updatePrompt", updatePromptRouter);
    app.use("/savePrompt", savePromptRouter);

    await new Promise<void>((resolve) => {
      server = app.listen(0, () => resolve());
    });
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  async function get(routePath: string, locale?: string) {
    const res = await fetch(`${baseUrl}${routePath}`, {
      headers: { ...(locale ? { "x-toonflow-lang": locale } : {}) },
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  async function post(routePath: string, body: unknown, locale?: string) {
    const res = await fetch(`${baseUrl}${routePath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(locale ? { "x-toonflow-lang": locale } : {}),
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return { status: res.status, json };
  }

  describe("getPromptList", () => {
    it("trả về 1 entry mặc định + 1 entry mỗi biến thể ngôn ngữ có trên đĩa (gốc zh + en + vi sidecar = 4 entries)", async () => {
      const { status, json } = await get("/getPromptList", "vi");
      expect(status).toBe(200);
      const entries: { path: string }[] = json.data;
      const mode = entries.filter((e) => e.path.includes("seedance2Multi-parameterMode"));
      expect(mode).toHaveLength(4);
    });

    it("entry mặc định gắn với path canonical (không hậu tố)", async () => {
      const { json } = await get("/getPromptList", "en");
      const entries: { path: string; name: string }[] = json.data;
      const mode = entries.filter((e) => e.path.includes("seedance2Multi-parameterMode"));
      const defaultEntry = mode.find((e) => e.path === "video/seedance2Multi-parameterMode.md" && e.name.includes("Default"))!;
      expect(defaultEntry).toBeTruthy();
    });

    it("mỗi biến thể ngôn ngữ có path và nhãn (name) riêng biệt, đọc đúng nội dung file đó", async () => {
      const { json } = await get("/getPromptList", "en");
      const entries: { path: string; name: string; data: string }[] = json.data;
      const mode = entries.filter((e) => e.path.includes("seedance2Multi-parameterMode"));

      const en = mode.find((e) => e.path === "video/seedance2Multi-parameterMode.en.md")!;
      const vi = mode.find((e) => e.path === "video/seedance2Multi-parameterMode.vi.md")!;
      const zh = mode.find((e) => e.path === "video/seedance2Multi-parameterMode.md" && !e.name.includes("Default"))!;

      expect(en.data).toBe("en content");
      expect(vi.data).toBe("vi content");
      expect(zh.data).toBe("zh content");

      // Distinct labels — every path in the group has a different name, so a user can tell them apart.
      const names = new Set(mode.map((e) => e.name));
      expect(names.size).toBe(mode.length);
    });

    it("prompt do người dùng tự thêm (không có sidecar) trả về 2 entries: mặc định + biến thể zh (không có en/vi)", async () => {
      const { json } = await get("/getPromptList", "vi");
      const entries: { path: string; name: string }[] = json.data;
      const custom = entries.filter((e) => e.path.includes("myCustomPrompt"));
      expect(custom).toHaveLength(2);
      expect(custom.every((e) => e.path === "video/myCustomPrompt.md")).toBe(true);
      const names = new Set(custom.map((e) => e.name));
      expect(names.size).toBe(2);
    });
  });

  describe("bindingPrompt", () => {
    it("path gửi lên là sidecar tường minh (foo.vi.md) -> lưu đúng path đó, ghim ngôn ngữ (tính năng có chủ đích)", async () => {
      const { status } = await post(
        "/bindingPrompt",
        {
          vendorId: "vendorA",
          model: "modelA",
          path: "video/seedance2Multi-parameterMode.vi.md",
          fileName: "seedance2Multi-parameterMode.vi.md",
        },
        "vi",
      );
      expect(status).toBe(200);
      const row = modelPromptTable.find((r) => r.vendorId === "vendorA" && r.model === "modelA");
      expect(row?.path).toBe("video/seedance2Multi-parameterMode.vi.md");
    });

    it("path gửi lên đã là base (canonical) -> giữ nguyên base khi lưu (theo cài đặt)", async () => {
      const { status } = await post(
        "/bindingPrompt",
        { vendorId: "vendorB", model: "modelB", path: "video/myCustomPrompt.md", fileName: "myCustomPrompt.md" },
        "en",
      );
      expect(status).toBe(200);
      const row = modelPromptTable.find((r) => r.vendorId === "vendorB" && r.model === "modelB");
      expect(row?.path).toBe("video/myCustomPrompt.md");
    });

    it("path traversal (../) bị từ chối, không ghi gì vào DB", async () => {
      const before = modelPromptTable.length;
      const { status } = await post(
        "/bindingPrompt",
        { vendorId: "vendorC", model: "modelC", path: "../../../etc/passwd", fileName: "passwd" },
        "en",
      );
      expect(status).toBe(400);
      expect(modelPromptTable.length).toBe(before);
    });

    it("bind lại cùng vendorId/model với một sidecar khác -> update path (pinned), không tạo dòng mới", async () => {
      await post(
        "/bindingPrompt",
        { vendorId: "vendorA", model: "modelA", path: "video/seedance2Multi-parameterMode.en.md", fileName: "x" },
        "en",
      );
      const rows = modelPromptTable.filter((r) => r.vendorId === "vendorA" && r.model === "modelA");
      expect(rows).toHaveLength(1);
      expect(rows[0].path).toBe("video/seedance2Multi-parameterMode.en.md");
    });
  });

  describe("deletePrompt — shipped-file guard", () => {
    it("từ chối xoá bản gốc shipped (seedance2Multi-parameterMode.md)", async () => {
      const { status } = await post("/deletePrompt", { path: "video/seedance2Multi-parameterMode.md" }, "en");
      expect(status).toBe(400);
      expect(fs.existsSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.md"))).toBe(true);
    });

    it("từ chối xoá sidecar shipped (seedance2Multi-parameterMode.vi.md)", async () => {
      const { status } = await post("/deletePrompt", { path: "video/seedance2Multi-parameterMode.vi.md" }, "en");
      expect(status).toBe(400);
      expect(fs.existsSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.vi.md"))).toBe(true);
    });

    it("cho phép xoá prompt do người dùng tự thêm dưới video/ (không nằm trong shipped list)", async () => {
      const userFile = path.join(modelPromptRoot, "video", "deleteMe.md");
      fs.writeFileSync(userFile, "x", "utf-8");
      const { status } = await post("/deletePrompt", { path: "video/deleteMe.md" }, "en");
      expect(status).toBe(200);
      expect(fs.existsSync(userFile)).toBe(false);
    });
  });

  describe("updatePrompt — shipped-file guard", () => {
    it("từ chối ghi đè nội dung bản gốc shipped", async () => {
      const before = fs.readFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.md"), "utf-8");
      const { status } = await post(
        "/updatePrompt",
        { name: "seedance2Multi-parameterMode", type: "video", data: "hacked" },
        "en",
      );
      expect(status).toBe(400);
      expect(fs.readFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.md"), "utf-8")).toBe(before);
    });

    it("cho phép cập nhật prompt do người dùng tự thêm", async () => {
      const { status } = await post("/updatePrompt", { name: "myCustomPrompt", type: "video", data: "updated custom" }, "en");
      expect(status).toBe(200);
      expect(fs.readFileSync(path.join(modelPromptRoot, "video", "myCustomPrompt.md"), "utf-8")).toBe("updated custom");
    });
  });

  describe("savePrompt — shipped-file guard", () => {
    it("từ chối tạo file mới trùng tên shipped (sẽ đè lên bản gốc)", async () => {
      const { status } = await post(
        "/savePrompt",
        { name: "seedance2Multi-parameterMode", type: "video", data: "overwrite attempt" },
        "en",
      );
      expect(status).toBe(400);
      expect(fs.readFileSync(path.join(modelPromptRoot, "video", "seedance2Multi-parameterMode.md"), "utf-8")).not.toBe(
        "overwrite attempt",
      );
    });

    it("cho phép tạo file mới với tên không trùng shipped", async () => {
      const { status } = await post("/savePrompt", { name: "brandNewPrompt", type: "video", data: "new content" }, "en");
      expect(status).toBe(200);
      expect(fs.readFileSync(path.join(modelPromptRoot, "video", "brandNewPrompt.md"), "utf-8")).toBe("new content");
    });
  });

  describe("read-side canonicalization (đúng như generateVideoPrompt.ts/batchGeneratePrompt.ts áp dụng)", () => {
    it("một o_modelPrompt.path cũ mang hậu tố locale (foo.vi.md) vẫn resolve đúng theo locale hiện tại sau khi canonicalize", () => {
      const legacyStoredPath = "video/seedance2Multi-parameterMode.vi.md"; // dòng DB cũ, trước khi bindingPrompt.ts canonicalize
      const fullPath = path.join(modelPromptRoot, canonicalSkillPath(legacyStoredPath));

      // Không canonicalize (hành vi lỗi cũ): locale "en" sẽ tìm foo.vi.en.md, không thấy, rồi lùi
      // về chính foo.vi.md -> luôn trả nội dung tiếng Việt bất kể locale, ghim cứng một ngôn ngữ.
      const buggyFullPath = path.join(modelPromptRoot, legacyStoredPath);
      expect(readLocalizedSkill(buggyFullPath, "en")).toBe("vi content");

      // Sau khi canonicalize trước khi gọi readLocalizedSkill: resolve đúng theo locale hiện tại.
      expect(readLocalizedSkill(fullPath, "en")).toBe("en content");
      expect(readLocalizedSkill(fullPath, "vi")).toBe("vi content");
      expect(readLocalizedSkill(fullPath, "zh")).toBe("zh content");
    });
  });
});
