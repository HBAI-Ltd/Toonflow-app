# Tạo hình ảnh đạo cụ · Sổ tay ràng buộc phong cách phẳng

---

## 1. Nguyên tắc thiết kế đạo cụ

1. **Công năng dễ đọc** — nhìn là biết đạo cụ dùng làm gì, tạo hình phục vụ công năng
2. **Mảng màu cực giản** — chất liệu bắt buộc phân biệt bằng mảng màu, cấm chi tiết phức tạp
3. **Nhất quán niên đại** — mọi đạo cụ bắt buộc hợp thế giới quan cổ phong, cấm yếu tố hiện đại
4. **Tỉ lệ rõ ràng** — gợi kích thước thật của đạo cụ qua vật đối chiếu hoặc chú thích
5. **Chỉ trưng bày riêng đạo cụ** — trong khung hình chỉ được có bản thân đạo cụ, nghiêm cấm xuất hiện bất kỳ nhân vật, bàn tay, chi thể nào, đạo cụ không được ở trạng thái bị cầm/đeo/nắm, bắt buộc trình bày độc lập theo lối bày tĩnh vật

---

## 2. Phân loại đạo cụ và ràng buộc thẩm mỹ

### 2.1 Nhóm binh khí

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Kiếm/đao/cung/thương/quạt | {loại binh khí}，binh khí cổ phong phẳng |
| Chất liệu | Mảng màu đơn sắc, vẽ bằng đường nét | kiếm phẳng、binh khí đường nét、solid color sword |
| Trang trí | Chạm khắc đường nét, trang trí mảng màu | trang trí đường nét、chạm khắc phẳng |
| Độ bóng | Không bóng, tô màu đơn sắc | không bóng、binh khí phẳng、matte sword |
| Prompt | {binh khí} cổ phong phẳng，binh khí đơn sắc，trang trí đường nét | — |

### 2.2 Nhóm trang sức

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Trâm/thoa/anh lạc/ngọc bội/vòng tay/khuyên tai | {loại trang sức}，trang sức cổ phong phẳng |
| Chất liệu | Mảng màu đơn sắc, tô một màu | trang sức phẳng、trang sức mảng màu、solid color jewelry |
| Chế tác | Đường nét gọn gàng, chế tác cực giản | chế tác phẳng、trang sức đường nét |
| Độ bóng | Không bóng, không phản quang | không bóng、trang sức phẳng、matte finish |
| Prompt | {trang sức} cổ phong phẳng，{chất liệu}，chế tác gọn gàng，trang sức đường nét | — |

### 2.3 Nhóm vật dụng đời sống

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Bộ trà/bộ rượu/lư hương/bàn cờ/thư quyển/đèn lồng | {loại vật dụng}，vật dụng cổ phong phẳng |
| Chất liệu | Mảng màu đơn sắc, vẽ bằng đường nét | vật dụng phẳng、vật dụng mảng màu、solid color object |
| Chất cảm | Phân biệt bằng mảng màu, không vân bề mặt | chất phẳng、không vân bề mặt、flat texture |
| Phong cách | Mộc mạc/sang quý tùy bối cảnh | phẳng mộc mạc / phẳng sang quý |
| Prompt | {vật dụng} cổ phong phẳng，mảng màu {chất liệu}，đường nét rõ ràng | — |

### 2.4 Nhóm tín vật/đạo cụ then chốt

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Tín vật/lệnh bài/quyển trục/lọ thuốc/ấn ngọc | {loại đạo cụ}，đạo cụ cổ phong phẳng |
| Tính đặc thù | Tạo hình phẳng hóa, dễ nhận diện | tạo hình phẳng、đạo cụ gọn gàng |
| Trạng thái | Có thể thêm vẻ cũ kiểu phẳng | vật cũ phẳng / vật mới phẳng |
| Prompt | {đạo cụ} cổ phong phẳng，mảng màu {chất liệu}，trạng thái phẳng，tạo hình gọn gàng | — |

---

