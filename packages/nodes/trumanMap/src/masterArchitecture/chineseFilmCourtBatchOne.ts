import { part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch, hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { turn } from "./historicSpaceBatchSeven";
import { holesAt, openingWall, postSet, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b9b39e", wall = "#c9bea4", red = "#995240", wood = "#785439", dark = "#514538", tile = "#677368", gold = "#b89959", water = "#799c97";
const floor = .3;

export const chineseFilmCourtBatchOneDesigns: ArchitecturePrototype[] = [
  design("双梯门楼跨庭架空宫城复道", "古装片场 宫廷府邸：两端门楼各有真实内梯井接高架复道，上层桥廊有连续护栏，桥下宫庭保留穿行空间，适合宫廷传召与追逐拍摄", elevatedPassage, "建筑", "中式"),
  design("折屏双闸宫墙值守夹道", "古装片场 宫廷府邸：两条高宫墙围出长夹道，前后错位闸门由折屏分流，侧值房双门横穿并设兵器架与值案，适合巡守和内廷出入", guardedLane, "建筑", "中式"),
  design("前召见后藏书侧批阅御书房", "古装片场 宫廷府邸：宽敞前召见厅通窄长后藏书间，侧批阅室与书库各有独立真门，书格、御案和旁听席分区，便于召见与批阅拍摄", imperialStudy, "建筑", "中式"),
  design("密议中厅夹签押房军机值所", "古装片场 宫廷府邸：中部窄长密议厅与东档签间、西通传廊并列，传签窗和偏置门把通报、候旨与议事路线分开，设地图案和文档架", councilOffice, "建筑", "中式"),
  design("前检拣侧蒸制后晾药御药炮制院", "古装片场 宫廷府邸：前检拣房、东蒸制炉房和后敞风晾药架围作业院，药案、蒸笼、碾药台和药材柜形成检拣炮制流程，非诊疗医馆", medicineWorks, "建筑", "中式"),
  design("双灶间中传膳廊御膳院", "古装片场 宫廷府邸：东西双灶房之间留中央传膳廊，前配膳间设分餐长案，灶房独立进出并有真炉口和穿屋烟道，适合后厨备膳场景", palaceKitchen, "建筑", "中式"),
  design("前祭台侧绕行后藏主宗庙祭殿", "古装片场 宫廷府邸：低前祭台接高祖庙殿，中央供案与双侧绕行通道通到独立后藏主室，神主柜与前祭区分隔，适合祭祖礼仪拍摄", ancestralHall, "建筑", "中式"),
  design("丁字仪厅分宾内双庭王府", "古装片场 宫廷府邸：前横仪厅接后纵仪室形成丁字主体，西宾客院和东内眷院分门进入，东西房与后家政路互通，适合王府仪事及内宅拍摄", princelyResidence, "建筑", "中式"),
  design("侧梯登绣阁公主别院", "古装片场 宫廷府邸：首层侍坐厅与二层绣作、内寝分开，侧内梯穿真实梯井到达带围栏晒廊，绣架、妆案与帷床构成可入拍摄空间", embroideryResidence, "建筑", "中式"),
  design("分宾主双门相府议客厅", "古装片场 宫廷府邸：前庭双门分开宾客与内眷入场，长议客厅后屏隔出内厅，东侧独立密谈室和西抄手游廊可绕行，适合会客与密议", ministerReception, "建筑", "中式"),
  design("曲折水岸侧炕台府园暖阁", "古装片场 宫廷府邸：曲尺暖阁沿独立浅池转折，侧炕台与后茶座面对两向透景窗，入口雨廊与观水步岸连通，局部水面随整屋移动", watersideWarmRoom, "建筑", "中式"),
  design("双院分工下人灶洗院", "古装片场 宫廷府邸：贯通侧巷串联洗衣院与后灶院，寝工长屋分为通铺及备物室，洗槽、柴棚与灶口各自留工作通道，适合家政生活戏", servantsServiceCourt, "建筑", "中式"),
];

function table(name: string, x: number, z: number, width: number, depth: number, base = floor, height = .85): ModelPart[] {
  const legs: Triple[] = [-1,1].flatMap(a=>[-1,1].map(b=>[x+a*(width/2-.15),base+(height-.12)/2,z+b*(depth/2-.12)] as Triple));
  return [box(`${name}案面`,x,base+height-.06,z,width,.12,depth,wood),...boxBatch(`${name}实承案足`,wood,legs,[.13,height-.12,.14])];
}

function bookcase(name: string, x: number, z: number, width: number, height = 2.5, base = floor): ModelPart[] {
  const p=[box(`${name}背板`,x,base+height/2,z,width,height,.14,wood)];
  p.push(...boxBatch(`${name}竖格`,wood,[-1,0,1].map(s=>[x+s*(width/2-.06),base+height/2,z-.3]),[.12,height,.6]));
  p.push(...boxBatch(`${name}层板`,wood,[0,1,2,3].map(i=>[x,base+.06+i*(height-.12)/3,z-.3]),[width,.12,.6]));
  p.push(...boxBatch(`${name}书匣`,gold,[-1,1].flatMap(s=>[0,1,2].map(i=>[x+s*width*.23,base+.28+i*(height-.12)/3,z-.3] as Triple)),[width*.37,.32,.43]));
  return p;
}

function brazier(name: string, x: number, z: number, base = floor): ModelPart[] {
  return [cylinder(`${name}炉座`,x,base+.18,z,.9,.36,stone),part(`${name}敞口炉腹`,"lathe",gold,[x,base+.36,z],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.35,y:0},{x:.52,y:.43},{x:.45,y:.43},{x:.28,y:.08},{x:0,y:.08}]})];
}

