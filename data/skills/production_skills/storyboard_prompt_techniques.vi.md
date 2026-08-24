---
name: storyboard_prompt_techniques
description: >-
  Tham chiếu kỹ pháp chung cho prompt phân cảnh.
  Bao quát quy tắc ánh xạ khi phân tích, từ vựng cỡ cảnh, quy phạm định dạng đầu ra, khung cấu trúc prompt, quy phạm chất lượng ảnh, quy tắc chú thích tài nguyên ảnh, quy tắc liền mạch vị trí nhân vật… để Agent kích hoạt và dùng.
---
# Prompt phân cảnh · kỹ pháp nền chung

> Dưới đây là **quy phạm nền chung** cho việc sinh prompt phân cảnh, áp dụng cho mọi phong cách thị giác. Các **nội dung liên quan phong cách** — từ neo phong cách, ánh xạ cảm xúc, từ vựng ánh sáng, chất cảm bối cảnh, các điều cấm về thẩm mỹ… — do kỹ pháp riêng theo phong cách (`director_storyboard`) định nghĩa.

---

## Các chế độ áp dụng

Quy phạm này chỉ hỗ trợ xuất ra ở hai **chế độ nhất quán theo ảnh tham chiếu** sau:

- **Chế độ A**: Seedream (doubao-seedream)
- **Chế độ B**: Nanobanana (Gemini)

> ⚠️ **Không sinh prompt cho chế độ chữ-sang-ảnh**, mọi đầu ra đều dựa trên tiền đề luồng **ảnh tham chiếu (ảnh-sang-ảnh / ControlNet / nhất quán nhân vật)**.

---

## Nguyên tắc trung thành với nội dung bảng phân cảnh (ưu tiên cao nhất)

Việc sinh prompt là **chuyển đổi định dạng**, không phải **sáng tác**. Bảng phân cảnh là **nguồn nội dung duy nhất** của prompt, mọi thông tin hình ảnh đều phải trung thành với dòng tương ứng của bảng phân cảnh, chỉ được thích ứng về hình thức diễn đạt và cách dùng từ theo yêu cầu của mô hình sinh ảnh.

### Nguyên tắc cốt lõi: mô tả hình ảnh là thân chính, không phải chất liệu

Trường «Mô tả hình ảnh» của bảng phân cảnh gánh toàn bộ thông tin thị giác của cú máy, là **nội dung thân chính** của phần thân prompt. Các từ bổ nghĩa như từ phong cách, từ chất lượng ảnh, từ ánh sáng… là **trang trí phụ trợ**, phục vụ cho mô tả hình ảnh. Khi hai bên tranh nhau chỗ trong ngân sách token thì **mô tả hình ảnh được ưu tiên**, thà cắt bớt từ phong cách chứ không được cắt bất kỳ yếu tố thị giác nào trong mô tả hình ảnh.

### Luật thép

1. **Giữ trọn mô tả hình ảnh**: mọi yếu tố thị giác trong trường «Mô tả hình ảnh» của bảng phân cảnh (chủ thể, vật thể, quan hệ không gian, chi tiết động, quan hệ cú máy) bắt buộc phải xuất hiện đầy đủ trong phần thân prompt, **không được sót bất kỳ mục nào**
2. **Chuyển đổi tương đương về ngữ nghĩa**: khi chuyển trường của bảng phân cảnh thành prompt, chỉ đổi hình thức diễn đạt (Trung ↔ Anh, văn xuôi ↔ từ khóa, ngôn ngữ tự sự ↔ mô tả thị giác), **không đổi ngữ nghĩa**. Ví dụ: bảng phân cảnh viết "không gian kiến trúc bóng cột thẫm sâu" → prompt bắt buộc phải thể hiện tông tối của bóng cột trong không gian đó, không được thay bằng ngữ nghĩa khác như "kiến trúc lộng lẫy"
3. **Cấm bay bổng sáng tạo**: không thêm các yếu tố thị giác trang trí mà bảng phân cảnh không nhắc tới (bảng phân cảnh không viết cánh hoa bay thì prompt không được tự thêm vào); không diễn giải lại không khí của bối cảnh (bảng phân cảnh viết "lạnh lùng khinh miệt" thì không được đổi thành "u buồn cô quạnh")
4. **Từ phong cách phụ thuộc vào nội dung**: các từ loại phong cách như từ neo phong cách, từ khóa chất lượng ảnh, từ chất cảm bối cảnh… là **bổ nghĩa phụ trợ**, phục vụ nội dung hình ảnh mà bảng phân cảnh đã định, không được lấn át chủ —— khi từ phong cách xung khắc với mô tả cụ thể của bảng phân cảnh thì lấy bảng phân cảnh làm chuẩn
5. **Kiểm ngược từng trường**: sinh xong mỗi prompt phải đối chiếu từng trường với dòng tương ứng của bảng phân cảnh, xác nhận các ánh xạ sau đều đã được thể hiện chính xác:

