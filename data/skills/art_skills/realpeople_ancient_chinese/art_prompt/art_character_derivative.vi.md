# Sinh tài nguyên phái sinh nhân vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt bản mẫu gốc, cấm để gương mặt lệch đi
2. **Tư thế không đổi** — giữ nguyên tư thế đứng tự nhiên của bản mẫu gốc, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mỗi lớp mô tả độc lập, tiện thay thế theo lớp (đổi trang phục không đổi trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố phục trang hóa trang đều phục tùng cùng một hệ thẩm mỹ
5. **Chất liệu không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn bản mẫu gốc
6. **Chỉ thuộc phạm trù phục trang hóa trang** — chỉ chồng thêm trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản mẫu gốc | Bản mẫu tạo hình cơ bản, không sửa |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi mới quyết định cường độ "trang điểm cơ bản / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Kiểu tóc và tạo kiểu | Búi tóc/buộc tóc/tết tóc + trang sức cài tóc |
| L3 | Trung y/lớp trong | Thay cho áo trung y cơ bản màu trắng |
| L4 | Áo ngoài/trang phục chính | Áo tay rộng/áo trực cứ/đại xưởng... |
| L5 | Phụ kiện | Trang sức cài đầu/khuyên tai/trang sức cổ/trang sức eo/trang sức tay |

> **Ranh giới phạm vi**: tài nguyên phái sinh nhân vật chỉ gồm các lớp L0–L5 (phục trang hóa trang tạo kiểu), không gồm đạo cụ (ô/kiếm/quạt/sách/đèn lồng... các vật cầm tay), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...), tư thế động tác (đi lại/ngoảnh lại/nhấc tay...). Những thứ đó thuộc phạm vi của các loại tài nguyên khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ bản mẫu gốc sang trang điểm tạo kiểu phái sinh (then chốt)

> Bản mẫu gốc của nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định đi vào quy trình trang điểm tạo kiểu. Hệ thống phải căn cứ manh mối người dùng cung cấp để phân tích nhu cầu trang điểm, và quyết định cường độ giữa trang điểm cơ bản, trang điểm nhẹ, trang điểm trang trọng, chứ không giữ mặt mộc.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối của người dùng: từ tả trạng thái gương mặt, từ tả cảm xúc, từ tả cường độ | Hình thành bản tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không được dùng làm căn cứ trang điểm | Ngăn phán đoán sai |
| S3 | Khớp ma trận phong cách trang điểm và đưa ra bậc cường độ | Trang điểm cơ bản / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thực thi)

| Loại manh mối | Manh mối tiêu biểu | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn mạnh gương mặt rõ rệt | Chỉ đổi trang phục/kiểu tóc, không nhấn mạnh cảm xúc và trạng thái | Trang điểm cơ bản |
| Manh mối gương mặt nhẹ | Dịu dàng, hàm tiếu, lông mi khẽ rung, sắc mặt nhỉnh lên chút | Trang điểm nhẹ (cực nhạt) |
| Manh mối yếu bệnh rõ ràng | Sắc mặt nhợt nhạt, màu môi cực nhạt, dưới mắt hơi ửng đỏ | Trang điểm lê hoa yếu bệnh (trang điểm nhẹ) |
| Manh mối nghi lễ trang trọng rõ ràng | Thịnh trang, điển lễ, xuất hiện hoa quý | Trang điểm trang trọng (có kiểm soát) |

> Nguyên tắc phán định: mọi tài nguyên phái sinh đều phải có trang điểm tạo kiểu; xem manh mối gương mặt trước để định cường độ và phong cách, thay đổi về đạo cụ, bối cảnh, tư thế không được tự nó đẩy cường độ trang điểm lên.

### Ma trận phong cách trang điểm nữ

