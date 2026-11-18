import { combineMeshes, design, leaf, lobe, needle, part, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { branchPoint } from "./woodyExpansionBatchOne";
import { palmFrond } from "./woodyExpansionBatchTwo";
import { flatNeedle } from "./woodyExpansionBatchTen";

const bark = "#a3997e";
const green = "#879e77";
const pale = "#b7c5a4";
const fruitColor = "#b7a88b";

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function pleatedFan(name: string, root: Triple, angle: number, radius: number, sweep: number, sectors: number, cleft: number, tilt: number, droop: number, underside?: string): ModelPart[] {
  const nodes = sectors * 2 + 1, count = 1 + nodes * 2, vertices: { x: number; y: number; z: number }[] = [], front: number[] = [], back: number[] = [], walls: number[] = [], f: Triple = [Math.cos(angle) * Math.cos(tilt), Math.sin(tilt), Math.sin(angle) * Math.cos(tilt)], right: Triple = [-Math.sin(angle), 0, Math.cos(angle)], normal: Triple = [-Math.cos(angle) * Math.sin(tilt), Math.cos(tilt), -Math.sin(angle) * Math.sin(tilt)];
  for (let shell = 0; shell < 2; shell++) {
    const thickness = shell ? -.001 : .001; vertices.push({ x: normal[0] * thickness, y: normal[1] * thickness, z: normal[2] * thickness });
    for (let row = 0; row < 2; row++) for (let index = 0; index < nodes; index++) { const a = (index / (nodes - 1) - .5) * sweep, r = radius * (row === 0 ? .38 : index % 2 ? cleft : 1), fold = r * .035 * (index % 2 ? -1 : 1) + thickness; vertices.push({ x: f[0] * Math.cos(a) * r + right[0] * Math.sin(a) * r + normal[0] * fold, y: f[1] * Math.cos(a) * r + normal[1] * fold - droop * Math.max(0, r / radius - .4) ** 2, z: f[2] * Math.cos(a) * r + right[2] * Math.sin(a) * r + normal[2] * fold }); }
  }
  for (let index = 0; index < nodes - 1; index++) { const a = 1 + index, b = a + 1, c = a + nodes, d = b + nodes; front.push(0, b, a, a, b, d, a, d, c); }
  for (let index = 0; index < front.length; index += 3) back.push(front[index]! + count, front[index + 2]! + count, front[index + 1]! + count);
  const edge = (a: number, b: number) => walls.push(a, b, b + count, a, b + count, a + count);
  for (let index = 0; index < nodes - 1; index++) edge(1 + nodes + index, 2 + nodes + index);
  edge(0, 1); edge(1, 1 + nodes); edge(nodes * 2, nodes); edge(nodes, 0);
  const base = part(`${name}具有真实折脊和连通叶肉的完整掌状叶`, "mesh", green, root, [1, 1, 1], [0, 0, 0], { vertices, indices: [...front, ...back, ...walls] });
  return underside ? [{ ...base, name: `${name}真实绿色折扇叶面与叶缘`, indices: [...front, ...walls] }, { ...base, name: `${name}共用轮廓的实际异色叶背`, color: underside, indices: back }] : [base];
}

function pleatedBlade(name: string, root: Triple, end: Triple, width: number, bifid = false): ModelPart {
  const columns = 13, d = end.map((value, axis) => value - root[axis]!) as Triple, length = Math.hypot(...d), h = Math.hypot(d[0], d[2]), side: Triple = h > 1e-8 ? [-d[2] / h, 0, d[0] / h] : [1, 0, 0], normal: Triple = h > 1e-8 ? [-d[0] * d[1] / length / h, h / length, -d[2] * d[1] / length / h] : [0, 0, -1], frontVertices: { x: number; y: number; z: number }[] = [{ x: 0, y: 0, z: 0 }], front: number[] = [], boundary: number[] = [0];
  for (let row = 0; row < (bifid ? 4 : 3); row++) for (let column = 0; column < columns; column++) { const u = column / (columns - 1) - .5, t = row === 3 ? 1 - (1 - Math.abs(u) * 2) * .22 : (bifid ? [.2, .5, .7] : [.2, .56, .82])[row]!, w = [.65, 1, .7, .7][row]!, fold = (column % 2 ? -.008 : .008) * width; frontVertices.push({ x: d[0] * t + side[0] * u * width * w + normal[0] * fold, y: d[1] * t + normal[1] * fold, z: d[2] * t + side[2] * u * width * w + normal[2] * fold }); }
  if (!bifid) frontVertices.push({ x: d[0], y: d[1], z: d[2] });
  const rows = bifid ? 4 : 3;
  for (let column = 0; column < columns - 1; column++) front.push(0, 2 + column, 1 + column);
  for (let row = 0; row < rows - 1; row++) for (let column = 0; column < columns - 1; column++) { const a = 1 + row * columns + column, b = a + 1, c = a + columns, d = b + columns; front.push(a, b, d, a, d, c); }
  if (!bifid) for (let column = 0; column < columns - 1; column++) front.push(1 + (rows - 1) * columns + column, 2 + (rows - 1) * columns + column, frontVertices.length - 1);
  for (let row = 0; row < rows; row++) boundary.push(1 + row * columns);
  if (!bifid) boundary.push(frontVertices.length - 1); else for (let column = 1; column < columns; column++) boundary.push(1 + (rows - 1) * columns + column);
  for (let row = rows - 1; row >= 0; row--) boundary.push(columns + row * columns);
  const count = frontVertices.length, vertices = [...frontVertices, ...frontVertices.map(p => ({ x: p.x - normal[0] * .002, y: p.y - normal[1] * .002, z: p.z - normal[2] * .002 }))], indices = [...front];
  for (let index = 0; index < front.length; index += 3) indices.push(front[index]! + count, front[index + 2]! + count, front[index + 1]! + count);
  for (let edge = 0; edge < boundary.length; edge++) { const a = boundary[edge]!, b = boundary[(edge + 1) % boundary.length]!; if (a !== b) indices.push(a, b, b + count, a, b + count, a + count); }
  return part(`${name}真实连续折脊的${bifid ? "宽大双裂叶" : "长菱形不裂叶"}`, "mesh", green, root, [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function plumoseFrond(root: Triple, angle: number, reach: number, rise: number, rows: number, levels = 1, fold = .15, underside?: string): ModelPart[] {
  const middle: Triple = [root[0] + Math.cos(angle) * reach * .4, root[1] + rise, root[2] + Math.sin(angle) * reach * .4], end: Triple = [root[0] + Math.cos(angle) * reach, root[1] + rise * .3, root[2] + Math.sin(angle) * reach], blades: ModelPart[] = [];
  for (let row = 0; row < rows; row++) for (const side of [-1, 1]) for (let level = 0; level < levels; level++) { const t = .12 + row / rows * .83, p = branchPoint(root, middle, end, t, .4), a = angle + side * (1.05 + level * .1), length = reach * .28 * Math.sin(t * Math.PI), elevation = fold + (level - (levels - 1) / 2) * .4; blades.push(flatNeedle("棕榈共同弧叶轴上独立排列的狭长硬羽片", p, [p[0] + Math.cos(a) * length, p[1] + elevation * length, p[2] + Math.sin(a) * length], .025)); }
  const parts: ModelPart[] = [tapered("承托多平面羽片群的完整连续棕榈叶轴", bark, [root, middle, end], [.045, .025, .002])];
  for (let offset = 0; offset < blades.length; offset += 72) {
    const batch = blades.slice(offset, offset + 72);
    if (!underside) { parts.push(combineMeshes("同一完整羽叶上全部真实分离的羽片", green, batch)); continue; }
    for (const lower of [false, true]) parts.push(combineMeshes(lower ? "羽片与正面共用边界的实际银白叶背" : "完整羽片绿色叶面", lower ? underside : green, batch.map(value => ({ ...value, indices: value.indices!.filter((_, index, indices) => indices[Math.floor(index / 3) * 3] === (lower ? 5 : 4)) }))));
  }
  return parts;
}

function fruitBunch(root: Triple, drop: number, count: number, size: Triple, color = fruitColor): ModelPart[] {
  const end: Triple = [root[0], root[1] - drop, root[2]], stems: ModelPart[] = [tapered("棕榈果穗真实连续的下垂总轴", bark, [root, end], [.012, .003])], fruits: ModelPart[] = [];
  for (let fruit = 0; fruit < count; fruit++) { const a = fruit * 2.4, t = (fruit + 1) / (count + 1), base = mix(root, end, t), r = Math.sin(t * Math.PI) * Math.max(size[0] * 1.6, .06), p: Triple = [base[0] + Math.cos(a) * r, base[1], base[2] + Math.sin(a) * r]; stems.push(needle("棕榈果穗中每枚核果独立的短柄", bark, base, p, .002)); fruits.push(lobe("棕榈果穗上保持独立轮廓和连接的核果", color, p, size)); }
  const result: ModelPart[] = [combineMeshes("完整棕榈果穗中总轴与全部果柄", bark, stems)];
  for (let offset = 0; offset < fruits.length; offset += 36) result.push(combineMeshes("棕榈果穗中完整保留的独立核果", color, fruits.slice(offset, offset + 36)));
  return result;
}

function bismarckPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("霸王棕粗直而带宿存叶基痕的单生木质干", bark, [[0, 0, 0], [0, 12.5, 0]], [.4, .31])];
  for (let frond = 0; frond < 9; frond++) { const a = frond * 2.4, root: Triple = [0, 12.2, 0], p: Triple = [Math.cos(a) * 1.8, 12.8 + frond % 3 * .6, Math.sin(a) * 1.8]; parts.push(tapered("霸王棕托起巨大掌状叶的粗长硬叶柄", bark, [root, p], [.055, .025]), ...pleatedFan("霸王棕", p, a, 1.9, Math.PI * 1.55, 18, .53, .85 - frond % 3 * .3, .05)); }
  parts.push(...fruitBunch([.3, 12, 0], .7, 22, [.035, .045, .035])); return parts;
}

function ruffledFanPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("圆叶刺轴榈纤细直立而不膨大的木质干", bark, [[0, 0, 0], [0, 3.5, 0]], [.075, .055])];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, root: Triple = [0, 3.35, 0], p: Triple = [Math.cos(a) * .75, 3.8 + frond % 2 * .25, Math.sin(a) * .75]; parts.push(tapered("圆叶刺轴榈圆整大扇叶的细长叶柄", bark, [root, p], [.016, .008]), ...pleatedFan("圆叶刺轴榈", p, a, .8, Math.PI * 1.8, 20, .97, .9 - frond % 3 * .2, 0)); }
  parts.push(...fruitBunch([.05, 3.2, 0], .7, 25, [.012, .012, .012])); return parts;
}

function windmillPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("棕榈由地面直立且包裹纤维的完整干", bark, [[0, 0, 0], [0, 11.5, 0]], [.17, .13])], fibers: ModelPart[] = [];
  for (let fiber = 0; fiber < 90; fiber++) { const a = fiber * 2.4, y = .08 + fiber % 30 * .36, r = .17 - y * .0033, p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; fibers.push(needle("棕榈干上交叉而粗糙的实际宿存棕纤维", bark, p, [p[0] + Math.cos(a + .6) * .055, p[1] + .19, p[2] + Math.sin(a + .6) * .055], .004)); }
  for (let offset = 0; offset < fibers.length; offset += 72) parts.push(combineMeshes("棕榈粗干表面真实交错的棕纤维层", bark, fibers.slice(offset, offset + 72)));
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, root: Triple = [0, 11.3, 0], p: Triple = [Math.cos(a) * .9, 11.6 + frond % 3 * .35, Math.sin(a) * .9]; parts.push(tapered("棕榈裂掌叶的长直叶柄", bark, [root, p], [.02, .009]), ...pleatedFan("棕榈", p, a, .8, Math.PI * 1.5, 16, .43, .65 - frond % 3 * .24, .07)); }
  return parts;
}

function californiaFanPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("丝葵粗直带老叶基痕的完整高干", bark, [[0, 0, 0], [0, 18.5, 0]], [.45, .31])], skirt: ModelPart[] = [], filaments: ModelPart[] = [];
  for (let oldLeaf = 0; oldLeaf < 24; oldLeaf++) { const a = oldLeaf * 2.4, y = 17.4 - oldLeaf % 3 * .25, r = .45 - .14 * y / 18.5, p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; skirt.push(leaf("丝葵正常宿存而向下披挂的老叶裙", bark, p, .2, 2.3 + oldLeaf % 3 * .25, [176, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("丝葵冠下整体宿存的实际枯叶裙", bark, skirt));
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, root: Triple = [0, 18.2, 0], p: Triple = [Math.cos(a) * 1.1, 18.6 + frond % 3 * .4, Math.sin(a) * 1.1], blades = pleatedFan("丝葵", p, a, 1.4, Math.PI * 1.6, 18, .58, .7 - frond % 3 * .2, .18); parts.push(tapered("丝葵大扇叶的长粗叶柄", bark, [root, p], [.035, .018]), ...blades); for (let fiber = 0; fiber < 10; fiber++) { const point = blades[0]!.vertices![38 + Math.floor(fiber / 9 * 18) * 2]!, q: Triple = [p[0] + point.x, p[1] + point.y, p[2] + point.z]; filaments.push(needle("丝葵实际连接叶缘折脊端部的丝状纤维", pale, q, [q[0] + .08, q[1] - .13, q[2] + .035], .001)); } }
  for (let offset = 0; offset < filaments.length; offset += 72) parts.push(combineMeshes("丝葵扇叶周围真实独立的叶缘丝线", pale, filaments.slice(offset, offset + 72)));
  return parts;
}

function cabbagePalmetto(): ModelPart[] {
  const parts: ModelPart[] = [tapered("菜棕向上略收细的粗直木质单干", bark, [[0, 0, 0], [0, 16, 0]], [.32, .24])], boots: ModelPart[] = [];
  for (let boot = 0; boot < 32; boot++) { const a = boot * 2.4, y = 1 + boot % 16 * .7, r = .32 - y * .005, p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r], q: Triple = [p[0] + Math.cos(a) * .035, p[1] + .16, p[2] + Math.sin(a) * .035]; boots.push(tapered("菜棕宿存叶柄基紧贴树干的真实共同基部", bark, [p, q], [.02, .012])); for (const side of [-1, 1]) boots.push(flatNeedle("菜棕靴状叶柄基真正向两侧分叉的硬叶鞘条", q, [q[0] - Math.sin(a) * side * .055, q[1] + .17, q[2] + Math.cos(a) * side * .055], .035)); }
  for (let offset = 0; offset < boots.length; offset += 48) parts.push(combineMeshes("菜棕粗干正常留存的真实Y形交叉靴状叶基", bark, boots.slice(offset, offset + 48)));
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, root: Triple = [0, 15.8, 0], p: Triple = [Math.cos(a) * 1.5, 16.4 + frond % 3 * .4, Math.sin(a) * 1.5], q: Triple = [p[0] + Math.cos(a) * .4, p[1] + .15, p[2] + Math.sin(a) * .4]; parts.push(tapered("菜棕掌叶内部真实延伸的折龙骨中肋", bark, [root, p, q], [.04, .025, .005]), ...pleatedFan("菜棕", p, a, 1.2, Math.PI * 1.45, 18, .61, .85 - frond % 3 * .25, .15)); }
  return parts;
}

function mexicanBluePalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("布拉叶棕短粗且略渐细的木质干", bark, [[0, 0, 0], [0, 10.8, 0]], [.37, .29])], flowers: ModelPart[] = [];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * 1.1, 11.3 + frond % 3 * .35, Math.sin(a) * 1.1]; parts.push(tapered("布拉叶棕刚硬大扇叶的叶柄", bark, [[0, 10.6, 0], p], [.03, .015]), ...pleatedFan("布拉叶棕", p, a, 1.1, Math.PI * 1.6, 18, .52, .8 - frond % 3 * .25, .025)); }
  for (let inflorescence = 0; inflorescence < 3; inflorescence++) {
    const a = inflorescence * Math.PI * 2 / 3, root: Triple = [0, 10.5, 0], middle: Triple = [Math.cos(a) * 1.9, 12, Math.sin(a) * 1.9], end: Triple = [Math.cos(a) * 3.5, 8.8, Math.sin(a) * 3.5]; parts.push(tapered("布拉叶棕超出冠幅并向下悬垂的巨大花序轴", bark, [root, middle, end], [.025, .015, .002]));
    for (let branch = 0; branch < 12; branch++) { const p = branchPoint(root, middle, end, .3 + branch * .055, .5), b = a + (branch % 2 ? .8 : -.8), q: Triple = [p[0] + Math.cos(b) * .3, p[1] - .2, p[2] + Math.sin(b) * .3]; flowers.push(needle("布拉叶棕长花序的独立下垂分轴", pale, p, q, .004)); for (let flower = 0; flower < 5; flower++) flowers.push(lobe("布拉叶棕花序分轴上的极小圆花团", pale, mix(p, q, (flower + 1) / 6), [.009, .009, .009])); }
  }
  for (let offset = 0; offset < flowers.length; offset += 30) parts.push(combineMeshes("布拉叶棕全部长垂花序中的细分轴和小花", pale, flowers.slice(offset, offset + 30)));
  return parts;
}

function carnaubaPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("巴西蜡棕高而细直的完整木质单干", bark, [[0, 0, 0], [0, 14.5, 0]], [.18, .13])], bases: ModelPart[] = [];
  for (let base = 0; base < 24; base++) { const a = base * 2.4, y = 9 + base % 8 * .6, r = .18 - y * .05 / 14.5; bases.push(leaf("巴西蜡棕冠下长年宿存的粗硬叶柄基", bark, [Math.cos(a) * r, y, Math.sin(a) * r], .09, .22, [35, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("巴西蜡棕上部干的真实交错宿存叶柄基", bark, bases));
  for (let frond = 0; frond < 9; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * 1, 15.1 + frond % 3 * .45, Math.sin(a) * 1]; parts.push(tapered("巴西蜡棕带蜡扇叶的刚直长柄", bark, [[0, 14.3, 0], p], [.025, .012]), ...pleatedFan("巴西蜡棕", p, a, 1.05, Math.PI * 1.5, 18, .55, 1 - frond % 3 * .3, .02)); }
  parts.push(...fruitBunch([.13, 14.2, 0], .9, 25, [.022, .025, .022])); return parts;
}

function chileanWinePalm(): ModelPart[] {
  const parts: ModelPart[] = [part("智利蜜棕极粗厚而中部圆柱化的完整木质干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .65, y: 0 }, { x: .78, y: 2 }, { x: .73, y: 13 }, { x: .48, y: 19.5 }, { x: .33, y: 20 }] })];
  for (let frond = 0; frond < 9; frond++) parts.push(...palmFrond([0, 19.7, 0], frond * 2.4, 3.5, 1.8 + frond % 3 * .5, 14, .055));
  parts.push(...fruitBunch([.42, 19, 0], 1.1, 30, [.033, .036, .033])); return parts;
}

function pindoPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("布迪椰子上部覆粗叶基的短粗单干", bark, [[0, 0, 0], [0, 6.5, 0]], [.34, .25])], boots: ModelPart[] = [];
  for (let base = 0; base < 30; base++) { const a = base * 2.4, y = 1.4 + base % 10 * .47, r = .34 - y * .09 / 6.5; boots.push(leaf("布迪椰子树干真实交错而粗大的叶柄残基", bark, [Math.cos(a) * r, y, Math.sin(a) * r], .12, .32, [32, 90 - a * 180 / Math.PI, 0], "YXZ")); }
  parts.push(combineMeshes("布迪椰子上半干完整宿存的粗硬叶柄基", bark, boots));
  for (let frond = 0; frond < 8; frond++) parts.push(...plumoseFrond([0, 6.3, 0], frond * 2.4, 2.5, 1.6 + frond % 2 * .35, 16, 1, .6));
  parts.push(...fruitBunch([.24, 6, 0], .8, 28, [.025, .028, .025])); return parts;
}

function queenPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("皇后葵没有长冠轴的细直环痕木质干", bark, [[0, 0, 0], [0, 18.5, 0]], [.23, .16])];
  for (let scar = 0; scar < 9; scar++) { const y = 1 + scar * 1.8, r = .23 - .07 * y / 18.5; parts.push(part("皇后葵紧贴实际干径的窄水平叶痕", "lathe", "#b3aa8f", [0, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: r - .002, y: 0 }, { x: r + .003, y: 0 }, { x: r + .003, y: .02 }, { x: r - .002, y: .02 }, { x: r - .002, y: 0 }] })); }
  for (let frond = 0; frond < 9; frond++) parts.push(...plumoseFrond([0, 18.25, 0], frond * 2.4, 3.5, 1.5 + frond % 3 * .4, 14, 2, .1));
  parts.push(...fruitBunch([.16, 18, 0], 1.15, 36, [.026, .031, .026])); return parts;
}

