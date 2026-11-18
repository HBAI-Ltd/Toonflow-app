import { combineMeshes, design, lobe, needle, part, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { archedGrassBlade } from "./herbaceousExpansionBatchThree";

const green = "#84986f";
const pale = "#b1bd96";
const cream = "#d7d2b8";
const pink = "#b9a7b7";
const yellow = "#c9ba86";

// 真实独立物种的原创大株/铺地形态；矮而宽的物种保原高度，不把小花放大。
// https://www.rhs.org.uk/plants/20718/dahlia-imperialis-b/details
// https://plants.ces.ncsu.edu/plants/ratibida-columnifera/
// https://www.nparks.gov.sg/florafaunaweb/flora/1/8/1881
// https://pza.sanbi.org/ornithogalum-candicans

function peaFlower(root: Triple, heading: number, size: number, color: string): ModelPart {
  const a = heading * Math.PI / 180;
  const pieces: ModelPart[] = [radialBlade("蝶形花上方独立宽旗瓣", color, root, size * 0.8, size * 1.1, 25, heading), lobe("蝶形花下方合拢成舟形的龙骨瓣", color, [root[0] + Math.cos(a) * size * 0.38, root[1] - size * 0.1, root[2] + Math.sin(a) * size * 0.38], [size * 0.5, size * 0.4, size * 0.9])];
  for (const side of [-1, 1]) pieces.push(radialBlade("蝶形花夹住龙骨瓣的两枚狭翼瓣", color, root, size * 0.35, size * 0.8, 72, heading + side * 28));
  return combineMeshes("具旗瓣翼瓣龙骨三组分离结构的完整蝶形花", color, pieces);
}

function fireweed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("柳兰细长而直立的单一高秆", pale, [[0, 0, 0], [0, 1.83, 0]], [0.009, 0.0015])];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4, y = 0.09 + i * 0.078, length = 0.14 - i * 0.004;
    parts.push(flatLeaf("柳兰沿主秆螺旋互生的狭柳叶", [0, y, 0], [Math.cos(a) * length, y + 0.025, Math.sin(a) * length], 0.027, "oval", 0.0007));
  }
  for (let i = 0; i < 13; i++) {
    const a = i * 2.4, y = 1.15 + i * 0.045, root: Triple = [Math.cos(a) * 0.029, y + 0.012, Math.sin(a) * 0.029], pieces: ModelPart[] = [needle("柳兰顶生总状花序上各花细梗", pale, [0, y, 0], root, 0.0013)];
    for (let petal = 0; petal < 4; petal++) pieces.push(radialBlade("柳兰四片互相分离而不连成花管的宽瓣", pink, root, 0.012, 0.021, 76, petal * 90));
    for (let stamen = 0; stamen < 8; stamen++) { const b = stamen * Math.PI / 4, p: Triple = [root[0] + Math.cos(b) * 0.009, root[1] + 0.012, root[2] + Math.sin(b) * 0.009]; pieces.push(needle("柳兰八枚独立细雄蕊", cream, root, p, 0.0007), lobe("柳兰雄蕊顶端的小花药", cream, p, [0.0018, 0.0024, 0.0018])); }
    parts.push(combineMeshes("柳兰长顶穗上四瓣而非筒状的独立粉花", pink, pieces));
  }
  return parts;
}

