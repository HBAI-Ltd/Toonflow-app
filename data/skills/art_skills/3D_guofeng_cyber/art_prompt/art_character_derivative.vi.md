---
name: art_character_derivative
description: Tạo tài nguyên nhân vật phái sinh 3D Quốc phong Cyber · sổ tay ràng buộc
metaData: art_skills
---

# Tạo tài nguyên nhân vật phái sinh 3D Quốc phong Cyber · Sổ tay ràng buộc
## (bản thích ứng hai bối cảnh: bối cảnh cổ trang truyền thống + bối cảnh cyber đô thị hiện đại)

---

## 1. Nguyên tắc chồng lớp (quy tắc cốt lõi dùng chung cho hai bối cảnh)

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt mẫu nền, cấm gương mặt bị lệch, biến dạng, bị phong cách hóa sai lệch
2. **Tư thế không đổi** — giữ tư thế đứng tự nhiên của mẫu nền, cấm mọi thay đổi tư thế/động tác/dáng vẻ
3. **Kiểm soát được từng lớp** — mỗi lớp mô tả độc lập, yếu tố cổ trang và yếu tố cyber tách lớp riêng để tiện thay theo lớp (đổi trang phục mà không đổi trang điểm, đổi yếu tố cyber mà không đổi nền Quốc phong)
4. **Thống nhất phong cách** — mọi yếu tố phục trang hóa trang đều theo cùng một hệ thẩm mỹ, **bối cảnh cổ trang lấy thẩm mỹ phương Đông truyền thống làm cốt lõi, yếu tố cyber chỉ là phần dung hợp nhẹ tùy chọn; bối cảnh đô thị lấy hình chế Quốc phong làm nền, cơ năng cyber làm biểu đạt cốt lõi**, cấm để yếu tố Quốc phong và cyber tách rời đối lập trong suốt quá trình
5. **Chất không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn mẫu nền; chất liệu 3D PBR và ánh sáng đẳng cấp điện ảnh là mức sàn cho mọi bối cảnh
6. **Chỉ trong phạm vi phục trang hóa trang** — chỉ chồng trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác
7. **Thích ứng hai bối cảnh chỉ bằng một thao tác** — khi không có manh mối cyber/đô thị rõ ràng, mặc định sinh nội dung thuần cổ trang; khi có manh mối cyber/đô thị rõ ràng, tự động khớp hệ đô thị cyber Quốc phong, không cần dựng lại logic nền

---

## 2. Các lớp chồng (kết cấu phân lớp tương thích cả hai bối cảnh)

| Lớp | Nội dung | Diễn giải thích ứng hai bối cảnh |
|---|---|---|
| L0 | Mẫu nền | Mẫu nền của hình ảnh cơ bản, gương mặt, dáng vẻ, tư thế đứng khóa hoàn toàn, dùng chung cho bối cảnh cổ trang/đô thị, không sửa gì |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định cường độ và phong cách trong "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng / trang điểm cơ năng cyber / trang điểm công sở đô thị", gồm hai hệ: hóa trang truyền thống riêng cho cổ trang và hóa trang hiệu ứng sáng riêng cho đô thị cyber |
| L2 | Tạo hình tóc | Búi/buộc tóc/tết kiểu Quốc phong + trang sức tóc truyền thống/phụ kiện tóc cơ năng cyber, gồm hai hệ: tạo hình truyền thống cổ trang và tạo hình cyber nhẹ đô thị, chuẩn sợi tóc độ chính xác cao dùng chung cho mọi bối cảnh |
| L3 | Áo giữa/áo lót | Thay áo giữa nền màu trắng, bối cảnh cổ trang dùng áo giữa lụa truyền thống, bối cảnh đô thị dùng áo lót vải cơ năng kiểu Quốc phong, có thể lồng hoa văn mạch điện chìm kiểm soát được, dải sáng vi neon |
| L4 | Áo ngoài/trang phục chính | Lớp thích ứng kép cốt lõi: bối cảnh cổ trang dùng hoa phục/lễ phục/thường phục truyền thống Trung Hoa; bối cảnh đô thị dùng **trang phục cơ năng cyber lấy hình chế Quốc phong làm cốt lõi** (bắt buộc giữ ít nhất một kết cấu Trung Hoa cốt lõi như cổ đứng/vạt chéo/khuy cài kiểu bàn/nhu quần), cấm trang phục cơ năng thuần kiểu Tây không có cốt lõi Quốc phong |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo/tay truyền thống + phụ kiện cơ năng cyber/linh kiện cảm quang kiểu Quốc phong, bối cảnh cổ trang chủ yếu dùng phụ kiện truyền thống với điểm nhấn cyber nhẹ, bối cảnh đô thị dùng phụ kiện dung hợp Quốc phong + cyber, cấm phụ kiện cyber thuần kiểu Tây trong suốt quá trình |

> **Ranh giới phạm vi**: tài nguyên nhân vật phái sinh chỉ gồm các lớp L0–L5 (phục trang hóa trang), không gồm đạo cụ (ô/kiếm/quạt/sách/đèn lồng và các vật cầm tay khác), không gồm bối cảnh môi trường (trong nhà/ngoài trời/thời tiết...), không gồm động tác tư thế (đi/ngoảnh lại/giơ tay...). Những thứ đó thuộc phạm vi của loại tài nguyên khác; yếu tố cơ năng cyber chỉ giới hạn trong phạm vi phục trang hóa trang L1-L5, không được vượt ranh giới để sửa kết cấu cơ thể của mẫu nền.

---

## 3. Ràng buộc trang điểm (L1 · hai hệ cổ trang + đô thị)

### Chiến lược từ mẫu nền tới hóa trang phái sinh (then chốt)

> Mẫu nền nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định đi vào quy trình hóa trang. Hệ thống phải phân tích nhu cầu hóa trang từ manh mối người dùng cung cấp, ưu tiên khớp thuộc tính bối cảnh cổ trang/đô thị trước, rồi mới quyết cường độ trong hệ hóa trang tương ứng; khi không có manh mối bối cảnh rõ ràng thì mặc định hệ cổ trang, không được tự ý chuyển hệ.

### Phân tích manh mối và quyết định trang điểm L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối của người dùng: từ chỉ trạng thái gương mặt, từ cảm xúc, từ cường độ, từ phong cách, từ bối cảnh (cổ trang/đô thị) | Bản tóm tắt nhu cầu hai chiều "bối cảnh + trang điểm" |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không được dùng làm căn cứ trang điểm | Ngăn phán đoán sai |
| S3 | Khớp hệ bối cảnh cổ trang/đô thị trước, rồi khớp ma trận phong cách trang điểm và đưa ra mức cường độ | Hệ cổ trang: trang điểm nền / trang điểm nhẹ / trang điểm trang trọng; hệ đô thị: trang điểm công sở / trang điểm thương vụ / trang điểm cơ năng cyber |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thi hành · thích ứng hai bối cảnh)

| Loại manh mối | Manh mối điển hình | Khớp bối cảnh | Quyết định L1 |
|---|---|---|---|
| Không có manh mối bối cảnh/nhấn mạnh gương mặt rõ ràng | Chỉ đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Mặc định cổ trang | Trang điểm nền |
| Manh mối gương mặt nhẹ | Dịu dàng, mỉm cười, lông mi khẽ rung, sắc mặt hơi tươi lên | Dùng chung cổ trang/đô thị | Trang điểm nhẹ (cực nhạt) |
| Manh mối thường ngày cổ trang rõ ràng | Thường ngày, trong khuê phòng, ra ngoài, thư giãn, nhã tập văn nhân | Bối cảnh cổ trang | Trang điểm nền (tự nhiên trong trẻo) |
| Manh mối nghi lễ trang trọng cổ trang rõ ràng | Đại hôn, điển lễ, triều đường, dịp quan trọng | Bối cảnh cổ trang | Trang điểm trang trọng (tinh xảo xa hoa) |
| Manh mối thường ngày đô thị rõ ràng | Đi làm, đời thường đô thị, ra ngoài thư giãn | Bối cảnh đô thị cyber | Trang điểm công sở đô thị (trong trẻo tự nhiên + thớ da cực nhạt) |
| Manh mối trang trọng đô thị rõ ràng | Thương vụ, hội nghị hologram, đại lễ đô thị | Bối cảnh đô thị cyber | Trang điểm thương vụ đô thị (mờ lì tinh xảo + chất tông lạnh) |
| Manh mối cơ năng cyber rõ ràng | Cyber, cơ năng, hành động đêm, nhiệm vụ, neon, cảm giác vị lai | Bối cảnh đô thị cyber | Trang điểm cơ năng cyber (hiệu ứng sáng kiểm soát được, dung hợp với Quốc phong) |

