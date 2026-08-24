---
name: storyboard_table_techniques
description: >-
  Tham chiếu kỹ pháp chung cho bảng phân cảnh.
  Bao quát các kỹ pháp chung của việc thiết kế phân cảnh — nguyên tắc tách phân cảnh, quy tắc về cú máy định cảnh và gộp cú máy, luật thép về liền mạch thị giác, hướng dẫn điền trường, quy tắc chuyển cảnh… — để Agent kích hoạt và dùng.
---
# Kỹ pháp chung cho bảng phân cảnh

Tài liệu này là tham chiếu kỹ pháp chung cho việc thiết kế bảng phân cảnh, áp dụng cho mọi tình huống Agent cần dựng bảng phân cảnh.

---

## Nguyên tắc tách phân cảnh

**Mở phân cảnh mới khi**: đổi bối cảnh/địa điểm, nhảy thời gian, đổi chủ thể của cú máy, cỡ cảnh thay đổi rõ rệt, tới nút hành động quan trọng

**Không cần mở mới khi**: đối thoại liên tục trong cùng một khung hình, biểu cảm biến đổi nhẹ hay động tác nhỏ

Độ mịn: một khung hình độc lập = một phân cảnh, khoảng mỗi 70~140 chữ kịch bản tương ứng 1~2 phân cảnh. Phần chuyển tiếp/chuyển cảnh nếu có mô tả rõ ràng thì cũng tách riêng.

---

## Quy tắc về cú máy định cảnh và gộp cú máy (chống thừa)

**Cú máy định cảnh**: việc định cảnh cho mỗi bối cảnh/đoạn mới hoàn tất trong tối đa 1~2 cú máy, cấm tách thành từ 3 mảnh trở lên.
- Cách nên làm: 1 viễn cảnh có đẩy chậm (định cảnh + đưa chủ thể vào gọn trong một cú), hoặc 1 đại viễn cảnh định cảnh + 1 toàn cảnh đưa chủ thể vào
- Cách cấm làm: kiểu ba đoạn thừa thãi là quay cảnh không người trước → rồi chi tiết cục bộ → rồi nhân vật đi tới

**Tự kiểm việc gộp cú máy**:
- Một cú nói được thì đừng tách hai — nếu một cú có chuyển động máy quay làm được cả định cảnh lẫn đưa chủ thể vào thì đừng tách thành hai
- Các cú máy liên tiếp mô tả những phần khác nhau của cùng một không gian (cổng viện → giàn dây leo → gian nhà bên) nên gộp thành một cú, dùng phần mô tả hình ảnh để bao quát nhiều lớp không gian
- Cú máy thuần trang trí (chỉ khoe chi tiết môi trường, không đẩy tự sự) nên gộp vào một cú có chức năng tự sự
- **Kiểm bằng tư duy đạo diễn**: viết xong tự kiểm —— nếu một đạo diễn người thật sẽ gộp 2~3 cú máy liền kề thành 1 mà quay, tức là bạn tách quá vụn, phải gộp lại

**Chiến lược một cú tới cùng**: khi giữa các cú máy liền kề có **hành động biến chuyển liên tục, bối cảnh đổi nhẹ (dịch chuyển trong cùng bối cảnh), hoặc góc quay đổi dần**, có thể ghi 「一镜到底」 trong `cameraMove` hoặc `description` để gộp nhiều cú máy vụn thành một cú dài với chuyển động máy quay liên tục.
- **Tình huống áp dụng**: nhân vật đi xuyên qua một không gian, bám theo hành động từ điểm A tới điểm B, vòng quanh nhân vật để khoe môi trường, định cảnh rồi đẩy chậm vào đặc tả chủ thể…
- **Cách ghi chú**: trong `cameraMove` ghi rõ đường đi của máy (như "一镜到底: đẩy chậm viễn cảnh → bám vào trong viện → dừng ở toàn cảnh"), trong `description` mô tả nội dung hình ảnh lúc mở khuôn và lúc đóng khuôn
- **Nới thời lượng**: cú một-cú-tới-cùng vì thông tin liên tục được làm mới nên có thể vượt trần 6s của một cú, nhưng không quá 12s
- **Cảnh báo rủi ro**: một-cú-tới-cùng làm tăng độ khó "quay số" khi sinh hình (đòi hỏi liền mạch cao), chỉ dùng khi lợi ích về sự trôi chảy của tự sự rõ ràng lớn hơn việc cắt vụn, không lạm dụng