function treeDahlia(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const x = (shoot - 0.5) * 0.14, top = 3.6 + shoot * 0.16;
    parts.push(tapered("帝王大丽花粗大竹节状而非木干的高草茎", pale, [[x, 0, 0], [x, top, 0]], [0.036, 0.01]));
    for (let node = 0; node < 7; node++) {
      const y = 0.35 + node * 0.43, radius = 0.038 - node * 0.003;
      parts.push(part("帝王大丽花粗茎上膨大的真实节环", "lathe", pale, [x, y, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: radius * 0.8, y: -0.015 }, { x: radius, y: -0.012 }, { x: radius, y: 0.012 }, { x: radius * 0.8, y: 0.015 }, { x: radius * 0.8, y: -0.015 }] }));
      for (const side of [-1, 1]) {
        const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0), end: Triple = [x + Math.cos(a) * 0.34, y + 0.05, Math.sin(a) * 0.34], leaves: ModelPart[] = [needle("帝王大丽花对生大羽状叶的共同长柄", pale, [x, y, 0], end, 0.003)];
        for (let leaflet = 0; leaflet < 3; leaflet++) for (const edge of [-1, 1]) { const t = 0.17 + leaflet * 0.23, root: Triple = [x + (end[0] - x) * t, y + 0.05 * t, end[2] * t], b = a + edge * 1.12; leaves.push(flatLeaf("帝王大丽花有长尖端的离生大复叶小片", root, [root[0] + Math.cos(b) * 0.14, root[1] + 0.018, root[2] + Math.sin(b) * 0.14], 0.057, "oval", 0.0008)); }
        leaves.push(flatLeaf("帝王大丽花羽状复叶远端的长尖顶叶", end, [end[0] + Math.cos(a) * 0.15, end[1] + 0.022, end[2] + Math.sin(a) * 0.15], 0.064, "oval", 0.0008));
        parts.push(combineMeshes("帝王大丽花高秆上真实对生的大羽状复叶", green, leaves));
      }
    }
    for (let flower = 0; flower < 4; flower++) {
      const a = flower * Math.PI / 2 + shoot, root: Triple = [x + Math.cos(a) * 0.35, top - 0.05 + flower % 2 * 0.12, Math.sin(a) * 0.35], petals: ModelPart[] = [];
      parts.push(tapered("帝王大丽花顶端单瓣垂花的斜长花柄", pale, [[x, top - 0.48, 0], root], [0.007, 0.002]));
      for (let petal = 0; petal < 8; petal++) petals.push(radialBlade("帝王大丽花与重瓣大丽花不同的八枚离生垂瓣", pink, root, 0.025, 0.047, 119, petal * 45));
      parts.push(combineMeshes("帝王大丽花长高秆顶端八瓣下垂单花", pink, petals), lobe("帝王大丽花下向花冠中裸露的黄色管花盘", yellow, [root[0], root[1] - 0.008, root[2]], [0.024, 0.012, 0.024]));
    }
  }
  return parts;
}

function mexicanHat(): ModelPart[] {
  const parts: ModelPart[] = [tapered("墨西哥帽花细长直立主秆", pale, [[0, 0, 0], [0, 0.82, 0]], [0.005, 0.0012])];
  for (let leaf = 0; leaf < 7; leaf++) {
    const a = leaf * 2.4, y = 0.045 + leaf * 0.081, root: Triple = [Math.cos(a) * 0.035, y + 0.009, Math.sin(a) * 0.035], pieces: ModelPart[] = [needle("墨西哥帽花深分裂叶片的共同叶柄", pale, [0, y, 0], root, 0.0014)];
    for (let segment = 0; segment < 5; segment++) { const b = a + (segment - 2) * 0.48; pieces.push(flatLeaf("墨西哥帽花掌羽状分开的狭线叶裂片", root, [root[0] + Math.cos(b) * 0.075, root[1] + 0.012, root[2] + Math.sin(b) * 0.075], 0.008, "oval", 0.0006)); }
    parts.push(combineMeshes("墨西哥帽花三至七裂的完整细分叶", green, pieces));
  }
  for (let flower = 0; flower < 6; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.18, 0.73 + flower % 3 * 0.042, Math.sin(a) * 0.18], petals: ModelPart[] = [];
    parts.push(tapered("墨西哥帽花柱状花头下的裸细分枝柄", pale, [[0, 0.49 + flower % 3 * 0.075, 0], root], [0.002, 0.0008]), tapered("墨西哥帽花显著长于花瓣宽度的柱状盘花轴", "#a29475", [root, [root[0], root[1] + 0.036, root[2]]], [0.008, 0.0035]));
    for (let petal = 0; petal < 5; petal++) petals.push(radialBlade("墨西哥帽花柱头下自然下垂的舌状花瓣", "#bdab85", root, 0.014, 0.03, 137, petal * 72));
    parts.push(combineMeshes("墨西哥帽花长圆柱下的五瓣下垂帽檐", "#bdab85", petals));
  }
  return parts;
}

