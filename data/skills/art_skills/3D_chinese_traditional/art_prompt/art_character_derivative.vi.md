---
name: art_character_derivative
description: Tạo tài nguyên nhân vật phái sinh · sổ tay ràng buộc
metaData: art_skills
---

# Tạo tài nguyên nhân vật phái sinh · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt mẫu nền, cấm gương mặt bị lệch
2. **Tư thế không đổi** — giữ tư thế đứng tự nhiên của mẫu nền, cấm mọi thay đổi tư thế/động tác/dáng vẻ
3. **Kiểm soát được từng lớp** — mỗi lớp mô tả độc lập, tiện thay theo lớp (đổi trang phục mà không đổi trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố phục trang hóa trang đều theo cùng một hệ thẩm mỹ
5. **Chất không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn mẫu nền
6. **Chỉ trong phạm vi phục trang hóa trang** — chỉ chồng trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Mẫu nền | Mẫu nền của hình ảnh cơ bản, không sửa |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định mức "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Tạo hình tóc | Búi/búi cao/tết + trang sức tóc |
| L3 | Áo giữa/áo lót | Thay áo giữa nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Hoa phục/lễ phục/thường phục cổ trang... |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo/tay |

> **Ranh giới phạm vi**: tài nguyên nhân vật phái sinh chỉ gồm các lớp L0–L5 (phục trang hóa trang), không gồm đạo cụ (ô/kiếm/quạt/sách/đèn lồng và các vật cầm tay khác), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...), tư thế động tác (đi/ngoái nhìn/giơ tay...). Những thứ đó thuộc phạm vi của các loại tài nguyên khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ mẫu nền tới hóa trang phái sinh (then chốt)

> Mẫu nền nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định bước vào quy trình hóa trang. Hệ thống phải phân tích nhu cầu hóa trang theo manh mối người dùng cung cấp và quyết định mức giữa trang điểm nền, trang điểm nhẹ và trang điểm trang trọng, chứ không giữ mặt mộc.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối của người dùng: từ về trạng thái gương mặt, từ về cảm xúc, từ về cường độ | Hình thành bản tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không được lấy làm căn cứ để lên trang điểm | Tránh phán đoán sai |
| S3 | Khớp với ma trận phong cách trang điểm và đưa ra mức cường độ | Trang điểm nền / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thi hành)

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn mạnh gương mặt rõ ràng | Chỉ đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Trang điểm nền |
| Manh mối gương mặt nhẹ | Dịu dàng, mỉm cười, lông mi khẽ rung, sắc mặt hơi tươi lên | Trang điểm nhẹ (cực nhạt) |
| Manh mối thường ngày rõ ràng | Thường ngày, ra ngoài, thư giãn | Trang điểm nền (tự nhiên trong trẻo) |
| Manh mối nghi lễ trang trọng rõ ràng | Đại hôn, điển lễ, dịp quan trọng | Trang điểm trang trọng (tinh xảo xa hoa) |

> Nguyên tắc phán định: mọi tài nguyên phái sinh đều phải có hóa trang; xem manh mối gương mặt trước để quyết cường độ và phong cách, thay đổi về đạo cụ, bối cảnh, tư thế không được tự mình đẩy cường độ trang điểm lên.

### Ma trận phong cách trang điểm nữ

| Phong cách | Bối cảnh áp dụng | Prompt cốt lõi |
|---|---|---|
| Trang điểm thanh nhã | Thường ngày, lần đầu gặp, trong khuê phòng | trang điểm thanh nhã、mày ngài kẻ nhẹ、mặt mộc thanh tú |
| Trang điểm quý khí cung đình | Cung đình, trang trọng, quyền lực | trang điểm tinh xảo、dáng mày sắc、màu môi hồng thắm |
| Trang điểm đào hoa lãng mạn | Hẹn hò, rung động, ngọt ngào | trang điểm đào hoa、đuôi mắt hơi ửng đỏ、màu môi căng mọng |
| Trang điểm đại hôn | Đại hôn, điển lễ | trang điểm đậm lộng lẫy、môi son mắt phượng |
| Lễ hội khánh điển | Khánh điển, tụ họp | màu sắc tươi sáng、trang điểm màu phấn |

