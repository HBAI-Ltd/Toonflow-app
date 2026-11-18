import { box, cylinder, design, roof } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const stone="#afb2a3";
export const chineseMonumentDesigns = [
  design("八面石经幢","八棱石柱承在莲形台座上，柱冠石檐与顶端宝珠逐层收合，作为完整可绕行的经幢碑刻构件；经文内容或文字差异不另列主项",()=>[
    box("经幢底层完整方形磉台",0,0.09,0,1.1,0.18,1.1,stone),
    octagonalFrustum("莲座下方八角收分台",0.18,0.23,0.53,0.43),
    ...Array.from({length:8},(_,i)=>{const a=i*Math.PI/4;return part("台座外侧凸出的立体莲瓣","sphere",stone,[Math.cos(a)*0.35,0.38,Math.sin(a)*0.35],[0.14,0.24,0.08],[0,-i*45,0]);}),
    cylinder("莲座内连续承重的中央石心",0,0.435,0,0.6,0.15,stone),
    octagonalFrustum("承托八面幢身的完整上枋",0.44,0.15,0.45,0.39),
    part("无文字纹样分款的八棱幢身","extrude",stone,[0,1.59,0],[1,1,1],[-90,0,0],{depth:2,profile:Array.from({length:8},(_,i)=>({x:Math.cos(i*Math.PI/4)*0.32,y:Math.sin(i*Math.PI/4)*0.32}))}),
    octagonalFrustum("幢身上方八面出挑檐石",2.59,0.18,0.5,0.43),
    octagonalFrustum("檐石之上收向宝顶的石冠",2.77,0.24,0.43,0.16),
    part("经幢最上端收尖宝珠","lathe",stone,[0,3.01,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:0.13,y:0},{x:0.17,y:0.12},{x:0.11,y:0.24},{x:0,y:0.36}]}),
  ],"设施","中式"),
  design("双阙礼仪入口","两座互不相连的石阙相向标定中间通道，阙身上的叠出枋石与屋形冠顶各自承托，没有跨过入口的牌坊横梁",()=>[-1,1].flatMap(s=>[
    box("单阙完整落地石基",s*2.7,0.15,0,1.5,0.3,1.65,stone),
    box("单阙竖立的长方形厚石身",s*2.7,1.6,0,1,2.6,1.3,stone),
    box("从阙身向外挑出的第一层枋石",s*2.7,2.96,0,1.25,0.18,1.5,stone),
    box("逐层承托冠顶的第二层枋石",s*2.7,3.14,0,1.55,0.18,1.7,stone),
    box("阙顶檐下完整压顶石",s*2.7,3.32,0,1.85,0.18,1.9,stone),
    {...roof(s*2.7,3.47,0,2.05,2.1),color:stone},
    ...[-1,1].map(side=>box("阙身边缘的独立竖向收枋",s*2.7+side*0.43,1.6,-0.68,0.12,2.4,0.08,stone)),
  ]),"建筑","中式"),
  design("罩檐独立照壁","抬高砖石基座承住独立厚屏墙，正面凹心由凸边框围合，上方罩檐保护墙顶；主体现为入口视线屏障而非可穿通城门",()=>[
    box("照壁完整落地长石台",0,0.125,0,3.5,0.25,0.85,stone),
    box("台上独立砖砌厚屏墙",0,1.3,0,3,2.1,0.24,"#9ca69c"),
    ...[-1,1].map(s=>box("屏墙两端通高边柱",s*1.43,1.3,0,0.22,2.1,0.35,stone)),
    ...[-1,1].map(s=>box("正面凹心上下凸出的边框",0,1.3+s*0.76,-0.15,2.52,0.11,0.1,stone)),
    ...[-1,1].map(s=>box("正面凹心左右凸出的边框",s*1.205,1.3,-0.15,0.11,1.62,0.1,stone)),
    roof(0,2.43,0,3.6,1.05),
    box("罩檐下方的连续承托枋",0,2.34,0,3.18,0.14,0.4,stone),
    ...[-1,1].map(s=>box("基座外侧可踏入的低阶",0,0.07,s*0.58,3.7,0.14,0.3,stone)),
  ],"构件","中式"),
];
function octagonalFrustum(name:string,y:number,h:number,bottom:number,top:number):ModelPart {const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const [r,height] of [[bottom,0],[top,h]])for(let i=0;i<8;i++){const a=i*Math.PI/4;vertices.push({x:Math.cos(a)*r!,y:height!,z:Math.sin(a)*r!});}for(let i=0;i<8;i++){const j=(i+1)%8;indices.push(i,i+8,j,j,i+8,j+8);}for(let i=1;i<7;i++)indices.push(0,i,i+1,8,8+i+1,8+i);return part(name,"mesh",stone,[0,y,0],[1,1,1],[0,0,0],{vertices,indices});}
