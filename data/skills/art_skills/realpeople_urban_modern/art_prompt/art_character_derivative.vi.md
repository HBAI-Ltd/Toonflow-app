# Tạo tài sản phái sinh nhân vật · Sổ tay ràng buộc tả thực đô thị

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt bản gốc, cấm lệch gương mặt
2. **Tư thế không đổi** — giữ nguyên tư thế đứng tự nhiên của bản gốc, cấm mọi thay đổi tư thế/động tác/dáng người
3. **Kiểm soát theo từng lớp** — mỗi lớp mô tả độc lập, tiện thay thế theo lớp (đổi trang phục không đổi trang điểm)
4. **Thống nhất phong cách** — mọi yếu tố trang phục - trang điểm đều tuân theo cùng một hệ thẩm mỹ
5. **Chất liệu không giảm** — sau khi chồng lớp, chuẩn chất liệu không thấp hơn bản gốc
6. **Chỉ trong phạm vi trang phục - trang điểm** — chỉ chồng trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường, động tác

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản gốc | Bản gốc tạo hình cơ bản, không sửa |
| L1 | Trang điểm (lớp quyết định) | Trước hết phân tích manh mối người dùng, rồi quyết định mức "trang điểm nền/trang điểm nhẹ/trang điểm trang trọng" |
| L2 | Tạo hình tóc | Thiết kế kiểu tóc + phụ kiện tóc |
| L3 | Lớp giữa/lớp lót | Thay cho lớp giữa nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Áo thun/sơ mi/vest/áo khoác/váy... |
| L5 | Phụ kiện | Đồng hồ/kính/hoa tai/dây chuyền/thắt lưng/trang sức tay |

> **Ranh giới phạm vi**: tài sản phái sinh nhân vật chỉ gồm các lớp L0–L5 (trang phục, trang điểm, tạo hình tóc), không gồm đạo cụ (điện thoại/chìa khóa/túi/bút và các vật cầm tay), môi trường bối cảnh (trong nhà/ngoài trời/thời tiết...), tư thế động tác (đi/ngoái nhìn/giơ tay...). Những thứ đó thuộc phạm vi của các loại tài sản khác.

---

## 3. Ràng buộc trang điểm (L1)

### Chiến lược từ bản gốc sang trang điểm phái sinh (then chốt)

> Bản gốc nhân vật tuy ở trạng thái tự nhiên, nhưng tài sản phái sinh mặc định đi vào quy trình trang điểm - tạo hình. Hệ thống phải dựa vào manh mối người dùng cung cấp để phân tích nhu cầu trang điểm, và quyết định mức độ giữa trang điểm nền, trang điểm nhẹ, trang điểm trang trọng.

### Phân tích manh mối và quyết định trang điểm ở L1

| Bước | Nội dung xử lý | Kết quả quyết định |
|---|---|---|
| S1 | Trích manh mối người dùng: từ chỉ trạng thái gương mặt, từ chỉ cảm xúc, từ chỉ cường độ | Tóm tắt nhu cầu trang điểm |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ về đạo cụ/bối cảnh/động tác/tư thế không được lấy làm căn cứ trang điểm | Chống phán đoán sai |
| S3 | Đối chiếu ma trận phong cách trang điểm và đưa ra bậc cường độ | Trang điểm nền / trang điểm nhẹ / trang điểm trang trọng |
| S4 | Sinh prompt L1 cuối cùng | Chỉ xuất kết luận, không xuất quá trình phân tích |

