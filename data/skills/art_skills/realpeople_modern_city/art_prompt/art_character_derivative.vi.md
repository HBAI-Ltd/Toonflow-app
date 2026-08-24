---
name: liveaction_urban_character_derivative
description: Tạo tài nguyên phái sinh nhân vật đô thị người thật · sổ tay ràng buộc
metaData: liveaction_urban_art_skills
---

# Tạo tài nguyên phái sinh nhân vật đô thị người thật · Sổ tay ràng buộc

---

## 1. Logic tạo hình — làm tạo hình cho một con người thật

> Đô thị người thật không bàn về "chồng lớp vật liệu", "render PBR", "độ chính xác dựng mô hình". Thứ được bàn ở đây là: chuyên viên trang điểm làm việc trên gương mặt người thật, nhà tạo mẫu tóc xử lý mái tóc thật bằng dụng cụ thật, stylist lấy từ giá treo xuống một bộ đồ đã từng được mặc — rồi máy quay ghi lại tất cả những điều đó.

1. **Lớp trang điểm là "làn da thứ hai", không phải "texture dán lên mặt"** — kem nền hòa vào dầu trên da, kẻ mắt lệch nhẹ theo dáng mắt, son môi lên không đều vì vân môi — lớp trang điểm bắt buộc có cảm giác thật của "vừa mới đánh lên"
2. **Tóc là thứ đang sống** — tóc sau khi tạo mẫu vẫn có tóc con rơi xuống, chân tóc có độ phồng tự nhiên chứ không phải tóc giả, chỗ buộc chặt của đuôi ngựa có dấu kéo căng tự nhiên của da đầu
3. **Quần áo là thứ "mặc trên người", không phải "mặc trên mô hình"** — đường vai không nhất thiết hoàn toàn đối xứng (dáng đứng người thật vốn không đối xứng), vải tạo nếp nhăn tự nhiên theo cử động cơ thể, cổ áo hơi biến dạng do mặc vào cởi ra
4. **Tạo hình phục vụ gương mặt, không che lấp gương mặt** — tạo hình thất bại nhất là khiến người ta không nhận ra tạo hình gốc là ai. Tạo hình phái sinh phải làm mạnh thêm chứ không che đi khí chất cốt lõi của nhân vật

---

## 2. Các lớp tạo hình

| Lớp | Nội dung | Cách hiểu của đô thị người thật |
|---|---|---|
| L0 | Tạo hình gốc | Bản gốc hình tượng cơ bản — mặt mộc, kiểu tóc cơ bản, trang phục thường ngày cơ bản. Không sửa |
| L1 | Trang điểm | Công việc của chuyên viên trang điểm trên gương mặt người thật — lớp nền → chân mày và mắt → má → môi. Quyết định cường độ theo bối cảnh |
| L2 | Tạo mẫu tóc | Kiểu tóc do nhà tạo mẫu làm bằng dụng cụ thật — sấy tạo phom/buộc/tết/uốn + phụ kiện tóc |
| L3 | Lớp mặc trong | Lớp sát người — áo thun/sơ mi/đồ len/áo hai dây/áo lót nền, thay cho món cơ bản |
| L4 | Áo khoác/trang phục chính | Lớp ngoài — vest/áo khoác dáng dài/áo hoodie/váy liền/áo măng tô/đồ workwear, quyết định phong cách phối đồ tổng thể |
| L5 | Phụ kiện | Trang sức/mũ nón/kính/khăn/túi xách/đồng hồ — bước cuối cùng của một bộ đồ thường ngày |

> **Ranh giới phạm vi**: chỉ ở tầng tạo hình (trang điểm + kiểu tóc + trang phục + phụ kiện). Không bao gồm đạo cụ (điện thoại/cốc cà phê/ô/sách và các vật cầm tay khác), môi trường bối cảnh, tư thế và động tác.

---

## 3. Trang điểm — công việc của chuyên viên trang điểm trên gương mặt người thật (L1)

### Nguyên tắc cốt lõi

> Lớp trang điểm là "làn da thứ hai". Máy quay bắt buộc nhìn xuyên qua lớp trang điểm mà thấy được làn da thật bên dưới — lỗ chân lông không bị lấp phẳng, nếp nhăn mảnh không bị mài mất, kem nền không nổi trên bề mặt như một cái mặt nạ.

### Phân tích manh mối và quyết định trang điểm

| Bước | Nội dung xử lý |
|---|---|
| S1 | Trích xuất manh mối từ người dùng: tình huống bối cảnh, không khí cảm xúc, mô tả trạng thái gương mặt |
| S2 | Lọc bỏ manh mối không thuộc trang điểm: từ chỉ đạo cụ/bối cảnh/động tác không đưa vào lớp trang điểm |
| S3 | Khớp bối cảnh → cường độ trang điểm: mức da mộc / mức thường ngày / mức dịp đặc biệt / mức đại lễ |
| S4 | Sinh prompt L1 — chỉ xuất kết luận |

### Ánh xạ bối cảnh → cường độ trang điểm

| Bối cảnh | Cường độ trang điểm | Ý đồ cốt lõi |
|---|---|---|
| Ở nhà/vừa ngủ dậy/trạng thái mặt mộc | Mức da mộc — không dấu vết trang điểm, chỉ có chính làn da | Chất da thật, gương mặt chưa qua chỉnh sửa |
| Đi làm thường ngày/siêu thị/đi dạo | Mức thường ngày — trang điểm nhẹ, trông như "không trang điểm mà sắc mặt vẫn tươi" | Sự chỉn chu nơi công sở/trong đời sống, tinh tế đến mức không ai để ý |
| Hẹn hò/tụ tập/đi phố | Mức dịp đặc biệt — nhìn ra là có trang điểm, nhưng không quá tay | Lớp trang điểm có sự hiện diện, nhưng vẫn thuộc phạm trù "đời sống thường ngày" |
| Tiệc tối/đám cưới/đại lễ | Mức đại lễ — lớp trang điểm hoàn chỉnh và tinh xảo | Lớp trang điểm thiết kế cho ống kính và đèn, nhưng dưới lớp nền vẫn thấy được làn da thật |

