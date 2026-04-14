import { transform } from "sucrase";
import fs from "fs";
import path from "path";
import db from "@/utils/db";
import getPath from "@/utils/getPath";
import vm from "@/utils/vm";

export function writeCode(id: string | number, tsCode: string) {
  const rootDir = getPath("vendor");
  fs.mkdirSync(rootDir, { recursive: true });
  if (fs.existsSync(path.join(rootDir,  `${id}.ts`))) {
    fs.writeFileSync(path.join(rootDir,  `${id}.ts`), tsCode);
  }
  fs.writeFileSync(path.join(rootDir,  `${id}.ts`), tsCode);
}

export function getCode(id: string): string {
  const rootDir = getPath("vendor");
  const targetFile = path.join(rootDir, `${id}.ts`);
  if (!fs.existsSync(targetFile)) return "";
  return fs.readFileSync(targetFile, "utf-8");
}

export async function getModelList(id: string): Promise<Array<any>> {
  const models = await db("o_vendorConfig").where("id", id).select("models").first();
  if (!models || !models.models) return [];
  const code = getCode(id);
  const jsCode = transform(code, { transforms: ["typescript"] }).code;
  const vendorData = vm(jsCode);
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
  const vendorData = vm(jsCode);
  return vendorData.vendor;
}
