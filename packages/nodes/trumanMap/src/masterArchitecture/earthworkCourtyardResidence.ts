import { box,cylinder,design,rail } from "./structures";
import { part,ring,beam,type ModelPart,type Triple } from "../assetModelParts";
import { halfRoundWall } from "./spatialShells";
const earth="#b7a17a",wood="#8e7553",tile="#646e68",stone="#9ea594";
type Vertex={x:number;y:number;z:number};
export const earthworkCourtyardResidenceDesigns=[design("内通廊圆形土楼","单入口厚土外环围住开敞中央院，四层径向房隔接上连续木环廊，外墙小窗为真实贯通洞，楼梯连接各层；只收一个完整土楼原型，不按开间、层数或屋瓦变化扩主",()=>circularTulou(),"建筑","中式")];
function meshPart(name:string,color:string,vertices:Vertex[],indices:number[]):ModelPart{return part(name,"mesh",color,[0,0,0],[1,1,1],[0,0,0],{vertices,indices});}
function appendPrism(vertices:Vertex[],indices:number[],corners:Vertex[]){for(const face of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[1,5,6,2],[2,6,7,3],[3,7,4,0]]){const n=vertices.length;vertices.push(...face.map(i=>corners[i]!));indices.push(n,n+1,n+2,n,n+2,n+3);}}
function wedge(vertices:Vertex[],indices:number[],inner:number,outer:number,start:number,end:number,bottom:number,top:number){const corners:Vertex[]=[];for(const y of [bottom,top])for(const [r,a] of [[inner,start],[outer,start],[outer,end],[inner,end]])corners.push({x:Math.cos(a!)*r!,y,z:Math.sin(a!)*r!});appendPrism(vertices,indices,corners);}
function rect(vertices:Vertex[],indices:number[],x:number,y:number,z:number,w:number,h:number,d:number){appendPrism(vertices,indices,[...[-1,1].flatMap(s=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sz])=>({x:x+sx!*w/2,y:y+s*h/2,z:z+sz!*d/2})))]);}
function windowWall(floor:number,batch:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[],y=.35+floor*3;for(let i=batch*4;i<(batch+1)*4;i++){const start=i*Math.PI/12,end=(i+1)*Math.PI/12,left=start+Math.PI/30,right=end-Math.PI/30;wedge(vertices,indices,12.8,14,start,left,y,y+3);wedge(vertices,indices,12.8,14,right,end,y,y+3);wedge(vertices,indices,12.8,14,left,right,y,y+1.05);wedge(vertices,indices,12.8,14,left,right,y+2,y+3);}return meshPart("土楼厚外墙的真实小窗框、上下槛与整实墙墩",earth,vertices,indices);}
function partitions(floor:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[],y=.35+floor*3;for(let i=0;i<12;i++){const a=(i+.5)*Math.PI/6;wedge(vertices,indices,8.35,12.8,a-.006,a+.006,y,y+2.82);}return meshPart("同一层由内廊伸到厚土墙的独立径向木房隔",wood,vertices,indices);}
function galleryPosts(level:number,batch:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[],floor=.35+level*3,gaps=level===3?[[154,166]]:[[154,166],[194,206]],angles=[...Array.from({length:24},(_,i)=>i*15).filter(a=>!gaps.some(v=>a>v[0]!&&a<v[1]!)),...gaps.flat()];for(const deg of angles.slice(batch*16,(batch+1)*16)){const a=deg*Math.PI/180;rect(vertices,indices,Math.cos(a)*7.58,floor+.48,Math.sin(a)*7.58,.065,.96,.065);}return meshPart("内环廊扶栏的竖木在上下梯口两侧真实收边",wood,vertices,indices);}
function galleryHandrail(level:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[],floor=.35+level*3,ranges=level===3?[[0,154],[166,360]]:[[0,154],[166,194],[206,360]];for(const [start,end] of ranges){const q=halfRoundWall("在上下梯口实际断开的内廊扶栏",7.64,.09,.08,[0,0,0],0,wood,(end!-start!)*Math.PI/180),a=start!*Math.PI/180,n=vertices.length;for(const v of q.vertices!)vertices.push({x:Math.cos(a)*v.x-Math.sin(a)*v.z,y:v.y+floor+.92,z:Math.sin(a)*v.x+Math.cos(a)*v.z});indices.push(...q.indices!.map(i=>i+n));}return meshPart("在连接楼梯平台处真实留通行口的内环廊扶栏",wood,vertices,indices);}
function stairTreads(level:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[],floor=.35+level*3;for(let i=0;i<18;i++)rect(vertices,indices,-6.3,floor+(i+1)/6-.03,-2.43+(i+.5)*.27,1.2,.06,.27);return meshPart("环院楼梯上十八块独立且有真实步高的木踏板",wood,vertices,indices);}
function circularTulou():ModelPart[]{
  const angle=Math.asin(1.4/14),yaw=-(270+angle*180/Math.PI),p:ModelPart[]=[
    cylinder("圆土楼外墙与中央院共用的落地石基",0,.175,0,28.6,.35,stone),
    halfRoundWall("地层只有一个真实通行门洞的厚土外墙",14,1.2,3,[0,.35,0],yaw,earth,Math.PI*2-2*angle),
    ring("外墙窗层上方连续承住屋架的厚土压顶圈",earth,14,1.2,12.675,.65),
    annularRoof(),ring("木柱顶端托住内廊屋檐的通长圆枋",wood,8.3,.25,12.8,.2),
    box("单入口上方承住上层外墙的厚木过梁",0,3.2,-13.35,2.85,.3,1.3,wood),
    ...[-1,1].map(s=>box("石基上独立收进门口的厚木门框",s*1.3,1.65,-13.35,.2,2.6,1.3,wood)),
    roofFrames(0),roofFrames(1),galleryColumns(0),galleryColumns(1),
  ];
  for(let level=1;level<=3;level++)p.push(...Array.from({length:6},(_,batch)=>windowWall(level,batch)),ring("跨房间与内环廊且在院心真正留空的楼板",wood,12.9,5.4,.35+level*3-.09,.18),galleryPosts(level,0),galleryPosts(level,1),galleryHandrail(level));
  for(let floor=0;floor<4;floor++)p.push(partitions(floor));
  for(let level=0;level<3;level++){
    const floor=.35+level*3;
    p.push(stairTreads(level),box("楼梯起点向外接回环廊的完整木平台",-6.65,floor-.06,-2.56,2,.12,.4,wood),box("楼梯高端向外接回上一层环廊的木平台",-6.65,floor+3-.06,2.56,2,.12,.4,wood));
    for(const s of [-1,1]){
      p.push(beam("两侧木梯梁实际托住全部独立踏板",wood,[-6.3+s*.56,floor-.03,-2.43],[-6.3+s*.56,floor+2.97,2.43],.12,.12),rail([-6.3+s*.61,floor+1,-2.43],[-6.3+s*.61,floor+4,2.43],.055,wood));
      for(const end of [-1,1])p.push(box("把斜梯扶手接到上下梯口的竖栏柱",-6.3+s*.61,floor+(end===-1?.5:3.5),end*2.43,.065,1,.065,wood));
    }
  }
  return p;
}

