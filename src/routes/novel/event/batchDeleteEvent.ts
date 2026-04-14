import express from "express";
import db from "@/utils/db";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    ids: z.array(z.number()),
  }),
  async (req, res) => {
    const { ids } = req.body;

    await db("o_eventChapter").whereIn("eventId", ids).del();
    await db("o_event").whereIn("id", ids).del();

    return res.status(200).send(success({ message: "Delete events success" }));
  },
);
