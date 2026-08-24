---
name: art_scene_derivative
description: Tạo tài nguyên phái sinh bối cảnh 3D Quốc phong Cyber · sổ tay ràng buộc
metaData: art_skills
---
# Tạo tài nguyên phái sinh bối cảnh 3D Quốc phong Cyber · Sổ tay ràng buộc
(thích ứng đầy đủ hai chiều: bối cảnh cổ phong + bối cảnh đô thị hiện đại)

---

## 1. Nguyên tắc phái sinh
(ràng buộc cốt lõi: dùng chung cho hai bối cảnh cổ phong/đô thị, mọi biến thể tuân thủ nghiêm ngặt "dung hợp phong cách thống nhất, logic không gian nhất quán")

1. **Không gian nhất quán** — kết cấu/bố trí/chất liệu công trình và các yếu tố dung hợp cốt lõi Quốc phong Cyber giữ hoàn toàn giống nhau ở mọi biến thể
    - Bối cảnh cổ phong: giữ cố định logic cải tạo cyber cho quy chế cổ kiến/mái cong đấu củng/kết cấu mộng chốt/bố cục sân viện/hoa văn truyền thống
    - Bối cảnh đô thị: giữ cố định logic dung hợp của kết cấu cao ốc/mạng phố ngõ/bố cục khu chức năng đô thị/yếu tố cải tạo Quốc phong (mái cong Trung Hoa/đấu củng/hoa văn)
    - Nghiêm cấm giữa các biến thể xuất hiện lệch yếu tố, đổi kết cấu, đứt gãy phong cách
2. **Cỡ cảnh dẫn dắt** — cùng một bối cảnh thể hiện các chức năng tự sự khác nhau qua các cỡ cảnh khác nhau, khớp chính xác với logic tự sự không gian của bối cảnh cổ phong/đô thị
3. **Chuyển thời điểm** — cùng một không gian cho ra không khí ánh sáng khác nhau ở các thời điểm khác nhau, đồng bộ thích ứng độ sáng, nhiệt độ màu và logic bật tắt của nguồn sáng riêng từng bối cảnh
    - Bối cảnh cổ phong: đèn lồng truyền thống/đèn phù văn/chiếu hologram Quốc phong/đường ống neon
    - Bối cảnh đô thị: màn hình lớn trên cao ốc/đèn đường/đèn xe/biển hiệu neon Quốc phong/quảng cáo thủy mặc hologram
4. **Biến đổi thời tiết** — cùng một không gian mang cảm xúc khác nhau dưới các kiểu thời tiết khác nhau, đồng bộ thích ứng phản hồi vật lý của chất liệu và yếu tố ở từng bối cảnh
    - Bối cảnh cổ phong: tia Tyndall neon trong mưa sương, tuyết phủ mái cong, nước nhỏ từ ngói ống, thớ gỗ ẩm ướt trên khung gỗ
    - Bối cảnh đô thị: phản quang vệt mưa trên tường kính, bóng neon trên vũng nước mặt đường, tuyết phủ mái cong của cao ốc, hoa sương trên kết cấu kim loại
5. **Lấy 3D làm neo** — mọi biến thể bắt buộc giữ chất cảm render 3D, từ chối texture phẳng/cảm giác CG hoạt hình/phong cách tô phẳng anime; giữ nghiêm ngặt chất liệu vật lý PBR, chiếu sáng toàn cục dò tia, ánh sáng thể tích, che khuất ánh sáng môi trường, xóa phông theo chiều sâu, tăng cường chất cảm chất liệu riêng của từng bối cảnh
    - Riêng cổ phong: khung gỗ phong hóa, kim loại làm cũ, thớ gạch ngói, nếp rủ của vải, sơn mài mòn, rêu phong hóa
    - Riêng đô thị: tường kính siêu trắng, nhôm anod hóa, bê tông trần, mặt đường nhựa, kim loại nhám, màn LED tự phát sáng

---

## 2. Biến thể theo cỡ cảnh

### Định nghĩa cỡ cảnh
(phủ trọn hai bối cảnh cổ phong/đô thị, khớp nhu cầu tự sự của các không gian khác nhau)

