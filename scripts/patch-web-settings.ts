import fs from "fs";

/**
 * Thêm ô chọn **ngôn ngữ prompt** vào màn Settings → Language của bundle Vue đã
 * build sẵn `data/web/index.html` (27MB, một dòng, minified — không có mã nguồn
 * để sửa).
 *
 * Cùng quy ước với scripts/patch-web-i18n.ts và scripts/patch-web-ui.ts:
 *   - neo trên cú pháp/văn bản ổn định, KHÔNG neo trên định danh rút gọn
 *     (Tpe/EF/q_r…) hay class do build sinh (data-v-6430745e) — đổi mỗi lần build;
 *   - thiếu neo thì báo lỗi to và không đụng một byte nào của file;
 *   - idempotent: chạy lần hai không đổi gì.
 *
 * Vì sao là một widget vanilla-JS chèn vào cuối `<body>` thay vì vá render
 * function: component `languageConfig` trong bundle là render function đã compile
 * (`de("div",X_r,[…])`) với static props object hoisted — chèn thêm một nhánh
 * vnode vào đó đồng nghĩa với việc viết lại code đã minify, cực kỳ dễ vỡ. Một
 * script độc lập bám vào DOM đã render vừa dễ đọc vừa dễ gỡ (xoá thẻ script là
 * xong), đổi lại là phải tự dựng DOM và tự lo idempotence phía runtime.
 *
 * Backend đã có sẵn (đọc src/routes/setting/language/*.ts trước khi viết client):
 *   GET  /api/setting/language/getPromptLanguage        -> { code, data: "en"|"vi"|"zh", message }
 *   POST /api/setting/language/setPromptLanguage {language} -> { code, data, message }
 * Lưu ý: getPromptLanguage là **GET** (`router.get("/")`), không phải POST.
 */

/** id của khối DOM widget chèn vào trang — cố định để widget idempotent trong DOM. */
export const BLOCK_ID = "toonflow-prompt-language";
/** id của chính thẻ <script> chèn vào bundle — cố định để script idempotent trong file. */
export const SCRIPT_ID = "toonflow-prompt-language-patch";

// ---------------------------------------------------------------------------
// Neo 1 — danh sách locale giao diện
// ---------------------------------------------------------------------------
// Mảng object literal `[{label:"简体中文",tips:"Chinese (Simplified)",value:"zh-CN"},…]`
// vừa là nguồn dữ liệu của danh sách ngôn ngữ giao diện, vừa là thứ sinh ra ba
// nhãn mà widget dùng làm NEO DOM lúc chạy. Kiểm ở đây để nếu upstream đổi nhãn
// (hoặc bỏ tiếng Việt) thì hỏng ngay lúc vá — chứ không phải hỏng âm thầm trong
// trình duyệt của người dùng khi widget không tìm thấy chỗ để chèn.
//
// i18n-ignore — nhãn locale do chính bundle render ra, dùng làm neo DOM; không phải chuỗi UI của repo này
const ANCHOR_LABELS = ["简体中文", "English", "Tiếng Việt"];

// Neo trên hình dạng `label:"…",tips:"…",value:"…"` — bộ ba khoá này là dữ liệu
// của tác giả bundle, không phải tên rút gọn của trình build.
const LOCALE_ENTRY_RE = /\{label:"[^"]*",tips:"[^"]*",value:"[a-zA-Z-]+"\}/g;

// ---------------------------------------------------------------------------
// Neo 2 — trang Settings → Language
// ---------------------------------------------------------------------------
// Khoá i18n `settings.language.desc` ("Select the interface display language")
// nằm trong render function của component languageConfig. Khoá i18n ổn định hơn
// hẳn tên biến minify: nó là hợp đồng giữa component và từ điển của bundle.
const LANGUAGE_PAGE_ANCHOR = "settings.language.desc";

// ---------------------------------------------------------------------------
// Neo 3 — đuôi tài liệu
// ---------------------------------------------------------------------------
// Trong bundle có 4 chuỗi `</body>` (ba cái nằm trong JS/CSS đã minify). Chỉ cái
// CUỐI CÙNG mới là thẻ đóng thật của tài liệu, và ta đòi phần còn lại sau nó chỉ
// được là `</html>` + khoảng trắng — nếu không đúng, cấu trúc file đã đổi.
const DOC_TAIL_RE = /^<\/body>\s*<\/html>\s*$/;

// ---------------------------------------------------------------------------
// Chuỗi hiển thị của riêng widget
// ---------------------------------------------------------------------------
// Widget tự mang bảng chữ en/vi/zh: nó chạy ngoài Vue nên không với tới `$t()`
// của bundle, và từ điển bundle cũng không có khoá nào cho tính năng này.
type WidgetStrings = { title: string; desc: string; saving: string; saved: string; loadFailed: string; saveFailed: string; badValue: string };