| Trường bảng phân cảnh | Prompt phải thể hiện | Điểm cần kiểm |
|-----------|---------------|--------|
| Mô tả hình ảnh | Nội dung cốt lõi của đoạn 【画面】 trong thân prompt | Mọi chủ thể thị giác, quan hệ không gian, chi tiết then chốt có được giữ **không sót một cái nào** không |
| Bối cảnh | Neo môi trường của đoạn 【画面】 trong thân prompt | Loại bối cảnh có nhất quán không |
| Cỡ cảnh | Từ bố cục theo cỡ cảnh | Cỡ cảnh có khớp không (cỡ cảnh phức hợp thì lấy đầu khởi của khung đầu) |
| Hành động nhân vật | Dáng thế và hướng nhìn của chủ thể | Ngữ nghĩa hành động có nhất quán không, hướng nhìn đã ghi rõ chưa |
| Cảm xúc | Từ chỉ diện mạo cảm xúc | Tông cảm xúc có nhất quán không |
| Ánh sáng và không khí | Đoạn 【光影】 trong thân prompt | Hướng nguồn sáng, thiên hướng tông màu, quan hệ sáng tối có đầy đủ và nhất quán không |

> ⚠️ **Kiểm không đạt = prompt vô hiệu**, bắt buộc sửa rồi mới xuất. Kiểu thất bại thường gặp nhất: các yếu tố cụ thể trong mô tả hình ảnh bị các từ mẫu phong cách phủ lấp và mất đi.

---

## Nguyên tắc nhận diện khung đầu

Ảnh phân cảnh là **ảnh tham chiếu cho khung đầu của video**. Mô hình phải tự phán đoán trạng thái thị giác của khung đó dựa trên ngữ nghĩa của trường «Mô tả hình ảnh» trong bảng phân cảnh, không máy móc áp mẫu "trạng thái chuẩn bị".

**Logic phán đoán**:

| Loại mô tả hình ảnh | Cách xử lý | Ví dụ |
|-------------|---------|------|
| **Khoảnh khắc tĩnh** (dừng bước ngẩng nhìn, đứng yên nhìn chằm chằm, nghiêng đầu cười khẩy, cúi bàn viết) | **Sinh thẳng theo mô tả**, không viết lại hành động | "nhân vật dừng bước ngẩng nhìn một vật" → prompt viết thẳng "dừng bước ngẩng nhìn vật đó" |
| **Quá trình hành động liên tục** (đi qua hành lang, vung kiếm chém xuống, quay lưng rời đi) | Lấy **trạng thái đông cứng ở khoảnh khắc khởi động tác** (không phải trạng thái chuẩn bị trừu tượng) | "vung kiếm chém xuống" → "kiếm đã giơ quá đầu, mũi kiếm chúc xuống, khoảnh khắc sắp bổ xuống" |
| **Chuyển động máy quay** (缓推 đẩy chậm tới 中景, 拉远 kéo ra 全景, mờ dần vào) | Lấy **cỡ cảnh ở đầu khởi** làm bố cục khung đầu | "远景→中景" → khung đầu lấy "大远景" |
| **Hiệu ứng chuyển tiếp** (từ màn đen mờ dần vào, chuyển cảnh mờ chồng) | Giữ phần mô tả nhưng ghi chú là trạng thái mở màn | "mở màn từ màn đen mờ dần vào" → "hình nổi lên từ màn đen, 大远景 đại viễn cảnh mở màn…" |

**Căn cứ phán đoán**: thì của động từ chính và mật độ tự sự trong phần mô tả hình ảnh.

> ❌ **Cách làm sai**: viết lại mọi hành động thành trạng thái chuẩn bị kiểu "sắp xảy ra", khiến ngữ nghĩa hành động bị pha loãng
> - Bảng phân cảnh viết "dừng bước ngẩng nhìn" → viết lại sai thành "sắp ngẩng đầu nhìn về phía trước" (hành động bị làm yếu đi)
> - Bảng phân cảnh viết "cười khẩy từ trên cao nhìn xuống" → viết lại sai thành "khóe môi sắp nhếch lên" (cảm xúc bị làm yếu đi)
>
> ✅ **Cách làm đúng**: trung thành với phần mô tả hành động của bảng phân cảnh, chỉ lấy đầu khởi khi hành động đó thực sự là một quá trình liên tục

---

## Quy tắc ánh xạ khi phân tích

| Trường phân cảnh | Cách prompt xử lý tương ứng |
|----------|----------------|
| Mô tả hình ảnh | **Nội dung thân chính**: nguồn thông tin cốt lõi cho đoạn 【画面】 trong thân prompt. Phải giữ trọn **mọi** chủ thể nhìn thấy được, lớp lang không gian, chi tiết then chốt, quan hệ cú máy trong mô tả hình ảnh, chỉ chuyển ngôn ngữ tự sự sang định dạng mô tả thị giác. Nghiêm cấm cắt bớt yếu tố then chốt, thay bằng ngữ nghĩa khác hoặc tự thêm yếu tố thị giác không có trong mô tả hình ảnh |
| Bối cảnh | Hòa vào đoạn 【画面】 làm neo môi trường, chồng thêm các từ ràng buộc chất cảm bối cảnh của kỹ pháp riêng theo phong cách |
| Cỡ cảnh | Từ bố cục cú máy (xem từ vựng cỡ cảnh bên dưới), phải khớp trường «Cỡ cảnh» của bảng phân cảnh. Cỡ cảnh phức hợp (như "远景→中景") thì lấy **đầu khởi của khung đầu** |
| Chuyển động máy quay | Chỉ là thông tin phục vụ làm phân cảnh, không vào prompt, không xuất ghi chú chuyển động máy quay |
| Hành động nhân vật | Dựa trên trường «Hành động nhân vật» của bảng phân cảnh, xử lý theo "nguyên tắc nhận diện khung đầu". Bắt buộc giữ nội hàm ngữ nghĩa của hành động và phần ghi rõ `｜朝向：` |
| Cảm xúc | Dựa trên trường «Cảm xúc» của bảng phân cảnh, chọn từ chỉ diện mạo/ánh mắt phù hợp từ bảng ánh xạ cảm xúc của kỹ pháp riêng theo phong cách. Tông cảm xúc phải nhất quán với bảng phân cảnh |
| Ánh sáng và không khí | Dựa trên trường «Ánh sáng và không khí» của bảng phân cảnh, viết vào đoạn 【光影】 **thành một đoạn riêng**, giữ trọn hướng nguồn sáng, thiên hướng tông màu, quan hệ sáng tối, chi tiết chất cảm |
| Thoại | Không vào prompt, không xuất ra |
| Hiệu ứng âm thanh | Không vào prompt, không xuất ra |
| Tên/ID tài nguyên liên quan | Chỉ dùng để ràng ảnh tham chiếu ở nội bộ, xử lý theo "quy tắc chú thích tài nguyên ảnh" |

