---
name: liveaction_urban_storyboard_table
description: Ràng buộc Đô thị người thật cho bảng phân cảnh — định nghĩa quy chuẩn của phong cách Đô thị người thật trong bảng phân cảnh về ánh sáng và không khí, chất nhiếp ảnh, nhịp động tác, chuyển động môi trường, chuyển động máy quay và các điều cấm khi chuyển cảnh, đồng thời thích ứng sâu cho Seedance 2.0. Áp dụng cho mọi thể loại tự sự đô thị.
metaData: director_skills, seedance2.0_adapted
---

# Ràng buộc Đô thị người thật cho bảng phân cảnh · Quay thật đô thị người thật · Tham chiếu kỹ thuật

---

## 1. Vai trò của bảng phân cảnh

Bảng phân cảnh là công cụ cốt lõi để đạo diễn chuyển kịch bản thành ngôn ngữ cú máy. Ràng buộc này hướng tới việc sinh video bằng Seedance 2.0: mọi mô tả về ánh sáng, động tác, không gian đều dùng ngôn ngữ cụ thể mà mô hình thực thi được. Không khái quát cảm xúc trừu tượng, không viết tham số render mà mô hình không hiểu.

---

## 2. Luật sắt về mô tả cho Seedance 2.0

> Mọi mô tả trong bảng phân cảnh Đô thị người thật bắt buộc tuân theo nguyên tắc chuyển dịch sau — chuyển "ý đồ đạo diễn" thành "chỉ thị vật lý mà AI thực thi được".

| Cách diễn đạt trừu tượng bị cấm | Cách thay thế cụ thể cho Seedance 2.0 |
|---|---|
| Cô ấy rất buồn | Mày mắt cụp xuống, tia nhìn tản mát rơi xuống sàn, khóe miệng trễ xuống tự nhiên, tay phải vô thức xoa cổ tay trái |
| Nắng đẹp quá | Nắng chiều chếch vào 45° qua cửa sổ bên trái (khoảng 4500K trắng ấm), hắt xuống sàn vệt sáng hình chữ nhật của khung cửa |
| Phố xá náo nhiệt | Đèn vàng ấm của các cửa hàng mặt phố bật hết (khoảng 3000K), năm người bộ hành đi chậm dọc phố đi bộ, trong đó một người đẩy xe nôi |
| Anh ấy quay người bỏ đi | Xoay chậm sang phải khoảng 90 độ, mặt hướng về bên phải khung hình, chân phải bước ra trước khoảng 0.6 mét, chân trái theo sau, cả quá trình khoảng 2 giây |
| Không khí rất ngột ngạt | Một nguồn ánh cửa sổ cứng đánh xiên từ bên (trắng lạnh khoảng 5000K), phần còn lại của căn phòng tối sâu nhưng vẫn thấy đường viền mờ, tỉ lệ sáng tối khoảng 1:8 |
| Gió thổi lay rèm | Rèm voan trắng bị gió nhẹ ngoài cửa sổ thổi phồng khoảng 15cm rồi rơi xuống, lặp lại theo chu kỳ khoảng 2 giây |

---

## 3. Ánh sáng và không khí — mô tả nguồn sáng vật lý cho Seedance 2.0

### 3.1 Thống nhất ánh sáng trong cùng một cảnh

Trong một cảnh không nên xuất hiện quá hai phương án ánh sáng cốt lõi, trừ khi có thay đổi nguồn sáng do tự sự dẫn dắt (có người bật đèn bàn, sau bình minh ánh trời sáng hơn đèn trong nhà, từ trong nhà đi ra ngoài trời). Thay đổi nguồn sáng bắt buộc ghi chú sự kiện kích hoạt trong bảng phân cảnh.

### 3.2 Cú pháp câu nguồn sáng (mỗi cú máy bắt buộc có)
[Nguồn sáng] Ánh chính: {loại nguồn sáng}, {hướng}, {giá trị nhiệt độ màu K}, {mềm/cứng}
[Nguồn sáng] Ánh phụ/ánh môi trường: {loại nguồn sáng}, {hướng}, {giá trị nhiệt độ màu K}
[Tỉ lệ sáng tối] Khoảng 1:{X}
### 3.3 Cảm xúc → ma trận nguồn sáng