> Nguyên tắc phán định:
> 1. Mọi tài nguyên phái sinh đều phải có hóa trang; xem manh mối bối cảnh để khớp hệ trước, rồi xem manh mối gương mặt để quyết cường độ và phong cách; thay đổi về đạo cụ, bối cảnh, tư thế không được tự mình đẩy cường độ trang điểm lên
> 2. Manh mối cơ năng cyber chỉ được kích hoạt trang điểm thuộc hệ đô thị cyber; không có manh mối tương ứng thì không được tự ý thêm trang điểm hiệu ứng sáng cyber
> 3. Bối cảnh cổ trang khi không có manh mối cyber rõ ràng thì cấm thêm bất kỳ trang điểm hiệu ứng sáng/cơ năng cyber nào, bảo đảm bối cảnh thuần cổ trang khớp hoàn toàn

### Ma trận phong cách trang điểm nữ (phủ trọn hai bối cảnh)

| Hệ | Phong cách | Bối cảnh áp dụng | Prompt cốt lõi |
|---|---|---|---|
| Hệ cổ trang | Trang điểm thanh nhã | Thường ngày cổ trang, lần đầu gặp, trong khuê phòng, nhã tập văn nhân | trang điểm thanh nhã、mày ngài kẻ nhẹ、mặt mộc thanh tú |
| Hệ cổ trang | Trang điểm quý khí cung đình | Cung đình cổ trang, trang trọng, quyền lực, đại lễ | trang điểm tinh xảo、dáng mày sắc、màu môi hồng thắm |
| Hệ cổ trang | Trang điểm hoa đào lãng mạn | Hẹn hò cổ trang, rung động, ngọt ngào | trang điểm hoa đào、đuôi mắt ửng hồng、màu môi mọng nước |
| Hệ cổ trang | Trang điểm đại hôn | Đại hôn cổ trang, điển lễ | trang điểm đậm lộng lẫy、môi son mắt phượng |
| Hệ cổ trang | Trang điểm lễ hội | Lễ hội cổ trang, tụ họp | màu sắc tươi sáng、trang điểm phấn màu |
| Hệ đô thị cyber | Trang điểm công sở đô thị | Đời thường đô thị, đi làm, ra ngoài thư giãn | mặt mộc giả trong trẻo、dáng mày tự nhiên、nền đều màu、không màu sắc phô trương |
| Hệ đô thị cyber | Trang điểm thương vụ đô thị | Thương vụ đô thị, hội nghị hologram, dịp trang trọng | nền mờ lì tông lạnh、dáng mày dứt khoát、mắt sâu、màu môi chất bão hòa thấp |
| Hệ đô thị cyber | Trang điểm lưu quang cyber | Hành động đêm đô thị, bối cảnh cyber, cơ năng thư giãn | ánh vi neon ở đuôi mắt、hoa văn mạch điện chìm sát da、màu môi ánh nhũ li ti、lớp trang điểm trong trẻo không dày |
| Hệ đô thị cyber | Trang điểm cơ năng tông lạnh | Nhiệm vụ đô thị, hành động, bối cảnh khí trường mạnh | nền mờ lì tông lạnh、dáng mày dứt khoát、mắt sâu、thớ cơ năng mờ lì cục bộ、không hiệu ứng sáng phô trương |

### Nền da dùng chung (mọi kiểu trang điểm · dùng chung hai bối cảnh)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất cảm | Render chất liệu PBR, trong trẻo tự nhiên, thớ da kiểm soát được, chất 3D thống nhất mọi bối cảnh | chất liệu PBR、ánh sáng tự nhiên、chất dịu、vân da mịn |
| Độ trắng | Tông hồng trắng, trong trẻo không trắng bệch | tông hồng trắng、trắng trong |
| Ánh trong | Cảm giác ánh dịu hắt từ trong ra | ánh trong từ bên trong、da trong và sáng |
| Thích ứng cyber | Chỉ hệ đô thị cyber mới được thêm hoa văn mạch điện chìm sát da, ánh vi neon, không được phủ lấp chất da của mẫu nền; hệ cổ trang cấm dùng | hoa văn mạch điện chìm sát da、ánh vi neon kiểm soát được、hòa tự nhiên với da |
| Cấm | Mờ lì/trắng bệch/chất sáp/bóng dầu/cháy sáng, lớp sơn cyber phủ diện rộng lên mẫu nền, ánh sáng chói mắt, tự ý thêm yếu tố cyber vào bối cảnh cổ trang | — |

### Chi tiết trang điểm nền (mức mặc định của cổ trang · dùng chung hai bối cảnh)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lông mày | Tỉa nhẹ theo dáng mày của mẫu nền, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch |
| Mắt | Điểm mắt cực nhạt, nhấn sự trong trẻo và có thần | mắt trong trẻo、phấn mắt cực nhạt |
| Gò má | Nâng sắc mặt cực nhạt, má hồng phấn màu | sắc mặt tự nhiên、má hồng phấn màu |
| Môi | Dặm màu hồng nhạt hoặc chu sa, giữ tiết chế | màu môi tự nhiên căng mọng、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có hóa trang, nhưng cảm giác trang điểm rất nhẹ | trang điểm nền、cảm giác trang điểm tự nhiên、chất dịu |

### Trang điểm nam (thích ứng hai bối cảnh)

| Hệ | Hạng mục | Ràng buộc | Prompt |
|---|---|---|---|
| Cổ trang dùng chung | Nền da | Render chất liệu PBR, trắng trong, sạch sẽ tự nhiên | chất liệu PBR、trắng trong、ánh sáng tự nhiên |
| Cổ trang dùng chung | Nguyên tắc cốt lõi | Mặt mộc giả — nhìn như không trang điểm nhưng da cực đẹp | mặt mộc giả、da đẹp trời cho |
| Cổ trang dùng chung | Lông mày | Mày rậm tự nhiên, không đổi dáng mày của mẫu nền | mày kiếm tự nhiên、dáng mày hiên ngang |
| Cổ trang dùng chung | Màu môi | Sắc máu tự nhiên, hơi căng | màu môi tự nhiên、có sắc máu |
| Hệ đô thị cyber | Thích ứng cyber | Chỉ được thêm thớ cơ năng mờ lì cục bộ, hoa văn mạch điện chìm cực nhạt, không hiệu ứng sáng phô trương, không có manh mối rõ ràng thì cấm dùng | hoa văn mạch điện chìm sát da cực nhạt、thớ cơ năng mờ lì、không ánh chói |
| Hệ đô thị cyber | Trang điểm thương vụ đô thị | Nền mờ lì trong trẻo, dáng mày dứt khoát, không cảm giác trang điểm thừa | nền mờ lì trong trẻo、dáng mày dứt khoát、chất mặt mộc giả |

---

## 4. Ràng buộc tạo hình tóc (L2 · hai hệ cổ trang + đô thị)

### Các kiểu tạo hình nữ (phủ trọn hai bối cảnh)

