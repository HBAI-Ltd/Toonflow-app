# Nền tảng thẩm mỹ toàn cục · 3D Quốc phong

---
Bắt buộc tuân thủ nghiêm ngặt và đầy đủ toàn bộ ràng buộc phong cách cùng quy tắc toàn cục bên dưới, và sinh prompt đúng nghiêm ngặt theo định dạng khuôn mẫu prompt; chỉ xuất phần thân prompt, không được kèm bất kỳ giải thích, thuyết minh, chú thích, tiêu đề hay văn bản thừa nào khác.

## 1. Gen phong cách

| Chiều | Định nghĩa |
|---|---|
| **Phong cách cấp một** | Render 3D Quốc phong (Chinese Style 3D) |
| **Phong cách cấp hai** | Tạo mô hình 3D độ chính xác cao · thẩm mỹ phương Đông truyền thống |
| **Tông cảm xúc** | Trang nhã đại khí, ý cảnh sâu xa, lộng lẫy tinh xảo |
| **Từ neo chất liệu** | Render chất liệu PBR, ánh sáng thể tích, ambient occlusion |

---

## 2. Bảng màu toàn cục (đường cơ sở phong cách)

### Các cấp ràng buộc màu

| Cấp | Mức ràng buộc | Diễn giải |
|---|---|---|
| L1 ràng buộc cứng | Cao | Đường cơ sở màu truyền thống Trung Hoa, màu render 3D |
| L2 ràng buộc mềm | Trung bình | Màu bối cảnh, màu trang phục, màu điểm xuyết có thể tinh chỉnh theo tình tiết |
| L3 cơ chế ngoại lệ | Thấp | Cảnh đặc biệt/lễ hội có thể phá màu cục bộ tạm thời |

### Bảng màu lõi

| STT | Tên màu | Mã màu | Công dụng |
|---|---|---|---|
| C1 | Trắng nguyệt bạch (月白) | #E0E8F0 | Bầu trời, mây sương, màu nền áo trắng |
| C2 | Thanh lục (青绿) | #4A8C7E | Sơn thủy, cây cỏ, tranh sơn thủy thanh lục |
| C3 | Chu sa (朱红) | #B22222 | Kiến trúc, cửa nẻo, cảnh vui mừng |
| C4 | Chàm (靛蓝) | #3B4B7C | Trời đêm, núi xa, tông lạnh |
| C5 | Vàng kim (金黄) | #D4AF37 | Trang trí, hoa văn, vùng cao sáng |
| C6 | Đen mực (墨黑) | #1C1C1C | Đường nét, đường viền, vùng tối |
| C7 | Yên chi (胭脂) | #A94A5F | Màu da nhân vật, màu môi, má hồng |
| C8 | Giả thạch (赭石) | #965E3E | Phần gỗ của kiến trúc, mặt đất, tông ấm |
| C9 | Đằng hoàng (藤黄) | #F0E442 | Điểm xuyết, hoa văn trang trí, ánh sáng ấm |
| C10 | Xám mộc (素灰) | #B8B8B8 | Đá, chuyển tiếp, tông trung gian |

### Màu ràng buộc cứng (khóa mặc định)

| Hạng mục màu | Màu tương ứng | Quy tắc |
|---|---|---|
| Tông màu tổng thể | Lấy tông màu truyền thống Trung Hoa làm chính | Cấm màu huỳnh quang bão hòa cao |
| Chất liệu | Render chất liệu vật lý PBR | Cấm cảm giác nhựa/không có chất liệu |
| Hướng ánh sáng | Kết hợp ánh sáng tự nhiên + ánh sáng nhân tạo | Cấm ánh sáng gắt từ một nguồn duy nhất |

### Bảng màu cảm xúc

| Cảnh cảm xúc | Màu chính | Màu phụ | Gợi ý hiệu ứng sáng và tương phản | Từ khóa hình ảnh |
|---|---|---|---|---|
| Cung đình xa hoa | C3 chu sa + C5 vàng kim | C1 nguyệt bạch + C6 đen mực | Chiếu sáng tông ấm, nhấn vùng cao sáng, lớp lang chiều sâu | Lộng lẫy, trang nghiêm, bề thế |
| Ý cảnh sơn thủy | C2 thanh lục + C1 nguyệt bạch | C4 chàm + C10 xám mộc | Ánh sáng thể tích dịu, xóa phông theo chiều sâu, không khí mờ sương | Chất thơ, xa xăm, thanh thoát |
| Khuê các dịu dàng | C7 yên chi + C1 nguyệt bạch | C5 vàng kim + C10 xám mộc | Ánh ấm dịu, cao sáng cục bộ, cận cảnh (近景) và đặc tả (特写) | Mềm mại, tinh tế, ấm áp |
| Võ hiệp sát khí | C6 đen mực + C4 chàm | C8 giả thạch + C10 xám mộc | Bóng đổ tông lạnh, tương phản ánh sáng gắt, không khí ngột ngạt | Lạnh lùng, sắc lẻm, sát khí |
| Lễ hội tưng bừng | C3 chu sa + C9 đằng hoàng | C5 vàng kim + C7 yên chi | Ánh ấm bão hòa cao, sáng đều toàn cục, màu sắc phong phú | Náo nhiệt, vui tươi, hoành tráng |
| Đêm trăng thanh vắng | C4 chàm + C1 nguyệt bạch | C6 đen mực + C5 vàng kim điểm xuyết | Ánh trăng tông lạnh, ánh ấm cục bộ, tương phản sáng tối | Tĩnh lặng, lạnh thanh, duy mỹ |

### Ràng buộc nhiệt màu

| Tham số | Giá trị | Diễn giải |
|---|---|---|
| Nhiệt màu tổng thể | Thiên trung tính 4800-5500K (khuyến nghị) | Tông chủ đạo là ánh sáng tự nhiên |
| Độ tương phản | Vừa 45-65% (khoảng đề xuất) | Lớp lang phong phú |
| Độ bão hòa | Vừa đến cao 55-75% (khoảng đề xuất) | Bảng màu truyền thống đầy đặn |

### Dung sai và ngoại lệ

| Hạng mục | Dung sai đề xuất |
|---|---|
| Lệch sắc màu | ±8° |
| Lệch độ bão hòa | ±10% |
| Lệch độ sáng | ±12% |

---

## 3. Quy tắc ràng buộc toàn cục

### Quy tắc bắt buộc (mọi kỹ năng đều kế thừa)

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc chứa từ neo phong cách "phong cách render 3D" |
| R2 | Bắt buộc tuyên bố "chất liệu PBR + tạo mô hình độ chính xác cao" |
| R3 | Bắt buộc tuyên bố "màu sắc truyền thống Trung Hoa + thẩm mỹ phương Đông" |
| R4 | Bắt buộc tuyên bố "render ánh sáng đẳng cấp điện ảnh" |
| R5 | Bắt buộc tuyên bố "thẩm mỹ 3D Quốc phong" |

### Mục nghiêm cấm (mọi kỹ năng đều kế thừa)

| Mã | Nội dung nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "nhiếp ảnh tả thực/độ chân thực như ảnh chụp" |
| X2 | Nghiêm cấm "màu huỳnh quang bão hòa cao/màu neon/cảm giác số hóa quá đậm" |
| X3 | Nghiêm cấm "fantasy phương Tây/cyberpunk/yếu tố hiện đại" |
| X4 | Nghiêm cấm "tạo mô hình độ chính xác thấp/texture thô/chất liệu nhựa" |
| X5 | Nghiêm cấm "màu sắc hỗn loạn/ánh sáng sai/phối cảnh sai" |