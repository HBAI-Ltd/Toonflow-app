import { combineMeshes, design, eyes, lobe, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { membrane } from "./animals";
import { spiral } from "./marine";

const skin = "#aab79c";
const pale = "#c7cdb2";
const dark = "#7d9385";

function suctionCup(name: string, at: Triple, radius: number): ModelPart {
  const p = sweptProfile(name, pale, [[radius * 0.4, 0], [radius, radius * 0.4], [radius, radius * 0.8], [radius * 0.65, radius * 0.8], [radius * 0.6, radius * 0.3], [radius * 0.3, radius * 0.15]], Math.PI * 2, 8); p.position = { x: at[0], y: at[1], z: at[2] }; p.rotation.x = 180; return p;
}

function bigfin(): ModelPart[] {
  const parts: ModelPart[] = [tapered("大鳍乌贼长而细窄的筒状外套躯", skin, [[0, 2.91, 0], [0, 3.17, 0], [0, 3.43, 0]], [0.066, 0.074, 0.012]), lobe("大鳍乌贼外套口下的小头", pale, [0, 2.88, 0], [0.12, 0.14, 0.12]), ...eyes([0, 2.885, 0.027], 0.045, 0.041)];
  for (const side of [-1, 1]) parts.push(membrane("大鳍乌贼占外套长大部分的宽菱形鳍", pale, [[side * 0.012, 3.43, 0], [side * 0.23, 3.32, 0.018], [side * 0.32, 3.08, 0.025], [side * 0.22, 2.94, 0.008], [side * 0.048, 2.95, 0], [side * 0.065, 3.17, 0]]));
  for (let arm = 0; arm < 10; arm++) { const a = arm * Math.PI / 5, root: Triple = [Math.cos(a) * 0.036, 2.83, Math.sin(a) * 0.036], elbow: Triple = [Math.cos(a) * 0.27, 2.75 + arm % 2 * 0.025, Math.sin(a) * 0.27]; parts.push(pointed(arm < 8 ? "大鳍乌贼先横展再成直角下垂的独立腕" : "大鳍乌贼同样细长并成肘形的一对触腕", skin, [root, elbow, [elbow[0] * 1.05, 1.6, elbow[2] * 1.05], [elbow[0] + Math.sin(arm) * 0.05, 0.015 + arm % 3 * 0.04, elbow[2] + Math.cos(arm) * 0.04]], [0.012, 0.005, 0.0022, 0])); }
  return parts;
}

function blanketOctopus(): ModelPart[] {
  const parts: ModelPart[] = [lobe("毯章鱼雌体不带侧鳍的卵圆外套躯", skin, [0, 0.12, -0.092], [0.105, 0.115, 0.19]), lobe("毯章鱼与腕冠相连的小头", pale, [0, 0.117, 0.015], [0.085, 0.08, 0.082]), ...eyes([0, 0.137, 0.03], 0.032, 0.027)], blanketEnds: Triple[] = [[-0.34, 0.09, 0.64], [-0.16, 0.18, 0.87], [0.16, 0.18, 0.87], [0.34, 0.09, 0.64]], bases: Triple[] = [], middles: Triple[] = [];
  for (let arm = 0; arm < 4; arm++) { const root: Triple = [(arm - 1.5) * 0.014, 0.139, 0.042], end = blanketEnds[arm]!, middle: Triple = [end[0] * 0.72, end[1] + 0.065, end[2] * 0.55]; bases.push(root); middles.push(middle); parts.push(pointed("毯章鱼支撑背侧长毯膜的四根粗长腕", skin, [root, middle, end], [0.012, 0.009, 0])); }
  for (let web = 0; web < 3; web++) { const a = blanketEnds[web]!, b = blanketEnds[web + 1]!, ma = middles[web]!, mb = middles[web + 1]!; parts.push(membrane("毯章鱼连接四根背侧腕直到远端的真正宽大毯膜", pale, [bases[web]!, ma, a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 0.07, (a[2] + b[2]) / 2 - 0.04], b, mb, bases[web + 1]!])); }
  const suckers: ModelPart[] = [];
  for (let arm = 0; arm < 4; arm++) { const side = arm < 2 ? -1 : 1, root: Triple = [side * (0.015 + arm % 2 * 0.012), 0.096, 0.04], mid: Triple = [side * (0.14 + arm % 2 * 0.06), 0.046, 0.22 + arm % 2 * 0.06], end: Triple = [side * (0.2 + arm % 2 * 0.07), 0.024, 0.35 + arm % 2 * 0.055]; parts.push(pointed("毯章鱼其余四根没有长毯膜的自由短腕", skin, [root, mid, end, [end[0] - side * 0.025, 0.035, end[2] + 0.034]], [0.013, 0.009, 0.004, 0])); for (let cup = 1; cup <= 5; cup++) { const t = cup / 7; suckers.push(suctionCup("毯章鱼自由腕内侧真实凹入的吸盘", [root[0] + (mid[0] - root[0]) * t, root[1] + (mid[1] - root[1]) * t - 0.008, root[2] + (mid[2] - root[2]) * t], 0.004)); } }
  for (let i = 0; i < suckers.length; i += 8) parts.push(combineMeshes("毯章鱼短腕上实际具有凹腔的吸盘列", pale, suckers.slice(i, i + 8))); return parts;
}

