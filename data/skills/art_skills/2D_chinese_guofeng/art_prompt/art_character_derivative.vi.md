---
name: art_character_derivative
description: Tạo tài nguyên phái sinh nhân vật · Sổ tay ràng buộc
metaData: art_skills
---

# Tạo tài nguyên phái sinh nhân vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc hoàn toàn giống bản nền, cấm lệch gương mặt
2. **Tư thế không đổi** — giữ tư thế đứng tự nhiên của bản nền, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mô tả từng lớp độc lập, tiện thay thế theo lớp (đổi trang phục không đổi trang điểm)
4. **Phong cách thống nhất** — mọi yếu tố trang phục - trang điểm đều theo cùng một hệ thẩm mỹ
5. **Chất lượng không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn bản nền
6. **Chỉ trong phạm vi trang phục - trang điểm** — chỉ chồng thêm trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản nền | Bản nền tạo hình gốc, không sửa |
| L1 | Trang điểm (lớp quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định mức "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Kiểu tóc và tạo hình | Búi tóc/búi cao/tết tóc + phụ kiện tóc |
| L3 | Trung y/lớp mặc trong | Thay cho trung y nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Hoa phục cổ phong/lễ phục/thường phục... |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo/tay |

> **Ranh giới phạm vi**: tài nguyên phái sinh nhân vật chỉ gồm các lớp L0–L5 (trang phục, trang điểm, tạo hình), không gồm đạo cụ (ô/kiếm/quạt/sách/đèn lồng và các vật cầm tay khác), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...), tư thế động tác (đi/ngoảnh lại/giơ tay...). Những thứ đó thuộc phạm vi của các loại tài nguyên khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ bản nền sang tạo hình phái sinh (mấu chốt)

> Bản nền nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định đi vào quy trình trang điểm - tạo hình. Hệ thống phải dựa vào manh mối người dùng cung cấp để phân tích nhu cầu tạo hình, và quyết định mức độ giữa trang điểm nền, trang điểm nhẹ và trang điểm trang trọng, chứ không giữ nguyên mặt mộc.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối của người dùng: từ chỉ trạng thái gương mặt, từ chỉ cảm xúc, từ chỉ cường độ | Bản tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không phải căn cứ để trang điểm | Tránh phán đoán sai |
| S3 | Khớp với ma trận phong cách trang điểm và đưa ra bậc cường độ | Trang điểm nền / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (cách áp dụng)

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn vào gương mặt | Chỉ đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Trang điểm nền |
| Manh mối gương mặt nhẹ | Dịu dàng, hàm tiếu, mi khẽ rung, sắc mặt tươi lên chút ít | Trang điểm nhẹ (cực nhạt) |
| Manh mối thường ngày rõ ràng | Thường ngày, ra ngoài, thư giãn | Trang điểm nền (tự nhiên trong trẻo) |
| Manh mối nghi lễ trang trọng rõ ràng | Đại hôn, đại lễ, dịp quan trọng | Trang điểm trang trọng (tinh xảo hoa quý) |

> Nguyên tắc phán định: mọi tài nguyên phái sinh đều phải có trang điểm - tạo hình; xem manh mối gương mặt trước để định cường độ và phong cách, thay đổi về đạo cụ, bối cảnh, tư thế không được tự nó đẩy cường độ trang điểm lên.

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh áp dụng | Prompt cốt lõi |
|---|---|---|
| Trang điểm thanh nhã mộc mạc | Thường ngày, lần đầu gặp, khuê phòng | trang điểm thanh nhã、mày ngài kẻ nhạt、mặt mộc thanh tú |
| Trang điểm cung đình quý phái | Cung đình, trang trọng, quyền lực | trang điểm tinh xảo、dáng mày sắc nét、màu môi hồng thắm |
| Trang điểm đào hoa lãng mạn | Hẹn hò, rung động, ngọt ngào | trang điểm đào hoa、đuôi mắt ửng hồng、màu môi căng mọng |
| Trang điểm đại hôn lộng lẫy | Đại hôn, đại lễ | trang điểm đậm lộng lẫy、môi son mắt phượng |
| Lễ hội khánh điển | Khánh điển, tụ họp | màu sắc tươi sáng、trang điểm màu phấn |

