import { part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, rail, colors } from "./structures";
import { halfRoundWall } from "./spatialShells";
import { polygon } from "../masterNature/shared";
import { stairFlight } from "./publicSpaceBatchSteps";

const wallColor = "#b8b7aa", dark = "#4a5d61", floorColor = "#b2a48e";

export function doorway(name: string, position: Triple, width: number, height: number, opening = 1.8, yaw = 0, doorHeight = 2.4): ModelPart {
  return part(name, "extrude", wallColor, position, [1, 1, 1], [0, yaw, 0], {
    depth: .24,
    profile: [{ x: -width / 2, y: 0 }, { x: -opening / 2, y: 0 }, { x: -opening / 2, y: doorHeight }, { x: opening / 2, y: doorHeight }, { x: opening / 2, y: 0 }, { x: width / 2, y: 0 }, { x: width / 2, y: height }, { x: -width / 2, y: height }],
  });
}

export function windowBand(name: string, x: number, z: number, length: number, height: number, yaw = 0): ModelPart[] {
  const pieces = [box(`${name}窗下连续墙`, 0, .73, 0, length, 1.1, .24, wallColor), box(`${name}窗上连续墙`, 0, height - .22, 0, length, .8, .24, wallColor)];
  for (const offset of [-length / 2 + .12, 0, length / 2 - .12]) pieces.push(box(`${name}承重窗间墩`, offset, height / 2 + .18, 0, .24, height, .3, wallColor));
  pieces.push(part(`${name}透明窗带`, "box", colors.glass, [0, (height + .66) / 2, 0], [length - .4, height - 1.9, .035], [0, 0, 0], { opacity: .24, roughness: .15 }));
  const angle = yaw * Math.PI / 180;
  return pieces.map(value => ({ ...value, position: { x: x + value.position.x * Math.cos(angle), y: value.position.y, z: z - value.position.x * Math.sin(angle) }, rotation: { ...value.rotation, y: yaw } }));
}

export function standingPanel(name: string, color: string, outline: [number, number][], holes: [number, number][][], z: number, thickness: number): ModelPart {
  const panel = polygon(name, color, outline, thickness, [0, 0, 0], holes), points = panel.vertices!;
  // 原平面绕X轴正转九十度到立面，保持三角形绕序；盖面和洞边分顶点，保留硬边。
  panel.vertices = panel.indices!.map(index => ({ x: points[index]!.x, y: points[index]!.z, z: z - points[index]!.y + thickness / 2 }));
  delete panel.indices;
  return panel;
}

export const publicSpaceBatchOneDesigns = [
  design("阶梯后投影室内电影院", "逐级抬高的观众地坪与后置独立放映室形成纵向视线；高位投影窗真实穿墙，前端银幕和两侧疏散口分开", cinema, "建筑", "现代"),
  design("双室浮筑录音棚", "独立弹性支点上的录音室地板与控制室隔开，中部观察窗连接两个工作区，折转声闸提供独立进出通道", recordingStudio, "建筑", "现代"),
  design("锯齿北向天窗绘画教室", "连续三组单坡不透明顶与直立采光窗组成锯齿剖面，侧面三角收头闭合，画架工作区处在连续天光之下", sawtoothArtRoom, "建筑", "现代"),
  design("洁污双廊手术部", "两侧互不穿越的洁净与污物走廊分别接入中央两个手术室，前方独立更衣缓冲间形成双通道组织", surgicalSuite, "建筑", "现代"),
  design("车廊直通复苏急诊部", "外部救护车雨棚与平层复苏入口同轴，分诊等候区通过独立门洞接到复苏室和后方处理间", emergencyDepartment, "建筑", "现代"),
  design("交错球道保龄球馆", "成对长球道由低位排沟和中央回球带分开，后部机器室与前方投球准备区分别有独立进出，完整跨梁屋盖不占球道", bowlingHall, "建筑", "现代"),
  design("立体倾壁抱石馆", "完整建筑内三面不同折角攀爬墙形成彼此相接的岩壁廊，墙后保留结构支撑和检修走道，下方铺设连续缓冲坪", boulderingHall, "建筑", "现代"),
  design("双道回流教学游泳馆", "完整下沉池体与侧边教学回流步道相接，水面低于岸边，低高双水槽由真正隔水墙分开，透明侧窗与大跨屋盖围护", teachingPoolHall, "建筑", "现代"),
  design("弧轨室内速度轮滑馆", "连续椭圆赛道两端为真正外高内低的弯道，直道与弯道同截面相接，中央留空，跨梁屋盖和外侧观众带独立", skatingHall, "建筑", "现代"),
  design("环坡汽车展示厅", "连续上升的宽车行环坡绕中央展厅一周抵达夹层，起终点分别连接地面入口与二层展示地台", carShowroom, "建筑", "现代"),
  design("错层悬桥儿童探索馆", "两边不同标高的探索平台以中央悬挂桥连接，下层环行通道与折返阶梯真正相通，采光桥楼中部保持挑空", explorationHall, "建筑", "现代"),
  design("折板天沟室内菜市", "连续V形折板屋盖把雨水汇入两列内天沟，独立支柱与摊档条带对齐，纵横通道贯通到四边门洞", foldedMarket, "建筑", "现代"),
  design("玻璃隔层接种门诊", "前区登记、分隔接种房和后区留观庭形成连续步行序列，室内隔墙观察窗与独立门洞保留真实贯通", vaccinationClinic, "建筑", "现代"),
  design("地下侧采光骨灰堂", "低于地表围合庭坪的纪念大厅由下行阶梯进入，两侧采光沟把日光引到龛廊，顶部覆板保留连续天光缝", columbariumHall, "建筑", "现代"),
  design("四向分流自助邮政厅", "十字平面的四个入口分别接到中央分拣柜台和独立包裹槽，后场货物通道绕过客户区，屋顶按交叉翼部闭合", postalHall, "建筑", "现代"),
  design("双侧卸货花卉交易厅", "双侧带坡道货台直接接向中央花车竞价区，悬高采光脊和两边低坡屋面围合完整大跨交易空间", flowerAuctionHall, "建筑", "现代"),
  design("中央分拣阅档登记大厅", "中央档案递送核心由环向接待台和四条取阅通道围合，后区独立卷宗分拣道与前方公共阅档席分开", archiveRegistrationHall, "建筑", "现代"),
  design("纵深声闸黑匣子摄影棚", "无柱高棚包含弯曲的墙地无缝背景，前侧双道错位声闸提供进出通道，上方独立吊挂走桥连接棚顶工作区", soundStage, "建筑", "现代"),
  design("顶光透视雕塑教学厅", "高中央雕塑大厅由环向侧廊与顶置采光口围合，跨厅吊运梁服务中央大作品，侧边高廊连接环行观摩带", sculptureHall, "建筑", "现代"),
  design("穿行式大车消防站", "前后大车门真正贯通车库，侧置生活夹层由折返楼梯连接，出动滑杆穿过有孔夹层并落到独立落脚区", fireStation, "建筑", "现代"),
];

