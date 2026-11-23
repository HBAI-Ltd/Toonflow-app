// Fixed loopback WebSocket reader. JSON lines are consumed by helper.py.
const client = process.argv[2];
let stopped = false;
const write = data => process.stdout.write(JSON.stringify(data) + '\n');
function connect() {
  if (stopped) return;
  const ws = new WebSocket('ws://127.0.0.1:8188/ws?clientId=' + encodeURIComponent(client));
  ws.onopen = () => write({type:'bridge_connected'});
  ws.onmessage = event => {
    if (typeof event.data !== 'string') return;
    try { const data = JSON.parse(event.data); write(data); } catch {}
  };
  ws.onerror = () => {};
  ws.onclose = () => { if (!stopped) setTimeout(connect, 2000); };
}
setTimeout(() => { stopped = true; process.exit(0); }, 90 * 60 * 1000).unref();
connect();