---

## Từ vựng cỡ cảnh (dùng chung)

| Cỡ cảnh đầu vào | Từ cú máy tiếng Anh của chế độ B (Nanobanana) | Từ hình ảnh của chế độ A (Seedream) |
|----------|-------------------------------|---------------------------|
| 大远景/大全景 | `extreme wide shot, establishing shot` | bố cục 大远景 đại viễn cảnh, toàn cảnh môi trường, nhân vật nhỏ bé giữa bối cảnh |
| 远景/全景 | `wide shot, full shot, full body` | lấy trọn người, bố cục viễn cảnh (远景), tỉ lệ người và cảnh hài hòa |
| 中景 | `medium shot, cowboy shot, knee shot` | bố cục trung cảnh (中景), lấy nhân vật từ đầu gối trở lên |
| 近景 | `medium close-up, upper body` | bố cục cận cảnh (近景), lấy nửa thân trên, hậu cảnh xóa phông |
| 半身 | `half body shot, bust shot` | bố cục bán thân, lấy từ thắt lưng trở lên, độ sâu trường ảnh nông |
| 特写 | `close-up, face focus` | bố cục đặc tả (特写), phóng to khuôn mặt hoặc chi tiết cục bộ, hậu cảnh xóa phông sâu |
| 大特写 | `extreme close-up, macro detail` | đại đặc tả (大特写), chi tiết cục bộ cực hạn, hậu cảnh xóa phông |
| 过肩镜 | `over the shoulder shot, two shot` | bố cục qua vai, lưng nhân vật tiền cảnh xóa nhòe, nhân vật phía xa (远景) rõ nét |

**Xử lý cỡ cảnh phức hợp**: nếu bảng phân cảnh viết chuyển động máy quay kiểu "远景→中景", "中景→特写"…, thì vì ảnh phân cảnh là tham chiếu cho khung đầu nên **lấy cỡ cảnh khởi đầu ở bên trái mũi tên**.

---

## Quy phạm định dạng đầu ra

Mỗi phân cảnh **chỉ xuất phần thân prompt của một chế độ** (chọn một trong hai), không cho phép cùng một phân cảnh xuất cả chế độ A lẫn chế độ B.

**Quy tắc chọn chế độ**:

| Điều kiện | Chế độ được chọn |
|------|----------|
| Mô hình đích là Seedream / dòng Doubao | Chế độ A (Prompt tiếng Việt) |
| Mô hình đích là Nanobanana / dòng Gemini | Chế độ B (JSON Prompt tiếng Anh) |
| Người dùng chưa chỉ định mô hình | Mặc định chế độ A, hoặc hỏi người dùng xác nhận |
| Sinh hàng loạt | Giữ nguyên một chế độ suốt quá trình, không được đổi giữa chừng |

**Quy tắc nội dung đầu ra**:
- Khi chọn chế độ A: chỉ xuất phần thân `[Prompt]` (không có từ phủ định, Seedream không hỗ trợ)
- Khi chọn chế độ B: chỉ xuất phần thân `[JSON Prompt]` (có trường `"negative"`)
- Ngoài phần thân prompt, các nội dung sau mặc định không xuất: tiêu đề phân cảnh, thuyết minh ràng ảnh tham chiếu, ghi chú thoại, ghi chú hiệu ứng âm thanh, phần kiểm tra ràng buộc, tổng hợp tài nguyên

---

## Khung cấu trúc prompt (mô tả hình ảnh được ưu tiên)

### Tổng tắc về cấu trúc

Thân prompt dùng **cấu trúc ba đoạn**, bảo đảm mô tả hình ảnh giữ vị trí thân chính:

```
【画面】→ gánh trọn nội dung thị giác của «Mô tả hình ảnh» + «Bối cảnh» + «Cỡ cảnh» + «Hành động nhân vật» + «Cảm xúc» trong bảng phân cảnh (thân chính, mật độ thông tin cao nhất)
【光影】→ gánh nguồn sáng, tông màu, quan hệ sáng tối của «Ánh sáng và không khí» trong bảng phân cảnh (thành đoạn riêng, tránh bị từ phong cách chèn ép)
【风格】→ từ neo phong cách + từ khóa chất lượng ảnh + tuyên bố các điều cấm (bổ nghĩa phụ trợ, ngắn gọn)
```

