import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, strut, type TransportDefinition } from "./parts";
import { carriageWheel, curvedStrip } from "./westernHorseCarriageBatchOne";
import { carriageRoof, compactCarriageGear } from "./westernHorseCarriageBatchTwo";
import { solidPanel } from "./marineExpansionBatchTwo";

// 空车不含犬、棺木、马匹等载荷；两款各为独立车体，不按换载荷另计。
// https://www.nationaltrustcollections.org.uk/object/272875.1
// https://www.devonmuseums.net/includes/documents/The%20National%20Trust%20Carriage%20Museum%20Guide.pdf
// https://collections.museumsvictoria.com.au/items/388123
// https://www.nationaltrust.org.au/news/the-last-ride-in-style/

const wood = "#856441", dark = "#323734", trim = "#b09d74", leather = "#665447", glass = "#8aa5a5";

export const westernHorseCarriageBatchFour: TransportDefinition[] = [
  { name: "通风座箱背靠背长座乡间客运马车", theme: "欧式", tags: ["马车", "影视", "十九世纪乡间年代戏", "Dogcart背靠背客车", "空通风座箱"], create: () => {
    const parts: ModelPart[] = [...[-1, 1].flatMap(side => carriageWheel([side * 0.88, 0.73, 0], 0.73)), cylinder("通风座箱下方完整横向车轴", [0, 0.73, 0], [0.07, 2, 0.07], dark, [0, 0, 90]), box("前后座下方保持真实中空的座箱底板", [0, 0.97, 0], [1.28, 0.08, 1.64], wood), box("分别承托前后乘客座的实顶板", [0, 1.38, 0], [1.32, 0.08, 1.7], wood), box("向前驾驶长座完整皮坐垫", [0, 1.48, -0.43], [1.18, 0.16, 0.46], leather), box("向后乘坐长座完整皮坐垫", [0, 1.48, 0.43], [1.18, 0.16, 0.46], leather), box("前后两排共用而形成背靠背的中央高靠背", [0, 1.73, 0], [1.18, 0.62, 0.075], wood), box("后箱口下铰并放平供后座乘客踏脚的完整尾板", [0, 0.99, 1.12], [1.28, 0.08, 0.6], wood), box("前座乘客独立低脚床", [0, 1, -1.2], [1.18, 0.1, 0.65], wood)];
    const front = solidPanel("通风座箱前端真实开长透气孔的固定面板", [0, 0, -0.82], [1, 0, 0], [0, 1, 0], [[-0.64, 0.98], [0.64, 0.98], [0.64, 1.4], [-0.64, 1.4]], [[[-0.5, 1.12], [0.5, 1.12], [0.5, 1.32], [-0.5, 1.32]]]);
    front.color = wood;
    parts.push(front);
    for (const x of [-0.42, -0.25, -0.08, 0.08, 0.25, 0.42]) parts.push(box("前长通风孔中真实相隔的防护窄条", [x, 1.22, -0.82], [0.026, 0.22, 0.075], dark));
    for (const side of [-1, 1]) {
      parts.push(curvedStrip("通风座箱两侧接在横轴上的长上弓悬簧", side * 0.66, 0, 1.6, 0.93, 0.21, 0.07, 0.025, dark), box("横轴顶面与长悬簧之间的实承夹座", [side * 0.66, 0.83, 0], [0.16, 0.17, 0.2], dark));
      for (const y of [1, 1.39]) parts.push(box("通风侧格上下连续接到座箱的实围框", [side * 0.64, y, 0], [0.07, 0.08, 1.66], wood));
      for (const z of [-0.78, 0.78]) parts.push(box("通风座箱四角连接顶底板的实竖柱", [side * 0.64, 1.19, z], [0.07, 0.42, 0.07], wood));
      for (const z of [-0.6, -0.4, -0.2, 0, 0.2, 0.4, 0.6]) parts.push(box("通风座箱侧面保持真实缝隙的独立竖木条", [side * 0.64, 1.195, z], [0.055, 0.34, 0.06], wood));
      parts.push(strut("打开尾板两侧实际接到箱角的悬吊短链", [side * 0.62, 1.39, 0.8], [side * 0.6, 1.03, 1.4], 0.02, dark), strut("前脚床从座箱下端延伸的连续侧承杆", [side * 0.55, 1, -0.78], [side * 0.55, 1, -1.35], 0.075, wood), strut("由轴夹座绕过前脚床的长辕后弯段", [side * 0.66, 0.82, 0], [side * 0.66, 0.76, -1.5], 0.07, wood), strut("双辕前端收至单马挽具的完整前段", [side * 0.66, 0.76, -1.5], [side * 0.5, 0.9, -2.85], 0.07, wood));
      for (const direction of [-1, 1]) parts.push(strut("前后两座外侧分别接到中央靠背的低扶手", [side * 0.59, 1.62, direction * 0.6], [side * 0.59, 1.8, direction * 0.04], 0.04, dark), strut("低扶手外端实际落在对应座垫边的短支柱", [side * 0.59, 1.48, direction * 0.6], [side * 0.59, 1.62, direction * 0.6], 0.04, dark));
    }
    return parts;
  } },
  { name: "独立前驾座高玻璃空厢礼仪灵马车", theme: "欧式", tags: ["马车", "影视", "维多利亚年代戏", "玻璃灵车", "完整礼仪马车空装载厢"], create: () => {
    const parts: ModelPart[] = [...compactCarriageGear(-1.15, 1.35, 0.48, 0.68, 1.8), box("接在悬架上的完整长装载厢底平台", [0, 1.05, 0.3], [1.5, 0.16, 3.2], dark), carriageRoof("高玻璃厢上方前后收肩的真实薄木拱顶", [[-1.5, 0.48, 2.61], [-1.05, 0.85, 2.61], [1.65, 0.85, 2.61], [2.1, 0.48, 2.61]], 0.17, 0.08, dark), box("玻璃厢内部供装载独立长物的空长承台", [0, 1.23, 0.3], [1.05, 0.12, 2.4], wood), box("前部独立驾座靴托底接入装载厢前端", [0, 1.55, -1.65], [1.25, 0.12, 0.8], dark), box("前部车夫座下方完整实承箱座", [0, 1.75, -1.65], [1.15, 0.28, 0.65], dark), box("前部露天完整车夫双人坐垫", [0, 1.96, -1.65], [1.27, 0.14, 0.55], leather), box("车夫座后沿低靠背", [0, 2.17, -1.37], [1.27, 0.3, 0.07], dark), strut("前转向桥实接的长牵引辕", [0, 0.595, -1.15], [0, 0.8, -3.75], 0.11, wood), box("长辕前端供挽具安装的平衡横木", [0, 0.8, -3.6], [1.55, 0.1, 0.14], wood)];
    for (const side of [-1, 1]) {
      parts.push(box("从转向前桥贯通后车桥的承重底梁", [side * 0.5, 0.8, 0.1], [0.12, 0.12, 3.1], dark), box("第五轮上避开王销的半幅前承枕", [side * 0.34, 0.81, -1.15], [0.45, 0.06, 0.2], dark), box("玻璃厢窗底的连续实木长槛", [side * 0.72, 1.18, 0.3], [0.11, 0.18, 3.1], dark), box("玻璃厢窗顶连续承托拱顶的长檐枋", [side * 0.72, 2.59, 0.3], [0.12, 0.12, 3.1], dark));
      for (const z of [-1.2, 0.4, 1.8]) {
        parts.push(part("窗间真正落接底槛并支到顶檐的车厢立柱", "lathe", dark, [side * 0.72, 1.25, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.075, y: 0 }, { x: 0.075, y: 0.12 }, { x: 0.045, y: 0.18 }, { x: 0.045, y: 1.13 }, { x: 0.075, y: 1.22 }, { x: 0.075, y: 1.36 }, { x: 0, y: 1.36 }] }), part("直接落在拱顶上的小型礼仪顶饰", "lathe", trim, [side * 0.66, 2.66, z], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.09, y: 0 }, { x: 0.07, y: 0.05 }, { x: 0.1, y: 0.12 }, { x: 0.075, y: 0.2 }, { x: 0.025, y: 0.27 }, { x: 0, y: 0.28 }] }));
      }
      parts.push({ ...box("立柱之间真实透视空厢的前侧玻璃", [side * 0.72, 1.91, -0.4], [0.024, 1.3, 1.6], glass), opacity: 0.24 }, { ...box("立柱之间真实透视空厢的后侧玻璃", [side * 0.72, 1.91, 1.1], [0.024, 1.3, 1.4], glass), opacity: 0.24 });
      parts.push(strut("前车夫座靴底从装载厢平台伸出的实斜承梁", [side * 0.5, 1.12, -1.2], [side * 0.5, 1.51, -1.65], 0.08, dark));
      for (const z of [-0.85, 1.05]) parts.push(curvedStrip("玻璃长厢底下独立上弓板簧", side * 0.61, z, 1.15, 0.94, 0.12, 0.075, 0.025, dark), box("板簧中央实接到底梁的承托夹座", [side * 0.58, 0.9, z], [0.25, 0.1, 0.2], dark));
      for (const z of [-0.6, 1.2]) parts.push(box("内部长承台与底平台之间的实支垫", [side * 0.42, 1.15, z], [0.14, 0.06, 0.2], wood));
      const angle = side > 0 ? 40 * Math.PI / 180 : 0, hinge = side * 0.72, x = hinge - side * 0.36 * Math.cos(angle), z = 1.8 + side * 0.36 * Math.sin(angle), rotation: Triple = [0, side > 0 ? 40 : 0, 0];
      parts.push({ ...box("后装载口其中一扇真实外开的玻璃门叶", [x, 1.91, z], [0.66, 1.27, 0.024], glass, rotation), opacity: 0.22 }, box("后玻璃门叶的独立下框", [x, 1.26, z], [0.72, 0.06, 0.065], dark, rotation), box("后玻璃门叶的独立上框", [x, 2.59, z], [0.72, 0.06, 0.065], dark, rotation));
      for (const f of [0, 0.72]) parts.push(box("后玻璃门叶真正连住上下框的立门梃", [hinge - side * f * Math.cos(angle), 1.925, 1.8 + side * f * Math.sin(angle)], [0.06, 1.39, 0.065], dark, rotation));
    }
    const front = solidPanel("驾驶座后方为装载厢真正留窗的端围板", [0, 0, -1.2], [1, 0, 0], [0, 1, 0], [[-0.72, 1.26], [0.72, 1.26], [0.72, 2.62], [0.5, 2.72], [0, 2.75], [-0.5, 2.72], [-0.72, 2.62]], [[[-0.56, 1.38], [0.56, 1.38], [0.56, 2.48], [-0.56, 2.48]]]);
    front.color = dark;
    const lintel = solidPanel("装载后门上方实际贴住弧形顶壳的弓形门楣", [0, 0, 1.8], [1, 0, 0], [0, 1, 0], [[-0.72, 2.6], [0.72, 2.6], [0.72, 2.62], [0.5, 2.72], [0, 2.75], [-0.5, 2.72], [-0.72, 2.62]]);
    lintel.color = dark;
    parts.push(front, lintel, { ...box("前端真实窗洞中的独立玻璃", [0, 1.93, -1.2], [1.12, 1.1, 0.025], glass), opacity: 0.24 }, box("后装载门下端的完整实门槛", [0, 1.18, 1.8], [1.5, 0.18, 0.12], dark));
    for (const z of [-0.65, -0.25, 0.15, 0.55, 0.95, 1.35]) parts.push(cylinder("空长承台上实际连接两侧并辅助装载的横滚筒", [0, 1.31, z], [0.06, 1.08, 0.06], dark, [0, 0, 90]));
    return parts;
  } },
];
