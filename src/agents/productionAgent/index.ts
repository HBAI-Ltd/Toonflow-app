import { Socket } from "socket.io";
import { z } from "zod";
import { tool, jsonSchema } from "ai";
import u from "@/utils";
import Memory from "@/utils/agent/memory";
import { createSkillTools, parseFrontmatter, scanSkills, useSkill } from "@/utils/agent/skillsTools";
import useTools from "@/agents/productionAgent/tools";
import ResTool from "@/socket/resTool";
import * as fs from "fs";
import path from "path";
import { t, getLocale, getPromptLanguage, type Locale } from "@/i18n";

export interface AgentContext {
  socket: Socket;
  isolationKey: string;
  text: string;
  userMessageTime?: number;
  abortSignal?: AbortSignal;
  resTool: ResTool;
  msg: ReturnType<ResTool["newMessage"]>;
  messages?: { role: "user" | "assistant" | "system"; content: string }[];
  thinkConfig: {
    think: boolean;
    thinlLevel: 0 | 1 | 2 | 3;
  };
}

// Model-facing: this text is concatenated straight into the message content sent to the model,
// so callers must pass prompt_language, not content_language.
async function buildMemPrompt(mem: Awaited<ReturnType<Memory["get"]>>, locale: Locale): Promise<string> {
  let memoryContext = "";
  if (mem.rag.length) {
    memoryContext += `${t("agent.production.orchestrator.memoryRelated", {}, locale)}\n${mem.rag.map((r) => r.content).join("\n")}`;
  }
  if (mem.summaries.length) {
    if (memoryContext) memoryContext += "\n\n";
    memoryContext += `${t("agent.production.orchestrator.memorySummary", {}, locale)}\n${mem.summaries.map((s, i) => `${i + 1}. ${s.content}`).join("\n")}`;
  }
  if (mem.shortTerm.length) {
    if (memoryContext) memoryContext += "\n\n";
    memoryContext += `${t("agent.production.orchestrator.memoryRecent", {}, locale)}\n${mem.shortTerm.map((m) => `${m.role}: ${m.content}`).join("\n")}`;
  }
  return t("agent.production.orchestrator.memoryHeader", { context: memoryContext }, locale);
}

export async function runDecisionAI(ctx: AgentContext) {
  const { isolationKey, text, abortSignal } = ctx;
  // locale (content_language) is for errors surfaced to whoever is watching this run.
  // promptLocale (prompt_language) is for everything below that is actually sent to the model:
  // modelInfo, the memory context, and the tool description/schema/result text useTools() and
  // memory.getTools() build. See src/i18n/locale.ts.
  const locale = await getLocale();
  const promptLocale = await getPromptLanguage();
  const memory = new Memory("productionAgent", isolationKey);
  await memory.add("user", text);

  const skill = path.join(u.getPath("skills"), "production_agent_decision.md");
  const prompt = await fs.promises.readFile(skill, "utf-8");

  const projectInfo = await u.db("o_project").where("id", ctx.resTool.data.projectId).first();
  if (!projectInfo) throw new Error(t("agent.production.orchestrator.projectNotFound", { id: ctx.resTool.data.projectId }, locale));
  const [_, imageModelName] = projectInfo.imageModel!.split(/:(.+)/);
  const [id, videoModelName] = projectInfo.videoModel!.split(/:(.+)/);
  const models = await u.vendor.getModelList(id);
  if (!models.length) throw new Error(t("agent.production.orchestrator.modelNotFound", { id: String(projectInfo.videoModel) }, locale));
  let videoMode = "";
  try {
    videoMode = JSON.parse(projectInfo.mode ?? "");
  } catch (e) {
    videoMode = projectInfo.mode ?? "";
  }
  const isRef = Array.isArray(videoMode) ? true : false;
  // const findData = models.find((i: any) => i.modelName == videoModelName);
  // const isRef = findData.mode.every((i: any) => Array.isArray(i));

  const modelInfo = t(
    "agent.production.orchestrator.modelInfo",
    {
      imageModel: imageModelName,
      videoModel: videoModelName,
      multiParam: isRef ? t("agent.production.orchestrator.yes", {}, promptLocale) : t("agent.production.orchestrator.no", {}, promptLocale),
    },
    promptLocale,
  );

  const mem = await buildMemPrompt(await memory.get(text), promptLocale);

  const { fullStream } = await u.Ai.Text("productionAgent:decisionAgent", ctx.thinkConfig.think, ctx.thinkConfig.thinlLevel).stream({
    messages: [
      { role: "system", content: prompt },
      { role: "assistant", content: mem + "\n" + modelInfo },
      { role: "user", content: text },
    ],
    abortSignal,
    tools: {
      ...memory.getTools(promptLocale),
      ...useTools({ resTool: ctx.resTool, msg: ctx.msg, locale, promptLocale }),
      ...(await createSubAgent(ctx)),
    },
    onFinish: async (completion) => {
      await memory.add("assistant:decision", removeAllXmlTags(completion.text));
    },
  });

  let currentMsg = ctx.msg;
  await consumeFullStream(fullStream, currentMsg, () => {
    if (ctx.msg === currentMsg) return currentMsg;
    currentMsg.complete();
    currentMsg = ctx.msg;
    return currentMsg;
  });
}

