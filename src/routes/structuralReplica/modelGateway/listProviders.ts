import express from "express";
import { success, error } from "@/lib/responseFormat";
import { listEffectiveProviderCapabilities } from "@/services/structuralReplica/modelGateway/providerCapabilityService";

const router = express.Router();

export default router.post("/", async (_, res) => {
  try {
    res.status(200).send(success({ providers: await listEffectiveProviderCapabilities({ syncVendors: true }) }));
  } catch (e) {
    res.status(400).send(error(e instanceof Error ? e.message : String(e)));
  }
});
