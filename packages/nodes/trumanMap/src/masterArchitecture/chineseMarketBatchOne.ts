import { beam, part, ring, type ModelPart } from "../assetModelParts";
import { box, cylinder, design, type ArchitecturePrototype } from "./structures";

const wood = "#886a49", dark = "#5d4b37", stone = "#a8a591", linen = "#c9bea0", iron = "#58635e";

function table(w: number, d: number, top: number, x = 0, z = 0): ModelPart[] {
  return [box("案板", x, top - .05, z, w, .1, d, wood), ...[-1, 1].flatMap(s => [-1, 1].map(e => box("案脚", x + s * (w / 2 - .12), (top - .1) / 2, z + e * (d / 2 - .12), .1, top - .1, .1, dark)))];
}

function tub(name: string, x: number, y: number, z: number, r: number, h: number, color = wood): ModelPart {
  return part(name, "lathe", color, [x, y, z], [1, 1, 1], [0, 0, 0], { profile: [{x:0,y:0},{x:r*.85,y:0},{x:r,y:h},{x:r-.045,y:h},{x:r*.85-.045,y:.055},{x:0,y:.055}] });
}

export const chineseMarketBatchOneDesigns: ArchitecturePrototype[] = [
  design("双桶屉板挑担豆腐摊", "中式古代古城街道集市古装剧：双桶挑担带沥水屉、切豆腐案和低位接水盆，可直接落地摆摊；不是单根扁担换货物", tofuShoulderStall, "设施", "中式"),
  design("侧火筒炉烧饼担摊", "中式古代古城街道集市古装剧：落地担架承立式火筒炉、炉口、揉面案和出饼屉，完整移动食摊而非通用顶棚", breadOvenStall, "设施", "中式"),
  design("双轮架灶汤锅面食摊车", "中式古代古城街道集市古装剧：贯通轮轴、前撑脚和车辕承托带灶汤锅、切面案及碗架，开敞操作面朝街", noodleCart, "设施", "中式"),
  design("悬杆斜案接水鲜鱼摊", "中式古代古城街道集市古装剧：后立柱横杆悬鱼、倾斜鱼案和前沿接水沟组成独立展售结构，不是平案换商品", fishStall, "设施", "中式"),
  design("竹席落地卷轴字画展摊", "中式古代古城街道集市古装剧：地席连独立三脚画架、悬卷横轴和铺地卷轴形成低位书画摊，非带棚货桌", paintingStall, "设施", "中式"),
  design("后屏高梁悬肉屠案摊", "中式古代古城街道集市古装剧：高挂梁、吊钩、落地厚砧案和背后遮屏构成完整肉案，工作案与悬挂架实接", butcherStall, "设施", "中式"),
  design("折屏围座洗头剃头摊", "中式古代古城街道集市古装剧：三折屏围出座位，独立盆架、热水罐和工具案组成开放理发小摊，不含人物", barberStall, "设施", "中式"),
  design("格仓滑闸出粮斗售粮架", "中式古代古城街道集市古装剧：三只敞口木粮仓沿背架悬起，底喉滑闸朝向下方量斗承台，独立下料结构区别量斗亭", grainStall, "设施", "中式"),
];

function tofuShoulderStall(): ModelPart[] {
  const p: ModelPart[] = [];
  for (const x of [-.86, .86]) {
    p.push(box("桶底短脚",x,.05,0,.65,.1,.65,dark),tub("木桶",x,.1,0,.42,.82),ring("桶箍",dark,.4,.025,.52,.045,{position:{x,y:.52,z:0}}),box("挑架立榫",x,1.08,.39,.12,.4,.12,dark));
  }
  p.push(box("挑梁",0,1.25,.36,2.65,.1,.13,wood),box("盆托",-.86,.935,0,.83,.05,.12,dark));
  for(let i=0;i<6;i++)p.push(box("沥水屉条",.86+(i-2.5)*.14,.965,0,.115,.09,.85,wood));
  for (const side of [-1,1]) p.push(box("屉边",.86+side*.43,1.04,0,.045,.13,.85,dark),box("屉端",.86,1.04,side*.41,.88,.13,.045,dark));
  for(const x of [.62,.86,1.1])for(const z of [-.2,.1])p.push(box("豆腐块",x,1.06,z,.22,.1,.25,"#e3d8b4"));
  p.push(tub("接水盆",-.86,.96,0,.35,.17,linen));
  return p;
}

