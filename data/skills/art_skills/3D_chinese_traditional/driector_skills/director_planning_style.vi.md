---
name: director_planning_style
description: Ràng buộc 3D Quốc phong — định nghĩa các ràng buộc toàn cục của phong cách 3D Quốc phong về hệ tông màu, phương án ánh sáng, hướng chất liệu, yếu tố không gian bối cảnh, chọn nhạc cụ và tiếng động môi trường. Áp dụng cho mọi thể loại tự sự.
metaData: director_skills
---

# Ràng buộc 3D Quốc phong · 3D Quốc phong · Tham chiếu kỹ thuật

---

## 1. Hệ tông màu và tông chủ đạo của hình ảnh

- **Nền tông màu** — cả phim lấy nguyệt bạch (C1), thanh lục (C2), chàm (C4) làm màu nền, nhiệt màu tổng thể thiên trung tính (4800-5500K), độ bão hòa vừa đến cao (55-75%), toát lên tông màu trang nhã đại khí của thẩm mỹ phương Đông truyền thống
- **Bảng màu cảm xúc dẫn dắt** — sáu bộ bảng màu cảm xúc (cung đình xa hoa/ý cảnh sơn thủy/khuê các dịu dàng/võ hiệp sát khí/lễ hội tưng bừng/đêm trăng thanh vắng) ứng với các đoạn kể chuyện khác nhau, việc chuyển bảng màu phải đồng bộ với đường dây câu chuyện
- **Tương phản nóng lạnh trong kể chuyện** — màu ấm (chu sa C3, vàng kim C5, yên chi C7, đằng hoàng C9) làm tín hiệu thị giác cho bước ngoặt kể chuyện, dùng cho các đoạn cảm xúc ấm lên và các đoạn vui mừng; màu lạnh (chàm C4, đen mực C6) dùng cho các đoạn sát khí, u sầu, thanh vắng
- **Nguyên tắc bảng màu đi trước** — khi quy hoạch từng đoạn phải gắn cảnh cảm xúc trước (cung đình xa hoa/ý cảnh sơn thủy/khuê các dịu dàng/võ hiệp sát khí/lễ hội tưng bừng/đêm trăng thanh vắng...), rồi mới chốt màu chính + màu phụ và phương án ánh sáng, tránh tình trạng "tình tiết đúng nhưng cảm xúc sai màu"
- **Dải màu bị cấm** — màu huỳnh quang bão hòa cao, màu neon, hệ màu số hiện đại đều không tương thích với phong cách này

---

## 2. Hệ phương án ánh sáng

- **Ánh sáng chính là kể chuyện** — 7 phương án ánh sáng ứng với các đoạn cảm xúc khác nhau, ở giai đoạn quy hoạch đạo diễn nên chốt hướng tông ánh sáng ở cấp đoạn chứ không chỉ định từng cú máy
- **Đặc trưng ánh sáng của render 3D** — ánh sáng thể tích, ambient occlusion (AO), xóa phông theo chiều sâu là các thủ pháp ánh sáng cốt lõi của phong cách 3D Quốc phong; mọi phương án ánh sáng đều phải thể hiện được chất render chất liệu vật lý PBR

| Phương án ánh sáng | Tên phương án | Xu hướng tông màu | Cảm xúc áp dụng |
|---|---|---|---|
| A | Ánh ấm rực rỡ | Chu sa + cao sáng vàng kim + nền nguyệt bạch | Cung đình xa hoa, trang nghiêm bề thế, vui mừng hoành tráng |
| B | Ý cảnh thanh lục | Thanh lục + sương nguyệt bạch + ánh sáng thể tích tán | Ý cảnh sơn thủy, chất thơ xa xăm, thanh linh phiêu dật |
| C | Ánh dịu bóng ấm | Tông ấm yên chi + điểm xuyết vàng kim + bóng đổ dịu | Khuê các dịu dàng, mềm mại tinh tế, ấm áp thường ngày |
| D | Tông lạnh sát khí | Đen mực + chàm + tương phản ánh sáng gắt | Võ hiệp sát khí, lạnh lùng sắc lẻm, không khí ngột ngạt |
| E | Ánh tán qua rèm the | Nền nguyệt bạch + ánh chếch tự nhiên + ambient occlusion | Trong nhà ban ngày, sinh hoạt thường ngày, tĩnh mịch tao nhã |
| F | Ánh trăng trong đêm | Chàm + ánh lạnh nguyệt bạch + điểm xuyết ánh ấm vàng kim | Đêm trăng thanh vắng, tĩnh lặng duy mỹ, nhớ nhung đơn độc |
| G | Ánh ấm lễ hội | Chu sa + đằng hoàng + ánh ấm bão hòa cao | Khánh điển lễ hội, náo nhiệt vui tươi, màu sắc phong phú |

