import { shade } from "./chineseRoofKit";

// 室内家具库：每件家具是一组长方体，局部坐标 x 沿墙、z 由墙面指向室内、y 向上，原点在墙面处的地面上。
// 颜色用调色板里的角色名（wood、dark、fabric 等），由主题决定具体色值。
export type Role = "wood" | "dark" | "fabric" | "cream" | "accent" | "metal" | "green" | "glow";
export type Piece = [role: Role, cx: number, cy: number, cz: number, sx: number, sy: number, sz: number];
export type Palette = Record<Role, string>;
export type Item = { id: string; w: number; d: number; /** 靠墙摆放；否则自由站立，中心在原点 */ wall: boolean; pieces: Piece[] };

export function paletteOf(theme: string | undefined): Palette {
  const base = (wood: string, dark: string, fabric: string, cream: string, accent: string, metal: string): Palette => ({ wood, dark, fabric, cream, accent, metal, green: "#5d7c4d", glow: "#f6e8bf" });
  switch (theme) {
    case "中式": return base("#8e5a3a", "#4a2e20", "#a4463a", "#e9e0c8", "#c9a24a", "#8d7e58");
    case "欧式": return base("#8a6244", "#4b3527", "#6f3c3c", "#e7ddc9", "#b5902f", "#7d7d7d");
    case "日式": return base("#b08e64", "#3b2d21", "#7d8b6b", "#efe8d6", "#a85a45", "#7a7468");
    case "异域": return base("#8b6c48", "#4f3a28", "#a2593b", "#e4d6b8", "#c28a3c", "#8a7a5e");
    case "现代": return base("#b99d79", "#40474d", "#5d7a89", "#ebe8e1", "#cfa650", "#9aa1a6");
    case "科幻": return base("#a9b7c3", "#364250", "#3b8fb3", "#e5eef4", "#5ad4ff", "#8895a2");
    case "赛博朋克": return base("#3b4351", "#222833", "#8d3eb0", "#c9d3dc", "#35e6ff", "#6b7785");
    case "蒸汽朋克": return base("#6c4b2f", "#3d2a1b", "#7a3f34", "#d9cbab", "#b58a3a", "#9a7a3c");
    case "奇幻": return base("#7a5a45", "#3f2d3a", "#6a3f7a", "#e2d6c0", "#d2aa4a", "#8a8078");
    case "废土": return base("#6f5b45", "#3c3228", "#6a5a46", "#bfb49c", "#a0663a", "#6e675e");
    default: return base("#a88a66", "#43484d", "#6b7f86", "#e6e2da", "#c8a04c", "#8f979c");
  }
}

const legs = (w: number, d: number, h: number, t = .07, inset = .06): Piece[] => [-1, 1].flatMap(sx => [-1, 1].map((sz): Piece => ["dark", sx * (w / 2 - inset), h / 2, d / 2 + sz * (d / 2 - inset), t, h, t]));

/** 靠墙长案 / 柜台 / 条案；items 为案面摆件 */
export const longTable = (w = 1.6, d = .46, h = .92, decorate = true): Item => ({
  id: "条案", w, d, wall: true,
  pieces: [["wood", 0, h - .03, d / 2, w, .06, d], ["dark", 0, h - .1, d / 2, w - .12, .1, d - .1], ...legs(w, d, h - .06), ["dark", 0, .28, d / 2, w - .2, .04, d - .16],
    ...(decorate ? [["cream", -w * .3, h + .13, d * .5, .2, .26, .2], ["accent", -w * .3, h + .29, d * .5, .12, .06, .12], ["metal", w * .3, h + .05, d * .5, .28, .1, .16]] as Piece[] : [])],
});

export const cabinet = (w = 1.05, d = .5, h = 1.9): Item => ({
  id: "立柜", w, d, wall: true,
  pieces: [["wood", 0, h / 2, d / 2, w, h, d], ["dark", 0, h + .03, d / 2, w + .06, .06, d + .06], ["dark", 0, h / 2, d + .005, .03, h - .2, .03], ["dark", -w / 4, h / 2, d + .01, w / 2 - .1, h - .24, .02], ["dark", w / 4, h / 2, d + .01, w / 2 - .1, h - .24, .02],
    ["metal", -.07, h * .5, d + .03, .04, .12, .03], ["metal", .07, h * .5, d + .03, .04, .12, .03], ["dark", 0, .06, d / 2, w + .04, .12, d + .04]],
});

