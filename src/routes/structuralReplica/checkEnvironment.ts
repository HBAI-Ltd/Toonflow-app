import express from "express";
import { success, error } from "@/lib/responseFormat";
import { checkStructuralReplicaEnvironment } from "@/services/structuralReplica/environmentCheckService";

const router = express.Router();

export default router.post("/", async (_, res) => {
  try {
    res.status(200).send(success(await checkStructuralReplicaEnvironment()));
  } catch (e) {
    res.status(400).send(error(e instanceof Error ? e.message : String(e)));
  }
});
