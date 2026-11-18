import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { barrelRoof } from "./spatialShells";
import { doorWall, gableCover } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";

const wood = "#8d7152", stone = "#a7a494", plaster = "#c8bea8", slate = "#727b72", iron = "#627374";

// https://heritagerecords.nationaltrust.org.uk/HBSMR/MonRecord.aspx?uid=MNA107983
// https://production.english-heritage.org.uk/visit/places/black-middens-bastle-house/history/
// https://production.english-heritage.org.uk/visit/places/saxtead-green-post-mill/history/
// https://www.molens.nl/ontdek-molens/alle-molens/openluchtmuseum-spinnenwielmijn-genoegen-te-arnhem
export const vernacularWorldBatchFiveDesigns = [
  design("横屏通道敞厅双端翼宅", "高敞中央厅由低木屏隔出横向穿堂，两端横翼容纳上下居室，侧门经穿堂进入火厅，横翼上层由独立外梯到达", openHallHouse, "建筑", "欧式"),
  design("底券畜室上层防护农宅", "厚石下层畜室用连续石筒券托住上层居住地板，狭窄畜门和上层小窗分开布置，外石阶独立接入高位住室门", vaultedBastleHouse, "建筑", "欧式"),
  design("单柱承整木身磨粮风车", "斜撑十字底架承住一根粗中柱，完整木机身在柱顶承台上承重，前风翼轴接上部制动轮和磨盘传动轴，长外梯接入木身门", postMill, "建筑", "欧式"),
  design("环轨回转承身风力锯木坊", "大木锯坊坐在整圈滚轮轨道上，前风翼轴接曲柄与立式往复锯框，长送木滑台穿过敞开锯作区，环周木身共同承重", paltrockSawmill, "建筑", "欧式"),
  design("贯通船轨岸坡大船屋", "长坡船轨穿过高大前门进入有屋盖的船台室，左右独立作业步道跨过轨道低槽，后绞盘和空载船托架在同一条牵引轴线上", slipwayBoathouse, "建筑", "欧式"),
];

function rotateRoof(width: number, depth: number, eave: number, rise: number, x: number, z: number): ModelPart[] {
  return gableCover("横翼顺长向的独立双坡屋盖", width, depth, eave, rise, slate).map(value => { value.rotation.y = 90; value.position = { x, y: 0, z }; return value; });
}

function openHallHouse(): ModelPart[] {
  const p: ModelPart[] = [box("中央敞厅与横屏通道共同石地坪", 0, .1, 0, 7.8, .2, 10.2, stone), ...gableCover("中央敞厅上方无遮楼板的高屋盖", 8.2, 10.2, 3.03, 2.2, slate)];
  for (const side of [-1, 1]) p.push(box("横屏通道侧门之前的短厚墙", side * 3.6, 1.65, -4.675, .25, 2.9, .65, plaster), box("侧门之后直通火厅的长厚墙", side * 3.6, 1.65, .875, .25, 2.9, 8.25, plaster), box("贯穿横屏通道侧门上方的短过梁", side * 3.6, 2.88, -3.8, .3, .44, 1.1, wood));
  for (const [a, b] of [[-3.6, -2.5], [-1.3, 1.3], [2.5, 3.6]]) p.push(box("两开通口之间的独立低木屏", (a! + b!) / 2, 1.15, -2.7, b! - a!, 1.9, .12, wood));
  p.push(box("把三段屏木连成一体的完整屏首横梁", 0, 2.18, -2.7, 7.3, .18, .18, wood), box("高敞大厅中央不燃长火床", 0, .28, 1, 1.25, .16, 1.8, stone));
  for (const z of [-1.8, 2.5]) p.push(box("高厅两侧墙头之间的横向系梁", 0, 3.03, z, 7.45, .22, .22, wood), ...[-1, 1].map(side => beam("敞厅从墙顶收至屋脊的真实斜椽", wood, [side * 3.6, 3.08, z], [0, 5.08, z], .18)));
  for (const end of [-1, 1]) {
    const z = end * 8;
    p.push(box("两端横翼的完整下层木地台", 0, .29, z, 13.4, .18, 6, wood), box("横翼上下居室之间的完整木楼板", 0, 3, z, 13.4, .2, 6, wood), ...rotateRoof(6.4, 13.9, 5.49, 1.9, 0, z), ...doorWall("横翼下层与中央大厅相通的门壁", 0, end * 5, 13.4, 2.7, .2, 1, 2.1, plaster, .38), box("横翼内侧的上层完整墙面", 0, 4.35, end * 5, 13.4, 2.5, .18, plaster));
    const outline: [number, number][][] = [[[-5.75, 2.9], [-4.65, 2.9], [-4.65, 4.9], [-5.75, 4.9]], [[-.8, 1.1], [.8, 1.1], [.8, 2.1], [-.8, 2.1]], [[2.4, 3.4], [3.5, 3.4], [3.5, 4.7], [2.4, 4.7]]];
    p.push(hardWall("横翼外立面保留高位住室门与窗孔", 13.4, 5.4, .22, [0, .2, end * 11 + .11], outline, plaster));
    for (const side of [-1, 1]) { p.push(box("横翼两端从地面起的完整封墙", side * 6.6, 2.9, z, .2, 5.4, 6, plaster)); const gable = endGable(side * 6.6, z, 6, 5.6, 1.65, plaster); gable.rotation.y = 90; p.push(gable); }
    p.push(box("外梯顶端与高位住室门相连的木平台", -5.2, 3.025, end * 11.5, 1.3, .15, 1.2, wood), ...ladder("横翼上层独立外木梯", -5.2, .2, end * 16.1, 3.9, end * 11, 9));
  }
  return p;
}