function eaveFrame(name: string, x: number, z: number, width: number, top: number, base = floor): ModelPart[] {
  return [postSet(`${name}承檐立柱`,[[x-width/2,z],[x+width/2,z]],top-base,base),...boxBatch(`${name}石柱础`,stone,[-1,1].map(s=>[x+s*width/2,base+.09,z]),[.5,.18,.5]),box(`${name}通长檐枋`,x,top-.09,z,width+.3,.18,.26,red),box(`${name}中央额匾`,x,top-.5,z-.16,Math.min(3,width*.45),.5,.1,dark)];
}

function doorFrame(name: string, x: number, z: number, width: number, height: number, base = floor): ModelPart[] {
  return [...boxBatch(`${name}实承门柱`,wood,[-1,1].map(s=>[x+s*(width/2+.08),base+height/2,z]),[.14,height,.2]),box(`${name}门楣`,x,base+height+.06,z,width+.3,.12,.22,wood)];
}

function stove(name: string, x: number, z: number): ModelPart[] {
  const opening=holesAt([0],.9,.65,.16), top=1.35;
  const p=[openingWall(`${name}真炉口`,2,1.05,opening,[x,floor,z-1],0,stone),box(`${name}后壁`,x,.825,z+1,2,1.05,.22,stone),box(`${name}侧壁`,x-.9,.825,z,.2,1.05,2,stone),box(`${name}另侧壁`,x+.9,.825,z,.2,1.05,2,stone)];
  const hole=Array.from({length:12},(_,i):[number,number]=>[Math.cos(i*Math.PI/6)*.62,Math.sin(i*Math.PI/6)*.62]);
  p.push(hardPlan(`${name}带锅口灶面`,stone,[[-1,-1],[1,-1],[1,1],[-1,1]],.16,[x,top,z],[hole]),part(`${name}锅腹`,"lathe",dark,[x,1.21,z],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.35,y:0},{x:.7,y:.38},{x:.65,y:.42},{x:.32,y:.09},{x:0,y:.09}]}),box(`${name}穿屋烟道`,x,3.6,z+.8,.45,5.5,.45,wall));
  return p;
}

function elevatedPassage(): ModelPart[] {
  const p:ModelPart[]=[box("复道门楼落地庭坪",0,.15,0,25,.3,10,stone),box("高架连续桥面",0,4.18,0,13,.24,3.4,wood),tiledRoof("复道连续瓦盖",13,3.4,7.6,[0,0],tile),postSet("复道落地通柱",[-6,0,6].flatMap(x=>[-1.45,1.45].map(z=>[x,z] as [number,number])),7.3,floor)];
  for(const z of [-1.45,1.45])p.push(box("桥底连续承梁",0,3.91,z,13,.3,.3,wood),box("桥侧连续护栏",0,4.85,z*1.12,13,1.1,.12,red),box("通柱接檐枋",0,7.52,z,13,.16,.24,red));
  for(const side of [-1,1]){
    const x=side*9;
    p.push(hardPlan("门楼上层留真梯井",wood,[[-2.5,-4],[2.5,-4],[2.5,4],[-2.5,4]],.24,[x,4.06,0],[[[-.8,-3.6],[.8,-3.6],[.8,2],[-.8,2]]]),riseSteps("门楼侧内梯",floor,4.3,20,.28,1.4,[x,0,-3.6]),openingWall("门楼前真门与上窗",5,7.3,[...holesAt([0],1.8,2.8),...holesAt([-1.5,1.5],.9,1.4,5)],[x,floor,-4],0,red),openingWall("门楼后双层窗",5,7.3,[...holesAt([-1.5,1.5],.9,1.4,1.2),...holesAt([-1.5,1.5],.9,1.4,5)],[x,floor,4],0,red),openingWall("门楼外侧透窗壁",8,7.3,[...holesAt([-2,2],1.3,1.5,1.2),...holesAt([-2,2],1.3,1.5,5)],[side*11.5,floor,0],90,red),openingWall("门楼接桥真门壁",8,7.3,[...holesAt([0],2,2.8),...holesAt([0],2.2,2.8,4.035)],[side*6.5,floor,0],90,red),tiledRoof("双端门楼瓦顶",5,8,7.6,[x,0],tile),riseSteps("门楼外入门短阶",0,floor,2,.32,2.2,[x,0,-5.64]));
    for(const dx of [-.88,.88])p.push(box("梯井两侧围护",x+dx,4.85,-.8,.1,1.1,5.6,wood));
    p.push(box("梯井前缘封护",x,4.85,-3.67,1.86,1.1,.1,wood));
    p.push(...eaveFrame("门楼街面",x,-4.14,4.6,7.6),...doorFrame("门楼街门",x,-4.18,1.8,2.835));
  }
  p.push(...boxBatch("复道通柱石础",stone,[-6,0,6].flatMap(x=>[-1.45,1.45].map(z=>[x,.39,z] as Triple)),[.5,.18,.5]));
  return p;
}

