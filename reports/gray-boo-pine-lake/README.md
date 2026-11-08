# Gray Boo & Pine Lake v1.1

Triển khai theo cả bản Markdown, DOCX, ảnh tham chiếu và mẫu TSX trong `MD/Gray_Boo_Pine_Lake_Guide_Package_v1.1/`.

## Xem kết quả

- Mở app tại `/english/cafe`, đi qua **Đến đồi chè → Đến hồ thông**.
- [Preview WebP 3 giây](../../public/cafe/assets/npc/gray_boo/gray_boo_idle.webp)
- [GIF fallback](../../public/cafe/assets/npc/gray_boo/gray_boo_idle.gif)
- [Notice WebP](../../public/cafe/assets/npc/gray_boo/gray_boo_notice.webp)
- [Poster PNG](../../public/cafe/assets/npc/gray_boo/gray_boo_poster.png)
- [Bảng xem trước](index.html)
- [Video toàn cảnh, trọn vòng 64 giây](scene-motion.mp4)
- [Cận cảnh người chèo qua hồ rồi trở về](rower-across-lake.mp4)

## Chuyển động

Gray Boo sử dụng rig PixiJS đang có: tay chào riêng, chớp mắt ở 1.15–1.38 giây trong loop idle 3 giây, vạt áo biến dạng bằng lưới cục bộ. Vùng đầu, màn hình, chân và giày không bị biến dạng. Miệng đóng/mở theo trạng thái chat hiện có; đây là lip flap, không phải lip sync âm vị.

Môi trường giữ các lớp DOM alpha và dùng Web Animations API cho các chu kỳ riêng. Mặt hồ có Canvas2D biến dạng từng dải pixel phản chiếu theo sóng ngang/dọc, được giới hạn bởi polygon hồ và nằm dưới sàn/lan can. Nhịp vẽ nước tối đa 30 lần/giây, dừng khi pause, mở chat, giảm chuyển động hoặc ẩn tab. Đồng hồ nước vẫn nhận Hover Boost riêng; không tăng tốc toàn bộ renderer hoặc miệng NPC. Cành thông trái/phải và hoa trái/phải có texture alpha thật, pivot riêng và lệch pha. Ánh sáng hologram và sáu hạt sáng có chu kỳ riêng.

Thuyền có một nhân vật ngồi chèo, thân người và mái chèo chuyển động riêng theo nhịp hai giây. Nhân vật, thuyền và mái chèo đổi hướng cùng nhau. Lượt đi từ x=530 đến x=1750 mất 30 giây, quay đầu 2 giây, chèo về 30 giây và quay đầu 2 giây: một vòng 64 giây. Nhân vật nằm sau lớp mạn thuyền; mái chèo ở phía trước, có phản chiếu và vệt nước. Thuyền cũ cùng bóng của nó đã được xóa khỏi lớp cảnh xa và texture nước. Thuyền và nhịp chèo giữ tốc độ thường khi hover Gray Boo; pause/tab ẩn/chat/reduced motion đều dừng chuyển động.

Hover bằng chuột/bút hoặc focus bàn phím: nước ×1.8, thông ×1.5, hoa ×1.5, hạt sáng ×2.0, hologram ×1.3; blend dùng hằng số thời gian 450ms khi vào và 800ms khi ra. Không thay đổi biên độ, tốc độ NPC/miệng, FPS hay camera. Mở chat dừng ambient và bỏ boost; đóng chat khôi phục focus nhưng không tự bật boost. Tap không mô phỏng hover. Pause, tab ẩn và reduced motion được xử lý; chuyển cảnh hủy animation/listener.

Giữ graph `inside_cafe ↔ outdoor_terrace ↔ mountain_view`. Không gọi AI hoặc mở mic khi hover/idle. Không tạo cảnh thứ tư hoặc thay nội dung hội thoại.

## Asset và nguồn

Tận dụng master 1920×1080 và các lớp alpha/phục dựng Full HD hiện có, không kéo méo JPG tham chiếu và không gọi ảnh upscale là native 4K. Nền sạch không chứa nhân vật/chữ. Bản `bg_clean.webp` phục vụ poster/fallback; runtime ghép lớp cảnh xa đã phục dựng và mặt sàn trước khi thêm cành/hoa, nên không có cành/hoa bị nhân đôi.

Nguồn thuyền alpha và ảnh vá vùng hồ nằm trong `art/dalat/pine_lake/motion/`. [Log sinh ảnh và vùng ảnh được sử dụng](../../art/dalat/pine_lake/motion/generation.json). Chỉ vá vùng thuyền/phản chiếu 105×62 px, feather 8 px; phần còn lại giữ pixel từ các lớp cũ. Master và rig Gray Boo không bị thay đổi.

