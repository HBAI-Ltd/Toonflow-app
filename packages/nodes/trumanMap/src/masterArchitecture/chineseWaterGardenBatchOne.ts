import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { tiledRoof } from "./periodPublicSpaceBatchOne";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const stone = "#a4aa9b", coping = "#c2c1a8", wood = "#79573e", red = "#9c5141", waterColor = "#729e9c", rock = "#7d8980";

function water(name: string, x: number, y: number, z: number, width: number, depth: number): ModelPart {
  return part(name, "box", waterColor, [x, y, z], [width, .045, depth], [0, 0, 0], { opacity: .78, roughness: .2 });
}

function basin(name: string, x: number, z: number, width: number, depth: number, bottom: number, height: number, spill = false, surface = true): ModelPart[] {
  const parts = [box(`${name}完整实底`, x, bottom + .1, z, width, .2, depth, stone)];
  if(surface)parts.push(water(`${name}独立局部水面`, x, bottom + height * .7, z, width - .45, depth - .45));
  for (const side of [-1, 1]) parts.push(box(`${name}两侧真实池壁`, x + side * (width / 2 - .12), bottom + .2 + height / 2, z, .24, height, depth, stone), box(`${name}两侧压顶石`, x + side * (width / 2 - .12), bottom + .25 + height, z, .38, .1, depth + .1, coping));
  parts.push(box(`${name}封合后池壁`, x, bottom + .2 + height / 2, z - depth / 2 + .12, width, height, .24, stone));
  if (spill) for (const side of [-1, 1]) parts.push(box(`${name}留出中央溢口的前池壁`, x + side * (width + 1.6) / 4, bottom + .2 + height / 2, z + depth / 2 - .12, (width - 1.6) / 2, height, .24, stone));
  else parts.push(box(`${name}封合前池壁`, x, bottom + .2 + height / 2, z + depth / 2 - .12, width, height, .24, stone));
  return parts;
}

export const chineseWaterGardenBatchOneDesigns: ArchitecturePrototype[] = [
  design("九折朱栏栈桥荷塘池院", "中式古代古装剧园池，九折窄桥由实际落池底桥柱承托，独立荷塘和两岸登桥台形成完整池院；水面随模型整体移动，以池底为放置基准，不依赖世界海平面", lotusBridgeCourt, "建筑", "中式"),
  design("曲水流觞蛇渠席台石庭", "中式古代古装剧雅集石庭，五段连续折返的浅曲水石渠绕过独立席台，槽底、双边槽壁与转角实际相接；水是局部静态水面，不模拟酒杯或流量", windingWaterCourt, "建筑", "中式"),
  design("三级蓄槽跌水叠石围潭", "中式古代古装剧人工水景，上蓄水池经两道实体跌槽和静态水帘落入低位围潭，台体、检修石阶和护岸完整相接；以最低池底为放置基准，区别自然岩壁瀑布", steppedWaterGarden, "建筑", "中式"),
  design("龙吻照壁吐水浅池院", "中式古代古装剧独立水院，薄石照壁承托中空龙吻出水嘴，窄水帘接入低浅接水池，双侧坐台围住前庭；并非深龛宫殿换雕像，水面不绑定海平面", dragonSpoutCourt, "建筑", "中式"),
  design("闸槽石栅内外分水放生池", "中式古代古装剧寺观配套水院，内外双水面由石隔堰、可辨闸槽和提升木闸相连，石栅保留流水孔并阻隔鱼道；为静态景物，不宣称真实流量守恒", releasePond, "建筑", "中式"),
  design("高槽水斗杠杆踏碓涧庭", "中式古代古装剧水力作坊，高位水槽把局部水面引向偏轴水斗，水斗接长杠杆和石碓头，支承轴座、落碓石臼与遮棚完整；区别水轮磨坊，当前为静态机构", waterPoweredPestle, "建筑", "中式"),
];

function lotusBridgeCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("荷塘院完整落地地坪", 0, .1, 0, 22, .2, 24, coping), ...basin("荷塘", 0, 0, 17, 17, .2, .7)];
  const points: [number, number][] = [[0,-8.3],[0,-5],[-3,-5],[-3,-2],[3,-2],[3,2],[-2,2],[-2,5],[0,5],[0,8.3]];
  for (let index = 1; index < points.length; index++) {
    const [ax, az] = points[index - 1]!, [bx, bz] = points[index]!, alongX = ax !== bx, length = Math.abs(bx - ax || bz - az);
    const first = index === 1, last = index === points.length - 1;
    // 两岸桥端止于岸台内缘，避免同高的木面与石面重叠闪烁。
    const span = length + 1.15 - (first || last ? .525 : 0);
    const centerZ = (az + bz) / 2 + (first ? .2625 : last ? -.2625 : 0);
    parts.push(box("九折桥每段互相咬合的承走桥板", (ax + bx) / 2, 1.19, centerZ, alongX ? span : 1.15, .18, alongX ? 1.15 : span, wood));
    for (const side of [-1, 1]) {
      const x1 = alongX ? ax + Math.sign(bx - ax) * .65 : ax + side * .51, z1 = alongX ? az + side * .51 : az + Math.sign(bz - az) * .65;
      const x2 = alongX ? bx - Math.sign(bx - ax) * .65 : bx + side * .51, z2 = alongX ? bz + side * .51 : bz - Math.sign(bz - az) * .65;
      parts.push(beam("转角留空而不挡桥面转向的朱栏扶手", red, [x1,2.05,z1], [x2,2.05,z2], .075));
      for (const [x,z] of [[x1,z1],[x2,z2]]) parts.push(cylinder("实际从桥面接到扶手的栏柱", x!, 1.64, z!, .09, .85, red));
    }
  }
  for (const [x,z] of points) parts.push(box("由池底接住转角桥板的实体桥柱", x, .65, z, .32, .9, .32, stone));
  for (const end of [-1,1]) {
    parts.push(box("岸边登桥石台与桥板同高实接", 0, .74, end * 9.2, 3, 1.08, 1.7, stone));
    for (let step=0;step<6;step++) parts.push(box("从院坪逐级实接岸台的完整登桥石阶",0,.2+(step+1)*.09,end*(11.45-step*.28),3,(step+1)*.18,.3,stone));
  }
  for (const [x,z] of [[-5.8,-6], [5.8,-5], [-5.6,1], [5.8,5]]) {
    parts.push(cylinder("荷叶下实际接入水面的独立叶梗", x!, .81, z!, .035, .3, "#768b59"), part("水面上的宽扁荷叶", "sphere", "#8b9d70", [x!, .97, z!], [1.6,.07,1.3]));
    for (let petal = 0; petal < 4; petal++) { const angle = petal * Math.PI / 2; parts.push(part("荷花展开的独立花瓣", "sphere", "#d4b2a2", [x! + Math.cos(angle) * .12, 1.02, z! + Math.sin(angle) * .12], [.24,.12,.24])); }
  }
  return parts;
}

function windingWaterCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("曲水雅集完整落地石庭", 0,.1,0,19,.2,17,coping)];
  const points: [number,number][] = [[-6,-5],[6,-5],[6,0],[-6,0],[-6,5],[6,5]];
  for (let index = 1; index < points.length; index++) {
    const [ax,az] = points[index-1]!, [bx,bz] = points[index]!, alongX = ax !== bx, length = Math.abs(bx-ax || bz-az), cx=(ax+bx)/2, cz=(az+bz)/2;
    parts.push(box("五段相接的浅曲渠完整槽底",cx,.24,cz,alongX?length+.7:.7,.08,alongX?.7:length+.7,stone), water("折返浅渠独立水面",cx,.37,cz,alongX?length+.52:.52,alongX?.52:length+.52));
    for (const side of [-1,1]) parts.push(box("渠边留转角开口的窄石壁",cx+(alongX?0:side*.39),.42,cz+(alongX?side*.39:0),alongX?length-.8:.12,.36,alongX?.12:length-.8,stone));
  }
  for (let index=0;index<points.length;index++) {
    const [x,z]=points[index]!, neighbours=[points[index-1],points[index+1]].filter((point): point is [number,number]=>!!point);
    parts.push(box("曲水转角完整连接槽底",x,.24,z,1,.08,1,stone),water("曲水转角实际连接各直段的水面",x,.37,z,.75,.75));
    for(const [dx,dz] of [[-1,0],[1,0],[0,-1],[0,1]]) {
      if(neighbours.some(([nx,nz])=>Math.sign(nx-x)===dx&&Math.sign(nz-z)===dz)) continue;
      parts.push(box("转角外侧与渠端真实封水石壁",x+dx!*.39,.42,z+dz!*.39,dx?.12:.9,.36,dz?.12:.9,stone));
    }
  }
  for (const x of [-3.8,0,3.8]) for (const z of [-2.5,2.5]) parts.push(box("置于两道曲水之间的独立席台",x,.31,z,2.2,.22,1.25,stone), box("雅集席台上的竹席",x,.45,z,1.9,.06,1,wood));
  for (const x of [-8,8]) parts.push(box("庭外缘不挡水渠和席台的长坐石",x,.55,0,.8,.7,13,stone));
  return parts;
}

