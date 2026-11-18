import { Box3, Vector3 } from "three";
import { part, beam, type ModelPart } from "./assetModelParts";
import { getAssetItemType } from "./assetMetadata";
import { createModelGroup, type ModelDefinition } from "./modelGeometry";
import { disposeObject } from "./sceneResources";
import type { SceneAsset } from "./sceneDocument";

const boundsCache = new WeakMap<ModelDefinition, Box3>();

function modelBounds(model: ModelDefinition) {
  const cached = boundsCache.get(model);
  if (cached) return cached;
  const group = createModelGroup(model);
  try {
    const bounds = new Box3().setFromObject(group, true);
    boundsCache.set(model, bounds);
    return bounds;
  } finally { disposeObject(group); }
}

function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, value)); }

export function createParametricAssetModel(asset: SceneAsset, variant: number): ModelDefinition {
  if (!Number.isInteger(variant) || variant < 0 || variant > 26) throw new Error("素材款式必须是 0 到 26 的整数");
  if (!asset.model) throw new Error("配件款式需要原始素材的模型定义");
  const model = structuredClone(asset.model);
  if (variant === 0) return model;
  const bounds = modelBounds(asset.model);
  const size = bounds.getSize(new Vector3());
  const center = bounds.getCenter(new Vector3());
  const w = Math.max(size.x, 0.04), h = Math.max(size.y, 0.04), d = Math.max(size.z, 0.04);
  const unit = clamp(Math.max(w, h, d) * 0.16, 0.08, 2);
  const thick = clamp(Math.min(w, h, d) * 0.1, 0.012, 0.15);
  const ground = bounds.min.y;
  const top = bounds.max.y;
  const front = bounds.max.z;
  const back = bounds.min.z;
  const left = bounds.min.x;
  const right = bounds.max.x;
  const color = model.parts[0]?.color ?? "#89958c";
  const frame = /蒸汽/.test(asset.theme ?? "") ? "#9b8057" : /赛博|科幻/.test(asset.theme ?? "") ? "#617e8a" : "#837965";
  const panel = "#b8beb0";
  const a = variant % 3, b = Math.floor(variant / 3) % 3, c = Math.floor(variant / 9) % 3;
  const modules: ModelPart[] = [];
  const box = (name: string, material: string, x: number, y: number, z: number, width: number, height: number, depth: number) => part(name, "box", material, [x, y, z], [width, height, depth]);
  const itemType = getAssetItemType(asset);

  if (itemType === "建筑") {
    const porchWidth = clamp(w * 0.58, 0.3, 4), porchDepth = clamp(d * 0.3, 0.18, 2.5), porchHeight = clamp(h * 0.45, 0.3, 3.2);
    if (a === 1) {
      modules.push(box("款式A门廊地台", frame, center.x, ground + thick / 2, front + porchDepth / 2, porchWidth, thick, porchDepth));
      for (const side of [-1, 1]) modules.push(box("款式A门廊立柱", frame, center.x + side * porchWidth * 0.44, ground + porchHeight / 2, front + porchDepth * 0.85, thick, porchHeight, thick));
      modules.push(box("款式A门廊顶棚", color, center.x, ground + porchHeight, front + porchDepth / 2, porchWidth + thick * 2, thick, porchDepth + thick));
    } else if (a === 2) {
      modules.push(box("款式A悬挑雨篷", frame, center.x, ground + porchHeight, front + porchDepth / 2, porchWidth, thick, porchDepth));
      for (const side of [-1, 1]) modules.push(beam("款式A雨篷斜撑", frame, [center.x + side * porchWidth * 0.4, ground + porchHeight * 0.62, front], [center.x + side * porchWidth * 0.4, ground + porchHeight, front + porchDepth * 0.85], thick * 0.7));
    }
    if (b === 1) {
      const wingWidth = clamp(w * 0.25, 0.2, 3), wingHeight = clamp(h * 0.42, 0.25, 4);
      modules.push(box("款式B侧翼房间", color, right + wingWidth / 2, ground + wingHeight / 2, center.z, wingWidth, wingHeight, Math.max(d * 0.7, thick)));
      modules.push(box("款式B侧翼屋檐", frame, right + wingWidth / 2, ground + wingHeight, center.z, wingWidth + thick * 2, thick, Math.max(d * 0.7 + thick * 2, thick)));
      modules.push(box("款式B侧翼窗", panel, right + wingWidth / 2, ground + wingHeight * 0.65, center.z + d * 0.35 + thick, wingWidth * 0.6, wingHeight * 0.35, thick));
    } else if (b === 2) {
      for (const z of [center.z - d * 0.3, center.z + d * 0.3]) modules.push(beam("款式B外倾扶壁", frame, [left - unit * 0.45, ground + thick / 2, z], [left, ground + h * 0.67, z], thick * 1.4, unit * 0.35));
    }
    if (c === 1) {
      modules.push(box("款式C屋顶烟囱", frame, center.x, top + unit * 0.35, center.z, unit * 0.4, unit * 0.7, unit * 0.4));
      modules.push(box("款式C烟囱帽", color, center.x, top + unit * 0.75, center.z, unit * 0.6, unit * 0.12, unit * 0.6));
    } else if (c === 2) {
      modules.push(box("款式C屋顶采光阁", frame, center.x, top + unit * 0.3, center.z, Math.max(w * 0.32, unit), unit * 0.6, Math.max(d * 0.32, unit)));
      modules.push(box("款式C采光阁正窗", panel, center.x, top + unit * 0.3, center.z + Math.max(d * 0.32, unit) / 2 + thick / 2, Math.max(w * 0.25, unit * 0.7), unit * 0.4, thick));
      modules.push(box("款式C采光阁顶板", color, center.x, top + unit * 0.65, center.z, Math.max(w * 0.36, unit * 1.1), thick, Math.max(d * 0.36, unit * 1.1)));
    }
  } else if (itemType === "交通") {
    const watercraft = /船|舟|筏|艇/.test(asset.name) && !/飞艇|飞船|飞行|无人机|旋翼/.test(asset.name);
    const aircraft = /飞艇|飞船|飞行|无人机|旋翼|机甲/.test(asset.name);
    // ACT: 配件仅按局部包围盒附着；帆船包围盒包含桅杆，甲板用下部高度估计，不宣称贴合任意曲面或物理装配。
    const deck = watercraft ? ground + clamp(h * 0.18, 0.08, 1.2) : aircraft ? ground + h * 0.65 : top;
    if (a === 1) {
      const y = watercraft ? deck + unit * 0.15 : ground + h * 0.3;
      modules.push(box("款式A前置护杠", frame, center.x, y, front + unit * 0.15, w * 0.85, thick, unit * 0.15));
      for (const side of [-1, 1]) modules.push(box("款式A护杠支架", frame, center.x + side * w * 0.33, y, front + unit * 0.05, thick, unit * 0.25, unit * 0.25));
    } else if (a === 2) {
      modules.push(box("款式A后置货台", frame, center.x, watercraft ? deck : ground + h * 0.35, back - unit * 0.35, w * 0.85, thick, unit * 0.7));
      for (const side of [-1, 1]) modules.push(box("款式A独立货箱", panel, center.x + side * w * 0.2, (watercraft ? deck : ground + h * 0.35) + unit * 0.24, back - unit * 0.35, w * 0.33, unit * 0.4, unit * 0.5));
    }
    if (b === 1 && watercraft) {
      for (const side of [-1, 1]) {
        modules.push(part("款式B侧置浮筒", "capsule", frame, [center.x + side * (w / 2 + unit * 0.5), ground + unit * 0.18, center.z], [unit * 0.3, d * 0.65, unit * 0.3], [90, 0, 0]));
        modules.push(box("款式B浮筒横梁", frame, center.x + side * w * 0.4, deck, center.z, w * 0.4 + unit, thick, thick));
      }
    } else if (b === 1) {
      for (const z of [center.z - d * 0.22, center.z + d * 0.22]) modules.push(box("款式B行李架横杆", frame, center.x, deck + unit * 0.15, z, w * 0.75, thick, thick));
      for (const side of [-1, 1]) modules.push(box("款式B行李架边梁", frame, center.x + side * w * 0.37, deck + unit * 0.15, center.z, thick, thick, d * 0.5));
    } else if (b === 2) {
      for (const side of [-1, 1]) modules.push(box(watercraft ? "款式B甲板边座" : "款式B侧挂工具舱", color, center.x + side * (w / 2 + unit * 0.15), watercraft ? deck : ground + h * 0.55, center.z, unit * 0.3, unit * 0.45, d * 0.42));
    }
    if (c === 1) {
      const mastHeight = clamp(h * 0.35, unit * 0.6, 2);
      modules.push(part(watercraft ? "款式C附加桅杆" : "款式C通讯天线", "cylinder", frame, [center.x, deck + mastHeight / 2, center.z], [thick * 0.5, mastHeight, thick * 0.5]));
      modules.push(box("款式C横向接收杆", frame, center.x, deck + mastHeight * 0.8, center.z, unit * 0.7, thick * 0.45, thick * 0.45));
    } else if (c === 2) {
      const y = deck + unit * 0.55;
      modules.push(box("款式C顶置遮篷", panel, center.x, y, center.z, w * 0.82, thick, d * 0.38));
      for (const side of [-1, 1]) modules.push(box("款式C遮篷立撑", frame, center.x + side * w * 0.36, deck + unit * 0.27, center.z, thick * 0.6, unit * 0.55, thick * 0.6));
    }
  } else if (itemType === "家具") {
    if (a === 1) {
      modules.push(box("款式A侧置收纳柜", color, right + unit * 0.4, ground + unit * 0.5, center.z, unit * 0.8, unit, Math.max(d * 0.7, unit * 0.6)));
      modules.push(box("款式A收纳柜门", panel, right + unit * 0.4, ground + unit * 0.5, center.z + Math.max(d * 0.7, unit * 0.6) / 2 + thick / 2, unit * 0.65, unit * 0.8, thick));
    } else if (a === 2) {
      modules.push(box("款式A前置脚踏板", color, center.x, ground + unit * 0.4, front + unit * 0.4, w * 0.72, thick, unit * 0.65));
      for (const side of [-1, 1]) modules.push(box("款式A脚踏撑", frame, center.x + side * w * 0.27, ground + unit * 0.2, front + unit * 0.4, thick, unit * 0.4, thick));
    }
    if (b === 1) {
      for (const side of [-1, 1]) modules.push(box("款式B侧扶手", frame, center.x + side * (w / 2 + thick), ground + h * 0.65, center.z, thick * 1.5, thick * 1.5, Math.max(d * 0.65, thick)));
    } else if (b === 2) {
      modules.push(box("款式B抽屉箱体", frame, left - unit * 0.3, ground + h * 0.35, center.z, unit * 0.6, h * 0.55, d * 0.7));
      for (let index = 0; index < 3; index++) modules.push(box("款式B抽屉面板", color, left - unit * 0.3, ground + h * (0.18 + index * 0.16), center.z + d * 0.35 + thick / 2, unit * 0.5, h * 0.13, thick));
    }
    if (c === 1) {
      for (const z of [center.z - d * 0.22, center.z + d * 0.22]) modules.push(box("款式C下部加强横撑", frame, center.x, ground + h * 0.18, z, w * 1.08, thick, thick));
    } else if (c === 2) {
      for (const side of [-1, 1]) modules.push(box("款式C背部置物架立柱", frame, center.x + side * w * 0.42, top + unit * 0.25, back - unit * 0.15, thick, unit * 0.5, thick));
      modules.push(box("款式C背部置物层板", color, center.x, top + unit * 0.53, back - unit * 0.15, w * 0.95, thick, unit * 0.5));
    }
  } else if (itemType === "灯具") {
    if (a === 1) modules.push(part("款式A加厚圆形灯座", "cylinder", frame, [center.x, ground - unit * 0.1, center.z], [Math.max(w * 1.08, unit), unit * 0.2, Math.max(d * 1.08, unit)]));
    else if (a === 2) for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; modules.push(beam("款式A三脚灯座", frame, [center.x, ground + unit * 0.35, center.z], [center.x + Math.cos(angle) * unit * 0.7, ground - unit * 0.08, center.z + Math.sin(angle) * unit * 0.7], thick)); }
    if (b === 1) for (let index = 0; index < 4; index++) { const angle = index * Math.PI / 2 + Math.PI / 4; modules.push(box("款式B外置防护格", frame, center.x + Math.cos(angle) * w * 0.72, center.y, center.z + Math.sin(angle) * d * 0.72, thick * 0.55, h * 0.95, thick * 0.55)); }
    else if (b === 2) modules.push(part("款式B透明防护罩", "sphere", panel, [center.x, center.y, center.z], [w * 1.12, h * 1.12, d * 1.12], [0, 0, 0], { opacity: 0.16, roughness: 0.2 }));
    if (c === 1) {
      modules.push(box("款式C侧挂灯架", frame, right + unit * 0.35, center.y, center.z, unit * 0.7, thick, thick));
      modules.push(box("款式C灯架壁板", frame, right + unit * 0.7, center.y, center.z, thick, unit * 0.65, unit * 0.4));
    } else if (c === 2) {
      modules.push(part("款式C顶部遮雨帽", "cone", frame, [center.x, top + unit * 0.15, center.z], [w * 1.2, unit * 0.25, d * 1.2]));
      modules.push(part("款式C帽顶饰球", "sphere", color, [center.x, top + unit * 0.33, center.z], [unit * 0.12, unit * 0.12, unit * 0.12]));
    }
  } else if (itemType === "植物") {
    if (a === 1) {
      modules.push(part("款式A圆形种植盆", "cylinder", frame, [center.x, ground - unit * 0.14, center.z], [Math.max(w * 0.45, unit), unit * 0.28, Math.max(d * 0.45, unit)]));
      modules.push(part("款式A盆口托盘", "cylinder", color, [center.x, ground - unit * 0.28, center.z], [Math.max(w * 0.5, unit * 1.1), thick, Math.max(d * 0.5, unit * 1.1)]));
    } else if (a === 2) {
      modules.push(box("款式A方形生态花床", frame, center.x, ground - unit * 0.18, center.z, Math.max(w * 0.8, unit), unit * 0.36, Math.max(d * 0.8, unit)));
      modules.push(box("款式A花床土面", "#7b6b50", center.x, ground - thick / 2, center.z, Math.max(w * 0.76, unit * 0.9), thick, Math.max(d * 0.76, unit * 0.9)));
    }
    if (b === 1) {
      modules.push(beam("款式B伴生侧枝", frame, [right, ground + h * 0.35, center.z], [right + unit * 0.5, ground + h * 0.58, center.z], thick * 0.5));
      modules.push(part("款式B侧枝叶簇", "sphere", "#789465", [right + unit * 0.5, ground + h * 0.62, center.z], [unit * 0.9, unit * 0.7, unit * 0.8]));
    } else if (b === 2) for (const z of [center.z - unit * 0.35, center.z + unit * 0.35]) modules.push(part("款式B伴生灌丛", "sphere", "#71885d", [left - unit * 0.35, ground + unit * 0.25, z], [unit * 0.7, unit * 0.5, unit * 0.7]));
    if (c === 1) {
      for (const side of [-1, 1]) modules.push(box("款式C栽培支架立柱", frame, center.x + side * w * 0.42, ground + h * 0.6, back - unit * 0.15, thick, h * 1.2, thick));
      modules.push(box("款式C栽培支架顶梁", frame, center.x, ground + h * 1.2, back - unit * 0.15, w * 0.9, thick, thick));
    } else if (c === 2) {
      modules.push(beam("款式C顶部分叉", frame, [center.x, top - unit * 0.2, center.z], [center.x - unit * 0.3, top + unit * 0.25, center.z], thick * 0.5));
      modules.push(part("款式C新增顶冠", "sphere", "#8a9e70", [center.x - unit * 0.3, top + unit * 0.3, center.z], [unit * 0.65, unit * 0.5, unit * 0.6]));
    }
  } else if (itemType === "岩石") {
    if (a === 1) for (const side of [-1, 1]) modules.push(part("款式A伴生岩块", "sphere", color, [center.x + side * (w / 2 + unit * 0.25), ground + unit * 0.25, front], [unit * 0.8, unit * 0.5, unit * 0.65], [0, side * 25, side * 12]));
    else if (a === 2) for (let index = 0; index < 3; index++) modules.push(box("款式A片状层岩", frame, center.x, ground + unit * (0.08 + index * 0.1), back - unit * 0.45, w * (0.65 - index * 0.1), unit * 0.1, unit * 0.7));
    if (b === 1) modules.push(part("款式B角锥岩脊", "cone", color, [left - unit * 0.2, ground + h * 0.35, center.z], [unit * 0.7, h * 0.7, unit * 0.8]));
    else if (b === 2) for (let index = 0; index < 2; index++) modules.push(box("款式B叠置岩柱", color, right + unit * 0.25, ground + unit * (0.2 + index * 0.38), center.z, unit * 0.55, unit * 0.4, unit * 0.55));
    if (c === 1) modules.push(part("款式C附生石笋", "cone", frame, [center.x, top + unit * 0.3, center.z], [unit * 0.4, unit * 0.6, unit * 0.4]));
    else if (c === 2) modules.push(box("款式C外露岩面", panel, center.x, ground + h * 0.55, front + unit * 0.07, w * 0.65, h * 0.5, unit * 0.14), box("款式C岩面底层", frame, center.x, ground + h * 0.2, front + unit * 0.14, w * 0.8, unit * 0.15, unit * 0.28));
  } else if (itemType === "设施") {
    if (a === 1) {
      modules.push(box("款式A外置控制柜", frame, right + unit * 0.35, ground + h * 0.4, center.z, unit * 0.7, h * 0.55, Math.max(d * 0.6, unit * 0.6)));
      modules.push(box("款式A控制柜面板", panel, right + unit * 0.35, ground + h * 0.48, center.z + Math.max(d * 0.6, unit * 0.6) / 2 + thick / 2, unit * 0.48, h * 0.2, thick));
    } else if (a === 2) {
      modules.push(part("款式A侧置储液罐", "cylinder", frame, [left - unit * 0.3, ground + h * 0.36, center.z], [unit * 0.6, h * 0.72, unit * 0.6]));
      modules.push(box("款式A储液罐支座", color, left - unit * 0.3, ground + thick / 2, center.z, unit * 0.8, thick, unit * 0.8));
    }
    if (b === 1) for (const side of [-1, 1]) modules.push(part("款式B外接管线", "tube", frame, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: thick * 0.4, path: [{ x: center.x + side * w * 0.3, y: ground + h * 0.3, z: front }, { x: center.x + side * w * 0.3, y: ground + h * 0.3, z: front + unit * 0.3 }, { x: center.x + side * w * 0.3, y: ground + h * 0.75, z: front + unit * 0.3 }, { x: center.x + side * w * 0.3, y: ground + h * 0.75, z: front }] }));
    else if (b === 2) for (let index = 0; index < 4; index++) modules.push(box("款式B外置散热片", frame, center.x, ground + h * (0.25 + index * 0.14), front + unit * 0.15, w * 0.7, thick * 0.7, unit * 0.3));
    if (c === 1) {
      modules.push(box("款式C顶部防雨盖", panel, center.x, top + unit * 0.2, center.z, w * 1.1, thick, d * 1.1));
      for (const side of [-1, 1]) modules.push(box("款式C盖板支座", frame, center.x + side * w * 0.35, top + unit * 0.1, center.z, thick, unit * 0.2, thick));
    } else if (c === 2) {
      modules.push(part("款式C设备天线", "cylinder", frame, [center.x, top + unit * 0.35, center.z], [thick * 0.5, unit * 0.7, thick * 0.5]));
      modules.push(box("款式C设备信号盒", color, center.x, top + unit * 0.68, center.z, unit * 0.28, unit * 0.16, unit * 0.18));
    }
  } else {
    if (a === 1) {
      modules.push(box("款式A陈列背板", frame, center.x, center.y, back - thick, w * 1.15, h * 1.1, thick));
      for (const side of [-1, 1]) modules.push(box("款式A展示托足", frame, center.x + side * w * 0.38, ground - thick, center.z, thick * 1.5, thick * 2, d * 1.15));
    } else if (a === 2) {
      modules.push(box("款式A展示基台", frame, center.x, ground - unit * 0.12, center.z, w * 1.2, unit * 0.24, d * 1.2));
      modules.push(box("款式A基台铭牌", panel, center.x, ground - unit * 0.12, front + d * 0.1 + thick, w * 0.45, unit * 0.13, thick));
    }
    if (b === 1) {
      modules.push(box("款式B侧部附件托盘", color, left - unit * 0.3, ground + h * 0.25, center.z, unit * 0.6, thick, Math.max(d * 0.65, unit * 0.4)));
      modules.push(box("款式B托盘支撑", frame, left - unit * 0.3, ground + h * 0.12, center.z, thick, h * 0.25, thick));
    } else if (b === 2) {
      for (const side of [-1, 1]) modules.push(box("款式B开放展示框立柱", frame, center.x + side * w * 0.6, center.y, front + thick, thick, h * 1.15, thick));
      for (const y of [ground, top]) modules.push(box("款式B开放展示框横梁", frame, center.x, y, front + thick, w * 1.25, thick, thick));
    }
    if (c === 1) {
      modules.push(box("款式C铭牌立柱", frame, right + unit * 0.28, ground + h * 0.55, center.z, thick, h * 1.1, thick));
      modules.push(box("款式C附属信息板", panel, right + unit * 0.28, top + unit * 0.1, center.z, unit * 0.5, unit * 0.3, thick));
    } else if (c === 2) {
      for (const side of [-1, 1]) modules.push(box("款式C上部陈列架撑", frame, center.x + side * w * 0.38, top + unit * 0.2, center.z, thick, unit * 0.4, thick));
      modules.push(box("款式C上部陈列层板", color, center.x, top + unit * 0.43, center.z, w * 1.05, thick, d * 0.7));
    }
  }
  if (model.parts.length + modules.length > 112) throw new Error("素材款式超出 112 个部件，无法为状态变化预留空间");
  model.parts.push(...modules);
  return model;
}
