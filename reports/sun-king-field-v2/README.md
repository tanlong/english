# Sun King — cánh đồng mưa

Sun King giữ tạo hình, tư thế, trang phục, trang sức, đuôi và nụ cười theo ảnh tham chiếu;
chất liệu và ánh sáng được dựng lại bằng Imagegen tích hợp để hợp nền cánh đồng buổi tối.
Mô đất ướt có mép cỏ trong suốt thay cho phiến đá bị cắt ngang.

## Bộ lớp

- [Đầu và nụ cười](../../art/npc/sun_king/field-v2/head.png)
- [Thân, trang phục và đuôi](../../art/npc/sun_king/field-v2/body.png)
- [Mô đất](../../art/npc/sun_king/field-v2/ground.png)
- [Prompt và nguồn tham chiếu](../../art/npc/sun_king/field-v2/generation-jobs.json)
- [Tọa độ, checksum và tệp runtime](../../art/npc/sun_king/field-v2/layer-manifest.json)
- [Ghép lớp hoàn chỉnh](layered-preview.webp)

Các lớp được đăng ký vào cùng hệ tọa độ 1108 × 1420. Mô đất dịch lên 44 px để đỡ
các điểm tiếp xúc của chân và tay; bước dựng kiểm tra alpha tại bốn điểm tiếp xúc.
Đầu có ba nhịp chuyển động cười nhẹ; thân và mô đất đứng yên. Tạm dừng và giảm
chuyển động được hỗ trợ. Nút “Nghe Sun King cười” dùng giọng thiết bị hiện có.

Dựng lại: `node scripts/cafe/build-sun-king.mjs` (cũng chạy trong bước dựng art chung).

## Kiểm tra đã thực hiện

7 ca Playwright liên quan tại 390/1440 px đạt: tách lớp, nhịp cười, tạm dừng,
giảm chuyển động, ảnh dự phòng khi lỗi tải lớp, hộp thoại, giông và tiếng sấm.
ESLint cho các tệp sửa và TypeScript đạt. Không chạy toàn bộ bộ kiểm thử của ứng dụng.

- [Cảnh trên máy tính](desktop.png) · [Hộp thoại](desktop-dialog.png)
- [Cảnh trên điện thoại](mobile.png) · [Hộp thoại](mobile-dialog.png)
