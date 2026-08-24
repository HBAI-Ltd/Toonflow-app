# Sinh tạo hình nhân vật cơ bản · Sổ tay ràng buộc


---

## 1. Nguyên tắc tạo hình cơ bản

1. **Gương mặt chính là linh hồn** — ngũ quan là điểm neo duy nhất của nhân vật, render tinh xảo tới mức lỗ chân lông
2. **Lấy nhân vật làm gốc** — trang phục cơ bản do mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh) quyết định thành trang phục thường ngày; phục trang hóa trang đặc thù về sau là lớp chồng thêm
3. **Nhất quán bốn hướng nhìn** — gương mặt/dáng người/kiểu tóc/trang phục cơ bản thống nhất cao độ qua các hướng nhìn
4. **Lạnh diễm chứa tình** — ở trạng thái mộc không trang điểm vẫn phải toát ra khí chất nhân vật (lạnh trong/ôn nhu/kiều diễm)

---

## 2. Ràng buộc gương mặt

> Không còn cố định các tham số đặc trưng ngũ quan, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự do sinh ngũ quan, bảo đảm ngoại hình giữa các nhân vật khác biệt nhau.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng mày/dáng mũi/dáng môi |
| Nền phong cách | Nhiếp ảnh người thật cổ trang tả thực, render tinh xảo tới mức lỗ chân lông, chiếu sáng tự nhiên, ánh sáng đúng vật lý |
| Khí chất | Bắt buộc chắt ra từ khóa khí chất tổng thể từ mô tả nhân vật (như lạnh trong/ôn nhu/kiều diễm/hào khí hiệp sĩ) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc cảm giác da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Da trắng lạnh, đều toàn thân, trắng trong | da trắng lạnh、da sữa、milky white skin |
| Độ óng | Da căng bóng, ánh sáng trong veo từ bên trong, không lì cũng không bóng dầu | da căng bóng、luminous skin、dewy skin |
| Chất da | Mịn màng, giữ lại chút chất lỗ chân lông | da mịn tinh tế、lỗ chân lông thấy nhẹ |
| Vùng để hở | Mặt/cổ/xương quai xanh/bàn tay | đường vai cổ đẹp、làn da trắng trong |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Trắng trong, có vẻ khỏe khoắn, đều toàn thân | màu da trắng trong、da kem |
| Độ óng | Căng bóng thanh thoát, độ óng tự nhiên | da căng bóng、da trong và thoáng |
| Chất da | Sạch sẽ dứt khoát, thấy được lỗ chân lông | chất da mịn tinh tế、gương mặt lạnh trong |

---

## 4. Ràng buộc dáng người

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do thiết định nhân vật chỉ định, khoảng mặc định 160-170cm, chiều cao thể hiện qua quy đổi tỉ lệ đầu-thân | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall slender woman} |
| Tỉ lệ đầu-thân | Bảy đến tám đầu, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7-8 heads tall proportion、dáng người thon dài |
| Quy đổi chiều cao | Chiều dài đầu = chiều cao ÷ tỉ lệ đầu-thân (như 165cm ÷ 7.5 = 22cm chiều dài đầu), theo đó ràng buộc tỉ lệ của đầu và từng đoạn cơ thể | tỉ lệ cân đối、tỉ lệ đầu-thân hài hòa |
| Vai cổ | Cổ thiên nga, đường vai cổ đẹp | cổ thiên nga、vai cổ đẹp |
| Bàn tay | Thon dài trắng trẻo, đốt ngón rõ ràng, đủ năm ngón bình thường | tay ngọc thon thả、đốt ngón rõ ràng |
| Phong thái | Sĩ nữ cổ điển, kín đáo đoan trang | phong thái đoan trang、dáng người thanh nhã |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do thiết định nhân vật chỉ định, khoảng mặc định 175-185cm, chiều cao thể hiện qua quy đổi tỉ lệ đầu-thân | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall imposing man} |
| Tỉ lệ đầu-thân | Bảy đầu rưỡi đến tám đầu rưỡi, tỉ lệ đầu-thân = chiều cao ÷ chiều dài đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7.5-8.5 heads tall proportion、dáng người cao ráo |
| Quy đổi chiều cao | Chiều dài đầu = chiều cao ÷ tỉ lệ đầu-thân (như 180cm ÷ 8 = 22.5cm chiều dài đầu), theo đó ràng buộc tỉ lệ của đầu và từng đoạn cơ thể | tỉ lệ cân đối、tỉ lệ đầu-thân hài hòa、vai rộng eo thon |
| Vai cổ | Vai rộng, cổ chắc khỏe | vai rộng eo thon |
| Bàn tay | Đốt xương rõ ràng, lòng bàn tay to bản, đủ năm ngón bình thường | đốt ngón tay rõ ràng |
| Phong thái | Phong thái võ tướng/thư sinh (tùy nhân vật) | dáng người thẳng thớm、phong thái ung dung |

