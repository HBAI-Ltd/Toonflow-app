import { part, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { halfRoundWall } from "./spatialShells";
import { box, cylinder, design } from "./structures";

const paving = "#aeb5a9", asphalt = "#626f70", wall = "#c7bda4", roof = "#9daaa0", glass = "#a3c4c2", timber = "#94785c";

export const modernCommercialSpaceBatchOneDesigns = [design(
  "弧厅双窗环道取餐馆",
  "西侧半圆玻璃餐厅与东侧长后厨连成整体，汽车环路沿厨房两扇取餐窗行进，低檐车棚罩住窗口车道，西侧步行平台和前场停车位与双窗车道分开布置",
  () => driveThroughRestaurant(), "建筑", "现代",
)];

function roundedRect(x0: number, x1: number, z0: number, z1: number, radius: number): [number, number][] {
  return [[x1 - radius, z0 + radius, -90], [x1 - radius, z1 - radius, 0], [x0 + radius, z1 - radius, 90], [x0 + radius, z0 + radius, 180]].flatMap(([x, z, start]) => Array.from({ length: 5 }, (_, index) => { const angle = (start! + index * 22.5) * Math.PI / 180; return [x! + Math.cos(angle) * radius, z! + Math.sin(angle) * radius] as [number, number]; }));
}

export function slab(name: string, color: string, outline: [number, number][], height: number, position: Triple, holes: [number, number][][] = []): ModelPart {
  const value = polygon(name, color, outline, height, position, holes);
  value.vertices = value.indices!.map(index => value.vertices![index]!);
  value.indices = value.vertices.map((_, index) => index);
  return value;
}

function driveThroughRestaurant(): ModelPart[] {
  const diningOutline: [number, number][] = Array.from({ length: 17 }, (_, index) => { const angle = Math.PI / 2 + index * Math.PI / 16; return [-2.5 + Math.cos(angle) * 6, Math.sin(angle) * 6]; });
  const parts: ModelPart[] = [
    box("餐馆环路停车与步行区完整场坪", 0, 0.1, 0, 42, 0.2, 38, paving),
    slab("沿双窗外侧连续回转的四米宽沥青车道", asphalt, roundedRect(-18, 12.5, -13, 13, 8), 0.045, [0, 0.2, 0], [roundedRect(-14, 8.5, -9, 9, 4)]),
    box("前场向外道路敞开的汽车进出连接道", 3, 0.2225, -16, 4, 0.045, 6, asphalt),
    box("从西侧人行入口连到餐厅门口的平台", -10.2, 0.3, 0, 3.4, 0.2, 3, paving),
    box("后厨与服务前厅的连续建筑楼面", 2.5, 0.3, 0, 10, 0.2, 12, paving),
    slab("面向弧玻璃外墙的半圆餐厅楼面", paving, diningOutline, 0.2, [0, 0.2, 0]),
    slab("沿半圆餐厅外廓延展的平屋盖", roof, diningOutline, 0.16, [0, 3.9, 0]),
    box("连接长后厨与餐厅屋盖的平顶", 2.5, 3.98, 0, 10.4, 0.16, 12.4, roof),
    box("后厨北侧完整封闭墙", 2.5, 2.15, 6, 10, 3.5, 0.18, wall),
    box("步行前门左侧窄墙垛", -2.35, 2.15, -6, 0.3, 3.5, 0.18, wall),
    box("步行前门右侧厨房封闭墙", 3.35, 2.15, -6, 8.3, 3.5, 0.18, wall),
    box("步行前门上方不封堵门口的门楣", -1.5, 3.3, -6, 1.4, 1.2, 0.18, wall),
    box("两取餐窗下方连续矮墙", 7.5, 0.95, 0, 0.18, 1.1, 12, wall),
    box("两取餐窗上方连续承屋墙", 7.5, 3.25, 0, 0.18, 1.3, 12, wall),
    box("收银窗前端墙垛", 7.5, 2.05, -5.2, 0.18, 1.1, 1.6, wall),
    box("两扇独立取餐窗之间墙垛", 7.5, 2.05, -1.45, 0.18, 1.1, 2.3, wall),
    box("取餐窗后端完整墙垛", 7.5, 2.05, 3.95, 0.18, 1.1, 4.1, wall),
    box("服务前厅与后厨之间的内隔墙", 1.5, 2.15, 0, 0.14, 3.5, 9.2, wall),
    box("前厅面向餐厅的点餐台", 0.65, 0.95, 1.8, 1, 1.1, 5.5, timber),
    box("后厨连续操作台", 5.6, 0.95, 3.8, 3.3, 1.1, 1.1, timber),
    box("后厨另一侧独立备餐台", 3.5, 0.95, -3.8, 2.7, 1.1, 1.1, timber),
  ];
  for (const [z, length] of [[-3.5, 1.8], [0.8, 2.2]]) parts.push(
    part("真实墙口中的透明取餐窗", "box", glass, [7.5, 2.05, z!], [0.03, 1.1, length!], [0, 0, 0], { opacity: 0.25, roughness: 0.22 }),
    box("取餐窗伸向车道的交付台面", 7.85, 1.48, z!, 0.85, 0.08, length! + 0.15, timber),
  );
  for (const [start, span] of [[90, 63], [207, 63]]) {
    const value = halfRoundWall("半圆餐厅保留西侧人行门口的曲玻璃外壁", 6, 0.065, 3.5, [-2.5, 0.4, 0], -start!, glass, span! * Math.PI / 180);
    value.opacity = 0.32; value.roughness = 0.2; parts.push(value);
  }
  for (const angle of [90, 153, 207, 270]) {
    const a = angle * Math.PI / 180;
    parts.push(cylinder("半圆餐厅门边与玻璃端部承屋柱", -2.5 + Math.cos(a) * 6, 2.15, Math.sin(a) * 6, 0.13, 3.5, timber));
  }
  parts.push(box("沿汽车取餐双窗伸出的低檐雨棚", 10, 3.08, 0, 4.1, 0.16, 10.5, roof));
  for (const z of [-4, 4]) parts.push(cylinder("车道外侧避开汽车行进面的雨棚立柱", 11.9, 1.6, z, 0.18, 2.8, timber), box("把车道雨棚接回窗口墙面的横梁", 9.8, 2.94, z, 4.7, 0.12, 0.18, timber));
  for (const z of [-3, 0, 3]) parts.push(
    box("弧厅内沿墙设置的连座坐台", -4.2, 0.65, z, 0.65, 0.5, 1.8, timber),
    box("连座后方接到坐台的竖直软背", -3.85, 1.2, z, 0.15, 1, 1.8, timber),
    box("餐厅小桌平整桌面", -5.5, 1.1, z, 1.1, 0.12, 1.2, timber),
    cylinder("桌面下实际承托的单柱", -5.5, 0.75, z, 0.1, 0.7, timber),
    cylinder("餐桌落在楼面上的宽底盘", -5.5, 0.43, z, 0.5, 0.06, timber),
  );
  for (let index = 0; index < 6; index++) parts.push(box("前场停车位之间的地面分界线", -12 + index * 2.5, 0.208, -16, 0.06, 0.016, 5, "#d5d5bb"));
  parts.push(box("停车列靠环路侧的横向止位线", -5.75, 0.208, -13.5, 12.6, 0.016, 0.06, "#d5d5bb"));
  return parts;
}
