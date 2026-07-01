import express from "express";
import { z } from "zod";
import { error, success } from "@/lib/responseFormat";
import { validateFields } from "@/middleware/middleware";
import { getTaskOrThrow, updateTaskStatus } from "@/services/structuralReplica/repository";
import { updateDialogueStructure } from "@/services/structuralReplica/dialogueStructureService";

const router = express.Router();

const DialoguePatchSchema = z.object({
  shotId: z.string().min(1),
  editableTemplate: z.string().optional(),
  variables: z.record(z.string(), z.string()).optional(),
  finalDialogue: z.string().optional(),
  subtitle: z.string().optional(),
  cta: z.string().optional(),
});

export default router.post(
  "/",
  validateFields({
    taskId: z.number().int().positive(),
    patches: z.array(DialoguePatchSchema).min(1),
  }),
  async (req, res) => {
    const { taskId, patches } = req.body;

    try {
      const task = await getTaskOrThrow(taskId);
      if (task.status !== "ir_built" && task.status !== "dialogue_reviewed" && task.status !== "asset_gap_ready" && task.status !== "assets_bound") {
        return res.status(400).send(error(`task status must be ir_built or later editable stage, got ${task.status}`));
      }

      const dialogueStructure = await updateDialogueStructure(taskId, patches);
      const updatedTask = task.status === "ir_built" ? await updateTaskStatus(taskId, "dialogue_reviewed") : task;
      const warnings = dialogueStructure.lines.flatMap((line) => line.warnings.map((warning) => ({ shotId: line.shotId, warning })));

      res.status(200).send(
        success({
          taskId,
          status: updatedTask.status,
          version: dialogueStructure.version,
          warnings,
          dialogueStructure,
        }),
      );
    } catch (e) {
      res.status(400).send(error(e instanceof Error ? e.message : String(e)));
    }
  },
);
