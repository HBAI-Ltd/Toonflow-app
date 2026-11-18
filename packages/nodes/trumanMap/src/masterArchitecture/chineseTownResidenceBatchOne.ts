import type { ModelPart } from "../assetModelParts";
import { hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { turn } from "./historicSpaceBatchSeven";
import { holesAt, openingWall, tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#a9a38e", earth = "#b8a17e", white = "#d0c7af", wood = "#806349", tile = "#60756c";

export const chineseTownResidenceBatchOneDesigns: ArchitecturePrototype[] = [
  design("三开间单坡短檐土坯排房", "中式古代古城常备普通民居，横向中厅夹双寝室，门洞穿分墙，单坡厚屋盖与短前檐覆住整屋，灶间与床榻可见；前方Z负，不是沿长轴串门窄宅", rowResidence, "建筑", "中式"),
  design("侧巷串院前后二进窄宅", "中式古代古城常备窄面民居，侧巷经独立门连通前后街，前屋后寝之间有露天小院，院侧门分出私院和过巷，不是两层石库门换皮", alleyResidence, "建筑", "中式"),
  design("前街后埠枕河板壁民宅", "中式古代古城常备河岸民居，石岸上单层木宅前接街阶、后接低埠，正门与后门贯通生活厅，后埠有独立下河石阶；以低埠底为0，摆放时对齐河岸高度和水位", riverResidence, "建筑", "中式"),
  design("阶梯晒台串房平顶土坯宅", "中式古代古城常备干旱地区民居，两间错台平梁屋体有真实连门，外阶上低晒台再经屋顶短阶上高晒台，护墙让开到达口；不是三券窑宅换屋盖", terraceResidence, "建筑", "中式"),
  design("狭井穿堂四水归堂民宅", "中式古代古城常备紧凑民居，前穿堂经狭天井通后寝室，四片内向单坡屋面在天井边收水，阶叠封火山墙与两侧小室构成整宅，非四翼大合院", lightwellResidence, "建筑", "中式"),
  design("共脊错间双户里巷民宅", "中式古代古城常备合住民居，一个屋盖与中央实承脊墙分隔前后两户，各自厨房卧间位置错开、门窗独立，两条外巷接前后街，不复制独屋作数量款", pairedResidence, "建筑", "中式"),
];

function bed(name: string, x: number, z: number, floor = .24): ModelPart[] {
  return [box(`${name}木床座`, x, floor + .24, z, 1.7, .48, 2.2, wood), box(`${name}床铺`, x, floor + .51, z, 1.65, .1, 2.1, "#b8b39a"), box(`${name}枕`, x, floor + .6, z + .7, 1.25, .1, .4, white)];
}

function rowResidence(): ModelPart[] {
  const p: ModelPart[] = [box("排房石脚", 0, .12, 0, 12.4, .24, 6.6, stone), openingWall("排房前门与卧窗", 12, 3.56, [...holesAt([0], 1.4, 2.45), ...holesAt([-4,4], 1.6, 1.35, 1.0)], [0,.24,-3],0,earth), openingWall("低后墙采光窗",12,2.91,holesAt([-4,0,4],1.25,1.1,1.15),[0,.24,3],0,earth), profileBody("整屋单坡盖",tile,[[-3.3,0],[3.3,.715],[3.3,.925],[-3.3,.21]],12.6,[0,3.1175,0],90)];
  for (const side of [-1,1]) {
    p.push(openingWall("两侧山墙",6,2.91,holesAt([0],1.1,1.0,1.2),[side*6,.24,0],90,earth),profileBody("山墙承坡尖",earth,[[-3,0],[3,0],[3,.65]],.3,[side*6,3.15,0],90), openingWall("中厅通两寝门",6,2.91,holesAt([0],1.05,2.35),[side*2,.24,0],90,earth), ...bed("侧寝",side*4,1.4));
  }
  p.push(box("厅后木案",0,.71,1.8,2.1,.94,.7,wood), box("前檐木横枋",0,3.77,-3.3,12.2,.2,.18,wood));
  for (const x of [-5.7,5.7]) p.push(cylinder("前短檐柱",x,2.005,-3.3,.17,3.53,wood));
  p.push(box("侧间灶台",-4.9,.65,-1.8,1.2,.82,1,earth),cylinder("灶口锅",-4.9,1.11,-1.8,.7,.12,"#53605a"),box("门前小踏步",0,.06,-3.6,2,.12,.6,stone));
  return p;
}

function alleyResidence(): ModelPart[] {
  const p: ModelPart[] = [box("窄宅共用基坪",0,.12,0,6.5,.24,18),openingWall("前街门墙",6.2,2.8,[...holesAt([-.6],1.4,2.5),...holesAt([2.3],1.1,2.5)],[0,.24,-8.5],0,white),openingWall("巷后独立出口",6.2,2.8,holesAt([2.3],1.1,2.5),[0,.24,8.5],0,white),openingWall("院巷分界门",5.8,2.6,holesAt([0],1.2,2.4),[1.7,.24,0],90,white),box("私院左界墙",-3,1.54,0,.22,2.6,6,white)];
  for (const center of [-5.4,5.4]) {
    p.push(openingWall("前后屋朝院门",4.6,3.16,holesAt([0],1.3,2.5),[-.6,.24,center<0?-2.9:2.9],0,white),openingWall("前后屋外向门窗",4.6,3.16,[...holesAt([0],1.3,2.5),...holesAt([-1.6],.85,1.15,1.1)],[-.6,.24,center<0?-7.9:7.9],0,white),openingWall("房屋西侧采光",5,3.16,holesAt([0],1.25,1.2,1.05),[-2.9,.24,center],90,white),openingWall("屋侧连巷门",5,3.16,holesAt([0],1.15,2.4),[1.7,.24,center],90,white),tiledRoof("前后独立瓦盖",4.6,5,3.4,[-.6,center],tile));
  }
  for (const z of [-2.5,2.5]) p.push(cylinder("侧巷雨檐柱",2.85,1.52,z,.15,2.56,wood));
  p.push(profileBody("侧巷单坡雨盖",tile,[[-.7,0],[.7,.3],[.7,.46],[-.7,.16]],5.8,[2.3,2.8,0]),...bed("后寝",-1.8,6.4),box("前屋家案",-1.9,.7,-5.2,1.2,.92,1.8,wood),box("后屋小灶",.65,.65,7.1,1.05,.82,.8,earth));
  return p;
}

function riverResidence(): ModelPart[] {
  const p: ModelPart[] = [box("石岸承宅厚基",0,1,-1.5,9,2,8,stone),box("上宅石板面",0,2.05,-1.5,9,.1,8,stone),openingWall("向街木宅正门",8,3.4,[...holesAt([0],1.5,2.5),...holesAt([-2.6,2.6],1.2,1.25,1.15)],[0,2.1,-4.5],0,wood),openingWall("后埠穿行木门",8,3.4,holesAt([0],1.4,2.5),[0,2.1,1.5],0,wood),tiledRoof("枕河木宅瓦盖",8,6.8,5.5,[0,-1.5],tile),riseSteps("前街接宅石阶",0,2.1,10,.32,2.5,[0,0,-8.7]),box("低埠落地石台",0,.35,5.1,4,.7,1.4,stone),...turn([riseSteps("后门下水埠阶",.7,2.1,7,.3,2.5,[0,0,0])],180,[0,0,4.6])];
  for (const side of [-1,1]) p.push(openingWall("木宅侧窗墙",6,3.4,holesAt([-1.5,1.5],1.2,1.2,1.1),[side*4,2.1,-1.5],90,wood),box("后埠两侧短石栏",side*1.85,1.1,5.1,.18,.8,1.4,stone),...bed("水宅床",side<0?-2.5:2.5,side<0?0:-2.2,2.1));
  p.push(box("生活厅小案",-2.5,2.58,-2.3,1.4,.96,.8,wood));
  return p;
}

function terraceResidence(): ModelPart[] {
  const p: ModelPart[] = [box("土宅基坪",0,.12,0,12,.24,11,stone),openingWall("高屋正门",6,3.06,holesAt([0],1.4,2.5),[-2.2,.24,-3.5],0,earth),openingWall("高屋后窗",6,3.06,holesAt([-1.8,1.8],1.15,1.2,1.1),[-2.2,.24,3.5],0,earth),box("高屋西墙",-5.2,1.77,0,.3,3.06,7,earth),openingWall("两屋连门",7,3.06,holesAt([-1.2],1.2,2.4),[.8,.24,0],90,earth),box("高晒台屋面",-2.2,3.4,0,6.4,.2,7.4,earth),openingWall("低屋前门",4,2.36,holesAt([-1],1.1,2.15),[3,.24,-1.1],0,earth),openingWall("低屋后窗",4,2.36,holesAt([0],1.2,1.1,1),[3,.24,3.5],0,earth),box("低屋东墙",5,1.42,1.2,.3,2.36,4.6,earth),box("低屋西接墙",1,1.42,2.55,.3,2.36,1.9,earth),box("低晒台屋面",3,2.7,1.2,4.4,.2,5,earth),riseSteps("外侧登低台阶",.24,2.8,12,.32,1.2,[3.7,0,-4.94]),...turn([riseSteps("低台接高台短阶",0,.7,4,.25,1.2,[0,2.8,0])],-90,[2,0,1.5]),...bed("高屋寝",-3.8,1.5),box("低屋灶",3.8,.64,2.6,1.1,.8,.9,earth)];
  for (const z of [-3.6,3.6]) p.push(box("高台前后护墙",-2.2,3.94,z,6.4,.88,.16,earth));
  p.push(box("高台西护墙",-5.3,3.94,0,.16,.88,7.2,earth));
  for (const [a,b] of [[-3.6,.7],[2.3,3.6]]) p.push(box("高台留梯口的东护墙",.9,3.94,(a!+b!)/2,.16,.88,b!-a!,earth));
  p.push(box("低台东侧护墙",5.1,3.2,1.2,.16,.8,5,earth),box("低台后护墙",3,3.2,3.6,4.3,.8,.16,earth));
  return p;
}

function lightwellResidence(): ModelPart[] {
  const p: ModelPart[] = [box("天井宅共用基坪",0,.12,0,8.4,.24,12.6,stone),openingWall("前街穿堂大门",8,3.96,holesAt([0],1.6,2.7),[0,.24,-5.8],0,white),openingWall("后寝外窗",8,3.96,holesAt([-2,2],1.5,1.25,1.15),[0,.24,5.8],0,white)];
  const roofProfile: [number,number][] = [[-2.3,0],[2.3,1.1],[2.3,1.3],[-2.3,.2]];
  for(const side of [-1,1]) {
    p.push(openingWall("狭井前后穿堂门",8,2.86,holesAt([0],1.5,2.5),[0,.24,side*1.4],0,white),openingWall("天井两侧小室门",2.8,2.86,holesAt([0],1.1,2.35),[side*1.4,.24,0],90,white),profileBody("向井内收水的前后单坡",tile,roofProfile,8.2,[0,3.1,side*3.7],side<0?90:-90),profileBody("两侧内向瓦坡",tile,[[-1.3,0],[1.3,1.1],[1.3,1.3],[-1.3,.2]],3,[side*2.7,3.1,0],side>0?0:180),profileBody("阶叠封火山墙",white,[[-6.2,0],[6.2,0],[6.2,4.2],[4.4,4.2],[4.4,4.6],[1.7,4.6],[1.7,5],[-1.7,5],[-1.7,4.6],[-4.4,4.6],[-4.4,4.2],[-6.2,4.2]],.22,[side*4.05,.24,0],90));
  }
  p.push(box("井底石排水沟",0,.265,0,2.7,.05,2.7,stone),hardPlan("井心落水孔边台",earth,[[-.4,-.4],[.4,-.4],[.4,.4],[-.4,.4]],.04,[0,.29,0],[[[-.15,-.15],[.15,-.15],[.15,.15],[-.15,.15]]]),...bed("后寝",-2.5,4),box("穿堂家案",-2.5,.7,-3.5,1.6,.92,.8,wood));
  return p;
}

function pairedResidence(): ModelPart[] {
  const p: ModelPart[] = [box("双户与外巷共同石坪",0,.12,0,14.4,.24,10,stone),box("共脊承重中墙",0,1.82,0,12,.3+2.86,.3,earth),tiledRoof("双户共用整幅屋盖",12,8.5,3.4,[0,0],tile),openingWall("前户入口采光墙",12,3.16,[...holesAt([-2.5],1.4,2.5),...holesAt([2.7],1.5,1.2,1.1)],[0,.24,-4],0,white),openingWall("后户独立门窗",12,3.16,[...holesAt([2.5],1.4,2.5),...holesAt([-3.5],1.4,1.2,1.1)],[0,.24,4],0,white),openingWall("前户厅寝分墙",4,3.16,holesAt([0],1.05,2.4),[.5,.24,-2],90,earth),openingWall("后户厅寝分墙",4,3.16,holesAt([.4],1.05,2.4),[-1,.24,2],90,earth)];
  for(const side of [-1,1]) p.push(openingWall("双户共山墙侧窗",8,3.16,holesAt([-2,2],1.25,1.15,1.15),[side*6,.24,0],90,earth),box("外巷路缘",side*7.05,.39,0,.15,.3,10,stone));
  p.push(...bed("前户寝",3.2,-1.6),...bed("后户寝",-3.5,2.1),box("前户灶台",-4.7,.69,-.8,1.3,.9,1.1,earth),box("后户灶台",4.7,.69,.8,1.3,.9,1.1,earth),box("前户饭案",-4,.74,-2.4,1.5,1,.8,wood),box("后户饭案",4,.74,2.5,1.3,1,1,wood));
  return p;
}
