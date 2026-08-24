---
name: liveaction_urban_scene_derivative
description: Tạo tài nguyên phái sinh bối cảnh đô thị người thật · sổ tay ràng buộc
metaData: liveaction_urban_art_skills
---

# Tạo tài nguyên phái sinh bối cảnh đô thị người thật · Sổ tay ràng buộc

---

## 1. Nguyên tắc phái sinh

> Phái sinh bối cảnh của đô thị người thật không phải "cắt thêm góc máy trong một bối cảnh đã render", mà là "cùng một địa điểm có thật, đứng ở vị trí khác, vào thời điểm khác, dưới thời tiết khác, được máy quay ghi lại thêm một lần nữa".

1. **Neo không gian** — kết cấu không gian cốt lõi của cùng một bối cảnh bắt buộc nhận ra được ở mọi biến thể. Đổi góc, đổi ánh sáng, đổi thời tiết — nhưng nhìn một cái là biết "vẫn là chỗ đó"
2. **Tiêu cự là tự sự** — cùng một bối cảnh chụp bằng các tiêu cự khác nhau sẽ nói ra những điều khác nhau. Góc rộng nói "quan hệ cô độc giữa con người này và thành phố", tiêu cự trung nói "hãy nhìn vào góc này", tele nói "ở đằng xa có gì đó"
3. **Thời khắc là cảm xúc** — văn phòng trong nắng sớm và văn phòng lúc đêm khuya là cùng một không gian với hai cảm xúc. Thời khắc đổi, ánh sáng đổi, chức năng tự sự của bối cảnh cũng đổi — không đơn giản như thay một tấm texture bầu trời
4. **Thời tiết là câu chuyện** — cùng một con phố, ngày nắng là đời thường, ngày mưa là u uất, ngày tuyết là lãng mạn hoặc cô độc. Thời tiết là bộ lọc cảm xúc của bối cảnh, nhưng không phải là filter — mà là sự thay đổi quang học và môi trường có thật
5. **Chụp một hướng nhìn** — mỗi biến thể phái sinh là một tấm ảnh toàn cảnh độc lập, chỉ một tấm. Cùng không gian với bản vẽ bối cảnh gốc, nhưng có thể khác tiêu cự, khác thời khắc, khác thời tiết

---

## 2. Biến thể tiêu cự và bố cục — những ánh nhìn khác nhau vào cùng một không gian

### Định nghĩa biến thể bố cục

| Biến thể | Tiêu cự | Phạm vi | Chức năng tự sự | Prompt |
|---|---|---|---|---|
| Toàn cảnh góc rộng | 24-28mm | Toàn cảnh bối cảnh + môi trường đô thị xung quanh | Thiết lập định vị không gian, thể hiện quan hệ giữa không gian và thành phố; nhân vật nếu đứng ở đây sẽ trông nhỏ bé | toàn cảnh góc rộng 24mm、không gian trọn vẹn + quan hệ với môi trường、trường ảnh sâu f/8-f/11 |
| Toàn cảnh tiêu chuẩn (标准全景) | 35mm | Bối cảnh hiện ra trọn vẹn | Góc nhìn tương đương mắt người, ghi chép khách quan về địa điểm này, bố cục "thành thật" nhất | toàn cảnh tiêu chuẩn 35mm (标准全景)、góc nhìn mắt người、diện mạo trọn vẹn của địa điểm |
| Trung cảnh tập trung (中景聚焦) | 50mm | Khu chức năng cốt lõi/phần cục bộ dễ nhận diện nhất của bối cảnh | Tập trung vào "trái tim" của không gian — khu bàn làm việc của văn phòng, quầy bar của quán cà phê, ngã tư của con phố | trung cảnh tập trung 50mm (中景聚焦)、khu vực tự sự cốt lõi của không gian |
| Cận cảnh chi tiết (近景细节) | 85mm | Một phần cục bộ trong không gian — một ô cửa sổ, một ngọn đèn, một chiếc bàn | Dẫn ánh nhìn tới một chi tiết tự sự nào đó của không gian — cốc cà phê còn uống dở kia, tấm chăn vứt trên sofa kia | cận cảnh 85mm (近景)、chi tiết tự sự của không gian、trường ảnh nông làm nổi chủ thể |
| Cùng góc khác độ cao | — | Thay đổi độ cao góc nhìn | Chụp từ trên xuống — ánh nhìn của số phận; ngang tầm mắt — góc nhìn của con người; chụp từ dưới lên — sự áp chế hoặc sự cao vời | chụp ngược từ góc thấp/chụp xuống từ góc cao、giữ nguyên kết cấu không gian gốc |

