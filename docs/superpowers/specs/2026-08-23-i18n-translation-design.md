# Thiết kế: quốc tế hoá Toonflow-app (Trung → Anh/Việt)

Ngày: 2026-08-23
Trạng thái: chờ duyệt
Fork: `kienmatu/Toonflow-app` (`origin`), gốc `HBAI-Ltd/Toonflow-app` (`upstream`)

## 1. Bối cảnh

Toonflow-app là backend Express + Electron phục vụ luôn giao diện web đã build. Toàn bộ
sản phẩm được viết bằng tiếng Trung: chuỗi trả về API, prompt điều khiển AI, thư viện
skill, dữ liệu nhà cung cấp model, tài liệu.

Khảo sát trên nhánh `master` (bỏ `node_modules`, `.git`) cho 389 file chứa ký tự CJK:

| Vùng | Quy mô | Tính chất |
| --- | --- | --- |
| `data/skills/**` | 183 file, ~15.500 dòng | Prompt/skill điều khiển AI: script agent, production agent, 12 art style, 12 story style |
| `src/**` | 130+ file, ~1.480 dòng | ~620 dòng comment, ~860 dòng chuỗi (message API, tool description, prompt inline) |
| `data/vendor/*.ts` | 11 file, ~1.184 chuỗi | Tên/mô tả nhà cung cấp, label input, tên model |
| `src/lib/vendor.json` | sinh tự động | Kết xuất của `data/vendor/*.ts`, do `scripts/vendor2json.ts` tạo |
| `data/modelPrompt/**` | 4 file | Prompt theo từng model video |
| `README.md`, `docs/README.*.md`, `package.json`, `.github/workflows/*` | ~10 file | Tài liệu và metadata |
| `data/web/index.html` | bundle 27MB | Giao diện đã build; 30.420 ký tự CJK / 4.381 chuỗi duy nhất |

### 1.1 Hiện trạng i18n của giao diện

Giao diện dùng vue-i18n với 1.481 lời gọi `$t()` và 7 catalog nhúng sẵn trong bundle:
`zh-CN`, `zh-TW`, `en`, `th-TH`, `vi-VN`, `ja-JP`, `ru-RU`. Locale mặc định `zh-CN`,
`fallbackLocale` là `en`.

Đo trực tiếp trên bundle: catalog `en` và `vi-VN` **không còn ký tự CJK nào** — chúng đã
được dịch trọn vẹn. Chúng chỉ thiếu vài chục key so với `zh-CN`.

Ba giới hạn khiến việc chọn ngôn ngữ trong Settings không giải quyết được vấn đề:

1. **Giao diện không gửi locale xuống backend.** Bundle không chứa `Accept-Language`,
   cũng không có header hay tham số `lang` nào. Backend hoàn toàn mù về lựa chọn của
   người dùng.
2. **Backend trả chuỗi tiếng Trung cứng.** `src/lib/responseFormat.ts:8` đặt mặc định
   `message = "成功"`; các route gọi `success("更新成功")`, `error("未找到模型配置数据")`.
3. **Prompt điều khiển AI là tiếng Trung.** Kịch bản, storyboard, prompt ảnh sinh ra đều
   theo tiếng Trung bất kể giao diện đang ở locale nào.

### 1.2 Khuyết tật nằm trong bundle

Giao diện tham chiếu 16 key `settings.menu.*`. Catalog `zh` có đủ; catalog `en` và `vi`
mỗi bên thiếu đúng 3 key, nên chúng hiện ra dưới dạng key thô:

| Key | Giá trị `zh` | Đề xuất `en` | Đề xuất `vi` |
| --- | --- | --- | --- |
| `settings.menu.ui` | 界面设置 | Interface Settings | Cài đặt giao diện |
| `settings.menu.modelMap` | 模型映射 | Model Mapping | Ánh xạ mô hình |
| `settings.menu.devConfig` | 开发者选项 | Developer Options | Tuỳ chọn nhà phát triển |

