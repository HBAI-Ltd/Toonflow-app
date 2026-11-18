import { cap, combineMeshes, design, leaf, lobe, needle, part, petals, polygon, tapered } from "./shared";
import type { MasterNatureDesign, ModelPart, Triple } from "./shared";
import { compoundLeaf, flatLeaf } from "./ediblePlants";
import { leafyShoot } from "./woodyExpansionBatchOne";
import { featherCrown } from "./woodyExpansionBatchTwo";
import { buttresses, canopy, forestCrown } from "./woodyExpansionBatchThree";
import { fiveLobedCalyx } from "./woodyExpansionBatchFour";

const bark = "#a3977b";
const green = "#879c73";
const pale = "#bdc5a2";
const fruitColor = "#b4a487";
const flowerColor = "#d1c7ac";
const serrate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.22, .12], [-.45, .3], [-.31, .41], [-.5, .57], [-.29, .68], [0, 1], [.29, .68], [.5, .57], [.31, .41], [.45, .3], [.22, .12]];

function mix(a: Triple, b: Triple, t: number): Triple { return a.map((value, axis) => value + (b[axis]! - value) * t) as Triple; }

function trifoliateCrown(height: number, span: number, length: number, width: number, droop = 0): { parts: ModelPart[]; tips: Triple[] } {
  const parts: ModelPart[] = [tapered("三出叶木本完整而连续的木质主干", bark, [[0, 0, 0], [.03, height * .48, 0], [0, height, 0]], [height * .035, height * .022, .008])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, height * (.35 + axis * .05), 0], end: Triple = [Math.cos(a) * span, height * (.76 + axis % 3 * .08), Math.sin(a) * span]; tips.push(end); parts.push(tapered("承托真实三出叶的木质侧枝", bark, [root, end], [height * .014, .003]));
    for (let node = 0; node < 3; node++) { const p = mix(root, end, .62 + node * .17), b = a + (node - 1) * .7, q: Triple = [p[0] + Math.cos(b) * .03, p[1] + .008, p[2] + Math.sin(b) * .03], leaves: ModelPart[] = [needle("一片三出复叶真正共用的叶柄", green, p, q, .002)]; for (let blade = 0; blade < 3; blade++) { const c = b + (blade - 1) * 1.05, base = blade === 1 ? [q[0] + Math.cos(b) * .018, q[1], q[2] + Math.sin(b) * .018] as Triple : q, reach = blade === 1 ? length : length * .75; if (blade === 1) leaves.push(needle("三出复叶中叶较长的独立小叶柄", green, q, base, .001)); leaves.push(flatLeaf("三出复叶中实际相接且中叶较大的独立叶片", base, [base[0] + Math.cos(c) * reach, base[1] + reach * .12 - droop, base[2] + Math.sin(c) * reach], width, "oval", .001)); } parts.push(combineMeshes("一整片具有长中叶柄的真实三出复叶", green, leaves)); }
  }
  parts.push(canopy(tips, span * .94, height * .18)); return { parts, tips };
}

function sichuanPepperTree(): ModelPart[] {
  const { parts, tips } = featherCrown(6.8, 2.7, .24, 3, false, true, 2, serrate), spines: ModelPart[] = []; parts.push(canopy(tips, 2.7, 1.8));
  for (const tip of tips) {
    const seeds: ModelPart[] = [], stems: ModelPart[] = [];
    for (let follicle = 0; follicle < 3; follicle++) { const a = follicle * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .009, tip[1] - .015, tip[2] + Math.sin(a) * .009]; stems.push(needle("花椒聚合果中各个蓇葖的独立短柄", bark, tip, p, .001)); parts.push(part("花椒真实纵裂而中空的微小红色果皮", "lathe", "#b39a85", p, [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .001, y: 0 }, { x: .003, y: .0035 }, { x: .0024, y: .004 }, { x: .0007, y: .001 }, { x: 0, y: .001 }] })); seeds.push(lobe("花椒裂开的果皮内真实露出的黑色单种子", "#7b856f", [p[0], p[1] + .0026, p[2]], [.0026, .003, .0026])); }
    parts.push(combineMeshes("花椒完整小型聚合果的全部果柄", bark, stems), combineMeshes("花椒开放果皮内各自独立的真实黑种子", "#7b856f", seeds)); for (const side of [-1, 1]) spines.push(needle("花椒木质冠枝上成对的硬皮刺", bark, tip, [tip[0] + side * .03, tip[1] + .015, tip[2]], .005));
  }
  parts.push(combineMeshes("花椒整株真实相接的冠枝硬皮刺", bark, spines)); return parts;
}

function orangeJasmine(): ModelPart[] {
  const { parts, tips } = featherCrown(7.5, 2.8, .16, 2, false, true, 2, "oval"); parts.push(canopy(tips, 2.8, 2));
  for (const tip of tips) {
    const flowers: ModelPart[] = [], stems: ModelPart[] = [], fruits: ModelPart[] = [];
    for (let flower = 0; flower < 4; flower++) { const a = flower * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * .022, tip[1] + .025, tip[2] + Math.sin(a) * .022]; stems.push(needle("九里香枝端聚伞花序的独立细柄", green, tip, p, .0015)); flowers.push(petals(5, p, .004, .009, 82, flowerColor)); }
    for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .012, tip[1] - .018, tip[2]]; stems.push(needle("九里香长卵形小浆果的真实短柄", bark, tip, p, .0012)); fruits.push(lobe("九里香羽叶旁独立的长卵形小浆果", "#b39f85", p, [.009, .014, .009])); }
    parts.push(combineMeshes("九里香花和小浆果真实相连的短柄", green, stems), combineMeshes("九里香完整五瓣白色小花簇", flowerColor, flowers), combineMeshes("九里香实际独立的长卵小果", "#b39f85", fruits));
  }
  return parts;
}