| Cỡ cảnh | Phạm vi | Chức năng kể chuyện | Prompt |
|---|---|---|---|
| Đại toàn cảnh (大全景) | Toàn cảnh bối cảnh + môi trường xung quanh | Thiết lập cảm giác không gian, định vị toàn cục | extreme wide shot、大全景、toàn cảnh bối cảnh Quốc phong Cyber、bối cảnh cổ phong: quần thể cổ kiến và đường chân trời đã cải tạo cyber; bối cảnh đô thị: đường chân trời đô thị cyber Quốc phong, bố cục toàn cảnh thành phố |
| Toàn cảnh (全景) | Bối cảnh hiện ra đầy đủ | Cho thấy kết cấu không gian tổng thể và logic dung hợp | wide shot、全景、kết cấu đầy đủ của bối cảnh Quốc phong Cyber、bối cảnh cổ phong: hình chế đầy đủ của sân viện/cổ kiến cùng phần cải tạo cyber; bối cảnh đô thị: bố cục đầy đủ của cao ốc/khu phố cùng phần dung hợp Quốc phong |
| Trung cảnh (中景) | Một khu vực cục bộ của bối cảnh | Tập trung vào khu chức năng cốt lõi | medium shot、中景、khu chức năng Quốc phong Cyber、bối cảnh cổ phong: một phần điện vũ/chiều sâu phố ngõ/nút cảnh viên lâm; bối cảnh đô thị: mặt đứng cao ốc/chiều sâu phố ngõ/nút khu thương mại |
| Cận cảnh (近景) | Chi tiết của bối cảnh | Đặc tả (特写) chất liệu/đạo cụ tạo không khí | close shot、近景、đặc tả chất liệu Quốc phong Cyber、bối cảnh cổ phong: kết cấu cơ khí mộng chốt/hiệu ứng neon trên hoa văn/cấu kiện mái cong; bối cảnh đô thị: tường kính hoa văn Quốc phong/kết cấu cao ốc tạo hình mái cong/chi tiết biển hiệu neon |
| Đặc tả (特写) | Chi tiết cực cục bộ | Vân chất liệu/đạo cụ then chốt | extreme closeup、特写、chi tiết vân Quốc phong Cyber、bối cảnh cổ phong: khắc hoa văn truyền thống/cổng đường ống/phù văn phát sáng; bối cảnh đô thị: sơn kim loại mài mòn/thớ điểm ảnh màn LED/chi tiết phản quang tường kính |

### Quy phạm phái sinh theo cỡ cảnh
(dùng chung cho hai bối cảnh cổ phong/đô thị, kiểm soát nghiêm ngặt tính nhất quán giữa các biến thể)

| Phái sinh từ ảnh gốc | Giữ nguyên | Được phép đổi |
|---|---|---|
| 大全景 → 全景 | Ngoại thất công trình, bố trí tổng thể, yếu tố dung hợp cốt lõi Quốc phong Cyber, mạng đường/kết cấu sân viện | Góc nhìn thu hẹp, tiền cảnh thêm yếu tố riêng của bối cảnh tương ứng (cổ phong: đèn lồng lơ lửng/chiếu hologram; đô thị: quảng cáo Quốc phong lơ lửng/đèn đường/cây ven đường) |
| 全景 → 中景 | Chất liệu, tông màu, ánh sáng, vị trí và logic dung hợp của yếu tố Quốc phong Cyber | Cắt cúp tập trung, chiều sâu trường ảnh đổi, tập trung vào khu chức năng cốt lõi |
| 中景 → 近景 | Chất liệu, tông màu, thuộc tính chất liệu cốt lõi Quốc phong Cyber | Chiều sâu trường ảnh nông, phông mờ, tập trung vào chi tiết chất liệu và đạo cụ |
| 近景 → 特写 | Vân chất liệu, chi tiết vân Quốc phong Cyber | Chiều sâu trường ảnh cực nông, cảm giác macro, tập trung vào thớ vi mô và chi tiết hiệu ứng sáng |

---

## 3. Biến thể theo thời điểm

