# Natural English

Ứng dụng học American English cho người Việt đi làm, xây theo `MD/visual_english_webapp_pack` v1.1. Giao diện và luồng học chạy tại máy; nội dung dùng để luyện tập, chưa phải giáo trình đã duyệt.

Bài lõi giữ 3 bước trong khoảng 12 phút. Phân bổ nội dung dự kiến là **80% đời sống/công việc (576 giây), 20% Đắc Nhân Tâm (144 giây)**: phần Đắc Nhân Tâm gồm nghe 72 giây, phản hồi 48 giây và ghi một câu áp dụng 24 giây, lồng vào ba bước hiện có. Đây là kế hoạch nội dung; đồng hồ ghi thời gian thực theo bước, chưa đo riêng hai nhóm nội dung và không ép chờ đủ thời gian. Buổi mới dùng `conversation-v2`, cần có lượt nghe, phản hồi và câu áp dụng Đắc Nhân Tâm để hoàn thành; lịch sử `conversation-v1` được giữ nguyên. Chủ đề giao tiếp khớp 12 chủ đề tháng, áp dụng cho mọi vai trò. Trong AI Lead, chế độ guided được hướng dẫn dành khoảng một trong năm cơ hội luyện cho kỹ năng quan tâm/lắng nghe; trò chuyện tự do không cam kết tỷ lệ thời gian.

Câu mẫu và góp ý AI Lead hiển thị hai bảng văn nói (ngắn gọn / đầy đủ). Mục **Xem bản đúng ngữ pháp** mặc định đóng; bấm mới hiện câu giữ cách diễn đạt ban đầu và chỉ sửa lỗi thật. Hai bản văn nói cũng phải đúng ngữ pháp. Mỗi bản có nghĩa tiếng Việt và nút nghe riêng; mở mục ngữ pháp không tự phát âm thanh.

## Cá nhân hoá và một bài tranh luận cập nhật

Hồ sơ và tiến độ được sao lưu vào SQLite qua `/api/learning`, giữ bản trên trình duyệt khi mất kết nối. Cookie ngẫu nhiên HttpOnly gắn dữ liệu với trình duyệt, không dùng một hồ sơ chung cho mọi người. Đây chưa phải tài khoản đăng nhập hay đồng bộ nhiều thiết bị. Ở Cài đặt, bạn có thể xem/bỏ ghi nhớ, duyệt hoặc xoá câu mẫu riêng và xóa cả dữ liệu máy chủ lẫn trình duyệt.

Bộ nhớ được tổng hợp từ kết quả nghe, các buổi đã hoàn thành và tối đa 120 buổi thoại gần nhất. Chỉ câu trả lời của người học được tính; lời AI, gợi ý và thao tác UI không trở thành thành tích. Nhận xét sửa lỗi của AI là gợi ý có trích câu gốc, có thể bỏ nếu chưa phù hợp. Câu đã dùng lại đúng trong buổi sau được giãn lịch ôn (1/3/7 ngày theo quy tắc của ứng dụng, chưa phải thuật toán đã được kiểm định cho từng người). Trả lời đúng khi vẫn dùng phụ đề không tự xóa điểm cần ôn nghe. AI Lead nhận hồ sơ, chủ đề gần đây, mục cần ôn và các câu mẫu do người học chủ động duyệt; không tự phê duyệt câu AI tạo ra.

Trong **Tranh luận → Chọn chủ đề luyện nhanh**, bốn chủ đề cũ được giữ và chỉ thêm **một thẻ Bài dành cho bạn**. Bài được chọn từ tám tình huống luyện gốc dựa trên mục tiêu, nội dung cần ôn, chủ đề gần đây và ngày học; nút **Cập nhật bài gợi ý** thay thế bài tại chính thẻ đó. Thẻ làm mới sau khi lưu kết quả, khi quay lại trang và mỗi phút khi trang hiển thị. Chỉ bấm **Luyện bài này** mới thay nội dung trong ô soạn và yêu cầu xác nhận gửi OpenAI lại. Làm mới thẻ không tạo cuộc tranh luận, không gọi AI trả phí và không chứng nhận nội dung là bài học đã qua cổng biên tập. Sau khi trao đổi, bấm **Kết thúc & lưu buổi tranh luận** để đưa các lượt trả lời thật vào bộ nhớ. Phân bổ 576/144 giây trong bài lõi vẫn được giữ riêng; luyện tranh luận tùy chọn không tự cộng vào thời lượng đó.

