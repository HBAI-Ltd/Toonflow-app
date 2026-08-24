---
name: liveaction_urban_character
description: Tạo hình cơ bản nhân vật đô thị người thật · sổ tay ràng buộc
metaData: liveaction_urban_art_skills
---

# Tạo hình cơ bản nhân vật đô thị người thật · Sổ tay ràng buộc

---

## 1. Logic chọn diễn viên — con người trước ống kính

> Điểm khởi đầu của nhân vật 3D là "dựng một mô hình"; điểm khởi đầu của đô thị người thật là "chọn một con người đứng trước máy quay". Các nguyên tắc dưới đây xuất phát từ việc chọn diễn viên và quay thực tế, không xuất phát từ dựng mô hình.

1. **Gương mặt chính là tự sự** — một gương mặt là một câu chuyện chưa được viết ra. Đô thị người thật không truy cầu "ngũ quan hoàn hảo" mà truy cầu "ngũ quan đáng được nhìn ngắm" — nét bất đối xứng có tính nhận diện, những khuyết điểm nhỏ giàu chất chuyện, gương mặt chịu được cái nhìn chăm chú của máy quay
2. **Chất người thường ưu tiên hơn chất ngôi sao** — tự sự đô thị cần "người trông giống như người bạn gặp mỗi ngày trên tàu điện ngầm", không phải "người trông như vừa bước ra từ bìa tạp chí". Gương mặt thật ở trạng thái mặt mộc được ưu tiên hơn tóc và trang điểm cầu kỳ
3. **Dáng người nói thật** — dáng đứng thật không đối xứng: trọng tâm dồn về một chân, vai hơi lệch, cổ ngả nhẹ ra trước hoặc ra sau. Tuyệt đối không dùng dáng đứng đối xứng kiểu người mẫu hay tư thế nghiêm kiểu quân đội
4. **Cùng một nhân vật phải nhận ra được ở mọi góc** — bốn góc chính diện/nghiêng/lưng/cận cảnh bắt buộc hiện ra như bản ghi ảnh của cùng một người, chứ không phải bốn người giống nhau. Điểm nhận diện cốt lõi: đường viền xương hàm, chỗ gãy của sống mũi, hình dáng vành tai, hướng chân tóc

---

## 2. Gương mặt nữ — năm gương mặt dưới cái nhìn của máy quay

> Không phân loại theo giải phẫu "dáng mặt/dáng mắt/dáng mũi", mà tổ chức theo cách máy quay đọc một gương mặt.

### Kiểu A: lạnh trong và tiết chế

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Xương rõ nét, gò má thấy được nhưng không bạnh, đường hàm sạch và mượt, giữa mặt hơi phẳng (đặc trưng châu Á), không truy cầu độ nổi khối kiểu phương Tây | cấu trúc gương mặt xương rõ nét、gò má dịu、đường hàm sạch、độ phẳng tự nhiên của gương mặt châu Á |
| Ánh mắt | Mí đơn hoặc mí lót hẹp, khe mắt hơi dài, tròng trắng sạch, không cố mở to, tự thân đã có nét xa cách | mí lót hẹp/mí đơn、khe mắt hơi dài、tròng trắng sạch、ánh nhìn tiết chế、xa cách mà không lạnh lùng |
| Miệng | Dáng môi mỏng và viền rõ, khép tự nhiên hoặc hé nhẹ, khóe môi không nhếch không xệ | môi mỏng viền rõ、khép tự nhiên、trạng thái môi trung tính |
| Da | Tông trắng hơi lạnh, thấy được mao mạch tự nhiên ở vùng gò má, vùng chữ T hơi bóng dầu, không lì toàn mặt | màu da trắng hơi lạnh、độ bóng tự nhiên trên mặt、vùng chữ T hơi ra dầu、giữ chất da thật |
| Quan hệ với máy quay | Hợp với cái nhìn cận ống 50mm, ánh sáng xiên bên tạc khối xương, tông đen trắng | — |

### Kiểu B: dịu dàng chữa lành

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường nét mềm và tròn, má đầy nhưng không chảy xệ, cằm hơi tròn, đường viền tổng thể mềm không có góc nhọn | đường nét gương mặt mềm tròn、má đầy、cằm tròn、đường viền mềm không góc nhọn |
| Ánh mắt | Mắt tròn/mắt hạnh nhân, khe mắt mở rộng theo chiều dọc, ngọa tàm rõ, mắt có ý cười nhưng không phô, đồng tử to và trong | mắt hạnh nhân tròn、ngọa tàm rõ、ánh mắt có ý cười nhưng tiết chế、đồng tử to và trong |
| Miệng | Môi hơi dày, đỉnh môi tròn, khóe môi hơi nhếch ở trạng thái tự nhiên, màu môi hồng ấm | dáng môi hơi dày、đỉnh môi tròn、khóe môi hơi nhếch tự nhiên、màu môi hồng ấm |
| Da | Tông trắng ấm, trong và có sắc máu, má ửng hồng tự nhiên, độ bóng dịu | da trắng ấm trong、má ửng hồng tự nhiên、độ bóng da dịu |
| Quan hệ với máy quay | Hợp với ống 85mm tele trung kéo gần, ánh sáng cửa sổ đánh xiên 45°, màu tông ấm | — |