### Quy tắc phái sinh theo tiêu cự

| Phái sinh từ toàn cảnh góc rộng | Giữ nguyên | Mục thay đổi |
|---|---|---|
| 广角→标准全景 | Kết cấu không gian, logic nguồn sáng, thời khắc và thời tiết, dấu vết sử dụng | Tiêu cự thu hẹp về 35mm, phạm vi khung hình thu nhỏ nhưng không đổi không gian, phối cảnh gần với mắt người hơn |
| 标准全景→中景聚焦 | Chất liệu, hướng ánh sáng, tông màu, dấu vết sử dụng | Tiêu cự thu hẹp về 50mm, cắt cúp tập trung vào khu vực cốt lõi, trường ảnh nông đi vừa phải |
| 中景→近景细节 | Vân chất liệu, vị trí đạo cụ, hướng ánh sáng | Tiêu cự 85mm, trường ảnh cực nông, hậu cảnh mờ đi tự nhiên, làm nổi chi tiết tự sự trong không gian |

---

## 3. Biến thể thời khắc — lớp trang điểm mà thời gian đánh lên không gian

> Cùng một không gian, ánh sáng của những thời khắc khác nhau biến nó thành những địa điểm hoàn toàn khác. Dưới đây là hành xử của nguồn sáng thật ở các thời khắc then chốt.

| Thời khắc | Công thức ánh sáng | Chuyển biến cảm xúc của không gian | Prompt |
|---|---|---|---|
| Sáng sớm | Nắng sớm trắng ấm góc thấp, sương mỏng tán xạ trong không khí, không gian hơi lạnh, chưa tỉnh hẳn | Tĩnh mịch, tích lực, chưa bị trật tự ban ngày lấp đầy — "mọi thứ còn chưa bắt đầu" | bối cảnh sáng sớm、nắng sớm góc thấp xiên vào、không gian còn lạnh chưa ấm、sự yên tĩnh khi chưa có người |
| Buổi sáng | Ánh sáng lên cao, trắng lạnh trong veo, bóng sắc nét, chất liệu rõ ràng | Sự thiết lập trật tự — trạng thái "mặc định" của bối cảnh ban ngày | nắng buổi sáng、không gian sáng và rõ、địa điểm đang vận hành thường ngày |
| Chính ngọ | Đèn đỉnh là chính, bóng ngắn và đậm, nếu ngoài trời thì chất liệu phản xạ mạnh | Cảm giác tạm dừng — khoảng trống của giờ nghỉ trưa, đỉnh điểm của ngày này qua ngày khác | đèn đỉnh chính ngọ、không gian bước vào nhịp tạm dừng của ban ngày、sự yên tĩnh hoặc thả lỏng ngắn ngủi buổi trưa |
| Xế chiều | Ánh sáng ngả tây, tông ấm mạnh dần, ánh xiên xuyên qua cửa sổ hoặc tán cây tạo bóng dài và đốm nắng | Lười biếng, thời gian chậm lại, mọi thứ buổi xế đều dịu — "quãng dài nhất trong ngày" | ánh xiên buổi xế、bóng dài băng qua không gian、đốm nắng rải rác、buổi xế lười biếng ấm áp |
| Giờ vàng | Ánh vàng cam góc thấp cực ấm, bóng dài đến cực hạn, mọi bề mặt được mạ vàng | Sự trân quý — thứ ánh sáng quý giá nhất trong ngày, hơi ấm thoáng chốc | giờ vàng、ánh vàng ấm xiên tràn ngập không gian、mọi bề mặt nhuốm viền vàng、hơi ấm thoáng chốc |
| Giờ xanh | Bầu trời xanh tím thẫm, ánh sáng tự nhiên cực tối và cực lạnh, nguồn sáng nhân tạo vừa bật lên, lạnh ấm cùng tồn tại | Sự chuyển tiếp — ngày đã hết, đêm chưa tiếp quản hẳn, khoảnh khắc thi vị ngắn ngủi nhất | giờ xanh、bầu trời xanh tím thẫm lọt qua cửa、nguồn sáng nhân tạo vừa lên、ánh lạnh và ánh ấm cùng tồn tại |
| Đêm khuya | Chỉ dựa vào nguồn sáng nhân tạo — một ngọn đèn bàn, ánh đèn đường ngoài cửa sổ, ánh lạnh của màn hình | Cô độc hoặc riêng tư — thế giới đã lặng, không gian thuộc về một người (hoặc chẳng thuộc về ai) | bối cảnh đêm khuya、chỉ một nguồn sáng ấm duy nhất từ đèn bàn/đèn đường ngoài cửa sổ、phần lớn khu vực chìm vào vùng tối、cực kỳ tĩnh mịch |

