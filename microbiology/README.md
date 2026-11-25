# Vi sinh độc lập

Ứng dụng tĩnh tại `/microbiology/`. Dữ liệu được đóng gói từ bản Clinical Quiz 2.6 bất biến đã kiểm toán. Trang chạy độc lập bằng ES modules, service worker và localStorage.

- `build.mjs` đọc các literal JSON từ bản chuẩn, kiểm chứng dữ liệu và tạo gói phục vụ.
- `domain.mjs` lập chỉ mục theo ID, lọc, chấm và lập lịch ôn.
- `session.mjs` lưu danh sách ID có thứ tự, vị trí, chế độ và câu trả lời phiên.
- `state.mjs` điều phối sự kiện giữa phiên, lựa chọn ngân hàng và tiến độ.
- `persistence.mjs` kiểm tra lưu trữ phiên bản mới, chuyển tiến độ và nhập/xuất sao lưu.
- `app.mjs` hiển thị ứng dụng và tiếp nhận thao tác.

Ngân hàng, tiêu chí lọc và phiên đang mở là các trạng thái độc lập. Một phiên khóa phạm vi tại lúc tạo. Khi chỉ còn một câu chưa làm, lệnh học tiếp đặt câu đó đầu danh sách trong phạm vi đang chọn để giữ điều hướng. Lọc đích danh hoặc chọn chủ đề một câu tạo danh sách một phần tử hợp lệ. Tiến độ dùng ID gốc, còn vị trí phiên chỉ biểu diễn thứ tự duyệt.

## Dữ liệu và tiến độ

Bản chuẩn có SHA-256 `ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123`. Bộ build lấy đúng ngân hàng Vi sinh đang hoạt động trong bản chuẩn và giữ thứ tự dữ liệu. Nguồn có 5 chương và 54 chủ đề. Bộ lọc thêm 8 mục học từ các chủ đề sẵn có, giữ nguyên nhãn gốc để đối chiếu. Tầng 1–3 tạo tập trọng tâm 388 câu. Câu 340 và 394 hiển thị tình trạng thiếu khóa. Hai bản ghi 424 và 428 giữ khóa tương ứng D và A theo nguồn. Bộ ảnh giữ cả 12 JPEG và chú thích.

Tiến độ mới dùng một khóa localStorage riêng, dùng chung cho hai ngân hàng. Ứng dụng duy trì một phiên đang mở hoặc đã lưu. Phiên cũ chỉ được tiếp tục khi xác định được phạm vi và ánh xạ bộ lọc. Tiến độ từ bản cũ có thể chuyển qua dữ liệu cục bộ cùng origin hoặc tệp sao lưu Vi sinh v1/v2. Với snapshot học cũ có phạm vi mơ hồ hoặc bộ lọc dạng câu chưa tương thích, ứng dụng khôi phục tiến độ và người học tạo phiên mới. Một bài thi đang chạy tính thời gian theo hạn chót kể cả khi đóng trang.

## Chạy kiểm thử

```bash
npm ci
npx playwright install --with-deps chromium webkit
node --test microbiology/test/modules.test.mjs
MICRO_ENGINE=chromium node --test --test-timeout=75000 microbiology/test/browser.test.mjs
MICRO_ENGINE=webkit node --test --test-timeout=75000 microbiology/test/browser.test.mjs
```

## Tạo bản ứng viên

```bash
node microbiology/build.mjs /tmp/vi-sinh-candidate
python3 -m http.server 8765 --bind 127.0.0.1 --directory /tmp/vi-sinh-candidate
```

Bản build tự chứa nằm tại `/tmp/vi-sinh-candidate/microbiology/`. Xem trước nội bộ qua `http://127.0.0.1:8765/microbiology/`. Khi có phê duyệt triển khai, đặt thư mục này tại `/microbiology/` trên máy chủ HTTPS và phục vụ `.mjs` với kiểu nội dung JavaScript. Máy chủ cần chuyển hướng `/microbiology` sang `/microbiology/`. Service worker chỉ kiểm soát thư mục ứng dụng và báo sẵn sàng sau khi bộ nhớ đệm chứa đủ trang, dữ liệu và ảnh.

[Báo cáo nghiệm thu](QA.md)
