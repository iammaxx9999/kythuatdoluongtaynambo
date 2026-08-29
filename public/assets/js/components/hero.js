/**
 * hero.js - khu vuc dau trang. Ho tro 2 che do do CMS quyet dinh:
 *  - mode = 'video'     : phat video nen (giong trang chu Samsung)
 *  - mode = 'slideshow' : bang anh tu chuyen kem dot dieu huong
 */

import { html, raw, render, qs, qsa, safeUrl } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { t } from '../core/store.js';
import { swapContent, initImageFade } from '../core/motion.js';
import { navAction } from '../core/links.js';

/**
 * Hàm dọn dẹp của bản slideshow đang chạy.
 *
 * `render()` chỉ thay innerHTML, còn `root` là CÙNG một phần tử qua mọi lần vẽ.
 * Không tháo listener thì mỗi lần trang tự cập nhật nội dung sẽ chồng thêm một
 * bộ listener nữa, và những bản cũ vẫn chạy hẹn giờ rồi vẽ vào DOM đã bị bỏ —
 * trang trông như đứng hẳn.
 */
let teardown = null;

export function renderHero(root, state) {
  const hero = state.hero ?? {};
  const useVideo = hero.mode === 'video' && hero.video?.src;

  root.classList.add('hero');

  teardown?.();
  teardown = null;

  if (useVideo) {
    renderVideoHero(root, hero);
  } else {
    renderSlideshowHero(root, hero);
  }
}

/* ------------------------- Video ------------------------- */
function renderVideoHero(root, hero) {
  const v = hero.video ?? {};
  root.classList.toggle('hero--dark', v.theme === 'dark');

  render(
    root,
    html`
      <div class="hero__slides">
        <div class="hero__slide is-active">
          <video
            class="hero__video"
            ${raw(v.muted === false ? '' : 'muted')}
            ${raw(v.loop === false ? '' : 'loop')}
            ${raw(v.showControls ? 'controls' : '')}
            autoplay
            playsinline
            preload="metadata"
            poster="${safeUrl(v.poster)}"
          >
            <source src="${safeUrl(v.src)}" />
          </video>
          <div class="hero__scrim"></div>
        </div>
      </div>
      ${heroContent(v)}
    `,
  );
}

/* ----------------------- Slideshow ----------------------- */
function renderSlideshowHero(root, hero) {
  const slides = (hero.slides ?? []).filter((slide) => slide.enabled !== false);
  if (!slides.length) {
    render(root, html`<div class="container hero__inner"><p class="t-muted">${t('heroEmpty', 'Chưa có nội dung cho khu vực đầu trang.')}</p></div>`);
    return;
  }

  const interval = Number(hero.intervalMs) || 6000;
  root.style.setProperty('--slide-duration', `${interval}ms`);
  root.classList.toggle('hero--dark', slides[0].theme === 'dark');
  root.classList.toggle('hero--center', slides[0].align === 'center');

  render(
    root,
    html`
      <div class="hero__slides">
        ${slides.map(
          (slide, index) => html`
            <div class="hero__slide ${index === 0 ? 'is-active' : ''}" data-slide="${index}">
              <img
                class="hero__media"
                src="${safeUrl(slide.image)}"
                alt="${slide.title?.replace(/\n/g, ' ') || ''}"
                ${raw(index === 0 ? 'fetchpriority="high"' : 'loading="lazy"')}
              />
              <div class="hero__scrim"></div>
            </div>
          `,
        )}
      </div>

      <div class="hero__stage">${raw(heroContent(slides[0], true))}</div>

      ${slides.length > 1
        ? html`
            <div class="hero__controls">
              <div class="hero__dots" role="tablist" aria-label="Chọn slide">
                ${slides.map(
                  (slide, index) => html`
                    <button
                      class="hero__dot ${index === 0 ? 'is-active' : ''}"
                      type="button"
                      role="tab"
                      aria-selected="${index === 0}"
                      aria-label="Slide ${index + 1}: ${slide.eyebrow || slide.title || ''}"
                      data-dot="${index}"
                    ></button>
                  `,
                )}
              </div>
              <button class="hero__toggle" type="button" data-hero-toggle aria-label="${t('heroPause', 'Tạm dừng trình chiếu')}">
                ${raw(icon('pause', 14))}
              </button>
            </div>
          `
        : ''}
    `,
  );

  initImageFade(root);
  teardown = initSlideshow(root, slides, interval, hero.autoplay !== false);
}

function heroContent(slide, asString = false) {
  const markup = html`
    <div class="hero__inner">
      <div class="container">
        <div class="hero__content" data-hero-content>
          ${slide.eyebrow ? html`<p class="t-eyebrow">${slide.eyebrow}</p>` : ''}
          <h1 class="t-display hero__title">${slide.title ?? ''}</h1>
          ${slide.subtitle ? html`<p class="t-lead hero__subtitle">${slide.subtitle}</p>` : ''}
          <div class="hero__actions">
            ${slide.primaryCta?.label
              ? raw(
                  navAction({
                    target: slide.primaryCta.target || '#san-pham',
                    label: slide.primaryCta.label,
                    className: 'btn btn--primary btn--lg',
                  }),
                )
              : ''}
            ${slide.secondaryCta?.label
              ? raw(
                  navAction({
                    target: slide.secondaryCta.target || '#lien-he',
                    label: slide.secondaryCta.label,
                    className: 'btn btn--ghost btn--lg',
                  }),
                )
              : ''}
          </div>
        </div>
      </div>
    </div>
  `;
  return asString ? markup : raw(markup);
}

