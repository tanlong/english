# Tham khảo Hala Rabbit cho phần Luyện giao tiếp

Ngày khảo sát: 18/10/2026. Mục tiêu: ứng dụng cho người Việt trưởng thành luyện giao tiếp đời sống và công việc, giữ thao tác đơn giản và có bước tiếp theo rõ ràng.

Bổ sung theo yêu cầu tìm review video: [Khảo sát nguồn YouTube](HALA_RABBIT_YOUTUBE_RESEARCH.md). Tài liệu riêng ghi các video đã xác minh, mốc thời gian từ mô tả và giới hạn truy cập; chưa xác minh được video review đúng Hala.

Người dùng sau đó cung cấp một video TikTok có hashtag Hala: [Đối chiếu hình ảnh và phụ đề video](HALA_RABBIT_TIKTOK_RESEARCH.md). Đã mở được video này bằng trình duyệt; clip gợi hướng tham khảo về hội thoại nhưng chưa đủ để đánh giá bố cục ứng dụng.

## Phạm vi và độ chắc chắn

Đã đọc trang chính chủ và trực tiếp xem 12 ảnh quảng bá trên Google Play, cùng 2 ảnh trên App Store. Web reader không tải được App Store và ảnh CDN; đã đọc được bằng `curl` và xem ảnh bằng trình xem ảnh. Không cài ứng dụng, không đăng nhập tài khoản, không trải nghiệm phiên học riêng tư. Vì vậy, tài liệu phân biệt **những gì xuất hiện công khai** với **hiệu quả/khả năng do nhà phát triển quảng bá**. Ảnh store có thể là bố cục minh họa và không chứng minh hành vi chạy thực tế.

## Sản phẩm chính thức nói gì?

