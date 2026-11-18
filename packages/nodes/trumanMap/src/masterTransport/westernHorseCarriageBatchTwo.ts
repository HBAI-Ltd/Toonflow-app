import { Euler, MathUtils, Vector3 } from "three";
import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, surface, type TransportDefinition } from "./parts";
import { carriageRunningGear, curvedStrip } from "./westernHorseCarriageBatchOne";
import { openHull } from "./marineExpansionBatchOne";
import { solidPanel } from "./marineExpansionBatchTwo";
import { annularSector } from "./marineExpansionBatchSeventeen";

// 不按折篷开闭、马匹或行李载荷扩主；同一完整车型只收一个空车实体。
// https://www.parks.ca.gov/?page_id=25449
// https://research.colonialwilliamsburg.org/DigitalLibrary/view/index.cfm?doc=ResearchReports%5CRR0380.xml
// https://www.nationaltrustcollections.org.uk/object/272872.1.1
// https://americanhistory.si.edu/collections/object/nmah_843092
// https://home.nps.gov/articles/000/carriage-collection-then-and-now.htm

const wood = "#886640", dark = "#343b37", leather = "#615246", cloth = "#c6b99a", paint = "#904a38";

export function compactCarriageGear(front: number, rear: number, frontRadius: number, rearRadius: number, track: number): ModelPart[] {
  const source = carriageRunningGear(front, rear, frontRadius, rearRadius, track), vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const spokes = source.filter(p => p.name === "在轮毂和木轮辋之间实际承载的独立木辐");
  for (const beam of spokes) {
    const base = vertices.length, rotation = new Euler(MathUtils.degToRad(beam.rotation.x), MathUtils.degToRad(beam.rotation.y), MathUtils.degToRad(beam.rotation.z));
    for (const [x, y, z] of [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]) {
      const p = new Vector3(x! * beam.scale.x / 2, y! * beam.scale.y / 2, z! * beam.scale.z / 2).applyEuler(rotation).add(new Vector3(beam.position.x, beam.position.y, beam.position.z));
      vertices.push({ x: p.x, y: p.y, z: p.z });
    }
    indices.push(...[0, 2, 1, 0, 3, 2, 4, 5, 6, 4, 6, 7, 0, 1, 5, 0, 5, 4, 3, 7, 6, 3, 6, 2, 0, 4, 7, 0, 7, 3, 1, 2, 6, 1, 6, 5].map(index => index + base));
  }
  return [...source.filter(p => !spokes.includes(p)), part("合并储存但各辐间仍真实开空的四轮完整木辐组", "mesh", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices })];
}

export function carriageRoof(name: string, stations: [number, number, number][], rise: number, thickness: number, color: string): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let row = 0; row < stations.length; row++) {
    const [z, width, y] = stations[row]!;
    for (const inner of [0, 1]) for (let index = 0; index < 9; index++) { const a = index * Math.PI / 8; vertices.push({ x: Math.cos(a) * width, y: y + Math.sin(a) * rise - inner * thickness, z }); }
    if (!row) continue;
    for (let index = 0; index < 8; index++) { const a = (row - 1) * 18 + index; indices.push(a, a + 1, a + 19, a, a + 19, a + 18, a + 9, a + 28, a + 10, a + 9, a + 27, a + 28); }
    const a = (row - 1) * 18, b = a + 8;
    indices.push(a, a + 18, a + 27, a, a + 27, a + 9, b, b + 9, b + 27, b, b + 27, b + 18);
  }
  for (let index = 0; index < 8; index++) { const last = (stations.length - 1) * 18 + index; indices.push(index, index + 9, index + 10, index, index + 10, index + 1, last, last + 10, last + 9, last, last + 1, last + 10); }
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

