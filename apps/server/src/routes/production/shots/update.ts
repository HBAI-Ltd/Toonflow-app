import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().patch("/", validateFields({ directory: z.string().min(1).max(4096), shot: z.unknown() }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const shot = u.production.validateShot(req.body.shot);
  const manifest = await u.production.readProductionManifest(directory);
  const index = manifest.shots.findIndex(item => item.id === shot.id);
  if (index < 0) { res.status(404).json({ code: 404, data: null, message: "镜头不存在" }); return; }
  manifest.shots[index] = shot;
  manifest.shots.sort((left, right) => left.order - right.order);
  res.json(success(await u.production.writeProductionManifest(directory, manifest)));
});
