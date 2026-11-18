import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, cup, loop, rod, cord, legs, piercedPanel, material, type MasterPrototype } from "./parts";
import { openTray } from "./culinaryExpansionBatchOne";
import { conveyor } from "./culinaryExpansionBatchTwo";
import { openPipe } from "./husbandryEquipmentBatchOne";
import { combineMeshes, tapered, sweptProfile } from "../masterNature/shared";
import { Euler, Quaternion, Vector3 } from "three";

function soilBin(name: string, position: Triple, top: [number, number], bottom: [number, number], height: number, wall: [number, number] = [.018, .018], creased = true): ModelPart {
  const vertices = [false, true].flatMap(inner => [bottom, top].flatMap(([width, length], level) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, z]) => ({ x: x! * (width / 2 - (inner ? wall[level]! : 0)), y: level * height, z: z! * (length / 2 - (inner ? wall[level]! : 0)) }))));
  const indices: number[] = [];
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(i, i + 4, j + 4, i, j + 4, j, i + 8, j + 8, j + 12, i + 8, j + 12, i + 12, i + 4, i + 12, j + 12, i + 4, j + 12, j + 4, i, j, j + 8, i, j + 8, i + 8); }
  if (creased) {
    const faceVertices: typeof vertices = [], faceIndices: number[] = [];
    // 金属斗仅在折边拆顶点；每片平面仍共享两三角片，塑料苗杯保留原有圆滑折点。
    for (let offset = 0; offset < indices.length; offset += 6) {
      const face = indices.slice(offset, offset + 6), corners = [...new Set(face)], start = faceVertices.length;
      faceVertices.push(...corners.map(index => vertices[index]!));
      faceIndices.push(...face.map(index => start + corners.indexOf(index)));
    }
    return part(name, "mesh", material.steel, position, [1, 1, 1], [0, 0, 0], { vertices: faceVertices, indices: faceIndices });
  }
  return part(name, "mesh", material.steel, position, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function plugTray(name: string, position: Triple): ModelPart[] {
  const [x, y, z] = position, holes: [number, number][][] = [];
  const parts: ModelPart[] = [];
  for (let row = 0; row < 3; row++) for (let column = 0; column < 6; column++) {
    const px = (column - 2.5) * .086, pz = (row - 1) * .107;
    holes.push([[px - .03, pz - .03], [px + .03, pz - .03], [px + .03, pz + .03], [px - .03, pz + .03]]);
    parts.push(soilBin(`${name}逐穴开放且保留排水孔的方锥育苗杯`, [x + px, y - .069, z + pz], [.066, .066], [.036, .036], .069, [.01, .003], false));
  }
  return [combineMeshes(`${name}逐穴保留上下通口的完整薄壁杯阵`, material.dark, parts), piercedPanel(`${name}所有穴口真实贯穿的连续顶沿`, [x, y, z], [[-.28, -.18], [.28, -.18], [.28, .18], [-.28, .18]], holes, .004, material.dark)];
}

function seedDrum(y: number, z: number): ModelPart[] {
  // ACT: 细小吸种孔以四边口保留真实通孔；两段低面壳体均独立闭合，不为微孔增加高细分圆柱。
  return [-1, 1].map(side => {
    const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], locations = new Map<string, number>();
    const point = (x: number, angle: number, radius: number) => {
      const value = { x, y: y + Math.cos(angle) * radius, z: z + Math.sin(angle) * radius };
      const key = [value.x, value.y, value.z].map(coordinate => Math.round(coordinate * 1e9)).join(",");
      if (!locations.has(key)) { locations.set(key, vertices.length); vertices.push(value); }
      return locations.get(key)!;
    };
    const start = side < 0 ? -.3 : 0, radius = .095, wall = .006;
    for (let column = 0; column < 3; column++) for (let row = 0; row < 24; row++) {
      const x0 = start + column * .1, x1 = x0 + .1, a0 = row * Math.PI / 12, a1 = (row + 1) * Math.PI / 12;
      const corners = [[x0, a0], [x1, a0], [x1, a1], [x0, a1]], outer = corners.map(([x, a]) => point(x!, a!, radius)), inner = corners.map(([x, a]) => point(x!, a!, radius - wall));
      if (row % 6 === 2) {
        const xm = (x0 + x1) / 2, am = (a0 + a1) / 2;
        const hole = [[xm - .0035, am - .035], [xm + .0035, am - .035], [xm + .0035, am + .035], [xm - .0035, am + .035]], holeOuter = hole.map(([x, a]) => point(x!, a!, radius)), holeInner = hole.map(([x, a]) => point(x!, a!, radius - wall));
        for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; indices.push(outer[i]!, holeOuter[j]!, outer[j]!, outer[i]!, holeOuter[i]!, holeOuter[j]!, inner[i]!, inner[j]!, holeInner[j]!, inner[i]!, holeInner[j]!, holeInner[i]!, holeOuter[i]!, holeInner[i]!, holeInner[j]!, holeOuter[i]!, holeInner[j]!, holeOuter[j]!); }
      } else indices.push(outer[0]!, outer[2]!, outer[1]!, outer[0]!, outer[3]!, outer[2]!, inner[0]!, inner[1]!, inner[2]!, inner[0]!, inner[2]!, inner[3]!);
      if (column === 0) indices.push(outer[0]!, inner[3]!, outer[3]!, outer[0]!, inner[0]!, inner[3]!);
      if (column === 2) indices.push(outer[1]!, outer[2]!, inner[2]!, outer[1]!, inner[2]!, inner[1]!);
    }
    return part("播种滚筒保留取种通孔金属筒段", "mesh", material.steel, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
  });
}

