import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().delete("/", validateFields({
  directory: z.string().min(1).max(4096),
  sessionFile: z.string().regex(/^[\w-]+\.jsonl$/),
  entryIds: z.array(z.string().min(1).max(128)).min(1).max(1000).optional(),
  replyTo: z.string().min(1).max(128).optional(),
}), async (req, res) => {
  const { directory, sessionFile, entryIds, replyTo } = req.body as {
    directory: string; sessionFile: string; entryIds?: string[]; replyTo?: string;
  };
  const { directory: cwd, path } = await u.workspaceFile.resolveWorkspaceFile(req, directory, `.agent/sessions/${sessionFile}`);
  res.set("Cache-Control", "no-store").json(success(await u.agent.deleteAgentMessage(cwd, path, { entryIds, replyTo })));
});
