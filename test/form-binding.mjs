/**
 * Kiểm thử ràng buộc form của CMS.
 *
 * Chạy: npm test (hoặc npm run test:form)
 *
 * Khoá lại một lỗi đã từng xảy ra: `bindForm` giữ tham chiếu tới object model
 * lúc khởi tạo, trong khi màn hình chỉnh sửa lại **thay** object đó sau mỗi lần
 * Lưu / Hoàn tác. Hậu quả: từ lần lưu thứ hai trở đi, mọi thay đổi rơi vào object
 * cũ đã bị bỏ — bấm Lưu mà giá trị không đổi gì.
 *
 * Test dựng một DOM giả tối giản để bắn sự kiện vào bindForm.
 */

import { importBrowserModule } from './browser-module.mjs';

let passed = 0;
let failed = 0;

const check = (name, ok, hint = '') => {
  console.log(`  ${ok ? '✓' : '✗'} ${name}${ok || !hint ? '' : `  (${hint})`}`);
  ok ? (passed += 1) : (failed += 1);
};

/* ---------------- DOM giả ---------------- */

/** Một phần tử đủ dùng cho bindForm: có dataset, value, và closest(). */
const makeElement = (dataset = {}, extra = {}) => {
  const element = { dataset, value: '', checked: false, hidden: false, focus() {}, ...extra };
  element.closest = (selector) => {
    const key = selector.replace(/[[\]]/g, '').replace('data-', '').replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return element.dataset[key] !== undefined ? element : null;
  };
  return element;
};

const makeContainer = () => {
  const listeners = {};
  return {
    listeners,
    addEventListener(type, handler) {
      (listeners[type] ??= []).push(handler);
    },
    contains: () => true,
    querySelector: () => null,
    /** Bắn sự kiện tới mọi handler đã đăng ký. */
    fire(type, target) {
      return Promise.all((listeners[type] ?? []).map((handler) => handler({ target })));
    },
  };
};

globalThis.CSS = { escape: (value) => value };
globalThis.window = { confirm: () => true };
globalThis.document = { createElement: () => ({ innerHTML: '', content: { firstElementChild: null } }) };

try {
  // form.js là mã của trình duyệt (import theo đường dẫn web) nên phải nạp qua cầu nối
  const { bindForm } = await importBrowserModule('cms/js/core/form.js');

  /* ---------- 1. Ghi giá trị vào model ---------- */
  console.log('\n1. Gõ vào ô nhập thì model phải đổi theo');

  let model = { siteName: 'Cũ', logo: '/uploads/cu.png', hero: { intervalMs: 6000 }, tags: [] };
  const container = makeContainer();
  let repainted = 0;

  bindForm(container, () => model, {
    schema: [],
    pickMedia: async () => '/uploads/anh-moi.png',
    onChange: () => {},
    onRerender: () => {
      repainted += 1;
    },
  });

  await container.fire('input', makeElement({ path: 'siteName', type: 'text' }, { value: 'Tên mới' }));
  check('ô chữ ghi vào model', model.siteName === 'Tên mới', model.siteName);

  await container.fire('input', makeElement({ path: 'hero.intervalMs', type: 'number' }, { value: '4500' }));
  check('ô số ghi vào đúng nhánh lồng nhau', model.hero.intervalMs === 4500, String(model.hero.intervalMs));

  await container.fire(
    'change',
    makeElement({ path: 'enabled', type: 'toggle' }, { checked: true, value: 'on' }),
  );
  check('ô bật/tắt ghi kiểu boolean', model.enabled === true, String(model.enabled));

  await container.fire(
    'input',
    makeElement({ path: 'tags', type: 'stringlist' }, { value: 'dòng 1\n\ndòng 2\n' }),
  );
  check('danh sách nhiều dòng bỏ dòng trống', JSON.stringify(model.tags) === '["dòng 1","dòng 2"]', JSON.stringify(model.tags));

  /* ---------- 2. Lỗi cũ: sau khi lưu, model bị thay ---------- */
  console.log('\n2. Sau khi Lưu (model bị thay object) vẫn phải ghi đúng chỗ');

  const modelSauKhiLuu = { siteName: 'Tên mới', logo: '/uploads/cu.png', hero: { intervalMs: 4500 } };
  const modelCu = model;
  model = modelSauKhiLuu; // đúng như thao tác Lưu / Hoàn tác trong section-view

  await container.fire('input', makeElement({ path: 'siteName', type: 'text' }, { value: 'Sửa lần hai' }));
  check('ghi vào model ĐANG hiển thị', model.siteName === 'Sửa lần hai', model.siteName);
  check('không ghi nhầm vào model cũ đã bỏ', modelCu.siteName === 'Tên mới', modelCu.siteName);

  /* ---------- 3. Chọn ảnh từ bộ sưu tập ---------- */
  console.log('\n3. Chọn ảnh mới');

  await container.fire(
    'click',
    makeElement({ action: 'pick-media', target: 'logo', kind: 'image' }),
  );
  check('đường dẫn ảnh mới vào model', model.logo === '/uploads/anh-moi.png', model.logo);
  check('form được vẽ lại để hiện ảnh mới', repainted > 0, `${repainted} lần`);

  const beforeClear = repainted;
  await container.fire('click', makeElement({ action: 'clear-media', target: 'logo' }));
  check('bỏ chọn ảnh thì xoá giá trị', model.logo === '', JSON.stringify(model.logo));
  check('bỏ chọn cũng vẽ lại form', repainted > beforeClear);

  // Chọn ảnh sau khi model bị thay lần nữa — kịch bản y hệt lỗi cũ
  const modelSauKhiLuuLan2 = { siteName: 'Sửa lần hai', logo: '' };
  model = modelSauKhiLuuLan2;
  await container.fire('click', makeElement({ action: 'pick-media', target: 'logo', kind: 'image' }));
  check('chọn ảnh sau lần lưu thứ hai vẫn đúng chỗ', model.logo === '/uploads/anh-moi.png', model.logo);

  /* ---------- 4. Danh sách lặp ---------- */
  console.log('\n4. Thêm / xoá / đổi thứ tự mục lặp');

  model = { slides: [{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }] };

  await container.fire('click', makeElement({ action: 'repeat-add', repeat: 'slides' }));
  check('thêm mục mới vào đúng model', model.slides.length === 3, String(model.slides.length));

  await container.fire('click', makeElement({ action: 'repeat-move', repeat: 'slides', index: '0', dir: '1' }));
  check('đổi thứ tự', model.slides[0].id === 'b', model.slides[0].id);

  await container.fire('click', makeElement({ action: 'repeat-remove', repeat: 'slides', index: '0' }));
  check('xoá mục', model.slides.length === 2 && model.slides[0].id === 'a', JSON.stringify(model.slides.map((s) => s.id)));

  /* ---------- 5. Chống dùng sai ---------- */
  console.log('\n5. Chống gọi sai cách');

  let threw = false;
  try {
    bindForm(makeContainer(), { siteName: 'x' }, {});
  } catch {
    threw = true;
  }
  check('truyền thẳng object thay vì hàm -> báo lỗi ngay', threw, 'đây chính là cách gây ra lỗi cũ');
} catch (error) {
  console.error('\nLỖI:', error.message);
  failed += 1;
}

console.log(`\n${failed === 0 ? '✓ RÀNG BUỘC FORM ĐẠT' : '✗ RÀNG BUỘC FORM CÓ LỖI'} — ${passed} đạt / ${failed} lỗi`);
process.exit(failed === 0 ? 0 : 1);