**Quy tắc 6 giây vàng**: cú máy không thoại mà cộng dồn quá 6s vẫn chưa có thông tin mới (thoại/hành động/đổi chủ thể) thì sự chú ý của khán giả đứt gãy. Đặc biệt lưu ý với các cú định cảnh và chuyển tiếp, thà gộp lại nén lại chứ đừng lê thê

---

## Luật thép về liền mạch thị giác (tuân thủ suốt quá trình thiết kế phân cảnh)

**① Liền mạch hành động**: giữa các cú máy liền kề, vị trí, tiến độ hành động và hướng nhìn của nhân vật bắt buộc phải nhất quán về logic vật lý. Cú trước tay đưa lên lưng chừng → cú sau bắt buộc phải nối tiếp từ trạng thái lưng chừng đó, không được đột ngột rụt về.

**② Quy luật tiệm tiến của cỡ cảnh**: việc đổi cỡ cảnh tuân theo lối tụ dần hoặc mở dần ——
- Tụ dần: 远景→全景→中景→近景→特写 (cảm xúc siết lại)
- Mở dần: 特写→近景→中景→远景 (cảm xúc giải phóng)
- Cấm để các cú máy liên tiếp cùng cỡ cảnh mà không có lý do tự sự (từ 3 cú liên tiếp trở lên cùng cỡ cảnh = mệt mỏi thị giác)

**③ Bảo toàn trục nhìn**: nguyên tắc đường 180 độ —— trong cảnh đối thoại/đối đầu, vị trí của nhân vật trong khung hình cố định cùng một phía suốt phim, không được nhảy trục

**④ Logic không gian của hướng nhìn**: hai người đối thoại thì mặt hướng về nhau, người thao tác vật thì mặt hướng về vật, người nhìn xa thì mặt hướng ra xa. Cấm để mọi nhân vật đều hướng thẳng vào ống kính

**⑤ Ý thức kiểm soát thông tin**: mỗi cú máy đều phải ý thức "lúc này khán giả biết gì, chưa biết gì" ——
- Cho thấy tay mà không cho thấy mặt = nghi vấn; tiếng trước hình sau = kỳ vọng; chỉ cho thấy lưng = xa cách; phơi trọn diện mạo = trả xong cao trào

**⑥ Ràng buộc mật độ nhịp**: số lượng động tác/sự kiện trong một cú máy phải khớp với thời lượng, chống nhét quá nhiều nội dung ——
- 1 động tác vật lý = 1 nhịp, 1 lần chuyển động máy quay = 1 nhịp, 1 câu thoại ngắn (≤14 chữ) = 1 nhịp
- Cú máy 2~3s: tối đa 1 nhịp; cú máy 4~6s: tối đa 2 nhịp; cú máy 7s+: tối đa 3 nhịp

**⑦ Vùng an toàn đầu và cuối**: 0,5s đầu và 0,5s cuối của mỗi cú máy là vùng chuyển tiếp an toàn, không đặt hành động then chốt hay điểm khởi thoại vào đó. 0,5s đầu dùng để dựng môi trường hoặc cho chủ thể xuất hiện tĩnh, 0,5s cuối dùng để hành động khép lại tự nhiên.

---

## Hướng dẫn điền trường

**description** (Mô tả hình ảnh): một câu mô tả nội dung cốt lõi của khung hình (20~70 chữ), gồm **chủ thể + hành động/trạng thái + không gian môi trường** nhìn thấy được, không viết hoạt động tâm lý. Phải thể hiện được lớp lang không gian (dính ít nhất hai lớp trong tiền cảnh/trung cảnh/hậu cảnh). Như "tiền cảnh rèm the khẽ lay, trung cảnh xe ngựa hầu phủ tới trước viện hoang trên núi Lạc Nhạn", "vú Thành nhảy xuống xe ngựa, đưa mắt nhìn khu viện đổ nát, xa xa rặng núi chìm vào bóng chiều"

