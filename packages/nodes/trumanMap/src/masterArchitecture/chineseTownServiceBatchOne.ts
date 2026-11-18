import type { ModelPart } from "../assetModelParts";
import { hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b7b19e", wall = "#c6bca1", wood = "#805d43", dark = "#604936", tile = "#61746b", red = "#995b48";
const floor = .42;

export const chineseTownServiceBatchOneDesigns: ArchitecturePrototype[] = [
  design("内天井环廊双层通铺客栈", "中式古代古城常备客栈：四边房带围住露天天井，环形二层楼板留独立内梯井，两侧分室与后通铺可进入，临街门厅贯通内庭", courtyardLodging, "建筑", "中式"),
  design("偏后署侧审单院县衙", "中式古代古城常备衙门：前门厅、偏置审案厅和后侧办公署围同一庭院，东押解门与正门来访路线分开，侧值房可独立出入", localMagistrateCourt, "建筑", "中式"),
  design("前收镖侧卸院后封库镖局", "中式古代古城常备镖局：临街收镖厅侧门接东卸货院，后部三分镖库与西值守房分列物流路线，雨棚与横廊让开三处通库门", freightEscortOffice, "建筑", "中式"),
  design("低柜营业厅侧账房钱库钱庄", "中式古代古城常备钱庄：低交易窗与职员旁门分开，后台雨廊连独立账房及厚壁钱库，正面入库和侧向交接门形成独立工作路线", bankCompound, "建筑", "中式"),
];

function courtyardLodging(): ModelPart[] {
  const p: ModelPart[] = [box("客栈落地基坪",0,.21,0,16.4,.42,18.4,stone),hardPlan("二层环楼板实留天井及梯井",wood,[[-8,-9],[8,-9],[8,9],[-8,9]],.24,[0,3.18,0],[[[-3,-4],[3,-4],[3,4],[-3,4]],[[-7,-8.5],[-5.4,-8.5],[-5.4,-4.75],[-7,-4.75]]]),openingWall("临街门厅双层门窗",16,6,[...holesAt([0],2.4,2.75),...holesAt([-5,0,5],1.5,1.4,4.1)],[0,floor,-9],0,wall),openingWall("后通铺两层采光窗",16,6,[...holesAt([-5,0,5],1.5,1.4,1.1),...holesAt([-5,0,5],1.5,1.4,4.1)],[0,floor,9],0,wall),riseSteps("内梯实接二层楼面",floor,3.42,15,.25,1.4,[-6.2,0,-8.5]),riseSteps("临街门前短阶",0,floor,3,.32,2.8,[0,0,-10.16]),box("客栈前匾",0,3.18,-9.2,3.2,.5,.12,dark)];
  for(const side of [-1,1]) {
    p.push(openingWall("客栈外侧两层透窗墙",18,6,[...holesAt([-5,0,5],1.3,1.4,1.1),...holesAt([-5,0,5],1.3,1.4,4.1)],[side*8,floor,0],90,wall),tiledRoof("侧房连续灰瓦顶",5,8,6.42,[side*5.5,0],tile),box("二层天井侧护板",side*3.05,3.92,0,.1,1,8,wood));
    for(const level of [0,1]) {
      const y=floor+level*3;
      p.push(openingWall("侧客房朝环廊的分室真门",8,3,holesAt([-2,2],1.15,2.6),[side*4.1,y,0],90,wall));
      for(const z of [-2,2])p.push(box("分室木床",side*6.15,y+.31,z,2.2,.62,1.8,wood));
    }
    p.push(box("侧客房贯通分隔壁",side*6.05,3.42,0,3.9,6,.18,wall));
  }
  for(const level of [0,1]) {
    const y=floor+level*3;
    p.push(openingWall("前房带通环廊门",6,3,holesAt([0],2.3,2.6),[0,y,-5.1],0,wall),openingWall("后通铺朝环廊门",6,3,holesAt([0],2.1,2.6),[0,y,5.1],0,wall));
  }
  p.push(tiledRoof("前门房独立瓦顶",16,5,6.42,[0,-6.5],tile),tiledRoof("后通铺独立瓦顶",16,5,6.42,[0,6.5],tile),box("一层后通铺木台",0,.77,7.4,11,.7,2.1,wood),box("二层后通铺木台",0,3.77,7.4,11,.7,2.1,wood));
  for(const x of [-7,-5.4])p.push(box("客栈梯井侧护板",x,3.92,-6.625,.08,1,3.75,wood));
  for(const z of [-4.05,4.05])p.push(box("天井前后连续护栏",0,3.92,z,6,1,.1,wood));
  return p;
}

function localMagistrateCourt(): ModelPart[] {
  const p: ModelPart[] = [box("县衙完整单院基坪",0,.21,0,26,.42,25,stone),openingWall("县衙前门厅街门",12,3.4,holesAt([0],3.2,2.9),[0,floor,-11.5],0,wall),openingWall("前门厅通院门",12,3.4,holesAt([0],3.2,2.9),[0,floor,-7.5],0,wall),tiledRoof("县衙低门厅瓦盖",12,4,3.82,[0,-9.5],tile),box("偏置审案厅高台",-2,.66,6,15.4,.48,8.4,stone),openingWall("审案厅开放前庭",15,3.7,holesAt([0],12.5,3.1),[-2,.9,2],0,wall),openingWall("审案厅后采光壁",15,3.7,holesAt([-4,4],1.7,1.5,1.4),[-2,.9,10],0,wall),tiledRoof("偏置公堂瓦顶",15,8,4.6,[-2,6],tile),riseSteps("庭中登审案厅短阶",floor,.9,3,.32,4,[-2,0,1.04]),box("审案高座台",-2,1.1,8,5,.4,2.6,stone),riseSteps("案台登阶",.9,1.3,2,.3,2,[-2,0,6.1]),box("公堂审案木案",-2,1.8,8,3,1,.8,wood),box("案后木屏",-2,2.8,9.2,4.6,3,.15,red),box("后偏署抬高地台",8.8,.66,6.5,6.8,.48,7.4,stone),tiledRoof("后偏署独立低瓦顶",6.4,7,4,[8.8,6.5],tile),riseSteps("前门厅登院短阶",0,floor,3,.32,3.6,[0,0,-13.46])];
  for(const side of [-1,1]) {
    p.push(box("前门厅侧壁",side*6,2.12,-9.5,.24,3.4,4,wall),box("前门两侧低界墙",side*9,1.92,-11.5,6,3,.24,wall));
  }
  p.push(box("县衙西围壁",-12,1.92,0,.24,3,23,wall),openingWall("东院独立押解侧门",23,3,holesAt([3],1.7,2.65),[12,floor,0],90,wall),box("县衙后围壁",0,1.92,11.5,24,3,.24,wall));
  p.push(openingWall("公堂接后署侧门",8,3.7,holesAt([0],1.5,2.7),[5.5,.9,6],90,wall),box("公堂另一侧壁",-9.5,2.75,6,.24,3.7,8,wall),openingWall("后署西向实门",7,3.1,holesAt([.5],1.5,2.7),[5.6,.9,6.5],90,wall),box("后署后壁",8.8,2.45,10,6.4,3.1,.24,wall),openingWall("后署前窗",6.4,3.1,holesAt([0],2,1.3,1.1),[8.8,.9,3],0,wall),box("后署东壁",12,2.45,6.5,.24,3.1,7,wall),box("后署书案",8.7,1.4,7,2.7,1,.9,wood));
  p.push(box("西侧值房地台",-8.7,.52,-2,5.4,.2,5.4,stone),openingWall("值房向庭真门",5,3.1,holesAt([0],1.3,2.65),[-6.2,.62,-2],90,wall),box("值房西壁",-11.2,2.17,-2,.24,3.1,5,wall),box("值房后壁",-8.7,2.17,.5,5,3.1,.24,wall),box("值房前壁",-8.7,2.17,-4.5,5,3.1,.24,wall),tiledRoof("侧值房瓦盖",5,5,3.72,[-8.7,-2],tile));
  return p;
}

function freightEscortOffice(): ModelPart[] {
  const p: ModelPart[]=[box("镖局侧卸院完整基坪",0,.21,0,22,.42,28,stone),openingWall("收镖厅临街门",14,3.8,holesAt([0],2.6,2.9),[-3,floor,-12],0,wall),openingWall("收镖厅通后作业门",14,3.8,holesAt([-3,3],1.5,2.7),[-3,floor,-6],0,wall),box("收镖厅西壁",-10,2.32,-9,.24,3.8,6,wall),openingWall("收镖厅东卸货侧门",6,3.8,holesAt([0],1.8,2.9),[4,floor,-9],90,wall),tiledRoof("收镖厅独立瓦顶",14,6,4.22,[-3,-9],tile),box("收镖登记柜",-4.8,1.02,-8,4.6,1.2,.9,wood),openingWall("三分镖库实际装卸门",20,4.8,holesAt([-6.7,0,6.7],1.9,3.2),[0,floor,5],0,wall),box("封库后壁",0,2.82,13,20,4.8,.4,wall),tiledRoof("连续镖库高瓦顶",20,8,5.22,[0,9],tile),box("西值守房地台",-7,.52,-1,6.4,.2,8.4,stone),openingWall("西值守房向卸院工作门",8,3.2,holesAt([0],1.4,2.6),[-4,.62,-1],90,wall),box("值守房西壁",-10,2.22,-1,.24,3.2,8,wall),box("值守房前壁",-7,2.22,-5,6,3.2,.24,wall),box("值守房后壁",-7,2.22,3,6,3.2,.24,wall),tiledRoof("侧值守低瓦顶",6,8,3.82,[-7,-1],tile),riseSteps("镖局临街短阶",0,floor,3,.32,3,[-3,0,-14.96])];
  for(const x of [-10,10,-3.35,3.35])p.push(box("后镖库厚侧壁与分仓墙",x,2.82,9,.35,4.8,8,wall));
  for(const x of [-6.7,0,6.7])for(const z of [8,11])p.push(box("仓内实际落地货箱",x,.97,z,2.4,1.1,1.5,wood));
  p.push(box("侧院卸货窄台",9,1.02,-1.8,1.5,1.2,4.5,stone),tiledRoof("东卸货院独立雨棚",5.4,10,3.6,[7,-1],tile));
  for(const x of [4.6,9.4])for(const z of [-5.6,3.6])p.push(cylinder("卸货棚落地柱",x,2.01,z,.22,3.18,wood));
  for(const z of [-5.6,3.6])p.push(box("雨棚横檐枋",7,3.55,z,5,.24,.28,wood));
  p.push(box("临街镖局木匾",-3,3.5,-12.2,3.6,.55,.1,dark));
  return p;
}

function bankCompound(): ModelPart[] {
  const p: ModelPart[]=[box("钱庄前厅后账库基坪",0,.21,0,18.4,.42,22,stone),openingWall("钱庄客户正门及街窗",16,3.7,[...holesAt([-4.5],2.2,2.9),...holesAt([3],4,1.5,1.2)],[0,floor,-10],0,wall),openingWall("低柜交付窗和职员旁门",16,3.7,[...holesAt([.5],10,1.3,1.15),...holesAt([-6.4],1.2,2.7)],[0,floor,-3.2],0,wood),box("低柜窗口向客厅挑出台面",.5,1.64,-3.45,10.3,.14,.8,wood),openingWall("营业厅后工作门",16,3.7,holesAt([-4.5,4.5],1.6,2.7),[0,floor,-1],0,wall),tiledRoof("钱庄前营业厅瓦盖",16,9,4.12,[0,-5.5],tile),box("营业厅东侧壁",8,2.27,-5.5,.24,3.7,9,wall),openingWall("钱庄独立侧职员门",9,3.7,holesAt([0],1.4,2.7),[-8,floor,-5.5],90,wall),tiledRoof("后账房瓦盖",6.5,8,3.72,[-4.5,4],tile),openingWall("账房向后台廊门",8,3.3,holesAt([0],1.3,2.7),[-1.25,floor,4],90,wall),box("账房西侧壁",-7.75,2.07,4,.24,3.3,8,wall),box("账房后壁",-4.5,2.07,8,6.5,3.3,.24,wall),openingWall("账房前工作门",6.5,3.3,holesAt([0],1.4,2.65),[-4.5,floor,0],0,wall),box("钱庄账案",-4.5,.92,4,3,1,1.1,wood),box("账册柜",-6.8,1.62,6.3,.6,2.4,2.4,wood),tiledRoof("后台窄雨廊",2.3,10,3.4,[0,5],tile),tiledRoof("厚壁钱库独立高顶",7,10.6,4.82,[4.5,5.3],tile),box("钱库厚东壁",8,2.62,5.3,.55,4.4,10.6,stone),box("钱库封闭后壁",4.5,2.62,10.6,7,4.4,.55,stone)];
  for(const side of [-1,1])p.push(box("钱库正门两侧厚墩",4.5+side*2.15,2.62,0,2.7,4.4,.55,stone));
  p.push(box("钱库正门上厚梁",4.5,4.02,0,1.6,1.6,.55,stone),openingWall("钱库向账廊的侧交接门",10.6,4.4,holesAt([1.3],1.6,2.8),[1,floor,5.3],90,stone),box("厚库门楣木框",4.5,3.3,-.32,1.85,.16,.18,dark));
  for(const z of [1,5,9])p.push(cylinder("后台廊实承柱",.8,1.91,z,.16,2.98,wood));
  for(const x of [3,6])for(const z of [6.5,9])p.push(box("库内落地钱箱",x,.92,z,1.5,1,1.1,dark));
  p.push(box("钱庄前檐匾",0,3.6,-10.2,3.2,.5,.1,dark),riseSteps("钱庄临街短阶",0,floor,3,.32,2.6,[-4.5,0,-11.96]));
  return p;
}