### Nền da dùng chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất cảm | Render chất liệu PBR, trong trẻo tự nhiên | chất liệu PBR、bóng tự nhiên、chất dịu |
| Độ trắng | Tông hồng trắng, trong trẻo chứ không trắng bệch | tông hồng trắng、trắng trong |
| Ánh xuyên trong | Cảm giác ánh sáng dịu tỏa từ trong ra | cảm giác ánh xuyên trong、da trong và phát sáng |
| Cấm | Lì/trắng bệch/cảm giác sáp/bóng dầu/cháy sáng | — |

### Chi tiết trang điểm nền (mức mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lông mày | Tỉa nhẹ theo dáng mày của mẫu nền, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch |
| Mắt | Điểm tô mắt cực nhạt, nhấn vào sự trong trẻo và có thần | mắt trong trẻo、phấn mắt cực nhạt |
| Gò má | Nâng sắc mặt cực nhạt, má hồng màu phấn | sắc mặt tự nhiên、má hồng màu phấn |
| Môi | Hồng nhạt hoặc son đỏ nhuận màu, giữ mức kiềm chế | màu môi tự nhiên căng mọng、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có trang điểm, nhưng cảm giác trang điểm rất nhẹ | trang điểm nền、cảm giác trang điểm tự nhiên、chất dịu |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Render chất liệu PBR, trắng trong, sạch sẽ tự nhiên | chất liệu PBR、trắng trong、bóng tự nhiên |
| Nguyên tắc | Giả mặt mộc — nhìn như không trang điểm nhưng da cực đẹp | giả mặt mộc、da đẹp trời cho |
| Lông mày | Mày rậm tự nhiên, không kẻ mày | mày kiếm tự nhiên、dáng mày khí phách |
| Màu môi | Sắc máu tự nhiên, hơi căng | màu môi tự nhiên、có sắc máu |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Áp dụng | Prompt |
|---|---|---|---|
| Búi cao vân mấn | Búi cao + trang sức tóc | Cung đình, trang trọng | búi cao vân mấn、búi tóc tinh xảo |
| Búi song hoàn | Hai vòng đối xứng, thiếu nữ | Nhân vật trẻ | búi song hoàn、phong cách thiếu nữ |
| Búi đọa mã | Búi thấp lệch một bên, uể oải | Thường ngày, thư giãn | búi đọa mã、búi lệch uể oải |
| Xõa tóc | Tóc dài xõa hết, tự nhiên | Trong khuê phòng, riêng tư | tóc dài xõa、buông tự nhiên |
| Búi tóc đuôi ngựa cao | Búi cao gọn gàng | Luyện võ, hành động | đuôi ngựa buộc cao、gọn gàng dứt khoát |
| Buộc nửa | Buộc nửa phần tóc trên + phần sau buông | Thường ngày, ra ngoài | búi vân buộc nửa、tóc buông tự nhiên |

### Trang sức tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Lộng lẫy tinh xảo, đồng bộ với trang phục | trang sức tóc lộng lẫy、chế tác tinh xảo |
| Chất liệu | Vàng bạc + châu ngọc + tua rua | trâm vàng trâm bạc、châu thúy đầy đầu |
| Chế tác | Tạo mô hình độ chính xác cao, chi tiết rõ | chế tác độ chính xác cao、chạm khắc tinh vi |

### Các kiểu tạo hình nam