### Kiểu C: đô thị sắc sảo

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền gọn gàng, góc hàm rõ nhưng không bè, cấu trúc giữa mặt rành mạch, tổng thể toát lên một kiểu tinh tế của "được đối đãi nghiêm túc" | đường viền gương mặt gọn gàng、góc hàm rõ、giữa mặt có cấu trúc rành mạch、sắc sảo mà vẫn dịu |
| Ánh mắt | Dáng mắt hơi dài, khóe mắt trong sắc, đuôi mắt hơi hếch nhưng không phô, ánh nhìn điềm tĩnh và có lực | dáng mắt hơi dài、khóe mắt trong sắc、đuôi mắt hơi hếch、ánh nhìn điềm tĩnh có lực |
| Miệng | Dáng môi rõ, đường viền môi rành mạch, ở trạng thái tự nhiên môi mím nhẹ, toát lên sự tiết chế | dáng môi viền rõ、đường viền môi rành mạch、mím nhẹ tự nhiên、khí chất tiết chế |
| Da | Tông trắng lạnh trung tính, chất da mịn nhưng giữ vân da tự nhiên, độ bóng vừa phải | màu da trắng lạnh trung tính、chất da mịn nhưng giữ vân、độ bóng vừa phải |
| Quan hệ với máy quay | Hợp với chân dung môi trường 35mm, ánh sáng cửa sổ văn phòng, màu tông lạnh nhưng không mất hơi ấm | — |

### Kiểu D: thanh xuân tràn năng lượng

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Má đầy còn sót mỡ trẻ con, cằm nhỏ xinh, đường viền hơi tròn hơi ngắn, độ nổi xương yếu, cảm giác collagen căng đầy | má đầy dáng trẻ、cằm nhỏ xinh、đường viền hơi tròn hơi ngắn、cảm giác collagen căng đầy |
| Ánh mắt | Dáng mắt to tròn, khe mắt mở rộng theo chiều dọc, ánh mắt sáng trong, kiểu nhìn thẳng của người chưa từng trải | dáng mắt to tròn、khe mắt mở rộng、ánh mắt sáng trong、ánh nhìn thẳng không phòng bị |
| Miệng | Dáng môi đầy hơi cong lên, hạt môi rõ, ở trạng thái tự nhiên môi hé nhẹ, màu môi hồng nhạt | dáng môi đầy hơi cong lên、hạt môi rõ、hé nhẹ tự nhiên、màu môi hồng nhạt |
| Da | Nền trắng ấm, độ trong và bóng mạnh, gần như không thấy lỗ chân lông to, má hồng hào tự nhiên | da trắng ấm trong、độ bóng tự nhiên mạnh、lỗ chân lông mịn、má hồng hào |
| Quan hệ với máy quay | Hợp với ống 35mm ở cự ly gần, ánh sáng tự nhiên mạnh, màu tông ấm high-key | — |

### Kiểu E: đời thường phố chợ

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền hơi bè hơi tròn, góc hàm hơi bè, gò má hơi cao, tổng thể toát lên một chất liệu của "đã bị cuộc sống mài giũa" | đường viền hơi bè hơi tròn、góc hàm hơi bè、gò má hơi cao、gương mặt thật được cuộc đời tạc nên |
| Ánh mắt | Mí đơn hoặc mí lót, đuôi mắt hơi xệ hoặc nằm ngang, ánh mắt có từng trải — trong mệt mỏi có hơi ấm, trong lọc lõi có thiện ý | mí đơn/mí lót、đuôi mắt hơi xệ、ánh mắt đầy từng trải、hơi ấm trong mệt mỏi |
| Miệng | Dáng môi vừa phải hơi mỏng, đường viền môi không rành mạch lắm, khóe môi có thể có nếp nhăn mảnh | dáng môi vừa phải hơi mỏng、đường viền môi dịu、nếp nhăn mảnh tự nhiên ở khóe môi |
| Da | Tông hơi ấm/màu lúa mì, thấy được vết rám nắng, nếp nhăn li ti trên bề mặt, chất da dày dặn chân thực | màu da lúa mì hơi ấm、thấy được vết rám nắng、nếp nhăn mảnh tự nhiên、chất da thật dày dặn |
| Quan hệ với máy quay | Hợp với chất tài liệu ống 50mm, ánh sáng tự nhiên ở chợ/ngõ nhỏ, màu thật độ tương phản thấp | — |

---

## 3. Gương mặt nam — năm gương mặt dưới cái nhìn của máy quay

### Kiểu A: sắc lạnh tiết chế

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Xương nổi rõ, đường hàm sắc, gò má rõ, giữa mặt hơi phẳng, tổng thể gầy gọn | cấu trúc gương mặt xương sắc、gò má rõ、đường hàm gọn、gầy gọn |
| Ánh mắt | Mí đơn hoặc mí lót hẹp, khe mắt hơi dài, ánh mắt lạnh mà không dữ, mang khoảng cách của người quan sát | mí đơn/mí lót hẹp、khe mắt hơi dài、ánh nhìn của người quan sát、lạnh mà không dữ |
| Miệng | Môi mỏng viền rõ, khép tự nhiên, nhân trung rõ | môi mỏng viền rõ、khép tự nhiên、nhân trung rõ |
| Da | Tông trắng lạnh, vùng chữ T ra dầu tự nhiên, thoáng thấy bóng xanh của chân râu | màu da nền trắng lạnh、dầu vùng chữ T tự nhiên、thoáng bóng xanh chân râu |
| Quan hệ với máy quay | Hợp với cái nhìn chính diện ống 50mm, ánh sáng gắt xiên bên tạc khối xương, tông tối độ bão hòa thấp | — |

