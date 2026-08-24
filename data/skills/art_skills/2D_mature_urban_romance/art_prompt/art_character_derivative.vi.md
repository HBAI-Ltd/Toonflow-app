# Tạo tài nguyên phái sinh nhân vật anime · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt bản gốc, cấm để gương mặt lệch đi
2. **Tư thế không đổi** — giữ nguyên tư thế đứng tự nhiên của bản gốc, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mỗi lớp mô tả độc lập, tiện thay thế theo lớp (đổi trang phục mà không đổi trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố trang phục - trang điểm đều theo cùng một hệ thẩm mỹ
5. **Chất lượng không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn bản gốc
6. **Chỉ trong phạm vi trang phục - trang điểm** — chỉ chồng thêm trang điểm/kiểu tóc/trang phục/phụ kiện/giày dép, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản gốc | Bản gốc tạo hình nền, không sửa |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định mức "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Tạo hình tóc | Búi tóc/buộc tóc/tết tóc + phụ kiện tóc |
| L3 | Áo trong/lớp lót | Thay cho áo trong nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Trang phục đô thị hiện đại có phân hóa (sơ mi/áo khoác/đầm liền/bộ suit...) |
| L5 | Phụ kiện | Trang sức/đồng hồ/kính/túi xách... |
| L6 | Giày dép | Giày cao gót/bốt ngắn/giày lười/giày thể thao..., tạo thành bộ hoàn chỉnh với cả trang phục |

> **Ranh giới phạm vi**: tài nguyên phái sinh nhân vật chỉ gồm các lớp L0–L6 (trang phục, trang điểm, tạo hình), không gồm đạo cụ (điện thoại/sách/ô/cốc cà phê và các vật cầm tay khác), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...) hay tư thế động tác (đi/ngoái nhìn/giơ tay...). Những thứ đó thuộc phạm vi các loại tài nguyên khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ bản gốc sang trang điểm phái sinh (then chốt)

> Bản gốc nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định đi vào quy trình trang điểm. Hệ thống phải căn theo manh mối người dùng cung cấp mà phân tích nhu cầu trang điểm, rồi quyết định mức giữa trang điểm nền, trang điểm nhẹ và trang điểm trang trọng, chứ không giữ mặt mộc.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối của người dùng: từ chỉ trạng thái gương mặt, từ chỉ cảm xúc, từ chỉ cường độ | Bản tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không phải căn cứ để lên trang điểm | Ngăn phán đoán sai |
| S3 | Đối chiếu ma trận phong cách trang điểm và đưa ra mức cường độ | Trang điểm nền / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thực thi)

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn mạnh gương mặt | Chỉ đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Trang điểm nền |
| Manh mối gương mặt nhẹ | Dịu dàng, mỉm cười, lông mi khẽ rung, sắc mặt hồng hơn chút | Trang điểm nhẹ (cực nhạt) |
| Manh mối yếu bệnh rõ ràng | Sắc mặt tái nhợt, màu môi cực nhạt, dưới mắt hơi ửng đỏ | Trang điểm lê yếu bệnh (trang điểm nhẹ) |
| Manh mối nghi lễ trang trọng rõ ràng | Y phục lộng lẫy, đại lễ, dịp trang trọng | Trang điểm trang trọng (có kiểm soát) |

> Nguyên tắc phán định: mọi tài nguyên phái sinh đều phải có trang phục - trang điểm; xem manh mối gương mặt trước để quyết định cường độ và phong cách, thay đổi về đạo cụ, bối cảnh, tư thế không được tự nó nâng cường độ trang điểm lên.

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh phù hợp | Prompt cốt lõi |
|---|---|---|
| Trang điểm mộc thanh nhã | Thường ngày, lần đầu gặp, công sở | trang điểm thanh nhã、mày kẻ nhạt、mặt mộc trong trẻo |
| Trang điểm sương lạnh sắc | Trang trọng, đối đầu, thương trường | trang điểm lạnh sắc、mày mắt sắc lẹm、môi mỏng lạnh lùng |
| Trang điểm đào mềm quyến rũ | Ngọt sủng, mập mờ, hẹn hò | trang điểm hoa đào、đuôi mắt hơi ửng đỏ、màu môi mọng nước |
| Trang điểm lê yếu bệnh | Bị thương, suy yếu | sắc mặt tái nhợt、màu môi cực nhạt、dưới mắt hơi ửng đỏ |
| Trang điểm dạ tiệc sang trọng | Tiệc tùng, dạ yến | trang điểm đậm lộng lẫy、môi son mắt sáng |

