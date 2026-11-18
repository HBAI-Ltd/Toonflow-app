import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, type TransportDefinition } from "./parts";

// 原创完整车体，空车不附马；不以配马、涂装、货物或车轮数量变化扩主。
// https://collections.museumsvictoria.com.au/items/387407
// https://collection.powerhouse.com.au/object/238094
// https://home.nps.gov/articles/000/wagons-on-the-trails.htm
// https://transportation.army.mil/museum/AOTM/2022/apr_2022.html
// https://www.witterfriends.org/buckboard.html
// https://www.hansenwheel.com/buckboard-wagon/

const wood = "#8d6a46", dark = "#363b39", trim = "#b8a475", leather = "#5b5145", cloth = "#d5ccb4";

export function carriageWheel(position: Triple, radius: number, width = 0.12): ModelPart[] {
  const [x, y, z] = position;
  const parts: ModelPart[] = [ring("保持实际辐间空隙的分段木轮辋", wood, radius - 0.012, 0.075, 0, width, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 90 } }), ring("紧贴木轮辋外周的薄铁轮箍", dark, radius, 0.025, 0, width * 1.04, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 90 } }), ring("供固定车轴穿入而具有真实轴孔的木轮毂", wood, 0.13, 0.09, 0, width * 1.8, { position: { x, y, z }, rotation: { x: 0, y: 0, z: 90 } })];
  for (let index = 0; index < 8; index++) {
    const angle = index * Math.PI / 4, c = Math.cos(angle), s = Math.sin(angle);
    parts.push(strut("在轮毂和木轮辋之间实际承载的独立木辐", [x, y + c * 0.1, z + s * 0.1], [x, y + c * (radius - 0.05), z + s * (radius - 0.05)], 0.04, wood));
  }
  return parts;
}

export function carriageRunningGear(front: number, rear: number, frontRadius: number, rearRadius: number, track: number): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const [z, radius] of [[front, frontRadius], [rear, rearRadius]]) parts.push(cylinder("连接两侧真实木轮毂的连续固定车轴", [0, radius!, z!], [0.07, track + 0.24, 0.07], dark, [0, 0, 90]), ...[-1, 1].flatMap(side => carriageWheel([side * track / 2, radius!, z!], radius!)));
  parts.push(box("随前轴转动并实际接到车轴的下枕木", [0, frontRadius + 0.115, front], [track - 0.2, 0.17, 0.2], wood), ring("前桥转向第五轮下承载圈", dark, 0.3, 0.22, frontRadius + 0.225, 0.05, { position: { x: 0, y: frontRadius + 0.225, z: front } }), ring("与车身承架相连的第五轮上承载圈", trim, 0.3, 0.22, frontRadius + 0.275, 0.05, { position: { x: 0, y: frontRadius + 0.275, z: front } }), cylinder("实际穿过第五轮中心孔的短转向王销", [0, frontRadius + 0.195, front], [0.07, 0.29, 0.07], dark), cylinder("王销顶端贴住上承载圈的限位圆帽", [0, frontRadius + 0.32, front], [0.24, 0.04, 0.24], dark), box("后车轴直接承托车身底架的固定横枕", [0, rearRadius + 0.13, rear], [track - 0.2, 0.2, 0.2], wood));
  return parts;
}

export function curvedStrip(name: string, x: number, z: number, length: number, centre: number, rise: number, width: number, thickness: number, color: string): ModelPart {
  const top = Array.from({ length: 9 }, (_, index) => ({ x: (index / 8 - 0.5) * length, y: centre + rise * (index / 4 - 1) ** 2 }));
  return part(name, "extrude", color, [x, 0, z], [1, 1, 1], [0, 90, 0], { depth: width, profile: [...top, ...top.toReversed().map(p => ({ x: p.x, y: p.y - thickness }))] });
}

