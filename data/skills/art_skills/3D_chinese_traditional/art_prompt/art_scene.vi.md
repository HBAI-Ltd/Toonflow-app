---
name: art_scene
description: Tạo ảnh bối cảnh · sổ tay ràng buộc
metaData: art_skills
---

# Tạo ảnh bối cảnh · Sổ tay ràng buộc

---

## 1. Nguyên tắc thẩm mỹ bối cảnh

1. **Kể chuyện bằng không gian** — bối cảnh gánh chức năng cảm xúc và kể chuyện, không phải tấm phông thuần túy
2. **Lớp lang chiều sâu** — mọi bối cảnh bắt buộc có lớp trước/giữa/sau, loại bỏ sự phẳng dẹt
3. **Chất liệu là trên hết** — vân chất liệu của gỗ/đá/vải/mặt nước bắt buộc siêu rõ
4. **Lấy 3D làm neo** — mọi khung hình lấy render 3D làm chuẩn, từ chối chất texture phẳng/render 3D/hoạt hình CG; theo đuổi các hiệu ứng render điện ảnh như ánh sáng thể tích, ambient occlusion, xóa phông theo chiều sâu

---

## 2. Ánh xạ mùa sang tông màu

| Mùa | Tông màu chính | Tông màu phụ | Prompt |
|---|---|---|---|
| Xuân | Thanh lục + chu sa | Nguyệt bạch, đằng hoàng | sắc xuân xanh mướt、hoa đào rực rỡ |
| Hạ | Thanh lục + chàm | Nguyệt bạch, thanh lục | sen hạ xanh biếc、bóng râm dày che nắng |
| Thu | Giả thạch + vàng kim | Chu sa, giả thạch | phong thu đỏ rực、lá vàng lả tả |
| Đông | Nguyệt bạch + chàm | Đen mực, thanh lục | tuyết đông trắng tinh、cành khô đóng sương |

---

## 3. Bối cảnh trong nhà

### Quy phạm không gian

| Chiều | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Dinh thự/cung điện/thư phòng/khuê phòng thời xưa, từ Minh Thanh ngược về Đường Tống | phong cách {triều đại} thời xưa |
| Chất liệu | Gỗ là chính, đá/ngọc/lụa/the là phụ | đồ gỗ đàn hương、bình phong ngọc thạch、màn the lụa |
| Tông màu | Tông màu truyền thống Trung Hoa + màn the nguyệt bạch + gỗ sơn chu sa | tông gỗ ấm、bài trí thanh nhã |
| Chiều sâu | Lớp trước/giữa/sau | lớp trước {yếu tố}、lớp giữa {yếu tố}、lớp sau {yếu tố} |
| Chất cảm | Vân gỗ/độ rủ của vải/độ bóng của sứ đều nhận ra được | vân bề mặt rõ、chất liệu tinh tế |
| Chiếu sáng | Nguồn sáng tự nhiên là chính (ánh cửa sổ/ánh nến), ánh sáng thể tích, ambient occlusion | ánh sáng tự nhiên khuếch tán、ánh nến chập chờn、ánh sáng thể tích |
| Chất ống kính | Xóa phông lớp trước lớp sau, tối viền ống kính, tán sắc mờ nhẹ | depth of field、lens vignette、chromatic aberration |
| Dấu vết không hoàn hảo | Mặt gỗ có dấu vết sử dụng, mặt đá có vân phong hóa, vải có nếp gấp tự nhiên | dấu vết năm tháng、mòn tự nhiên、vải rủ nếp tự nhiên |

### Tra nhanh các loại không gian trong nhà

| Loại | Yếu tố cốt lõi | Từ về không khí |
|---|---|---|
| Khuê phòng/phòng ngủ | Màn the, bàn trang điểm, gương đồng, bình hoa | ấm cúng riêng tư、màn the buông nhẹ |
| Thư phòng | Giá sách, cuốn thư, bút mực, bàn cờ | tĩnh mịch tao nhã、hương mực thoang thoảng |
| Đại điện/chính sảnh | Cột cao, hoành phi, màn trướng, giá nến | trang nghiêm lộng lẫy, khí thế hùng vĩ |
| Hành lang sân vườn | Cột hành lang, lan can đá, cây hoa, đèn lồng | đường quanh dẫn vào chốn u tịch、bóng đèn lay động |
| Bếp/nhà ăn | Bếp lò, xửng hấp, đồ đựng thức ăn | hơi thở khói bếp、thường ngày ấm cúng |

---

## 4. Bối cảnh ngoài trời

### Quy phạm không gian

| Chiều | Ràng buộc | Prompt |
|---|---|---|
| Loại | Sân vườn/rừng núi/bờ suối/cầu cổ/chợ | {bối cảnh}，{mùa}，{thời điểm} |
| Thời tiết | Nắng/âm u/sương mỏng/mưa phùn/tuyết bay | sương mỏng lan tỏa、mưa phùn như tơ |
| Cây cỏ | Mai/trúc/tùng/hoa đào/liễu/sen (phải hợp mùa) | hoa đào rực rỡ、trúc biếc thành rừng |
| Mặt nước | Suối/hồ/thác phải có phản chiếu ánh sáng | suối chảy róc rách、mặt hồ như gương |
| Kiến trúc | Mái cong đấu củng, ngói xanh tường trắng, cầu đá đình gỗ | mái cong đầu đao、cầu vòm đá |
| Chất không khí | Bắt buộc có phối cảnh không khí, ánh sáng thể tích, cảnh xa mờ | núi xa như mực、phối cảnh không khí、ánh sáng thể tích |
| Chiếu sáng | Ánh sáng tự nhiên là nguồn sáng duy nhất, ánh mặt trời/ánh trăng phải có ánh sáng thể tích và tán xạ | chiếu sáng tự nhiên、ánh sáng thể tích、xóa phông theo chiều sâu |
| Chất ống kính | Xóa phông theo chiều sâu, tối viền ống kính, tán sắc, đốm sáng bokeh | depth of field、bokeh、lens flare、vignette |
| Dấu vết không hoàn hảo | Mặt đá có rêu/phong hóa, mặt gỗ nứt/lên nước, ngói sứt/vệt rêu | rêu loang lổ、dấu phong hóa、nước bóng năm tháng |

