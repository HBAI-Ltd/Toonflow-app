---
name: director_storyboard
description: Kỹ thuật viết prompt phân cảnh cho đạo diễn · Render anime 3D
metaData: director_skills
---

# Prompt phân cảnh · Render anime 3D · Kỹ thuật riêng của phong cách

---

## Phạm vi áp dụng

Skill này chỉ dùng để sinh prompt phân cảnh cho phong cách **render anime 3D**.

---

## Ánh xạ cảm xúc → từ về gương mặt/ánh mắt

| Cảm xúc đầu vào | Từ về gương mặt | Từ về ánh mắt | Bổ sung vi biểu cảm |
|----------|--------|--------|-----------|
| Rung động / vui mừng | Khóe môi cong nhẹ, gò má ửng hồng | Ánh mắt sáng, cái nhìn dịu dàng | Mắt cong hình trăng khuyết, biểu cảm sinh động |
| Buồn bã / hụt hẫng | Thần sắc ủ dột, hốc mắt hơi đỏ | Ánh mắt u tối, cái nhìn thất thần | Chau mày nhẹ, biểu cảm kìm nén |
| Ngạc nhiên / tò mò | Mắt mở to, biểu cảm sinh động | Ánh mắt tập trung, cái nhìn tò mò | Miệng hé mở, động tác tự nhiên |
| Dịu dàng / sâu đậm | Thần sắc dịu dàng, mày mắt ôn hòa | Ánh mắt chăm chú, cái nhìn đắm đuối | Khóe môi cong nhẹ, biểu cảm ấm áp chừng mực |
| Kiên định / dũng cảm | Thần sắc nghiêm nghị, ánh mắt kiên định | Cái nhìn trong trẻo, ánh mắt tập trung | Biểu cảm kiên định, khí chất sáng rõ |
| Ngại ngùng / e thẹn | Gò má ửng đỏ, biểu cảm tự nhiên | Cái nhìn cụp xuống, không dám nhìn thẳng | Ngón tay khẽ chạm gò má, động tác nhẹ nhàng |
| Ấm áp / xúc động | Biểu cảm dịu dàng, khóe mắt cười | Ánh mắt ấm áp, cái nhìn dịu dàng | Khóe môi nhướng lên, biểu cảm chân thành |
| Cô đơn / hoài niệm | Thần sắc tĩnh lặng, ánh mắt xa xăm | Cái nhìn thất thần, như đang nghĩ ngợi | Biểu cảm bình thản, khí chất tĩnh lặng |
| Vui sướng / hân hoan | Nụ cười rạng rỡ, mắt sáng | Ánh mắt linh hoạt, biểu cảm sinh động | Người chồm về trước, động tác nhanh nhẹn |
| Căng thẳng / bất an | Biểu cảm hơi cứng, mày khẽ nhíu | Ánh mắt thất thần, cái nhìn bất định | Ngón tay siết chặt, động tác căng thẳng |

---

## Kho từ về ánh sáng và không khí (render anime 3D)

### Ánh sáng theo thời điểm

| Thời điểm | Từ về ánh chính | Từ về tông màu | Từ về bầu không khí |
|--------|--------|--------|---------|
| Sáng sớm | Ánh mai dịu, ánh sáng tán xạ | Tông vàng ấm + xanh nhạt điểm xuyết | Cảm giác trong lành, ánh sáng lùa qua cửa sổ |
| Xế chiều | Ánh chếch dịu, ánh sáng khuếch tán | Chủ yếu tông ấm | Sáng tối loang lổ, cảm giác ấm áp |
| Hoàng hôn/lúc mặt trời lặn | Ráng chiều ngược sáng, nắng quái màu cam | Cam ấm + hồng điểm xuyết | Bóng đổ kéo dài, cảm giác lãng mạn |
| Ban đêm | Quầng sáng neon, ánh ấm cục bộ | Cam ấm chủ đạo + màu lạnh điểm xuyết | Cảm giác đô thị, lớp lang sáng tối |
| Thường ngày trong nhà | Ánh chếch tông ấm, dịu và đều | Chủ yếu vàng ấm | Cảm giác ấm cúng, không khí gia đình |
| Cảnh trống của thành phố | Ráng chiều khuếch tán, quầng sáng dịu | Cam ấm chủ đạo | Cảm giác khoáng đạt, thẩm mỹ đô thị |

