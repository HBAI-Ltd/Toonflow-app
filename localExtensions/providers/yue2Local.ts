
async function toonEnsureLocal(service, fetcher, signal, helperToken: string) {
 if (!helperToken) throw new Error("请在供应商设置中填写本机启动助手令牌");
 const base='http://127.0.0.1:9890';
 const headers={'Content-Type':'application/json','X-Toonflow-Launcher':helperToken};
 try {
  const r=await fetcher(base+'/ensure/'+service,{method:'POST',headers,signal});
  if(!r.ok) throw new Error(await r.text());
  const deadline=Date.now()+270000;
  while(Date.now()<deadline) {
   if(signal?.aborted) throw new Error('已取消启动等待');
   const q=await fetcher(base+'/status/'+service,{headers,signal});
   if(!q.ok) throw new Error(await q.text());
   const state=await q.json();
   if(state.status==='ready') return;
   if(state.status==='failed') throw new Error(state.error||'启动失败');
   await new Promise(resolve=>setTimeout(resolve,1000));
  }
  throw new Error('启动等待超时，请查看 D:/stable/local-service-helper/logs');
 } catch(e) {throw new Error('本地服务启动助手：'+(e?.message||String(e))+'；若助手未运行，请双击 D:/stable/local-service-helper/start-helper.vbs');}
}
const rules = [{ type: "input", field: "helperToken", title: "本机启动助手令牌", value: "", props: { type: "password", showPassword: true } }] as const;