| Cảm xúc | Công thức nguồn sáng (điền thẳng vào Seedance 2.0 được) | Từ khóa thị giác |
|---|---|---|
| Kìm nén nơi công sở | Ánh cửa sổ trắng lạnh làm ánh chính (5000-5500K) hắt xiên từ phía cửa kính sát sàn, ánh màn hình lạnh (6500K) bù mặt. Tỉ lệ sáng tối khoảng 1:3 | Trung tính ngả lạnh, chất liệu rõ |
| Thư thả thường ngày | Ánh cửa sổ tán xạ trên diện rộng (5000K), rèm làm mềm. Tỉ lệ sáng tối khoảng 1:1.5 tương phản thấp | Trong trẻo, tương phản thấp, chữa lành |
| Ấm áp thân mật | Đèn bàn ánh ấm làm nguồn sáng chính (2800-3200K), vùng tối giữ đường viền vật thể. Tỉ lệ sáng tối khoảng 1:4 | Ôm trọn tông ấm, riêng tư |
| Phố phường | Nhiều nguồn sáng trộn lẫn — đèn đường natri vàng ấm (2000-2200K) làm chính, cửa hàng trắng lạnh (4000K) đối trọng cục bộ. Tỉ lệ sáng tối khoảng 1:5 | Tông ấm chủ đạo, náo nhiệt |
| Cô đơn đêm mưa | Mặt đường ướt phản chiếu đốm sáng vàng ấm của đèn đường (2800K), môi trường tông lạnh (6000K tán xạ từ bầu trời), vệt mưa trên kính tán xạ. Tỉ lệ sáng tối khoảng 1:6 | Nóng lạnh cùng tồn tại, cô đơn nên thơ |
| Hồi hộp căng thẳng | Một nguồn ánh cửa sổ cứng đánh từ bên (trắng lạnh 5000K), chênh sáng lớn khoảng 1:8, vùng tối sâu nhưng còn đường viền mờ. Tỉ lệ sáng tối khoảng 1:8 | Ngột ngạt, bất định |
| Chữa lành hồi sinh | Ánh sáng tự nhiên tán xạ dồi dào (5000-5500K), ánh trời + phản chiếu từ mặt đất bù sáng. Tỉ lệ sáng tối khoảng 1:1.5 | Tông cao trong trẻo, hy vọng |
| Yếu đuối lúc đêm khuya | Một nguồn sáng ấm duy nhất — đèn bàn/đèn đường ngoài cửa sổ (2800-3200K) chiếu kiểu hòn đảo, mặt một bên sáng một bên tối. Tỉ lệ sáng tối khoảng 1:8 | Nguồn sáng tối giản, riêng tư mong manh |

### 3.4 Tông nóng lạnh và giai đoạn tự sự

- **Ánh lạnh chủ đạo** (5000K+): kìm nén nơi công sở, hồi hộp căng thẳng, một mình lạnh lẽo, đêm mưa
- **Ánh ấm chủ đạo** (2000-3500K): ấm áp thân mật, phố phường, sinh hoạt tại nhà, giờ vàng
- **Nóng lạnh cùng tồn tại**: khoảnh khắc chuyển tiếp (giờ xanh + đèn ấm vừa bật), đêm mưa (môi trường lạnh + đốm sáng ấm)
- **Thay đổi nguồn sáng = tín hiệu tự sự**: bầu trời ngoài cửa sổ chuyển dần từ trắng lạnh ban ngày sang vàng ấm chiều tối = thời gian trôi; từ ánh trắng lạnh của văn phòng bước ra dưới đèn đường vàng ấm = chuyển đổi bối cảnh và cảm xúc

### 3.5 Điểm mấu chốt khi thích ứng ánh sáng cho Seedance 2.0

