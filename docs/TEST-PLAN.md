# Kế hoạch kiểm thử tự động và tiêu chí nghiệm thu

Chạy ứng dụng gốc và bản làm việc qua HTTP cục bộ, trong profile trình duyệt mới. Dùng Chromium làm kiểm tra nhanh và bổ sung Firefox, WebKit cho kiểm tra trước phát hành. Dùng Playwright với đồng hồ giả lập cho bài thi và lịch ôn, đồng thời ghi lỗi JavaScript, ảnh giao diện và trace khi thất bại.

| Bộ kiểm tra | Tiêu chí nghiệm thu |
| --- | --- |
| Tệp gốc | SHA-256 khớp AGENTS.md cả tại máy chạy và ở blob của commit GitHub. |
| Dữ liệu | Đúng 296/500/388, ID duy nhất theo ngân hàng, tầng trọng tâm đúng tập hợp. So sánh trường câu hỏi, lựa chọn theo thứ tự, khóa đáp án và phân loại của từng ID với bản gốc. Bất kỳ sai khác nào đều cần phê duyệt riêng. |
| Trường hợp dữ liệu thiếu | Giữ nguyên các ID thiếu khóa hoặc lựa chọn đã ghi trong kiểm toán. Câu thiếu khóa không được cộng điểm hoặc đánh giá sai. Câu nhiều lựa chọn chấm theo tập đáp án, độc lập thứ tự. |
| Giao diện | So ảnh baseline ở 1280×800 và 390×844 cho màn chọn ngân hàng và các chế độ, cả sáng và tối. Giữ cấu trúc, nội dung và thao tác bàn phím. Kiểm tra tràn ngang, trạng thái focus và điều khiển cảm ứng. |
| Luyện tập và chủ đề | Tìm kiếm có và không dấu, tổ hợp bộ lọc, điều hướng đầu/cuối, trộn, đánh dấu, mở rộng phạm vi, không có kết quả. Rời phiên theo từng lựa chọn lưu, bỏ, làm lại, tiếp tục. Kiểm tra tải lại và đổi ngân hàng. |
| Thi thử | Kiểm tra phạm vi, câu có khóa, dạng câu, đếm ngược, khôi phục deadline sau tải lại, nộp tay và tự nộp. Đối chiếu điểm, mẫu số, lịch sử và câu sai. Kiểm tra xác nhận đổi ngân hàng. |
| Công cụ ôn | Kiểm tra câu sai được giải quyết, thẻ lật và điều hướng, tra cứu, giải thích, thống kê và ảnh thực hành. Kiểm tra nhóm trọng tâm và phần bổ sung, lịch ôn thích ứng và kế hoạch theo ngày. |
| Lưu trữ và sao lưu | Đối chiếu xuất–nhập JSON, ngân hàng sai, JSON hỏng, schema cũ, tùy chọn, hồi phục khi storage lỗi, dữ liệu lịch ôn và hai chế độ Vi sinh dùng chung tiến độ. |
| Phát hành | Cổng CI chỉ đọc trên nhánh phát triển, sau khi có bộ kiểm tra ổn định. Mọi lỗi mới phải được xử lý trước khi nghiệm thu. Lỗi baseline được theo dõi bằng ca tái hiện riêng và chỉ đóng sau khi có kiểm thử xác nhận. |

Giai đoạn 1 đạt tiêu chí bảo toàn khi tệp trên GitHub trùng byte với tệp đính kèm, kiểm thử trình duyệt xác minh số lượng ngân hàng và các luồng cốt lõi đã chạy, báo cáo ghi rõ kết quả và lỗi. Ma trận trên là kế hoạch cho các lượt phát triển sau. Bằng chứng giai đoạn 1 nằm trong [báo cáo kiểm toán](AUDIT.md).

Giai đoạn 2 bổ sung bộ hồi quy chạy được, cách chạy và phạm vi đã kiểm chứng trong [hồ sơ giai đoạn 2](PHASE-2.md). Xem [ma trận Chromium và WebKit](COMPATIBILITY.md) để phân biệt kết quả mô phỏng với các ca còn cần thiết bị thật.