Ngoài ra `settings.menu.skillsSkillsManagement` có giá trị `en` bị lặp từ —
"SkillsSkills Management" (bản `zh` là "Skills技能管理") — cần sửa thành "Skills Management"
và "Quản lý Skills".

Đây là lỗ hổng dịch thuật trong catalog, không phải lỗi cấu trúc. Mã nguồn giao diện nằm ở
repo riêng `HBAI-Ltd/Toonflow-web`; repo này chỉ chứa bản build, nên phải vá trực tiếp trên
bundle (xem 3.7).

### 1.3 Prompt được seed vào cơ sở dữ liệu

`src/lib/initDB.ts` seed prompt tiếng Trung thẳng vào bảng, và `src/lib/fixDB.ts` nạp
`src/lib/vendor.json` vào cơ sở dữ liệu. Máy đã khởi tạo cơ sở dữ liệu từ trước sẽ **không**
thấy thay đổi nào nếu chỉ sửa file trên đĩa.

## 2. Mục tiêu

1. Tiếng Anh là ngôn ngữ chuẩn của mã nguồn và dữ liệu.
2. Người dùng chọn được `en` / `vi` / `zh` ở thời điểm chạy; lựa chọn đó quyết định cả
   chuỗi backend lẫn ngôn ngữ nội dung mà AI sinh ra.
3. `zh` vẫn là một locale chạy được, đồng thời là fallback khi thiếu bản dịch.
4. Sync `upstream` phải nhẹ nhàng: bản gốc tiếng Trung của thư viện skill không bị đụng tới.

### Ngoài phạm vi

- Fork và build lại `Toonflow-web`. Sẽ cân nhắc sau, nếu cần tuỳ biến giao diện sâu hơn.
- Thêm locale ngoài `en` / `vi` / `zh` ở phía backend.
- Dịch comment tiếng Trung trong `src/**` (quyết định có chủ ý, xem 3.3).

## 3. Thiết kế

### 3.1 Trục locale

Nguồn sự thật là khoá `content_language` trong bảng `o_setting` (bảng key/value đã có sẵn,
xem `src/lib/initDB.ts:266`), giá trị `en` | `vi` | `zh`, mặc định `en`.

Module mới `src/i18n/` cung cấp:

- `getLocale(req?)` — thứ tự ưu tiên: header `X-Toonflow-Lang` → `o_setting.content_language`
  → `en`. Chấp nhận header ngay từ đầu để sau này Toonflow-web gửi lên là chạy được, không
  phải sửa backend lần hai.
- `t(key, vars?, locale?)` — tra `locales/<locale>.json`, thiếu thì lùi về `zh`, thiếu nữa
  thì trả chính `key` và ghi cảnh báo.
- `resolveSkillPath(basePath, locale)` — xem 3.4.

Route mới `GET`/`POST /setting/language` để đọc và ghi khoá này.

### 3.2 Chuỗi user-facing trong `src/`

Rút khoảng 860 chuỗi ra `src/i18n/locales/{en,vi,zh}.json`, khoá đặt theo đường dẫn module,
ví dụ `setting.vendorConfig.notFound`. Call site đổi từ `success("更新成功")` thành
`success(t("setting.vendorConfig.updated", {}, locale))`.

`zh.json` giữ đúng nguyên văn tiếng Trung hiện tại, nên hành vi ở locale `zh` không đổi —
đây là mốc để đối chiếu hồi quy.

Mặc định của `responseFormat.ts` đổi từ `"成功"` sang khoá `common.success`.

### 3.3 Comment trong `src/`

Giữ nguyên tiếng Trung, không dịch. Đây là đánh đổi có chủ ý: mỗi dòng comment bị sửa là
một điểm xung đột tiềm tàng khi merge `upstream`. Giữ nguyên khiến diff của chúng ta chỉ
chạm những dòng có chuỗi, nên xung đột ít và dễ gỡ. Script quét ở 3.7 sẽ loại comment ra
khỏi báo cáo.

### 3.4 `data/skills` — bản gốc bất khả xâm phạm, bản dịch nằm cạnh

