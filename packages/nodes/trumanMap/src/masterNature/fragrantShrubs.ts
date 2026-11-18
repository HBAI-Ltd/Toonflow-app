import { combineMeshes, design, leaf, lobe, needle, petals, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { strip } from "./shapedFoods";
import { stemPoint } from "./springShrubs";
import { pointed } from "./insectForms";

const bark = "#a6a18c";
const green = "#8d9e7a";
const cream = "#d1cdb3";
const bloom = "#c4b5af";

function coralTree(): ModelPart[] {
  const parts: ModelPart[] = [tapered("鸡冠刺桐由基部起的真实分叉树干", bark, [[0, 0, 0], [0, 0.88, 0], [0.03, 1.6, 0]], [0.095, 0.064, 0.024])];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, path: Triple[] = [[0, 0.8 + branch * 0.13, 0], [Math.cos(a) * 0.31, 1.52 + branch * 0.08, Math.sin(a) * 0.31], [Math.cos(a) * 0.57, 1.91 + branch * 0.08, Math.sin(a) * 0.57]]; parts.push(tapered("鸡冠刺桐木质开张冠枝", bark, path, [0.034, 0.02, 0.004]));
    for (let node = 0; node < 4; node++) { const p = stemPoint(path, 0.3 + node * 0.17), b = a + node * 2.4, end: Triple = [p[0] + Math.cos(b) * 0.075, p[1] + 0.022, p[2] + Math.sin(b) * 0.075], blades: ModelPart[] = []; parts.push(needle("刺桐三出叶有明确长度的总叶柄", green, p, end, 0.002)); for (let i = 0; i < 3; i++) { const c = b + (i - 1) * 0.9, start: Triple = i === 1 ? [end[0] + Math.cos(b) * 0.033, end[1] + 0.006, end[2] + Math.sin(b) * 0.033] : end; if (i === 1) blades.push(needle("刺桐顶生小叶特有的长小叶柄", green, end, start, 0.001)); blades.push(flatLeaf("刺桐三片三至六厘米长的卵形小叶", start, [start[0] + Math.cos(c) * 0.052, start[1] + 0.015, start[2] + Math.sin(c) * 0.052], 0.034)); } parts.push(combineMeshes("刺桐带长顶生小叶柄的真实三出叶", green, blades)); }
    const thorns: ModelPart[] = []; for (let i = 0; i < 8; i++) { const p = stemPoint(path, 0.08 + i * 0.1), b = i * 2.4; thorns.push(needle("鸡冠刺桐实际长在木枝上的短皮刺", bark, p, [p[0] + Math.cos(b) * 0.036, p[1] + 0.015, p[2] + Math.sin(b) * 0.036], 0.009)); } parts.push(combineMeshes("鸡冠刺桐和冠枝相连的皮刺", bark, thorns));
    const root = path[2]!, top: Triple = [root[0], root[1] + 0.22, root[2]]; parts.push(tapered("鸡冠刺桐直立总状花序的主轴", green, [root, top], [0.004, 0.001]));
    for (let i = 0; i < 6; i++) { const b = i * 2.4, p: Triple = [root[0] + Math.cos(b) * 0.018, root[1] + 0.025 + i * 0.027, root[2] + Math.sin(b) * 0.018], pieces: ModelPart[] = [needle("鸡冠刺桐花与主轴相连的短梗", green, [root[0], p[1], root[2]], p, 0.0017), leaf("鸡冠刺桐明显反卷的长倒卵形旗瓣", bloom, p, 0.024, 0.047, [55, 90 - b * 180 / Math.PI, 0]), leaf("鸡冠刺桐旗瓣前方狭长的龙骨瓣", bloom, p, 0.007, 0.032, [82, 90 - b * 180 / Math.PI, 0])]; for (const side of [-1, 1]) pieces.push(leaf("鸡冠刺桐比旗瓣短得多的小翼瓣", bloom, p, 0.004, 0.011, [70, 90 - b * 180 / Math.PI + side * 18, 0])); parts.push(combineMeshes("一朵真实旗翼龙骨结构的刺桐花", bloom, pieces)); }
  }
  return parts;
}

