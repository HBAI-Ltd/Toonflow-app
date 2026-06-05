import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
import { transform } from "sucrase";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    inputValues: z.record(z.string(), z.unknown()),
  }),
  async (req, res) => {
    const { id, inputValues } = req.body;

    const existing = await u.db("o_vendorConfig").where("id", id).first("inputValues");
    if (!existing) return res.status(404).send(error(`供应商 ${id} 不存在，请先添加供应商`));

    let previousInputValues = {};
    try {
      previousInputValues = JSON.parse(existing.inputValues ?? "{}");
    } catch {
      previousInputValues = {};
    }

    await u
      .db("o_vendorConfig")
      .where("id", id)
      .update({
        inputValues: JSON.stringify({ ...previousInputValues, ...inputValues }),
      });
    res.status(200).send(success("更新成功"));
  },
);