183 file gốc tiếng Trung **không sửa một byte nào**. Bản dịch nằm cạnh dưới dạng sidecar:

```
data/skills/script_agent_decision.md        <- gốc tiếng Trung, upstream sở hữu
data/skills/script_agent_decision.en.md     <- bản dịch của chúng ta
data/skills/script_agent_decision.vi.md     <- bản dịch của chúng ta
```

Nhờ vậy upstream sửa gì merge sạch nấy, không bao giờ xung đột trên vùng này.

Bộ phân giải path theo locale được cắm vào hai điểm nút đang nạp skill từ đĩa:
`src/utils/agent/skillsTools.ts` và `src/utils/getArtPrompt.ts`. Quy tắc: thử
`<tên>.<locale>.md` trước, không có thì lùi về `<tên>.md`. Với locale `zh` thì dùng thẳng
file gốc.

`data/skills/.i18n-manifest.json` ghi hash SHA-256 của file gốc tại thời điểm dịch:

```json
{ "script_agent_decision.md": { "sourceHash": "…", "translated": ["en", "vi"] } }
```

Sau mỗi lần sync upstream, script ở 3.7 so hash và chỉ ra chính xác bản dịch nào đã lỗi thời.

Prompt inline trong `src/utils/getPrompts.ts` cũng chuyển sang cơ chế này: tách nội dung ra
file dưới `data/skills/`, hàm chỉ còn đọc file theo locale.

### 3.5 Dữ liệu nhà cung cấp

Dịch 11 file `data/vendor/*.ts` (tên nhà cung cấp, mô tả, `inputs[].label`, tên model), rồi
chạy `yarn vendor2json` để sinh lại `src/lib/vendor.json`. Không sửa tay `vendor.json`.

Đây là nguồn của gần như toàn bộ tiếng Trung mà người dùng nhìn thấy trong màn hình
Settings → Model Providers, nên làm trước tiên để thấy hiệu quả ngay.

Tên riêng của thương hiệu giữ nguyên dạng gốc kèm chuyển tự khi cần: `火山引擎(豆包)` →
`Volcengine (Doubao)`, `可灵AI` → `Kling AI`, `Vidu 开放平台` → `Vidu Open Platform`.

### 3.6 Lớp cơ sở dữ liệu

- `initDB.ts` seed theo `content_language`, mặc định `en`.
- Migration `src/lib/migrations/i18n-seed.ts` cập nhật prompt và dữ liệu nhà cung cấp cho
  cơ sở dữ liệu đã tồn tại. Chỉ ghi đè bản ghi còn khớp nguyên văn bản seed tiếng Trung gốc,
  để không đè lên prompt người dùng đã tự sửa.
- Migration phải chạy lại được nhiều lần mà không đổi kết quả.

### 3.7 Công cụ

- `docs/i18n/glossary.json` — bảng thuật ngữ chốt cách dịch, dùng cho cả `en` và `vi`:
  分镜 → storyboard / phân cảnh; 资产 → asset / tài nguyên; 剧本 → script / kịch bản;
  小说 → novel / tiểu thuyết; 角色 → character / nhân vật; 场景 → scene / bối cảnh;
  道具 → prop / đạo cụ; 提示词 → prompt / prompt; 供应商 → provider / nhà cung cấp;
  统筹 → coordinator / điều phối. Bảng đầy đủ dựng ở bước đầu triển khai.
- `scripts/i18n-scan.ts` — báo cáo ký tự CJK còn sót ngoài vùng cho phép (file gốc
  `data/skills`, comment trong `src/`), và bản dịch lệch hash so với manifest. Thoát mã
  khác 0 khi có vấn đề, để cắm vào CI sau này.