async function createSubAgent(parentCtx: AgentContext) {
  const { resTool, abortSignal } = parentCtx;
  // Same split as runDecisionAI: locale for thrown errors and `name` (UI/memory-metadata role
  // labels — never read by the model, see Memory.get()/buildMemPrompt), promptLocale for
  // everything sent to a model (tool descriptions/schemas, system/user prompt content).
  const locale = await getLocale();
  const promptLocale = await getPromptLanguage();
  const memory = new Memory("productionAgent", parentCtx.isolationKey);
  async function runAgent({
    key,
    prompt,
    system,
    name,
    memoryKey,
    tools: extraTools,
    messages,
  }: {
    key: `${string}:${string}`;
    prompt: string;
    system: string;
    name: string;
    memoryKey: string;
    tools?: Record<string, any>;
    messages?: { role: "user" | "assistant" | "system"; content: string }[];
  }) {
    parentCtx.msg.complete();
    const subMsg = resTool.newMessage("assistant", name);

    const { fullStream } = await u.Ai.Text(key, parentCtx.thinkConfig.think, parentCtx.thinkConfig.thinlLevel).stream({
      system,
      messages: messages ?? [{ role: "user", content: prompt }],
      abortSignal,
      tools: { ...extraTools, ...useTools({ resTool, msg: subMsg, locale, promptLocale }) },
    });

    const fullResponse = await consumeFullStream(fullStream, subMsg);

    if (fullResponse.trim()) {
      await memory.add(memoryKey, removeAllXmlTags(fullResponse), {
        name,
        createTime: new Date(subMsg.datetime).getTime(),
      });
    }

    parentCtx.msg = resTool.newMessage("assistant", t("agent.production.orchestrator.roleVideoPlanning", {}, locale));
    return fullResponse;
  }

  const promptInput = z
    .object({
      prompt: z.string().describe(t("agent.production.subAgent.promptDescribe", {}, promptLocale)),
    })
    .toJSONSchema();

  const projectInfo = await u.db("o_project").where("id", resTool.data.projectId).first();
  if (!projectInfo) throw new Error(t("agent.production.orchestrator.projectNotFound", { id: resTool.data.projectId }, locale));
  const artSkills = await createArtSkills(projectInfo?.artStyle!, projectInfo?.directorManual!, locale, promptLocale);

  const [_, imageModelName] = projectInfo.imageModel!.split(/:(.+)/);
  const [id, videoModelName] = projectInfo.videoModel!.split(/:(.+)/);
  const models = await u.vendor.getModelList(id);
  if (!models.length) throw new Error(t("agent.production.orchestrator.modelNotFound", { id: String(projectInfo.videoModel) }, locale));
  // const findData = models.find((i: any) => i.modelName == videoModelName);
  //
  let videoMode = "";
  try {
    videoMode = JSON.parse(projectInfo.mode ?? "");
  } catch (e) {
    videoMode = projectInfo.mode ?? "";
  }
  const isRef = Array.isArray(videoMode) ? true : false;

  const modelInfo = t(
    "agent.production.orchestrator.modelInfo",
    {
      imageModel: imageModelName,
      videoModel: videoModelName,
      multiParam: isRef ? t("agent.production.orchestrator.yes", {}, promptLocale) : t("agent.production.orchestrator.no", {}, promptLocale),
    },
    promptLocale,
  );

  // const run_sub_agent_execution = tool({
  //   description: "执行层子Agent，负责衍生资产、",
  //   inputSchema: promptInput,
  //   execute: async ({ prompt }) => {
  //     const skill = path.join(u.getPath("skills"), "production_agent_execution.md");
  //     const systemPrompt = await fs.promises.readFile(skill, "utf-8");
  //     const addPrompt =
  //       "\n" +
  //       [
  //         "你必须使用如下XML格式写入工作区：\n```",
  //         "拍摄计划：<scriptPlan>内容</scriptPlan>",
  //         "分镜表：<storyboardTable>内容</storyboardTable>",
  //         "分镜面板：<storyboardItem videoDesc='视频描述' prompt=提示词内容 track='分组' duration='视频推荐时间' associateAssetsIds='[该分镜所需的资产ID列表]'></storyboardItem>",
  //         "```",
  //       ].join("\n");

  //     return runAgent({
  //       prompt,
  //       system: systemPrompt + addPrompt,
  //       name: "执行导演",
  //       memoryKey: "assistant:execution",
  //       messages: [
  //         { role: "assistant", content: artSkills.prompt + `\n${modelInfo}` },
  //         { role: "user", content: prompt + addPrompt },
  //       ],
  //       tools: { ...artSkills.tools },
  //     });
  //   },
  // });

  //衍生资产分析与信息写入
  const run_sub_agent_derive_assets = tool({
    description: t("agent.production.subAgent.deriveAssetsDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_derive_assets.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");
      return runAgent({
        key: "productionAgent:deriveAssetsAgent",
        prompt,
        system: systemPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: artSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt },
        ],
        tools: { activate_skill: artSkills.tools.activate_skill },
      });
    },
  });

  //衍生资产图片生成
  const run_sub_agent_generate_assets = tool({
    description: t("agent.production.subAgent.generateAssetsDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_generate_assets.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");
      return runAgent({
        key: "productionAgent:generateAssetsAgent",
        prompt,
        system: systemPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: artSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt },
        ],
        tools: { activate_skill: artSkills.tools.activate_skill },
      });
    },
  });

  //拍摄计划
  const run_sub_agent_director_plan = tool({
    description: t("agent.production.subAgent.directorPlanDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_director_plan.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");

      const addPrompt = t("agent.production.subAgent.formatDirectorPlan", {}, promptLocale);

      return runAgent({
        key: "productionAgent:directorPlanAgent",
        prompt,
        system: systemPrompt + addPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: artSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt + addPrompt },
        ],
        tools: { activate_skill: artSkills.tools.activate_skill },
      });
    },
  });

  //分镜图生成
  const run_sub_agent_storyboard_gen = tool({
    description: t("agent.production.subAgent.storyboardGenDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_storyboard_gen.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");
      return runAgent({
        key: "productionAgent:storyboardGenAgent",
        prompt,
        system: systemPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: artSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt },
        ],
        tools: { activate_skill: artSkills.tools.activate_skill },
      });
    },
  });

  // const mainSkills: { path: string; name: string; description: string }[] = [];
  // for (const skill of mainSkill) {
  //   const skillPath = path.join(rootDir, skill + ".md");
  //   if (!fs.existsSync(skillPath)) throw new Error(`主技能文件不存在: ${skillPath}`);
  //   if (!isPathInside(skillPath, normalizedRootDir)) throw new Error(`技能名称无效：检测到路径穿越。${skillPath}`);
  //   const content = await fs.promises.readFile(skillPath, "utf-8");
  //   const parsed = parseFrontmatter(content);
  //   mainSkills.push({ path: skillPath, ...parsed });
  // }

  const productionSkills = await useProductionSkills(projectInfo?.artStyle!, projectInfo?.directorManual!, locale, promptLocale);

  //分镜面板写入
  const run_sub_agent_storyboard_panel = tool({
    description: t("agent.production.subAgent.storyboardPanelDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_storyboard_panel.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");

      const addPrompt = t("agent.production.subAgent.formatStoryboardPanel", {}, promptLocale);

      return runAgent({
        key: "productionAgent:storyboardPanelAgent",
        prompt,
        system: systemPrompt + addPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: productionSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt + addPrompt },
        ],
        tools: { activate_skill: productionSkills.tools.activate_skill },
      });
    },
  });

  //分镜表写入
  const run_sub_agent_storyboard_table = tool({
    description: t("agent.production.subAgent.storyboardTableDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_execution_storyboard_table.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");

      const addPrompt = t("agent.production.subAgent.formatStoryboardTable", {}, promptLocale);

      return runAgent({
        key: "productionAgent:storyboardTableAgent",
        prompt,
        system: systemPrompt + addPrompt,
        name: t("agent.production.orchestrator.roleExecutionDirector", {}, locale),
        memoryKey: "assistant:execution",
        messages: [
          { role: "assistant", content: productionSkills.prompt + `\n${modelInfo}` },
          { role: "user", content: prompt + addPrompt },
        ],
        tools: { activate_skill: productionSkills.tools.activate_skill },
      });
    },
  });

  const run_sub_agent_supervision = tool({
    description: t("agent.production.subAgent.supervisionDescribe", {}, promptLocale),
    inputSchema: jsonSchema<{ prompt: string }>(promptInput),
    execute: async ({ prompt }) => {
      const skill = path.join(u.getPath("skills"), "production_agent_supervision.md");
      const systemPrompt = await fs.promises.readFile(skill, "utf-8");
      return runAgent({
        key: "productionAgent:supervisionAgent",
        prompt,
        system: systemPrompt,
        name: t("agent.production.orchestrator.roleSupervisor", {}, locale),
        memoryKey: "assistant:supervision",
      });
    },
  });

  return {
    run_sub_agent_derive_assets,
    run_sub_agent_generate_assets,
    run_sub_agent_director_plan,
    run_sub_agent_storyboard_gen,
    run_sub_agent_storyboard_panel,
    run_sub_agent_storyboard_table,
    run_sub_agent_supervision,
  };
}

