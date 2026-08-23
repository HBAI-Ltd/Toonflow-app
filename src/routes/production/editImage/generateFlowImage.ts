import express from "express";
import u from "@/utils";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import axios from "axios";
import { t, getLocale } from "@/i18n";
const router = express.Router();

async function urlToBase64(imageUrl: string): Promise<string> {
  if (imageUrl.startsWith("/oss/")) {
    return await u.oss.getImageBase64(u.replaceUrl(imageUrl).replace("/smallImage", ""));
  }
  imageUrl = await u.oss.getFileUrl(u.replaceUrl(imageUrl));
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const contentType = response.headers["content-type"] || "image/png";
  const base64 = Buffer.from(response.data, "binary").toString("base64");
  return `data:${contentType};base64,${base64}`;
}
export default router.post(
  "/",
  validateFields({
    model: z.string(),
    references: z.array(z.string()).optional(),
    quality: z.string(),
    ratio: z.string(),
    prompt: z.string(),
    projectId: z.number(),
  }),
  async (req, res) => {
    const { model, references = [], quality, ratio, prompt, projectId } = req.body;
    const locale = await getLocale(req as any);
    try {
      const imageClass = await u.Ai.Image(model).run(
        {
          prompt: prompt,
          referenceList: await (async () => {
            const list: { type: "image"; base64: string }[] = [];
            for (const url of references) {
              list.push({ type: "image" as const, base64: await urlToBase64(url) });
            }
            return list;
          })(),
          size: quality,
          aspectRatio: ratio,
        },
        {
          taskClass: t("taskClass.workflowImage", {}, locale),
          describe: t("production.editImage.generateFlowImage.taskDescribe", {}, locale),
          relatedObjects: JSON.stringify(req.body),
          projectId: projectId,
        },
      );
      const savePath = `${projectId}/workFlow/${u.uuid()}.jpg`;
      await imageClass.save(savePath);

      const url = await u.oss.getSmallImageUrl(savePath);
      return res.status(200).send(success({ url }));
    } catch (e) {
      res.status(400).send(error(u.error(e).message));
    }
  },
);
