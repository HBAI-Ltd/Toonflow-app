# Sinh trạng thái phái sinh đạo cụ · Sổ tay ràng buộc (Sử thi trung cổ)

---

## 1. Nguyên tắc phái sinh

1. **Neo tạo hình** — hình thái / đường viền lõi nhận ra được ở mọi trạng thái
2. **Trạng thái đọc được** — khác biệt rõ ngay
3. **Phục vụ tự sự** — mỗi biến thể phục vụ một nút truyện cụ thể
4. **Logic xuống cấp vật lý** — hư hại và lão hóa theo vật lý hợp lý
5. **An toàn reference** — không trạng thái nào đưa máu hay gore vào; hư hại nói qua thép, gỗ và vải (S2)

---

## 2. Loại trạng thái

### 2.1 Trạng thái sử dụng

| Trạng thái | Mô tả | Hợp | Prompt |
|---|---|---|---|
| Mới rèn / mới làm | Sạch, tra dầu, nước hoàn thiện của thợ | Vũ khí, trang bị | freshly forged, oiled finish |
| Qua chinh chiến | Vết mẻ, mòn dây đai, ánh xỉn | Vũ khí, mảnh giáp | campaign-worn, notched, dulled |
| Lâu đời / gia bảo | Patina sâu, vết sửa cũ, cạnh mềm | Gia bảo, vật phường hội | aged patina, old repairs |

### 2.2 Trạng thái hư hại

| Trạng thái | Mô tả | Hợp | Prompt |
|---|---|---|---|
| Mẻ | Sứt cạnh, móp nhỏ | Lưỡi, khiên | notched edge, small dents |
| Gãy | Lưỡi gãy, cán tách, khiên nứt | Đạo cụ nút truyện | snapped clean, split haft |
| Tàn phế | Cháy, gỉ mục, rách thành dải | Đạo cụ hậu quả | burned remains, rusted through, torn banner |

### 2.3 Trạng thái đặc biệt

| Trạng thái | Mô tả | Hợp | Prompt |
|---|---|---|---|
| Bết bùn | Bùn dã chiến, đất khô bám | Trang bị dã ngoại | mud-caked, dried earth |
| Ướt mưa | Giọt nước, da sẫm, vải ẩm | Tất cả | rain-wet, darkened leather |
| Đóng băng | Sương muối, phụ kiện đông cứng, tuyết phủ | Cảnh đông | frost-rimed, snow-dusted |
| Ám khói | Khói lửa, phủ tro | Công thành / làng cháy | soot-marked, ash-dusted |
| Nghi lễ | Lau sạch, tra dầu, thêm ruy băng phường hội | Nghi thức, minh oan | ceremonially cleaned, guild ribbon |

> **Cấm cứng ở mọi trạng thái**: vết máu, cặn gore, nội tạng. Lưỡi kiếm từng qua trận đọc qua vết mẻ và thép xỉn, không bao giờ qua máu.

---

## 3. Quy cách khung hình biến thể

### Hình một trạng thái

| Mục | Ràng buộc |
|---|---|
| Nền | Xám trung tính tinh khiết #E8E8E8 (khớp bản vẽ gốc) |
| Sáng | Đều, không bóng gắt |
| Góc | Trùng góc chính diện của bản vẽ gốc |
| Tỷ lệ | Đạo cụ chiếm 70%+ khung |

### Hình so sánh trạng thái

| Mục | Ràng buộc |
|---|---|
| Bố cục | 2–3 trạng thái xếp cạnh trong một khung |
| Nhất quán | Góc / sáng / nền giống hệt; chỉ khác trạng thái |

---

## 4. Quy tắc biến đổi vật liệu theo trạng thái

| Vật liệu | Mới → chinh chiến | Chinh chiến → lâu đời | Biểu hiện hư hại |
|---|---|---|---|
| Thép rèn | Ánh dầu → mẻ, đốm xỉn | Xỉn → patina, rỗ | Gãy, cong, vỡ cạnh |
| Sắt | Gò sạch → gỉ ở khớp | Gỉ lan, bong vảy | Gỉ mục, nứt |
| Da thuộc | Dẻo → sẫm, hằn nếp | Nứt, đường khâu vá | Rách, đứt đai |
| Gỗ | Vết dụng cụ → bóng tay, vết cấn | Bạc xám phong hóa, nứt chân chim | Tách, gãy, cháy sém |
| Vải / hiệu kỳ | Thớ tươi → phai, mép sờn | Bạc nắng, vá | Rách thành dải, cháy xém |
| Giấy da | Phẳng → quăn, mòn tay | Ố đốm, giòn nứt | Cháy mép, rách đôi |

---

## 5. Mẫu prompt

### Biến thể một trạng thái

```
Dựa trên bản vẽ {tên đạo cụ}, live-action photography style, ánh sáng tự nhiên, chi tiết tối đa,
{loại đạo cụ}, {mô tả vật liệu},
trạng thái hiện tại: {tên trạng thái}, {mô tả thị giác trạng thái},
{mô tả biến đổi bề mặt vật liệu},
một khung bốn ô (2x2): trên trái chính diện + trên phải bên + dưới trái mặt sau + dưới phải đặc tả chi tiết,
nền xám trung tính tinh khiết, sáng dịu đều, không bóng gắt,
vân vật liệu siêu rõ, chất liệu tả thực, chi tiết trạng thái nhận diện được,
chỉ bề mặt phong hóa sạch
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Hình thái / viền lõi nhận ra ở mọi trạng thái |
| R2 | Biến đổi trạng thái theo logic vật lý |
| R3 | Phải dùng bố cục bốn ô (2×2) |
| R4 | Phải chỉ định "nền xám trung tính tinh khiết", sáng dịu đều, không bóng gắt |
| R5 | Mọi trạng thái an toàn reference: không máu, không gore |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Biến đổi khiến đạo cụ không nhận ra |
| X2 | Hư hại phi vật lý (thiếc vỡ như thủy tinh) |
| X3 | Phá hủy quá mức không còn nhận diện |
| X4 | Vết máu, cặn gore ở mọi trạng thái |
| X5 | Hiệu ứng hư hại phát sáng / phù phép |
