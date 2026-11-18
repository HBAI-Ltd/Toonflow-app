import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { boxBatch, hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, postSet, tiledRoof } from "./periodPublicSpaceBatchOne";
import { arch, box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b7ad96", wall = "#c6b591", red = "#9b5846", wood = "#815c40", dark = "#5b493b", tile = "#637369", gold = "#b79a62", cloth = "#ab7960";
const floor = .3;

// 唐城市井空间类型的原创布景比例，不复刻具体实景或限定历史朝代。
export const chineseFilmUrbanBatchTwoDesigns: ArchitecturePrototype[] = [
  design("低门厅围坊十字里巷口", "古装片场 唐风市井：完整围坊低门厅接四向里巷十字口，关验值房与门具间分列前闸两侧，侧巷真门和后里门连通巡查路线，不含高更楼", wardJunction, "建筑", "中式"),
  design("前公秤侧验码后平准市署", "古装片场 唐风市井：前公秤亭、侧验码库和后市署平准厅围出公开校秤院，横梁秤盘及砝码架真实承托，办事厅门与货物进出路线分开", marketStandardsOffice, "建筑", "中式"),
  design("前客商铺后驻驼分货胡商院", "古装片场 唐风市井：前铺与独立高驼货通门并列，后部左分货仓和右高驼棚围出陆路卸货院，拴驼槽、鞍架和打包台让开中央驼道，不含动物", caravanMerchantCourt, "建筑", "中式"),
  design("中庭沉舞席环宴台胡姬馆", "古装片场 唐风市井：单层高馆中部为真正下沉舞席，四周抬高宴台与后乐工口相接，真券门、绕舞席行走的通道和登降阶组成宴饮歌舞空间", sunkenDanceBanquetHall, "建筑", "中式"),
  design("前合乐厅后双练室教坊院", "古装片场 唐风市井：前通高合乐厅设承架编钟和鼓座，后露天校场接左右独立排演室，内外真门和旁通廊连成训练路线，没有观众对台", musiciansAcademy, "建筑", "中式"),
  design("通长马道双侧待列御街仪仗廊", "古装片场 唐风市井：宽中央马道前后贯通，两侧高净空待列廊有石础柱枋和上下马台，前仪门与廊下戟架避让骑乘路线，不含仪仗人物", processionalStreet, "建筑", "中式"),
  design("曲岸双外梯观水廊歌舞楼", "古装片场 唐风市井：折曲岸台承托朝河低舞厅与后更衣间，两侧真实外梯穿楼板井接二层观水廊及雅室，临河观看与后场换装分层，未跨河", riversideDanceHouse, "建筑", "中式"),
  design("前礼宾中译室后客舍译馆", "古装片场 唐风市井：正式礼宾接见厅通过中廊连接左右翻译室，后院另设四间独立客舍，文案、会谈案与住宿床台各自分区，便于使节往来拍摄", diplomaticTranslationHouse, "建筑", "中式"),
];

function roof(name: string, width: number, depth: number, top: number, x: number, z: number): ModelPart[] {
  return [tiledRoof(name,width,depth,top,[x,z],tile),box(`${name}实接正脊`,x,top+.2+Math.min(width,depth)*.2,z,width>depth?width-.3:.16,.14,width>depth?.16:depth-.3,dark)];
}

function desk(name: string, x: number, z: number, width: number, depth: number, base = floor, height = .85): ModelPart[] {
  return [box(`${name}案面`,x,base+height-.06,z,width,.12,depth,wood),...boxBatch(`${name}承足`,wood,[-1,1].flatMap(a=>[-1,1].map(b=>[x+a*(width/2-.15),base+(height-.12)/2,z+b*(depth/2-.12)] as Triple)),[.13,height-.12,.14])];
}

function frontFrame(name: string, x: number, z: number, width: number, top: number, base = floor): ModelPart[] {
  return [postSet(`${name}承檐柱`,[[x-width/2,z],[x+width/2,z]],top-base,base),...boxBatch(`${name}石础`,stone,[-1,1].map(s=>[x+s*width/2,base+.09,z]),[.5,.18,.5]),box(`${name}檐枋`,x,top-.1,z,width+.3,.2,.26,red),box(`${name}额匾`,x,top-.5,z-.17,Math.min(3,width*.4),.45,.1,dark)];
}

function archedHole(x: number, radius: number, spring: number): [number,number][] {
  return [[x-radius,.035],[x+radius,.035],[x+radius,spring+.035],...Array.from({length:12},(_,i):[number,number]=>{const a=(i+1)*Math.PI/12;return [x+Math.cos(a)*radius,spring+.035+Math.sin(a)*radius];})];
}

function wardJunction(): ModelPart[] {
  const p:ModelPart[]=[box("围坊里巷共用石坪",0,.15,0,28,.3,30,stone),box("十字主巷路面",0,.32,0,4,.04,30,stone),box("十字横巷路面",0,.32,3,28,.04,3.5,stone),openingWall("坊闸前门厅街门",24,3.8,holesAt([0],3.4,3.3),[0,floor,-12],0,wall),openingWall("门厅后贯巷门",24,3.8,holesAt([0],3.4,3.3),[0,floor,-6],0,wall),...roof("坊门低门厅瓦盖",24,6,4.1,0,-9),openingWall("左侧里巷门",27,3.3,holesAt([-1.5],3.2,3),[-12,floor,1.5],90,wall),openingWall("右侧里巷门",27,3.3,holesAt([-1.5],3.2,3),[12,floor,1.5],90,wall),openingWall("围坊后里门",24,3.3,holesAt([0],3.4,3),[0,floor,15],0,wall),openingWall("门厅左值房真门",6,3.8,holesAt([0],1.5,2.8),[-3,floor,-9],90,wood),openingWall("门厅右门具间真门",6,3.8,holesAt([0],1.5,2.8),[3,floor,-9],90,wood),...desk("关验案",-7.5,-9,4,1.2),box("门具落地架",8,.9,-9,4,1.2,.8,wood),...frontFrame("坊门前檐",0,-12.15,22,4.1)];
  for(const side of[-1,1]){
    p.push(box("里巷转角内短墙",side*5,1.8,-1.5,.3,3,6.5,wall),box("里巷后角围墙",side*7,1.8,9,10,3,.24,wall),box("围坊侧长压顶",side*12,3.66,1.5,.55,.12,27,stone),box("前门厅内柱额枋",side*3,4,-9,.25,.2,6.2,red));
    const leaf=box("坊闸收靠门扇",side*2.3,1.95,-10.9,.18,3.1,2.2,wood);leaf.rotation.y=side*8;p.push(leaf);
  }
  return p;
}

function marketStandardsOffice(): ModelPart[] {
  const p:ModelPart[]=[box("平准校秤院基坪",0,.15,0,25,.3,25,stone),openingWall("平准厅前门窗",19,3.6,[...holesAt([-5,5],1.6,2.8),...holesAt([0],2,1.5,1.2)],[0,floor,4],0,wall),openingWall("平准厅后职员门",19,3.6,holesAt([0],1.5,2.8),[0,floor,11],0,wall),...roof("后平准厅完整瓦盖",19,7,3.9,0,7.5),box("平准厅东壁",9.5,2.1,7.5,.24,3.6,7,wall),box("平准厅西壁",-9.5,2.1,7.5,.24,3.6,7,wall),...frontFrame("平准厅前檐",0,3.85,18,3.9),...desk("平准办事主案",0,8,5,1.4),...desk("验码案",-8,-2,3,1.2),openingWall("侧验码库朝院门",9,3.2,holesAt([0],1.6,2.7),[-5,floor,-2],90,wall),box("验码库西背墙",-11,1.9,-2,.24,3.2,9,wall),openingWall("验码库前窗",6,3.2,holesAt([0],2,1.4,1.1),[-8,floor,-6.5],0,wall),box("验码库后壁",-8,1.9,2.5,6,3.2,.24,wall),...roof("侧验码库瓦盖",6,9,3.5,-8,-2),...roof("公开公秤亭",10,5,3.8,1,-7),postSet("公秤亭落地柱",[[-3.5,-9],[5.5,-9],[-3.5,-5],[5.5,-5]],3.5,floor),box("公秤亭前承梁",1,3.7,-9,9.4,.2,.3,wood),box("公秤亭后承梁",1,3.7,-5,9.4,.2,.3,wood),box("院东秤具暂放矮台",9,.55,-2,3,.5,3,stone)];
  p.push(box("衡架左承柱",-.8,1.8,-7,.18,3,.18,wood),box("衡架右承柱",2.8,1.8,-7,.18,3,.18,wood),box("衡架横梁",1,3.25,-7,3.8,.2,.22,wood),cylinder("衡梁接架悬轴",1,2.85,-7,.12,.6,dark),box("实际水平衡梁",1,2.53,-7,4,.13,.16,wood));
  for(const side of[-1,1]){
    const x=1+side*1.6;
    p.push(cylinder("秤盘悬索",x,2,-7,.04,1,dark),cylinder("悬索相接秤盘",x,1.45,-7,1.1,.1,dark),cylinder("验码台砝码",9+side*.65,.95,-2,.55,.3,dark),box("院前侧短界墙",side*9.5,1.6,-10.5,4,2.6,.24,wall));
  }
  for(const x of[-9,-8,-7])p.push(cylinder("验码案上标准砝码",x,1.3,-2,.4,.3,dark));
  p.push(beam("公秤左斜托",wood,[-.8,1.3,-7],[-.2,3.15,-7],.12),beam("公秤右斜托",wood,[2.8,1.3,-7],[2.2,3.15,-7],.12));
  return p;
}

function caravanMerchantCourt(): ModelPart[] {
  const p:ModelPart[]=[box("胡商驻驼院完整地坪",0,.15,0,30,.3,34,stone),openingWall("客商铺街面门窗",18,3.7,[...holesAt([-4],2.2,2.9),...holesAt([2],3.2,1.5,1.1)],[-4,floor,-13],0,wall),openingWall("前铺向分货院后门",18,3.7,holesAt([0],2,2.9),[-4,floor,-6],0,wall),box("前铺西壁",-13,2.15,-9.5,.24,3.7,7,wall),openingWall("前铺东向驼道门",7,3.7,holesAt([0],1.7,2.9),[5,floor,-9.5],90,wall),...roof("胡商前铺瓦盖",18,7,4,-4,-9.5),openingWall("独立高驼货通门",9,4.7,holesAt([0],4.8,4.2),[9.5,floor,-13],0,wall),...roof("驼道高门瓦盖",9,2.5,5,9.5,-13),openingWall("后分货仓向院双门",15,4.3,holesAt([-4,4],1.9,3.1),[-5,floor,4],0,wall),box("分货仓后壁",-5,2.45,16,15,4.3,.3,wall),box("分货仓西壁",-12.5,2.45,10,.3,4.3,12,wall),openingWall("分货仓向院宽侧门",12,4.3,holesAt([0],2.5,3.2),[2.5,floor,10],90,wall),...roof("后分货仓高瓦顶",15,12,4.6,-5,10),...roof("侧驻驼高棚",7,18,4.9,9.5,5),postSet("高驼棚承柱",[6.3,12.7].flatMap(x=>[-3.5,2,7.5,13.5].map(z=>[x,z] as [number,number])),4.6,floor),box("高驼棚外背墙",13,2.15,5,.24,3.7,18,wall),box("棚柱顶长檐枋",6.3,4.8,5,.25,.2,18.4,wood),...desk("客商议货案",-7,-9,4,1.4),...desk("院内打包长案",-5,0,5,1.5)];
  for(const z of[-1.5,3.5,8.5,13.5])p.push(box("驼位短分栏",10,1.1,z,5.5,1.6,.14,wood));
  for(const z of[1,6,11]){
    p.push(box("驼槽实底",12.3,.4,z,.8,.2,2.8,stone),box("槽内草料",12.3,.64,z,.55,.08,2.5,gold));
    for(const side of[-1,1])p.push(box("驼槽长侧壁",12.3+side*.34,.75,z,.12,.5,2.8,stone),box("驼槽封端",12.3,.75,z+side*1.34,.8,.5,.12,stone));
  }
  for(const x of[7.8,9.5,11.2])p.push(box("前棚鞍具底座",x,.4,-2.6,.75,.2,1.4,wood),box("鞍架承足",x,.9,-2.6,.12,.8,.12,wood),box("鞍架顶横木",x,1.35,-2.6,.75,.1,1.3,wood));
  for(const x of[-10,-5,-.5])p.push(box("分货仓实托货台",x,.6,11,3,.6,3.4,wood),box("台上封装货包",x,1.3,11,2.7,.8,2.8,cloth));
  p.push(...frontFrame("客商铺前檐",-4,-13.15,17,4));
  return p;
}

function sunkenDanceBanquetHall(): ModelPart[] {
  const p:ModelPart[]=[hardPlan("高宴台环绕真实沉舞席",stone,[[-11,-11],[11,-11],[11,11],[-11,11]],1.05,[0,0,0],[[[-4,-4],[4,-4],[4,4],[-4,4]]]),box("沉舞席独立低地板",0,.125,0,8,.25,8,wood),riseSteps("沉席向后宴台登阶",.25,1.05,4,.3,2,[0,0,2.8]),riseSteps("馆前登宴台宽阶",0,1.05,5,.3,4,[0,0,-12.5]),openingWall("胡姬宴馆真券街门",20,4.5,[archedHole(-7,1.2,2.1),archedHole(7,1.2,2.1)],[0,1.05,-9],0,wall),openingWall("后乐工双出场门",20,4.5,holesAt([-6,6],1.5,3),[0,1.05,6],0,red),openingWall("后乐工室后服务门",20,3.4,holesAt([0],1.6,2.8),[0,1.05,10],0,wall),...roof("宴馆通高整瓦盖",20,15,5.55,0,-1.5),...roof("后乐工低屋盖",20,4,4.45,0,8),...frontFrame("宴馆街面檐枋",0,-9.16,19,5.55,1.05),...desk("后乐工调弦案",-5,8,5,1.2,1.05)];
  for(const side of[-1,1]){
    p.push(openingWall("宴馆侧高窗墙",19,4.5,holesAt([-5,0,5],2,1.5,1.9),[side*10,1.05,.5],90,wall));
    for(const z of[-2.5,2.5])p.push(...desk("胡宴矮几",side*7,z,2.2,1.4,1.05,.55),box("宴台坐席",side*8.8,1.18,z,.8,.26,1.5,cloth));
    const trim=arch(side*7,-9.17,1.2,2.1,.38,.22);trim.position.y=1.085;p.push(trim);
    p.push(box("舞席侧临边低石坐缘",side*4.12,1.22,0,.24,.34,6.5,stone));
  }
  p.push(box("后乐工鼓座",5,1.5,8,1.5,.9,1.2,wood),cylinder("承座横鼓",5,2.15,8,1.1,1.3,red,[90,0,0]));
  return p;
}

function musiciansAcademy(): ModelPart[] {
  const p:ModelPart[]=[box("教坊院完整石坪",0,.15,0,28,.3,30,stone),openingWall("合乐厅前门窗",20,4.5,[...holesAt([0],2.4,3.2),...holesAt([-6,6],2,1.6,1.3)],[0,floor,-10],0,wall),openingWall("合乐厅通校场双门",20,4.5,holesAt([-5,5],1.8,3),[0,floor,0],0,wall),openingWall("合乐厅西旁通廊门",10,4.5,holesAt([0],1.5,2.9),[-10,floor,-5],90,wall),openingWall("合乐厅东侧窗",10,4.5,holesAt([-3,3],1.6,1.7,1.4),[10,floor,-5],90,wall),...roof("合乐厅通高瓦盖",20,10,4.8,0,-5),...frontFrame("教坊前厅柱枋",0,-10.15,19,4.8),...roof("西旁通雨廊",2,17,3.4,-11,3),postSet("旁通廊承檐柱",[[-11.8,-4.8],[-11.8,3],[-11.8,10.8]],3.1,floor),box("西廊柱顶通枋",-11.8,3.3,3,.22,.2,16,wood),openingWall("西院界透窗及入院门",27,3.1,[...holesAt([-7],1.6,2.7),...holesAt([0,7],1.5,1.4,1.1)],[-12,floor,1.5],90,wall),box("东院界墙",12,1.85,1.5,.24,3.1,27,wall),box("后院界墙",0,1.85,15,24,3.1,.24,wall),...desk("合乐教习谱案",0,-2,3,1.2),box("乐器架左柱",-9.3,1.95,-6,.18,3.3,.2,wood),box("乐器架右柱",-3.7,1.95,-6,.18,3.3,.2,wood),box("编钟架实承横梁",-6.5,3.5,-6,5.8,.2,.3,red)];
  for(const x of[-8.6,-7.2,-5.8,-4.4])p.push(cylinder("编钟悬接短杆",x,3.35,-6,.045,.3,dark),part("实际悬挂中空编钟","lathe",gold,[x,2.45,-6],[1,1,1],[0,0,0],{profile:[{x:.4,y:0},{x:.42,y:.05},{x:.25,y:.6},{x:.08,y:.75},{x:0,y:.75},{x:0,y:.65},{x:.19,y:.52},{x:.32,y:.04}]}));
  p.push(box("合乐鼓承托座",6,.7,-5,2.5,.8,1.4,wood),cylinder("座上排演横鼓",6,1.7,-5,1.2,2.2,red,[0,0,90]));
  for(const side of[-1,1]){
    const x=side*6;
    p.push(openingWall("练功室前真门窗",8,3.3,[...holesAt([0],1.6,2.8),...holesAt([-2.6,2.6],1.1,1.3,1.2)],[x,floor,6],0,wall),openingWall("练功室后窗",8,3.3,holesAt([-2,2],1.5,1.4,1.1),[x,floor,13],0,wall),box("练功室外侧壁",x+side*4,1.95,9.5,.24,3.3,7,wall),openingWall("练功室内侧通廊门",7,3.3,holesAt([0],1.4,2.8),[x-side*4,floor,9.5],90,wall),...roof("独立练功室瓦盖",8,7,3.6,x,9.5),...desk("练功谱案",x,11,3,1.1),box("排演室靠墙坐榻",x+side*2.8,.6,9.5,.8,.6,3.5,wood));
    for(const z of[-7,-4])p.push(box("合乐坐凳",side*2.5,.55,z,.65,.5,.6,wood));
  }
  return p;
}

function processionalStreet(): ModelPart[] {
  const p:ModelPart[]=[box("仪仗御街完整石路",0,.15,0,30,.3,38,stone),...boxBatch("御街两侧界带",dark,[-6,6].map(x=>[x,.32,0]),[.12,.04,38]),...roof("御街前仪门高瓦盖",15,3,5.8,0,-17),postSet("仪门高门柱",[[-6.5,-17],[6.5,-17]],5.5,floor),box("仪门高门额枋",0,5.7,-17,13.5,.2,.5,red),box("仪门石柱础左",-6.5,.5,-17,.9,.4,.9,stone),box("仪门石柱础右",6.5,.5,-17,.9,.4,.9,stone)];
  for(const side of[-1,1]){
    const x=side*10.5;
    p.push(...roof("御街高待列长廊",7,32,4.8,x,0),postSet("待列廊内外通柱",[side*7.3,side*13.7].flatMap(px=>[-15,-7.5,0,7.5,15].map(z=>[px,z] as [number,number])),4.5,floor),...boxBatch("廊柱落地石础",stone,[side*7.3,side*13.7].flatMap(px=>[-15,-7.5,0,7.5,15].map(z=>[px,.4,z] as Triple)),[.55,.2,.55]),box("廊内侧檐枋",side*7.3,4.69,0,.25,.22,31,wood),box("廊外侧檐枋",side*13.7,4.69,0,.25,.22,31,wood),openingWall("廊背通风高墙",32,3.6,holesAt([-11,-3,5,13],2.5,1.5,1.6),[side*14,floor,0],90,wall));
    for(const z of[-10,9]){
      p.push(box("上下马实心石台",side*11,.625,z,2.4,.65,2,stone),riseSteps("待列廊登马台短阶",floor,.95,3,.3,1.4,[side*11,0,z-1.9]),box("仪仗戟架底座",side*12.8,.4,z+3,1,.2,2.5,wood),box("戟架承杆柱",side*12.8,1.35,z+3,.16,1.7,.18,wood),box("仪仗架顶承木",side*12.8,2.2,z+3,.18,.15,2.5,wood));
      for(const dz of[-.8,0,.8])p.push(cylinder("静态仪仗长杆",side*12.8,1.75,z+3+dz,.06,2.5,wood),box("长杆实接戟刃",side*12.8,2.94,z+3+dz,.26,.35,.06,dark));
    }
  }
  return p;
}

function riversideDanceHouse(): ModelPart[] {
  const p:ModelPart[]=[hardPlan("歌舞楼折曲岸台",stone,[[-13,-8],[-8,-10],[0,-9],[8,-10],[13,-8],[13,11],[-13,11]],.3),box("歌舞楼高地台",0,.75,3,17,.9,10.4,stone),box("二层后雅室完整木楼板",0,4.38,4.25,16,.24,7.5,wood),hardPlan("观水廊楼板留双外梯孔",wood,[[-11,-4.2],[11,-4.2],[11,1.2],[8,1.2],[8,.5],[-8,.5],[-8,1.2],[-11,1.2]],.24,[0,4.26,0],[[[-10.8,-4],[-9.2,-4],[-9.2,-.5],[-10.8,-.5]],[[9.2,-4],[10.8,-4],[10.8,-.5],[9.2,-.5]]]),riseSteps("岸台登前舞厅石阶",floor,1.2,5,.28,4,[0,0,-3.6]),openingWall("舞厅后更衣双出场门",16,3.3,holesAt([-5.2,5.2],1.6,2.8),[0,1.2,5],0,red),openingWall("更衣室后服务门",16,3.3,holesAt([0],1.6,2.8),[0,1.2,8],0,wall),openingWall("上雅室面观水廊门窗",16,3.3,[...holesAt([-5,5],1.6,2.8),...holesAt([0],3,1.5,1.1)],[0,4.5,.5],0,red),openingWall("上雅室后透窗",16,3.3,holesAt([-5,0,5],1.7,1.5,1.1),[0,4.5,8],0,wall),...roof("上雅室完整高瓦顶",16,7.5,7.8,0,4.25),...roof("观水廊前低瓦盖",22,4.7,7.6,0,-1.85),postSet("下舞厅与楼廊接承通柱",[-7,-3.5,3.5,7].map(x=>[x,-1.8] as [number,number]),6.4,1.2),postSet("双梯外沿承廊长柱",[-10.9,10.9].flatMap(x=>[-4,.3].map(z=>[x,z] as [number,number])),7.3,floor),box("观水廊前连续围栏",0,5.05,-4.1,22,1.1,.12,red),box("下舞厅前额枋",0,4.42,-1.8,14.4,.16,.25,red),...desk("后更衣妆案",-4.8,6.7,4,1,1.2),...desk("上雅室清谈案",0,5.4,4,1.3,4.5)];
  for(const side of[-1,1]){
    p.push(riseSteps("岸台外梯前半",floor,2.4,11,.28,1.4,[side*10,0,-6.66]),riseSteps("接续上观水廊后半外梯",2.4,4.5,11,.28,1.4,[side*10,0,-3.58]),openingWall("歌舞厅下层侧透窗",10,3.3,holesAt([-1.5],1.8,1.5,1.2),[side*8,1.2,3],90,wall),openingWall("上雅室侧透窗",7.5,3.3,holesAt([-.25],1.8,1.5,1.2),[side*8,4.5,4.25],90,wall),box("上观水廊外端护栏",side*10.95,5.05,-1.5,.1,1.1,5.4,red),box("上廊侧后防落护栏",side*9.5,5.05,1.1,3,1.1,.12,red),...boxBatch("临岸楼通柱石础",stone,[[side*7,-1.8],[side*3.5,-1.8],[side*10.9,-4],[side*10.9,.3]].map(([x,z])=>[x!,Math.abs(x!)<8?1.3:.4,z!] as Triple),[.5,.2,.5]));
    for(const x of[side*9.12,side*10.88])p.push(box("外梯井侧连续围板",x,5.05,-2.25,.1,1.1,3.5,wood));
    p.push(box("上雅室侧坐榻",side*6.6,4.82,4.5,1,.64,3.8,wood));
  }
  p.push(box("舞厅前额匾",0,3.7,-1.98,3.6,.6,.1,dark),...boxBatch("前舞厅楼廊承梁",wood,[-7,-3.5,3.5,7].map(x=>[x,4.14,-1]),[.25,.24,6.3]));
  return p;
}

function diplomaticTranslationHouse(): ModelPart[] {
  const p:ModelPart[]=[box("译馆接见译务客舍完整石坪",0,.15,0,31,.3,34,stone),openingWall("礼宾厅前真门窗",22,3.8,[...holesAt([0],2.2,3),...holesAt([-7,7],2,1.5,1.2)],[0,floor,-13],0,wall),openingWall("礼宾厅后双译务门",22,3.8,holesAt([-7,7],1.7,2.8),[0,floor,-5],0,wall),...roof("礼宾厅瓦盖",22,8,4.1,0,-9),...frontFrame("礼宾接见厅檐架",0,-13.15,21,4.1),box("礼宾厅西壁",-11,2.2,-9,.24,3.8,8,wall),box("礼宾厅东壁",11,2.2,-9,.24,3.8,8,wall),...desk("礼宾接见主案",0,-7.5,5,1.5),...roof("中央译务交通雨廊",3,13,3.4,0,1.5),postSet("译务中廊实承柱",[-1.35,1.35].flatMap(x=>[-4.7,1.5,7.7].map(z=>[x,z] as [number,number])),3.1,floor),openingWall("客舍前四间独立门",22,3.1,holesAt([-8.25,-2.75,2.75,8.25],1.4,2.7),[0,floor,8],0,wall),openingWall("客舍后四间真实窗",22,3.1,holesAt([-8.25,-2.75,2.75,8.25],1.5,1.4,1.1),[0,floor,14],0,wall),...roof("后独立客舍长屋瓦顶",22,6,3.4,0,11)];
  for(const side of[-1,1]){
    const x=side*7;
    p.push(openingWall("译室前接礼宾门",7,3.3,holesAt([0],1.7,2.8),[x,floor,-4],0,wall),openingWall("译室后入客院门",7,3.3,holesAt([0],1.5,2.8),[x,floor,4],0,wall),openingWall("译室内向中廊门",8,3.3,holesAt([0],1.5,2.8),[side*3.5,floor,0],90,wall),openingWall("译室外采光墙",8,3.3,holesAt([-2,2],1.6,1.4,1.1),[side*10.5,floor,0],90,wall),...roof("独立译室瓦盖",7,8,3.6,x,0),...desk("译务会谈长案",side*8.4,0,3.2,1.2),box("译文壁架",side*9,1.5,2.9,2.5,2.4,.45,wood),box("译馆侧围墙",side*14.5,1.8,1,.24,3,28,wall),box("客舍两端封墙",side*11,1.85,11,.24,3.1,6,wall),box("中央雨廊檐枋",side*1.35,3.3,1.5,.2,.2,12.7,wood));
  }
  for(const x of[-5.5,0,5.5])p.push(box("客舍实落地分户墙",x,1.85,11,.24,3.1,6,wall));
  for(const x of[-8.25,-2.75,2.75,8.25])p.push(box("客舍承床台",x+1.2,.64,11.4,2,.68,2.6,wood),...desk("客舍小案",x-1.3,12,1.2,.75),box("床头靠板",x+1.2,1.25,12.65,2.1,1.9,.1,wood));
  p.push(box("译馆后界墙",0,1.8,15,29,3,.24,wall));
  return p;
}
