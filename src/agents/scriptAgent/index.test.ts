import fs from "fs";
import os from "os";
import path from "path";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// runDecisionAI/createSubAgent build model-facing text (memory context, projectInfo block, tool
// description/schema, formatPrompt/scriptPrompt content) that must follow prompt_language, while
// `name` role labels (socket-message author + memory metadata, never read by the model) stay on
// content_language. See src/i18n/locale.ts and
// .superpowers/followups/prompt-language-remaining-sites-report.md.

let tmpRoot: string;
let db: Knex;
let capturedStream: { messages: any; tools: any } | undefined;
const createdMsgs: { role: string; name?: string }[] = [];

vi.mock("@/utils", () => ({
  default: {
    db: (...args: unknown[]) => db(...(args as [string])),
    getPath: (parts: string[] | string) => {
      const arr = Array.isArray(parts) ? parts : [parts];
      return path.join(tmpRoot, ...arr);
    },
    Ai: {
      Text: () => ({
        stream: async ({ messages, tools }: { messages: any; tools: any }) => {
          capturedStream = { messages, tools };
          return { fullStream: (async function* () {})() };
        },
      }),
    },
  },
}));

vi.mock("@/utils/agent/memory", () => {
  class FakeMemory {
    constructor(_agentType: string, _isolationKey: string) {}
    async add() {}
    async get() {
      return { shortTerm: [], summaries: [], rag: [] };
    }
    getTools() {
      return {};
    }
  }
  return { default: FakeMemory };
});

function makeMsg(name?: string) {
  const textObj = { append: () => {}, complete: () => {}, error: () => {} };
  return {
    datetime: new Date().toISOString(),
    text: () => textObj,
    thinking: () => ({ append: () => {}, appendText: () => {}, updateTitle: () => {}, complete: () => {} }),
    complete: () => {},
    error: () => {},
  };
}

function makeResTool() {
  return {
    data: { projectId: 1 },
    newMessage: (role: "assistant" | "user" | "system", name?: string) => {
      createdMsgs.push({ role, name });
      return makeMsg(name);
    },
  } as any;
}

async function setSetting(key: string, value: string | null) {
  await db("o_setting").where("key", key).del();
  if (value !== null) await db("o_setting").insert({ key, value });
}