### Định nghĩa thời điểm
(phủ trọn logic nguồn sáng của hai bối cảnh cổ phong/đô thị, ánh sáng tự hợp không xung đột)

| Thời điểm | Đặc trưng thị giác | Prompt |
|---|---|---|
| Sáng sớm | Sương mỏng ánh dịu, tông màu nóng lạnh đan xen, dư quang neon lạnh chưa tắt, ánh mai xuyên sương và chiếu hologram tạo hiệu ứng Tyndall<br>Cổ phong: mái cong mạ viền vàng ánh mai, dư quang đèn lồng<br>Đô thị: màn hình lớn trên cao ốc sáng mờ chế độ chờ, dư quang đèn đường, ánh mai xuyên qua cụm cao ốc | ánh mai hửng nhẹ、sương mỏng sáng sớm、sáng sớm Quốc phong Cyber、dư quang neon、ánh mai xuyên sương |
| Chính ngọ | Sáng rõ bão hòa cao, bóng ngắn và sắc nét, màu tái hiện chân thực<br>Cổ phong: bóng kết cấu cổ kiến sắc nét, highlight trên kim loại và đá tự nhiên<br>Đô thị: tường kính phản quang mạnh, ranh giới bóng cao ốc sắc nét, neon sáng yếu chế độ chờ | nắng chính ngọ、ánh sáng rực rỡ、chính ngọ Quốc phong Cyber、chất ánh sáng cứng、phản quang vật lý của chất liệu |
| Hoàng hôn | Tông ấm vàng kim, bóng đổ dài, trời chuyển sắc cam tím, ánh vàng và neon lần lượt sáng lên<br>Cổ phong: bóng dài của đường viền cổ kiến, đèn lồng vừa lên<br>Đô thị: viền vàng trên đường chân trời cao ốc, màn hình lớn và biển hiệu neon lần lượt bật, vệt sáng đèn xe | ánh vàng chiều tà、golden hour、hoàng hôn Quốc phong Cyber、neon vừa lên、đường chân trời chuyển sắc |
| Ban đêm (ánh trăng) | Tông lam lạnh, u tịch thanh lạnh, độ rọi thấp tương phản cao<br>Cổ phong: trăng lam lạnh, neon tông lạnh, khung gỗ và kim loại phản quang lạnh<br>Đô thị: trăng phủ cụm cao ốc, viền sáng cao ốc tông lạnh, neon màu lạnh, cảnh phố vắng | ánh trăng trong trẻo、moonlight、đêm trăng Quốc phong Cyber、neon tông lạnh、ánh hologram nhạt |
| Ban đêm (đèn lửa) | Tương phản sáng tối mạnh, ánh ấm lạnh đan xen, ánh sáng dải động cao<br>Cổ phong: đèn lồng vàng ấm đan xen neon cyber, ánh ấm qua ô cửa, hiệu ứng chiếu hologram<br>Đô thị: ánh ấm hắt ra từ trong cao ốc, biển hiệu neon Quốc phong, quảng cáo màn hình lớn, đèn đường đèn xe, đèn lửa phố ngõ | đèn lửa thưa dần、ánh nến lấp lánh、cảnh đêm Quốc phong Cyber、đèn lửa neon、ánh ấm đèn lồng、hiệu ứng ánh sáng hologram |

### Quy phạm phái sinh theo thời điểm
(dùng chung cho hai bối cảnh cổ phong/đô thị, giữ cố định kết cấu cốt lõi, chỉ đổi không khí ánh sáng)

