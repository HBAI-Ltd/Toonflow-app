import { part, ring, type ModelPart } from "../assetModelParts";
import { box, colors, cylinder, design, pipe, rail } from "./structures";

// 通航机构类型参考 VNF 与 Scottish Canals，形体为原创简化，不复制地标外观或精确规格。
// https://www.vnf.fr/vnf/points-d-interetss/le-plan-incline-de-saint-louis-arzviller/
// https://www.scottishcanals.co.uk/boating/canal-travel/union-canal-skippers-guide/maps/voyaging-through-the-falkirk-wheel
// 固定挖入式干坞与浮坞的实体边界参考 https://www.osha.gov/ship-building-repair/dry-docking
const steel = "#839a98", dark = "#546a6b";

function waterCaisson(name: string, floor: number, width: number, length: number): ModelPart[] {
  return [box(`${name}真正承水底板`, 0, floor + .15, 0, width, .3, length, steel), ...[-1, 1].map(s => box(`${name}两侧连续止水壁`, s * (width / 2 - .15), floor + 1.4, 0, .3, 2.2, length, steel)), ...[-1, 1].map(s => box(`${name}两端封闭止水门`, 0, floor + 1.4, s * (length / 2 - .15), width - .6, 2.2, .3, steel)), box(`${name}内部静态承船水面`, 0, floor + 1.73, 0, width - .65, .035, length - .65, colors.water)];
}

