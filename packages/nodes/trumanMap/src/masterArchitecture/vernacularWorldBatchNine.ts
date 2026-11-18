import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { box, cylinder, design } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { courseWall, endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const wood = "#907351", stone = "#a5a794", plaster = "#c7bea9", roof = "#788878", earth = "#b69c7b", thatch = "#aca178";

// https://npgallery.nps.gov/GetAsset/f268a12e-d7b0-425b-85e4-ee8cf7c33409/
// https://npgallery.nps.gov/GetAsset/933a2004-263f-49d2-9125-5b0b7cb62a03
// https://site.kizhi.karelia.ru/info/en/about/unesco_en
// https://habitatio.epitesz.bme.hu/en/portfolio/musgum-hut/
// https://whc.unesco.org/en/list/1140/
// https://www.samoa.travel/samoa-travel-blog/your-guide-to-samoan-fales/
export const vernacularWorldBatchNineDesigns = [
  design("中央梯井分室八角宅", "八边外墙围住两层分室住宅，中央贯通旋梯井以短踏桥接到每层环厅，低八坡屋盖收向有窗瞭望亭", octagonStairHouse, "建筑", "欧式"),
  design("连续弧肋尖券大谷仓", "通高弯曲木肋由双侧基脚收至尖脊，连续曲侧壳罩住大跨贮草阁，阁下承柱和横梁托住楼面，前大门和高位进草口分别贯通", gothicArchBarn, "建筑", "欧式"),
  design("门廊接八角叠木鼓座教堂", "长入口木廊通向叠木八角主厅，低八坡过渡圈支起有高窗的八角鼓座，陡八角尖盖接小葱形顶，主厅内部沿轴贯通", octagonalLogChurch, "建筑", "欧式"),
  design("自承厚泥壳肋梯尖穹居", "厚尖穹完全依靠连续泥壳围成居室，钥匙孔形低门与小顶烟口均贯通，外侧泥肋和横踏棱从地面连续向上延伸", musgumShellHouse, "建筑", "异域"),
  design("鼓粮仓角塔连台土堡宅", "四个圆筒下室与短连接壁围成完整家宅，连续上层生活平台越过内梯洞，前方鼓形高粮仓与后方平顶住室分别立在角塔上", takientaTowerHouse, "建筑", "异域"),
  design("椭圆环柱长脊开敞大会屋", "椭圆长场外围木柱与三根中柱共同支起高长脊，弯木肋从低檐收至屋脊并在两端弧收，连续茅壳下四面通风且没有永久封墙", samoanFaleHouse, "建筑", "异域"),
];

function regularRing(radius: number, count = 8, start = Math.PI / 8): [number, number][] {
  return Array.from({ length: count }, (_, i) => [Math.cos(start + i * Math.PI * 2 / count) * radius, Math.sin(start + i * Math.PI * 2 / count) * radius]);
}

function floorBridge(name: string, angle: number, from: number, to: number, y: number): ModelPart {
  const point = (r: number, side: number): Triple => [Math.cos(angle) * r - Math.sin(angle) * side * .36, y, Math.sin(angle) * r + Math.cos(angle) * side * .36];
  return slopePanel(name, [point(from, -1), point(to, -1), point(to, 1), point(from, 1)], .16, wood);
}

function octagonStairHouse(): ModelPart[] {
  const corners = regularRing(7.4), p: ModelPart[] = [hardFloor("八角住宅完整落地石地坪", stone, corners, .2, [0, 0, 0]), hardFloor("八角上层环厅保留贯通中央旋梯井", wood, corners, .2, [0, 3.15, 0], [regularRing(1.6)]), hardFloor("屋顶瞭望亭保留旋梯到顶的真实井口", wood, regularRing(2.6), .2, [0, 8.1, 0], [regularRing(1.6)]), cylinder("通到瞭望亭并承住旋梯内端的中央木柱", 0, 4.25, 0, .26, 8.1, wood)];
  for (let i = 0; i < 8; i++) {
    const a = corners[i]!, b = corners[(i + 1) % 8]!, yaw = Math.atan2(b[1] - a[1], b[0] - a[0]), x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2, width = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (i === 5) p.push(...doorWall("八角住宅正对中央厅的前入口", 0, z, width, 3, .25, 1.15, 2.3, plaster, .2), hardWall("前入口上方住室的真实采光窗", width, 3, .25, [0, 3.2, z + .125], [[[-.7, .8], [.7, .8], [.7, 2], [-.7, 2]]], plaster));
    else p.push(hardWall("八角双层外立面各自贯通的上下采光窗", width, 6, .25, [x - Math.sin(yaw) * .125, .2, z + Math.cos(yaw) * .125], [[[-.7, .9], [.7, .9], [.7, 2.2], [-.7, 2.2]], [[-.7, 3.8], [.7, 3.8], [.7, 5], [-.7, 5]]], plaster, yaw * 180 / Math.PI));
    const angle = Math.PI / 8 + i * Math.PI / 4, next = angle + Math.PI / 4, at = (r: number, y: number, t: number): Triple => [Math.cos(t) * r, y, Math.sin(t) * r];
    p.push(slopePanel("八角住宅低屋盖收向瞭望亭的连续斜坡", [at(8, 6.15, angle), at(8, 6.15, next), at(2.2, 8.2, next), at(2.2, 8.2, angle)], .16, roof), slopePanel("八角瞭望亭完整小尖盖", [at(2.8, 9.8, angle), at(2.8, 9.8, next), [0, 11.6, 0]], .16, roof));
    const small = regularRing(2.3), c = small[i]!, d = small[(i + 1) % 8]!, sx = (c[0] + d[0]) / 2, sz = (c[1] + d[1]) / 2;
    p.push(hardWall("屋顶瞭望亭每一面真正贯通的高窗", Math.hypot(d[0] - c[0], d[1] - c[1]), 1.7, .14, [sx - Math.sin(yaw) * .07, 8.3, sz + Math.cos(yaw) * .07], [[[-.38, .45], [.38, .45], [.38, 1.3], [-.38, 1.3]]], wood, yaw * 180 / Math.PI));
  }
  const steps: ModelPart[] = [];
  for (let i = 0; i < 54; i++) { const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8, y = .2 + (i + 1) * .15, at = (r: number, t: number): Triple => [Math.cos(t) * r, y, Math.sin(t) * r]; steps.push(slopePanel("沿中央井连续上升的独立实楔木踏板", [at(.13, a), at(1.4, a), at(1.4, b), at(.13, b)], .12, wood)); }
  for (let i = 0; i < steps.length; i += 16) p.push(combineMeshes("全部保留真实步高的中央木旋梯", wood, steps.slice(i, i + 16)));
  p.push(floorBridge("旋梯第二十一阶接上层环厅的短踏桥", 20.5 * Math.PI / 8, 1.25, 1.95, 3.35), floorBridge("旋梯顶端接入瞭望亭地坪的短踏桥", 53.5 * Math.PI / 8, 1.25, 1.95, 8.3));
  for (const floor of [.2, 3.35]) {
    const height = floor < 1 ? 2.95 : 2.85;
    for (const side of [-1, 1]) {
      p.push(...doorWall("八角住宅中央环厅前后的分室内门", 0, side * 2.2, 4.4, height, .12, 1.1, 2.1, wood, floor), ...doorWall("八角住宅中央环厅左右的分室内门", 0, 0, 4.4, height, .12, 1.1, 2.1, wood, floor).map(value => { value.position = { x: side * 2.2, y: value.position.y, z: -value.position.x }; value.rotation.y = 90; return value; }));
    }
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; p.push(part("中央方厅角部接到八角外壁的竖直斜向房隔", "box", wood, [Math.cos(a) * 4.97, floor + height / 2, Math.sin(a) * 4.97], [3.72, height, .12], [0, -a * 180 / Math.PI, 0])); }
  }
  p.push(combineMeshes("八角外墙实际接到瞭望亭底座的径向承屋梁", wood, Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + i * Math.PI / 4; return meshBeam("外墙顶至瞭望亭底座的完整木斜梁", [Math.cos(a) * 7.1, 6.2, Math.sin(a) * 7.1], [Math.cos(a) * 2.2, 8.1, Math.sin(a) * 2.2], .22, wood); })));
  return p;
}

