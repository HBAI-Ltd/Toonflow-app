import { Router } from "express";
import u from "@/utils";
import { success } from "@/lib/responseFormat";

export default Router().get("/", async (req, res) => {
  res.json(success(await u.mediaProvider.listMediaProviders()));
});