function sneezeweed(): ModelPart[] {
  const parts: ModelPart[] = [tapered("堆心菊粗直的高茎", pale, [[0, 0, 0], [0, 1.47, 0]], [0.009, 0.002])];
  for (let i = 0; i < 10; i++) {
    const a = i * 2.4, y = 0.08 + i * 0.115, length = 0.17 - i * 0.007;
    parts.push(flatLeaf("堆心菊互生的狭倒披针叶", [0, y, 0], [Math.cos(a) * length, y + 0.025, Math.sin(a) * length], 0.045, "oval", 0.0008));
  }
  const tips: [number, number][] = [[0, 0], [-0.32, 0.45], [-0.5, 0.86], [-0.45, 1], [-0.25, 0.91], [0, 1], [0.25, 0.91], [0.45, 1], [0.5, 0.86], [0.32, 0.45]];
  for (let flower = 0; flower < 7; flower++) {
    const a = flower * 2.4, root: Triple = [Math.cos(a) * 0.22, 1.36 + flower % 3 * 0.055, Math.sin(a) * 0.22], rays: ModelPart[] = [];
    parts.push(tapered("堆心菊分枝花头下独立的花梗", pale, [[0, 1.03 + flower % 3 * 0.09, 0], root], [0.003, 0.001]), lobe("堆心菊显著隆起的圆丘状中央管花盘", "#b7a682", [root[0], root[1] + 0.006, root[2]], [0.02, 0.017, 0.02]));
    for (let ray = 0; ray < 11; ray++) { const b = ray * Math.PI * 2 / 11, blade = flatLeaf("堆心菊末端有真实三齿而向下反折的舌状花", root, [root[0] + Math.cos(b) * 0.028, root[1] - 0.008, root[2] + Math.sin(b) * 0.028], 0.012, tips, 0.0005); blade.color = yellow; rays.push(blade); }
    parts.push(combineMeshes("堆心菊隆起花丘周围的三齿下折黄裙", yellow, rays));
  }
  return parts;
}

function goatsRue(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let stem = 0; stem < 3; stem++) {
    const a = stem * 2.4, x = Math.cos(a) * 0.16, z = Math.sin(a) * 0.16, top = 1.32 + stem % 2 * 0.13;
    parts.push(tapered("山羊豆从根冠斜生的直立分枝茎", pale, [[0, 0, 0], [x, top, z]], [0.007, 0.0013]));
    for (let node = 0; node < 4; node++) {
      const t = 0.18 + node * 0.18, root: Triple = [x * t, top * t, z * t], b = a + node * 2.4, end: Triple = [root[0] + Math.cos(b) * 0.21, root[1] + 0.025, root[2] + Math.sin(b) * 0.21], leaves: ModelPart[] = [needle("山羊豆奇数羽状复叶的共同叶轴", pale, root, end, 0.0017)];
      for (let leaflet = 0; leaflet < 6; leaflet++) for (const side of [-1, 1]) { const u = 0.1 + leaflet * 0.14, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + side * 1.2; leaves.push(flatLeaf("山羊豆羽状复叶上离生而平滑的小叶", p, [p[0] + Math.cos(c) * 0.042, p[1] + 0.008, p[2] + Math.sin(c) * 0.042], 0.016, "oval", 0.0006)); }
      leaves.push(flatLeaf("山羊豆奇数羽状复叶的顶生小叶", end, [end[0] + Math.cos(b) * 0.042, end[1] + 0.008, end[2] + Math.sin(b) * 0.042], 0.016, "oval", 0.0006));
      parts.push(combineMeshes("山羊豆具有独立顶端小叶的细长羽叶", green, leaves));
    }
    for (let raceme = 0; raceme < 2; raceme++) {
      const y = top * (0.64 + raceme * 0.18), root: Triple = [x * y / top, y, z * y / top], b = a + raceme * 1.8, tip: Triple = [root[0] + Math.cos(b) * 0.055, y + 0.18, root[2] + Math.sin(b) * 0.055], flowers: ModelPart[] = [tapered("山羊豆从叶腋抽出的细长总状花序", pale, [root, tip], [0.0016, 0.0006])];
      for (let flower = 0; flower < 9; flower++) { const t = 0.16 + flower * 0.09, axis: Triple = root.map((v, coordinate) => v + (tip[coordinate]! - v) * t) as Triple, c = flower * 2.4, p: Triple = [axis[0] + Math.cos(c) * 0.008, axis[1], axis[2] + Math.sin(c) * 0.008]; flowers.push(needle("山羊豆蝶花与总状轴的真实短梗", pale, axis, p, 0.001), peaFlower(p, c * 180 / Math.PI, 0.01, "#c3b8c4")); }
      for (let i = 0; i < flowers.length; i += 10) parts.push(combineMeshes("山羊豆直立总状序上分离的浅紫蝶形花", "#c3b8c4", flowers.slice(i, i + 10)));
    }
  }
  return parts;
}