const STRINGS: Record<"en" | "vi" | "zh", WidgetStrings> = {
  en: {
    title: "Prompt language",
    desc: "Language of the prompts sent to the model. Separate from the interface language above; defaults to English.",
    saving: "Saving…",
    saved: "Saved.",
    loadFailed: "Could not load the current prompt language",
    saveFailed: "Could not save the prompt language",
    badValue: "Server returned an unexpected value",
  },
  vi: {
    title: "Ngôn ngữ prompt",
    desc: "Ngôn ngữ của prompt gửi cho model. Tách biệt với ngôn ngữ giao diện ở trên; mặc định là tiếng Anh.",
    saving: "Đang lưu…",
    saved: "Đã lưu.",
    loadFailed: "Không đọc được ngôn ngữ prompt hiện tại",
    saveFailed: "Không lưu được ngôn ngữ prompt",
    badValue: "Máy chủ trả về giá trị lạ",
  },
  zh: {
    // i18n-ignore — bảng chữ tiếng Trung của chính widget (người dùng locale zh đọc), không phải chuỗi cần dịch của repo
    title: "提示词语言",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    desc: "发送给模型的提示词所用的语言，与上方界面语言互相独立；默认为英语。",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    saving: "保存中…",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    saved: "已保存。",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    loadFailed: "无法读取当前提示词语言",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    saveFailed: "无法保存提示词语言",
    // i18n-ignore — bảng chữ tiếng Trung của chính widget
    badValue: "服务器返回了意外的值",
  },
};

/** Ba giá trị hợp lệ của prompt_language — khớp LOCALES trong src/i18n/types.ts. */
const OPTIONS: { value: string; label: string; tips: string }[] = [
  { value: "en", label: "English", tips: "English" },
  { value: "vi", label: "Tiếng Việt", tips: "Vietnamese" },
  // i18n-ignore — nhãn hiển thị bản ngữ của lựa chọn tiếng Trung, cố ý giữ nguyên như danh sách locale của bundle
  { value: "zh", label: "中文", tips: "Chinese" },
];