### Ánh sáng theo cảm xúc

| Tông cảm xúc | Kiểu ánh sáng | Ràng buộc bổ sung |
|----------|----------|---------|
| Rung động/ấm áp | Ánh chếch dịu, khuếch tán tông ấm | Độ sâu trường ảnh nông, phông hơi mờ |
| Buồn bã/hụt hẫng | Ánh chếch tông lạnh, đánh sáng low-key | Giữ lại vùng tối cục bộ trên gương mặt |
| Lãng mạn/ngọt ngào | Ráng chiều ngược sáng, viền sáng | Quầng sáng tông ấm, phông hơi cháy sáng |
| Hoài niệm/hồi ức | Ánh ấm tán dịu, hiệu ứng mờ sương | Rìa hơi mờ, tổng thể dịu nhẹ |
| Thường ngày/ấm cúng | Ánh khuếch tán đều, tông ấm trung tính | Ánh sáng dịu, không có bóng rõ rệt |
| Ban đêm/đô thị | Quầng sáng neon, tương phản nóng lạnh | Tương phản sáng tối, lớp lang rõ ràng |

---

## Từ ràng buộc chất liệu bối cảnh (theo loại bối cảnh)

| Loại bối cảnh | Từ ràng buộc bắt buộc thêm |
|----------|-----------|
| Đô thị hiện đại | Kết cấu công trình tinh xảo, cao ốc, mặt dựng kính, đường chân trời thành phố |
| Quán cà phê/nhà hàng | Bàn ghế gỗ, ánh đèn tông ấm, cảnh phố ngoài cửa sổ, chi tiết tách cà phê |
| Không gian nhà ở | Nội thất hiện đại, đèn bàn tông ấm, chi tiết đồ đạc sinh hoạt, không khí ấm cúng |
| Văn phòng | Vách kính, bàn làm việc, màn hình máy tính, ghế văn phòng hiện đại |
| Đường phố/quảng trường | Mặt đường nhựa, đèn đường, người đi bộ, công trình hiện đại |
| Trung tâm thương mại/trong nhà | Sàn đá hoa, tủ kính, không gian thương mại, đèn chiếu sáng |
| Công viên/cây xanh | Vân thảm cỏ, bóng cây, ghế dài, công trình ở xa |
| Trong xe/phương tiện công cộng | Vải bọc ghế, phản chiếu trên kính xe, ánh đèn bảng táp-lô, cảnh phố ngoài cửa sổ mờ đi |

---

## Từ neo phong cách cố định (mọi đầu ra đều phải chứa)

**Neo anime 3D (bắt buộc):**

Render 3D animation, chất liệu cel-shading, ánh sáng điện ảnh, chất liệu chi tiết cao

**Đường viền và nét (bắt buộc ở mọi đầu ra):**

Đường viền rõ nét, render hoạt hình tươi sáng, đường viền đều và nhất quán, không đứt nét không rìa thô

**Chất liệu (bắt buộc khi cú máy có chất liệu):**

Chất liệu chi tiết cao, chất liệu tả thực kết hợp tỉ lệ hoạt hình, vân chất liệu rõ ràng, chất bề mặt tinh tế

**Lớp sáng tối (bắt buộc khi bối cảnh có ánh sáng):**

Lớp sáng tối dịu, tương phản sáng tối rõ ràng, hiệu ứng sáng dịu và tự nhiên, tông ấm chủ đạo

**Neo không khí (bắt buộc):**

Không khí vui tươi chữa lành, thẩm mỹ anime 3D, biểu đạt cảm xúc ấm áp, phong vị đô thị hiện đại

**Từ chốt chất lượng hình ảnh (mọi đầu ra đều phải chứa, đặt sau phần kết phong cách):**