- Con số nhiệt độ màu giúp mô hình hiệu chỉnh thiên hướng cân bằng trắng: `nhiệt độ màu khoảng 3200K` hơn `ánh sáng ấm`
- Con số tỉ lệ sáng tối giúp mô hình dựng ý thức về sáng tối: `tỉ lệ sáng tối khoảng 1:4` hơn `bóng đổ dịu`
- Nguồn sáng bắt buộc có xuất xứ rõ ràng: `chếch vào 45° qua cửa sổ bên trái khung hình` hơn `ánh sáng đánh từ bên`
- Mô tả đường phản chiếu của ánh môi trường: `mặt đường ướt phản chiếu đốm sáng vàng ấm của đèn đường` hơn `mặt đất có ánh phản tông ấm`

---

## 4. Chuyển động môi trường — để khung hình thở

### 4.1 Mật độ chuyển động

Cứ 3-4 cú máy phải bố trí ít nhất một cú máy có chuyển động môi trường. Cảnh đối thoại tĩnh cũng không ngoại lệ — ít nhất phải có một cú máy trong đó lá cây ngoài cửa sổ đang lay, hơi nóng trong cốc cà phê đang bốc lên, hoặc rèm bị gió nhẹ thổi.

### 4.2 Các yếu tố chuyển động môi trường đô thị (Seedance 2.0 thực thi được)

| Bối cảnh | Chuyển động môi trường có thể mô tả |
|---|---|
| Trong nhà | Rèm bị gió nhẹ thổi phồng khoảng 10cm rồi rơi xuống (chu kỳ khoảng 2 giây), hơi nóng bốc chậm từ miệng cốc cà phê, một con côn trùng nhỏ bay qua vùng sáng đèn bàn trên mặt bàn, ánh đèn xe ngoài cửa sổ thi thoảng quét ngang trần nhà |
| Đường phố | Lá cây ven đường xào xạc lay động, người bộ hành ở xa chờ rồi bước qua vạch sang đường, một chiếc xe đạp chạy chậm ngang qua lớp giữa khung hình, vũng nước ven đường bị bánh xe cán qua tóe gợn sóng |
| Quán cà phê/nhà hàng | Hơi nước bốc lên từ máy pha cà phê, ánh sáng ở chỗ ngồi cạnh cửa sổ sáng tối thay đổi theo mây trôi bên ngoài, động tác lặp lại của nhân viên quầy khi lau ly tách, chuông gió ở cửa reo lên vì luồng gió lùa theo lúc đẩy cửa |
| Văn phòng | Vệt bóng rèm lá sách dịch chuyển chậm theo góc ánh sáng bên ngoài, màn hình máy tính chuyển sang chế độ bảo vệ, cây nước thi thoảng phát ra tiếng "ục" của bọt khí, máy in nhả giấy ra |
| Địa điểm đêm khuya | Cửa tự động của cửa hàng tiện lợi đóng mở liên tục, đèn giao thông hắt xuống lối đi bộ ánh đỏ/xanh xen kẽ, đèn của chiếc xe thi thoảng chạy qua ở xa quét một vệt sáng trên trần |
| Sân thượng | Quần áo trên dây phơi bị gió thổi, một ngọn đèn trên đường chân trời thành phố ở xa thi thoảng bật lên hoặc tắt đi, mây trôi chậm trên bầu trời |

### 4.3 Quy chuẩn mô tả chuyển động môi trường cho Seedance 2.0

- Chuyển động bắt buộc có quỹ đạo và tốc độ cụ thể: `lá cây bị gió thổi, mỗi giây lay nhẹ khoảng 2-3 lần` hơn `cây đang lay`
- Chuyển động của nguồn sáng phải nhất quán với logic nguồn sáng của không gian: `khi mây che mặt trời, diện tích ánh cửa sổ trong nhà thu nhỏ khoảng 40%, kéo dài khoảng 3 giây rồi hồi lại`
- Cấm chuyển động không có nguồn cơn: không có gió thổi = rèm không động. Trong nhà không mở cửa sổ = không có gió

---

## 5. Nhịp động tác nhân vật — cụ thể hóa logic vật lý cho Seedance 2.0

### 5.1 Luật sắt về mô tả động tác

