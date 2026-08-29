/**
 * floating-contact.js - nut noi cham soc khach hang (kieu Samsung).
 * - Bong bong loi nhan hien canh nut sau vai giay.
 * - Nhan vao nut -> bung danh sach kenh: Phone, Zalo, Facebook, Email, tuy chinh.
 * Toan bo noi dung do CMS cau hinh (bat/tat, thu tu, nhan, gia tri, loi nhan).
 */

import { html, raw, render, qs, lockScroll, safeUrl } from '../core/dom.js';
import { icon, iconOrImage } from '../core/icons.js';

const CHANNEL_PRESETS = {
  phone: { icon: 'phone', label: 'Gọi điện', href: (v) => `tel:${v.replace(/[^\d+]/g, '')}` },
  zalo: {
    icon: 'zalo',
    label: 'Zalo',
    href: (v) => (v.startsWith('http') ? v : `https://zalo.me/${v.replace(/[^\d]/g, '')}`),
  },
  facebook: {
    icon: 'facebook',
    label: 'Facebook',
    href: (v) => (v.startsWith('http') ? v : `https://m.me/${v}`),
  },
  email: { icon: 'mail', label: 'Email', href: (v) => `mailto:${v}` },
  custom: { icon: 'link', label: 'Liên hệ', href: (v) => v },
};

const BUBBLE_SEEN_KEY = 'fab-bubble-seen';

let docBound = false;
let closeAll = null;

export function renderFloatingContact(root, state) {
  const config = state.floatingContact ?? {};
  const channels = (config.channels ?? []).filter((channel) => channel.enabled !== false);

  if (!config.enabled || !channels.length) {
    root.innerHTML = '';
    return;
  }

  const bubble = config.bubble ?? {};

  render(
    root,
    html`
      <div class="fab ${config.position === 'left' ? 'fab--left' : ''}" data-fab>
        ${bubble.enabled !== false && bubble.message
          ? html`
              <div class="${bubbleClass(bubble)}" data-bubble hidden>
                <p class="fab__bubble-text">${bubble.message}</p>
                ${bubble.dismissible
                  ? html`<button class="fab__bubble-close" type="button" data-bubble-close aria-label="Đóng lời nhắn">
                      ${raw(icon('close', 12))}
                    </button>`
                  : ''}
              </div>
            `
          : ''}

        <div class="fab__list" id="fab-list" role="menu" aria-label="${config.openLabel || 'Kênh liên hệ'}">
          ${channels.map((channel) => channelItem(channel, config.showLabels !== false))}
        </div>

        <button
          class="fab__toggle"
          type="button"
          data-fab-toggle
          aria-expanded="false"
          aria-controls="fab-list"
          aria-label="${config.tooltip || 'Mở kênh liên hệ'}"
          title="${config.tooltip || 'Liên hệ'}"
        >
          <span class="fab__pulse" aria-hidden="true"></span>
          ${raw(icon('chat', 24, 'icon-chat'))}${raw(icon('close', 22, 'icon-close'))}
        </button>
      </div>
    `,
  );

  initFab(root, bubble);
}

/** Danh sách class của bong bóng theo cấu hình CMS. */
const bubbleClass = (bubble) =>
  [
    'fab__bubble',
    bubble.style === 'solid' ? 'fab__bubble--solid' : 'fab__bubble--glass',
    bubble.dismissible ? '' : 'fab__bubble--bare',
  ]
    .filter(Boolean)
    .join(' ');

function channelItem(channel, showLabel) {
  const preset = CHANNEL_PRESETS[channel.type] ?? CHANNEL_PRESETS.custom;
  const href = safeUrl(preset.href(String(channel.value ?? '')));
  const label = channel.label || preset.label;
  const isExternal = href.startsWith('http');

  return html`
    <div class="fab__item">
      ${showLabel ? html`<span class="fab__label">${channel.display || label}</span>` : ''}
      <a
        class="fab__btn fab__btn--${channel.type}"
        href="${href || '#'}"
        role="menuitem"
        aria-label="${label}"
        ${raw(isExternal ? 'target="_blank" rel="noopener noreferrer"' : '')}
      >
        ${raw(iconOrImage(channel.icon || preset.icon, channel.iconImage, 22))}
      </a>
    </div>
  `;
}

