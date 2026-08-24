import { describe, it, expect, vi } from "vitest";

// scriptAgent/tools.ts mixes person-facing "thinking" UI text (locale/content_language) with
// model-facing tool description/schema and execute() return values (promptLocale/prompt_language).
// get_novel_events is also the ambiguous case flagged in the report: its eventString return value
// is echoed into the thinking panel too — we resolve it via prompt_language since it's the tool
// result the model actually reads on its next turn.

vi.mock("@/utils", () => ({
  default: {
    db: () => ({
      where: () => ({
        select: () => ({
          whereIn: async () => [{ index: 1, chapter: "Ch1", event: "something happened" }],
        }),
      }),
    }),
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

describe("scriptAgent tools — description/schema/return values follow prompt_language, thinking UI follows content_language", () => {
  async function buildTools(locale: "en" | "vi", promptLocale: "en" | "vi") {
    const { calls, thinking } = makeThinking();
    const msg = { thinking: () => thinking };
    const resTool = { socket: {}, data: { projectId: 1 } } as any;
    const toolsFactory = (await import("./tools")).default;
    const tools = toolsFactory({ resTool, msg: msg as any, locale, promptLocale });
    return { tools, calls };
  }

  it("get_novel_events description (model-facing) follows prompt_language=en regardless of content_language=vi", async () => {
    const { tools } = await buildTools("vi", "en");
    expect((tools.get_novel_events as any).description).toBe("Get chapter events");
  });

  it("get_novel_events description follows prompt_language=vi even when content_language=en", async () => {
    const { tools } = await buildTools("en", "vi");
    expect((tools.get_novel_events as any).description).toBe("Lấy sự kiện chương");
  });

  it("get_novel_events return value (model-facing, ambiguous with the thinking echo) follows prompt_language", async () => {
    const { tools, calls } = await buildTools("en", "vi");
    const result = await (tools.get_novel_events as any).execute({ chapterIndexs: [1] });
    expect(result).toContain("Chương 1, tiêu đề: Ch1, sự kiện: something happened");
    // the "thinking" wrapper templates themselves still follow content_language (en here)...
    expect(calls.appendText[1]).toBe("Query result:\nChương 1, tiêu đề: Ch1, sự kiện: something happened");
  });

  it("get_planData noData fallback (tool result, model-facing) follows prompt_language, not content_language", async () => {
    const socket = { emit: (_ev: string, _data: any, cb: (res: any) => void) => cb({}) };
    const { calls, thinking } = makeThinking();
    const msg = { thinking: () => thinking };
    const toolsFactory = (await import("./tools")).default;
    const tools = toolsFactory({ resTool: { socket, data: {} } as any, msg: msg as any, locale: "vi", promptLocale: "en" });
    const result = await (tools.get_planData as any).execute({ key: "script" });
    expect(result).toBe("No data");
  });

  it("get_planData noData fallback follows prompt_language=vi even when content_language=en", async () => {
    const socket = { emit: (_ev: string, _data: any, cb: (res: any) => void) => cb({}) };
    const { thinking } = makeThinking();
    const msg = { thinking: () => thinking };
    const toolsFactory = (await import("./tools")).default;
    const tools = toolsFactory({ resTool: { socket, data: {} } as any, msg: msg as any, locale: "en", promptLocale: "vi" });
    const result = await (tools.get_planData as any).execute({ key: "script" });
    expect(result).toBe("Không có dữ liệu");
  });
});
