# Tạo hình ảnh nhân vật gốc · Sổ tay ràng buộc tả thực đô thị

---

## 1. Nguyên tắc tạo hình gốc

1. **Gương mặt là linh hồn** — ngũ quan là điểm neo duy nhất của nhân vật, dựng hình tinh xảo đến từng lỗ chân lông
2. **Lấy nhân vật làm gốc** — trang phục nền do mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh) quyết định, là bộ đồ thường ngày của họ; trang phục và trang điểm đặc thù về sau là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Tự nhiên và chân thực** — dù để mặt mộc vẫn phải toát lên khí chất nhân vật (sắc sảo/dịu dàng/lạnh lùng/thân thiện)
5. **Chụp thật** — lấy nhiếp ảnh thật làm điểm neo, giữ chất da chân thực (lỗ chân lông/khuyết điểm nhỏ)

---

## 2. Ràng buộc gương mặt

> Không cố định tham số ngũ quan nữa, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng lông mày/dáng mũi/dáng môi |
| Nền phong cách | Nhiếp ảnh người thật tả thực, dựng hình tinh xảo đến từng lỗ chân lông, chất liệu tả thực, ánh sáng đổ bóng tự nhiên |
| Khí chất | Bắt buộc chắt lọc từ khóa khí chất tổng thể từ mô tả nhân vật (như sắc sảo/dịu dàng/lạnh lùng/thân thiện) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Màu da tự nhiên, đều toàn thân, có thể thiên trắng/thiên vàng | màu da tự nhiên、màu da đều |
| Độ bóng | Bóng tự nhiên, không lì mờ cũng không bóng dầu | da tự nhiên、bóng khỏe |
| Chất liệu | Mịn, giữ chút chất lỗ chân lông, có thể có khuyết điểm nhỏ | da mịn、lỗ chân lông thấy nhẹ |
| Phần da hở | Mặt/cổ/xương quai xanh/bàn tay/một phần cánh tay | đường vai cổ tự nhiên、làn da khỏe |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Màu da tự nhiên, có thể thiên màu lúa mì, đều toàn thân | màu da tự nhiên、màu da khỏe |
| Độ bóng | Bóng tự nhiên, cảm giác sạch sẽ | da tự nhiên、chất da sạch sẽ |
| Chất liệu | Sạch sẽ gọn gàng, thấy lỗ chân lông, có thể có khuyết điểm li ti | chất da chân thực、lỗ chân lông rõ |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 155-175cm | {chiều cao}cm tall |
| Tỉ lệ đầu-thân | Bảy đến tám đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7-8 heads tall proportion |
| Vai và cổ | Đường vai cổ tự nhiên, thấy xương quai xanh | đường vai cổ tự nhiên |
| Bàn tay | Dáng tay tự nhiên, đốt ngón bình thường, móng gọn gàng | bàn tay tự nhiên、ngón tay thon dài |
| Dáng người | Đứng tự nhiên, dáng thư thái | dáng tự nhiên、thân hình thư thái |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 170-185cm | {chiều cao}cm tall |
| Tỉ lệ đầu-thân | Bảy đầu rưỡi đến tám đầu rưỡi, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7.5-8.5 heads tall proportion |
| Vai và cổ | Vai tự nhiên, cổ rắn rỏi | vai tự nhiên、đường vai cổ |
| Bàn tay | Dáng tay tự nhiên, lòng bàn tay vừa phải, đốt ngón bình thường | bàn tay tự nhiên、ngón tay thon dài |
| Dáng người | Đứng tự nhiên, dáng thẳng thớm | thân hình thẳng thớm、dáng tự nhiên |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa tóc xõa tự nhiên/buộc đơn giản, phụ kiện tóc được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Màu tóc tự nhiên (đen/nâu đậm), cấm tẩy màu/nhuộm màu | màu tóc tự nhiên、nâu đậm |
| Độ dài tóc | Ngang vai/ngang eo hoặc dài hơn, do hồ sơ nhân vật quyết định | tóc dài tự nhiên、tóc ngang vai |
| Chất tóc | Sợi tóc rõ nét, chất liệu chân thực | tóc từng sợi rõ ràng |
| Tạo hình | Xõa tự nhiên, đuôi ngựa đơn giản/buộc nửa, không phụ kiện tóc | kiểu tóc tự nhiên、không phụ kiện tóc |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Màu tóc tự nhiên (đen/nâu đậm), cấm tẩy màu | màu tóc tự nhiên、đen/nâu đậm |
| Độ dài tóc | Tóc ngắn/dài vừa, do hồ sơ nhân vật quyết định | tóc ngắn、tóc dài vừa ngang vai |
| Chất tóc | Sợi tóc rõ nét, chất liệu chân thực | tóc từng sợi rõ ràng |
| Tạo hình | Xõa tự nhiên/buộc đơn giản, không phụ kiện tóc | kiểu tóc tự nhiên、không phụ kiện tóc |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền là bộ đồ thường ngày tự nhiên nhất theo mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh), đóng vai trò "trạng thái mặc định thường ngày" của nhân vật; lễ phục/phái sinh đặc biệt được chồng thêm ở khâu phái sinh trang phục - trang điểm. **Cấm mặc đồ lót làm lớp nền.**

