import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { helicalFlight, shipHull } from "../masterTransport/parts";
import { box, cylinder, design } from "./structures";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";

const wood = "#917452", stone = "#a5a495", earth = "#9c8b6b", plaster = "#c4baa2", thatch = "#a79b72", slate = "#76877b", iron = "#617776";

// https://www.cultureelerfgoed.nl/documenten/2017/01/01/verbonden-door-de-stolp
// https://www.muehlenverein-minden-luebbecke.de/muehlen/details.php?ID=44
// https://www.gradierwerk-badsalzungen.de/funktionsweise-und-technik/
// https://woodbridgetidemill.org.uk/wp-content/uploads/sites/21/2019/07/Curriculum-Pack_webopt_2019.pdf
// https://www.nps.gov/knri/learn/historyculture/earthlodge.htm
// https://www2.regione.sicilia.it/beniculturali/museomistretta/02_pulsanti/percorsi/08_vino_olio/pagine/009.htm
export const vernacularWorldBatchSevenDesigns = [
  design("四内柱金字盖中心贮草农舍", "四根高内柱围住中央贮草方场并承担大金字屋盖，低居室和畜区围绕高场布置，侧后大车门进入独立打谷边道", stolpFarmhouse, "建筑", "欧式"),
  design("双船外夹水轮浮磨坊", "大屋船容纳磨粮间，小副船承住水轮轴另一端，两船之间的宽拨水轮经贯墙轴连到屋内竖轴与磨石", floatingShipMill, "建筑", "欧式"),
  design("束枝布卤蒸发长栈", "长木架内填成真实透隙枝束墙，顶部长槽把卤液分向两侧枝面，下部接卤槽与独立检修步廊贯通全长，外梯通向上层布卤台", graduationTower, "建筑", "欧式"),
  design("蓄潮闸池旁通轮道石磨坊", "三面围堤蓄潮池分别接封水入潮闸和带水轮的出潮道，磨坊立在轮道旁，长横轴穿过真墙孔驱动室内高磨台", tidalPondMill, "建筑", "欧式"),
  design("四中柱辐椽覆土地屋", "中央四柱方框支起放射木椽，低圆围壁和厚覆土坡盖包住完整居室，长覆土入口穿过低壳，中央顶烟口与沿边睡台保留", fourPostEarthlodge, "建筑", "异域"),
  design("高踏池低收槽长梁酿酒坊", "宽石屋内抬高踏酿池由真排汁孔接到低收集槽，独立石阶登上高池，后部长梁压榨台与前方搬运通道相通", palmentoWinery, "建筑", "欧式"),
];

function stolpFarmhouse(): ModelPart[] {
  const p: ModelPart[] = [box("方形农舍完整夯实地坪", 0, .1, 0, 18, .2, 18, earth), ...doorWall("前部居住区通向公共边道的门壁", 0, -8.7, 17.8, 3.2, .28, 1.15, 2.2, plaster, .2), box("后大车门左边的完整砖墙", -4.05, 1.8, 8.7, 9.7, 3.2, .28, plaster), ...doorWall("侧后打谷边道的高大车门", 4.85, 8.7, 8.1, 3.2, .28, 2.7, 3, plaster, .2)];
  const windows: [number, number][][] = [-5.8, 0, 5.8].map(x => [[x - .65, 1], [x + .65, 1], [x + .65, 2.2], [x - .65, 2.2]]);
  for (const side of [-1, 1]) p.push(hardWall("方形低外墙保留沿边房室的真实侧窗", 17.4, 3.2, .28, [side * 8.7 - .14, .2, 0], windows, plaster, 90));
  for (const x of [-3, 3]) for (const z of [-3, 3]) p.push(box("中央贮草方场四角通高内柱", x, 4.32, z, .35, 8.24, .35, wood));
  for (const side of [-1, 1]) p.push(box("四内柱之上贯通左右的方框顶枋", 0, 8.53, side * 3, 6.5, .22, .28, wood), box("四内柱之上贯通前后的方框顶枋", side * 3, 8.53, 0, .28, .22, 6.5, wood));
  p.push(...doorWall("前低居室与中央高场分界的内门", 0, -4.6, 17.3, 2.7, .16, 1.1, 2.1, wood, .2));
  const corners: Triple[] = [[-9.6, 2.85, -9.6], [9.6, 2.85, -9.6], [9.6, 2.85, 9.6], [-9.6, 2.85, 9.6]];
  for (let i = 0; i < 4; i++) p.push(slopePanel("由四内柱承住的完整陡金字茅盖", [corners[i]!, corners[(i + 1) % 4]!, [0, 11.5, 0]], .18, thatch), beam("从墙角穿过高内柱方框的完整斜椽", wood, [corners[i]![0] * .9, 3.58, corners[i]![2] * .9], [0, 11.28, 0], .22));
  p.push(box("前方低居室上覆盖而中央草场挑空的木平顶", 0, 2.99, -6.65, 17.1, .18, 3.9, wood), box("前居住室左右分隔墙", -2.5, 1.55, -6.65, .13, 2.7, 3.9, wood), box("中央方场靠打谷道一侧的低挡草板", 3.2, .91, 0, .12, 1.42, 5.9, wood));
  for (const z of [-2.9, .6, 4.1]) p.push(box("侧后畜区向内敞口的低横隔栏", -6.1, .86, z, 4.3, 1.32, .12, wood));
  return p;
}