| Hệ | Tạo hình | Mô tả | Bối cảnh áp dụng | Prompt |
|---|---|---|---|---|
| Hệ cổ trang | Búi cao vân mấn | Búi cao + trang sức tóc truyền thống | Cung đình cổ trang, trang trọng, đại lễ | búi cao vân mấn、búi tóc tinh xảo、hình chế Trung Hoa truyền thống |
| Hệ cổ trang | Búi song hoàn | Hai vòng đối xứng, thiếu nữ | Nhân vật trẻ cổ trang, thường ngày | búi song hoàn、phong cách thiếu nữ、tạo hình Trung Hoa truyền thống |
| Hệ cổ trang | Búi đọa mã | Búi thấp lệch một bên, uể oải | Thường ngày cổ trang, thư giãn, trong khuê phòng | búi đọa mã、búi lệch uể oải、tạo hình Trung Hoa truyền thống |
| Hệ cổ trang | Xõa tóc | Tóc dài xõa hết, buông tự nhiên | Khuê phòng cổ trang, riêng tư, ban đêm | tóc dài xõa、buông tự nhiên、chất Trung Hoa truyền thống |
| Hệ cổ trang | Búi tóc đuôi ngựa cao | Buộc cao gọn gàng, dứt khoát | Luyện võ cổ trang, bối cảnh hành động | đuôi ngựa buộc cao、gọn gàng dứt khoát、búi tóc Trung Hoa truyền thống |
| Hệ cổ trang | Buộc nửa | Buộc nửa phần tóc trên + phần sau buông | Thường ngày cổ trang, ra ngoài | búi vân buộc nửa、tóc buông tự nhiên、tạo hình Trung Hoa truyền thống |
| Hệ đô thị cyber | Đuôi ngựa thấp buộc nửa kiểu Quốc phong | Buộc nửa kiểu Trung Hoa + đuôi ngựa thấp, gọn gàng không lê thê | Đi làm đô thị, ra ngoài thường ngày | đuôi ngựa thấp buộc nửa kiểu Quốc phong、điểm tết tóc Trung Hoa、gọn gàng thường ngày、sợi tóc độ chính xác cao |
| Hệ đô thị cyber | Búi cơ năng buộc cao kiểu Quốc phong | Búi cao kiểu Trung Hoa + kết cấu cơ năng giữ chặt, có thể lồng dải sáng vi neon | Trang trọng đô thị, đại lễ hologram, bối cảnh cơ năng | búi cơ năng buộc cao kiểu Quốc phong、phụ kiện tóc hợp kim titan giữ chặt、lồng dải sáng vi neon kiểm soát được |
| Hệ đô thị cyber | Tết tóc bán cơ khí kiểu Quốc phong | Tết ba lọn kiểu Trung Hoa + dây tết cơ năng, điểm tua rua ánh sáng | Thư giãn đô thị, hành động đêm, bối cảnh cyber | tết tóc bán cơ khí kiểu Quốc phong、nền tết tóc Trung Hoa、dây tết cơ năng、điểm tua rua cảm quang |
| Hệ đô thị cyber | Đuôi ngựa cao kiểu Quốc phong | Buộc tóc kiểu Trung Hoa + đuôi ngựa cao, khóa tóc cơ năng giữ chặt | Cơ năng đô thị, hành động, bối cảnh nhiệm vụ | đuôi ngựa cao kiểu Quốc phong、nền buộc tóc Trung Hoa、khóa tóc cơ năng giữ chặt、gọn gàng dứt khoát |

### Trang sức tóc nữ (thích ứng hai bối cảnh)

| Hệ | Ràng buộc | Prompt |
|---|---|---|
| Hệ cổ trang | Lộng lẫy tinh xảo, đồng bộ với trang phục, chất liệu và chế tác thuần Trung Hoa truyền thống, không có yếu tố cyber (không có manh mối rõ ràng thì cấm dùng) | trang sức tóc lộng lẫy、chế tác tinh xảo、trâm vàng trâm bạc、châu thúy đầy đầu、chạm khắc tinh vi |
| Hệ đô thị cyber | Lấy hình chế Quốc phong làm cốt lõi, đồng bộ với trang phục, chất liệu truyền thống + chất liệu cơ năng cyber dung hợp, hiệu ứng sáng kiểm soát được | trang sức tóc Quốc phong Cyber、chế tác tinh xảo、trang sức vàng bạc ngọc + phụ kiện cơ năng hợp kim titan、dải sáng vi neon kiểm soát được、điểm chiếu hologram |

### Các kiểu tạo hình nam (phủ trọn hai bối cảnh)

| Hệ | Tạo hình | Bối cảnh áp dụng | Prompt |
|---|---|---|---|
| Hệ cổ trang | Búi tóc bán quan | Thường ngày cổ trang, văn nhân, nhã tập | búi tóc bán quan、trâm ngọc cài tóc、tạo hình Trung Hoa truyền thống |
| Hệ cổ trang | Toàn quan búi cao | Trang trọng cổ trang, triều đường, đại lễ | toàn quan búi cao、mũ ngọc cài tóc、hình chế Trung Hoa truyền thống |
| Hệ cổ trang | Xõa tóc phủ vai | Riêng tư cổ trang, bối cảnh ban đêm | xõa tóc phủ vai、tóc dài như mực、chất Trung Hoa truyền thống |
| Hệ cổ trang | Búi tóc đuôi ngựa cao | Chiến đấu cổ trang, bối cảnh luyện võ | tóc buộc cao kiểu chiến、đuôi ngựa dứt khoát、búi tóc Trung Hoa truyền thống |
| Hệ đô thị cyber | Búi tóc bán quan cơ năng kiểu Quốc phong | Thường ngày đô thị, đi làm, bối cảnh thương vụ | búi tóc bán quan cơ năng kiểu Quốc phong、nền buộc tóc Trung Hoa、phụ kiện tóc hợp kim titan mờ lì、gọn gàng dứt khoát |
| Hệ đô thị cyber | Búi tóc đuôi ngựa thấp kiểu Quốc phong | Thư giãn đô thị, ra ngoài thường ngày | búi tóc đuôi ngựa thấp kiểu Quốc phong、nền buộc tóc Trung Hoa、khóa tóc cơ năng tối giản、chất tự nhiên |
| Hệ đô thị cyber | Tóc buộc cao cơ năng kiểu Quốc phong | Cơ năng đô thị, nhiệm vụ, bối cảnh hành động đêm | tóc buộc cao cơ năng kiểu Quốc phong、nền buộc tóc Trung Hoa、mũ tóc cơ năng bao trọn、chế tác mờ lì |

---

## 5. Ràng buộc trang phục (L3+L4 · lớp thích ứng cốt lõi của hai bối cảnh)

### Lằn ranh cốt lõi (dùng chung hai bối cảnh · không được vượt)
**Mọi trang phục bắt buộc lấy hình chế truyền thống Trung Hoa làm cốt lõi tuyệt đối**, bối cảnh cổ trang tuân thủ nghiêm ngặt logic cắt may trang phục Trung Hoa; bối cảnh đô thị cyber bắt buộc giữ ít nhất 1 kết cấu Trung Hoa cốt lõi như cổ đứng/vạt chéo/khuy cài kiểu bàn/nhu quần/vạt đối/tay áo rộng, cấm xuất hiện vest thuần kiểu Tây, áo khoác cơ năng thuần túy, trang phục cyberpunk thuần kiểu Tây không có cốt lõi Quốc phong, bảo đảm nền Quốc phong không mất ở cả bối cảnh cổ trang lẫn đô thị.

### Ma trận trang phục nữ (phủ trọn hai bối cảnh)

