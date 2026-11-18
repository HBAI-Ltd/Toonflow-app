import { beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, radialLeaves, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";

const green = "#9caf8a";
const pale = "#bdc7aa";
const bloom = "#d3cbb7";
const stemColor = "#aab391";

function pinnate(root: Triple, angle: number, length: number, pairs: number): ModelPart {
  const a = angle * Math.PI / 180; const end: Triple = [root[0] + Math.cos(a) * length, root[1] + length * 0.3, root[2] + Math.sin(a) * length]; const pieces: ModelPart[] = [needle("完整复叶中轴", stemColor, root, end, 0.0025)];
  for (let row = 0; row < pairs; row++) for (const side of [-1, 1]) { const t = (row + 1) / (pairs + 1); const p: Triple = [root[0] + (end[0] - root[0]) * t, root[1] + (end[1] - root[1]) * t, root[2] + (end[2] - root[2]) * t]; const q: Triple = [p[0] + Math.cos(a + side * 1.2) * length * 0.25, p[1] + 0.02, p[2] + Math.sin(a + side * 1.2) * length * 0.25]; pieces.push(flatLeaf("完整椭圆小叶", p, q, length * 0.13)); }
  pieces.push(flatLeaf("奇数羽状复叶的顶生小叶", end, [end[0] + Math.cos(a) * length * 0.22, end[1] + 0.015, end[2] + Math.sin(a) * length * 0.22], length * 0.14));
  return combineMeshes("一片完整具中轴的复叶", green, pieces);
}

function orchid(root: Triple, size: number, mode: "slipper" | "bee" | "ghost" | "normal"): ModelPart[] {
  const parts: ModelPart[] = [petals(3, root, size * 0.6, size, 55, bloom)];
  if (mode === "slipper") parts.push(cap("郁金香兰包覆成郁金香形的厚花被", "#d6cfb6", root, size * 0.6, size * 1.4, 3), lobe("杯内独立唇瓣", pale, [root[0], root[1] + size * 0.6, root[2]], [size * 0.5, size * 0.5, size * 0.5]));
  else if (mode === "bee") { parts.push(lobe("蜂兰膨大的昆虫状三裂唇瓣", "#b8b19a", [root[0], root[1] - size * 0.2, root[2] + size * 0.25], [size, size * 1.25, size * 0.4])); for (const side of [-1, 1]) parts.push(lobe("唇瓣成对侧叶", "#c2bba3", [root[0] + side * size * 0.45, root[1] + size * 0.1, root[2] + size * 0.2], [size * 0.6, size * 0.6, size * 0.3])); }
  else if (mode === "ghost") { for (const side of [-1, 1]) parts.push(tapered("幽灵兰分叉的长唇瓣尾", bloom, [[root[0], root[1], root[2]], [root[0] + side * size * 0.4, root[1] - size, root[2] + size * 0.2], [root[0] + side * size * 0.9, root[1] - size * 1.4, root[2] + size * 0.5]], [size * 0.1, size * 0.07, size * 0.015])); parts.push(tapered("幽灵兰向后的细长蜜距", pale, [root, [root[0] + size * 0.2, root[1], root[2] - size * 1.7], [root[0] + size * 0.6, root[1] - size, root[2] - size * 2.4]], [size * 0.09, size * 0.06, size * 0.015])); }
  else { parts.push(petals(2, root, size * 0.7, size * 1.2, 80, "#cfc3b5"), cap("兰科具有体积的褶皱唇瓣", "#c2b8a6", [root[0], root[1] - size * 0.2, root[2] + size * 0.2], size * 0.38, size * 0.6, 3)); }
  return parts;
}

function plant(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(beam("重楼单根直立主茎", stemColor, [0, 0, 0], [0, 0.6, 0], 0.008));
    for (let i = 0; i < 8; i++) parts.push(leaf("重楼集中一轮的宽披针叶", green, [0, 0.4, 0], 0.07, 0.21, [80, i * 45, 0]));
    parts.push(beam("一轮叶中央的独立花柄", stemColor, [0, 0.4, 0], [0, 0.61, 0], 0.005), petals(8, [0, 0.61, 0], 0.023, 0.08, 80, pale), lobe("花心上位子房", "#b6baa0", [0, 0.63, 0], [0.035, 0.03, 0.035]));
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(needle("重楼长丝状内花被", "#c6c2a2", [0, 0.62, 0], [Math.cos(a) * 0.09, 0.68, Math.sin(a) * 0.09], 0.0018)); }
  } else if (kind === 1) {
    parts.push(tapered("天麻无绿叶的肉质花茎", "#bab69b", [[0, 0, 0], [0, 0.7, 0]], [0.014, 0.006]));
    for (let i = 0; i < 6; i++) parts.push(leaf("贴伏花茎的薄膜鳞叶", "#cbc2a5", [0, 0.05 + i * 0.08, 0], 0.018, 0.055, [12, i * 137.5 % 360, 0]));
    for (let i = 0; i < 17; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.022, 0.35 + i * 0.021, Math.sin(a) * 0.022]; const flower = cap("天麻倾斜的筒状合生花被", "#c9bea1", p, 0.009, 0.03, 3); flower.rotation.z = 100; parts.push(flower, leaf("花口短唇瓣", bloom, [p[0] + 0.02, p[1], p[2]], 0.011, 0.016, [90, 90, 0])); }
  } else if (kind === 2) {
    for (let i = 0; i < 5; i++) { const blade = flatLeaf("白及纵褶阔披针叶", [0, 0, 0], [(i - 2) * 0.08, 0.35 + i % 2 * 0.1, 0.06], 0.07); parts.push(blade); }
    parts.push(beam("白及独立花葶", stemColor, [0, 0, 0], [0.035, 0.58, 0], 0.006)); for (let i = 0; i < 5; i++) parts.push(...orchid([0.035 + i % 2 * 0.03, 0.38 + i * 0.035, 0.025], 0.036, "normal"));
  } else if (kind === 3) {
    for (let cane = 0; cane < 4; cane++) { const x = (cane - 1.5) * 0.055; parts.push(tapered("铁皮石斛分节的肉质茎", stemColor, [[x, 0, 0], [x + 0.018, 0.42 + cane % 2 * 0.08, 0]], [0.009, 0.005])); for (let i = 0; i < 7; i++) parts.push(cap("石斛明显的环状茎节", pale, [x, 0.025 + i * 0.055, 0], 0.009, 0.005, 2)); for (let i = 0; i < 4; i++) parts.push(leaf("石斛两列厚披针叶", green, [x, 0.2 + i * 0.045, 0], 0.022, 0.07, [60, i % 2 ? 90 : -90, 0])); if (cane % 2 === 0) for (let i = 0; i < 3; i++) parts.push(...orchid([x + 0.025, 0.18 + i * 0.07, 0.02], 0.026, "normal")); }
  } else if (kind === 4 || kind === 6) {
    const prunella = kind === 6; parts.push(beam(prunella ? "夏枯草短方形茎" : "益母草直立四棱茎", stemColor, [0, 0, 0], [0, prunella ? 0.4 : 0.95, 0], prunella ? 0.005 : 0.009));
    for (let row = 0; row < 6; row++) for (const side of [-1, 1]) { const y = 0.04 + row * (prunella ? 0.045 : 0.13); parts.push(flatLeaf(prunella ? "夏枯草对生卵叶" : "益母草深掌裂叶", [0, y, 0], [side * (prunella ? 0.07 : 0.19), y + 0.02, 0.02], prunella ? 0.035 : 0.1, prunella ? "oval" : "palm")); }
    for (let row = 0; row < (prunella ? 6 : 4); row++) { const y = prunella ? 0.29 + row * 0.018 : 0.4 + row * 0.13; parts.push(radialLeaves(prunella ? 4 : 6, [0, y, 0], prunella ? 0.022 : 0.012, prunella ? 0.033 : 0.025, 75, pale)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const flower = cap("密生轮伞序的二唇筒花", bloom, [Math.cos(a) * 0.012, y + 0.009, Math.sin(a) * 0.012], 0.006, 0.018, 3); flower.rotation.z = -75; parts.push(flower); } }
  } else if (kind === 5) {
    parts.push(tapered("艾草多分枝主轴", stemColor, [[0, 0, 0], [0, 0.95, 0]], [0.01, 0.003]));
    for (let i = 0; i < 12; i++) { const a = i * 2.4; const root: Triple = [0, 0.05 + i * 0.055, 0]; const blade = flatLeaf("艾草深羽裂而背面浅色的叶", root, [Math.cos(a) * 0.18, root[1] + 0.03, Math.sin(a) * 0.18], 0.09, "lobed"); blade.color = i % 2 ? green : "#bac3a7"; parts.push(blade); }
    for (let branch = 0; branch < 7; branch++) { const a = branch * 2.4; const p: Triple = [Math.cos(a) * 0.13, 0.72 + branch * 0.025, Math.sin(a) * 0.13]; parts.push(beam("顶生圆锥花序小枝", stemColor, [0, 0.65, 0], p, 0.002)); const flowers: ModelPart[] = []; for (let i = 0; i < 8; i++) flowers.push(lobe("细小卵形头状花序", pale, [p[0], p[1] + i * 0.012, p[2] + i % 2 * 0.012], [0.009, 0.012, 0.009])); parts.push(combineMeshes("一段完整艾草小花序", pale, flowers)); }
  } else if (kind === 7) {
    parts.push(beam("黄芪直立分枝秆", stemColor, [0, 0, 0], [0, 0.8, 0], 0.008));
    for (let i = 0; i < 8; i++) parts.push(pinnate([0, 0.08 + i * 0.08, 0], i * 137.5 % 360, 0.24, 6));
    for (let axis = 0; axis < 3; axis++) { const x = (axis - 1) * 0.09; parts.push(beam("叶腋伸出的黄芪总状花序", green, [0, 0.4, 0], [x, 0.78, 0.04], 0.003)); for (let i = 0; i < 8; i++) parts.push(cap("黄芪偏向一侧的蝶形花旗瓣", "#d5d0a9", [x + 0.015, 0.5 + i * 0.028, 0.04], 0.01, 0.02, 3)); }
  } else if (kind === 8 || kind === 28 || kind === 29) {
    const trumpet = kind === 29, honeysuckle = kind === 28;
    parts.push(tapered("缠绕攀援的细主藤", stemColor, [[0, 0, 0], [-0.05, 0.5, 0], [0.03, 1.0, 0], [0.3, 0.85, 0]], [0.007, 0.005, 0.003, 0.0015]));
    for (let i = 0; i < 8; i++) { const y = 0.08 + i * 0.1; for (const side of [-1, 1]) parts.push(flatLeaf(trumpet ? "牵牛心形裂叶" : honeysuckle ? "金银花对生卵叶" : "党参对生心形叶", [0, y, 0], [side * 0.13, y + 0.04, 0.05], 0.08, honeysuckle ? "oval" : "heart")); }
    for (let i = 0; i < 6; i++) { const p: Triple = [i % 2 ? 0.11 : -0.07, 0.4 + i * 0.09, 0.06];
      if (honeysuckle) for (const side of [-1, 1]) { const q: Triple = [p[0] + side * 0.012, p[1], p[2]]; parts.push(tapered("金银花成对细长弯管", bloom, [q, [q[0] + side * 0.012, q[1] + 0.045, q[2]], [q[0] + side * 0.025, q[1] + 0.06, q[2] + 0.01]], [0.003, 0.004, 0.005]), leaf("上唇四裂片的共同长瓣", bloom, [q[0] + side * 0.025, q[1] + 0.06, q[2] + 0.01], 0.015, 0.035, [45, side * 70, 0]), leaf("反向下唇单瓣", pale, [q[0] + side * 0.025, q[1] + 0.06, q[2] + 0.01], 0.008, 0.03, [110, -side * 60, 0])); }
      else { const flower = cap(trumpet ? "牵牛完整合瓣喇叭花冠" : "党参悬垂的宽大钟形花", trumpet ? "#c7c1b9" : "#c4c8a6", p, trumpet ? 0.05 : 0.027, trumpet ? 0.065 : 0.06, 3); flower.rotation.z = trumpet ? -70 : 180; parts.push(flower); }
    }
  } else if (kind === 9) {
    for (let i = 0; i < 4; i++) { const x = (i - 1.5) * 0.045; const p: Triple = [x, 0.28 + i % 2 * 0.05, 0]; parts.push(beam("半夏细长叶柄", green, [0, 0, 0], p, 0.004)); for (let j = -1; j <= 1; j++) parts.push(leaf("半夏三出披针小叶", green, p, 0.035, 0.12, [65, j * 70 + i * 90, 0])); }
    parts.push(beam("半夏独立花葶", stemColor, [0, 0, 0], [0.04, 0.35, 0], 0.004), cap("半夏狭窄带兜的佛焰苞", pale, [0.04, 0.3, 0], 0.018, 0.1, 3), tapered("肉穗花序伸出的极长鞭状附属物", "#bcc1a2", [[0.04, 0.35, 0], [0.05, 0.55, 0], [0.11, 0.64, 0.025], [0.17, 0.6, 0.04]], [0.0035, 0.002, 0.0012, 0.0005]));
  } else if (kind === 10 || kind === 11) {
    const lasia = kind === 11;
    parts.push(cap("自立观叶植物短茎", stemColor, [0, 0, 0], 0.07, 0.13, 4));
    for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7; const p: Triple = [Math.cos(a) * 0.3, 0.55 + i % 2 * 0.15, Math.sin(a) * 0.3]; parts.push(tapered("粗长直立叶柄", stemColor, [[0, 0.05, 0], p], [0.012, 0.008])); const blade = flatLeaf(lasia ? "刺芋深裂箭形叶" : "春羽深羽状分裂大叶", p, [p[0] * 2, p[1] + 0.09, p[2] * 2], lasia ? 0.35 : 0.48, "lobed"); parts.push(blade);
      if (lasia) { const spines: ModelPart[] = []; for (let j = 0; j < 9; j++) { const t = (j + 1) / 10; spines.push(needle("刺芋叶柄朝下的硬刺", pale, [p[0] * t, 0.05 + (p[1] - 0.05) * t, p[2] * t], [p[0] * t + Math.cos(a) * 0.025, 0.03 + (p[1] - 0.05) * t, p[2] * t + Math.sin(a) * 0.025], 0.005)); } parts.push(combineMeshes("单根叶柄完整硬刺", pale, spines)); }
    }
    if (lasia) parts.push(tapered("刺芋细长鞭状花序", "#bcb79e", [[0.03, 0.1, 0], [0.03, 0.5, 0], [0.1, 0.68, 0]], [0.009, 0.007, 0.001]));
  } else if (kind === 12 || kind === 13) {
    const cistanche = kind === 13;
    if (cistanche) { parts.push(tapered("肉苁蓉无绿叶的肉质茎", "#bdb598", [[0, 0, 0], [0, 0.5, 0]], [0.045, 0.025])); for (let i = 0; i < 13; i++) parts.push(leaf("肉质茎叠覆的三角鳞片", "#c9bfa1", [0, 0.015 + i * 0.025, 0], 0.045, 0.065, [18, i * 137.5 % 360, 0])); for (let i = 0; i < 20; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.033, 0.2 + i * 0.015, Math.sin(a) * 0.033]; const flower = cap("密集穗状二唇筒花", "#cfc3b2", p, 0.014, 0.042, 3); flower.rotation.z = -60; parts.push(flower); } }
    else for (let head = 0; head < 4; head++) { const x = (head - 1.5) * 0.045; parts.push(tapered("蛇菰无叶短肉质茎", "#bab399", [[x, 0, 0], [x, 0.15 + head % 2 * 0.06, 0]], [0.02, 0.015]), lobe("蛇菰膨大花序头", "#c4b99d", [x, 0.19 + head % 2 * 0.06, 0], [0.065, 0.105, 0.065])); const florets: ModelPart[] = []; for (let i = 0; i < 24; i++) { const a = i * 2.4; florets.push(lobe("表面众多无花被小花", pale, [x + Math.cos(a) * 0.028, 0.15 + head % 2 * 0.06 + i % 6 * 0.015, Math.sin(a) * 0.028], [0.009, 0.012, 0.009])); } parts.push(combineMeshes("一个蛇菰完整花头", pale, florets)); }
  } else if (kind === 14) {
    for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(tapered("幽灵兰裸露光合根网", green, [[0, 0, 0], [Math.cos(a) * 0.1, 0.18, Math.sin(a) * 0.025], [Math.cos(a + 0.4) * 0.16, 0.35 + i % 3 * 0.05, Math.sin(a) * 0.04]], [0.004, 0.003, 0.001])); }
    parts.push(beam("无叶体伸出的细花柄", stemColor, [0, 0.15, 0], [0.05, 0.4, 0.1], 0.0025), ...orchid([0.05, 0.4, 0.1], 0.055, "ghost"));
  } else if (kind === 15 || kind === 16) {
    const bee = kind === 16;
    for (let i = 0; i < (bee ? 5 : 6); i++) parts.push(leaf(bee ? "蜂兰基生短椭圆叶" : "郁金香兰长褶披针叶", green, [0, 0.005, 0], bee ? 0.04 : 0.09, bee ? 0.17 : 0.48, [20 + i % 3 * 12, i * 137.5 % 360, 0]));
    parts.push(beam("兰科独立花葶", stemColor, [0, 0, 0], [0, bee ? 0.45 : 0.3, 0], 0.005)); if (bee) for (let i = 0; i < 5; i++) parts.push(...orchid([i % 2 ? 0.015 : -0.015, 0.23 + i * 0.04, 0.015], 0.022, "bee")); else parts.push(...orchid([0, 0.3, 0], 0.075, "slipper"));
  } else if (kind === 17) {
    for (let i = 0; i < 6; i++) parts.push(tapered("虎耳兰宽厚平展的舌状肉叶", green, [[0, 0.01 + i * 0.008, 0], [(i % 2 ? 1 : -1) * 0.11, 0.05 + i * 0.01, 0], [(i % 2 ? 1 : -1) * 0.23, 0.06 + i * 0.012, 0.02]], [0.025, 0.043, 0.005]));
    parts.push(beam("虎耳兰粗短花葶", stemColor, [0, 0, 0], [0, 0.27, 0], 0.012), cap("总苞围成的白色刷状花盘", pale, [0, 0.27, 0], 0.065, 0.025, 3)); const filaments: ModelPart[] = []; for (let i = 0; i < 45; i++) { const a = i * 2.4; const r = Math.sqrt(i / 45) * 0.05; const p: Triple = [Math.cos(a) * r, 0.34 + i % 3 * 0.01, Math.sin(a) * r]; filaments.push(needle("白花内长伸雄蕊", "#d8d5bd", [p[0], 0.285, p[2]], p, 0.0015), lobe("长蕊顶端黄色花药", "#ccc69f", p, [0.004, 0.004, 0.004])); } for (let i = 0; i < filaments.length; i += 30) parts.push(combineMeshes("白刷花盘完整花丝花药", "#d8d5bd", filaments.slice(i, i + 30)));
  } else if (kind === 18) {
    parts.push(tapered("地涌金莲粗壮矮假茎", "#b2b99b", [[0, 0, 0], [0, 0.45, 0]], [0.14, 0.09]));
    for (let i = 0; i < 7; i++) parts.push(leaf("矮生蕉类宽大扇叶", green, [0, 0.25, 0], 0.22, 0.85, [38 + i % 2 * 17, i * 360 / 7, 0]));
    for (let layer = 0; layer < 4; layer++) for (let i = 0; i < 6; i++) parts.push(leaf("地面升起金色莲座状大型苞片", "#cfc59e", [0, 0.35 + layer * 0.05, 0], 0.12 - layer * 0.018, 0.25 - layer * 0.035, [55 - layer * 12, i * 60 + layer * 30, 0]));
  } else if (kind === 19 || kind === 20) {
    const turtle = kind === 19;
    parts.push(part(turtle ? "龟甲龙露地龟甲状块茎" : "睡布袋露地膨大纺锤干", "lathe", "#bcb89d", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: turtle ? [{ x: 0.1, y: 0 }, { x: 0.18, y: 0.08 }, { x: 0.16, y: 0.19 }, { x: 0.04, y: 0.27 }] : [{ x: 0.04, y: 0 }, { x: 0.11, y: 0.1 }, { x: 0.1, y: 0.31 }, { x: 0.04, y: 0.46 }] }));
    if (turtle) { const bark: ModelPart[] = []; for (let i = 0; i < 30; i++) { const a = i * 2.4; const y = 0.035 + i % 5 * 0.043; const r = 0.16 * Math.sin((y + 0.025) / 0.3 * Math.PI); bark.push(lobe("龟甲龙独立龟裂木栓块", "#aaa78a", [Math.cos(a) * r, y, Math.sin(a) * r], [0.07, 0.055, 0.05], [0, -a * 180 / Math.PI % 360, 0])); } parts.push(combineMeshes("露地块茎完整龟裂外皮", "#aaa78a", bark)); }
    for (const side of [-1, 1]) { const path: Triple[] = [[0, turtle ? 0.25 : 0.45, 0], [side * 0.06, 0.6, 0], [side * 0.14, 0.86, 0], [side * 0.26, 0.8, 0]]; parts.push(tapered("块茎上生出的攀援细藤", green, path, [0.005, 0.003, 0.002, 0.001])); for (let i = 0; i < 6; i++) parts.push(flatLeaf(turtle ? "龟甲龙心形薄叶" : "睡布袋对生小椭圆叶", [side * i * 0.035, 0.43 + i * 0.065, 0], [side * (0.06 + i * 0.035), 0.45 + i * 0.065, 0.04], turtle ? 0.055 : 0.025, turtle ? "heart" : "oval")); }
  } else if (kind === 21) {
    parts.push(cap("龟甲牡丹中央扁平球茎", stemColor, [0, 0, 0], 0.065, 0.055, 5));
    for (let layer = 0; layer < 3; layer++) for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + layer * 0.35; const c = Math.cos(a), s = Math.sin(a); const r = 0.1 - layer * 0.022; parts.push(polygon("层叠伸出的硬三角状疣突", green, [[c * 0.012 - s * 0.026, s * 0.012 + c * 0.026], [c * r, s * r], [c * 0.012 + s * 0.026, s * 0.012 - c * 0.026]], 0.022 - layer * 0.003, [0, 0.01 + layer * 0.015, 0])); }
    parts.push(petals(10, [0, 0.06, 0], 0.008, 0.03, 65, bloom));
  } else if (kind === 22) {
    parts.push(tapered("文竹细木质主干", stemColor, [[0, 0, 0], [0, 0.65, 0]], [0.006, 0.002]));
    for (let branch = 0; branch < 8; branch++) { const a = branch * 2.4; const root: Triple = [0, 0.1 + branch * 0.06, 0]; const end: Triple = [Math.cos(a) * 0.3, root[1] + 0.1, Math.sin(a) * 0.3]; parts.push(beam("文竹水平展开的细枝", green, root, end, 0.0025)); const cladodes: ModelPart[] = []; for (let row = 0; row < 8; row++) { const t = (row + 1) / 9; const p: Triple = [end[0] * t, root[1] + 0.1 * t, end[2] * t]; for (let i = 0; i < 6; i++) { const b = a + i * Math.PI / 3; cladodes.push(needle("羽毛状成簇针形叶状枝", green, p, [p[0] + Math.cos(b) * 0.04, p[1] + 0.005, p[2] + Math.sin(b) * 0.04], 0.0015)); } } parts.push(combineMeshes("一片完整文竹水平羽枝", green, cladodes)); }
  } else if (kind === 23 || kind === 26) {
    const hosta = kind === 26;
    for (let i = 0; i < 9; i++) { const a = i * 2.4; parts.push(flatLeaf(hosta ? "玉簪卵心形基叶" : "一叶兰长柄革质披针叶", [0, 0, 0], [Math.cos(a) * (hosta ? 0.25 : 0.16), hosta ? 0.28 : 0.55, Math.sin(a) * (hosta ? 0.25 : 0.16)], hosta ? 0.16 : 0.1, hosta ? "heart" : "oval")); }
    if (hosta) { parts.push(beam("玉簪挺出叶丛的花葶", stemColor, [0, 0, 0], [0.015, 0.85, 0], 0.006)); for (let i = 0; i < 14; i++) { const flower = cap("玉簪偏侧着生的细长漏斗花", bloom, [i % 2 ? 0.03 : -0.03, 0.42 + i * 0.028, 0], 0.016, 0.055, 3); flower.rotation.z = i % 2 ? 120 : -120; parts.push(flower); } }
    else for (let i = 0; i < 3; i++) parts.push(cap("一叶兰贴近地面的星状肉质花", "#b6ad9f", [(i - 1) * 0.055, 0.01, 0.04], 0.018, 0.012, 3));
  } else if (kind === 24 || kind === 27) {
    const lycoris = kind === 27; if (!lycoris) for (let i = 0; i < 9; i++) parts.push(leaf("蜘蛛兰宽带形基叶", green, [0, 0.005, 0], 0.04, 0.6, [20 + i % 3 * 15, i * 137.5 % 360, 0]));
    parts.push(beam("石蒜科无叶花葶", stemColor, [0, 0, 0], [0, 0.64, 0], 0.009));
    for (let flower = 0; flower < 7; flower++) { const a = flower * Math.PI * 2 / 7; const p: Triple = [Math.cos(a) * 0.085, 0.65, Math.sin(a) * 0.085]; parts.push(beam("顶生伞形花梗", green, [0, 0.6, 0], p, 0.0025)); if (!lycoris) parts.push(cap("蜘蛛兰连成完整杯膜的副花冠", bloom, p, 0.023, 0.027, 3)); const filaments: ModelPart[] = []; for (let i = 0; i < 6; i++) { const b = i * Math.PI / 3; filaments.push(tapered(lycoris ? "向后强烈反卷的细花被片" : "蜘蛛兰细长星芒花被", bloom, [p, [p[0] + Math.cos(b) * 0.06, p[1] + (lycoris ? 0.03 : 0.005), p[2] + Math.sin(b) * 0.06], [p[0] + Math.cos(b) * (lycoris ? 0.035 : 0.1), p[1] + (lycoris ? -0.02 : 0), p[2] + Math.sin(b) * (lycoris ? 0.035 : 0.1)]], [0.002, 0.004, 0.0006])); if (lycoris) filaments.push(needle("长伸于花冠外的雄蕊", "#d8cdb3", p, [p[0] + Math.cos(b) * 0.09, p[1] + 0.09, p[2] + Math.sin(b) * 0.09], 0.0012)); } parts.push(combineMeshes("一朵完整石蒜科花", bloom, filaments)); }
  } else {
    parts.push(tapered("嘉兰攀援的柔弱直茎", stemColor, [[0, 0, 0], [0.02, 0.7, 0], [0, 1.1, 0]], [0.006, 0.003, 0.0015]));
    for (let row = 0; row < 6; row++) for (const side of [-1, 1]) { const p: Triple = [side * 0.13, 0.12 + row * 0.12, 0]; parts.push(flatLeaf("嘉兰披针形叶", [0, p[1], 0], p, 0.03), tapered("叶尖延伸的抓握卷须", green, [p, [p[0] + side * 0.045, p[1] + 0.02, 0], [p[0] + side * 0.03, p[1] + 0.05, 0.025], [p[0], p[1] + 0.04, 0.03]], [0.0015, 0.001, 0.0007, 0.0004])); }
    for (let flower = 0; flower < 3; flower++) { const root: Triple = [(flower - 1) * 0.11, 0.85 + flower * 0.09, 0.04]; parts.push(beam("嘉兰长伸花梗", stemColor, [0, root[1] - 0.1, 0], root, 0.002)); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; parts.push(tapered("嘉兰向上反折的长波缘花被", "#cdbd9e", [root, [root[0] + Math.cos(a) * 0.08, root[1] - 0.015, root[2] + Math.sin(a) * 0.08], [root[0] + Math.cos(a) * 0.06, root[1] + 0.11, root[2] + Math.sin(a) * 0.06]], [0.003, 0.012, 0.001]), needle("嘉兰下方水平长雄蕊", pale, root, [root[0] + Math.cos(a) * 0.1, root[1] - 0.02, root[2] + Math.sin(a) * 0.1], 0.0015)); } }
  }
  return parts;
}