function paddleWaterWheel(x: number, y: number, z: number, radius: number, width: number): ModelPart[] {
  const p: ModelPart[] = [], spokes: ModelPart[] = [], paddles: ModelPart[] = [];
  for (const side of [-1, 1]) { const rim = ring("宽拨水轮两侧连续承叶轮圈", wood, radius, .13, 0, .14); rim.position = { x: x + side * width * .38, y, z }; rim.rotation.z = 90; p.push(rim); }
  for (let i = 0; i < 12; i++) {
    const a = i * Math.PI / 6;
    for (const side of [-1, 1]) spokes.push(meshBeam("水轮轮毂实际接到轮圈的径向木辐", [x + side * width * .38, y, z], [x + side * width * .38, y + Math.cos(a) * (radius - .08), z + Math.sin(a) * (radius - .08)], .12, wood));
    const paddle = solidBox("横跨两轮圈并接到木辐外端的拨水叶", 0, 0, 0, width, .13, .48, wood); paddle.position = { x, y: y + Math.cos(a) * (radius - .08), z: z + Math.sin(a) * (radius - .08) }; paddle.rotation.x = a * 180 / Math.PI; paddles.push(paddle);
  }
  for (let i = 0; i < spokes.length; i += 16) p.push(combineMeshes("完整保留全部径向承叶轮辐", wood, spokes.slice(i, i + 16)));
  p.push(combineMeshes("全部保留并沿轮周正确转向的宽拨水叶", wood, paddles));
  return p;
}

