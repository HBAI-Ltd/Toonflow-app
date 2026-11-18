import { Vector3 } from "three";
import { combineMeshes, design, lobe, needle, polygon, sweptProfile, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { flatLeaf } from "./ediblePlants";
import { smallCorolla } from "./gardenPerennials";
import { shellTube } from "./invertebrateExpansionBatchOne";
import { radialBlade } from "./herbaceousExpansionBatchOne";
import { curvedTepal, orientFlower } from "./herbaceousExpansionBatchTwelve";

const green = "#83976e";
const pale = "#b0bc96";
const cream = "#d5cfb3";
const pink = "#b7a3b6";
const brown = "#a39178";

// 原创完整米制大草本，不放大矮型，也不把同株斑叶、枯荣或花色作主素材。
// https://www.iplant.cn/bk/6AA16F141E5BE06C
// https://www.nparks.gov.sg/florafaunaweb/flora/5/9/5909
// https://plants.ces.ncsu.edu/plants/peltandra-virginica/
// https://plants.ces.ncsu.edu/plants/dieffenbachia-seguine/
// https://www.nparks.gov.sg/florafaunaweb/flora/1/6/1645
// https://www.nparks.gov.sg/florafaunaweb/flora/4/0/4086
// https://www.rhs.org.uk/plants/8435/hedychium-thyrsiforme/details
// https://elibrary.tucl.edu.np/bitstreams/fde3d01f-c6e0-4c17-922b-e11312e121b6/download
// https://www.iplant.cn/foc/pdf/Marantaceae.pdf
// https://plants.ces.ncsu.edu/plants/monarda-fistulosa/
// https://plants.ces.ncsu.edu/plants/liatris-pycnostachya/
// https://www.rhs.org.uk/plants/23595/helianthus-salicifolius/details/

function whipCobraLily(): ModelPart[] {
  const parts: ModelPart[] = [tapered("曲序南星由叶鞘包叠形成的直立假茎", pale, [[0, 0, 0], [0, 1.02, 0]], [0.02, 0.007])];
  for (let leaf = 0; leaf < 2; leaf++) {
    const a = leaf * 2.5, root: Triple = [Math.cos(a) * 0.09, 0.77 + leaf * 0.22, Math.sin(a) * 0.09], leaves: ModelPart[] = [], axes: ModelPart[] = [];
    parts.push(tapered("曲序南星叶鞘顶端伸出的长复叶柄", pale, [[0, root[1] - 0.16, 0], root], [0.008, 0.003]));
    leaves.push(flatLeaf("曲序南星鸟足复叶中央最长的菱披针小叶", root, [root[0] + Math.cos(a) * 0.26, root[1] + 0.085, root[2] + Math.sin(a) * 0.26], 0.064, "oval", 0.001));
    for (const side of [-1, 1]) {
      const b = a + side * 0.95, joint: Triple = [root[0] + Math.cos(b) * 0.087, root[1] + 0.018, root[2] + Math.sin(b) * 0.087];
      axes.push(needle("曲序南星鸟足叶左右各一条真正分叉的侧叶轴", pale, root, joint, 0.0024));
      for (let leaflet = 0; leaflet < 3; leaflet++) { const c = b + side * (leaflet - 1) * 0.49, length = 0.21 - leaflet * 0.021; leaves.push(flatLeaf("曲序南星在左右侧轴上分出的离生披针小叶", joint, [joint[0] + Math.cos(c) * length, joint[1] + 0.06, joint[2] + Math.sin(c) * length], length * 0.25, "oval", 0.001)); }
    }
    parts.push(combineMeshes("曲序南星中央叶和左右侧轴组成的完整鸟足大叶", green, leaves), combineMeshes("曲序南星真实分叉而不把七片挤成一点的复叶侧轴", pale, axes));
  }
  const root: Triple = [0.095, 0.99, 0.035], sheath = sweptProfile("曲序南星具有真正圆形内腔的短漏斗苞管", pale, [[0.012, 0], [0.015, 0.025], [0.019, 0.055], [0.0176, 0.055], [0.0135, 0.025], [0.0105, 0]], Math.PI * 2, 16);
  sheath.position = { x: root[0], y: root[1], z: root[2] };
  parts.push(tapered("曲序南星从叶柄鞘伸出三十余厘米的花序梗", pale, [[0, 0.62, 0], root], [0.006, 0.004]), sheath, curvedTepal("曲序南星短苞管背侧接出而上端弯覆的卵形檐片", pale, [root[0], root[1] + 0.048, root[2] - 0.017], 90, [[0, 0], [0.004, 0.025], [0.013, 0.055], [0.03, 0.065]], 0.038, [0.4, 0.9, 1, 0.1]), tapered("曲序南星越出喉部后先横伸再突然上举的长鞭肉穗", brown, [[root[0], root[1] + 0.008, root[2]], [root[0], root[1] + 0.06, root[2]], [root[0], root[1] + 0.073, root[2] + 0.065], [root[0], root[1] + 0.21, root[2] + 0.085], [root[0], root[1] + 0.31, root[2] + 0.073]], [0.006, 0.0036, 0.0023, 0.001, 0.0002]));
  return parts;
}

function pricklySwampTaro(): ModelPart[] {
  const parts: ModelPart[] = [lobe("大刺芋低矮而膨大的近地根茎", brown, [0, 0.055, 0], [0.16, 0.12, 0.16])];
  for (let leaf = 0; leaf < 6; leaf++) {
    const a = leaf * 2.4, root: Triple = [Math.cos(a) * 0.16, 0.5 + leaf % 3 * 0.055, Math.sin(a) * 0.16], middle: Triple = [root[0] * 0.54, root[1] * 0.54, root[2] * 0.54], tip: Triple = [root[0] + Math.cos(a) * 0.26, root[1] + 0.31, root[2] + Math.sin(a) * 0.26], stalk = tapered("大刺芋刺叶柄真正接到箭叶凹缺尖而非凹缺下的空隙", pale, [[0, 0.045, 0], middle, root], [0.014, 0.01, 0.0055]), blade = flatLeaf("大刺芋不同于刺芋羽裂叶的完整大箭形叶", root, tip, 0.27, "arrow", 0.0016), spines: ModelPart[] = [];
    parts.push(stalk, blade);
    for (let point = 8; point < 16; point++) { const p = stalk.vertices![point]!, delta = new Vector3(p.x - middle[0], p.y - middle[1], p.z - middle[2]).normalize().multiplyScalar(0.009); spines.push(needle("大刺芋从真实叶柄表面伸出的分立硬刺", brown, [p.x, p.y, p.z], [p.x + delta.x, p.y + delta.y, p.z + delta.z], 0.0016)); }
    const dx = tip[0] - root[0], dy = tip[1] - root[1], dz = tip[2] - root[2], length = Math.hypot(dx, dy, dz), horizontal = Math.hypot(dx, dz), up: Triple = [-dy * dx / (length * horizontal), horizontal / length, -dy * dz / (length * horizontal)];
    for (let spine = 0; spine < 3; spine++) { const t = 0.24 + spine * 0.23, p: Triple = [root[0] + dx * t + up[0] * 0.0015, root[1] + dy * t + up[1] * 0.0015, root[2] + dz * t + up[2] * 0.0015]; spines.push(needle("大刺芋真实叶脉上向外挺起的短刺", brown, p, [p[0] + up[0] * 0.009, p[1] + up[1] * 0.009, p[2] + up[2] * 0.009], 0.0014)); }
    parts.push(combineMeshes("大刺芋刺柄与完整箭叶中肋上相接的硬刺组", brown, spines));
  }
  const root: Triple = [0.045, 0.57, 0.09], spathe = sweptProfile("大刺芋有真实侧开口的长卵形佛焰苞", "#a99898", [[0, 0], [0.016, 0.015], [0.027, 0.055], [0.021, 0.115], [0.004, 0.158], [0.002, 0.156], [0.0196, 0.113], [0.0255, 0.055], [0.0145, 0.016], [0, 0.002]], Math.PI * 1.78, 20);
  spathe.position = { x: root[0], y: root[1], z: root[2] }; spathe.rotation.y = 200;
  parts.push(tapered("大刺芋低于叶冠的独立花梗", pale, [[0, 0.055, 0], root], [0.006, 0.003]), spathe, tapered("大刺芋佛焰苞内约九厘米长的真实肉穗花序", cream, [[root[0], root[1] + 0.014, root[2]], [root[0], root[1] + 0.105, root[2]]], [0.007, 0.0045]));
  return parts;
}

function greenArrowArum(): ModelPart[] {
  const parts: ModelPart[] = [tapered("北美箭叶芋近地慢生的粗短根茎", brown, [[-0.04, 0.025, 0], [0.045, 0.025, 0.01]], [0.02, 0.017])];
  for (let leaf = 0; leaf < 6; leaf++) {
    const a = leaf * 2.4, root: Triple = [Math.cos(a) * 0.11, 0.46 + leaf % 3 * 0.055, Math.sin(a) * 0.11], end: Triple = [root[0] + Math.cos(a) * 0.19, root[1] + 0.255, root[2] + Math.sin(a) * 0.19];
    parts.push(tapered("北美箭叶芋从根茎一直接到箭叶凹缺顶点的长直叶柄", pale, [[0, 0.022, 0], root], [0.009, 0.004]), flatLeaf("北美箭叶芋基部两枚尖侧裂片与中央长尖的窄箭叶", root, end, 0.19, "arrow", 0.0013));
  }
  for (const side of [-1, 1]) {
    const root: Triple = [side * 0.055, 0.56 + (side > 0 ? 0.035 : 0), 0.07], sheath = sweptProfile("北美箭叶芋极狭长并有真实开缝的叶状绿佛焰苞", green, [[0, 0], [0.011, 0.008], [0.015, 0.065], [0.01, 0.145], [0.001, 0.202], [0.0006, 0.2], [0.0089, 0.143], [0.0138, 0.064], [0.0098, 0.009], [0, 0.002]], Math.PI * 1.8, 20), female: ModelPart[] = [], male: ModelPart[] = [];
    sheath.position = { x: root[0], y: root[1], z: root[2] }; sheath.rotation.y = 200;
    parts.push(tapered("北美箭叶芋低于叶尖的独立长花梗", pale, [[0, 0.025, 0], root], [0.006, 0.003]), sheath, tapered("北美箭叶芋佛焰苞内贯穿雌区不育区雄区的细肉穗轴", cream, [[root[0], root[1] + 0.008, root[2]], [root[0], root[1] + 0.152, root[2]]], [0.005, 0.003]));
    for (let flower = 0; flower < 40; flower++) { const a = flower * Math.PI / 4, y = 0.017 + flower / 40 * 0.129, r = 0.005 - (y - 0.008) / 0.144 * 0.002; if (y > 0.045 && y < 0.062) continue; const p = lobe("北美箭叶芋肉穗轴表面真实相接的小单性花", y < 0.045 ? pale : cream, [root[0] + Math.cos(a) * r * 0.93, root[1] + y, root[2] + Math.sin(a) * r * 0.93], [0.002, 0.0026, 0.002]); (y < 0.045 ? female : male).push(p); }
    parts.push(combineMeshes("北美箭叶芋肉穗下方完整雌花区", pale, female), combineMeshes("北美箭叶芋不育空段上方的完整雄花区", cream, male));
  }
  return parts;
}

function dumbCane(): ModelPart[] {
  const parts: ModelPart[] = [tapered("花叶万年青少分枝而肉质粗壮的直立草质秆", pale, [[0, 0, 0], [0, 1.1, 0], [0.015, 2.17, 0]], [0.03, 0.022, 0.012])];
  for (let leaf = 0; leaf < 12; leaf++) {
    const a = leaf * 2.4, y = 0.73 + leaf * 0.12, x = y < 1.1 ? 0 : 0.015 * (y - 1.1) / 1.07, root: Triple = [x + Math.cos(a) * 0.065, y + 0.027, Math.sin(a) * 0.065], span = 0.38 - Math.max(0, leaf - 7) * 0.018, tip: Triple = [root[0] + Math.cos(a) * span, root[1] + 0.084, root[2] + Math.sin(a) * span], veins: ModelPart[] = [], stemRadius = y < 1.1 ? 0.03 - y / 1.1 * 0.008 : 0.022 - (y - 1.1) / 1.07 * 0.01;
    parts.push(tapered("花叶万年青草秆上真实隆起的叶痕节", pale, [[x, y - 0.005, 0], [x, y, 0], [x, y + 0.005, 0]], [stemRadius, stemRadius + 0.002, stemRadius]), tapered("花叶万年青互生大卵叶的短宽鞘叶柄", pale, [[x, y, 0], root], [0.008, 0.004]), flatLeaf("花叶万年青光泽长卵椭圆形而非箭形的宽大叶", root, tip, span * 0.53, "oval", 0.0013));
    const length = Math.hypot(span, 0.084), up: Triple = [-0.084 * Math.cos(a) / length, span / length, -0.084 * Math.sin(a) / length], base: Triple = root.map((v, axis) => v + up[axis]! * 0.001) as Triple, end: Triple = tip.map((v, axis) => v + up[axis]! * 0.001) as Triple;
    veins.push(needle("花叶万年青大叶上真正延伸的浅色中脉", cream, base, end, 0.001));
    for (let vein = 0; vein < 12; vein++) for (const side of [-1, 1]) { const t = 0.13 + vein * 0.062, width = span * 0.53 * (t <= 0.5 ? 0.35 + (t - 0.16) / 0.34 * 0.15 : 0.5 - (t - 0.5) / 0.5 * 0.5) * 0.86, p: Triple = [base[0] + (end[0] - base[0]) * t, base[1] + (end[1] - base[1]) * t, base[2] + (end[2] - base[2]) * t], q: Triple = [p[0] + Math.cos(a) * span * 0.032 - Math.sin(a) * side * width, p[1] + 0.084 * 0.032, p[2] + Math.sin(a) * span * 0.032 + Math.cos(a) * side * width]; veins.push(needle("花叶万年青每叶十二对而非稀少五对的浅色侧脉", cream, p, q, 0.0008)); }
    parts.push(combineMeshes("花叶万年青宽卵叶表面完整相连的浅脉网", cream, veins));
  }
  return parts;
}

function redGinger(): ModelPart[] {
  const parts: ModelPart[] = [tapered("红花月桃在地表相连的粗短根茎", brown, [[-0.07, 0.018, 0], [0.07, 0.018, 0.018]], [0.023, 0.02])], bracts: ModelPart[] = [], flowers: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const x = (shoot - 0.5) * 0.14, z = shoot * 0.018, height = 2.58 + shoot * 0.22, leaves: ModelPart[] = [], sheaths: ModelPart[] = [];
    parts.push(tapered("红花月桃由叠生叶鞘组成并承终端花序的高假茎", pale, [[x, 0.018, z], [x, height + 0.24, z]], [0.024, 0.003]));
    for (let leaf = 0; leaf < 12; leaf++) {
      const a = shoot * 0.72 + leaf % 2 * Math.PI, y = 0.42 + leaf * 0.18, root: Triple = [x + Math.cos(a) * 0.028, y + 0.015, z + Math.sin(a) * 0.028], length = 0.53 - Math.max(0, leaf - 7) * 0.044;
      sheaths.push(tapered("红花月桃相邻叶节间实际包叠的宽基叶鞘", pale, [[x, y - 0.07, z], [x, y, z], root], [0.023, 0.019, 0.003]));
      leaves.push(flatLeaf("红花月桃沿假茎两列交替的整缘长尖椭圆叶", root, [root[0] + Math.cos(a) * length, root[1] + 0.12, root[2] + Math.sin(a) * length], 0.13, "oval", 0.0015));
    }
    parts.push(combineMeshes("红花月桃两列大叶的完整绿色叶幕", green, leaves), combineMeshes("红花月桃完整相叠的包茎叶鞘", pale, sheaths));
    for (let bract = 0; bract < 36; bract++) {
      const a = bract * 137.5, y = height + bract * 0.0061, reach = 0.052 * Math.sin((bract / 36 * 0.87 + 0.11) * Math.PI), root: Triple = [x, y, z];
      bracts.push(curvedTepal("红花月桃螺旋叠成直立终端锥而非基生花序的红尖苞", "#b59898", root, a, [[0, 0], [reach * 0.55, 0.016], [reach, 0.041], [reach * 0.9, 0.066]], 0.033, [0.38, 1, 0.68, 0.015]));
    }
    for (let flower = 0; flower < 4; flower++) {
      const a = flower * 1.9, root: Triple = [x + Math.cos(a) * 0.018, height + 0.07 + flower * 0.032, z + Math.sin(a) * 0.018];
      pedicels.push(needle("红花月桃红苞间的小白花与花序中轴实际相接的细柄", pale, [x, root[1] - 0.008, z], root, 0.0011));
      flowers.push(smallCorolla(root, [Math.cos(a), 0.38, Math.sin(a)], 0.023, 0.003, cream, true, 5, 8));
    }
  }
  for (let i = 0; i < bracts.length; i += 24) parts.push(combineMeshes("红花月桃保留叠层间隙的直立红苞花锥", "#b59898", bracts.slice(i, i + 24)));
  for (let i = 0; i < flowers.length; i += 4) parts.push(combineMeshes("红花月桃从红苞间伸出的狭小不等裂白花", cream, flowers.slice(i, i + 4)));
  parts.push(combineMeshes("红花月桃全部小白花与花轴的真实连接细柄", pale, pedicels));
  return parts;
}

