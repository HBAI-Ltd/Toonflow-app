import { beam, part, type ModelPart, type Triple } from "../assetModelParts";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";
import { holesAt, openingWall, postSet, tiledRoof } from "./periodPublicSpaceBatchOne";
import { boxBatch, hardPlan, profileBody, riseSteps } from "./everydayOutdoorSpaceBatchOne";
import { turn } from "./historicSpaceBatchSeven";
import { verticalPanel, windowHole } from "./historicSpaceBatchNine";

const stone = "#a7a18e", wall = "#c4b696", wood = "#786044", tile = "#5c6c63", red = "#965640", iron = "#505c54", cloth = "#ad9d7f";

// 原创可进入影视布景，按官署、军旅、礼教与城郊生活的不同工作动线组织，不复刻具体景区。
export const chineseFilmCivicBatchOneDesigns: ArchitecturePrototype[] = [
  design("偏门验收双院分监大牢", "古装片场 官署军旅：偏门收押甬道先经狱吏值房前场，再分流到两个独立监院；各院后三间牢室有实门、高窗与透空栏口，不是旧警署中央走廊后排牢", dividedPrison, "建筑", "中式"),
  design("侧阶监斩棚围栏刑场", "古装片场 官署军旅：敞开刑场与后方高监斩棚分开，侧阶登台让开中轴，押解侧门与观众前口各自通场；静态无人物行刑场地", executionGround, "建筑", "中式"),
  design("前递铺后换马双出驿馆", "古装片场 官署军旅：公文递铺与贯通马道并列，后场双马厩、鞍具棚和分口换马台围出交接院，独立后门出马，不含客房餐饮而不同车马客栈和单件拴马棚", relayCompound, "建筑", "中式"),
  design("十字营街帐幕辕门整营", "古装片场 官署军旅：栅界围住十字营街，两侧独立帐幕各留真出入口，后方军令大帐与伙灶、军械架分区，辕门只跨地面通路，不采用砖营房环廊院", tentCamp, "建筑", "中式"),
  design("横垛箭道侧棚点将演武场", "古装片场 官署军旅：高点将台以两侧踏道登临，前方开阔列阵地、偏置弓靶箭道和横向土背垛分区，军鼓有承架，侧棚储器具而不占行军中线", drillGround, "建筑", "中式"),
  design("泮池桥门明伦殿官学文庙", "古装片场 官署军旅：真实半月泮池由中桥跨过，桥后棂星门接到高基祭殿，两侧东西庑面向仪式庭；以礼教祭祀中轴区别双斋教学书院", confucianSchool, "建筑", "中式"),
  design("双列号棚十字巡院贡院", "古装片场 官署军旅：两片成列独立号棚与十字巡查街围成封闭考院，前方搜检门厅与后方监临明厅分立，号舍门、坐板和答卷板均真实，不是单件号舍数量款", examinationCourt, "建筑", "中式"),
  design("前卸柩廊分室停棺义庄", "古装片场 官署军旅：宽卸柩门通入有柱前廊，后部四间独立停柩室与侧值房分开，棺底枕木真实托起棺身，窄窗与侧向后勤路保留，不同祭祖宗祠", mortuaryCompound, "建筑", "中式"),
  design("岩根曲阶偏龛山神庙", "古装片场 官署军旅：天然岩根承住偏置高龛，折返登阶经转台抵达开放庙亭，另一侧小耳房置供器；单偏龛与露岩院不同三龛石窟和抱厦土地庙", mountainShrine, "建筑", "中式"),
  design("前戏台双司房城隍庙院", "古装片场 官署军旅：前置高戏台留侧向入院门与后台登阶，后审神殿、两侧司房围出可拍摄看戏庭，神龛前保持通行，不以普通宗祠换牌", cityGodCourt, "建筑", "中式"),
  design("单券穿山侧坡驿路关隘", "古装片场 官署军旅：厚单券关口与两端山肩挡墙相接，侧绕实坡抵达低矮关顶巡路，关顶小值亭由台体承住，前后长驿道贯通；非三券重檐城门", mountainPass, "建筑", "中式"),
  design("低埠验货高账厅河岸税关", "古装片场 官署军旅：低石埠接独立验货棚，短坡与石阶上接高岸账厅和暂扣货库，客商侧门与搬货路线分开；以低埠底为0，摆放需对齐岸高与水位，非道路卡亭", riverCustomhouse, "建筑", "中式"),
];

