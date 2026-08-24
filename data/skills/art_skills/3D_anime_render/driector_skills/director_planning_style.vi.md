---
name: director_planning_style
description: Ràng buộc render anime 3D — định nghĩa các ràng buộc toàn cục của render hoạt hình 3D về hệ tông màu, phương án ánh sáng, hướng chất liệu, yếu tố không gian bối cảnh đô thị, chọn nhạc cụ và tiếng động môi trường. Áp dụng cho mọi thể loại tự sự.
metaData: director_skills
---

# Ràng buộc render anime 3D · Render hoạt hình 3D · Tham chiếu kỹ thuật

---

## 1. Hệ tông màu và tông chủ đạo của hình ảnh

- **Nền tông màu** — cả phim lấy cam ấm (C1), xanh da trời (C3), hồng hoa anh đào (C5) làm màu nền, nhiệt màu tổng thể thiên ấm (4800-5200K), độ bão hòa vừa đến cao (65-80%), toát lên cảm giác ấm áp chữa lành của anime 3D tươi sáng
- **Tương phản nóng lạnh trong kể chuyện** — màu ấm (cam ấm C1, hổ phách ấm, hồng ấm) chạy suốt cả phim làm tông chủ đạo, màu lạnh (xanh nhạt C3, tím nhạt C6) làm điểm xuyết cục bộ để tăng chiều sâu. Việc chuyển nóng lạnh phải đồng bộ với đường dây câu chuyện, không trộn tùy tiện
- **Chiến lược phân bổ nóng lạnh** — cả phim giữ nền tông ấm, tông lạnh chỉ dùng ở đoạn ban đêm hoặc đoạn chuyển biến cảm xúc, tạo thành tương phản nóng lạnh
- **Nguyên tắc bảng màu đi trước** — khi quy hoạch từng đoạn phải gắn cảnh cảm xúc trước (gặp gỡ/thường ngày/phiêu lưu/chia ly...), rồi mới chốt màu chính + màu phụ và phương án ánh sáng, tránh tình trạng "tình tiết đúng nhưng cảm xúc sai màu"
- **Dải màu bị cấm** — hệ màu xám tối u ám, màu đục bão hòa quá mức, và mọi hệ màu không hợp với khí chất tươi sáng của anime 3D đều không tương thích

---

## 2. Hệ phương án ánh sáng

- **Ánh sáng chính là kể chuyện** — 6 phương án ánh sáng ứng với các đoạn cảm xúc khác nhau, ở giai đoạn quy hoạch đạo diễn nên chốt hướng tông ánh sáng ở cấp đoạn chứ không chỉ định từng cú máy
- **Góc nguồn sáng** — mặc định ngược sáng chếch 45°, mô phỏng hiệu ứng ráng chiều hoàng hôn

| Phương án ánh sáng | Tên phương án | Xu hướng tông màu | Cảm xúc áp dụng |
|---|---|---|---|
| A | Ánh mai dịu | Nền vàng ấm + ánh dịu đều | Mở đầu cả phim, sớm mai đô thị |
| B | Ánh chếch tông ấm | Cam ấm chủ đạo + ánh ấm cục bộ | Ấm áp thường ngày, quán cà phê/ở nhà |
| C | Ánh đỉnh + ánh môi trường | Ấm trung tính + trắng lạnh dịu | Đoạn làm việc/học tập |
| D | Ráng chiều ngược sáng | Hổ phách ấm chủ đạo + hồng ấm điểm xuyết | Lãng mạn hoàng hôn, đoạn ngọt ngào |
| E | Quầng sáng neon | Cam ấm + phông xanh lạnh | Cảnh phố đêm, đoạn lãng mạn |
| F | Ánh ấm tán dịu | Vàng ấm chủ đạo + hiệu ứng mờ sương | Đoạn hồi ức/cảm xúc |

- **Phân bổ ánh sáng nóng lạnh** — tông ấm dùng được xuyên suốt cả phim, tông lạnh (xanh lạnh + tương phản màu ấm) dùng vào ban đêm hoặc sau bước ngoặt cảm xúc. Đạo diễn có thể chỉnh điểm chuyển nóng lạnh theo nhu cầu kể chuyện
- **Ánh xạ hướng không khí** — hướng không khí của mỗi phân đoạn phải ánh xạ được về một trong các phương án ánh sáng nói trên (A-F), để bảo đảm nhất quán thị giác

---

## 3. Hướng chất liệu