### Ánh xạ manh mối sang trang điểm (chuẩn thi hành)

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối nhấn mạnh gương mặt | Chỉ thay đổi trang phục/kiểu tóc, không nhấn cảm xúc và trạng thái | Trang điểm nền |
| Manh mối gương mặt nhẹ | Sắc mặt tươi lên, tinh thần đầy đặn, cười tự nhiên | Trang điểm nhẹ (cực nhạt) |
| Manh mối công sở rõ ràng | Họp chính thức, dịp thương vụ, sự kiện quan trọng | Trang điểm trang trọng (có kiểm soát) |
| Manh mối thư giãn rõ ràng | Ra ngoài thường ngày, hẹn hò nhẹ nhàng, hoạt động cuối tuần | Trang điểm nhẹ/trang điểm nền |

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh áp dụng | Prompt cốt lõi |
|---|---|---|
| Trang điểm nude | Thường ngày, đi làm, thư giãn | trang điểm nude、nền trang điểm tự nhiên、trong trẻo |
| Trang điểm công sở | Họp, thương vụ, trang trọng | trang điểm công sở tinh tế、sắc sảo |
| Trang điểm hẹn hò | Hẹn hò, tiệc tối, tụ họp | trang điểm tinh tế、sắc mặt hồng hào |
| Trang điểm dự tiệc | Tiệc, biểu diễn, sự kiện | trang điểm tinh tế、khí trường |

### Nền da chung (mọi kiểu trang điểm đều dùng)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Da tự nhiên, giữ vân da | da tự nhiên、giữ vân da |
| Độ trắng | Màu da tự nhiên, không quá trắng | màu da tự nhiên、màu da khỏe |
| Ánh trong | Cảm giác bóng tự nhiên | da bóng khỏe |
| Cấm | Làm mịn quá tay/mặt nạ/cảm giác nhựa | — |

### Chi tiết trang điểm nền (bậc mặc định)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Lớp nền | Mỏng nhẹ trong trẻo, bóng tự nhiên | nền trang điểm mỏng nhẹ、bóng tự nhiên |
| Lông mày | Tỉa nhẹ theo dáng mày của bản gốc | tỉa mày tự nhiên、dáng mày sạch |
| Vùng mắt | Trang điểm mắt cực nhạt, nhấn sự trong trẻo | mắt trong trẻo、kẻ mắt cực nhạt |
| Gò má | Đẩy sắc mặt lên cực nhẹ | sắc má tự nhiên |
| Môi | Màu môi tự nhiên hoặc hồng nhạt | màu môi tự nhiên căng mọng |
| Tổng thể | Nhìn ra là có trang điểm, nhưng độ trang điểm rất nhẹ | trang điểm nền、giả mặt mộc |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Da tự nhiên, sạch sẽ tươi tắn | da tự nhiên、sạch sẽ tươi tắn |
| Nguyên tắc | Giả mặt mộc — nhìn như không trang điểm nhưng da cực đẹp | giả mặt mộc、da đẹp trời cho |
| Lông mày | Dáng mày tự nhiên, không kẻ mày | dáng mày tự nhiên |
| Màu môi | Sắc môi tự nhiên, hơi căng | màu môi tự nhiên |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Áp dụng | Prompt |
|---|---|---|---|
| Tóc dài tự nhiên | Tóc dài buông tự nhiên | Thường ngày, thư giãn | tóc dài tự nhiên、tóc dài xõa vai |
| Đuôi ngựa | Đuôi ngựa cao/thấp/nửa đầu | Vận động, đi làm | đuôi ngựa cao、đuôi ngựa gọn gàng |
| Búi tóc | Búi tóc/vấn tóc | Trang trọng, tiệc tối | búi tóc thanh lịch、búi thấp |
| Tóc ngắn | Tóc ngắn ngang vai/cắt bằng ngang vai | Thời trang, sắc sảo | tóc ngắn ngang vai、kiểu tóc bằng ngang vai |
| Tóc xoăn sóng | Xoăn nhẹ tự nhiên/sóng lớn | Hẹn hò, tiệc | tóc xoăn tự nhiên、kiểu tóc sóng |
| Buộc nửa | Buộc nửa xõa nửa, phụ kiện tóc đơn giản | Thường ngày, đi làm | tóc buộc nửa、tóc xõa nửa |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Tối giản hiện đại, ăn khớp với trang phục | phụ kiện tóc tối giản、phụ kiện tóc hiện đại |
| Chất liệu | Kim loại/da/acrylic | kẹp tóc kim loại、băng đô da |
| Chế tác | Chế tác tinh xảo, chi tiết rõ ràng | phụ kiện tóc tinh xảo、chi tiết rõ ràng |