> **🚫 Cấm mô tả ánh sáng/tông màu**: description cùng mọi trường khác đều **không được** xuất hiện các từ về ánh sáng như `ánh sáng`/`bóng đổ`/`nhiệt độ màu`/`tông màu`/`tông ấm`/`tông lạnh`/`ngược sáng`/`sáng tối`/`tương phản cao`. Ánh sáng hoàn toàn do ảnh tài nguyên bối cảnh mà cú máy đó trích dẫn tự đảm nhiệm —— nhu cầu ánh sáng đặc biệt như cảnh đêm/trời mưa/ánh lửa xin thể hiện bằng cách trích dẫn **phái sinh bối cảnh** tương ứng (bản cảnh đêm/bản trời mưa/bản ánh lửa). Như trong ví dụ, cụm "dưới ánh tà dương" cũng là vi phạm, phải xóa đi.

**shotSize** (Cỡ cảnh):

| Cỡ cảnh | Diễn giải | Ngữ nghĩa tự sự |
|------|------|---------|
| 大远景 | Toàn cảnh môi trường | Định cảnh / cô độc / nhỏ bé |
| 远景 | Quan hệ giữa bối cảnh và nhân vật | Quan hệ không gian / tô không khí |
| 全景 | Toàn thân nhân vật cùng môi trường | Nhân vật ra mắt / phô toàn thân |
| 中景 | Từ đầu gối trở lên | Tự sự thường ngày / đối thoại |
| 近景 | Từ ngực trở lên | Truyền cảm xúc / trọng tâm đối thoại |
| 特写 | Gương mặt hoặc một phần vật thể | Nhấn cảm xúc / đạo cụ then chốt |
| 大特写 | Cục bộ đến cùng cực | Bom cảm xúc / khoảnh khắc quyết định (dùng thận trọng, cả phim 2~3 lần) |

**cameraMove** (Chuyển động máy quay): không có chuyển động thì điền `静止`. Chuyển động máy quay phải ghi rõ hướng điểm đầu và điểm cuối.

| Chuyển động máy quay | Diễn giải | Ngữ nghĩa tự sự |
|------|------|---------|
| 推 | Từ xa vào gần, nhấn chủ thể | Cảm xúc dâng dần / phát hiện / rình xem |
| 拉 | Từ gần ra xa, khoe môi trường | Cảm xúc rút ra / phơi trọn diện mạo / ly biệt |
| 摇 | Đứng yên một chỗ mà xoay quét | Giao đãi môi trường / tìm kiếm |
| 移 | Di chuyển theo chủ thể | Đồng hành / bám theo |
| 俯拍 | Từ trên xuống | Đứng ngoài quan sát / nhỏ bé / toàn cục |
| 仰拍 | Từ dưới lên | Anh hùng hóa / uy áp |

**action** (Hành động nhân vật): mô tả cụ thể động tác của nhân vật/chủ thể trong khung hình (8~55 chữ), không có động tác nhân vật thì điền `空镜`. Định dạng là `(ghi chú nối tiếp)mô tả hành động`. Yêu cầu:
- **Ghi chú nối tiếp đặt ở đầu**: bọc bằng ngoặc đơn nửa chiều, đặt trước phần mô tả hành động. Cú đầu tiên ghi `(开篇)`; các cú khác ghi `(承接上镜:động tác nối)`, như `(承接上镜:đẩy chậm dừng khuôn ~ nhóm người đứng hình)`, `(承接上镜:cánh tay đang nâng nửa chừng → tiếp tục đưa lên)`
- **Cách viết chuỗi hành động**: viết chuỗi động tác vật lý liên tục + nhịp tốc độ ("từ từ nâng tay phải lên → đầu ngón khẽ run → siết chặt nắm đấm"), cấm chỉ viết trạng thái cuối tĩnh. Nhiều nhân vật thì động tác từng người ngăn bằng `;`, xếp theo thứ tự tên tài nguyên liên quan, như `黎雾 tay phải vuốt ve cổ tay áo → cánh tay trái ôm con thỏ bông vào lòng;聂薇 ánh mắt khóa chặt về phía con thỏ`
- **Cột này không viết hướng nhìn/quan hệ không gian nữa**: hướng nhìn và quan hệ không gian đã tách thành cột riêng (`orientation` / `spatialRelation`), không ghi lặp trong action, để tránh dấu `|` xung khắc với dấu ngăn cột của bảng markdown

