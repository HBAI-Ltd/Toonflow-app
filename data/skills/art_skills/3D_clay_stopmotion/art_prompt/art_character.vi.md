# Tạo hình ảnh nhân vật gốc đất sét tĩnh vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc tạo hình gốc

1. **Vân đất sét là linh hồn** — bề mặt thấy rõ dấu vết nặn tay, vết lõm ngón tay/vân đất sét phân biệt được rõ ràng
2. **Mẫu nền hoạt hình 3D** — lớp nền là nhân vật đất sét tạo hình đơn giản hóa, trang phục và trang điểm về sau đều là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Không khí chữa lành** — dù ở trạng thái không trang điểm vẫn phải toát lên tính cách nhân vật (dịu dàng/tròn trịa/gần gũi)

---

## 2. Ràng buộc gương mặt

> Không cố định tham số ngũ quan nữa, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng lông mày/dáng mũi/dáng môi; giữ cảm giác tròn trịa của đất sét trên tổng thể (không góc cạnh sắc nhọn) |
| Nền phong cách | Hoạt hình đất sét tĩnh vật, render hoạt hình 3D, chất liệu đất sét lì mờ, ánh sáng tông ấm |
| Khí chất | Bắt buộc chắt lọc từ khóa khí chất tổng thể từ mô tả nhân vật (như ấm áp chữa lành/điềm đạm đáng tin/hoạt bát gần gũi) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Màu kem tông ấm, dịu và đều | da màu kem ấm、màu da dịu |
| Độ bóng | Chất liệu đất sét lì mờ, không có điểm sáng bóng | chất liệu đất sét lì mờ、matte clay texture |
| Chất liệu | Vân đất sét rõ nét, thấy được dấu vết nặn | bề mặt đất sét、dấu vết nặn tay |
| Phần da hở | Mặt/cổ/bàn tay | da ấm mịn、chất liệu đất sét |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Be tông ấm, dịu và đều | da be tông ấm、màu da dịu |
| Độ bóng | Chất liệu đất sét lì mờ, không có điểm sáng bóng | chất liệu đất sét lì mờ、matte clay texture |
| Chất liệu | Vân đất sét rõ nét, thấy được vết lõm ngón tay | bề mặt đất sét、dấu vết thủ công rõ |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Mặc định 155-165cm, thể hiện qua tỉ lệ đầu-thân | {chiều cao}cm tall |
| Tỉ lệ đầu-thân | Sáu đến bảy đầu, đầu to thân nhỏ | 6-7 heads tall、tỉ lệ tròn trịa |
| Vai và cổ | Đường vai tròn trịa, không góc cạnh sắc nhọn | vai cổ tròn trịa、đường nét mềm mại |
| Bàn tay | Ngón tay tròn trịa, khớp đơn giản hóa | bàn tay nhỏ tròn trịa、chi tiết bàn tay đơn giản hóa |
| Dáng đứng | Đường cong mềm mại, không dáng vẻ hung hăng | dáng mềm mại、đường cong tròn trịa |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Mặc định 170-180cm, thể hiện qua tỉ lệ đầu-thân | {chiều cao}cm tall |
| Tỉ lệ đầu-thân | Sáu đầu rưỡi đến bảy đầu rưỡi | 6.5-7.5 heads tall、tỉ lệ tròn trịa |
| Vai và cổ | Vai rộng tròn trịa, phần vai mềm | vai tròn trịa、đường vai hiền hòa |
| Bàn tay | Lòng bàn tay tròn trịa, đốt ngón đơn giản hóa | lòng bàn tay tròn trịa、đốt ngón đơn giản hóa |
| Dáng đứng | Điềm đạm đường hoàng, đường nét mềm mại | dáng điềm đạm、đường nét tròn trịa |

---