### Trang điểm cho nữ — thích ứng theo kiểu gương mặt

#### Kiểu lạnh trong và tiết chế

| Cường độ | Ý đồ trang điểm | Prompt |
|---|---|---|
| Mức da mộc | Không trang điểm — làn da trắng lạnh sạch sẽ, chân mày tự nhiên chưa qua chỉnh sửa, màu môi là sắc máu của chính mình | không dấu vết trang điểm、chất da trắng lạnh tự nhiên、chân mày nguyên bản chưa chỉnh sửa、màu môi chính là sắc máu tự nhiên |
| Mức thường ngày | "Chắc mình có thoa chút son" — môi màu nude cực nhạt, chân mày tô nhẹ, không dấu vết trang điểm mắt | son nude cực nhạt、dáng chân mày tự nhiên tô nhẹ、không cảm giác trang điểm mắt、độ bóng của chính làn da |
| Mức dịp đặc biệt | Môi đỏ là điểm nhấn duy nhất — son lì màu đỏ gạch hoặc tông nâu, chân mày và mắt giữ tiết chế, nhấn nét lạnh trong xa cách | môi son lì đỏ gạch (điểm nhấn duy nhất)、kẻ mắt cực mảnh sát đuôi mắt、dáng chân mày sạch gọn、các vùng khác gần như mặt mộc |
| Mức đại lễ | Khói tông lạnh nhưng không đậm — mắt khói nhẹ nâu xám, tạo khối đường viền, môi lì đỏ sẫm, giữ nét xương | mắt khói nhẹ nâu xám、tạo khối nhẹ dưới gò má、môi lì đỏ sẫm、giữ nét xương của gương mặt |

#### Kiểu dịu dàng chữa lành

| Cường độ | Ý đồ trang điểm | Prompt |
|---|---|---|
| Mức da mộc | Da trắng ấm trong, má tự có sắc hồng nhạt, chân mày mềm | da mộc trắng ấm trong、má hồng hào tự nhiên、dáng chân mày mềm、không cảm giác trang điểm |
| Mức thường ngày | Cảm giác căng bóng — lớp nền bóng khỏe, má hồng tông hồng tán nhẹ, chất son dưỡng | lớp nền cảm giác bóng khỏe、má hồng tông hồng tán tự nhiên、môi dưỡng trong trẻo、ánh mắt dịu dàng |
| Mức dịp đặc biệt | Tông ấm dịu — mắt màu hạnh nhân, má hồng chất kem, son bóng gương, tổng thể ôn hòa | mắt màu hạnh nhân ấm tán tự nhiên、má hồng chất kem、son bóng gương、ôn hòa dịu dàng |
| Mức đại lễ | Trang điểm kỹ tông ấm — mắt nhũ màu champagne, lớp nền bóng khỏe, môi hồng đất hoa hồng, tinh xảo mà không mất nét dịu dàng | mắt nhũ champagne、highlight bóng khỏe、màu môi hồng đất hoa hồng、lớp trang điểm hoàn chỉnh tinh xảo mà dịu dàng |

#### Kiểu đô thị sắc sảo

| Cường độ | Ý đồ trang điểm | Prompt |
|---|---|---|
| Mức da mộc | Làn da sạch trung tính, chân mày gọn nhưng chưa kẻ | da mộc sạch trung tính、dáng chân mày gọn không chỉnh sửa、màu môi tự nhiên、gương mặt không thêm chỉnh sửa |
| Mức thường ngày | "Trang điểm nhẹ nơi công sở" — lớp nền lì, dáng chân mày gọn, màu môi MLBB (my lips but better) | lớp nền lì tự nhiên、dáng chân mày gọn tô nhẹ、màu môi MLBB、chỉn chu mà không gây chú ý |
| Mức dịp đặc biệt | Sắc mà không dữ — kẻ mắt rõ nét, tạo khối đường viền, môi hồng hoa hồng độ bão hòa thấp | kẻ mắt sắc rõ nét、tạo khối đường viền gương mặt、môi hồng hoa hồng độ bão hòa thấp、sắc sảo và có lực |
| Mức đại lễ | Trang điểm kỹ hoàn chỉnh — lớp nền mờ mịn, tạo khối theo cấu trúc, môi đỏ chuẩn hoặc màu mận, khí trường mở hết cỡ | lớp nền mờ mịn tinh xảo、tạo khối đường viền theo cấu trúc、môi đỏ chuẩn/màu mận、hoàn chỉnh nhưng cấu trúc gương mặt vẫn nhận ra được |

#### Kiểu thanh xuân tràn năng lượng

| Cường độ | Ý đồ trang điểm | Prompt |
|---|---|---|
| Mức da mộc | Collagen chính là lớp trang điểm — làn da không cần trang điểm vốn đã sáng | da mộc căng đầy collagen、má hồng hào tự nhiên、ánh mắt sáng、không cần trang điểm |
| Mức thường ngày | "Chỉ nâng sắc mặt lên một chút" — son dưỡng có màu, gel chân mày trong suốt, má hồng chất kem cực nhạt | son dưỡng có màu、gel chân mày trong suốt chải nếp、má hồng chất kem vỗ nhẹ、không nhìn ra là có trang điểm |
| Mức dịp đặc biệt | Sáng và hoạt bát — má hồng tông cam/san hô, son bóng, mắt nhũ nhẹ | má hồng tông cam tràn sức sống、son bóng、mắt nhũ nhẹ、nét thiếu nữ tươi sáng |
| Mức đại lễ | Tinh xảo mà không già đi — lớp nền trong mỏng, son bóng mọng, mắt nhũ lấp lánh nhẹ, giữ nét trẻ | lớp nền trong mỏng giữ chất da、son bóng mọng、mắt nhũ lấp lánh nhẹ、tinh xảo mà không che đi nét trẻ |