// ---------------------------------------------------------------------------
// Mã widget
// ---------------------------------------------------------------------------
// Viết ES5-ish, không phụ thuộc build tool nào: nó được nhúng nguyên văn vào
// `data/web/index.html` và chạy thẳng trong trình duyệt/Electron.
function widgetSource(): string {
  return `(function(){"use strict";
var BLOCK_ID=${JSON.stringify(BLOCK_ID)};
var ANCHOR_LABELS=${JSON.stringify(ANCHOR_LABELS)};
var OPTIONS=${JSON.stringify(OPTIONS)};
var STRINGS=${JSON.stringify(STRINGS)};
var VALUES=OPTIONS.map(function(o){return o.value});
var current=null;
var busy=false;

/* Đọc locale giao diện y hệt cách bản vá header locale trong patch-web-ui.ts đọc
   (giá trị trong localStorage có thể bị bọc dấu nháy kép). */
function uiLocale(){
  var raw="";
  try{raw=(localStorage.getItem("locale")||"").replace(/^"|"$/g,"")}catch(e){raw=""}
  if(raw.indexOf("vi")===0)return "vi";
  if(raw.indexOf("zh")===0)return "zh";
  return "en";
}
function T(key){var d=STRINGS[uiLocale()]||STRINGS.en;return d[key]||STRINGS.en[key]||key}

/* baseUrl do store pinia "setting" ghi vào localStorage (persist.pick chứa baseUrl).
   Thiếu thì suy ra từ origin, cuối cùng mới về cổng mặc định của app. */
function apiBase(){
  try{
    var raw=localStorage.getItem("setting");
    if(raw){var parsed=JSON.parse(raw);if(parsed&&typeof parsed.baseUrl==="string"&&parsed.baseUrl)return parsed.baseUrl.replace(/\\/+$/,"")}
  }catch(e){}
  if(location.protocol==="http:"||location.protocol==="https:")return location.origin+"/api";
  return "http://localhost:10588/api";
}
function request(path,init){
  var headers={"Content-Type":"application/json"};
  try{var token=localStorage.getItem("token");if(token)headers.Authorization=token}catch(e){}
  var options=init||{};
  options.headers=headers;
  return fetch(apiBase()+path,options).then(function(res){
    if(!res.ok)throw new Error("HTTP "+res.status+" "+(res.statusText||""));
    return res.json()
  }).then(function(body){
    if(!body||body.code!==200)throw new Error((body&&body.message)||"code "+(body&&body.code));
    return body.data
  })
}

/* NEO DOM: phần tử NHỎ NHẤT chứa đồng thời cả ba nhãn locale do bundle render ra.
   Neo trên văn bản người dùng nhìn thấy, không trên class (.langGrid) hay
   data-v-* — cả hai đều do build sinh và đổi mỗi lần build lại. */
function findLangGrid(){
  var all=document.querySelectorAll("div");
  var best=null,bestLen=Infinity;
  for(var i=0;i<all.length;i++){
    var el=all[i];
    if(el.id===BLOCK_ID)continue;
    if(el.closest&&el.closest("#"+BLOCK_ID))continue;
    var text=el.textContent||"";
    var ok=true;
    for(var j=0;j<ANCHOR_LABELS.length;j++){if(text.indexOf(ANCHOR_LABELS[j])===-1){ok=false;break}}
    if(!ok)continue;
    if(text.length<bestLen){best=el;bestLen=text.length}
  }
  return best
}

/* Vue scoped CSS gắn qua attribute data-v-*. Đọc lại từ chính phần tử neo (không
   hardcode hash) rồi gắn lên các node ta tạo, để khối mới thừa hưởng nguyên vẹn
   cỡ chữ/khoảng cách/màu của trang — gồm cả chế độ tối. */
function scopeAttr(el){
  if(!el||!el.attributes)return null;
  for(var i=0;i<el.attributes.length;i++){var n=el.attributes[i].name;if(n.indexOf("data-v-")===0)return n}
  return null
}
function node(tag,cls,scope){
  var n=document.createElement(tag);
  if(cls)n.className=cls;
  if(scope)n.setAttribute(scope,"");
  return n
}

function setStatus(block,text,kind){
  var s=block.querySelector("[data-toonflow-status]");
  if(!s)return;
  s.textContent=text||"";
  s.style.color=kind==="error"?"var(--td-error-color)":kind==="ok"?"var(--td-success-color)":"";
}
function mark(block,value){
  var cards=block.querySelectorAll("[data-toonflow-prompt-lang]");
  for(var i=0;i<cards.length;i++){
    var active=cards[i].getAttribute("data-toonflow-prompt-lang")===value;
    cards[i].className=active?"langCard active":"langCard";
    var check=cards[i].querySelector("[data-toonflow-check]");
    if(check)check.style.visibility=active?"visible":"hidden"
  }
}

function build(scope){
  var root=node("div",null,scope);
  root.id=BLOCK_ID;
  root.style.marginTop="1.5rem";
  var title=node("div","langName",scope);
  title.textContent=T("title");
  title.style.marginBottom=".25rem";
  var desc=node("p","sectionDesc",scope);
  desc.textContent=T("desc");
  var grid=node("div","langGrid",scope);
  OPTIONS.forEach(function(opt){
    var card=node("div","langCard",scope);
    card.setAttribute("data-toonflow-prompt-lang",opt.value);
    var info=node("div","langInfo",scope);
    var name=node("div","langName",scope);
    name.textContent=opt.label;
    var native=node("div","langNative",scope);
    native.textContent=opt.tips;
    info.appendChild(name);info.appendChild(native);
    var check=node("span","checkIcon",scope);
    check.setAttribute("data-toonflow-check","");
    check.textContent="✓";
    check.style.visibility="hidden";
    card.appendChild(info);card.appendChild(check);
    card.addEventListener("click",function(){pick(root,opt.value)});
    grid.appendChild(card)
  });
  var status=node("p","sectionDesc",scope);
  status.setAttribute("data-toonflow-status","");
  status.style.marginTop=".5rem";
  status.style.marginBottom="0";
  root.appendChild(title);root.appendChild(desc);root.appendChild(grid);root.appendChild(status);
  return root
}

function load(block){
  request("/setting/language/getPromptLanguage",{method:"GET"}).then(function(value){
    if(VALUES.indexOf(value)===-1)throw new Error(T("badValue")+": "+JSON.stringify(value));
    current=value;mark(block,value)
  }).catch(function(err){
    /* Nói rõ cái gì hỏng thay vì im lặng: người dùng thấy lý do, console giữ stack. */
    setStatus(block,T("loadFailed")+": "+(err&&err.message?err.message:String(err)),"error");
    if(window.console&&console.error)console.error("[toonflow] prompt language: load failed",err)
  })
}

function pick(block,value){
  if(busy||value===current)return;
  busy=true;
  setStatus(block,T("saving"),"");
  request("/setting/language/setPromptLanguage",{method:"POST",body:JSON.stringify({language:value})}).then(function(){
    current=value;mark(block,value);setStatus(block,T("saved"),"ok")
  }).catch(function(err){
    mark(block,current);
    setStatus(block,T("saveFailed")+": "+(err&&err.message?err.message:String(err)),"error");
    if(window.console&&console.error)console.error("[toonflow] prompt language: save failed",err)
  }).then(function(){busy=false})
}

/* Idempotent trong DOM: một id cố định, kiểm tra trước khi chèn. Dựng lại chỉ khi
   khối bị Vue gỡ mất, bị tách khỏi danh sách neo, hoặc locale giao diện đã đổi
   (chữ của widget phải đổi theo). */
function ensure(){
  var grid=findLangGrid();
  var existing=document.getElementById(BLOCK_ID);
  if(!grid){if(existing&&existing.parentNode)existing.parentNode.removeChild(existing);return}
  if(existing){
    if(existing.previousElementSibling===grid&&existing.getAttribute("data-toonflow-locale")===uiLocale())return;
    if(existing.parentNode)existing.parentNode.removeChild(existing)
  }
  var scope=scopeAttr(grid)||scopeAttr(grid.firstElementChild);
  var block=build(scope);
  block.setAttribute("data-toonflow-locale",uiLocale());
  grid.parentNode.insertBefore(block,grid.nextSibling);
  mark(block,current);
  load(block)
}

var scheduled=false;
function schedule(){
  if(scheduled)return;
  scheduled=true;
  var run=function(){scheduled=false;try{ensure()}catch(e){if(window.console&&console.error)console.error("[toonflow] prompt language widget:",e)}};
  if(window.requestAnimationFrame)requestAnimationFrame(run);else setTimeout(run,16)
}
new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
schedule();
})();`;
}

