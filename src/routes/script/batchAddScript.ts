import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { t, getLocale } from "@/i18n";
const router = express.Router();

// 新增剧本
export default router.post(
  "/",
  validateFields({
    data: z.array(
      z.object({
        scriptName: z.string(),
        scriptData: z.string(),
      }),
    ),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { data, projectId } = req.body;
    const locale = await getLocale(req as any);
    await u.db("o_script").insert(
      data.map((i: { scriptName: string; scriptData: string }) => {
        return {
          name: i.scriptName,
          content: i.scriptData,
          projectId,
          createTime: Date.now(),
        };
      }),
    );

    res.status(200).send(success({ message: t("script.common.added", {}, locale) }));
  },
);