#### Kiểu đời thường phố chợ

| Cường độ | Ý đồ trang điểm | Prompt |
|---|---|---|
| Mức da mộc | Gương mặt đã bị nắng chiếu — vết rám nắng, màu da không đều tự nhiên, không trang điểm | gương mặt tự nhiên có vết rám nắng、màu da không đều chân thực、làn da chưa trang điểm、gương mặt của chính đời sống |
| Mức thường ngày | "Thoa chút kem dưỡng rồi ra khỏi nhà" — kem lót nâng tông cực nhạt, màu môi của chính mình | nâng tông cực nhạt、lớp nền gần như không thấy được、màu môi của chính mình、trạng thái tự nhiên vừa rửa mặt xong |
| Mức dịp đặc biệt | Giản dị mà tươm tất — son màu tự nhiên, chân mày chỉnh sơ, lớp nền mỏng nhẹ | son tông màu tự nhiên、dáng chân mày chỉnh sơ、lớp nền mỏng nhẹ không phủ dày、sự tươm tất mộc mạc |
| Mức đại lễ | Chỉn chu mà không kiểu cách — mắt màu đất tông ấm, môi đỏ gạch/nâu đỏ, lớp nền vẫn thấy được chất da | mắt màu đất tông ấm、môi đỏ gạch/nâu đỏ、lớp nền giữ được chất da、chỉn chu mà không mất nét thật |

### Trang điểm cho nam

> Chuẩn mực cao nhất của trang điểm nam là "không nhìn ra được là có trang điểm".

| Cường độ | Bối cảnh áp dụng | Prompt |
|---|---|---|
| Mức da mộc | Trạng thái mặc định cho mọi bối cảnh | làn da nam giới thật chưa chỉnh sửa、độ bóng dầu tự nhiên、lỗ chân lông thấy rõ、chất thật của hàm sau khi cạo râu |
| Mức thường ngày | Cảnh cận trước ống kính/chụp studio/đối thoại quan trọng | màu da đều cực nhạt (không thấy cảm giác phấn)、chân mày chải nhẹ bằng gel trong suốt、màu môi tự nhiên chất son dưỡng — tổng thể không nhìn ra là có trang điểm |
| Mức dịp đặc biệt | Đám cưới/đại lễ/cảnh cận trước ống kính | làn da đều và sạch (giữ vân lỗ chân lông)、dáng chân mày tô nhẹ、màu môi tự nhiên căng mọng — nhìn ra là được chăm chút nghiêm túc nhưng không thấy kem nền |

---

## 4. Tạo mẫu tóc — mái tóc thật trong tay nhà tạo mẫu (L2)

### Kiểu tóc nữ

#### Phân loại theo cách tạo mẫu

| Cách tạo mẫu | Kiểu | Mô tả kiểu tóc | Kiểu gương mặt phù hợp |
|---|---|---|---|
| Buông tự nhiên | Tóc đen dài thẳng | tóc thẳng suôn mượt tự nhiên、đuôi tóc hơi cụp vào、rẽ ngôi giữa hoặc ngôi lệch、tóc con rơi tự nhiên trước trán và sau gáy | Lạnh trong tiết chế/dịu dàng chữa lành/đô thị sắc sảo |
| Buông tự nhiên | Tóc xoăn lơi | tóc xoăn lơi sóng lớn、chân tóc phồng tự nhiên、độ xoăn không đều (không giống nhau y hệt như máy uốn)、tóc con vây quanh gương mặt | Dịu dàng chữa lành/thanh xuân tràn năng lượng |
| Buông tự nhiên | Tóc ngắn tỉa lớp chạm xương quai xanh | dài ngang vai、đuôi tóc tỉa lớp、một bên vén sau tai để lộ khuyên tai、tóc con sau gáy tự nhiên | Đô thị sắc sảo/lạnh trong tiết chế |
| Buông tự nhiên | Tóc xoăn tít lọn nhỏ | xoăn nhỏ và vừa toàn đầu、bồng bềnh thoáng khí、chân tóc dựng tự nhiên、độ xoăn có nét thủ công chứ không đều như máy | Thanh xuân tràn năng lượng/đời thường phố chợ |
| Buộc lên | Đuôi ngựa cao | buộc ở vị trí đỉnh đầu cao、chân tóc phồng tự nhiên、đuôi ngựa có độ cong tự nhiên chứ không rủ thẳng đứng、tóc con trước trán và hai bên thái dương rơi tự nhiên | Thanh xuân tràn năng lượng/đô thị sắc sảo/bối cảnh thể thao |
| Buộc lên | Đuôi ngựa thấp/búi thấp | buộc ở sau gáy hoặc sau tai、lơi mà không xổ、tóc con sau gáy tự nhiên、có nét thả lỏng của việc "tiện tay buộc lên" | Dịu dàng chữa lành/đời thường phố chợ/bối cảnh ở nhà |
| Buộc lên | Búi tròn | búi ở đỉnh đầu hoặc sau đầu、lơi chứ không căng、tóc con vây quanh gương mặt và cổ | Ở nhà/thường ngày/thể thao |
| Tết tóc | Tết bím một bên | tết bím lệch một bên、lơi và có nét thủ công、tết lẫn cả tóc con、đuôi bím xơ tự nhiên | Dịu dàng chữa lành/thanh xuân tràn năng lượng |
| Tết tóc | Hai bím/hai đuôi | tết đối xứng hai bên、độ chặt vừa phải、hợp với tạo hình trẻ trung | Thanh xuân tràn năng lượng |
| Tóc ngắn | Tóc ngắn ngang tai | dài trên tai hoặc dưới tai、đuôi tóc cắt bằng hoặc tỉa vụn、một bên vén sau tai、sau gáy thoáng | Đô thị sắc sảo/lạnh trong tiết chế |
| Tóc ngắn | Tóc ngắn tỉa vụn nét thiếu niên | tóc ngắn tỉa lớp vụn、sau gáy cạo ngắn、tóc con trước trán rơi tự nhiên | Lạnh trong tiết chế/đô thị sắc sảo/phong cách trung tính |