| Tạo hình | Áp dụng | Prompt |
|---|---|---|
| Búi tóc bán quan | Thường ngày, văn nhân | búi tóc bán quan、trâm ngọc cài tóc |
| Toàn quan búi cao | Trang trọng, triều đường | toàn quan búi cao、mũ ngọc cài tóc |
| Xõa tóc phủ vai | Riêng tư, bị thương | xõa tóc phủ vai、tóc dài như mực |
| Búi tóc đuôi ngựa cao | Chiến đấu, luyện võ | tóc buộc cao kiểu chiến、đuôi ngựa dứt khoát |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Áp dụng | Prompt |
|---|---|---|---|
| Váy dài cổ trang | Váy dài, phiêu dật | Thường ngày, trong khuê phòng | váy dài cổ trang、xiêm y phiêu dật |
| Lễ phục cung đình | Lễ phục, lộng lẫy | Cung đình, trang trọng | lễ phục cung đình、váy áo xa hoa |
| Thường phục nhẹ | Áo ngắn, nhẹ nhàng | Hành động, luyện võ | thường phục nhẹ、áo ngắn |
| Y phục ngủ | Áo lót the mỏng, màu trơn | Trong nhà, ban đêm | y phục ngủ、rộng rãi thoải mái |
| Hôn phục đại hôn | Phượng quan hà bí, áo đỏ nhiều lớp | Hôn lễ | phượng quan hà bí、xiêm đỏ nhiều lớp |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Mặc định là tông màu truyền thống Trung Hoa | y phục tông màu truyền thống Trung Hoa、trang phục tinh xảo |
| Chất liệu | Lụa + thêu + vải ánh ngọc trai | chất lụa、chi tiết thêu |
| Chất cảm | Vân bề mặt bắt buộc siêu rõ | chất vải rõ ràng、vân bề mặt siêu rõ |
| Vai | Khăn choàng lụa/vân kiên/trang trí | vân kiên lộng lẫy、có trang trí trên vai |
| Lớp lang | Mặc nhiều lớp chồng, lớp lang rõ ràng | mặc nhiều lớp chồng、lớp lang rõ ràng |

### Ma trận trang phục nam

| Phong cách | Áp dụng | Prompt |
|---|---|---|
| Y phục văn nhân sĩ tử | Thường ngày, thư phòng | y phục văn nhân sĩ tử、áo dài |
| Kình trang võ tướng | Chiến đấu, luyện võ | kình trang võ tướng、chiến bào |
| Triều phục | Triều đường, điển lễ | triều phục、lễ phục trang trọng |
| Thường phục tiện dụng | Thư giãn, riêng tư | thường phục tiện dụng、phong cách giản dị |
| Lễ phục | Trang trọng, khánh điển | lễ phục、xa hoa tinh xảo |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức đầu | Lộng lẫy tinh xảo, không sơ sài | trang sức đầu lộng lẫy、châu thúy đầy đầu |
| Trang sức tai | Tua rua buông rủ/khuyên ngọc | khuyên tai tua rua、khuyên ngọc buông rủ |
| Trang sức cổ | Anh lạc/vòng cổ | anh lạc lộng lẫy、vòng cổ tinh xảo |
| Trang sức eo | Cung điều/ngọc bội | cung điều phiêu dật、ngọc bội bên hông |
| Trang sức tay | Vòng ngọc/xuyến cánh tay | vòng ngọc trong suốt、xuyến cánh tay tinh xảo |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Mũ tóc | Mũ ngọc/mũ vàng, tinh xảo | mũ ngọc cài tóc |
| Đai lưng | Đai bản rộng/thắt lưng da | đai bản rộng、chất liệu rõ ràng |
| Ngọc bội | Trong suốt ôn nhuận | ngọc bội bên hông |
| Binh khí | Kiếm/quạt/sáo (tùy chọn) | trường kiếm bên hông、quạt xếp che nửa |

---

## 7. Tra nhanh tổ hợp phục trang hóa trang

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Thường ngày trong khuê phòng | Trang điểm thanh nhã | Xõa tóc/buộc nửa | Váy dài cổ trang | Vừa phải |
| Lần đầu gặp gỡ | Trang điểm thanh nhã | Buộc nửa/búi đọa mã | Váy dài cổ trang | Vừa đến nhiều |
| Tương tác lãng mạn | Trang điểm đào hoa lãng mạn | Buộc nửa/búi đọa mã | Váy dài cổ trang/trang phục nhẹ | Vừa phải |
| Xuất hiện trang trọng | Trang điểm quý khí cung đình | Búi cao vân mấn | Lễ phục cung đình | Cực rườm rà |
| Riêng tư ban đêm | Trang điểm thanh nhã/đào hoa | Xõa tóc/búi đọa mã | Y phục ngủ | Cực tối giản |
| Điển lễ đại hôn | Trang điểm đại hôn | Búi cao vân mấn | Hôn phục | Cực rườm rà |
| Luyện võ, hành động | Trang điểm mộc (cực nhạt) | Đuôi ngựa buộc cao | Thường phục nhẹ | Đơn giản |

