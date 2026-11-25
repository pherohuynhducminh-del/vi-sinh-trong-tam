# Bản ứng viên Học theo độ bao phủ

Build `ebc76a4743f5e03fd4a2`. Bản ứng viên dành cho nghiệm thu trước triển khai.

## Dữ liệu và cách tính

[Bảng phân bố 54 chủ đề theo chương, mục và tầng](test/evidence/priority/phan-bo-chu-de.csv)

| Phạm vi | Tầng | Số câu |
| --- | --- | ---: |
| Phủ tầng 1 | 1 | 273 |
| Phủ tầng 1 và 2 | 1, 2 | 315 |
| Phủ trọng tâm | 1, 2, 3 | 388 |
| Phủ toàn bộ | 1, 2, 3, 4 | 500 |

- Phân bố từng tầng tính trên số câu gốc của chủ đề, mục hoặc chương. Bộ chọn hiện số câu khả dụng theo ngân hàng và bộ lọc. Tầng 4 có 112 câu và khả dụng trong ngân hàng Toàn bộ.
- Tỷ lệ được chọn dùng mẫu số phạm vi sau lọc, trước khi chọn tầng. Tỷ lệ đã làm dùng số câu đã chọn. Tỷ lệ đúng dùng số câu đã chấm đúng hoặc sai. Ký hiệu **—** biểu thị mẫu số bằng 0.
- Xếp hạng dùng tiêu chí người học chọn và số liệu trong ngân hàng, tìm kiếm, bộ lọc đang áp dụng trước khi chọn tầng. Danh sách chỉ hiện chủ đề có kết quả. Nếu bằng nhau, thứ tự gốc quyết định vị trí. Chế độ mặc định giữ thứ tự kiến thức.
- Bộ chọn tầng trong từng phạm vi có thể điều chỉnh lựa chọn của phiên đó. Phiên được lưu dùng danh sách ID đã chọn. Các lựa chọn trên trang Học khởi tạo theo ngân hàng khi tải lại.
- `questions.json`, 12 JPEG và `persistence.mjs` trùng từng byte với bản phát hành Unified Learning & Focus Touch.

## Bằng chứng kiểm thử

- [Module 7/7](test/evidence/priority/modules.log), [Chromium 7/7](test/evidence/priority/chromium.log), [WebKit 7/7](test/evidence/priority/webkit.log).
- Kiểm thử tổ hợp tầng, thứ tự ID, 4 phạm vi phủ nhanh, mở phiên theo tầng trong một chủ đề, xếp hạng, phiên ID 497, đổi ngân hàng, ôn sai, sao lưu và mở ngoại tuyến.
- [Trang Học trọng tâm trên iPhone mô phỏng](test/evidence/priority/hoc-trong-tam-iphone.webp) · [Focus Touch trên iPad mô phỏng](test/evidence/priority/focus-touch-ipad.webp).

Safari trên thiết bị Apple thật và nâng cấp PWA qua HTTPS công khai chờ giai đoạn triển khai.