function floatingShipMill(): ModelPart[] {
  const largeHull = shipHull(5.2, 20, 1.4), smallHull = shipHull(2.5, 17, 1.4); largeHull.name = "承住完整磨粮屋的大尖艏屋船"; largeHull.position.x = -4.5; largeHull.color = wood; smallHull.name = "只承担外轮轴端的独立副船"; smallHull.position.x = 4.3; smallHull.color = wood;
  const p: ModelPart[] = [largeHull, smallHull, box("磨粮屋船上完整工作木甲板", -4.5, 1.48, 0, 4.9, .16, 13, wood), box("副船轮轴座下方连续甲板", 4.3, 1.48, 0, 2.35, .16, 13, wood), ...doorWall("前甲板进入磨间的真门", -4.5, -5.5, 4.8, 3.4, .16, 1.05, 2.15, plaster, 1.56), hardWall("磨间后壁真正贯通的采光窗", 4.8, 3.4, .16, [-4.5, 1.56, 5.58], [[[-.65, 1.1], [.65, 1.1], [.65, 2.3], [-.65, 2.3]]], plaster), hardWall("临水轮侧壁实际避开长横轴的贯通孔", 11, 3.4, .16, [-2.18, 1.56, 0], [[[-.21, .63], [.21, .63], [.21, 1.05], [-.21, 1.05]]], plaster, 90), box("磨间外岸一侧完整围墙", -6.9, 3.26, 0, .16, 3.4, 11, plaster), ...gableCover("完整屋船磨间双坡屋盖", 5.7, 11.7, 4.83, 1.7, slate, -4.5, 0), ...[-1, 1].map(end => endGable(-4.5, end * 5.5, 4.8, 4.96, 1.41, plaster)), ...paddleWaterWheel(.5, 2.4, 0, 2.25, 4.4), cylinder("从屋内磨机穿墙抵到副船座的长轮轴", -.3, 2.4, 0, .28, 9.6, iron, [0, 0, 90]), box("副船上真正落在甲板的轮轴承座", 4.3, 1.96, 0, .8, .8, .75, stone)];
  for (const end of [-1, 1]) p.push(box("避开水轮的两船端部横联梁", -.2, 1.4, end * 5.9, 9.3, .27, .32, wood));
  const gear = ring("屋船内长横轴上的竖传动木轮", wood, .8, .14, 0, .18); gear.position = { x: -4.5, y: 2.4, z: 0 }; gear.rotation.z = 90;
  const crown = ring("与竖木轮下缘相接的水平传动轮", wood, .62, .13, 1.72, .18); crown.position.x = -4.5;
  p.push(gear, crown, cylinder("水平传动轮至磨石中央的竖立磨轴", -4.5, 2.46, 0, .14, 1.68, iron), cylinder("屋船内架高的完整下磨石", -4.5, 3.01, 0, 1.9, .24, stone), cylinder("磨粮竖轴上方的完整转磨石", -4.5, 3.25, 0, 1.7, .24, stone));
  for (const side of [-1, 1]) p.push(box("实际接回甲板的架磨木足", -4.5 + side * .8, 2.23, 0, .2, 1.34, 1.8, wood), beam("屋船前后系泊缆", iron, [-6.7, 1.6, side * 5.7], [-10, .1, side * 8], .055));
  return p;
}