export const westernHorseCarriageBatchTwo: TransportDefinition[] = [
  { name: "圆腹悬皮带行李架康科德驿站马车", theme: "欧式", tags: ["马车", "影视", "西部", "Concord驿站车", "圆腹空厢皮带悬架"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.5, 1.4, 0.6, 0.78, 1.92), carriageRoof("前后收窄且真实薄壳的圆肩驿车顶", [[-1.6, 0.46, 2.75], [-1.05, 0.77, 2.75], [1.05, 0.77, 2.75], [1.6, 0.46, 2.75]], 0.14, 0.07, dark), box("中央两侧门口之间不被厢壁封住的实地板", [0, 1.2525, 0], [1.14, 0.045, 0.9], wood), box("前外驾座下方接进前舱壁的行李靴底板", [0, 1.7, -1.9], [1.2, 0.08, 0.9], dark), box("外驾座下真实承重的前靴箱", [0, 1.93, -1.9], [1.2, 0.42, 0.6], leather), box("前部外露车夫双人高座", [0, 2.2, -1.9], [1.3, 0.12, 0.5], leather), box("车夫座后连接到车厢前壁的短靠背", [0, 2.37, -1.63], [1.3, 0.3, 0.08], dark), box("后行李靴接到车厢后壁的完整托底", [0, 1.55, 1.75], [1.25, 0.08, 0.9], dark), strut("第五轮前桥下端实际连接的单牵引长辕", [0, 0.715, -1.5], [0, 0.82, -3.8], 0.11, wood), box("长辕端部供成对挽具连接的平衡横木", [0, 0.82, -3.65], [1.5, 0.1, 0.13], wood)];
    for (const side of [-1, 1]) {
      parts.push(box("贯通前后桥而位于悬带下方的长底架", [side * 0.45, 0.95, -0.05], [0.12, 0.14, 3.4], wood), box("绕开王销圆帽的前桥半幅上承枕", [side * 0.35, 0.95, -1.5], [0.46, 0.1, 0.2], wood));
      for (const z of [-1.75, 1.75]) parts.push(strut("从底架竖起并承担长皮带端头的铁标准架", [side * 0.45, 1, Math.sign(z) * 1.55], [side * 0.56, 1.57, z], 0.085, dark));
      const top = [-1.75, -1.45, -0.9, -0.45, 0, 0.45, 0.9, 1.45, 1.75].map(z => ({ x: z, y: Math.abs(z) <= 1.45 ? 1.24 + 0.13 * (z / 1.45) ** 2 : 1.37 + (Math.abs(z) - 1.45) / 0.3 * 0.2 }));
      parts.push(part("在车腹下面真实连续兜住空舱的厚皮革悬带", "extrude", leather, [side * 0.56, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.13, profile: [...top, ...top.toReversed().map(p => ({ x: p.x, y: p.y - 0.055 }))] }));
      const outline: Triple[] = [[side * 0.5, 1.99, -1.45], [side * 0.74, 1.99, -0.45], [side * 0.74, 1.99, 0.45], [side * 0.5, 1.99, 1.45]];
      for (let index = 0; index < 3; index++) for (const y of [1.99, 2.7]) parts.push(strut("顺应圆腹两端收窄的完整车窗横框", [outline[index]![0], y, outline[index]![2]], [outline[index + 1]![0], y, outline[index + 1]![2]], 0.06, wood));
      for (const p of outline) parts.push(box("车窗及侧门之间真实支到车顶的独立窗柱", [p[0], 2.35, p[2]], [0.065, 0.72, 0.065], wood));
      for (const index of [0, 2]) {
        const a = outline[index]!, b = outline[index + 1]!, pane = surface("两端窗框真实开空处的薄窗玻璃", "#8ba8ad", [[a[0], 2.04, a[2]], [b[0], 2.04, b[2]], [b[0], 2.65, b[2]], [a[0], 2.65, a[2]]], [0, 1, 2, 0, 2, 3]);
        pane.opacity = 0.22;
        parts.push(pane);
      }
      const angle = side > 0 ? 25 * Math.PI / 180 : 0, x = side * 0.74 + 0.45 * Math.sin(angle), z = -0.45 + 0.45 * Math.cos(angle), rotation: Triple = [0, angle * 180 / Math.PI, 0];
      parts.push(box("有真实门孔且右门向外打开的独立下门板", [x, 1.625, z], [0.05, 0.67, 0.9], paint, rotation), { ...box("独立侧门框内的上半玻璃", [x, 2.3, z], [0.022, 0.68, 0.82], "#8ba8ad", rotation), opacity: 0.23 }, box("跟随门体的玻璃顶框", [x, 2.655, z], [0.065, 0.06, 0.9], wood, rotation));
      for (const f of [0, 0.9]) parts.push(box("真正连住门板和上窗的活动竖门框", [side * 0.74 + f * Math.sin(angle), 1.98, -0.45 + f * Math.cos(angle)], [0.065, 1.37, 0.065], wood, rotation));
      parts.push(box("侧门下面的独立登车踏板", [side * 0.95, 0.87, 0], [0.36, 0.08, 0.55], dark));
      for (const z of [-0.18, 0.18]) parts.push(strut("踏板从中央实地板伸出的斜承托", [side * 0.56, 1.27, z], [side * 0.95, 0.91, z], 0.065, dark));
      parts.push(box("后行李靴实际接到底板的侧围", [side * 0.6, 1.78, 1.75], [0.06, 0.42, 0.9], leather));
      for (const z of [-0.85, 0.85]) parts.push(strut("车顶行李架下端插入弧顶的短立柱", [side * 0.61, 2.8, z], [side * 0.61, 3.08, z], 0.04, dark));
      parts.push(strut("车顶空行李架的纵向上栏", [side * 0.61, 3.08, -0.85], [side * 0.61, 3.08, 0.85], 0.04, dark));
    }
    for (const sections of [[[-1.45, 0.5, 0.37, 0.62], [-0.9, 0.74, 0.57, 0.62], [-0.45, 0.74, 0.57, 0.62]], [[0.45, 0.74, 0.57, 0.62], [0.9, 0.74, 0.57, 0.62], [1.45, 0.5, 0.37, 0.62]]] as [number, number, number, number][][]) {
      const shell = openHull("中央侧门完全断开而保留真实薄壁的圆腹半厢", sections, 0.045, paint);
      shell.vertices!.forEach(p => p.y += 1.23 + 0.13 * (p.z / 1.45) ** 2);
      parts.push(shell);
    }
    for (const z of [-1.45, 1.45]) {
      const end = solidPanel("封住圆腹车厢端部而上窗实际开孔的完整端壁", [0, 0, z], [1, 0, 0], [0, 1, 0], [[-0.37, 1.36], [0.37, 1.36], [0.5, 1.98], [0.5, 2.76], [0.35, 2.82], [0, 2.85], [-0.35, 2.82], [-0.5, 2.76], [-0.5, 1.98]], [[[-0.34, 2.08], [0.34, 2.08], [0.34, 2.61], [-0.34, 2.61]]]);
      end.color = paint;
      parts.push(end, { ...box("车厢前后端窗洞中的独立玻璃", [0, 2.345, z], [0.68, 0.53, 0.025], "#8ba8ad"), opacity: 0.22 });
    }
    for (const z of [-1, 1]) parts.push(box("前后相向乘客长座的实底座箱", [0, 1.48, z], [1.16, 0.3, 0.38], wood), box("前后相向乘客长座的皮坐垫", [0, 1.69, z], [1.18, 0.12, 0.4], leather));
    parts.push(box("中央可通行门旁的第三排无靠背座板", [0, 1.69, 0], [1.1, 0.12, 0.32], leather));
    for (const x of [-0.4, 0.4]) parts.push(strut("中央座板实际接到中央地板的座脚", [x, 1.27, 0], [x, 1.63, 0], 0.065, wood));
    parts.push(box("后行李靴远端完整端围", [0, 1.78, 2.17], [1.25, 0.42, 0.06], leather));
    for (const z of [-0.85, 0.85]) parts.push(strut("车顶行李架前后上栏", [-0.61, 3.08, z], [0.61, 3.08, z], 0.04, dark));
    return parts;
  } },
  { name: "低舆C簧双人敞厢维多利亚马车", theme: "欧式", tags: ["马车", "影视", "维多利亚年代戏", "Victoria低舆敞厢", "独立前车夫座"], create: () => {
    const bowl = openHull("前部低脚舱与后部外张坐舆连成的真实空车厢", [[-0.45, 0.53, 0.42, 0.2], [0.2, 0.73, 0.55, 0.3], [1, 0.73, 0.55, 0.5], [1.3, 0.55, 0.44, 0.45]], 0.045, "#51604b");
    bowl.position.y = 0.62;
    const parts: ModelPart[] = [...compactCarriageGear(-1.1, 1.05, 0.48, 0.7, 1.8), bowl, carriageRoof("仅覆盖后乘客座且具有真实薄壁的折叠皮篷上盖", [[0.25, 0.74, 2], [1.25, 0.74, 2]], 0.15, 0.035, leather), box("后乘客长座下面接到舆底的座箱", [0, 0.8725, 0.65], [1.1, 0.415, 0.5], wood), box("低舆双人座的完整皮坐垫", [0, 1.15, 0.65], [1.2, 0.14, 0.55], leather), box("乘客座后独立软靠背", [0, 1.45, 0.925], [1.2, 0.5, 0.08], leather), box("在低脚舱前端独立向上收窄的驾座靴箱", [0, 1.15, -0.95], [1.08, 0.9, 0.75], "#51604b"), box("高于乘客的完整车夫前座", [0, 1.69, -1.05], [1.18, 0.16, 0.5], leather), box("车夫前座后沿低靠背", [0, 1.89, -0.79], [1.18, 0.3, 0.07], dark), box("皮篷后片从乘客舆体实际连到上盖", [0, 1.55, 1.25], [1.48, 0.9, 0.03], leather)];
    for (const side of [-1, 1]) {
      parts.push(box("前后车桥之间完整的铁制承载底梁", [side * 0.5, 0.83, 0], [0.12, 0.12, 2.6], dark), box("接到前第五轮且避开王销的上承桥半枕", [side * 0.34, 0.81, -1.1], [0.45, 0.06, 0.2], dark));
      for (const z of [-0.75, 0.75]) {
        const front = z < 0, endZ = z + (front ? 1 : -1) * Math.cos(Math.PI / 6) * 0.4;
        parts.push(part("形成真实C形空口的独立钢制悬舆弹簧", "extrude", dark, [side * 0.66, 1, z], [1, 1, 1], [0, front ? 90 : -90, 0], { depth: 0.065, profile: annularSector(0.36, 0.4, -Math.PI * 5 / 6, Math.PI * 5 / 6, 14) }), strut("C形弹簧下端接到底梁的短承托", [side * 0.5, 0.83, endZ], [side * 0.66, 0.8, endZ], 0.075, dark), strut("C形弹簧上端实际吊住低舆侧板的皮革短悬带", [side * 0.66, 1.2, endZ], [side * 0.7, front ? 0.91 : 1.04, front ? 0.25 : 0.85], 0.065, leather));
      }
      parts.push(strut("后舆折篷真实铰接到前上篷角的斜撑弓", [side * 0.73, 1.1, 1], [side * 0.73, 2, 0.25], 0.035, dark), strut("皮篷后沿接到后舆铰座的实支撑", [side * 0.73, 1.1, 1], [side * 0.73, 2, 1.25], 0.035, dark), surface("折篷侧边弓之间真实薄皮革侧片", leather, [[side * 0.73, 1.1, 1], [side * 0.73, 2, 0.25], [side * 0.73, 2, 1.25]], [0, 1, 2]), box("低脚舱旁供长裙乘客上下车的实踏板", [side * 0.87, 0.45, -0.15], [0.35, 0.08, 0.55], dark), strut("登舆踏板实际接到底梁的短下吊杆", [side * 0.5, 0.81, -0.15], [side * 0.87, 0.49, -0.15], 0.055, dark), strut("低舆前车桥上的双长牵引辕", [side * 0.42, 0.595, -1.1], [side * 0.55, 0.81, -2.85], 0.065, wood));
    }
    parts.push(box("前低脚舱端部封住薄壳的实前板", [0, 0.745, -0.45], [1.06, 0.25, 0.06], "#51604b"), box("后舆薄壳端部在座背后闭合的实后板", [0, 0.845, 1.3], [1.1, 0.45, 0.06], "#51604b"));
    return parts;
  } },
  { name: "四柱流苏顶双排长座萨里家用马车", theme: "欧式", tags: ["马车", "影视", "西部年代戏", "Surrey四柱顶棚", "双排同向座"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.05, 1.05, 0.5, 0.65, 1.6), box("两排座位与中央走脚处共用的真实车身地板", [0, 1.12, 0], [1.35, 0.12, 2.55], wood), carriageRoof("四独立顶柱实际承托的薄布拱形遮阳顶", [[-1.4, 0.8, 2.35], [1.4, 0.8, 2.35]], 0.12, 0.05, cloth), box("前排座前由地板承托的完整挡泥前围", [0, 1.47, -1.12], [1.25, 0.62, 0.06], leather, [-8, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(box("从前桥贯通后桥的承载底梁", [side * 0.5, 0.84, 0], [0.12, 0.12, 2.5], dark), box("避开王销并接到第五轮上圈的半幅底座", [side * 0.34, 0.83, -1.05], [0.45, 0.06, 0.2], dark), strut("接在转向前桥上而不挡住踏板的双长辕", [side * 0.42, 0.615, -1.05], [side * 0.55, 0.83, -2.85], 0.065, wood), box("前后排共用侧上车踏板", [side * 0.87, 0.72, 0], [0.35, 0.08, 0.85], dark));
      for (const z of [-0.9, 0.95]) parts.push(strut("从车身地板连续升到遮阳顶内部的四根独立立柱", [side * 0.64, 1.17, z], [side * 0.64, 2.39, z], 0.045, dark));
      for (const z of [-0.3, 0.3]) parts.push(strut("完整上车踏板与车身底梁之间的短斜撑", [side * 0.5, 0.85, z], [side * 0.87, 0.76, z], 0.05, dark));
      for (const z of [-0.9, 0.9]) parts.push(curvedStrip("前后车桥上方独立上弓钢板簧", side * 0.6, z, 1.05, 1, 0.12, 0.07, 0.025, dark), box("板簧中央接到底梁而不悬空的承座", [side * 0.58, 0.94, z], [0.28, 0.1, 0.18], dark));
      const fringe = [{ x: -1.4, y: 2.35 }, { x: 1.4, y: 2.35 }, ...Array.from({ length: 15 }, (_, index) => ({ x: 1.4 - index / 14 * 2.8, y: 2.26 - (index % 2) * 0.035 }))];
      parts.push(part("遮阳顶两侧连续接在顶缘的锯齿流苏布边", "extrude", cloth, [side * 0.8, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.025, profile: fringe }));
    }
    for (const z of [-0.6, 0.65]) {
      parts.push(box("两排朝前长座各自完整的皮革坐垫", [0, 1.58, z], [1.18, 0.12, 0.48], leather), box("朝前长座后沿的实际靠背", [0, 1.84, z + 0.23], [1.18, 0.44, 0.06], wood));
      for (const x of [-0.48, 0.48]) for (const offset of [-0.17, 0.17]) parts.push(strut("各排长座真正落在车身地板上的独立座腿", [x, 1.17, z + offset], [x, 1.52, z + offset], 0.055, wood));
    }
    return parts;
  } },
];
