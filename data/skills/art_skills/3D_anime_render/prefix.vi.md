# Nền tảng thẩm mỹ toàn cục · Render anime 3D

---
Bắt buộc tuân thủ nghiêm ngặt và đầy đủ toàn bộ ràng buộc phong cách cùng quy tắc toàn cục bên dưới, và sinh prompt đúng nghiêm ngặt theo định dạng khuôn mẫu prompt; chỉ xuất phần thân prompt, không được kèm bất kỳ giải thích, thuyết minh, chú thích, tiêu đề hay văn bản thừa nào khác.
## 1. Gen phong cách

| Chiều | Định nghĩa |
|---|---|
| **Phong cách cấp một** | Render anime 3D (3D Animation Rendering) |
| **Phong cách cấp hai** | Chất liệu cel-shading · chiều sâu ánh sáng điện ảnh |
| **Tông cảm xúc** | Chữa lành · tươi sáng ấm áp |
| **Từ neo chất liệu** | Đường viền rõ nét, chất liệu chi tiết cao, tông ấm dịu |

---

## 2. Bảng màu toàn cục (đường cơ sở phong cách, không phải khóa cứng)

> Mục tiêu: thống nhất thẩm mỹ chứ không siết sáng tạo. Ngoài "màu ràng buộc cứng", các màu còn lại được ưu tiên dùng mặc định, có thể lệch trong phạm vi hợp lý.

### Các cấp ràng buộc màu

| Cấp | Mức ràng buộc | Diễn giải |
|---|---|---|
| L1 ràng buộc cứng | Cao | Chỉ khóa phần lõi nhận diện nhân vật: hướng thẩm mỹ của màu da, màu tóc, màu nền trang phục chính |
| L2 ràng buộc mềm | Trung bình | Màu bối cảnh, màu phụ kiện, màu điểm xuyết ưu tiên tham chiếu bảng màu, có thể tinh chỉnh theo cú máy và tình tiết |
| L3 cơ chế ngoại lệ | Thấp | Cảnh lãng mạn/cao trào/đặc biệt có thể phá màu cục bộ tạm thời, nhưng phải giữ logic tông ấm tổng thể |

| STT | Tên màu | Mã màu | Công dụng |
|---|---|---|---|
| C1 | Cam ấm | #F5A673 | Nền màu da, hoàng hôn, ráng chiều |
| C2 | Hồng hoa anh đào | #F4D5D5 | Ửng hồng gò má, lãng mạn, điểm xuyết |
| C3 | Xanh da trời | #87AEC9 | Bầu trời, trang phục, điểm xuyết tông lạnh |
| C4 | Nâu đậm tóc | #4A3728 | Màu tóc, tròng mắt |
| C5 | Xám sang | #8A8A8A | Kiến trúc, bóng đổ, màu trung tính |
| C6 | Tím nhạt | #D0C4D6 | Đêm, mộng ảo, hồi ức |
| C7 | Hổ phách ấm | #C9A96E | Hoàng hôn, ánh đèn, cảm giác ấm áp |
| C8 | Xanh bạc hà | #9DC2A5 | Cây cỏ, thiên nhiên, môi trường |
| C9 | Trắng ngà | #F5F0E8 | Mặt tường, trang phục, phông nền |
| C10 | Vàng ấm | #F5E6D0 | Trong nhà, ánh sáng ấm, cảm giác ấm cúng |

### Màu ràng buộc cứng (khóa mặc định)

| Hạng mục màu | Màu tương ứng | Quy tắc |
|---|---|---|
| Chuẩn màu da | C1 cam ấm | Ưu tiên mặc định, cho phép tinh chỉnh nhẹ độ sáng/độ ấm |
| Chuẩn màu tóc/màu mắt | C4 nâu đậm tóc | Ưu tiên mặc định, cho phép lệch nhẹ sang nâu đậm/nâu sẫm |

### Màu ràng buộc mềm (ưu tiên khuyến nghị)

> C2/C3/C5/C6/C7/C8/C9/C10 là dải màu khuyến nghị, dùng cho trang phục, trang trí, phông nền, ánh sáng ấm, môi trường... Có thể chỉnh sang sắc lân cận cùng tông theo không khí của cú máy.

### Bảng màu cảm xúc (bản khớp với đạo diễn)