function trifoliateOrange(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) { const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.19, 0.77, Math.sin(a) * 0.19], [Math.cos(a) * 0.43, 1.25 + branch % 2 * 0.1, Math.sin(a) * 0.43]]; parts.push(tapered("枳保持青绿色且分叉有棱的木枝", green, path, [0.025, 0.013, 0.003]));
    const thorns: ModelPart[] = [];
    for (let node = 0; node < 5; node++) { const p = stemPoint(path, 0.24 + node * 0.14), b = a + node * 2.4, end: Triple = [p[0] + Math.cos(b) * 0.023, p[1] + 0.011, p[2] + Math.sin(b) * 0.023]; parts.push(flatLeaf("枳三出叶总柄上真实展开的狭叶翼", p, end, 0.005)); const blades: ModelPart[] = []; for (let leaflet = 0; leaflet < 3; leaflet++) { const c = b + (leaflet - 1) * 0.9; blades.push(flatLeaf("枳一大二小的三片独立小叶", end, [end[0] + Math.cos(c) * (leaflet === 1 ? 0.056 : 0.037), end[1] + 0.013, end[2] + Math.sin(c) * (leaflet === 1 ? 0.056 : 0.037)], leaflet === 1 ? 0.025 : 0.019)); } parts.push(combineMeshes("枳从有翼柄末端展开的完整三小叶", green, blades)); thorns.push(pointed("枳每节实际长出的坚硬直长刺", green, [p, [p[0] - Math.sin(b) * 0.07, p[1] + 0.025, p[2] + Math.cos(b) * 0.07]], [0.006, 0])); if (node === 2) { const fruit: Triple = [p[0] + Math.cos(b) * 0.036, p[1] - 0.026, p[2] + Math.sin(b) * 0.036]; parts.push(needle("枳圆果细短而相连的果柄", green, p, fruit, 0.0015), lobe("枳直径四厘米的近球形柑果", "#bfc09b", fruit, [0.045, 0.045, 0.045])); } }
    parts.push(combineMeshes("枳沿青枝排列的完整长刺", green, thorns));
  }
  return parts;
}

function elderberry(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, end: Triple = [Math.cos(a) * 0.55, 1.9 + branch * 0.18, Math.sin(a) * 0.55]; parts.push(tapered("接骨木由根颈抽生的多干木枝", bark, [[0, 0, 0], [end[0] * 0.45, 1.1, end[2] * 0.45], end], [0.045, 0.023, 0.005]));
    for (let node = 0; node < 3; node++) for (const side of [-1, 1]) { const t = 0.63 + node * 0.13, y = end[1] * t, u = (y - 1.1) / (end[1] - 1.1); parts.push(compoundLeaf([end[0] * (0.45 + u * 0.55), y, end[2] * (0.45 + u * 0.55)], (a + side * 1.15) * 180 / Math.PI, 0.23, 3)); }
    const branches: ModelPart[] = [];
    for (let axis = 0; axis < 6; axis++) { const b = axis * Math.PI / 3, top: Triple = [end[0] + Math.cos(b) * 0.13, end[1] + 0.065, end[2] + Math.sin(b) * 0.13]; branches.push(needle("接骨木顶生宽扁聚伞的一级花梗", green, end, top, 0.002)); const flowers: ModelPart[] = [];
      for (let i = 0; i < 7; i++) { const c = i * 2.4, p: Triple = [top[0] + Math.cos(c) * 0.024, top[1] + 0.01 + i % 2 * 0.004, top[2] + Math.sin(c) * 0.024]; flowers.push(needle("接骨木小花连在同一平顶聚伞上", green, top, p, 0.0007), petals(5, p, 0.0018, 0.0035, 80, cream)); } parts.push(combineMeshes("接骨木复聚伞上实际分离的五瓣小花", cream, flowers));
    }
    parts.push(combineMeshes("接骨木伞面下方完整放射的木质支轴", green, branches));
  }
  return parts;
}

function winterJasmine(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) { const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a) * 0.23, 0.73 + branch % 2 * 0.15, Math.sin(a) * 0.23], [Math.cos(a) * 0.67, 0.4 + branch % 2 * 0.13, Math.sin(a) * 0.67]], shoot = tapered("迎春长拱枝的实际四棱青茎", green, path, [0.01, 0.006, 0.002]);
    // 四棱截面烘焙在网格内，保留原支轴弯曲方向，不用圆柱冒充方茎。
    shoot.vertices = shoot.vertices!.map((v, i) => { if (i >= path.length * 8 || i % 2 === 0) return v; const row = Math.floor(i / 8), prev = shoot.vertices![row * 8 + i % 8 - 1]!, next = shoot.vertices![row * 8 + (i % 8 + 1) % 8]!; return { x: (prev.x + next.x) / 2, y: (prev.y + next.y) / 2, z: (prev.z + next.z) / 2 }; }); parts.push(shoot);
    for (let node = 0; node < 6; node++) { const p = stemPoint(path, 0.23 + node * 0.13), b = a + (node % 2 ? 1.2 : -1.2); parts.push(smallCorolla(p, [Math.cos(b), 0.15, Math.sin(b)], 0.017, 0.0045, "#ccc19a", false, 6)); if (node === 1) for (const side of [-1, 1]) parts.push(compoundLeaf(p, (b + side) * 180 / Math.PI, 0.026, 1)); }
  }
  return parts;
}

