import { cap, combineMeshes, design, leaf, lobe, needle, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { membrane } from "./animals";

const shell = "#a9b79a";
const limb = "#b6c0a2";
const wing = "#c8d0b8";
const pale = "#c9ceb6";

export function pointed(name: string, color: string, path: Triple[], radii: number[]): ModelPart {
  const p = tapered(name, color, path, radii); const rings = path.length - 1;
  // 毫米级触须和足尖用一个真实尖端封口，避免生成过小的八边形端盖。
  p.vertices = p.vertices!.slice(0, rings * 8);
  const start = p.vertices.length, end = start + 1;
  p.vertices.push({ x: path[0]![0], y: path[0]![1], z: path[0]![2] }, { x: path.at(-1)![0], y: path.at(-1)![1], z: path.at(-1)![2] });
  p.indices = [];
  for (let row = 0; row < rings - 1; row++) for (let j = 0; j < 8; j++) { const a = row * 8 + j, b = row * 8 + (j + 1) % 8, c = a + 8, d = b + 8; p.indices.push(a, c, b, b, c, d); }
  for (let j = 0; j < 8; j++) p.indices.push(start, j, (j + 1) % 8, (rings - 1) * 8 + j, end, (rings - 1) * 8 + (j + 1) % 8);
  return p;
}

export function lump(name: string, at: Triple, size: Triple, color = shell): ModelPart {
  const p = lobe(name, color, at, size); p.vertices = p.vertices!.map(v => ({ x: v.x * size[0], y: v.y * size[1], z: v.z * size[2] })); p.scale = { x: 1, y: 1, z: 1 }; return p;
}

export function eyes(parts: ModelPart[], at: Triple, gap: number, radius: number) { for (const side of [-1, 1]) parts.push(lump("复眼", [at[0] + side * gap, at[1], at[2]], [radius, radius, radius * 0.8], "#748c7b")); }

export function legs(parts: ModelPart[], count: number, y: number, length: number, span: number, radius: number, paddle = false) {
  for (const side of [-1, 1]) for (let i = 0; i < count; i++) { const z = length * (0.5 - i / Math.max(1, count - 1)); const end: Triple = [side * span, radius * 0.8, z - span * 0.35]; parts.push(pointed("分节附肢", limb, [[side * span * 0.12, y, z], [side * span * 0.65, y * 1.4, z - span * 0.15], end], [radius, radius * 0.65, radius * 0.25])); if (paddle && i === count - 1) parts.push(membrane("后足展开的薄游泳桨", wing, [end, [end[0] + side * span * 0.28, end[1], end[2] + span * 0.15], [end[0] + side * span * 0.45, end[1], end[2] - span * 0.25], [end[0], end[1], end[2] - span * 0.3]])); }
}

export function antennae(parts: ModelPart[], at: Triple, length: number, radius: number, club = false) {
  for (const side of [-1, 1]) { const end: Triple = [at[0] + side * length * 0.6, at[1] + length * 0.3, at[2] + length]; parts.push(pointed("成对分节触角", limb, [[at[0] + side * length * 0.08, at[1], at[2]], [at[0] + side * length * 0.45, at[1] + length * 0.2, at[2] + length * 0.55], end], [radius, radius * 0.65, radius * 0.3])); if (club) parts.push(lump("触角末端棒节", end, [radius * 3, radius * 4, radius * 3])); }
}

export function transparentWings(parts: ModelPart[], root: Triple, length: number, width: number, pairs = 2) {
  for (const side of [-1, 1]) for (let pair = 0; pair < pairs; pair++) { const z = root[2] - pair * length * 0.18; parts.push(membrane("完整薄膜翼", wing, [[side * width * 0.08, root[1], z], [side * width, root[1] + width * 0.1, z - length * 0.12], [side * width * 1.25, root[1], z - length * 0.75], [side * width * 0.6, root[1] - width * 0.1, z - length], [side * width * 0.1, root[1], z - length * 0.2]])); }
}

function insect(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(pointed("天蛾流线型粗厚躯", shell, [[0, 0.019, 0.035], [0, 0.02, 0], [0, 0.015, -0.045]], [0.01, 0.013, 0.002]), lump("天蛾大头", [0, 0.022, 0.035], [0.017, 0.016, 0.018])); eyes(parts, [0, 0.025, 0.04], 0.006, 0.007); antennae(parts, [0, 0.03, 0.038], 0.025, 0.0007, true);
    for (const side of [-1, 1]) parts.push(membrane("天蛾向后伸长的尖前翅", wing, [[side * 0.005, 0.025, 0.012], [side * 0.075, 0.026, -0.045], [side * 0.026, 0.022, -0.05], [side * 0.007, 0.022, -0.02]]), membrane("天蛾较短的后翅", "#b7c2a8", [[side * 0.007, 0.02, 0], [side * 0.042, 0.02, -0.027], [side * 0.025, 0.02, -0.045], [side * 0.006, 0.02, -0.02]])); legs(parts, 3, 0.016, 0.018, 0.021, 0.0007);
    parts.push(pointed("天蛾长吸管口器", limb, [[0, 0.017, 0.043], [0, 0.017, 0.065], [0.012, 0.018, 0.074], [0.02, 0.022, 0.065]], [0.0006, 0.0005, 0.0004, 0.00025]));
  } else if (kind === 1) {
    parts.push(pointed("羽蛾细窄直躯", shell, [[0, 0.014, 0.018], [0, 0.014, -0.025]], [0.003, 0.001]));
    for (const side of [-1, 1]) for (let plume = 0; plume < 5; plume++) { const root: Triple = [side * 0.002, 0.016, 0.01 - plume * 0.003]; const end: Triple = [side * (0.032 - plume * 0.003), 0.016, root[2] - 0.004 - plume * 0.002]; const pieces: ModelPart[] = [needle("分裂翅羽的主轴", limb, root, end, 0.0007)]; for (let i = 0; i < 10; i++) for (const fringe of [-1, 1]) { const t = (i + 1) / 11; const p: Triple = [root[0] + (end[0] - root[0]) * t, 0.016, root[2] + (end[2] - root[2]) * t]; pieces.push(needle("翅羽两侧独立长缘毛", wing, p, [p[0], 0.016, p[2] + fringe * 0.0025], 0.00025)); } parts.push(combineMeshes("一片真正裂开的羽状翅", wing, pieces)); } legs(parts, 3, 0.012, 0.012, 0.02, 0.00035);
  } else if (kind === 2) {
    parts.push(lump("网蝽小型扁躯", [0, 0.003, 0], [0.003, 0.003, 0.006]));
    for (const side of [-1, 1]) { const outline: [number, number][] = [[0, -0.003], [side * 0.0022, -0.002], [side * 0.003, 0.002], [side * 0.002, 0.005], [0, 0.003]]; const holes: [number, number][][] = []; for (let row = 0; row < 4; row++) for (let column = 0; column < 2; column++) { const x = side * (0.0007 + column * 0.0008), z = -0.001 + row * 0.0011; holes.push([[x - 0.00024, z - 0.0003], [x + 0.00024, z - 0.0003], [x + 0.00024, z + 0.0003], [x - 0.00024, z + 0.0003]]); } parts.push(polygon("网蝽具真实网孔的外翅", wing, outline, 0.00025, [0, 0.004, 0], holes)); }
    parts.push(cap("网蝽膨大罩状前胸背板", pale, [0, 0.004, 0.003], 0.0018, 0.0025, 3)); legs(parts, 3, 0.0025, 0.003, 0.004, 0.00025); antennae(parts, [0, 0.004, 0.004], 0.003, 0.0002);
  } else if (kind === 3) {
    parts.push(lump("柄眼蝇胸部", [0, 0.012, 0], [0.009, 0.012, 0.013]), pointed("柄眼蝇细长腹部", shell, [[0, 0.012, 0], [0, 0.01, -0.025]], [0.004, 0.0015]), pointed("头部横向长眼柄", limb, [[-0.024, 0.019, 0.013], [0, 0.016, 0.012], [0.024, 0.019, 0.013]], [0.0008, 0.002, 0.0008])); eyes(parts, [0, 0.019, 0.013], 0.025, 0.004); transparentWings(parts, [0, 0.017, 0], 0.025, 0.018, 1); legs(parts, 3, 0.01, 0.01, 0.018, 0.0004);
  } else if (kind === 4) {
    parts.push(lump("长颈象甲梨形硬翅体", [0, 0.015, -0.01], [0.022, 0.025, 0.034]), pointed("长颈象甲极长的关节前胸", shell, [[0, 0.02, 0.008], [0, 0.037, 0.022], [0, 0.065, 0.025]], [0.004, 0.003, 0.002]), lump("长颈象甲顶端小头", [0, 0.068, 0.027], [0.008, 0.009, 0.01])); legs(parts, 3, 0.012, 0.022, 0.025, 0.0008); antennae(parts, [0, 0.07, 0.03], 0.012, 0.00035, true);
  } else if (kind === 5) {
    for (let segment = 0; segment < 10; segment++) { const z = 0.04 - segment * 0.009; const w = 0.03 * (1 - Math.abs(segment - 4) * 0.08); parts.push(lump("三叶虫甲雌成虫的扁平甲节", [0, 0.008, z], [w, 0.014, 0.013])); for (const side of [-1, 1]) parts.push(needle("甲节侧缘宽角叶", limb, [side * w * 0.3, 0.01, z], [side * w * 0.9, 0.01, z - 0.004], 0.006)); } parts.push(lump("前端小型可伸缩头", [0, 0.008, 0.048], [0.012, 0.01, 0.012])); legs(parts, 3, 0.008, 0.023, 0.021, 0.0007);
  } else if (kind === 6 || kind === 7) {
    const whirligig = kind === 7; const length = whirligig ? 0.017 : 0.045;
    parts.push(lump(whirligig ? "豉甲高拱卵形背甲" : "龙虱扁流线型双鞘翅", [0, 0.01, 0], [length * 0.65, length * 0.4, length]), lump("水生甲虫前胸头", [0, 0.01, length * 0.4], [length * 0.48, length * 0.32, length * 0.3])); legs(parts, 3, 0.009, length * 0.65, length * 0.65, length * 0.02, true);
    if (whirligig) for (const side of [-1, 1]) for (const y of [0.014, 0.007]) parts.push(lump("豉甲分居水上水下的复眼", [side * length * 0.23, y, length * 0.43], [0.003, 0.0027, 0.003], "#778d7c")); else { eyes(parts, [0, 0.014, length * 0.43], 0.01, 0.007); antennae(parts, [0, 0.014, length * 0.48], 0.022, 0.0005); }
  } else if (kind === 8) {
    parts.push(lump("虎甲狭窄前胸", [0, 0.018, 0.003], [0.009, 0.011, 0.016]), lump("虎甲长卵形鞘翅腹部", [0, 0.016, -0.017], [0.017, 0.016, 0.03]), lump("虎甲宽大捕食头", [0, 0.021, 0.02], [0.019, 0.013, 0.013])); eyes(parts, [0, 0.025, 0.022], 0.008, 0.007); legs(parts, 3, 0.015, 0.02, 0.028, 0.0007); antennae(parts, [0, 0.023, 0.027], 0.024, 0.0004);
    for (const side of [-1, 1]) parts.push(pointed("虎甲镰刀状交错上颚", pale, [[side * 0.005, 0.019, 0.026], [side * 0.009, 0.018, 0.036], [side * -0.002, 0.018, 0.04]], [0.0025, 0.0015, 0.0004]));
  } else if (kind === 9) {
    parts.push(lump("隐翅虫短小鞘翅前体", [0, 0.009, 0.018], [0.01, 0.01, 0.015]), lump("隐翅虫独立大头", [0, 0.01, 0.031], [0.009, 0.01, 0.01]));
    for (let i = 0; i < 7; i++) parts.push(lump("短翅之外裸露而可弯的腹节", [0, 0.008 + i * i * 0.0005, 0.008 - i * 0.006], [0.011 - i * 0.0008, 0.009, 0.008])); legs(parts, 3, 0.008, 0.017, 0.013, 0.0004); antennae(parts, [0, 0.012, 0.035], 0.013, 0.00035);
  } else if (kind === 10) {
    parts.push(lump("天牛长圆筒鞘翅", [0, 0.015, -0.008], [0.015, 0.021, 0.05]), lump("天牛独立前胸", [0, 0.017, 0.023], [0.016, 0.017, 0.013]), lump("天牛下垂咀嚼头", [0, 0.014, 0.033], [0.012, 0.015, 0.015])); legs(parts, 3, 0.012, 0.032, 0.023, 0.0006); antennae(parts, [0, 0.022, 0.033], 0.09, 0.001);
    for (const side of [-1, 1]) parts.push(needle("前胸两侧坚硬棱突", limb, [side * 0.006, 0.018, 0.022], [side * 0.013, 0.018, 0.019], 0.003));
  } else if (kind === 11 || kind === 12) {
    const snakefly = kind === 12;
    parts.push(pointed(snakefly ? "蛇蛉直立细长前胸" : "蝶角蛉细腹", shell, snakefly ? [[0, 0.012, 0.015], [0, 0.034, 0.025], [0, 0.042, 0.032]] : [[0, 0.017, 0.018], [0, 0.016, -0.035]], snakefly ? [0.003, 0.0025, 0.002] : [0.005, 0.003]), lump("脉翅类头胸", [0, snakefly ? 0.044 : 0.022, snakefly ? 0.034 : 0.025], snakefly ? [0.008, 0.009, 0.009] : [0.017, 0.018, 0.016]));
    if (snakefly) parts.push(pointed("蛇蛉向后的长腹", shell, [[0, 0.012, 0.012], [0, 0.012, -0.035]], [0.005, 0.0015])); transparentWings(parts, [0, 0.018, 0.008], snakefly ? 0.035 : 0.055, snakefly ? 0.018 : 0.045); antennae(parts, [0, snakefly ? 0.048 : 0.028, snakefly ? 0.036 : 0.027], snakefly ? 0.017 : 0.045, 0.0004, !snakefly); legs(parts, 3, 0.012, 0.018, 0.022, 0.0004);
  } else if (kind === 13) {
    parts.push(pointed("足丝蚁细长柔软躯", shell, [[0, 0.007, 0.018], [0, 0.007, -0.023]], [0.004, 0.002]), lump("足丝蚁宽扁头", [0, 0.008, 0.023], [0.008, 0.007, 0.01])); legs(parts, 3, 0.006, 0.022, 0.012, 0.00035); antennae(parts, [0, 0.009, 0.026], 0.017, 0.0003);
    for (const side of [-1, 1]) parts.push(lump("足丝蚁前足膨大的纺丝跗节", [side * 0.01, 0.003, 0.015], [0.007, 0.005, 0.009]), pointed("末端短尾须", limb, [[side * 0.001, 0.006, -0.021], [side * 0.003, 0.006, -0.029]], [0.0003, 0.0001]));
  } else if (kind === 14) {
    parts.push(lump("沙螽巨大圆头", [0, 0.027, 0.025], [0.034, 0.035, 0.033]), lump("沙螽粗短前胸", [0, 0.02, 0.004], [0.024, 0.025, 0.024]));
    for (let i = 0; i < 7; i++) parts.push(lump("沙螽无翅而宽大的腹节", [0, 0.019, -0.01 - i * 0.006], [0.033 - Math.abs(i - 2) * 0.002, 0.029, 0.009])); legs(parts, 3, 0.018, 0.035, 0.034, 0.002); antennae(parts, [0, 0.035, 0.04], 0.08, 0.0007);
    for (const side of [-1, 1]) parts.push(pointed("沙螽有体积的强咀嚼上颚", limb, [[side * 0.008, 0.015, 0.04], [side * 0.01, 0.009, 0.05], [0, 0.009, 0.052]], [0.004, 0.003, 0.001]));
  } else if (kind === 15) {
    parts.push(lump("水蝎宽扁叶状腹体", [0, 0.01, -0.008], [0.022, 0.012, 0.045]), pointed("水蝎前伸细胸颈", shell, [[0, 0.012, 0.013], [0, 0.017, 0.027]], [0.006, 0.003]), lump("水蝎小头", [0, 0.018, 0.031], [0.008, 0.007, 0.009])); legs(parts, 2, 0.009, 0.022, 0.027, 0.0007);
    for (const side of [-1, 1]) parts.push(pointed("镰刀状捕食前足", limb, [[side * 0.003, 0.014, 0.02], [side * 0.025, 0.017, 0.047], [side * 0.016, 0.023, 0.042]], [0.0013, 0.0018, 0.0005])); parts.push(pointed("腹端细长呼吸管", limb, [[0, 0.011, -0.025], [0, 0.012, -0.067], [0.002, 0.014, -0.085]], [0.0015, 0.0009, 0.0004]));
  } else if (kind === 16 || kind === 20 || kind === 21) {
    const velvet = kind === 20, ensign = kind === 21;
    parts.push(lump("膜翅类坚实头胸", [0, 0.015, 0.008], velvet ? [0.014, 0.016, 0.024] : [0.009, 0.013, 0.016]), lump("膜翅类独立咀嚼头", [0, 0.018, 0.021], [0.009, 0.009, 0.01]));
    const abdomen: Triple = ensign ? [0, 0.037, -0.012] : velvet ? [0, 0.014, -0.018] : [0, 0.016, -0.036]; parts.push(pointed(ensign ? "连接胸上部的高位细腹柄" : "连接胸腹的细腰柄", limb, [[0, ensign ? 0.022 : 0.014, -0.001], abdomen], [0.0012, 0.001]));
    parts.push(lump(ensign ? "像小旗竖起的侧扁腹" : velvet ? "蚁蜂无翅雌体的蓬松大腹" : "细腰蜂的末端水滴腹", abdomen, ensign ? [0.0035, 0.015, 0.012] : velvet ? [0.018, 0.02, 0.027] : [0.012, 0.017, 0.025])); legs(parts, 3, 0.012, 0.018, ensign ? 0.026 : 0.03, 0.0006); antennae(parts, [0, 0.021, 0.025], 0.019, 0.0004);
    if (!velvet) transparentWings(parts, [0, 0.021, 0.006], 0.035, 0.02); else { const hairs: ModelPart[] = []; for (let i = 0; i < 32; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.007, 0.012 + i % 4 * 0.004, -0.025 + Math.sin(a) * 0.01]; hairs.push(needle("蚁蜂细密的体表长毛", wing, p, [p[0] * 1.4, p[1] + 0.003, p[2] - 0.001], 0.0003)); } parts.push(combineMeshes("蚁蜂完整立体绒毛层", wing, hairs)); }
  } else if (kind === 17 || kind === 18) {
    const robber = kind === 18; parts.push(lump(robber ? "食虫虻强壮前胸" : "蜂虻毛绒球形前体", [0, 0.019, 0.007], robber ? [0.017, 0.02, 0.025] : [0.027, 0.027, 0.025]), pointed("双翅类分节长腹", shell, [[0, 0.018, 0], [0, 0.012, robber ? -0.045 : -0.023]], [robber ? 0.009 : 0.01, 0.002]), lump("双翅类大复眼头", [0, 0.022, 0.024], [0.019, 0.02, 0.014])); eyes(parts, [0, 0.024, 0.027], 0.007, 0.01); transparentWings(parts, [0, 0.023, 0.008], 0.035, 0.026, 1); legs(parts, 3, 0.014, 0.019, robber ? 0.035 : 0.022, 0.0007);
    parts.push(pointed(robber ? "食虫虻粗硬的刺吸喙" : "蜂虻极长而直的吸蜜喙", limb, [[0, 0.018, 0.03], [0, robber ? 0.006 : 0.015, robber ? 0.04 : 0.075]], [robber ? 0.003 : 0.0008, 0.0003])); const hair: ModelPart[] = []; for (let i = 0; i < 25; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.01, 0.015 + i % 4 * 0.004, robber ? 0.03 : 0.005 + Math.sin(a) * 0.01]; hair.push(needle(robber ? "面部硬须形成的髭" : "蜂虻密集细绒毛", wing, p, [p[0] * 1.35, p[1] + 0.004, p[2] + 0.003], 0.0003)); } parts.push(combineMeshes("双翅类完整特化毛被", wing, hair));
  } else if (kind === 19) {
    parts.push(pointed("兰花螳螂长前胸", shell, [[0, 0.024, -0.01], [0, 0.04, 0.03]], [0.004, 0.002]), lump("兰花螳螂宽大腹部", [0, 0.02, -0.028], [0.02, 0.018, 0.034]), lump("兰花螳螂三角形头", [0, 0.043, 0.035], [0.019, 0.013, 0.013])); eyes(parts, [0, 0.046, 0.037], 0.008, 0.006); legs(parts, 2, 0.019, 0.025, 0.038, 0.0011);
    for (const side of [-1, 1]) { parts.push(pointed("螳螂折叠的捕食前足", limb, [[side * 0.004, 0.034, 0.025], [side * 0.02, 0.03, 0.055], [side * 0.016, 0.045, 0.05]], [0.0017, 0.0025, 0.0005])); for (const z of [-0.018, 0.008]) parts.push(leaf("步足上真实膨大的花瓣状叶片", "#d2cbb8", [side * 0.021, 0.028, z], 0.016, 0.027, [75, side * 80, 0])); } antennae(parts, [0, 0.049, 0.035], 0.027, 0.00035);
  } else if (kind === 22 || kind === 23 || kind === 25) {
    const whip = kind === 23, hood = kind === 25;
    parts.push(lump(whip ? "无鞭蝎极扁的宽头胸甲" : hood ? "盔甲蛛坚硬的前体" : "避日蛛巨大的双颚前体", [0, 0.016, 0.018], whip ? [0.035, 0.009, 0.027] : hood ? [0.012, 0.014, 0.015] : [0.025, 0.023, 0.027]), lump("蛛形类分节腹体", [0, 0.012, -0.015], whip ? [0.03, 0.013, 0.04] : hood ? [0.018, 0.016, 0.025] : [0.026, 0.024, 0.045])); legs(parts, whip ? 3 : 4, 0.013, hood ? 0.017 : 0.032, hood ? 0.025 : whip ? 0.075 : 0.055, hood ? 0.0008 : 0.0015);
    for (const side of [-1, 1]) {
      if (whip) parts.push(pointed("细长鞭状感觉第一对步足", limb, [[side * 0.011, 0.017, 0.022], [side * 0.08, 0.02, 0.07], [side * 0.14, 0.018, 0.08]], [0.001, 0.0006, 0.00025]), pointed("无鞭蝎带刺抓握触肢", shell, [[side * 0.01, 0.017, 0.027], [side * 0.042, 0.025, 0.065], [side * 0.017, 0.028, 0.05]], [0.003, 0.004, 0.001]));
      else if (!hood) parts.push(pointed("避日蛛前伸的大型双节螯肢", limb, [[side * 0.006, 0.017, 0.026], [side * 0.012, 0.022, 0.044], [side * 0.007, 0.012, 0.055]], [0.006, 0.006, 0.0015]), pointed("触肢形成的额外感知步肢", limb, [[side * 0.01, 0.016, 0.027], [side * 0.035, 0.015, 0.06], [side * 0.05, 0.005, 0.085]], [0.0015, 0.001, 0.0004]));
    }
    if (hood) { const hoodPlate = cap("盔甲蛛可覆盖口器的铰接头罩", wing, [0, 0.021, 0.027], 0.008, 0.006, 0); hoodPlate.rotation.x = -35; parts.push(hoodPlate); }
  } else if (kind === 24) {
    parts.push(lump("蜱头胸腹融合的扁卵体", [0, 0.0035, 0], [0.008, 0.006, 0.011]), lump("背面坚硬盾板", [0, 0.0056, 0.002], [0.006, 0.002, 0.006])); legs(parts, 4, 0.003, 0.006, 0.007, 0.00035);
    for (const side of [-1, 1]) parts.push(pointed("前端刺吸口器与触肢", limb, [[side * 0.001, 0.003, 0.004], [side * 0.0013, 0.0028, 0.008]], [0.0006, 0.00025]));
  } else if (kind === 26) {
    parts.push(pointed("石蛃背部高拱而腹部渐细的体", shell, [[0, 0.009, 0.016], [0, 0.012, 0.006], [0, 0.006, -0.023]], [0.002, 0.006, 0.001]), lump("石蛃明显的大复眼头", [0, 0.011, 0.019], [0.009, 0.009, 0.009])); eyes(parts, [0, 0.014, 0.02], 0.003, 0.004); legs(parts, 3, 0.008, 0.014, 0.014, 0.0004); antennae(parts, [0, 0.015, 0.022], 0.027, 0.0003);
    for (let i = -1; i <= 1; i++) parts.push(pointed("末端三条长尾缨", limb, [[i * 0.0006, 0.006, -0.021], [i * 0.009, 0.004, -0.058]], [0.0005, 0.0002]));
  } else if (kind === 27) {
    for (let i = 0; i < 9; i++) parts.push(lump("粉蚧柔软宽扁腹节", [0, 0.0018, -0.0032 + i * 0.0008], [0.0048 - Math.abs(i - 4) * 0.0004, 0.0027, 0.0014], "#d4d7c2")); const wax: ModelPart[] = []; for (const side of [-1, 1]) for (let i = 0; i < 12; i++) wax.push(needle("粉蚧体侧成列蜡丝", "#e1dfcb", [side * 0.0018, 0.002, -0.004 + i * 0.0007], [side * 0.004, 0.0028, -0.0045 + i * 0.0007], 0.00025)); parts.push(combineMeshes("粉蚧完整立体蜡丝裙", "#e1dfcb", wax)); legs(parts, 3, 0.0015, 0.004, 0.0035, 0.0002);
  } else if (kind === 28) {
    for (let i = 0; i < 10; i++) { const z = -0.025 + i * 0.005; const r = 0.016 * Math.sin((i + 1) / 11 * Math.PI); parts.push(lump("球马陆宽拱而互相叠合的背板", [0, 0.013, z], [r * 2, 0.026, 0.008])); }
    legs(parts, 10, 0.007, 0.044, 0.017, 0.0005); antennae(parts, [0, 0.013, 0.025], 0.011, 0.0004);
  } else {
    parts.push(pointed("吊蛉纤细胸腹轴", shell, [[0, 0.04, 0.022], [0, 0.035, -0.035]], [0.004, 0.001]), lump("吊蛉小型长吻头", [0, 0.043, 0.025], [0.008, 0.01, 0.01])); transparentWings(parts, [0, 0.045, 0.012], 0.04, 0.025);
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const foot: Triple = [side * 0.023, 0.008, 0.018 - i * 0.018]; parts.push(pointed("吊蛉长而可抓握的足", limb, [[side * 0.002, 0.037, 0.015 - i * 0.009], [side * 0.028, 0.025, 0.022 - i * 0.015], foot, [foot[0] - side * 0.004, 0.003, foot[2] + 0.006], [foot[0] - side * 0.008, 0.007, foot[2] + 0.007]], [0.0007, 0.0006, 0.0004, 0.0003, 0.0002])); } parts.push(needle("吊蛉向下的刺吸喙", limb, [0, 0.04, 0.027], [0, 0.026, 0.033], 0.0015));
  }
  if (kind === 4) for (const item of parts) { item.position = { x: item.position.x * 0.35, y: item.position.y * 0.35, z: item.position.z * 0.35 }; item.scale = { x: item.scale.x * 0.35, y: item.scale.y * 0.35, z: item.scale.z * 0.35 }; }
  return parts;
}