- **Phân bổ ánh sáng nóng lạnh** — ánh sáng ấm (chu sa/vàng kim/đằng hoàng) hợp với các đoạn xa hoa, dịu dàng, vui mừng; ánh sáng lạnh (chàm/đen mực) hợp với các đoạn sát khí, u sầu, thanh vắng. Đạo diễn có thể chỉnh điểm chuyển nóng lạnh theo nhu cầu kể chuyện
- **Ánh xạ hướng không khí** — hướng không khí của mỗi phân đoạn phải ánh xạ được về một trong các phương án ánh sáng nói trên (A-G), để bảo đảm nhất quán thị giác

---

## 3. Hướng chất liệu

- **Lấy render 3D làm neo** — cốt lõi của 3D Quốc phong: tạo mô hình độ chính xác cao, render chất liệu PBR, ánh sáng thể tích, ambient occlusion, xóa phông theo chiều sâu, cho ra khung hình render 3D đẳng cấp điện ảnh
- **Chất liệu PBR là trên hết** — chất liệu của toàn bộ phục trang, hóa trang, đạo cụ bắt buộc phải đáng tin qua render vật lý PBR: độ bóng và độ rủ của lụa, vân gỗ và nước bóng của gỗ, độ phản chiếu và chất của kim loại, độ trong và ấm của ngọc, men bóng của đồ sứ
- **Ánh sáng thể tích và chiều sâu trường ảnh** — ánh sáng thể tích là linh hồn của khung hình 3D Quốc phong: cảnh ngoài trời bắt buộc có phối cảnh không khí và tán xạ ánh sáng thể tích, cảnh trong nhà tạo hiệu ứng ánh sáng thể tích bằng ánh cửa sổ/ánh nến; xóa phông theo chiều sâu làm mạnh thêm chiều sâu không gian
- **Chất của năm tháng** — chất liệu không được quá sạch quá hoàn hảo: mặt gỗ có dấu vết sử dụng, mặt đá có vân phong hóa và rêu, vải có nếp gấp tự nhiên, ngói có vệt rêu và chỗ sứt. Cấm "cảm giác nhựa" và "cảm giác CG" mới tinh không tì vết
- **3D không đồng nghĩa với lạnh lẽo** — 3D Quốc phong nhấn mạnh hơi ấm của thẩm mỹ phương Đông, truyền cảm xúc qua chất liệu, lớp lang ánh sáng, phối màu, chứ không dựa vào kỹ xảo phô trương

---

## 4. Yếu tố không gian bối cảnh cổ trang

Các yếu tố bối cảnh đặc thù của thế giới quan cổ trang và chức năng kể chuyện bằng hình của chúng:

