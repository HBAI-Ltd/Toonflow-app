# Sinh asset phái sinh bối cảnh · Sổ tay ràng buộc Sử thi trung cổ

---

## 1. Nguyên tắc phái sinh

1. **Nhất quán không gian** — cấu trúc / bố cục / vật liệu không đổi qua mọi biến thể
2. **Cỡ cảnh dẫn dắt** — một bối cảnh gánh các chức năng tự sự khác nhau qua cỡ cảnh khác nhau
3. **Chuyển khung giờ** — một không gian, các tâm trạng sáng khác nhau trong ngày
4. **Biến thiên thời tiết** — một không gian, các cảm xúc khác nhau dưới thời tiết khác nhau
5. **Neo nhiếp ảnh** — mọi biến thể giữ chất nhiếp ảnh thật; từ chối cảm 3D/CG; giữ quang học ống kính và ánh sáng vật lý

---

## 2. Biến thể cỡ cảnh

### Định nghĩa cỡ cảnh

| Cỡ | Phạm vi | Chức năng tự sự | Prompt |
|---|---|---|---|
| Đại viễn cảnh | Toàn bối cảnh + xung quanh | Định vị không gian, tầm vóc thế giới | extreme wide shot |
| Viễn cảnh | Bối cảnh trọn vẹn | Thể hiện cấu trúc không gian | wide shot |
| Trung cảnh | Khu vực cục bộ | Tập trung vùng chức năng | medium shot |
| Cận cảnh | Chi tiết bối cảnh | Đặc tả vật liệu / đạo cụ không khí | close shot |
| Đặc tả | Chi tiết cực cục bộ | Vân chất liệu / vật then chốt | extreme closeup |

### Quy tắc phái sinh cỡ cảnh

| Từ bản gốc | Giữ nguyên | Được đổi |
|---|---|---|
| Đại viễn → viễn | Công trình, bố cục tổng | Góc hẹp lại, tiền cảnh tăng |
| Viễn → trung | Vật liệu, tông, sáng | Cắt tập trung, đổi chiều sâu |
| Trung → cận | Vật liệu, tông | Nông sâu, nền tan |
| Cận → đặc tả | Vân vật liệu | Cực nông, cảm macro |

---

## 3. Biến thể khung giờ

### Định nghĩa

| Giờ | Đặc trưng thị giác | Prompt |
|---|---|---|
| Bình minh | Sương mù, tách lạnh-ấm, bóng dài mềm | dawn mist, first light |
| Trưa phủ mây | Tản xám đều, chất liệu trung thực | overcast midday, flat grey light |
| Hoàng hôn | Trời than hồng, đá nguội dần, giờ thắp đuốc | ember dusk, torches being lit |
| Đêm (trăng) | Tĩnh xanh thép, viền bạc | moonlit night, steel-blue stillness |
| Đêm (lửa) | Vũng đuốc, hắt lò sưởi, ngoài kia đen | torchlit night, firelight pools |

### Quy tắc phái sinh giờ

| Từ gốc | Giữ nguyên | Đổi |
|---|---|---|
| Ngày → hoàng hôn | Công trình / bố cục / vật liệu | Trời than hồng, bóng kéo dài, đuốc xuất hiện |
| Ngày → đêm | Công trình / bố cục / vật liệu | Tối, lửa hoặc trăng thành nguồn |
| Nội ngày → nội đêm | Cấu trúc, nội thất | Vũng nến ấm, cửa sổ đen |

---

## 4. Biến thể thời tiết

### Định nghĩa

| Thời tiết | Đặc trưng | Prompt |
|---|---|---|
| Phủ mây | Tản đều, không bóng gắt | overcast, soft diffusion |
| Sương | Phía xa bị nuốt, khối hình lù lù | rolling fog, swallowed distance |
| Mưa phùn | Đá ướt bóng, vệt giọt, khí xám | thin drizzle, wet stone sheen |
| Tuyết | Phủ trắng, tĩnh câm, hơi thở khói | falling snow, muffled stillness |
| Nắng gắt hiếm | Bóng dài, độ mòn phơi thật | rare hard sun, long shadows |

### Quy tắc phái sinh thời tiết

| Từ gốc | Giữ nguyên | Đổi |
|---|---|---|
| Phủ mây → sương | Công trình / bố cục | Lớp sương, xa tan, bão hòa giảm |
| Phủ mây → mưa phùn | Công trình / bố cục | Vệt mưa, nền bóng nước, tông lạnh hơn |
| Phủ mây → tuyết | Công trình / bố cục | Phủ tuyết, bông rơi, tông trắng hơn |
| Thực vật thích ứng thời tiết | — | Thạch nam ướt, sương muối trên cành |

---

## 5. Biến thể góc

### Định nghĩa

> Bản phái sinh được đổi góc so với reference. Bên gọi truyền reference + mô tả góc đích; file này chỉ định nghĩa từ vựng góc và ràng buộc nhất quán.

