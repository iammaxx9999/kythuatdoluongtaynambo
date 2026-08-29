/**
 * contact.js - thong tin lien he, form bao gia va ban do Google Maps nhung san.
 */

import { html, raw, render, qs, toast, esc, httpsUrl } from '../core/dom.js';
import { icon, iconOrImage } from '../core/icons.js';
import { buildDirectory } from '../core/directory.js';
import { messageApi, ApiError } from '../core/api.js';
import { sanitizePhone } from './sections.js';
import { t } from '../core/store.js';

export function renderContact(root, state) {
  const contact = state.contact ?? {};

  render(
    root,
    html`
      <div class="container">
        <div class="section__head" data-reveal>
          <p class="t-eyebrow">${contact.eyebrow}</p>
          <h2 class="t-h2">${contact.title}</h2>
          ${contact.subtitle ? html`<p class="t-lead">${contact.subtitle}</p>` : ''}
        </div>

        <div class="contact-grid">
          <div data-reveal>${raw(infoBlock(contact))}</div>
          <div data-reveal>${raw(contact.form?.enabled === false ? '' : formBlock(contact))}</div>
        </div>

        ${contact.map?.enabled === false ? '' : raw(mapBlock(contact))}
      </div>
    `,
  );

  initForm(root, contact);
}

/* ------------------- Thong tin lien he ------------------- */
function infoBlock(contact) {
  /**
   * Icon cua tung dong thong tin, do CMS cau hinh.
   * `<ten>` = icon co san, `<ten>Image` = anh rieng tai len (co thi thay the).
   * Bo trong thi ve icon mac dinh -> ban cai cu khong co khoa nay van hien dung.
   */
  const icons = contact.icons ?? {};

  /**
   * Dong co ban (Dien thoai / Hotline / Email) lay tu cac o co dinh.
   * Tat trong CMS khi da khai du trong Danh ba, de khoi hien trung hai lan.
   * Dia chi va gio lam viec khong nam trong nhom nay - chung luon hien.
   */
  const showBasic = contact.showBasicRows !== false;

  const rows = [
    contact.address && {
      icon: icons.address || 'pin',
      iconImage: icons.addressImage,
      label: contact.addressNote || t('contactAddress', 'Địa chỉ'),
      value: contact.address,
    },
    showBasic && contact.phone && {
      icon: icons.phone || 'phone',
      iconImage: icons.phoneImage,
      label: t('contactPhone', 'Điện thoại'),
      value: `<a href="tel:${esc(sanitizePhone(contact.phone))}">${esc(contact.phone)}</a>${
        contact.hotline
          ? ` &nbsp;·&nbsp; <a href="tel:${esc(sanitizePhone(contact.hotline))}">${esc(contact.hotline)}</a>`
          : ''
      }`,
      isHtml: true,
    },
    showBasic && contact.email && {
      icon: icons.email || 'mail',
      iconImage: icons.emailImage,
      label: t('contactEmail', 'Email'),
      value: `<a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a>`,
      isHtml: true,
    },
    /**
     * Danh ba: moi dong ghi ro AI phu trach so nao.
     * Dat TRUOC gio lam viec de nguoi can goi thay ngay, khong phai luot qua.
     */
    ...buildDirectory(contact.directory).map((entry) => ({
      icon: entry.icon,
      iconImage: entry.iconImage,
      label: entry.label,
      person: entry.person,
      value: entry.href
        ? `<a href="${esc(entry.href)}"${
            entry.external ? ' target="_blank" rel="noopener noreferrer"' : ''
          }>${esc(entry.value)}</a>`
        : esc(entry.value),
      isHtml: true,
    })),

    contact.workingHours && {
      icon: icons.hours || 'clock',
      iconImage: icons.hoursImage,
      label: t('contactHours', 'Giờ làm việc'),
      value: contact.workingHours,
    },
  ].filter(Boolean);

  return html`
    <div class="card__title" style="font-size:1.1rem;margin-bottom:6px">${contact.companyName}</div>
    <div class="info-list">
      ${rows.map(
        (row) => html`
          <div class="info-item">
            <span class="info-item__icon">${raw(iconOrImage(row.icon, row.iconImage, 20))}</span>
            <div>
              <div class="info-item__label">
                ${row.label}${row.person ? html`<span class="info-item__person">${row.person}</span>` : ''}
              </div>
              <div class="info-item__value">${row.isHtml ? raw(row.value) : row.value}</div>
            </div>
          </div>
        `,
      )}
    </div>

    ${contact.branches?.length
      ? html`
          <div class="branch-list">
            ${contact.branches.map(
              (branch) => html`
                <div class="branch">
                  <div class="branch__name">${branch.name}</div>
                  <div class="branch__meta">${branch.address}</div>
                  ${branch.phone
                    ? html`<div class="branch__meta">
                        <a href="tel:${sanitizePhone(branch.phone)}">${branch.phone}</a>
                      </div>`
                    : ''}
                </div>
              `,
            )}
          </div>
        `
      : ''}
  `;
}

