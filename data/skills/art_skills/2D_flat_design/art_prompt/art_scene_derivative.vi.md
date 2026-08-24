# Tạo tài nguyên phái sinh bối cảnh · Sổ tay ràng buộc phong cách phẳng

---

## 1. Nguyên tắc phái sinh

1. **Không gian nhất quán** — kết cấu kiến trúc/bố cục/chất liệu giữ nguyên ở mọi biến thể
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh, các cỡ cảnh khác nhau thể hiện các chức năng kể chuyện khác nhau
3. **Đổi thời điểm** — cùng một không gian ở các thời điểm khác nhau cho ra mảng màu tông khác nhau
4. **Đổi thời tiết** — cùng một không gian dưới các kiểu thời tiết khác nhau cho ra không khí màu khác nhau
5. **Lấy phẳng làm neo** — mọi biến thể bắt buộc giữ chất minh họa vector phẳng, khước từ cảm giác render 3D/hoạt hình CG; giữ đường nét gọn gàng, tô màu đơn sắc

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Dựng cảm giác không gian, định vị | extreme wide shot、大全景、flat extreme wide |
| Toàn cảnh (全景) | Bối cảnh hiện đầy đủ | Cho thấy kết cấu không gian | wide shot、全景、flat wide |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng | medium shot、中景、flat medium |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) mảng màu/đạo cụ tạo không khí | close shot、近景、flat close |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân mảng màu/đạo cụ then chốt | extreme closeup、特写、flat extreme close |

### Quy phạm phái sinh theo cỡ cảnh

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố cục tổng thể | Góc nhìn thu hẹp, thêm mảng màu tiền cảnh |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng | Cắt cúp tập trung, đổi màu đơn sắc |
| 中景 → 近景 | Chất liệu, tông màu | Tập trung màu đơn sắc, mảng màu hậu cảnh |
| 近景 → 特写 | Vân mảng màu | Tập trung màu đơn sắc, mảng màu cận cực gần |

---

## 3. Biến thể theo thời điểm

### Định nghĩa thời điểm

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Tông phẳng, mảng màu nhạt | sáng sớm phẳng、sắc sớm nhạt |
| Giữa trưa | Phẳng sáng, mảng màu đơn sắc | giữa trưa phẳng、sáng đơn sắc |
| Hoàng hôn | Vàng phẳng, mảng màu ấm | hoàng hôn phẳng、ánh vàng ấm |
| Đêm (ánh trăng) | Xanh lạnh phẳng, mảng màu tối | ánh trăng phẳng、sắc trăng xanh lạnh |
| Đêm (đèn lửa) | Vàng ấm phẳng, phông nền tối | đèn lửa phẳng、vàng ấm nền tối |

### Quy phạm phái sinh theo thời điểm

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố cục/chất liệu | Mảng màu bầu trời ấm lên, mảng màu bóng đổ |
| Ban ngày → ban đêm | Công trình/bố cục/chất liệu | Mảng màu tổng thể tối đi, thêm mảng màu đèn lửa/ánh trăng |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất | Mảng màu tổng thể ấm lên, thêm mảng màu ánh nến/đèn lồng |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Phẳng sáng, mảng màu đơn sắc | trời nắng phẳng、ngày nắng đơn sắc |
| Trời âm u | Phẳng đều, mảng màu xám | trời âm u phẳng、ánh dịu xám |
| Sương mỏng | Phẳng mờ ảo, mảng màu bão hòa thấp | sương mỏng phẳng、mảng màu mờ ảo |
| Mưa phùn | Sợi mưa phẳng, mảng màu ẩm ướt | mưa phùn phẳng、mảng màu ẩm ướt |
| Tuyết bay | Trắng phẳng, mảng màu phủ lên | tuyết bay phẳng、phủ trắng |

### Quy phạm phái sinh theo thời tiết

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố cục | Thêm lớp sương phẳng, làm nhòe mảng màu ở xa, giảm độ bão hòa |
| Nắng → mưa phùn | Công trình/bố cục | Thêm sợi mưa phẳng, mảng màu mặt đất, tông ngả lạnh |
| Nắng → tuyết bay | Công trình/bố cục | Thêm tuyết đọng phẳng, mảng màu bông tuyết, tông ngả trắng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | sắc mưa phẳng、sắc tuyết phẳng |

---

## 5. Biến thể theo góc

### Định nghĩa góc

