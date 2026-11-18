import { combineMeshes, design, eyes, lobe, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const skin = "#a6ae95";
const pale = "#c4c8a9";
const keel = "#8e9c85";

function westernGaboon(): ModelPart[] {
  const path: Triple[] = Array.from({ length: 30 }, (_, i) => { const t = i / 29, a = -0.2 + t * Math.PI * 2.2, r = 0.18 - t * 0.04; return [Math.cos(a) * r, 0.049 + Math.sin(t * Math.PI) * 0.013, Math.sin(a) * r]; }), radius = path.map((_, i) => i > 24 ? 0.045 * (30 - i) / 6 : 0.046);
  const parts: ModelPart[] = [tapered("西非加蓬蝰远粗于颈部而环绕盘起的重型蛇躯", skin, path, radius), tapered("西非加蓬蝰从粗躯骤然收细的短颈", skin, [path[0]!, [0.21, 0.055, 0.019], [0.19, 0.062, 0.11]], [0.043, 0.025, 0.021]), polygon("西非加蓬蝰宽大叶形颞部和急收的尖三角吻头", pale, [[0.163, 0.082], [0.133, 0.129], [0.144, 0.171], [0.19, 0.213], [0.236, 0.171], [0.247, 0.129], [0.217, 0.082]], 0.035, [0, 0.05, 0]), ...eyes([0.19, 0.082, 0.167], 0.032, 0.009)];
  for (const side of [-1, 1]) parts.push(pointed("西非加蓬蝰吻端实际成对举起的角质鼻鳞", keel, [[0.19 + side * 0.012, 0.081, 0.19], [0.19 + side * 0.013, 0.108, 0.2]], [0.008, 0]));
  const scales: ModelPart[] = [];
  for (let row = 2; row < 25; row++) { const p = path[row]!, previous = path[row - 1]!, next = path[row + 1]!, dx = next[0] - previous[0], dz = next[2] - previous[2], length = Math.hypot(dx, dz), nx = -dz / length, nz = dx / length;
    for (const flank of [-1, 0, 1]) { const spread = flank * radius[row]! * 0.65, y = p[1] + radius[row]! * (flank ? 0.65 : 0.88); scales.push(pointed("西非加蓬蝰体表每枚向后隆起的强棱鳞", pale, [[p[0] + nx * spread, y, p[2] + nz * spread], [p[0] + nx * spread + dx / length * 0.018, y + 0.003, p[2] + nz * spread + dz / length * 0.018]], [0.004, 0])); }
  }
  for (let i = 0; i < scales.length; i += 25) parts.push(combineMeshes("西非加蓬蝰背面真实凸起的粗棱鳞列", pale, scales.slice(i, i + 25))); return parts;
}

function yellowBellySeaSnake(): ModelPart[] {
  const path: Triple[] = [[0, 0.034, 0.29], [-0.018, 0.031, 0.19], [-0.058, 0.028, 0.08], [-0.048, 0.027, -0.04], [0.022, 0.028, -0.14], [0.075, 0.03, -0.23]], trunk = tapered("长吻海蛇具有侧扁截面和窄腹缘的水动力躯", skin, path, [0.008, 0.012, 0.015, 0.016, 0.014, 0.01]);
  trunk.vertices = trunk.vertices!.map(v => ({ ...v, y: 0.029 + (v.y - 0.029) * 1.25 }));
  const parts: ModelPart[] = [trunk, lobe("长吻海蛇狭长而从上方压平的短头", skin, [0, 0.034, 0.307], [0.023, 0.017, 0.042]), ...eyes([0, 0.039, 0.315], 0.0085, 0.004)];
  parts.push(polygon("长吻海蛇后部真实竖立且上下对称展开的扁桨尾", pale, [[0, 0], [0.025, 0.018], [0.067, 0.021], [0.11, 0.008], [0.12, -0.006], [0.089, -0.024], [0.043, -0.024], [0.012, -0.013]], 0.004)); const tail = parts.at(-1)!; tail.rotation = { x: 90, y: 0, z: -60 }; tail.position = { x: 0.075, y: 0.03, z: -0.225 }; return parts;
}

function tentacledSnake(): ModelPart[] {
  const trunk = tapered("触须蛇在水下作J形伏击的强烈压扁躯", skin, [[0, 0.03, 0.21], [-0.07, 0.027, 0.19], [-0.12, 0.024, 0.11], [-0.116, 0.023, -0.02], [-0.08, 0.025, -0.13], [-0.035, 0.026, -0.2]], [0.014, 0.015, 0.016, 0.015, 0.012, 0.001]); trunk.vertices = trunk.vertices!.map(v => ({ ...v, y: 0.026 + (v.y - 0.026) * 0.55 }));
  const parts: ModelPart[] = [trunk, polygon("触须蛇扁宽且前端截平的铲形小头", pale, [[-0.016, 0.195], [-0.024, 0.217], [-0.014, 0.241], [0.014, 0.241], [0.024, 0.217], [0.016, 0.195]], 0.012, [0, 0.024, 0]), ...eyes([0, 0.036, 0.221], 0.017, 0.0045)];
  for (const side of [-1, 1]) parts.push(pointed("触须蛇吻端具有机械感受功能的独立鳞质触须", pale, [[side * 0.008, 0.036, 0.233], [side * 0.013, 0.044, 0.249], [side * 0.014, 0.047, 0.26]], [0.0023, 0.0016, 0])); return parts;
}

function leafNoseSnake(): ModelPart[] {
  const path: Triple[] = [[0, 0.041, 0.215], [0.007, 0.04, 0.10], [0.063, 0.034, -0.02], [0.08, 0.029, -0.15], [0.042, 0.023, -0.25], [-0.01, 0.023, -0.3], [-0.046, 0.028, -0.263], [-0.035, 0.032, -0.217]], parts: ModelPart[] = [tapered("马岛叶鼻蛇细长可缠枝而尾端弯钩的树栖躯", skin, path, [0.009, 0.011, 0.012, 0.012, 0.008, 0.006, 0.004, 0.001]), polygon("马岛叶鼻蛇小眼与狭长尖吻的头颅", pale, [[-0.009, 0.203], [-0.014, 0.228], [-0.007, 0.263], [0, 0.272], [0.007, 0.263], [0.014, 0.228], [0.009, 0.203]], 0.017, [0, 0.033, 0]), ...eyes([0, 0.047, 0.241], 0.0105, 0.005)];
  const appendage = polygon("马岛叶鼻蛇雌体真实扁平并带锯裂边缘的鼻部延伸", pale, [[0, 0], [-0.007, 0.008], [-0.004, 0.013], [-0.009, 0.02], [-0.005, 0.026], [-0.007, 0.034], [0, 0.045], [0.005, 0.035], [0.003, 0.028], [0.007, 0.023], [0.004, 0.015], [0.006, 0.007]], 0.0018, [0, 0.044, 0.263]); parts.push(appendage); return parts;
}

export const specialSnakeDesigns: MasterNatureDesign[] = [
  design("westernGaboon", "西非加蓬蝰", "动物", westernGaboon, ["Bitis rhinoceros", "宽叶形颞颅急细颈粗躯与真棱鳞"]),
  design("yellowBellySeaSnake", "长吻海蛇", "动物", yellowBellySeaSnake, ["Hydrophis platurus", "侧扁水动力躯和真实竖立扁桨尾"]),
  design("tentacledSnake", "触须蛇", "动物", tentacledSnake, ["Erpeton tentaculatum", "强烈压扁J形躯与独立鳞质吻触须"]),
  design("leafNoseSnake", "马岛叶鼻蛇", "动物", leafNoseSnake, ["Langaha madagascariensis", "雌体锯裂扁叶鼻突与树栖钩尾"]),
];