function arrowroot(): ModelPart[] {
  const parts: ModelPart[] = [tapered("竹芋在地下横生而抽出草茎的短根茎", brown, [[-0.065, 0.01, 0], [0.065, 0.01, 0]], [0.014, 0.012])], leaves: ModelPart[] = [], petioles: ModelPart[] = [], pulvini: ModelPart[] = [], flowers: ModelPart[] = [], sepals: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let shoot = 0; shoot < 4; shoot++) {
    const x = (shoot - 1.5) * 0.035, z = shoot % 2 * 0.027, height = 0.82 + shoot * 0.044;
    parts.push(tapered("竹芋物种型一米内且上段细分枝的直立草茎", pale, [[x, 0.012, 0], [x, height * 0.62, z], [x + 0.018, height, z]], [0.0055, 0.0035, 0.001]));
    for (let leaf = 0; leaf < 5; leaf++) {
      const a = shoot * 0.8 + leaf % 2 * Math.PI, y = 0.12 + leaf * 0.12, stemX = y < height * 0.62 ? x : x + 0.018 * (y / height - 0.62) / 0.38, stemZ = y < height * 0.62 ? z * y / (height * 0.62) : z, root: Triple = [stemX + Math.cos(a) * 0.045, y + 0.035, stemZ + Math.sin(a) * 0.045], span = 0.23 - leaf * 0.014;
      petioles.push(needle("竹芋两列交替大叶的短圆柄", pale, [stemX, y, stemZ], root, 0.003)); pulvini.push(lobe("竹芋叶柄顶端而非茎节处真实膨大的叶枕", pale, root, [0.007, 0.009, 0.007]));
      leaves.push(flatLeaf("竹芋物种型没有栽培斑纹的长尖卵状长圆叶", root, [root[0] + Math.cos(a) * span, root[1] + 0.046, root[2] + Math.sin(a) * span], 0.065, "oval", 0.001));
    }
    for (const side of [-1, 1]) {
      const base: Triple = [x + 0.012, height - 0.08, z], root: Triple = [x + 0.018 + side * 0.024, height + 0.012, z], body: ModelPart[] = [smallCorolla([0, 0, 0], [0, 1, 0], 0.013, 0.002, cream, false, 3, 8)];
      pedicels.push(needle("竹芋顶部分叉小白花的实际细梗", pale, base, root, 0.0011));
      for (const heading of [30, 150]) body.push(radialBlade("竹芋三裂花冠内较大的两枚外轮瓣化退化雄蕊", cream, [0, 0.011, 0], 0.006, 0.009, 62, heading));
      body.push(curvedTepal("竹芋小花内围护花柱的兜状退化雄蕊", cream, [0, 0.011, 0], 270, [[0, 0], [0.001, 0.004], [0.003, 0.006], [0.004, 0.004]], 0.0038, [0.3, 1, 1, 0.2]), needle("竹芋小花内唯一能育雄蕊的短丝", cream, [0, 0.008, 0], [0.001, 0.016, 0], 0.0007), lobe("竹芋唯一能育雄蕊上的半花药", cream, [0.001, 0.016, 0], [0.0015, 0.002, 0.0015]));
      flowers.push(orientFlower(combineMeshes("竹芋真三裂管冠与不对称瓣化内器官的小花", cream, body), root, [side * 0.4, 0.8, 0.3]));
      const calyx: ModelPart[] = [];
      for (let sepal = 0; sepal < 3; sepal++) calyx.push(radialBlade("竹芋白花外侧真实分离的三枚狭长绿萼", green, [0, 0, 0], 0.0025, 0.013, 14, sepal * 120));
      sepals.push(orientFlower(combineMeshes("竹芋保留三枚相互方位的完整狭绿萼", green, calyx), root, [side * 0.4, 0.8, 0.3]));
    }
  }
  parts.push(combineMeshes("竹芋根茎各草茎上完整的两列绿叶", green, leaves), combineMeshes("竹芋所有大叶的实际相连短叶柄", pale, petioles), combineMeshes("竹芋大叶基部明确可见的独立叶枕", pale, pulvini), combineMeshes("竹芋顶端各小白花与草茎相连的细梗", pale, pedicels), combineMeshes("竹芋小白花外围的三萼组", green, sepals));
  for (let i = 0; i < flowers.length; i += 3) parts.push(combineMeshes("竹芋枝端真正不对称的三裂小白花", cream, flowers.slice(i, i + 3)));
  return parts;
}