export const bookcase = (w = 1.4, d = .38, h = 2.0): Item => {
  const pieces: Piece[] = [["dark", -w / 2 + .03, h / 2, d / 2, .06, h, d], ["dark", w / 2 - .03, h / 2, d / 2, .06, h, d], ["dark", 0, h / 2, .02, w, h, .03]];
  const shelves = 5;
  for (let k = 0; k <= shelves; k++) pieces.push(["wood", 0, .08 + (h - .16) * k / shelves, d / 2, w - .08, .04, d - .02]);
  const roles: Role[] = ["fabric", "accent", "cream", "dark", "green"];
  for (let k = 0; k < shelves; k++) for (let n = 0; n < 6; n++) {
    const bw = .12 + ((k * 7 + n * 3) % 4) * .035, x = -w / 2 + .12 + n * ((w - .24) / 6), bh = .22 + ((k + n) % 3) * .05;
    pieces.push([roles[(k + n * 2) % roles.length]!, x + bw / 2, .1 + (h - .16) * k / shelves + bh / 2 + .02, d / 2, bw, bh, d * .72]);
  }
  return { id: "书架", w, d, wall: true, pieces };
};

export const bed = (chinese: boolean): Item => ({
  id: "床", w: 2.0, d: 1.25, wall: true,
  pieces: [["wood", 0, .22, .625, 2.0, .26, 1.25], ["cream", 0, .45, .66, 1.9, .22, 1.12], ["fabric", .3, .58, .78, 1.2, .06, 1.0], ["cream", -.75, .6, .35, .5, .12, .3], ["cream", -.75, .6, .85, .5, .12, .3],
    ["dark", -1.02, .5, .625, .08, 1.0, 1.25], ...(chinese ? [["dark", -.98, 1.18, .625, .06, .26, 1.1] as Piece] : []), ...legs(2.0, 1.25, .1, .1, .05)],
});

export const bench = (w = 1.5, d = .4): Item => ({ id: "长凳", w, d, wall: true, pieces: [["wood", 0, .44, d / 2, w, .06, d], ...legs(w, d, .42, .06, .05), ["dark", 0, .22, d / 2, w - .2, .04, .06]] });

export const sofa = (): Item => ({
  id: "沙发", w: 1.9, d: .86, wall: true,
  pieces: [["fabric", 0, .24, .43, 1.9, .3, .86], ["fabric", 0, .62, .13, 1.9, .5, .24], ["fabric", -.88, .5, .43, .14, .32, .86], ["fabric", .88, .5, .43, .14, .32, .86], ["cream", -.4, .46, .5, .7, .12, .6], ["cream", .4, .46, .5, .7, .12, .6], ["dark", 0, .06, .43, 1.8, .12, .8]],
});

export const desk = (): Item => ({
  id: "书桌", w: 1.4, d: 1.45, wall: true,
  pieces: [["wood", 0, .74, .36, 1.4, .05, .72], ...legs(1.4, .72, .72, .06, .04), ["dark", .5, .5, .36, .36, .5, .62], ["metal", 0, .78, .2, .3, .02, .2], ["cream", -.3, .78, .5, .3, .02, .22],
    ["fabric", 0, .45, 1.05, .5, .08, .5], ["fabric", 0, .75, 1.27, .5, .55, .08], ["dark", -.2, .22, 1.05, .05, .44, .05], ["dark", .2, .22, 1.05, .05, .44, .05], ["dark", -.2, .22, .85, .05, .44, .05], ["dark", .2, .22, .85, .05, .44, .05]],
});

export const altar = (): Item => ({
  id: "供桌", w: 1.7, d: .62, wall: true,
  pieces: [["dark", 0, .9, .31, 1.7, .08, .62], ["wood", 0, .7, .31, 1.58, .3, .5], ...legs(1.7, .62, .86, .1, .06), ["metal", 0, 1.02, .31, .26, .16, .26], ["accent", -.55, 1.08, .31, .06, .3, .06], ["accent", .55, 1.08, .31, .06, .3, .06], ["fabric", 0, .6, .625, 1.2, .5, .02]],
});

export const screen = (): Item => {
  const pieces: Piece[] = [["dark", 0, 1.7 / 2, .07, 2.2, 1.7, .05], ["dark", 0, .06, .07, 2.3, .12, .14]];
  for (let k = 0; k < 3; k++) pieces.push(["cream", -.72 + k * .72, .95, .1, .64, 1.36, .03], ["accent", -.72 + k * .72, .95, .12, .38, .72, .02]);
  return { id: "屏风", w: 2.3, d: .16, wall: true, pieces };
};

