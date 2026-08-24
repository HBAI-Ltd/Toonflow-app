# art_character_3d.md
# Tạo hình ảnh nhân vật gốc anime 3D · Sổ tay ràng buộc

---

## 1. Nguyên tắc tạo hình gốc

1. **Gương mặt là linh hồn** — ngũ quan là điểm neo duy nhất của nhân vật, render tinh xảo ở mức cel-shading
2. **Lấy nhân vật làm gốc** — trang phục nền do mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh) quyết định, là bộ đồ thường ngày của họ; trang phục và trang điểm đặc thù về sau là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Ấm áp dễ thương chữa lành** — dù ở trạng thái không trang điểm vẫn phải toát lên khí chất nhân vật (vui vẻ/dịu dàng/tràn đầy sức sống)

---

## 2. Ràng buộc gương mặt

> Không cố định tham số ngũ quan nữa, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng lông mày/dáng mũi/dáng môi |
| Nền phong cách | Render anime 3D cel-shading, phối màu tông ấm, tỉ lệ hoạt hình, không khí vui tươi chữa lành |
| Khí chất | Bắt buộc chắt lọc từ khóa khí chất tổng thể từ mô tả nhân vật (như ấm áp/tràn đầy sức sống/chữa lành/rạng nắng) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Da trắng ấm, đều toàn thân, trong trẻo | da trắng ấm、da đào、peach skin |
| Độ bóng | Da phát sáng dịu, trong từ bên trong, không lì mờ | da phát sáng dịu、inner glow、soft glow |
| Chất liệu | Mịn màng trơn láng, chất render cel-shading | da mịn màng、chất liệu cel-shading |
| Phần da hở | Mặt/cổ/xương quai xanh/bàn tay | đường vai cổ đẹp、da trắng ấm trong trẻo |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Be tông ấm, trông khỏe khoắn, đều toàn thân | be tông ấm、màu da khỏe khoắn |
| Độ bóng | Sáng dịu tươi tắn, độ bóng tự nhiên | da phát sáng dịu、da trong trẻo tươi tắn |
| Chất liệu | Sạch mịn, độ bóng cel-shading | chất da mịn màng、gương mặt tươi tắn |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 155-165cm | {chiều cao}cm tall、{mô tả chiều cao như: petite girl} |
| Tỉ lệ đầu-thân | Sáu đến bảy đầu, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu | 6-7 heads tall proportion、dáng người nhỏ nhắn |
| Quy đổi chiều cao | Chiều dài đầu = chiều cao ÷ tỉ lệ đầu-thân (như 160cm ÷ 6.5 = 24.6cm chiều dài đầu) | tỉ lệ dễ thương、tỉ lệ đầu-thân hài hòa |
| Vai và cổ | Vai cổ mềm mượt, đường nét uyển chuyển | đường vai mềm mượt、cổ đẹp |
| Bàn tay | Nhỏ nhắn tròn trịa, đốt ngón mềm | bàn tay nhỏ tròn trịa、đốt ngón rõ nét |
| Dáng đứng | Thiếu nữ tràn đầy sức sống, dáng nhẹ nhõm | dáng nhẹ nhõm、thân hình linh hoạt |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 170-180cm | {chiều cao}cm tall、{mô tả chiều cao như: tall cute boy} |
| Tỉ lệ đầu-thân | Sáu đầu rưỡi đến bảy đầu rưỡi, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu | 6.5-7.5 heads tall proportion、dáng người cân đối |
| Quy đổi chiều cao | Chiều dài đầu = chiều cao ÷ tỉ lệ đầu-thân (như 175cm ÷ 7 = 25cm chiều dài đầu) | tỉ lệ dễ thương、tỉ lệ đầu-thân hài hòa |
| Vai và cổ | Vai tròn trịa, cổ tự nhiên | vai tròn trịa、đường cổ tự nhiên |
| Bàn tay | Lòng bàn tay tròn trịa, đốt ngón mềm | lòng bàn tay tròn trịa、đốt ngón rõ nét |
| Dáng đứng | Chàng trai rạng nắng/đàn anh dịu dàng (tùy nhân vật) | thân hình thẳng thắn、dáng vẻ rạng nắng |