### Kiểu B: ôn hòa nội liễm

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền mềm nhưng không mất góc cạnh, độ đầy của má vừa phải, cằm tròn pha vuông, tổng thể gần gũi nhưng không mềm oặt | đường viền mềm mà không mất góc cạnh、má vừa phải、cằm tròn pha vuông |
| Ánh mắt | Dáng mắt hơi tròn, khe mắt mở rộng, ánh mắt ôn hòa có ánh sáng, khi nhìn cho người ta cảm giác "anh ấy đang nghe thật sự" | dáng mắt hơi tròn、khe mắt mở rộng、ánh mắt ôn hòa có ánh sáng、ánh nhìn lắng nghe chăm chú |
| Miệng | Độ dày môi vừa phải, đường viền môi dịu, khóe môi hơi nhếch ở trạng thái tự nhiên, nét cười không gượng | độ dày vừa phải、đường viền môi dịu、khóe môi hơi nhếch tự nhiên |
| Da | Tông trắng ấm/trung tính, chất da sạch, vân da thấy được tự nhiên | màu da trắng ấm/trung tính、chất da sạch、vân da thấy được tự nhiên |
| Quan hệ với máy quay | Hợp với ống 85mm tele trung, ánh sáng cửa sổ tán xạ, sáng dịu tông ấm | — |

### Kiểu C: rắn rỏi từng trải

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền rành mạch, gò má cao, góc hàm bè và có lực, cung mày nổi, cảm giác khung xương mặt mạnh mẽ — một gương mặt "đã bị gió thổi qua" | gương mặt rắn rỏi đường viền rành mạch、gò má cao、góc hàm bè và có lực、cung mày nổi、cảm giác khung xương mạnh |
| Ánh mắt | Hốc mắt sâu, dáng mắt hơi dài, ánh nhìn điềm tĩnh, trong mắt có trải nghiệm nhưng không nặng nề | hốc mắt sâu、dáng mắt hơi dài、ánh nhìn điềm tĩnh có lực、ánh mắt có chuyện nhưng không nặng nề |
| Miệng | Dáng môi hơi mỏng, đường viền môi rõ, khi khép tự nhiên môi mím nhẹ | dáng môi hơi mỏng viền rõ、mím nhẹ tự nhiên |
| Da | Hơi ấm/màu lúa mì, vân da rõ, thấy được dấu vết năm tháng (nếp nhăn mảnh đuôi mắt, rãnh cười bắt đầu hiện), lỗ chân lông thấy được thật | màu da lúa mì hơi ấm、vân da rõ、dấu vết năm tháng tự nhiên、lỗ chân lông thấy được thật |
| Quan hệ với máy quay | Hợp với chân dung môi trường 35mm, ánh sáng gắt xiên bên tạc đường viền, tông tối tương phản cao | — |

### Kiểu D: thiếu niên nắng ấm

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền hơi tròn và mềm, cảm giác khung xương yếu, má đầy, cằm hơi ngắn, nét thiếu niên chưa phai hết | đường viền hơi tròn mềm、cảm giác khung xương yếu、má đầy、gương mặt còn nguyên nét thiếu niên |
| Ánh mắt | Dáng mắt to và trong, khe mắt mở rộng, ánh mắt sáng và thẳng, kiểu nhìn hoàn toàn không phòng bị | dáng mắt to và trong、khe mắt mở rộng、ánh mắt sáng và thẳng、ánh nhìn không phòng bị |
| Miệng | Môi hơi dày, đường viền môi dịu, ở trạng thái tự nhiên môi hơi hé, khi cười hở răng tự nhiên | dáng môi hơi dày và dịu、hé nhẹ tự nhiên、cười hở răng tự nhiên |
| Da | Tông trắng ấm, chất da mịn sạch, độ bóng mạnh, gần như không có dấu vết năm tháng | màu da trắng ấm、chất da mịn sạch、độ bóng mạnh |
| Quan hệ với máy quay | Hợp với chân dung môi trường 35mm, ánh sáng tự nhiên dồi dào, màu tươi sáng high-key | — |

### Kiểu E: giang hồ phố thị

| Đặc trưng nhiếp ảnh | Mô tả | Prompt |
|---|---|---|
| Cấu trúc gương mặt | Đường viền hơi bè, trán rộng, hàm bè và có lực, gương mặt mang dấu vết "đã dùng qua" — bị nắng đốt, bị gió thổi, bị cuộc sống mài | đường viền hơi bè、trán rộng、hàm bè và có lực、gương mặt được cuộc đời tạc nên |
| Ánh mắt | Mí đơn/mí lót, dáng mắt hơi nhỏ hơi dài, ánh mắt có nét tinh ranh phố thị và nghĩa khí giang hồ, nhìn thẳng không né tránh | mí đơn/mí lót、dáng mắt hơi nhỏ hơi dài、ánh mắt tinh ranh mà có nghĩa khí、ánh nhìn thẳng không né tránh |
| Miệng | Dáng môi hơi dày, đường viền môi không rành mạch lắm, ở trạng thái tự nhiên môi hơi mở, có dấu vết đời sống do hút thuốc/uống trà để lại | dáng môi hơi dày、đường viền môi dịu không rành mạch、hơi mở tự nhiên、dấu vết đời sống thường ngày |
| Da | Tông lúa mì/hơi sậm, chênh màu do nắng rõ rệt (cổ áo/cổ tay áo), vân da dày dặn, lỗ chân lông to thấy rõ, có thể có sẹo cũ | màu da lúa mì/hơi sậm、chênh màu do nắng rõ rệt、vân da dày dặn chân thực、lỗ chân lông to thấy rõ、sẹo cũ tự nhiên |
| Quan hệ với máy quay | Hợp với chất tài liệu ống 35mm, ánh sáng tự nhiên ngoài phố, màu thật tương phản cao | — |

