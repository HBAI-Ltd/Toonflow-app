import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().put("/", validateFields({ directory: z.string().min(1).max(4096), shots: z.array(z.unknown()).max(10000) }), async (req, res) => {
  const directory = await u.workspace.resolveWorkspace(req, req.body.directory);
  const shots = req.body.shots.map((value: unknown) => u.production.validateShot(value)).sort((left: { order: number }, right: { order: number }) => left.order - right.order);
  if (new Set(shots.map((shot: { id: string }) => shot.id)).size !== shots.length) throw Object.assign(new Error("镜头 id 不能重复"), { status: 400 });
  res.json(success(await u.production.writeProductionManifest(directory, { version: 1, updatedAt: new Date().toISOString(), shots })));
});
