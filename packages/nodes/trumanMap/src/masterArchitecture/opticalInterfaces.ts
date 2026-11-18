import { base, box, colors, cylinder, design, pipe, rail, glow } from "./structures";
import { part, ring, type ModelPart, type Triple } from "../assetModelParts";

const dark="#435c63";
const accent="#86cfc4";
const mirror="#c4d0cf";
function cyberOptic(name:string,purpose:string,build:()=>ModelPart[],itemType:"设施"|"构件"="构件"){return design(name,purpose,build,itemType,"赛博朋克");}

// 扫掠体积面区别于二维LED旋翼；开放电润湿寻址矩阵也区别于固定Y形通道与密封变焦液面。
export const opticalInterfaceDesigns = [
  cyberOptic("双振镜激光扫描头","两片镜由相互正交的独立小电机转轴控制，入射光先沿X进入、转向Z再向Y输出，完整双反射链为独立可装配扫描头",()=>[
    base(0.27,0.25,0.018),box("两套振镜共用的机加工承台",0,0.026,0.04,0.23,0.035,0.18,dark),
    cylinder("第一镜垂直轴振镜电机",0,0.075,0,0.055,0.08,dark),
    pipe("第一镜的竖向转动短轴",[0,0.1,0],[0,0.13,0],0.009),
    disk("将X入光转向Z的第一镜",[0,0.13,0],[1,0,-1],0.055),
    cylinder("第二镜水平轴振镜电机",0.08,0.13,0.08,0.05,0.085,dark,[0,0,90]),
    pipe("第二镜沿X方向的水平转轴",[0.06,0.13,0.08],[0,0.13,0.08],0.009),
    disk("将Z来光转向Y的第二镜",[0,0.13,0.08],[0,-1,1],0.055),
    box("第二镜电机独立支撑块",0.08,0.076,0.08,0.06,0.1,0.07,dark),
    ...[[[-0.13,0.13,0],[0,0.13,0]],[[0,0.13,0],[0,0.13,0.08]],[[0,0.13,0.08],[0,0.23,0.08]]].map(v=>lightPath(v[0] as Triple,v[1] as Triple)),
    ...[-1,1].map(s=>box("独立振镜驱动接线端",s*0.095,0.055,-0.07,0.035,0.04,0.055,"#bbc7b4")),
  ]),
  cyberOptic("三面角锥回光器","三个相互正交的反射面围成开口角锥，把入射光沿反向送回；三面后背由三角边框连接，主体是独立回光器而非整根测绘杆",()=>[
    triangularFace("面向正Z的三角反射面",[0,0,-0.0015],[0,0,0],[[0,0],[0.12,0],[0,0.12]]),
    triangularFace("面向正X的三角反射面",[-0.0015,0,0],[0,90,0],[[0,0],[-0.12,0],[0,0.12]]),
    triangularFace("面向正Y的三角反射面",[0,-0.0015,0],[-90,0,0],[[0,0],[0.12,0],[0,-0.12]]),
    ...[[[0.12,0,0],[0,0.12,0]],[[0,0.12,0],[0,0,0.12]],[[0,0,0.12],[0.12,0,0]]].map(v=>rail(v[0] as Triple,v[1] as Triple,0.009,dark)),
    ...[[0.12,0,0],[0,0.12,0],[0,0,0.12]].map(([x,y,z])=>part("三边框连接的独立锁固耳","sphere",dark,[x!,y!,z!],[0.018,0.018,0.018])),
    box("背部对位安装方座",-0.015,-0.015,-0.015,0.04,0.04,0.04,dark),
  ]),
  cyberOptic("磁光法拉第隔离器","轴向磁场中的磁光晶体产生非互易偏振旋转，前后不同取向的偏振器组成单向隔离链；没有旋光样液测角或机械扫描镜",()=>[
    base(0.17,0.34,0.015),
    ...[-1,1].flatMap(s=>[box("前后光学环座落地支脚",0,0.04,s*0.13,0.065,0.05,0.035,dark),opticRing("偏振片独立支承环",0.043,0.008,s*0.13,0.02,dark)]),
    ...[-1,1].map(s=>part("前后透射偏振片","cylinder",colors.glass,[0,0.08,s*0.13],[0.069,0.003,0.069],[90,0,0],{opacity:0.25})),
    box("入射偏振方向的标示短线",0,0.08,-0.143,0.003,0.055,0.002,accent),
    part("输出偏振45度方向的标示短线","box",accent,[0,0.08,0.143],[0.003,0.055,0.002],[0,0,45]),
    opticRing("轴向永久磁体的中空磁环",0.05,0.024,0,0.13,dark),
    part("位于轴场内的透明磁光晶体棒","cylinder","#c3bdcf",[0,0.08,0],[0.019,0.09,0.019],[90,0,0],{opacity:0.45}),
    ...[-1,1].map(s=>opticRing("磁体两端的通光限位压圈",0.034,0.023,s*0.055,0.015,mirror)),
    box("中央磁光组件的安装托台",0,0.03,0,0.09,0.03,0.12,dark),
  ]),
  cyberOptic("旋转扫描体积显示台","竖直漫射面绕自身中轴扫过圆柱体积，下方独立投影头经折镜同步投影；模型展示实际转屏和投影结构，不以二维LED旋翼面代替体积面",()=>[
    cylinder("体积显示机的稳定落地圆座",0,0.09,0,1.6,0.18,dark),
    cylinder("驱动竖直漫射屏的转轴电机",0,0.24,0,0.2,0.18,dark),
    pipe("贯穿漫射面中央的旋转轴",[0,0.28,0],[0,1.43,0],0.028),
    part("扫掠圆柱体积的竖直漫射转屏","box","#c6d5d0",[0,0.8,0],[1.06,0.95,0.012],[0,20,0],{opacity:0.34}),
    ...[-1,1].map(s=>part("漫射屏上下两条刚性边框","box",dark,[0,0.8+s*0.47,0],[1.08,0.025,0.025],[0,20,0])),
    part("围住运动面的透明安全圆筒","lathe",colors.glass,[0,0.84,0],[1,1,1],[0,0,0],{profile:[{x:0.69,y:-0.64},{x:0.7,y:-0.64},{x:0.7,y:0.64},{x:0.69,y:0.64},{x:0.69,y:-0.64}],opacity:0.18}),
    part("上方安全圆筒的透明顶盖","cylinder",colors.glass,[0,1.48,0],[1.4,0.025,1.4],[0,0,0],{opacity:0.2}),
    cylinder("转屏上端轴承的固定小座",0,1.405,0,0.1,0.06,dark),
    pipe("上轴承与安全顶盖的短承接杆",[0,1.42,0],[0,1.48,0],0.035),
    box("底座外侧的同步投影机头",0,0.23,0.52,0.24,0.16,0.18,dark),pipe("投影机前方的倾斜镜头筒",[0,0.22,0.46],[0,0.25,0.37],0.1),{...cylinder("投影镜头的透明出光透镜",0,0.25,0.37,0.09,0.005,colors.glass,[-71.565,0,0]),opacity:0.35,roughness:0.1},
    disk("把下方投影光折向转屏的反射镜",[0,0.29,0.25],[0,-0.582,-0.509],0.16),
    pipe("投影折镜独立安装短杆",[0,0.18,0.25],[0,0.28,0.25],0.025),
    ...[-1,1].map(s=>glow("底座状态弧边的局部指示灯",s*0.42,0.16,-0.57,0.3,0.025,0.035,accent)),
    displayRing(),
  ],"设施"),
  cyberOptic("电润湿液滴选路芯","平面独立寻址电极在介电层下依次改变局部润湿性，离散液滴可跨格转移和分流；上盖形成开放阵列腔，不依靠固定Y管或密封双液体镜头",()=>[
    box("液滴路由芯片的稳定底板",0,0.001,0,0.075,0.002,0.055,dark),
    ...Array.from({length:12},(_,i)=>box("可单独寻址的电润湿电极",(i%4-1.5)*0.012,0.0025,(Math.floor(i/4)-1)*0.012,0.01,0.001,0.01,"#aa9270")),
    part("覆盖电极但保留可见格界的介电薄层","box",colors.glass,[0,0.0035,0],[0.052,0.001,0.04],[0,0,0],{opacity:0.25}),
    ...[[0.006,0],[0.018,0.012],[-0.018,-0.012]].map(([x,z])=>part("可独立转移的液滴","sphere",accent,[x!,0.0055,z!],[0.007,0.003,0.007],[0,0,0],{opacity:0.7})),
    ...[-1,1].map(s=>box("保持盖片间隙的周边薄垫",s*0.028,0.00575,0,0.003,0.0035,0.045,dark)),
    part("上方连续公共电极玻璃盖片","box",colors.glass,[0,0.008,0],[0.059,0.001,0.045],[0,0,0],{opacity:0.28}),
    ...Array.from({length:12},(_,i)=>box("各寻址电极的独立引出焊盘",-0.0275+i*0.005,0.0025,-0.025,0.003,0.001,0.006,"#aa9270")),
    box("背面接到寻址驱动的插接端",0,0.0045,0.025,0.04,0.007,0.008,dark),
  ]),
];
function disk(name:string,center:Triple,normal:Triple,size:number):ModelPart{const axis=pipe(name,center,[center[0]+normal[0],center[1]+normal[1],center[2]+normal[2]],0.003);return {...cylinder(name,...center,size,0.003,mirror),rotation:axis.rotation,metalness:0.94,roughness:0.09};}
function lightPath(a:Triple,b:Triple):ModelPart{return {...pipe("扫描头内部的低亮光路示意",a,b,0.0015),color:accent,emissive:accent,emissiveIntensity:0.25};}
function triangularFace(name:string,position:Triple,rotation:Triple,points:number[][]):ModelPart{return part(name,"extrude",mirror,position,[1,1,1],rotation,{depth:0.003,profile:points.map(([x,y])=>({x:x!,y:y!})),metalness:0.94,roughness:0.09});}
function opticRing(name:string,r:number,t:number,z:number,depth:number,color:string):ModelPart{const p=ring(name,color,r,t,0,depth);p.position={x:0,y:0.08,z};p.rotation.x=90;return p;}
function displayRing():ModelPart {const p=ring("转屏当前画面的一圈发光投影标记",accent,0.27,0.008,0,0.004,{emissive:accent,emissiveIntensity:0.5});p.position={x:Math.sin(20*Math.PI/180)*0.01,y:0.82,z:Math.cos(20*Math.PI/180)*0.01};p.rotation={x:90,y:0,z:-20};return p;}