---

## 4. Chất da — làn da dưới máy quay

> Chất da của đô thị người thật không phải tham số render, mà là cách ánh sáng hành xử trên làn da thật: phản xạ, truyền qua và tán xạ đều tùy thuộc vào dầu, nước, sắc tố và năm tháng của chính làn da đó.

### Nữ

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Tông màu da | Dải màu da thật của phụ nữ đô thị châu Á: trắng lạnh đến trắng ấm, cho phép màu da không đều nhẹ (gò má hơi đỏ, quanh mắt hơi sậm) — đó là bằng chứng của người thật | màu da phụ nữ châu Á thật、màu da không đều tự nhiên、gò má ửng đỏ tự nhiên、chất người thật quanh vùng mắt |
| Độ bóng bề mặt | Không lì cũng không bóng dầu — ánh phản xạ của dầu tự nhiên vùng chữ T, điểm sáng tự nhiên trên đỉnh gò má, là dấu hiệu làn da "đang sống" | độ bóng da tự nhiên、phản xạ dầu thật vùng chữ T、làn da đang sống chứ không phải dựng mô hình |
| Độ thấy của vân da | Với điều kiện chụp ống 50mm, cự ly 1 mét: lỗ chân lông phía trên gò má thoáng thấy, lỗ chân lông hai bên cánh mũi rõ, nếp nhăn mảnh giữa hai chân mày hiện diện tự nhiên | lỗ chân lông thật thấy được、vân thật ở cánh mũi、nếp nhăn mảnh tự nhiên giữa hai chân mày |
| Giữ lại khuyết điểm | Giữ nhưng không nhấn: nốt ruồi nhỏ lác đác, tàn nhang nhạt màu, vết thâm mụn cũ mờ, mao mạch bề mặt — đây là bằng chứng của "con người", không phải bug cần sửa | giữ nốt ruồi nhỏ thật、tàn nhang nhạt màu tự nhiên、chất không hoàn hảo của làn da người thật |
| Nghiêm cấm | Da mịn kiểu nhựa, mặt nạ sáp, cảm giác silicone không lỗ chân lông, lì đều toàn mặt, da mượt kiểu AI | — |

### Nam

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Tông màu da | Dải màu da thật của nam giới đô thị châu Á: trắng lạnh đến màu lúa mì khỏe khoắn, cho phép chênh màu do nắng (màu da mặt và cổ chuyển tiếp tự nhiên, vùng chữ T sậm hơn, quanh mắt sậm hơn) | màu da nam giới châu Á thật、chênh màu do nắng tự nhiên、chuyển tiếp màu da thật giữa mặt và cổ |
| Độ bóng bề mặt | Phản xạ dầu vùng chữ T (điểm sáng trên trán/sống mũi), độ bóng nhẹ của hàm sau khi cạo râu — độ bóng da nam giới đến từ dầu chứ không phải phấn bắt sáng | độ bóng dầu vùng chữ T tự nhiên、chất gương mặt thật sau khi cạo râu、phản xạ da thật chứ không phải đã chỉnh sửa |
| Độ thấy của vân da | Với điều kiện chụp ống 50mm, cự ly 1 mét: lỗ chân lông to thấy rõ, nếp nhăn giữa chân mày/nếp nhăn trán hiện ra tự nhiên, chân râu và vân lỗ chân lông rõ | lỗ chân lông thật to thấy rõ、nếp nhăn giữa chân mày/nếp nhăn trán tự nhiên、chân râu và lỗ chân lông thấy rõ |
| Giữ lại khuyết điểm | Giữ nhưng không nhấn: vết thâm mụn cũ, sẹo nhạt màu, đốm nắng, vết xước nhỏ khi cạo râu — đây không phải khiếm khuyết, mà là đặc điểm nhận diện của đúng "con người này" | giữ vết thâm mụn cũ/sẹo nhạt màu、đốm nắng thật、đặc điểm không thể thay thế của nhân vật |
| Nghiêm cấm | Làm mịn quá tay đến mức mượt như nữ, mặt nạ sáp, cảm giác CG không lỗ chân lông, xóa sạch dấu chân râu | — |

---

## 5. Cơ thể — dáng đứng, tư thế và quan hệ với máy quay