function graduationTower(): ModelPart[] {
  const brine = "#9db5aa", twig = "#786b51", p: ModelPart[] = [box("长束枝墙下完整接卤槽底", 0, .16, 0, 3.6, .32, 43, stone), ...gableCover("通长布卤台上方的独立挡雨屋盖", 6.4, 44, 8.9, 1.2, slate), box("枝束下方连续的浅卤液面", 0, .44, 0, 3.2, .035, 42.6, brine)];
  for (const side of [-1, 1]) p.push(box("接卤槽左右连续挡水壁", side * 1.72, .56, 0, .16, .8, 43, stone), box("长束枝墙两旁独立检修步廊", side * 2.6, .85, 0, 1.1, .18, 42.5, wood), box("布卤台两侧连续窄走道", side * 1.3, 8.31, 0, .8, .18, 42.5, wood), box("顶部长布卤槽底", side * .6, 8.45, 0, .48, .1, 41, wood), box("顶部长布卤槽外缘", side * .8, 8.65, 0, .07, .34, 41, wood), box("顶部长布卤槽内缘", side * .4, 8.65, 0, .07, .34, 41, wood));
  for (const end of [-1, 1]) p.push(box("接卤长槽端部封水壁", 0, .56, end * 21.42, 3.6, .8, .16, stone));
  const structure: ModelPart[] = [];
  for (const z of [-20, -15, -10, -5, 0, 5, 10, 15, 20]) {
    for (const side of [-1, 1]) structure.push(meshBeam("从落地石脚接到屋盖的通高架柱", [side * 2, 0, z], [side * 2, 9.2, z], .23, wood), meshBeam("长束枝墙外侧落地三角抗倾撑", [side * 3.6, .12, z], [side * 2, 5.4, z], .18, wood));
    structure.push(meshBeam("通高架柱之间的上层横梁", [-2.3, 8.2, z], [2.3, 8.2, z], .21, wood), meshBeam("跨接枝束两侧并承低步廊的底横木", [-3.5, .69, z], [3.5, .69, z], .21, wood));
  }
  for (const side of [-1, 1]) structure.push(meshBeam("木架两侧屋檐连续纵向承枋", [side * 2, 9.15, -21.5], [side * 2, 9.15, 21.5], .23, wood), meshBeam("低检修廊连续外侧护栏扶手", [side * 3.1, 1.85, -21], [side * 3.1, 1.85, 21], .08, wood));
  for (let i = 0; i < structure.length; i += 16) p.push(combineMeshes("完整长栈的落地木架与真实支撑", wood, structure.slice(i, i + 16)));
  const twigs: ModelPart[] = [], vertices = [-.5, .5].flatMap(y => [{ x: .5, y, z: 0 }, { x: -.25, y, z: .4330127 }, { x: -.25, y, z: -.4330127 }]), indices = [0, 1, 2, 3, 5, 4, 0, 4, 1, 0, 3, 4, 1, 5, 2, 1, 4, 5, 2, 3, 0, 2, 5, 3];
  for (let col = 0; col < 35; col++) for (let row = 0; row < 10; row++) for (let branch = 0; branch < 3; branch++) for (const side of [-1, 1]) {
    const seed = Math.sin(col * 14.3 + row * 7.9 + branch * 4.1), z = -20 + col * 1.15, y = 1.12 + row * .69, a: Triple = [side * (.52 + branch * .1), y, z + seed * .25], b: Triple = [side * (.68 + seed * .2), y + .2 + branch * .22, z + (branch % 2 ? -.78 : .78)];
    twigs.push({ ...beam("逐束交错且保留空气间隙的真实细枝", twig, a, b, .09), shape: "mesh", vertices, indices });
  }
  for (let i = 0; i < twigs.length; i += 80) p.push(combineMeshes("全部保留细枝交错体积的透隙布卤枝墙", twig, twigs.slice(i, i + 80)));
  p.push(...ladder("从外侧进入顶部布卤台的长检修木梯", 1.3, 0, -28, 9.1, -21.1, 21));
  return p;
}