export default {
 id:'yue2Local', label:'YuE2 本地音乐', version:'1.2.0', rules,
 models:[{id:'yue2-instrumental',label:'YuE2 本地音乐',type:'audio',rules:[
 {type:'select',field:'mode',title:'生成模式',value:'instrumental',options:[{label:'纯音乐',value:'instrumental'},{label:'歌词演唱',value:'vocal'}]},
 {type:'input',field:'lyrics',title:'歌词（带段落标签）',value:'',props:{type:'textarea',rows:4}},
 {type:'inputNumber',field:'duration',title:'最长时长（秒）',value:30,props:{min:5,max:360,step:5}},
 {type:'select',field:'cot',title:'乐谱规划',value:'full',options:[{label:'旋律与和弦',value:'full'},{label:'旋律',value:'melody'},{label:'无乐谱',value:'off'}]},
 {type:'input',field:'abc',title:'ABC 乐谱（可选）',value:'',props:{type:'textarea',rows:4}},
 {type:'inputNumber',field:'seed',title:'音频种子（-1 随机）',value:-1,props:{min:-1,max:4294967295}},
 {type:'inputNumber',field:'lm_seed',title:'作曲种子（-1 随机）',value:-1,props:{min:-1,max:4294967295}},
 {type:'inputNumber',field:'steps',title:'合成步数',value:32,props:{min:1,max:100}},
 {type:'select',field:'solver',title:'求解器',value:'midpoint',options:[{label:'Midpoint',value:'midpoint'},{label:'AB2',value:'ab2'}]},
 {type:'inputNumber',field:'fade_in',title:'淡入（秒）',value:0,props:{min:0,max:30,step:0.5}},
 {type:'inputNumber',field:'fade_out',title:'淡出（秒）',value:0,props:{min:0,max:30,step:0.5}},
 {type:'select',field:'output_format',title:'输出格式',value:'wav32',options:[{label:'WAV 32位',value:'wav32'},{label:'FLAC 无损',value:'flac'},{label:'MP3',value:'mp3'}]},
 {type:'inputNumber',field:'mp3_bitrate',title:'MP3 码率（kbps）',value:192,props:{min:64,max:320,step:32}},
 {type:'inputNumber',field:'transpose',title:'乐谱移调（半音）',value:0,props:{min:-24,max:24}},
 {type:'select',field:'lyric_timing',title:'歌词跟随乐谱',value:'on',options:[{label:'开启',value:'on'},{label:'关闭',value:'off'}]},
 {type:'select',field:'abc_continue',title:'续写已有乐谱',value:'off',options:[{label:'关闭',value:'off'},{label:'开启',value:'on'}]},
 {type:'select',field:'vocals_only',title:'生成后提取人声',value:'off',options:[{label:'关闭',value:'off'},{label:'开启（需要分轨模型）',value:'on'}]},
 {type:'inputNumber',field:'lm_batch_size',title:'生成数量',value:1,props:{min:1,max:8}},
 {type:'inputNumber',field:'synth_batch_size',title:'合成批次大小',value:1,props:{min:1,max:8}},
 {type:'input',field:'advanced_json',title:'高级参数 JSON（可选）',value:'',props:{type:'textarea',rows:5,placeholder:'例如：{\"cfg_scale\": 3, \"abc_sampling\": {\"temperature\": 0.7}}'}}
]}],
 async generateAudio(request: AudioRequest): Promise<MediaAsset[]> { await toonEnsureLocal('yue',this.tool.fetch.bind(this.tool),this.signal,this.config.helperToken);
  const style=(request.prompt || request.text || '').trim(); if(!style) throw new Error('请输入音乐风格');
  const o=request.other || {}; const mode=o.mode || 'instrumental';
  const lyrics=String(o.lyrics || '').trim(); if(mode==='vocal' && !lyrics) throw new Error('歌词演唱模式需要填写歌词');
  const base='http://127.0.0.1:8791', signal=this.signal;
  const body:any={style,lyrics:mode==='instrumental'?'[instrumental]':lyrics,cot:o.cot||'full',duration_seconds:Number(o.duration||30),steps:Number(o.steps||32),solver:o.solver||'midpoint',fade_in:Number(o.fade_in||0),fade_out:Number(o.fade_out||0),output_format:o.output_format||'wav32',transpose:Number(o.transpose||0),lyric_timing:o.lyric_timing!=='off',abc_continue:o.abc_continue==='on',vocals_only:o.vocals_only==='on',lm_batch_size:Number(o.lm_batch_size||1),synth_batch_size:Number(o.synth_batch_size||1)};
  if(body.output_format==='mp3') body.mp3_bitrate=Number(o.mp3_bitrate||192);
  if(o.abc) body.abc=String(o.abc); if(Number(o.seed)>=0) body.seed=Number(o.seed); if(Number(o.lm_seed)>=0) body.lm_seed=Number(o.lm_seed);
  if(mode==='instrumental') body.adapters=[{id:'yue2-instrumental',scales:{ar:1}}];
  if(o.advanced_json && String(o.advanced_json).trim()) {
   let extra:any; try {extra=JSON.parse(String(o.advanced_json));} catch {throw new Error('高级参数 JSON 格式不正确');}
   if(!extra || Array.isArray(extra) || typeof extra!=='object') throw new Error('高级参数必须是 JSON 对象');
   const allowed=['cfg_scale','companion_scale','semantic_tokens','abc_sampling','semantic_sampling','harmony','title','cover_of','cover_prompt','adapters','playlist_id','lm_seed','seed','steps','solver','output_format','mp3_bitrate','lm_batch_size','synth_batch_size','transpose','lyric_timing','vocals_only','abc_continue'];
   for(const [key,value] of Object.entries(extra)) {if(!allowed.includes(key)) throw new Error('不支持的高级参数: '+key);body[key]=value;}
  }
  if(!['wav32','flac','mp3'].includes(body.output_format)) throw new Error('不支持的输出格式');
  const r=await this.tool.fetch(base+'/v1/music/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
  if(!r.ok) throw new Error('YuE2 提交失败: '+(await r.text()).slice(0,500)); const job=await r.json(); if(!job.id) throw new Error('YuE2 未返回任务编号');
  try {
   for(let i=0;i<900;i++) { if(signal?.aborted) throw new Error('已取消'); await new Promise(resolve=>setTimeout(resolve,2000)); const q=await this.tool.fetch(base+'/v1/music/jobs/'+encodeURIComponent(job.id),{signal}); if(!q.ok) throw new Error('YuE2 状态查询失败: '+q.status); const j=await q.json(); if(j.status==='failed'||j.status==='cancelled') throw new Error('YuE2: '+(j.message||j.status)); if(j.status==='completed'){const songs=(j.songs?.length ? j.songs : j.song ? [j.song] : []).filter((song:any)=>song?.audio_url);if(!songs.length) throw new Error('YuE2 未返回音频');const mimeType=body.output_format==='mp3'?'audio/mpeg':body.output_format==='flac'?'audio/flac':'audio/wav';return songs.map((song:any)=>({mediaType:'audio',type:'url',url:new URL(song.audio_url,base).toString(),mimeType}));}}
   throw new Error('等待 YuE2 超时');
  } catch(e) {if(signal?.aborted) {try {await this.tool.fetch(base+'/v1/music/jobs/'+encodeURIComponent(job.id),{method:'POST'});}catch{} } throw e;}
 }
} satisfies ProviderDefinition<typeof rules>;