### Các kiểu tạo hình nam

| Tạo hình | Áp dụng | Prompt |
|---|---|---|
| Tóc ngắn | Thường ngày, thương vụ, thư giãn | tóc ngắn、tóc ngắn tươi tắn |
| Tóc dài vừa | Thư giãn, nghệ sĩ | tóc dài vừa、tóc dài ngang vai |
| Rẽ ngôi lệch | Thương vụ, trang trọng | kiểu tóc rẽ ngôi lệch、kiểu tóc thương vụ |
| Tóc xoăn nhẹ | Thư giãn, thời trang | kiểu tóc xoăn nhẹ、kiểu tóc thời trang |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Áp dụng | Prompt |
|---|---|---|---|
| Trang phục công sở | Vest/sơ mi/chân váy bút chì | Công sở, họp | vest công sở、trang phục thương vụ |
| Thời trang thư giãn | Áo thun/quần jean/quần thư giãn | Thường ngày, thư giãn | phối đồ thư giãn、thời trang thường ngày |
| Phối đồ hẹn hò | Váy liền/sơ mi/chân váy | Hẹn hò, tụ họp | váy liền、phối đồ hẹn hò |
| Thể thao thư giãn | Đồ thể thao/áo hoodie/quần yoga | Vận động, thư giãn | đồ thể thao、thể thao thư giãn |
| Lễ phục dạ tiệc | Lễ phục/đồ dạ tiệc | Tiệc tối, sự kiện | dạ phục、lễ phục thanh lịch |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Phối theo bối cảnh, màu tự nhiên | màu tự nhiên、tông màu hài hòa |
| Chất liệu | Chất vải thật rõ nét | chất vải rõ nét |
| Chất bề mặt | Vân bề mặt bắt buộc cực sắc nét | chất vải quần áo rõ nét、vân bề mặt cực sắc nét |
| Lớp lang | Lớp lang rõ ràng, không chồng lớp quá tay | lớp lang rõ ràng、phối đồ tự nhiên |

### Ma trận trang phục nam

| Phong cách | Áp dụng | Prompt |
|---|---|---|
| Trang phục công sở | Vest/sơ mi/quần âu | Công sở, họp | vest thương vụ、trang phục trang trọng |
| Thời trang thư giãn | Sơ mi/áo thun/quần jean | Thường ngày, thư giãn | phối đồ thư giãn、thời trang thường ngày |
| Thể thao thư giãn | Đồ thể thao/áo hoodie/quần thể thao | Vận động, thư giãn | đồ thể thao、thể thao thư giãn |
| Thường ngày tối giản | Sơ mi tối giản/quần thư giãn | Thường ngày, đi làm | phối đồ tối giản、thư giãn thường ngày |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức | Tối giản tinh tế, không quá tay | hoa tai tối giản、dây chuyền tinh tế |
| Đồng hồ | Tối giản/thời trang, hợp phong cách | đồng hồ tối giản、đồng hồ đeo tay thời trang |
| Kính | Kính không độ/kính trang trí, sạch sẽ | kính、gọng kính rõ nét |
| Thắt lưng | Tối giản/thời trang, hợp với trang phục | thắt lưng、đai eo bản to |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Đồng hồ | Tối giản/thương vụ, hợp phong cách | đồng hồ tối giản、đồng hồ đeo tay thương vụ |
| Kính | Kính không độ/kính trang trí, sạch sẽ | kính、gọng kính rõ nét |
| Thắt lưng | Tối giản/thời trang, hợp với trang phục | thắt lưng、dây lưng da |
| Phụ kiện | Tối giản tinh tế, không quá tay | phụ kiện tối giản、chi tiết tinh xảo |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Bối cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Đi làm thường ngày | Trang điểm nude | Tóc dài tự nhiên/đuôi ngựa | Trang phục công sở/thời trang thư giãn | Đồng hồ/tối giản |
| Họp thương vụ | Trang điểm công sở | Búi tóc/đuôi ngựa | Trang phục công sở | Đồng hồ/trang sức tối giản |
| Thư giãn cuối tuần | Trang điểm nhẹ | Tóc dài tự nhiên | Thời trang thư giãn/thể thao thư giãn | Tối giản |
| Hẹn hò tụ họp | Trang điểm hẹn hò | Tóc xoăn sóng/búi tóc | Phối đồ hẹn hò | Trang sức tinh tế |
| Tiệc tối sự kiện | Trang điểm trang trọng | Búi tóc thanh lịch/tóc sóng | Lễ phục dạ tiệc | Trang sức tinh tế |
| Vận động thể hình | Trang điểm nude | Đuôi ngựa cao/búi củ tỏi | Thể thao thư giãn | Tối giản |

