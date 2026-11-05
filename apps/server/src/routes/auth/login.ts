import { Router } from "express";
import { z } from "zod";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";
import { login, usernameSchema, writeSession } from "@/utils/accounts/service";

export default Router().post("/", validateFields({ username: usernameSchema, password: z.string().min(1).max(128) }), async (req, res) => {
  res.json(success(writeSession(res, await login(req.body.username, req.body.password))));
});
