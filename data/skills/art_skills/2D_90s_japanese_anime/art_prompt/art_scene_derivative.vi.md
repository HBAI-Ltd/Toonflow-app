# Phong cách anime Nhật retro thập niên 90 - Tạo tài nguyên bối cảnh phái sinh · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Không gian nhất quán** — kết cấu kiến trúc/bố cục/vật liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh phục vụ các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Đổi thời điểm trong ngày** — cùng một không gian ở các thời điểm khác nhau cho ra không khí ánh sáng khác nhau
4. **Đổi thời tiết** — cùng một không gian dưới các kiểu thời tiết khác nhau mang cảm xúc khác nhau
5. **Lấy thập niên 90 làm neo** — mọi biến thể bắt buộc giữ phong cách retro thập niên 90, khước từ CG/render 3D hiện đại

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Dựng cảm giác không gian, định vị | extreme wide shot |
| Toàn cảnh (全景) | Bối cảnh hiện đầy đủ | Cho thấy kết cấu không gian | wide shot |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) vật liệu/đạo cụ tạo không khí | close shot |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân vật liệu/đạo cụ then chốt | extreme closeup |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Mặt ngoài công trình, bố cục tổng thể | Thu hẹp góc nhìn, tăng tiền cảnh |
| 全景 → 中景 | Vật liệu, tông màu, ánh sáng | Cắt cúp lấy tiêu điểm, đổi chiều sâu trường ảnh |
| 中景 → 近景 | Vật liệu, tông màu | Trường ảnh nông, hậu cảnh nhòe |
| 近景 → 特写 | Vân vật liệu | Trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể theo thời điểm trong ngày

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Sương mỏng ánh dịu, tông thiên lạnh | ánh mai、sương sớm |
| Giữa trưa | Sáng rõ, bóng ngắn, màu sắc tươi | nắng trưa、ánh sáng chói rõ |
| Chạng vạng | Tông vàng kim, bóng dài, trời chuyển sắc | chạng vạng、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, u tịch lạnh lẽo | ánh trăng、đêm trăng |
| Ban đêm (đèn) | Vàng ấm điểm xuyết, tương phản sáng tối | ban đêm、ánh đèn |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Ban ngày → chạng vạng | Công trình/bố cục/vật liệu | Tông trời ấm lên, bóng đổ dài ra |
| Ban ngày → ban đêm | Công trình/bố cục/vật liệu | Tổng thể tối đi, thêm ánh đèn/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Tông tổng thể ấm lên, thêm nguồn sáng |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng rõ, bóng đổ rõ nét | trời nắng、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng gắt | trời âm u、ánh sáng dịu |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng、sương giăng |
| Mưa phùn | Giọt nước, phản quang ẩm ướt | mưa phùn、sợi mưa |
| Tuyết bay | Phủ trắng, hoa tuyết rơi | tuyết bay、hoa tuyết |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh xa nhòe |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, mặt đất phản quang |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, hoa tuyết |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cây trong mưa ướt đẫm, cây trong tuyết đóng sương giá |

---

## 5. Biến thể theo góc nhìn

### Định nghĩa góc nhìn

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc nhìn dưới đây. Phía gọi sẽ truyền vào ảnh tham chiếu + mô tả góc đích, file này chỉ định nghĩa từ vựng góc nhìn và ràng buộc nhất quán.

| Góc nhìn | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, hướng nhìn quay về mặt trước bối cảnh | front view、eye level |
| Nhìn nghiêng (trái/phải) | Nhìn ngang 90° về phía trái/phải bối cảnh | left side view / right side view |
| Nhìn sau | 180° về phía sau bối cảnh | back view |
| Nhìn từ trên xuống | Nhìn bao quát từ vị trí cao, cho thấy bố cục tổng thể | high angle、bird's eye view |
| Nhìn từ dưới lên | Nhìn ngước từ vị trí thấp, nhấn mạnh chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào phần cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc bất kỳ do phía gọi tự định nghĩa | tiêm vào theo `{góc đích}` |

### Quy phạm phái sinh theo góc nhìn

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với ảnh tham chiếu | Kết cấu kiến trúc/bố cục/vật liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc khớp ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm bối cảnh, chỉ đổi góc; độ cao hướng nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi; sau khi đổi góc, hướng đổ bóng phải được tính lại tương ứng (giữ hợp lý vật lý) |
| Bố cục | Một khung hình (không ghép, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người hay đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo phía gọi chỉ định) |

---

## 6. Khuôn mẫu prompt
```
ảnh bối cảnh phái sinh phong cách anime Nhật retro thập niên 90，dựa trên ảnh tham chiếu，
90s anime style，vẽ tay tô màu phẳng，tông ấm dịu，đường nét tinh tế mượt mà，ánh sáng điện ảnh，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian của bối cảnh nhất quán，
{góc đích (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả chiều sâu trường ảnh (nếu có)}，{thay đổi tông trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{thay đổi bề mặt vật liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
đường nét mượt mà、bóng đổ dạng mảng、dấu vết sử dụng，
ánh sáng điện ảnh dịu、quầng sáng hậu cảnh、chiếu sáng tự nhiên，
bố cục một khung hình，giữ kết cấu kiến trúc/vật liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu，chỉ đổi điểm nhìn theo góc đích，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào
```

> **Hướng dẫn dùng**: tự phán đoán từ thông tin người dùng cung cấp xem cần áp dụng những chiều thay đổi nào (góc nhìn/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc thì để trống và bỏ qua trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng thảm thực vật/bề mặt vật liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép nhiều hướng nhìn/lưới ô/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu kiến trúc/vật liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ đổi điểm nhìn theo góc được chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Tự phán đoán chiều thay đổi (góc nhìn/cỡ cảnh/thời điểm/thời tiết) từ thông tin người dùng cung cấp, chiều nào không được nhắc thì để trống và bỏ qua |
| R8 | Bắt buộc chứa từ khóa thập niên 90 (90s anime style / hand-drawn / warm tone) |
| R9 | Bắt buộc chứa đặc trưng đường nét (ít nhất một trong đường nét mượt mà, bóng đổ dạng mảng) |
| R10 | Vật liệu bắt buộc mang dấu vết sử dụng, cấm "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu kiến trúc/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa |
| X3 | Vật liệu/phong cách đổi đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người hay bóng đổ hình người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới ô/chia màn |
| X6 | Render 3D/hoạt hình CG/chất phong cách hiện đại |
| X7 | Vật liệu quá sạch sẽ hoàn hảo, không có chút dấu vết sử dụng nào |
| X8 | Chiếu sáng quá đều và phẳng, không có ánh sáng điện ảnh dịu |
