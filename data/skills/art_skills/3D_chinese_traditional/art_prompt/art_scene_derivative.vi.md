---
name: art_scene_derivative
description: Tạo tài nguyên bối cảnh phái sinh · sổ tay ràng buộc
metaData: art_skills
---

# Tạo tài nguyên bối cảnh phái sinh · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Nhất quán không gian** — kết cấu kiến trúc/bố trí/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh phục vụ các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển thời điểm** — cùng một không gian cho không khí ánh sáng khác nhau ở các thời điểm khác nhau trong ngày
4. **Biến đổi thời tiết** — cùng một không gian cho cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Lấy 3D làm neo** — mọi biến thể bắt buộc giữ chất render 3D, từ chối chất texture phẳng/hoạt hình CG; giữ ánh sáng thể tích, ambient occlusion, xóa phông theo chiều sâu

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại viễn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Thiết lập không gian, định vị | extreme wide shot、大全景 |
| Toàn cảnh (全景) | Bối cảnh hiện ra đầy đủ | Cho thấy kết cấu không gian | wide shot、全景 |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot、中景 |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | close shot、近景 |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân chất liệu/đạo cụ then chốt | extreme closeup、特写 |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố trí tổng thể | Góc nhìn thu hẹp, thêm lớp trước |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp tập trung, chiều sâu trường ảnh đổi |
| 中景 → 近景 | Chất liệu, tông màu | Chiều sâu trường ảnh nông, phông mờ |
| 近景 → 特写 | Vân chất liệu | Chiều sâu trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể theo thời điểm

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sớm mai | Sương mỏng ánh dịu, tông màu nóng lạnh đan xen | ánh mai hửng nhẹ、sương sớm mai |
| Chính ngọ | Sáng, bóng ngắn, màu sắc tươi rõ | nắng chính ngọ、ánh sáng rực rỡ |
| Hoàng hôn | Tông vàng, bóng dài, trời chuyển sắc | ánh vàng chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, tĩnh mịch lạnh lẽo | ánh trăng trong、moonlight |
| Ban đêm (ánh đèn) | Điểm xuyết vàng ấm, tương phản sáng tối | đèn lửa thưa thớt、ánh nến lấp lánh |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố trí/chất liệu | Tông trời ấm lên, bóng kéo dài |
| Ban ngày → ban đêm | Công trình/bố trí/chất liệu | Tổng thể tối đi, thêm không khí đèn lửa/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, đồ nội thất | Tông tổng thể ấm lên, thêm yếu tố ánh nến/đèn lồng |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng, bóng rõ | trời quang muôn dặm、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng gắt | ánh dịu trời âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng lan tỏa、sương quẩn quanh |
| Mưa phùn | Hạt nước, phản quang ẩm, sợi mưa | mưa phùn như tơ、màn mưa như the mỏng |
| Tuyết bay | Phủ trắng, bông tuyết rơi | tuyết bay lả tả、khoác áo bạc trắng |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố trí | Thêm lớp sương, cảnh xa mờ đi, giảm độ bão hòa |
| Nắng → mưa phùn | Công trình/bố trí | Thêm sợi mưa, mặt đất phản quang, tông màu ngả lạnh |
| Nắng → tuyết bay | Công trình/bố trí | Thêm tuyết đọng, bông tuyết, tông màu ngả trắng |
| Cây cỏ phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đóng sương trong tuyết |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc đích, file này chỉ định nghĩa từ vựng về góc và các ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, hướng nhìn quay về mặt trước của bối cảnh | front view、eye level |
| Nhìn nghiêng (trái/phải) | Nhìn ngang 90° về phía trái/phải của bối cảnh | left side view / right side view |
| Mặt sau/nhìn sau | 180° về phía sau của bối cảnh | back view |
| Nhìn chúc | Nhìn xuống từ vị trí cao, cho thấy bố trí tổng thể | high angle、bird's eye view |
| Nhìn ngước | Nhìn lên từ vị trí thấp, nhấn mạnh chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc tùy ý do bên gọi định nghĩa | tiêm theo `{góc đích}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với tham chiếu | Kết cấu kiến trúc/bố trí/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc giống ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm bối cảnh, chỉ chuyển góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi chuyển góc phải tính lại hướng đổ bóng cho khớp (giữ hợp lý về vật lý) |
| Bố cục | Một khung hình (không ghép ảnh, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

ảnh bối cảnh phái sinh cổ trang，dựa trên ảnh tham chiếu，
phong cách render 3D，tạo mô hình độ chính xác cao，chất liệu PBR，3D Quốc phong，ánh sáng đẳng cấp điện ảnh，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
chất render 3D，ánh sáng thể tích，chiếu sáng tự nhiên，sáng tối theo vật lý，
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
giữ kết cấu không gian của bối cảnh nhất quán，
{góc đích (nếu có)}, {góc nhìn theo cỡ cảnh (nếu có)}, {mô tả thời điểm (nếu có)}, {mô tả thời tiết (nếu có)},
{lớp trước}, {lớp giữa}, {lớp sau},
{mô tả tông màu}, {mô tả chiều sâu trường ảnh (nếu có)}, {biến đổi tông trời (nếu có)}, {điều chỉnh không khí (nếu có)},
{đặc trưng thị giác của thời tiết (nếu có)}, {biến đổi bề mặt chất liệu (nếu có)}, {mô tả thích ứng của cây cỏ (nếu có)},
dấu mòn tự nhiên trên chất liệu，nước bóng năm tháng，rêu phong hóa，vải rủ nếp tự nhiên，
ánh sáng thể tích，ambient occlusion，ánh sáng tự nhiên khuếch tán，sáng tối dịu，
phối cảnh không khí，chi tiết vân bề mặt siêu rõ，
bố cục một khung hình，giữ kết cấu kiến trúc/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu，chỉ chuyển điểm nhìn theo góc đích，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào

> **Hướng dẫn sử dụng**: tự phán đoán từ thông tin người dùng cung cấp xem cần áp dụng chiều biến đổi nào (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và bỏ qua trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng cây cỏ/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép nhiều hướng nhìn/lưới ô/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu kiến trúc/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ chuyển điểm nhìn theo góc được chỉ định |
| R6 | Trong ảnh bối cảnh **nghiêm cấm xuất hiện bất kỳ nhân vật nào** |
| R7 | Tự phán đoán chiều biến đổi từ thông tin người dùng cung cấp (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và bỏ qua |
| R8 | Bắt buộc chứa từ khóa render 3D (3D rendered / volumetric lighting / PBR materials) |
| R9 | Bắt buộc chứa đặc trưng quang học ống kính (ít nhất một trong depth of field / lens vignette / bokeh) |
| R10 | Chất liệu bắt buộc có dấu mòn tự nhiên/dấu ấn năm tháng, cấm "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu kiến trúc/bố trí không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè tuyết bay...) |
| X3 | Chất liệu/phong cách đổi đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, hình bóng hay đường viền cơ thể người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới ô/chia màn |
| X6 | Tạo mô hình độ chính xác thấp/texture thô/chất liệu nhựa (cấm các từ low-poly, rough modeling...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có dấu vết sử dụng và dấu ấn năm tháng (tránh "cảm giác nhựa") |
| X8 | Chiếu sáng quá đều quá phẳng, không xóa phông theo chiều sâu, không có đặc trưng quang học ống kính |