function civicRoom(name: string, w: number, d: number, h: number, x: number, z: number, doors = [0], doorway = 1.5, floor = .24, color = wall): ModelPart[] {
  const p = [openingWall(`${name}前门`, w, h, holesAt(doors, doorway, Math.min(2.65,h-.3)), [x,floor,z-d/2],0,color), openingWall(`${name}后窗`, w,h,holesAt([-w*.27,w*.27],Math.min(1.4,w*.2),1.1,1.2),[x,floor,z+d/2],0,color), tiledRoof(`${name}瓦盖`,w,d,floor+h,[x,z],tile), ...[-1,1].map(s=>openingWall(`${name}侧窗`,d,h,holesAt([0],Math.min(1.4,d*.3),1.1,1.2),[x+s*w/2,floor,z],90,color))];
  for(const s of [-1,1]){
    p.push(box(`${name}承檐枋`,x,floor+h-.05,z+s*d/2,w+.2,.18,.25,wood));
    for(const a of [-1,1])p.push(cylinder(`${name}角柱`,x+a*w/2,floor+h/2,z+s*d/2,.26,h,wood),box(`${name}柱础`,x+a*w/2,floor+.09,z+s*d/2,.48,.18,.48,stone));
  }
  p.push(box(`${name}脊压条`,x,floor+h+Math.min(w,d)*.2+.26,z,w>d?w+.6:.18,.14,w>d?.18:d+.6,tile));
  return p;
}

function court(name: string, w: number, d: number, gate = 0, gap = 3, h = 3): ModelPart[] {
  return [box(`${name}地坪`,0,.12,0,w+1,.24,d+1,stone),openingWall(`${name}前门垣`,w,h,holesAt([gate],gap,Math.min(2.9,h-.1)),[0,.24,-d/2],0,wall),box(`${name}后垣`,0,.24+h/2,d/2,w,h,.3,wall),...[-1,1].map(s=>box(`${name}侧垣`,s*w/2,.24+h/2,0,.3,h,d,wall))];
}

function dividedPrison(): ModelPart[] {
  const p = court("分监大牢",32,38,-10,2.2,4);
  p.push(openingWall("收押甬道后门",8,3.4,holesAt([0],2.2,2.8),[-10,.24,-10],0,stone),tiledRoof("收押甬道顶",8,9,3.64,[-10,-14.5],tile),...civicRoom("狱吏值房",8,7,3.4,9,-13),box("收押验物案",-12,.74,-13,1.2,1,2,wood),box("狱吏卷柜",11,1.49,-11,.8,2.5,2.4,wood));
  for(const x of [-14,-6])p.push(box("甬道侧壁",x,1.94,-14.5,.3,3.4,9,stone));
  const bars: Triple[] = [];
  for(const x of [-8,8]){
    p.push(openingWall("分监院独立门",13,3.2,holesAt([0],1.6,2.6),[x,.24,-6],0,stone),box("监院外侧界",x+(x<0?-6.5:6.5),1.84,5,.3,3.2,22,stone),box("监院内侧界",x+(x<0?6.5:-6.5),1.84,5,.3,3.2,22,stone),box("监院后封墙",x,1.84,16,13,3.2,.3,stone),openingWall("三间牢室门栏窗口",12,3.2,[...holesAt([-4,0,4],1.1,2.4),...holesAt([-5.3,-2.7,-1.3,1.3,2.7,5.3],.65,1.3,.9)],[x,.24,9],0,stone),openingWall("牢室高位后气窗",12,3.2,holesAt([-4,0,4],.9,.55,2.4),[x,.24,15.5],0,stone),tiledRoof("独立监院后三室屋盖",12,6.5,3.44,[x,12.25],tile));
    for(const offset of [-6,-2,2,6])p.push(box("牢室到顶实隔墙",x+offset,1.84,12.25,.3,3.2,6.5,stone));
    for(const a of [-4,0,4])p.push(box("监室后部卧台",x+a,.44,14.2,2.8,.4,1.5,wood));
    for(const a of [-5.3,-2.7,-1.3,1.3,2.7,5.3])for(const t of [-.2,0,.2])bars.push([x+a+t,1.79,9]);
  }
  p.push(...boxBatch("监室窗中透空竖栏",iron,bars,[.055,1.3,.12]));
  return p;
}