## Chạy ứng dụng

Yêu cầu Node.js 22.18+ và npm.

```sh
npm ci
npm run db:setup
npm run dev
```

Mở http://localhost:3000. Đặt `OPENAI_API_KEY` trong `.env.local` để phát câu mẫu bằng giọng AI Anh-Mỹ Nova hoặc Alloy. Nova mặc định cho nghe hội thoại (1×); Alloy cho shadowing (0.8× hoặc 1×). App luôn tìm MP3 trong SQLite qua Prisma trước; chưa có mới gọi OpenAI và lưu audio vào DB. Đổi tốc độ phát không tạo thêm audio; đổi giọng dùng bản lưu riêng. Dữ liệu giữ lại sau khi khởi động server và vẫn dùng được khi bỏ API key.

Mục **Luyện giao tiếp hằng ngày / Daily Speaking** (`/daily-speaking`) tích hợp từ [daily_speaking_agent_package](MD/daily_speaking_agent_package/README.md). AI Lead trò chuyện tự do, luyện theo Lesson 01 hoặc đóng vai tình huống. Chọn mục tiêu 5/10/15 phút, tốc độ Slow/Normal và giải thích tiếng Việt Khi cần/Luôn hiển thị/Chỉ khi bấm hỏi. Đồng hồ đếm thời gian màn hình đang hiển thị, không ép kết thúc. Gợi ý, bỏ qua và giải thích không tính là lượt người học; giải thích bám vào câu hỏi gần nhất. Kết thúc có tổng kết dựa trên hội thoại, tối đa 3 sửa lỗi và bài nói 30 giây. Đây là phản hồi AI về nội dung, không chấm phát âm.