| Hệ | Phong cách | Cốt lõi kiểu dáng | Bối cảnh áp dụng | Prompt |
|---|---|---|---|---|
| Hệ cổ trang | Váy dài thường ngày cổ trang | Hình chế nhu quần Trung Hoa, tà váy phiêu dật, thêu truyền thống | Thường ngày cổ trang, khuê phòng, nhã tập, ra ngoài | váy dài nhu quần cổ trang、áo váy phiêu dật、chất lụa、hoa văn thêu Tô truyền thống、mặc nhiều lớp |
| Hệ cổ trang | Lễ phục cung đình | Hình chế lễ phục Trung Hoa, áo tay rộng, tà váy xếp lớp, thêu xa hoa | Cung đình cổ trang, trang trọng, đại lễ, bối cảnh quyền lực | lễ phục cung đình cổ trang、váy áo xa hoa、áo tay rộng Trung Hoa、thêu chỉ vàng、tà váy xếp lớp |
| Hệ cổ trang | Thường phục nhẹ | Áo ngắn Trung Hoa, cổ đứng vạt chéo, cắt bó eo, gọn gàng không lê thê | Hành động cổ trang, luyện võ, bối cảnh ra ngoài | thường phục nhẹ cổ trang、cắt may áo ngắn、cổ đứng vạt chéo、chất bông lanh và lụa、gọn gàng dứt khoát |
| Hệ cổ trang | Y phục ngủ | Áo giữa the mỏng, lụa màu mộc, rộng rãi thoải mái | Trong nhà cổ trang, ban đêm, bối cảnh riêng tư | y phục ngủ cổ trang、rộng rãi thoải mái、chất the mỏng và lụa、màu mộc giản dị |
| Hệ cổ trang | Hỉ phục đại hôn | Hình chế phượng quan hà bí, y phục đỏ xếp lớp, hoa văn hôn phục truyền thống | Hôn lễ cổ trang, điển lễ đại hôn | hỉ phục đại hôn cổ trang、phượng quan hà bí、xiêm y đỏ xếp lớp、thêu chỉ vàng、hình chế hôn phục Trung Hoa |
| Hệ đô thị cyber | Thường phục đi làm kiểu Quốc phong | Áo sơ mi cổ đứng/vạt chéo Trung Hoa, nhu quần ngắn cải biên, ghép vải cơ năng, thường ngày không phô trương | Thường ngày đô thị, đi làm, ra ngoài thư giãn | thường phục đi làm Quốc phong Cyber、cổ đứng vạt chéo Trung Hoa、cắt may nhu quần cải biên、lụa ghép vải cơ năng mờ lì、thêu tối giản、gọn gàng thường ngày |
| Hệ đô thị cyber | Lễ phục thương vụ kiểu Quốc phong | Hình chế vest vạt đối Trung Hoa, kết cấu đường trang cải biên, vải mờ lì cao cấp, tối giản mà xa hoa | Thương vụ đô thị, hội nghị hologram, dịp trang trọng | lễ phục thương vụ Quốc phong Cyber、nền đường trang vạt đối Trung Hoa、vải mờ lì cao cấp、cắt may khối、hoa văn Trung Hoa tối giản、xa hoa kín đáo |
| Hệ đô thị cyber | Thường phục Quốc phong cơ năng nhẹ | Áo ngắn Trung Hoa + áo gi-lê cơ năng, vạt chéo khuy bàn + khóa hít từ, cắt bó eo, nhẹ và gọn | Hành động đô thị, hành động đêm, bối cảnh cơ năng thư giãn | thường phục Quốc phong cơ năng nhẹ、áo ngắn vạt chéo Trung Hoa、ghép áo gi-lê cơ năng、khuy bàn hít từ、vải cơ năng mờ lì、gọn gàng dứt khoát |
| Hệ đô thị cyber | Lễ phục đại hôn/đại lễ Quốc phong Cyber | Hình chế phượng quan hà bí/lễ phục Trung Hoa, kết cấu khối hợp kim titan, tà váy xếp lớp, dải sáng vi neon kiểm soát được | Đại hôn đô thị, đại lễ hologram, dịp quan trọng | lễ phục đại lễ Quốc phong Cyber、hình chế lễ phục Trung Hoa cốt lõi、lụa ghép kết cấu in 3D、thêu chỉ vàng dung hợp hoa văn mạch điện chìm、dải sáng vi neon kiểm soát được |
| Hệ đô thị cyber | Y phục ngủ cơ năng kiểu Quốc phong | Áo giữa vạt chéo Trung Hoa, the mỏng ghép lót cơ năng, rộng rãi thoải mái, thớ ánh nhẹ | Trong nhà đô thị, ban đêm, bối cảnh riêng tư | y phục ngủ cơ năng Quốc phong、hình chế vạt chéo Trung Hoa、rộng rãi thoải mái、the mỏng ghép vải cơ năng、thớ ánh nhẹ |

### Ràng buộc chung cho trang phục nữ (thích ứng hai bối cảnh)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chủ đạo | Bối cảnh cổ trang mặc định tông màu truyền thống Trung Hoa; bối cảnh đô thị có thể phối cặp màu cyber tông lạnh bão hòa thấp, điểm màu neon kiểm soát được, cấm phối màu bão hòa cao chói mắt | tông màu truyền thống Trung Hoa、phối màu Quốc phong Cyber、cặp màu bão hòa thấp、điểm màu neon kiểm soát được |
| Chất liệu | Bối cảnh cổ trang mặc định lụa + thêu + vải ánh ngọc trai; bối cảnh đô thị có thể ghép vải cơ năng mờ lì, dải phản quang sáng, cấu kiện in 3D, bắt buộc giữ nền vải Quốc phong cốt lõi | chất lụa、chi tiết thêu、bối cảnh cổ trang dùng vải thuần truyền thống; bối cảnh đô thị ghép vải truyền thống với vải cơ năng、kết cấu khối in 3D |
| Hoa văn | Bối cảnh cổ trang mặc định hoa văn Trung Hoa truyền thống; bối cảnh đô thị có thể dung hợp hoa văn truyền thống với vân mạch điện, hoa văn cyber chìm, vân siêu rõ, cấm vân cyber thuần túy không có cốt lõi Quốc phong | chất vải rõ ràng、vân siêu rõ、bối cảnh cổ trang dùng hoa văn Trung Hoa truyền thống thuần túy; bối cảnh đô thị hoa văn truyền thống dung hợp sâu với vân mạch điện |
| Phần vai | Bối cảnh cổ trang mặc định vân kiên/phi bạch kiểu Quốc phong; bối cảnh đô thị có thể phối giáp vai cơ năng/trang trí kết cấu, bắt buộc thống nhất với hình chế Trung Hoa | bối cảnh cổ trang vân kiên lộng lẫy、phi bạch phiêu dật; bối cảnh đô thị điểm giáp vai Quốc phong、thống nhất với hình chế tổng thể |
| Lớp lang | Mặc nhiều lớp, phân tầng rõ, logic áo lót và áo ngoài kiểu Quốc phong thống nhất, ở bối cảnh đô thị kết cấu cơ năng không được phá logic mặc nhiều lớp | mặc nhiều lớp、phân tầng rõ、logic hình chế Trung Hoa thống nhất |
| Hiệu ứng sáng | Chỉ bối cảnh đô thị cyber mới được thêm dải sáng vi neon âm trong trang phục, hiệu ứng sáng kiểm soát được, không chói mắt, không phá chất trang phục, không cháy sáng; bối cảnh cổ trang không có manh mối rõ ràng thì cấm dùng | bối cảnh đô thị dải sáng vi neon âm、hiệu ứng sáng kiểm soát được、không cháy sáng、hòa tự nhiên với trang phục |

### Ma trận trang phục nam (phủ trọn hai bối cảnh)