## 3. Quy phạm bản vẽ nhiều góc

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Yêu cầu | Prompt |
|---|---|---|---|---|
| Trên trái | Hình chính diện | Chính diện 0° | Hình thái mặt trước đầy đủ của đạo cụ | front view |
| Trên phải | Hình nhìn nghiêng | Nghiêng 90° | Độ dày/đường viền/kết cấu rõ ràng | side view |
| Dưới trái | Hình mặt sau | Mặt sau 180° | Kết cấu/trang trí phía sau đạo cụ | back view |
| Dưới phải | Cận chi tiết | Phóng to cục bộ | Chi tiết đường nét/mảng màu | detail closeup |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Lưới bốn ô (2×2) trong cùng khung hình, bốn góc nhìn trên dưới trái phải |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Ánh sáng | Không ánh sáng đổ bóng, tô màu phẳng thuần |
| Tỉ lệ | Trong mỗi ô, đạo cụ chiếm 70%+ diện tích ô |
| Bóng đổ | Không bóng đổ, phẳng thuần |
| Tỉ lệ khung hình | Đề xuất 1:1 |

---

## 4. Ràng buộc thể hiện chất liệu

| Chất liệu | Yêu cầu thể hiện | Prompt |
|---|---|---|
| Kim loại | Tô màu đơn sắc, không phản quang | kim loại phẳng、kim loại đơn sắc、solid metal |
| Ngọc thạch | Tô màu đơn sắc, không xuyên sáng | ngọc thạch phẳng、ngọc thạch đơn sắc、solid jade |
| Gỗ | Tô màu đơn sắc, không vân gỗ | gỗ phẳng、gỗ đơn sắc、solid wood |
| Đồ sứ | Tô màu đơn sắc, không lớp men | đồ sứ phẳng、đồ sứ đơn sắc、solid porcelain |
| Vải/giấy | Tô màu đơn sắc, không thớ sợi | vải phẳng、vải đơn sắc、solid fabric |
| Đá quý | Tô màu đơn sắc, không khúc xạ | đá quý phẳng、đá quý đơn sắc、solid gem |

---

## 5. Khuôn mẫu prompt

```
bản vẽ đạo cụ cổ phong phẳng，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
{loại đạo cụ}，{mô tả chất liệu}，{mô tả chế tác/trang trí}，{mô tả trạng thái}，
trưng bày tĩnh vật chỉ có đạo cụ，đạo cụ bày độc lập，không ai cầm，không ai đeo，
lưới bốn ô (2×2) trong cùng khung hình: trên trái hình chính diện + trên phải hình nhìn nghiêng + dưới trái hình mặt sau + dưới phải cận chi tiết，
phông nền xám trung tính tinh khiết，không ánh sáng đổ bóng，không gradient，
đường nét rõ ràng，mảng màu tách bạch，{mô tả độ bóng chất liệu}
trong hình không được có bất kỳ chữ nào，
trong khung hình không được xuất hiện bất kỳ nhân vật, bàn tay, ngón tay, chi thể nào, đạo cụ không được ở trạng thái bị nắm giữ hay đeo
```

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R2 | Bắt buộc nêu rõ chất liệu và chế tác của đạo cụ (diễn đạt theo lối phẳng hóa) |
| R3 | Tạo hình đạo cụ bắt buộc hợp thế giới quan cổ phong |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Phông nền bối cảnh phức tạp |
| X2 | Đạo cụ và nhân vật trong cùng khung hình (khâu này là ảnh chỉ có đạo cụ) |
| X3 | Xuất hiện bất kỳ hình ảnh nhân vật nào, kể cả toàn thân, nửa thân, cục bộ (bàn tay, ngón tay, cánh tay hay chi thể khác) |
| X4 | Đạo cụ ở trạng thái bị cầm, nắm, đeo, đang được sử dụng |
| X5 | Xuất hiện yếu tố gợi ý có người (như vết cầm nắm, góc nhìn của người đeo, tư thế đang dùng) |
| X6 | Thêm hiệu ứng gradient/đổ bóng/highlight/cảm giác khối |
| X7 | Chất liệu quá phức tạp, mảng màu phân biệt không rõ |
| X8 | Yếu tố hiện đại, thiết kế không thuộc cổ phong |
