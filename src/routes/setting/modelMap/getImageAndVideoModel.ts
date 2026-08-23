import express from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";
import { t, getLocale } from "@/i18n";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const locale = await getLocale(req as any);
  const dataList = await u.db("o_vendorConfig").select("id").where("enable", 1);
  if (!dataList || dataList.length === 0) {
    return res.status(404).send({ error: t("setting.modelMap.getImageAndVideoModel.modelNotFound", {}, locale) });
  }
  const data = await Promise.all(
    dataList.map(async (item) => {
      const vendor = u.vendor.getVendor(item.id!);
      const promptList = await u.db("o_modelPrompt").andWhere("vendorId", vendor.id).select("*");
      const promptMap = new Map(promptList.map((p) => [p.model, { fileName: p.fileName, path: p.path }]));
      const models = await u.vendor.getModelList(item.id!);
      const filteredModels = models
        .filter((m: any) => m.type === "video")
        .map((m: any) => ({
          name: m.name,
          type: m.type as "image" | "video",
          model: m.modelName,
          ...(promptMap.get(m.modelName) ? { ...promptMap.get(m.modelName) } : {}),
        }));
      return {
        id: item.id,
        name: vendor.name,
        promptList: filteredModels,
      };
    }),
  );
  res.status(200).send(success(data));
});
