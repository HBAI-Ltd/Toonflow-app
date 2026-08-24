import { describe, it, expect, vi } from "vitest";

// productionAgent/tools.ts mixes person-facing "thinking" UI text (locale/content_language) with
// model-facing tool description/schema and execute() return values (promptLocale/prompt_language).
// get_flowData's "unchanged" branch is the ambiguous case flagged in the report: `label` is
// computed once for the thinking UI, but the value actually returned to the model needs its own
// prompt_language resolution — see the promptLabel split in tools.ts.

const { getParentAsset, setParentAsset } = vi.hoisted(() => {
  let current: any = { id: 1, type: "role" };
  return {
    getParentAsset: () => current,
    setParentAsset: (v: any) => {
      current = v;
    },
  };
});

vi.mock("@/utils", () => ({
  default: {
    db: () => ({ where: () => ({ select: () => ({ first: async () => getParentAsset() }) }) }),
    error: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
  },
}));

function makeThinking() {
  const calls: { appendText: string[]; updateTitle: string[] } = { appendText: [], updateTitle: [] };
  return {
    calls,
    thinking: {
      appendText: (s: string) => calls.appendText.push(s),
      updateTitle: (s: string) => calls.updateTitle.push(s),
      complete: () => {},
    },
  };
}

describe("productionAgent tools — description/schema/return values follow prompt_language, thinking UI follows content_language", () => {
  async function buildTools(locale: "en" | "vi", promptLocale: "en" | "vi", socket: any) {
    const { calls, thinking } = makeThinking();
    const msg = { thinking: () => thinking };
    const resTool = { socket, data: { projectId: 1, scriptId: 1 } } as any;
    const toolsFactory = (await import("./tools")).default;
    const tools = toolsFactory({ resTool, msg: msg as any, locale, promptLocale });
    return { tools, calls };
  }

  it("get_flowData description (model-facing) follows prompt_language=en regardless of content_language=vi", async () => {
    const socket = { emit: (_ev: string, _d: any, cb: (r: any) => void) => cb({ script: "s" }) };
    const { tools } = await buildTools("vi", "en", socket);
    expect((tools.get_flowData as any).description).toBe("Get workspace data");
  });

  it("get_flowData description follows prompt_language=vi even when content_language=en", async () => {
    const socket = { emit: (_ev: string, _d: any, cb: (r: any) => void) => cb({ script: "s" }) };
    const { tools } = await buildTools("en", "vi", socket);
    expect((tools.get_flowData as any).description).toBe("Lấy dữ liệu workspace");
  });

  it("get_flowData 'unchanged' tool result (ambiguous: also logged) follows prompt_language=en despite content_language=vi", async () => {
    const socket = { emit: (_ev: string, _d: any, cb: (r: any) => void) => cb({ script: "same" }) };
    const { tools } = await buildTools("vi", "en", socket);
    await (tools.get_flowData as any).execute({ key: "script" }); // primes workMap
    const result = await (tools.get_flowData as any).execute({ key: "script" }); // unchanged branch
    expect(result).toBe("Script content data unchanged, no update needed");
  });

  it("get_flowData 'unchanged' tool result follows prompt_language=vi even when content_language=en", async () => {
    const socket = { emit: (_ev: string, _d: any, cb: (r: any) => void) => cb({ script: "same" }) };
    const { tools } = await buildTools("en", "vi", socket);
    await (tools.get_flowData as any).execute({ key: "script" });
    const result = await (tools.get_flowData as any).execute({ key: "script" });
    expect(result).toBe("Dữ liệu Nội dung kịch bản không thay đổi, không cần cập nhật");
  });

  it("add_deriveAsset.assetNotFound (tool result) follows prompt_language=en, not content_language=vi", async () => {
    setParentAsset(undefined);
    const { tools } = await buildTools("vi", "en", {});
    const result = await (tools.add_deriveAsset as any).execute({ assetsId: 1, id: null, name: "x", desc: "y" });
    expect(result).toBe("The associated asset does not exist");
    setParentAsset({ id: 1, type: "role" });
  });

  it("add_deriveAsset.assetNotFound follows prompt_language=vi even when content_language=en", async () => {
    setParentAsset(undefined);
    const { tools } = await buildTools("en", "vi", {});
    const result = await (tools.add_deriveAsset as any).execute({ assetsId: 1, id: null, name: "x", desc: "y" });
    expect(result).toBe("Tài nguyên liên kết không tồn tại");
    setParentAsset({ id: 1, type: "role" });
  });
});
