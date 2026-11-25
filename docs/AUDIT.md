# Kiểm toán Clinical Quiz giai đoạn 1

## Phạm vi và kiến trúc

Tệp đính kèm được lưu nguyên byte dưới tên [nkhkjjhkkjjh.html](../nkhkjjhkkjjh.html). Tệp có 2.926.511 byte, SHA-256 `ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123`. `index.html` hiện có của repository tiếp tục là một tệp riêng. Tựa trang ngoài là “Clinical Quiz 2.5 Performance”, hai iframe mang tựa 1.1 theo môn, và mã có lớp điều hướng `nav26`. Giai đoạn này dùng tệp đính kèm làm chuẩn theo yêu cầu dự án.

- Trang vỏ là HTML, CSS và JavaScript nội tuyến. Ba nút chọn ngân hàng thay thế iframe `srcdoc`. Hai nút Vi sinh dùng cùng tài liệu nhúng với cờ `STRATEGIC` khác nhau. Ảnh JPEG nhúng được chèn vào tài liệu khi chọn ngân hàng.
- Mỗi tài liệu có UI và dữ liệu JavaScript nội tuyến. Khởi tạo tạo chỉ mục ID, suy ra thông tin đề và đáp án, phục hồi trạng thái rồi đăng ký sự kiện DOM. Có 12 khối script nội bộ ở Hóa Sinh 2 và 15 ở Vi sinh. Nhiều lớp bọc lại `render`, lọc câu, chấm điểm và chuyển chế độ, nên thứ tự thực thi ảnh hưởng hành vi.
- `QUESTIONS`, `KEYS`, `EXPLANATIONS` và `META` chứa câu, khóa gốc, giải thích và phân tầng. Cờ trọng tâm lọc cùng ngân hàng Vi sinh, dùng tầng 1–3. Tầng 4 là nhóm bổ sung.
- `S` và `P` lưu tiến độ và cấu hình qua `localStorage`. Hóa Sinh 2 và Vi sinh có khóa riêng, hai giao diện Vi sinh dùng chung tiến độ. Phiên luyện lưu thêm khóa theo chế độ thường/trọng tâm. Bản sao lưu JSON schema 1 có mã ngân hàng và kiểm tra dữ liệu nhập. Bộ đếm giờ thi dựa trên deadline tuyệt đối.
- Không thấy backend, đăng nhập, đồng bộ thiết bị hoặc bước build trong tệp chuẩn. Phiên học và tiến độ phụ thuộc trình duyệt và origin. GitHub Pages lấy nguồn từ `main:/`.

## Kiểm kê dữ liệu

| Ngân hàng | Câu / ID duy nhất | Có khóa | Không có lựa chọn | Mục giải thích |
| --- | ---: | ---: | --- | ---: |
| Hóa Sinh 2 | 296 / 296 | 288 | 213, 230, 236 | 296 |
| Vi sinh | 500 / 500 | 498 | 0 | 24 |

- Hóa Sinh 2 có 7 câu được đánh dấu nhiều đáp án trong runtime. ID thiếu khóa là 73, 213, 217, 230, 232, 236, 246, 296.
- Vi sinh thiếu khóa ở ID 340, 394. Các tầng có 273, 42, 73 và 112 câu. Tầng 1–3 có 388 câu, đã xác nhận qua bộ lọc trọng tâm trong trình duyệt.
- Mọi nhãn khóa có mặt trong các lựa chọn của câu tương ứng. Kiểm tra bao phủ cấu trúc và tính toàn vẹn byte. Việc thẩm định độ chính xác chuyên môn của đáp án cần đối chiếu tài liệu nguồn gốc ngoài tệp.

## Chức năng và trạng thái xác minh

