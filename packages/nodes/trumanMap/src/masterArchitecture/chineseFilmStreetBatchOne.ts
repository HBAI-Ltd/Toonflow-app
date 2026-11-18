import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#afa996", plaster = "#cdc2a8", wood = "#8b6847", dark = "#654e3a", tile = "#64746b", red = "#a65c49", cloth = "#d2b997", water = "#739894";

export const chineseFilmStreetBatchOneDesigns: ArchitecturePrototype[] = [
  design("复梁可登庆典彩楼欢门", "古装片场 水陆市井：木构彩棚跨过街心，上层可登彩楼与两侧挂彩架接成临时节庆欢门，外梯通桥口而非纯装饰牌坊", celebrationGate, "建筑", "中式"),
  design("弧席分巷露天瓦舍勾栏", "古装片场 水陆市井：围院中窄戏棚面对分段弧席，中央入场巷贯通席间，低台后侧开候场通口，与高台后台戏楼不同", openEntertainmentYard, "建筑", "中式"),
  design("错高三楼双飞桥酒楼", "古装片场 水陆市井：错高三座食楼经两座真实上层飞桥相连，左楼内梯穿真板孔、右楼外梯接台、后厅门正对桥口，桥下保留穿行庭院", flyingBridgeRestaurant, "建筑", "中式"),
  design("高岸分台河运货栈码头", "古装片场 水陆市井：穿仓货道接高岸卸货坪与低位石埠，架撑提货吊臂位于独立外挑装卸位，栈房和河岸人行路线相通", riverFreightHouse, "建筑", "中式"),
  design("槽墩悬闸跨渠值闸楼", "古装片场 水陆市井：双岸石墩夹出真水渠，提升木闸沿导槽悬起，跨渠检修板留绳闸槽，侧梯登上值房与卷扬操作桥", canalSluiceHouse, "建筑", "中式"),
  design("跨水巷骑楼双岸桥店", "古装片场 水陆市井：临河双岸店房上层由完整桥店跨水连接，下留通舟净空，楼内真梯孔接桥廊、临街售窗与穿岸入口分开", canalBridgeShop, "建筑", "中式"),
  design("前聘厅后绷架婚庆绣坊", "古装片场 水陆市井：聘礼前厅、侧试衣间与后绣房绕小院分置，落地绷架、绣面、挂衣架与裁衣案保持不同工作高度", weddingEmbroideryCourt, "建筑", "中式"),
  design("穿院分栏牲畜牙市", "古装片场 水陆市井：开口围栏分出四处待售畜栏与中心交易巷，后方签契小厅、验畜台和独立出栏口形成完整牲畜市院，不含牲畜", livestockBrokerYard, "建筑", "中式"),
  design("侧开长材后合棺寿木铺", "古装片场 水陆市井：前接待厅通后合棺场，侧长材棚与锯架、合棺支凳及敞口寿木真空腔组成独立长材加工路线", coffinJoineryShop, "建筑", "中式"),
  design("前龛后扎纸香烛祭品铺", "古装片场 水陆市井：侧入售香前龛接敞院扎纸高架，前柜分层香束、后纸扎骨架与隔开的晾纸墙可见，不重复浸烛挤香机构", ritualGoodsCourt, "建筑", "中式"),
  design("通门轮床车马修造院", "古装片场 水陆市井：宽车道穿过修造棚，侧置轮床夹轴架、车轮装配床与抬高车架检修位，工具间独立开门并避让车道", cartwrightRepairYard, "建筑", "中式"),
  design("低台挑棚村口社戏晒场", "古装片场 水陆市井：田村晒场的侧置低戏台接可拆挑棚和乐席，场坪浅沟绕开中央晒谷面，短阶、侧路及晒谷架构成开放社戏场所", villageFestivalDryingCourt, "建筑", "中式"),
];

function roofSet(name: string, width: number, depth: number, ceiling: number, x: number, z: number): ModelPart[] {
  return [tiledRoof(name, width, depth, ceiling, [x, z], tile), box("连通屋脊", x, ceiling + .27 + Math.min(width, depth) * .2, z, width > depth ? width + .8 : .16, .1, width > depth ? .16 : depth + .8, dark)];
}

function column(name: string, x: number, z: number, low: number, high: number): ModelPart[] {
  return [box("木柱石础", x, low + .08, z, .42, .16, .42, stone), box(name, x, (low + .12 + high) / 2, z, .22, high - low - .12, .22, wood)];
}

function table(name: string, x: number, y: number, z: number, width: number, depth: number): ModelPart {
  const b: SolidBox[] = [{ center: [x, y + .78, z], size: [width, .12, depth] }];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.push({ center: [x + sx * (width / 2 - .15), y + .36, z + sz * (depth / 2 - .13)], size: [.12, .72, .12] });
  return boxesMesh(name, wood, b);
}

