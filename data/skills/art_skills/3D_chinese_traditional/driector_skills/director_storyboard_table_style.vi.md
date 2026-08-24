---
name: director_storyboard_table_style
description: Ràng buộc 3D Quốc phong cho bảng phân cảnh — định nghĩa quy phạm ánh sáng và không khí, chất liệu render 3D, nhịp hành động, động thái môi trường, điều kiêng về chuyển động máy quay và về chuyển cảnh của phong cách 3D Quốc phong trong bảng phân cảnh. Áp dụng cho mọi thể loại tự sự.
metaData: director_skills
---

# Ràng buộc 3D Quốc phong cho bảng phân cảnh · 3D Quốc phong · Tham chiếu kỹ thuật

---

## 1. Vị trí của bảng phân cảnh

Bảng phân cảnh là công cụ cốt lõi để đạo diễn chuyển kịch bản thành ngôn ngữ cú máy. Phần dưới đây chỉ cung cấp quy phạm ràng buộc của phong cách 3D Quốc phong ở cấp bảng phân cảnh.

---

## 2. Ánh sáng và không khí

- **Thống nhất ánh sáng trong cùng một phân đoạn** — trong một phân đoạn không nên xuất hiện quá hai phương án ánh sáng, trừ khi có bước ngoặt kể chuyện rõ ràng (như ánh sáng tự nhiên đổi từ ngày sang đêm, từ nắng sang mưa)
- **Gắn bảng màu cảm xúc** — mỗi phân đoạn gắn ít nhất 1 cảnh cảm xúc (cung đình xa hoa/ý cảnh sơn thủy/khuê các dịu dàng/võ hiệp sát khí/lễ hội tưng bừng/đêm trăng thanh vắng), và giữ màu chính + màu phụ liên tục trong cả nhóm cú máy
- **Quy phạm ánh sáng render 3D** — khi mô tả ánh sáng phải nêu rõ hướng và cường độ của ánh sáng thể tích, lớp lang của ambient occlusion, phạm vi xóa phông theo chiều sâu. Hiệu ứng phản xạ/khúc xạ của chất liệu PBR dưới các điều kiện sáng khác nhau là mấu chốt tạo nên chất của khung hình
- **Khớp tông nóng lạnh với giai đoạn kể chuyện** — các đoạn sát khí/u sầu/ngột ngạt dùng ánh sáng tông lạnh (chàm + đen mực), cấm dùng tông ấm như chu sa/vàng kim; tông ấm (chu sa + vàng kim + yên chi) chỉ dùng ở các đoạn xa hoa, dịu dàng, vui mừng
- **Chuyển cảnh bằng ánh sáng là thủ pháp cao tay** — chuyển dần từ ánh sáng tán qua rèm the (E) sang ánh trăng trong đêm (F) = dòng thời gian trôi từ ngày sang đêm. Ghi chú điểm biến đổi ánh sáng trong bảng phân cảnh

---

## 3. Động thái môi trường

- **Động thái môi trường giúp khung hình có chỗ thở** — cánh hoa rơi, khói bốc, sóng nước lăn tăn, rèm the lay động, hạt bụi trong luồng sáng thể tích. Cứ 3-4 cú máy phải bố trí ít nhất một cú máy có động thái môi trường, tránh để khung hình "chết"
- **Ưu tiên yếu tố môi trường cổ phong** — động thái môi trường phải chọn yếu tố nằm trong thế giới quan cổ phong: hoa rụng, tơ liễu bay, khói nhẹ, nước chảy, gió qua rừng trúc, lửa nến chập chờn; cấm xuất hiện yếu tố hiện đại
- **Hạt và hiệu ứng thể tích 3D** — động thái môi trường của 3D Quốc phong phải tận dụng tối đa ưu thế của render 3D: tán xạ ánh sáng thể tích trong sương, phản xạ PBR trên mặt nước, quỹ đạo rơi theo vật lý của cánh hoa, render thể tích của khói

---

## 4. Nhịp hành động cổ phong

- **Hành động cổ phong phải chậm** — mọi hành động của nhân vật mặc định chậm. Đứng dậy, quay người, giơ tay đều phải ghi chú "chậm rãi"
- **Động thái trang phục** — sự bay lượn của trang phục cổ phong (tay áo rộng, tà váy, khăn choàng lụa) là tài nguyên động tự nhiên; độ rủ và độ bay của mô phỏng vải trong render 3D phải được thể hiện trong mô tả hình ảnh, làm khung hình thêm "sống"
- **Ràng buộc nghi thái** — cử chỉ của nhân vật cổ phong phải hợp khí chất thời đại: đi đứng khoan thai, cử chỉ kín đáo dè dặt, không xuất hiện ngôn ngữ hình thể hiện đại (như nhún vai, xòe tay)
- **Chất hoạt hình 3D** — chuyển tiếp hành động phải tự nhiên mượt mà, thể hiện được sự tinh xảo của hoạt hình 3D. Tránh chuyển tư thế cứng nhắc, chú ý cung độ tự nhiên của khớp và sự dịch chuyển trọng tâm

---

## 5. Điều kiêng về chuyển động máy quay

- **Cấm chuyển động máy nhanh** — lia máy nhanh (甩镜), đẩy máy gấp, rung máy cầm tay xung khắc với khí chất trang nhã của 3D Quốc phong
- **Cấm chuyển cảnh màu mè** — xóa quét, xoay, lật kiểu rèm sáo... không tương thích với phong cách này
- **Dùng tốt chuyển động máy trong không gian 3D** — có thể tận dụng chiều sâu không gian của bối cảnh 3D để đẩy/kéo hoặc vòng quanh (环绕) chậm rãi, nhưng phải giữ nhịp trầm ổn tao nhã; cấm lối chuyển động máy khoe kỹ thuật kiểu xuyên qua/bay lượn