---

> **🔍 Quy tắc suy luận cho bối cảnh chưa có trong bảng**
>
> Khi bối cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen đô thị người thật tả thực |
> |---|---|
> | Mức trang điểm | Mặc định trang điểm nude (da tự nhiên); thương vụ/trang trọng → trang điểm công sở (sắc sảo tinh tế); hẹn hò/tụ họp → trang điểm hẹn hò (sắc mặt hồng hào); tiệc/biểu diễn → trang điểm dự tiệc; vận động/ngoài trời → trang điểm nude hoặc trang điểm nhẹ |
> | Kiểu tóc | Đi làm/công sở → đuôi ngựa hoặc buộc nửa; thư giãn/hẹn hò → tóc dài tự nhiên hoặc tóc xoăn sóng; vận động → đuôi ngựa cao hoặc búi củ tỏi; trang trọng → búi tóc thanh lịch; dịp thời trang → tóc ngắn |
> | Trang phục | Dịp quyết định độ chỉn chu; công sở → trang phục công sở; thư giãn → thời trang thường ngày; hẹn hò → váy liền/chân váy; vận động → thể thao thư giãn; tiệc tối → lễ phục; chất vải thật luôn được giữ |
> | Độ rườm rà của phụ kiện | Vận động → tối giản hoặc không; thường ngày → đồng hồ + tối giản; hẹn hò → trang sức tinh tế; tiệc tối → bộ tinh tế đầy đủ |
> | Chuẩn chất liệu | Neo vào nhiếp ảnh người thật tả thực; vân da tự nhiên + chi tiết sợi tóc luôn được giữ; cấm làm mịn quá tay/cảm giác nhựa/render 3D |

## 8. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail、makeup detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, toàn cảnh mặt trước của trang phục | front view、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn nghiêng | side view、profile、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Kiểu tóc sau gáy/trang phục phần lưng rõ ràng | back view、rear view、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm, chỉ giới hạn ở vi biểu cảm gương mặt |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không đổ bóng gắt |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/kiểu tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất | **Chỉ xuất phần văn bản prompt**, không xuất bất kỳ nội dung nào khác |
| Cấm xuất | Bảng tra nhanh, phương án dựng theo lớp, bảng ràng buộc thị giác, bảng mục cấm, phương án phái sinh, đề xuất đầu ra, bảng yếu tố cốt lõi và mọi nội dung không phải prompt |
| Cấm bối cảnh | Tài sản phái sinh nhân vật **không bao gồm mô tả bối cảnh/môi trường**, không xuất bất kỳ nội dung kể về bối cảnh/môi trường/thời tiết/phông nền |
| Cấm đạo cụ | **Không bao gồm bất kỳ tương tác đạo cụ nào**, không xuất điện thoại/chìa khóa/túi/bút/ly rượu hay vật cầm tay, vật tương tác nào |
| Cấm đổi tư thế | **Không đổi tư thế của bản gốc**, không xuất bất kỳ động tác nào như đi/ngoái nhìn/giơ tay/nghiêng người/chạy |
| Định dạng | Xuất thẳng khối mã prompt dùng được ngay, không cần tiêu đề, bảng, giải thích, so sánh phương án |

### Chồng lớp trang phục - trang điểm đầy đủ (bốn hướng nhìn)