function railLine(name: string, a: number, b: number, z: number, floor: number): ModelPart {
  const cubes: SolidBox[] = [{ center: [(a + b) / 2, floor + .95, z], size: [b - a, .1, .1] }, { center: [(a + b) / 2, floor + .3, z], size: [b - a, .08, .08] }];
  const count = Math.max(1, Math.ceil((b - a) / 1.6));
  for (let i = 0; i <= count; i++) cubes.push({ center: [a + (b - a) * i / count, floor + .47, z], size: [.09, .94, .09] });
  return boxesMesh(name, dark, cubes);
}

function celebrationGate(): ModelPart[] {
  const p: ModelPart[] = [box("欢门落地街坪", 1, .1, -.5, 16, .2, 11, stone), box("跨街登开彩楼板", 0, 3.5, 0, 11.8, .2, 2.8, wood), riseSteps("彩楼侧登梯", .2, 3.6, 14, .3, 1.4, [7.1, 0, -4.2]), box("梯顶接彩楼桥", 6.45, 3.5, .3, 2.6, .2, 1, wood)];
  for (const z of [-1.1, 1.1]) p.push(box("两道跨街复梁", 0, 3.21, z, 11.8, .38, .3, dark));
  for (const x of [-4.8, 4.8]) for (const z of [-1.1, 1.1]) p.push(...column("穿街彩楼大柱", x, z, .2, 6), beam("柱间抗侧斜撑", wood, [x, 2.2, z], [x + (x < 0 ? 1 : -1), 3.4, z], .16));
  p.push(...column("接桥落地柱", 7.3, .6, .2, 3.4), box("彩棚横额梁", 0, 5.91, -1.1, 10, .18, .3, red), ...roofSet("彩楼中棚", 5.2, 2.8, 6, 0, 0), ...roofSet("西彩棚", 3, 2.8, 5.7, -4.4, 0), ...roofSet("东彩棚", 3, 2.8, 5.7, 4.4, 0), railLine("前沿彩楼护栏", -5.8, 5.8, -1.3, 3.6), railLine("后沿彩楼护栏", -5.8, 5.8, 1.3, 3.6));
  for (const x of [-2.5, 2.5]) p.push(...column("中棚上层托柱", x, .95, 3.6, 6), box("檐下垂挂彩幡", x, 5.1, -1.24, .52, 1.6, .035, cloth));
  for (const x of [-5.3, -3.8, 3.8, 5.3]) p.push(box("门外长垂彩", x, 2.625, -1.31, .38, 1.55, .035, red));
  return p;
}

function openEntertainmentYard(): ModelPart[] {
  const p: ModelPart[] = [box("瓦舍整院坪", 0, .1, 0, 15, .2, 17, stone), openingWall("瓦舍前入场门", 14, 2.8, holesAt([0], 2.4, 2.5), [0, .2, -8], 0, plaster), openingWall("瓦舍后出场门", 14, 2.8, holesAt([4.5], 1.4, 2.5), [0, .2, 8], 0, plaster), box("低戏台", 0, .7, 4.6, 6, 1, 4.2, wood), openingWall("后台屏门", 6, 2.7, holesAt([-2, 2], 1, 2.4), [0, 1.2, 5.8], 0, wood), riseSteps("戏台侧短阶", .2, 1.2, 5, .3, 1.2, [3.7, 0, 3.1]), box("侧阶接台", 3.25, 1.1, 4.6, 1.3, .2, 1.2, wood)];
  for (const x of [-7, 7]) p.push(box("瓦舍侧围壁", x, 1.6, 0, .25, 2.8, 16, plaster));
  for (const x of [-2.8, 2.8]) for (const z of [2.7, 6.4]) p.push(...column("窄戏棚柱", x, z, 1.2, 4.5));
  p.push(box("戏棚额枋", 0, 4.4, 2.7, 5.8, .2, .26, dark), ...roofSet("勾栏窄棚", 6, 4.2, 4.5, 0, 4.6));
  for (let row = 0; row < 3; row++) for (const arc of [[-180, -103], [-77, 0]]) {
    const r = 4 + row * 1.05, outline: [number, number][] = [];
    for (let i = 0; i <= 6; i++) { const t = (arc[0]! + (arc[1]! - arc[0]!) * i / 6) * Math.PI / 180; outline.push([Math.cos(t) * r, 3 + Math.sin(t) * r]); }
    for (let i = 6; i >= 0; i--) { const t = (arc[0]! + (arc[1]! - arc[0]!) * i / 6) * Math.PI / 180; outline.push([Math.cos(t) * (r - .55), 3 + Math.sin(t) * (r - .55)]); }
    p.push(hardPlan("让开中央巷的弧形席台", wood, outline, .42 + row * .18, [0, .2, 0]));
  }
  p.push(table("入场收签案", -5.2, .2, -6.4, 1.6, .7));
  return p;
}

