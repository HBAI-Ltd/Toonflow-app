import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, leaf, lobe, needle, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { pointed } from "./insectForms";

const rind = "#b9b99b";
const flesh = "#c8c5a7";
const green = "#96a17c";

function blueberry(): ModelPart[] {
  const skin = sweptProfile("蓝莓果实顶端有真实凹窝的完整果皮体", "#9eaaa0", [[0, 0], [0.005, 0.0005], [0.0085, 0.004], [0.009, 0.009], [0.0075, 0.0145], [0.0037, 0.016], [0.002, 0.0145], [0, 0.014]], Math.PI * 2, 20); skin.roughness = 0.5;
  const calyx: ModelPart[] = []; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; calyx.push(leaf("蓝莓凹窝口缘真正向外分开的五枚宿存萼齿", "#8f9a8b", [Math.cos(a) * 0.0028, 0.015, Math.sin(a) * 0.0028], 0.0015, 0.0035, [65, 90 - i * 72, 0])); }
  return [skin, combineMeshes("一枚蓝莓可辨的五角萼冠", "#8f9a8b", calyx), lobe("蓝莓果柄脱落处的小型果蒂痕", green, [0, 0.0007, 0], [0.0022, 0.0012, 0.0022])];
}

function mulberry(): ModelPart[] {
  const parts: ModelPart[] = [tapered("桑葚独立长柱状果序中间的实心果轴", flesh, [[0, 0.004, -0.017], [0, 0.007, 0], [0, 0.006, 0.017]], [0.002, 0.0045, 0.0015])], drupelets: ModelPart[] = [], tips: ModelPart[] = [];
  for (let i = 0; i < 48; i++) { const a = i * 2.4, z = -0.015 + Math.floor(i / 6) * 0.0041, t = (z + 0.015) / 0.0287, r = 0.003 + Math.sin(t * Math.PI) * 0.002, p: Triple = [Math.cos(a) * r, 0.008 + Math.sin(a) * r, z]; drupelets.push(lobe("桑葚聚花果上完整独立的肥厚小果", "#a8a38e", p, [0.005, 0.005, 0.005])); const stigma: Triple = [p[0] * 1.2, 0.008 + (p[1] - 0.008) * 1.2, p[2]]; tips.push(needle("桑葚每个小果表面宿存的短细花柱", rind, p, stigma, 0.00035)); }
  for (let i = 0; i < drupelets.length; i += 24) parts.push(combineMeshes("桑葚相连而非覆盆子空心杯的长柱聚花果", "#a8a38e", drupelets.slice(i, i + 24))); parts.push(combineMeshes("桑葚所有小果实际长出的细花柱", rind, tips)); return parts;
}

function waxApple(): ModelPart[] {
  const body = sweptProfile("莲雾狭蒂宽底且底部真实凹陷的蜡质钟状果", "#bcae9f", [[0, 0.008], [0.008, 0.008], [0.019, 0], [0.026, 0.013], [0.024, 0.026], [0.017, 0.039], [0.006, 0.05], [0, 0.05]], Math.PI * 2, 24); body.roughness = 0.29;
  const calyx: ModelPart[] = []; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; calyx.push(leaf("莲雾宽阔花端包着凹陷的四枚肉质萼片", "#bcae9f", [Math.cos(a) * 0.017, 0.0015, Math.sin(a) * 0.017], 0.009, 0.013, [77, 90 - i * 90, 0])); }
  return [body, combineMeshes("莲雾并非苹果式圆球的四萼宽底", "#bcae9f", calyx), tapered("莲雾窄端与果枝连接的真实短柄", green, [[0, 0.049, 0], [0.001, 0.057, 0]], [0.0015, 0.001])];
}

function redBayberry(): ModelPart[] {
  const parts: ModelPart[] = [lobe("杨梅外果皮突起下面实心的近球形单核果", "#b0a48f", [0, 0.012, 0], [0.025, 0.025, 0.025])], papillae: ModelPart[] = [];
  for (let i = 0; i < 72; i++) { const a = i * 2.4, y = -0.92 + i / 71 * 1.84, radial = Math.sqrt(1 - y * y), unit = new Vector3(Math.cos(a) * radial, y, Math.sin(a) * radial), root: Triple = [unit.x * 0.009, 0.012 + unit.y * 0.009, unit.z * 0.009], tip: Triple = [unit.x * 0.013, 0.012 + unit.y * 0.013, unit.z * 0.013]; papillae.push(pointed("杨梅果皮真正连着果面的短肉质柱状突起", "#b0a48f", [root, tip], [0.001, 0]), lobe("杨梅每枚肉质突起钝圆而非木刺的顶端", "#b0a48f", tip, [0.0015, 0.0015, 0.0015])); }
  for (let i = 0; i < papillae.length; i += 36) parts.push(combineMeshes("杨梅整片真实相连的细密肉柱果皮", "#b0a48f", papillae.slice(i, i + 36))); return parts;
}