| Phái sinh từ thời điểm gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn | Công trình/bố trí/chất liệu, vị trí và kết cấu của yếu tố cốt lõi Quốc phong Cyber | Tông trời ấm lên, bóng kéo dài, nguồn sáng neon lần lượt bật, độ sáng chiếu hologram tăng, nguồn sáng riêng của bối cảnh tương ứng thích ứng đồng bộ |
| Ban ngày → ban đêm | Công trình/bố trí/chất liệu, vị trí và kết cấu của yếu tố cốt lõi Quốc phong Cyber | Tổng thể tối đi, thêm không khí đèn lửa/ánh trăng, bật nguồn tự phát sáng riêng của bối cảnh tương ứng, cổ phong: đèn lồng/đèn phù văn; đô thị: màn hình lớn/đèn đường/đèn xe |
| Trong nhà ban ngày → trong nhà ban đêm | Kết cấu không gian, nội thất, kết cấu cải tạo Quốc phong Cyber | Tông màu tổng thể ấm lên, thêm nguồn sáng riêng của bối cảnh tương ứng, cổ phong: lửa nến/đèn lồng; đô thị: nguồn sáng bàn điều khiển/màn LED/đèn tường Quốc phong |

---

## 4. Biến thể theo thời tiết

### Định nghĩa thời tiết
(phủ trọn phản hồi vật lý của hai bối cảnh cổ phong/đô thị, biểu hiện chất liệu hợp logic)

| Thời tiết | Đặc trưng thị giác | Prompt |
|---|---|---|
| Trời nắng | Sáng rõ thông thoáng, bóng sắc nét, tương phản cao<br>Cổ phong: nắng và neon sáng ngang nhau, vân khung gỗ gạch ngói rõ ràng<br>Đô thị: tường kính highlight phản quang, bóng cao ốc sắc nét, chất mặt đường nhựa rõ ràng | trời quang mây tạnh、nắng đẹp、trời nắng Quốc phong Cyber、nắng và neon cùng tồn tại |
| Trời âm u | Ánh dịu tán xạ, không bóng gắt, tương phản thấp, màu sắc dịu<br>Cổ phong: hiệu ứng neon nổi bật, vân khung gỗ tự nhiên<br>Đô thị: kim loại và bê tông chất mờ, đường viền cao ốc mềm, độ bão hòa neon tăng | ánh dịu trời âm u、overcast、trời âm u Quốc phong Cyber、ánh dịu tán xạ、neon nổi bật |
| Sương mỏng | Sương phân tầng, tầm nhìn giảm dần, không khí mờ ảo<br>Cổ phong: cổ kiến ở xa mờ ảo, hiệu ứng Tyndall của ánh neon, chiếu hologram tán xạ trong sương<br>Đô thị: cao ốc ở xa mờ ảo, đèn đường và neon tạo thành sương sáng, ánh sáng thể tích xuyên sương | sương mỏng lan tỏa、sương giăng vờn quanh、sương mỏng Quốc phong Cyber、ánh sáng thể tích Tyndall、sương sáng neon |
| Mưa phùn | Vệt sáng trên sợi mưa, phản quang ẩm ướt, bóng trong vũng nước<br>Cổ phong: nước nhỏ từ ngói ống, thớ gỗ ẩm ướt, sợi mưa phản chiếu ánh neon<br>Đô thị: vệt mưa trên tường kính, nước đọng mặt đường phản chiếu neon và cao ốc, giọt nước bám mặt kim loại | mưa phùn như tơ、màn mưa mỏng như the、mưa phùn Quốc phong Cyber、vệt sáng trên sợi mưa、phản chiếu neon trên mặt nước |
| Tuyết bay | Tuyết phủ, bông tuyết rơi, tông trắng lạnh, thớ hoa sương<br>Cổ phong: mái cong đấu củng đọng tuyết, hoa sương trên mặt gỗ và kim loại, bông tuyết nhuốm màu neon<br>Đô thị: mái cong Quốc phong của cao ốc đọng tuyết, cành cây ven đường đọng tuyết, tuyết mỏng trên mặt đường, hoa sương trên kết cấu kim loại | tuyết bay lả tả、bạc phủ trắng trời、tuyết bay Quốc phong Cyber、neon nhuốm màu tuyết、thớ hoa sương |

### Quy phạm phái sinh theo thời tiết
(dùng chung cho hai bối cảnh cổ phong/đô thị, giữ cố định kết cấu không gian, chỉ đổi phản hồi vật lý theo thời tiết)