function gothicArchBarn(): ModelPart[] {
  const center = -8.202857142857143, radius = 15.202857142857143, endAngle = Math.atan2(12.8, -center), at = (side: number, t: number): [number, number] => [side * (center + radius * Math.cos(t)), .2 + radius * Math.sin(t)], profile = Array.from({ length: 9 }, (_, i) => at(1, endAngle * i / 8));
  const p: ModelPart[] = [box("尖券谷仓完整落地混凝土工作地坪", 0, .1, 0, 14.5, .2, 22.4, stone), hardFloor("尖券大贮草阁真实避开后部内梯的木楼板", wood, [[-6.5, -10.7], [6.5, -10.7], [6.5, 10.7], [-6.5, 10.7]], .2, [0, 3.6, 0], [[[-4.5, 6], [-3.5, 6], [-3.5, 7.6], [-4.5, 7.6]]]), ...ladder("谷仓下层穿过真实楼板洞到贮草阁的内梯", -4, .2, 9.6, 4.6, 6.1, 11)];
  for (const side of [-1, 1]) for (let i = 0; i < profile.length - 1; i++) { const a = profile[i]!, b = profile[i + 1]!; p.push(slopePanel("随完整弧肋从低基脚升到尖脊的连续侧壳", [[side * a[0], a[1], -11.3], [side * b[0], b[1], -11.3], [side * b[0], b[1], 11.3], [side * a[0], a[1], 11.3]], .13, roof)); }
  const cutY = 3.2, cutT = Math.asin((cutY - .2) / radius), cutX = center + radius * Math.cos(cutT), upper: [number, number][] = [[-cutX, cutY], [cutX, cutY], ...profile.filter(value => value[1] > cutY).map(value => [value[0], value[1]] as [number, number]), ...profile.filter(value => value[1] > cutY).slice(0, -1).reverse().map(value => [-value[0], value[1]] as [number, number])];
  for (const end of [-1, 1]) {
    for (const side of [-1, 1]) { const panel = hardFloor("尖券端门两旁随弧肋内收的完整低立面", plaster, side < 0 ? [[-7, .2], [-1.5, .2], [-1.5, cutY], [-cutX, cutY]] : [[1.5, .2], [7, .2], [cutX, cutY], [1.5, cutY]], .16, [0, 0, end * 11 + .08]); panel.rotation.x = -90; p.push(panel); }
    const panel = hardFloor("尖券端部保留高进草门和顶采光孔的完整山面", plaster, upper, .16, [0, 0, end * 11 + .08], [[[-1.45, 4.2], [1.45, 4.2], [1.45, 7.2], [-1.45, 7.2]], [[-.6, 10.2], [.6, 10.2], [.6, 11.2], [-.6, 11.2]]]); panel.rotation.x = -90; p.push(panel);
  }
  const ribs: ModelPart[] = [];
  for (const z of [-10.5, -7, -3.5, 0, 3.5, 7, 10.5]) for (const side of [-1, 1]) for (let i = 0; i < profile.length - 1; i++) { const a = profile[i]!, b = profile[i + 1]!; ribs.push(meshBeam("沿尖券弧线真实接续的胶合木承肋", [side * Math.max(0, a[0] - .07), a[1] - .12, z], [side * Math.max(0, b[0] - .07), b[1] - .12, z], .18, wood)); }
  for (let i = 0; i < ribs.length; i += 16) p.push(combineMeshes("全部保留弯曲主肋且阁内不加横向障碍的承架", wood, ribs.slice(i, i + 16)));
  for (const z of [-8, -3, 3, 8]) { for (const side of [-1, 1]) p.push(box("谷仓下层承草阁楼板的独立低木柱", side * 2.3, 1.9, z, .24, 3.4, .24, wood)); p.push(box("下层木柱和侧基脚共同承草阁的横梁", 0, 3.55, z, 13.3, .28, .23, wood)); }
  p.push(box("沿尖券高脊贯通大贮草阁的吊草轨", 0, 12.72, 0, .13, .17, 21.8, wood));
  return p;
}