function baelTree(): ModelPart[] {
  const { parts, tips } = trifoliateCrown(12.5, 4.4, .09, .048), spines: ModelPart[] = [];
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] - .04, tip[2]]; parts.push(needle("木橘粗硬大球果的真实粗短柄", bark, tip, p, .006), lobe("木橘三出叶下面包有硬壳的大圆肉果", fruitColor, [p[0], p[1] - .055, p[2]], [.13, .14, .13])); spines.push(needle("木橘老枝上真实硬直木质刺", bark, tip, [tip[0] + .05, tip[1] + .02, tip[2]], .007)); }
  parts.push(combineMeshes("木橘整株冠枝的真实木质硬刺", bark, spines)); return parts;
}

function woodApple(): ModelPart[] {
  const { parts, tips } = featherCrown(9.5, 3.3, .18, 2, false, true, 2, "oval"); parts.push(canopy(tips, 3.3, 2.5));
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] - .055, tip[2]], body = lobe("象橘完整圆球状坚硬粗糙果壳", fruitColor, p, [.08, .083, .08]), bumps: ModelPart[] = [body]; for (const v of body.vertices!) bumps.push(lobe("象橘灰褐硬果壳表面真实的细粗糙隆点", fruitColor, [p[0] + v.x * .08, p[1] + v.y * .083, p[2] + v.z * .08], [.008, .008, .008])); parts.push(needle("象橘圆硬果的独立短粗果柄", bark, tip, [p[0], p[1] + .033, p[2]], .004), combineMeshes("象橘同一真实硬果壳连续的粗糙表面", fruitColor, bumps)); }
  return parts;
}

function wampee(): ModelPart[] {
  const { parts, tips } = featherCrown(11.5, 3.8, .43, 4, false, true, 2, "oval"); parts.push(canopy(tips, 3.8, 2.8));
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 20; fruit++) { const a = fruit * 2.4, t = (fruit + 1) / 21, r = Math.sin(t * Math.PI) * .065, p: Triple = [tip[0] + Math.cos(a) * r, tip[1] - .025 - t * .19, tip[2] + Math.sin(a) * r]; stems.push(needle("黄皮圆锥果序中每枚果实的分离细柄", bark, tip, p, .0018)); fruits.push(lobe("黄皮羽叶下面成穗排列的近卵圆小果", fruitColor, p, [.02, .026, .02])); } parts.push(combineMeshes("黄皮整穗二十枚果实全部相连的分枝柄", bark, stems), combineMeshes("黄皮真实整穗独立卵圆肉果", fruitColor, fruits)); }
  return parts;
}

function tetradium(): ModelPart[] {
  const parts: ModelPart[] = [tapered("吴茱萸成对大羽叶以下的直立木质干", bark, [[0, 0, 0], [.03, 4.5, 0], [0, 10.8, 0]], [.31, .17, .007])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) { const a = axis * 2.4, root: Triple = [0, 3.8 + axis * .3, 0], end: Triple = [Math.cos(a) * 3.6, 8.8 + axis % 3 * .65, Math.sin(a) * 3.6]; tips.push(end); parts.push(tapered("吴茱萸承托真正对生整羽叶的木质侧枝", bark, [root, end], [.12, .003])); for (let node = 0; node < 2; node++) { const p = mix(root, end, .74 + node * .2); for (const side of [-1, 1]) parts.push(compoundLeaf(p, a * 180 / Math.PI + side * 90, .31, 3)); } const p: Triple = [end[0], end[1] + .035, end[2]], fruits: ModelPart[] = [], seeds: ModelPart[] = []; parts.push(needle("吴茱萸星状聚合果的真实总果柄", bark, end, p, .002)); for (let follicle = 0; follicle < 5; follicle++) { const b = follicle * Math.PI * 2 / 5, q: Triple = [p[0] + Math.cos(b) * .006, p[1], p[2] + Math.sin(b) * .006]; fruits.push(flatLeaf("吴茱萸同一聚合果五个开放的肉质果皮瓣", q, [q[0] + Math.cos(b) * .007, q[1] + .003, q[2] + Math.sin(b) * .007], .005, "obovate", .001)); seeds.push(lobe("吴茱萸红色开放果皮中真实显露的黑种子", "#7f8974", [q[0], q[1] + .002, q[2]], [.003, .003, .003])); } parts.push(combineMeshes("吴茱萸真实五瓣星状开放聚合果", "#b59d87", fruits), combineMeshes("吴茱萸星状果内独立露出的真实黑种子", "#7f8974", seeds)); }
  parts.push(canopy(tips, 3.7, 2.7)); return parts;
}

