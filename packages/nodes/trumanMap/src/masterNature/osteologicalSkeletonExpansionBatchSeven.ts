import { Euler } from "three";
import { beam, design, part, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { boneGroups, boneShaft, specimenBone, specimenIvory, specimenMount } from "./osteologicalSkeletonExpansionBatchOne";

function oval(x: number, y: number, radiusX: number, radiusY: number): [number, number][] {
  return Array.from({ length: 8 }, (_, index) => { const a = index * Math.PI / 4; return [x + Math.cos(a) * radiusX, y + Math.sin(a) * radiusY]; });
}

function snakeAxis(t: number): Triple {
  return [.42 * Math.sin(t * Math.PI * 2) * Math.sin(t * Math.PI), .92 + Math.sin(t * Math.PI) * .02, 3.05 - t * 5.2];
}

function axisPoint(t: number, lateral: number, vertical: number, longitudinal = 0): Triple {
  const p = snakeAxis(t), derivative = .42 * Math.PI * (2 * Math.cos(t * Math.PI * 2) * Math.sin(t * Math.PI) + Math.sin(t * Math.PI * 2) * Math.cos(t * Math.PI));
  const yaw = Math.atan2(-derivative, 5.2);
  return [p[0] + lateral * Math.cos(yaw) + longitudinal * Math.sin(yaw), p[1] + vertical, p[2] - lateral * Math.sin(yaw) + longitudinal * Math.cos(yaw)];
}

// 馆方网纹蟒标本记录308枚躯椎、100枚尾椎与616根肋；这里原创简化各骨，未下载馆藏扫描。
// 独立附肋密集长轴、可动方骨及成对颌腭，不复用活体蟒的皮肤或给它换白。
// https://zoomuziejus.lt/en/cpt-news/new-exhibit-skeleton-of-a-reticulated-python/
// https://www.nhm.ac.uk/discover/snakes-senses-stretchy-jaws-deadly-venom.html
// https://museum.dealstvm.com/museum-section/reptiles/skeleton-of-the-python
function reticulatedPythonSkeleton(): ModelPart[] {
  const bones: ModelPart[] = [], ribs: ModelPart[] = [];
  const outline: [number, number][] = [[-.7, -.4], [-1.45, .28], [-.7, .5], [-.43, 1.02], [-.14, 1.65], [.14, 1.65], [.43, 1.02], [.7, .5], [1.45, .28], [.7, -.4]];
  const canal: [number, number][] = [[0, .43], [.24, .65], [0, .98], [-.24, .65]];
  for (let index = 0; index < 408; index++) {
    const tail = index >= 308, t = tail ? .82 + (index - 307) / 100 * .18 : index / 307 * .82;
    const radius = tail ? .016 * (1 - (index - 307) / 101) + .002 : .012 + Math.sin((index + 25) / 357 * Math.PI) * .011;
    const previous = snakeAxis(Math.max(0, t - .002)), next = snakeAxis(Math.min(1, t + .002));
    const yaw = Math.atan2(previous[0] - next[0], previous[2] - next[2]);
    const step = tail ? 5.2 * .18 / 100 : 5.2 * .82 / 307, depth = step * Math.hypot(1, (next[0] - previous[0]) / (next[2] - previous[2])) * .98;
    const vertebra = polygon(tail ? "网纹蟒尾段逐节收细的独立贯孔尾椎" : "网纹蟒独立躯椎的椎体、肋关节横突及有孔椎弓", specimenBone, outline.map(([x, y]) => [x * radius, y * radius]), depth, axisPoint(t, 0, 0, depth * .5), [canal.map(([x, y]) => [x * radius, y * radius])]);
    const rotation = new Euler(-Math.PI / 2, yaw, 0, "YXZ").reorder("XYZ"); vertebra.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI }; bones.push(vertebra);
    if (!tail) for (const side of [-1, 1]) {
      const spread = .048 + Math.sin((index + 12) / 337 * Math.PI) * .083;
      const points: [number, number][] = [[side * radius * 1.35, radius * .26], [side * spread, -.025], [side * spread * 1.02, -spread * .84], [side * spread * .37, -spread * 1.22]];
      const edges = [-1, 1].map(edge => points.map(([x, y], point) => {
        const previous = points[Math.max(0, point - 1)]!, next = points[Math.min(points.length - 1, point + 1)]!, length = Math.hypot(next[0] - previous[0], next[1] - previous[1]);
        const width = .0022 - point * .00028;
        return [x - (next[1] - previous[1]) / length * width * edge, y + (next[0] - previous[0]) / length * width * edge] as [number, number];
      }));
      // ACT: 毫米级薄肋采用真实有厚度的弯片截面，保留全部616根，不为节省体积删肋或封成皮肤壳。
      const rib = polygon("从单枚躯椎独立弯向腹侧、腹端不闭合成胸骨的真肋骨", specimenBone, [...edges[0]!, ...edges[1]!.reverse()], .0032, axisPoint(t, 0, 0, .0016));
      rib.rotation = { ...vertebra.rotation }; ribs.push(rib);
    }
  }
  bones.push(polygon("不堵后枕孔的蟒后脑箱左右骨壁及前壁", specimenBone, [[-.035, 3.047], [-.044, 3.1], [-.035, 3.15], [.035, 3.15], [.044, 3.1], [.035, 3.047], [.026, 3.047], [.034, 3.1], [.026, 3.138], [-.026, 3.138], [-.034, 3.1], [-.026, 3.047]], .055, [0, .9, 0]), polygon("承接后颅骨壁的薄颅底", specimenBone, [[-.03, 3.047], [-.037, 3.1], [-.028, 3.145], [.028, 3.145], [.037, 3.1], [.03, 3.047]], .005, [0, .9, 0]));
  const occiput = polygon("后脑箱与脊柱相接并有真实枕孔的枕骨", specimenBone, [[-.035, -.018], [-.044, .018], [-.023, .045], [.023, .045], [.044, .018], [.035, -.018]], .008, [0, .915, 3.053], [oval(0, .018, .008, .009)]); occiput.rotation.x = -90; bones.push(occiput);
  const roof = polygon("蟒颅顶连接左右额骨并向前渐窄的鼻骨", specimenBone, [[-.033, 3.08], [-.043, 3.18], [-.027, 3.295], [-.009, 3.355], [.009, 3.355], [.027, 3.295], [.043, 3.18], [.033, 3.08]], .006, [0, .95, 0]);
  for (const vertex of roof.vertices!) vertex.y -= Math.max(0, vertex.z - 3.16) * .19;
  bones.push(roof);
  bones.push(boneShaft("吻尖横接两上颌并与鼻骨相连的前颌骨", [-.014, .914, 3.355], [.014, .914, 3.355], .004));
  for (const side of [-1, 1]) {
    bones.push(boneShaft("从后颅伸出的上颞骨", [side * .032, .94, 3.09], [side * .047, .939, 3.065], .006), boneShaft("能摆动而与下颌关节真实相接的长方骨", [side * .047, .939, 3.065], [side * .061, .867, 3.085], .008));
    bones.push(tapered("左右前端保持韧带间隙的独立长下颌骨", specimenBone, [[side * .061, .867, 3.085], [side * .063, .847, 3.18], [side * .035, .854, 3.3], [side * .004, .867, 3.36]], [.011, .009, .006, .003]));
    bones.push(tapered("蟒后钩牙真正生根的上颌骨", specimenBone, [[side * .045, .92, 3.19], [side * .047, .92, 3.25], [side * .014, .914, 3.355]], [.008, .008, .003]), boneShaft("上颌骨与前额骨的前额支柱", [side * .034, .946, 3.215], [side * .045, .92, 3.2], .006));
    const palate: Triple[] = [[side * .031, .903, 3.092], [side * .022, .911, 3.2], [side * .011, .91, 3.31]];
    bones.push(tapered("口腔内侧独立的翼骨腭骨齿列", specimenBone, palate, [.007, .006, .004]), boneShaft("连接翼骨与上颌的外翼骨", [side * .022, .911, 3.2], [side * .045, .92, 3.2], .0045));
    for (let tooth = 0; tooth < 9; tooth++) {
      const z = 3.2 + tooth * .016, x = side * (z <= 3.25 ? .045 + (z - 3.19) / .06 * .002 : .047 - (z - 3.25) / .105 * .033), y = z <= 3.25 ? .92 : .92 - (z - 3.25) / .105 * .006;
      bones.push(tapered("上颌骨中生根并向后钩曲的非毒牙", specimenIvory, [[x, y, z], [x, y - .011, z - .003], [x, y - .016, z - .007]], [.0028, .0018, .0002]));
      const jawX = side * (z <= 3.3 ? .063 - (z - 3.18) / .12 * .028 : .035 - (z - 3.3) / .06 * .031), jawY = z <= 3.3 ? .847 + (z - 3.18) / .12 * .007 : .854 + (z - 3.3) / .06 * .013;
      bones.push(tapered("独立下颌中生根向后的钩形小齿", specimenIvory, [[jawX, jawY, z], [jawX, jawY + .008, z - .003], [jawX, jawY + .012, z - .006]], [.0022, .0014, .0002]));
    }
    for (let tooth = 0; tooth < 9; tooth++) { const t = tooth / 10, root: Triple = [side * (.029 - t * .017), .905 + t * .006, 3.115 + t * .187]; bones.push(tapered("内侧腭齿和翼骨齿的真实后弯齿体", specimenIvory, [root, [root[0], root[1] - .008, root[2] - .003], [root[0], root[1] - .012, root[2] - .006]], [.0021, .0014, .0002])); }
    const pelvicT = .819, hip = axisPoint(pelvicT, side * .029, -.025);
    bones.push(boneShaft("泄殖区保留的独立退化骨盆骨", axisPoint(pelvicT, side * .018, -.018, .035), hip, .005), boneShaft("退化骨盆旁短股骨残段，非虚构完整后腿", hip, axisPoint(pelvicT, side * .041, -.043, -.012), .004));
  }
  const parts = [...boneGroups("网纹蟒分节轴骨及独立颅颌骨组", bones), ...boneGroups("网纹蟒616根可辨独立腹端开放肋骨组", ribs)];
  const armature = Array.from({ length: 41 }, (_, index) => { const p = snakeAxis(index / 40); return [p[0], p[1] - .004, p[2]] as Triple; });
  parts.push(tapered("贯穿小椎体腹部而不封椎孔的陈列细钢芯", specimenMount, armature, armature.map(() => .0035)));
  for (const index of [35, 120, 210, 295, 375]) {
    const t = index < 308 ? index / 307 * .82 : .82 + (index - 307) / 100 * .18, p = snakeAxis(t);
    parts.push(part("蛇骨陈列支架真实接地的窄足板", "box", specimenMount, [p[0], .02, p[2]], [.3, .04, .24]), beam("穿至小椎体腹面钢芯的细立柱", specimenMount, [p[0], .04, p[2]], [p[0], p[1] - .004, p[2]], .013));
  }
  for (const side of [-1, 1]) parts.push(beam("退化骨盆接回主钢芯的短细承托", specimenMount, axisPoint(.819, 0, -.004), axisPoint(.819, side * .025, -.023), .004));
  return parts;
}

export const osteologicalSkeletonExpansionBatchSevenDesigns: MasterNatureDesign[] = [
  design("reticulatedPythonOsteologicalSpecimen", "网纹蟒完整骨架陈列标本", "器物", reticulatedPythonSkeleton, ["Malayopython reticulatus", "408枚贯孔分节椎骨、616根开放肋及独立颌腭方骨", "无肩带胸骨的密肋蛇骨系统与细钢陈列支承"]),
];