| Góc | Mô tả | Prompt |
|---|---|---|
| Chính diện | Hướng mặt chính bối cảnh | front view, eye level |
| Bên (T/P) | 90° sang trái/phải | left side view / right side view |
| Sau | 180° phía sau | back view |
| Cao | Nhìn bao quát bố cục — góc "ánh nhìn số phận" | high angle, bird's eye view |
| Thấp | Nhấn tường và tháp | low angle, worm's eye view |
| Đẩy vào | Cùng hướng, gần hơn, tập trung cục bộ | push-in, closer angle |
| Tự do | Góc do bên gọi định | theo {góc đích} |

### Quy tắc phái sinh góc

| Mục | Ràng buộc |
|---|---|
| Nhất quán reference | Cấu trúc / bố cục / vật liệu / tông / sáng / mùa / thời tiết khớp reference |
| Điểm nhìn | Cùng tâm bối cảnh, chỉ đổi góc; cao độ mắt theo góc |
| Logic sáng | Hướng nguồn không đổi; bóng tính lại vật lý theo góc mới |
| Bố cục | Một khung (không ô lưới / chia màn) |
| Người | **Không người hay đường viền người dưới mọi hình thức** |
| Khung | Mặc định 16:9 (hoặc theo bên gọi) |

---

## 6. Mẫu prompt

```
bối cảnh phái sinh sử thi trung cổ, dựa trên reference,
real photography, photorealistic, shot on ARRI Alexa, 35mm film grain,
RAW photo, ultra realistic, hyper detailed,
shallow depth of field, natural lens vignette, subtle chromatic aberration,
chất nhiếp ảnh thật, hạt phim, ánh sáng có nguồn, sáng tối vật lý,
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
giữ cấu trúc không gian bối cảnh nhất quán,
{góc đích (nếu có)}, {cỡ cảnh (nếu có)}, {mô tả giờ (nếu có)}, {mô tả thời tiết (nếu có)},
{tiền cảnh}, {trung cảnh}, {hậu cảnh},
{mô tả tông}, {mô tả chiều sâu (nếu có)}, {đổi trời (nếu có)}, {chỉnh không khí (nếu có)},
{đặc trưng thời tiết (nếu có)}, {đổi bề mặt vật liệu (nếu có)}, {thích ứng thực vật (nếu có)},
vật liệu phong hóa, rêu và bồ hóng, vệt bánh xe và ngưỡng cửa mòn,
vệt sáng có nguồn, mù thể tích, phối cảnh không khí, chi tiết vân siêu rõ,
bố cục một khung, khớp reference về cấu trúc/vật liệu/tông/sáng, chỉ đổi điểm nhìn theo góc đích,
không người trong khung,
không nhà thờ, không công trình hay biểu tượng tôn giáo,
không chữ trong hình
```

> **Ghi chú sử dụng**: tự phán đoán chiều cần biến đổi (góc / cỡ / giờ / thời tiết) từ input người dùng; chiều không nhắc thì bỏ trống trường tương ứng. Không cần template riêng cho từng biến thể.

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Cấu trúc không gian không đổi qua các biến thể |
| R2 | Biến thể giờ phải chỉnh tông trời và không khí |
| R3 | Biến thể thời tiết phải thích ứng thực vật / bề mặt vật liệu |
| R4 | Phái sinh phải "một khung" — không ô lưới / chia màn |
| R5 | Khớp reference về cấu trúc / vật liệu / tông / sáng; chỉ đổi điểm nhìn theo góc đích |
| R6 | **Tuyệt đối không người** |
| R7 | Tự phán đoán chiều biến đổi từ input; chiều không nhắc thì bỏ trống |
| R8 | Phải có từ neo nhiếp ảnh (real photography / photorealistic / RAW photo) |
| R9 | Phải có quang học ống kính (shallow depth of field / vignette / natural flare — ít nhất một) |
| R10 | Vật liệu có dấu thời tiết và sử dụng; cấm "cảm CG" tinh tươm |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Cấu trúc / bố cục lệch nhau giữa biến thể |
| X2 | Thời tiết trái mùa (tuyết mùa hạ...) |
| X3 | Vật liệu / phong cách nhảy giữa biến thể |
| X4 | Bất kỳ người, bóng, viền người nào |
| X5 | Bố cục đa hướng / ô lưới / chia màn |
| X6 | Chất 3D render / CG / hoạt hình / game-engine (cấm các từ đó) |
| X7 | Vật liệu tinh tươm không tuổi (cảm nhựa) |
| X8 | Sáng phẳng đều, không chiều sâu, không quang học |
| X9 | Công trình hay biểu tượng tôn giáo xuất hiện ở mọi biến thể |
| X10 | Yếu tố hiện đại; kiến trúc Á Đông |
| X11 | Xác, máu, gore |
