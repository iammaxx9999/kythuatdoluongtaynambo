/**
 * form.js - trinh dung form theo schema.
 *
 * Thay vi viet tay HTML cho tung o nhap, moi man hinh CMS chi khai bao
 * mot mang "field spec" roi goi renderFields()/bindForm(). Them truong moi
 * = them mot dong khai bao.
 *
 * Cac loai field: text | textarea | number | select | toggle | color |
 *                 icon | image | video | stringlist | group | repeater
 */

import { html, raw, esc } from '/assets/js/core/dom.js';
import { icon as renderIcon } from '/assets/js/core/icons.js';
import { fileName, isExternalUrl } from './ui.js';
import { getPath, setPath, clone, uid } from './path.js';

const joinPath = (prefix, path) => (prefix ? `${prefix}.${path}` : path);

/* ======================= RENDER ======================= */

export function renderFields(fields = [], model = {}, prefix = '') {
  return fields.map((field) => renderField(field, model, prefix)).join('');
}

function renderField(field, model, prefix) {
  if (field.type === 'group') return renderGroup(field, model, prefix);
  if (field.type === 'repeater') return renderRepeater(field, model, prefix);

  const path = joinPath(prefix, field.path);
  const value = getPath(model, path);
  const cls = `field ${field.width === 'full' ? 'field--full' : ''}`;

  return html`
    <div class="${raw(cls)}" data-field="${path}">
      ${field.type === 'toggle'
        ? raw(control(field, path, value))
        : html`
            <label class="field__label" for="f-${path}">${field.label}</label>
            ${raw(control(field, path, value))}
          `}
      ${field.help ? html`<span class="field__help">${field.help}</span>` : ''}
    </div>
  `;
}

function control(field, path, value) {
  const common = `id="f-${esc(path)}" data-path="${esc(path)}" data-type="${esc(field.type)}"`;
  const ph = field.placeholder ? `placeholder="${esc(field.placeholder)}"` : '';

  switch (field.type) {
    case 'textarea':
      return `<textarea class="textarea" ${common} ${ph} rows="${field.rows ?? 4}">${esc(value ?? '')}</textarea>`;

    case 'stringlist':
      return `<textarea class="textarea" ${common} ${ph} rows="${field.rows ?? 4}">${esc(
        (Array.isArray(value) ? value : []).join('\n'),
      )}</textarea>`;

    case 'number':
      return `<input class="input" type="number" ${common} ${ph} value="${esc(value ?? '')}" ${
        field.min !== undefined ? `min="${field.min}"` : ''
      } ${field.max !== undefined ? `max="${field.max}"` : ''} />`;

    case 'color':
      return `<input class="input input--color" type="color" ${common} value="${esc(value || '#1428a0')}" />`;

    case 'select':
      return `<select class="select" ${common}>${normalizeOptions(field.options)
        .map(
          (opt) =>
            `<option value="${esc(opt.value)}" ${String(value) === String(opt.value) ? 'selected' : ''}>${esc(
              opt.label,
            )}</option>`,
        )
        .join('')}</select>`;

    case 'toggle':
      return `<label class="switch">
          <input type="checkbox" ${common} ${value === false ? '' : value ? 'checked' : ''} />
          <span class="switch__track"></span>
          <span class="switch__text">${esc(field.label)}</span>
        </label>`;

    case 'icon':
      return iconControl(field, path, value, common);

    case 'image':
    case 'video':
      return mediaControl(field, path, value, common, ph);

    case 'text':
    default:
      return `<input class="input" type="${field.inputType ?? 'text'}" ${common} ${ph} value="${esc(value ?? '')}" />`;
  }
}

/**
 * Ô chọn biểu tượng: danh sách thả xuống kèm hình xem trước ngay bên cạnh.
 *
 * Vẽ đúng bộ icon mà trang web dùng (import chung từ icons.js) nên những gì
 * thấy ở đây chính là những gì khách sẽ thấy - không có bản sao nào lệch nhau.
 */
function iconControl(field, path, value, common) {
  const options = normalizeOptions(field.options);
  const preview = renderIcon(String(value ?? ''), 20);

  return `
    <div class="icon-field">
      <span class="icon-field__preview" data-icon-preview-for="${esc(path)}" aria-hidden="true">${preview}</span>
      <select class="select" ${common}>
        ${options
          .map(
            (opt) =>
              `<option value="${esc(opt.value)}" ${String(value ?? '') === String(opt.value) ? 'selected' : ''}>${esc(
                opt.label,
              )}</option>`,
          )
          .join('')}
      </select>
    </div>`;
}

/**
 * Ô chọn ảnh/video.
 * Chỉ hiển thị TÊN TỆP cho gọn; đường dẫn đầy đủ nằm trong ô nhập ẩn phía dưới,
 * bấm "Dán đường dẫn" mới mở ra (dùng khi cần trỏ tới ảnh ở tên miền khác).
 */
