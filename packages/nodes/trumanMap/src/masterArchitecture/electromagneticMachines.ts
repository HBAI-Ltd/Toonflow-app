import { base, box, colors, cylinder, design, pipe } from "./structures";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";
const bronze="#ad9263";
const iron="#5b6a6d";
const porcelain="#ceceba";
function classic(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"设施","蒸汽朋克");}

// 旋转导体、磁阻齿轮、汞弧单向导电、持续碳弧及不同电机转子各保留自身完整作用链。
export const electromagneticMachineDesigns = [
  classic("碳弧连续波振荡器","水冷铜阳极与可推进碳阴极保持持续电弧，横向磁场稳定弧区，外置LC回路接受负阻振荡，不使用周期火花放电隙",()=>[
    base(0.8,0.65,0.05),
    part("可观察内部弧区的密闭玻璃室","lathe",colors.glass,[0,0.32,0],[1,1,1],[0,0,0],{profile:[{x:0.18,y:-0.18},{x:0.21,y:-0.18},{x:0.21,y:0.18},{x:0.18,y:0.18},{x:0.18,y:-0.18}],opacity:0.3}),
    cylinder("弧室底部独立密封底盖",0,0.13,0,0.42,0.035),
    cylinder("弧室上部独立密封盖",0,0.51,0,0.42,0.035),
    pipe("推进到放电间隙的碳阴极",[0.17,0.32,0],[0.006,0.32,0],0.022),
    pipe("对向水冷铜阳极",[-0.18,0.32,0],[-0.006,0.32,0],0.035),
    ...[-1,1].map(s=>box("位于弧区前后的横场磁极",0,0.32,s*0.25,0.19,0.2,0.06,iron)),
    box("跨过弧室上方的磁极回轭",0,0.61,0,0.16,0.08,0.56,iron),
    ...[-1,1].map(s=>box("回轭两端的磁路支撑",0,0.46,s*0.25,0.1,0.28,0.07,iron)),
    ...[-1,1].map(s=>pipe("铜阳极独立冷却进回水管",[-0.14,0.32,s*0.025],[-0.32,0.12,s*0.08],0.015)),
    box("阴极推进绝缘丝杆座",0.27,0.32,0,0.11,0.1,0.1,porcelain),
    pipe("推进碳棒的短手动丝杆",[0.22,0.32,0],[0.39,0.32,0],0.02),
    part("振荡回路独立调谐线圈","tube",bronze,[0,0,0],[1,1,1],[0,0,0],{radius:0.008,path:Array.from({length:25},(_,i)=>({x:-0.28+Math.cos(i*Math.PI/4)*0.065,y:0.13+i*0.006,z:-0.2+Math.sin(i*Math.PI/4)*0.065}))}),
    cylinder("调谐线圈的瓷质绕线芯",-0.28,0.2,-0.2,0.114,0.18,porcelain),box("绕线瓷芯的落地承脚",-0.28,0.08,-0.2,0.1,0.06,0.1,porcelain),box("调谐电容两片共用绝缘底脚",0.22,0.0625,-0.22,0.15,0.025,0.17,porcelain),
    ...[-1,1].map(s=>box("外置调谐电容两侧极板",0.22+s*0.035,0.17,-0.22,0.025,0.19,0.13,bronze)),
    ...[-1,1].map(s=>pipe("LC回路到两放电电极的导线",[s*0.13,0.32,0],[s*0.24,0.17,-0.2],0.008)),
  ]),
  classic("汞弧多阳极整流管","底部汞池形成公共阴极，多条向上分叉的密闭玻璃臂各容纳独立阳极，蒸气弧只在相应相位导通，不是栅极真空三极放大管",()=>[
    base(0.9,0.9,0.05),
    ...Array.from({length:3},(_,i)=>{const a=i*Math.PI*2/3;return box("玻璃整流管的绝缘承托脚",Math.cos(a)*0.11,0.11,Math.sin(a)*0.11,0.065,0.14,0.065,porcelain);}),
    part("有真实内外壁的玻璃主泡壳","lathe",colors.glass,[0,0.13,0],[1,1,1],[0,0,0],{profile:[{x:0.04,y:0},{x:0.12,y:0.04},{x:0.18,y:0.17},{x:0.17,y:0.31},{x:0.09,y:0.4},{x:0.045,y:0.44},{x:0.03,y:0.44},{x:0.075,y:0.39},{x:0.153,y:0.3},{x:0.163,y:0.17},{x:0.105,y:0.05},{x:0.025,y:0.01},{x:0.04,y:0}],opacity:0.32}),
    cylinder("玻璃主泡底部的汞池阴极",0,0.19,0,0.2,0.018,"#b7c1bd"),
    pipe("穿过底部密封的阴极引出杆",[0,0.075,0],[0,0.19,0],0.02),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3,start:Triple=[Math.cos(a)*0.14,0.36,Math.sin(a)*0.14],end:Triple=[Math.cos(a)*0.34,0.66,Math.sin(a)*0.34],length=Math.hypot(end[0]-start[0],end[1]-start[1],end[2]-start[2]),direction=end.map((v,j)=>(v-start[j]!)/length),point=(offset:number)=>end.map((v,j)=>v+direction[j]!*offset) as Triple;return[
      glassArm(start,end),
      pipe("各分支内独立的固定阳极",point(0.05),point(-0.065),0.025),
      {...pipe("各阳极独立密封瓷帽",point(-0.01),point(0.05),0.07),color:porcelain},
    ];}).flat(),
    cylinder("顶部抽气封口与冷凝颈",0,0.62,0,0.055,0.12,colors.glass),
  ]),
  classic("同极圆盘直流发电器","导电圆盘在轴向磁场中旋转，轴心与盘缘两只固定电刷取出直流电压，盘上没有绕组、交替磁极或机械换向片",()=>[
    base(0.5,0.4,0.035),cylinder("与圆盘共同旋转的立轴",0,0.19,0,0.025,0.32,iron),
    cylinder("切割轴向磁场的整块铜圆盘",0,0.21,0,0.25,0.012,bronze),
    ...[0.16,0.26].map(y=>box("位于圆盘上下面的相向磁极",0.095,y,0,0.09,0.035,0.11,iron)),
    box("绕过圆盘外缘的C形回磁轭",0.18,0.21,0,0.045,0.16,0.12,iron),
    box("盘缘固定取电碳刷",0.124,0.215,0,0.025,0.018,0.035,iron),
    box("盘心独立取电碳刷",0.026,0.22,0,0.026,0.018,0.035,iron),
    ...[-1,1].map(s=>box("两只电刷各自的绝缘固定座",s<0?0.025:0.14,0.28,s*0.055,0.045,0.06,0.055,porcelain)),
    pipe("盘缘电刷独立电路引出",[0.124,0.22,0],[0.2,0.08,-0.12],0.009),
    pipe("盘心电刷独立电路引出",[0.026,0.22,0],[-0.16,0.08,-0.12],0.009),
    ...[-1,1].map(s=>box("支承旋转立轴的前后固定架",0,0.07,s*0.07,0.08,0.09,0.05)),
  ]),
  classic("变磁阻高频交流发电机","高速带齿铁盘连续改变固定极间磁路，静止励磁绕组建立磁通而电枢绕组取出交变电压，转盘没有旋转通电线圈",()=>[
    base(0.85,0.5,0.045),cylinder("无通电绕组的铁质齿盘",0,0.36,0,0.38,0.055,iron,[90,0,0]),
    pipe("通过齿盘中心的输入转轴",[0,0.36,-0.23],[0,0.36,0.23],0.035),
    ...Array.from({length:24},(_,i)=>{const angle=i*15,a=angle*Math.PI/180;return[
      part("盘缘独立凸出磁阻齿","box",iron,[Math.cos(a)*0.204,0.36+Math.sin(a)*0.204,0],[0.042,0.019,0.055],[0,0,angle]),
      part("与盘缘相对的固定磁极齿","box",iron,[Math.cos(a)*0.251,0.36+Math.sin(a)*0.251,0],[0.045,0.02,0.065],[0,0,angle]),
    ];}).flat(),
    ringZ("连接固定极齿的闭合外铁轭",0.305,0.035,0.36,0,0.09),
    ...[-1,1].map(s=>box("外铁轭左右静止励磁线圈",s*0.31,0.36,0,0.07,0.15,0.15,bronze)),
    ...[-1,1].map(s=>box("收取交变磁通的静止电枢线包",0,0.36+s*0.3,0,0.17,0.065,0.15,bronze)),
    ...[-1,1].map(s=>box("固定磁轭的落地承脚",s*0.23,0.12,0,0.12,0.18,0.2)),
    ...[-1,1].map(s=>box("输入轴两端的固定轴承座",0,0.21,s*0.19,0.12,0.29,0.1)),
  ]),
  design("机械换向直流电枢","独立叠片转子上装有闭合线圈，前端分离铜片换向器把旋转线圈连接到固定电刷；主体是可拆装电枢而非整台发电机",()=>[
    pipe("贯通叠片铁芯的电枢轴",[0,0.12,-0.3],[0,0.12,0.3],0.035),
    cylinder("电枢多槽叠片铁芯",0,0.12,0.01,0.128,0.29,iron,[90,0,0]),
    ...Array.from({length:6},(_,i)=>armatureCoil(i*Math.PI/3)),
    ringZ("换向器与轴之间的绝缘芯套",0.027,0.009,0.12,-0.23,0.07,porcelain),
    ...Array.from({length:12},(_,i)=>commutatorSegment(i)),
    ...[-1,1].map(s=>ringZ("叠片转子两端的绕组绑扎环",0.08,0.004,0.12,0.01+s*0.14,0.018,porcelain)),
  ],"构件","蒸汽朋克"),
  design("鼠笼异步电动机","转子纵向导条被两端短路环连为鼠笼，定子分布绕组产生旋转磁场后在笼条中感应电流，转子没有换向器或外接励磁引线",()=>[
    base(0.65,0.5,0.04),pipe("异步电机贯穿输出轴",[0,0.26,-0.28],[0,0.26,0.28],0.035),
    cylinder("鼠笼转子叠片圆芯",0,0.26,0,0.17,0.28,iron,[90,0,0]),
    ...Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return pipe("嵌入转子槽的连续导电条",[Math.cos(a)*0.081,0.26+Math.sin(a)*0.081,-0.155],[Math.cos(a)*0.081,0.26+Math.sin(a)*0.081,0.155],0.01);}),
    ...[-1,1].map(s=>ringZ("将全部笼条短接的转子端环",0.09,0.015,0.26,s*0.155,0.018,bronze)),
    ringZ("定子外围连续叠片回磁轭",0.18,0.04,0.26,0,0.28,iron),
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return [radialTooth(a,0.117,0.26,0.056,0.024,0.25),fieldCoil(a,0.13,0.26,0.135,0.027)];}).flat(),
    ...[-1,1].map(s=>box("定子机壳固定底脚",s*0.15,0.075,0,0.08,0.07,0.22)),box("连接定子机壳与两底脚的承台",0,0.1,0,0.45,0.05,0.18),...motorBearings(),
    box("不连接转子的定子接线盒",0.24,0.26,0,0.12,0.13,0.18,porcelain),
  ],"设施","现代"),
  design("开关磁阻电动机","定子每个凸极有独立励磁绕组，转子仅有无绕组凸铁极，顺序通电使磁路趋向低磁阻对齐位置，不采用鼠笼感应电流",()=>[
    base(0.65,0.5,0.04),pipe("凸极转子共用输出轴",[0,0.26,-0.27],[0,0.26,0.27],0.035),
    cylinder("没有电线与磁体的转子中心铁芯",0,0.26,0,0.12,0.25,iron,[90,0,0]),
    ...Array.from({length:4},(_,i)=>radialTooth(i*Math.PI/2,0.07,0.26,0.03,0.055,0.25)),
    ringZ("六极定子的外围回磁轭",0.19,0.04,0.26,0,0.29,iron),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return [radialTooth(a,0.12,0.26,0.06,0.035,0.25),fieldCoil(a,0.137,0.26,0.14,0.036)];}).flat(),
    ...[-1,1].map(s=>box("定子外壳的独立固定脚",s*0.16,0.08,0,0.085,0.08,0.25)),
    box("按相位连接定子绕组的端子排",0.25,0.26,0,0.1,0.12,0.22,porcelain),
    ...motorBearings(),
  ],"设施","现代"),
];
function ringZ(name:string,r:number,t:number,y:number,z:number,depth:number,color=iron):ModelPart{const p=ring(name,color,r,t,0,depth);p.position={x:0,y,z};p.rotation.x=90;return p;}
function radialTooth(a:number,r:number,y:number,length:number,width:number,depth:number):ModelPart{return part("实际凸入气隙的独立铁极","box",iron,[Math.cos(a)*r,y+Math.sin(a)*r,0],[length,width,depth],[0,0,a*180/Math.PI]);}
function fieldCoil(a:number,r:number,y:number,zHalf:number,tangent:number):ModelPart {const x=Math.cos(a)*r,h=y+Math.sin(a)*r,dx=-Math.sin(a)*tangent,dy=Math.cos(a)*tangent;return part("闭合绕在单个定子齿根的铜线包","tube",bronze,[0,0,0],[1,1,1],[0,0,0],{radius:0.005,path:[{x:x+dx,y:h+dy,z:-zHalf},{x:x+dx,y:h+dy,z:zHalf},{x:x-dx,y:h-dy,z:zHalf},{x:x-dx,y:h-dy,z:-zHalf},{x:x+dx,y:h+dy,z:-zHalf}]});}
function armatureCoil(a:number):ModelPart{const p=(angle:number,z:number)=>({x:Math.cos(angle)*0.067,y:0.12+Math.sin(angle)*0.067,z});return part("跨过叠片两端的独立闭合电枢线圈","tube",bronze,[0,0,0],[1,1,1],[0,0,0],{radius:0.004,path:[p(a-0.12,-0.155),p(a-0.12,0.175),p(a+0.12,0.175),p(a+0.12,-0.155),p(a-0.12,-0.155)]});}
function commutatorSegment(i:number):ModelPart{const profile=[];for(let j=0;j<=3;j++){const a=i*Math.PI/6+0.02+j*(Math.PI/6-0.04)/3;profile.push({x:Math.cos(a)*0.043,y:Math.sin(a)*0.043});}for(let j=3;j>=0;j--){const a=i*Math.PI/6+0.02+j*(Math.PI/6-0.04)/3;profile.push({x:Math.cos(a)*0.025,y:Math.sin(a)*0.025});}return part("用绝缘缝分开的单片铜换向片","extrude",bronze,[0,0.12,-0.23],[1,1,1],[0,0,0],{depth:0.06,profile});}
function glassArm(start:Triple,end:Triple):ModelPart{const axis=pipe("独立中空玻璃阳极臂",start,end,0.07),p=ring("独立中空玻璃阳极臂",colors.glass,0.035,0.005,0,Math.hypot(end[0]-start[0],end[1]-start[1],end[2]-start[2]),{opacity:0.3});p.position=axis.position;p.rotation=axis.rotation;return p;}

function motorBearings():ModelPart[]{return[-1,1].flatMap(s=>[box("输出轴承的独立落地支座",0,0.13,s*0.23,0.09,0.18,0.06),ringZ("输出轴承保留真实轴孔的承圈",0.04,0.022,0.26,s*0.23,0.06)]);}
