# Giai đoạn 3A · Triển khai thử nghiệm

## Bản triển khai

- [Clinical Quiz qua HTTPS](https://pherohuynhducminh-del.github.io/vi-sinh-trong-tam/clinical-quiz/) trả HTTP 200, `text/html; charset=utf-8`.
- Commit [`b8d56ef37dbeb811a850284bef7ae300919c0e37`](https://github.com/pherohuynhducminh-del/vi-sinh-trong-tam/commit/b8d56ef37dbeb811a850284bef7ae300919c0e37) trên `main` thêm duy nhất `clinical-quiz/index.html`. [Lần triển khai Pages](https://github.com/pherohuynhducminh-del/vi-sinh-trong-tam/actions/runs/45570270090) thành công, trạng thái Pages là `built`.
- HTML tải qua HTTPS trùng từng byte với tệp tại commit triển khai. SHA-256 là `7a29c24a3b9ae59f3625b94b3e39d65b5e4c8fcb26be923aa4eccd094f406a5f`.
- Trang gốc trả HTTP 200 trước và sau triển khai. SHA-256 cả hai lần là `fdbb3428f394b46cf71676c911aad513a7046702ce86c938fa6bb49ff1fd3391`. Blob Git của `index.html` gốc vẫn là `f2575194b6777977a5a80b5d12d004ffcface20b`. Nguồn Pages vẫn là `main:/`.
- Bản thử nghiệm dùng khóa lưu cục bộ có tiền tố `clinical-quiz:` để bảo vệ tiến độ của trang gốc khi hai trang dùng chung origin. Bản thử nghiệm khởi đầu với tiến độ riêng và vẫn nhập được bản sao lưu theo định dạng ở giai đoạn 2.

## Kiểm thử

- Build lại tạo cùng nội dung đã commit. Bản chuẩn có SHA-256 `ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123`. Kiểm tra toàn vẹn xác nhận nội dung hai ngân hàng và kho ảnh giữ nguyên. Các bộ hồi quy cục bộ đều đạt sau khi tách lưu trữ. [Chromium](evidence/phase-3a/chromium.log) · [WebKit](evidence/phase-3a/webkit.log)
- GitHub Actions chạy khi cập nhật mã hoặc mở pull request vào `develop`. Hai job Chromium và WebKit tại commit nguồn `f656b6566f991e1ad289c78ce85b6cbe53953f79` đã đạt. Artifacts của workflow chứa ảnh và nhật ký. [Lần chạy CI](https://github.com/pherohuynhducminh-del/vi-sinh-trong-tam/actions/runs/45570088276)
- Kiểm tra URL thật trong Chromium và WebKit mô phỏng xác nhận 296/500/388 câu, 12/12 ảnh, thao tác cảm ứng, phiên một câu, lưu và mở lại, cùng cách ly tiến độ của trang gốc. Hai trình duyệt không ghi nhận lỗi JavaScript hoặc yêu cầu tài nguyên thất bại. [Nhật ký kiểm tra HTTPS](evidence/phase-3a/https-smoke.log)
- `curl` xác thực chứng chỉ qua kho CA của môi trường. Cấu hình Chromium tự động ban đầu từ chối CA của proxy kiểm thử. Kiểm tra chức năng hai engine dùng context tạm có bỏ qua lỗi chứng chỉ proxy. Thiết lập này chỉ áp dụng cho kiểm thử.
- Safari trên iPhone và iPad thật chưa được kiểm thử. [Checklist thiết bị thật](DEVICE-CHECKLIST.md)
