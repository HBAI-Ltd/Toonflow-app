import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

const schema = z.strictObject({ userId: z.uuid(), requestId: z.uuid(), reason: z.string().trim().min(1).max(256) });

export default Router().post("/", validateFields(schema.shape), async (req, res) => {
  const input = schema.parse(req.body);
  res.set("Cache-Control", "no-store").json(success(await u.multiTenant.releaseUserReservation(req, input.userId, input.requestId, input.reason)));
});