Mọi động tác của nhân vật bắt buộc mô tả: **quỹ đạo + tốc độ/thời lượng + phối hợp các bộ phận cơ thể + ảnh hưởng lên vật xung quanh**.

### 5.2 Thư viện cụ thể hóa động tác thường ngày

| Động tác | Mô tả Seedance 2.0 thực thi được |
|---|---|
| Đứng dậy | Hai tay chống lên tay vịn ghế, đầu gối đưa về trước, sau 0.5 giây trọng tâm cơ thể dồn về trước lên hai bàn chân, thêm 1 giây nữa thì đứng thẳng — cả quá trình khoảng 2 giây, đứng thẳng rồi dừng khoảng 0.5 giây |
| Quay đầu | Đầu xoay chậm sang phải khoảng 30 độ, tia nhìn chuyển từ tập tài liệu trên bàn ra ngoài cửa sổ, quá trình xoay khoảng 1 giây, tới nơi rồi ánh mắt dừng ở phía xa khoảng 1 giây |
| Uống cà phê | Tay phải cầm quai cốc, miệng cốc đưa lại gần môi, nghiêng cốc khoảng 15 độ, chất lỏng chạm môi trên, nhấp một ngụm nhỏ khoảng 1 giây, cốc hạ về chỗ cũ khoảng 1 giây |
| Đi về phía cửa sổ | Đứng lên khỏi ghế văn phòng (khoảng 2 giây), đi đều khoảng 4 bước về phía cửa kính sát sàn bên phải khung hình (quãng khoảng 3 mét, mất khoảng 3 giây), dừng ở chỗ cách cửa sổ khoảng 0.5 mét |
| Ngồi xuống | Thân người chồm nhẹ về trước và hơi khuỵu gối, mông chạm mặt ghế, mặt ghế lún xuống khoảng 2cm (lò xo/mút biến dạng), lưng tựa tự nhiên vào lưng ghế — cả quá trình khoảng 1.5 giây |
| Đặt đồ vật xuống | Tay phải hạ cốc cà phê từ ngang ngực xuống mặt bàn, đáy cốc chạm mặt gỗ phát ra tiếng va nhẹ, các ngón tay rời khỏi quai cốc — cả quá trình khoảng 1 giây |
| Đẩy cửa bước vào | Tay phải nắm tay nắm cửa vặn xuống khoảng 30 độ, đẩy cửa vào trong khoảng 70 độ, thân người theo cánh cửa đi vào, chân phải bước qua ngưỡng cửa trước — cả quá trình khoảng 2 giây |
| Xem điện thoại | Tay phải cầm điện thoại (dài khoảng 15cm) lên khỏi mặt bàn, ngón cái chạm phần dưới màn hình để đánh thức, ánh màn hình lạnh hắt lên nửa mặt bên phải, mắt hơi nheo tập trung vào màn hình — cả quá trình khoảng 3 giây |
| Mặc áo/khoác áo ngoài | Tay phải luồn vào tay áo phải, tay trái vươn ra sau luồn vào tay áo trái, hai vai hơi mở về sau cho áo ôm vào vai, cổ áo lật ra tự nhiên — cả quá trình khoảng 4 giây |
| Ôm | A bước tới trước khoảng 0.5 mét, hai tay vòng qua vai và lưng B, hai bàn tay khẽ đan lại sau lưng B, mặt áp gần bên tai B, giữ khoảng 3 giây |

### 5.3 Nhịp động tác và bối cảnh tự sự

- **Tự sự thường ngày/cảnh tâm lý**: động tác điềm đạm tiết chế, mỗi vi động tác đều ghi rõ thời lượng và quỹ đạo. Nhịp thong thả — không phải chậm, mà là "không vội"
- **Cảnh biến động cảm xúc**: biên độ và tốc độ động tác tăng nhẹ. Nhân vật có thể vô thức gõ ngón tay lên bàn nhanh dần trong lúc đối thoại, hơi thở kéo vai nhấp nhô rõ hơn
- **Cảnh xung đột**: động tác dứt khoát gọn ghẽ, nhưng vẫn phải có quỹ đạo vật lý. Đánh/xô đẩy phải cụ thể đến mức "tay phải đẩy vào phía trước vai trái của đối phương, trọng tâm đối phương lệch về sau khoảng 20cm"
- Cấm: chất chồng động tác nhanh không có lý do tự sự, dịch chuyển tức thời không có logic vật lý, mô tả mơ hồ kiểu "làm một cử chỉ"

