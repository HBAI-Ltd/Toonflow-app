# Tạo tài nguyên phái sinh nhân vật đất sét tĩnh vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc chồng lớp

1. **Gương mặt không đổi** — sau khi chồng lớp, ngũ quan bắt buộc giống hệt bản gốc
2. **Tư thế không đổi** — giữ tư thế đứng tự nhiên của bản gốc
3. **Kiểm soát theo từng lớp** — mô tả từng lớp độc lập để dễ thay theo lớp
4. **Thống nhất phong cách** — mọi yếu tố trang phục - trang điểm tuân theo cùng một hệ thẩm mỹ đất sét
5. **Chất liệu không tụt** — sau khi chồng lớp, chuẩn chất liệu đất sét không thấp hơn bản gốc
6. **Chỉ thuộc phạm trù trang phục - trang điểm** — chỉ chồng trang điểm/kiểu tóc/trang phục/phụ kiện, cấm đưa vào đạo cụ, bối cảnh, môi trường

---

## 2. Các lớp chồng

| Lớp | Nội dung | Diễn giải |
|---|---|---|
| L0 | Bản gốc | Bản tạo hình nhân vật gốc, không sửa |
| L1 | Trang điểm | Điểm xuyết màu trang trí cơ bản |
| L2 | Tạo hình tóc | Búi tóc/buộc tóc + phụ kiện tóc đơn giản |
| L3 | Áo trong/lớp lót | Thay cho áo trong nền màu trắng |
| L4 | Áo ngoài/trang phục chính | Áo khoác/áo choàng dài/áo ngoài |
| L5 | Phụ kiện | Trang sức đầu/tai/cổ/eo |

> **Ranh giới phạm vi**: tài nguyên phái sinh nhân vật chỉ gồm các lớp L0–L5 (trang phục - trang điểm - tạo hình), không gồm đạo cụ, môi trường bối cảnh, tư thế động tác.

---

## 3. Ràng buộc trang điểm (L1)

### Nguyên tắc quyết định ở L1

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không nhấn mạnh gương mặt rõ ràng | Chỉ đổi trang phục/kiểu tóc | Trang điểm trang trí cơ bản |
| Manh mối gương mặt nhẹ | Dịu dàng, mỉm cười, sắc mặt tươi lên | Trang điểm trang trí nhẹ |
| Manh mối bối cảnh rõ ràng | Đám cưới, lễ hội, dịp trang trọng | Trang điểm trang trí trang trọng |

### Ma trận phong cách trang điểm nữ

| Phong cách | Cảnh phù hợp | Prompt cốt lõi |
|---|---|---|
| Trang điểm mộc trong trẻo | Thường ngày, lần đầu gặp | trang điểm tự nhiên、trong trẻo thanh nhã |
| Trang điểm đào ấm ngọt | Ngọt ngào, hẹn hò | má hồng phấn、màu môi tông ấm |
| Trang điểm lễ hội cầu kỳ | Lễ hội, đại hôn | trang điểm đậm lộng lẫy、màu sắc phong phú |
| Trang điểm dạ tiệc | Đêm, tiệc tùng | phấn mắt tông ấm、màu môi ánh nhẹ |

### Nền da chung (mọi kiểu trang điểm dùng chung)

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chất liệu | Chất liệu đất sét lì mờ | đất sét lì mờ、matte clay |
| Độ sáng da | Màu kem tông ấm | da kem ấm、cream warm tone |
| Cấm | Điểm sáng bóng/da bóng dầu/hiệu ứng gương | — |

### Theo từng bộ phận (lấy trang điểm đào ấm ngọt làm ví dụ)

| Bộ phận | Ràng buộc | Prompt |
|---|---|---|
| Má hồng | Hồng ấm, quét nhẹ vùng gò má | má hồng ấm、gò má dịu |
| Phấn mắt | Hệ nâu ấm/cam, cực nhạt | phấn mắt nâu ấm、trang điểm mắt cực nhạt |
| Trang điểm môi | Hồng ấm/màu san hô, lì mờ | màu môi hồng ấm、trang điểm môi lì mờ |
| Lông mày | Mày cong tự nhiên, màu khớp với màu tóc | mày cong tự nhiên、dáng mày dịu |