function guardedLane(): ModelPart[] {
  const p:ModelPart[]=[box("值守夹道地坪",0,.15,0,15,.3,32,stone),box("东侧高宫墙",3.5,3.3,0,.65,6,30,red),openingWall("西宫墙横穿值房门",30,6,holesAt([2],1.6,2.8),[-3.5,floor,0],90,red),openingWall("前宫闸偏西入口",7,4.4,holesAt([-1.5],2,3.2),[0,floor,-14],0,red),openingWall("后宫闸偏东入口",7,4.4,holesAt([1.5],2,3.2),[0,floor,14],0,red),tiledRoof("前宫闸压顶",7,2,4.7,[0,-14],tile),tiledRoof("后宫闸压顶",7,2,4.7,[0,14],tile),box("夹道中段折屏",-.8,2.05,1,3.5,3.5,.4,red),box("折屏转角短翼",-2.4,2.05,2.3,.3,3.5,2.6,red),tiledRoof("折屏长向瓦盖",3.5,1,3.8,[-.8,1],tile),openingWall("值房外侧独立门",9,3.1,holesAt([0],1.4,2.7),[-7,floor,-2],90,wall),box("值房前墙",-5.25,1.85,-6.5,3.5,3.1,.24,wall),box("值房后墙",-5.25,1.85,2.5,3.5,3.1,.24,wall),tiledRoof("贴墙值房瓦盖",3.5,9,3.4,[-5.25,-2],tile),...table("值守案",-5.2,.8,2.4,.65),...bookcase("值守兵器架",-5.2,-5.8,2.4,2.1)];
  for(const x of [-3.5,3.5])p.push(box("宫墙通长压顶",x,6.4,0,.85,.2,30,stone));
  p.push(box("值房坐榻",-6.3,.6,-4,.7,.6,2.2,wood));
  p.push(...doorFrame("前宫闸",-1.5,-14.18,2,3.235),...doorFrame("后宫闸",1.5,13.82,2,3.235));
  return p;
}

function imperialStudy(): ModelPart[] {
  const p:ModelPart[]=[box("御书房前厅后库石坪",0,.15,0,23,.3,23,stone),openingWall("召见厅前隔扇",14,4.2,[...holesAt([-4,0,4],2.1,3.1)],[0,floor,-9],0,red),openingWall("前厅后通书库门",14,4.2,holesAt([0],2,3),[0,floor,-1],0,red),openingWall("前厅东批阅门",8,4.2,holesAt([0],1.5,2.8),[7,floor,-5],90,wall),openingWall("前厅西透窗",8,4.2,holesAt([-2,2],1.6,1.6,1.2),[-7,floor,-5],90,wall),tiledRoof("召见厅高瓦顶",14,8,4.5,[0,-5],tile),openingWall("后藏书库东西窄门",9,3.8,holesAt([0],1.4,2.8),[4,floor,3.5],90,wall),box("书库西壁",-4,2.2,3.5,.24,3.8,9,wall),openingWall("书库后透窗",8,3.8,holesAt([-2.5,2.5],1.4,1.5,1.2),[0,floor,8],0,wall),tiledRoof("后藏书间狭长瓦顶",8,9,4.1,[0,3.5],tile),openingWall("批阅室向前厅门",7,3.5,holesAt([0],1.5,2.8),[7.1,floor,-5],90,wall),box("批阅室外壁",11,2.05,-5,.24,3.5,7,wall),openingWall("批阅室前窗",3.9,3.5,holesAt([0],2,1.4,1.2),[9.05,floor,-8.5],0,wall),openingWall("批阅室后小门",3.9,3.5,holesAt([0],1.25,2.7),[9.05,floor,-1.5],0,wall),tiledRoof("侧批阅小室瓦盖",3.9,7,3.8,[9.05,-5],tile),...table("御书召见长案",-3.5,-3.2,4.2,1.5),...turn(table("侧批阅案",0,0,2.5,1.1),90,[10.2,0,-5]),box("御案后屏",-3.5,1.9,-1.8,4.5,3.2,.15,red),box("御案坐台",-3.5,.65,-2.35,1.6,.7,.8,wood),...bookcase("后库左藏书格",-2.9,6.6,1.5),...bookcase("后库右藏书格",2.9,6.6,1.5),...bookcase("后库正藏书格",0,7.5,3),...brazier("厅中香炉",-4,-5.5)];
  for(const x of [-4,4])p.push(...table("旁听小几",x,-6,1.3,.7),box("旁听坐榻",x,.58,-7,1.4,.56,.55,wood));
  p.push(...eaveFrame("御书房前檐",0,-9.15,12,4.5),box("御书房正脊",0,6.25,-5,13,.16,.18,gold),...doorFrame("御书房召见中门",0,-9.18,2.1,3.135));
  return p;
}