function pincushionGingerFlower(root: Triple, heading: number): ModelPart[] {
  const body: ModelPart[] = [shellTube("圆锥姜花纤细而真实中空的长白花管", [[0, 0, 0], [0, 0.016, 0], [0, 0.035, 0.001]], [0.0012, 0.0014, 0.0018], 0.0005, cream)];
  for (let lobe = 0; lobe < 3; lobe++) body.push(curvedTepal("圆锥姜花长线形且末端向后返弯的三枚花冠裂片", cream, [0, 0.034, 0.001], lobe * 120 + 30, [[0, 0], [0.014, 0.006], [0.029, 0.003], [0.034, -0.006]], 0.0025, [0.5, 1, 0.7, 0.02]));
  for (const side of [-1, 1]) body.push(curvedTepal("圆锥姜花不是宽蝶翼的两枚狭线侧退化雄蕊", cream, [0, 0.034, 0.001], side > 0 ? 0 : 180, [[0, 0], [0.012, 0.006], [0.024, 0.012], [0.027, 0.017]], 0.0035, [0.4, 1, 0.8, 0.1]));
  const lipRoot: Triple = [0, 0.034, -0.0005], fork: Triple = [0, 0.04, -0.009];
  body.push(needle("圆锥姜花深二裂唇瓣的共同短瓣柄", cream, lipRoot, fork, 0.0021));
  for (const side of [-1, 1]) body.push(curvedTepal("圆锥姜花超过半长分开的两枚反弯细唇瓣", cream, fork, 270 + side * 17, [[0, 0], [0.008, 0.002], [0.015, -0.001], [0.016, -0.006]], 0.0038, [0.4, 1, 0.7, 0.04]));
  const stamens: ModelPart[] = [needle("圆锥姜花单长雄蕊从管内上达弯点的细段", cream, [0, 0.004, 0.0005], [0, 0.042, 0.005], 0.0011), needle("圆锥姜花显著长于唇瓣的五厘米外伸雄蕊端段", cream, [0, 0.042, 0.005], [0, 0.081, 0.011], 0.0009), lobe("圆锥姜花单长雄蕊末端横置的独立长花药", cream, [0, 0.081, 0.011], [0.009, 0.0016, 0.0018])], a = heading * Math.PI / 180, direction: Triple = [Math.cos(a), 0.33, Math.sin(a)];
  return [orientFlower(combineMeshes("圆锥姜花细管三线裂片两细侧瓣与深二裂唇的整花", cream, body), root, direction), orientFlower(combineMeshes("圆锥姜花完整单长雄蕊及横置花药", cream, stamens), root, direction)];
}