function tidalPondMill(): ModelPart[] {
  const water = "#8da9a1", p: ModelPart[] = [box("蓄潮池与进出潮道共同底床", 0, .1, 4, 25, .2, 26, stone), box("蓄潮池高水位完整水面", 0, 2.7, 8.4, 23.6, .035, 15.5, water), box("蓄潮池后岸完整围堤", 0, 1.7, 16.4, 25, 3.2, 1, earth)];
  for (const side of [-1, 1]) p.push(box("蓄潮池左右两岸连续实心围堤", side * 12, 1.7, 8.2, 1, 3.2, 16.4, earth));
  for (const [a, b] of [[-12.5, -8.25], [-5.75, 2.25], [5.75, 12.5]]) p.push(box("真实避开入潮闸和轮道的石坝实体", (a! + b!) / 2, 1.7, 0, b! - a!, 3.2, 1.2, stone));
  p.push(box("独立入潮水闸的封水木扇", -7, 1.66, 0, 2.3, 2.72, .16, wood), box("入潮闸上方的横向检修踏桥", -7, 3.4, 0, 3.2, .2, 1.1, wood), box("长轮道向外排水的低水面", 4, .56, -4.8, 3.35, .035, 8.4, water), slopePanel("从蓄潮水位降向拨水轮的短引水底槽", [[2.35, 2.1, .6], [5.65, 2.1, .6], [5.65, 1.83, -1.4], [2.35, 1.83, -1.4]], .2, stone), ...paddleWaterWheel(4, 2.6, -3.7, 2.4, 2.8));
  for (const x of [2.25, 5.75]) p.push(hardWall("独立轮道石挡壁真正避开长横轮轴", 8, 3, .22, [x - .11, .2, -4], [[[.08, 2.17], [.52, 2.17], [.52, 2.63], [.08, 2.63]]], stone, 90));
  for (const x of [-8.25, -5.75]) p.push(box("入潮闸两侧竖向石导墩", x, 1.9, 0, .3, 3.4, 1.3, stone));
  for (const x of [-4.25, 1.65]) for (const z of [-8.6, .5]) p.push(box("轮道旁磨坊真正落地的石基墩", x, .84, z, .65, 1.28, .85, stone));
  p.push(box("磨坊在轮道旁的完整高工作地板", -1.3, 1.49, -4, 6.4, .22, 10, wood), ...doorWall("外石阶进入磨坊的前大门", -1.3, -9, 6.4, 3.5, .28, 1.5, 2.5, stone, 1.6), hardWall("磨坊后石壁的高采光孔", 6.4, 3.5, .28, [-1.3, 1.6, 1.14], [[[-.7, 1.3], [.7, 1.3], [.7, 2.4], [-.7, 2.4]]], stone), hardWall("水轮长横轴穿过磨坊侧石墙的真孔", 10, 3.5, .28, [1.76, 1.6, -4], [[[-.01, .79], [.61, .79], [.61, 1.21], [-.01, 1.21]]], stone, 90), box("磨坊背向轮道的完整厚侧墙", -4.5, 3.35, -4, .28, 3.5, 10, stone), ...gableCover("完整石磨坊通长双坡屋盖", 7.4, 10.8, 5, 2, slate, -1.3, -4), ...[-1, 1].map(end => endGable(-1.3, -4 + end * 5, 6.4, 5.1, 1.74, stone)), cylinder("从拨水轮经真墙孔伸入石磨坊的长轮轴", 1.55, 2.6, -3.7, .27, 8.6, iron, [0, 0, 90]));
  const gear = ring("磨坊内实际接横轮轴的竖传动轮", wood, .8, .13, 0, .18); gear.position = { x: -1.3, y: 2.6, z: -3.7 }; gear.rotation.z = 90;
  const crown = ring("横轮轴下缘连接磨盘竖轴的水平木轮", wood, .62, .13, 1.92, .18); crown.position = { x: -1.3, y: 1.92, z: -3.7 };
  p.push(gear, crown, cylinder("驱动架高石磨的竖磨轴", -1.3, 2.73, -3.7, .14, 1.8, iron), cylinder("潮磨工作高台上的下磨石", -1.3, 3.22, -3.7, 2.1, .25, stone), cylinder("竖磨轴上的上磨石", -1.3, 3.48, -3.7, 1.9, .26, stone));
  for (const side of [-1, 1]) p.push(box("从石磨底面真实落到楼板的宽木托脚", -1.3 + side * .9, 2.35, -3.7, .22, 1.5, 2, wood));
  const steps: ModelPart[] = [];
  for (let i = 0; i < 7; i++) { const h = (i + 1) * .2; steps.push(solidBox("从外低地接上高磨间的独立实心石级", -1.3, .2 + h / 2, -11.55 + i * .36, 1.8, h, .36, stone)); }
  p.push(combineMeshes("完整保留全部石阶的磨坊外梯", stone, steps), box("石梯顶端接入高磨间前门的实心平台", -1.3, .9, -9.15, 1.8, 1.4, .5, stone));
  return p;
}