function cinema(): ModelPart[] {
  const p = [box("观影厅完整平整基础", 0, .1, 0, 14, .2, 23, floorColor), doorway("正门与放映室下方入口墙", [0, .2, 11.3], 14, 6.5, 2.2), doorway("银幕左侧出口墙", [-6.9, .2, -6.5], 9.2, 5.5, 1.5, 90), doorway("银幕右侧出口墙", [6.9, .2, -6.5], 9.2, 5.5, 1.5, 90), ...[-1, 1].map(s => box("中后段隔声侧墙", s * 6.9, 3.45, 4.7, .24, 6.5, 13.2, wallColor)), box("银幕后封闭端墙", 0, 2.95, -11.3, 14, 5.5, .24, wallColor), box("前方独立银幕", 0, 3.15, -9.6, 10.8, 4.5, .1, "#d2d5cc"), box("银幕下方支承底架", 0, .55, -9.6, 10.8, .7, .3, dark), box("观众厅封闭隔声屋面", 0, 6.8, 1.4, 14.3, .24, 20.2, dark), box("银幕区较低屋面", 0, 5.86, -9.4, 14.3, .24, 3.4, dark)];
  for (let row = 0; row < 6; row++) {
    const z = -4.8 + row * 2, height = .28 + row * .28;
    p.push(box("逐级抬升且左右保留通道的观众踏台", 0, .2 + height / 2, z, 10.8, height, 2, dark), box("成行观众软座", 0, .7 + height, z, 10, .25, .65, "#89756d"), box("朝向银幕的整行椅背", 0, 1.04 + height, z + .3, 10, .65, .16, "#89756d"));
  }
  p.push(box("独立放映室楼面", 0, 3.5, 9.7, 8, .2, 3), ...[-1, 1].map(s => box("放映窗左右实墙", s * 2.8, 5.15, 8.2, 2.4, 3.1, .25, wallColor)), box("放映窗下槛", 0, 4.26, 8.2, 3.2, 1.32, .25, wallColor), box("放映窗上楣", 0, 6.2, 8.2, 3.2, .9, .25, wallColor), ...[-1, 1].map(s => doorway("放映间侧向工作门", [s * 4, 3.6, 9.7], 3, 3.1, .9, 90, 2.2)), box("投影机安装台", 0, 4.4, 9.25, 1.2, 1.6, 1.4, dark), cylinder("对准真正投影窗的镜头筒", 0, 5, 8.55, .35, .6, dark, [90, 0, 0]));
  for (const side of [-1, 1]) {
    for (let flight = 0; flight < 3; flight++) p.push({ ...stairFlight("观众座台以外实际通到放映室工作门的侧阶梯", side * 6, .2 + flight * 3.4 / 3, 2 + flight * 2.4, 1, 8, 3.4 / 24, .3), color: dark });
    p.push(box("侧阶梯与高位放映室工作门齐平的落脚平台", side * 5.3, 3.5, 9.7, 2.6, .2, 1, dark), box("工作平台外侧实际落地的承重立柱", side * 6.4, 1.8, 9.7, .15, 3.2, .15, dark), rail([side * 5.5, 1.3, 2], [side * 5.5, 4.7, 9.2], .05, dark), rail([side * 4.1, 4.7, 10.2], [side * 6.6, 4.7, 10.2], .05, dark), rail([side * 6.6, 4.7, 9.2], [side * 6.6, 4.7, 10.2], .05, dark), rail([side * 4.1, 4.7, 9.2], [side * 5.5, 4.7, 9.2], .05, dark));
    for (const z of [2, 5.6, 9.2]) { const y = .2 + (z - 2) / 7.2 * 3.4; p.push(box("连续侧阶梯内缘扶手真实立柱", side * 5.5, y + .55, z, .05, 1.1, .05, dark)); }
    for (const [x, z] of [[4.1, 9.2], [6.6, 9.2], [6.6, 10.2]]) p.push(box("门前落脚平台边缘实际防坠护栏立柱", side * x!, 4.15, z!, .05, 1.1, .05, dark));
  }
  return p;
}

function recordingStudio(): ModelPart[] {
  const p: ModelPart[] = [box("录音楼基础", 0, .1, 0, 10, .2, 11, floorColor), doorway("前台控制区入口", [0, .2, -5.4], 10, 3.8), box("录音室后端厚隔声墙", 0, 2.1, 5.4, 10, 3.8, .35, wallColor), ...[-1, 1].map(s => box("房中房外层侧墙", s * 4.85, 2.1, 0, .3, 3.8, 11, wallColor)), box("房中房独立录音楼板", 0, .49, 2.2, 7.3, .18, 5.6, colors.wood), box("控制间工作楼板", 0, .26, -2.7, 7.3, .12, 5, colors.wood)];
  for (const x of [-2.8, 0, 2.8]) for (const z of [.2, 2.4, 4.6]) p.push(box("独立录音地台下弹性隔振块", x, .35, z, .3, .12, .3, dark));
  p.push(box("观察窗底部厚隔墙", 0, .95, -.7, 7.5, 1.5, .32, wallColor), box("观察窗顶部厚隔墙", 0, 3.58, -.7, 7.5, 1.24, .32, wallColor), ...[-1, 1].map(s => box("观察窗边侧隔声实体", s * 3.2, 2.33, -.7, 1.1, 1.16, .32, wallColor)), part("双室间独立厚观察玻璃", "box", colors.glass, [0, 2.3, -.7], [5.2, 1.15, .05], [0, 0, 0], { opacity: .3 }), doorway("录音室左声闸内门", [-3.75, .58, 2.1], 5.8, 3.4, .95, 90, 2.15), doorway("控制室右侧外声闸门", [3.75, .2, -2.8], 5, 3.8, .95, 90, 2.2), box("错开的左声闸短隔墙", -4.2, 2.1, -.2, 1.1, 3.8, .18, wallColor), box("错开的右声闸短隔墙", 4.2, 2.1, .8, 1.1, 3.8, .18, wallColor), box("控制室斜面调音台", 0, 1, -2.2, 3.2, .8, 1.2, dark), ...[-1, 1].map(s => box("监听扬声器柜", s * 2.6, 1.5, -1.5, .5, 1.3, .45, dark)), box("独立房间隔振吊顶", 0, 4.04, 2.1, 7.55, .18, 5.8, dark), box("控制室外层封顶", 0, 4.15, -2.9, 10.2, .2, 5.2, dark));
  for (const s of [-1, 1]) for (const z of [1, 3.5]) p.push(box("录音室壁面离墙吸声板", s * 3.58, 2.2, z, .12, 2.1, 1.5, "#9d9987"));
  return p;
}

function sawtoothArtRoom(): ModelPart[] {
  const p: ModelPart[] = [box("画室长形基础地台", 0, .1, 0, 12.6, .2, 14.1, floorColor), doorway("画室宽工作入口", [0, .2, -6.95], 12.6, 4, 2.4), box("画室后部连续外墙", 0, 2.2, 6.95, 12.6, 4, .24, wallColor), ...windowBand("西侧绘画窗", -6.15, 0, 13.9, 4, 90), ...windowBand("东侧绘画窗", 6.15, 0, 13.9, 4, 90)];
  for (let i = 0; i < 3; i++) {
    const z = -4.6 + i * 4.6;
    p.push(part("锯齿长坡不透明屋面", "box", dark, [0, 5.025, z], [12.7, .16, 4.93], [20, 0, 0]), part("面朝同一方向的直立天光玻璃", "box", colors.glass, [0, 5.01, z - 2.3], [12.2, 1.63, .05], [0, 0, 0], { opacity: .28 }), box("直立天窗顶部横框", 0, 5.85, z - 2.3, 12.7, .16, .18, dark), box("直立天窗底部承框", 0, 4.2, z - 2.3, 12.7, .16, .18, dark));
    for (const s of [-1, 1]) p.push(part("锯齿坡端真实三角收头墙", "extrude", wallColor, [s * 6.15, 4.2, z], [1, 1, 1], [0, 90, 0], { depth: .22, profile: [{ x: -2.3, y: 0 }, { x: 2.3, y: 0 }, { x: 2.3, y: 1.67 }] }));
    p.push(box("整跨天窗中柱", 0, 5.02, z - 2.3, .12, 1.8, .18, dark));
  }
  for (const x of [-3, 3]) for (const z of [-3.5, 1, 4.4]) p.push(rail([x - .4, .2, z], [x, 1.85, z], .06, colors.wood), rail([x + .4, .2, z], [x, 1.85, z], .06, colors.wood), box("画架承画横托", x, .9, z, 1.1, .08, .12, colors.wood));
  p.push(box("公共调色清洗工作台", 0, 1.02, 5.8, 5, .18, 1.2, wallColor), ...[-1, 1].map(s => box("清洗台稳固承脚", s * 2, .56, 5.8, .18, .8, .9, wallColor)));
  return p;
}

