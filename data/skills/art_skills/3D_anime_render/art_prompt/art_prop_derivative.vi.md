# Tạo trạng thái phái sinh của đạo cụ đô thị render anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Neo bằng tạo hình** — tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái
2. **Trạng thái dễ đọc** — khác biệt giữa các trạng thái phải rõ ngay, khán giả phân biệt được lập tức
3. **Phục vụ kể chuyện** — mỗi biến thể trạng thái phục vụ một nút tình tiết cụ thể
4. **Xuống cấp dần** — trạng thái hư hại/lão hóa phải có logic vật lý hợp lý (thể hiện theo lối cel-shading)
5. **Chỉ trưng bày riêng đạo cụ** — trong khung hình chỉ được có bản thân đạo cụ, nghiêm cấm xuất hiện bất kỳ nhân vật, bàn tay, chi thể nào, đạo cụ không được ở trạng thái bị cầm/đeo/nắm, bắt buộc trình bày độc lập theo lối bày tĩnh vật

---

## 2. Các loại trạng thái

### 2.1 Trạng thái sử dụng

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Mới tinh | Nguyên vẹn không sứt mẻ, bóng như mới | Mọi đạo cụ | mới tinh、nguyên vẹn không sứt mẻ、bóng như mới |
| Dùng thường ngày | Mòn nhẹ, vết dùng tự nhiên (cel-shading hóa) | Mọi đạo cụ | vết dùng thường ngày、mòn nhẹ |
| Cũ kỹ | Rõ vẻ đã dùng, màu xỉn (cel-shading hóa) | Vật dụng/phụ kiện/đồ điện tử | vết dùng、vẻ niên đại、màu xỉn |

### 2.2 Trạng thái hư hại

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Hư nhẹ | Vết nứt nhỏ/mẻ nhỏ/mòn nhẹ (cel-shading hóa) | Thủy tinh/gốm sứ/thiết bị điện tử | vết nứt li ti、mẻ nhẹ |
| Hư nặng | Nứt rõ/gãy/vỡ (cel-shading hóa) | Thủy tinh/gốm sứ/thiết bị điện tử | vết nứt rõ、vỡ vụn、gãy |
| Mảnh vỡ | Chỉ còn một phần/mảnh vụn (cel-shading hóa) | Thủy tinh/gốm sứ/thiết bị điện tử | mảnh vỡ、mảnh vụn、chỉ còn nửa phần |

### 2.3 Trạng thái đặc biệt

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Đang sạc/đang chạy | Màn hình sáng/đèn báo (cel-shading hóa) | Thiết bị điện tử | màn hình sáng、đèn báo đang chạy |
| Ngấm nước/ẩm ướt | Vết nước, phản quang ẩm ướt (cel-shading hóa) | Thiết bị điện tử/giấy | ngấm nước、bề mặt ẩm ướt、phản quang |
| Hỏng màn hình | Màn hình nứt/hiển thị lỗi | Thiết bị điện tử | màn hình nứt、hiển thị lỗi |
| Cạn pin | Đèn báo tắt/biểu tượng pin | Thiết bị điện tử | cạn pin、đèn báo tắt |
| Cất giữ/mang theo | Túi đựng/hộp đựng | Phụ kiện/thiết bị điện tử | túi đựng、hộp đựng |

---

## 3. Quy phạm khung hình cho biến thể trạng thái

### Ảnh một trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Phông nền | Xám trung tính tinh khiết #E8E8E8 (giống bản vẽ gốc) |
| Ánh sáng | Chiếu sáng đều, không bóng gắt |
| Góc | Giống hình chính diện của bản vẽ gốc |
| Tỉ lệ | Đạo cụ chiếm 70%+ khung hình |

### Ảnh đối chiếu trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Trưng bày 2-3 trạng thái cạnh nhau trong cùng khung hình |
| Chú thích | Ghi tên trạng thái bên dưới mỗi trạng thái |
| Nhất quán | Góc/ánh sáng/phông nền hoàn toàn giống nhau, chỉ khác trạng thái |

