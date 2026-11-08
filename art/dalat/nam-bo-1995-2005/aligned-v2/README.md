# Các cảnh bám theo bản đồ — bản 2

Bản đồ chuẩn: [map-no-flag.png](../source/map-no-flag.png), đã bỏ lá cờ và cột cờ. Giữ nguyên bản đồ này; tạo lại chín cảnh đích theo vị trí và kiến trúc của nó. Đây là các tranh dựng theo góc máy đã chọn, không phải ảnh kết xuất từ mô hình 3D đo đạc.

## Ảnh gốc, prompt và bản dùng trong ứng dụng

- Công cụ: **built-in image_gen**, mỗi cảnh một lần tạo riêng; cảnh cầu có thêm một lượt chỉnh để bỏ tiệm bị đặt sát đầu cầu.
- [generation-jobs.json](generation-jobs.json) chứa đầy đủ prompt, hướng nhìn và ảnh tham chiếu của từng cảnh. Bản đồ chuẩn được đưa trực tiếp vào mọi lượt tạo cảnh ban đầu.
- PNG gốc nằm trong [source/](source/), tám cảnh 1672 × 941; lớp đất cánh đồng 1670 × 942 có alpha thật. Không gọi các ảnh này là ảnh 4K.
- [manifest.json](manifest.json) ghi kích thước nguồn, SHA-256 và WebP xuất ra tại `public/cafe/maps/nam-bo-1995-2005/aligned-v2/`.
- WebP cảnh thường dùng chất lượng 97; lớp đất dùng WebP lossless. Kích thước runtime 1672 × 941; giữ PNG gốc để tải/xuất lại.
- Xuất lại: `node scripts/cafe/build-nam-bo-art.mjs --aligned`, sau đó `node scripts/cafe/build-sun-king.mjs` cho cảnh ruộng lúa.

## Góc nhìn và dấu mốc được chốt

Các hướng dưới đây mô tả vị trí trên ảnh bản đồ, không quy ước hướng Bắc địa lý.

| Cảnh | Điểm đứng / hướng nhìn | Dấu mốc đã đối chiếu |
| --- | --- | --- |
| [Vườn cây](source/forest_path.png) | Từ cửa vườn sát đường ngang phía trên nhìn sâu vào vườn. | Cổng hàng rào tre, mương trái, cầu ván nhỏ, xoài/mít/dừa; bỏ hai căn nhà lớn không có ở lối vào. |
| [Khu nhà](source/village_homes.png) | Từ sân phía dưới nhìn vào mặt hiên nhà trung tâm. | Mái ngói, giàn hoa tím/hồng, chái tôn bên trái, cửa xanh, lu nước, dây phơi và đống rơm bên phải. |
| [Cầu qua sông](source/river_bridge.png) | Từ phía đường cửa hàng nhìn qua cầu về phía ruộng. | Cầu bê tông hẹp hai thanh lan can, nước hai bên, ruộng phía phải, đường nối rẽ theo bờ, nhà gỗ mái tôn lùi sau vườn. Tiệm không nằm sát đầu cầu trong khung hình. |
| [Bờ hồ](source/lakeside.png) | Từ bờ đất cạnh chòi lá bên trái hồ nhìn sang bờ đối diện. | Chòi lá ở mép trái, bờ đứng khô, cụm nhà gỗ mái tôn, chái lá và thuyền phía bên kia. Pin đổi từ 26/34 xuống vị trí bờ 18/35. |
| [Cánh đồng — đất](source/field_land.png) | Từ bờ ruộng sát đường bên phải nhìn qua ruộng về kênh. | Ô ruộng ngập nước với mạ/lúa, bờ đất, chòi mái tôn bên trái, đường bê tông bên phải không vạch sơn. Giữ giông/tối theo cảnh Sun King hiện có. |
| [Cửa hàng](source/village_market.png) | Trong tiệm từ góc sau-trái nhìn ra cửa mặt tiền bên phải. | Mái tôn, tường gạch, bạt sọc xanh-trắng, đường làng và hàng rào ngoài cửa; giữ hai máy game và cây chổi nguyên cán. |
| [Góc làm việc](source/work_lounge.png) | Trong nhà mái bằng, hướng về dãy bàn và cửa sau ra vườn. | Trần bê tông phẳng, khung cửa xanh-xám; bỏ cảnh hồ trước cửa sau, giữ CRT và điện thoại bàn. |
| [Phòng dự án](source/project_room.png) | Từ trong phòng nhìn về sân trước qua cửa và cửa sổ. | Mái ngói đỏ trên xà gỗ; sân trước, vườn và đường phía ngoài, kênh chỉ ở mép cửa bên trái. |
| [Studio](source/design_studio.png) | Hướng về bàn máy tính và ruộng phía trước; cửa sổ bên nhìn ra kênh. | Mái tôn trên xà gỗ, cửa xanh-xám, ruộng ở cửa chính diện, kênh qua cửa trái, đường qua cửa bên phải. |

## Cảnh ruộng và hiệu ứng chuyển cảnh

`build-sun-king.mjs` dùng trực tiếp lớp đất ruộng lúa mới, không chèn lại vùng rau từ bản cũ. Vùng bờ đất trống ở dưới-phải dành cho chân Sun King. Nhân vật, thân/đầu và hoạt ảnh giữ các nguồn hiện có.

Script ghép trời + đất + tán cây thành một ảnh nền hoàn chỉnh, lưu vào `topic-npc-assets.json` tại `sun_king.scene`. Đây là lớp đầu của cảnh, cũng được hiệu ứng phóng từ bản đồ dùng làm ảnh đích. Các lớp trời chuyển động, đất alpha, tán cây và mưa tiếp tục hiển thị như trước khi đã vào cảnh.

## Kết quả kiểm tra

- Đã đối chiếu trực quan cả chín cảnh với các dấu mốc của bản đồ và xem ảnh chụp cảnh sau khi đặt NPC ở 1440px; có ảnh chụp tương ứng ở 390px.
- Đạt tám ca Playwright liên quan: năm cảnh ngoài trời, bốn phòng, chín vùng bấm không chồng nhau, chuyển cảnh thường/giảm chuyển động và Sun King ở 390px/1440px.
- Ca mới về ảnh đích khi vào ruộng đã thất bại với `sky.webp` trước sửa và đạt sau khi dùng ảnh ghép hoàn chỉnh. Tổng cộng chín ca khác nhau; không chạy toàn bộ bộ kiểm thử ứng dụng.
- PNG nguồn khớp SHA-256 của manifest; chín WebP giải mã được, lớp đất có alpha thật. Tổng chín WebP của gói khoảng 8.88MiB (chưa gồm ảnh ghép ruộng và các lớp dùng chung).
- ESLint và Prettier đạt trên các tệp mã/kiểm thử đã sửa.