function sweetClover(): ModelPart[] {
  const parts: ModelPart[] = [];
  const serrate: [number, number][] = [[0, 0], [-0.23, 0.16], [-0.43, 0.45], [-0.36, 0.5], [-0.5, 0.7], [-0.33, 0.73], [-0.28, 0.93], [0, 1], [0.28, 0.93], [0.33, 0.73], [0.5, 0.7], [0.36, 0.5], [0.43, 0.45], [0.23, 0.16]];
  for (let stem = 0; stem < 3; stem++) {
    const a = stem * 2.4, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2, top = 1.5 + stem % 2 * 0.16;
    parts.push(tapered("黄花草木樨高而细长的上升分枝", pale, [[0, 0, 0], [x, top, z]], [0.006, 0.0012]));
    for (let node = 0; node < 5; node++) {
      const t = 0.17 + node * 0.15, b = a + node * 2.4, root: Triple = [x * t, top * t, z * t], hub: Triple = [root[0] + Math.cos(b) * 0.018, root[1] + 0.005, root[2] + Math.sin(b) * 0.018], leaves: ModelPart[] = [needle("草木樨互生三出叶的共同短柄", pale, root, hub, 0.0012)];
      for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * 0.85; leaves.push(flatLeaf("草木樨远端具齿而非宽圆三叶草的小叶", hub, [hub[0] + Math.cos(c) * 0.032, hub[1] + 0.007, hub[2] + Math.sin(c) * 0.032], 0.012, serrate, 0.0005)); }
      parts.push(combineMeshes("黄花草木樨一片完整三出细齿叶", green, leaves));
      if (node < 3) continue;
      const tip: Triple = [root[0] + Math.cos(b) * 0.055, root[1] + 0.12, root[2] + Math.sin(b) * 0.055], flowers: ModelPart[] = [tapered("草木樨叶腋细长而疏松的总状小花轴", pale, [root, tip], [0.001, 0.0004])];
      for (let flower = 0; flower < 14; flower++) { const u = 0.12 + flower * 0.06, axis: Triple = root.map((v, coordinate) => v + (tip[coordinate]! - v) * u) as Triple, c = flower * 2.4, p: Triple = [axis[0] + Math.cos(c) * 0.004, axis[1], axis[2] + Math.sin(c) * 0.004]; flowers.push(needle("草木樨每朵小蝶花独立的极短柄", pale, axis, p, 0.0006), peaFlower(p, c * 180 / Math.PI, 0.005, yellow)); }
      for (let i = 0; i < flowers.length; i += 14) parts.push(combineMeshes("黄花草木樨细总状序上的真实微型蝶花", yellow, flowers.slice(i, i + 14)));
    }
  }
  return parts;
}

function crownVetch(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let shoot = 0; shoot < 4; shoot++) {
    const a = shoot * 2.4, tip: Triple = [Math.cos(a) * 0.84, 0.11, Math.sin(a) * 0.84], middle: Triple = [tip[0] * 0.5, 0.31, tip[2] * 0.5];
    parts.push(tapered("小冠花贴地延伸而中段弧拱的蔓状草茎", pale, [[0, 0, 0], middle, tip], [0.004, 0.0025, 0.0006]));
    for (let node = 0; node < 5; node++) {
      const t = 0.15 + node * 0.16, y = t < 0.5 ? 0.31 * t / 0.5 : 0.31 - (t - 0.5) / 0.5 * 0.2, root: Triple = [tip[0] * t, y, tip[2] * t], b = a + node * 2.4, end: Triple = [root[0] + Math.cos(b) * 0.14, y + 0.02, root[2] + Math.sin(b) * 0.14], leaves: ModelPart[] = [needle("小冠花奇数羽状复叶共同叶轴", pale, root, end, 0.0012)];
      for (let leaflet = 0; leaflet < 5; leaflet++) for (const side of [-1, 1]) { const u = 0.14 + leaflet * 0.16, p: Triple = root.map((v, axis) => v + (end[axis]! - v) * u) as Triple, c = b + side * 1.2; leaves.push(flatLeaf("小冠花贴地蔓上成对的钝端小叶", p, [p[0] + Math.cos(c) * 0.024, p[1] + 0.004, p[2] + Math.sin(c) * 0.024], 0.01, "obovate", 0.0005)); }
      leaves.push(flatLeaf("小冠花奇数羽状叶远端的独立钝端小叶", end, [end[0] + Math.cos(b) * 0.024, end[1] + 0.004, end[2] + Math.sin(b) * 0.024], 0.01, "obovate", 0.0005));
      parts.push(combineMeshes("小冠花蔓上成对离生的完整小叶列", green, leaves));
    }
    const head: Triple = [middle[0], 0.43, middle[2]], flowers: ModelPart[] = [];
    parts.push(tapered("小冠花低于半米的单个冠状花球梗", pale, [middle, head], [0.0018, 0.0007]));
    for (let flower = 0; flower < 8; flower++) { const b = flower * Math.PI / 4, p: Triple = [head[0] + Math.cos(b) * 0.012, head[1], head[2] + Math.sin(b) * 0.012]; flowers.push(needle("小冠花伞状花球上辐射的小花梗", pale, head, p, 0.001), peaFlower(p, b * 180 / Math.PI, 0.012, pink)); }
    parts.push(combineMeshes("小冠花地毯状株体上有独立蝶花的冠状花球", pink, flowers));
  }
  return parts;
}

