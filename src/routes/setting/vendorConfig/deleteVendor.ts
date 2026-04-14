import express from "express";
import { success, error } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import path from "path";
import fs from "fs";
import db from "@/utils/db";
import getPath from "@/utils/getPath";
import { z } from "zod";
const router = express.Router();
export default router.post(
  "/",
  validateFields({
    id: z.string(),
  }),
  async (req, res) => {
    const { id } = req.body;
    await db("o_vendorConfig").where("id", id).del();
    await db("o_agentDeploy").where("vendorId", id).update({
      model: null,
      vendorId: null,
    });
    fs.rmSync(path.join(getPath("vendor"), `${id}.ts`), { recursive: true, force: true });
    res.status(200).send(success("删除成功"));
  },
);