// locale (content_language): the thrown mainSkillMissing error, surfaced to whoever is watching
// the run. promptLocale (prompt_language): the returned `prompt`/`tools`, which the model reads —
// see buildSkillPrompt/createSkillTools's own doc comments in skillsTools.ts.
async function createArtSkills(artName: string, storyName: string, locale: Locale, promptLocale: Locale) {
  const artWorkerPath = u.getPath(["skills", "art_skills", artName, "driector_skills"]);
  const storyWorkerPath = u.getPath(["skills", "story_skills", storyName, "driector_skills"]);
  const skillList = [...(await scanSkills(artWorkerPath + "/*.md")), ...(await scanSkills(storyWorkerPath + "/*.md"))];
  const mainSkills: { path: string; name: string; description: string }[] = [];
  for (const skillPath of skillList) {
    if (!fs.existsSync(skillPath)) throw new Error(t("agent.production.orchestrator.mainSkillMissing", { path: skillPath }, locale));
    const content = await fs.promises.readFile(skillPath, "utf-8");
    const parsed = parseFrontmatter(content, locale);
    mainSkills.push({ path: skillPath, ...parsed });
  }
  const res = {
    prompt: t("agent.production.skills.header", { skillList: buildSkillPrompt(mainSkills) }, promptLocale),
    tools: createSkillTools(mainSkills, { mainSkill: mainSkills, secondarySkills: [], tertiarySkills: [] }, undefined, promptLocale),
  };
  return res;
}
async function consumeFullStream(
  fullStream: AsyncIterable<any>,
  initialMsg: ReturnType<ResTool["newMessage"]>,
  syncMsg?: () => ReturnType<ResTool["newMessage"]>,
): Promise<string> {
  const locale = await getLocale();
  let msg = initialMsg;
  let text = msg.text();
  let thinking: ReturnType<typeof msg.thinking> | null = null;
  let thinkTime = 0;
  let fullResponse = "";

  try {
    for await (const chunk of fullStream) {
      if (syncMsg) {
        const newMsg = syncMsg();
        if (newMsg !== msg) {
          msg = newMsg;
          text = msg.text();
        }
      }
      if (chunk.type === "reasoning-start") {
        thinkTime = Date.now();
        thinking = msg.thinking(t("agent.production.orchestrator.thinking", {}, locale));
      } else if (chunk.type === "reasoning-delta") {
        thinking?.append(chunk.text);
      } else if (chunk.type === "reasoning-end") {
        thinkTime = Date.now() - thinkTime;
        thinking?.updateTitle(t("agent.production.orchestrator.thinkingDone", { seconds: (thinkTime / 1000).toFixed(1) }, locale));
        thinking?.complete();
        thinking = null;
      } else if (chunk.type === "text-delta") {
        text.append(chunk.text);
        fullResponse += chunk.text;
      } else if (chunk.type === "error") {
        throw chunk.error;
      } else if (chunk.type == "finish") {
        break;
      }
    }
    text.complete();
    msg.complete();
  } catch (err: any) {
    thinking?.complete();
    const errMsg = err?.message ?? String(err);
    text.append(errMsg);
    text.error();
    msg.error();
    throw err;
  }

  return fullResponse;
}
function removeAllXmlTags(text: string): string {
  text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?>([\s\S]*?)<\/\1>/g, "");
  text = text.replace(/<([a-zA-Z][\w-]*)(\s+[^>]*)?\/>/g, "");
  text = text.replace(/<\/?[a-zA-Z][\w-]*(\s+[^>]*)?>/g, "");
  return text.trim();
}

