import { transform } from "sucrase";
import fs from "fs";
import path from "path";
import u from "@/utils";

function safeVendorPath(id: string | number): string {
  const idStr = String(id);
  // 防止路径遍历：只允许字母、数字、下划线、短横线、点号
  if (!/^[a-zA-Z0-9._-]+$/.test(idStr)) {
    throw new Error(`Invalid vendor id: ${idStr}`);
  }
  const rootDir = u.getPath("vendor");
  const targetFile = path.join(rootDir, `${idStr}.ts`);
  // 二次验证路径在 vendor 目录内
  if (!targetFile.startsWith(path.resolve(rootDir))) {
    throw new Error(`Path traversal detected in vendor id: ${idStr}`);
  }
  return targetFile;
}

export function writeCode(id: string | number, tsCode: string) {
  const targetFile = safeVendorPath(id);
  const rootDir = path.dirname(targetFile);
  fs.mkdirSync(rootDir, { recursive: true });
  fs.writeFileSync(targetFile, tsCode);
}

export function getCode(id: string): string {
  const targetFile = safeVendorPath(id);
  if (!fs.existsSync(targetFile)) return "";
  return fs.readFileSync(targetFile, "utf-8");
}

export async function getModelList(id: string): Promise<Array<any>> {
  const models = await u.db("o_vendorConfig").where("id", id).select("models").first();
  if (!models || !models.models) return [];
  const code = getCode(id);
  const jsCode = transform(code, { transforms: ["typescript"] }).code;
  const vendorData = u.vm(jsCode);
  if(!vendorData || !vendorData.vendor || !vendorData.vendor.models) return [];
  const combined = [...JSON.parse(JSON.stringify(vendorData.vendor.models)), ...JSON.parse(models?.models ?? "[]")];
  const map = new Map<string, any>();
  for (const m of combined) {
    map.set(m.modelName, m);
  }
  return [...map.values()];
}

export function getVendor(id: string) {
  const code = getCode(id);
  const jsCode = transform(code, { transforms: ["typescript"] }).code;
  const vendorData = u.vm(jsCode);
  return vendorData.vendor;
}