function executionGround(): ModelPart[] {
  const p: ModelPart[]=[box("刑场土石场坪",0,.12,0,32,.24,32,stone),box("监斩高台",0,.82,9,13,1.16,6,stone),tiledRoof("监斩棚瓦顶",13,6,4.6,[0,9],tile),postSet("监斩棚承柱",[-6,6].flatMap(x=>[[x,6.5],[x,11.5]] as [number,number][]),3.2,1.4),box("监斩后屏",0,3,11.8,12,3.2,.25,wall),box("监斩木案",0,1.95,10,3.6,1.1,1.1,wood),riseSteps("侧登监斩台阶",.24,1.4,6,.35,2.1,[-4.5,0,3.9]),box("场中低石标位",0,.28,0,3,.08,2,stone)];
  const fence:Triple[]=[];
  for(const x of [-15,15]){
    for(let z=-14.4;z<=14.4;z+=.6)if(Math.abs(z)>1.5)fence.push([x,1.14,z]);
    for(const side of [-1,1])for(const y of [.65,1.65])p.push(box("押解口两旁木横栅",x,y,side*8,.14,.12,13,wood));
  }
  for(let x=-14.4;x<=14.4;x+=.6)if(Math.abs(x)>3)fence.push([x,1.14,-14.5]);
  for(const side of [-1,1])for(const y of [.65,1.65])p.push(box("正口两旁木横栅",side*9,y,-14.5,12,.12,.14,wood));
  p.push(...boxBatch("刑场透空木栅杆",wood,fence,[.12,1.8,.12]),box("刑场后界",0,1.44,14.5,30,2.4,.25,wall));
  for(const z of [6.5,11.5])p.push(box("监斩棚柱顶檐枋",0,4.55,z,12.5,.18,.3,wood));
  for(const x of [-6,6])for(const z of [6.5,11.5])p.push(box("监斩棚柱础",x,1.5,z,.5,.2,.5,stone));
  p.push(box("监斩棚脊压",0,6.06,9,13.6,.14,.18,tile));
  for(const x of [-6,6])p.push(box("台面侧边矮挡",x,1.8,9,.2,.8,5,wood));
  return p;
}

function relayCompound(): ModelPart[] {
  const p=court("驿馆",28,34,3.5,4,2.8);
  p[2]=openingWall("换马独立后出口",28,2.8,holesAt([3.5],4,2.7),[0,.24,17],0,wall);
  p.push(...civicRoom("递铺公文厅",10,8,3.4,-6,-11),openingWall("递铺后交文门",10,3.4,holesAt([0],1.5,2.65),[-6,.24,-7],0,wall),box("递铺交文案",-8,.74,-11,2.4,1,1.1,wood),box("封签文牍柜",-3,1.49,-9,.8,2.5,2.8,wood));
  // 递铺后壁改为真工作门，公文可经侧院交接到马道。
  p.splice(6,1);
  for(const side of [-1,1]){
    const stable: ModelPart[]=[openingWall("马厩三路敞栏",12,3.1,holesAt([-4,0,4],3.1,2.9),[0,.24,-2.5],0,wood),box("马厩后壁",0,1.79,2.5,12,3.1,.2,wood),tiledRoof("独立马厩瓦盖",12,5,3.34,[0,0],tile)];
    for(const x of [-6,-2,2,6])stable.push(box("厩栏分隔",x,1.04,0,.15,1.6,5,wood));
    for(const x of [-4,0,4])stable.push(box("后壁饲槽",x,.84,1.9,2.6,.4,.7,wood));
    p.push(...turn(stable,side<0?-90:90,[side*9,.0,5]));
  }
  p.push(box("卸鞍石台",0,.64,4,3,.8,5,stone),tiledRoof("鞍具棚瓦顶",5,4,3.1,[0,13],tile),postSet("鞍棚柱",[[-2,11.5],[2,11.5],[-2,14.5],[2,14.5]],2.86));
  const pegs:Triple[]=[];for(const x of [-1.4,0,1.4])pegs.push([x,1.4,13]);
  p.push(...boxBatch("承鞍叉架",wood,pegs,[.16,2.32,.8]));
  return p;
}

