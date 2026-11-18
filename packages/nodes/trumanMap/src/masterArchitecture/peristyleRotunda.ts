import { box,cylinder,design } from "./structures";
import { part,ring,type ModelPart } from "../assetModelParts";
import { halfRoundWall } from "./spatialShells";
const stone="#b7b59e";
export const peristyleRotundaDesigns=[design("柱廊环殿","有门洞的完整圆形内室与外侧独立环柱廊同时位于圆形阶台上，柱列承住环形额枋和收尖圆屋盖；外围可以绕行，区别于没有中央围护的开放圆亭",()=>{
 const p:ModelPart[]=[cylinder("圆殿最下层完整石阶台",0,.09,0,10.6,.18,stone),cylinder("承接内室和外围环柱的第二阶台",0,.28,0,10,.2,stone),halfRoundWall("真实留出前方入口的圆形内室厚墙",2.8,.3,5.4,[0,.38,0],60,stone,Math.PI*5/3),halfRoundWall("只在门头以上封合的圆室前方墙段",2.8,.3,1.88,[0,3.9,0],120,stone,Math.PI/3),box("圆室前方门洞的完整直石过梁",0,3.75,-2.425,2.95,.3,.35,stone),...[-1,1].map(s=>box("前门两边同圆墙接合的直门框",s*1.4,1.99,-2.425,.18,3.22,.35,stone)),ring("外围独立柱列连续托住的环形额枋",stone,4.55,.6,5.26,.18),part("覆盖内室和外廊而有内表面的圆锥屋壳","lathe","#788171",[0,5.25,0],[1,1,1],[0,0,0],{profile:[{x:5.1,y:0},{x:0,y:1.5},{x:0,y:1.3},{x:5,y:-.08}]}),box("环殿内部沿主轴设置的独立石案",0,.75,.5,1.2,.74,.9,stone)];for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4,x=Math.cos(a)*4.2,z=Math.sin(a)*4.2;p.push(cylinder("外围柱廊落在台基上的宽石柱础",x,.48,z,.62,.2,stone),cylinder("将内室外侧廊道保留通行的独立石柱",x,2.78,z,.36,4.4,stone),cylinder("承接环额枋的柱顶宽圆承盘",x,5.09,z,.62,.22,stone));}return p;
},"建筑","欧式")];