function octagonalLogChurch(): ModelPart[] {
  const corners = regularRing(5.5), p: ModelPart[] = [hardFloor("八角叠木主厅完整石基", stone, regularRing(5.9), .2, [0, 0, 0]), box("长入口木廊通向主厅的独立石地坪", 0, .1, -8.5, 5.7, .2, 7.5, stone), ...gableCover("长入口木廊独立双坡木片盖", 6.3, 7.9, 3.5, 1.8, roof, 0, -8.5), courseWall("长入口木廊最前方的真门叠木壁", 0, -12, 5.4, .22, .2, 10, .35, wood, 0, 1.1, 6), endGable(0, -12, 5.4, 3.7, 1.44, wood)];
  for (const side of [-1, 1]) p.push(courseWall("从入口前门连到八角主厅的长叠木侧壁", side * 2.6, -8.5, 7, .22, .2, 10, .35, wood, 90));
  for (let i = 0; i < 8; i++) {
    const a = corners[i]!, b = corners[(i + 1) % 8]!, yaw = Math.atan2(b[1] - a[1], b[0] - a[0]), x = (a[0] + b[0]) / 2, z = (a[1] + b[1]) / 2;
    p.push(courseWall("八角主厅每面相互咬合的通高叠木壁", x, z, Math.hypot(b[0] - a[0], b[1] - a[1]) + .15, .28, .2, 15, .4, wood, -yaw * 180 / Math.PI, i === 5 ? 1.2 : 0, i === 5 ? 6 : 0));
    const angle = Math.PI / 8 + i * Math.PI / 4, next = angle + Math.PI / 4, at = (r: number, y: number, t: number): Triple => [Math.cos(t) * r, y, Math.sin(t) * r];
    p.push(slopePanel("主厅收至八角高鼓座的真实承顶过渡坡", [at(6, 6, angle), at(6, 6, next), at(3.2, 7.4, next), at(3.2, 7.4, angle)], .18, roof), slopePanel("高鼓座之上完整陡八角尖盖", [at(3.7, 10, angle), at(3.7, 10, next), at(.3, 16.6, next), at(.3, 16.6, angle)], .18, roof));
    const small = regularRing(3.2), c = small[i]!, d = small[(i + 1) % 8]!, sx = (c[0] + d[0]) / 2, sz = (c[1] + d[1]) / 2;
    p.push(hardWall("八角高鼓座各面真采光窗", Math.hypot(d[0] - c[0], d[1] - c[1]), 3.5, .2, [sx - Math.sin(yaw) * .1, 7.25, sz + Math.cos(yaw) * .1], [[[-.45, 1.1], [.45, 1.1], [.45, 2.4], [-.45, 2.4]]], wood, yaw * 180 / Math.PI));
  }
  p.push(cylinder("陡八角尖盖上承住葱形小顶的短座", 0, 16.67, 0, .7, .16, wood), part("陡八角木教堂顶端完整小葱形木顶", "lathe", roof, [0, 0, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 0, y: 16.7 }, { x: .2, y: 16.7 }, { x: .52, y: 17.2 }, { x: .83, y: 17.65 }, { x: .62, y: 18.2 }, { x: .12, y: 18.9 }, { x: 0, y: 19.15 }] }), box("葱形小顶上接出的木十字竖杆", 0, 19.52, 0, .09, 1.1, .09, wood), box("木十字竖杆上实际穿接的短横梁", 0, 19.75, 0, .68, .09, .09, wood), ...doorWall("主厅后部小圣所前的完整木隔屏", 0, 2.9, 7.7, 3.2, .12, 1, 2.4, wood, .2), box("木隔屏后的小圣所抬高石台", 0, .37, 3.8, 4.5, .34, 1.7, stone));
  for (const side of [-1, 1]) p.push(box("主厅两旁实际落地的长坐台", side * 3.2, .45, 0, .75, .5, 4, wood));
  return p;
}

