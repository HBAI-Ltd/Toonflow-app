import { part, ring, type ModelPart } from "../assetModelParts";
import { aftHouse } from "./merchantModels";
import { ball, box, cab, cylinder, shipHull, strut, transportColors, type TransportDefinition } from "./parts";

function compactWheelhouse(width: number, y: number, z: number): ModelPart[] {
  return [box("紧凑驾驶舱体", [0, y + 0.75, z], [width, 1.5, 1.8]), box("驾驶室前窗", [0, y + 1.1, z - 0.92], [width * 0.85, 0.6, 0.035], transportColors.glass), ...[-1, 1].map(side => box("驾驶室侧窗", [side * width * 0.51, y + 1.1, z], [0.035, 0.6, 1.2], transportColors.glass)), box("驾驶舱顶盖", [0, y + 1.57, z], [width + 0.18, 0.14, 2], transportColors.trim), cylinder("舱后短排气筒", [0, y + 1.75, z + 0.6], [0.24, 1, 0.24], transportColors.dark)];
}

export const workShipModels: TransportDefinition[] = [
  { name: "小水线面双体工作船", tags: ["SWATH", "深潜浮体", "细支柱穿水面"], create: () => {
    const parts: ModelPart[] = [box("高位跨体工作甲板", [0, 2.7, 0], [6, 0.35, 9.8]), ...compactWheelhouse(4.1, 2.9, -2.3)];
    for (const side of [-1, 1]) { parts.push(part("深置长潜体", "capsule", transportColors.dark, [side * 2.2, 0.7, 0], [2.4, 7.8, 2.4], [90, 0, 0]), box("窄水线流线支柱", [side * 2.2, 1.8, -0.1], [0.35, 2.1, 5.8], transportColors.body), box("潜体艉稳向鳍", [side * 2.2, 0.7, 4.1], [0.09, 1.1, 1], transportColors.signal), box("潜体横向稳定翼", [side * 2.2, 0.7, 3.5], [2, 0.08, 0.65], transportColors.trim), cylinder("潜体艉推进器", [side * 2.2, 0.7, 4.2], [0.5, 0.3, 0.5], transportColors.dark, [90, 0, 0])); }
    parts.push(box("后工作区护舷", [0, 3.05, 4.8], [5.9, 0.3, 0.2], transportColors.dark)); return parts;
  } },
  { name: "月池取芯钻探船", tags: ["海洋科学", "贯通月池", "取芯钻塔"], create: () => {
    const outer = [[-0.6, -7.5], [0.6, -7.5], [2.6, -4.5], [2.6, 7.5], [-2.6, 7.5], [-2.6, -4.5]], inner = [[-0.8, -1.25], [0.8, -1.25], [0.8, 0], [0.8, 1.25], [-0.8, 1.25], [-0.8, 0]];
    const vertices = [outer.map(([x, z]) => ({ x: x!, y: 1.6, z: z! })), inner.map(([x, z]) => ({ x: x!, y: 1.6, z: z! })), outer.map(([x, z]) => ({ x: x! * 0.72, y: 0, z: z! * 0.97 })), inner.map(([x, z]) => ({ x: x!, y: 0, z: z! }))].flat();
    const indices: number[] = [];
    for (let i = 0; i < 6; i++) { const n = (i + 1) % 6; indices.push(i, i + 6, n, n, i + 6, n + 6, i + 12, n + 12, i + 18, n + 12, n + 18, i + 18, i, n, n + 12, i, n + 12, i + 12, i + 6, i + 18, n + 6, n + 6, i + 18, n + 18); }
    const parts: ModelPart[] = [part("带真实贯通月池的船壳", "mesh", transportColors.body, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), ...aftHouse(4.5, 1.6, -4.8), box("后部取芯处理棚", [0, 2.2, 5], [3.8, 1.2, 3]), cylinder("取芯钻杆悬吊管", [0, 3.7, 0], [0.09, 6, 0.09], transportColors.dark)];
    for (const x of [-1, 1]) for (const z of [-1, 1]) { parts.push(strut("锥形钻塔角柱", [x * 1.2, 1.65, z * 1.7], [x * 0.45, 8.5, z * 0.65], 0.13, transportColors.signal)); for (let i = 0; i < 3; i++) parts.push(strut("钻塔斜腹杆", [x * (1.2 - i * 0.25), 1.7 + i * 2.25, z * (1.7 - i * 0.35)], [-x * (0.95 - i * 0.25), 3.95 + i * 2.25, z * (1.35 - i * 0.35)], 0.055)); }
    parts.push(box("钻塔顶天车梁", [0, 8.55, 0], [1.2, 0.25, 1.6], transportColors.dark), ...[-1, 1].map(side => box("侧舷长钻杆架", [side * 2, 1.95, 2.1], [0.6, 0.5, 4.7], transportColors.trim))); return parts;
  } },
  { name: "多缆拖曳地震勘测船", tags: ["海底勘测", "宽尾多道拖缆"], create: () => {
    const parts = [shipHull(5.5, 15.5, 1.65), ...aftHouse(4.8, 1.65, -4.7), box("宽艉缆线作业棚", [0, 2.5, 3.5], [5.3, 1.7, 4.5], transportColors.body), box("艉部外展横梁", [0, 3.5, 5.7], [8.7, 0.22, 0.25], transportColors.signal)];
    for (let index = 0; index < 6; index++) { const x = (index - 2.5) * 1.25; parts.push(cylinder("多道独立拖缆卷筒", [x * 0.55, 2.5, 5.5], [0.8, 0.55, 0.8], transportColors.dark, [0, 0, 90]), strut("发散拖曳观测缆", [x, 3.5, 5.7], [x * 1.5, 0.4, 10], 0.025, transportColors.dark), ball("拖缆尾定位浮标", [x * 1.5, 0.4, 10], [0.3, 0.2, 0.55], transportColors.signal)); }
    for (const side of [-1, 1]) parts.push(strut("艉横梁斜拉杆", [side * 1.4, 4.6, 2.5], [side * 4.35, 3.5, 5.7], 0.055)); return parts;
  } },
  { name: "全回转港口拖轮", tags: ["港口作业", "艏推顶橡胶护舷"], create: () => {
    const parts: ModelPart[] = [shipHull(3.5, 6.7, 1.05), box("中央低位舱体", [0, 1.5, -0.3], [2.5, 0.9, 2.9]), box("高位全景驾驶室", [0, 2.3, -0.4], [2.1, 0.8, 2]), box("全景驾驶前窗", [0, 2.35, -1.42], [1.8, 0.5, 0.035], transportColors.glass), box("驾驶室压檐", [0, 2.76, -0.4], [2.35, 0.15, 2.2], transportColors.trim), cylinder("后甲板拖缆绞盘", [0, 1.5, 1.8], [0.95, 1.8, 0.95], transportColors.dark, [0, 0, 90]), strut("拖曳系缆柱", [0, 1.1, 2.9], [0, 1.7, 2.9], 0.2), box("宽厚艏推顶缓冲垫", [0, 0.9, -3.15], [2, 0.8, 0.45], transportColors.dark)];
    for (const side of [-1, 1]) { parts.push(cylinder("船底全回转推进单元", [side * 0.8, 0.15, 1.2], [0.6, 0.8, 0.6], transportColors.dark), cylinder("全回转导管推进口", [side * 0.8, -0.2, 1.2], [0.65, 0.35, 0.65], transportColors.trim, [90, 0, 0])); for (const z of [-1.8, -0.4, 1.1, 2.4]) parts.push(part("舷外轮胎护舷", "torus", transportColors.dark, [side * 1.67, 0.85, z], [0.5, 0.5, 0.18], [0, 90, 0])); } return parts;
  } },
  { name: "延绳钓渔船", tags: ["渔业", "主绳卷盘", "舷侧起绳机"], create: () => [shipHull(3.1, 8.5, 1), ...compactWheelhouse(2.1, 1.05, -2.5), cylinder("甲板大主绳卷盘", [0, 1.75, 1.7], [1.5, 1.3, 1.5], transportColors.dark, [0, 0, 90]), ...[-1, 1].map(side => cylinder("卷盘侧挡边", [side * 0.68, 1.75, 1.7], [1.7, 0.08, 1.7], transportColors.trim, [0, 0, 90])), cylinder("右舷摩擦起绳轮", [1.6, 1.65, -0.2], [0.8, 0.3, 0.8], transportColors.signal, [0, 0, 90]), strut("起绳轮导绳吊臂", [1.25, 1.2, -0.1], [2, 2.4, -0.7], 0.1), cylinder("起绳臂端滑轮", [2, 2.4, -0.7], [0.3, 0.1, 0.3], transportColors.dark, [0, 0, 90]), box("钩线整理工作台", [1.1, 1.45, 1], [0.5, 0.8, 2.2], transportColors.trim), ...[-1, 1].map(side => ball("主绳储备浮球", [side * 0.7, 1.4, 3], [0.6, 0.6, 0.6], transportColors.signal))] },
  { name: "笼捕蟹渔船", tags: ["渔业", "笼具叠放", "吊笼滚轮"], create: () => {
    const parts = [shipHull(3.6, 9.2, 1.1), ...compactWheelhouse(2.3, 1.1, -2.8), strut("右舷吊笼吊柱", [1.3, 1.1, -0.3], [1.3, 3.2, -0.3], 0.13), strut("外展吊笼臂", [1.3, 3.2, -0.3], [2.2, 2.9, 0.6], 0.13), strut("吊笼钢索", [2.2, 2.9, 0.6], [2.2, 1.5, 0.6], 0.025), cylinder("舷边倒笼橡胶滚轮", [1.7, 1.3, 0.4], [0.35, 1.1, 0.35], transportColors.dark, [90, 0, 0])];
    for (const z of [1.1, 2.8]) for (const y of [1.6, 2.5]) { const c = box("敞框蟹笼底网", [0, y - 0.4, z], [2.1, 0.05, 1.4], transportColors.dark); parts.push(c, box("敞框蟹笼顶网", [0, y + 0.4, z], [2.1, 0.05, 1.4], transportColors.dark)); for (const x of [-1, 1]) for (const end of [-1, 1]) parts.push(strut("蟹笼竖边角框", [x, y - 0.4, z + end * 0.65], [x, y + 0.4, z + end * 0.65], 0.045)); parts.push(part("蟹笼漏斗进蟹口", "cone", transportColors.trim, [1.02, y, z], [0.4, 0.4, 0.4], [0, 0, 90])); } return parts;
  } },
  { name: "舷台竿钓渔船", tags: ["渔业", "外伸站立钓台", "诱鱼洒水管"], create: () => {
    const parts = [shipHull(3.3, 8.2, 1), ...compactWheelhouse(2.15, 1.05, 1.8), box("艏部外伸站立钓台", [0, 1.05, -2.7], [4.4, 0.12, 2.4], transportColors.trim), box("活饵循环水舱", [0, 1.45, 0], [2.2, 0.8, 1.5], transportColors.dark)];
    for (const side of [-1, 1]) { parts.push(strut("钓台外缘护杆", [side * 2.1, 1.6, -3.8], [side * 2.1, 1.6, -1.6], 0.04), strut("诱鱼洒水总管", [side * 2.15, 0.95, -3.7], [side * 2.15, 0.95, -1.6], 0.055)); for (const z of [-3.5, -2.7, -1.9]) parts.push(strut("外伸竹钓竿", [side * 1.7, 1.3, z], [side * 3.2, 3.6, z - 0.4], 0.025, transportColors.wood), strut("竹竿垂钓线", [side * 3.2, 3.6, z - 0.4], [side * 3.2, 0.35, z - 0.4], 0.004), cylinder("舷外洒水嘴", [side * 2.2, 0.95, z], [0.06, 0.18, 0.06], transportColors.trim, [0, 0, side * 70])); }
    return parts;
  } },
  { name: "双浮体转鼓收油船", tags: ["水面污染回收", "亲油转鼓", "开放收油口"], create: () => {
    const parts = [box("跨体尾部回收工作台", [0, 0.9, 1.3], [3.2, 0.3, 3.1]), box("回收油水分离箱", [0, 1.45, 1.7], [1.7, 0.8, 1.9], transportColors.body), ...cab([1.15, 1, 1.6], [0.8, 1.3, 1.2], true), cylinder("前置亲油吸附转鼓", [0, 0.7, -1.2], [1.1, 2.2, 1.1], transportColors.dark, [0, 0, 90]), box("转鼓刮油集液槽", [0, 0.95, -0.7], [2.1, 0.13, 0.3], transportColors.signal)];
    for (const side of [-1, 1]) { const hull = shipHull(0.65, 6, 0.75); hull.position.x = side * 1.55; parts.push(hull, box("向前外展集油导流翼", [side * 1.65, 0.45, -2.8], [0.07, 0.6, 1.7], transportColors.signal, [0, side * -20, 0]), strut("转鼓轴承支架", [side * 1.4, 0.8, -0.2], [side * 1.15, 0.7, -1.2], 0.1)); }
    return parts;
  } },
  { name: "水草切割输送采收船", tags: ["水域养护", "往复切割齿", "倾斜捞草带"], create: () => {
    const parts = [box("双体跨接底架", [0, 0.9, 0.6], [3, 0.3, 4]), box("镂空储草舱底", [0, 1.1, 1.2], [2.2, 0.1, 2.7], transportColors.dark), ...[-1, 1].map(side => box("透气储草舱侧栏", [side * 1.1, 1.6, 1.2], [0.07, 1, 2.7], transportColors.trim)), box("倾斜打捞输送带", [0, 0.8, -1.6], [2.4, 0.15, 3.7], transportColors.dark, [-23, 0, 0]), ...cab([1.1, 1.05, 1.5], [0.75, 1.4, 1.1], true)];
    for (const side of [-1, 1]) { const hull = shipHull(0.6, 5.4, 0.7); hull.position.x = side * 1.5; parts.push(hull, box("前竖向侧切刀", [side * 1.2, 0.55, -3.3], [0.09, 1.2, 0.16], transportColors.signal)); }
    for (let index = 0; index < 10; index++) parts.push(part("往复式前切割三角刀齿", "cone", transportColors.trim, [(index - 4.5) * 0.25, 0.08, -3.5], [0.2, 0.35, 0.05], [-90, 0, 0]));
    for (let index = 0; index < 5; index++) parts.push(box("捞草输送带横刮板", [0, 0.25 + index * 0.27, -2.9 + index * 0.6], [2.4, 0.12, 0.07], transportColors.signal, [-23, 0, 0])); return parts;
  } },
  { name: "缆索导向横渡渡船", tags: ["河道横渡", "缆绳导向滑轮"], create: () => {
    const parts = [shipHull(3.8, 8.2, 0.85), box("平铺载车渡运甲板", [0, 0.9, 0], [3.6, 0.13, 6.8], transportColors.wood), ...[-1, 1].map(end => box("两端登岸翻板", [0, 0.8, end * 4.2], [3.3, 0.12, 1.3], transportColors.trim, [end * -12, 0, 0])), ...cab([1.35, 1.05, 0.6], [0.8, 1.5, 1.1], true), strut("渡船横向牵引缆", [-4, 1.4, -1.6], [4, 1.4, -1.6], 0.035)];
    for (const side of [-1, 1]) parts.push(box("舷边导缆滚轮座", [side * 1.8, 1.1, -1.6], [0.4, 0.5, 0.5], transportColors.dark), cylinder("竖向导缆滑轮", [side * 1.8, 1.43, -1.6], [0.45, 0.12, 0.45], transportColors.trim));
    const sheave = ring("主动牵引绞盘轮槽", transportColors.dark, 0.5, 0.09, 1.4, 0.2); sheave.position.x = 0.7; sheave.position.z = -1.6; parts.push(sheave, box("牵引缆驱动箱", [0.7, 1.1, -1.6], [0.7, 0.6, 0.7], transportColors.signal)); return parts;
  } },
];
