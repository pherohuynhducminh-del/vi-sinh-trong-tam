# Tính toàn vẹn dữ liệu Clinical Quiz

Bản chuẩn `nkhkjjhkkjjh.html` có SHA-256 `ed9205578d42b736ddc3d42d5e386b1521f597700b35aaef70dafc5640ac3123`. Bản phát triển nằm ở `clinical-quiz/index.html`, được tạo qua `node scripts/build-quiz.mjs`. Lệnh kiểm tra SHA-256 trước khi tạo bản phát triển.

## Câu thiếu khóa trong dữ liệu gốc

| Ngân hàng | ID | Nhận diện câu | Số lựa chọn |
| --- | ---: | --- | ---: |
| Hóa Sinh 2 | 73 | Triglycerid nếu quá có thể dẫn đến viêm tụy cấp tính | 4 |
| Hóa Sinh 2 | 213 | Bài tính Creatinin Clearance với VNT 1.400 ml/24 giờ | **0** |
| Hóa Sinh 2 | 217 | Phương pháp Benedict | 5 |
| Hóa Sinh 2 | 230 | Cho các phản ứng Molish và Fehling | **0** |
| Hóa Sinh 2 | 232 | Các bước sóng | 4 |
| Hóa Sinh 2 | 236 | Glucose tăng khi u não, u tủy thượng thận | **0** |
| Hóa Sinh 2 | 246 | Hóa chất phù hợp với từng loại xử trí | 6 |
| Hóa Sinh 2 | 296 | Các bước sóng phù hợp | 4 |
| Vi sinh | 340 | Nhiệt độ thích hợp cho vi khuẩn dịch hạch tăng trưởng | 4 |
| Vi sinh | 394 | Đường lây của nhiễm trùng bệnh viện | 4 |

Các cột nhận diện chỉ để tra cứu theo ID. Câu 213, 230 và 236 cũng là toàn bộ ba câu thiếu lựa chọn. Mọi câu, lựa chọn và khóa được giữ ở trạng thái nguồn. Xem [kiểm kê số lượng và phân tầng](AUDIT.md#kiểm-kê-dữ-liệu).
