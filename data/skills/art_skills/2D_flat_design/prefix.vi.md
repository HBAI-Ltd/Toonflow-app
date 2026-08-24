# Nền tảng thẩm mỹ toàn cục · 2D Flat Design

---
Bắt buộc tuân thủ nghiêm ngặt và đầy đủ toàn bộ ràng buộc phong cách cùng quy tắc toàn cục bên dưới, và sinh prompt đúng nghiêm ngặt theo định dạng khuôn mẫu prompt; chỉ xuất phần thân prompt, không được kèm bất kỳ giải thích, thuyết minh, chú thích, tiêu đề hay văn bản thừa nào khác.
## 1. Gen phong cách

| Chiều | Định nghĩa |
|---|---|
| **Phong cách cấp một** | 2D Flat Design |
| **Phong cách cấp hai** | Tạo hình hình học · mảng màu đơn sắc · không đổ bóng không gradient |
| **Tông cảm xúc** | Tối giản hiện đại · tươi sáng trong trẻo |
| **Từ neo chất liệu** | Đường nét gọn gàng, tô màu đơn sắc, tương phản mảng màu |

---

## 2. Bảng màu toàn cục (đường cơ sở phong cách, không phải khóa cứng)

> Mục tiêu: thống nhất thẩm mỹ chứ không siết sáng tạo. Ngoài "màu ràng buộc cứng", các màu còn lại được ưu tiên dùng mặc định, có thể lệch trong phạm vi hợp lý.

### Các cấp ràng buộc màu

| Cấp | Mức ràng buộc | Diễn giải |
|---|---|---|
| L1 ràng buộc cứng | Cao | Chỉ khóa phần lõi nhận diện nhân vật: hướng thẩm mỹ của màu da, màu tóc, màu nền trang phục chính |
| L2 ràng buộc mềm | Trung bình | Màu bối cảnh, màu phụ kiện, màu điểm xuyết ưu tiên tham chiếu bảng màu, có thể tinh chỉnh theo cú máy và tình tiết |
| L3 cơ chế ngoại lệ | Thấp | Cảnh lãng mạn/cao trào/đặc biệt có thể phá màu cục bộ tạm thời, nhưng phải giữ logic phẳng tổng thể |

| STT | Tên màu | Mã màu | Công dụng |
|---|---|---|---|
| C1 | Xanh tươi sáng | #3B82F6 | Phông nền, trang phục, chủ thể tông lạnh |
| C2 | Cam năng lượng | #F59E0B | Điểm xuyết tông ấm, cao trào cảm xúc |
| C3 | Trắng tinh | #FFFFFF | Phông nền, khoảng trống, cảm giác tinh khiết |
| C4 | Nâu đậm tóc | #4A3728 | Màu tóc, tròng mắt |
| C5 | Xám sang | #8A8A8A | Màu trung tính, yếu tố phụ |
| C6 | Tím nhạt | #C084FC | Đêm, mộng ảo, điểm xuyết |
| C7 | Hồng ấm | #FB7185 | Lãng mạn, rung động, điểm xuyết |
| C8 | Vàng nhạt | #FDE047 | Ấm áp, nắng, phông nền |
| C9 | Trắng ngà | #FEF3C7 | Phông nền, khoảng trống, cảm giác ấm áp |
| C10 | Xanh bạc hà | #5EEAD4 | Thiên nhiên, tươi mới, môi trường |

### Màu ràng buộc cứng (khóa mặc định)

| Hạng mục màu | Màu tương ứng | Quy tắc |
|---|---|---|
| Chuẩn màu da | C3 trắng tinh + C9 trắng ngà | Ưu tiên mặc định, cho phép tinh chỉnh nhẹ độ sáng |
| Chuẩn màu tóc/màu mắt | C4 nâu đậm tóc | Ưu tiên mặc định, cho phép lệch sang nâu đậm/nâu sẫm |

### Màu ràng buộc mềm (ưu tiên khuyến nghị)

> C1/C2/C5/C6/C7/C8/C10 là dải màu khuyến nghị, dùng cho trang phục, trang trí, phông nền, ánh sáng ấm, môi trường... Có thể chỉnh sang sắc lân cận cùng tông theo không khí của cú máy.

### Bảng màu cảm xúc (bản khớp với đạo diễn)