> **Nguyên tắc phân bổ dung lượng**: đoạn 【画面】 là đoạn có mật độ thông tin cao nhất, dài nhất, phải gánh trọn mọi yếu tố thị giác của «Mô tả hình ảnh» trong bảng phân cảnh; đoạn 【光影】 đứng thứ hai, gánh riêng phần ánh sáng và không khí; đoạn 【风格】 ngắn nhất, chỉ đặt các từ neo phong cách và từ khóa chất lượng ảnh cần thiết. Thứ tự ba đoạn không được đảo, độ dài không được lộn ngược —— nếu dung lượng từ phong cách vượt quá đoạn hình ảnh thì đó là sản phẩm hỏng.

### Chế độ A: Seedream (tham số API `reference_images`)

Cơ chế: ảnh tham chiếu được truyền vào qua tham số API `reference_images`, trong prompt dùng `@图N` để ràng trực tiếp với ảnh tham chiếu.

Cấu trúc Prompt:

```
@图1 为{tên tài nguyên}{loại tài nguyên} @图2 为{tên tài nguyên}{loại tài nguyên} ... ,

【画面】{neo bối cảnh}，{từ bố cục theo cỡ cảnh}，{chuyển trọn phần mô tả hình ảnh —— giữ mọi yếu tố thị giác, quan hệ không gian, động tác chủ thể, hướng nhìn, cảm xúc}。

【光影】{hướng nguồn sáng}，{thiên hướng tông màu}，{quan hệ sáng tối}，{chi tiết chất cảm}。

【风格】{từ neo phong cách}，{từ khóa chất lượng ảnh}，禁止画外字幕、水印、UI 文字。

保持 @图N 面部特征、发型、服饰与参考图完全一致。
```

**Quy tắc then chốt**:
- Đoạn 【画面】 phải gánh trọn mọi thông tin của trường «Mô tả hình ảnh» trong bảng phân cảnh, **không được cắt bớt**
- Trong đoạn 【画面】, tên nhân vật/bối cảnh/đạo cụ **bắt buộc phải thay bằng `@图N`** (không dùng tên bằng chữ)
- Thông tin hướng nhìn phải ghi rõ vào đoạn 【画面】 (như "3/4 chính diện hướng phải")
- Không nối thêm đoạn tiếng Anh "Based on the reference image... Generate a new scene..." nữa (cơ chế `@图N` đã gánh chức năng ràng ảnh tham chiếu, nối thêm đoạn tiếng Anh sẽ khiến mô tả hình ảnh có hai bản, dễ xung khắc)

> Nội dung cụ thể của `[từ neo phong cách]`, `[từ khóa chất lượng ảnh]` do **kỹ pháp riêng theo phong cách** định nghĩa.

### Chế độ B: Nanobanana (đa phương thức + JSON)

Cơ chế: ảnh tham chiếu cùng prompt vào chung như đầu vào đa phương thức, prompt dùng JSON có cấu trúc để ràng buộc tính nhất quán của nhân vật.

Cấu trúc Prompt (khung cố định, 固定框架):

```json
{
  "role": "You are a cinematographer and storyboard artist. Maintain strict visual continuity across all shots.",
  "character_reference": [
    { "image": 1, "ref": "@图1", "description": "[mô tả ngoại hình then chốt: màu tóc/kiểu tóc/trang phục/vóc dáng]" },
    { "image": 2, "ref": "@图2", "description": "[mô tả ngoại hình then chốt]" }
  ],
  "continuity_rules": [
    "Same wardrobe, hairstyle, face features across ALL shots",
    "Same environment, lighting style, color grade",
    "Only framing, angle, action, expression may change",
    "Do NOT introduce new characters not in reference images"
  ],
  "shot": {
    "scene_and_framing": "[neo bối cảnh + từ bố cục theo cỡ cảnh]",
    "subject_and_action": "[động tác chủ thể + hướng nhìn + cảm xúc + mọi yếu tố thị giác trong mô tả hình ảnh, dùng @图N thay cho tên nhân vật/bối cảnh]",
    "lighting": "[hướng nguồn sáng + tông màu + quan hệ sáng tối + chất cảm]",
    "style": "[từ neo phong cách + từ khóa chất lượng ảnh]"
  },
  "negative": "[mẫu từ phủ định, có no subtitles, no watermark, no UI text] (các mục cụ thể do kỹ pháp riêng theo phong cách định nghĩa)"
}
```

**Quy tắc then chốt**:
- Trường `shot` được tách thành 4 trường con, ép mô tả hình ảnh chiếm trọn hai vị trí `scene_and_framing` và `subject_and_action`, tránh bị từ phong cách chèn ép
- `subject_and_action` là trường có mật độ thông tin cao nhất, phải gánh trọn «Mô tả hình ảnh» + «Hành động nhân vật» + «Cảm xúc» của bảng phân cảnh
- Ảnh tham chiếu vào dưới dạng đầu vào ảnh, không phải văn bản URL
- Phần mô tả nhân vật giữ 1-2 câu đặc điểm then chốt, tránh dài dòng

---

## Quy phạm chung về ngôn ngữ và chất lượng