- **Rèm the/bình phong/khung cửa** — đạo cụ tạo bố cục khung hình lồng khung một cách tự nhiên, tạo lớp lang "nhìn không thấu" và chiều sâu không gian. Trong render 3D, chất liệu bán trong suốt của rèm the và hiệu ứng ánh sáng xuyên qua là điểm sáng của khung hình
- **Sân vườn/cây hoa/màn mưa** — vật mang tự nhiên cho bố cục để khoảng trống, cảnh chính là tình: đầy sân hoa nở = nhẹ lòng, ngồi một mình trong mưa = cô quạnh, lá rụng bay bay = nỗi biệt ly. Trong bối cảnh 3D, độ khối của cây cỏ và tương tác của nó với ánh sáng đặc biệt quan trọng
- **Ánh nến/ánh trăng/ánh cửa sổ** — vật mang nguồn sáng của thế giới cổ trang, ánh nến = ấm/riêng tư (phương án C), ánh trăng = lạnh/thanh vắng (phương án F), ánh cửa sổ = thường ngày/tĩnh mịch (phương án E). Trong render 3D, hiệu ứng ánh sáng thể tích của nguồn sáng và phản xạ của chất liệu PBR là mấu chốt
- **Mái cong/đấu củng/ngói xanh** — yếu tố mang tính biểu tượng của kiến trúc cổ trang, tạo mô hình 3D phải thể hiện được chi tiết tinh xảo của rường chạm cột vẽ, chất liệu phải có dấu ấn năm tháng
- **Chuyển đoạn bằng cú máy bối cảnh không người** — phong cách này có kho tài nguyên bối cảnh phong phú (biến thể theo thời điểm/thời tiết/mùa), nên nối đoạn bằng cú máy bối cảnh không người làm đệm cảm xúc, đừng cắt cứng
- **Điểm ngoặt dùng hình chứ không dùng thoại** — ưu tiên phương tiện hình ảnh (ánh sáng đổi đột ngột, cắt nhảy cỡ cảnh, ẩn dụ bằng cú máy không người) thay vì dựa vào đối thoại để giải thích

---

## 5. Nhạc cụ cổ trang và âm thanh môi trường

Ràng buộc về yếu tố âm thanh trong thế giới quan cổ trang:

### Lựa chọn nhạc cụ

- **Tiêu (sáo dọc)** — nhạc cụ cốt lõi cho các đoạn thê lương, cô quạnh, bi thương, diễn tả rõ nhất nỗi lạnh lẽo ai oán
- **Đàn nhị (erhu)** — cho các đoạn cảm xúc dâng trào, đau đớn, tương tư; chất nỉ non của tiếng kéo dây hợp với lúc cảm xúc bùng nổ
- **Kèn xô na (suona)** — cho các đoạn cảm xúc biến động dữ dội (đại bi đại hỉ, bước ngoặt số phận, cao trào), dùng dè dặt nhưng đã dùng là như bom hạt nhân
- **Cổ cầm (guqin)** — định tông mở màn / các đoạn êm ả, dùng kèm với tiêu, thể hiện ý cảnh sơn thủy
- **Tì bà (pipa)** — điểm xuyết cho các đoạn căng thẳng, gấp gáp, hợp với cảnh võ hiệp sát khí
- **Cổ tranh (guzheng)** — nhạc cụ tạo không khí cho các đoạn cung đình xa hoa, lễ hội vui mừng, lộng lẫy tao nhã
- Dàn dây trải nền có thể tăng chất điện ảnh nhưng không nên lấn át

### Chiến lược phối hợp nhạc cụ

| Giai đoạn cảm xúc | Tổ hợp nhạc cụ |
|---|---|
| Êm ả/mở màn/kết đoạn | Cổ cầm độc tấu hoặc cổ cầm + tiêu |
| Ý cảnh sơn thủy/thanh linh | Tiêu + cổ cầm + sáo ngang |
| Cung đình xa hoa/vui mừng | Cổ tranh + biên chung + dàn dây |
| Bi thương dần đậm | Tiêu + đàn nhị |
| Cảm xúc bùng nổ/bước ngoặt số phận | Kèn xô na độc tấu hoặc kèn xô na + đàn nhị |
| Võ hiệp sát khí/căng thẳng | Tì bà điểm xuyết + dàn dây lót nền |
| Dịu dàng thường ngày | Cổ cầm + sáo ngang + dàn dây nhẹ |

### Âm thanh môi trường cổ trang

- **Các lớp âm thanh môi trường điển hình** — ve sầu côn trùng kêu / suối chảy róc rách / gió qua rừng trúc / tiếng rao ngoài chợ / mưa đêm nhỏ giọt trên mái / tiếng vải cọ nhau / chuông gió khẽ ngân / chim hót ríu rít / hoa rơi lả tả
- **Mỗi cảnh ghi chú 1-2 âm thanh môi trường cốt lõi**, để hỗ trợ thiết kế hiệu ứng âm thanh về sau. Các lớp âm thanh môi trường càng phong phú thì bối cảnh cổ trang càng có sức cuốn