function hoptree(): ModelPart[] {
  const { parts, tips } = trifoliateCrown(6.5, 2.7, .09, .048);
  for (const tip of tips) { const wings: ModelPart[] = [], seeds: ModelPart[] = [], stalks: ModelPart[] = []; for (let fruit = 0; fruit < 8; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] - .03 - fruit % 3 * .025, tip[2] + Math.sin(a) * .04]; stalks.push(needle("三叶橘每枚纸翅圆果独立的细长果柄", bark, tip, p, .0015)); wings.push(polygon("三叶橘单枚种室外完整一圈的圆纸翅", fruitColor, Array.from({ length: 12 }, (_, index) => [Math.cos(index * Math.PI / 6) * .014, Math.sin(index * Math.PI / 6) * .014]), .001, p)); seeds.push(lobe("三叶橘完整圆纸翅中央的独立种室", bark, [p[0], p[1] + .001, p[2]], [.006, .009, .004])); } parts.push(combineMeshes("三叶橘纸翅果簇所有真实细柄", bark, stalks), combineMeshes("三叶橘三出叶下成簇的完整圆纸翅", fruitColor, wings), combineMeshes("三叶橘各枚圆纸翅内的实际种室", bark, seeds)); }
  return parts;
}

function chineseSumac(): ModelPart[] {
  const parts: ModelPart[] = [tapered("盐肤木粗直而下部分枝不密的主干", bark, [[0, 0, 0], [.04, 3.6, 0], [0, 9.5, 0]], [.28, .17, .006])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) { const a = axis * 2.4, root: Triple = [0, 3.2 + axis * .3, 0], end: Triple = [Math.cos(a) * 3.5, 7.5 + axis % 3 * .65, Math.sin(a) * 3.5]; tips.push(end); parts.push(tapered("盐肤木羽叶与顶生大果序的真实木质枝", bark, [root, end], [.1, .003])); for (let node = 0; node < 2; node++) { const p = mix(root, end, .76 + node * .18), b = a + (node ? .6 : -.6), q: Triple = [p[0] + Math.cos(b) * .36, p[1] + .04, p[2] + Math.sin(b) * .36], leaves: ModelPart[] = [flatLeaf("盐肤木真正连接各叶节点的宽翅总叶轴", p, q, .018, [[-.5, 0], [-.5, 1], [.5, 1], [.5, 0]], .001)]; for (let pair = 0; pair < 3; pair++) for (const side of [-1, 1]) { const base = mix(p, q, .2 + pair * .27), c = b + side * 1.1; leaves.push(flatLeaf("盐肤木有粗锯齿的独立椭圆侧生小叶", base, [base[0] + Math.cos(c) * .11, base[1] + .015, base[2] + Math.sin(c) * .11], .046, serrate)); } leaves.push(flatLeaf("盐肤木有翼羽叶真实独立的顶生锯齿小叶", q, [q[0] + Math.cos(b) * .1, q[1] + .015, q[2] + Math.sin(b) * .1], .043, serrate)); parts.push(combineMeshes("盐肤木一整片真实有翅七小叶羽叶", green, leaves)); } const top: Triple = [end[0], end[1] + .28, end[2]], fruits: ModelPart[] = [], stems: ModelPart[] = [needle("盐肤木顶生圆锥果序的直立总轴", bark, end, top, .004)]; for (let fruit = 0; fruit < 28; fruit++) { const t = (fruit + 1) / 29, b = fruit * 2.4, r = (1 - t) * .06, p: Triple = [end[0] + Math.cos(b) * r, end[1] + t * .28, end[2] + Math.sin(b) * r]; stems.push(needle("盐肤木每枚盐霜小核果实际分柄", bark, [end[0], p[1], end[2]], p, .001)); fruits.push(lobe("盐肤木大圆锥果序内独立的小核果", "#b5a694", p, [.004, .005, .004])); } parts.push(combineMeshes("盐肤木整个顶生圆锥果序相连的分柄", bark, stems), combineMeshes("盐肤木羽叶上方完整细小核果圆锥序", "#b5a694", fruits)); }
  parts.push(canopy(tips, 3.4, 2.4)); return parts;
}

function karee(): ModelPart[] {
  const { parts, tips } = trifoliateCrown(10.5, 4.4, .12, .012, .025);
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 9; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .021, tip[1] - .015 - fruit % 4 * .016, tip[2] + Math.sin(a) * .021]; stems.push(needle("南非漆木长三出细叶旁小果的分枝柄", bark, tip, p, .001)); fruits.push(lobe("南非漆木长三出叶下独立的扁圆小核果", fruitColor, p, [.004, .003, .004])); } parts.push(combineMeshes("南非漆木全部小核果实际细果柄", bark, stems), combineMeshes("南非漆木真实独立的扁圆小核果簇", fruitColor, fruits)); }
  return parts;
}

function lacquerTree(): ModelPart[] {
  const { parts, tips } = featherCrown(19.5, 5.5, .54, 4, false, true, 2, "oval"); parts.push(canopy(tips, 5.5, 4.2));
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 16; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .045, tip[1] - .03 - fruit % 4 * .025, tip[2] + Math.sin(a) * .045]; stems.push(needle("漆树叶腋圆锥果序的细长分枝柄", bark, tip, p, .0012)); fruits.push(lobe("漆树圆锥序中独立的浅蜡质扁圆核果", pale, p, [.0065, .005, .0065])); } parts.push(combineMeshes("漆树整簇蜡质小核果的全部分枝柄", bark, stems), combineMeshes("漆树大羽叶下完整独立的浅蜡小核果簇", pale, fruits)); }
  return parts;
}

