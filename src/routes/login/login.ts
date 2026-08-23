import express from "express";
import u from "@/utils";
import jwt from "jsonwebtoken";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
import { t, getLocale, Locale } from "@/i18n";
const router = express.Router();

export function setToken(payload: string | object, expiresIn: string | number, secret: string, locale?: Locale): string {
  if (!payload || typeof secret !== "string" || !secret) {
    throw new Error(t("login.setToken.invalidParams", {}, locale));
  }
  return (jwt.sign as any)(payload, secret, { expiresIn });
}

// 登录
export default router.post(
  "/",
  validateFields({
    username: z.string(),
    password: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { username, password } = req.body;

    const data = await u.db("o_user").where("name", "=", username).first();
    if (!data) return res.status(400).send(error(t("login.login.failed", {}, locale)));

    if (data!.password == password && data!.name == username) {
      const tokenData = await u.db("o_setting").where("key", "tokenKey").first();
      if (!tokenData) return res.status(400).send(error(t("login.login.tokenKeyNotFound", {}, locale)));
      const token = setToken(
        {
          id: data!.id,
          name: data!.name,
        },
        "180Days",
        tokenData?.value as string,
        locale,
      );

      return res.status(200).send(success({ token: "Bearer " + token, name: data!.name, id: data!.id }, t("login.login.success", {}, locale)));
    } else {
      return res.status(400).send(error(t("login.login.wrongCredentials", {}, locale)));
    }
  },
);
