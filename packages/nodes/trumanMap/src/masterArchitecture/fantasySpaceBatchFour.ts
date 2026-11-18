import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon, sweptProfile } from "../masterNature/shared";
import { base, box, cylinder, design, rail, stairs } from "./structures";
import { barrelRoof, halfRoundWall } from "./spatialShells";

const bark = "#8b795d", ivory = "#c3c5b1", canopy = "#8da7a2", rock = "#949b94";

function tube(name: string, color: string, path: Triple[], radius: number): ModelPart {
  return part(name, "tube", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius, path: path.map(([x, y, z]) => ({ x, y, z })) });
}

function transform(parts: ModelPart[], yaw: number): ModelPart[] {
  const a = yaw * Math.PI / 180;
  for (const item of parts) {
    const x = item.position.x, z = item.position.z;
    item.position.x = x * Math.cos(a) + z * Math.sin(a); item.position.z = z * Math.cos(a) - x * Math.sin(a); item.rotation.y += yaw;
  }
  return parts;
}

function nestResidence(): ModelPart[] {
  const cup = sweptProfile("正面断开留门的编巢曲面承居壁", bark, [[4.5, .4], [6.3, 2.4], [6.7, 5.8], [6.5, 5.8], [6.1, 2.4], [4.3, .4]], Math.PI * 5 / 3, 20);
  cup.rotation.y = 60;
  const parts: ModelPart[] = [cylinder("巢底与地面接触的厚根盘", 0, .2, 0, 9.2, .4, bark), cup, ring("巢内环形居住层与中庭洞口", bark, 6.3, 4.1, 2.45, .22),
    ring("环居层上连续遮雨编枝檐", canopy, 6.8, 4.5, 5.95, .18), ...stairs(0, -7.4, 2, 11, .2, .4)];
  for (const hand of [-1, 1]) for (let index = 0; index < 8; index++) {
    const a = (-30 + index * 34) * Math.PI / 180, b = a + hand * .15, c = a + hand * .3;
    parts.push(rail([Math.cos(a) * 4.5, .4, Math.sin(a) * 4.5], [Math.cos(b) * 6.35, 2.4, Math.sin(b) * 6.35], .16, ivory),
      rail([Math.cos(b) * 6.35, 2.4, Math.sin(b) * 6.35], [Math.cos(c) * 6.7, 5.75, Math.sin(c) * 6.7], .16, ivory));
  }
  for (let index = 0; index < 6; index++) {
    if (index === 4) continue;
    const a = index * Math.PI / 3 + .5;
    parts.push(part("编巢内室之间实际可见的径向隔屏", "box", bark, [Math.cos(a) * 4.2, 4.1, Math.sin(a) * 4.2], [3.6, 3, .13], [0, -a * 180 / Math.PI, 0]),
      part("各内室沿外壁放置的平整卧台", "box", bark, [Math.cos(a + .35) * 4.9, 3, Math.sin(a + .35) * 4.9], [2.2, .6, 1.5], [0, 70 - (a + .35) * 180 / Math.PI, 0]));
  }
  return parts;
}

function jellyPalace(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("钟罩宫落地根盘", 0, .2, 0, 14, .4, ivory),
    part("中央为空腔且内外表面完整的水母钟罩", "lathe", canopy, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 11.3 }, { x: 3, y: 10.8 }, { x: 5.5, y: 9.1 }, { x: 7, y: 6.3 }, { x: 7.18, y: 6.34 }, { x: 5.67, y: 9.2 }, { x: 3.08, y: 10.95 }, { x: 0, y: 11.5 }] }),
    ring("钟罩下层垂居环台", ivory, 5.9, 2.9, 1.3, .24), ring("钟罩上层垂居环台", ivory, 5.2, 2.7, 4.3, .24), ...stairs(-4.4, -5, 1.25, 17, .25, .4)];
  for (let index = 0; index < 8; index++) {
    const a = index * Math.PI / 4, x = Math.cos(a), z = Math.sin(a);
    parts.push(tube("从钟裙垂下后接地的弧形脉柱", ivory, [[x * 7, 6.3, z * 7], [x * 6.8 - z * .7, 4.8, z * 6.8 + x * .7], [x * 7.5 - z, 2.4, z * 7.5 + x], [x * 6.4, .4, z * 6.4]], .18),
      rail([x * 6.6, 7, z * 6.6], [x * 4.7, 4.3, z * 4.7], .09, bark),
      rail([x * 5, 4.3, z * 5], [x * 5, 1.3, z * 5], .1, bark));
  }
  for (let index = 0; index < 4; index++) {
    const a = index * Math.PI / 2;
    parts.push(part("上层环台内独立的低位卧台", "box", bark, [Math.cos(a) * 3.9, 4.8, Math.sin(a) * 3.9], [2, .6, 1.5], [0, 90 - index * 90, 0]),
      part("卧台外侧不封死行走廊的脉膜屏", "box", canopy, [Math.cos(a) * 4.9, 5.6, Math.sin(a) * 4.9], [2.5, 2.2, .1], [0, 90 - index * 90, 0]));
  }
  return parts;
}

