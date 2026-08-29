/**
 * section-view.js - nha may tao man hinh chinh sua mot nhanh noi dung.
 * Moi man hinh chi can khai bao schema; phan luu / theo doi thay doi
 * / thanh cong cu duoc xu ly o day.
 */

import { html, raw } from '/assets/js/core/dom.js';
import { siteApi } from '/assets/js/core/api.js';
import { renderFields, bindForm } from './form.js';
import { pickMedia } from './media-picker.js';
import { clone } from './path.js';
import { savebar } from './savebar.js';
import { toast } from './ui.js';

export function createSectionView({ section, title, description, hint, schema, groups }) {
  const blocks = groups ?? [{ fields: schema }];

  return {
    section,
    title,
    description,
    groups: blocks,

    mount(container, ctx) {
      /**
       * Ban nhap dang chinh sua.
       *
       * Luon giu NGUYEN mot tham chieu: cac ham xu ly su kien deu doc qua
       * getModel(), nen sau khi Luu / Hoan tac chi can thay noi dung ben trong.
       * Neu gan lai bien `model` sang object khac thi form van ghi vao object cu
       * -> bam Luu nhu khong bam. Loi nay da tung xay ra.
       */
      let model = clone(ctx.data[section] ?? {});
      const getModel = () => model;

      container.innerHTML = html`
        ${hint ? html`<div class="hint">${hint}</div>` : ''}
        <div data-form></div>
      `;

      const formHost = container.querySelector('[data-form]');

      const paint = () => {
        formHost.innerHTML = blocks
          .map(
            (group) => html`
              <section class="card">
                ${group.title
                  ? html`<div class="card__head">
                      <div>
                        <div class="card__title">${group.title}</div>
                        ${group.description ? html`<div class="card__desc">${group.description}</div>` : ''}
                      </div>
                    </div>`
                  : ''}
                <div class="fields ${raw(group.columns === 2 ? 'fields--2' : '')}">
                  ${raw(renderFields(group.fields, model))}
                </div>
              </section>
            `,
          )
          .join('');
      };

      const setDirty = (value) => {
        ctx.setDirty?.(value);
        if (value) savebar.show({ onSave: save, onReset: reset });
        else savebar.hide();
      };

      function reset() {
        model = clone(ctx.data[section] ?? {});
        paint();
        setDirty(false);
      }

      async function save() {
        savebar.setBusy(true);
        try {
          const saved = await siteApi.putSection(section, model);
          // Nhan lai chinh du lieu server da ghi -> giao dien luon khop voi o dia
          ctx.data[section] = clone(saved);
          model = clone(saved);
          paint();
          setDirty(false);
          toast('Đã lưu. Trang web sẽ tự cập nhật khi bạn mở lại tab đó.', 'success', 4000);
        } catch (error) {
          toast(error.message || 'Lưu thất bại', 'error');
        } finally {
          savebar.setBusy(false);
        }
      }

      paint();

      bindForm(formHost, getModel, {
        schema: blocks.flatMap((group) => group.fields),
        pickMedia,
        onChange: () => setDirty(true),
        onRerender: paint,
      });

      // Roi man hinh: cat thanh luu di
      return () => {
        savebar.hide();
        ctx.setDirty?.(false);
      };
    },
  };
}
