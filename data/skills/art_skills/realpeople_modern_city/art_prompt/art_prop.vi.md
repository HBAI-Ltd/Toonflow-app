---
name: liveaction_urban_prop
description: Tạo hình ảnh đạo cụ đô thị người thật · sổ tay ràng buộc
metaData: liveaction_urban_art_skills
---

# Tạo hình ảnh đạo cụ đô thị người thật · Sổ tay ràng buộc

---

## 1. Nguyên tắc thiết kế đạo cụ

> Đạo cụ của đô thị người thật không phải "vật thể được dựng mô hình", mà là "vật đã được sử dụng" — nó từng nằm trong tay ai đó, từng đặt trên mặt bàn nào đó, từng nhét trong túi áo nào đó. Thứ máy quay ghi lại là khoảnh khắc hiện tại của nó.

1. **Vật phẩm chính là tự sự** — mỗi món đạo cụ là một chiếc bình chứa tự sự thu nhỏ. Vết son trên cốc cà phê ám chỉ vừa nãy có người uống, độ mòn của ốp điện thoại ám chỉ đã dùng rất lâu, nếp gấp của chiếc ô ám chỉ nó bị mở ra gập vào nhiều lần
2. **Dấu vết sử dụng được ưu tiên hơn tình trạng hoàn hảo** — đạo cụ của đô thị người thật bắt buộc có bằng chứng "đã được dùng". Đạo cụ mới tinh, vừa bóc hộp, đạt chuẩn hàng mẫu đều không được xuất hiện
3. **Vật phẩm thật của đời sống đô thị Trung Quốc đương đại** — đạo cụ bắt buộc là những vật tồn tại thật trong đời sống đô thị Trung Quốc: giao diện Alipay/WeChat Pay, thương hiệu điện thoại nội địa, bao bì chữ Hán, hộp đồ ăn giao tận nơi kiểu Trung Quốc — khước từ những vật hư cấu không quốc tịch
4. **Vật liệu chính là sự chân thực** — không phải vật liệu render ra từ tham số PBR, mà là hành xử thật của vật liệu được máy quay ghi lại: ánh phản xạ của thép không gỉ, men gốm, độ hút sáng của giấy, vân ép nhựa
5. **Chụp tĩnh vật một hướng nhìn** — đạo cụ được thể hiện độc lập bằng một tấm ảnh sản phẩm tĩnh vật duy nhất, không phải trưng bày nhiều góc kiểu dựng mô hình, không phải lưới bốn ô 2×2

---

## 2. Phân loại đạo cụ và ràng buộc thẩm mỹ

### 2.1 Thiết bị liên lạc và điện tử

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Điện thoại thông minh/laptop/máy tính bảng/tai nghe không dây/đồng hồ thông minh/sạc dự phòng/dây cáp | {loại thiết bị}, thiết bị điện tử thường ngày của đô thị đương đại |
| Chi tiết bề ngoài | Màn hình hiện giao diện chữ Hán (đoạn chat, thông báo, bản đồ dẫn đường, app đặt đồ ăn), thân máy có dấu dùng bình thường (góc cạnh hơi va chạm, màn hình có vết xước mảnh), ốp bảo vệ cũ đi tự nhiên | màn hình hiện giao diện chữ Hán、dấu vết sử dụng thường ngày trên thân máy、góc cạnh hơi va chạm、ốp bảo vệ cũ đi tự nhiên |
| Chất liệu | Khung nhôm anod hóa/mặt kính/lưng nhựa, phản xạ vật liệu thật và tự nhiên, không phải highlight render | chất nhôm anod hóa、mặt kính phản xạ tự nhiên、độ bóng vật liệu thật chứ không phải CG |
| Cảm giác trạng thái | Thiết bị đang được dùng bình thường — không phải mới xuất xưởng, không phải hỏng nặng | trạng thái dùng thường ngày、dấu vết sử dụng có hơi thở đời sống、không phải máy trưng bày |
| Prompt | {thiết bị} đô thị người thật, chụp sản phẩm thật, hiện giao diện chữ Hán, dấu vết sử dụng thường ngày | — |

