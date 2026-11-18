import type { ModelPart, Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { barrelRoof } from "./spatialShells";
import { doorWall, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { radialShellBand } from "./vernacularWorldBatchNine";

const wood = "#8d7050", stone = "#a8a392", thatch = "#a89b70", earth = "#a48f71", bamboo = "#ac986c";

// https://museum-nias.org/en/nias-architecture/
// https://www.indonesia.travel/gb/en/travel-ideas/culture/rumah-sumba
// https://www.scitepress.org/PublishedPapers/2019/130507/
// https://whc.unesco.org/fr/listesindicatives/6444/
export const vernacularWorldBatchTwelveDesigns = [
  design("落石直斜粗柱外倾板墙大宅", "矩形高木宅的直柱和成对斜柱落在独立石脚上，侧墙托起陡大双坡盖，外倾前壁保留整排栅窗，后梯直入分隔的公厅与住室，屋坡真口接起翘通风扇", southNiasGreatHouse, "建筑", "异域"),
  design("交撑石压舱椭圆四柱宅", "椭圆板壁宅悬在直柱与交叉斜柱之上，斜撑间有独立压舱石，四根内主柱和两道高承枋托起长髋屋盖，外倾薄壁中的门窗与前登梯贯通", northNiasOvalHouse, "建筑", "异域"),
  design("四主柱高塔裙坡架空住居", "四根贯通主柱围住中央火塘并承住尖塔形空阁，宽低裙坡连续转入高陡塔坡，下部畜空与中部环形居住层分开，前后两处登梯分别接到外平台", sumbaTowerHouse, "建筑", "异域"),
  design("叠券独仓围院粮堡", "独立筒券储仓叠在填实的拱肩平台上，封闭外壁与高券门房围住内院，各仓真实门口朝院内打开，连续高廊由两列石阶连接到上层仓门", tunisianGhorfaKsar, "建筑", "异域"),
];

function southNiasGreatHouse(): ModelPart[] {
  const p: ModelPart[] = [box("矩形高木宅完整厚木楼面", 0, 3.97, .25, 10.3, .26, 17.8, wood)], feet: ModelPart[] = [], logs: ModelPart[] = [], framing: ModelPart[] = [];
  for (const z of [-7.7, 7.7]) for (const x of [-3.9, -1.3, 1.3, 3.9]) {
    feet.push(solidBox("粗木立柱下独立落地的宽石脚", x, .16, z, 1, .32, 1, stone));
    logs.push(tapered("从石脚真正接到楼梁的整根粗木立柱", wood, [[x, .32, z], [x, 3.79, z]], [.3, .25]));
  }
  for (const z of [-2.6, 2.6]) for (const x of [-3.9, 3.9]) {
    feet.push(solidBox("中间承屋直柱下实际承压的石垫", x, .16, z, .95, .32, .95, stone));
    logs.push(tapered("长宅中部实际承担楼梁的粗直柱", wood, [[x, .32, z], [x, 3.79, z]], [.28, .24]));
  }
  for (const z of [-6, 0, 6]) {
    feet.push(solidBox("成对横向斜柱共同落脚的完整厚石座", 0, .16, z, 1.1, .32, 1.1, stone));
    for (const side of [-1, 1]) logs.push(tapered("由同一低石脚向两侧长梁撑起的粗斜柱", wood, [[0, .35, z], [side * 3.9, 3.79, z]], [.25, .22]));
  }
  for (const x of [-3.9, 3.9]) for (const end of [-1, 1]) logs.push(tapered("沿长宅方向从低脚撑向端楼梁的纵向斜柱", wood, [[x, .35, 0], [x, 3.79, end * 7.7]], [.24, .21]));
  for (let i = 0; i < feet.length; i += 16) p.push(combineMeshes("所有直斜粗柱下真实分开的完整落地石脚", stone, feet.slice(i, i + 16)));
  for (let i = 0; i < logs.length; i += 16) p.push(combineMeshes("直柱与不穿地基的成对粗斜木柱完整承重系统", wood, logs.slice(i, i + 16)));
  for (const x of [-3.9, 3.9]) framing.push(meshBeam("承住全部高木楼面的完整纵向大木梁", [x, 3.78, -8.7], [x, 3.78, 9.1], .38, wood));
  for (const z of [-7.7, -2.6, 2.6, 7.7]) framing.push(meshBeam("立柱顶上跨过楼底的整根横系梁", [-4.9, 3.8, z], [4.9, 3.8, z], .32, wood));
  const slope = Math.atan(.75 / 3.3), facade = hardWall("真实外倾而保留贯通长栅窗的前板壁", 10, 3.3 / Math.cos(slope), .16, [0, 4.1, -8.5], [[[-4.3, 1 / Math.cos(slope)], [4.3, 1 / Math.cos(slope)], [4.3, 2.4 / Math.cos(slope)], [-4.3, 2.4 / Math.cos(slope)]]], wood); facade.rotation.x = -90 - slope * 180 / Math.PI; p.push(facade);
  for (let i = 0; i < 15; i++) { const x = -4.15 + i * 8.3 / 14; framing.push(meshBeam("外倾长窗中可透视的实际木栅", [x, 5.1, -8.5 - .75 / 3.3], [x, 6.5, -8.5 - .75 * 2.4 / 3.3], .085, wood)); }
  for (const side of [-1, 1]) {
    const value = hardFloor("从斜前壁连续接到后壁的承屋长侧板壁", wood, [[-8.5, 4.1], [9, 4.1], [9, 7.4], [-9.25, 7.4]], .18, [side * 5 - .09, 0, 0]); value.rotation = { x: -90, y: 0, z: -90 }; p.push(value);
  }
  p.push(...doorWall("可由后登梯真正进入的木宅端门", 0, 9, 10, 3.3, .18, 1.2, 2.2, wood, 4.1), endGable(0, -9.25, 10, 7.4, 6.42, wood), endGable(0, 9, 10, 7.4, 6.42, wood));
  const roofY = (x: number) => 14 - Math.abs(x) / 5 * 6.44;
  p.push(slopePanel("侧墙上连续支承的右侧高陡厚茅屋坡", [[0, 14, -10], [5.6, roofY(5.6), -10], [5.6, roofY(5.6), 10], [0, 14, 10]], .18, thatch));
  for (const [a, b] of [[-5.6, -2.8], [-1.3, 0]]) p.push(slopePanel("起翘通风扇两边连续保留的高陡茅坡", [[a!, roofY(a!), -10], [b!, roofY(b!), -10], [b!, roofY(b!), 10], [a!, roofY(a!), 10]], .18, thatch));
  for (const [a, b] of [[-10, -7], [-5, 10]]) p.push(slopePanel("实际避开通风扇洞口的前后屋面片", [[-2.8, roofY(-2.8), a!], [-1.3, roofY(-1.3), a!], [-1.3, roofY(-1.3), b!], [-2.8, roofY(-2.8), b!]], .18, thatch));
  p.push(slopePanel("与高边木铰相接并在低边抬起的真实通风屋扇", [[-2.8, roofY(-2.8) + 1, -7], [-1.3, roofY(-1.3), -7], [-1.3, roofY(-1.3), -5], [-2.8, roofY(-2.8) + 1, -5]], .12, thatch));
  for (const z of [-7.7, -2.6, 2.6, 7.7]) for (const side of [-1, 1]) framing.push(meshBeam("沿承屋侧壁跨至高长脊的整根木椽", [side * 4.9, 7.25, z], [0, 13.8, z], .22, wood));
  framing.push(meshBeam("跨过四榀高木椽的完整顶脊木", [0, 13.8, -9.5], [0, 13.8, 9.5], .24, wood));
  for (const z of [-3.2, 3.2]) {
    p.push(cylinder("前公厅中实际立在楼梁上支承横枋的大木柱", 0, 7.6, z, .38, 7, wood));
    framing.push(meshBeam("高厅柱顶端实际抵接两侧木椽的横枋", [-1.9, 11.1, z], [1.9, 11.1, z], .25, wood));
  }
  for (let i = 0; i < framing.length; i += 16) p.push(combineMeshes("长宅楼梁栅窗与高屋盖全部实际木承架", wood, framing.slice(i, i + 16)));
  p.push(...doorWall("公厅通入后部私室的完整低木隔壁", 0, 2.5, 9.6, 2.4, .12, 1, 2, wood, 4.1), box("后部左右睡区之间真正落在楼板上的木隔壁", 0, 5.1, 5.6, .12, 2, 6.1, wood), box("前公厅贴斜窗内缘的完整高木坐台", 0, 4.35, -7.6, 8.6, .5, 1.2, wood), box("后门外实际接上登梯的短木平台", 0, 4.0, 9.3, 1.5, .2, .7, wood), ...ladder("地面向后门上行的完整可通登梯", 0, .32, 12.4, 4.15, 9.2, 11));
  return p;
}

function northNiasOvalHouse(): ModelPart[] {
  const p: ModelPart[] = [hardFloor("椭圆高宅完整厚木楼面", wood, Array.from({ length: 32 }, (_, i) => [Math.cos(i * Math.PI / 16) * 5.2, Math.sin(i * Math.PI / 16) * 7.5] as [number, number]), .24, [0, 2.76, 0])], logs: ModelPart[] = [], feet: ModelPart[] = [], walls: ModelPart[] = [], roof: ModelPart[] = [], framing: ModelPart[] = [];
  for (let i = 0; i < 8; i++) {
    const a = i * Math.PI / 4, x = Math.cos(a) * 4.3, z = Math.sin(a) * 6;
    feet.push(solidBox("椭圆宅直柱脚下实际落地的独立石板", x, .15, z, .95, .3, .95, stone)); logs.push(tapered("石脚接到椭圆楼底梁的粗木直柱", wood, [[x, .3, z], [x, 2.65, z]], [.25, .21]));
  }
  for (const z of [-3.2, 3.2]) for (const side of [-1, 1]) {
    logs.push(tapered("在楼底中段相互交叉的横向粗木斜柱", wood, [[side * 3.7, .3, z], [-side * 3.7, 2.67, z]], [.21, .18]));
    feet.push(solidBox("横交撑脚下与直柱分开的实际低石垫", side * 3.7, .15, z, .9, .3, .9, stone), solidBox("交叉斜柱之间实际坐落的粗石压舱块", side * .6, 1.92, z, .75, .38, .75, stone));
  }
  for (const x of [-2.1, 2.1]) for (const end of [-1, 1]) logs.push(tapered("沿长轴交叉以抵住侧向摆动的纵向粗斜柱", wood, [[x, .3, end * 5], [x, 2.67, -end * 5]], [.2, .18]));
  for (let i = 0; i < feet.length; i += 16) p.push(combineMeshes("椭圆宅下全部独立石脚与交撑间压舱石", stone, feet.slice(i, i + 16)));
  for (let i = 0; i < logs.length; i += 16) p.push(combineMeshes("椭圆高宅实际分开的直柱与交叉粗斜柱系统", wood, logs.slice(i, i + 16)));
  const bands = [[3, 4.2], [4.2, 5.3], [5.3, 6]];
  for (let i = 0; i < 24; i++) {
    const a = i * Math.PI / 12, b = (i + 1) * Math.PI / 12;
    for (let band = 0; band < bands.length; band++) {
      if ((band < 2 && (i === 17 || i === 18)) || (band === 1 && [15, 16, 19, 20].includes(i))) continue;
      const [low, high] = bands[band]!, value = radialShellBand("沿椭圆外倾并真实留门窗的薄木围壁", wood, [1 + (low! - 3) * .02, low!], [1 + (high! - 3) * .02, high!], a, b, .034); value.scale.x = 5; value.scale.z = 7.2; walls.push(value);
    }
    const at = (t: number): Triple => [Math.cos(t) * 5.3, 6.05, Math.sin(t) * 7.632], overhang = (t: number): Triple => [Math.cos(t) * 5.8, 5.45, Math.sin(t) * 8.2], high = (t: number): Triple => [0, 12.5, Math.max(-2.7, Math.min(2.7, Math.sin(t) * 7.5))], u = at(a), v = at(b), h = high(a), j = high(b);
    roof.push(slopePanel("随椭圆外缘收向长脊的真实三角厚茅髋坡", [u, v, h], .16, thatch));
    if (Math.abs(h[2] - j[2]) > .001) roof.push(slopePanel("沿长髋屋脊连续封合的真实三角厚茅坡", [v, j, h], .16, thatch));
    roof.push(slopePanel("椭圆壁上缘连续向外下挑的厚茅檐片", [overhang(a), overhang(b), u], .16, thatch), slopePanel("与高髋主盖相接的完整三角低挑檐片", [overhang(b), v, u], .16, thatch));
    framing.push(meshBeam("托住外倾围壁上缘的连续椭圆檐承枋", [Math.cos(a) * 5.25, 5.88, Math.sin(a) * 7.55], [Math.cos(b) * 5.25, 5.88, Math.sin(b) * 7.55], .16, wood));
  }
  for (let i = 0; i < walls.length; i += 16) p.push(combineMeshes("椭圆板壁中的真入口与两组贯通长窗", wood, walls.slice(i, i + 16)));
  for (let i = 0; i < roof.length; i += 16) p.push(combineMeshes("四内柱所承长脊向椭圆檐缘完整收落的厚茅盖", thatch, roof.slice(i, i + 16)));
  const windowAt = (angle: number, y: number): Triple => [Math.cos(angle) * (5 * (1 + (y - 3) * .02) - .03), y, Math.sin(angle) * (7.2 * (1 + (y - 3) * .02) - .03)];
  for (const angle of [225, 240, 255, 285, 300, 315]) { const a = angle * Math.PI / 180; framing.push(meshBeam("椭圆斜窗内真实上下相接的木窗栅", windowAt(a, 4.2), windowAt(a, 5.3), .065, wood)); }
  for (const angle of [225, 240, 285, 300]) for (const y of [4.2, 5.3]) framing.push(meshBeam("两组椭圆斜窗实际连到窗栅的上下木框", windowAt(angle * Math.PI / 180, y), windowAt((angle + 15) * Math.PI / 180, y), .065, wood));
  for (const angle of [255, 285]) framing.push(meshBeam("前登梯入口两侧从楼面贯通到门头的实际门梃", windowAt(angle * Math.PI / 180, 3), windowAt(angle * Math.PI / 180, 5.3), .1, wood));
  for (const x of [-1.8, 1.8]) {
    for (const z of [-3.2, 3.2]) p.push(box("四根贯通主柱下实际承压的独立低石脚", x, .15, z, .8, .3, .8, stone), cylinder("从石脚越过生活层而直接承担高屋盖的四根内主柱", x, 4.8, z, .34, 9, wood));
    framing.push(meshBeam("四主柱同侧柱顶之间完整纵向高承枋", [x, 9.35, -3.2], [x, 9.35, 3.2], .26, wood));
    framing.push(meshBeam("贯通主柱楼面处接住椭圆木楼板的真实纵梁", [x, 2.67, -6.7], [x, 2.67, 6.7], .24, wood));
  }
  for (const z of [-6, -4.2, 0, 4.2, 6]) { const half = Math.abs(z) > 5 ? 2.9 : Math.abs(z) > 1 ? 4.25 : 4.7; framing.push(meshBeam("跨过低直柱并接到主柱纵梁的完整楼底横梁", [-half, 2.67, z], [half, 2.67, z], .25, wood)); }
  for (const end of [-1, 1]) for (const side of [-1, 1]) framing.push(meshBeam("内柱高承枋接到长屋脊的上木椽", [side * 1.8, 9.35, end * 3.2], [0, 12.32, end * 2.7], .2, wood), meshBeam("内柱高承枋接到低檐的完整下木椽", [side * 1.8, 9.35, end * 3.2], [side * 4.8, 5.9, end * 3.2], .2, wood));
  for (const z of [-3.2, 3.2]) framing.push(meshBeam("四内柱之间横向稳住高承枋的真系梁", [-1.8, 9.35, z], [1.8, 9.35, z], .24, wood));
  framing.push(meshBeam("位于椭圆高宅中部的完整短长脊木", [0, 12.32, -2.7], [0, 12.32, 2.7], .23, wood));
  for (let i = 0; i < framing.length; i += 16) p.push(combineMeshes("椭圆宅高低承枋与内柱屋椽的完整木承架", wood, framing.slice(i, i + 16)));
  p.push(...doorWall("公厅进入后部睡区的实际低隔门", 0, 2.7, 7.6, 2, .12, 1, 1.9, wood, 3), box("后睡区实际立在楼面上的分隔木壁", 0, 3.85, 4.7, .12, 1.7, 3.8, wood), box("前公厅贴窗内缘但避开正门的低长坐台", -2, 3.24, -4.9, 2.8, .48, 1, wood), ...ladder("椭圆宅前口从石坪上行的完整登梯", 0, .3, -10.3, 3.06, -7.2, 9));
  return p;
}

function sumbaTowerHouse(): ModelPart[] {
  const p: ModelPart[] = [box("中层围火塘居室与外通道共用的厚竹木楼板", 0, 2.5, 0, 11.4, .2, 11.4, bamboo)], posts: ModelPart[] = [], feet: ModelPart[] = [], framing: ModelPart[] = [];
  for (const x of [-4.8, -1.8, 1.8, 4.8]) for (const z of [-4.8, -1.8, 1.8, 4.8]) {
    const main = Math.abs(x) < 2 && Math.abs(z) < 2, height = main ? 6.35 : 2.4;
    feet.push(solidBox("每根落地木脚下分开的实际低石垫", x, .13, z, .8, .26, .8, stone)); posts.push(tapered(main ? "围火塘并贯通托起塔顶的四根完整主柱" : "留出下部畜空的真实木楼脚", wood, [[x, .26, z], [x, height, z]], main ? [.28, .24] : [.18, .16]));
  }
  for (const end of [-1, 1]) for (const x of [-end * 3 - .9, -end * 3 + .9]) feet.push(solidBox("外登梯平台独立承脚下真实落地的低石脚", x, .13, end * 6.5, .6, .26, .6, stone));
  p.push(combineMeshes("全部架空木脚和外平台支脚下实际分开的落地石脚", stone, feet), combineMeshes("四根通高主柱与周围独立楼脚完整保留", wood, posts));
  for (const side of [-1, 1]) {
    framing.push(meshBeam("四主柱在塔脚处相接的完整纵向承枋", [side * 1.8, 6.35, -2.05], [side * 1.8, 6.35, 2.05], .28, wood), meshBeam("四主柱在塔脚处相接的完整横向承枋", [-2.05, 6.35, side * 1.8], [2.05, 6.35, side * 1.8], .28, wood));
    p.push(box("架空居室两侧真实无窗的竹木外壁", side * 5.5, 3.6, 0, .12, 2, 11, bamboo));
  }
  for (const end of [-1, 1]) {
    const doorX = -end * 3, left = doorX - .6, right = doorX + .6;
    p.push(box("前后独立入口左边连续到角部的竹木围壁", (-5.5 + left) / 2, 3.6, end * 5.5, left + 5.5, 2, .12, bamboo), box("前后独立入口右边连续到角部的竹木围壁", (right + 5.5) / 2, 3.6, end * 5.5, 5.5 - right, 2, .12, bamboo), box("两处入口上方真实连到低檐的短竹木门楣", doorX, 4.5, end * 5.5, 1.2, .2, .12, bamboo), box("独立入口实际接到登梯的外木平台", doorX, 2.5, end * 6.05, 2.1, .2, 1.1, wood), ...ladder("分别通到前后独立入口的完整木登梯", doorX, .26, end * 9.6, 2.66, end * 6.5, 8));
    for (const x of [doorX - .9, doorX + .9]) framing.push(meshBeam("外平台前缘真正落到石坪的独立承脚", [x, .26, end * 6.5], [x, 2.4, end * 6.5], .16, wood));
  }
  const bottom: Triple[] = [[-7, 4, -7], [7, 4, -7], [7, 4, 7], [-7, 4, 7]], neck: Triple[] = [[-2, 6.5, -2], [2, 6.5, -2], [2, 6.5, 2], [-2, 6.5, 2]], top: Triple[] = [[-.3, 18, -.7], [.3, 18, -.7], [.3, 18, .7], [-.3, 18, .7]];
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    p.push(slopePanel("宽大低裙檐连续升入中央塔脚的完整厚茅坡", [bottom[i]!, bottom[j]!, neck[j]!, neck[i]!], .18, thatch), slopePanel("由四主柱塔脚连续收向尖顶的高陡塔形厚茅坡", [neck[i]!, neck[j]!, top[j]!, top[i]!], .18, thatch));
    framing.push(meshBeam("从四主柱头直接收向尖塔顶部的主木椽", [neck[i]![0], 6.35, neck[i]![2]], [top[i]![0], 17.82, top[i]![2]], .18, wood), meshBeam("由塔脚主梁伸向低檐的整根裙坡承椽", [neck[i]![0], 6.35, neck[i]![2]], [bottom[i]![0] * .9, 4.28, bottom[i]![2] * .9], .18, wood));
  }
  p.push(box("高陡塔坡最上方实际封合的小茅脊帽", 0, 17.96, 0, .64, .16, 1.45, thatch), hardFloor("火塘上方空阁楼面真实避开上阁梯口", wood, [[-2, -2], [2, -2], [2, 2], [-2, 2]], .15, [0, 6.15, 0], [[[.7, -.8], [1.5, -.8], [1.5, .2], [.7, .2]]]), ...ladder("从中层火塘侧边升到真实阁洞的木梯", 1.1, 2.6, -1.9, 6.35, -.3, 10), box("中央火塘下真实与木楼板隔开的不燃石底", 0, 2.72, 0, 1.6, .24, 1.6, stone));
  for (const side of [-1, 1]) framing.push(meshBeam("沿外围木楼脚贯通的完整厚楼承梁", [side * 4.8, 2.38, -5.4], [side * 4.8, 2.38, 5.4], .25, wood));
  for (const z of [-4.8, -1.8, 1.8, 4.8]) framing.push(meshBeam("各排真实木楼脚顶端的完整横承梁", [-5.4, 2.37, z], [5.4, 2.37, z], .24, wood));
  for (const x of [-5.5, 5.5]) for (const z of [-5.5, 5.5]) framing.push(meshBeam("低裙坡檐下从居室楼面起立的真实角柱", [x, 2.6, z], [x, 4.55, z], .16, wood));
  for (let i = 0; i < framing.length; i += 16) p.push(combineMeshes("高塔四主柱系统低檐角柱与架空楼梁完整相接", wood, framing.slice(i, i + 16)));
  p.push(box("火塘后方分隔睡区而保留两边通行的低竹屏", -1.5, 3.2, 3.5, 5, 1.2, .08, bamboo), box("竹屏后完整接到外壁内侧的睡台", -2, 2.82, 4.6, 3.8, .44, 1.2, wood), box("前部公厅真实接在居室木楼面上的长坐台", 0, 2.82, -4.6, 3, .44, 1, wood));
  return p;
}

function ghorfaCell(width: number, length: number, spring: number, base: number, doorWidth: number, doorHeight: number, through = false, supportUpper = false): ModelPart[] {
  const outer = width / 2, inner = outer - .25, color = "#b49b78", outline: [number, number][] = [[-outer, 0], [-outer, spring], ...Array.from({ length: 12 }, (_, i) => { const a = Math.PI - (i + 1) * Math.PI / 12; return [Math.cos(a) * outer, spring + Math.sin(a) * outer] as [number, number]; }), [outer, 0]], door: [number, number][] = [...outline, [doorWidth / 2, 0], [doorWidth / 2, doorHeight], [-doorWidth / 2, doorHeight], [-doorWidth / 2, 0]], pieces: ModelPart[] = [solidBox("独立储仓内完整厚石地板", 0, base + .09, 0, width, .18, length, color), ...[-1, 1].map(side => solidBox("实际接住筒券拱脚的两侧厚仓壁", side * (outer - .125), base + (.18 + spring) / 2, 0, .25, spring - .18, length, color))];
  for (const end of [-1, 1]) {
    const panel = hardFloor(end < 0 || through ? "券仓真实留出低门的内院端墙" : "券仓朝外封闭的完整圆拱端墙", color, end < 0 || through ? door : outline, .25, [0, base, end * length / 2 + .125]); panel.rotation.x = -90; pieces.push(panel);
  }
  const p = [combineMeshes("独立筒券仓的完整厚地板真门端墙与承拱侧壁", color, pieces), barrelRoof("完整保留储粮室上方拱形净空的厚筒券", inner, .25, length, [0, base + spring, 0], color)];
  if (supportUpper) {
    const fill: ModelPart[] = [];
    for (const side of [-1, 1]) {
      const profile: [number, number][] = [[side * outer, spring], [side * outer, spring + outer], [0, spring + outer], ...Array.from({ length: 5 }, (_, i) => { const a = Math.PI / 2 - side * (i + 1) * Math.PI / 12; return [Math.cos(a) * outer, spring + Math.sin(a) * outer] as [number, number]; })], value = hardFloor("上层仓地板下真实填实到平台的拱肩石体", color, profile, length, [0, base, length / 2]); value.rotation.x = -90; fill.push(value);
    }
    p.push(combineMeshes("下层仓拱肩两侧实际承接上仓平台的实石填体", color, fill));
  }
  return p;
}

function tunisianGhorfaKsar(): ModelPart[] {
  const color = "#b49b78", p: ModelPart[] = [hardFloor("券仓围院与高券门房共同落地的完整石基坪", stone, [[-4.6, -12.9], [4.6, -12.9], [4.6, -6.85], [9.15, -6.85], [9.15, 6.85], [4.6, 6.85], [4.6, 12.9], [-4.6, 12.9], [-4.6, 6.85], [-9.15, 6.85], [-9.15, -6.85], [-4.6, -6.85]], .2, [0, 0, 0])];
  for (let level = 0; level < 2; level++) {
    const base = .2 + level * 3.5;
    for (const x of [-2.25, 2.25]) for (const value of ghorfaCell(4.5, 6, 1.25, base, 1.1, 1.8, false, level === 0)) { value.position.x += x; value.position.z += 9.75; p.push(value); }
    for (const side of [-1, 1]) for (const z of [-4.5, 0, 4.5]) for (const value of ghorfaCell(4.5, 4.5, 1.25, base, 1.1, 1.8, false, level === 0)) { value.position.x += side * 6.75; value.position.z += z; value.rotation.y = side * 90; p.push(value); }
  }
  for (const value of ghorfaCell(9, 6, 2.4, .2, 2.4, 2.4, true)) { value.position.z -= 9.75; p.push(value); }
  p.push(box("上层后排仓门外真实连续的石平台", 0, 3.8, 6.3, 9, .16, .9, color));
  for (const side of [-1, 1]) {
    p.push(box("上层侧仓外真实接续全部仓门的长石廊", side * 4.05, 3.8, 0, .9, .16, 13.5, color), box("登仓石阶顶端实际接到侧廊的完整平台", side * 3.6, 3.8, .9, 1.8, .16, .6, color));
    const steps: ModelPart[] = [], corbels: ModelPart[] = [];
    for (let i = 0; i < 16; i++) { const height = (i + 1) * .23; steps.push(solidBox("由内院地面逐级上行的实体登仓石阶", side * 3.2, .2 + height / 2, -5.8 + i * .42, 1, height, .42, color)); }
    for (const z of [-5.8, -2.9, 0, 2.9, 5.8]) corbels.push(solidBox("从厚仓壁中挑出而实际承接高廊的石牛腿", side * 4.2, 3.6, z, 1.15, .24, .28, color));
    p.push(combineMeshes("从内院到上层仓廊的全部实石踏步", color, steps), combineMeshes("高廊下全部嵌入厚仓壁的实体石牛腿", color, corbels));
  }
  return p;
}
