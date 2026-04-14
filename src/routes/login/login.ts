import express from "express";
import db from "@/utils/db";
import jwt from "jsonwebtoken";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { z } from "zod";
const router = express.Router();

export function setToken(payload: string | object, expiresIn: string | number, secret: string): string {
  if (!payload || typeof secret !== "string" || !secret) {
    throw new Error("参数不合法");
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
    const { username, password } = req.body;

    const data = await db("o_user").where("name", "=", username).first();
    if (!data) return res.status(400).send(error("登录失败"));

    if (data!.password == password && data!.name == username) {
      const tokenData = await db("o_setting").where("key", "tokenKey").first();
      if (!tokenData) return res.status(400).send(error("未找到tokenKey"));
      const token = setToken(
        {
          id: data!.id,
          name: data!.name,
        },
        "180Days",
        tokenData?.value as string,
      );

      return res.status(200).send(success({ token: "Bearer " + token, name: data!.name, id: data!.id }, "登录成功"));
    } else {
      return res.status(400).send(error("用户名或密码错误"));
    }
  },
);
