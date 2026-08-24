# Tạo tài nguyên phái sinh bối cảnh đất sét tĩnh vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

1. **Nhất quán không gian** — kết cấu công trình/bố cục/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh thể hiện các chức năng kể chuyện khác nhau qua các cỡ cảnh khác nhau
3. **Chuyển thời điểm** — cùng một không gian thể hiện không khí ánh sáng tông ấm khác nhau ở các thời điểm khác nhau
4. **Biến đổi thời tiết** — cùng một không gian thể hiện cảm xúc khác nhau dưới các kiểu thời tiết khác nhau
5. **Lấy tĩnh vật làm neo** — mọi biến thể bắt buộc giữ phong cách đất sét tĩnh vật

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
| Sáng sớm | Ánh ấm dịu, tông ngả vàng ấm | ánh mai le lói、tông ấm buổi sớm |
| Chính ngọ | Sáng rõ, bóng ngắn, màu sắc tươi rõ | nắng chính ngọ、ánh sáng rực rỡ |
| Hoàng hôn | Tông vàng ấm, bóng dài, trời chuyển sắc | vàng ấm chiều tà、golden hour |
| Ban đêm (ánh trăng) | Tông xanh lạnh, tĩnh mịch lạnh lẽo | ánh trăng trong、moonlight |
| Ban đêm (ánh đèn) | Vàng ấm điểm xuyết, tương phản sáng tối | đèn thưa thớt、ánh nến lập lòe |

### Quy phạm phái sinh thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Tông trời ấm lên, bóng đổ kéo dài |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Tổng thể tối đi, thêm không khí đèn/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Tông tổng thể ấm lên, thêm yếu tố ánh nến/đèn lồng |

---

## 4. Biến thể thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng rõ, bóng đổ rõ ràng | trời quang mây tạnh、nắng đẹp |
| Trời âm u | Ánh sáng đều, không bóng gắt | ánh dịu ngày âm u、overcast |
| Sương mỏng | Tầm nhìn giảm, không khí mờ ảo | sương mỏng lan tỏa、hơi sương quẩn quanh |
| Mưa phùn | Giọt nước, phản quang ẩm ướt, sợi mưa | mưa phùn như tơ、màn mưa mỏng như lụa |
| Tuyết bay | Phủ trắng, bông tuyết rơi | tuyết bay lả tả、khoác áo bạc trắng |

### Quy phạm phái sinh thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương, cảnh vật ở xa mờ đi, giảm độ bão hòa |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa, mặt đất phản quang, tông ngả lạnh |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng, bông tuyết, tông ngả trắng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cánh hoa ướt trong mưa, cành khô đóng sương trong tuyết |

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
| Nhất quán với tham chiếu | Kết cấu công trình/bố cục/chất liệu/tông màu/ánh sáng/mùa/thời tiết bắt buộc giống ảnh tham chiếu |
| Điểm nhìn | Cùng một điểm trung tâm của bối cảnh, chỉ đổi góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Hướng nguồn sáng của ảnh tham chiếu không đổi, sau khi đổi góc phải tính lại đồng bộ hướng đổ của ánh sáng và bóng (giữ ánh sáng ấm dịu) |
| Bố cục | Một khung hình duy nhất (không ghép, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền hình người nào** |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

```
ảnh bối cảnh phái sinh đất sét tĩnh vật，dựa trên ảnh tham chiếu，phong cách hoạt hình tĩnh vật，render hoạt hình 3D，ánh sáng tông ấm，trường ảnh nông dịu，
claymation style，stop-motion aesthetic，warm lighting，shallow depth of field，bokeh，
scene derivative design sheet，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian của bối cảnh nhất quán，
{góc mục tiêu (nếu có)}，{điểm nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{tiền cảnh}，{trung cảnh}，{hậu cảnh}，
{mô tả tông màu}，{mô tả độ sâu trường ảnh (nếu có)}，{thay đổi tông màu bầu trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{thay đổi bề mặt chất liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
vết mòn tự nhiên trên chất liệu，lớp bóng thời gian，rêu phong hóa，vải rủ nếp tự nhiên，
ánh ấm dịu tán xạ，ánh sáng thể tích，đốm sáng tông ấm，xóa phông theo chiều sâu，
phối cảnh khí quyển，chi tiết vân siêu rõ，
bố cục một khung hình，giữ kết cấu công trình/chất liệu/tông màu/ánh sáng giống ảnh tham chiếu, chỉ đổi điểm nhìn theo góc mục tiêu，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào
```

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể thời điểm bắt buộc chỉnh tông màu bầu trời và không khí |
| R3 | Biến thể thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép nhiều hướng nhìn/lưới/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu công trình/chất liệu/tông màu/ánh sáng giống ảnh tham chiếu, chỉ đổi điểm nhìn theo góc đã chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Tự phán đoán chiều biến đổi (góc/cỡ cảnh/thời điểm/thời tiết) theo thông tin người dùng cung cấp, chiều nào không được nhắc thì bỏ trống |
| R8 | Bắt buộc chứa từ khóa hoạt hình tĩnh vật (claymation / stop-motion) |
| R9 | Bắt buộc chứa từ khóa trường ảnh nông (shallow depth of field / bokeh) |
| R10 | Bắt buộc chỉ định "ánh sáng ấm dịu" |
| R11 | Chất liệu bắt buộc mang vết mòn tự nhiên/dấu vết thời gian |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa |
| X3 | Chất liệu/phong cách đổi đột ngột giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hình người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới/chia màn |
| X6 | Chất nhiếp ảnh tả thực người thật/render 3D/hoạt hình CG |
| X7 | Chất liệu quá sạch sẽ hoàn hảo, không hề có vết sử dụng |
| X8 | Ánh sáng lạnh gắt/độ tương phản mạnh/bóng gắt |
