import { part, type ModelPart } from "../assetModelParts";
import { base, box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { polygon } from "../masterNature/shared";
import { verticalPanel } from "./historicSpaceBatchNine";
import { stairFlight } from "./historicSpaceBatchSeven";
import { rectangularFlue } from "./spatialShells";
import { tiledRoof, openingWall, holesAt, postSet } from "./periodPublicSpaceBatchOne";

const stone = "#aaa997", plaster = "#bfb59d", wood = "#896d50", brick = "#b18b76", tiles = "#66766b", iron = "#64716c";

export const periodPublicSpaceBatchFourDesigns: ArchitecturePrototype[] = [
  design("前更衣双池后炉浴堂", "前更衣横厅接到并列长浴室，抬高的完整地坪真实挖空两座浴池，后方服务短阶接独立炉房，侧接烟道穿过真实开孔后通向敞口高烟囱", twinPoolBathhouse, "建筑", "中式"),
  design("前编辑楼后高窗印报馆", "前方两层营业编辑楼有真实室内登阶和门道，中轴低雨廊接到后方高印刷厅，中央高窗脊与两侧低斜瓦面分别接承，前后大门保留搬运通路", newspaperPrintOffice, "建筑", "中式"),
];

function twinPoolBathhouse(): ModelPart[] {
  const p: ModelPart[] = [base(40, 56), box("浴堂、服务短阶和炉房共用的外侧石铺地坪", 0, .3, 2, 38, .24, 48, stone), polygon("抬高浴堂整坪真实挖空两个长浴池", stone, [[-12, -15], [12, -15], [12, 12], [-12, 12]], 1, [0, .42, 0], [[[-9, 1], [-3, 1], [-3, 9], [-9, 9]], [[3, 1], [9, 1], [9, 9], [3, 9]]]), openingWall("浴堂前更衣厅的真正入口和侧窗", 24, 3.4, [...holesAt([0], 3, 2.8), ...holesAt([-8, 8], 2, 1.2, 1.3)], [0, 1.42, -15]), openingWall("更衣厅分流到两侧长浴室的双门与真实高窗", 24, 4.6, [...holesAt([-6, 6], 1.7, 2.8), ...holesAt([-6, 6], 2, .6, 3.9)], [0, 1.42, -7]), tiledRoof("完整遮护前更衣横厅的低灰瓦屋盖", 24, 8, 4.82, [0, -11]), tiledRoof("两间并列长浴室共有的完整高瓦整盖", 24, 19, 6.02, [0, 2.5]), box("并列两浴室之间真正从地坪接到高屋盖的隔壁", 0, 3.72, 2.5, .3, 4.6, 19, plaster), openingWall("浴池后部真实连通服务后场的两路旁门", 24, 4.6, [...holesAt([-10, 10], 1.3, 2.7), ...holesAt([-6, 6], 2, 1.2, 2.8)], [0, 1.42, 12]), stairFlight("院外真正接到更衣厅抬高地面的宽石阶", 5, 6, 1, .3, 0, [0, .42, -16.5], -90), postSet("浴室池侧通道真正承托完整高屋盖的木柱", [-10.5, -1.5, 1.5, 10.5].flatMap(x => [[x, -3], [x, 10.5]] as [number, number][]), 4.6, 1.42)];
  for (const s of [-1, 1]) {
    p.push(openingWall("前更衣厅完整透光的两端侧墙", 8, 3.4, holesAt([0], 2, 1.2, 1.3), [s * 12, 1.42, -11], 90), openingWall("浴室两侧真实穿透的高位采光窗墙", 19, 4.6, holesAt([-6, 0, 6], 2.2, 1.3, 2.8), [s * 12, 1.42, 2.5], 90), box("真空池腔内部低于浴堂地面的独立石池底", s * 6, .47, 5, 6, .1, 8, stone), box("两座浴池内低于池岸的真实静水面", s * 6, 1.1, 5, 5.9, .035, 7.9, "#83a9ad"), stairFlight("浴室后门从抬高浴坪真正下到服务后场的石阶", 5, 1.2, 1, .3, 0, [s * 10, .42, 13.5], 90), box("更衣厅两端实际落地的宽木更衣台", s * 8, 1.67, -11, 4, .5, 1.5, wood));
  }
  p.push(openingWall("独立后炉房面向服务后场的真正工作门", 8, 3.4, holesAt([0], 1.4, 2.6), [-8, .42, 14.5], 0, brick), openingWall("后炉房背壁真正穿通外接烟道的低孔", 8, 3.4, holesAt([0], .7, .7, .53), [-8, .42, 21.5], 0, brick), tiledRoof("独立后炉房完整低灰瓦屋盖", 8, 7, 3.82, [-8, 18]), openingWall("炉膛前部真正让出添煤口的耐火砖面", 3, 1.9, holesAt([0], 1.4, 1.3), [-8, .42, 18.5], 0, brick), box("炉膛上方真正封合但保留内腔的耐火顶板", -8, 2.42, 20, 3, .2, 3, brick));
  for (const s of [-1, 1]) p.push(box("后炉房两端真正接承低屋盖的完整侧壁", -8 + s * 4, 2.12, 18, .3, 3.4, 7, brick), box("炉膛两侧真正围合燃烧空腔的厚砖侧衬", -8 + s * 1.5, 1.37, 20, .3, 1.9, 3, brick), box("外接烟囱两侧从地面接到敞口的连续厚壁", -8 + s * .6, 4.42, 22.5, .3, 8, 1.2, brick));
  const duct = rectangularFlue("炉房后孔通入烟囱真侧孔的中空水平烟道", .7, .7, 1, .12, [-8, 1.3, 21.5], brick); duct.rotation.x = 90;
  p.push(duct, openingWall("外接烟囱正面与炉房烟道对齐的真实侧接孔", 1.2, 8, holesAt([0], .7, .7, .53), [-8, .42, 21.9], 0, brick), box("外接烟囱后面真正接地的完整厚壁", -8, 4.42, 23.1, 1.2, 8, .3, brick));
  return p;
}

function newspaperPrintOffice(): ModelPart[] {
  const p: ModelPart[] = [base(42, 60), box("前营业编辑楼、连接雨廊和印刷厅共用的石铺地面", 0, .3, 0, 40, .24, 58, stone), openingWall("报馆前营业楼实际开通的三路门和上层窗", 28, 6.8, [...holesAt([-9, 0, 9], 1.8, 2.8), ...holesAt([-10.5, -3.5, 3.5, 10.5], 2, 1.6, 4.5)], [0, .42, -19], 0, brick), openingWall("编辑楼背后真正通向印刷厅雨廊的门与分层窗", 28, 6.8, [...holesAt([0], 2, 2.8), ...holesAt([-10, 10], 2, 1.6, 1.1), ...holesAt([-10.5, -3.5, 3.5, 10.5], 2, 1.6, 4.5)], [0, .42, -11], 0, brick), tiledRoof("报馆营业编辑楼完整低跨灰瓦屋盖", 28, 8, 7.22, [0, -15]), polygon("编辑楼上层实际让出侧向登阶孔的木楼板", wood, [[-14, -19], [14, -19], [14, -11], [-14, -11]], .25, [0, 3.57, 0], [[[-11.85, -18], [-10.15, -18], [-10.15, -12], [-11.85, -12]]]), stairFlight("营业楼内真实穿楼板并接到上层编辑室的木阶", 20, 1.4, 3.4, .3, 0, [-11, .42, -18], -90, true), tiledRoof("前编辑楼与后印刷厅之间的敞开低雨廊", 4, 4, 3.82, [0, -9]), postSet("短雨廊两侧真正由地面接到屋盖的承重柱", [-10.5, -7.5].flatMap(z => [[-2, z], [2, z]] as [number, number][]), 3.4), box("前营业厅内让开中轴搬运路径的低木柜", 3, 1.02, -16, 2, 1.2, .8, wood)];
  for (const s of [-1, 1]) p.push(openingWall("营业编辑楼两端真正穿透的双层砖窗", 8, 6.8, [1.1, 4.5].flatMap(y => holesAt([-2, 2], 1.5, 1.6, y)), [s * 14, .42, -15], 90, brick), openingWall("营业编辑楼两侧独立办公室上下真实通行门", 8, 6.8, [...holesAt([0], 1.2, 2.5), ...holesAt([0], 1.2, 2.5, 3.435)], [s * 5, .42, -15], 90, plaster));
  for (const x of [-11.85, -10.15]) p.push(box("编辑楼上层真实登阶孔两边的连续木护栏", x, 4.32, -15, .08, 1, 6, wood));
  p.push(box("编辑楼上层阶孔低端的完整木护栏", -11, 4.32, -18, 1.7, 1, .08, wood));
  const end: [number, number][] = [[-10, 0], [10, 0], [10, 4.08], [3, 6.38], [3, 6.98], [-3, 6.98], [-3, 6.38], [-10, 4.08]];
  for (const z of [-7, 13]) p.push(verticalPanel("印刷厅真正封合高窗脊与低斜屋面的完整异形端墙", end, [...holesAt([0], 4.4, 3.2), ...holesAt([-6.5, 6.5], 2, 1.4, 1.4)], .3, [0, .42, z], 0, brick));
  for (const s of [-1, 1]) {
    const roof = box("印刷厅由高脊向外围承墙下降的独立长斜瓦面", s * 6.5, 5.735, 3, Math.hypot(7, 2.3), .18, 20.8, tiles); roof.rotation.z = -s * Math.atan2(2.3, 7) * 180 / Math.PI;
    p.push(roof, openingWall("印刷厅两侧真正承接低斜瓦面的通高窗墙", 20, 4.08, holesAt([-7, 0, 7], 2.4, 1.6, 1.4), [s * 10, .42, 3], 90, brick), part("中央高脊实际高出低斜瓦面的连续透明侧窗", "box", "#a8bdba", [s * 3, 7.185, 3], [.06, .43, 20], [0, 0, 0], { opacity: .3 }));
  }
  p.push(tiledRoof("印刷厅高侧窗上方真正封合的窄跨脊顶", 6, 20, 7.4, [0, 3]), postSet("印刷厅内真正接承高窗脊顶的双列全高木柱", [-7, 3, 13].flatMap(z => [[-3, z], [3, z]] as [number, number][]), 6.98));
  for (const x of [-6.5, 6.5]) {
    p.push(box("印刷长厅内独立落地的压印设备基座", x, .62, 3, 3.8, .4, 5, iron), postSet("长厅压印设备由基座实际接承顶梁的双柱", [[x - 1.5, 3], [x + 1.5, 3]], 2.7, .82), box("压印设备两侧立柱上实际接承的厚横梁", x, 3.67, 3, 3.8, .3, .4, iron), box("压印柱间真正连续的承纸滑床", x, 1.22, 3, 3.3, .2, 4.2, wood), cylinder("印报设备横跨滑床的真实压印滚筒", x, 1.72, 3, .8, 3.2, iron, [0, 0, 90]));
  }
  return p;
}