// 按公开设备类别自行建立机构与米制造型，不复制品牌外观或下载模型。
// https://www.umass.edu/agriculture-food-environment/greenhouse-floriculture/fact-sheets/transplanting-methods-equipment-in-greenhouses
// https://www.javo.eu/toepassingen/potmachines/
// https://www.urbinati.com/en/applications/filling-machines-soil
export const horticultureEquipmentBatchOneObjects: MasterPrototype[] = [
  { name: "环链提土回转式自动装盆机", build: () => {
    const parts: ModelPart[] = [...legs(2.48, 1.63, .28, .07), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("料仓四角落到整机底架短支座", [-.76 + x * .28, .34, .13 + z * .37], [-.76 + x * .28, .42, .13 + z * .37], .05))), box("连接土仓与回转盆轨落地机架", [0, .3, .12], [2.7, .12, 1.87], material.dark), soilBin("两端敞口且有薄壁主基质料仓", [-.76, .4, .13], [1.13, 1.46], [.58, .77], .94), box("主基质料仓内承料底带", [-.76, .405, .13], [.56, .025, .77], material.dark), ...[-1, 1].map(side => box("竖直链带提土机双侧承力板", [-.18 + side * .23, 1.15, .5], [.06, 1.7, .48], material.steel)), box("将基质从料仓提起窄带", [-.18, 1.15, .52], [.4, 1.61, .035], material.dark), cylinder("提土链带顶端转向主轴", [-.18, 1.95, .5], [.17, .55, .17], material.steel, [0, 0, 90]), box("提土顶部向盆轨倾斜出土导板", [.09, 1.67, .31], [.5, .035, .63], material.steel, [38, 0, 0]), cylinder("承载花盆依次绕行转盘", [.65, .79, -.04], [1.22, .08, 1.22], material.dark), cylinder("回转盘下减速传动座", [.65, .52, -.04], [.42, .46, .42], material.steel), loop("沿盆轨外圈防脱护环", [.65, .87, -.04], .62, .018), rod("旋转打孔头与机架相接后立柱", [1.07, .36, -.57], [1.07, 1.73, -.57], .07), box("向盆口上方前伸钻头固定悬臂", [.87, 1.71, -.57], [.48, .09, .18], material.steel), cylinder("盆土定点打孔竖直驱动电机", [.65, 1.65, -.57], [.14, .32, .14], material.dark), rod("钻头从电机下端伸入盆土细轴", [.65, 1.5, -.57], [.65, 1.08, -.57], .035), box("提土链带下方落土回收底板", [.3, .47, .02], [.86, .035, 1.11], material.steel), box("自动装盆机侧面控制箱", [-1.28, .97, -.52], [.21, .52, .27], material.ivory), box("控制箱正面状态显示窗", [-1.28, 1.05, -.662], [.13, .15, .012], material.glass), ...conveyor("从回转盘接出花盆短输出带", [1.19, .81, .98], .28, 1.4), ...[-1, 1].map(side => rod("输出带尾部落地短腿", [1.19 + side * .13, .025, 1.49], [1.19 + side * .13, .78, 1.49], .04))];
    for (let i = 0; i < 7; i++) parts.push(box("提土窄带上分布提土斗边", [-.18, .48 + i * .2, .45], [.41, .055, .14], material.steel));
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2; parts.push(cup("固定在回转盘各工位开放花盆夹杯", [.65 + Math.cos(a) * .47, .83, -.04 + Math.sin(a) * .47], .11, .15, material.ivory)); }
    return parts;
  } },
  // https://www.urbinati.com/en/product/drum-seeder-semanthea/
  { name: "通孔真空滚筒式穴盘播种机", build: () => {
    const parts: ModelPart[] = [...legs(.85, 1.67, .72, .06), ...[-1, 1].map(side => rod("播种机机脚下部相连纵向拉梁", [side * .425, .2, -.835], [side * .425, .2, .835], .045)), rod("真空风泵下方接到机架低位承梁", [-.425, .2, .3], [.425, .2, .3], .045), ...conveyor("苗盘穿过播种筒下方输送带", [0, .78, 0], .65, 1.9), ...[-1, 1].map(side => box("播种筒两端可调高度承轴侧梁", [side * .38, 1.04, 0], [.09, .57, .69], material.ivory)), ...seedDrum(1.105, .16), rod("贯穿左右播种滚筒旋转轴", [-.46, 1.105, .16], [.46, 1.105, .16], .026), box("主轴一端伺服驱动机头", [.49, 1.105, .16], [.18, .19, .25], material.dark), ...openTray("供播种筒吸取种子的浅振动种盘", [0, 1.09, .34], .61, .15, .055), openPipe("滚筒另一端真空旋转接头", [-.38, 1.105, .16], [-.52, 1.105, .16], .029), cord("从旋转接头接到机架底部吸气管", [[-.52, 1.105, .16], [-.56, .74, .29], [-.42, .36, .3]], .018, material.dark), cylinder("机架底部真空风泵", [-.25, .34, .3], [.26, .35, .26], material.dark, [0, 0, 90]), rod("滚筒正前方不封闭落种口导风细梁", [-.33, 1.07, -.005], [.33, 1.07, -.005], .018), box("右侧立起播种控制面板", [.54, 1.35, -.31], [.2, .26, .07], material.dark), box("播种面板前侧显示窗", [.54, 1.39, -.351], [.14, .13, .012], material.glass), ...plugTray("正在经过播种工位的苗盘", [0, .854, -.45])];
    return parts;
  } },
  // https://www.urbinati.com/en/product/drum-plate-seeder-semblock/
  { name: "双柱升降针板真空播种台", build: () => {
    const parts: ModelPart[] = [box("将整套立式播种台固定封闭矮基座", [0, .28, 0], [.96, .56, .9], material.ivory), ...[-1, 1].map(side => rod("位于种盘后侧两根垂直升降导柱", [side * .33, .56, .24], [side * .33, 1.52, .24], .045)), box("双导柱顶端整根承重横梁", [0, 1.53, .24], [.78, .09, .16], material.steel), cylinder("承重横梁中央竖直取种升降缸", [0, 1.36, .24], [.1, .3, .1], material.dark), rod("驱动针板悬臂向下运动活塞杆", [0, 1.22, .24], [0, 1.08, .24], .03), box("针板升降滑块前伸悬臂", [0, 1.08, .05], [.15, .1, .47], material.steel), box("平板内分配真空气路浅腔", [0, 1.035, -.12], [.55, .045, .34], material.steel), ...openTray("针板落种前使用的独立种子浅盘", [0, .86, .38], .56, .22, .04), ...plugTray("正放在开放播种工作面的穴盘", [0, .71, -.13]), box("穴盘下方前后推送承托滑台", [0, .63, -.13], [.64, .07, .48], material.dark), ...[-1, 1].map(side => rod("承托滑台下方左右水平导轨", [side * .25, .59, -.43], [side * .25, .59, .31], .025)), box("基座右侧真空泵罩", [.57, .24, .2], [.27, .3, .35], material.dark), cord("由基座侧边接到平板腔软气管", [[.57, .37, .2], [.55, 1.2, .28], [.28, 1.06, .01]], .014, material.dark), box("基座前方倾斜操作台面", [0, .55, -.49], [.4, .05, .18], material.dark, [-18, 0, 0])];
    for (let i = 0; i < 18; i++) parts.push(openPipe("由真空浅腔向下伸出吸种针口", [(i % 6 - 2.5) * .086, 1.015, -.12 + (Math.floor(i / 6) - 1) * .107], [(i % 6 - 2.5) * .086, .965, -.12 + (Math.floor(i / 6) - 1) * .107], .0035, .0015));
    return parts;
  } },
  // https://www.urbinati.com/en/product/pressing-machine-pressatorba/
  { name: "双压模格营养土块成型机", build: () => {
    const parts: ModelPart[] = [...legs(1.14, 1.42, .7, .075), box("营养土块双压成型开放承力台", [0, .76, 0], [1.24, .12, 1.6], material.steel), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("压模机构四角落到机台导柱", [x * .49, .82, z * .38], [x * .49, 1.83, z * .38], .055))), box("双压模上方承受液压反力整板", [0, 1.86, 0], [1.14, .14, .95], material.steel), cylinder("驱动模格压头竖直主油缸", [0, 1.64, 0], [.23, .4, .23], material.dark), rod("油缸向下接入压头活塞杆", [0, 1.45, 0], [0, 1.2, 0], .095), box("可沿四导柱升降整块模压头", [0, 1.18, 0], [.96, .12, .76], material.steel), ...conveyor("成型土块由压模下方送出短链床", [0, .86, 1.02], .84, .71), soilBin("供料用开放泥炭料仓", [-1.05, .47, 0], [.68, .91], [.38, .53], .95), openPipe("泥炭料仓底部与压模供土口相接斜提升筒", [-1.05, .49, 0], [-.42, 1.57, 0], .12), box("供土提升筒底部传动箱", [-1.05, .37, 0], [.36, .26, .39], material.dark), box("供油回路机旁液压箱", [1.01, .3, .18], [.52, .6, .65], material.dark), cord("液压箱接入压模主缸供回油束", [[1.01, .61, .18], [.89, 1.53, .32], [.11, 1.69, 0]], .022, material.dark)];
    for (let i = 0; i < 5; i++) parts.push(box("土块成型格中竖立纵分模壁", [(i - 2) * .18, .96, 0], [.012, .2, .64], material.steel));
    for (let i = 0; i < 4; i++) parts.push(box("土块成型格中竖立横分模壁", [0, .96, (i - 1.5) * .21], [.73, .2, .012], material.steel));
    for (let i = 0; i < 6; i++) parts.push(box("输出床上保持间隔成型土块", [(i % 3 - 1) * .2, .96, .85 + Math.floor(i / 3) * .22], [.18, .18, .2], material.wood));
    return parts;
  } },
  // https://www.techmek.it/paperpot-line/
  { name: "卷纸包芯育苗纸钵成型切断机", build: () => {
    const parts: ModelPart[] = [box("纸钵成型机下部承力机柜", [0, .47, 0], [.82, .94, .91], material.ivory), soilBin("顶部将松基质送入成型口开放锥方料斗", [0, 1.15, .02], [.64, .61], [.18, .19], .55), cylinder("推动基质进入包纸芯筒下料螺杆箱", [0, 1.03, .04], [.25, .3, .25], material.dark), openPipe("纸钵成型段贯通水平大口套筒", [0, .98, -.1], [0, .98, -.73], .062), cylinder("给包芯纸带供料侧向卷纸轴", [.48, 1.27, .12], [.31, .19, .31], material.wood, [0, 0, 90]), rod("卷纸轴连接到机柜横向固定轴", [.34, 1.27, .12], [.65, 1.27, .12], .026), box("从纸卷伸向成型段窄纸带", [.25, 1.08, -.06], [.44, .004, .13], material.ivory, [0, 0, 26]), ...[-1, 1].map(side => cylinder("把纸带引向芯筒导纸轮", [side * .087, .98, -.35], [.075, .12, .075], material.dark)), ...[-1, 1].map(side => rod("位于成型出口旁切刀导柱", [side * .11, .83, -.68], [side * .11, 1.29, -.68], .022)), box("横断纸钵上下运动刀座", [0, 1.13, -.68], [.27, .06, .09], material.steel), box("切断刀座下方薄切刃", [0, 1.07, -.68], [.19, .09, .004], material.steel), cylinder("驱动切断刀上置气缸", [0, 1.31, -.68], [.065, .28, .065], material.dark), rod("气缸与切断刀座之间活塞杆", [0, 1.2, -.68], [0, 1.16, -.68], .018), ...conveyor("切下纸钵依次落入低位接钵带", [0, .68, -.99], .27, .81), ...[-1, 1].map(side => rod("接钵带前端接地支脚", [side * .13, .02, -1.28], [side * .13, .64, -1.28], .03)), box("纸钵机柜前侧控制面板", [.425, .76, -.19], [.025, .21, .24], material.dark)];
    for (let i = 0; i < 4; i++) parts.push(part("接钵带上已切分且保留中间基质纸壁钵", "lathe", material.ivory, [0, .69, -.76 - i * .16], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .052, y: 0 }, { x: .052, y: .105 }, { x: .048, y: .105 }, { x: .048, y: .003 }, { x: 0, y: .003 }] }), cylinder("纸钵中间可见基质芯", [0, .735, -.76 - i * .16], [.094, .087, .094], material.wood));
    return parts;
  } },
  // https://www.urbinati.com/en/applications/robotic-transplanters/
  { name: "双夹爪龙门滑台苗盘移栽机", build: () => {
    const parts: ModelPart[] = [...legs(1.14, 1.5, .75, .065), box("移栽机把两种苗盘分开承托宽工作台", [0, .79, 0], [1.25, .08, 1.64], material.steel), ...[-1, 1].map(side => rod("龙门横移机构两侧承重立柱", [side * .53, .83, .42], [side * .53, 1.69, .42], .07)), box("横跨两侧立柱主运动梁", [0, 1.69, .42], [1.2, .13, .2], material.ivory), ...[-.07, .07].map(z => rod("移栽滑车沿横梁移动水平导轨", [-.54, 1.7, .42 + z], [.54, 1.7, .42 + z], .023)), box("横梁中央可左右移动滑车", [.08, 1.68, .42], [.29, .22, .26], material.dark), ...[-1, 1].map(side => rod("横移滑车向下伸出两根取苗竖导柱", [.08 + side * .09, 1.58, .42], [.08 + side * .09, 1.12, .42], .023)), box("两根竖导柱下端相连取苗横梁", [.08, 1.12, .19], [.31, .075, .54], material.steel), ...plugTray("供取苗使用的源穴盘", [-.315, .899, 0]), ...plugTray("接收苗株使用的目标穴盘", [.315, .899, 0]), cord("从横移驱动端接入取苗滑车柔性气管", [[-.51, 1.76, .12], [-.33, 1.92, .13], [.08, 1.83, .11], [.08, 1.39, .42]], .013, material.dark), box("龙门端部驱动电机", [.69, 1.69, .42], [.23, .23, .22], material.dark), rod("控制箱从工作台伸出支承臂", [.6, .83, .43], [.73, 1.15, .43], .04), box("台侧朝向操作者控制箱", [.73, 1.15, .43], [.23, .32, .09], material.ivory)];
    for (const x of [-.025, .185]) { parts.push(cylinder("取苗夹爪气动执行体", [x, 1.07, 0], [.055, .12, .055], material.dark)); for (const side of [-1, 1]) parts.push(rod("伸进根团两侧而不封住夹口细夹爪", [x + side * .02, 1.015, 0], [x + side * .03, .93, 0], .009)); }
    return parts;
  } },
  // https://www.urbinati.com/en/applications/automatic-plug-depoppers-nurseries
  { name: "底针顶升式整盘脱穴取苗机", build: () => {
    const parts: ModelPart[] = [...legs(.69, .55, .772, .045), ...[-1, 1].map(side => box("托住穴盘边缘而不封底孔两根横梁", [0, .8045, side * .16], [.79, .065, .055], material.steel)), ...[-1, 1].map(side => box("穴盘短边定位而不压住顶口侧限位", [side * .34, .77, 0], [.035, .1, .49], material.steel)), box("整块升降顶针板", [0, .58, 0], [.55, .045, .35], material.steel), ...[-1, 1].map(side => rod("顶针板下方导向立柱", [side * .25, .3, 0], [side * .25, .63, 0], .022)), cylinder("从底梁推动针板上行竖直气缸", [0, .39, 0], [.09, .31, .09], material.dark), rod("气缸向上连接顶针板活塞杆", [0, .54, 0], [0, .58, 0], .027), box("气缸下端与支脚相连固定横梁", [0, .22, 0], [.65, .07, .19], material.steel), ...plugTray("仍停在托架上的开放穴盘", [0, .837, 0]), box("可控制针板升降脚踏阀", [.45, .036, .2], [.13, .07, .21], material.dark, [-12, 0, 0]), cord("由脚踏阀连接主气缸细气管", [[.45, .07, .2], [.3, .06, .27], [0, .3, .03]], .008, material.dark)];
    for (let i = 0; i < 18; i++) parts.push(rod("与逐穴底部排水孔对齐顶苗针", [(i % 6 - 2.5) * .086, .6, (Math.floor(i / 6) - 1) * .107], [(i % 6 - 2.5) * .086, .769, (Math.floor(i / 6) - 1) * .107], .008, material.steel));
    return parts;
  } },
  // https://www.tta-iso.com/equipment/ClipLine
  // https://tta-iso.com/storage/grafting_and_sorting_vegetables_brochure.pdf
  { name: "双夹头斜切夹合式自动嫁接机", build: () => {
    const parts: ModelPart[] = [...legs(.94, .72, .72, .055), box("将砧木和穗苗并排定位嫁接工作台", [0, .77, 0], [1.05, .1, .82], material.ivory), ...[-1, 1].map(side => box("两套夹持头水平进给轨座", [side * .27, .84, 0], [.37, .075, .35], material.steel)), ...[-1, 1].map(side => rod("夹持头左右相向滑动导轴", [side * .47, .91, 0], [side * .085, .91, 0], .024)), ...[-1, 1].map(side => cylinder("将两个夹头推向切口对向执行缸", [side * .36, .91, 0], [.065, .23, .065], material.dark, [0, 0, 90])), ...[-1, 1].map(side => box("夹头运动到中央切口前滑块", [side * .13, .91, 0], [.105, .13, .13], material.steel)), ...[-1, 1].map(side => rod("固定在台后切刀门架立柱", [side * .39, .82, .23], [side * .39, 1.45, .23], .035)), box("斜切刀门架跨接两根立柱上梁", [0, 1.45, .23], [.85, .07, .11], material.steel), cylinder("切刀门架上竖直气缸", [0, 1.33, .23], [.075, .22, .075], material.dark), box("向前伸到两夹头之间切刀滑臂", [0, 1.15, .11], [.1, .075, .3], material.steel), box("两夹头中央具有斜切面薄刀片", [0, 1.04, -.015], [.13, .16, .003], material.steel, [0, 0, 32]), rod("切刀气缸向下接到滑臂活塞杆", [0, 1.22, .23], [0, 1.15, .23], .021), box("送夹器后侧夹子振动盘底座", [0, .87, .5], [.34, .12, .25], material.dark), cup("夹子振动料盘开放上口", [0, .93, .5], .15, .09, material.steel), ...[-1, 1].map(side => rod("让嫁接夹依次进入切口位置双线导轨", [side * .025, .99, .41], [side * .025, .99, .045], .012)), box("机台侧边倾斜操作按键面板", [.56, .98, -.14], [.1, .19, .23], material.dark, [0, 0, -18])];
    for (const side of [-1, 1]) for (const jaw of [-1, 1]) parts.push(box("每个滑块上彼此分开软质苗茎夹口", [side * .13, 1.005, jaw * .023], [.055, .07, .027], material.dark));
    return parts;
  } },
  // https://www.urbinati.com/en/applications/automatic-trimming-machines
  { name: "苗盘输送式往复横刃切顶机", build: () => {
    const blade: [number, number][] = [[-.385, .035], [.385, .035], [.385, -.015]];
    for (let i = 0; i < 9; i++) blade.push([.37 - i * .084, -.018], [.34 - i * .084, -.066], [.31 - i * .084, -.018]);
    const parts: ModelPart[] = [...legs(.89, 1.46, .76, .06), ...conveyor("苗盘由横刃下方通过送苗带", [0, .83, 0], .68, 1.7), ...[-1, 1].map(side => rod("横刃高度可调而接到送苗台双立柱", [side * .39, .76, -.03], [side * .39, 1.6, -.03], .045)), box("两侧立柱之间切刃固定横架", [0, 1.28, .04], [.88, .1, .16], material.steel), part("横切植物顶部多齿固定薄刃", "extrude", material.steel, [0, 1.205, 0], [1, 1, 1], [90, 0, 0], { profile: blade.map(([x, y]) => ({ x, y })), depth: .007 }), part("与固定齿错开而滑动往复薄刀", "extrude", material.dark, [.014, 1.214, 0], [1, 1, 1], [90, 0, 0], { profile: blade.map(([x, y]) => ({ x, y })), depth: .006 }), box("位于横刃侧边曲柄传动头", [.51, 1.25, .03], [.18, .2, .23], material.dark), rod("由曲柄机头接入滑刀偏心连杆", [.44, 1.22, .03], [.34, 1.214, .015], .015), ...openTray("被切顶部落入的机后回收槽", [0, .56, .64], .82, .42, .18), ...[-1, 1].map(side => ({ ...box("不封住苗盘入口透明侧护板", [side * .43, 1.21, -.03], [.012, .6, .57], material.glass), opacity: .26 })), box("横刃上方防护顶板", [0, 1.52, -.03], [.88, .025, .58], material.steel), ...plugTray("位于修剪入口的育苗穴盘", [0, .904, -.5]), rod("回收槽前端接到机脚横托", [-.43, .55, .67], [.43, .55, .67], .035)];
    return parts;
  } },
  // 独立固定机台的整形参考：https://patents.google.com/patent/DE9116440U1/en
  { name: "盆苗球冠弧刃回转修剪台", build: () => {
    const outline: { x: number; y: number }[] = [];
    for (let i = 0; i <= 12; i++) { const a = i * Math.PI / 12; outline.push({ x: Math.cos(a) * .43, y: Math.sin(a) * .43 }); }
    for (let i = 12; i >= 0; i--) { const a = i * Math.PI / 12; outline.push({ x: Math.cos(a) * .405, y: Math.sin(a) * .405 }); }
    const parts: ModelPart[] = [box("固定球冠修剪机整块底脚", [0, .065, .04], [1.09, .13, 1.14], material.dark), ...[-1, 1].map(side => rod("球冠刀具门架后部落地双柱", [side * .44, .13, .42], [side * .44, 1.82, .42], .06)), box("双后柱顶端横梁", [0, 1.82, .42], [1.02, .12, .18], material.steel), box("朝盆苗中心前伸回转机头悬梁", [0, 1.82, .2], [.17, .12, .56], material.steel), cylinder("弧刃绕植物中线回转减速机", [0, 1.72, -.02], [.22, .28, .22], material.dark), rod("回转机头向下连接弧刃顶端轴", [0, 1.6, -.02], [0, 1.495, -.02], .035), part("围绕盆苗球冠而中部完全开放半圆弧刀", "extrude", material.steel, [0, 1.08, -.02], [1, 1, 1], [0, 0, 0], { profile: outline, depth: .027 }), ...[-1, 1].map(side => box("半圆刀端短刃驱动座", [side * .417, 1.075, -.02], [.067, .11, .09], material.dark)), cylinder("承托并固定盆底圆形工作盘", [0, .47, -.02], [.64, .07, .64], material.steel), cylinder("工作盘下方贯通底脚固定承柱", [0, .28, -.02], [.16, .36, .16], material.steel), cup("工作盘上不封盆口中心定位杯", [0, .505, -.02], .16, .17, material.dark), ...[-1, 1].map(side => rod("在盆外壁两侧限位水平夹紧杆", [side * .29, .58, -.02], [side * .14, .58, -.02], .018)), ...openTray("位于修剪区域下方的整体落叶接盘", [0, .15, -.02], 1.04, .93, .1), box("后立柱一侧固定控制箱", [.56, 1.24, .42], [.19, .33, .21], material.ivory)];
    return parts;
  } },
  // https://www.mecaflor.com/en/our-machines/wrapping/orchid-sleeving-machine/
  { name: "四瓣锥口撑套式盆花套袋机", build: () => {
    const parts: ModelPart[] = [...legs(.84, .84, .69, .055), ...[-1, 1].map(side => rod("位于套袋口前后固定下横梁", [-.42, .7, side * .42], [.42, .7, side * .42], .04)), ...[-1, 1].map(side => rod("锥口前后接回侧梁上部横框", [-.42, .8, side * .42], [.42, .8, side * .42], .035)), ...[-1, 1].map(side => box("承载四瓣张口机构侧向固定梁", [side * .42, .78, 0], [.09, .16, 1.02], material.steel)), cylinder("由下方顶住花盆底部升降托盘", [0, .57, 0], [.28, .035, .28], material.steel), cylinder("盆底托盘下方升降气缸", [0, .36, 0], [.09, .35, .09], material.dark), rod("升降气缸向上接入盆底托盘活塞杆", [0, .52, 0], [0, .57, 0], .028), box("套袋机侧方气路和控制箱", [.55, .7, .28], [.24, .49, .29], material.ivory), box("控制箱上朝向操作者按键窗", [.55, .8, .126], [.16, .17, .012], material.dark)];
    for (let i = 0; i < 4; i++) {
      const angle = i * Math.PI / 2, petal = sweptProfile("能分别张开而保留中间通道锥形护叶瓣", material.steel, [[.126, 0], [.354, .43], [.364, .43], [.136, 0]], Math.PI / 2 - .05, 7);
      petal.position = { x: 0, y: .71, z: 0 }; petal.rotation = { x: 0, y: i * 90 + 1.4, z: 0 }; parts.push(petal, rod("连接护叶瓣到外框径向短拉杆", [Math.cos(angle) * .28, .98, Math.sin(angle) * .28], [Math.cos(angle) * .42, .8, Math.sin(angle) * .42], .016));
    }
    return parts;
  } },
  // https://fliersystems.com/en/machines/internal-transport-system-pots
  { name: "开合梳指式花盆间距分离机", build: () => {
    const parts: ModelPart[] = [box("盆距分离机构落地后底架", [0, .065, .24], [1.5, .13, 1.22], material.dark), ...[-1, 1].map(side => rod("支承整排活动梳指后侧立柱", [side * .61, .13, .44], [side * .61, 1.56, .44], .065)), box("两个后立柱之间固定承重横梁", [0, 1.55, .44], [1.4, .12, .18], material.steel), ...[.38, .5].map(z => rod("可变间距梳指滑块共用水平导轴", [-.6, 1.38, z], [.6, 1.38, z], .025)), box("从机架两端推动梳指展开驱动电机", [.77, 1.4, .44], [.23, .25, .26], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("接盆台面下方连接底架四根短柱", [x * .58, .13, z * .13], [x * .58, .58, z * .13], .035))), ...[-1, 1].map(side => box("让盆底停在拾取高度台面", [0, .6, side * .13], [1.33, .065, .2], material.steel))];
    for (let i = 0; i < 6; i++) {
      const x = (i - 2.5) * .218;
      parts.push(box("可沿水平导轴滑动盆位滑块", [x, 1.38, .44], [.09, .14, .21], material.steel), rod("各滑块向下连接取盆梳指吊杆", [x, 1.33, .43], [x, .87, .43], .018), part("留出盆壁空间U形取盆梳指", "extrude", material.steel, [x, .87, .22], [1, 1, 1], [90, 0, 0], { depth: .016, profile: [{ x: -.081, y: .24 }, { x: .081, y: .24 }, { x: .081, y: -.24 }, { x: .057, y: -.24 }, { x: .057, y: .18 }, { x: -.057, y: .18 }, { x: -.057, y: -.24 }, { x: -.081, y: -.24 }] }));
      if (i < 5) parts.push(rod("让相邻梳指保持等距前向剪叉连杆", [x, 1.41, .54], [x + .218, 1.26, .54], .012), rod("与前连杆交叉而连接后剪叉杆", [x, 1.26, .55], [x + .218, 1.41, .55], .012));
    }
    return parts;
  } },
  // https://tech.atlanticgroup.it/equipment/vertical-tray-washing-machine-lv400/
  { name: "竖向夹盘式苗盘喷淋刷洗机", build: () => {
    const parts: ModelPart[] = [...legs(.83, 2.17, .55, .065), ...openTray("清洗机下方回收污水的连续长槽", [0, .55, 0], .91, 2.45, .23), ...conveyor("让苗盘竖立经过喷淋刷洗区窄底链带", [0, .91, 0], .17, 2.71), ...[-1, 1].map(side => ({ ...box("清洗腔两侧可见内部管路护罩", [side * .31, 1.23, 0], [.025, .86, 1.46], material.glass), opacity: .24 })), box("清洗腔上方可拆检修盖", [0, 1.68, 0], [.68, .035, 1.49], material.steel), ...[-1, 1].map(side => rod("限制苗盘倾倒上部两侧细导轨", [side * .036, 1.48, -1.29], [side * .036, 1.48, 1.29], .016)), ...[-1, 1].map(side => rod("窄底链带接回下部水槽承载短柱", [0, .76, side * 1.1], [0, .875, side * 1.1], .04)), box("循环泵接地底脚", [.59, .025, .25], [.25, .05, .27], material.dark), rod("侧置循环泵底部落地短支座", [.59, .05, .25], [.59, .31, .25], .065), cylinder("向喷淋梁供水侧置立式循环泵", [.59, .65, .25], [.22, .72, .22], material.dark), openPipe("循环泵接到回收水槽低位大管", [.59, .38, .25], [.44, .65, .25], .038), rod("干区控制柜回接清洗腔短支臂", [.315, 1.2, .57], [.46, 1.2, .57], .03), box("机旁电控柜", [.6, 1.2, .57], [.28, .51, .27], material.ivory)];
    for (const side of [-1, 1]) for (const z of [-.38, .31]) {
      parts.push(openPipe("苗盘左右表面喷淋立管", [side * .19, .95, z], [side * .19, 1.55, z], .025, .004));
      for (let i = 0; i < 4; i++) parts.push(openPipe("从立管朝向苗穴短喷口", [side * .19, 1.01 + i * .16, z], [side * .11, 1.01 + i * .16, z], .009, .003));
    }
    for (const side of [-1, 1]) parts.push(cylinder("在苗盘两面分别接触竖直软刷辊", [side * .115, 1.21, .02], [.13, .59, .13], material.wood));
    const rotation = new Quaternion().setFromEuler(new Euler(0, 0, Math.PI / 2));
    for (const value of plugTray("即将进入洗盘口的直立苗盘", [0, 0, 0])) { const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(0, 1.196, -1.03)); value.position = { x: p.x, y: p.y, z: p.z }; value.rotation = { x: 0, y: 0, z: 90 }; parts.push(value); }
    return parts;
  } },
  // https://www.urbinati.com/en/applications/irrigation-booms-systems/
  { name: "双轨悬挂往复式温室灌溉喷梁", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("将悬轨系统支起落地立柱", [x * 2.35, .03, z * 1.04], [x * 2.35, 3.3, z * 1.04], .085))), ...[-1, 1].map(side => box("沿温室纵向供喷梁来回行走固定长轨", [side * 2.35, 3.32, 0], [.08, .11, 2.6], material.steel)), rod("两轨顶端相连整根拉梁", [-2.35, 3.34, 1.06], [2.35, 3.34, 1.06], .065), rod("喷梁底端前后运行时中央承力横管", [-2.35, 2.85, 0], [2.35, 2.85, 0], .065), openPipe("沿整根喷梁横向供水主管", [-2.27, 2.78, .09], [2.27, 2.78, .09], .029, .005), ...[-1, 1].map(side => rod("把喷梁吊到双轨行走车上竖吊杆", [side * 2.35, 2.85, 0], [side * 2.35, 3.28, 0], .03)), ...[-1, 1].map(side => box("跨在轨道之上行走轮小车框", [side * 2.35, 3.43, 0], [.19, .1, .36], material.steel)), box("其中一端行走小车驱动箱", [2.49, 3.43, 0], [.17, .18, .21], material.dark), cord("随喷梁移动而弯曲垂下供水软管", [[-2.35, 3.32, .91], [-2.15, 3.02, .61], [-1.91, 3.06, .18], [-2.27, 2.78, .09]], .023, material.dark)];
    for (const side of [-1, 1]) for (const z of [-.12, .12]) parts.push(cylinder("小车接触轨道顶面运行轮", [side * 2.35, 3.415, z], [.08, .12, .08], material.dark, [0, 0, 90]));
    for (let i = 0; i < 12; i++) parts.push(openPipe("主管向下均匀分布灌溉喷头", [-2.18 + i * .396, 2.78, .09], [-2.18 + i * .396, 2.66, .09], .01, .003));
    return parts;
  } },
  // https://innovativegrowersequipment.com/racks-benches/rolling-benches/
  { name: "横移滚管式潮汐灌溉苗床", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(x => [-1, 1].map(z => rod("潮汐苗床固定下架落地四脚", [x * .63, .025, z * 1.35], [x * .63, .81, z * 1.35], .055))), ...[-1, 1].map(side => box("托住两条横移滚管固定下横梁", [0, .8, side * 1.35], [1.58, .08, .12], material.steel)), ...[-1, 1].map(side => cylinder("使苗床可左右移动长圆滚管", [side * .63, .89, 0], [.12, 3.73, .12], material.steel, [90, 0, 0])), ...openTray("整个苗床共用的连续蓄排浅盘", [0, .95, 0], 2.13, 4.03, .11), ...[-1, 1].map(side => box("盘沿下方防止移出台面端部挡块", [side * .96, .92, 0], [.08, .1, .27], material.dark)), cylinder("苗床外侧控制横移手轮轴", [1.15, .99, 0], [.023, .22, .023], material.steel, [0, 0, 90]), loop("苗床右沿横移手轮", [1.27, .99, 0], .14, .016, [0, 0, 90], material.steel), openPipe("浅盘低位与循环供液相接入口", [-.74, .972, -1.97], [-.74, .78, -1.97], .026, .004), openPipe("与进液口分开可控回流排液口", [.74, .972, -1.97], [.74, .72, -1.97], .034, .005), ...[-1, 1].map(side => box("回收液箱下方接地低脚", [side * .31, .035, -1.44], [.12, .07, .69], material.dark)), box("固定在苗床下方回收循环液箱", [0, .27, -1.44], [1.01, .45, .82], material.dark), cord("随苗床横移而松弯供水软管", [[-.74, .78, -1.97], [-.94, .58, -2.04], [-.51, .38, -1.79]], .022, material.dark), cord("从排液口回到固定液箱软管", [[.74, .72, -1.97], [.98, .51, -2.05], [.5, .37, -1.79]], .027, material.dark)];
    for (let i = 0; i < 10; i++) parts.push(box("浅盘底部让回液通过低凸筋", [0, .97, -1.75 + i * .39], [1.88, .018, .028], material.steel));
    for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; parts.push(rod("横移手轮内连接径向辐条", [1.27, .99, 0], [1.27, .99 + Math.cos(a) * .128, Math.sin(a) * .128], .01)); }
    return parts;
  } },
  // https://www.pubs.ext.vt.edu/content/pubs_ext_vt_edu/en/SPES/spes-463/spes-463.html
  { name: "双斜架薄膜营养液栽培槽设备", build: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => [-1, 1].map(z => rod("两端支起栽培槽A形斜承架", [side * 1.05, .08, z * 1.03], [0, 1.88, z * 1.03], .055))), ...[-1, 1].map(z => rod("固定A架底端横向拉梁", [-1.05, .12, z * 1.03], [1.05, .12, z * 1.03], .04)), rod("两个A架峰顶相连纵向稳定梁", [0, 1.88, -1.03], [0, 1.88, 1.03], .04), ...openTray("不与植孔共用空间的下方营养液回收箱", [0, .06, 0], .67, 1.23, .35), cylinder("回收液箱内循环小泵", [0, .23, .34], [.14, .25, .14], material.dark), openPipe("由循环泵供向高处进水侧竖直主管", [0, .34, .34], [0, 1.69, -1.35], .026, .004), openPipe("各栽培槽低端回水汇集横管", [-.88, .35, 1.39], [.88, .35, 1.39], .046, .005), openPipe("汇水总管返回底部营养液箱管口", [0, .35, 1.39], [0, .25, .56], .046, .005)];
    for (let level = 0; level < 3; level++) for (const side of [-1, 1]) {
      const y = .5 + level * .45, x = side * 1.05 * (1 - (y - .08) / 1.8), pitch = Math.PI / 180;
      parts.push(part("纵向带轻微回流坡度开放栽培槽", "extrude", material.ivory, [x, y, 0], [1, 1, 1], [1, 0, 0], { depth: 2.63, profile: [{ x: -.09, y: .075 }, { x: -.09, y: 0 }, { x: .09, y: 0 }, { x: .09, y: .075 }, { x: .077, y: .075 }, { x: .077, y: .012 }, { x: -.077, y: .012 }, { x: -.077, y: .075 }] }), piercedPanel("不以贴片冒充开孔植穴盖板", [x, y + .075 * Math.cos(pitch), .075 * Math.sin(pitch)], [[-.09, -1.315], [.09, -1.315], [.09, 1.315], [-.09, 1.315]], Array.from({ length: 5 }, (_, i) => Array.from({ length: 8 }, (_, j): [number, number] => { const a = j * Math.PI / 4; return [Math.cos(a) * .044, -1.03 + i * .515 + Math.sin(a) * .044]; })), .003, material.ivory, [1, 0, 0]), openPipe("高端从总管分配进入各层栽培槽细支管", [0, 1.69, -1.35], [x, y + .068, -1.32], .012, .003), openPipe("各层低端回水下落到汇水管管路", [x, y + .011, 1.32], [x, .35, 1.39], .02, .004));
      for (const end of [-1, 1]) {
        const portY = end < 0 ? .045 : .034, radius = end < 0 ? .012 : .02;
        parts.push(piercedPanel("栽培槽两端只留水口密封端盖", [x, y - end * 1.315 * Math.sin(pitch), end < 0 ? -1.312 : 1.32], [[-.09, 0], [.09, 0], [.09, .075], [-.09, .075]], [Array.from({ length: 8 }, (_, i): [number, number] => { const a = i * Math.PI / 4; return [Math.cos(a) * radius, portY + Math.sin(a) * radius]; })], .009, material.ivory, [-90, 0, 0]));
      }
    }
    parts.push(...[-1, 1].flatMap(x => [-1, 1].map(z => box("A形斜承架下方接地脚座", [x * 1.05, .04, z * 1.03], [.14, .08, .18], material.dark))), ...[-1, 1].map(side => box("营养液箱下方接地短脚", [0, .035, side * .45], [.55, .07, .12], material.dark)), ...[-1, 1].map(side => rod("末端汇水横管与斜承架之间斜托", [side * .88, .38, 1.03], [side * .8, .3, 1.39], .035)));
    return parts;
  } },
  // https://www.vienna-scientific.com/products/rhizobox-racks/
  // https://pmc.ncbi.nlm.nih.gov/articles/PMC6978282/
  { name: "倾斜透窗式植物根系观测箱台", build: () => {
    const rotation = new Quaternion().setFromEuler(new Euler(25 * Math.PI / 180, 0, 0));
    const boxParts: ModelPart[] = [box("根箱背面遮光后板", [0, .51, .043], [.67, 1, .012], material.dark), part("可直接观察根系透明前窗", "box", material.glass, [0, .51, -.042], [.67, 1, .006], [0, 0, 0], { opacity: .22, roughness: .16 }), ...[-1, 1].map(side => box("根箱左右密封窄侧壁", [side * .332, .51, 0], [.015, 1, .09], material.steel)), box("保留上部填土口根箱密封底边", [0, .022, 0], [.67, .044, .09], material.steel), box("与透明前窗分开薄层培养基质", [0, .5, .008], [.635, .938, .064], material.wood)];
    const roots: Triple[][] = [[[.02, .96, -.033], [.025, .74, -.033], [-.035, .49, -.033], [.01, .22, -.033], [-.02, .065, -.033]], [[.025, .75, -.033], [-.09, .64, -.033], [-.2, .46, -.033]], [[.01, .59, -.033], [.14, .47, -.033], [.23, .29, -.033]], [[-.03, .48, -.033], [-.17, .31, -.033], [-.21, .13, -.033]], [[.01, .26, -.033], [.1, .18, -.033], [.14, .07, -.033]]];
    for (const path of roots) boxParts.push(tapered("透明前窗内侧可见而非画在窗外根系支路", material.ivory, path, path.map((_, i) => i ? .0015 : .003)));
    for (const x of [-1, 1]) for (const y of [.13, .49, .86]) boxParts.push(cylinder("可拆透明窗两侧压紧螺扣", [x * .329, y, -.053], [.026, .016, .026], material.dark, [90, 0, 0]));
    for (const value of boxParts) {
      const p = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(rotation).add(new Vector3(0, .37, -.2));
      const q = new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180)).premultiply(rotation), e = new Euler().setFromQuaternion(q);
      value.position = { x: p.x, y: p.y, z: p.z }; value.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI };
    }
    const pivotY = .37 + .52 * Math.cos(25 * Math.PI / 180) - .02 * Math.sin(25 * Math.PI / 180), pivotZ = -.2 + .52 * Math.sin(25 * Math.PI / 180) + .02 * Math.cos(25 * Math.PI / 180);
    return [...boxParts, ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("两侧固定斜架从地脚支到根箱翻转轴", [x * .39, .025, z * .44], [x * .39, pivotY, pivotZ], .035))), rod("横穿根箱两侧中部角度调节轴", [-.45, pivotY, pivotZ], [.45, pivotY, pivotZ], .023), ...[-1, 1].map(side => rod("两侧斜架底部纵向长底脚", [side * .39, .025, -.46], [side * .39, .025, .46], .04)), loop("调节根箱倾角侧面锁紧手轮", [.45, pivotY, pivotZ], .065, .01, [0, 0, 90], material.dark)];
  } },
  // https://odvtechniek.nl/en/product/root-ball-packer/
  { name: "摆臂托球式苗木土球包装机", build: () => {
    const parts: ModelPart[] = [box("土球包装机构低位承重底架", [0, .12, .11], [1.72, .24, 1.67], material.dark), piercedPanel("可安装到外部动力机后侧开槽接板", [0, .61, .89], [[-.61, -.42], [.61, -.42], [.61, .63], [-.61, .63]], [[[-.43, -.22], [-.43, .32], [-.27, .32], [-.27, -.22]], [[.27, -.22], [.27, .32], [.43, .32], [.43, -.22]]], .065, material.steel, [-90, 0, 0]), ...[-1, 1].map(side => rod("后接板与底架相连两条抗弯斜撑", [side * .57, .3, .55], [side * .57, 1.02, .89], .07)), ...[-1, 1].map(side => rod("托住土球承窝两根倾斜下撑", [side * .52, .23, .1], [side * .27, .61, -.11], .065)), part("示意正在包装土球主体", "sphere", material.wood, [0, .86, -.13], [.72, .68, .72], [0, 0, 0]), rod("缠绳承环与驱动减速机之间传力短轴", [-.68, .7, .07], [-.57, .83, .07], .04), cylinder("缠绳环旁边驱动减速机", [-.68, .61, .07], [.23, .29, .23], material.dark), cylinder("摆臂底部可水平回转主铰座", [.66, .37, .58], [.27, .26, .27], material.steel), rod("从主铰座向上抬起粗摆臂", [.66, .42, .58], [.66, 1.67, .58], .1), rod("从高摆臂伸向土球中心上部托吊梁", [.66, 1.67, .58], [.03, 1.39, -.13], .085), cylinder("夹持机构上方竖直短执行缸", [.03, 1.33, -.13], [.1, .23, .1], material.dark), ...[-1, 1].map(side => rod("从吊梁夹住土球两侧软夹臂", [.03, 1.21, -.13], [side * .28, 1.05, -.13], .045, material.dark)), rod("驱动摆臂升起液压缸筒", [.66, .29, .04], [.66, .91, .3], .095, material.dark), rod("液压缸向上接到摆臂活塞杆", [.66, .91, .3], [.66, 1.16, .4], .045), cylinder("包装绳卷竖直承轴", [-.67, .42, -.48], [.025, .39, .025], material.steel), cylinder("向缠绳环供绳线卷", [-.67, .45, -.48], [.22, .26, .22], material.ivory)];
    const wrap = sweptProfile("给树干留装入口水平C形缠绳承环", material.steel, [[.56, -.035], [.63, -.035], [.63, .035], [.56, .035]], Math.PI * 1.5, 18); wrap.position = { x: 0, y: .83, z: -.13 }; wrap.rotation = { x: 0, y: 45, z: 0 }; parts.push(wrap);
    for (const angle of [30, 120, 210]) {
      const a = angle * Math.PI / 180;
      parts.push(rod("C形缠绳承环下方连到底架轴承柱", [Math.cos(a) * .59, .24, -.13 + Math.sin(a) * .59], [Math.cos(a) * .59, .74, -.13 + Math.sin(a) * .59], .05), rod("承住C形环底面而允许回转径向托轮", [Math.cos(a) * .555, .77, -.13 + Math.sin(a) * .555], [Math.cos(a) * .625, .77, -.13 + Math.sin(a) * .625], .1, material.dark));
    }
    for (let i = 0; i < 5; i++) { const a = i * Math.PI / 5; const path = Array.from({ length: 13 }, (_, j): Triple => { const b = j * Math.PI / 12; return [Math.cos(a) * Math.sin(b) * .365, .86 + Math.cos(b) * .345, -.13 + Math.sin(a) * Math.sin(b) * .365]; }); parts.push(tapered("沿土球表面贴合包装麻绳", material.ivory, path, path.map(() => .005))); }
    parts.push(cord("从线卷接向缠绳承环引绳", [[-.67, .56, -.48], [-.59, .72, -.4], [-.53, .83, -.13]], .005, material.ivory));
    return parts;
  } },
  // https://tta-iso.com/index.php/equipment/cuttingedge-double
  { name: "摆臂针爪式插穗自动扦插机", build: () => {
    const parts: ModelPart[] = [...legs(1.25, 1.4, .75, .06), box("切穗供给和苗盘进给分路宽台", [0, .79, 0], [1.39, .08, 1.53], material.steel), ...conveyor("分散插穗由相机下方经过供穗带", [-.33, .87, -.1], .32, 1.37), ...conveyor("苗盘停靠并移出目标带", [.33, .87, .1], .61, 1.37), ...plugTray("准备接收插穗的开放育苗穴盘", [.33, .944, .18]), cylinder("机台后侧固定插穗机械臂基座", [-.46, 1.01, .45], [.25, .4, .25], material.ivory), cylinder("机械臂绕竖轴回转肩关节", [-.46, 1.28, .45], [.22, .18, .22], material.dark), rod("肩轴到肘轴之间第一摆臂", [-.46, 1.34, .45], [.04, 1.34, .23], .115, material.ivory), cylinder("两个摆臂之间竖直肘关节", [.04, 1.34, .23], [.18, .16, .18], material.dark), rod("肘轴至取穗针爪第二摆臂", [.04, 1.34, .23], [.35, 1.34, -.02], .095, material.ivory), cylinder("针爪位置竖直升降执行套筒", [.35, 1.25, -.02], [.1, .29, .1], material.dark), rod("从执行套筒向下伸出取穗细轴", [.35, 1.11, -.02], [.35, 1.02, -.02], .022), ...[-1, 1].map(side => rod("以细夹口取穗两根针爪", [.35 + side * .016, 1.035, -.02], [.35 + side * .01, .976, -.02], .006)), rod("供穗相机与机台后端相连高立柱", [-.62, .83, .64], [-.62, 1.66, .64], .033), rod("从高立柱伸到供穗带上方相机横臂", [-.62, 1.66, .64], [-.33, 1.66, -.14], .03), box("俯视供穗带视觉相机", [-.33, 1.63, -.14], [.12, .11, .15], material.dark), cylinder("相机下方圆形观察镜头", [-.33, 1.565, -.14], [.062, .04, .062], material.glass), cord("随机械臂摆动针爪气管", [[-.46, 1.39, .45], [-.2, 1.48, .38], [.07, 1.46, .22], [.35, 1.39, -.02]], .012, material.dark), rod("控制面板接到机台前沿固定颈", [-.42, .79, -.74], [-.42, .79, -.83], .025), box("机台前端不遮挡取穗区域控制面板", [-.42, .73, -.83], [.31, .22, .09], material.ivory)];
    return parts;
  } },
  // https://www.yzmch.com/mushroom-production-line/bagging-and-packaging-equipment/enoki-mushroom-bagging-machine.html
  { name: "回转套筒下压式菌袋装料机", build: () => {
    const parts: ModelPart[] = [box("菌袋转台下方驱动矮柜", [0, .39, 0], [1.07, .78, 1.08], material.ivory), cylinder("菌袋套筒逐位分度旋转工作盘", [0, .82, 0], [1.28, .08, 1.28], material.steel), cylinder("分度工作盘下方回转传动套", [0, .73, 0], [.29, .24, .29], material.dark), ...[-1, 1].map(side => rod("承担下压反力后侧门架立柱", [side * .51, .78, .44], [side * .51, 2.18, .44], .075)), box("门架顶端把填料箱和压杆连在一起横梁", [0, 2.18, .13], [1.13, .13, .89], material.steel), ...[-1, 1].map(side => rod("高位基质料斗两侧吊到门架顶梁支架", [side * .51, 2.13, .44], [side * .33, 2.05, .44], .04)), soilBin("从高位为套筒供基质开放料斗", [0, 1.47, .44], [.72, .68], [.18, .18], .6), openPipe("料斗底部只落到后工位大口填料短管", [0, 1.48, .44], [0, 1.14, .44], .085, .01), cylinder("前工位把基质压实竖直压杆驱动", [0, 1.91, -.43], [.19, .43, .19], material.dark), rod("压杆驱动向下伸到压板活塞杆", [0, 1.7, -.43], [0, 1.33, -.43], .05), cylinder("压实基质而可退出套筒圆形压板", [0, 1.31, -.43], [.2, .035, .2], material.steel), rod("前压杆驱动后侧连接门架横梁短悬梁", [0, 2.15, .02], [0, 2.15, -.43], .08), ...[-1, 1].map(side => rod("前工位套筒用于左右打开退袋铰接竖轴", [side * .126, .86, -.43], [side * .126, 1.16, -.43], .017)), box("机柜正面可见控制面板", [.29, .6, -.549], [.29, .24, .015], material.dark)];
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 - Math.PI / 2, x = Math.cos(a) * .43, z = Math.sin(a) * .43;
      for (const side of [-1, 1]) { const sleeve = sweptProfile("从两半合拢而退袋大口承袋套筒", material.steel, [[.112, 0], [.123, 0], [.123, .3], [.112, .3]], Math.PI, 12); sleeve.position = { x, y: .86, z }; sleeve.rotation = { x: 0, y: side < 0 ? 0 : 180, z: 0 }; parts.push(sleeve); }
    }
    return parts;
  } },
  // https://patents.google.com/patent/CN219437764U/zh
  { name: "半圆夹槽推料式菌棒排针刺孔机", build: () => {
    const groove: { x: number; y: number }[] = [];
    for (let i = 0; i <= 10; i++) { const a = Math.PI + i * Math.PI / 10; groove.push({ x: Math.cos(a) * .14, y: Math.sin(a) * .14 }); }
    for (let i = 10; i >= 0; i--) { const a = Math.PI + i * Math.PI / 10; groove.push({ x: Math.cos(a) * .125, y: Math.sin(a) * .125 }); }
    const parts: ModelPart[] = [...legs(.76, 1.52, .75, .055), box("菌棒刺孔机工作台", [0, .79, 0], [.89, .08, 1.73], material.steel), part("上口开放且两端贯通半圆放棒槽", "extrude", material.steel, [0, .99, .08], [1, 1, 1], [0, 0, 0], { profile: groove, depth: 1.25 }), box("半圆放棒槽底部接到机台长托座", [0, .843, .08], [.2, .026, 1.27], material.dark), ...[-1, 1].map(side => rod("刺针门架支在工作台两侧立柱", [side * .34, .83, .05], [side * .34, 1.66, .05], .045)), box("上排针升降缸固定门架横梁", [0, 1.66, .05], [.78, .09, .19], material.steel), cylinder("推动整块刺针板向下运动执行缸", [0, 1.51, .05], [.11, .28, .11], material.dark), rod("执行缸向下连到刺针板活塞杆", [0, 1.38, .05], [0, 1.28, .05], .03), box("刺孔针逐根安装平板针座", [0, 1.27, .05], [.18, .04, .79], material.steel), rod("位于后端推动菌棒前行长推料丝杆", [0, .89, .34], [0, .89, .97], .024), box("丝杆后端驱动电机", [0, .89, .97], [.17, .17, .21], material.dark), box("丝杆滑块与菌棒推出板之间短推座", [0, .94, .54], [.09, .1, .11], material.steel), part("嵌在半圆槽内推料端板", "extrude", material.dark, [0, .99, .54], [1, 1, 1], [0, 0, 0], { depth: .026, profile: Array.from({ length: 12 }, (_, i) => { const a = Math.PI + i * Math.PI / 11; return { x: Math.cos(a) * .122, y: Math.sin(a) * .122 }; }) }), ...openTray("位于机前低位的出棒接料槽", [0, .59, -1.02], .46, .49, .14), ...[-1, 1].map(side => rod("接料槽前缘不浮空短支脚", [side * .18, .025, -1.2], [side * .18, .59, -1.2], .03))];
    for (let i = 0; i < 14; i++) { const x = (i % 2 - .5) * .085, z = -.27 + Math.floor(i / 2) * .107; parts.push(rod("位于半圆槽上方细长刺针", [x, 1.25, z], [x, 1.14, z], .008), part("刺针下端尖锥头", "cone", material.steel, [x, 1.132, z], [.008, .016, .008], [180, 0, 0])); }
    return parts;
  } },
  // https://www.urbinati.com/en/product/soil-bale-shavering/
  { name: "竖升压包横刨式泥炭解包机", build: () => {
    const parts: ModelPart[] = [box("泥炭大包提升塔落地承台", [0, .12, 0], [1.69, .24, 1.74], material.dark), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("提升整包基质四角固定高立柱", [x * .71, .24, z * .71], [x * .71, 3.42, z * .71], .09))), box("塔顶承受提升链拉力横梁", [0, 3.43, .71], [1.59, .14, .19], material.steel), ...[-1, 1].map(side => box("保持基质包湿度左右封闭护板", [side * .735, 1.88, 0], [.035, 3.02, 1.45], material.ivory)), box("提升塔后端封闭防护壁", [0, 1.88, .735], [1.44, 3.02, .035], material.ivory), box("把整块泥炭包逐渐送向横刨齿升降托板", [0, .63, 0], [1.31, .12, 1.31], material.steel), ...[-1, 1].map(side => rod("升降托板沿塔后侧上下导向固定轴", [side * .53, .26, .64], [side * .53, 3.3, .64], .03)), ...[-1, 1].map(side => box("升降托板两侧包住导轴滑套", [side * .53, .67, .64], [.09, .24, .09], material.dark)), ...[-1, 1].map(side => rod("驱动托板上升而连接到塔顶长承力链", [side * .56, .73, .69], [side * .56, 3.39, .69], .015, material.dark)), cylinder("塔顶同时牵引左右升降链共用卷轴", [0, 3.39, .69], [.19, 1.29, .19], material.dark, [0, 0, 90]), box("卷轴右侧连到高塔驱动箱", [.88, 3.38, .69], [.27, .28, .31], material.dark), box("保持竖直整包形态压缩基质块", [0, 1.66, .06], [1.13, 1.92, 1.13], material.wood), ...[-1, 1].map(side => box("横刨机构跨在提升包两侧支承座", [side * .76, 2.7, -.24], [.23, .27, .76], material.steel)), box("沿整包顶面横向运动刨齿带", [0, 2.68, -.34], [1.39, .055, .46], material.dark), box("刨齿带左端驱动箱", [-.95, 2.7, -.34], [.25, .29, .47], material.dark), box("横刨剥落基质向外导出前斜槽", [0, 2.38, -.92], [1.3, .045, .95], material.steel, [32, 0, 0]), ...[-1, 1].map(side => rod("前斜导料槽回接塔柱斜撑", [side * .55, 1.86, -.71], [side * .55, 2.22, -1.24], .035)), box("前侧提升和刨齿控制柜", [.97, 1.25, -.42], [.32, .51, .34], material.ivory)];
    for (let i = 0; i < 11; i++) parts.push(box("横向刨齿带上凸出钢齿", [-.62 + i * .124, 2.63, -.34], [.035, .09, .38], material.steel, [0, 0, 17]));
    parts.push(rod("干区控制柜与提升塔立柱连接颈", [.71, 1.25, -.42], [.83, 1.25, -.42], .055));
    return parts;
  } },
  // https://www.urbinati.com/en/product/automatic-destacker/
  { name: "夹缘剥叠式空花盆分配机", build: () => {
    const parts: ModelPart[] = [...legs(.61, 1.03, .7, .045), ...conveyor("剥下单只空盆后输出窄带", [0, .77, -.2], .32, 1.3), ...[-1, 1].map(side => box("对向剥盆机构固定侧座", [side * .28, .98, .2], [.17, .3, .38], material.ivory)), ...[-1, 1].map(side => cylinder("驱动夹缘板水平靠近盆沿气缸", [side * .31, 1.04, .2], [.065, .25, .065], material.dark, [0, 0, 90])), ...[-1, 1].map(side => rod("由侧座伸向最下层盆沿剥盆活动轴", [side * .2, 1.04, .2], [side * .109, 1.04, .2], .018)), ...[-1, 1].map(side => box("只抓住最下层空盆外沿薄剥盆叉片", [side * .102, 1.045, .2], [.047, .014, .14], material.steel)), ...[-1, 1].map(side => box("托住次下层盆堆而不堵住输出夹缘片", [side * .108, 1.103, .2], [.035, .012, .12], material.dark)), box("盆堆上方保持长导杆间距后部固定横架", [0, 1.73, .36], [.48, .05, .1], material.steel), ...[-1, 1].map(side => rod("后横架落到剥盆侧座细立杆", [side * .21, 1.09, .36], [side * .21, 1.73, .36], .025)), ...[1.08, 1.72].map(y => loop("将四根导杆连在一起上下盆堆护环", [0, y, .2], .152, .012, [0, 0, 0], material.steel)), ...[-1, 1].map(side => rod("下护环从剥盆侧座取得支承短连接轴", [side * .2, 1.08, .2], [side * .152, 1.08, .2], .02)), box("机侧触发和分配控制盒", [.39, .91, -.08], [.2, .28, .22], material.dark)];
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; parts.push(rod("把整叠花盆限制在剥盆口正上长导杆", [Math.cos(a) * .152, 1.07, .2 + Math.sin(a) * .152], [Math.cos(a) * .152, 1.73, .2 + Math.sin(a) * .152], .014)); }
    for (let i = 0; i < 7; i++) parts.push(part("以盆缘套叠且仍能看到开放上口空花盆", "lathe", material.wood, [0, .89 + i * .047, .2], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .077, y: 0 }, { x: .11, y: .18 }, { x: .119, y: .18 }, { x: .119, y: .19 }, { x: .105, y: .19 }, { x: .071, y: .006 }, { x: 0, y: .006 }] }));
    return parts;
  } },
  // https://www.netafim.com/en/products-and-solutions/tools/fertigation/fertikit/
  { name: "多喉文丘里式水肥混配机架", build: () => {
    const parts: ModelPart[] = [...legs(1.22, .63, .15, .07), ...[-1, 1].flatMap(x => [-1, 1].map(z => rod("把混配歧管固定到地脚四根立柱", [x * .61, .15, z * .315], [x * .61, 1.61, z * .315], .04))), ...[-1, 1].flatMap(side => [.46, 1.48].map(y => rod("混配歧管下方接到机架前后柱承梁", [side * .61, y - .06, -.315], [side * .61, y - .06, .315], .035))), ...[.46, 1.48].map(y => openPipe("连通全部配肥通道横向共用歧管", [-.66, y, .03], [.66, y, .03], .045, .006)), ...[-1, 1].map(side => rod("机架顶部前后相连固定短梁", [side * .61, 1.6, -.315], [side * .61, 1.6, .315], .035)), cylinder("维持旁路压差卧式增压泵", [.79, .34, .17], [.23, .42, .23], material.dark, [90, 0, 0]), box("增压泵下方落地泵座", [.79, .12, .17], [.38, .24, .59], material.steel), openPipe("低位歧管与增压泵出口连接段", [.65, .46, .03], [.79, .34, .03], .037, .005), openPipe("高位歧管对外接入灌溉主水管开放接口", [.66, 1.48, .03], [1, 1.48, .03], .055, .007), box("混配架顶端控制器机壳", [0, 1.78, .16], [.53, .32, .2], material.ivory), box("控制器面向通道正前方显示窗", [0, 1.8, .054], [.38, .17, .012], material.glass), ...[-1, 1].map(side => rod("控制器从机架顶梁向上连接支座", [side * .2, 1.59, .17], [side * .2, 1.65, .17], .028))];
    for (let i = 0; i < 4; i++) {
      const x = -.45 + i * .3;
      parts.push(part("内外轮廓收缩后扩张文丘里注入喉", "lathe", material.dark, [x, .85, .03], [1, 1, 1], [0, 0, 0], { profile: [{ x: .03, y: 0 }, { x: .017, y: .14 }, { x: .03, y: .31 }, { x: .023, y: .31 }, { x: .01, y: .14 }, { x: .023, y: 0 }, { x: .03, y: 0 }] }), openPipe("文丘里下端连接低位歧管支管", [x, .46, .03], [x, .85, .03], .024, .004), openPipe("文丘里上端连接高位歧管支管", [x, 1.16, .03], [x, 1.48, .03], .024, .004), part("位于喉侧用于观察流量透明浮子管", "lathe", material.glass, [x, .69, -.13], [1, 1, 1], [0, 0, 0], { profile: [{ x: .017, y: 0 }, { x: .026, y: .29 }, { x: .021, y: .29 }, { x: .012, y: 0 }, { x: .017, y: 0 }], opacity: .32 }), cylinder("透明浮子管内可见短浮子", [x, .81, -.13], [.017, .027, .017], material.red), openPipe("浮子管接入文丘里侧喉短弯接", [x, .99, .018], [x, .98, -.13], .014, .003), cord("每个通道连接外部肥液吸入软管", [[x, .69, -.13], [x, .39, -.23], [x, .13, -.44]], .01, material.dark), box("支管开关阀执行方块", [x, 1.31, .03], [.083, .11, .078], material.steel));
    }
    return parts;
  } },
  // https://igeba.de/en/product/tf-35/ 仅器材造型，不包含药液、燃料操作或喷施参数。
  { name: "手提长管脉冲热烟雾机", itemType: "器物", build: () => {
    const parts: ModelPart[] = [...[-1, 1].map(side => rod("整机放下时接地两条纵向底脚", [side * .103, .025, -.44], [side * .103, .025, .67], .03)), box("连接双底脚并托住两只储罐后横台", [0, .065, .4], [.28, .05, .48], material.steel), cylinder("机身后侧不锈钢药液储罐", [0, .2, .38], [.245, .26, .245], material.steel), cylinder("与药液罐分开侧边小燃料罐", [.17, .17, .51], [.135, .17, .135], material.steel), ...[[0, .344, .38], [.17, .265, .51]].map(position => cylinder("储罐顶部可旋开密封加注盖", position as Triple, [.045, .025, .045], material.dark)), part("脉冲燃烧室前端渐缩厚壁通筒", "lathe", material.steel, [0, .21, .1], [1, 1, 1], [90, 0, 0], { profile: [{ x: .041, y: -.15 }, { x: .064, y: -.07 }, { x: .064, y: .09 }, { x: .037, y: .17 }, { x: .03, y: .17 }, { x: .057, y: .085 }, { x: .057, y: -.065 }, { x: .034, y: -.15 }, { x: .041, y: -.15 }] }), openPipe("从燃烧室延伸出去而开放长雾管", [0, .21, -.04], [0, .21, -.72], .037, .006), ...[-.59, -.09].map(z => loop("长雾管外侧隔热护笼端环", [0, .21, z], .075, .008, [90, 0, 0], material.steel)), cylinder("后端手动气泵竖直细筒", [-.09, .235, .63], [.043, .29, .043], material.steel), rod("手动气泵筒顶端伸出活塞杆", [-.09, .38, .63], [-.09, .43, .63], .013), rod("气泵活塞杆顶端横向握柄", [-.16, .43, .63], [-.02, .43, .63], .025, material.dark), tapered("整机上部连接前后机身提握框", material.dark, [[0, .26, .08], [0, .46, .15], [0, .46, .48], [0, .32, .55]], [.015, .018, .018, .015]), cord("从药液储罐接向长雾管根部细输液管", [[.08, .19, .35], [.11, .24, .16], [.04, .21, -.04]], .005, material.dark), rod("前端双底脚之间连通短横托", [-.103, .04, -.41], [.103, .04, -.41], .025), rod("前端雾管下方落到长底脚短支座", [0, .04, -.41], [0, .18, -.41], .026)];
    for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(rod("围住高温管而留下通风空隙护笼条", [Math.cos(a) * .075, .21 + Math.sin(a) * .075, -.59], [Math.cos(a) * .075, .21 + Math.sin(a) * .075, -.09], .007)); }
    return parts;
  } },
];