- Chế độ A (Seedream) ưu tiên đoạn văn ngôn ngữ tự nhiên bằng tiếng Việt
- Chế độ B (Nanobanana) ưu tiên prompt JSON có cấu trúc bằng tiếng Anh
- Prompt tụ vào "thể hiện nội dung + chất ảnh sắc nét", tránh các từ gây mờ nhòe
- Không dùng những cách diễn đạt làm nhòe ảnh (xem bảng «Từ cấm làm tụt chất lượng ảnh» bên dưới)
- Từ phủ định của chế độ B xuất theo «mẫu từ phủ định» riêng của phong cách, mỗi prompt bắt buộc phải có, không được lược; chế độ A không xuất từ phủ định
- Từ khóa chất lượng ảnh xuất theo mẫu «từ khóa chất lượng ảnh» riêng của phong cách, mỗi prompt bắt buộc phải có

---

## Quy tắc chữ ngoài hình vs chữ trong hình

- **Chữ ngoài hình** (phụ đề, hình mờ, thẻ tiêu đề, chữ chồng cho lời dẫn… tức chữ phủ ở lớp UI) → **tuyệt đối cấm**, bắt buộc phải tuyên bố cấm ở đoạn 【风格】 và trong từ phủ định
- **Chữ trong hình** (đạo cụ chữ tồn tại tự nhiên trong bối cảnh: nhân vật cầm bút viết chữ, nét chữ trên cuộn sách, hoành phi biển hiệu, nội dung thư từ, biển chỉ đường, bảng hiệu cửa tiệm…) → **thuộc đạo cụ bối cảnh**, khi mô tả hình ảnh của phân cảnh nêu rõ có loại nội dung này thì cứ mô tả bình thường sự hiện diện của nó ở đoạn 【画面】, không chịu ràng buộc của quy tắc cấm chữ
- **Tiêu chí phán định**: chữ đó có tồn tại **bên trong thế giới truyện** hay không. Chữ trên hoành phi = đạo cụ trong hình ✅; câu thoại của nhân vật ở đáy khung hình = phụ đề ngoài hình ❌

---

## Từ cấm làm tụt chất lượng ảnh (dùng chung cho mọi phong cách)

| Cách viết bị cấm | Hành vi của mô hình | Cách thay an toàn |
|---------|---------|----------|
| `film grain` / `胶片颗粒` | Thêm nhiễu hạt lên cả ảnh làm ảnh nhòe | `subtle cinematic texture` / `轻微电影质感` |
| `imperfect focus` / `失焦` | Cả ảnh mất nét | Xóa thẳng |
| `edges not perfectly sharp` | Viền bị nhòe | Xóa thẳng |
| `slight natural deviation` | Tụt độ phân giải tổng thể | Xóa thẳng |
| `not completely stable` | Hình bị mờ | Xóa thẳng |
| `blurry background` (lạm dụng) | Chủ thể nhòe theo | `background bokeh, subject in sharp focus` |
| `hazy` / `foggy` (lạm dụng) | Cả ảnh bị phủ sương | Chỉ dùng khi cần phối cảnh không khí, đồng thời thêm `subject sharp` |
| `柔焦` / `朦胧感` | Giảm độ nét tổng thể | Xóa thẳng |

> **Nguyên tắc cốt lõi**: nội dung có thể "không hoàn hảo" (ánh sáng không đều, bố cục bất đối xứng), nhưng chất lượng ảnh bắt buộc phải sắc nét.

---

## Quy phạm xử lý hàng loạt

Khi người dùng nhập vào nhiều dòng bảng phân cảnh:

1. **Xử lý tuần tự từng dòng**, không nhảy dòng, không gộp dòng
2. Mỗi phân cảnh chỉ xuất phần thân prompt của chế độ đích (Prompt hoặc JSON Prompt)
3. Nếu cùng một bối cảnh có nhiều cú máy liên tiếp thì **từ chất cảm bối cảnh được dùng lại**, nhưng cảm xúc/ánh sáng/cỡ cảnh/hành động bắt buộc phải **xử lý độc lập theo từng dòng**
4. Các cú máy có tên tài nguyên liên quan giống nhau thì **từ chú thích nhất quán bắt buộc phải giống nhau**
5. Không nối thêm bất kỳ khối phi prompt nào (như tổng hợp tài nguyên trích dẫn, ghi chú thoại/hiệu ứng âm thanh, phần kiểm tra ràng buộc)

---

## Quy tắc chú thích tài nguyên ảnh

Trường `prompt` của mỗi phân cảnh bắt buộc phải lấy **phần chú thích tài nguyên ảnh** làm tiền tố, đồng thời **trong thân prompt phải dùng `@图N` thay trực tiếp cho tên nhân vật/bối cảnh/đạo cụ tương ứng**, thiết lập quan hệ ràng trực tiếp giữa ảnh tham chiếu và mô tả hình ảnh. Chú thích theo thứ tự trích dẫn của các tài nguyên trong `associateAssetsIds`, đánh số lần lượt từ `@图1`.

**Định dạng**: `@图1 为{tên tài nguyên}{loại tài nguyên} @图2 为{tên tài nguyên}{loại tài nguyên} ... , prompt mà trong thân dùng @图N thay cho tên nhân vật/bối cảnh`

**Ánh xạ loại**:

| type của tài nguyên | Từ chỉ loại trong chú thích |
|-----------|------------|
| role      | 角色       |
| tool      | 道具       |
| scene     | 场景       |
| clip      | 片段       |

