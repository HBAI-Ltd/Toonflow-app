# Tạo hình ảnh đạo cụ đô thị render anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc thiết kế đạo cụ

1. **Công năng dễ đọc** — nhìn là biết đạo cụ dùng làm gì, tạo hình phục vụ công năng
2. **Chất liệu tới hạn** — vân chất liệu bắt buộc rõ ràng dễ nhận (kim loại/thủy tinh/nhựa/gỗ/vải), nhưng được render cel-shading giản lược vừa phải
3. **Nhất quán niên đại** — mọi đạo cụ bắt buộc hợp thế giới quan đô thị hiện đại, cấm yếu tố cổ đại/tương lai
4. **Tỉ lệ rõ ràng** — gợi kích thước thật của đạo cụ qua vật đối chiếu hoặc chú thích
5. **Chỉ trưng bày riêng đạo cụ** — trong khung hình chỉ được có bản thân đạo cụ, nghiêm cấm xuất hiện bất kỳ nhân vật, bàn tay, chi thể nào, đạo cụ không được ở trạng thái bị cầm/đeo/nắm, bắt buộc trình bày độc lập theo lối bày tĩnh vật

---

## 2. Phân loại đạo cụ và ràng buộc thẩm mỹ

### 2.1 Nhóm văn phòng phẩm

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Sổ tay/bút máy/kẹp hồ sơ/máy tính bỏ túi | {loại đạo cụ}，văn phòng phẩm đô thị |
| Chất liệu | Nhựa/kim loại/giấy | chất liệu hiện đại、chất cảm đô thị |
| Trang trí | Thiết kế tối giản, dấu hiệu thương hiệu | thiết kế tối giản、phong cách đô thị |
| Độ bóng | Bóng vừa phải, phản quang rõ | bóng vừa phải、phản quang rõ |
| Prompt | {đạo cụ} đô thị render anime 3D，chất liệu hiện đại，thiết kế tối giản | — |

### 2.2 Nhóm vật dụng đời sống

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Cốc cà phê/cốc nước/bộ đồ ăn/đèn | {loại vật dụng}，vật dụng đời sống đô thị |
| Chất liệu | Thủy tinh/gốm sứ/kim loại/nhựa | chất thủy tinh、thiết kế hiện đại |
| Chất cảm | Bề mặt trơn láng, chất liệu rõ ràng | bề mặt trơn láng、chất liệu rõ ràng |
| Phong cách | Tối giản/hiện đại tùy bối cảnh | tối giản hiện đại / phong cách đô thị |
| Prompt | {vật dụng} đô thị render anime 3D，chất cảm {chất liệu}，vân bề mặt rõ | — |

### 2.3 Nhóm thiết bị điện tử

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Điện thoại/máy tính bảng/tai nghe/máy ảnh | {loại thiết bị}，thiết bị điện tử đô thị |
| Chất liệu | Kim loại/thủy tinh/nhựa | chất liệu thiết bị hiện đại、chất cảm trơn láng |
| Chế tác | Chế tác tinh xảo, thiết kế thương hiệu | chế tác tinh xảo、thiết kế thương hiệu |
| Độ bóng | Phản quang vừa phải, hiệu ứng màn hình phát sáng | phản quang vừa phải、màn hình phát sáng |
| Prompt | {thiết bị} đô thị render anime 3D，chất liệu hiện đại，hiệu ứng màn hình phát sáng | — |

### 2.4 Nhóm phụ kiện trang phục

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Kính/đồng hồ/túi xách/móc khóa | {loại phụ kiện}，phụ kiện trang phục đô thị |
| Chất liệu | Kim loại/da/vải dệt/thủy tinh | chất da、chất kim loại |
| Chế tác | Chế tác thương hiệu, thiết kế tinh xảo | chế tác thương hiệu、thiết kế tinh xảo |
| Độ bóng | Bóng vừa phải, dấu hiệu thương hiệu rõ | bóng vừa phải、dấu hiệu thương hiệu rõ |
| Prompt | {phụ kiện} đô thị render anime 3D，{chất liệu}，thiết kế thương hiệu | — |

---