Daily Speaking dùng `OPENAI_API_KEY` có sẵn; tùy chọn `OPENAI_MODEL=gpt-4.1-mini`, `OPENAI_TTS_MODEL=gpt-4o-mini-tts`, `OPENAI_TTS_VOICE=cedar` trong `.env.local`. Key chỉ dùng trên máy chủ. Hội thoại gọi [Responses API với Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses), tách `reply` và `explanationVi`; chỉ phần tiếng Anh được đọc. [Giọng TTS Cedar](https://developers.openai.com/api/docs/guides/text-to-speech) mặc định hướng tới giọng nam Anh-Mỹ, với hướng dẫn nhấn ý, nối âm và ngắt theo cụm để tránh đọc đều từng chữ; cần nghe kiểm định trên thiết bị. MP3 được lưu trong SQLite như các câu mẫu; đổi giọng hoặc hướng dẫn đọc sẽ tạo cache riêng, không dùng lại bản cũ. Slow dùng lại MP3 và đổi tốc độ phát. Tắt **Tự phát giọng AI Lead** nếu chỉ muốn đọc. API lỗi giữ bản nháp và cho gửi lại; không tự chuyển sang kịch bản mẫu.

Nhập mic dùng Web Speech Recognition (tùy trình duyệt), cần đồng ý và cấp quyền; dịch vụ của trình duyệt có thể xử lý âm thanh trực tuyến, độc lập với `ENABLE_CLOUD_SPEECH`. Bản chép hiển thị để kiểm tra trước khi gửi. Luôn có nhập chữ khi mic không hỗ trợ hoặc bị từ chối. Các lượt qua mic và nhập chữ được đếm riêng. Phần hiển thị hội thoại và đồng hồ đặt lại khi rời Daily Speaking; câu trả lời và kết quả được lưu riêng trong SQLite cho cá nhân hoá. Thời lượng này chưa cộng vào tiến độ pipeline. API gửi `store: false`; lưu trữ học tập do ứng dụng quản lý.

Database mặc định là `prisma/cache.db`, có thể đổi bằng `DATABASE_URL="file:./prisma/cache.db"` trong `.env.local`. Đường dẫn tương đối tính từ thư mục dự án; khi triển khai cần ổ đĩa bền vững có quyền ghi. `npm run dev` và `npm start` tự chạy setup trước khi mở server: tạo Prisma Client, áp dụng migration, nhập MP3 cũ từ `.cache/tts/` (hoặc `TTS_CACHE_DIR`) vào DB mà không ghi đè dữ liệu đã có. File MP3 cũ được giữ nguyên. Schema và migration được quản lý bằng [Prisma SQLite](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/sqlite); database và client sinh tự động không được commit.

Khóa TTS bao gồm model, giọng, nội dung và hướng dẫn đọc. Yêu cầu đồng thời cùng khóa dùng chung một lần tạo trong mỗi tiến trình; nếu triển khai nhiều worker cần thêm khóa DB để chống gọi trùng giữa worker. Nếu không đọc được DB, app báo lỗi và không gọi API thay thế. API TTS hỗ trợ [Nova/Alloy và MP3 theo tài liệu OpenAI](https://developers.openai.com/api/reference/resources/audio/subresources/speech/methods/create).

Nhận diện bản ghi trực tuyến là tùy chọn: đặt `OPENAI_API_KEY` và `ENABLE_CLOUD_SPEECH=true` trong `.env.local`. Khi người học đồng ý và bấm kiểm tra, app tìm transcript trong SQLite theo mã băm nội dung file + model + ngôn ngữ; chỉ gửi OpenAI khi chưa có. Bấm lại cùng bản ghi dùng kết quả đã lưu; bản thu mới có mã băm khác sẽ được nhận diện riêng. Transcript đã lưu vẫn dùng được khi tắt cloud hoặc bỏ API key. App không lưu file thu âm; transcript được lưu trong DB. Điểm được tính lại cục bộ theo câu mẫu hiện tại, chỉ đo độ khớp nội dung, không phải điểm phát âm hay năng lực giao tiếp. Phản hồi API lỗi không được cache. Không có gọi dịch vụ trả phí tự động khi mở bài. Không bật endpoint trả phí trên môi trường công khai trước khi có xác thực và kiểm soát quota.

## Luồng học

- Luyện IPA (`/ipa`): 44 mục luyện gồm 40 mục Anh-Mỹ và 4 mục Anh-Anh bổ sung (`/ɒ/`, `/ɪə/`, `/eə/`, `/ʊə/`), chia 12 nguyên âm đơn, 8 nguyên âm đôi và 24 phụ âm. Các mục bổ sung có nền đỏ nhạt và nhãn Anh-Anh; ký hiệu Anh-Anh tương ứng trên những mục còn lại có nhãn UK, không tạo mục trùng. Có khẩu hình bằng chữ, nghe mẫu ở hai tốc độ, nghe chọn từ và thu âm/nghe lại bằng component dùng chung. Anh-Mỹ dùng Nova qua whitelist/cache TTS; mục Anh-Anh dùng giọng `en-GB` của thiết bị và báo rõ nếu chưa có giọng, giữ câu hỏi chưa trả lời. Đây là bảng đối chiếu hai giọng, không phải một kho âm vị đồng nhất cho mọi giọng tiếng Anh. Dấu đã luyện tự lưu trong `natural-english:v2`, đi cùng bản xuất và đặt lại dữ liệu. Đây là tự đánh dấu, không phải chứng nhận phát âm; thời lượng IPA chưa cộng vào đồng hồ pipeline. Video tham khảo là [42 Ngày Phát Âm – Dan Hauer](https://www.youtube.com/watch?v=Qejo8-epylk&list=PL7YqrWXed1abz3FwdKMZEwclWMZ2cMHio), mở từ video giới thiệu và chỉ tải khi bấm xem. Ghi chú được viết riêng; đối chiếu [Sounds American](https://soundsamerican.net/) và [bảng âm Anh-Anh](https://cambridgeveritas.com/tools/accent-enhancer). Không dùng TTS đọc ký tự IPA rời.

- Onboarding: tên, mục đích, vai trò ITBA/UX/UI/PM/Developer/PO/General, mức tự tin và cách luyện.
- Hôm nay: một tình huống, một mục tiêu, một nút bắt đầu/tiếp tục và pipeline 3 bước. Đổi tình huống qua Danh sách bài học; lịch tuần và các thẻ luyện thêm không chiếm trang chính.
- Lộ trình: đủ 52 chủ đề/12 tháng từ blueprint hiện hành; 312 địa chỉ bài luyện, dùng topic pack và mẫu hoạt động chung. Tuần 1 có 6 tình huống riêng. Đây **không phải 312 bài đã biên tập độc lập**.
- Luồng giao tiếp mới: **Nghe mẫu 2′ → Bạn lên tiếng 8′ → Dùng ngoài đời 2′**. Khoảng 12 phút là thời lượng gợi ý, không phải điều kiện chờ để hoàn thành. Một tình huống và một mục tiêu giao tiếp xuyên suốt.
- Shadowing nằm trong phần luyện thêm; IPA và hội thoại AI tự do mở riêng. Bước cuối chọn lúc dùng câu, không bắt buộc viết bài.
- Người học có thể mở ngay bất kỳ chủ đề nào; lộ trình vẫn gợi ý bài chưa hoàn thành tiếp theo. Danh sách có bộ lọc Đời sống/Công việc.
- Đồng hồ đo thời gian thực tế, dừng khi ẩn trang, không tự cộng thời gian khi bấm hoàn thành. Tổng thực học tối đa 60′/ngày theo múi giờ Việt Nam.
- Nghe trước chữ, mở transcript sau câu trả lời. Hỗ trợ chữ được ghi nhận riêng. Câu trả lời và số lần nghe lại được lưu cùng bài học.
- Nói hoặc nhập chữ, 3 lượt phản hồi có hướng dẫn: trả lời, thử thay đổi và hỏi tiếp sau khi nghe người đối diện. Mỗi lượt có mục tiêu và gợi ý riêng khi bí; lượt đã lưu thu gọn. Nhập chữ không được tính là nói. Bài học dùng kịch bản; mục Daily Speaking riêng hỗ trợ AI hội thoại tự do.
- Bản nháp viết, câu trả lời và bước đang học tự lưu trong localStorage, có xuất bản sao. Dữ liệu tám chặng được chuyển sang `planVersion: conversation-v1`, giữ tổng giây thực học, bằng chứng, bản nháp và lịch sử hoàn thành hợp lệ. Dữ liệu JSON không đọc được được giữ bản sao phục hồi.
- Lesson 01 vẫn làm nguồn nội dung cho luyện hội thoại. Mục Ôn tập, kho thẻ/câu, lịch ôn tự động và chế độ ôn trong Daily Speaking đã được gỡ. Dữ liệu cũ vẫn đọc được tiến độ bài học, câu mang theo và tổng thời gian đã học; trường lịch ôn không còn được lưu.

Nghiên cứu và chính sách luồng mới: [COMMUNICATION_LEARNING_RESEARCH.md](MD/COMMUNICATION_LEARNING_RESEARCH.md), [đối chiếu chương trình và thiết kế Hôm nay](MD/TODAY_LISTEN_SPEAK_RESEARCH.md). Phần triển khai hiện hành trong tài liệu này thay thế phân bổ tám chặng/60 phút bắt buộc ở blueprint cũ.

## Cấu trúc

```text
app/layout.tsx                    Root layout, metadata, theme
app/(learning)/layout.tsx         LearningProvider + AppShell dùng chung
app/(learning)/page.tsx           Giao tiếp mỗi ngày (/)
app/(learning)/roadmap/           Danh sách bài học (/roadmap)
app/(learning)/ipa/               Luyện phát âm IPA (/ipa)
app/(learning)/settings/          Hồ sơ, xuất dữ liệu (/settings)
app/(learning)/daily-speaking/    Hội thoại với AI Lead (/daily-speaking)
app/(learning)/session/[sessionId]/ Buổi học có thể mở lại bằng URL
app/components/ui/               shadcn/ui: Button, Card, Input, Textarea,
                                 Badge, Checkbox, Label, Combobox
app/components/form-field.tsx    Nhãn và bố cục field dùng chung
app/components/select-combobox.tsx Combobox chọn một giá trị dùng chung
app/components/                  Giao diện các tính năng học tập
app/content/                     Topic packs, Lesson 01, vai trò, gate biên tập
app/learning/                    Provider, trạng thái, persistence
app/speaking/                    Prompt server và hook hội thoại ở client
app/audio/                       Phát audio AI; dừng khi đổi màn hình
app/api/                         Nhận diện, TTS và hội thoại Daily Speaking
app/globals.css                  Tailwind v4, token shadcn, base styles
app/styles/                      CSS cho artwork và layout riêng từng tính năng
lib/                             cn(), định dạng thời lượng, tải bản sao
components.json                  Cấu hình shadcn/ui Base UI, alias @/
postcss.config.mjs               Tailwind PostCSS
scripts/                         Kiểm tra logic bằng node:test
 tests/                          Kiểm thử Chromium
```

`natural-english:v2` là khóa dữ liệu mới. Các khóa `daily-flow-*` từ ứng dụng trước được giữ; không quy đổi các lượt cũ thành chặng hoặc chứng nhận mới. Dữ liệu hiện chỉ đồng bộ giữa các tab cùng trình duyệt, chưa đồng bộ tài khoản.

UI dùng [shadcn/ui với Base UI](https://ui.shadcn.com/docs/components/base/combobox) và [Tailwind CSS v4 qua PostCSS](https://tailwindcss.com/docs/installation/framework-guides/nextjs). Component nền nằm trong `app/components/ui/`, dùng `cn()` để ghép và ghi đè class, `cva` cho các biến thể. Component Base UI dùng `render`, ví dụ `<Card render={<section />} />`; không lồng link vào trong button. Dùng `Button` với `variant`, `FormField` với nhãn và `SelectCombobox` cho lựa chọn có tìm kiếm, thay vì sao chép CSS hoặc tạo component riêng cho cùng một control.

Các màn hình dùng route App Router và `next/link`; layout giữ một `LearningProvider` khi đổi trang. Các bookmark cũ của những màn hình còn dùng vẫn hoạt động; `/#review` quay về Hôm nay, `/review` không còn tồn tại. Hồ sơ, bài viết và tiến độ tiếp tục dùng khóa localStorage hiện có. Route session dùng `params` bất đồng bộ theo Next.js đang cài. Logic mic/API/timer của AI Lead nằm trong `useDailySpeaking`, tách khỏi component hiển thị. CSS riêng cho minh họa, bố cục và breakpoint được giữ trong cascade layer `components`, để utility Tailwind có thể ghi đè. `globals.css` chỉ khai báo theme, import và base styles.

Minh hoạ ở “Cách đặt miệng” dùng `IpaMouthDiagram` và dữ liệu `ipa-articulation.ts`: hình cắt ngang, môi nhìn chính diện, luồng hơi, điểm tiếp xúc và rung thanh quản cho 44 mục. Có 60 trạng thái; nguyên âm đôi chuyển giữa điểm đầu/cuối, phụ âm bật/tắc-xát chuyển chặn/nhả. Đây là sơ đồ vị trí tương đối, thay đổi theo người nói và âm đi kèm; tham khảo thêm [Sounds of Speech – University of Iowa](https://soundsofspeech.uiowa.edu/). SVG có tên/mô tả cho trình đọc màn hình, nút chuyển bước dùng bàn phím, không tự chạy chuyển động.

## Tranh luận từ nội dung

Menu **Tranh luận** (`/debate`) nhận nội dung theo hai cách: **Nhập nội dung** vào textarea hoặc **Tải tệp TXT / SRT**. Tệp tối đa 1 MB, hỗ trợ UTF-8/UTF-16; nội dung tiếng Anh từ 80–60.000 ký tự. SRT được bỏ số thứ tự, mốc thời gian và định dạng chữ cơ bản trước khi phân tích. Máy chủ chỉ nhận văn bản, TXT và SRT cho tính năng này.

Sau khi đồng ý gửi nội dung đến OpenAI, chọn **Tạo cuộc hội thoại**. AI dùng `OPENAI_API_KEY` và `OPENAI_MODEL` hiện có để tạo mức CEFR gợi ý theo từ vựng/cấu trúc câu, tóm tắt, ý chính, câu then chốt Anh–Việt và câu hỏi mở đầu. Cuộc hội thoại tự bắt đầu bằng câu hỏi đầu tiên; người học nêu quan điểm, đồng ý hoặc phản biện. Tệp và nội dung nhập được giữ để thử lại nếu API lỗi.

Luyện theo **P–R–E–C**: Point (quan điểm) → Reason (lý do) → Example (ví dụ) → Conclusion (kết luận). Người học chọn đồng ý, không đồng ý, đồng ý một phần hoặc chọn sau; lựa chọn được kiểm tra và ký cùng context của cả textarea, TXT và SRT. AI được hướng dẫn dùng tiếng Anh A2–B1, câu ngắn, mỗi lần phát triển một ý, hỏi tiếp bước còn thiếu và phản biện lịch sự. CEFR của tài liệu vẫn được đánh giá riêng. Các nút câu gợi ý thêm starter vào bản nháp, giữ phần đã nhập và không tự gửi. Có kho câu Anh–Việt và bốn chủ đề mẫu có thể sửa: học online, điện thoại ở trường, AI trong đời sống và tiền. Trải nghiệm cá nhân/ví dụ giả định đúng chủ đề được tiếp nhận như lời người học hoặc khả năng minh họa; AI không coi đó là sự kiện đã kiểm chứng bằng nguồn.

Mỗi lượt thoại có nút loa **Nghe câu này**, dùng giọng đọc và cơ chế phát/dừng âm thanh hiện có; chỉ gửi yêu cầu khi bấm. Từ/cụm tiếng Anh được tô đỏ trong hội thoại, câu then chốt và phần trích nguồn. Bộ từ gồm 3.000 từ theo tần suất lời thoại từ [FrequencyWords](https://github.com/hermitdave/FrequencyWords), kết hợp cụm tự nhiên của ứng dụng và các cụm dùng khi tranh luận. Khớp nguyên từ, ưu tiên cụm dài, giữ nguyên chữ và dấu câu; hỗ trợ dấu nháy cong và dạng rút gọn thông dụng. Danh sách tần suất có cả tên riêng và dạng biến đổi, không dùng để chấm CEFR. Xem [nguồn và giấy phép dữ liệu](app/debate/common-words.LICENSE.md).

Bạn có thể **Trả lời bằng giọng nói** sau khi tích đồng ý chuyển giọng nói thành chữ. Nhận diện bằng trình duyệt, đặt `en-US`, giữ nội dung đã nhập và nối phần vừa nói vào ô trả lời; không tự gửi. Bấm **Dừng mic**, sửa chữ nếu cần rồi **Gửi quan điểm**. Mic dừng khi đạt 2.000 ký tự, chuyển tab hoặc rời trang; âm thanh phát được dừng trước khi mở mic. Trình duyệt không hỗ trợ hoặc bị chặn quyền sẽ hiện hướng dẫn và vẫn cho nhập chữ. Cơ chế nhận diện được dùng chung với mục Giao tiếp qua `useSpeechInput`.

AI chỉ dựa vào nguồn đã cung cấp và dẫn mã bằng chứng. Câu ngoài chủ đề hoặc chưa đủ căn cứ có cảnh báo; câu trích tiếng Anh được lấy trực tiếp từ nguồn và máy chủ chặn mã bằng chứng không tồn tại. Đây là kiểm soát nguồn tham chiếu, không bảo đảm mọi suy luận của AI đều chính xác. Context được ký trên máy chủ, có hạn 24 giờ; hội thoại chỉ giữ trong màn hình hiện tại, rời trang sẽ bắt đầu lại. Tệp không lưu trong DB của ứng dụng. API key chỉ dùng trên máy chủ.

## Kiểm tra

```sh
npm run format:check
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

E2E chạy production ở `127.0.0.1:3001`, tách với dev server, dùng database riêng `artifacts/e2e-cache.db` và tắt gọi OpenAI. Không chạy một production server cũ tại cổng đó khi cần kiểm tra build mới. Kiểm thử mô phỏng phản hồi TTS và quyền micro; bài kiểm tra cache dùng SQLite thật. Cần nghe và thu âm thật trên thiết bị. Screenshot nằm trong `artifacts/`, trace lỗi trong `test-results/` (đều được gitignore).

`.github/workflows/verify.yml` chạy type check, kiểm tra logic, build và E2E trên CI.

## Điều kiện phát hành còn thiếu

Không tự phê duyệt bằng cách bấm nút. Xem [báo cáo triển khai](MD/IMPLEMENTATION_AUDIT_V1_1.md): Vietnam Spoken Core còn seed-only; cần biên tập đầy đủ bài học, IPA, kiểm định audio US, artwork/crop/quyền sử dụng, bộ đề giữ kín và đánh giá B1 độc lập. TTS chỉ dùng để luyện thử với các câu có sẵn, chưa phải audio đã duyệt. Màn hình chất lượng chỉ đọc, chưa phải CMS có phân quyền. SQLite lưu cache audio, transcript, hồ sơ, kết quả học và câu mẫu cá nhân; trình duyệt giữ thêm bản tiến độ. Duyệt câu mẫu riêng chỉ là lựa chọn của người học, không thay thế cổng duyệt giáo trình. Chưa có đăng nhập, đồng bộ đa thiết bị hay offline PWA; đây là bản app local để học thử và kiểm chứng luồng.
