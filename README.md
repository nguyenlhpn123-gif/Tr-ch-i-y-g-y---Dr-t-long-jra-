# Trò chơi Đẩy Gậy Toán Học

Trò chơi dân gian Việt Nam kết hợp học tập toán học dành cho học sinh.

## Hướng dẫn triển khai lên Vercel

Dự án này được xây dựng bằng React và Vite, rất dễ dàng để triển khai lên Vercel.

### Các bước thực hiện:

1. **Đẩy mã nguồn lên GitHub/GitLab/Bitbucket:**
   - Tạo một kho lưu trữ mới trên GitHub.
   - Đẩy toàn bộ mã nguồn của dự án này lên kho lưu trữ đó.

2. **Kết nối với Vercel:**
   - Truy cập [Vercel Dashboard](https://vercel.com/dashboard).
   - Nhấn vào **"Add New..."** -> **"Project"**.
   - Chọn kho lưu trữ GitHub mà bạn vừa đẩy mã nguồn lên.

3. **Cấu hình dự án trên Vercel:**
   - Vercel sẽ tự động nhận diện đây là một dự án **Vite**.
   - **Framework Preset:** Chọn `Vite`.
   - **Build Command:** `npm run build`.
   - **Output Directory:** `dist`.
   - Nhấn **"Deploy"**.

### Lưu ý về SPA Routing:
Dự án đã bao gồm file `vercel.json` để cấu hình SPA routing, giúp tránh lỗi 404 khi người dùng tải lại trang ở các đường dẫn khác nhau (nếu có thêm routing sau này).

### Biến môi trường (Environment Variables):
Nếu bạn sử dụng các tính năng liên quan đến AI (Gemini), hãy thêm biến môi trường sau trong phần **Settings -> Environment Variables** trên Vercel:
- `GEMINI_API_KEY`: Mã khóa API của bạn từ Google AI Studio.

### Tài nguyên:
- Hình ảnh và âm thanh nằm trong thư mục `public/`.
- Mã nguồn chính nằm trong `src/App.tsx`.
