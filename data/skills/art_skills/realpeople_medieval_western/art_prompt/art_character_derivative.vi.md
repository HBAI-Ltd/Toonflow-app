# Sinh asset phái sinh nhân vật · Sổ tay ràng buộc Sử thi trung cổ

---

## 1. Nguyên tắc lớp phủ

1. **Mặt không đổi** — ngũ quan sau phủ phải khớp hoàn toàn bản gốc; cấm trôi mặt
2. **Dáng không đổi** — giữ dáng đứng tự nhiên của bản gốc; cấm mọi thay đổi tư thế / động tác
3. **Kiểm soát từng lớp** — mỗi lớp mô tả độc lập, thay được theo lớp (đổi giáp không đổi tóc)
4. **Thống nhất phong cách** — mọi phần phục trang tuân cùng một thẩm mỹ trung cổ
5. **Chất liệu không giảm** — chuẩn chất sau phủ không thấp hơn bản gốc
6. **Chỉ phạm vi phục trang** — chỉ phủ trạng thái / tóc / y phục / phụ kiện; không đạo cụ, bối cảnh, môi trường, động tác
7. **An toàn reference** — asset phái sinh được tái dùng làm reference generation; tuyệt đối không máu tươi hay vết thương hở ở bất kỳ lớp nào (S1)

---

## 2. Tầng lớp phủ

| Tầng | Nội dung | Ghi chú |
|---|---|---|
| L0 | Bản gốc | Hình gốc, không sửa |
| L1 | Trạng thái (tầng quyết định) | Phân tích manh mối người dùng trước, rồi quyết cường độ: chỉnh tề / dặm trường / trận mạc |
| L2 | Tạo kiểu tóc | Bím, buộc, kiểu thời đại + phụ kiện khiêm tốn |
| L3 | Lớp trong | Áo lanh / lớp len trong thay lớp nền trơn |
| L4 | Lớp ngoài | Tunic / gambeson / giáp xích / brigandine / áo choàng / váy dài |
| L5 | Phụ kiện | Thắt lưng, đai kiếm (vỏ kiếm rỗng được tính là phục trang), huy chương phường hội, trâm cài, găng, viền lông thú |

> **Ranh giới phạm vi**: asset phái sinh nhân vật chỉ gồm L0–L5 (phục trang). Vật cầm tay (vũ khí tuốt trần, đuốc, bản đồ), môi trường bối cảnh, thời tiết, và thay đổi tư thế/động tác thuộc loại asset khác.

---

## 3. Ràng buộc trạng thái (L1)

### Chiến lược từ bản gốc sang trạng thái phái sinh (then chốt)

> Bản gốc là trạng thái trung tính, nhưng asset phái sinh mặc định đi qua bước trạng thái. Phân tích manh mối của người dùng và chọn cường độ giữa chỉnh tề, dặm trường, trận mạc.

### Phân tích manh mối và quyết định L1

| Bước | Xử lý | Kết quả |
|---|---|---|
| A1 | Trích manh mối: từ trạng thái, từ cảm xúc, từ gian khổ | Tóm tắt nhu cầu trạng thái |
| A2 | Lọc manh mối không thuộc trạng thái: từ đạo cụ / cảnh / động tác không làm căn cứ | Chống đọc nhầm |
| A3 | Khớp ma trận trạng thái, chọn mức | chỉnh tề / dặm trường / trận mạc |
| A4 | Sinh prompt L1 cuối | Chỉ xuất kết luận, không xuất phân tích |

### Ánh xạ manh mối → trạng thái

| Loại manh mối | Manh mối điển hình | Quyết định L1 |
|---|---|---|
| Không có manh mối gian khổ | Chỉ yêu cầu đổi y phục/tóc | chỉnh tề |
| Manh mối hành trình | Trên đường, trại rừng, mưa, cưỡi ngựa dài ngày | dặm trường |
| Manh mối chinh chiến | Sau trận, công thành, truy đuổi dài, lưu đày | trận mạc (vẫn tuyệt đối không vết thương tươi — đọc qua bụi, bùn khô, gấu áo rách, mệt mỏi) |
| Manh mối cung đình | Yến tiệc, yết kiến lãnh chúa, nghi lễ phường hội | chỉnh tề (trang trọng) |

### Ma trận trạng thái