function flyingBridgeRestaurant(): ModelPart[] {
  const p: ModelPart[] = [box("三楼共院坪", 0, .1, 1, 20, .2, 18), hardPlan("西楼真梯孔板", wood, [[-8, -4], [-2, -4], [-2, 5], [-8, 5]], .2, [0, 3.2, 0], [[[-5.8, -3.25], [-4.2, -3.25], [-4.2, .14], [-5.8, .14]]]), box("东楼上层木板", 5, 3.3, 1.5, 5, .2, 7, wood), box("后厅上层木板", 0, 3.3, 7, 5, .2, 4, wood), riseSteps("西楼内梯", .2, 3.4, 12, .28, 1.4, [-5, 0, -3.2]), riseSteps("东楼外梯", .2, 3.4, 12, .28, 1.3, [8.5, 0, -3.36]), box("东梯接店平台", 8, 3.3, .3, 2.2, .2, .9, wood), box("后桥入厅短颈承枋", 0, 3.1, 4.9, 1.8, .2, 1.3, dark), box("后桥入厅短颈木板", 0, 3.3, 4.9, 1.8, .2, 1.3, wood)];
  for (const x of [-8, -2]) p.push(openingWall("西楼侧面桥门窗", 9, 6.2, [...holesAt([0], 1.6, 2.6), ...holesAt([1.5, -3.5], 1.3, 2.5, 3.235)], [x, .2, .5], 90, plaster));
  for (const z of [-4, 5]) p.push(openingWall("西楼前后双层门窗", 6, 6.2, [...holesAt([1.5], 1.3, 2.6), ...holesAt([-1.5, 1.5], 1.2, 1.4, 4.1)], [-5, .2, z], 0, plaster));
  for (const x of [2.5, 7.5]) p.push(openingWall("东楼接桥与外梯门", 7, 5.8, [...holesAt([0], 1.4, 2.6), ...holesAt(x < 5 ? [2.5, -2.5] : [1.2], 1.25, 2.3, 3.235)], [x, .2, 1.5], 90, plaster));
  for (const z of [-2, 5]) p.push(openingWall("东楼街窗", 5, 5.8, [...holesAt([0], 1.4, 2.6), ...holesAt([-1.4, 1.4], 1.1, 1.4, 3.9)], [5, .2, z], 0, plaster));
  p.push(openingWall("后厅下厨上雅座正门", 5, 6, [...holesAt([0], 1.8, 2.6), ...holesAt([0], 1.8, 2.4, 3.235)], [0, .2, 5], 0, plaster), openingWall("后厅背窗", 5, 6, [...holesAt([0], 1.4, 2.4), ...holesAt([-1.5, 1.5], 1.1, 1.4, 4.1)], [0, .2, 9], 0, plaster));
  for (const x of [-2.5, 2.5]) p.push(box("后厅侧承重壁", x, 3.2, 7, .22, 6, 4, plaster));
  p.push(...roofSet("西楼高屋盖", 6, 9, 6.4, -5, .5), ...roofSet("东楼低屋盖", 5, 7, 6, 5, 1.5), ...roofSet("后厅歇瓦盖", 5, 4, 6.2, 0, 7), ...column("外梯台柱", 8.7, .6, .2, 3.2));
  for (const z of [-1, 4]) {
    p.push(box("飞桥底承梁", .25, 3.1, z, 4.8, .2, 1.5, dark), box("飞桥步板", .25, 3.3, z, 4.8, .2, 1.5, wood), railLine("飞桥前栏", -2.1, 2.6, z - .68, 3.4));
    if (z < 0) p.push(railLine("前桥后栏", -2.1, 2.6, z + .68, 3.4));
  }
  p.push(railLine("后桥留颈西栏", -2.1, -.95, 4.68, 3.4), railLine("后桥留颈东栏", .95, 2.6, 4.68, 3.4));
  for (const x of [-.85, .85]) { const r = railLine("入厅短颈侧栏", -.6, .6, 0, 3.4); r.rotation.y = 90; r.position = { x, y: 0, z: 4.9 }; p.push(r); }
  for (const x of [-5.78, -4.22]) p.push(box("梯井侧护板", x, 3.88, -1.5, .07, .96, 3.3, dark));
  for (const x of [-7.7, -2.3]) for (const z of [-3.7, 4.7]) p.push(...column("西楼通檐柱", x, z, .2, 6.4));
  for (const x of [2.8, 7.2]) for (const z of [-1.7, 4.7]) p.push(...column("东楼通檐柱", x, z, .2, 6));
  for (const [x, z, y] of [[-6.7, 2.7, .2], [-6.7, 2.7, 3.4], [4.8, 3.2, .2], [4.8, 3.2, 3.4], [0, 7.8, 3.4]]) p.push(table("临窗食案", x!, y!, z!, 1.6, 1));
  return p;
}

