import { box, colors, cylinder, design, pipe, rail } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const wood="#9e7a51";
const stone="#a7ac9e";
export const chinesePanelAssemblyDesigns = [
  design("花格石勾栏插榫装配","通长地袱承接望柱和两块透空石栏板，栏板侧榫进入柱槽，寻杖扶手在上部连续贯通，构成可独立使用的完整栏段",()=>[
    box("承住石栏板和望柱的通长地袱",0,0.07,0,2.8,0.14,0.28,stone),
    ...[-1,0,1].map(i=>box("接入地袱的通高石望柱",i*1.3,0.55,0,0.22,1.1,0.22,stone)),
    ...[-1,1].flatMap(s=>stonePanel(s*0.65)),
    box("在望柱间连续贯通的寻杖扶手",0,1.03,0,2.8,0.12,0.2,stone),
    ...[-1,0,1].map(i=>box("各望柱上方独立收口压帽",i*1.3,1.12,0,0.3,0.08,0.3,stone)),
  ],"构件","中式"),
  design("格心腰裙隔扇","上部透空格心、中部腰华板与下部实裙板分区装入同一长扉，两侧边梃和端轴是实际装配件，区别于通幅横栈实板扉或纸格屏风",()=>[
    ...[-1,1].map(s=>box("长扉两侧通高边梃",s*0.45,1.15,0,0.08,2.3,0.09,wood)),
    ...[0.055,0.77,1.01,2.245].map(y=>box("分隔格心腰板和裙板的横抹头",0,y,0,0.94,0.11,0.09,wood)),
    box("下部完整不透光裙板",0,0.42,0.015,0.82,0.62,0.035,wood),
    box("中部独立腰华木板",0,0.89,0.015,0.82,0.14,0.035,wood),
    ...lattice(),
    ...[-1,1].map(s=>cylinder("接入上下门框的实际转动端轴",-0.45,1.15+s*1.15,0,0.025,0.12,wood)),
    box("腰板前方固定门环的金属托片",0.28,0.89,-0.05,0.045,0.09,0.02,colors.metal),
    pipe("腰板侧边可握持的短提拉杆",[0.25,0.89,-0.075],[0.31,0.89,-0.075],0.012),
  ],"构件","中式"),
];
function stonePanel(x:number):ModelPart[]{return[
  ...[-1,1].map(s=>box("石栏板上下完整边枨",x,0.54+s*0.25,0,1.08,0.06,0.1,stone)),
  ...[-1,1].map(s=>box("石栏板左右完整边枨",x+s*0.505,0.54,0,0.07,0.5,0.1,stone)),
  ...[[[-0.475,0.54],[0,0.76]],[[0,0.76],[0.475,0.54]],[[0.475,0.54],[0,0.32]],[[0,0.32],[-0.475,0.54]]].map(v=>rail([x+v[0]![0]!,v[0]![1]!,0],[x+v[1]![0]!,v[1]![1]!,0],0.06,stone)),
  ...[-1,1].map(s=>box("伸入望柱侧槽的栏板短榫",x+s*0.55,0.4,0,0.1,0.11,0.06,stone)),
];}
function lattice():ModelPart[]{const pieces:ModelPart[]=[];for(const slope of [-1.4,1.4])for(const c of [0.7,1.05,1.4,1.75,2.1,2.45]){const raw=[[-0.414,-0.414*slope+c],[0.414,0.414*slope+c],[(1.06-c)/slope,1.06],[(2.195-c)/slope,2.195]],points=raw.filter(([x,y])=>x!>=-0.41401&&x!<=0.41401&&y!>=1.05999&&y!<=2.19501).filter((p,i,list)=>list.findIndex(q=>Math.hypot(p[0]!-q[0]!,p[1]!-q[1]!)<0.00001)===i);if(points.length>=2){const z=slope<0?-0.015:-0.035;pieces.push(rail([points[0]![0]!,points[0]![1]!,z],[points[1]![0]!,points[1]![1]!,z],0.02,wood));}}return pieces;}
