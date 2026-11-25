# Hóa Sinh 2 RC7 · Học hợp nhất

Bản ứng viên cho `/biochemistry/`. Nhánh này bắt đầu từ `832ca1b` sau khi Vi sinh độc lập đã được tích hợp. Bản RC7 + Focus Touch đang chạy tại `def18dad` là mốc phục hồi của ứng dụng. Nếu cần phục hồi sau triển khai, hoàn nguyên riêng commit phát hành Hóa Sinh hoặc khôi phục riêng `biochemistry/` từ mốc đó, đồng thời tăng phiên bản cache.

## Phạm vi chức năng

- Danh mục vẫn chia chương và chủ đề. Bốn chương được sắp xếp theo thứ tự RC7. Mỗi thẻ có số câu, đã làm, đúng, sai, chưa làm, chưa có đáp án và thanh tiến độ.
- Học toàn bộ, theo chương, theo chủ đề, ngẫu nhiên, tiếp tục phiên, câu chưa làm, làm lại câu đã làm, học lại toàn bộ, ôn sai, câu đánh dấu. Mỗi lần bắt đầu hoặc lọc tạo danh sách ID cố định. Bộ lọc nâng cao chỉ có hiệu lực khi người học áp dụng.
- Trong phiên Học và Ôn sai, Focus Touch tự bật. Có chấm ngay với câu đơn theo tùy chọn, chấm thủ công câu nhiều đáp án, giải thích khi có, highlight, đánh dấu, chọn nhanh câu và tiến độ phiên. Câu không có khóa được thông báo và không đổi số câu đúng/sai. Câu không có phương án có thể đánh dấu đã đọc.
- Tiến độ chung ghi đáp án đã chấm gần nhất theo ID. Khi nộp thi, các phương án đã chọn cũng cập nhật tiến độ chung một lần. Điểm và lịch sử bài thi vẫn lưu riêng. Sửa đúng một câu sai bỏ cờ cần ôn, giữ số lượt sai và lựa chọn sai đã ghi nhận. Học lại bắt đầu phiên mới và giữ tiến độ.
- Học, Thẻ ghi nhớ, Thi thử, Ôn câu sai, Xem đáp án, Thống kê và Cài đặt có lối vào riêng. Cài đặt chứa tùy chọn hiển thị, chấm điểm, sao lưu, khôi phục và xóa tiến độ học sau xác nhận. Cấu hình bài thi chỉ hiện trong Thi thử.
- Dùng lại khóa tiến độ RC7 và đọc dự phòng v4.1. Bản sao lưu mới dùng schema 2. Bản này nhập được schema 1 của RC7. Với dữ liệu RC7 cũ, chỉ phục hồi được lịch sử sai còn được lưu, vì RC7 không ghi lại đầy đủ từng lượt sai đã khắc phục.
- Service worker cache các tài nguyên Hóa Sinh trong phạm vi `/biochemistry/`.

## Kiểm thử

```sh
cd biochemistry
npm ci
npx playwright install --with-deps chromium webkit
npm test
```

Có thể đặt `RC7_ORIGINAL` trỏ tới HTML RC7 gốc để đối chiếu toàn bộ câu hỏi và phân loại. Có thể đặt `SCREENSHOT_DIR` thành đường dẫn tuyệt đối để tạo ảnh giả lập iPhone, iPad dọc và iPad ngang. Các bài kiểm thử chạy trên máy chủ loopback, bao gồm ngắt máy chủ sau khi cache thành công.

Đã chạy kiểm thử trên Chromium desktop/Android và WebKit iPhone/iPad dọc/iPad ngang, cùng ca dữ liệu cũ và sao lưu/khôi phục trên cả hai engine. Ngân hàng giữ SHA-256 `4b639eb045ab5b6c8941debd7c1568b4541ac265580ec172e8e5f3227cb1d6e8`, khớp 296 câu, 288 khóa và 8 câu thiếu khóa. Kiểm tra HTTPS cục bộ bằng chứng chỉ thử xác nhận mã 200, secure context, phiên Học toàn môn và phạm vi service worker đúng trên Chromium và WebKit.

## Trước khi xuất bản

1. Chờ người dùng phê duyệt triển khai. Kiểm tra lại `main` và chỉ đưa tài nguyên chạy của `biochemistry/` vào nguồn Pages hiện tại.
2. Kiểm tra tài nguyên HTTPS và đối chiếu website gốc, Vi sinh và Clinical Quiz trước và sau xuất bản.
3. Nghiệm thu trên Safari iPhone và iPad thật, gồm xoay màn hình, làm câu sai rồi ôn lại, mở lại tiến độ, sao lưu và thêm vào màn hình chính. Bản ứng viên chưa qua bước này.
