# 08 — VIETNAM EVERYDAY & IT BANKING SPOKEN CORE

**Version:** candidate specification v1.1 · 2026-10-16  
**Status:** editorial policy approved for development; vocabulary inventory **not yet empirically frequency-validated**.  
**Supersedes:** all earlier product rules requiring 90% coverage specifically from Oxford 3000. The historical `00_*_SOURCE.md` snapshots are retained unchanged.

## 1. Quyết định nghiệp vụ

Chương trình ưu tiên **từ tiếng Anh và cụm giao tiếp thực sự hữu ích cho người Việt trưởng thành đang sống, làm việc tại Việt Nam**. Trọng tâm là giao tiếp đời sống, trò chuyện đồng nghiệp và trao đổi công việc tại bộ phận công nghệ ngân hàng: **ITBA, UX, UI, PM, Developer, PO (Product Owner)**.

- **Không lấy Oxford 3000 làm danh sách bắt buộc.** Có thể tham khảo Oxford 3000 để kiểm tra độ phổ thông; không bỏ từ vựng quan trọng chỉ vì nó nằm ngoài danh sách.
- **Không đồng nhất 90% với “90% lời nói của người Việt” hoặc “90% nghe hiểu”.** Chưa có corpus trong bộ tài liệu này để xác nhận thống kê đó.
- Giữ **American English tự nhiên**. Bối cảnh gần Việt Nam không có nghĩa chấp nhận câu dịch sát, diễn đạt gượng ép hoặc tiếng Anh trộn cú pháp tiếng Việt.
- **90% là ngưỡng biên tập:** tối thiểu 90% số lượt từ tiếng Anh hợp lệ trong các câu thoại mẫu chính thức phải thuộc bộ từ/cụm trọng tâm **đã được xét duyệt**. Được phép ngoại lệ có lý do khi phải giữ thuật ngữ thật.
- Không ấn định phải thuộc đủ 3.000 từ. Người học học từ qua **mẫu câu/cụm giao tiếp, tình huống và hội thoại**.

## 2. Chọn từ theo nguyên tắc giao tiếp

### Bốn lớp ưu tiên

| Tầng | Tình huống Việt Nam | Từ/cụm ví dụ | Mục đích |
|---|---|---|---|
| A — Từ giao tiếp chung | Hỏi, đáp, xác nhận, yêu cầu | get, need, want, ask, check, let me know, sounds good | Dùng trong nhiều tình huống |
| B — Đời sống Việt Nam | đưa con đi học, ăn sáng, quán cà phê, xe máy, tăng ca, hẹn giờ | drop off, on the way to work, motorbike, lunch break, traffic | Người học gặp thường xuyên |
| C — Đồng nghiệp/công sở | họp, cập nhật, xin hỗ trợ, nhờ làm rõ, dời lịch | quick update, follow up, deadline, issue, could you explain | Tăng năng lực trao đổi tự nhiên |
| D — IT Banking theo vai trò | phát triển phần mềm / sản phẩm số / phân tích / thiết kế | API, bug, deploy, backlog, user story, wireframe, requirement | Học theo vai trò, có kiểm soát độ khó |

**Quan trọng:** Chỉ đưa các thuật ngữ vào bộ chính thức nếu có bằng chứng sử dụng trong ngữ cảnh cần thiết, ví dụ từ bản mô tả công việc/training đã được quyền sử dụng và được biên tập viên xác nhận. Không gọi đây là “top words” khi chưa đo tần suất độc lập.

### Câu tiếng Anh tự nhiên, đúng hoàn cảnh

| Ngữ cảnh | Câu ưu tiên | Không ưu tiên nếu dịch sát từ tiếng Việt |
|---|---|---|
| Xin một chút thời gian | **Do you have a minute?** | Can I borrow your time? |
| Hỏi về tiến độ | **How's the task going?** | How is your task progress? |
| Nhờ cập nhật | **Could you send me an update?** | Please feedback me the progress. |
| Điều chỉnh lịch | **Can we move the meeting to three?** | Can we change meeting time to three? |
| Dev xử lý lỗi | **I found a bug in the latest update.** | I discovered one error in this code update. |
| PO nói về ưu tiên | **Which feature should we work on first?** | Which function is the most priority? |
| BA làm rõ yêu cầu | **Could you clarify this requirement?** | Please clear this request for me. |
| UX/UI review | **Let's go over the user flow.** | Let's review over the flow of user. |

Các câu trên là ví dụ biên soạn để minh họa hướng triển khai; **chưa phải dữ liệu đã qua bước kiểm tra Cambridge/COCA/YouGlish cho bài học chính thức**.

## 3. Định nghĩa phép tính ≥90% (theo lượt từ)

```
coverage_ratio = approved_core_running_tokens / eligible_authored_running_tokens
required coverage_ratio ≥ 0.90
```

