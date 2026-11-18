import { Euler, Quaternion, Vector3 } from "three";
import { part, beam, crystal, type ModelPart, type Triple } from "../assetModelParts";
import { sweptProfile } from "../masterNature/shared";
import { combineMeshes } from "../natureParts";
import { box, cylinder, ball, rod, loop, cord, plate, piercedPanel, material, type MasterPrototype } from "./parts";
import { hollowPipe, springWire } from "./musicExpansionBatchOne";
import { groupedBoxes } from "./musicExpansionBatchFour";

const brass = "#bda164";

function positionParts(parts: ModelPart[], position: Triple, rotation: Triple = [0, 0, 0]): ModelPart[] {
  const q = new Quaternion().setFromEuler(new Euler(...rotation.map(value => value * Math.PI / 180) as Triple));
  for (const value of parts) {
    const point = new Vector3(value.position.x, value.position.y, value.position.z).applyQuaternion(q).add(new Vector3(...position)), euler = new Euler().setFromQuaternion(q.clone().multiply(new Quaternion().setFromEuler(new Euler(value.rotation.x * Math.PI / 180, value.rotation.y * Math.PI / 180, value.rotation.z * Math.PI / 180))));
    value.position = { x: point.x, y: point.y, z: point.z }; value.rotation = { x: euler.x * 180 / Math.PI, y: euler.y * 180 / Math.PI, z: euler.z * 180 / Math.PI };
  }
  return parts;
}

function fingerBore(name: string, height: number, lowRadius: number, highRadius: number, holes: { y: number; side?: number; height?: number }[], color = material.wood): ModelPart[] {
  const parts: ModelPart[] = [], wall = Math.min(.0035, lowRadius * .24, highRadius * .24), radius = (y: number) => lowRadius + (highRadius - lowRadius) * y / height;
  let cursor = 0;
  for (const hole of [...holes].sort((a, b) => a.y - b.y)) {
    const low = hole.y - (hole.height ?? .007) / 2, high = hole.y + (hole.height ?? .007) / 2;
    if (low > cursor) parts.push(hollowPipe(name + "孔间贯通薄壁管段", [[0, cursor, 0], [0, low, 0]], [radius(cursor), radius(low)], wall, color));
    const gap = .64, value = sweptProfile(name + "真正切穿外壁并连入内膛的指孔段", color, [[radius(low), 0], [radius(high), high - low], [radius(high) - wall, high - low], [radius(low) - wall, 0]], Math.PI * 2 - gap, 12);
    value.position.y = low; value.rotation.y = -(hole.side ?? -90) - gap * 90 / Math.PI; parts.push(value); cursor = high;
  }
  if (cursor < height) parts.push(hollowPipe(name + "两端保持真实开口的余下管段", [[0, cursor, 0], [0, height, 0]], [radius(cursor), highRadius], wall, color));
  return parts;
}

function flattenedReed(name: string, y: number, height: number, lowRadius: number, highRadius: number): ModelPart {
  const reed = hollowPipe(name, [[0, y, 0], [0, y + height * .36, 0], [0, y + height, 0]], [lowRadius, highRadius, highRadius], .0012, material.ivory);
  reed.vertices!.forEach((point, index) => { point.z *= [1, .5, .04][Math.floor(index / 24)]!; });
  return reed;
}

function duduk(): ModelPart[] {
  const parts = fingerBore("筒身杜杜克", .32, .012, .012, [...Array.from({ length: 8 }, (_, index) => ({ y: .052 + index * .026 })), { y: .274, side: 90 }]);
  const regulator = loop("沿双簧片上下滑动来调整张力的独立箍夹", [0, .395, 0], .013, .002, [0, 0, 0], material.dark); regulator.scale.z = .3;
  parts.push(flattenedReed("由圆管压扁至狭缝且仍保持气道连通的宽双簧片", .32, .125, .0085, .012), regulator);
  return parts;
}

function caneReed(): ModelPart[] {
  const parts = fingerBore("竹管顶端自体切舌簧", .055, .0068, .0068, [{ y: .028, height: .034 }]);
  parts.push(cylinder("保持天然竹节闭合而让空气只经侧舌簧进入的端壁", [0, .056, 0], [.0136, .002, .0136], material.wood), plate("根部连着管壁而自由端略离开簧窗的狭长振动舌", [0, .009, -.0065], [[-.002, 0], [.002, 0], [.002, .035], [-.002, .035]], .001, material.ivory, [-3, 0, 0]));
  return parts;
}

function launeddas(): ModelPart[] {
  const parts: ModelPart[] = [...positionParts([hollowPipe("与旋律管绑在一起而无指孔的持续低音管", [[0, 0, 0], [0, .84, 0]], [.008, .008], .002)], [-.022, .02, 0]), ...positionParts(fingerBore("与低音管并列绑扎的四孔伴奏管", .55, .0075, .0075, [.08, .17, .26, .35].map(y => ({ y }))), [0, .31, 0]), ...positionParts(caneReed(), [-.022, .86, 0]), ...positionParts(caneReed(), [0, .86, 0])];
  const melody = [...fingerBore("独立向右展开的四孔旋律管", .43, .0075, .0075, [.065, .14, .215, .29].map(y => ({ y }))), ...positionParts(caneReed(), [0, .43, 0])];
  melody.forEach(value => { value.position.y -= .43; });
  parts.push(...positionParts(melody, [.05, .86, 0], [0, 0, 8]));
  for (const y of [.52, .75]) { const binding = loop("只绑紧低音和伴奏双管而让第三管独立活动的蜡线束", [-.011, y, 0], .02, .0025, [0, 0, 0], material.dark); binding.scale.z = .5; parts.push(binding); }
  return parts;
}

function cimbasso(): ModelPart[] {
  const parts: ModelPart[] = [hollowPipe("在演奏者前方下折后直立返回的连续低音主管", [[-.1, .72, .05], [-.17, .35, .05], [-.17, .12, .05], [-.08, .065, .05], [.12, .1, .05], [.15, .25, .05], [.15, 1.25, .05], [.15, 1.32, -.12]], [.025, .028, .03, .033, .037, .041, .046, .05], .003, brass), part("在上端前伸而不朝天的长锥形喇叭", "lathe", brass, [.15, 1.32, -.12], [1, 1, 1], [-90, 0, 0], { profile: [{ x: .05, y: 0 }, { x: .06, y: .24 }, { x: .095, y: .41 }, { x: .135, y: .47 }, { x: .132, y: .473 }, { x: .092, y: .413 }, { x: .057, y: .243 }, { x: .047, y: 0 }, { x: .05, y: 0 }] }), hollowPipe("由杯嘴弯入旋转阀组上方的细送气管", [[-.26, 1.32, -.19], [-.2, 1.28, -.1], [-.1, 1.14, .05], [-.1, .72, .05]], [.012, .014, .018, .025], .0025, brass), hollowPipe("保留真实口腔凹腔的杯形吹嘴", [[-.26, 1.32, -.19], [-.28, 1.34, -.22]], [.012, .023], .003, material.steel), rod("主管下方接地的调节尾柱", [0, .015, .05], [0, .12, .05], .018), cylinder("尾柱防滑橡胶端足", [0, .013, .05], [.046, .026, .046], material.dark)];
  for (let index = 0; index < 4; index++) {
    const y = .77 + index * .09, x = -.1, z = .07 + index * .012;
    parts.push(cylinder("竖排旋转阀的密闭金属壳", [x, y, .05], [.059, .067, .059], brass, [90, 0, 0]), hollowPipe("各旋转阀分别接入的独立变长U形副管", [[x, y, z], [-.28 - index * .025, y, z], [-.28 - index * .025, .24 + index * .09, z], [-.21, .24 + index * .09, z], [-.21, y + .025, z], [x, y + .025, z]], [.011, .011, .011, .011, .011, .011], .002, brass), rod("由演奏者指垫驱动旋转阀的短联杆", [x, y, .007], [x - .08, y + .023, -.035], .006, material.steel), box("旋转阀前方分开的按指片", [x - .085, y + .025, -.04], [.045, .019, .035], material.ivory));
  }
  parts.push(rod("跨接两根长主管而避免悬空分离的刚性护撑", [-.17, .4, .05], [.15, .4, .05], .008, brass), rod("喇叭根部与吹管侧相连的上部护撑", [-.1, 1.14, .05], [.15, 1.14, .05], .008, brass));
  return parts;
}