function steppedWaterGarden(): ModelPart[] {
  const parts: ModelPart[] = [box("完整三级跌水落地石基",0,.1,0,12,.2,17,coping), box("承托上蓄池的完整实心叠石台体",0,1.5,-4,6.4,2.6,4.5,rock), box("承托中蓄槽的实心矮石台体",0,.8,.05,4.5,1.2,3.2,rock), ...basin("高位蓄水池",0,-4,6,4,2.8,.8,true), ...basin("中位跌水槽",0,.05,4,3,1.4,.7,true), ...basin("低位围潭",0,4.6,8,5.6,.2,.9)];
  parts.push(box("上池溢口接到下一级的石唇",0,3.275,-1.65,1.8,.15,1.3,stone), box("中槽出水口外挑石唇",0,1.8,1.85,1.8,.15,1.3,stone),water("上池溢口到帘顶连续水膜",0,3.36,-1.625,1.45,1.39),water("中槽溢口到帘顶连续水膜",0,1.89,1.885,1.45,1.37));
  parts.push(part("上池落入中槽的独立静态水帘","box",waterColor,[0,2.63,-.965],[1.45,1.5,.07],[0,0,0],{opacity:.65,roughness:.18}),part("中槽落入围潭的独立静态水帘","box",waterColor,[0,1.36,2.535],[1.45,1.1,.07],[0,0,0],{opacity:.65,roughness:.18}));
  for (const side of [-1,1]) for (let step=0;step<5;step++) parts.push(box("跌水两侧接台的粗石护岸",side*(3.3-step*.22),.55+step*.28,-.8-step*1.1,1.3,1.1+step*.56,1.7,rock));
  for(let step=0;step<10;step++)parts.push(box("侧面实际登到上池顶台的完整检修石阶",4.6,.2+(step+1)*.13,1.2-step*.48,1.1,(step+1)*.26,.5,stone));
  parts.push(box("阶顶横向接到上池旁的石平台",3.8,2.6,-3.6,2.7,.4,1.1,stone));
  return parts;
}

function dragonSpoutCourt(): ModelPart[] {
  const parts: ModelPart[] = [box("吐水院完整落地前庭",0,.1,0,12,.2,12,coping),...basin("照壁前低浅接水池",0,.5,7,4.8,.2,.65), box("独立薄照壁落地墙身",0,2.5,-2.1,9,4.6,.55,stone), tiledRoof("照壁青瓦压顶",9.8,1.8,4.8,[0,-2.1])];
  parts.push(box("照壁中部实接墙身的浮雕底板",0,2.9,-1.77,3.4,2.7,.18,"#b8b59d"),part("吐水龙吻的实心石颅","sphere",stone,[0,3.2,-1.43],[1.2,.9,.8]),ring("龙吻保留真实出水口的石质短嘴",stone,.26,.09,0,.75,{position:{x:0,y:2.95,z:-.98},rotation:{x:90,y:0,z:0}}));
  for(const side of [-1,1])parts.push(part("龙吻两侧与石颅相接的短角","cone",stone,[side*.36,3.7,-1.5],[.18,.7,.18],[0,0,-side*24]),box("池侧实际落地的长坐石",side*4.6,.55,.4,.9,.7,5.2,stone));
  parts.push(part("龙嘴到池面独立连续的静态水线","tube",waterColor,[0,0,0],[1,1,1],[0,0,0],{radius:.075,path:[{x:0,y:2.95,z:-.55},{x:0,y:2.8,z:-.2},{x:0,y:1.8,z:.25},{x:0,y:.66,z:.5}],opacity:.72,roughness:.15}));
  return parts;
}

