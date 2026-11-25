# Clinical Quiz giai đoạn 2

Bản phát triển trên `develop` nằm ở [clinical-quiz/index.html](../clinical-quiz/index.html). Đây là bản tĩnh được tạo từ tệp chuẩn và hai mô-đun sửa lỗi về vòng đời phiên. `index.html` ở thư mục gốc và tệp chuẩn vẫn ở blob cũ. GitHub Pages tiếp tục dùng `main:/`.

## Thay đổi và ca kiểm chứng

| Hạng mục | Thay đổi hoặc bằng chứng |
| --- | --- |
| Bản gốc và ngân hàng | SHA-256 được kiểm trước khi build. Kiểm thử so nguyên văn hai tài liệu nhúng sau khi tách phần mã bổ sung, và so phần vỏ chứa kho ảnh. Kiểm tra này bao phủ cả ID, thứ tự lựa chọn, khóa, giải thích, phân tầng và ảnh. Chromium và WebKit đối chiếu 296/500/388 và các ID thiếu dữ liệu. Xem [danh sách 10 câu thiếu khóa và ba câu thiếu lựa chọn](DATA-INTEGRITY.md). |
| Chuyển ngân hàng đang thi | Hủy giữ nguyên bài. Xác nhận nộp bài trước khi đổi và chờ ghi kết quả vào bộ nhớ cục bộ. Test kiểm tra lịch sử có một lượt sau khi đổi và quay lại. |
| Thi hết giờ | Đồng hồ giả lập chạy qua hạn sau khi xác minh deadline được giữ qua tải lại. Lịch sử có đúng một lần ghi cho lượt hết giờ và ghi đúng một câu được trả lời đúng. |
| Phiên luyện | Phiên một câu có thể mở rộng sang toàn ngân hàng đang chọn. Test xác minh tải lại khi đang luyện, lưu và mở lại từ màn hình chọn chế độ. |
| Phiên theo chủ đề | Tái hiện trên bản chuẩn rằng nút tiếp tục ở chủ đề một câu có thể chuyển sang câu ngoài chủ đề trong khi giữ nhãn chủ đề cũ. Bản phát triển quay về danh mục. Test tải lại và tiếp tục đúng chủ đề trước khi quay về. |
| Tiến độ và sao lưu | Nút xuất/nhập dùng được trong Thống kê. JSON v2 gồm lịch ôn, kế hoạch, phiên học và phiên luyện theo phạm vi. Bản JSON v1 vẫn nhập được và giữ dữ liệu mới vốn chỉ có trên máy. Test tải bản v2 vào profile rỗng, mở lại phiên đã nhập, từ chối ngân hàng sai và tái hiện lỗi hết dung lượng trong lúc nhập. |
| Lọc và lịch ôn | Test tìm theo ID, giới hạn một câu, phạm vi 388 câu, phiên đề xuất 30 câu, bắt đầu theo kế hoạch và tiếp tục điều hướng khi ôn câu sai. Điều khiển đề xuất và kế hoạch nằm trong Thống kê để truy cập được từ UI. |
| Giao diện và thiết bị | Ma trận và ảnh đối chiếu nằm ở [bằng chứng đa thiết bị](COMPATIBILITY.md). |

## Chạy lại

Từ thư mục gốc của repository, dùng Node.js 22 trở lên.

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm run build
npm test
```

`npm test` khởi động máy chủ HTTP loopback trong quá trình kiểm thử rồi tự tắt. Đặt `QUIZ_ENGINE=chromium` hoặc `QUIZ_ENGINE=webkit` để chạy một engine. `CHROMIUM_EXECUTABLE_PATH` cho phép dùng bản Chromium hệ thống. Đặt `QUIZ_SCREENSHOTS=test-results` để lưu ảnh đối chiếu. Kiểm tra toàn vẹn riêng bằng `node --test tests/integrity.test.mjs`.

## Các mục còn mở

- CQ-01 và CQ-02 là thiếu sót của dữ liệu nguồn. Giữ nguyên các giá trị, chưa thẩm định đáp án chuyên môn và nội dung giải thích với PDF nguồn.
- Mã ngân hàng `vi-sinh-495` được giữ làm mã tương thích của tệp sao lưu. Dữ liệu runtime có 500 ID.
- Ca lỗi ghi đã kiểm thử trong luồng nhập và xử lý ghi khi chuyển ngân hàng đang thi. Cơ chế lưu thường của bản chuẩn vẫn có thể mất tiến độ khi trình duyệt từ chối ghi hoặc hệ điều hành đóng trang mà không phát sự kiện. Chưa kiểm thử xóa dữ liệu hoặc thoát trình duyệt cưỡng bức trên thiết bị thật.
- Đã kiểm tra chọn và cuộn trong mô phỏng. Chưa kiểm thử Safari iOS/iPadOS trên thiết bị thật, bàn phím vật lý, đổi hướng màn hình, hộp thoại tệp của hệ điều hành và vuốt bằng tay.
