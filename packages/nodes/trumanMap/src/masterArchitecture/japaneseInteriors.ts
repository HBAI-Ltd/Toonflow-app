import { box, colors, cylinder, design, slats } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const wood="#96734f";
const board="#bea17a";
function interior(name:string,purpose:string,build:()=>ModelPart[]){return design(name,purpose,build,"构件","日式");}
export const japaneseInteriorDesigns = [
  interior("床之间陈设壁龛","低台、深凹后壁、异形圆床柱和上落挂围成完整固定陈设位，前面留开敞赏看空间，区别于普通陈列柜或经卷封闭壁柜",()=>[
    box("整块抬高的陈设床板",0,0.12,0,2.1,0.24,0.95,wood),
    box("壁龛后方完整竖墙",0,1.26,0.45,2.1,2.28,0.08,"#cbc5ae"),
    box("一侧方形界柱",-1.01,1.25,0,0.13,2.5,0.95,wood),
    cylinder("外露且独立的圆床柱",1,1.25,-0.4,0.15,2.5,wood),
    box("床柱后侧封合的短侧壁",1.01,1.25,0.08,0.13,2.5,0.7,"#cbc5ae"),
    box("床间上端收边的落挂",0,2.38,-0.43,2.1,0.22,0.14,wood),
    box("壁龛顶端连续板面",0,2.48,0,2.18,0.06,1.02,wood),
    ...[-1,1].map(s=>box("床板下面承重的通长木脚",s*0.7,0.07,0,0.13,0.14,0.94,wood)),
    box("后壁用于悬挂陈设的窄横枋",0,2.12,0.38,1.5,0.045,0.035,wood),
  ]),
  interior("付书院窗口承案","固定承案向窗外挑出并由两侧封板承托，上方透光格窗与案面构成一体建筑附属书写位，前方不设活动桌腿或独立座椅",()=>[
    box("从墙内挑出的固定书院案面",0,0.74,-0.12,1.8,0.09,0.76,wood),
    ...[-1,1].map(s=>box("两侧连续承托案面的固定侧板",s*0.8,0.35,-0.12,0.08,0.7,0.7,wood)),
    box("书院案后方的固定窗下墙",0,0.35,0.24,1.68,0.7,0.08,wood),
    ...[-1,1].map(s=>box("透光格窗两侧竖框",s*0.82,1.4,0.22,0.08,1.28,0.1,wood)),
    ...[-1,1].map(s=>box("透光格窗上下横框",0,1.4+s*0.6,0.22,1.72,0.08,0.1,wood)),
    box("格窗透光纸面",0,1.4,0.245,1.56,1.12,0.005,"#d7d2bc"),
    ...slats("纸面前独立竖向窗栈",7,[-0.66,1.4,0.19],[0.22,0,0],[0.025,1.15,0.035],wood),
    ...slats("纸面前独立横向窗栈",4,[0,0.96,0.185],[0,0.29,0],[1.6,0.025,0.035],wood),
  ]),
  interior("格天井方格顶枠","互相交接的木质格枠围住独立顶板，格内保持可见凹深，作为可单独装入室内的平面天井单元，不将格数扩为不同主项",()=>[
    cofferGrid(),
    ...Array.from({length:9},(_,i)=>box("落在格枠上缘的独立天井顶板",(i%3-1)*0.7,0.145,(Math.floor(i/3)-1)*0.7,0.66,0.025,0.66,board)),
    ...[-1,1].map(s=>box("顶枠背面的两条安装承枋",s*0.7,0.18,0,0.08,0.06,2.2,wood)),
  ]),
  interior("网代编织天井板","扁竹条在两个方向逐次上下交织，外围木枠收住编片的边端，交叠处有真实高低和间隙而非平面网格贴图",()=>[
    ...Array.from({length:8},(_,i)=>wovenRibbon(i,0)),
    ...Array.from({length:8},(_,i)=>wovenRibbon(i,1)),
    ...[-1,1].flatMap(s=>[box("收住经条两端的横边框",0,0.006,s*0.48,1.04,0.024,0.05,wood),box("收住纬条两端的纵边框",s*0.48,0.006,0,0.05,0.024,1.04,wood)]),
  ]),
  interior("无双窗双层滑格","固定连子格与可横移的第二层连子格前后叠置，通过格条的错位调节通风和视线，保留两层独立导轨与拉手",()=>[
    ...[-1,1].map(s=>box("窗框两侧通高木边框",s*0.7,0.45,0,0.08,0.9,0.15,wood)),
    ...[-1,1].map(s=>box("窗框上下双层导轨承梁",0,0.45+s*0.45,0,1.48,0.08,0.15,wood)),
    ...slats("后侧固定连子格",8,[-0.56,0.45,0.03],[0.16,0,0],[0.075,0.84,0.025],wood),
    ...slats("可沿横槽滑移的前侧连子格",8,[-0.52,0.45,-0.03],[0.16,0,0],[0.075,0.84,0.025],wood),
    ...[-1,1].map(s=>box("把前侧格条连成一体的窄横栈",0.04,0.45+s*0.37,-0.03,1.22,0.035,0.035,wood)),
    box("滑格侧面可握持的短拉手",0.61,0.45,-0.065,0.03,0.18,0.035,colors.metal),
  ]),
  interior("鸭居敷居双槽轨框","上鸭居与下敷居各有真实两条纵向滑槽，左右框柱保持轨槽平行，完整双槽骨架可直接装入两扇引违板扉",()=>[
    track("下部双槽敷居",0,false),track("上部倒置双槽鸭居",2.18,true),
    ...[-1,1].map(s=>box("保持上下双槽平行的侧框柱",s*1.05,1.09,0,0.14,2.18,0.16,wood)),
    ...[-1,1].map(s=>box("框柱背面与墙体连接的横榫",s*1.12,1.4,0.02,0.16,0.08,0.08,wood)),
  ]),
];
function track(name:string,y:number,inverted:boolean):ModelPart{return part(name,"extrude",wood,[0,y,0],[1,1,1],inverted?[180,90,0]:[0,90,0],{depth:2.2,profile:[[-0.13,0],[0.13,0],[0.13,0.1],[0.075,0.1],[0.075,0.065],[0.035,0.065],[0.035,0.1],[-0.035,0.1],[-0.035,0.065],[-0.075,0.065],[-0.075,0.1],[-0.13,0.1]].map(([x,h])=>({x:x!,y:h!}))});}
function wovenRibbon(index:number,axis:number):ModelPart{const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[],points=[-0.5,...Array.from({length:8},(_,i)=>-0.385+i*0.11),0.5];for(let i=0;i<points.length;i++){const cross=Math.max(0,Math.min(7,i-1)),y=0.006+((cross+index)%2?1:-1)*(axis?-0.0025:0.0025);for(const [dy,z] of [[-0.002,-0.03],[0.002,-0.03],[0.002,0.03],[-0.002,0.03]])vertices.push({x:points[i]!,y:y+dy!,z:z!});}for(let i=0;i<points.length-1;i++)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4,c=b+4,d=a+4;indices.push(a,b,c,a,c,d);}indices.push(0,2,1,0,3,2);const end=(points.length-1)*4;indices.push(end,end+1,end+2,end,end+2,end+3);return part("真实上下交织的扁竹条","mesh",board,axis?[-0.385+index*0.11,0,0]:[0,0,-0.385+index*0.11],[1,1,1],axis?[0,-90,0]:[0,0,0],{vertices,indices});}