function pincushionGinger(): ModelPart[] {
  const parts: ModelPart[] = [tapered("圆锥姜花两个假茎由同一粗短根茎抽出", brown, [[-0.055, 0.018, 0], [0.055, 0.018, 0]], [0.022, 0.018])], bracts: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [], petioles: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const x = (shoot - 0.5) * 0.11, height = 1.72 + shoot * 0.17, leaves: ModelPart[] = [];
    parts.push(tapered("圆锥姜花两列叶鞘套叠成的直立假茎", pale, [[x, 0.018, 0], [x, height + 0.12, 0]], [0.017, 0.002]));
    for (let leaf = 0; leaf < 10; leaf++) {
      const a = shoot * 0.85 + leaf % 2 * Math.PI, y = 0.22 + leaf * 0.143, root: Triple = [x + Math.cos(a) * 0.015, y + 0.01, Math.sin(a) * 0.015];
      petioles.push(needle("圆锥姜花假茎与叶片基部真实相接的短叶柄", pale, [x, y, 0], root, 0.0025));
      leaves.push(flatLeaf("圆锥姜花两列大而宽的长尾尖披针椭圆叶", root, [root[0] + Math.cos(a) * 0.32, root[1] + 0.055, root[2] + Math.sin(a) * 0.32], 0.085, "oval", 0.0012));
    }
    parts.push(combineMeshes("圆锥姜花高假茎上的完整两列大叶", green, leaves));
    for (let bract = 0; bract < 12; bract++) {
      const heading = bract * 137.5, a = heading * Math.PI / 180, y = height - 0.08 + bract * 0.016, root: Triple = [x + Math.cos(a) * 0.004, y, Math.sin(a) * 0.004], sheath = sweptProfile("圆锥姜花真正卷叠而有侧缝的绿色狭苞筒", green, [[0.0023, 0], [0.0045, 0.013], [0.0033, 0.022], [0.0026, 0.0215], [0.0038, 0.013], [0.0016, 0]], Math.PI * 1.7, 8);
      sheath.position = { x: root[0], y: root[1], z: root[2] }; sheath.rotation.y = 90 - heading; bracts.push(sheath);
      for (let flower = 0; flower < 2; flower++) {
        const b = a + flower * 0.29, at: Triple = [root[0] + Math.cos(b) * 0.003, y + 0.013, root[2] + Math.sin(b) * 0.003], pair = pincushionGingerFlower(at, heading + flower * 17);
        flowers.push(pair[0]!); stamens.push(pair[1]!); pedicels.push(needle("圆锥姜花每枚卷苞内实际连到穗轴的两朵花短柄", pale, [x, y, 0], at, 0.001));
      }
    }
  }
  for (let i = 0; i < bracts.length; i += 8) parts.push(combineMeshes("圆锥姜花绿针垫状长穗的真实卷苞", green, bracts.slice(i, i + 8)));
  parts.push(combineMeshes("圆锥姜花全部短花柄与花轴的实际连接", pale, pedicels), combineMeshes("圆锥姜花两列大叶与假茎相连的短叶柄", pale, petioles));
  for (let i = 0; i < flowers.length; i += 2) parts.push(combineMeshes("圆锥姜花保留线花被和深裂细唇的奶白花组", cream, flowers.slice(i, i + 2)));
  for (let i = 0; i < stamens.length; i += 20) parts.push(combineMeshes("圆锥姜花各细花中真正单根外伸的雄蕊组", cream, stamens.slice(i, i + 20)));
  return parts;
}