## 3. Quy phạm bản vẽ nhiều góc

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Yêu cầu | Prompt |
|---|---|---|---|---|
| Trên trái | Hình chính diện | Chính diện 0° | Hình thái mặt trước đầy đủ của đạo cụ | front view |
| Trên phải | Hình nhìn nghiêng | Nghiêng 90° | Độ dày/đường viền/kết cấu rõ ràng | side view |
| Dưới trái | Hình mặt sau | Mặt sau 180° | Kết cấu/trang trí phía sau đạo cụ | back view |
| Dưới phải | Cận chi tiết | Phóng to cục bộ | Vân chất liệu/chi tiết chế tác | detail closeup |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Lưới bốn ô (2×2) trong cùng khung hình, bốn góc nhìn trên dưới trái phải |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Ánh sáng | Ánh sáng dịu đều, không bóng gắt |
| Tỉ lệ | Trong mỗi ô, đạo cụ chiếm 70%+ diện tích ô |
| Bóng đổ | Cho phép bóng nhẹ tự nhiên trên mặt sàn (xử lý theo lối cel-shading) |
| Tỉ lệ khung hình | Đề xuất 1:1 |

---

## 4. Ràng buộc thể hiện chất liệu

| Chất liệu | Yêu cầu thể hiện | Prompt |
|---|---|---|
| Kim loại | Phản quang/highlight/ánh lạnh (xử lý cel-shading), vết xước hơi thấy | chất kim loại、độ bóng cel-shading、phản quang rõ |
| Thủy tinh | Độ trong/khúc xạ/quầng sáng (cel-shading giản lược) | chất thủy tinh、độ trong rõ ràng |
| Nhựa | Bề mặt trơn láng/phản quang nhẹ | chất nhựa、bề mặt trơn láng |
| Da | Vân rõ ràng/nếp gấp tự nhiên | chất da、vân tự nhiên |
| Giấy | Vân bề mặt/nếp gấp nhẹ | chất giấy、vân bề mặt |
| Vải dệt | Chất thớ sợi/nếp gấp tự nhiên | chất vải dệt、vân tự nhiên |

---

## 5. Khuôn mẫu prompt

```
render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，bản vẽ đạo cụ，
anime style, cel-shaded, 3D animation render,
{loại đạo cụ}，{mô tả chất liệu}，{mô tả chế tác/trang trí}，{mô tả trạng thái}，
trưng bày tĩnh vật chỉ có đạo cụ，đạo cụ bày độc lập，không ai cầm，không ai đeo，
lưới bốn ô (2×2) trong cùng khung hình: trên trái hình chính diện + trên phải hình nhìn nghiêng + dưới trái hình mặt sau + dưới phải cận chi tiết，
phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không bóng gắt，
vân chất liệu rõ ràng，render cel-shading，{mô tả độ bóng chất liệu}，phong cách đô thị hoạt hình hiện đại，
8K siêu nét，bố cục điện ảnh，
trong hình không được có bất kỳ chữ nào，
trong khung hình không được xuất hiện bất kỳ nhân vật, bàn tay, ngón tay, chi thể nào, đạo cụ không được ở trạng thái bị nắm giữ hay đeo
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R2 | Bắt buộc nêu rõ chất liệu và chế tác của đạo cụ |
| R3 | Tạo hình đạo cụ bắt buộc hợp thế giới quan đô thị hiện đại |
| R4 | Bắt buộc chứa từ khóa render anime 3D (cel-shaded, 3D animation render, anime style) |
| R5 | Bắt buộc chứa từ khóa 8K siêu nét, bố cục điện ảnh |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Phông nền bối cảnh phức tạp |
| X2 | Đạo cụ và nhân vật trong cùng khung hình (khâu này là ảnh chỉ có đạo cụ) |
| X3 | Xuất hiện bất kỳ hình ảnh nhân vật nào, kể cả toàn thân, nửa thân, cục bộ (bàn tay, ngón tay, cánh tay hay chi thể khác) |
| X4 | Đạo cụ ở trạng thái bị cầm, nắm, đeo, đang được sử dụng |
| X5 | Xuất hiện yếu tố gợi ý có người (như vết cầm nắm, góc nhìn của người đeo, tư thế đang dùng) |
| X6 | Dùng thuật ngữ nhiếp ảnh tả thực (như real photography, photorealistic, RAW photo...) |
| X7 | Vân chất liệu tả thực quá mức, phá vỡ tính nhất quán của phong cách cel-shading |
| X8 | Yếu tố cổ đại/tương lai, không thuộc phong cách đô thị hiện đại |