function surgicalSuite(): ModelPart[] {
  const p: ModelPart[] = [box("双廊手术部基础", 0, .1, 0, 14.4, .2, 17, floorColor), doorway("手术部前方分流入口", [0, .2, -8.35], 14.4, 3.6, 2.2), doorway("后方污物外运出口", [5.5, .2, 8.35], 3.3, 3.6, 1.5), box("后方中央工作墙", -1.9, 2, 8.35, 10.5, 3.6, .24, wallColor), ...[-1, 1].map(s => box("外侧走廊外墙", s * 7.05, 2, 0, .25, 3.6, 16.7, wallColor))];
  for (const s of [-1, 1]) for (const z of [-2.9, 3.6]) p.push(doorway(s < 0 ? "洁净廊通向手术室的气密门洞" : "污物廊通向手术室的转运门洞", [s * 3.7, .2, z], 6.5, 3.6, 1.5, 90));
  p.push(box("两手术室之间独立分隔墙", 0, 2, .35, 7.4, 3.6, .25, wallColor), doorway("更衣缓冲与手术区之间门洞", [0, .2, -6.15], 7.4, 3.6, 1.5), box("更衣间一侧分流短墙", -1.2, 2, -7.25, .18, 3.6, 2.2, wallColor), box("双走廊上方连续服务桥", 0, 4.02, 0, 14.6, .25, 1.2, dark), ...[-1, 1].map(s => box("走廊独立低屋盖", s * 5.45, 3.95, 0, 3.7, .2, 17.1, dark)), ...[-2.9, 3.6].map(z => box("手术室独立可维护屋盖", 0, 4.15, z, 7.4, .2, 6.4, "#d2d6c9")), box("前方更衣缓冲屋盖", 0, 3.95, -7.25, 7.4, .2, 2.3, dark));
  for (const z of [-2.9, 3.6]) p.push(box("中央手术平台底座", 0, .55, z, .7, .7, 1, dark), box("独立手术台面", 0, 1.03, z, .75, .25, 2.2, "#8ca3a3"), cylinder("顶置服务悬臂立轴", 1.3, 3.1, z, .14, 1.7, dark), rail([1.3, 2.25, z], [.1, 2.25, z], .12, dark), cylinder("悬挂圆盘工作灯", .1, 2.18, z, .75, .12, wallColor), box("污物廊传递台", 5.3, 1, z, 1, .18, 1.5, dark), box("洁净廊嵌墙储物柜", -6.7, 1.3, z, .45, 2.2, 1.7, wallColor));
  return p;
}

function emergencyDepartment(): ModelPart[] {
  const p = [box("车辆与室内同标高接诊地坪", 0, .1, 0, 17, .2, 18, floorColor), doorway("救护车直通双宽复苏门洞", [2.6, .2, -2], 9, 3.9, 3), doorway("等候门诊独立步行入口", [-5.6, .2, -5.5], 5.6, 3.5, 1.8), box("急诊后部处理间实墙", 0, 2.15, 8.8, 17, 3.9, .24, wallColor), ...[-1, 1].map(s => box("急诊两侧完整外墙", s * 8.35, 2.15, 2.8, .25, 3.9, 12, wallColor)), box("等候区与急救区之间连续墙", -2.7, 2.05, -1.7, .25, 3.7, 7.6, wallColor), doorway("分诊台后独立工作门洞", [-5.5, .2, 2.2], 5.5, 3.7, 1.2), doorway("复苏区后处理隔门", [2.7, .2, 3], 11, 3.9, 2.2), box("患者分诊矮台", -5.4, 1.02, .5, 3.5, .9, .6, dark), box("等候长凳", -6.3, .62, -3.4, 3.3, .35, .65, colors.wood), box("公共步行入口挑檐", -5.6, 3.85, -6.1, 6.1, .2, 2, dark), box("救护车道上方大悬挑雨棚", 2.8, 4.35, -5.5, 10.7, .25, 7.5, dark), box("内部处理区连续屋盖", 0, 4.25, 3.5, 17.3, .24, 11.2, dark)];
  for (const x of [-1.6, 7.1]) p.push(box("车道两端避让车辆的雨棚支柱", x, 2.2, -8.3, .3, 4, .3, wallColor));
  for (const x of [.6, 4.8]) p.push(box("复苏床地面底架", x, .4, 1, .9, .4, 2.1, dark), box("复苏床高位台面", x, .98, 1, .85, .22, 2, "#8ba6a6"), box("床侧服务头墙", x, 1.55, 2.65, 2.8, .7, .2, wallColor), rail([x + 1.5, .2, .6], [x + 1.5, 3.95, .6], .05, dark), box("有离地空间的诊疗帘上轨", x, 3.85, .6, 3.1, .08, .08, dark));
  p.push(doorway("后处理区真正独立隔间门", [3, .2, 6], 5.6, 3.9, 1.3, 90), box("后处理区检验台面", -4.7, .95, 7.8, 4.5, .18, 1, dark));
  return p;
}

function bowlingHall(): ModelPart[] {
  const p: ModelPart[] = [box("球馆承重平整基础", 0, .1, 0, 12.4, .2, 30, floorColor), doorway("投球准备区正面入口", [0, .2, -14.8], 12.4, 5, 2.4), doorway("机器区检修出口", [0, .2, 14.8], 12.4, 5, 1.2), ...[-1, 1].map(s => box("完整球馆侧墙", s * 6.05, 2.7, 0, .3, 5, 29.6, wallColor)), box("球道上方大跨屋面", 0, 5.38, 0, 12.7, .24, 30.3, dark), doorway("后端机器室通行隔墙", [0, .2, 12], 12.1, 4.8, 1.2), box("前方投球准备平台", 0, .43, -10.8, 10.6, .45, 7, colors.wood)];
  for (const x of [-3.3, -1.65, 1.65, 3.3]) {
    p.push(box("连续长条保龄球道", x, .45, 2.5, 1.1, .3, 19, "#bba379"), ...[-1, 1].map(s => part("低于球道面的真正凹槽排沟", "extrude", dark, [x + s * .67, .28, 2.5], [1, 1, 1], [0, 0, 0], { depth: 19, profile: [{ x: -.12, y: .12 }, { x: -.12, y: 0 }, { x: .12, y: 0 }, { x: .12, y: .12 }, { x: .09, y: .12 }, { x: .07, y: .04 }, { x: -.07, y: .04 }, { x: -.09, y: .12 }] })), box("后端球瓶工作坑底", x, .23, 10.6, 1.25, .06, 2, dark), box("球道起投犯规线", x, .607, -6.8, 1.1, .014, .06, dark));
  }
  p.push(box("两对球道间的独立回球带", 0, .42, 1.6, .65, .3, 21, dark), ...[-1, 1].map(s => box("准备区长坐凳", s * 3.3, .77, -12.8, 4.3, .45, .75, "#889c98")), box("回球前端上抬接球台", 0, .9, -9.5, .8, .55, 1.5, dark));
  for (const z of [-10, 0, 10]) p.push(rail([-5.95, 5.1, z], [5.95, 5.1, z], .25, dark));
  return p;
}

