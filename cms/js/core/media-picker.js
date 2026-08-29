/**
 * media-picker.js - thu vien anh/video dung chung.
 * pickMedia('image') -> Promise<string|undefined> (URL da chon)
 */

import { html, raw, esc } from '/assets/js/core/dom.js';
import { mediaApi } from '/assets/js/core/api.js';
import { openModal, toast, formatBytes } from './ui.js';

let cache = null;

export const invalidateMediaCache = () => {
  cache = null;
};

export async function loadMedia({ force = false } = {}) {
  if (!cache || force) cache = await mediaApi.list();
  return cache;
}

export async function uploadFiles(files) {
  if (!files?.length) return [];
  const created = await mediaApi.upload(files);
  cache = [...created, ...(cache ?? [])];
  return created;
}

export function mediaGrid(items, { deletable = false } = {}) {
  if (!items.length) return html`<div class="empty">Thư viện trống. Tải ảnh lên để bắt đầu.</div>`;

  return `<div class="media-grid">${items
    .map(
      (item) => `
    <div class="media-item" data-url="${esc(item.url)}" data-id="${esc(item.id)}" title="${esc(item.originalName)}">
      <div class="media-item__thumb">
        ${
          item.kind === 'video'
            ? `<video src="${esc(item.url)}" muted></video>`
            : `<img src="${esc(item.url)}" alt="${esc(item.originalName)}" loading="lazy" />`
        }
      </div>
      <div class="media-item__meta">${esc(item.originalName)} · ${formatBytes(item.size)}</div>
      ${deletable ? `<button class="media-item__del" type="button" data-del="${esc(item.id)}" title="Xóa">&times;</button>` : ''}
    </div>`,
    )
    .join('')}</div>`;
}

/** Mo modal chon tep. kind = 'image' | 'video' | 'all' */
export async function pickMedia(kind = 'image') {
  let items = [];
  try {
    items = await loadMedia();
  } catch (error) {
    toast(error.message, 'error');
  }

  const filtered = kind === 'all' ? items : items.filter((item) => item.kind === kind);

  return openModal({
    title: kind === 'video' ? 'Chọn video' : 'Chọn hình ảnh',
    body: html`
      <div class="dropzone" data-drop>
        <strong>Kéo thả tệp vào đây</strong> hoặc bấm để chọn từ máy
        <div style="font-size:.78rem;margin-top:4px">JPG, PNG, WEBP, SVG, GIF, MP4, WEBM</div>
        <input type="file" multiple accept="image/*,video/*" hidden data-file-input />
      </div>
      <div data-grid>${raw(mediaGrid(filtered))}</div>
    `,
    onMount: (dialog, close) => {
      const drop = dialog.querySelector('[data-drop]');
      const input = dialog.querySelector('[data-file-input]');
      const grid = dialog.querySelector('[data-grid]');

      const refresh = async () => {
        const all = await loadMedia({ force: true });
        grid.innerHTML = mediaGrid(kind === 'all' ? all : all.filter((item) => item.kind === kind));
      };

      const handleFiles = async (files) => {
        try {
          drop.textContent = 'Đang tải lên…';
          await uploadFiles(files);
          await refresh();
          drop.innerHTML = '<strong>Tải lên xong.</strong> Bấm để chọn thêm tệp';
          toast('Đã tải tệp lên thư viện', 'success');
        } catch (error) {
          toast(error.message, 'error');
          drop.innerHTML = '<strong>Kéo thả tệp vào đây</strong> hoặc bấm để chọn từ máy';
        }
      };

      drop.addEventListener('click', () => input.click());
      input.addEventListener('change', () => handleFiles(input.files));

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

      grid.addEventListener('click', (event) => {
        const item = event.target.closest('[data-url]');
        if (item) close(item.dataset.url);
      });
    },
  });
}
