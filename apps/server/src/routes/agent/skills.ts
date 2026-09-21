import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().get("/", validateFields({ directory: z.string().min(1).max(4096) }, "query"), async (req, res) => {
  const cwd = await u.workspace.resolveWorkspace(req, req.query.directory as string);
  const { skills } = u.agent.loadAgentSkills(cwd);
  res.set("Cache-Control", "no-store");
  res.json(success(skills.map(({ name, description }) => ({ name, description }))));
});
