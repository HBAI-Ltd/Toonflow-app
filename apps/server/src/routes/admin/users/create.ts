import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { createUser, usernameSchema, passwordSchema, storageLimitSchema, rotateAuthenticatedSession } from "@/utils/accounts/service";

export default Router().post("/", validateFields({
  username: usernameSchema, temporaryPassword: passwordSchema, storageLimitBytes: storageLimitSchema.optional(),
  currentPassword: z.string().min(1).max(128),
}), async (req, res) => {
  const { username, temporaryPassword, storageLimitBytes, currentPassword } = req.body;
  const user = await createUser(username, temporaryPassword, storageLimitBytes ?? 1024 ** 3, currentPassword);
  res.json(success({ ...user, session: rotateAuthenticatedSession(req, res) }));
});