- **Cảm giác chân thực kiểu cel-shading** — cốt lõi của render anime 3D: đường viền rõ nét, lên màu tươi sáng, lớp sáng tối dịu
- **Chất liệu chi tiết cao + ánh sáng dịu** — đây là điểm neo của chất hình ảnh. Không phải làm mịn quá mức, không phải render tả thực hiện đại, mà là chất liệu cel-shading đặc trưng của anime 3D
- **Chi tiết chất liệu phong phú** — chi tiết chất liệu của mọi trang phục, đạo cụ phải đáng tin: vân nếp gấp của vải, highlight kiểu hoạt hình trên kim loại, ánh bóng ấm của món ăn. Cấm "tả thực quá mức" và "cảm giác low-poly thô ráp"
- **Cel-shading không đồng nghĩa với phẳng dẹt** — anime 3D nhấn vào biểu đạt chất liệu cel-shading (đường viền rõ nét, lên màu tươi sáng, lớp sáng tối dịu), khuếch đại sức lay động bằng thiết kế ánh sáng và bố cục chứ không dựa vào kỹ xảo phức tạp quá mức

---

## 4. Yếu tố không gian bối cảnh đô thị

Các yếu tố bối cảnh đặc trưng của thế giới quan đô thị anime 3D và chức năng kể chuyện bằng hình của chúng:

- **Khung cửa/hành lang/cầu thang** — đạo cụ dựng bố cục khung hình tự nhiên, tạo chiều sâu và lớp lang không gian
- **Đường phố/công viên/bầu trời** — vật mang tự nhiên của bố cục chừa khoảng trống, cảnh chính là tình: bóng dài trên phố lúc hoàng hôn = cảm giác lãng mạn, ánh ấm quán cà phê = cảm giác an toàn, cảnh nhìn qua cửa sổ cao ốc = cảm giác xa cách của đô thị
- **Đèn bàn/neon/ánh cửa sổ** — vật mang nguồn sáng của thế giới đô thị, đèn bàn = ấm/riêng tư (phương án B), neon = sức sống/lãng mạn (phương án E), ánh cửa sổ = thường ngày/tĩnh lặng (phương án A)
- **Dùng cú máy bối cảnh trống để chuyển giữa các đoạn** — phong cách này có kho tài nguyên bối cảnh phong phú (biến thể theo thời điểm/kiểu trời/thời tiết), khi nối đoạn nên dùng cú máy bối cảnh trống làm khoảng đệm cảm xúc, đừng cắt cứng
- **Điểm ngoặt dùng hình ảnh + hành động** — ưu tiên thủ pháp hình ảnh (biến đổi ánh sáng, chuyển bối cảnh) kết hợp thiết kế hành động, thay vì dựa vào thoại để giải thích

---

## 5. Nhạc cụ đô thị và tiếng động môi trường

Ràng buộc về các yếu tố âm thanh trong thế giới quan đô thị anime 3D:

### Chọn nhạc cụ

- **Piano** — nhạc cụ cốt lõi cho đoạn thường ngày/ấm áp/hồi ức, thể hiện được chất anime 3D rõ nhất
- **Guitar** — cho đoạn nhẹ nhàng/lãng mạn/đường phố, vẻ dịu dàng của tiếng quạt dây hợp với không khí đô thị
- **Nền đàn dây** — cho đoạn thăng hoa cảm xúc/chia ly, vẻ tinh tế của tiếng kéo dây hợp với các đoạn chuyển cảm xúc
- **Hiệu ứng điện tử** — cho đoạn trẻ trung/giàu tiết tấu, hợp với bối cảnh đô thị hiện đại
- Tiếng động môi trường là yếu tố quan trọng nhưng không được lấn át

### Chiến lược phối hợp nhạc cụ

| Giai đoạn cảm xúc | Tổ hợp nhạc cụ |
|---|---|
| Bình ổn/mở đầu/kết | Guitar độc tấu hoặc hiệu ứng điện tử |
| Ấm áp thường ngày | Piano + guitar nhẹ |
| Thăng hoa cảm xúc/lãng mạn | Đàn dây + piano |
| Căng thẳng/gấp gáp | Hiệu ứng điện tử + nền đàn dây |

### Tiếng động môi trường đô thị

- **Các lớp tiếng động môi trường điển hình** — tiếng xe cộ thành phố / tiếng nền quán cà phê / tiếng báo hiệu tàu điện ngầm / tiếng gió lùa qua tán lá / tiếng người trò chuyện / tiếng bước chân / tiếng thang máy
- **Mỗi phân đoạn ghi chú 1-2 tiếng động môi trường cốt lõi**, để hỗ trợ khâu thiết kế âm thanh về sau. Các lớp tiếng động môi trường càng phong phú, bối cảnh đô thị càng đắm chìm