### 2.2 Đạo cụ ăn uống

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Cốc cà phê/hộp đồ ăn giao tận nơi/cốc trà sữa/hộp cơm/bình giữ nhiệt/cốc thủy tinh/bộ đồ ăn/bao bì cửa hàng tiện lợi | {loại đạo cụ ăn uống}, đồ dùng ăn uống thường ngày của đô thị Trung Quốc đương đại |
| Chi tiết bề ngoài | Vết son còn lại trên miệng cốc/hơi nước ngưng tụ/vệt trà/vết thức ăn thừa, bao bì đồ giao tận nơi có nhãn thương hiệu chữ Hán, vỏ giấy bọc cốc nhăn tự nhiên, đáy bình giữ nhiệt bị mòn | vết còn lại tự nhiên trên miệng cốc、hơi nước ngưng tụ、bao bì đồ giao tận nơi kiểu Trung Quốc、nhãn thương hiệu chữ Hán、trạng thái tự nhiên sau khi dùng |
| Chất liệu | Mặt giấy lì của cốc giấy/độ bóng men gốm/thép không gỉ xước xoáy/hộp nhựa trong, biểu hiện thật của các vật liệu này dưới ánh sáng tự nhiên | chất bề mặt tự nhiên của cốc giấy、men gốm phản xạ nhẹ、vân xước xoáy của thép không gỉ、vật liệu thật chứ không phải render |
| Prompt | {đạo cụ ăn uống} đô thị người thật, chụp sản phẩm thật, trạng thái tự nhiên sau khi dùng, ăn uống thường ngày của Trung Quốc đương đại | — |

### 2.3 Đồ dùng văn phòng và học tập

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Sổ tay/bút ký/kẹp tài liệu/giấy nhớ/dập ghim/thẻ nhân viên/túi bút/đèn bàn/giá sách/giáo trình | {loại đồ dùng văn phòng học tập}, dụng cụ làm việc/học tập thường ngày của đô thị |
| Chi tiết bề ngoài | Bìa sổ có nếp gấp/trang sách có góc quăn và ghi chú/thân bút mòn chỗ cầm/góc giấy nhớ cong lên/vỏ thẻ nhân viên có vết xước | nếp gấp trên bìa、trang sách quăn góc tự nhiên、mòn ở chỗ cầm、góc sticker cong lên、vết xước trên bề mặt vỏ thẻ |
| Chất liệu | Vân sợi giấy/vân da của bìa/vân ép nhựa của thân bút/độ bóng mạ của kẹp kim loại | vân giấy tự nhiên、vân da thật、chất nhựa ép、độ bóng kim loại tự nhiên |
| Prompt | {đồ dùng văn phòng học tập} đô thị người thật, chụp sản phẩm thật, dấu vết sử dụng thường ngày, chất liệu thật | — |

### 2.4 Vật dụng mang theo và đi lại

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Ba lô/chìa khóa/ô/ví/thẻ tàu điện ngầm/giao diện app xe đạp công cộng/chứng minh thư/thẻ ra vào/bằng lái | {loại vật dụng}, vật dụng mang theo và đi lại thường ngày của đô thị |
| Chi tiết bề ngoài | Ví da mòn tự nhiên/chìa khóa có vết xước/mặt ô có nếp gấp và vết mưa/quai ba lô biến dạng sau khi dùng/góc thẻ mòn | da cũ đi tự nhiên、vết xước trên chìa khóa kim loại、nếp gấp mặt ô và vết mưa còn lại、quai đeo biến dạng tự nhiên、mặt thẻ mòn do dùng |
| Chất liệu | Da/vải bố/nylon/kim loại/nhựa, với chất thật sau khi dùng hằng ngày | lớp bóng của da đã dùng、vải bố cũ đi tự nhiên、vết oxy hóa trên kim loại、chất thật của việc sử dụng |
| Prompt | {vật dụng mang theo} đô thị người thật, chụp sản phẩm thật, mòn do mang theo hằng ngày, vật thật đã được dùng | — |

