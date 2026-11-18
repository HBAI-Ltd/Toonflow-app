import { basalLeaves, beam, cap, combineMeshes, design, leaf, lobe, needle, part, petals, radialLeaves, tapered, tube } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";

function pinnate(root: Triple, direction: number, length: number): ModelPart {
  const a = direction * Math.PI / 180;
  const path: Triple[] = Array.from({ length: 8 }, (_, index) => { const t = index / 7; return [root[0] + Math.cos(a) * length * t, root[1] + Math.sin(t * Math.PI) * length * 0.2, root[2] + Math.sin(a) * length * t]; });
  const stalk = tapered("完整羽叶弧形叶轴", "#76915d", path, path.map((_, index) => 0.008 * (1 - index / 9)));
  return combineMeshes("羽状复叶", "#76915d", [stalk, ...Array.from({ length: 12 }, (_, index) => { const side = index % 2 ? 1 : -1; const t = (Math.floor(index / 2) + 1) / 7; return leaf("复叶小叶", "#76915d", [root[0] + Math.cos(a) * length * t, root[1] + Math.sin(t * Math.PI) * length * 0.2, root[2] + Math.sin(a) * length * t], length * 0.12, length * 0.34, [65, 90 - direction - side * 65, 0], "YXZ"); })]);
}