| Phong cách | Bối cảnh phù hợp | Prompt cốt lõi |
|---|---|---|
| Trang điểm mộc thanh nhã | Thường ngày, gặp lần đầu, trong khuê phòng | trang điểm thanh nhã、mày ngài kẻ nhạt、mặt mộc trong trẻo |
| Trang điểm lạnh diễm sương | Trang trọng, đối đầu, quyền lực | trang điểm lạnh diễm、mày mắt sắc lẻm、môi mỏng lạnh lùng |
| Trang điểm đào hoa dịu dàng | Ngọt ngào, mập mờ, rung động | trang điểm đào hoa、đuôi mắt hơi ửng、màu môi căng mọng |
| Trang điểm lê hoa yếu bệnh | Bị thương, suy nhược | sắc mặt nhợt nhạt、màu môi cực nhạt、dưới mắt hơi ửng đỏ |
| Trang điểm phượng hoa quý | Đại hôn, thịnh trang | trang điểm đậm lộng lẫy、môi son mắt phượng |

### Nền da chung (mọi kiểu trang điểm dùng chung)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất da | Da căng bóng, trong sáng tự nhiên | da căng bóng、da sứ kem、luminous skin |
| Độ trắng | Da trắng lạnh, trong trẻo không trắng bệch | da sữa、milky white skin |
| Ánh sáng từ bên trong | Cảm giác ánh sáng dịu tỏa từ trong ra | ánh sáng trong veo từ bên trong、da trong veo phát sáng |
| Cấm | Lì/trắng bệch/như sáp/bóng dầu/cháy sáng | — |

### Chi tiết trang điểm cơ bản (bậc mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chân mày | Tỉa nhẹ theo dáng mày của bản mẫu gốc, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch sẽ |
| Mắt | Điểm tô vùng mắt cực nhạt, nhấn vào sự trong trẻo và có thần | vùng mắt trong trẻo、kẻ mí trong cực nhạt |
| Gò má | Nâng sắc mặt cực nhạt, không được dồn màu lộ rõ | sắc mặt gò má tự nhiên、nâng sắc mặt rất nhẹ |
| Môi | Tô hồng nude hoặc hồng nhạt, giữ mức kiềm chế | màu môi ẩm mượt tự nhiên、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có trang điểm, nhưng cảm giác trang điểm rất nhẹ | trang điểm cơ bản、cảm giác trang điểm giả mộc、chỉnh sửa tự nhiên |

### Theo từng vùng (lấy trang điểm mộc thanh nhã làm ví dụ)

| Vùng | Ràng buộc | Prompt |
|---|---|---|
| Lớp nền | Mỏng nhẹ trong trẻo, căng bóng ánh nhẹ | lớp nền mỏng nhẹ、da kem căng bóng |
| Trang điểm mày | Mày viễn sơn/mày lá liễu, quét nhạt màu nâu xám | mày đại viễn sơn、mày ngài kẻ nhạt |
| Trang điểm mắt | Phấn mắt cực nhạt, kẻ mí trong, lông mi thon dài | trang điểm mắt trong trẻo、lông mi thon dài |
| Má hồng | Phấn mỏng cực nhạt, quét nhẹ vùng má | má hồng cực nhạt、phấn mỏng hơi ửng |
| Trang điểm môi | Hồng nhạt căng mọng, ánh nhẹ | màu môi hồng nhạt căng mọng |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Da kem căng bóng, trắng trong, thoáng sạch tự nhiên | da căng bóng、da kem、luminous skin |
| Nguyên tắc | Giả mộc — nhìn như không trang điểm nhưng da cực đẹp | giả mộc、da đẹp trời cho |
| Chân mày | Mày rậm tự nhiên, không kẻ mày | mày kiếm tự nhiên、dáng mày anh tuấn |
| Màu môi | Sắc máu tự nhiên, hơi ẩm | màu môi tự nhiên、có sắc máu |

---

## 4. Ràng buộc kiểu tóc và tạo kiểu (L2)

### Các kiểu tạo kiểu cho nữ

| Tạo kiểu | Mô tả | Phù hợp | Prompt |
|---|---|---|---|
| Búi vân nửa vấn | Búi tóc trên đỉnh + tóc buông phía sau | Thường ngày, ra ngoài | búi vân nửa vấn、tóc xanh vấn nửa |
| Búi phi tiên | Búi cao hất lên, phiêu dật | Tiên cảnh, ra mắt | búi phi tiên、búi cao hất lên |
| Búi đọa mã | Búi thấp lệch bên, uể oải | Riêng tư, mập mờ | búi đọa mã、búi lệch uể oải |
| Búi song hoàn | Hai búi đối xứng, thiếu nữ | Nhân vật trẻ | búi song hoàn、búi đôi thiếu nữ |
| Xõa hoàn toàn | Tóc dài xõa hết, kèm trang sức cài tóc đơn giản | Bị thương, sa sút | tóc dài buông xõa、tóc xanh như thác |
| Đuôi ngựa buộc cao | Buộc cao gọn gàng | Luyện võ, hành động | tóc buộc đuôi ngựa cao、gọn gàng dứt khoát |

### Trang sức cài tóc của nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Cực phồn thực, đồng bộ với trang phục | trang sức cài tóc cực phồn thực、lộng lẫy tinh xảo |
| Chất liệu | Kim loại + châu ngọc + tua rua | tua rua chỉ vàng、châu thúy đầy đầu |
| Kỹ nghệ | Kỹ nghệ bậc thầy, siêu tinh xảo | kỹ nghệ bậc thầy、chạm khắc tỉ mỉ |

### Các kiểu tạo kiểu cho nam

| Tạo kiểu | Phù hợp | Prompt |
|---|---|---|
| Buộc tóc bán quan | Thường ngày, văn nhân | buộc tóc bán quan、trâm ngọc cài tóc |
| Toàn quan buộc cao | Trang trọng, triều đường | toàn quan buộc cao、mão ngọc cài tóc |
| Tóc xõa phủ vai | Riêng tư, bị thương | tóc xõa phủ vai、tóc dài như mực |
| Đuôi ngựa chiến trận | Chiến đấu, luyện võ | tóc chiến buộc cao、đuôi ngựa gọn gàng |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Phù hợp | Prompt |
|---|---|---|---|
| Trang phục tiên khí phiêu dật | Áo tay rộng nhiều lớp, kiểu Ngụy Tấn | Thường ngày, tiên cảnh | áo tay rộng、áo nhiều lớp、vải áo bay bổng |
| Lễ phục đoan trang | Khúc cứ thâm y/nhu quần | Triều đường, yến tiệc | khúc cứ thâm y、đoan trang lộng lẫy |
| Thường phục nhẹ | Nhu quần tay hẹp/áo ngắn | Hành động, luyện võ | áo ngắn tay hẹp、nhẹ gọn dứt khoát |
| Y phục ngủ | Áo lụa mỏng mặc trong, màu trơn | Trong nhà, ban đêm | y phục ngủ màu trơn、rộng rãi thoải mái |
| Hôn phục đại hôn | Phượng quan hà bí, hồng phục xếp lớp | Hôn lễ | phượng quan hà bí、áo đỏ xếp lớp |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Trắng/nguyệt bạch/xám bạc là mặc định | y phục trắng tinh xảo、áo trắng như tuyết |
| Chất liệu | Dày dặn bay bổng + thêu thùa + vải ánh ngọc trai | vải áo dày dặn bay bổng、thêu ánh ngọc trai |
| Chất cảm | Vân bắt buộc cực kỳ sắc nét | chất vải rõ nét、vân cực kỳ sắc nét |
| Vai | Trang trí vai/khăn choàng/vân kiên | vân kiên lộng lẫy、trên vai có trang trí |
| Lớp lang | Mặc chồng nhiều lớp, lớp lang rõ ràng | mặc chồng nhiều lớp、lớp lang rõ ràng |

### Ma trận trang phục nam

