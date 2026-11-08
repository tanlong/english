# Sun King — đất liền với nền cảnh

Phần đất được sửa bằng Imagegen tích hợp, rồi đăng ký vào lớp địa hình toàn cảnh.
Các pixel ngoài vùng sửa (x: 1004–1462, y: 752–913 trên ảnh 1672 × 941) giữ nguyên.
Mép vùng sửa hòa dần vào đất, cỏ và lề đường đang có. Bóng tiếp xúc dưới chân và tay
được hiển thị riêng; nhân vật và ảnh dự phòng không còn chứa miếng đất hình bầu dục.

Ảnh đầu và thân Sun King giữ nguyên byte so với bản v2; các chuyển động cười,
điều khiển tạm dừng và chế độ giảm chuyển động được giữ lại.

- [Địa hình do Imagegen chỉnh](../../art/npc/sun_king/field-v3/terrain.png)
- [Prompt và ảnh hướng dẫn vị trí](../../art/npc/sun_king/field-v3/generation-job.json)
- [Tệp runtime và checksum](../../art/npc/sun_king/field-v3/layer-manifest.json)
- [Máy tính](desktop.png) · [Điện thoại](mobile.png) · [Màn hình rộng](wide.png)

Đã kiểm tra 4 ca Playwright liên quan: 390/1440/3290 px và ảnh dự phòng khi lỗi tải lớp.
ESLint, TypeScript và kiểm tra pixel ngoài vùng sửa đạt. Không chạy toàn bộ bộ kiểm thử.

Dựng lại bằng `node scripts/cafe/build-sun-king.mjs`.