function vaultedBastleHouse(): ModelPart[] {
  const p: ModelPart[] = [box("防护农宅完整落地石地坪", 0, .1, 0, 7.8, .2, 12.6, stone), ...[-1, 1].map(side => box("畜室两侧承住石筒券的厚墙", side * 3.3, 2.1, 0, 1, 3.8, 12, stone)), box("下层临外阶一端的完整厚石壁", 0, 2.1, -6, 7.6, 3.8, 1, stone), ...doorWall("下层与上居室分开的狭窄畜门", 0, 6, 7.6, 3.8, 1, 1.25, 2, stone, .2), barrelRoof("真正跨过整间畜室并承住上地板的石筒券", 2.8, .3, 11, [0, .9, 0], stone), box("筒券之上完整上居室木地板", 0, 4.1, 0, 7.6, .2, 12, wood), ...doorWall("外石阶接入的上层高位住室门", 0, -6, 7.6, 2.7, .8, 1.05, 2.1, stone, 4.2), hardWall("上居室后端的两个窄采光孔", 7.6, 2.7, .8, [0, 4.2, 6.4], [[[-2.1, .9], [-1.5, .9], [-1.5, 1.9], [-2.1, 1.9]], [[1.5, .9], [2.1, .9], [2.1, 1.9], [1.5, 1.9]]], stone), ...gableCover("完整防护农宅的陡石片屋盖", 8.6, 13, 6.64, 1.8, slate)];
  for (const side of [-1, 1]) p.push(box("上居室左右厚石外墙", side * 3.3, 5.55, 0, 1, 2.7, 12, stone));
  for (const end of [-1, 1]) p.push(endGable(0, end * 6, 7.6, 6.9, 1.4, stone));
  const treads: ModelPart[] = [];
  for (let i = 0; i < 16; i++) { const h = (i + 1) * .25; treads.push(solidBox("独立且有真实步高的外石阶", 0, .2 + h / 2, -12.5 + i * .35, 1.35, h, .35, stone)); }
  p.push(combineMeshes("从地面升至高门的全部十六级石梯", stone, treads), box("石阶高端与上层房门的实心石平台", 0, 2.2, -6.7, 1.7, 4, 1.1, stone), box("上居室靠厚墙的不燃火床", -2, 4.28, 3.5, 1.4, .16, 1.4, stone));
  return p;
}

export function meshBeam(name: string, start: Triple, end: Triple, width: number, color: string): ModelPart {
  const value = beam(name, color, start, end, width), geometry = solidBox(name, 0, 0, 0, 1, 1, 1, color); return { ...value, shape: "mesh", vertices: geometry.vertices!, indices: geometry.indices! };
}

