/**
 * maintenance-page.js - dung trang "dang bao tri".
 *
 * Trang nay TU CHUA hoan toan: CSS nam thang trong the <style>, khong nap tep
 * CSS nao cua website. Ly do: dang bao tri thi rat co the ban vua doi CSS hoac
 * vua deploy do dang - trang bao tri ma cung hong theo thi kho xu.
 * Chi co logo la anh ben ngoai, va thieu no cung khong sao.
 */

import { resolveTokens, buildTokens } from '../../public/assets/js/core/tokens.js';
import { buildDirectory } from '../../public/assets/js/core/directory.js';

/**
 * Dung chung bo thay ky tu dai dien voi trinh duyet (import thang tep do, khong
 * chep lai) de {brand} / {company} / {year} trong loi nhan bao tri cho ra dung
 * ket qua nhu moi cho khac tren web.
 */

const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Chi cho phep duong dan anh vo hai. Khong hop le -> bo qua, khong ve logo. */
const safeImage = (value) => {
  const url = String(value ?? '').trim();
  if (!url) return '';
  const scheme = url.replace(/[\u0000-\u0020]/g, '').toLowerCase();
  if (/^(javascript|vbscript|file|data):/.test(scheme)) return '';
  return url;
};

/** Mau thuong hieu do CMS dat, chi nhan ma mau hex de khong chen duoc CSS la. */
const safeColor = (value, fallback) =>
  /^#[0-9a-f]{3,8}$/i.test(String(value ?? '').trim()) ? String(value).trim() : fallback;

const telHref = (value) => `tel:${String(value ?? '').replace(/[^\d+]/g, '')}`;

/**
 * Cac cach lien he, lay tu chinh muc Lien he - khong phai khai lai lan nua.
 *
 * Uu tien DANH BA (moi dong ghi ro ai phu trach so nao). Chua khai danh ba thi
 * lui ve cac o co dinh, nen ban cai cu van hien binh thuong.
 *
 * Dung chung buildDirectory() voi khoi lien he tren trang, khong chep lai logic
 * -> doi cach dung link o mot cho la ca hai noi doi theo.
 */
function contactRows(contact = {}) {
  const directory = buildDirectory(contact.directory).map((entry) => ({
    label: [entry.label, entry.person].filter(Boolean).join(' · '),
    text: entry.value,
    href: entry.href,
    external: entry.external,
  }));
  if (directory.length) return directory;

  return [
    contact.phone && { label: 'Điện thoại', text: contact.phone, href: telHref(contact.phone) },
    contact.hotline && { label: 'Hotline', text: contact.hotline, href: telHref(contact.hotline) },
    contact.email && { label: 'Email', text: contact.email, href: `mailto:${contact.email}` },
  ].filter(Boolean);
}

/**
 * @param {object} site du lieu day du (da qua resolveTokens)
 * @returns {string} HTML hoan chinh
 */
export function renderMaintenancePage(site = {}) {
  const data = resolveTokens(site, buildTokens(site.settings));
  const settings = data.settings ?? {};
  const cfg = settings.maintenance ?? {};

  const brand = safeColor(settings.themeColor, '#1428A0');
  const logo = cfg.showLogo === false ? '' : safeImage(settings.logo);
  const rows = cfg.showContact === false ? [] : contactRows(data.contact);

  const title = cfg.title || 'Website đang được bảo trì';
  const message = cfg.message || '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<!-- Bao bot dung lap chi muc trang nay; ket hop voi ma 503 thi thu hang tim kiem khong bi anh huong -->
<meta name="robots" content="noindex, nofollow" />
<title>${esc(title)}${settings.siteName ? ` · ${esc(settings.siteName)}` : ''}</title>
${settings.favicon ? `<link rel="icon" href="${esc(safeImage(settings.favicon))}" />` : ''}
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    background: #f8fafc;
    color: #0f172a;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 560px;
    background: #fff;
    border: 1px solid #e2e8f0;
    border-radius: 20px;
    padding: 48px 36px;
    text-align: center;
    box-shadow: 0 18px 48px rgba(15, 23, 42, 0.07);
  }
  .logo { max-width: 190px; max-height: 68px; object-fit: contain; margin-bottom: 26px; }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 18px;
    padding: 6px 14px;
    border-radius: 999px;
    background: ${brand}14;
    color: ${brand};
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  /* Cham nhap nhay cho biet trang con song, chi la dang duoc sua */
  .dot { width: 8px; height: 8px; border-radius: 50%; background: ${brand}; animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.35; transform: scale(0.8); } }
  @media (prefers-reduced-motion: reduce) { .dot { animation: none; } }

  h1 { margin: 0 0 14px; font-size: clamp(1.4rem, 4vw, 1.9rem); line-height: 1.25; letter-spacing: -0.02em; }
  p  { margin: 0 auto; max-width: 44ch; color: #475569; }

  .contact { margin-top: 32px; padding-top: 26px; border-top: 1px solid #e2e8f0; }
  .contact__note { font-size: 0.9rem; margin-bottom: 14px; }
  .contact__list { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .contact__item {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    padding: 9px 16px;
    border-radius: 12px;
    background: #f1f5f9;
    text-decoration: none;
    color: #0f172a;
    font-weight: 600;
    transition: background 160ms ease;
  }
  .contact__item:hover { background: ${brand}14; color: ${brand}; }
  .contact__label { font-size: 0.74rem; font-weight: 500; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .foot { margin-top: 30px; font-size: 0.8rem; color: #94a3b8; }
</style>
</head>
<body>
  <main class="card">
    ${logo ? `<img class="logo" src="${esc(logo)}" alt="${esc(settings.siteName || '')}" />` : ''}
    <div class="badge"><span class="dot"></span>Đang bảo trì</div>
    <h1>${esc(title)}</h1>
    ${message ? `<p>${esc(message)}</p>` : ''}
    ${
      rows.length
        ? `<div class="contact">
      ${cfg.contactNote ? `<div class="contact__note">${esc(cfg.contactNote)}</div>` : ''}
      <div class="contact__list">
        ${rows
          .map((row) => {
            const label = row.label ? `<span class="contact__label">${esc(row.label)}</span>` : '';
            // Khong co duong dan (loai "chi hien chu") thi ve the <span>, khong phai <a> rong
            if (!row.href) return `<span class="contact__item">${label}${esc(row.text)}</span>`;
            const target = row.external ? ' target="_blank" rel="noopener noreferrer"' : '';
            return `<a class="contact__item" href="${esc(row.href)}"${target}>${label}${esc(row.text)}</a>`;
          })
          .join('\n        ')}
      </div>
    </div>`
        : ''
    }
    ${settings.siteName ? `<div class="foot">${esc(settings.siteName)}</div>` : ''}
  </main>
</body>
</html>
`;
}

export default renderMaintenancePage;