### Nền da dùng chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Tô màu phẳng kiểu cel, trong sáng tự nhiên | chất cel、bóng tự nhiên、chất mềm mại |
| Độ trắng | Tông hồng trắng, trong trẻo chứ không trắng bệch | tông hồng trắng、trắng trong |
| Ánh trong | Cảm giác ánh sáng dịu từ trong tỏa ra | ánh sáng từ bên trong、da trong sáng phát quang |
| Cấm | Lì mờ/trắng bệch/như sáp/bóng dầu/cháy sáng | — |

### Chi tiết trang điểm nền (bậc mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lông mày | Tỉa nhẹ theo dáng mày của bản nền, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch |
| Mắt | Điểm tô vùng mắt cực nhạt, nhấn vào sự trong trẻo và có thần | mắt trong trẻo、phấn mắt cực nhạt |
| Gò má | Nâng sắc mặt cực nhạt, má hồng màu phấn | sắc má tự nhiên、má hồng màu phấn |
| Môi | Đánh nhẹ hồng nhạt hoặc chu sa, giữ tiết chế | màu môi tự nhiên căng mượt、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có trang điểm, nhưng cảm giác trang điểm rất nhẹ | trang điểm nền、cảm giác trang điểm tự nhiên、chất mềm mại |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Tô màu phẳng kiểu cel, trắng trong, sạch sẽ tự nhiên | chất cel、trắng trong、bóng tự nhiên |
| Nguyên tắc | Giả mặt mộc — nhìn như không trang điểm nhưng da cực đẹp | giả mặt mộc、da đẹp trời cho |
| Lông mày | Mày rậm tự nhiên, không kẻ mày | mày kiếm tự nhiên、dáng mày anh tuấn |
| Màu môi | Sắc máu tự nhiên, hơi căng mượt | màu môi tự nhiên、có sắc máu |

---

## 4. Ràng buộc kiểu tóc và tạo hình (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Áp dụng | Prompt |
|---|---|---|---|
| Búi cao vân mấn | Búi cao vấn tóc + phụ kiện tóc | Cung đình, trang trọng | búi cao vân mấn、búi tóc tinh xảo |
| Búi hai vòng | Hai vòng đối xứng, thiếu nữ | Nhân vật trẻ | búi hai vòng、phong cách thiếu nữ |
| Búi đọa mã | Búi thấp lệch bên, uể oải | Thường ngày, thư giãn | búi đọa mã、búi lệch uể oải |
| Tóc xõa | Tóc dài xõa hết, tự nhiên | Khuê phòng, riêng tư | tóc dài buông xõa、buông rủ tự nhiên |
| Búi cao đuôi ngựa | Buộc cao gọn gàng | Luyện võ, hành động | đuôi ngựa buộc cao、gọn gàng dứt khoát |
| Tóc buộc nửa | Buộc nửa phần đỉnh + tóc buông phía sau | Thường ngày, ra ngoài | búi vân buộc nửa、tóc buông tự nhiên |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Lộng lẫy tinh xảo, ăn khớp với trang phục | phụ kiện tóc lộng lẫy、chế tác tinh xảo |
| Chất liệu | Vàng bạc + châu ngọc + tua rua | trâm vàng bạc、châu thúy đầy đầu |
| Kỹ nghệ | Đường nét tinh tế, chi tiết rõ ràng | kỹ nghệ tinh xảo、chạm khắc tinh tế |

### Các kiểu tạo hình nam