#### Trạng thái thật của mái tóc trước máy quay (dùng chung cho mọi kiểu tóc)

| Trạng thái | Prompt |
|---|---|
| Tóc con | tóc con trước trán rơi tự nhiên、tóc tơ hai bên thái dương、tóc con sau gáy、chân tóc tự nhiên không đều tăm tắp |
| Chân tóc | chân tóc phồng tự nhiên chứ không bết sát da đầu、chỗ rẽ ngôi thấy được da đầu tự nhiên |
| Đuôi tóc | đuôi tóc xơ/chẻ tự nhiên、sau khi buộc đuôi tóc có độ cong tự nhiên |
| Độ bóng | ánh phản xạ tự nhiên của mái tóc khỏe — không bóng dầu không lì、tóc thành đường viền ấm bán trong suốt khi ngược sáng |
| Nghiêm cấm | đường biên gọn ghẽ như tóc giả、sợi tóc CG tách rời từng sợi、không có tóc con、định hình cứng đờ |

### Kiểu tóc nam

| Tạo hình | Mô tả | Kiểu gương mặt phù hợp |
|---|---|---|
| Tóc ngắn gọn gàng | hai bên cạo ngắn、đỉnh để dài tạo kiểu được、sợi tóc có hướng đi tự nhiên、thấy được trán | Rắn rỏi từng trải/đô thị sắc sảo (tương ứng gương mặt nam) |
| Tóc mái vuốt rẽ nhẹ | tóc con trước trán phủ nhẹ chân mày、đỉnh phồng có lớp、hai bên chuyển tiếp tự nhiên | Thiếu niên nắng ấm/ôn hòa nội liễm |
| Tóc ngắn rẽ ngôi lệch | rẽ ngôi lệch、một bên chải ngược ra sau、gọn gàng kiểu công sở nhưng không phải đầu vuốt bóng cứng | Sắc lạnh tiết chế/ôn hòa nội liễm |
| Tóc húi cua/đầu đinh | tóc cực ngắn、thấy được da đầu、chân tóc tự nhiên、đường viền dáng đầu rõ | Rắn rỏi từng trải/giang hồ phố thị |
| Tóc đuôi sói/mullet | trước ngắn sau dài、đuôi tóc sau gáy để dài、lớp cắt gọn、có nét tùy hứng của việc "không cắt tử tế" | Thiếu niên nắng ấm/sắc lạnh tiết chế |
| Tóc dài vừa | dài chạm vai、buông tự nhiên hoặc buộc nửa đầu、chất tóc tự nhiên | Sắc lạnh tiết chế/khí chất nghệ sĩ |
| Tóc xoăn/tạo vân | xoăn tự nhiên hoặc uốn vân nhẹ、bồng bềnh thoáng khí、không cứng đờ | Thiếu niên nắng ấm/ôn hòa nội liễm |

#### Trạng thái thật của mái tóc trước máy quay (dùng chung cho nam)

| Trạng thái | Prompt |
|---|---|
| Chất tóc ngắn | thấy được da đầu ở trạng thái tóc ngắn、hướng sợi tóc tự nhiên、tóc mai và chân râu chuyển tiếp tự nhiên |
| Trạng thái thường ngày | không có cảm giác vỏ cứng do gel、tóc phồng tự nhiên hoặc hơi xẹp (hợp với đời thường)、độ rối tự nhiên do gió thổi qua |
| Chân tóc | chân tóc tự nhiên (cho phép hơi lùi)、hai góc trán có thể hơi thưa、không gọn ghẽ kiểu tóc giả |
| Nghiêm cấm | ánh phản xạ vỏ cứng của gel、đường biên gọn ghẽ như tóc giả、sợi tóc CG、kiểu tóc hoàn hảo phi tự nhiên |

---

## 5. Trang phục — cách phối đồ thật, không phải trang phục dựng mô hình (L3+L4)

### Logic trang phục của đô thị người thật

> Dự án 3D bàn về "render vật liệu", "thuộc tính vật lý PBR", "ghép cấu trúc nhiều lớp". Đô thị người thật bàn về: bộ đồ này mua ở đâu? Đã mặc mấy lần rồi? Hôm nay vì sao lại chọn nó?

- **Mặc chồng lớp đến từ thời tiết và dịp, không đến từ "tầng lớp thiết kế"**: khoác sơ mi ngoài áo thun vì chênh lệch nhiệt độ sáng tối lớn, mặc áo khoác dáng dài vì hôm nay có gió, mặc cardigan len vì điều hòa văn phòng quá lạnh
- **Quần áo có dấu vết đã mặc**: cổ áo hơi biến dạng, cổ tay áo có vết ma sát, đầu gối quần jeans có vân giãn, áo thun trắng hơi cũ đi sau khi giặt
- **Vừa người chứ không bó sát**: quần áo ôm theo cơ thể nhưng không căng, đường vai ở vị trí tự nhiên (có thể lệch nhẹ theo dáng người), độ dài quần vừa đúng hoặc hơi dồn nhẹ trên mu giày
- **Cách ăn mặc thật của đô thị Trung Quốc đương đại** — không phải phim Hàn, không phải tạp chí Nhật, không phải ảnh đường phố Âu Mỹ