function conessiTree(): ModelPart[] {
  const { parts, tips } = forestCrown(13, 4.3, .16, .09, "oval", true);
  for (const tip of tips) { const flowers: ModelPart[] = [], stems: ModelPart[] = []; for (let flower = 0; flower < 4; flower++) { const a = flower * Math.PI / 2, p: Triple = [tip[0] + Math.cos(a) * .025, tip[1] + .024, tip[2] + Math.sin(a) * .025]; stems.push(needle("止泻木白色聚伞花序真实的独立花柄", green, tip, p, .0015)); flowers.push(petals(5, p, .0035, .011, 87, flowerColor)); } const pods: ModelPart[] = []; for (const side of [-1, 1]) pods.push(tapered("止泻木同一花座长出的成对极细长蓇葖", fruitColor, [tip, [tip[0] + side * .025, tip[1] - .12, tip[2]], [tip[0] + side * .035, tip[1] - .34, tip[2] + .015]], [.0025, .004, .0007])); parts.push(combineMeshes("止泻木小白花各自真实相连的花柄", green, stems), combineMeshes("止泻木枝端完整五瓣白色小花簇", flowerColor, flowers), combineMeshes("止泻木大对生叶下真正成对的长角状荚", fruitColor, pods)); }
  return parts;
}

function treeCeanothus(): ModelPart[] {
  const { parts, tips } = forestCrown(8.4, 3.6, .055, .032, serrate);
  for (const tip of tips) { const flowers: ModelPart[] = [], stems: ModelPart[] = []; for (let flower = 0; flower < 12; flower++) { const a = flower * 2.4, t = (flower + 1) / 13, r = (1 - t) * .045, p: Triple = [tip[0] + Math.cos(a) * r, tip[1] + t * .14, tip[2] + Math.sin(a) * r]; stems.push(needle("树状美洲茶圆锥小花簇的真实细分柄", green, tip, p, .001)); flowers.push(petals(5, p, .0015, .0035, 85, "#a9b8b4")); } parts.push(combineMeshes("树状美洲茶整个细小花簇相连的花柄", green, stems)); for (let offset = 0; offset < flowers.length; offset += 8) parts.push(combineMeshes("树状美洲茶浅蓝五瓣小花的完整花簇", "#a9b8b4", flowers.slice(offset, offset + 8))); }
  return parts;
}

function kadamba(): ModelPart[] {
  const { parts, tips } = forestCrown(25, 6.5, .24, .15, "oval", true); parts.push(...buttresses(1, 3.2, 3.6));
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] + .055, tip[2]], florets: ModelPart[] = [lobe("团花球形花头真正连续的中心花托", fruitColor, p, [.035, .035, .035])]; parts.push(needle("团花巨大球形花序的实际细长总柄", bark, tip, p, .003)); for (let flower = 0; flower < 72; flower++) { const a = flower * 2.4, y = -.95 + flower / 71 * 1.9, r = Math.sqrt(1 - y * y); florets.push(needle("团花球头上单独向外放射的细管小花", flowerColor, p, [p[0] + Math.cos(a) * r * .028, p[1] + y * .028, p[2] + Math.sin(a) * r * .028], .001)); } parts.push(combineMeshes("团花完整球状连续花托与全部辐射小花", flowerColor, florets)); }
  return parts;
}

function westIndianElm(): ModelPart[] {
  const { parts, tips } = forestCrown(18.5, 4.9, .11, .05, serrate);
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] - .04, tip[2]], body = lobe("西印度榆木质小蒴果连续的硬质主体", fruitColor, p, [.027, .03, .027]), bumps: ModelPart[] = [body]; for (const v of body.vertices!) bumps.push(lobe("西印度榆同一硬蒴果壳上真实的小瘤突", fruitColor, [p[0] + v.x * .027, p[1] + v.y * .03, p[2] + v.z * .027], [.005, .005, .005])); parts.push(needle("西印度榆小瘤状硬果各自真实的果柄", bark, tip, p, .002), combineMeshes("西印度榆实际连续而表面多瘤的小木蒴果", fruitColor, bumps)); }
  return parts;
}

function kanakChampak(): ModelPart[] {
  const { parts, tips } = forestCrown(23, 6, .28, .27, "palm"); parts.push(...buttresses(.85, 2.8, 2.9));
  for (const tip of tips) { const p: Triple = [tip[0], tip[1] - .03, tip[2]], flowers: ModelPart[] = [], stamens: ModelPart[] = []; parts.push(needle("翅子树叶腋大型带瓣花真实下垂的粗花梗", bark, tip, p, .004)); for (let petal = 0; petal < 5; petal++) { const a = petal * Math.PI * 2 / 5; flowers.push(flatLeaf("翅子树大花五片狭长而展开的带状花瓣", p, [p[0] + Math.cos(a) * .065, p[1] - .07, p[2] + Math.sin(a) * .065], .014, "oval", .001)); } for (let stamen = 0; stamen < 15; stamen++) { const a = stamen * 2.4; stamens.push(needle("翅子树大带瓣花中央独立细雄蕊", pale, p, [p[0] + Math.cos(a) * .008, p[1] - .025, p[2] + Math.sin(a) * .008], .0008)); } parts.push(combineMeshes("翅子树一整朵五枚长带状独立花瓣", flowerColor, flowers), combineMeshes("翅子树同一大花内真实游离细雄蕊群", pale, stamens)); }
  return parts;
}