Chế độ A (tiếng Việt) — mặc định:
8K siêu nét, đường nét rõ ràng, chất liệu tinh tế, màu sắc đầy đặn, khung hình không lẫn màu không nhiễu hạt

Chế độ A (tiếng Việt) — cảnh có chữ trong khung hình (khi mô tả hình ảnh có chữ trên đạo cụ như biển hiệu/bảng chỉ dẫn):
8K siêu nét, đường nét rõ ràng, chất liệu tinh tế, màu sắc đầy đặn, khung hình không lẫn màu không nhiễu hạt, chữ trên đạo cụ như biển hiệu/bảng chỉ dẫn rõ ràng đọc được

Chế độ B (tiếng Anh) — mặc định:
8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Chế độ B (tiếng Anh) — cảnh có chữ trong khung hình:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise

Chế độ B (tiếng Anh) — cảnh có chữ trong khung hình:

8K ultra HD, clear cel-shading, detailed materials, warm tones, no digital artifacts, no grain, no noise, legible text on signs and props

**Khuôn mẫu từ khóa phủ định (chế độ B bắt buộc chứa, đặt ở cuối prompt):**

> ⚠️ Seedream (chế độ A) **không hỗ trợ prompt phủ định**, từ khóa phủ định chỉ áp dụng cho chế độ B. Chế độ A bảo đảm chất lượng hình ảnh bằng các từ neo chất liệu và từ chốt chất lượng trong phần prompt thuận.

Chế độ B (tiếng Anh):
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth

---

## Mục cấm về thẩm mỹ (khi sinh phải tránh nghiêm ngặt)

Các từ ngữ/phong cách sau không được xuất hiện trong prompt đầu ra:

- ❌ Phong cách render tả thực/độ chân thực như ảnh chụp
- ❌ Phong cách tông tối/đổ bóng nặng/tương phản quá mức
- ❌ Hệ màu huỳnh quang bão hòa cao/màu neon
- ❌ Thiếu yếu tố hiện đại (bắt buộc nêu rõ bối cảnh hiện đại)
- ❌ Các mô tả biến dạng như tỉ lệ chibi, mắt to, kiểu Q
- ❌ Yếu tố cyberpunk/steampunk/tây huyễn hư cấu
- ❌ Chữ chồng lên ngoài hình (phụ đề, watermark, thẻ tiêu đề, chữ dẫn truyện và các loại chữ lớp UI khác, khung hình bắt buộc thuần hình ảnh)

> 💡 **Ngoại lệ**: chữ trên đạo cụ nằm trong thế giới câu chuyện (biển hiệu, biển đường, bảng chỉ dẫn, sách vở và các loại chữ hiện diện tự nhiên trong bối cảnh) **không thuộc phạm vi cấm**. Khi mô tả hình ảnh của phân cảnh có nội dung như vậy, phải mô tả trung thực sự hiện diện của chúng và yêu cầu chữ rõ ràng.

---

## Ví dụ sinh hoàn chỉnh

> Dưới đây là phần trình bày đối chiếu cùng một đầu vào theo chế độ A và chế độ B, khi dùng thực tế **chỉ xuất một trong hai**.

### Đầu vào (dữ liệu dòng bảng phân cảnh)

| 序号 | Mô tả hình ảnh | Bối cảnh | Tên tài nguyên liên quan | Thời lượng | Cỡ cảnh | Chuyển động máy quay | Hành động nhân vật | Cảm xúc | Ánh sáng và không khí |
|------|---------|------|-------------|------|------|------|---------|------|----------|
| 1 | Trên con phố lúc hoàng hôn, cô gái đứng ở ngã tư, ráng chiều rơi trên tóc | Đường phố | 女孩 | 5s | 中景 | 缓推 | Xách túi mua sắm, nghiêng người mỉm cười nhìn về xa | Mong chờ / ấm áp | Ráng chiều hoàng hôn + ánh chếch tông ấm |

### Ví dụ đầu ra A (chế độ A · Seedream)

