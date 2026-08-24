---
name: art_character
description: Tạo hình ảnh nền của nhân vật · sổ tay ràng buộc
metaData: art_skills
---

# Tạo hình ảnh nền của nhân vật · Sổ tay ràng buộc

---

## 1. Nguyên tắc hình ảnh nền

1. **Tạo hình là linh hồn** — tạo hình nhân vật là neo cốt lõi: tạo hình 3D Quốc phong, đường nét mượt mà
2. **Mẫu nền là nền tảng** — trang phục lót nền + mặt mộc, phục trang hóa trang về sau đều là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Khí chất cổ điển** — dù ở trạng thái không trang điểm vẫn phải toát lên khí chất nhân vật (trang nhã/dịu dàng/khí phách)

---

## 2. Ràng buộc gương mặt

> Không còn cố định tham số đặc điểm ngũ quan, mà để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác biệt nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng mày/dáng mũi/dáng môi |
| Nền phong cách | Render 3D Quốc phong, tạo mô hình độ chính xác cao, chất liệu PBR, ánh sáng đẳng cấp điện ảnh |
| Khí chất | Bắt buộc rút ra từ khóa khí chất tổng thể từ mô tả nhân vật (như trang nhã dịu dàng/nho nhã khí phách/hiệp cốt nhu tình) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tông hồng trắng, đều toàn thân, trắng trong | tông hồng trắng、trắng trong、màu da mô hình 3D |
| Độ bóng | Render chất liệu PBR, bóng tự nhiên, không lì | render chất liệu PBR、bóng tự nhiên、chất dịu |
| Chất cảm | Tạo mô hình độ chính xác cao, vân bề mặt rõ, rìa mềm | tạo mô hình độ chính xác cao、vân bề mặt rõ、rìa mềm |
| Vùng da hở | Mặt/cổ/bàn tay | bàn tay tinh tế、đường cổ mềm mại |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tông trắng sáng, đều toàn thân, chất khỏe khoắn | tông trắng sáng、chất khỏe khoắn、màu da mô hình 3D |
| Độ bóng | Render chất liệu PBR, bóng tự nhiên | render chất liệu PBR、bóng tự nhiên、chất dịu |
| Chất cảm | Tạo mô hình độ chính xác cao, sạch gọn | tạo mô hình độ chính xác cao、render 3D、dịu |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do thiết lập nhân vật chỉ định, mặc định 160-170cm | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall elegant woman} |
| Tỉ lệ đầu - thân | Bảy đến bảy đầu rưỡi, tỉ lệ cổ điển | 7 heads tall proportion、tỉ lệ cổ điển |
| Vai và cổ | Cổ thiên nga, đường vai cổ đẹp | cổ thiên nga、vai cổ đẹp |
| Bàn tay | Thon dài trắng trẻo, ngón tay tự nhiên | thon dài trắng trẻo、ngón tay tự nhiên |
| Dáng vẻ | Khí chất cổ điển, thanh nhã thẳng thớm | dáng vẻ thanh nhã、thân hình thẳng thớm |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do thiết lập nhân vật chỉ định, mặc định 175-185cm | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall imposing man} |
| Tỉ lệ đầu - thân | Bảy đến bảy đầu rưỡi, tỉ lệ cổ điển | 7 heads tall proportion、tỉ lệ cổ điển |
| Vai và cổ | Vai rộng, cổ chắc khỏe | vai rộng、cổ chắc khỏe |
| Bàn tay | Đốt xương rõ, ngón tay tự nhiên | đốt xương rõ、ngón tay tự nhiên |
| Dáng vẻ | Nho nhã khí phách, thẳng thớm đoan chính | dáng vẻ khí phách、thân hình thẳng thớm |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa kiểu tóc tự nhiên, trang sức tóc được chồng vào ở khâu phái sinh phục trang hóa trang.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen mực, cấm màu khác | tóc dài đen mực、tóc đen như thác |
| Độ dài tóc | Tóc dài chấm eo | tóc dài chấm eo、tóc dài |
| Chất tóc | Tạo mô hình độ chính xác cao, sợi tóc rõ | tạo mô hình độ chính xác cao、sợi tóc rõ |
| Tạo hình | Xõa tự nhiên, không trang sức tóc | tóc dài xõa tự nhiên、không trang sức tóc |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen mực, cấm màu khác | tóc dài đen mực、tóc đen như mực |
| Độ dài tóc | Tóc dài chấm vai hoặc búi lên | tóc dài chấm vai、búi tóc |
| Chất tóc | Tạo mô hình độ chính xác cao, sợi tóc rõ | tạo mô hình độ chính xác cao、sợi tóc rõ |
| Tạo hình | Xõa tự nhiên hoặc búi nửa, không mũ tóc | tóc dài xõa tự nhiên、tóc dài búi nửa |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền không có ràng buộc đặc biệt: nữ mặc váy dài cổ trang màu trơn, nam mặc áo dài cổ trang màu trơn. Phục trang chính thức được chồng vào ở khâu phái sinh phục trang hóa trang.

