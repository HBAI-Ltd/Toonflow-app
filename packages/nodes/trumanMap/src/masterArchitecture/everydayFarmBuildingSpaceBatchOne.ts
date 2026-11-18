import { part } from "../assetModelParts";
import type { ModelPart } from "../assetModelParts";
import { base, box, design, rail } from "./structures";
import type { ArchitecturePrototype } from "./structures";
import { glazedFace, rectangle, wallYz } from "./everydayWorkplaceSpaceBatchOne";
import { xYWall } from "./futureSpaceBatchTen";
import { stairFlight } from "./futureSpaceBatchSix";
import { boxesMesh } from "./publicSpaceBatchEight";
import type { SolidBox } from "./publicSpaceBatchEight";

const wallColor = "#b9b9af";
const concrete = "#a8aca3";
const roofColor = "#7d8c87";
const dark = "#53676a";
const timber = "#a48e6d";
const insulated = "#c0c7bc";

function fieldPackingHall(): ModelPart[] {
  const floor = 1.25, eave = 8.4 - 2 * 14 / 14.5;
  const parts: ModelPart[] = [base(65, 53, .2), box("分级厅完整落地高地坪", 0, .725, 0, 28, 1.05, 24, concrete), box("抽检结算前厅的独立低位地面", -8, .325, -16, 12, .25, 8, concrete)];
  const endWall: [number, number][] = [[-14, floor], [14, floor], [14, eave], [0, 8.4], [-14, eave]];
  parts.push(...glazedFace("分级厅前山墙与人员专用内门", "xy", endWall, [-2, 6, 11].map(x => rectangle(x, 4.7, 3.8, .8)), [rectangle(-9, floor, 1.7, 2.4)], -12), ...glazedFace("分级厅后山墙与独立人行出口", "xy", endWall, [-9, 0, 9].map(x => rectangle(x, 4.9, 4.8, 1)), [rectangle(0, floor, 1.4, 2.4)], 12));
  const side: [number, number][] = [[-12, floor], [12, floor], [12, eave], [-12, eave]];
  parts.push(...glazedFace("来货端对应低场坡口的西侧围护", "yz", side, [rectangle(5, 4.8, 6, .9)], [rectangle(-6, floor, 5.5, 3.5)], -14), ...glazedFace("出货端对应两道装车口的东侧围护", "yz", side, [rectangle(0, 5, 6, .8)], [-6, 6].map(z => rectangle(z, floor, 4.4, 3.5)), 14));
  parts.push(part("分级厅真正闭合且有厚度的双坡屋盖", "extrude", roofColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: -14.5, y: 6.6 }, { x: 0, y: 8.6 }, { x: 14.5, y: 6.6 }, { x: 14.5, y: 6.4 }, { x: 0, y: 8.4 }, { x: -14.5, y: 6.4 }], depth: 25 }));
  for (const z of [-10.5, 0, 10.5]) {
    for (const x of [-13.7, 13.7]) parts.push(box("分级厅屋架落到高地坪的实际钢柱", x, (floor + eave + .05) / 2, z, .28, eave + .05 - floor, .28, dark));
    parts.push(rail([-14, eave, z], [0, 8.4, z], .26, dark), rail([0, 8.4, z], [14, eave, z], .26, dark), box("屋架两端相接的水平拉梁", 0, eave - .12, z, 27.4, .22, .22, dark));
  }
  parts.push(wallYz("来货抽检区与分级区之间真正开通的内隔墙", [[-11.9, floor], [11.9, floor], [11.9, 4.4], [-11.9, 4.4]], [rectangle(-6, floor, 5.3, 3.05), rectangle(-10, floor, 1.6, 2.4)], -6, .14, wallColor));
  const work: SolidBox[] = [];
  for (const z of [-3.3, 3.3]) {
    work.push({ center: [2, 2.10, z], size: [8, .14, 1.6] });
    for (const x of [-1, 5]) for (const side of [-1, 1]) work.push({ center: [x, 1.655, z + side * .58], size: [.12, .81, .12] });
  }
  parts.push(boxesMesh("不侵占两道叉车路线的固定分级工作岛", timber, work), box("抽检区靠墙固定取样台", -11.5, 1.70, 6, 1.1, .9, 5, timber));
  parts.push(part("低位田头来货场连续进入抽检区的实体长坡", "extrude", concrete, [0, 0, -6], [1, 1, 1], [0, 0, 0], { profile: [{ x: -25, y: .2 }, { x: -14, y: .2 }, { x: -14, y: floor }], depth: 5.5 }), box("来货坡口连续遮雨盖", -19.7, 4.89, -6, 12, .18, 6.5, roofColor));
  for (const z of [-8.8, -3.2]) parts.push(box("来货雨盖外沿的完整落地柱", -25.2, 2.5, z, .22, 4.6, .22, dark));
  parts.push(box("出货端接到两道装车门的连续高月台", 15.6, .725, 0, 3.2, 1.05, 24, concrete));
  for (const z of [-6, 6]) parts.push(box("装车口前完整接地承托的外伸货台", 19.0, .725, z, 3.6, 1.05, 5.2, concrete), box("装车台外沿固定防碰条", 20.85, .93, z, .12, .45, 4.7, dark));
  parts.push(box("出货月台整条轻型遮雨顶", 17.5, 5.02, 0, 7.4, .20, 25, roofColor));
  for (const z of [-11, 0, 11]) parts.push(box("装车雨棚不挡车门的外沿承柱", 20.8, 2.6, z, .22, 4.8, .22, dark));
  const front: [number, number][] = [[-14, .45], [-2, .45], [-2, 4.05], [-14, 4.05]], officeSide: [number, number][] = [[-20, .45], [-12, .45], [-12, 4.05], [-20, 4.05]];
  parts.push(...glazedFace("抽检结算前厅独立公共入口与低窗", "xy", front, [rectangle(-12, 1.45, 2, 1.4), rectangle(-4.4, 1.45, 2.5, 1.4)], [rectangle(-9, .45, 2.2, 2.4)], -20), ...glazedFace("结算前厅外侧采光窗墙", "yz", officeSide, [rectangle(-16, 1.45, 4, 1.4)], [], -14), ...glazedFace("结算前厅另一侧完整采光窗墙", "yz", officeSide, [rectangle(-16, 1.45, 4, 1.4)], [], -2), box("结算前厅完整低平屋盖", -8, 4.15, -16, 12.5, .2, 8.5, roofColor));
  parts.push(stairFlight("结算前厅真正接到高位分级厅人员门的四步内梯", [-9, .45, -13.65], 4, .2, .4, 1.7), box("内梯上端接通人员门的短落脚台", -9, 1.15, -12.025, 1.7, .2, .35, concrete), stairFlight("公共前厅从场坪进入的两步短梯", [-9, .2, -21.2], 2, .125, .6, 2.5), box("与叉车来货分开的固定结算柜台", -4.3, .91, -16, 1.4, .92, 4, timber));
  const rearSteps = stairFlight("分级厅后人行出口回到场坪的完整短梯", [0, .2, 13.8], 6, .175, .3, 1.8); rearSteps.rotation.y = 90; parts.push(rearSteps);
  return parts;
}