| Phái sinh từ thời tiết gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Công trình/bố trí, kết cấu và vị trí của yếu tố cốt lõi Quốc phong Cyber | Thêm lớp sương, hậu cảnh mờ, giảm độ bão hòa, ánh neon tạo ánh sáng thể tích Tyndall, chiếu hologram có hiệu ứng tán xạ |
| Nắng → mưa phùn | Công trình/bố trí, kết cấu và vị trí của yếu tố cốt lõi Quốc phong Cyber | Thêm sợi mưa, mặt đất phản quang, tông màu ngả lạnh, chất liệu riêng của bối cảnh tương ứng có chất ẩm ướt, bóng trong vũng nước đồng bộ thích ứng với yếu tố bối cảnh |
| Nắng → tuyết bay | Công trình/bố trí, kết cấu và vị trí của yếu tố cốt lõi Quốc phong Cyber | Thêm tuyết đọng, bông tuyết, tông màu ngả trắng, kết cấu riêng của bối cảnh tương ứng bị tuyết phủ, hoa sương trên mặt kim loại, bông tuyết nhuốm màu nguồn sáng |
| Thảm thực vật phải thích ứng theo logic thời tiết | — | Cổ phong: cánh hoa ẩm trong mưa, cành tùng đọng tuyết trong tuyết; đô thị: lá phát sáng ẩm trong mưa, cây ven đường đóng sương trong tuyết, biến đổi thời tiết đồng bộ thích ứng trạng thái vật lý và phản hồi ánh sáng của thảm thực vật |

---

## 5. Quy phạm bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn
(dùng chung cho hai bối cảnh cổ phong/đô thị, logic không gian vòng nhìn 360° hoàn toàn tự hợp)

> Máy quay đặt cố định tại điểm trung tâm của bối cảnh, lần lượt quay ngang về bốn hướng trước/sau/trái/phải, tạo thành vòng nhìn 360° không góc chết, dùng chung cho sân viện cổ phong và khu phố đô thị.

| Vị trí | Hướng nhìn | Phương của góc nhìn | Yêu cầu | Prompt |
|---|---|---|---|---|
| Trên trái | Hình nhìn trước | Nhìn ngang về phía trước từ điểm trung tâm (0°) | Thể hiện kết cấu chủ thể mặt trước và tầng lớp chiều sâu của bối cảnh, trình bày đầy đủ logic dung hợp Quốc phong Cyber<br>Cổ phong: hình chế mặt trước của cổ kiến và các tầng cải tạo cyber<br>Đô thị: kết cấu mặt trước của cao ốc/khu phố và các tầng cải tạo Quốc phong | front view、eye level、looking forward、kết cấu mặt trước của bối cảnh Quốc phong Cyber、trình bày mặt trước của phần dung hợp cổ kiến/đô thị |
| Trên phải | Hình nhìn phải | Nhìn ngang về bên phải từ điểm trung tâm (90°) | Thể hiện phần không gian mở rộng bên phải và kết cấu mặt bên của bối cảnh, trình bày đầy đủ hình chế mặt bên và bố trí đường ống/phố ngõ<br>Cổ phong: kết cấu bên phải cổ kiến và chiều sâu sân viện<br>Đô thị: mặt đứng bên phải cao ốc và chiều sâu phố ngõ | right side view、eye level、looking right、kết cấu bên phải của bối cảnh Quốc phong Cyber、trình bày mặt bên của phần dung hợp cổ kiến/đô thị |
| Dưới trái | Hình nhìn sau | Nhìn ngang về phía sau từ điểm trung tâm (180°) | Thể hiện kết cấu mặt sau và chiều sâu không gian của bối cảnh, trình bày đầy đủ hình chế mặt sau và cách bố trí thiết bị/đường ống<br>Cổ phong: kết cấu mái hiên sau của cổ kiến và bố cục hậu viện<br>Đô thị: kết cấu mặt sau cao ốc và bố cục phố sau | back view、eye level、looking backward、kết cấu mặt sau của bối cảnh Quốc phong Cyber、trình bày mặt sau của phần dung hợp cổ kiến/đô thị |
| Dưới phải | Hình nhìn trái | Nhìn ngang về bên trái từ điểm trung tâm (270°) | Thể hiện phần không gian mở rộng bên trái và kết cấu mặt bên của bối cảnh, trình bày đầy đủ hình chế mặt bên và bố trí phố ngõ/yếu tố<br>Cổ phong: kết cấu bên trái cổ kiến và bố cục sân bên<br>Đô thị: mặt đứng bên trái cao ốc và bố cục phố bên | left view、eye level、looking left、kết cấu bên trái của bối cảnh Quốc phong Cyber、trình bày mặt bên của phần dung hợp cổ kiến/đô thị |