function boulderingHall(): ModelPart[] {
  const p = [box("攀爬馆独立建筑基础", 0, .1, 0, 17, .2, 14, floorColor), doorway("抱石馆前方宽入口", [0, .2, -6.8], 17, 6.8, 2.4), box("馆后外墙", 0, 3.6, 6.8, 17, 6.8, .25, wallColor), ...windowBand("两侧高位采光西窗", -8.35, 0, 13.6, 6.8, 90), ...windowBand("两侧高位采光东窗", 8.35, 0, 13.6, 6.8, 90), box("立体抱石馆大跨顶板", 0, 7.17, 0, 17.3, .24, 14.3, dark), box("连续落地软垫不盖检修通道", 0, .4, .2, 12.4, .4, 9.5, "#9eaaa2")];
  for (const s of [-1, 1]) {
    p.push(part("斜向馆内的下段攀爬面", "box", "#bca98b", [s * 5.7, 2.25, .8], [3.3, .25, 8.8], [0, 0, s * 65]), part("折回上部的连续反角攀爬面", "box", "#9baaa2", [s * 6.01, 4.7, .8], [2.45, .25, 8.8], [0, 0, s * 107]));
    for (const z of [-2.8, 3.8]) p.push(rail([s * 7.7, .2, z], [s * 5.65, 5.85, z], .16, dark), rail([s * 7.7, .2, z], [s * 6.45, 3.8, z], .16, dark));
    for (let i = 0; i < 9; i++) { const y = 1.2 + (i % 3) * 1.25; p.push(part("嵌入下段倾壁的独立实体抓点", "sphere", i % 2 ? "#8d725d" : "#788f82", [s * (5.7 + (y - 2.25) / Math.tan(65 * Math.PI / 180) - .14), y, -2.4 + Math.floor(i / 3) * 2.4], [.3, .25, .3])); }
  }
  p.push(part("后墙连接两侧岩壁的直立攀爬墙", "box", "#bca98b", [0, 2.95, 5], [12.2, 5.5, .25]), ...[-4, -2, 0, 2, 4].map(x => rail([x, .2, 6.5], [x, 5.7, 5.1], .14, dark)));
  return p;
}

function teachingPoolHall(): ModelPart[] {
  const p: ModelPart[] = [box("低于馆坪的池底基础", 0, .11, 0, 18, .22, 25, wallColor), ...[-1, 1].map(s => box("池体两侧连续岸边走道", s * 7.15, 1.65, 0, 3.7, .3, 24.6, floorColor)), ...[-1, 1].map(s => box("池体端部岸边走道", 0, 1.65, s * 11.4, 10.6, .3, 1.8, floorColor)), ...[-1, 1].map(s => box("低于岸坪的真正池边墙", s * 5.3, .92, 0, .25, 1.42, 21, wallColor)), ...[-1, 1].map(s => box("封合池两端挡水墙", 0, .92, s * 10.5, 10.6, 1.42, .25, wallColor)), box("游泳区与教学浅池的实心水墙", -2.4, 1, 0, .2, 1.6, 21, wallColor), box("幼教浅池抬高的真实底面", -3.85, .75, 0, 2.65, 1.05, 20.8, wallColor), part("深水教学区域水面", "box", colors.water, [1.4, 1.5, 0], [7.45, .035, 20.7], [0, 0, 0], { opacity: .72, roughness: .16 }), part("独立浅池水面", "box", colors.water, [-3.85, 1.5, 0], [2.6, .035, 20.7], [0, 0, 0], { opacity: .65, roughness: .16 }), ...windowBand("泳馆西侧透明外窗", -8.85, 0, 24.6, 6.7, 90), ...windowBand("泳馆东侧透明外窗", 8.85, 0, 24.6, 6.7, 90), doorway("更衣前厅入口立面", [0, 1.8, -12.3], 18, 4.9, 2.2), box("泳馆后端围墙", 0, 4.25, 12.3, 18, 4.9, .25, wallColor), box("高于主桁架的泳馆连续屋盖", 0, 7.8, 0, 18.4, .3, 25.3, dark)];
  for (const s of [-1, 1]) p.push(part("外窗与高屋盖之间的连续采光缝", "box", colors.glass, [s * 8.85, 7.275, 0], [.06, .75, 24.6], [0, 0, 0], { opacity: .25 }), box("采光缝顶部封边承梁", s * 8.85, 7.63, 0, .2, .15, 24.8, dark), box("前后立面上方连续封顶墙", 0, 7.18, s * 12.3, 18, .96, .25, wallColor));
  for (const z of [-8, 0, 8]) p.push(rail([-8.6, 6.65, z], [0, 7.5, z], .25, dark), rail([0, 7.5, z], [8.6, 6.65, z], .25, dark));
  for (let i = 0; i < 4; i++) { const height = (4 - i) * .105; p.push(box("贴岸逐级下降并真正接向浅池底面的实体台阶", -3.85, 1.275 + height / 2, -10.5 + (i + .5) * .38, 2.6, height, .38, wallColor)); }
  for (const x of [.3, 2.6]) p.push(box("教学泳道水下导向带", x, .235, 0, .12, .02, 20.6, dark));
  p.push({ ...stairFlight("由室外地面实际连续接到一点八米池岸入口的完整阶梯", 0, 0, -15.3, 2.4, 10, .18, .3), color: wallColor });
  for (const x of [-1.12, 1.12]) {
    p.push(rail([x, 1.1, -15.3], [x, 2.9, -12.3], .06, dark));
    for (let i = 0; i < 3; i++) p.push(box("池岸外入口阶梯连续扶栏的实际支柱", x, i * .9 + .55, -15.3 + i * 1.5, .06, 1.1, .06, dark));
  }
  return p;
}

export function arcDeck(name: string, center: Triple, inner: number, outer: number, span: number, rise: number, bank = 0, startAngle = 0): ModelPart {
  const segments = 24, vertices: { x: number; y: number; z: number }[] = [], indices: number[] = [];
  const point = (angle: number, radius: number, depth: number) => ({ x: center[0] + Math.cos(angle + startAngle) * radius, y: center[1] + rise * angle / span + bank * (radius - inner) / (outer - inner) + depth, z: center[2] + Math.sin(angle + startAngle) * radius });
  const quad = (a: ReturnType<typeof point>, b: ReturnType<typeof point>, c: ReturnType<typeof point>, d: ReturnType<typeof point>) => { const start = vertices.length; vertices.push(a, b, c, d); indices.push(start, start + 1, start + 2, start, start + 2, start + 3); };
  for (let i = 0; i < segments; i++) {
    const a = i / segments * span, b = (i + 1) / segments * span;
    quad(point(a, inner, 0), point(b, inner, 0), point(b, outer, 0), point(a, outer, 0));
    quad(point(a, inner, -.2), point(a, outer, -.2), point(b, outer, -.2), point(b, inner, -.2));
    quad(point(a, inner, -.2), point(b, inner, -.2), point(b, inner, 0), point(a, inner, 0));
    quad(point(a, outer, -.2), point(a, outer, 0), point(b, outer, 0), point(b, outer, -.2));
  }
  quad(point(0, inner, -.2), point(0, inner, 0), point(0, outer, 0), point(0, outer, -.2));
  quad(point(span, inner, -.2), point(span, outer, -.2), point(span, outer, 0), point(span, inner, 0));
  return part(name, "mesh", floorColor, [0, 0, 0], [1, 1, 1], [0, 0, 0], { vertices, indices });
}

