---
name: director_storyboard
description: Kỹ thuật viết prompt phân cảnh cho đạo diễn · 3D Quốc phong
metaData: director_skills
---

# Prompt phân cảnh · 3D Quốc phong · Kỹ thuật riêng của phong cách

---

## Phạm vi áp dụng

Skill này chỉ dùng để sinh prompt phân cảnh cho phong cách **3D Quốc phong**.

---

## Ánh xạ cảm xúc → từ về gương mặt/ánh mắt

| Cảm xúc đầu vào | Từ về gương mặt | Từ về ánh mắt | Bổ sung vi biểu cảm |
|----------|--------|--------|-----------|
| Đoan trang / thanh nhã | Thần sắc đoan trang, cái nhìn điềm tĩnh | Mắt trong sáng, cái nhìn trầm ổn | Khóe môi cong nhẹ, biểu cảm trang nhã |
| Buồn thương / ai oán | Thần sắc ai oán, ánh mắt u ám | Mắt ngấn lệ, cái nhìn cúi xuống | Khóe môi trĩu xuống, biểu cảm bi thương |
| Dịu dàng / đắm đuối | Thần sắc dịu dàng, mày mắt chan chứa tình | Mắt chăm chú dịu dàng, cái nhìn ấm áp | Khóe môi cong nhẹ, biểu cảm chữa lành |
| Sắc lẻm / sát khí | Thần sắc lạnh lùng, cái nhìn như dao | Mắt sắc bén, cái nhìn kiên định | Hàm siết lại, biểu cảm uy nghiêm |
| Kinh ngạc / hân hoan | Mắt mở hơi to, biểu cảm sinh động | Mắt sáng, cái nhìn tụ tiêu | Khóe môi nhướng lên, biểu cảm mừng rỡ |
| Trầm tư / nội tâm | Thần sắc thoáng nhạt, cái nhìn xa xăm | Mắt thất thần, cái nhìn mất tiêu điểm | Biểu cảm điềm tĩnh, khí chất kín đáo |
| Vui sướng / hớn hở | Biểu cảm rạng rỡ, mắt cong vành trăng | Mắt sáng, cái nhìn linh hoạt | Gò má hơi ửng, biểu cảm sinh động |
| Mệt mỏi / uể oải | Ánh mắt lơ mơ, biểu cảm dịu | Cái nhìn hơi mệt, ánh mắt dịu dàng | Khẽ ngáp, biểu cảm uể oải |
| Mong chờ / trông ngóng | Mắt bừng sáng, biểu cảm tươi rói | Ánh mắt mong chờ, cái nhìn lấp lánh | Khóe môi nhướng lên, biểu cảm sinh động |
| Quyết liệt / kiên định | Thần sắc nghiêm túc, cái nhìn trong sáng | Ánh mắt kiên định, cái nhìn hướng thẳng | Cằm hơi ngẩng, biểu cảm quả cảm |

---

## Kho từ về ánh sáng và không khí (3D Quốc phong)

### Ánh sáng theo thời điểm trong ngày

| Thời điểm | Từ về ánh sáng chính | Từ về tông màu | Từ về không khí |
|--------|--------|--------|--------|
| Sớm mai | Ánh mai dịu, chiếu chếch tông ấm | Nguyệt bạch + thanh lục | Sương mỏng lan tỏa, không khí trong lành |
| Chính ngọ | Nắng sáng, ánh dịu chiếu thẳng | Chu sa + cao sáng vàng kim | Sáng tối rõ ràng, màu sắc tươi rõ |
| Chiều tối/hoàng hôn | Bóng ngược sáng, chuyển sắc tông ấm | Chuyển sắc chu sa + chàm | Ráng chiều, viền sáng |
| Ban đêm | Phông tông lạnh + điểm xuyết ánh ấm | Chàm chủ đạo + đốm sáng vàng ấm | Tĩnh lặng ấm cúng, ánh đèn dịu |
| Trời mưa | Ánh lạnh khuếch tán, không có nguồn sáng chính | Thanh lục + nguyệt bạch | Không khí ẩm ướt, tương phản thấp |

### Ánh sáng theo cảm xúc

| Tông cảm xúc | Kiểu ánh sáng | Ràng buộc bổ sung |
|----------|----------|----------|
| Cung đình xa hoa | Chiếu sáng tông ấm, cao sáng cục bộ | Phản xạ chất liệu PBR, lớp lang chiều sâu |
| Ý cảnh sơn thủy | Ánh sáng thể tích khuếch tán, không khí mờ sương | Tông thanh lục, xóa phông theo chiều sâu |
| Khuê các dịu dàng | Ánh dịu cục bộ, bóng đổ mềm | Tông yên chi, cận cảnh (近景) và đặc tả (特写) |
| Võ hiệp sát khí | Bóng đổ tông lạnh, tương phản ánh sáng gắt | Chàm + đen mực, độ bão hòa thấp |
| Đêm trăng thanh vắng | Chiếu sáng bằng ánh trăng, tương phản nóng lạnh | Phông chàm, điểm xuyết ánh ấm |

