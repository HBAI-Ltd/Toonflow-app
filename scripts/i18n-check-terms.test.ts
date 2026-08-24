import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { checkRegistry, loadContext, LIMITS, REGISTRY_PATH, type Context, type Problem } from "./i18n-check-terms";

const root = process.cwd();
const registry = JSON.parse(fs.readFileSync(path.join(root, REGISTRY_PATH), "utf-8"));
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const ids = (problems: Problem[]) => problems.map((p) => `${p.check}:${p.term}`);

/** Bối cảnh giả lập tối thiểu, đủ cho mọi nhánh kiểm tra mà không cần đọc cây thật. */
function fakeContext(over: Partial<Context> = {}): Context {
  return {
    layers: { skills: "景别 景别", modelPrompt: "景别", srcPrompt: "", catalog: "模型名称", srcCode: "" },
    triple: { zh: "景别 全景", en: "Shot size 全景", vi: "Cỡ cảnh 全景" },
    glossary: {},
    catalogs: { zh: {}, en: {}, vi: {} },
    ...over,
  };
}
const baseRegistry = {
  policies: { "keep-zh-literal": "x", "translate-label": "x", "never-translate": "x", "translate-in-lockstep": "x" },
  boundaries: { "skills->prompts": "x", "catalog->prompts": "x" },
};
const term = (over: Record<string, unknown> = {}) => ({
  id: "t",
  kind: "field-name",
  zh: "景别",
  en: "Shot size",
  vi: "Cỡ cảnh",
  policy: "translate-label",
  boundary: "skills->prompts",
  counts: {},
  literalCounts: { zh: 1, en: 1, vi: 1 },
  note: "n",
  ...over,
});

describe("checkRegistry — cây thật", () => {
  it("bảng thuật ngữ đã commit khớp với cây hiện tại", () => {
    expect(checkRegistry(registry, loadContext(root))).toEqual([]);
  });

  it("mọi thuật ngữ ranh giới skills->prompts đều có bằng chứng ở cả hai lớp", () => {
    const cross = registry.terms.filter((t: { boundary: string }) => t.boundary === "skills->prompts");
    expect(cross.length).toBeGreaterThan(0);
    for (const t of cross) {
      expect(t.counts.skills, t.id).toBeGreaterThan(0);
      expect(t.counts.modelPrompt + t.counts.srcPrompt, t.id).toBeGreaterThan(0);
    }
  });

  it("công bố rõ những gì script không phát hiện được", () => {
    expect(LIMITS.length).toBeGreaterThanOrEqual(5);
  });
});

describe("checkRegistry — phát hiện sai lệch", () => {
  it("bắt lỗi khi dạng zh của một mục không còn xuất hiện ở đâu", () => {
    const reg = { ...baseRegistry, terms: [term({ zh: "不存在的词" })] };
    expect(ids(checkRegistry(reg, fakeContext()))).toContain("presence:t");
  });

  it("bắt lỗi khi một literal cần giữ nguyên bị dịch mất trong file en", () => {
    const reg = {
      ...baseRegistry,
      terms: [term({ zh: "全景", policy: "keep-zh-literal", en: "Wide shot", vi: "Toàn cảnh", literalCounts: { zh: 1, en: 1, vi: 1 } })],
    };
    const ctx = fakeContext({
      layers: { skills: "全景", modelPrompt: "全景", srcPrompt: "", catalog: "", srcCode: "" },
      triple: { zh: "全景", en: "wide shot", vi: "全景" },
    });
    expect(ids(checkRegistry(reg, ctx))).toContain("literal-preservation:t");
  });

  it("bắt lỗi khi file đã dịch dùng một dạng mà bảng thuật ngữ không liệt kê", () => {
    const reg = { ...baseRegistry, terms: [term()] };
    const ctx = fakeContext({ triple: { zh: "景别", en: "Shot scale", vi: "Cỡ cảnh" } });
    expect(ids(checkRegistry(reg, ctx))).toContain("label:t");
  });

  it("bắt lỗi khi mục never-translate lại có bản dịch", () => {
    const reg = { ...baseRegistry, terms: [term({ policy: "never-translate", zh: "景别", en: "Shot size" })] };
    expect(ids(checkRegistry(reg, fakeContext()))).toContain("shape:t");
  });

  it("bắt lỗi khi nhãn runtime và spec prompt lệch nhau", () => {
    const reg = {
      ...baseRegistry,
      terms: [
        term({
          zh: "模型名称",
          en: "Model name",
          vi: "Tên mô hình",
          policy: "translate-in-lockstep",
          boundary: "catalog->prompts",
          catalogKey: "k",
          literalCounts: { zh: 0, en: 0, vi: 0 },
        }),
      ],
    };
    const ctx = fakeContext({
      layers: { skills: "", modelPrompt: "模型名称", srcPrompt: "", catalog: "模型名称", srcCode: "" },
      triple: { zh: "模型名称", en: "Model name", vi: "Tên mô hình" },
      catalogs: { zh: { k: "模型名称：" }, en: { k: "**Modelname**: " }, vi: { k: "**Tên mô hình**: " } },
    });
    expect(ids(checkRegistry(reg, ctx))).toContain("lockstep:t");
  });

  it("bắt lỗi khi mâu thuẫn với glossary mà không khai báo glossaryDivergence", () => {
    const reg = { ...baseRegistry, terms: [term()] };
    const ctx = fakeContext({ glossary: { 景别: { en: "shot scale", vi: "cỡ cảnh" } } });
    expect(ids(checkRegistry(reg, ctx))).toContain("glossary:t");
  });

  it("chấp nhận mâu thuẫn glossary khi đã khai báo lý do", () => {
    const reg = { ...baseRegistry, terms: [term({ glossaryDivergence: "lý do" })] };
    const ctx = fakeContext({ glossary: { 景别: { en: "shot scale", vi: "cỡ cảnh" } } });
    expect(ids(checkRegistry(reg, ctx))).not.toContain("glossary:t");
  });

  it("bắt lỗi khi id bị trùng", () => {
    const reg = { ...baseRegistry, terms: [term(), term()] };
    expect(checkRegistry(reg, fakeContext()).filter((p) => p.detail === "duplicate id")).toHaveLength(1);
  });
});

describe("checkRegistry — mô phỏng lệch cố ý trên bản sao cây thật", () => {
  it("bắt được khi một giá trị được khớp bị dịch mất khỏi file en", () => {
    const ctx = loadContext(root);
    const broken = clone(ctx);
    broken.triple.en = broken.triple.en.split("中景").join("medium shot");
    const problems = checkRegistry(registry, broken);
    expect(ids(problems)).toContain("literal-preservation:shotSize.medium");
  });

  it("bắt được khi file vi đổi sang một cách gọi khác cho cùng thuật ngữ", () => {
    const broken = clone(loadContext(root));
    broken.triple.vi = broken.triple.vi.split("Cỡ cảnh").join("Khuôn hình");
    expect(ids(checkRegistry(registry, broken))).toContain("label:field.shotSize");
  });
});
