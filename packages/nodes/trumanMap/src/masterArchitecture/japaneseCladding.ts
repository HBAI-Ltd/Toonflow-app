import { box, design, pipe, slats } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const wood="#92714d";
const plaster="#d1d2c1";
export const japaneseCladdingDesigns = [
  design("海鼠壁瓦灰墙段","斜置深色平瓦填在白色漆灰基层上，凸起半圆灰缝沿两组对角线连续交叉；瓦片和凸缝均为实际几何，不以贴图或瓦片数量另计主项",()=>namakoWall(),"构件","日式"),
  design("押缘下见板墙段","横向薄板以一致小倾角逐层搭接，外侧竖押缘压住板面并连接后方墙骨，下板露口与普通竖板拼缝墙的装配结构不同",()=>[
    ...slats("逐层搭接且下口外挑的下见板",11,[0,0.12,0],[0,0.16,0],[2.4,0.18,0.025],wood).map(p=>({...p,rotation:{x:10,y:0,z:0}})),
    ...[-1,0,1].map(i=>box("从板面外压紧搭口的竖押缘",i*0.96,0.91,-0.04,0.05,1.82,0.03,wood)),
    ...[-1,1].map(s=>box("后侧承接押缘的连续墙骨",s*0.96,0.91,0.055,0.07,1.82,0.07,wood)),
    ...[-1,1].map(s=>box("上下收口木横枋",0,0.025+(s+1)*0.9125,0.02,2.5,0.05,0.12,wood)),
  ],"构件","日式"),
];
function namakoWall():ModelPart[]{const pieces:ModelPart[]=[box("承托瓦灰构造的完整墙芯",0,0.9,0,2.4,1.8,0.1,plaster)];for(let row=0;row<7;row++)for(let col=0;col<5;col++){const x=-1.2+col*0.6+(row%2)*0.3,y=row*0.3,profile=clipDiamond(x,y,0.285);if(profile.length>=3)pieces.push(part("逐片斜置的深色平瓦","extrude","#697677",[0,0,-0.06],[1,1,1],[0,0,0],{depth:0.024,profile}));}for(const slope of [-1,1])for(let i=-3;i<=5;i++){const c=0.3+i*0.6,raw=[[-1.2,slope*-1.2+c],[1.2,slope*1.2+c],[-c/slope,0],[(1.8-c)/slope,1.8]],points=raw.filter(([x,y])=>x!>=-1.20001&&x!<=1.20001&&y!>=-0.00001&&y!<=1.80001).filter((p,index,list)=>list.findIndex(q=>Math.hypot(p[0]!-q[0]!,p[1]!-q[1]!)<0.00001)===index);if(points.length>=2)pieces.push({...pipe("高出平瓦表面的半圆漆灰凸缝",[points[0]![0]!,points[0]![1]!,-0.075],[points[1]![0]!,points[1]![1]!,-0.075],0.036),color:plaster});}return pieces;}
function clipDiamond(x:number,y:number,r:number):{x:number;y:number}[]{let points=[{x:x-r,y},{x,y:y-r},{x:x+r,y},{x,y:y+r}];for(const boundary of [{axis:"x" as const,value:-1.2,keep:1},{axis:"x" as const,value:1.2,keep:-1},{axis:"y" as const,value:0,keep:1},{axis:"y" as const,value:1.8,keep:-1}]){const next:typeof points=[];for(let i=0;i<points.length;i++){const a=points[i]!,b=points[(i+1)%points.length]!,da=(a[boundary.axis]-boundary.value)*boundary.keep,db=(b[boundary.axis]-boundary.value)*boundary.keep;if(da>=0)next.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);next.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}points=next;}return points.filter((p,i)=>!points.some((q,j)=>j<i&&Math.hypot(p.x-q.x,p.y-q.y)<0.000001));}