| Trạng thái | Da & mặt | Bề mặt trang phục | Prompt |
|---|---|---|---|
| Chỉnh tề | Sạch, tỉnh táo, tóc chải | Y phục chải phẳng, dây đai ngay ngắn | well-kept, freshly brushed wool |
| Dặm trường | Bụi trên gò má, tóc rối gió | Bùn ở gấu, vai ẩm, bụi đường | travel-worn, road dust, mud-caked hem |
| Trận mạc | Mệt sâu, cáu bẩn, môi nứt, sẹo lành cũ hiện rõ | Mép rách, vết cháy xém, khớp móp, thép xỉn | campaign-worn, battle-worn gear, dented fittings, dulled steel |

> **Cấm cứng ở mọi trạng thái**: vết máu tươi, vết thương hở, băng thấm đỏ. Gian khổ đọc qua bụi bẩn, hư hại trang bị và mệt mỏi trên mặt.

---

## 4. Ràng buộc tạo kiểu tóc (L2)

| Kiểu | Mô tả | Hợp | Prompt |
|---|---|---|---|
| Buông tự nhiên | Tóc xõa, gió thổi rối | Hành trình, trại | natural loose hair, weather-tousled |
| Buộc sau | Dây da đơn giản, thực dụng | Săn, lao động | tied back with leather cord |
| Tết bím | Bím đơn/đôi, kiểu chiến binh hoặc quý tộc | Trận mạc, nghi lễ | braided hair, warrior braids |
| Búi cài | Cuộn hoặc ghim, trâm kim loại khiêm tốn | Cung đình, yến tiệc | coiled braids, modest silver pins |
| Cắt ngắn thô | Cắt gọn thực dụng | Lính, thợ | rough-cropped hair |

Râu theo cùng logic: lởm chởm (hành trình) → tỉa gọn (cung đình) → bết (trận mạc).

---

## 5. Ràng buộc y phục (L3+L4)

### Ma trận y phục theo thân phận và dịp

| Hướng | Món | Hợp | Prompt |
|---|---|---|---|
| Thường dân | Tunic len, mũ trùm, áo choàng vá | Làng, quán rượu | coarse wool tunic, patched cloak |
| Thợ săn dã chiến | Jerkin da, lớp len, áo choàng chống thời tiết, bao tay da | Săn, hành trình | leather jerkin, weathered cloak, leather bracers |
| Bộ lính | Gambeson, áo giáp xích, surcoat gia huy | Hành quân, đồn trú | padded gambeson, riveted mail, worn surcoat |
| Giáp hiệp sĩ | Giáp tấm vừa người phủ xích, surcoat gia huy, đai kiếm | Trận, đấu thương | fitted steel plate, heraldic surcoat, dulled steel |
| Lễ phục quý tộc | Váy/doublet len mịn, viền lông, nhuộm đậm trầm | Cung đình, yến tiệc | fine wool doublet, fur-trimmed, deep subdued dye |
| Nghi lễ phường hội | Màu phường hội, huy chương thợ săn, áo choàng lễ | Nghi thức hội quán | guild colors, hunter's medallion, formal cloak |

### Ràng buộc y phục chung

| Mục | Ràng buộc | Prompt |
|---|---|---|
| Màu | Nhuộm tự nhiên, bão hòa thấp, theo bảng C1–C7 | natural dye tones, muted colors |
| Vải | Thấy thớ sợi thật: dệt len, gân lanh, gân da, lông thú | visible wool weave, leather grain |
| Độ mòn | Mọi món có dấu mặc: nếp gấp, hằn dây đai, điểm tiếp xúc bóng mòn | worn creases, strap marks |
| Lớp | Phân lớp trung cổ rõ, không chồng chất | clear layering, practical fit |

---

## 6. Ràng buộc phụ kiện (L5)

| Loại | Ràng buộc | Prompt |
|---|---|---|
| Thắt lưng | Da mòn, khóa sắt hoặc đồng thau, móc treo dụng cụ | worn leather belt, iron buckle |
| Dấu hiệu phường hội | Huy chương thợ săn, phù hiệu hội — chỉ huy hiệu thế tục | hunter's guild medallion |
| Trang sức | Món thời đại khiêm tốn: trâm, nhẫn, vòng; không đá quý bóng | simple brooch, worn silver ring |
| Găng & bao tay | Da lao động, trầy | scuffed leather gloves |
| Đai kiếm | Đai và vỏ kiếm rỗng tính là phục trang; vũ khí là asset đạo cụ | sword belt with scabbard |
| Cấm | Biểu tượng tôn giáo (thánh giá, tràng hạt, đồ tu sĩ), đồ hiện đại, chi tiết phát sáng | — |

