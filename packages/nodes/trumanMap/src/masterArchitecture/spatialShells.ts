import { part, type ModelPart, type Triple } from "../assetModelParts";
// 这些半圆围护与薄壳被礼堂、浴室和连房窑复用；目录加载时只保留函数。
export function barrelRoof(name:string,r:number,t:number,length:number,position:Triple,color:string):ModelPart{const profile=[];for(let i=0;i<=12;i++){const a=Math.PI-i*Math.PI/12;profile.push({x:Math.cos(a)*(r+t),y:Math.sin(a)*(r+t)});}for(let i=0;i<=12;i++){const a=i*Math.PI/12;profile.push({x:Math.cos(a)*r,y:Math.sin(a)*r});}return part(name,"extrude",color,position,[1,1,1],[0,0,0],{depth:length,profile});}
export function halfRoundWall(name:string,r:number,t:number,h:number,position:Triple,yaw:number,color:string,span=Math.PI):ModelPart{
  const n=Math.ceil(span/(Math.PI/12))+1,vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];
  // 圆壁只沿周向平滑；顶底与两端封口分顶点，避免端盖法线混入竖直墙面。
  for(const [r0,y0,r1,y1,reverse] of [[r,0,r,h,false],[r-t,0,r-t,h,true],[r,0,r-t,0,true],[r,h,r-t,h,false]] as const){
    const start=vertices.length;
    for(const [radius,y] of [[r0,y0],[r1,y1]])for(let i=0;i<n;i++){const a=i*span/(n-1);vertices.push({x:Math.cos(a)*radius!,y:y!,z:Math.sin(a)*radius!});}
    for(let i=0;i<n-1;i++){
      const a=start+i,b=start+n+i,c=start+i+1,d=start+n+i+1;
      indices.push(...(reverse?[a,c,b,c,d,b]:[a,b,c,c,b,d]));
    }
  }
  for(const [angle,corners] of [[0,[[r,0],[r-t,0],[r-t,h],[r,h]]],[span,[[r,0],[r,h],[r-t,h],[r-t,0]]]] as const){
    const start=vertices.length;
    for(const [radius,y] of corners)vertices.push({x:Math.cos(angle)*radius,y,z:Math.sin(angle)*radius});
    indices.push(start,start+1,start+2,start,start+2,start+3);
  }
  return part(name,"mesh",color,position,[1,1,1],[0,yaw,0],{vertices,indices});
}
export function halfRoundFloor(name:string,r:number,h:number,position:Triple,yaw:number,color:string):ModelPart{const n=14,vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const y of [0,h]){vertices.push({x:0,y,z:0});for(let i=0;i<=12;i++){const a=i*Math.PI/12;vertices.push({x:Math.cos(a)*r,y,z:Math.sin(a)*r});}}for(let i=1;i<n-1;i++)indices.push(0,i,i+1,n,n+i+1,n+i);for(let i=0;i<n;i++){const j=(i+1)%n;indices.push(i,n+i,j,j,n+i,n+j);}return part(name,"mesh",color,position,[1,1,1],[0,yaw,0],{vertices,indices});}
export function halfDomeRoof(name:string,r:number,t:number,position:Triple,yaw:number,color:string):ModelPart{const sectors=12,rows=5,stride=13,layer=rows*stride+1,vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const radius of [r,r-t]){for(let row=0;row<rows;row++){const phi=row*Math.PI/10;for(let col=0;col<=sectors;col++){const a=col*Math.PI/sectors;vertices.push({x:Math.cos(a)*radius*Math.cos(phi),y:radius*Math.sin(phi),z:Math.sin(a)*radius*Math.cos(phi)});}}vertices.push({x:0,y:radius,z:0});}for(let row=0;row<rows-1;row++)for(let col=0;col<sectors;col++){const a=row*stride+col,b=a+stride;indices.push(a,b,a+1,a+1,b,b+1,layer+a,layer+a+1,layer+b,layer+a+1,layer+b+1,layer+b);}const top=rows*stride;for(let col=0;col<sectors;col++){const a=(rows-1)*stride+col;indices.push(a,top,a+1,layer+a,layer+a+1,layer+top,col,col+1,layer+col,col+1,layer+col+1,layer+col);}for(const col of [0,sectors])for(let row=0;row<rows;row++){const a=row*stride+col,b=row===rows-1?top:a+stride,face=col===0?[a,layer+a,b,b,layer+a,layer+b]:[a,b,layer+a,b,layer+b,layer+a];indices.push(...face);}return part(name,"mesh",color,position,[1,1,1],[0,yaw,0],{vertices,indices});}
export function rectangularFlue(name:string,w:number,d:number,h:number,t:number,position:Triple,color:string):ModelPart{const vertices:{x:number;y:number;z:number}[]=[],indices:number[]=[];for(const [inset,y] of [[0,0],[0,h],[t,0],[t,h]])for(const [sx,sz] of [[-1,-1],[1,-1],[1,1],[-1,1]])vertices.push({x:sx!*(w/2-inset!),y:y!,z:sz!*(d/2-inset!)});for(let i=0;i<4;i++){const j=(i+1)%4;indices.push(i,i+4,j,j,i+4,j+4,8+i,8+j,12+i,8+j,12+j,12+i,i,j,8+i,j,8+j,8+i,i+4,i+12,j+4,j+4,i+12,j+12);}return part(name,"mesh",color,position,[1,1,1],[0,0,0],{vertices,indices});}
