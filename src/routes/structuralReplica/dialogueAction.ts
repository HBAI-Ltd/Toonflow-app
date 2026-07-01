import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { applyDialogueAction } from "@/services/structuralReplica/dialogueActionService";

const router = express.Router();

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    shotId: z.string().min(1),
    action: z.enum(["compress_dialogue", "split_shot", "extend_shot", "mark_no_dialogue", "sync_subtitle_from_dialogue"]),
    value: z.union([z.string(), z.number()]).nullable().optional(),
  }),
  async (req, res) => {
    try {
      res.status(200).send(success(await applyDialogueAction(req.body)));
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