---

> **🔍 Quy tắc suy đoán cho bối cảnh chưa được liệt kê**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy đoán theo gen cốt lõi của phong cách này:
>
> | Chiều suy đoán | Gen render 3D Quốc phong |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm thanh nhã; cung đình/quyền lực/trang trọng→trang điểm quý khí cung đình; rung động/ngọt ngào→trang điểm đào hoa lãng mạn; đại hôn/điển lễ→trang điểm đại hôn; lễ hội tụ họp→trang điểm lễ hội khánh điển |
> | Kiểu tóc | Thường ngày/trong khuê phòng→buộc nửa hoặc búi đọa mã; cung đình/trang trọng→búi cao vân mấn; riêng tư/ban đêm→xõa tóc; luyện võ/hành động→đuôi ngựa buộc cao |
> | Trang phục | Lấy cổ trang làm tông; bối cảnh giàu cảm xúc→váy dài phiêu dật; quyền lực/trang trọng→lễ phục cung đình; hành động→thường phục nhẹ; chất liệu PBR luôn giữ nguyên |
> | Độ rườm rà của phụ kiện | Thường ngày→vừa phải; trang trọng/cung đình→cực rườm rà (trang sức tóc vàng bạc + anh lạc + ngọc bội); riêng tư→cực tối giản; hành động→đơn giản |
> | Chuẩn chất liệu | Chất liệu PBR + ánh sáng đẳng cấp điện ảnh luôn khóa cứng; độ khối và độ bóng được ưu tiên hơn cảm giác trang trí phẳng |

## 8. Quy phạm bản vẽ bốn hướng nhìn

> Sau khi chồng phục trang hóa trang phái sinh vẫn phải xuất bản vẽ bốn hướng nhìn, để bảo đảm phục trang hóa trang nhất quán ở mọi góc.

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, toàn cảnh mặt trước trang phục | front view、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang mặt bên của trang phục | side view、profile、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Trang sức tóc sau gáy/trang phục phía lưng/đuôi tóc rõ ràng | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Màu xám mộc thuần #B8B8B8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (như trang điểm thanh nhã→điềm nhiên, trang điểm đào hoa→hàm tiếu), chỉ giới hạn ở vi biểu cảm trên mặt, không liên quan động tác cơ thể |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/trang sức tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung đầu ra | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng mục cấm, phương án phái sinh, đề xuất đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên nhân vật phái sinh **không bao gồm mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung tự sự nào về bối cảnh/môi trường/thời tiết/phông nền (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không bao gồm bất kỳ tương tác với đạo cụ nào**, không xuất ô/kiếm/quạt/sách/đèn lồng/chén rượu hay vật cầm tay, vật tương tác khác (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm thay đổi tư thế | **Không đổi tư thế của mẫu nền**, không xuất đi/ngoái nhìn/giơ tay/nghiêng người/chạy hay bất kỳ động tác, thay đổi dáng vẻ nào, giữ tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được, không cần tiêu đề, bảng, giải thích, đối chiếu phương án |

### Chồng phục trang hóa trang đầy đủ (bốn hướng nhìn)