export const plant = (): Item => ({ id: "盆栽", w: .55, d: .55, wall: true, pieces: [["cream", 0, .22, .28, .4, .44, .4], ["dark", 0, .46, .28, .44, .04, .44], ["green", 0, .85, .28, .5, .56, .5], ["green", .1, 1.2, .3, .3, .3, .3]] });

export const counter = (): Item => ({
  id: "柜台", w: 2.4, d: .74, wall: true,
  pieces: [["wood", 0, .5, .34, 2.4, .96, .68], ["dark", 0, 1.0, .37, 2.5, .06, .74], ["dark", -.6, .5, .69, 1.0, .8, .02], ["dark", .6, .5, .69, 1.0, .8, .02], ["metal", .1, 1.06, .3, .34, .1, .24], ["accent", -.8, 1.08, .3, .2, .14, .2], ["cream", .85, 1.05, .4, .4, .03, .3]],
});

export const shelfRack = (): Item => {
  const pieces: Piece[] = [["dark", -.7, .8, .22, .05, 1.6, .44], ["dark", .7, .8, .22, .05, 1.6, .44], ["dark", 0, .8, .02, 1.45, 1.6, .03]];
  for (let k = 0; k < 4; k++) {
    pieces.push(["wood", 0, .12 + k * .46, .22, 1.4, .04, .42]);
    const roles: Role[] = ["accent", "cream", "fabric", "metal"];
    for (let n = 0; n < 4; n++) pieces.push([roles[(k + n) % 4]!, -.5 + n * .34, .12 + k * .46 + .13, .22, .22, .22, .26]);
  }
  return { id: "货架", w: 1.5, d: .46, wall: true, pieces };
};

export const workbench = (): Item => ({
  id: "工作台", w: 2.0, d: .78, wall: true,
  pieces: [["wood", 0, .86, .39, 2.0, .08, .78], ...legs(2.0, .78, .84, .09, .05), ["dark", 0, .3, .39, 1.8, .05, .66], ["metal", -.6, .96, .3, .24, .12, .2], ["dark", .4, .93, .4, .5, .06, .3], ["accent", .75, .95, .3, .14, .1, .14]],
});

export const crates = (): Item => ({
  id: "货箱", w: 1.5, d: .9, wall: true,
  pieces: [["wood", -.35, .3, .45, .8, .6, .8], ["wood", .5, .25, .4, .6, .5, .7], ["dark", -.35, .62, .45, .84, .04, .84], ["wood", -.3, .88, .42, .6, .5, .6], ["dark", .5, .52, .4, .64, .04, .74]],
});

/** 自由站立的桌椅组：中心在原点，w×d 为含凳子的占地 */
export const tableSet = (shape: "square" | "long"): Item => {
  if (shape === "long") return { id: "长桌", w: 2.2, d: 1.5, wall: false, pieces: [["wood", 0, .76, 0, 1.8, .06, .8], ...legs(1.8, .8, .74, .07, .06).map((p): Piece => [p[0], p[1], p[2], p[3] - .4, p[4], p[5], p[6]]), ["wood", 0, .44, -.58, 1.8, .06, .3], ["wood", 0, .44, .58, 1.8, .06, .3], ["dark", -.8, .22, -.58, .06, .44, .24], ["dark", .8, .22, -.58, .06, .44, .24], ["dark", -.8, .22, .58, .06, .44, .24], ["dark", .8, .22, .58, .06, .44, .24], ["cream", -.3, .83, 0, .3, .08, .3], ["accent", .4, .83, .1, .22, .08, .22]] };
  const pieces: Piece[] = [["wood", 0, .76, 0, 1.0, .06, 1.0], ["dark", 0, .68, 0, .9, .1, .9], ...[-1, 1].flatMap(sx => [-1, 1].map((sz): Piece => ["dark", sx * .42, .36, sz * .42, .08, .72, .08])), ["cream", 0, .83, 0, .26, .08, .26], ["accent", .25, .82, -.2, .16, .06, .16]];
  for (const [x, z] of [[0, -.78], [0, .78], [-.78, 0], [.78, 0]] as const) pieces.push(["fabric", x, .44, z, .38, .06, .38], ["dark", x - .14, .22, z - .14, .05, .44, .05], ["dark", x + .14, .22, z - .14, .05, .44, .05], ["dark", x - .14, .22, z + .14, .05, .44, .05], ["dark", x + .14, .22, z + .14, .05, .44, .05]);
  return { id: "方桌", w: 1.98, d: 1.98, wall: false, pieces };
};