function breadOvenStall(): ModelPart[] {
  const p: ModelPart[] = [...table(.95,.9,.95,.65,0),tub("炉筒",-.65,.16,0,.38,.95,stone),cylinder("炉底",-.65,.14,0,.62,.1,iron),box("闭合炉门",-.65,.36,-.37,.24,.22,.06,iron)];
  for(const s of [-1,1])p.push(box("炉脚",-.65+s*.25,.075,0,.14,.15,.42,iron),box("炉架柱",s*1.18,.65,.27,.1,1.3,.12,dark));
  p.push(box("担梁",0,1.34,.27,2.6,.11,.13,wood),box("出饼屉",.65,1.02,0,.8,.14,.74,linen));
  for(const x of [.45,.75])for(const z of [-.22,.12])p.push(cylinder("饼",x,1.12,z,.25,.065,"#d0aa70"));
  p.push(beam("炉架连杆",dark,[-1.18,.3,.27],[-.65,.3,.27],.1),beam("案架连杆",dark,[.65,.8,.27],[1.18,.8,.27],.1));
  return p;
}

function noodleCart(): ModelPart[] {
  const p: ModelPart[] = [box("车底架",0,.6,0,1.45,.2,1.85,dark),box("带灶车箱",0,.84,0,1.4,.3,1.7,wood),cylinder("贯通轮轴",0,.32,.4,.13,1.85,iron,[0,0,90])];
  for(const s of [-1,1])p.push(cylinder("木轮",s*.8,.32,.4,.64,.15,dark,[0,0,90]),box("轴箱",s*.65,.47,.4,.2,.3,.26,iron),box("前撑脚",s*.6,.3,-.7,.12,.6,.14,dark),box("车辕",s*.58,.58,1.4,.1,.12,1.2,wood));
  p.push(tub("汤锅",-.28,.99,0,.36,.3,iron),cylinder("锅中汤面",-.28,1.2,0,.61,.025,"#a69978"),box("切面案",.49,1.02,-.15,.43,.09,1.35,linen),box("灶火口",0,.81,-.87,.42,.18,.055,iron));
  for(const x of [-.57,.57])p.push(box("碗架立柱",x,1.26,.72,.09,.55,.09,dark));
  p.push(box("碗架层板",0,1.51,.72,1.3,.08,.3,wood));
  for(const x of [-.4,0,.4])p.push(tub("碗",x,1.55,.72,.13,.1,linen));
  return p;
}

function fishStall(): ModelPart[] {
  const p: ModelPart[] = [part("斜鱼案","box",wood,[0,.98,0],[2,.1,1.2],[-12,0,0]),box("接水沟底",0,.74,-.72,2,.08,.26,wood)];
  for(const s of [-1,1]){
    for(const z of [-.45,.45]){const h=.98+z*Math.tan(Math.PI/15)-.04;p.push(box("斜案支脚",s*.83,h/2,z,.1,h,.12,dark));}
    p.push(box("挂架立柱",s*1.03,1.15,.48,.12,2.3,.12,dark),box("接水沟边",0,.81,-.72+s*.12,2,.12,.04,dark));
  }
  p.push(box("悬鱼横杆",0,2.3,.48,2.2,.14,.14,dark));
  for(const x of [-.65,0,.65])p.push(beam("吊绳",dark,[x,2.3,.48],[x,2.06,.48],.018),part("鱼尾","cone",iron,[x,1.96,.48],[.22,.25,.1]),part("悬鱼","sphere", "#9baea3",[x,1.62,.48],[.26,.58,.16]));
  return p;
}