/* ------------------------- Form ------------------------- */
function formBlock(contact) {
  const form = contact.form ?? {};
  return html`
    <div class="form-card">
      <h3 class="t-h3" style="margin-bottom:18px">${form.title || t('formSubmit', 'Gửi yêu cầu')}</h3>
      <form class="form-grid" data-contact-form novalidate>
        <div class="field">
          <label class="field__label" for="cf-name">${t('formName', 'Họ và tên')} <span class="req">*</span></label>
          <input class="field__control" id="cf-name" name="name" autocomplete="name" required />
          <span class="field__error" data-error="name"></span>
        </div>
        <div class="field">
          <label class="field__label" for="cf-phone">${t('formPhone', 'Số điện thoại')} <span class="req">*</span></label>
          <input class="field__control" id="cf-phone" name="phone" inputmode="tel" autocomplete="tel" required />
          <span class="field__error" data-error="phone"></span>
        </div>
        <div class="field">
          <label class="field__label" for="cf-email">${t('formEmail', 'Email')}</label>
          <input class="field__control" id="cf-email" name="email" type="email" autocomplete="email" />
          <span class="field__error" data-error="email"></span>
        </div>
        <div class="field">
          <label class="field__label" for="cf-company">${t('formCompany', 'Công ty')}</label>
          <input class="field__control" id="cf-company" name="company" autocomplete="organization" />
          <span class="field__error" data-error="company"></span>
        </div>
        <div class="field field--full">
          <label class="field__label" for="cf-subject">${t('formSubject', 'Nhu cầu')}</label>
          <select class="field__control" id="cf-subject" name="subject">
            ${(form.subjects ?? ['Khác']).map((subject) => html`<option value="${subject}">${subject}</option>`)}
          </select>
        </div>
        <div class="field field--full">
          <label class="field__label" for="cf-content">${t('formContent', 'Nội dung')} <span class="req">*</span></label>
          <textarea
            class="field__control"
            id="cf-content"
            name="content"
            placeholder="${t('formContentPlaceholder', 'Mô tả nhu cầu của bạn…')}"
            required
          ></textarea>
          <span class="field__error" data-error="content"></span>
        </div>
        <div class="field field--full">
          <button class="btn btn--primary btn--lg btn--block" type="submit" data-submit>${t('formSubmit', 'Gửi yêu cầu')}</button>
          <p class="form-note">${t('formNote', '')}</p>
        </div>
      </form>
    </div>
  `;
}

function initForm(root, contact) {
  const form = qs('[data-contact-form]', root);
  if (!form) return;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors(form);

    const payload = Object.fromEntries(new FormData(form).entries());
    const localErrors = validate(payload);

    if (Object.keys(localErrors).length) {
      showErrors(form, localErrors);
      return;
    }

    const button = qs('[data-submit]', form);
    button.disabled = true;
    button.textContent = t('formSubmitting', 'Đang gửi…');

    try {
      await messageApi.send(payload);
      form.closest('.form-card').innerHTML = successMarkup(contact.form?.successMessage);
    } catch (error) {
      if (error instanceof ApiError && error.details) {
        showErrors(form, error.details);
      } else {
        toast(error.message || t('formError', 'Không gửi được, vui lòng thử lại'), 'error');
      }
      button.disabled = false;
      button.textContent = t('formSubmit', 'Gửi yêu cầu');
    }
  });
}

const validate = (payload) => {
  const errors = {};
  if (!payload.name?.trim()) errors.name = 'Vui lòng nhập họ tên';
  if (!payload.phone?.trim()) errors.phone = 'Vui lòng nhập số điện thoại';
  else if (!/^[0-9+()\s.-]{8,20}$/.test(payload.phone.trim())) errors.phone = 'Số điện thoại không hợp lệ';
  if (payload.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(payload.email.trim()))
    errors.email = 'Email không hợp lệ';
  if (!payload.content?.trim()) errors.content = 'Vui lòng nhập nội dung';
  return errors;
};

const clearErrors = (form) => {
  form.querySelectorAll('.field').forEach((field) => field.classList.remove('has-error'));
  form.querySelectorAll('[data-error]').forEach((node) => (node.textContent = ''));
};

const showErrors = (form, errors) => {
  Object.entries(errors).forEach(([key, message]) => {
    const node = form.querySelector(`[data-error="${key}"]`);
    if (!node) return;
    node.textContent = message;
    node.closest('.field')?.classList.add('has-error');
  });
  form.querySelector('.has-error .field__control')?.focus();
};

const successMarkup = (message) => html`
  <div class="form-success">
    <span class="form-success__icon">${raw(icon('check', 26))}</span>
    <h3 class="t-h3">${t('formSuccessTitle', 'Đã nhận yêu cầu')}</h3>
    <p class="t-muted">${message || 'Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.'}</p>
  </div>
`;

/* ------------------------- Map ------------------------- */
function mapBlock(contact) {
  const map = contact.map ?? {};
  // URL nhung phai la https. Ma nhung tu CMS khong hop le -> quay ve ban do sinh tu dia chi.
  const generated = `https://www.google.com/maps?q=${encodeURIComponent(
    map.query || contact.address || '',
  )}&z=${Number(map.zoom) || 16}&hl=vi&output=embed`;
  const src = (map.mode === 'embed' && httpsUrl(map.embedUrl)) || generated;

  const directionUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    map.query || contact.address || '',
  )}`;
  const height = Math.min(Math.max(Number(map.height) || 440, 200), 900);

  return html`
    <div class="map-wrap" data-reveal>
      <iframe
        title="Bản đồ ${contact.companyName || ''}"
        src="${src}"
        height="${height}"
        style="height:${height}px"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      ></iframe>
      <div class="map-bar">
        <span>${raw(icon('pin', 16))} ${contact.address || ''}</span>
        <a class="link-arrow" href="${directionUrl}" target="_blank" rel="noopener noreferrer">${t('mapDirections', 'Chỉ đường')}</a>
      </div>
    </div>
  `;
}
