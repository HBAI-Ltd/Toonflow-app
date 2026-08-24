# Tạo tài nguyên phái sinh bối cảnh đô thị render anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Nhất quán không gian** — kết cấu công trình/bố cục/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh thể hiện các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển thời điểm** — cùng một không gian thể hiện không khí ánh sáng khác nhau ở các thời điểm khác nhau
4. **Biến đổi thời tiết** — cùng một không gian thể hiện cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Lấy cel-shading làm neo** — mọi biến thể bắt buộc giữ phong cách render anime 3D + cel-shading, khước từ cảm giác nhiếp ảnh tả thực/hoạt hình CG; giữ nhất quán đặc trưng ống kính và ánh sáng
6. **Thống nhất không khí đô thị** — mọi biến thể phải giữ phong cách đô thị hiện đại, phối màu tông ấm

---

## 2. Biến thể cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Dựng cảm giác không gian, định vị | extreme wide shot、大全景 |
| Toàn cảnh (全景) | Bối cảnh hiện đầy đủ | Cho thấy kết cấu không gian | wide shot、全景 |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot、中景 |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | close shot、近景 |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân chất liệu/đạo cụ then chốt | extreme closeup、特写 |

### Quy phạm phái sinh cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép thay đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố cục tổng thể | Góc nhìn thu hẹp, thêm tiền cảnh |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp tập trung, đổi độ sâu trường ảnh |
| 中景 → 近景 | Chất liệu, tông màu | Độ sâu trường ảnh nông, hậu cảnh xóa mờ |
| 近景 → 特写 | Vân chất liệu | Độ sâu trường ảnh cực nông, cảm giác macro |

---

## 3. Biến thể thời điểm

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Sương mỏng ánh dịu, tông đan xen lạnh ấm (cel-shading hóa) | ánh mai le lói、sương sớm |
| Chính ngọ | Sáng rõ, bóng ngắn, màu sắc tươi rõ (cel-shading hóa) | nắng chính ngọ、ánh sáng rực rỡ |
| Hoàng hôn | Tông vàng kim, bóng dài, trời chuyển sắc (cel-shading hóa) | ánh vàng chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, tĩnh mịch lạnh lẽo (cel-shading hóa) | ánh trăng trong、moonlight |
| Ban đêm (ánh đèn) | Vàng ấm điểm xuyết, tương phản sáng tối (cel-shading hóa) | đèn thưa thớt、ánh nến lập lòe |

### Quy phạm phái sinh thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Tông trời ấm lên, bóng đổ kéo dài (cel-shading hóa) |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Tổng thể tối đi, thêm không khí đèn/ánh trăng (cel-shading hóa) |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Tông tổng thể ấm lên, thêm yếu tố ánh nến/đèn lồng (cel-shading hóa) |

---

## 4. Biến thể thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Nắng | Sáng rõ, bóng đổ rõ ràng (cel-shading hóa) | trời quang mây tạnh、nắng đẹp |
| Âm u | Ánh sáng đều, không bóng gắt (cel-shading hóa) | ánh dịu trời âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo (cel-shading hóa) | sương mỏng lan tỏa、hơi sương giăng |
| Mưa phùn | Giọt nước, phản quang ẩm ướt, sợi mưa (cel-shading hóa) | mưa phùn như tơ、màn mưa mỏng nhẹ |
| Tuyết bay | Phủ trắng, bông tuyết rơi (cel-shading hóa) | tuyết bay lất phất、phủ trắng bạc |

### Quy phạm phái sinh thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh xa mờ đi, giảm độ bão hòa (cel-shading hóa) |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, phản quang mặt đất, tông thiên lạnh (cel-shading hóa) |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, bông tuyết, tông thiên trắng (cel-shading hóa) |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cánh hoa ẩm ướt trong mưa, cành khô đọng sương giá trong tuyết (cel-shading hóa) |

---

## 5. Biến thể góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc mục tiêu, file này chỉ định nghĩa từ vựng về góc và ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, tầm nhìn hướng về mặt trước của bối cảnh | front view、eye level |
| Nghiêng (trái/phải) | Nhìn ngang về phía trái/phải bối cảnh 90° | left side view / right side view |
| Mặt sau/nhìn sau | Hướng về mặt sau bối cảnh 180° | back view |
| Nhìn từ trên xuống | Nhìn bao quát từ vị trí cao, thể hiện bố cục tổng thể | high angle、bird's eye view |
| Nhìn từ dưới lên | Nhìn ngước từ vị trí thấp, nhấn mạnh chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc bất kỳ do bên gọi tự định | tiêm theo `{góc mục tiêu}` |

