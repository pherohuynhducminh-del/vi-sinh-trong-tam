# Vi sinh độc lập

Ứng dụng tĩnh tại `/microbiology/`. Dữ liệu được đóng gói từ bản Clinical Quiz 2.6 bất biến đã kiểm toán. Trang chạy độc lập bằng ES modules, service worker và localStorage.

- `build.mjs` đọc các literal JSON từ bản chuẩn, kiểm chứng dữ liệu và tạo gói phục vụ.
- `domain.mjs` lập chỉ mục theo ID, lọc, chấm và lập lịch ôn.
- `session.mjs` lưu danh sách ID có thứ tự, vị trí, chế độ và câu trả lời phiên.
- `state.mjs` điều phối sự kiện giữa phiên, lựa chọn ngân hàng và tiến độ.
- `persistence.mjs` kiểm tra lưu trữ phiên bản mới, chuyển tiến độ và nhập/xuất sao lưu.
- `app.mjs` hiển thị ứng dụng và tiếp nhận thao tác.

Ngân hàng, tiêu chí lọc và phiên đang mở là các trạng thái độc lập. Một phiên khóa phạm vi tại lúc tạo. Khi chỉ còn một câu chưa làm, lệnh học tiếp đặt câu đó đầu danh sách trong phạm vi đang chọn để giữ điều hướng. Lọc đích danh hoặc chọn chủ đề một câu tạo danh sách một phần tử hợp lệ. Tiến độ dùng ID gốc, còn vị trí phiên chỉ biểu diễn thứ tự duyệt.