**Quy tắc**:
- Đánh số từ `@图1`, tăng dần theo thứ tự mảng `associateAssetsIds`
- Mỗi ID tài nguyên được trích dẫn ứng với một mục chú thích, **không được sót, không được thừa**
- Tên tài nguyên dùng giá trị trường `name` của tài nguyên đó trong dữ liệu assets
- Loại tài nguyên điền theo bảng ánh xạ loại ở trên
- Phần chú thích và phần thân prompt ngăn nhau bằng `, `
- Tài nguyên phái sinh dùng `name` của chính nó và `type` của tài nguyên cha
- **Ràng vào thân (cốt lõi)**: trong thân prompt, mọi vị trí lẽ ra xuất hiện tên nhân vật/tên bối cảnh/tên đạo cụ đều **bắt buộc phải thay bằng dấu `@图N` tương ứng**, không dùng tên bằng chữ nữa. Nhờ vậy ảnh tham chiếu và chủ thể thị giác trong khung hình hình thành quan hệ trỏ trực tiếp, tránh sự mơ hồ do tên tài nguyên không trùng tên nhân vật (ví dụ: khi tên tài nguyên phái sinh khác tên nhân vật gốc, dùng `@图N` sẽ vòng qua được sự mơ hồ về tên mà trỏ thẳng vào ảnh tham chiếu)
- Cùng một `@图N` có thể xuất hiện nhiều lần trong thân (như khi nhân vật đồng thời nhìn thấy được ở tiền cảnh và trên mặt phản chiếu)

**Ví dụ** (giả sử `associateAssetsIds="[A, B, C]"` ứng với 角色甲(role)、角色乙(role)、某场景(scene)):

❌ Sai (thân dùng tên bằng chữ, rời rạc với chú thích tiền tố):
```
@图1 为角色甲角色 @图2 为角色乙角色 @图3 为某场景场景, 角色甲 cười lạnh, từ trên cao nhìn xuống 角色乙 đang quỳ dưới đất, bóng cột trong bối cảnh thâm trầm……
```

✅ Đúng (thân dùng @图N để ràng trực tiếp với ảnh tham chiếu):
```
@图1 为角色甲角色 @图2 为角色乙角色 @图3 为某场景场景,

【画面】Bên trong @图3, bố cục trung cảnh (中景), @图1 đứng thẳng ở bên trái khung hình, 3/4 nghiêng hướng phải, khóe miệng nhếch lên cười lạnh, từ trên cao nhìn xuống @图2 đang quỳ dưới đất bên phải khung hình; @图2 phủ phục sát đất, 3/4 lưng hướng trái, hai tay chống đất, vai lưng căng cứng……
```

---

## Quy tắc liền mạch vị trí và hướng nhìn của nhân vật

Khi sinh mỗi prompt, phải tuân thủ các ràng buộc sau về nhất quán vị trí và hướng nhìn của nhân vật xuyên các phân cảnh.

### I. Quy tắc lấy hướng nhìn (lấy hướng mặt của nhân vật từ bảng phân cảnh)

Trường «Hành động nhân vật» của bảng phân cảnh đã có phần ghi rõ `｜朝向：`, khi sinh prompt thì **ưu tiên trích thẳng ra**, và **ghi rõ vào prompt** từ chỉ phương vị hướng nhìn tương ứng (như `facing right` / `面朝右`, `three-quarter view facing left` / `3/4侧面朝左`).

**Thứ tự ưu tiên khi lấy** (cao → thấp):

| Ưu tiên | Nguồn manh mối | Logic xử lý |
|--------|---------|----------|
| **1** | **Phần ghi `｜朝向：` trong trường Hành động nhân vật** | Bảng phân cảnh đã ghi rõ → **dùng thẳng**, không cần suy luận |
| 2 | **Từ chỉ phương vị nêu rõ trong mô tả hình ảnh** | Mô tả hình ảnh nhắc thẳng hướng nhìn (như "quay lưng vào ống kính", "nhìn ra ngoài cửa sổ", "hướng về khán giả") → dùng thẳng (chỉ khi ưu tiên 1 thiếu) |
| 3 | **Quan hệ không gian nhiều nhân vật (trục nhìn 180°)** | Trong cảnh đối thoại/đối đầu/tương tác, hai nhân vật quay mặt về nhau: nhân vật bên trái khung quay mặt sang phải, nhân vật bên phải khung quay mặt sang trái. Lần đầu xuất hiện lập chuẩn xong thì khóa cho cả cảnh |
| 4 | **Gợi ý từ cỡ cảnh** | Cú qua vai: nhân vật tiền cảnh quay lưng/nghiêng lưng vào ống kính, nhân vật ở xa (远景) quay mặt về phía ống kính; đặc tả (特写)/cận cảnh (近景) độc thoại: mặc định ba phần tư nghiêng |
| 5 | **Ngữ nghĩa cảm xúc và tự sự** | Cô độc/trầm tư/hồi tưởng → đường nét nghiêng hoặc ba phần tư mặt lưng; đối kháng/chất vấn → chính diện hoặc ba phần tư chính diện hướng về đối phương; né tránh/e thẹn → nghiêng nhẹ đầu tránh đối phương |
| 6 | **Logic không gian của bối cảnh** | Đón khách ở cửa → quay mặt ra ngoài cửa; ngắm cảnh → quay mặt về phía cảnh; cúi bàn viết → cúi đầu hướng mặt bàn |

> **Trường hợp thông thường chỉ cần đọc ưu tiên 1**, bảng phân cảnh đã ghi chú xong ngay từ đầu nguồn. Ưu tiên 2~6 chỉ là suy luận dự phòng khi bảng phân cảnh thiếu ghi chú.