### Trang phục nền của nữ

Váy dài cổ trang màu trơn, màu sắc lấy màu nền là chính, không có hoa văn trang trí.

### Trang phục nền của nam

Áo dài cổ trang màu trơn, màu sắc lấy màu nền là chính, không có hoa văn trang trí.

### Quy tắc thống nhất trang phục

- Phong cách trang phục thống nhất, bảo đảm việc chồng phục trang về sau không bị nhiễu màu
- Che phủ cơ bản toàn bộ trừ mặt/bàn tay/cổ
- Kiểu trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền chỉ là lớp lót an toàn, trọng tâm nằm ở gương mặt và dáng vẻ

---

## 7. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Cỡ cảnh | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Ngoài cùng bên trái | Chân dung cận | Chính diện ngang tầm mắt | Từ đỉnh đầu đến xương quai xanh | Hiện đủ từ đỉnh đầu đến xương quai xanh, khuôn mặt chiếm 60%+, ngũ quan rõ | portrait closeup、face detail |
| Thứ hai từ trái | Hình chính diện | Chính diện 0° | Toàn thân đứng | Hướng về máy quay, hai tay tự nhiên, hiện đủ từ đỉnh đầu đến gót chân | front view、full body |
| Thứ hai từ phải | Hình nhìn nghiêng | Bên phải 90° | Toàn thân đứng | Đường viền nghiêng thuần rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | side view、profile、full body |
| Ngoài cùng bên phải | Hình nhìn sau | Phía sau 180° | Toàn thân đứng | Sau gáy/lưng/đuôi tóc/bàn chân rõ ràng, hiện đủ từ đỉnh đầu đến gót chân | back view、rear view、full body |

### Quy phạm khung hình

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng nhìn xếp cạnh nhau từ trái sang phải trong cùng một khung hình |
| Phông nền | Màu xám mộc thuần #B8B8B8 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng gắt |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

bản vẽ bốn hướng nhìn của nhân vật {giới tính}，phong cách render 3D，tạo mô hình độ chính xác cao，chất liệu PBR，3D Quốc phong，ánh sáng đẳng cấp điện ảnh，
character design sheet, character turnaround,
{đặc điểm ngũ quan tương ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả nhân vật}, {khí chất tổng thể}, trạng thái mặt mộc,
{màu da}, render chất liệu PBR, chất render 3D trong trẻo, tạo mô hình độ chính xác cao, lớp lang ánh sáng phong phú,
{mô tả chiều cao, ví dụ:165cm tall, tall elegant woman}, {tỉ lệ đầu - thân, ví dụ:7 heads tall proportion}, {mô tả vóc dáng}, {mô tả dáng vẻ},
{màu tóc}{độ dài tóc}, sợi tóc rõ độ chính xác cao, {tạo hình nền}, không trang sức tóc,
(nữ: váy dài cổ trang màu trơn / nam: áo dài cổ trang màu trơn), màu nền, không hoa văn trang trí,
xếp cạnh nhau từ trái sang phải trong cùng khung hình：chân dung cận+hình chính diện+hình nhìn nghiêng+hình nhìn sau,
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh, không cắt cúp đỉnh đầu, head to collarbone complete,
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân, full body head to toe, không cắt cúp đỉnh đầu và bàn chân,
đứng tự nhiên, phông nền màu xám mộc thuần, ánh sáng dịu đều, không bóng gắt,
nhất quán bốn hướng nhìn, mô hình 3D cổ phong rõ ràng, tạo mô hình độ chính xác cao rõ ràng,
trong hình không được có bất kỳ chữ nào


---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc là "trạng thái mặt mộc" |
| R2 | Bắt buộc nêu rõ trang phục nền (nữ: váy dài cổ trang màu trơn; nam: áo dài cổ trang màu trơn) |
| R3 | Bắt buộc nêu rõ "không trang sức tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "phông nền màu xám mộc thuần" |
| R5 | Bắt buộc chỉ định "nhất quán bốn hướng nhìn" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc nêu rõ chiều cao nhân vật và ràng buộc tỉ lệ toàn thân qua tỉ lệ đầu - thân (nữ mặc định 160-170cm/7 đầu, nam mặc định 175-185cm/7 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Bất kỳ trang phục/phụ kiện/trang điểm nào ngoài trang phục nền |
| X2 | Ánh gắt từ đỉnh đầu/ánh từ dưới lên/ánh sáng tông lạnh |
| X3 | Làm trắng quá mức đến mức không còn sắc máu / màu da xám xỉn |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc là màu thuần) |
| X5 | Biểu cảm phóng đại/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hay gót chân, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu - thân; chiều cao bắt buộc nêu rõ và tỉ lệ toàn thân phải thể hiện qua tỉ lệ đầu - thân |