function fourPostEarthlodge(): ModelPart[] {
  const p: ModelPart[] = [cylinder("厚覆土地屋内完整圆形土坪", 0, .225, 0, 16.6, .45, earth), box("长覆土入口独立延接室内的地坪", 0, .225, -9.7, 2.3, .45, 5.1, earth)], angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 262, 278, 300, 330, 360], profile = [[8.3, .45], [7.55, 2.45], [5.7, 3.85], [2.7, 5.1], [.65, 5.55]];
  for (let sector = 0; sector < angles.length - 1; sector++) {
    const a = angles[sector]! * Math.PI / 180, b = angles[sector + 1]! * Math.PI / 180, pieces: ModelPart[] = [];
    for (let band = 0; band < profile.length - 1; band++) {
      if (angles[sector] === 262 && band === 0) continue;
      const [r0, y0] = profile[band]!, [r1, y1] = profile[band + 1]!;
      pieces.push(slopePanel("连续厚覆土壳避开低入口和中央烟孔", [[Math.cos(a) * r0!, y0!, Math.sin(a) * r0!], [Math.cos(b) * r0!, y0!, Math.sin(b) * r0!], [Math.cos(b) * r1!, y1!, Math.sin(b) * r1!], [Math.cos(a) * r1!, y1!, Math.sin(a) * r1!]], .35, earth));
    }
    p.push(combineMeshes("厚覆土屋盖与低坡围壁的连续扇段", earth, pieces));
  }
  for (const x of [-1.9, 1.9]) for (const z of [-1.9, 1.9]) p.push(cylinder("地屋中央四柱方框的通高粗木柱", x, 2.55, z, .36, 4.2, wood));
  for (const side of [-1, 1]) p.push(box("中央四柱方框上横向交搭的粗承梁", 0, 4.75, side * 1.9, 4.4, .28, .28, wood), box("中央四柱方框上纵向交搭的粗承梁", side * 1.9, 4.75, 0, .28, .28, 4.4, wood), box("长低入口两旁真正连续的覆土厚壁", side * 1.05, 1.5, -9.7, .35, 2.1, 5.1, earth));
  p.push(box("低入口从外门伸进室内的厚覆土顶", 0, 2.46, -9.7, 2.45, .35, 5.1, earth), cylinder("中央烟孔正下方的不燃火塘底石", 0, .52, 0, 1.5, .14, stone));
  const rafters: ModelPart[] = [], beds: ModelPart[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (15 + i * 30) * Math.PI / 180, r = (value: number, y: number): Triple => [Math.cos(a) * value, y, Math.sin(a) * value];
    p.push(cylinder("低外木柱环承住辐射屋椽的独立柱", Math.cos(a) * 6.8, 1.62, Math.sin(a) * 6.8, .17, 2.34, wood));
    rafters.push(meshBeam("外木柱环至四柱方框的长放射椽", r(6.8, 2.8), r(2.68, 4.76), .15, wood), meshBeam("方框上方延至中央烟孔的短放射椽", r(2.68, 4.76), r(.7, 5.18), .13, wood));
  }
  for (let i = 0; i < rafters.length; i += 16) p.push(combineMeshes("完整保留四柱外的放射承屋木椽", wood, rafters.slice(i, i + 16)));
  for (const a of [Math.PI / 6, Math.PI * 5 / 6, Math.PI * 7 / 6, Math.PI * 11 / 6]) {
    const x = Math.cos(a) * 5.3, z = Math.sin(a) * 5.3, top = solidBox("沿边分离布置的睡台木面", 0, .91, 0, 2.1, .13, 2.3, wood); top.position = { x, y: 0, z }; top.rotation.y = -a * 180 / Math.PI; beds.push(top);
    for (const u of [-.8, .8]) for (const v of [-.85, .85]) beds.push(solidBox("沿边睡台真正落到土坪的短木足", x + u * Math.cos(a) - v * Math.sin(a), .665, z + u * Math.sin(a) + v * Math.cos(a), .1, .43, .1, wood));
  }
  for (let i = 0; i < beds.length; i += 16) p.push(combineMeshes("沿边睡台及全部落地短木足", wood, beds.slice(i, i + 16)));
  return p;
}

