import { part, type ModelPart } from "../assetModelParts";
import { hardPlan, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { boxesMesh, type SolidBox } from "./publicSpaceBatchEight";
import { arch, box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#b6b09b", plaster = "#c7bea4", wood = "#805f43", dark = "#614935", tiles = "#61736a", cloth = "#b49a83";
const floor = .24;

export const chineseStreetShopBatchOneDesigns: ArchitecturePrototype[] = [
  design("折角双街内梯雅座酒肆", "中式古代古城街道古装剧酒楼：切角门面面向两街，底层食堂与楼上临街雅座由真实梯井相连；小地坪可紧邻排街，区别现代包间双廊酒楼", cornerWineShop, "建筑", "中式"),
  design("敞檐坐廊后炉临街茶肆", "中式古代古城街道古装剧茶馆：敞开前檐供短坐饮茶，后侧独立炉水间直接备茶，无高层说书回廊，可与相邻铺面连街", streetTeaShop, "建筑", "中式"),
  design("单进配药柜后药间街巷药铺", "中式古代古城街道古装剧药铺：前堂配药柜与多格药柜、后存药间及侧出货门组成单进售药店，不含诊室或大型医馆后园", streetApothecary, "建筑", "中式"),
  design("前高厅挂布后夹仓布庄", "中式古代古城街道古装剧布庄：前部高厅展示悬布和裁案，后夹仓有真实楼板井与木阶，货架与售布通道分开，不用同壳改招牌", fabricShop, "建筑", "中式"),
  design("前售窗后拱炉糕饼铺", "中式古代古城街道古装剧糕饼铺：侧客门与前售卖窗分开，后跨砖拱炉带真实炉口及烟囱，前后高低两屋盖围合烘饼作坊", pastryShop, "建筑", "中式"),
  design("前书廊后刻坊木版书肆", "中式古代古城街道古装剧书肆：前开敞售书廊连接偏置后刻印坊，左侧独立送纸雨廊通后院，书柜、刻案与进店路线互不遮挡", bookPrinterShop, "建筑", "中式"),
];

function seating(x: number, z: number, level: number): ModelPart {
  const cubes: SolidBox[] = [{ center: [x, level + .82, z], size: [1.3,.12,.9] }, { center: [x,level + .38,z], size: [.25,.76,.55] }];
  for (const side of [-1,1]) cubes.push({ center: [x,level + .43,z+side*.77], size: [1.4,.16,.32] }, { center: [x,level+.18,z+side*.77], size: [.9,.36,.22] });
  return boxesMesh("木案条凳", wood, cubes);
}

function sign(x: number, y: number, z: number, width: number): ModelPart {
  return box("檐下木匾",x,y,z,width,.45,.1,dark);
}

function cornerWineShop(): ModelPart[] {
  const outline: [number,number][] = [[-5,-2.5],[-2.5,-5],[5,-5],[5,5],[-5,5]];
  const p: ModelPart[] = [hardPlan("切角酒肆台基",stone,outline,floor), hardPlan("二层实开梯井",wood,outline,.24,[0,3.1,0],[[[3,-3.7],[4.6,-3.7],[4.6,.3],[3,.3]]]), openingWall("临街正面双层门窗",7.5,6.4,[...holesAt([0],1.7,2.7),...holesAt([-1.8,1.8],1.4,1.4,4.1)],[1.25,floor,-5],0,plaster), openingWall("另一街面透窗",7.5,6.4,[...holesAt([0],1.7,2.7),...holesAt([-1.8,1.8],1.4,1.4,4.1)],[-5,floor,1.25],90,plaster), openingWall("折角真正进店门",Math.sqrt(12.5),6.4,[...holesAt([0],1.4,2.7),...holesAt([0],1.4,1.4,4.1)],[-3.75,floor,-3.75],45,plaster), box("酒肆后墙",0,3.44,5,10,6.4,.24,plaster), openingWall("酒肆侧窗",10,6.4,[...holesAt([-2,2],1.5,1.3,1.2),...holesAt([-2,2],1.5,1.4,4.1)],[5,floor,0],90,plaster), riseSteps("雅座内梯",floor,3.34,16,.25,1.4,[3.8,0,-3.7]), sign(1.25,3.1,-5.2,2.7)];
  p.push(tiledRoof("折角酒肆灰瓦屋顶",10,10,6.64,[0,0],tiles));
  for(const x of [3,4.6])p.push(box("梯井侧护板",x,3.84,-1.7,.08,1,4,wood));
  for(const x of [-1.8,1.1])for(const z of [-1,2.7])p.push(seating(x,z,floor),seating(x,z,3.34));
  p.push(box("前堂酒柜",-3,1.0,1.5,.7,1.52,4,wood));
  for(const z of [.2,1.5,2.8])p.push(part("柜上酒坛","lathe",dark,[-3,1.76,z],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.22,y:0},{x:.3,y:.25},{x:.2,y:.5},{x:.13,y:.58},{x:0,y:.58}]}));
  return p;
}