### Nguyên tắc chọn trang phục

| Thân phận nhân vật | Hướng trang phục mặc định |
|---|---|
| Học sinh | Đồng phục hiện đại / đồ học đường |
| Dân văn phòng | Đồ công sở thoải mái (áo sơ mi + quần/váy, vest) |
| Ở nhà/thư giãn | Đồ đô thị thoải mái (áo hoodie/áo thun + quần jean/váy liền) |
| Thời trang/hẹn hò | Đồ đô thị hợp mốt |
| Nghề đặc thù | Trang phục đúng thân phận (bác sĩ/cảnh sát/giáo viên...) |
| Mô tả nhân vật không nói rõ | Đồ thường ngày đô thị, tông trung tính độ bão hòa thấp |

### Quy tắc thống nhất trang phục

- Phong cách trang phục phải nhất quán với thẩm mỹ nhiếp ảnh tả thực đô thị (tông màu tự nhiên, chất liệu tả thực)
- Màu trung tính độ bão hòa thấp, không hoa văn/trang trí phức tạp, để dễ chồng lớp phái sinh về sau
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền là "trạng thái mặc định thường ngày", trọng tâm vẫn nằm ở gương mặt và dáng người
- Nghiêm cấm lớp nền là đồ lót/hở hang/tình dục hóa

---

## 7. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Hiện đủ từ đỉnh đầu đến xương quai xanh, khuôn mặt chiếm 60%+, ngũ quan rõ | portrait closeup、face detail、head to collarbone complete |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, hai tay tự nhiên, hiện đủ từ đỉnh đầu đến gót chân | front view、full body head to toe |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | side view、profile、full body head to toe |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Sau gáy/lưng/đuôi tóc/bàn chân rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | back view、rear view、full body head to toe |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không đổ bóng gắt |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

```
bản vẽ bốn hướng nhìn của nhân vật {giới tính}，nhiếp ảnh người thật tả thực，ghi chép hiện thực đô thị，tương phản mạnh，chi tiết tối đa，
character design sheet，character turnaround，
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả}，{khí chất tổng thể}，trạng thái tự nhiên，
{màu da}，da tự nhiên，da khỏe，da mịn，lỗ chân lông thấy nhẹ，
{mô tả chiều cao, ví dụ: 170cm tall、tall slender woman}，{tỉ lệ đầu-thân, ví dụ: 7.5 heads tall proportion}，{mô tả vóc dáng}，{mô tả dáng người}，
{màu tóc}{độ dài tóc}，tóc từng sợi rõ ràng，{tạo hình nền}，không phụ kiện tóc，
{trang phục thường ngày ứng với thân phận nhân vật, ví dụ: đồng phục hiện đại/đồ công sở/đồ đô thị thoải mái}，màu trung tính độ bão hòa thấp，không hoa văn phức tạp，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh，không cắt cúp đỉnh đầu，
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân，không cắt cúp đỉnh đầu và bàn chân，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không đổ bóng gắt，
bốn hướng nhìn nhất quán，dựng hình gương mặt tinh tế，dựng hình sợi tóc tinh tế，chất da chân thực
trong hình không được có bất kỳ chữ nào
```


---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở "trạng thái tự nhiên"|
| R2 | Bắt buộc dựa vào mô tả nhân vật để tuyên bố bộ đồ thường ngày phù hợp làm trang phục nền (ví dụ học sinh → đồng phục, dân văn phòng → đồ công sở, ở nhà → đồ đô thị thoải mái); cấm mặc đồ lót làm lớp nền |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc tuyên bố chiều cao nhân vật và quy đổi qua tỉ lệ đầu-thân để ràng buộc tỉ lệ toàn thân |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |
| R9 | Da bắt buộc giữ chất liệu chân thực, không được làm mịn quá tay |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Lớp nền là đồ lót/hở hang/tình dục hóa; trang phục lệch rõ so với mô tả nhân vật; hoa văn/trang trí quá phức tạp gây cản trở việc chồng lớp trang phục - trang điểm về sau |
| X2 | Đèn gắt đỉnh đầu/đèn hắt từ dưới/đèn màu |
| X3 | Làm trắng quá tay/làm mịn quá tay đến mất chất da |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hoặc gót chân, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân |
