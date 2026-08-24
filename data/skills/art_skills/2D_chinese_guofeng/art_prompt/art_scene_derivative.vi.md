---
name: art_scene_derivative
description: Tạo tài nguyên phái sinh bối cảnh · Sổ tay ràng buộc
metaData: art_skills
---

# Tạo tài nguyên phái sinh bối cảnh · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Không gian nhất quán** — kết cấu công trình/bố cục/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh phục vụ các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển thời điểm** — cùng một không gian cho ra không khí ánh sáng khác nhau ở các thời điểm khác nhau
4. **Đổi thời tiết** — cùng một không gian cho ra cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Lấy anime làm neo** — mọi biến thể bắt buộc giữ chất anime Quốc phong, khước từ cảm giác 3D tả thực/hoạt hình CG; giữ đường nét tinh tế, tô màu phẳng kiểu cel, render kiểu Nhật

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Dựng cảm giác không gian, định vị | extreme wide shot、大全景 |
| Toàn cảnh (全景) | Bối cảnh hiện đầy đủ | Cho thấy kết cấu không gian | wide shot、全景 |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot、中景 |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | close shot、近景 |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân chất liệu/đạo cụ then chốt | extreme closeup、特写 |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố cục tổng thể | Góc nhìn thu hẹp, thêm lớp trước |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp tập trung, đổi độ sâu trường ảnh |
| 中景 → 近景 | Chất liệu, tông màu | Trường ảnh nông, phông nền xóa mờ |
| 近景 → 特写 | Vân chất liệu | Trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể theo thời điểm

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Sương mỏng ánh dịu, tông đan xen lạnh ấm | ánh mai hửng nhẹ、sương sớm mai |
| Giữa trưa | Sáng rõ, bóng ngắn, màu sắc tươi rõ | nắng giữa trưa、ánh sáng chói rõ |
| Hoàng hôn | Tông vàng kim, bóng dài, trời chuyển sắc | ráng vàng chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, u tĩnh lạnh trong | ánh trăng trong sáng、moonlight |
| Ban đêm (đèn lửa) | Điểm xuyết vàng ấm, tương phản sáng tối | đèn lửa thưa dần、ánh nến lấm tấm |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Tông trời ấm lên, bóng kéo dài |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Tối đi toàn cục, thêm không khí đèn lửa/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, đồ đạc | Tông màu tổng thể ấm lên, thêm yếu tố nến/đèn lồng |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng rõ, bóng rõ nét | trời quang muôn dặm、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng cứng | ánh dịu trời âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng giăng、hơi sương lởn vởn |
| Mưa phùn | Giọt nước, phản quang ẩm, sợi mưa | mưa phùn như tơ、màn mưa mỏng như the |
| Tuyết bay | Phủ trắng, hoa tuyết rơi | tuyết bay lất phất、khoác áo bạc trắng tinh |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh xa mờ dần, giảm độ bão hòa |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, mặt đất phản quang, tông thiên lạnh |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, hoa tuyết, tông thiên trắng |
| Cây cỏ phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đọng sương giá trong tuyết |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc mục tiêu; file này chỉ định nghĩa từ vựng về góc và các ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, tầm nhìn hướng vào mặt trước bối cảnh | front view、eye level |
| Nhìn nghiêng (trái/phải) | Nhìn ngang về phía trái/phải bối cảnh 90° | left side view / right side view |
| Mặt sau/nhìn sau | Hướng về mặt sau bối cảnh 180° | back view |
| Nhìn từ trên xuống | Nhìn bao quát từ vị trí cao, cho thấy bố cục tổng thể | high angle、bird's eye view |
| Nhìn từ dưới lên | Ngước nhìn từ vị trí thấp, nhấn vào chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào một phần | push-in、closer angle |
| Góc tự do | Mô tả góc tùy ý do bên gọi tự định | tiêm theo `{góc mục tiêu}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với tham chiếu | Kết cấu công trình/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc khớp với ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm bối cảnh, chỉ đổi góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu giữ nguyên, sau khi đổi góc phải tính lại đồng bộ hướng đổ của ánh sáng và bóng (giữ hợp lý về vật lý) |
| Bố cục | Một khung hình duy nhất (không ghép ảnh, không đa hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền thân người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo bên gọi chỉ định) |

---

## 6. Khuôn mẫu prompt

ảnh bối cảnh phái sinh anime Quốc phong，dựa trên ảnh tham chiếu，
anime Quốc phong，thẩm mỹ Tân Quốc triều，render anime kiểu Nhật，tô màu phẳng kiểu cel，nét vẽ tinh tế，
Japanese anime style, cel shading, fine brushstrokes,
giữ kết cấu không gian của bối cảnh nhất quán，
{góc mục tiêu (nếu có)}, {góc nhìn theo cỡ cảnh (nếu có)}, {mô tả thời điểm (nếu có)}, {mô tả thời tiết (nếu có)},
{lớp trước}, {lớp giữa}, {lớp sau},
{mô tả tông màu}, {mô tả trường ảnh (nếu có)}, {biến đổi tông màu bầu trời (nếu có)}, {điều chỉnh không khí (nếu có)},
{đặc trưng thị giác của thời tiết (nếu có)}, {biến đổi bề mặt chất liệu (nếu có)}, {mô tả thích ứng cây cỏ (nếu có)},
dấu mòn tự nhiên trên chất liệu，nước bóng của năm tháng，vải rủ nếp tự nhiên，
ánh sáng đổ bóng dịu，render kiểu Nhật，ánh sáng tự nhiên tán xạ，chất liệu tinh tế，
render độ nét cao anime Quốc phong，chi tiết cao，đường nét tinh tế，cảm giác tô màu phẳng kiểu cel，
bố cục một khung hình，giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu，chỉ đổi điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào

> **Hướng dẫn dùng**: tự phán đoán từ thông tin người dùng cung cấp xem cần áp dụng chiều thay đổi nào (góc/cỡ cảnh/thời điểm/thời tiết); chiều nào không được nhắc tới thì để trống trường tương ứng và lược bỏ. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông màu bầu trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng cây cỏ/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép đa hướng nhìn/lưới ô/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ đổi điểm nhìn theo góc đã chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Tự phán đoán chiều thay đổi từ thông tin người dùng cung cấp (góc/cỡ cảnh/thời điểm/thời tiết), chiều không được nhắc tới thì để trống và lược bỏ |
| R8 | Bắt buộc chứa từ khóa anime Quốc phong (Chinese style anime / cel shading / fine brushstrokes) |
| R9 | Bắt buộc chứa đặc trưng quang học ống kính (tô màu phẳng kiểu cel / đường nét tinh tế / render kiểu Nhật) |
| R10 | Chất liệu bắt buộc mang dấu mòn tự nhiên/dấu vết năm tháng, cấm "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè tuyết bay...) |
| X3 | Chất liệu/phong cách đổi đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hay đường viền thân người nào |
| X5 | Khung hình bị ghép thành bố cục đa hướng nhìn/lưới ô/chia màn |
| X6 | Chất 3D tả thực/hoạt hình CG/hoạt hình cartoon/game engine (cấm dùng các từ 3D render, CGI, Unreal Engine, Unity...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có dấu dùng và cảm giác năm tháng (tránh "cảm giác nhựa") |
| X8 | Chiếu sáng quá đều quá phẳng, không có xóa phông, không có đặc trưng quang học ống kính |
