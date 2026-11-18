import { part, type ModelPart } from "../assetModelParts";
import { box, cylinder, strut, surface, type TransportDefinition } from "./parts";
import { carriageWheel, curvedStrip } from "./westernHorseCarriageBatchOne";
import { carriageRoof, compactCarriageGear } from "./westernHorseCarriageBatchTwo";
import { openHull } from "./marineExpansionBatchOne";
import { solidPanel } from "./marineExpansionBatchTwo";

// 独立客运车体；不以升降同一折篷或增加马匹另计主素材。
// https://www.londonbusmuseum.com/what-to-see/double-deck-buses/knife-board-horse-bus/
// https://artsandculture.google.com/story/horse-bus-vehicle-design-tfl-archives/8QUhLwPf06cr4w
// https://www.nationaltrustcollections.org.uk/object/272952
// https://www.devonmuseums.net/includes/documents/The%20National%20Trust%20Carriage%20Museum%20Guide.pdf

const wood = "#8b6845", dark = "#323936", leather = "#655449", paint = "#5c6c55";

export const westernHorseCarriageBatchThree: TransportDefinition[] = [
  { name: "外后梯背靠长顶座双层马拉公交车", theme: "欧式", tags: ["马车", "影视", "维多利亚年代戏", "Knifeboard Omnibus", "双层马拉公交"], create: () => {
    const body: ModelPart[] = [box("上下两侧长座之间真实可通行的下层客舱地板", [0, 0.99, 0], [1.65, 0.12, 3.65], wood), box("承托敞天上层而不填实下层的薄车顶", [0, 2.61, 0], [1.7, 0.12, 3.7], wood), box("后门外侧供乘客和售票人立足的实平台", [0, 0.92, 2.075], [1.6, 0.14, 0.55], dark), box("乘客从地面登后平台的第一级踏板", [0, 0.35, 2.45], [1.1, 0.1, 0.28], dark), box("后平台与首级之间的第二级踏板", [0, 0.65, 2.22], [1.2, 0.1, 0.3], dark), box("后门实际留空上方的门楣", [0, 2.53, 1.8], [1.65, 0.16, 0.06], paint), box("上层背靠背长座共用的中央窄靠背", [0, 3.2, 0], [0.07, 0.5, 2.9], wood), box("车夫前座下面与车舱前壁实接的空心靴箱托底", [0, 1.7, -2.05], [1.35, 0.12, 0.65], wood), box("独立前置车夫座的承重箱座", [0, 1.88, -2.05], [1.25, 0.3, 0.55], paint), box("与下层客舱分开的露天车夫长座", [0, 2.1, -2.05], [1.4, 0.14, 0.55], leather), box("车夫座后沿短靠背", [0, 2.31, -1.78], [1.4, 0.3, 0.065], paint)];
    for (const side of [-1, 1]) {
      body.push(box("下层长窗下面完整实侧围", [side * 0.8, 1.435, 0], [0.065, 0.77, 3.6], paint), box("真实长窗下缘连续窗槛", [side * 0.8, 1.83, 0], [0.08, 0.1, 3.65], wood), box("真实长窗上缘连接薄车顶的纵梁", [side * 0.8, 2.51, 0], [0.08, 0.1, 3.65], paint), box("下层面对面纵长座的完整皮坐垫", [side * 0.57, 1.4, 0], [0.36, 0.1, 3.15], leather), box("下层长座贴着侧围的低靠背", [side * 0.755, 1.66, 0], [0.035, 0.45, 3.15], leather), box("后中央门口两侧的完整端围", [side * 0.58, 1.82, 1.8], [0.44, 1.55, 0.065], paint), box("敞天上层沿中央靠背向外坐的长座板", [side * 0.22, 2.98, 0], [0.4, 0.12, 2.9], leather));
      for (const z of [-1.35, 0, 1.35]) body.push(strut("下层长座真实落地的短座脚", [side * 0.57, 1.05, z], [side * 0.57, 1.35, z], 0.065, wood), strut("上层长座下接到车顶的实支柱", [side * 0.22, 2.67, z], [side * 0.22, 2.92, z], 0.065, wood));
      for (const z of [-1.8, -0.9, 0, 0.9, 1.8]) body.push(box("把四个车窗真正分开的承顶窗柱", [side * 0.8, 2.18, z], [0.075, 0.76, 0.065], paint));
      for (const z of [-1.35, -0.45, 0.45, 1.35]) body.push({ ...box("真实空窗框中的独立薄玻璃", [side * 0.8, 2.17, z], [0.024, 0.62, 0.79], "#88a6a8"), opacity: 0.24 });
      body.push(strut("从客舱后沿承托两级上车踏板的侧斜梁", [side * 0.47, 1, 1.8], [side * 0.47, 0.3, 2.45], 0.075, dark));
      for (const z of [-1.75, -0.5, 0.8]) body.push(strut("敞天上层外缘护栏独立立柱", [side * 0.81, 2.65, z], [side * 0.81, 3.2, z], 0.045, dark));
      body.push(strut("上层两侧长护栏前至后开放登梯缺口", [side * 0.81, 3.2, -1.75], [side * 0.81, 3.2, side > 0 ? 1.2 : 1.75], 0.045, dark));
    }
    const frontWall = solidPanel("车舱前壁真正开出观察窗的完整端板", [0, 0, -1.8], [1, 0, 0], [0, 1, 0], [[-0.8, 1.05], [0.8, 1.05], [0.8, 2.55], [-0.8, 2.55]], [[[-0.5, 1.85], [0.5, 1.85], [0.5, 2.45], [-0.5, 2.45]]]);
    frontWall.color = paint;
    body.push(frontWall, { ...box("车舱前端实际窗洞中的薄玻璃", [0, 2.15, -1.8], [1, 0.6, 0.025], "#88a6a8"), opacity: 0.24 }, strut("上层前端完整横护栏", [-0.81, 3.2, -1.75], [0.81, 3.2, -1.75], 0.045, dark), strut("后端护栏保留右侧真实登梯入口", [-0.81, 3.2, 1.75], [0.35, 3.2, 1.75], 0.045, dark));
    for (const x of [0.46, 0.78]) body.push(strut("从后平台一直到上层边沿的外置斜梯边梁", [x, 0.99, 2.13], [x, 2.67, 1.85], 0.045, dark));
    for (let index = 0; index <= 7; index++) { const f = index / 7; body.push(strut("外后梯两边梁之间真正相接的横踏档", [0.46, 0.99 + f * 1.68, 2.13 - f * 0.28], [0.78, 0.99 + f * 1.68, 2.13 - f * 0.28], 0.04, dark)); }
    body.forEach(p => p.position.y += 0.08);
    const parts: ModelPart[] = [...compactCarriageGear(-1.35, 1.3, 0.55, 0.78, 1.85), ...body, strut("由转向前桥实接出来的长牵引辕", [0, 0.665, -1.35], [0, 0.83, -3.85], 0.12, wood), box("前端供一对挽具使用的完整横平衡木", [0, 0.83, -3.7], [1.6, 0.12, 0.15], wood)];
    for (const side of [-1, 1]) {
      parts.push(box("完整贯通前后桥且位于弹簧下方的底梁", [side * 0.5, 0.88, 0], [0.12, 0.16, 3.25], dark), box("避开王销而接到上第五轮的前半承枕", [side * 0.35, 0.88, -1.35], [0.45, 0.06, 0.2], dark));
      for (const z of [-0.95, 0.95]) parts.push(curvedStrip("承托上下双层客舱的独立长弓板簧", side * 0.61, z, 1.15, 1.02, 0.1, 0.075, 0.025, dark), box("长弓板簧中央实际接到底梁的短夹座", [side * 0.58, 0.98, z], [0.25, 0.07, 0.18], dark));
    }
    return parts;
  } },
  { name: "双折皮篷对坐舟舆兰道客运马车", theme: "欧式", tags: ["马车", "影视", "维多利亚年代戏", "Canoe Landau", "双折篷对坐舟舆"], create: () => {
    const bowl = openHull("前后收尖而中央敞开的真实舟形乘坐舆", [[-1.35, 0.5, 0.39, 0.58], [-0.8, 0.72, 0.54, 0.5], [0.8, 0.72, 0.54, 0.5], [1.35, 0.5, 0.39, 0.58]], 0.045, paint);
    bowl.vertices!.forEach(p => p.y += 0.23 * (p.z / 1.35) ** 2);
    bowl.position.y = 0.83;
    const parts: ModelPart[] = [...compactCarriageGear(-1.2, 1.2, 0.52, 0.73, 1.85), bowl, box("独立前车夫座的长靴托底", [0, 1.2, -1.64], [1.25, 0.12, 0.7], wood), box("前车夫座下真正承重的高靴箱", [0, 1.49, -1.64], [1.15, 0.46, 0.6], paint), box("高于前后乘客座的车夫长坐垫", [0, 1.79, -1.64], [1.26, 0.14, 0.55], leather), box("车夫座后低靠背", [0, 2, -1.36], [1.26, 0.3, 0.06], dark), strut("转向前桥下实际相连的完整长辕", [0, 0.635, -1.2], [0, 0.82, -3.7], 0.11, wood), box("双马挽具用前平衡横木", [0, 0.82, -3.55], [1.55, 0.1, 0.14], wood)];
    for (const z of [-1.35, 1.35]) parts.push(box("舟舆前后端真正封闭薄壳内腔的短端壁", [0, 1.35, z], [1, 0.58, 0.06], paint));
    for (const z of [-0.86, 0.86]) {
      parts.push(box("前后相向长座下面直接接到舆底的座箱", [0, 1.1075, z], [1.04, 0.315, 0.42], wood), box("相向乘坐的两条完整长皮坐垫", [0, 1.335, z], [1.17, 0.14, 0.48], leather), box("相向长座靠在舟舆两端的低软靠背", [0, 1.65, z + Math.sign(z) * 0.23], [1.16, 0.5, 0.07], leather));
      const end = Math.sign(z);
      parts.push(carriageRoof("两套皮篷分别折叠在前后端的薄皮革叠层", [[end * 1.02, 0.66, 1.7], [end * 1.26, 0.67, 1.75], [end * 1.43, 0.58, 1.6]].toSorted((a, b) => a[0]! - b[0]!) as [number, number, number][], 0.13, 0.035, leather));
      for (const offset of [0, 0.1, 0.2]) {
        const outer = Array.from({ length: 9 }, (_, index) => ({ x: Math.cos(index * Math.PI / 8) * (0.64 - offset * 0.12), y: 1.45 + offset * 0.35 + Math.sin(index * Math.PI / 8) * 0.38 }));
        const inner = outer.toReversed().map(p => ({ x: p.x * 0.98, y: p.y - 0.018 }));
        parts.push(part("前后各自独立铰接并收拢成叠的折篷细弓", "extrude", dark, [0, 0, end * (1.17 + offset)], [1, 1, 1], [0, 0, 0], { depth: 0.022, profile: [...outer, ...inner] }));
      }
    }
    for (const side of [-1, 1]) {
      parts.push(box("连接前后车桥且绕开低脚舱底部的连续铁底梁", [side * 0.7, 0.86, 0], [0.1, 0.14, 2.9], dark), box("接到前转向第五轮且避开王销的半幅前承枕", [side * 0.46, 0.85, -1.2], [0.68, 0.06, 0.2], dark), box("舟舆侧边低登车踏板", [side * 0.9, 0.57, 0], [0.36, 0.08, 0.55], dark), strut("侧踏板接到底梁的独立下撑", [side * 0.7, 0.85, 0], [side * 0.9, 0.61, 0], 0.06, dark));
      for (const z of [-0.9, 0.9]) parts.push(curvedStrip("在端部向上托起独立舟舆的上弓悬簧", side * 0.62, z, 1.05, 0.955, 0.16, 0.07, 0.025, dark), box("把上弓悬簧夹在底梁上的短夹座", [side * 0.66, 0.92, z], [0.25, 0.08, 0.17], dark));
      parts.push(surface("左右低门片沿着实际外张舆壁坡面收纳", paint, [[side * 0.58, 1, -0.32], [side * 0.58, 1, 0.32], [side * 0.71, 1.375, 0.32], [side * 0.71, 1.375, -0.32]], [0, 1, 2, 0, 2, 3]));
      for (const end of [-1, 1]) {
        parts.push(strut("舟舆端部实接到折篷共同铰座的短支架", [side * 0.55, 1.53, end * 1.2], [side * 0.64, 1.45, end * 1.17], 0.04, dark));
        for (const offset of [0.1, 0.2]) parts.push(strut("折篷收拢细弓脚端实际回接共同铰座的短连杆", [side * 0.64, 1.45, end * 1.17], [side * (0.64 - offset * 0.12), 1.45 + offset * 0.35, end * (1.17 + offset)], 0.025, dark));
      }
    }
    return parts;
  } },
  { name: "双辕板簧悬单排高座吉格轻客马车", theme: "欧式", tags: ["马车", "影视", "十九世纪年代戏", "Gig双轮轻客车", "自驾单排高座"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => carriageWheel([side * 0.84, 0.72, 0.27], 0.72, 0.1)), cylinder("单排高座下面真实连续的横车轴", [0, 0.72, 0.27], [0.07, 1.92, 0.07], dark, [0, 0, 90]), box("车手与乘客共用的完整单排皮坐垫", [0, 1.31, 0.23], [1.18, 0.13, 0.5], leather), box("高座后端完整曲靠的实木背板", [0, 1.58, 0.48], [1.18, 0.48, 0.065], wood, [8, 0, 0]), box("单排座位之前的实低脚踏床", [0, 0.91, -0.44], [1.18, 0.1, 0.8], wood), box("保护车手脚前方的完整皮革挡泥围", [0, 1.16, -0.87], [1.2, 0.65, 0.065], leather, [-13, 0, 0])];
    for (const side of [-1, 1]) {
      parts.push(curvedStrip("双轮轻客车两侧真正落在车轴夹座的板簧", side * 0.63, 0.27, 1.45, 0.91, 0.2, 0.07, 0.025, dark), box("轴上板簧承力的实夹座", [side * 0.63, 0.82, 0.27], [0.16, 0.17, 0.2], dark), strut("上弓板簧后端接到高座底板的短斜承托", [side * 0.63, 1.11, 0.995], [side * 0.5, 1.245, 0.39], 0.06, wood), strut("前簧端实际伸到脚踏床边的侧承杆", [side * 0.63, 1.11, -0.455], [side * 0.55, 0.93, -0.7], 0.065, wood), strut("从车轴座绕过脚踏两侧的长辕后段", [side * 0.63, 0.78, 0.27], [side * 0.64, 0.78, -1.1], 0.065, wood), strut("双辕前端收窄至单马挽具的位置", [side * 0.64, 0.78, -1.1], [side * 0.48, 0.9, -2.55], 0.065, wood), strut("高座两侧完整低扶手", [side * 0.59, 1.43, 0], [side * 0.59, 1.55, 0.47], 0.04, dark), strut("扶手前端落到坐垫侧边的短立杆", [side * 0.59, 1.31, 0], [side * 0.59, 1.43, 0], 0.04, dark));
    }
    return parts;
  } },
];