function tree(kind: number): ModelPart[] {
  const parts: ModelPart[] = [];
  if (kind === 0) {
    parts.push(beam("老松主干", "#867353", [0, 0, 0], [0.15, 4, 0], 0.25));
    for (let index = 0; index < 6; index++) { const a = index * 2.4; const end: Triple = [Math.cos(a) * 1.3, 1.7 + index * 0.4, Math.sin(a) * 1.3]; parts.push(beam("松树水平枝", "#867353", [0, end[1] - 0.15, 0], end, 0.075), combineMeshes("松针伞簇", "#6c8b60", Array.from({ length: 9 }, (_, ray) => needle("长松针", "#6c8b60", end, [end[0] + Math.cos(ray * Math.PI * 2 / 9) * 0.6, end[1] + 0.18, end[2] + Math.sin(ray * Math.PI * 2 / 9) * 0.6], 0.12)))); }
  } else if (kind === 1) {
    parts.push(beam("云杉直干", "#8a7456", [0, 0, 0], [0, 5.2, 0], 0.22));
    for (let layer = 0; layer < 7; layer++) { const y = 1 + layer * 0.57; const r = 1.8 - layer * 0.2; parts.push(cap("云杉轮生枝层", "#5e825a", [0, y, 0], r, 0.95, 1)); }
  } else if (kind === 2) {
    parts.push(beam("柏树主干", "#857557", [0, 0, 0], [0, 4.1, 0], 0.2));
    for (let index = 0; index < 10; index++) { const a = index * 2.4; const y = 0.8 + index * 0.32; parts.push(leaf("柏树鳞叶扁枝", "#64855f", [0, y, 0], 0.65, 1.1 - index * 0.035, [15, 90 - a * 180 / Math.PI, 0], "YXZ"), lobe("紧密叶簇", "#6e8a60", [Math.cos(a) * 0.35, y, Math.sin(a) * 0.35], [0.7, 0.8, 0.6])); }
  } else if (kind === 3) {
    parts.push(beam("银杏干", "#93836a", [0, 0, 0], [0, 3.5, 0], 0.22));
    for (let index = 0; index < 7; index++) { const a = index * 2.4; const end: Triple = [Math.cos(a), 1.8 + index * 0.22, Math.sin(a)]; parts.push(beam("银杏斜枝", "#93836a", [0, 1.4, 0], end, 0.065), combineMeshes("银杏扇形叶簇", "#a9b077", Array.from({ length: 5 }, (_, fan) => leaf("扇叶裂片", "#a9b077", end, 0.38, 0.5, [55, 90 - a * 180 / Math.PI + 50 - fan * 25, 0], "YXZ")))); }
  } else if (kind === 4) {
    parts.push(beam("柳树主干", "#8b7959", [0, 0, 0], [0, 3.8, 0], 0.25));
    for (let index = 0; index < 8; index++) { const a = index * Math.PI / 4; const end: Triple = [Math.cos(a) * 1.4, 3.25, Math.sin(a) * 1.4]; parts.push(beam("拱形柳枝", "#8b7959", [0, 2.4, 0], end, 0.06), tube("下垂细柳条", "#8a986b", [end, [end[0] * 1.05, 2.3, end[2] * 1.05], [end[0] * 1.12, 1.15, end[2] * 1.12]], 0.018), combineMeshes("垂条披针叶", "#8ca16b", Array.from({ length: 8 }, (_, node) => leaf("柳叶", "#8ca16b", [end[0] * 1.08, 1.3 + node * 0.23, end[2] * 1.08], 0.1, 0.32, [145, 90 - index * 45 - node % 2 * 80, 0], "YXZ")))); }
  } else if (kind === 5 || kind === 11) {
    parts.push(beam(kind === 5 ? "榕树主干" : "红树主干", "#887758", [0, 0.4, 0], [0, 3.1, 0], 0.3));
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; const end: Triple = [Math.cos(a) * 1.1, kind === 5 ? 2.8 : 2.2, Math.sin(a) * 1.1]; parts.push(beam("伸展树枝", "#887758", [0, 2, 0], end, 0.09), lobe("宽阔叶冠", "#779266", end, [1.6, 0.65, 1.4])); if (kind === 5) parts.push(tube("落地气生根", "#978365", [end, [end[0] * 0.92, 1.3, end[2]], [end[0], 0, end[2]]], 0.045)); else parts.push(beam("拱形支柱根", "#978365", [0, 1.1, 0], [Math.cos(a) * 1.15, 0, Math.sin(a) * 1.15], 0.08)); }
    if (kind === 11) for (let index = 0; index < 8; index++) parts.push(needle("直立呼吸根", "#998768", [Math.cos(index * 2.4) * 0.9, 0, Math.sin(index * 2.4) * 0.9], [Math.cos(index * 2.4) * 0.9, 0.3, Math.sin(index * 2.4) * 0.9], 0.07));
  } else if (kind === 6) {
    for (const side of [-1, 1]) { parts.push(beam("白桦分生白干", "#d0cdb6", [side * 0.15, 0, 0], [side * 0.45, 4, 0], 0.16)); for (let scar = 0; scar < 7; scar++) parts.push(part("黑色树皮横斑", "box", "#7b7e68", [side * (0.16 + scar * 0.04), 0.4 + scar * 0.45, 0.077], [0.13, 0.035, 0.012])); }
    for (let index = 0; index < 7; index++) { const a = index * 2.4; const p: Triple = [Math.cos(a), 2.2 + index * 0.2, Math.sin(a)]; parts.push(beam("白桦小枝", "#a7a58b", [0, 2, 0], p, 0.045), lobe("锯齿叶簇", "#91a36e", p, [1.1, 0.55, 0.9])); }
  } else if (kind === 7) {
    parts.push(part("猴面包树桶干", "lathe", "#9d9579", [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: 0.85, y: 0 }, { x: 0.95, y: 1.4 }, { x: 0.6, y: 2.5 }, { x: 0.35, y: 3.1 }, { x: 0, y: 3.1 }] }));
    for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; const end: Triple = [Math.cos(a) * 1.35, 4 + index % 2 * 0.4, Math.sin(a) * 1.35]; parts.push(beam("粗大叉枝", "#9d9579", [0, 2.7, 0], end, 0.23), lobe("稀疏复叶冠", "#8d9e6f", end, [1.35, 0.5, 1.1]), lobe("下垂木质果", "#a69c76", [end[0], end[1] - 0.3, end[2]], [0.16, 0.45, 0.16])); }
  } else if (kind === 8 || kind === 9) {
    parts.push(tube("棕榈弯曲干", "#a08b66", [[0, 0, 0], [0.15, 1.8, 0], [0.45, 3.4, 0]], 0.16));
    for (let index = 0; index < 7; index++) { const a = index * Math.PI * 2 / 7; const root: Triple = [0.45, 3.4, 0]; const end: Triple = [0.45 + Math.cos(a), 3.65, Math.sin(a)]; parts.push(beam("长叶柄", "#9b9c6d", root, end, 0.045)); if (kind === 8) parts.push(combineMeshes("掌状扇叶", "#7b955f", Array.from({ length: 9 }, (_, blade) => leaf("扇叶裂片", "#7b955f", end, 0.18, 0.75, [65, 90 - index * 360 / 7 + 70 - blade * 17.5, 0], "YXZ")))); else parts.push(pinnate(root, index * 360 / 7, 1.8)); }
    if (kind === 9) for (const side of [-1, 0, 1]) parts.push(lobe("椰果", "#9f946c", [0.45 + side * 0.18, 3.15, 0.1], [0.28, 0.35, 0.28]));
  } else if (kind === 10) {
    parts.push(beam("龙血树主干", "#94866b", [0, 0, 0], [0, 2.1, 0], 0.3));
    for (let index = 0; index < 5; index++) { const a = index * Math.PI * 2 / 5; const end: Triple = [Math.cos(a), 3.1, Math.sin(a)]; parts.push(beam("二歧分叉龙血枝", "#94866b", [0, 1.8, 0], end, 0.13), radialLeaves(10, end, 0.11, 0.85, 45)); }
  } else if (kind === 12) {
    parts.push(beam("露兜树干", "#9b8b67", [0, 0.4, 0], [0, 2.3, 0], 0.2)); for (let root = 0; root < 5; root++) { const a = root * Math.PI * 2 / 5; parts.push(beam("露兜支柱根", "#a28e68", [0, 1.15, 0], [Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85], 0.075)); }
    for (let layer = 0; layer < 3; layer++) parts.push(radialLeaves(7, [0, 1.8 + layer * 0.2, 0], 0.16, 1.5 - layer * 0.15, 35 + layer * 15));
  } else {
    parts.push(beam("桉树斜干", "#bbb6a0", [0, 0, 0], [0.35, 4.3, 0], 0.22)); for (let index = 0; index < 7; index++) { const a = index * 2.4; const end: Triple = [0.2 + Math.cos(a) * 1.15, 2.4 + index * 0.23, Math.sin(a) * 1.15]; parts.push(beam("桉树垂枝", "#aaa68d", [0.2, 2, 0], end, 0.05), combineMeshes("镰形下垂叶簇", "#9baa84", Array.from({ length: 6 }, (_, blade) => leaf("桉叶", "#9baa84", end, 0.12, 0.7, [135, blade * 60, blade * 8])))); }
  }
  return parts;
}