### Nữ

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Chiều cao | Do thiết định nhân vật chỉ định, dải mặc định 158-172cm (bao phủ khoảng chiều cao phổ biến của phụ nữ đô thị Trung Quốc) | {chiều cao}cm tall、{tỉ lệ cơ thể tự nhiên ứng với chiều cao} |
| Tỉ lệ cơ thể | Tỉ lệ cơ thể thật của phụ nữ châu Á, không kéo dài chân quá mức, tỉ lệ đầu-thân gần thực tế (khoảng 6.5-7.5 đầu) | tỉ lệ cơ thể phụ nữ châu Á thật、tỉ lệ đầu-thân tự nhiên、vóc dáng tả thực không kéo dài không thu nhỏ |
| Dáng đứng | Dáng đứng tự nhiên của khoảnh khắc "bị chụp được" — trọng tâm dồn về một chân, khung chậu hơi nghiêng, vai không hoàn toàn ngang, tay buông tự nhiên hoặc hơi co — tuyệt đối không dùng dáng đứng đối xứng kiểu người mẫu | dáng đứng tự nhiên trọng tâm lệch、khung chậu hơi nghiêng、tư thế đứng thật chứ không phải tạo dáng |
| Vai và cổ | Đường vai cổ tự nhiên, cơ thang hiện diện tự nhiên, xương quai xanh rõ nhưng không nhô quá mức, độ ngả trước của cổ hợp với tư thế thường ngày | đường vai cổ tự nhiên、cơ thang thật、tư thế cổ tự nhiên、xương quai xanh thật |
| Bàn tay | Dáng tay tự nhiên, khớp ngón thấy được, móng sạch không cần làm nail, lòng bàn tay có vân thật, mu bàn tay thấy được mạch máu nông | dáng tay tự nhiên、khớp ngón thấy được、vân lòng bàn tay thật、mu bàn tay tự nhiên |
| Nghiêm cấm | Dáng đứng đối xứng kiểu người mẫu, kéo dài chân quá mức, vai vuông góc, cổ thiên nga làm đẹp quá đà, ngón tay thon đến mức méo thực tế | — |

### Nam

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Chiều cao | Do thiết định nhân vật chỉ định, dải mặc định 170-185cm (bao phủ khoảng chiều cao phổ biến của nam giới đô thị Trung Quốc) | {chiều cao}cm tall、{tỉ lệ cơ thể tự nhiên ứng với chiều cao} |
| Tỉ lệ cơ thể | Tỉ lệ cơ thể thật của nam giới châu Á, không kéo dài chân quá mức, tỉ lệ đầu-thân gần thực tế (khoảng 7-7.5 đầu) | tỉ lệ cơ thể nam giới châu Á thật、tỉ lệ đầu-thân tự nhiên、vóc dáng tả thực chứ không phải kiểu truyện tranh |
| Dáng đứng | Tư thế tự nhiên của khoảnh khắc "bị gọi tên và quay đầu lại" — trọng tâm dồn về một chân, đường vai hơi nghiêng, tay buông tự nhiên hoặc đút túi/chống hông (không phải tạo dáng) | tư thế tự nhiên khi bị gọi và quay lại、trọng tâm lệch tự nhiên、dáng đứng thường ngày thật |
| Vai và cổ | Bề ngang vai tự nhiên (không cố ưỡn vai), cơ thang hiện diện tự nhiên, độ ngả trước của cổ trong phạm vi thường ngày, thấy được yết hầu | bề ngang vai tự nhiên không làm điệu、cơ thang thật、tư thế cổ thường ngày、thấy được yết hầu |
| Bàn tay | Khớp ngón rành mạch, tỉ lệ ngón tay tự nhiên, móng ngắn và sạch, lòng bàn tay có dấu vết sử dụng (chai do cầm bút, dấu vết lao động), mu bàn tay thấy được mạch máu | dáng tay tự nhiên khớp ngón rành mạch、dấu vết sử dụng thật ở lòng bàn tay、mạch máu mu bàn tay thấy được |
| Nghiêm cấm | Ưỡn lưng kiểu thể hình, dáng đứng nghiêm kiểu quân đội, kéo dài tỉ lệ chân quá mức, ngón tay ngắn mập hoặc dài mảnh đến mức méo thực tế | — |

---

## 6. Kiểu tóc — mái tóc thật trước ống kính

> Tóc của đô thị người thật không phải sợi tóc dựng mô hình, mà là mái tóc thật có trọng lượng, có dầu, bị gió thổi rối, dính vào vầng trán đẫm mồ hôi, và biến thành đường viền vàng vụn khi ngược sáng.

### Nữ

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Màu tóc | Đen tự nhiên/nâu sẫm/nâu hạt dẻ, cho phép ánh phản xạ nâu đỏ tự nhiên dưới nắng, cấm nhuộm màu phi tự nhiên | tóc đen tự nhiên/tóc nâu sẫm、ánh phản xạ nâu ấm dưới nắng、màu tóc nguyên bản khỏe mạnh |
| Độ dài và tạo hình | Do thiết định nhân vật chỉ định: tóc ngắn ngang tai/tóc chạm xương quai xanh/tóc lỡ/tóc dài ngang eo/đuôi ngựa cao/đuôi ngựa thấp/búi tròn/búi lơi. Trạng thái cơ bản là buông tự nhiên, không thêm phụ kiện tóc, không tết tóc | {độ dài tóc}、buông tự nhiên/buộc lên、không phụ kiện tóc、không tết tóc、không tạo hình cường điệu |
| Chất tóc và vân tóc | Vân tóc thật — không phải sợi tóc CG tách rời từng sợi, mà là: các lọn tóc tụ lại và tách ra tự nhiên, tóc con lòa xòa trên má và sau gáy, đuôi tóc chẻ và xơ tự nhiên, khi có ánh sáng chiếu vào hiện đường viền ấm bán trong suốt | các lọn tóc tụ lại và tách ra thật、tóc con lòa xòa tự nhiên、đuôi tóc xơ tự nhiên、viền sáng trên tóc con khi ngược sáng |
| Độ thấy da đầu | Chỗ rẽ ngôi thấy được da đầu tự nhiên, chân tóc có tóc tơ, không phải đường biên gọn ghẽ kiểu tóc giả | chỗ rẽ ngôi thấy được da đầu tự nhiên、tóc tơ ở chân tóc、chân tóc thật chứ không phải tóc giả |
| Nghiêm cấm | Sợi tóc CG tách rời từng sợi, đều tăm tắp như tóc giả, không có tóc con, cứng đờ không cảm giác gió, tóc nhuộm màu huỳnh quang | — |

