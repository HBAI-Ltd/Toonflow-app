# Tạo hình nền nhân vật anime · Sổ tay ràng buộc

---

## 1. Nguyên tắc tạo hình nền

1. **Gương mặt là linh hồn** — ngũ quan là điểm neo duy nhất của nhân vật, độ tinh xảo khớp với phong cách anime
2. **Lấy nhân vật làm gốc** — trang phục nền do mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh) quyết định, là bộ đồ thường ngày của họ; trang phục và trang điểm đặc thù về sau là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Truyền tải cảm xúc** — dù để mặt mộc vẫn phải toát ra khí chất nhân vật (lạnh lùng/dịu dàng/quyến rũ/lạnh nghiêm)

---

## 2. Ràng buộc gương mặt

> Không còn cố định tham số đặc điểm ngũ quan, mà để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự do sinh ngũ quan, bảo đảm các nhân vật khác biệt nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng mày/dáng mũi/dáng môi |
| Nền phong cách | Phong cách anime, tô màu kiểu cel, tông màu lạnh độ bão hòa thấp, bố cục đẳng cấp điện ảnh |
| Khí chất | Bắt buộc chắt ra từ khóa khí chất tổng thể từ mô tả nhân vật (như lạnh lùng/ôn hòa/quyến rũ) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Da trắng lạnh, đều toàn thân, trắng trong | da trắng lạnh、làn da trắng |
| Độ bóng | Cảm giác sáng dịu, không lì cũng không bóng dầu | da sáng dịu、da mịn màng |
| Chất liệu | Mịn màng trơn láng, chất cảm kiểu cel | da mịn、chất da |
| Vùng hở da | Mặt/cổ/xương quai xanh/bàn tay | đường vai cổ đẹp、làn da trắng |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Trắng sáng, có nét khỏe khoắn, đều toàn thân | màu da trắng、màu da khỏe khoắn |
| Độ bóng | Cảm giác sáng khoáng đạt, độ bóng tự nhiên | da khoáng đạt、da sáng trong |
| Chất liệu | Sạch gọn dứt khoát, độ bóng kiểu cel | chất da mịn màng、gương mặt lạnh trong |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 160-170cm, chiều cao thể hiện qua quy đổi tỉ lệ đầu-thân | `{chiều cao}cm tall`、`{mô tả chiều cao, ví dụ: tall slender woman}` |
| Tỉ lệ đầu-thân | Sáu đầu rưỡi đến bảy đầu rưỡi, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | `6.5-7.5 heads tall proportion`、dáng người thon dài |
| Vai và cổ | Đường vai mảnh, xương quai xanh lộ rõ | đường vai mảnh、xương quai xanh rõ |
| Bàn tay | Thon dài trắng trẻo, đốt ngón rõ, năm ngón bình thường | bàn tay thon đẹp、đốt ngón rõ |
| Dáng người | Phụ nữ đô thị hiện đại, dáng tự nhiên | dáng tự nhiên、thân hình thanh nhã |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 175-185cm, chiều cao thể hiện qua quy đổi tỉ lệ đầu-thân | `{chiều cao}cm tall`、`{mô tả chiều cao, ví dụ: tall imposing man}` |
| Tỉ lệ đầu-thân | Bảy đầu đến tám đầu, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | `7-8 heads tall proportion`、dáng người cao ráo |
| Vai và cổ | Vai rộng, cổ chắc khỏe | vai rộng eo thon |
| Bàn tay | Đốt xương rõ, lòng bàn tay rộng, năm ngón bình thường | ngón tay đốt xương rõ |
| Dáng người | Đàn ông đô thị hiện đại, dáng tự nhiên | thân hình thẳng thớm、dáng ung dung |

### Bảng quy đổi chiều cao - tỉ lệ đầu-thân

| Chiều cao (cm) | Tỉ lệ đầu-thân | Chiều dài đầu (cm) | Mô tả phù hợp |
|---|---|---|---|
| 155-160 | 6.5-7.0 | ~22cm | Nhỏ nhắn xinh xắn |
| 160-165 | 7.0-7.5 | ~22cm | Mảnh mai thon dài |
| 165-170 | 7.0-7.5 | ~22cm | Cao ráo thanh nhã (mặc định cho nữ) |
| 170-175 | 7.5-8.0 | ~22cm | Thon dài thẳng thớm |
| 175-180 | 7.5-8.0 | ~22cm | Cao lớn tuấn tú (mặc định cho nam) |
| 180-185 | 8.0 | ~22.5cm | Cao lớn hiên ngang |
| 185-190 | 8.0-8.5 | ~22cm | Cao lớn vạm vỡ |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa tóc xõa tự nhiên/buộc đơn giản, phụ kiện tóc được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền, xanh sẫm hoặc nâu sẫm, cấm nhuộm highlight | tóc dài màu đen、tóc dài màu sẫm |
| Độ dài tóc | Ngang vai, ngang eo hoặc dài hơn | tóc dài ngang vai、tóc dài ngang eo |
| Chất tóc | Phân lớp rõ ràng, đường nét rõ | sợi tóc phân lớp rõ ràng、render sợi tóc tinh tế |
| Tạo hình | Xõa tự nhiên, rẽ giữa/rẽ lệch, không phụ kiện tóc | tóc dài buông tự nhiên、tóc dài mượt |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền hoặc nâu sẫm | tóc đen、tóc ngắn/tóc trung màu sẫm |
| Độ dài tóc | Tóc ngắn đến trung dài | tóc ngắn、tóc trung dài |
| Chất tóc | Phân lớp rõ ràng, chất cảm rõ | sợi tóc phân lớp rõ ràng、render sợi tóc tinh tế |
| Tạo hình | Xõa tự nhiên hoặc rẽ lệch đơn giản, không mũ miện | tóc buông tự nhiên、kiểu tóc rẽ lệch |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền là bộ đồ thường ngày tự nhiên nhất theo mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh), đóng vai trò "trạng thái mặc định thường ngày" của nhân vật; lễ phục/phái sinh đặc biệt được chồng thêm ở khâu phái sinh trang phục - trang điểm. **Cấm mặc đồ lót làm lớp nền.**