| Nhóm | Chức năng hiện có | Bằng chứng giai đoạn 1 |
| --- | --- | --- |
| Chọn ngân hàng | Hóa Sinh 2, Vi sinh toàn bộ, Vi sinh trọng tâm | Mở cả ba ở hai kích thước, đối chiếu số ID và nhóm trọng tâm. |
| Luyện tập | Lọc chủ đề/dạng/trạng thái, tìm kiếm, trộn, đánh dấu, chấm, điều hướng, giải thích, lưu hoặc bỏ lượt, tiếp tục và mở rộng phạm vi | Chọn đáp án đúng, chấm, đánh dấu, lưu, tải lại và tiếp tục thành công. Đã mở hộp thoại thoát và dùng nút bỏ lượt. |
| Học theo chủ đề | Danh mục, tiến độ, chọn nhóm câu | Mở một chủ đề, xác nhận phiên có danh sách câu. |
| Thi thử | Cấu hình chủ đề/dạng/khóa, đồng hồ, đánh dấu, nhảy câu, nộp và tổng hợp | Bắt đầu, tải lại và khôi phục trạng thái, nộp thủ công. |
| Ôn câu sai | Lọc câu sai từ tiến độ và bài thi, chấm lại | Mở được chế độ; vòng đời câu sai cần chạy ở bộ kiểm thử tiếp theo. |
| Thẻ và tra cứu | Lật thẻ, duyệt câu, tìm đáp án và mở giải thích | Lật thẻ đổi nội dung, danh sách tra cứu có mục dữ liệu. |
| Thống kê và sao lưu | Tổng hợp, lịch sử, xuất và nhập JSON | Mở được thống kê. Xuất JSON từ trình xử lý DOM; khả năng truy cập nút từ UI cần kiểm tra thêm. |
| Hình thực hành | Album ảnh và phóng to | Mở album Hóa Sinh 2, giải mã được 12/12 ảnh sau khi gán nguồn. |
| Trọng tâm và kế hoạch | Phân tầng, vòng tiến độ, phạm vi, ôn ngắt quãng và kế hoạch theo ngày | Lọc 388 câu, bắt đầu phiên đề xuất 30 câu, khởi chạy phiên kế hoạch. |
| Trình bày và điều hướng | Giao diện sáng/tối, thanh phiên, lưới và phím tắt | Đổi sang giao diện tối, mở ứng dụng ở 1280×800 và 390×844; chiều rộng tài liệu khớp viewport khi kiểm tra trang chọn chế độ. |

## Lỗi và phần chưa hoàn thiện

| Mã | Quan sát và tác động |
| --- | --- |
| CQ-01 | Dữ liệu thiếu khóa ở 10 ID, ba ID Hóa Sinh 2 còn thiếu lựa chọn. Ứng dụng có nhánh xử lý không chấm. Các giá trị gốc được giữ nguyên. |
| CQ-02 | Vi sinh chỉ có 24 mục giải thích cho 500 câu. Phần còn lại chưa có nội dung giải thích trong tệp chuẩn. |
| CQ-03 | Bắt đầu bài thi Vi sinh, chuyển sang Hóa Sinh 2, xác nhận rồi quay lại Vi sinh. Bài cũ vẫn ở trạng thái đang thi và lịch sử chưa có mục mới. Hộp thoại chỉ nhắc nộp trước khi chuyển, nhưng cho phép rời ngân hàng khi bài thi còn hoạt động. |
| CQ-04 | Mở Thống kê và kiểm tra `#exportProgress` thấy nút ẩn ở trạng thái mặc định. Gọi handler qua DOM tải được JSON. Cần xác minh đầy đủ các đường mở cài đặt trước khi kết luận người dùng không thể xuất qua UI. |
| CQ-05 | JSON xuất Vi sinh ghi `vi-sinh-495` dù có 500 câu. Đây có thể là mã tương thích; cần kiểm thử nhập bản cũ trước khi đổi. Backup schema 1 thiếu `learning21`, `planner22` và khóa phiên luyện riêng, nên JSON xuất không mang đủ dữ liệu để phục hồi lịch ôn và phiên trên profile mới. |
| CQ-06 | Đọc mã cho thấy cơ chế lưu trạng thái chung bỏ qua lỗi ghi `localStorage`. Khôi phục trong cùng origin đã chạy thành công; tình huống hết dung lượng hoặc storage bị chặn còn cần tái hiện. |

## Bằng chứng kiểm thử

Kiểm tra trên Chromium 156.0.8078.79 qua HTTP cục bộ với Playwright. Kiểm tra cú pháp bằng `node --check` cho script vỏ và cả 27 khối script nhúng đều đạt. Các ca đã chạy, kết quả và quan sát tái hiện được ghi cụ thể trong hai bảng trên. Kiểm tra cú pháp và trình duyệt đều dùng nội dung từ tệp đính kèm, không chỉnh code ứng dụng.

Ma trận [kiểm thử tự động](TEST-PLAN.md) ghi các ca cần bổ sung, gồm tự nộp khi hết giờ, vòng nhập/khôi phục, so ảnh giao diện, bàn phím và trình duyệt khác. Các ca này chưa được dùng để nghiệm thu chức năng ở giai đoạn 1.
