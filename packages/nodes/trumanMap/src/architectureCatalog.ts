import type { ModelDefinition } from "./modelGeometry";
import type { AssetTheme, SceneAsset } from "./sceneDocument";
import { architectureLayoutNames } from "./architectureStructures";
import { commercialPrograms, createCommercialArchitecture, createHousingArchitecture, createPublicArchitecture, housingPrograms, publicPrograms } from "./architectureCivicModels";
import { createIndustrialArchitecture, createTransitArchitecture, industrialPrograms, transitPrograms } from "./architectureIndustrialModels";
import { refineArchitecture } from "./masterArchitecture/architectureDetails";
import { trimGroundSlabs } from "./masterArchitecture/groundTrim";
import { createGardenArchitecture, createSpeculativeArchitecture, gardenPrograms, speculativePrograms } from "./architectureGardenModels";

const programs = [housingPrograms, publicPrograms, commercialPrograms, industrialPrograms, transitPrograms, gardenPrograms, speculativePrograms];
const families = ["住宅", "公共建筑", "商业建筑", "工业建筑", "交通建筑", "园林建筑", "幻想建筑"];
const factories = [createHousingArchitecture, createPublicArchitecture, createCommercialArchitecture, createIndustrialArchitecture, createTransitArchitecture, createGardenArchitecture, createSpeculativeArchitecture];

function describeArchitecture(design: number) {
  const family = Math.floor(design / 1000), program = Math.floor(design / 100) % 10, structure = design % 100;
  return { family, program, layout: structure % 10, massing: Math.floor(structure / 10) };
}

function architectureName(design: number) {
  const { family, program, layout, massing } = describeArchitecture(design);
  return `${programs[family]![program]}·${architectureLayoutNames[layout]}·层级${massing + 1}（${String(design + 1).padStart(4, "0")}）`;
}

export function createArchitectureModel(design: number): ModelDefinition {
  if (!Number.isInteger(design) || design < 0 || design >= 7000) throw new Error("建筑设计编号必须是 0 到 6999 的整数");
  const { family, program, layout, massing } = describeArchitecture(design);
  const parts = factories[family]!(program, layout, massing);
  if (parts.length < 10 || parts.length > 70) throw new Error("建筑结构须保持 10 到 70 个部件");
  const name = architectureName(design);
  // 体量块补门窗和线脚、坡屋顶换屋面套件；细化后最多 112 个部件，出错保持原样
  refineArchitecture(parts, design, name);
  // 脚下的“地面基础台”原来比建筑多出四米，裁到主体范围外扩 0.6m，不再盖住街道和旁边的物件
  try { trimGroundSlabs(parts); } catch { /* 保持原样 */ }
  return { name, parts };
}

export const architectureAssets: SceneAsset[] = [];
// ACT: 功能原型交错陈列；这里仅声明7000个本地结构蓝图，不创建模型或几何资源。
for (let structure = 0; structure < 100; structure++) for (let family = 0; family < 7; family++) for (let program = 0; program < 10; program++) {
  const design = family * 1000 + program * 100 + structure;
  const theme: AssetTheme | undefined = family === 6 ? program === 0 || program === 4 || program === 8 || program === 9 ? "科幻" : program === 5 ? "蒸汽朋克" : "奇幻" : family === 5 && (program === 2 || program === 4) ? "中式" : undefined;
  architectureAssets.push({
    id: `architecture${String(design).padStart(4, "0")}`, name: structure === 0 ? programs[family]![program]! : architectureName(design), ...(structure ? { variantOf: `architecture${String(design - structure).padStart(4, "0")}` } : {}), category: "建筑", itemType: "建筑", kind: "model", normalize: false,
    license: "内置原创程序化模型", state: "原始", ...(theme ? { theme } : {}),
    tags: [families[family]!, programs[family]![program]!, architectureLayoutNames[structure % 10]!, "本地原创", "结构设计"],
    blueprint: { pack: "architecture", design, revision: 1 },
  });
}