function skatingHall(): ModelPart[] {
  const p: ModelPart[] = [box("轮滑馆整体基础", 0, .1, 0, 34, .2, 28, wallColor), doorway("轮滑馆正面宽入口", [0, .2, -13.8], 34, 7, 3), box("轮滑馆后方整体墙", 0, 3.7, 13.8, 34, 7, .25, wallColor), ...[-1, 1].map(s => box("轮滑馆两侧边墙", s * 16.8, 3.7, 0, .25, 7, 27.6, wallColor)), box("轮滑馆封闭大跨屋盖", 0, 7.5, 0, 34.4, .35, 28.4, dark)];
  const left = arcDeck("西端连续升坡弯道", [-6, .48, 0], 6, 10, Math.PI, 0, .8, Math.PI / 2);
  const right = arcDeck("东端连续升坡弯道", [6, .48, 0], 6, 10, Math.PI, 0, .8, -Math.PI / 2);
  p.push(left, right);
  for (const s of [-1, 1]) p.push(part("连接两端的同坡度直道", "extrude", floorColor, [0, 0, s * 8], [1, 1, 1], [0, 90, 0], { depth: 12, profile: s < 0 ? [{ x: -2, y: .48 }, { x: 2, y: 1.28 }, { x: 2, y: 1.08 }, { x: -2, y: .28 }] : [{ x: -2, y: 1.28 }, { x: 2, y: .48 }, { x: 2, y: .28 }, { x: -2, y: 1.08 }] }));
  for (const z of [-11.7, 11.7]) for (let row = 0; row < 3; row++) p.push(box("场外纵向观众阶带", 0, .45 + row * .35, z + Math.sign(z) * row * .6, 25, .5 + row * .7, .6, dark));
  for (const x of [-12, 0, 12]) p.push(rail([x, 7.1, -13.6], [x, 7.1, 13.6], .3, dark));
  return p;
}

function carShowroom(): ModelPart[] {
  const p: ModelPart[] = [cylinder("汽车展厅圆形基础地盘", 0, .1, 0, 23, .2, floorColor), arcDeck("内厅外连续一圈上升汽车坡道", [0, .45, 0], 5, 8.8, Math.PI * 2, 3.6), halfRoundWall("保留车行入口的外环围墙", 11, .3, 6.7, [0, .2, 0], -15, wallColor, Math.PI * 11 / 6), box("高台从坡道终点另一侧平接并让开最后一段上行坡", 6.9, 3.95, 1.75, 3.8, .2, 3.5, floorColor), cylinder("中央低位旋转展示地台", 0, .4, 0, 7.5, .4, "#c3c1ad"), part("外环上方贯通中央天光口的环形屋盖", "lathe", dark, [0, 6.95, 0], [1, 1, 1], [0, 0, 0], { profile: [{ x: 3.8, y: 0 }, { x: 11.4, y: 0 }, { x: 11.4, y: .22 }, { x: 3.8, y: .22 }, { x: 3.8, y: 0 }] }), part("中央圆形玻璃采光盖", "cylinder", colors.glass, [0, 7.05, 0], [7.6, .05, 7.6], [0, 0, 0], { opacity: .25 })];
  for (let i = 1; i < 12; i++) {
    const angle = i / 12 * Math.PI * 2, height = .05 + i / 12 * 3.6;
    p.push(cylinder("独立承接上升坡底面的支柱", Math.cos(angle) * 7, .2 + height / 2, Math.sin(angle) * 7, .28, height, wallColor));
  }
  p.push(box("跨过低位起步坡并直接承接展示高台底面的横梁", 6.35, 3.76, 3.1, 6.6, .18, .24, dark));
  for (const x of [3.2, 9.5]) p.push(box("高台后缘避开环形车道而实际落地的支柱", x, 1.935, 3.1, .24, 3.47, .24, wallColor));
  p.push(doorway("宽车行入口上方整体门框", [10.7, .2, 0], 5.7, 6.7, 4.2, 90, 3.6), polygon("入口转向坪从螺坡低端后方平接并给宽车坡保留侧边接入段", floorColor, [[5, -3.8], [10.4, -3.8], [10.4, 1.1], [8.8, 1.1], [8.8, 0], [5, 0]], .25, [0, .2, 0]), part("由地面连续穿过车行门并接入低位转向坪的实体缓坡", "extrude", floorColor, [0, 0, -.5], [1, 1, 1], [0, 0, 0], { depth: 3.2, profile: [{ x: 10.4, y: 0 }, { x: 14, y: 0 }, { x: 14, y: .02 }, { x: 11.6, y: .205 }, { x: 10.4, y: .45 }] }));
  return p;
}

function explorationHall(): ModelPart[] {
  const p: ModelPart[] = [box("儿童探索馆地基", 0, .1, 0, 17, .2, 18, floorColor), doorway("探索馆前方入口", [0, .2, -8.8], 17, 7.2, 2.6), box("探索馆后墙", 0, 3.8, 8.8, 17, 7.2, .25, wallColor), ...windowBand("探索馆西侧高窗", -8.35, 0, 17.6, 7.2, 90), ...windowBand("探索馆东侧高窗", 8.35, 0, 17.6, 7.2, 90), box("第一层西侧长平台", -5.6, 2.2, 2, 4.8, .25, 9.2, colors.wood), box("第二层东侧短平台", 5.6, 3.7, 2.2, 4.8, .25, 8.8, colors.wood), part("跨越挑空空间的缓斜悬桥板", "extrude", colors.wood, [0, 0, 2], [1, 1, 1], [0, 0, 0], { depth: 1.8, profile: [{ x: -3.2, y: 2.175 }, { x: 3.2, y: 3.675 }, { x: 3.2, y: 3.825 }, { x: -3.2, y: 2.325 }] }), box("顶层横跨主厅的吊挂钢梁", 0, 6.8, 2, 15.7, .25, .3, dark), box("高位采光屋面", 0, 7.6, 0, 17.4, .25, 18.4, dark)];
  for (const x of [-6.9, -4.2, 4.2, 6.9]) for (const z of [-1.6, 5.5]) p.push(box("平台下方与上下楼板相接的柱", x, x < 0 ? 1.1 : 1.85, z, .2, x < 0 ? 2 : 3.5, .2, dark));
  for (let i = 0; i < 14; i++) p.push(box("西侧上平台的连续入口阶梯", -5.5, .2 + (i + 1) * (2.125 / 14) / 2, -6.92 + i * .32, 2, (i + 1) * (2.125 / 14), .32, colors.wood));
  for (let i = 0; i < 20; i++) p.push(box("东侧平台的独立抬升阶梯", 5.4, .2 + (i + 1) * .18125 / 2, -7.56 + i * .275, 1.8, (i + 1) * .18125, .275, colors.wood));
  for (const x of [-3.2, 0, 3.2]) for (const s of [-1, 1]) p.push(rail([x, 3 + x * .234375, 2 + s * .88], [x, 6.68, 2 + s * .88], .035, dark));
  for (const s of [-1, 1]) p.push(rail([-3.2, 3.425, 2 + s * .88], [3.2, 4.925, 2 + s * .88], .05, dark));
  return p;
}

