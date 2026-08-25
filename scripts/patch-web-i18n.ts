import fs from "fs";

const ADDITIONS: Record<"en" | "vi", Record<string, string>> = {
  en: { ui: "Interface Settings", modelMap: "Model Mapping", devConfig: "Developer Options" },
  vi: { ui: "Cài đặt giao diện", modelMap: "Ánh xạ mô hình", devConfig: "Tuỳ chọn nhà phát triển" },
};

const FIXES: Record<"en" | "vi", Record<string, string>> = {
  en: { skillsSkillsManagement: "Skills Management" },
  vi: { skillsSkillsManagement: "Quản lý Skills" },
};

const VENDOR_TEST: Record<"en" | "vi", Record<string, string>> = {
  en: {
    textTitle: "Text Chat Test",
    imageTitle: "Image Generation Test",
    videoTitle: "Video Generation Test",
    textEmptyHint: "Send a message to start testing",
    you: "You",
    assistant: "Assistant",
    textInputPlaceholder: "Enter a message, Ctrl+Enter to send",
    send: "Send",
    clearHistory: "Clear Chat",
    prompt: "Prompt",
    promptPlaceholder: "Enter a prompt",
    videoPromptPlaceholder: "Enter a video description (optional)",
    uploadImage: "Click or drag to upload an image",
    uploadVideo: "Click or drag to upload a video",
    uploadAudio: "Click or drag to upload audio",
    supportFormat: "Supports JPG / PNG / WEBP",
    textToImage: "Text to Image",
    imageToImage: "Image to Image",
    multiRef: "Multiple Image References",
    textToVideo: "Text to Video",
    singleImageMode: "Single Image Reference",
    selectMode: "Select Test Mode",
    result: "Generated Result",
    startTest: "Start Test",
    cancel: "Cancel",
    referenceImage: "Reference Image",
    startFrame: "Start Frame (Required)",
    endFrame: "End Frame (Required)",
    startFrameOptional: "Start Frame (Optional)",
    endFrameOptional: "End Frame (Optional)",
    optional: "Optional",
    image: "Image",
    video: "Video",
    audio: "Audio",
    multiRefDesc: "Use multiple reference images",
    textToVideoDesc: "Generate a video using only a text description",
    singleImageDesc: "Generate a video from a single reference image",
    startEndRequiredDesc: "Both start and end frame images are required",
    endFrameOptionalDesc: "Start frame required; end frame optional",
    startFrameOptionalDesc: "End frame required; start frame optional",
  },
  vi: {
    textTitle: "Kiểm tra hội thoại văn bản",
    imageTitle: "Kiểm tra tạo hình ảnh",
    videoTitle: "Kiểm tra tạo video",
    textEmptyHint: "Gửi tin nhắn để bắt đầu kiểm tra",
    you: "Bạn",
    assistant: "Trợ lý",
    textInputPlaceholder: "Nhập tin nhắn, nhấn Ctrl+Enter để gửi",
    send: "Gửi",
    clearHistory: "Xóa cuộc trò chuyện",
    prompt: "Prompt",
    promptPlaceholder: "Nhập prompt",
    videoPromptPlaceholder: "Nhập mô tả video (không bắt buộc)",
    uploadImage: "Nhấp hoặc kéo thả để tải ảnh lên",
    uploadVideo: "Nhấp hoặc kéo thả để tải video lên",
    uploadAudio: "Nhấp hoặc kéo thả để tải âm thanh lên",
    supportFormat: "Hỗ trợ JPG / PNG / WEBP",
    textToImage: "Văn bản thành hình ảnh",
    imageToImage: "Hình ảnh thành hình ảnh",
    multiRef: "Nhiều ảnh tham chiếu",
    textToVideo: "Văn bản thành video",
    singleImageMode: "Một ảnh tham chiếu",
    selectMode: "Chọn chế độ kiểm tra",
    result: "Kết quả tạo",
    startTest: "Bắt đầu kiểm tra",
    cancel: "Hủy",
    referenceImage: "Ảnh tham chiếu",
    startFrame: "Khung hình đầu (bắt buộc)",
    endFrame: "Khung hình cuối (bắt buộc)",
    startFrameOptional: "Khung hình đầu (không bắt buộc)",
    endFrameOptional: "Khung hình cuối (không bắt buộc)",
    optional: "Không bắt buộc",
    image: "Hình ảnh",
    video: "Video",
    audio: "Âm thanh",
    multiRefDesc: "Sử dụng nhiều ảnh tham chiếu",
    textToVideoDesc: "Tạo video chỉ bằng mô tả văn bản",
    singleImageDesc: "Tạo video từ một ảnh tham chiếu",
    startEndRequiredDesc: "Cần cung cấp cả khung hình đầu và khung hình cuối",
    endFrameOptionalDesc: "Bắt buộc khung hình đầu; khung hình cuối không bắt buộc",
    startFrameOptionalDesc: "Bắt buộc khung hình cuối; khung hình đầu không bắt buộc",
  },
};