function sarrusophone(): ModelPart[] {
  const parts: ModelPart[] = [...positionParts(fingerBore("萨鲁索下降细锥主管", .85, .029, .014, [.15, .33, .51, .69].map(y => ({ y, height: .012 })), brass), [-.14, .17, 0]), hollowPipe("连接两根金属锥管而开放内膛的下方U弯", [[-.14, .17, 0], [-.14, .08, 0], [-.04, .035, 0], [.08, .07, 0], [.14, .17, 0]], [.029, .03, .032, .034, .036], .003, brass), ...positionParts(fingerBore("萨鲁索上升宽锥主管", .92, .036, .06, [.22, .39, .56, .73].map(y => ({ y, height: .014 })), brass), [.14, .17, 0]), part("上升金属主管末端真正张开的低音扩音口", "lathe", brass, [.14, 1.09, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .06, y: 0 }, { x: .074, y: .11 }, { x: .12, y: .22 }, { x: .117, y: .223 }, { x: .071, y: .113 }, { x: .057, y: 0 }, { x: .06, y: 0 }] }), hollowPipe("由两片簧叶接入细主管的弯曲金属吹管", [[-.14, 1.02, 0], [-.14, 1.12, 0], [-.02, 1.17, -.04], [.045, 1.19, -.08]], [.014, .013, .01, .008], .002, brass), rod("连接上升管各键轴的独立长支轴", [.23, .25, -.055], [.23, 1.03, -.085], .005, material.steel), rod("连接下降管各键盖而不悬空的独立键轴", [-.21, .25, -.045], [-.21, 1.03, -.028], .005, material.steel)];
  const reedDirection = new Vector3(.03, .04, -.02), reedRotation = new Euler().setFromQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), reedDirection.clone().normalize()));
  parts.push(...positionParts([flattenedReed("接在弯吹管前端且有真实窄缝气道的双簧片", 0, reedDirection.length(), .008, .009)], [.045, 1.19, -.08], [reedRotation.x, reedRotation.y, reedRotation.z].map(value => value * 180 / Math.PI) as Triple));
  for (const side of [-1, 1]) for (let index = 0; index < 4; index++) {
    const y = side < 0 ? .32 + index * .18 : .39 + index * .17, r = side < 0 ? .029 + (.014 - .029) * (y - .17) / .85 : .036 + .024 * (y - .17) / .92, x = side * .14;
    parts.push(cylinder("在真实侧孔上方保持微小开度的独立皮垫键盖", [x, y, -r - .007], [.034, .009, .034], brass, [90, 0, 0]), rod("从独立键盖连接到外侧键轴的金属桥臂", [x, y, -r - .007], [side < 0 ? -.21 : .23, y, side < 0 ? -.045 + .017 * (y - .25) / .78 : -.055 - .03 * (y - .25) / .78], .004, material.steel));
  }
  parts.push(rod("把两根长金属锥管固定在一起的中段短撑", [-.14, .57, .02], [.14, .57, .02], .006, brass));
  return parts;
}

function keytar(): ModelPart[] {
  const outline: [number, number][] = [[-.4, .18], [.33, .18], [.41, .25], [.4, .46], [-.24, .46], [-.42, .56], [-.63, .69], [-.76, .64], [-.77, .53], [-.54, .38], [-.45, .32]], parts: ModelPart[] = [piercedPanel("以演奏握颈和键床一体成形的肩背异形外壳", [0, 0, .04], outline, [[[-.3, .23], [-.3, .41], [.3, .41], [.3, .23]]], .075, material.red, [-90, 0, 0]), piercedPanel("封住电子控制腔而保留前方键床开口的薄背壳", [0, 0, .045], outline, [], .005, material.dark, [-90, 0, 0])], whites: ModelPart[] = [], blacks: ModelPart[] = [];
  for (let index = 0; index < 22; index++) {
    whites.push(box("肩背演奏器的独立全尺寸白键", [(index - 10.5) * .54 / 22, .006, 0], [.54 / 22 * .95, .012, .13], material.ivory));
    if (index < 21 && ![2, 6].includes(index % 7)) blacks.push(box("按标准黑白关系错列的半音黑键", [(index - 10) * .54 / 22, .017, .032], [.54 / 22 * .55, .016, .066], material.dark));
  }
  parts.push(...positionParts([...groupedBoxes("肩背琴全尺寸白键合批", whites), ...groupedBoxes("肩背琴全尺寸黑键合批", blacks)], [0, .32, -.04], [-90, 0, 0]), plate("从两处壳体背面固定点实际连成的平织肩带", [0, 0, .068], [[-.73, .6], [-.405, .98], [.095, .927], [.364, .437], [.336, .423], [.065, .893], [-.395, .94], [-.71, .62]], .005, material.dark, [0, 0, 0]), box("左手握颈上用于连续变调的细控制带", [-.61, .557, -.044], [.15, .015, .008], material.dark, [0, 0, -29]), ...[0, 1, 2].map(index => cylinder("握颈正面的独立保持或表情控制键", [-.49 + index * .043, .45 + index * .025, -.043], [.023, .012, .023], material.ivory, [90, 0, 0])), ...[-1, 1].map(side => cylinder("把平织肩带两端实际固定到背壳的短肩带钉", [side < 0 ? -.72 : .35, side < 0 ? .61 : .43, .056], [.016, .03, .016], material.steel, [90, 0, 0])), hollowPipe("琴身侧缘真实中空的信号输出插口", [[.405, .29, .003], [.43, .29, .003]], [.008, .008], .0025, material.steel));
  return parts;
}