Nhân vật chèo thuyền hiện tại có tóc đỏ, mũ rơm băng đỏ, áo trắng và áo choàng tối, lấy cảm hứng từ Shanks trong One Piece. Giữ tư thế ngồi, tay cầm chèo, nhịp chèo và hành trình hai chiều. Nguồn nhân vật: [rower-redhair-strawhat.png](../../art/dalat/pine_lake/motion/rower-redhair-strawhat.png). Nguồn mái chèo: [rowing-oar.png](../../art/dalat/pine_lake/motion/rowing-oar.png). Cả hai dùng `image_gen` tích hợp, alpha thật; [prompt đầy đủ và thông số đăng ký tay/cán chèo](../../art/dalat/pine_lake/motion/rowing-generation.json).

[Cấu hình và tọa độ](../../configs/mountain_view.animation.json) · [Manifest nguồn/checksum](asset-manifest.json) · [Kiểm chứng preview](preview-validation.json).

Không đổi cờ approval của art/rig có sẵn. Duyệt thẩm mỹ cuối và đo FPS trên thiết bị thật vẫn chưa thực hiện; 60 FPS desktop / 30–60 FPS mobile trong guide là mục tiêu, chưa phải số đo. Biến dạng nước dùng Canvas2D cục bộ; shader displacement và parallax P1 không được bật.

## Tái xuất

```bash
npm run cafe:build-gray-boo
npm run cafe:export-gray-boo
# App cần đang chạy tại localhost:3000 để ghi lại cảnh thực tế
npm run cafe:record-gray-boo
npx playwright test tests/gray-boo-lake.spec.ts --workers=1
```

Lệnh export dùng Chromium và renderer PixiJS thật, hoàn toàn từ file trong máy. Script kiểm tra loop đầu/cuối trùng pixel, giày cố định qua mọi frame, alpha, thời lượng 3000ms và loop vô hạn của WebP/GIF. `cafe:build-art` cũng dựng lại các alpha asset hồ tự động.

Phạm vi kiểm thử: riêng animation Gray Boo/Pine Lake và tương tác liên quan trong Café; không chạy toàn bộ regression suite.

Kết quả cập nhật: **12/12 Playwright qua trên server đang chạy tại localhost:3000**, gồm thân cây khớp ảnh gốc không hở đường nối, chuyển động nước liên tục qua vị trí mép chéo cũ, chuyển động trong preview, thuyền di chuyển đúng vùng hồ và dừng theo scene, nhân vật/mái chèo chuyển động, đi hết chiều ngang hồ rồi quay đầu và trở về điểm xuất phát, vệt phản chiếu thật sự dịch chuyển theo sóng trong khi sàn đứng yên, hover/easing và dọn animation khi chuyển cảnh, bàn phím/chat, pause/tab ẩn/reduced motion, mobile tap/16:9/vùng chạm, pixel giày cố định và poster fallback/retry. TypeScript, ESLint và Prettier trên các file thay đổi đều qua. Production build `npm run build -- --webpack` đã qua ở đợt triển khai ban đầu. Preview NPC vẫn có 24 frame, 3000ms, alpha và loop liền mạch.

## Kiểm chứng sóng và thuyền

Kiểm tra vị trí thuyền thật trong hồ: dịch chuyển tối thiểu 25 CSS px, dừng đúng khi pause. Kiểm tra sóng theo vị trí các vệt phản chiếu cây: chuẩn hóa độ sáng từng hàng ảnh rồi tìm dịch chuyển ngang. Ít nhất 30% hàng phải có dịch chuyển phù hợp rõ hơn vị trí đứng yên; hiệu ứng chỉ tăng/giảm opacity không thể vượt kiểm tra này. Pixel sàn gỗ được so sánh riêng để bảo đảm nước không làm biến dạng toàn cảnh.

`index.html` có video toàn cảnh 1280×720 dài 64 giây, ghi từ runtime thật ở tốc độ thường, và video cận cảnh 1280×640 phóng to, đi theo thuyền từ cùng bản ghi. Cận cảnh chỉ phóng to/di chuyển vùng cắt; không tăng tốc. Camera của app vẫn đứng yên. Video có nút điều khiển và tôn trọng reduced motion. Đây là bản ghi để xem lại; tương tác hover/chat nằm trong app.

## Sửa đường nối cây và mép nước

