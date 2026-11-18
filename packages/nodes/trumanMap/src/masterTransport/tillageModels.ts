import { part, type ModelPart, type Triple } from "../assetModelParts";
import { axles, box, cylinder, strut, surface, transportColors, wheel, type TransportDefinition } from "./parts";

export function threePointLink(width: number, z: number): ModelPart[] {
  return [...[-1, 1].map(side => strut("三点悬挂上斜拉架", [side * width / 2, 0.55, z], [0, 1.3, z], 0.07)), strut("下悬挂横梁", [-width / 2, 0.55, z], [width / 2, 0.55, z], 0.08), cylinder("顶部悬挂销", [0, 1.3, z], [0.055, 0.2, 0.055], transportColors.trim, [0, 0, 90])];
}

function mouldboard(origin: Triple, direction: number): ModelPart {
  const points: Triple[] = [[0, 0, -0.3], [0.24, 0.14, -0.22], [0.47, 0.46, -0.1], [0, 0, 0.3], [0.24, 0.14, 0.35], [0.47, 0.46, 0.48]];
  return surface("扭曲翻土犁壁", transportColors.trim, points.map(([x, y, z]) => [origin[0] + direction * x, origin[1] + direction * y, origin[2] + z]), [0, 1, 4, 0, 4, 3, 1, 2, 5, 1, 5, 4]);
}

