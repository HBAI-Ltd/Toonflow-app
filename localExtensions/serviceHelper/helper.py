"""Fixed-command local service launcher for Toonflow."""
import json, threading, time, subprocess, urllib.request, logging, psutil, ctypes
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent
CONFIG=json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
(ROOT/'logs').mkdir(exist_ok=True)
logging.basicConfig(filename=ROOT/'logs/helper.log',level=logging.INFO,format='%(asctime)s %(message)s')
try:PROGRESS=json.loads((ROOT/'progress-state.json').read_text(encoding='utf-8'))
except (OSError,ValueError):PROGRESS={}
TRACKS={}
READERS={}
SERVICES=CONFIG['services']; STATES={}; LOCK=threading.RLock()
OPENER=urllib.request.build_opener(urllib.request.ProxyHandler({}))

OWNED_FILE=ROOT/'owned-services.json'
try:OWNED=json.loads(OWNED_FILE.read_text(encoding='utf-8'))
except (OSError,ValueError):OWNED={}
def remember_owned(name,pid):
 process=psutil.Process(pid)
 with LOCK:
  OWNED[name]={'pid':pid,'created':process.create_time(),'exe':process.exe()}
  OWNED_FILE.write_text(json.dumps(OWNED,indent=2),encoding='utf-8')
def toonflow_open():
 found=[];user32=ctypes.windll.user32
 callback_type=ctypes.WINFUNCTYPE(ctypes.c_bool,ctypes.c_void_p,ctypes.c_void_p)
 def visit(hwnd,_):
  if not user32.IsWindowVisible(hwnd):return True
  buf=ctypes.create_unicode_buffer(512);user32.GetWindowTextW(hwnd,buf,512)
  if buf.value!='Toonflow':return True
  pid=ctypes.c_ulong();user32.GetWindowThreadProcessId(hwnd,ctypes.byref(pid))
  try:
   if Path(psutil.Process(pid.value).exe())==Path('D:/stable/app/bin/bun.exe'):found.append(pid.value)
  except psutil.Error:pass
  return True
 user32.EnumWindows(callback_type(visit),0)
 return bool(found)
def comfy_idle():
 try:
  with OPENER.open('http://127.0.0.1:8188/queue',timeout=3) as response:data=json.load(response)
  return data.get('queue_running')==[] and data.get('queue_pending')==[]
 except Exception:return False

def recover_finished_tasks():
 """Persist completed local results before stopping ComfyUI after the UI exits."""
 try:saved=json.loads((ROOT/'tracked-tasks.json').read_text(encoding='utf-8'))
 except (OSError,ValueError):return
 for key,meta in saved.items():
  try:
   if not all(c in '0123456789abcdef-' for c in key.lower()):continue
   matches=list(Path('D:/stable/data/mediaTasks').glob('*/task'+key.replace('-','')+'.json'))
   if len(matches)!=1:continue
   task_file=matches[0];record=json.loads(task_file.read_text(encoding='utf-8'))
   if record.get('state') not in ('running','interrupted','submitting'):continue
   if record.get('request',{}).get('providerId')!='comfyLocal':continue
   with OPENER.open('http://127.0.0.1:8188/history/'+meta['prompt_id'],timeout=5) as response:history=json.load(response).get(meta['prompt_id'],{})
   if history.get('status',{}).get('status_str')!='success':continue
   files=[item for output in history.get('outputs',{}).values() for field in ('videos','gifs','images') for item in output.get(field,[]) if str(item.get('filename','')).lower().endswith(('.mp4','.webm','.mov'))]
   if not files:continue
   project=Path(record['cwd']).resolve();canvas=(project/record['canvasPath']).resolve()
   if not canvas.is_relative_to(project):continue
   node_id=record['nodeId']
   if not all(c in '0123456789abcdef-' for c in node_id.lower()):continue
   file=files[0];relative='assets/'+node_id+'/video-'+key+Path(file['filename']).suffix
   target=project/relative;target.parent.mkdir(parents=True,exist_ok=True)
   from urllib.parse import urlencode
   with OPENER.open('http://127.0.0.1:8188/view?'+urlencode({k:file.get(k,'') for k in ('filename','subfolder','type')}),timeout=30) as response:target.write_bytes(response.read())
   result={'path':relative,'mimeType':'video/mp4','mediaType':'video'}
   record.update(state='succeeded',result={'code':200,'data':[result],'message':'成功'})
   task_file.write_text(json.dumps(record,ensure_ascii=False,indent=2),encoding='utf-8')
   if toonflow_open():continue
   data=json.loads(canvas.read_text(encoding='utf-8'))
   for node in data.get('nodes',[]):
    task=node.get('data',{}).get('mediaTask',{})
    if node.get('id')==node_id and task.get('taskId')==key:
     node['data'].setdefault('outputs',{})['video']={'dataType':'VIDEO','value':{'url':relative,'mimeType':'video/mp4'}}
     task.update(state='succeeded',resumable=False,applied=True)
   canvas.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
   logging.info('Recovered completed task %s before idle shutdown',key)
  except Exception:logging.exception('Failed recovering completed task %s',key);raise

