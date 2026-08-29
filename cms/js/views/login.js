/**
 * login.js - màn hình đăng nhập CMS.
 *
 * Mục tiêu: lần sau vào CMS không phải gõ lại gì cả. Đạt được bằng ba lớp:
 *
 *  1. Cookie phiên 30 ngày (khi bật "Ghi nhớ tôi") + tự gia hạn mỗi lần dùng
 *     -> mở /cms là vào thẳng bảng điều khiển, không thấy màn đăng nhập.
 *  2. Tên đăng nhập lưu trong localStorage -> luôn điền sẵn.
 *  3. Mật khẩu do **trình duyệt** ghi nhớ (Chrome/Edge/Firefox password manager),
 *     tự điền cả hai ô kể cả sau khi bấm Đăng xuất.
 *
 * Vì sao để trình duyệt giữ mật khẩu thay vì tự lưu vào localStorage:
 * mật khẩu trong localStorage là chữ thường, mọi đoạn script chạy trên trang đều
 * đọc được — chỉ cần một lỗ XSS là mất luôn mật khẩu (không chỉ mất phiên).
 * Trình duyệt lưu có mã hóa theo tài khoản hệ điều hành và không script nào đọc được.
 *
 * Lưu ý kỹ thuật: form đăng nhập kiểu SPA thường bị trình duyệt bỏ qua vì
 * `preventDefault()` chặn mất tín hiệu "đã submit". Nên sau khi đăng nhập thành công
 * ta cho tải lại trang — trình duyệt thấy có điều hướng thật và mới hỏi "Lưu mật khẩu?".
 */

import { html, safeUrl } from '/assets/js/core/dom.js';
import { authApi, siteApi } from '/assets/js/core/api.js';
import { toast } from '../core/ui.js';

const REMEMBER_USER_KEY = 'cms_remember_user';
const REMEMBER_FLAG_KEY = 'cms_remember_on';

const store = {
  get(key, fallback = '') {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch {
      return fallback; // trình duyệt chặn storage (chế độ ẩn danh chặt)
    }
  },
  set(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch {
      /* bỏ qua */
    }
  },
};

/**
 * Lấy phần nhận diện cho màn đăng nhập.
 * Màn này hiện TRƯỚC khi đăng nhập nên chỉ được dùng API công khai `/api/site`
 * (logo và tên công ty vốn đã hiển thị trên trang web, không có gì bí mật).
 * Mạng lỗi thì vẫn hiện màn đăng nhập với chữ mặc định.
 */
async function loadBranding() {
  try {
    const { settings } = await siteApi.getPublicSite();
    return {
      logo: safeUrl(settings?.cms?.loginLogo) || safeUrl(settings?.logo) || '',
      favicon: safeUrl(settings?.favicon) || '',
      title: settings?.cms?.loginTitle || 'Đăng nhập quản trị',
      subtitle: settings?.cms?.loginSubtitle || 'Quản lý nội dung website',
      tabTitle: settings?.cms?.tabTitle || '',
    };
  } catch {
    return null;
  }
}

/** Đổi biểu tượng trên tab trình duyệt của trang quản trị. */
export function applyFavicon(url) {
  if (!url) return;
  document.querySelector('link[rel="icon"]')?.setAttribute('href', url);
}

export function renderLogin(root, onSuccess) {
  const savedUser = store.get(REMEMBER_USER_KEY);
  // Mặc định bật ghi nhớ; chỉ tắt khi người dùng đã chủ động tắt lần trước
  const rememberOn = store.get(REMEMBER_FLAG_KEY, '1') !== '0';

  root.className = '';
  root.innerHTML = html`
    <div class="login">
      <div class="login__card">
        <img class="login__logo" alt="" data-login-logo hidden />
        <h1 class="login__title" data-login-title>Đăng nhập quản trị</h1>
        <p class="login__sub" data-login-sub>Quản lý nội dung website</p>

        <form class="fields" id="cms-login" name="cms-login" method="post" action="/api/auth/login" data-login-form>
          <div class="field">
            <label class="field__label" for="username">Tên đăng nhập</label>
            <input
              class="input"
              id="username"
              name="username"
              type="text"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              required
              value="${savedUser}"
            />
          </div>
          <div class="field">
            <label class="field__label" for="password">Mật khẩu</label>
            <input
              class="input"
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
            />
          </div>

          <label class="switch" style="margin: 2px 0 6px">
            <input type="checkbox" name="remember" ${rememberOn ? 'checked' : ''} />
            <span class="switch__track"></span>
            <span class="switch__text">Ghi nhớ tôi trên máy này (30 ngày)</span>
          </label>

          <button class="btn btn--primary btn--block" type="submit" data-submit>Đăng nhập</button>
        </form>
      </div>
    </div>
  `;

  // Vẽ ngay với chữ mặc định rồi thay bằng nhận diện thật khi tải xong,
  // để mạng chậm cũng không phải nhìn màn hình trắng.
  loadBranding().then((branding) => {
    if (!branding) return;
    const logo = root.querySelector('[data-login-logo]');
    if (logo && branding.logo) {
      logo.src = branding.logo;
      logo.hidden = false;
    }

    const title = root.querySelector('[data-login-title]');
    if (title) title.textContent = branding.title;

    const subtitle = root.querySelector('[data-login-sub]');
    if (subtitle) subtitle.textContent = branding.subtitle;

    if (branding.tabTitle) document.title = branding.tabTitle;
    if (branding.favicon) applyFavicon(branding.favicon);
  });

  const form = root.querySelector('[data-login-form]');

  // Đã nhớ tên rồi thì nhảy thẳng vào ô mật khẩu
  root.querySelector(savedUser ? '#password' : '#username')?.focus();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = form.querySelector('[data-submit]');
    const data = Object.fromEntries(new FormData(form).entries());
    const remember = data.remember === 'on';

    button.disabled = true;
    button.textContent = 'Đang đăng nhập…';

    try {
      await authApi.login(data.username, data.password, remember);

      store.set(REMEMBER_FLAG_KEY, remember ? '1' : '0');
      store.set(REMEMBER_USER_KEY, remember ? data.username : '');

      // Tải lại trang thay vì chuyển màn hình bằng JS: đây là tín hiệu để
      // trình duyệt hiện hộp thoại "Lưu mật khẩu?". Phiên đã nằm trong cookie
      // nên sau khi tải lại sẽ vào thẳng bảng điều khiển.
      if (remember) {
        location.replace(location.pathname);
        return;
      }

      onSuccess();
    } catch (error) {
      toast(error.message || 'Đăng nhập thất bại', 'error');
      button.disabled = false;
      button.textContent = 'Đăng nhập';
      form.querySelector('#password')?.focus();
    }
  });
}
