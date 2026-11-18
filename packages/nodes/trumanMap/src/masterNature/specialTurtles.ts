import { cap, combineMeshes, design, eyes, lobe, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";
import { reptileLimb } from "./scaledReptiles";

const shell = "#a5ae96";
const skin = "#b6bda1";
const pale = "#c9ccb0";

function flyRiver(): ModelPart[] {
  const back = cap("猪鼻龟没有分块角质盾片而覆完整革皮的椭圆背甲", shell, [0, 0.051, 0], 0.178, 0.105, 0); back.scale.z = 1.26;
  const belly = lobe("猪鼻龟背甲下相连而平坦的腹甲", pale, [0, 0.046, 0], [0.294, 0.038, 0.363]), parts: ModelPart[] = [back, belly, tapered("猪鼻龟由甲前开口伸出的粗短颈", skin, [[0, 0.06, 0.16], [0, 0.067, 0.225]], [0.045, 0.034]), lobe("猪鼻龟宽颞部与短钝颌的头颅", skin, [0, 0.071, 0.254], [0.091, 0.072, 0.094]), ...eyes([0, 0.094, 0.268], 0.032, 0.012)];
  const nose = sweptProfile("猪鼻龟吻端真实有内腔的肉质猪鼻", skin, [[0.012, 0], [0.014, 0.027], [0.012, 0.035], [0.008, 0.035], [0.009, 0.026], [0.008, 0]], Math.PI * 2, 16); nose.rotation.x = 90; nose.position = { x: 0, y: 0.072, z: 0.282 }; parts.push(nose);
  const outline: [number, number][] = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.012, Math.sin(i * Math.PI / 8) * 0.012]), holes: [number, number][][] = [-1, 1].map(side => Array.from({ length: 8 }, (_, i) => [side * 0.005 + Math.cos(i * Math.PI / 4) * 0.0024, -0.003 + Math.sin(i * Math.PI / 4) * 0.0024] as [number, number]));
  const nostrils = polygon("猪鼻龟吻端由实心鼻中隔分开的两个贯通鼻孔", pale, outline, 0.0018, [0, 0.072, 0.315], holes); nostrils.rotation.x = 90; parts.push(nostrils);
  for (const side of [-1, 1]) { parts.push(polygon("猪鼻龟前肢特化的长桨状实心游泳鳍", skin, [[side * 0.09, 0.115], [side * 0.153, 0.124], [side * 0.245, 0.061], [side * 0.265, 0.019], [side * 0.216, 0.023], [side * 0.143, 0.07], [side * 0.095, 0.066]], 0.015, [0, 0.032, 0]), polygon("猪鼻龟短而宽的后鳍状肢", skin, [[side * 0.08, -0.09], [side * 0.15, -0.093], [side * 0.207, -0.163], [side * 0.19, -0.19], [side * 0.133, -0.162], [side * 0.085, -0.135]], 0.014, [0, 0.028, 0]));
    for (let claw = 0; claw < 2; claw++) parts.push(pointed("猪鼻龟前鳍上保留的两枚小爪", pale, [[side * (0.19 + claw * 0.018), 0.047, 0.078 - claw * 0.016], [side * (0.198 + claw * 0.018), 0.047, 0.09 - claw * 0.016]], [0.003, 0])); }
  parts.push(pointed("猪鼻龟甲后伸出的短尾", skin, [[0, 0.046, -0.175], [0.015, 0.035, -0.252]], [0.017, 0])); return parts;
}

function spinyHill(): ModelPart[] {
  const back = sweptProfile("刺山龟三条纵脊之间完整相连的硬质背甲", shell, [[0, 0.06], [0.031, 0.058], [0.061, 0.042], [0.075, 0.012], [0.067, 0.008], [0.03, 0.015], [0, 0.018]], Math.PI * 2, 28); back.scale.z = 1.24;
  const parts: ModelPart[] = [back, lobe("刺山龟紧接背甲下侧的平腹甲", pale, [0, 0.016, 0], [0.124, 0.017, 0.152]), tapered("刺山龟短而可伸缩的细颈", skin, [[0, 0.025, 0.07], [0, 0.031, 0.102]], [0.012, 0.010]), lobe("刺山龟短圆头与小钩嘴", skin, [0, 0.032, 0.114], [0.034, 0.027, 0.037]), ...eyes([0, 0.039, 0.12], 0.012, 0.0045)];
  for (const side of [-1, 1]) { reptileLimb(parts, [side * 0.048, 0.024, 0.047], [side * 0.075, 0.016, 0.037], [side * 0.079, 0.003, 0.059], 0.007, 5); reptileLimb(parts, [side * 0.046, 0.021, -0.052], [side * 0.074, 0.013, -0.066], [side * 0.077, 0.003, -0.046], 0.007, 4); }
  const plates: ModelPart[] = [];
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, front = Math.sin(a) > 0.6, r = front ? 0.074 : 0.076, root: Triple = [Math.cos(a) * r * 0.92, 0.013, Math.sin(a) * r * 1.24 * 0.92], end: Triple = [Math.cos(a) * (r + 0.014), 0.0135, Math.sin(a) * (r + 0.014) * 1.24]; plates.push(pointed("刺山龟幼体每枚边缘盾片真实向外伸出的扁尖齿", pale, [root, end], [0.007, 0])); }
  for (const plate of plates) plate.vertices = plate.vertices!.map(v => ({ ...v, y: 0.013 + (v.y - 0.013) * 0.22 }));
  parts.push(combineMeshes("刺山龟一整圈彼此分离的尖齿状甲缘盾片", pale, plates));
  for (const side of [-1, 0, 1]) parts.push(tapered("刺山龟背甲上实际隆起的三条纵向低脊", pale, [[side * 0.035, side ? 0.039 : 0.055, -0.063], [side * 0.035, side ? 0.049 : 0.062, 0], [side * 0.029, side ? 0.039 : 0.054, 0.059]], [0.004, 0.005, 0.003])); parts.push(pointed("刺山龟后甲下的短细尾", skin, [[0, 0.018, -0.079], [0.009, 0.009, -0.12]], [0.007, 0])); return parts;
}

export const specialTurtleDesigns: MasterNatureDesign[] = [
  design("flyRiverTurtle", "猪鼻龟", "动物", flyRiver, ["Carettochelys insculpta", "完整革皮背甲真猪鼻与双爪前鳍"]),
  design("spinyHillTurtle", "刺山龟", "动物", spinyHill, ["Heosemys spinosa", "幼体尖齿边缘盾片与三条低背脊"]),
];