### Ma trận trang phục nữ

| Phong cách phối đồ | Món chủ lực | Bối cảnh áp dụng | Prompt |
|---|---|---|---|
| Công sở đi làm | blazer/sơ mi/quần ống côn/chân váy dài vừa/áo khoác dáng dài | Văn phòng, họp kinh doanh, đi làm thường ngày | phối đồ công sở đi làm、blazer + sơ mi + quần âu ống đứng、tông camel/xanh navy/đen、vải rủ tự nhiên、vừa người không căng |
| Thường ngày thoải mái | áo thun/hoodie/quần jeans/quần ống rộng/cardigan len | Cuối tuần ra phố, đi siêu thị, quán cà phê, đi dạo | phối đồ thường ngày thoải mái、hoodie rộng + quần jeans ống đứng、tông trắng ngà/xám/kaki、chất cotton tự nhiên |
| Hẹn hò dịu dàng | váy liền dệt kim/chân váy hoa nhí/cardigan cashmere/sơ mi kiểu Pháp | Hẹn hò, tụ tập bạn thân, trà chiều | phối đồ hẹn hò dịu dàng、váy liền dệt kim + cardigan dáng ngắn、tông kem/hồng phấn/mơ nhạt、chất vải mềm |
| Chất đường phố | hoodie oversize/quần túi hộp/áo khoác denim/mũ lưỡi trai | Đi phố, chơi đồ chơi nghệ thuật, lễ hội âm nhạc, đời sống về đêm | phối đồ chất đường phố、hoodie có mũ oversize + quần túi hộp ống rộng、tông đen/xám/xanh rêu、tùy hứng và có thái độ |
| Thể thao ngoài trời | quần legging yoga/áo bra thể thao/áo thun mau khô/áo khoác gió/giày thể thao | Phòng gym, chạy bộ ngoài trời, đạp xe, đi bộ đường dài | phối đồ thể thao、legging yoga + bra thể thao + áo thun mau khô rộng、tông màu tối、chất tự nhiên của vải chức năng |
| Học đường văn nghệ | áo gile len + sơ mi/chân váy xếp ly/giày vải/áo khoác dạ ngắn | Khuôn viên trường, hiệu sách, thư viện, triển lãm | phối đồ học đường văn nghệ、áo gile len khoác ngoài sơ mi + chân váy xếp ly、xanh navy/đỏ rượu/kẻ caro、khí chất sách vở |
| Ở nhà thư thái | đồ mặc nhà cotton rộng/áo choàng dệt kim/áo khoác lông mềm | Ở nhà thường ngày, sáng dậy, đêm khuya | phối đồ ở nhà、áo dài tay cotton rộng + quần dài mặc nhà、trắng ngà/xám nhạt/xanh nhạt、chất mềm dịu với da |

### Ma trận trang phục nam

| Phong cách phối đồ | Món chủ lực | Bối cảnh áp dụng | Prompt |
|---|---|---|---|
| Vest công sở trang trọng | bộ vest/sơ mi trắng/cà vạt/giày da trang trọng | Họp kinh doanh, dịp trang trọng, gặp gỡ quan trọng | phối đồ vest trang trọng、bộ vest xám đậm/xanh navy + sơ mi trắng、phom cắt vừa người、vải đứng phom và có độ rủ |
| Công sở thoải mái | blazer thường ngày + áo thun cổ tròn/áo len + quần âu thường ngày | Đi làm thường ngày, dịp công việc nhẹ nhàng | phối đồ công sở thoải mái、blazer thường ngày + áo thun trắng cổ tròn + quần kaki、không thắt cà vạt、thả lỏng có chừng mực |
| Thoải mái thường ngày | áo thun trơn/áo dài tay cổ henley/hoodie + quần jeans ống đứng | Cuối tuần, thường ngày, mọi dịp không trang trọng | phối đồ thoải mái thường ngày、áo thun cotton trơn + quần jeans ống đứng、đen/trắng/xám/xanh navy、vải tự nhiên dễ chịu |
| Đồ hiệu đường phố | hoodie in hình/quần túi hộp/áo khoác denim/giày vải | Đi phố, tụ tập, đời sống về đêm | phối đồ hiệu đường phố、hoodie in hình + quần túi hộp bó gấu、tông đen/xanh rêu/xám、thả lỏng có thái độ |
| Thể thao chức năng | áo thun mau khô/quần short thể thao/quần dài thể thao/giày thể thao | Phòng gym, chạy bộ, sân bóng rổ | phối đồ thể thao、áo thun mau khô + quần short thể thao、đen/xám đậm、chất vải chức năng |
| Văn nghệ lạnh trong | sơ mi vai trễ/áo len rộng/quần âu ống rộng/giày vải | Hiệu sách, triển lãm, quán cà phê | phối đồ văn nghệ、sơ mi cotton vai trễ + quần âu rộng、màu đất/trắng ngà/xanh navy、chất cảm không gồng |

---

## 6. Phụ kiện — bước cuối cùng của một bộ đồ thường ngày (L5)

### Phụ kiện nữ