function riverFreightHouse(): ModelPart[] {
  const p: ModelPart[] = [box("栈岸高基", 0, .65, 4, 16, 1.3, 10, stone), box("临水穿仓高台", 0, 1.4, 4, 9, .2, 7, wood), openingWall("河栈前出货大门", 9, 3.6, holesAt([0], 3, 3.1), [0, 1.5, .5], 0, plaster), openingWall("河栈后入货门", 9, 3.6, holesAt([0], 3, 3.1), [0, 1.5, 7.5], 0, plaster), ...roofSet("河栈灰瓦盖", 9, 7, 5.1, 0, 4)];
  for (const side of [-1, 1]) {
    p.push(openingWall("河栈高窗侧墙", 7, 3.6, holesAt([-2, 2], 1.1, .8, 2.2), [side * 4.5, 1.5, 4], 90, plaster), box("低位石埠", side * 5.6, .35, -2.7, 3.4, .7, 5), riseSteps("低埠登卸货岸阶", .7, 1.3, 4, .3, 1.5, [side * 5.6, 0, -1.8]));
    for (const z of [1, 4, 7]) p.push(...column("栈内承顶木柱", side * 4.2, z, 1.5, 5.1));
    p.push(box("仓内垫货长枕", side * 2.8, 1.65, 4.2, 1.8, .3, 4.3, dark), box("垫枕货箱", side * 2.8, 2.3, 4.2, 1.6, 1, 4, wood), cylinder("石埠系缆柱", side * 6.6, 1, -3.8, .3, .6, dark));
  }
  p.push(...column("提货架岸上主柱", -5.6, -.5, 1.3, 4.8), beam("伸水提货臂", dark, [-5.6, 4.5, -.5], [-5.6, 4.5, -4.8], .25), beam("提货臂下斜撑", wood, [-5.6, 2.5, -.5], [-5.6, 4.5, -3.8], .18), cylinder("吊货绳", -5.6, 3.1, -4.7, .04, 2.8, dark), part("货钩", "torus", dark, [-5.6, 1.6, -4.7], [.26, .3, .045]), table("收货验单案", 6, 1.3, 5.7, 2, 1));
  return p;
}

function canalSluiceHouse(): ModelPart[] {
  const p: ModelPart[] = [box("渠底石床", 0, .08, 0, 5, .16, 12, stone), box("闸下静水", 0, .22, 0, 4.8, .025, 12, water), box("悬起木闸", 0, 2.4, 0, 4.6, 2.4, .2, wood), hardPlan("跨渠桥板留真闸槽", wood, [[-5.8, -1.6], [5.8, -1.6], [5.8, 1.6], [-5.8, 1.6]], .2, [0, 4.2, 0], [[[-2.4, -.18], [2.4, -.18], [2.4, .18], [-2.4, .18]]]), box("值房高位楼板", 4.1, 4.3, 1.5, 3.4, .2, 4.2, wood), riseSteps("岸墩登值闸楼梯", 1.4, 4.4, 14, .3, 1.3, [4.3, 0, -5]), openingWall("值闸房前门", 3, 2.8, holesAt([0], 1.2, 2.4), [4.1, 4.4, -.5], 0, plaster), openingWall("值闸房后窗", 3, 2.8, holesAt([0], 1.2, 1, 1.1), [4.1, 4.4, 3.5], 0, plaster), ...roofSet("值房瓦盖", 3, 4, 7.2, 4.1, 1.5)];
  for (const side of [-1, 1]) {
    p.push(box("渠岸石墩", side * 4.2, .7, 0, 3.4, 1.4, 12, stone), box("悬闸导槽柱", side * 2.65, 2.7, 0, .3, 5, .8, stone), ...column("卷扬架托梁柱", side * 2.65, 0, 4.4, 6.4));
    for (const z of [-.22, .22]) p.push(box("导槽木唇", side * 2.4, 2.7, z, .3, 5, .14, dark));
    p.push(cylinder("闸板提升索", side * 1.6, 4.65, 0, .035, 2.1, dark), box("值房侧壁", 4.1 + side * 1.5, 5.8, 1.5, .2, 2.8, 4, plaster));
    for (const z of [-.2, 3.2]) p.push(...column("值房下架空柱", 4.1 + side * 1.3, z, 1.4, 4.2));
  }
  p.push(box("跨渠卷扬横梁", 0, 6.3, 0, 5.8, .2, .3, dark), cylinder("提升绳卷轴", 0, 5.7, 0, .3, 5.6, wood, [0, 0, 90]), railLine("闸桥前护栏", -5.7, 3.5, -1.55, 4.4), railLine("闸桥后护栏", -5.7, 2.4, 1.55, 4.4));
  return p;
}

