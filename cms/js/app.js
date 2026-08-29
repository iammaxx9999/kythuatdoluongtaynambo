/**
 * app.js - vo CMS: kiem tra dang nhap, sidebar, dinh tuyen bang hash.
 *
 * Them man hinh moi = them 1 dong vao mang ROUTES.
 */

import { html, raw, esc, qs, safeUrl } from '/assets/js/core/dom.js';
import { authApi, siteApi } from '/assets/js/core/api.js';
import { toast, siteHref } from './core/ui.js';
import { createSectionView } from './core/section-view.js';
import { renderLogin, applyFavicon } from './views/login.js';
import { dashboardView } from './views/dashboard.js';
import { productsView } from './views/products.js';
import { mediaView } from './views/media.js';
import { messagesView } from './views/messages.js';
import { accountView } from './views/account.js';
import {
  generalView,
  footerView,
  maintenanceView,
  heroView,
  homeView,
  aboutView,
  contactView,
  floatingView,
} from './views/schemas.js';

/** Cai dat khu vuc san pham (tieu de, danh muc loc). */
const productsSectionView = createSectionView({
  section: 'productsSection',
  title: 'Cài đặt khu vực sản phẩm',
  description: 'Tiêu đề khối sản phẩm và danh mục lọc',
  hint: 'Slug danh mục phải trùng với danh mục chọn ở từng sản phẩm. Mục đầu tiên đóng vai trò "Tất cả".',
  groups: [
    {
      title: 'Tiêu đề khu vực',
      columns: 2,
      fields: [
        { path: 'eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'title', label: 'Tiêu đề', type: 'text' },
        { path: 'subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
        { path: 'showFilter', label: 'Hiện thanh lọc danh mục', type: 'toggle' },
      ],
    },
    {
      title: 'Danh mục',
      fields: [
        {
          type: 'repeater',
          path: 'categories',
          label: 'Danh sách danh mục',
          addLabel: 'Thêm danh mục',
          itemLabelKey: 'name',
          columns: 2,
          defaults: { slug: 'danh-muc-moi', name: 'Danh mục mới' },
          fields: [
            { path: 'name', label: 'Tên hiển thị', type: 'text' },
            { path: 'slug', label: 'Slug', type: 'text' },
          ],
        },
      ],
    },
  ],
});

const ROUTES = [
  { id: 'tong-quan', group: 'Tổng quan', label: 'Bảng điều khiển', view: dashboardView },
  { id: 'cau-hinh', group: 'Nội dung', label: 'Cấu hình chung', view: generalView },
  { id: 'dau-trang', group: 'Nội dung', label: 'Đầu trang / Video', view: heroView },
  { id: 'trang-chu', group: 'Nội dung', label: 'Trang chủ', view: homeView },
  { id: 'khu-san-pham', group: 'Nội dung', label: 'Khu vực sản phẩm', view: productsSectionView },
  { id: 'san-pham', group: 'Nội dung', label: 'Sản phẩm', view: productsView },
  { id: 'gioi-thieu', group: 'Nội dung', label: 'Giới thiệu', view: aboutView },
  { id: 'lien-he', group: 'Nội dung', label: 'Liên hệ & bản đồ', view: contactView },
  { id: 'nut-noi', group: 'Nội dung', label: 'Nút liên hệ nổi', view: floatingView },
  { id: 'chan-trang', group: 'Nội dung', label: 'Chân trang & credit', view: footerView },
  { id: 'bo-suu-tap', group: 'Hệ thống', label: 'Bộ sưu tập', view: mediaView },
  { id: 'yeu-cau', group: 'Hệ thống', label: 'Yêu cầu liên hệ', view: messagesView, badge: 'unread' },
  { id: 'bao-tri', group: 'Hệ thống', label: 'Chế độ bảo trì', view: maintenanceView },
  { id: 'tai-khoan', group: 'Hệ thống', label: 'Tài khoản', view: accountView },
];

const app = qs('#app');

const ctx = {
  data: null,
  user: null,
  unread: 0,
  dirty: false,
  setDirty(value) {
    ctx.dirty = value;
  },
  setUnread(count) {
    ctx.unread = count;
    const badge = qs('[data-badge="unread"]');
    if (badge) {
      badge.textContent = count || '';
      badge.hidden = !count;
    }
  },
};

/* ------------------------- Khoi dong ------------------------- */
/**
 * Con cookie phien hop le thi vao thang bang dieu khien, khong hoi dang nhap.
 * Cookie do server cap khi dang nhap va tu gia han moi lan su dung.
 */
async function bootstrap() {
  try {
    const { user } = await authApi.me();
    ctx.user = user;
    await startShell();
  } catch {
    // Chua dang nhap (hoac phien het han) -> hien man dang nhap.
    // Dang nhap xong thi chay lai bootstrap de lay ho so tu cookie moi.
    renderLogin(app, bootstrap);
  }
}

async function startShell() {
  app.className = '';
  app.innerHTML = html`<div class="admin-boot"><span class="spinner"></span></div>`;

  try {
    ctx.data = await siteApi.getAdminSite();
  } catch (error) {
    toast(error.message || 'Không tải được dữ liệu', 'error');
    return;
  }

  renderShell();
  window.addEventListener('hashchange', navigate);
  navigate();
}

/** Logo cho thanh bên: ưu tiên logo riêng của CMS, không có thì dùng favicon rồi tới logo chung. */
function cmsLogo() {
  const settings = ctx.data?.settings ?? {};
  return safeUrl(settings.cms?.logo) || safeUrl(settings.favicon) || safeUrl(settings.logo) || '';
}

/**
 * Dải cảnh báo khi đang bật bảo trì.
 *
 * Rủi ro thật của tính năng này không phải là bật nhầm, mà là **quên tắt** —
 * website đóng cửa hàng ngày trời mà không ai hay. Nên cảnh báo hiện ở MỌI màn
 * hình trong CMS, kèm nút tắt ngay tại chỗ.
 */
function maintenanceBanner() {
  if (!ctx.data?.settings?.maintenance?.enabled) return '';
  return html`
    <div class="alert-bar" role="alert">
      <span class="alert-bar__dot" aria-hidden="true"></span>
      <div class="alert-bar__text">
        <strong>Website đang bảo trì.</strong>
        Khách vào trang chỉ thấy thông báo bảo trì. Trang quản trị này vẫn hoạt động bình thường.
      </div>
      <button class="btn btn--sm" type="button" data-maintenance-off>Tắt bảo trì</button>
    </div>
  `;
}

function renderShell() {
  const groups = [...new Set(ROUTES.map((route) => route.group))];

  // Tiêu đề và biểu tượng trên tab của trang quản trị
  document.title = ctx.data.settings?.cms?.tabTitle || 'CMS';
  applyFavicon(safeUrl(ctx.data.settings?.favicon));

  app.innerHTML = html`
    <div class="shell">
      <aside class="sidebar">
        <div class="sidebar__brand">
          <img class="sidebar__logo" src="${cmsLogo()}" alt="" />
          <div>
            <strong>${ctx.data.settings?.cms?.title || 'CMS'}</strong>
            <span>${ctx.data.settings?.siteName ?? 'Website'}</span>
          </div>
        </div>

        ${groups.map(
          (group) => html`
            <div>
              <div class="sidebar__group-title">${group}</div>
              <ul>
                ${ROUTES.filter((route) => route.group === group).map(
                  (route) => html`
                    <li>
                      <a class="sidebar__link" href="#/${route.id}" data-route="${route.id}">
                        <span>${route.label}</span>
                        ${route.badge
                          ? raw(`<span class="sidebar__badge" data-badge="${esc(route.badge)}" hidden></span>`)
                          : ''}
                      </a>
                    </li>
                  `,
                )}
              </ul>
            </div>
          `,
        )}

        <div class="sidebar__foot">
          <div>${ctx.user?.displayName || ctx.user?.username}</div>
          <div style="display:flex;gap:8px;margin-top:10px">
            <a class="btn btn--sm" href="${siteHref(ctx.data.settings)}" target="_blank" rel="noopener">Xem web</a>
            <button class="btn btn--sm" type="button" data-logout>Đăng xuất</button>
          </div>
        </div>
      </aside>

      <div class="main">
        ${maintenanceBanner()}
        <header class="topbar">
          <div>
            <div class="topbar__title" data-view-title></div>
            <div class="topbar__desc" data-view-desc></div>
          </div>
          <div class="topbar__actions">
            <a class="btn btn--sm" href="${siteHref(ctx.data.settings)}" target="_blank" rel="noopener">Xem website</a>
          </div>
        </header>
        <div class="view" data-view></div>
      </div>
    </div>
  `;

  qs('[data-maintenance-off]')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await siteApi.patchSection('settings', { maintenance: { enabled: false } });
      ctx.data.settings.maintenance.enabled = false;
      toast('Đã tắt bảo trì. Website hoạt động trở lại.', 'success');
      renderShell();
      navigate();
    } catch (error) {
      toast(error.message || 'Không tắt được bảo trì', 'error');
      button.disabled = false;
    }
  });

  qs('[data-logout]').addEventListener('click', async () => {
    await authApi.logout().catch(() => {});
    location.hash = '';
    location.reload();
  });
}