Lấy ảnh hình ảnh cơ bản của nhân vật làm ảnh nền，chồng phục trang hóa trang bằng img2img，
phong cách render 3D，tạo mô hình độ chính xác cao，chất liệu PBR，3D Quốc phong，ánh sáng đẳng cấp điện ảnh，
bản vẽ bốn hướng nhìn của nhân vật {giới tính} cổ trang，render 3D，tạo mô hình độ chính xác cao，8K，siêu trung thực
character design sheet, character turnaround,
giữ nguyên gương mặt của hình ảnh cơ bản，{khí chất tổng thể},
【L1·Trang điểm】quyết định theo manh mối người dùng：{trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}；dùng {phong cách trang điểm}, render chất liệu PBR, {trang điểm mày}, {trang điểm mắt}, {trang điểm môi},
【L2·Kiểu tóc】{loại tạo hình}, sợi tóc rõ độ chính xác cao, {mô tả trang sức tóc},
【L3+L4·Trang phục】{màu chính}{kiểu dáng}, {chất liệu}, {chế tác trang trí}, chất vải rõ ràng, render chất liệu PBR,
【L5·Phụ kiện】{trang sức đầu}, {trang sức tai}, {trang sức cổ}, {trang sức eo},
xếp cạnh nhau từ trái sang phải trong cùng khung hình：chân dung cận+hình chính diện+hình nhìn nghiêng+hình nhìn sau,
đứng tự nhiên, phông nền màu xám mộc thuần, ánh sáng dịu đều, không bóng gắt,
nhất quán bốn hướng nhìn, mô hình 3D cổ trang rõ ràng, tạo mô hình độ chính xác cao rõ ràng,
trong hình không được có bất kỳ chữ nào

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc giống mẫu nền |
| R2 | Trang phục bắt buộc dùng "chất vải rõ ràng + render chất liệu PBR" |
| R3 | Phụ kiện nữ bắt buộc "lộng lẫy tinh xảo + chế tác tinh vi" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận+hình chính diện+hình nhìn nghiêng+hình nhìn sau) |
| R6 | Bắt buộc chỉ định "phông nền màu xám mộc thuần" |
| R7 | Bắt buộc chỉ định "nhất quán bốn hướng nhìn" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/mục cấm/phương án phái sinh/đề xuất đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên nhân vật phái sinh không dính tới bối cảnh/môi trường/thời tiết/tự sự phông nền, bối cảnh là loại tài nguyên độc lập |
| R10 | **Cấm tương tác với đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (ô/kiếm/quạt/sách...), đạo cụ là loại tài nguyên độc lập |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của mẫu nền, cấm mọi thay đổi động tác/dáng vẻ/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết** — phân tích manh mối gương mặt của người dùng trước, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần hóa trang** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm được kiểm soát** — dù có trang điểm vẫn phải kiềm chế, không được xuất hiện trang điểm đậm kiểu hiện đại/hiệu ứng trang điểm màu phóng đại |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được nâng trang điểm nền lên mức mạnh hơn |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Gương mặt bị lệch sau khi chồng lớp |
| X2 | Phụ kiện quá đơn giản/hiện đại hóa (nữ) |
| X3 | Phong cách trang điểm/trang phục xung khắc nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc là màu thuần) |
| X5 | Phục trang hóa trang không nhất quán giữa bốn hướng nhìn |
| X6 | Xuất bất kỳ nội dung nào ngoài prompt (bảng/phương án/đề xuất/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên nhân vật phái sinh (cảnh phố/cảnh mưa/trong nhà/đường phố/thời tiết hay yếu tố môi trường khác) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "mục cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác với đạo cụ nào (cầm ô/kiếm/quạt/sách/đèn lồng/chén rượu hay vật khác) |
| X10 | Đổi tư thế của mẫu nền (mô tả động tác như đi/ngoái nhìn/giơ tay/nghiêng người/chạy/cúi đầu/ngước nhìn) |
| X11 | Thêm mô tả gắn kết biểu cảm với tư thế (lối viết tự sự như "nghiêng người 45° bước đi khóe môi cong nhẹ") |
| X12 | Áp thẳng một kiểu trang điểm cố định mà không phân tích manh mối của người dùng |
| X13 | Sai lầm giữ mặt mộc, khiến tài nguyên phái sinh thiếu phần hóa trang đáng có |
| X14 | Nâng nhầm cấp trang điểm chỉ vì từ về đạo cụ/bối cảnh/động tác, dẫn tới quyết định sai về cường độ hóa trang |