function canalBridgeShop(): ModelPart[] {
  const p: ModelPart[] = [box("水巷槽底", 0, .08, 0, 4, .16, 11, stone), box("巷水", 0, .22, 0, 3.9, .025, 11, water), box("跨巷整承梁", 0, 3.3, 0, 4.4, .2, 3, dark), hardPlan("桥店与岸店连板实留梯孔", wood, [[-7, -3.5], [-2, -3.5], [-2, -1.5], [2, -1.5], [2, -3.5], [7, -3.5], [7, 3.5], [2, 3.5], [2, 1.5], [-2, 1.5], [-2, 3.5], [-7, 3.5]], .2, [0, 3.4, 0], [[[3.75, -3.45], [5.25, -3.45], [5.25, -.35], [3.75, -.35]]]), riseSteps("岸店内部登桥梯", 1.2, 3.6, 10, .32, 1.3, [4.5, 0, -3.5])];
  for (const side of [-1, 1]) {
    const x = side * 4.5;
    p.push(box("水巷两岸砌石店基", x, .6, 0, 5, 1.2, 8), riseSteps("岸店临街接岸短阶", 0, 1.2, 6, .3, 1.4, [x, 0, -5.8]), openingWall("岸店临街双层门窗", 5, 5.2, [...holesAt([0], 1.6, 2), ...holesAt([-1.4, 1.4], 1.1, 1.3, 3.4)], [x, 1.2, -3.5], 0, plaster), openingWall("岸店后水巷门窗", 5, 5.2, [...holesAt([0], 1.5, 2), ...holesAt([-1.4, 1.4], 1.1, 1.3, 3.4)], [x, 1.2, 3.5], 0, plaster), box("岸店外墙", side * 7, 3.8, 0, .24, 5.2, 7, plaster), openingWall("岸店通桥内墙", 7, 5.2, [...holesAt([0], 1.6, 2, 2.435), ...holesAt([-2.6, 2.6], .9, 1.1, .9)], [side * 2, 1.2, 0], 90, plaster), ...roofSet("岸店瓦盖", 5, 7, 6.4, x, 0));
    for (const z of [-3.3, 3.3]) p.push(...column("岸店木架柱", side * 6.7, z, 1.2, 6.4));
  }
  for (const z of [-1.5, 1.5]) p.push(openingWall("桥店临水售窗", 4.4, 2.6, holesAt([-1.45, 0, 1.45], .85, 1.4, .8), [0, 3.6, z], 0, plaster));
  p.push(...roofSet("跨水桥店横瓦盖", 4.4, 3, 6.2, 0, 0), table("西岸货案", -4.8, 1.2, .6, 2.1, 1), table("桥上验货矮案", 0, 3.6, .7, 1.6, .6));
  for (const x of [3.73, 5.27]) p.push(box("桥店梯井边护板", x, 4.08, -1.9, .07, .96, 3.1, dark));
  return p;
}