### 5.4 Chuyển động của trang phục

Chuyển động của trang phục người thật là tài sản tự nhiên của khung hình — không phải "tham số mô phỏng vải", mà là "tà áo măng tô bị gió thổi hất lên khoảng 20 độ", "một đầu khăn quàng trượt khỏi vai", "gấu váy đung đưa trái phải khoảng 10cm theo nhịp bước". Ghi chú các chi tiết chuyển động của trang phục này trong phần mô tả hình ảnh của bảng phân cảnh.

---

## 6. Cụ thể hóa logic không gian — hệ tọa độ không gian của Seedance 2.0

### 6.1 Thông tin không gian mỗi cú máy bắt buộc khai báo
Vị trí ngang: trái/giữa/phải khung hình, hoặc một phần ba bên trái khung hình
Vị trí chiều sâu: cách máy quay {số liệu} mét, tiền cảnh/lớp giữa/hậu cảnh
Quan hệ giữa nhân vật và bối cảnh: cách {vật cố định} {số liệu} mét
(Nếu từ hai người trở lên) khoảng cách tương đối và hướng nhìn giữa nhân vật A và B
### 6.2 Ví dụ nối tiếp vị trí đứng
【Cuối đoạn A】
A đứng trước cửa kính sát sàn, cách cửa sổ khoảng 0.5 mét, mặt hướng ra ngoài, ở giữa khung hình hơi lệch phải, cách máy quay khoảng 4 mét.
Ngoài cửa sổ là đường chân trời thành phố buổi chiều, nắng chếch vào qua cửa sổ bên phải khung hình.
Tay phải A cầm cốc cà phê ngang ngực, cốc cách môi khoảng 15cm.

【Đầu đoạn B】
Cốc cà phê của A vừa hạ khỏi miệng khoảng 10cm, cốc vẫn ở ngang ngực. A vẫn đứng trước cửa kính sát sàn (vị trí không đổi).
Trời ngoài cửa sổ đã chuyển sang giờ xanh — bầu trời xanh tím thẫm, đèn viền các tòa nhà và đèn đường đã bật.
Đèn bàn trong phòng đã bật (bàn phụ bên trái khung hình), ánh vàng ấm (khoảng 3000K) chiếu lên má trái của A.
### 6.3 Thay đổi không gian bắt buộc phải cụ thể

| Trừu tượng (cấm) | Cụ thể cho Seedance 2.0 |
|---|---|
| Cô ấy lại gần | A từ hậu cảnh khung hình (cách máy quay khoảng 5 mét, ở vị trí khung cửa) đi đều 4 bước (khoảng 3 mét) về phía máy quay, dừng ở chỗ cách máy quay khoảng 2 mét — mất khoảng 4 giây |
| Hai người đối mặt nhau | A ở giữa khung hình hơi lệch trái (cách máy quay khoảng 3 mét), B ở giữa khung hình hơi lệch phải (cách máy quay khoảng 3 mét), hai người đối mặt nhau, cách nhau khoảng 0.8 mét |
| Từ trong nhà ra ngoài trời | A từ trong nhà (cách máy quay khoảng 3 mét) đi về phía cửa, đẩy cửa ra (cánh cửa xoay vào trong khoảng 80 độ), chân phải bước qua ngưỡng cửa, ra tới đường phố — ánh vàng ấm của đèn đường lập tức thay thế ánh huỳnh quang trắng lạnh trong nhà |

---

## 7. Quy chuẩn chuyển động máy quay — chuyển động máy của Seedance 2.0

### 7.1 Chuyển động máy quay được phép