function herb(kind: number): ModelPart[] {
  const green = "#829d68"; const parts: ModelPart[] = [];
  if (kind === 0) { for (const [x, h] of [[-0.22, 2.5], [0.15, 3], [0.35, 2.2]]) { parts.push(part("中空竹秆", "cylinder", "#9fab75", [x!, h! / 2, 0], [0.06, h!, 0.06])); for (let node = 1; node < 8; node++) parts.push(part("竹节", "cylinder", "#879961", [x!, node * h! / 8, 0], [0.072, 0.025, 0.072])); parts.push(pinnate([x!, h! * 0.7, 0], x! * 200, 0.7)); } }
  else if (kind === 1) { parts.push(lobe("芭蕉假茎", "#a4ad7b", [0, 0.9, 0], [0.25, 1.8, 0.25])); for (let index = 0; index < 6; index++) { const a = index * Math.PI / 3; const end: Triple = [Math.cos(a) * 0.7, 1.8 + index % 2 * 0.2, Math.sin(a) * 0.7]; parts.push(beam("芭蕉叶柄", green, [0, 1.5, 0], end, 0.035), leaf("大幅芭蕉叶", green, end, 0.55, 1.4, [60, 90 - index * 60, 0], "YXZ")); } }
  else if (kind === 2) { parts.push(tube("攀援龟背竹茎", "#87976b", [[0, 0, 0], [0.1, 0.5, 0], [-0.1, 1, 0]], 0.035)); for (let index = 0; index < 4; index++) { const a = index * Math.PI / 2; const end: Triple = [Math.cos(a) * 0.4, 0.35 + index * 0.2, Math.sin(a) * 0.4]; parts.push(beam("长叶柄", green, [0, end[1] - 0.15, 0], end, 0.02), combineMeshes("深裂龟背叶", green, Array.from({ length: 7 }, (_, lobeIndex) => leaf("叶裂片", green, [end[0], end[1] + lobeIndex * 0.045, end[2]], 0.14, 0.4 - Math.abs(lobeIndex - 3) * 0.055, [55, -index * 90 + (lobeIndex % 2 ? 65 : -65), 0])))); } }
  else if (kind === 3 || kind === 4) { parts.push(radialLeaves(kind === 3 ? 11 : 14, [0, 0, 0], kind === 3 ? 0.12 : 0.18, kind === 3 ? 0.65 : 1.2, kind === 3 ? 35 : 45)); if (kind === 3) { parts.push(beam("芦荟花葶", "#a3a273", [0, 0.1, 0], [0, 0.95, 0], 0.016)); for (let i = 0; i < 9; i++) parts.push(cap("下垂芦荟筒花", "#c3a18c", [Math.sin(i * 2.4) * 0.055, 0.72 + i * 0.025, Math.cos(i * 2.4) * 0.055], 0.02, 0.06, 4)); } else { parts.push(beam("龙舌兰高花序", "#b1ab7c", [0, 0, 0], [0, 2.8, 0], 0.04)); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; const p: Triple = [Math.cos(a) * 0.4, 1.9 + i * 0.13, Math.sin(a) * 0.4]; parts.push(beam("花序分枝", "#b1ab7c", [0, p[1] - 0.15, 0], p, 0.018), petals(5, p, 0.06, 0.12, 60, "#d0c69e")); } } }
  else if (kind === 5) { parts.push(part("巨人柱主茎", "cylinder", "#87a275", [0, 1.25, 0], [0.36, 2.5, 0.36])); for (const side of [-1, 1]) parts.push(tube("上举仙人掌臂", "#87a275", [[0, 0.8 + side * 0.1, 0], [side * 0.55, 0.9 + side * 0.1, 0], [side * 0.55, 1.7 + side * 0.2, 0]], 0.12)); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; parts.push(beam("纵向肋线", "#a4b083", [Math.cos(a) * 0.18, 0.05, Math.sin(a) * 0.18], [Math.cos(a) * 0.18, 2.45, Math.sin(a) * 0.18], 0.025)); } }
  else if (kind === 6) { const pads: Triple[] = [[0, 0.3, 0], [-0.2, 0.7, 0], [0.21, 0.65, 0], [-0.33, 1.05, 0]]; for (const p of pads) parts.push(lobe("扁平掌状茎节", "#8fa77c", p, [0.42, 0.6, 0.13])); for (let i = 0; i < 12; i++) parts.push(needle("刺座长刺", "#c7bf95", [(i % 4 - 1.5) * 0.12, 0.15 + Math.floor(i / 4) * 0.3, 0.065], [(i % 4 - 1.5) * 0.12, 0.18 + Math.floor(i / 4) * 0.3, 0.12], 0.012)); }
  else if (kind === 7) { parts.push(lobe("金琥球茎", "#94a879", [0, 0.25, 0], [0.55, 0.5, 0.55])); for (let i = 0; i < 24; i++) { const a = i * 2.4; const y = 0.07 + i % 4 * 0.11; const r = Math.sqrt(Math.max(0.01, 0.25 ** 2 - (y - 0.25) ** 2)); parts.push(needle("放射硬刺", "#cbbd8c", [Math.cos(a) * r, y, Math.sin(a) * r], [Math.cos(a) * (r + 0.07), y + 0.025, Math.sin(a) * (r + 0.07)], 0.012)); } }
  else if (kind === 8) parts.push(lobe("生石花左叶", "#aaa98c", [-0.016, 0.017, 0], [0.033, 0.037, 0.045]), lobe("生石花右叶", "#aaa98c", [0.016, 0.017, 0], [0.033, 0.037, 0.045]), petals(12, [0, 0.04, 0], 0.009, 0.03, 65, "#d5cda8"));
  else if (kind === 9) { parts.push(...basalLeaves(5, 0.12)); for (const side of [-1, 1]) { const p: Triple = [side * 0.07, 0.08, 0]; parts.push(beam("捕虫夹叶柄", green, [0, 0, 0], p, 0.007), leaf("夹叶左瓣", "#9ca177", p, 0.055, 0.07, [35, side * 90, -25]), leaf("夹叶右瓣", "#9ca177", p, 0.055, 0.07, [35, side * 90, 25])); for (let tooth = 0; tooth < 6; tooth++) parts.push(needle("夹叶缘齿", "#b7b58e", [p[0] + (tooth - 2.5) * 0.009, 0.12, 0.025], [p[0] + (tooth - 2.5) * 0.009, 0.143, 0.018], 0.003)); } }
  else if (kind === 10) { parts.push(beam("猪笼草藤茎", green, [0, 0, 0], [0, 0.55, 0], 0.015)); for (const side of [-1, 1]) { parts.push(leaf("猪笼草叶", green, [0, 0.35, 0], 0.09, 0.25, [65, side * 90, 0]), tube("笼蔓", "#9fa878", [[side * 0.2, 0.4, 0], [side * 0.27, 0.2, 0], [side * 0.24, 0.12, 0]], 0.004), cap("带唇捕虫笼", "#b2a083", [side * 0.24, 0.02, 0], 0.055, 0.18, 3), leaf("捕虫笼盖", "#9d9f73", [side * 0.24, 0.21, -0.03], 0.09, 0.07, [75, 0, 0])); } }
  else if (kind === 11) {
    parts.push(beam("含羞草细主茎", "#92a273", [0, 0, 0], [0, 0.22, 0], 0.006));
    for (const side of [-1, 1]) for (const end of [-1, 1]) { const p: Triple = [side * 0.11, 0.17, end * 0.05]; parts.push(beam("双回羽状叶轴", "#92a273", [0, 0.17, 0], p, 0.004), pinnate(p, end > 0 ? 20 : 160, 0.17)); }
    parts.push(lobe("绒球花序", "#c6aeb4", [0, 0.25, 0], [0.035, 0.035, 0.035]));
  } else if (kind === 12 || kind === 13) { for (let frond = 0; frond < 5; frond++) { const a = frond * Math.PI * 2 / 5; const p: Triple = [Math.cos(a) * 0.12, 0.1, Math.sin(a) * 0.12]; parts.push(beam("复叶叶柄", "#92a273", [0, 0, 0], p, 0.006)); if (kind === 12) parts.push(pinnate(p, frond * 72, 0.75)); else for (let leaflet = 0; leaflet < 4; leaflet++) { const q: Triple = [Math.cos(a) * (0.2 + leaflet * 0.1), 0.25 + leaflet * 0.06, Math.sin(a) * (0.2 + leaflet * 0.1)]; parts.push(beam("铁线叶轴", "#64765b", p, q, 0.003), petals(3, q, 0.04, 0.07, 75, green)); } } }
  else if (kind === 14) { for (let i = 0; i < 7; i++) { const a = i * 2.4; parts.push(lobe("浮萍叶状体", "#99b17a", [Math.cos(a) * 0.022, 0.004, Math.sin(a) * 0.022], [0.018, 0.005, 0.014]), beam("浮萍须根", "#a4a27a", [Math.cos(a) * 0.022, 0, Math.sin(a) * 0.022], [Math.cos(a) * 0.02, -0.04, Math.sin(a) * 0.02], 0.001)); } }
  else if (kind === 15 || kind === 16) { const height = kind === 16 ? 0.9 : 0.15; parts.push(part("荷科花茎", "cylinder", green, [0, height / 2, 0], [0.018, height, 0.018]), petals(kind === 16 ? 12 : 16, [0, height, 0], kind === 16 ? 0.12 : 0.08, 0.2, kind === 16 ? 45 : 70, "#cdb4ae"), part("花心", "cylinder", "#c4bb83", [0, height + 0.05, 0], [0.07, 0.04, 0.07])); for (const side of [-1, 1]) parts.push(part("宽圆水叶", "cylinder", "#829d68", [side * 0.28, kind === 16 ? 0.5 : 0.02, 0], [0.46, 0.012, 0.46]), beam("独立叶茎", green, [side * 0.28, 0, 0], [side * 0.28, kind === 16 ? 0.5 : 0.02, 0], 0.013)); }
  else if (kind === 17) { parts.push(...basalLeaves(7, 0.22), beam("蒲公英花葶", green, [0, 0, 0], [0, 0.35, 0], 0.006)); for (let i = 0; i < 24; i++) { const a = i * 2.4; const y = Math.cos(i / 23 * Math.PI) * 0.07; const r = Math.sqrt(0.07 ** 2 - y ** 2); parts.push(needle("绒毛冠毛伞", "#d3d3b7", [0, 0.35, 0], [Math.cos(a) * r, 0.35 + y, Math.sin(a) * r], 0.007)); } }
  else if (kind === 18) { parts.push(beam("向日葵粗茎", green, [0, 0, 0], [0, 1.45, 0], 0.03), leaf("心形茎叶", green, [0, 0.65, 0], 0.3, 0.4, [55, 90, 0]), part("大花盘", "cylinder", "#9f9664", [0, 1.45, 0], [0.34, 0.06, 0.34], [90, 0, 0])); for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14; parts.push(leaf("舌状花瓣", "#d1be85", [Math.cos(a) * 0.15, 1.45 + Math.sin(a) * 0.15, 0.035], 0.07, 0.18, [0, 0, -i * 360 / 14 - 90])); } }
  else if (kind >= 19 && kind <= 27) {
    const h = kind === 19 ? 0.65 : kind === 20 ? 0.45 : kind === 21 ? 0.55 : kind === 22 ? 0.85 : kind === 23 ? 0.6 : kind === 24 ? 1.1 : kind === 25 ? 0.7 : kind === 26 ? 0.45 : 0.65;
    parts.push(beam("独立花茎", green, [0, 0, 0], [0, h, 0], 0.012), leaf("花茎叶", green, [0, h * 0.45, 0], 0.12, 0.28, [45, 80, 0]));
    if (kind === 19) for (let layer = 0; layer < 3; layer++) parts.push(petals(5 + layer * 2, [0, h + layer * 0.025, 0], 0.09 - layer * 0.02, 0.13 - layer * 0.025, 35 + layer * 15, "#c4a0a2"));
    else if (kind === 20) { parts.push(cap("郁金香封闭杯冠", "#c5af9b", [0, h, 0], 0.075, 0.16, 4), ...basalLeaves(3, 0.4)); }
    else if (kind === 21) { parts.push(petals(3, [0, h, 0], 0.08, 0.15, 75, "#bba9bc"), petals(2, [0, h, 0.04], 0.08, 0.11, 45, "#c8b3bf"), leaf("兰花唇瓣", "#d1beb8", [0, h - 0.035, 0.08], 0.1, 0.12, [90, 0, 180])); }
    else if (kind === 22) { parts.push(petals(6, [0, h, 0], 0.08, 0.22, 60, "#d4c9b1")); for (let i = 0; i < 6; i++) parts.push(needle("百合外伸雄蕊", "#b9ad80", [0, h, 0], [Math.cos(i) * 0.045, h + 0.18, Math.sin(i) * 0.045], 0.006)); }
    else if (kind === 23) parts.push(cap("马蹄莲佛焰苞", "#d8d2bb", [0, h - 0.03, 0], 0.1, 0.25, 3), needle("肉穗花序", "#c8b87e", [0, h, 0], [0.01, h + 0.22, 0], 0.026));
    else if (kind === 24) { parts.push(leaf("水平舟形苞", "#9aa17b", [0, h, 0], 0.09, 0.32, [90, 90, 0])); for (let i = 0; i < 4; i++) parts.push(needle("鸟形花萼", "#c1a77c", [i * 0.035, h, 0], [i * 0.035 + 0.06, h + 0.23 - i * 0.025, 0], 0.055)); }
    else if (kind === 25) for (let i = 0; i < 10; i++) { const a = i * 2.4; parts.push(petals(4, [Math.cos(a) * 0.1, h + Math.sin(i) * 0.08, Math.sin(a) * 0.1], 0.04, 0.055, 70, "#b2adc0")); }
    else if (kind === 26) { for (let layer = 0; layer < 2; layer++) parts.push(petals(12, [0, h + layer * 0.018, 0], 0.035, 0.13 - layer * 0.025, 75 - layer * 20, "#c8bf9b")); parts.push(lobe("菊花管状花心", "#b4a56f", [0, h + 0.02, 0], [0.05, 0.04, 0.05])); }
    else for (let i = 0; i < 8; i++) parts.push(petals(4, [0, h - 0.22 + i * 0.035, 0], 0.025, 0.035, 70, "#aaa1b6"));
  } else if (kind === 28) { parts.push(beam("棉花木质茎", "#9d946b", [0, 0, 0], [0, 0.8, 0], 0.02)); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.25, 0.4 + i * 0.1, Math.sin(a) * 0.25]; parts.push(beam("棉枝", "#9d946b", [0, p[1] - 0.1, 0], p, 0.012), petals(4, p, 0.06, 0.08, 70, "#a09369"), lobe("绽开棉絮", "#d9d8c3", [p[0], p[1] + 0.035, p[2]], [0.13, 0.12, 0.13])); } }
  else if (kind === 29) parts.push(beam("蒲草花葶", green, [0, 0, 0], [0, 1.1, 0], 0.012), part("香蒲柱状花穗", "cylinder", "#9c8c66", [0, 1.05, 0], [0.065, 0.3, 0.065]), ...basalLeaves(5, 0.9));
  else if (kind === 30) { parts.push(beam("芦苇秆", "#a4a371", [0, 0, 0], [0, 1.8, 0], 0.015)); for (let i = 0; i < 7; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.18, 1.55 + i * 0.04, Math.sin(a) * 0.18]; parts.push(beam("芦苇穗枝", "#b8af83", [0, 1.5, 0], p, 0.005), lobe("羽绒穗", "#c6bea0", p, [0.11, 0.25, 0.1])); } }
  else if (kind === 31) { for (let stem = 0; stem < 4; stem++) { const a = stem * Math.PI / 2; const p: Triple = [Math.cos(a) * 0.08, 0.1 + stem * 0.015, Math.sin(a) * 0.08]; parts.push(beam("酢浆草细柄", green, [0, 0, 0], p, 0.003), petals(3, p, 0.025, 0.04, 85, green)); } }
  else if (kind === 32) parts.push(beam("凤仙花茎", green, [0, 0, 0], [0, 0.4, 0], 0.008), petals(5, [0, 0.4, 0], 0.05, 0.08, 65, "#c5a5af"), tube("后弯花距", "#bba0ad", [[0, 0.4, -0.02], [0, 0.38, -0.09], [0.015, 0.33, -0.12]], 0.009), radialLeaves(5, [0, 0.2, 0], 0.045, 0.12, 60));
  else { parts.push(...basalLeaves(2, 0.32), tube("铃兰拱形花葶", green, [[0, 0, 0], [0, 0.3, 0], [0.12, 0.4, 0], [0.2, 0.34, 0]], 0.005)); for (let i = 0; i < 6; i++) parts.push(cap("下垂钟形小花", "#d7d8c1", [0.035 + i * 0.028, 0.29 + Math.sin(i * 0.4) * 0.045, 0], 0.02, 0.04, 4)); }
  return parts;
}