describe("scriptAgent/index.ts — model-facing text follows prompt_language, person-facing name labels follow content_language", () => {
  beforeEach(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "scriptagent-test-"));
    fs.mkdirSync(path.join(tmpRoot, "skills"), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, "skills", "script_agent_decision.md"), "SYSTEM_SKILL", "utf-8");
    fs.writeFileSync(path.join(tmpRoot, "skills", "script_execution_skeleton.md"), "SKELETON_SKILL", "utf-8");

    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("o_project", (t) => {
      t.integer("id");
      t.text("name");
      t.text("type");
      t.text("intro");
      t.text("artStyle");
      t.text("videoRatio");
    });
    await db.schema.createTable("o_novel", (t) => {
      t.integer("projectId");
      t.integer("chapterIndex");
    });
    await db.schema.createTable("o_script", (t) => {
      t.integer("id");
      t.text("name");
      t.integer("projectId");
    });
    await db("o_project").insert({ id: 1, name: "My Novel", type: "fantasy", videoRatio: "16:9" });

    capturedStream = undefined;
    createdMsgs.length = 0;
  });

  afterEach(async () => {
    await db.destroy();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("assembled projectInfo/memory content (model-facing) follows prompt_language=en, ignoring content_language=vi", async () => {
    await setSetting("content_language", "vi");
    await setSetting("prompt_language", "en");
    const { runDecisionAI } = await import("./index");
    const resTool = makeResTool();
    await runDecisionAI({
      socket: {} as any,
      isolationKey: "iso-1",
      text: "hello",
      resTool,
      msg: makeMsg() as any,
      thinkConfig: { think: false, thinlLevel: 0 },
    });
    const assistantContent = capturedStream!.messages.find((m: any) => m.role === "assistant").content as string;
    expect(assistantContent).toContain("## Project info");
    expect(assistantContent).toContain("Novel title: My Novel");
    expect(assistantContent).not.toContain("Thông tin dự án");
  });

  it("assembled projectInfo content follows prompt_language=vi even when content_language=en", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    const { runDecisionAI } = await import("./index");
    const resTool = makeResTool();
    await runDecisionAI({
      socket: {} as any,
      isolationKey: "iso-2",
      text: "hello",
      resTool,
      msg: makeMsg() as any,
      thinkConfig: { think: false, thinlLevel: 0 },
    });
    const assistantContent = capturedStream!.messages.find((m: any) => m.role === "assistant").content as string;
    expect(assistantContent).toContain("Tên tiểu thuyết: My Novel");
  });

  it("sub-agent tool description (model-facing) follows prompt_language=vi even when content_language=en", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    const { runDecisionAI } = await import("./index");
    const resTool = makeResTool();
    await runDecisionAI({
      socket: {} as any,
      isolationKey: "iso-3",
      text: "hello",
      resTool,
      msg: makeMsg() as any,
      thinkConfig: { think: false, thinlLevel: 0 },
    });
    const tools = capturedStream!.tools;
    expect(tools.run_sub_agent_storySkeleton.description).toContain("Chạy sub-agent thực thi");
  });

  // F2 — thân skill (system prompt) gửi cho model phải theo prompt_language, không phải luôn
  // đọc thẳng bản gốc .md (zh). script_agent_decision.md không có sidecar trong beforeEach,
  // nên thêm sidecar .en.md/.vi.md riêng cho nhóm test này để phân biệt.
  describe("F2 — skill system prompt (model-facing) follows prompt_language", () => {
    beforeEach(() => {
      fs.writeFileSync(path.join(tmpRoot, "skills", "script_agent_decision.en.md"), "EN_SYSTEM_SKILL", "utf-8");
      fs.writeFileSync(path.join(tmpRoot, "skills", "script_agent_decision.vi.md"), "VI_SYSTEM_SKILL", "utf-8");
    });

    it("prompt_language=en -> system prompt đến từ script_agent_decision.en.md, không phải bản gốc zh", async () => {
      await setSetting("content_language", "vi");
      await setSetting("prompt_language", "en");
      const { runDecisionAI } = await import("./index");
      const resTool = makeResTool();
      await runDecisionAI({
        socket: {} as any,
        isolationKey: "iso-f2-1",
        text: "hello",
        resTool,
        msg: makeMsg() as any,
        thinkConfig: { think: false, thinlLevel: 0 },
      });
      const systemContent = capturedStream!.messages.find((m: any) => m.role === "system").content as string;
      expect(systemContent).toBe("EN_SYSTEM_SKILL");
    });

    it("prompt_language=vi -> system prompt đến từ script_agent_decision.vi.md, kể cả khi content_language=en", async () => {
      await setSetting("content_language", "en");
      await setSetting("prompt_language", "vi");
      const { runDecisionAI } = await import("./index");
      const resTool = makeResTool();
      await runDecisionAI({
        socket: {} as any,
        isolationKey: "iso-f2-2",
        text: "hello",
        resTool,
        msg: makeMsg() as any,
        thinkConfig: { think: false, thinlLevel: 0 },
      });
      const systemContent = capturedStream!.messages.find((m: any) => m.role === "system").content as string;
      expect(systemContent).toBe("VI_SYSTEM_SKILL");
    });

    it("prompt_language không có sidecar (zh) -> lùi về bản gốc script_agent_decision.md", async () => {
      await setSetting("content_language", "en");
      await setSetting("prompt_language", "zh");
      const { runDecisionAI } = await import("./index");
      const resTool = makeResTool();
      await runDecisionAI({
        socket: {} as any,
        isolationKey: "iso-f2-3",
        text: "hello",
        resTool,
        msg: makeMsg() as any,
        thinkConfig: { think: false, thinlLevel: 0 },
      });
      const systemContent = capturedStream!.messages.find((m: any) => m.role === "system").content as string;
      expect(systemContent).toBe("SYSTEM_SKILL");
    });
  });

  it("sub-agent 'name' role label (person-facing, socket message author) follows content_language=en, ignoring prompt_language=vi", async () => {
    await setSetting("content_language", "en");
    await setSetting("prompt_language", "vi");
    const { runDecisionAI } = await import("./index");
    const resTool = makeResTool();
    await runDecisionAI({
      socket: {} as any,
      isolationKey: "iso-4",
      text: "hello",
      resTool,
      msg: makeMsg() as any,
      thinkConfig: { think: false, thinlLevel: 0 },
    });
    const tools = capturedStream!.tools;
    await tools.run_sub_agent_storySkeleton.execute({ prompt: "write a story" });
    expect(createdMsgs.some((m) => m.name === "Screenwriter")).toBe(true);
    expect(createdMsgs.some((m) => m.name === "Biên kịch")).toBe(false);
  });
});