function weddingEmbroideryCourt(): ModelPart[] {
  const p: ModelPart[] = [box("绣坊内外院坪", 0, .1, 0, 14.6, .2, 13, stone), openingWall("聘厅前双门", 6, 3.2, holesAt([1.6], 1.3, 2.7), [-3, .2, -5.7], 0, plaster), openingWall("聘厅后向院门", 6, 3.2, holesAt([1.6], 1.3, 2.7), [-3, .2, -1.7], 0, plaster), box("聘厅西壁", -6, 1.8, -3.7, .2, 3.2, 4, plaster), box("聘厅东壁", 0, 1.8, -3.7, .2, 3.2, 4, plaster), ...roofSet("聘厅小瓦顶", 6, 4, 3.4, -3, -3.7), openingWall("后绣房开敞窗门", 12, 3.8, [...holesAt([0], 1.8, 2.8), ...holesAt([-3.7, 3.7], 2.3, 1.8, .8)], [0, .2, 1.3], 0, plaster), openingWall("绣房后窗", 12, 3.8, holesAt([-3.7, 0, 3.7], 1.8, 1.5, 1.2), [0, .2, 5.3], 0, plaster), ...roofSet("长绣房瓦顶", 12, 4, 4, 0, 3.3)];
  for (const x of [-6, 6]) p.push(box("绣房端壁", x, 2.1, 3.3, .2, 3.8, 4, plaster));
  p.push(openingWall("试衣小间院门", 5.8, 3.2, holesAt([0], 1.2, 2.6), [5, .2, -1.7], 90, plaster), box("试衣外壁", 7, 1.8, -1.7, .2, 3.2, 5.8, plaster), box("试衣前屏", 6, 1.8, -4.6, 2, 3.2, .2, plaster), ...roofSet("侧试衣间瓦顶", 2, 5.8, 3.4, 6, -1.7), table("聘礼礼案", -3.5, .2, -3.7, 2.4, 1.1), table("绣房裁衣案", 0, .2, 4.2, 2.4, 1.2));
  p.push(box("试衣后屏", 6, 1.8, 1.2, 2, 3.2, .2, plaster));
  for (const x of [-3.5, 3.5]) {
    p.push(ring("绣绷木圈", wood, .85, .055, 1.12, .09, { position: { x, y: 1.12, z: 3 } }), cylinder("绷紧绣面", x, 1.1, 3, 1.59, .025, cloth));
    for (const side of [-1, 1]) p.push(beam("绷架交叉斜足", dark, [x + side * .7, .2, 2.5], [x - side * .6, 1.1, 3.5], .09), beam("绷架反向斜足", dark, [x + side * .7, .2, 3.5], [x - side * .6, 1.1, 2.5], .09), beam("绷架横托", wood, [x - .7, 1.04, 3 + side * .42], [x + .7, 1.04, 3 + side * .42], .08));
  }
  for (const x of [5.5, 6.5]) p.push(...column("挂衣架立柱", x, -2, .2, 2.3));
  p.push(box("喜服挂杆", 6, 2.25, -2, 1.2, .1, .1, dark), box("展示婚服", 6, 1.65, -2, .65, 1.1, .12, red));
  return p;
}

function livestockBrokerYard(): ModelPart[] {
  const p: ModelPart[] = [box("牙市共同场坪", 0, .075, 0, 21, .15, 22, stone), openingWall("牙市前分流门", 20, 2.5, holesAt([-5, 0, 5], 2, 2.35), [0, .15, -10], 0, plaster), openingWall("牙行签契厅前门", 8, 3.2, holesAt([0], 2, 2.6), [0, .15, 6], 0, plaster), openingWall("牙行签契厅后门", 8, 3.2, holesAt([0], 1.4, 2.6), [0, .15, 10], 0, plaster), ...roofSet("签契厅瓦盖", 8, 4, 3.35, 0, 8)];
  for (const x of [-4, 4]) p.push(box("签契厅端壁", x, 1.75, 8, .22, 3.2, 4, plaster));
  for (const x of [-5.5, 5.5]) for (const z of [-4, 3]) {
    p.push(railLine("畜栏后栏", x - 2.6, x + 2.6, z + 2.6, .15), railLine("畜栏门左段", x - 2.6, x - 1, z - 2.6, .15), railLine("畜栏门右段", x + 1, x + 2.6, z - 2.6, .15));
    for (const side of [-1, 1]) {
      const b = railLine("畜栏侧栏", -2.6, 2.6, 0, .15); b.rotation.y = 90; b.position = { x: x + side * 2.6, y: 0, z }; p.push(b);
      p.push(box("畜栏饮水槽长边", x + side * 2.15, .43, z + 1.4, .1, .56, 1.4, wood));
    }
    p.push(box("饮槽底", x, .22, z + 1.4, 4.2, .14, 1.4, wood));
    for (const side of [-1, 1]) p.push(box("饮槽端壁", x, .43, z + 1.4 + side * .65, 4.2, .56, .1, wood));
    p.push(box("饮槽水面", x, .54, z + 1.4, 4.08, .025, 1.15, water));
  }
  p.push(box("前侧验畜低台", 5.5, .3, -8.1, 4.6, .3, 1.5, wood), riseSteps("验畜台接阶", .15, .45, 2, .3, 1.5, [5.5, 0, -9.45]), table("后厅签契案", 0, .15, 8.6, 2.8, 1.1));
  return p;
}