### Nền da chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Chất cảm kiểu cel, mượt mịn | vân da kiểu cel、da mượt |
| Độ trắng | Da trắng lạnh, trong chứ không trắng bệch | da trắng lạnh、làn da trắng |
| Ánh trong | Cảm giác sáng dịu từ trong ra | ánh sáng từ bên trong、da trong |
| Cấm | Lì/trắng bệch/như sáp/bóng dầu/cháy sáng | — |

### Chi tiết trang điểm nền (mức mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Mày | Tỉa nhẹ theo dáng mày của bản gốc, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch |
| Mắt | Điểm mắt cực nhạt, nhấn vào độ trong và có thần | mắt trong、kẻ mí trong cực nhạt |
| Má | Nâng sắc mặt cực nhạt, không được đắp màu thấy rõ | sắc má tự nhiên、nâng sắc mặt rất nhẹ |
| Môi | Tô hồng nude hoặc hồng nhạt, giữ mức tiết chế | màu môi tự nhiên mọng、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có trang điểm, nhưng cảm giác lớp trang điểm rất nhẹ | trang điểm nền、cảm giác trang điểm như mặt mộc、tự nhiên |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Chất cảm kiểu cel, khoáng đạt tự nhiên | vân da kiểu cel、da khoáng đạt |
| Nguyên tắc | Trang điểm như mặt mộc — trông như không trang điểm mà da rất đẹp | trang điểm như mặt mộc、da đẹp bẩm sinh |
| Lông mày | Mày rậm tự nhiên, không kẻ mày | dáng mày tự nhiên、dáng mày tuấn tú |
| Màu môi | Sắc máu tự nhiên, hơi mọng | màu môi tự nhiên、có sắc máu |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Phù hợp | Prompt |
|---|---|---|---|
| Tóc xõa tự nhiên | Tóc dài buông tự nhiên | Thường ngày, công sở | tóc xõa tự nhiên、tóc dài mượt |
| Buộc nửa | Buộc nửa phần trên, phần dưới buông | Thường ngày, đi làm | buộc nửa、buộc nửa tóc |
| Tóc đuôi ngựa | Đuôi ngựa cao/đuôi ngựa thấp | Vận động, thư giãn | đuôi ngựa cao、đuôi ngựa thấp |
| Búi tóc | Búi tóc thanh nhã | Dịp trang trọng | búi tóc thanh nhã、búi tóc |
| Hai bên đuôi | Hai đuôi tóc kiểu thiếu nữ | Cảnh tươi vui | hai đuôi tóc、kiểu tóc thiếu nữ |
| Buộc gọn toàn bộ | Búi tóc/tóc búi tròn | Ở nhà, thư giãn | tóc búi tròn、búi tóc |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Tối giản tinh tế, ăn khớp với trang phục | phụ kiện tóc tối giản、kẹp tóc tinh tế |
| Chất liệu | Kim loại/ánh ngọc trai/vải | kẹp tóc kim loại、phụ kiện tóc ánh ngọc trai |
| Chế tác | Chế tác tinh xảo, chi tiết rõ ràng | chế tác tinh xảo、chi tiết rõ ràng |

### Các kiểu tạo hình nam