### Quy tắc phái sinh theo thời khắc

| Phái sinh từ thời khắc gốc | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Ban ngày → hoàng hôn (giờ vàng) | Kết cấu không gian, vị trí đồ nội thất/vật dụng, mặt ngoài công trình | Nhiệt độ màu nguồn sáng ấm lên tới 2800-3500K, bóng kéo dài, mặt sáng nhuốm sắc vàng, nguồn sáng nhân tạo lần lượt bật lên |
| Ban ngày → ban đêm | Kết cấu không gian, vị trí đồ nội thất/vật dụng, mặt ngoài công trình | Độ phơi sáng tổng thể giảm, nguồn sáng nhân tạo bật hết, neon/đèn đường/đèn trong nhà thành nguồn sáng chính, ngoài cửa sổ từ ban ngày chuyển thành cảnh đêm |
| Trong nhà ban ngày → trong nhà đêm khuya | Kết cấu không gian, vị trí bài trí | Chỉ giữ lại rất ít nguồn sáng (một đèn bàn/một đèn đường ngoài cửa sổ), phạm vi lớn chìm vào vùng tối, cảm giác riêng tư hoặc cô độc |

---

## 4. Biến thể thời tiết — cảm xúc mà thời tiết mang đến cho không gian

> Cùng một con phố, cùng một ô cửa sổ, thời tiết khác nhau biến chúng thành những câu chuyện khác nhau.

| Thời tiết | Thay đổi của không gian | Cảm xúc | Prompt |
|---|---|---|---|
| Ngày nắng | Sáng tối sắc nét, chất liệu rõ ràng, màu sắc bão hòa | Đời thường, sáng sủa, cởi mở | bối cảnh ngày nắng、nắng dồi dào、sáng tối rành mạch、chất liệu rõ ràng |
| Nhiều mây/âm u | Sáng dịu không bóng gắt, tổng thể ngả xám lạnh, ánh sáng đều | Tiết chế, bình lặng, hoặc là điềm báo của sự đè nén | sáng dịu ngày âm u、không đổ bóng gắt、ánh sáng tán xạ đều、tổng thể ngả tông xám lạnh |
| Sương mỏng | Cảnh ở xa mờ đi tự nhiên, phần gần rõ nét, không khí có độ ẩm thấy được | Mơ hồ, bất định, thi vị | bối cảnh trong sương mỏng、cảnh ở xa dần tan vào sương、phần gần rõ nét、không khí có độ ẩm thấy được |
| Mưa nhỏ | Kính cửa sổ có vệt mưa, mặt đất ướt có phản chiếu, kim loại/lá cây ngoài trời đọng giọt nước | U uất, trầm tư, lãng mạn, hoặc là khúc ngoặt của câu chuyện | bối cảnh trong mưa phùn、vệt mưa trên kính cửa sổ、mặt đất ướt phản chiếu tự nhiên、không khí lạnh và ẩm |
| Mưa lớn | Màn mưa dày đặc, tầm nhìn ngoài trời giảm, vũng nước và nước bắn trên mặt đất, hình ảnh hóa tiếng mưa | Sự cách ly — trong nhà là nơi trú ẩn, ngoài trời là không còn chỗ chạy | bối cảnh mưa lớn、màn mưa dày ngoài cửa sổ、vũng nước bắn tung trên mặt đất、cảm giác cách ly giữa trong nhà và ngoài trời |
| Sau mưa | Vạn vật ẩm ướt, mặt đất còn vũng nước, không khí trong lành, phản chiếu rõ nét, có thể có nắng lọt qua kẽ mây | Sự tái sinh, trong trẻo, sự gột rửa cảm xúc | bối cảnh sau mưa、không khí ẩm、vũng nước trên mặt đất phản chiếu bầu trời、sự trong trẻo của vạn vật vừa được gột rửa |
| Tuyết nhẹ | Bông tuyết bay, lớp trắng mỏng đọng lại, ánh ấm xuyên qua màn tuyết, quỹ đạo tuyết bay thấy được trong không khí | Tĩnh mịch, dịu dàng, lãng mạn | bối cảnh tuyết nhẹ、bông tuyết thưa bay xuống、mặt đất phủ trắng mỏng、ánh ấm xuyên qua tuyết bay、bình yên dịu dàng |
| Tuyết lớn | Tuyết phủ kín bề mặt, màu trắng chiếm ưu thế, hình ảnh hóa việc âm thanh bị hút mất | Cô quạnh hoặc lãng mạn — thế giới bị giản lược còn hai màu đen trắng | bối cảnh tuyết lớn、tuyết phủ mặt đất và các cạnh công trình、thế giới bị màu trắng giản lược、cô quạnh hoặc lãng mạn |

