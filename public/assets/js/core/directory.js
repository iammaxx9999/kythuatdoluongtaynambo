/**
 * directory.js - danh ba lien he: moi dong ghi ro AI phu trach so nao.
 *
 * Vi du "Bo phan kinh doanh - Anh Tuan - 0939 292 845".
 *
 * Tep nay KHONG import gi (khong dung DOM) de ca trinh duyet lan may chu deu
 * nap thang duoc. Nho vay khoi lien he tren trang va trang bao tri dung CHUNG
 * mot bo quy tac - doi cach dung link o day la hai noi doi theo, khong lech.
 */

/** Kieu lien he -> bieu tuong mac dinh va cach dung duong dan. */
export const DIRECTORY_TYPES = {
  phone: {
    icon: 'phone',
    label: 'Điện thoại',
    href: (value) => `tel:${String(value).replace(/[^\d+]/g, '')}`,
  },
  email: {
    icon: 'mail',
    label: 'Email',
    href: (value) => `mailto:${String(value).trim()}`,
  },
  zalo: {
    icon: 'zalo',
    label: 'Zalo',
    href: (value) => {
      const raw = String(value).trim();
      return /^https?:\/\//i.test(raw) ? raw : `https://zalo.me/${raw.replace(/[^\d]/g, '')}`;
    },
  },
  link: {
    icon: 'link',
    label: 'Liên kết',
    href: (value) => String(value).trim(),
  },
  /** Chi hien chu, khong bam duoc - dung cho ma so thue, so fax... */
  text: {
    icon: 'check',
    label: '',
    href: () => '',
  },
};

/**
 * Chuan hoa danh ba thanh danh sach de ve.
 *
 * @param {Array} list  contact.directory
 * @returns {Array<{label,person,value,href,icon,iconImage,external}>}
 */
export function buildDirectory(list = []) {
  return (Array.isArray(list) ? list : [])
    .filter((item) => item && item.enabled !== false && String(item.value ?? '').trim())
    .map((item) => {
      const preset = DIRECTORY_TYPES[item.type] ?? DIRECTORY_TYPES.text;
      const href = preset.href(item.value);
      return {
        label: String(item.label ?? '').trim() || preset.label,
        person: String(item.person ?? '').trim(),
        value: String(item.value).trim(),
        href,
        icon: item.icon || preset.icon,
        iconImage: item.iconImage || '',
        // Link ngoai thi mo tab moi; tel:/mailto: thi khong
        external: /^https?:\/\//i.test(href),
      };
    });
}

export default buildDirectory;