const LEGACY_VENDOR_TEST: Record<"en" | "vi", string> = {
  en: "Test",
  vi: "Kiểm tra",
};

function objectLiteral(values: Record<string, string>): string {
  return `{${Object.entries(values).map(([key, value]) => `${key}:${JSON.stringify(value)}`).join(",")}}`;
}

function matchingBrace(source: string, open: number): number {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let i = open; i < source.length; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") depth++;
    else if (char === "}" && --depth === 0) return i;
  }
  throw new Error("không tìm thấy dấu `}` đóng catalog vendor — cấu trúc đã đổi, dừng lại");
}

/** Object literal đang chứa property tại `position`, giới hạn bởi assignment gần nhất. */
function enclosingObjectOpen(source: string, position: number): number {
  const assignment = source.lastIndexOf("={", position);
  if (assignment === -1) throw new Error("không tìm thấy object catalog chứa menu — cấu trúc đã đổi, dừng lại");

  const stack: number[] = [];
  let quote = "";
  let escaped = false;
  for (let i = assignment + 1; i < position; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "{") stack.push(i);
    else if (char === "}") stack.pop();
  }
  const open = stack.at(-1);
  if (open === undefined) throw new Error("menu không nằm trong object catalog — cấu trúc đã đổi, dừng lại");
  return open;
}

/** Tìm property trực tiếp của một object; không nhận property trùng tên ở object lồng bên trong. */
function topLevelProperties(source: string, open: number, close: number, key: string): number[] {
  const positions: number[] = [];
  let depth = 1;
  let quote = "";
  let escaped = false;
  for (let i = open + 1; i < close; i++) {
    const char = source[i];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === quote) quote = "";
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (depth === 1 && (source[i - 1] === "{" || source[i - 1] === ",") && source.startsWith(`${key}:`, i)) {
      positions.push(i);
    }
    if (char === "{") depth++;
    else if (char === "}") depth--;
  }
  return positions;
}

function assertCompletePropertyValue(source: string, valueEnd: number, objectClose: number, label: string): void {
  let next = valueEnd;
  while (next < objectClose && /\s/.test(source[next])) next++;
  if (next !== objectClose && source[next] !== ",") {
    throw new Error(`${label} còn nội dung sau giá trị đã nhận diện — cấu trúc đã đổi, dừng lại`);
  }
}

function patchVendorTests(source: string, applied: string[]): string {
  const hasUsageAnchor = source.includes("settings.vendor.test.");
  const replacements: { start: number; end: number; value: string }[] = [];
  const catalogs: { locale: "en" | "vi"; vendorOpen: number; vendorClose: number }[] = [];
  const menuRe = /menu:\{([^{}]*)\}/g;
  let match: RegExpExecArray | null;

  while ((match = menuRe.exec(source))) {
    const locale = detectLocale(match[0]);
    if (locale === "other") continue;

    const catalogOpen = enclosingObjectOpen(source, match.index);
    const catalogClose = matchingBrace(source, catalogOpen);
    const menuProperties = topLevelProperties(source, catalogOpen, catalogClose, "menu");
    if (menuProperties.length !== 1 || menuProperties[0] !== match.index) {
      throw new Error(`menu của ${locale} không phải property duy nhất trong catalog — cấu trúc đã đổi, dừng lại`);
    }
    const vendorProperties = topLevelProperties(source, catalogOpen, catalogClose, "vendor");
    if (vendorProperties.length === 0) {
      if (!hasUsageAnchor) continue; // bundle giả chỉ kiểm thử menu patch, không mang tính năng vendor test
      throw new Error(`không tìm thấy catalog settings.vendor của ${locale} — cấu trúc đã đổi, dừng lại`);
    }
    if (vendorProperties.length !== 1) {
      throw new Error(`catalog settings.vendor của ${locale} không duy nhất — cấu trúc đã đổi, dừng lại`);
    }

    const vendorAnchor = vendorProperties[0];
    if (!source.startsWith("vendor:{", vendorAnchor)) {
      throw new Error(`catalog settings.vendor của ${locale} không còn là object literal — cấu trúc đã đổi, dừng lại`);
    }
    const vendorOpen = vendorAnchor + "vendor:".length;
    catalogs.push({ locale, vendorOpen, vendorClose: matchingBrace(source, vendorOpen) });
  }

  if (catalogs.length === 0) return source;
  if (!hasUsageAnchor) {
    throw new Error("không tìm thấy usage anchor `settings.vendor.test.*` nhưng catalog vendor test vẫn tồn tại — dừng lại");
  }

  for (const { locale, vendorOpen, vendorClose } of catalogs) {
    const testProperties = topLevelProperties(source, vendorOpen, vendorClose, "test");
    if (testProperties.length !== 1) {
      throw new Error(`catalog vendor.test của ${locale} không tồn tại hoặc không duy nhất — cấu trúc đã đổi, dừng lại`);
    }

    const property = testProperties[0];
    const valueStart = property + "test:".length;
    const expected = objectLiteral(VENDOR_TEST[locale]);
    if (source[valueStart] === "{") {
      const valueEnd = matchingBrace(source, valueStart) + 1;
      if (source.slice(valueStart, valueEnd) === expected) {
        assertCompletePropertyValue(source, valueEnd, vendorClose, `catalog vendor.test của ${locale}`);
        continue;
      }
      throw new Error(`catalog vendor.test của ${locale} đã là object nhưng không khớp bản vá — dừng lại để không xóa key upstream`);
    }

    const legacy = JSON.stringify(LEGACY_VENDOR_TEST[locale]);
    if (!source.startsWith(legacy, valueStart)) {
      throw new Error(`catalog vendor.test của ${locale} không còn mang giá trị legacy ${legacy} — cấu trúc đã đổi, dừng lại`);
    }
    const valueEnd = valueStart + legacy.length;
    assertCompletePropertyValue(source, valueEnd, vendorClose, `catalog vendor.test của ${locale}`);
    replacements.push({ start: valueStart, end: valueEnd, value: expected });
    applied.push(`${locale}.vendor.test (thêm)`);
  }

  for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
    source = source.slice(0, replacement.start) + replacement.value + source.slice(replacement.end);
  }
  return source;
}

