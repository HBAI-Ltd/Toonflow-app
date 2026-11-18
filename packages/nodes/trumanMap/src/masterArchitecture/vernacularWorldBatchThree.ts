import { part, beam, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { polygon } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { courseWall, endGable, ladder, sideWindow } from "./vernacularWorldBatchTwo";

const wood = "#8e7253", stone = "#a6a495", earth = "#a18e70", turf = "#7c896e", pale = "#c6bca5", dark = "#685c48";

// 独立建筑类型依据保护机构和露天博物馆说明，本地重建完整空间，不复制其具体测绘模型。
// https://whc.unesco.org/fr/listesindicatives/5589
// https://ballenberg.ch/de/711/
// https://www.historicenvironment.scot/visit/all/scotstarvit-tower/history-and-stories/
// https://npgallery.nps.gov/NRHP/GetAsset/NRHP/64500292_text
export const vernacularWorldBatchThreeDesigns = [
  design("通廊串联山墙覆草农舍", "独立覆草房体分置主通廊左右，低覆顶通廊连续连接起居、贮藏和作业室，外厚草皮墙围住内部木承架", passageTurfFarm, "建筑", "欧式"),
  design("四柱长厅人畜一体农舍", "两列高内柱跨越前部车道和两侧畜区，后部横火厅连到独立起居小室；低边墙与高贮草屋顶、后室矮阁形成完整一体农宅", hallHouseFarm, "建筑", "欧式"),
  design("石底畜层双廊木住宅", "完整落地石畜层承住两层木住宅，正面和侧面外廊连至层间梯，宽伸木片屋盖覆盖阁楼", chaletFarmhouse, "建筑", "欧式"),
  design("侧翼盘梯多层石居堡", "厚石墙主居块和窄盘梯翼形成L形平面，四层内室由翼中转梯逐层联通，保留小窗、层板与高山墙屋盖", towerHouseResidence, "建筑", "欧式"),
  design("双室蓄石烟熏桑拿屋", "入口换衣室经过低隔门进入蓄石热室，阶台坐席抬至热区，近门敞口蓄热石炉与高后壁排烟孔组成完整浴屋", smokeSauna, "建筑", "欧式"),
  design("多火塘桶拱树皮长屋", "整列直立边柱接弯肋桶拱，左右成对坐卧隔间共用中央长通道，三处火塘正上方各留排烟洞，两个端门贯通", barkLonghouse, "建筑", "异域"),
  design("环箍束草高冠穹屋", "大直径圆室外围长木杆弯收至高冠，三道内箍稳定杆圈，厚束草壳从近竖下壁转为高肩穹盖，单一低门和小顶口都贯通", caddoGrassHouse, "建筑", "异域"),
];

export function hardWall(name: string, width: number, height: number, thickness: number, position: Triple, holes: [number, number][][], color: string, yaw = 0): ModelPart {
  const value = polygon(name, color, [[-width / 2, 0], [width / 2, 0], [width / 2, height], [-width / 2, height]], thickness, position, holes);
  const vertices = value.indices!.map(index => ({ ...value.vertices![index]! })); value.vertices = vertices; value.indices = vertices.map((_, i) => i); value.rotation = { x: -90, y: 0, z: -yaw }; return value;
}

export function solidBox(name: string, x: number, y: number, z: number, width: number, height: number, depth: number, color: string): ModelPart {
  return slopePanel(name, [[x - width / 2, y + height / 2, z - depth / 2], [x + width / 2, y + height / 2, z - depth / 2], [x + width / 2, y + height / 2, z + depth / 2], [x - width / 2, y + height / 2, z + depth / 2]], height, color);
}

function passageTurfFarm(): ModelPart[] {
  const p: ModelPart[] = [box("覆草农舍主廊与各室共同干土地坪", 0, .1, 0, 18.2, .2, 16.3, earth), ...gableCover("覆盖纵向公共窄廊的低覆草屋脊", 2.25, 16.3, 2.25, .8, turf)];
  for (const side of [-1, 1]) {
    for (const [a, b] of [[-8, -7.6], [-2.8, -.7], [4.1, 8]]) p.push(box("两室门框之间接续而不堵门的主廊侧墙", side * 1.02, 1.225, (a! + b!) / 2, .3, 2.05, b! - a!, earth));
    for (const z of [-5.2, 1.7]) {
      const centerX = side * 5;
      p.push(...gableCover("从通廊横向伸出的独立覆草室屋盖", 5.2, 8.6, 2.37, 1.65, turf, 0, z).map(value => { value.position.x = centerX; value.position.z = z; value.rotation.y = 90; for (const v of value.vertices!) v.z -= z; return value; }), box("室外厚草皮后长墙", centerX, 1.34, z + 2.4, 7.9, 2.28, .65, earth), box("室外厚草皮前长墙", centerX, 1.34, z - 2.4, 7.9, 2.28, .65, earth));
      const endWall = doorWall("农舍外山墙木立面门洞", 0, 0, 4.8, 2.28, .15, .85, 1.95, wood, .2).map(value => { value.position = { x: side * 8.85, y: value.position.y, z: z - value.position.x }; value.rotation.y = 90; return value; }); p.push(...endWall);
      const gable = endGable(side * 8.85, z, 4.8, 2.48, 1.37, wood); gable.rotation.y = 90; p.push(gable);
      p.push(...doorWall("木室与中央窄廊之间的真内门", 0, 0, 4.8, 2.05, .16, .8, 1.8, wood, .2).map(value => { value.position = { x: side * 1.05, y: value.position.y, z: z - value.position.x }; value.rotation.y = 90; return value; }));
    }
  }
  p.push(...doorWall("通廊最前端低入口山墙", 0, -8, 2.1, 2.05, .18, .85, 1.9, wood, .2), box("通廊后端储物室的厚围墙", 0, 1.25, 8, 2.1, 2.1, .35, earth), box("覆草农舍后部抬高睡台", -4.5, .46, 1.7, 2.6, .52, 3.2, wood));
  return p;
}

function hallHouseFarm(): ModelPart[] {
  const p: ModelPart[] = [box("人畜共居长厅完整夯土地坪", 0, .1, 0, 13.5, .2, 24.4, earth), ...gableCover("跨越畜区长厅和后住宅的大茅屋盖", 14, 25, 2.65, 4.55, "#a4976d")];
  for (const side of [-1, 1]) {
    p.push(box("长厅低外围墙", side * 6.55, 1.55, 0, .2, 2.7, 24, pale), box("高内柱列之上的纵向承檩", side * 2.5, 5.38, 0, .24, .25, 23, wood));
    for (const z of [-10.5, -5.2, 0, 5.2, 10.5]) p.push(box("两列高内柱直接落地支承大屋盖", side * 2.5, 2.76, z, .25, 5.12, .25, wood), beam("高柱向侧畜区檐口延伸的斜梁", wood, [side * 2.5, 5.38, z], [side * 6.55, 2.76, z], .18), beam("高柱和横梁之间的短斜托木", wood, [side * 2.5, 4.35, z], [side * 1.55, 5.38, z], .14));
    for (const z of [-8.4, -3.1, 2.2]) p.push(box("长厅两旁可进出的横向低畜栏", side * 4.65, .87, z, 3.5, 1.34, .11, wood), box("沿中央厅边缘的饲草低槽底", side * 2.95, .38, z + 1.2, .6, .25, 4.1, wood));
  }
  for (const z of [-10.5, -5.2, 0, 5.2, 10.5]) p.push(box("两高柱间承住中央屋盖的横系梁", 0, 5.38, z, 5.3, .25, .25, wood));
  for (const end of [-1, 1]) p.push(...doorWall("长厅前车门与后部住屋端门", 0, end * 12, 13.2, 2.7, .18, end < 0 ? 3.25 : 1, 2.5, pale, .2), endGable(0, end * 12, 13.2, 2.9, 4.15, wood));
  p.push(...doorWall("横火厅后面的独立住室分界", 0, 6, 13.1, 2.7, .15, 1.05, 2.05, wood, .2), box("后部起居室上方真实储草阁板", 0, 3.03, 9, 12.9, .18, 6, wood), box("横火厅中的不燃长火床", 0, .28, 4.1, 1.4, .16, 1.8, stone), box("后部左右居室之间的木隔壁", 1.2, 1.55, 9, .14, 2.7, 5.8, wood), ...ladder("长厅到后部阁板的内梯", -1.2, .2, 4.7, 3.7, 6.8, 9));
  return p;
}

function chaletFarmhouse(): ModelPart[] {
  const p: ModelPart[] = [box("石畜层完整落地基础", 0, .12, 0, 11.8, .24, 10.6, stone), ...doorWall("落地石畜层前方双宽入口", 0, -5, 11.2, 2.65, .55, 2.1, 2.25, stone, .24), box("石畜层后厚墙", 0, 1.565, 5, 11.2, 2.65, .55, stone), ...[-1, 1].map(side => box("石畜层左右厚承墙", side * 5.35, 1.565, 0, .5, 2.65, 10, stone)), box("整块石畜层之上的承重木楼板", 0, 3, 0, 11.4, .22, 10.2, wood)];
  for (const y of [3.11, 5.91]) {
    p.push(...doorWall("两层上住宅面向前廊的真木门", 0, -5, 11, 2.8, .2, 1.05, 2.1, wood, y), hardWall("两层上住宅背墙的真实窗孔", 11, 2.8, .2, [0, y, 5.1], [[[-3.5, 1], [-2.2, 1], [-2.2, 2.1], [-3.5, 2.1]], [[2.2, 1], [3.5, 1], [3.5, 2.1], [2.2, 2.1]]], wood));
    for (const side of [-1, 1]) p.push(...sideWindow(side * 5.4, 0, 10, y, 2.8, wood, .2));
    p.push(box("正面贯通并可走动的外木廊板", 0, y - .075, -5.75, 12.2, .15, 1.5, wood), box("沿一侧回转的外木廊板", 5.95, y - .075, 0, 1.3, .15, 10.2, wood), box("侧外廊上沿连续扶手", 6.53, y + 1.05, 0, .09, .09, 10.1, wood));
    if (y === 3.11) for (const [a, b] of [[-6.05, -4.9], [-3.7, 6.05]]) p.push(box("第一外廊在外梯顶口真实断开的扶手", (a! + b!) / 2, y + 1.05, -6.43, b! - a!, .09, .09, wood)); else p.push(box("第二外廊前缘连续扶手", 0, y + 1.05, -6.43, 12.1, .09, .09, wood));
    const posts = [-5.85, -3.9, -1.95, 0, 1.95, 3.9, 5.85].map(x => solidBox("外廊前缘独立护栏木柱", x, y + .525, -6.43, .075, 1.05, .075, wood)); p.push(combineMeshes("全部保留通透间隔的前廊木栏", wood, posts), combineMeshes("把侧廊扶手接回侧廊板的竖木栏", wood, [-4.8, -2.4, 0, 2.4, 4.8].map(z => solidBox("侧廊独立栏柱", 6.53, y + .525, z, .075, 1.05, .075, wood))));
    if (y === 3.11) p.push(polygon("住宅层间真正避开内木梯的楼板", wood, [[-5.6, -5], [5.6, -5], [5.6, 5], [-5.6, 5]], .18, [0, 5.73, 0], [[[-4.95, -1.65], [-3.85, -1.65], [-3.85, -.45], [-4.95, -.45]]]));
  }
  p.push(...gableCover("宽伸长檐低坡木片大屋盖", 14, 13.8, 8.35, 2.2, "#777e6d"), ...[-1, 1].map(end => endGable(0, end * 5, 11, 8.71, 1.7, wood)));
  for (const x of [-5.85, 5.85]) p.push(box("正面大外廊下实际落地的独立承柱", x, 1.58, -5.75, .2, 3.16, .2, wood));
  p.push(...ladder("从地面升到第一外廊的独立木梯", -4.3, .24, -8.8, 3.85, -6.1, 9), ...ladder("穿过真实楼板洞口的住宅内部层间木梯", -4.4, 3.11, -2.4, 6.65, -.8, 9));
  return p;
}

function towerHouseResidence(): ModelPart[] {
  const p: ModelPart[] = [box("主居块和窄梯翼共同石基", 1.5, .1, 0, 11.6, .2, 9.8, stone)];
  const openings: [number, number][][] = [[[-2.3, 1.04], [-1.35, 1.04], [-1.35, 2.15], [-2.3, 2.15]], [[1.35, 1.04], [2.3, 1.04], [2.3, 2.15], [1.35, 2.15]]];
  for (let level = 0; level < 4; level++) {
    const floor = .2 + level * 3.2;
    p.push(box("石居堡各层可进入的完整木地板", 0, floor + .08, 0, 7.8, .16, 9.2, wood), hardWall("石居堡后部两窗厚墙", 7.8, 3.2, .55, [0, floor, 4.875], openings, stone), hardWall("石居堡左侧独立真窗厚墙", 9.2, 3.2, .55, [-4.175, floor, 0], [[[-.5, 1.04], [.5, 1.04], [.5, 2.15], [-.5, 2.15]]], stone, 90));
    if (level) p.push(hardWall("上层临前庭真双窗石墙", 7.8, 3.2, .55, [0, floor, -4.325], openings, stone)); else p.push(...doorWall("地层石居堡真正出入大门", 0, -4.6, 7.8, 3.2, .55, 1.2, 2.2, stone, floor));
    p.push(combineMeshes("各层通向侧翼转梯的真实一米门洞石墙", stone, [solidBox("梯门前部墙垛", 3.9, floor + 1.6, -3.7, .55, 3.2, 1.8, stone), solidBox("梯门后部墙垛", 3.9, floor + 1.6, 1.4, .55, 3.2, 6.4, stone), solidBox("梯门上方承重石楣", 3.9, floor + 2.66, -2.3, .55, 1.08, 1, stone)]));
    p.push(box("盘梯每层接入房门的石平台", 4.35, floor + .08, -2.3, 1.2, .16, 1, stone));
  }
  p.push(box("主屋屋盖下的完整阁楼木地板", 0, 13.08, 0, 7.8, .16, 9.2, wood), box("盘梯高端实际接入阁楼的石平台", 4.35, 13.08, -2.3, 1.2, .16, 1, stone), box("外置盘梯翼右侧厚围墙", 7.1, 6.6, -2.3, .4, 12.8, 4.8, stone), box("盘梯翼前厚墙", 5.4, 6.6, -4.7, 3.4, 12.8, .4, stone), box("盘梯翼后厚墙", 5.4, 6.6, .1, 3.4, 12.8, .4, stone), cylinder("真正承住环形石梯的中央实石柱", 5.4, 6.6, -2.3, .36, 12.8, stone));
  for (let batch = 0; batch < 4; batch++) {
    const steps: ModelPart[] = [];
    for (let i = batch * 16; i < (batch + 1) * 16; i++) { const a = Math.PI + i * Math.PI / 8, b = Math.PI + (i + 1) * Math.PI / 8, y = .2 + (i + 1) * .2, point = (r: number, angle: number): Triple => [5.4 + Math.cos(angle) * r, y, -2.3 + Math.sin(angle) * r]; steps.push(slopePanel("独立实楔形旋梯踏板", [point(.17, a), point(1.42, a), point(1.42, b), point(.17, b)], .16, stone)); }
    p.push(combineMeshes("一整圈石旋梯的全部十六块独立踏板", stone, steps));
  }
  p.push(...gableCover("多层石居块高山墙屋盖", 9, 10.2, 13.06, 1.9, "#747d75"), ...[-1, 1].map(end => endGable(0, end * 4.6, 7.8, 13, 1.7, stone)), ...gableCover("窄盘梯翼独立小山墙盖", 4.2, 5.4, 12.95, 1.1, "#747d75", 5.4, -2.3), ...[-1, 1].map(end => endGable(5.4, -2.3 + end * 2.4, 3.4, 13, 1, stone)));
  return p;
}

function smokeSauna(): ModelPart[] {
  const p: ModelPart[] = [box("双室浴屋完整石地坪", 0, .12, 0, 6.5, .24, 7.4, stone), courseWall("蓄热木浴屋前部低门横木壁", 0, -3.45, 6.2, .2, .24, 8, .3, wood, 0, 1.05, 6), courseWall("烟熏热室左木壁", -3, 0, 7.1, .2, .24, 8, .3, wood, 90), courseWall("烟熏热室右木壁", 3, 0, 7.1, .2, .24, 8, .3, wood, 90), hardWall("后木壁高处真正开排烟孔", 6.2, 2.4, .2, [0, .24, 3.55], [[[1.7, 1.85], [2.15, 1.85], [2.15, 2.2], [1.7, 2.2]]], wood), ...gableCover("完整木浴屋的双坡挡雨盖", 7, 7.9, 2.66, 1.15, "#7f836d"), ...doorWall("换衣室与热室之间的低木门", 0, -1.15, 6, 2.4, .16, .83, 1.65, wood, .24)];
  for (const end of [-1, 1]) p.push(endGable(0, end * 3.45, 6.2, 2.64, 1.04, wood));
  p.push(box("热室侧边高坐席台板", 2, 1.47, 1.3, 1.5, .12, 3.7, wood), box("热室后排高坐席台板", .2, 1.47, 2.75, 2.4, .12, .8, wood), box("热室低踏阶", 1.05, .485, 1.35, .6, .49, 3.4, wood), box("换衣室靠墙坐台", -1.7, .58, -2.4, 2, .12, .65, wood));
  for (const x of [-.6, 1]) p.push(box("后排高坐席下真正落地的承足", x, .85, 2.75, .13, 1.22, .13, wood));
  for (const x of [-2.45, -.95]) p.push(box("换衣坐台下实际落到石地坪的短脚", x, .38, -2.4, .12, .28, .12, wood));
  for (const x of [1.5, 2.5]) for (const z of [-.35, 2.95]) p.push(box("高热台板下连续落地木足", x, .85, z, .13, 1.22, .13, wood));
  p.push(box("近门石炉不燃落地炉基", -1.7, .4, .1, 1.55, .32, 1.55, stone), box("蓄石火床左侧厚壁", -2.3, .72, .1, .3, .65, 1.5, stone), box("蓄石火床右侧厚壁", -1.1, .72, .1, .3, .65, 1.5, stone), box("炉膛后厚壁", -1.7, .72, .7, 1.5, .65, .3, stone), box("开放炉口上方托热石的石过梁", -1.7, .98, -.45, 1.5, .22, .3, stone));
  for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; p.push(part("向上敞露而无烟囱的蓄热石块", "sphere", stone, [-1.7 + Math.cos(a) * .43, 1.16 + i % 2 * .08, .1 + Math.sin(a) * .43], [.47, .32, .43])); }
  p.push(part("后壁排烟孔之外向上撑开的木遮板", "box", wood, [1.93, 2.72, 3.65], [.58, .07, .45], [25, 0, 0]));
  return p;
}