function tentCamp(): ModelPart[] {
  const p:ModelPart[]=[box("帐营地坪",0,.12,0,40,.24,44,stone),tiledRoof("辕门小挑檐",6,1.4,4.4,[0,-21],tile)];
  const fence:Triple[]=[];
  for(const x of [-19,19])for(let z=-21;z<=21;z+=.5)fence.push([x,1.59,z]);
  for(let x=-18.5;x<=18.5;x+=.5){fence.push([x,1.59,21]);if(Math.abs(x)>2.6)fence.push([x,1.59,-21]);}
  p.push(...boxBatch("营界透空木栅桩",wood,fence,[.22,2.7,.22]));
  for(const x of [-19,19])for(const y of [1,2.3])p.push(box("营界侧横绑",x,y,0,.16,.14,42,wood));
  for(const y of [1,2.3]){p.push(box("营后横绑",0,y,21,38,.14,.16,wood));for(const side of [-1,1])p.push(box("门旁横绑",side*10.8,y,-21,16.4,.14,.16,wood));}
  for(const x of [-2.6,2.6])p.push(cylinder("辕门通高柱",x,2.32,-21,.28,4.16,wood));
  p.push(box("辕门承檐横梁",0,4.31,-21,5.6,.2,.3,wood));
  for(const x of [-3.6,3.6])p.push(cylinder("辕门营旗杆",x,3.07,-20.4,.12,5.66,wood),box("接杆军旗",x+.9,5.5,-20.4,1.8,.8,.04,red));
  for(const x of [-10,10])for(const z of [-11,0]){
    p.push(profileBody("帐后实布三角壁",cloth,[[-3,0],[3,0],[0,3.1]],.08,[x,.24,z+3]),verticalPanel("帐前真实开口布壁",[[-3,0],[3,0],[0,3.1]],holesAt([0],1.5,2.2,.005),.08,[x,.24,z-3],0,cloth));
    for(const side of [-1,1])p.push(beam("军帐斜屋布",cloth,[x+side*3,.28,z],[x,3.34,z],.09,6.1));
    for(const a of [-2.8,2.8])for(const side of [-1,1])p.push(beam("帐内避门三角撑",wood,[x+side*2.8,.24,z+a],[x,3.34,z+a],.1));
    p.push(beam("军帐承脊杆",wood,[x,3.29,z-3],[x,3.29,z+3],.12));
    for(const side of [-1,1])p.push(box("帐内睡铺",x+side*1.9,.42,z,1.3,.36,4,wood));
  }
  p.push(...civicRoom("军令大帐木骨厅",14,7,3.5,0,14,[-4,0,4],2.2,.24,cloth),box("军令舆图案",0,.84,14,4.5,1.2,1.6,wood),box("伙灶接地基座",-14,.64,15,3.5,.8,2,stone),cylinder("伙锅",-14,1.12,15,1.5,.16,iron),box("军械横托架",13,1.34,15,5,.14,.45,wood));
  for(const x of [10.6,15.4])p.push(cylinder("军械架承杆",x,.94,15,.16,1.4,wood));
  return p;
}