---

## 4. Quy tắc biến đổi chất liệu theo trạng thái

| Chất liệu | Mới tinh → thường ngày | Thường ngày → cũ kỹ | Biểu hiện hư hại (cel-shading hóa) |
|---|---|---|---|
| Kim loại | Bóng sáng → xước nhẹ | Xước → màu xỉn đi | Mẻ/quăn mép/gãy (xử lý cel-shading) |
| Thủy tinh | Độ trong → xước nhẹ | Xước → mòn bề mặt | Nứt/vỡ vụn/mẻ góc (xử lý cel-shading) |
| Nhựa | Trơn láng → xước nhẹ | Xước → màu xỉn | Nứt tách/gãy/mòn (xử lý cel-shading) |
| Da | Trơn láng → nếp gấp tự nhiên | Nếp gấp → màu xỉn | Mòn/nứt/phai màu (xử lý cel-shading) |
| Giấy | Phẳng phiu → nhàu nhẹ | Nhàu → ố vàng | Rách/mòn/mực loang (xử lý cel-shading) |

---

## 5. Khuôn mẫu prompt

### Biến thể một trạng thái

```
dựa trên bản vẽ {tên đạo cụ}，render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，
anime style, cel-shaded, 3D animation render,
{loại đạo cụ}，{mô tả chất liệu}，
trạng thái hiện tại: {tên trạng thái}，{mô tả hình ảnh của trạng thái}，
{mô tả biến đổi bề mặt chất liệu}，(xử lý cel-shading)
trưng bày tĩnh vật chỉ có đạo cụ，đạo cụ bày độc lập，không ai cầm，không ai đeo，
lưới bốn ô (2×2) trong cùng khung hình: trên trái hình chính diện(front view) + trên phải hình nhìn nghiêng(side view) + dưới trái hình mặt sau(back view) + dưới phải cận chi tiết(detail closeup)，
phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không bóng gắt，
vân chất liệu rõ ràng，render cel-shading，chi tiết trạng thái nhận ra được，xử lý cel-shading，
8K siêu nét，bố cục điện ảnh，
trong hình không được có bất kỳ chữ nào，
trong khung hình không được xuất hiện bất kỳ nhân vật, bàn tay, ngón tay, chi thể nào, đạo cụ không được ở trạng thái bị nắm giữ hay đeo
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái |
| R2 | Biến đổi trạng thái phải hợp logic vật lý (cel-shading hóa) |
| R3 | Bắt buộc dùng bố cục lưới bốn ô (2×2): trên trái hình chính diện + trên phải hình nhìn nghiêng + dưới trái hình mặt sau + dưới phải cận chi tiết |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết", ánh sáng dịu đều, không bóng gắt |
| R5 | Bắt buộc chứa từ khóa render anime 3D (cel-shaded, 3D animation render, anime style) |
| R6 | Bắt buộc chứa từ khóa 8K siêu nét, bố cục điện ảnh |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Sau khi đổi trạng thái, đạo cụ không còn nhận ra được |
| X2 | Hư hại trái logic vật lý (đồ điện tử bị gỉ sét...) |
| X3 | Mô tả hư hại quá đẫm máu/rùng rợn (trong giới hạn của lối cel-shading) |
| X4 | Xuất hiện bất kỳ hình ảnh nhân vật nào, kể cả toàn thân, nửa thân, cục bộ (bàn tay, ngón tay, cánh tay hay chi thể khác) |
| X5 | Đạo cụ ở trạng thái bị cầm, nắm, đeo, đang được sử dụng |
| X6 | Xuất hiện yếu tố gợi ý có người (như vết cầm nắm, góc nhìn của người đeo, tư thế đang dùng) |
| X7 | Dùng thuật ngữ nhiếp ảnh tả thực (như real photography, photorealistic, RAW photo...) |
| X8 | Vân hư hại tả thực quá mức, phá vỡ tính nhất quán của phong cách cel-shading |
| X9 | Yếu tố cổ đại/tương lai, không thuộc phong cách đô thị hiện đại |