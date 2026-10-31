import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().post("/", validateFields({
  directory: z.string().min(1).max(4096),
  sessionFile: z.string().regex(/^[\w-]+\.jsonl$/),
  entryId: z.string().min(1).max(128).optional(),
  replyTo: z.string().min(1).max(128).optional(),
}), async (req, res) => {
  const { directory, sessionFile, entryId, replyTo } = req.body as {
    directory: string; sessionFile: string; entryId?: string; replyTo?: string;
  };
  const { directory: cwd, path } = await u.workspaceFile.resolveWorkspaceFile(req, directory, `.agent/sessions/${sessionFile}`);
  res.set("Cache-Control", "no-store").json(success(await u.agent.branchAgentConversation(cwd, path, { entryId, replyTo })));
});