export const landscapeSpaceBatchFiveDesigns = [
  design("纵向斜面轨道升船机", "水平承水厢坐在不等高楔形轨车上，轮组沿整条倾斜双轨运行，岸顶卷扬牵引车架；区别于纯竖直导向升船厢，模型无机械动画", () => {
    const parts: ModelPart[] = [part("连续落地的整条斜面轨道基础", "extrude", colors.stone, [0, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 9.5, profile: [{ x: 40, y: 0 }, { x: -40, y: 0 }, { x: -40, y: 23.08 }, { x: 40, y: .52 }] }), ...[-1, 1].map(s => rail([s * 3.5, 1, -39], [s * 3.5, 23, 39], .32, dark)), ...waterCaisson("水平承船水厢", 16.4, 6.2, 25)];
    for (const z of [-11, 11]) for (const s of [-1, 1]) {
      const wheel = 12 + z * 22 / 78 + .55, top = 16.2;
      parts.push(cylinder("沿倾斜轨道滚动的承载钢轮", s * 3.5, wheel, z, .8, .3, dark, [0, 0, 90]), box("补偿轨面坡差的不同高度承船立架", s * 3.25, (wheel + .4 + top) / 2, z, .22, top - wheel - .4, .3, steel), rail([s * 3.25, wheel + .4, z], [-s * 3.25, top, z], .14, steel));
    }
    parts.push(...[-11, 11].map(z => box("贯通两侧立架并承接水厢边梁的横梁", 0, 16.23, z, 7, .26, .35, dark)));
    parts.push(...[-1, 1].map(s => rail([s * 3.25, 9.45, -11], [s * 3.25, 15.65, 11], .22, steel)), ...[-1, 1].map(s => box("水平承水底盘纵向边梁", s * 2.75, 16.35, 0, .3, .3, 25.3, dark)));
    parts.push(box("上端卷扬机构完整工作台", 0, 23.25, 39, 7, .5, 3, colors.stone), ...[-1, 1].map(s => box("卷扬横轴独立支承座", s * 1.6, 24.1, 39, .35, 1.2, 1, steel)), cylinder("岸顶横向牵引卷筒", 0, 24.6, 39, 1.1, 3.7, dark, [0, 0, 90]), pipe("从岸顶卷扬接到车架前端的连续牵引索", [0, 24.6, 38.7], [0, 16.5, 12.65], .05), box("连接牵引索与完整车架的前端耳板", 0, 16.5, 12.65, .8, .2, .3, steel));
    return parts;
  }, "建筑", "现代"),
  design("双水厢转轮式升船机", "水平长轴带动两侧转轮，直径相对的两个承水厢通过端部枢轴保持水平，上方高架水道对应高位水厢，模型为静态机构姿态", () => {
    const parts: ModelPart[] = [];
    for (const z of [-13, 13]) {
      const rim = ring("绕水平主轴的完整承载转轮", steel, 13, .9, 0, .9); rim.position = { x: 0, y: 18, z }; rim.rotation.x = 90; parts.push(rim);
      for (const angle of [-45, 0, 45, 135, 180, 225]) { const a = angle * Math.PI / 180; parts.push(rail([0, 18, z], [Math.cos(a) * 12.2, 18 + Math.sin(a) * 12.2, z], .7, steel)); }
      parts.push(...[-1, 1].map(s => rail([s * 8, .8, z + Math.sign(z) * 2], [0, 18, z + Math.sign(z) * 2], .85, colors.stone)), ...[-1, 1].map(s => box("A形轴承塔落地基础", s * 8, .4, z + Math.sign(z) * 2, 2.4, .8, 3)));
    }
    parts.push(cylinder("贯通前后转轮与两端轴承的水平主轴", 0, 18, 0, 1.5, 34, dark, [90, 0, 0]));
    for (const center of [5, 31]) {
      parts.push(...waterCaisson("可绕端轴自调平的升船水厢", center - 5, 4.4, 24));
      for (const z of [-12.5, 12.5]) parts.push(cylinder("水厢相对转轮转动的端部平衡枢轴", 0, center, z, .55, 2, dark, [90, 0, 0]), box("高出航行净空的水厢悬吊横梁", 0, center, z * .94, 4.4, .3, .35, steel), ...[-1, 1].map(s => box("水厢两侧与上部枢轴相连的悬吊杆", s * 2, center - 2.35, z * .94, .2, 4.7, .25, steel)));
    }
    parts.push(box("上层高架水道承水底板", 0, 26.15, 21.4, 4.4, .3, 18.7), ...[-1, 1].map(s => box("上层水道连续两侧挡水壁", s * 2.05, 27.4, 21.4, .3, 2.2, 18.7)), box("上层水道内部静态水面", 0, 27.73, 21.4, 3.75, .035, 18.5, colors.water));
    parts.push(...[-1, 1].flatMap(x => [19, 28].map(z => box("上层水道四点落地支承柱", x * 1.7, 13, z, .7, 26, .85))), ...[-1, 1].map(s => rail([s * 1.7, 6, 19], [-s * 1.7, 25, 28], .3, colors.stone)));
    return parts;
  }, "建筑", "现代"),
  design("固定阶壁排水干船坞", "挖入式固定坞底与两侧多级坞墙围合完整干式修船空间，前端独立止水门封住海口，坞内墩列承接龙骨而不是浮箱整体沉浮", () => {
    const parts: ModelPart[] = [box("固定船坞完整厚底板", 0, 1, 0, 30, 2, 90), box("船坞后端封闭挡水实墙", 0, 7, 43, 28, 10, 2)];
    for (const s of [-1, 1]) parts.push(box("阶壁下层完整宽承土体", s * 11.5, 4.5, 0, 5, 5, 88), box("阶壁中层后退形成检修石台", s * 12.1, 8, 0, 3.8, 2, 88), box("阶壁上层后退形成上行步道", s * 12.8, 10.5, 0, 2.4, 3, 88), box("坞口门槽两侧固定厚闸首", s * 11.6, 7, -42, 5.2, 10, 2.2));
    parts.push(box("坞口封闭止水门完整门体", 0, 7, -42, 18, 10, 1.3, steel), ...Array.from({ length: 9 }, (_, i) => box("止水门背面承水压力加强肋", -8 + i * 2, 7, -41.2, .22, 9.7, .45, dark)));
    for (let i = 0; i < 10; i++) {
      const z = -34 + i * 7.5;
      parts.push(box("坞底独立龙骨支承石墩", 0, 2.3, z, 1.8, .6, 1), box("龙骨墩顶可压缩保护木垫", 0, 2.7, z, 1.65, .2, .95, colors.wood));
    }
    for (const z of [-26, -4, 18]) for (const s of [-1, 1]) parts.push(box("两侧船体支承墩基础", s * 5.5, 2.35, z, 1.6, .7, 1.4), rail([s * 5.5, 2.7, z], [s * 4.3, 4.3, z], .35, colors.wood));
    parts.push(...[-1, 1].map(s => pipe("后端检修梯连续侧梁", [s * .5, 2.1, 40.8], [s * .5, 12, 42], .075)));
    for (let i = 0; i < 12; i++) parts.push(pipe("沿坞墙攀登的防滑梯横档", [-.5, 2.4 + i * .8, 40.84 + i * .096], [.5, 2.4 + i * .8, 40.84 + i * .096], .065));
    return parts;
  }, "建筑", "现代"),
];