| Tạo hình | Áp dụng | Prompt |
|---|---|---|
| Búi tóc bán quan | Thường ngày, văn nhân | búi tóc bán quan、trâm ngọc cài tóc |
| Toàn quan búi cao | Trang trọng, triều đình | toàn quan búi cao、mũ ngọc cài tóc |
| Tóc xõa ngang vai | Riêng tư, bị thương | tóc xõa ngang vai、tóc dài như mực |
| Búi cao đuôi ngựa | Chiến đấu, luyện võ | tóc chiến buộc cao、đuôi ngựa gọn gàng |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Áp dụng | Prompt |
|---|---|---|---|
| Váy dài cổ trang | Váy dài, phiêu dật | Thường ngày, khuê phòng | váy dài cổ trang、xiêm y phiêu dật |
| Lễ phục cung đình | Lễ phục, lộng lẫy | Cung đình, trang trọng | lễ phục cung đình、váy áo hoa quý |
| Thường phục nhẹ nhàng | Áo ngắn, nhẹ nhàng | Hành động, luyện võ | thường phục nhẹ nhàng、áo ngắn |
| Y phục ngủ | Áo lót the mỏng, màu trơn | Trong phòng, ban đêm | y phục ngủ、rộng rãi thoải mái |
| Hỉ phục đại hôn | Phượng quan hà bí, hồng y nhiều lớp | Hôn lễ | phượng quan hà bí、hồng thường nhiều lớp |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Mặc định lấy tông màu truyền thống Trung Hoa | y phục tông màu truyền thống Trung Hoa、trang phục tinh xảo |
| Chất liệu | Lụa + thêu + vải ánh ngọc trai | chất lụa、chi tiết thêu |
| Chất cảm | Vân vải bắt buộc siêu rõ | chất vải rõ ràng、vân vải siêu rõ |
| Vai | Phi bạch/vân kiên/trang trí | vân kiên lộng lẫy、trên vai có trang trí |
| Lớp lang | Mặc nhiều lớp chồng nhau, lớp lang rõ ràng | mặc nhiều lớp chồng、lớp lang rõ ràng |

### Ma trận trang phục nam

| Phong cách | Áp dụng | Prompt |
|---|---|---|
| Y phục văn nhân sĩ tử | Thường ngày, thư phòng | y phục văn nhân sĩ tử、áo dài |
| Kình trang võ tướng | Chiến đấu, luyện võ | kình trang võ tướng、chiến bào |
| Triều phục | Triều đình, đại lễ | triều phục、lễ phục trang trọng |
| Thường phục tiện y | Thư giãn, riêng tư | thường phục tiện y、phong cách giản dị |
| Lễ phục | Trang trọng, khánh điển | lễ phục、hoa quý tinh xảo |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức đầu | Lộng lẫy tinh xảo, không sơ sài | trang sức đầu lộng lẫy、châu thúy đầy đầu |
| Trang sức tai | Tua rua rủ/ngọc đang | khuyên tai tua rua、ngọc đang buông rủ |
| Trang sức cổ | Anh lạc/vòng cổ | anh lạc lộng lẫy、vòng cổ tinh xảo |
| Trang sức eo | Cung thao/ngọc bội | cung thao phiêu dật、ngọc bội bên hông |
| Trang sức tay | Vòng ngọc/xuyến cánh tay | vòng ngọc trong suốt、xuyến cánh tay tinh xảo |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Mũ tóc | Mũ ngọc/mũ vàng, tinh xảo | mũ ngọc cài tóc |
| Đai lưng | Đai lưng bản rộng/đai da | đai lưng bản rộng、chất liệu rõ ràng |
| Ngọc bội | Trong suốt ôn nhuận | ngọc bội bên hông |
| Binh khí | Kiếm đeo/quạt/sáo (tùy chọn) | trường kiếm bên hông、quạt xếp che nửa |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Khuê phòng thường ngày | Trang điểm thanh nhã mộc mạc | Tóc xõa/tóc buộc nửa | Váy dài cổ trang | Vừa phải |
| Lần đầu gặp gỡ | Trang điểm thanh nhã mộc mạc | Tóc buộc nửa/búi đọa mã | Váy dài cổ trang | Vừa đến nhiều |
| Tương tác lãng mạn | Trang điểm đào hoa lãng mạn | Tóc buộc nửa/búi đọa mã | Váy dài cổ trang/đồ nhẹ nhàng | Vừa phải |
| Xuất hiện trang trọng | Trang điểm cung đình quý phái | Búi cao vân mấn | Lễ phục cung đình | Cực rườm rà |
| Đêm riêng tư | Trang điểm thanh nhã/đào hoa | Tóc xõa/búi đọa mã | Y phục ngủ | Cực tối giản |
| Đại lễ đại hôn | Trang điểm đại hôn lộng lẫy | Búi cao vân mấn | Hỉ phục | Cực rườm rà |
| Luyện võ hành động | Trang điểm mộc (cực nhạt) | Tóc buộc đuôi ngựa | Thường phục nhẹ nhàng | Đơn giản |