function councilOffice(): ModelPart[] {
  const p:ModelPart[]=[box("军机值所完整地坪",0,.15,0,17,.3,20,stone),openingWall("密议厅前门",7,3.6,holesAt([0],1.6,2.8),[0,floor,-8],0,wall),openingWall("密议厅后候旨门",7,3.6,holesAt([0],1.4,2.8),[0,floor,8],0,wall),openingWall("西通传廊入议厅门",16,3.6,[...holesAt([3.8],1.3,2.8),...holesAt([-3],1.3,1.1,1.2)],[-3.5,floor,0],90,wall),openingWall("东档签传签窗口及门",16,3.6,[...holesAt([-4],1.3,2.8),...holesAt([3.5],1.5,1.1,1.2)],[3.5,floor,0],90,wall),tiledRoof("中央密议长厅屋盖",7,16,3.9,[0,0],tile),openingWall("通传廊外独立门",16,3.1,holesAt([5.5],1.4,2.7),[-7.5,floor,0],90,wall),box("西通传前封墙",-5.5,1.85,-8,4,3.1,.24,wall),box("西通传后封墙",-5.5,1.85,8,4,3.1,.24,wall),tiledRoof("西通传低屋盖",4,16,3.4,[-5.5,0],tile),openingWall("档签间外透窗壁",16,3.1,holesAt([-5,0,5],1.5,1.4,1.1),[7.5,floor,0],90,wall),openingWall("档签间后独立服务门",4,3.1,holesAt([0],1.3,2.7),[5.5,floor,8],0,wall),box("档签间前封墙",5.5,1.85,-8,4,3.1,.24,wall),openingWall("档签内部真门分区",4,3.1,holesAt([0],1.3,2.7),[5.5,floor,0],0,wood),tiledRoof("东档签低屋盖",4,16,3.4,[5.5,0],tile),...table("中厅地图长案",0,0,3,4.5),...table("东签押案",5.5,-4,2.5,1.2),...turn(bookcase("后档格",0,0,5.5),90,[7.15,0,3.7]),...bookcase("西候旨册格",-5.5,7.3,3)];
  for(const x of [-2.6,2.6])for(const z of [-2,1,4])p.push(box("议厅坐凳",x,.56,z,.6,.52,.7,wood));
  for(const z of [-2.5,1,4.5])p.push(box("西通传靠墙坐板",-6.9,.66,z,.65,.72,2.3,wood));
  p.push(box("地图案上舆图板",0,1.18,0,2.8,.06,4.2,gold));
  p.push(...eaveFrame("军机密厅前檐",0,-8.15,6.5,3.9),...doorFrame("军机密厅门",0,-8.18,1.6,2.835));
  return p;
}

function medicineWorks(): ModelPart[] {
  const p:ModelPart[]=[box("御药院落地石坪",0,.15,0,25,.3,23,stone),openingWall("检拣间前门窗",20,3.6,[...holesAt([0],2.1,2.8),...holesAt([-6,6],2,1.5,1.1)],[0,floor,-9.5],0,wall),openingWall("检拣间双作业门",20,3.6,holesAt([-5,3],1.7,2.8),[0,floor,-3.5],0,wall),box("检拣间西壁",-10,2.1,-6.5,.24,3.6,6,wall),box("检拣间东壁",10,2.1,-6.5,.24,3.6,6,wall),tiledRoof("检拣前厅瓦盖",20,6,3.9,[0,-6.5],tile),openingWall("蒸制房向院作业门",10,4,holesAt([1],1.8,2.9),[5,floor,2],90,wall),openingWall("蒸制房外高通风窗",10,4,holesAt([-2,2],1.8,1.1,2.4),[11,floor,2],90,wall),box("蒸制房前壁",8,2.3,-3,6,4,.24,wall),openingWall("蒸制房后门",6,4,holesAt([0],1.5,2.8),[8,floor,7],0,wall),tiledRoof("东蒸制房高瓦盖",6,10,4.3,[8,2],tile),tiledRoof("后敞风晾药棚",18,4,3.2,[-2,8],tile),postSet("晾药棚落地柱",[-10,-2,6].flatMap(x=>[6.3,9.7].map(z=>[x,z] as [number,number])),2.9,floor),...table("检拣主药案",-5,-6.3,5,1.3),...table("药材分装案",4,-6.3,4,1.3),...bookcase("御药检拣抽柜",-.5,-4.1,4,2.3),...stove("蒸药炉",8,3.8),...table("蒸制备物案",8,-.7,3.5,1.2)];
  for(const z of [6.3,9.7])p.push(box("后药棚檐枋",-2,3.14,z,16.4,.22,.25,wood));
  for(const x of [-8,-3,2])for(const y of [.85,1.55,2.25])p.push(box("晾药透风盘架",x,y,8,3.6,.1,2.2,wood));
  p.push(...boxBatch("药架实承立足",wood,[-8,-3,2].flatMap(x=>[-1,1].flatMap(a=>[-1,1].map(b=>[x+a*1.6,1.25,8+b*.9] as Triple))),[.1,1.9,.1]));
  for(const x of [-8,-3,2])p.push(...boxBatch("盘上药材片",gold,[-1,0,1].map(i=>[x+i*.7,2.35,8]),[.45,.1,1.5]));
  for(const y of [1.77,2.05,2.33])p.push(cylinder("炉上层叠蒸笼",8,y,3.8,1.15,.28,wood));
  p.push(cylinder("蒸笼顶盖",8,2.52,3.8,1.2,.1,wood),box("碾药台",-7,.55,1,3,.5,2,stone),cylinder("卧式碾药轮",-7,1.1,1,.9,1.4,dark,[0,0,90]),box("药轮手杆",-7,1.1,1,2.4,.09,.09,wood),box("院侧矮围墙",-11.5,1.55,3.2,.24,2.5,13,wall));
  p.push(...eaveFrame("御药房前檐",0,-9.65,18,3.9),...doorFrame("御药房中门",0,-9.68,2.1,2.835));
  return p;
}

