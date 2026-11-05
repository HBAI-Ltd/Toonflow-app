import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { updateUser, storageLimitSchema, rotateAuthenticatedSession } from "@/utils/accounts/service";

export default Router().put("/", validateFields({
  id: z.string().uuid(), enabled: z.boolean().optional(), storageLimitBytes: storageLimitSchema.optional(),
  currentPassword: z.string().min(1).max(128),
}), async (req, res) => {
  const { id, enabled, storageLimitBytes, currentPassword } = req.body;
  const user = await updateUser(id, { enabled, storageLimitBytes }, currentPassword);
  res.json(success({ ...user, session: rotateAuthenticatedSession(req, res) }));
});