function millSails(center: Triple, radius: number): ModelPart[] {
  const p: ModelPart[] = [cylinder("四翼共同固接的风轴轮毂", center[0], center[1], center[2], .5, .65, iron, [90, 0, 0])];
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2, point = (r: number, v: number): Triple => [center[0] + Math.cos(a) * r - Math.sin(a) * v, center[1] + Math.sin(a) * r + Math.cos(a) * v, center[2]];
    p.push(beam("从轮毂延伸至翼尖的完整粗风翼主杆", wood, point(0, 0), point(radius, 0), .14));
    const bars: ModelPart[] = [meshBeam("透空风翼内侧长缘木", point(.9, .1), point(radius - .15, .1), .06, wood), meshBeam("透空风翼外侧长缘木", point(.9, 1.05), point(radius - .15, 1.05), .06, wood)];
    for (let j = 0; j < 11; j++) { const r = .9 + (radius - 1.05) * j / 10; bars.push(meshBeam("真实贯通风翼格间的横档", point(r, .08), point(r, 1.08), .055, wood)); }
    p.push(combineMeshes("全部保留透空间隔的风翼木格栅", wood, bars));
  }
  return p;
}

function postMill(): ModelPart[] {
  const p: ModelPart[] = [box("中柱风车下完整防潮石垫基", 0, .1, 0, 6.3, .2, 6.3, stone), box("底架下方横向落地厚木", 0, .38, 0, 5.5, .36, .45, wood), box("底架下方纵向落地厚木", 0, .56, 0, .45, .36, 5.5, wood), cylinder("实际承住整个木机身的通高中柱", 0, 3.23, 0, .8, 5.3, wood), cylinder("机身绕中柱承托的顶端回转盘座", 0, 5.75, 0, 1.9, .32, iron), box("回转承台上的木机身下地板", 0, 5.99, 0, 4.6, .18, 5.3, wood)];
  for (const side of [-1, 1]) for (const axis of [0, 1]) p.push(beam("从十字底架斜支到通高中柱的粗撑", wood, [axis ? 0 : side * 2.45, .6, axis ? side * 2.45 : 0], [0, 4.8, 0], .3));
  p.push(hardWall("木风车前围板真正避开风轴穿孔", 4.4, 4.9, .18, [0, 6.08, -2.41], [[[-.19, 3.71], [.19, 3.71], [.19, 4.13], [-.19, 4.13]]], wood), ...doorWall("长外梯接入的木机身后门", 0, 2.5, 4.4, 4.9, .18, 1.1, 2.1, wood, 6.08));
  for (const side of [-1, 1]) p.push(box("木机身左右高围板", side * 2.15, 8.53, 0, .18, 4.9, 5.1, wood));
  p.push(polygon("磨粮机身上层避开主传动轴与内梯的木层板", wood, [[-2.1, -2.5], [2.1, -2.5], [2.1, 2.5], [-2.1, 2.5]], .16, [0, 8.4, 0], [[[-.22, -1.42], [.22, -1.42], [.22, -.98], [-.22, -.98]], [[.79, .5], [1.61, .5], [1.61, 1.4], [.79, 1.4]]]), ...gableCover("高木机身完整双坡木盖", 5.2, 5.9, 10.96, 1.45, slate), ...[-1, 1].map(end => endGable(0, end * 2.5, 4.4, 10.98, 1.2, wood)), ...millSails([0, 10, -3.45], 6.8), cylinder("从风翼轮毂实际伸入机身的长水平风轴", 0, 10, -2.1, .22, 3.1, iron, [90, 0, 0]));
  const brake = ring("风轴内侧的大制动轮圈", wood, 1.2, .16, 0, .2); brake.position = { x: 0, y: 10, z: -1.2 }; brake.rotation.x = 90;
  const crown = ring("接在制动轮下缘与竖轴间的水平传动轮", wood, .5, .1, 8.93, .18); crown.position.z = -1.2;
  p.push(brake, crown, cylinder("从制动轮落向磨盘的竖传动轴", 0, 8.19, -1.2, .14, 3.78, iron), cylinder("木机身底层完整下磨石", 0, 6.28, -1.2, 1.8, .4, stone), cylinder("磨盘上部独立回转磨石", 0, 6.61, -1.2, 1.6, .26, stone), box("后门外实际接回机身的短木平台", 0, 6, 2.8, 1.2, .16, .6, wood), ...ladder("从地面伸到回转木身后门的长木梯", 0, .2, 8, 6.8, 2.5, 17), ...ladder("机身内通过真实楼板洞口的维护木梯", 1.2, 6.08, 1.6, 9.1, .7, 7));
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; p.push(beam("制动轮圈连到风轴的径向木辐", wood, [0, 10, -1.2], [Math.cos(a) * 1.12, 10 + Math.sin(a) * 1.12, -1.2], .09)); }
  return p;
}

