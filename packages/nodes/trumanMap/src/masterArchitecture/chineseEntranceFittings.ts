import { box, cylinder, design, pipe } from "./structures";
import { part, ring, type ModelPart } from "../assetModelParts";
const stone="#a6aa98";
const wood="#9f7a50";
const bronze="#9b9270";
function fitting(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","中式");}
export const chineseEntranceFittingDesigns = [
  fitting("抱鼓门枕石","竖起圆鼓与向门内伸出的长枕连为一体，后枕上保留真正下凹的门轴窝，既承门框又接门轴，不把鼓面纹样单列主项",()=>[
    box("门枕后部完整长石底座",0,0.07,0.28,0.42,0.14,0.82,stone),
    box("与长枕接为一体的前部承鼓石",0,0.135,-0.28,0.45,0.27,0.4,stone),
    cylinder("门外竖立的厚圆鼓石",0,0.6,-0.28,0.7,0.26,stone,[90,0,0]),
    pivotSeat(),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return part("鼓面凸起的简化卷叶","sphere",stone,[Math.cos(a)*0.18,0.6+Math.sin(a)*0.18,-0.415],[0.12,0.2,0.035],[0,0,i*60-90]);}),
    cylinder("圆鼓中央完整凸起花心",0,0.6,-0.42,0.18,0.04,stone,[90,0,0]),
  ]),
  fitting("门簪穿枋木销","长方销体贯入门额枋，前端宽圆木簪帽压住构件并露出花心，短尾榫与簪帽为一体可单独装配的门上连接件",()=>[
    box("穿入门额枋的完整方形簪身",0,0.12,0.18,0.1,0.1,0.42,wood),
    cylinder("压住额枋前口的宽圆簪帽",0,0.12,-0.05,0.2,0.05,wood,[90,0,0]),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return part("簪帽面整体雕出的莲瓣","sphere",wood,[Math.cos(a)*0.047,0.12+Math.sin(a)*0.047,-0.08],[0.035,0.065,0.02],[0,0,i*60-90]);}),
    cylinder("簪帽中央的凸起花心",0,0.12,-0.085,0.045,0.02,wood,[90,0,0]),
    box("簪身尾部定位的短键",0,0.12,0.35,0.145,0.045,0.04,wood),
  ]),
  fitting("铺首衔环门饰","固定在门面的厚兽首承住独立可握铜环，鼻部穿环座与后侧安装脚是真实构造，整件不是佩戴面具或狮子梁端换材质",()=>[
    part("承环铺首的完整固定兽面板","extrude",bronze,[0,0,0],[1,1,1],[0,0,0],{depth:0.035,profile:[[-0.18,0.23],[-0.2,0.42],[-0.11,0.53],[0,0.5],[0.11,0.53],[0.2,0.42],[0.18,0.23],[0,0.19]].map(([x,y])=>({x:x!,y:y!}))}),
    ...[-1,1].map(s=>part("兽面压向鼻梁的弯眉","tube",bronze,[0,0,0],[1,1,1],[0,0,0],{radius:0.014,path:[{x:s*0.03,y:0.41,z:-0.025},{x:s*0.09,y:0.45,z:-0.035},{x:s*0.16,y:0.42,z:-0.02}]})),
    ...[-1,1].map(s=>part("固定兽面上的眼部凸饰","sphere",bronze,[s*0.09,0.385,-0.028],[0.065,0.045,0.04])),
    part("穿出门面并回扣的鼻部承环钩","tube",bronze,[0,0,0],[1,1,1],[0,0,0],{radius:0.015,path:[{x:0,y:0.32,z:-0.0125},{x:0,y:0.28,z:-0.09},{x:0,y:0.24,z:-0.0125}]}),
    doorRing(),
    ...[-1,1].map(s=>pipe("铺首背面固定到门板的安装脚",[s*0.11,0.35,0],[s*0.11,0.35,0.065],0.012)),
    ...[-1,1].map(s=>cylinder("门面前侧可见的固定螺帽",s*0.13,0.3,-0.025,0.025,0.025,bronze,[90,0,0])),
  ]),
  fitting("夹杆石旗杆座","两片独立高石夹在同一厚底座上，中央通槽接纳旗杆并由横穿锁杆固定，石夹的高削肩和空槽不能用普通实心柱础替代",()=>[
    box("两片夹杆石共用的厚重落地座",0,0.125,0,1,0.25,0.75,stone),
    ...[-1,1].map(s=>part("削肩收顶的独立竖夹石","extrude",stone,[s*0.18,0.25,0],[1,1,1],[0,90,0],{depth:0.17,profile:[{x:-0.25,y:0},{x:0.25,y:0},{x:0.25,y:0.85},{x:0.15,y:1.1},{x:-0.15,y:1.1},{x:-0.25,y:0.85}]})),
    ...[0.6,1.05].map(y=>pipe("穿过两片石夹的可拆横锁杆",[-0.32,y,0],[0.32,y,0],0.04)),
    ...[-1,1].flatMap(s=>[0.6,1.05].map(y=>cylinder("横锁杆外侧紧固帽",s*0.32,y,0,0.075,0.035,bronze,[0,0,90]))),
  ]),
];
function doorRing():ModelPart{const p=ring("铺首鼻座下方实际悬挂的整铜环",bronze,0.15,0.023,0,0.025);p.position={x:0,y:0.13,z:-0.075};p.rotation.x=90;return p;}
function pivotSeat():ModelPart{const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const layer of [0,1,2,3])for(let i=0;i<8;i++){const a=i*Math.PI/4,c=Math.cos(a),s=Math.sin(a),outer=layer<2,limit=Math.min(Math.abs(c)<0.00001?Infinity:0.21/Math.abs(c),Math.abs(s)<0.00001?Infinity:(s>0?0.31:0.51)/Math.abs(s)),r=outer?limit:0.055;vertices.push({x:c*r,y:layer%2===0?0.14:0.27,z:0.38+s*r});}for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,i+8,j,j,i+8,j+8,16+i,16+j,24+i,24+i,16+j,24+j,8+i,24+i,24+j,8+i,24+j,8+j,i,16+j,16+i,i,j,16+j);}return part("后枕上带真实盲孔的承门轴石座","mesh",stone,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