function foldedMarket(): ModelPart[] {
  const p: ModelPart[] = [box("四向贯通市场完整地坪", 0, .1, 0, 20, .2, 23, floorColor), doorway("市场前方主要入口", [0, .2, -11.3], 20, 3.8, 4), doorway("市场后方卸货入口", [0, .2, 11.3], 20, 3.8, 4), ...[-1, 1].map(s => doorway("市场横向通道侧入口", [s * 9.8, .2, 0], 22.6, 3.8, 3.4, 90))];
  for (const valley of [-5, 5]) {
    for (const s of [-1, 1]) p.push(part("向内天沟汇水的实心折板坡顶", "box", "#87978e", [valley + s * 2.5, 4.65, 0], [5.27, .18, 23.4], [0, 0, s * 16]));
    p.push(part("位于两坡最低线的真正敞口天沟", "extrude", dark, [valley, 3.95, 0], [1, 1, 1], [0, 0, 0], { depth: 23.4, profile: [{ x: -.24, y: .18 }, { x: -.24, y: -.05 }, { x: .24, y: -.05 }, { x: .24, y: .18 }, { x: .19, y: .18 }, { x: .19, y: 0 }, { x: -.19, y: 0 }, { x: -.19, y: .18 }] }));
    for (const z of [-9.2, -3.6, 3.6, 9.2]) p.push(box("天沟下与摊位边缘对齐的承重柱", valley, 2.05, z, .25, 3.7, .25, wallColor));
    for (const z of [-6.5, 6.5]) p.push(box("独立市场湿货摊位长台", valley, 1.02, z, 3.6, .2, 5.6, wallColor), ...[-1, 1].map(s => box("摊位台下实心承脚", valley + s * 1.45, .56, z, .2, .72, 5.6, wallColor)));
  }
  return p;
}

function vaccinationClinic(): ModelPart[] {
  const p: ModelPart[] = [box("接种门诊长形基础", 0, .1, 0, 13, .2, 18, floorColor), doorway("门诊前端登记入口", [0, .2, -8.8], 13, 3.6, 2.2), doorway("留观后独立离开门洞", [0, .2, 8.8], 13, 3.6, 2.2), ...[-1, 1].map(s => box("门诊两侧外墙", s * 6.35, 2, 0, .25, 3.6, 17.6, wallColor)), doorway("登记前厅后方入口", [0, .2, -4.5], 13, 3.6, 2), doorway("接种后前往留观区的门洞", [0, .2, 4.5], 13, 3.6, 2), box("中央连续公共通行地带", 0, .23, 0, 2.4, .06, 9, "#cad0bc"), box("登记服务前台", 3.3, 1.05, -6.2, 4.5, .9, .65, dark), box("前厅就坐长凳", -3.6, .65, -6.6, 4.6, .35, .7, colors.wood), box("后方留观区连续长座", 0, .65, 6.8, 9, .35, .8, colors.wood), box("门诊完整屋盖", 0, 4.02, 0, 13.3, .24, 18.3, dark)];
  for (const s of [-1, 1]) for (const z of [-2.3, 2.3]) {
    const panel = polygon("带门口及真实高窗孔的接种隔墙", wallColor, [[-2.3, 0], [-.475, 0], [-.475, 2.2], [.475, 2.2], [.475, 0], [2.3, 0], [2.3, 3.6], [-2.3, 3.6]], .24, [0, 0, 0], [[[.7, 2.5], [1.9, 2.5], [1.9, 3.3], [.7, 3.3]]]);
    panel.vertices = panel.vertices!.map(value => ({ x: s * 1.2 + value.y - .12, y: .2 + value.z, z: z + value.x }));
    p.push(panel, box("独立接种房前后隐私隔墙", s * 3.8, 2, z - 2.25, 5.2, 3.6, .16, wallColor), part("位于高窗实际孔内的观察玻璃", "box", colors.glass, [s * 1.2, 3.1, z + 1.3], [.04, .8, 1.2], [0, 0, 0], { opacity: .25 }), box("实际接种操作台", s * 4.9, 1.05, z, 1.3, .15, .7, dark), box("接种座椅椅面", s * 3.1, .7, z, .6, .2, .65, "#91a8a0"), box("接种座椅落地支座", s * 3.1, .38, z, .4, .36, .4, dark));
  }
  return p;
}

function columbariumHall(): ModelPart[] {
  const p: ModelPart[] = [box("纪念堂地下完整基础", 0, .1, 0, 15, .2, 20, wallColor), ...[-1, 1].map(s => box("外侧采光沟挡土墙", s * 7.3, 2, 0, .4, 3.6, 20, wallColor)), box("纪念堂后端挡土墙", 0, 2, 9.8, 14.6, 3.6, .4, wallColor), doorway("地下纪念堂入口厚门框", [0, .2, -4.8], 11, 3.6, 2.2), ...[-1, 1].map(s => box("龛廊内外分隔长墙", s * 4.2, 1.85, 2.3, .5, 3.3, 14.5, "#a79b87")), ...[-1, 1].map(s => part("采光沟朝向大厅的连续玻璃", "box", colors.glass, [s * 5.5, 2, 2.1], [.055, 3.5, 14.5], [0, 0, 0], { opacity: .25 })), box("地下厅中央覆土屋板", 0, 4.02, 2.2, 11.2, .44, 15.2, wallColor), ...[-1, 1].map(s => box("采光沟外侧地表平台", s * 6.95, 4, 0, .7, .4, 20, floorColor)), box("堂内中央献花石台", 0, .7, 7, 3.5, 1, 1.2, wallColor)];
  for (let i = 0; i < 22; i++) p.push(box("从地表下行的连续宽踏阶", 0, .2 + (22 - i) * (4 / 22) / 2, -9.8 + i * .23, 3, (22 - i) * (4 / 22), .23, wallColor));
  for (const s of [-1, 1]) for (let i = 0; i < 5; i++) p.push(box("龛廊平齐的独立封板组", s * 3.92, 1.7, -3.3 + i * 2.6, .08, 2.55, 2.15, "#c4bdab"));
  for (const s of [-1, 1]) p.push(rail([s * 1.7, 4.6, -9.6], [s * 1.7, 1, -4.9], .06, dark));
  return p;
}

function postalHall(): ModelPart[] {
  const roof = polygon("邮政厅纵横翼共同接合的连续十字实体屋盖", dark, [[-3.25, -8.25], [3.25, -8.25], [3.25, -3.25], [8.25, -3.25], [8.25, 3.25], [3.25, 3.25], [3.25, 8.25], [-3.25, 8.25], [-3.25, 3.25], [-8.25, 3.25], [-8.25, -3.25], [-3.25, -3.25]], .24, [0, 4.03, 0]), roofPoints = roof.vertices!;
  roof.vertices = roof.indices!.map(index => roofPoints[index]!); delete roof.indices;
  const p: ModelPart[] = [polygon("十字形邮政厅完整地坪", floorColor, [[-3, -8], [3, -8], [3, -3], [8, -3], [8, 3], [3, 3], [3, 8], [-3, 8], [-3, 3], [-8, 3], [-8, -3], [-3, -3]], .2), roof];
  for (const s of [-1, 1]) p.push(doorway("纵翼端部客户入口", [0, .2, s * 8], 6, 3.8, 2), doorway("横翼端部客户入口", [s * 8, .2, 0], 6, 3.8, 2, 90));
  for (const s of [-1, 1]) for (const t of [-1, 1]) p.push(box("纵翼凹角连续外墙", s * 3, 2.1, t * 5.5, .24, 3.8, 5, wallColor), box("横翼凹角连续外墙", s * 5.5, 2.1, t * 3, 5, 3.8, .24, wallColor));
  p.push(box("中央分拣作业核心", 0, .8, 0, 3.2, 1.2, 3.2, dark));
  for (const s of [-1, 1]) p.push(box("纵向客户服务柜台", 0, 1.02, s * 2.4, 3.8, .95, .6, wallColor), box("横向寄件服务柜台", s * 2.4, 1.02, 0, .6, .95, 3.8, wallColor), box("纵向包裹缓冲带", 0, .6, s * 4.4, 1.1, .45, 2.7, dark), ...[-1, 1].map(t => box("公共自取柜列", s * 5.8, 1.4, t * 2.55, 3.5, 2.4, .55, "#97a69c")));
  return p;
}

