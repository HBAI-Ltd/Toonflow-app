import { beam, part, ring, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { holesAt, openingWall, postSet, roomWing, tiledRoof } from "./periodPublicSpaceBatchOne";
import { boxBatch, hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { turn } from "./historicSpaceBatchSeven";
import { verticalPanel } from "./historicSpaceBatchNine";

const earth = "#ac8e63", stone = "#a49b83", wood = "#796044", tile = "#6c7566", dark = "#574e3c", iron = "#59635b";

// 北方土城与先秦、武侠片场类型的原创布景，不是同名实景复刻或考古复原。
export const chineseFilmFrontierBatchTwoDesigns: ArchitecturePrototype[] = [
  design("内马道环墙方院夯土边堡", "古装片场 边塞军旅：厚夯土环墙围住驻守院，院东完整实坡与高端转台接通环墙巡路，独立营房面向院子；不同独立马道、山寨正门和折行瓮城", frontierFort, "建筑", "中式"),
  design("中空烟井侧寝燧堡戍屋", "古装片场 边塞军旅：可入戍屋与侧寝围绕真炉腔和贯通烟井，屋面留孔穿出敞口烟塔，外阶接屋顶守望台，烟道不被实心屋盖填死；不同实心燃烟烽台", smokeWatchHouse, "建筑", "中式"),
  design("双栅泊湾卸甲埠水军寨", "古装片场 边塞军旅：岸上分室营房与双臂桩架木埠围住开放泊湾，前方高梁舟口、两侧栅防、卸甲棚和岸后点卯屋连为完整水寨；水面随主体移动，需对齐河岸水位", navalStockade, "建筑", "中式"),
  design("后入双层交错射孔马面敌台", "古装片场 边塞军旅：前突厚台内有上下两间射室，真实内梯穿楼板孔连接二层，两层窄射孔错位，后入门与侧接墙墩相连，不是城门楼换门洞", projectingEnemyTower, "建筑", "中式"),
  design("跨壕落桥侧院值守关门", "古装片场 边塞军旅：真实低壕把前后高岸分开，放下的横木桥有桥轴、牵索与门内绞盘，两侧值守院避开通关主线；静态落桥场景，不包含开合模拟", moatDrawbridgeGate, "建筑", "中式"),
  design("环封土神道地表祭祀陵园", "古装片场 边塞礼制：神道穿享亭通入封土丘外的环行祭道，望柱、前陵门与后方封土分区，环路保留真正入口；仅地表陵园，无地下墓室，不同地宫陵寝和蜂巢墓", burialMoundPrecinct, "建筑", "中式"),
  design("分阶横纵厅战国议事高台", "古装片场 春秋战国：下仪庭经偏置长阶登上高议事台，偏西大堂与东纵厅处在不同台面，独立踏道和护栏保留人物通路；单层木构与宽裸台区别重檐中轴皇宫大殿", warringCouncilTerrace, "建筑", "中式"),
  design("绕风前室半掩土仓牧驿", "古装片场 边塞生活：错门前室挡风后进入半掩土储料仓，背侧土堤实际包住外壁而不塞内室，侧牧圈、饲棚与寝工室围成背风院，不同公文换马双出驿馆", shelteredPastoralPost, "建筑", "中式"),
];

function frontierFort(): ModelPart[] {
  const p:ModelPart[]=[box("边堡院坪",0,.12,0,46,.24,44,stone),verticalPanel("夯土堡前厚门墙",[[-20,0],[20,0],[20,5.76],[-20,5.76]],holesAt([0],3.8,4.2),2.4,[0,.24,-19],0,earth),box("夯土堡后厚墙",0,3.12,19,40,5.76,2.4,earth),box("前墙巡路顶面",0,6.06,-19,42,.12,3,stone),box("后墙巡路顶面",0,6.06,19,42,.12,3,stone),profileBody("内侧落地登墙马道",earth,[[0,.24],[28,.24],[28,6.12]],3,[17.3,0,-15],-90),box("马道高端转台",17.3,3.18,15,3,5.88,4,earth)];
  for(const side of [-1,1]){
    p.push(box("侧夯土厚墙",side*20,3.12,0,2.4,5.76,38,earth),box("侧墙完整巡路面",side*20,6.06,0,3,.12,38,stone),box("外沿巡墙矮垛",side*21.4,6.52,0,.25,.8,40,earth),box("前后巡墙矮垛",0,6.52,side*20.4,42,.8,.25,earth));
  }
  for(const x of [15.75,18.85])p.push(profileBody("马道随坡护墙",earth,[[0,.24],[28,6.12],[28,7.12],[0,1.24]],.18,[x,0,-15],-90));
  p.push(box("高端转台北挡",17.3,6.62,16.9,3,1,.18,earth),box("营房基础接院坪",-5,.33,7,19,.18,10.5,stone),...turn(roomWing(18,3,1),0,[-5,0,7]),box("前值房基础",-10,.33,-7,9,.18,10.5,stone),...turn(roomWing(8,1,1),0,[-10,0,-7]));
  const frontCrenels:Triple[]=[],sideCrenels:Triple[]=[];
  for(let i=0;i<15;i++){const q=-19.6+i*2.8;frontCrenels.push([q,7.17,-20.4],[q,7.17,20.4]);sideCrenels.push([-21.4,7.17,q],[21.4,7.17,q]);}
  p.push(...boxBatch("前后墙独立垛头",earth,frontCrenels,[1.15,.5,.4]),...boxBatch("侧墙独立垛头",earth,sideCrenels,[.4,.5,1.15]),box("前门木楣",0,4.51,-20.25,4.5,.25,.35,wood),box("院中点卯案",0,.74,-2,3.5,1,1.1,wood));
  return p;
}

function smokeWatchHouse(): ModelPart[] {
  const smokeHole:[number,number][][]=[[[.8,-.2],[3.2,-.2],[3.2,2.2],[.8,2.2]]];
  const p:ModelPart[]=[box("戍屋外坪",-2,.12,0,27,.24,20,stone),openingWall("戍屋前门与窄窗",14,3.28,[...holesAt([-3],1.6,2.55),...holesAt([1],1.3,.7,1.6)],[-3,.24,-5],0,earth),openingWall("戍屋后高窗",14,3.28,holesAt([-5,0,5],1,.65,1.8),[-3,.24,5],0,earth),hardPlan("守望屋面让出真实烟井",earth,[[-10,-5],[4,-5],[4,5],[-10,5]],.24,[0,3.52,0],smokeHole),openingWall("烟井正面真炉口",2.4,6,holesAt([0],.8,.9,.1),[2,.24,-.2],0,stone),box("烟井背壁",2,3.24,2.2,2.4,6,.3,stone),box("炉底承柴盘",2,.34,1,1.8,.2,1.8,dark),hardPlan("烟塔敞口压圈",stone,[[.5,-.5],[3.5,-.5],[3.5,2.5],[.5,2.5]],.2,[0,6.24,0],[[[1.1,.1],[2.9,.1],[2.9,1.9],[1.1,1.9]]]),riseSteps("外登阶下段",.24,2,9,.3,1.8,[-11.5,0,-4]),riseSteps("外登阶上段",2,3.76,9,.3,1.8,[-11.5,0,-1.3]),box("阶顶转入屋面的石桥",-10.35,3.66,2.3,2.3,.2,1.8,stone),box("石桥外端落地承墩",-11.5,1.88,2.3,1.8,3.76,1.8,stone),box("戍屋侧寝木台",-6,.59,2.5,3,.7,2.2,wood),box("粮水物柜",-8.8,1.24,-.5,.8,2,2.5,wood)];
  for(const x of [-10,4])p.push(openingWall("戍屋侧采光墙",10,3.28,holesAt([0],1.2,.65,1.8),[x,.24,0],90,earth));
  for(const x of [.8,3.2])p.push(box("贯通烟井侧壁",x,3.24,1,.3,6,2.4,stone));
  for(const z of [-5.1,5.1])p.push(box("守望台前后护墙",-3,4.26,z,14.4,1,.2,earth));
  p.push(box("守望台东护墙",4.1,4.26,0,.2,1,10,earth));
  for(const [a,b]of [[-5.1,1],[3.4,5.1]])p.push(box("守望台西沿让梯口",-10.1,4.26,(a!+b!)/2,.2,1,b!-a!,earth));
  for(const side of [-1,1])p.push(beam("外登阶实侧栏",wood,[-11.5+side*.88,1.24,-4],[-11.5+side*.88,4.76,1.4],.1));
  const railPosts:Triple[]=[];
  for(const side of [-1,1])for(const k of [0,5,10,15,17])railPosts.push([-11.5+side*.88,.24+3.52*(k+1)/18+.465,-4+(k+.5)*.3]);
  p.push(...boxBatch("外阶扶栏落阶足",wood,railPosts,[.1,.93,.1]));
  return p;
}

function navalStockade(): ModelPart[] {
  const p:ModelPart[]=[box("水寨岸上共用坪",0,.12,12,42,.24,22,earth),box("泊湾浅底",0,.025,-9,42,.05,20,stone),part("水寨共移静态水面","box","#74958d",[0,.11,-9],[41,.025,20],[0,0,0],{opacity:.7}),box("卸甲埠横向木台",0,.5,0,27,.2,3.5,wood),profileBody("岸坪上木埠实坡",wood,[[0,.24],[1.2,.24],[1.2,.6]],2.4,[8,0,2.95],90),box("后营房石脚",0,.33,16,19,.18,10.5,stone),...turn(roomWing(18,3,1),0,[0,0,16]),box("卸甲棚石脚",0,.33,6,13,.18,10.5,stone),...turn(roomWing(12,1,1),0,[0,0,6]),box("卸甲搁具长台",0,.92,6,6,1,1.4,wood),box("舟口承门高梁",0,4.1,-14.5,22,.3,.4,wood)];
  const piles:Triple[]=[],fence:Triple[]=[];
  for(const side of [-1,1]){
    p.push(box("双臂泊湾桩架木埠",side*12,.5,-5.5,2.8,.2,19,wood),box("埠外沿防护横木",side*13.3,1.6,-5.5,.16,.12,19,wood),cylinder("舟口通高门柱",side*10.5,2.13,-14.5,.35,4.26,wood));
    for(const a of [-.9,.9])p.push(box("纵埠桩顶通梁",side*12+a,.3,-5.5,.25,.4,19,wood));
    for(let z=-14.5;z<=4;z+=3.7)for(const a of [-.9,.9])piles.push([side*12+a,.25,z]);
    for(let z=-14.5;z<=3.5;z+=.6)fence.push([side*13.3,1.6,z]);
    for(let z=4;z<=22;z+=.6)fence.push([side*20,1.24,z]);
    p.push(box("后营侧界横木",side*20,1.8,13,.14,.14,18,wood));
  }
  for(let x=-20;x<=20;x+=.6)fence.push([x,1.24,22]);
  for(const z of [-1.1,1.1]){p.push(box("横埠桩顶通梁",0,.3,z,27,.4,.25,wood));for(const x of [-12,-6,0,6,12])piles.push([x,.25,z]);}
  p.push(...boxBatch("木埠落底实桩",wood,piles,[.35,.5,.35]),...boxBatch("水寨透空栅杆",wood,fence,[.14,2,.14]),box("后营界横木",0,1.8,22,40,.14,.14,wood));
  return p;
}

function projectingEnemyTower(): ModelPart[] {
  const p:ModelPart[]=[box("马面敌台落地坪",0,.12,0,21,.24,19,stone),hardPlan("二层射室留真阶井",wood,[[-5,-6],[5,-6],[5,3],[-5,3]],.2,[0,3.34,0],[[[-3.8,-5.2],[-2.2,-5.2],[-2.2,.4],[-3.8,.4]]]),box("敌台平厚顶",0,6.74,-1.5,10.8,.2,9.8,earth),riseSteps("敌台内阶下段",.24,1.89,8,.35,1.4,[-3,0,-5.2]),riseSteps("敌台内阶上段",1.89,3.54,8,.35,1.4,[-3,0,-2.4]),verticalPanel("两层交错前射孔",[[-5,0],[5,0],[5,6.4],[-5,6.4]],[...holesAt([-3,0,3],.28,.9,1),...holesAt([-1.5,1.5],.28,.9,4.3)],.6,[0,.24,-6],0,earth),verticalPanel("后入门与二层气窗",[[-5,0],[5,0],[5,6.4],[-5,6.4]],[...holesAt([2.8],1.5,2.65),...holesAt([-3,0,3],.45,.75,4.3)],.6,[0,.24,3],0,earth)];
  for(const side of [-1,1]){
    p.push(verticalPanel("马面侧向分层射孔",[[-4.5,0],[4.5,0],[4.5,6.4],[-4.5,6.4]],[...holesAt([-2,1],.28,.9,1),...holesAt([-1,2],.28,.9,4.3)],.6,[side*5,.24,-1.5],90,earth),box("后接短城墙墩",side*7.2,2.24,3,4.4,4,1.4,earth),box("射室间地梁承托",side*4.65,3.24,-1.5,.3,.2,9,wood),box("阶井边落板护栏",-3+side*.88,4.04,-2.4,.1,1,5.6,wood),box("敌台分层外压带",0,3.5,side<0?-6.35:3.35,10.5,.18,.16,stone));
  }
  p.push(box("阶井低端护栏",-3,4.04,-5.3,1.85,1,.12,wood),box("一层靠墙守具箱",2,.64,-4,2.2,.8,1.2,wood),box("上层射室矮坐台",2.7,3.79,1.2,2,.5,1.1,wood));
  return p;
}

function moatDrawbridgeGate(): ModelPart[] {
  const p:ModelPart[]=[box("落桥前高岸",0,.7,-14,36,1.4,8,earth),box("关门后高岸",0,.7,7,36,1.4,22,earth),box("真实城壕低底",0,.06,-7,36,.12,6,stone),part("城壕静态低水","box","#75958b",[0,.26,-7],[36,.035,5.8],[0,0,0],{opacity:.75}),box("放下的跨壕整桥",0,1.27,-7,4.2,.26,6.2,wood),cylinder("关岸端桥轴",0,1.3,-3.95,.26,4.8,iron,[0,0,90]),openingWall("关门前真实车道",14,4,holesAt([0],4,3.4),[0,1.4,-3],0,earth),openingWall("关门后真实车道",14,4,holesAt([0],4,3.4),[0,1.4,4],0,earth),tiledRoof("关门单层瓦盖",14,7,5.4,[0,.5],tile),cylinder("门内牵桥绞盘轴",0,4.9,-3.3,.35,5,wood,[0,0,90]),box("值守院基础石坪",-11,1.31,10,8,.18,10,stone),...turn(roomWing(7,1,1),0,[-11,.98,10]),openingWall("关后院后人行门",35,3,holesAt([0],3,2.8),[0,1.4,17],0,earth),profileBody("前岸落地接路坡",earth,[[0,0],[5,0],[5,1.4]],5,[0,0,-23],-90)];
  for(const side of [-1,1])p.push(openingWall("关门侧高气窗",7,4,holesAt([0],1.3,.8,2),[side*7,1.4,.5],90,earth),beam("桥端牵引实索",iron,[side*2,1.44,-9.8],[side*2,4.8,-3.5],.045),box("跨壕桥边护栏",side*2.05,1.95,-7,.12,1,6,wood),box("后院侧界",side*17,2.9,8,.3,3,18,earth));
  return p;
}

function burialMoundPrecinct(): ModelPart[] {
  const outer=Array.from({length:24},(_,i):[number,number]=>[Math.sin(i*Math.PI/12)*12.5,11+Math.cos(i*Math.PI/12)*12.5]);
  const inner=Array.from({length:24},(_,i):[number,number]=>[Math.sin(i*Math.PI/12)*9,11+Math.cos(i*Math.PI/12)*9]);
  const p:ModelPart[]=[box("陵园整片地坪",0,.12,0,40,.24,54,stone),hardPlan("封土外环行祭道",stone,outer,.1,[0,.24,0],[inner]),part("地表实心封土丘","lathe",earth,[0,.24,11],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:8,y:0},{x:7,y:3.5},{x:5,y:5.4},{x:0,y:5.8}]}),ring("封土脚石护圈",stone,8.6,.35,.64,.8,{position:{x:0,y:.64,z:11}}),openingWall("前陵门真通口",34,3.6,holesAt([0],3.5,3.1),[0,.24,-24],0,earth),tiledRoof("陵门短瓦盖",6,1.6,3.84,[0,-24],tile),tiledRoof("神道享亭瓦盖",14,6,3.64,[0,-8],tile),postSet("享亭落地承柱",[-6.3,6.3].flatMap(x=>[[x,-10.5],[x,-5.5]] as [number,number][]),3.4,.24),box("享亭祭台",0,.69,-7.5,3,.9,1.2,stone)];
  for(const side of [-1,1]){
    p.push(box("陵园侧界低墙",side*18,1.24,0,.3,2,48,earth));
    for(const z of [-17,-12])p.push(cylinder("神道石望柱础",side*4.5,.49,z,1.6,.5,stone),cylinder("神道石望柱",side*4.5,2.44,z,.7,3.4,stone),part("望柱方帽","box",stone,[side*4.5,4.24,z],[1.15,.2,1.15]));
  }
  for(let k=0;k<24;k++)if(k<10||k>13){const a=k*Math.PI/12,b=(k+1)*Math.PI/12;p.push(beam("环祭道外护木",wood,[Math.sin(a)*12.35,.94,11+Math.cos(a)*12.35],[Math.sin(b)*12.35,.94,11+Math.cos(b)*12.35],.1));}
  const posts:Triple[]=[];for(let k=0;k<24;k++)if(k<10||k>14)posts.push([Math.sin(k*Math.PI/12)*12.35,.64,11+Math.cos(k*Math.PI/12)*12.35]);
  p.push(...boxBatch("环道实承护木足",wood,posts,[.12,.6,.12]),box("陵园后界低墙",0,1.24,25,36,2,.3,earth));
  return p;
}