function fungus(kind: number): ModelPart[] {
  const cream = "#c6bea1"; const parts: ModelPart[] = [];
  if (kind === 0) parts.push(part("伞菌菌柄", "cylinder", cream, [0, 0.13, 0], [0.035, 0.26, 0.035]), cap("伞菌盖", "#ad997c", [0, 0.25, 0], 0.13, 0.09, 0));
  else if (kind === 1) { parts.push(part("羊肚菌柄", "cylinder", cream, [0, 0.08, 0], [0.04, 0.16, 0.04]), lobe("蜂窝菌盖轴", "#a99b78", [0, 0.23, 0], [0.12, 0.21, 0.1])); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 4; parts.push(part("羊肚菌盖凹格", "torus", "#beb18f", [Math.cos(a) * 0.045, 0.14 + Math.floor(i / 8) * 0.085, Math.sin(a) * 0.04], [0.05, 0.065, 0.025], [0, -i * 45, 0])); } }
  else if (kind === 2) parts.push(part("鸡油菌柄", "cylinder", cream, [0, 0.08, 0], [0.035, 0.16, 0.035]), cap("漏斗波缘菌盖", "#c7b47d", [0, 0.15, 0], 0.12, 0.1, 3), petals(7, [0, 0.2, 0], 0.045, 0.1, 70, "#c7b47d"));
  else if (kind === 3) for (let i = 0; i < 5; i++) parts.push(leaf("木耳褶片", "#9c927a", [(i - 2) * 0.025, 0, 0], 0.09, 0.13, [25, i * 55, i % 2 * 30]));
  else if (kind === 4) parts.push(tube("灵芝侧生菌柄", "#a38a64", [[0, 0, 0], [-0.025, 0.1, 0], [0.025, 0.16, 0]], 0.025), cap("肾形灵芝盖", "#aa8b66", [0.05, 0.16, 0], 0.16, 0.045, 2), ...[0.05, 0.09, 0.13].map(r => part("灵芝环状菌纹", "torus", "#bd9f76", [0.05, 0.185, 0], [r * 2, r * 2, 0.008], [90, 0, 0])));
  else if (kind === 5) { parts.push(part("竹荪菌柄", "cylinder", cream, [0, 0.16, 0], [0.035, 0.32, 0.035]), cap("竹荪菌盖", "#9b9e79", [0, 0.3, 0], 0.055, 0.09, 1)); for (let layer = 0; layer < 4; layer++) { const y = 0.08 + layer * 0.05; const r = 0.1 - layer * 0.018; parts.push(part("菌裙横网圈", "torus", "#d6d2b7", [0, y, 0], [r * 2, r * 2, 0.008], [90, 0, 0])); } for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; parts.push(beam("菌裙纵网", "#d6d2b7", [Math.cos(a) * 0.1, 0.08, Math.sin(a) * 0.1], [Math.cos(a) * 0.04, 0.28, Math.sin(a) * 0.04], 0.003)); } }
  else if (kind === 6) parts.push(lobe("鬼笔菌托", cream, [0, 0.02, 0], [0.07, 0.05, 0.07]), part("中空菌柄", "cylinder", cream, [0, 0.14, 0], [0.035, 0.25, 0.035]), cap("黏液菌盖", "#8f9470", [0, 0.25, 0], 0.04, 0.1, 1));
  else if (kind === 7) { parts.push(tube("虫草虫体", "#b0a17a", [[-0.06, 0.02, 0], [0, 0.02, 0], [0.05, 0.025, 0]], 0.014), tube("虫草子座", "#bba67a", [[0.05, 0.025, 0], [0.06, 0.1, 0], [0.04, 0.16, 0]], 0.007)); for (let i = 0; i < 6; i++) parts.push(part("虫体环节", "torus", "#9c926d", [-0.045 + i * 0.016, 0.02, 0], [0.031, 0.031, 0.006], [0, 90, 0])); }
  else if (kind === 8) { parts.push(lobe("地下松露块", "#958b70", [0, 0.035, 0], [0.09, 0.07, 0.08])); for (let i = 0; i < 14; i++) parts.push(needle("松露角状表皮", "#a19576", [Math.cos(i * 2.4) * 0.034, 0.035, Math.sin(i * 2.4) * 0.03], [Math.cos(i * 2.4) * 0.045, 0.045 + i % 2 * 0.015, Math.sin(i * 2.4) * 0.04], 0.016)); }
  else if (kind === 9) for (let i = 0; i < 12; i++) { const a = i * 2.4; const p: Triple = [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05]; parts.push(needle("鹿角菌主枝", "#c4bd9b", p, [p[0], 0.12 + i % 3 * 0.04, p[2]], 0.014), needle("菌枝叉齿", "#c4bd9b", [p[0], 0.09, p[2]], [p[0] + 0.025, 0.14, p[2]], 0.01)); }
  else if (kind === 10) for (let i = 0; i < 9; i++) parts.push(leaf("花菜菌褶叶", "#c7c3a7", [Math.sin(i * 2.4) * 0.06, 0, Math.cos(i * 2.4) * 0.06], 0.09, 0.16, [15 + i % 2 * 35, i * 40, i % 2 * 20]));
  else parts.push(lobe("马勃球形子实体", "#c3c4ab", [0, 0.055, 0], [0.12, 0.12, 0.12]), cap("顶端散孢孔", "#a3ab8c", [0, 0.11, 0], 0.022, 0.018, 3));
  return parts;
}

