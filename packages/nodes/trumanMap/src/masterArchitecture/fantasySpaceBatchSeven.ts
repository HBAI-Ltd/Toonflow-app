import { part, type ModelPart } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { base, box, design, rail } from "./structures";
import { barrelRoof } from "./spatialShells";
import { stairFlight } from "./fantasySpaceBatchFive";

const cliff = "#a5a797", stone = "#b5b8a9", wood = "#8a765b", roof = "#738984";

function cliffMonastery(): ModelPart[] {
  const parts: ModelPart[] = [base(74, 24), part("横跨整个修道院背后的完整天然崖腹", "extrude", cliff, [0, 0, 5.5], [1, 1, 1], [0, 0, 0], { depth: 9, profile: [{ x: -36, y: 0 }, { x: 36, y: 0 }, { x: 36, y: 33 }, { x: 29, y: 35 }, { x: 24, y: 34 }, { x: 16, y: 37 }, { x: 9, y: 35 }, { x: 3, y: 38 }, { x: -4, y: 36 }, { x: -10, y: 35 }, { x: -18, y: 37 }, { x: -25, y: 34 }, { x: -36, y: 35 }] })];
  for (let level = 0; level < 4; level++) {
    const start = -32 + level * 14.2, bottom = .4 + level * 7, landing = start + 13.05, floor = bottom + 7;
    for (const [first, count] of [[0, 20], [20, 15]]) {
      const flight = stairFlight(0, 0, bottom, first!, count!, .2, .35);
      flight.position.x = start; flight.position.z = -10; flight.rotation.y = 90;
      parts.push(flight);
    }
    parts.push(box("分段登山长梯中间保留水平转入平台", landing, floor - .1, -10, 2.4, .2, 1.9, wood),
      rail([start, bottom + .9, -10.68], [start + 12.075, floor + .9, -10.68], .065, wood),
      rail([start, bottom + .1, -10.68], [start, bottom + .9, -10.68], .065, wood), rail([start + 12.075, floor, -10.68], [start + 12.075, floor + .9, -10.68], .065, wood));
    parts.push(box("崖腹悬殿独立且完整的平整地坪", landing, floor - .1, -4, 11.4, .2, 6.8, wood),
      barrelRoof("悬殿两边实墙直接承托的完整薄券顶", 5.5, .2, 7.3, [landing, floor + 4, -4], roof), box("悬殿背向崖腹的连续墙", landing, floor + 2, -.65, 11.2, 4, .22, stone),
      ...[-1, 1].map(side => box("悬殿两侧从楼板升到券脚的承重墙", landing + side * 5.5, floor + 2, -4, .25, 4, 6.8, stone)),
      ...[-1, 1].map(side => box("前门两边留出中央门洞的殿墙", landing + side * 3.6, floor + 2, -7.3, 4, 4, .2, stone)),
      ...[-1, 1].map(side => rail([landing + side * 3.8, floor - 3.1, 2], [landing + side * 3.8, floor - .1, -6.1], .4, wood)),
      box("水平梯台接到悬殿正门的短栈桥", landing, floor - .1, -8.7, 2.4, .2, 3.2, wood));
    for (const side of [-1, 1]) {
      parts.push(rail([landing + side * 1.5, floor + .9, -7.4], [landing + side * 5.45, floor + .9, -7.4], .08, wood));
      for (const x of [1.5, 5.45]) parts.push(rail([landing + side * x, floor, -7.4], [landing + side * x, floor + .9, -7.4], .06, wood));
    }
  }
  return parts;
}

function raisedGrid(z: number): ModelPart {
  const holes: [number, number][][] = Array.from({ length: 6 }, (_, index) => { const left = -3.22 + index * 1.08; return [[left, .22], [left + .87, .22], [left + .87, 3.55], [left, 3.55]]; });
  const gate = polygon("门槽之间升起并保留通人净空的整幅格闸", wood, [[-3.5, 0], [3.5, 0], [3.5, 3.8], [-3.5, 3.8]], .18, [0, 3.3, z], holes);
  gate.rotation.x = -90;
  return gate;
}