function mediaControl(field, path, value, common, ph) {
  const isVideo = field.type === 'video';
  const preview = value
    ? isVideo
      ? `<video src="${esc(value)}" muted></video>`
      : `<img src="${esc(value)}" alt="" />`
    : 'Trống';

  const name = fileName(value);
  const external = isExternalUrl(value);

  return `
    <div class="image-field">
      <div class="image-field__preview" data-preview-for="${esc(path)}">${preview}</div>
      <div class="image-field__body">
        <div class="image-field__name" data-name-for="${esc(path)}" title="${esc(value ?? '')}">
          ${
            value
              ? `<span class="image-field__file">${esc(name)}</span>${
                  external ? '<span class="tag" style="margin-left:6px">liên kết ngoài</span>' : ''
                }`
              : '<span class="image-field__empty">Chưa chọn tệp</span>'
          }
        </div>

        <div class="image-field__row">
          <button class="btn btn--sm" type="button" data-action="pick-media" data-target="${esc(path)}"
            data-kind="${isVideo ? 'video' : 'image'}">Chọn từ thư viện</button>
          <button class="btn btn--sm" type="button" data-action="toggle-url" data-target="${esc(path)}">Dán đường dẫn</button>
          ${value ? `<button class="btn btn--sm btn--danger" type="button" data-action="clear-media" data-target="${esc(path)}">Bỏ chọn</button>` : ''}
        </div>

        <input class="input" type="text" ${common} data-url-for="${esc(path)}" hidden
          ${ph || 'placeholder="/uploads/ten-tep.jpg hoặc https://..."'} value="${esc(value ?? '')}" />
      </div>
    </div>`;
}

function renderGroup(field, model, prefix) {
  const path = field.path ? joinPath(prefix, field.path) : prefix;
  return html`
    <div class="field field--full">
      ${field.label ? html`<div class="card__title" style="margin-bottom:10px">${field.label}</div>` : ''}
      ${field.help ? html`<p class="field__help" style="margin-bottom:10px">${field.help}</p>` : ''}
      <div class="fields ${raw(field.columns === 2 ? 'fields--2' : field.columns === 3 ? 'fields--3' : '')}">
        ${raw(renderFields(field.fields, model, path))}
      </div>
    </div>
  `;
}

function renderRepeater(field, model, prefix) {
  const path = joinPath(prefix, field.path);
  const items = getPath(model, path) ?? [];

  return html`
    <div class="field field--full" data-repeater="${path}">
      <div class="card__head" style="margin-bottom:12px">
        <div>
          <div class="card__title">${field.label}</div>
          ${field.help ? html`<div class="card__desc">${field.help}</div>` : ''}
        </div>
        <div class="card__actions">
          <button class="btn btn--sm btn--primary" type="button" data-action="repeat-add" data-repeat="${path}">
            + ${field.addLabel || 'Thêm'}
          </button>
        </div>
      </div>

      <div class="repeater">
        ${items.length === 0
          ? html`<div class="empty">Chưa có mục nào.</div>`
          : raw(
              items
                .map(
                  (item, index) => `
              <div class="repeat-item">
                <div class="repeat-item__head">
                  <span class="repeat-item__title">${esc(itemTitle(field, item, index))}</span>
                  <div class="repeat-item__tools">
                    <button class="btn btn--sm btn--icon" type="button" title="Lên"
                      data-action="repeat-move" data-repeat="${esc(path)}" data-index="${index}" data-dir="-1">&uarr;</button>
                    <button class="btn btn--sm btn--icon" type="button" title="Xuống"
                      data-action="repeat-move" data-repeat="${esc(path)}" data-index="${index}" data-dir="1">&darr;</button>
                    <button class="btn btn--sm btn--danger" type="button"
                      data-action="repeat-remove" data-repeat="${esc(path)}" data-index="${index}">Xóa</button>
                  </div>
                </div>
                <div class="fields ${field.columns === 2 ? 'fields--2' : field.columns === 3 ? 'fields--3' : ''}">
                  ${renderFields(field.fields, model, `${path}.${index}`)}
                </div>
              </div>`,
                )
                .join(''),
            )}
      </div>
    </div>
  `;
}

const itemTitle = (field, item, index) => {
  if (typeof field.itemLabel === 'function') return field.itemLabel(item, index);
  if (field.itemLabelKey && item?.[field.itemLabelKey]) return item[field.itemLabelKey];
  return `Mục ${index + 1}`;
};

const normalizeOptions = (options = []) =>
  options.map((opt) => (typeof opt === 'object' ? opt : { value: opt, label: opt }));

/* ======================= BIND ======================= */

/**
 * Gan su kien cho form da render.
 *
 * QUAN TRONG: tham so thu hai la HAM tra ve model hien tai, khong phai chinh model.
 * Man hinh chinh sua thay the object model sau moi lan Luu / Hoan tac; neu o day giu
 * cung mot tham chieu thi tu lan luu thu hai tro di moi thay doi se roi vao object cu
 * da bi bo, con object dang hien thi thi khong doi gi -> bam Luu nhu khong bam.
 *
 * @param {HTMLElement} container
 * @param {() => object} getModel - tra ve object dang duoc chinh sua
 * @param {object} handlers       - { onChange, onRerender, pickMedia, schema }
 */