### Bảng quy đổi chiều cao - tỉ lệ đầu-thân

| Chiều cao (cm) | Tỉ lệ đầu-thân | Chiều dài đầu (cm) | Mô tả phù hợp |
|---|---|---|---|
| 150-155 | 6.0 | ~25cm | Nhỏ nhắn dễ thương |
| 155-160 | 6.0-6.5 | ~25cm | Ngọt ngào nhỏ nhắn |
| 160-165 | 6.5 | ~24.6cm | Thiếu nữ trong trẻo (mặc định nữ) |
| 165-170 | 6.5-7.0 | ~25cm | Thiếu nữ thon dài |
| 170-175 | 7.0 | ~25cm | Thiếu niên thanh tú |
| 175-180 | 7.0-7.5 | ~25cm | Chàng trai rạng nắng (mặc định nam) |
| 180-185 | 7.5 | ~25cm | Đẹp trai cao ráo |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa tóc xõa tự nhiên/buộc đơn giản, phụ kiện tóc được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Nâu ấm/hạt dẻ nhạt/nâu sô-cô-la | tóc dài nâu ấm、hạt dẻ ánh vàng |
| Độ dài tóc | Ngang vai hoặc tóc dài | tóc dài ngang vai |
| Chất tóc | Tách bạch từng sợi, lọn tóc rõ, chất liệu cel-shading | sợi tóc tách bạch từng sợi、sợi tóc render tinh tế |
| Tạo hình | Xõa tự nhiên, rẽ giữa/rẽ lệch, không phụ kiện tóc | tóc dài buông tự nhiên、mượt như thác |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Nâu ấm/nâu cà phê đậm | tóc ngắn nâu đậm、tóc màu cà phê |
| Độ dài tóc | Tóc ngắn đến trung bình dài | tóc ngắn、tóc ngắn ngang tai |
| Chất tóc | Tách bạch từng sợi, chất tóc rõ ràng | sợi tóc tách bạch từng sợi、sợi tóc render tinh tế |
| Tạo hình | Xõa tự nhiên hoặc rẽ lệch, không phụ kiện tóc | tóc ngắn buông tự nhiên、kiểu tóc rẽ lệch |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền là bộ đồ thường ngày tự nhiên nhất theo mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh), đóng vai trò "trạng thái mặc định thường ngày" của nhân vật; lễ phục/phái sinh đặc biệt được chồng thêm ở khâu phái sinh trang phục - trang điểm. **Cấm mặc đồ lót làm lớp nền.**

### Nguyên tắc chọn trang phục

| Thân phận nhân vật | Hướng trang phục mặc định |
|---|---|
| Học sinh | Đồng phục / đồ học đường |
| Dân văn phòng | Đồ công sở thoải mái (áo sơ mi + quần/váy, vest nhẹ) |
| Ở nhà/thư giãn | Đồ thường ngày kiểu đô thị (áo nỉ/áo thun + quần/váy liền) |
| Tràn đầy sức sống/năng động | Bộ đồ thể thao / đồng phục cách điệu |
| Nghề đặc thù | Trang phục đúng thân phận (bác sĩ/cảnh sát/giáo viên...) |
| Mô tả nhân vật không nói rõ | Đồ thường ngày kiểu đô thị, phối màu tông ấm |

### Quy tắc thống nhất trang phục

- Phong cách trang phục phải nhất quán với thẩm mỹ render cel-shading anime 3D (phối màu tông ấm, tỉ lệ hoạt hình)
- Màu sắc lấy tông ấm làm chính, không hoa văn/trang trí phức tạp, để dễ chồng lớp phái sinh về sau
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền là "trạng thái mặc định thường ngày", trọng tâm vẫn nằm ở gương mặt và dáng người
- Nghiêm cấm lớp nền là đồ lót/hở hang/tình dục hóa

