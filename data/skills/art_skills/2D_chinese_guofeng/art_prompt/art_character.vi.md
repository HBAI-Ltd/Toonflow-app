---
name: art_character
description: Tạo hình ảnh nhân vật gốc · Sổ tay ràng buộc
metaData: art_skills
---

# Tạo hình ảnh nhân vật gốc · Sổ tay ràng buộc

---

## 1. Nguyên tắc tạo hình gốc

1. **Tạo hình là linh hồn** — tạo hình nhân vật là điểm neo cốt lõi, tạo hình anime Quốc phong, đường nét mượt mà
2. **Bản nền là nền móng** — trang phục nền đơn giản + mặt mộc, mọi trang phục - trang điểm về sau đều là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — gương mặt/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Khí chất cổ điển** — ở trạng thái không trang điểm vẫn phải toát lên khí chất nhân vật (điển nhã/ôn nhu/anh khí)

---

## 2. Ràng buộc gương mặt

> Không cố định tham số ngũ quan nữa, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng lông mày/dáng mũi/dáng môi |
| Nền phong cách | Anime Quốc phong, thẩm mỹ Tân Quốc triều, render anime kiểu Nhật, tô màu phẳng kiểu cel, nét vẽ tinh tế |
| Khí chất | Bắt buộc chắt lọc từ khóa khí chất tổng thể từ mô tả nhân vật (như điển nhã ôn nhu/nho nhã anh khí/hiệp cốt nhu tình) và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tông hồng trắng, đều toàn thân, trắng trong | tông hồng trắng、trắng trong、màu da anime |
| Độ bóng | Tô màu phẳng kiểu cel, bóng tự nhiên, không lì mờ | tô màu phẳng kiểu cel、bóng tự nhiên、chất mềm mại |
| Chất liệu | Đường nét tinh tế, màu đều, viền mềm | đường nét tinh tế、màu đều、viền mềm |
| Phần da hở | Mặt/cổ/bàn tay | bàn tay tinh tế、đường cổ mềm mại |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tông trắng sáng, đều toàn thân, chất khỏe khoắn | tông trắng sáng、chất khỏe khoắn、màu da anime |
| Độ bóng | Tô màu phẳng kiểu cel, bóng tự nhiên | tô màu phẳng kiểu cel、bóng tự nhiên、chất mềm mại |
| Chất liệu | Đường nét tinh tế, sạch gọn dứt khoát | đường nét tinh tế、tô màu phẳng kiểu cel、mềm mại |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 160-170cm | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall elegant woman} |
| Tỉ lệ đầu-thân | Sáu đến bảy đầu, tỉ lệ cổ điển kiểu anime | 6-7 heads tall proportion、tỉ lệ cổ điển kiểu anime |
| Vai và cổ | Cổ thiên nga, đường vai cổ thanh thoát | cổ thiên nga、vai cổ thanh thoát |
| Bàn tay | Thon dài trắng trẻo, ngón tay tự nhiên | thon dài trắng trẻo、ngón tay tự nhiên |
| Dáng người | Khí chất cổ điển, thanh nhã thẳng thớm | dáng người thanh nhã、thân hình thẳng thớm |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 175-185cm | {chiều cao}cm tall、{mô tả chiều cao, ví dụ: tall imposing man} |
| Tỉ lệ đầu-thân | Sáu đến bảy đầu, tỉ lệ cổ điển kiểu anime | 6-7 heads tall proportion、tỉ lệ cổ điển kiểu anime |
| Vai và cổ | Vai rộng, cổ chắc khỏe | vai rộng、cổ chắc khỏe |
| Bàn tay | Đốt tay rõ, ngón tay tự nhiên | đốt tay rõ、ngón tay tự nhiên |
| Dáng người | Nho nhã anh khí, thẳng thớm ngay ngắn | dáng người anh khí、thân hình thẳng thớm |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa kiểu tóc tự nhiên, phụ kiện tóc được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen mực, cấm màu khác | tóc dài đen mực、tóc đen buông như thác |
| Độ dài tóc | Tóc dài ngang eo | tóc dài ngang eo、tóc dài |
| Chất tóc | Đường nét tinh tế, sợi tóc rõ | đường nét tinh tế、sợi tóc rõ |
| Tạo hình | Xõa tự nhiên, không phụ kiện tóc | tóc dài buông tự nhiên、không phụ kiện tóc |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen mực, cấm màu khác | tóc dài đen mực、tóc đen như mực |
| Độ dài tóc | Tóc dài ngang vai hoặc búi lên | tóc dài ngang vai、búi tóc |
| Chất tóc | Đường nét tinh tế, sợi tóc rõ | đường nét tinh tế、sợi tóc rõ |
| Tạo hình | Xõa tự nhiên hoặc buộc nửa, không mũ miện | tóc dài buông tự nhiên、tóc dài buộc nửa |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền không có ràng buộc đặc biệt: nữ mặc váy dài cổ trang màu trơn, nam mặc áo dài cổ trang màu trơn. Lễ phục được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Trang phục nền của nữ