### 2.5 Trang sức và phụ kiện cá nhân

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Khuyên tai/dây chuyền/vòng tay/nhẫn/đồng hồ/kẹp tóc/kính/kính râm/khăn lụa/khăn quàng | {loại trang sức phụ kiện}, trang sức cá nhân thường ngày của đô thị đương đại |
| Chi tiết bề ngoài | Đồ bạc hơi xỉn màu/bề mặt kim loại có vết xước mảnh/dây da có vết gập/đệm mũi kính có dấu dùng/khăn lụa có nếp nhăn tự nhiên | đồ bạc xỉn nhẹ tự nhiên、vết xước mảnh do đeo hằng ngày、dây đeo gập tự nhiên、dấu dùng trên gọng kính |
| Chất liệu | Kim loại/da/vải/nhựa acetate/ngọc trai/acrylic, tay nghề đạt cấp trang sức nhưng vẫn giữ dấu vết thật trong quá trình dùng | độ bóng kim loại hơi lì、vân gập của da、độ xù tự nhiên của vải、ánh ngọc trai ấm mượt |
| Prompt | {trang sức} đô thị người thật, chụp sản phẩm thật, dấu vết đeo hằng ngày, chi tiết vật liệu thật | — |

### 2.6 Vật dụng lặt vặt trong nhà

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Điều khiển từ xa/hộp thuốc/hộp kính/khung ảnh/chậu cây/chân nến/cốc bàn chải/khăn mặt/dép/khay chìa khóa | {loại vật dụng trong nhà}, đồ gia dụng thường ngày của đô thị Trung Quốc đương đại |
| Chi tiết bề ngoài | Nhãn hộp thuốc ghi chữ Hán, nút điều khiển mòn/khe hở có bụi, khung ảnh bám bụi, lá cây có đầu vàng, khăn mặt mềm ra và xù | nhãn thuốc chữ Hán、nút bấm mòn do dùng hằng ngày、cảm giác bụi bám tự nhiên、đầu lá khô tự nhiên、khăn xù do dùng |
| Chất liệu | Nhựa/gỗ/gốm/vải/thủy tinh, trạng thái vật liệu thật trong môi trường gia đình | nhựa lên bóng do dùng、vân gỗ tự nhiên、men gốm、chất vải mềm |
| Prompt | {vật dụng trong nhà} đô thị người thật, chụp sản phẩm thật, dấu vết sử dụng trong gia đình, trạng thái thật của đồ gia dụng | — |

### 2.7 Vật kỷ niệm và đạo cụ then chốt

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Ảnh cũ/lá thư/bưu thiếp/vé tàu xe/nhẫn/mặt dây chuyền/nhật ký/máy ghi âm/sổ tiết kiệm/bệnh án/móc khóa | {loại vật kỷ niệm}, vật then chốt mang ký ức của câu chuyện |
| Chi tiết bề ngoài | Giấy ố vàng/nét chữ hơi nhòe/mép ảnh cong lên/kim loại phai màu/mặt da mòn — cảm giác năm tháng và dấu vết cảm xúc thấy rõ | giấy ố vàng tự nhiên、mực viết tay hơi nhòe、mép ảnh cong lên、kim loại phai màu lên nước、mòn do lật giở nhiều lần |
| Tính đặc thù | Bắt buộc có bằng chứng thị giác của việc "từng được ai đó trân quý/lật giở/mang theo", chứ không phải một món đạo cụ trống trơn | vùng mòn do tiếp xúc nhiều lần、dấu vết lật giở、bằng chứng của việc mang theo bên người |
| Cảm giác trạng thái | Cảm giác đồ cũ — nhưng không phải cố tình làm cũ, mà là sự già đi tự nhiên của việc "để rất lâu" | cũ đi tự nhiên theo năm tháng、dấu vết thời gian để lại、không phải cố tình làm cũ |
| Prompt | {vật kỷ niệm} đô thị người thật, chụp sản phẩm thật, dấu vết tự nhiên do năm tháng để lại, vật mang ký ức | — |