export function buildSkillPrompt(skills: { name: string; description: string }[]): string {
  const skillEntries = skills
    .map((s) => `  <skill>\n    <name>${s.name}</name>\n    <description>${s.description}</description>\n  </skill>`)
    .join("\n");
  return `
<available_skills>
${skillEntries}
</available_skills>`;
}

// Same locale/promptLocale split as createArtSkills above.
async function useProductionSkills(artName: string, storyName: string, locale: Locale, promptLocale: Locale) {
  const artWorkerPath = u.getPath(["skills", "art_skills", artName, "driector_skills"]);
  const storyWorkerPath = u.getPath(["skills", "story_skills", storyName, "driector_skills"]);
  const productionPath = u.getPath(["skills", "production_skills"]);
  const skillList = [
    ...(await scanSkills(artWorkerPath + "/*.md")),
    ...(await scanSkills(storyWorkerPath + "/*.md")),
    ...(await scanSkills(productionPath + "/*.md")),
  ];
  const mainSkills: { path: string; name: string; description: string }[] = [];
  for (const skillPath of skillList) {
    if (!fs.existsSync(skillPath)) throw new Error(t("agent.production.orchestrator.mainSkillMissing", { path: skillPath }, locale));
    const content = await fs.promises.readFile(skillPath, "utf-8");
    const parsed = parseFrontmatter(content, locale);
    mainSkills.push({ path: skillPath, ...parsed });
  }
  const res = {
    prompt: t("agent.production.skills.header", { skillList: buildSkillPrompt(mainSkills) }, promptLocale),
    tools: createSkillTools(mainSkills, { mainSkill: mainSkills, secondarySkills: [], tertiarySkills: [] }, undefined, promptLocale),
  };
  return res;
}