function osmanthus(): ModelPart[] {
  const parts: ModelPart[] = [tapered("桂花下部真实木质短主干", bark, [[0, 0, 0], [0, 0.6, 0]], [0.055, 0.032])];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, root: Triple = [0, 0.43 + branch * 0.06, 0], end: Triple = [Math.cos(a) * 0.4, 1.37 + branch * 0.09, Math.sin(a) * 0.4]; parts.push(tapered("桂花常绿密枝的木质支轴", bark, [root, end], [0.022, 0.003])); const foliage: ModelPart[] = [];
    for (let node = 0; node < 5; node++) for (const side of [-1, 1]) { const t = 0.26 + node * 0.15, p: Triple = [end[0] * t, root[1] + (end[1] - root[1]) * t, end[2] * t], b = a + side * 1.2; foliage.push(flatLeaf("桂花厚而窄卵形的交互对生叶", p, [p[0] + Math.cos(b) * 0.095, p[1] + 0.027, p[2] + Math.sin(b) * 0.095], 0.032)); if (node % 2 === 0) { const flower: Triple = [p[0] + Math.cos(b) * 0.007, p[1] - 0.003, p[2] + Math.sin(b) * 0.007]; parts.push(smallCorolla(flower, [Math.cos(b), 0.2, Math.sin(b)], 0.004, 0.0018, cream, false, 4)); } }
    parts.push(combineMeshes("桂花沿枝交互对生的常绿叶", green, foliage));
  }
  return parts;
}

function daphne(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 4; branch++) { const a = branch * 2.4, top: Triple = [Math.cos(a) * 0.25, 0.68 + branch % 2 * 0.13, Math.sin(a) * 0.25]; parts.push(tapered("瑞香由近地处分出的密集短木枝", bark, [[0, 0, 0], [top[0] * 0.5, 0.42, top[2] * 0.5], top], [0.018, 0.009, 0.002]));
    const foliage: ModelPart[] = [];
    for (let leafIndex = 0; leafIndex < 9; leafIndex++) { const b = leafIndex * 2.4, t = 0.58 + leafIndex * 0.04, y = top[1] * t, u = y < 0.42 ? y / 0.42 * 0.5 : 0.5 + (y - 0.42) / (top[1] - 0.42) * 0.5, p: Triple = [top[0] * u, y, top[2] * u]; foliage.push(flatLeaf("瑞香互生而挤在梢端的革质披针叶", p, [p[0] + Math.cos(b) * 0.1, p[1] + 0.026, p[2] + Math.sin(b) * 0.1], 0.028)); }
    parts.push(combineMeshes("瑞香近似轮生但实际交错的枝端叶簇", green, foliage));
    for (let i = 0; i < 7; i++) { const a = i * 2.4, r = Math.sqrt(i / 7) * 0.018, p: Triple = [top[0] + Math.cos(a) * r, top[1] + 0.008, top[2] + Math.sin(a) * r]; parts.push(needle("瑞香顶生小聚伞的相连短花梗", green, top, p, 0.001), smallCorolla(p, [Math.cos(a) * 0.6, 0.8, Math.sin(a) * 0.6], 0.012, 0.0038, bloom, false, 4)); }
  }
  return parts;
}