function warringCouncilTerrace(): ModelPart[] {
  const p:ModelPart[]=[box("议台前埕",0,.12,0,42,.24,44,stone),box("下层仪庭厚台",0,.72,3,32,.96,28,earth),box("偏西高议事台",-5,2.4,6,18,2.4,18,earth),riseSteps("前埕上仪庭偏阶",.24,1.2,5,.4,3.2,[-8,0,-13]),riseSteps("仪庭登高台长阶",1.2,3.6,12,.4,3.2,[-5,0,-7.8]),openingWall("高堂三路真门",16,4.2,holesAt([-5,0,5],2,3.2),[-5,3.6,3],0,wood),openingWall("高堂后窄采光",16,4.2,holesAt([-5,0,5],1.2,1.1,2),[-5,3.6,13],0,earth),tiledRoof("议事高堂单层瓦盖",16,10,7.8,[-5,8],tile),openingWall("东纵厅前门",8,3.4,holesAt([0],2,2.8),[9,1.2,-2],0,wood),openingWall("东纵厅后窗",8,3.4,holesAt([-2,2],1.1,1.2,1.2),[9,1.2,14],0,earth),tiledRoof("东纵厅独立低屋盖",8,16,4.6,[9,6],tile),box("高堂议事木案",-5,4.15,10,4.5,1.1,1.5,wood),box("东厅侧长案",10.5,1.7,7,1.2,1,7,wood)];
  for(const side of [-1,1])p.push(openingWall("高堂侧透窗厚壁",10,4.2,holesAt([-2.5,2.5],1.2,1.1,2),[-5+side*8,3.6,8],90,earth),openingWall("东纵厅侧采光",16,3.4,holesAt([-5,0,5],1.1,1.1,1.3),[9+side*4,1.2,6],90,earth),box("高堂前承檐枋",-5,7.72,side<0?3:13,16.3,.2,.3,wood));
  p.push(postSet("高堂前后承柱",[-12.5,-7.5,-2.5,2.5].flatMap(x=>[[x,3],[x,13]] as [number,number][]),4.2,3.6));
  for(const [a,b]of [[-14,-6.8],[-3.2,4]])p.push(box("高台前沿让长阶",(a!+b!)/2,4.1,-3,b!-a!,1,.18,earth));
  for(const x of [-14,4])p.push(box("高台侧沿护墙",x,4.1,6,.18,1,18,earth));
  p.push(box("高台后沿护墙",-5,4.1,15,18,1,.18,earth));
  for(const x of [-16,16])p.push(box("仪庭侧沿护墙",x,1.6,3,.18,.8,28,earth));
  for(const [a,b]of [[-16,-9.8],[-6.2,16]])p.push(box("仪庭前沿让登阶",(a!+b!)/2,1.6,-11,b!-a!, .8,.18,earth));
  p.push(box("仪庭后沿护墙",0,1.6,17,32,.8,.18,earth));
  return p;
}

