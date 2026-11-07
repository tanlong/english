# Café scene artwork v4

Mỗi cảnh có thư mục riêng: `inside_cafe`, `outdoor_terrace`, `mountain_view`.

- `source/master-v4.png`: ảnh toàn cảnh do image_gen tạo, 1672×941 thực.
- `layers/architecture-v4.png`: kiến trúc/sàn, phục dựng phần bị bàn ghế/cây che.
- `layers/furniture-v4.png`: bàn ghế và đạo cụ tĩnh, alpha thật.
- `layers/foliage-v4.png`: cây/hoa, alpha thật, được chia trên/dưới khi đóng gói.
- `shared/layers/landscape-v4.png`: thung lũng/rặng núi dùng chung.
- `generation-jobs-v4.json`: prompt, reference, đường dẫn nguồn, checksum và metadata công cụ.

`npm run cafe:build-art` chuẩn hóa alpha kỹ thuật và xuất WebP kèm checksum vào `public/cafe/scenes/`. Lệnh không gọi dịch vụ sinh ảnh; ảnh gốc không đổi. Kích thước logic 1920×1080 không có nghĩa ảnh nguồn là 4K.

Xem [review cảnh thực tế](../../reports/cafe/review.html) và [hướng dẫn tích hợp](../../docs/CAFE_LAYERED_SCENES.md).
