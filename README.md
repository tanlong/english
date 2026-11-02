# Natural English

Ứng dụng luyện tiếng Anh Mỹ cho người Việt đi làm. Nguồn yêu cầu hiện tại là [ENG-BA-SRS-001 v1.0](MD/English_App_ITBA_Documents/English_App_ITBA.md), ngày 02/11/2026.

Luồng chính: **nhìn tình huống → nghe → nói hoặc nhập chữ → nhận góp ý → ôn lại**. Bốn mục điều hướng: Hôm nay, Bài học, Nói chuyện, Ôn tập. Tiến độ, cài đặt, lộ trình và công cụ nâng cao nằm trong trang liên quan.

## Chạy tại máy

Node.js 22.18+ và npm:

```sh
npm ci
npm run db:setup
npm run dev
```

Mở http://localhost:3000. `predev` và `prestart` tự tạo Prisma Client và áp dụng migration. SQLite mặc định ở `prisma/cache.db`; đặt `DATABASE_URL` nếu cần ổ lưu khác. Dữ liệu cũ được giữ; migration mới chỉ bổ sung bảng nội dung và audit.

Sao chép các cấu hình cần dùng trong `.env.example` vào `.env.local`. Không đưa API key hoặc khóa quản trị vào `NEXT_PUBLIC_*`.

## Học và ôn

- `/`: tiếp tục bài đang dở gần nhất, hiển thị số thẻ đến hạn.
- `/roadmap`: bài đã xuất bản theo nhóm xã hội/đời sống, công việc và giao tiếp ứng xử; khu học thử tách riêng.
- `/preview/my-daily-routine`: sáu tình huống từ Lesson 01, ba mức Basic/Better/Natural, nghĩa Việt bật/tắt, âm thanh theo yêu cầu, nhập chữ hoặc nhận diện giọng nói, góp ý Alex và lưu vị trí học.
- `/preview/listen-before-you-answer`: Applied Wisdom minh họa từ đặc tả; ý ngắn, tình huống, hội thoại bốn lượt và thử nói. Chưa xác định nguồn chương, không mạo nhận trích dịch.
- `/lessons/[slug]` và `/api/v1/lessons/[slug]`: chỉ phục vụ snapshot đã được xuất bản; bản nháp trả 404.
- `/review`: thẻ ảnh từ câu đã thực hành. Chỉ hiện lời giải/audio sau khi lật; đổi mặt Việt/Anh; bốn mức tự đánh giá.
- `/daily-speaking`: Alex với Guided Talk, Free Talk, Review và roleplay. Review dùng câu đã thực hành, không khẳng định đó là lỗi. Tự phát âm thanh mặc định tắt.
- `/progress`: bài chính thức và học thử được đếm riêng; số câu trả lời, lượt ôn và thời gian theo hoạt động. Không chứng nhận B1.
- `/path`: định hướng 52 tuần, chỉ có liên kết mở bài khi bài đã xuất bản. Tên chủ đề không được xem là bài hoàn chỉnh.
- `/settings`: mục tiêu 5/10/15/30/60 phút, vai trò, hỗ trợ tiếng Việt, cỡ chữ, xuất/xóa dữ liệu.

Bài học thử và bản dịch bổ sung **chưa được chứng nhận chất lượng ngôn ngữ/quyền ảnh**. Không có bộ 1.500 từ đã được phê duyệt được nhập sẵn. Những nội dung này chỉ tồn tại ở không gian preview cho đến khi hoàn thành kiểm duyệt.

Câu đã gửi và bản nháp chưa gửi đều được lưu. Trình duyệt giữ tiến độ khi mất kết nối; `/api/learning` sao lưu theo cookie HttpOnly riêng. Đây là định danh trình duyệt, chưa phải tài khoản đồng bộ nhiều thiết bị. Giữ lại lịch sử các buổi học cũ `/session/[sessionId]`; pipeline cũ vẫn là công cụ tương thích, không phải luồng phát hành mới.

Lịch ôn `leitner-v1`: Chưa nhớ → 10 phút; Khó → 1 ngày; Nhớ → ít nhất 2 ngày, gấp đôi khoảng trước; Dễ → ít nhất 4 ngày, gấp ba khoảng trước. Cùng event ID không cập nhật lần hai. Lịch ôn được gắn cả revision nội dung.

Thời gian hoạt động là **ước lượng**: chỉ tính khi tab hiển thị và có tương tác trong 30 giây gần nhất, hoặc đang phát audio/nhận diện mic. Không tính thời gian chờ AI. Không khóa bài khi đạt mục tiêu ngày. Phân bổ 80% nghe–nói / 20% đọc–viết là mục tiêu thiết kế học tập, không phải thành tích mặc định.

## Alex và âm thanh

`OPENAI_API_KEY` bật góp ý và TTS. Các tùy chọn hiện có: `OPENAI_MODEL`, `OPENAI_TTS_MODEL`, `OPENAI_TTS_VOICE=cedar`. Không cần key để mở bài, nhập câu và dùng thẻ ôn. Provider lỗi giữ nguyên câu đã nhập, báo chưa có đánh giá và cho đối chiếu câu mẫu/tiếp tục. Không tạo phản hồi giả.