function wildBergamotFlower(root: Triple, heading: number): ModelPart[] {
  const body: ModelPart[] = [shellTube("蜂香薄荷狭长而真中空的双唇花冠管", [[0, 0, 0], [0, 0.014, 0], [0, 0.023, 0]], [0.001, 0.0012, 0.0018], 0.0004, pink), curvedTepal("蜂香薄荷向上拱起并护住细蕊的完整窄上唇", pink, [0, 0.022, 0.0014], 90, [[0, 0], [0.001, 0.006], [0.003, 0.009], [0.004, 0.007]], 0.0024, [0.8, 1, 0.85, 0.2])], stamens: ModelPart[] = [];
  for (const heading of [210, 270, 330]) body.push(radialBlade("蜂香薄荷明确下向而与窄上唇分开的三裂下唇", pink, [0, 0.0225, -0.001], 0.002, heading === 270 ? 0.0045 : 0.003, 75, heading));
  for (const side of [-1, 1]) { const tip: Triple = [side * 0.00065, 0.035, 0.003]; stamens.push(needle("蜂香薄荷明确两枚而非四枚的外伸雄蕊", cream, [side * 0.0004, 0.004, 0.0005], tip, 0.00065), lobe("蜂香薄荷两根外伸雄蕊顶端的细花药", cream, tip, [0.0009, 0.002, 0.0009])); }
  const a = heading * Math.PI / 180, direction: Triple = [Math.cos(a) * 0.64, 0.78, Math.sin(a) * 0.64];
  return [orientFlower(combineMeshes("蜂香薄荷狭管完整上唇与三裂下唇的单花", pink, body), root, direction), orientFlower(combineMeshes("蜂香薄荷一朵双唇花中的两枚长雄蕊", cream, stamens), root, direction)];
}