---

## Từ ràng buộc chất liệu bối cảnh (theo loại bối cảnh)

| Loại bối cảnh | Từ ràng buộc bắt buộc thêm |
|----------|-----------|
| Kiến trúc cung đình | Tường cung chu sa, mái lưu ly dát vàng, rường chạm cột vẽ, lan can bạch ngọc |
| Sơn thủy viên lâm | Sơn thủy thanh lục, đình đài mái cong, đường quanh dẫn vào chốn u tịch, non bộ ao hồ |
| Nội thất khuê các | Bình phong cửa lụa, song cửa chạm hoa, màn the rèm trướng, đồ nội thất cổ điển |
| Bối cảnh võ hiệp | Rừng trúc/tuyết/vách núi, tông lạnh, không khí ngột ngạt, đường nét sắc lẻm |
| Khánh điển lễ hội | Đèn lồng/dải lụa/pháo hoa, màu ấm bão hòa cao, không khí náo nhiệt, người đông nhộn nhịp |
| Cảnh phố đêm | Đèn lồng/đèn đường/cửa hiệu, điểm xuyết ánh ấm, phông tông lạnh, bóng phản chiếu |

---

## Từ neo phong cách cố định (mọi đầu ra đều bắt buộc chứa)

**Neo render 3D (bắt buộc):**

Phong cách render 3D, tạo mô hình độ chính xác cao, chất liệu PBR, 3D Quốc phong, ánh sáng đẳng cấp điện ảnh

**Chất liệu nhân vật (bắt buộc khi cú máy có nhân vật):**

Mô hình 3D cổ trang, texture độ chính xác cao, vân trang phục rõ ràng, sợi tóc render tinh tế, lớp lang ánh sáng phong phú

**Chất liệu bối cảnh (bắt buộc khi cú máy có bối cảnh):**

Render bối cảnh 3D, chi tiết kiến trúc phong phú, chất liệu chân thực, xóa phông theo chiều sâu, ánh sáng thể tích

**Neo nhất quán (bắt buộc trong chế độ ảnh tham chiếu):**

Giữ tạo hình nhân vật nhất quán với ảnh tham chiếu, giữ phong cách bối cảnh nhất quán với ảnh tham chiếu, giữ tông ánh sáng và màu sắc thống nhất

**Kết đuôi phong cách (cố định):**

Render 3D Quốc phong, thẩm mỹ phương Đông, chất liệu PBR, render đẳng cấp điện ảnh

**Từ khóa khóa chất lượng hình ảnh (mọi đầu ra đều bắt buộc chứa, đặt sau phần kết đuôi phong cách):**

Chế độ A (tiếng Việt) — mặc định (khi khung hình không cần chữ trong hình):
Render 3D độ nét cao, chi tiết cao, tạo mô hình độ chính xác cao, chất liệu PBR, khung hình không phụ đề, không watermark, không chữ tiêu đề chồng lên

Chế độ A (tiếng Việt) — cảnh có chữ trong hình (khi mô tả hình ảnh có chữ trên đạo cụ như hoành phi/câu đối/sách):
Render 3D độ nét cao, chi tiết cao, tạo mô hình độ chính xác cao, chất liệu PBR, khung hình không phụ đề, không watermark, không chữ tiêu đề chồng lên, chữ trên đạo cụ bối cảnh như hoành phi/câu đối rõ ràng đọc được

Chế độ B (tiếng Anh) — mặc định:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay

Chế độ B (tiếng Anh) — cảnh có chữ trong hình:
3D rendered style, high-poly modeling, PBR materials, Chinese style, cinematic lighting, high detail, no subtitles, no captions, no watermark, no title overlay, legible text on in-scene props such as plaques and couplets

**Khuôn mẫu từ khóa phủ định (chế độ B bắt buộc chứa, đặt ở cuối prompt):**

> ⚠️ Seedream (chế độ A) **không hỗ trợ prompt phủ định**, từ khóa phủ định chỉ dùng cho chế độ B. Chế độ A bảo đảm chất lượng hình ảnh bằng phần neo chất liệu và khóa chất lượng trong prompt thuận.

Chế độ B (tiếng Anh):
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text

---

## Mục cấm về thẩm mỹ (tránh nghiêm ngặt khi sinh)

Các từ ngữ/phong cách sau không được xuất hiện trong prompt đầu ra:

- ❌ Từ về nhiếp ảnh tả thực/độ chân thực như ảnh chụp (như: photorealistic, realistic photography)
- ❌ Màu huỳnh quang bão hòa cao/màu neon/cảm giác số hóa quá đậm
- ❌ Fantasy phương Tây/cyberpunk/yếu tố hiện đại
- ❌ Tạo mô hình độ chính xác thấp/texture thô/chất liệu nhựa
- ❌ Phong cách hoạt hình/anime/nhị nguyên
- ❌ Thiết kế phẳng/không có chiều sâu 3D
- ❌ Màu sắc hỗn loạn/ánh sáng sai/phối cảnh sai
- ❌ Yếu tố kiến trúc hiện đại/trang phục hiện đại