function buddhaCoconut(): ModelPart[] {
  const { parts, tips } = forestCrown(33, 7.3, .24, .2, "heart"); parts.push(...buttresses(1.2, 4, 4.2));
  for (const tip of tips) {
    const seeds: ModelPart[] = [], stalks: ModelPart[] = [];
    for (const side of [-1, 1]) { const a = side < 0 ? -.7 : .7, p: Triple = [tip[0] + side * .065, tip[1] - .055, tip[2]]; stalks.push(needle("翅苹婆大木质蓇葖与冠枝真实相接的粗柄", bark, tip, p, .007)); parts.push(part("翅苹婆真实厚壁而开放的大椭圆舟形木果", "lathe", fruitColor, p, [.65, 1, 1.6], [0, -a * 180 / Math.PI, 0], { profile: [{ x: 0, y: 0 }, { x: .05, y: .05 }, { x: .044, y: .056 }, { x: .012, y: .008 }, { x: 0, y: .008 }] })); for (let seed = 0; seed < 3; seed++) { const q: Triple = [p[0] + (seed - 1) * .01, p[1] + .015, p[2]], b = a + (seed - 1) * .4; stalks.push(needle("翅苹婆果腔底部到每枚翼种基部的真实连接", bark, [p[0], p[1] + .004, p[2]], q, .001)); seeds.push(flatLeaf("翅苹婆木质果壁之间实际显露的长纸翅种子", q, [q[0] + Math.cos(b) * .025, q[1] + .035, q[2] + Math.sin(b) * .025], .018, "obovate", .001)); } }
    parts.push(combineMeshes("翅苹婆开放木果与翼种的全部真实连接柄", bark, stalks), combineMeshes("翅苹婆厚壁大果腔中完整纸翅种子群", pale, seeds));
  }
  return parts;
}

function cannonballMangrove(): ModelPart[] {
  const { parts, tips } = featherCrown(14.5, 4.6, .5, 2, false, false, 2, "oval"); parts.push(canopy(tips, 4.7, 3.6));
  for (let root = 0; root < 6; root++) parts.push(part("木果楝实际贴泥面蜿蜒起伏的低带状板根", "extrude", bark, [0, 0, 0], [1, 1, 1], [0, root * 60 + 11, 0], { depth: .08, profile: [{ x: .2, y: 0 }, { x: 3.1, y: 0 }, { x: 2.7, y: .06 }, { x: 2.1, y: .3 }, { x: 1.7, y: .11 }, { x: 1.3, y: .36 }, { x: .43, y: .51 }] }));
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] - .045, tip[2]], vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
    for (let ring = 0; ring < 5; ring++) for (let side = 0; side < 16; side++) { const a = side * Math.PI / 8, r = [.036, .07, .08, .068, .032][ring]! * (side % 4 === 0 ? .96 : 1); vertices.push({ x: Math.cos(a) * r, y: [-.065, -.04, 0, .04, .066][ring]!, z: Math.sin(a) * r }); }
    vertices.push({ x: 0, y: -.075, z: 0 }, { x: 0, y: .075, z: 0 });
    for (let ring = 0; ring < 4; ring++) for (let side = 0; side < 16; side++) { const i = ring * 16 + side, j = ring * 16 + (side + 1) % 16; indices.push(i, j + 16, j, i, i + 16, j + 16); }
    for (let side = 0; side < 16; side++) indices.push(80, side, (side + 1) % 16, 81, (side + 1) % 16 + 64, side + 64);
    parts.push(needle("木果楝炮弹状大型木蒴果的粗果柄", bark, tip, p, .008), part("木果楝圆球形且具四条真实纵浅沟的巨大木果", "mesh", fruitColor, [p[0], p[1] - .065, p[2]], [1, 1, 1], [0, 0, 0], { vertices, indices }));
  }
  return parts;
}

function whiteTeruntum(): ModelPart[] {
  const { parts, tips } = forestCrown(7.7, 2.7, .065, .021, "obovate");
  for (const tip of tips) { const flowers: ModelPart[] = [], stems: ModelPart[] = [], fruits: ModelPart[] = []; for (let flower = 0; flower < 5; flower++) { const p: Triple = [tip[0] + (flower % 2 ? .008 : -.008), tip[1] + .012 + flower * .013, tip[2]]; stems.push(needle("榄李叶腋短总状花序连续的花枝", green, tip, p, .001)); flowers.push(petals(5, p, .0015, .0035, 85, flowerColor)); } for (const side of [-1, 1]) { const p: Triple = [tip[0] + side * .012, tip[1] - .012, tip[2]]; stems.push(needle("榄李小型长卵果实际极短果梗", bark, tip, p, .001)); fruits.push(lobe("榄李一侧略扁的长卵小果", fruitColor, p, [.006, .011, .005])); } parts.push(combineMeshes("榄李窄倒卵叶腋中真实的花果短轴", green, stems), combineMeshes("榄李完整五瓣白色小花短总序", flowerColor, flowers), combineMeshes("榄李冠枝中实际独立的长卵小果", fruitColor, fruits)); }
  return parts;
}

