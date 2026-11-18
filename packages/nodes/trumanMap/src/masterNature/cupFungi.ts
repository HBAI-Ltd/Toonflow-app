import { design, lobe, part, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart } from "./shared";

const flesh = "#c6b99d";
const bark = "#8f9080";

function jellyFunnel(): ModelPart[] {
  const body = sweptProfile("胶陀螺菌从窄柄连续张开且一侧真正裂开的胶质漏斗", "#baa992", [[0.003, 0], [0.005, 0.016], [0.012, 0.03], [0.021, 0.041], [0.023, 0.044], [0.021, 0.045], [0.019, 0.041], [0.010, 0.031], [0.003, 0.016], [0.001, 0]], Math.PI * 1.75, 28);
  body.vertices = body.vertices!.map(v => ({ x: v.x * 1.05, y: v.y + v.x * 0.12, z: v.z * 0.8 + (v.y / 0.045) ** 2 * 0.004 })); body.opacity = 0.78; body.roughness = 0.32;
  return [body, lobe("胶陀螺菌连续窄柄下的白色附着基部", flesh, [0, 0.001, 0], [0.006, 0.003, 0.005])];
}

function rabbitEar(): ModelPart[] {
  const body = sweptProfile("兔耳杯菌一侧开有贯通纵裂的高耳状深杯", flesh, [[0.004, 0], [0.008, 0.008], [0.017, 0.035], [0.021, 0.061], [0.019, 0.064], [0.017, 0.06], [0.014, 0.035], [0.005, 0.009], [0.001, 0.002]], Math.PI * 1.72, 28);
  body.vertices = body.vertices!.map(v => { const a = Math.atan2(v.z, v.x); return { x: v.x * 0.73, y: v.y * (1 + Math.cos(a + 0.25) * 0.18), z: v.z * 0.58 + v.y * 0.09 }; }); return [body];
}

function globoseCup(): ModelPart[] {
  const body = sweptProfile("球形肉盘菌厚胶质囊桶与真实环状皱侧", bark, [[0, 0], [0.019, 0.002], [0.028, 0.011], [0.032, 0.027], [0.031, 0.042], [0.027, 0.057], [0.024, 0.062], [0.021, 0.06], [0.023, 0.052], [0.026, 0.04], [0.026, 0.025], [0.021, 0.012], [0, 0.009]], Math.PI * 2, 32);
  body.vertices = body.vertices!.map(v => { const a = Math.atan2(v.z, v.x), middle = Math.sin(Math.min(1, v.y / 0.062) * Math.PI), wrinkle = 1 + Math.sin(v.y * 540 + Math.cos(a * 5) * 0.55) * 0.045 * middle; return { x: v.x * wrinkle, y: v.y, z: v.z * wrinkle }; });
  return [body, sweptProfile("球形肉盘菌顶部近乎平坦而略下凹的完整孢子盘", "#7c8174", [[0, 0.057], [0.013, 0.0575], [0.022, 0.060], [0.022, 0.057], [0.012, 0.055], [0, 0.055]], Math.PI * 2, 24)];
}

function devilCigar(): ModelPart[] {
  const parts: ModelPart[] = [tapered("魔鬼雪茄木质而短的共同基柄", bark, [[0, 0, 0], [0.001, 0.017, 0], [0, 0.03, 0]], [0.005, 0.006, 0.008])];
  const rows = [[0.005, 0.022, 0.49], [0.012, 0.039, 0.49], [0.027, 0.056, 0.4], [0.041, 0.064, 0.22], [0.046, 0.066, 0.025]];
  for (let petal = 0; petal < 6; petal++) {
    const angle = petal * Math.PI / 3, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (const [r, y, half] of rows) for (const inner of [false, true]) for (const side of [-1, 1]) { const a = angle + side * half!, radius = r! - (inner ? 0.003 : 0); vertices.push({ x: Math.cos(a) * radius, y: y! + (inner ? 0.001 : 0), z: Math.sin(a) * radius }); }
    for (let row = 1; row < rows.length; row++) { const a = (row - 1) * 4, b = row * 4; indices.push(a, b, a + 1, a + 1, b, b + 1, a + 2, a + 3, b + 2, a + 3, b + 3, b + 2, a, a + 2, b, a + 2, b + 2, b, a + 1, b + 1, a + 3, a + 3, b + 1, b + 3); }
    const end = (rows.length - 1) * 4; indices.push(0, 1, 2, 1, 3, 2, end, end + 2, end + 1, end + 1, end + 2, end + 3);
    parts.push(part("魔鬼雪茄成熟后由长筒真实纵裂并向外展开的厚木质星瓣", "mesh", petal % 2 ? "#a9a58d" : flesh, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

export const cupFungusDesigns: MasterNatureDesign[] = [
  design("guepinia", "胶陀螺菌", "植物", jellyFunnel, ["Guepinia helvelloides", "连续胶质柄盖与单侧纵裂漏斗"]),
  design("otideaOnotica", "兔耳杯菌", "植物", rabbitEar, ["Otidea onotica", "窄高深杯与一侧开口纵裂"]),
  design("sarcosoma", "球形肉盘菌", "植物", globoseCup, ["Sarcosoma globosum", "环皱胶质囊桶与顶部孢子盘"]),
  design("chorioactis", "魔鬼雪茄菌", "植物", devilCigar, ["Chorioactis geaster", "无中央孢子球的木质星裂子囊盘"]),
];