function garrisonCourt(): ModelPart[] {
  const parts: ModelPart[] = [base(34, 44), box("双闸营院内部平整公共训练庭", 0, .3, 0, 31, .24, 39, stone)];
  for (const side of [-1, 1]) {
    parts.push(box("完整营房翼楼的连续木楼板", side * 12, .5, 0, 7.4, .2, 32, wood), box("营房翼楼外侧连续厚墙", side * 15.5, 2.6, 0, .3, 4.4, 32, stone),
      part("覆盖整个营房翼楼的连续高坡屋面", "extrude", roof, [side * 12, 4.7, 0], [1, 1, 1], [0, 0, 0], { depth: 32.5, profile: [{ x: -4, y: 0 }, { x: 0, y: 2.7 }, { x: 4, y: 0 }, { x: 3.94, y: -.2 }, { x: 0, y: 2.48 }, { x: -3.94, y: -.2 }] }));
    for (const z of [-15, -5, 5, 15]) parts.push(box("营房按开间分开的真实横隔墙", side * 12, 2.6, z, 7.1, 4.4, .2, stone));
    for (const z of [-10, 0, 10]) parts.push(...[-1, 1].map(end => box("营房独立门洞两旁的厚墙垛", side * 8.5, 2.6, z + end * 3.1, .23, 4.4, 3.8, stone)),
      box("营房门洞上方的过梁墙段", side * 8.5, 3.9, z, .23, 1.8, 2.4, stone));
    const shed = part("庭院内环廊向营房墙倾接的长遮檐", "box", roof, [side * 6.7, 3.9, 0], [3.6, .18, 32], [0, 0, side * 8]);
    parts.push(shed);
    for (const z of [-12, -6, 0, 6, 12]) parts.push(box("内环廊向庭院开放的真实落地木柱", side * 5.3, 2.05, z, .18, 3.3, .18, wood));
    parts.push(box("营院两侧完整外围墙", side * 16.2, 2.7, 0, .4, 4.8, 40, stone), box("营院前翼与门塔相接的护墙", side * 12, 2.7, -20, 8.2, 4.8, .4, stone),
      box("营院后部与服务大厅相接的护墙", side * 12, 2.7, 20, 8.2, 4.8, .4, stone));
    const x = side * 6;
    const topFloor = polygon("门塔巡守台保留真实登层梯洞", wood, [[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]], .26, [x, 7.67, -18.4], [[[side * 1.25 - .65, 1.15], [side * 1.25 + .65, 1.15], [side * 1.25 + .65, 2.3], [side * 1.25 - .65, 2.3]]]);
    const ladder = polygon("从门塔底层一直穿过上层梯洞的木爬梯", wood, [[-.5, 0], [.5, 0], [.5, 7.6], [-.5, 7.6]], .14, [x + side * 1.25, .7, -16.7], Array.from({ length: 20 }, (_, index): [number, number][] => [[-.375, .22 + index * .36], [.375, .22 + index * .36], [.375, .44 + index * .36], [-.375, .44 + index * .36]]));
    ladder.rotation.x = -90;
    parts.push(box("门塔底部平层", x, .5, -18.4, 5.2, .24, 5.2, wood), topFloor, ladder,
      ...[-1, 1].map(edge => box("双门塔两边完整侧墙", x + edge * 2.45, 4.1, -18.4, .3, 7.2, 5.1, stone)),
      box("门塔正面窗孔下完整墙段", x, 2.3, -20.9, 5.1, 3.8, .3, stone), box("门塔正面窗孔上完整墙段", x, 6.6, -20.9, 5.1, 2.2, .3, stone),
      ...[-1, 1].map(edge => box("门塔正面真实观察窗两侧窄墙", x + edge * 1.65, 4.85, -20.9, 1.7, 1.3, .3, stone)),
      ...[-1, 1].map(edge => box("门塔后向营院的独立门洞墙垛", x + edge * 1.7, 4.1, -15.9, 1.7, 7.2, .3, stone)), box("门塔后门上方承重过梁", x, 5.4, -15.9, 1.7, 4.6, .3, stone));
    for (const z of [-20.8, -16]) for (const offset of [-1.8, 0, 1.8]) parts.push(box("门塔巡守台上独立留隙的护垛", x + offset, 8.5, z, 1, 1.1, .45, stone));
  }
  parts.push(box("营院后方服务大厅地板", 0, .5, 17, 16, .2, 6, wood), box("服务大厅的完整后墙", 0, 2.5, 20, 16, 4.2, .3, stone),
    ...[-1, 1].map(side => box("服务大厅两侧承重墙", side * 8, 2.5, 17, .3, 4.2, 6, stone)), ...[-1, 1].map(side => box("大厅正门两侧厚墙", side * 5, 2.5, 14, 6, 4.2, .3, stone)),
    box("大厅正门上方横梁", 0, 4, 14, 4, 1.4, .3, stone), part("后方服务大厅的高坡屋面", "extrude", roof, [0, 4.7, 17], [1, 1, 1], [0, 0, 0], { depth: 6.5, profile: [{ x: -8.3, y: 0 }, { x: 0, y: 3.2 }, { x: 8.3, y: 0 }, { x: 8.2, y: -.2 }, { x: 0, y: 2.96 }, { x: -8.2, y: -.2 }] }),
    box("前双塔之间共同承起的第一闸横梁", 0, 7.65, -20.65, 7.5, .35, 1, stone), raisedGrid(-20.65),
    ...[-1, 1].map(side => box("第二闸间独立落地的门槽柱", side * 3.65, 4.1, -13.4, .4, 7.2, .8, stone)), box("第二闸间横向承闸梁", 0, 7.65, -13.4, 7.7, .35, 1, stone), raisedGrid(-13.4));
  return parts;
}

export const fantasySpaceBatchSevenDesigns = [
  design("单崖悬栈修道院", "四座薄券悬殿沿单面高崖逐层升起，连续实承长梯在每级水平梯台转入短栈桥，殿内有完整地坪与前门洞，斜托梁从崖腹接到殿底", cliffMonastery, "建筑", "奇幻"),
  design("双闸环廊驻军营院", "双门塔与两道升起格闸控制入口前庭，左右连续营房分出独立门洞和横隔房间，庭院两侧有开放遮檐环廊，后部服务大厅连到外围护墙", garrisonCourt, "建筑", "奇幻"),
];