function paltrockSawmill(): ModelPart[] {
  const p: ModelPart[] = [ring("整个锯木坊下方连续环形石轨基", stone, 3.5, .45, .4, .3), box("环轮之上旋转木身的完整长下承架", 0, 1.02, -1.2, 8.8, .25, 12, wood)];
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, start: Triple = [Math.cos(a) * 3.11, .72, Math.sin(a) * 3.11], end: Triple = [Math.cos(a) * 3.29, .72, Math.sin(a) * 3.29]; p.push({ ...beam("沿圆轨承重的径向轮轴滚轮", iron, start, end, .35), shape: "cylinder" }); }
  for (const side of [-1, 1]) {
    for (const z of [-3.5, 3.5]) p.push(box("敞开锯作木身四角通高承柱", side * 3, 4.045, z, .25, 5.8, .25, wood));
    p.push(box("两侧檐口承重纵枋", side * 3, 6.88, 0, .23, .23, 7.3, wood), box("锯坊后半部防风围板", side * 3.08, 4.6, 1.8, .12, 4.4, 3.5, wood), beam("机身侧面真实交接的抗扭斜撑", wood, [side * 3, 1.2, 3.4], [side * 3, 6.8, -.8], .16), box("贯穿锯作区的送木滑台导轨", side * 1.05, 1.45, -1.3, .12, .2, 11.4, iron));
  }
  p.push(...gableCover("大敞口锯木机身的完整木屋盖", 9, 9.2, 6.58, 1.6, slate), box("锯木坊后部完整防风木壁", 0, 4.05, 3.55, 6.2, 5.8, .15, wood), endGable(0, 3.55, 6.2, 6.95, 1.1, wood), ...millSails([0, 7.7, -5.05], 6.5), cylinder("从前风翼伸入机身的长风轴", 0, 7.7, -2.9, .22, 4.5, iron, [90, 0, 0]));
  const fly = ring("驱动锯架曲柄的大轮缘", wood, 1.12, .14, 0, .18); fly.position = { x: 0, y: 7.7, z: -1.2 }; fly.rotation.x = 90; p.push(fly, cylinder("风轮向下接曲柄的传动轴", 0, 5.5, -.7, .14, 4.4, iron), cylinder("通过角向传动壳的水平曲柄轴", 0, 3.4, -.7, .13, 1.8, iron, [0, 0, 90]), cylinder("水平轴端带偏心销的曲柄圆盘", .9, 3.4, -.7, .7, .12, iron, [0, 0, 90]), box("上下风轴与水平曲柄交会的角向传动壳", 0, 3.45, -.7, .45, .4, .45, iron));
  p.push(combineMeshes("大轮缘实际接回风轴的六根木辐", wood, Array.from({ length: 6 }, (_, i) => { const a = i * Math.PI / 3; return meshBeam("锯坊传动轮辐", [0, 7.7, -1.2], [Math.cos(a) * 1.05, 7.7 + Math.sin(a) * 1.05, -1.2], .08, wood); })), combineMeshes("送木导轨下接到旋转木身的全部短托", wood, [-1, 1].flatMap(side => [-6, -3, 0, 3].map(z => solidBox("导轨短承座", side * 1.05, 1.2475, z, .2, .205, .3, wood)))));
  for (const side of [-1, 1]) p.push(box("立式往复锯框外侧导向柱", side * 1.2, 3.1, -.8, .2, 3.2, .2, wood), box("活动锯框两边长木", side * .9, 3.1, -.8, .11, 2.7, .14, wood));
  for (const y of [1.75, 4.45]) p.push(box("往复锯框上下横木", 0, y, -.8, 1.9, .14, .18, wood));
  for (const x of [-.5, 0, .5]) p.push(box("上下横木之间真正留空的独立锯条", x, 3.1, -.8, .025, 2.55, .075, iron));
  p.push(box("两根导轨上完整送木滑台", 0, 1.65, -2.7, 2.1, .2, 5.5, wood), cylinder("纵向送入立式锯框的待锯原木", 0, 2.15, -2.7, .8, 6.7, wood, [90, 0, 0]), beam("由偏心曲柄销接到锯框上横木的连杆", iron, [.9, 3.62, -.7], [.9, 4.45, -.8], .09), ...ladder("环轮承身锯坊后方实际出入木梯", -2.1, .2, 5.5, 2.1, 3.6, 5));
  return p;
}