const names = [["parisPlant", "重楼"], ["gastrodia", "天麻"], ["bletilla", "白及"], ["dendrobium", "铁皮石斛"], ["motherwort", "益母草"], ["mugwort", "艾草"], ["prunella", "夏枯草"], ["astragalus", "黄芪"], ["codonopsis", "党参"], ["pinellia", "半夏"], ["splitLeafPhilodendron", "春羽"], ["lasia", "刺芋"], ["balanophora", "蛇菰"], ["cistanche", "肉苁蓉"], ["ghostOrchid", "幽灵兰"], ["anguloa", "郁金香兰"], ["beeOrchid", "蜂兰"], ["haemanthus", "虎耳兰"], ["musella", "地涌金莲"], ["turtleCaudex", "龟甲龙"], ["fockea", "睡布袋"], ["ariocarpus", "龟甲牡丹"], ["asparagusFern", "文竹"], ["aspidistra", "一叶兰"], ["spiderLily", "蜘蛛兰"], ["gloriosa", "嘉兰"], ["hosta", "玉簪"], ["lycoris", "石蒜"], ["honeysuckle", "金银花"], ["morningGlory", "牵牛"]];

export const showcasePlantDesigns: MasterNatureDesign[] = names.map(([key, name], index) => design(key!, name!, "植物", () => plant(index), ["可辨花叶与生长结构的植物"]));