### Quy tắc phái sinh theo thời tiết

| Phái sinh từ ngày nắng | Giữ nguyên | Mục thay đổi |
|---|---|---|
| Nắng → sương mỏng | Kết cấu không gian, mặt ngoài công trình, vị trí vật dụng | Thêm các lớp sương, cảnh ở xa mờ đi, giảm độ bão hòa, nguồn sáng tạo ra chùm sáng thấy được (hiệu ứng Tyndall thật, không phải kỹ xảo) |
| Nắng → mưa nhỏ | Kết cấu không gian, mặt ngoài công trình, vị trí vật dụng | Thêm sợi mưa ngoài trời, thêm vệt mưa thật trên kính, mặt đất ướt trơn phản chiếu, tông màu ngả lạnh, cây cối đọng giọt nước |
| Nắng → tuyết | Kết cấu không gian, mặt ngoài công trình, vị trí vật dụng | Thêm tuyết bay/tuyết đọng, tông màu ngả trắng lạnh, tăng độ tương phản của nguồn sáng ấm, tuyết đọng trên cành cây/bệ cửa sổ |
| Trong nhà ngày nắng → trong nhà ngày mưa | Kết cấu không gian, vị trí bài trí | Ngoài cửa sổ thành cảnh mưa, kính cửa sổ có vệt mưa, ánh sáng trong nhà tối và lạnh hơn, cảm xúc từ sáng sủa chuyển thành u uất |

---

## 5. Quy phạm chụp một hướng nhìn — dùng chung cho mọi biến thể phái sinh

> Mỗi biến thể phái sinh là một tấm ảnh toàn cảnh độc lập, chỉ **một tấm**. Không phải bốn hướng nhìn 2×2, không phải ghép nhiều góc.

| Hạng mục | Yêu cầu nhiếp ảnh |
|---|---|
| Kết cấu không gian | **Cùng một không gian** với bản vẽ bối cảnh gốc. Kết cấu công trình/bài trí nội thất/vị trí vật dụng về nguyên tắc không đổi — thứ thay đổi là tiêu cự/thời khắc/thời tiết |
| Tiêu cự | Theo loại biến thể (toàn cảnh góc rộng → 近景细节), dùng 24mm/35mm/50mm/85mm |
| Trường ảnh | Toàn cảnh góc rộng → trường ảnh sâu f/8-f/11; 中景 → trường ảnh nông vừa phải f/4-f/5.6; 近景细节 → trường ảnh nông f/2.8 |
| Nguồn sáng | Đến từ ánh sáng thật — thời khắc ứng với độ cao và nhiệt độ màu của mặt trời, thời tiết ứng với tán xạ khí quyển và sự che chắn, trong nhà ứng với ánh sáng cửa sổ và đèn nhân tạo |
| Nhân vật | **Mọi biến thể đều nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người hay đường viền cơ thể người nào** |
| Tỉ lệ khung hình | Khổ rộng 16:9 hoặc 3:2, nhất quán với bản vẽ bối cảnh gốc |
| Màu sắc | Do nhiệt độ màu của nguồn sáng thật dẫn dắt, không áp filter |

