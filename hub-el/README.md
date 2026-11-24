# 🚀 Hub-EL (E-Learning Platform)

Đây là dự án web được xây dựng bằng **Next.js + TypeScript + Tailwind CSS + Prisma + Auth.js**.

---

# 🧱 Yêu cầu trước khi chạy

Máy bạn cần cài:

* Node.js (>= 18) để sử dụng npm

---

# ⚙️ Cài đặt project

## 1. Clone project

```bash
git clone https://github.com/your-username/hub-el.git
cd hub-el
```

---

## 2. Cài thư viện

```bash
npm install
```

---

## 3. Cấu hình biến môi trường (QUAN TRỌNG)

### Tạo file `.env` và `.env.local`

---

### Điền thông tin vào `.env`

```env

DATABASE_URL="sqlserver://localhost:1433;database=Name_DB;user=Name_USER;password=Password_Here;encrypt=true;trustServerCertificate=true;"

# Google Gemini API Key
GEMINI_API_KEYS=Key_API

# MÃ BẢO MẬT TEST TỪ TÀI LIỆU CỦA MOMO DEVELOPER
MOMO_PARTNER_CODE="MOMOIQA420180417"
MOMO_ACCESS_KEY="SvDmj2cOTYZmQQ3H"
MOMO_SECRET_KEY="PPuDXq1KowPT1ftR8DvlQTHhC03aul17"

# KẾT NỐI API
MOMO_ENDPOINT="https://test-payment.momo.vn/v2/gateway/api/create"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

```
### Điền thông tin vào `.env.local`
```env.local
# Google: https://console.cloud.google.com/
AUTH_GOOGLE_ID="xxx"
AUTH_GOOGLE_SECRET="xxx"

# GitHub: https://github.com/settings/developers
AUTH_GITHUB_ID="xxx"
AUTH_GITHUB_SECRET="xxx"

//Đăng nhập bằng Facebook dễ bị lỗi
# # Facebook: https://developers.facebook.com/
# AUTH_FACEBOOK_ID="xxx"
# AUTH_FACEBOOK_SECRET="xxx"

# Secret (Bắt buộc): Chạy lệnh 'npx auth secret' để lấy mã này
AUTH_SECRET="xxx"
```

---

## 4. Khởi tạo Prisma (database)
Đảm bảo máy đã cài SQL Server, bật TCP/IP (cổng 1433) và kích hoạt tài khoản sa.

**Cách bật TCP/IP (cổng 1433) và kích hoạt tài khoản sa:**
1. Bật cổng 1433 (TCP/IP)  
Mở SQL Server Configuration Manager -> Chọn SQL Server Network Configuration.  
Chọn Protocols for (SERVER mà bạn dùng) -> Chuột phải TCP/IP chọn Enable.  
Chuột phải TCP/IP -> Properties -> Tab IP Addresses -> Kéo xuống IPAll -> Nhập TCP Port: 1433 nếu TCP Dynamic Ports có số thì xóa đi để trống.  

2. Bật chế độ mật khẩu (Mixed Mode)  
Mở SSMS -> Chuột phải vào tên Server (dòng đầu tiên) -> Properties.  
Chọn Security -> SQL Server and Windows Authentication mode.  

3. Kích hoạt tài khoản sa  
Mở SSMS -> Mở thư mục Security -> Logins -> Chuột phải vào sa -> Properties.  
General: Nhập mật khẩu mới.  
Status: Chọn Grant (Permission) và Enabled (Login).  

4. Restart (Bắt buộc)  
Chuột phải vào Server -> Restart.  

Tạo Database trống: `Name_DB`
```bash
npx prisma generate
npx prisma migrate dev
```

---

## 5. Chạy server

```bash
npm run dev
```

---

## 6. Mở trình duyệt

Truy cập:

```text
http://localhost:3000
```

---

# 💬 Chạy chat realtime (Socket.IO)

## Mở terminal mới:

```bash
node server.js
```

👉 Server socket chạy tại:

```text
http://localhost:3001
```
---

# 📚 Công nghệ sử dụng

* Node.js
* Next.js
* TypeScript
* React
* Tailwind CSS
* Axios
* Shadcn/ui
* React Query
* Prisma ORM + SQL Server
* Auth.js
* Socket.IO
  
---
