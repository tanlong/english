# Rà soát và chuẩn hóa source — 02/11/2026

Phạm vi là source hiện tại trong workspace, gồm cả thay đổi chưa commit. Đối chiếu với `AGENTS.md`, tài liệu Next.js đi kèm và đặc tả `MD/English_App_ITBA_Documents/English_App_ITBA.md`, đặc biệt NFR-05/07/08 và yêu cầu giới hạn chi phí, xóa dữ liệu, phân quyền. Không xem đây là đánh giá thâm nhập hay chứng nhận production.

## Chuẩn source

- Tách màn Hôm nay, Bài học, bài đang học, Ôn tập, Tiến độ và Lộ trình thành các component riêng. Helper nội dung và khóa học dùng chung nằm trong `app/components/learning-content.ts`. Phần nhập câu có vòng đời theo tình huống; mức câu, consent mic và dấu thời gian tương tác vẫn theo bài học.
- Bật ESLint 10 với cấu hình Next.js Core Web Vitals và TypeScript; tách `npm run lint` khỏi `npm run typecheck`, thêm `npm run check` chạy lint, typecheck, Prettier và kiểm thử Node. `.agents/` và `.codex/` được bỏ qua khi format để giữ nguyên tài nguyên công cụ.
- Nâng Next.js lên 16.4.3, React/React DOM 19.3.1, Base UI 1.9.0, Lucide 1.66.0, PostCSS 8.5.32 và TypeScript 6.0.3. Prisma giữ ở 7.10.1 vì nhánh 8 được registry trả về là bản RC. TypeScript 7 không nằm trong khoảng hỗ trợ của `typescript-eslint` đang cài (`>=4.8.4 <6.1.0`).
- Next.js công bố bản vá từ 16.4.1 cho các advisory nghiêm trọng ngày 14/10/2026: [thông báo bảo mật của Next.js](https://nextjs.org/blog/nextjs-security-update-october-14-2026).

## Đối chiếu bảo mật và đặc tả

| Phát hiện                                                                                               | Thay đổi                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cookie trình duyệt có thể bị đổi để tạo quota mới; API phân tích/tranh luận và nhận diện chưa có quota. | Mọi điểm gọi provider có quota theo nhóm; thêm trần tổng cho cả tiến trình trong 15 phút, mặc định 600 và cấu hình bằng `PROVIDER_GLOBAL_LIMIT`. Kiểm soát này không phải xác thực.                          |
| Một số endpoint đọc toàn bộ body hoặc tin `Content-Length` trước khi kiểm tra kích thước.               | Dùng chung bộ đọc giới hạn byte stream cho JSON và multipart; từ chối request quá lớn trước khi đọc tiếp, kể cả khi thiếu `Content-Length`. Kiểm tra Origin cũng so sánh protocol.                           |
| Cache bản nhận diện và giọng Alex được chia sẻ, không xóa khi xóa hồ sơ.                                | Cache mới được gắn khóa riêng theo hồ sơ; yêu cầu ẩn danh không được lưu cache cá nhân. Xóa cache và hồ sơ trong cùng transaction. Token cũ không được tái tạo sau xóa, kể cả khi provider đang xử lý.       |
| Chuyển tình huống ở tab khác có thể để câu và phản hồi cũ dưới câu hỏi mới.                             | Tách trạng thái soạn theo định danh tình huống; lưu mức câu, consent mic và tương tác của cả bài.                                                                                                            |
| Thiếu header bảo vệ trên các trang và API.                                                              | Thêm `nosniff`, Referrer-Policy, chống nhúng iframe, Permissions-Policy, HSTS ở production và CSP cho `base-uri`, `object-src`, `frame-ancestors`, `form-action`. Microphone vẫn được phép trên cùng origin. |

## Các giới hạn còn lại

- Pilot chưa có tài khoản hay xác thực cá nhân; cookie trình duyệt không phải danh tính đáng tin cậy. Quota trong bộ nhớ chỉ áp dụng cho một tiến trình và có thể đặt lại khi khởi động lại. Cần gateway/quota dùng chung, xác thực, budget và giám sát provider trước khi public hoặc chạy nhiều instance.
- Các bản ghi transcript và giọng Alex được ghi bằng phiên bản cũ không có chủ sở hữu. Ứng dụng mới không đọc lại chúng nhưng chưa tự xóa khỏi SQLite hay backup; cần xử lý theo chính sách lưu giữ trước khi khẳng định đã xóa dữ liệu lịch sử.
- CSP hiện chỉ giới hạn các directive nêu trên; chưa triển khai chính sách `script-src` theo nonce. Cần thiết kế riêng nếu chuyển sang CSP đầy đủ vì ảnh hưởng cách Next.js render/cache.
- `npm audit --omit=dev` báo **0 lỗ hổng** ở thời điểm rà soát. Audit toàn bộ báo **15 moderate** liên quan tới advisory của `minimatch` trong cây dependency công cụ lint; npm chưa có đường sửa tương thích được đề xuất cho toàn bộ cây. Theo dõi upstream thay vì dùng `npm audit fix --force` để hạ/bẻ gãy bộ lint. ESLint 10 cũng có cảnh báo peer dependency từ một số plugin trong `eslint-config-next`, dù lint và cài đặt theo lockfile hiện chạy được.
- Header HSTS giả định môi trường production dùng HTTPS; reverse proxy phải chuyển đúng protocol và host để kiểm tra Origin hoạt động. Cần cấu hình giới hạn request tại gateway và giám sát thay vì chỉ dựa vào giới hạn trong tiến trình.

## Kiểm tra

- `npm ci`: cài lại đúng lockfile và tạo Prisma Client; có cảnh báo peer dependency nêu trên.
- `npm run check`: lint, typecheck, Prettier và 46 test API/logic đạt, gồm quota, giới hạn stream, quyền riêng tư và xóa đồng thời với provider.
- `npm run build -- --webpack`: production build.
- `npx playwright test --workers=3`: 58 test UI/API đạt, gồm mobile/desktop, mic, cache và bảo mật; provider bên ngoài được mock hoặc tắt. Một lượt trước đó có một timeout khi chọn combobox trong lúc nhiều tác vụ kiểm tra chạy đồng thời; lượt đầy đủ sau đó đạt.