### Quy phạm phái sinh góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với tham chiếu | Kết cấu công trình/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc giống ảnh tham chiếu (xử lý cel-shading) |
| Điểm nhìn | Cùng một điểm trung tâm của bối cảnh, chỉ đổi góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi đổi góc phải tính lại đồng bộ hướng đổ của ánh sáng và bóng (xử lý cel-shading) |
| Bố cục | Một khung hình duy nhất (không ghép, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền hình người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt
```
render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，ảnh bối cảnh phái sinh，dựa trên ảnh tham chiếu，
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
giữ kết cấu không gian bối cảnh nhất quán，
{góc mục tiêu (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả độ sâu trường ảnh (nếu có)}，{biến đổi tông trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{biến đổi bề mặt chất liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
vết sử dụng tự nhiên trên chất liệu，mòn theo hơi thở đời sống，vải rủ nếp tự nhiên (cel-shading hóa)，
ánh sáng tự nhiên tán xạ，ánh sáng thể tích，hiệu ứng sáng cel-shading，bóng đổ cel-shading，
phối cảnh khí quyển，vân rõ ràng，xử lý cel-shading，
bố cục một khung hình，giữ kết cấu công trình/chất liệu/tông màu/ánh sáng giống ảnh tham chiếu，chỉ đổi điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào，
phong cách render cel-shading，ánh sáng dịu，tỉ lệ hoạt hình vừa phải，chất liệu hoạt hình chi tiết cao，
phối màu tông ấm，không khí ráng chiều hoàng hôn，không khí vui tươi chữa lành，
8K siêu nét，bố cục điện ảnh，
trong hình không được có bất kỳ chữ nào
```

> **Hướng dẫn sử dụng**: dựa vào thông tin người dùng cung cấp mà tự xác định các chiều biến đổi cần áp dụng (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và lược bỏ trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể thời điểm bắt buộc chỉnh tông trời và không khí (cel-shading hóa) |
| R3 | Biến thể thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu (cel-shading hóa) |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình duy nhất", không được ghép nhiều hướng nhìn/lưới/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu công trình/chất liệu/tông màu/ánh sáng giống ảnh tham chiếu, chỉ đổi điểm nhìn theo góc chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Dựa vào thông tin người dùng cung cấp mà tự xác định chiều biến đổi (góc/cỡ cảnh/thời điểm/thời tiết), chiều không được nhắc tới thì để trống và lược bỏ |
| R8 | Bắt buộc chứa từ khóa render anime 3D (cel-shaded, 3D animation render, anime style) |
| R9 | Bắt buộc chứa đặc trưng quang học của ống kính (ít nhất một trong shallow depth of field / lens vignette / bokeh, có xử lý cel-shading) |
| R10 | Chất liệu bắt buộc mang vết mòn tự nhiên/dấu vết thời gian, cấm vẻ "chất CG" mới tinh không tì vết, nhưng thể hiện theo lối cel-shading |
| R11 | Bắt buộc giữ tính nhất quán của phong cách render cel-shading, không được pha trộn yếu tố tả thực |
| R12 | Bắt buộc chứa từ khóa phối màu tông ấm, không khí ráng chiều hoàng hôn |
| R13 | Bắt buộc chứa từ khóa 8K siêu nét, bố cục điện ảnh |
| R14 | Bắt buộc chứa từ khóa ánh sáng điện ảnh, không khí vui tươi chữa lành |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè tuyết bay..., trong giới hạn của lối cel-shading) |
| X3 | Chất liệu/phong cách đột ngột đổi khác giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hình người hay đường viền hình người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới/chia màn |
| X6 | Chất render 3D/hoạt hình CG/hoạt hình vui nhộn/game engine (cấm các từ 3D render、CGI、Unreal Engine、Unity...), nhưng phải nêu rõ render hoạt hình cel-shading |
| X7 | Chất liệu quá sạch sẽ hoàn hảo, không hề có vết sử dụng và dấu vết thời gian (tránh "cảm giác nhựa"), cần xử lý cel-shading |
| X8 | Chiếu sáng quá đều và dẹt, không xóa phông theo chiều sâu, không có đặc trưng quang học của ống kính |
| X9 | Dùng thuật ngữ nhiếp ảnh tả thực (như real photography, photorealistic, RAW photo...) |
| X10 | Yếu tố cổ đại/tương lai, không thuộc phong cách đô thị hiện đại |
| X11 | Tông chủ đạo lạnh/ban đêm, không phải tông ấm/không khí hoàng hôn |
| X12 | Thiếu từ khóa không khí vui tươi chữa lành |