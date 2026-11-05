import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { resetPassword, passwordSchema, rotateAuthenticatedSession } from "@/utils/accounts/service";

export default Router().post("/", validateFields({
  id: z.string().uuid(), temporaryPassword: passwordSchema, currentPassword: z.string().min(1).max(128),
}), async (req, res) => {
  await resetPassword(req.body.id, req.body.temporaryPassword, req.body.currentPassword);
  res.json(success({ session: rotateAuthenticatedSession(req, res) }));
});
