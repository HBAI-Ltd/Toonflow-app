import { Router } from "express";
import { Artifact, createTeamAgentCard, createTeamA2aRouter, type TeamA2aRequest } from "@toonflow/teams-scaffold/a2a";
import { teamNameSchema } from "@toonflow/teams-scaffold/runtime";
import type { CanvasContext } from "@toonflow/tools-scaffold/runtime";
import { createAgentModel } from "@/agent/runtime/model";
import { createAgentTools } from "@/agent/tools";
import { createTeamRunner } from "@/agent/teams";
import { readTeam } from "@/utils/teams";
import { callControl, getConnection } from "@/utils/mcp/control";
import { authenticateA2a, getA2aSettings, getA2aSignal, getA2aUrl, resolveA2aWorkspace } from "./settings";

export function createA2aRouter() {
  const router = Router();
  const endpoints = new Map<string, { router: Router; card: ReturnType<typeof createTeamAgentCard>; signal: AbortSignal }>();
  router.use("/:name", async (req, res, next) => {
    try {
      if (!getA2aSettings().enabled) { res.sendStatus(404); return; }
      const name = teamNameSchema.parse(req.params.name);
      const configurationSignal = getA2aSignal();
      let endpoint = endpoints.get(name);
      // 已接收任务的查询和取消继续交给 SDK；禁用/卸载只阻止 execute 接收新消息。
      if (endpoint?.signal === configurationSignal && req.method === "POST") { endpoint.router(req, res, next); return; }
      const team = await readTeam(name);
      if (!team.enabled) { res.sendStatus(404); return; }
      const card = createTeamAgentCard(team.manifest, `${getA2aUrl(req)}/${name}`);
      if (!endpoint || endpoint.signal !== configurationSignal) {
        // ACT: 任务由 SDK 保存在单进程内存；仅等待补充的协调者额外保留 Pi 上下文，重启后需重新发起任务。
        const pending = new Map<string, { runner: Awaited<ReturnType<typeof createTeamRunner>>; userId: string }>();
        const execute = async (request: TeamA2aRequest) => {
          try {
            const signal = AbortSignal.any([request.signal, configurationSignal]);
            signal.throwIfAborted();
            if (!(await readTeam(name)).enabled) throw new Error("团队已禁用，不能接收新消息");
            if (request.message.parts.some(part => part.content?.$case !== "text")) throw new Error("此团队入口只接受文本，不下载远端附件；请在文本中提供已授权工作区的相对路径");
            const task = request.message.parts.map(part => part.content?.$case === "text" ? part.content.value : "").join("\n").trim();
            if (!task || task.length > 24000) throw new Error("团队任务文本应为 1 到 24000 字符");
            let current = pending.get(request.taskId);
            if (current && current.userId !== request.userId) throw new Error("任务不属于当前调用方");
            if (request.task && !current) throw new Error("任务上下文已释放，请创建新任务");
            if (!current) {
              const settings = getA2aSettings();
              const cwd = await resolveA2aWorkspace();
              // 保存时已规范化目录；不允许运行前把该目录替换成指向其他位置的链接。
              if (cwd !== settings.directory) throw new Error("A2A 工作目录已变化，请在设置中重新授权");
              const { runtime } = await createAgentModel(settings.providerId, settings.modelId, settings.thinkingLevel);
              const connection = getConnection(undefined, cwd);
              const canvas: CanvasContext | undefined = connection ? {
                id: connection.state.canvasId ?? "a2a", tools: connection.state.tools,
                call: (call, callSignal) => callControl(connection.id, call.name, call.args, callSignal ?? signal, cwd),
              } : undefined;
              const tools = await createAgentTools(cwd, canvas);
              current = { userId: request.userId, runner: await createTeamRunner({
                name, cwd, tools, canvas, modelRuntime: runtime,
                model: runtime.getModel(settings.providerId, settings.modelId), thinkingLevel: settings.thinkingLevel,
              }) };
              pending.set(request.taskId, current);
            }
            const { result } = await current.runner.run(task, signal, text => request.emit({ type: "status", text }), true);
            signal.throwIfAborted();
            if (result.status === "inputRequired") return { status: "inputRequired" as const, text: result.result };
            pending.delete(request.taskId);
            if (result.status !== "completed") throw new Error(result.result || "团队未完成任务");
            return { status: "completed" as const, text: result.result, artifacts: [Artifact.fromJSON({
              artifactId: request.taskId, name: "团队结果", parts: [{ text: result.result, mediaType: "text/plain" }],
            })] };
          } catch (error) { pending.delete(request.taskId); throw error; }
        };
        endpoint = { card, signal: configurationSignal, router: createTeamA2aRouter({
          card, authenticate: authenticateA2a, execute,
          onCancel: taskId => { pending.delete(taskId); },
        }) };
        endpoints.set(name, endpoint);
        configurationSignal.addEventListener("abort", () => { pending.clear(); endpoints.delete(name); }, { once: true });
      } else Object.assign(endpoint.card, card);
      endpoint.router(req, res, next);
    } catch (error) { next(error); }
  });
  return router;
}
