/**
 * gallery.js - khối "Hình ảnh thực tế": slideshow ảnh thi công.
 *
 * Khác với hero (ảnh nền toàn màn hình), khối này là một khung ảnh có tỉ lệ cố định,
 * kèm chú thích, nút trái/phải, dải ảnh nhỏ và số thứ tự. Toàn bộ do CMS cấu hình.
 */

import { html, raw, render, qs, qsa, safeUrl } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { placeholder } from '../core/store.js';
import { prefersReducedMotion } from '../core/motion.js';

export function renderGallery(root, state) {
  const gallery = state.home?.gallery;
  const items = (gallery?.items ?? []).filter((item) => item.enabled !== false && item.image);

  if (!gallery?.enabled || !items.length) {
    root.innerHTML = '';
    root.hidden = true;
    return;
  }
  root.hidden = false;

  const showThumbs = gallery.showThumbs !== false && items.length > 1;
  const showCaption = gallery.showCaption !== false;

  render(
    root,
    html`
      <section class="section section--soft" id="${gallery.anchor || 'hinh-anh'}">
        <div class="container">
          <div class="section__head" data-reveal>
            ${gallery.eyebrow ? html`<p class="t-eyebrow">${gallery.eyebrow}</p>` : ''}
            <h2 class="t-h2">${gallery.title}</h2>
            ${gallery.subtitle ? html`<p class="t-lead">${gallery.subtitle}</p>` : ''}
          </div>

          <div class="gallery" data-gallery data-reveal>
            <div class="gallery__stage" tabindex="0" aria-roledescription="carousel" aria-label="${gallery.title}">
              ${items.map(
                (item, index) => html`
                  <figure
                    class="gallery__slide ${index === 0 ? 'is-active' : ''}"
                    data-slide="${index}"
                    aria-hidden="${index === 0 ? 'false' : 'true'}"
                  >
                    <img
                      src="${safeUrl(item.image) || placeholder()}"
                      alt="${item.caption || gallery.title}"
                      ${raw(index === 0 ? '' : 'loading="lazy"')}
                    />
                    ${showCaption && item.caption
                      ? html`<figcaption class="gallery__caption">${item.caption}</figcaption>`
                      : ''}
                  </figure>
                `,
              )}

              ${items.length > 1
                ? html`
                    <button class="gallery__nav gallery__nav--prev" type="button" data-prev aria-label="Ảnh trước">
                      ${raw(icon('arrow', 22))}
                    </button>
                    <button class="gallery__nav gallery__nav--next" type="button" data-next aria-label="Ảnh tiếp theo">
                      ${raw(icon('arrow', 22))}
                    </button>
                    <div class="gallery__counter" aria-hidden="true">
                      <span data-current>1</span> / ${items.length}
                    </div>
                  `
                : ''}
            </div>

            ${showThumbs
              ? html`
                  <div class="gallery__thumbs" role="tablist" aria-label="Chọn ảnh">
                    ${items.map(
                      (item, index) => html`
                        <button
                          class="gallery__thumb ${index === 0 ? 'is-active' : ''}"
                          type="button"
                          role="tab"
                          aria-selected="${index === 0}"
                          data-goto="${index}"
                          title="${item.caption || `Ảnh ${index + 1}`}"
                        >
                          <img src="${safeUrl(item.image) || placeholder()}" alt="" loading="lazy" />
                        </button>
                      `,
                    )}
                  </div>
                `
              : ''}
          </div>
        </div>
      </section>
    `,
  );

  initGallery(root, items.length, gallery);
}

function initGallery(root, total, config) {
  if (total < 2) return;

  const stage = qs('.gallery__stage', root);
  if (!stage) return; // markup chưa sẵn sàng - không để cả trang chết vì một khối

  const slides = qsa('[data-slide]', root);
  const thumbs = qsa('[data-goto]', root);
  const counter = qs('[data-current]', root);
  const thumbTrack = qs('.gallery__thumbs', root);

  let index = 0;
  let timer = null;

  /**
   * Kéo dải ảnh nhỏ theo chiều NGANG, bên trong chính nó.
   *
   * KHÔNG dùng thumb.scrollIntoView(): hàm đó cuộn MỌI khung cha - kể cả cả
   * trang - nên mỗi lần slideshow tự đổi ảnh là trang bị giật về khối này,
   * dù người xem đang đọc phần khác. scrollBy() trên một phần tử thì chỉ
   * cuộn đúng phần tử đó.
   */
  const keepThumbVisible = (thumb) => {
    if (!thumbTrack || !thumb) return;
    if (thumbTrack.scrollWidth <= thumbTrack.clientWidth) return; // đủ chỗ, không cần kéo

    const track = thumbTrack.getBoundingClientRect();
    const box = thumb.getBoundingClientRect();
    const pad = 12; // chừa mép để thấy được là còn ảnh phía sau

    let delta = 0;
    if (box.left < track.left + pad) delta = box.left - track.left - pad;
    else if (box.right > track.right - pad) delta = box.right - track.right + pad;
    if (!delta) return;

    thumbTrack.scrollBy({ left: delta, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const paint = (next) => {
    index = (next + total) % total;

    slides.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });

    thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-selected', String(active));
      if (active) keepThumbVisible(thumb);
    });

    if (counter) counter.textContent = String(index + 1);
  };

  /* --- Tự chạy --- */
  const stop = () => {
    if (timer) window.clearInterval(timer);
    timer = null;
  };

  const play = () => {
    stop();
    if (config.autoplay === false || prefersReducedMotion()) return;
    timer = window.setInterval(() => paint(index + 1), Number(config.intervalMs) || 5000);
  };

  qs('[data-prev]', root)?.addEventListener('click', () => {
    paint(index - 1);
    play();
  });
  qs('[data-next]', root)?.addEventListener('click', () => {
    paint(index + 1);
    play();
  });
  thumbs.forEach((thumb) =>
    thumb.addEventListener('click', () => {
      paint(Number(thumb.dataset.goto));
      play();
    }),
  );

  // Rê chuột vào thì dừng để người xem kịp nhìn
  stage.addEventListener('mouseenter', stop);
  stage.addEventListener('mouseleave', play);
  stage.addEventListener('focusin', stop);
  stage.addEventListener('focusout', play);

  // Bàn phím: chỉ khi khung ảnh đang được chọn, không cướp phím của cả trang
  stage.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      paint(index - 1);
      play();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      paint(index + 1);
      play();
    }
  });

  // Vuốt trên điện thoại
  let startX = 0;
  stage.addEventListener('touchstart', (event) => (startX = event.touches[0].clientX), { passive: true });
  stage.addEventListener(
    'touchend',
    (event) => {
      const delta = event.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 48) {
        paint(index + (delta < 0 ? 1 : -1));
        play();
      }
    },
    { passive: true },
  );

  play();
}