function crinumLily(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 10; i++) parts.push(archedGrassBlade("文殊兰从短根颈放射且真实弧垂的肉质宽带叶", [0, 0.02, 0], i * 137.5, 0.82 + i % 3 * 0.09, 0.12, 0.52 + i % 2 * 0.1));
  const hub: Triple = [0, 1.13, 0];
  parts.push(tapered("文殊兰高出宽带叶丛的粗独立花葶", pale, [[0, 0, 0], hub], [0.018, 0.007]));
  for (let flower = 0; flower < 7; flower++) {
    const a = flower * Math.PI * 2 / 7, root: Triple = [Math.cos(a) * 0.1, 1.18 + flower % 2 * 0.015, Math.sin(a) * 0.1];
    parts.push(tapered("文殊兰伞形花序上独立的粗短花柄", pale, [hub, root], [0.005, 0.002]));
    const tube = sweptProfile("文殊兰不带蜘蛛兰杯膜副冠的细长真花管", cream, [[0.003, 0], [0.004, 0.035], [0.0032, 0.035], [0.0022, 0]], Math.PI * 2, 8); tube.position = { x: root[0], y: root[1], z: root[2] }; parts.push(tube);
    const top: Triple = [root[0], root[1] + 0.035, root[2]], tepals: ModelPart[] = [], stamens: ModelPart[] = [];
    for (let petal = 0; petal < 6; petal++) {
      const b = petal * Math.PI / 3;
      tepals.push(radialBlade("文殊兰从花管顶端自由外展而无杯膜相连的狭长花被", cream, top, 0.007, 0.094, 91, petal * 60));
      const end: Triple = [top[0] + Math.cos(b) * 0.047, top[1] + 0.055, top[2] + Math.sin(b) * 0.047];
      stamens.push(needle("文殊兰远超花管的分离淡红长花丝", "#bba7ad", top, end, 0.0011), lobe("文殊兰每根长花丝末端的细长花药", "#b7ae88", end, [0.003, 0.009, 0.003]));
    }
    parts.push(combineMeshes("文殊兰无膜杯的完整六狭瓣星形花被", cream, tepals), combineMeshes("文殊兰自由分离的六枚长雄蕊", "#bba7ad", stamens));
  }
  return parts;
}

function summerHyacinth(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (let i = 0; i < 8; i++) parts.push(archedGrassBlade("夏风信子从球颈成簇展开的长带叶", [0, 0.01, 0], i * 137.5, 0.51 + i % 2 * 0.1, 0.055, 0.37 + i % 3 * 0.06));
  for (let stalk = 0; stalk < 3; stalk++) {
    const x = (stalk - 1) * 0.07, top = 1.19 + stalk % 2 * 0.16;
    parts.push(tapered("夏风信子远高于叶丛的长无叶花葶", pale, [[x, 0, 0], [x, top, 0]], [0.009, 0.0016]));
    const flowers: ModelPart[] = [];
    for (let flower = 0; flower < 12; flower++) {
      const a = flower * 2.4, y = top - 0.42 + flower * 0.032, root: Triple = [x + Math.cos(a) * 0.037, y - 0.006, Math.sin(a) * 0.037];
      flowers.push(needle("夏风信子长总状序上向外后下弯的小花柄", pale, [x, y, 0], root, 0.0012), smallCorolla(root, [Math.cos(a) * 0.14, -0.98, Math.sin(a) * 0.14], 0.023, 0.008, cream, false, 6, 8));
    }
    for (let i = 0; i < flowers.length; i += 6) parts.push(combineMeshes("夏风信子长总状轴上真正开口下垂的六裂白钟花", cream, flowers.slice(i, i + 6)));
  }
  return parts;
}