| Phong cách | Phù hợp | Prompt |
|---|---|---|
| Nhã phục văn nhân | Thường ngày, thư phòng | áo dài tay rộng、áo màu nguyệt bạch |
| Kình phục võ tướng | Chiến đấu, luyện võ | kình phục tay hẹp、chiến phục màu sẫm |
| Huyền y đại xưởng | Xuất hiện, đi đêm | đại xưởng màu mực、áo choàng phần phật |
| Thường phục tiện dụng | Thư giãn, riêng tư | thường phục màu trơn、tiện phục giản dị |
| Lễ phục triều phục | Triều đường, điển lễ | triều phục trang trọng、lễ bào hoa quý |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức cài đầu | Cực phồn thực, không được sơ sài | trang sức cài đầu cực phồn thực、châu thúy đầy đầu |
| Khuyên tai | Tua rua buông/ngọc đang | khuyên tai tua rua、ngọc đang buông rủ |
| Trang sức cổ | Anh lạc/vòng cổ | anh lạc lộng lẫy、vòng cổ tinh xảo |
| Trang sức eo | Cung thao/ngọc bội | cung thao bay nhẹ、ngọc bội bên eo |
| Trang sức tay | Vòng ngọc/xuyến cánh tay | vòng ngọc trong veo、xuyến cánh tay tinh xảo |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Mão tóc | Mão ngọc/mão vàng, tinh xảo | mão ngọc cài tóc |
| Đai lưng | Đai lưng bản rộng/đai da | đai lưng bản rộng、chất liệu rõ nét |
| Ngọc bội | Trong veo ôn nhuận | ngọc bội bên eo |
| Binh khí | Kiếm/quạt/sáo (tùy chọn) | trường kiếm bên hông、quạt xếp che nửa |

---

## 7. Tra nhanh tổ hợp phục trang hóa trang

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Thường ngày trong khuê phòng | Trang điểm mộc thanh nhã | Búi vân nửa vấn | Trang phục tiên khí phiêu dật | Vừa phải |
| Gặp gỡ lần đầu | Trang điểm mộc thanh nhã | Nửa vấn/phi tiên | Trang phục tiên khí phiêu dật | Vừa đến nhiều |
| Tương tác ngọt ngào | Trang điểm đào hoa dịu dàng | Nửa vấn/đọa mã | Tiên khí/nhẹ gọn | Vừa phải |
| Ra mắt trang trọng | Trang điểm lạnh diễm sương | Búi phi tiên | Lễ phục đoan trang | Cực phồn thực |
| Mật đàm ban đêm | Thanh nhã/đào hoa | Xõa hết/đọa mã | Y phục ngủ | Cực giản |
| Bị thương sa sút | Trang điểm lê hoa yếu bệnh | Xõa hết (rối) | Thường phục rách hỏng | Cực giản/không có |
| Điển lễ đại hôn | Trang điểm phượng hoa quý | Búi phi tiên | Hôn phục | Cực phồn thực |
| Luyện võ hành động | Trang điểm mộc (cực nhạt) | Đuôi ngựa buộc cao | Thường phục nhẹ | Giản dị |

---

> **🔍 Quy tắc suy luận cho bối cảnh chưa được liệt kê**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen cổ trang người thật tả thực |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm mộc thanh nhã (da căng bóng + sợi tóc tả thực); quyền lực/đối đầu → trang điểm lạnh diễm sương; rung động/mập mờ → trang điểm đào hoa dịu dàng; bị thương/suy nhược → trang điểm lê hoa yếu bệnh; đại hôn/điển lễ → trang điểm phượng hoa quý |
> | Kiểu tóc | Thường ngày/khuê phòng → búi vân nửa vấn; tiên cảnh/ra mắt → búi phi tiên; riêng tư/mập mờ → búi đọa mã; bị thương sa sút → xõa hoàn toàn; hành động → đuôi ngựa buộc cao; sợi tóc bắt buộc từng sợi rõ ràng |
> | Trang phục | Ưu tiên chất người thật tả thực; thường ngày → áo tay rộng/mềm nhẹ bay bổng; trang trọng → khúc cứ thâm y; hành động → thường phục tay hẹp; màu chính mặc định trắng/nguyệt bạch; vân bắt buộc cực kỳ sắc nét |
> | Độ phồn thực của phụ kiện | Cực phồn thực theo kỹ nghệ tả thực (kỹ nghệ bậc thầy chạm khắc tỉ mỉ); thường ngày → vừa phải; trang trọng → cực phồn thực (châu thúy đầy đầu + anh lạc + cung thao); hành động → giản dị; bị thương → cực giản/không có |
> | Chuẩn chất liệu | Neo vào nhiếp ảnh người thật tả thực; da sứ kem căng bóng + chi tiết sợi tóc luôn được giữ; cấm render 3D/cảm giác CG |

