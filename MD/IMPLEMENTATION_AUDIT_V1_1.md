# Rà soát & triển khai Natural English v1.1

Ngày: 2026-10-16. Nguồn yêu cầu: `visual_english_webapp_pack/README.md`, PRD, UX/IA, UI specs, learning/review, technical handoff, QA, lexicon, role scenarios và blueprint 12 tháng hiện hành. Các `00_*_SOURCE` giữ vai trò lịch sử. Không sử dụng hạn ngạch Oxford 3000 thay Vietnam Spoken Core.

## Kết quả rà soát ban đầu

| Vấn đề                                            | Thay đổi                                                                                                         |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Trang client hơn 1.000 dòng, UI và timer trộn lẫn | Server entry nhỏ; tách điều hướng, dashboard, course explorer, session player, hoạt động, ôn tập, hồ sơ, tiến độ |
| Chỉ 1 bài mở, danh sách 6 bài không theo 52 tuần  | 52 chủ đề đúng blueprint/12 tháng; 6 địa chỉ buổi/tuần; role overlay ở tuần công việc                            |
| Session 15/18/20′, 5 bước                         | Manifest cố định 8 bước, tổng 60′; kiểm tra riêng hai phân bổ 48/12                                              |
| Chuyển bước tự coi thời gian đã trôi qua          | Thời gian thực tế độc lập với hoàn thành; cần kết quả hoạt động trước khi chuyển bước                            |
| Streak 7 ngày và A2 gán sẵn                       | Số liệu từ sự kiện/thời gian thực; không gán CEFR từ lựa chọn onboarding                                         |
| JSON localStorage có thể làm crash                | Validate dữ liệu, khôi phục phần hợp lệ; giữ JSON lỗi thành bản sao phục hồi                                     |
| State/queue tự lưu ở nhiều vị trí                 | Một trạng thái v2 chia sẻ qua hook; lịch ôn tách 4 kỹ năng; ưu tiên lapse, loại ID đã bỏ                         |
| Transcript và mẫu nói dễ thay bài nghe            | Gate sau trả lời; fallback phụ đề ghi nhận assisted; nhập chữ không tính là nói                                  |
| API TTS nhận bất kỳ câu nháp                      | Chặn cloud TTS; dùng giọng thiết bị có nhãn luyện thử                                                            |
| Bản ghi có thể gửi mà thiếu mô tả consent         | Xin quyền lúc dùng, đồng ý riêng trước upload; max 30s/10MB, timeout; nhận diện cloud opt-in qua env             |
| Chưa có kiểm tra hành trình                       | node:test + Chromium; CI verify; screenshot nhiều viewport                                                       |

## Hành vi đã triển khai

1. Onboarding và cài đặt lưu tên, 7 vai trò, mục đích, tự tin ban đầu, micro, chữ lớn.
2. Dashboard visual-first, lịch 6 buổi/nghỉ, tiếp tục chặng, số thời gian thật, đề xuất đời sống/công việc.
3. Tìm kiếm chủ đề, 12 tháng, 52 tuần, chọn ngày; phân biệt PM và PO; Developer có bug/API/test/release.
4. Nghe câu trước chữ; kiểm tra lựa chọn, ghi replay/caption/correct; câu sai được ôn sớm đúng kỹ năng. Không đo năng lực unseen bằng câu đã luyện.
5. Shadowing nhanh/chậm; các giọng US có trên thiết bị được liệt kê thực tế, không giả có giọng thứ hai.
6. Hội thoại 3 lượt, câu hỏi chuyển tình huống, tự nói/thu hoặc nhập chữ. Mẫu câu là hỗ trợ, không chấm đúng bằng việc khớp nguyên văn.
7. Đọc–viết và phản tư, tự lưu bản nháp sau reload, feedback độ dài được ghi đúng nguồn heuristic.
8. Communication 6+4+2′ bằng kịch bản nguyên bản, không sao chép sách.
9. Ôn nhận diện âm/hiểu nghĩa/gọi lại để nói/chuyển tình huống độc lập; max 8 thẻ/lượt, interval hữu hạn 60 ngày, Again ôn lại sớm.
10. Đồng hồ pause khi ẩn trang; trần 3.600s ngày theo Asia/Ho_Chi_Minh chia sẻ giữa các lesson và lượt ôn riêng; hoàn thành sớm không tự ghi đủ 60′.
11. Bản ghi local chỉ sống trong phiên, ngừng stream khi unmount, revoke URL; chỉ upload khi consent; điểm transcript không gọi là điểm phát âm.
12. Tổng kết, nhật ký, dữ liệu chart có bảng tương đương; xuất/reset dữ liệu; lỗi lưu được hiển thị.
13. Cổng chất lượng chỉ đọc: seed chưa duyệt, thiếu quyền hình/audio/assessment giữ publish bị chặn; đổi revision hủy phê duyệt phụ thuộc.
14. Kho đọc Lesson 01 giữ 28 câu, IPA nguồn, nghĩa từng cụm, câu chuyện, nguồn tham khảo; không tự nâng thành nội dung được duyệt.