function drillGround(): ModelPart[] {
  const p:ModelPart[]=[box("演武完整沙土场",0,.12,0,44,.24,50,stone),box("后部点将台",0,1.02,17,16,1.56,7,stone),tiledRoof("点将台敞棚",16,7,5.4,[0,17],tile),postSet("点将棚柱",[-7.3,7.3].flatMap(x=>[[x,14],[x,20]] as [number,number][]),3.6,1.8),box("点将后挡板",0,3.6,20.3,15,3.6,.2,wood),box("令台案",0,2.3,18,3.6,1,1.1,wood),box("右侧箭道土背垛",14,1.74,8,11,3,2,wall),...civicRoom("侧边器具屋",7,10,3.1,-16,7,[0],2.2)];
  for(const x of [-6,6])p.push(riseSteps("两侧登将台阶",.24,1.8,8,.35,2,[x,0,10.7]));
  for(const x of [10,14,18]){p.push(cylinder("实心草靶",x,1.94,5.8,1.4,.3,"#ae9d68",[90,0,0]),cylinder("靶架落地杆",x,1.04,5.95,.12,1.6,wood),beam("靶架后斜撑",wood,[x,.24,7],[x,1.9,5.95],.1));}
  for(const x of [-4,4]){p.push(cylinder("点将军鼓",x,2.7,18,1.3,1,red,[90,0,0]),box("鼓架接地座",x,2.1,18,1.6,.6,1.1,wood));}
  p.push(box("演武后界",0,1.64,24,43,2.8,.25,wall));
  for(const x of [-21.5,21.5])p.push(box("演武侧界矮垣",x,.94,0,.25,1.4,48,wall));
  return p;
}

function confucianSchool(): ModelPart[] {
  const halfMoon:[number,number][]=[[-9,-8],[-9,-9],[-8.3,-12.4],[-6.3,-15.3],[-3.4,-17.3],[0,-18],[3.4,-17.3],[6.3,-15.3],[8.3,-12.4],[9,-9],[9,-8]];
  const p=court("官学文庙",38,46,0,4,3);
  p[0]=hardPlan("文庙地坪真实泮池空口",stone,[[-19.5,-23.5],[19.5,-23.5],[19.5,23.5],[-19.5,23.5]],.24,[0,0,0],[halfMoon]);
  p.push(hardPlan("半月泮池底",stone,halfMoon,.06),hardPlan("泮池静水面", "#7b9890",halfMoon,.02,[0,.12,0]),box("跨池中桥",0,.3,-13,2.6,.12,10.4,stone));
  for(const z of [-17.5,-8.5])for(const x of [-1.15,1.15])p.push(box("桥下实承石墩",x,.18,z,.25,.36,.4,stone));
  for(const x of [-5,0,5])p.push(openingWall("棂星门三路通口",4.8,4.4,holesAt([0],2.8,3.8),[x,.24,-4],0,red),tiledRoof("棂星门小瓦顶",4.8,1.1,4.64,[x,-4],tile));
  p.push(box("祭殿完整高台",0,.6,15,21, .72,11),...civicRoom("明伦祭殿",19,9,5,0,15,[-6,0,6],2.6,.96,red),riseSteps("祭殿中轴石阶",.24,.96,4,.4,3.8,[0,0,7.9]),box("先师神位承台",0,1.46,17.5,5,1,1.2,wood),box("神位立屏",0,3.3,18,3,2.7,.25,red));
  for(const side of [-1,1])p.push(...turn(civicRoom("东西礼器庑",13,5,3.1,0,0,[-4,0,4],2),side<0?-90:90,[side*14,0,10]));
  return p;
}

function examinationCourt(): ModelPart[] {
  const p=court("贡院",36,42,0,3.2,3.6);
  p.push(...civicRoom("搜检厅",12,5,3.4,0,-16,[0],3),openingWall("搜检厅后出门",12,3.4,holesAt([0],3,2.8),[0,.24,-13.5],0,wall),...civicRoom("监临明厅",17,6,4,0,16,[-5,0,5],2.4),box("监临官案",0,.84,17,4.5,1.2,1.2,wood));
  p.splice(6,1);
  const dividers:Triple[]=[],boards:Triple[]=[],seats:Triple[]=[];
  for(const x of [-10,10])for(const z of [-5,6]){
    p.push(tiledRoof("号棚独立低屋顶",10.8,5,2.84,[x,z],tile),box("号棚封后墙",x,1.54,z+2.5,10.8,2.6,.2,wall));
    for(let i=0;i<=6;i++)dividers.push([x-5.4+i*1.8,1.54,z]);
    for(let i=0;i<6;i++){const xx=x-4.5+i*1.8;boards.push([xx,1.04,z+.1]);seats.push([xx,.58,z+1.5]);}
  }
  p.push(...boxBatch("号舍逐间实隔板",wall,dividers,[.16,2.6,5]),...boxBatch("每间答题板",wood,boards,[1.6,.12,.6]),...boxBatch("每间坐卧台",wood,seats,[1.6,.68,1]));
  return p;
}

