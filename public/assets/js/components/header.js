/**
 * header.js - header dinh, dieu huong cuon muot + highlight section dang xem.
 */

import { html, raw, render, qs, qsa, delegate, esc, safeUrl } from '../core/dom.js';
import { navAction } from '../core/links.js';
import { t } from '../core/store.js';
import { smoothScrollTo, initScrollProgress } from '../core/motion.js';

const HEADER_OFFSET = 64;

export function renderHeader(root, state) {
  const { settings } = state;
  const navItems = (settings.nav ?? []).filter((item) => item.enabled !== false);
  const cta = settings.headerCta ?? {};

  render(
    root,
    html`
      <div class="container site-header__inner">
        ${raw(
          navAction({
            target: '#trang-chu',
            className: 'site-header__brand',
            attrs: `aria-label="${esc(settings.siteName ?? '')}"`,
            inner: settings.logo
              ? `<img class="site-header__logo" src="${esc(safeUrl(settings.logo))}" alt="${esc(
                  settings.logoAlt || settings.siteName || '',
                )}" />`
              : `<span class="site-header__brand-text">${esc(settings.siteName ?? '')}</span>`,
          }),
        )}

        <nav class="site-nav" id="primary-nav" aria-label="${t('navAria', 'Điều hướng chính')}">
          <ul class="site-nav__list">
            ${navItems.map(
              (item) => html`
                <li>
                  ${raw(
                    navAction({
                      target: item.target,
                      label: item.label,
                      className: 'site-nav__link',
                      attrs: `data-nav-target="${esc(item.target ?? '')}"`,
                    }),
                  )}
                </li>
              `,
            )}
          </ul>
        </nav>

        <div class="site-header__actions">
          ${cta.enabled !== false && cta.label
            ? raw(
                navAction({
                  target: cta.target || '#lien-he',
                  label: cta.label,
                  className: 'btn btn--primary btn--sm',
                }),
              )
            : ''}
          <button
            class="site-header__burger"
            type="button"
            aria-label="${t('menuOpen', 'Mở menu')}"
            aria-expanded="false"
            aria-controls="primary-nav"
            data-burger
          >
            <span></span>
          </button>
        </div>
      </div>

      <span class="scroll-progress" data-scroll-progress aria-hidden="true"></span>
    `,
  );

  initHeaderBehaviour(root);
  initScrollProgress(qs('[data-scroll-progress]', root));
}

// Listener gan vao document/window phai song sot qua nhieu lan render,
// nhung KHONG duoc nhan ban len. Dung co de chi gan dung mot lan.
let globalBound = false;

function initHeaderBehaviour(root) {
  const burger = qs('[data-burger]', root);

  const closeMenu = () => {
    root.classList.remove('is-menu-open');
    burger?.setAttribute('aria-expanded', 'false');
  };

  burger?.addEventListener('click', () => {
    const open = root.classList.toggle('is-menu-open');
    burger.setAttribute('aria-expanded', String(open));
  });

  if (globalBound) return;
  globalBound = true;

  /**
   * Cuon muot toi khu vuc, tru chieu cao header.
   *
   * Doc id tu data-scroll-to chu khong tu href: cac muc dieu huong trong trang
   * la <button> khong co href, de thanh dia chi khong doi va re chuot khong
   * hien duong dan o goc man hinh.
   *
   * CO Y khong goi history.replaceState: goi la thanh dia chi hien ngay
   * tenmien.com/#san-pham, dung thu ma minh vua tranh.
   */
  delegate(document, 'click', '[data-scroll-to]', (event, button) => {
    const id = button.dataset.scrollTo;
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;

    event.preventDefault();
    document.querySelector('#site-header')?.classList.remove('is-menu-open');
    scrollToSection(target);
  });

  // Doi trang thai header khi cuon - gop vao 1 khung hinh de khong giat
  let scrollFrame = null;
  const onScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = null;
      root.classList.toggle('is-scrolled', window.scrollY > 8);
    });
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.querySelector('#site-header')?.classList.remove('is-menu-open');
  });
}

export function scrollToSection(target) {
  const headerHeight =
    Number.parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h'), 10) ||
    HEADER_OFFSET;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight + 1;

  // Chuyen tieu diem ban phim sau khi cuon xong de khong lam giat man hinh
  smoothScrollTo(top, {
    onDone: () => {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    },
  });
}

/** Highlight muc dieu huong tuong ung section dang hien thi. */
export function initScrollSpy(root) {
  const links = qsa('[data-nav-target]', root);
  if (!links.length) return;

  const sections = links
    .map((link) => document.querySelector(link.dataset.navTarget))
    .filter(Boolean);

  if (!('IntersectionObserver' in window) || !sections.length) return;

  const setActive = (id) => {
    links.forEach((link) => link.classList.toggle('is-active', link.dataset.navTarget === `#${id}`));
  };

  const visible = new Map();
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => visible.set(entry.target.id, entry.intersectionRatio));
      const best = [...visible.entries()]
        .filter(([, ratio]) => ratio > 0)
        .sort((a, b) => b[1] - a[1])[0];
      if (best) setActive(best[0]);
    },
    { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.15, 0.4, 0.75, 1] },
  );

  sections.forEach((section) => observer.observe(section));
}