---

> **🔍 Quy tắc suy luận cho cảnh chưa có trong bảng**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen anime Quốc phong |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm thanh nhã mộc mạc; có từ khóa lễ hội/nghi lễ/trang trọng → trang điểm cung đình quý phái; có từ ngọt ngào/rung động → trang điểm đào hoa |
> | Kiểu tóc | Thường ngày/khuê phòng → tóc buộc nửa hoặc búi đọa mã; trang trọng/xuất hiện → búi cao vân mấn; riêng tư/ban đêm → tóc xõa; hành động → tóc buộc đuôi ngựa |
> | Trang phục | Cảnh tình cảm/thường ngày → váy dài cổ trang (mềm mại phiêu dật); quyền lực/trang trọng → lễ phục cung đình; hành động/giao đấu → thường phục nhẹ nhàng |
> | Độ rườm rà của phụ kiện | Thường ngày → vừa phải; trang trọng → cực rườm rà (phụ kiện tóc châu thúy + anh lạc + trang sức eo); riêng tư/thư giãn → đơn giản; hành động → đơn giản |
> | Xu hướng tông màu | Lấy màu truyền thống Trung Hoa làm neo (sương bạch/nguyệt bạch/chu sa/chàm); cảnh đêm/riêng tư → giảm bão hòa; lễ hội → đỏ ấm + vàng kim |

## 8. Quy phạm bản vẽ bốn hướng nhìn

> Sau khi chồng lớp trang phục - trang điểm phái sinh, vẫn phải xuất bản vẽ bốn hướng nhìn, bảo đảm phần trang phục - trang điểm - tạo hình nhất quán ở mọi góc.

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, thấy trọn mặt trước trang phục | front view、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn nghiêng | side view、profile、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Phụ kiện tóc sau gáy/trang phục phía lưng/đuôi tóc rõ ràng | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Nguyệt bạch thuần sắc #E8EAF5 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (như trang điểm thanh nhã → điềm đạm, trang điểm đào hoa → hàm tiếu), chỉ giới hạn ở vi biểu cảm trên gương mặt, không dính đến động tác cơ thể |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng cứng |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/phụ kiện tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng mục cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên phái sinh nhân vật **không chứa mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung tự sự nào về bối cảnh/môi trường/thời tiết/phông nền (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không chứa bất kỳ tương tác đạo cụ nào**, không xuất ô/kiếm/quạt/sách/đèn lồng/chén rượu hay vật cầm tay, vật tương tác khác (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm đổi tư thế | **Không đổi tư thế của bản nền**, không xuất đi/ngoảnh lại/giơ tay/nghiêng người/chạy hay bất kỳ động tác, thay đổi dáng người nào, giữ tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được, không cần tiêu đề, bảng biểu, giải thích, so sánh phương án |

### Chồng lớp trang phục - trang điểm đầy đủ (bốn hướng nhìn)