---

## 7. Bảng tra nhanh phối phục trang

| Tình huống | L1 trạng thái | L2 tóc | L3+L4 y phục | L5 phụ kiện |
|---|---|---|---|---|
| Thường nhật làng | chỉnh tề | buông / buộc | thường dân | thắt lưng mòn |
| Xuất phát đi săn | chỉnh tề → dặm trường | buộc / bím | thợ săn dã chiến | bao tay, huy chương |
| Truy đuổi dài / lưu đày | dặm trường | rối gió | thợ săn dã chiến, hư hại | tối giản |
| Sau trận | trận mạc | bết, rối | bộ lính / giáp, móp | trầy, đai rách |
| Nghi lễ phường hội | chỉnh tề (trang trọng) | bím / búi | lễ nghi phường hội | huy chương, áo choàng lễ |
| Yết kiến cung đình | chỉnh tề (trang trọng) | búi cài | lễ phục quý tộc | trâm, viền lông |

> **🔍 Quy tắc suy luận cho tình huống chưa phủ**
>
> Khi tình huống người dùng không có trong bảng, suy từ gen phong cách:
>
> | Chiều | Gen sử thi trung cổ |
> |---|---|
> | Cường độ trạng thái | Mặc định chỉnh tề; đường/rừng/mưa → dặm trường; trận/công thành/lưu đày → trận mạc (không bao giờ vết thương tươi) |
> | Tóc | Thực dụng dã ngoại, bím cho nghi lễ, bết cho trận mạc |
> | Y phục | Thân phận quyết chất; dịp quyết độ trang trọng; vải luôn thật và có dấu mặc |
> | Phụ kiện | Dã ngoại ít, dấu hội cho nghi thức, trang sức khiêm tốn nơi cung đình; không bao giờ tôn giáo, không bao giờ phát sáng |
> | Chuẩn chất | Neo nhiếp ảnh người thật; lỗ chân lông + thớ vải luôn giữ; cấm nhựa, cấm CG |

---

## 8. Quy cách bản vẽ bốn hướng nhìn

### Định nghĩa hướng nhìn

| Vị trí | Hướng nhìn | Góc | Khuôn hình | Yêu cầu | Prompt |
|---|---|---|---|---|---|
| Trái nhất | Chân dung cận | Chính diện ngang mắt | Mặt tới quai xanh | Mặt 60%+, ngũ quan / trạng thái rõ | portrait closeup, face detail |
| Trái 2 | Chính diện | Trước 0° | Toàn thân | Toàn cảnh mặt trước trang phục | front view |
| Phải 2 | Nhìn nghiêng | Phải 90° | Toàn thân | Bóng nghiêng, lớp trang phục bên | side view, profile |
| Phải nhất | Nhìn sau | Sau 180° | Toàn thân | Tóc sau, lưng áo choàng, dây đai rõ | back view, rear view |

### Quy cách khung hình

| Mục | Ràng buộc |
|---|---|
| Bố cục | Bốn hướng xếp cạnh nhau trái sang phải, một khung |
| Nền | Xám trung tính tinh khiết #E8E8E8 |
| Dáng | Đứng tự nhiên, chân hơi mở, tay buông |
| Biểu cảm | Vi biểu cảm khớp trạng thái, chỉ trên mặt |
| Sáng | Dịu đều, key trước + fill hai bên, không bóng gắt |
| Nhất quán | Mặt / trạng thái / tóc / y phục / phụ kiện giống hệt giữa các hướng |
| Tỷ lệ | Khuyến nghị 4:1 hoặc 3:1 |

---

## 9. Mẫu prompt

### Ràng buộc định dạng đầu ra

| Mục | Ràng buộc |
|---|---|
| Đầu ra | **Chỉ văn bản prompt**, không gì khác |
| Cấm xuất | Bảng tra, phương án phân lớp, bảng ràng buộc, danh mục cấm, phương án biến thể, gợi ý — mọi nội dung phi prompt |
| Cấm cảnh | Phái sinh nhân vật **không chứa mô tả cảnh / môi trường / thời tiết / nền tự sự** |
| Cấm đạo cụ | **Không tương tác đạo cụ** — không vũ khí tuốt trần, đuốc, bản đồ, cốc hay vật cầm |
| Cấm đổi dáng | **Giữ nguyên dáng gốc** — không đi / quay người / giơ tay / mọi động tác |
| Định dạng | Xuất thẳng khối prompt dùng được; không tiêu đề, bảng, giải thích, so sánh |

