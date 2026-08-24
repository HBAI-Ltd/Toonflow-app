---
name: director_storyboard_table_style
description: Ràng buộc anime Quốc phong cho bảng phân cảnh — định nghĩa quy phạm ánh sáng kiểu cel, gắn kết tông màu, nhịp động tác, động thái môi trường, điều cấm về chuyển động máy quay và về chuyển cảnh của anime Quốc phong Tân Quốc triều trong bảng phân cảnh. Áp dụng cho mọi thể loại tự sự.
metaData: director_skills
---

# Ràng buộc anime Quốc phong cho bảng phân cảnh · Anime Quốc phong Tân Quốc triều · Tham chiếu kỹ pháp

---

## 1. Vị trí của bảng phân cảnh

Bảng phân cảnh là công cụ cốt lõi để đạo diễn chuyển kịch bản thành ngôn ngữ cú máy. Phần dưới đây chỉ nêu các quy phạm ràng buộc của phong cách anime Quốc phong Tân Quốc triều ở cấp bảng phân cảnh.

---

## 2. Ánh sáng và không khí

- **Ánh sáng kiểu cel thống nhất** — trong một cảnh, phương án ánh sáng bắt buộc giữ tính nhất quán của tô màu phẳng kiểu cel, bóng đổ dùng cách đậm dần trong cùng hệ màu (cấm bóng cứng màu đen), trừ khi có bước ngoặt tự sự rõ ràng (như ánh nến tắt → ánh trăng lạnh trong)
- **Gắn bảng màu cảm xúc** — mỗi cảnh gắn ít nhất 1 cảnh cảm xúc (như tiên hiệp phiêu dật/cung đình hoa quý/võ hiệp sát khí/thiếu nữ thường ngày/đêm trăng thi vị/lễ hội khánh điển), và giữ tính liên tục của màu chính + màu phụ trong cụm cú máy, màu lấy từ bảng màu lõi (nguyệt bạch #E8EAF5 / thanh lục #4A9B8A / chu sa #C93752 / chàm #2B4C7E / vàng kim #D4AF37 / đen mực #1A1A2E / yên chi #A94A5F / giả thạch #965E3E / đằng hoàng #F5E375 / tím xám #7B6C85)
- **Quy phạm góc nguồn sáng** — cú máy chính diện mặc định nguồn sáng dịu chiếu xiên 38.5° (chất tô màu phẳng kiểu cel), cú máy chếch bên chỉnh theo nhu cầu khung hình. Khi mô tả ánh sáng phải phân biệt khác biệt góc giữa chính diện và chếch bên, phần render ánh sáng luôn giữ chất hoạt hình kiểu Nhật
- **Tông nóng lạnh khớp với giai đoạn tự sự** — đoạn võ hiệp sát khí/buồn thương ai oán dùng tông lạnh (chàm + đen mực + thanh lục), cấm ánh sáng ấm màu cam ấm/chu sa; đoạn tiên hiệp phiêu dật/thiếu nữ thường ngày dùng tông ấm dịu (nguyệt bạch + yên chi + đằng hoàng); đoạn cung đình hoa quý dùng chu sa + cao sáng vàng kim
- **Chuyển cảnh bằng ánh sáng là thủ pháp cao tay** — chuyển dần từ ánh xuyên rèm the sang bóng ấm ánh nến = thời gian trôi từ ngày sang đêm. Ghi chú điểm biến đổi ánh sáng trong bảng phân cảnh, trong quá trình chuyển, mảng màu kiểu cel bắt buộc chuyển sắc mượt, cấm mảng màu bị đứt gãy/tràn màu
- **Hiệu ứng sáng render kiểu Nhật** — cho phép dùng hợp lý ánh sáng thể tích (volumetric light), xóa phông, viền sáng và các kỹ pháp render hiện đại khác, nhưng bắt buộc giữ tông thẩm mỹ tô màu phẳng kiểu cel của anime Quốc phong, cấm hiệu ứng sáng kiểu 3D tả thực/hoạt hình CG

---

## 3. Động thái môi trường

- **Động thái môi trường cho khung hình chỗ thở** — cánh hoa bay, mây sương lởn vởn, sóng nước lăn tăn, rèm the lay động, tà áo phiêu dật. Cứ 3-4 cú máy phải bố trí ít nhất một cú máy có động thái môi trường, tránh để khung hình "chết"
- **Ưu tiên yếu tố môi trường anime Quốc phong** — động thái môi trường nên chọn các yếu tố thuộc thế giới quan Quốc phong: hoa rụng, bông bay, khói nhẹ, nước chảy, gió qua rừng trúc, ánh nến lung linh, mây sương trôi, đốm sáng đom đóm, hoa tuyết rơi; cấm xuất hiện yếu tố hiện đại
- **Chất động thái kiểu cel** — các yếu tố động thái môi trường (cánh hoa/khói/sóng nước...) bắt buộc giữ chất tô màu phẳng kiểu cel và đường nét tinh tế, cấm xuất hiện hiệu ứng hạt 3D hay hiệu ứng chất lỏng tả thực

---

## 4. Nhịp động tác của anime Quốc phong

- **Động tác thanh nhã và có chất hoạt hình** — động tác nhân vật mặc định chậm rãi thanh nhã, nhưng có thể xử lý cường điệu kiểu anime ở các khung hình then chốt (như đường nét sắc lẻm trong võ hiệp tỉ thí, sợi tóc bay khi thiếu nữ ngoảnh đầu); đứng dậy, xoay người, giơ tay nên ghi chú "chậm rãi/thanh nhã"
- **Động thái trang phục là tài nguyên hình ảnh cốt lõi** — sự bay lượn của trang phục anime Quốc phong (tay áo rộng, tà váy, phi bạch, dải lụa) là tài nguyên động thái tự nhiên, có thể đưa động thái của tà áo/tà váy/dải lụa vào phần mô tả hình ảnh; dưới lối render kiểu cel, trang phục bay phải rõ đường nét, rõ lớp lang
- **Ràng buộc phong thái** — cử chỉ của nhân vật Quốc phong phải hợp với khí chất cổ điển: bước đi vững chậm, cử chỉ hàm súc kín đáo, không xuất hiện ngôn ngữ cơ thể hiện đại (như nhún vai, xòe tay). Nhân vật anime có thể hơi cường điệu ở vi biểu cảm (mắt cong như trăng khuyết, má ửng hồng), nhưng động tác cơ thể vẫn phải tiết chế theo lối cổ điển
- **Tỉ lệ đầu-thân nhất quán** — trong thiết kế động tác, nhân vật bắt buộc giữ tỉ lệ cổ điển kiểu anime 6-7 đầu, cấm phá tỉ lệ đầu-thân vì tư thế động

---

## 5. Ràng buộc chất liệu và chất cảm

- **Neo vào tô màu phẳng kiểu cel** — phần render nhân vật/trang phục/đạo cụ/bối cảnh trong mọi cú máy bắt buộc giữ chất tô màu phẳng kiểu cel, đường nét tinh tế rõ ràng, mảng màu mượt, cấm 3D tả thực/hoạt hình CG/render mức ảnh chụp
- **Chất liệu trang phục** — chất của lụa + thêu + vải ánh ngọc trai thể hiện bằng tô màu phẳng kiểu cel, vân vải bắt buộc siêu rõ, chất vải rõ ràng
- **Chất liệu đạo cụ** — ánh kim lạnh, ngọc trong suốt, vân gỗ rõ, chất sứ ôn nhuận, đều trình bày bằng tô màu phẳng kiểu cel + nét vẽ tinh tế, cấm render chất liệu tả thực
- **Chất liệu bối cảnh** — mặt gỗ có vết dùng, mặt đá có vân phong hóa, vải có nếp gấp tự nhiên, chất liệu mang cảm giác năm tháng nhưng thể hiện bằng nét vẽ anime Quốc phong, cấm chất liệu mới tinh không tì vết mang "cảm giác nhựa"

---

## 6. Ràng buộc màu sắc

- **Khóa bảng màu lõi** — màu sắc của mọi cú máy trong bảng phân cảnh bắt buộc lấy từ bảng màu lõi (C1-C10), dung sai lệch sắc màu ±8°, lệch độ bão hòa ±10%, lệch độ sáng ±12%
- **Cấm màu huỳnh quang** — nghiêm cấm để màu huỳnh quang bão hòa cao/màu neon/màu mang cảm giác kỹ thuật số mạnh xuất hiện
- **Màu đường nét** — đen mực hoặc nâu sẫm, cấm đường nét thô màu đen tuyền
- **Màu bóng đổ** — đậm dần trong cùng hệ màu, cấm bóng cứng màu đen
- **Nhiệt màu tổng thể** — tông ánh sáng tự nhiên thiên trung tính 5000-5600K, độ tương phản 45-65%, độ bão hòa 55-70% (bảng màu Tân Quốc triều đầy đặn)

---

## 7. Điều cấm về chuyển động máy quay

- **Cấm chuyển động máy quay nhanh** — lia máy nhanh (甩镜), đẩy máy gấp, rung máy cầm tay xung đột với khí chất thanh nhã của anime Quốc phong Tân Quốc triều; cảnh võ hiệp tỉ thí có thể tăng nhịp chuyển động máy quay ở mức vừa phải nhưng vẫn phải giữ khung hình rõ ràng
- **Cấm chuyển cảnh cầu kỳ** — quét màn, xoay, kiểu rèm sáo... không tương thích với phong cách này
- **Cấm ngôn ngữ cú máy tả thực** — rung lắc máy cầm tay/bám theo kiểu phim tài liệu/ống kính mắt cá... xung đột với thẩm mỹ anime, phá vỡ sự thuần khiết của khung hình tô màu phẳng kiểu cel
