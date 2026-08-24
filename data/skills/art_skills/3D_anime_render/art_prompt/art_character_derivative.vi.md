# Tạo tài nguyên phái sinh nhân vật đô thị render anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt bản gốc, cấm để gương mặt lệch đi
2. **Tư thế không đổi** — giữ tư thế đứng tự nhiên của bản gốc, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mô tả từng lớp độc lập để dễ thay theo lớp (đổi trang phục mà không đổi trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố trang phục - trang điểm tuân theo cùng một hệ thẩm mỹ hoạt hình đô thị
5. **Chất liệu không tụt** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn bản gốc
6. **Chỉ thuộc phạm trù trang phục - trang điểm** — chỉ chồng trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản gốc | Bản tạo hình nhân vật gốc, không sửa |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định mức "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Tạo hình tóc | Tóc xõa/đuôi ngựa/búi/buộc nửa + phụ kiện tóc |
| L3 | Áo trong/lớp lót | Thay cho áo trong nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Trang phục đô thị hiện đại |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo/tay |

> **Ranh giới phạm vi**: tài nguyên phái sinh nhân vật chỉ gồm các lớp L0–L5 (trang phục - trang điểm - tạo hình), không gồm đạo cụ (ô/điện thoại/máy tính/cà phê và các vật cầm tay khác), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...), tư thế động tác (đi/ngoái đầu/giơ tay...). Những thứ đó thuộc phạm trù của các loại tài nguyên khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ bản gốc sang trang điểm phái sinh (then chốt)

> Bản gốc nhân vật tuy để mặt mộc, nhưng tài nguyên phái sinh mặc định đi vào quy trình trang điểm - tạo hình. Hệ thống phải dựa vào manh mối người dùng cung cấp để phân tích nhu cầu trang điểm, và quyết định mức độ giữa trang điểm nền, trang điểm nhẹ, trang điểm trang trọng, chứ không giữ mặt mộc.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối người dùng: từ chỉ trạng thái gương mặt, từ chỉ cảm xúc, từ chỉ cường độ | Hình thành bản tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không được lấy làm căn cứ trang điểm | Tránh phán đoán sai |
| S3 | Đối chiếu ma trận phong cách trang điểm và đưa ra bậc cường độ | Trang điểm nền / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thực thi)

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn vào gương mặt | Chỉ đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Trang điểm nền |
| Manh mối gương mặt nhẹ | Dịu dàng, thoáng cười, mi run nhẹ, sắc mặt tươi lên chút ít | Trang điểm nhẹ (cực nhạt) |
| Manh mối ốm yếu rõ ràng | Sắc mặt tái nhợt, môi nhạt màu, dưới mắt hơi ửng đỏ | Trang điểm lê hoa ốm yếu (trang điểm nhẹ) |
| Manh mối nghi lễ trang trọng rõ ràng | Thịnh trang, điển lễ, xuất hiện lộng lẫy | Trang điểm trang trọng (có kiểm soát) |

> Nguyên tắc phán định: mọi tài nguyên phái sinh đều phải có trang điểm - tạo hình; xét manh mối gương mặt trước để quyết cường độ và phong cách, thay đổi về đạo cụ, bối cảnh, tư thế không được tự nó nâng cường độ trang điểm lên.

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh áp dụng | Prompt cốt lõi |
|---|---|---|
| Trang điểm thanh nhã | Thường ngày, lần đầu gặp, đi làm | trang điểm thanh nhã、mày kẻ nhạt、mặt mộc trong trẻo |
| Trang điểm lạnh lùng sắc sảo | Trang trọng, đối đầu, quyền lực | trang điểm lạnh lùng sắc sảo、mày mắt sắc nét、môi mỏng lạnh lẽo |
| Trang điểm đào hoa mềm mại | Ngọt ngào, mập mờ, rung động | trang điểm đào hoa、đuôi mắt ửng hồng、môi căng mọng |
| Trang điểm lê hoa ốm yếu | Bị thương, suy yếu | sắc mặt tái nhợt、môi nhạt màu、dưới mắt hơi ửng đỏ |
| Trang điểm dạ tiệc lộng lẫy | Dạ tiệc trang trọng, dự tiệc thịnh trang | trang điểm đậm tinh xảo、màu môi nổi bật |

