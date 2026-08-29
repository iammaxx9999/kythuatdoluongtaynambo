# Ghi chú kỹ thuật

Phần giải thích dài, tách khỏi [README](../README.md) cho gọn. Đọc khi cần sửa code,
không cần đọc để dùng CMS hay để triển khai.

**Mục lục**

- [Những cái bẫy đã sập](#nhung-cai-bay-da-sap)
- [Nội dung cập nhật ra trang web như thế nào](#noi-dung-cap-nhat-ra-trang-web-nhu-the-nao)
- [Hiệu ứng chuyển động](#hieu-ung-chuyen-dong)
- [Cấu trúc thư mục đầy đủ](#cau-truc-thu-muc-day-du)
- [Hướng phát triển tiếp](#huong-phat-trien-tiep)

---

## Những cái bẫy đã sập

Năm lỗi dưới đây đều đã xảy ra thật trên chính project này, và mỗi cái đều mất khá lâu để tìm ra.
Mỗi mục đều có phép kiểm tra tự động canh lại, ghi rõ ở cuối mục.

### `position: fixed` bị tổ tiên có `transform` bắt mất

Thanh "Lưu thay đổi" từng nằm bên trong khung nội dung. Khung đó có hoạt ảnh chuyển màn hình
dùng `transform` — mà **bất kỳ tổ tiên nào có `transform` cũng trở thành khung tham chiếu mới
cho `position: fixed`**. Thanh lưu hết dính vào màn hình, phải cuộn xuống cuối trang mới thấy,
và chuyển màn hình là mất luôn. Nay nó là con trực tiếp của `<body>` (xem `cms/js/core/savebar.js`)
nên luôn nổi ở cạnh dưới màn hình.

### Giữ tham chiếu tới một object sẽ bị thay

`bindForm` nhận model lúc khởi tạo và ghi thẳng vào đó. Nhưng màn hình chỉnh sửa lại **thay**
object model sau mỗi lần Lưu / Hoàn tác (`model = clone(saved)`). Từ lần lưu thứ hai trở đi,
mọi thay đổi rơi vào object cũ đã bị bỏ, còn object đang hiển thị thì không đổi gì — bấm Lưu
như không bấm. Nay `bindForm` nhận **hàm** `getModel()` và ném lỗi ngay nếu ai đó truyền thẳng
object, để lỗi này không quay lại lần nữa. `test/form-binding.mjs` bắt được đúng 7 triệu chứng
của nó.

### Tự động tạm dừng là cái bẫy — hai lần sập cùng một chỗ

Slideshow đầu trang từng hai lần đứng hẳn sau khi rê chuột vào, mỗi lần một nguyên nhân khác:

**Lần 1 — tin vào cặp `mouseenter` / `mouseleave`.** Vào thì dừng, ra thì chạy tiếp; nghe rất hợp
lý. Nhưng trình duyệt chỉ bắn `mouseleave` khi con trỏ **DI CHUYỂN** ra khỏi phần tử. Rê chuột vào
ảnh (dừng lại) rồi **cuộn trang xuống đọc tiếp mà không nhích chuột** — ảnh trôi khỏi con trỏ
nhưng con trỏ không hề di chuyển, nên `mouseleave` không bao giờ bắn.

**Lần 2 — bản sửa thay bằng "tự tính lại vị trí con trỏ", nhưng vẫn giữ tạm dừng theo tiêu điểm
bàn phím.** Bấm một đầu chấm để đổi ảnh thì nút đó **giữ tiêu điểm sau cú bấm** (hành vi bình
thường của `<button>` trong Chrome). Đưa chuột ra thì lý do "hover" được gỡ, nhưng lý do "focus"
thì không bao giờ — đứng vĩnh viễn, đúng triệu chứng cũ.

**Bài học: mỗi cơ chế tạm dừng tự động là một cách mới để kẹt.** Nó chỉ an toàn khi sự kiện bật và
sự kiện tắt *luôn* đi thành cặp — mà `mouseleave` và `focusout` thì không đảm bảo điều đó.

Nay chỉ còn **hai** lý do được phép dừng, cả hai đều có sự kiện tắt chắc chắn:

| Lý do | Gỡ ra bằng gì |
| --- | --- |
| Người dùng bấm nút Tạm dừng | Bấm lần nữa |
| Tab bị ẩn | `visibilitychange` khi quay lại tab |

Rê chuột, bấm chuột, tiêu điểm bàn phím — không cái nào dừng được nữa. Người xem muốn dừng để đọc
thì bấm nút Tạm dừng (nút này cũng là thứ đáp ứng WCAG 2.2.2, nên bỏ tạm dừng tự động không làm
mất khả năng tiếp cận). `test/ui-guard.mjs` mục 8 cấm hẳn `mouseenter` / `mouseleave` / `mouseover`
/ `focusin` / `focusout` trong `hero.js` để không ai vô tình mở lại cửa này.

### Listener gắn ngoài component sống sót qua mọi lần vẽ lại

Cùng ổ lỗi trên: `render()` chỉ thay `innerHTML`, còn phần tử gốc của khối là **cùng một phần
tử** qua mọi lần vẽ. Listener gắn trên `document` / `window` / phần tử gốc vì thế không bị xoá.
Mỗi lần trang tự cập nhật nội dung lại chồng thêm một bộ, và những bản cũ vẫn chạy hẹn giờ rồi vẽ
vào DOM đã bị bỏ — trang trông như đứng dù hẹn giờ đang chạy ầm ầm.

Hai cách hợp lệ, project dùng cả hai:

- Cờ "chỉ gắn một lần", tên kết thúc bằng `...Bound` (`header.js`, `products.js`, `floating-contact.js`).
- Trả về **hàm dọn dẹp** và gọi nó trước khi gắn bộ mới (`hero.js`).

`test/ui-guard.mjs` mục 8 canh việc này cho mọi component có gắn listener toàn cục.

### Thuộc tính `hidden` bị class ghi đè

Từng có lúc cả trang không bấm được gì: không bấm được nội dung, không bấm được cả nút liên hệ nổi.

Thủ phạm là `<div id="product-modal" class="modal" hidden>`. Trình duyệt chỉ đặt
`[hidden] { display: none }` trong **bảng mặc định** của nó, nên bất kỳ quy tắc `display` nào
của mình cũng thắng — ở đây là `.modal { display: grid }`. Kết quả: khối "đang ẩn" vẫn là một
lớp `position: fixed; inset: 0; z-index: 120` phủ kín màn hình. Nó trong suốt nên không ai thấy,
nhưng nó nuốt sạch cú nhấp chuột. Cùng lý do đó, bộ lọc sản phẩm cũng không ẩn được thẻ nào vì
`.product-card { display: flex }` đè lên `hidden`.

Cách chữa gọn cho cả nhóm lỗi này — một dòng trong `base.css`:

```css
[hidden] { display: none !important; }
```

Lỗi thứ hai nằm ở chính nút liên hệ nổi: `.fab` là flex column chứa danh sách kênh. Khi đóng,
các kênh chỉ `opacity: 0` chứ vẫn chiếm chỗ, nên `.fab` cao khoảng 300px — vừa tạo một vùng vô
hình chặn chuột ở góc màn hình, vừa đẩy bong bóng lời nhắn lên cao, tách rời khỏi nút. Nay danh
sách kênh và bong bóng đều được **neo tuyệt đối** phía trên nút, `.fab` chỉ còn đúng 58×58px, và
danh sách có `pointer-events: none` khi đóng.

Cả hai đều đã có kiểm thử tự động canh chừng trong `test/ui-guard.mjs`, chạy bằng `npm run test:ui`.

---

---

## Nội dung cập nhật ra trang web như thế nào

Đây là chỗ dễ hiểu nhầm nhất nên tách riêng ra đây.

Trang chủ là một trang đơn: lúc mở, nó gọi `/api/site` **một lần** rồi giữ dữ liệu trong bộ nhớ.
Nếu bạn mở CMS ở một tab và trang web ở tab khác, bấm Lưu xong quay lại tab kia mà không tải lại
thì tab đó vẫn đang vẽ bằng dữ liệu cũ — không phải do lưu hỏng.

Đã xử lý bằng hai lớp:

1. **Tự làm mới khi quay lại tab.** Trang lắng nghe `visibilitychange`, `focus` và `pageshow`.
   Mỗi lần bạn quay lại tab, nó lặng lẽ hỏi lại `/api/site`, so sánh với dữ liệu đang hiển thị,
   và **chỉ vẽ lại khi nội dung thực sự khác** (kèm một cái nháy nhẹ để bạn biết). Có chống gọi
   dồn 2 giây. Không phải bấm F5 nữa.

2. **Cấm trình duyệt cache API.** Trước đây phản hồi `/api/*` không có `Cache-Control`, không có
   `ETag` (đã tắt), không có `Last-Modified` — tức là không có thông tin gì về thời hạn, và
   trình duyệt được phép tự đoán rồi dùng lại bản cũ. Giờ mọi phản hồi `/api/*` đều mang
   `Cache-Control: no-store, no-cache, must-revalidate` + `Pragma` + `Expires: 0`, và phía
   client `fetch` cũng đặt `cache: 'no-store'`. Tệp tĩnh thì **không** bị no-store để vẫn nhanh.

Ngoài ra, các listener gắn vào `document`/`window` (cuộn, phím Esc, đóng menu, thanh tiến độ)
giờ chỉ gắn đúng một lần, nên trang vẽ lại nhiều lần cũng không bị nhân bản sự kiện.

---

---

## Hiệu ứng chuyển động

Toàn bộ hoạt ảnh gom trong `public/assets/css/motion.css` và `public/assets/js/core/motion.js`, để tách khỏi phần bố cục — sửa hiệu ứng không đụng vào cấu trúc.

Nguyên tắc: **chỉ hoạt hình `transform` và `opacity`**. Đây là hai thuộc tính trình duyệt xử lý thẳng trên GPU, không bắt tính lại bố cục, nên giữ được 60fps kể cả trên máy yếu. Bóng đổ khi rê chuột được đặt ở lớp `::after` riêng và chỉ đổi `opacity`, thay vì hoạt hình `box-shadow`.

| Chỗ nào | Hiệu ứng |
| --- | --- |
| Cuộn tới mục | Hàm cuộn tự viết, easing `easeInOutCubic` ~720ms — mọi trình duyệt cuộn giống nhau. Người dùng lăn chuột giữa chừng thì hủy ngay, không giành quyền điều khiển |
| Đầu trang | Ảnh nền phóng chậm 12s (Ken Burns); đổi slide thì chữ cũ mờ ra rồi từng dòng chữ mới trôi lên lệch nhịp |
| Cuộn xuống | Khối nội dung trôi lên hiện dần, các khối cạnh nhau lệch nhau 70ms cho có nhịp |
| Dải con số | Đếm từ 0 lên số thật với easing `easeOutExpo`, chữ số dùng `tabular-nums` nên không nhảy ngang |
| Lọc sản phẩm | Kỹ thuật FLIP: thẻ bị loại mờ đi, thẻ còn lại **trượt** sang vị trí mới thay vì nhảy, thẻ mới hiện lên so le |
| Thẻ sản phẩm | Nâng lên + ảnh phóng nhẹ 720ms; máy có chuột thật thì thẻ nghiêng nhẹ theo con trỏ |
| Nút | Vệt sáng lướt qua khi rê chuột, lún xuống khi bấm |
| Cửa sổ chi tiết | Mở có độ nảy nhẹ (`ease-spring`), đóng cũng có hoạt ảnh rồi mới gỡ khỏi DOM |
| Form | Ô nhập sai thì rung nhẹ, thông báo lỗi trượt xuống |
| Nút liên hệ nổi | Vòng sóng lan, các kênh bung ra so le 40ms, bong bóng lời nhắn nảy nhẹ |
| Header | Thanh tiến độ cuộn trang chạy dưới đáy header, gạch chân menu chạy từ giữa ra |
| Ảnh | Mờ dần khi tải xong thay vì hiện đột ngột |
| CMS | Đổi màn hình có hiệu ứng trôi lên, các thẻ xuất hiện so le, thanh lưu nảy lên |

Mọi sự kiện cuộn/di chuột đều gom vào một khung hình bằng `requestAnimationFrame`, và `will-change` được gỡ ngay sau khi hoạt hình chạy xong để không giữ bộ nhớ GPU.

**Tôn trọng người dùng:** nếu hệ điều hành bật "giảm chuyển động" (Windows: Settings ▸ Accessibility ▸ Visual effects), toàn bộ hoạt ảnh tắt và trang chuyển sang hiển thị tức thì — kể cả hàm cuộn tự viết.

---

---

## Cấu trúc thư mục đầy đủ

```
├── server/                     # Backend Express (ES modules)
│   ├── index.js                # Điểm khởi động
│   ├── app.js                  # Cấu hình express, static, fallback
│   ├── config.js               # Đọc biến môi trường
│   ├── lib/
│   │   ├── db.js               # Kho JSON (atomic write, hàng đợi ghi)
│   │   ├── credentials.js      # Đọc/băm tài khoản CMS
│   │   ├── secret.js           # Khóa ký JWT (tự sinh)
│   │   ├── helpers.js          # slugify, sanitize, deepMerge, normalizeSiteUrl
│   │   ├── sitemap.js          # sitemap.xml + xác định địa chỉ gốc thật
│   │   └── errors.js
│   ├── middleware/
│   │   ├── auth.js             # JWT + cookie phiên
│   │   ├── security.js         # CSP, chống CSRF, rate limit
│   │   ├── upload.js           # multer + kiểm tra MIME/đuôi tệp
│   │   └── error.js
│   ├── routes/                 # Định tuyến HTTP, mỏng - không chứa logic
│   ├── services/               # Toàn bộ nghiệp vụ
│   └── data/                   # đổi chỗ được qua biến DATA_DIR
│       ├── defaults.js         # Nội dung mẫu + toàn bộ nhãn giao diện
│       ├── seed.js
│       ├── db.json             # (tự sinh) nội dung thật
│       ├── credentials.json    # (bí mật) tài khoản CMS
│       └── .jwt-secret         # (bí mật) khóa ký phiên
│
├── public/                     # Trang công khai
│   ├── index.html
│   ├── assets/
│   │   ├── css/                # base (token) → layout → components → motion
│   │   ├── img/                # Ảnh mẫu dạng SVG
│   │   └── js/
│   │       ├── core/           # api, store, dom, icons, motion, tokens
│   │       ├── components/     # header, hero, products, about, contact…
│   │       └── main.js
│   └── uploads/                # (tự sinh) ảnh/video tải lên từ CMS
│
├── deploy/                     # Cấu hình đưa lên host (xem README ▸ Triển khai)
│   ├── nginx.conf              # Reverse proxy + gzip + gom tên miền
│   ├── ecosystem.config.cjs    # PM2: giữ app chạy, 1 tiến trình
│   ├── deploy.sh               # Sao lưu → pull → test → restart → kiểm tra
│   ├── backup.sh               # Nén db.json + uploads, dọn bản cũ
│   └── .env.production.example # Mẫu .env cho chạy thật
│
├── test/                       # Đều chạy trên thư mục dữ liệu tạm
│   ├── browser-module.mjs      # Cầu nối nạp mã trình duyệt vào Node
│   ├── ui-guard.mjs            # Soi CSS: lớp phủ chặn chuột, hidden, bố cục nút nổi
│   ├── form-binding.mjs        # Form CMS ghi đúng vào bản nháp đang hiển thị
│   ├── tokens.mjs              # Ký tự đại diện {brand} / {company} / {year}
│   ├── services.mjs            # Nghiệp vụ: nội dung, sản phẩm, tin nhắn
│   ├── session.mjs             # Phiên đăng nhập: gia hạn, hết hạn, thu hồi
│   ├── media.mjs               # Bộ sưu tập: dò ảnh đang dùng, xóa, quét khôi phục
│   ├── security.mjs            # Băm mật khẩu, token, CSRF, rate limit, CSP
│   ├── deploy.mjs              # Nginx/PM2/.env/gitignore có khớp nhau không
│   └── e2e.mjs                 # Khởi động server thật và kiểm tra toàn luồng
│
└── cms/                        # Giao diện quản trị — NẰM NGOÀI public/
    ├── index.html              # nên chỉ truy cập được qua đúng CMS_PATH
    ├── css/admin.css
    └── js/
        ├── core/               # form theo schema, media picker, modal
        ├── views/              # từng màn hình CMS
        └── app.js              # sidebar + định tuyến hash
```

### Nguyên tắc thiết kế code

- **Một chiều dữ liệu**: `db.json` → service → route → `/api/site` → `store.js` → component. Component không tự gọi `fetch`.
- **Route mỏng, service dày**: muốn đổi cách lưu (SQLite, Postgres) chỉ cần sửa `lib/db.js` và service.
- **CMS theo schema**: mỗi màn hình chỉ khai báo mảng field trong `cms/js/views/schemas.js`. Thêm một ô nhập mới = thêm một dòng.
- **Template an toàn**: hàm `html` tự escape mọi giá trị nội suy; dùng `raw()` khi cố ý chèn HTML.
- **CSS theo token**: màu, khoảng cách, bo góc khai báo trong `:root`; CMS đổi màu thương hiệu bằng cách ghi đè biến CSS lúc chạy.
- **Nhãn có giá trị dự phòng**: `t('productDetail', 'Chi tiết')` — xóa nhãn trong CMS không làm vỡ giao diện.
- **Hoạt ảnh tách riêng**: bố cục ở `components.css`, chuyển động ở `motion.css`. Muốn tắt hết hiệu ứng chỉ cần bỏ một thẻ `<link>`.

---

---

## Hướng phát triển tiếp

- Đổi `lib/db.js` sang SQLite khi dữ liệu lớn — service không phải sửa.
- Thêm trang tin tức: tạo `server/services/post.service.js` + route, thêm view trong `cms/js/views/` và component ở `public/assets/js/components/`.
- Thêm ngôn ngữ: bọc các trường text thành `{ vi, en }` và bổ sung một field type mới trong `cms/js/core/form.js`.
- Gửi email thông báo khi có yêu cầu mới: thêm vào `message.service.js#createMessage`.
- Nhiều tài khoản quản trị: đổi `credentials.json` thành mảng và thêm kiểm tra vai trò trong `middleware/auth.js`.
