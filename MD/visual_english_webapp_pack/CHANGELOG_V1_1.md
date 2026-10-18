# CHANGELOG V1.1 — 2026-10-16

## Hai thay đổi đã chốt

1. **Từ vựng:** thay yêu cầu "90% số lượt từ thuộc Oxford 3000" bằng **≥90% số lượt từ trong câu thoại bài học thuộc Vietnam Everyday & IT Banking Spoken Core đã được duyệt**. Từ/cụm được ưu tiên theo nhu cầu giao tiếp tiếng Anh tại Việt Nam: sinh hoạt, giao thông, ăn uống, đồng nghiệp, IT ngân hàng. Oxford 3000 là nguồn tham khảo phụ. Danh mục ứng viên chưa được xác thực bằng corpus; công cụ kiểm tra phải chặn xuất bản khi chưa duyệt.
2. **Vai trò:** mở rộng tập chính thức thành **ITBA / UX / UI / PM / Developer / PO (Product Owner)**. Mỗi vai trò có nhóm tình huống riêng; Developer (bug, API, code review, release) và PO (backlog, user story, priority, product value) được tách rõ.

## Tài liệu đã sửa

- `README.md` — khóa yêu cầu v1.1 và thứ tự đọc tài liệu hiện hành.
- `docs/01_PRODUCT_BRIEF_AND_REQUIREMENTS.md` — PRD, P-05/P-09 và bảng kịch bản từng role.
- `docs/02_VISUAL_STYLE_BIBLE.md` — 2 nhân vật mới PO và QA; Developer là vai trò độc lập.
- `docs/03_UX_IA_USER_FLOWS.md` — tùy chọn role và các luồng luyện nói.
- `docs/04_UI_SCREEN_SPECS.md` — form onboarding và metadata kiểm tra ngôn ngữ.
- `docs/05_LEARNING_CONTENT_AND_REVIEW.md` — nguyên tắc lexical QA mới.
- `docs/06_TECHNICAL_HANDOFF.md` — hợp đồng dữ liệu lexicon và role slugs.
- `docs/07_QA_ACCEPTANCE_TESTS.md` — kịch bản QA cho Developer/PO và publish gate.
- `docs/08_VIETNAM_SPOKEN_CORE_LEXICON.md` — tài liệu mới.
- `docs/09_IT_BANKING_ROLE_SCENARIOS.md` — tài liệu mới.
- `docs/10_CURRENT_12_MONTH_BLUEPRINT_V1_1.md` — curriculum chính thức mới.
- `prompts/01_IMAGE_PROMPT_SYSTEM.md`, `prompts/02_SCENE_SHOT_LIST.md` — cảnh và prompt cho Developer/PO.
- `data/vietnam-spoken-core.seed.json` — ứng viên từ/cụm để biên tập.
- `data/lesson01.example.json` — tham chiếu lexicon mới, trạng thái chưa duyệt.
- `scripts/check_lexical_coverage.py` — công cụ kiểm tra thử và chặn publish seed-only.
- `prototype/index.html` — chọn Developer/PO; kịch bản demo theo vai trò.

## Không thay đổi

- 12 tháng / 52 tuần × 6 ngày học / tuần × 60 phút/ngày.
- 80% nghe–nói và 20% đọc–viết.
- 80% Everyday & Work và 20% kỹ năng giao tiếp lấy cảm hứng từ Đắc Nhân Tâm.
- B1 mục tiêu và KPI ≥80% nghe hiểu các đoạn hội thoại **mới** về chủ đề quen thuộc.
- Visual-first, ảnh 2D tươi sáng, nhân vật người đi làm, không có dữ liệu ngân hàng thật.

**Lưu ý:** `docs/00_*_SOURCE.md` lưu nguyên các phiên bản cũ cho truy xuất nguồn gốc; không sử dụng chúng thay tài liệu v1.1.
