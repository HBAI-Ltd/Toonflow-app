import { beam, part } from "./assetModelParts";
import type { ModelPart, Triple } from "./assetModelParts";
import { cap, combineMeshes, leaf, lobe, needle } from "./natureParts";

export const creatureBodies = ["短躯地兽", "长脊地兽", "三节地兽", "双节甲兽", "长颈地兽", "背翼奇兽", "角壳奇兽", "蛇颈奇兽", "脊帆奇兽"];
export const creatureLimbs = ["双足", "四足", "六足", "八足", "四足双关节", "六足双关节", "双足前翼"];
export const creatureHeads = ["圆耳短吻", "双角长吻", "獠牙鬃颈", "三齿头冠", "分叉鹿角", "羽额长喙", "双冠颏须", "四角王冠", "宽额鳃颈", "卷角触须"];

function wing(name: string, root: Triple, side: number, raised: boolean): ModelPart {
  return combineMeshes(name, "#9aa385", Array.from({ length: 5 }, (_, feather) => leaf("独立翼羽", "#9aa385", [root[0] + side * feather * 0.13, root[1] + feather * (raised ? 0.1 : -0.035), root[2] - feather * 0.08], 0.28, 0.95 - feather * 0.08, [raised ? 35 : 80, side < 0 ? -90 : 90, side * (25 + feather * 8)])));
}