function palaceKitchen(): ModelPart[] {
  const p:ModelPart[]=[box("御膳院完整石坪",0,.15,0,28,.3,25,stone),openingWall("配膳间前街门",22,3.5,holesAt([-6,6],2,2.8),[0,floor,-10],0,wall),openingWall("配膳间接中廊门",22,3.5,holesAt([-7.6,0,7.6],1.6,2.8),[0,floor,-4],0,wall),tiledRoof("前配膳间瓦盖",22,6,3.8,[0,-7],tile),box("前配膳间西壁",-11,2.05,-7,.24,3.5,6,wall),box("前配膳间东壁",11,2.05,-7,.24,3.5,6,wall),box("中传膳廊石面",0,.36,3.3,3.5,.12,14.6,stone),tiledRoof("中传膳长廊",3.5,14.6,3.7,[0,3.3],tile),postSet("中廊承檐柱",[-1.55,1.55].flatMap(x=>[-3,3,10].map(z=>[x,z] as [number,number])),3.4,floor),...table("配膳分餐长案",0,-6.8,8,1.5)];
  for(const x of [-1.55,1.55])p.push(box("传膳廊柱顶枋",x,3.62,3.3,.22,.16,14.6,wood));
  for(const side of [-1,1]){
    const x=side*7.6;
    p.push(openingWall("灶房向中廊双门",14,4,holesAt([-4,4],1.5,2.8),[side*3,floor,3],90,wall),openingWall("灶房外高窗",14,4,holesAt([-3,3],2,1.2,2.4),[side*12.2,floor,3],90,wall),openingWall("灶房前备物门",9.2,4,holesAt([0],1.6,2.8),[x,floor,-4],0,wall),box("灶房后封墙",x,2.3,10,9.2,4,.24,wall),tiledRoof("独立御膳灶房屋盖",9.2,14,4.3,[x,3],tile),...stove("御膳柴灶",x+side*1.5,6),...table("切配长案",x,0,4.5,1.5),...bookcase("配膳碗碟架",side*7.5,9.4,4,2.3));
    for(const z of [-.7,.7])for(const dx of [-1,0,1])p.push(cylinder("案上备膳盘",x+dx,1.19,z,.5,.08,stone));
    for(const z of [-7.8,-5.8])p.push(box("配膳矮柜",side*8,.85,z,3,1.1,1.1,wood));
  }
  p.push(...eaveFrame("御膳前檐",0,-10.15,21,3.8));
  for(const x of [-6,6])p.push(...doorFrame("配膳间入门",x,-10.18,2,2.835));
  return p;
}

function ancestralHall(): ModelPart[] {
  const p:ModelPart[]=[box("宗庙祭庭石坪",0,.15,0,27,.3,29,stone),box("祖殿连续高台",0,.65,4,22,.7,18,stone),box("殿前低祭台",0,.5,-8,13,.4,6,stone),riseSteps("祭庭登前祭台",floor,.7,2,.35,4,[0,0,-11.7]),riseSteps("前祭台登祖殿",.7,1,2,.35,4,[0,0,-5.7]),openingWall("祖殿前五间门窗",20,4.8,[...holesAt([-6,0,6],2.4,3.4),...holesAt([-3,3],1.3,1.7,1.2)],[0,1,-4],0,red),openingWall("祖殿侧绕行入后藏主室",20,4.8,holesAt([-7,7],1.6,3),[0,1,7],0,red),openingWall("藏主室后高窗",20,4.8,holesAt([-6,0,6],1.7,1.4,2.7),[0,1,12],0,wall),tiledRoof("祖庙完整高瓦盖",20,16,5.8,[0,4],tile),postSet("祖庙内外承檐柱",[-9,-3,3,9].flatMap(x=>[-4,6.7].map(z=>[x,z] as [number,number])),4.8,1),box("中央祖龛承台",0,1.35,5.7,8,.7,2,stone),...table("祭殿供案",0,3.8,6,1.3,1,1),box("供案后祖龛背屏",0,3.5,6.6,8,4.3,.16,red),...bookcase("后藏神主柜",0,11.3,10,3.5,1),...brazier("前庭香炉",0,-8,.7)];
  for(const side of [-1,1])p.push(openingWall("祖殿侧透窗墙",16,4.8,holesAt([-4,2,5],1.6,1.7,1.5),[side*10,1,4],90,wall),box("祖庙前后檐枋",0,5.68,side<0?-4:6.7,18.5,.24,.3,red));
  for(const x of [-2.7,0,2.7])p.push(box("祖龛神主木牌",x,2.6,5.8,.65,1.8,.2,gold),cylinder("供案上礼器",x,2.23,3.8,.45,.46,gold));
  for(const x of [-10,10])p.push(box("祖殿高台边栏",x,1.5,-1,.15,1,5,stone));
  p.push(...boxBatch("祭殿朱柱石础",stone,[-9,-3,3,9].flatMap(x=>[-4,6.7].map(z=>[x,1.1,z] as Triple)),[.5,.2,.5]),...doorFrame("祭殿中门",0,-4.18,2.4,3.435,1),box("宗庙前檐额匾",0,5.15,-4.2,4,.6,.12,dark));
  return p;
}

