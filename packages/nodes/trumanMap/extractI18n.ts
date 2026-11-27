import { readFile, writeAtomic } from "@toonflow/file";
import { resolve } from "node:path";
import { getAssetDerivatives } from "./src/assetCatalog";
import { sourceAssetsById } from "./src/assetCatalogSources";
import { builtinAssets } from "./src/assetLibrary";
import { architectureLayoutNames } from "./src/architectureStructures";
import { getObjectNameParts, objectAssets } from "./src/objectCatalog";
import { getNatureNameParts, natureAssets, natureNameTemplate } from "./src/natureCatalog";

const root = import.meta.dirname;
const path = resolve(root, "i18n/zhCn.json");
const previous = await readFile(path, "utf8");
const names = new Set<string>([...architectureLayoutNames, natureNameTemplate]);
for (const asset of objectAssets) {
  for (const part of getObjectNameParts(asset.blueprint!.design)!) names.add(part);
}
for (const asset of natureAssets) {
  for (const part of getNatureNameParts(asset.blueprint!.design)!) if (typeof part === "string") names.add(part);
}
for (const asset of builtinAssets) {
  names.add(asset.name);
  for (const child of getAssetDerivatives(asset)) {
    if (!child.recipe) {
      names.add(child.name);
      continue;
    }
    const source = sourceAssetsById.get(child.recipe.sourceId);
    if (!source) throw new Error(`素材配方缺少来源：${child.recipe.sourceId}`);
    names.add(source.name);
  }
}

try {
  const extractProcess = Bun.spawn([process.execPath, "run", "--cwd", resolve(root, "../../i18n"), "extract", root], {
    cwd: root,
    stdout: "inherit",
    stderr: "inherit",
  });
  if (await extractProcess.exited !== 0) throw new Error("插件多语言抽取失败");
  const messages: Record<string, string> = JSON.parse(await readFile(path, "utf8"));
  for (const name of names) messages[name] = name;
  const sorted = Object.fromEntries(Object.entries(messages).sort(([left], [right]) => left.localeCompare(right, "zh-CN")));
  await writeAtomic(path, JSON.stringify(sorted, null, 2) + "\n");
  console.log(`Collected ${names.size} builtin asset names`);
} catch (error) {
  try {
    await writeAtomic(path, previous);
  } catch (restoreError) {
    throw new AggregateError([error, restoreError], "插件多语言抽取失败，且无法恢复原源字典");
  }
  throw error;
}
