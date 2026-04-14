import express from "express";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";
import { z } from "zod";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.string(),
    inputValues: z.record(z.string(), z.string()),
  }),
  async (req, res) => {
    const { id, inputValues } = req.body;

    await db
      ("o_vendorConfig")
      .where("id", id)
      .update({
        inputValues: JSON.stringify(inputValues),
      });
    res.status(200).send(success("更新成功"));
  },
);
