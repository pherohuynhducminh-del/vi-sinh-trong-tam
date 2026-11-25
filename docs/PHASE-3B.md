# Giai đoạn 3B · Điều tra phiên 1/1 ở ID 497

## Tái hiện và nguyên nhân

Bản HTTPS 3A tái hiện đúng triệu chứng khi vào **Vi sinh trọng tâm**, chọn **Mục tiêu · 388**, đã có tiến độ cho 387 câu và chỉ còn ID 497 chưa trả lời. Nút **Học câu chưa trả lời** trước đây đưa toàn bộ danh sách chưa trả lời vào `S.session`. Khi danh sách chỉ có ID 497, điều hướng đóng băng danh sách một phần tử, hiển thị `Câu 1 / 1 · ID 497` và vô hiệu hóa cả Trước lẫn Tiếp. Khóa phiên theo phạm vi có thể lưu và khôi phục danh sách này. Nội dung câu vẫn là “Gen mã hóa p24 là:”.

Ngân hàng Vi sinh dùng chung 500 câu và tiến độ cho hai iframe Vi sinh. Chế độ trọng tâm áp dụng phân tầng và bộ chọn phạm vi trên cùng dữ liệu. Hóa Sinh 2 dùng khóa tiến độ riêng. Tệp vỏ đọc ngân hàng gần nhất từ `sessionStorage` và dựng lại iframe khi chuyển. Mỗi iframe đọc `localStorage` theo origin, với tiền tố riêng của bản thử nghiệm. Danh sách phiên luyện được lưu riêng cho Vi sinh thường và trọng tâm. Bản ghi học/ôn đời cũ có thể dùng chung giữa hai chế độ, và thiếu phạm vi ở một số phiên bản, nên không đủ để suy ra ý định. Điều hướng dùng danh sách phiên nếu có, sau đó áp dụng bộ lọc; số 388 là phạm vi ngân hàng, còn mẫu số 1 là kích thước danh sách điều hướng.

Bộ kiểm thử trước dùng tài khoản sạch hoặc giới hạn chủ động, chủ yếu kiểm tra ID 1 ở Hóa Sinh 2 và chủ đề một câu. Nó không tạo tiến độ 387/388 rồi mở nút học chưa trả lời, cũng không hết phiên với snapshot trọng tâm cũ chứa `[497]`. Ca tái hiện trên Chromium chứng minh đường lỗi này cũng tồn tại ngoài iPhone. Chưa có báo cáo trạng thái từ iPhone để xác định người dùng đi qua nút nào hoặc đã khôi phục bản ghi nào.

## Thay đổi và bảo vệ tiến độ

- Khi shortcut **Học câu chưa trả lời** chỉ tìm được một câu, phiên bắt đầu từ câu đó, tiếp theo là các câu trong đúng phạm vi đang chọn. Nếu có nhiều câu chưa trả lời, thuật toán giữ danh sách chưa trả lời như trước.
- Khi mở bản cũ, chỉ mở rộng snapshot luyện trọng tâm một câu nếu khớp mẫu cũ: biết phạm vi, mọi câu khác trong phạm vi đã có câu trả lời, và không có dấu hiệu tìm kiếm hoặc lọc chủ động. Tìm đích danh 497 và phiên giới hạn chủ động mới vẫn có thể là 1/1. Các bản ghi thiếu bằng chứng về phạm vi được giữ nguyên. Việc sửa chỉ ghi vị trí và danh sách điều hướng vào snapshot, giữ nguyên câu trả lời, đánh dấu và lịch sử thi. Lưu ký hiệu phiên mới để tránh diễn giải lại ở lần tải tiếp theo.
- Giữ nguyên bản chuẩn, dữ liệu đề, ảnh, đáp án, phân tầng và khóa riêng của website Vi sinh gốc.

## Chẩn đoán trên thiết bị thật

Mở [trang thử nghiệm có chẩn đoán](https://pherohuynhducminh-del.github.io/vi-sinh-trong-tam/clinical-quiz/?diagnostics=1) trên cùng Safari đang có tiến độ. Nếu lỗi còn hiện, giữ phiên đang mở, cuộn cuối trang trong ngân hàng để mở **Chẩn đoán Clinical Quiz**, chạm **Cập nhật chẩn đoán** và sao chép hộp báo cáo. Ghi thêm nút đã chạm ngay trước khi màn 1/1 xuất hiện. Báo cáo liệt kê ngân hàng, chế độ, phạm vi, số câu phiên/lọc, ID hiện tại, dấu hiệu bộ lọc và khả năng truy cập nơi lưu. Báo cáo không chứa đáp án, nội dung ô tìm kiếm, định danh tài khoản hay dữ liệu thô từ bộ nhớ. Dữ liệu ở trên máy cho tới khi người dùng tự sao chép.

Ca iPhone thật vẫn chờ kiểm thử lại. [Checklist thiết bị thật](DEVICE-CHECKLIST.md)

## Bằng chứng và triển khai

- [Tái hiện trước và sau](evidence/phase-3b/repro.log) ghi ID 497, nguyên văn câu, kích thước phiên và trạng thái hai nút. [Ca hồi quy tập trung](evidence/phase-3b/focused.log) đạt.
- [CI Chromium và WebKit](https://github.com/pherohuynhducminh-del/vi-sinh-trong-tam/actions/runs/45571372473) đạt cả build, toàn vẹn và toàn bộ hồi quy tại commit mã nguồn `8c15c29ee329bf61607c3f133a4c6bfde326a1ad`. Ca ID 497 gồm profile mới, tiến độ 387/388, snapshot đời cũ, tìm chủ động 497, bảo toàn tiến độ khi đổi ba ngân hàng và chẩn đoán.
- Commit triển khai `c79aef4c3854b2aa45bb2621060b7827573f5a2d` sửa duy nhất `clinical-quiz/index.html`. [GitHub Pages](https://github.com/pherohuynhducminh-del/vi-sinh-trong-tam/actions/runs/45571628567) triển khai thành công. Nội dung tải qua HTTPS trùng tệp triển khai với SHA-256 `d7ad3b59c40bf8f52c48732ff885470dcdebcbe5173acfb76d13cbd126aa9e41`. Trang Vi sinh gốc vẫn trả HTTP 200 với cùng SHA-256 `fdbb3428f394b46cf71676c911aad513a7046702ce86c938fa6bb49ff1fd3391` trước và sau.
- [Kiểm tra trên URL thật](evidence/phase-3b/live.log) xác nhận HTTP 200, ID 497 ở 1/388, nút Tiếp hoạt động và chẩn đoán 3B.1 trong Chromium và WebKit mô phỏng. Kiểm tra chức năng dùng profile tạm với cấu hình chứng chỉ proxy như giai đoạn 3A.
