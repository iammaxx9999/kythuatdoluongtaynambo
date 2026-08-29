/**
 * account.js - doi mat khau va thong tin tai khoan quan tri.
 */

import { html } from '/assets/js/core/dom.js';
import { authApi } from '/assets/js/core/api.js';
import { toast } from '../core/ui.js';

export const accountView = {
  title: 'Tài khoản',
  description: 'Thông tin đăng nhập quản trị',

  mount(container, ctx) {
    container.innerHTML = html`
      <section class="card">
        <div class="card__head">
          <div>
            <div class="card__title">Thông tin tài khoản</div>
            <div class="card__desc">Đang đăng nhập với vai trò ${ctx.user?.role || 'admin'}</div>
          </div>
        </div>
        <div class="fields fields--2">
          <div class="field">
            <span class="field__label">Tên đăng nhập</span>
            <input class="input" value="${ctx.user?.username ?? ''}" disabled />
          </div>
          <div class="field">
            <span class="field__label">Tên hiển thị</span>
            <input class="input" value="${ctx.user?.displayName ?? ''}" disabled />
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card__head">
          <div>
            <div class="card__title">Đổi mật khẩu</div>
            <div class="card__desc">Nên đổi ngay mật khẩu mặc định sau lần đăng nhập đầu tiên</div>
          </div>
        </div>
        <form class="fields fields--2" data-password-form>
          <div class="field">
            <label class="field__label" for="cur">Mật khẩu hiện tại</label>
            <input class="input" id="cur" name="currentPassword" type="password" autocomplete="current-password" required />
          </div>
          <div class="field">
            <label class="field__label" for="new">Mật khẩu mới</label>
            <input class="input" id="new" name="newPassword" type="password" autocomplete="new-password" minlength="8" required />
            <span class="field__help">Tối thiểu 8 ký tự, gồm cả chữ và số hoặc ký tự đặc biệt.</span>
          </div>
          <div class="field field--full">
            <button class="btn btn--primary" type="submit">Cập nhật mật khẩu</button>
          </div>
        </form>
      </section>
    `;

    container.querySelector('[data-password-form]').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target).entries());
      try {
        await authApi.changePassword(data.currentPassword, data.newPassword);
        event.target.reset();
        // Phiên cũ đã bị hủy phía server -> bắt đăng nhập lại cho an toàn
        toast('Đã đổi mật khẩu. Đang yêu cầu đăng nhập lại…', 'success');
        setTimeout(() => location.reload(), 1500);
      } catch (error) {
        toast(error.message, 'error');
      }
    });
  },
};
