/**
 * products.js - quan ly san pham: danh sach, them, sua, xoa, sap xep.
 */

import { html, raw, esc } from '/assets/js/core/dom.js';
import { productApi } from '/assets/js/core/api.js';
import { renderFields, bindForm } from '../core/form.js';
import { pickMedia } from '../core/media-picker.js';
import { clone } from '../core/path.js';
import { openModal, confirmDialog, toast } from '../core/ui.js';

const PLACEHOLDER = '/assets/img/placeholder.svg';

const productSchema = (categories) => [
  { path: 'name', label: 'Tên sản phẩm', type: 'text', width: 'full' },
  {
    path: 'category',
    label: 'Danh mục',
    type: 'select',
    options: categories.map((cat) => ({ value: cat.slug, label: cat.name })),
  },
  { path: 'badge', label: 'Nhãn nổi bật', type: 'text', placeholder: 'Bán chạy, Mới…' },
  { path: 'price', label: 'Giá hiển thị', type: 'text', placeholder: 'Liên hệ' },
  { path: 'slug', label: 'Đường dẫn (slug)', type: 'text', help: 'Bỏ trống để tự sinh từ tên' },
  { path: 'image', label: 'Ảnh đại diện', type: 'image', width: 'full' },
  {
    path: 'gallery',
    label: 'Ảnh bổ sung',
    type: 'stringlist',
    width: 'full',
    rows: 3,
    help: 'Mỗi dòng một đường dẫn ảnh, ví dụ /uploads/anh-1.jpg',
  },
  { path: 'shortDescription', label: 'Mô tả ngắn', type: 'textarea', width: 'full', rows: 2 },
  { path: 'description', label: 'Mô tả chi tiết', type: 'textarea', width: 'full', rows: 5 },
  {
    type: 'repeater',
    path: 'specs',
    label: 'Thông số kỹ thuật',
    addLabel: 'Thêm thông số',
    itemLabelKey: 'key',
    columns: 2,
    defaults: { key: 'Thông số', value: '' },
    fields: [
      { path: 'key', label: 'Tên thông số', type: 'text' },
      { path: 'value', label: 'Giá trị', type: 'text' },
    ],
  },
  { path: 'featured', label: 'Sản phẩm nổi bật', type: 'toggle' },
  { path: 'enabled', label: 'Hiển thị trên web', type: 'toggle' },
];

const emptyProduct = (categories) => ({
  name: '',
  slug: '',
  category: categories[1]?.slug ?? categories[0]?.slug ?? 'khac',
  badge: '',
  price: 'Liên hệ',
  image: '',
  gallery: [],
  shortDescription: '',
  description: '',
  specs: [],
  featured: false,
  enabled: true,
});