### 2.8 Vật dụng y tế và sức khỏe

| Hạng mục | Ràng buộc | Prompt |
|---|---|---|
| Loại | Hộp thuốc/lọ thuốc/nhiệt kế/băng dán cá nhân/khẩu trang/dung dịch sát khuẩn/sổ khám bệnh/phiếu kiểm tra sức khỏe/thuốc nhỏ mắt/bình giữ nhiệt | {loại vật dụng y tế sức khỏe}, đồ dùng sức khỏe thường ngày của đô thị Trung Quốc đương đại |
| Chi tiết bề ngoài | Tờ hướng dẫn và bao bì thuốc bằng chữ Hán, khẩu trang có nếp nhăn do đeo, nhiệt kế có dấu dùng, vỉ nhôm trong hộp thuốc khuyết chỗ đã lấy thuốc | nhãn bao bì thuốc chữ Hán、nếp nhăn của khẩu trang sau khi đeo、hộp thuốc đã mở、trạng thái thật sau khi dùng |
| Chất liệu | Hộp giấy/lọ nhựa/vỉ nhôm/thủy tinh/vải không dệt, các vật liệu thật liên quan tới y tế | chất hộp giấy、lọ thuốc nhựa、phản xạ của vỉ nhôm、vân vải không dệt |
| Prompt | {vật dụng y tế} đô thị người thật, chụp sản phẩm thật, trạng thái dùng thường ngày, thường thấy trong gia đình Trung Quốc đương đại | — |

---

## 3. Quy phạm chụp tĩnh vật một hướng nhìn

> Đạo cụ đô thị người thật chỉ cần một tấm ảnh sản phẩm tĩnh vật duy nhất, không phải trưng bày nhiều góc kiểu dựng mô hình. Dưới đây là quy phạm đầy đủ cho việc chụp một hướng nhìn.

### Cấu thành khung hình

| Hạng mục | Yêu cầu nhiếp ảnh |
|---|---|
| Cách bày đạo cụ | Đạo cụ bày độc lập ở giữa khung hoặc lệch theo đường một phần ba, lọt khung đủ, không cắt cúp |
| Phông nền | Giấy phông liền mạch xám mộc #B0B0B0 (lì), hoặc mặt bàn/mặt quầy trắng thuần (mặt bàn vân gỗ nhạt/trắng ngà), chọn theo thuộc tính của đạo cụ. Không có vật thừa, không trang trí, không chữ |
| Ánh sáng | Ánh sáng cửa sổ tự nhiên hoặc một đèn dịu. Ánh sáng cửa sổ xiên vào 45° (sáng dịu có bóng đổ tự nhiên), hoặc softbox đánh đỉnh + bù sáng bên (ánh sáng đều cấp độ chụp sản phẩm). Ánh sáng dịu, hướng rõ ràng, không đổ bóng gắt |
| Trường ảnh | Trường ảnh nông (f/2.8-f/5.6), chủ thể đạo cụ rõ và sắc nét, phía trước và sau hơi mờ để làm nổi chủ thể |
| Bóng đổ | Bóng tiếp xúc tự nhiên giữa đáy đạo cụ và mặt đỡ — bóng thật chứ không phải tách nền hay lơ lửng. Bóng mềm, hướng trùng với đèn chính |
| Tỉ lệ khung hình | Đề xuất 1:1 vuông hoặc 4:3, phù hợp để trưng bày một món đạo cụ |

### Chuẩn mực trạng thái đạo cụ

| Phương diện | Yêu cầu |
|---|---|
| Dấu vết sử dụng | Bắt buộc có bằng chứng thị giác của việc "đã được dùng" — không phải mới tinh chưa bóc hộp, không phải tình trạng hàng mẫu |
| Tính nhận diện Trung Quốc | Nhãn chữ Hán/thương hiệu Trung Quốc/bao bì kiểu Trung Quốc/đời thường Trung Quốc đương đại — khước từ vật hư cấu không quốc tịch |
| Chất liệu chân thực | Không phải chất render — mà là hành xử thật của vật liệu được máy quay ghi lại (phản xạ, tán xạ, truyền qua của ánh sáng) |
| Cảm giác kích thước | Gợi kích thước thật qua mật độ vân vật liệu và chi tiết gia công, không cần vật đối chiếu |