function princelyResidence(): ModelPart[] {
  const p:ModelPart[]=[box("王府双庭共用石坪",0,.15,0,38,.3,29,stone),openingWall("王府仪厅前真门",22,4.3,holesAt([-7,0,7],2.2,3.2),[0,floor,-12],0,red),openingWall("仪厅背向双庭门",22,4.3,holesAt([-7,0,7],2,3.1),[0,floor,-4],0,red),tiledRoof("前横仪厅高瓦盖",22,8,4.6,[0,-8],tile),openingWall("仪厅西宾客门",8,4.3,holesAt([0],1.6,2.9),[-11,floor,-8],90,wall),openingWall("仪厅东内眷门",8,4.3,holesAt([0],1.6,2.9),[11,floor,-8],90,wall),openingWall("纵仪室接前厅门",8,3.7,holesAt([0],2,2.9),[0,floor,-3.7],0,red),openingWall("纵仪室后家政门",8,3.7,holesAt([0],1.6,2.8),[0,floor,7],0,wall),tiledRoof("后纵仪室独立瓦顶",8,10.7,4,[0,1.65],tile),...table("前仪厅主案",0,-6,4.2,1.4),box("仪厅主人背屏",3.5,2,-5,3,3.4,.15,red),...table("后仪室家议案",0,2.5,4,1.5),...turn(bookcase("后仪室档柜",0,0,3,2.8),90,[3.4,0,5])];
  for(const side of [-1,1]){
    p.push(openingWall("纵仪室面向侧庭门窗",10.7,3.7,[...holesAt([1],1.6,2.8),...holesAt([-3.3],1.7,1.4,1.2)],[side*4,floor,1.65],90,wall),openingWall("侧翼朝双庭独立门",9,3.5,[...holesAt([0],1.7,2.8),...holesAt([-3,3],1.1,1.4,1.1)],[side*9.5,floor,2],90,wall),openingWall("侧翼外院服务门",9,3.5,holesAt([-2.5],1.4,2.7),[side*15.5,floor,2],90,wall),box("侧翼前墙",side*12.5,2.05,-2.5,6,3.5,.24,wall),box("侧翼后墙",side*12.5,2.05,6.5,6,3.5,.24,wall),tiledRoof("侧翼整屋灰瓦盖",6,9,3.8,[side*12.5,2],tile),openingWall("双庭前独立侧门",4.5,3,holesAt([0],1.7,2.7),[side*13.25,floor,-12],0,wall),box("双庭外侧围墙",side*17.7,1.8,0,.24,3,24,wall),box("后家政路界墙",side*8.85,1.8,11,17.7,3,.24,wall));
  }
  p.push(...table("西宾客谈案",-12.4,4.8,3,1),box("西翼宾客榻",-14.3,.63,2,1.2,.66,3.5,wood),box("东翼内寝床台",12.8,.67,2,3,.74,3,wood),box("内寝靠背屏",14.3,1.75,2,.16,2.9,3.3,red),...table("内眷妆案",12.5,5,2.5,.8),...brazier("西宾庭香炉",-6.5,2));
  p.push(...eaveFrame("王府仪厅前檐",0,-12.15,21,4.6));
  for(const x of [-7,0,7])p.push(...doorFrame("王府前仪门",x,-12.18,2.2,3.235));
  for(const x of [-13.25,13.25])p.push(tiledRoof("宾内侧门小瓦盖",3,2,3.3,[x,-12],tile),...doorFrame("宾内分行门",x,-12.18,1.7,2.735));
  for(const side of [-1,1])p.push(box("王府侧家政路前封墙",side*16.6,1.8,-12,2.2,3,.24,wall));
  return p;
}

function embroideryResidence(): ModelPart[] {
  const p:ModelPart[]=[box("绣楼别院石坪",0,.15,0,17,.3,20,stone),hardPlan("绣阁楼面带真实内梯孔",wood,[[-6,-7.6],[6,-7.6],[6,6],[-6,6]],.24,[0,3.36,0],[[[-5.3,-4],[-3.7,-4],[-3.7,.5],[-5.3,.5]]]),riseSteps("内侧实接绣阁木阶",floor,3.6,18,.25,1.4,[-4.5,0,-4]),tiledRoof("绣阁完整瓦盖",12,12,6.9,[0,0],tile),openingWall("首层侍坐厅正门窗",12,3.3,[...holesAt([0],2,2.8),...holesAt([-4,4],1.4,1.5,1.1)],[0,floor,-6],0,wall),openingWall("二层绣阁通晒廊门窗",12,3.3,[...holesAt([0],1.8,2.8),...holesAt([-4,4],1.5,1.5,1.1)],[0,3.6,-6],0,red),openingWall("绣阁两层后采光",12,6.6,[...holesAt([-3,3],1.5,1.5,1.1),...holesAt([-3,3],1.5,1.5,4.4)],[0,floor,6],0,wall),openingWall("上层内寝独立门",12,3.3,holesAt([-2],1.4,2.7),[2.3,3.6,0],90,red),box("晒廊前连续护栏",0,4.15,-7.5,12,1.1,.12,red),postSet("晒廊从地面承楼及檐通柱",[-5.6,5.6].map(x=>[x,-7] as [number,number]),6.6,floor),box("晒廊下通长承梁",0,3.24,-7,11.5,.24,.24,wood),box("晒廊上承檐枋",0,6.8,-7,11.5,.2,.24,wood),tiledRoof("晒廊独立低挑檐",12,1.7,6.9,[0,-6.6],tile),...table("首层侍坐茶案",1.1,2,3,1.3),box("侍坐坐榻",4,.6,2,1.2,.6,3,wood),...table("上层绣作案",-.3,0,2.5,1.3,3.6),...table("内寝妆案",4,-3.8,2.3,.7,3.6),box("内寝架床台",4.1,3.94,4.1,2.6,.68,2.6,wood)];
  for(const side of [-1,1]){
    p.push(openingWall("绣楼侧面上下真窗",12,6.6,[...holesAt([-3,3],1.4,1.5,1.1),...holesAt([-3,3],1.4,1.5,4.4)],[side*6,floor,0],90,wall),box("晒廊两侧端护栏",side*5.9,4.15,-6.85,.12,1.1,1.4,red),box("梯井长边护板",-4.5+side*.87,4.15,-1.75,.12,1.1,4.5,wood),box("别院外墙",side*8,1.65,0,.24,2.7,18,wall));
    for(const z of [2.85,5.35])p.push(cylinder("帷床实承细柱",4.1+side*1.15,5.14,z,.08,1.72,wood));
  }
  p.push(box("床柱相接帷顶",4.1,6.05,4.1,2.65,.1,2.65,red),box("绣架左右实承底座",-.3,3.68,2.4,2.8,.16,.8,wood),...boxBatch("绣架立足",wood,[-1.4,.8].map(x=>[x,4.4,2.4]),[.12,1.45,.12]),box("绣架横轴",-.3,4.95,2.4,2.5,.12,.14,wood),box("绣架绷绢",-.3,4.55,2.4,2,.7,.035,gold),box("梯井前缘围板",-4.5,4.15,-4.08,1.85,1.1,.1,wood),openingWall("别院前入门",16,2.7,holesAt([0],2,2.5),[0,floor,-9],0,wall));
  p.push(...doorFrame("别院前门框",0,-9.18,2,2.535),tiledRoof("别院门瓦盖",3.2,2,3,[0,-9],tile),...doorFrame("绣阁晒廊门",0,-6.18,1.8,2.835,3.6),...boxBatch("晒廊通柱石础",stone,[-5.6,5.6].map(x=>[x,.39,-7]),[.5,.18,.5]));
  return p;
}