function carvedBowl(name: string, outline: [number, number][], depth: number, front: number): ModelPart {
  const area = outline.reduce((sum, [x, y], index) => { const next = outline[(index + 1) % outline.length]!; return sum + x * next[1] - next[0] * y; }, 0);
  if (area < 0) outline = [...outline].reverse();
  const centerY = outline.reduce((sum, point) => sum + point[1], 0) / outline.length, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], count = outline.length;
  for (const [inset, z] of [[1, 0], [.7, depth * .75], [.2, depth], [.17, depth - .008], [.67, depth * .75 - .007], [.94, 0]]) for (const [x, y] of outline) vertices.push({ x: x * inset!, y: centerY + (y - centerY) * inset!, z: front + z! });
  const connect = (a: number, b: number) => { for (let index = 0; index < count; index++) { const next = (index + 1) % count; indices.push(a * count + index, a * count + next, b * count + index, a * count + next, b * count + next, b * count + index); } };
  connect(0, 1); connect(1, 2); connect(3, 4); connect(4, 5); connect(5, 0);
  const outside = vertices.length, inside = outside + 1;
  vertices.push({ x: 0, y: centerY, z: front + depth + .006 }, { x: 0, y: centerY, z: front + depth - .002 });
  for (let index = 0; index < count; index++) { const next = (index + 1) % count; indices.push(2 * count + index, 2 * count + next, outside, 3 * count + index, inside, 3 * count + next); }
  return part(name, "mesh", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function gadulka(): ModelPart[] {
  const outline: [number, number][] = [[0, .018], [-.064, .03], [-.104, .104], [-.096, .224], [-.056, .304], [-.032, .344], [.032, .344], [.056, .304], [.096, .224], [.104, .104], [.064, .03]], holes: [number, number][][] = [-1, 1].map(side => [[side * .042, .105], [side * .042, .205], [side * .063, .196], [side * .071, .155], [side * .062, .116]]);
  const parts: ModelPart[] = [carvedBowl("由整木向内掏出且保留弧背的梨腹琴壳", outline, .1, -.045), piercedPanel("两个D形开口实际连入共鸣腔的薄木音板", [0, 0, -.045], outline, holes, .004, material.ivory, [-90, 0, 0]), box("演奏弦不压在长指板上的短宽琴颈", [0, .425, -.008], [.05, .21, .085], material.wood), box("承托主弦与共鸣弦轴的宽扁琴头", [0, .565, .003], [.085, .11, .075], material.wood), box("位于两D形声孔之间并接实音板的窄琴桥", [0, .135, -.061], [.115, .027, .024], material.wood), cord("放在琴身侧边的独立擦奏木弓", [[.2, .014, -.28], [.23, .028, 0], [.2, .014, .28]], .005, material.wood), rod("与弓杆分开而保持可擦弦空隙的马尾毛束", [.19, .014, -.28], [.19, .014, .28], .0018, material.ivory)];
  parts.push(plate("三根主弦下端实际系入的独立梯形木尾板", [0, 0, -.068], [[-.018, .027], [.018, .027], [.035, .074], [-.035, .074]], .004, material.dark, [0, 0, 0]), cylinder("将尾绳实际固定到琴腹下缘的独立尾钮", [0, .024, -.0505], [.012, .014, .012], material.wood, [90, 0, 0]));
  const tailGut = springWire([[-.014, .028, -.068], [-.009, .02, -.057], [0, .018, -.051], [.009, .02, -.057], [.014, .028, -.068]], .0014); tailGut.name = "穿入木尾板两端并绕过尾钮的连续系尾绳"; tailGut.color = material.ivory; parts.push(tailGut);
  for (let index = 0; index < 3; index++) { const x = (index - 1) * .018;
    parts.push(rod("越过高琴桥后用指甲侧面截音的主擦奏弦", [x, .045, -.069], [x, .135, -.074], .0018, material.steel), rod("短颈上方仍与木面分离的同根演奏弦", [x, .135, -.074], [x, .592, -.04], .0018, material.steel), cylinder("宽扁琴头后向伸出的主弦摩擦调音销", [x * 1.5, .592, .005], [.014, .105, .014], material.dark, [90, 0, 0]));
  }
  for (let index = 0; index < 8; index++) { const y = .39 + index * .027;
    parts.push(rod("主擦奏弦下方独立张紧的细共鸣弦", [(index - 3.5) * .004, .135, -.062], [.025, y, -.048], .001, material.steel), rod("与相应共鸣弦逐一相连的侧插调音轴", [.02, y, .003], [.075, y, .003], .0065, material.wood));
  }
  return parts;
}

function kobyz(): ModelPart[] {
  const outline: [number, number][] = [[0, .025], [-.12, .05], [-.15, .18], [-.12, .32], [-.08, .4], [0, .43], [.08, .4], [.12, .32], [.15, .18], [.12, .05]], parts: ModelPart[] = [carvedBowl("上半敞开而下半蒙皮的深勺形整木琴腹", outline, .17, -.07), piercedPanel("只覆盖深勺下半口而不封住上部开腹的皮膜", [0, 0, -.07], [[0, .025], [-.12, .05], [-.15, .18], [-.142, .22], [.142, .22], [.15, .18], [.12, .05]], [], .004, material.ivory, [-90, 0, 0]), cord("从敞口琴腹一体伸出而略向后弓起的无品琴颈", [[0, .42, -.055], [0, .61, .015], [0, .77, -.02], [0, .84, -.07]], .025, material.wood), plate("承托双弦轴的扁宽上举琴头", [0, .82, -.07], [[-.035, 0], [.035, 0], [.075, .085], [.06, .115], [-.06, .115], [-.075, .085]], .045, material.wood, [0, 0, 0]), box("实际搭在皮膜上的双弦小琴桥", [0, .15, -.088], [.065, .045, .028], material.wood), cord("与琴体分开的独立马尾弓杆", [[.29, .015, -.3], [.32, .032, 0], [.29, .015, .3]], .005, material.wood), rod("可伸入两根粗弦之间擦奏的马尾束", [.278, .015, -.3], [.278, .015, .3], .0025, material.ivory)];
  for (let index = 0; index < 2; index++) { const x = index ? .018 : -.018, y = .875 + index * .025;
    parts.push(rod("从皮膜下端系弦处跨到琴桥的粗马尾弦段", [x, .075, -.075], [x, .15, -.103], .003, material.ivory), rod("与颈面保持距离而无琴品的上半演奏弦段", [x, .15, -.103], [x, y, -.078], .003, material.ivory), rod("扁宽琴头上分别穿过的长木调音轴", [-.09, y, -.07], [.09, y, -.07], .018, material.dark));
  }
  return parts;
}

function bowedPsaltery(): ModelPart[] {
  const outline: [number, number][] = [[-.16, -.3], [.16, -.3], [0, .4]], inner: [number, number][] = [[-.142, -.285], [0, .354], [.142, -.285]], hole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const a = -index * Math.PI / 6; return [Math.cos(a) * .03, -.045 + Math.sin(a) * .03]; }), parts: ModelPart[] = [piercedPanel("三角弓筝的连续薄底板", [0, .015, 0], outline, [], .006, material.wood), piercedPanel("上下音板之间真正中空的三角侧圈", [0, .021, 0], outline, [inner], .058, material.wood), piercedPanel("带贯通圆声孔的三角上音板", [0, .079, 0], outline, [hole], .006, material.ivory), box("三角箱底边承托全部空弦的长弦枕", [0, .093, -.275], [.29, .016, .016], material.wood)];
  const upperPins: ModelPart[] = [], lowerPins: ModelPart[] = [];
  for (const side of [-1, 1]) for (let index = 0; index < 13; index++) {
    const x = side * (.009 + index * .0106), z = .4 - Math.abs(x) / .16 * .7 - .012;
    parts.push(rod("可从两侧斜边用弓分别触及的独立空弦", [x, .106, -.275], [x, .106, z], .001, material.steel));
    upperPins.push(box("斜边上外露方头的独立调音钢销", [x, .101, z], [.005, .022, .005], material.steel)); lowerPins.push(box("底边系住另一弦端的方头钢销", [x, .101, -.282], [.005, .022, .005], material.steel));
  }
  parts.push(...groupedBoxes("斜边上的独立方头调音钢销组", upperPins), ...groupedBoxes("底边的独立系弦钢销组", lowerPins), cord("短弓筝弓杆的可见弧度", [[.25, .016, -.2], [.28, .03, 0], [.25, .016, .2]], .005, material.wood), rod("与短弓杆分离的擦弦毛束", [.239, .016, -.2], [.239, .016, .2], .0018, material.ivory));
  return parts;
}

function mountainDulcimer(): ModelPart[] {
  const outline: [number, number][] = [[0, -.4], [.07, -.385], [.1, -.32], [.09, -.23], [.045, -.13], [.04, -.04], [.075, .07], [.085, .2], [.06, .3], [.025, .34], [-.025, .34], [-.06, .3], [-.085, .2], [-.075, .07], [-.04, -.04], [-.045, -.13], [-.09, -.23], [-.1, -.32], [-.07, -.385]], inner = outline.map(([x, z]) => [x * .91, z * .96] as [number, number]).reverse(), hearts: [number, number][][] = [-1, 1].flatMap(side => [-.27, .15].map(z => [[side * .049, z - .015], [side * .049 - .014, z], [side * .049 - .011, z + .012], [side * .049, z + .005], [side * .049 + .011, z + .012], [side * .049 + .014, z]] as [number, number][]));
  const parts: ModelPart[] = [piercedPanel("并非独立琴颈加琴腹的通长束腰琴底板", [0, .01, 0], outline, [], .005, material.wood), piercedPanel("沿两处鼓腹和中间细腰连续成形的空腔侧圈", [0, .015, 0], outline, [inner], .058, material.wood), piercedPanel("四个心形声孔实际开入薄木箱面的音板", [0, .073, 0], outline, hearts, .007, material.ivory), box("位于通长琴腹中央而不悬出箱外的抬高指板", [0, .0935, -.015], [.042, .027, .68], material.dark), box("尾端真正承弦的骨质小琴桥", [0, .109, -.35], [.048, .01, .012], material.ivory), box("与长指板上端相接的骨质弦枕", [0, .109, .32], [.046, .01, .01], material.ivory), piercedPanel("与通长琴箱相接而内部保留弦轴槽的弯卷琴头", [0, .08, 0], [[-.025, .28], [.025, .28], [.035, .42], [.02, .49], [-.025, .48], [-.04, .41]], [[[-.012, .345], [-.012, .438], [.013, .438], [.013, .345]]], .04, material.wood)];
  for (const semitone of [2, 4, 5, 7, 9, 10, 12, 14, 16, 17, 19, 21, 22, 24]) parts.push(box("按自然音阶位置排列而非等距铺开的独立金属音品", [0, .1085, .32 - .67 * (1 - 2 ** (-semitone / 12))], [.044, .003, .003], material.steel));
  for (let index = 0; index < 3; index++) { const x = (index - 1) * .01, z = .36 + index * .04;
    parts.push(rod("由琴尾系弦处斜升到琴桥的下弦段", [x, .086, -.38], [x, .114, -.35], .0013, material.steel), rod("可沿中间自然音阶指板按奏的独立金属弦", [x, .114, -.35], [x, .114, z], .0013, material.steel), rod("琴头槽内横穿两颊而逐一固定弦端的调音轴", [-.052, .11, z], [.052, .11, z], .009, material.dark));
  }
  return parts;
}