function flowerAuctionHall(): ModelPart[] {
  const p: ModelPart[] = [polygon("花卉交易厅主体基础在两卸货坡脚下真正落地伸出", wallColor, [[-10, -12], [-9.45, -12], [-9.45, -12.5], [-7.65, -12.5], [-7.65, -12], [7.65, -12], [7.65, -12.5], [9.45, -12.5], [9.45, -12], [10, -12], [10, 12], [-10, 12]], .2), box("有实心基座承托的高位交易地坪", 0, .7, 0, 15.5, 1, 23.6, floorColor), doorway("交易厅正门", [0, 1.2, -11.8], 15.5, 4.8, 3), doorway("交易厅货品后场门", [0, 1.2, 11.8], 15.5, 4.8, 3.6), box("中高采光脊顶部平屋盖", 0, 7, 0, 5, .25, 24.4, dark)];
  for (const s of [-1, 1]) {
    p.push(part("高侧窗以下低侧坡屋面", "box", dark, [s * 5, 5.6, 0], [5.6, .2, 24.3], [0, 0, -s * 12]), part("交易厅高侧天光玻璃带", "box", colors.glass, [s * 2.5, 6.35, 0], [.05, 1.1, 23.8], [0, 0, 0], { opacity: .25 }), box("高侧窗上部承托梁", s * 2.5, 6.9, 0, .2, .2, 24.2, dark), doorway("两侧连续卸货通道的仓门墙", [s * 7.65, 1.2, 0], 23.6, 4.5, 4, 90, 3.5), box("同端部坡道高端相接的车辆卸货台", s * 8.55, .7, 1.375, 1.8, 1, 19.75, floorColor));
    for (const z of [-8, 0, 8]) p.push(box("天光脊承柱", s * 2.5, 4, z, .25, 5.6, .25, wallColor));
    p.push(part("卸货台端部可实际推车的斜坡", "extrude", floorColor, [s * 8.55, .2, -10.5], [1, 1, 1], [0, -90, 0], { depth: 1.8, profile: [{ x: -2, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: -2, y: .02 }] }));
    for (const z of [-5, 5]) p.push(box("花卉车停靠低位成列交易台", s * 4.5, 1.7, z, 2.8, .3, 5.5, "#a0b0a0"));
  }
  p.push(box("竞价主持工作台", 0, 1.65, 9, 4.2, .9, 1.5, dark));
  return p;
}

function archiveRegistrationHall(): ModelPart[] {
  const p: ModelPart[] = [box("登记大厅完整基础", 0, .1, 0, 17, .2, 17, floorColor), doorway("登记大厅公共入口", [0, .2, -8.3], 17, 4.3, 2.5), doorway("后方档案后勤出口", [0, .2, 8.3], 17, 4.3, 1.5), ...[-1, 1].map(s => box("大厅完整侧墙", s * 8.3, 2.35, 0, .25, 4.3, 16.6, wallColor)), doorway("后勤工作人员实际穿行的分隔墙", [0, .2, 5.7], 17, 4.3, 1.5), box("登记大厅完整屋盖", 0, 4.7, 0, 17.4, .3, 17.4, dark)];
  for (const s of [-1, 1]) p.push(box("中央封闭卷宗工作室侧墙", s * 2.25, 1.8, 1, .2, 3.2, 6, wallColor));
  p.push(doorway("中央工作室后场通行门", [0, .2, 4], 4.5, 3.2, 1.1), box("中央卷宗工作室顶板", 0, 3.6, 1, 4.7, .2, 6.2, wallColor));
  p.push(box("面向公共区的连续服务柜台", 0, 1.1, -2, 4.7, 1, .7, wallColor), box("工作室前窗上方实墙", 0, 2.9, -2, 4.7, 1.2, .2, wallColor));
  for (const x of [-5.4, 5.4]) for (const z of [-4.8, -.8, 3.2]) p.push(box("独立阅档长桌台面", x, .98, z, 2.7, .15, 1.3, colors.wood), ...[-1, 1].map(s => box("阅档桌稳定落地脚板", x + s * 1, .59, z, .12, .63, 1.1, dark)));
  for (const x of [-5, 0, 5]) p.push(box("后勤区卷宗分拣低台", x, 1, 7, 3.5, .2, 1, dark));
  return p;
}

function soundStage(): ModelPart[] {
  const p: ModelPart[] = [box("摄影棚独立大块基础", 0, .13, 0, 20, .26, 25, floorColor), ...[-1, 1].map(s => box("摄影棚隔声侧墙", s * 9.8, 4.4, 0, .4, 8.5, 24.6, dark)), box("摄影棚完整后墙", 0, 4.4, 12.3, 19.6, 8.5, .4, dark), doorway("大型摄影棚前门", [0, .26, -12.3], 20, 8.5, 4.5, 0, 5), box("内外声闸第一道隔墙", -4.2, 4.4, -9.7, 11.2, 8.5, .25, dark), doorway("与外门错开的声闸内门", [4.3, .26, -9.7], 8.4, 8.5, 2.4, 0, 3.3), box("声闸第二道折返挡墙", 2.1, 2.3, -11, .25, 4.1, 2.5, dark), box("摄影棚无柱大跨顶", 0, 9, 0, 20.6, .45, 25.6, dark), part("由地面圆弧连续过渡到背墙的无缝背景", "extrude", "#c7c6b8", [0, .27, 8.5], [1, 1, 1], [0, -90, 0], { depth: 16, profile: [{ x: -1.5, y: 0 }, { x: .5, y: 0 }, { x: .5, y: 6.8 }, { x: .32, y: 6.8 }, { x: .32, y: 2 }, { x: .25, y: 1.55 }, { x: .05, y: 1.1 }, { x: -.28, y: .65 }, { x: -.75, y: .32 }, { x: -1.5, y: .18 }] })];
  p.push(polygon("三道横桥与西侧检修廊连成一体的E形楼板", colors.metal, [[-9.65, -5.4], [9.65, -5.4], [9.65, -4.6], [-8.65, -4.6], [-8.65, -.4], [9.65, -.4], [9.65, .4], [-8.65, .4], [-8.65, 4.6], [9.65, 4.6], [9.65, 5.4], [-9.65, 5.4]], .16, [0, 6.52, 0]));
  for (const z of [-5, 0, 5]) p.push(rail([-9.5, 8.73, z], [-9.5, 6.6, z], .06, colors.metal), rail([9.5, 8.73, z], [9.5, 6.6, z], .06, colors.metal));
  const ladderHoles: [number, number][][] = [];
  for (let i = 0; i < 23; i++) { const low = .26 + i * 6.42 / 23 + .025, high = .26 + (i + 1) * 6.42 / 23 - .025; ladderHoles.push([[-.34, low], [.34, low], [.34, high], [-.34, high]]); }
  const ladder = polygon("由棚内地面实际通到西侧检修廊的连续踏档钢爬梯", colors.metal, [[-.42, .26], [.42, .26], [.42, 6.68], [-.42, 6.68]], .07, [0, 0, 0], ladderHoles);
  ladder.vertices = ladder.vertices!.map(point => ({ x: -9.2 + point.x, y: point.z, z: -5.4 - point.y }));
  p.push(ladder);
  const guardOutline: [number, number][] = [[-9.15, 6.68], [9.15, 6.68], [9.15, 7.78], [-9.15, 7.78]], guardHoles: [number, number][][] = [];
  for (let i = 0; i < 6; i++) { const x = (i - 2.5) * 3.05; guardHoles.push([[x - 1.425, 6.78], [x + 1.425, 6.78], [x + 1.425, 7.68], [x - 1.425, 7.68]]); }
  for (const z of [-5.4, -4.6, -.4, .4, 4.6, 5.4]) { const guard = standingPanel("横向检修桥两侧保留侧廊入口的穿孔金属护栏", colors.metal, guardOutline, guardHoles, z, .04); guard.position.x = .5; p.push(guard); }
  for (const z of [-2.5, 2.5]) {
    const holes: [number, number][][] = [-1.05, 1.05].map(x => [[x - .9, 6.78], [x + .9, 6.78], [x + .9, 7.68], [x - .9, 7.68]]);
    const guard = standingPanel("西侧检修廊在横桥之间的内缘防坠护栏", colors.metal, [[-2.1, 6.68], [2.1, 6.68], [2.1, 7.78], [-2.1, 7.78]], holes, 0, .04); guard.position.x = -8.65; guard.position.z = z; guard.rotation.y = 90; p.push(guard);
  }
  const endGuard = standingPanel("西侧检修廊后端闭合护栏", colors.metal, [[-.5, 6.68], [.5, 6.68], [.5, 7.78], [-.5, 7.78]], [[[-.35, 6.78], [.35, 6.78], [.35, 7.68], [-.35, 7.68]]], 5.4, .04); endGuard.position.x = -9.15; p.push(endGuard);
  return p;
}

