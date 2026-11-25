# Nguyên tắc phát triển Clinical Quiz

- Dùng `nkhkjjhkkjjh.html` làm bản chuẩn bất biến của tệp đính kèm. SHA-256 của bản chuẩn là `ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123`. Nếu cần phát triển ứng dụng, tạo bản làm việc từ bản chuẩn.
- Giữ giao diện, bố cục, nhãn và hành vi Clinical Quiz 2.6 theo bản chuẩn. Duy trì toàn bộ chế độ, điều hướng và luồng lưu tiến độ. Thay đổi giao diện hoặc phạm vi tính năng cần được duyệt rõ.
- Bảo toàn 296 câu Hóa Sinh 2 và 500 câu Vi sinh, gồm 388 câu trọng tâm là tập con của Vi sinh. Giữ ID, nội dung, thứ tự lựa chọn, khóa đáp án, liên kết nguồn và nhóm trọng tâm. Ghi nhận dữ liệu lỗi hoặc thiếu trong báo cáo. Chỉ thay đổi dữ liệu câu hỏi khi có phê duyệt cụ thể và bằng chứng nguồn.
- Bảo toàn tiến độ người dùng hiện có, bao gồm dữ liệu lưu cục bộ và khả năng mở bản sao lưu cũ. Kiểm thử dữ liệu cũ và hành vi khi lưu thất bại trước khi đổi lược đồ.
- Phát triển trên `develop` hoặc nhánh tách từ `develop`. Việc cập nhật `main`, GitHub Pages hoặc cấu hình triển khai cần phê duyệt riêng.
- Chạy các kiểm tra liên quan trước khi báo hoàn thành. Lưu lệnh, môi trường, SHA, kết quả và giới hạn xác minh. Gắn mỗi lỗi với bước tái hiện. Xem [kế hoạch kiểm thử](docs/TEST-PLAN.md).
