import { Euler, Quaternion, Vector3 } from "three";
import { combineMeshes, design, lobe, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { lump, pointed } from "./insectForms";
import { convexValve } from "./bivalveArchitectures";

const skin = "#a6b198";
const plate = "#c2c8ab";
const pale = "#d0d0b7";

function crownOfThorns(): ModelPart[] {
  const parts: ModelPart[] = [lobe("棘冠海星宽大而低扁的连续中央盘", skin, [0, 0.025, 0], [0.19, 0.043, 0.19])], spines: ModelPart[] = [];
  for (let arm = 0; arm < 16; arm++) { const a = arm * Math.PI / 8, end: Triple = [Math.cos(a) * 0.229, 0.009, Math.sin(a) * 0.229]; parts.push(pointed("棘冠海星从宽中央盘连续分出的粗短放射腕", skin, [[Math.cos(a) * 0.067, 0.023, Math.sin(a) * 0.067], [Math.cos(a) * 0.155, 0.019, Math.sin(a) * 0.155], end], [0.025, 0.019, 0]));
    for (let row = 0; row < 5; row++) for (const flank of [-1, 1]) { const r = 0.086 + row * 0.026, offset = flank * (0.012 - row * 0.0017), x = Math.cos(a) * r - Math.sin(a) * offset, z = Math.sin(a) * r + Math.cos(a) * offset, y = 0.038 - row * 0.004; spines.push(pointed("棘冠海星每腕背侧长而尖锐的真实活动圆锥棘", plate, [[x, y - 0.006, z], [x - Math.sin(a) * flank * 0.01, y + 0.028 - row * 0.002, z + Math.cos(a) * flank * 0.01]], [0.0028, 0])); }
  }
  for (let i = 0; i < 36; i++) { const a = i * 2.4, r = Math.sqrt(i / 36) * 0.068; spines.push(pointed("棘冠海星中央盘背面的密生长棘", plate, [[Math.cos(a) * r, 0.035, Math.sin(a) * r], [Math.cos(a) * r * 1.12, 0.069, Math.sin(a) * r * 1.12]], [0.0025, 0])); }
  for (let i = 0; i < spines.length; i += 25) parts.push(combineMeshes("棘冠海星密集而各自独立的背面圆锥棘", plate, spines.slice(i, i + 25))); return parts;
}

function shingleUrchin(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("盔甲海胆低矮而具有坚实宽底的半球形体壳", skin, [[0, 0.026], [0.02, 0.025], [0.033, 0.016], [0.037, 0.005], [0.034, 0.002], [0, 0.002]], Math.PI * 2, 24)], shingles: ModelPart[] = [];
  for (let i = 0; i < 82; i++) { const a = i * 2.4, t = Math.sqrt((i + 0.3) / 82), r = t * 0.035, y = r <= 0.02 ? 0.026 - r * 0.05 : r <= 0.033 ? 0.025 - (r - 0.02) / 0.013 * 0.009 : 0.016 - (r - 0.033) / 0.004 * 0.011, p = polygon("盔甲海胆压扁为镶嵌瓦片而非细针的六角短棘", plate, Array.from({ length: 6 }, (_, j) => [Math.cos(j * Math.PI / 3) * 0.0038, Math.sin(j * Math.PI / 3) * 0.0038]), 0.003, [Math.cos(a) * r, y - 0.0015, Math.sin(a) * r]), direction = new Vector3(Math.cos(a) * t * 0.75, 1, Math.sin(a) * t * 0.75).normalize(), rotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction)); p.rotation = { x: rotation.x * 180 / Math.PI, y: rotation.y * 180 / Math.PI, z: rotation.z * 180 / Math.PI }; shingles.push(p); }
  for (let i = 0; i < shingles.length; i += 20) parts.push(combineMeshes("盔甲海胆彼此贴近的真实厚瓦片棘镶嵌层", plate, shingles.slice(i, i + 20)));
  const fringe: ModelPart[] = [];
  for (let i = 0; i < 30; i++) { const a = i * Math.PI / 15, r = 0.035, p = polygon("盔甲海胆绕底缘伸出的扁平匙形护棘", plate, [[-0.002, 0], [-0.0033, 0.006], [-0.0027, 0.012], [0.0027, 0.012], [0.0033, 0.006], [0.002, 0]], 0.0018, [Math.cos(a) * r, 0.004, Math.sin(a) * r]); p.rotation.y = 90 - a * 180 / Math.PI; fringe.push(p); }
  parts.push(combineMeshes("盔甲海胆一整圈抵抗浪流的宽扁缘棘", plate, fringe)); return parts;
}