| Tạo hình | Phù hợp | Prompt |
|---|---|---|
| Tóc ngắn rẽ lệch | Thường ngày, thương trường | tóc ngắn rẽ lệch、kiểu tóc thương trường |
| Tóc trung rối | Thư giãn, nghệ sĩ | tóc trung rối、kiểu tóc nghệ sĩ |
| Tóc ngắn gọn gàng | Vận động, dứt khoát | tóc ngắn gọn gàng、kiểu tóc khoáng đạt |
| Tóc trung dài | Trang trọng, nghệ sĩ | tóc trung dài、kiểu tóc nghệ sĩ |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Phù hợp | Prompt |
|---|---|---|---|
| Đồ công sở trang trọng | Bộ vest chân váy/sơ mi + quần âu | Công sở, trang trọng | đồ công sở trang trọng、bộ vest công sở |
| Thường ngày thoải mái | Áo phông + quần jean/đầm liền | Thường ngày, thư giãn | đồ thoải mái、trang phục thường ngày |
| Đồ đi hẹn hò | Đầm liền/chân váy | Hẹn hò, dịp hẹn hò | đồ hẹn hò、váy đẹp |
| Thể thao thư giãn | Đồ thể thao/áo hoodie/quần thể thao | Vận động, thư giãn | đồ thể thao、thể thao thư giãn |
| Váy dạ hội | Váy dạ hội trang trọng | Tiệc tùng, dạ yến | váy dạ hội、lễ phục trang trọng |

### Nguyên tắc phân hóa trang phục

| Hạng mục | Ràng buộc | Diễn giải |
|---|---|---|
| Phân biệt nhân vật | Căn theo tuổi, nghề nghiệp, tính cách, điều kiện kinh tế mà quyết định độ tinh tế và kiểu cắt may | Cấm để mọi nhân vật cùng một kiểu, một màu, một cách phối |
| Khác biệt trong cùng phong cách | Ngay cả khi cùng là đồ công sở, cũng phải phân biệt váy/quần, phom áo khoác, lớp mặc bên trong | Giữ thẩm mỹ thống nhất, không xử lý theo kiểu đồng phục |
| Hợp bối cảnh | Đi làm, hẹn hò, ở nhà, dạ yến đều đổi phương án trang phục riêng | Trang phục phải đổi theo tình huống |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Chủ yếu tông màu dịu, độ bão hòa thấp, nhưng mỗi nhân vật cần có trọng tâm phối màu riêng | tông màu dịu、màu độ bão hòa thấp、phối màu riêng của nhân vật |
| Chất liệu | Chất cảm vải hiện đại, vân bề mặt rõ | vải hiện đại、vân bề mặt rõ |
| Chất cảm | Chất cảm vải vóc của trang phục rõ ràng | chất cảm trang phục rõ、vân vải |
| Lớp lang | Trang phục phân lớp rõ, phối hợp lý, không rập khuôn một mẫu | lớp trang phục rõ ràng、phối hợp lý |

### Ma trận trang phục nam

| Phong cách | Phù hợp | Prompt |
|---|---|---|
| Đồ công sở trang trọng | Sơ mi/vest/vest thoải mái | đồ công sở trang trọng、bộ vest |
| Thường ngày thoải mái | Sơ mi thoải mái/áo phông + quần thoải mái | đồ thoải mái、trang phục thường ngày |
| Thể thao thư giãn | Đồ thể thao/áo hoodie/quần thể thao | đồ thể thao、thể thao thư giãn |
| Lễ phục trang trọng | Lễ phục, vest | lễ phục trang trọng、vest lễ phục |
| Đồ mặc ở nhà | Đồ mặc nhà, đồ thoải mái | đồ mặc nhà、trang phục thoải mái |

### Thiết kế giày dép (L6)

