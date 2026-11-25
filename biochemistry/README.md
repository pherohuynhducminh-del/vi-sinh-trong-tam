# Hóa Sinh 2 V8.0 RC7

Ứng dụng tĩnh tại `/biochemistry/`, dựa trên đúng bản `MCQ_Hoa_Sinh_2_V8_0_RC7.html` được xác nhận. Bản gốc có SHA-256 `cfef6d14ae72de346bd2e3b7d0812dc4a8c56f38ab927fbd046cef9c2d3d44bd`.

| Tệp | Vai trò |
| --- | --- |
| `index.html`, `styles.css`, `ui.js` | Giao diện RC7, điều hướng và các trình xử lý tương tác |
| `bank.js` | 296 câu, 288 khóa, giải thích và quy tắc phân chương/mục từ RC7 |
| `domain.js` | Tra cứu, phân loại, chấm điểm và các hàm phiên học dùng chung |
| `state.js` | Trạng thái, tùy chọn và lưu tiến độ RC7 |
| `app.webmanifest`, `install.js`, `sw.js` | Cài lên màn hình chính và đọc ngoại tuyến sau lần tải đầu |

## Bảo toàn

Tách các phần từ cùng một tệp HTML, giữ thứ tự câu và lựa chọn, ký hiệu, công thức, khóa đáp án, nội dung giải thích, phân loại và giao diện. Giữ 8 câu thiếu khóa theo RC7. Các luồng có sẵn gồm Học, Luyện tập, Ôn câu sai, Thi thử, Flashcard, Toàn bộ đáp án, Thống kê, đánh dấu, tô từ khóa, sáng/tối, tập trung và sao lưu tiến độ.

Giữ nguyên khóa Hóa Sinh `mcqhs2_v5` và `mcqhs2_v5_prefs`, gồm đường đọc dữ liệu v4.1. Dữ liệu trong HTML đã mở bằng tệp cục bộ hoặc trên tên miền khác cần được xuất sao lưu và nhập lại theo giao diện RC7 vì trình duyệt lưu theo nguồn. Xuất bản trên cùng nguồn sẽ đọc được các khóa tương ứng đã tồn tại.

## Kiểm thử

Từ thư mục `biochemistry/`:

```sh
npm ci
npx playwright install --with-deps chromium webkit
npm test
```

Có thể đặt biến `RC7_ORIGINAL` trỏ đến file RC7 gốc để đối chiếu từng đối tượng câu hỏi, khóa và chủ đề. Bộ kiểm thử mặc định xác minh checksum các tài nguyên đã tách và số lượng bản ghi. Kiểm thử trình duyệt chạy Chromium và WebKit trên hồ sơ desktop và cảm ứng, có các ca tải lại tiến độ, dữ liệu cũ, phiên thi và ngoại tuyến. Hồ sơ iPhone/iPad là giả lập của Playwright. Sau khi xuất bản, kiểm tra lại trên Safari và thao tác Thêm vào màn hình chính bằng thiết bị thật.

## GitHub Pages

URL dự kiến sau phê duyệt và triển khai là [Hóa Sinh 2 trên GitHub Pages](https://pherohuynhducminh-del.github.io/vi-sinh-trong-tam/biochemistry/). Ứng dụng chỉ cần phục vụ thư mục tĩnh từ gốc site. Các đường dẫn tài nguyên là tương đối.

1. Sau khi nghiệm thu, đưa thư mục `biochemistry/` vào nhánh và thư mục mà GitHub Pages hiện xuất bản. Xác minh nguồn hiện tại tại **Settings → Pages**. Giữ nguyên nguồn của trang Vi sinh đang chạy.
2. Sau khi Pages báo triển khai thành công, mở URL HTTPS ở trên và kiểm tra tiêu đề V8.0 RC7, tải lại tiến độ và phần thi thử. Trên Safari iPhone/iPad, dùng **Chia sẻ → Thêm vào màn hình chính**.
3. Mỗi khi sửa tài nguyên đã lưu ngoại tuyến, tăng phiên bản `cacheName` trong `sw.js` cùng lần phát hành. Service worker chỉ phục vụ tài nguyên ứng dụng bên trong route Hóa Sinh.

[Hướng dẫn nguồn xuất bản GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
