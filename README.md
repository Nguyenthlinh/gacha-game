# 🌊 Ocean Educational Gacha Game

Một ứng dụng vòng quay may mắn (Gacha) dành cho giáo dục với chủ đề đại dương, được thiết kế để tăng tính tương tác và hứng thú cho học sinh trong lớp học.

## 🚀 Tính năng nổi bật

### 🎮 Trò chơi hấp dẫn
- **Máy quay Gacha (Slot Machine):** Hiệu ứng quay số mượt mà, âm thanh 8-bit sống động và pháo hoa giấy (confetti) khi trúng thưởng.
- **Lật thẻ may mắn (Card Flip):** Trò chơi chọn thẻ bài với nhạc nền du dương và hiệu ứng âm thanh lật bài chân thực.
- **Hệ thống Rarity:** Phân loại quà tặng theo 5 cấp độ từ "Cơ bản" đến "VIP Pro Max" với tỉ lệ rớt tùy chỉnh.

### 🛠️ Quản lý thông minh (Admin Panel)
- **Quản lý danh sách quà:** Giao diện dạng Tab hiện đại, dễ dàng thêm/sửa/xóa và thay đổi số lượng quà.
- **Bulk Add:** Thêm hàng loạt quà tặng chỉ bằng một đoạn văn bản theo cú pháp đơn giản.
- **Lịch sử nhận quà:** Theo dõi thời gian và món quà học sinh đã nhận được.
- **Tùy chỉnh tỉ lệ:** Kiểm soát chặt chẽ xác suất trúng thưởng của từng món quà hoặc cả nhóm quà.

### ⚡ Tối ưu hóa kỹ thuật
- **Âm thanh Web Audio API:** Tự động tạo âm thanh bằng code, không cần file MP3, giúp web load nhanh và nhẹ.
- **Data Persistence:** Sử dụng PostgreSQL (Neon.tech) để lưu trữ dữ liệu bền vững.
- **Auto-clean DB:** Tự động giới hạn lịch sử 500 bản ghi để tối ưu dung lượng lưu trữ miễn phí.
- **Responsive Design:** Chạy mượt mà trên mọi thiết bị từ điện thoại, máy tính bảng đến máy tính để bàn.

## 🛠️ Công nghệ sử dụng
- **Backend:** ASP.NET Core 8.0 (C#)
- **Frontend:** HTML5, Vanilla CSS3, Javascript
- **Database:** PostgreSQL (Entity Framework Core)
- **UI/UX:** Bootstrap 5, Canvas Confetti, Web Audio API
- **Cloud:** Render.com (Deployment), Neon.tech (Database)

## 📦 Hướng dẫn cài đặt

### Chạy Local
1. Clone repository: `git clone https://github.com/Nguyenthlinh/gacha-game.git`
2. Cấu hình chuỗi kết nối Database trong `appsettings.json`.
3. Chạy lệnh: `dotnet run`

### Deployment (Render + Neon)
1. Tạo một project **Web Service** trên Render.
2. Kết nối với GitHub repository này.
3. Thêm Environment Variable: `DATABASE_URL` (Lấy từ Neon.tech).
4. Render sẽ tự động build qua `Dockerfile` có sẵn trong project.

## ⚙️ Hướng dẫn Admin
Để truy cập bảng quản lý:
- Tại trang chủ, click vào icon **Bánh răng (⚙️)** ở góc trên bên phải màn hình.
- Tại đây bạn có thể nhập danh sách quà theo cú pháp: `Tên Quà : Nhóm : Số Lượng : Tỉ Lệ`.

---
*Phát triển bởi Antigravity AI Assistant.*