/**
 * Chay slideshow. Tra ve ham DON DEP - goi la thao het listener va bo hen gio.
 *
 * @returns {() => void}
 */
function initSlideshow(root, slides, interval, autoplay) {
  const slideNodes = qsa('[data-slide]', root);
  const dots = qsa('[data-dot]', root);
  const stage = qs('.hero__stage', root);
  const toggle = qs('[data-hero-toggle]', root);

  let index = 0;
  let timer = null;

  /**
   * CHI hai ly do duoc phep dung slideshow:
   *
   *  1. Nguoi dung tu bam nut Tam dung.
   *  2. Tab dang bi an (khong ai nhin, chay chi ton pin).
   *
   * CO Y khong dung khi re chuot vao, va cung khong dung khi mot nut ben trong
   * dang duoc chon. Truoc day co ca hai va deu tung lam slideshow ket vinh vien:
   * bam vao mot dau cham roi dua chuot ra la nut do VAN GIU tieu diem, nen ly do
   * "focus" khong bao gio duoc go -> anh dung han. Bo di thi khong con cua nao
   * de ket, va nut Tam dung van du de nguoi xem chu dong dung lai khi can doc.
   */
  let stoppedByUser = !autoplay;
  let tabHidden = false;

  const canRun = () => slides.length > 1 && !stoppedByUser && !tabHidden;

  const paint = (next) => {
    index = (next + slides.length) % slides.length;
    slideNodes.forEach((node, i) => node.classList.toggle('is-active', i === index));
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
      dot.setAttribute('aria-selected', String(i === index));
    });

    const slide = slides[index];
    root.classList.toggle('hero--dark', slide.theme === 'dark');
    root.classList.toggle('hero--center', slide.align === 'center');
    // Chu cu mo dan ra truoc, chu moi troi len sau -> khong bi "nhay chu"
    swapContent(stage, String(heroContent(slide, true)));
  };

  const clearTimer = () => {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  /**
   * Mot cua duy nhat quyet dinh "co dang chay hay khong".
   *
   * Dung setTimeout tu hen lai thay vi setInterval: moi lan dung/chay tiep chi
   * can goi lai ham nay, dem thoi gian bat dau lai tu dau. Voi setInterval thi
   * doi anh xong con phai nho xoa/tao lai cho khop, rat de sot.
   */
  const schedule = () => {
    clearTimer();
    // Vach tien do tren dau cham phai dung theo, khong thi no chay tiep trong
    // khi anh dung im - nguoi xem tuong trang bi loi
    root.classList.toggle('hero--paused', !canRun());
    if (!canRun()) return;
    timer = window.setTimeout(() => {
      paint(index + 1);
      schedule();
    }, interval);
  };

  /* ---------------- An tab thi nghi ---------------- */
  const onVisibility = () => {
    tabHidden = document.hidden;
    schedule();
  };
  document.addEventListener('visibilitychange', onVisibility);

  /* ---------------- Dieu khien ---------------- */
  const setStopped = (value) => {
    stoppedByUser = value;
    if (toggle) {
      toggle.innerHTML = icon(value ? 'play' : 'pause', 14);
      toggle.setAttribute(
        'aria-label',
        value ? t('heroPlay', 'Tiếp tục trình chiếu') : t('heroPause', 'Tạm dừng trình chiếu'),
      );
    }
    schedule();
  };

  const onDotClick = (event) => {
    paint(Number(event.currentTarget.dataset.dot));
    schedule(); // dem lai tu dau, khong de doi anh ngay sau khi vua bam
  };

  dots.forEach((dot) => dot.addEventListener('click', onDotClick));

  const onToggleClick = () => setStopped(!stoppedByUser);
  toggle?.addEventListener('click', onToggleClick);

  /* ---------------- Vuot tren dien thoai ---------------- */
  let startX = 0;
  const onTouchStart = (event) => {
    startX = event.touches[0].clientX;
  };
  const onTouchEnd = (event) => {
    const dx = event.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 48) {
      paint(index + (dx < 0 ? 1 : -1));
      schedule();
    }
  };

  root.addEventListener('touchstart', onTouchStart, { passive: true });
  root.addEventListener('touchend', onTouchEnd, { passive: true });

  setStopped(stoppedByUser);

  /* ---------------- Don dep ---------------- */
  return () => {
    clearTimer();
    document.removeEventListener('visibilitychange', onVisibility);
    root.removeEventListener('touchstart', onTouchStart);
    root.removeEventListener('touchend', onTouchEnd);
    dots.forEach((dot) => dot.removeEventListener('click', onDotClick));
    toggle?.removeEventListener('click', onToggleClick);
  };
}
