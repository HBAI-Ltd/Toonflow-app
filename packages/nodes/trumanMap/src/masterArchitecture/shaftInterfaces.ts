import { box, colors, cylinder, design, pipe } from "./structures";
import { part, ring, type ModelPart } from "../assetModelParts";

const steel = "#9ca8a4";
const carbon = "#566369";
const bronze = "#ad956a";
function shaftPart(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","现代");}

// 只收独立密封、承载或耗能机制；球数、轴径、额定载荷及安装方向不扩充主条目。
export const shaftInterfaceDesigns = [
  shaftPart("端面机械密封","固定陶瓷环与随轴旋转的碳环沿轴向相贴，独立弹簧压紧两端面而不是靠唇口径向擦轴，剖开外壳显示静动两条装配链",()=>[
    cylinder("贯穿静动密封环的主轴",0,0.17,0,0.05,0.34,steel),
    ring("与壳体固定的陶瓷静环","#d1d2c4",0.065,0.039,0.11,0.035),
    ring("压在静环端面的旋转碳环",carbon,0.065,0.039,0.145,0.035),
    ring("将弹簧力传给碳环的金属托环",steel,0.069,0.043,0.17,0.016),
    part("轴外独立压紧弹簧","tube",steel,[0,0,0],[1,1,1],[0,0,0],{radius:0.003,path:Array.from({length:25},(_,i)=>({x:Math.cos(i*Math.PI/4)*0.044,y:0.18+i*0.0025,z:Math.sin(i*Math.PI/4)*0.044}))}),
    ring("固定在转轴上的弹簧挡圈",steel,0.059,0.034,0.25,0.018),
    ...[-1,1].map(s=>pipe("托环与碳环之间传递转矩的短销",[s*0.052,0.15,0],[s*0.052,0.186,0],0.006)),
    sector("剖去前半的固定外壳",0.076,0.091,0.04,0.15,0,Math.PI),
    ring("与壳体连接的落地固定法兰",steel,0.12,0.094,0.05,0.016),
    ...[-1,1].map(s=>cylinder("法兰两端独立安装螺栓",s*0.1,0.06,0,0.011,0.05)),
  ]),
  shaftPart("迷宫齿式轴封","固定壳体的多道窄齿与转轴台阶交错形成反复节流膨胀的曲折间隙，任何齿尖都不与旋转轴面直接接触",()=>[
    cylinder("贯穿迷宫齿封的连续转轴",0,0.19,0,0.055,0.38,steel),
    ...Array.from({length:5},(_,i)=>ring("随轴转动的间隔凸台",steel,0.047,0.0195,0.07+i*0.057,0.027)),
    ...Array.from({length:4},(_,i)=>sector("固定壳上的薄节流齿",0.031,0.075,0.099+i*0.057,0.006,0,Math.PI*1.5)),
    sector("保留观察缺口的外部密封壳",0.07,0.079,0.19,0.31,0,Math.PI*1.5),
    ...[0.035,0.345].map(y=>sector("壳体端部与轴保持间隙的安装环",0.03,0.09,y,0.025,0,Math.PI*1.5)),
    ...[-1,1].map(s=>box("固定外壳的独立安装脚",s*0.07,0.018,0.02,0.04,0.036,0.09)),
  ]),
  shaftPart("滚动球轴承","内外两圈以凹弧滚道夹持独立滚珠，保持架只在球间连接，内孔与外圈分别连接轴和机座而不是悬浮磁场",()=>[
    part("带内凹滚道的外轴承圈","lathe",steel,[0,0.03,0],[1,1,1],[0,0,0],{profile:[{x:0.077,y:-0.025},{x:0.1,y:-0.025},{x:0.1,y:0.025},{x:0.077,y:0.025},{x:0.079,y:0.015},{x:0.0865,y:0.008},{x:0.089,y:0},{x:0.0865,y:-0.008},{x:0.079,y:-0.015},{x:0.077,y:-0.025}]}),
    part("带外凹滚道的内轴承圈","lathe",steel,[0,0.03,0],[1,1,1],[0,0,0],{profile:[{x:0.04,y:-0.025},{x:0.068,y:-0.025},{x:0.068,y:-0.015},{x:0.0635,y:-0.008},{x:0.061,y:0},{x:0.0635,y:0.008},{x:0.068,y:0.015},{x:0.068,y:0.025},{x:0.04,y:0.025},{x:0.04,y:-0.025}]}),
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return part("独立承载滚动钢球","sphere",steel,[Math.cos(a)*0.075,0.03,Math.sin(a)*0.075],[0.028,0.028,0.028]);}),
    ring("位于滚道端面外侧的冠状保持架环",bronze,0.093,0.032,0.059,0.003),
    ...Array.from({length:8},(_,i)=>{const degrees=(i+.5)*45,a=degrees*Math.PI/180;return part("从冠环伸入两钢球间的保持架隔片","box",bronze,[Math.cos(a)*0.073,0.044,Math.sin(a)*0.073],[0.004,0.03,0.028],[0,-degrees,0]);}),
  ]),
  shaftPart("多极主动磁轴承","多个独立电磁铁以径向气隙围绕铁磁转子，位移探头在极靴之间反馈轴心位置，承载不靠接触滚动体或单个永磁悬浮尖顶",()=>[
    cylinder("被径向磁力约束的旋转轴",0,0.105,0,0.06,0.21,steel),
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return[part("面向转子的独立磁极靴","box",carbon,[Math.cos(a)*0.061,0.1,Math.sin(a)*0.061],[0.045,0.065,0.035],[0,-i*45,0]),part("绕在各极根部的励磁线包","box",bronze,[Math.cos(a)*0.093,0.1,Math.sin(a)*0.093],[0.04,0.055,0.05],[0,-i*45,0])];}).flat(),
    ring("连接八极根部的外回磁环",carbon,0.14,0.025,0.1,0.085),
    ...[0,90].map(degrees=>{const a=(degrees+22.5)*Math.PI/180;return {...pipe("位于极间的独立位移探头",[Math.cos(a)*0.035,0.1,Math.sin(a)*0.035],[Math.cos(a)*0.063,0.1,Math.sin(a)*0.063],0.012),color:"#c5c8b6"};}),
    ...[-1,1].map(s=>box("外磁环固定在机座的脚片",s*0.11,0.045,0,0.06,0.06,0.15)),
    box("磁轴承控制线接口",0.17,0.1,0,0.06,0.07,0.1),
  ]),
  shaftPart("静压油垫径向轴承","四个固定弧形油垫各有独立供压油口，外部压力在转轴尚未旋转时就在轴面形成承载液膜，主体无滚珠或自发摩擦支承",()=>[
    cylinder("被油膜承托的转轴",0,0.08,0,0.09,0.16,steel),
    ...Array.from({length:4},(_,i)=>{const a=i*Math.PI/2;return[
      ...oilPad(a),
      pipe("每个油垫独立的压力供给管",[Math.cos(a)*0.066,0.08,Math.sin(a)*0.066],[Math.cos(a)*0.13,0.08,Math.sin(a)*0.13],0.009),
      box("油垫背部供压接口",Math.cos(a)*0.12,0.08,Math.sin(a)*0.12,0.025,0.025,0.025,bronze),
    ];}).flat(),
    ring("承压油垫外围整体刚性机壳",steel,0.1,0.014,0.08,0.12),
    ...[-1,1].map(s=>box("轴承机壳落地支脚",s*0.078,0.014,0,0.04,0.028,0.18)),
    box("外置定压供油接续块",0.17,0.055,0,0.06,0.07,0.12),
  ]),
  shaftPart("波箔动压空气轴承","连续薄顶箔贴近转轴，背部环向波箔以弹性波峰抵住机壳，转轴运动形成气膜；不把气体供压油垫换介质重复计数",()=>[
    ring("承托弹性波箔的外轴承壳",steel,0.095,0.005,0.055,0.09),
    ring("与轴面之间保持微小气隙的顶箔",bronze,0.078,0.0015,0.055,0.08),
    corrugatedFoil(),
    cylinder("形成动压气膜的高速转轴",0,0.055,0,0.1528,0.11,steel),
    ...[-1,1].map(s=>box("机壳固定的安装小耳",s*0.11,0.012,0,0.04,0.024,0.08)),
  ]),
  shaftPart("剖分可倾瓦油膜轴承","分离弧瓦分别绕背部支点轻微摆动，瓦面与旋转轴之间的收敛油楔形成动压承载，外圈并不以固定角度夹紧转轴",()=>[
    ring("可从端面观察弧瓦的轴承外壳",steel,0.13,0.01,0.075,0.1),
    cylinder("弧瓦围绕的连续转轴",0,0.075,0,0.14,0.15,steel),
    ...Array.from({length:4},(_,i)=>{const a=i*Math.PI/2;return[
      sector("保留供油间隙的独立可倾瓦",0.071,0.1,0.075,0.08,a-0.48,a+0.48),
      part("弧瓦背部独立摇摆球支点","sphere",steel,[Math.cos(a)*0.106,0.075,Math.sin(a)*0.106],[0.012,0.012,0.012]),
      pipe("将摇摆支点连接至机壳的短销",[Math.cos(a)*0.106,0.075,Math.sin(a)*0.106],[Math.cos(a)*0.125,0.075,Math.sin(a)*0.125],0.009),
    ];}).flat(),
    ...[-1,1].map(s=>box("剖分壳体的平面连接耳",s*0.14,0.075,0,0.055,0.1,0.05)),
    pipe("上方供油进入瓦间沟的接口",[0,0.16,0.11],[0,0.075,0.11],0.012),
  ]),
  shaftPart("电磁粉末制动器","转子与定子之间留有金属粉末工作间隙，励磁后粉末形成传递剪切力的链；剖示壳体揭露粉末区，不以固体摩擦片相互压紧",()=>[
    cylinder("制动器贯穿输出轴",0,0.08,0,0.035,0.16,steel),
    ring("与输出轴相连的杯状薄壁转子",steel,0.072,0.008,0.08,0.07),
    cylinder("杯状转子下方连接轴心的底盘",0,0.047,0,0.144,0.008,steel),
    sector("固定定子半剖铁壳",0.077,0.105,0.08,0.09,0,Math.PI*1.5),
    ring("形成磁通的固定励磁线圈",bronze,0.125,0.018,0.08,0.055),
    ...Array.from({length:6},(_,i)=>{const a=-0.12-i*.08;return part("工作间隙内的示意金属粉粒","sphere",carbon,[Math.cos(a)*0.0745,0.08,Math.sin(a)*0.0745],[0.003,0.003,0.003]);}),
    ...[-1,1].map(s=>box("不随转子旋转的外壳安装脚",s*0.1,0.015,0,0.05,0.03,0.12)),
    ...[-1,1].map(s=>box("励磁绕组的独立供电端子",s*0.055,0.13,0.11,0.022,0.025,0.025,bronze)),
  ]),
  shaftPart("同轴磁滞制动器","薄壁磁滞合金杯随轴旋转并经过交替磁极，制动力矩来自磁化滞后而非金属粉粒、涡流盘或实体制动蹄夹持",()=>[
    cylinder("贯穿磁滞制动器的转轴",0,0.09,0,0.032,0.18,steel),
    ring("跟随转轴运动的薄磁滞杯壁",carbon,0.065,0.003,0.09,0.08),
    cylinder("将磁滞杯壁接到轴心的薄底",0,0.052,0,0.13,0.006,steel),
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return[
      part("朝向磁滞杯的交替独立磁极","box",steel,[Math.cos(a)*0.078,0.09,Math.sin(a)*0.078],[0.02,0.07,0.035],[0,-i*45,0]),
      part("建立制动磁场的极根绕组","box",bronze,[Math.cos(a)*0.097,0.09,Math.sin(a)*0.097],[0.022,0.04,0.04],[0,-i*45,0]),
    ];}).flat(),
    ring("外侧闭合回磁环",steel,0.125,0.017,0.09,0.08),
    ...[-1,1].map(s=>box("固定磁轭的两侧安装耳",s*0.11,0.015,0,0.055,0.03,0.12)),
    box("定子电流调节接线座",0,0.14,0.11,0.07,0.03,0.035,bronze),
  ]),
  shaftPart("滚珠自动平衡环","少量可自由周向迁移的质量球在封闭环道内重新分布，以调整旋转总成的偏心；球没有同时夹在内外滚道中承担轴承载荷",()=>[
    cylinder("将平衡环道连到旋转轴的底盘",0,0.006,0,0.21,0.012,steel),
    ring("外侧连续密闭球道壁",steel,0.105,0.005,0.035,0.05),
    ring("内侧连续密闭球道壁",steel,0.07,0.005,0.035,0.05),
    ...[-0.4,0,0.4].map(a=>part("可在环道内周向迁移的质量球","sphere",steel,[Math.cos(a)*0.085,0.03,Math.sin(a)*0.085],[0.024,0.024,0.024])),
    part("可看见质量球位置的上盖","lathe",colors.glass,[0,0.064,0],[1,1,1],[0,0,0],{profile:[{x:0.07,y:-0.003},{x:0.105,y:-0.003},{x:0.105,y:0.003},{x:0.07,y:0.003},{x:0.07,y:-0.003}],opacity:0.35}),
    cylinder("连接旋转总成的中心轴套",0,0.05,0,0.04,0.1,steel),
    ...[-1,1].map(s=>cylinder("将上盖固定在随动环上的锁紧栓",s*0.087,0.065,0,0.008,0.014,bronze)),
  ]),
];
function sector(name:string,inner:number,outer:number,y:number,height:number,start:number,end:number):ModelPart {const profile=[];for(let i=0;i<=8;i++){const a=start+(end-start)*i/8;profile.push({x:Math.cos(a)*outer,y:-Math.sin(a)*outer});}for(let i=8;i>=0;i--){const a=start+(end-start)*i/8;profile.push({x:Math.cos(a)*inner,y:-Math.sin(a)*inner});}return part(name,"extrude",steel,[0,y,0],[1,1,1],[-90,0,0],{depth:height,profile});}
function corrugatedFoil():ModelPart {const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[],count=48;for(let i=0;i<=count;i++){const a=i*Math.PI*2/count,r=0.084+0.005*Math.cos(a*12);for(const [radius,y] of [[r+0.001,0.015],[r+0.001,0.095],[r-0.001,0.015],[r-0.001,0.095]])vertices.push({x:Math.cos(a)*radius!,y:y!,z:Math.sin(a)*radius!});}for(let i=0;i<count;i++){const a=i*4,b=a+4;indices.push(a,a+1,b,a+1,b+1,b,a+2,b+2,a+3,a+3,b+2,b+3,a+1,a+3,b+1,a+3,b+3,b+1,a,b,a+2,a+2,b,b+2);}return part("真实起伏而非贴图的环向波箔","mesh",bronze,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}

function oilPad(a:number):ModelPart[]{return[sector("油腔背部的刚性弧垫本体",0.049,0.07,0.08,0.1,a-0.5,a+0.5),...[-1,1].map(s=>sector("油腔两侧窄封油边",0.046,0.049,0.08,0.1,a+s*0.45-0.05,a+s*0.45+0.05)),...[-1,1].map(s=>sector("油腔上下轴向封油边",0.046,0.049,0.08+s*0.043,0.014,a-0.4,a+0.4))];}