| Nhóm | Logic phụ kiện của đô thị người thật | Prompt |
|---|---|---|
| Khuyên tai | Không phải "khuyên tai kim loại rủ" — mà là "đôi mà hôm nay tiện tay cầm lên trước khi ra khỏi nhà". Chủ yếu nhỏ gọn giản dị, hô ứng với phong cách phối đồ | khuyên tai bạc nhỏ/khuyên tròn kim loại mảnh/khuyên ngọc trai/khuyên hình học acrylic — đi cùng {phong cách phối đồ} |
| Vòng cổ | Dây chuyền chạm xương quai xanh hoặc dây dài vừa, ôm theo đường cong tự nhiên của cổ, không lơ lửng, không lún vào da | dây chuyền mảnh chạm xương quai xanh/dây kim loại mảnh có mặt/chuỗi ngọc trai ngắn — ôm cổ tự nhiên |
| Đồng hồ/trang sức tay | Đồng hồ đeo hằng ngày, vòng tay mảnh hoặc nhẫn, có dấu vết sử dụng (dây đeo gập tự nhiên, kim loại hơi mòn) | đồng hồ dây da/vòng tay kim loại mảnh/nhẫn giản dị — chất đeo hằng ngày、có dấu vết sử dụng |
| Mũ nón | Mũ lưỡi trai/mũ nồi/mũ len — lưỡi mũ có độ cong tự nhiên, thân mũ có dấu vết đội | mũ lưỡi trai (lưỡi mũ cong tự nhiên)/mũ nồi (đội hơi nghiêng)/mũ len (chất mềm xốp) |
| Kính | Kính thuốc hoặc kính râm, chất liệu gọng tự nhiên, mặt kính có phản xạ nhẹ nhưng vẫn thấy được mắt | gọng kim loại mảnh/gọng nhựa acetate、mặt kính phản xạ nhẹ nhưng vẫn thấy được ánh mắt |
| Túi xách | Túi thật dùng để đi làm/ra ngoài hằng ngày — da có nếp nhăn do dùng, vải bố hơi cũ đi tự nhiên | túi da đeo vai (nếp nhăn tự nhiên do dùng)/túi tote vải bố (hơi cũ)/túi đeo chéo nhỏ |

### Phụ kiện nam

| Nhóm | Prompt |
|---|---|
| Đồng hồ | đồng hồ đeo tay hằng ngày — dây kim loại mòn tự nhiên/dây da có vết gập/mặt số giản dị |
| Kính | gọng kim loại mảnh/gọng nhựa acetate、mặt kính phản xạ nhẹ、đệm mũi ôm tự nhiên |
| Mũ nón | mũ lưỡi trai/mũ len — trạng thái đội tự nhiên、lưỡi mũ hơi cong、có cảm giác dùng hằng ngày |
| Ba lô | ba lô/túi đưa thư — chất vải bố hoặc da、có dấu vết sử dụng、quai đeo gập tự nhiên |

---

## 7. Tra nhanh tổ hợp tạo hình

| Bối cảnh | Cường độ trang điểm | Kiểu tóc | Phong cách phối đồ | Phụ kiện |
|---|---|---|---|---|
| Sáng dậy ở nhà | Mức da mộc | Buông tự nhiên/buộc tùy tiện | Ở nhà thư thái | Tối giản hoặc không |
| Đi làm | Mức thường ngày | Tóc buông gọn/đuôi ngựa thấp/tóc ngắn rẽ ngôi lệch | Công sở đi làm/công sở thoải mái | Đồng hồ + túi giản dị |
| Cuối tuần ra phố | Mức thường ngày | Tóc xoăn lơi/tóc mái vuốt rẽ nhẹ/tóc đuôi sói | Thường ngày thoải mái/thoải mái thường ngày | Túi + mũ + đồng hồ |
| Hẹn gặp hẹn hò | Mức dịp đặc biệt | Tóc xoăn dịu dàng/tóc ngắn chạm xương quai xanh/rẽ ngôi lệch | Hẹn hò dịu dàng/học đường văn nghệ | Khuyên tai + vòng cổ + túi |
| Quán cà phê/hiệu sách | Mức thường ngày | Buông tự nhiên/tóc ngắn tỉa lớp/tóc dài vừa | Học đường văn nghệ/văn nghệ lạnh trong | Kính + túi vải bố |
| Phòng gym/ngoài trời | Mức da mộc | Đuôi ngựa cao/búi tròn/tóc húi cua | Thể thao ngoài trời/thể thao chức năng | Đồng hồ thể thao + băng đô |
| Tiệc tối/đại lễ | Mức đại lễ | Tóc xoăn tinh xảo/búi tóc/rẽ ngôi lệch vuốt bóng | Trang phục trang trọng (váy liền/vest) | Khuyên tai + vòng cổ + trang sức tay + túi tinh xảo |
| Một mình đêm khuya | Mức da mộc | Buông tùy tiện/hơi rối | Ở nhà thư thái | Không |
| Chợ đêm đường phố | Mức dịp đặc biệt | Tóc xoăn tít/tết bím sát da đầu/tóc đuôi sói | Chất đường phố/đồ hiệu đường phố | Khuyên tai + mũ lưỡi trai |
| Bệnh viện/dịp trang trọng | Mức thường ngày | Buộc tóc gọn/tóc ngắn gọn | Phối đồ màu trơn giản dị | Tối giản |

> **Quy tắc suy luận cho bối cảnh chưa được liệt kê**: trước tiên xét thuộc tính riêng tư/công cộng của bối cảnh (riêng tư → mức da mộc, công cộng → khởi điểm là mức thường ngày); sau đó xét mức độ trang trọng (dịp trang trọng → mức dịp đặc biệt/mức đại lễ); cuối cùng xét sắc thái tình điệu (lãng mạn/giao tiếp xã hội → mức dịp đặc biệt). Trang điểm thích ứng theo kiểu gương mặt (xem mục 3), phối đồ thích ứng theo nhiệt độ và không khí của bối cảnh.

---

## 8. Bộ ảnh chân dung nhân vật — quy phạm chụp bốn góc

