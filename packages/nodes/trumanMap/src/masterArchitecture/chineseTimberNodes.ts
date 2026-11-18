import { box, colors, cylinder, design, pipe, rail } from "./structures";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
const wood="#9b7751";
function timber(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","中式");}
// 具名木构件分别保留实际轮廓、榫口或椽架拓扑；不按雕纹、椽数或屋盖大小扩充主条目。
export const chineseTimberNodeDesigns = [
  timber("雀替曲边斜撑","竖向柱面与横梁底面之间的曲边承撑，顶榫与侧榫分别接入两个方向，保留雀替下缘的连续收弧而非普通直斜杆",()=>[
    part("带连续曲边的完整雀替木身","extrude",wood,[0,0,0],[1,1,1],[0,0,0],{depth:0.14,profile:[{x:0,y:0},{x:0.08,y:0.2},{x:0.25,y:0.33},{x:0.48,y:0.38},{x:0.73,y:0.52},{x:0.85,y:0.63},{x:0.93,y:0.72},{x:0,y:0.72}]}),
    box("接入横梁的独立上榫",0.58,0.75,0,0.3,0.08,0.09,wood),
    box("接入立柱的侧榫",-0.035,0.45,0,0.07,0.25,0.09,wood),
    ...Array.from({length:3},(_,i)=>part("顺随曲边凸起的木雕卷叶","sphere",wood,[0.17+i*0.19,0.48+i*0.055,-0.075],[0.17,0.11,0.035])),
  ]),
  timber("驼峰墩托木","宽厚下腹经左右曲肩收束到上方承托小枕，置于下梁上向上传荷，主体轮廓是完整低驼峰而非矩形柱墩",()=>[
    part("曲肩宽底的完整驼峰墩托","extrude",wood,[0,0.045,0],[1,1,1],[0,0,0],{depth:0.24,profile:[[-0.42,0],[0.42,0],[0.4,0.1],[0.32,0.2],[0.26,0.28],[0.16,0.34],[0,0.37],[-0.16,0.34],[-0.26,0.28],[-0.32,0.2],[-0.4,0.1]].map(([x,y])=>({x:x!,y:y!}))}),
    box("驼峰下部压梁宽底枕",0,0.035,0,0.94,0.07,0.28,wood),
    box("驼峰上部承檩短平枕",0,0.425,0,0.34,0.07,0.26,wood),
    box("锁入上梁的短榫",0,0.475,0,0.16,0.06,0.12,wood),
  ]),
  timber("叉手脊檩支撑","成对斜木从下梁两侧向上夹合脊檩，顶部交会与下端接梁榫均保留，构成独立可装配的V形承脊节点",()=>[
    rail([-0.8,0.06,0],[-0.08,1.3,0],0.13,wood),
    rail([0.8,0.06,0],[0.08,1.3,0],0.13,wood),
    cylinder("直接坐在叉手上端的短段脊檩",0,1.43,0,0.2,0.55,wood,[90,0,0]),
    ...[-1,1].map(s=>box("叉手下端接入梁面的短榫",s*0.8,0.025,0,0.2,0.05,0.1,wood)),
    pipe("锁定上端交会的贯穿木销",[-0.14,1.29,0],[0.14,1.29,0],0.025),
  ]),
  timber("翼角戗梁椽架","对角大梁托住向外上翘的屋角，放射角椽在内侧弧檩与外侧连檐之间展开，各端高度随屋角变化，区别于整片普通坡屋面",()=>[
    part("沿对角连续起翘的主角梁","extrude",wood,[0,0,0],[1,1,1],[0,-45,0],{depth:0.18,profile:[{x:0,y:0.05},{x:1.2,y:0.14},{x:2,y:0.35},{x:2.8,y:1.03},{x:2.8,y:1.2},{x:2,y:0.52},{x:1.2,y:0.31},{x:0,y:0.22}]}),
    ...Array.from({length:9},(_,i)=>{const a=i*Math.PI/16,f=Math.sin(a*2)**2;return part("放射展开并向外抬起的独立角椽","tube",wood,[0,0,0],[1,1,1],[0,0,0],{radius:0.04,path:[{x:Math.cos(a)*0.65,y:0.25,z:Math.sin(a)*0.65},{x:Math.cos(a)*1.7,y:0.3,z:Math.sin(a)*1.7},{x:Math.cos(a)*2.3,y:0.33+f*0.3,z:Math.sin(a)*2.3},{x:Math.cos(a)*2.8,y:0.35+f*0.7,z:Math.sin(a)*2.8}]});}),
    part("收束内侧角椽根部的弧檩","tube",wood,[0,0,0],[1,1,1],[0,0,0],{radius:0.055,path:Array.from({length:9},(_,i)=>{const a=i*Math.PI/16;return{x:Math.cos(a)*0.65,y:0.25,z:Math.sin(a)*0.65};})}),
    part("沿起翘外缘连续连接的连檐","tube",wood,[0,0,0],[1,1,1],[0,0,0],{radius:0.045,path:Array.from({length:9},(_,i)=>{const a=i*Math.PI/16;return{x:Math.cos(a)*2.8,y:0.35+Math.sin(a*2)**2*0.7,z:Math.sin(a)*2.8};})}),
  ]),
  timber("八角攒尖屋架","八向斜梁在中心同一尖顶汇合，周边八角檩圈承接每个独立三角坡面，屋架与薄屋盖可作为完整建筑上部构件放置",()=>[
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4,b=(i+1)*Math.PI/4;return[
      rail([Math.cos(a)*2,0.09,Math.sin(a)*2],[0,1.75,0],0.12,wood),
      rail([Math.cos(a)*2,0.09,Math.sin(a)*2],[Math.cos(b)*2,0.09,Math.sin(b)*2],0.13,wood),
      roofWedge(a,b),
    ];}).flat(),
    cylinder("汇合八向斜梁的中心承接短柱",0,1.73,0,0.23,0.24,wood),
    part("封合攒尖最高处的独立顶帽","cone",colors.roof,[0,1.95,0],[0.35,0.25,0.35]),
  ]),
  timber("垂莲吊柱","上端短榫把修长吊柱接到檐梁，柱下收为向下垂落的木莲花，莲瓣与柱身连成完整垂饰，区别于栏杆柱顶向上的珠帽",()=>[
    box("吊柱接入檐梁的宽肩榫头",0,1.12,0,0.24,0.12,0.22,wood),
    cylinder("从檐梁向下垂直延伸的木柱",0,0.7,0,0.12,0.78,wood),
    ring("柱身接入木莲花的束口环",wood,0.095,0.035,0.33,0.08),
    part("莲瓣中央的圆缓花心","sphere",wood,[0,0.22,0],[0.26,0.29,0.26]),
    ...Array.from({length:8},(_,i)=>hangingPetal(i*Math.PI/4)),
    part("花心下端完整收尖的小坠","cone",wood,[0,0.045,0],[0.11,0.1,0.11],[0,0,180]),
  ]),
];
function roofWedge(a:number,b:number):ModelPart{const top:Triple[]=[[0,1.85,0],[Math.cos(b)*2.1,0.1,Math.sin(b)*2.1],[Math.cos(a)*2.1,0.1,Math.sin(a)*2.1]],vertices=top.map(([x,y,z])=>({x,y,z}));vertices.push(...vertices.map(p=>({...p,y:p.y-0.06})));return part("八角屋盖中独立承托的三角坡板","mesh",colors.roof,[0,0,0],[1,1,1],[0,0,0],{vertices,indices:[0,1,2,3,5,4,0,3,1,1,3,4,1,4,2,2,4,5,2,5,0,0,5,3]});}
function hangingPetal(a:number):ModelPart{const points=[[0.07,-0.04,0.32],[0.07,0.04,0.32],[0.2,0.065,0.17],[0.12,0,0.04],[0.2,-0.065,0.17]],vertices=points.map(([r,t,y])=>({x:r!*Math.cos(a)-t!*Math.sin(a),y:y!,z:r!*Math.sin(a)+t!*Math.cos(a)})),indices:number[]=[];vertices.push(...vertices.map(p=>({...p,y:p.y-0.012})));for(let i=1;i<4;i++)indices.push(0,i,i+1,5,5+i+1,5+i);for(let i=0;i<5;i++){const j=(i+1)%5;indices.push(i,i+5,j,j,i+5,j+5);}return part("实际向下弯垂的木质莲瓣","mesh",wood,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
