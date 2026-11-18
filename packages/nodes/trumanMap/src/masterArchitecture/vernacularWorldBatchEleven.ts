import { part, beam, ring, type ModelPart, type Triple } from "../assetModelParts";
import { combineMeshes } from "../natureParts";
import { tapered } from "../masterNature/shared";
import { box, cylinder, design } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { doorWall, gableCover, slopePanel } from "./vernacularWorldBatchOne";
import { endGable, ladder } from "./vernacularWorldBatchTwo";
import { hardWall, solidBox } from "./vernacularWorldBatchThree";
import { meshBeam } from "./vernacularWorldBatchFive";
import { hardFloor } from "./vernacularWorldBatchSix";
import { radialShellBand } from "./vernacularWorldBatchNine";

const wood = "#927451", earth = "#aa9577", stone = "#a5a896", thatch = "#ab9d73", dark = "#685848", metal = "#667c79";

// https://www.gov.br/funai/pt-br/assuntos/noticias/2023/arquitetura-indigena-conheca-as-habitacoes-dos-povos-originarios
// https://www.traditionalarchitecturejournal.com/index.php/home/article/download/521/92/3021
// https://www.parks.canada.ca/pn-np/nu/auyuittuq/culture
// https://alberta.preserve.ucalgary.ca/sites/ogilvie-grain-elevator/
export const vernacularWorldBatchElevenDesigns = [
  design("内向环盖放射分室共居院", "外低内高的连续棕叶环盖围住大露天中庭，放射木椽接入内外柱圈，家庭分隔只伸入环盖外半部，单一缺口贯通进入中庭", yanomamiShabono, "建筑", "异域"),
  design("高肩前罩编竹穹居", "鼓起的高编竹穹体接到低长前罩，真正贯通的高内门和两个小眼窗留在竹壳中，纵肋和横束圈与连续外覆壳相接", dorzeWovenHouse, "建筑", "异域"),
  design("石围鲸骨拱半沉冬居", "厚低石围埋在周边土堤内，粗曲鲸肋承担低圆覆顶，低于室内地坪的长入口接到暖室，后睡台下保留贮物空格", thuleWhaleboneHouse, "建筑", "异域"),
  design("木斗仓斜肩高塔谷物收发楼", "斜肩木高塔内分置真实空斗仓和斗式提粮中井，贯通车道的卸粮格口接到低斗靴，高位分粮层经下行管落向各仓，侧壁真孔通向卸粮管", prairieGrainElevator, "建筑", "欧式"),
];

function yanomamiShabono(): ModelPart[] {
  const p: ModelPart[] = [cylinder("环盖住居与中央露天场共用的完整压实地坪", 0, .1, 0, 44, .2, earth)], posts: ModelPart[] = [], frames: ModelPart[] = [];
  const wall = halfRoundWall("低外圈编枝围壁真实避开唯一入院缺口", 20, .12, 1.1, [0, .2, 0], -275.625, wood, Math.PI * 2 - Math.PI / 16); p.push(wall);
  for (let i = 0; i < 32; i++) {
    const a = (i - .5) * Math.PI / 16, b = (i + .5) * Math.PI / 16, at = (r: number, y: number, angle: number): Triple => [Math.cos(angle) * r, y, Math.sin(angle) * r];
    posts.push(solidBox("外低柱圈中实际落地的独立木支柱", Math.cos(a) * 20, .95, Math.sin(a) * 20, .18, 1.5, .18, wood), solidBox("内高柱圈中实际落地的独立木支柱", Math.cos(a) * 9.3, 3.05, Math.sin(a) * 9.3, .23, 5.7, .23, wood));
    if (i === 24) { frames.push(meshBeam("入院缺口边缘单独连接内外柱的放射门边椽", at(20, 1.7, a), at(9.3, 5.95, a), .2, wood)); continue; }
    p.push(slopePanel("向大中庭升起并避开入院缺口的完整棕叶环盖", [at(20.8, 1.55, a), at(20.8, 1.55, b), at(9, 6.2, b), at(9, 6.2, a)], .16, thatch));
    frames.push(meshBeam("内高柱圈顶部相接的环向长承枋", at(9.3, 5.95, a), at(9.3, 5.95, b), .2, wood), meshBeam("外低柱圈顶部相接的环向长承枋", at(20, 1.7, a), at(20, 1.7, b), .18, wood), meshBeam("外低柱向内高柱延伸的完整放射承椽", at(20, 1.7, a), at(9.3, 5.95, a), .2, wood));
    if (i % 2 === 0) { const angle = (a + b) / 2; p.push(part("仅分隔家庭外半部而不堵内侧环行道的低屏", "box", wood, [Math.cos(angle) * 17, .9, Math.sin(angle) * 17], [6, 1.4, .06], [0, -angle * 180 / Math.PI, 0])); }
  }
  for (let i = 0; i < posts.length; i += 16) p.push(combineMeshes("完整保留内外两列实际承屋木柱", wood, posts.slice(i, i + 16)));
  for (let i = 0; i < frames.length; i += 16) p.push(combineMeshes("沿环盖真实接续的全部承枋与放射椽", wood, frames.slice(i, i + 16)));
  for (let i = 0; i < 8; i++) { const a = (22.5 + i * 45) * Math.PI / 180; p.push(cylinder("家庭环道外缘独立不燃火床底石", Math.cos(a) * 13.8, .26, Math.sin(a) * 13.8, 1.1, .12, stone)); }
  return p;
}