## Phạm vi nội dung và dịch vụ — giới hạn thực tế

- 52 topic pack gốc có lời thoại nháp; 312 địa chỉ ngày dùng mẫu hoạt động chung. Tuần 1 có 6 cảnh riêng. Chưa có 312 bài độc lập đạt QA, chưa có giáo trình 52 tuần sẵn sàng phát hành.
- Bài nghe nháp có đáp án ở client là **practice**, không phải ngân hàng đề giữ kín. Các mốc checkpoint chưa mở bài đánh giá. Không có transcript held-out được xuất nhầm vì chưa có bank held-out nào được cài đặt.
- Giọng thử của browser không thay thế audio US đã duyệt. API cloud TTS đóng cho tới khi có catalogue utterance/revision được duyệt trên server.
- Hội thoại có kịch bản, chưa có AI hội thoại tự do/feedback ngữ nghĩa; viết có phản hồi heuristic minh bạch. Cần backend được xác thực trước khi bật dịch vụ trả phí công khai.
- App local một người học; chưa có tài khoản, database, CMS có quyền biên tập, đồng bộ đa thiết bị, offline PWA. localStorage không phải kho dữ liệu mã hóa.
- Quyền tái bản hình, crop 4:5 chuyên biệt, corpus validation và biên tập Cambridge/COCA/YouGlish là công việc cần bằng chứng thực, không được tự chuyển thành approved.

## Kiểm tra có thể chạy lại

- `npm run lint`: TypeScript strict.
- `npm test`: IDs/content source; 8 chặng và hai ledger; scheduler độc lập/bounded; 52×6×7 địa chỉ practice; trần stage/ngày/ôn riêng; hoàn thành cần bằng chứng; idempotency; reload; dữ liệu lỗi; múi giờ; publish gate/revision invalidation.
- `npm run test:e2e`: build production, Chromium 8 chặng, transcript gate, assisted fallback, bản nháp sau reload, typed/spoken separation, role change, roadmap, daily cap, microphone denial mô phỏng, viewport 360/390/768/1280/1440, endpoint gate.
- E2E audio dùng speech engine mô phỏng để kiểm tra luồng; chưa chứng minh chất lượng nghe/thu thực tế, WCAG bằng screen reader hoặc kết quả học tập người dùng.
- Lỗi loading phát hiện trên dev server cũ: HMR WebSocket handshake lỗi; production khởi tạo bình thường. Khởi động lại dev server xác nhận `[HMR] connected` và onboarding hiển thị, không sửa hydration để che lỗi.

## Trước khi phát hành công khai

Cần hoàn thành nội dung riêng cho các ngày và rubric; duyệt lexicon/version/coverage; kiểm chứng câu/IPA/audio nhiều giọng; quyền artwork và crop; held-out assessment do người có chuyên môn duyệt; lựa chọn auth/database, quyền CMS và quota; kiểm thử người dùng, keyboard/screen reader/zoom, micro/loa thật và dịch vụ cloud. Các mục này chưa được giả lập thành trạng thái hoàn tất trong giao diện.

Các thay đổi đã có sẵn trước phiên này (gồm hai tài liệu bị xóa trong git status) không được khôi phục hay ghi đè bằng git reset. Tài liệu nguồn trong pack được giữ nguyên.

## Kết quả kiểm tra cuối phiên

- TypeScript strict và production build: **đạt**.
- Logic: **17/17 đạt**.
- Chromium: **12/12 đạt**, gồm toàn bộ 8 chặng, quyền micro bị từ chối mô phỏng, fallback audio bằng chữ, timer pause/resume, kho câu, chữ lớn/reduced motion, dashboard và lesson ở 360/390/768/1280/1440 px.
- `git diff --check`: **đạt**.
- Kiểm tra lexicon với `--require-approved`: **từ chối đúng**, exit 3; đây là cổng đang hoạt động, không phải bài học đã đạt kiểm định.
- Dev tại `http://127.0.0.1:3000`: đã mở lại bằng Chromium; không overflow ở 1440px. Ảnh local nằm trong `artifacts/` và được loại khỏi git.
- CI workflow đã thêm, chưa được chạy trên GitHub trong phiên này. Không triển khai công khai.