function mortuaryCompound(): ModelPart[] {
  const p=court("义庄",28,30,-7,4,2.6);
  p.push(...civicRoom("停柩长屋",22,9,3.8,0,7,[-8.25,-2.75,2.75,8.25],2.1),tiledRoof("前卸柩廊瓦盖",22,3,3.5,[0,1],tile),postSet("卸柩廊前柱",[-10,-5,0,5,10].map(x=>[x,-.5]),3.26),...civicRoom("义庄值房",6,6,3.1,9,-9),box("停柩后勤移置台",-9,.64,-8,3,.8,5,wood));
  for(const x of [-5.5,0,5.5])p.push(box("停柩分室厚壁",x,2.14,7,.3,3.8,9,wall));
  for(const x of [-8.25,-2.75,2.75,8.25]){
    for(const z of [6.2,8.3])p.push(box("棺下双枕木",x,.44,z,2.1,.4,.3,wood));
    p.push(profileBody("封合停柩棺身",wood,[[-.65,0],[.65,0],[.9,.6],[.75,.85],[-.75,.85],[-.9,.6]],3.2,[x,.64,7.25]),box("棺盖",x,1.54,7.25,1.6,.1,3.25,wood));
  }
  return p;
}

function mountainShrine(): ModelPart[] {
  const p:ModelPart[]=[box("岩庙前埕",0,.12,0,23,.24,26,stone),profileBody("露岩承龛山根",stone,[[-8,0],[8,0],[7,6.4],[3,8],[0,7.2],[-4,8.8],[-8,5.2]],6,[0,.24,9]),box("岩根高庙台",3,1.42,3,9,2.36,7,stone),box("折返转台",-5,.92,1,4,1.36,5,stone),riseSteps("前埕上转台",.24,1.6,7,.35,2,[-5,0,-3.95]),...turn([riseSteps("转台横上庙台",1.6,2.6,5,.4,2,[0,0,0])],90,[-3,0,2.5]),tiledRoof("岩前开放小庙亭",9,7,5.7,[3,3],tile),postSet("庙亭落高台承柱",[[-1,0],[7,0],[-1,6],[7,6]],3.1,2.6),openingWall("岩前偏龛屏壁",8,3.1,holesAt([0],1.9,2.5),[3,2.6,5.8],0,red),box("偏龛石座",3,2.95,6.2,2,.7,1.1,stone),part("抽象山神石碑", "extrude",stone,[3,3.3,6.4],[1,1,1],[0,0,0],{depth:.25,profile:[{x:-.6,y:0},{x:.6,y:0},{x:.6,y:1.7},{x:0,y:2.1},{x:-.6,y:1.7}]}),...civicRoom("供器耳房",4,6,2.9,-8.5,-6.5),box("龛前低供案",3,3.05,4.8,2.3,.9,.7,wood)];
  return p;
}

function cityGodCourt(): ModelPart[] {
  const p=court("城隍戏庙院",36,42,-12,3,3);
  p.push(box("前戏台实基",0,.9,-15,14,1.32,7,stone),tiledRoof("戏台高挑瓦盖",14,7,6,[0,-15],tile),postSet("戏台承柱",[[-6.4,-18], [6.4,-18],[-6.4,-12],[6.4,-12]],4.44,1.56),openingWall("戏台后台双出入屏",13,4.44,holesAt([-4.5,4.5],1.3,2.65),[0,1.56,-16],0,wood),...turn([riseSteps("戏台后台侧上石阶",.24,1.56,7,.35,1.7,[0,0,0])],90,[-9.45,0,-17.5]),box("侧阶顶接台门石",-7,1.46,-17.5,.3,.2,1.7,stone),box("审神殿高台",0,.6,14,20,.72,11,stone),...civicRoom("后审神殿",18,9,4.7,0,14,[-5.5,0,5.5],2.2,.96,red),riseSteps("后殿中阶",.24,.96,4,.4,3.5,[0,0,6.9]),box("神判座屏",0,2.96,17.5,4,4,.3,wood),box("神判座台",0,1.46,17,5,1,1.4,wood));
  for(const side of [-1,1])p.push(...turn(civicRoom("东西司房",13,5,3.3,0,0,[-4,0,4],1.6),side<0?-90:90,[side*13.5,0,4]));
  return p;
}

