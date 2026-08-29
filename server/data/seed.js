import db from '../lib/db.js';
import buildDefaultDb from './defaults.js';

/**
 * Bổ sung những khóa CÒN THIẾU từ dữ liệu mặc định, đệ quy vào cả nhánh con.
 * Không bao giờ ghi đè giá trị người dùng đã chỉnh, và không đụng vào mảng
 * (mảng là danh sách người dùng tự quản lý: slide, sản phẩm, ảnh…).
 *
 * Nhờ hàm này, thêm một khối mới vào defaults.js là bản cài cũ cũng có ngay
 * sau khi khởi động lại, không phải xóa db.json.
 *
 * @returns {string[]} đường dẫn các khóa vừa được thêm
 */
export function fillMissing(target, defaults, trail = '', added = []) {
  for (const [key, value] of Object.entries(defaults)) {
    const path = trail ? `${trail}.${key}` : key;

    if (target[key] === undefined) {
      target[key] = value;
      added.push(path);
      continue;
    }

    const bothPlainObjects =
      value && typeof value === 'object' && !Array.isArray(value) &&
      target[key] && typeof target[key] === 'object' && !Array.isArray(target[key]);

    if (bothPlainObjects) fillMissing(target[key], value, path, added);
  }
  return added;
}

/**
 * Tao du lieu noi dung khoi tao neu db.json chua ton tai
 * (hoac chay `npm run seed -- --force` de dat lai ve mac dinh).
 *
 * Luu y: tep nay KHONG dung toi tai khoan dang nhap.
 * Thong tin dang nhap nam rieng o server/data/credentials.json.
 */
export async function ensureSeed({ force = false } = {}) {
  return db.update(async (data) => {
    const isEmpty = !data || Object.keys(data).length === 0;

    if (isEmpty || force) {
      const defaults = buildDefaultDb();
      for (const key of Object.keys(data)) delete data[key];
      Object.assign(data, defaults);
      return data;
    }

    // Nang cap: bo sung moi khoa con thieu (ke ca nhanh con), giu nguyen du lieu dang co
    const added = fillMissing(data, buildDefaultDb());
    if (added.length) {
      console.log(`  → Bổ sung ${added.length} mục nội dung mới: ${added.join(', ')}`);
    }

    // Don du lieu cu: tai khoan tung nam trong db.json o phien ban truoc
    if (data.users) delete data.users;

    return data;
  });
}

// Cho phep chay truc tiep: node server/data/seed.js --force
const isDirectRun = process.argv[1] && process.argv[1].endsWith('seed.js');
if (isDirectRun) {
  const force = process.argv.includes('--force');
  await ensureSeed({ force });
  console.log(force ? 'Da khoi tao lai noi dung mac dinh.' : 'Da kiem tra va bo sung du lieu.');
}

export default ensureSeed;
