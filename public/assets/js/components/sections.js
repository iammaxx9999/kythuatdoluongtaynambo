/**
 * sections.js - cac khoi noi dung tinh cua trang chu:
 * stats, services, features, cta band, footer.
 * Moi ham nhan (root, state) va tu quyet dinh an/hien.
 */

import { html, raw, render, safeUrl } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { navAction } from '../core/links.js';
import { t, placeholder } from '../core/store.js';

const hide = (root) => {
  root.innerHTML = '';
  root.hidden = true;
};

/* ----------------------- Stats ----------------------- */
export function renderStats(root, state) {
  const stats = state.home?.stats;
  if (!stats?.enabled || !stats.items?.length) return hide(root);
  root.hidden = false;

  render(
    root,
    html`
      <section class="stats">
        <div class="container">
          <div class="stats__grid">
            ${stats.items.map(
              (item) => html`
                <div class="stat" data-reveal>
                  <div class="stat__value"><span data-count="${item.value}">${item.value}</span>${item.suffix ?? ''}</div>
                  <div class="stat__label">${item.label}</div>
                </div>
              `,
            )}
          </div>
        </div>
      </section>
    `,
  );
}

/* ---------------------- Services ---------------------- */
export function renderServices(root, state) {
  const services = state.home?.services;
  if (!services?.enabled || !services.items?.length) return hide(root);
  root.hidden = false;

  render(
    root,
    html`
      <section class="section" id="${services.anchor || 'dich-vu'}">
        <div class="container">
          <div class="section__head" data-reveal>
            <p class="t-eyebrow">${services.eyebrow}</p>
            <h2 class="t-h2">${services.title}</h2>
            ${services.subtitle ? html`<p class="t-lead">${services.subtitle}</p>` : ''}
          </div>
          <div class="grid grid--4">
            ${services.items.map(
              (item) => html`
                <article class="card" data-reveal>
                  <div class="card__icon">${raw(icon(item.icon || 'scale', 24))}</div>
                  <h3 class="card__title">${item.title}</h3>
                  <p class="card__text">${item.description}</p>
                </article>
              `,
            )}
          </div>
        </div>
      </section>
    `,
  );
}

/* ---------------------- Features ---------------------- */
export function renderFeatures(root, state) {
  const features = state.home?.features;
  if (!features?.enabled || !features.items?.length) return hide(root);
  root.hidden = false;

  render(
    root,
    html`
      <section class="section section--soft">
        <div class="container">
          <div class="section__head" data-reveal>
            <p class="t-eyebrow">${features.eyebrow}</p>
            <h2 class="t-h2">${features.title}</h2>
          </div>
          <div class="feature-row">
            ${features.items.map(
              (item) => html`
                <article class="feature-tile" data-reveal>
                  <div class="feature-tile__media">
                    <img src="${safeUrl(item.image) || placeholder()}" alt="${item.title}" loading="lazy" />
                  </div>
                  <div class="feature-tile__body">
                    <h3 class="t-h3">${item.title}</h3>
                    <p class="card__text">${item.description}</p>
                  </div>
                </article>
              `,
            )}
          </div>
        </div>
      </section>
    `,
  );
}

/* ---------------------- CTA band ---------------------- */
export function renderCta(root, state) {
  const cta = state.home?.cta;
  if (!cta?.enabled) return hide(root);
  root.hidden = false;

  // Tông màu quyết định nền, màu chữ và kiểu nút cho tương phản đủ đọc
  const theme = ['light', 'brand', 'dark'].includes(cta.theme) ? cta.theme : 'light';
  const buttonClass = theme === 'light' ? 'btn--primary' : 'btn--light';

  render(
    root,
    html`
      <section class="cta-band cta-band--${theme}">
        ${cta.image ? html`<img class="cta-band__bg" src="${safeUrl(cta.image)}" alt="" loading="lazy" />` : ''}
        <div class="container cta-band__inner">
          <div class="cta-band__text" data-reveal>
            <h2 class="cta-band__title">${cta.title}</h2>
            ${cta.subtitle ? html`<p class="cta-band__sub">${cta.subtitle}</p>` : ''}
          </div>
          ${raw(
            navAction({
              target: cta.buttonTarget || '#lien-he',
              label: cta.buttonLabel,
              className: `btn ${buttonClass} btn--lg`,
            }),
          )}
        </div>
      </section>
    `,
  );
}