function initFab(root, bubbleConfig = {}) {
  const fab = qs('[data-fab]', root);
  const toggle = qs('[data-fab-toggle]', root);
  const bubble = qs('[data-bubble]', root);
  if (!fab || !toggle) return;

  /**
   * Ba che do hien thi bong bong:
   *  - always   : luon hien, chi tam an khi danh sach kenh bung ra
   *  - autohide : hien roi tu an sau autoHideMs
   *  - once     : chi hien mot lan moi phien trinh duyet
   */
  const mode = bubbleConfig.display ?? 'always';
  const remembers = mode === 'once';
  let autoHideTimer = null;

  const seenBefore = () => {
    if (!remembers) return false;
    try {
      return sessionStorage.getItem(BUBBLE_SEEN_KEY) === '1';
    } catch {
      return false; // trinh duyet chan storage
    }
  };

  const markSeen = () => {
    if (!remembers) return;
    try {
      sessionStorage.setItem(BUBBLE_SEEN_KEY, '1');
    } catch {
      /* bo qua */
    }
  };

  const showBubble = () => {
    if (!bubble || fab.classList.contains('is-open') || seenBefore()) return;
    bubble.hidden = false;
    // Buoc trinh duyet ve xong khung hinh truoc khi chay hieu ung hien ra
    requestAnimationFrame(() => fab.classList.add('has-bubble'));

    window.clearTimeout(autoHideTimer);
    const autoHide = Number(bubbleConfig.autoHideMs) || 0;
    if (mode === 'autohide' && autoHide > 0) {
      autoHideTimer = window.setTimeout(() => hideBubble({ permanent: true }), autoHide);
    }
  };

  /**
   * @param {object} options
   * @param {boolean} options.permanent  true = an han (nguoi dung dong, hoac het gio tu an).
   *                                     false = chi an tam, se hien lai khi dong danh sach kenh.
   */
  const hideBubble = ({ permanent = false } = {}) => {
    if (!bubble) return;
    window.clearTimeout(autoHideTimer);
    fab.classList.remove('has-bubble');
    window.setTimeout(() => {
      if (!fab.classList.contains('has-bubble')) bubble.hidden = true;
    }, 300);
    if (permanent) {
      bubble.dataset.dismissed = '1';
      markSeen();
    }
  };

  if (bubble) {
    window.setTimeout(showBubble, Number(bubbleConfig.delayMs) || 1200);

    qs('[data-bubble-close]', root)?.addEventListener('click', (event) => {
      event.stopPropagation();
      hideBubble({ permanent: true });
    });

    // Bam vao bong bong = mo luon danh sach kenh
    bubble.addEventListener('click', (event) => {
      if (event.target.closest('[data-bubble-close]')) return;
      setOpen(true);
    });
  }

  /* --- Danh sach kenh --- */
  function setOpen(open) {
    fab.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));

    if (open) {
      // Danh sach kenh bung len dung cho bong bong -> tam an di
      hideBubble({ permanent: mode === 'once' });
      return;
    }

    // Dong lai: che do "luon hien" thi tra bong bong ve cho cu
    if (mode === 'always' && bubble && bubble.dataset.dismissed !== '1') {
      window.setTimeout(showBubble, 220);
    }
  }

  // Gan mot lan cho ca vong doi trang, tro toi nut hien tai qua closeAll
  closeAll = () => setOpen(false);
  if (!docBound) {
    docBound = true;
    document.addEventListener('click', (event) => {
      const current = document.querySelector('[data-fab]');
      if (current && !current.contains(event.target)) closeAll?.();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeAll?.();
    });
  }

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    setOpen(!fab.classList.contains('is-open'));
  });

  fab.addEventListener('click', (event) => {
    if (event.target.closest('.fab__btn')) {
      setOpen(false);
      lockScroll(false);
    }
  });
}