- Google Play đăng ứng dụng dưới tên **Hala Rabbit: Practice Speaking**; mô tả có AI Companion, nhập vai, phản hồi phát âm, sửa ngữ pháp, flashcard, nhiều giọng và luyện không giới hạn. AI Companion, nhập vai, phát âm và luyện không giới hạn được ghi là tính năng Premium. Đây là mô tả của nhà phát triển, chưa có đo kiểm chất lượng trong khảo sát này. [Google Play](https://play.google.com/store/apps/details?id=com.halatech.halarabbit)
- App Store cùng ID hiện có tên **Hala: Speak English with AI**, nhà phát triển Bui Khoi, hỗ trợ tiếng Anh và tiếng Việt. Mô tả cũng kết hợp bài học cấu trúc và hội thoại với AI. Tên và dữ liệu giữa hai store có thể khác; không dùng số tải, đánh giá hoặc thứ hạng trong ảnh quảng cáo làm dữ kiện thực tế. [App Store Việt Nam](https://apps.apple.com/vn/app/id6744363860)
- Landing page chính chủ trình bày vòng học: **chọn tình huống → nói → xem phản hồi → thử lại với câu tốt hơn**; liệt kê tình huống phỏng vấn, công việc, du lịch, đời sống và IELTS. Trang cũng quảng bá phản hồi về ngữ pháp, cách dùng từ, độ trôi chảy và phát âm. Bảng điểm minh họa trên landing page không cung cấp phương pháp kiểm định; không thể suy ra khả năng chấm điểm đáng tin cậy chỉ từ hình này. [Website chính thức](https://halaenglish.com/landing-page)

## Quan sát từ ảnh chính chủ

Các nhận xét dưới đây chỉ mô tả giao diện xuất hiện trong ảnh, không khẳng định thao tác bên trong đã được thử.

| Ảnh | Quan sát được | Ý tưởng có thể áp dụng |
| --- | --- | --- |
| 02: hội thoại và sửa câu | Một thẻ câu người học nền sáng nổi bật trên nền tối; một số từ có gạch dưới hoặc tô màu. Có biểu tượng con mắt, loa và nhãn trạng thái đang nói. | Đặt phản hồi cạnh đúng câu vừa nói; trợ giúp mở khi cần. Không mặc định mọi câu đều có lỗi. |
| 03: nghe mẫu | Nội dung nghe nằm giữa màn hình; một dòng được nhấn mạnh hơn các dòng còn lại, có avatar người hướng dẫn. | Để câu đang luyện nổi bật; cung cấp nghe lại ngay tại câu. Chưa cần đồng bộ karaoke nếu nguồn TTS chưa có timestamp. |
| 04: tiến độ | Các thẻ tách số từ đã nói, thời gian nói và thời gian nghe. Có mục tiêu gắn cấp độ trong minh họa. | Báo số lượt thực hành và thời lượng có thể đo thật. Không suy cấp độ CEFR từ số từ. |
| 05: kết thúc | Màn kết quả có điểm và phần thưởng; thông điệp bên ngoài khuyến khích nói lại, giảm sợ sai. | Kết thúc bằng nhận xét cụ thể và một câu đáng luyện lại. Không cần bổ sung gems hoặc điểm giả. |
| 07–08: chuẩn bị từ để nói | Thẻ có hình, từ, IPA, nghĩa tiếng Việt, cụm kết hợp, ví dụ và tình huống ngắn. | Tình huống giao tiếp nên kèm 2–3 mẫu câu hữu ích; mở gợi ý theo nhu cầu. |
| 10: giao tiếp | Một mic tròn lớn nằm giữa phía dưới; avatar và hai bong bóng thể hiện câu ban đầu/cách diễn đạt khác. Nút nghe và lưu nhỏ hơn. | Giữ mic là thao tác chính, gửi ở cạnh; câu đề xuất cần đi kèm nghe mẫu và nói lại. |
| 11: hành trình | Bài học nối thành đường đi, có Learn/Review/Progress/Leaderboard; Free Chat nằm riêng. | Tách luyện theo tình huống khỏi trò chuyện tự do; giữ phần ôn tập hiện có. Chưa cần dựng thêm roadmap/bảng xếp hạng. |

Nguồn ảnh tương ứng:

- [Ảnh 02 — hội thoại](https://play-lh.googleusercontent.com/finjOzZ8yDx2fYmZhOnjDwRwOUvhRRbDv3bovxFDccbBApfg1PlbQYB6PU9JE_TYVH6B7knuhKGhurTPPIVVJ1Q=w1080)
- [Ảnh 03 — nghe mẫu](https://play-lh.googleusercontent.com/fPRa4UMHmnmdSij6QKbiOp5KG-cbOGFP18zABbyVDrj3w8N59MSSHu9iETS4VFHxcPZFAbCPVzoONjoNzjhpfg=w1080)
- [Ảnh 04 — tiến độ](https://play-lh.googleusercontent.com/98l63Fga2WBaf9ZatnSJonbUU3Zny5H6XwmUjfiqAF26swkg2OZrGbIDGebJcKR7CB5lUyLlaQsPTcTnWC7t3g=w1080)
- [Ảnh 05 — kết quả](https://play-lh.googleusercontent.com/XODf4H6EkbgPT1URRx7omHKq5JqIIB7tgNO3Bueti2MNtuQ1mySR79DAK5u4Oq7ZdEKVRSGg3KtZb7OWEzc7QYE=w1080)
- [Ảnh 07 — từ và cụm](https://play-lh.googleusercontent.com/gF8U7ONOLIehApxRt06w4VezgeOk4G5aqqKY7hvRZMLXkkHlMzbmMIpuMROGyGK4oH1M-BL0ZqOYKq1cpI9mjqo=w1080), [ảnh 08 — ứng dụng vào câu](https://play-lh.googleusercontent.com/BKxQRHp9Bo9gwBBF-NeiQHbGNPkLrsHVcZsUZdJz0Od6AqcF6fRxEi5qiMMSlCjpgWx0XAlEUg517wi6OSORsPI=w1080)
- [Ảnh 10 — mic và gợi ý diễn đạt](https://play-lh.googleusercontent.com/rWnkaIypoeudL1mHlEW5aO6umjxMKKocdqZI8THBMQ2c2MH0xZnpHrxKsaymGudYA01OCcSlsHyHjMfePbpj1Q=w1080)
- [Ảnh 11 — hành trình học](https://play-lh.googleusercontent.com/cJON0-AHcIMYODeCgj4ttZLCNRdKz-CrlTMbzPQTUb6aBpFFLZXAHTssi-We_L7SlKnGsvAf6kEunOze0CT2pg=w1080)

## Đối chiếu với ứng dụng hiện tại

Đọc mã trước khi triển khai tại [daily-speaking.tsx](../app/components/daily-speaking.tsx) và [use-daily-speaking.ts](../app/speaking/use-daily-speaking.ts). Các nhận xét này là trạng thái tại thời điểm bắt đầu nghiên cứu; file triển khai có thể được cập nhật sau đó.

| Hiện có | Khoảng trống cần xử lý |
| --- | --- |
| Free Talk, Guided Lesson, Review và danh sách chủ đề trong panel thiết lập | Người mới chưa thấy ngay mình sắp nói với ai, ở đâu, để làm gì. Chọn chủ đề rộng chưa phải chọn một tình huống cụ thể. |
| Log hội thoại; nút nghe lại câu Alex mới nhất | Nghe lại từng câu cũ cần có tại tin nhắn đó. |
| Nghĩa tiếng Việt mở bằng mắt; chữ nhỏ, nghiêng | Đây đã là kiểu trợ giúp mở khi cần; giữ lại. |
| Giải thích và sửa lỗi dạng văn bản | Chưa có cấu trúc câu đã nói → câu đề xuất → lý do ngắn → thử nói lại. |
| Mic liên tục, bấm dừng rồi kiểm tra/gửi; tùy chọn nhập chữ | Không có dữ liệu âm thanh gốc gửi tới bộ chấm phát âm. Transcript không đủ để chấm accent, nhịp điệu hoặc CEFR. |
| Thời lượng phiên, đếm lượt mic/nhập chữ và tổng kết từ API | Thời lượng là thời gian phiên trang đang hiện, chưa phải thời gian thực sự phát âm; cần đặt tên đúng. |
| Hội thoại nằm trong state React và mất khi rời trang | Không được quảng bá như lịch sử lưu dài hạn hoặc dữ liệu ôn đã đồng bộ. |

## Hướng áp dụng tối thiểu

Đây là đề xuất thiết kế cho sản phẩm của chúng ta, không phải mô tả thêm tính năng của Hala.

1. **Chọn tình huống trước khi bắt đầu.** Dùng thẻ ngắn như gọi cà phê, làm quen đồng nghiệp, cập nhật công việc, lên kế hoạch cuối tuần. Mỗi thẻ ghi vai của bạn, vai của Alex và một việc cần hoàn thành. Giữ trò chuyện tự do như lựa chọn khác. Một nút bắt đầu sau khi chọn là đủ.
2. **Tập trung vào nói.** Hiện rõ `Alex đang nói`, `Đến lượt bạn`, `Đang nghe`, `Đang phản hồi`. Giữ hai icon mic/gửi ở giữa theo yêu cầu đã có. Mic không tự gửi khi người học dừng; giữ cơ hội kiểm tra transcript.
3. **Phản hồi có thể hành động.** Khi thật sự có chỗ nên sửa, hiển thị một câu diễn đạt tốt hơn và một lý do tiếng Việt ngắn. Nút nghe mẫu và thử nói lại gắn ngay tại phần sửa; không ép nói lại mọi câu và không nhầm câu viết đúng với lỗi bắt buộc.
4. **Trợ giúp mở theo nhu cầu.** Giữ icon mắt cho nghĩa tiếng Việt, icon loa cho nghe lại và gợi ý ngắn khi bí. Gom lựa chọn tốc độ/chế độ vào thiết lập; tránh thêm thanh công cụ dài.
5. **Kết thúc bằng bằng chứng thật.** Dùng số lượt mic/nhập chữ, thời lượng buổi, nhận xét về nội dung và các câu đã xuất hiện. Cho phép luyện lại cùng tình huống. Giai đoạn này không thêm chấm phát âm, level CEFR, số ngày lên trình độ hoặc điểm tiến bộ chưa có dữ liệu đo.

Ví dụ vòng luyện của chúng ta: chọn **Gọi cà phê** → biết mục tiêu **gọi đồ uống và hỏi giá** → nghe Alex → nói và gửi → xem một cách diễn đạt rõ hơn khi cần → thử nói lại → tiếp tục hội thoại → nhìn lại câu hữu ích. Các bước này tận dụng endpoint hội thoại, TTS và mic hiện có, không đòi nền tảng mới.

## Điều chưa xác minh

- Không biết Hala xử lý mic, kết thúc lượt, tự gửi, latency hoặc mất mạng như thế nào trong phiên thực tế.
- Không xác minh được thuật toán chấm phát âm/ngữ pháp, độ chuẩn hóa điểm hoặc gắn cấp độ học.
- Không xem các lời hứa marketing, thống kê người học hay đồ thị tăng trưởng trong ảnh là kết quả nghiên cứu độc lập.
- Không sao ảnh, avatar, mascot hoặc giao diện nhận diện của Hala vào ứng dụng. Học vòng tương tác và ưu tiên nội dung phù hợp đời sống/công việc của người Việt.

## Phần đã triển khai

Áp dụng vòng luyện trên vào `/daily-speaking`, giữ phong cách và các thành phần giao diện hiện có:

- Thanh 3 bước: chọn tình huống → nói và thử lại → nhìn lại buổi nói. Màn chuẩn bị ẩn các thao tác trả lời chưa dùng được.
- Bốn tình huống nhập vai: gọi cà phê, cập nhật công việc, nhận phòng khách sạn, giới thiệu trong phỏng vấn; mỗi tình huống có vai của Alex, vai người học, mục tiêu và ba mẫu câu mở theo nhu cầu. Vẫn có trò chuyện tự do và luyện theo bài.
- Nghe riêng từng phản hồi tiếng Anh. Giữ hai icon mic/gửi ở giữa và nút mắt mở nghĩa tiếng Việt nhỏ, in nghiêng.
- Khi Alex có góp ý sửa câu, nút **Thử nói lại** mở lượt luyện lại. API nhận hành động riêng và đối chiếu với câu người học thật sự đã gửi; gửi lỗi vẫn giữ bản nháp.
- Tổng kết có số lượt mic, số lượt nhập chữ, thời lượng phiên và các góp ý đã xuất hiện. Có thể tải hội thoại và tổng kết thành file văn bản; không tự đưa hội thoại vào kho ôn tập.
- Bối cảnh nhập vai được định nghĩa ở máy chủ; API kiểm tra tình huống và lịch sử cần thiết trước khi thực hiện lượt thử lại.

Mã chính: [giao diện](../app/components/daily-speaking.tsx), [trạng thái buổi luyện](../app/speaking/use-daily-speaking.ts), [tình huống](../app/speaking/scenarios.ts), [API](../app/api/daily-speaking/route.ts), [bố cục](../app/styles/speaking.css).

Kiểm chứng: 26 kiểm thử đơn vị, 50 kiểm thử trình duyệt toàn ứng dụng đã đạt; sau lần tinh gọn màn chuẩn bị, chạy lại 18 kiểm thử giao tiếp, bố cục và luồng học đều đạt. TypeScript và bản dựng production bằng webpack thành công. Kiểm thử hội thoại dùng phản hồi API giả lập, xác nhận luồng tương tác và hợp đồng dữ liệu; không phải đánh giá chất lượng phản hồi của mô hình trên một phiên nói thật.