/* ----------------------- Footer ----------------------- */
export function renderFooter(root, state) {
  const { settings, contact } = state;
  const footer = settings.footer ?? {};

  if (footer.enabled === false) {
    root.innerHTML = '';
    root.hidden = true;
    return;
  }
  root.hidden = false;

  // Tông màu quyết định nền và màu chữ; logo đảo màu khi nền tối
  const theme = footer.theme === 'light' ? 'light' : 'dark';
  root.className = `site-footer site-footer--${theme}`;

  const logo = safeUrl(footer.logo) || safeUrl(settings.logo);
  const showContact = footer.contact?.enabled !== false;
  const taxLine = footer.showTaxCode !== false && contact?.taxCode
    ? `${t('footerTaxPrefix', 'MST:')} ${contact.taxCode}`
    : '';

  render(
    root,
    html`
      <div class="container">
        <div class="site-footer__top">
          <div class="site-footer__brand">
            ${footer.showLogo !== false && logo
              ? html`<img class="site-footer__logo" src="${logo}" alt="${settings.siteName}" />`
              : html`<div class="site-footer__col-title">${settings.siteName}</div>`}

            ${footer.about ? html`<p class="site-footer__about">${footer.about}</p>` : ''}

            ${showContact
              ? html`
                  <ul class="site-footer__links" style="margin-top:18px">
                    ${footer.contact?.showPhone !== false && contact?.phone
                      ? html`<li><a href="tel:${sanitizePhone(contact.phone)}">${contact.phone}</a></li>`
                      : ''}
                    ${footer.contact?.showEmail !== false && contact?.email
                      ? html`<li><a href="mailto:${contact.email}">${contact.email}</a></li>`
                      : ''}
                    ${footer.contact?.showAddress !== false && contact?.address
                      ? html`<li>${contact.address}</li>`
                      : ''}
                  </ul>
                `
              : ''}
          </div>

          ${(footer.columns ?? []).map(
            (column) => html`
              <div>
                <div class="site-footer__col-title">${column.title}</div>
                <ul class="site-footer__links">
                  ${(column.links ?? []).map(
                    (link) => html`<li>
                      ${raw(navAction({ target: link.url, label: link.label }))}
                    </li>`,
                  )}
                </ul>
              </div>
            `,
          )}
        </div>

        <div class="site-footer__bottom">
          <div class="site-footer__legal">
            ${footer.copyright ? html`<span>${footer.copyright}</span>` : ''}
            ${taxLine ? html`<span>${taxLine}</span>` : ''}
          </div>

          <div class="site-footer__meta">
            ${(footer.bottomLinks ?? []).length
              ? html`
                  <ul class="site-footer__bottom-links">
                    ${footer.bottomLinks.map(
                      (link) => html`<li>
                        ${raw(navAction({ target: link.url, label: link.label }))}
                      </li>`,
                    )}
                  </ul>
                `
              : ''}
            ${raw(creditLine(footer.credit))}
          </div>
        </div>
      </div>
    `,
  );
}

/** Dòng ghi công đơn vị thiết kế ở đáy trang. */
function creditLine(credit) {
  if (!credit?.enabled || !credit.name) return '';

  const url = safeUrl(credit.url);
  const name = url
    ? html`<a href="${url}" target="_blank" rel="noopener noreferrer">${credit.name}</a>`
    : html`<strong>${credit.name}</strong>`;

  return html`<span class="site-footer__credit">${credit.text ? `${credit.text} ` : ''}${name}</span>`;
}

export const sanitizePhone = (value = '') => String(value).replace(/[^\d+]/g, '');