function strawberrySquid(): ModelPart[] {
  const parts: ModelPart[] = [tapered("草莓乌贼短而钟形膨大的外套躯", skin, [[0, 0.063, -0.044], [0, 0.064, -0.008], [0, 0.064, 0.026]], [0.003, 0.025, 0.019]), lobe("草莓乌贼围绕不等眼的小头", skin, [0, 0.061, 0.043], [0.037, 0.035, 0.035]), lobe("草莓乌贼朝上观察的大型左眼", pale, [-0.017, 0.07, 0.045], [0.023, 0.026, 0.023]), lump("草莓乌贼朝下的小型右眼", [0.016, 0.058, 0.047], [0.010, 0.011, 0.011], dark), lump("草莓乌贼大型左眼上向的真实瞳孔", [-0.021, 0.079, 0.05], [0.012, 0.012, 0.010], dark)];
  for (const side of [-1, 1]) parts.push(membrane("草莓乌贼后外套部的小圆耳鳍", pale, [[side * 0.008, 0.066, -0.035], [side * 0.033, 0.071, -0.032], [side * 0.042, 0.067, -0.008], [side * 0.026, 0.059, 0.002], [side * 0.016, 0.059, -0.009]]));
  const photophores: ModelPart[] = [], cups: ModelPart[] = [];
  for (let i = 0; i < 60; i++) { const a = i * 2.4, z = -0.029 + i % 12 * 0.004, r = z < -0.008 ? 0.003 + (z + 0.044) / 0.036 * 0.022 : 0.025 - (z + 0.008) / 0.034 * 0.006; photophores.push(lump("草莓乌贼外套表面独立的珠点状发光器", [Math.cos(a) * r * 0.92, 0.064 + Math.sin(a) * r * 0.92, z], [0.0024, 0.0016, 0.0024], pale)); }
  for (let i = 0; i < photophores.length; i += 30) { const p = combineMeshes("草莓乌贼成片排列但彼此分开的发光器官", pale, photophores.slice(i, i + 30)); p.emissive = pale; p.emissiveIntensity = 0.2; parts.push(p); }
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, root: Triple = [Math.cos(a) * 0.009, 0.061 + Math.sin(a) * 0.009, 0.055], middle: Triple = [root[0] * 2.5, 0.055 + Math.sin(a) * 0.02, 0.092], end: Triple = [Math.cos(a) * 0.029, 0.045 + Math.sin(a) * 0.015, 0.132 + i % 3 * 0.007]; parts.push(pointed("草莓乌贼八根弯向前方的短粗腕", skin, [root, middle, end], [0.005, 0.0036, 0])); cups.push(suctionCup("草莓乌贼短腕上的真实凹吸盘", [root[0] * 0.35 + middle[0] * 0.65, root[1] * 0.35 + middle[1] * 0.65 - 0.0036, root[2] * 0.35 + middle[2] * 0.65], 0.0015)); }
  parts.push(combineMeshes("草莓乌贼腕内侧的完整凹吸盘", pale, cups));
  for (const side of [-1, 1]) parts.push(pointed("草莓乌贼八腕之外独立的一对长触腕", skin, [[side * 0.007, 0.057, 0.055], [side * 0.035, 0.04, 0.16], [side * 0.027, 0.022, 0.22]], [0.0025, 0.0016, 0.0012]), lobe("草莓乌贼长触腕端真实加宽的触腕穗", pale, [side * 0.027, 0.022, 0.224], [0.005, 0.005, 0.019])); return parts;
}

