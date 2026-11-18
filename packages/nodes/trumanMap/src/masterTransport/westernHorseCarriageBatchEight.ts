import { Vector3 } from "three";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, strut, type TransportDefinition } from "./parts";
import { carriageWheel, curvedStrip } from "./westernHorseCarriageBatchOne";
import { carriageRoof, compactCarriageGear } from "./westernHorseCarriageBatchTwo";
import { solidPanel } from "./marineExpansionBatchTwo";

// 日常家庭与商贸运输完整车体，空车不靠装儿童、面包或其他货物增加主数。
// https://www.nationaltrustcollections.org.uk/object/272941.1
// https://collection.powerhouse.com.au/object/11331
// https://collections.glasgowmuseums.com/mwebcgi/mweb?request=record%3Bid%3D534683%3Btype%3D801
// https://www.gla.ac.uk/myglasgow/archivespecialcollections/digitisedcollections/barkersofkensington/photogallery/transport/horsedrawntrailervan/

const wood = "#916e47", cane = "#b3a17b", dark = "#353b36", leather = "#786453", paint = "#77735c";

function basketPoint(column: number, f: number): Triple {
  const angle = column * Math.PI / 10;
  return [Math.cos(angle) * (0.58 + f * 0.14), 0.58 + f * 0.6, Math.sin(angle) * (0.82 + f * 0.13)];
}