function wildBergamot(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [], petioles: ModelPart[] = [], bracts: ModelPart[] = [], flowers: ModelPart[] = [], stamens: ModelPart[] = [], pedicels: ModelPart[] = [], teeth: [number, number][] = [[0, 0], [-0.22, 0.14], [-0.3, 0.23], [-0.25, 0.25], [-0.42, 0.34], [-0.32, 0.37], [-0.5, 0.47], [-0.37, 0.49], [-0.43, 0.6], [-0.3, 0.61], [-0.3, 0.73], [-0.2, 0.73], [0, 1], [0.2, 0.73], [0.3, 0.73], [0.3, 0.61], [0.43, 0.6], [0.37, 0.49], [0.5, 0.47], [0.32, 0.37], [0.42, 0.34], [0.25, 0.25], [0.3, 0.23], [0.22, 0.14]];
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.055, z = shoot % 2 * 0.025, height = 1.01 + shoot * 0.065;
    parts.push(polygon("蜂香薄荷有真实方孔而非实心方柱的草质长秆", pale, [[-0.004, -0.004], [0.004, -0.004], [0.004, 0.004], [-0.004, 0.004]], height, [x, 0, z], [[[-0.002, -0.002], [0.002, -0.002], [0.002, 0.002], [-0.002, 0.002]]]), lobe("蜂香薄荷顶生花冠球内真实相接的花托核心", pale, [x, height, z], [0.027, 0.019, 0.027]));
    for (let node = 0; node < 4; node++) for (const side of [-1, 1]) {
      const a = node % 2 * Math.PI / 2 + (side < 0 ? Math.PI : 0) + shoot * 0.3, y = 0.12 + node * 0.18, root: Triple = [x + Math.cos(a) * 0.012, y + 0.007, z + Math.sin(a) * 0.012];
      petioles.push(needle("蜂香薄荷四棱茎每节对生齿叶的短柄", pale, [x, y, z], root, 0.0017)); leaves.push(flatLeaf("蜂香薄荷交互对生而具实际粗齿的尖卵形叶", root, [root[0] + Math.cos(a) * 0.105, root[1] + 0.024, root[2] + Math.sin(a) * 0.105], 0.047, teeth, 0.0007));
    }
    for (let bract = 0; bract < 8; bract++) bracts.push(radialBlade("蜂香薄荷终端冠状花序下的绿披针苞叶", green, [x, height - 0.007, z], 0.012, 0.035, 100, bract * 45));
    for (let flower = 0; flower < 20; flower++) {
      const a = flower * 2.4, root: Triple = [x + Math.cos(a) * 0.011, height + 0.003 + flower % 3 * 0.001, z + Math.sin(a) * 0.011], pair = wildBergamotFlower(root, a * 180 / Math.PI);
      pedicels.push(needle("蜂香薄荷冠花短柄在花托和每条花管之间真实连接", pale, [x, height, z], root, 0.0007)); flowers.push(pair[0]!); stamens.push(pair[1]!);
    }
  }
  for (let i = 0; i < leaves.length; i += 8) parts.push(combineMeshes("蜂香薄荷完整交互对生粗锯齿叶组", green, leaves.slice(i, i + 8)));
  parts.push(combineMeshes("蜂香薄荷所有对生叶与方秆实际连接的短柄", pale, petioles), combineMeshes("蜂香薄荷各冠花下的完整绿色苞轮", green, bracts), combineMeshes("蜂香薄荷各双唇花与花托实际连接的短柄", pale, pedicels));
  for (let i = 0; i < flowers.length; i += 5) parts.push(combineMeshes("蜂香薄荷组成顶冠的完整狭双唇小花", pink, flowers.slice(i, i + 5)));
  for (let i = 0; i < stamens.length; i += 14) parts.push(combineMeshes("蜂香薄荷所有小花中明确成对的长雄蕊组", cream, stamens.slice(i, i + 14)));
  return parts;
}

