import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import path from "path";
import fs from "fs";
import u from "@/utils";
import { z } from "zod";
import { t, getLocale } from "@/i18n";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.string(),
  }),
  async (req, res) => {
    const locale = await getLocale(req as any);
    const { id } = req.body;
    await u.db("o_vendorConfig").where("id", id).del();
    await u.db("o_agentDeploy").where("vendorId", id).update({
      model: null,
      vendorId: null,
    });
    fs.rmSync(path.join(u.getPath("vendor"), `${id}.ts`), { recursive: true, force: true });
    res.status(200).send(success(null, t("setting.vendorConfig.deleteVendor.deleted", {}, locale)));
  },
);