function basketWeave(zone: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let column = 6; column < 24; column++) for (const reverse of [false, true]) {
    const a = new Vector3(...basketPoint(column, (zone + (reverse ? 1 : 0)) / 2)), b = new Vector3(...basketPoint(column + 1, (zone + (reverse ? 0 : 1)) / 2));
    const direction = b.clone().sub(a).normalize(), xAxis = new Vector3(0, 1, 0).cross(direction).normalize(), zAxis = xAxis.clone().cross(direction), centre = a.clone().add(b).multiplyScalar(0.5), length = a.distanceTo(b), base = vertices.length;
    for (const [x, y, z] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
      const p = centre.clone().addScaledVector(xAxis, x! * 0.009).addScaledVector(direction, y! * length / 2).addScaledVector(zAxis, z! * 0.009);
      vertices.push({ x: p.x, y: p.y, z: p.z });
    }
    indices.push(...[0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5].map(index => index + base));
  }
  return part("篮舆上下两带之间保留实际孔隙的交叉细编条", "mesh", cane, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const westernHorseCarriageBatchEight: TransportDefinition[] = [
  { name: "下沉曲轴后门双侧座低篮家庭马车", theme: "欧式", tags: ["马车", "影视", "爱德华年代戏", "Governess低篮车", "后门两侧相向长座"], create: () => {
    const floorOutline = Array.from({ length: 20 }, (_, index) => [Math.cos(index * Math.PI / 10) * 0.58, Math.sin(index * Math.PI / 10) * 0.82] as [number, number]);
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => carriageWheel([side * 0.89, 0.56, 0], 0.56)), box("在篮舆下方低于轮轴中心的曲轴中段", [0, 0.38, 0], [1.22, 0.08, 0.1], dark), polygon("深篮舆内真实连续的椭圆低地板", wood, floorOutline, 0.08, [0, 0.5, 0]), basketWeave(0), basketWeave(1), box("后门之外的独立低上车踏板", [0, 0.3, 1.05], [0.5, 0.08, 0.35], dark)];
    for (const side of [-1, 1]) {
      parts.push(cylinder("穿入木轮毂而与中段曲轴错开高度的外半轴", [side * 0.82, 0.56, 0], [0.07, 0.42, 0.07], dark, [0, 0, 90]), box("把外轮轴实际连接到下沉轴中段的短曲拐", [side * 0.61, 0.47, 0], [0.08, 0.22, 0.1], dark), ring("低篮舆两侧真正空腹的整副椭圆悬簧", dark, 1, 0.14, 0, 1, { position: { x: side * 0.46, y: 0.46, z: 0 }, scale: { x: 0.1, y: 0.06, z: 0.5 }, rotation: { x: 0, y: 0, z: 90 } }), box("低篮舆内朝向另一侧的纵长座垫", [side * 0.43, 0.88, -0.05], [0.24, 0.1, 0.75], leather), box("纵长座外侧接到坐垫的低软靠背", [side * 0.565, 1.06, -0.05], [0.045, 0.3, 0.72], leather), strut("由曲拐外侧实际伸向挽具的长牵引辕", [side * 0.61, 0.54, 0], [side * 0.55, 0.82, -2.65], 0.065, wood), strut("后低踏板向上接到舆底的实斜吊杆", [side * 0.2, 0.54, 0.72], [side * 0.2, 0.34, 1.05], 0.05, dark));
      for (const z of [-0.25, 0.25]) parts.push(strut("两侧长座实际落在低椭圆地板上的短座脚", [side * 0.43, 0.58, z], [side * 0.43, 0.83, z], 0.045, wood));
    }
    for (let column = 6; column <= 24; column++) parts.push(strut("深篮舆外张侧壁上下相连的独立编架立骨", basketPoint(column, 0), basketPoint(column, 1), 0.028, cane));
    for (const f of [0, 0.5, 1]) parts.push(part("保留后门开口而沿篮舆连续围合的弯木横箍", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: 0.022, path: Array.from({ length: 19 }, (_, index) => { const [x, y, z] = basketPoint(index + 6, f); return { x, y, z }; }) }));
    for (let index = 0; index < 5; index++) {
      const f = 0.07 + index * 0.22, right = basketPoint(24, f), left = basketPoint(6, f);
      parts.push(strut("后小门实际接在两侧门骨之间的细横栏", left, right, 0.025, cane));
    }
    return parts;
  } },
  { name: "前驾台双后门高木厢商贸货运马车", theme: "欧式", tags: ["马车", "影视", "十九世纪街景", "马拉商贸厢货车", "空厢后装载口"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.25, 1.25, 0.5, 0.7, 1.8), box("高木货厢内部实际可装物的完整地板", [0, 1.05, 0.4], [1.45, 0.16, 2.7], wood), carriageRoof("商贸木厢上方独立承重的薄拱顶", [[-1.08, 0.85, 2.7], [1.88, 0.85, 2.7]], 0.12, 0.06, paint), box("货厢前方独立露天车夫脚台", [0, 0.94, -1.45], [1.4, 0.12, 0.8], wood), box("露天驾座坐垫下面实接脚台的短座箱", [0, 1.155, -1.35], [1.2, 0.35, 0.45], wood), box("完整独立车夫坐垫", [0, 1.4, -1.35], [1.26, 0.14, 0.5], leather), box("驾座后部独立短靠背", [0, 1.63, -1.08], [1.26, 0.33, 0.07], dark), box("露天脚台向前放低的整块脚床", [0, 0.87, -1.9], [1.3, 0.1, 0.5], dark), box("车夫脚床前端完整挡泥围", [0, 1.16, -2], [1.28, 0.6, 0.065], leather, [-12, 0, 0]), box("后装载口下方第一登车踏板", [0, 0.7, 1.95], [1.1, 0.1, 0.4], dark), box("装载口门槛下面的第二登车踏板", [0, 0.9, 1.8], [1.1, 0.1, 0.25], dark), box("后装载口下端真实的整木门槛", [0, 1.14, 1.75], [1.5, 0.12, 0.1], wood), box("后装载口上端连接两门柱的门楣", [0, 2.67, 1.75], [1.5, 0.1, 0.1], wood)];
    const arch = Array.from({ length: 9 }, (_, index) => { const x = Math.cos(index * Math.PI / 8) * 0.75; return [x, 2.7 + 0.12 * Math.sqrt(1 - (x / 0.85) ** 2) - 0.025] as [number, number]; });
    const front = solidPanel("货厢前端真正封闭并接到弧顶的独立实木围", [0, 0, -0.95], [1, 0, 0], [0, 1, 0], [[-0.75, 1.08], [0.75, 1.08], ...arch]);
    const rear = solidPanel("后装载口门楣与拱顶之间真正闭合的弓肩板", [0, 0, 1.75], [1, 0, 0], [0, 1, 0], [[-0.75, 2.64], [0.75, 2.64], ...arch]);
    front.color = rear.color = paint;
    parts.push(front, rear);
    for (const side of [-1, 1]) {
      parts.push(box("前后桥之间的完整承重长底梁", [side * 0.5, 0.85, 0], [0.12, 0.14, 3.7], dark), box("前第五轮上避开王销的半幅承枕", [side * 0.34, 0.83, -1.25], [0.45, 0.06, 0.2], dark), box("不贴假窗而完整围住空货厢的独立长侧板", [side * 0.73, 1.9, 0.4], [0.065, 1.64, 2.7], paint), box("后装载口两侧实际支到拱顶的独立门柱", [side * 0.73, 1.89, 1.75], [0.08, 1.62, 0.09], wood), strut("露天前驾台两侧实际接到前转向枕的长辕", [side * 0.5, 0.615, -1.25], [side * 0.55, 0.82, -3.2], 0.07, wood));
      for (const z of [-0.9, 0.9]) parts.push(curvedStrip("商贸车厢与前驾座底下的上弓长叶簧", side * 0.61, z, 1, 0.96, 0.12, 0.075, 0.025, dark), box("长叶簧中央实接到底架的承夹座", [side * 0.58, 0.92, z], [0.25, 0.1, 0.2], dark));
      for (const z of [-0.7, 0.35, 1.45]) parts.push(box("货厢内侧下接地板上接顶壳的实木立骨", [side * 0.68, 1.91, z], [0.065, 1.62, 0.08], wood));
      for (const z of [1.78, 1.95]) parts.push(strut("后两级登车踏板上接门槛的实斜托", [side * 0.45, 1.15, 1.72], [side * 0.45, z === 1.78 ? 0.95 : 0.75, z], 0.06, dark));
      const angle = side > 0 ? 35 * Math.PI / 180 : 0, x = side * 0.73 - side * 0.365 * Math.cos(angle), z = 1.75 + side * 0.365 * Math.sin(angle), rotation: Triple = [0, side > 0 ? 35 : 0, 0];
      parts.push(box("真实后货门其中一扇向外打开的整木门板", [x, 1.89, z], [0.73, 1.5, 0.05], paint, rotation));
      for (const y of [1.4, 2.36]) parts.push(box("后货门随门叶一起转动的完整横向门带", [x, y, z], [0.73, 0.06, 0.075], wood, rotation));
    }
    return parts;
  } },
];