function dorzeWovenHouse(): ModelPart[] {
  const bamboo = "#9b865c", profile: [number, number][] = [[3.7, .2], [3.9, 1.8], [3.9, 3.5], [3.7, 4.2], [3.58, 4.8], [3.4, 5.5], [2.75, 7.4], [1.55, 9], [.15, 9.8]], angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 245, 255, 265, 275, 285, 295, 300, 330, 360], p: ModelPart[] = [cylinder("编竹高穹居室完整压实泥地坪", 0, .1, 0, 7.9, .2, earth), box("前罩从外门进入高内门的连续泥地坪", 0, .1, -5.4, 2.5, .2, 3.8, earth)], covers: ModelPart[] = [], frames: ModelPart[] = [];
  for (let i = 0; i < angles.length - 1; i++) for (let band = 0; band < profile.length - 1; band++) {
    if ((band < 2 && angles[i]! >= 255 && angles[i]! < 285) || (band === 3 && (angles[i] === 245 || angles[i] === 285))) continue;
    covers.push(radialShellBand("绕过高内门与两眼窗的真实薄编竹壳", thatch, profile[band]!, profile[band + 1]!, angles[i]! * Math.PI / 180, angles[i + 1]! * Math.PI / 180, Math.min(.1, profile[band + 1]![0] * .5)));
  }
  for (let i = 0; i < covers.length; i += 16) p.push(combineMeshes("高肩竹穹连续围护并在前面留真门和眼窗", thatch, covers.slice(i, i + 16)));
  for (let i = 0; i < 12; i++) {
    const a = (15 + i * 30) * Math.PI / 180;
    for (let band = 0; band < profile.length - 1; band++) { const x = profile[band]!, y = profile[band + 1]!; frames.push(meshBeam("由地脚连续弯收并编入高肩壳的竹纵肋", [Math.cos(a) * (x[0] - .08), x[1], Math.sin(a) * (x[0] - .08)], [Math.cos(a) * Math.max(.03, y[0] - .08), y[1], Math.sin(a) * Math.max(.03, y[0] - .08)], .065, bamboo)); }
  }
  for (const [r, y] of [[3.81, 1.8], [3.81, 3.5], [3.31, 5.5], [2.66, 7.4]]) p.push(halfRoundWall("编竹高穹真实避开高门的横向束圈", r!, .065, .07, [0, y! - .035, 0], -285, bamboo, Math.PI * 2 - Math.PI / 6));
  for (const angle of [250, 290]) {
    const a = (angle - 5) * Math.PI / 180, b = (angle + 5) * Math.PI / 180, at = (r: number, y: number, t: number): Triple => [Math.cos(t) * r, y, Math.sin(t) * r];
    frames.push(meshBeam("高眼窗下缘真实竹束框", at(3.66, 4.2, a), at(3.66, 4.2, b), .08, bamboo), meshBeam("高眼窗上缘真实竹束框", at(3.54, 4.8, a), at(3.54, 4.8, b), .08, bamboo), meshBeam("高眼窗左侧真实竹束框", at(3.66, 4.2, a), at(3.54, 4.8, a), .08, bamboo), meshBeam("高眼窗右侧真实竹束框", at(3.66, 4.2, b), at(3.54, 4.8, b), .08, bamboo));
  }
  for (let i = 0; i < frames.length; i += 16) p.push(combineMeshes("完整保留编竹主壳纵肋与门窗束框", bamboo, frames.slice(i, i + 16)));
  const noseFrames: ModelPart[] = [];
  for (let band = 0; band < 8; band++) {
    const a = band * Math.PI / 8, b = (band + 1) * Math.PI / 8, at = (t: number, z: number, height: number): Triple => [Math.cos(t) * 1.3, .2 + Math.sin(t) * height, z];
    const corners = [at(a, -7.2, 2.5), at(b, -7.2, 2.5), at(b, -3.5, 3.3), at(a, -3.5, 3.3)];
    p.push(combineMeshes("由低前门自然升入高内门的连续拱鼻罩", thatch, [slopePanel("前鼻罩前后三角实厚坡片", [corners[0]!, corners[1]!, corners[2]!], .075, thatch), slopePanel("前鼻罩接入高内门的三角实厚坡片", [corners[0]!, corners[2]!, corners[3]!], .075, thatch)]));
    for (const z of [-7.1, -5.4, -3.7]) { const h = 2.5 + (z + 7.2) / 3.7 * .8; noseFrames.push(meshBeam("前鼻罩真正从地坪跨到拱顶的竹束肋", at(a, z, h), at(b, z, h), .07, bamboo)); }
  }
  for (let i = 0; i < noseFrames.length; i += 16) p.push(combineMeshes("前鼻罩与高主穹相连的全部竹束拱肋", bamboo, noseFrames.slice(i, i + 16)));
  p.push(box("内部睡区和中央会客区之间的竹编低屏", -1.2, 1.1, 1.3, 3.6, 1.8, .07, bamboo), box("屏内完整抬高木睡台", -1.3, .43, 2.2, 2.7, .46, 1.15, wood), cylinder("高穹正中完整不燃火床", .5, .26, .2, 1.1, .12, stone));
  return p;
}