function whiteMangrove(): ModelPart[] {
  const parts: ModelPart[] = [tapered("白榄李根部不分高跷支柱的完整木质单干", bark, [[0, 0, 0], [.025, 5, 0], [0, 13.5, 0]], [.39, .24, .007])], tips: Triple[] = [];
  for (let axis = 0; axis < 6; axis++) {
    const a = axis * 2.4, root: Triple = [0, 4.4 + axis * .4, 0], end: Triple = [Math.cos(a) * 4.2, 10.9 + axis % 3 * .8, Math.sin(a) * 4.2]; tips.push(end); parts.push(tapered("白榄李对生厚圆叶的连续木质冠枝", bark, [root, end], [.14, .003]));
    for (const twigSide of [-1, 1]) { const start = mix(root, end, twigSide < 0 ? .72 : .94), b = a + twigSide * .65, finish: Triple = [start[0] + Math.cos(b) * .36, start[1] + .08, start[2] + Math.sin(b) * .36]; parts.push(...leafyShoot(start, finish, .08, .046, "oval", true)); const node = mix(start, finish, 4 / 7), glands: ModelPart[] = []; for (const leafSide of [-1, 1]) { const c = b + 1.04, base: Triple = [node[0] + Math.cos(c) * leafSide * .018, node[1] + .012, node[2] + Math.sin(c) * leafSide * .018], glandBase = mix(node, base, .78); for (const glandSide of [-1, 1]) glands.push(lobe("白榄李叶柄上真正成对的两个小蜜腺", green, [glandBase[0] - Math.sin(c) * glandSide * .0015, glandBase[1] + .001, glandBase[2] + Math.cos(c) * glandSide * .0015], [.0025, .002, .0025])); } parts.push(combineMeshes("白榄李同一对叶柄两侧实际附着的小蜜腺", green, glands)); }
  }
  parts.push(canopy(tips, 4.2, 3.1)); return parts;
}

function buttonwood(): ModelPart[] {
  const { parts, tips } = forestCrown(12.5, 4.1, .085, .034, "oval");
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let head = 0; head < 3; head++) { const a = head * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .025, tip[1] + .015 + head * .016, tip[2] + Math.sin(a) * .025]; stems.push(needle("扣子树纽扣状聚合果球各自的细短柄", bark, tip, p, .0015)); fruits.push(lobe("扣子树小型纽扣果球连续的中心花托", fruitColor, p, [.012, .014, .012])); for (let achene = 0; achene < 10; achene++) { const b = achene * 2.4, y = -.7 + achene / 9 * 1.4, r = Math.sqrt(1 - y * y); fruits.push(flatLeaf("扣子树聚合果外侧实际覆叠的薄鳞状瘦果", [p[0] + Math.cos(b) * r * .005, p[1] + y * .005, p[2] + Math.sin(b) * r * .005], [p[0] + Math.cos(b) * r * .009, p[1] + y * .009 + .002, p[2] + Math.sin(b) * r * .009], .004, "oval", .0005)); } } parts.push(combineMeshes("扣子树聚合小果球真正相连的独立柄", bark, stems)); for (let offset = 0; offset < fruits.length; offset += 17) parts.push(combineMeshes("扣子树由真实覆鳞瘦果构成的完整纽扣状果头", fruitColor, fruits.slice(offset, offset + 17))); }
  return parts;
}

function kandelia(): ModelPart[] {
  const roundObovate: Parameters<typeof flatLeaf>[4] = [[0, 0], [-.15, .15], [-.45, .6], [-.45, .9], [-.17, 1], [.17, 1], [.45, .9], [.45, .6], [.15, .15]], { parts, tips } = forestCrown(8.5, 3.2, .09, .04, roundObovate, true); parts.push(...buttresses(.32, 1.2, .65));
  for (const tip of tips) { const propagules: ModelPart[] = [], calyces: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 3; fruit++) { const a = fruit * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .025, tip[1] - .022, tip[2] + Math.sin(a) * .025]; stems.push(needle("秋茄胎生胚轴上方实际细长的果柄", bark, tip, p, .002)); calyces.push(petals(5, p, .003, .012, 90, green)); propagules.push(tapered("秋茄挂在母树上真实细长而逐渐尖细的胎生胚轴", green, [p, [p[0], p[1] - .08, p[2]], [p[0] + .012, p[1] - .28, p[2] + .005]], [.003, .0045, .0007])); } parts.push(combineMeshes("秋茄胎生果簇全部真实独立的细柄", bark, stems), combineMeshes("秋茄胎生胚轴基部五枚宿存长萼片", green, calyces), combineMeshes("秋茄对生大叶下完整的细长胎生胚轴群", green, propagules)); }
  return parts;
}

function riverMangrove(): ModelPart[] {
  const { parts, tips } = forestCrown(6.8, 2.9, .08, .033, "obovate");
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 6; fruit++) { const a = fruit * Math.PI / 3, p: Triple = [tip[0] + Math.cos(a) * .015, tip[1] - .015, tip[2] + Math.sin(a) * .015]; stems.push(needle("桐花树弯角状胚轴各自的独立细柄", bark, tip, p, .0015)); fruits.push(tapered("桐花树同母株相连且自然镰弯的羊角状胎生胚轴", green, [p, [p[0] + Math.cos(a) * .012, p[1] - .026, p[2] + Math.sin(a) * .012], [p[0] + Math.cos(a) * .035, p[1] - .045, p[2] + Math.sin(a) * .035], [p[0] + Math.cos(a) * .05, p[1] - .036, p[2] + Math.sin(a) * .05]], [.002, .003, .0025, .0005])); } parts.push(combineMeshes("桐花树六枚独立弯胚轴真正的果柄", bark, stems), combineMeshes("桐花树真实生长的镰刀羊角状胎生胚轴簇", green, fruits)); }
  return parts;
}