---

## 6. Khuôn mẫu prompt

### Biến thể tiêu cự

ảnh phái sinh bối cảnh đô thị người thật，cùng một không gian với bối cảnh gốc {tên bối cảnh}，một tấm ảnh không gian tĩnh vật duy nhất，không render 3D không CG，
{toàn cảnh góc rộng/标准全景/中景聚焦/近景细节}，{24mm/35mm/50mm/85mm}，
giữ nguyên kết cấu không gian, vị trí bài trí, logic nguồn sáng của bối cảnh gốc，
{mô tả tiêu cự}，{mô tả trường ảnh}，{mô tả khu vực bố cục tập trung vào}，
{thời khắc + thời tiết}，{mô tả hành xử của ánh sáng}，
không gian không người — nghiêm cấm xuất hiện bất kỳ nhân vật bóng người đường viền cơ thể người nào，
chất lượng ảnh chụp thật、chất nhiếp ảnh full-frame 35mm、ảnh chụp không gian một tấm duy nhất

### Biến thể thời khắc

ảnh phái sinh bối cảnh đô thị người thật，cùng một không gian với bối cảnh gốc {tên bối cảnh}，
cùng vị trí máy、cùng tiêu cự、chỉ đổi thời khắc — từ thời khắc gốc đổi thành {thời khắc mới}，
giữ nguyên hoàn toàn kết cấu không gian, vị trí vật dụng，
{ánh sáng của thời khắc mới: hướng ánh sáng, nhiệt độ màu, cường độ}，
{cảm xúc không gian của thời khắc mới: tĩnh mịch/ấm áp/cô độc/thi vị}，
{thay đổi về việc bật tắt và độ sáng của nguồn sáng nhân tạo}，
không gian không người — nghiêm cấm xuất hiện bất kỳ nhân vật bóng người đường viền cơ thể người nào，
chất lượng ảnh chụp thật、ảnh chụp không gian một tấm duy nhất

### Biến thể thời tiết

ảnh phái sinh bối cảnh đô thị người thật，cùng một không gian với bối cảnh gốc {tên bối cảnh}，
cùng vị trí máy、cùng tiêu cự、cùng thời khắc — chỉ đổi thời tiết thành {thời tiết mới}，
giữ nguyên hoàn toàn kết cấu không gian, vị trí vật dụng，
{đặc trưng thị giác của thời tiết mới: sợi mưa/tuyết/sương/mặt đất ướt/vệt mưa}，
{thay đổi thật trên bề mặt vật liệu do thời tiết gây ra: màng nước trên kim loại/vệt mưa trên kính/nước đọng phản chiếu trên mặt đất/cây cối đọng nước/tuyết đọng}，
{chuyển biến cảm xúc do thời tiết mang lại}，
không gian không người — nghiêm cấm xuất hiện bất kỳ nhân vật bóng người đường viền cơ thể người nào，
chất lượng ảnh chụp thật、ảnh chụp không gian một tấm duy nhất

> **Hướng dẫn sử dụng**: biến thể tiêu cự, biến thể thời khắc và biến thể thời tiết có thể dùng riêng lẻ hoặc kết hợp (ví dụ "xế chiều + mưa nhỏ + 中景"). Chiều nào không liên quan thì lược bỏ trường tương ứng trong prompt đó.

### Prompt né tránh (negative prompt)

3D render, 3D modeling, CGI, Unreal Engine, Blender, PBR material, volumetric lighting, ambient occlusion, ray tracing, game engine, cartoon, anime, 2D, illustration, hand drawn, painting,
four views, grid layout, 2x2, turnaround, orthographic view, blueprint, multiple angles,
showroom, brand new, pristine, perfect, unrealistically clean, sterile, empty without reason,
people, person, human figure, silhouette, shadow figure, body, crowd,
dramatic sky replacement, unrealistic sky, composite, fake weather, Photoshop effect, filter effect,
古风, 古代, 仙侠, 武侠, 民国, 赛博朋克, 科幻, 西方奇幻, 中世纪, 异世界, 非中国城市,
text, watermark, signature, logo, border, frame, UI element, HUD

