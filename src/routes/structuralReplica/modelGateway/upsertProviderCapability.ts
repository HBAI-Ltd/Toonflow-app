import express from "express";
import { error, success } from "@/lib/responseFormat";
import { saveProviderCapability } from "@/services/structuralReplica/modelGateway/providerCapabilityService";

const router = express.Router();

export default router.post("/", async (req, res) => {
  try {
    res.status(200).send(success({ provider: await saveProviderCapability(req.body) }));
  } catch (e) {
    res.status(400).send(error(e instanceof Error ? e.message : String(e)));
  }
});