function releasePond(): ModelPart[] {
  const parts: ModelPart[] = [box("放生池内外水院共用石基",0,.1,0,16,.2,16,coping),...basin("内外共用完整池体",0,0,12,12,.2,.9,false,false),box("内外池面之间的隔堰左段",-3.5,.8,0,5,1.2,.45,stone),box("内外池面之间的隔堰右段",3.5,.8,0,5,1.2,.45,stone),water("内侧放生池独立水面",0,.83,-3,11.55,5.55),water("外侧出水池独立水面",0,.83,3,11.55,5.55),water("闸口下方连接内外水面的局部水道",0,.83,0,2,.5)];
  for(const x of [-1.15,1.15])parts.push(box("闸门两侧真实立地导槽柱",x,1.52,0,.4,2.24,.7,stone),box("导槽内侧承门的实心滑轨",x-Math.sign(x)*.19,1.7,-.28,.09,2,.16,wood));
  parts.push(box("两导槽柱顶实际跨接的提升横梁",0,2.68,0,3.1,.22,.5,wood),box("在导槽之间抬起的独立木闸板",0,1.7,0,2,1.35,.17,wood),cylinder("木闸板顶端实际接到提升梁的吊杆",0,2.6,0,.1,.9,wood));
  parts.push(box("闸前由池壁承接的窄检修栈板",0,1.35,-.8,12,.18,.75,wood));
  for(const x of [-4.7,-2.4,0,2.4,4.7])parts.push(box("从池底接住检修栈板的短石墩",x,.72,-.8,.3,1.08,.5,stone));
  for(let index=0;index<11;index++)parts.push(box("闸口前后保留真实水隙的拦鱼石栅",-.9+index*.18,.72,.48,.09,1,.13,stone));
  for(const side of [-1,1])parts.push(box("外岸接到检修板的独立踏台",side*6.55,.77,-.8,1.2,1.14,1.5,stone));
  return parts;
}

function waterPoweredPestle(): ModelPart[] {
  const headPool=basin("水碓高位蓄水池",0,0,3.1,3.1,1.9,.7,true);
  for(const value of headPool){const {x,z}=value.position;value.position.x=-3.6+z;value.position.z=-2.1-x;value.rotation.y=90;}
  const parts: ModelPart[] = [box("水碓涧庭完整落地石坪",0,.1,0,12,.2,12,coping),box("高槽蓄水池完整承重台",-3.6,1.05,-2.1,3.4,1.7,3.4,rock),...headPool];
  parts.push(box("由高台伸向水斗的实底导水木槽",-1.3,2.3,-2.1,3.4,.18,.65,wood),water("导水槽内连续局部水面",-1.3,2.415,-2.1,3.4,.43));
  for(const side of [-1,1])parts.push(box("导水槽两边不挡流水的连续木围板",-1.3,2.5,-2.1+side*.3,3.4,.45,.12,wood));
  for(const x of [-1.9,-.4])parts.push(box("从石坪实际支住外伸水槽的木撑柱",x,1.25,-2.1,.17,2.1,.2,wood));
  parts.push(part("高槽落入水斗的局部短水帘","box",waterColor,[.28,2.26,-2.1],[.24,.36,.055],[0,0,0],{opacity:.7}),box("盛水斗的完整木底",0,1.55,-2.1,.95,.12,1.15,wood));
  for(const side of [-1,1])parts.push(box("开口水斗的两侧木壁",side*.45,1.92,-2.1,.1,.7,1.15,wood),box("开口水斗的两端木壁",0,1.92,-2.1+side*.53,.95,.7,.1,wood));
  parts.push(water("水斗内可见独立水面",0,2.08,-2.1,.75,.9),box("连接水斗和碓头的通长实木杠杆",0,1.38,.2,.25,.22,5.8,wood));
  for(const x of [-.62,.62])parts.push(box("支承水碓转轴的完整石墩",x,.73,.1,.45,1.06,.8,stone),box("石墩顶部实际接住轴端的木轴承座",x,1.29,.1,.45,.18,.5,wood));
  parts.push(cylinder("穿过杠杆与左右轴承座的实际转轴",0,1.32,.1,.22,1.65,wood,[0,0,90]),box("杠杆端部竖向下击的实木碓柄",0,.98,2.65,.2,.92,.22,wood),box("碓柄下端实接的石碓头",0,.53,2.65,.48,.3,.48,rock),cylinder("落碓石臼的封闭落地底座",0,.34,2.65,1.3,.28,stone),ring("保留真实臼口并接住碓头的石臼壁",stone,.68,.2,.57,.35,{position:{x:0,y:.57,z:2.65}}));
  for(const x of [-1.6,1.6])for(const z of [1.1,4.3])parts.push(cylinder("独立遮碓棚从石坪接到屋梁的木柱",x,1.85,z,.17,3.3,wood));
  for(const z of [1.1,4.3])parts.push(box("遮棚柱顶实接的横檐梁",0,3.52,z,3.4,.2,.2,wood));
  parts.push(tiledRoof("遮碓棚完整灰瓦屋盖",4,4,3.65,[0,2.7]));
  return parts;
}
