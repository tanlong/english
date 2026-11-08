# Đối chiếu bản đồ và góc nhìn tại chín điểm đến

Ngày rà soát: 2026-11-08.

**Báo cáo này ghi nhận bản trước khi sửa.** Các cảnh thay thế và đối chiếu hiện hành được ghi tại [aligned-v2/README.md](aligned-v2/README.md).

## Kết luận

Bộ tranh đồng bộ về chủ đề Nam Bộ 1995–2005 nhưng **chưa đạt tính liên tục không gian giữa bản đồ và cảnh đi vào**. Không thể coi các cảnh là những góc máy đã được dựng chính xác từ cùng một địa hình.

Đã xem trực tiếp ảnh bản đồ, chín cảnh đích (cánh đồng là ảnh chụp các lớp đã ghép), ảnh chụp giao diện điện thoại và cấu hình điểm đến. SHA-256 của 9 nguồn ảnh mới khớp manifest hiện hành. Không thay tranh trong đợt rà soát này; không chạy lại bộ kiểm thử chức năng vì không thay mã chạy ứng dụng. Các kiểm thử tải ảnh/điều hướng trước đó không chứng minh được tính liên tục của kiến trúc và địa hình.

## Từng điểm

Tọa độ dưới đây là phần trăm ảnh bản đồ, không phải hướng địa lý hay tọa độ khảo sát.

| Điểm, tọa độ | Bản đồ | Cảnh đi vào | Đánh giá và chỉnh sửa cần có |
| --- | --- | --- | --- |
| Vườn cây ăn trái, 58/12 | Vườn cây dày ở phần trên bản đồ; chưa thể hiện rõ lối vào tại pin. | Đường đất rộng, mương trái, hai căn nhà gần đường, xoài/mít/dừa. | Hợp cây cối và chủ đề; chưa đối chiếu được vị trí mương, hai nhà và hướng đường. Cần đánh dấu lối vào vườn và xác định camera nhìn dọc lối đó. |
| Khu nhà, 55/72 | Nhà mái ngói đỏ, hiên trước có giàn hoa tím/hồng, chái mái tôn bên trái. | Nhà cùng nhóm vật liệu nhưng mặt tiền, hiên, cửa và các chái khác; mất giàn hoa nhận diện. | Lệch nhận diện căn nhà. Giữ đúng giàn hoa, chái tôn, bố cục cửa/hiên khi tạo góc nhìn mặt đất. |
| Cầu qua sông, 52/48 | Cầu bê tông hẹp nối tuyến đường từ phía cửa hàng sang phía ruộng. | Cầu bê tông hẹp, lan can đơn giản, đường tiếp tục qua cụm nhà và vườn. | Loại cầu và vật liệu hợp. Chưa đủ dấu mốc để xác nhận cùng đầu cầu/hướng nhìn; cần cố định góc đứng từ đầu gần cửa hàng và khớp nhà, ruộng ở đầu đối diện. Không kết luận hướng hiện tại chắc chắn bị đảo. |
| Bờ hồ, 26/34 | Điểm đánh dấu nằm trên mặt nước; quanh đoạn nước có chòi/nhà gỗ và mái tôn. | NPC đứng trên bờ đất; nhìn sang cụm nhà với căn mái ngói ở giữa, cầu bến và thuyền. | Hợp bối cảnh ven nước nhưng chưa xác định được đoạn bờ tương ứng. Cần đặt điểm đứng trên bờ và khớp cụm nhà/bến bên đối diện theo một hướng nhìn đã chọn. |
| Cánh đồng, 84/35 | Các ô ruộng ngập nước với hàng lúa. | Luống rau lá rộng trên đất nổi, nhà mái ngói bên trái, đường bê tông bên phải. | Lệch rõ loại canh tác và hình dạng thửa. Chọn ruộng lúa hoặc vườn rau làm chuẩn rồi đồng bộ cả hai ảnh, cả nhà và đường ven ruộng. Khác thời tiết sáng/ngày và giông/tối là chủ ý hiện có, không dùng nó để kết luận sai hình học. |
| Cửa hàng, 30/55 | Tiệm gạch với mái tôn và mái hiên bạt sọc. | Nội thất dưới mái ngói lộ xà gỗ; cửa rộng bên phải. | Mái chính chưa nhất quán. Cần khớp mái ngói/tôn, mặt tiền và cửa ra đường; bảo toàn máy game thùng, đua ngựa và cây chổi đã sửa. |
| Góc làm việc, 91/12 | Nhà có mái bằng, tường chắn mái. | Mái tôn dốc lộ xà gỗ, cửa chớp lớn. | Lệch rõ hình thức mái. Chọn mái bằng hoặc mái dốc làm chuẩn; sau đó khớp vị trí cửa và cảnh nhìn qua cửa. |
| Phòng dự án, 18/12 | Nhà mái ngói đỏ, hiên phía trước. | Mặt dưới mái tôn gợn sóng lộ xà. | Chưa nhất quán mái. Nếu không có cấu tạo hai lớp mái được thể hiện có chủ ý, cần dùng cùng một loại mái ở cả hai ảnh. |
| Studio sản phẩm, 90/66 | Nhà mái tôn gỉ. | Mặt dưới mái ngói đất nung lộ rõ. | Lệch loại mái. Đồng bộ mái trước khi chốt hướng cửa sổ và cảnh bên ngoài. |

## Lỗi riêng lúc chuyển vào cánh đồng

`app/cafe/workspace.tsx` lấy `layers[0].src` làm ảnh nền đích của hiệu ứng phóng vào điểm đến. Trong `app/cafe/scenes.ts`, lớp đầu của `farm_fields` hiện là `sky.webp`; đất và nhà nằm ở lớp `field-land` phía trên.

Vì vậy ảnh đích dùng trong đoạn chuyển cảnh chỉ có trời, chưa bao gồm đất, nhà và đường của cảnh cánh đồng. Cần dùng hình ghép đủ các lớp nền hoặc cho hiệu ứng chuyển cảnh hiển thị các lớp nền của cảnh đích. Đây là vấn đề khác với sai chi tiết giữa hai tranh.

## Nguyên nhân và cách chốt cảnh

Các prompt trong `generation-jobs.json` dùng ảnh cảnh cũ riêng lẻ làm tham chiếu chỉnh sửa. Bản đồ không được cung cấp làm tham chiếu bắt buộc cho các ảnh cận cảnh. Cấu hình điểm đến có vị trí pin nhưng chưa ghi lại vị trí đứng và hướng máy quay. Do đó đồng bộ chất liệu/thời kỳ chưa đồng nghĩa với cùng một căn nhà, đoạn bờ hay góc đường.

Trước khi tạo lại ảnh: chốt bản đồ hoặc cảnh cận làm bản chuẩn, xác định điểm đứng và hướng nhìn của từng cảnh, liệt kê các dấu mốc phải nhìn thấy theo thứ tự trái–giữa–phải. Đối chiếu lại mái, cửa, đường và bờ nước ở cả hai mức nhìn; sau đó mới kiểm tra ảnh trong giao diện ở 390px và 1440px.

## Ảnh đối chiếu

- [Bản đồ](source/map.png)
- [Vườn cây](source/forest_path.png), [khu nhà](source/village_homes.png), [cầu](source/river_bridge.png), [bờ hồ](source/lakeside.png), [lớp đất cánh đồng](source/field_land.png)
- [Góc làm việc](source/work_lounge.png), [phòng dự án](source/project_room.png), [studio](source/design_studio.png)
- [Cửa hàng](../rooms/v3/village_market-broom-fixed.png)