| Hệ | Phong cách | Bối cảnh áp dụng | Prompt |
|---|---|---|---|
| Hệ cổ trang | Y phục văn nhân sĩ tử | Thường ngày cổ trang, thư phòng, nhã tập, ra ngoài | y phục văn nhân sĩ tử cổ trang、hình chế trường sam、cổ đứng vạt chéo、chất lụa và bông lanh、thêu hoa văn truyền thống |
| Hệ cổ trang | Kình trang võ tướng | Chiến đấu cổ trang, luyện võ, bối cảnh hành động | kình trang võ tướng cổ trang、hình chế chiến bào、cổ đứng bó eo、vải bền chắc、gọn gàng dứt khoát |
| Hệ cổ trang | Triều phục lễ phục | Triều đường cổ trang, điển lễ, đại lễ | triều phục cổ trang、hình chế lễ phục trang trọng、áo rộng tay lớn、vải xa hoa、hoa văn truyền thống |
| Hệ cổ trang | Thường phục tiện y | Thư giãn cổ trang, riêng tư, ra ngoài thường ngày | thường phục tiện y cổ trang、phong cách giản dị、vải thoải mái、cổ đứng Trung Hoa、rộng rãi chỉnh tề |
| Hệ cổ trang | Lễ phục đại điển | Trang trọng cổ trang, khánh điển, dịp quan trọng | lễ phục đại điển cổ trang、xa hoa tinh xảo、hình chế lễ phục Trung Hoa、vải cao cấp、thêu chỉ vàng |
| Hệ đô thị cyber | Đồ đi làm thương vụ kiểu Quốc phong | Thường ngày đô thị, đi làm, họp thương vụ | đồ đi làm thương vụ Quốc phong、nền đường trang cổ đứng Trung Hoa、cắt may vest cải biên、vải mờ lì cao cấp、hoa văn Trung Hoa tối giản、gọn gàng chỉnh tề |
| Hệ đô thị cyber | Đồ thư giãn cơ năng kiểu Quốc phong | Thường ngày đô thị, ra ngoài thư giãn, bối cảnh cơ năng nhẹ | đồ thư giãn cơ năng Quốc phong、áo ngắn vạt chéo Trung Hoa、ghép vải cơ năng、khuy bàn hít từ、rộng rãi thoải mái、dễ phối thường ngày |
| Hệ đô thị cyber | Kình trang cơ năng võ tướng | Hành động đô thị, nhiệm vụ, bối cảnh hành động đêm | kình trang cơ năng võ tướng Quốc phong、nền chiến bào Trung Hoa、vải cơ năng mờ lì、kết cấu bảo hộ dạng khối、cổ đứng bó eo、gọn gàng dứt khoát |
| Hệ đô thị cyber | Lễ phục đại lễ kiểu Quốc phong | Đại lễ hologram đô thị, dịp trang trọng, đại hôn | lễ phục đại lễ Quốc phong、hình chế lễ phục Trung Hoa cốt lõi、vải xa hoa、điểm kết cấu hợp kim titan、hoa văn truyền thống dung hợp mạch điện chìm |

---

## 6. Ràng buộc phụ kiện (L5 · thích ứng hai bối cảnh)

### Phụ kiện nữ (chia theo hệ bối cảnh)

| Hệ | Loại | Ràng buộc | Prompt |
|---|---|---|---|
| Hệ cổ trang | Trang sức đầu | Lộng lẫy tinh xảo, không sơ sài, chất liệu thuần Trung Hoa truyền thống, đồng bộ với kiểu tóc và trang phục | trang sức đầu lộng lẫy、châu thúy đầy đầu、trâm vàng trâm bạc、bộ dao ngọc、chạm khắc tinh vi |
| Hệ cổ trang | Trang sức tai | Tua rua buông rủ/khuyên ngọc truyền thống, thống nhất với phong cách tổng thể | khuyên tai tua rua、khuyên ngọc buông rủ、trang sức tai bằng ngọc、khảm vàng bạc |
| Hệ cổ trang | Trang sức cổ | Anh lạc/vòng cổ truyền thống, hình chế Trung Hoa truyền thống | anh lạc lộng lẫy、vòng cổ tinh xảo、khảm vàng bạc ngọc |
| Hệ cổ trang | Trang sức eo | Cung điều/ngọc bội truyền thống, chế tác Trung Hoa truyền thống | cung điều phiêu dật、ngọc bội bên hông、cấm bộ bằng ngọc、đan kết tinh xảo |
| Hệ cổ trang | Trang sức tay | Vòng ngọc/xuyến cánh tay truyền thống, hình chế Trung Hoa truyền thống | vòng ngọc trong suốt、xuyến cánh tay tinh xảo、chất vàng bạc ngọc |
| Hệ đô thị cyber | Trang sức đầu | Lấy hình chế Quốc phong làm cốt lõi, chất liệu truyền thống + chất liệu cơ năng cyber dung hợp, đồng bộ với kiểu tóc và trang phục, hiệu ứng sáng kiểm soát được | trang sức đầu Quốc phong Cyber、châu thúy ngọc + phụ kiện cơ năng hợp kim titan、dải sáng vi neon kiểm soát được、điểm chiếu hologram、chế tác tinh xảo |
| Hệ đô thị cyber | Trang sức tai | Khuyên ngọc truyền thống + khuyên cơ năng cyber dung hợp, tua rua cảm quang kiểm soát được không phô trương | khuyên tai cơ năng Quốc phong、khảm ngọc + chất hợp kim titan、tua rua cảm quang vi neon kiểm soát được、tinh xảo nhỏ gọn |
| Hệ đô thị cyber | Trang sức cổ | Anh lạc truyền thống + vòng cổ cơ năng dung hợp, hình chế Trung Hoa làm cốt lõi | vòng cổ cơ năng Quốc phong、kết cấu anh lạc + chất hợp kim titan、lồng ánh sáng nhẹ kiểm soát được、tinh xảo ôm khít |
| Hệ đô thị cyber | Trang sức eo | Cung điều/ngọc bội truyền thống + đai lưng cơ năng dung hợp, khóa hít từ, kết cấu khối | đai lưng cơ năng Quốc phong、đai bản rộng ghép cung điều、ngọc bội bên hông、khóa hít từ hợp kim titan、chất liệu rõ ràng |
| Hệ đô thị cyber | Trang sức tay | Vòng ngọc truyền thống + vòng tay cơ năng dung hợp, hình chế Trung Hoa làm cốt lõi, không thiết kế phô trương | vòng tay cơ năng Quốc phong、vòng ngọc trong suốt + chất hợp kim titan、ánh sáng nhẹ kiểm soát được、tinh xảo ôm khít |

### Phụ kiện nam (chia theo hệ bối cảnh)

| Hệ | Loại | Ràng buộc | Prompt |
|---|---|---|---|
| Hệ cổ trang | Mũ tóc | Mũ ngọc/mũ vàng truyền thống, chế tác tinh xảo, hình chế Trung Hoa truyền thống, đồng bộ với kiểu tóc và trang phục | mũ ngọc cài tóc、mũ vàng cài tóc、chạm khắc ngọc、chế tác tinh xảo |
| Hệ cổ trang | Đai lưng | Đai bản rộng/thắt lưng da truyền thống, hình chế Trung Hoa truyền thống, chất liệu rõ ràng | đai bản rộng、thắt lưng da、móc đai bằng ngọc、chất liệu rõ ràng |
| Hệ cổ trang | Ngọc bội | Ngọc bội truyền thống trong suốt ôn nhuận, chế tác Trung Hoa truyền thống, đeo bên hông | ngọc bội bên hông、trong suốt ôn nhuận、chất ngọc Hòa Điền、chạm khắc tinh xảo |
| Hệ cổ trang | Phụ kiện bên hông | Kiếm/quạt/sáo chỉ được là phụ kiện gắn cố định bên hông, **cấm đạo cụ cầm tay**, hình chế Trung Hoa truyền thống | kiếm đeo hông làm phụ kiện cố định、quạt xếp treo hông、sáo trúc làm trang sức hông、không có tương tác cầm tay |
| Hệ đô thị cyber | Mũ tóc | Hình chế mũ ngọc truyền thống + chất liệu cơ năng hợp kim titan, chế tác mờ lì, dựng hình tinh xảo, đồng bộ với kiểu tóc và trang phục | mũ tóc cơ năng Quốc phong、nền mũ trang sức Trung Hoa、chất hợp kim titan mờ lì、khảm ngọc、chế tác tinh xảo |
| Hệ đô thị cyber | Đai lưng | Hình chế đai bản rộng truyền thống + kết cấu cơ năng, khóa hít từ, cắt may khối, chất liệu rõ ràng | đai lưng cơ năng Quốc phong、nền đai lưng Trung Hoa、vải cơ năng mờ lì、khóa hít từ hợp kim titan、kết cấu khối |
| Hệ đô thị cyber | Ngọc bội | Hình chế ngọc truyền thống + chất mica cảm quang, trong suốt ôn nhuận, ánh sáng nhẹ kiểm soát được, đeo bên hông | ngọc bội cảm quang Quốc phong、hình chế truyền thống、chất mica + ngọc、trong suốt ôn nhuận、ánh sáng nhẹ kiểm soát được |
| Hệ đô thị cyber | Phụ kiện bên hông | Hình chế truyền thống + chất liệu cơ năng, chỉ được là phụ kiện gắn cố định bên hông, **cấm đạo cụ cầm tay** | kiếm cơ năng đeo hông làm phụ kiện cố định、quạt xếp hợp kim titan treo hông、không có tương tác cầm tay |

