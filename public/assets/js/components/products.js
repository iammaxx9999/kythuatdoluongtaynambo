/**
 * products.js - danh sach san pham + bo loc theo danh muc + modal chi tiet.
 */

import { html, raw, render, qs, qsa, delegate, lockScroll, safeUrl } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { navAction } from '../core/links.js';
import { t, placeholder } from '../core/store.js';
import { animateFilter, initImageFade, prefersReducedMotion } from '../core/motion.js';



export function renderProducts(root, state) {
  const section = state.productsSection ?? {};
  const products = state.products ?? [];
  const categories = section.categories ?? [];

  render(
    root,
    html`
      <div class="container">
        <div class="section__head" data-reveal>
          <p class="t-eyebrow">${section.eyebrow}</p>
          <h2 class="t-h2">${section.title}</h2>
          ${section.subtitle ? html`<p class="t-lead">${section.subtitle}</p>` : ''}
        </div>

        ${section.showFilter !== false && categories.length
          ? html`
              <div class="filter-bar" role="tablist" aria-label="${t('productFilterAria', 'Lọc theo danh mục')}">
                ${categories.map(
                  (cat, index) => html`
                    <button
                      class="filter-chip ${index === 0 ? 'is-active' : ''}"
                      type="button"
                      role="tab"
                      aria-selected="${index === 0}"
                      data-filter="${cat.slug}"
                    >
                      ${cat.name}
                    </button>
                  `,
                )}
              </div>
            `
          : ''}

        <div class="product-grid" data-product-grid>
          ${products.map((product) => productCard(product))}
        </div>

        <div class="empty-state" data-empty hidden>${t('productEmpty', 'Chưa có sản phẩm trong danh mục này.')}</div>
      </div>
    `,
  );

  initFilter(root, state);
  initModal(root, state);
  initImageFade(root);
}

function productCard(product) {
  return html`
    <button class="product-card" type="button" data-product="${product.id}" data-category="${product.category}">
      <div class="product-card__media">
        <img src="${safeUrl(product.image) || placeholder()}" alt="${product.name}" loading="lazy" />
        ${product.badge ? html`<span class="product-card__badge">${product.badge}</span>` : ''}
      </div>
      <div class="product-card__body">
        <span class="product-card__cat">${product.category?.replace(/-/g, ' ') ?? ''}</span>
        <h3 class="product-card__name">${product.name}</h3>
        <p class="product-card__desc">${product.shortDescription}</p>
        <div class="product-card__foot">
          <span class="product-card__price">${product.price || 'Liên hệ'}</span>
          <span class="link-arrow">${t('productDetail', 'Chi tiết')}</span>
        </div>
      </div>
    </button>
  `;
}

function initFilter(root, state) {
  const chips = qsa('[data-filter]', root);
  const cards = qsa('[data-product]', root);
  const grid = qs('[data-product-grid]', root);
  const empty = qs('[data-empty]', root);
  if (!chips.length) return;

  const allSlug = state.productsSection?.categories?.[0]?.slug ?? 'tat-ca';

  chips.forEach((chip) =>
    chip.addEventListener('click', () => {
      const slug = chip.dataset.filter;
      chips.forEach((item) => {
        const active = item === chip;
        item.classList.toggle('is-active', active);
        item.setAttribute('aria-selected', String(active));
      });

      const matches = (card) => slug === allSlug || card.dataset.category === slug;
      animateFilter(grid, cards, matches);

      const visible = cards.filter(matches).length;
      if (empty) empty.hidden = visible > 0;
    }),
  );
}

/* --------------------- Modal chi tiet --------------------- */
// Phim Esc gan vao document mot lan duy nhat, tro toi ham dong moi nhat
let escBound = false;
let closeRef = null;

function initModal(root, state) {
  const modal = qs('#product-modal');
  if (!modal) return;

  let lastTrigger = null;

  const close = () => {
    const finish = () => {
      modal.hidden = true;
      modal.innerHTML = '';
      modal.classList.remove('is-closing');
      lockScroll(false);
      lastTrigger?.focus({ preventScroll: true });
      lastTrigger = null;
    };

    if (prefersReducedMotion()) return finish();

    // Cho hoat hinh dong chay xong roi moi go khoi DOM
    modal.classList.add('is-closing');
    window.setTimeout(finish, 210);
  };

  delegate(root, 'click', '[data-product]', (_event, card) => {
    const product = (state.products ?? []).find((item) => item.id === card.dataset.product);
    if (!product) return;

    lastTrigger = card;
    modal.classList.remove('is-closing');
    modal.innerHTML = modalMarkup(product);
    modal.hidden = false;
    lockScroll(true);
    initImageFade(modal);
    qs('.modal__close', modal)?.focus({ preventScroll: true });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('[data-close-modal]') || event.target.classList.contains('modal__backdrop')) {
      close();
    }
    const thumb = event.target.closest('[data-thumb]');
    if (thumb) {
      const main = qs('[data-modal-image]', modal);
      if (main) main.src = thumb.dataset.thumb;
    }
  });

  if (!escBound) {
    escBound = true;
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !modal.hidden) closeRef?.();
    });
  }
  closeRef = close;
}

function modalMarkup(product) {
  const gallery = [product.image, ...(product.gallery ?? [])].filter(Boolean);

  return html`
    <div class="modal__backdrop" data-close-modal></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-label="${product.name}">
      <button class="modal__close" type="button" data-close-modal aria-label="${t('modalClose', 'Đóng')}">
        ${raw(icon('close', 18))}
      </button>
      <div class="modal__grid">
        <div class="modal__media">
          <div>
            <img data-modal-image src="${safeUrl(product.image) || placeholder()}" alt="${product.name}" />
            ${gallery.length > 1
              ? html`<div class="gallery-strip">
                  ${gallery.map((src) => html`<img src="${safeUrl(src)}" alt="" data-thumb="${safeUrl(src)}" />`)}
                </div>`
              : ''}
          </div>
        </div>
        <div class="modal__body">
          ${product.badge ? html`<p class="t-eyebrow">${product.badge}</p>` : ''}
          <h2 class="t-h2" style="font-size:clamp(1.5rem,2.6vw,2rem)">${product.name}</h2>
          <p class="t-lead" style="margin-top:12px">${product.shortDescription}</p>
          ${product.description ? html`<p class="card__text" style="margin-top:14px">${product.description}</p>` : ''}

          ${product.specs?.length
            ? html`
                <table class="spec-table">
                  <caption class="sr-only">${t('productSpecsTitle', 'Thông số kỹ thuật')}</caption>
                  <tbody>
                    ${product.specs.map(
                      (spec) => html`<tr>
                        <th scope="row">${spec.key}</th>
                        <td>${spec.value}</td>
                      </tr>`,
                    )}
                  </tbody>
                </table>
              `
            : ''}

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:26px">
            ${raw(
              navAction({
                target: '#lien-he',
                label: t('productQuote', 'Yêu cầu báo giá'),
                className: 'btn btn--primary',
                attrs: 'data-close-modal',
              }),
            )}
            <span class="btn btn--ghost" style="pointer-events:none">${product.price || 'Liên hệ'}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
