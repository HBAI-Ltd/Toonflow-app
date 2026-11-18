import { box,cylinder,design } from "./structures";
import { part,ring,type ModelPart } from "../assetModelParts";
const stone="#acb0a0";
export const japaneseMemorialStructureDesigns=[
  design("五轮供养石塔","方地轮、球水轮、方笠火轮、半球风轮和宝珠空轮逐件相接，五种不同实体形成完整供养塔；这不是把旧五重石塔增减檐数",()=>[
    box("五轮塔底部完整方形地轮",0,.14,0,.58,.28,.58,stone),
    part("接在方形地轮上方的球状水轮","sphere",stone,[0,.52,0],[.5,.5,.5]),
    squareCap(),
    part("火轮上方收为平接顶的半球风轮","lathe",stone,[0,1.06,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.2,y:0},{x:.197,y:.06},{x:.16,y:.14},{x:.08,y:.19},{x:0,y:.19}]}),
    part("与风轮顶面实接的宝珠形空轮","lathe",stone,[0,1.25,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.08,y:0},{x:.12,y:.06},{x:.145,y:.14},{x:.11,y:.24},{x:.045,y:.31},{x:0,y:.38}]}),
  ],"设施","日式"),
  design("宝箧印石塔","双级基坛支起方形塔身，带四角上举耳饰的分层笠盖承托独立相轮与宝珠，整体形制区别于五轮塔或层层出檐的楼阁石塔",()=>hokyointo(),"设施","日式"),
];
function squareCap():ModelPart{const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const [r,y] of [[.37,.76],[.39,.81],[.13,1.06]])for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]])vertices.push({x:x!*r!,y:y!,z:z!*r!});for(let row=0;row<2;row++)for(let i=0;i<4;i++){const a=row*4+i,b=row*4+(i+1)%4;indices.push(a,a+4,b,b,a+4,b+4);}indices.push(0,1,2,0,2,3,8,10,9,8,11,10);return part("有真实四坡山形且接住水轮的方笠火轮","mesh",stone,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
function hokyointo():ModelPart[]{const p:ModelPart[]=[box("宝箧印塔落地宽石基",0,.08,0,.86,.16,.86,stone),box("基座上部逐级收进的第二层方台",0,.225,0,.68,.13,.68,stone),box("承托笠盖的完整方形塔身",0,.58,0,.47,.58,.47,stone),box("塔身与笠盖之间的平收口层",0,.895,0,.56,.05,.56,stone),box("四角耳饰落在完整的宽笠盘上",0,.965,0,.86,.09,.86,stone),box("笠盖第二层收分方枋",0,1.045,0,.69,.07,.69,stone),box("笠盖第三层承托相轮的方枋",0,1.115,0,.5,.07,.5,stone),cylinder("相轮从笠盖连续接到宝珠下方的心柱",0,1.53,0,.06,.76,stone),part("九轮下方完整覆钵","lathe",stone,[0,1.15,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.19,y:0},{x:.18,y:.04},{x:.12,y:.12},{x:.055,y:.15},{x:0,y:.15}]})];for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;p.push(part("从笠盖四角向上伸出的完整隅耳","extrude",stone,[Math.cos(a)*.42,.98,Math.sin(a)*.42],[1,1,1],[0,-a*180/Math.PI,0],{depth:.09,profile:[{x:0,y:0},{x:.16,y:0},{x:.14,y:.15},{x:.07,y:.35},{x:-.03,y:.42},{x:.02,y:.2}]}));}for(let i=0;i<9;i++)p.push(ring("径向连到心柱且逐级收小的相轮",stone,.145-i*.009,.125-i*.009,1.33+i*.055,.024));p.push(part("相轮上方的完整宝珠尖顶","lathe",stone,[0,1.815,0],[1,1,1],[0,0,0],{profile:[{x:0,y:0},{x:.11,y:0},{x:.13,y:.05},{x:.08,y:.13},{x:.11,y:.2},{x:.065,y:.28},{x:0,y:.36}]}));return p;}
