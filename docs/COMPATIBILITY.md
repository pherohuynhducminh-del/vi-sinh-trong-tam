# Ma trận tương thích giai đoạn 2

Kiểm thử ngày 25/11/2026 trên Linux, với Playwright 1.62.1, Chromium 156.0.8078.79 và WebKit 26.5.

| Hồ sơ | Viewport CSS | Tương tác |
| --- | --- | --- |
| Desktop | 1280 × 800 | Click chuột, điều hướng, cuộn và tải lại |
| iPhone 13 | 390 × 664 | Mô phỏng DPR 3 và cảm ứng, chạm chọn ngân hàng và đáp án |
| iPad thế hệ 7 | 810 × 1080 | Mô phỏng DPR 2 và cảm ứng, chạm chọn ngân hàng và đáp án |

Mỗi hồ sơ dùng profile mới cho bản chuẩn và bản phát triển. Bộ hồi quy so ảnh PNG màn hình chọn chế độ sáng, chọn chế độ tối và màn hình luyện tập đầu tiên trong từng engine. Ở bản phát triển, bộ kiểm tra xác minh thao tác chọn đáp án, cuộn album, giải mã đủ 12 ảnh Hóa Sinh 2, giữ ngân hàng qua tải lại và chiều rộng màn chọn chế độ. Thống kê có thêm đường truy cập tới nút sao lưu và lịch ôn để sửa các điều khiển bị ẩn ở bản gốc.

WebKit trên Linux kiểm tra engine trình duyệt. Chưa chạy trên Safari hoặc thiết bị Apple thật. Cuộn được kích hoạt qua API trang; vuốt bằng tay, bàn phím và hộp thoại tệp của hệ điều hành vẫn cần kiểm tra trên thiết bị thật.

Xem [bằng chứng kiểm thử](evidence/phase-2/) và [cách chạy lại](PHASE-2.md#chạy-lại).

Cả sáu cấu hình đều đạt. Tất cả 18 cặp ảnh gốc và phát triển trùng byte trong từng cấu hình. [Danh sách SHA-256](evidence/phase-2/screenshots.sha256) ghi đủ các cặp. Ba ảnh luyện tập WebKit được lưu để xem trực tiếp trên [desktop](evidence/phase-2/webkit-desktop-practice-candidate.png), [iPhone](evidence/phase-2/webkit-iphone-practice-candidate.png) và [iPad](evidence/phase-2/webkit-ipad-practice-candidate.png).