function coveredWagonRoof(): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const stations = [-2.55, -2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4, 2.55];
  for (let row = 0; row < stations.length; row++) {
    const z = stations[row]!, base = 1.98 + 0.28 * (z / 2.4) ** 2;
    for (const inner of [0, 1]) for (let index = 0; index < 9; index++) {
      const angle = index * Math.PI / 8;
      vertices.push({ x: Math.cos(angle) * (0.75 - inner * 0.025), y: base + Math.sin(angle) * (1.1 - inner * 0.025), z });
    }
    if (!row) continue;
    for (let index = 0; index < 8; index++) {
      const a = (row - 1) * 18 + index, b = a + 1;
      indices.push(a, b, b + 18, a, b + 18, a + 18, a + 9, b + 27, b + 9, a + 9, a + 27, b + 27);
    }
    const a = (row - 1) * 18, b = a + 8;
    indices.push(a, a + 18, a + 27, a, a + 27, a + 9, b, b + 9, b + 27, b, b + 27, b + 18);
  }
  for (let index = 0; index < 8; index++) {
    const a = index, last = (stations.length - 1) * 18 + index;
    indices.push(a, a + 9, a + 10, a, a + 10, a + 1, last, last + 10, last + 9, last, last + 1, last + 10);
  }
  return part("前后都真正敞开且随曲底两端抬高的薄帆布车篷", "mesh", cloth, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const westernHorseCarriageBatchOne: TransportDefinition[] = [
  { name: "后置高驾驶座低厢汉森出租马车", theme: "欧式", tags: ["马车", "影视", "Hansom Cab", "维多利亚出租马车", "低乘客厢后高驾驶位", "年代戏马车"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => carriageWheel([side * 0.9, 0.75, 0.7], 0.75)), cylinder("乘客厢后方不穿过脚部空间的真实横车轴", [0, 0.75, 0.7], [0.07, 2.05, 0.07], dark, [0, 0, 90]), box("乘客双脚可以放入的低置实车厢地板", [0, 0.52, -0.25], [1.28, 0.14, 1.3], wood), box("低乘客厢完整后隔壁", [0, 1.42, 0.4], [1.28, 1.66, 0.06], dark), box("车厢上方实际接到角柱的平缓拱顶底板", [0, 2.25, -0.28], [1.4, 0.12, 1.5], dark), box("前方入口上沿向外挑出的遮雨檐", [0, 2.24, -1.06], [1.4, 0.1, 0.25], leather), box("乘客双人皮革坐垫", [0, 0.96, 0.17], [1.12, 0.14, 0.4], leather), box("乘客坐垫下实际落接地板的座箱", [0, 0.74, 0.17], [1.1, 0.3, 0.4], wood), box("贴住后壁的乘客软靠背", [0, 1.32, 0.34], [1.12, 0.56, 0.08], leather), box("后部露天高位车夫座垫", [0, 2.3, 0.95], [1, 0.13, 0.42], leather), box("高位车夫座靠背", [0, 2.53, 1.15], [1, 0.38, 0.08], dark), box("驾驶位前沿实际搭在车顶后边的脚踏", [0, 2.2, 0.54], [0.9, 0.1, 0.36], wood), box("前低入口的完整上车踏板", [0, 0.34, -1.02], [0.95, 0.09, 0.33], dark)];
    for (const side of [-1, 1]) {
      parts.push(box("乘客厢侧面下半实围壁", [side * 0.64, 1.1, -0.25], [0.06, 1.02, 1.3], dark), { ...box("上半侧窗实际留空处的薄玻璃", [side * 0.64, 1.91, -0.25], [0.025, 0.56, 1.18], "#8dabab"), opacity: 0.28 }, ...[-0.9, 0.4].map(z => box("侧窗两端承托车顶的角柱", [side * 0.64, 1.91, z], [0.065, 0.68, 0.065], wood)), curvedStrip("车厢两侧实际承载的上弓钢板弹簧", side * 0.7, 0.35, 1.7, 0.9, 0.2, 0.07, 0.025, dark), box("车轴与侧板簧中段之间的实夹持座", [side * 0.7, 0.855, 0.7], [0.13, 0.17, 0.22], dark), strut("车轴后侧连接到板簧后端的承力支臂", [side * 0.7, 0.8, 0.7], [side * 0.7, 1.1, 1.2], 0.075, wood), strut("从后车轴架升到露天高驾驶座的斜撑", [side * 0.45, 0.78, 0.7], [side * 0.45, 2.24, 0.95], 0.1, wood), strut("车厢地板支到低上车踏板的实连杆", [side * 0.45, 0.52, -0.8], [side * 0.45, 0.38, -1.04], 0.05, dark));
      const angle = side * 28 * Math.PI / 180, x = side * 0.64 - side * 0.305 * Math.cos(angle), z = -0.92 + side * 0.305 * Math.sin(angle), rotation: Triple = [0, side * 28, 0];
      parts.push(box("在实际铰边向厢内半开的前双门下板", [x, 1.04, z], [0.61, 0.9, 0.045], dark, rotation), { ...box("跟随同一前门框的上部玻璃片", [x, 1.82, z], [0.55, 0.66, 0.022], "#8dabab", rotation), opacity: 0.25 }, box("前门玻璃顶端细门楣", [x, 2.15, z], [0.61, 0.055, 0.05], wood, rotation), strut("由板簧前段外伸的牵引长辕后弯段", [side * 0.69, 0.96, -0.45], [side * 0.68, 0.66, -1.4], 0.065, wood), strut("绕开乘客踏板两侧的牵引长辕前段", [side * 0.68, 0.66, -1.4], [side * 0.55, 0.88, -2.65], 0.065, wood));
    }
    return parts;
  } },
  { name: "曲底高端帆布康内斯托加货运篷车", theme: "欧式", tags: ["马车", "影视", "Conestoga货运车", "西部电影大篷车", "曲底四轮篷车", "空货厢"], create: () => {
    const parts: ModelPart[] = [...carriageRunningGear(-1.45, 1.5, 0.62, 0.84, 1.72), curvedStrip("两端向上抬高且内部真实可装货的曲底车板", 0, 0, 4.8, 1.34, 0.28, 1.35, 0.1, wood), coveredWagonRoof(), strut("接到可转向前桥的单根长牵引辕", [0, 0.745, -1.45], [0, 0.9, -4.5], 0.13, wood), box("长辕前端供挽具连接的横向平衡轭", [0, 0.89, -4.3], [1.65, 0.12, 0.15], wood), box("左侧位于两车轮之间的车夫随行踏板", [-0.92, 1.08, 0], [0.26, 0.1, 1.1], wood)];
    for (const side of [-1, 1]) {
      parts.push(box("连接前后车桥的完整承载长底梁", [side * 0.4, 1.08, 0], [0.16, 0.16, 3.3], wood), box("避开王销圆帽并接到第五轮上圈的分列前底座", [side * 0.4, 0.97, -1.45], [0.5, 0.1, 0.22], wood));
      const bottom = Array.from({ length: 9 }, (_, index) => ({ x: (index / 8 - 0.5) * 4.8, y: 1.325 + 0.28 * (index / 4 - 1) ** 2 }));
      parts.push(part("曲底上方封住两侧但不填实货厢的长木围板", "extrude", wood, [side * 0.71, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.08, profile: [...bottom, ...bottom.toReversed().map(p => ({ x: p.x, y: p.y + 0.665 }))] }));
    }
    for (const z of [-1.45, 1.5]) parts.push(box("从底梁实际支到曲底车厢的厚横承枕", [0, 1.27, z], [1.4, 0.22, 0.24], wood));
    for (const z of [-2.4, 2.4]) parts.push(box("高起端部封住货厢且上方留篷口的木端板", [0, 1.945, z], [1.43, 0.65, 0.08], wood));
    for (const z of [-0.35, 0.35]) parts.push(strut("左侧随行踏板连接到底梁的短承托", [-0.4, 1.08, z], [-0.92, 1.08, z], 0.08, dark));
    for (const z of [-2.4, -1.6, -0.8, 0, 0.8, 1.6, 2.4]) {
      const base = 1.98 + 0.28 * (z / 2.4) ** 2, outer = Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(index * Math.PI / 8) * 0.726, y: base + Math.sin(index * Math.PI / 8) * 1.076 }));
      const inner = Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(Math.PI - index * Math.PI / 8) * 0.704, y: base + Math.sin(index * Math.PI / 8) * 1.054 }));
      parts.push(part("脚端实际落在侧围板并撑住帆布内面的完整弓架", "extrude", wood, [0, 0, z], [1, 1, 1], [0, 0, 0], { depth: 0.045, profile: [...outer, ...inner] }));
    }
    return parts;
  } },
  { name: "柔性长板底盘单排座西部轻便马车", theme: "欧式", tags: ["马车", "影视", "Buckboard", "西部轻便四轮马车", "无厢柔性木板车", "空车不附马"], create: () => {
    const parts: ModelPart[] = [...carriageRunningGear(-1.05, 1.15, 0.52, 0.65, 1.55), box("板车前端接在第五轮上圈的分列横承木", [-0.38, 0.85, -1.05], [0.5, 0.06, 0.2], wood), box("板车前端避开王销另一侧的横承木", [0.38, 0.85, -1.05], [0.5, 0.06, 0.2], wood), box("横放并实际连接座腿的整条皮坐垫", [0, 1.43, 0.35], [1.1, 0.1, 0.5], leather), box("单排长座后部完整靠背", [0, 1.7, 0.62], [1.1, 0.5, 0.07], wood), box("乘坐位置之前的脚踏木板", [0, 0.98, -0.48], [1.15, 0.1, 0.45], wood), box("前端固定在柔性底板上的弧背挡泥前围", [0, 1.187, -0.9], [1.12, 0.6, 0.06], leather, [-10, 0, 0])];
    for (const x of [-0.44, -0.22, 0, 0.22, 0.44]) parts.push(curvedStrip("直接跨接前后车桥并兼作弹性车身的独立长木板", x, 0, 2.8, 0.86, 0.07, 0.2, 0.065, wood));
    for (const side of [-1, 1]) {
      for (const z of [0.13, 0.57]) parts.push(strut("座腿下端实际固定在长木板上", [side * 0.44, 0.85 + 0.07 * (z / 1.4) ** 2, z], [side * 0.44, 1.38, z], 0.065, wood));
      parts.push(box("脚踏下端与长板之间的短支垫", [side * 0.44, 0.9, -0.48], [0.12, 0.08, 0.4], wood), strut("随前桥转向的双辕牵引杆", [side * 0.45, 0.635, -1.05], [side * 0.55, 0.85, -2.7], 0.07, wood), strut("座位两侧接到靠背的低扶手", [side * 0.57, 1.55, 0.16], [side * 0.57, 1.65, 0.6], 0.045, dark), strut("扶手前端支到座面的短立杆", [side * 0.57, 1.43, 0.16], [side * 0.57, 1.55, 0.16], 0.045, dark));
    }
    return parts;
  } },
];
