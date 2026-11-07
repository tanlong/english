# Đà Lạt Full HD v5

Ba bộ ảnh riêng: `flower_garden`, `tea_hills`, `pine_lake`, lấy cảm hứng từ [các cảnh Đà Lạt](https://vinwonders.com/vi/wonderpedia/news/canh-dep-da-lat/) theo yêu cầu owner.

- `source/concept-v5.png`: bố cục tham khảo do image_gen tạo, 1672×941.
- `tiles/*-reference.png`: vùng bố cục tham khảo; `*-detail.png`: vùng chi tiết AI native 1254×1254.
- `source/master-fullhd.png`: master 1920×1080 ghép từ hai vùng chi tiết.
- `source/fullhd-provenance.json`: kích thước, phương pháp và checksum.
- `layers/{ground,foliage,distant}.png`: ảnh tách/phục dựng từ image_gen.
- `layers/*-fullhd.png`: lớp runtime Full HD sau registration mask, giữ pixel chi tiết nhìn thấy của master.
- `scenes-v5.json`: địa điểm, vị trí chân và kích thước nhân vật, nhãn điều hướng.
- `generation-jobs-v5.json`: prompt/reference/output/checksum của mọi lần tạo; kết quả bị loại có trạng thái rõ ràng.

`npm run cafe:build-art` dựng lại WebP và cấu hình app mà không sinh ảnh mới. [Hướng dẫn](../../docs/DALAT_FULLHD_SCENES.md), [trang review](../../reports/dalat/review.html).