// https://portal.historicenvironment.scot/apex/f?p=1505%3A300%3A%3A%3A%3A%3AVIEWTYPE%2CVIEWREF%3Adesignation%2CLB46721
function slipwayBoathouse(): ModelPart[] {
  const p: ModelPart[] = [box("船屋左右与后部共同石基础", 0, .12, 0, 10, .24, 19, stone), ...gableCover("高门船屋的完整长木屋盖", 10.7, 19.6, 5.25, 2.4, slate), ...doorWall("与坡船轨同轴的高大前船门", 0, -9, 9.6, 5, .35, 5.1, 4.65, wood, .24), box("后部绞盘房完整木围壁", 0, 2.74, 9, 9.6, 5, .3, wood)];
  for (const side of [-1, 1]) p.push(box("长船屋两侧落地木围壁", side * 4.7, 2.74, 0, .25, 5, 18, wood));
  for (const end of [-1, 1]) p.push(endGable(0, end * 9, 9.6, 5.24, 2.18, wood));
  const angle = -Math.atan2(1.3, 28) * 180 / Math.PI;
  p.push(part("船轨坡面之下连续填实的岸坡石基", "extrude", stone, [0, 0, -19], [1, 1, 1], [0, -90, 0], { depth: 4.5, profile: [{ x: 0, y: 0 }, { x: 28, y: 0 }, { x: 28, y: 1.3 }, { x: 0, y: .001 }] }));
  for (const side of [-1, 1]) p.push(part("从屋外岸坡连续穿门进入船台的钢轨", "box", iron, [side * 1.8, .91, -5], [.12, .16, Math.hypot(28, 1.3)], [angle, 0, 0]));
  for (let i = 0; i < 11; i++) p.push(box("双船轨下按坡高实际托起的横枕", 0, .09 + i * .13, -19 + i * 2.8, 4.4, .18, .28, wood));
  const railAtCenter = .26 + 19 * 1.3 / 28;
  for (const side of [-1, 1]) p.push(part("随船轨纵坡升高的独立侧作业木道", "box", wood, [side * 3.55, railAtCenter + .3, 0], [1.9, .2, Math.hypot(17.8, 17.8 * 1.3 / 28)], [angle, 0, 0]));
  p.push(part("双轨上随纵坡安放的空载船托架底梁", "box", iron, [0, railAtCenter + .19, 0], [4.2, .22, Math.hypot(9, 9 * 1.3 / 28)], [angle, 0, 0]), ...[-1, 1].map(side => beam("空载托架向船腹收起的斜承木", wood, [side * 1.8, 1.44, 0], [side * .8, 2.14, 0], .17)), ...[-1, 1].map(side => box("后绞盘接到坡基的厚木支座", side * .85, 1.7, 7.4, .3, 1.1, .7, wood)), cylinder("船台后部真实卷缆滚筒", 0, 2.1, 7.4, .85, 1.6, iron, [0, 0, 90]), beam("沿轨道轴线连到空载船架的绞盘牵引缆", iron, [0, 2.1, 7.4], [0, 1.65, 4.5], .035));
  for (const side of [-1, 1]) for (const z of [-6, 0, 6]) { const underside = .26 + (z + 19) * 1.3 / 28 + .2; p.push(box("随作业道坡高实际接回石基础的短木柱", side * 3.55, (underside + .24) / 2, z, .18, underside - .24, .18, wood)); }
  return p;
}