### Tham chiếu quy đổi chiều cao - tỉ lệ đầu-thân

| Chiều cao (cm) | Tỉ lệ đầu-thân | Chiều dài đầu (cm) | Mô tả phù hợp |
|---|---|---|---|
| 155-160 | 7.0 | ~22cm | Nhỏ nhắn xinh xắn |
| 160-165 | 7.0-7.5 | ~22cm | Mảnh mai thon dài |
| 165-170 | 7.5 | ~22cm | Cao ráo thanh nhã (mặc định cho nữ) |
| 170-175 | 7.5-8.0 | ~22cm | Thon dài thẳng thớm |
| 175-180 | 8.0 | ~22.5cm | Cao lớn tuấn tú (mặc định cho nam) |
| 180-185 | 8.0-8.5 | ~22cm | Vạm vỡ thẳng thớm |
| 185-190 | 8.5 | ~22cm | Cao lớn uy mãnh |

---

## 5. Ràng buộc kiểu tóc cơ bản

> Chỉ định nghĩa tóc xõa tự nhiên/búi buộc đơn giản, trang sức cài tóc được chồng thêm ở khâu phái sinh phục trang hóa trang.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền, cấm màu nâu/nhuộm highlight | tóc dài màu đen、tóc mực như thác |
| Độ dài tóc | Chấm eo hoặc dài hơn | tóc dài chấm eo |
| Chất tóc | Từng sợi rõ ràng, từng lọn rõ nét | tóc từng sợi rõ ràng、render sợi tóc tinh tế |
| Tạo kiểu | Tóc xõa tự nhiên, rẽ giữa/rẽ lệch, không trang sức cài tóc | tóc dài buông xõa tự nhiên、tóc xanh như thác |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền hoặc màu mực | tóc mực、tóc đen như mực |
| Độ dài tóc | Trung dài đến dài | tóc dài、tóc dài chấm vai |
| Chất tóc | Từng sợi rõ ràng, chất tóc rõ nét | tóc từng sợi rõ ràng、render sợi tóc tinh tế |
| Tạo kiểu | Tóc xõa tự nhiên hoặc búi nửa, không đội mão | tóc dài buông xõa tự nhiên、tóc dài búi nửa |

---

## 6. Ràng buộc trang phục cơ bản

> Trang phục cơ bản do mô tả nhân vật (thân phận/triều đại/nghề nghiệp/bối cảnh) quyết định thành trang phục thường ngày tự nhiên nhất, đóng vai trò "trạng thái mặc định thường ngày" của nhân vật đó; lễ phục trang trọng/phái sinh đặc biệt được chồng thêm ở khâu phái sinh phục trang hóa trang. **Cấm mặc đồ lót làm lớp trong.**

### Nguyên tắc chọn trang phục

| Thân phận nhân vật | Hướng trang phục mặc định |
|---|---|
| Khuê tú/tiểu thư | Váy dài cổ trang màu trơn (mềm nhẹ bay bổng) |
| Công tử/thư sinh | Áo dài cổ trang màu trơn |
| Võ tướng/hiệp khách | Võ phục nhẹ / thường phục chiến bào |
| Thường dân/chợ búa | Áo ngắn mộc mạc / quần áo vải thô |
| Cung nữ/a hoàn | Cung trang giản dị / trang phục nữ tì |
| Mô tả nhân vật không nói rõ | Thường phục cổ trang màu trơn (khớp váy dài/áo dài theo giới tính) |

### Quy tắc thống nhất trang phục

- Phong cách trang phục phải khớp với thẩm mỹ người thật cổ trang tả thực (tông màu truyền thống Trung Hoa, chất liệu tả thực)
- Màu bão hòa thấp, không hoa văn/trang trí phức tạp, để tiện chồng lớp phái sinh về sau
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục cơ bản là "trạng thái mặc định thường ngày", tiêu điểm vẫn nằm ở gương mặt và phong thái
- Nghiêm cấm mặc đồ lót/hở hang/lớp trong gợi dục

---

## 7. Quy phạm bản vẽ thiết định bốn hướng nhìn

