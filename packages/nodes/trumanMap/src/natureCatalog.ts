import type { SceneAsset } from "./sceneDocument";
import type { ModelDefinition } from "./modelGeometry";
import { groundParts } from "./natureParts";
import { cactusForms, createNatureCactus, createNatureFlowers, createNatureMushrooms, createNatureTree, flowerForms, mushroomForms, mushroomStems, treeBodies, treeCrowns } from "./naturePlants";
import { coralForms, createNatureCoral, createNatureLandscape, createNatureRocks, createNatureSpecial, landscapeForms, rockForms, rockLayouts, specialLandforms } from "./natureLandforms";
import { createNatureCreature, creatureBodies, creatureHeads, creatureLimbs } from "./natureCreatures";

const natureFamilies = [
  { start: 0, count: 900, step: 100, parents: treeBodies, name: "树木", itemType: "植物" as const },
  { start: 900, count: 720, step: 90, parents: flowerForms, name: "花草", itemType: "植物" as const },
  { start: 1620, count: 630, step: 70, parents: rockLayouts, name: "岩石晶簇", itemType: "岩石" as const },
  { start: 2250, count: 420, step: 60, parents: cactusForms, name: "仙人掌", itemType: "植物" as const },
  { start: 2670, count: 420, step: 60, parents: mushroomForms, name: "蘑菇", itemType: "植物" as const },
  { start: 3090, count: 420, step: 60, parents: coralForms, name: "珊瑚", itemType: "植物" as const },
  { start: 3870, count: 630, step: 70, parents: creatureBodies, name: "生物结构", itemType: "动物" as const },
  { start: 3510, count: 360, step: 40, parents: landscapeForms, name: "自然地景", itemType: "构件" as const },
  { start: 4500, count: 18, step: 1, parents: specialLandforms, name: "特别地景", itemType: "构件" as const },
];

function natureName(design: number) {
  if (design < 900) return `${treeBodies[Math.floor(design / 100)]}·${3 + Math.floor(design / 10) % 10}枝·${treeCrowns[design % 10]}`;
  if (design < 1620) { const local = design - 900; return `${flowerForms[Math.floor(local / 90)]}·${1 + Math.floor(local / 10) % 9}株·${2 + local % 10}节叶`; }
  if (design < 2250) { const local = design - 1620; return `${rockLayouts[Math.floor(local / 70)]}·${3 + Math.floor(local / 10) % 7}主块·${rockForms[local % 10]}`; }
  if (design < 2670) { const local = design - 2250; return `${cactusForms[Math.floor(local / 60)]}·${1 + Math.floor(local / 10) % 6}侧枝·${1 + local % 10}刺座`; }
  if (design < 3090) { const local = design - 2670; return `${mushroomForms[Math.floor(local / 60)]}·${mushroomStems[Math.floor(local / 10) % 6]}·${1 + local % 10}株`; }
  if (design < 3510) { const local = design - 3090; return `${coralForms[Math.floor(local / 60)]}·${3 + Math.floor(local / 10) % 6}主枝·${1 + local % 10}枝梢`; }
  if (design < 3870) { const local = design - 3510; return `${landscapeForms[Math.floor(local / 40)]}·${2 + Math.floor(local / 8) % 5}节点·${3 + local % 8}伴生器官`; }
  if (design < 4500) { const local = design - 3870; return `${creatureBodies[Math.floor(local / 70)]}·${creatureLimbs[Math.floor(local / 10) % 7]}·${creatureHeads[local % 10]}`; }
  return specialLandforms[design - 4500]!;
}

export function createNatureModel(design: number): ModelDefinition {
  if (!Number.isInteger(design) || design < 0 || design >= 4518) throw new Error("自然结构设计编号须为0～4517");
  const parts = design < 900 ? createNatureTree(design) : design < 1620 ? createNatureFlowers(design - 900) : design < 2250 ? createNatureRocks(design - 1620) : design < 2670 ? createNatureCactus(design - 2250) : design < 3090 ? createNatureMushrooms(design - 2670) : design < 3510 ? createNatureCoral(design - 3090) : design < 3870 ? createNatureLandscape(design - 3510) : design < 4500 ? createNatureCreature(design - 3870) : createNatureSpecial(design - 4500);
  return { name: natureName(design), parts: groundParts(parts) };
}

// 83个具名父素材与其款式共4518条；款式数量不作为独立主素材数量。
export const natureAssets: SceneAsset[] = [];
for (let row = 0; row < 900; row++) for (const family of natureFamilies) if (row < family.count) {
  const design = family.start + row;
  const parentIndex = Math.floor(row / family.step);
  const baseDesign = family.start + parentIndex * family.step;
  natureAssets.push({ id: `nature${design}`, name: design === baseDesign ? family.parents[parentIndex]! : natureName(design), category: "自然", itemType: family.itemType, tags: ["原创结构设计", family.name], kind: "model", normalize: false, license: "内置原创程序化模型", blueprint: { pack: "nature", design, revision: 1 }, ...(design === baseDesign ? {} : { variantOf: `nature${baseDesign}` }) });
}
