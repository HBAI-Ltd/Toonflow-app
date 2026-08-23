import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();

export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;
    const data = await u
      .db("o_script")
      .whereIn("id", ids)
      .whereNot("extractState", "生成中") // i18n-ignore — stored o_script.extractState enum value, not user-facing text
      .select("id", "extractState", "errorReason");
    res.status(200).send(success(data));
  },
);