| Chuyển động máy quay | Mô tả cho Seedance 2.0 | Tình huống dùng |
|---|---|---|
| 固定 (máy cố định) | Máy quay đứng yên (固定) không di chuyển, khung hình tĩnh (静止) | Đối thoại, thường ngày, cảnh không để thở, ánh nhìn cảm xúc |
| 手持微晃 (rung nhẹ máy cầm tay) | Máy quay rung nhẹ bất quy tắc (biên độ khoảng ±2cm), mô phỏng nhịp thở của quay cầm tay | Biến động cảm xúc, bước đi trên phố, bám theo thân mật, góc nhìn chủ quan |
| 稳定器流动 (trôi bằng gimbal) | Máy quay di chuyển mượt và đều, không rung | Lang thang đô thị, nhân vật xuất hiện, giới thiệu không gian, chuyển đoạn |
| 缓推 (đẩy máy chậm) | Máy quay đẩy vào (推进) chủ thể chậm rãi, tốc độ đẩy vào (推进) khoảng 0.3 mét mỗi giây | Cảm xúc dâng lên, sự thật đến gần, chú ý dồn tụ |
| 缓拉 (kéo máy ra chậm) | Máy quay kéo ra (拉远) chậm về phía sau, tốc độ kéo ra (拉远) khoảng 0.3 mét mỗi giây | Chia xa, khép lại, hé lộ toàn cảnh |
| 跟拍 (bám theo nhân vật) | Máy quay di chuyển đồng bộ và giữ khoảng cách khoảng 2 mét với nhân vật | Đi bộ bám theo, truy theo trong thành phố |
| 摇镜 (lia máy) | Máy quay xoay ngang/dọc tại chỗ | Chuyển tia nhìn, giới thiệu quan hệ không gian |

### 7.2 Chuyển động máy quay bị cấm

- Lia máy nhanh (甩镜) không có mục đích tự sự, đẩy gấp kéo gấp (tốc độ đẩy kéo vượt 1 mét mỗi giây)
- Rung máy cầm tay dữ dội quá 3 giây (trừ khi tự sự là chủ quan bị đánh/choáng váng)
- Chuyển cảnh hoa mỹ vô lý — lật màn, gạt màn, rèm lá sách, lật trang và các hiệu ứng chuyển cảnh khác
- Máy quay xoay 360 độ không có lý do

### 7.3 Triết lý chuyển động máy quay của Đô thị người thật

- Máy cố định (固定机位) là lựa chọn đầu tiên — để khán giả thấy người thật tồn tại tự nhiên trong không gian thật
- Rung nhẹ máy cầm tay dùng ở các đoạn cảm xúc — nhưng biên độ rung không vượt khoảng thông thường của phong cách phim tài liệu điện ảnh
- Điểm khởi và điểm kết của cú máy động bắt buộc êm, quá trình di chuyển phải đều — cấm tăng tốc đột ngột hoặc dừng gấp

---

## 8. Quy chuẩn chuyển cảnh

### 8.1 Các cách chuyển cảnh được phép

| Chuyển cảnh | Cách thực hiện hình ảnh | Chức năng tự sự |
|---|---|---|
| Cắt thẳng | Chuyển trực tiếp | Chuyển cú máy trong cùng một cảnh (mặc định) |
| Chuyển cảnh khớp ánh sáng | Hai bối cảnh chuyển cho nhau dưới logic ánh sáng tương tự | Thời gian trôi, tự sự song song. Ví dụ: nắng sớm ngoài cửa sổ ở chỗ A → nắng sớm ngoài cửa sổ ở chỗ B |
| Chuyển cảnh khớp không gian | Hai không gian hô ứng nhau về bố cục hoặc yếu tố | Nhảy bối cảnh. Ví dụ: khoảnh khắc cửa văn phòng khép lại → khoảnh khắc cửa căn hộ mở ra |
| Chuyển bằng cảnh không | Chèn một cảnh không bối cảnh (3-5 giây) | Đệm cảm xúc, phân chương, ngầm chỉ thời gian trôi |
| Chuyển bằng điểm nét | Nét của cú máy trước chuyển từ chủ thể sang hậu cảnh, cú máy sau bắt nét dần vào chủ thể từ hậu cảnh mờ | Chuyển không gian, dịch chuyển sự chú ý |