// https://nysm.nysed.gov/mohawk-haudenosaunee-village/haudenosaunee-longhouse
function barkLonghouse(): ModelPart[] {
  const bark = "#a7977c", p: ModelPart[] = [box("树皮长屋完整中央泥土通行地坪", 0, .1, 0, 6.3, .2, 24.2, earth)];
  for (const side of [-1, 1]) p.push(box("独立边柱外侧整列薄树皮围墙", side * 2.96, 1.2, 0, .1, 2, 24, bark));
  for (let band = 0; band < 12; band++) {
    const a = band * Math.PI / 12, b = (band + 1) * Math.PI / 12, ranges = band === 5 || band === 6 ? [[-12, -8.6], [-7.4, -.6], [.6, 7.4], [8.6, 12]] : [[-12, 12]];
    for (const [z0, z1] of ranges) p.push(slopePanel("避开火塘上方真烟洞的桶拱树皮屋片", [[Math.cos(a) * 3, 2.2 + Math.sin(a) * 3, z0!], [Math.cos(b) * 3, 2.2 + Math.sin(b) * 3, z0!], [Math.cos(b) * 3, 2.2 + Math.sin(b) * 3, z1!], [Math.cos(a) * 3, 2.2 + Math.sin(a) * 3, z1!]], .055, bark));
  }
  for (const z of [-11, -7.3, -3.7, 0, 3.7, 7.3, 11]) {
    p.push(part("接在直边柱上并越过整个桶拱的连续幼木肋", "tube", wood, [0, 2.18, z], [1, 1, 1], [0, 0, 0], { radius: .04, path: Array.from({ length: 9 }, (_, i) => ({ x: Math.cos(i * Math.PI / 8) * 2.91, y: Math.sin(i * Math.PI / 8) * 2.91, z: 0 })) }));
    for (const side of [-1, 1]) p.push(cylinder("直立边柱把桶拱肋传到地脚", side * 2.9, 1.2, z, .1, 2, wood));
  }
  const profile = [{ x: -3, y: 2.2 }, { x: 3, y: 2.2 }, ...Array.from({ length: 11 }, (_, i) => { const a = (i + 1) * Math.PI / 12; return { x: Math.cos(a) * 3, y: 2.2 + Math.sin(a) * 3 }; })];
  for (const end of [-1, 1]) p.push(...doorWall("树皮长屋端门的两旁围壁", 0, end * 12, 6, 2, .09, 1.15, 1.8, bark, .2), part("桶拱屋盖两端完整树皮山面", "extrude", bark, [0, 0, end * 12], [1, 1, 1], [0, 0, 0], { depth: .08, profile }));
  for (const z of [-8, 0, 8]) {
    p.push(cylinder("每组两家共用的中央火塘石底", 0, .25, z, 1.1, .1, stone));
    for (const side of [-1, 1]) p.push(box("家庭隔间下部坐卧台板", side * 2.1, .52, z, 1.6, .12, 5, wood), box("家庭隔间上部贮藏棚板", side * 2.1, 2.05, z, 1.6, .1, 5, wood), ...[-1, 1].map(end => box("隔间前后屏板留中央通道", side * 2.1, 1.25, z + end * 2.55, 1.6, 1.6, .08, bark)));
  }
  for (const side of [-1, 1]) {
    const supports: ModelPart[] = [];
    for (const z of [-8, 0, 8]) for (const x of [1.34, 2.82]) for (const end of [-1, 1]) supports.push(solidBox("把上下坐卧贮物棚板同时接回地面的木支柱", side * x, 1.14, z + end * 2.35, .08, 1.88, .08, wood));
    p.push(combineMeshes("家庭隔间全部落地承重立柱", wood, supports));
  }
  return p;
}