function bellTree(): ModelPart[] {
  const parts: ModelPart[] = [rod("同轴叠碗钟自下而上连续贯通的中心钢杆", [0, .04, 0], [0, 1.24, 0], .01), cylinder("固定叠碗钟而能夹到演奏架上的中心粗套座", [0, .38, 0], [.045, .13, .045], material.dark)];
  for (let index = 0; index < 14; index++) {
    const radius = .125 - index * .006, y = .43 + index * .052, height = .06 - index * .0014;
    const bell = sweptProfile("宽口自由悬出而顶心被中心杆锁定的中空倒碗钟", brass, [[radius, 0], [radius * .77, height * .7], [.014, height], [.007, height], [.007, height - .004], [.012, height - .005], [radius * .77 - .004, height * .7 - .003], [radius - .004, 0]], Math.PI * 2, 16);
    bell.position = { x: 0, y, z: 0 };
    parts.push(bell, cylinder("叠碗钟顶心与中心杆实际锁紧的独立小垫母", [0, y + height + .001, 0], [.025, .007, .025], material.steel));
  }
  for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("叠碗钟整架向地面展开的独立支脚", [0, .3, 0], [Math.cos(angle) * .27, .02, Math.sin(angle) * .27], .02, material.dark)); }
  return parts;
}

function crotales(): ModelPart[] {
  const parts: ModelPart[] = [...[-.065, .105].map(z => rod("支承两列半音盘钟的独立长横梁", [-.72, .925, z], [.72, .925, z], .028, material.dark))], posts: ModelPart[] = [];
  let white = 0;
  for (let index = 0; index < 25; index++) {
    const natural = [0, 2, 4, 5, 7, 9, 11].includes(index % 12), x = (natural ? white++ - 7 : white - 7.5) * .094, z = natural ? -.065 : .105, radius = .046 - index * .0004;
    const disk = sweptProfile("具有中心孔和抬高实心轮毂而不是空碗的厚青铜盘钟", brass, [[.008, 0], [radius, 0], [radius, .007], [.022, .009], [.016, .023], [.008, .023]], Math.PI * 2, 16);
    disk.position = { x, y: .985, z };
    parts.push(disk, cylinder("只压住中心轮毂而不压住盘钟外沿的独立锁母", [x, 1.01, z], [.022, .008, .022], material.steel));
    posts.push(box("由长梁实际升入各盘钟中心锁母的独立钢柱", [x, .9715, z], [.006, .079, .006], material.steel));
  }
  parts.push(...groupedBoxes("两列盘钟各自分离的中心支柱合批", posts));
  for (const x of [-.55, .55]) {
    parts.push(rod("两列盘钟横梁共同连接的端部桥撑", [x, .925, -.12], [x, .925, .16], .026, material.dark), rod("盘钟演奏架的独立立柱", [x, .035, .02], [x, .925, .02], .023, material.dark));
    for (let index = 0; index < 3; index++) { const angle = index * Math.PI * 2 / 3; parts.push(rod("盘钟架落地三脚保持重心的展开腿", [x, .24, .02], [x + Math.cos(angle) * .27, .02, .02 + Math.sin(angle) * .27], .018, material.dark)); }
  }
  return parts;
}

function woodBlock(): ModelPart[] {
  const parts: ModelPart[] = [box("矩箱木梆块承托两个独立声腔的薄底", [0, .0125, 0], [.22, .025, .11], material.wood), box("矩箱木梆块上方连续可敲击的硬木音面", [0, .0875, 0], [.22, .025, .11], material.wood), ...[-1, 1].map(side => box("矩箱木梆左右两侧真正保留厚壁的外板", [side * .1025, .05, 0], [.015, .1, .11], material.wood)), box("将左右声腔隔开而形成两个音区的中央内壁", [0, .05, 0], [.015, .1, .095], material.wood), box("矩箱后方把声腔封闭的整块木壁", [0, .05, .0475], [.22, .1, .015], material.wood), piercedPanel("两个横缝实际通向左右独立空腔的前壁", [0, 0, -.04], [[-.11, 0], [.11, 0], [.11, .1], [-.11, .1]], [[[-.09, .043], [-.09, .052], [-.022, .052], [-.022, .043]], [[.022, .043], [.022, .052], [.09, .052], [.09, .043]]], .015, material.wood, [-90, 0, 0]), rod("与木梆块分开放置的独立木槌柄", [.17, .018, -.09], [.17, .018, .09], .014, material.wood), ball("木梆槌一端可敲击的圆硬木头", [.17, .018, -.1], [.033, .033, .033], material.wood)];
  return parts;
}

function slapstick(): ModelPart[] {
  const angle = 32 * Math.PI / 180, upper: Triple = [0, .107 + .2 * Math.sin(angle), .205 - .2 * Math.cos(angle)];
  const upperHandle: ModelPart[] = [rod("上叶外面把手的前支耳", [0, .009, -.12], [0, .05, -.12], .012, material.dark), rod("上叶外面把手的后支耳", [0, .009, .045], [0, .05, .045], .012, material.dark), rod("上叶外面可握住的通长手柄", [0, .05, -.12], [0, .05, .045], .014, material.dark)];
  return [box("以宽面互相碰击的鞭板下叶", [0, .09, .005], [.065, .018, .4], material.wood), box("绕后端铰轴真实打开的鞭板上叶", upper, [.065, .018, .4], material.wood, [32, 0, 0]), rod("同时接实两块木叶后端的通长金属铰轴", [-.05, .107, .205], [.05, .107, .205], .018, material.steel), rod("下叶外侧手柄的前支耳", [0, .081, -.12], [0, .045, -.12], .012, material.dark), rod("下叶外侧手柄的后支耳", [0, .081, .045], [0, .045, .045], .012, material.dark), rod("下叶下方真正独立可握的通长手柄", [0, .045, -.12], [0, .045, .045], .014, material.dark), ...positionParts(upperHandle, upper, [32, 0, 0])];
}

function caxixi(): ModelPart[] {
  const levels = [.015, .06, .12, .17, .2], radii = [.059, .059, .052, .032, .018], ribs: ModelPart[] = [], parts: ModelPart[] = [cylinder("平底篮响器真正封住底部的薄葫芦片", [0, .0125, 0], [.12, .005, .12], material.wood), cylinder("把上方编条收拢封住而不让响籽掉出的束结小盖", [0, .2, 0], [.036, .004, .036], material.wood)];
  for (let index = 0; index < 48; index++) { const angle = index * Math.PI / 24, value = springWire(levels.map((y, point) => [Math.cos(angle) * radii[point]!, y, Math.sin(angle) * radii[point]!] as Triple), .0018); value.name = "保留真实编织空隙而沿篮壁收拢的独立藤编纵条"; value.color = material.wood; ribs.push(value); }
  for (let index = 0; index < ribs.length; index += 16) parts.push(combineMeshes("保持全部四十八根纵编条而仅按网格预算合批", material.wood, ribs.slice(index, index + 16)));
  for (const y of [.018, .04, .065, .09, .115, .14, .165, .19]) { const index = Math.max(0, levels.findIndex(level => level >= y) - 1); const radius = radii[index]! + (radii[index + 1]! - radii[index]!) * (y - levels[index]!) / (levels[index + 1]! - levels[index]!); parts.push(loop("与纵条实际交织而环住篮腹的藤编横带", [0, y, 0], radius, .0018, [0, 0, 0], material.wood)); }
  const handle = springWire(Array.from({ length: 13 }, (_, index): Triple => { const angle = Math.PI - index * Math.PI / 12; return [Math.cos(angle) * .025, .19 + Math.sin(angle) * .086, 0]; }), .003); handle.name = "两端实际插入篮顶编条的弧形提环"; handle.color = material.wood; parts.push(handle);
  for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; parts.push(crystal("会撞击硬葫芦底而尺寸大于编隙的独立响籽", material.dark, [Math.cos(angle) * .025, .0192, Math.sin(angle) * .025], [.008, .006, .008])); }
  return parts;
}

