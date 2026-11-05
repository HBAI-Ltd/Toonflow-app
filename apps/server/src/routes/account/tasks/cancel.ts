import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { cancelTask } from "@/utils/hosting/tasks";

export default Router().post("/", (req, res) => {
  const { id } = z.strictObject({ id: z.uuid() }).parse(req.body);
  cancelTask(id);
  res.json(success());
});