function royalPalm(): ModelPart[] {
  const parts: ModelPart[] = [part("大王椰子中段略鼓而上端收颈的光滑灰色干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .38, y: 0 }, { x: .43, y: 4 }, { x: .5, y: 13 }, { x: .35, y: 21 }, { x: .27, y: 23.4 }] }), tapered("大王椰子叶鞘紧抱而成的明显绿色长冠轴", green, [[0, 22.9, 0], [0, 25.5, 0]], [.29, .23])];
  for (let frond = 0; frond < 9; frond++) parts.push(...plumoseFrond([0, 25.35, 0], frond * 2.4, 4, 1.9 + frond % 3 * .5, 13, 3, .05));
  parts.push(...fruitBunch([.27, 22.8, 0], 1.1, 32, [.012, .015, .012], "#8f9784")); return parts;
}

function quindioWaxPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("安第斯蜡棕不具长冠轴的极高覆白蜡木质单干", "#bfc4af", [[0, 0, 0], [0, 30, 0], [0, 49, 0]], [.24, .18, .12])];
  for (let frond = 0; frond < 8; frond++) parts.push(...plumoseFrond([0, 48.85, 0], frond * 2.4, 3.8, 1.7 + frond % 3 * .45, 17, 1, .1, "#c7cbb5"));
  parts.push(...fruitBunch([.12, 48.6, 0], 1.2, 32, [.018, .02, .018])); return parts;
}

function joeyPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("钻叶棕几乎完全埋入地下的极短根颈", bark, [[0, 0, 0], [0, .12, 0]], [.075, .065])], spines: ModelPart[] = [];
  for (let frond = 0; frond < 8; frond++) {
    const a = frond * 2.4, root: Triple = [0, .08, 0], p: Triple = [Math.cos(a) * 1.1, 1.5 + frond % 2 * .3, Math.sin(a) * 1.1], end: Triple = [Math.cos(a) * 2.4, 4.8 + frond % 3 * .35, Math.sin(a) * 2.4];
    parts.push(tapered("钻叶棕直接自根颈抽出的长细叶柄", bark, [root, p], [.025, .018]), pleatedBlade("钻叶棕", p, end, 1.45));
    for (let spine = 0; spine < 6; spine++) { const base = mix(root, p, .2 + spine * .11), b = a + (spine % 2 ? 1 : -1); spines.push(needle("钻叶棕长叶柄边缘真实短刺", bark, base, [base[0] + Math.cos(b) * .018, base[1] + .005, base[2] + Math.sin(b) * .018], .0015)); }
  }
  parts.push(combineMeshes("钻叶棕全部长叶柄实际边刺", bark, spines)); return parts;
}

function whiteElephantPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("白背棕藏于叶冠下面的短粗单生木质干", bark, [[0, 0, 0], [0, 2.8, 0]], [.18, .15])];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * 1.2, 3.1 + frond % 3 * .35, Math.sin(a) * 1.2]; parts.push(tapered("白背棕区别于叶片的近黑色长叶柄", "#717c6a", [[0, 2.65, 0], p], [.025, .012]), ...pleatedFan("白背棕", p, a, 1.35, Math.PI * 1.65, 20, .72, .75 - frond % 3 * .3, .04, "#d1d2bd")); }
  parts.push(...fruitBunch([.15, 2.5, 0], .55, 18, [.025, .025, .025])); return parts;
}

function talipotPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("贝叶棕承托巨叶与巨大顶生花序的粗直木质干", bark, [[0, 0, 0], [0, 21, 0]], [.67, .49])];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * 2, 21.5 + frond % 3 * .5, Math.sin(a) * 2]; parts.push(tapered("贝叶棕直径数米掌状巨叶的粗长叶柄", bark, [[0, 20.8, 0], p], [.085, .035]), ...pleatedFan("贝叶棕", p, a, 2.45, Math.PI * 1.55, 22, .63, .65 - frond % 3 * .2, .1)); }
  const top: Triple = [0, 27.5, 0], axes: ModelPart[] = [], florets: ModelPart[] = [];
  parts.push(tapered("贝叶棕完整顶生巨型花序高达六米的主轴", bark, [[0, 20.9, 0], top], [.2, .007]));
  for (let tier = 0; tier < 4; tier++) for (let branch = 0; branch < 3; branch++) {
    const a = branch * Math.PI * 2 / 3 + tier, p: Triple = [0, 22.2 + tier * 1.2, 0], r = 3.2 - tier * .65, end: Triple = [Math.cos(a) * r, p[1] + .25, Math.sin(a) * r]; axes.push(tapered("贝叶棕巨大花序上的一级展开分枝", pale, [p, end], [.04, .003]));
    for (let twig = 0; twig < 5; twig++) { const base = mix(p, end, .25 + twig * .14), b = a + (twig % 2 ? .8 : -.8), q: Triple = [base[0] + Math.cos(b) * .42, base[1] + .18, base[2] + Math.sin(b) * .42]; axes.push(needle("贝叶棕巨大花序中真实二级细分枝", pale, base, q, .005)); for (let flower = 0; flower < 4; flower++) florets.push(lobe("贝叶棕细分花枝上的小花簇体积", pale, mix(base, q, (flower + 1) / 5), [.018, .018, .018])); }
  }
  for (let offset = 0; offset < axes.length; offset += 24) parts.push(combineMeshes("贝叶棕整棵巨大花序实际相连的分枝", pale, axes.slice(offset, offset + 24)));
  for (let offset = 0; offset < florets.length; offset += 36) parts.push(combineMeshes("贝叶棕巨型花序中的小型花簇体积", pale, florets.slice(offset, offset + 36)));
  return parts;
}

function palmyraPalm(): ModelPart[] {
  const parts: ModelPart[] = [part("糖棕中段自然膨粗且顶端无冠轴的深色干", "lathe", bark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .36, y: 0 }, { x: .33, y: 6 }, { x: .48, y: 11.5 }, { x: .34, y: 18 }, { x: .29, y: 20 }] })], teeth: ModelPart[] = [];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, root: Triple = [0, 19.8, 0], p: Triple = [Math.cos(a) * 1.3, 20.4 + frond % 3 * .4, Math.sin(a) * 1.3]; parts.push(tapered("糖棕宽大掌叶的黑褐粗硬叶柄", bark, [root, p], [.045, .025]), ...pleatedFan("糖棕", p, a, 1.65, Math.PI * 1.5, 20, .57, .8 - frond % 3 * .25, .12)); for (let tooth = 0; tooth < 6; tooth++) { const base = mix(root, p, .25 + tooth * .1), b = a + (tooth % 2 ? 1.2 : -1.2); teeth.push(needle("糖棕叶柄两侧明显而坚硬的黑色锯齿", bark, base, [base[0] + Math.cos(b) * .025, base[1], base[2] + Math.sin(b) * .025], .003)); } }
  parts.push(combineMeshes("糖棕全部长叶柄真实坚硬锯齿", bark, teeth), ...fruitBunch([.3, 19.4, 0], .75, 9, [.15, .14, .15], "#8c9080")); return parts;
}