---

## 7. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Kết cấu không gian của bối cảnh bắt buộc giữ được khả năng nhận diện ở mọi biến thể phái sinh — cùng một chỗ, không được biến thành một chỗ khác |
| R2 | Nguồn sáng của biến thể thời khắc bắt buộc đúng vật lý thật — góc cao mặt trời quyết định nhiệt độ màu và độ dài bóng đổ, nguồn sáng nhân tạo bật tắt theo logic |
| R3 | Biến thể thời tiết bắt buộc thích ứng đồng bộ với các thay đổi vật lý thật trên bề mặt vật liệu — vệt mưa trên kính/nước đọng phản chiếu trên mặt đất/cây cối đọng nước/tuyết đọng |
| R4 | Bắt buộc là **một tấm** ảnh toàn cảnh duy nhất — một hướng nhìn, không phải bốn hướng nhìn 2×2, không phải nhiều góc, không phải turnaround |
| R5 | Bắt buộc tuyên bố nguồn gốc ánh sáng — ánh sáng đến từ đâu, nhiệt độ màu bao nhiêu, nguồn sáng loại gì — không được là chiếu sáng toàn cục không rõ xuất xứ |
| R6 | Bắt buộc giữ dấu vết sử dụng của không gian gốc — phái sinh theo thời khắc và thời tiết không được "rửa sạch" độ mòn và cảm giác năm tháng của không gian |
| R7 | **Mọi biến thể đều nghiêm cấm xuất hiện bất kỳ nhân vật, bóng người hay đường viền cơ thể người nào** |
| R8 | Bắt buộc tuyên bố neo cốt lõi "chụp thật người thật + không render 3D không CG" |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Nghiêm cấm để kết cấu không gian biến đổi tới mức không nhận ra được — đổi thời khắc/thời tiết/tiêu cự không được thành "đổi chỗ" |
| X2 | Nghiêm cấm "render 3D / dựng mô hình 3D / CG / UE engine / Blender / vật liệu PBR / ánh sáng thể tích / AO" và mọi thuật ngữ CG khác |
| X3 | Nghiêm cấm "vẽ tay 2D / minh họa / hoạt hình / anime" và các phương tiện phi nhiếp ảnh khác |
| X4 | Nghiêm cấm "bốn hướng nhìn / lưới 2×2 / nhiều góc / turnaround / orthographic view / blueprint" — chỉ một tấm duy nhất |
| X5 | Nghiêm cấm "cổ phong/thời cổ/tiên hiệp/võ hiệp/Dân Quốc/cyberpunk/khoa học viễn tưởng/kỳ ảo phương Tây/dị giới" và các bối cảnh phi đô thị đương đại khác |
| X6 | Nghiêm cấm "xuất hiện bất kỳ nhân vật/bóng người/đường viền cơ thể người/bóng đen hình người/chi thể nào" |
| X7 | Nghiêm cấm "thay trời kiểu dán texture bầu trời/cảm giác ghép PS/áp filter" — thay đổi thời tiết bắt buộc là thay đổi quang học và môi trường có thật |
| X8 | Nghiêm cấm "nguồn sáng không rõ xuất xứ/chiếu sáng đều toàn cục không có hướng" |
| X9 | Nghiêm cấm "biến thể thời khắc mà không chỉnh việc bật tắt và độ sáng của nguồn sáng nhân tạo" — chập tối bắt buộc phải lên đèn, đêm khuya không được sáng hết |
| X10 | Nghiêm cấm "biến thể thời tiết xóa mất dấu vết sử dụng thường ngày của không gian" — bức tường sau mưa vẫn loang lổ, mặt đất dưới tuyết vẫn mòn |
| X11 | Nghiêm cấm "cháy sáng trắng bệch/vùng tối đen chết/không có lớp lang" |
| X12 | Nghiêm cấm "watermark / chữ / LOGO / chữ ký / viền / dấu vết sinh bằng AI" |
