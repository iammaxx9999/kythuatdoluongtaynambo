/**
 * tokens.js - thay ky tu dai dien trong noi dung do CMS quan ly.
 *
 * Van de: ten thuong hieu xuat hien rai rac hang chuc cho ("Vi sao chon X",
 * doan gioi thieu, dong ban quyen, tieu de form...). Doi ten mot lan la phai
 * di ra soat tung o mot, sot mot cho la trang web ten no ten kia.
 *
 * Cach xu ly: trong bat ky o chu nao tren CMS cung go duoc {brand}, {company},
 * {year}. Luc hien ra trang moi thay bang gia tri that. CMS van giu nguyen chu
 * {brand} de con sua duoc; chi ban hien cho khach xem la da thay xong.
 */

/**
 * Bảng ký tự đại diện, dựng từ nhánh settings.
 * @param {object} settings
 */
export const buildTokens = (settings = {}) => ({
  // Tên ngắn để đọc cho thuận câu; bỏ trống thì lùi về tên công ty đầy đủ
  brand: settings.brandName || settings.siteName || '',
  company: settings.siteName || '',
  year: String(new Date().getFullYear()),
});

/**
 * `{brand}` hoặc `{ brand }` đều nhận. Chỉ nhận đúng những tên đã khai báo -
 * chuỗi kiểu `{x}` lạ thì để nguyên, khỏi phá nội dung có sẵn dấu ngoặc nhọn.
 */
const TOKEN_RE = /\{\s*(brand|company|year)\s*\}/gi;

/** Thay ký tự đại diện trong MỘT chuỗi. Một lượt duy nhất, không lặp lại. */
export const fillTokens = (text, tokens = {}) =>
  typeof text === 'string' && text.includes('{')
    ? text.replace(TOKEN_RE, (whole, name) => {
        const value = tokens[name.toLowerCase()];
        return value === undefined || value === null ? whole : value;
      })
    : text;

/**
 * Duyệt sâu toàn bộ dữ liệu, thay ký tự đại diện trong mọi chuỗi.
 * Trả về bản MỚI, không sửa dữ liệu gốc.
 *
 * @param {*} node
 * @param {object} tokens  bảng từ buildTokens()
 */
export function resolveTokens(node, tokens, depth = 0) {
  if (depth > 12) return node; // dữ liệu lồng sâu bất thường -> dừng, không treo trang
  if (typeof node === 'string') return fillTokens(node, tokens);
  if (Array.isArray(node)) return node.map((item) => resolveTokens(item, tokens, depth + 1));

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = resolveTokens(value, tokens, depth + 1);
    return out;
  }

  return node;
}

/** Tiện dụng: nhận nguyên dữ liệu site, trả về bản đã thay xong. */
export const resolveSite = (site) => (site ? resolveTokens(site, buildTokens(site.settings)) : site);

export default resolveSite;
