# Bản ứng viên nghiệm thu Vi sinh

Kiểm thử ngày 25/11/2026 trên Linux, Node.js v24.22.3. Build ứng viên `930464bc9e5933ccedbc` gồm 24 tệp, tổng 1.292.661 byte trước khi nén.

| Phạm vi | Kết quả | Bằng chứng |
| --- | --- | --- |
| Kiểm thử module | 6/6 đạt | [Nhật ký](test/evidence/modules.log) |
| Chromium 158.0.8127.0 | 5/5 nhóm đạt | [Nhật ký](test/evidence/chromium.log) |
| WebKit 26.5 | 5/5 nhóm đạt | [Nhật ký](test/evidence/webkit.log) |
| Giao diện | Kiểm tra mô phỏng iPhone 390 px, iPad 810 px và máy tính 1366 px | [Test trình duyệt](test/browser.test.mjs) |
| Tải lạnh nội bộ | Chromium 133 ms, WebKit 191 ms trong lần đo ghi ở nhật ký | [Test trình duyệt](test/browser.test.mjs) |
| Ngoại tuyến | 12 ảnh nằm trong cache. Mở lại phiên và đọc ảnh được khi máy chủ ngắt kết nối | [Test trình duyệt](test/browser.test.mjs) |

## Hồi quy và tương thích

- Phiên 500 và 388 câu có mẫu số đúng. Chuyển ngân hàng giữ phạm vi phiên đã lưu. Tải lại khôi phục ID và vị trí đang xem. Trước và Tiếp tuân theo thứ tự phiên.
- Chủ đề Sởi trong ngân hàng trọng tâm có một câu. Giao chủ đề đó với tìm 497 cho 0 câu. Tìm đích danh 497 cho 1/1, với điều hướng dừng ở hai biên.
- Tái hiện bản lưu trọng tâm có 387/388 câu đã trả lời. Khôi phục snapshot cũ và chọn học tiếp đều vào ID 497 ở 1/388. Nút Tiếp chuyển sang câu khác. Logic này áp dụng theo số câu còn lại và phạm vi phiên.
- Đã chạy thi thử có đồng hồ, kiểm tra đáp án chỉ xuất hiện sau nộp bài, làm lại câu sai, lật thẻ, lên lịch ôn, lọc đến hạn, lập kế hoạch, sao lưu vòng khép kín và mở album. Phiên mở ngoại tuyến giữ tiến độ đã lưu.
- Trình duyệt giữ bố cục theo chiều rộng và mục tiêu chạm tối thiểu 44 px. Chromium chạy thao tác chạm và vuốt qua giao thức điều khiển trình duyệt. WebKit chạy thao tác chạm mô phỏng và sự kiện con trỏ để xác minh điều hướng vuốt. Kiểm thử WebKit ngoại tuyến ngắt kết nối phía máy chủ. Chromium dùng cả chế độ offline của trình duyệt.

## Cổng phát hành

1. Sau khi được phê duyệt, phục vụ bản build từ thư mục riêng dưới HTTPS và kiểm tra URL, kiểu nội dung, phạm vi service worker.
2. Trên Safari iPhone và iPad thật, mở bản HTTPS, dùng **Thêm vào màn hình chính**, chờ báo sẵn sàng rồi mở lại qua biểu tượng khi tắt mạng. Kiểm tra chuyển câu bằng chạm và vuốt, khôi phục phiên, mở cả 12 ảnh và nhập/xuất một bản sao lưu mẫu.
3. Kiểm tra trang Vi sinh tại đường dẫn gốc và đối chiếu các tệp sau khi phát hành. Thay đổi trên nhánh ứng viên chỉ nằm trong `microbiology/`.

Kết quả hiện tại là nghiệm thu tự động trên hai trình duyệt Linux. Thiết bị Apple thật, cài đặt từ Safari và URL HTTPS công khai chờ cổng phát hành.