function milkyMangrove(): ModelPart[] {
  const { parts, tips } = forestCrown(14.5, 4.5, .1, .048, serrate);
  for (const tip of tips) { const fruits: ModelPart[] = [], stems: ModelPart[] = []; for (let fruit = 0; fruit < 4; fruit++) { const a = fruit * 2.4, p: Triple = [tip[0] + Math.cos(a) * .018, tip[1] - .015 - fruit % 2 * .014, tip[2] + Math.sin(a) * .018]; stems.push(needle("海漆三个种室小蒴果的真实独立短柄", bark, tip, p, .001)); for (let chamber = 0; chamber < 3; chamber++) { const b = chamber * Math.PI * 2 / 3; fruits.push(lobe("海漆同一小蒴果中真实相接的三个圆种室", fruitColor, [p[0] + Math.cos(b) * .002, p[1], p[2] + Math.sin(b) * .002], [.0045, .005, .0045])); } } parts.push(combineMeshes("海漆整簇三室小蒴果实际细柄", bark, stems), combineMeshes("海漆互生锯齿叶下真正分三室的小蒴果簇", fruitColor, fruits)); }
  return parts;
}

function portiaTree(): ModelPart[] {
  const { parts, tips } = forestCrown(10.5, 4.2, .15, .14, "heart"), eyes: ModelPart[] = [];
  for (const tip of tips) {
    const p: Triple = [tip[0], tip[1] + .025, tip[2]], flowers: ModelPart[] = [needle("恒春黄槿独立大杯花的实际粗短柄", bark, tip, p, .003)], stigmas: ModelPart[] = [];
    eyes.push(lobe("恒春黄槿五瓣黄花中央真实深色花眼", "#a19282", p, [.017, .007, .017]));
    for (let petal = 0; petal < 5; petal++) flowers.push(leaf("恒春黄槿围成杯形的宽大淡黄花瓣", flowerColor, p, .035, .058, [58, petal * 72, 0], "YXZ"));
    const top: Triple = [p[0], p[1] + .033, p[2]]; flowers.push(needle("恒春黄槿雄蕊真实合生成的长柱", flowerColor, p, top, .002));
    for (let stigma = 0; stigma < 5; stigma++) { const a = stigma * Math.PI * 2 / 5; stigmas.push(lobe("恒春黄槿雄蕊柱末端浅黄分头柱头", flowerColor, [top[0] + Math.cos(a) * .0025, top[1], top[2] + Math.sin(a) * .0025], [.0025, .0025, .0025])); }
    const q: Triple = [tip[0] + .025, tip[1] - .035, tip[2]];
    parts.push(combineMeshes("恒春黄槿杯形五瓣花与真实长蕊柱", flowerColor, flowers), combineMeshes("恒春黄槿淡黄长蕊柱顶端实际五个小柱头", flowerColor, stigmas), needle("恒春黄槿闭合扁球木果的真实短果柄", bark, tip, q, .003), lobe("恒春黄槿不纵裂的闭合扁球木蒴果", fruitColor, q, [.04, .03, .04]), cap("恒春黄槿扁球果上真实宿存的圆盘状花萼", green, [q[0], q[1] + .013, q[2]], .015, .004, 2));
  }
  parts.push(combineMeshes("恒春黄槿各朵大杯花中真实保留异色的花眼", "#a19282", eyes));
  return parts;
}

function geigerTree(): ModelPart[] {
  const { parts, tips } = forestCrown(9.5, 4, .19, .105, "oval");
  for (const tip of tips) { const blooms: ModelPart[] = [], stems: ModelPart[] = []; for (let flower = 0; flower < 3; flower++) { const a = flower * Math.PI * 2 / 3, p: Triple = [tip[0] + Math.cos(a) * .04, tip[1] + .035, tip[2] + Math.sin(a) * .04], bloom = fiveLobedCalyx(p); stems.push(needle("红花破布木顶生漏斗花各自的花柄", bark, tip, p, .002)); bloom.name = "红花破布木真正中空而有五片褶裂口的漏斗花"; bloom.vertices = bloom.vertices!.map(v => ({ x: v.x - p[0], y: v.y - p[1], z: v.z - p[2] })); bloom.position = { x: p[0], y: p[1], z: p[2] }; bloom.scale = { x: 2.2, y: 2.3, z: 2.2 }; bloom.color = "#c0a28a"; blooms.push(bloom); } const p: Triple = [tip[0], tip[1] - .03, tip[2]]; parts.push(combineMeshes("红花破布木全部漏斗花真实的短分柄", bark, stems), combineMeshes("红花破布木宽厚卵叶下完整褶缘漏斗花簇", "#c0a28a", blooms), needle("红花破布木卵形白色核果的实际短柄", bark, tip, p, .002), lobe("红花破布木真实卵圆形白色肉质核果", pale, p, [.018, .025, .018])); }
  return parts;
}

