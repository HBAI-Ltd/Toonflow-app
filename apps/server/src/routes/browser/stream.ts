import { Router } from "express";
import { z } from "zod";
import type { BrowserStreamEvent } from "@toonflow/tool-browser/protocol";
import { validateFields } from "@/lib/middleware";
import u from "@/utils";
import { getRuntimePlatform } from "@/lib/platform";

const inputSchema = z.object({ directory: z.string().min(1).max(4096).optional(), toolSessionId: z.uuid().optional(), sessionId: z.uuid() })
  .refine(input => !!input.directory !== !!input.toolSessionId, "请提供工作目录或临时对话身份，不能同时提供");

export default Router().get("/", validateFields(inputSchema.shape, "query"), async (req, res) => {
  u.mcpControl.assertAppRequest(req);
  if (!req.app.locals.desktop && !getRuntimePlatform().development) throw Object.assign(new Error("浏览器画面仅在桌面客户端中可用"), { status: 404 });
  const input = inputSchema.parse(req.query);
  if (!input.toolSessionId) u.singleAgent.assertWorkspaceBrowserAccess(input.sessionId);
  const cwd = input.toolSessionId
    ? u.singleAgent.getBrowserScope(input.toolSessionId, input.sessionId)
    : await u.workspace.resolveWorkspace(req, input.directory!);
  if (!u.browser.browserRuntime.getSession(cwd, input.sessionId)) throw Object.assign(new Error("浏览器会话不存在或已关闭"), { status: 404 });
  res.set({ "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store, no-transform", "X-Accel-Buffering": "no" });
  res.flushHeaders();
  let blocked = false;
  let disposed = false;
  let pendingState: BrowserStreamEvent | undefined;
  let pendingFrame: BrowserStreamEvent | undefined;
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  const close = () => {
    if (disposed) return;
    disposed = true;
    clearInterval(heartbeat);
    unsubscribe?.();
    pendingState = pendingFrame = undefined;
    res.off("drain", drain);
    res.off("close", close);
    req.off("aborted", close);
    req.socket.off("close", close);
  };
  const write = (event: BrowserStreamEvent) => {
    if (disposed || res.destroyed) return;
    if (blocked) {
      // ACT: 慢客户端只保留最新状态和一帧，避免浏览器画面无限积压。
      if (event.type === "frame") pendingFrame = event;
      else {
        pendingState = event;
        pendingFrame = undefined;
      }
      return;
    }
    blocked = !res.write(`${JSON.stringify(event)}\n`);
    if (event.type === "closed" || event.type === "error") {
      close();
      res.end();
    }
  };
  const drain = () => {
    blocked = false;
    const state = pendingState;
    const frame = pendingFrame;
    pendingState = pendingFrame = undefined;
    if (state) write(state);
    if (frame) write(frame);
  };
  res.on("drain", drain);
  // Bun 的客户端断连不一定触发 res.close，保留请求和 socket 的清理入口。
  res.once("close", close);
  req.once("aborted", close);
  req.socket.once("close", close);
  try {
    unsubscribe = await u.browser.browserRuntime.subscribe(cwd, input.sessionId, write);
    if (disposed) unsubscribe();
    else heartbeat = setInterval(() => {
      if (!blocked && !res.destroyed) blocked = !res.write("\n");
    }, 1000);
  } catch (error) {
    write({ type: "error", message: error instanceof Error ? error.message : "浏览器画面连接失败" });
    if (!res.writableEnded) res.end();
    close();
  }
});