function floatingWaterDrum(): ModelPart[] {
  return [part("保持真实水腔的大半葫芦承水盆", "lathe", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .25, y: .045 }, { x: .43, y: .2 }, { x: .48, y: .38 }, { x: .467, y: .38 }, { x: .418, y: .207 }, { x: .243, y: .057 }, { x: 0, y: .014 }] }), part("承水盆内低于盆沿且没有穿出盆壁的水面", "cylinder", "#789da7", [0, .26, 0], [.86, .008, .86], [0, 0, 0], { opacity: .6, roughness: .15, metalness: .02 }), part("开口向下浸入水面而将空气留在壳内的倒浮匏鼓", "lathe", material.wood, [0, .235, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: .23, y: 0 }, { x: .19, y: .09 }, { x: .08, y: .15 }, { x: 0, y: .16 }, { x: 0, y: .153 }, { x: .075, y: .143 }, { x: .183, y: .085 }, { x: .222, y: 0 }, { x: .23, y: 0 }] })];
}

function rackett(): ModelPart[] {
  const height = .2, radius = .0065, centers: [number, number][] = [[0, 0], ...Array.from({ length: 8 }, (_, index): [number, number] => { const angle = (-90 + index * 45) * Math.PI / 180; return [Math.cos(angle) * .027, Math.sin(angle) * .027]; })], outer: [number, number][] = Array.from({ length: 16 }, (_, index) => { const angle = (-101.25 + index * 22.5) * Math.PI / 180; return [Math.cos(angle) * .05, Math.sin(angle) * .05]; });
  const hole = (x: number, z: number): [number, number][] => Array.from({ length: 8 }, (_, index) => { const angle = -index * Math.PI / 4; return [x + Math.cos(angle) * radius, z + Math.sin(angle) * radius]; }), bores = centers.map(([x, z]) => hole(x, z)), parts: ModelPart[] = [piercedPanel("只封住末折纵膛底部而让其它八膛贯通的木底段", [0, 0, 0], outer, bores.slice(0, -1), .012, material.wood)];
  const front = outer[0]![1], startAngle = Math.atan2(-Math.sqrt(radius * radius - .003 * .003), -.003), endAngle = Math.atan2(-Math.sqrt(radius * radius - .003 * .003), .003) - Math.PI * 2, notch: [number, number][] = [outer[0]!, [-.003, front], ...Array.from({ length: 9 }, (_, index): [number, number] => { const angle = startAngle + (endAngle - startAngle) * index / 8; return [Math.cos(angle) * radius, -.027 + Math.sin(angle) * radius]; }), [.003, front], ...outer.slice(1)];
  const ports = [{ y: .02, turn: 7, outlet: true }, ...Array.from({ length: 10 }, (_, index) => ({ y: .035 + index * .015, turn: index % 8, outlet: false }))];
  let cursor = .012;
  for (const port of ports) {
    const low = port.y - .0035, high = port.y + .0035;
    if (low > cursor) parts.push(piercedPanel("九条平行内膛在指孔之间连续贯通的木体段", [0, cursor, 0], outer, bores, low - cursor, material.wood));
    const value = piercedPanel(port.outlet ? "末折纵膛真正穿向外壁的侧向放音口" : "从外壁真正切入相应纵膛的侧向按指孔", [0, low, 0], notch, bores.filter((_, index) => index !== 1), high - low, material.wood);
    value.rotation.y = -port.turn * 45; parts.push(value); cursor = high;
  }
  parts.push(piercedPanel("九膛在顶部保持开放以接入折返气道的上木段", [0, cursor, 0], outer, bores, height - cursor, material.wood));
  for (let index = 0; index < centers.length - 1; index++) {
    const a = centers[index]!, b = centers[index + 1]!, top = index % 2 === 1, y = top ? height : 0, direction = top ? 1 : -1;
    parts.push(hollowPipe("交替位于上下端而把九膛串为一条声路的独立U形连管", [[a[0], y, a[1]], [a[0], y + direction * .012, a[1]], [(a[0] + b[0]) / 2, y + direction * .02, (a[1] + b[1]) / 2], [b[0], y + direction * .012, b[1]], [b[0], y, b[1]]], [.008, .008, .008, .008, .008], .0015, brass));
  }
  parts.push(hollowPipe("由中央首膛向上接入双簧片的短铜套管", [[0, height, 0], [0, .24, 0]], [.008, .008], .0015, brass), flattenedReed("中央进气端保留实际双簧狭缝的短宽簧叶", .24, .055, .008, .011));
  for (const y of [.004, .186]) parts.push(piercedPanel("沿木体轮廓连续抱合而不悬浮的端部铜束圈", [0, y, 0], outer.map(([x, z]) => [x * 1.04, z * 1.04]), [outer.map(([x, z]) => [x * .99, z * .99] as [number, number]).reverse()], .008, brass));
  return parts;
}

function qraqeb(): ModelPart[] {
  const parts: ModelPart[] = [];
  for (const upper of [false, true]) {
    const y = upper ? .115 : .015;
    for (const z of [-.09, .09]) parts.push(part("长连桥两端与同一金属叶连为一体的凹击腔", "lathe", material.steel, [0, y, z], [1, 1, 1], [upper ? 180 : 0, 0, 0], { profile: [{ x: 0, y: 0 }, { x: .03, y: .005 }, { x: .06, y: .025 }, { x: .057, y: .027 }, { x: .028, y: .009 }, { x: 0, y: .004 }] }));
    parts.push(piercedPanel("把两个凹击腔连成鞍形金属叶且带真实穿绳孔的窄腰", [0, upper ? .092 : .032, 0], [[-.014, -.06], [.014, -.06], [.014, .06], [-.014, .06]], [[[-.005, -.012], [-.005, .012], [.005, .012], [.005, -.012]]], .006, material.steel));
    const rope = springWire([[0, upper ? .095 : .035, -.007], [.023, upper ? .13 : .07, -.005], [.029, upper ? .13 : .07, .005], [0, upper ? .095 : .035, .007]], .002); rope.name = "穿过窄腰真孔而供手指穿握的编绳环"; rope.color = material.wood; parts.push(rope);
  }
  parts.push(loop("真实穿过上下两叶窄腰孔而把金属叶联在一起的扣环", [0, .065, 0], .032, .0025, [0, 0, 90], material.steel));
  return parts;
}

