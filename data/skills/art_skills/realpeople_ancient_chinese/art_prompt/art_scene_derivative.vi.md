# Sinh tài nguyên phái sinh bối cảnh · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Nhất quán không gian** — kết cấu kiến trúc/bố cục/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh thể hiện các chức năng tự sự khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển khung giờ** — cùng một không gian mang không khí ánh sáng khác nhau ở các khung giờ khác nhau
4. **Biến đổi thời tiết** — cùng một không gian mang cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Lấy quay thật làm neo** — mọi biến thể bắt buộc giữ chất nhiếp ảnh thật, khước từ cảm giác render 3D/hoạt hình CG; giữ lại đặc trưng quang học của ống kính và ánh sáng đúng vật lý

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng tự sự | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Thiết lập không gian, định vị | extreme wide shot、大全景 |
| Toàn cảnh (全景) | Bối cảnh hiện ra trọn vẹn | Trưng ra kết cấu không gian | wide shot、全景 |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot、中景 |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | close shot、近景 |
| Đặc tả (特写) | Chi tiết cực kỳ cục bộ | Vân chất liệu/đạo cụ then chốt | extreme closeup、特写 |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép thay đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại quan kiến trúc, bố cục tổng thể | Góc nhìn thu hẹp, thêm tiền cảnh |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp để tập trung, trường ảnh thay đổi |
| 中景 → 近景 | Chất liệu, tông màu | Trường ảnh nông, hậu cảnh mờ đi |
| 近景 → 特写 | Vân chất liệu | Trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể theo khung giờ

### Định nghĩa khung giờ

| Khung giờ | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Sương mỏng ánh dịu, tông màu nóng lạnh đan xen | ánh mai le lói、sương mỏng buổi sớm |
| Chính ngọ | Sáng rõ, bóng ngắn, màu sắc tươi rõ | nắng chính ngọ、ánh sáng sáng rõ |
| Hoàng hôn | Tông vàng, bóng dài, bầu trời chuyển sắc | ráng vàng chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, u tĩnh lạnh trong | ánh trăng trong veo、moonlight |
| Ban đêm (đèn lửa) | Điểm xuyết vàng ấm, tương phản sáng tối | đèn đóm thưa thớt、ánh nến lập lòe |

### Quy phạm phái sinh theo khung giờ

