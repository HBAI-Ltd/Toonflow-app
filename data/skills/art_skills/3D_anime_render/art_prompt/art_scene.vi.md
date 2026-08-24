# Tạo hình ảnh bối cảnh đô thị render anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc thẩm mỹ bối cảnh

1. **Không gian kể chuyện** — bối cảnh gánh chức năng cảm xúc và kể chuyện, không phải tấm phông thuần
2. **Lớp lang chiều sâu** — mọi bối cảnh bắt buộc có tiền cảnh/trung cảnh/hậu cảnh, loại bỏ sự phẳng dẹt
3. **Chất liệu là trên hết** — vân gỗ/đá/vải/mặt nước... rõ ràng, nhưng được render cel-shading giản lược
4. **Lấy cel-shading làm neo** — mọi khung hình lấy render anime 3D + cel-shading làm chuẩn, khước từ chất nhiếp ảnh tả thực/hoạt hình CG; giữ tính nhất quán của phong cách hoạt hình và đặc trưng ống kính
5. **Không khí đô thị** — cảnh quan đô thị hiện đại, phong cách kiến trúc, tông màu thống nhất

---

## 2. Ánh xạ tông màu theo mùa

| Mùa | Tông chính | Tông phụ | Prompt |
|---|---|---|---|
| Xuân | Xanh biếc + hồng đào | Xanh nhạt, vàng ngỗng | sắc xuân xanh biếc、hoa nở đầy cành |
| Hạ | Xanh lục + hồng sen | Xanh trời, trắng | hè tràn sức sống、cây xanh rợp bóng |
| Thu | Đỏ son + vàng kim | Hổ phách, xám nhạt | thu đậm sắc、lá đỏ rơi |
| Đông | Trắng mộc + bạc sương | Xanh đậm, xám nhạt | tuyết đông phủ kín、đông ngày tĩnh lặng |

---

## 3. Kiến trúc đô thị

### Quy phạm không gian

| Chiều | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Đô thị hiện đại, cao ốc văn phòng/nhà ở/khu thương mại | kiến trúc đô thị hiện đại |
| Chất liệu | Chủ yếu thủy tinh/bê tông/kim loại (cel-shading hóa) | chất liệu hiện đại、render cel-shading |
| Tông màu | Chủ yếu tông ấm, không khí ráng chiều hoàng hôn | tông ấm、không khí hoàng hôn |
| Chiều sâu | Lớp lang tiền/trung/hậu cảnh (chiều sâu cel-shading) | tiền cảnh {yếu tố}、trung cảnh {yếu tố}、hậu cảnh {yếu tố} |
| Chất cảm | Vân kiến trúc rõ ràng (cel-shading hóa) | vân rõ ràng、chất liệu cel-shading |
| Chiếu sáng | Chủ yếu ánh sáng tự nhiên (ánh cửa sổ/đèn đường), ánh sáng dịu | ánh sáng tự nhiên、chiếu sáng dịu |
| Cảm giác ống kính | Độ sâu trường ảnh nông làm mờ tiền/hậu cảnh, hiệu ứng ống kính cel-shading | shallow depth of field、ống kính cel-shading |
| Cảm giác khuyết điểm | Công trình có vết sử dụng, mòn tự nhiên (cel-shading hóa) | mòn tự nhiên、xử lý cel-shading |

### Tra nhanh các loại đô thị

| Loại | Yếu tố cốt lõi | Từ chỉ không khí |
|---|---|---|
| Khu phố thương mại | Cao ốc/cửa hàng/biển quảng cáo | phồn hoa náo nhiệt、đô thị hiện đại |
| Khu dân cư | Chung cư/vườn hoa/đường phố | đời sống ấm áp、khu phố yên tĩnh |
| Khu văn phòng | Cao ốc văn phòng/bãi xe/góc cà phê | không khí công sở、hơi thở thương mại |
| Công viên cây xanh | Cây cối/lối đi bộ/ghế dài | thư thái thảnh thơi、xanh mát tràn đầy |
| Đầu mối giao thông | Ga tàu điện ngầm/trạm xe buýt/cầu vượt bộ hành | giao thông tấp nập、nhịp đập đô thị |
| Ven sông/bên hồ | Mặt nước/lối đi bộ/ánh đèn | không khí lãng mạn、cảnh nước đẹp |

