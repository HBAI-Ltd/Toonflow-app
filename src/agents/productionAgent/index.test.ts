import fs from "fs";
import os from "os";
import path from "path";
import knexFactory, { type Knex } from "knex";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// runDecisionAI/createSubAgent build model-facing text (memory context, modelInfo block, tool
// description/schema, formatPrompt content, the art/production skills prompt) that must follow
// prompt_language, while `name` role labels (socket-message author + memory metadata, never read
// by the model) stay on content_language. See src/i18n/locale.ts and
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
    error: (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
    vendor: { getModelList: async () => [{ modelName: "fake-model" }] },
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
    data: { projectId: 1, scriptId: 1 },
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

describe("productionAgent/index.ts — model-facing text follows prompt_language, person-facing name labels follow content_language", () => {
  beforeEach(async () => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "productionagent-test-"));
    fs.mkdirSync(path.join(tmpRoot, "skills"), { recursive: true });
    fs.writeFileSync(path.join(tmpRoot, "skills", "production_agent_decision.md"), "SYSTEM_SKILL", "utf-8");
    fs.writeFileSync(path.join(tmpRoot, "skills", "production_execution_derive_assets.md"), "DERIVE_SKILL", "utf-8");

    db = knexFactory({ client: "better-sqlite3", connection: { filename: ":memory:" }, useNullAsDefault: true });
    await db.schema.createTable("o_setting", (t) => {
      t.text("key");
      t.text("value");
    });
    await db.schema.createTable("o_project", (t) => {
      t.integer("id");
      t.text("imageModel");
      t.text("videoModel");
      t.text("mode");
      t.text("artStyle");
      t.text("directorManual");
    });
    await db("o_project").insert({
      id: 1,
      imageModel: "vendorX:imgModel",
      videoModel: "vendorX:vidModel",
      mode: "",
      artStyle: "无",
      directorManual: "无",
    });

    capturedStream = undefined;
    createdMsgs.length = 0;
  });

  afterEach(async () => {
    await db.destroy();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  });

  it("assembled modelInfo content (model-facing) follows prompt_language=en, ignoring content_language=vi", async () => {
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
    expect(assistantContent).toContain("The project uses the following models");
    expect(assistantContent).not.toContain("Dự án đang sử dụng");
  });

  it("assembled modelInfo content follows prompt_language=vi even when content_language=en", async () => {
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
    expect(assistantContent).toContain("Dự án đang sử dụng các mô hình sau");
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
    expect(tools.run_sub_agent_derive_assets.description).toContain("Chạy sub-agent thực thi để phân tích tài nguyên phái sinh");
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
    await tools.run_sub_agent_derive_assets.execute({ prompt: "derive stuff" });
    expect(createdMsgs.some((m) => m.name === "Execution Director")).toBe(true);
    expect(createdMsgs.some((m) => m.name === "Đạo diễn thực thi")).toBe(false);
  });
});