**Các bước lấy**:
1. Đọc nội dung ghi sau `｜朝向：` trong trường «Hành động nhân vật» ở dòng hiện tại của bảng phân cảnh
2. Nếu phần ghi có và đầy đủ → dùng thẳng, bỏ qua các ưu tiên sau
3. Nếu phần ghi thiếu (như dòng cảnh không người) → suy luận lần lượt theo ưu tiên 2~6
4. Viết thông tin hướng nhìn lấy được vào vị trí mô tả nhân vật tương ứng trong prompt

**Từ vựng hướng nhìn**:

| Loại hướng nhìn | Chế độ A (tiếng Việt) | Chế độ B (nhãn tiếng Anh) | Tình huống áp dụng |
|---------|-------------|-------------|---------|
| 正面 | chính diện hướng thẳng vào máy quay | facing camera, front view | Tuyên ngôn về bản thân, đối diện thẳng ánh nhìn khán giả |
| 3/4正面 | 3/4 nghiêng hơi hướng về máy quay | three-quarter view facing camera | Chủ thể đối thoại, truyền cảm xúc |
| 正侧面 | đường nét nghiêng chính diện | profile view, side view | Độc thoại, trầm tư, bóng đối đầu |
| 3/4背面 | 3/4 nghiêng phía sau lưng | three-quarter back view | Rời đi, xa cách, hồi tưởng |
| 背面 | quay lưng về máy quay | back view, from behind | Ra mắt bí ẩn, ly biệt, nhìn về xa |
| 面朝左 | hướng về bên trái khung hình | facing left | Nhân vật ở bên phải đường 180°, hoặc hướng về mục tiêu bên trái |
| 面朝右 | hướng về bên phải khung hình | facing right | Nhân vật ở bên trái đường 180°, hoặc hướng về mục tiêu bên phải |
| 微低头 | hơi cúi đầu | slightly looking down | Buồn bã, áy náy, trầm tư |
| 微仰头 | hơi ngẩng đầu | slightly looking up | Kiêu ngạo, ngước nhìn, chờ mong |

> Phần ghi hướng nhìn phải đồng thời có **hướng ngang** (quay mặt trái/phải/vào ống kính) và **thiên hướng ngẩng cúi** (nếu có), như "3/4侧面朝右，微微仰头".

### II. Quy tắc khóa vị trí và hướng nhìn

- **Khóa vị trí trong khung**: cùng một nhân vật, ở nhiều phân cảnh trong cùng một bối cảnh, vị trí trái phải trong khung hình (bên trái khung / giữa / bên phải khung) phải giữ cố định (固定), không được nhảy phía khi không có lý do tự sự
- **Bảo toàn hướng nhìn**: cảnh đối thoại/đối đầu tuân theo trục nhìn 180° —— nhân vật A quay mặt sang phải thì cả cảnh giữ quay mặt sang phải, nhân vật B quay mặt sang trái thì cả cảnh giữ quay mặt sang trái; trong prompt phải ghi rõ bằng từ chỉ phương vị (facing left, on the left side of frame…)
- **Nhất quán lớp lang tiền cảnh hậu cảnh**: nếu ở phân cảnh N nhân vật A ở tiền cảnh, nhân vật B ở trung cảnh (中景), thì ở các phân cảnh sau trong cùng bối cảnh, quan hệ trước sau của hai người không được đảo ngược vô cớ
- **Đổi vị trí phải có động tác nối**: khi vị trí trong khung của nhân vật thực sự cần đổi (như nhân vật đi lại, xoay người), prompt của phân cảnh trước đó phải có phần tả động tác dịch chuyển/xoay người tương ứng, không được nhảy chỗ vô cớ
- **Đổi hướng nhìn phải có động tác nối**: khi hướng nhìn của nhân vật thực sự cần đổi (như quay đầu, quay người), prompt của phân cảnh hiện tại phải có phần tả động tác chuyển hướng (như "khẽ quay đầu về phía trái khung hình"), và cú chuyển hướng đó phải nhất quán với trường «Hành động nhân vật» của bảng phân cảnh, không được đổi hướng vô cớ
- **Được đặt lại khi đổi bối cảnh**: khi chuyển sang một bối cảnh hoàn toàn mới thì được phân bổ lại vị trí trong khung và hướng nhìn, nhưng bên trong bối cảnh mới vẫn phải giữ nhất quán

### III. Quan hệ thị giác ở mặt phản chiếu

Khi trong khung hình có môi trường phản chiếu (mặt gương, mặt nước, kim loại nhẵn, kính cửa sổ, ống kính máy ảnh…), phải lưu ý các quy tắc sau:

- **Lật gương**: hướng trái phải của nhân vật trong mặt phản chiếu ngược với thực thể (thực thể quay mặt sang phải → ảnh phản chiếu quay mặt sang trái), trong prompt phải ghi rõ quan hệ hướng nhìn giữa ảnh phản chiếu và thực thể (như "@图1 hướng phải, trong bóng nước @图1 hướng trái")
- **Mặt phản chiếu không làm đổi chuẩn vị trí**: vị trí trong khung của nhân vật lấy thực thể làm chuẩn, hình trong mặt phản chiếu không được coi là nhân vật đổi vị trí
- **Nội dung mặt phản chiếu nhất quán với thực thể**: trang phục, kiểu tóc, biểu cảm… của nhân vật nhìn thấy trong mặt phản chiếu bắt buộc phải nhất quán với thực thể trong cùng khung, không được sai lệch
- **Chiều sâu trường ảnh và độ nét của mặt phản chiếu**: tùy khoảng cách và chất liệu của mặt phản chiếu mà ảnh phản chiếu có thể giảm độ nét ở mức hợp lý (như bị nhòe do gợn sóng mặt nước), nhưng phải ghi chú trong prompt (như "bóng trên mặt nước hơi méo đi")
- **Kích hoạt khi nhận diện**: khi mô tả hình ảnh của phân cảnh hoặc tài nguyên bối cảnh có các yếu tố phản chiếu như mặt gương, mặt nước, mặt hồ, dòng suối, kính, kim loại phản quang, máy ảnh/máy quay… thì quy tắc này tự động kích hoạt