[Prompt]
Render 3D animation, chất liệu cel-shading, ánh sáng điện ảnh, chất liệu chi tiết cao, bố cục trung cảnh (中景), nhân vật lấy nửa thân trên vào khung, đường viền rõ nét, render hoạt hình tươi sáng, đường viền đều và nhất quán, không đứt nét không rìa thô, chất liệu chi tiết cao, chất liệu tả thực kết hợp tỉ lệ hoạt hình, vân chất liệu rõ ràng, chất bề mặt tinh tế, trên con phố lúc hoàng hôn, cô gái đứng ở ngã tư, xách túi mua sắm, nghiêng người mỉm cười nhìn về xa, ánh mắt vừa mong chờ vừa ấm áp, ráng chiều rơi trên tóc, ráng chiều ngược sáng, cam ấm chủ đạo, hồng điểm xuyết, lớp sáng tối dịu, tương phản sáng tối rõ ràng, hiệu ứng sáng dịu và tự nhiên, không khí vui tươi chữa lành, thẩm mỹ anime 3D, biểu đạt cảm xúc ấm áp, phong vị đô thị hiện đại, 8K siêu nét, đường nét rõ ràng, chất liệu tinh tế, màu sắc đầy đặn, khung hình không lẫn màu không nhiễu hạt.
Dựa trên ảnh tham chiếu của 女孩, giữ nhất quán: đặc điểm khuôn mặt, kiểu tóc, chi tiết trang phục. Sinh một cảnh mới: đứng ở góc phố lúc hoàng hôn, tay xách túi mua sắm, mỉm cười dịu dàng nhìn về xa. Giữ ngoại hình nhân vật giống hệt ảnh tham chiếu.

### Ví dụ đầu ra B (chế độ B · Nanobanana)

```xml
<role>
You are a 3D animation storyboard artist.
Maintain strict visual continuity across all shots.
</role>
<character_reference>
Image [1]: 女孩 — long brown hair, gentle eyes, modern casual outfit, slim body shape
</character_reference>
<continuity_rules>
- Same wardrobe, hairstyle, face features across ALL shots
- Same environment, lighting style, color grade
- Only framing, angle, action, expression may change
- Do NOT introduce new characters not in reference images
</continuity_rules>
<shot>
Medium shot, character standing on a street corner at sunset, holding a shopping bag with one hand, smiling gently at the distance, eyes filled with expectation and warmth, sunset backlight on hair, warm cel-shading, detailed materials, clear outline lines, cinematic lighting, warm tones, soft shallow depth of field, modern urban aesthetic, healing atmosphere, high-quality 3D animation, 8K ultra HD, clear line art, detailed materials, no digital artifacts, no grain.
</shot>
<negative>
no photorealism, no realistic rendering, no CG realism, no dark tones, no heavy shading, no oversaturated colors, no neon colors, no cyberpunk, no sci-fi elements, no futuristic design, no plastic look, no cartoon flat coloring without depth
</negative>
```

## Thẻ tra cứu nhanh

### Tra nhanh cảm xúc → từ về hình ảnh

| Cảm xúc | Từ khóa gương mặt | Ánh sáng tương ứng |
|------|-----------|---------|
| Rung động | Khóe môi cong nhẹ, gò má ửng hồng | Ráng chiều ngược sáng tông ấm |
| Buồn bã | Thần sắc ủ dột, hốc mắt hơi đỏ | Ánh chếch tông lạnh low-key |
| Dịu dàng | Thần sắc dịu dàng, mày mắt ôn hòa | Ánh ấm khuếch tán đều |
| Lãng mạn | Ánh mắt chăm chú, cái nhìn đắm đuối | Quầng sáng tông ấm ngược sáng |
| Xúc động | Khóe mắt cười, biểu cảm chân thành | Ánh chếch tông ấm dịu |
| Cô đơn | Thần sắc tĩnh lặng, cái nhìn thất thần | Ánh chếch tông lạnh vùng tối |
| Vui sướng | Nụ cười rạng rỡ, mắt sáng | Ánh khuếch tán tông ấm |
| Ngọt ngào | Ánh mắt sáng, biểu cảm sinh động | Viền sáng ngược sáng |