> Sau khi chồng lớp tạo hình phái sinh vẫn phải xuất ra bộ ảnh studio bốn góc, để bảo đảm trang điểm, kiểu tóc, phối đồ nhất quán và nhận diện được ở mọi góc quay thật.

### Định nghĩa bốn góc

| Vị trí | Góc | Cỡ cảnh | Yêu cầu nhiếp ảnh |
|---|---|---|---|
| Ngoài cùng bên trái | Cận cảnh chính diện | Đỉnh đầu đến mép trên xương quai xanh | Khuôn mặt chiếm 60%+, chi tiết trang điểm thấy rõ (cách kem nền hòa vào da, độ chính xác của nét kẻ mắt, chất màu môi). Tiêu cự 50-85mm |
| Thứ hai từ trái | Chính diện 0° | Toàn thân | Toàn cảnh bộ đồ nhìn từ trước, độ rủ của trang phục, cách mặc chồng lớp, phụ kiện hiện đủ. Đủ từ đỉnh đầu đến gót chân |
| Thứ hai từ phải | Bên phải 90° | Toàn thân | Đường viền nghiêng + lớp lang của bộ đồ nhìn nghiêng, trạng thái kiểu tóc nhìn nghiêng. Đủ từ đỉnh đầu đến gót chân |
| Ngoài cùng bên phải | Phía sau 180° | Toàn thân | Toàn cảnh kiểu tóc sau đầu, bộ đồ nhìn từ lưng, mặt sau của túi/mũ. Đủ từ đỉnh đầu đến gót chân |

### Quy phạm khung hình

| Hạng mục | Yêu cầu nhiếp ảnh |
|---|---|
| Bố cục | Bốn góc xếp cạnh nhau từ trái sang phải trong cùng một khung hình, khoảng cách đều. Trình bày như "ảnh duyệt tạo hình" |
| Phông nền | Giấy phông liền mạch xám trung tính #B0B0B0, không đốm sáng không chuyển sắc không đổ bóng |
| Dáng đứng | Giữ nguyên dáng đứng của tạo hình gốc — dáng đứng thường ngày tự nhiên có trọng tâm lệch, không phải đứng nghiêm không phải pose. **Cấm thay đổi dáng người vì đổi trang phục** |
| Biểu cảm gương mặt | Vi biểu cảm hợp với cường độ trang điểm và không khí bối cảnh — mức da mộc thì trung tính tự nhiên, mức dịp đặc biệt thì thoáng ý cười, mức đại lễ thì ung dung tự tin. **Chỉ giới hạn ở vi biểu cảm gương mặt, không đụng đến động tác cơ thể** |
| Ánh sáng | Sáng dịu trong studio — đèn chính softbox phía trước + tấm hắt sáng bù hai bên. Ánh sáng dịu, hướng rõ ràng, tỉ số sáng khoảng 1:2 đến 1:3, giữ được độ nổi khối của gương mặt. Chất liệu của trang phục và phụ kiện thấy rõ |
| Nhất quán | Bốn góc là bản ghi chụp liên tục của cùng một nhân vật, cùng một buổi chụp tạo hình. Gương mặt/trang điểm/kiểu tóc/phối đồ/phụ kiện đều phải hiện ra như của cùng một buổi chụp |
| Tỉ lệ khung hình | Đề xuất khổ rộng 4:1 hoặc 16:4 |

---

## 9. Khuôn mẫu prompt

### Ràng buộc định dạng đầu ra

| Hạng mục | Ràng buộc |
|---|---|
| Nội dung xuất ra | **Chỉ xuất phần văn bản prompt**, không xuất quá trình phân tích, so sánh phương án, bảng tra nhanh, thuyết minh ràng buộc |
| Cấm bối cảnh | Không bao gồm bất kỳ mô tả bối cảnh/môi trường/thời tiết/phông nền nào |
| Cấm đạo cụ | Không bao gồm bất kỳ vật cầm tay/vật tương tác nào (đạo cụ thuộc tài nguyên độc lập) |
| Cấm đổi tư thế | Không đổi dáng đứng của tạo hình gốc, không xuất bất kỳ thay đổi động tác/dáng người nào |
| Định dạng | Xuất thẳng prompt hoàn chỉnh dùng được ngay |

### Khuôn mẫu prompt chồng lớp tạo hình hoàn chỉnh

lấy ảnh hình tượng cơ bản của nhân vật làm ảnh nền，img2img chồng lớp tạo hình，
bộ ảnh chân dung tạo hình nhân vật đô thị người thật，chụp thật người thật，sáng dịu trong studio，giấy phông liền mạch xám trung tính，
bộ ảnh chân dung nhân vật {giới tính}，phong cách chụp thật，không 3D không render không CG，
character portrait series, live-action photography, studio soft lighting,
giữ nguyên gương mặt của hình tượng cơ bản，{khí chất tổng thể}，
【L1 · trang điểm】{cường độ trang điểm — mức da mộc/mức thường ngày/mức dịp đặc biệt/mức đại lễ}，{mô tả trang điểm}，lớp trang điểm hòa vào làn da thật, kem nền không thành mặt nạ, vân lỗ chân lông vẫn thấy được，
【L2 · kiểu tóc】{mô tả kiểu tóc}，vân chất tóc thật，{mô tả trạng thái thật của tóc con/chân tóc/đuôi tóc}，không phải tóc giả không phải sợi tóc CG，
【L3+L4 · phối đồ】{phong cách phối đồ}，{mô tả áo}+{mô tả đồ mặc dưới}，{màu sắc}，{chất vải tự nhiên}，trang phục rủ tự nhiên, có nếp nhăn thật do mặc lên người, không phải đồ mẫu trưng bày，
【L5 · phụ kiện】{mô tả phụ kiện}，chất đeo hằng ngày, có dấu vết sử dụng, ôm theo cơ thể tự nhiên，
xếp cạnh nhau từ trái sang phải trong cùng khung hình: cận cảnh chân dung + toàn thân chính diện + toàn thân nghiêng + toàn thân sau lưng，
dáng đứng thường ngày tự nhiên (trọng tâm lệch)，giấy phông liền mạch xám trung tính #B0B0B0，sáng dịu đều trong studio，tỉ số sáng dịu，
bốn góc là bản ghi chụp liên tục của cùng một buổi chụp tạo hình，
khung hình sạch không chữ không watermark không chữ ký không viền，
chất lượng ảnh chụp tả thực người thật、chất nhiếp ảnh full-frame 35mm