def shutdown_watch():
 absent_since=None;idle_count=0
 while True:
  time.sleep(10)
  try:
   if toonflow_open():absent_since=None;idle_count=0;continue
   absent_since=absent_since or time.monotonic()
   if time.monotonic()-absent_since<30:continue
   with LOCK:
    info=OWNED.get('comfy')
    if not info:continue
    process=psutil.Process(info['pid'])
    if abs(process.create_time()-info['created'])>.01 or process.exe()!=info['exe']:continue
    if not comfy_idle():idle_count=0;continue
    idle_count+=1
    if idle_count<2:continue
    # Recheck immediately before stopping the helper-owned idle process tree.
    if toonflow_open() or not comfy_idle():idle_count=0;continue
    recover_finished_tasks()
    children=process.children(recursive=True)
    logging.info('Toonflow closed and ComfyUI queue drained; stopping owned PID %s',process.pid)
    for child in reversed(children):
     try:child.terminate()
     except psutil.NoSuchProcess:pass
    try:process.terminate()
    except psutil.NoSuchProcess:pass
    OWNED.pop('comfy',None);OWNED_FILE.write_text(json.dumps(OWNED),encoding='utf-8');STATES.pop('comfy',None);idle_count=0
  except psutil.NoSuchProcess:
   with LOCK:OWNED.pop('comfy',None);OWNED_FILE.write_text(json.dumps(OWNED),encoding='utf-8')
  except Exception:logging.exception('Idle shutdown watcher')

def healthy(name):
 try:
  with OPENER.open(SERVICES[name]['url'],timeout=2) as r:
   data=json.load(r)
   if name=='comfy':return r.status==200 and 'system' in data
   return r.status==200 and (data.get('ok') is True or data.get('status')=='ok')
 except Exception:return False
def launch(name):
 spec=SERVICES[name]
 try:
  logging.info('Starting %s',name)
  si=subprocess.STARTUPINFO();si.dwFlags|=subprocess.STARTF_USESHOWWINDOW;si.wShowWindow=0
  with open(ROOT/'logs'/f'{name}.log','ab',buffering=0) as log:
   child=subprocess.Popen(spec['command'],cwd=spec['cwd'],stdin=subprocess.DEVNULL,stdout=log,stderr=log,creationflags=subprocess.CREATE_NO_WINDOW,startupinfo=si)
  remember_owned(name,child.pid)
  with LOCK:STATES[name]['pid']=child.pid
  deadline=time.monotonic()+spec['timeout']
  while time.monotonic()<deadline:
   if healthy(name):
    with LOCK:STATES[name].update(status='ready',error=None)
    logging.info('%s ready',name);return
   if child.poll() not in (None,0):raise RuntimeError(f'Process exited ({child.returncode}); see {ROOT}/logs/{name}.log')
   time.sleep(1)
  raise RuntimeError(f'Startup timed out; see {ROOT}/logs/{name}.log')
 except Exception as e:
  logging.exception('Failed %s',name)
  with LOCK:STATES[name].update(status='failed',error=str(e))
def ensure(name):
 with LOCK:
  if STATES.get(name,{}).get('status')=='starting':return dict(STATES[name])
  if healthy(name):
   STATES[name]={'status':'ready','reused':True};return dict(STATES[name])
  STATES[name]={'status':'starting','reused':False}
  threading.Thread(target=launch,args=(name,),daemon=True).start()
  return dict(STATES[name])

