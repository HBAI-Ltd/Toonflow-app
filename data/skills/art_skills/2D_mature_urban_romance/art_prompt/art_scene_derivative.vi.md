# Tạo tài nguyên phái sinh bối cảnh · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Không gian nhất quán** — kết cấu công trình/bố cục/chất liệu giữ nhất quán ở mọi biến thể
2. **Dẫn dắt bằng cỡ cảnh** — cùng một bối cảnh thể hiện các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Đổi thời điểm** — cùng một không gian ở các thời điểm khác nhau cho ra không khí sáng tối khác nhau
4. **Đổi thời tiết** — cùng một không gian dưới các kiểu thời tiết khác nhau cho ra cảm xúc khác nhau
5. **Lấy cel làm neo** — mọi biến thể bắt buộc giữ phong cách anime, giữ đường nét rõ ràng và tô màu kiểu cel

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Dựng cảm giác không gian, định vị | `extreme wide shot`、大全景 |
| Toàn cảnh (全景) | Bối cảnh hiện đầy đủ | Cho thấy kết cấu không gian | `wide shot`、全景 |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | `medium shot`、中景 |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | `close shot`、近景 |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân chất liệu/đạo cụ then chốt | `extreme closeup`、特写 |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố cục tổng thể | Góc nhìn thu hẹp, thêm tiền cảnh |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp tập trung, đổi chiều sâu trường ảnh |
| 中景 → 近景 | Chất liệu, tông màu | Chiều sâu trường ảnh nông, xóa phông hậu cảnh |
| 近景 → 特写 | Vân chất liệu | Chiều sâu trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể theo thời điểm

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Tông sáng trắng lạnh, cảm giác sương mỏng | tia nắng sớm hé、sương sớm mỏng |
| Chính ngọ | Sáng, bóng ngắn, màu sắc rõ nét | nắng chính ngọ、ánh sáng rực |
| Hoàng hôn | Tông vàng kim, bóng dài, trời chuyển sắc | ráng chiều vàng óng、golden hour |
| Đêm (ánh trăng) | Tông xanh lạnh, tĩnh mịch lạnh trong | ánh trăng trong、moonlight |
| Đêm (đèn) | Vàng ấm điểm xuyết, tương phản sáng tối | đèn le lói、không khí ánh đèn |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Tông trời ấm lên, bóng đổ dài ra |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Tổng thể tối đi, thêm không khí ánh đèn/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Tông màu tổng thể ấm lên, thêm đèn trong nhà |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng, bóng đổ rõ | trời quang mây tạnh、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng gắt | sáng dịu trời âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng lan tỏa、sương giăng |
| Mưa phùn | Giọt nước, phản sáng ẩm ướt, sợi mưa | mưa phùn như tơ、màn mưa mỏng như lụa |
| Tuyết bay | Phủ trắng, hoa tuyết rơi | tuyết bay lất phất、phủ bạc trắng xóa |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh xa mờ đi, hạ độ bão hòa |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, mặt đất phản sáng, tông màu ngả lạnh |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, hoa tuyết, tông màu ngả trắng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đóng sương trong tuyết |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể đổi theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc mục tiêu; file này chỉ định nghĩa từ vựng về góc và các ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, tầm nhìn hướng vào mặt trước bối cảnh | `front view`、`eye level` |
| Nhìn nghiêng (trái/phải) | Nhìn ngang 90° về phía trái/phải bối cảnh | `left side view` / `right side view` |
| Mặt sau/nhìn sau | 180° về phía sau bối cảnh | `back view` |
| Nhìn từ trên xuống | Nhìn bao quát từ vị trí cao, cho thấy bố cục tổng thể | `high angle`、`bird's eye view` |
| Nhìn từ dưới lên | Ngước nhìn từ vị trí thấp, nhấn chủ thể cao lớn | `low angle`、`worm's eye view` |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào phần cục bộ | `push-in`、`closer angle` |
| Góc tự do | Mô tả góc bất kỳ do bên gọi tự định nghĩa | Đưa vào theo `{góc mục tiêu}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với ảnh tham chiếu | Kết cấu công trình/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc khớp với ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm bối cảnh, chỉ đổi góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi đổi góc phải tính lại hướng đổ bóng cho khớp (giữ hợp lý vật lý) |
| Bố cục | Một khung hình (không ghép hình, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người hay đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

hình bối cảnh phái sinh anime, dựa trên ảnh tham chiếu，
anime style，cel shading，modern urban style，
cinematic composition，dramatic low-key lighting，
ultra detailed，8K，high quality，
shallow depth of field，hạt nhiễu hình ảnh，tối góc ống kính，
phong cách hoạt hình tô màu kiểu cel，bố cục đẳng cấp điện ảnh，ánh sáng kịch tính tông thấp，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian của bối cảnh nhất quán，
{góc mục tiêu (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả chiều sâu trường ảnh (nếu có)}，{thay đổi tông màu bầu trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{thay đổi bề mặt chất liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
chất liệu có dấu vết sử dụng hiện đại，hơi thở đời sống，mài mòn tự nhiên，
ánh sáng tự nhiên/nhân tạo、ánh sáng kịch tính，tông màu lạnh độ bão hòa thấp，
phối cảnh không khí，chi tiết vân bề mặt cực kỳ sắc nét，
bố cục một khung hình，giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ đổi điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào

> **Hướng dẫn dùng**: căn theo thông tin người dùng cung cấp mà tự xác định các chiều thay đổi cần áp dụng (góc/cỡ cảnh/thời điểm/thời tiết); chiều nào không được nhắc tới thì để trống trường tương ứng và bỏ qua. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nhất quán ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông màu bầu trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép nhiều hướng nhìn/lưới ô/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ đổi điểm nhìn theo góc đã chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong hình bối cảnh |
| R7 | Căn theo thông tin người dùng cung cấp mà tự xác định chiều thay đổi (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và bỏ qua |
| R8 | Bắt buộc chứa từ khóa "phong cách anime" (anime style / cel shading) |
| R9 | Bắt buộc chứa đặc tính chiều sâu trường ảnh (ít nhất một trong shallow depth of field / vignette), giữ phong cách hoạt hình tô màu kiểu cel |
| R10 | Chất liệu bắt buộc mang dấu vết sử dụng hiện đại/hơi thở đời sống, cấm kiểu "cảm giác render 3D" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè mà tuyết bay...) |
| X3 | Chất liệu/phong cách nhảy đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hay đường viền cơ thể người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới ô/chia màn |
| X6 | Chất cảm render 3D/hoạt hình CG/game engine (cấm dùng các từ 3D render, CGI, Unreal Engine, Unity...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có chút dấu vết sử dụng và dấu thời gian nào (tránh "cảm giác nhựa") |
| X8 | Chiếu sáng quá đều quá phẳng, không xóa phông chiều sâu, không có đặc tính quang học của ống kính |
