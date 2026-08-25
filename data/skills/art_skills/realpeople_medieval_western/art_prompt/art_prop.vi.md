# Sinh hình ảnh đạo cụ · Sổ tay ràng buộc Sử thi trung cổ

---

## 1. Nguyên tắc thiết kế đạo cụ

1. **Chức năng đọc được** — công dụng rõ ngay; tạo hình phục vụ chức năng
2. **Chất liệu tối thượng** — vật liệu phải nhận diện được (sắt rèn / da thuộc / gỗ / len / sừng / giấy da / sáp)
3. **Nhất quán thời đại** — mọi đạo cụ thuộc thế giới trung cổ Tây Âu thế tục; không đồ hiện đại, không đồ tôn giáo
4. **Tỷ lệ rõ** — kích thước thật gợi qua tỷ lệ và chi tiết chế tác
5. **Trưng bày độc lập** — chỉ đạo cụ trong khung; không người, tay, chi; không bao giờ ở trạng thái cầm / đeo / dùng; trình bày kiểu tĩnh vật
6. **An toàn reference** — đạo cụ tái dùng làm reference generation: vũ khí luôn sạch (thép tra dầu, lưỡi mẻ, chuôi mòn), không bao giờ dính máu (S2)

---

## 2. Phân loại và ràng buộc thẩm mỹ

### 2.1 Vũ khí và dụng cụ săn

| Mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Kiếm / rìu / thương / cung / nỏ / dao săn / bẫy / lưới / cũi | {loại vũ khí}, medieval forged weapon |
| Vật liệu | Thép rèn, phụ kiện sắt, chuôi quấn da, cán tần bì hoặc sồi | forged steel, leather-wrapped grip |
| Tình trạng | Trung thực trận mạc: lưỡi mẻ, ánh xỉn, chuôi mòn — luôn sạch, không bao giờ dính máu | notched edge, oiled steel, worn grip |
| Chế tác | Vết búa, đinh tán, cấu trúc chức năng | visible hammer marks, riveted fittings |

### 2.2 Vật phẩm phường hội và gia huy

| Mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Huy chương thợ săn / ấn phường hội / lệnh truy nã / hiệu kỳ / khiên gia huy | {loại}, hunters' guild insignia |
| Vật liệu | Đồng đúc hoặc sắt, ấn sáp, giấy da, vải thêu | cast bronze, red wax seal, aged parchment |
| Chế tác | Huy hiệu thế tục chạm khắc (hươu, sói, thương chéo) — không bao giờ biểu tượng tôn giáo | engraved stag emblem |
| Chữ | Mọi chữ viết là nét cổ khó đọc, không bao giờ là chữ đọc được | illegible aged script |

### 2.3 Vật dụng đời thường

| Mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Cốc rượu / vại bia / đèn lồng / chân nến / chìa sắt / thừng / túi da / chăn cuộn | {loại}, medieval daily object |
| Vật liệu | Thiếc hợp kim, gốm nung, sắt gò, mỡ nến, gai dầu, da tẩm sáp | pewter tankard, hammered iron |
| Tình trạng | Đã dùng: móp, nến chảy, ám khói, patina | dented, wax drippings, smoke-darkened |

### 2.4 Vật phẩm cốt truyện

| Mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Bản đồ / nhẫn ấn / kiếm gãy / tín vật lọn tóc / chiến tích sinh vật (không ghê rợn: gạc rụng, vảy, bao vuốt) | {loại} |
| Vật liệu | Theo món, luôn đúng thời đại | aged vellum map, worn signet ring |
| Tự sự | Được mang dấu tích truyện theo cốt (lưỡi gãy gọn, mép bản đồ cháy) | snapped clean at the forte, singed edge |
| Cấm | Chiến tích ghê rợn (đầu, nội tạng), máu tươi trên mọi món | — |

---

## 3. Quy cách bản vẽ đa góc

### Định nghĩa hướng nhìn