- `scripts/i18n-extract.ts` — hỗ trợ rút chuỗi trong `src/` ra catalog.
- `scripts/patch-web-i18n.ts` — chèn 3 key thiếu vào catalog `en` và `vi`, sửa giá trị lặp
  từ của `skillsSkillsManagement` (bảng ở 1.2), thao tác trên `data/web/index.html`. Chạy
  lại được sau mỗi lần sync upstream. Script định vị catalog bằng cách bám neo cú pháp
  `menu:{…}` bên trong object `settings` của từng locale, không bám theo tên biến đã minify
  (`$Ci`, `Jxi`, `XLi` — những tên này đổi sau mỗi lần build upstream). Nếu không định vị
  được, script báo lỗi rõ ràng và không sửa gì, thay vì vá mù.

Việc dịch do người thực hiện có kiểm soát theo glossary, không dùng máy dịch hàng loạt.

## 4. Thứ tự triển khai

Mỗi bước một commit riêng để review được độc lập.

1. **Tài liệu và metadata** — `README.md`, `docs/README.*.md`, `package.json`
   (`description`, `homepage`, `repository`, `bugs` trỏ về fork), `.github/workflows/*`.
2. **Dữ liệu nhà cung cấp** — 11 file `data/vendor/*.ts` + sinh lại `vendor.json` (3.5).
3. **Hạ tầng i18n** — module `src/i18n/`, khoá `content_language`, route `/setting/language`,
   glossary, `i18n-scan.ts` (3.1, 3.7).
4. **Chuỗi backend** — rút ra catalog, đổi call site (3.2).
5. **Migration cơ sở dữ liệu** (3.6).
6. **Vá bundle giao diện** — `patch-web-i18n.ts` (1.2, 3.7).
7. **`data/skills` cốt lõi** — khoảng 20 file skill của script agent và production agent,
   cùng bộ phân giải path và manifest (3.4).
8. **`data/skills` phần còn lại** — 12 art style và 12 story style.

## 5. Kiểm chứng

- `yarn lint` (`tsc --noEmit`) sau mỗi bước.
- `scripts/i18n-scan.ts` về 0 phát hiện ngoài vùng cho phép sau bước 8.
- Chạy thử một tiểu thuyết ngắn qua script agent ở cả ba locale, đối chiếu đầu ra. Locale
  `zh` phải cho kết quả tương đương trước khi thay đổi — đây là mốc hồi quy chính.
- Kiểm tra thủ công màn hình Settings → Model Providers ở cả ba locale sau bước 6.
- Chạy thử migration trên bản sao cơ sở dữ liệu hiện có, xác nhận prompt người dùng tự sửa
  không bị đè.

## 6. Quy trình sync với upstream

1. `git fetch upstream && git merge upstream/master`
2. Vùng không bao giờ xung đột: file gốc `data/skills/**`, comment trong `src/**`.
3. Vùng chắc chắn xung đột khi upstream đụng tới: `data/vendor/*.ts` (dịch tại chỗ, 3.5) và
   những dòng có chuỗi trong `src/**` (3.2). Đây là đánh đổi đã chấp nhận — xung đột ở đây
   là xung đột nội dung một dòng, gỡ tay được, khác hẳn với việc để 183 file skill xung đột.
4. Chạy `scripts/i18n-scan.ts` để biết bản dịch nào lỗi thời và chuỗi mới nào chưa dịch.
5. Chạy lại `scripts/patch-web-i18n.ts` nếu `data/web/` có thay đổi.
6. Chạy lại `yarn vendor2json` sau khi gỡ xung đột ở `data/vendor/`, để `src/lib/vendor.json`
   khớp lại với nguồn.

## 7. Rủi ro

| Rủi ro | Giảm thiểu |
| --- | --- |
| Dịch prompt làm hỏng hành vi AI | Locale `zh` giữ nguyên văn gốc làm mốc đối chiếu; kiểm thử đầu-cuối ở bước 7 trước khi làm 24 file style |
| Bundle giao diện đổi cấu trúc sau khi sync, script vá hỏng | Script tự kiểm tra vị trí neo, không tìm thấy thì báo lỗi và dừng |
| Migration đè lên prompt người dùng đã sửa | Chỉ ghi đè bản ghi còn khớp nguyên văn seed gốc |
| Thuật ngữ dịch không nhất quán giữa 183 file | Glossary chốt trước ở bước 3, script quét đối chiếu |
