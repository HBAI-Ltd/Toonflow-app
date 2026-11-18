import { box, design, rail } from "./structures";
import { part, ring, type ModelPart } from "../assetModelParts";
const stone="#a5ac9c";
export const chineseGardenFittingDesigns = [
  design("螭首排水石构件","后部方形水道贯通到张开的兽口，底唇承接水流而额鼻和牙齿避开中间通路，可插入台基排水槽；这是结构模型而非内置出水模拟",()=>[
    box("排水道下壁与下颌相接的底石",0,0.12,0.2,0.2,0.04,0.65,stone),
    box("排水道上方完整石顶",0,0.27,0.2,0.2,0.04,0.65,stone),
    ...[-1,1].map(s=>box("水道两侧留出中间通孔的石壁",s*0.09,0.195,0.2,0.04,0.15,0.65,stone)),
    box("向外伸出的完整下唇泄水台",0,0.12,-0.24,0.25,0.04,0.3,stone),
    box("张口上方较短的石质上颌",0,0.27,-0.2,0.25,0.04,0.24,stone),
    ...[-1,1].map(s=>part("兽口两侧立体连接的颊部","sphere",stone,[s*0.13,0.21,-0.12],[0.17,0.22,0.32])),
    part("不堵住水道的高位额鼻","sphere",stone,[0,0.35,-0.15],[0.18,0.12,0.22]),
    ...[-1,1].map(s=>part("额部左右突出的眼眶","sphere",stone,[s*0.12,0.35,-0.2],[0.1,0.08,0.1])),
    ...[-1,1].map(s=>part("从口边向下的短獠齿","cone",stone,[s*0.075,0.26,-0.28],[0.025,0.07,0.025],[0,0,180])),
    ...[-1,1].map(s=>part("向后伏在额部两侧的弯角","tube",stone,[0,0,0],[1,1,1],[0,0,0],{radius:0.025,path:[{x:s*0.12,y:0.37,z:-0.06},{x:s*0.2,y:0.45,z:0.02},{x:s*0.18,y:0.43,z:0.16}]})),
    ...[-1,1].map(s=>box("插入台基槽口的后端定位榫",s*0.12,0.25,0.42,0.08,0.09,0.14,stone)),
  ],"构件","中式"),
  design("棂星门冲天石构","四根冲天石柱通过三间枋额连通，中央额枋抬高而上方不覆盖普通牌楼屋盖，门道保留可通行净空，不以柱数或题字改作额外主项",()=>[
    ...[-3,-1,1,3].flatMap(x=>[
      box("冲天柱下方完整石基础",x,0.16,0,0.65,0.32,0.9,stone),
      box("上伸越过额枋的完整石柱",x,1.8,0,0.25,2.96,0.28,stone),
      box("石柱上方的独立收口冠石",x,3.34,0,0.4,0.16,0.43,stone),
      part("冠石上方整体收束的云头","sphere",stone,[x,3.5,0],[0.3,0.24,0.3]),
    ]),
    ...[-2,0,2].flatMap(x=>[
      box("跨在两柱间的下额枋",x,x===0?2.35:2.05,0,2.1,0.18,0.24,stone),
      box("跨在两柱间的上额枋",x,x===0?2.94:2.63,0,2.15,0.18,0.28,stone),
      ...[-1,1].map(s=>box("上下额枋之间独立的短束",x+s*0.72,x===0?2.65:2.34,0,0.1,0.46,0.2,stone)),
    ]),
    ...[-3,-1,1,3].flatMap(x=>[-1,1].map(s=>part("柱脚前后对夹的短抱柱石","extrude",stone,[x,0.3,s*0.32],[1,1,1],[0,0,0],{depth:0.18,profile:[{x:-0.19,y:0},{x:0.19,y:0},{x:0.12,y:0.55},{x:-0.12,y:0.55}]}))),
  ],"建筑","中式"),
  design("园林砖砌漏窗墙段","完整砖墙内留有闭合圆形窗洞，套方砖棂与圆框构成真实透空格孔，墙底仍连续封合；这是一类独立漏窗墙段而非不同花纹目录",()=>[
    box("漏窗墙段的通长地袱",0,0.09,0,2.6,0.18,0.38,stone),
    roundWindowWall(),
    roundFrame(),
    ...[[[-0.65,1.33],[0,1.98]],[[0,1.98],[0.65,1.33]],[[0.65,1.33],[0,0.68]],[[0,0.68],[-0.65,1.33]],[[-0.4,0.93],[0.4,0.93]],[[0.4,0.93],[0.4,1.73]],[[0.4,1.73],[-0.4,1.73]],[[-0.4,1.73],[-0.4,0.93]]].map(v=>rail([v[0]![0]!,v[0]![1]!,0],[v[1]![0]!,v[1]![1]!,0],0.055,stone)),
    box("压住漏窗墙顶的完整横向盖砖",0,2.54,0,2.7,0.12,0.4,stone),
  ],"构件","中式"),
];
function roundFrame():ModelPart{const p=ring("伸入圆洞边缘的完整石窗圈",stone,0.72,0.1,0,0.08);p.position={x:0,y:1.33,z:-0.08};p.rotation.x=90;return p;}
function roundWindowWall():ModelPart {const alpha=Math.atan2(1.15,1.2),angles=[...Array.from({length:32},(_,i)=>i*Math.PI/16),alpha,Math.PI-alpha,Math.PI+alpha,Math.PI*2-alpha].sort((a,b)=>a-b),vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[],n=angles.length;for(const layer of [0,1,2,3])for(const a of angles){const c=Math.cos(a),s=Math.sin(a),outer=layer<2,r=outer?Math.min(Math.abs(c)<0.00001?Infinity:1.2/Math.abs(c),Math.abs(s)<0.00001?Infinity:1.15/Math.abs(s)):0.65;vertices.push({x:c*r,y:1.33+s*r,z:layer%2===0?-0.09:0.09});}for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,j,n+i,j,n+j,n+i,2*n+i,3*n+i,2*n+j,2*n+j,3*n+i,3*n+j,i,2*n+i,2*n+j,i,2*n+j,j,n+i,3*n+j,3*n+i,n+i,n+j,3*n+j);}return part("四角完整且有真实通圆孔的砖墙主体","mesh","#a19f90",[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