function streetTeaShop(): ModelPart[] {
  const p: ModelPart[] = [box("茶肆石台",0,.12,0,9.4,.24,9.4,stone),openingWall("敞檐前厅",9,3.2,holesAt([0],7.8,2.8),[0,floor,-4.5],0,plaster),box("茶肆后墙",0,1.84,4.5,9,3.2,.24,plaster),tiledRoof("茶肆灰瓦顶",9,9,3.44,[0,0],tiles),sign(0,3.05,-4.7,2.5)];
  for(const side of [-1,1])p.push(openingWall("茶肆侧窗",9,3.2,holesAt([-1.5,2],1.4,1.4,1.1),[side*4.5,floor,0],90,plaster),cylinder("前檐木柱",side*4,1.84,-4.55,.22,3.2,wood),box("茶炉小间侧壁",.6+side*1.6,1.84,2.3,.18,3.2,4.4,plaster));
  p.push(openingWall("炉水间真门",3.2,3.2,holesAt([0],1.1,2.6),[.6,floor,.1],0,plaster),box("茶炉砖座",.6,.79,3.1,1.3,1.1,1.1,stone),cylinder("备茶大壶",.6,1.55,3.1,.6,.43,dark),box("备水木台",-2.7,.79,3.5,1.5,1.1,.7,wood),box("前檐通长额枋",0,3.4,-4.55,8.3,.22,.3,wood));
  for(const x of [-2.3,2.5])for(const z of [-2.3,-.3])p.push(seating(x,z,floor));
  return p;
}

function streetApothecary(): ModelPart[] {
  const p: ModelPart[] = [box("药铺窄台基",0,.12,0,8.4,.24,10.4,stone),openingWall("药铺街门与售窗",8,3.4,[...holesAt([-2.6],1.4,2.7),...holesAt([.8],3.8,1.8,.7)],[0,floor,-5],0,plaster),box("后药间封墙",0,1.94,5,8,3.4,.24,plaster),openingWall("药间分隔真门",8,3.4,holesAt([-2.6],1.25,2.7),[0,floor,1.8],0,plaster),tiledRoof("药铺完整灰瓦盖",8,10,3.64,[0,0],tiles),box("药铺西墙",-4,1.94,0,.24,3.4,10,plaster),openingWall("后药间出货侧门",10,3.4,holesAt([-3.2],1.3,2.6),[4,floor,0],90,plaster),sign(.6,3.1,-5.2,2.7),box("配药长柜",.6,.84,-1.7,4.8,1.2,.8,wood),box("多格药柜柜身",.6,1.54,1.28,5.4,2.6,.55,dark)];
  const fronts: SolidBox[]=[];
  for(let row=0;row<4;row++)for(let col=0;col<6;col++)fronts.push({center:[-1.65+col*.9,.58+row*.6,1.0],size:[.82,.5,.08]});
  for(let i=0;i<fronts.length;i+=16)p.push(boxesMesh("药柜独立抽屉面",wood,fronts.slice(i,i+16)));
  for(const x of [-1.3,.6,2.5])p.push(box("后间药材箱",x,.69,4,1.3,.9,.9,wood));
  p.push(box("配药台小秤座",.6,1.49,-1.7,.5,.1,.4,dark));
  return p;
}

function fabricShop(): ModelPart[] {
  const p: ModelPart[]=[box("布庄长台基",0,.12,0,7.4,.24,11.4,stone),openingWall("布庄前高厅门窗",7,5.6,[...holesAt([-2.4],1.4,2.8),...holesAt([1],3.8,2.4,.5)],[0,floor,-5.5],0,plaster),box("夹仓后壁",0,3.04,5.5,7,5.6,.24,plaster),tiledRoof("布庄高屋盖",7,11,5.84,[0,0],tiles),hardPlan("后夹仓实开梯井",wood,[[-3.5,-2.5],[3.5,-2.5],[3.5,5.5],[-3.5,5.5]],.2,[0,2.84,0],[[[-3.1,-2],[-1.5,-2],[-1.5,1.5],[-3.1,1.5]]]),riseSteps("夹仓木阶",floor,3.04,14,.25,1.4,[-2.3,0,-2]),sign(.8,3.25,-5.7,2.5)];
  for(const side of [-1,1])p.push(openingWall("布庄高侧窗",11,5.6,[...holesAt([-3,3],1.3,1.4,3.8)],[side*3.5,floor,0],90,plaster),box("夹仓梯井侧护板",side<0?-3.1:-1.5,3.54,-.25,.07,1,3.5,wood));
  for(const x of [-1.05,2.65])p.push(box("挂布架实落地立柱",x,1.55,-4.2,.12,2.62,.14,wood));
  p.push(box("挂布架横梁",.8,2.85,-4.2,3.9,.15,.16,wood),box("裁布案面",.8,1.09,-.8,3.4,.12,1.5,wood));
  for(const x of [-.5,.8,2.1])p.push(box("展示垂布",x,1.8,-4.16,.75,2,.045,x<0?cloth:"#99aaa0"),box("裁案承脚",x,.64,-.8,.16,.8,1.3,wood));
  for(const x of [-1,1])p.push(box("夹仓存布架",x,3.74,4.8,1.6,1.4,.55,wood));
  return p;
}