def track(key, data):
 if not isinstance(data.get('prompt_id'),str) or not isinstance(data.get('client_id'),str):raise ValueError('Missing prompt/client ID')
 with LOCK:
  old=TRACKS.get(key)
  if old and (old['prompt_id']!=data['prompt_id'] or old['client_id']!=data['client_id']):raise ValueError('Task already bound to another prompt')
  TRACKS[key]=data
  (ROOT/'tracked-tasks.json').write_text(json.dumps(TRACKS),encoding='utf-8')
  if key in READERS and READERS[key].poll() is None:return
  PROGRESS.pop(key,None)
  child=subprocess.Popen([r'C:\Program Files\nodejs\node.exe',str(ROOT/'comfyProgress.cjs'),data['client_id']],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL,text=True,encoding='utf-8',creationflags=subprocess.CREATE_NO_WINDOW)
  READERS[key]=child
 def consume():
  try:
   for line in child.stdout:
    event=json.loads(line);payload=event.get('data',{});kind=event.get('type')
    if kind=='bridge_connected':
     with LOCK:PROGRESS.setdefault(key,{}).update(connected=True,prompt_id=data['prompt_id'])
     continue
    if payload.get('prompt_id')!=data['prompt_id']:continue
    if kind=='progress':
     value=payload.get('value');maximum=payload.get('max')
     if not isinstance(value,(int,float)) or not isinstance(maximum,(int,float)) or not 0<=value<=maximum or maximum<=0:continue
     with LOCK:PROGRESS[key]={'value':value,'max':maximum,'node':payload.get('node'),'prompt_id':data['prompt_id'],'updatedAt':time.time(),'connected':True,'stage':'sampling'}
    elif kind=='executing':
     with LOCK:
      current=PROGRESS.get(key,{})
      if current.get('node')!=payload.get('node'):PROGRESS[key]={'prompt_id':data['prompt_id'],'node':payload.get('node'),'connected':True,'stage':'processing'}
    elif kind in ('execution_success','execution_error','execution_interrupted'):
     with LOCK:PROGRESS[key]={'prompt_id':data['prompt_id'],'stage':kind,'connected':True,**({'value':1,'max':1} if kind=='execution_success' else {})}
     child.terminate()
     if kind=='execution_success':
      def recover():
       time.sleep(3)
       try:recover_finished_tasks()
       except Exception:logging.exception('Completion recovery')
      threading.Thread(target=recover,daemon=True).start()
     break
  except Exception:logging.exception('Progress reader %s',key)
  finally:
   with LOCK:(ROOT/'progress-state.json').write_text(json.dumps(PROGRESS),encoding='utf-8')
   if child.poll() is None:child.terminate()
 threading.Thread(target=consume,daemon=True).start()