---

## 7. Tra nhanh tổ hợp phục trang hóa trang (phủ trọn mọi bối cảnh của hai hệ)

| Hệ | Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|---|
| Hệ cổ trang | Thường ngày trong khuê phòng | Trang điểm thanh nhã | Xõa tóc/buộc nửa | Váy dài thường ngày cổ trang | Vừa (phụ kiện truyền thống giản dị) |
| Hệ cổ trang | Lần đầu gặp/nhã tập | Trang điểm thanh nhã | Buộc nửa/búi đọa mã | Váy dài thường ngày cổ trang | Vừa đến nhiều (phụ kiện truyền thống tinh xảo) |
| Hệ cổ trang | Tương tác lãng mạn | Trang điểm hoa đào lãng mạn | Buộc nửa/búi đọa mã | Váy dài thường ngày cổ trang/thường phục nhẹ | Vừa |
| Hệ cổ trang | Ra mắt trang trọng ở đại lễ cung đình | Trang điểm quý khí cung đình | Búi cao vân mấn | Lễ phục cung đình cổ trang | Cực rườm rà (phụ kiện truyền thống xa hoa) |
| Hệ cổ trang | Riêng tư ban đêm | Trang điểm thanh nhã/hoa đào | Xõa tóc/búi đọa mã | Y phục ngủ cổ trang | Cực giản (không phụ kiện thừa) |
| Hệ cổ trang | Điển lễ đại hôn | Trang điểm đại hôn | Búi cao vân mấn | Hỉ phục đại hôn cổ trang | Cực rườm rà (trọn bộ phượng quan hà bí) |
| Hệ cổ trang | Luyện võ/hành động | Trang điểm mộc (cực nhạt) | Búi tóc đuôi ngựa cao | Thường phục nhẹ cổ trang/kình trang võ tướng | Giản (chỉ phụ kiện cố định cơ bản) |
| Hệ đô thị cyber | Thường ngày đi làm ở đô thị | Trang điểm công sở đô thị | Đuôi ngựa thấp buộc nửa kiểu Quốc phong | Thường phục đi làm kiểu Quốc phong | Vừa thấp (phụ kiện cơ năng Quốc phong tối giản) |
| Hệ đô thị cyber | Dịp thương vụ trang trọng ở đô thị | Trang điểm thương vụ đô thị | Búi tóc bán quan cơ năng kiểu Quốc phong | Lễ phục thương vụ kiểu Quốc phong | Vừa (phụ kiện cơ năng Quốc phong xa hoa kín đáo) |
| Hệ đô thị cyber | Ra mắt ở đại lễ hologram đô thị | Trang điểm quý khí cung đình/trang điểm lưu quang cyber | Búi cơ năng buộc cao kiểu Quốc phong | Lễ phục đại lễ Quốc phong Cyber | Cực rườm rà (phụ kiện xa hoa dung hợp Quốc phong + cyber) |
| Hệ đô thị cyber | Hành động đêm/nhiệm vụ cơ năng ở đô thị | Trang điểm cơ năng tông lạnh | Đuôi ngựa cao kiểu Quốc phong | Thường phục Quốc phong cơ năng nhẹ/kình trang cơ năng võ tướng | Giản (chỉ phụ kiện cơ năng cố định) |
| Hệ đô thị cyber | Hẹn hò thư giãn ở đô thị | Trang điểm hoa đào lãng mạn/trang điểm lưu quang cyber | Tết tóc bán cơ khí kiểu Quốc phong | Thường phục đi làm kiểu Quốc phong/thường phục cơ năng nhẹ | Vừa (phụ kiện Quốc phong có ánh sáng nhẹ) |
| Hệ đô thị cyber | Bối cảnh riêng tư ban đêm | Trang điểm thanh nhã | Xõa tóc/đuôi ngựa thấp | Y phục ngủ cơ năng kiểu Quốc phong | Cực giản (không phụ kiện thừa) |
| Hệ đô thị cyber | Điển lễ đại hôn ở đô thị | Trang điểm đại hôn | Búi cơ năng buộc cao kiểu Quốc phong | Lễ phục đại hôn Quốc phong Cyber | Cực rườm rà (trọn bộ phụ kiện dung hợp Quốc phong + cyber) |

---

> **🔍 Quy tắc suy luận cho bối cảnh chưa được liệt kê (dùng chung hai bối cảnh)**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này, **khóa hệ bối cảnh cổ trang/đô thị trước, rồi khớp quy tắc theo từng chiều**:
>
> | Chiều suy luận | Gen cốt lõi hệ cổ trang | Gen cốt lõi hệ đô thị cyber |
> |---|---|---|
> | Cường độ trang điểm | Mặc định trang điểm thanh nhã; cung đình/quyền lực/trang trọng→trang điểm quý khí cung đình; rung động/ngọt ngào→trang điểm hoa đào lãng mạn; đại hôn/điển lễ→trang điểm đại hôn; lễ hội tụ họp→trang điểm lễ hội | Mặc định trang điểm công sở đô thị; thương vụ/trang trọng→trang điểm thương vụ đô thị; rung động/ngọt ngào→trang điểm hoa đào lãng mạn; đại lễ/đại hôn→trang điểm quý khí cung đình; cyber/cơ năng/hành động đêm→trang điểm lưu quang cyber/trang điểm cơ năng tông lạnh |
> | Kiểu tóc | Thường ngày/khuê phòng→buộc nửa hoặc búi đọa mã; cung đình/trang trọng/đại lễ→búi cao vân mấn; riêng tư/ban đêm→xõa tóc; luyện võ/hành động→búi tóc đuôi ngựa cao | Thường ngày/đi làm→đuôi ngựa thấp buộc nửa; thương vụ/trang trọng→búi tóc bán quan cơ năng; đại lễ/đại hôn→búi cơ năng buộc cao; riêng tư/ban đêm→xõa tóc/đuôi ngựa thấp; cơ năng/hành động→đuôi ngựa cao |
> | Trang phục | Hình chế truyền thống Trung Hoa là cốt lõi tuyệt đối; bối cảnh cảm xúc→váy dài nhu quần phiêu dật; quyền lực/trang trọng→lễ phục cung đình; hành động→thường phục nhẹ; chất liệu PBR luôn khóa; mặc định hoa văn Trung Hoa truyền thống thuần túy | Hình chế Trung Hoa cốt lõi là nền tuyệt đối; thường ngày/đi làm→thường phục đi làm kiểu Quốc phong; thương vụ/trang trọng→lễ phục thương vụ kiểu Quốc phong; hành động/cơ năng→thường phục cơ năng nhẹ; chất liệu PBR luôn khóa; mặc định hoa văn truyền thống dung hợp vân mạch điện |
> | Độ rườm rà của phụ kiện | Thường ngày→vừa; trang trọng/cung đình→cực rườm rà; riêng tư→cực giản; hành động→giản; phụ kiện Trung Hoa truyền thống thuần túy làm cốt lõi | Thường ngày→vừa thấp; thương vụ/đại lễ→cực rườm rà; riêng tư→cực giản; hành động→giản; phụ kiện dung hợp Quốc phong + cyber làm cốt lõi, hiệu ứng sáng kiểm soát được |
> | Chuẩn chất cảm | Chất liệu PBR + ánh dịu đẳng cấp điện ảnh luôn khóa; cảm giác khối và độ bóng ưu tiên hơn cảm giác trang trí phẳng; không có hiệu ứng sáng cyber (không có manh mối rõ ràng thì cấm dùng) | Chất liệu PBR + ánh sáng đẳng cấp điện ảnh luôn khóa; cảm giác khối và độ bóng ưu tiên hơn cảm giác trang trí phẳng; hiệu ứng sáng cyber là vi neon âm kiểm soát được, cấm cháy sáng; yếu tố Quốc phong và cyber dung hợp sâu, không có cảm giác đứt gãy |