function pastryShop(): ModelPart[] {
  const p: ModelPart[]=[box("糕饼铺前后台基",0,.12,0,8.4,.24,10.4,stone),openingWall("临街客门和售饼窗",8,3.1,[...holesAt([-2.65],1.4,2.7),...holesAt([.8],4,1.5,1)],[0,floor,-5],0,plaster),openingWall("前店后炉作业门",8,3.1,holesAt([-2.5],1.3,2.6),[0,floor,.4],0,plaster),tiledRoof("售饼前铺瓦顶",8,5.4,3.34,[0,-2.3],tiles),tiledRoof("后炉坊独立高顶",8,4.6,3.74,[0,2.7],tiles),box("炉坊后墙",0,1.99,5,8,3.5,.24,plaster),box("售窗承柜",.8,.79,-4.75,4.1,1.1,.8,wood),sign(.6,2.95,-5.2,2.6)];
  for(const side of [-1,1])p.push(box("前铺侧墙",side*4,1.79,-2.3,.24,3.1,5.4,plaster),openingWall("后炉坊透窗侧墙",4.6,3.5,holesAt([0],1.2,1.4,1.3),[side*4,floor,2.7],90,plaster));
  const oven=arch(0,3,.6,.6,1.7,.35);oven.position.y=floor;oven.color="#a58c72";
  p.push(oven,box("炉后封砖",0,1.015,3.82,1.9,1.55,.2,"#a58c72"),box("砖炉烟囱",.65,3.1,3.4,.4,3.2,.4,"#a58c72"),box("烘饼整形案",2.2,.79,2.6,1.6,1.1,2.1,wood));
  for(const x of [-.6,.3,1.2,2.1])p.push(part("售柜饼点","sphere","#c7ad78",[x,1.39,-4.75],[.55,.13,.45]));
  return p;
}

function bookPrinterShop(): ModelPart[] {
  const p: ModelPart[]=[box("前书廊后刻坊台基",0,.12,-.6,9.4,.24,12,stone),openingWall("书廊临街敞口",9,3.3,holesAt([0],7.5,2.8),[0,floor,-6],0,plaster),openingWall("书廊后部双向通门",9,3.3,holesAt([-2.7,2],1.4,2.65),[0,floor,-1],0,plaster),tiledRoof("前售书廊瓦顶",9,5,3.54,[0,-3.5],tiles),tiledRoof("偏置刻坊高瓦顶",5.4,5.5,4.14,[1.8,1.75],tiles),box("刻坊后墙",1.8,2.19,4.5,5.4,3.9,.24,plaster),box("刻坊前上楣",1.8,3.84,-1,5.4,.6,.24,plaster),box("售书木柜",1.4,.79,-4.1,4.5,1.1,.8,wood),sign(0,3.1,-6.2,2.7)];
  for(const side of [-1,1])p.push(box("前书廊侧墙",side*4.5,1.89,-3.5,.24,3.3,5,plaster),openingWall("后刻坊透窗山墙",5.5,3.9,holesAt([0],1.7,1.5,1.2),[1.8+side*2.7,floor,1.75],90,plaster));
  p.push(tiledRoof("送纸侧廊低雨盖",3,5.5,2.94,[-2.7,1.75],tiles));
  for(const z of [-.8,1.8,4.3])p.push(cylinder("侧廊承檐柱",-4.1,1.59,z,.14,2.7,wood));
  for(const z of [.7,3.3]){p.push(box("刻印案",1.8,.79,z,2.8,1.1,1.2,wood),box("案上木刻版",1.5,1.39,z,1.6,.1,.9,dark),box("案上纸叠",2.6,1.43,z,.55,.18,.8,"#d7cfaf"));}
  const books: SolidBox[]=[];for(let row=0;row<3;row++)for(let col=0;col<7;col++)books.push({center:[-.2+col*.55,1.4+row*.12,-4.12],size:[.48,.12,.5]});
  for(let start=0;start<books.length;start+=16)p.push(boxesMesh("柜上书册叠",cloth,books.slice(start,start+16)));
  return p;
}
