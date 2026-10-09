import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const toolName = z.string().regex(/^[a-zA-Z0-9_-]{1,128}$/);
const inputSchema = z.strictObject({
  tools: z.array(z.union([
    toolName,
    z.strictObject({ plugin: toolName, names: z.array(toolName).min(1).refine(names => new Set(names).size === names.length, "工具名称不能重复").optional() }),
    z.strictObject({
      name: toolName, label: z.string().trim().min(1).max(200).optional(), description: z.string().trim().min(1).max(20000),
      parameters: z.record(z.string(), z.json()).refine(value => value.type === "object" && JSON.stringify(value).length <= 100000, "工具参数必须是 JSON 对象结构，且不超过 100 KB"),
      executionMode: z.enum(["sequential", "parallel"]).optional(),
    }),
  ])).max(128),
  directory: z.string().min(1).max(4096).optional(),
  systemPrompt: z.string().max(100000).optional(),
});

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  const input = inputSchema.parse(req.body);
  const directory = input.directory ? await u.workspace.resolveWorkspace(req, input.directory) : undefined;
  const controller = new AbortController();
  let sessionId: string | undefined;
  const abort = () => {
    if (res.writableFinished) return;
    controller.abort();
    if (sessionId) void u.singleAgent.close(sessionId).catch(error => console.error("清理临时对话失败：", error));
    cleanup();
  };
  const cleanup = () => {
    res.off("close", abort);
    req.off("aborted", abort);
    req.socket.off("close", abort);
    res.off("finish", cleanup);
  };
  res.once("close", abort);
  req.once("aborted", abort);
  req.socket.once("close", abort);
  res.once("finish", cleanup);
  try {
    const result = await u.singleAgent.create({ ...input, directory }, controller.signal);
    sessionId = result.sessionId;
    controller.signal.throwIfAborted();
    res.set("Cache-Control", "no-store").json(success(result));
  } catch (error) {
    cleanup();
    if (sessionId) await u.singleAgent.close(sessionId);
    throw error;
  }
});