| Loại | Phù hợp | Prompt |
|---|---|---|
| Giày đi làm nữ | Công sở, trang trọng | giày cao gót mũi nhọn、giày gót mèo、giày lười、da mịn |
| Giày thường ngày nữ | Thư giãn, hẹn hò | giày bệt hở mu、bốt ngắn、giày trắng、phom giày tinh tế |
| Giày đi làm nam | Thương trường, trang trọng | giày da、giày derby、giày lười、mặt giày sạch và đứng phom |
| Giày thoải mái nam nữ | Thường ngày, vận động | giày thể thao、giày vải、giày thoải mái tối giản、ăn khớp với trang phục |

> Giày dép bắt buộc viết rõ kiểu dáng, chất liệu và phối màu, và phải nhất quán với phong cách trang phục; cấm bỏ qua thiết kế phần chân hoặc mặc định mọi nhân vật đi cùng một loại giày.

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức | Tối giản tinh tế, không quá phô trương | trang sức tối giản、khuyên tai tinh tế |
| Đồng hồ | Đồng hồ tinh tế, đồng hồ đeo tay thời trang | đồng hồ thời trang、đồng hồ đeo tay tinh tế |
| Túi xách | Túi đeo vai/túi xách tay, chất cảm rõ | túi xách tay、túi có chất |
| Kính | Kính thời trang/kính râm (tùy chọn) | kính thời trang、kính râm tinh tế |
| Thắt lưng | Thắt lưng tinh tế, chi tiết rõ | thắt lưng tinh tế、thắt lưng thời trang |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Đồng hồ | Đồng hồ thời trang, chất cảm rõ | đồng hồ thời trang、đồng hồ đeo tay tinh tế |
| Kính | Kính thời trang/kính râm (tùy chọn) | kính thời trang、kính râm tinh tế |
| Thắt lưng | Thắt lưng tinh tế, chi tiết rõ | thắt lưng tinh tế、thắt lưng thời trang |
| Cà vạt | Cà vạt/nơ cổ (dịp trang trọng) | cà vạt thời trang、nơ cổ tinh tế |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện | Giày dép |
|---|---|---|---|---|---|
| Đi làm công sở | Trang điểm mộc thanh nhã | Buộc nửa/búi tóc | Đồ công sở trang trọng (có thể phân biệt bộ vest chân váy/quần âu/khoác trench) | Trang sức tối giản/đồng hồ | Giày cao gót/giày lười/giày da |
| Buổi hẹn đầu tiên | Trang điểm đào mềm quyến rũ | Tóc xõa tự nhiên | Đồ đi hẹn hò (đầm liền/bộ đồ len/chân váy) | Trang sức tinh tế/túi xách | Giày bệt/bốt ngắn |
| Thường ngày thư giãn | Trang điểm nền | Đuôi ngựa/tóc xõa tự nhiên | Thường ngày thoải mái (áo phông quần jean/sơ mi khoác lớp/áo hoodie) | Phụ kiện tối giản | Giày trắng/giày vải |
| Dịp trang trọng | Trang điểm sương lạnh sắc | Búi tóc/buộc nửa | Đồ công sở trang trọng/váy dạ hội | Trang sức tinh tế/đồng hồ | Giày cao gót/giày dự lễ/giày da |
| Thể thao thư giãn | Trang điểm nền (cực nhạt) | Đuôi ngựa cao/tóc ngắn gọn gàng | Thể thao thư giãn | Đồng hồ thể thao/phụ kiện thể thao | Giày thể thao |
| Tiệc tùng gặp gỡ | Trang điểm trang trọng | Búi tóc thanh nhã/tóc xõa | Váy dạ hội/đồ thời trang | Trang sức tinh tế/phụ kiện tinh tế | Giày gót nhọn/bốt ngắn/giày dự lễ |
| Ở nhà thư giãn | Mặt mộc/trang điểm nền | Tóc búi tròn/tóc xõa tự nhiên | Đồ mặc ở nhà | Không hoặc rất ít phụ kiện | Dép đế mềm/giày đi trong nhà tối giản |

---

