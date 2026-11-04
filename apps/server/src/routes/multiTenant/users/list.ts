import { Router } from "express";
import { z } from "zod";
import u from "@/utils";
import { validateFields } from "@/lib/middleware";
import { success } from "@/lib/responseFormat";

export default Router().get("/", validateFields({
  search: z.string().max(64).optional(),
  status: z.enum(["all", "enabled", "disabled"]).optional(),
  page: z.coerce.number().int().min(1).max(100000000).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
}, "query"), async (req, res) => {
  const result = await u.multiTenant.listUsers(req, {
    search: (req.query.search as string | undefined) ?? "",
    status: (req.query.status as "all" | "enabled" | "disabled" | undefined) ?? "all",
    page: Number(req.query.page ?? 1),
    pageSize: Number(req.query.pageSize ?? 20),
  });
  res.set("Cache-Control", "no-store").json(success(result));
});