function coffinJoineryShop(): ModelPart[] {
  const p: ModelPart[] = [box("寿木铺院坪", 0, .1, 0, 14.6, .2, 15, stone), openingWall("接待前厅街门", 7, 3.2, holesAt([-1.9], 1.5, 2.6), [-2, .2, -6.5], 0, plaster), openingWall("接待厅后门", 7, 3.2, holesAt([-1.9], 1.5, 2.6), [-2, .2, -2], 0, plaster), box("前厅西壁", -5.5, 1.8, -4.25, .22, 3.2, 4.5, plaster), box("前厅东壁", 1.5, 1.8, -4.25, .22, 3.2, 4.5, plaster), ...roofSet("接待厅瓦顶", 7, 4.5, 3.4, -2, -4.25), box("后合棺棚背墙", -.5, 2.1, 6.5, 11, 3.8, .24, plaster), ...roofSet("后合棺棚", 11, 5, 4, -.5, 4), ...roofSet("侧长材棚", 3, 11, 3.6, 5.5, 0)];
  for (const x of [-5.5, -.5, 4.5]) p.push(...column("合棺棚前柱", x, 1.6, .2, 4));
  for (const x of [4.2, 6.8]) for (const z of [-5.2, 0, 5.2]) p.push(...column("长材棚架柱", x, z, .2, 3.6));
  for (const z of [-3, 3]) p.push(box("长料落地垫枕", 5.5, .3, z, 2.2, .2, .35, dark));
  for (let i = 0; i < 4; i++) p.push(box("侧棚长寿木料", 5.5, .4 + i * .18, 0, 1.9, .18, 8.6, wood));
  for (const x of [-3, 1]) {
    for (const z of [2.7, 5.3]) p.push(table("合棺抬架", x, .2, z, 1.6, .5));
    p.push(hardPlan("寿木实留内腔", dark, [[x - .7, 2.4], [x + .7, 2.4], [x + .85, 5.7], [x - .85, 5.7]], .7, [0, 1.04, 0], [[[x - .52, 2.6], [x + .52, 2.6], [x + .64, 5.5], [x - .64, 5.5]]]), box("棺底木板", x, 1.08, 4.05, 1.35, .08, 3.2, wood), box("侧放棺盖", x, .28, .4, 1.7, .16, 3.3, wood));
  }
  p.push(table("前厅议价案", -.7, .2, -4.2, 1.8, 1));
  return p;
}

function ritualGoodsCourt(): ModelPart[] {
  const p: ModelPart[] = [box("祭品铺前后院坪", 0, .1, 0, 12.6, .2, 14.2, stone), openingWall("祭品铺前门售窗", 9, 3.4, [...holesAt([2.8], 1.3, 2.8), ...holesAt([-1.4], 3.5, 1.35, 1)], [-.8, .2, -6], 0, plaster), openingWall("祭品铺后入扎纸院门", 9, 3.4, holesAt([2.8], 1.3, 2.8), [-.8, .2, -1.5], 0, plaster), box("前铺西壁", -5.3, 1.9, -3.75, .22, 3.4, 4.5, plaster), box("前铺东壁", 3.7, 1.9, -3.75, .22, 3.4, 4.5, plaster), ...roofSet("前香铺瓦顶", 9, 4.5, 3.6, -.8, -3.75), box("后扎纸棚背壁", -.8, 2.1, 6, 9, 3.8, .22, plaster), ...roofSet("后扎纸高棚", 9, 4, 4, -.8, 4), table("前香烛柜", -2.2, .2, -5.2, 3.8, .8), table("扎纸长案", -2.7, .2, 4.5, 2.5, 1.2)];
  for (const x of [-5, 3.4]) for (const z of [2.2, 5.8]) p.push(...column("扎纸棚柱", x, z, .2, 4));
  p.push(box("祭品陈列神龛底座", -3.9, .6, -3.1, 1.6, .8, 1), box("神龛背屏", -3.9, 1.7, -2.7, 1.6, 1.4, .12, red), ...roofSet("前龛小檐", 1.6, 1, 2.4, -3.9, -3.1));
  for (const side of [-1, 1]) p.push(box("神龛立边", -3.9 + side * .74, 1.7, -3.1, .12, 1.4, .8, wood));
  for (let i = 0; i < 6; i++) p.push(cylinder("前柜成束香", -3.7 + i * .55, 1.3, -5.2, .12, .55, dark));
  for (const z of [2.8, 4.8]) {
    for (const x of [.3, 2.5]) p.push(box("纸扎屋架立杆", x, 1.4, z, .06, 2.4, .06, wood));
    p.push(beam("纸扎屋脊横杆", wood, [.3, 2.6, z], [2.5, 2.6, z], .06));
  }
  p.push(box("纸扎骨架平顶", 1.4, 2.6, 3.8, 2.2, .06, 2, wood), box("扎纸彩侧片", .3, 1.7, 3.8, .025, 1.8, 2, cloth), box("后院独立晾纸墙", 5, 1.5, 3.8, .15, 2.6, 4.4, plaster));
  for (const z of [2.5, 3.8, 5.1]) p.push(box("墙上晾纸", 4.919, 1.6, z, .025, 1.6, .85, cloth));
  return p;
}