function ministerReception(): ModelPart[] {
  const p:ModelPart[]=[box("相府议客厅完整院坪",0,.15,0,32,.3,26,stone),openingWall("相府前庭分宾内双门",30,3.1,holesAt([-9.5,9.5],2,2.8),[0,floor,-11],0,wall),openingWall("长议客厅双入场门",18,4.2,[...holesAt([-5,5],2.1,3),...holesAt([0],2,1.6,1.2)],[0,floor,-7],0,red),openingWall("议客厅后屏两侧真门",18,4.2,holesAt([-5,5],1.6,2.9),[0,floor,2],0,red),openingWall("内厅后服务门窗",18,4.2,[...holesAt([6.5],1.4,2.8),...holesAt([-5,0],1.6,1.5,1.2)],[0,floor,5],0,wall),openingWall("议厅东密谈门",12,4.2,holesAt([-1],1.5,2.8),[9,floor,-1],90,wall),openingWall("议厅西抄手廊门",12,4.2,holesAt([-1],1.8,2.8),[-9,floor,-1],90,wall),tiledRoof("相府长厅独立瓦盖",18,12,4.5,[0,-1],tile),openingWall("密谈室前私门",6,3.5,holesAt([0],1.3,2.7),[12,floor,-4],0,wall),openingWall("密谈室东透窗",10,3.5,holesAt([-2.5,2.5],1.6,1.4,1.1),[15,floor,1],90,wall),box("密谈室后壁",12,2.05,6,6,3.5,.24,wall),tiledRoof("东密谈室低瓦顶",6,10,3.8,[12,1],tile),tiledRoof("西抄手游廊瓦盖",4,14,3.8,[-11,-1],tile),postSet("抄手游廊实承柱",[-12.6,-9.3].flatMap(x=>[-7.5,-3,5.5].map(z=>[x,z] as [number,number])),3.5,floor),box("西抄手廊外界墙",-13.5,1.85,-1,.24,3.1,16,wall),...table("议客主案",0,0,4.2,1.3),box("主案后屏",0,2,1.8,5.6,3.4,.15,wood),...table("密谈茶案",12,1.5,2.8,1.3),...table("内厅小案",-3,3.8,2,.7),...bookcase("内厅文牍柜",2.5,4.4,3.5,2.8)];
  for(const side of [-1,1]){
    p.push(box("前庭侧闭合墙",side*15,1.85,-7.5,.24,3.1,7,wall),box("厅内宾客侧榻",side*6.8,.65,-1.5,1.2,.7,3.6,wood),...table("宾客案几",side*5,-2,1.2,1),box("抄手廊接檐长枋",side<0?-12.6:-9.3,3.7,-1,.22,.2,13.2,wood));
  }
  p.push(box("前庭独立影屏",0,1.65,-9.3,8,2.7,.3,wall),tiledRoof("影屏瓦顶",8,1,3,[0,-9.3],tile));
  p.push(box("密谈室西后封边",9,2.05,5.5,.24,3.5,1,wall),...eaveFrame("相府议客前檐",0,-7.15,17,4.5));
  for(const x of [-5,5])p.push(...doorFrame("议客分行门",x,-7.18,2.1,3.035));
  return p;
}