> So với ảnh tham chiếu, ảnh phái sinh có thể chuyển theo các chiều góc dưới đây. Bên gọi sẽ truyền vào ảnh tham chiếu + mô tả góc đích, file này chỉ định nghĩa từ vựng góc và ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện/nhìn trước | So với ảnh tham chiếu, tầm nhìn hướng vào mặt trước bối cảnh | front view、eye level |
| Nhìn nghiêng (trái/phải) | Nhìn ngang về phía trái/phải bối cảnh 90° | left side view / right side view |
| Mặt sau/nhìn sau | Hướng về mặt sau bối cảnh 180° | back view |
| Nhìn từ trên xuống | Nhìn bao quát từ vị trí cao, cho thấy bố cục tổng thể | high angle、bird's eye view |
| Nhìn từ dưới lên | Ngước nhìn từ vị trí thấp, nhấn chủ thể cao lớn | low angle、worm's eye view |
| Đẩy máy vào cận cảnh (近景推进) | Cùng hướng nhưng máy đẩy vào (镜头推进), tập trung vào cục bộ | push-in、closer angle |
| Góc tự do | Mô tả góc bất kỳ do bên gọi tự định nghĩa | tiêm vào theo `{góc đích}` |

### Quy phạm phái sinh theo góc

| Hạng mục | Ràng buộc |
|---|---|
| Nhất quán với tham chiếu | Kết cấu kiến trúc/bố cục/chất liệu/tông màu/mùa/thời tiết bắt buộc khớp ảnh tham chiếu |
| Điểm nhìn | Cùng một tâm bối cảnh, chỉ đổi góc; độ cao tầm nhìn có thể chỉnh theo góc |
| Logic chiếu sáng | Giữ logic phẳng không ánh sáng đổ bóng, nhất quán với ảnh tham chiếu |
| Bố cục | Một khung hình duy nhất (không ghép, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền hình người nào** |
| Tỉ lệ khung hình | Mặc định 1:1 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

```
ảnh bối cảnh phái sinh cổ phong phẳng，dựa trên ảnh tham chiếu，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
flat scene derivative，environment concept art，no people，no characters，no human figures，
giữ kết cấu không gian bối cảnh nhất quán，
{góc đích (nếu có)}，{góc nhìn theo cỡ cảnh (nếu có)}，{mô tả thời điểm (nếu có)}，{mô tả thời tiết (nếu có)}，
{mảng màu tiền cảnh}，{mảng màu trung cảnh}，{mảng màu hậu cảnh}，
{mô tả tông màu}，{biến đổi mảng màu (nếu có)}，{biến đổi mảng màu bầu trời (nếu có)}，{điều chỉnh không khí (nếu có)}，
{đặc trưng thị giác của thời tiết (nếu có)}，{biến đổi mảng màu chất liệu (nếu có)}，{mô tả thích ứng thảm thực vật (nếu có)}，
không dấu vết thời gian，không sờn mòn，hoàn hảo phẳng，
không chiếu sáng，không đổ bóng，tô phẳng đơn sắc，
không phối cảnh，tô màu đơn sắc，
bố cục một khung hình，giữ kết cấu kiến trúc/chất liệu/tông màu nhất quán với ảnh tham chiếu，chỉ đổi điểm nhìn theo góc đích，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào
```

> **Hướng dẫn dùng**: dựa vào thông tin người dùng cung cấp mà tự phán đoán cần áp dụng chiều thay đổi nào (góc/cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và lược bỏ trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian bối cảnh giữ nguyên ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc điều chỉnh tông màu mảng màu và không khí |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng mảng màu/bề mặt chất liệu |
| R4 | Ảnh phái sinh bắt buộc là "một khung hình", không được ghép nhiều hướng nhìn/lưới/chia màn |
| R5 | Ảnh phái sinh bắt buộc giữ kết cấu kiến trúc/chất liệu/tông màu nhất quán với ảnh tham chiếu, chỉ đổi điểm nhìn theo góc được chỉ định |
| R6 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R7 | Dựa vào thông tin người dùng cung cấp mà tự phán đoán chiều thay đổi (góc/cỡ cảnh/thời điểm/thời tiết), chiều không được nhắc tới thì để trống và lược bỏ |
| R8 | Bắt buộc chỉ định từ khóa "phong cách phẳng" (2d flat design、vector art) |
| R9 | Bắt buộc chỉ định "không ánh sáng đổ bóng không gradient" |
| R10 | Chất liệu bắt buộc là tô màu đơn sắc, cấm vân bề mặt phức tạp/vẻ thời gian |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu kiến trúc/bố cục không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (mùa hè có tuyết bay...) |
| X3 | Chất liệu/phong cách đột biến giữa các biến thể |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hình người hay đường viền hình người nào |
| X5 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới/chia màn |
| X6 | Chất render 3D/hoạt hình CG/hoạt hình vui nhộn/game engine (cấm các từ 3D render、CGI、Unreal Engine、Unity...) |
| X7 | Chất liệu quá phức tạp, mảng màu phân biệt không rõ |
| X8 | Thêm hiệu ứng ánh sáng đổ bóng/bóng đổ/gradient/cảm giác khối |