**orientation** (Hướng nhìn): cột riêng, ghi chú hướng mặt của nhân vật trong khung hình. Định dạng:
- Nhiều nhân vật thì liệt kê theo thứ tự `associateAssetsNames`, ngăn bằng `;`: `角色A-3/4正面朝右;角色B-3/4正面朝左`
- Một nhân vật thì có thể bỏ tên: `面朝右`
- Cảnh không người và đặc tả vật thể thuần thì điền `—`
- Hướng nhìn phải tuân thủ quy tắc trục nhìn 180° (khóa trong cùng một bối cảnh, muốn đổi thì phải nêu động tác nối kiểu xoay người/quay đầu trong `action` và cập nhật đồng bộ cột này), các giá trị cụ thể xem bảng tham chiếu hướng nhìn bên dưới

**spatialRelation** (Quan hệ không gian): cột riêng, vị trí tương đối của từng nhân vật trong khung hình nhiều nhân vật. Định dạng:
- Liệt kê theo thứ tự `associateAssetsNames`, ngăn bằng `、`: `角色A(vị trí)、角色B(vị trí)`
- Các giá trị vị trí xem bảng tham chiếu quan hệ không gian bên dưới (9 vị trí)
- Cú máy một nhân vật có thể chỉ điền một mục `nhân vật(vị trí)` hoặc điền `—`; đặc tả vật thể thuần, cảnh không người thì điền `—`
- Phải tự nhất quán với hướng nhìn, cỡ cảnh, chuyển động máy quay (nhân vật quay mặt sang phải thì mục tiêu nhìn/tương tác của họ phải nằm ở vị trí bên phải họ); các nhân vật cùng cảnh cùng nhóm phải có vị trí ổn định, muốn đổi chỗ thì phải nêu động tác nối trong `action` và cập nhật đồng bộ cột này

**Ví dụ đầy đủ các trường** (nhóm 5 người):
- `action`: `(开篇)viễn cảnh từ từ đẩy về phía đám người, năm người đứng thưa —— 黎雾 hơi lệch trái, tay trái khuỳnh ôm con thỏ bông;聂薇 ánh mắt bị mảng trắng ấy hút lấy`
- `orientation`: `黎雾-3/4正面朝右;聂薇-3/4正面朝左;何存羽-3/4正面朝左;秋瞳-3/4正面朝左;安娜-正面`
- `spatialRelation`: `黎雾(左前)、安娜(右前)、聂薇(左后)、何存羽(中后)、秋瞳(右后)`

**Bảng tham chiếu hướng nhìn** (dùng để điền cột orientation):

| Giá trị hướng nhìn | Ý nghĩa | Tình huống điển hình |
|---------|------|---------|
| 面朝右 | Mặt hướng ngang về phía phải khung hình | Nhân vật ở bên trái đường 180°, hoặc hướng về mục tiêu bên phải |
| 面朝左 | Mặt hướng ngang về phía trái khung hình | Nhân vật ở bên phải đường 180°, hoặc hướng về mục tiêu bên trái |
| 正面 | Đối diện thẳng ống kính | Tự bạch, tuyên ngôn, nhìn thẳng khán giả |
| 3/4正面朝右 | Ba phần tư chính diện chếch phải về phía ống kính | Chủ thể đối thoại (nhân vật lệch trái khung) |
| 3/4正面朝左 | Ba phần tư chính diện chếch trái về phía ống kính | Chủ thể đối thoại (nhân vật lệch phải khung) |
| 正侧面朝右 | Đường nét chính diện nghiêng hướng phải | Độc thoại, trầm tư |
| 正侧面朝左 | Đường nét chính diện nghiêng hướng trái | Độc thoại, trầm tư |
| 3/4背面朝右 | Ba phần tư mặt lưng chếch phải | Xa cách, rời đi |
| 3/4背面朝左 | Ba phần tư mặt lưng chếch trái | Xa cách, rời đi |
| 背面 | Quay lưng vào ống kính | Ra mắt bí ẩn, ly biệt, nhìn về xa |

