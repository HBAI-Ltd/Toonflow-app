import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

const goalRef = { id: z.uuid(), revision: z.number().int().positive() };
const objective = z.string().trim().min(1).max(8000);
const input = z.object({
  directory: z.string().min(1).max(4096),
  sessionFile: z.string().regex(/^[\w-]+\.jsonl$/),
  command: z.discriminatedUnion("action", [
    z.strictObject({ action: z.literal("plan"), enabled: z.boolean() }),
    z.strictObject({ action: z.literal("create"), objective }),
    z.strictObject({ action: z.literal("edit"), ...goalRef, objective }),
    z.strictObject({ action: z.enum(["pause", "resume", "clear"]), ...goalRef }),
  ]),
});

export default Router().post("/", validateFields(input.shape), async (req, res) => {
  const { directory, sessionFile, command } = input.parse(req.body);
  const cwd = await u.workspace.resolveWorkspace(req, directory);
  res.set("Cache-Control", "no-store").json(success(await u.agent.applyAgentCommand(cwd, sessionFile, command)));
});