function thuleWhaleboneHouse(): ModelPart[] {
  const p: ModelPart[] = [], floor = cylinder("半沉鲸骨冬居内低于周围土堤的完整地坪", 0, .2, 0, 6.4, .4, stone); floor.scale.x *= 1.2; p.push(floor);
  const bank = halfRoundWall("冬居外围真实抬起并避开低隧道的土堤", 4.5, 1.25, 1.2, [0, 0, 0], -282, earth, Math.PI * 2 - Math.PI / 7.5); bank.scale.x = 1.15;
  const wall = halfRoundWall("土堤内部真实留低门口的椭圆厚石围壁", 3.2, .55, 1.3, [0, .4, 0], -282, stone, Math.PI * 2 - Math.PI / 7.5); wall.scale.x = 1.2; p.push(bank, wall, box("低入口通道低于暖室地坪的完整石底", 0, .1, -4.9, 1.5, .2, 4.2, stone), ...[-1, 1].map(side => box("低入口左右连续厚石围壁", side * .72, .825, -4.9, .3, 1.25, 4.2, stone)), box("从隧道升入暖室的真实低石级", 0, .3, -2.9, 1.3, .2, .6, stone), box("穿过外土堤并接到内室的低覆土隧道顶", 0, 1.5, -4.9, 1.85, .2, 4.2, earth));
  const profile: [number, number][] = [[3.3, 1.6], [3.1, 2.2], [2.4, 3], [1.3, 3.45], [.05, 3.6]], covers: ModelPart[] = [];
  for (let i = 0; i < 16; i++) for (let band = 0; band < profile.length - 1; band++) { const a = i * Math.PI / 8, b = (i + 1) * Math.PI / 8, u = profile[band]!, v = profile[band + 1]!, at = (r: number, y: number, t: number): Triple => [Math.cos(t) * r * 1.2, y, Math.sin(t) * r]; covers.push(slopePanel("鲸肋之上连续包住低冬居的厚草皮盖", [at(u[0], u[1], a), at(u[0], u[1], b), at(v[0], v[1], b), at(v[0], v[1], a)], .22, earth)); }
  for (let i = 0; i < covers.length; i += 16) p.push(combineMeshes("厚石围壁上完整保留低圆覆顶的草皮壳", earth, covers.slice(i, i + 16)));
  const roofY = (r: number) => { for (let i = 0; i < profile.length - 1; i++) { const a = profile[i]!, b = profile[i + 1]!; if (r <= a[0] && r >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - r) / (a[0] - b[0]); } return profile.at(-1)![1]; }, bones: ModelPart[] = [];
  for (const z of [-2, -1, 0, 1, 2]) {
    const half = Math.sqrt(3.2 ** 2 - z ** 2) * 1.2, path: Triple[] = Array.from({ length: 7 }, (_, i) => { const x = Math.cos(i * Math.PI / 6) * half; return [x, roofY(Math.hypot(x / 1.2, z)) - .28, z]; });
    bones.push(tapered("由厚石围壁真实跨起并在中段收细的鲸肋", "#cec7aa", path, [.15, .13, .1, .08, .1, .13, .15]));
  }
  p.push(combineMeshes("完整保留五道粗曲鲸肋承屋拱", "#cec7aa", bones), box("后部贮物空格上方完整抬起的睡台板", 0, 1.075, 1.3, 4, .15, 1.4, wood));
  for (const x of [-1.8, 0, 1.8]) p.push(box("后睡台下分隔贮物空格并承台的短石壁", x, .7, 1.3, .16, .6, 1.4, stone));
  for (const side of [-1, 1]) p.push(box("侧边油灯与烹食工作台的实际石托座", side * 2.35, .6, -.4, .65, .4, 1.5, stone), box("石托座上完整低工作台面", side * 2.35, .86, -.4, .9, .12, 1.65, wood));
  return p;
}

