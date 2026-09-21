import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().patch("/", validateFields({
  directory: z.string().min(1).max(4096),
  sessionFile: z.string().regex(/^[\w-]+\.jsonl$/),
  name: z.string().trim().min(1).max(80),
}), async (req, res) => {
  const { directory, sessionFile, name } = req.body as { directory: string; sessionFile: string; name: string };
  const { directory: cwd, path } = await u.workspaceFile.resolveWorkspaceFile(req, directory, `.agent/sessions/${sessionFile}`);
  res.json(success(await u.agent.renameAgentSession(cwd, path, name.trim())));
});