---

## 7. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Hiện đủ từ đỉnh đầu đến xương quai xanh không cắt cúp, khuôn mặt chiếm 60%+, ngũ quan rõ | portrait closeup、face detail、head to collarbone complete、no crop |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, hai tay tự nhiên, hiện đủ từ đỉnh đầu đến gót chân | front view、full body head to toe、height mark |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | side view、profile、full body head to toe、height mark |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Sau gáy/lưng/đuôi tóc/bàn chân rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | back view、rear view、full body head to toe、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp đỉnh đầu hay bàn chân |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu, tóc, trán, cằm đều phải đủ |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

```
bản vẽ bốn hướng nhìn của nhân vật {giới tính}，render 3D animation，ánh sáng điện ảnh，chất liệu cel-shading sống động，chất liệu chi tiết cao，không khí vui tươi chữa lành，phong cách đô thị hoạt hình，chất liệu hoạt hình chi tiết cao，tỉ lệ hoạt hình vừa phải，phối màu tông ấm，8K siêu nét，bố cục điện ảnh，lớp sáng tối dịu，phong cách render hoạt hình tươi sáng，ấm áp chữa lành，
character design sheet，character turnaround，
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả}，{khí chất tổng thể}，mặt mộc không trang điểm，
{màu da}，da phát sáng dịu，da trong và phát sáng，da mịn màng，chất liệu cel-shading，
{mô tả chiều cao, ví dụ: 165cm tall、petite cute girl}，{tỉ lệ đầu-thân, ví dụ: 6.5 heads tall proportion}，{mô tả vóc dáng}，{mô tả dáng đứng}，
{màu tóc}{độ dài tóc}，sợi tóc tách bạch từng sợi，{tạo hình nền}，không phụ kiện tóc，
{trang phục thường ngày ứng với thân phận nhân vật, ví dụ: đồng phục/đồ công sở/đồ thường ngày kiểu đô thị}，tông ấm，không hoa văn phức tạp，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh，không cắt cúp đỉnh đầu，head to collarbone complete，
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân，full body head to toe，không cắt cúp đỉnh đầu và bàn chân，
đứng tự nhiên，phông nền xám trung tính tinh khiết，ánh sáng dịu đều，không bóng gắt，
bốn hướng nhìn nhất quán，gương mặt render tinh tế，sợi tóc render tinh tế
trong hình không được có bất kỳ chữ nào
```


---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở trạng thái "mặt mộc không trang điểm" |
| R2 | Bắt buộc dựa vào mô tả nhân vật để tuyên bố bộ đồ thường ngày phù hợp làm trang phục nền (ví dụ học sinh → đồng phục, dân văn phòng → đồ công sở, ở nhà → đồ thường ngày kiểu đô thị); cấm mặc đồ lót làm lớp nền |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc tuyên bố chiều cao nhân vật và quy đổi qua tỉ lệ đầu-thân để ràng buộc tỉ lệ toàn thân (nữ mặc định 155-165cm/6-7 đầu, nam mặc định 170-180cm/6.5-7.5 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Lớp nền là đồ lót/hở hang/tình dục hóa; trang phục lệch rõ so với mô tả nhân vật; hoa văn/trang trí quá phức tạp gây cản trở việc chồng lớp trang phục - trang điểm về sau |
| X2 | Ánh sáng gắt từ đỉnh đầu/ánh sáng hắt từ dưới lên/ánh sáng màu |
| X3 | Làm trắng quá mức đến mức không còn sắc máu / màu da xám xịt |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hoặc gót chân, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân, chiều cao bắt buộc được tuyên bố rõ và thể hiện tỉ lệ toàn thân qua quy đổi đầu-thân |