### Phủ phục trang đầy đủ (bốn hướng nhìn)

```
Lấy hình nhân vật gốc làm nền, img2img phủ phục trang,
bản vẽ bốn hướng nhìn nhân vật trung cổ {giới tính hoặc loại sinh vật}, live-action photography, period drama realism, tương phản mạnh, chi tiết tối đa, 8K,
character design sheet, character turnaround,
giữ nguyên mặt bản gốc, {khí chất tổng thể},
[L1 · trạng thái] quyết từ manh mối người dùng: {chỉnh tề / dặm trường / trận mạc}; {mô tả bề mặt trạng thái}, chỉ bề mặt phong hóa sạch,
[L2 · tóc] {tạo kiểu}, individual hair strands, {mô tả phụ kiện},
[L3+L4 · y phục] {màu}{món}, {vải}, thấy thớ dệt và gân da, nếp mặc mòn, {mô tả độ mòn},
[L5 · phụ kiện] {thắt lưng}, {dấu hội}, {trang sức}, {găng/bao tay},
xếp cạnh nhau trái sang phải một khung: portrait closeup + front view + side view + back view,
đứng tự nhiên, nền xám trung tính tinh khiết, sáng dịu đều, không bóng gắt,
bốn hướng nhất quán, dựng mặt tinh tế, dựng tóc tinh tế, chất vải siêu rõ
trong hình không có bất kỳ chữ nào
```

---

## 10. Quy tắc ràng buộc

### Bắt buộc

| Mã | Quy tắc |
|---|---|
| R1 | Mặt sau phủ phải khớp bản gốc |
| R2 | Y phục phải dùng "thấy thớ dệt và gân da + chất vải siêu rõ" |
| R3 | Trạng thái / tóc / y phục / phụ kiện thống nhất phong cách |
| R4 | Phải xuất bản vẽ bốn hướng (chân dung + trước + nghiêng + sau) |
| R5 | Phải chỉ định "nền xám trung tính tinh khiết" |
| R6 | Phải chỉ định "bốn hướng nhất quán" |
| R7 | **Chỉ prompt** — không bảng / phương án / ràng buộc / gợi ý trong đầu ra |
| R8 | **Không mô tả cảnh** trong phái sinh nhân vật |
| R9 | **Không tương tác đạo cụ** — không vật cầm (vũ khí trần, đuốc, bản đồ, cốc) |
| R10 | **Dáng không đổi** — giữ dáng đứng tự nhiên của bản gốc |
| R11 | **L1 phân tích trước khi quyết** — đọc manh mối gian khổ, rồi chọn chỉnh tề / dặm trường / trận mạc |
| R12 | **Mọi phái sinh đều mang trạng thái** — bình thường không để trung tính trơn; tối thiểu trạng thái "chỉnh tề" |
| R13 | **An toàn reference** — không máu tươi / vết thương hở ở bất kỳ lớp hay trạng thái nào |

### Nghiêm cấm

| Mã | Nghiêm cấm |
|---|---|
| X1 | Trôi mặt sau phủ |
| X2 | Chải chuốt hay y phục hiện đại |
| X3 | Trạng thái / y phục xung đột nhau |
| X4 | Nền cảnh phức tạp (phải nền xám trơn) |
| X5 | Bốn hướng phục trang không nhất quán |
| X6 | Xuất bất cứ gì ngoài prompt |
| X7 | Mô tả cảnh trong phái sinh nhân vật |
| X8 | Các mục "tra nhanh", "phương án lớp", "ràng buộc", "biến thể" trong đầu ra |
| X9 | Tương tác đạo cụ (vũ khí trần, đuốc, bản đồ, cốc) |
| X10 | Đổi dáng (đi, quay, giơ tay, quỳ) |
| X11 | Mô tả tự sự gắn biểu cảm với động tác |
| X12 | Áp trạng thái cố định mà không phân tích manh mối |
| X13 | Vết thương tươi, máu, băng thấm ở bất kỳ lớp nào |
| X14 | Biểu tượng tôn giáo hay y phục tu sĩ |
| X15 | Chi tiết phát sáng / neon / bóng bẩy high-fantasy |
