# Website cân điện tử + CMS

Website giới thiệu một trang, kèm hệ thống quản trị để sửa **toàn bộ** chữ và hình mà không cần
đụng vào code. Chạy bằng Node.js, dữ liệu lưu trong tệp JSON — không cần cơ sở dữ liệu.

| | |
| --- | --- |
| **Phần A** | [Dành cho người quản trị nội dung](#phần-a--dành-cho-người-quản-trị-nội-dung) — dùng CMS, không cần biết code |
| **Phần B** | [Dành cho người bảo trì code](#phần-b--dành-cho-người-bảo-trì-code) — cài đặt, triển khai, bảo mật |
| **Chi tiết kỹ thuật** | [docs/ghi-chu-ky-thuat.md](docs/ghi-chu-ky-thuat.md) — các cái bẫy đã sập, cấu trúc thư mục, hiệu ứng |

---

## Bắt đầu nhanh

```bash
npm install
npm start
```

| Địa chỉ | Nội dung |
| --- | --- |
| http://localhost:3000 | Trang chủ |
| http://localhost:3000/cms | Trang quản trị |

Tài khoản đăng nhập nằm trong `server/data/credentials.json` — xem [Tài khoản CMS](#tài-khoản-cms).

---
---

# Phần A — dành cho người quản trị nội dung

Đăng nhập `/cms` một lần là dùng được 30 ngày (tick *Ghi nhớ tôi*). Mọi thay đổi bấm **Lưu** là
hiện ra trang web ngay, không cần khởi động lại gì.

## Sửa được những gì

| Mục trong CMS | Chỉnh được gì |
| --- | --- |
| **Bảng điều khiển** | Thống kê nhanh, trạng thái bật/tắt từng khối |
| **Cấu hình chung** | Tên web, địa chỉ website, mô tả SEO, logo, favicon, màu thương hiệu, menu, nhận diện trang CMS, nhãn giao diện |
| **Đầu trang / Video** | Chuyển video ↔ slideshow, tải video lên, thêm/xoá/sắp xếp slide |
| **Trang chủ** | Dải con số, dịch vụ, điểm mạnh, hình ảnh thực tế, dải kêu gọi hành động |
| **Khu vực sản phẩm** | Tiêu đề khối, danh mục lọc |
| **Sản phẩm** | Thêm/sửa/xoá/sắp xếp, ảnh, ảnh phụ, bảng thông số, ẩn/hiện |
| **Giới thiệu** | Nội dung, ảnh, giá trị cốt lõi, dấu mốc, chứng nhận |
| **Liên hệ & bản đồ** | Địa chỉ, hotline, email, danh bạ theo bộ phận, chi nhánh, Google Maps, form báo giá |
| **Nút liên hệ nổi** | Bật/tắt, vị trí, bong bóng lời nhắn, thêm/sửa kênh liên hệ |
| **Chân trang & credit** | Tông sáng/tối, logo riêng, cột liên kết, bản quyền, mã số thuế, dòng credit |
| **Bộ sưu tập** | Tải ảnh lên (kéo thả), tìm theo tên, xem cỡ lớn, xoá khỏi ổ đĩa |
| **Yêu cầu liên hệ** | Xem tin khách gửi từ form, đánh dấu đã đọc, xoá |
| **Chế độ bảo trì** | Tạm đóng website với khách |
| **Tài khoản** | Đổi mật khẩu |

Không có chữ nào bị "chôn" trong code. Cả các nhãn nhỏ (nút *Chi tiết*, *Yêu cầu báo giá*, nhãn ô
nhập trong form, thông báo lỗi…) đều nằm trong *Cấu hình chung ▸ Nhãn giao diện*. Bỏ trống một
nhãn thì trang tự dùng lại chữ mặc định.

## Bốn thứ tiện mà dễ bỏ sót

**Gõ `{brand}` thay vì gõ tên công ty.** Trong bất kỳ ô chữ nào cũng dùng được ba ký tự đại diện:

| Gõ | Hiện ra |
| --- | --- |
| `{brand}` | Tên thương hiệu ngắn (*Cấu hình chung ▸ Tên thương hiệu ngắn*) |
| `{company}` | Tên hiển thị đầy đủ |
| `{year}` | Năm hiện tại — dòng bản quyền không bao giờ bị cũ |

Ví dụ ô "Dòng nhỏ" của khối Điểm mạnh ghi `Vì sao chọn {brand}`. Đổi tên thương hiệu một lần là
mọi chỗ đổi theo.

**Danh bạ liên hệ ghi rõ ai phụ trách số nào.** *Liên hệ & bản đồ ▸ Danh bạ liên hệ* — thêm bao
nhiêu dòng cũng được:

> **Bộ phận kinh doanh · Anh Tuấn** — 0939 292 845

Chọn loại là *Điện thoại* / *Email* / *Zalo* / *Liên kết* / *Chỉ hiện chữ*, hệ thống tự tạo đúng
kiểu bấm (gọi, gửi thư, mở Zalo…). Khai đủ ở đây rồi thì tắt công tắc *"Vẫn hiện các dòng Điện
thoại / Hotline / Email ở trên"* cho khỏi trùng.

**Trước khi xoá ảnh, xem nó đang dùng ở đâu.** Bấm vào ảnh trong *Bộ sưu tập* để thấy tên tệp,
dung lượng, và **danh sách nơi đang dùng** (ví dụ *"Đầu trang › Cân ô tô điện tử"*). Xoá là mất
hẳn khỏi ổ đĩa, không lấy lại được.

**Biểu tượng đổi được.** Mỗi phương thức liên hệ có hai ô: chọn trong bộ 15 icon dựng sẵn, hoặc
tải ảnh riêng lên (dùng khi cần đúng logo thương hiệu). Có ảnh thì ảnh thắng.

## Chế độ bảo trì

*Chế độ bảo trì* — một công tắc. Bật lên thì **mọi** khách vào website đều thấy trang bảo trì, kể
cả bạn. Tiêu đề, lời nhắn, hiện logo hay không, hiện cách liên hệ hay không đều sửa được; số điện
thoại lấy thẳng từ mục *Liên hệ & bản đồ*.

**Trang quản trị luôn vào được** kể cả khi đang bảo trì — nếu không thì bật xong không còn cửa nào
để tắt. Khi đang bật, CMS hiện dải cảnh báo đỏ ở mọi màn hình kèm nút *Tắt bảo trì*, vì rủi ro
thật không phải bật nhầm mà là **quên tắt**.

Máy chủ trả mã 503 chứ không phải 200, nên Google hiểu là "tạm nghỉ, quay lại sau" và giữ nguyên
thứ hạng tìm kiếm.

## Tài khoản CMS

Tài khoản nằm trong `server/data/credentials.json`, tách khỏi dữ liệu nội dung. Lần khởi động đầu
tiên server tự băm mật khẩu và ghi đè tệp — chuỗi gốc biến mất khỏi ổ đĩa.

**Quên mật khẩu?** Mở tệp đó, xoá dòng `passwordHash`, thêm `"password": "mật khẩu mới"`, khởi
động lại server.

---
---

# Phần B — dành cho người bảo trì code

## Lệnh thường dùng

```bash
npm start       # chạy
npm run dev     # tự khởi động lại khi sửa code server
npm test        # 12 bộ, 438 phép kiểm tra
npm run seed    # khôi phục nội dung về dữ liệu mẫu (không đụng tài khoản)
```

Mọi bộ test đều chạy trên thư mục dữ liệu **tạm** (`DATA_DIR`) nên không bao giờ đụng tới nội dung
thật trong `server/data/`.

| Bộ | Lệnh riêng | Canh gì |
| --- | --- | --- |
| Giao diện (79) | `npm run test:ui` | Lớp phủ vô hình chặn chuột, `hidden` có thực sự ẩn, khoảng cách header |
| Form CMS (15) | `npm run test:form` | Gõ/chọn ảnh có ghi đúng vào bản nháp đang hiển thị |
| Slideshow (27) | `npm run test:hero` | Luôn chạy — rê chuột, bấm nút, cuộn trang đều không làm kẹt |
| Ký tự đại diện (22) | `npm run test:tokens` | `{brand}` / `{company}` / `{year}` |
| Danh bạ (32) | `npm run test:directory` | `tel:` / `mailto:` / Zalo dựng đúng, thoát HTML |
| Điều hướng (33) | `npm run test:links` | Neo trong trang không lộ đường dẫn, link ngoài vẫn giữ |
| Nghiệp vụ (19) | `npm run test:services` | Đọc/ghi nội dung, CRUD sản phẩm, chống prototype pollution |
| Phiên (9) | `npm run test:session` | Gia hạn, hết hạn, thu hồi khi đổi mật khẩu |
| Bộ sưu tập (20) | `npm run test:media` | Dò ảnh đang dùng, xoá khỏi ổ đĩa, quét khôi phục |
| Bảo mật (28) | `npm run test:security` | Băm mật khẩu, giả mạo token, CSRF, rate limit, CSP |
| Triển khai (50) | `npm run test:deploy` | Nginx / PM2 / `.env` / `.gitignore` có khớp nhau không |
| End-to-end (104) | — | Khởi động server thật, kiểm tra toàn luồng |

## Triển khai lên VPS

**Hosting chia sẻ của BKHOST không chạy được project này** — gói đó là môi trường PHP/LiteSpeed,
không có Node.js. Cần **Cloud VPS** (Ubuntu 22.04, có sẵn quyền root). Gói thấp nhất là đủ.

**1. Trỏ tên miền** — tạo hai bản ghi A về IP của VPS:

```
A    @      <IP VPS>
A    www    <IP VPS>
```

**2. Cài Node.js + Nginx**

```bash
ssh root@<IP VPS>
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs nginx git
```

**3. Tạo user riêng** — không chạy web bằng root:

```bash
adduser --disabled-password --gecos "" candien
mkdir -p /var/www/candien && chown candien:candien /var/www/candien
su - candien
```

**4. Lấy code, cấu hình, chạy**

```bash
git clone <repo-của-bạn> /var/www/candien
cd /var/www/candien
npm ci --omit=dev

cp deploy/.env.production.example .env
chmod 600 .env
nano .env               # sửa 4 chỗ có dấu ◀

npm test
npm install -g pm2
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup
```

Bốn chỗ cần sửa trong `.env`: `SITE_URL`, `CMS_PATH` (đổi thành chuỗi khó đoán), `TRUST_PROXY=1`,
và `ADMIN_PASSWORD` (chỉ dùng lần đầu, xong thì xoá dòng đó).

Đọc kỹ phần **⚠ Cần lưu ý** app in ra lúc khởi động — nó tự soi cấu hình và chỉ ra chỗ còn sai.

**5. Nginx + HTTPS**

```bash
exit                    # về lại root
cp /var/www/candien/deploy/nginx.conf /etc/nginx/sites-available/candien
nano /etc/nginx/sites-available/candien      # thay TENMIEN.COM (4 chỗ)
ln -s /etc/nginx/sites-available/candien /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d tenmien.com -d www.tenmien.com
```

**6. Tường lửa + sao lưu tự động**

```bash
ufw allow OpenSSH && ufw allow "Nginx Full" && ufw enable

su - candien
chmod +x deploy/*.sh
crontab -e
# 0 2 * * * /var/www/candien/deploy/backup.sh >> /var/log/candien-backup.log 2>&1
```

Cổng 3000 **không** mở ra ngoài — chỉ Nginx trên cùng máy gọi vào.

### Nội dung lần deploy đầu tiên

`db.json` và `public/uploads/` cố ý không nằm trong git (đó là nội dung của khách, không phải
code), nên VPS mới khởi động với **nội dung mẫu**. Mang nội dung hiện có lên:

```bash
# chạy trên MÁY CỦA BẠN
scp server/data/db.json candien@<IP>:/var/www/candien/server/data/
scp -r public/uploads/* candien@<IP>:/var/www/candien/public/uploads/
# rồi trên VPS: pm2 restart candien
```

### Cập nhật code sau này

```bash
cd /var/www/candien && ./deploy/deploy.sh
```

Script tự: sao lưu → `git pull` → cài thư viện → chạy test → khởi động lại → gọi `/healthz` kiểm
tra. Test không đạt thì **dừng và giữ nguyên bản đang chạy**.

### Bốn cái bẫy khi lên production

| Bẫy | Hậu quả |
| --- | --- |
| `NODE_ENV=production` khi chưa có HTTPS | **Không đăng nhập được CMS** — cookie phiên mang cờ `Secure`, trình duyệt không gửi qua HTTP |
| Quên `TRUST_PROXY=1` sau Nginx | Mọi khách mang IP `127.0.0.1`, một người gõ sai mật khẩu là khoá cả nhà |
| `client_max_body_size` của Nginx nhỏ hơn `UPLOAD_MAX_MB` | Nginx chặn trước, khách chỉ thấy lỗi 413 khô khan |
| Đổi PM2 sang cluster | Nhiều tiến trình cùng ghi `db.json` sẽ đè mất nội dung của nhau |

Cả bốn đều có phép kiểm tra canh trong `npm run test:deploy`, và app tự cảnh báo lúc khởi động.

## Bảo mật

| Lớp | Cách làm |
| --- | --- |
| **Không có bí mật trong code** | Mật khẩu, khoá ký phiên, `db.json`, ảnh tải lên đều nằm ngoài git. Có test quét mã nguồn tìm chuỗi bí mật |
| **Mật khẩu** | bcrypt 12 vòng. Mật khẩu bản rõ bị xoá khỏi ổ đĩa ngay lần khởi động đầu |
| **Phiên đăng nhập** | JWT trong cookie `httpOnly` + `SameSite=Strict` + tiền tố `__Host-`. JavaScript không đọc được |
| **Thu hồi phiên** | Đổi mật khẩu là mọi phiên cũ mất hiệu lực ngay |
| **CSRF** | Kiểm tra `Origin`/`Referer` cho mọi request ghi dữ liệu |
| **Chống dò mật khẩu** | Sai 6 lần trong 15 phút là khoá 15 phút |
| **XSS** | Mọi chuỗi do người dùng nhập đều đi qua bộ thoát HTML. CSP chặn script nội tuyến |
| **Tệp tải lên** | Chỉ nhận đúng cặp MIME + đuôi tệp. Phục vụ kèm CSP sandbox để SVG độc hại không chạy được |
| **Prototype pollution** | `sanitize()` loại `__proto__` / `constructor` khỏi mọi dữ liệu vào |

**Việc bạn cần làm khi lên production:** đổi mật khẩu CMS, đổi `CMS_PATH`, bật HTTPS, đặt
`TRUST_PROXY=1`, và bật sao lưu tự động.

## API

| Method | Endpoint | Quyền |
| --- | --- | --- |
| GET | `/api/site` | công khai — toàn bộ dữ liệu render trang chủ |
| POST | `/api/messages` | công khai, giới hạn 5 lần / 10 phút |
| POST | `/api/auth/login` | công khai, giới hạn 6 lần sai |
| GET | `/api/cms/site` | đăng nhập — dữ liệu đầy đủ cho CMS |
| GET/PUT/PATCH | `/api/content/:section` | đăng nhập |
| GET/POST/PUT/DELETE | `/api/products`, `/api/media`, `/api/messages` | đăng nhập (trừ GET products) |

`:section` nhận: `settings`, `hero`, `home`, `about`, `productsSection`, `contact`,
`floatingContact`.

Ngoài ra: `/healthz` (monitoring), `/robots.txt`, `/sitemap.xml` — cả ba đều sinh động theo ô
*Địa chỉ website* trong CMS.

## Cấu trúc

```
server/     Backend Express — routes mỏng, services dày, dữ liệu trong JSON
public/     Trang công khai — CSS theo tầng base → layout → components → motion
cms/        Giao diện quản trị, NẰM NGOÀI public/ nên chỉ vào được qua đúng CMS_PATH
deploy/     Nginx, PM2, script deploy và sao lưu
test/       12 bộ, đều chạy trên thư mục dữ liệu tạm
docs/       Ghi chú kỹ thuật
```

Nguyên tắc: **một chiều dữ liệu** (`db.json` → service → route → `/api/site` → `store.js` →
component, component không tự gọi `fetch`), và **route mỏng, service dày** — muốn đổi sang SQLite
chỉ cần sửa `lib/db.js` và tầng service.

Chi tiết cây thư mục đầy đủ, các cái bẫy đã sập, và cách hệ thống hiệu ứng hoạt động:
[docs/ghi-chu-ky-thuat.md](docs/ghi-chu-ky-thuat.md).