function mountainPass(): ModelPart[] {
  const p:ModelPart[]=[box("关隘前后驿路坪",0,.12,0,35,.24,32,stone),verticalPanel("单券厚关墙",[[-9,0],[9,0],[9,5.8],[-9,5.8]],[windowHole(0,.035,3.8,4.5)],6,[0,.24,0],0,stone),box("关顶巡行面",0,6.14,0,18.4,.2,6.4,stone),profileBody("东山肩收分挡墙",stone,[[0,0],[6,0],[6,8],[4,8.8],[0,5.8]],6,[9,.24,0]),profileBody("西山肩收分挡墙",stone,[[-6,0],[0,0],[0,5.8],[-4,8.8],[-6,8]],6,[-9,.24,0]),profileBody("外绕山肩登关实坡",stone,[[0,.24],[16,.24],[16,6.24]],2,[16,0,-11],-90),box("山肩后绕转关顶桥",12.2,6.14,6,8.4,.2,2,stone),box("绕桥实承石墩",12.2,3.12,6,1,6.24,1.8,stone),box("绕桥接回关顶腿",8.2,6.14,5,1.6,.2,4,stone),box("接腿石墩",8.2,3.12,5.7,1.4,6.24,1,stone),tiledRoof("关顶值亭低瓦盖",5,4,9.24,[-4,0],tile),postSet("关亭承柱",[[-6.2,-1.7],[-1.8,-1.7],[-6.2,1.7],[-1.8,1.7]],3,6.24)];
  p.push(box("关顶前低垛墙",0,6.74,-3.05,18.1,1,.25,stone),box("后低垛避绕桥口",-1.025,6.74,3.05,16.05,1,.25,stone),box("关顶东沿让坡口后挡",9,6.74,-1.4,.25,1,3.4,stone),box("关顶西沿挡护",-9,6.74,0,.25,1,6,stone));
  p.push(box("绕桥后外挡",12.2,6.74,7,8.4,1,.15,stone),box("绕桥前挡避坡和接腿",12,6.74,5,5.6,1,.15,stone),box("接腿西沿挡",7.4,6.74,5,.15,1,4,stone),box("接腿东沿短挡",9,6.74,4.15,.15,1,1.7,stone));
  return p;
}

function riverCustomhouse(): ModelPart[] {
  const p:ModelPart[]=[box("低埠完整石坪",0,.2,-9,27,.4,12,stone),box("高岸关署承台",0,.9,5,27,1.8,16,stone),...civicRoom("高岸关账厅",12,8,3.8,-5,7,[0],2.5,1.8),...civicRoom("暂扣货库",7,10,3.6,8,6,[0],2,1.8),tiledRoof("低埠验货敞棚",12,7,3.7,[-5,-9],tile),postSet("验货棚承柱",[[-10.5,-12], [.5,-12],[-10.5,-6],[.5,-6]],3.3,.4),box("验货长木案",-7,.95,-9,5,1.1,1.4,wood),profileBody("低埠上岸运货坡",stone,[[0,.4],[6,.4],[6,1.8]],3,[7,0,-9],-90),riseSteps("客商步行登岸阶",.4,1.8,7,.35,2.5,[-3,0,-5.45]),openingWall("岸后客商外街门",27,3,holesAt([-5],2.6,2.8),[0,1.8,13],0,wall),box("岸后登街接地石阶顶台",-5,.9,14.5,3,1.8,3,stone),...turn([riseSteps("岸后街落地石阶",0,1.8,9,.3,3,[0,0,0])],180,[-5,0,18.7]),box("码头泊船系缆石",-11,.75,-13,1,.7,1,stone)];
  for(const x of [-13,13])p.push(box("高岸侧界",x,3.3,5,.3,3,16,wall));
  p.push(box("账厅验印柜",-8,2.35,8,3,1.1,1,wood),box("货库离地垫台",8,2.05,8,5,.5,3,wood));
  return p;
}