### Trang điểm nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Nền da | Chất liệu đất sét lì mờ, be tông ấm | đất sét lì mờ、be tông ấm |
| Nguyên tắc | Giả mặt mộc — nhìn tự nhiên nhưng màu da đều | màu da tự nhiên、giả mặt mộc |
| Má hồng | Sắc mặt cực nhạt, không được đắp màu lộ rõ | sắc mặt cực nhạt、sắc mặt tự nhiên |
| Màu môi | Sắc môi tự nhiên, lì mờ | màu môi tự nhiên、môi lì mờ |

---

## 4. Ràng buộc tạo hình tóc (L2)

### Các kiểu tạo hình nữ

| Tạo hình | Mô tả | Phù hợp | Prompt |
|---|---|---|---|
| Búi nửa đầu | Búi trên đỉnh + tóc buông phía sau | Thường ngày, ra ngoài | búi nửa đầu、tóc vấn một nửa |
| Búi cao | Búi cao vấn lên, thanh lịch | Trang trọng, lễ hội | búi tóc cao、búi tóc thanh lịch |
| Búi thấp buông | Búi thấp lệch bên, uể oải | Riêng tư, thư giãn | búi thấp buông、kiểu tóc uể oải |
| Búi đôi | Hai búi đối xứng, thiếu nữ | Nhân vật trẻ | búi đôi、kiểu tóc thiếu nữ |
| Tóc xõa hoàn toàn | Tóc dài xõa hết | Bị thương, sa sút | tóc dài buông xõa、tóc mượt |

### Phụ kiện tóc nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Phong cách | Hoài cổ ấm cúng, không quá phức tạp | phụ kiện tóc hoài cổ、trang trí ấm cúng |
| Chất liệu | Chất liệu đất sét, kim loại đơn giản | phụ kiện tóc đất sét、kim loại đơn giản |
| Trang trí | Hoa/chuỗi hạt/dải ruy băng | phụ kiện tóc hình hoa、điểm xuyết chuỗi hạt |

### Các kiểu tạo hình nam

| Tạo hình | Phù hợp | Prompt |
|---|---|---|
| Buộc tóc nửa mũ | Thường ngày, giản dị | buộc tóc nửa mũ、buộc tóc tự nhiên |
| Vấn cao đội mũ | Trang trọng, đại lễ | vấn tóc cao đội mũ、kiểu tóc trang trọng |
| Tóc xõa qua vai | Riêng tư, thư giãn | tóc xõa qua vai、tóc dài tự nhiên |
| Buộc đuôi ngựa | Hành động, hoạt động | buộc đuôi ngựa、kiểu tóc gọn gàng |

---

## 5. Ràng buộc trang phục (L3+L4)

### Ma trận trang phục nữ

| Phong cách | Kiểu dáng | Phù hợp | Prompt |
|---|---|---|---|
| Váy dài thường ngày | Váy dài đơn giản | Thường ngày, thư giãn | váy dài đơn giản、trang phục thường ngày |
| Váy dài lễ phục | Váy dài xếp tầng | Trang trọng, lễ hội | váy dài xếp tầng、lễ phục lộng lẫy |
| Đồ thường nhẹ nhàng | Áo ngắn + chân váy | Hành động, hoạt động | đồ thường nhẹ nhàng、áo ngắn và chân váy |
| Đồ ngủ | Váy dài rộng rãi | Trong nhà, ban đêm | đồ ngủ rộng rãi、váy dài thoải mái |
| Áo cưới đại hôn | Váy dài xếp tầng màu đỏ | Đám cưới | áo cưới đỏ、trang phục đỏ xếp tầng |

### Ràng buộc chung cho trang phục nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu chính | Lấy tông ấm làm chính, bão hòa thấp | quần áo tông ấm、màu sắc dịu |
| Chất liệu | Tạo hình bằng đất sét, vân đơn giản | chất liệu đất sét、vân đơn giản |
| Chất cảm | Vân vải nhìn thấy rõ | chất vải rõ ràng |
| Lớp lang | Xếp tầng đơn giản, phân lớp rõ | xếp tầng đơn giản、phân lớp rõ |

### Ma trận trang phục nam

