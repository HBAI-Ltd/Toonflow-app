import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { changePassword, passwordSchema, writeSession } from "@/utils/accounts/service";

export default Router().post("/", validateFields({ currentPassword: z.string().min(1).max(128), newPassword: passwordSchema }), async (req, res) => {
  res.json(success(writeSession(res, await changePassword(req.body.currentPassword, req.body.newPassword))));
});
