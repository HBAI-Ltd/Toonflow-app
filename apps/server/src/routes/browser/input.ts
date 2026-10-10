import { Router } from "express";
import { z } from "zod";
import { browserInputSchema } from "@toonflow/tool-browser/protocol";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";
import { getRuntimePlatform } from "@/lib/platform";

const inputSchema = z.strictObject({
  directory: z.string().min(1).max(4096).optional(), toolSessionId: z.uuid().optional(),
  sessionId: z.uuid(), tabId: z.uuid(), input: browserInputSchema,
}).refine(input => !!input.directory !== !!input.toolSessionId, "请提供工作目录或临时对话身份，不能同时提供");

export default Router().post("/", validateFields(inputSchema.shape), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  if (!req.app.locals.desktop && !getRuntimePlatform().development) throw Object.assign(new Error("浏览器操作仅在桌面客户端中可用"), { status: 404 });
  const input = inputSchema.parse(req.body);
  if (!input.toolSessionId) u.singleAgent.assertWorkspaceBrowserAccess(input.sessionId);
  const cwd = input.toolSessionId
    ? u.singleAgent.getBrowserScope(input.toolSessionId, input.sessionId)
    : await u.workspace.resolveWorkspace(req, input.directory!);
  const controller = new AbortController();
  const close = () => controller.abort();
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    const state = await u.browser.browserRuntime.input(cwd, input.sessionId, input.tabId, input.input, controller.signal);
    if (!res.destroyed) res.json(success(state));
  } finally {
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  }
});