| Cảnh cảm xúc | Màu chính | Màu phụ | Gợi ý hiệu ứng sáng và tương phản | Từ khóa hình ảnh |
|---|---|---|---|---|
| Ấm áp thường ngày | C10 vàng ấm | C9 trắng ngà + C5 xám sang | Tông ấm đều, tương phản dịu | Hơi thở đời sống, ấm áp, bình yên |
| Khoảnh khắc rung động | C2 hồng hoa anh đào | C1 cam ấm + C10 vàng ấm | Cú máy vừa và gần tăng độ ấm, da hơi ửng đỏ | Ngượng ngùng, cảm giác gần lại, mập mờ |
| Cảnh sắc đô thị | C9 trắng ngà | C5 xám sang + C3 xanh da trời | Lớp sáng tối rõ ràng, trung tính là chính | Đô thị, khoáng đạt, tự nhiên |
| Lãng mạn hoàng hôn | C7 hổ phách ấm | C1 cam ấm + C2 hồng hoa anh đào | Ráng chiều ngược sáng, viền sáng | Lãng mạn, ấm áp, cảm xúc |
| Cảnh phố đêm | C3 xanh da trời | C6 tím nhạt + C1 cam ấm | Tông lạnh là chính, ấm điểm xuyết | Đô thị, tĩnh lặng, sức sống |
| Thường ngày trong nhà | C10 vàng ấm | C9 trắng ngà + C5 xám sang | Ánh ấm tán dịu, cảm giác ấm cúng | Ở nhà, dễ chịu, an toàn |
| Hồi ức/flashback | C1 cam ấm | C5 xám sang + C7 hổ phách ấm | Tán dịu mờ sương, phai màu nhẹ | Hoài niệm, ký ức cũ, mộng ảo |
| Chia ly bùi ngùi | C5 xám sang | C3 xanh da trời + C1 cam ấm | Giảm bão hòa, nới rộng tương phản nóng lạnh | Cảm giác xa cách, kìm nén, nén lặng |

### Quy tắc dùng bảng màu cảm xúc

| Mã | Quy tắc |
|---|---|
| E1 | Mỗi prompt phải chỉ định ít nhất 1 "cảnh cảm xúc" và gắn kèm tổ hợp màu chính + màu phụ |
| E2 | Một cú máy không quá 2 màu chính, tránh làm mờ trọng tâm kể chuyện bằng màu |
| E3 | Khi chuyển cảm xúc, ưu tiên chỉnh tỉ lệ sáng và nhiệt màu trước, rồi mới chỉnh độ bão hòa |
| E4 | Nội dung hướng chữa lành mặc định theo "nền ấm + tương phản nóng lạnh": màu ấm trải nền, màu lạnh dùng cho phông nền/vùng bóng |
| E5 | Nếu xung đột với tình tiết, bảng màu cảm xúc được ưu tiên hơn màu khuyến nghị chung, nhưng không được phá các mục nghiêm cấm |

### Ràng buộc nhiệt màu

| Tham số | Giá trị | Diễn giải |
|---|---|---|
| Nhiệt màu tổng thể | Thiên ấm 4800-5200K (khuyến nghị) | Tông chủ đạo ấm áp chữa lành |
| Nhiệt màu da | Hơi ấm 5000-5400K (khuyến nghị) | Cam ấm nhưng có sức sống |
| Độ tương phản | Vừa (nên giữ) | Lớp sáng tối rõ, nhưng không quá gắt |
| Độ bão hòa | Vừa đến cao 65-80% (khoảng đề xuất) | Tông màu sang của anime 3D |

### Dung sai và ngoại lệ

| Hạng mục | Dung sai đề xuất |
|---|---|
| Lệch sắc màu | ±8° |
| Lệch độ bão hòa | ±10% |
| Lệch độ sáng | ±12% |

> Cảnh ngoại lệ: cú máy lãng mạn, hoàng hôn, cao trào cảm xúc có thể dùng mảng màu cục bộ ấm hơn hoặc bão hòa hơn; nhưng cấm để màu huỳnh quang bão hòa cao và ngôn ngữ màu hiện đại lọt vào khung hình.

---

## 3. Quy tắc ràng buộc toàn cục

### Quy tắc bắt buộc (mọi kỹ năng đều kế thừa)

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc chứa từ neo phong cách "render 3D animation + chất liệu cel-shading" |
| R2 | Bắt buộc tuyên bố "đường viền rõ nét + chất liệu chi tiết cao" |
| R3 | Gương mặt bắt buộc dùng "chất liệu tả thực kết hợp tỉ lệ hoạt hình + ánh sáng dịu" |
| R4 | Sợi tóc bắt buộc dùng "đường viền rõ nét + lớp sáng tối tự nhiên" |
| R5 | Ánh sáng bắt buộc tuyên bố "ánh sáng điện ảnh + lớp sáng tối dịu" |

### Mục nghiêm cấm (mọi kỹ năng đều kế thừa)

| Mã | Nội dung nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "render tả thực/độ chân thực như ảnh chụp" |
| X2 | Nghiêm cấm "tông tối/đổ bóng nặng/tương phản quá mức" |
| X3 | Nghiêm cấm "màu huỳnh quang bão hòa cao/màu neon" |
| X4 | Nghiêm cấm các từ có xu hướng "biến dạng khuôn mặt/sai tỉ lệ/dị thường chi thể" |
| X5 | Nghiêm cấm "thiếu yếu tố hiện đại" (bắt buộc nêu rõ bối cảnh hiện đại) |
| X6 | Nghiêm cấm "yếu tố cyberpunk/steampunk/tây huyễn hư cấu" |