### Quy phạm khung hình
(dùng chung cho hai bối cảnh cổ phong/đô thị, ràng buộc nghiêm ngặt tính nhất quán, loại bỏ tình trạng AI sinh lệch)

| Hạng mục | Ràng buộc |
|---|---|
| Bố cục | Lưới bốn ô (2×2) trong cùng khung hình, trên trái hình nhìn trước + trên phải hình nhìn phải + dưới trái hình nhìn sau + dưới phải hình nhìn trái, tạo thành bộ hình bốn hướng nhìn quanh điểm trung tâm |
| Nhân vật | **Nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người, đường viền động vật nào** |
| Điểm nhìn | Cả bốn hướng nhìn đều xuất phát từ cùng một điểm trung tâm, độ cao tầm nhìn giống nhau (ngang tầm mắt người chuẩn 1,6 m), không lệch cao thấp |
| Nhất quán | Kết cấu công trình/chất liệu/tông màu/ánh sáng/mùa/thời tiết ở bốn hướng nhìn hoàn toàn giống nhau, vị trí, kết cấu, logic hiệu ứng sáng của yếu tố dung hợp cốt lõi Quốc phong Cyber hoàn toàn thống nhất, không lệch, không sót |
| Ánh sáng | Hướng nguồn sáng ở bốn hướng nhìn hoàn toàn thống nhất, logic ánh sáng tự hợp 100% (quan hệ vị trí và hướng đổ bóng của nguồn sáng chính/ánh sáng môi trường/nguồn tự phát sáng ở các góc nhìn khác nhau hoàn toàn chính xác) |
| Tỉ lệ khung hình | Cố định khung vuông 1:1 (lưới 2×2 phân bố đều) |

---

## 6. Khuôn mẫu prompt
(dùng chung cho hai bối cảnh cổ phong/đô thị, chỗ giữ chỗ thích ứng linh hoạt, chép là dùng được ngay)