function scriptTag(): string {
  return `<script id="${SCRIPT_ID}">${widgetSource()}</script>`;
}

// ---------------------------------------------------------------------------

function assertAnchors(source: string): void {
  const entries = source.match(LOCALE_ENTRY_RE);
  if (!entries || entries.length < ANCHOR_LABELS.length) {
    throw new Error(
      'không tìm thấy danh sách locale giao diện (`{label:"…",tips:"…",value:"…"}`) trong bundle — cấu trúc đã đổi, dừng lại',
    );
  }
  const joined = entries.join("");
  for (const label of ANCHOR_LABELS) {
    if (!joined.includes(`label:"${label}"`)) {
      throw new Error(
        `danh sách locale giao diện không còn nhãn \`${label}\` — widget sẽ không tìm được neo DOM lúc chạy, dừng lại`,
      );
    }
  }
  if (!source.includes(LANGUAGE_PAGE_ANCHOR)) {
    throw new Error(
      `không tìm thấy khoá \`${LANGUAGE_PAGE_ANCHOR}\` — trang Settings → Language đã đổi, dừng lại`,
    );
  }
}

/** Vị trí thẻ `</body>` đóng tài liệu (cái cuối cùng, và sau nó chỉ được là `</html>`). */
function docBodyClose(source: string): number {
  const idx = source.lastIndexOf("</body>");
  if (idx === -1) throw new Error("không tìm thấy thẻ đóng `</body>` trong bundle — dừng lại");
  if (!DOC_TAIL_RE.test(source.slice(idx))) {
    throw new Error(
      "phần sau `</body>` cuối cùng không phải chỉ là `</html>` — cấu trúc tài liệu đã đổi, dừng lại",
    );
  }
  return idx;
}

/** Khối script đã chèn từ lần chạy trước, nếu có. */
function existingScript(source: string): { start: number; end: number; text: string } | null {
  const open = `<script id="${SCRIPT_ID}">`;
  const start = source.indexOf(open);
  if (start === -1) return null;
  const close = source.indexOf("</script>", start);
  if (close === -1) {
    throw new Error(`thẻ \`<script id="${SCRIPT_ID}">\` chèn lần trước không có thẻ đóng — dừng lại`);
  }
  const end = close + "</script>".length;
  return { start, end, text: source.slice(start, end) };
}

export function patchBundle(source: string): { output: string; patched: boolean } {
  assertAnchors(source);

  const tag = scriptTag();
  const previous = existingScript(source);
  if (previous) {
    // Đã vá từ trước: giữ nguyên nếu y hệt, thay tại chỗ nếu nội dung widget đã đổi —
    // không bao giờ chèn khối thứ hai.
    if (previous.text === tag) return { output: source, patched: false };
    return {
      output: source.slice(0, previous.start) + tag + source.slice(previous.end),
      patched: true,
    };
  }

  const idx = docBodyClose(source);
  return { output: source.slice(0, idx) + tag + "\n  " + source.slice(idx), patched: true };
}

function main() {
  const file = "data/web/index.html";
  const source = fs.readFileSync(file, "utf-8");
  const { output, patched } = patchBundle(source);
  if (!patched) {
    console.log("Không có gì để vá (đã vá từ trước).");
    return;
  }
  fs.writeFileSync(file, output, "utf-8");
  console.log(`Đã chèn widget chọn ngôn ngữ prompt (<script id="${SCRIPT_ID}">) vào ${file}.`);
}

if (require.main === module) main();
