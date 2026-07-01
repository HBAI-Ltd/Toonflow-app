import u from "@/utils";
import { ComplianceReportSchema, type ComplianceReport } from "./schemas";
import { hasSourceEntityRisk } from "./consistencyGuard";
import { getTaskBundle } from "./repository";

export async function checkTaskCompliance(taskId: number): Promise<ComplianceReport> {
  const bundle = await getTaskBundle(taskId);
  const issues: ComplianceReport["issues"] = [];
  const assetIds = new Set(bundle.bindings.map((binding) => binding.assetId).filter((id): id is number => typeof id === "number"));
  if (assetIds.size) {
    const assets = await u.db("o_assets").whereIn("id", [...assetIds]).select("*");
    for (const asset of assets) {
      if (!asset.licenseType || !asset.sourceOwner) {
        issues.push({
          code: "asset_license_missing",
          level: "warning",
          message: "核心资产缺少授权类型或来源所有者。",
          assetId: Number(asset.id),
        });
      }
      if (asset.commercialAllowed === 0) {
        issues.push({
          code: "asset_not_commercial_allowed",
          level: "blocker",
          message: "核心资产未授权商业使用。",
          assetId: Number(asset.id),
        });
      }
    }
  }
  if (bundle.storyIr?.dataJson && hasSourceEntityRisk(bundle.storyIr.dataJson)) {
    issues.push({
      code: "source_entity_leakage_risk",
      level: "blocker",
      message: "源视频人物、品牌、门店或水印存在泄漏风险。",
    });
  }
  const status = issues.some((issue) => issue.level === "blocker") ? "blocked" : issues.length ? "warning" : "pass";
  await u.db("o_sr_task").where("id", taskId).update({
    complianceStatus: status,
    updatedAt: Date.now(),
  });
  return ComplianceReportSchema.parse({ taskId, status, issues });
}

export async function updateAssetLicense(input: {
  assetId: number;
  licenseType?: string | null;
  licenseNote?: string | null;
  sourceOwner?: string | null;
  commercialAllowed?: boolean | null;
}) {
  await u.db("o_assets").where("id", input.assetId).update({
    licenseType: input.licenseType ?? null,
    licenseNote: input.licenseNote ?? null,
    sourceOwner: input.sourceOwner ?? null,
    commercialAllowed: input.commercialAllowed === undefined || input.commercialAllowed === null ? null : input.commercialAllowed ? 1 : 0,
  });
  return await u.db("o_assets").where("id", input.assetId).first();
}