Váy dài cổ trang màu trơn, màu sắc lấy màu nền làm chính, không hoa văn trang trí.

### Trang phục nền của nam

Áo dài cổ trang màu trơn, màu sắc lấy màu nền làm chính, không hoa văn trang trí.

### Quy tắc thống nhất trang phục

- Phong cách trang phục thống nhất, bảo đảm việc chồng lớp trang phục về sau không bị nhiễu màu
- Che phủ về cơ bản, trừ mặt/bàn tay/cổ
- Kiểu dáng trang phục hoàn toàn giống nhau ở bốn hướng nhìn
- Trang phục nền chỉ là lớp lót an toàn, trọng tâm nằm ở gương mặt và dáng người

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
| Phông nền | Nguyệt bạch thuần sắc #E8EAF5 |
| Dáng đứng | Đứng tự nhiên, hai chân song song hơi tách, hai tay buông tự nhiên |
| Hiện toàn thân | Hình toàn thân đứng bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| Hiện cận chân dung | Chân dung cận bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |
| Ánh sáng | Ánh sáng dịu đều, đèn chính phía trước + đèn phụ hai bên, không bóng cứng |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

bản vẽ bốn hướng nhìn của nhân vật {giới tính}，anime Quốc phong，thẩm mỹ Tân Quốc triều，render anime kiểu Nhật，tô màu phẳng kiểu cel，nét vẽ tinh tế，
character design sheet, character turnaround,
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả}, {khí chất tổng thể}, trạng thái mặt mộc,
{màu da}, tô màu phẳng kiểu cel, da trong sáng phát quang, đường nét tinh tế, ánh sáng nhiều lớp phong phú,
{mô tả chiều cao, ví dụ: 165cm tall, tall elegant woman}, {tỉ lệ đầu-thân, ví dụ: 6.5 heads tall proportion}, {mô tả vóc dáng}, {mô tả dáng người},
{màu tóc}{độ dài tóc}, sợi tóc tinh tế rõ ràng, {tạo hình nền}, không phụ kiện tóc,
（nữ: váy dài cổ trang màu trơn / nam: áo dài cổ trang màu trơn）, màu nền, không hoa văn trang trí,
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau,
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh, không cắt cúp đỉnh đầu, head to collarbone complete,
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân, full body head to toe, không cắt cúp đỉnh đầu và bàn chân,
đứng tự nhiên, phông nền nguyệt bạch thuần sắc, ánh sáng dịu đều, không bóng cứng,
bốn hướng nhìn nhất quán, tạo hình anime Quốc phong rõ ràng, đường nét tinh tế rõ ràng,
trong hình không được có bất kỳ chữ nào

---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở "trạng thái mặt mộc" |
| R2 | Bắt buộc tuyên bố trang phục nền (nữ: váy dài cổ trang màu trơn; nam: áo dài cổ trang màu trơn) |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "phông nền nguyệt bạch thuần sắc" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc tuyên bố chiều cao nhân vật và quy đổi qua tỉ lệ đầu-thân để ràng buộc tỉ lệ toàn thân (nữ mặc định 160-170cm/6-7 đầu, nam mặc định 175-185cm/6-7 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Bất kỳ trang phục/phụ kiện/lớp trang điểm nào ngoài trang phục nền |
| X2 | Ánh sáng cứng từ đỉnh đầu/ánh sáng từ dưới lên/ánh sáng tông lạnh |
| X3 | Làm trắng quá mức đến mất sắc máu / màu da xám xịt |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc thuần sắc) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hoặc gót chân, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân, chiều cao bắt buộc được tuyên bố rõ và thể hiện tỉ lệ toàn thân qua quy đổi đầu-thân |