### Nguyên tắc chọn trang phục

| Thân phận nhân vật | Hướng trang phục mặc định |
|---|---|
| Học sinh | Đồng phục hiện đại / đồ kiểu học viện |
| Dân văn phòng | Đồ công sở (áo sơ mi + quần/váy, vest nhẹ) |
| Ở nhà/thư giãn | Đồ thường ngày đô thị (áo hoodie/áo phông + quần jean/đầm liền) |
| Thời trang/hẹn hò | Trang phục thời thượng đô thị |
| Nghề đặc thù | Trang phục tương ứng thân phận (bác sĩ/cảnh sát/giáo viên...) |
| Mô tả nhân vật không nói rõ | Đồ thường ngày đô thị, tông màu lạnh độ bão hòa thấp |

### Quy tắc thống nhất trang phục

- Phong cách trang phục phải nhất quán với thẩm mỹ anime đô thị hiện đại (tô màu kiểu cel, tông màu lạnh độ bão hòa thấp)
- Màu độ bão hòa thấp, không hoa văn/trang trí phức tạp, để dễ chồng lớp phái sinh về sau
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền là "trạng thái mặc định thường ngày", tiêu điểm vẫn nằm ở gương mặt và dáng người
- Nghiêm cấm đồ lót/hở hang/lớp nền gợi dục

---

## 7. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Hiện đủ từ đỉnh đầu đến xương quai xanh không cắt cúp, khuôn mặt chiếm 60%+, ngũ quan rõ | `portrait closeup`、`face detail`、`head to collarbone complete`、`no crop` |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, hai tay tự nhiên, hiện đủ từ đỉnh đầu đến gót chân | `front view`、`full body head to toe`、`height mark` |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | `side view`、`profile`、`full body head to toe`、`height mark` |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Sau gáy/lưng/đuôi tóc/bàn chân rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | `back view`、`rear view`、`full body head to toe`、`height mark` |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Xám trung tính tinh khiết `#E8E8E8` |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi mở |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp đỉnh đầu hay bàn chân |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu, tóc, trán, cằm đều phải đủ |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Sáng dịu đều, đèn chính phía trước + đèn bù hai bên, không đổ bóng gắt |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

bản vẽ bốn hướng nhìn của nhân vật {giới tính}，phong cách anime，tô màu kiểu cel，phong cách đô thị hiện đại，tương phản mạnh，chi tiết tối đa，
character design sheet，character turnaround，
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả}，{khí chất tổng thể}，mặt mộc không trang điểm，
{màu da}，da sáng dịu，da mịn，chất cảm kiểu cel，
{mô tả chiều cao, ví dụ: 170cm tall、tall slender woman}，{tỉ lệ đầu-thân, ví dụ: 7 heads tall proportion}，{mô tả vóc dáng}，{mô tả dáng người}，
{màu tóc}{độ dài tóc}，sợi tóc phân lớp rõ ràng，{tạo hình nền}，không phụ kiện tóc，
{trang phục thường ngày ứng với thân phận nhân vật, ví dụ: đồng phục hiện đại/đồ công sở/đồ thường ngày đô thị}，tông màu lạnh độ bão hòa thấp，không hoa văn phức tạp，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh，không cắt cúp đỉnh đầu，head to collarbone complete，
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân，full body head to toe，không cắt cúp đỉnh đầu và bàn chân，
đứng tự nhiên，phông nền xám trung tính tinh khiết，sáng dịu đều，không đổ bóng gắt，
bốn hướng nhìn nhất quán，diện mạo render tinh tế，render sợi tóc tinh tế
trong hình không được có bất kỳ chữ nào

---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở trạng thái "mặt mộc không trang điểm" |
| R2 | Bắt buộc căn theo mô tả nhân vật mà nêu bộ đồ thường ngày phù hợp làm trang phục nền (ví dụ học sinh → đồng phục, dân văn phòng → đồ công sở, ở nhà → đồ thường ngày đô thị); cấm mặc đồ lót làm lớp nền |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện trang sức" |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc nêu chiều cao nhân vật và ràng buộc tỉ lệ toàn thân qua quy đổi tỉ lệ đầu-thân (nữ mặc định 160-170cm/6.5-7.5 đầu, nam mặc định 175-185cm/7-8 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Đồ lót/hở hang/lớp nền gợi dục; trang phục lệch hẳn so với mô tả nhân vật; hoa văn/trang trí quá phức tạp gây nhiễu việc chồng lớp trang phục - trang điểm về sau |
| X2 | Ánh sáng gắt chiếu thẳng từ đỉnh đầu/ánh sáng chiếu thẳng từ dưới lên/ánh sáng màu |
| X3 | Làm trắng quá mức đến mức không còn sắc máu / màu da ngả xám |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Cắt cúp đỉnh đầu hay gót chân ở hình toàn thân đứng, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Cắt cúp đỉnh đầu ở chân dung cận, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân, chiều cao bắt buộc nêu rõ và thể hiện tỉ lệ toàn thân qua quy đổi tỉ lệ đầu-thân |
