# Tạo tài nguyên phái sinh nhân vật · Sổ tay ràng buộc phong cách phẳng

---

## 1. Nguyên tắc chồng lớp

1. **Đường viền không đổi** — sau khi chồng lớp, đường viền nét phải giống hệt bản gốc, cấm lệch đường viền
2. **Tư thế không đổi** — giữ nguyên dáng đứng tự nhiên của bản gốc, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mô tả riêng từng lớp để dễ thay thế theo lớp (thay đồ mà không thay trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố trang phục - trang điểm đều tuân theo cùng một hệ thẩm mỹ phẳng
5. **Mảng màu không xuống chuẩn** — sau khi chồng lớp, chuẩn mảng màu không thấp hơn bản gốc
6. **Chỉ trong phạm vi trang phục - trang điểm** — chỉ chồng thêm trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản gốc | Bản tạo hình nhân vật gốc, không sửa |
| L1 | Trang điểm (lớp ra quyết định) | Phân tích manh mối của người dùng trước, rồi quyết định mức "trang điểm nền / trang điểm nhẹ / trang điểm trang trọng" |
| L2 | Tạo hình tóc | Búi tóc/buộc tóc/tết tóc + phụ kiện tóc |
| L3 | Áo trong/lớp lót | Thay cho áo trong nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Áo tay rộng/áo giao lĩnh vạt thẳng/áo choàng lớn... |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo/tay |

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
| Manh mối gương mặt nhẹ | Dịu dàng, thoáng cười, sắc mặt tươi lên chút ít | Trang điểm nhẹ (cực nhạt) |
| Manh mối ốm yếu rõ ràng | Sắc mặt tái nhợt, môi nhạt màu | Trang điểm lê hoa ốm yếu (trang điểm nhẹ) |
| Manh mối nghi lễ trang trọng rõ ràng | Lễ phục, đại lễ, xuất hiện lộng lẫy | Trang điểm trang trọng (có kiểm soát) |

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh áp dụng | Prompt cốt lõi |
|---|---|---|
| Trang điểm thanh nhã mộc | Thường ngày, lần đầu gặp, trong khuê phòng | trang điểm phẳng、mảng màu thanh nhạt、trang điểm tối giản |
| Trang điểm lạnh sắc như sương | Trang trọng, đối đầu, quyền lực | trang điểm phẳng tông lạnh、đường nét gọn gàng、trang điểm mảng màu |
| Trang điểm đào hoa mềm mại | Ngọt ngào, mập mờ, rung động | trang điểm phẳng tông đào、chỉnh sắc hồng、biểu đạt mảng màu |
| Trang điểm lê hoa ốm yếu | Bị thương, suy yếu | trang điểm phẳng ốm yếu、màu da tái nhợt、môi nhạt màu |
| Trang điểm phượng lộng lẫy | Đại hôn, lễ phục | trang điểm phẳng đậm、mảng màu đậm đà、đường nét tinh xảo |

### Nền da dùng chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Tô một màu, không gradient | da một màu、da phẳng、solid skin |
| Độ sáng da | Một màu nhạt, đều | màu da nhạt、màu da đơn sắc |
| Ánh xuyên trong | Không ánh xuyên trong, phẳng thuần | không bóng、không xuyên sáng |
| Cấm | Gradient/đổ bóng/cảm giác khối | — |

### Chi tiết trang điểm nền (bậc mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lông mày | Vẽ bằng đường nét, tô một màu | lông mày đường nét、dáng mày phẳng |
| Mắt | Mảng màu giản lược, không chi tiết đồng tử | mắt phẳng、mắt mảng màu |
| Gò má | Mảng màu cực nhạt, không được dồn màu lộ | má hồng cực nhạt、mảng màu nâng sắc |
| Môi | Một màu tô nhẹ, giữ kìm chế | môi một màu、môi phẳng |
| Tổng thể | Nhìn ra là có trang điểm, nhưng mảng màu rất nhẹ | trang điểm phẳng nền、giả mặt mộc phẳng |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Kiểu tạo hình nữ

| Tạo hình | Mô tả | Áp dụng | Prompt |
|---|---|---|---|
| Búi mây nửa vấn | Búi trên đỉnh đầu + tóc buông phía sau | Thường ngày, ra ngoài | búi mây phẳng、búi tóc tối giản |
| Búi phi tiên | Búi cao hất lên, đường nét gọn gàng | Cõi tiên, xuất hiện | búi bay phẳng、búi cao đường nét |
| Búi đọa mã | Búi thấp lệch một bên, đường nét uể oải | Riêng tư, mập mờ | búi đọa phẳng、búi lệch đường nét |
| Búi hai vòng | Hai búi đối xứng, đường nét thiếu nữ | Nhân vật trẻ | búi đôi phẳng、hai vòng đơn giản |
| Tóc xõa hoàn toàn | Tóc dài xõa hết, kèm phụ kiện tóc đơn giản | Bị thương, sa sút | tóc xõa phẳng、tóc dài đường nét |
| Buộc tóc đuôi ngựa | Buộc cao gọn ghẽ, đường nét gọn gàng | Luyện võ, hành động | đuôi ngựa phẳng、tóc buộc đường nét |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Trang trí phẳng hóa, dạng hình học | phụ kiện tóc phẳng、trang trí hình học |
| Chất liệu | Vẽ bằng đường nét, tô một màu | trang sức đường nét、phụ kiện tóc mảng màu |
| Chế tác | Đường nét gọn gàng, chế tác cực giản | đường nét gọn gàng、chế tác phẳng |

### Kiểu tạo hình nam

| Tạo hình | Áp dụng | Prompt |
|---|---|---|
| Buộc tóc nửa mũ | Thường ngày, văn nhân | tóc buộc phẳng、mũ đường nét |
| Đội mũ toàn phần buộc cao | Trang trọng, triều đình | mũ toàn phần phẳng、tóc buộc đường nét |
| Tóc xõa ngang vai | Riêng tư, bị thương | tóc xõa phẳng、tóc dài đường nét |
| Đuôi ngựa buộc chiến | Chiến đấu, luyện võ | tóc chiến phẳng、đuôi ngựa đường nét |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Áp dụng | Prompt |
|---|---|---|---|
| Đồ phiêu dật tối giản | Áo tay rộng nhiều lớp, đường nét phẳng | Thường ngày, cõi tiên | tay rộng phẳng、áo đường nét |
| Lễ phục đoan trang | Áo khúc cư/nhu quần, đường nét hình học | Triều đình, yến tiệc | khúc cư phẳng、thâm y tối giản |
| Thường phục nhẹ nhàng | Nhu quần tay hẹp/áo ngắn, đường nét gọn gàng | Hành động, luyện võ | tay hẹp phẳng、áo ngắn gọn gàng |
| Đồ ngủ | Áo trong lụa mỏng, phẳng màu mộc | Trong nhà, ban đêm | đồ ngủ phẳng、trang phục màu mộc |
| Áo cưới đại hôn | Phượng quan hà bí, mảng màu xếp lớp | Đám cưới | áo cưới phẳng、mảng màu nhiều lớp |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Trắng/trắng nguyệt/xám bạc là mặc định | trang phục phẳng màu trắng、trang phục tối giản |
| Chất liệu | Mảng màu đơn sắc, không vân bề mặt | trang phục đơn sắc、không vân bề mặt |
| Chất cảm | Đường nét bắt buộc rõ ràng | đường nét rõ ràng、mảng màu tách bạch |
| Phần vai | Đường nét trang sức vai/khăn choàng/vân kiên | trang sức vai đường nét、vân kiên phẳng |
| Lớp lang | Mặc nhiều lớp, mảng màu tách bạch | mặc nhiều lớp、lớp lang phẳng |

### Ma trận trang phục nam

| Phong cách | Áp dụng | Prompt |
|---|---|---|
| Đồ nhã văn nhân | Thường ngày, thư phòng | trường sam phẳng、áo tối giản |
| Đồ bó võ tướng | Chiến đấu, luyện võ | đồ bó phẳng、chiến phục gọn gàng |
| Huyền y đại xưởng | Xuất hiện, đi đêm | áo choàng lớn phẳng、áo choàng đường nét |
| Thường phục tiện dụng | Thư giãn, riêng tư | thường phục phẳng、đồ tiện dụng tối giản |
| Lễ phục triều phục | Triều đình, đại lễ | triều phục phẳng、lễ bào tối giản |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức đầu | Phẳng hóa, dạng hình học | trang sức đầu phẳng、phụ kiện tóc hình học |
| Trang sức tai | Tua rua/khuyên ngọc dạng đường nét | khuyên tai đường nét、khuyên ngọc phẳng |
| Trang sức cổ | Anh lạc/vòng cổ dạng đường nét | anh lạc đường nét、vòng cổ phẳng |
| Trang sức eo | Dải cung/ngọc bội dạng đường nét | dải cung đường nét、ngọc bội phẳng |
| Trang sức tay | Vòng ngọc/xuyến tay dạng đường nét | vòng tay đường nét、xuyến phẳng |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Mũ tóc | Mũ phẳng, đường nét gọn gàng | mũ phẳng、mũ đường nét |
| Đai lưng | Đai lưng đường nét, mảng màu phẳng | đai lưng đường nét、đai phẳng |
| Ngọc bội | Ngọc bội phẳng, tạo hình gọn gàng | ngọc bội phẳng、bội đường nét |
| Binh khí | Kiếm đeo/quạt/sáo (tùy chọn) | kiếm phẳng、quạt đường nét |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Thường ngày trong khuê phòng | Trang điểm thanh nhã mộc | Búi mây nửa vấn | Đồ phiêu dật tối giản | Phẳng, vừa phải |
| Lần đầu gặp gỡ | Trang điểm thanh nhã mộc | Nửa vấn/phi tiên | Đồ phiêu dật tối giản | Phẳng, vừa đến nhiều |
| Tương tác ngọt ngào | Trang điểm đào hoa mềm mại | Nửa vấn/đọa mã | Tối giản/nhẹ nhàng | Phẳng, vừa phải |
| Xuất hiện trang trọng | Trang điểm lạnh sắc như sương | Búi phi tiên | Lễ phục đoan trang | Phẳng, cực rườm rà |
| Mật đàm ban đêm | Thanh nhã/đào hoa | Xõa hết/đọa mã | Đồ ngủ | Phẳng, cực giản |
| Bị thương sa sút | Trang điểm lê hoa ốm yếu | Xõa hết (rối) | Thường phục rách hỏng | Phẳng, cực giản/không có |
| Đại hôn điển lễ | Trang điểm phượng lộng lẫy | Búi phi tiên | Áo cưới | Phẳng, cực rườm rà |
| Luyện võ hành động | Trang điểm mộc (cực nhạt) | Buộc tóc đuôi ngựa | Thường phục nhẹ nhàng | Phẳng, giản |

---

> **🔍 Quy tắc suy luận cho cảnh chưa được liệt kê**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen cổ phong phẳng |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm thanh nhã mộc (mảng màu cực giản); trang trọng/xuất hiện → trang điểm lạnh sắc như sương; ngọt ngào/hẹn hò → trang điểm đào hoa mềm mại; suy yếu/ốm → trang điểm lê hoa ốm yếu |
> | Kiểu tóc | Thường ngày → búi mây nửa vấn hoặc búi đọa mã; trang trọng → búi phi tiên; riêng tư/ban đêm → tóc xõa hoàn toàn; hành động → buộc tóc đuôi ngựa |
> | Trang phục | Mọi trang phục bắt buộc chuyển thành biểu đạt mảng màu phẳng; hoa văn giản lược tối đa; mặc nhiều lớp chỉ cần giữ cảm giác đường viền |
> | Độ rườm rà phụ kiện | Ưu tiên xử lý phẳng hóa; trang trọng → phẳng cực rườm rà (giản lược thành trang sức đầu mảng màu + đường viền trang sức eo); thường ngày → phẳng vừa phải |
> | Xu hướng tông màu | Hệ màu cổ phong độ bão hòa thấp (trắng trà/xanh trúc/hồng ngó sen/đỏ gạch); không gradient; đường biên rõ ràng |

## 8. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, thấy trọn mặt trước trang phục | front view、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn nghiêng | side view、profile、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Phụ kiện tóc sau gáy/trang phục phía lưng/đuôi tóc rõ ràng | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở (**cấm mọi thay đổi tư thế**) |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm (ví dụ thanh nhã mộc → điềm nhiên, đào hoa → thoáng cười), chỉ giới hạn ở vi biểu cảm trên mặt, không liên quan động tác cơ thể |
| Ánh sáng | Không ánh sáng đổ bóng, tô màu phẳng thuần |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/phụ kiện tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung đầu ra | **Chỉ xuất văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng điều cấm, phương án phái sinh, gợi ý đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài nguyên phái sinh nhân vật **không bao gồm mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung kể về bối cảnh/môi trường/thời tiết/phông nền nào (bối cảnh thuộc phạm vi tài nguyên bối cảnh) |
| Cấm đạo cụ | **Không bao gồm bất kỳ tương tác đạo cụ nào**, không xuất ô/kiếm/quạt/sách/đèn lồng/chén rượu hay vật cầm tay, vật tương tác nào (đạo cụ thuộc phạm vi tài nguyên đạo cụ) |
| Cấm đổi tư thế | **Không đổi tư thế bản gốc**, không xuất bất kỳ động tác hay thay đổi dáng người nào như đi/ngoái đầu/giơ tay/nghiêng người/chạy, giữ dáng đứng tự nhiên |
| Định dạng | Xuất thẳng khối mã prompt dùng được ngay, không cần tiêu đề, bảng biểu, giải thích, so sánh phương án |

### Chồng lớp trang phục - trang điểm đầy đủ (bốn hướng nhìn)


```
lấy ảnh tạo hình nhân vật gốc làm ảnh nền，img2img chồng lớp trang phục - trang điểm，
bản vẽ bốn hướng nhìn nhân vật {giới tính} cổ phong phẳng，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
giữ nguyên đường viền tạo hình gốc，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}; dùng {phong cách trang điểm}，da một màu，màu da phẳng，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo hình}，kiểu tóc đường nét，{mô tả phụ kiện tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{chế tác trang trí}，đường nét rõ ràng，mảng màu tách bạch，
【L5·Phụ kiện】{trang sức đầu}，{trang sức tai}，{trang sức cổ}，{trang sức eo}，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
đứng tự nhiên，phông nền xám trung tính tinh khiết，không ánh sáng đổ bóng，không gradient，
bốn hướng nhìn nhất quán，đường nét gọn gàng，tô mảng màu，
trong hình không được có bất kỳ chữ nào
```


---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, đường viền bắt buộc nhất quán với bản gốc |
| R2 | Trang phục bắt buộc dùng "đường nét rõ ràng + mảng màu tách bạch" |
| R3 | Phụ kiện nữ bắt buộc "phẳng hóa + dạng hình học" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau) |
| R6 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R8 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/điều cấm/phương án phái sinh/gợi ý đầu ra hay bất kỳ nội dung nào không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** — tài nguyên phái sinh nhân vật không dính đến bối cảnh/môi trường/thời tiết/kể chuyện phông nền, bối cảnh là loại tài nguyên độc lập |
| R10 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (ô/kiếm/quạt/sách...), đạo cụ là loại tài nguyên độc lập |
| R11 | **Giữ nguyên tư thế** — bắt buộc giữ dáng đứng tự nhiên của bản gốc, cấm mọi thay đổi động tác/dáng người/tư thế |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết định** — phân tích manh mối gương mặt của người dùng trước, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R13 | **Mọi tài nguyên phái sinh đều cần trang điểm - tạo hình** — bình thường không giữ mặt mộc, ít nhất phải dùng trang điểm nền |
| R14 | **Cường độ trang điểm có kiểm soát** — dù có trang điểm cũng phải kìm chế, không được xuất hiện trang điểm phẳng đậm kiểu hiện đại/hiệu ứng makeup màu mè cường điệu |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ nâng cường độ** — chỉ dựa vào thông tin đạo cụ, môi trường, động tác thì không được nâng trang điểm nền lên mức đậm hơn |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Đường viền bị lệch sau khi chồng lớp |
| X2 | Phụ kiện quá đơn giản/hiện đại hóa (nữ) |
| X3 | Phong cách trang điểm/trang phục xung đột với nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Trang phục - trang điểm không nhất quán giữa bốn hướng nhìn |
| X6 | Bất kỳ nội dung nào ngoài prompt (bảng biểu/phương án/gợi ý/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài nguyên phái sinh nhân vật (đường núi/cảnh mưa/trong nhà/đường phố/thời tiết và các yếu tố môi trường khác) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "điều cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác đạo cụ nào (cầm ô/kiếm/quạt/sách/đèn lồng/chén rượu...) |
| X10 | Đổi tư thế bản gốc (mô tả động tác như đi/ngoái đầu/giơ tay/nghiêng người/chạy/cúi đầu/ngước nhìn...) |
| X11 | Thêm mô tả nối biểu cảm với tư thế (ví dụ lối viết kể chuyện như "nghiêng người 45° bước đi khóe môi cong nhẹ") |
| X12 | Áp thẳng một kiểu trang điểm cố định mà chưa phân tích manh mối người dùng |
| X13 | Giữ mặt mộc sai chỗ, khiến tài nguyên phái sinh thiếu phần trang điểm - tạo hình đáng có |
| X14 | Nâng nhầm mức trang điểm chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác, dẫn đến quyết định sai cường độ trang điểm |
| X15 | Thêm hiệu ứng gradient/đổ bóng/highlight/cảm giác khối |
