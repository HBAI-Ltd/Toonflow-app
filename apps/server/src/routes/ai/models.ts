import { Router } from "express";
import { success } from "@/lib/responseFormat";
import u from "@/utils";

export default Router().get("/", (_req, res) => {
  res.json(success(u.ai.listAiModels()));
});
