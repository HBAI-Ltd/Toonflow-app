import express from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { upsertEncryptedSetting } from "@/services/structuralReplica/securityService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    apiKey: z.string().min(1),
  }),
  async (req, res) => {
    await upsertEncryptedSetting("sr.visionApiKey", req.body.apiKey);
    res.status(200).send(success({ saved: true, apiKey: "" }));
  },
);
