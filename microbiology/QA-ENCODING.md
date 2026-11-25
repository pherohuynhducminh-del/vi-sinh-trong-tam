# Kiểm định chữ tiếng Việt và ký hiệu Vi sinh

Bản ứng viên UTF-8 NFC `1a8dbb8fc600b83db7dd`. Mốc phục hồi đang phát hành là commit `8a5549e4e8ae9d35ee8314f5fe66b5e24f464760`.

## Nguồn lỗi

PDF ngân hàng Vi sinh, SHA-256 `a173b058255b15c12d7e7ea14e9438db8a23a9bf14c879b1d83cd88bbd1008aa`, hiển thị đúng ở trang PDF 17–18 nhờ font VNI-Times. Bộ trích xuất đưa ký tự VNI như `Nhieãm` và `thuoäc` vào chuỗi UTF-8 mà thiếu bước đổi mã. Trong cùng một câu, các đoạn Unicode chuẩn vẫn đọc đúng. Một nhóm ký hiệu từ font Symbol được trích thành mã Private Use và các chỉ số trong PDF bị chuyển thành ký tự cùng dòng. Kiểm kê bản phát hành không phát hiện cụm TCVN3 hoặc chuỗi lỗi giải mã UTF-8 khác cần sửa. Ký hiệu µ và μ hợp lệ trong nguồn được giữ.

## Phạm vi sửa

| Nhóm | Số câu | ID |
| --- | ---: | --- |
| VNI hoặc VNI trộn Unicode | 12 | 255–266 |
| Ký hiệu Symbol, nhiệt độ, công thức | 18 | 104, 120, 197, 200, 210, 217, 223, 227, 250, 251, 278, 280, 288, 296, 303, 340, 466, 485 |
| Tổng | 30 | 75 trường câu hỏi hoặc phương án |

| ID | Trước | Sau |
| --- | --- | --- |
| 257 | Nhieãm truøng cô hoäi laø gì ? | Nhiễm trùng cơ hội là gì ? |
| 258 | Tieân löôïng AIDS chuû yeáu döïa vaøo yếu tố nào ? | Tiên lượng AIDS chủ yếu dựa vào yếu tố nào ? |
| 259 | HIV thuoäc nhoùm : | HIV thuộc nhóm : |
| 217 | 37OC, CO2, mã Symbol cho alpha và beta | 37°C, CO₂, α và β |
| 296 | – 200C, – 700C | – 20°C, – 70°C |

[Nhật ký đầy đủ từng trường, trước và sau, kèm số trang PDF](encoding-corrections.json). Các đoạn VNI được đối chiếu với trang PDF hiển thị và font của từng đoạn. Nhiệt độ và công thức được đối chiếu với vị trí dưới hoặc trên dòng của ký tự gốc. ID 120 và 121 có câu dẫn về một công thức không nhìn thấy trên trang PDF đối chiếu, nên giữ câu dẫn và ghi chú sẵn có. Riêng chỉ số N₀ ở câu 120 có thể xác nhận trực tiếp. Các cách viết, lỗi đánh máy hoặc khóa đã có trong đề được giữ theo nguồn.

## Kiểm định

- Quét mọi chuỗi trong 500 bản ghi và 12 chú thích ảnh. Phạm vi gồm câu hỏi, phương án, nhãn phân loại, giải thích và ghi chú nguồn. Tìm kiếm và từ khóa highlight lấy từ nội dung đã kiểm định. H₂O₂ vẫn tìm được bằng H2O2.
- Kiểm tra NFC, ký tự ngoài bảng kiểm kê, mã Private Use, mẫu VNI còn sót và UTF-8 lỗi. Build dừng nếu trường trước sửa không khớp bản nguồn. Kiểm thử có mẫu VNI, TCVN3, ký tự thay thế và Unicode tách dấu.
- Đảo ngược đúng 75 chỉnh sửa cho kết quả trùng toàn bộ dữ liệu phát hành trước, kể cả ID, thứ tự lựa chọn, khóa, 54 chủ đề, lịch sử phân tầng và chú thích. Đối chiếu 12 ảnh khớp từng byte. Mã lưu và khôi phục tiến độ vẫn dùng lược đồ hiện hành.
- Chromium và WebKit chạy tìm kiếm, highlight, Focus Touch, xem đáp án và thẻ ghi nhớ cho cụm 257–259. iPhone 13 và iPad được mô phỏng. Safari trên thiết bị thật chờ nghiệm thu bản ứng viên.

[Module 8/8](test/evidence/encoding/encoding-modules.log) · [Chromium 8/8](test/evidence/encoding/encoding-chromium.log) · [WebKit 8/8](test/evidence/encoding/encoding-webkit.log) · [Ảnh iPhone mô phỏng](test/evidence/encoding/iphone-id257.webp) · [Ảnh iPad mô phỏng](test/evidence/encoding/ipad-id257.webp)