function watersideWarmRoom(): ModelPart[] {
  const p:ModelPart[]=[hardPlan("曲尺暖阁观水岸石坪",stone,[[-10,-10],[10,-10],[10,10],[-10,10]],.3,[0,0,0],[[[.5,-1],[8.5,-1],[8.5,8.5],[.5,8.5]]]),box("局部浅池实底",4.5,.075,3.75,8,.15,9.5,stone),part("与暖阁共移的静态池水","box",water,[4.5,.22,3.75],[7.75,.035,9.25],[0,0,0],{opacity:.78,roughness:.18}),openingWall("暖阁南临街正门窗",16,3.4,[...holesAt([-5],1.7,2.8),...holesAt([0,5],1.8,1.5,1.1)],[0,floor,-8],0,wall),openingWall("南室面池转折长窗",9,3.4,holesAt([-2.8,0,2.8],1.8,1.6,.9),[3.5,floor,-1.2],0,wall),openingWall("西转翼观池窗门",9.7,3.4,[...holesAt([3.3],1.4,2.8),...holesAt([-2,1],1.6,1.6,.9)],[-1.2,floor,3.65],90,wall),box("西暖阁背墙",-8,2,.25,.24,3.4,16.5,wall),box("南暖阁东封墙",8,2,-4.6,.24,3.4,6.8,wall),openingWall("西翼后窗壁",6.8,3.4,holesAt([0],2.6,1.6,1),[-4.6,floor,8.5],0,wall),tiledRoof("南暖阁长瓦顶",16,6.8,3.7,[0,-4.6],tile),tiledRoof("西暖阁曲尺瓦顶",6.8,16.5,3.7,[-4.6,.25],tile),box("暖阁侧炕台",4.6,.62,-5.1,4.6,.64,2.7,stone),box("炕上铺席",4.6,.96,-5.1,4.5,.04,2.6,gold),...table("炕上小几",4.5,-5,1.5,.8,.98,.4),...table("后翼茶座",-4.8,5.2,2.4,1.4),box("后茶座靠墙坐榻",-6.8,.6,5.1,.8,.6,3.8,wood),tiledRoof("入口短雨廊",3,3,3.2,[-5,-9],tile),postSet("入口雨廊实承柱",[[-6.3,-9.7],[-3.7,-9.7]],2.9,floor),box("短廊檐枋",-5,3.1,-9.7,2.9,.2,.2,wood),...brazier("暖阁香炉",-3.6,-4.4)];
  for(const side of [-1,1])p.push(box("暖池东及北步岸护边",side<0?8.9:3.7,.65,side<0?3.7:8.9,side<0?.15:10.3,.7,side<0?10.3:.15,stone));
  p.push(...doorFrame("暖阁前门框",-5,-8.18,1.7,2.835),box("暖阁西翼屋脊",-4.6,5.16,.25,.18,.15,16.4,tile));
  return p;
}

function servantsServiceCourt(): ModelPart[] {
  const p:ModelPart[]=[box("灶洗双院整体石坪",0,.15,0,26,.3,30,stone),openingWall("下人院前入巷门",24,2.8,holesAt([8.5],1.8,2.55),[0,floor,-13],0,wall),box("贯通东家政巷外界",12,1.7,0,.24,2.8,26,wall),openingWall("洗院通后灶院分墙",20,2.8,holesAt([-6,7.5],1.6,2.55),[-2,floor,1],0,wall),box("西院外墙",-12,1.7,0,.24,2.8,26,wall),openingWall("后院出巷服务门",24,2.8,holesAt([8.5],1.8,2.55),[0,floor,13],0,wall),openingWall("寝工长屋面洗院双门",15,3.1,holesAt([-3.6,3.6],1.4,2.65),[-3,floor,-4],0,wall),openingWall("长屋朝街透窗",15,3.1,holesAt([-5,1.5,5],1.5,1.3,1.15),[-3,floor,-11],0,wall),openingWall("通铺备物室真门隔墙",7,3.1,holesAt([0],1.2,2.6),[-3,floor,-7.5],90,wall),box("长屋西封墙",-10.5,1.85,-7.5,.24,3.1,7,wall),openingWall("备物室朝巷工作门",7,3.1,holesAt([0],1.3,2.65),[4.5,floor,-7.5],90,wall),tiledRoof("寝工长屋完整瓦顶",15,7,3.4,[-3,-7.5],tile),box("通铺木台",-7.1,.6,-8,5,.6,3.2,wood),...bookcase("备物间架柜",.8,-8.8,4,2.4),...table("补缀长案",0,-6,3,1.2),openingWall("后灶房前双门",15,3.6,holesAt([-4.8,4.8],1.6,2.8),[-3,floor,5],0,wall),openingWall("后灶房烟窗后壁",15,3.6,holesAt([-4,4],2,1.1,2.2),[-3,floor,12],0,wall),box("后灶房西壁",-10.5,2.1,8.5,.24,3.6,7,wall),openingWall("后灶房接侧巷门",7,3.6,holesAt([0],1.5,2.8),[4.5,floor,8.5],90,wall),tiledRoof("后灶间完整瓦盖",15,7,3.9,[-3,8.5],tile),...stove("下人柴灶",-7,9),...table("后灶切配案",0,9,4,1.3),tiledRoof("后院侧柴棚",3.5,7,2.9,[8,8.5],tile),postSet("柴棚落地柱",[[6.4,5.3],[9.6,5.3],[6.4,11.7],[9.6,11.7]],2.6,floor)];
  p.push(box("洗衣槽底",-6,.4,-1.7,5,.2,2,stone),box("洗槽后沿",-6,.75,-.75,5,.6,.1,stone));
  for(const x of [-8.45,-3.55])p.push(box("洗槽端壁",x,.75,-1.7,.1,.6,2,stone));
  p.push(part("洗槽静态水","box",water,[-6,.67,-1.7],[4.8,.025,1.8],[0,0,0],{opacity:.8}),box("洗槽前矮沿",-6,.6,-2.65,5,.3,.1,stone),...boxBatch("侧棚堆柴",wood,Array.from({length:12},(_,i)=>[7.1+(i%3)*.75,.41+Math.floor(i/3)*.22,8.5]),[.5,.22,4]),...table("洗院搁衣案",1.5,-1.5,3,1.2));
  p.push(...eaveFrame("寝工长屋前檐",-3,-4.16,14,3.4),...doorFrame("下人院巷门",8.5,-13.18,1.8,2.585),tiledRoof("家政巷门瓦顶",3,2,3.1,[8.5,-13],tile));
  return p;
}