## 8. Quy phạm bản vẽ thiết định bốn hướng nhìn

> Sau khi chồng lớp phục trang hóa trang phái sinh vẫn phải xuất bản vẽ thiết định bốn hướng nhìn, bảo đảm phục trang hóa trang tạo kiểu nhất quán ở mọi góc.

### Định nghĩa các hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Trái ngoài cùng | Đặc tả chân dung | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ nét | portrait closeup、face detail、makeup detail |
| Trái thứ hai | Hình chiếu trước | Chính diện 0° | Tượng đứng toàn thân | Đối diện máy quay, thấy trọn mặt trước của trang phục | front view、height mark |
| Phải thứ hai | Hình chiếu bên | Bên phải 90° | Tượng đứng toàn thân | Đường viền nghiêng thuần túy, lớp lang bên hông của trang phục | side view、profile、height mark |
| Phải ngoài cùng | Hình chiếu sau | Phía sau 180° | Tượng đứng toàn thân | Trang sức cài sau gáy/trang phục phần lưng/đuôi tóc rõ nét | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp ngang từ trái sang phải trong cùng một khung hình |
| Nền | Xám trung tính thuần #E8E8E8 |
| Tư thế đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi dang (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (như trang điểm mộc thanh nhã → điềm đạm, trang điểm đào hoa → hàm tiếu), chỉ giới hạn ở vi biểu cảm trên gương mặt, không liên quan đến động tác cơ thể |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + bù sáng hai bên, không bóng cứng |
| Tính nhất quán | Gương mặt/trang điểm/kiểu tóc/trang sức cài tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung đầu ra | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng điều cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên phái sinh nhân vật **không chứa mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung kể về bối cảnh/môi trường/thời tiết/hậu cảnh nào (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không chứa bất kỳ tương tác đạo cụ nào**, không xuất ô/kiếm/quạt/sách/đèn lồng/chén rượu... các vật cầm tay hay vật tương tác (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm thay đổi tư thế | **Không đổi tư thế của bản mẫu gốc**, không xuất đi lại/ngoảnh lại/nhấc tay/nghiêng người/chạy... bất kỳ động tác hay thay đổi dáng người nào, giữ nguyên tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được ngay, không cần tiêu đề, bảng biểu, giải thích, so sánh phương án |

### Chồng lớp phục trang hóa trang đầy đủ (bốn hướng nhìn)

```
Lấy ảnh tạo hình cơ bản của nhân vật làm ảnh nền, img2img chồng lớp phục trang hóa trang tạo kiểu，
bản vẽ thiết định bốn hướng nhìn nhân vật {giới tính} cổ trang，nhiếp ảnh người thật tả thực，ghi chép hiện thực cổ trang，tương phản mạnh，chi tiết tối đa，8K，siêu trung thực
character design sheet，character turnaround，
giữ nguyên gương mặt của tạo hình cơ bản，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối của người dùng: {trang điểm cơ bản/trang điểm nhẹ/trang điểm trang trọng}; dùng {phong cách trang điểm}，da sứ kem căng bóng，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo kiểu}，tóc từng sợi rõ ràng，{mô tả trang sức cài tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{kỹ nghệ trang trí}，chất vải rõ nét，vân cực kỳ sắc nét，
【L5·Phụ kiện】{trang sức cài đầu}，{khuyên tai}，{trang sức cổ}，{trang sức eo}，
xếp ngang từ trái sang phải trong cùng khung hình: đặc tả chân dung+hình chiếu trước+hình chiếu bên+hình chiếu sau，
đứng tự nhiên，nền xám trung tính thuần，ánh sáng dịu đều，không bóng cứng，
nhất quán bốn hướng nhìn，render gương mặt tinh tế，render sợi tóc tinh tế，chi tiết vân cực kỳ sắc nét
không có bất kỳ chữ nào trong hình
```

---

## 10. Quy tắc ràng buộc

### Bắt buộc tuân thủ

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc khớp với bản mẫu gốc |
| R2 | Trang phục bắt buộc dùng "chất vải rõ nét + vân cực kỳ sắc nét" |
| R3 | Phụ kiện của nữ bắt buộc "cực phồn thực + kỹ nghệ bậc thầy" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ thiết định bốn hướng nhìn (đặc tả chân dung+hình chiếu trước+hình chiếu bên+hình chiếu sau) |
| R6 | Bắt buộc chỉ định "nền xám trung tính thuần" |
| R7 | Bắt buộc chỉ định "nhất quán bốn hướng nhìn" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/điều cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên phái sinh nhân vật không đụng đến bối cảnh/môi trường/thời tiết/hậu cảnh kể chuyện, bối cảnh là loại tài nguyên độc lập |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (ô/kiếm/quạt/sách...), đạo cụ là loại tài nguyên độc lập |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của bản mẫu gốc, cấm mọi thay đổi động tác/dáng người/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết định** — phân tích manh mối gương mặt của người dùng trước, rồi mới xác định trang điểm cơ bản/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần trang điểm tạo kiểu** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm cơ bản |
| R14 | **Cường độ trang điểm có kiểm soát** — kể cả khi trang điểm cũng phải kiềm chế, không được xuất hiện trang điểm đậm kiểu hiện đại/hiệu ứng trang điểm màu phóng đại |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ để nâng cấp cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được nâng trang điểm cơ bản lên mức trang điểm mạnh hơn |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Gương mặt bị lệch sau khi chồng lớp |
| X2 | Phụ kiện quá đơn giản/hiện đại hóa (với nữ) |
| X3 | Phong cách trang điểm/trang phục xung khắc nhau |
| X4 | Nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Phục trang hóa trang tạo kiểu không nhất quán giữa bốn hướng nhìn |
| X6 | Bất kỳ nội dung nào ngoài prompt đầu ra (bảng biểu/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Đưa mô tả bối cảnh vào tài nguyên phái sinh nhân vật (đường núi/cảnh mưa/trong nhà/phố xá/thời tiết... các yếu tố môi trường) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "điều cấm", "phương án phái sinh" |
| X9 | Đưa vào bất kỳ tương tác đạo cụ nào (cầm ô/kiếm/quạt/sách/đèn lồng/chén rượu...) |
| X10 | Đổi tư thế của bản mẫu gốc (đi lại/ngoảnh lại/nhấc tay/nghiêng người/chạy/cúi đầu/ngước nhìn... các mô tả động tác) |
| X11 | Đưa vào mô tả gắn biểu cảm với tư thế (như lối viết kể chuyện "nghiêng người 45° vừa đi khóe môi khẽ cong") |
| X12 | Áp thẳng một kiểu trang điểm định sẵn mà không phân tích manh mối của người dùng |
| X13 | Giữ mặt mộc sai chỗ, khiến tài nguyên phái sinh thiếu phần trang điểm tạo kiểu đáng lẽ phải có |
| X14 | Nâng cấp trang điểm nhầm chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác, dẫn đến quyết định sai về cường độ trang điểm tạo kiểu |