/**
 * Đoán locale của một khối menu qua giá trị key `about` — dùng dải Unicode
 * theo hệ chữ viết (script), KHÔNG so khớp một câu chữ cụ thể. Trong bundle
 * thật, `about` mang nghĩa "Kiểm tra cập nhật" chứ không phải "Giới thiệu",
 * và nội dung này có thể đổi ở lần build tiếp theo — nhưng hệ chữ viết
 * (Latin có dấu tiếng Việt / ASCII thuần / CJK / Kana / Thái / Kirin) thì ổn định.
 * Khối không có key `about` (menu điều hướng, menu Monaco editor, …) bị bỏ qua.
 */
function detectLocale(block: string): "en" | "vi" | "other" {
  const match = /about:"([^"]*)"/.exec(block);
  if (!match) return "other"; // không phải catalog settings.menu — không đụng vào
  const about = match[1];

  // CJK (Hán), Kana (Nhật), Thái, Kirin (Nga) → không phải en/vi, bỏ qua.
  if (/[㐀-鿿぀-ヿ฀-๿Ѐ-ӿ]/.test(about)) return "other"; // i18n-ignore — cận trên dải mã CJK dùng để nhận diện hệ chữ viết, không phải chuỗi dịch

  // Ký tự có dấu đặc trưng tiếng Việt (đ/ơ/ư/â/ê/ô/ă + toàn bộ khối
  // Latin Extended Additional dùng cho nguyên âm có thanh điệu).
  if (/[đĐơƠưƯâÂêÊôÔăĂẠ-ỹ]/.test(about)) return "vi";

  // Không còn hệ chữ viết nào khác và toàn ASCII → tiếng Anh.
  if (/^[\x00-\x7f]*$/.test(about)) return "en";

  return "other";
}

export function patchBundle(source: string): { output: string; applied: string[] } {
  const applied: string[] = [];
  let found = 0;
  let sawEn = false;
  let sawVi = false;

  let output = source.replace(/menu:\{([^{}]*)\}/g, (whole, body: string) => {
    found++;
    const locale = detectLocale(whole);
    if (locale === "en") sawEn = true;
    if (locale === "vi") sawVi = true;
    if (locale === "other") return whole;

    let next = body;
    for (const [key, value] of Object.entries(FIXES[locale])) {
      const re = new RegExp(`${key}:"[^"]*"`);
      if (re.test(next)) {
        const already = new RegExp(`${key}:"${value}"`).test(next);
        if (!already) {
          next = next.replace(re, `${key}:"${value}"`);
          applied.push(`${locale}.${key} (sửa)`);
        }
      }
    }
    for (const [key, value] of Object.entries(ADDITIONS[locale])) {
      if (new RegExp(`(^|,)${key}:`).test(next)) continue;
      next += `,${key}:"${value}"`;
      applied.push(`${locale}.${key} (thêm)`);
    }
    return `menu:{${next}}`;
  });

  if (found === 0) throw new Error("không tìm thấy neo `menu:{…}` trong bundle — cấu trúc đã đổi, dừng lại");

  if (!sawEn || !sawVi) {
    const missing = [!sawEn ? "en" : null, !sawVi ? "vi" : null].filter(Boolean).join(", ");
    throw new Error(
      `tìm thấy neo \`menu:{…}\` nhưng không nhận diện được catalog: ${missing} — detectLocale có thể đã hỏng, dừng lại`,
    );
  }

  output = patchVendorTests(output, applied);

  return { output, applied };
}

function main() {
  const file = "data/web/index.html";
  const source = fs.readFileSync(file, "utf-8");
  const { output, applied } = patchBundle(source);
  if (applied.length === 0) {
    console.log("Không có gì để vá (đã vá từ trước).");
    return;
  }
  fs.writeFileSync(file, output, "utf-8");
  console.log(`Đã vá ${applied.length} mục:`);
  for (const a of applied) console.log("  -", a);
}

if (require.main === module) main();