export const rug = (): Item => ({ id: "地毯", w: 2.6, d: 1.8, wall: false, pieces: [["fabric", 0, .012, 0, 2.6, .024, 1.8], ["accent", 0, .028, 0, 2.2, .01, 1.4], ["cream", 0, .036, 0, 1.0, .008, .6]] });

export const pews = (): Item => {
  const pieces: Piece[] = [];
  for (let k = 0; k < 3; k++) pieces.push(["wood", 0, .44, -.9 + k * .9, 2.2, .06, .38], ["dark", 0, .75, -1.08 + k * .9, 2.2, .5, .06], ["dark", -1.0, .22, -.9 + k * .9, .08, .44, .3], ["dark", 1.0, .22, -.9 + k * .9, .08, .44, .3]);
  return { id: "长椅列", w: 2.3, d: 2.6, wall: false, pieces };
};

/** 建筑用途标签，决定摆哪些家具 */
export type Purpose = "dining" | "living" | "retail" | "office" | "worship" | "study" | "storage" | "work" | "general";

function purposesIn(text: string): Purpose[] {
  const found: Purpose[] = [];
  const add = (p: Purpose, re: RegExp) => { if (re.test(text) && !found.includes(p)) found.push(p); };
  add("dining", /酒|茶|面馆|饭|食|餐|吧|咖啡|厨|糕饼|浴堂|歌舞|勾栏|戏楼|观演|会馆|客栈|驿|旅馆|酒馆|酒楼|宴|膳/);
  add("living", /客栈|旅馆|宿|公寓|宅|居|住|寝|舍|屋|院落|客舍|馆舍|驿|王府|府邸|别院|民居|养老|宿舍|招待/);
  add("retail", /店|铺|行|商|市|摊|百货|超市|柜|当铺|钱庄|票号|药|布庄|书肆|货/);
  add("office", /署|衙|办公|局|所|会|议|法院|银行|邮|电报|警|税|官|府|军机|值所|营业|接待|前厅/);
  add("worship", /殿|庙|祠|寺|观|礼拜|教堂|神|祭|佛|圣|坛|僧|道/);
  add("study", /书|学|教|课|讲|读|阅览|图书|考|贡院|院校|研究/);
  add("storage", /仓|库|栈|窖|货栈|储|粮|冷库/);
  add("work", /工房|工厂|车间|作坊|坊|工场|厂|实验|制|铁匠|木匠|窑|炉|机|修|加工/);
  return found;
}

/** 先按建筑名取用途；名字里没有线索时再看分组名（分组名常是泛称，只作兜底） */
export function purposesOf(name: string, group: string | undefined): Purpose[] {
  const byName = purposesIn(name);
  if (byName.length) return byName;
  const byGroup = purposesIn(group ?? "");
  return byGroup.length ? byGroup.slice(0, 2) : ["general"];
}

/** 某用途要摆的靠墙家具（按优先顺序）和自由站立的桌椅组 */
export function plansFor(purposes: Purpose[], chinese: boolean): { wall: Item[]; free: Item[] } {
  const wall: Item[] = [], free: Item[] = [];
  const addWall = (...items: Item[]) => { for (const item of items) if (!wall.some(other => other.id === item.id && other.w === item.w)) wall.push(item); };
  for (const purpose of purposes) switch (purpose) {
    case "dining": addWall(counter(), longTable(1.5, .5, .85, false), cabinet(1.0, .5, 1.6)); free.push(tableSet("square"), tableSet("long")); break;
    case "living": addWall(bed(chinese), cabinet(), longTable(), bench(), plant()); free.push(tableSet("square")); break;
    case "retail": addWall(counter(), shelfRack(), shelfRack(), cabinet(1.2, .5, 1.9)); free.push(tableSet("square")); break;
    case "office": addWall(desk(), bookcase(), cabinet(), screen(), plant()); free.push(tableSet("square")); break;
    case "worship": addWall(altar(), screen(), plant(), bench()); free.push(pews()); break;
    case "study": addWall(bookcase(), bookcase(1.2), desk(), bench()); free.push(tableSet("long")); break;
    case "storage": addWall(crates(), shelfRack(), crates()); break;
    case "work": addWall(workbench(), shelfRack(), crates(), cabinet(1.1, .55, 1.7)); free.push(tableSet("long")); break;
    default: addWall(longTable(), cabinet(), bench(), plant(), sofa()); free.push(tableSet("square"));
  }
  return { wall, free };
}

export const shadeOf = shade;
