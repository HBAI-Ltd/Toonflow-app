# Tạo hình ảnh nhân vật gốc · Sổ tay ràng buộc phong cách phẳng

---

## 1. Nguyên tắc tạo hình gốc

1. **Đường viền là linh hồn** — đường nét là điểm neo duy nhất của nhân vật, các mảng màu phẳng dựng nên lớp lang
2. **Lấy nhân vật làm gốc** — trang phục nền do mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh) quyết định, là bộ đồ thường ngày của họ; trang phục và trang điểm đặc thù về sau là lớp chồng lên
3. **Bốn hướng nhìn nhất quán** — đường viền/vóc dáng/kiểu tóc/trang phục nền thống nhất cao giữa các hướng nhìn
4. **Biểu đạt bằng mảng màu** — không đổ bóng không gradient, dùng tương phản mảng màu để diễn tả lớp lang

---

## 2. Ràng buộc gương mặt

> Không cố định tham số ngũ quan nữa, để mô tả nhân vật (giới tính/tuổi/tính cách/khí chất) dẫn dắt AI tự sinh ngũ quan, bảo đảm các nhân vật khác nhau về ngoại hình.

### Yêu cầu chung

| Hạng mục | Ràng buộc |
|---|---|
| Ngũ quan | Suy ra tự nhiên từ mô tả nhân vật, không định sẵn dáng mặt/dáng mắt/dáng lông mày/dáng mũi/dáng môi |
| Nền phong cách | Minh họa vector phẳng, mảng màu đơn sắc, đường nét rõ ràng, không gradient không ánh sáng đổ bóng |
| Khí chất | Bắt buộc chắt lọc từ khóa khí chất tổng thể từ mô tả nhân vật và viết vào prompt |
| Biểu cảm | Vi biểu cảm trung tính, hợp với khí chất nhân vật |

---

## 3. Ràng buộc chất da

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tô một màu, không gradient | da một màu、màu da phẳng、solid skin color |
| Độ bóng | Không highlight, không phản quang | không bóng、phẳng lì mờ、matte finish |
| Chất liệu | Tô mảng màu, không vân bề mặt | tô mảng màu、chất phẳng、no texture |
| Phần da hở | Mặt/cổ/xương quai xanh/bàn tay | màu da dạng mảng、bề mặt da phẳng |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu da | Tô một màu, không gradient | da một màu、màu da phẳng、solid skin color |
| Độ bóng | Không highlight, không phản quang | không bóng、phẳng lì mờ、matte finish |
| Chất liệu | Tô mảng màu, không vân bề mặt | tô mảng màu、chất phẳng、no texture |

---

## 4. Ràng buộc vóc dáng

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 160-170cm, thể hiện qua tỉ lệ đầu-thân | {chiều cao}cm tall、tall slender woman |
| Tỉ lệ đầu-thân | Bảy đến tám đầu, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7-8 heads tall proportion、dáng người thon dài |
| Vai và cổ | Đường nét gọn gàng, biểu đạt bằng mảng màu | đường nét gọn gàng、vai cổ phẳng |
| Bàn tay | Đường viền bàn tay được đơn giản hóa | bàn tay đơn giản hóa、bàn tay mảng màu |
| Dáng đứng | Dáng gọn gàng, không động tác | dáng gọn gàng、đứng chính diện |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Chiều cao | Do hồ sơ nhân vật chỉ định, mặc định 175-185cm, thể hiện qua tỉ lệ đầu-thân | {chiều cao}cm tall、tall imposing man |
| Tỉ lệ đầu-thân | Bảy đầu rưỡi đến tám đầu rưỡi, ràng buộc nghiêm ngặt tỉ lệ toàn thân | 7.5-8.5 heads tall proportion、dáng người cao ráo |
| Vai và cổ | Đường nét gọn gàng, biểu đạt bằng mảng màu | đường nét gọn gàng、vai cổ phẳng |
| Bàn tay | Đường viền bàn tay được đơn giản hóa | bàn tay đơn giản hóa、bàn tay mảng màu |
| Dáng đứng | Dáng gọn gàng, không động tác | dáng gọn gàng、đứng chính diện |

---

## 5. Ràng buộc kiểu tóc nền

> Chỉ định nghĩa tóc xõa tự nhiên/buộc đơn giản, phụ kiện tóc được chồng thêm ở khâu phái sinh trang phục - trang điểm.

### Nữ

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền một màu, không gradient | tóc đen、màu tóc đơn sắc |
| Độ dài tóc | Ngang eo hoặc dài hơn | tóc dài、tóc dài ngang eo |
| Chất tóc | Vẽ bằng đường nét, không chi tiết sợi tóc | kiểu tóc đường nét、màu tóc phẳng、no hair strands |
| Tạo hình | Xõa tự nhiên, rẽ giữa/rẽ lệch, không phụ kiện tóc | tóc dài buông tự nhiên、màu tóc đơn giản |

### Nam

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Màu tóc | Đen tuyền hoặc đen mực một màu | tóc đen、màu tóc đen mực |
| Độ dài tóc | Trung bình dài đến dài | tóc dài、tóc dài ngang vai |
| Chất tóc | Vẽ bằng đường nét, không chi tiết sợi tóc | kiểu tóc đường nét、màu tóc phẳng、no hair strands |
| Tạo hình | Xõa tự nhiên hoặc buộc nửa, không mũ miện | tóc dài buông tự nhiên、kiểu tóc đơn giản |

---

## 6. Ràng buộc trang phục nền

