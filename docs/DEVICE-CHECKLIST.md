# Kiểm thử Clinical Quiz trên iPhone và iPad thật

Mở [bản thử nghiệm HTTPS](https://pherohuynhducminh-del.github.io/vi-sinh-trong-tam/clinical-quiz/) trong Safari. Dùng cửa sổ riêng tư hoặc thiết bị thử. Ghi phiên bản iOS/iPadOS, kiểu máy, hướng màn hình, ngày giờ và commit đã triển khai. Dùng câu thử và bản sao lưu thử trong ca nhập dữ liệu.

| Ca | Thao tác | Kết quả mong đợi |
| --- | --- | --- |
| Một câu trong Luyện tập | Chọn Hóa Sinh 2, mở Luyện tập, tìm ID `1`, bắt đầu, trả lời rồi chạm **Tiếp tục các câu trong phạm vi**. | Hiển thị 1/1 và nút kế tiếp bị khóa ở phạm vi ban đầu. Nút mở rộng chuyển sang phạm vi có nhiều câu, có thể tiếp tục điều hướng. |
| Một câu theo chủ đề | Mở **Học theo chủ đề**, chọn nhóm ghi **1 câu**. Tải lại, chạm **Tiếp tục phiên học**, rồi chạm **Về danh mục chủ đề**. | Mở đúng câu và đúng chủ đề đã lưu. Khi rời phiên, trở về danh mục để chọn chủ đề khác. |
| Điều hướng | Trong phạm vi nhiều câu, chạm trước/sau, mở lưới câu và chạm một ID. Cuộn xuống rồi trở lại đầu. Lặp lại ở chế độ dọc và ngang. | Vị trí, ID và số câu nhất quán. Các nút và phần cuộn dùng được, không tràn ngang hoặc chạm nhầm vào lựa chọn bên cạnh. |
| Đổi ngân hàng đang thi | Bắt đầu Thi thử, trả lời một câu, chạm ngân hàng khác. Lần đầu hủy, lần sau xác nhận. Quay lại ngân hàng cũ và mở Thống kê. | Hủy giữ bài và đồng hồ. Xác nhận kết thúc bài trước khi đổi. Lịch sử ghi đúng một lượt, đúng số câu đã trả lời. |
| Luyện tập và lưu | Trả lời, đánh dấu rồi **Lưu và thoát**. Tải lại và tiếp tục. Làm thêm một câu, rồi chọn **Thoát không lưu lượt này**. | Câu đã lưu cùng dấu và vị trí được khôi phục. Câu của lượt đã bỏ không xuất hiện trong tiến độ. |
| Sao lưu và khôi phục | Trong Thống kê, xuất JSON, mở ứng dụng Tệp, rồi chọn JSON qua nút nhập của đúng ngân hàng. Thử nhập bản từ ngân hàng khác. | Safari tạo tệp; có thể chọn và nhập lại. Bản sai ngân hàng bị từ chối và giữ tiến độ cũ. |
| Cảm ứng và ảnh | Chạm lựa chọn, lật thẻ, mở album Hóa Sinh 2, cuộn và chạm ảnh để phóng to, rồi đóng. Thử cả hai hướng nếu thiết bị hỗ trợ. | Mỗi lần chạm kích hoạt đúng một thao tác. Ảnh tải rõ, cuộn mượt và nút đóng luôn thao tác được. |
| Tự nộp | Đặt thời lượng ngắn nhất, trả lời một câu, chuyển Safari ra nền rồi quay lại sau hạn. | Bài tự kết thúc, hiển thị kết quả và lịch sử ghi đúng một lượt. |

Ghi **Đạt**, **Không đạt** hoặc **Chưa chạy** cho từng ca trên từng thiết bị. Với lỗi, ghi ngân hàng, chế độ, ID, bước tái hiện và ảnh hoặc video. Checklist này chưa xác nhận Safari trên thiết bị thật.