export const tillageModels: TransportDefinition[] = [
  { name: "液压翻转双向犁", theme: "现代", tags: ["农业", "农具", "翻转犁", "相反犁体", "回转悬挂头"], create: () => {
    const parts = [...threePointLink(0.8, -1.8), cylinder("纵向翻转主轴", [0, 1.1, -1.4], [0.2, 1, 0.2], transportColors.dark, [90, 0, 0]), strut("斜向犁架主梁", [0, 1.1, -1.3], [1.1, 1.1, 2.1], 0.13), strut("翻转液压缸", [-0.3, 0.7, -1.75], [0.3, 1.25, -1.1], 0.09), ...wheel([1.45, 0.28, 1.7], 0.28, 0.14)];
    for (let index = 0; index < 3; index++) {
      const x = index * 0.34, z = -0.6 + index * 1.05;
      for (const direction of [-1, 1]) {
        const y = direction > 0 ? 0.12 : 2.08;
        parts.push(strut("上下相反犁体承力柄", [x, 1.1, z], [x, y, z], 0.07), mouldboard([x, y, z], direction), box("犁体入土铧刃", [x + direction * 0.14, y, z - 0.32], [0.43, 0.04, 0.25], transportColors.dark, [0, direction * 16, 0]));
      }
    }
    return parts;
  } },
  { name: "偏置双列圆盘耙", theme: "现代", tags: ["农业", "农具", "圆盘耙", "对向斜置耙组", "凹面圆盘"], create: () => {
    const parts: ModelPart[] = [...axles(2, [1], 0.34), box("圆盘耙矩形承重架", [0, 0.9, 0], [2.8, 0.17, 2.8], transportColors.signal), strut("拖曳连接杆", [0, 0.8, -1.4], [0, 0.55, -2.8], 0.12)];
    for (const row of [-1, 1]) {
      parts.push(strut("斜向耙组通轴", [-1.4, 0.42, row * 0.65 - row * 0.3], [1.4, 0.42, row * 0.65 + row * 0.3], 0.08));
      for (let index = 0; index < 6; index++) {
        const x = (index - 2.5) * 0.45, z = row * 0.65 + x * row * 0.3 / 1.4;
        parts.push(part("中部内凹的切土耙盘", "lathe", transportColors.dark, [x, 0.42, z], [1, 1, 1], [0, -row * 12, 90], { profile: [{ x: 0.05, y: -0.1 }, { x: 0.2, y: -0.08 }, { x: 0.4, y: 0.035 }, { x: 0.4, y: 0.06 }, { x: 0.2, y: -0.05 }, { x: 0.05, y: -0.07 }] }));
      }
    }
    return parts;
  } },
  { name: "横轴刀片动力旋耕机", theme: "现代", tags: ["农业", "农具", "旋耕机", "横向动力刀轴", "弯折旋耕刀"], create: () => {
    const parts = [...threePointLink(1.2, -0.6), box("旋耕机上方护罩", [0, 0.95, 0], [2.7, 0.12, 1.2], transportColors.signal), cylinder("横置旋耕驱动轴", [0, 0.43, 0], [0.15, 2.5, 0.15], transportColors.dark, [0, 0, 90]), box("侧向链传动封闭箱", [-1.3, 0.7, 0], [0.2, 0.85, 0.7]), box("中央动力换向齿轮箱", [0, 1.1, -0.2], [0.5, 0.35, 0.6]), strut("前向万向动力输入轴", [0, 1.1, -0.5], [0, 1.1, -1.2], 0.08), box("后方铰接平土挡板", [0, 0.62, 0.7], [2.6, 0.7, 0.07], transportColors.body, [-15, 0, 0])];
    for (let index = 0; index < 8; index++) {
      const x = (index - 3.5) * 0.29;
      for (const direction of [-1, 1]) {
        const angle = index * Math.PI / 3 + (direction < 0 ? Math.PI : 0), y = 0.43 + Math.cos(angle) * 0.34, z = Math.sin(angle) * 0.34;
        parts.push(strut("旋耕刀径向刀柄", [x, 0.43, 0], [x, y, z], 0.045), box("旋耕刀弯折横刃", [x + direction * 0.055, y, z], [0.15, 0.055, 0.08], transportColors.trim, [angle * 180 / Math.PI, 0, 0]));
      }
    }
    return parts;
  } },
  { name: "弯腿式深松铲架", theme: "现代", tags: ["农业", "农具", "深松机", "深松铲", "非翻土长铲腿"], create: () => {
    const parts: ModelPart[] = [...threePointLink(1, -0.7), box("深松承载横梁", [0, 1.2, 0], [3.1, 0.2, 1.2], transportColors.signal)];
    for (const x of [-1.15, -0.58, 0, 0.58, 1.15]) {
      parts.push(part("前弯厚板深松铲腿", "extrude", transportColors.dark, [x, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 0.065, profile: [{ x: -0.05, y: 1.25 }, { x: 0.22, y: 1.25 }, { x: 0.17, y: 0.45 }, { x: -0.18, y: 0.09 }, { x: -0.48, y: 0.06 }, { x: -0.42, y: 0.17 }, { x: -0.05, y: 0.53 }] }), box("宽翼破土铲尖", [x, 0.08, 0.4], [0.32, 0.06, 0.42], transportColors.trim));
    }
    for (const side of [-1, 1]) parts.push(strut("深松深度限位轮叉", [side * 1.4, 1.2, 0.2], [side * 1.4, 0.35, 0.5], 0.07), ...wheel([side * 1.4, 0.34, 0.5], 0.34, 0.14));
    return parts;
  } },
  { name: "盘式割草压扁牵引机", theme: "现代", tags: ["农业", "农具", "割草压扁机", "水平旋转割盘", "成对压扁辊"], create: () => {
    const parts = [...axles(2.9, [0.7], 0.4), box("前部割草传动梁", [0, 0.3, -0.5], [3.2, 0.13, 0.5], transportColors.dark), box("上方悬空安全护罩", [0, 1, 0], [3.5, 0.12, 2], transportColors.signal), strut("偏置铰接牵引臂", [-1.3, 0.9, 0], [-2.2, 0.7, -2.8], 0.14), ...[-1, 1].map(side => box("后方收拢草条导流板", [side * 1.15, 0.7, 1], [0.08, 0.65, 1.5], transportColors.body, [0, side * 20, 0]))];
    for (const x of [-1.2, -0.6, 0, 0.6, 1.2]) parts.push(cylinder("水平旋转椭圆割盘中心", [x, 0.4, -0.6], [0.54, 0.08, 0.4], transportColors.trim), box("割盘双端短刀", [x, 0.4, -0.6], [0.74, 0.035, 0.1], transportColors.dark, [0, x * 55, 0]));
    for (const y of [0.38, 0.69]) parts.push(cylinder("割后成对压扁辊", [0, y, 0.3], [0.28, 2.8, 0.28], transportColors.dark, [0, 0, 90]));
    return parts;
  } },
  { name: "侧叉自装圆草捆集运拖车", theme: "现代", tags: ["农业", "农具", "草捆拖车", "侧叉拾取", "纵向推捆器", "双槽承载"], create: () => {
    const parts = [...axles(2.2, [1.3, 2.3], 0.43), ...[-1, 1].map(side => box("承捆纵向托槽底", [side * 0.55, 0.95, 0], [0.9, 0.15, 6.5], transportColors.dark)), box("主梁中部承载脊", [0, 0.8, 0], [0.25, 0.3, 6.8]), strut("前端牵引舌", [0, 0.8, -3.2], [0, 0.6, -4.7], 0.16), box("前方纵向推捆器", [0, 1.55, -2.7], [2, 1.2, 0.18], transportColors.signal), strut("推捆器纵向作动缸", [0, 0.95, -3], [0, 0.95, -0.7], 0.08), cylinder("侧装拾捆转臂横轴", [1.35, 1.05, -1.9], [0.18, 1.1, 0.18], transportColors.dark, [90, 0, 0])];
    for (const z of [-2.4, -1.4]) parts.push(strut("转臂侧向抬捆弯杆", [1.35, 1.05, z], [2.7, 0.45, z], 0.07), strut("侧叉向前伸出的捆底托杆", [2.7, 0.45, z], [2.7, 0.45, z + 0.7], 0.06));
    for (const side of [-1, 1]) {
      parts.push(box("托槽外侧长防滚栏", [side * 1.05, 1.3, 0], [0.055, 0.055, 6.3], transportColors.body));
      for (const z of [-2.8, 0, 2.8]) parts.push(strut("槽边防滚栏立柱", [side * 1.05, 0.9, z], [side * 1.05, 1.3, z], 0.055));
    }
    parts.push(strut("侧叉液压举升缸", [0.8, 0.85, -1.9], [2.2, 0.7, -1.9], 0.1));
    return parts;
  } },
];