function nibungPalm(): ModelPart[] {
  const parts: ModelPart[] = [], spines: ModelPart[] = [];
  for (let trunk = 0; trunk < 3; trunk++) {
    const x = (trunk - 1) * .48, z = trunk === 1 ? .3 : -.15, height = 17 + trunk * 2.3;
    parts.push(tapered("尼邦刺棕丛生且密布硬刺的细长完整木质干", bark, [[x, 0, z], [x, height, z]], [.075, .065]), tapered("尼邦刺棕同样带刺的长绿色冠轴", green, [[x, height - .2, z], [x, height + .75, z]], [.075, .06]));
    for (let spine = 0; spine < 48; spine++) { const a = spine * 2.4, y = .4 + spine % 24 * height / 25, r = .075 - y / height * .01, p: Triple = [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; spines.push(needle("尼邦刺棕细干上实际生出的五至十厘米黑硬刺", "#77806d", p, [p[0] + Math.cos(a) * .08, p[1] - .01, p[2] + Math.sin(a) * .08], .003)); }
    for (let frond = 0; frond < 5; frond++) parts.push(...palmFrond([x, height + .6, z], frond * 2.4 + trunk, 2.7, 1.2 + frond % 2 * .4, 10, .045));
    parts.push(...fruitBunch([x + .065, height - .3, z], .65, 18, [.01, .01, .01], "#87917b"));
  }
  for (let offset = 0; offset < spines.length; offset += 72) parts.push(combineMeshes("尼邦刺棕整丛细干表面真实独立的黑硬刺", "#77806d", spines.slice(offset, offset + 72)));
  return parts;
}

function peachPalm(): ModelPart[] {
  const parts: ModelPart[] = [], spines: ModelPart[] = [];
  for (let trunk = 0; trunk < 2; trunk++) {
    const x = trunk ? .3 : -.3, z = trunk ? .15 : -.1, height = 10.5 + trunk * 2.5;
    parts.push(tapered("桃棕多干丛生且着生环状硬刺的木质秆", bark, [[x, 0, z], [x, height, z]], [.14, .105]));
    for (let row = 0; row < 8; row++) for (let spine = 0; spine < 8; spine++) { const a = spine * Math.PI / 4 + row, y = .5 + row * (height - 1) / 8, r = .14 - y / height * .035, p: Triple = [x + Math.cos(a) * r, y, z + Math.sin(a) * r]; spines.push(needle("桃棕粗干各节环带上的独立硬长刺", "#7e866f", p, [p[0] + Math.cos(a) * .07, p[1] + .008, p[2] + Math.sin(a) * .07], .004)); }
    for (let frond = 0; frond < 6; frond++) parts.push(...plumoseFrond([x, height - .1, z], frond * 2.4 + trunk, 2.7, 1.4 + frond % 2 * .35, 13, 2, .1));
    parts.push(...fruitBunch([x + .11, height - .55, z], .75, 22, [.045, .06, .045]));
  }
  for (let offset = 0; offset < spines.length; offset += 72) parts.push(combineMeshes("桃棕两株完整环带硬刺群", "#7e866f", spines.slice(offset, offset + 72)));
  return parts;
}

function cocoDeMerPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("海椰子雌株托起巨型掌叶和大果的单生木质干", bark, [[0, 0, 0], [0, 25, 0]], [.42, .3])];
  for (let frond = 0; frond < 8; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * 2.4, 25.7 + frond % 3 * .5, Math.sin(a) * 2.4]; parts.push(tapered("海椰子数米巨叶的极长硬叶柄", bark, [[0, 24.7, 0], p], [.075, .03]), ...pleatedFan("海椰子", p, a, 2.7, Math.PI * 1.6, 24, .56, .85 - frond % 3 * .25, .2)); }
  for (let fruit = 0; fruit < 3; fruit++) {
    const a = fruit * Math.PI * 2 / 3, p: Triple = [Math.cos(a) * .6, 24 - fruit * .16, Math.sin(a) * .6]; parts.push(tapered("海椰子巨果从冠下直接悬挂的粗果柄", bark, [[0, 24.5, 0], p], [.025, .015]));
    const body: ModelPart[] = [];
    for (const side of [-1, 1]) body.push(lobe("海椰子果皮包裹双瓣种实形成的自然双肩果体", "#979a81", [p[0] + side * .075, p[1] - .15, p[2]], [.23, .35, .27]));
    body.push(lobe("海椰子双肩之间较浅而连续的外果皮连接", "#979a81", [p[0], p[1] - .11, p[2]], [.1, .31, .22])); parts.push(combineMeshes("海椰子保留完整外果皮的真实双肩巨果", "#979a81", body));
  }
  return parts;
}

function seychellesStiltPalm(): ModelPart[] {
  const parts: ModelPart[] = [tapered("塞舌尔支根棕从支柱根锥顶端起的木质干", bark, [[0, 1.6, 0], [0, 14.5, 0]], [.17, .12])], spines: ModelPart[] = [];
  for (let root = 0; root < 6; root++) { const a = root * Math.PI / 3; parts.push(tapered("塞舌尔支根棕确实落地的粗斜撑根", bark, [[0, 1.8 - root % 2 * .2, 0], [Math.cos(a) * .55, .8, Math.sin(a) * .55], [Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1]], [.035, .03, .023])); }
  for (let frond = 0; frond < 7; frond++) { const a = frond * 2.4, p: Triple = [Math.cos(a) * .65, 14.8 + frond % 2 * .2, Math.sin(a) * .65], end: Triple = [Math.cos(a) * 2.1, 16.1 + frond % 3 * .35, Math.sin(a) * 2.1]; parts.push(tapered("塞舌尔支根棕宽双裂整叶的真实长叶柄", bark, [[0, 14.3, 0], p], [.03, .019]), pleatedBlade("塞舌尔支根棕", p, end, 1.2, true)); }
  for (let spine = 0; spine < 48; spine++) { const a = spine * 2.4, y = 2 + spine % 16 * .7, r = .17 - (y - 1.6) * .05 / 12.9, p: Triple = [Math.cos(a) * r, y, Math.sin(a) * r]; spines.push(needle("塞舌尔支根棕干表实际生出的细长硬刺", bark, p, [p[0] + Math.cos(a) * .06, p[1], p[2] + Math.sin(a) * .06], .0025)); }
  parts.push(combineMeshes("塞舌尔支根棕完整主干上真实短硬刺", bark, spines)); return parts;
}