function palmentoWinery(): ModelPart[] {
  const p: ModelPart[] = [hardFloor("高踏池与低槽之间留真实下沉收汁空腔的石地坪", stone, [[-6, -7], [6, -7], [6, 7], [-6, 7]], .4, [0, 0, 0], [[[.4, -.3], [3.8, -.3], [3.8, 3.3], [.4, 3.3]]]), box("低收汁槽内独立低于作业地面的底石", 2.1, .1, 1.5, 3.4, .2, 3.6, stone), ...doorWall("供葡萄与酒桶搬入的高大前门", 0, -6.8, 11.6, 4.3, .4, 2.4, 3.2, plaster, .4), hardWall("酿酒坊后墙真正贯通的高窗", 11.6, 4.3, .4, [0, .4, 7], [[[-3.7, 2.5], [-2.3, 2.5], [-2.3, 3.5], [-3.7, 3.5]], [[2.3, 2.5], [3.7, 2.5], [3.7, 3.5], [2.3, 3.5]]], plaster), ...gableCover("覆盖双高低作业空间的完整长屋盖", 13.2, 14.6, 4.55, 2.6, slate)];
  for (const side of [-1, 1]) p.push(box("酿酒坊左右连续厚石围墙", side * 5.8, 2.55, 0, .4, 4.3, 13.6, plaster), endGable(0, side * 6.8, 11.6, 4.7, 2.29, plaster), box("高踏酿池前后真正挡住葡萄的石沿", -2.7, 3.15, 1.5 + side * 2.25, 4.4, 1.1, .22, stone), box("低收汁槽前后完整挡水石壁", 2.1, .85, 1.5 + side * 1.8, 3.5, 1.3, .2, stone));
  p.push(box("高踏酿池之下完整实心石台", -2.7, 1.5, 1.5, 4.4, 2.2, 4.5, stone), box("高踏酿池外侧厚石挡沿", -4.9, 3.15, 1.5, .22, 1.1, 4.5, stone), hardWall("高踏池向低收汁槽排汁的真实小穿孔", 4.5, 1.1, .22, [-.61, 2.6, 1.5], [[[-.15, .15], [.15, .15], [.15, .4], [-.15, .4]]], stone, 90), box("低收汁槽外侧完整挡水厚壁", 3.8, .85, 1.5, .2, 1.3, 3.6, stone), box("低收汁槽临高踏池一侧的完整挡壁", .4, .85, 1.5, .2, 1.3, 3.6, stone), box("从真排汁孔伸出并指向低槽的短石槽底", -.03, 2.72, 1.5, .85, .12, .38, stone));
  for (const end of [-1, 1]) p.push(box("短排汁石槽两侧的连续薄石挡沿", -.03, 2.9, 1.5 + end * .2, .85, .3, .06, stone));
  const steps: ModelPart[] = [];
  for (let i = 0; i < 13; i++) { const h = (i + 1) * 3.3 / 13; steps.push(solidBox("从作业地坪登上高踏池石沿的实心石级", -3.5, .4 + h / 2, -5.4 + i * .36, 1.3, h, .36, stone)); }
  for (let i = 0; i < 4; i++) { const h = .88 - i * .22; steps.push(solidBox("从石沿向高踏池内部下降的独立石级", -3.5, 2.6 + h / 2, -.35 + i * .35, 1.3, h, .35, stone)); }
  p.push(combineMeshes("完整内外登池石级从池沿越入高踏池", stone, steps), box("跨接外石梯和内降级且立于池壁的石沿平台", -3.5, 3.62, -.75, 1.4, .16, .6, stone), box("后部独立长梁压榨台的落地石床", 1.2, .85, 4.9, 2.8, .9, 2.5, stone), cylinder("长梁压榨台上承住压饼的圆木盘", 1.2, 1.4, 4.9, 1.9, .2, wood), box("将长梁压力传向木压盘的竖压木", 1.2, 2.69, 4.9, .35, 2.38, .35, wood), beam("从后部锚墩连续伸至收紧端的整根长压梁", wood, [-3.2, 4.3, 4.9], [4.8, 3.83, 4.9], .38));
  for (const z of [4.45, 5.35]) p.push(box("夹住压梁短端的落地石锚墩", -3.2, 2.4, z, .9, 4, .35, stone));
  p.push(cylinder("长梁末端通到底座的收紧螺杆", 4.6, 2.16, 4.9, .15, 3.52, wood), box("长梁螺杆底端的重石锚座", 4.6, .68, 4.9, 1, .56, 1, stone), box("供人转动长梁末端螺杆的横向长柄", 4.6, 1.6, 4.9, .13, .13, 2.5, wood));
  const thread = helicalFlight([4.6, .7, 4.9], .075, .13, 3.2, 8, 1, .03); thread.name = "长梁收紧螺杆上的真实连续螺纹"; thread.color = wood; p.push(thread);
  return p;
}