---

## 4. Vật liệu và bề mặt — vật thể thật dưới máy quay

> Dưới đây là mô tả cách máy quay nhìn bề mặt của các vật dụng đô thị thường ngày, không phải tham số render.

| Vật liệu | Biểu hiện thật dưới máy quay | Prompt |
|---|---|---|
| Kim loại (thép không gỉ/hợp kim nhôm) | Thấy được vân xước xoáy, điểm sáng ở cạnh sắc nhưng không cháy trắng, phản chiếu màu môi trường dịu xung quanh, bề mặt có dấu vân tay và vết xước mảnh | vân xước xoáy kim loại、phản chiếu môi trường tự nhiên、vết xước mảnh và dấu vân tay trên bề mặt、độ bóng không phải render |
| Thủy tinh | Trong nhưng có màu riêng rất nhạt (mặt cắt ngả xanh nhạt), bề mặt có dấu tay hoặc vệt nước, cạnh vát có khúc xạ ánh sáng | thủy tinh trong tự nhiên、dấu tay/vệt nước thật trên bề mặt、khúc xạ ánh sáng ở cạnh、không trong suốt hoàn hảo kiểu CG |
| Gốm | Men phản xạ dịu (không phải như gương), bề mặt có vết rạn/xước rất mảnh, miệng và đáy cốc mòn do dùng | men gốm phản xạ dịu、vết xước mảnh do dùng、đáy cốc mòn tự nhiên |
| Nhựa | Thấy được vân ép/đường ghép khuôn, bề mặt có vết xước mảnh, chất tán xạ của nhựa lì | vân ép nhựa rõ、đường ghép khuôn thấy được tự nhiên、vết xước mảnh do dùng trên bề mặt |
| Giấy | Thấy được độ nhám của sợi giấy, nếp gấp tự nhiên (không phải cố ý), chữ in hơi nhòe, mép mòn do lật giở | vân sợi giấy、nếp gấp tự nhiên、chất thật của chữ in、mép mòn tự nhiên |
| Vải (cotton/lanh/vải bố) | Thấy được vân dệt, bề mặt có xù/vón, nếp gấp và nhăn do dùng, màu hơi không đều | vân dệt của vải、xù và vón tự nhiên、nếp nhăn thật sau khi dùng |
| Da | Thấy được vân tự nhiên/lỗ chân lông, chỗ gập có dấu dùng, mép mòn tự nhiên, khóa kim loại bị oxy hóa | vân da tự nhiên、dấu dùng ở chỗ gập、khóa kim loại oxy hóa nhẹ、lớp bóng thật do dùng |
| Gỗ | Vân gỗ tự nhiên, bề mặt có vết xước/va chạm, lớp sơn mòn do dùng, màu hơi biến đổi | vân gỗ tự nhiên rõ、dấu va chạm do dùng trên bề mặt、lớp sơn mòn thường ngày |

---

## 5. Khuôn mẫu prompt