/* ------------------------- Dinh tuyen ------------------------- */
let cleanup = null;

async function navigate() {
  const id = location.hash.replace(/^#\/?/, '') || ROUTES[0].id;
  const route = ROUTES.find((item) => item.id === id) ?? ROUTES[0];

  if (ctx.dirty && !window.confirm('Bạn có thay đổi chưa lưu. Rời khỏi trang này?')) {
    return;
  }

  cleanup?.();
  cleanup = null;
  ctx.setDirty(false);

  document.querySelectorAll('[data-route]').forEach((link) => {
    link.classList.toggle('is-active', link.dataset.route === route.id);
  });

  qs('[data-view-title]').textContent = route.view.title;
  qs('[data-view-desc]').textContent = route.view.description ?? '';

  // Thay the han node cu -> moi man hinh co DOM sach, khong con listener thua
  const host = document.createElement('div');
  host.className = 'view';
  host.setAttribute('data-view', '');
  qs('[data-view]').replaceWith(host);

  try {
    cleanup = await route.view.mount(host, ctx);
  } catch (error) {
    console.error(error);
    host.innerHTML = html`<div class="empty">Lỗi hiển thị: ${error.message}</div>`;
  }
}

window.addEventListener('beforeunload', (event) => {
  if (!ctx.dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

bootstrap();
