import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string(),
    password: z.string(),
    id: z.number(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { name, password, id } = req.body;
    await u.db("o_user").where("id", id).update({
      name,
      password,
    });
    res.status(200).send(success(null, t("setting.loginConfig.updateUserPwd.saved", {}, locale)));
  },
);