### Nền da dùng chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Render cel-shading, độ bóng dịu | da hoạt hình、chất da dịu nhẹ |
| Độ trắng | Da trắng lạnh, trong trẻo chứ không nhợt nhạt | da sữa、milky white skin |
| Ánh trong | Cảm giác sáng dịu từ trong ra ngoài | ánh trong từ bên trong、da trong và phát sáng |
| Cấm | Lì mờ/trắng bệch/như sáp/bóng dầu/cháy sáng | — |

### Chi tiết trang điểm nền (bậc mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lông mày | Tỉa nhẹ theo dáng mày của bản gốc, không đổi dáng mày | tỉa mày tự nhiên、dáng mày sạch |
| Mắt | Chỉnh mắt cực nhạt, nhấn vào vẻ trong trẻo và có thần | mắt trong trẻo、kẻ mí trong cực nhạt |
| Gò má | Nâng sắc mặt cực nhạt, không được dồn màu lộ liễu | sắc mặt gò má tự nhiên、nâng sắc rất nhẹ |
| Môi | Dưỡng màu hồng nude hoặc hồng nhạt, giữ chừng mực | màu môi tự nhiên căng mọng、màu môi hồng nhạt |
| Tổng thể | Nhìn ra là có trang điểm, nhưng cảm giác trang điểm rất nhẹ | trang điểm nền、cảm giác mặt mộc giả、chỉnh sửa tự nhiên |

### Theo từng vùng (lấy trang điểm thanh nhã làm ví dụ)

| Vùng | Ràng buộc | Prompt |
|---|---|---|
| Nền trang điểm | Mỏng nhẹ trong trẻo, ánh nước lấp lánh nhẹ | nền trang điểm mỏng nhẹ、da kem ánh nước |
| Trang điểm mày | Mày viễn sơn/mày lá liễu, quét nhạt màu nâu xám | mày đen viễn sơn、mày kẻ nhạt |
| Trang điểm mắt | Phấn mắt cực nhạt, kẻ mí trong, mi dài | trang điểm mắt trong trẻo、mi dài |
| Má hồng | Phấn mỏng cực nhạt, quét nhẹ vùng má | má hồng cực nhạt、phấn mỏng ửng nhẹ |
| Trang điểm môi | Hồng nhạt căng mọng, ánh nhẹ | màu môi hồng nhạt căng mọng |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Render cel-shading, trắng sáng trong trẻo, tươi tắn tự nhiên | da hoạt hình、da kem、luminous skin |
| Nguyên tắc | Mặt mộc giả — nhìn như không trang điểm nhưng da cực đẹp | mặt mộc giả、da đẹp trời cho |
| Lông mày | Mày rậm tự nhiên, không kẻ mày | mày kiếm tự nhiên、dáng mày hiên ngang |
| Màu môi | Sắc máu tự nhiên, hơi căng mọng | màu môi tự nhiên、có sắc máu |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Áp dụng | Prompt |
|---|---|---|---|
| Tóc xõa tự nhiên | Tóc dài buông tự nhiên, mượt và có độ bóng | Thường ngày, thư giãn | tóc xõa tự nhiên、tóc dài mượt |
| Đuôi ngựa cao | Buộc đuôi ngựa cao, năng động gọn gàng | Thể thao, đi làm | đuôi ngựa cao、đuôi ngựa năng động |
| Đuôi ngựa thấp | Buộc đuôi ngựa thấp, thanh lịch gọn gàng | Thường ngày, công việc | đuôi ngựa thấp、đuôi ngựa thanh lịch |
| Buộc nửa | Phần trên buộc nửa + phần dưới buông tự nhiên | Thường ngày, hẹn hò | tóc buộc nửa、kiểu tóc buộc nửa |
| Hai đuôi ngựa | Đuôi ngựa hai bên, trẻ trung hoạt bát | Cảnh hoạt bát | hai đuôi ngựa、kiểu tóc hoạt bát |
| Búi tóc thanh lịch | Búi tóc/búi tròn, cảm giác trang trọng | Dịp trang trọng | búi tóc thanh lịch、búi thấp |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Đô thị hiện đại, tối giản tinh tế, ăn khớp với trang phục | phụ kiện tóc hiện đại、phong cách đô thị |
| Chất liệu | Kim loại/vải/mica | kẹp tóc kim loại、phụ kiện tóc bằng vải |
| Chế tác | Chế tác tinh xảo, thể hiện theo lối hoạt hình | chế tác tinh xảo、trang trí tinh tế |