| Phái sinh từ khung giờ gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Kiến trúc/bố cục/chất liệu | Tông màu bầu trời ấm lên, bóng đổ kéo dài |
| Ban ngày → ban đêm | Kiến trúc/bố cục/chất liệu | Tổng thể tối đi, thêm không khí đèn lửa/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, đồ đạc | Tông màu tổng thể ấm lên, thêm yếu tố lửa nến/đèn lồng |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng rõ, bóng đổ rõ nét | trời quang muôn dặm、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng cứng | ánh dịu trời âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng lan tỏa、sương giăng lượn lờ |
| Mưa phùn | Giọt nước, phản quang ẩm ướt, sợi mưa | mưa phùn như tơ、màn mưa như lụa mỏng |
| Tuyết bay | Phủ trắng, bông tuyết rơi | tuyết bay lả tả、khoác áo bạc trắng |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Hạng mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Kiến trúc/bố cục | Thêm lớp sương, cảnh vật ở xa mờ đi, hạ độ bão hòa |
| Nắng → mưa phùn | Kiến trúc/bố cục | Thêm sợi mưa, phản quang mặt đất, tông màu ngả lạnh |
| Nắng → tuyết bay | Kiến trúc/bố cục | Thêm tuyết đọng, bông tuyết, tông màu ngả trắng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đọng sương giá trong tuyết |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển đổi theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc mục tiêu, file này chỉ định nghĩa từ vựng về góc và các ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, hướng nhìn quay về mặt trước của bối cảnh | front view、eye level |
| Bên hông (trái/phải) | Nhìn ngang 90° về phía trái/phải của bối cảnh | left side view / right side view |
| Mặt sau/nhìn sau | 180° về phía sau của bối cảnh | back view |
| Nhìn chúc xuống | Nhìn từ trên cao xuống, trưng ra bố cục tổng thể | high angle、bird's eye view |
| Nhìn hất lên | Nhìn từ thấp hất lên, nhấn mạnh chủ thể cao lớn | low angle、worm's eye view |
| Đẩy vào gần hơn (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào phần cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc bất kỳ do bên gọi tự định nghĩa | tiêm vào theo `{góc mục tiêu}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với ảnh tham chiếu | Kết cấu kiến trúc/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc khớp với ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm điểm bối cảnh, chỉ chuyển góc; độ cao hướng nhìn có thể điều chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi chuyển góc phải tính lại đồng bộ hướng đổ của ánh sáng và bóng (giữ hợp lý về vật lý) |
| Bố cục | Một khung hình duy nhất (không ghép ảnh, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết định của bên gọi) |

---

## 6. Khuôn mẫu prompt

```
Ảnh bối cảnh phái sinh cổ trang, dựa trên ảnh tham chiếu，
real photography，photorealistic，shot on ARRI Alexa，35mm film grain，
RAW photo，ultra realistic，hyper detailed，
shallow depth of field，natural lens vignette，subtle chromatic aberration，bokeh，
chất nhiếp ảnh thật，cảm giác hạt phim，chiếu sáng tự nhiên，ánh sáng đúng vật lý，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian của bối cảnh nhất quán，
{góc mục tiêu (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả khung giờ (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả trường ảnh (nếu có)}，{biến đổi tông màu bầu trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{biến đổi bề mặt chất liệu (nếu có)}，{mô tả thích ứng của thảm thực vật (nếu có)}，
dấu vết mòn tự nhiên của chất liệu，nước bóng của năm tháng，rêu phong phong hóa，vải rủ nếp tự nhiên，
ánh sáng tự nhiên khuếch tán，ánh sáng khối，hiệu ứng Tyndall，bóng tụ quang，
phối cảnh không khí，chi tiết vân cực kỳ sắc nét，
bố cục một khung hình duy nhất，giữ kết cấu kiến trúc/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ chuyển điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào
không có bất kỳ chữ nào trong hình
```

> **Hướng dẫn sử dụng**: căn cứ thông tin người dùng cung cấp để tự phán đoán những chiều biến đổi cần áp dụng (góc/cỡ cảnh/khung giờ/thời tiết), chiều nào không được nhắc đến thì để trống và lược bỏ trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc tuân thủ

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể theo khung giờ bắt buộc điều chỉnh tông màu bầu trời và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình duy nhất", không được ghép nhiều hướng nhìn/lưới ô/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu kiến trúc/chất liệu/tông màu/ánh sáng nhất quán với ảnh tham chiếu, chỉ chuyển điểm nhìn theo góc được chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Căn cứ thông tin người dùng cung cấp để tự phán đoán chiều biến đổi (góc/cỡ cảnh/khung giờ/thời tiết), chiều không được nhắc đến thì để trống và lược bỏ |
| R8 | Bắt buộc chứa từ khóa nhiếp ảnh quay thật (real photography / photorealistic / RAW photo) |
| R9 | Bắt buộc chứa đặc trưng quang học của ống kính (ít nhất một trong shallow depth of field / lens vignette / bokeh) |
| R10 | Chất liệu bắt buộc mang dấu vết mòn tự nhiên/dấu vết năm tháng, cấm "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu kiến trúc/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hạ có tuyết bay...) |
| X3 | Chất liệu/phong cách đột biến giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hình người hay đường viền cơ thể người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới ô/chia màn |
| X6 | Chất render 3D/hoạt hình CG/hoạt hình/engine game (cấm các từ 3D render, CGI, Unreal Engine, Unity...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có bất kỳ dấu vết sử dụng và cảm giác năm tháng nào (tránh "cảm giác nhựa") |
| X8 | Chiếu sáng quá đều quá phẳng, không xóa mờ theo trường ảnh, không có đặc trưng quang học của ống kính |