function trapezoidBell(name: string, length: number, mouthWidth: number, mouthHeight: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (const [width, height, z] of [[.025, .018, 0], [mouthWidth, mouthHeight, length], [mouthWidth - .006, mouthHeight - .006, length], [.019, .012, .004]]) for (const [x, y] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) vertices.push({ x: x! * width! / 2, y: y! * height! / 2, z: z! });
  for (let ring = 0; ring < 3; ring++) for (let index = 0; index < 4; index++) { const next = (index + 1) % 4, a = ring * 4, b = (ring + 1) * 4; indices.push(a + index, a + next, b + index, a + next, b + next, b + index); }
  indices.push(0, 2, 1, 0, 3, 2, 12, 13, 14, 12, 14, 15);
  return part(name, "mesh", material.dark, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function agogo(): ModelPart[] {
  return [...positionParts([trapezoidBell("无内舌而以前方开口向外辐射的长梯腔铁铃", .21, .075, .065)], [-.06, .06, .05], [0, 180, 0]), ...positionParts([trapezoidBell("与长铃分开成形但由U形柄联为一体的短梯腔铁铃", .15, .055, .05)], [.06, .06, .05], [0, 180, 0]), piercedPanel("同时焊接到两只铁铃尾端而供手握的平U形钢柄", [0, .06, 0], [[-.07, .04], [-.05, .04], [-.05, .15], [-.035, .18], [.035, .18], [.05, .15], [.05, .04], [.07, .04], [.07, .155], [.045, .2], [-.045, .2], [-.07, .155]], [], .004, material.dark)];
}

function bata(): ModelPart[] {
  const parts: ModelPart[] = [part("腰位偏向小口且两端口径不同的完整双锥木鼓腹", "lathe", material.wood, [0, .18, 0], [1, 1, 1], [90, 0, 0], { profile: [{ x: .16, y: -.27 }, { x: .15, y: -.2 }, { x: .08, y: -.02 }, { x: .07, y: .04 }, { x: .09, y: .15 }, { x: .1, y: .27 }, { x: .092, y: .27 }, { x: .082, y: .15 }, { x: .062, y: .04 }, { x: .072, y: -.02 }, { x: .142, y: -.2 }, { x: .152, y: -.27 }, { x: .16, y: -.27 }] }), cylinder("完整大口鼓面独立绷紧的皮膜", [0, .18, -.2715], [.32, .004, .32], material.ivory, [90, 0, 0]), cylinder("完整小口鼓面独立绷紧的皮膜", [0, .18, .2715], [.2, .004, .2], material.ivory, [90, 0, 0]), loop("大鼓面外围独立调张的金属压箍", [0, .18, -.265], .165, .008, [90, 0, 0], material.steel), loop("小鼓面外围独立调张的金属压箍", [0, .18, .265], .105, .008, [90, 0, 0], material.steel)];
  for (const side of [-1, 1]) for (let index = 0; index < 6; index++) {
    const angle = index * Math.PI / 3, large = side < 0, hoop = large ? .165 : .105, lug = large ? .148 : .097;
    parts.push(box("分别固定在各端厚鼓腹上的调张支座", [Math.cos(angle) * lug, .18 + Math.sin(angle) * lug, side * .18], [.022, .014, .04], material.steel, [0, 0, index * 60]), rod("各鼓面独立通往本端支座而不靠挤压通长腰绳调音的拉杆", [Math.cos(angle) * hoop, .18 + Math.sin(angle) * hoop, side * .265], [Math.cos(angle) * lug, .18 + Math.sin(angle) * lug, side * .18], .006, material.steel));
  }
  return parts;
}

function dranyen(): ModelPart[] {
  const outline: [number, number][] = [[0, .012], [-.09, .025], [-.14, .08], [-.12, .14], [-.065, .18], [-.11, .22], [-.12, .27], [-.065, .31], [-.08, .35], [-.06, .41], [-.025, .43], [.025, .43], [.06, .41], [.08, .35], [.065, .31], [.12, .27], [.11, .22], [.065, .18], [.12, .14], [.14, .08], [.09, .025]], parts: ModelPart[] = [carvedBowl("两侧多重缺腰且保留真实空腔的扎年整木琴壳", outline, .12, -.065), piercedPanel("沿三重腹形连续绷紧而不填实琴腔的皮面", [0, 0, -.065], outline, [], .004, material.ivory, [-90, 0, 0]), box("从多缺口琴腹伸出的通长无品木颈", [0, .72, -.02], [.056, .6, .09], material.wood), box("六只主弦轴实际穿入而同时承接兽首与长颈的实木轴箱", [0, 1.045, -.0025], [.06, .12, .075], material.wood), plate("具有开吻和额顶而接实轴箱后缘的兽形琴首", [0, 1.0, .07], [[-.025, 0], [.045, 0], [.07, .04], [.14, .07], [.17, .13], [.145, .17], [.08, .14], [.07, .1], [.025, .08], [-.025, .09]], .06, material.wood, [0, 90, 0]), box("在绷皮上承担三组双弦的厚鸣桥", [0, .13, -.0875], [.105, .04, .037], material.wood), box("让主弦从演奏平面折向各侧弦轴的上端弦枕", [0, .991, -.061], [.062, .015, .014], material.ivory), ...[-1, 1].map(side => ball("兽形琴首两侧嵌入的立体小眼珠", [side * .031, 1.12, -.04], [.012, .012, .012], material.dark))];
  for (let course = 0; course < 3; course++) for (let pair = 0; pair < 2; pair++) {
    const x = (course - 1) * .025 + (pair - .5) * .0035, side = pair ? 1 : -1, y = 1.01 + course * .035;
    parts.push(rod("各双弦在皮面尾部到鸣桥之间的下弦段", [x, .04, -.08], [x, .13, -.106], .0013, material.steel), rod("在通长无品琴颈前独立张紧的演奏弦段", [x, .13, -.106], [x, .995, -.068], .0013, material.steel), rod("越过上弦枕后实际折到相应侧弦轴的短弦段", [x, .995, -.068], [side * .055, y, -.028], .0013, material.steel), rod("分别从兽首两侧插入的独立木调音轴", [side * .025, y, -.02], [side * .085, y, -.02], .016, material.dark));
  }
  parts.push(box("位于颈侧而让第七根短弦提前止住的独立小弦枕", [.035, .8, -.063], [.035, .012, .016], material.ivory), rod("第七根弦独自调节的颈侧短木轴", [.022, .82, -.02], [.09, .82, -.02], .014, material.dark), rod("由鸣桥到颈侧小弦枕的第七根短空弦", [.045, .13, -.106], [.035, .8, -.071], .0013, material.steel), rod("第七根弦实际绕入侧轴的最后短段", [.035, .8, -.071], [.065, .82, -.027], .0013, material.steel));
  return parts;
}

function charangoBody(): { shell: ModelPart; outline: [number, number][]; ribs: ModelPart[] } {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [], known = new Map<string, number>(), grids: number[][][] = [], front = -.055;
  for (const inner of [false, true]) {
    const grid: number[][] = [], width = inner ? .101 : .108, height = inner ? .143 : .15, depth = inner ? .103 : .11;
    for (let row = 0; row <= 8; row++) {
      const theta = -Math.PI / 2 + row * Math.PI / 8, values: number[] = [];
      for (let column = 0; column <= 12; column++) {
        const phi = column * Math.PI / 12, point = { x: width * Math.cos(theta) * Math.cos(phi), y: .17 + height * Math.sin(theta), z: front + depth * Math.cos(theta) * Math.sin(phi) }, key = [point.x, point.y, point.z].map(value => Math.round(value * 1e10)).join(",");
        if (!known.has(key)) { known.set(key, vertices.length); vertices.push(point); } values.push(known.get(key)!);
      }
      grid.push(values);
    }
    grids.push(grid);
  }
  const face = (a: number, b: number, c: number) => { if (a !== b && b !== c && a !== c) indices.push(a, b, c); };
  for (let side = 0; side < 2; side++) for (let row = 0; row < 8; row++) for (let column = 0; column < 12; column++) {
    const a = grids[side]![row]![column]!, b = grids[side]![row + 1]![column]!, c = grids[side]![row]![column + 1]!, d = grids[side]![row + 1]![column + 1]!;
    if (side) { face(a, c, b); face(b, c, d); } else { face(a, b, c); face(b, d, c); }
  }
  for (let row = 0; row < 8; row++) for (const column of [0, 12]) {
    const a = grids[0]![row]![column]!, b = grids[0]![row + 1]![column]!, c = grids[1]![row]![column]!, d = grids[1]![row + 1]![column]!;
    if (column) { face(a, b, c); face(b, d, c); } else { face(a, c, b); face(b, c, d); }
  }
  const outline: [number, number][] = [...Array.from({ length: 9 }, (_, row): [number, number] => { const theta = -Math.PI / 2 + row * Math.PI / 8; return [.108 * Math.cos(theta), .17 + .15 * Math.sin(theta)]; }), ...Array.from({ length: 7 }, (_, row): [number, number] => { const theta = Math.PI / 2 - (row + 1) * Math.PI / 8; return [-.108 * Math.cos(theta), .17 + .15 * Math.sin(theta)]; })], ribs: ModelPart[] = [];
  for (let row = 1; row < 8; row++) { const theta = -Math.PI / 2 + row * Math.PI / 8, value = springWire(Array.from({ length: 13 }, (_, column): Triple => { const phi = column * Math.PI / 12; return [(.108 * Math.cos(theta) + .0015) * Math.cos(phi), .17 + .15 * Math.sin(theta), front + (.11 * Math.cos(theta) + .0015) * Math.sin(phi)]; }), .0015); value.name = "与深拱木背实际贴合而仿照甲壳分节的横肋"; value.color = "#74583f"; ribs.push(value); }
  return { shell: part("有内外表面和连续口沿的深拱仿甲壳木腹", "mesh", material.wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices }), outline, ribs };
}

function charango(): ModelPart[] {
  const body = charangoBody(), hole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const angle = -index * Math.PI / 6; return [Math.cos(angle) * .023, .205 + Math.sin(angle) * .023]; }), parts: ModelPart[] = [body.shell, piercedPanel("与深拱木腹口沿接实且有真圆音孔的薄木面板", [0, 0, -.055], body.outline, [hole], .004, material.ivory, [-90, 0, 0]), box("接入深拱琴腹上端的独立短木颈", [0, .42, -.019], [.047, .24, .08], material.wood), box("从琴腹上段一直伸到上弦枕的窄指板", [0, .395, -.0635], [.045, .29, .009], material.dark), box("直接搭在木音面上承担十弦张力的下桥", [0, .11, -.07], [.11, .032, .022], material.wood), box("在琴颈顶端让双弦折向弦轴箱的上弦枕", [0, .537, -.066], [.05, .012, .016], material.ivory), piercedPanel("内部保留两个真实弦轴槽的宽短琴头", [0, 0, .018], [[-.035, .53], [.035, .53], [.045, .685], [-.045, .685]], [[[-.029, .545], [-.029, .67], [-.012, .67], [-.012, .545]], [[.012, .545], [.012, .67], [.029, .67], [.029, .545]]], .06, material.wood, [-90, 0, 0])];
  for (let index = 0; index < body.ribs.length; index += 3) parts.push(combineMeshes("保留七条分节横肋而仅合并网格的木腹背肋组", "#74583f", body.ribs.slice(index, index + 3)));
  parts.push(...groupedBoxes("按十二平均律位置排列的独立金属音品", Array.from({ length: 18 }, (_, index) => box("独立金属音品", [0, .537 - .427 * (1 - 2 ** (-(index + 1) / 12)), -.0695], [.047, .0025, .003], material.steel))));
  for (let course = 0; course < 5; course++) for (let pair = 0; pair < 2; pair++) {
    const x = (course - 2) * .01 + (pair - .5) * .0025, side = pair ? 1 : -1, y = .555 + course * .025;
    parts.push(rod("甲壳腹琴尾至琴桥的独立细弦下段", [x, .065, -.064], [x, .11, -.081], .001, material.steel), rod("五个双弦音组中各自独立的演奏细弦", [x, .11, -.081], [x, .537, -.074], .001, material.steel), rod("从上弦枕实际斜接到相应侧弦轴的细弦端", [x, .537, -.074], [side * .055, y, -.032], .001, material.steel), rod("各双弦分别独立调节的横穿琴头木轴", [side * .022, y, -.022], [side * .072, y, -.022], .016, material.dark));
  }
  return parts;
}