> Có thể thêm phần bổ nghĩa ngẩng/cúi: `面朝右微仰头`, `3/4正面朝左微低头`.

**Bảng tham chiếu quan hệ không gian** (dùng để điền cột spatialRelation, cảnh nhiều nhân vật bắt buộc ghi):

Khung hình được chia thành lưới vị trí 3×3 gồm ba cột 「trái/giữa/phải」 × ba lớp 「trước/giữa/sau」, trước = gần ống kính/lớp tiền cảnh, sau = xa ống kính/lớp hậu cảnh; trước/sau cũng có thể diễn đạt chênh lệch cao thấp (như khi chụp từ trên xuống thì người quỳ chiếm 「中前」, người đứng gây áp lực chiếm 「中后」).

| Giá trị vị trí | Ý nghĩa | Cách dùng điển hình |
|---------|------|---------|
| 左前 | Bên trái khung, gần ống kính | Chủ thể lệch tiền cảnh trái, thường là bên lên tiếng chủ đạo |
| 中前 | Giữa khung, gần ống kính | Một chủ thể duy nhất ở giữa, hoặc nhân vật bị tiền cảnh che nửa người |
| 右前 | Bên phải khung, gần ống kính | Chủ thể lệch tiền cảnh phải |
| 左中 | Bên trái khung, lớp trung cảnh | Vị trí trái ở dải giữa của nhóm người |
| 中中 | Chính giữa khung, lớp trung cảnh | Chủ thể cốt lõi ở giữa, người chủ đạo cuộc đối thoại |
| 右中 | Bên phải khung, lớp trung cảnh | Vị trí phải ở dải giữa của nhóm người |
| 左后 | Bên trái khung, lùi về sau (hậu cảnh) | Vị trí trái hàng sau, người đi kèm |
| 中后 | Giữa khung, lùi về sau | Giữa hàng sau, bị tiền cảnh che hoặc đứng ở thế cao |
| 右后 | Bên phải khung, lùi về sau | Vị trí phải hàng sau, người đứng xem |

**emotion** (Cảm xúc): tông cảm xúc mà khung hình truyền tải (3~14 chữ), dùng mô tả cụ thể cảm nhận được. Như "lạnh lùng khinh miệt", "đau đớn tuyệt vọng", "căng thẳng ngột ngạt". Cấm các từ rỗng như "vui", "buồn".

**scene**: tên bối cảnh mà phân cảnh này thuộc về, ứng với bối cảnh trong kịch bản

**associateAssetsNames**: danh sách tên các tài nguyên **nhìn thấy được** trong khung hình (kể cả nhân vật/vật thể chỉ xuất hiện một phần), để dễ xác nhận trực quan nội dung liên quan

**duration**: tham chiếu cơ bản —— đặc tả/biểu cảm 2~3s · cận cảnh đối thoại 3~5s · phô toàn thân 3~5s · hành động 2~4s · viễn cảnh/cảnh không người/chuyển tiếp 3~5s · cảnh phức tạp 5~8s. **Một cú máy không quá 8s**, quá thì phải tách.

**Khi có thoại, thời lượng bắt buộc phải đủ để đọc hết thoại và khớp tốc độ nói của cảm xúc**:

| Trạng thái cảm xúc | Tốc độ nói tham khảo | Tình huống ví dụ |
|---------|---------|----------|
| Phẫn nộ, gấp gáp, cãi vã | ~5 chữ/giây | Mắng xối xả, giục giã, hoảng loạn |
| Đối thoại thường, thuật lại | ~4 chữ/giây | Trò chuyện thường ngày, trình bày bình tĩnh |
| Buồn bã, tha thiết, trầm tư | ~2,5 chữ/giây | Tỏ lòng, tiếc thương, hồi tưởng |
| Thì thầm, yếu ớt, lúc hấp hối | ~2,5 chữ/giây | Thoi thóp như tơ, thì thào bên tai |