### Tra nhanh các loại cảnh ngoài trời

| Loại | Yếu tố cốt lõi | Từ về không khí |
|---|---|---|
| Sân vườn | Non bộ, ao, cây hoa, lối đá | bóng hoa thưa thoáng、đường quanh dẫn vào chốn u tịch |
| Rừng núi biển trúc | Cổ thụ, rừng trúc, đá núi, mây sương | núi non trùng điệp、mây sương phiêu diêu |
| Bờ suối bờ hồ | Dòng suối, sỏi cuội, liễu rủ, hoa sen | suối chảy róc rách、bóng liễu la đà |
| Cầu cổ trường đình | Cầu vòm đá, trường đình, cây liễu | trường đình cổ đạo、dương liễu đong đưa |
| Phố chợ | Cờ quán rượu, người bán hàng rong, đèn lồng | chợ búa náo nhiệt、nhân gian khói lửa |
| Sân thượng mái nhà | Ngói, mái cong, trời đêm | dưới trăng độc ẩm、gió mát hiu hiu |

---

## 5. Quy phạm hình chủ

### Định nghĩa hướng nhìn

> Hình chủ một khung hình, chụp từ góc tiêu biểu nhất của bối cảnh, gánh phần kể chuyện bằng không gian và trọng tâm bố cục.

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Góc nhìn | Góc quan sát tự nhiên, bố cục thể hiện rõ nhất chủ thể và chiều sâu của bối cảnh | hero shot、representative angle |
| Độ cao điểm nhìn | Mặc định ngang tầm mắt người, bối cảnh đặc biệt có thể chúc/ngước | eye level (mặc định) |
| Bố cục | Chủ thể ở giữa hoặc theo quy tắc một phần ba, lớp trước/giữa/sau rõ ràng | balanced composition |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Một khung hình (không ghép ảnh, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người nào** |
| Nhất quán | Phong cách/chất liệu/tông màu/ánh sáng thống nhất |
| Ánh sáng | Logic một nguồn sáng, hướng sáng tối nhất quán |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt

concept art hình chủ bối cảnh cổ phong，
phong cách render 3D，tạo mô hình độ chính xác cao，chất liệu PBR，3D Quốc phong，ánh sáng đẳng cấp điện ảnh，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
chất render 3D，ánh sáng thể tích，chiếu sáng tự nhiên，sáng tối theo vật lý，
scene design sheet, environment concept art, no people, no characters, no human figures,
{trong nhà/ngoài trời}，{loại bối cảnh}，{phong cách triều đại}，{mùa+thời điểm},
lớp trước：{yếu tố}, lớp giữa：{yếu tố}, lớp sau：{yếu tố},
{mô tả tông màu}, {yếu tố thời tiết/không khí},
{mô tả chất liệu}, phối cảnh không khí, chi tiết vân bề mặt siêu rõ,
dấu mòn tự nhiên trên chất liệu，nước bóng năm tháng，rêu phong hóa，vải rủ nếp tự nhiên，
ánh sáng thể tích，ambient occlusion，ánh sáng tự nhiên khuếch tán，sáng tối dịu，
bố cục một khung hình，góc quan sát tự nhiên，bố cục đại diện được chủ thể bối cảnh và cho thấy lớp trước/giữa/sau，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bối cảnh bắt buộc có "lớp lang trước giữa sau" |
| R2 | Cảnh ngoài trời bắt buộc có "phối cảnh không khí" |
| R3 | Ảnh bối cảnh bắt buộc là "hình chủ một khung hình", không được ghép nhiều hướng nhìn/chia màn/lưới ô |
| R4 | Bố cục phải đại diện được chủ thể bối cảnh và cho thấy lớp trước/giữa/sau |
| R5 | Trong ảnh bối cảnh **nghiêm cấm xuất hiện bất kỳ nhân vật nào** |
| R6 | Bắt buộc chứa từ khóa render 3D (3D rendered / volumetric lighting / PBR materials) |
| R7 | Bắt buộc chứa đặc trưng quang học ống kính (ít nhất một trong depth of field / lens vignette / bokeh) |
| R8 | Chất liệu bắt buộc có dấu mòn tự nhiên/dấu ấn năm tháng, cấm "cảm giác CG" mới tinh không tì vết |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Phông trắng tuyền/đen tuyền/không có bối cảnh |
| X2 | Thời tiết cực đoan (bão/sấm sét/bão tuyết, trừ khi tình tiết đòi hỏi) |
| X3 | Bối cảnh không có chiều sâu/không có lớp lang |
| X4 | Cây cỏ/thời tiết mâu thuẫn với mùa |
| X5 | Xuất hiện bất kỳ nhân vật, bóng người, hình bóng hay đường viền cơ thể người nào |
| X6 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới ô/chia màn |
| X7 | Tạo mô hình độ chính xác thấp/texture thô/chất liệu nhựa (cấm các từ low-poly, rough modeling...) |
| X8 | Chất liệu quá sạch quá hoàn hảo, không có dấu vết sử dụng và dấu ấn năm tháng (tránh "cảm giác nhựa") |
| X9 | Chiếu sáng quá đều quá phẳng, không xóa phông theo chiều sâu, không có đặc trưng quang học ống kính |
