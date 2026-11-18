import { part, ring, type ModelPart } from "../assetModelParts";
import { arch, box, cylinder, design, rail, type ArchitecturePrototype } from "./structures";
import { holesAt, openingWall, roomWing, tiledRoof } from "./periodPublicSpaceBatchOne";
import { turn } from "./historicSpaceBatchSeven";
import { hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";

const stone = "#a9a797", plaster = "#c3b99e", red = "#965647", wood = "#70563d", tiles = "#586d66", bronze = "#8d8053";

// 原创简化影视布景，各条为不同的完整空间与承力结构，不绑定具体寺观或朝代。
export const chineseTempleBatchOneDesigns: ArchitecturePrototype[] = [
  design("转轮经藏内井双层藏经楼", "中式古代古装剧寺院藏经楼，楼板中央真实开井围住贯通实轴转轮经藏，侧梯接到二层检修环廊，外门与四面透窗可直接进入", scriptureLibrary, "建筑", "中式"),
  design("四向登阶三层石砌戒坛", "中式古代古装剧寺院仪式戒坛，三层逐级收分石台围出连续环行带，四向外踏道分别接入台面，不是普通殿堂换祭品", ordinationTerrace, "建筑", "中式"),
  design("前斋后灶偏院寺院斋堂", "中式古代古装剧寺院生活空间，前部通门长餐堂和后侧灶间各有独立屋盖，侧院连通送餐口与柴灶烟道，非普通正殿改招牌", monasteryRefectory, "建筑", "中式"),
  design("崖壁前廊三龛石窟佛殿", "中式古代古装剧山寺石窟，岩体承接连续拱券内室，前柱廊与三处可见后壁佛龛相连，真实开口不以实心石块贴黑色洞口", caveShrine, "建筑", "中式"),
  design("斜托悬台沿崖栈桥寺", "中式古代古装剧悬崖山寺，木殿悬台由接入实崖的斜托承住，外缘栈桥连通侧登阶，崖面与殿门之间保留真实通行空间", cliffMonastery, "建筑", "中式"),
  design("回廊方庭分室僧寮院", "中式古代古装剧僧人居住院，三边独立寝室与连续外廊围住方庭，前门偏开并以照壁分流，分室真实房门区别只有景观的禅修庭园", monasticCells, "建筑", "中式"),
  design("环炉夹道排烟炼丹房", "中式古代古装剧道观作业建筑，中央大型三足炉与周回操作夹道位于开井排烟屋盖下，后置药材间独立开门，包含完整炉房而非大殿换神像", alchemyWorkshop, "建筑", "中式"),
];

function scriptureLibrary(): ModelPart[] {
  const p: ModelPart[] = [box("藏经楼落地高台", 0, .3, 0, 15, .6, 15), openingWall("藏经楼真实正门与两侧窗", 12, 7.2, [...holesAt([0], 2.4, 3), ...holesAt([-4,4], 1.5, 1.7, 1.2), ...holesAt([-4,0,4], 1.5, 1.7, 4.8)], [0,.6,-6], 0, plaster), openingWall("藏经楼后壁上下真实采光窗", 12, 7.2, [...holesAt([-4,0,4], 1.5,1.7,1.2), ...holesAt([-4,0,4],1.5,1.7,4.8)], [0,.6,6],0,plaster), tiledRoof("藏经楼独立灰瓦屋盖",14,14,7.8,[0,0],tiles)];
  for (const side of [-1,1]) p.push(openingWall("经楼侧壁上下采光窗",12,7.2,[...holesAt([-3,3],1.5,1.7,1.2),...holesAt([-3,3],1.5,1.7,4.8)],[side*6,.6,0],90,plaster));
  p.push(hardPlan("二层楼板中央留出转轮经藏内井",wood,[[-6,-6],[6,-6],[6,6],[-6,6]],.22,[0,4,0],[[[-2.4,-2.4],[2.4,-2.4],[2.4,2.4],[-2.4,2.4]],[[-5.65,-5.7],[-4.15,-5.7],[-4.15,-2.1],[-5.65,-2.1]]]), cylinder("接入楼台与经藏顶座的完整转轮轴",0,4.2,0,.25,7.2,wood), cylinder("转轮经藏下方实承转盘",0,1,0,3.8,.5,wood), part("上下相接且实际围绕中心轴的立式经藏", "cylinder", red,[0,3.2,0],[3.5,4,3.5]), cylinder("经藏顶端承轴座",0,5.45,0,.5,.5,bronze));
  for (let side=0;side<8;side++) { const a=side*Math.PI/4; p.push(box("转轮经藏外壁通长分柜竖框",Math.cos(a)*1.72,3.2,Math.sin(a)*1.72,.12,4.05,.12,wood)); }
  for (const y of [1.5,2.7,3.9,5.1]) p.push(ring("经藏外周实际柜格分层压圈",wood,1.79,.08,y,.12));
  p.push(riseSteps("楼内侧梯在楼板开口实接二层",.6,4.22,12,.3,1.3,[-4.9,0,-5.7]), riseSteps("经楼门前真实登台阶",0,.6,3,.35,2.8,[0,0,-8.55]));
  for(const side of [-1,1]) p.push(box("二层井边连接楼板的防护围板",side*2.5,4.7,0,.12,1,5,wood),box("二层井边前后护板",0,4.7,side*2.5,5,.12,.12,wood));
  return p;
}

function ordinationTerrace(): ModelPart[] {
  const p: ModelPart[] = [box("戒坛完整落地基坪",0,.12,0,30,.24,30,stone),box("戒坛第一重实心台",0,.6,0,22,.72,22,stone),box("戒坛第二重实心台",0,1.35,0,15,.78,15,stone),box("戒坛第三重中央仪式台",0,2.1,0,8,.72,8,stone)];
  for (const yaw of [0,90,180,270]) {
    p.push(...turn([riseSteps("地坪接第一层的实际宽踏道",.24,.96,4,.38,3.8,[0,0,-12.52]),riseSteps("第一层接第二层的宽踏道",.96,1.74,4,.4,3.4,[0,0,-9.1]),riseSteps("第二层接中央坛面的宽踏道",1.74,2.46,4,.38,3,[0,0,-5.52])],yaw,[0,0,0]));
    for (const x of [-8.5,8.5]) p.push(...turn([box("第一重坛外缘不挡台阶的石栏板",x,1.43,-10.7,4.7,.94,.18,stone)],yaw,[0,0,0]));
  }
  p.push(cylinder("中央可站立的圆形仪式石盘",0,2.52,0,4,.12,stone));
  return p;
}

function monasteryRefectory(): ModelPart[] {
  const p: ModelPart[]=[box("斋堂厨房和服务院共用地坪",0,.21,0,29,.42,29,stone),openingWall("斋堂前壁实际双入口",24,3.7,holesAt([-7,7],2,2.8),[0,.42,-10],0,plaster),openingWall("餐堂后壁的送餐与回收双门",24,3.7,holesAt([-7,7],2,2.8),[0,.42,0],0,plaster),tiledRoof("长斋堂连续灰瓦屋顶",24,10,4.12,[0,-5],tiles)];
  for(const side of [-1,1]) p.push(openingWall("斋堂两端真实透窗墙",10,3.7,holesAt([-2.5,2.5],1.5,1.5,1.2),[side*12,.42,-5],90,plaster));
  for(const x of [-8,-3,3,8]) for(const z of [-7.5,-3]) {
    p.push(box("斋堂长案完整厚木桌面",x,1.28,z,3.6,.12,.7,wood));
    for(const side of [-1,1]) p.push(box("长案真实落地并接桌面的板足",x+side*1.4,.82,z,.16,.8,.6,wood),box("斋堂长案两侧落地坐凳",x,.65,z+side*.8,3.7,.46,.35,wood));
  }
  p.push(...turn(roomWing(14,2,1),0,[0,0,9]));
  for(const x of [-4,4])p.push(box("后厨房独立灶台",x,1.02,10,3,1.2,1.5,stone),cylinder("灶口上实际承放大锅",x,1.68,10,1.4,.18,bronze),box("厨房烟道从灶后穿出屋顶",x,3.1,11,.5,5.36,.5,plaster));
  p.push(box("前堂后灶间接通两门的服务廊板",0,.47,2.5,23,.1,5,stone));
  return p;
}

function caveShrine(): ModelPart[] {
  const p: ModelPart[]=[box("石窟前庭完整石基",0,.25,0,24,.5,20,stone),box("石窟厚实岩体后壁",0,4.5,5.7,21,8,1.2,stone),box("洞室券顶上完整岩体",0,7.55,3,21,1.9,6.6,stone)];
  for(const x of [-7,0,7]) { const value=arch(x,3,2.4,3.2,6,.6);value.position.y=.5;p.push(value);p.push(box("佛龛内实际落地承台",x,1,4.55,3.1,1,1.7,stone),cylinder("龛内简化莲座",x,1.68,4.55,2.3,.36,stone),part("莲座上的简化坐像躯身","sphere",bronze,[x,2.65,4.55],[1.2,1.7,1]),part("坐像实际连接躯身的头部","sphere",bronze,[x,3.6,4.55],[.7,.8,.7])); }
  for(const x of [-10,-3.5,3.5,10])p.push(box("三拱之间实际承接岩顶的石墩",x,4.25,3,Math.abs(x)>9?1:1.1,7.5,6,stone));
  for(const x of [-9,-3,3,9])p.push(cylinder("前廊由石坪承到岩檐的石柱",x,3.25,-2,.45,5.5,stone));
  p.push(box("前柱廊完整实承横石梁",0,6,-2,19,.5,.7,stone),tiledRoof("石窟入口前廊独立灰瓦挑檐",21,5,6.25,[0,-2],tiles),riseSteps("前庭低台接洞口石面的宽阶",0,.5,3,.4,5,[0,0,-11.2]));
  return p;
}

function cliffMonastery(): ModelPart[] {
  const p: ModelPart[]=[box("山寺背后完整落地峭壁",0,6.5,5,23,13,3,stone),box("实际嵌入崖壁的高悬木平台",0,6.5,.9,19,.35,9,wood),openingWall("崖寺前殿真实入口与窗",16,3.5,[...holesAt([0],2.2,2.8),...holesAt([-5,5],1.4,1.4,1.2)],[0,6.675,-2.5],0,plaster),tiledRoof("沿崖寺殿连续灰瓦屋盖",18,7,10.175,[0,1],tiles)];
  for(const side of [-1,1])p.push(box("山寺两端实接崖壁的山墙",side*8,8.425,1,.28,3.5,7,plaster));
  for(const x of [-8,-4,0,4,8])p.push(rail([x,.8,3.6],[x,6.35,-3.2],.28,wood),box("木平台深入石崖的实际横托梁",x,6.18,.7,.3,.3,9.2,wood));
  p.push(box("高悬平台外缘长栈桥",0,6.575,-4,22,.2,2,wood));
  for(const x of [-8.8,-5,0,5,10])p.push(cylinder("栈桥护栏真实接到桥板的木立柱",x,7.2,-4.9,.12,1.05,wood));
  p.push(box("栈桥外缘连续扶手",.6,7.72,-4.9,18.8,.1,.12,wood),...turn([riseSteps("地面登向高崖栈桥的前半石阶",0,3.34,13,.38,1.7,[0,0,-14.88]),riseSteps("高台接栈桥面的后半石阶",3.34,6.675,13,.38,1.7,[0,0,-9.94])],0,[-10,0,0]));
  return p;
}

function monasticCells(): ModelPart[] {
  const p: ModelPart[]=[box("僧寮分室与天井共用完整基坪",0,.21,0,29,.42,33,stone),...turn(roomWing(22,4,1),0,[0,0,11]),...turn(roomWing(18,3,1),-90,[-10,0,-3]),...turn(roomWing(18,3,1),90,[10,0,-3]),openingWall("僧院前壁独立偏门与通行小门",26,2.7,holesAt([-7,7],2,2.5),[0,.42,-14],0,plaster),box("天井前段不封旁路的独立照壁",0,1.7,-10,7,2.56,.35,plaster)];
  p.push(tiledRoof("照壁上方独立低瓦压顶",7,1,2.98,[0,-10],tiles));
  for(const x of [-8,-3,3,8]) p.push(box("后列僧房内实际落地的床榻",x,.76,12,2.9,.68,1.2,wood));
  return p;
}

function alchemyWorkshop(): ModelPart[] {
  const p: ModelPart[]=[box("炼丹房和后药间完整石坪",0,.3,0,19,.6,24,stone),openingWall("丹房正面真实宽作业门",16,4.8,holesAt([0],3,3.5),[0,.6,-7],0,plaster),openingWall("丹房后壁通向药间的偏门",16,4.8,holesAt([-4,0,4],1.1,2.5),[0,.6,7],0,plaster)];
  for(const side of [-1,1])p.push(openingWall("炼丹房两侧高位排气透窗",14,4.8,holesAt([-3,3],2.4,1.5,2.7),[side*8,.6,0],90,plaster));
  p.push(hardPlan("中央烟井保持真实开口的平梁屋盖",tiles,[[-8.6,-7.6],[8.6,-7.6],[8.6,7.6],[-8.6,7.6]],.24,[0,5.4,0],[[[-1.4,-1.4],[1.4,-1.4],[1.4,1.4],[-1.4,1.4]]]),ring("烟井上方实际接屋面的围边",stone,1.6,.25,5.94,.6),cylinder("三足炉下完整防火圆石座",0,.8,0,4.4,.4,stone));
  for(let i=0;i<3;i++){const a=i*Math.PI*2/3;p.push(cylinder("炉底通向防火石座的独立支足",Math.cos(a)*1.1,1.34,Math.sin(a)*1.1,.35,.7,bronze));}
  p.push(part("三足炉完整圆腹及上收炉颈","lathe",bronze,[0,1.6,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:1.1,y:0},{x:1.55,y:.6},{x:1.35,y:1.7},{x:.7,y:2.1},{x:.7,y:2.35},{x:0,y:2.35}]}),cylinder("炉颈上实际接向烟井的排烟立管",0,4.7,0,.7,1.6,bronze),...turn(roomWing(12,3,1),0,[0,0,10]));
  return p;
}

