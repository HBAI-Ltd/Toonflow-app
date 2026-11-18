import type { ModelPart, Triple } from "../assetModelParts";
import { glazedWall } from "./modernResidenceSpaceBatchOne";
import { waistStair } from "./publicSpaceBatchFourteen";
import { slopePanel } from "./vernacularWorldBatchOne";
import { solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { packMeshes } from "./vernacularWorldBatchThirteen";
import { box, design, type ArchitecturePrototype } from "./structures";

const stone = "#b0b4a6", timber = "#9c8262", pale = "#d1c8b5", roof = "#6e7f79", textile = "#9eaa9d";

function angledParlorFamilyHouse(): ModelPart[] {
  const outline: [number, number][] = [[-6, -4], [-4.5, -6], [-1.5, -6], [0, -4], [5, -4], [5, 6], [-6, 6]], hole: [number, number][] = [[1.32, -2.2], [2.68, -2.2], [2.68, 2.1], [1.32, 2.1]];
  const eaves = outline.map(([x, z]): [number, number] => [x * 1.06, .5 + (z - .5) * 1.06]);
  const parts: ModelPart[] = [
    box("折角整宅各外壁与侧门廊共同落地的完整宽石基础", -.5, .11, 0, 12.2, .22, 13.2, stone),
    hardFloor("三面前窗室偏置侧厅与后餐厨实际相连的完整折角地板", timber, outline, .08, [0, .22, 0]),
    hardFloor("非对称整宅上层私厅与前后卧室保留直跑内梯真长井的楼板", timber, outline, .2, [0, 3.2, 0], [hole]),
    hardFloor("折角宅全部上层私室与楼梯厅共同闭合的连续顶棚", pale, outline, .14, [0, 6.16, 0]),
    box("侧向入户门廊真正落地且与首层木地面相平的宽石台", 5.9, .15, -2.3, 1.8, .3, 2.4, stone),
    box("侧门廊石台向庭面连续降下的低踏步", 7.05, .075, -2.3, .5, .15, 1.4, stone),
    box("厨房后门外真实接地的独立花园踏台", 4, .15, 6.5, 1.6, .3, 1, stone),
    box("侧门廊屋盖真正嵌入主宅外壁的完整低平顶", 5.8, 3.15, -2.3, 2, .2, 2.6, roof),
  ];
  for (const z of [-3.35, -1.25]) parts.push(box("侧门廊屋盖从低石台直接承起的完整木柱", 6.5, 1.675, z, .18, 2.75, .18, timber));
  for (const [base, top] of [[.3, 3.2], [3.4, 6.3]]) {
    const upper = base! > 1;
    for (let edge = 0; edge < 4; edge++) {
      const a = outline[edge]!, b = outline[edge + 1]!, length = Math.hypot(b[0] - a[0], b[1] - a[1]);
      parts.push(...glazedWall(edge < 3 ? "多面前厅与楼上前卧室真正沿折角周界采光的厚外壁" : "偏置侧厅与上层书桌廊朝前院开真窗的完整前壁", a, b, base!, top!, [[0, base! + .85, edge < 3 ? length * .5 : 2.3, 1.6]]));
    }
    parts.push(
      ...glazedWall("东侧门廊真实入户口与后厨房或卫浴窗共同开在长外壁中", [5, -4], [5, 6], base!, top!, upper ? [[-3.3, 4.25, 1.4, 1.6], [-.4, 4.25, 1.8, 1.6], [3.3, 5.1, 1.5, .8]] : [[-.4, 1.15, 2, 1.6], [3.3, 1.35, 1.6, 1.35]], upper ? [] : [[-3.3, .3, 1.1, 2.2]]),
      ...glazedWall("后院立面为餐厨或卧浴与窄私廊分别保留实际门窗", [5, 6], [-6, 6], base!, top!, upper ? [[2.5, 4.25, 2.3, 1.6], [-1.1, 4.25, .6, 1.6], [-3.8, 5.1, 1.4, .8]] : [[2.5, 1.15, 2.5, 1.6]], upper ? [] : [[-4.5, .3, .95, 2.15]]),
      ...glazedWall("前窗室与后餐厅或前后卧室分别真实透光的长西外墙", [-6, 6], [-6, -4], base!, top!, [[-2, base! + .85, 2.5, 1.6], [3, base! + .85, 2.1, 1.6]]),
    );
  }
  parts.push(
    ...glazedWall("偏置入户厅向前多面会客室独立进入的完整实门隔墙", [0, -4], [0, 6], .3, 3.2, [], [[-3.3, .3, 1.1, 2.2], [2.8, .3, 1, 2.15]]),
    ...glazedWall("前会客室直接接入后餐厅而不穿厨务的真实宽内门", [-6, 0], [0, 0], .3, 3.2, [], [[.2, .3, 1.7, 2.3]]),
    ...glazedWall("偏置侧厅从内梯旁通往后厨的真实独立服务门", [0, 2.65], [5, 2.65], .3, 3.2, [], [[1.5, .3, .95, 2.15]]),
    ...glazedWall("上层偏置私厅分接前后两间卧室的独立实门", [0, -4], [0, 6], 3.4, 6.3, [], [[-3.3, 3.4, .9, 2.15], [2.8, 3.4, .9, 2.15]]),
    ...glazedWall("前多面卧室与后卧室之间真正接入顶棚的完整承墙", [-6, 0], [0, 0], 3.4, 6.3, []),
    ...glazedWall("上层后卫浴与梯前落脚私厅之间封合的横隔壁", [1.2, 3.6], [5, 3.6], 3.4, 6.3, []),
    ...glazedWall("后卫浴经侧窄私廊独立进入而不借道后卧室的真实门壁", [1.2, 3.6], [1.2, 6], 3.4, 6.3, [], [[-.65, 3.4, .8, 2.1]]),
    waistStair("偏置侧厅中的十八级完整薄底内梯穿真长井直接接上私厅", 2, .3, -3, 1.2, 18, 3.1 / 18, .28),
    box("十八级内梯最后踏面与完整上层楼板实际搭接的落脚台", 2, 3.3, 2.2, 1.5, .2, .4, timber),
  );
  const guards: ModelPart[] = [];
  for (const side of [-1, 1]) {
    const x = 2 + side * .55;
    guards.push(meshBeam("偏置内梯两侧随十八级真实阶程升起的细木扶手", [x, .3 + 3.1 / 18 + .9, -2.86], [x, 4.3, 1.9], .05, timber), meshBeam("内梯扶手低端真实支在首级踏面的立柱", [x, .3 + 3.1 / 18, -2.86], [x, .3 + 3.1 / 18 + .9, -2.86], .05, timber), meshBeam("内梯扶手高端真实支在末级踏面的立柱", [x, 3.4, 1.9], [x, 4.3, 1.9], .05, timber));
  }
  for (const [a, b] of [[[1.3, -2.22], [1.3, 2.12]], [[1.3, -2.22], [2.7, -2.22]], [[2.7, -2.22], [2.7, 2.12]]] as [[number, number], [number, number]][]) guards.push(meshBeam("上层偏置私厅围真实梯井并为末级留出口的完整护栏", [a[0], 4.4, a[1]], [b[0], 4.4, b[1]], .05, timber));
  for (const [x, z] of [[1.3, -2.22], [1.3, 2.12], [2.7, -2.22], [2.7, 2.12]]) guards.push(meshBeam("梯井木栏各端实际落在完整上层木楼面上的独立立柱", [x!, 3.4, z!], [x!, 4.4, z!], .05, timber));
  parts.push(...packMeshes("非对称独户宅偏置长内梯及上井口真实接承的安全栏架", timber, guards));
  const framing: ModelPart[] = [meshBeam("偏置中承墙顶到折角屋盖高脊的完整短王柱", [0, 6.25, .5], [0, 8.24, .5], .18, timber), meshBeam("内承墙和两侧外壁共同承住的完整屋架横系木", [-6.1, 6.25, .5], [5.1, 6.25, .5], .2, timber)];
  for (let edge = 0; edge < outline.length; edge++) {
    const a = eaves[edge]!, b = eaves[(edge + 1) % eaves.length]!, wall = outline[edge]!;
    parts.push(slopePanel("随全部多面外周界连续收合并真正封住整宅的独立髋屋坡", [[a[0], 6.2, a[1]], [b[0], 6.2, b[1]], [0, 8.4, .5]], .16, roof));
    framing.push(meshBeam("各折角完整外壁墙头与高脊真实交接的承屋斜木", [wall[0], 6.25, wall[1]], [0, 8.24, .5], .18, timber));
  }
  parts.push(...packMeshes("真实折角外墙及中承墙共同托起的完整髋屋木框架", timber, framing));
  const furniture: Record<string, ModelPart[]> = { [timber]: [], [pale]: [], [stone]: [], [textile]: [] };
  const furnish = (name: string, color: string, x: number, y: number, z: number, w: number, h: number, d: number) => furniture[color]!.push(solidBox(name, x, y, z, w, h, d, color));
  for (const [x, z, head] of [[-3, -3.2, -4.25], [-4, 3.8, 4.85]]) {
    furnish("上层前后独立卧室真正落在完整折角楼面上的双人床架", timber, x!, 3.6, z!, 1.8, .4, 2.1);
    furnish("上层完整双人床架上贴合的织物床垫", pale, x!, 3.86, z!, 1.76, .12, 2.06);
    furnish("前后卧床各自与木地面实际接合的完整床头板", timber, x!, 4.02, head!, 1.85, 1.24, .12);
  }
  for (const z of [-1.3, 5.1]) furnish("上层卧室内侧避开门窗而独立落地的完整长衣柜", pale, -.65, 4.5, z, .6, 2.2, 1.5);
  furnish("首层多面前会客室靠西外壁实际落地的长沙发座", textile, -4.9, .52, -1.8, 1.1, .44, 2.7);
  furnish("会客长沙发后端与座面相接的高软靠背", textile, -5.37, .94, -1.8, .16, .9, 2.7);
  furnish("多面前会客室低茶几真正落地的完整宽底座", timber, -3, .48, -1.8, 1.1, .36, 1.6);
  furnish("低茶几宽底座上实际贴合的薄桌面", stone, -3, .69, -1.8, 1.25, .06, 1.8);
  furnish("后餐厅长餐桌实际落地的双宽脚之一", timber, -4, .67, 3.4, .3, .74, .85);
  furnish("后餐厅长餐桌实际落地的双宽脚之二", timber, -2, .67, 3.4, .3, .74, .85);
  furnish("后餐厅两宽脚上真正相接的完整长桌面", timber, -3, 1.08, 3.4, 2.8, .08, 1.2);
  for (const side of [-1, 1]) {
    furnish("后餐桌两侧真正落到木地面的完整长凳脚", timber, -3, .49, 3.4 + side * 1.1, 2.1, .38, .35);
    furnish("后餐厅长凳脚上实际相接的织物凳面", textile, -3, .71, 3.4 + side * 1.1, 2.4, .06, .5);
  }
  furnish("后厨房沿外侧窗下真实落地的完整长地柜", timber, 4.5, .72, 4.15, .65, .84, 2.15);
  furnish("后厨房长地柜上真正相接的连续操作台面", stone, 4.5, 1.18, 4.15, .7, .08, 2.2);
  furnish("厨房内侧避开前后通门的完整落地冰箱", pale, .7, 1.23, 5.2, .75, 1.86, .8);
  furnish("上层书桌廊前壁下方实际落地的完整矮书柜", timber, 3.4, 4.05, -3.6, 2, 1.3, .6);
  furnish("书桌廊前端落到完整木楼板的宽桌脚", timber, 3.8, 3.77, -2.1, .5, .74, .6);
  furnish("书桌宽脚上真正接合的完整薄桌面", timber, 3.8, 4.18, -2.1, 1.6, .08, .8);
  furnish("上层独用卫浴后角实际落地的完整淋浴托盘", pale, 4.2, 3.45, 4.9, 1.3, .1, 1.3);
  furnish("上层卫浴近内侧壁实际落地的坐便支座", pale, 2.05, 3.6, 5, .44, .4, .5);
  furnish("坐便支座上完整相接的浅色座体", pale, 2.05, 3.84, 5, .6, .12, .75);
  furnish("坐便器后沿真实贴合的完整水箱", pale, 2.05, 4.13, 5.32, .56, .7, .18);
  furnish("卫浴前侧避开实门的完整落地洗手柜", timber, 4, 3.82, 3.95, .7, .84, .6);
  furnish("洗手台柜上真正贴合的浅色盆台", pale, 4, 4.3, 3.95, .75, .12, .65);
  for (const [color, pieces] of Object.entries(furniture)) parts.push(...packMeshes("折角独户宅会客餐厨前后卧室与独用卫浴实际接地的固定家具", color, pieces));
  return parts;
}

export const suburbanResidenceSpaceBatchTwoDesigns: ArchitecturePrototype[] = [
  design("斜角前窗室偏置侧厅家庭宅", "三面折角窗室与偏置侧入口共同组成完整非对称周界，前会客室直接接后餐厅，侧门厅内的长直梯经真实楼板井连接上层私厅；前后两卧与后卫浴分别独立入户，窄私廊绕开卫浴，完整多边楼面和随折角收合的木髋屋架构成整宅", angledParlorFamilyHouse, "建筑", "欧式"),
];
