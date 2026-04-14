import express from "express";
import { success } from "@/lib/responseFormat";
import db from "@/utils/db";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const allData = await db("o_agentDeploy").leftJoin("o_vendorConfig", "o_vendorConfig.id", "o_agentDeploy.vendorId").select("o_agentDeploy.*");
  const qrdinaryData = allData.filter((item: any) => !item.key?.includes(":"));
  const advancedData = allData.filter((item: any) => item.key?.includes(":"));
  res.status(200).send(success({ qrdinaryData, advancedData }));
});
