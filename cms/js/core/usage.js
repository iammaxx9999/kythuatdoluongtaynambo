/**
 * usage.js - dò xem một tệp trong bộ sưu tập đang được dùng ở những đâu.
 *
 * Trước khi xóa hẳn một ảnh khỏi ổ đĩa, người dùng cần biết ảnh đó có đang
 * nằm trên trang hay không — xóa nhầm thì chỗ đó mất hình mà không ai hay.
 */

/** Tên tiếng Việt của từng nhánh nội dung. */
const SECTION_LABELS = {
  settings: 'Cấu hình chung',
  hero: 'Đầu trang',
  home: 'Trang chủ',
  about: 'Giới thiệu',
  productsSection: 'Khu vực sản phẩm',
  contact: 'Liên hệ',
  floatingContact: 'Nút liên hệ nổi',
  products: 'Sản phẩm',
};

/** Các khóa hay dùng để đặt tên cho một mục, lấy làm nhãn phụ cho dễ nhận ra. */
const NAME_KEYS = ['name', 'title', 'label', 'eyebrow', 'message'];

const readableName = (node) => {
  if (!node || typeof node !== 'object') return '';
  for (const key of NAME_KEYS) {
    const value = node[key];
    if (typeof value === 'string' && value.trim()) return value.trim().split('\n')[0].slice(0, 40);
  }
  return '';
};

/**
 * Duyệt sâu, gom mọi vị trí có giá trị đúng bằng `url`.
 * @returns {string[]} mô tả dễ đọc, ví dụ ["Đầu trang › Slide: Cân ô tô điện tử"]
 */
function walk(node, url, label, trail, found, depth = 0) {
  if (depth > 12) return;

  if (typeof node === 'string') {
    if (node === url) found.add(trail.length ? `${label} › ${trail.join(' › ')}` : label);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item, index) => {
      const name = readableName(item) || `mục ${index + 1}`;
      walk(item, url, label, [...trail, name], found, depth + 1);
    });
    return;
  }

  if (node && typeof node === 'object') {
    for (const value of Object.values(node)) walk(value, url, label, trail, found, depth + 1);
  }
}

/**
 * @param {object} data  toàn bộ dữ liệu CMS (ctx.data)
 * @param {string} url   đường dẫn tệp cần tra
 * @returns {string[]}   danh sách nơi đang dùng, rỗng nghĩa là chưa dùng ở đâu
 */
export function findUsage(data, url) {
  if (!data || !url) return [];
  const found = new Set();

  for (const [key, label] of Object.entries(SECTION_LABELS)) {
    if (data[key] === undefined) continue;
    walk(data[key], url, label, [], found);
  }

  return [...found];
}

export default findUsage;