```
lấy ảnh tạo hình nhân vật gốc làm ảnh nền，img2img chồng lớp trang phục - trang điểm，
bản vẽ bốn hướng nhìn nhân vật {giới tính} đô thị，nhiếp ảnh người thật tả thực，ghi chép hiện thực đô thị，tương phản mạnh，chi tiết tối đa，8K，siêu trung thực
character design sheet，character turnaround，
giữ nguyên gương mặt của tạo hình gốc，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm nền/trang điểm nhẹ/trang điểm trang trọng}; dùng {phong cách trang điểm}，da tự nhiên，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo hình}，tóc từng sợi rõ ràng，{mô tả phụ kiện tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{chế tác trang trí}，chất vải quần áo rõ nét，vân bề mặt cực sắc nét，
【L5·Phụ kiện】{trang sức đầu}，{trang sức tai}，{dây chuyền}，{đồng hồ}，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không đổ bóng gắt，
bốn hướng nhìn nhất quán，dựng hình gương mặt tinh tế，dựng hình sợi tóc tinh tế，chi tiết vân bề mặt cực sắc nét
trong hình không được có bất kỳ chữ nào
```


---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc giống bản gốc |
| R2 | Trang phục bắt buộc dùng "chất vải quần áo rõ nét + vân bề mặt cực sắc nét" |
| R3 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R4 | Bắt buộc xuất bản vẽ bốn hướng nhìn (chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau) |
| R5 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R6 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R7 | **Chỉ xuất prompt** — cấm xuất bảng tra nhanh/phương án theo lớp/ràng buộc thị giác/mục cấm/phương án phái sinh/đề xuất đầu ra hay bất kỳ nội dung nào không phải prompt |
| R8 | **Cấm chứa mô tả bối cảnh** — tài sản phái sinh nhân vật không đụng đến bối cảnh/môi trường/thời tiết/lời kể phông nền |
| R9 | **Cấm tương tác đạo cụ** — không chứa bất kỳ vật cầm tay/vật tương tác nào (điện thoại/túi/chìa khóa/bút...) |
| R10 | **Giữ nguyên tư thế** — bắt buộc giữ tư thế đứng tự nhiên của bản gốc |
| R11 | **L1 bắt buộc phân tích trước rồi mới quyết định** — trước hết phân tích manh mối gương mặt của người dùng, rồi mới chốt trang điểm nền/trang điểm nhẹ/trang điểm trang trọng |
| R12 | **Mọi tài sản phái sinh đều cần trang điểm - tạo hình** — trường hợp bình thường không để mặt mộc, ít nhất phải dùng trang điểm nền |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Gương mặt bị lệch sau khi chồng lớp |
| X2 | Trang điểm quá cường điệu/trang điểm đậm kiểu hiện đại |
| X3 | Phong cách trang điểm/trang phục xung đột nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Trang phục - trang điểm không nhất quán giữa bốn hướng nhìn |
| X6 | Xuất bất kỳ nội dung nào ngoài prompt (bảng/phương án/đề xuất/giải thích/biến thể...) |
| X7 | Thêm mô tả bối cảnh vào tài sản phái sinh nhân vật (trong nhà/ngoài trời/đường phố/thời tiết...) |
| X8 | Xuất các mục như "tra nhanh yếu tố cốt lõi", "phương án dựng theo lớp", "ràng buộc thị giác", "mục cấm", "phương án phái sinh" |
| X9 | Thêm bất kỳ tương tác đạo cụ nào (điện thoại/túi/chìa khóa/bút/ly rượu hay vật cầm tay khác) |
| X10 | Đổi tư thế của bản gốc (mô tả động tác như đi/ngoái nhìn/giơ tay/nghiêng người/chạy/cúi đầu) |
| X11 | Thêm mô tả liên kết biểu cảm với tư thế (ví dụ lối viết kể chuyện như "nghiêng người 45° vừa đi vừa khóe miệng cong nhẹ") |
| X12 | Áp thẳng một kiểu trang điểm cố định mà chưa phân tích manh mối người dùng |
| X13 | Sai lầm giữ mặt mộc, khiến tài sản phái sinh thiếu phần trang điểm - tạo hình đáng lẽ phải có |