lấy ảnh tạo hình gốc của nhân vật làm ảnh nền，img2img chồng thêm trang phục - trang điểm - tạo hình，
anime Quốc phong，thẩm mỹ Tân Quốc triều，render anime kiểu Nhật，tô màu phẳng kiểu cel，nét vẽ tinh tế，
bản vẽ bốn hướng nhìn của nhân vật {giới tính} cổ phong，anime Quốc phong，tô màu cel，8K，siêu trung thực
character design sheet, character turnaround,
giữ nguyên gương mặt của tạo hình gốc，{khí chất tổng thể},
【L1·Trang điểm】quyết định theo manh mối của người dùng：{trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}；dùng {phong cách trang điểm}, tô màu phẳng kiểu cel, {trang điểm mày}, {trang điểm mắt}, {trang điểm môi},
【L2·Kiểu tóc】{kiểu tạo hình}, sợi tóc tinh tế rõ ràng, {mô tả phụ kiện tóc},
【L3+L4·Trang phục】{màu chính}{kiểu dáng}, {chất liệu}, {kỹ nghệ trang trí}, chất vải rõ ràng, tô màu phẳng kiểu cel,
【L5·Phụ kiện】{trang sức đầu}, {trang sức tai}, {trang sức cổ}, {trang sức eo},
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau,
đứng tự nhiên, phông nền nguyệt bạch thuần sắc, ánh sáng dịu đều, không bóng cứng,
bốn hướng nhìn nhất quán, tạo hình anime Quốc phong rõ ràng, đường nét tinh tế rõ ràng,
trong hình không được có bất kỳ chữ nào

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc khớp với bản nền |
| R2 | Trang phục bắt buộc dùng "chất vải rõ ràng + tô màu phẳng kiểu cel" |
| R3 | Phụ kiện nữ bắt buộc "lộng lẫy tinh xảo + kỹ nghệ tinh vi" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất về phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau) |
| R6 | Bắt buộc chỉ định "phông nền nguyệt bạch thuần sắc" |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/mục cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên phái sinh nhân vật không dính đến bối cảnh/môi trường/thời tiết/tự sự phông nền, bối cảnh là loại tài nguyên riêng |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (ô/kiếm/quạt/sách...), đạo cụ là loại tài nguyên riêng |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của bản nền, cấm mọi thay đổi động tác/dáng người/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết định** — phân tích manh mối gương mặt của người dùng trước, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần trang điểm - tạo hình** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm được kiểm soát** — dù có trang điểm cũng phải tiết chế, không được xuất hiện trang điểm đậm kiểu hiện đại/hiệu ứng trang điểm màu cường điệu |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ để nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được đẩy trang điểm nền lên mức trang điểm mạnh hơn |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Gương mặt bị lệch sau khi chồng lớp |
| X2 | Phụ kiện quá đơn giản/bị hiện đại hóa (nữ) |
| X3 | Phong cách trang điểm/trang phục xung đột nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc thuần sắc) |
| X5 | Trang phục - trang điểm - tạo hình không nhất quán giữa bốn hướng nhìn |
| X6 | Xuất bất kỳ nội dung nào ngoài prompt (bảng biểu/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên phái sinh nhân vật (cảnh phố/cảnh mưa/trong nhà/đường phố/thời tiết và các yếu tố môi trường khác) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "mục cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác đạo cụ nào (cầm ô/kiếm/quạt/sách/đèn lồng/chén rượu và các vật khác) |
| X10 | Thay đổi tư thế của bản nền (đi/ngoảnh lại/giơ tay/nghiêng người/chạy/cúi đầu/ngước nhìn và các mô tả động tác khác) |
| X11 | Thêm mô tả liên kết biểu cảm với tư thế (lối viết tự sự như "nghiêng người 45° bước đi, khóe môi khẽ cong") |
| X12 | Áp thẳng một kiểu trang điểm cố định mà chưa phân tích manh mối của người dùng |
| X13 | Giữ mặt mộc một cách sai lầm, khiến tài nguyên phái sinh thiếu phần trang điểm - tạo hình đáng lẽ phải có |
| X14 | Nâng cấp trang điểm nhầm chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác, dẫn đến quyết định sai về cường độ trang điểm - tạo hình |