### Định nghĩa các hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Trái ngoài cùng | Đặc tả chân dung | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Hiện trọn từ đỉnh đầu đến xương quai xanh không cắt cúp, khuôn mặt chiếm 60%+, ngũ quan rõ nét | portrait closeup、face detail、head to collarbone complete、no crop |
| Trái thứ hai | Hình chiếu trước | Chính diện 0° | Tượng đứng toàn thân | Đối diện máy quay, hai tay tự nhiên, hiện trọn từ đỉnh đầu đến gót chân | front view、full body head to toe、height mark |
| Phải thứ hai | Hình chiếu bên | Bên phải 90° | Tượng đứng toàn thân | Đường viền nghiêng thuần túy rõ nét, hiện trọn từ đỉnh đầu đến gót chân | side view、profile、full body head to toe、height mark |
| Phải ngoài cùng | Hình chiếu sau | Phía sau 180° | Tượng đứng toàn thân | Sau gáy/lưng/đuôi tóc/bàn chân rõ nét, hiện trọn từ đỉnh đầu đến gót chân | back view、rear view、full body head to toe、height mark |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp ngang từ trái sang phải trong cùng một khung hình |
| Nền | Xám trung tính thuần #E8E8E8 |
| Tư thế đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên hoặc hơi dang |
| Hiện toàn thân | Tượng đứng toàn thân bắt buộc lọt trọn khung từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp đỉnh đầu hoặc bàn chân |
| Hiện đặc tả | Đặc tả chân dung bắt buộc lọt trọn khung từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu, tóc, trán, cằm đều phải trọn vẹn |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + bù sáng hai bên, không bóng cứng |
| Tính nhất quán | Màu da/dáng người/kiểu tóc/gương mặt/trang phục cơ bản hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

```
Bản vẽ thiết định bốn hướng nhìn nhân vật {giới tính}，nhiếp ảnh người thật tả thực，ghi chép hiện thực cổ trang，tương phản mạnh，chi tiết tối đa，
character design sheet，character turnaround，
{đặc trưng ngũ quan tương ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả nhân vật}，{khí chất tổng thể}，mặt mộc không trang điểm，
{màu da}，da căng bóng，da trong veo phát sáng，da mịn tinh tế，lỗ chân lông thấy nhẹ，
{mô tả chiều cao, ví dụ: 170cm tall、tall slender woman}，{tỉ lệ đầu-thân, ví dụ: 7.5 heads tall proportion}，{mô tả dáng người}，{mô tả phong thái}，
{màu tóc}{độ dài tóc}，tóc từng sợi rõ ràng，{tạo kiểu cơ bản}，không trang sức cài tóc，
{trang phục cổ trang thường ngày ứng với thân phận nhân vật, ví dụ: váy dài màu trơn/áo dài màu trơn/võ phục nhẹ/áo ngắn vải thô}，màu bão hòa thấp theo tông truyền thống Trung Hoa，không hoa văn phức tạp，
xếp ngang từ trái sang phải trong cùng khung hình: đặc tả chân dung+hình chiếu trước+hình chiếu bên+hình chiếu sau，
đặc tả chân dung hiện trọn từ đỉnh đầu đến xương quai xanh, không cắt cúp đỉnh đầu，head to collarbone complete，
tượng đứng toàn thân hiện trọn từ đỉnh đầu đến gót chân, full body head to toe，không cắt cúp đỉnh đầu và bàn chân，
đứng tự nhiên，nền xám trung tính thuần，ánh sáng dịu đều，không bóng cứng，
nhất quán bốn hướng nhìn，render gương mặt tinh tế，render sợi tóc tinh tế
không có bất kỳ chữ nào trong hình
```

---

## 9. Quy tắc ràng buộc

### Bắt buộc tuân thủ

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở trạng thái "mặt mộc không trang điểm" |
| R2 | Bắt buộc căn cứ mô tả nhân vật để tuyên bố trang phục cổ trang thường ngày phù hợp làm trang phục cơ bản (như khuê tú → váy dài màu trơn, thư sinh → áo dài màu trơn, võ tướng → võ phục nhẹ); cấm mặc đồ lót làm lớp trong |
| R3 | Bắt buộc tuyên bố "không trang sức cài tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "nền xám trung tính thuần" |
| R5 | Bắt buộc chỉ định "nhất quán bốn hướng nhìn" |
| R6 | Tượng đứng toàn thân bắt buộc hiện trọn từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc tuyên bố chiều cao nhân vật và ràng buộc tỉ lệ toàn thân qua quy đổi tỉ lệ đầu-thân (nữ mặc định 160-170cm/7-8 đầu, nam mặc định 175-185cm/7.5-8.5 đầu) |
| R8 | Đặc tả chân dung bắt buộc hiện trọn từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Đồ lót/hở hang/lớp trong gợi dục; trang phục lệch rõ rệt với mô tả nhân vật; hoa văn/trang trí quá phức tạp gây nhiễu cho lớp phục trang chồng thêm về sau |
| X2 | Đèn cứng đánh thẳng từ đỉnh/đèn đánh từ dưới lên/đèn màu |
| X3 | Làm trắng quá tay đến mức không còn sắc máu / màu da ngả xám |
| X4 | Nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm phóng đại/tư thế động |
| X6 | Cắt cúp đỉnh đầu hoặc gót chân của tượng đứng toàn thân, bắt buộc lọt trọn khung từ đầu đến chân |
| X7 | Cắt cúp đỉnh đầu của đặc tả chân dung, bắt buộc lọt trọn khung từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân; chiều cao bắt buộc tuyên bố rõ và thể hiện tỉ lệ toàn thân qua quy đổi tỉ lệ đầu-thân |
