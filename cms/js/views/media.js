/**
 * media.js - bộ sưu tập ảnh & video của website.
 *
 * Ba việc: tải lên (kéo thả), xem lại (bấm vào ảnh mở cỡ lớn),
 * và xóa hẳn khỏi ổ đĩa. Trước khi xóa luôn tra xem tệp có đang được dùng ở đâu.
 */

import { html, raw, esc } from '/assets/js/core/dom.js';
import { mediaApi } from '/assets/js/core/api.js';
import { loadMedia, uploadFiles, invalidateMediaCache } from '../core/media-picker.js';
import { openModal, confirmDialog, toast, formatBytes, formatDate } from '../core/ui.js';
import { findUsage } from '../core/usage.js';

const DROP_LABEL =
  '<strong>Kéo thả tệp vào đây</strong> hoặc bấm để chọn từ máy' +
  '<div style="font-size:.78rem;margin-top:4px">JPG, PNG, WEBP, SVG, GIF, MP4, WEBM · tối đa 15MB mỗi tệp</div>';

export const mediaView = {
  title: 'Bộ sưu tập',
  description: 'Tải lên, xem lại và xóa ảnh/video dùng cho website',

  async mount(container, ctx) {
    let items = [];

    container.innerHTML = html`
      <div class="hint">
        Bấm vào một tệp để xem cỡ lớn, sao chép đường dẫn hoặc xóa hẳn khỏi ổ đĩa.
        Trước khi xóa, hệ thống sẽ cho biết tệp đó có đang dùng trên trang hay không.
      </div>

      <section class="card">
        <div class="card__head">
          <div>
            <div class="card__title">Bộ sưu tập <span data-count></span></div>
            <div class="card__desc">Tệp nằm trong thư mục <code>public/uploads</code> của dự án</div>
          </div>
          <div class="card__actions">
            <input class="input" type="search" placeholder="Tìm theo tên tệp…" data-search style="min-width:220px" />
          </div>
        </div>

        <div class="dropzone" data-drop>
          ${raw(DROP_LABEL)}
          <input type="file" multiple accept="image/*,video/*" hidden data-file-input />
        </div>

        <div data-grid><div class="empty">Đang tải…</div></div>
      </section>
    `;

    const drop = container.querySelector('[data-drop]');
    const input = container.querySelector('[data-file-input]');
    const grid = container.querySelector('[data-grid]');
    const search = container.querySelector('[data-search]');
    const counter = container.querySelector('[data-count]');

    const paint = () => {
      const keyword = (search.value || '').trim().toLowerCase();
      const shown = keyword
        ? items.filter((item) => item.originalName.toLowerCase().includes(keyword))
        : items;

      counter.textContent = keyword ? `(${shown.length}/${items.length})` : `(${items.length})`;
      grid.innerHTML = shown.length
        ? gallery(shown)
        : html`<div class="empty">${keyword ? 'Không có tệp nào khớp.' : 'Bộ sưu tập trống. Tải ảnh lên để bắt đầu.'}</div>`;
    };

    const reload = async () => {
      try {
        items = await loadMedia({ force: true });
        paint();
      } catch (error) {
        grid.innerHTML = html`<div class="empty">${error.message}</div>`;
      }
    };

    /* ---------------- Tải lên ---------------- */
    const handleFiles = async (files) => {
      if (!files?.length) return;
      try {
        drop.innerHTML = '<strong>Đang tải lên…</strong>';
        const created = await uploadFiles(files);
        toast(`Đã tải lên ${created.length} tệp`, 'success');
      } catch (error) {
        toast(error.message, 'error');
      } finally {
        drop.innerHTML = DROP_LABEL;
        await reload();
      }
    };

    drop.addEventListener('click', () => input.click());
    input.addEventListener('change', () => {
      handleFiles(input.files);
      input.value = ''; // cho phép chọn lại đúng tệp đó lần nữa
    });

    ['dragenter', 'dragover'].forEach((type) =>
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.add('is-over');
      }),
    );
    ['dragleave', 'drop'].forEach((type) =>
      drop.addEventListener(type, (event) => {
        event.preventDefault();
        drop.classList.remove('is-over');
      }),
    );
    drop.addEventListener('drop', (event) => handleFiles(event.dataTransfer.files));

    search.addEventListener('input', paint);

    /* ---------------- Xem & xóa ---------------- */
    const removeItem = async (item) => {
      const usage = findUsage(ctx.data, item.url);
      const warning = usage.length
        ? `<div class="hint" style="background:var(--danger-soft);color:var(--danger)">
             Tệp này đang được dùng ở: <strong>${esc(usage.join(' · '))}</strong>.
             Xóa xong những chỗ đó sẽ mất hình.
           </div>`
        : '';

      const ok = await confirmDialog(
        html`${raw(warning)}
          <p>Xóa hẳn <strong>${item.originalName}</strong> khỏi ổ đĩa? Không khôi phục lại được.</p>`,
      );
      if (!ok) return false;

      try {
        await mediaApi.remove(item.id);
        invalidateMediaCache();
        toast('Đã xóa tệp khỏi ổ đĩa', 'success');
        await reload();
        return true;
      } catch (error) {
        toast(error.message, 'error');
        return false;
      }
    };

    const openViewer = (item) => {
      const usage = findUsage(ctx.data, item.url);

      openModal({
        title: item.originalName,
        width: '860px',
        body: html`
          <div class="viewer">
            <div class="viewer__stage">
              ${item.kind === 'video'
                ? raw(`<video src="${esc(item.url)}" controls></video>`)
                : raw(`<img src="${esc(item.url)}" alt="${esc(item.originalName)}" />`)}
            </div>
            <dl class="viewer__meta">
              <dt>Tên tệp</dt>
              <dd>${item.originalName}</dd>
              <dt>Dung lượng</dt>
              <dd>${formatBytes(item.size)}</dd>
              <dt>Loại</dt>
              <dd>${item.kind === 'video' ? 'Video' : 'Hình ảnh'} · ${item.mimetype}</dd>
              <dt>Tải lên</dt>
              <dd>${formatDate(item.createdAt)}</dd>
              <dt>Đang dùng ở</dt>
              <dd>
                ${usage.length
                  ? html`<span class="tag tag--on">${usage.length} nơi</span> ${usage.join(' · ')}`
                  : html`<span class="tag tag--off">Chưa dùng ở đâu</span>`}
              </dd>
              <dt>Đường dẫn</dt>
              <dd><code class="viewer__path">${item.url}</code></dd>
            </dl>
          </div>
        `,
        footer: html`
          <button class="btn btn--danger" type="button" data-remove>Xóa khỏi ổ đĩa</button>
          <span style="flex:1"></span>
          <button class="btn" type="button" data-copy>Sao chép đường dẫn</button>
          <a class="btn" href="${item.url}" target="_blank" rel="noopener">Mở tab mới</a>
        `,
        onMount: (dialog, close) => {
          dialog.querySelector('[data-copy]').addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(item.url);
              toast(`Đã sao chép: ${item.url}`, 'success');
            } catch {
              toast(item.url);
            }
          });
          dialog.querySelector('[data-remove]').addEventListener('click', async () => {
            if (await removeItem(item)) close(true);
          });
        },
      });
    };

    grid.addEventListener('click', async (event) => {
      const del = event.target.closest('[data-del]');
      if (del) {
        event.stopPropagation();
        const item = items.find((x) => x.id === del.dataset.del);
        if (item) await removeItem(item);
        return;
      }

      const card = event.target.closest('[data-id]');
      if (!card) return;
      const item = items.find((x) => x.id === card.dataset.id);
      if (item) openViewer(item);
    });

    await reload();
  },
};

/** Lưới các tệp trong bộ sưu tập. */
function gallery(items) {
  return `<div class="media-grid">${items
    .map(
      (item) => `
    <div class="media-item" data-id="${esc(item.id)}" title="Bấm để xem: ${esc(item.originalName)}">
      <div class="media-item__thumb">
        ${
          item.kind === 'video'
            ? `<video src="${esc(item.url)}" muted></video>`
            : `<img src="${esc(item.url)}" alt="${esc(item.originalName)}" loading="lazy" />`
        }
      </div>
      <div class="media-item__meta">
        <span class="media-item__name">${esc(item.originalName)}</span>
        <span class="media-item__size">${formatBytes(item.size)}</span>
      </div>
      <button class="media-item__del" type="button" data-del="${esc(item.id)}" title="Xóa khỏi ổ đĩa">&times;</button>
    </div>`,
    )
    .join('')}</div>`;
}