function rungMesh(x: number, first: number, count: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let rung = first; rung < first + count; rung++) {
    const y = .85 + rung * .3;
    const corners = [-1, 1].flatMap(sy => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => ({ x: x + sx! * .45, y: y + sy * .035, z: -.8 + sz! * .055 })));
    for (const face of [[0, 1, 2, 3], [4, 7, 6, 5], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) {
      const n = vertices.length; vertices.push(...face.map(index => corners[index]!)); indices.push(n, n + 1, n + 2, n, n + 2, n + 3);
    }
  }
  return part("竖向方环内梯的独立硬面木横档", "mesh", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function thresholdRing(): ModelPart[] {
  const outline: [number, number][] = [[-9, -1.5], [9, -1.5], [9, 1.5], [-9, 1.5]], holes: [number, number][][] = [-1, 1].map(side => [[side * 7.4 - .6, -1.15], [side * 7.4 + .6, -1.15], [side * 7.4 + .6, .3], [side * 7.4 - .6, .3]]);
  const parts: ModelPart[] = [box("下环通廊连续落地楼板", 0, .55, 0, 18, .24, 3), polygon("下环廊顶在两端竖井留真实爬梯通口", ivory, outline, .2, [0, 3.1, 0], holes),
    polygon("上环通廊在竖井处留真实登层梯洞", bark, outline, .2, [0, 15.2, 0], holes), box("上环通廊连续顶盖", 0, 18, 0, 18, .24, 3)];
  for (const side of [-1, 1]) for (const y of [1.9, 16.6]) for (const end of [-1, 1]) parts.push(box("方环上下廊在交叉中庭处断开的侧墙", end * 6, y, side * 1.45, 6, 2.4, .16, ivory));
  for (const side of [-1, 1]) {
    const x = side * 7.4;
    parts.push(box("方环竖井朝外厚侧壁", side * 8.9, 9.2, 0, .2, 12, 3), box("方环竖井朝内厚侧壁", side * 5.9, 9.2, 0, .2, 12, 3),
      ...[-1, 1].map(end => box("上下廊之间真正中空的竖向井面", x, 9.2, end * 1.4, 3, 12, .2, ivory)), rungMesh(x, 0, 20), rungMesh(x, 20, 20), rungMesh(x, 40, 10),
      ...[-1, 1].map(edge => rail([x + edge * .48, .7, -.8], [x + edge * .48, 15.7, -.8], .065, bark)));
  }
  return parts;
}

function thresholdPalace(): ModelPart[] {
  return [base(24, 24), ...[0, 60, 120].flatMap(yaw => transform(thresholdRing(), yaw)), cylinder("三组方环交会的下层六向公共中庭", 0, .55, 0, 6.4, .24, bark),
    cylinder("上层三条高廊交会的六向观礼台", 0, 15.3, 0, 6.4, .2, bark)];
}

function rockForkFort(): ModelPart[] {
  const parts: ModelPart[] = [cylinder("三向风穴堡中央落地岩床", 0, .2, 0, 13, .4, rock),
    part("中央风穴上方保留通光孔的完整岩质穹冠", "lathe", rock, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1, y: 7.5 }, { x: 3.6, y: 6.5 }, { x: 5.6, y: 4.8 }, { x: 5.8, y: 5.05 }, { x: 3.75, y: 6.78 }, { x: 1, y: 7.8 }, { x: 1, y: 7.5 }] })];
  for (let index = 0; index < 3; index++) {
    const angle = index * 120, a = angle * Math.PI / 180;
    parts.push(halfRoundWall("三向拱洞之间保持实承的弧形岩堡壁", 5.5, .6, 4.5, [0, .4, 0], -angle - 27, rock, Math.PI * 66 / 180));
    const corridor = [box("风穴拱廊穿过岩床的连续地坪", 0, .4, 8.3, 4.2, .35, 8.5, ivory), barrelRoof("贯通岩体侧面且有壁厚的风穴筒券", 2.1, .25, 8.5, [0, 2.7, 8.3], rock),
      ...[-1, 1].map(side => box("拱廊两边真实落地的厚岩墙", side * 2.2, 1.55, 8.3, .5, 2.7, 8.5, rock)),
      ...[-1, 1].map(side => box("拱口侧伸的守堡平台", side * 3.1, .7, 11.5, 1.4, .6, 2.8, rock))];
    parts.push(...transform(corridor, 90 - angle));
    const x = Math.cos(a + Math.PI / 3) * 3.9, z = Math.sin(a + Math.PI / 3) * 3.9;
    parts.push(part("风穴之间的独立巡守凹龛底", "box", bark, [x, .75, z], [2.3, .3, 1.6], [0, 30 - angle, 0]),
      rail([Math.cos(a + Math.PI / 3) * 5, .4, Math.sin(a + Math.PI / 3) * 5], [Math.cos(a + Math.PI / 3) * 3.6, 6.5, Math.sin(a + Math.PI / 3) * 3.6], .3, rock));
  }
  return parts;
}

export const fantasySpaceBatchFourDesigns = [
  design("巨巢编条山居", "曲面巢杯围住具有中庭孔的环形居住层，交织承条从宽根盘上行至巢檐，前侧断口与台阶接到室内平地，径向隔屏分出独立卧居间", nestResidence, "建筑", "奇幻"),
  design("水母钟罩垂居宫", "空心连续钟罩围住上下两层垂居环台，边缘弧脉落地且悬索接到环台，侧向连续台阶真正接入上下居住层", jellyPalace, "建筑", "奇幻"),
  design("套阈交叉巡礼宫", "三组具有真实内部通道的竖向方环在上下公共中庭交会，六个中空竖井内的长梯通过独立梯洞接通上下廊，方环并非实心积木", thresholdPalace, "建筑", "奇幻"),
  design("穿岩叉拱风穴堡", "三条带独立筒券和落地厚壁的风穴从中央堡庭向外贯通，孔间弧壁与斜岩肋承托带通光孔的上岩冠，侧龛和拱口平台提供守堡空间", rockForkFort, "建筑", "奇幻"),
];
