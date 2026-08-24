# Phong cách anime Nhật retro thập niên 90 - Tạo trạng thái phái sinh của đạo cụ · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Neo tạo hình** — tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái
2. **Trạng thái đọc được** — khác biệt giữa các trạng thái bắt buộc nhìn là thấy ngay
3. **Phục vụ kể chuyện** — mỗi biến thể trạng thái phục vụ một nút tình tiết cụ thể
4. **Xuống cấp dần** — trạng thái hư hại/lão hóa phải có logic vật lý hợp lý
5. **Chỉ trưng bày riêng đạo cụ** — trong khung hình chỉ được có bản thân đạo cụ, nghiêm cấm xuất hiện bất kỳ nhân vật, bàn tay, chi thể nào

---

## 2. Các loại trạng thái

### 2.1 Trạng thái sử dụng

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Mới tinh | Nguyên vẹn, ánh bóng như mới | Mọi đạo cụ | mới tinh、nguyên vẹn |
| Dùng thường ngày | Mòn nhẹ, lên nước tự nhiên | Vũ khí/vật dụng/trang sức | dấu vết dùng thường ngày、mòn nhẹ |
| Cũ kỹ | Cảm giác thời gian rõ, màu xỉn | Vật dụng/tín vật/cuộn thư | cũ kỹ、cảm giác thời gian |

### 2.2 Trạng thái hư hại

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Hư nhẹ | Vết nứt nhỏ/sứt nhỏ/mòn nhẹ | Đồ sứ/ngọc bội/vũ khí | vết nứt li ti、sứt nhẹ |
| Vỡ hỏng | Nứt rõ/gãy/vỡ | Đồ sứ/trang sức/vũ khí | vết nứt rõ、vỡ nát |
| Mảnh vỡ | Chỉ còn một phần/mảnh vụn | Đồ sứ/ngọc bội/tín vật | mảnh vỡ、mảnh vụn |

### 2.3 Trạng thái đặc biệt

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Dính máu | Vết máu bám lại | Vũ khí/tín vật | vết máu、dính máu |
| Ngấm nước/ẩm ướt | Vệt nước, phản quang ẩm | Cuộn thư/tín vật/quần áo | ngấm nước、ẩm ướt |
| Cháy/sém | Mép cháy đen, vết lửa đốt | Cuộn thư/tín vật/đồ gỗ | mép cháy đen、vết lửa đốt |
| Phát sáng/kích hoạt | Năng lượng bên trong, tỏa hào quang | Tín vật/pháp khí/ngọc | phát sáng nhè nhẹ、ánh sáng ẩn bên trong |
| Bọc/niêm cất | Bọc trong vải/hộp | Tín vật/trang sức/vật bí mật | bọc lại、niêm cất |

---

## 3. Quy phạm khung hình cho biến thể trạng thái

### Ảnh một trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Phông nền | Trắng ngà tông ấm #F8F4E8 (giống bản vẽ gốc) |
| Ánh sáng | Ánh sáng điện ảnh dịu, chiếu đều, không bóng đổ gắt |
| Góc | Giống hình chính diện của bản vẽ gốc |
| Tỉ lệ | Đạo cụ chiếm 70%+ khung hình |

### Ảnh đối chiếu trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bày cạnh nhau 2-3 trạng thái trong cùng một khung hình |
| Chú thích | Ghi tên trạng thái bên dưới mỗi trạng thái |
| Nhất quán | Góc/ánh sáng/phông nền hoàn toàn giống nhau, chỉ khác trạng thái |

---

## 4. Quy tắc biến đổi trạng thái theo vật liệu

| Vật liệu | Mới tinh → thường ngày | Thường ngày → cũ kỹ | Biểu hiện hư hại |
|---|---|---|---|
| Kim loại | Ánh bóng → lên nước nhẹ | Lên nước → đốm gỉ | Sứt/quăn lưỡi/gãy |
| Ngọc | Trong và ôn nhuận → mòn nhẹ | Mòn → nứt nhỏ trên bề mặt | Nứt/vỡ/mẻ góc |
| Gỗ | Vân gỗ mới → lên nước tự nhiên | Lên nước → màu xỉn đi | Nứt/gãy/mối mọt |
| Đồ sứ | Men bóng → xước nhẹ | Xước → men xỉn | Nứt/vỡ/sứt |
| Vải/giấy | Mới tinh phẳng phiu → nhàu nhẹ | Nhàu → ố vàng giòn | Rách/cháy sém |

---

## 5. Khuôn mẫu prompt

### Biến thể một trạng thái

```
dựa trên bản vẽ {tên đạo cụ}，phong cách anime Nhật retro thập niên 90，vẽ tay tô màu phẳng，tông ấm dịu，
{loại đạo cụ}，{mô tả vật liệu}，
trạng thái hiện tại: {tên trạng thái}，{mô tả thị giác của trạng thái}，
{mô tả thay đổi bề mặt vật liệu}，
chỉ trưng bày tĩnh vật đạo cụ，đạo cụ bày riêng，không ai cầm，không ai đeo，
lưới bốn ô (2×2) trong cùng khung hình: trên trái hình chính diện(front view) + trên phải hình nhìn nghiêng(side view) + dưới trái hình mặt sau(back view) + dưới phải cận chi tiết(detail closeup)，
phông nền trắng ngà tông ấm，ánh sáng điện ảnh dịu，tản đều，không bóng đổ gắt，
vân vật liệu siêu rõ，chất vẽ tay，chi tiết trạng thái phân biệt được
trong hình không được có bất kỳ chữ nào，
trong khung hình không được xuất hiện bất kỳ nhân vật, bàn tay, ngón tay, chi thể nào, đạo cụ không được ở trạng thái bị nắm hoặc bị đeo
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái |
| R2 | Biến đổi trạng thái phải hợp logic vật lý |
| R3 | Bắt buộc dùng bố cục lưới bốn ô (2×2) |
| R4 | Bắt buộc chỉ định "phông nền trắng ngà tông ấm", ánh sáng điện ảnh dịu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Đạo cụ không còn nhận ra được sau khi đổi trạng thái |
| X2 | Hư hại trái logic vật lý |
| X3 | Mô tả hư hại quá đẫm máu/rùng rợn |
| X4 | Xuất hiện bất kỳ hình ảnh nhân vật nào |
| X5 | Đạo cụ ở trạng thái bị cầm, bị nắm, bị đeo, đang được sử dụng |
| X6 | Xuất hiện yếu tố ám chỉ có người |