### Prompt né tránh (negative prompt)

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, 8K modeling, game engine, cartoon, anime, 2D, illustration, hand drawn, painting,
plastic skin, wax face, silicone skin, airbrushed skin, perfect smooth skin, poreless, doll-like, mannequin,
symmetrical pose, mannequin pose, runway pose, model stance, military stance, exaggerated pose, action pose,
heavy makeup, dramatic makeup, makeup mask, foundation mask, fake lashes, colored contacts,
wig, fake hair, helmet hair, stiff hair, perfect hairline, CG hair strands,
brand new clothes, showroom clothes, stiff fabric, unrealistically clean, no wrinkles, mannequin clothes,
古风, 古装, 汉服, 仙侠, 武侠, 民国, 赛博朋克, 科幻, 西方奇幻, 中世纪,
text, watermark, signature, logo, border, frame

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Sau khi chồng lớp, gương mặt bắt buộc khớp với tạo hình gốc — tạo hình phục vụ gương mặt, không che lấp gương mặt |
| R2 | Lớp trang điểm bắt buộc hòa vào làn da thật — kem nền không thành mặt nạ, vân lỗ chân lông vẫn thấy được, không mượt kiểu AI |
| R3 | Kiểu tóc bắt buộc thể hiện chất tóc thật — tóc con, độ phồng chân tóc, đuôi tóc xơ, không phải tóc giả không phải sợi tóc CG |
| R4 | Trang phục bắt buộc có dấu vết mặc thật — nếp nhăn tự nhiên, vải rủ, không phải đồ mẫu trưng bày không phải đồ mới tinh xuất xưởng |
| R5 | Phụ kiện bắt buộc có cảm giác đeo hằng ngày — ôm theo cơ thể, có dấu vết sử dụng, không lơ lửng không lún vào da |
| R6 | Bắt buộc xuất ra bộ ảnh studio bốn góc (cận cảnh chân dung + chính diện + nghiêng + toàn thân sau lưng) |
| R7 | Bắt buộc chỉ định "giấy phông liền mạch xám trung tính #B0B0B0", cấm thêm môi trường bối cảnh |
| R8 | Bắt buộc chỉ định "bốn góc là bản ghi chụp liên tục của cùng một buổi chụp tạo hình" |
| R9 | **Chỉ xuất prompt** — không xuất quá trình phân tích, bảng tra nhanh, so sánh phương án và mọi nội dung không phải prompt |
| R10 | **Cấm tương tác với đạo cụ** — không bao gồm vật cầm tay, đạo cụ thuộc tài nguyên độc lập |
| R11 | **Tư thế giữ nguyên** — giữ dáng đứng của tạo hình gốc, không thêm bất kỳ mô tả động tác/dáng người nào |
| R12 | **Cấm mô tả bối cảnh/môi trường** — bối cảnh thuộc tài nguyên độc lập |
| R13 | L1 bắt buộc quyết định theo ánh xạ bối cảnh → cường độ trang điểm: mức da mộc / mức thường ngày / mức dịp đặc biệt / mức đại lễ |
| R14 | Mọi tài nguyên phái sinh đều cần phương án tạo hình — trường hợp bình thường không giữ nguyên mặt mộc đồ mộc hoàn toàn, ít nhất phải lên tới mức thường ngày |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "3D render / dựng mô hình 3D / CG / vật liệu PBR / dựng mô hình 8K / UE engine / Blender" và mọi thuật ngữ CG khác |
| X2 | Nghiêm cấm "vẽ tay 2D / minh họa / hoạt hình / anime" và các phương tiện phi nhiếp ảnh khác |
| X3 | Nghiêm cấm "làm mịn da quá tay / mặt silicone / mặt nạ sáp / không lỗ chân lông / da mượt kiểu AI" — dưới lớp trang điểm bắt buộc có làn da thật |
| X4 | Nghiêm cấm "tóc giả / sợi tóc CG tách rời từng sợi / tóc cứng đờ đều tăm tắp / không có tóc con" |
| X5 | Nghiêm cấm "đồ mẫu trưng bày / trang phục mới tinh không nếp nhăn / trang phục lơ lửng / cách mặc như ma-nơ-canh" |
| X6 | Nghiêm cấm "dáng đứng đối xứng kiểu người mẫu / pose catwalk / đứng nghiêm kiểu quân đội / động tác cường điệu" |
| X7 | Nghiêm cấm "trang điểm đậm che lấp gương mặt tạo hình gốc đến mức không nhận ra" |
| X8 | Nghiêm cấm "cổ phong / Hán phục / tiên hiệp / võ hiệp / Dân Quốc / cyberpunk / khoa học viễn tưởng / kỳ ảo phương Tây" và các cách ăn mặc phi đô thị đương đại khác |
| X9 | Nghiêm cấm "hở hang / xuyên thấu / dung tục / lách luật khiêu gợi / bạo lực đẫm máu" |
| X10 | Nghiêm cấm "watermark / chữ / LOGO / chữ ký / viền / dấu vết sinh bằng AI" |