### 8.2 Các cách chuyển cảnh bị cấm

- Chuyển cảnh bằng hiệu ứng thị giác thuần túy (lật trang, gạt màn, rèm lá sách, mosaic)
- Chuyển cảnh xoay/zoom không có logic tự sự
- Dùng quá hai kiểu chuyển cảnh trong cùng một cảnh

---

## 9. Hoạch định đồng bộ tiếng và hình (riêng cho Seedance 2.0)

### 9.1 Quy chuẩn ghi chú tiếng động môi trường

Mỗi cảnh ghi chú 1-2 tiếng động môi trường cốt lõi, viết vào cột tiếng động môi trường của bảng phân cảnh:

| Bối cảnh | Tiếng động môi trường gợi ý |
|---|---|
| Văn phòng | Tiếng gõ bàn phím nhẹ / tiếng ù của điều hòa / tiếng máy in ở xa |
| Quán cà phê | Tiếng hơi máy pha cà phê / tiếng ly tách va khẽ / tiếng người thấp thoáng phía sau |
| Đường phố ban ngày | Tiếng lốp xe trên đường / tiếng người từ xa / tiếng gió qua lá cây ven đường |
| Đường phố đêm mưa | Tiếng mưa gõ kính xe và mặt đường / tiếng xe chạy qua tóe nước thi thoảng |
| Ở nhà ban đêm | Tiếng ù tần thấp của tủ lạnh / tiếng xe thi thoảng ngoài cửa sổ / tiếng đồng hồ chạy |
| Sân thượng | Tiếng gió / tiếng ù yếu ớt của thành phố ở xa |
| Ga tàu điện | Tiếng loa báo tàu vào ga và tiếng phanh / tiếng bước chân dòng người |

### 9.2 Ghi chú đồng bộ tiếng và hình

Ghi chú các điểm đồng bộ tiếng - hình then chốt trong bảng phân cảnh:
- `t=2s` tiếng khẽ khi đáy cốc cà phê chạm mặt bàn lúc đặt xuống
- `t=5s` tiếng bản lề kẽo kẹt nhẹ khi cửa được đẩy ra — nhân vật bước vào trong nhà, tiếng phố bên ngoài bị cửa chặn lại nên nhỏ hẳn đi
- `t=8s` tiếng còi xe cứu thương vọng từ xa ngoài cửa sổ — nhân vật ngẩng nhìn ra ngoài khoảng 1 giây

---

## 10. Mẫu thẻ phân cảnh cho Seedance 2.0

Mỗi cú máy dùng định dạng thẻ dưới đây, điền lần lượt từng cú máy trong bảng phân cảnh:
【Cú máy X】Thời lượng: {số liệu}s | Cỡ cảnh: {大特写/近景/中近景/中景/全景/大全景/空镜}

Mô tả hình ảnh:
{chuyển động nhân vật — gồm quỹ đạo động tác cụ thể, thời lượng, phối hợp các bộ phận cơ thể}
{biểu cảm nhân vật — gồm hướng tia nhìn, chi tiết vi biểu cảm}
{logic nguồn sáng — loại ánh chính + hướng + nhiệt độ màu K + tỉ lệ sáng tối}
{chi tiết môi trường — gồm đạo cụ cụ thể, bề mặt chất liệu, dấu vết sử dụng}
{chuyển động trang phục — nếu có gió thổi/trang phục chuyển động theo động tác}

Tọa độ không gian:
Ngang {trái/giữa/phải khung hình, khoảng cách cụ thể tới mép} | Chiều sâu {cách máy quay bao nhiêu mét}
{quan hệ khoảng cách với vật cố định trong bối cảnh}
{nếu từ hai người trở lên, khoảng cách tương đối và hướng nhìn giữa các nhân vật}

Chuyển động máy quay: {固定/手持微晃/缓推/缓拉/跟拍/摇镜}
{tốc độ cụ thể và vị trí khởi - kết của chuyển động máy}

