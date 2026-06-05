import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import u from "@/utils";
import { z } from "zod";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.string(),
    enable: z.union([z.number(), z.boolean()]),
  }),
  async (req, res) => {
    const { id, enable } = req.body;
    const existing = await u.db("o_vendorConfig").where("id", id).first("id");
    if (!existing) return res.status(404).send(error(`供应商 ${id} 不存在，请先添加供应商`));

    await u.db("o_vendorConfig").where("id", id).update({ enable: Number(enable) });
    res.status(200).send(success("更新成功"));
  },
);
