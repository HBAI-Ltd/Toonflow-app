import { box, cylinder, design } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const tile="#72817f";
function roofTile(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","日式");}
export const japaneseRoofTileDesigns = [
  roofTile("本瓦葺筒平瓦屋面单元","宽凹平瓦分别承接雨水，独立半筒瓦覆盖相邻平瓦的长接缝，铺设单元明确保留两种不同陶瓦而不是单片S形波瓦",()=>[
    ...Array.from({length:2},(_,row)=>Array.from({length:3},(_,col)=>panTile("独立凹面平瓦",-0.32+col*0.32,0.045+row*0.015,-0.2+row*0.4,0.3,0.5))).flat(),
    ...Array.from({length:2},(_,row)=>[-1,1].map(s=>halfTile("覆盖平瓦长缝的独立半筒瓦",s*0.16,0.07+row*0.015,-0.2+row*0.4,0.085,0.5))).flat(),
    ...Array.from({length:2},(_,i)=>box("瓦片底部承托木桟",0,(0.045+i*0.015)/2,-0.3+i*0.6,1.02,0.045+i*0.015,0.07,"#a0835b")),
  ]),
  roofTile("桟瓦钩合波瓦","单片陶瓦本体同时压出一高一低的S形波面，侧缘搭扣与背部挂桟钩是实际几何，区别于分离筒瓦和平瓦的组合",()=>[
    waveTile(),
    box("与邻片搭合的侧边薄扣唇",0.157,0.041,0,0.04,0.014,0.4,tile),
    box("瓦背挂住木桟的独立成形钩",-0.07,-0.009,0.16,0.055,0.025,0.055,tile),
    box("侧扣唇上端限位凸耳",0.163,0.057,0.17,0.035,0.022,0.045,tile),
  ]),
  roofTile("轩丸瓦当构件","半筒瓦前端接完整圆形瓦当面，凸起莲瓣只作这一件瓦当的造型，背部保留能与后续筒瓦搭接的半圆槽",()=>[
    halfTile("瓦当后方完整半筒瓦身",0,0.11,0.02,0.09,0.36),
    cylinder("前端垂直完整圆瓦当",0,0.11,-0.17,0.22,0.025,tile,[90,0,0]),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return part("瓦当面凸起的莲瓣","sphere",tile,[Math.cos(a)*0.055,0.11+Math.sin(a)*0.055,-0.187],[0.035,0.065,0.014],[0,0,i*60-90]);}),
    cylinder("瓦当面中央凸起花心",0,0.11,-0.19,0.045,0.02,tile,[90,0,0]),
  ]),
  roofTile("轩平瓦檐口构件","宽凹平瓦向檐口延伸并接上扁长瓦当面，横向卷叶浮纹与背部浅槽构成一件完整檐瓦，不以纹样另展开主项",()=>[
    panTile("瓦当后方宽凹平瓦身",0,0.08,0.03,0.32,0.42),
    part("横向展开的完整扁长瓦当面","extrude",tile,[0,0,-0.195],[1,1,1],[0,0,0],{depth:0.035,profile:[[-0.19,0.11],[-0.14,0.125],[0,0.105],[0.14,0.125],[0.19,0.11],[0.18,0.035],[0,0.025],[-0.18,0.035]].map(([x,y])=>({x:x!,y:y!}))}),
    ...[-1,1].map(s=>part("瓦当面凸出的对称卷叶","tube",tile,[0,0,0],[1,1,1],[0,0,0],{radius:0.004,path:[{x:0,y:0.067,z:-0.215},{x:s*0.06,y:0.09,z:-0.215},{x:s*0.13,y:0.075,z:-0.215},{x:s*0.12,y:0.055,z:-0.215},{x:s*0.085,y:0.064,z:-0.215}]})),
    box("平瓦背部挂住檐桟的小台",0,0.065,0.18,0.12,0.03,0.06,tile),
  ]),
];
function halfTile(name:string,x:number,y:number,z:number,r:number,depth:number):ModelPart {const profile=[];for(let i=0;i<=10;i++){const a=i*Math.PI/10;profile.push({x:Math.cos(a)*r,y:Math.sin(a)*r});}for(let i=10;i>=0;i--){const a=i*Math.PI/10;profile.push({x:Math.cos(a)*(r-0.012),y:Math.sin(a)*(r-0.012)});}return part(name,"extrude",tile,[x,y,z],[1,1,1],[0,0,0],{depth,profile});}
function panTile(name:string,x:number,y:number,z:number,w:number,depth:number):ModelPart {const top=Array.from({length:9},(_,i)=>{const x=-w/2+i*w/8;return{x,y:0.012+0.055*(x/(w/2))**2};});return part(name,"extrude",tile,[x,y,z],[1,1,1],[0,0,0],{depth,profile:[...top,...[...top].reverse().map(p=>({...p,y:p.y-0.012}))]});}
function waveTile():ModelPart {const top=Array.from({length:13},(_,i)=>{const x=-0.16+i*0.32/12;return{x,y:0.05+0.04*Math.sin(x*Math.PI/0.16)};});return part("一次成形的完整S形波瓦本体","extrude",tile,[0,0,0],[1,1,1],[0,0,0],{depth:0.45,profile:[...top,...[...top].reverse().map(p=>({...p,y:p.y-0.012}))]});}