export function createNatureCreature(design: number): ModelPart[] {
  const body = Math.floor(design / 70); const limb = Math.floor(design / 10) % 7; const face = design % 10;
  const parts: ModelPart[] = [];
  const long = body === 1 || body === 2 || body === 3;
  const bodyLength = long ? 2.05 : 1.55;
  if (body === 1 || body === 2 || body === 3) {
    const segments = body === 2 ? 3 : 2;
    for (let segment = 0; segment < segments; segment++) parts.push(lobe("相连躯干节段", "#9a9d7d", [0, 0.93, (segment - (segments - 1) / 2) * 0.58], [0.94, 0.86, body === 2 ? 0.87 : 1.3]));
  } else parts.push(lobe("独立兽体", "#9c9c7d", [0, 0.97, 0], [0.96, 0.96, bodyLength]));
  if (body === 3 || body === 6) {
    parts.push(cap("覆盖背甲", "#8a967b", [0, 1.1, 0], 0.65, 0.45, 0));
    for (let plate = 0; plate < 5; plate++) parts.push(lobe("背甲独立节片", "#a7ac88", [Math.sin(plate * Math.PI / 2) * 0.25, 1.48, (plate - 2) * 0.23], [0.32, 0.14, 0.32]));
  }
  const head: Triple = [0, body === 4 ? 2.1 : body === 7 ? 1.7 : 1.25, bodyLength / 2 + 0.2];
  if (body === 4 || body === 7) {
    const path: Triple[] = body === 4 ? [[0, 1, 0.5], [0, 1.62, 0.64], head] : [[0, 0.98, 0.5], [0.25, 1.23, 0.67], [-0.18, 1.55, 0.86], head];
    for (let segment = 1; segment < path.length; segment++) parts.push(beam("相连颈椎段", "#a1a17f", path[segment - 1]!, path[segment]!, 0.19 - segment * 0.025));
  } else parts.push(beam("肩颈连接", "#a1a17f", [0, 1.05, bodyLength * 0.32], head, 0.24));
  if (body === 5) for (const side of [-1, 1]) { parts.push(beam("背翼翼骨", "#8d9271", [side * 0.25, 1.27, 0], [side * 0.95, 1.7, -0.2], 0.06), wing("背部羽翼", [side * 0.65, 1.55, -0.2], side, true)); }
  if (body === 8) for (let plate = 0; plate < 7; plate++) parts.push(needle("独立背帆棘", "#b0ac83", [0, 1.2, -0.6 + plate * 0.2], [0, 1.65 + Math.sin(plate / 6 * Math.PI) * 0.45, -0.6 + plate * 0.2], 0.24));
  const legCount = [2, 4, 6, 8, 4, 6, 2][limb]!;
  for (let leg = 0; leg < legCount; leg++) {
    const side = leg % 2 ? 1 : -1; const row = Math.floor(leg / 2); const rows = legCount / 2; const z = rows === 1 ? 0 : (row / (rows - 1) - 0.5) * bodyLength * 0.65;
    const shoulder: Triple = [side * 0.32, 0.95, z]; const ankle: Triple = [side * 0.5, 0.13, z + (row % 2 ? 0.08 : -0.06)];
    if (limb === 4 || limb === 5) { const knee: Triple = [side * 0.62, 0.52, z - 0.17]; parts.push(beam("关节上肢", "#a6a181", shoulder, knee, 0.13), beam("关节下肢", "#8c9375", knee, ankle, 0.09)); }
    else parts.push(beam("独立承重肢", "#a19e7a", shoulder, ankle, limb === 3 ? 0.08 : 0.12));
    parts.push(lobe("落地足掌", "#858e73", [ankle[0], 0.09, ankle[2] + 0.04], [0.23, 0.18, 0.34]));
  }
  if (limb === 6) for (const side of [-1, 1]) { parts.push(beam("前肢翼骨", "#8f9677", [side * 0.3, 1.05, 0.42], [side * 0.9, 1.2, 0.65], 0.06), wing("前肢膜羽翼", [side * 0.67, 1.18, 0.5], side, false)); }
  parts.push(lobe("独立头骨", "#aaa786", head, face === 8 ? [0.9, 0.44, 0.43] : [0.52, 0.5, 0.55]), lobe("口鼻部", "#b3ae8a", [head[0], head[1] - 0.07, head[2] + (face === 1 || face === 5 ? 0.37 : 0.23)], face === 1 || face === 5 ? [0.29, 0.23, 0.65] : [0.34, 0.24, 0.29]));
  for (const side of [-1, 1]) {
    parts.push(part("眼睛", "sphere", "#4e6153", [side * (face === 8 ? 0.36 : 0.18), head[1] + 0.035, head[2] + 0.19], [0.055, 0.055, 0.035]));
    parts.push(leaf("头部外耳", "#a8a782", [side * 0.17, head[1] + 0.17, head[2] - 0.05], 0.15, 0.3, [0, side * 35, side * -25]));
    if (face === 1 || face === 4 || face === 6) {
      const root: Triple = [side * 0.16, head[1] + 0.18, head[2] - 0.04]; const tip: Triple = [side * 0.3, head[1] + 0.73, head[2] - 0.12];
      parts.push(needle("成对额角", "#b8b18a", root, tip, 0.085));
      if (face === 4) for (let tine = 0; tine < 2; tine++) parts.push(needle("鹿角相连叉齿", "#b8b18a", [side * 0.22, head[1] + 0.35 + tine * 0.13, head[2] - 0.08], [side * (0.45 + tine * 0.08), head[1] + 0.5 + tine * 0.15, head[2] + 0.04], 0.045));
    }
    if (face === 2) parts.push(needle("上扬獠牙", "#d0c6a1", [side * 0.15, head[1] - 0.12, head[2] + 0.25], [side * 0.24, head[1] + 0.16, head[2] + 0.48], 0.065));
    if (face === 9) { parts.push(part("卷曲额角", "torus", "#b2ad87", [side * 0.3, head[1] + 0.16, head[2] - 0.06], [0.32, 0.36, 0.15], [0, side * 65, 0]), needle("细长触须", "#9ba17f", [side * 0.12, head[1] + 0.2, head[2] + 0.02], [side * 0.23, head[1] + 0.72, head[2] + 0.17], 0.025)); }
  }
  if (face === 2 || face === 3 || face === 7) for (let crest = 0; crest < (face === 7 ? 4 : 3); crest++) { const a = crest * Math.PI * 2 / (face === 7 ? 4 : 3); parts.push(needle(face === 2 ? "颈鬃棘" : "独立冠齿", "#b5ab83", [Math.cos(a) * 0.15, head[1] + 0.17, head[2] + Math.sin(a) * 0.13], [Math.cos(a) * 0.26, head[1] + 0.53, head[2] + Math.sin(a) * 0.24], 0.09)); }
  if (face === 5 || face === 6 || face === 8) for (let organ = 0; organ < 3; organ++) parts.push(leaf(face === 6 ? "下颏须" : face === 8 ? "颈侧鳃叶" : "羽额冠片", "#b2b393", [face === 8 ? 0.3 : (organ - 1) * 0.1, head[1] + (face === 6 ? -0.2 : 0.18), head[2] - organ * 0.075], 0.12, 0.3, [face === 6 ? 160 : 20, organ * 30, 0]));
  const tailSegments = 2 + face % 3;
  for (let segment = 0; segment < tailSegments; segment++) { const a: Triple = [Math.sin(segment * 0.8) * 0.15, 0.95 - segment * 0.1, -bodyLength / 2 - segment * 0.28]; const b: Triple = [Math.sin((segment + 1) * 0.8) * 0.15, 0.85 - segment * 0.1, -bodyLength / 2 - (segment + 1) * 0.28]; parts.push(beam("相连尾椎节", "#9b9d7e", a, b, 0.13 - segment * 0.02)); }
  return parts;
}