function doubleCoconut(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const side of [-1, 1]) parts.push(lobe("海椰子巨型种子彼此相连的一侧肾状种瓣", "#a5a18a", [side * 0.083, 0.17, 0], [0.25, 0.36, 0.2], [0, 0, side * -8]));
  parts.push(tapered("海椰子两瓣之间保留深沟的窄实心连接", "#a5a18a", [[0, 0.09, 0], [0, 0.26, 0]], [0.04, 0.028])); return parts;
}

function pandanusFruit(): ModelPart[] {
  const center: Triple = [0, 0.145, 0], parts: ModelPart[] = [lobe("露兜聚合果中间连续的纤维花托", rind, center, [0.12, 0.13, 0.12])], stigmas: ModelPart[] = [];
  for (let key = 0; key < 40; key++) { const a = key * 2.4, y = -0.93 + key / 39 * 1.86, r = Math.sqrt(1 - y * y), axis = new Vector3(Math.cos(a) * r, y, Math.sin(a) * r), root = new Vector3(...center).addScaledVector(axis, 0.027), q = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), axis), e = new Euler().setFromQuaternion(q), p = tapered("露兜果可辨楔形分果的窄内端与宽多角外端", "#bbb18f", [[0, 0, 0], [0, 0.07, 0], [0, 0.106, 0]], [0.012, 0.029, 0.036]); p.position = { x: root.x, y: root.y, z: root.z }; p.rotation = { x: e.x * 180 / Math.PI, y: e.y * 180 / Math.PI, z: e.z * 180 / Math.PI }; parts.push(p);
    for (let i = 0; i < 3; i++) { const b = i * Math.PI * 2 / 3, tip = new Vector3(Math.cos(b) * 0.012, 0.106, Math.sin(b) * 0.012).applyQuaternion(q).add(root); stigmas.push(lobe("每个露兜楔形分果外端留下的独立柱头痕", "#9f9f82", [tip.x, tip.y, tip.z], [0.006, 0.003, 0.006], [e.x * 180 / Math.PI, e.y * 180 / Math.PI, e.z * 180 / Math.PI])); }
  }
  for (let i = 0; i < stigmas.length; i += 30) parts.push(combineMeshes("露兜果一整组多角分果外端的柱头痕", "#9f9f82", stigmas.slice(i, i + 30))); return parts;
}

function fingerLime(): ModelPart[] {
  const body = sweptProfile("指橙细长渐尖果体中保留厚度的开窗果皮", green, [[0, 0], [0.006, 0.004], [0.0105, 0.018], [0.0105, 0.061], [0.004, 0.077], [0, 0.08], [0, 0.075], [0.0028, 0.072], [0.0086, 0.06], [0.0086, 0.019], [0.004, 0.007], [0, 0.005]], Math.PI * 1.55, 22); body.rotation.x = 90; body.position.y = 0.013; const parts: ModelPart[] = [body], vesicles: ModelPart[] = [];
  for (let i = 0; i < 126; i++) { const a = i * 2.4, z = 0.014 + Math.floor(i / 7) * 0.0027, r = Math.sqrt(i % 7 / 7) * 0.0067, p: Triple = [Math.cos(a) * r, 0.013 + Math.sin(a) * r, z]; const berry = lobe("指橙果肉真正互相分离的圆形汁囊", flesh, p, [0.003, 0.003, 0.003]); berry.opacity = 0.83; berry.roughness = 0.28; vesicles.push(berry); }
  for (let i = 0; i < vesicles.length; i += 30) { const p = combineMeshes("指橙开窗内可见的独立鱼子状汁囊群", flesh, vesicles.slice(i, i + 30)); p.opacity = 0.83; p.roughness = 0.28; parts.push(p); }
  return parts;
}

export const fruitOrganDesigns: MasterNatureDesign[] = [
  design("blueberry", "蓝莓", "食品", blueberry, ["Vaccinium corymbosum", "独立果实与五角宿存萼冠"]),
  design("mulberry", "桑葚", "食品", mulberry, ["Morus alba", "有实心轴的长柱聚花果"]),
  design("waxApple", "莲雾", "食品", waxApple, ["Syzygium samarangense", "四萼凹底的蜡质钟状果"]),
  design("redBayberry", "杨梅", "食品", redBayberry, ["Morella rubra", "果皮真实钝圆肉质柱状突起"]),
  design("cocoDeMerSeed", "海椰子种子", "植物", doubleCoconut, ["Lodoicea maldivica", "独立双裂巨型种实"]),
  design("pandanusFruit", "露兜果", "植物", pandanusFruit, ["Pandanus tectorius", "紧合楔状分果与多角柱头端"]),
  design("fingerLime", "指橙", "食品", fingerLime, ["Citrus australasica", "细长果皮中独立的球形汁囊"]),
];