// https://thc.texas.gov/blog/grass-home
function caddoGrassHouse(): ModelPart[] {
  const grass = "#a99a6f", angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 260, 280, 300, 330, 360], profile = [[6.4, .2], [6.3, 1.95], [5.7, 4.2], [4.4, 6.4], [1.7, 8.2], [.2, 8.65]], p: ModelPart[] = [cylinder("高冠束草居室完整压实土坪", 0, .1, 0, 13, .2, earth)];
  for (let sector = 0; sector < angles.length - 1; sector++) {
    const a = angles[sector]! * Math.PI / 180, b = angles[sector + 1]! * Math.PI / 180, pieces: ModelPart[] = [];
    for (let band = 0; band < profile.length - 1; band++) {
      if (angles[sector] === 260 && band === 0) continue;
      const [r0, y0] = profile[band]!, [r1, y1] = profile[band + 1]!;
      pieces.push(slopePanel("长束草向上叠覆的厚穹盖围片", [[Math.cos(a) * r0!, y0!, Math.sin(a) * r0!], [Math.cos(b) * r0!, y0!, Math.sin(b) * r0!], [Math.cos(b) * r1!, y1!, Math.sin(b) * r1!], [Math.cos(a) * r1!, y1!, Math.sin(a) * r1!]], .12, grass));
    }
    p.push(combineMeshes("真实避开低入口并在高冠留通烟口的束草外壳", grass, pieces));
  }
  for (let i = 0; i < 12; i++) {
    const a = (15 + i * 30) * Math.PI / 180;
    p.push(part("从地脚接到高冠束结的连续长木杆", "tube", wood, [0, 0, 0], [1, 1, 1], [0, 0, 0], { radius: .075, path: profile.map(([r, y]) => ({ x: Math.cos(a) * (r! - .08), y: y! - (y! > .2 ? .06 : 0), z: Math.sin(a) * (r! - .08) })) }));
  }
  for (const [r, y] of [[6.11, 2.35], [5.33, 4.7], [4.17, 6.5]]) p.push(part("在入口之上绑住承重杆圈的独立水平木箍", "lathe", wood, [0, y!, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: r! - .055, y: -.055 }, { x: r! + .055, y: -.055 }, { x: r! + .055, y: .055 }, { x: r! - .055, y: .055 }, { x: r! - .055, y: -.055 }] }));
  p.push(cylinder("高穹居室中央不燃火床", 0, .27, 0, 1.4, .14, stone));
  return p;
}
