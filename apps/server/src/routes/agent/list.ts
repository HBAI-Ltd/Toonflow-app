import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().get("/", validateFields({ directory: z.string().min(1).max(4096) }, "query"), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.query.directory as string);
  res.set("Cache-Control", "no-store");
  try {
    const { path } = await u.workspaceFile.resolveWorkspacePath(cwd, ".agent/sessions");
    res.json(success(await u.agent.listAgentSessions(cwd, path)));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    res.json(success([]));
  }
});
