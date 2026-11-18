import { base, box, colors, cylinder, design, pipe, rail } from "./structures";
import { part, type ModelPart, type Triple } from "../assetModelParts";
const wood="#95714c";
const stone="#9ca596";
const iron="#617276";
function fixedJapanese(name:string,purpose:string,build:()=>ModelPart[],itemType:"建筑"|"构件"="构件"){return design(name,purpose,build,itemType,"日式");}

// 枡形门郭、偏心覆屋门和独立墙/栏配件各按实际主体登记；城门高低、石垣层数不展开主项。
export const japaneseCastleDetailDesigns = [
  fixedJapanese("枡形虎口折转门郭","方形围壁内的两道门开在相邻而错开的墙面，进入者必须在小郭内直角转向，门郭同时保留内部空地和通行口",()=>[
    base(8.8,8.8,0.16),
    box("门郭后侧完整防御墙",0,1.66,4,8.8,3,0.8,stone),
    box("门郭左侧完整防御墙",-4,1.66,0,0.8,3,8.8,stone),
    box("第一门左侧短墙",-3.25,1.66,-4,1.5,3,0.8,stone),
    box("第一门右侧长墙",1.75,1.66,-4,4.5,3,0.8,stone),
    box("第二门前侧长墙",4,1.66,-2,0.8,3,4,stone),
    box("第二门后侧短墙",4,1.66,3,0.8,3,2,stone),
    ...[-1,1].map(s=>box("第一门两侧固定柱",-1.5+s,1.36,-4,0.18,2.4,0.3,wood)),
    box("第一门上部完整承梁",-1.5,2.64,-4,2.3,0.2,0.36,wood),
    ...[-1,1].map(s=>box("第二门两侧固定柱",4,1.36,1+s,0.3,2.4,0.18,wood)),
    box("第二门上部完整承梁",4,2.64,1,0.36,0.2,2.3,wood),
    part("第一门靠郭内开启的门扉","box",wood,[-2.45,1.38,-3.5],[0.075,2.25,0.95]),
    part("第二门靠郭内开启的门扉","box",wood,[3.5,1.38,0.05],[0.95,2.25,0.075]),
    part("第一门另一侧向郭内开启的门扉","box",wood,[-0.55,1.38,-3.5],[0.075,2.25,0.95]),part("第二门另一侧向郭内开启的门扉","box",wood,[3.5,1.38,1.95],[0.95,2.25,0.075]),
    ...[-1,1].map(s=>box("郭内连通两门的折转行走铺带",s<0?-1.5:1,0.19,s<0?-1:1,s<0?2:5,0.06,s<0?5:2,"#b5b4a2")),
  ],"建筑"),
  fixedJapanese("算木积曲面隅角石垣","角部宽长石在相邻层交替转向并伸入两面墙体，上层逐步向内收束，背部填层与长短石咬接共同形成完整L形墙角",()=>cornerWall()),
  fixedJapanese("忍返扇刺防攀架","墙顶长基座上固定成列扇状外伸尖刺，金属分叉同时覆盖上下攀握路径；主体是可装配墙顶防攀件而非整面普通铁栅",()=>[
    box("整条墙顶锚固基板",0,0.025,0,2,0.05,0.2,iron),
    ...[-0.75,0,0.75].flatMap(x=>[
      pipe("扇刺与基板连接的固定短柱",[x,0.05,0],[x,0.21,0],0.035),
      ...Array.from({length:5},(_,i)=>{const a=(i-2)*Math.PI/7,start:Triple=[x,0.21,0],end:Triple=[x,0.21+Math.cos(a)*0.47,Math.sin(a)*0.47],tip:Triple=[x,end[1]+Math.cos(a)*0.09,end[2]+Math.sin(a)*0.09];return[pipe("向外张开的金属防攀刺杆",start,end,0.019),{...pipe("与刺杆同轴的独立尖端",end,tip,0.032),shape:"cone" as const}];}).flat(),
    ]),
    ...[-1,1].map(s=>cylinder("基板两端固定螺栓",s*0.9,0.045,0,0.025,0.04)),
  ]),
  fixedJapanese("刎高栏出挑端栏","上栏两端向外反曲抬起而形成明显出挑，内侧竖格与下横栏以榫接承接，两柱是栏段安装脚，不是拟宝珠柱重复换顶帽",()=>[
    part("两端反曲向上挑出的上栏","extrude",wood,[0,0,0],[1,1,1],[0,0,0],{depth:0.12,profile:[[-1.5,1.25],[-1.2,1.06],[-0.9,1],[0.9,1],[1.2,1.06],[1.5,1.25],[1.45,1.05],[1.1,0.9],[0.85,0.87],[-0.85,0.87],[-1.1,0.9],[-1.45,1.05]].map(([x,y])=>({x:x!,y:y!}))}),
    ...[-1,1].map(s=>box("独立栏段的安装承柱",s,0.45,0,0.11,0.9,0.11,wood)),
    box("承接下端格子的通长下栏",0,0.28,0,2.2,0.1,0.09,wood),
    ...Array.from({length:7},(_,i)=>box("在上下栏间固定的细直格",-0.78+i*0.26,0.6,0,0.035,0.58,0.04,wood)),
    ...[-1,1].map(s=>box("柱脚连接廊床的横向榫片",s,0.075,0,0.22,0.05,0.2,wood)),
  ]),
  fixedJapanese("药医门偏心覆屋","两根前主柱与后方控柱同覆一座大屋面，屋脊前偏并通过主梁短束承托，两扇门装在前柱间，保留不同于对称四柱亭的通行与承重结构",()=>[
    ...[-1,1].flatMap(s=>[
      cylinder("前主柱下方独立石础",s*1.2,0.075,-0.35,0.32,0.15,stone),
      cylinder("后控柱下方独立石础",s*1.2,0.075,0.9,0.29,0.15,stone),
      box("前侧承担门扉的高主柱",s*1.2,1.35,-0.35,0.2,2.4,0.2,wood),
      box("后侧稳定大屋面的控柱",s*1.2,1.3,0.9,0.16,2.3,0.16,wood),
      box("主柱与控柱之间的纵向系梁",s*1.2,2.48,0.3,0.17,0.18,1.4,wood),
    ]),
    box("前主柱上方的完整通长主梁",0,2.6,-0.35,2.8,0.2,0.25,wood),
    box("后控柱上方的完整通长承梁",0,2.56,0.9,2.8,0.22,0.22,wood),
    ...[-1,1].map(s=>box("主梁上方承托前偏屋脊的短束",s*0.9,2.975,-0.35,0.15,0.55,0.15,wood)),
    box("沿门宽延展的前偏脊木",0,3.26,-0.35,3.45,0.14,0.16,wood),
    part("同时覆盖前主柱和后控柱的非对称屋面","extrude",colors.roof,[0,0,0],[1,1,1],[0,90,0],{depth:3.6,profile:[{x:1.1,y:2.45},{x:0.35,y:3.35},{x:-1.4,y:2.45},{x:-1.4,y:2.35},{x:0.35,y:3.25},{x:1.1,y:2.35}]}),
    ...[-1,1].flatMap(s=>gateLeaf(s)),
  ],"建筑"),
];
function cornerWall():ModelPart[]{const pieces:ModelPart[]=[];for(let row=0;row<6;row++){const offset=row*0.08,y=0.25+row*0.5,swap=row%2===1,stoneBlock=(name:string,x:number,z:number,w:number,d:number)=>box(name,swap?z:x,y,swap?x:z,swap?d:w,0.5,swap?w:d,stone);pieces.push(stoneBlock("伸入双墙面的算木转角长石",offset+0.7,offset+0.35,1.4,0.7));for(const [start,axis] of [[1.4,0],[0.7,1]]){const length=(3.3-start!-offset-0.06)/2;for(let i=0;i<2;i++){const along=start!+offset+0.02+length/2+i*(length+0.02);pieces.push(axis?stoneBlock("接续角石长端的石垣面石",offset+0.35,along,0.7,length):stoneBlock("接续角石短端的石垣面石",along,offset+0.35,length,0.7));}}const extent=2.6-offset;pieces.push(box("石垣内侧逐层收束的背部填层",offset+0.7+extent/2,y,offset+0.7+extent/2,extent,0.5,extent,"#9e9e83"));}return pieces;}
function gateLeaf(side:number):ModelPart[]{const angle=side*65,a=angle*Math.PI/180,cx=side*1.2-side*0.55*Math.cos(a),cz=-0.35+0.55*Math.sin(Math.abs(a)),pieces=[box("内开板门完整木背板",0,1.15,0,1.1,2.2,0.055,wood),...[-1,1].map(s=>box("门板两边的竖向木框",s*0.51,1.15,-0.035,0.08,2.2,0.055,wood)),...[-1,0,1].map(i=>box("板门前面独立横穿带",0,1.15+i*0.7,-0.035,1.1,0.1,0.055,wood))];for(const p of pieces){const x=p.position.x,z=p.position.z;p.position.x=cx+x*Math.cos(a)+z*Math.sin(a);p.position.z=cz-x*Math.sin(a)+z*Math.cos(a);p.rotation.y=angle;}return pieces;}