---

## Phụ lục: ví dụ sản phẩm hoàn chỉnh

Dưới đây minh họa toàn bộ quy trình của một phân cảnh từ đầu vào tới đầu ra, để Agent tham khảo. Ví dụ này dùng ký hiệu thay thế trừu tượng (角色甲, 某场景, 道具X…), khi áp dụng thật thì thay bằng nội dung cụ thể của bảng phân cảnh.

### Đầu vào (một dòng của bảng phân cảnh)

| Trường | Nội dung |
|------|------|
| Mô tả hình ảnh | 开场黑场淡入，某场景出口大远景，人流涌动，醒目指示物立于画面右侧，角色甲背着道具X 独行人流中，镜头缓推至中景，他手攥道具Y 忽然停步仰望指示物，眼神紧张而笃定 |
| Bối cảnh | 某场景出口 |
| Cỡ cảnh | 远景→中景 |
| Hành động nhân vật | 背包步行前行→忽然停步→抬头仰望指示物→手攥道具Y 微紧｜朝向：3/4正面朝右 |
| Cảm xúc | 局促与笃定并存 |
| Ánh sáng và không khí | 左侧柔和晨光均匀铺洒，暖黄底色轻染地面，指示物受光清晰，人影逆光偏暗形成轮廓感 |
| ID tài nguyên liên quan | [a, b, c, d] → 角色甲(role)、道具X(tool)、道具Y(tool)、某场景出口(scene) |

### Đầu ra (chế độ A · Seedream)

```
@图1 为角色甲角色 @图2 为道具X 道具 @图3 为道具Y 道具 @图4 为某场景出口场景,

【画面】Trong @图4, mở màn mờ dần lên từ nền đen, bố cục 大远景 đại viễn cảnh, dòng người cuộn chảy qua lại, bên phải khung hình sừng sững một vật chỉ dẫn nổi bật; @图1 đeo @图2 đi một mình giữa dòng người, tay nắm chặt @图3, thân người 3/4 chính diện hướng phải, dừng bước giữa đám đông, ngẩng đầu nhìn lên vật chỉ dẫn bên phải khung hình, ánh mắt căng thẳng mà quả quyết, gương mặt lúng túng nhưng ánh lên vẻ quyết tâm.

【光影】Ánh nắng sớm dịu từ bên trái trải đều, sắc nền vàng ấm nhuộm nhẹ mặt đất, vật chỉ dẫn ăn sáng rõ và sáng bừng, bóng người xung quanh ngược sáng tối lại thành đường viền bóng đổ, thân hình @图1 nửa ăn sáng nửa ngược sáng, đường nét khuôn mặt hơi sáng.

【风格】{风格锚定词}，{画质锁定词}, cấm phụ đề ngoài hình, watermark, chữ UI.

Giữ đặc điểm khuôn mặt, kiểu tóc, trang phục của @图1 giống hệt ảnh tham chiếu.
```

> `{风格锚定词}` và `{画质锁定词}` trong đoạn 【风格】 do kỹ pháp riêng theo phong cách (`director_storyboard`) cung cấp, quy phạm chung này không gán cứng các mục cụ thể.

### Đối chiếu kiểm chứng

| Trường bảng phân cảnh | Vị trí prompt thể hiện | Có nhất quán |
|-----------|---------------|---------|
| 开场黑场淡入 | 【画面】"mở màn mờ dần lên từ nền đen" | ✅ |
| 某场景出口 | 【画面】"@图4" | ✅ |
| 大远景 (đầu khởi của khung đầu) | 【画面】"大远景构图" | ✅ |
| 人流涌动 | 【画面】"dòng người cuộn chảy qua lại" | ✅ |
| 指示物在右侧 | 【画面】"bên phải khung hình sừng sững một vật chỉ dẫn nổi bật" | ✅ |
| 角色甲背道具X 独行 | 【画面】"@图1 đeo @图2 đi một mình giữa dòng người" | ✅ |
| 手攥道具Y | 【画面】"tay nắm chặt @图3" | ✅ |
| 停步仰望指示物 | 【画面】"dừng bước giữa đám đông, ngẩng đầu nhìn lên vật chỉ dẫn bên phải khung hình" | ✅ |
| 朝向3/4正面朝右 | 【画面】"thân người 3/4 chính diện hướng phải" | ✅ |
| 紧张而笃定 | 【画面】"ánh mắt căng thẳng mà quả quyết" | ✅ |
| 左侧晨光+暖黄底色 | 【光影】"ánh nắng sớm dịu từ bên trái trải đều, sắc nền vàng ấm" | ✅ |
| 人影逆光剪影 | 【光影】"bóng người xung quanh ngược sáng tối lại thành đường viền bóng đổ" | ✅ |

**Không sót gì, kiểm chứng đạt.**
