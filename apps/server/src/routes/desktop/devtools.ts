import { Router } from "express";
import u from "@/utils";

const router = Router();

export default router.post("/", (req, res) => {
  u.desktop.getDesktopRuntime(req).openDevTools();
  res.sendStatus(204);
});