export function radialShellBand(name: string, color: string, lower: [number, number], upper: [number, number], start: number, end: number, thickness: number): ModelPart {
  const point = (r: number, y: number, a: number): Triple => [Math.cos(a) * r, y, Math.sin(a) * r], p = [point(lower[0], lower[1], start), point(lower[0], lower[1], end), point(upper[0], upper[1], end), point(upper[0], upper[1], start), point(lower[0] - thickness, lower[1], start), point(lower[0] - thickness, lower[1], end), point(upper[0] - thickness, upper[1], end), point(upper[0] - thickness, upper[1], start)];
  const faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4], [3, 7, 6, 2], [0, 4, 7, 3], [1, 2, 6, 5]], vertices = faces.flatMap(face => face.map(index => { const v = p[index]!; return { x: v[0], y: v[1], z: v[2] }; })), indices = faces.flatMap((_, i) => [i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3]);
  return part(name, "mesh", color, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function musgumShellHouse(): ModelPart[] {
  const mud = "#b49370", p: ModelPart[] = [cylinder("尖泥穹居内完整压实泥地坪", 0, .1, 0, 7.3, .2, earth)], profile: [number, number][] = [[3.6, .2], [3.59, 1.5], [3.48, 2.4], [3.25, 3.9], [2.75, 5.4], [1.95, 7], [1.1, 8.3], [.25, 9.3]], angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 258, 262, 278, 282, 300, 330, 360], shells: ModelPart[] = [];
  for (let i = 0; i < angles.length - 1; i++) for (let band = 0; band < profile.length - 1; band++) {
    if ((band === 0 && angles[i] === 262) || (band === 1 && angles[i]! >= 258 && angles[i]! < 282)) continue;
    const a = profile[band]!, b = profile[band + 1]!; shells.push(radialShellBand("有真实径向厚度且避开钥匙孔入口的自承泥壳", mud, a, b, angles[i]! * Math.PI / 180, angles[i + 1]! * Math.PI / 180, Math.min(.3, b[0] * .6)));
  }
  for (let i = 0; i < shells.length; i += 16) p.push(combineMeshes("连续厚泥壳围成尖穹空室并在顶心留烟孔", mud, shells.slice(i, i + 16)));
  const ribs: ModelPart[] = [], steps: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const angle = (15 + i * 30) * Math.PI / 180, at = (r: number, y: number, a = angle): Triple => [Math.cos(a) * r, y, Math.sin(a) * r];
    for (let band = 0; band < profile.length - 1; band++) { const a = profile[band]!, b = profile[band + 1]!; ribs.push(meshBeam("贴在厚泥壳外而不断开的凸起泥承肋", at(a[0] + .035, a[1]), at(b[0] + .035, b[1]), .15, mud)); }
    for (let band = 1; band < profile.length - 1; band++) { const a = profile[band]!; steps.push(meshBeam("连接外泥肋两旁并形成真实踏足的短横棱", at(a[0] + .08, a[1], angle - .06), at(a[0] + .08, a[1], angle + .06), .12, mud)); }
  }
  for (let i = 0; i < ribs.length; i += 16) p.push(combineMeshes("从地面沿尖穹伸到小顶口的全部凸泥肋", mud, ribs.slice(i, i + 16)));
  for (let i = 0; i < steps.length; i += 16) p.push(combineMeshes("外泥肋上全部保留的登顶维修踏棱", mud, steps.slice(i, i + 16)));
  p.push(box("低入口左边沿壳的厚土睡台", -1.8, .43, -.4, 1.35, .46, 2.8, mud), box("低入口右边分开小畜位的短厚土隔壁", 1.6, .65, -.4, .18, .9, 2.2, mud), box("小畜位后端留中央通路的横土隔壁", 2.05, .65, .7, 1.05, .9, .18, mud));
  return p;
}