function prairieBlazingStar(): ModelPart[] {
  const parts: ModelPart[] = [lobe("草原蛇鞭菊一株多花茎共同抽出的低矮根颈", brown, [0, 0.018, 0], [0.065, 0.045, 0.055])], leaves: ModelPart[] = [], bracts: ModelPart[] = [], budBracts: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let shoot = 0; shoot < 2; shoot++) {
    const x = (shoot - 0.5) * 0.047, height = 1.35 + shoot * 0.11;
    parts.push(tapered("草原蛇鞭菊自球根直立且沿茎密叶的长花秆", pale, [[x, 0.018, 0], [x, height, 0]], [0.0055, 0.0014]));
    for (let leaf = 0; leaf < 26; leaf++) { const y = 0.035 + leaf * 0.042, span = 0.23 - leaf * 0.0072; leaves.push(radialBlade("草原蛇鞭菊螺旋密生且由下向上渐短的狭线叶", green, [x, y, 0], 0.0075 - leaf * 0.0002, span, 60 + leaf % 3 * 10, leaf * 137.5)); }
    for (let head = 0; head < 12; head++) {
      const a = head * 2.4, root: Triple = [x + Math.cos(a) * 0.007, height - 0.58 + head * 0.049, Math.sin(a) * 0.007], open = head >= 3;
      pedicels.push(needle("草原蛇鞭菊沿高穗排列小头花序的真实短柄", pale, [x, root[1] - 0.003, 0], root, 0.0013), lobe("草原蛇鞭菊小头花序内实际承花的总苞核心", green, [root[0], root[1] + 0.003, root[2]], [0.009, 0.009, 0.009]));
      for (let bract = 0; bract < 6; bract++) (open ? bracts : budBracts).push(radialBlade("草原蛇鞭菊每小头外真实相叠且有长尖的总苞片", open ? "#a39b9e" : green, root, 0.003, 0.012, 24, bract * 60));
      if (!open) continue;
      const florets: ModelPart[] = [];
      for (let flower = 0; flower < 3; flower++) {
        const b = flower * Math.PI * 2 / 3, p: Triple = [root[0] + Math.cos(b) * 0.0022, root[1] + 0.006, root[2] + Math.sin(b) * 0.0022];
        florets.push(smallCorolla(p, [Math.cos(b) * 0.15, 1, Math.sin(b) * 0.15], 0.004, 0.0014, pink, false, 5, 8));
        const elbow: Triple = [p[0] + Math.cos(b) * 0.0015, p[1] + 0.011, p[2] + Math.sin(b) * 0.0015];
        florets.push(needle("草原蛇鞭菊每管花在柱头分叉前唯一的共同细花柱", pink, [p[0], p[1] + 0.003, p[2]], elbow, 0.00055));
        for (const side of [-1, 1]) {
          const bend: Triple = [elbow[0] - Math.sin(b) * side * 0.003, p[1] + 0.015, elbow[2] + Math.cos(b) * side * 0.003], tip: Triple = [bend[0] - Math.sin(b) * side * 0.001, p[1] + 0.013, bend[2] + Math.cos(b) * side * 0.001];
          florets.push(needle("草原蛇鞭菊花柱分出的两枝柱头实际弯开的中段", pink, elbow, bend, 0.0005), needle("草原蛇鞭菊长柱头末端真正回弯的短段", pink, bend, tip, 0.0004));
        }
      }
      parts.push(combineMeshes("草原蛇鞭菊从高穗上段先开的无舌花五裂长柱小头", pink, florets));
    }
  }
  for (let i = 0; i < leaves.length; i += 30) parts.push(combineMeshes("草原蛇鞭菊完整由长到短的密集螺旋狭叶", green, leaves.slice(i, i + 30)));
  for (let i = 0; i < bracts.length; i += 42) parts.push(combineMeshes("草原蛇鞭菊小头下全部实际长尖总苞片", "#a39b9e", bracts.slice(i, i + 42)));
  parts.push(combineMeshes("草原蛇鞭菊高穗下段仍未开放的小头绿色长尖总苞", green, budBracts));
  for (let i = 0; i < pedicels.length; i += 24) parts.push(combineMeshes("草原蛇鞭菊花轴小头总苞与短柄的实际连接", green, pedicels.slice(i, i + 24)));
  return parts;
}