---

## 4. Bối cảnh trong nhà và ngoài trời

### Quy phạm không gian trong nhà

| Chiều | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Văn phòng/quán cà phê/căn hộ/cửa hàng tiện lợi | phong cách nội thất hiện đại |
| Chất liệu | Sàn/mặt tường/nội thất (cel-shading hóa) | chất liệu hiện đại、render cel-shading |
| Tông màu | Chủ yếu tông ấm, không khí hoàng hôn | tông ấm、không khí ấm cúng |
| Chiều sâu | Lớp lang tiền/trung/hậu cảnh | tiền cảnh {yếu tố}、trung cảnh {yếu tố}、hậu cảnh {yếu tố} |
| Chất cảm | Vân chất liệu rõ ràng (cel-shading hóa) | vân rõ ràng、chất liệu cel-shading |
| Chiếu sáng | Ánh sáng tự nhiên + đèn trong nhà, ánh sáng dịu | ánh sáng tự nhiên、đèn trong nhà、dịu |
| Cảm giác ống kính | Độ sâu trường ảnh nông làm mờ tiền/hậu cảnh | shallow depth of field、ống kính nội thất |
| Cảm giác khuyết điểm | Nội thất có vết sử dụng, mòn tự nhiên | mòn tự nhiên、xử lý cel-shading |

### Tra nhanh các loại không gian trong nhà

| Loại | Yếu tố cốt lõi | Từ chỉ không khí |
|---|---|---|
| Văn phòng | Bàn làm việc/máy tính/hồ sơ/ghế | không khí công sở、hơi thở thương mại |
| Quán cà phê | Bàn cà phê/ghế ngồi/quầy bar/trang trí | ấm cúng dễ chịu、không khí thư thái |
| Căn hộ | Sofa/giường/kệ sách/trang trí | ấm áp nhà cửa、không gian dễ chịu |
| Cửa hàng tiện lợi | Kệ hàng/quầy thu ngân/đồ uống | tiện lợi đời sống、cảm giác thường ngày |
| Nhà hàng | Bàn ăn/ghế/bếp | không khí ăn uống、bữa ăn ấm cúng |
| Phòng gym | Máy chạy bộ/dụng cụ/gương | không khí thể thao、không gian sung sức |

---

## 5. Quy phạm hình chính

### Định nghĩa hướng nhìn

> Hình chính một khung, chụp từ góc tiêu biểu nhất của bối cảnh, gánh phần kể chuyện không gian và trọng tâm bố cục.

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Góc nhìn | Góc quan sát tự nhiên, bố cục thể hiện rõ nhất chủ thể bối cảnh và chiều sâu | hero shot、representative angle |
| Độ cao điểm nhìn | Mặc định ngang tầm mắt người, bối cảnh đặc biệt có thể nhìn từ trên xuống/từ dưới lên | eye level (mặc định) |
| Bố cục | Chủ thể ở giữa hoặc theo quy tắc một phần ba, lớp lang tiền/trung/hậu cảnh rõ ràng | balanced composition |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Một khung hình duy nhất (không ghép, không nhiều hướng nhìn, không chia màn) |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền hình người nào** |
| Nhất quán | Phong cách/chất liệu/tông màu/ánh sáng thống nhất (xử lý cel-shading) |
| Ánh sáng | Logic một nguồn sáng duy nhất, hướng sáng tối nhất quán (xử lý cel-shading) |
| Tỉ lệ khung hình | Mặc định 16:9 (hoặc theo thiết lập của bên gọi) |

---