> 💡 **Ngoại lệ**: một số kỹ thuật render 3D hiện đại (như ray tracing, ánh sáng thể tích) vẫn dùng được hợp lý, nhưng phải giữ tông thẩm mỹ Quốc phong.

---

## Ví dụ sinh đầy đủ

> Dưới đây là phần đối chiếu cùng một đầu vào cho chế độ A và chế độ B; khi dùng thật **chỉ xuất một trong hai**.

### Đầu vào (dữ liệu dòng của bảng phân cảnh)

| 序号 | Mô tả hình ảnh | Bối cảnh | Tên tài nguyên liên quan | Thời lượng | Cỡ cảnh | Chuyển động máy quay | Hành động nhân vật | Cảm xúc | Ánh sáng và không khí |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Người phụ nữ khoác hoa phục đứng trước cung điện, tay cầm đèn lồng cung đình | Cung điện | 女子 | 6s | 中景 | 缓推 | Đứng nghiêng người cầm đèn, ánh mắt dịu dàng | Dịu dàng / trang nhã | Chiếu sáng tông ấm |

### Ví dụ đầu ra A (chế độ A · Seedream)

[Prompt]
Phong cách render 3D, tạo mô hình độ chính xác cao, chất liệu PBR, 3D Quốc phong, ánh sáng đẳng cấp điện ảnh, mô hình 3D cổ trang, texture độ chính xác cao, vân trang phục rõ ràng, sợi tóc render tinh tế, lớp lang ánh sáng phong phú, bố cục trung cảnh (中景), người phụ nữ khoác hoa phục đứng trước cung điện, tay cầm đèn lồng cung đình đứng nghiêng người, thần sắc dịu dàng, ánh mắt dịu dàng, phông tường cung chu sa, điểm xuyết cao sáng vàng kim, không khí ánh sáng thể tích, xóa phông theo chiều sâu, render 3D Quốc phong, thẩm mỹ phương Đông, chất liệu PBR, render 3D độ nét cao, chi tiết cao, tạo mô hình độ chính xác cao, chất liệu PBR, khung hình không phụ đề, không watermark, không chữ tiêu đề chồng lên.
Dựa trên ảnh tham chiếu của 女子, giữ nhất quán: đặc điểm khuôn mặt, kiểu tóc, chi tiết trang phục. Sinh một cảnh mới: đứng trước cung điện lúc hoàng hôn, tay cầm đèn lồng. Giữ phong cách hình ảnh giống hệt ảnh tham chiếu.

### Ví dụ đầu ra B (chế độ B · Nanobanana)

```xml
<role>
You are a 3D storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 女子 — 3D Guofeng-era styling, elegant costume, Guofeng 3D style
</character_reference>
<continuity_rules>
- Same outfit, hairstyle, face features across ALL shots
- Same 3D rendered style, PBR materials
- Same scene lighting, Chinese aesthetic
- Do NOT introduce photorealistic or western fantasy elements
</continuity_rules>
<shot>
Medium shot, woman in elegant traditional Chinese attire standing before palace, holding lantern, gentle expression, soft gaze, cinematic lighting, volumetric fog, depth of field blur, PBR material rendering, high-poly modeling, Chinese palace architecture, warm lighting, golden highlights, Chinese style 3D render, Eastern aesthetics, high detail, no subtitles, no captions, no watermark, no title overlay.
</shot>
<negative>
no photorealistic, no realistic photography, no low-poly, no rough modeling, no plastic texture, no harsh lines, no cartoon style, no anime style, no western fantasy, no cyberpunk, no sci-fi, no modern elements, no subtitles, no captions, no watermark, no title overlay, no UI text
</negative>


## Thẻ tra cứu nhanh

### Tra nhanh cảm xúc → từ về hình ảnh

| Cảm xúc | Từ khóa gương mặt | Ánh sáng tương ứng |
|------|-----------|---------|
| Đoan trang | Thần sắc đoan trang, cái nhìn trầm ổn | Chiếu sáng tông ấm + cao sáng |
| Buồn thương | Thần sắc ai oán, ánh mắt u ám | Bóng đổ tông lạnh + tương phản thấp |
| Dịu dàng | Thần sắc dịu dàng, ánh mắt chăm chú | Ánh dịu cục bộ + tán dịu |
| Sắc lẻm | Thần sắc lạnh lùng, cái nhìn như dao | Bóng đổ tông lạnh + ánh sáng gắt |
| Vui sướng | Biểu cảm rạng rỡ, mắt cong vành trăng | Chiếu sáng tông ấm + bão hòa cao |
| Trầm tư | Thần sắc thoáng nhạt, cái nhìn xa xăm | Ánh sáng thể tích + sương |
| Mệt mỏi | Ánh mắt lơ mơ, biểu cảm dịu | Ánh sáng dịu + tương phản thấp |
| Kiên định | Thần sắc nghiêm túc, cái nhìn trong sáng | Chiếu chếch tông ấm + đường viền rõ |