const trees = [["pine", "松树"], ["spruce", "云杉"], ["cypress", "柏树"], ["ginkgo", "银杏树"], ["willow", "垂柳"], ["banyan", "榕树"], ["birch", "白桦树"], ["baobab", "猴面包树"], ["fanPalm", "扇叶棕榈"], ["coconutPalm", "椰子树"], ["dragonTree", "龙血树"], ["mangrove", "红树"], ["pandanus", "露兜树"], ["eucalyptus", "桉树"]];
const herbs = [["bamboo", "竹子"], ["bananaPlant", "芭蕉植株"], ["monstera", "龟背竹"], ["aloe", "芦荟"], ["agave", "龙舌兰"], ["saguaro", "巨人柱仙人掌"], ["pricklyPear", "掌状仙人掌"], ["goldenBarrel", "金琥"], ["lithops", "生石花"], ["venusFlytrap", "捕蝇草"], ["pitcherPlant", "猪笼草"], ["mimosa", "含羞草"], ["fern", "凤尾蕨"], ["maidenhair", "铁线蕨"], ["duckweed", "浮萍"], ["waterLily", "睡莲"], ["lotus", "荷花植株"], ["dandelion", "蒲公英绒球"], ["sunflower", "向日葵"], ["rose", "玫瑰"], ["tulip", "郁金香"], ["orchid", "兰花"], ["lily", "百合"], ["calla", "马蹄莲"], ["birdOfParadise", "天堂鸟花"], ["hydrangea", "绣球花"], ["chrysanthemum", "菊花"], ["lavender", "薰衣草"], ["cotton", "棉花植株"], ["cattail", "香蒲"], ["reed", "芦苇"], ["woodSorrel", "酢浆草"], ["balsam", "凤仙花"], ["lilyOfValley", "铃兰"]];
const fungi = [["mushroom", "伞菌"], ["morel", "羊肚菌"], ["chanterelle", "鸡油菌"], ["woodEar", "木耳"], ["reishi", "灵芝"], ["bambooFungus", "竹荪"], ["stinkhorn", "鬼笔菌"], ["cordyceps", "虫草"], ["truffle", "松露"], ["antlerFungus", "鹿角菌"], ["cauliflowerFungus", "花菜菌"], ["puffball", "马勃"]];

export const floraDesigns: MasterNatureDesign[] = [
  ...trees.map(([key, name], index) => design(key!, name!, "植物", () => tree(index), ["乔木"])),
  ...herbs.map(([key, name], index) => design(key!, name!, "植物", () => herb(index), ["植物形态"])),
  ...fungi.map(([key, name], index) => design(key!, name!, "植物", () => fungus(index), ["菌类形态"])),
];