function shelteredPastoralPost(): ModelPart[] {
  const p:ModelPart[]=[box("牧驿背风院坪",0,.12,0,35,.24,31,stone),openingWall("错门挡风前室入口",7,2.8,holesAt([-2],1.4,2.4),[-5,.24,-10],0,earth),openingWall("料仓接前室偏门",13,3,holesAt([2],1.4,2.5),[-5,.24,-5],0,earth),box("挡风室平厚顶",-5,3.14,-7.5,7.4,.2,5.4,earth),box("料仓后掩土厚墙",-5,1.74,7,13,3,.4,earth),box("料仓西掩土厚墙",-11.5,1.74,1,.4,3,12,earth),openingWall("料仓东侧高风窗",12,3,holesAt([0],1.6,.45,2.1),[1.5,.24,1],90,earth),box("低仓覆土厚顶",-5,3.34,1,13.6,.2,12.6,earth),profileBody("西侧真包围土堤",earth,[[-3,0],[0,0],[0,3.4],[-.6,3.8]],12,[-11.5,.24,1]),profileBody("后侧真包围土堤",earth,[[-4,0],[0,0],[0,3.4],[-.6,3.8]],13,[-5,.24,7],90),box("寝工室石脚",-12.5,.33,-8,6,.18,10,stone),...turn(roomWing(5,1,1),0,[-12.5,0,-8]),tiledRoof("牧圈后饲草棚",8,4,3.3,[10,7],tile),postSet("饲棚实承木柱",[[6.5,5.4],[13.5,5.4],[6.5,8.6],[13.5,8.6]],3.06,.24),box("牧圈后饲槽",10,.69,8,6,.9,.8,wood)];
  for(const x of [-8.5,-1.5])p.push(box("挡风前室侧墙",x,1.64,-7.5,.3,2.8,5,earth));
  for(const x of [-9,-2])p.push(box("仓内离地垫料台",x,.54,2,3.4,.6,6,wood),box("垫台上闭合料垛",x,1.39,2,3.1,1.1,5.7,"#b6a077"));
  const fence:Triple[]=[];
  for(let z=-7;z<=10;z+=.6)for(const x of [5,15])fence.push([x,1.14,z]);
  for(let x=5;x<=15;x+=.6){if(x<8||x>11)fence.push([x,1.14,-7]);fence.push([x,1.14,10]);}
  p.push(...boxBatch("牧圈透空围栏足",wood,fence,[.12,1.8,.12]));
  for(const x of [5,15])p.push(box("牧圈侧横栅",x,1.6,1.5,.12,.12,17,wood));
  p.push(box("牧圈后横栅",10,1.6,10,10,.12,.12,wood));
  for(const x of [6.5,13])p.push(box("牧圈门旁横栅",x,1.6,-7,3,.12,.12,wood));
  return p;
}