## 6. Khuôn mẫu prompt
```
render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，ảnh concept hình chính bối cảnh đô thị，
anime style, cel-shaded, 3D animation render,
film lighting, warm sunset lighting,
scene design sheet, environment concept art, no people, no characters, no human figures,
{trong nhà/ngoài trời}，{loại bối cảnh}，{phong cách kiến trúc}，{mùa + thời điểm}，
tiền cảnh: {yếu tố}，trung cảnh: {yếu tố}，hậu cảnh: {yếu tố}，
{mô tả tông màu}，{yếu tố thời tiết/không khí}，
{mô tả chất liệu}，phối cảnh khí quyển，vân rõ ràng，xử lý cel-shading，
vết sử dụng tự nhiên trên chất liệu，mòn theo hơi thở đời sống，vải rủ nếp tự nhiên (cel-shading hóa)，
ánh sáng tự nhiên tán xạ，ánh sáng thể tích，hiệu ứng sáng cel-shading，bóng đổ cel-shading，
bố cục một khung hình，góc quan sát tự nhiên，bố cục thể hiện được chủ thể bối cảnh và lớp lang tiền/trung/hậu cảnh，
trong khung hình không có bất kỳ nhân vật nào，
phong cách render cel-shading，ánh sáng dịu，tỉ lệ hoạt hình vừa phải，chất liệu hoạt hình chi tiết cao，
phối màu tông ấm，không khí ráng chiều hoàng hôn，không khí vui tươi chữa lành，
8K siêu nét，bố cục điện ảnh，
trong hình không được có bất kỳ chữ nào
```

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bối cảnh bắt buộc có "lớp lang tiền, trung, hậu cảnh" |
| R2 | Ngoài trời bắt buộc chứa "phối cảnh khí quyển" |
| R3 | Ảnh bối cảnh bắt buộc là "hình chính một khung", không được ghép nhiều hướng nhìn/chia màn/lưới |
| R4 | Bố cục phải thể hiện được chủ thể bối cảnh và lớp lang tiền/trung/hậu cảnh |
| R5 | **Nghiêm cấm xuất hiện bất kỳ nhân vật nào** trong ảnh bối cảnh |
| R6 | Bắt buộc chứa từ khóa render anime 3D (cel-shaded, 3D animation render, anime style) |
| R7 | Bắt buộc chứa đặc trưng quang học của ống kính (ít nhất một trong shallow depth of field / lens vignette / bokeh, có xử lý cel-shading) |
| R8 | Chất liệu bắt buộc mang vết mòn tự nhiên/dấu vết thời gian, cấm vẻ "chất CG" mới tinh không tì vết, nhưng thể hiện theo lối cel-shading |
| R9 | Bắt buộc giữ tính nhất quán của phong cách render cel-shading, không được pha trộn yếu tố tả thực |
| R10 | Bắt buộc chứa từ khóa phối màu tông ấm, không khí ráng chiều hoàng hôn |
| R11 | Bắt buộc chứa từ khóa 8K siêu nét, bố cục điện ảnh |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Phông nền trắng thuần/đen thuần/không có bối cảnh |
| X2 | Thời tiết cực đoan (bão giông/sấm chớp/bão tuyết, trừ khi tình tiết cần, và phải cel-shading hóa) |
| X3 | Bối cảnh không có chiều sâu/không có lớp lang |
| X4 | Thảm thực vật/thời tiết mâu thuẫn với mùa |
| X5 | Xuất hiện bất kỳ nhân vật, bóng người, bóng đổ hình người hay đường viền hình người nào |
| X6 | Khung hình bị ghép thành bố cục nhiều hướng nhìn/lưới/chia màn |
| X7 | Chất render 3D/hoạt hình CG/game engine (cấm các từ 3D render、CGI、Unreal Engine、Unity...), nhưng phải nêu rõ render hoạt hình cel-shading |
| X8 | Chất liệu quá sạch sẽ hoàn hảo, không hề có vết sử dụng và dấu vết thời gian (tránh "cảm giác nhựa"), cần xử lý cel-shading |
| X9 | Chiếu sáng quá đều và dẹt, không xóa phông theo chiều sâu, không có đặc trưng quang học của ống kính |
| X10 | Dùng thuật ngữ nhiếp ảnh tả thực (như real photography, photorealistic, RAW photo...) |
| X11 | Yếu tố cổ đại/tương lai, không thuộc phong cách đô thị hiện đại |
| X12 | Tông chủ đạo lạnh/ban đêm, không phải tông ấm/không khí hoàng hôn |