function whiteWingstem(): ModelPart[] {
  const parts: ModelPart[] = [tapered("白花翼茎菊高直而带纵向叶基翅的茎", pale, [[0, 0, 0], [0, 1.91, 0]], [0.011, 0.002])];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, y = 0.18 + i * 0.17, span = 0.21 - i * 0.01;
    parts.push(flatLeaf("白花翼茎菊沿高秆互生的宽披针形叶", [0, y, 0], [Math.cos(a) * span, y + 0.035, Math.sin(a) * span], 0.082, "oval", 0.001));
    const wing = flatLeaf("白花翼茎菊叶基沿节间下延的真实狭纵翼", [0, y - 0.15, 0], [0, y + 0.005, 0], 0.025, [[0, 0], [-0.45, 0.09], [-0.5, 0.88], [0, 1], [0.5, 0.88], [0.45, 0.09]], 0.0012); wing.rotation.y = a * 180 / Math.PI; parts.push(wing);
  }
  for (let branch = 0; branch < 8; branch++) {
    const a = branch * 2.4, hub: Triple = [Math.cos(a) * 0.25, 1.79 + branch % 3 * 0.055, Math.sin(a) * 0.25], flowers: ModelPart[] = [needle("白花翼茎菊顶端平展花序的独立分枝轴", pale, [0, 1.45 + branch % 3 * 0.09, 0], hub, 0.0025)];
    for (let head = 0; head < 5; head++) {
      const b = head * 2.4, root: Triple = [hub[0] + Math.cos(b) * 0.023, hub[1] + head % 2 * 0.008, hub[2] + Math.sin(b) * 0.023];
      flowers.push(needle("白花翼茎菊每个小头状花序的短柄", pale, hub, root, 0.001), lobe("白花翼茎菊小花头中央的白色管状花簇", cream, [root[0], root[1] + 0.002, root[2]], [0.009, 0.007, 0.009]));
      for (let ray = 0; ray < 3; ray++) flowers.push(radialBlade("白花翼茎菊每个小头周围少数不等长白舌花", cream, root, 0.0025, 0.011, 83, ray * 120 + head * 27));
    }
    parts.push(combineMeshes("白花翼茎菊带少数白舌花的平顶小头群", cream, flowers));
  }
  return parts;
}

export const herbaceousExpansionBatchEightDesigns: MasterNatureDesign[] = [
  design("fireweedPlant", "柳兰", "植物", fireweed, ["Chamaenerion angustifolium", "Epilobium angustifolium", "互生狭柳叶和四离瓣八雄蕊的长顶花序"]),
  design("treeDahliaPlant", "帝王大丽花", "植物", treeDahlia, ["Dahlia imperialis", "数米高竹节草秆对生羽状大叶与顶生八瓣垂花"]),
  design("mexicanHatPlant", "墨西哥帽花", "植物", mexicanHat, ["Ratibida columnifera", "细分叶与长圆柱盘花轴下的五瓣垂帽檐"]),
  design("sneezeweedPlant", "堆心菊", "植物", sneezeweed, ["Helenium autumnale", "高茎渐狭叶与圆丘花盘周围的三齿黄裙花"]),
  design("goatsRuePlant", "山羊豆", "植物", goatsRue, ["Galega officinalis", "奇数羽状叶和腋生细总状浅紫蝶花序"]),
  design("yellowSweetCloverPlant", "黄花草木樨", "植物", sweetClover, ["Melilotus officinalis", "高细分枝三出齿叶及细长疏小黄蝶花序"]),
  design("crownVetchPlant", "小冠花", "植物", crownVetch, ["Securigera varia", "真实低矮铺地蔓羽状小叶与冠状蝶花球"]),
  design("crinumLilyPlant", "文殊兰", "植物", crinumLily, ["Crinum asiaticum", "宽弧垂叶丛和不具膜杯副冠的长六被六蕊白花"]),
  design("summerHyacinthPlant", "夏风信子", "植物", summerHyacinth, ["Ornithogalum candicans", "Galtonia candicans", "带叶丛上高葶长总状序中的下垂六裂白钟花"]),
  design("whiteWingstemPlant", "白花翼茎菊", "植物", whiteWingstem, ["Verbesina virginica", "真实下延纵翼高秆与平顶少白舌花小头群"]),
];