function publicColdStore(): ModelPart[] {
  const floor = 1.25, parts: ModelPart[] = [base(63, 51, .2), box("营业收储冷库完整落地的高位保温地坪", 0, .725, 2, 26, 1.05, 22, concrete), box("公众营业前厅独立低位地坪", -17, .325, -6.5, 8, .25, 13, concrete), box("两座货物缓冲前室外侧连续高装卸台", 0, .725, -11, 26, 1.05, 4, concrete)];
  const front: [number, number][] = [[-13, floor], [13, floor], [13, 5.75], [-13, 5.75]], side: [number, number][] = [[-9, floor], [13, floor], [13, 5.75], [-9, 5.75]];
  parts.push(xYWall("公共冷库两条独立货物缓冲入口的厚保温前壁", front, [rectangle(-7.5, floor, 3.2, 3.2), rectangle(0, floor, 1.6, 2.4), rectangle(7.5, floor, 3.2, 3.2)], -9, .30, insulated), xYWall("公共冷库后部独立疏散通门的厚保温壁", front, [rectangle(0, floor, 1.6, 2.4)], 13, .30, insulated));
  parts.push(wallYz("冷库西侧保温外壁与营业厅工作人员专用内门", side, [rectangle(-6, floor, 1.7, 2.4)], -13, .30, insulated), wallYz("冷库无落地窗的完整东侧厚保温外壁", side, [], 13, .30, insulated), box("两间冷室及货物缓冲区完整厚保温顶", 0, 5.9, 2, 26.6, .3, 22.6, insulated));
  for (const x of [-2, 2]) parts.push(wallYz("分温冷室与中央检修人员走廊的厚隔墙", [[-3.85, floor], [12.85, floor], [12.85, 5.75], [-3.85, 5.75]], [rectangle(5, floor, 1.6, 2.4)], x, .25, insulated));
  parts.push(xYWall("缓冲前室真正接入两间冷室的保温内门墙", [[-12.85, floor], [12.85, floor], [12.85, 5.75], [-12.85, 5.75]], [rectangle(-7.5, floor, 2.8, 3.0), rectangle(0, floor, 1.6, 2.4), rectangle(7.5, floor, 2.8, 3.0)], -4, .25, insulated));
  for (const x of [-2, 2]) parts.push(wallYz("货物前室与中央人员缓冲间之间真正开门的隔墙", [[-8.85, floor], [-4.15, floor], [-4.15, 5.75], [-8.85, 5.75]], [rectangle(-6, floor, 1.5, 2.4)], x, .20, insulated));
  for (const x of [-10.55, 10.55]) {
    parts.push(box("滑到门洞旁而没有堵住冷室货物入口的保温门", x, 2.78, -4.24, 2.85, 3.06, .14, insulated), box("沿保温内壁固定的实际滑门承挂轨", x < 0 ? -8.55 : 8.55, 4.51, -4.32, 7.0, .10, .08, dark));
    for (const side of [-1, 1]) parts.push(box("保温门板实际接上承挂轨的短吊片", x + side * .9, 4.4, -4.28, .08, .28, .10, dark), rail([(x < 0 ? -8.55 : 8.55) + side * 2.8, 4.51, -4.32], [(x < 0 ? -8.55 : 8.55) + side * 2.8, 4.51, -4.08], .08, dark));
  }
  for (const x of [-12.6, -2, 2, 12.6]) for (const z of [-8.6, 2, 12.6]) parts.push(box("冷库避开中央人员门并接住厚顶板的完整承重柱", x, 3.5, z, .35, 4.5, .35, concrete));
  for (const z of [-8.6, 2, 12.6]) parts.push(box("冷库厚屋盖下面实际连续接柱的横向承梁", 0, 5.65, z, 25.5, .20, .25, dark));
  parts.push(box("高装卸台完整连续遮雨顶", 0, 4.8, -11.35, 27, .20, 5.2, roofColor));
  for (const x of [-11.7, 0, 11.7]) parts.push(box("冷库装卸雨棚避开货门的外沿落地柱", x, 2.45, -13.7, .24, 4.5, .24, dark));
  const officeFront: [number, number][] = [[-21, .45], [-13, .45], [-13, 4.0], [-21, 4.0]], officeSide: [number, number][] = [[-13, .45], [0, .45], [0, 4.0], [-13, 4.0]];
  parts.push(...glazedFace("收储营业厅面向公众的独立入口与办事窗", "xy", officeFront, [rectangle(-19.8, 1.35, 1.4, 1.4), rectangle(-14.5, 1.35, 1.8, 1.4)], [rectangle(-17, .45, 2.2, 2.4)], -13), ...glazedFace("收储营业厅后侧独立人行出口", "xy", officeFront, [rectangle(-15, 1.35, 2, 1.4)], [rectangle(-19, .45, 1.3, 2.4)], 0), ...glazedFace("营业厅外侧完整采光薄墙", "yz", officeSide, [rectangle(-9.2, 1.35, 4.2, 1.4), rectangle(-2.3, 1.35, 2.6, 1.4)], [], -21), box("低营业厅与高冷库分别闭合的完整屋盖", -17, 4.10, -6.5, 8.4, .2, 13.4, roofColor));
  parts.push(box("营业厅共享冷库外壁下部的接地补墙", -13, .85, -4.5, .18, .8, 9, wallColor), box("营业厅露出冷库前壁之外的完整东侧墙段", -13, 2.225, -11, .18, 3.55, 4, wallColor));
  const staffSteps = stairFlight("营业厅工作人员专门进入高位货物缓冲区的内梯", [-15.5, .45, -6], 4, .2, .6, 1.7); staffSteps.rotation.y = 0;
  parts.push(staffSteps, box("工作人员内梯真正接到高位内门的落脚台", -13.05, 1.15, -6, .5, .2, 1.7, concrete), stairFlight("公众入口从场坪进入低营业厅的短阶", [-17, .2, -14.2], 2, .125, .6, 2.6), box("公众等候区与工作人员路线分开的收储柜台", -19.5, .95, -6.5, 1.0, 1.0, 5, timber));
  const rear = stairFlight("中央检修走廊后门回到外侧场坪的短阶", [0, .2, 14.8], 6, .175, .3, 1.8); rear.rotation.y = 90; parts.push(rear);
  parts.push(part("叉车从装卸台一端连续回到场坪的实体斜坡", "extrude", concrete, [0, 0, -11], [1, 1, 1], [0, 0, 0], { profile: [{ x: 13, y: .2 }, { x: 23, y: .2 }, { x: 13, y: floor }], depth: 3.5 }));
  return parts;
}

export const everydayFarmBuildingSpaceBatchOneDesigns: ArchitecturePrototype[] = [
  design("田头收货分级装车厅", "低位来货坡口先进入隔离抽检区，再通过真实宽门接分级厅和另一端高装车月台；低位结算前厅由独立人员阶梯接入，不与叉车来货门混行", fieldPackingHall, "建筑", "现代"),
  design("营业前厅分温冷库楼", "低位公众收储营业厅经专用内梯接入高位缓冲前室，两间厚围护冷室与中央检修走廊分别开通；高装卸台、连续雨棚和独立叉车坡道构成完整收储建筑", publicColdStore, "建筑", "现代"),
];