export function bindForm(container, getModel, handlers = {}) {
  const { onChange = () => {}, onRerender = () => {}, pickMedia } = handlers;

  if (typeof getModel !== 'function') {
    throw new TypeError('bindForm: tham so thu hai phai la ham tra ve model hien tai');
  }

  const readValue = (input) => {
    switch (input.dataset.type) {
      case 'toggle':
        return input.checked;
      case 'number':
        return input.value === '' ? '' : Number(input.value);
      case 'stringlist':
        return input.value
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean);
      default:
        return input.value;
    }
  };

  const handleInput = (event) => {
    const input = event.target.closest('[data-path]');
    if (!input || !container.contains(input)) return;
    setPath(getModel(), input.dataset.path, readValue(input));

    // Cap nhat anh xem truoc + ten tep ngay lap tuc
    if (input.dataset.type === 'image' || input.dataset.type === 'video') {
      updatePreview(container, input.dataset.path, input.value, input.dataset.type);
      updateFileName(container, input.dataset.path, input.value);
    }

    if (input.dataset.type === 'icon') updateIconPreview(container, input.dataset.path, input.value);

    onChange(input.dataset.path);
  };

  container.addEventListener('input', handleInput);
  container.addEventListener('change', handleInput);

  container.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-action]');
    if (!button || !container.contains(button)) return;
    const { action } = button.dataset;

    if (action === 'repeat-add') {
      const path = button.dataset.repeat;
      const model = getModel();
      const list = getPath(model, path) ?? [];
      const template = findRepeaterDefaults(handlers.schema, path);
      list.push({ id: uid('it'), ...clone(template ?? {}) });
      setPath(model, path, list);
      onChange(path);
      onRerender();
      return;
    }

    if (action === 'repeat-remove') {
      if (!window.confirm('Xóa mục này?')) return;
      const path = button.dataset.repeat;
      const list = getPath(getModel(), path) ?? [];
      list.splice(Number(button.dataset.index), 1);
      onChange(path);
      onRerender();
      return;
    }

    if (action === 'repeat-move') {
      const path = button.dataset.repeat;
      const list = getPath(getModel(), path) ?? [];
      const from = Number(button.dataset.index);
      const to = from + Number(button.dataset.dir);
      if (to < 0 || to >= list.length) return;
      [list[from], list[to]] = [list[to], list[from]];
      onChange(path);
      onRerender();
      return;
    }

    if (action === 'toggle-url') {
      const urlInput = container.querySelector(`[data-url-for="${CSS.escape(button.dataset.target)}"]`);
      if (!urlInput) return;
      urlInput.hidden = !urlInput.hidden;
      button.textContent = urlInput.hidden ? 'Dán đường dẫn' : 'Ẩn đường dẫn';
      if (!urlInput.hidden) urlInput.focus();
      return;
    }

    if (action === 'clear-media') {
      setPath(getModel(), button.dataset.target, '');
      onChange(button.dataset.target);
      onRerender();
      return;
    }

    if (action === 'pick-media' && pickMedia) {
      const url = await pickMedia(button.dataset.kind);
      if (!url) return;
      setPath(getModel(), button.dataset.target, url);
      onChange(button.dataset.target);
      onRerender();
    }
  });
}

function updatePreview(container, path, value, type) {
  const preview = container.querySelector(`[data-preview-for="${CSS.escape(path)}"]`);
  if (!preview) return;
  preview.innerHTML = value
    ? type === 'video'
      ? `<video src="${esc(value)}" muted></video>`
      : `<img src="${esc(value)}" alt="" />`
    : 'Trống';
}

/** Đổi hình xem trước ngay khi chọn biểu tượng khác, khỏi phải lưu rồi mới thấy. */
function updateIconPreview(container, path, value) {
  const node = container.querySelector(`[data-icon-preview-for="${CSS.escape(path)}"]`);
  if (node) node.innerHTML = renderIcon(String(value ?? ''), 20);
}

/** Đồng bộ dòng tên tệp khi người dùng tự gõ đường dẫn. */
function updateFileName(container, path, value) {
  const node = container.querySelector(`[data-name-for="${CSS.escape(path)}"]`);
  if (!node) return;
  node.title = value ?? '';
  node.innerHTML = value
    ? `<span class="image-field__file">${esc(fileName(value))}</span>${
        isExternalUrl(value) ? '<span class="tag" style="margin-left:6px">liên kết ngoài</span>' : ''
      }`
    : '<span class="image-field__empty">Chưa chọn tệp</span>';
}

/** Tim `defaults` cua repeater theo path de tao item moi. */
function findRepeaterDefaults(schema = [], path) {
  const leaf = String(path).split('.').pop();
  const walk = (fields) => {
    for (const field of fields ?? []) {
      if (field.type === 'repeater' && (field.path === path || field.path === leaf)) return field.defaults ?? {};
      if (field.fields) {
        const found = walk(field.fields);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(schema);
}