function cartwrightRepairYard(): ModelPart[] {
  const p: ModelPart[] = [box("车马修造院坪", 0, .1, 0, 18, .2, 18), openingWall("修造棚前宽车门", 12, 4, holesAt([0], 4, 3.6), [-1, .2, -4], 0, plaster), openingWall("修造棚后宽车门", 12, 4, holesAt([0], 4, 3.6), [-1, .2, 7], 0, plaster), box("修造棚左壁", -7, 2.2, 1.5, .22, 4, 11, plaster), ...roofSet("修造通车高棚", 12, 11, 4.2, -1, 1.5), openingWall("工具间院门", 5, 3, holesAt([0], 1.3, 2.6), [7, .2, 1.5], 90, plaster), box("工具间外壁", 8.8, 1.7, 1.5, .2, 3, 5, plaster), box("工具间后壁", 7.9, 1.7, 4, 1.8, 3, .22, plaster), box("工具间前壁", 7.9, 1.7, -1, 1.8, 3, .22, plaster), ...roofSet("工具间低瓦盖", 1.8, 5, 3.2, 7.9, 1.5)];
  for (const z of [-3.7, 1.5, 6.7]) p.push(...column("通车棚右敞柱", 4.7, z, .2, 4.2));
  for (const z of [0, 4.8]) p.push(table("车架抬升枕床", -4.6, .2, z, 3.1, .75));
  p.push(box("待修车纵架", -4.6, 1.1, 2.4, 2.8, .14, 5.8, wood));
  for (const x of [-5.6, -3.6]) p.push(box("车架纵梁", x, 1.27, 2.4, .18, .2, 5.8, dark));
  p.push(table("轮床实接案", 2.6, .2, 3.5, 2.8, 1.8), cylinder("轮床中定位轴", 2.6, 1.2, 3.5, .15, .6, dark), ring("平放装配轮圈", wood, 1.15, .12, 1.12, .16, { position: { x: 2.6, y: 1.12, z: 3.5 } }));
  for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; p.push(beam("装配轮辐", wood, [2.6, 1.12, 3.5], [2.6 + Math.cos(t) * 1.08, 1.12, 3.5 + Math.sin(t) * 1.08], .065)); }
  for (const x of [1.8, 3.5]) p.push(box("夹轴架足", x, .3, -.8, .7, .2, 1.3, dark), box("夹轴架柱", x, 1, -.8, .18, 1.2, .18, wood));
  p.push(cylinder("待修长车轴", 2.65, 1.6, -.8, .18, 3.4, wood, [0, 0, 90]), table("工具案", 8, .2, 2, 1.3, 1.5));
  return p;
}

function villageFestivalDryingCourt(): ModelPart[] {
  const p: ModelPart[] = [hardPlan("晒场绕边沟留出口", stone, [[-10, -10], [10, -10], [10, 10], [-10, 10]], .16, [0, 0, 0], [[[-8.3, -8.3], [8.3, -8.3], [8.3, 8.3], [7.9, 8.3], [7.9, -7.9], [-8.3, -7.9]]]), box("晒谷主坪", 0, .21, -.3, 14.8, .1, 14.6, "#bcaf8f"), box("侧置社戏低台", -6.1, .51, 4.2, 5.2, .7, 5.2, wood), riseSteps("社戏台村路短阶", .16, .86, 4, .3, 1.3, [-2.9, 0, 2]), box("台侧接阶小板", -3.4, .76, 3.2, 1.4, .2, 1.3, wood), box("低台后素屏", -6.1, 1.96, 6.4, 5, 2.2, .1, cloth)];
  for (const x of [-8.4, -3.8]) {
    p.push(...column("可拆挑棚后架", x, 6.2, .86, 4), beam("后架向台前挑棚杆", wood, [x, 3.85, 6.2], [x, 3.2, 1.6], .12), beam("挑棚下撑杆", wood, [x, 2.2, 6.2], [x, 3.55, 4.1], .1));
  }
  p.push(part("薄布斜挑棚", "box", cloth, [-6.1, 3.52, 3.9], [5.2, .045, 4.65], [-8.04, 0, 0]), box("后屏接柱顶枋", -6.1, 3.05, 6.2, 5, .15, .34, dark), table("侧边乐席案", -6.1, .86, 5.6, 2.6, .7), table("村会告示案", 5.6, .16, 6.8, 2.8, 1), box("村路歇脚石凳", 6, .41, -6.7, 4, .5, .7, stone));
  for (const z of [-4.2, -.8, 2.6]) {
    for (const x of [5.8, 7.3]) p.push(box("晒谷架立足", x, .76, z, .12, 1.2, .12, wood));
    p.push(box("晒谷架竹面", 6.55, 1.37, z, 1.7, .08, 2, cloth), box("竹面摊谷", 6.55, 1.425, z, 1.5, .03, 1.8, "#c8b37b"));
  }
  return p;
}
