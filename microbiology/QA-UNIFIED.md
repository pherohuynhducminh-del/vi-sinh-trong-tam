# Bản ứng viên Học hợp nhất và Focus Touch

Build `e172acc9ed0cea763c69`, ngày 25/11/2026. Nền Vi sinh M1–M5 tại `9ac325bb3f4ba5cebf53996252aa18a844a18006`. Bản ứng viên chờ phê duyệt phát hành.

## Hành vi

- Chế độ Học chấm ngay khi chọn đáp án một lựa chọn. Thẻ chương, mục, chủ đề và tầng mở phiên trong phạm vi đang chọn, theo cách học đã chọn. Phiên Luyện tập đời trước tiếp tục với nhãn Học và cùng tiến độ.
- Thứ tự thẻ là Vi sinh đại cương, Vi khuẩn học, Virus học, Miễn dịch và Kháng sinh. Các mục đại cương đi trước nhóm chuyên biệt. Chủ đề giữ thứ tự xuất hiện trong dữ liệu nguồn. Thứ tự bản ghi và các nhãn phân loại gốc giữ nguyên.
- Số đã làm dựa trên câu từng có lựa chọn. Số thiếu khóa thuộc tính ngân hàng và có thể giao với số chưa làm. Nút ôn sai và ôn đến hạn giới hạn theo phạm vi thẻ và bộ lọc đang áp dụng.
- Học câu chưa làm giữ hành vi M1–M5. Khi còn đúng một câu chưa làm, phiên đưa câu đó lên đầu, sau đó cho phép tiếp tục qua các câu khác trong phạm vi. Một chủ đề hoặc tìm kiếm có đúng một kết quả vẫn là phiên một câu.
- Lược đồ và khóa lưu hiện tại được giữ nguyên. Ứng dụng tiếp tục dùng một phiên hiện hành hoặc đã lưu. Thay phiên cần xác nhận. Giải thích hiển thị nơi bản nguồn có nội dung.

## Kiểm thử

| Nhóm | Kết quả |
| --- | --- |
| Module | [6/6 đạt](test/evidence/unified/modules.log) |
| Chromium 158.0.8127.0 | [6/6 đạt](test/evidence/unified/chromium.log) |
| WebKit 26.5 | [6/6 đạt](test/evidence/unified/webkit.log) |
| Toàn vẹn | `questions.json` và 12 JPEG trùng từng byte với bản M1–M5 đang phát hành |
| Phạm vi PWA | 24 mục cache, tất cả nằm trong `/microbiology/`. Mở lại phiên và ảnh khi không truy cập máy chủ |
| Hồi quy | 500/388, 0/1 câu, đổi ngân hàng, tìm ID 497, snapshot 387/388, ôn sai qua 4 cấp, học ngẫu nhiên, tải lại, lưu và tiếp tục, thi thử, sao lưu, lập kế hoạch |

## Ảnh WebKit mô phỏng

- [Trang Học iPhone](test/evidence/unified/iphone-learning.png)
- [Focus Touch iPhone](test/evidence/unified/iphone-focus.png)
- [Focus Touch iPad dọc](test/evidence/unified/ipad-portrait.png)
- [Focus Touch iPad ngang](test/evidence/unified/ipad-landscape.png)

Các ảnh và thao tác được kiểm tra trên cấu hình mô phỏng của Playwright. WebKit kiểm tra chạm và đường xử lý vuốt bằng sự kiện con trỏ, Chromium chạy luồng vuốt qua giao thức điều khiển trình duyệt. Safari trên thiết bị thật, nâng cấp PWA từ bản đang cài và HTTPS công khai của phiên bản mới chờ kiểm thử sau khi phê duyệt.