### Các kiểu tạo hình nam

| Tạo hình | Áp dụng | Prompt |
|---|---|---|
| Tóc ngắn tươi tắn | Thường ngày, công việc | tóc ngắn tươi tắn、kiểu tóc gọn gàng |
| Rẽ lệch rẽ giữa | Trang trọng, đi làm | kiểu tóc rẽ lệch、kiểu tóc rẽ giữa |
| Bồng bềnh rối nhẹ | Thư giãn, nghệ sĩ | kiểu tóc bồng bềnh、rối nhẹ tùy ý |
| Trung bình dài tự nhiên | Thư giãn, nghệ sĩ | tóc trung bình dài、buông tự nhiên |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Áp dụng | Prompt |
|---|---|---|---|
| Đồ công sở đô thị | Áo sơ mi/vest/chân váy | Đi làm, thường ngày | trang phục công sở、đồ công sở đô thị |
| Đồ thường ngày thoải mái | Áo thun/quần jean/áo nỉ | Thường ngày, thư giãn | trang phục thoải mái、phối đồ dễ chịu |
| Váy dạ hội | Váy liền/váy dạ tiệc | Tiệc, hẹn hò | váy dạ hội、váy thanh lịch |
| Đồ thể thao | Bộ đồ thể thao/áo ba lỗ thể thao | Thể thao, tập luyện | trang phục thể thao、phối đồ năng động |
| Lễ phục trang trọng | Lễ phục đặt may cao cấp | Dịp trang trọng | lễ phục trang trọng、váy lộng lẫy |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Chủ yếu tông ấm, hợp cảm giác đô thị | trang phục tông ấm、phối màu đô thị |
| Chất liệu | Cảm giác chất liệu thật + render cel-shading | chất vải rõ ràng、chất liệu cel-shading |
| Chất cảm | Vân rõ ràng nhưng không tả thực quá mức | vân vải rõ ràng、chất hoạt hình |
| Vai | Vai tự nhiên, trang trí vừa phải | vai tự nhiên、trang trí vừa phải |
| Lớp lang | Lớp lang vừa phải, không quá rườm rà | lớp lang vừa phải、gọn gàng tách bạch |

### Ma trận trang phục nam

| Phong cách | Áp dụng | Prompt |
|---|---|---|
| Đồ đô thị thoải mái | Áo sơ mi/quần jean/áo khoác thoải mái | Thường ngày, thư giãn | trang phục thoải mái、phong cách đô thị |
| Đồ công sở trang trọng | Vest/áo sơ mi/cà vạt | Đi làm, trang trọng | đồ công sở trang trọng、tạo hình công việc |
| Bộ đồ thể thao | Đồ thể thao/bộ đồ thể thao | Thể thao, tập luyện | trang phục thể thao、phối đồ năng động |
| Đồ thường ngày | Áo thun/quần jean/áo nỉ | Thư giãn, riêng tư | đồ thường ngày、phối đồ dễ chịu |
| Lễ phục trang trọng | Vest/lễ phục đặt may cao cấp | Dịp trang trọng | lễ phục trang trọng、tạo hình lộng lẫy |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức đầu | Đô thị hiện đại, không mỏng manh sơ sài | phụ kiện tóc hiện đại、trang sức đầu tinh tế |
| Trang sức tai | Khuyên tai nhỏ tinh tế/khuyên tai thả | khuyên tai tinh tế、phong cách đô thị |
| Trang sức cổ | Dây chuyền/vòng cổ tinh tế | dây chuyền tinh tế、thiết kế tối giản |
| Trang sức eo | Thắt lưng/đai trang trí tối giản | thắt lưng tối giản、phụ kiện đô thị |
| Trang sức tay | Vòng tay/đồng hồ tinh tế | đồng hồ tinh tế、phụ kiện đô thị |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Kính | Kính hiện đại/kính râm | kính hiện đại、phụ kiện thời trang |
| Thắt lưng | Thắt lưng/dây lưng da tối giản | thắt lưng tối giản、phong cách đô thị |
| Đồng hồ | Đồng hồ tinh tế/đồng hồ thể thao | đồng hồ tinh tế、phụ kiện đô thị |
| Balo | Balo đô thị/cặp công văn | balo đô thị、phụ kiện thực dụng |
| Móc khóa | Móc khóa tối giản | móc khóa tối giản、chi tiết đô thị |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Đi làm thường ngày | Trang điểm thanh nhã | Buộc nửa/đuôi ngựa | Đồ công sở đô thị | Tối giản |
| Hẹn hò thư giãn | Trang điểm đào hoa mềm mại | Buộc nửa/tóc xõa | Đồ thường ngày thoải mái | Vừa |
| Họp công việc | Trang điểm lạnh lùng sắc sảo | Buộc nửa/buộc tóc | Đồ công sở trang trọng | Tinh tế |
| Thể thao tập luyện | Trang điểm nhẹ | Đuôi ngựa/buộc tóc | Đồ thể thao | Đơn giản |
| Dạ tiệc trang trọng | Trang điểm dạ tiệc lộng lẫy | Búi tóc/buộc nửa | Váy dạ hội | Cực cầu kỳ |
| Dạo phố cuối tuần | Trang điểm nhẹ | Tóc xõa/buộc nửa | Đồ thường ngày thoải mái | Vừa |
| Thi đấu thể thao | Trang điểm nhẹ | Đuôi ngựa/buộc tóc | Đồ thể thao | Đơn giản |

