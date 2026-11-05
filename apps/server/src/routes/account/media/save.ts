import { Router } from "express";
import { z } from "zod";
import { success } from "@/lib/responseFormat";
import { saveMediaPreview } from "@/utils/hosting/mediaPreview";

export default Router().post("/", async (req, res) => {
  const { id } = z.strictObject({ id: z.uuid() }).parse(req.body);
  res.json(success(await saveMediaPreview(id)));
});