### Nam

| Phương diện | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|
| Màu tóc | Đen tự nhiên/nâu sẫm, cho phép ánh phản xạ nâu ấm dưới nắng, cho phép hai bên thái dương bạc tự nhiên (nhân vật trung niên), cấm nhuộm màu phi tự nhiên | tóc đen tự nhiên/tóc nâu sẫm、ánh phản xạ nâu ấm dưới nắng、hai bên thái dương bạc tự nhiên (nếu cần) |
| Độ dài và tạo hình | Do thiết định nhân vật chỉ định: tóc húi cua/tóc ngắn gọn gàng/tóc mái vuốt rẽ nhẹ/tóc ngắn vừa/tóc chạm vai. Trạng thái cơ bản là kiểu tóc tự nhiên, không dùng gel định hình cứng | {độ dài tóc}、kiểu tóc tự nhiên、không có dấu định hình bằng gel rõ rệt、không tạo hình cường điệu |
| Chất tóc và vân tóc | Vân tóc nam thật — ở trạng thái tóc ngắn thoáng thấy da đầu, sợi tóc có hướng đi tự nhiên (hướng xoáy tóc), tóc mai và chân râu chuyển tiếp tự nhiên, tóc con trên trán rơi xuống tự nhiên | vân tóc ngắn thật、hướng tóc tự nhiên、chuyển tiếp tự nhiên giữa tóc mai và chân râu、tóc con tự nhiên trên trán |
| Độ thấy da đầu | Ở trạng thái tóc ngắn/húi cua thấy rõ da đầu, chân tóc tự nhiên (có thể hơi lùi), xoáy tóc trên đỉnh đầu tự nhiên | thấy được da đầu ở trạng thái tóc ngắn、chân tóc tự nhiên、xoáy tóc thật |
| Nghiêm cấm | Sợi tóc CG tách rời từng sợi, cảm giác tóc giả, cảm giác vỏ cứng do gel, đường biên gọn ghẽ phi tự nhiên | — |

---

## 7. Trang phục nền — chính bộ đồ đã từng được mặc

> Trang phục nền của đô thị người thật không phải "đồ lót nền", mà là "bộ đồ vắt trên lưng ghế, đã mặc mấy lần, mang ký ức của cơ thể".

### Trang phục nền của nữ

Áo cơ bản màu trơn (áo thun cổ tròn/áo sơ mi cotton/áo len cardigan) + đồ mặc dưới cơ bản (quần jeans ống đứng/quần dài cotton/chân váy dài ngang gối), màu sắc chủ yếu là các màu cơ bản thường ngày của đô thị: đen/trắng/xám/be/xanh navy/kaki. Vải thấy được vân tự nhiên (nếp nhăn mềm của cotton, vân chéo của denim, vân vòng sợi của đồ len). Không có nhãn hiệu, không có hình in diện rộng, không có thiết kế trang trí.

### Trang phục nền của nam

Áo cơ bản màu trơn (áo thun cổ tròn/áo dài tay cổ henley/áo sơ mi cotton) + đồ mặc dưới cơ bản (quần jeans ống đứng/quần âu cotton dáng thường ngày), màu sắc chủ yếu là các màu cơ bản thường ngày của đô thị: đen/trắng/xám/xanh navy/kaki. Vải thấy được vân tự nhiên (nếp nhăn nhẹ của cotton sau khi giặt, độ bạc và mòn của denim, độ cong tự nhiên của cổ áo sơ mi). Không có nhãn hiệu, không có hình in diện rộng, không có thiết kế trang trí.

### Quy tắc thống nhất về trang phục

- Trang phục nền không phải "đồ lót nền" — bản thân nó đã là một bộ đồ thường ngày hoàn chỉnh, chỉ là đã lược bỏ mọi yếu tố trang trí
- Trang phục mang dấu vết "đã mặc": gấu áo hơi nhăn tự nhiên, cổ tay áo có dấu vết mặc vào cởi ra, vùng đầu gối/khuỷu tay có vân giãn nhẹ
- Phạm vi che phủ: về cơ bản che kín ngoại trừ mặt/cổ/bàn tay, ở mức che phủ của trang phục đô thị thường ngày, không hở hang quá mức
- Kiểu dáng, màu sắc, chất liệu trang phục hoàn toàn giống nhau ở bốn góc, hiện ra như bản ghi ảnh của cùng một bộ đồ ở các góc khác nhau

---

## 8. Bộ ảnh chân dung nhân vật — quy phạm chụp bốn góc