Chuyển cảnh: {cắt thẳng/chuyển bằng cảnh không/khớp ánh sáng/khớp không gian — ghi chú điểm nối giữa cú máy trước và sau}

Tiếng động môi trường: {1-2 tiếng động môi trường cốt lõi}

Neo then chốt cho Seedance 2.0:
Neo nhân vật: @ImageX_{tên nhân vật} {mô tả tạo hình}
Neo bối cảnh: @ImageX {tên bối cảnh} {mô tả không gian}
{Neo đạo cụ: @ImageX {tên đạo cụ} — nếu có đạo cụ cầm tay/tương tác cốt lõi}
---

## 11. Quy chuẩn sử dụng cảnh không

### 11.1 Cảnh không không phải là "không có gì để quay"

Cảnh không là vật chứa cảm xúc. Mỗi cảnh không bắt buộc có mục đích tự sự và nội dung hình ảnh cụ thể:

| Loại cảnh không | Mục đích tự sự | Ví dụ |
|---|---|---|
| Thiết lập bối cảnh | Không gian mới xuất hiện lần đầu — để khán giả thấy rõ đây là nơi nào | Toàn cảnh rộng văn phòng (大全景): dãy bàn làm việc, cửa kính sát sàn, thành phố ngoài cửa sổ |
| Đệm cảm xúc | Nhịp thở sau một đoạn cảm xúc cao | Giọt mưa trượt xuống mặt kính ngoài cửa sổ, tốc độ khoảng 2cm mỗi giây |
| Thời gian trôi | Ngầm chỉ thời gian đã đi qua | Bầu trời ngoài cùng một khung cửa chuyển dần từ xanh biếc buổi chiều sang tím thẫm |
| Khoảng lặng ẩn dụ | Mượn vật tả tình | Cốc cà phê uống dở trên bàn, miệng cốc có vệt son |
| Nối chuyển cảnh | Đoạn chuyển tự nhiên giữa hai không gian | Bóng đèn ống ở lồng cầu thang — cảnh trước là văn phòng, cảnh sau là sân thượng |

### 11.2 Quy chuẩn mô tả cảnh không cho Seedance 2.0

Cảnh không cũng bắt buộc tuân theo luật sắt mô tả nguồn sáng + chất liệu + chuyển động: ánh cửa sổ buổi chiều chếch vào từ bên phải (khoảng 4500K), hắt lên mặt bàn họp trống trải những vệt sáng kẻ sọc của rèm lá sách,
vệt sáng thay đổi chậm về bề rộng và vị trí theo mây trôi ngoài cửa sổ, khoảng 5 giây sau thì tối hẳn — một đám mây đã che mặt trời.
Mặt bàn có vết xước nhỏ và vòng nước cốc còn lại sau cuộc họp.

---

## 12. Danh mục tự kiểm chất lượng bảng phân cảnh

Sau khi hoàn thành bảng phân cảnh của mỗi cảnh, đạo diễn tự kiểm từng mục:

| Mục kiểm | Tiêu chuẩn đạt |
|---|---|
| Nguồn sáng truy được | Mỗi cú máy trả lời được "ánh sáng từ đâu tới, nhiệt độ màu bao nhiêu" |
| Động tác thực thi được | Mỗi động tác có quỹ đạo, thời lượng, bộ phận cơ thể |
| Không gian định vị được | Mỗi cú máy đều ghi vị trí ngang và vị trí chiều sâu của nhân vật |
| Vị trí đứng nối được | Vị trí/tư thế của cùng một người ở các cú máy liền kề nối tiếp được |
| Môi trường có chuyển động | Cứ 3-4 cú máy có ít nhất 1 cú máy có chuyển động môi trường |
| Lời văn không rỗng | Không có mô tả không thực thi được kiểu "cô ấy rất đẹp", "không khí rất tốt" |
| Sạch bóng thuật ngữ CG | Không có từ vựng CG kiểu PBR/SSR/AO/ánh sáng thể tích/thế hệ mới |
| @reference đầy đủ | Nhân vật/bối cảnh/đạo cụ cốt lõi đều đã ghi trích dẫn neo |