> **🔍 Quy tắc suy luận cho bối cảnh chưa có trong bảng**
>
> Khi bối cảnh/tình huống người dùng mô tả không nằm trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen ngôn tình đô thị anime |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm mộc thanh nhã; có từ chỉ căng thẳng/đối đầu/quyền lực → trang điểm sương lạnh sắc; ngọt sủng/mập mờ/rung động → trang điểm đào mềm quyến rũ; suy yếu/bị thương → trang điểm lê yếu bệnh; dạ yến/tiệc tùng → trang điểm dạ tiệc sang trọng |
> | Kiểu tóc | Công sở/đi làm → buộc nửa hoặc búi tóc; thường ngày/yêu đương → tóc xõa tự nhiên; vận động/hành động → đuôi ngựa cao; dịp trang trọng → búi tóc thanh nhã |
> | Trang phục | Ưu tiên bối cảnh đô thị hiện đại; cảm xúc càng mạnh → trang phục càng tinh tế; cảnh căng thẳng → đồ công sở trang trọng/tông màu lạnh |
> | Độ nhiều phụ kiện | Thường ngày → tối giản; hẹn hò → trang sức tinh tế + túi xách; trang trọng/dạ yến → trang sức tinh tế + đồng hồ; vận động → ít hoặc không |
> | Thiên hướng tông màu | Da trắng lạnh + phối màu đô thị độ bão hòa thấp; cảnh mập mờ → tông hồng ấm; đối đầu/căng thẳng → xám lạnh + tương phản đen trắng |

## 8. Quy phạm bản vẽ bốn hướng nhìn