| Cảnh cảm xúc | Màu chính | Màu phụ | Gợi ý tương phản mảng màu | Từ khóa hình ảnh |
|---|---|---|---|---|
| Ấm áp thường ngày | C9 trắng ngà | C3 trắng tinh + C5 xám sang | Tương phản thấp, dịu | Hơi thở đời sống, ấm áp, bình yên |
| Khoảnh khắc rung động | C7 hồng ấm | C2 cam năng lượng + C9 trắng ngà | Tương phản vừa, màu chính nổi bật | Ngượng ngùng, cảm giác gần lại, mập mờ |
| Công sở/học tập | C1 xanh tươi sáng | C3 trắng tinh + C5 xám sang | Tương phản cao, lý trí | Hiệu quả, điềm tĩnh, chuyên nghiệp |
| Cảnh lãng mạn | C7 hồng ấm | C2 cam năng lượng + C8 vàng nhạt | Tương phản cao, lãng mạn | Ngọt ngào, ấm áp, cảm xúc |
| Cảnh đêm | C6 tím nhạt | C1 xanh tươi sáng + C2 cam năng lượng | Lạnh là chính, ấm điểm xuyết | Tĩnh lặng, bí ẩn, suy tư |
| Hồi ức/flashback | C8 vàng nhạt | C5 xám sang + C7 hồng ấm | Tương phản thấp, dịu | Hoài niệm, ký ức cũ, mộng ảo |
| Chia ly bùi ngùi | C5 xám sang | C1 xanh tươi sáng + C6 tím nhạt | Tương phản cao, tông lạnh | Cảm giác xa cách, kìm nén, nén lặng |
| Tái ngộ buông bỏ | C9 trắng ngà | C7 hồng ấm + C2 cam năng lượng | Lạnh trước ấm sau, tăng dần | Ấm lại, nhẹ lòng, chữa lành |

### Quy tắc dùng bảng màu cảm xúc

| Mã | Quy tắc |
|---|---|
| E1 | Mỗi prompt phải chỉ định ít nhất 1 "cảnh cảm xúc" và gắn kèm tổ hợp màu chính + màu phụ |
| E2 | Một cú máy không quá 2 màu chính, tránh làm mờ trọng tâm kể chuyện bằng màu |
| E3 | Khi chuyển cảm xúc, ưu tiên chỉnh sắc màu và nhiệt màu trước, rồi mới chỉnh độ bão hòa |
| E4 | Nội dung hướng chữa lành mặc định theo "nền ấm + tương phản nóng lạnh": màu ấm trải nền, màu lạnh dùng cho phông nền/yếu tố phụ |
| E5 | Nếu xung đột với tình tiết, bảng màu cảm xúc được ưu tiên hơn màu khuyến nghị chung, nhưng không được phá các mục nghiêm cấm |

### Ràng buộc nhiệt màu

| Tham số | Giá trị | Diễn giải |
|---|---|---|
| Nhiệt màu tổng thể | Trung tính 5500-6500K (khuyến nghị) | Tông chủ đạo tối giản hiện đại |
| Nhiệt màu da | Hơi ấm 5800-6200K (khuyến nghị) | Trắng ngà nhưng có sức sống |
| Độ tương phản | Vừa đến hơi cao (nên giữ) | Tương phản mảng màu rõ, nhưng không quá gắt |
| Độ bão hòa | Vừa đến cao 70-90% (khoảng đề xuất) | Tông màu sang của phong cách phẳng |

### Dung sai và ngoại lệ

| Hạng mục | Dung sai đề xuất |
|---|---|
| Lệch sắc màu | ±8° |
| Lệch độ bão hòa | ±10% |
| Lệch độ sáng | ±12% |

> Cảnh ngoại lệ: cú máy lãng mạn, cao trào, chuyển cảm xúc có thể dùng mảng màu cục bộ ấm hơn hoặc bão hòa hơn; nhưng cấm để màu huỳnh quang bão hòa cao và ngôn ngữ màu hiện đại lọt vào khung hình.

---

## 3. Quy tắc ràng buộc toàn cục

### Quy tắc bắt buộc (mọi kỹ năng đều kế thừa)

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc chứa từ neo phong cách "phong cách 2D phẳng + Flat Design" |
| R2 | Bắt buộc tuyên bố "không đổ bóng không gradient + mảng màu đơn sắc" |
| R3 | Gương mặt bắt buộc dùng "tạo hình hình học + đường nét gọn gàng" |
| R4 | Đường viền bắt buộc dùng "đường nét rõ ràng + đều và nhất quán" |
| R5 | Màu sắc bắt buộc tuyên bố "tô màu đơn sắc + tương phản mảng màu rõ ràng" |

### Mục nghiêm cấm (mọi kỹ năng đều kế thừa)

| Mã | Nội dung nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "render 3D/render tả thực/độ chân thực như ảnh chụp" |
| X2 | Nghiêm cấm "đổ bóng/gradient/vân bề mặt/ánh sáng đổ bóng" |
| X3 | Nghiêm cấm "màu huỳnh quang bão hòa cao/màu neon" |
| X4 | Nghiêm cấm các từ có xu hướng "biến dạng khuôn mặt/sai tỉ lệ/dị thường chi thể" |
| X5 | Nghiêm cấm "chi tiết phức tạp/vân bề mặt tinh xảo/phông nền tả thực" |
| X6 | Nghiêm cấm "phối cảnh 3D/mô tả cảm giác chiều sâu" |