Nền hồ trước đó bị scale 1.012 trong khi lớp thân cây và texture nước ở scale 1. Runtime giờ cố định các lớp hồ cùng tọa độ ảnh gốc để các mép ghép khớp nhau. Mặt nước dùng mask alpha có chuyển tiếp mềm 24 px, chạy theo bờ thực và kéo xuống sau lan can; không còn cắt cứng theo đường chéo trong lòng hồ. Sóng vẫn làm dịch chuyển phản chiếu, thuyền và nhân vật tiếp tục chèo qua hồ rồi quay về.

Hai kiểm tra hồi quy mới tái hiện lỗi trước khi sửa: sai lệch ảnh thân cây và chuyển động nước tụt về 0 ở mép chéo. Cả hai đã qua cùng 10 kiểm tra riêng của cảnh hồ. Không chạy bộ kiểm thử toàn ứng dụng.

## Ngoại hình người chèo thuyền tóc đỏ

Thay sprite khách du lịch bằng `rower-redhair-strawhat.png`, lấy cảm hứng từ Shanks: tóc đỏ, mũ rơm băng đỏ, áo trắng và áo choàng tối. Sprite tạo bằng `image_gen` tích hợp với ảnh người chèo cũ làm tham chiếu tư thế; giữ alpha thật và hình ngồi nhìn sang phải. Mái chèo vẫn là lớp chuyển động riêng. Điểm cầm chèo được căn theo sprite mới, texture runtime có tên mới để không dùng lại ảnh cũ trong cache.

Chỉ chạy lại **2/2 kiểm tra Playwright liên quan người chèo và thuyền** cho lần đổi ngoại hình này: tư thế ngồi/mái chèo có chuyển động, đi hết hồ rồi quay về và dừng cùng cảnh. Kiểm tra alpha và độ đọc màu tóc đỏ ở kích thước sprite, ESLint và Prettier đều qua. Video toàn cảnh và cận cảnh được ghi lại với nhân vật mới. Prompt đầy đủ và nguồn ảnh lưu trong `art/dalat/pine_lake/motion/rowing-generation.json`.

## Mái chèo, mây, tay chào và vị trí desktop

- Mái chèo được che tại mặt phẳng nước cố định theo thuyền, bên ngoài nhóm xoay vai. Phần chìm không còn hiện nguyên lưỡi chèo dưới hồ; nhịp đưa chèo lên được rút ngắn theo phối cảnh để lưỡi chèo hiện lại trên mặt nước. Áp dụng cho cả lượt đi và về.
- Bổ sung lớp mây alpha trôi phía trên nền, phía sau cây và tiền cảnh cho cả ba cảnh. Hai cụm mây dùng sprite mới từ `image_gen` tích hợp: [ảnh nguồn](../../art/dalat/shared/cloud-drift.png), [prompt đầy đủ](../../art/dalat/shared/cloud-generation.json). CSS dừng mây khi cảnh pause, mở chat, tab ẩn hoặc giảm chuyển động; poster fallback không hiện lớp mây.
- Trên desktop từ 1024px, bỏ tự cuộn qua thanh đầu trang để mép cảnh mặc định ở y=80px. Giữ cách mở gọn trên mobile.
- Cloud Daisy dùng góc nghỉ 0° của ảnh tay vốn đã giơ lên. Góc cũ 88–108° xoay lòng bàn tay vào giữa ngực. Tay giờ vẫy nhẹ ra phía ngoài vai; renderer app và renderer review dùng cùng hiệu chỉnh.
- Cả bảy NPC có lời chào ngắn riêng khi hover hoặc focus bàn phím. Escape, rời NPC, mở chat và chuyển cảnh dọn bong bóng; touch không giả hover. Mr. Pink có lời chào ở nút hướng dẫn riêng. Hover không tạo lượt chat hoặc gọi AI.

[Ảnh desktop: mép trên 80px và lời chào](cafe-desktop-greeting.png) · [Cloud Daisy sau khi sửa tay](cloud-daisy-hand.png) · [Video mái chèo trong runtime](rower-across-lake.mp4).

Phạm vi kiểm chứng lần này: 13 ca Playwright riêng cho hồ thông, 7 ca giao diện Café liên quan tới mây/tay/lời chào/desktop/mobile/Mr. Pink và 3 kiểm tra logic idle/chào/talking của Cloud Daisy. Chỉ chạy các file và bộ lọc liên quan, không chạy toàn bộ regression suite. TypeScript, ESLint và Prettier trên các file sửa được kiểm tra riêng.
