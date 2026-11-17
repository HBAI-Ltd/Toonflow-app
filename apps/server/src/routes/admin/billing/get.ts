import { Router } from "express";
import { success } from "@/lib/responseFormat";
import { requireAdmin } from "@/utils/accounts/service";
import { getBillingSettings, upstreamConversion } from "@/utils/hosting/billing";

export default Router().get("/", async (_req, res) => {
  requireAdmin();
  let conversion: Awaited<ReturnType<typeof upstreamConversion>> | null = null;
  let upstreamError = "";
  try { conversion = await upstreamConversion(); }
  catch { upstreamError = "暂时无法取得上游换算基准，请检查上游地址和服务状态"; }
  res.json(success({ settings: getBillingSettings(), currency: "CNY", conversion, upstreamError }));
});