// 掌叶、整叶、羽叶分别按真实折面与装配实现；近缘色相及老幼状态不拆额外主项。
// https://www.nparks.gov.sg/florafaunaweb/flora/5/0/5084
// https://www.kew.org/plants/white-elephant-palm
// https://www.nparks.gov.sg/florafaunaweb/flora/2/6/2659
// https://ntbg.org/database/plants/detail/verschaffeltia-splendida
// https://www.greening.gov.hk/filemanager/greening/en/content_83/Roy_reg.pdf
export const woodyExpansionBatchElevenDesigns: MasterNatureDesign[] = [
  design("bismarckWholePalm", "霸王棕", "植物", bismarckPalm, ["Bismarckia nobilis", "粗单干刚直长柄巨大深裂折扇叶"]),
  design("ruffledFanWholePalm", "圆叶刺轴榈", "植物", ruffledFanPalm, ["Licuala grandis", "极少分裂的圆整连续折脊大叶与下垂小果穗"]),
  design("windmillWholePalm", "棕榈", "植物", windmillPalm, ["Trachycarpus fortunei", "真实交错宿存棕纤维干与深裂掌叶"]),
  design("californiaFanWholePalm", "丝葵", "植物", californiaFanPalm, ["Washingtonia filifera", "正常宿存老叶裙真实附叶丝线与大型扇叶"]),
  design("cabbagePalmettoWholePalm", "菜棕", "植物", cabbagePalmetto, ["Sabal palmetto", "交错靴状叶基与叶中延伸的龙骨肋"]),
  design("mexicanBlueWholePalm", "布拉叶棕", "植物", mexicanBluePalm, ["Brahea armata", "硬裂掌叶以及远远伸出叶冠的长垂分枝花序"]),
  design("carnaubaWholePalm", "巴西蜡棕", "植物", carnaubaPalm, ["Copernicia prunifera", "细直干上部粗旧叶基紧凑硬掌叶和小果穗"]),
  design("chileanWineWholePalm", "智利蜜棕", "植物", chileanWinePalm, ["Jubaea chilensis", "极粗无长冠轴柱干大型弧羽叶与成穗小圆果"]),
  design("pindoWholePalm", "布迪椰子", "植物", pindoPalm, ["Butia odorata", "粗靴状旧叶基与真实上折成V形的羽片"]),
  design("queenWholePalm", "皇后葵", "植物", queenPalm, ["Syagrus romanzoffiana", "无长冠轴真实环痕干与成组多平面羽片"]),
  design("royalWholePalm", "大王椰子", "植物", royalPalm, ["Roystonea regia", "王棕", "鼓干长绿色冠轴和成组三平面羽片"]),
  design("quindioWaxWholePalm", "安第斯蜡棕", "植物", quindioWaxPalm, ["Ceroxylon quindiuense", "极高覆白蜡干和具有真实银白背面的完整羽叶"]),
  design("joeyWholePalm", "钻叶棕", "植物", joeyPalm, ["Johannesteijsmannia altifrons", "无可见地上长干巨型菱形连续褶叶与叶柄短刺"]),
  design("whiteElephantWholePalm", "白背棕", "植物", whiteElephantPalm, ["Kerriodoxa elegans", "黑叶柄短单干和真正白背的浅裂巨掌叶"]),
  design("talipotWholePalm", "贝叶棕", "植物", talipotPalm, ["Corypha umbraculifera", "直径数米巨掌叶和顶生多级分枝巨大花序"]),
  design("palmyraWholePalm", "糖棕", "植物", palmyraPalm, ["Borassus flabellifer", "中段膨干黑齿叶柄巨掌叶和大型圆核果串"]),
  design("nibungWholePalm", "尼邦刺棕", "植物", nibungPalm, ["Oncosperma tigillarium", "丛生细长硬刺干长冠轴和柔垂羽叶"]),
  design("peachWholePalm", "桃棕", "植物", peachPalm, ["Bactris gasipaes", "丛生秆真实环带黑硬刺羽叶和成穗大卵果"]),
  design("cocoDeMerWholePalm", "海椰子树", "植物", cocoDeMerPalm, ["Lodoicea maldivica", "大型完整掌叶和保有外果皮的双肩巨果"]),
  design("seychellesStiltWholePalm", "塞舌尔支根棕", "植物", seychellesStiltPalm, ["Verschaffeltia splendida", "带刺单干真实斜支柱根和连续折脊宽双裂叶"]),
];