function willowLeafSunflower(): ModelPart[] {
  const parts: ModelPart[] = [], leaves: ModelPart[] = [], pedicels: ModelPart[] = [];
  for (let shoot = 0; shoot < 3; shoot++) {
    const x = (shoot - 1) * 0.05, z = shoot % 2 * 0.028, height = 2.02 + shoot * 0.075;
    parts.push(tapered("柳叶向日葵沿秆密生极狭长叶的高直草茎", pale, [[x, 0, z], [x, height, z]], [0.007, 0.0017]));
    for (let leaf = 0; leaf < 20; leaf++) leaves.push(curvedTepal("柳叶向日葵不是大心叶而是弧垂成丝的狭柳叶", green, [x, 0.12 + leaf * 0.09, z], leaf * 137.5, [[0, 0], [0.07, 0.025], [0.15, 0.009], [0.22, -0.028]], 0.0095, [0.1, 0.75, 1, 0.02]));
    for (const side of [-1, 1]) {
      const root: Triple = [x + side * 0.12, height + 0.045, z + 0.025], florets: ModelPart[] = [lobe("柳叶向日葵小黄头中央棕色凸起的真实花托", brown, [root[0], root[1] + 0.001, root[2]], [0.023, 0.009, 0.023])], rays: ModelPart[] = [], involucre: ModelPart[] = [];
      pedicels.push(tapered("柳叶向日葵顶端喷散开小花头的实际细分枝", pale, [[x, height - 0.19, z], [x + side * 0.09, height + 0.018, z + 0.02], root], [0.0026, 0.0014, 0.001]));
      for (let ray = 0; ray < 14; ray++) { const a = ray * Math.PI / 7; rays.push(radialBlade("柳叶向日葵围绕小棕心的独立黄色长舌状花", "#c8bd91", [root[0] + Math.cos(a) * 0.01, root[1] + 0.002, root[2] + Math.sin(a) * 0.01], 0.0065, 0.02, 96, ray * 180 / 7)); }
      for (let flower = 0; flower < 20; flower++) { const a = flower * 2.4, r = Math.sqrt(flower / 20) * 0.01; florets.push(lobe("柳叶向日葵小棕花盘上每粒实际相接的管花", brown, [root[0] + Math.cos(a) * r, root[1] + 0.005, root[2] + Math.sin(a) * r], [0.0024, 0.003, 0.0024])); }
      for (let bract = 0; bract < 8; bract++) involucre.push(radialBlade("柳叶向日葵小花托下面紧贴的狭绿总苞片", green, [root[0], root[1] - 0.003, root[2]], 0.004, 0.012, 105, bract * 45));
      parts.push(combineMeshes("柳叶向日葵真实五至七厘米小花头的黄舌花圈", "#c8bd91", rays), combineMeshes("柳叶向日葵小花头的凸花托和独立棕管花", brown, florets), combineMeshes("柳叶向日葵小黄头下完整绿总苞", green, involucre));
    }
  }
  for (let i = 0; i < leaves.length; i += 30) parts.push(combineMeshes("柳叶向日葵保留实际弧垂曲率的全部密集狭柳叶", green, leaves.slice(i, i + 30)));
  parts.push(combineMeshes("柳叶向日葵顶端小黄头全部真实分枝细梗", pale, pedicels));
  return parts;
}

export const herbaceousExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("whipCobraLilyPlant", "曲序南星", "植物", whipCobraLily, ["Arisaema tortuosum", "鸟足复叶短苞管与先横伸再上举的长鞭肉穗"]),
  design("pricklySwampTaroPlant", "大刺芋", "植物", pricklySwampTaro, ["Cyrtosperma merkusii", "Cyrtosperma lasioides", "原尺寸完整箭叶及真实长刺柄和叶脉短刺"]),
  design("greenArrowArumPlant", "北美箭叶芋", "植物", greenArrowArum, ["Peltandra virginica", "窄箭叶狭开缝长苞与雌花不育裸段雄花分区肉穗"]),
  design("dumbCanePlant", "花叶万年青", "植物", dumbCane, ["Dieffenbachia seguine", "Dieffenbachia amoena", "Dieffenbachia maculata", "Dieffenbachia picta", "少枝粗节草秆互生大卵叶与多对浅色侧脉"]),
  design("redGingerPlant", "红花月桃", "植物", redGinger, ["Alpinia purpurata", "高假茎两列长叶与直立终端叠红尖苞花锥"]),
  design("arrowrootPlant", "竹芋", "植物", arrowroot, ["Maranta arundinacea", "物种型短分枝草茎两列卵叶顶叶枕与不对称小白花"]),
  design("pincushionGingerPlant", "圆锥姜花", "植物", pincushionGinger, ["Hedychium thyrsiforme", "Hedychium heteromallum", "Hedychium tocucho", "卷苞针垫穗狭线花冠深二裂反弯唇与单长雄蕊"]),
  design("wildBergamotPlant", "蜂香薄荷", "植物", wildBergamot, ["Monarda fistulosa", "真中空方秆对生齿叶与窄上唇三裂下唇双蕊冠花"]),
  design("prairieBlazingStarPlant", "草原蛇鞭菊", "植物", prairieBlazingStar, ["Liatris pycnostachya", "密狭叶高穗从上往下开无舌小头及长回弯双柱头"]),
  design("willowLeafSunflowerPlant", "柳叶向日葵", "植物", willowLeafSunflower, ["Helianthus salicifolius", "Helianthus orgyalis", "Helianthus salicifolius var. orgyalis", "高直秆密集丝状弧垂柳叶与喷散小棕心黄头花"]),
];