---

> **🔍 Quy tắc suy luận cho cảnh chưa có trong bảng**
>
> Khi cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen đô thị render anime 3D |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm thanh nhã; trang trọng/công việc → trang điểm lạnh lùng sắc sảo; ngọt ngào/hẹn hò → trang điểm đào hoa mềm mại; suy yếu/bị thương → trang điểm lê hoa ốm yếu; dạ tiệc/thịnh trang → trang điểm dạ tiệc lộng lẫy |
> | Kiểu tóc | Thường ngày/đi làm → buộc nửa hoặc đuôi ngựa; thư giãn/hẹn hò → tóc xõa tự nhiên; trang trọng → búi tóc; thể thao → đuôi ngựa cao; hai đuôi ngựa dùng cho cảnh trẻ trung hoạt bát |
> | Trang phục | Phủ toàn bộ các cảnh đô thị; mức trang trọng của dịp quyết định độ tinh tế của trang phục (đi làm < thường ngày < hẹn hò < dạ tiệc); luôn giữ chất liệu cel-shading 3D |
> | Độ cầu kỳ của phụ kiện | Thể thao → đơn giản; thường ngày/đi làm → tối giản; hẹn hò → vừa và tinh tế; dạ tiệc trang trọng → cực cầu kỳ |
> | Chuẩn chất liệu | Luôn khóa render cel-shading + ánh sáng dịu; cấm trượt sang chất nhiếp ảnh tả thực hoặc chất anime hai chiều phẳng |

## 8. Quy phạm bản vẽ bốn hướng nhìn

