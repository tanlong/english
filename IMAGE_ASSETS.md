# Ảnh được lưu ngoài Git

Ảnh đã được loại khỏi lịch sử Git và được bỏ qua bằng `.gitignore`, kể cả PNG, WebP, JPG, SVG, ICO và GIF. Mã nguồn, prompt, cấu hình và manifest vẫn nằm trong Git. Ảnh đang có trên máy được giữ nguyên; thao tác làm sạch Git không xóa ảnh khỏi thư mục làm việc.

## Khôi phục khi clone mới

Bộ sao lưu hiện tại là `english-images-2026-11-21.tar`, gồm 2.378 ảnh, giữ nguyên đường dẫn tương đối trong dự án. File `SHA256SUMS` dùng để kiểm tra archive; `image-manifest.json` ghi kích thước và SHA-256 của từng ảnh.

Thư mục Drive được chỉ định: [English assets](https://drive.google.com/drive/folders/1yemxF3I6ObpaUDzmbGffUF9zi05fOxQ5).

Tải archive cùng `SHA256SUMS` về một thư mục ngoài repo. Trong thư mục tải xuống, kiểm tra:

```sh
shasum -a 256 -c SHA256SUMS
```

Sau đó đứng ở thư mục gốc dự án và giải nén:

```sh
tar -xf /duong-dan/english-images-2026-11-21.tar -C .
```

Phải khôi phục ảnh trước khi chạy dev, build, kiểm tra giao diện hoặc các kiểm tra tài nguyên. Máy CI/deploy cũng cần bộ ảnh được khôi phục; chỉ clone mã nguồn sẽ chưa có ảnh để chạy các bước này.

## Nguồn ảnh khi chạy game

Ứng dụng hiện tiếp tục dùng đường dẫn local `/public` cùng các lớp ảnh ở `art/`. Việc chuyển ảnh ra khỏi Git không tự chuyển runtime sang URL Drive và không tự cấu hình đồng bộ trên CI/deploy. Archive là cách khôi phục bộ ảnh; các thuyền, cành cây và cánh quạt vẫn chuyển động bằng code hiện có.

## Sao lưu trên máy đang thực hiện

Thư mục `.asset-migration/2026-11-21/` được Git bỏ qua, chứa archive ảnh, checksum, manifest, bản sao lịch sử Git trước thay đổi và snapshot các thay đổi chưa commit. Giữ các bản sao này cho đến khi đã xác nhận tải lên Drive và thử khôi phục thành công. Bản sao lịch sử chỉ giữ ở máy; không cần tải các file cấu hình Git, index hoặc patch lên Drive.

Không push lại nhánh hoặc tag từ bản clone cũ vì có thể đưa lịch sử ảnh trở lại. Máy khác nên clone mới và khôi phục archive ảnh.
