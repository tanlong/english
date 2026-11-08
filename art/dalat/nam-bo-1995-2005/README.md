# Bình Nguyên — Nam Bộ, 1995–2005

**Bản hiện hành của chín cảnh đích:** [aligned-v2/README.md](aligned-v2/README.md). Bản này tạo lại các góc nhìn dựa trực tiếp trên bản đồ đã bỏ cột cờ, sửa loại mái/cây trồng và ảnh chuyển cảnh ruộng. Phần dưới ghi lại bộ nguồn ban đầu.

Bộ tranh gợi nhớ làng Nam Bộ trong giai đoạn 1995–2005: kênh rạch, vườn cây ăn trái, nhà gạch và gỗ với mái ngói/mái tôn, xe đạp và xe máy đời cũ, đường làng nhỏ. Nội thất dùng bàn gỗ, hồ sơ giấy, quạt điện, điện thoại bàn và máy tính CRT. Đây là bối cảnh hư cấu, không phải phục dựng một địa phương cụ thể.

## Tệp và prompt

- Công cụ: **built-in image_gen**, chế độ chỉnh ảnh tham chiếu; không dùng CLI/API dự phòng.
- Toàn bộ prompt, ảnh tham chiếu và đường dẫn kết quả gốc: [generation-jobs.json](generation-jobs.json).
- Chín ảnh PNG gốc đã lưu trong [source/](source/): `map`, `village_homes`, `river_bridge`, `forest_path`, `lakeside`, `work_lounge`, `project_room`, `design_studio`, `field_land`.
- WebP dùng trong ứng dụng: `public/cafe/maps/nam-bo-1995-2005/`; kích thước hiển thị 1672 × 941, kích thước gốc và SHA-256 trong [manifest.json](manifest.json).
- Tư liệu định hướng và giới hạn lịch sử: [references.md](references.md).

Chạy `node scripts/cafe/build-nam-bo-art.mjs` để xuất lại WebP. Tên nội bộ `forest_path` giữ ổn định; nhãn hiển thị là **Vườn cây ăn trái**.

### Bỏ cột cờ trên bản đồ

Đã bỏ lá cờ và cột cờ cạnh nhà ở vùng 26.3%/9.5% theo đánh dấu của người dùng, bằng built-in image_gen. Ảnh được chọn: [source/map-no-flag.png](source/map-no-flag.png); nguồn đang xuất là `source/map.png`. Bản trước chỉnh sửa được giữ ở `source/map-before-flag-removal.png`. Prompt đầy đủ và nguồn kết quả: [flag-removal-job.json](flag-removal-job.json). Runtime tiếp tục dùng `public/cafe/maps/nam-bo-1995-2005/map.webp`.

## Các lớp được giữ

Cửa hàng dùng bản `art/dalat/rooms/v3/village_market-broom-fixed.png` đã có máy game thùng, game đua ngựa và cây chổi đã sửa. Các ảnh cũ được giữ nguyên.

Cánh đồng dùng nền trời giông tách rời và lớp đất mới có alpha. `scripts/cafe/build-sun-king.mjs` ghép lại đúng vùng đất tiếp xúc dưới chân Sun King từ bản đã căn chỉnh; chạy script này sau khi thay nguồn lớp đất. Hình nhân vật và hiệu ứng mưa, sấm, tán cây tiếp tục dùng các lớp hiện có. Nền bầu trời thay cho ảnh cánh đồng cũ để tránh lộ nhà/đèn đường cũ qua vùng alpha.

Vị trí chín điểm đến và luồng di chuyển giữa các cảnh được giữ để tiếp tục dùng tương tác hiện có.

## Kiểm tra tích hợp

- Đạt 8 ca Playwright riêng cho bản đồ, năm cảnh ngoài trời, bốn phòng, chuyển cảnh thường/giảm chuyển động và nền đất Sun King ở 390px/1440px.
- Chạy lại hai ca phòng sau khi thêm kiểm tra ảnh tải đủ 1672px và ảnh chụp từng phòng: đều đạt.
- Đã xem ảnh chụp bản đồ, các cảnh và phòng; lớp đất có alpha thật, các vùng nền và chân NPC được giữ tách rời.
- ESLint và Prettier đạt trên các tệp mã/kiểm thử được sửa. Không chạy toàn bộ bộ kiểm thử ứng dụng.