function roofFrames(batch:number):ModelPart{const vertices:Vertex[]=[],indices:number[]=[];for(let i=batch*6;i<(batch+1)*6;i++){const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);for(const [r0,y0,r1,y1] of [[8.3,12.8,11.2,14.05],[11.2,14.05,13.8,13]]){const dr=r1!-r0!,dy=y1!-y0!,length=Math.hypot(dr,dy),nr=dr/length,ny=dy/length,section=[[r0!-ny*.06,y0!+nr*.06],[r1!-ny*.06,y1!+nr*.06],[r1!+ny*.06,y1!-nr*.06],[r0!+ny*.06,y0!-nr*.06]],corners:Vertex[]=[];for(const side of [-1,1])for(const [r,y] of section)corners.push({x:c*r!-s*side*.08,y:y!,z:s*r!+c*side*.08});appendPrism(vertices,indices,corners);}}return meshPart("在内檐木柱与厚土墙间逐榀支起双坡瓦屋的实际木椽架",wood,vertices,indices);}

function annularRoof():ModelPart{
  const vertices:Vertex[]=[],indices:number[]=[],profile=[[14.8,12.7],[11.2,14.3],[7.5,12.7],[7.5,12.55],[11.2,14.1],[14.8,12.55]],segments=36;
  // 各坡面只沿圆周共享顶点，屋脊、檐口与内衬保留各自的硬边法线。
  for(let band=0;band<profile.length;band++){
    const n=vertices.length;
    for(const [radius,y] of [profile[band]!,profile[(band+1)%profile.length]!])for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;vertices.push({x:Math.cos(a)*radius!,y:y!,z:Math.sin(a)*radius!});}
    for(let i=0;i<segments;i++){const j=(i+1)%segments;indices.push(n+i,n+segments+i,n+j,n+j,n+segments+i,n+segments+j);}
  }
  return meshPart("围住开敞内院且屋脊清晰、内外檐闭合的环形双坡屋面",tile,vertices,indices);
}

function galleryColumns(batch:number):ModelPart{
  const vertices:Vertex[]=[],indices:number[]=[],segments=16;
  for(let column=batch*6;column<(batch+1)*6;column++){
    const angle=column*Math.PI/6,x=Math.cos(angle)*8.2,z=Math.sin(angle)*8.2,n=vertices.length;
    for(const y of [.35,12.75])for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;vertices.push({x:x+Math.cos(a)*.09,y,z:z+Math.sin(a)*.09});}
    for(let i=0;i<segments;i++){const j=(i+1)%segments;indices.push(n+i,n+segments+i,n+j,n+j,n+segments+i,n+segments+j);}
    for(const [side,y] of [[-1,.35],[1,12.75]]){
      const cap=vertices.length;vertices.push({x,y:y!,z});
      for(let i=0;i<segments;i++){const a=i*Math.PI*2/segments;vertices.push({x:x+Math.cos(a)*.09,y:y!,z:z+Math.sin(a)*.09});}
      for(let i=0;i<segments;i++){const a=cap+1+i,b=cap+1+(i+1)%segments;indices.push(cap,...(side===-1?[a,b]:[b,a]));}
    }
  }
  return meshPart("连续支住木楼板和内环屋檐的通高木柱",wood,vertices,indices);
}