bản vẽ bốn hướng nhìn phái sinh của bối cảnh 3D Quốc phong Cyber，dựa trên ảnh ý tưởng của {tên bối cảnh}，
{loại bối cảnh: bối cảnh cổ phong/bối cảnh đô thị hiện đại, chọn một}，chinoiserie cyberpunk，cyberpunk Quốc phong，
{riêng bối cảnh cổ phong: cổ kiến truyền thống dung hợp công nghệ cyber, mái cong đấu củng phối đường ống neon, kết cấu mộng chốt kết hợp mô-đun cơ khí, hoa văn truyền thống khắc axit cùng hiệu ứng neon, chiếu hologram Quốc phong, hoành phi truyền thống cyber hóa}
{riêng bối cảnh đô thị: đô thị hiện đại dung hợp văn hóa Quốc phong, cao ốc tạo hình mái cong Trung Hoa, mặt đứng cao ốc kết cấu đấu củng, tường kính hoa văn truyền thống, biển hiệu neon Quốc phong, quảng cáo thủy mặc hologram, phố ngõ Trung Hoa cyber hóa}
phong cách render 3D，dựng hình bề mặt cứng độ chính xác cao，chất liệu vật lý PBR，3D Quốc phong，ánh sáng đẳng cấp điện ảnh，HDR dải động cao，chiếu sáng toàn cục dò tia，
3D rendered, volumetric lighting,
depth of field, natural lens vignette, subtle chromatic aberration, bokeh,
chất cảm render 3D，ánh sáng thể tích Tyndall，ánh sáng tự nhiên，ánh sáng vật lý，ánh sáng tự phát neon，
scene derivative design sheet, environment concept art, no people, no characters, no human figures,
giữ kết cấu không gian bối cảnh và yếu tố cốt lõi Quốc phong Cyber hoàn toàn giống nhau，
{góc nhìn theo cỡ cảnh (nếu có)}, {mô tả thời điểm (nếu có)}, {mô tả thời tiết (nếu có)},
{yếu tố cốt lõi Quốc phong Cyber (nếu có)}, {mô tả nguồn sáng cyber (nếu có)},
{tiền cảnh}, {trung cảnh}, {hậu cảnh},
{mô tả tông màu}, {mô tả chiều sâu trường ảnh (nếu có)}, {biến đổi tông màu bầu trời (nếu có)}, {điều chỉnh không khí (nếu có)},
{đặc trưng thị giác của thời tiết (nếu có)}, {biến đổi bề mặt chất liệu (nếu có)}, {mô tả thích ứng thảm thực vật (nếu có)},
dấu mài mòn tự nhiên trên chất liệu，lớp bóng năm tháng，rêu phong hóa，vải rủ nếp tự nhiên，chất kim loại làm cũ，thớ khung gỗ phong hóa，chi tiết sơn mài mòn，thớ kim loại gỉ sét，
ánh sáng thể tích，che khuất ánh sáng môi trường，tán xạ ánh sáng tự nhiên，ánh sáng dịu，sương sáng neon，
phối cảnh không khí，chi tiết vân siêu rõ，8K siêu nét，chi tiết siêu tinh xảo，
lưới bốn ô (2×2) trong cùng khung hình：nhìn quanh từ điểm trung tâm của bối cảnh，hình nhìn trước + hình nhìn phải + hình nhìn sau + hình nhìn trái，
cả bốn hướng nhìn đều quay ngang từ cùng một điểm trung tâm，kết cấu công trình giống nhau，tông màu chất liệu giống nhau，logic ánh sáng giống nhau，yếu tố Quốc phong Cyber hoàn toàn thống nhất，
trong khung hình không có bất kỳ nhân vật nào
trong hình không được có bất kỳ chữ nào

> **Hướng dẫn sử dụng**: tự phán đoán từ thông tin người dùng cung cấp xem cần áp dụng chiều biến đổi nào (cỡ cảnh/thời điểm/thời tiết), chiều nào không được nhắc tới thì để trống và bỏ qua trường tương ứng. Không cần sinh khuôn mẫu riêng cho từng biến thể. Bối cảnh cổ phong/đô thị chọn một để điền, trường riêng của bối cảnh không chọn thì xóa thẳng.

---

## 7. Quy tắc ràng buộc

