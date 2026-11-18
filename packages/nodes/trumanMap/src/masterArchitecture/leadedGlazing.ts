import { box, design } from "./structures";
import { part, type ModelPart } from "../assetModelParts";
const lead="#526065";
export const leadedGlazingDesigns=[design("铅条拼嵌玻璃窗","每块独立玻璃的边缘插在工字截面铅槽内，槽条前后翼缘与中心腹板真实建模，后置铁条承托整幅拼窗；不按不同配色或图画再扩主项",()=>{
  const p:ModelPart[]=[];for(const y of [0,.4,.8,1.2,1.6])p.push(...came(0,y,.81,false));for(const x of [-.4,0,.4])p.push(...came(x,.8,1.6,true));for(let row=0;row<4;row++)for(const s of [-1,1])p.push(part("边缘真正插入铅槽的单片透明玻璃","box",row%2?"#8baeb1":"#b0a984",[s*.2,.2+row*.4,0],[.393,.393,.003],[0,0,0],{opacity:.55,roughness:.2}));for(const y of [.42,1.18])p.push(box("在窗后承托拼嵌铅条的通长铁横筋",0,y,.02,.86,.012,.015,lead),...[-1,1].map(s=>box("铅槽与后侧铁横筋的短绑接片",s*.2,y,.012,.015,.025,.025,lead)));return p;
},"构件","欧式")];
function came(x:number,y:number,length:number,vertical:boolean):ModelPart[]{const make=(name:string,w:number,z:number,d:number)=>part(name,"box",lead,[x,y,z],vertical?[w,length,d]:[length,w,d]);return [make("夹住玻璃边缘的铅槽中央腹板",.005,0,.016),make("铅槽前侧连续外展翼缘",.016,-.007,.003),make("铅槽后侧连续外展翼缘",.016,.007,.003)];}
