import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { updateAssetLicense } from "@/services/structuralReplica/complianceService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    assetId: z.number().int().positive(),
    licenseType: z.string().optional().nullable(),
    licenseNote: z.string().optional().nullable(),
    sourceOwner: z.string().optional().nullable(),
    commercialAllowed: z.boolean().optional().nullable(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success({ asset: await updateAssetLicense(req.body) }));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
