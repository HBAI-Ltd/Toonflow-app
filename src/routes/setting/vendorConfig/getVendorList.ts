import express from "express";
import { success } from "@/lib/responseFormat";
import db from "@/utils/db";
import * as vendorUtils from "@/utils/vendor";
const router = express.Router();

export default router.post("/", async (req, res) => {
  const data = await db("o_vendorConfig").select("*");

  const list = await Promise.all(
    data.map(async (item) => {
      const vendor = vendorUtils.getVendor(item.id!);
      return {
        ...item,
        inputValues: JSON.parse(item.inputValues ?? "{}"),
        models: await vendorUtils.getModelList(item.id!),
        code: vendorUtils.getCode(item.id!),
        description: vendor.description,
        inputs: vendor.inputs,
        author: vendor.author,
        name: vendor.name,
        version: vendor.version ?? "1.0",
      };
    }),
  );

  list.sort((a, b) => (a.id === "toonflow" ? -1 : b.id === "toonflow" ? 1 : 0));
  res.status(200).send(success(list));
});