export const productsView = {
  title: 'Sản phẩm',
  description: 'Thêm, sửa, sắp xếp danh mục sản phẩm hiển thị trên trang',

  mount(container, ctx) {
    const categories = ctx.data.productsSection?.categories ?? [];
    let products = [...(ctx.data.products ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    const paint = () => {
      container.innerHTML = html`
        <section class="card">
          <div class="card__head">
            <div>
              <div class="card__title">Danh sách sản phẩm (${products.length})</div>
              <div class="card__desc">Dùng mũi tên để đổi thứ tự hiển thị trên trang chủ</div>
            </div>
            <div class="card__actions">
              <button class="btn btn--primary" type="button" data-add>+ Thêm sản phẩm</button>
            </div>
          </div>

          ${products.length === 0
            ? html`<div class="empty">Chưa có sản phẩm nào.</div>`
            : raw(`
              <table class="table">
                <thead>
                  <tr>
                    <th style="width:70px">Ảnh</th>
                    <th>Tên sản phẩm</th>
                    <th style="width:150px">Danh mục</th>
                    <th style="width:110px">Trạng thái</th>
                    <th style="width:190px"></th>
                  </tr>
                </thead>
                <tbody>
                  ${products
                    .map(
                      (product, index) => `
                    <tr>
                      <td><img class="table__thumb" src="${esc(product.image || PLACEHOLDER)}" alt="" /></td>
                      <td>
                        <strong>${esc(product.name)}</strong>
                        ${product.badge ? `<span class="tag" style="margin-left:6px">${esc(product.badge)}</span>` : ''}
                        <div style="font-size:.8rem;color:var(--ink-3)">${esc(product.shortDescription || '')}</div>
                      </td>
                      <td>${esc(categoryName(categories, product.category))}</td>
                      <td>
                        <span class="tag ${product.enabled === false ? 'tag--off' : 'tag--on'}">
                          ${product.enabled === false ? 'Đang ẩn' : 'Hiển thị'}
                        </span>
                      </td>
                      <td>
                        <div class="row-actions">
                          <button class="btn btn--sm btn--icon" type="button" data-move="${index}" data-dir="-1" title="Lên">&uarr;</button>
                          <button class="btn btn--sm btn--icon" type="button" data-move="${index}" data-dir="1" title="Xuống">&darr;</button>
                          <button class="btn btn--sm" type="button" data-edit="${esc(product.id)}">Sửa</button>
                          <button class="btn btn--sm btn--danger" type="button" data-remove="${esc(product.id)}">Xóa</button>
                        </div>
                      </td>
                    </tr>`,
                    )
                    .join('')}
                </tbody>
              </table>`)}
        </section>
      `;
    };

    const refresh = async () => {
      products = (await productApi.list()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      ctx.data.products = products;
      paint();
    };

    paint();

    container.addEventListener('click', async (event) => {
      const target = event.target.closest('button');
      if (!target) return;

      if (target.dataset.add !== undefined) {
        const created = await openProductModal(emptyProduct(categories), categories, 'Thêm sản phẩm');
        if (!created) return;
        try {
          await productApi.create(created);
          toast('Đã thêm sản phẩm', 'success');
          await refresh();
        } catch (error) {
          toast(error.message, 'error');
        }
        return;
      }

      if (target.dataset.edit) {
        const product = products.find((item) => item.id === target.dataset.edit);
        const updated = await openProductModal(clone(product), categories, 'Sửa sản phẩm');
        if (!updated) return;
        try {
          await productApi.update(product.id, updated);
          toast('Đã lưu sản phẩm', 'success');
          await refresh();
        } catch (error) {
          toast(error.message, 'error');
        }
        return;
      }

      if (target.dataset.remove) {
        const product = products.find((item) => item.id === target.dataset.remove);
        if (!(await confirmDialog(`Xóa sản phẩm "${product?.name}"?`))) return;
        try {
          await productApi.remove(product.id);
          toast('Đã xóa sản phẩm', 'success');
          await refresh();
        } catch (error) {
          toast(error.message, 'error');
        }
        return;
      }

      if (target.dataset.move !== undefined) {
        const from = Number(target.dataset.move);
        const to = from + Number(target.dataset.dir);
        if (to < 0 || to >= products.length) return;
        [products[from], products[to]] = [products[to], products[from]];
        paint();
        try {
          await productApi.reorder(products.map((item) => item.id));
        } catch (error) {
          toast(error.message, 'error');
        }
      }
    });
  },
};

const categoryName = (categories, slug) => categories.find((cat) => cat.slug === slug)?.name || slug || '—';

function openProductModal(product, categories, title) {
  const model = product;
  const schema = productSchema(categories);

  return openModal({
    title,
    width: '860px',
    body: '<div data-product-form></div>',
    footer: html`
      <button class="btn" type="button" data-close>Hủy</button>
      <button class="btn btn--primary" type="button" data-submit>Lưu sản phẩm</button>
    `,
    onMount: (dialog, close) => {
      const host = dialog.querySelector('[data-product-form]');
      const paint = () => {
        host.innerHTML = `<div class="fields fields--2">${renderFields(schema, model)}</div>`;
      };
      paint();
      // Truyen HAM lay model (xem ghi chu trong form.js) — o day model khong doi
      // tham chieu, nhung giu dung mot quy uoc cho ca du an.
      bindForm(host, () => model, { schema, pickMedia, onRerender: paint });

      dialog.querySelector('[data-submit]').addEventListener('click', () => {
        if (!model.name?.trim()) {
          toast('Vui lòng nhập tên sản phẩm', 'error');
          return;
        }
        close(model);
      });
    },
  });
}
