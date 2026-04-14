import express from "express";
import db from "@/utils/db";
import oss from "@/utils/oss";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    name: z.string(),
    fileUrl: z.string(),
    prompt: z.string(),
  }),
  async (req, res) => {
    const { name, fileUrl, prompt } = req.body;
    const imagePath = `/artStyle/${uuidv4()}.jpg`;
    const matches = fileUrl.match(/^data:image\/\w+;base64,(.+)$/);
    const realBase64 = matches ? matches[1] : fileUrl;

    await oss.writeFile(imagePath, Buffer.from(realBase64, "base64"));
    await db("o_artStyle").insert({
      id: Date.now(),
      name,
      fileUrl: imagePath,
      label: name,
      prompt,
    });

    res.status(200).send(success("Add art style success"));
  },
);