function takientaTowerHouse(): ModelPart[] {
  const mud = "#b3926e", outline: [number, number][] = [], towers = [[3.7, -3.7, Math.PI], [3.7, 3.7, Math.PI * 1.5], [-3.7, 3.7, 0], [-3.7, -3.7, Math.PI / 2]];
  for (const [x, z, start] of towers) for (let i = 0; i <= 6; i++) { const a = start! + i * Math.PI / 4; outline.push([x! + Math.cos(a) * 1.7, z! + Math.sin(a) * 1.7]); }
  const p: ModelPart[] = [hardFloor("四鼓塔连壁土宅完整连贯泥地坪", earth, outline, .2, [0, 0, 0]), hardFloor("四圆角土塔共同承住的连续生活平台", mud, outline, .25, [0, 3.1, 0], [[[-1.9, -2.5], [-.9, -2.5], [-.9, -.9], [-1.9, -.9]]]), ...ladder("由底层穿真实平台口登上生活露台的内梯", -1.4, .2, .5, 4.1, -2.2, 10), ...doorWall("鼓塔之间进入下层家宅的低主门", 0, -3.7, 4, 3.1, .35, 1.15, 2, mud, .2), box("后两鼓塔之间接续的短厚泥壁", 0, 1.75, 3.7, 4, 3.1, .35, mud)];
  for (const side of [-1, 1]) p.push(box("前后圆塔之间接续的短厚泥壁", side * 3.7, 1.75, 0, .35, 3.1, 4, mud), box("生活露台前后两侧真实低护壁", 0, 3.67, side * 3.7, 4, .64, .3, mud), box("生活露台左右两侧真实低护壁", side * 3.7, 3.67, 0, .3, .64, 4, mud));
  for (const [x, z] of towers) {
    const facing = Math.atan2(-z!, -x!), gap = Math.PI / 4, wall = halfRoundWall("下层圆塔室面对内厅的真实低门口", 1.7, .3, 1.8, [x!, .2, z!], -(facing + gap / 2) * 180 / Math.PI, mud, Math.PI * 2 - gap); p.push(wall);
    const header = ring("圆塔低门上方保持连续的厚泥环壁", mud, 1.7, .3, 2.65, 1.3); header.position.x = x!; header.position.z = z!; p.push(header);
    if (z! < 0) {
      p.push(part("前圆塔平台上鼓起并保留真实内腔的高粮仓", "lathe", mud, [x!, 0, z!], [1, 1, 1], [0, 0, 0], { profile: [{ x: 1.3, y: 3.35 }, { x: 1.65, y: 3.9 }, { x: 1.85, y: 4.7 }, { x: 1.78, y: 5.5 }, { x: 1.32, y: 6.2 }, { x: 1.1, y: 6.2 }, { x: 1.55, y: 5.42 }, { x: 1.62, y: 4.7 }, { x: 1.42, y: 3.98 }, { x: 1.1, y: 3.35 }, { x: 1.3, y: 3.35 }] }), cylinder("鼓形粮仓底部真实封合的泥底盘", x!, 3.43, z!, 2.55, .16, mud), part("鼓粮仓上方留内腔且坐在鼓肩上的高锥茅盖", "lathe", thatch, [x!, 0, z!], [1, 1, 1], [0, 0, 0], { profile: [{ x: 2.25, y: 5.05 }, { x: .07, y: 8.4 }, { x: .07, y: 8.2 }, { x: 2.05, y: 5.05 }, { x: 2.25, y: 5.05 }] }));
    } else {
      const room = halfRoundWall("露台后侧圆住室通向平台的真实低门", 1.7, .25, 1.8, [x!, 3.35, z!], -(facing + gap / 2) * 180 / Math.PI, mud, Math.PI * 2 - gap), top = ring("上层圆住室门头以上的完整泥圈", mud, 1.7, .25, 5.4, .5); top.position.x = x!; top.position.z = z!;
      p.push(room, top, cylinder("后圆住室可见的完整平泥顶", x!, 5.7, z!, 3.65, .2, mud));
    }
  }
  return p;
}