function notchedDollar(): ModelPart[] {
  const outline: [number, number][] = [];
  for (let ray = 0; ray < 5; ray++) { const a = ray * Math.PI * 2 / 5; for (const [delta, r] of [[-0.44, 0.052], [-0.12, 0.052], [-0.055, 0.047], [-0.04, 0.035], [0.04, 0.035], [0.055, 0.047], [0.12, 0.052], [0.44, 0.052]]) outline.push([Math.cos(a + delta!) * r!, Math.sin(a + delta!) * r!]); }
  const hole: [number, number][] = Array.from({ length: 16 }, (_, i) => [Math.cos(i * Math.PI / 8) * 0.0034, -0.026 + Math.sin(i * Math.PI / 8) * 0.006]), body = polygon("缺刻钥孔沙钱五个边缘真缺口与一个后方贯通孔的扁体壳", skin, outline, 0.005, [0, 0.002, 0], [hole]), parts: ModelPart[] = [body], petaloids: ModelPart[] = [];
  for (let petal = 0; petal < 5; petal++) { const a = petal * Math.PI * 2 / 5 + Math.PI / 5; for (const side of [-1, 1]) { const path: Triple[] = [0.005, 0.015, 0.026, 0.034].map((r, i) => { const offset = side * Math.sin(i / 3 * Math.PI) * 0.0037; return [Math.cos(a) * r - Math.sin(a) * offset, 0.007, Math.sin(a) * r + Math.cos(a) * offset]; }); petaloids.push(tapered("钥孔沙钱背面真实隆起的五瓣步带边缘", pale, path, [0.0005, 0.0006, 0.0006, 0.00045])); } }
  parts.push(combineMeshes("钥孔沙钱上完整的五瓣步带结构", pale, petaloids)); return parts;
}

function cushionStar(): ModelPart[] {
  const outline: [number, number][] = Array.from({ length: 30 }, (_, i) => { const a = i * Math.PI / 15, radius = 0.122 * (1 + Math.cos(a * 5) * 0.075); return [Math.cos(a) * radius, Math.sin(a) * radius]; }), body = convexValve("面包海星五角但没有游离长腕的厚枕状身体", outline, 0.063, 0.02), n = outline.length;
  body.vertices = body.vertices!.map((v, i) => ({ ...v, y: i === 1 || i >= 2 + n * 2 ? 0.004 : v.y + 0.017 })); body.color = skin;
  const parts: ModelPart[] = [body], papulae: ModelPart[] = [];
  for (let i = 0; i < 92; i++) {
    const a = i * 2.4, r = Math.sqrt(i / 92) * 0.11, x = Math.cos(a) * r, z = Math.sin(a) * r; let y = 0.004;
    for (let face = 0; face < body.indices!.length; face += 3) {
      const p = body.vertices![body.indices![face]!]!, q = body.vertices![body.indices![face + 1]!]!, s = body.vertices![body.indices![face + 2]!]!, denominator = (q.z - s.z) * (p.x - s.x) + (s.x - q.x) * (p.z - s.z); if (Math.abs(denominator) < 1e-12) continue;
      const u = ((q.z - s.z) * (x - s.x) + (s.x - q.x) * (z - s.z)) / denominator, v = ((s.z - p.z) * (x - s.x) + (p.x - s.x) * (z - s.z)) / denominator;
      if (u >= -1e-8 && v >= -1e-8 && u + v <= 1 + 1e-8) y = Math.max(y, u * p.y + v * q.y + (1 - u - v) * s.y);
    }
    papulae.push(lump("面包海星贴合真实枕面且各自独立的短钝疣突", [x, y - 0.0013, z], [0.005, 0.005, 0.005], plate));
  }
  for (let i = 0; i < papulae.length; i += 35) parts.push(combineMeshes("面包海星厚枕体上实际存在的分散皮突", plate, papulae.slice(i, i + 35))); return parts;
}