> Trang phục nền là bộ đồ thường ngày tự nhiên nhất theo mô tả nhân vật (thân phận/nghề nghiệp/giới tính/bối cảnh), đóng vai trò "trạng thái mặc định thường ngày" của nhân vật; lễ phục/phái sinh đặc biệt được chồng thêm ở khâu phái sinh trang phục - trang điểm. **Cấm mặc đồ lót làm lớp nền.**

### Nguyên tắc chọn trang phục

| Thân phận nhân vật | Hướng trang phục mặc định |
|---|---|
| Học sinh | Đồng phục / đồ học đường |
| Dân văn phòng | Đồ công sở thoải mái (áo sơ mi + quần/váy) |
| Ở nhà/thư giãn | Đồ thường ngày thoải mái (áo thun + quần/váy liền) |
| Thể thao/năng động | Bộ đồ thể thao |
| Nghề đặc thù | Trang phục đúng thân phận (bác sĩ/cảnh sát/giáo viên...) |
| Mô tả nhân vật không nói rõ | Đồ thường ngày gọn gàng |

### Quy tắc thống nhất trang phục

- Phong cách trang phục phải nhất quán với thẩm mỹ minh họa vector phẳng (mảng màu đơn sắc, không gradient, không ánh sáng đổ bóng)
- Tô màu đơn sắc độ bão hòa thấp, không hoa văn/trang trí phức tạp, để dễ chồng lớp phái sinh về sau
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
| Ánh sáng | Không ánh sáng đổ bóng, tô màu phẳng thuần |
| Nhất quán | Màu da/vóc dáng/kiểu tóc/gương mặt/trang phục nền hoàn toàn giống nhau ở bốn hướng nhìn |
| Tỉ lệ khung hình | Đề xuất 4:1 hoặc 3:1 |

---

## 8. Khuôn mẫu prompt

```
bản vẽ bốn hướng nhìn phong cách phẳng của nhân vật {giới tính}，
2d flat design，vector art，flat illustration，
minimalist，clean lines，solid colors，
{đặc điểm ngũ quan ứng với mô tả nhân vật - suy ra tự nhiên từ mô tả}，{khí chất tổng thể}，mặt mộc không trang điểm，
{màu da}，da một màu，màu da phẳng，solid skin color，
{mô tả chiều cao, ví dụ: 170cm tall、tall slender woman}，{tỉ lệ đầu-thân, ví dụ: 7.5 heads tall proportion}，{mô tả vóc dáng}，{mô tả dáng đứng}，
{màu tóc}{độ dài tóc}，kiểu tóc đường nét，{tạo hình nền}，không phụ kiện tóc，
{trang phục thường ngày ứng với thân phận nhân vật, ví dụ: đồng phục/đồ công sở/đồ thường ngày thoải mái}，tô màu nền đơn sắc，không hoa văn phức tạp，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: chân dung cận + hình chính diện + hình nhìn nghiêng + hình nhìn sau，
chân dung cận hiện đủ từ đỉnh đầu đến xương quai xanh，không cắt cúp đỉnh đầu，head to collarbone complete，
hình toàn thân đứng hiện đủ từ đỉnh đầu đến gót chân，full body head to toe，không cắt cúp đỉnh đầu và bàn chân，
đứng tự nhiên，phông nền xám trung tính tinh khiết，không ánh sáng đổ bóng，không gradient，
bốn hướng nhìn nhất quán，đường nét gọn gàng，tô mảng màu，
trong hình không được có bất kỳ chữ nào
```

---

## 9. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở trạng thái "mặt mộc không trang điểm" |
| R2 | Bắt buộc dựa vào mô tả nhân vật để tuyên bố bộ đồ thường ngày phù hợp làm trang phục nền (ví dụ học sinh → đồng phục, dân văn phòng → đồ công sở, ở nhà → đồ thường ngày thoải mái); cấm mặc đồ lót làm lớp nền |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện" |
| R4 | Bắt buộc chỉ định "phông nền xám trung tính tinh khiết" |
| R5 | Bắt buộc chỉ định "bốn hướng nhìn nhất quán" |
| R6 | Hình toàn thân đứng bắt buộc hiện đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp |
| R7 | Bắt buộc chỉ định chiều cao nhân vật và quy đổi qua tỉ lệ đầu-thân để ràng buộc tỉ lệ toàn thân (nữ mặc định 160-170cm/7-8 đầu, nam mặc định 175-185cm/7.5-8.5 đầu) |
| R8 | Chân dung cận bắt buộc hiện đủ từ đỉnh đầu đến xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Lớp nền là đồ lót/hở hang/tình dục hóa; trang phục lệch rõ so với mô tả nhân vật; hoa văn/trang trí quá phức tạp gây cản trở việc chồng lớp trang phục - trang điểm về sau |
| X2 | Hiệu ứng ánh sáng đổ bóng/bóng đổ/gradient |
| X3 | Render 3D/chất CG |
| X4 | Phông nền bối cảnh phức tạp (bắt buộc nền xám thuần) |
| X5 | Biểu cảm cường điệu/tư thế động |
| X6 | Hình toàn thân đứng bị cắt cúp đỉnh đầu hoặc gót chân, bắt buộc lọt khung đủ từ đầu đến chân |
| X7 | Chân dung cận bị cắt cúp đỉnh đầu, bắt buộc lọt khung đủ từ đỉnh đầu đến xương quai xanh |
| X8 | Bỏ qua ràng buộc chiều cao và tỉ lệ đầu-thân, chiều cao bắt buộc được tuyên bố rõ và thể hiện tỉ lệ toàn thân qua quy đổi đầu-thân |