| Phong cách | Phù hợp | Prompt |
|---|---|---|
| Đồ thường hoài cổ | Thường ngày, ở nhà | áo dài hoài cổ、đồ thường ngày |
| Đồ gọn để vận động | Phiêu lưu, hành động | đồ gọn để vận động、trang phục phiêu lưu |
| Áo choàng ngoài | Ra mắt, đi đêm | áo choàng ngoài、áo choàng lớn màu tối |
| Đồ thường giản tiện | Thư giãn, riêng tư | đồ thường、đồ giản tiện |
| Lễ phục | Lễ hội, đại lễ | lễ phục、trang phục trang trọng |

---

## 6. Ràng buộc phụ kiện (L5)

### Phụ kiện nữ

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Trang sức đầu | Không quá phức tạp, phong cách ấm cúng | trang sức đầu đơn giản、trang trí ấm cúng |
| Trang sức tai | Khuyên nhỏ/bông tai | khuyên tai nhỏ、bông tai tinh xảo |
| Trang sức cổ | Dây chuyền/vòng cổ đơn giản | dây chuyền đơn giản、vòng cổ tinh xảo |
| Trang sức eo | Thắt lưng/miếng ngọc bội đơn giản | thắt lưng đơn giản、ngọc bội nhỏ xinh |
| Trang sức tay | Vòng tay đơn giản | vòng tay đơn giản、vòng tay nhỏ xinh |

### Phụ kiện nam

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Mũ tóc | Mũ tóc/trâm ngọc đơn giản | mũ tóc đơn giản、trâm ngọc vấn tóc |
| Đai lưng | Đai lưng/thắt lưng da đơn giản | đai lưng đơn giản、chất liệu rõ nét |
| Ngọc bội | Trong trẻo ấm mịn | ngọc bội bên hông、ngọc bội ấm mịn |
| Vật trang trí | Vật treo đơn giản/kiếm đeo bên hông (tùy chọn) | vật treo đơn giản、thanh kiếm nhỏ bên hông |

---

## 7. Tra nhanh tổ hợp trang phục - trang điểm

| Cảnh | Trang điểm | Kiểu tóc | Trang phục | Phụ kiện |
|---|---|---|---|---|
| Thường ngày trong phòng | Trang điểm mộc trong trẻo | Búi nửa đầu | Váy dài thường ngày | Đơn giản |
| Lần đầu gặp gỡ | Trang điểm mộc trong trẻo | Búi nửa đầu/búi cao | Váy dài thường ngày | Vừa phải |
| Tương tác ngọt ngào | Trang điểm đào ấm ngọt | Búi nửa đầu/búi thấp | Váy dài thường ngày | Vừa phải |
| Xuất hiện trang trọng | Trang điểm lễ hội cầu kỳ | Búi cao | Váy dài lễ phục | Cầu kỳ |
| Mật đàm ban đêm | Trang điểm mộc/đào ngọt | Xõa hoàn toàn/búi thấp | Đồ ngủ | Cực tối giản |
| Đại lễ thành hôn | Trang điểm lễ hội cầu kỳ | Búi cao | Áo cưới đại hôn | Cầu kỳ |

---

> **🔍 Quy tắc suy luận cho cảnh chưa có trong bảng**
>
> Khi cảnh/tình huống người dùng mô tả không có trong bảng trên, hãy tự suy luận theo gen cốt lõi của phong cách này:
>
> | Chiều suy luận | Gen đất sét tĩnh vật |
> |---|---|
> | Cường độ trang điểm | Mặc định trang điểm mộc trong trẻo (chất liệu đất sét lì mờ); ngọt ngào/thường ngày → trang điểm đào ấm ngọt; lễ hội/đại hôn → trang điểm lễ hội cầu kỳ; đêm/trong nhà → trang điểm dạ tiệc |
> | Kiểu tóc | Thường ngày → búi nửa đầu; trang trọng/lễ hội → búi cao; riêng tư/thư giãn → búi thấp buông hoặc tóc xõa hoàn toàn; mọi kiểu tóc đều giữ cảm giác tạo hình bằng đất sét |
> | Trang phục | Tông chủ đạo hoài cổ kỳ ảo; thường ngày → váy dài giản dị; trang trọng → váy dài lễ phục xếp tầng; hành động → đồ thường nhẹ nhàng; chất liệu luôn dùng tạo hình đất sét + vân đơn giản |
> | Độ cầu kỳ của phụ kiện | Giữ mức ấm cúng, không quá rườm rà; lễ hội → cầu kỳ (hoa + chuỗi hạt); thường ngày → đơn giản; hành động → cực tối giản |
> | Chuẩn chất liệu | Luôn khóa chất liệu đất sét lì mờ; cấm điểm sáng bóng/phản xạ kim loại; ưu tiên chất da màu kem tông ấm |