function noteTouchInstrument(): ModelPart[] {
  const color = "#ecebe5", upper = sweptProfile("音符琴头上半真正中空而向嘴缝开放的柔性壳", color, [[.08, 0], [.075, .03], [.05, .057], [0, .065], [0, .058], [.045, .05], [.068, .025], [.072, 0]], Math.PI * 2, 16), lower = sweptProfile("音符琴头下半真正中空而向嘴缝开放的柔性壳", color, [[.08, 0], [.075, -.026], [.05, -.045], [0, -.052], [0, -.045], [.045, -.038], [.068, -.021], [.072, 0]], Math.PI * 2, 16), back = sweptProfile("只在背面相连而让前方嘴缝真正开通的柔性薄连接带", color, [[.08, 0], [.08, .008], [.072, .008], [.072, 0]], Math.PI, 12);
  upper.position.y = .084; lower.position.y = .076; back.position.y = .076;
  return [upper, lower, back, box("从琴头内接实后向上伸出的完整音符触杆", [0, .29, .012], [.025, .3, .021], color), box("正面可沿全长按压与滑动的连续触奏带", [0, .295, -.001], [.007, .22, .005], material.dark), plate("接在触杆上端而向右下卷回的音符旗形尾端", [0, 0, .012], [[-.012, .44], [.028, .44], [.1, .4], [.13, .33], [.105, .31], [.085, .36], [.055, .39], [-.012, .41]], .02, color, [0, 0, 0]), ...[-1, 1].map(side => ball("音符琴头正面立体镶入的小黑眼珠", [side * .026, .112, -.069], [.014, .014, .014], material.dark)), box("琴头背面与柔性后壁接实的电池及控制小舱", [0, .094, .076], [.035, .045, .012], color), box("背部控制舱外露的开关拨片", [0, .105, .085], [.014, .007, .006], material.dark)];
}

function pluriarc(): ModelPart[] {
  const outline: [number, number][] = [[-.15, -.22], [.15, -.22], [.16, .18], [.1, .24], [-.1, .24], [-.16, .18]], inner = outline.map(([x, z]) => [x * .91, z * .9] as [number, number]).reverse(), hole: [number, number][] = Array.from({ length: 12 }, (_, index) => { const angle = -index * Math.PI / 6; return [Math.cos(angle) * .028, -.07 + Math.sin(angle) * .028]; }), parts: ModelPart[] = [piercedPanel("多支弓颈共同连入而非乐器拼盘的单一木共鸣箱底", [0, .01, 0], outline, [], .01, material.wood), piercedPanel("同时承受多支弓颈张力且保持真空腔的箱壁", [0, .02, 0], outline, [inner], .105, material.wood), piercedPanel("多根弦共同接入且有真正声孔的薄木音面", [0, .125, 0], outline, [hole], .007, material.ivory), box("共鸣箱前端供全部弦独立系结的木琴桥", [0, .147, -.16], [.22, .03, .025], material.wood)];
  for (let index = 0; index < 5; index++) {
    const x = (index - 2) * .045, y = .69 + index * .04;
    parts.push(cord("各自从同一箱背伸出并独立承弦的弯曲弹性木颈", [[x, .075, .23], [x * 1.3, y * .4, .34], [x * 1.6, y * .76, .22], [x * 1.8, y, .02]], .011, material.wood), rod("每支独立弓颈分别连到共同音面的唯一演奏弦", [x, .162, -.16], [x * 1.8, y, .02], .0018, material.ivory), loop("弓颈末端实际束紧弦结的独立皮环", [x * 1.8, y - .008, .029], .013, .003, [-35, 0, 0], material.dark));
  }
  return parts;
}

function hexagonalFold(x: number): ModelPart {
  const vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  for (let section = 0; section < 3; section++) for (const inset of [0, .003]) for (let corner = 0; corner < 6; corner++) { const angle = Math.PI / 6 + corner * Math.PI / 3, radius = (section === 1 ? .115 : .105) - inset; vertices.push({ x: (section - 1) * .012, y: Math.cos(angle) * radius, z: Math.sin(angle) * radius }); }
  for (let section = 0; section < 2; section++) for (let corner = 0; corner < 6; corner++) { const next = (corner + 1) % 6, a = section * 12, b = (section + 1) * 12; indices.push(a + corner, a + next, b + corner, a + next, b + next, b + corner, a + corner + 6, b + corner + 6, a + next + 6, a + next + 6, b + corner + 6, b + next + 6); }
  for (const section of [0, 2]) for (let corner = 0; corner < 6; corner++) { const a = section * 12 + corner, b = section * 12 + (corner + 1) % 6; indices.push(...(section ? [a, b, a + 6, b, b + 6, a + 6] : [a, a + 6, b, b, a + 6, b + 6])); }
  const hardVertices: typeof vertices = [], hardIndices: number[] = [];
  for (let face = 0; face < indices.length; face += 6) {
    const corners = new Map<number, number>();
    for (const source of indices.slice(face, face + 6)) { if (!corners.has(source)) { corners.set(source, hardVertices.length); hardVertices.push({ ...vertices[source]! }); } hardIndices.push(corners.get(source)!); }
  }
  return part("具有内外表面和封闭端缘的真实六角气密风箱褶", "mesh", material.dark, [x, .13, 0], [1, 1, 1], [0, 0, 0], { vertices: hardVertices, indices: hardIndices });
}