function samoanFaleHouse(): ModelPart[] {
  const perimeter = (radius: number, y: number): Triple[] => [...Array.from({ length: 13 }, (_, i): Triple => { const a = Math.PI + i * Math.PI / 12; return [Math.cos(a) * radius, y, -5.5 + Math.sin(a) * radius]; }), ...Array.from({ length: 13 }, (_, i): Triple => { const a = i * Math.PI / 12; return [Math.cos(a) * radius, y, 5.5 + Math.sin(a) * radius]; })], outline = perimeter(6.4, 0).map(([x, , z]): [number, number] => [x, z]), p: ModelPart[] = [hardFloor("椭圆大会屋完整抬起的珊瑚石踏坪", stone, outline, .3, [0, 0, 0])], sections = [[6.24, 3.3], [6, 4.3], [5.1, 6.1], [3, 7.5], [0, 8]], pieces: ModelPart[] = [], edgeFrames: ModelPart[] = [];
  for (let band = 0; band < sections.length - 1; band++) {
    const a = perimeter(sections[band]![0]!, sections[band]![1]!), b = perimeter(sections[band + 1]![0]!, sections[band + 1]![1]!);
    for (let i = 0; i < a.length; i++) {
      const next = (i + 1) % a.length, top = Math.hypot(b[i]![0] - b[next]![0], b[i]![2] - b[next]![2]) < .001 ? [a[i]!, a[next]!, b[i]!] : [a[i]!, a[next]!, b[next]!, b[i]!];
      pieces.push(slopePanel("从椭圆低檐连续弯收至高长脊的茅屋片", top, .12, thatch));
    }
  }
  for (let i = 0; i < pieces.length; i += 16) p.push(combineMeshes("两端弧收且屋脊连续的完整椭圆大会屋茅壳", thatch, pieces.slice(i, i + 16)));
  const posts = perimeter(6, .3);
  for (let i = 0; i < posts.length; i++) {
    const a = posts[i]!, b = posts[(i + 1) % posts.length]!; p.push(cylinder("椭圆外缘从石坪接到茅壳的独立通风木柱", a[0], 2.25, a[2], .2, 3.9, wood)); edgeFrames.push(meshBeam("椭圆环柱顶部逐段连续的承屋长枋", [a[0], 4.17, a[2]], [b[0], 4.17, b[2]], .16, wood));
  }
  for (let i = 0; i < edgeFrames.length; i += 16) p.push(combineMeshes("椭圆柱圈之上完整闭合的承屋环枋", wood, edgeFrames.slice(i, i + 16)));
  for (const z of [-2.75, 0, 2.75]) for (const side of [-1, 1]) p.push(cylinder("椭圆长边中段分跨承檐的独立通风木柱", side * 6, 2.25, z, .2, 3.9, wood));
  for (const z of [-4, 0, 4]) p.push(cylinder("大会屋内承担高长脊的通高中木柱", 0, 4.1, z, .28, 7.6, wood));
  p.push(box("三中柱顶端共同承住的完整高长脊", 0, 7.89, 0, .23, .18, 11.5, wood));
  const ribs: ModelPart[] = [];
  for (const z of [-5.5, -2.75, 0, 2.75, 5.5]) for (const side of [-1, 1]) for (let i = 0; i < sections.length - 1; i++) { const a = sections[i]!, b = sections[i + 1]!; ribs.push(meshBeam("沿长脊两侧弯收的连续承壳木肋", [side * a[0]!, a[1]! - .12, z], [side * b[0]!, b[1]! - .12, z], .11, wood)); }
  for (const end of [-1, 1]) for (let ray = 1; ray <= 5; ray++) {
    const angle = (end < 0 ? Math.PI : 0) + ray * Math.PI / 6;
    for (let i = 0; i < sections.length - 1; i++) { const a = sections[i]!, b = sections[i + 1]!; ribs.push(meshBeam("弧形端柱圈向长脊端部弯收的放射木肋", [Math.cos(angle) * a[0]!, a[1]! - .12, end * 5.5 + Math.sin(angle) * a[0]!], [Math.cos(angle) * b[0]!, b[1]! - .12, end * 5.5 + Math.sin(angle) * b[0]!], .11, wood)); }
  }
  for (let i = 0; i < ribs.length; i += 16) p.push(combineMeshes("完整保留各榀与长脊相接的弯肋承架", wood, ribs.slice(i, i + 16)));
  p.push(box("椭圆大会屋前方贴住高石坪的低踏石", 0, .075, -12.05, 2.2, .15, 1.1, stone));
  return p;
}
