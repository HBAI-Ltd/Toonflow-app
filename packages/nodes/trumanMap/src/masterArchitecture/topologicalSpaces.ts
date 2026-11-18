import { base, box, colors, cylinder, design, pipe, rail, slats, stairs, glow } from "./structures";
import { part, type ModelPart, type Triple } from "../assetModelParts";

// 原创场景构筑物：仅静态形体，不把相同教具放大后计新主，不实现额外空间/重力物理。
export const topologicalSpaceDesigns = [
  design("克莱因瓶形园亭","自返曲壳形成环绕内外的交叉廊面，瓶颈穿过壳体而保留完整通视洞口",()=>[base(10,10),kleinShell(),box("曲壳右侧承重支座",3.5,0.82,0,0.8,1.64,1.2),box("曲壳左侧承重支座",-2.8,0.75,0,0.8,1.5,1.2),...[-1,1].map(s=>glow("入口两侧低位引导灯",s*2,0.4,-4,0.15,0.1,2))],"建筑","科幻"),
  design("三叶石结守望碑","闭合石结形成三个互相穿行的空洞，三处低点各有独立支墩，作为可绕行的奇幻地标",()=>[base(9,9),part("闭合三叶结石构","tube",colors.stone,[0,0,0],[1,1,1],[0,0,0],{radius:0.38,path:Array.from({length:49},(_,i)=>{const t=i*Math.PI/24,r=2+Math.cos(t*3);return{x:r*Math.cos(t*2),y:2.2+Math.sin(t*3)*1.2,z:r*Math.sin(t*2)};})}),...Array.from({length:3},(_,i)=>{const t=(Math.PI*1.5+i*Math.PI*2)/3;return cylinder("石结低点承重墩",2*Math.cos(t*2),0.6,2*Math.sin(t*2),1.1,1.2);}),...Array.from({length:3},(_,i)=>{const a=i*Math.PI*2/3;return box("碑前独立观景石座",Math.cos(a)*3.7,0.6,Math.sin(a)*3.7,0.8,0.5,0.8);})],"建筑","奇幻"),
  design("超立方折室框架","内外方架以对应角点连成多层投影格，外圈落地柱脚承重而内框通过空间连杆悬挂",()=>[base(9,9),...hypercubeFrame(),...[-1,1].flatMap(x=>[-1,1].map(z=>box("四角框架独立柱脚",x*3,0.3,z*3,0.7,0.6,0.7))),box("入口检视短台",0,0.6,-3.5,2,0.3,2)],"建筑","科幻"),
  design("巨翼换羽梳理架","两侧展开支臂托住大型羽翼，柔性梳齿沿羽轴排列，低位落羽槽与中央休息鞍分开",()=>[base(8,6),box("中央躯体休息鞍",0,1,0,1.8,0.5,3,colors.wood),...[-1,1].flatMap(s=>[part("翼根缓弧支承","tube",colors.wood,[0,0,0],[1,1,1],[0,0,0],{radius:0.12,path:[{x:s*0.8,y:1.2,z:0},{x:s*1.8,y:1.8,z:0},{x:s*3,y:1.3,z:0}]}),...slats("独立弹性换羽梳齿",10,[s*1.3,1.6,-1.2],[s*0.18,0,0.25],[0.06,0.7,0.06],colors.wood),box("两侧落羽回收浅槽",s*2.5,0.5,0,2,0.3,4),pipe("翼架外侧独立支脚",[s*3,0.3,0],[s*3,1.3,0],0.15),box("翼架支脚接地垫",s*3,0.25,0,0.7,0.3,0.7)]),...[-1,1].map(s=>box("前后登架踏台",0,0.3,s*2,1.6,0.6,0.7))],"设施","奇幻"),
];
function kleinShell():ModelPart{
  const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];
  for(let i=0;i<=18;i++)for(let j=0;j<=12;j++){
    const u=i*Math.PI/9,v=j*Math.PI/6,r=2.8+Math.cos(u/2)*Math.sin(v)-Math.sin(u/2)*Math.sin(v*2);
    vertices.push({x:r*Math.cos(u),y:2.5+Math.sin(u/2)*Math.sin(v)+Math.cos(u/2)*Math.sin(v*2),z:r*Math.sin(u)});
  }
  const offset=vertices.length;
  vertices.push(...vertices.map(point=>({...point})));
  for(let i=0;i<18;i++)for(let j=0;j<12;j++){
    const a=i*13+j,b=(i+1)*13+j,c=b+1,d=a+1;
    indices.push(a,b,d,b,c,d,d+offset,b+offset,a+offset,d+offset,c+offset,b+offset);
  }
  return part("双面自返交叉曲壳","mesh",colors.glass,[0,0,0],[1,1,1],[0,0,0],{vertices,indices,opacity:0.7,metalness:0.2});
}
function hypercubeFrame():ModelPart[]{
  const parts:ModelPart[]=[],points:Triple[]=[];
  for(const r of [3,1.2])for(let i=0;i<8;i++)points.push([i&1?r:-r,3.6+(i&2?r:-r),i&4?r:-r]);
  for(let i=0;i<16;i++){const p=points[i]!;parts.push(part("投影角点接头","sphere",colors.metal,p,[0.25,0.25,0.25]));}
  for(const layer of [0,8])for(let i=0;i<8;i++)for(const bit of [1,2,4])if((i&bit)===0)parts.push(rail(points[layer+i]!,points[layer+(i|bit)]!,0.1));
  for(let i=0;i<8;i++)parts.push(rail(points[i]!,points[i+8]!,0.08,colors.wood));
  return parts;
}
