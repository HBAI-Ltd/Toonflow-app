import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import db from "@/utils/db";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    id: z.number(),
    data: z.string(),
  }),
  async (req, res) => {
    const { id, data } = req.body;

    await db("o_prompt").where("id", id).update({
      useData: data,
    });

    res.status(200).send(success(123));
  },
);
