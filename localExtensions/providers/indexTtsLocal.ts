
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
 id:'indexTtsLocal',label:'IndexTTS 2.5 本地配音',version:'1.0.0',rules,
 models:[{id:'indexTts25',label:'IndexTTS 2.5 本地配音',type:'audio'}],
 async generateAudio(request: AudioRequest): Promise<MediaAsset[]> { await toonEnsureLocal('tts',this.tool.fetch.bind(this.tool),this.signal,this.config.helperToken);
  const text=(request.text || request.prompt || '').trim(); if (!text) throw new Error('请输入配音文本');
  const base='http://127.0.0.1:9882'; const signal=this.signal;
  const audio=request.audios?.[0]; let ref:string|undefined;
  if(audio){
   if(audio.type==='base64') ref=audio.data.replace(/^data:[^,]+,/, '');
   else if(audio.type==='binary') ref=Buffer.from(audio.data).toString('base64');
   else if(audio.type==='url') { const u=new URL(audio.url); if(!['127.0.0.1','localhost'].includes(u.hostname)) throw new Error('参考音频必须来自本机'); const r=await this.tool.fetch(audio.url,{signal}); if(!r.ok) throw new Error('无法读取参考音频'); ref=Buffer.from(await r.arrayBuffer()).toString('base64'); }
  }
  const language=(request.language || '').toLowerCase().startsWith('en')?'EN':'ZH';
  const r=await this.tool.fetch(base+'/jobs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language,reference_base64:ref}),signal});
  if(!r.ok) throw new Error('IndexTTS 提交失败: '+(await r.text())); const job=await r.json();
  for(let i=0;i<600;i++) {if(signal?.aborted) throw new Error('已停止等待，后台任务可能仍在运行'); await new Promise(resolve=>setTimeout(resolve,2000)); const q=await this.tool.fetch(base+'/jobs/'+encodeURIComponent(job.id),{signal}); if(!q.ok) throw new Error('IndexTTS 状态查询失败'); const j=await q.json(); if(j.status==='failed') throw new Error('IndexTTS: '+j.error); if(j.status==='completed') return [{mediaType:'audio',type:'url',url:base+'/audio/'+encodeURIComponent(job.id),mimeType:'audio/wav'}];}
  throw new Error('IndexTTS 等待超时');
 }
} satisfies ProviderDefinition<typeof rules>;