## 5. Ràng buộc kiểu tóc nền

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Nâu ấm, hạt dẻ, nâu sẫm và các hệ màu tự nhiên | tóc dài nâu ấm、tóc hạt dẻ |
| Độ dài tóc | Ngang vai hoặc ngang eo | tóc dài ngang vai |
| Chất tóc | Tạo hình bằng đất sét, lọn tóc thành khối | kiểu tóc đất sét、lọn tóc dạng khối |
| Tạo hình | Buông tự nhiên, buộc đơn giản, không phụ kiện tóc phức tạp | lọn tóc tự nhiên、buộc tóc đơn giản |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Nâu ấm, nâu sẫm, đen | tóc ngắn nâu ấm、kiểu tóc màu tối |
| Độ dài tóc | Tóc ngắn hoặc trung bình dài | tóc ngắn、tóc trung bình dài |
| Chất tóc | Tạo hình bằng đất sét, lọn tóc thành khối | kiểu tóc đất sét、lọn tóc dạng khối |
| Tạo hình | Buông tự nhiên, buộc đơn giản | lọn tóc tự nhiên、kiểu tóc đơn giản |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền là tạo hình đơn giản hóa, không có chi tiết phức tạp.

### Trang phục nền của nữ

Váy liền đơn giản hóa hoặc áo + chân váy, màu tông ấm bão hòa thấp, không hoa văn trang trí.

### Trang phục nền của nam

Áo sơ mi + quần đơn giản hóa, màu tông ấm bão hòa thấp, không hoa văn trang trí.

### Quy tắc thống nhất trang phục

- Phong cách trang phục thống nhất, bảo đảm việc chồng lớp trang phục về sau không bị nhiễu màu
- Che phủ về cơ bản, trừ mặt/bàn tay/cổ
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền chỉ là lớp nền an toàn, trọng tâm nằm ở gương mặt và dáng người

---

## 7. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Khuôn mặt chiếm 60%+, ngũ quan rõ | portrait closeup、face detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, đủ từ đỉnh đầu đến gót chân | front view、full body |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng rõ ràng, đủ từ đầu đến chân | side view、profile、full body |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Sau gáy/lưng/đuôi tóc/bàn chân rõ ràng | back view、rear view、full body |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đầu đến chân, nghiêm cấm cắt cúp |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp |
| Biểu cảm | Vi biểu cảm trung tính, hợp với tính cách nhân vật |
| Ánh sáng | Ánh sáng ấm dịu, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

```
bản vẽ bốn hướng nhìn của nhân vật {giới tính} đất sét tĩnh vật，phong cách hoạt hình tĩnh vật，render hoạt hình 3D，ánh sáng tông ấm，
character design sheet，character turnaround，
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả, giữ cảm giác tròn trịa của đất sét trên tổng thể}，{khí chất tổng thể}，
{màu da}，chất liệu đất sét lì mờ，vân đất sét rõ nét，dấu vết nặn tay，
{mô tả chiều cao}，{tỉ lệ đầu-thân, ví dụ: 7 heads tall proportion}，{mô tả vóc dáng}，{mô tả dáng đứng}，
{màu tóc}{độ dài tóc}，kiểu tóc đất sét，{tạo hình nền}，không phụ kiện tóc phức tạp，
(nữ: váy liền đơn giản hóa / nam: áo sơ mi + quần đơn giản hóa)，tông ấm bão hòa thấp，không hoa văn，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh，head to collarbone complete，
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân，full body head to toe，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng ấm dịu，không bóng gắt，
bốn hướng nhìn nhất quán，vân đất sét render tinh tế，biểu cảm dịu dàng chữa lành
trong hình không được có bất kỳ chữ nào
```

---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở trạng thái "chất liệu đất sét lì mờ" |
| R2 | Bắt buộc tuyên bố trang phục nền (nữ: váy liền đơn giản hóa; nam: áo sơ mi + quần đơn giản hóa) |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc phức tạp, không phụ kiện hiện đại" |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đầu đến chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc chỉ định chiều cao nhân vật và ràng buộc tỉ lệ toàn thân qua tỉ lệ đầu-thân (mặc định 6-7 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Chất ảnh chụp người thật/độ chân thực như ảnh chụp |
| X2 | Ánh sáng lạnh gắt/bóng gắt/tương phản cao |
| X3 | Góc cạnh sắc nhọn/dáng vẻ hung hăng |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hoặc gót chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân |
