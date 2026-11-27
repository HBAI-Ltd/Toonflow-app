import type { SceneAsset, AssetItemType, AssetTheme } from "./sceneDocument";
import type { ModelDefinition } from "./modelGeometry";
import type { ModelPart } from "./assetModelParts";
import { finishObjectModel, objectCode } from "./objectModelParts";
import { furnitureNames, createFurniture } from "./objectFurniture";
import { transportNames, createTransport } from "./objectTransport";
import { toolNames, createTools } from "./objectTools";
import { lightingNames, createLighting } from "./objectLighting";
import { electronicsNames, createElectronics } from "./objectElectronics";
import { industrialNames, createIndustrial } from "./objectIndustrial";
import { civicNames, createCivic } from "./objectCivic";
import { vesselNames, createVessels } from "./objectVessels";
import { weaponNames, createWeapons } from "./objectWeapons";
import { arcaneNames, createArcane } from "./objectArcane";

type ObjectPack = { names: string[]; itemType: AssetItemType; theme: AssetTheme; frames: string[]; layouts: string[]; joints: [string, string]; create: (kind: number, design: number) => ModelPart[] };
const packs: ObjectPack[] = [
  { names: furnitureNames, itemType: "家具", theme: "现代", frames: ["四足分立", "门式承重", "双板承重", "中柱放射", "后脊悬臂"], layouts: ["直列", "双区", "转角分区", "阶梯分层"], joints: ["横梁连接", "交叉撑接"], create: createFurniture },
  { names: transportNames, itemType: "交通", theme: "现代", frames: ["简式骨架", "双重承载", "多段承载", "连续分载", "分体承载"], layouts: ["前置功能舱", "对置功能舱", "多舱分列", "交错双舱"], joints: ["纵梁结构", "斜梁结构"], create: createTransport },
  { names: toolNames, itemType: "器物", theme: "现代", frames: ["直杆握持", "曲柄传力", "双柄联动", "T柄施力", "闭环握持"], layouts: ["单头", "并置双头", "三联作业头", "错层作业头"], joints: ["护档锁固", "拉杆传力"], create: createTools },
  { names: lightingNames, itemType: "灯具", theme: "现代", frames: ["中柱支承", "双脊支承", "悬臂支承", "三脚支承", "门架支承"], layouts: ["单光区", "双光区", "三向光区", "四向光区"], joints: ["直臂连接", "折臂连接"], create: createLighting },
  { names: electronicsNames, itemType: "电子设备", theme: "现代", frames: ["四柱机架", "侧梁机架", "侧板机架", "中柱机架", "后脊机架"], layouts: ["单机舱", "双层机舱", "三级机舱", "并列机舱"], joints: ["贯通框架", "斜撑框架"], create: createElectronics },
  { names: industrialNames, itemType: "设施", theme: "现代", frames: ["四点承重", "门架承重", "板架承重", "中柱承重", "悬臂承重"], layouts: ["单工位", "双工位", "三工位", "四工位交错"], joints: ["贯通机梁", "交叉机梁"], create: createIndustrial },
  { names: civicNames, itemType: "设施", theme: "现代", frames: ["独立立足", "门式立足", "侧板立足", "放射立足", "后脊立足"], layouts: ["单服务区", "双服务区", "三服务区", "交错四区"], joints: ["横向连接", "斜向连接"], create: createCivic },
  { names: vesselNames, itemType: "器物", theme: "异域", frames: ["平足", "三足", "高脚", "开放托架", "滑轨托架"], layouts: ["圆肩器身", "收腰器身", "束颈器身", "折肩器身"], joints: ["直耳连接", "弧耳连接"], create: createVessels },
  { names: weaponNames, itemType: "器物", theme: "奇幻", frames: ["直列骨架", "曲折骨架", "弧形骨架", "双脊骨架", "分节骨架"], layouts: ["单功能头", "并联功能头", "三联功能头", "阶梯功能头"], joints: ["平面连接", "空间连接"], create: createWeapons },
  { names: arcaneNames, itemType: "设施", theme: "科幻", frames: ["四点基架", "门式基架", "双板基架", "中柱基架", "悬臂基架"], layouts: ["单核心", "双核心", "三核心", "四核交错"], joints: ["横梁连接", "斜梁连接"], create: createArcane },
];

export function getObjectNameParts(design: number): [string, string, string, string] | undefined {
  if (!Number.isInteger(design) || design < 0 || design >= 8000) return;
  const pack = packs[Math.floor(design / 800)]!, family = Math.floor(design % 800 / 40), code = objectCode(design % 40);
  return [pack.names[family]!, pack.frames[code.frame]!, pack.layouts[code.layout]!, pack.joints[code.joint]!];
}

function objectName(design: number) {
  const [name, frame, layout, joint] = getObjectNameParts(design)!;
  return `${name}·${frame}${layout}${joint}`;
}

// 200个独立用途父项与7800个结构配置子项按设计序交错；子项不能计入独立主素材数量。
export const objectAssets: SceneAsset[] = Array.from({ length: 8000 }, (_, index) => {
  const family = index % 200, design = Math.floor(family / 20) * 800 + family % 20 * 40 + Math.floor(index / 200), pack = packs[Math.floor(design / 800)]!;
  const parentDesign = Math.floor(design / 40) * 40;
  return { id: `objectDesign${String(design).padStart(4, "0")}`, name: design === parentDesign ? pack.names[Math.floor(design % 800 / 40)]! : objectName(design), category: "道具", itemType: pack.itemType, theme: pack.theme, kind: "model", normalize: false, license: "内置原创程序化模型", blueprint: { pack: "objects", design, revision: 1 }, ...(design !== parentDesign ? { variantOf: `objectDesign${String(parentDesign).padStart(4, "0")}` } : {}) };
});

export function createObjectModel(design: number): ModelDefinition {
  if (!Number.isInteger(design) || design < 0 || design >= 8000) throw new Error("本地道具设计编号无效");
  const pack = packs[Math.floor(design / 800)]!;
  return finishObjectModel(objectName(design), pack.create(Math.floor(design % 800 / 40), design % 40));
}
