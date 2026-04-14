import express from "express";
import { success } from "@/lib/responseFormat";
import fg from "fast-glob";
import getPath from "@/utils/getPath";

const router = express.Router();

export default router.post("/", async (req, res) => {
  const skillsRoot = getPath(["skills"]);

  const entries = await fg("**/*.md", {
    cwd: skillsRoot.replace(/\\/g, "/"),
    onlyFiles: true,
  });

  res.status(200).send(success(entries));
});