> Dưới đây không phải "bản xoay bốn hướng nhìn" của dựng mô hình 3D, mà là bốn góc máy chụp cùng một nhân vật trong **cùng một buổi chụp studio**. Ánh sáng, trang phục và trạng thái của người được chụp bắt buộc hiện ra như một bản ghi chụp liên tục.

### Định nghĩa hướng nhìn

| Vị trí | Góc | Cỡ cảnh | Yêu cầu nhiếp ảnh | Prompt |
|---|---|---|---|---|
| Ngoài cùng bên trái | Cận cảnh chính diện | Đỉnh đầu đến mép trên xương quai xanh | Khuôn mặt chiếm từ 60% khung hình trở lên. Tiêu cự ống kính 50mm hoặc 85mm, trường ảnh nông (f/2.8-f/4), điểm nét ở đồng tử. Ánh sáng dịu và đều, trong mắt có điểm sáng tự nhiên. Hiện đủ từ chân tóc đến xương quai xanh, không cắt cúp đỉnh đầu | portrait closeup, head to collarbone, shallow depth of field, eyes in sharp focus, natural catchlight, live-action photography |
| Thứ hai từ trái | Chính diện 0° | Toàn thân | Nhân vật hướng thẳng về máy quay, hai tay buông tự nhiên hoặc hơi co bên hông. Tiêu cự ống kính 35mm hoặc 50mm. Trường ảnh vừa phải (f/5.6-f/8), toàn thân nhân vật rõ nét, lọt khung đủ từ đỉnh đầu đến gót chân | front view, full body, facing camera, head to toe complete, live-action full body portrait |
| Thứ hai từ phải | Bên phải 90° | Toàn thân | Nhân vật quay nghiêng với máy quay, hiện đường viền nghiêng thuần. Đường viền nghiêng của sống mũi, dáng môi, hàm, vai lưng, chân rõ ràng phân biệt được. Trạng thái tóc nhìn nghiêng tự nhiên. Lọt khung đủ từ đỉnh đầu đến gót chân | profile view, full body, side angle 90 degrees, head to toe complete, natural side profile |
| Ngoài cùng bên phải | Phía sau 180° | Toàn thân | Nhân vật quay lưng về máy quay. Hiện kiểu tóc sau đầu, tư thế lưng, gót chân. Chân tóc sau gáy, tóc con sau tai, mặt sau cổ áo thấy được tự nhiên. Lọt khung đủ từ đỉnh đầu đến gót chân | back view, full body, rear angle 180 degrees, head to toe complete, live-action back portrait |

### Quy phạm khung hình

| Hạng mục | Yêu cầu nhiếp ảnh |
|---|---|
| Bố cục | Bốn góc xếp cạnh nhau từ trái sang phải trong cùng một khung hình, khoảng cách đều, không chồng lấn. Trình bày như một "ảnh casting/bảng tham chiếu nhân vật" |
| Phông nền | Giấy phông liền mạch màu xám trung tính, giá trị màu khoảng #B0B0B0, không mối nối, không chuyển sắc, không đốm sáng, không đổ bóng. Thấy được vân nhẹ của giấy phông, chứng minh đây là ảnh chụp thật chứ không phải render |
| Dáng đứng | Dáng đứng của người "được nhiếp ảnh gia yêu cầu 'đứng thẳng, tự nhiên một chút'" — không phải đứng nghiêm, không phải pose người mẫu, mà là khoảnh khắc đang đứng bình thường thì bất chợt bị yêu cầu giữ nguyên |
| Nhất quán | Cùng một nhân vật, cùng một buổi chụp, cùng một bộ đồ, cùng một điều kiện ánh sáng — bốn góc hiện ra là bản ghi chụp liên tục của cùng một người. Neo nhận diện: đường viền xương hàm, hình dáng vành tai, hướng chân tóc, thói quen dáng đứng |
| Biểu cảm gương mặt | Vi biểu cảm trung tính — trạng thái tự nhiên của người được chụp khi đối diện máy quay, không cố mỉm cười, không cố nghiêm nghị. Trong mắt có chút ý thức mờ nhạt của việc "đang nhìn vào ống kính" |
| Ánh sáng | Thiết lập sáng dịu tiêu chuẩn của studio: đèn chính softbox lớn phía trước + tấm hắt sáng bù hai bên. Ánh sáng dịu, hướng rõ ràng, không đổ bóng gắt, không mặt nửa sáng nửa tối. Tỉ số sáng khoảng 1:2 đến 1:3, giữ được độ nổi khối của gương mặt |
| Tỉ lệ khung hình | Đề xuất khổ rộng 4:1 hoặc 16:4 |

---

## 9. Khuôn mẫu prompt

