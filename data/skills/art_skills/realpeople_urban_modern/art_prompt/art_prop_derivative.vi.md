# Tạo trạng thái phái sinh của đạo cụ · Sổ tay ràng buộc (bản người thật đô thị)

---

## 1. Nguyên tắc phái sinh

1. **Neo tạo hình** — tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái
2. **Trạng thái đọc được** — khác biệt giữa các trạng thái bắt buộc nhìn là thấy, khán giả phân biệt được ngay
3. **Phục vụ kể chuyện** — mỗi biến thể trạng thái phục vụ một nút tình tiết cụ thể
4. **Xuống cấp dần** — trạng thái hư hại/lão hóa phải có logic vật lý hợp lý

---

## 2. Các loại trạng thái

### 2.1 Trạng thái sử dụng

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Mới tinh | Nguyên vẹn không hư hại, bóng như mới | Mọi đạo cụ | mới tinh、nguyên vẹn không hư hại、bóng như mới |
| Dùng thường ngày | Mòn nhẹ, dấu vết tự nhiên | Sản phẩm điện tử/đồ dùng sinh hoạt | dấu vết dùng thường ngày、mòn tự nhiên |
| Cũ kỹ | Dấu vết sử dụng rõ, lão hóa | Đồ da/đồ dệt | dấu vết sử dụng、lão hóa tự nhiên |

### 2.2 Trạng thái hư hại

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Hư nhẹ | Xước nhỏ/nứt nhỏ | Điện thoại/laptop | xước li ti、nứt nhẹ |
| Hư hỏng | Nứt rõ/gãy | Sản phẩm điện tử/đồ thủy tinh | vết nứt rõ、vỡ |
| Mảnh vụn | Chỉ còn một phần/mảnh vỡ | Đồ thủy tinh/gốm sứ | mảnh vụn、mảnh vỡ |

### 2.3 Trạng thái đặc biệt

| Trạng thái | Mô tả | Đạo cụ áp dụng | Prompt |
|---|---|---|---|
| Vết bẩn | Vết bẩn bám | Mọi đạo cụ | vết bẩn、dơ |
| Vết nước | Vết nước, phản quang ẩm | Đồ giấy/đồ dệt | vết nước、dấu ẩm |
| Vết xước | Vết xước rõ | Kim loại/thủy tinh | vết xước rõ、vết cào |
| Mài mòn | Mòn bề mặt | Da/đồ dệt | dấu mài mòn、lão hóa |
| Màn hình vỡ | Màn hình vỡ nát | Sản phẩm điện tử | màn hình vỡ nát、vết nứt |

---

## 3. Quy phạm khung hình cho biến thể trạng thái

### Hình một trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Phông nền | Xám trung tính tinh khiết #E8E8E8 (giống bản vẽ thiết định) |
| Ánh sáng | Chiếu sáng đều, không đổ bóng gắt |
| Góc | Giống hình chính diện của bản vẽ thiết định gốc |
| Tỉ lệ | Đạo cụ chiếm 70%+ khung hình |

### Hình đối chiếu trạng thái

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Trưng bày 2-3 trạng thái cạnh nhau trong cùng khung hình |
| Chú thích | Ghi tên trạng thái bên dưới mỗi trạng thái |
| Nhất quán | Góc/ánh sáng/phông nền hoàn toàn giống nhau, chỉ khác trạng thái |

---

## 4. Quy tắc biến đổi trạng thái theo chất liệu

| Chất liệu | Mới tinh → thường ngày | Thường ngày → cũ kỹ | Biểu hiện hư hại |
|---|---|---|---|
| Kim loại | Bóng sáng → xước nhẹ | Xước → đốm oxy hóa | Móp/cong/gãy |
| Thủy tinh | Trong suốt → xước nhẹ | Xước → nứt rõ | Vỡ/sứt |
| Nhựa | Bóng mới → mòn nhẹ | Mòn → phai màu | Nứt/biến dạng |
| Da | Nhẵn → nhăn nhẹ | Nếp nhăn → nứt | Rách/mài mòn |
| Đồ dệt | Mới tinh → nhăn nhẹ | Nếp nhăn → phai màu | Rách/vết bẩn |

---

## 5. Khuôn mẫu prompt

### Biến thể một trạng thái

```

dựa trên bản vẽ thiết định của {tên đạo cụ}，phong cách nhiếp ảnh người thật tả thực，ánh sáng tự nhiên，chi tiết tối đa，
{loại đạo cụ}，{mô tả chất liệu}，
trạng thái hiện tại: {tên trạng thái}，{mô tả thị giác của trạng thái}，
{mô tả biến đổi bề mặt chất liệu}，
lưới bốn ô (2×2) trong cùng khung hình: trên trái hình chính diện + trên phải hình nhìn nghiêng + dưới trái hình mặt sau + dưới phải cận chi tiết，
phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không đổ bóng gắt，
vân chất liệu cực sắc nét，chất liệu tả thực，chi tiết trạng thái phân biệt được

```


---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Tạo hình/đường viền cốt lõi của đạo cụ vẫn nhận ra được ở mọi trạng thái |
| R2 | Biến đổi trạng thái phải hợp logic vật lý |
| R3 | Bắt buộc dùng bố cục lưới bốn ô (2×2) |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết", ánh sáng dịu đều, không đổ bóng gắt |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Sau khi đổi trạng thái, đạo cụ không nhận ra được |
| X2 | Hư hại vi phạm logic vật lý (như kim loại gỉ sét) |
| X3 | Hư hại quá mức khiến không nhận ra được |