## 8. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ gương mặt đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan/trang điểm rõ | portrait closeup、face detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, thấy trọn mặt trước trang phục | front view、full body |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần, lớp lang trang phục nhìn từ bên | side view、profile、full body |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Phụ kiện tóc sau gáy/trang phục phần lưng/đuôi tóc rõ ràng | back view、rear view、full body |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Biểu cảm | Vi biểu cảm hợp với phong cách trang điểm, chỉ giới hạn ở vi biểu cảm trên gương mặt |
| Ánh sáng | Ánh sáng ấm dịu, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Gương mặt/trang điểm/kiểu tóc/phụ kiện tóc/trang phục/phụ kiện hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 9. Khuôn mẫu prompt

```
lấy ảnh tạo hình nhân vật gốc làm ảnh nền，bản vẽ bốn hướng nhìn của nhân vật {giới tính} đất sét tĩnh vật，phong cách hoạt hình tĩnh vật，render hoạt hình 3D，ánh sáng tông ấm，
character design sheet，character turnaround，
giữ nguyên gương mặt của tạo hình gốc，{khí chất tổng thể}，
【L1·Trang điểm】quyết định theo manh mối người dùng: {trang điểm trang trí cơ bản/trang điểm trang trí nhẹ/trang điểm trang trí trang trọng}; dùng {phong cách trang điểm}，chất liệu đất sét lì mờ，{trang điểm mày}，{trang điểm mắt}，{trang điểm môi}，
【L2·Kiểu tóc】{kiểu tạo hình}，kiểu tóc đất sét，{mô tả phụ kiện tóc}，
【L3+L4·Trang phục】{màu chính}{kiểu dáng}，{chất liệu}，{kỹ thuật trang trí}，chất vải rõ ràng，
【L5·Phụ kiện】{trang sức đầu}，{trang sức tai}，{trang sức cổ}，{trang sức eo}，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng ấm dịu，không bóng gắt，
bốn hướng nhìn nhất quán，vân đất sét render tinh tế，biểu cảm dịu dàng chữa lành
trong hình không được có bất kỳ chữ nào
```

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc khớp với bản gốc |
| R2 | Trang phục bắt buộc dùng "chất vải rõ ràng" |
| R3 | Phụ kiện nữ bắt buộc "không quá phức tạp, phong cách ấm cúng" |
| R4 | Trang điểm/kiểu tóc/trang phục/phụ kiện thống nhất phong cách |
| R5 | Bắt buộc xuất bản vẽ bốn hướng nhìn |
| R6 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R7 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R8 | **Chỉ xuất prompt** — cấm xuất nội dung không phải prompt |
| R9 | **Cấm chứa mô tả bối cảnh** |
| R10 | **Cấm tương tác đạo cụ** |
| R11 | **Giữ nguyên tư thế** |
| R12 | **L1 bắt buộc phân tích trước rồi mới quyết** |
| R13 | **Mọi tài nguyên phái sinh đều cần trang điểm - tạo hình** |
| R14 | **Cường độ trang điểm phải chừng mực** |
| R15 | **Đạo cụ/bối cảnh/động tác không phải căn cứ nâng cường độ** |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Sau khi chồng lớp, gương mặt bị lệch đi |
| X2 | Phụ kiện quá đơn giản/hiện đại hóa |
| X3 | Phong cách trang điểm/trang phục xung đột với nhau |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Trang phục - trang điểm - tạo hình không nhất quán giữa bốn hướng nhìn |
| X6 | Bất kỳ nội dung nào ngoài prompt |
| X7 | Thêm bất kỳ tương tác đạo cụ nào |
| X8 | Đổi tư thế bản gốc |
| X9 | Thêm mô tả nối biểu cảm với tư thế |
| X10 | Áp thẳng một kiểu trang điểm cố định mà chưa phân tích manh mối người dùng |
| X11 | Giữ mặt mộc sai chỗ |
| X12 | Nâng nhầm mức trang điểm chỉ vì từ ngữ về đạo cụ/bối cảnh/động tác |
