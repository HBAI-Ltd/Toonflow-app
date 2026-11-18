import { box,cylinder,design,arch } from "./structures";
import { part,type ModelPart } from "../assetModelParts";
import { barrelRoof } from "./spatialShells";
const stone="#b7ab8d",roofColor="#8d9c95";
export const fourIwanCourtDesigns=[design("四伊万庭院","正交四轴各有一座三面围合、正面敞开的高券伊万厅，低回廊以L形转角连接四厅并围住中央方院，外门从角廊通入；不是同一房间只变庭院长宽",()=>{
 const p:ModelPart[]=[box("四厅与回廊共高的完整庭院石铺地面",0,.09,0,20.8,.18,20.8,stone)];
 for(const [x,z,yaw] of [[0,7.25,0],[0,-7.25,180],[7.25,0,90],[-7.25,0,-90]]){const local:ModelPart[]=[...[-1,1].map(s=>box("伊万厅两侧由地面连续承拱的厚墙",s*2.4,1.59,0,.2,2.82,5.5,stone)),barrelRoof("正面向庭院敞开的伊万高筒券",2.3,.18,5.5,[0,3,0],roofColor),backWall()];const portal=arch(0,-2.75,2.3,2.82,.32,.18);portal.position.y=.18;portal.color=stone;local.push(portal);const a=yaw!*Math.PI/180;for(const q of local){const px=q.position.x,pz=q.position.z;q.position.x=x!+Math.cos(a)*px+Math.sin(a)*pz;q.position.z=z!-Math.sin(a)*px+Math.cos(a)*pz;q.rotation.y+=yaw!;p.push(q);}}
 for(const sx of [-1,1])for(const sz of [-1,1]){p.push(box("接续两座伊万侧面的转角回廊长屋面",sx*6.25,3.08,sz*7.25,7.5,.16,5.5,roofColor),box("回廊在转角向另一正交方向延续的短屋面",sx*7.25,3.08,sz*3.5,5.5,.16,2,roofColor),box("四伊万院转角外边的完整纵墙",sx*10,1.59,sz*6.25,.3,2.82,7.5,stone));if(sx===-1&&sz===-1){p.push(box("角廊入口左侧连到厅外墙的石身",-9.025,1.59,-10,1.95,2.82,.3,stone),box("角廊入口右侧连到转角墙的石身",-5.475,1.59,-10,1.95,2.82,.3,stone),box("可从院外穿入角廊的门头过梁",-7.25,2.85,-10,1.7,.3,.3,stone));}else p.push(box("四伊万院转角外边的完整横墙",sx*6.25,1.59,sz*10,7.5,2.82,.3,stone));for(const [x,z] of [[4.5,4.5],[2.65,4.5],[4.5,2.65]])p.push(cylinder("让转角廊向庭院通透的内缘承顶柱",sx*x!,1.59,sz*z!,.22,2.82,stone));}return p;
},"建筑","异域")];
function backWall():ModelPart{const profile=[{x:-2.48,y:0},{x:-2.48,y:2.82}];for(let i=1;i<=12;i++){const a=Math.PI-i*Math.PI/12;profile.push({x:Math.cos(a)*2.48,y:2.82+Math.sin(a)*2.48});}profile.push({x:2.48,y:0});return part("伊万厅后方随券顶轮廓闭合的实墙","extrude",stone,[0,.18,2.75],[1,1,1],[0,0,0],{depth:.25,profile});}