### Quy tắc bắt buộc
(dùng chung cho hai bối cảnh cổ phong/đô thị, bắt buộc kích hoạt khi AI sinh)

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian bối cảnh, bố cục mạng đường/sân viện giữ hoàn toàn giống nhau ở mọi biến thể |
| R2 | Biến thể theo thời điểm bắt buộc chỉnh tông màu bầu trời và không khí, đồng bộ thích ứng logic bật tắt, độ sáng và nhiệt độ màu của nguồn sáng riêng của bối cảnh tương ứng |
| R3 | Biến thể theo thời tiết bắt buộc thích ứng thảm thực vật/bề mặt chất liệu, đồng bộ thích ứng phản hồi vật lý và ánh sáng của yếu tố riêng của bối cảnh tương ứng |
| R4 | Bắt buộc là "bản vẽ bốn hướng nhìn" (nhìn quanh từ điểm trung tâm: hình nhìn trước + hình nhìn phải + hình nhìn sau + hình nhìn trái), tuân thủ nghiêm ngặt bố cục lưới bốn ô 2×2 |
| R5 | Kết cấu công trình/chất liệu/tông màu/ánh sáng/mùa/thời tiết ở bốn hướng nhìn bắt buộc hoàn toàn giống nhau, yếu tố dung hợp Quốc phong Cyber không lệch, không sót |
| R6 | Trong ảnh bối cảnh **nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người, đường viền cơ thể người, đường viền động vật nào** |
| R7 | Tự phán đoán chiều biến đổi từ thông tin người dùng cung cấp, không cần tách thành khuôn mẫu riêng |
| R8 | Bắt buộc có các từ khóa render 3D cốt lõi (ít nhất 2 mục trong 3D rendered / volumetric lighting / PBR materials) |
| R9 | Bắt buộc có đặc tính quang học ống kính (ít nhất một mục trong depth of field / lens vignette / bokeh) |
| R10 | Chất liệu bắt buộc mang dấu mài mòn tự nhiên/dấu vết năm tháng, cấm "cảm giác nhựa", "cảm giác CG" mới tinh không tì vết |
| R11 | Mọi biến thể bắt buộc giữ logic dung hợp cốt lõi Quốc phong Cyber, bối cảnh cổ phong: hình chế phương Đông truyền thống làm cốt, công nghệ cyber làm biểu; bối cảnh đô thị: không gian đô thị hiện đại làm cốt, văn hóa Quốc phong làm hồn; cấm đứt gãy giữa các yếu tố |
| R12 | Bắt buộc có các từ khóa riêng của Quốc phong Cyber (ít nhất 2 mục trong chinoiserie cyberpunk, Quốc phong Cyber, cổ kiến cải tạo cyber, đô thị dung hợp Quốc phong) |
| R13 | Logic ánh sáng của mọi phần tử tự phát sáng (neon/hologram/màn hình lớn/đèn lồng) bắt buộc đúng quy luật vật lý, khớp hoàn hảo với ánh sáng môi trường, thời điểm, thời tiết, không tràn hiệu ứng sáng, không lệch bóng đổ |

### Quy tắc nghiêm cấm
(dùng chung cho hai bối cảnh cổ phong/đô thị, bắt buộc né khi AI sinh)

| Mã | Nghiêm cấm |
|---|---|
| X1 | Kết cấu công trình/bố trí/mạng đường/sân viện không nhất quán giữa các biến thể |
| X2 | Thời tiết mâu thuẫn với mùa (tuyết bay giữa hè, tuyết đọng mùa mưa...) |
| X3 | Chất liệu/tông màu/phong cách đổi đột ngột giữa các biến thể, logic dung hợp không nhất quán |
| X4 | Xuất hiện bất kỳ nhân vật, bóng người, hình bóng cơ thể người, đường viền cơ thể người, đường viền động vật nào |
| X5 | Kết cấu công trình/chất liệu/tông màu không nhất quán giữa bốn hướng nhìn, hoặc tâm/độ cao điểm nhìn không thống nhất |
| X6 | Dựng hình độ chính xác thấp/texture thô/chất nhựa/phong cách tô phẳng (cấm dùng các từ low-poly, rough modeling, flat color...) |
| X7 | Chất liệu quá sạch quá hoàn hảo, không có dấu vết sử dụng và năm tháng (tránh "cảm giác nhựa", "cảm giác đồ chơi") |
| X8 | Chiếu sáng quá đều quá phẳng, không có xóa phông theo chiều sâu, không có đặc tính quang học ống kính, không có ánh sáng thể tích/che khuất ánh sáng môi trường |
| X9 | Yếu tố Quốc phong và cyber ghép gượng gạo, chồng chất phi logic (cấm ghép loạn cổ kiến với cao ốc đô thị mà không dung hợp, cấm đặt yếu tố truyền thống cạnh yếu tố cyber một cách phi logic) |
| X10 | Hiệu ứng sáng cyber tràn ra, logic ánh sáng rối loạn, nguồn tự phát sáng không có cơ sở vật lý hợp lý, hướng đổ bóng sai |
| X11 | Đánh mất đặc trưng cốt lõi của bối cảnh: bối cảnh cổ phong mất kiến trúc/cốt lõi văn hóa phương Đông truyền thống, bối cảnh đô thị mất logic không gian đô thị hiện đại |
| X12 | Mất cân bằng phong cách trong một bối cảnh: bối cảnh cổ phong cyber hóa quá đà làm mất cốt lõi Quốc phong, bối cảnh đô thị Quốc phong hóa quá đà làm mất cảm giác vị lai cyber |