## 8. Quy phạm bản vẽ bốn hướng nhìn (dùng chung hai bối cảnh · chuẩn render 3D thống nhất)

> Sau khi chồng phục trang hóa trang phái sinh vẫn phải xuất bản vẽ bốn hướng nhìn, bảo đảm phục trang hóa trang, hoa văn, hiệu ứng sáng cyber, cấu kiện kết cấu hoàn toàn nhất quán ở mọi góc, dùng chung cho bối cảnh cổ trang/đô thị.

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Cận chân dung | Chính diện ngang tầm mắt | Từ mặt tới xương đòn | Gương mặt chiếm 60%+, chi tiết ngũ quan/trang điểm/hiệu ứng trang điểm rõ 100% | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Nhìn thẳng vào máy quay, toàn bộ mặt trước trang phục, vị trí kết cấu/hoa văn/dải sáng rõ ràng | front view、height mark、costume detail |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần túy, lớp lang mặt bên trang phục, hình thái mặt bên của kết cấu rõ ràng | side view、profile、height mark、costume profile detail |
| Ngoài cùng bên phải | Hình mặt sau | Phía sau 180° | Toàn thân đứng | Trang sức tóc sau gáy/trang phục phía lưng/đuôi tóc/kết cấu phía lưng rõ ràng | back view、rear view、height mark、rear costume detail |

### Quy phạm khung hình (dùng chung hai bối cảnh · không được vượt)

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng khung hình, bố cục dùng chung cho bối cảnh cổ trang/đô thị |
| Phông nền | Màu xám mộc thuần #B8B8B8, **cấm thêm bất kỳ yếu tố bối cảnh/môi trường/thời tiết nào**, dùng chung cho bối cảnh cổ trang/đô thị |
| Tư thế đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi dang (**cấm mọi thay đổi tư thế**), dùng chung cho bối cảnh cổ trang/đô thị |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm, chỉ giới hạn ở vi biểu cảm trên gương mặt, không liên quan tới động tác cơ thể, dùng chung cho bối cảnh cổ trang/đô thị |
| Ánh sáng | Chuẩn chung: ánh sáng dịu đều, sáng chính phía trước + sáng phụ hai bên, không bóng gắt; bối cảnh đô thị cyber có thể thêm phản xạ tự phát sáng kiểm soát được, không phá sự thống nhất ánh sáng tổng thể, không cháy sáng |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/trang sức tóc/trang phục/phụ kiện/hoa văn/hiệu ứng sáng/cấu kiện kết cấu ở bốn hướng nhìn hoàn toàn giống nhau, không sai lệch gì |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1, dùng chung cho bối cảnh cổ trang/đô thị |
| Chuẩn 3D | Dựng hình độ chính xác cao, chất liệu PBR, 8K siêu nét, render đẳng cấp điện ảnh thống nhất cho mọi bối cảnh, không có chênh lệch chất cảm giữa bối cảnh cổ trang/đô thị |

---

## 9. Khuôn mẫu prompt (thích ứng hai bối cảnh chỉ bằng một thao tác · dành riêng cho 3D Quốc phong Cyber)