function cofferGrid():ModelPart {const levels=[-1.1,-1.005,-0.395,-0.305,0.305,0.395,1.005,1.1],vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[],solid=(x:number,z:number)=>x>=0&&x<7&&z>=0&&z<7&&!(x%2===1&&z%2===1);for(let x=0;x<7;x++)for(let z=0;z<7;z++){if(!solid(x,z))continue;const x0=levels[x]!,x1=levels[x+1]!,z0=levels[z]!,z1=levels[z+1]!,offset=vertices.length;vertices.push(...[[x0,0,z0],[x1,0,z0],[x1,0,z1],[x0,0,z1],[x0,0.14,z0],[x1,0.14,z0],[x1,0.14,z1],[x0,0.14,z1]].map(([a,b,c])=>({x:a!,y:b!,z:c!})));const faces=[[0,1,2,0,2,3],[4,6,5,4,7,6]];if(!solid(x,z-1))faces.push([0,5,1,0,4,5]);if(!solid(x,z+1))faces.push([3,2,6,3,6,7]);if(!solid(x-1,z))faces.push([0,3,7,0,7,4]);if(!solid(x+1,z))faces.push([1,5,6,1,6,2]);for(const face of faces)indices.push(...face.map(i=>i+offset));}return part("含真实九格通孔的连续木质格缘","mesh",wood,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