Audio học thử dùng TTS theo allowlist; audio bài chính thức dùng manifest đúng văn bản/revision do Reviewer QA. Cache TTS nội dung học được chia sẻ; cache giọng Alex và bản nhận diện được gắn với hồ sơ trình duyệt, được xóa cùng hồ sơ. Yêu cầu không có hồ sơ hợp lệ không lưu cache cá nhân. Phản hồi AI có schema kiểm tra; không suy ra lỗi phát âm từ transcript. Nhận diện mic dùng dịch vụ Web Speech của trình duyệt, cần consent riêng, luôn có nhập chữ thay thế. Raw audio không được lưu dài hạn bởi ứng dụng.

API dùng AI có quota 15 phút theo cookie trong mỗi tiến trình: 60 lượt cho mỗi nhóm hội thoại hoặc nhận diện, 20 lượt phân tích tranh luận và 120 lượt cho mỗi nhóm TTS. Ngoài ra, `PROVIDER_GLOBAL_LIMIT` giới hạn tổng lượt của mọi nhóm trong tiến trình, mặc định 600. Cookie có thể bị thay đổi, nên giới hạn tổng chỉ là trần chi phí cục bộ, không thay thế đăng nhập, giới hạn theo danh tính đáng tin cậy hoặc quota dùng chung tại gateway khi triển khai nhiều instance.

Cache cá nhân từ phiên bản trước không có thông tin chủ sở hữu. Phiên bản này không đọc lại các bản nhận diện hoặc giọng Alex cũ, nhưng không tự xóa chúng khỏi SQLite vì không thể xác định chủ sở hữu. Cần xử lý tồn lưu theo chính sách dữ liệu và bản sao lưu trước khi sử dụng chức năng xóa cho dữ liệu cũ.

## Content Studio

Mở `/admin`, độc lập với onboarding. Cấu hình **ba khóa ngẫu nhiên khác nhau, mỗi khóa ít nhất 32 ký tự**:

```dotenv
CONTENT_EDITOR_TOKEN=
CONTENT_REVIEWER_TOKEN=
CONTENT_ADMIN_TOKEN=
```

Khóa chỉ giữ trong bộ nhớ tab, gửi qua Authorization header; máy chủ xác định vai trò và kiểm tra mọi thao tác. Để trống sẽ khóa truy cập. Đây là cơ chế cho pilot riêng; cần danh tính và đăng nhập từng người trước khi phát hành CMS công khai.

1. **Editor:** nhập bản nháp từ đặc tả hoặc tạo bài mới, sửa JSON, khai báo chứng cứ/lexical mapping, lưu revision và gửi duyệt.
2. **Reviewer:** nhập bộ 1.500 lemma thực đã được biên tập; kiểm tra nghĩa, nguồn Cambridge/COCA/YouGlish, IPA, quyền ảnh, ngoại lệ và phê duyệt.
3. **Reviewer:** sau phê duyệt, sinh và nghe QA audio bằng quy trình biên tập; gắn manifest URL HTTPS, text và revision. Máy chủ bổ sung SHA-256 của text. Chưa tự động sinh hàng loạt audio trong CMS.
4. **Admin:** xuất bản khi đủ gates; gỡ bài hoặc khôi phục snapshot đã xuất bản từ audit.

Sửa bài tạo revision mới, đưa về Draft và xóa audio/phê duyệt của bản nháp. Snapshot đang phục vụ người học không đổi cho đến lần xuất bản tiếp theo. Rollback chỉ đổi snapshot công khai, không ghi đè bản đang biên tập. Bảng audit ghi vai trò và thao tác, gồm từ chối quyền đã nhận diện; hiện chưa thay thế danh tính từng người.

Lexicon import:

```json
{
  "version": "core-v1",
  "approvedBy": "Tên người duyệt",
  "entries": [
    {
      "lemma": "get",
      "forms": ["gets", "got", "gotten"],
      "meaningVi": "lấy/nhận",
      "source": "https://example.org/source"
    }
  ]
}
```

Ví dụ cấu trúc trên chỉ có một mục, **sẽ bị từ chối**. Import thật yêu cầu đúng 1.500 lemma duy nhất, nguồn HTTPS, nghĩa Việt và forms không xung đột. Mapping dùng forms được khai báo, không đoán bằng cách cắt đuôi từ. Contractions cần được biên tập trong forms; hiện đếm mỗi contraction là một surface token, quy ước này cần reviewer xác nhận khi duyệt lexicon.

Độ phủ là `core / (core + expansion) × 100`, tính trên lượt từ trong câu ba mức, prompt và hội thoại authored. Số/dấu câu không vào mẫu số; proper nouns tách riêng; unmapped được báo riêng và chặn xuất bản. Đếm types và tokens riêng. Ngưỡng 95% hoặc ngoại lệ có lý do được Reviewer duyệt. Không áp tỷ lệ này lên câu tự do của người học.

## Kiểm tra

```sh
npm run check
npm run build -- --webpack
npx playwright test --workers=3
```

Webpack là tùy chọn chính thức được dùng khi Turbopack bị môi trường chặn mở cổng xử lý CSS. Các ca API quản trị dùng database tạm và lexicon tổng hợp chỉ cho test; không nhập dữ liệu giả vào database học tập. Playwright tắt API key/cloud speech và dùng database riêng ở `artifacts/e2e-cache.db`.

Chi tiết phạm vi, gates và các phần chờ dữ liệu/người duyệt: [bàn giao bản làm lại](docs/REBUILD_BASELINE.md). Kết quả rà soát và giới hạn bảo mật hiện tại: [rà soát source](docs/SOURCE_HARDENING.md).
