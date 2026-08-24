import fs from "fs";
import os from "os";
import path from "path";
import type { AddressInfo } from "net";
import express from "express";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

// data/skills thật không được đụng tới trong test này: mock u.getPath để trỏ mọi route
// về một thư mục tạm, giả lập cấu trúc data/skills mà không chạm file thật.
let skillsRoot: string;
let tmpRoot: string;

vi.mock("@/utils", () => ({
  default: {
    getPath: (parts: string[] | string) => {
      const arr = Array.isArray(parts) ? parts : [parts];
      // route luôn gọi u.getPath(["skills"]) hoặc u.getPath(["skills", ...path đã join sẵn]);
      // arr[0] === "skills" trong mọi trường hợp ở 3 route đang test.
      return path.join(tmpRoot, ...arr);
    },
  },
}));

const app = express();

describe("skillManagement routes (list/content/save)", () => {
  let server: ReturnType<typeof app.listen>;
  let baseUrl: string;

  beforeAll(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "skill-mgmt-test-"));
    skillsRoot = path.join(tmpRoot, "skills");
    fs.mkdirSync(skillsRoot, { recursive: true });

    // skill "no_sidecar": chỉ có bản gốc zh, chưa ai dịch.
    fs.mkdirSync(path.join(skillsRoot, "no_sidecar"), { recursive: true });
    fs.writeFileSync(path.join(skillsRoot, "no_sidecar", "production_agent_decision.md"), "中文原文", "utf-8");

    // skill "has_vi": có bản gốc zh + sidecar vi đã dịch sẵn.
    fs.mkdirSync(path.join(skillsRoot, "has_vi"), { recursive: true });
    fs.writeFileSync(path.join(skillsRoot, "has_vi", "foo.md"), "中文原文 foo", "utf-8");
    fs.writeFileSync(path.join(skillsRoot, "has_vi", "foo.vi.md"), "noi dung tieng viet foo", "utf-8");

    // skill "locale_guard": bản gốc + sidecar vi + sidecar en, dùng riêng cho các test
    // path/locale guard bên dưới để không phụ thuộc thứ tự chạy với các test khác đang
    // mutate "has_vi"/"no_sidecar".
    fs.mkdirSync(path.join(skillsRoot, "locale_guard"), { recursive: true });
    fs.writeFileSync(path.join(skillsRoot, "locale_guard", "foo.md"), "原始中文 guard", "utf-8");
    fs.writeFileSync(path.join(skillsRoot, "locale_guard", "foo.vi.md"), "ban dich vi goc guard", "utf-8");
    fs.writeFileSync(path.join(skillsRoot, "locale_guard", "foo.en.md"), "original english guard", "utf-8");

    const { default: getSkillListRouter } = await import("./getSkillList");
    const { default: getSkillContentRouter } = await import("./getSkillContent");
    const { default: saveSkillContentRouter } = await import("./saveSkillContent");

    app.use(express.json());
    app.use("/getSkillList", getSkillListRouter);
    app.use("/getSkillContent", getSkillContentRouter);
    app.use("/saveSkillContent", saveSkillContentRouter);

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

  describe("getSkillList", () => {
    it("mỗi skill xuất hiện đúng một lần, kể cả khi có 2-3 file trên đĩa", async () => {
      const { status, json } = await post("/getSkillList", {}, "vi");
      expect(status).toBe(200);
      const entries: string[] = json.data;
      const hasVi = entries.filter((e) => e.includes("has_vi/foo"));
      expect(hasVi).toHaveLength(1);
      const noSidecar = entries.filter((e) => e.includes("no_sidecar/production_agent_decision"));
      expect(noSidecar).toHaveLength(1);
    });

    it("locale vi -> skill đã có sidecar vi thì trả path sidecar (foo.vi.md)", async () => {
      const { json } = await post("/getSkillList", {}, "vi");
      const entries: string[] = json.data;
      expect(entries).toContain("has_vi/foo.vi.md");
      expect(entries).not.toContain("has_vi/foo.md");
    });

    it("locale vi -> skill chưa có sidecar thì trả bản gốc (production_agent_decision.md)", async () => {
      const { json } = await post("/getSkillList", {}, "vi");
      const entries: string[] = json.data;
      expect(entries).toContain("no_sidecar/production_agent_decision.md");
    });

    it("locale zh -> luôn trả bản gốc, kể cả skill có sidecar", async () => {
      const { json } = await post("/getSkillList", {}, "zh");
      const entries: string[] = json.data;
      expect(entries).toContain("has_vi/foo.md");
      expect(entries).not.toContain("has_vi/foo.vi.md");
    });
  });

  describe("getSkillContent", () => {
    it("locale vi, path bản gốc, sidecar vi tồn tại -> trả nội dung sidecar", async () => {
      const { status, json } = await post("/getSkillContent", { path: "has_vi/foo.md" }, "vi");
      expect(status).toBe(200);
      expect(json.data).toBe("noi dung tieng viet foo");
    });

    it("locale vi, chưa có sidecar -> lùi về nội dung bản gốc (chính là nội dung zh)", async () => {
      const { status, json } = await post("/getSkillContent", { path: "no_sidecar/production_agent_decision.md" }, "vi");
      expect(status).toBe(200);
      expect(json.data).toBe("中文原文");
    });

    it("locale zh -> luôn đọc bản gốc, không đọc sidecar dù có tồn tại", async () => {
      const { status, json } = await post("/getSkillContent", { path: "has_vi/foo.md" }, "zh");
      expect(status).toBe(200);
      expect(json.data).toBe("中文原文 foo");
    });

    it("path traversal (../) bị từ chối", async () => {
      const { status, json } = await post("/getSkillContent", { path: "../../../etc/passwd" }, "vi");
      expect(status).toBe(400);
      expect(json.data).toBeNull();
    });

    describe("path/locale guard", () => {
      it("path .vi.md dưới locale vi -> khớp, trả nội dung sidecar vi", async () => {
        const { status, json } = await post("/getSkillContent", { path: "locale_guard/foo.vi.md" }, "vi");
        expect(status).toBe(200);
        expect(json.data).toBe("ban dich vi goc guard");
      });

      it("path .vi.md dưới locale zh -> lệch, từ chối 400", async () => {
        const { status, json } = await post("/getSkillContent", { path: "locale_guard/foo.vi.md" }, "zh");
        expect(status).toBe(400);
        expect(json.data).toBeNull();
      });

      it("path .en.md dưới locale vi -> lệch, từ chối 400", async () => {
        const { status, json } = await post("/getSkillContent", { path: "locale_guard/foo.en.md" }, "vi");
        expect(status).toBe(400);
        expect(json.data).toBeNull();
      });

      it.each(["zh", "vi", "en"] as const)(
        "path không có hậu tố locale -> luôn được chấp nhận dưới locale %s",
        async (loc) => {
          const { status } = await post("/getSkillContent", { path: "locale_guard/foo.md" }, loc);
          expect(status).toBe(200);
        },
      );
    });
  });

  describe("saveSkillContent", () => {
    it("locale zh -> ghi thẳng bản gốc, hành vi y hệt trước đây", async () => {
      const { status } = await post(
        "/saveSkillContent",
        { path: "no_sidecar/production_agent_decision.md", content: "中文原文 v2" },
        "zh",
      );
      expect(status).toBe(200);
      expect(fs.readFileSync(path.join(skillsRoot, "no_sidecar", "production_agent_decision.md"), "utf-8")).toBe("中文原文 v2");
      // không tạo sidecar nào cho zh
      expect(fs.existsSync(path.join(skillsRoot, "no_sidecar", "production_agent_decision.zh.md"))).toBe(false);
    });

    it("locale vi -> tạo sidecar mới, KHÔNG đụng vào bản gốc", async () => {
      const originalBefore = fs.readFileSync(path.join(skillsRoot, "no_sidecar", "production_agent_decision.md"));

      const { status } = await post(
        "/saveSkillContent",
        { path: "no_sidecar/production_agent_decision.md", content: "noi dung tieng viet moi tao" },
        "vi",
      );
      expect(status).toBe(200);

      const sidecarPath = path.join(skillsRoot, "no_sidecar", "production_agent_decision.vi.md");
      expect(fs.existsSync(sidecarPath)).toBe(true);
      expect(fs.readFileSync(sidecarPath, "utf-8")).toBe("noi dung tieng viet moi tao");

      // Bản gốc byte-identical với trước khi save.
      const originalAfter = fs.readFileSync(path.join(skillsRoot, "no_sidecar", "production_agent_decision.md"));
      expect(originalAfter.equals(originalBefore)).toBe(true);
    });

    it("locale vi, path gửi lên là sidecar đã tồn tại (foo.vi.md) -> ghi lại đúng sidecar đó, không tạo foo.vi.vi.md", async () => {
      const { status } = await post("/saveSkillContent", { path: "has_vi/foo.vi.md", content: "ban dich vi cap nhat" }, "vi");
      expect(status).toBe(200);

      expect(fs.readFileSync(path.join(skillsRoot, "has_vi", "foo.vi.md"), "utf-8")).toBe("ban dich vi cap nhat");
      expect(fs.existsSync(path.join(skillsRoot, "has_vi", "foo.vi.vi.md"))).toBe(false);
      // bản gốc zh của has_vi không bị đụng
      expect(fs.readFileSync(path.join(skillsRoot, "has_vi", "foo.md"), "utf-8")).toBe("中文原文 foo");
    });

    it("locale en -> tạo sidecar .en.md riêng, không đụng bản gốc lẫn sidecar vi", async () => {
      const { status } = await post("/saveSkillContent", { path: "has_vi/foo.md", content: "english content" }, "en");
      expect(status).toBe(200);

      expect(fs.readFileSync(path.join(skillsRoot, "has_vi", "foo.en.md"), "utf-8")).toBe("english content");
      expect(fs.readFileSync(path.join(skillsRoot, "has_vi", "foo.md"), "utf-8")).toBe("中文原文 foo");
      expect(fs.readFileSync(path.join(skillsRoot, "has_vi", "foo.vi.md"), "utf-8")).not.toBe("english content");
    });

    it("save vào skill không tồn tại (bản gốc không có) -> từ chối, không tạo file nào", async () => {
      const { status } = await post("/saveSkillContent", { path: "khong_ton_tai/ghost.md", content: "x" }, "vi");
      expect(status).toBe(400);
      expect(fs.existsSync(path.join(skillsRoot, "khong_ton_tai"))).toBe(false);
    });

    it("path traversal (../) bị từ chối, không ghi ra ngoài skillsRoot", async () => {
      const { status } = await post("/saveSkillContent", { path: "../../evil.md", content: "pwned" }, "vi");
      expect(status).toBe(400);
      expect(fs.existsSync(path.join(tmpRoot, "evil.md"))).toBe(false);
    });

    describe("path/locale guard", () => {
      it("path .vi.md dưới locale vi -> khớp, ghi đúng sidecar vi", async () => {
        const { status } = await post(
          "/saveSkillContent",
          { path: "locale_guard/foo.vi.md", content: "ban dich vi cap nhat guard" },
          "vi",
        );
        expect(status).toBe(200);
        expect(fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.vi.md"), "utf-8")).toBe(
          "ban dich vi cap nhat guard",
        );
      });

      it("path .vi.md dưới locale zh -> lệch, từ chối 400, bản gốc VÀ sidecar vi byte-identical sau đó", async () => {
        const originalBefore = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.md"));
        const sidecarBefore = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.vi.md"));

        const { status } = await post(
          "/saveSkillContent",
          { path: "locale_guard/foo.vi.md", content: "noi dung chinese lech" },
          "zh",
        );
        expect(status).toBe(400);

        const originalAfter = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.md"));
        const sidecarAfter = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.vi.md"));
        expect(originalAfter.equals(originalBefore)).toBe(true);
        expect(sidecarAfter.equals(sidecarBefore)).toBe(true);
      });

      it("path .en.md dưới locale vi -> lệch, từ chối 400, sidecar en byte-identical sau đó", async () => {
        const enBefore = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.en.md"));

        const { status } = await post(
          "/saveSkillContent",
          { path: "locale_guard/foo.en.md", content: "noi dung vi lech" },
          "vi",
        );
        expect(status).toBe(400);

        const enAfter = fs.readFileSync(path.join(skillsRoot, "locale_guard", "foo.en.md"));
        expect(enAfter.equals(enBefore)).toBe(true);
      });

      it.each(["zh", "vi", "en"] as const)(
        "path không có hậu tố locale -> luôn được chấp nhận khi lưu dưới locale %s",
        async (loc) => {
          const dir = `no_suffix_guard_${loc}`;
          fs.mkdirSync(path.join(skillsRoot, dir), { recursive: true });
          fs.writeFileSync(path.join(skillsRoot, dir, "foo.md"), "原始中文", "utf-8");

          const { status } = await post("/saveSkillContent", { path: `${dir}/foo.md`, content: "updated" }, loc);
          expect(status).toBe(200);
        },
      );
    });
  });
});
