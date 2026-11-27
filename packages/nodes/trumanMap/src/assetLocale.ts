import { locale, msg, t, translate } from "@toonflow/i18n/vue";
import { architectureLayoutNames } from "./architectureStructures";
import { sourceAssetsById } from "./assetCatalogSources";
import { getObjectNameParts } from "./objectCatalog";
import { getNatureNameParts, natureNameTemplate, type NatureNamePart } from "./natureCatalog";
import type { SceneAsset } from "./sceneDocument";

function translateNaturePart(part: NatureNamePart): string | undefined {
  if (typeof part === "string") {
    const translated = translate(part);
    return locale.value !== "zh-TW" && translated === part ? undefined : translated;
  }
  let message;
  switch (part.unit) {
    case "枝": message = msg`${part.count}枝`; break;
    case "株": message = msg`${part.count}株`; break;
    case "节叶": message = msg`${part.count}节叶`; break;
    case "主块": message = msg`${part.count}主块`; break;
    case "侧枝": message = msg`${part.count}侧枝`; break;
    case "刺座": message = msg`${part.count}刺座`; break;
    case "主枝": message = msg`${part.count}主枝`; break;
    case "枝梢": message = msg`${part.count}枝梢`; break;
    case "节点": message = msg`${part.count}节点`; break;
    case "伴生器官": message = msg`${part.count}伴生器官`; break;
  }
  if (locale.value !== "zh-TW" && translate(message.id) === message.id) return;
  return translate(message);
}

export function getAssetDisplayName(asset: SceneAsset, builtin: boolean): string {
  if (!builtin || locale.value === "zh-CN") return asset.name;
  const name = translate(asset.name);
  if (name !== asset.name) return name;

  if (asset.blueprint?.pack === "architecture") {
    const design = asset.blueprint.design;
    const parts = /^([^·]+)·([^·]+)·层级(10|[1-9])（(\d{4})）$/.exec(asset.name);
    if (!parts || !Number.isInteger(design) || design < 0 || design >= 7000) return asset.name;
    const layout = architectureLayoutNames[design % 10];
    const level = Math.floor(design % 100 / 10) + 1;
    const code = String(design + 1).padStart(4, "0");
    if (!layout || parts[2] !== layout || parts[3] !== String(level) || parts[4] !== code) return asset.name;
    const programName = translate(parts[1]!);
    const layoutName = translate(layout);
    if (locale.value !== "zh-TW" && (programName === parts[1] || layoutName === layout)) return asset.name;
    const message = msg`${programName}·${layoutName}·层级${level}（${code}）`;
    if (translate(message.id) === message.id) return asset.name;
    return translate(message);
  }
  if (asset.blueprint?.pack === "objects") {
    const parts = getObjectNameParts(asset.blueprint.design);
    if (!parts || asset.name !== `${parts[0]}·${parts[1]}${parts[2]}${parts[3]}`) return asset.name;
    const translated = parts.map(part => translate(part));
    if (locale.value !== "zh-TW" && translated.some((part, index) => part === parts[index])) return asset.name;
    const message = msg`${translated[0]}·结构：${translated[1]}、${translated[2]}、${translated[3]}`;
    if (translate(message.id) === message.id) return asset.name;
    return translate(message);
  }
  if (asset.blueprint?.pack === "nature") {
    const parts = getNatureNameParts(asset.blueprint.design);
    if (!parts || parts.length !== 3 || asset.name !== parts.map(part => typeof part === "string" ? part : `${part.count}${part.unit}`).join("·")) return asset.name;
    const translated = parts.map(translateNaturePart);
    if (translated.some(part => part === undefined)) return asset.name;
    // ACT: 纯分隔符模板缺译时可原样使用；各语言可提供模板调整顺序。
    return translate(natureNameTemplate, { 0: translated[0], 1: translated[1], 2: translated[2] });
  }
  if (!asset.recipe) return asset.name;

  const source = sourceAssetsById.get(asset.recipe.sourceId);
  if (!source) return asset.name;
  const sourceName = translate(source.name);
  // ACT: 旧配方名称按素材、状态和款式生成；素材尚无译文时保留完整原名。繁体名称可能与简体完全相同，仍需转换状态与款式。
  if (locale.value !== "zh-TW" && sourceName === source.name && /\p{Script=Han}/u.test(sourceName)) return asset.name;
  const parts = [sourceName];
  if (asset.recipe.state !== "原始") parts.push(translate(asset.recipe.state));
  if (asset.recipe.variant) parts.push(t`款式 ${String(asset.recipe.variant).padStart(2, "0")}`);
  return parts.join(" · ");
}