function purseSponge(): ModelPart[] {
  const parts: ModelPart[] = [sweptProfile("毛缘壶海绵由短柄支起并具有连续中央腔的细长壶体", skin, [[0.002, 0], [0.003, 0.009], [0.009, 0.025], [0.0085, 0.045], [0.006, 0.058], [0.004, 0.058], [0.006, 0.044], [0.0065, 0.026], [0.0015, 0.01]], Math.PI * 2, 24)], spicules: ModelPart[] = [];
  for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12; spicules.push(pointed("壶海绵出水孔周围直立而不堵塞孔口的独立骨针束", pale, [[Math.cos(a) * 0.005, 0.056, Math.sin(a) * 0.005], [Math.cos(a) * 0.006, 0.065 + i % 3 * 0.001, Math.sin(a) * 0.006]], [0.00025, 0])); }
  parts.push(combineMeshes("壶海绵出水孔周围完整而真实的骨针毛缘", pale, spicules)); const rays: ModelPart[] = [];
  for (let i = 0; i < 54; i++) { const a = i * 2.4, y = 0.017 + i % 12 * 0.003, r = y < 0.025 ? 0.003 + (y - 0.009) / 0.016 * 0.006 : 0.009 - (y - 0.025) / 0.033 * 0.003; rays.push(pointed("壶海绵体壁外露的短骨针束", pale, [[Math.cos(a) * r * 0.92, y, Math.sin(a) * r * 0.92], [Math.cos(a) * (r + 0.002), y + 0.001, Math.sin(a) * (r + 0.002)]], [0.0002, 0])); }
  for (let i = 0; i < rays.length; i += 25) parts.push(combineMeshes("壶海绵粗糙体壁上真正分离的骨针束", pale, rays.slice(i, i + 25))); return parts;
}

function glassRope(): ModelPart[] {
  const parts: ModelPart[] = [], ropes: ModelPart[] = [];
  for (let strand = 0; strand < 14; strand++) { const path: Triple[] = Array.from({ length: 14 }, (_, i) => { const a = strand * Math.PI / 7 + i * 0.65, r = 0.004 + (1 - i / 13) ** 3 * 0.012; return [Math.cos(a) * r, i * 0.0165, Math.sin(a) * r]; }); ropes.push(tapered("玻璃绳海绵长基根中真实螺旋缠绕的硅质骨针束", pale, path, path.map((_, i) => 0.00065 + i / 13 * 0.0001))); }
  for (let i = 0; i < ropes.length; i += 4) { const p = combineMeshes("玻璃绳海绵互相接触而非悬空的长骨针绳束", pale, ropes.slice(i, i + 4)); p.opacity = 0.65; p.roughness = 0.3; parts.push(p); }
  parts.push(sweptProfile("玻璃绳海绵长基根顶端有真实中央出水腔的宽杯体", skin, [[0.006, 0.207], [0.017, 0.222], [0.032, 0.249], [0.035, 0.273], [0.032, 0.291], [0.025, 0.298], [0.022, 0.297], [0.028, 0.289], [0.03, 0.271], [0.027, 0.25], [0.013, 0.226], [0.004, 0.214]], Math.PI * 2, 28)); return parts;
}

export const armoredSeaLifeDesigns: MasterNatureDesign[] = [
  design("crownOfThornsStarfish", "棘冠海星", "动物", crownOfThorns, ["Acanthaster", "宽中央盘多短腕与密生长圆锥棘"]),
  design("shingleUrchin", "盔甲海胆", "动物", shingleUrchin, ["Colobocentrotus atratus", "低盔体真实瓦片棘与匙形缘棘"]),
  design("notchedDollar", "缺刻钥孔沙钱", "动物", notchedDollar, ["Encope emarginata", "五个边缘缺口与后方贯通孔"]),
  design("cushionStar", "面包海星", "动物", cushionStar, ["Culcita novaeguineae", "没有游离长腕的五角厚枕身体"]),
  design("purseSponge", "毛缘壶海绵", "动物", purseSponge, ["Sycon ciliatum", "中央贯腔壶体和真正孔缘骨针束"]),
  design("glassRopeSponge", "玻璃绳海绵", "动物", glassRope, ["Hyalonema", "缠绕长骨针根绳与杯状出水腔"]),
];
