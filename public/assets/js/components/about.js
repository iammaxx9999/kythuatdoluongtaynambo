/**
 * about.js - phan gioi thieu cong ty: mo ta, gia tri, dau moc, chung nhan.
 */

import { html, raw, render, safeUrl } from '../core/dom.js';
import { icon } from '../core/icons.js';
import { placeholder } from '../core/store.js';

export function renderAbout(root, state) {
  const about = state.about ?? {};
  const paragraphs = Array.isArray(about.body) ? about.body : [about.body].filter(Boolean);

  render(
    root,
    html`
      <div class="container">
        <div class="about-grid">
          <div data-reveal>
            <div class="section__head" style="margin-bottom:24px">
              <p class="t-eyebrow">${about.eyebrow}</p>
              <h2 class="t-h2">${about.title}</h2>
            </div>
            ${about.lead ? html`<p class="t-lead">${about.lead}</p>` : ''}
            <div class="about__body" style="margin-top:18px">
              ${paragraphs.map((text) => html`<p class="card__text" style="font-size:1rem">${text}</p>`)}
            </div>

            ${about.values?.length
              ? html`
                  <div class="value-list">
                    ${about.values.map(
                      (value, index) => html`
                        <div class="value-item">
                          <span class="value-item__dot">${index + 1}</span>
                          <div>
                            <div class="card__title" style="font-size:1rem">${value.title}</div>
                            <p class="card__text" style="margin-top:4px">${value.description}</p>
                          </div>
                        </div>
                      `,
                    )}
                  </div>
                `
              : ''}
          </div>

          <div data-reveal>
            <figure class="about__media" style="margin:0">
              <img src="${safeUrl(about.image) || placeholder()}" alt="${about.imageCaption || about.title}" loading="lazy" />
            </figure>
            ${about.imageCaption ? html`<p class="about__caption">${about.imageCaption}</p>` : ''}

            ${about.certificates?.enabled && about.certificates.items?.length
              ? html`
                  <div style="margin-top:28px">
                    <div class="card__title" style="font-size:1rem">${about.certificates.title}</div>
                    <div class="cert-list">
                      ${about.certificates.items.map(
                        (item) => html`<span class="cert-chip">${raw(icon('check', 15))}${item.label}</span>`,
                      )}
                    </div>
                  </div>
                `
              : ''}
          </div>
        </div>

        ${about.milestones?.length
          ? html`
              <div class="timeline">
                ${about.milestones.map(
                  (item) => html`
                    <div class="timeline__item" data-reveal>
                      <div class="timeline__year">${item.year}</div>
                      <div class="timeline__title">${item.title}</div>
                      <p class="timeline__text">${item.description}</p>
                    </div>
                  `,
                )}
              </div>
            `
          : ''}
      </div>
    `,
  );
}
