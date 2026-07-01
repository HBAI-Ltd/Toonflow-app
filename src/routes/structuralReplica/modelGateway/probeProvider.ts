import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { listEffectiveProviderCapabilities } from "@/services/structuralReplica/modelGateway/providerCapabilityService";
import { probeProviderCapability } from "@/services/structuralReplica/modelGateway/providerProbeService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    providerId: z.string().min(1),
    model: z.string().optional(),
  }),
  async (req, res) => {
    try {
      const providers = await listEffectiveProviderCapabilities({ syncVendors: true });
      const provider = providers.find((item) => item.providerId === req.body.providerId);
      if (!provider) return res.status(400).send(error(`provider not found: ${req.body.providerId}`));
      res.status(200).send(success(await probeProviderCapability(provider, req.body.model)));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
