/**
 * not-found-page.js - trang 404.
 *
 * Tu chua hoan toan (CSS trong the <style>), khong nap tep nao cua website:
 * duong dan hong rat co the la vi mot tep tinh bi thieu, trang 404 ma cung phu
 * thuoc tep tinh thi hong theo.
 *
 * CO Y khong nhac gi toi duong dan trang quan tri. Trang 404 la thu may quet
 * nhin thay nhieu nhat; lo mot goi y o day la mat cong doi CMS_PATH.
 */

export function notFoundPage() {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex, nofollow" />
<title>Không tìm thấy trang</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #f8fafc;
    color: #0f172a;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    line-height: 1.6;
    text-align: center;
    -webkit-font-smoothing: antialiased;
  }
  .code { font-size: clamp(3rem, 12vw, 5rem); font-weight: 700; letter-spacing: -0.04em; color: #cbd5e1; line-height: 1; }
  h1 { margin: 10px 0 8px; font-size: clamp(1.15rem, 4vw, 1.5rem); letter-spacing: -0.02em; }
  p { margin: 0 auto 26px; max-width: 40ch; color: #475569; }
  a {
    display: inline-block;
    padding: 12px 26px;
    border-radius: 999px;
    background: #0f172a;
    color: #fff;
    text-decoration: none;
    font-weight: 600;
    transition: opacity 160ms ease;
  }
  a:hover { opacity: 0.85; }
</style>
</head>
<body>
  <main>
    <div class="code">404</div>
    <h1>Không tìm thấy trang này</h1>
    <p>Đường dẫn bạn vừa mở không tồn tại, hoặc đã được đổi sang chỗ khác.</p>
    <a href="/">Về trang chủ</a>
  </main>
</body>
</html>
`;
}

export default notFoundPage;
