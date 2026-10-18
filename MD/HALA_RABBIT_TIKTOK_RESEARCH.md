# Đối chiếu video TikTok người dùng cung cấp

Ngày khảo sát: 18/10/2026. Nguồn: [video của @phuonghoctienganhr](https://www.tiktok.com/@phuonghoctienganhr/video/7666465515283729685), tên hiển thị Phương học tiếng Ảnh. Bài đăng có hashtag `#halarabbit`.

## Đã truy cập được

Mở trang bằng Chromium qua Playwright, đọc metadata TikTok oEmbed và dữ liệu trang sau khi tải. Video dài khoảng 21,85 giây. Đã xem các khung hình tại các mốc 0, 3, 6, 9, 12, 15, 18 và 20 giây; đọc hai track phụ đề công khai Anh/Việt. Không sử dụng âm thanh để xác minh toàn bộ lời đáp.

## Quan sát từ nguồn

- Đầu clip, phụ đề tự động ghi câu hỏi về cách diễn đạt việc yêu cầu người khác rời đi bằng tiếng Anh.
- Khoảng giây 9–12, chữ chèn trong hình thể hiện lời khen và câu hỏi xin thêm cách diễn đạt gần nghĩa.
- Cuối clip là phản ứng hài hước của người đăng. Những khung hình đã kiểm tra chủ yếu quay người nói; màn hình điện thoại cuối clip không đủ rõ để đọc các thành phần giao diện.

Nguồn cho các quan sát: [video gốc](https://www.tiktok.com/@phuonghoctienganhr/video/7666465515283729685). Clip có dựng và chèn chữ; đây chưa phải bản ghi phiên học liên tục hoặc review thao tác giao diện.

## Giới hạn cần giữ

Phụ đề Anh tự động có chỗ khác nghĩa rõ so với phụ đề Việt và chữ chèn trong hình, nên không dùng như transcript chính xác của cuộc hội thoại. Chưa xác minh lời đáp đầy đủ của AI, cách bật/tắt mic, tự gửi, độ trễ, cách sửa câu, phần tổng kết hoặc tài trợ. Hashtag cho thấy liên hệ tới Hala nhưng không đủ để khẳng định mọi lời trong clip là đầu ra nguyên bản của ứng dụng.

## Đề xuất cho Alex sau khi đối chiếu

Đây là quyết định thiết kế cho ứng dụng của chúng ta, không phải các tính năng đã xác minh của Hala:

| Nhu cầu | Hướng áp dụng |
| --- | --- |
| Người học hỏi cách nói một ý hoặc hỏi cụm gần nghĩa | Trả lời đúng yêu cầu đó trước, rồi mới hỏi tiếp nếu cần; không ép quay về kịch bản bài học. |
| Hội thoại có cảm xúc và phản ứng tự nhiên | Giữ câu ngắn, phản ứng theo ý người học; đùa nhẹ đúng ngữ cảnh, không xúc phạm hoặc khen máy móc. |
| Học thêm một cách diễn đạt | Ưu tiên một mẫu dễ dùng, phân biệt sắc thái khi cần; không đưa danh sách dài gây đứt nhịp trò chuyện. |
| Cần hỗ trợ tiếng Việt | Giữ nghĩa Việt sau icon mắt theo yêu cầu đã chốt. Phụ đề hai ngôn ngữ trong video không chứng minh Hala có bố cục tương tự. |

Prompt hiện tại của Alex đã yêu cầu nói ngắn, phản ứng theo nghĩa, thân thiện, đùa vừa phải và không khen mọi lượt; xem [agent.ts](../app/speaking/agent.ts). Video này bổ sung hướng tham khảo về nhịp đối đáp, chưa cung cấp đủ bằng chứng để thay bố cục hoặc cơ chế mic. Đợt khảo sát này chỉ cập nhật tài liệu.