| Vị trí | Hướng | Góc | Yêu cầu | Prompt |
|---|---|---|---|---|
| Trên trái | Chính diện | Trước 0° | Hình thái mặt trước đầy đủ | front view |
| Trên phải | Bên | Bên 90° | Độ dày / đường viền / cấu trúc | side view |
| Dưới trái | Mặt sau | Sau 180° | Cấu trúc / phụ kiện mặt sau | back view |
| Dưới phải | Đặc tả chi tiết | Phóng cục bộ | Vân chất liệu / chi tiết chế tác | detail closeup |

### Quy cách khung hình

| Mục | Ràng buộc |
|---|---|
| Bố cục | Một khung, bốn ô (2×2) |
| Nền | Xám trung tính tinh khiết #E8E8E8 |
| Sáng | Dịu đều, không bóng gắt |
| Tỷ lệ | Đạo cụ chiếm 70%+ mỗi ô |
| Bóng đổ | Cho phép bóng nền mềm tự nhiên |
| Khung | Khuyến nghị 1:1 |

---

## 4. Ràng buộc thể hiện vật liệu

| Vật liệu | Yêu cầu thể hiện | Prompt |
|---|---|---|
| Thép rèn | Ánh dầu xỉn, vết búa, vết mẻ, highlight lạnh | forged steel, oiled sheen, hammer marks |
| Sắt | Bề mặt gò, cho phép gỉ ở đinh tán và khớp | hammered iron, rust at rivets |
| Da thuộc | Thấy gân da, điểm tiếp xúc sẫm màu, chi tiết đường khâu | leather grain, darkened with use |
| Gỗ | Vân và vết dụng cụ, bóng vì tay cầm | oak grain, hand-polished |
| Len / vải | Thấy thớ dệt, mép sờn, thêu hơi mòn | visible weave, frayed edge |
| Giấy da | Cũ, quăn, mực phai, chữ khó đọc | aged parchment, faded ink |
| Đồng / thiếc | Patina mềm, vân đúc | bronze patina, cast texture |
| Sừng / xương / gạc | Gờ tự nhiên, đầu bóng, không ngữ cảnh gore | polished antler, natural ridges |
| Sáp | Giọt chảy, ấn ép ngón, mép nứt | red wax seal, cracked edge |

---

## 5. Mẫu prompt

```
bản vẽ đạo cụ trung cổ, real photography style, period drama realism, tương phản mạnh, chi tiết tối đa,
{loại đạo cụ}, {mô tả vật liệu}, {mô tả chế tác/trang trí}, {mô tả tình trạng},
tĩnh vật đạo cụ thuần, đạo cụ trưng độc lập, không ai cầm, không ai đeo,
một khung bốn ô (2x2): trên trái chính diện + trên phải bên + dưới trái mặt sau + dưới phải đặc tả chi tiết,
nền xám trung tính tinh khiết, sáng dịu đều, không bóng gắt,
vân vật liệu siêu rõ, chất liệu tả thực, {mô tả ánh vật liệu}
không chữ đọc được trong hình,
không người, tay, ngón, chi trong khung; đạo cụ không bao giờ ở trạng thái cầm, đeo hay đang dùng
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Phải chỉ định "nền xám trung tính tinh khiết" |
| R2 | Phải nêu rõ vật liệu và chế tác |
| R3 | Tạo hình phải hợp thế giới quan trung cổ Tây Âu thế tục |
| R4 | Vũ khí luôn sạch: thép tra dầu, lưỡi mẻ, chuôi mòn — không bao giờ dính máu (S2) |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Nền cảnh phức tạp |
| X2 | Đạo cụ chung khung với nhân vật (bước này thuần đạo cụ) |
| X3 | Bất kỳ hình người nào, toàn phần hay bộ phận (tay, ngón, cánh tay) |
| X4 | Đạo cụ ở trạng thái cầm, đeo, đang dùng |
| X5 | Yếu tố ám chỉ có người (dấu cầm, góc nhìn người đeo) |
| X6 | Đồ hay vật liệu hiện đại (nhựa, gia công máy) |
| X7 | Đồ tôn giáo (thánh giá, tràng hạt, đồ thờ, lễ phục tu sĩ) |
| X8 | Máu, gore, chiến tích ghê rợn trên mọi đạo cụ |
| X9 | Hiệu ứng phát sáng / phù phép / neon high-fantasy |
| X10 | Chữ đọc được trên giấy da, hiệu kỳ, ấn |