function concertina(): ModelPart[] {
  const hexagon: [number, number][] = Array.from({ length: 6 }, (_, index) => { const angle = Math.PI / 6 + index * Math.PI / 3; return [Math.cos(angle) * .118, Math.sin(angle) * .118]; }), vents: [number, number][][] = Array.from({ length: 6 }, (_, index) => { const angle = Math.PI / 6 + index * Math.PI / 3; return [[.099, -.006], [.111, -.006], [.111, .006], [.099, .006]].map(([radius, tangent]) => [Math.cos(angle) * radius! - Math.sin(angle) * tangent!, Math.sin(angle) * radius! + Math.cos(angle) * tangent!] as [number, number]); }), parts: ModelPart[] = Array.from({ length: 10 }, (_, index) => hexagonalFold((index - 4.5) * .024));
  for (const side of [-1, 1]) {
    const ports: [number, number][][] = [], reeds: ModelPart[] = [], levers: ModelPart[] = [];
    for (let row = 0; row < 4; row++) for (let column = 0; column < 6; column++) {
      const y = .13 + (row - 1.5) * .032, z = (column - 2.5) * .025 + row % 2 * .007, py = (y - .13) * .6, pz = z * .6;
      parts.push(cylinder("六角端面分别独立压动的英式演奏按钮", [side * .154, y, z], [.012, .02, .012], material.ivory, [0, 0, 90]));
      ports.push([[side * py - .004, pz - .006], [side * py - .004, pz + .006], [side * py + .004, pz + .006], [side * py + .004, pz - .006]]);
      reeds.push(box("覆盖各独立簧口而留有微小振动开度的金属簧舌", [side * .112, .13 + py, pz], [.001, .006, .011], material.steel));
      levers.push(beam("从每个按钮独立辐向连到相应簧口的键杆", material.wood, [side * .137, y, z], [side * .112, .13 + py, pz], .002, .003));
    }
    parts.push(piercedPanel("外部有真实出气格孔而非印花的独立六角键箱端板", [side * .146, .13, 0], hexagon, vents, .026, material.wood, [0, 0, side * 90]), piercedPanel("键箱内侧各自贯通二十四簧口的独立簧板", [side * .111, .13, 0], hexagon.map(([x, z]) => [x * .84, z * .84] as [number, number]), ports, .018, material.wood, [0, 0, side * 90]), ...groupedBoxes("六角键箱内各自独立的薄簧舌合批", reeds), ...groupedBoxes("六角键箱内保持独立运动路径的辐向键杆合批", levers), plate("两端实际搭在木端板外侧的宽皮手带", [0, 0, 0], [[.146, .04], [.185, .055], [.211, .095], [.211, .165], [.185, .205], [.146, .22], [.146, .202], [.173, .19], [.191, .159], [.191, .101], [.173, .07], [.146, .058]].map(([x, y]) => [side * x!, y!] as [number, number]), .024, material.dark, [0, 0, 0]));
  }
  return parts;
}

function openFrameViolin(): ModelPart[] {
  const parts: ModelPart[] = [box("无声箱而直接承受弦张力的连续开框主脊", [0, .3, 0], [.028, .46, .028], material.dark), box("把无品指板实际托接到主脊前方的木颈芯", [0, .35, -.022], [.026, .38, .02], material.wood), box("弓弦演奏用的连续无品指板", [0, .365, -.0355], [.029, .25, .007], material.dark), box("将弦振动直接传入拾音元件的独立桥座", [0, .16, -.034], [.06, .027, .036], material.steel), box("让各弦从演奏面折向上端锁弦座的弦枕", [0, .491, -.037], [.032, .012, .013], material.ivory), box("接实到颈芯而不带传统涡卷的上端锁弦座", [0, .536, -.032], [.037, .025, .025], material.steel), box("四只下置调弦轴共同接入的尾端承弦座", [0, .065, -.0265], [.07, .028, .025], material.steel), ...[-1, 1].map(side => cord("只作承力骨架而不形成封闭共鸣腔的侧向弧臂", [[0, .08, .005], [side * .11, .12, .005], [side * .1, .26, .005], [0, .31, .005]], .012, material.dark)), ball("实际搭在左侧骨架上的立体下巴托", [-.065, .075, -.023], [.09, .025, .055], material.dark), cord("弧形肩托在琴架后方独立外弯的承肩垫", [[-.11, .09, .045], [0, .055, .07], [.11, .09, .045]], .01, material.dark), ...[-1, 1].map(side => rod("把肩垫两端接实到侧向骨架的短夹脚", [side * .1, .1, .005], [side * .11, .09, .045], .009, material.steel)), hollowPipe("主脊后侧与拾音电路相连的真实中空输出插座", [[0, .22, .013], [0, .22, .043]], [.007, .007], .002, material.steel), cord("与开框琴体同向立放而保持弓背弧度的独立木弓", [[.19, .02, .015], [.208, .31, .015], [.19, .61, .015]], .005, material.wood), rod("与弓背分开且可触及演奏弦的独立弓毛束", [.179, .02, .015], [.179, .61, .015], .0018, material.ivory)];
  for (let index = 0; index < 4; index++) {
    const x = (index - 1.5) * .007, tail = (index - 1.5) * .015;
    parts.push(cylinder("尾端各自独立而不只是附加普通木琴头的调弦旋钮", [tail, .058, -.048], [.012, .018, .012], material.steel, [90, 0, 0]), rod("由下置调弦旋钮扇形张到拾音桥的低弦段", [tail, .064, -.052], [x, .16, -.052], .0013, material.steel), rod("保留正常小提琴有效弦长的独立演奏弦", [x, .16, -.052], [x, .491, -.044], .0013, material.steel), rod("从上弦枕进入头端实际锁弦座的同弦短段", [x, .491, -.044], [x, .536, -.044], .0013, material.steel));
  }
  return parts;
}

export const musicExpansionBatchFiveObjects: MasterPrototype[] = [
  { name: "夹簧筒身杜杜克", itemType: "乐器", theme: "异域", build: duduk },
  { name: "双管束分奏劳内达", itemType: "乐器", theme: "欧式", build: launeddas },
  { name: "前伸喇叭立式钦巴索", itemType: "乐器", theme: "现代", build: cimbasso },
  { name: "金属双簧折管萨鲁索", itemType: "乐器", theme: "欧式", build: sarrusophone },
  { name: "肩背异形键颈演奏琴", itemType: "乐器", theme: "现代", build: keytar },
  { name: "梨腹短颈嘎杜尔卡琴", itemType: "乐器", theme: "欧式", build: gadulka },
  { name: "半蒙皮开腹库布孜琴", itemType: "乐器", theme: "异域", build: kobyz },
  { name: "双斜边弓奏三角筝", itemType: "乐器", theme: "欧式", build: bowedPsaltery },
  { name: "通长束腰阿巴拉契亚山地琴", itemType: "乐器", theme: "现代", build: mountainDulcimer },
  { name: "同轴叠碗演奏钟树", itemType: "乐器", theme: "现代", build: bellTree },
  { name: "立柱实盘双列碟钟琴", itemType: "乐器", theme: "现代", build: crotales },
  { name: "双腔开缝矩箱木梆块", itemType: "乐器", theme: "现代", build: woodBlock },
  { name: "铰轴双握柄鞭板", itemType: "乐器", theme: "现代", build: slapstick },
  { name: "拱把平底卡希希篮响器", itemType: "乐器", theme: "异域", build: caxixi },
  { name: "承水盆倒浮匏鼓", itemType: "乐器", theme: "异域", build: floatingWaterDrum },
  { name: "九膛折返短柱拉克特", itemType: "乐器", theme: "欧式", build: rackett },
  { name: "双腔鞍形金属卡拉卡响板", itemType: "乐器", theme: "异域", build: qraqeb },
  { name: "平U握柄双梯腔阿戈戈铃", itemType: "乐器", theme: "异域", build: agogo },
  { name: "偏腰异口独调巴塔鼓", itemType: "乐器", theme: "异域", build: bata },
  { name: "多缺口兽首七弦扎年琴", itemType: "乐器", theme: "中式", build: dranyen },
  { name: "木仿甲壳深腹恰朗戈琴", itemType: "乐器", theme: "异域", build: charango },
  { name: "开口音符触杆电子琴", itemType: "乐器", theme: "现代", build: noteTouchInstrument },
  { name: "共箱分颈多弓琴", itemType: "乐器", theme: "异域", build: pluriarc },
  { name: "六角辐键康采蒂纳琴", itemType: "乐器", theme: "欧式", build: concertina },
  { name: "开框拾音演奏小提琴", itemType: "乐器", theme: "现代", build: openFrameViolin },
];