function paintingStall(): ModelPart[] {
  const p: ModelPart[] = [box("铺地竹席",0,.025,0,2.7,.05,2.7,linen)];
  for(const s of [-1,1])p.push(beam("画架前脚",dark,[s*.68,.05,.5],[s*.62,1.9,.65],.08));
  p.push(beam("画架后撑",dark,[0,.05,1.3],[0,1.9,.65],.08),box("架顶横梁",0,1.86,.65,1.45,.1,.12,wood),box("悬展纸轴",0,1.28,.6,1.3,1.05,.035,linen));
  for(const y of [.74,1.82])p.push(cylinder("卷轴木杆",0,y,.6,.065,1.5,dark,[0,0,90]));
  p.push(beam("墨山",iron,[-.48,1.1,.57],[0,1.55,.57],.035),beam("墨坡",iron,[0,1.55,.57],[.46,1.04,.57],.035));
  for(const x of [-.85,0,.85])p.push(cylinder("铺地画卷",x,.12,-.4,.14,.7,linen,[0,0,90]));
  return p;
}

function butcherStall(): ModelPart[] {
  const p: ModelPart[] = [...table(2.1,1.1,1.1),box("厚木砧",-.48,1.19,-.1,.65,.18,.7,dark),box("案后挡屏",0,.85,.56,2.1,.85,.08,linen)];
  for(const s of [-1,1])p.push(box("挂肉柱",s*1.02,1.225,.48,.13,2.45,.13,dark));
  p.push(box("挂肉横梁",0,2.45,.48,2.2,.14,.17,dark));
  for(const x of [-.62,0,.62])p.push(beam("吊钩柄",iron,[x,2.43,.48],[x,2.18,.48],.025),ring("挂钩",iron,.085,.018,0,.035,{position:{x,y:2.14,z:.48},rotation:{x:90,y:0,z:0}}),part("挂肉","capsule","#b2816b",[x,1.75,.48],[.25,.65,.22]));
  return p;
}

function barberStall(): ModelPart[] {
  const p: ModelPart[] = [...table(.75,.6,.58,-.2,0),...table(.7,.7,.82,.8,-.25),tub("洗头盆",.8,.82,-.25,.3,.18,linen),...table(.55,.5,.62,-1.05,.2)];
  for(const x of [-1,0,1])p.push(box("折屏脚",x,.06,.96,.3,.12,.5,dark),box("围屏纸面",x,1.18,.96,.95,2.2,.06,linen),box("围屏木框",x-.48,1.18,.96,.055,2.25,.1,dark));
  p.push(box("围屏右框",1.48,1.18,.96,.055,2.25,.1,dark),box("围屏上横枋",0,2.29,.96,3,.08,.1,dark),box("围屏下横枋",0,.11,.96,3,.1,.12,dark),cylinder("热水罐",-1.05,.87,.2,.34,.5,iron),box("工具托案",.8,.84,.28,.7,.06,.25,wood),box("竹梳",.8,.89,.27,.24,.035,.06,dark));
  return p;
}

function grainStall(): ModelPart[] {
  const p: ModelPart[] = [...table(3,.95,.4,0,-.3)];
  for(const x of [-1.42,1.42])p.push(box("粮架背柱",x,1.03,.4,.13,2.06,.15,dark));
  p.push(box("承斗背梁",0,1.04,.36,3,.16,.2,dark),box("顶联梁",0,1.9,.4,3,.12,.15,dark));
  const outer=[{x:-.45,y:.55},{x:-.3,y:-.15},{x:-.1,y:-.35},{x:.1,y:-.35},{x:.3,y:-.15},{x:.45,y:.55}];
  for(const x of [-.95,0,.95]) {
    p.push(part("敞口粮斗","extrude",wood,[x,1.25,0],[1,1,1],[0,0,0],{depth:.7,profile:[...outer,{x:.37,y:.55},{x:.23,y:-.1},{x:.07,y:-.25},{x:-.07,y:-.25},{x:-.23,y:-.1},{x:-.37,y:.55}]}));
    for(const z of [-.34,.34])p.push(part("粮斗端板","extrude",wood,[x,1.25,z],[1,1,1],[0,0,0],{depth:.055,profile:outer}));
    p.push(cylinder("下料喉",x,.88,0,.2,.3,wood),box("出粮滑闸",x,.73,0,.4,.06,.42,dark),tub("承粮量斗",x,.4,0,.25,.24,linen));
  }
  return p;
}