function paperbush(): ModelPart[] {
  const parts: ModelPart[] = [tapered("结香花期少叶的粗短基干", bark, [[0, 0, 0], [0, 0.51, 0]], [0.045, 0.028])];
  for (let branch = 0; branch < 3; branch++) { const a = branch * Math.PI * 2 / 3, node: Triple = [Math.cos(a) * 0.25, 1.02 + branch * 0.07, Math.sin(a) * 0.25]; parts.push(tapered("结香从同一节点三叉分出的一级枝", bark, [[0, 0.48, 0], node], [0.022, 0.012]));
    for (let fork = 0; fork < 3; fork++) { const b = a + (fork - 1) * 0.73, top: Triple = [node[0] + Math.cos(b) * 0.17, node[1] + 0.22, node[2] + Math.sin(b) * 0.17]; parts.push(tapered("结香末梢仍保持三叉分枝的木枝", bark, [node, top], [0.009, 0.003]));
      const center: Triple = [top[0], top[1] - 0.025, top[2]]; parts.push(needle("结香向下弯垂的短花头柄", green, top, center, 0.002));
      for (let flower = 0; flower < 4; flower++) { const c = flower * Math.PI / 2, p: Triple = [center[0] + Math.cos(c) * 0.008, center[1] - 0.002, center[2] + Math.sin(c) * 0.008]; parts.push(smallCorolla(p, [Math.cos(c) * 0.6, -0.8, Math.sin(c) * 0.6], 0.012, 0.0025, "#cdc59d", false, 4)); }
    }
  }
  return parts;
}

function witchHazel(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let branch = 0; branch < 3; branch++) { const a = branch * 2.4, path: Triple[] = [[0, 0, 0], [Math.cos(a + 0.15) * 0.2, 0.79, Math.sin(a + 0.15) * 0.2], [Math.cos(a - 0.1) * 0.35, 1.22, Math.sin(a - 0.1) * 0.35], [Math.cos(a + 0.1) * 0.53, 1.66 + branch * 0.08, Math.sin(a + 0.1) * 0.53]]; parts.push(tapered("金缕梅实际来回弯折而非笔直的木枝", bark, path, [0.033, 0.019, 0.009, 0.002]));
    for (let cluster = 0; cluster < 3; cluster++) { const root = stemPoint(path, 0.53 + cluster * 0.17), flowers: ModelPart[] = [];
      for (let flower = 0; flower < 4; flower++) { const b = flower * Math.PI / 2, p: Triple = [root[0] + Math.cos(b) * 0.009, root[1] + 0.006, root[2] + Math.sin(b) * 0.009]; flowers.push(needle("金缕梅花簇从真实枝节伸出的短梗", green, root, p, 0.001), lobe("金缕梅四缎带瓣根部的红褐小花萼", "#b5aa93", p, [0.006, 0.005, 0.006]));
        for (let petal = 0; petal < 4; petal++) { const c = petal * Math.PI / 2, points: Triple[] = Array.from({ length: 6 }, (_, i) => { const t = i / 5, r = t * 0.022; return [p[0] + Math.cos(c) * r + Math.sin(c) * Math.sin(t * Math.PI * 2) * 0.002, p[1] + Math.sin(t * Math.PI * 1.6) * 0.005, p[2] + Math.sin(c) * r - Math.cos(c) * Math.sin(t * Math.PI * 2) * 0.002]; }); flowers.push(strip("金缕梅真正褶曲并分离的四枚长带状瓣", "#cdc397", points, 0.0018, 0.00035)); }
      }
      parts.push(combineMeshes("金缕梅枝上整簇相连的四缎带花", "#cdc397", flowers));
    }
  }
  return parts;
}

export const fragrantShrubDesigns: MasterNatureDesign[] = [
  design("erythrinaCristaGalli", "鸡冠刺桐", "植物", coralTree, ["Erythrina crista-galli", "三出叶皮刺与反卷旗瓣"]),
  design("trifoliateOrange", "枳", "植物", trifoliateOrange, ["Citrus trifoliata", "Poncirus trifoliata", "三出叶有翼柄与长直刺"]),
  design("elderberry", "接骨木", "植物", elderberry, ["Sambucus nigra", "奇数羽状对生叶与平顶复聚伞"]),
  design("winterJasmine", "迎春", "植物", winterJasmine, ["Jasminum nudiflorum", "四棱拱枝三出叶与六裂花管"]),
  design("osmanthus", "桂花", "植物", osmanthus, ["Osmanthus fragrans", "对生革质叶与叶腋四裂小花"]),
  design("daphneOdora", "瑞香", "植物", daphne, ["Daphne odora", "梢端簇生互生叶与四裂聚伞"]),
  design("edgeworthia", "结香", "植物", paperbush, ["Edgeworthia chrysantha", "真实三叉木枝与下垂四裂花头"]),
  design("witchHazel", "金缕梅", "植物", witchHazel, ["Hamamelis mollis", "折枝与四枚褶曲带状花瓣"]),
];