> Sau khi chồng lớp trang phục - trang điểm phái sinh vẫn phải xuất bản vẽ bốn hướng nhìn, để bảo đảm trang phục - trang điểm - tạo hình nhất quán ở mọi góc.

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, toàn cảnh mặt trước trang phục | front view、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn nghiêng | side view、profile、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Phụ kiện tóc sau gáy/trang phục phía lưng/đuôi tóc rõ ràng | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (như trang điểm thanh nhã → điềm đạm, trang điểm đào hoa → thoáng cười), chỉ giới hạn ở vi biểu cảm trên mặt, không liên quan động tác cơ thể |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/phụ kiện tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng điều cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên phái sinh nhân vật **không chứa mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung kể chuyện về bối cảnh/môi trường/thời tiết/phông nền nào (bối cảnh thuộc phạm trù tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không chứa bất kỳ tương tác đạo cụ nào**, không xuất ô/điện thoại/máy tính/cà phê hay vật cầm tay, vật tương tác khác (đạo cụ thuộc phạm trù tài nguyên đạo cụ) |
| Cấm đổi tư thế | **Không đổi tư thế bản gốc**, không xuất động tác đi/ngoái đầu/giơ tay/nghiêng người/chạy hay bất kỳ thay đổi động tác, dáng người nào, giữ tư thế đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được ngay, không cần tiêu đề, bảng biểu, giải thích, so sánh phương án |

### Chồng lớp trang phục - trang điểm đầy đủ (bốn hướng nhìn)

```
lấy ảnh tạo hình nhân vật gốc làm ảnh nền，img2img chồng lớp trang phục - trang điểm，
render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，bản vẽ bốn hướng nhìn nhân vật {giới tính}，
anime style, cel-shaded, 3D animation render, film lighting,
character design sheet, character turnaround,
giữ nguyên gương mặt của tạo hình gốc，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}; dùng {phong cách trang điểm}，da cel-shading，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo hình}，sợi tóc render mượt mà，{mô tả phụ kiện tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{chế tác trang trí}，chất vải rõ ràng、chất liệu cel-shading，
【L5·Phụ kiện】{trang sức đầu}，{trang sức tai}，{trang sức cổ}，{trang sức eo}，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không bóng gắt，
bốn hướng nhìn nhất quán，gương mặt render tinh tế，sợi tóc render tinh tế，chi tiết vân rõ ràng，
phong cách render cel-shading，ánh sáng dịu，tỉ lệ hoạt hình vừa phải，kết hợp chất liệu tả thực，
8K siêu nét，bố cục điện ảnh，
trong hình không được có bất kỳ chữ nào
```

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc khớp với bản gốc |
| R2 | Trang phục bắt buộc dùng "chất vải rõ ràng + chất liệu cel-shading" |
| R3 | Phụ kiện nữ bắt buộc "đô thị hiện đại + chế tác tinh xảo" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau) |
| R6 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/điều cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên phái sinh nhân vật không dính đến bối cảnh/môi trường/thời tiết/kể chuyện phông nền, bối cảnh là loại tài nguyên riêng |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay, vật tương tác nào (ô/điện thoại/máy tính...), đạo cụ là loại tài nguyên riêng |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của bản gốc, cấm mọi thay đổi động tác/dáng người/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết** — phân tích manh mối gương mặt của người dùng trước, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần trang điểm - tạo hình** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm có kiểm soát** — dù có trang điểm cũng phải chừng mực, không được xuất hiện trang điểm đậm kiểu hiện đại/hiệu ứng trang điểm màu cường điệu |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được nâng trang điểm nền lên mức đậm hơn |
| R16 | Bắt buộc chứa từ khóa render anime 3D (cel-shaded, 3D animation render, anime style) |
| R17 | Bắt buộc chứa từ khóa 8K siêu nét, bố cục điện ảnh |
| R18 | Bắt buộc chứa từ khóa ánh sáng điện ảnh (film lighting) |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Sau khi chồng lớp, gương mặt bị lệch đi |
| X2 | Phụ kiện quá đơn giản/hiện đại hóa (nữ) |
| X3 | Phong cách trang điểm/trang phục xung đột với nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Trang phục - trang điểm không nhất quán giữa bốn hướng nhìn |
| X6 | Bất kỳ nội dung nào ngoài prompt (bảng biểu/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên phái sinh nhân vật (đường núi/cảnh mưa/trong nhà/đường phố/thời tiết và các yếu tố môi trường khác) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "điều cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác đạo cụ nào (cầm điện thoại/máy tính/cà phê/túi xách...) |
| X10 | Đổi tư thế bản gốc (mô tả động tác như đi/ngoái đầu/giơ tay/nghiêng người/chạy/cúi đầu/ngước nhìn...) |
| X11 | Thêm mô tả nối biểu cảm với tư thế (ví dụ lối viết kể chuyện như "nghiêng người 45° bước đi khóe môi cong nhẹ") |
| X12 | Áp thẳng một kiểu trang điểm cố định mà chưa phân tích manh mối người dùng |
| X13 | Giữ mặt mộc sai chỗ, khiến tài nguyên phái sinh thiếu phần trang điểm - tạo hình đáng có |
| X14 | Nâng nhầm mức trang điểm chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác, dẫn đến quyết định sai cường độ trang điểm |
| X15 | Dùng thuật ngữ nhiếp ảnh tả thực (như real photography, photorealistic, RAW photo...) |
| X16 | Chất liệu cel-shading quá đà hoặc thiếu, cần giữ ở mức vừa phải |