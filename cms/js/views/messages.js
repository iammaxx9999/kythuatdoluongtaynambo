/**
 * messages.js - hop thu yeu cau bao gia gui tu form lien he.
 */

import { html, raw, esc } from '/assets/js/core/dom.js';
import { messageApi } from '/assets/js/core/api.js';
import { confirmDialog, toast, formatDate } from '../core/ui.js';

export const messagesView = {
  title: 'Yêu cầu liên hệ',
  description: 'Tin nhắn khách gửi từ form báo giá trên website',

  async mount(container, ctx) {
    let messages = [];

    const paint = () => {
      const unread = messages.filter((item) => !item.read).length;

      container.innerHTML = html`
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi__value">${messages.length}</div><div class="kpi__label">Tổng yêu cầu</div></div>
          <div class="kpi"><div class="kpi__value">${unread}</div><div class="kpi__label">Chưa đọc</div></div>
        </div>

        <section class="card">
          ${messages.length === 0
            ? html`<div class="empty">Chưa có yêu cầu nào.</div>`
            : raw(`
              <table class="table">
                <thead>
                  <tr>
                    <th style="width:150px">Thời gian</th>
                    <th style="width:200px">Khách hàng</th>
                    <th>Nội dung</th>
                    <th style="width:170px"></th>
                  </tr>
                </thead>
                <tbody>
                  ${messages
                    .map(
                      (msg) => `
                    <tr>
                      <td style="font-size:.82rem;color:var(--ink-3)">${esc(formatDate(msg.createdAt))}</td>
                      <td>
                        <strong>${esc(msg.name)}</strong>
                        ${!msg.read ? '<span class="tag tag--new" style="margin-left:6px">Mới</span>' : ''}
                        <div style="font-size:.82rem;color:var(--ink-3)">
                          ${msg.phone ? `<a href="tel:${esc(msg.phone)}">${esc(msg.phone)}</a>` : ''}
                          ${msg.email ? `· <a href="mailto:${esc(msg.email)}">${esc(msg.email)}</a>` : ''}
                        </div>
                        ${msg.company ? `<div style="font-size:.82rem;color:var(--ink-3)">${esc(msg.company)}</div>` : ''}
                      </td>
                      <td>
                        <span class="tag">${esc(msg.subject || 'Khác')}</span>
                        <div style="margin-top:6px;white-space:pre-line">${esc(msg.content)}</div>
                      </td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn--sm" type="button" data-read="${esc(msg.id)}" data-value="${msg.read ? 'false' : 'true'}">
                            ${msg.read ? 'Đánh dấu chưa đọc' : 'Đã đọc'}
                          </button>
                          <button class="btn btn--sm btn--danger" type="button" data-remove="${esc(msg.id)}">Xóa</button>
                        </div>
                      </td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>`)}
        </section>
      `;
    };

    const refresh = async () => {
      messages = await messageApi.list();
      ctx.setUnread?.(messages.filter((item) => !item.read).length);
      paint();
    };

    container.innerHTML = html`<div class="empty">Đang tải…</div>`;

    try {
      await refresh();
    } catch (error) {
      container.innerHTML = html`<div class="empty">${error.message}</div>`;
      return;
    }

    container.addEventListener('click', async (event) => {
      const button = event.target.closest('button');
      if (!button) return;

      try {
        if (button.dataset.read) {
          await messageApi.markRead(button.dataset.read, button.dataset.value === 'true');
          await refresh();
        }
        if (button.dataset.remove) {
          if (!(await confirmDialog('Xóa yêu cầu này?'))) return;
          await messageApi.remove(button.dataset.remove);
          toast('Đã xóa', 'success');
          await refresh();
        }
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  },
};