> Sau khi chồng lớp trang phục - trang điểm phái sinh vẫn phải xuất bản vẽ bốn hướng nhìn, để bảo đảm trang phục, trang điểm, tạo hình nhất quán ở mọi góc.

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | `portrait closeup`、`face detail`、`makeup detail` |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, thấy trọn mặt trước trang phục | `front view`、`height mark` |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn nghiêng | `side view`、`profile`、`height mark` |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Phụ kiện tóc sau gáy/trang phục phần lưng/đuôi tóc rõ ràng | `back view`、`rear view`、`height mark` |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết `#E8E8E8` |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (như trang điểm mộc thanh nhã → điềm đạm, trang điểm đào → mỉm cười), chỉ giới hạn ở vi biểu cảm trên mặt, không liên quan động tác cơ thể |
| Ánh sáng | Sáng dịu đều, đèn chính phía trước + đèn bù hai bên, không đổ bóng gắt |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/phụ kiện tóc/trang phục/phụ kiện/giày dép hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng điều cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên phái sinh nhân vật **không chứa mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung kể về bối cảnh/môi trường/thời tiết/phông nền nào (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không chứa bất kỳ tương tác đạo cụ nào**, không xuất điện thoại/sách/ô/cốc cà phê hay vật cầm tay, vật tương tác khác (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm đổi tư thế | **Không đổi tư thế của bản gốc**, không xuất đi/ngoái nhìn/giơ tay/nghiêng người/chạy hay bất kỳ động tác, thay đổi dáng người nào, giữ nguyên tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối prompt dùng được, không cần tiêu đề, bảng biểu, giải thích, so sánh phương án |

### Chồng lớp trang phục - trang điểm đầy đủ (bốn hướng nhìn)

Lấy hình tạo hình nền của nhân vật làm hình gốc, img2img chồng lớp trang phục - trang điểm - tạo hình，
bản vẽ bốn hướng nhìn của nhân vật {giới tính} anime，tô màu kiểu cel，phong cách đô thị hiện đại，tương phản mạnh，chi tiết tối đa，8K，siêu trung thực
character design sheet，character turnaround，
giữ nguyên gương mặt của tạo hình nền，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}; dùng {phong cách trang điểm}，da sáng dịu，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo hình}，sợi tóc phân lớp rõ ràng，{mô tả phụ kiện tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{chế tác trang trí}，phối phân hóa theo thân phận nhân vật và bối cảnh, tránh để mọi người cùng kiểu cùng màu，chất cảm trang phục rõ，vân bề mặt cực kỳ sắc nét，
【L5·Phụ kiện】{phụ kiện đầu}，{khuyên tai}，{đồng hồ}，{túi xách}，
【L6·Giày dép】{phom giày}，{chất liệu mặt giày}，{mô tả gót/đế giày}，nhất quán với phong cách trang phục，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
đứng tự nhiên，phông nền xám trung tính tinh khiết，sáng dịu đều，không đổ bóng gắt，
bốn hướng nhìn nhất quán，diện mạo render tinh tế，render sợi tóc tinh tế，chi tiết vân bề mặt cực kỳ sắc nét
trong hình không được có bất kỳ chữ nào

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc giống bản gốc |
| R2 | Trang phục bắt buộc dùng "chất cảm trang phục rõ + vân bề mặt cực kỳ sắc nét" |
| R3 | Phụ kiện nữ bắt buộc "tối giản tinh tế + chế tác rõ ràng" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện/giày dép thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau) |
| R6 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/điều cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên phái sinh nhân vật không dính đến bối cảnh/môi trường/thời tiết/phông nền kể chuyện, bối cảnh là loại tài nguyên riêng |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (điện thoại/sách/ô/cốc cà phê...), đạo cụ là loại tài nguyên riêng |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của bản gốc, cấm mọi thay đổi động tác/dáng người/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết định** — phân tích manh mối gương mặt của người dùng trước, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần trang phục - trang điểm** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm có kiểm soát** — dù có trang điểm cũng phải tiết chế, không được xuất hiện hiệu ứng trang điểm màu cường điệu |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ để nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được nâng trang điểm nền lên mức mạnh hơn |
| R16 | **Bắt buộc nêu rõ thiết kế giày dép** — phom giày, chất liệu, màu sắc nêu rõ ít nhất hai mục, không được bỏ qua phần phối giày |
| R17 | **Trang phục bắt buộc phân hóa** — đổi cách mặc theo thân phận, tuổi, tính cách, bối cảnh của nhân vật, cấm áp cùng một mẫu trang phục cho mọi nhân vật |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Gương mặt lệch đi sau khi chồng lớp |
| X2 | Phụ kiện quá sơ sài/quá phô trương |
| X3 | Trang điểm/trang phục/giày dép xung đột phong cách với nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Trang phục - trang điểm - tạo hình không nhất quán giữa bốn hướng nhìn |
| X6 | Xuất bất kỳ nội dung nào ngoài prompt (bảng biểu/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên phái sinh nhân vật (trong nhà hiện đại/ngoài trời/thời tiết và các yếu tố môi trường khác) |
| X8 | Bỏ qua thiết kế giày dép, khiến phần chân chỉ còn bản gốc hoặc không có phối rõ ràng |
| X9 | Mọi nhân vật dùng trang phục cùng kiểu cùng màu cùng phom, thiếu khác biệt giữa các nhân vật |
| X10 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "điều cấm", "phương án phái sinh" |
| X11 | Thêm bất kỳ tương tác đạo cụ nào (cầm điện thoại/sách/ô/cốc cà phê hay vật tương tự) |
| X12 | Đổi tư thế của bản gốc (đi/ngoái nhìn/giơ tay/nghiêng người/chạy/cúi đầu/ngước nhìn và các mô tả động tác khác) |
| X13 | Thêm mô tả gắn kết biểu cảm với tư thế (kiểu viết kể chuyện như "nghiêng người 45° vừa đi vừa khẽ cong khóe miệng") |
| X14 | Chưa phân tích manh mối người dùng đã áp thẳng một kiểu trang điểm cố định |
| X15 | Giữ mặt mộc sai chỗ, khiến tài nguyên phái sinh thiếu phần trang phục - trang điểm đáng lẽ phải có |
| X16 | Chỉ vì từ về đạo cụ/bối cảnh/động tác mà nâng nhầm trang điểm lên, dẫn tới quyết định sai cường độ trang phục - trang điểm |