bộ ảnh chân dung nhân vật đô thị người thật {giới tính}，chụp thật người thật，sáng dịu trong studio，giấy phông liền mạch xám trung tính，trình bày kiểu bảng tham chiếu nhân vật，
character portrait series, live-action photography, studio soft lighting, seamless grey backdrop, character reference sheet,
xếp cạnh nhau từ trái sang phải trong cùng khung hình: cận cảnh chân dung + toàn thân chính diện + toàn thân nghiêng + toàn thân sau lưng，
{mô tả kiểu gương mặt: dáng mặt, dáng mắt, dáng mũi, dáng môi, khí chất tổng thể}、trạng thái mặt mộc nguyên bản、không dấu vết trang điểm hoặc chỉ trang điểm thường ngày cực nhạt、
{mô tả màu da}、chất da người thật、vân lỗ chân lông thật、độ bóng da tự nhiên、không làm mịn không cảm giác silicone、
{mô tả chiều cao}、tỉ lệ cơ thể {nam/nữ} châu Á thật、tỉ lệ đầu-thân tự nhiên、dáng đứng thường ngày thật、trọng tâm lệch chứ không đứng nghiêm、
{mô tả kiểu tóc}、vân chất tóc thật、tóc con và lọn tóc tự nhiên、chân tóc chuyển tiếp tự nhiên、sợi tóc bán trong suốt khi ngược sáng、
{mô tả trang phục nền: áo cơ bản màu trơn + đồ mặc dưới cơ bản}、{màu sắc}、thấy được vân vải thật、nếp nhăn tự nhiên do mặc lên người、không logo không hình in không trang trí、
bốn góc hiện ra là bản ghi chụp studio liên tục của cùng một nhân vật、
giấy phông liền mạch xám trung tính #B0B0B0、sáng dịu đều trong studio、tỉ số sáng dịu、không đổ bóng gắt、không vùng đen chết、
khung hình sạch không chữ không watermark không chữ ký không viền、
chất lượng ảnh chụp tả thực người thật、chất nhiếp ảnh full-frame 35mm、không 3D không render không CG không vẽ tay

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc ở "trạng thái mặt mộc nguyên bản" hoặc chỉ trang điểm thường ngày cực nhạt (mức son dưỡng không màu, gel chân mày trong suốt), cấm để lộ lớp trang điểm |
| R2 | Bắt buộc tuyên bố trang phục nền là "trang phục thường ngày cơ bản màu trơn", không có bất kỳ nhãn hiệu, hình in, họa tiết hay thiết kế trang trí nào |
| R3 | Bắt buộc tuyên bố "không phụ kiện tóc, không phụ kiện, không trang sức, không đồ đội đầu, không hình xăm dán" |
| R4 | Bắt buộc chỉ định "giấy phông liền mạch xám trung tính, không bối cảnh, không đốm sáng, không chuyển sắc" |
| R5 | Bắt buộc chỉ định "bốn góc là bản ghi chụp liên tục của cùng một nhân vật", gương mặt/vóc dáng/kiểu tóc/trang phục/ánh sáng đều hiện ra như của cùng một buổi chụp |
| R6 | Góc toàn thân bắt buộc lọt khung đủ từ đỉnh đầu đến gót chân, nghiêm cấm cắt cúp bất kỳ bộ phận nào của cơ thể |
| R7 | Cận cảnh chân dung bắt buộc lọt khung đủ từ đỉnh đầu đến mép trên xương quai xanh, nghiêm cấm cắt cúp đỉnh đầu |
| R8 | Bắt buộc tuyên bố neo cốt lõi "chụp thật người thật + không 3D không render không CG" |
| R9 | Bắt buộc tuyên bố "chất da thật + không làm mịn + không mặt nạ silicone" |
| R10 | Dáng đứng bắt buộc được tuyên bố là "tư thế thường ngày thật + dáng đứng bất đối xứng có trọng tâm lệch" |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "3D render / dựng mô hình 3D / CG / UE engine / Blender / vật liệu PBR / dựng mô hình next-gen / dựng mô hình 8K" và mọi thuật ngữ CG khác |
| X2 | Nghiêm cấm "vẽ tay 2D / minh họa / hoạt hình / anime / truyện tranh / chibi" và mọi phương tiện phi nhiếp ảnh khác |
| X3 | Nghiêm cấm "làm mịn da quá tay / mặt nạ nhựa / mặt silicone không lỗ chân lông / lì đều toàn mặt / da mượt kiểu AI" |
| X4 | Nghiêm cấm "dáng đứng đối xứng kiểu người mẫu / đứng nghiêm kiểu quân đội / pose catwalk / động tác cường điệu / cử động cơ thể biên độ lớn" |
| X5 | Nghiêm cấm "trang điểm đậm / trang điểm màu / mắt khói / môi đỏ / lông mi giả / lens giãn tròng / tạo khối quá tay" |
| X6 | Nghiêm cấm "bối cảnh phức tạp / phông nền ngoài trời / phông nền chuyển sắc / phông nền có họa tiết / đạo cụ gây nhiễu" |
| X7 | Nghiêm cấm "kéo dài chân quá mức / tỉ lệ đầu-thân kiểu truyện tranh / hiệu ứng làm gầy phi thực tế" |
| X8 | Nghiêm cấm "cổ phong / cổ trang / Hán phục / tiên hiệp / võ hiệp / Dân Quốc / cyberpunk / khoa học viễn tưởng" và các yếu tố phi đô thị đương đại khác |
| X9 | Nghiêm cấm "khỏa thân / hở hang / xuyên thấu / ám chỉ dung tục / lách luật khiêu gợi / bạo lực đẫm máu" |
| X10 | Nghiêm cấm "watermark / chữ / chữ ký / LOGO / viền / dấu vết công cụ sinh bằng AI" |
| X11 | Nghiêm cấm "làn da và gương mặt không mang chất người thật — đây là lằn ranh đỏ cao nhất của phong cách đô thị người thật" |