function ramsHorn(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("旋壳乌贼短圆筒状且前端开放的外套躯", skin, [[0.0085, 0.023], [0.0105, 0.034], [0.01, 0.052], [0.004, 0.065], [0.0025, 0.065], [0.0085, 0.051], [0.009, 0.034], [0.007, 0.024]], Math.PI * 2, 20), lobe("旋壳乌贼外套开口下方的短头", pale, [0, 0.025, 0], [0.016, 0.012, 0.015]), ...eyes([0, 0.026, 0.003], 0.0065, 0.0055)], shell = spiral("旋壳乌贼体后仍有边缘可见且各圈分开的内旋壳", 0.0065, 0.0015, 2, pale); shell.position.y = 0.058; parts.push(shell);
  for (const side of [-1, 1]) parts.push(lobe("旋壳乌贼外套后端真正成对的小圆鳍", pale, [side * 0.009, 0.058, 0], [0.012, 0.011, 0.0025])); const light = lump("旋壳乌贼后端独立朝上的发光器", [0, 0.067, 0], [0.003, 0.002, 0.003], pale); light.emissive = pale; light.emissiveIntensity = 0.25; parts.push(light);
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, root: Triple = [Math.cos(a) * 0.0045, 0.022, Math.sin(a) * 0.0045]; parts.push(pointed("旋壳乌贼头下方的八根短腕", skin, [root, [Math.cos(a) * 0.009, 0.013, Math.sin(a) * 0.009], [Math.cos(a) * 0.006, 0.006, Math.sin(a) * 0.006]], [0.0015, 0.001, 0])); }
  for (const side of [-1, 1]) parts.push(pointed("旋壳乌贼短腕之外一对下垂的长触腕", skin, [[side * 0.003, 0.022, 0], [side * 0.012, 0.008, 0.001], [side * 0.011, 0.001, 0.002]], [0.0007, 0.0006, 0]), lump("旋壳乌贼长触腕顶端的小穗", [side * 0.011, 0.002, 0.002], [0.0015, 0.0035, 0.0015], pale)); return parts;
}

export const pelagicCephalopodDesigns: MasterNatureDesign[] = [
  design("bigfinSquid", "大鳍乌贼", "动物", bigfin, ["Magnapinna", "宽鳍与十根直角肘状细长腕"]),
  design("blanketOctopus", "毯章鱼", "动物", blanketOctopus, ["Tremoctopus", "四背腕相连长毯膜与四自由短腕"]),
  design("strawberrySquid", "草莓乌贼", "动物", strawberrySquid, ["Histioteuthis heteropsis", "左大上向右小下向的不等眼与真实发光器"]),
  design("ramsHornSquid", "旋壳乌贼", "动物", ramsHorn, ["Spirula spirula", "后端开旋内壳成对圆鳍与独立发光器"]),
];