chụp sản phẩm thật đạo cụ đô thị người thật，trưng bày tĩnh vật một tấm duy nhất，không render 3D không CG không dựng mô hình，
{loại đạo cụ}，{mô tả vật liệu}，{chi tiết bề ngoài — dấu vết sử dụng, nhãn chữ Hán, trạng thái thường ngày}，
đạo cụ trưng bày độc lập，{mô tả phông nền: giấy phông xám mộc #B0B0B0 / mặt bàn vân gỗ nhạt / mặt quầy trắng ngà}，
{mô tả nguồn sáng: ánh sáng cửa sổ tự nhiên xiên vào 45° / softbox đánh đỉnh + bù sáng bên}，trường ảnh nông f/2.8-f/5.6，bóng đổ dịu tự nhiên，
{mô tả chất liệu thật: kim loại xước xoáy/thủy tinh trong/men gốm/vân giấy/vân da/vân dệt của vải}，
thấy được dấu vết sử dụng thường ngày、không phải tình trạng hàng mẫu mới tinh、vật dụng thường ngày của đô thị Trung Quốc đương đại，
khung hình sạch không chữ không watermark không chữ ký không viền，
chất lượng ảnh chụp tả thực người thật、chất nhiếp ảnh full-frame 35mm

### Prompt né tránh (negative prompt)

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, 8K modeling, game engine, cartoon, anime, 2D, illustration, hand drawn,
brand new, unboxed, pristine, showroom, sample product, perfect condition, unused,
floating, shadowless, cut out, white background isolation, clipping path,
multiple views, grid layout, four views, turnaround, orthographic view, blueprint,
古风, 古代, 仙侠, 武侠, 民国, 赛博朋克, 科幻, 西方奇幻, 中世纪, 非中国物品,
person, hand, finger, holding, wearing, using, interacting,
text on image, watermark, signature, logo, border, frame

---

## 6. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Bắt buộc là "một tấm ảnh tĩnh vật duy nhất" — một hướng nhìn, không phải nhiều góc, không phải lưới bốn ô 2×2, không phải trưng bày kiểu dựng mô hình |
| R2 | Bắt buộc chỉ định "giấy phông xám mộc #B0B0B0" hoặc mặt bàn thật như "mặt bàn vân gỗ nhạt/mặt quầy trắng ngà", cấm bối cảnh phức tạp |
| R3 | Bắt buộc chỉ định logic nguồn sáng — ánh sáng cửa sổ hoặc softbox, hướng sáng tối rõ ràng, bóng đổ tự nhiên |
| R4 | Đạo cụ bắt buộc có "dấu vết sử dụng" — không mới tinh, không phải tình trạng hàng mẫu, không phải chưa bóc hộp |
| R5 | Đạo cụ bắt buộc có tính nhận diện của đô thị Trung Quốc đương đại — nhãn chữ Hán/thương hiệu Trung Quốc/bao bì kiểu Trung Quốc |
| R6 | Bắt buộc tuyên bố neo cốt lõi "chụp sản phẩm thật + không render 3D không CG" |
| R7 | Vật liệu bắt buộc được mô tả theo biểu hiện thật dưới máy quay, chứ không phải theo tham số render |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm "render 3D / dựng mô hình 3D / CG / UE engine / Blender / vật liệu PBR" và mọi thuật ngữ CG khác |
| X2 | Nghiêm cấm "vẽ tay 2D / minh họa / hoạt hình / anime" và các phương tiện phi nhiếp ảnh khác |
| X3 | Nghiêm cấm "nhiều góc / bốn hướng nhìn / lưới 2×2 / hình chiếu trực giao / turnaround / blueprint" — chỉ một tấm duy nhất |
| X4 | Nghiêm cấm đạo cụ ở tình trạng "mới tinh chưa bóc hộp / tình trạng hàng mẫu / không có dấu vết sử dụng / tình trạng hoàn hảo" |
| X5 | Nghiêm cấm "cổ phong/thời cổ/tiên hiệp/võ hiệp/Dân Quốc/cyberpunk/khoa học viễn tưởng/kỳ ảo phương Tây/hư cấu" và các vật phẩm phi đô thị đương đại khác |
| X6 | Nghiêm cấm "vật hư cấu không có tính nhận diện Trung Quốc / bao bì toàn tiếng Anh / thương hiệu không phải Trung Quốc" |
| X7 | Nghiêm cấm "xuất hiện nhân vật/bàn tay/ngón tay/chi thể/chi giả" |
| X8 | Nghiêm cấm trạng thái "đạo cụ đang bị cầm/nắm/đeo/đang được dùng/đang tương tác với nhân vật" |
| X9 | Nghiêm cấm "lơ lửng/tách nền trắng/không bóng đổ/không có mặt đỡ" — vật phẩm bắt buộc đặt trên một bề mặt thật |
| X10 | Nghiêm cấm "watermark / chữ / LOGO / chữ ký / viền / dấu vết sinh bằng AI" |