function sculptureHall(): ModelPart[] {
  const p: ModelPart[] = [box("雕塑教学厅承重基础", 0, .1, 0, 17, .2, 17, floorColor), doorway("大型雕塑搬运入口", [0, .2, -8.3], 17, 6.2, 3.8, 0, 4.2), box("雕塑厅后端完整墙", 0, 3.3, 8.3, 17, 6.2, .25, wallColor), ...windowBand("雕塑厅西向侧采光", -8.3, 0, 16.6, 6.2, 90), ...windowBand("雕塑厅东向侧采光", 8.3, 0, 16.6, 6.2, 90), polygon("围绕大顶光方井的实体屋盖", dark, [[-8.7, -8.7], [8.7, -8.7], [8.7, 8.7], [-8.7, 8.7]], .3, [0, 6.6, 0], [[[-3, -3], [3, -3], [3, 3], [-3, 3]]]), part("中央大方井透明顶光盖", "box", colors.glass, [0, 6.95, 0], [6.2, .06, 6.2], [0, 0, 0], { opacity: .25 }), cylinder("中央大作品转动台基", 0, .45, 0, 4, .5, wallColor)];
  for (const s of [-1, 1]) p.push(box("雕塑吊运梁承载纵轨", s * 5.5, 5.8, 0, .25, .35, 15.5, dark), ...[-1, 1].map(t => box("吊运轨底与基础相接的柱", s * 5.5, 3, t * 7.5, .3, 5.6, .3, dark)), box("侧边围绕作品的高位观摩步廊", s * 6.8, 2.4, s < 0 ? 2.1 : 0, 2.3, .25, s < 0 ? 11.1 : 15.3, floorColor));
  p.push(box("后端将左右观摩步廊连通的横桥", 0, 2.4, 6.8, 11.4, .25, 1.7, floorColor));
  p.push(box("跨越中央作品区的移动吊运横梁", 0, 5.55, 2.5, 11.4, .3, .35, dark), box("梁下吊装滑车", 0, 5.27, 2.5, .7, .3, .6, dark), rail([0, 5.1, 2.5], [0, 3.8, 2.5], .025, dark));
  for (let i = 0; i < 14; i++) p.push(box("观摩步廊端部上行石阶", -6.8, .2 + (i + 1) * (2.325 / 14) / 2, -7.1625 + i * .275, 1.8, (i + 1) * (2.325 / 14), .275, wallColor));
  for (const x of [-6.8, 6.8]) for (const z of [-2, 1.8, 5.6]) p.push(box("步廊下实体支承", x, 1.2375, z, .2, 2.075, 1.8, wallColor));
  return p;
}

function fireStation(): ModelPart[] {
  const p: ModelPart[] = [
    box("消防站整片承重车库基础", 0, .12, 0, 20, .24, 20, floorColor),
    ...[-1, 1].map(s => box("消防站两侧连续外墙", s * 9.8, 3.7, 0, .3, 7, 19.6, wallColor)),
    box("车库生活楼前段实墙", 3.5, 3.7, -7.2, .25, 7, 5.2, wallColor),
    box("车库生活楼后段实墙", 3.5, 3.7, 4.95, .25, 7, 9.7, wallColor),
    box("通行门上方延接二层的隔墙", 3.5, 5.34, -2.3, .25, 3.76, 4.8, wallColor),
    doorway("生活楼独立人行入口", [6.7, .24, -9.8], 6.2, 7, 1.4),
    box("生活楼完整后墙", 6.7, 3.7, 9.8, 6.2, 7, .3, wallColor),
    box("消防站连续平顶屋盖", 0, 7.5, 0, 20.4, .35, 20.4, dark),
    polygon("滑杆与楼梯真正穿过的夹层楼板", floorColor, [[3.65, -9.5], [9.6, -9.5], [9.6, 9.5], [3.65, 9.5]], .2, [0, 3.5, 0], [[[4.2, -3], [5.6, -3], [5.6, -1.6], [4.2, -1.6]], [[6.65, -9.35], [8.75, -9.35], [8.75, -4.5], [6.65, -4.5]]]),
    cylinder("真正穿过夹层孔的出动滑杆", 4.9, 3.4, -2.3, .12, 6.25, "#ba9d63"),
    box("滑杆下独立柔性落脚坪", 4.9, .36, -2.3, 1.8, .24, 1.8, "#8c9a8b"),
    doorway("车库与落脚区之间真正通行门", [3.5, .24, -2.3], 4.8, 3.2, 1.5, 90, 2.5),
  ];
  for (const z of [-9.8, 9.8]) p.push(box("车道门上部完整过梁", -3.1, 5.2, z, 13.2, 1.2, .35, wallColor), box("车门过梁上方连接屋面的封合墙", -3.1, 6.56, z, 13.2, 1.52, .3, wallColor));
  for (const z of [-9.8, 9.8]) for (const x of [-9.5, -5.1, -.7, 3.3]) p.push(box("各贯通车道门之间实际门墩", x, 2.55, z, .3, 4.62, .35, wallColor));
  for (let i = 0; i < 20; i++) p.push(box("通过真实楼梯孔到达夹层的连续踏阶", 7.7, .24 + (i + 1) * .173 / 2, -9 + i * .23, 1.8, (i + 1) * .173, .23, wallColor));
  p.push(box("车库后方设备清洗浅台", -3, .42, 7.4, 11.5, .36, 1.3, wallColor), box("生活楼二层长工作台", 6.8, 4.45, 5.7, 4.1, .2, 1.2, colors.wood));
  return p;
}