Cách tính: số chữ thoại ÷ tốc độ nói tương ứng (làm tròn lên) = số giây cơ bản, rồi cộng thêm phần dư cho ngắt nghỉ:
- Mỗi dấu câu ngắt nghỉ trong thoại (dấu phẩy, dấu chấm, dấu ba chấm, gạch ngang…) +0,3~0,5s
- Mỗi chỗ chuyển cảm xúc/đổi ngữ khí +0,5s
- `duration` cuối cùng = số giây cơ bản + tổng ngắt nghỉ + 1s biên an toàn (làm tròn lên)

**lines**: nguyên văn thoại của nhân vật, **bắt buộc bê nguyên từ kịch bản, không đổi một chữ**. Nhiều nhân vật thì xếp theo định dạng `tên nhân vật: câu thoại`. Không có thoại thì điền `无台词`. Một câu thoại ứng với một cú máy, tránh nhét nhiều lượt đối đáp của nhiều nhân vật vào một cú.

**sound** (Hiệu ứng âm thanh): mô tả thuần hiệu ứng âm thanh, phân lớp theo 「lớp tiếng động môi trường + lớp tiếng động tác」. Như "tiếng gió gào xa xa + tiếng kiếm ngân". Không có hiệu ứng âm thanh thì điền `无音效`.

> **🚫 Nghiêm cấm âm nhạc/nhạc nền**: sản phẩm cuối của dây chuyền này **hoàn toàn không có nhạc nền**. Cột `音效` chỉ mang nguồn âm có thật (tiếng động môi trường + tiếng động tác + tiếng mô phỏng); mọi chữ như "BGM", "nhạc nền", "giai điệu", "dàn dây/piano/đàn hạc/tiếng sáo… dùng làm nhạc tôn không khí" **đều là vi phạm**, lượt duyệt sẽ phán là vấn đề nghiêm trọng. Nếu trong kịch bản có việc chơi nhạc cụ như một hành động của tình tiết (như nhân vật gảy đàn), thì chỉ được viết nguồn âm vật lý cụ thể như "tiếng kim loại rung khi đầu ngón gảy dây + tiếng ngân của thùng cộng hưởng".

**associateAssetsIds**: ID của các tài nguyên **nhìn thấy được** trong khung hình (giá trị trường `id` thực tế lấy từ dữ liệu assets), không bịa ID không tồn tại.
- **Nhân vật xuất hiện là phải trích dẫn**: mọi nhân vật xuất hiện trong khung hình, dù là chủ thể hay chỉ nhìn thấy một phần (như thấy lưng, thấy bàn tay, bóng nhòe…), chỉ cần nhận diện được trong khung là bắt buộc phải trích dẫn ID tài nguyên tương ứng của họ
- **Tài nguyên bối cảnh bắt buộc chọn**: mỗi phân cảnh bắt buộc phải trích dẫn ID tài nguyên bối cảnh ứng với bối cảnh mà nó thuộc về (tài nguyên có type là scene); nếu bối cảnh đó có tài nguyên bối cảnh phái sinh khớp với trạng thái hình ảnh hiện tại thì chọn ID của tài nguyên bối cảnh phái sinh, không thì chọn ID tài nguyên bối cảnh chính. Thiếu ID tài nguyên bối cảnh bị coi là trường không đầy đủ
- Quy tắc chọn tài nguyên cha/con: chọn ID tài nguyên theo trạng thái mà hình ảnh của tình tiết cần —— nếu cú máy đó cần trạng thái phái sinh của một tài nguyên chính nào đó thì **chỉ chọn ID tài nguyên phái sinh**; chỉ khi không có trạng thái phái sinh nào khớp thì mới chọn ID tài nguyên chính; cùng một tài nguyên cha thì cấm để bản chính và bản phái sinh cùng xuất hiện trong một phân cảnh

---

## Quy tắc chuyển cảnh

- **Trong cùng một cảnh**: giữa các cú máy mặc định là cắt thẳng
- **Vắt qua bối cảnh**: chèn 1 phân cảnh không người (2~3s) làm đệm cảm xúc, nội dung cảnh không người phải liên quan đến không khí của hai bối cảnh trước sau
- **Vắt qua đoạn**: có thể ghi "chuyển tiếp mờ chồng" hoặc "mờ dần vào/mờ dần ra" trong description
- Cấm các kiểu chuyển cảnh màu mè (gạt màn, xoay, lá sách…)
