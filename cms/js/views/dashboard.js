/**
 * dashboard.js - man hinh tong quan khi vao CMS.
 */

import { html, raw } from '/assets/js/core/dom.js';
import { messageApi } from '/assets/js/core/api.js';
import { siteHref } from '../core/ui.js';
import { loadMedia } from '../core/media-picker.js';

export const dashboardView = {
  title: 'Tổng quan',
  description: 'Tình trạng nội dung website',

  async mount(container, ctx) {
    const products = ctx.data.products ?? [];
    const slides = ctx.data.hero?.slides ?? [];
    const channels = (ctx.data.floatingContact?.channels ?? []).filter((c) => c.enabled !== false);

    let messages = [];
    let media = [];
    try {
      [messages, media] = await Promise.all([messageApi.list(), loadMedia()]);
    } catch {
      /* bo qua - van hien thi phan con lai */
    }

    const unread = messages.filter((item) => !item.read).length;
    ctx.setUnread?.(unread);

    container.innerHTML = html`
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi__value">${products.filter((p) => p.enabled !== false).length}/${products.length}</div>
          <div class="kpi__label">Sản phẩm đang hiển thị</div>
        </div>
        <div class="kpi">
          <div class="kpi__value">${unread}</div>
          <div class="kpi__label">Yêu cầu chưa đọc</div>
        </div>
        <div class="kpi">
          <div class="kpi__value">${media.length}</div>
          <div class="kpi__label">Tệp trong thư viện</div>
        </div>
        <div class="kpi">
          <div class="kpi__value">${channels.length}</div>
          <div class="kpi__label">Kênh liên hệ đang bật</div>
        </div>
      </div>

      <section class="card">
        <div class="card__head">
          <div>
            <div class="card__title">Trạng thái các khối nội dung</div>
            <div class="card__desc">Bấm vào từng mục ở menu bên trái để chỉnh sửa</div>
          </div>
          <div class="card__actions">
            <a class="btn" href="${siteHref(ctx.data.settings)}" target="_blank" rel="noopener">Xem website</a>
          </div>
        </div>
        <table class="table">
          <tbody>
            ${statusRow('Đầu trang', ctx.data.hero?.mode === 'video' ? 'Chế độ video nền' : `Slideshow · ${slides.length} slide`, true)}
            ${statusRow('Dải con số', `${ctx.data.home?.stats?.items?.length ?? 0} mục`, ctx.data.home?.stats?.enabled)}
            ${statusRow('Dịch vụ', `${ctx.data.home?.services?.items?.length ?? 0} mục`, ctx.data.home?.services?.enabled)}
            ${statusRow('Điểm mạnh', `${ctx.data.home?.features?.items?.length ?? 0} mục`, ctx.data.home?.features?.enabled)}
            ${statusRow('Giới thiệu', `${ctx.data.about?.milestones?.length ?? 0} dấu mốc`, true)}
            ${statusRow('Hình ảnh thực tế', `${ctx.data.home?.gallery?.items?.length ?? 0} ảnh`, ctx.data.home?.gallery?.enabled)}
            ${statusRow('Dải kêu gọi hành động', `Tông ${ctx.data.home?.cta?.theme ?? 'light'}`, ctx.data.home?.cta?.enabled)}
            ${statusRow('Bản đồ liên hệ', ctx.data.contact?.map?.mode === 'embed' ? 'Mã nhúng riêng' : 'Tự sinh từ địa chỉ', ctx.data.contact?.map?.enabled)}
            ${statusRow('Form báo giá', ctx.data.contact?.form?.title ?? '', ctx.data.contact?.form?.enabled)}
            ${statusRow('Nút liên hệ nổi', `${channels.length} kênh`, ctx.data.floatingContact?.enabled)}
            ${statusRow(
              'Chân trang',
              `${ctx.data.settings?.footer?.columns?.length ?? 0} cột · tông ${ctx.data.settings?.footer?.theme ?? 'dark'}`,
              ctx.data.settings?.footer?.enabled,
            )}
            ${statusRow(
              'Dòng credit',
              ctx.data.settings?.footer?.credit?.name ?? '',
              ctx.data.settings?.footer?.credit?.enabled,
            )}
          </tbody>
        </table>
      </section>
    `;
  },
};

const statusRow = (label, detail, enabled) => raw(html`
  <tr>
    <td style="width:220px"><strong>${label}</strong></td>
    <td style="color:var(--ink-3)">${detail}</td>
    <td style="width:120px">
      <span class="tag ${enabled === false ? 'tag--off' : 'tag--on'}">${enabled === false ? 'Đang tắt' : 'Đang bật'}</span>
    </td>
  </tr>
`);
