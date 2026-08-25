import fs from "fs";
import en from "../src/i18n/locales/en.json";
import vi from "../src/i18n/locales/vi.json";

/**
 * Vá bốn lỗi hiển thị trong bundle Vue đã build sẵn `data/web/index.html`
 * (27MB, một dòng, minified — không fork được repo nguồn). Xem cùng quy ước
 * với scripts/patch-web-i18n.ts: neo trên cú pháp/token ổn định (không bao
 * giờ neo trên tên biến bị rút gọn kiểu $Ci/Jt/EF — các tên này đổi mỗi lần
 * build lại), báo lỗi to và không đụng gì tới file nếu thiếu neo, và luôn
 * idempotent — chạy lần hai không đổi gì.
 */

// ---------------------------------------------------------------------------
// Lỗi 1 — font tiếng Việt bị vỡ dấu
// ---------------------------------------------------------------------------
// PingFang SC (font Trung của Apple) thiếu phần lớn ký tự Latin có dấu tổ hợp
// của tiếng Việt (ặ ệ ộ ữ …), nên trình duyệt phải tự ghép dấu — chính là hiện
// tượng dấu bị xô lệch trong ảnh chụp màn hình người dùng gửi. Đặt một font
// stack Latin-trước lên đầu; các font CJK vẫn còn ở cuối làm fallback nên chữ
// Hán/Nhật không bị ảnh hưởng (trình duyệt tự chuyển sang font tiếp theo cho
// từng ký tự mà font hiện tại không có glyph).
const NEW_FONT_STACK =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "PingFang SC", "Microsoft YaHei", sans-serif';

// Neo trên tên biến CSS custom property `--td-font-family` (do thư viện
// TDesign đặt ra, không phải danh tính rút gọn của trình build) — biến này
// xuất hiện dưới cả hai dạng `--td-font-family` và `--td-font-family-medium`,
// và giá trị có thể ở dạng chữ hoa "PingFang SC" hoặc chữ thường "pingfang sc"
// tuỳ khối CSS.
const FONT_VAR_RE = /(--td-font-family(?:-medium)?)\s*:\s*([^;}]*)/gi;