class Handler(BaseHTTPRequestHandler):
 def origin_ok(self):
  origin=self.headers.get('Origin')
  if not origin:return True
  try:
   u=urlparse(origin);return u.scheme=='http' and u.hostname in ('127.0.0.1','localhost') and bool(u.port)
  except ValueError:return False
 def allowed(self,auth=True):
  return self.headers.get('Host') in (f'127.0.0.1:{CONFIG["port"]}',f'localhost:{CONFIG["port"]}') and self.origin_ok() and (not auth or self.headers.get('X-Toonflow-Launcher')==CONFIG['token'])
 def respond(self,code,data):
  body=json.dumps(data,ensure_ascii=False).encode()
  self.send_response(code)
  if self.origin_ok() and self.headers.get('Origin'):
   self.send_header('Access-Control-Allow-Origin',self.headers['Origin']);self.send_header('Vary','Origin')
  self.send_header('Access-Control-Allow-Headers','Content-Type,X-Toonflow-Launcher')
  self.send_header('Access-Control-Allow-Methods','GET,POST,OPTIONS')
  self.send_header('Content-Type','application/json; charset=utf-8');self.send_header('Content-Length',str(len(body)));self.end_headers();self.wfile.write(body)
 def do_OPTIONS(self):self.respond(204 if self.allowed(False) else 403,{})
 def do_GET(self):
  if not self.allowed():return self.respond(403,{'error':'Forbidden'})
  parts=urlparse(self.path).path.strip('/').split('/')
  if len(parts)==2 and parts[0]=='node-progress':
   with LOCK:
    from urllib.parse import parse_qs
    expected=parse_qs(urlparse(self.path).query).get('task_id',[None])[0]
    keys=[key for key,item in TRACKS.items() if item.get('node_id')==parts[1] and (not expected or key==expected)]
    data=dict(PROGRESS.get(keys[-1],{})) if keys else {}
   if keys:
    key=keys[-1];data['task_id']=key
    matches=list(Path('D:/stable/data/mediaTasks').glob('*/task'+key.replace('-','')+'.json'))
    if len(matches)==1:
     record=json.loads(matches[0].read_text(encoding='utf-8'))
     if record.get('state')=='succeeded' and record.get('result',{}).get('code')==200:
      files=record['result'].get('data',[])
      if files and files[0].get('mediaType')=='video' and (Path(record['cwd'])/files[0]['path']).is_file():
       data['result']={'url':files[0]['path'],'mimeType':files[0]['mimeType']}
     elif record.get('state') in ('cancelled','failed'):data={'task_id':key,'stage':record['state']}
   return self.respond(200,data)
  if len(parts)==2 and parts[0]=='progress':
   with LOCK:data=dict(PROGRESS.get(parts[1],{}))
   return self.respond(200,data)
  if parts==['health']:return self.respond(200,{'ok':True})
  if len(parts)==2 and parts[0]=='status' and parts[1] in SERVICES:
   with LOCK:state=dict(STATES.get(parts[1],{'status':'idle'}))
   return self.respond(200,state)
  self.respond(404,{'error':'Not found'})
 def do_POST(self):
  if not self.allowed():return self.respond(403,{'error':'Forbidden'})
  parts=urlparse(self.path).path.strip('/').split('/')
  if len(parts)==2 and parts[0]=='cancel-node':
   try:
    with LOCK:tasks=[(key,data) for key,data in TRACKS.items() if data.get('node_id')==parts[1]]
    results=[]
    for key,data in tasks:
     request=urllib.request.Request('http://127.0.0.1:8188/api/jobs/'+data['prompt_id']+'/cancel',method='POST',data=b'{}',headers={'Content-Type':'application/json'})
     with OPENER.open(request,timeout=5) as response:result=json.load(response)
     results.append(result)
     if result.get('cancelled'):
      with LOCK:PROGRESS[key]={'stage':'execution_interrupted','prompt_id':data['prompt_id']}
    return self.respond(200,{'ok':True,'results':results})
   except Exception as error:return self.respond(502,{'error':str(error)})
  if len(parts)==2 and parts[0]=='track':
   try:
    size=int(self.headers.get('Content-Length','0'))
    if not 0<size<2048:raise ValueError('Invalid request length')
    track(parts[1],json.loads(self.rfile.read(size)))
    return self.respond(200,{'ok':True})
   except Exception as e:return self.respond(400,{'error':str(e)})
  if len(parts)==2 and parts[0]=='progress':
   try:
    size=int(self.headers.get('Content-Length','0'))
    if not 0<size<2048:raise ValueError('Invalid length')
    data=json.loads(self.rfile.read(size))
    if not isinstance(data.get('max'),(int,float)) or not isinstance(data.get('value'),(int,float)) or not 0<=data['value']<=data['max'] or data['max']<=0:raise ValueError('Invalid progress')
    with LOCK:
     if len(PROGRESS)>1000:PROGRESS.clear()
     PROGRESS[parts[1]]=data
    return self.respond(200,{'ok':True})
   except Exception:return self.respond(400,{'error':'Invalid progress'})
  if len(parts)==2 and parts[0]=='ensure' and parts[1] in SERVICES:return self.respond(200,ensure(parts[1]))
  self.respond(404,{'error':'Unknown service'})
 def log_message(self,*args):pass
if __name__=='__main__':
 try:server=ThreadingHTTPServer(('127.0.0.1',CONFIG['port']),Handler)
 except OSError:
  logging.info('Helper port already bound; exiting');raise SystemExit(0)
 try:
  saved=json.loads((ROOT/'tracked-tasks.json').read_text(encoding='utf-8'))
  TRACKS.update(saved)
  with OPENER.open('http://127.0.0.1:8188/queue',timeout=3) as response:queue=json.load(response)
  active={job[1] for job in queue.get('queue_running',[])+queue.get('queue_pending',[])}
  for key,data in saved.items():
   if data.get('prompt_id') in active:track(key,data)
 except Exception:logging.info('No active progress tracks restored')
 threading.Thread(target=shutdown_watch,daemon=True).start()
 logging.info('Helper listening on %s',CONFIG['port']);server.serve_forever()