function prairieGrainElevator(): ModelPart[] {
  const clad = "#aa8162", p: ModelPart[] = [hardFloor("木粮塔底部保留提粮斗靴真口的架空木工作地板", wood, [[-4.7, -5.2], [4.7, -5.2], [4.7, 5.2], [-4.7, 5.2]], .12, [0, .48, 0], [[[-.7, -.7], [.7, -.7], [.7, .7], [-.7, .7]]]), hardFloor("贯通车道真实避开卸粮格口的高木地坪", wood, [[-10.3, -8], [-4.3, -8], [-4.3, 8], [-10.3, 8]], .2, [0, .4, 0], [[[-8.2, -1.5], [-6.2, -1.5], [-6.2, 1.5], [-8.2, 1.5]]]), box("卸粮格口之下真正低于车道地板的斗坑底", -7.2, .08, 0, 2.25, .16, 3.2, stone), ...doorWall("斜肩粮塔检修前门的完整高木立面", 0, -5, 9, 17.9, .26, 1.1, 2.2, clad, .6), box("斜肩粮塔后方完整通高木立面", 0, 9.55, 5, 9, 17.9, .26, clad), box("斜肩粮塔临车道完整通高木立面", -4.5, 9.55, 0, .26, 17.9, 10, clad), hardWall("面轨道木墙真正避开斜卸粮管的贯通孔", 10, 17.9, .26, [4.37, .6, 0], [[[1.65, 3], [2.35, 3], [2.35, 4], [1.65, 4]]], clad, 90)];
  for (const side of [-1, 1]) p.push(box("木粮塔前后实际落地的低石基础", 0, .24, side * 5, 9.4, .48, .4, stone));
  p.push(box("木粮塔临轨一侧实际落地的连续低石基", 4.5, .24, 0, .4, .48, 10, stone));
  for (const z of [-2.7, 2.7]) p.push(box("临车道石基真正避开低收粮横槽的两段基脚", -4.5, .24, z, .4, .48, 4.6, stone));
  for (const side of [-1, 1]) p.push(box("卸粮坑两侧实际落到坑底的石挡壁", -7.2 + side * 1.1, .3, 0, .16, .44, 3.2, stone));
  const grate: ModelPart[] = [];
  for (let i = 0; i < 9; i++) grate.push(solidBox("真正跨过卸粮坑口且保留落粮缝的横格条", -7.2, .57, -1.36 + i * .34, 2.1, .06, .13, metal));
  p.push(combineMeshes("车道地板内完整保留实际落粮空隙的卸粮格栅", metal, grate), box("卸粮坑接入塔内斗靴的低横收粮槽底", -3.6, .24, 0, 7.5, .08, .54, wood), ...[-1, 1].map(side => box("低横收粮槽连续而不堵斗靴的侧挡板", -3.6, .35, side * .29, 7.5, .2, .06, wood)), slopePanel("从外侧承柱降接高塔外墙的完整长车道棚盖", [[-10.5, 4.75, -8.5], [-4.63, 6.2, -8.5], [-4.63, 6.2, 8.5], [-10.5, 4.75, 8.5]], .16, thatch), box("车道外侧两端承柱之上的完整长承枋", -10.05, 4.73, 0, .22, .12, 16, wood), box("长车道棚盖实际接在木高塔外壁上的高承枋", -4.65, 6.05, 0, .2, .22, 17, wood));
  for (const end of [-1, 1]) p.push(box("车道外侧两端在车道之外的真实通高承柱", -10.05, 2.65, end * 7.7, .24, 4.1, .24, wood), part("从地面接上贯通车道的完整实楔坡道", "extrude", stone, [-7.2, 0, 0], [1, 1, 1], [0, 90, 0], { depth: 6, profile: [{ x: -end * 12, y: 0 }, { x: -end * 8, y: 0 }, { x: -end * 8, y: .6 }] }));
  for (const z of [-7.7, 0, 7.7]) p.push(beam("车道外侧长承枋真正接到高塔外壁的斜椽", wood, [-10.05, 4.73, z], [-4.63, 6.05, z], .18));
  for (const side of [-1, 1]) p.push(slopePanel("宽木斗仓向窄顶屋升起的真实斜肩盖", [[side * 4.8, 18.4, -5.4], [side * 2.2, 21.8, -5.4], [side * 2.2, 21.8, 5.4], [side * 4.8, 18.4, 5.4]], .18, clad), box("窄顶分粮屋两侧完整高围壁", side * 2.2, 23.3, 0, .22, 3.2, 10, clad));
  for (const end of [-1, 1]) {
    const shoulder = hardFloor("高粮塔前后立面连续封合的斜肩山面", clad, [[-4.5, 18.5], [4.5, 18.5], [2.2, 21.7], [-2.2, 21.7]], .24, [0, 0, end * 5 + .12]); shoulder.rotation.x = -90; p.push(shoulder, hardWall("窄顶分粮屋前后真正贯通的采光窗", 4.4, 3.2, .22, [0, 21.7, end * 5 + .11], [[[-.65, 1], [.65, 1], [.65, 2.2], [-.65, 2.2]]], clad), endGable(0, end * 5, 4.4, 24.9, 1.94, clad));
  }
  p.push(...gableCover("窄顶分粮屋完整高双坡木盖", 5, 10.8, 24.8, 2.2, thatch), hardFloor("顶层分粮环台避开全部分粮管和独立内梯井", wood, [[-2.2, -5], [2.2, -5], [2.2, 5], [-2.2, 5]], .15, [0, 21.55, 0], [[[-1.5, -2], [1.5, -2], [1.5, 2], [-1.5, 2]], [[-.5, 3.2], [.5, 3.2], [.5, 4.4], [-.5, 4.4]]]));
  const binWalls: ModelPart[] = [], hoppers: ModelPart[] = [], buckets: ModelPart[] = [], legs: ModelPart[] = [];
  for (const side of [-1, 1]) {
    binWalls.push(solidBox("中央提升检修窄道旁完整斗仓内墙", side * .6, 11.7, 0, .14, 12.6, 8.8, wood));
    for (const z of [-1.47, 1.47]) binWalls.push(solidBox("各储粮斗仓之间连续承压的横向木隔壁", side * 2.5, 11.7, z, 3.8, 12.6, .14, wood));
    for (const z of [-3, 0, 3]) {
      const x = side * 2.5, a: Triple[] = [[x - 1.88, 5.4, z - 1.4], [x + 1.88, 5.4, z - 1.4], [x + 1.88, 5.4, z + 1.4], [x - 1.88, 5.4, z + 1.4]], b: Triple[] = [[x - .2, 3, z - .2], [x + .2, 3, z - .2], [x + .2, 3, z + .2], [x - .2, 3, z + .2]];
      for (let i = 0; i < 4; i++) hoppers.push(slopePanel("每个空木斗仓下真实内收的斜漏斗壁", [a[i]!, a[(i + 1) % 4]!, b[(i + 1) % 4]!, b[i]!], .1, wood));
      p.push({ ...beam("高处分粮头真正降入各木斗仓的斜管", metal, [0, 23.25, 0], [x, 18.8, z], .23), shape: "cylinder" }, { ...beam("木斗仓底部向低斗靴明显下降的斜回粮管", metal, [x, 3, z], [0, .35, 0], .23), shape: "cylinder" });
    }
    for (const x of [-.22, .22]) legs.push(solidBox("前后双提粮腿两侧从斗靴接到顶轮的连续木壁", x, 11.9, side * .31, .05, 22.6, .55, wood));
    for (let i = 0; i < 30; i++) {
      const y = .9 + i * .75, cupY = y + (side < 0 ? .1 : -.1);
      buckets.push(solidBox("提升带上各谷斗真正封合的底片", 0, y, side * .46, .34, .05, .3, metal), solidBox("提升谷斗左侧真实挡粮侧片", -.145, cupY, side * .46, .05, .2, .3, metal), solidBox("提升谷斗右侧真实挡粮侧片", .145, cupY, side * .46, .05, .2, .3, metal), solidBox("提升谷斗贴提升带的真实后挡片", 0, cupY, side * .335, .34, .2, .05, metal), solidBox("提升谷斗外前缘真实挡粮片", 0, cupY, side * .585, .34, .2, .05, metal));
    }
  }
  legs.push(solidBox("前后提粮腿之间由两侧共用的连续中隔木板", 0, 11.9, 0, .44, 22.6, .07, wood));
  p.push(combineMeshes("全部储粮室真实空心分隔的六片承压木壁", wood, binWalls), combineMeshes("前后双提粮腿向外保留检修敞口的完整木套壁", wood, legs), combineMeshes("沿前后双斗腿运行的两条连续平提升带", dark, [-1, 1].map(side => solidBox("与横顶轮方向一致的竖直提升带", 0, 11.875, side * .31, .34, 22.45, .035, dark))), cylinder("前后提升带上部实际回转的横轴顶轮", 0, 23.1, 0, .62, .55, metal, [0, 0, 90]), cylinder("前后提升带下部斗靴中实际回转的横轴底轮", 0, .65, 0, .62, .55, metal, [0, 0, 90]), ring("接在提升顶轮下方的分粮头接料圈", metal, .55, .07, 23.25, .4));
  for (const [y, start] of [[23.1, 0], [.65, Math.PI]]) {
    const profile = Array.from({ length: 13 }, (_, i) => ({ x: Math.cos(start! + i * Math.PI / 12) * .33, y: Math.sin(start! + i * Math.PI / 12) * .33 })); profile.push(...Array.from({ length: 13 }, (_, i) => ({ x: Math.cos(start! + (12 - i) * Math.PI / 12) * .31, y: Math.sin(start! + (12 - i) * Math.PI / 12) * .31 })));
    p.push(part("绕过横轮并闭合前后提升直段的真实半圆带", "extrude", dark, [0, y!, 0], [1, 1, 1], [0, 90, 0], { depth: .34, profile }));
  }
  for (let i = 0; i < hoppers.length; i += 16) p.push(combineMeshes("六个储粮室下方全部保留真实内腔的斜斗", wood, hoppers.slice(i, i + 16)));
  for (let i = 0; i < buckets.length; i += 20) p.push(combineMeshes("前后提升带上全部保留四壁底片的开顶谷斗", metal, buckets.slice(i, i + 20)));
  for (let i = 0; i < 3; i++) p.push(...ladder("中央窄道后部逐段接到分粮环台的检修梯", 0, .6 + i * 7.1, 3.8, .6 + (i + 1) * 7.1, 3.8, 20));
  p.push({ ...beam("穿过面轨道真墙孔向车辆下降的卸粮长管", metal, [3, 4.4, 2], [7.1, 3.1, 2], .36), shape: "cylinder" }, box("面轨道高卸粮管下方完整工作踏台", 5.4, .5, 2, 1.6, 1, 3.2, wood));
  const frontSteps: ModelPart[] = [], sideSteps: ModelPart[] = [];
  for (let i = 0; i < 3; i++) { const height = (i + 1) * .2; frontSteps.push(solidBox("从地面逐级接到高木粮塔前检修门的完整石阶", 0, height / 2, -6.25 + (i + .5) * .35, 1.3, height, .35, stone)); }
  for (let i = 0; i < 5; i++) { const height = (i + 1) * .2; sideSteps.push(solidBox("从临轨地面逐级接到高卸粮工作踏台的实体木阶", 5.4, height / 2, -1.1 + (i + .5) * .3, 1.3, height, .3, wood)); }
  p.push(combineMeshes("检修门前真正接上架空木地坪的全部独立石阶", stone, frontSteps), combineMeshes("临轨工作踏台前真正落地接入的全部独立木阶", wood, sideSteps));
  return p;
}
