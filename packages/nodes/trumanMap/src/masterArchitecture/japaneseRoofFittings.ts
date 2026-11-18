import { box, colors, cylinder, design, pipe, rail } from "./structures";
import { part, ring, type ModelPart } from "../assetModelParts";
const cedar="#9a7853";
const metalCap="#948a64";
function japanesePart(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","日式");}

// 传统具名构件各保留不同完整形体和装配界面，不以雕纹、木色、数量或保存状态另扩主条目。
export const japaneseRoofFittingDesigns = [
  japanesePart("千木交叉脊叉","两根长扁木在屋脊上方交叉并继续伸出，交会处固定而非铰转，末端包金属护角，作为一套可单独装配的脊叉",()=>[
    rail([-0.95,0,0],[0.78,2.12,0],0.16,cedar),rail([0.95,0,0.09],[-0.78,2.12,0.09],0.16,cedar),
    rail([0.62,1.924,0],[0.78,2.12,0],0.175,metalCap),rail([-0.62,1.924,0.09],[-0.78,2.12,0.09],0.175,metalCap),
    pipe("交会处固定贯木销",[0,1.164,-0.11],[0,1.164,0.2],0.045),
    ...[-1,1].map(s=>part("与破风端相接的木鞍脚","box",cedar,[s*0.85,0.13,s<0?0:0.09],[0.28,0.15,0.22],[0,0,-s*39.2])),
  ]),
  japanesePart("鲣木卧脊构件","短粗横木横跨屋脊，底部凹鞍配合脊部并由金属端箍护住木口，形体不同于向上交叉的千木",()=>[
    cylinder("横卧在脊上的完整粗木",0,0.225,0,0.25,1.3,cedar,[0,0,90]),
    ...[-1,1].map(s=>{const p=ring("粗木两端独立金属护箍",metalCap,0.137,0.012,0,0.045);p.position={x:s*0.58,y:0.225,z:0};p.rotation.z=90;return p;}),
    ...[-1,1].map(s=>cylinder("护住端部木口的金属帽",s*0.655,0.225,0,0.26,0.025,metalCap,[0,0,90])),
    ...[-1,1].map(s=>part("底部内凹贴脊的木鞍","extrude",cedar,[s*0.16,0,0],[1,1,1],[0,90,0],{depth:0.12,profile:[[-0.17,0],[0.17,0],[0.17,0.2],[0.125,0.2],[0.11,0.1656],[0.08,0.129],[0,0.1],[-0.08,0.129],[-0.11,0.1656],[-0.125,0.2],[-0.17,0.2]].map(([x,y])=>({x:x!,y:y!}))})),
  ]),
  japanesePart("唐破风反曲弧檐架","中部隆起的弧檐在两端形成反向卷曲，前后弧形破风板承住连续薄屋面，保留弧腹下的真实开放净空",()=>[
    ...[-1,1].map(s=>curvedGable("前后独立反曲破风板",s*0.78,0.16,0.14,cedar)),
    curvedGable("随反曲弧线连续铺设的薄屋面",0,0.075,1.7,colors.roof,0.075),
    box("破风下方独立横向承梁",0,0.4,0,2.9,0.15,1.5,cedar),
    ...[-1,1].flatMap(x=>[-1,1].map(z=>box("弧檐架四角落地短柱",x*1.34,0.2,z*0.61,0.14,0.4,0.14,cedar))),
    ...[-1,1].map(s=>box("中央脊部承托短枋",0,0.73,s*0.64,0.12,0.52,0.12,cedar)),
  ]),
  japanesePart("悬鱼破风端饰","中央垂饰与左右展开的鰭形木板遮护檩梁端部，凸起花心与下垂尾板构成完整端饰，不把它误作需要贯通的通风设备",()=>[
    part("中央下垂的完整悬鱼木板","extrude",cedar,[0,0,0],[1,1,1],[0,0,0],{depth:0.065,profile:[[-0.12,0.9],[0.12,0.9],[0.13,0.68],[0.3,0.62],[0.2,0.5],[0.13,0.45],[0.1,0.2],[0,0.05],[-0.1,0.2],[-0.13,0.45],[-0.2,0.5],[-0.3,0.62],[-0.13,0.68]].map(([x,y])=>({x:x!,y:y!}))}),
    ...[-1,1].map(s=>part("中央两侧的独立鰭形端饰","extrude",cedar,[0,0,0.008],[1,1,1],[0,0,0],{depth:0.05,profile:[[s*0.1,0.63],[s*0.32,0.78],[s*0.52,0.72],[s*0.6,0.59],[s*0.45,0.55],[s*0.36,0.65],[s*0.22,0.53]].map(([x,y])=>({x:x!,y:y!}))})),
    ...Array.from({length:6},(_,i)=>{const a=i*Math.PI/3;return part("花心周边凸起的木雕花瓣","sphere",cedar,[Math.cos(a)*0.095,0.62+Math.sin(a)*0.095,-0.05],[0.11,0.11,0.045]);}),
    part("盖住固定销的中央花心","sphere",metalCap,[0,0.62,-0.075],[0.09,0.09,0.035]),
    ...[-1,1].map(s=>box("背面接到檩端的安装木垫",s*0.065,0.78,0.07,0.06,0.16,0.08,cedar)),
  ]),
  japanesePart("龟腹曲面基坛","宽底向上连续收束成圆缓腹面，顶端平石承托木柱基础，八角圆角轮廓与曲线腹面区别于束腰须弥座或直线梯形台基",()=>[
    turtlePlinth(),box("基坛顶端完整平整承压石",0,0.86,0,2.13,0.13,1.77),
    ...[-1,1].map(s=>box("顶面两边的柱础承托布石",s*0.72,0.96,0,0.2,0.07,1.4)),
  ]),
  japanesePart("拟宝珠高栏柱","木质高栏柱顶部以带尖珠和鼓腹的金属帽收口，柱脚抱箍和侧向横栏接榫为完整可装配柱件，不是通用圆柱换色",()=>[
    cylinder("高栏柱完整木质柱身",0,0.47,0,0.115,0.94,cedar),
    box("与廊床连接的方形落地柱脚",0,0.035,0,0.18,0.07,0.18,cedar),
    ring("柱脚外部固定金属抱箍",metalCap,0.065,0.009,0.12,0.09),
    part("上部尖珠鼓腹的完整金属拟宝珠","lathe",metalCap,[0,0.93,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:0.065,y:0},{x:0.065,y:0.045},{x:0.086,y:0.095},{x:0.082,y:0.14},{x:0.051,y:0.205},{x:0.021,y:0.258},{x:0,y:0.3}]}),
    ...[-1,1].map(s=>box("柱侧接入横栏的短榫头",s*0.08,0.66,0,0.07,0.065,0.06,cedar)),
  ]),
];
function curvedGable(name:string,z:number,thickness:number,depth:number,color:string,raise=0):ModelPart {const ys=[0.68,0.57,0.56,0.73,0.95,1.08,1.1,1.08,0.95,0.73,0.56,0.57,0.68],top=ys.map((y,i)=>({x:-1.5+i*0.25,y:y+raise})),profile=[...top,...[...top].reverse().map(p=>({...p,y:p.y-thickness}))];return part(name,"extrude",color,[0,0,z],[1,1,1],[0,0,0],{depth,profile});}
function turtlePlinth():ModelPart {const levels=[[0,1.6],[0.12,1.55],[0.3,1.4],[0.55,1.15],[0.7,1.07],[0.8,1.05]],outline=[[-1,-0.75],[-0.75,-1],[0.75,-1],[1,-0.75],[1,0.75],[0.75,1],[-0.75,1],[-1,0.75]],vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const [y,r] of levels)for(const [x,z] of outline)vertices.push({x:x!*r!,y:y!,z:z!*r!*5/6});for(let row=0;row<levels.length-1;row++)for(let j=0;j<8;j++){const a=row*8+j,b=row*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c);}const top=(levels.length-1)*8;for(let i=1;i<7;i++)indices.push(0,i,i+1,top,top+i+1,top+i);return part("连续收束且倒角的龟腹基坛主体","mesh","#bec0ac",[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
