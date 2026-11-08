# Cloud Cat — sửa tay bên phải

Tạo bằng imagegen tích hợp ngày 08/11/2026 từ `../runtime-v5/body-resting-arm.png`.

- Ảnh: `body-right-arm-fixed.png`, nền trong suốt.
- Prompt và thông tin tạo: `generation-job.json`.
- Thay tay thả bên phải theo góc nhìn người xem: vai nối với thân, khuỷu tay xuôi,
  cổ tay và bàn chân mèo tròn, giữ vòng da nâu đính nút vàng.
- Tay vẫy bên trái tiếp tục dùng lớp riêng; không thay rig của tay vẫy.
- Build xuất lại atlas và ảnh dự phòng qua `scripts/cafe/build-layered-art.mjs`.
- Ảnh master gốc và các tệp duyệt nguồn giữ nguyên; bản runtime mới chờ người dùng xem.