- **Tử số:** mọi lượt từ thuộc bộ lemma/inflection được duyệt, có version cố định. Một cụm như `follow up` gồm 2 lượt từ, không mặc định tính là 1 từ.
- **Mẫu số:** mọi lượt từ trong bản tiếng Anh đã duyệt cho hội thoại/câu mẫu thuộc nội dung tự biên soạn. Không tính nhãn UI, ký hiệu, chữ số, tên riêng (theo danh sách loại trừ có dấu vết).
- **Phải tính cả thuật ngữ chuyên môn** trong mẫu số; thuật ngữ được xét duyệt vào nhóm D sẽ được tính vào tử số như các từ khác.
- Với từ rút gọn `I'm`, `don't` và biến tố `working`, cần chuẩn hóa bằng tokenizer/lemmatizer đã kiểm thử, tránh tỷ lệ thay đổi tùy cách tách không nhất quán.
- Câu mới có thể được phép chứa từ ngoài bộ trọng tâm nếu đáp ứng ngữ nghĩa, tự nhiên, nghề nghiệp; ngoại lệ phải ghi nhận `term`, `reason`, `reviewer`, `date`, `lesson_revision`.
- Không “làm đẹp số” bằng cách lặp từ dễ trong nội dung. Người biên tập duyệt chất lượng giao tiếp **trước** tỷ lệ.

**Phạm vi phép tính:** chỉ tính transcript và mẫu câu **do hệ thống biên soạn chính thức**. Không áp ngưỡng này vào hội thoại AI phát sinh theo thời gian thực, bài test tiếng Anh chân thực nhiều người nói hoặc nội dung người học tự viết/nói; các nội dung ấy phân loại độ khó riêng.

## 4. Quy trình xây dựng bộ từ thực tế tại Việt Nam

1. **Lập danh mục tình huống:** gia đình, buổi sáng, quán ăn, giao thông, giao tiếp đồng nghiệp, họp IT Banking, triển khai phần mềm, quản lý sản phẩm.
2. **Thu thập dữ liệu hợp lệ:** hội thoại giả lập dựa trên khảo sát nhân sự, phỏng vấn tự nguyện, tác vụ công việc công khai, tư liệu giáo dục có quyền sử dụng. Không lấy email/ticket/chat hoặc dữ liệu khách hàng nội bộ ngân hàng khi chưa được phép.
3. **Ẩn danh & gắn nhãn:** vai trò, bối cảnh, mức A1/A2/B1, ý định hội thoại, mức tự nhiên, bằng chứng nguồn.
4. **Biên soạn từ/cụm:** `lemma`, `phrase`, `context`, `role`, `level`, `example`, `source`, `review_status`.
5. **Kiểm tra ngôn ngữ:** Cambridge US; cách dùng và ngữ cảnh trên COCA/nguồn nói thích hợp; đối chiếu YouGlish US; phê duyệt cuối bằng người có chuyên môn.
6. **Phân tích độ bao phủ:** đếm running tokens của một tập ngữ liệu **đại diện và được phép sử dụng**, kiểm tra chéo trên tập khác. Chỉ khi đó mới có thể tuyên bố ưu tiên dựa trên dữ liệu tần suất.
7. **Đóng version:** `VN_SPOKEN_CORE_vX.Y`, lưu hash file, reviewer, ngày duyệt và danh mục sửa đổi.
8. **Revalidate:** thay đổi câu, từ điển, tokenization → chạy lại kiểm tra, IPA/TTS cần tái phê duyệt nếu đổi lời thoại.

## 5. Danh mục seed đi kèm — chỉ phục vụ thiết kế

`data/vietnam-spoken-core.seed.json` chứa từ/cụm **đề xuất ban đầu**, phân nhóm tình huống và vai trò. Mặc định:

- `status: seed_only`
- `empirically_validated: false`
- `may_drive_publish_gate: false`
- không được dùng làm khẳng định về tần suất tại Việt Nam.

`scripts/check_lexical_coverage.py` là **bộ tính thử**, có chức năng báo thiếu từ, không phải thiết bị kiểm chứng ngôn ngữ hoặc dữ liệu corpus. Với `--require-approved`, script phải **từ chối** seed chưa duyệt.

## 6. Thiết kế dữ liệu trong CMS

```json
{
  "lexicon_id": "vi_everyday_itbank_spoken_core",
  "version": "pending_review",
  "status": "seed_only",
  "entry": {
    "lemma": "deadline",
    "category": "workplace",
    "context_tags": ["meeting", "task_update"],
    "roles": ["itba", "ux", "ui", "pm", "developer", "po"],
    "register": "neutral_workplace",
    "examples": ["Can we move the deadline?"],
    "review_status": "pending",
    "source_evidence": []
  }
}
```

**QA bắt buộc:** Chưa có bộ từ `status=approved` kèm minh chứng → backend không được trả về trạng thái "lexical QA passed". Ngoại lệ từ chuyên môn cần review và phải trình bày rõ cho người học bằng ví dụ dùng thật, không chỉ dịch nghĩa.

## 7. Quan hệ với Oxford 3000

Dùng Oxford 3000 như một **nguồn kiểm tra phụ** để bảo đảm câu A1/A2 không quá khó và từ chung đủ thông dụng. Không coi từ ngoài Oxford 3000 là lỗi. Mục đích của app là **giao tiếp được trong đời sống và IT Banking tại Việt Nam bằng English tự nhiên**, không phải luyện thuộc danh sách từ để đạt chỉ tiêu.