// 同一株的季节、色相和大小不拆主；原有枳、接骨木、可可在候选阶段已按同物排除。
// https://www.nparks.gov.sg/florafaunaweb/flora/2/2/2239
// https://www.nparks.gov.sg/florafaunaweb/flora/4/4/4411
// https://www.pngplants.org/PNGtrees/TreeDescriptions/Xylocarpus_granatum_K_D_Koenig.html
// https://botany.dnp.go.th/eflora/floraspecies.html?tdcode=01714
// https://mangrove.nus.edu.sg/guidebooks/text/1076.htm
// https://www.nparks.gov.sg/florafaunaweb/flora/2/8/2824
export const woodyExpansionBatchThirteenDesigns: MasterNatureDesign[] = [
  design("sichuanPepperWholeTree", "花椒树", "植物", sichuanPepperTree, ["Zanthoxylum bungeanum", "锯齿奇数羽叶成对皮刺与真实开放果皮黑种子"]),
  design("orangeJasmineWholeTree", "九里香", "植物", orangeJasmine, ["Murraya paniculata", "Murraya exotica", "小奇数羽叶五瓣白花与长卵形小浆果"]),
  design("baelWholeTree", "木橘树", "植物", baelTree, ["Aegle marmelos", "真正三出大叶枝刺与大型圆硬壳果"]),
  design("woodAppleWholeTree", "象橘树", "植物", woodApple, ["Limonia acidissima", "Feronia limonia", "小奇数羽叶和具真实粗糙壳面的坚圆果"]),
  design("wampeeWholeTree", "黄皮树", "植物", wampee, ["Clausena lansium", "奇数长羽叶和完整圆锥序卵圆小肉果"]),
  design("tetradiumWholeTree", "吴茱萸", "植物", tetradium, ["Tetradium ruticarpum", "Euodia rutaecarpa", "真正对生整羽叶与五瓣星状开放果及黑种子"]),
  design("hoptreeWholeTree", "三叶橘", "植物", hoptree, ["Ptelea trifoliata", "长中叶柄三出叶和成簇单枚圆纸翅果"]),
  design("chineseSumacWholeTree", "盐肤木", "植物", chineseSumac, ["Rhus chinensis", "粗锯齿有翼奇数羽叶和顶生密集小果圆锥序"]),
  design("kareeWholeTree", "南非漆木", "植物", karee, ["Searsia lancea", "Rhus lancea", "柔垂窄长三出叶与细柄扁圆小核果"]),
  design("lacquerWholeTree", "漆树", "植物", lacquerTree, ["Toxicodendron vernicifluum", "大奇数全缘羽叶和叶腋浅蜡质小核果序"]),
  design("conessiWholeTree", "止泻木", "植物", conessiTree, ["Holarrhena pubescens", "Holarrhena antidysenterica", "大对生单叶白五瓣花和成对极细长角荚"]),
  design("treeCeanothusWholeTree", "树状美洲茶", "植物", treeCeanothus, ["Ceanothus arboreus", "小锯齿叶与完整浅蓝五瓣小花圆锥序"]),
  design("kadambaWholeTree", "团花树", "植物", kadamba, ["Neolamarckia cadamba", "Anthocephalus cadamba", "高大板根大对生叶与真实多辐射管花球头"]),
  design("westIndianElmWholeTree", "西印度榆", "植物", westIndianElm, ["Guazuma ulmifolia", "锯齿互生粗叶与连续多瘤木质小蒴果"]),
  design("kanakChampakWholeTree", "翅子树", "植物", kanakChampak, ["Pterospermum acerifolium", "板根大掌裂单叶与五枚狭长带状大花瓣"]),
  design("buddhaCoconutWholeTree", "翅苹婆", "植物", buddhaCoconut, ["Pterygota alata", "高大板根心形单叶与厚壁大木果中纸翅种子"]),
  design("cannonballMangroveWholeTree", "木果楝", "植物", cannonballMangrove, ["Xylocarpus granatum", "低矮蜿蜒带状根两对羽叶与巨大圆木果"]),
  design("whiteTeruntumWholeTree", "榄李", "植物", whiteTeruntum, ["Lumnitzera racemosa", "窄倒卵螺旋厚叶腋生短白花穗和长卵小果"]),
  design("whiteMangroveWholeTree", "白榄李", "植物", whiteMangrove, ["Laguncularia racemosa", "对生厚圆叶真实成对叶柄蜜腺及木质冠枝"]),
  design("buttonwoodWholeTree", "扣子树", "植物", buttonwood, ["Conocarpus erectus", "互生单叶与由真实薄鳞瘦果组成的纽扣果头"]),
  design("kandeliaWholeTree", "秋茄", "植物", kandelia, ["Kandelia obovata", "水笔仔", "对生倒卵大叶五宿存长萼和母树上细长胎生胚轴"]),
  design("riverMangroveWholeTree", "桐花树", "植物", riverMangrove, ["Aegiceras corniculatum", "厚倒卵叶和实际镰刀羊角形弯曲胎生胚轴"]),
  design("milkyMangroveWholeTree", "海漆", "植物", milkyMangrove, ["Excoecaria agallocha", "高大木质干互生锯齿单叶和真正三圆室小蒴果"]),
  design("portiaWholeTree", "恒春黄槿", "植物", portiaTree, ["Thespesia populnea", "心形厚叶五瓣杯花浅黄蕊柱和闭合扁球木果"]),
  design("geigerWholeTree", "红花破布木", "植物", geigerTree, ["Cordia sebestena", "宽厚卵叶真实五裂漏斗花与卵圆白核果"]),
];
