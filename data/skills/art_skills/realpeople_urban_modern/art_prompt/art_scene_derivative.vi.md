# Tạo tài sản phái sinh bối cảnh · Sổ tay ràng buộc tả thực đô thị

---

## 1. Nguyên tắc phái sinh

1. **Không gian nhất quán** — kết cấu công trình/bố cục/chất liệu giữ nhất quán ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh phục vụ những chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển thời điểm** — cùng một không gian mang không khí sáng tối khác nhau ở các thời điểm khác nhau
4. **Đổi thời tiết** — cùng một không gian mang cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Neo vào ảnh chụp thật** — mọi biến thể bắt buộc giữ chất nhiếp ảnh thật, khước từ cảm giác render 3D/hoạt hình CG; giữ đặc trưng quang học của ống kính và ánh sáng vật lý

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
| Sáng sớm | Sương mỏng ánh dịu, tông màu đan xen nóng lạnh | ánh bình minh le lói、sương sớm |
| Giữa trưa | Sáng, bóng ngắn, màu sắc rõ nét | nắng giữa trưa、ánh sáng rực |
| Hoàng hôn | Tông vàng kim, bóng dài, trời chuyển sắc | ánh vàng chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, tĩnh mịch lạnh lẽo | ánh trăng trong、moonlight |
| Ban đêm (đèn phố) | Điểm xuyết vàng ấm, tương phản sáng tối | đèn phố thưa thớt、cảnh đêm thành phố |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Tông trời ấm lên, bóng đổ dài ra |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Tổng thể tối đi, thêm không khí đèn phố/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Tông tổng thể ấm lên, thêm yếu tố đèn bàn/đèn cây |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng, bóng đổ rõ | trời quang mây tạnh、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng gắt | ánh dịu ngày âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng giăng、sương khói lượn lờ |
| Mưa phùn | Giọt nước, phản quang ẩm, sợi mưa | mưa phùn như tơ、màn mưa mỏng như lụa |
| Tuyết bay | Phủ trắng, bông tuyết rơi | tuyết bay lất phất、phủ bạc trắng xóa |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh xa mờ đi, hạ độ bão hòa |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, mặt đất phản quang, tông ngả lạnh |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, bông tuyết, tông ngả trắng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đóng sương trong tuyết |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc mục tiêu; file này chỉ định nghĩa từ vựng về góc và các ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, hướng nhìn quay về mặt trước bối cảnh | front view、eye level |
| Nhìn nghiêng (trái/phải) | Nhìn ngang 90° về phía trái/phải bối cảnh | left side view / right side view |
| Mặt sau/nhìn sau | 180° về phía sau bối cảnh | back view |
| Góc cao | Nhìn từ trên cao xuống, cho thấy bố cục tổng thể | high angle、bird's eye view |
| Góc thấp | Nhìn từ dưới lên, nhấn chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc bất kỳ do bên gọi tự định nghĩa | tiêm vào theo `{góc mục tiêu}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với ảnh tham chiếu | Kết cấu công trình/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc giống ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm điểm bối cảnh, chỉ chuyển góc; cao độ tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi chuyển góc phải tính lại hướng đổ sáng và bóng cho đồng bộ (giữ hợp lý về vật lý) |
| Bố cục | Một khung hình duy nhất (không ghép ảnh, không nhiều hướng nhìn, không chia màn hình) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

```
hình bối cảnh phái sinh đô thị hiện đại，dựa trên ảnh tham chiếu，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
chất nhiếp ảnh thật，cảm giác hạt phim，chiếu sáng tự nhiên，ánh sáng đổ bóng vật lý，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian của bối cảnh nhất quán，
{góc mục tiêu (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả độ sâu trường ảnh (nếu có)}，{biến đổi tông trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{biến đổi bề mặt chất liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
dấu mòn tự nhiên trên chất liệu，dấu vết sử dụng，tường bong tróc，kim loại oxy hóa，
ánh sáng tự nhiên khuếch tán，ánh sáng thể tích，hiệu ứng Tyndall，bóng hội tụ ánh sáng，
phối cảnh không khí，chi tiết vân bề mặt cực sắc nét，
bố cục một khung hình，giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu，chỉ chuyển điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào
```


> **Hướng dẫn sử dụng**: tự phán đoán từ thông tin người dùng cung cấp xem cần áp dụng những chiều thay đổi nào (góc/cỡ cảnh/thời điểm/thời tiết); chiều nào không được nhắc tới thì để trống trường tương ứng và bỏ qua. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nhất quán ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình duy nhất", không được ghép nhiều hướng nhìn/lưới/chia màn hình |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu công trình/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ chuyển điểm nhìn theo góc đã chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong hình bối cảnh |
| R7 | Tự phán đoán chiều thay đổi từ thông tin người dùng cung cấp (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và bỏ qua |
| R8 | Bắt buộc chứa từ khóa nhiếp ảnh chụp thật (real photography / photorealistic / RAW photo) |
| R9 | Bắt buộc chứa đặc trưng quang học của ống kính (ít nhất một trong shallow depth of field / lens vignette / bokeh) |
| R10 | Chất liệu bắt buộc mang dấu mòn tự nhiên/dấu vết sử dụng, cấm kiểu "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè tuyết bay...) |
| X3 | Chất liệu/phong cách đổi đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hay đường viền cơ thể người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới/chia màn hình |
| X6 | Chất render 3D/hoạt hình CG/hoạt hình/game engine (cấm dùng các từ 3D render, CGI, Unreal Engine, Unity...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có chút dấu vết sử dụng hay dấu thời gian nào (tránh "cảm giác nhựa") |
| X8 | Chiếu sáng quá đều quá phẳng, không xóa phông theo độ sâu trường ảnh, không có đặc trưng quang học của ống kính |
