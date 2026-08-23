import express from "express";
import u from "@/utils";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
const router = express.Router();
import { flowDataSchema } from "@/agents/productionAgent/tools";

export default router.post(
  "/",
  validateFields({
    projectId: z.number(),
    episodesId: z.number(),
    data: z.any(),
  }),
  async (req, res) => {
    const {
      data,
      projectId,
      episodesId,
    }: {
      data: z.infer<typeof flowDataSchema>;
      projectId: number;
      episodesId: number;
    } = req.body;
    const sqlData = await u.db("o_agentWorkData").where("projectId", String(projectId)).andWhere("episodesId", String(episodesId)).first();
    if (data.storyboard && data.storyboard.length) {
      const filterDatas = data?.storyboard.filter((i) => !i.id);
      if (!filterDatas.length) {
        try {
          await Promise.all(
            data.storyboard
              .filter((i) => i.id)
              .map(async (i, index) => {
                await u.db("o_storyboard").where("id", i.id).update({
                  index: index,
                });
              }),
          );
        } catch (error) {
          console.error("更新分镜排序失败", error); // i18n-ignore — server-side log message, not user-facing text
        }
      }
    }

    if (!sqlData) {
      await u.db("o_agentWorkData").insert({
        projectId,
        episodesId,
        key: "productionAgent",
        data: JSON.stringify(data),
      });
    } else {
      await u
        .db("o_agentWorkData")
        .where("projectId", String(projectId))
        .where("key", "productionAgent")
        .andWhere("episodesId", String(episodesId))
        .update({
          data: JSON.stringify(data),
        });
    }
    return res.status(200).send(success());
  },
);
