# Bàn giao bản làm lại — 02/11/2026

Nguồn yêu cầu: `MD/English_App_ITBA_Documents/English_App_ITBA.md`, ENG-BA-SRS-001 v1.0. Những mục `[BA ĐỀ XUẤT]` chưa trở thành quyết định production chỉ vì đã có mã triển khai.

| Yêu cầu              | Triển khai hiện tại                                                                                                         | Điều kiện còn lại                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| FR-01 Onboarding     | Hồ sơ/ngữ cảnh, mục tiêu phút, bài làm quen nghe và trả lời có bỏ qua                                                       | Bộ đánh giá đã kiểm định và rubric đầu vào                                                                       |
| FR-02 Today          | Một CTA học/tiếp tục, bài đang dở gần nhất, thẻ đến hạn                                                                     | Cá nhân hóa gợi ý khi có nhiều bài xuất bản                                                                      |
| FR-03 Guided Lesson  | Ảnh, ba mức câu, hỗ trợ Việt, audio, lưu vị trí                                                                             | Duyệt toàn bộ nội dung, quyền ảnh và audio thật                                                                  |
| FR-04 Practice       | Mic consent, transcript sửa được, nhập chữ, AI feedback, giữ dữ liệu khi lỗi                                                | QA định tính góp ý với provider thật                                                                             |
| FR-05 Alex           | Guided/Free/Review; tái dùng engine schema hiện có, giọng Cedar có cấu hình                                                 | API vẫn có adapter `reply/explanationVi/speakingVersions`, chưa đổi toàn bộ sang schema JSON đề xuất trong §09.3 |
| FR-06 Flashcards     | Ảnh, đổi mặt Việt/Anh, lật rồi hiện audio, bốn rating, lịch version hóa, event idempotency                                  | Scheduler thích ứng phức tạp và thử nghiệm hiệu quả học                                                          |
| FR-07 Learning Path  | 52 tuần định hướng, API/trang chính thức chỉ mở snapshot published                                                          | 52 tuần chưa có đủ bài được biên soạn và duyệt                                                                   |
| FR-08 Applied Wisdom | Preview AW-01 ngắn, hội thoại bốn lượt, thử nói; gate chapter/nguồn khi publish                                             | Nguồn chương, học thuật, diễn giải và ngôn ngữ cần người duyệt                                                   |
| FR-09 Progress       | Đếm bài thật và học thử riêng, câu trả lời, ôn, thời lượng theo hoạt động có nhãn ước lượng                                 | Rubric kỹ năng, thống kê dùng từ thành công dựa chứng cứ                                                         |
| FR-10 CMS            | Draft → Review → Approved → Published, revision, snapshot, rollback, audit, quyền server                                    | SSO theo từng người, không dùng khóa vai trò chung cho CMS công khai                                             |
| FR-11 Governance     | Import 1.500 lemma, forms, token/type coverage, expansion/proper noun/unmapped; 95% hoặc ngoại lệ; audio text/revision/hash | Danh sách thật 1.500 lemma; xác nhận quy ước contractions; QA bản thu, license/provenance chi tiết               |
| FR-12 Privacy        | Consent mic, text fallback, export/delete local + server, raw audio không lưu dài hạn                                       | Chính sách retention/legal đã duyệt, tắt lưu lịch sử, job export/delete với tài khoản production                 |

## Những lựa chọn triển khai cho pilot

- Giữ Next.js/React/TypeScript, Prisma 7 và SQLite hiện có; thêm migration không xóa dữ liệu. Chưa chuyển PostgreSQL hoặc thêm refine.dev vì đặc tả ghi là phương án đề xuất.
- CMS dùng editor JSON cùng preview 430 px và gates trên server; chưa có trình soạn thảo trực quan nhiều trường.
- Ba bearer token riêng cho Editor/Reviewer/Admin; khóa tối thiểu 32 ký tự, không lưu localStorage. Đây là phân quyền vai trò cho môi trường riêng, chưa có danh tính cá nhân.
- Không tự xác nhận một câu, nguồn, IPA, audio hay ảnh đã được người có thẩm quyền duyệt. Các seed chỉ vào Draft và khu Preview.
- Bài chính thức phát audio URL HTTPS do Reviewer xác nhận đúng text/revision; SHA-256 text được tạo trên server. CMS chưa tự sinh/đọc kiểm định nội dung MP3 hay lưu hash byte audio.
- Lexical normalization dựa forms khai báo. Contraction là một surface token trong phiên bản validator này; không suy ra tỷ lệ bao phủ ngoài đời từ 1.500 mục từ.
- Lịch ôn và vị trí học nằm trong learning state hiện có, sao lưu qua API/cookie trình duyệt; snapshot content có revision riêng.
- Quota provider nằm trong tiến trình; trước nhiều instance cần gateway/storage dùng chung.
- Các trang IPA, tranh luận và phiên học cũ được giữ tương thích, đưa ra khỏi bốn tab chính.

## API chính

| API                          | Quyền / hành vi                                                                                            |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `GET /api/v1/lessons`        | Chỉ snapshot đã xuất bản                                                                                   |
| `GET /api/v1/lessons/[slug]` | Bản nháp/đã gỡ trả 404                                                                                     |
| `GET /api/content-admin`     | Token vai trò; trả bản nháp, gates, lexical analysis và audit                                              |
| `POST /api/content-admin`    | Origin + role server-side; action seed/create/save/submit/approve/audio/publish/unpublish/rollback/lexicon |
| `/api/learning`              | State hồ sơ, visit, draft, review và dữ liệu tương thích cũ                                                |
| `/api/daily-speaking`        | Tutor hiện có, bổ sung mode review và câu ôn đã luyện                                                      |

Mọi mutation nội dung theo revision hiện tại. Sửa nội dung làm mất phê duyệt/audio của draft; snapshot published trước đó giữ nguyên. Reviewer không xuất bản, Admin không tự approve, Editor không approve. Không thể publish nếu thiếu bộ từ, unmapped chưa giải quyết, thiếu chứng cứ, IPA chưa đối chiếu, quyền ảnh chưa xác nhận, audio cũ hoặc Wisdom thiếu provenance.

## Trước production

Cần chủ nội dung cung cấp/duyệt 1.500 lemma, bài học, chứng cứ và quyền asset; duyệt chính sách dữ liệu; chọn hạ tầng và đăng nhập từng người; đánh giá AI thực tế. Các bản vá và giới hạn bảo mật mới được ghi trong [SOURCE_HARDENING.md](SOURCE_HARDENING.md). Không coi bản pilot này là toàn bộ MVP production đã nghiệm thu.

## Kết quả kiểm tra bản bàn giao

- TypeScript: đạt (bước TypeScript trong build; lệnh hiện tại là `npm run typecheck`).
- Logic/API: 40 ca đạt (`npm test`), gồm workflow nội dung trên database tạm.
- Trình duyệt: 54 ca đạt (`npx playwright test --workers=3`), gồm mobile/desktop, tiếp tục sau reload, flashcard/rating, quyền quản trị, mic fallback, lỗi provider và các công cụ tương thích.
- Production build: đạt bằng `npm run build -- --webpack` tại thời điểm bàn giao; kết quả cập nhật có trong báo cáo rà soát source.
- Kiểm tra bố cục: 360/390/430/768/1280 px; ảnh chụp ở `artifacts/natural-*.png`.
- Không dùng provider AI thật trong kiểm thử trình duyệt; chưa xác nhận chất lượng ngôn ngữ hoặc giọng nói thực tế từ các ca mock.