function patchFonts(source: string): { output: string; count: number } {
  let count = 0;
  let anchorSeen = 0;

  const output = source.replace(FONT_VAR_RE, (whole, varName: string, value: string) => {
    anchorSeen++;
    const firstFamily = value.split(",")[0]!.trim().replace(/^["']|["']$/g, "");
    if (firstFamily.toLowerCase() !== "pingfang sc") {
      // Đã vá từ trước (bắt đầu bằng -apple-system…) hoặc không phải giá trị
      // ta nhắm tới — không đụng vào.
      return whole;
    }
    count++;
    return `${varName}: ${NEW_FONT_STACK}`;
  });

  if (anchorSeen === 0) {
    throw new Error(
      "không tìm thấy neo `--td-font-family` trong bundle — cấu trúc CSS đã đổi, dừng lại",
    );
  }

  return { output, count };
}

// ---------------------------------------------------------------------------
// Lỗi 2 — locale không được gửi xuống backend
// ---------------------------------------------------------------------------
// Neo trên biểu thức `localStorage.getItem("token")` nằm bên trong một khối
// `interceptors.request.use(function(...){...})` — không neo trên tên biến
// rút gọn (tham số hàm, tên biến lưu token, …), vì các tên này đổi mỗi lần
// build lại.
const INTERCEPTOR_RE =
  /interceptors\.request\.use\(function\((\w+)\)\{([\s\S]*?)const (\w+)=localStorage\.getItem\("token"\);return \3&&\(\1\.headers\.Authorization=\3\),\1\}/;

// Dấu hiệu bundle đã được vá từ lần chạy trước.
const LOCALE_HEADER_MARKER = 'headers["X-Toonflow-Lang"]';

function patchInterceptor(source: string): { output: string; patched: boolean } {
  if (source.includes(LOCALE_HEADER_MARKER)) {
    return { output: source, patched: false }; // đã vá từ trước
  }

  const match = INTERCEPTOR_RE.exec(source);
  if (!match) {
    throw new Error(
      'không tìm thấy neo `localStorage.getItem("token")` trong request interceptor — cấu trúc bundle đã đổi, dừng lại',
    );
  }

  const [whole, param, middle, tokenVar] = match;
  // Tên biến cục bộ đặt dài, khó đụng trùng với các biến rút gọn một/hai ký
  // tự sẵn có trong đoạn code minified xung quanh.
  const replacement =
    `interceptors.request.use(function(${param}){${middle}` +
    `const ${tokenVar}=localStorage.getItem("token");` +
    `const __toonflowLocale=(localStorage.getItem("locale")||"").replace(/^"|"$/g,"");` +
    `return __toonflowLocale&&(${param}.${LOCALE_HEADER_MARKER}=__toonflowLocale),` +
    `${tokenVar}&&(${param}.headers.Authorization=${tokenVar}),${param}}`;

  const output = source.slice(0, match.index) + replacement + source.slice(match.index + whole.length);
  return { output, patched: true };
}

// ---------------------------------------------------------------------------
// Lỗi 3 — chuỗi tiếng Trung hardcode trong render function
// ---------------------------------------------------------------------------
// Neo trên lệnh gọi `ft("…")` — helper tạo static text vnode của Vue 3 sau
// khi minify (KHÔNG neo trên chính tên `ft`, xem ghi chú cuối file). 28 chuỗi
// dưới đây là toàn bộ chuỗi CJK tìm thấy làm đối số của lệnh gọi này trong
// dialog "Add Provider" và vài nơi khác — dò bằng tay trên bundle thật, không
// suy đoán số lượng.
//
// Giới hạn trung thực: các chuỗi này trở thành tiếng Anh cho MỌI locale, kể cả
// người dùng tiếng Trung, vì static vnode đã bị hoist lúc build — không thể
// vá lại để gọi qua $t(). Đây là đánh đổi có chủ đích cho một bản fork mà
// người dùng đọc tiếng Anh/tiếng Việt.
const CJK_TRANSLATIONS: [string, string][] = [
  ["返回首页", "Back to Home"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle, không phải văn bản UI của repo này
  ["自动", "Auto"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["浅色", "Light"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["深色", "Dark"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["极小", "Tiny"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["较小", "Smaller"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["小", "Small"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["默认", "Default"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["大", "Large"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["较大", "Larger"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["极大", "Extra Large"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["批量设置", "Batch Settings"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["全部", "All"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["通过文件导入", "Import from File"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["通过链接添加", "Add via Link"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["通过代码添加", "Add via Code"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  [
    " 请填写 TypeScript 代码文件的链接（.ts 文件），不要填 API 地址或其他无关链接。 确认后 Toonflow 会自动加载该代码，请确保链接来源可信。 ", // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
    " Please provide a link to the TypeScript code file (a .ts file) — not an API address or unrelated link. Toonflow will load this code automatically after you confirm, so make sure the link is from a trusted source. ",
  ],
  ["向量模型文件路径：/data/models/", "Vector model file path: /data/models/"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  [" 保存 ", " Save "], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["已上传", "Uploaded"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  [" 添加音频 ", " Add Audio "], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["已生成提示词", "Prompt Generated"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["未生成提示词", "No Prompt Generated"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["资产图片", "Asset Image"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["分镜图片", "Storyboard Image"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["批量删除", "Batch Delete"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["已选择", "Selected"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
  ["测试按钮", "Test Button"], // i18n-ignore — bảng dịch chuỗi hardcode trong bundle
];

// i18n-ignore — dải Unicode dùng để phát hiện CJK trong đối số của ft(...), không phải chuỗi dịch
const CJK_RANGE = /[一-鿿]/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function patchCjkStrings(source: string): { output: string; applied: string[] } {
  // Neo kém bền vững nhất trong ba cái ở file này: `ft` là tên rút gọn do build
  // tool đặt cho helper tạo static-text vnode của Vue 3, không phải một API ổn
  // định như `--td-font-family` hay shape của axios interceptor — nó có thể đổi
  // (thành `_ft`, `Wt`, …) ở bất kỳ lần rebuild upstream nào. Nếu neo này thôi
  // khớp: tìm trong render function đã compile một lệnh gọi hàm có đúng MỘT đối
  // số là chuỗi tĩnh (literal), thường đứng cạnh `_createTextVNode`/`toDisplayString`
  // trong cùng khối minified — đó chính là `ft` đã đổi tên.
  const anchorRe = /\bft\("((?:[^"\\]|\\.)*)"/g;
  let anchorSeen = false;
  const foundCjk = new Set<string>();

  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(source))) {
    anchorSeen = true;
    if (CJK_RANGE.test(m[1]!)) foundCjk.add(m[1]!);
  }

  if (!anchorSeen) {
    throw new Error('không tìm thấy neo `ft("…")` trong bundle — cấu trúc đã đổi, dừng lại');
  }

  const dict = new Map(CJK_TRANSLATIONS);
  const unknown = [...foundCjk].filter((s) => !dict.has(s));
  if (unknown.length > 0) {
    throw new Error(
      `tìm thấy ${unknown.length} chuỗi CJK trong ft("…") chưa có trong bảng dịch — dừng lại thay vì bỏ qua âm thầm: ${unknown
        .map((s) => JSON.stringify(s))
        .join(", ")}`,
    );
  }

  const applied: string[] = [];
  let output = source;
  for (const [zh, en] of CJK_TRANSLATIONS) {
    if (!foundCjk.has(zh)) continue; // không có trong bundle này (hoặc đã vá từ trước) — bỏ qua
    const re = new RegExp(`ft\\("${escapeRegExp(zh)}"`, "g");
    output = output.replace(re, () => `ft("${en}"`);
    applied.push(zh);
  }

  return { output, applied };
}


// ---------------------------------------------------------------------------
// Lỗi 4 — nhãn tab tiếng Trung trong hai màn "tạo mới" manual
// ---------------------------------------------------------------------------
// Màn "New visual manual" và "New director manual" dựng danh sách tab từ hai
// mảng object literal hardcode trong bundle:
//
//   const u=()=>[{label:"README",value:"README",data:""},{label:"角色",value:"art_character",data:""},…]
//   const q=()=>[{label:"README",value:"README",data:""},{label:"导演规划",value:"director_planning_narrative",data:""},…]
//
// Khớp theo `value` chứ KHÔNG theo chuỗi tiếng Trung: `value` là khoá máy (đồng
// thời là tên file skill) nên ổn định qua các lần rebuild, còn chuỗi tiếng Trung
// chính là thứ ta đang thay. Chỉ phần `label` bị viết lại — `value` và `data`
// giữ nguyên byte-for-byte. Cách khớp `,value:"…",data:""}` cũng tự loại được
// từ điển i18n tiếng Trung của chính bundle (locale `zh` hợp lệ, ví dụ
// `storyboardTable:{title:"分镜表"}`) — ở đó không có cặp label/value/data nào.
//
// Khác với 28 chuỗi ft("…") ở Lỗi 3: hai mảng này nằm trong hàm chạy lúc runtime
// (`()=>[…]`), không phải static vnode bị hoist lúc build, nên nhãn được sinh
// lại mỗi lần gọi — chèn được một biểu thức đọc locale từ localStorage, đúng cách
// bản vá Lỗi 2 đọc (`localStorage.getItem("locale")` kèm bóc dấu nháy bọc quanh).
// Nhờ vậy nhãn theo đúng locale người dùng: `vi` ra tiếng Việt, mọi locale khác
// (gồm `en`) ra tiếng Anh.
//
// Giới hạn trung thực: người dùng locale `zh` cũng thấy nhãn tiếng Anh, vì bảng
// tra chỉ có en/vi — đúng như phần còn lại của bản fork này.
//
// Bản dịch lấy thẳng từ src/i18n/locales/{en,vi}.json (cùng khoá mà backend dùng
// cho các route xem/liệt kê manual), không tự đặt lại chuỗi mới ở đây.
const MANUAL_LABEL_KEYS: [string, string][] = [
  ["prefix", "project.visualManual.label.prefix"],
  ["art_character", "project.visualManual.label.art_character"],
  ["art_character_derivative", "project.visualManual.label.art_character_derivative"],
  ["art_prop", "project.visualManual.label.art_prop"],
  ["art_prop_derivative", "project.visualManual.label.art_prop_derivative"],
  ["art_scene", "project.visualManual.label.art_scene"],
  ["art_scene_derivative", "project.visualManual.label.art_scene_derivative"],
  ["director_storyboard", "project.visualManual.label.director_storyboard"],
  ["art_storyboard_video", "project.visualManual.label.art_storyboard_video"],
  ["director_planning_style", "project.visualManual.label.director_planning_style"],
  ["director_storyboard_table_style", "project.visualManual.label.director_storyboard_table_style"],
  ["director_planning_narrative", "project.directorManual.label.director_planning_narrative"],
  ["director_storyboard_table_narrative", "project.directorManual.label.director_storyboard_table_narrative"],
];

// Cách đọc locale y hệt bản vá Lỗi 2 (đã xử lý việc bóc dấu nháy bọc quanh giá
// trị localStorage). Dùng làm luôn dấu hiệu "đã vá" cho tính idempotent.
const LOCALE_EXPR = '(localStorage.getItem("locale")||"").replace(/^"|"$/g,"")';

// i18n-ignore — dải Unicode dùng để nhận diện nhãn tiếng Trung chưa vá, không phải chuỗi dịch
const CJK_LABEL_RANGE = /[一-鿿]/;

function localeLabelExpr(enText: string, viText: string): string {
  return `(${LOCALE_EXPR}==="vi"?${JSON.stringify(viText)}:${JSON.stringify(enText)})`;
}

function lookup(catalog: Record<string, string>, key: string, locale: string): string {
  const text = catalog[key];
  if (typeof text !== "string" || text.length === 0) {
    throw new Error(`thiếu khoá dịch \`${key}\` trong src/i18n/locales/${locale}.json — dừng lại`);
  }
  return text;
}

function patchManualLabels(source: string): { output: string; patched: string[] } {
  let output = source;
  const patched: string[] = [];

  for (const [value, key] of MANUAL_LABEL_KEYS) {
    const tail = `,value:${JSON.stringify(value)},data:""}`;
    const idx = output.indexOf(tail);
    if (idx === -1) {
      throw new Error(
        `không tìm thấy neo \`${tail}\` trong bundle — mảng tab manual đã đổi cấu trúc, dừng lại`,
      );
    }
    if (output.indexOf(tail, idx + 1) !== -1) {
      throw new Error(
        `neo \`${tail}\` xuất hiện nhiều hơn một lần trong bundle — không dám đoán chỗ nào là tab manual, dừng lại`,
      );
    }

    const entryStart = output.lastIndexOf("{label:", idx);
    if (entryStart === -1) {
      throw new Error(`không tìm thấy \`{label:\` đứng trước \`${tail}\` — dừng lại`);
    }
    const labelExpr = output.slice(entryStart + "{label:".length, idx);

    if (labelExpr.includes(LOCALE_EXPR)) continue; // đã vá từ lần chạy trước

    const asLiteral = /^"((?:[^"\\]|\\.)*)"$/.exec(labelExpr);
    if (!asLiteral || !CJK_LABEL_RANGE.test(asLiteral[1]!)) {
      throw new Error(
        `nhãn của \`value:"${value}"\` có dạng lạ (\`${labelExpr}\`) — không phải chuỗi tiếng Trung cũng không phải bản đã vá, dừng lại`,
      );
    }

    const replacement = localeLabelExpr(
      lookup(en as Record<string, string>, key, "en"),
      lookup(vi as Record<string, string>, key, "vi"),
    );
    output =
      output.slice(0, entryStart + "{label:".length) + replacement + output.slice(idx);
    patched.push(value);
  }

  return { output, patched };
}

// ---------------------------------------------------------------------------
// Lỗi 5 — regex import chapter bị hardcode tiếng Trung
// ---------------------------------------------------------------------------
// Locale giao diện là tín hiệu đúng cho default mà người dùng nhìn thấy:
// en/vi dùng Chapter/Episode, còn zh/zh-CN/zh-TW giữ cú pháp 第…章/回/节.
// Prompt language vẫn độc lập; nút AI Regex phân tích chính văn bản được gửi.
const ENGLISH_CHAPTER_RE =
  /^(?:Chapter|Episode)\s+([0-9]+)\s*(?:[:.\-–—]\s*)?([^\n\r]*)/gim;
const CHINESE_CHAPTER_RE =
  /第\s*([0-9０-９零一二三四五六七八九十百千万]+)\s*[章回节]\s*([^\n\r]*)/g;
const LEGACY_PARSER_RE =
  /第\s*([0-9０-９零一二三四五六七八九十百千万]+)\s*集\s*([^\n\r]*)/g;

/** Trả RegExp mới mỗi lần để lastIndex của cờ g không rò giữa các lần parse. */
export function defaultChapterRegex(locale: string): RegExp {
  const selected = /^zh(?:-|$)/i.test(locale.trim()) ? CHINESE_CHAPTER_RE : ENGLISH_CHAPTER_RE;
  return new RegExp(selected.source, selected.flags);
}

const CHAPTER_REGEX_RUNTIME_MARKER = "function __toonflowDefaultChapterRegex";
const MODULE_SCRIPT_OPEN = '<script type="module" crossorigin>';
const CHAPTER_REGEX_RUNTIME =
  'function __toonflowDefaultChapterRegex(){let e="";try{e=(localStorage.getItem("locale")||"").replace(/^"|"$/g,"")}catch{}' +
  `return /^zh(?:-|$)/i.test(e)?new RegExp(${JSON.stringify(CHINESE_CHAPTER_RE.source)},${JSON.stringify(CHINESE_CHAPTER_RE.flags)}):` +
  `new RegExp(${JSON.stringify(ENGLISH_CHAPTER_RE.source)},${JSON.stringify(ENGLISH_CHAPTER_RE.flags)})}`;

function assertChapterRegexPatched(source: string): void {
  const required = [
    "chapterReg:__toonflowDefaultChapterRegex().toString()",
    "=__toonflowDefaultChapterRegex(),",
    "=ue(__toonflowDefaultChapterRegex().toString())",
    ".value=__toonflowDefaultChapterRegex().toString()",
  ];
  for (const marker of required) {
    if (!source.includes(marker)) {
      throw new Error(`bản vá chapter regex thiếu neo runtime \`${marker}\` — dừng lại`);
    }
  }
  const helperIndex = source.indexOf(CHAPTER_REGEX_RUNTIME_MARKER);
  const firstUseIndex = source.indexOf("__toonflowDefaultChapterRegex().toString()");
  if (!source.includes(MODULE_SCRIPT_OPEN + CHAPTER_REGEX_RUNTIME_MARKER) || helperIndex > firstUseIndex) {
    throw new Error("helper chapter regex không nằm ở đầu module trước mọi call site — dừng lại");
  }
}

function moduleScriptCodeStart(source: string): number {
  const openIndex = source.indexOf(MODULE_SCRIPT_OPEN);
  if (openIndex === -1 || source.indexOf(MODULE_SCRIPT_OPEN, openIndex + 1) !== -1) {
    throw new Error("không tìm thấy duy nhất thẻ script module của bundle — dừng lại");
  }
  return openIndex + MODULE_SCRIPT_OPEN.length;
}

function patchChapterRegex(source: string): { output: string; patched: boolean } {
  if (source.includes(CHAPTER_REGEX_RUNTIME_MARKER)) {
    const helperIndex = source.indexOf(CHAPTER_REGEX_RUNTIME);
    if (helperIndex === -1 || source.indexOf(CHAPTER_REGEX_RUNTIME, helperIndex + 1) !== -1) {
      throw new Error("helper chapter regex đã vá trước đó có dạng lạ hoặc bị nhân đôi — dừng lại");
    }
    const desiredIndex = moduleScriptCodeStart(source);
    if (helperIndex === desiredIndex) {
      assertChapterRegexPatched(source);
      return { output: source, patched: false };
    }
    // Nâng cấp bản vá cũ từng đặt helper trong render closure: gỡ đúng helper
    // byte-for-byte rồi đưa nó lên đầu script module, trước mọi call site.
    const withoutHelper =
      source.slice(0, helperIndex) + source.slice(helperIndex + CHAPTER_REGEX_RUNTIME.length);
    const moduleStart = moduleScriptCodeStart(withoutHelper);
    const relocated =
      withoutHelper.slice(0, moduleStart) + CHAPTER_REGEX_RUNTIME + withoutHelper.slice(moduleStart);
    assertChapterRegexPatched(relocated);
    return { output: relocated, patched: true };
  }

  let output = source;
  moduleScriptCodeStart(output); // fail trước khi thực hiện bất kỳ thay đổi nào

  const storeDefault = `chapterReg:${JSON.stringify(CHINESE_CHAPTER_RE.toString())}`;
  const storeIndex = output.indexOf(storeDefault);
  if (storeIndex === -1 || output.indexOf(storeDefault, storeIndex + 1) !== -1) {
    throw new Error("không tìm thấy duy nhất default chapterReg tiếng Trung trong store — dừng lại");
  }
  output = output.replace(storeDefault, "chapterReg:__toonflowDefaultChapterRegex().toString()");

  // Regex literal này là neo máy ổn định hơn tên biến minified (IJo hiện tại).
  // Lấy tên biến từ declaration để patch vẫn sống qua lần rebuild đổi identifier.
  const legacyRegexText = LEGACY_PARSER_RE.toString();
  const legacyRegexIndex = output.indexOf(legacyRegexText);
  if (legacyRegexIndex === -1 || output.indexOf(legacyRegexText, legacyRegexIndex + 1) !== -1) {
    throw new Error("không tìm thấy duy nhất regex fallback của batchAddScript — dừng lại");
  }
  const declarationStart = output.lastIndexOf("const ", legacyRegexIndex);
  const previousComma = output.lastIndexOf(",", legacyRegexIndex);
  const assignmentStart = Math.max(declarationStart + "const ".length - 1, previousComma);
  const assignmentPrefix = output.slice(assignmentStart + 1, legacyRegexIndex);
  const parserVarMatch = /^([A-Za-z_$][\w$]*)=$/.exec(assignmentPrefix);
  if (declarationStart === -1 || !parserVarMatch || output[legacyRegexIndex + legacyRegexText.length] !== ",") {
    throw new Error("declaration regex fallback của batchAddScript đã đổi cấu trúc — dừng lại");
  }
  const parserRegexVar = parserVarMatch[1]!;
  output =
    output.slice(0, legacyRegexIndex) +
    CHINESE_CHAPTER_RE.toString() +
    output.slice(legacyRegexIndex + legacyRegexText.length);

  const fallbackRe = new RegExp(
    `:([A-Za-z_$][\\w$]*)=${escapeRegExp(parserRegexVar)},\\1\\.lastIndex=0`,
  );
  if (!fallbackRe.test(output)) {
    throw new Error("không tìm thấy nhánh fallback parser dùng regex mặc định — dừng lại");
  }
  output = output.replace(fallbackRe, ":$1=__toonflowDefaultChapterRegex(),$1.lastIndex=0");

  // Neo vào ba refs liên tiếp ngay trước watcher validate regex. Cặp đầu là ô
  // regex và lỗi validate; ref cuối là loading của nút AI Regex.
  const fieldInitRe = /([A-Za-z_$][\w$]*)=ue\(""\),([A-Za-z_$][\w$]*)=ue\(""\),([A-Za-z_$][\w$]*)=ue\(!1\);lt\(\1,/;
  const fieldInit = fieldInitRe.exec(output);
  if (!fieldInit) {
    throw new Error("không tìm thấy ô regex của batchAddScript — dừng lại");
  }
  const regexFieldVar = fieldInit[1]!;
  const regexErrorVar = fieldInit[2]!;
  output = output.replace(
    fieldInitRe,
    `${regexFieldVar}=ue(__toonflowDefaultChapterRegex().toString()),${regexErrorVar}=ue(""),$3=ue(!1);lt(${regexFieldVar},`,
  );

  const resetRe = new RegExp(
    `([A-Za-z_$][\\w$]*\\.value="To1",)${escapeRegExp(regexFieldVar)}\\.value="",${escapeRegExp(regexErrorVar)}\\.value=""`,
  );
  if (!resetRe.test(output)) {
    throw new Error("không tìm thấy reset của ô regex khi đóng batchAddScript — dừng lại");
  }
  output = output.replace(
    resetRe,
    `$1${regexFieldVar}.value=__toonflowDefaultChapterRegex().toString(),${regexErrorVar}.value=""`,
  );

  // Đầu script module là scope chung duy nhất chắc chắn đứng trước store,
  // parser và render function, không phụ thuộc identifier minified nào.
  const moduleStart = moduleScriptCodeStart(output);
  output = output.slice(0, moduleStart) + CHAPTER_REGEX_RUNTIME + output.slice(moduleStart);

  assertChapterRegexPatched(output);
  return { output, patched: true };
}

// ---------------------------------------------------------------------------

export function patchBundle(source: string): {
  output: string;
  fontsChanged: number;
  interceptorPatched: boolean;
  stringsTranslated: string[];
  manualLabelsPatched: string[];
  chapterRegexPatched: boolean;
} {
  let output = source;

  const fonts = patchFonts(output);
  output = fonts.output;

  const interceptor = patchInterceptor(output);
  output = interceptor.output;

  const cjk = patchCjkStrings(output);
  output = cjk.output;

  const manualLabels = patchManualLabels(output);
  output = manualLabels.output;

  const chapterRegex = patchChapterRegex(output);
  output = chapterRegex.output;

  return {
    output,
    fontsChanged: fonts.count,
    interceptorPatched: interceptor.patched,
    stringsTranslated: cjk.applied,
    manualLabelsPatched: manualLabels.patched,
    chapterRegexPatched: chapterRegex.patched,
  };
}

function main() {
  const file = "data/web/index.html";
  const source = fs.readFileSync(file, "utf-8");
  const result = patchBundle(source);

  const totalChanges =
    result.fontsChanged +
    (result.interceptorPatched ? 1 : 0) +
    result.stringsTranslated.length +
    result.manualLabelsPatched.length +
    (result.chapterRegexPatched ? 1 : 0);
  if (totalChanges === 0) {
    console.log("Không có gì để vá (đã vá từ trước).");
    return;
  }

  fs.writeFileSync(file, result.output, "utf-8");
  console.log(`Đã sửa ${result.fontsChanged} khai báo font.`);
  console.log(`Interceptor request: ${result.interceptorPatched ? "đã vá" : "đã vá từ trước, bỏ qua"}.`);
  console.log(`Đã dịch ${result.stringsTranslated.length} chuỗi hardcode trong ft("…").`);
  console.log(`Đã vá ${result.manualLabelsPatched.length} nhãn tab manual (theo locale en/vi).`);
  console.log(`Chapter regex theo locale giao diện: ${result.chapterRegexPatched ? "đã vá" : "đã vá từ trước, bỏ qua"}.`);
}

if (require.main === module) main();