const names = [["hawkMoth", "天蛾"], ["plumeMoth", "羽蛾"], ["laceBug", "网蝽"], ["stalkEyedFly", "柄眼蝇"], ["giraffeWeevil", "长颈象甲"], ["trilobiteBeetle", "三叶虫甲"], ["divingBeetle", "龙虱"], ["whirligigBeetle", "豉甲"], ["tigerBeetle", "虎甲"], ["roveBeetle", "隐翅虫"], ["longhornBeetle", "天牛"], ["owlfly", "蝶角蛉"], ["snakefly", "蛇蛉"], ["webspinner", "足丝蚁"], ["jerusalemCricket", "沙螽"], ["waterScorpion", "水蝎"], ["threadWaistWasp", "细腰蜂"], ["beeFly", "蜂虻"], ["robberFly", "食虫虻"], ["orchidMantis", "兰花螳螂"], ["velvetAnt", "蚁蜂"], ["ensignWasp", "旗腹蜂"], ["camelSpider", "避日蛛"], ["whipSpider", "无鞭蝎"], ["tick", "蜱"], ["ricinuleid", "盔甲蛛"], ["bristletail", "石蛃"], ["mealybug", "粉蚧"], ["pillMillipede", "球马陆"], ["hangingFly", "吊蛉"]];

export const insectFormDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "动物", () => insect(index), ["特化翅甲与附肢的节肢动物"]));