### Ràng buộc định dạng đầu ra (dùng chung hai bối cảnh · quy tắc sắt)

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng điều cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên nhân vật phái sinh **không bao gồm mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung tự sự về bối cảnh/môi trường/thời tiết/phông nền nào (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không bao gồm bất kỳ tương tác đạo cụ nào**, không xuất ô/kiếm/quạt/sách/đèn lồng/chén rượu hay vật cầm tay, vật tương tác nào (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm đổi tư thế | **Không đổi tư thế của mẫu nền**, không xuất đi/ngoảnh lại/giơ tay/nghiêng người/chạy hay bất kỳ động tác, thay đổi dáng vẻ nào, giữ tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được, không cần tiêu đề, bảng, giải thích, so sánh phương án |

### Chồng đầy đủ phục trang hóa trang (bốn hướng nhìn · thích ứng hai bối cảnh chỉ bằng một thao tác)

```
lấy ảnh hình tượng cơ bản của nhân vật làm ảnh nền, chồng phục trang hóa trang bằng img2img，
phong cách 3D Quốc phong Cyber，{hệ bối cảnh: cổ trang/đô thị cyber}，dựng hình độ chính xác cao，chất liệu PBR，cốt lõi thẩm mỹ Trung Hoa，{dung hợp nhẹ kiểu cổ trang/dung hợp cơ năng kiểu đô thị}，ánh sáng đẳng cấp điện ảnh，
bản vẽ bốn hướng nhìn của nhân vật {giới tính} Quốc phong Cyber，render 3D，dựng hình độ chính xác cao，8K，siêu trung thực
character design sheet, character turnaround,
giữ gương mặt của hình tượng cơ bản hoàn toàn giống nhau, tư thế đứng tự nhiên không đổi，{khí chất tổng thể},
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm nền/trang điểm nhẹ/trang điểm trang trọng/trang điểm công sở đô thị/trang điểm thương vụ/trang điểm cơ năng cyber}; dùng {phong cách trang điểm}, render chất liệu PBR, {trang điểm mày}, {trang điểm mắt}, {trang điểm môi}, {ánh vi neon kiểm soát được/hoa văn mạch điện chìm sát da (thêm khi cần)},
【L2·Kiểu tóc】{kiểu tạo hình}, sợi tóc độ chính xác cao rõ nét, {mô tả trang sức tóc}, cốt lõi hình chế Quốc phong,
【L3+L4·Trang phục】{màu chủ đạo}{kiểu dáng}, {chất liệu}, {chế tác trang trí}, {hoa văn truyền thống/hoa văn truyền thống dung hợp vân mạch điện}, chất vải rõ ràng, render chất liệu PBR, {dải sáng vi neon âm kiểm soát được (thêm khi cần)},
【L5·Phụ kiện】{trang sức đầu}, {trang sức tai}, {trang sức cổ}, {trang sức eo}, {trang sức tay}, cốt lõi hình chế Quốc phong, thống nhất với phong cách phục trang hóa trang,
xếp cạnh nhau từ trái sang phải trong cùng khung hình：cận chân dung+hình chính diện+hình nhìn nghiêng+hình mặt sau,
đứng tự nhiên, phông nền màu xám mộc thuần, ánh sáng dịu đều, không bóng gắt, {hiệu ứng sáng cyber kiểm soát được không chói mắt (thêm khi cần)},
gương mặt/trang điểm/kiểu tóc/trang phục/phụ kiện/hoa văn/hiệu ứng sáng ở bốn hướng nhìn hoàn toàn giống nhau, dựng hình 3D Quốc phong Cyber rõ nét, dựng hình độ chính xác cao rõ nét,
trong hình không được có bất kỳ chữ nào
```

---

## 10. Quy tắc ràng buộc (dùng chung hai bối cảnh · quy tắc sắt bắt buộc + nghiêm cấm)

### Quy tắc bắt buộc (thi hành 100%, không ngoại lệ)

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc giống hệt mẫu nền, cấm mọi lệch, biến dạng, phong cách hóa sai lệch của ngũ quan |
| R2 | Trang phục bắt buộc dùng "chất vải rõ ràng + render chất liệu PBR", yếu tố cyber không được phá chất nền của trang phục và hình chế Quốc phong cốt lõi |
| R3 | Mọi bối cảnh bắt buộc lấy hình chế Quốc phong Trung Hoa làm cốt lõi tuyệt đối, bối cảnh cổ trang thuần Quốc phong truyền thống, bối cảnh đô thị không được mất nền Quốc phong, cấm thiết kế thuần kiểu Tây không có cốt lõi Quốc phong |
| R4 | Phong cách trang điểm/kiểu tóc/trang phục/phụ kiện/yếu tố cyber hoàn toàn thống nhất, cấm để yếu tố Quốc phong và cyber tách rời đối lập |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (cận chân dung+hình chính diện+hình nhìn nghiêng+hình mặt sau), dùng chung cho bối cảnh cổ trang/đô thị |
| R6 | Bắt buộc chỉ định "phông nền màu xám mộc thuần", cấm thêm bất kỳ yếu tố bối cảnh/môi trường/thời tiết nào, dùng chung cho bối cảnh cổ trang/đô thị |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán", mọi phục trang hóa trang, hoa văn, hiệu ứng sáng cyber, cấu kiện kết cấu hoàn toàn thống nhất ở bốn hướng nhìn |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/điều cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên nhân vật phái sinh không dính tới bối cảnh/môi trường/thời tiết/tự sự phông nền, bối cảnh là loại tài nguyên độc lập |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (ô/kiếm/quạt/sách...), đạo cụ là loại tài nguyên độc lập, trừ phụ kiện gắn cố định bên hông |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của mẫu nền, cấm mọi thay đổi động tác/dáng vẻ/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết** — phân tích manh mối bối cảnh, manh mối gương mặt, manh mối phong cách của người dùng trước, rồi khớp hệ tương ứng, xác định mức trang điểm |
| R13 | **Mọi tài nguyên phái sinh đều cần hóa trang** — bình thường không để mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm được kiểm soát** — dù có trang điểm vẫn phải tiết chế, không được xuất hiện trang điểm đậm kiểu hiện đại/trang điểm màu phô trương/hiệu ứng sáng cyber cháy sáng |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được đẩy trang điểm nền lên mức mạnh hơn |
| R16 | **Quy tắc thích ứng hai bối cảnh** — không có manh mối cyber/đô thị rõ ràng thì mặc định sinh nội dung thuần cổ trang; có manh mối rõ ràng thì khớp hệ đô thị cyber, không được tự ý chuyển hệ |
| R17 | **Yếu tố cyber bị kiểm soát nghiêm ngặt** — chỉ hệ đô thị cyber mới được dùng hiệu ứng sáng/yếu tố cơ năng cyber, bối cảnh cổ trang không có manh mối rõ ràng thì cấm dùng; mọi yếu tố cyber bắt buộc dung hợp sâu với Quốc phong, cấm đứt gãy |
| R18 | **Yếu tố cyber chỉ giới hạn trong phạm vi phục trang hóa trang** — cấu kiện kết cấu cơ năng, phần tử hiệu ứng sáng chỉ giới hạn ở lớp phục trang phụ kiện, không được đổi ngũ quan, kết cấu chi thể và dáng người cơ bản của mẫu nền |
| R19 | **Chất 3D thống nhất mọi bối cảnh** — bối cảnh cổ trang/đô thị bắt buộc giữ cùng một chuẩn dựng hình độ chính xác cao, chất liệu PBR, ánh sáng đẳng cấp điện ảnh, không được hạ cấp chất cảm |

### Quy tắc nghiêm cấm (cấm 100%, không ngoại lệ)

| Mã | Nghiêm cấm |
|---|---|
| X1 | Sau khi chồng lớp gương mặt bị lệch, ngũ quan biến dạng, không khớp mẫu nền |
| X2 | Trang phục mất hình chế Quốc phong cốt lõi, xuất hiện vest thuần kiểu Tây, đồ cơ năng thuần túy, thiết kế cyberpunk thuần kiểu Tây không có cốt lõi Trung Hoa |
| X3 | Phong cách trang điểm/trang phục/yếu tố cyber xung đột nhau, xuất hiện cảm giác đứt gãy, yếu tố Quốc phong và cyber đối lập |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc màu thuần), cấm thêm bất kỳ yếu tố môi trường/bối cảnh/thời tiết nào |
| X5 | Phục trang hóa trang, hoa văn, hiệu ứng sáng cyber, cấu kiện kết cấu không nhất quán giữa bốn hướng nhìn |
| X6 | Xuất bất kỳ nội dung nào ngoài prompt (bảng/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên nhân vật phái sinh (cảnh phố/cảnh mưa/trong nhà/đường phố/thời tiết hay yếu tố môi trường khác) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "điều cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác đạo cụ nào (cầm ô/kiếm/quạt/sách/đèn lồng/chén rượu...) |
| X10 | Đổi tư thế của mẫu nền (đi/ngoảnh lại/giơ tay/nghiêng người/chạy/cúi đầu/ngẩng nhìn hay mô tả động tác khác) |
| X11 | Thêm mô tả gắn biểu cảm với tư thế (kiểu viết tự sự như "nghiêng người 45° vừa đi vừa khẽ nhếch môi") |
| X12 | Chưa phân tích manh mối người dùng đã áp thẳng một kiểu trang điểm/yếu tố cyber cố định, tự ý chuyển đổi giữa hệ cổ trang/đô thị |
| X13 | Sai lầm để mặt mộc, khiến tài nguyên phái sinh thiếu phần hóa trang đáng có |
| X14 | Chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác mà nâng nhầm mức trang điểm, dẫn tới quyết định cường độ hóa trang sai |
| X15 | Bối cảnh cổ trang khi không có manh mối rõ ràng lại tự ý thêm hiệu ứng sáng/yếu tố cơ năng cyber, phá không khí cổ trang |
| X16 | Hiệu ứng sáng neon cháy sáng, chói mắt, phủ diện rộng, phá chất khung hình và gương mặt nhân vật, chi tiết phục trang hóa trang |
| X17 | Tự ý sửa kết cấu chi thể, hình thái ngũ quan của mẫu nền, thêm cải tạo nghĩa thể, sơn vẽ cơ thể ngoài phạm vi phục trang hóa trang |
| X18 | Bối cảnh đô thị mất nền Quốc phong, xuất hiện phong cách cyberpunk thuần kiểu Tây, rời khỏi hình chế Trung Hoa cốt lõi |
| X19 | Xuất hiện thiết kế punk kiểu Tây dung tục, phô trương, không hợp thẩm mỹ phương Đông, đi ngược cốt lõi thẩm mỹ Quốc phong |

---

## ✅ Ghi chú hoàn tất kiểm tra
1. **Thích ứng hai bối cảnh 100%**: dựng đầy đủ hai bộ quy tắc song song "hệ cổ trang truyền thống" + "hệ đô thị cyber", khi không có manh mối cyber rõ ràng vẫn sinh được nội dung thuần cổ trang hoàn hảo, khi có manh mối đô thị thì sinh chính xác nội dung Quốc phong Cyber, hai bên không xung đột
2. **Nền Quốc phong không lệch chút nào**: lằn ranh "hình chế Trung Hoa là cốt lõi tuyệt đối" xuyên suốt cả sổ tay, mọi trang phục, kiểu tóc, phụ kiện của bối cảnh đô thị cyber đều giữ cốt lõi Quốc phong, loại bỏ nguy cơ lệch sang cyber thuần kiểu Tây
3. **Dung hợp cyber kiểm soát được**: yếu tố cyber chia thành "bản nhẹ tùy chọn" và "bản tăng cường đô thị", ranh giới rõ ràng, không xảy ra chuyện bối cảnh cổ trang bị cyber hóa quá đà hay bối cảnh đô thị mất Quốc phong
4. **Chuẩn 3D thống nhất toàn bộ**: bối cảnh cổ trang/đô thị dùng chung một chuẩn render 3D độ chính xác cao, chất liệu PBR, ánh sáng, độ chính xác dựng hình không chênh lệch, bảo đảm kết quả sinh ra ổn định
5. **Không sót ràng buộc cốt lõi**: giữ trọn các quy tắc cốt lõi của sổ tay gốc như "gương mặt không đổi, tư thế không đổi, kiểm soát được từng lớp, chỉ trong phạm vi phục trang hóa trang", việc tối ưu không phá logic nền của sổ tay gốc
6. **Phủ mọi bối cảnh không góc chết**: đã bổ sung đủ tổ hợp phục trang hóa trang, quy tắc suy luận, khuôn mẫu prompt cho mọi bối cảnh chi tiết của cổ trang + đô thị, dùng ngay được, không cần chỉnh lại lần hai