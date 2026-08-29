/**
 * PM2 - giữ app chạy liên tục, tự bật lại khi crash và khi VPS khởi động lại.
 *
 * CÁCH DÙNG:
 *   npm install -g pm2
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup     # tự chạy lại sau khi reboot VPS
 *   pm2 logs candien            # xem log
 *   pm2 restart candien         # khởi động lại sau khi sửa code
 *
 * Đuôi .cjs vì project dùng ESM ("type": "module") còn PM2 đọc file cấu hình
 * theo kiểu CommonJS.
 */

module.exports = {
  apps: [
    {
      name: 'candien',
      script: 'server/index.js',
      cwd: __dirname + '/..',

      /**
       * MỘT tiến trình duy nhất — cố ý không dùng cluster.
       *
       * Dữ liệu nằm trong db.json trên đĩa. Nhiều tiến trình cùng ghi một tệp
       * sẽ đè lên nhau và mất nội dung; hàng ghi nối tiếp trong app chỉ bảo vệ
       * được trong phạm vi một tiến trình. Website giới thiệu thì một tiến
       * trình Node thừa sức.
       *
       * Nếu thật sự cần nhiều tiến trình: đặt JWT_SECRET cố định trong .env
       * (không thì mỗi tiến trình một khóa, người dùng bị đăng xuất ngẫu nhiên)
       * và chuyển sang cơ sở dữ liệu thật.
       */
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'production',
        // Các biến còn lại đọc từ .env — không ghi bí mật vào tệp này vì nó
        // được commit lên git.
      },

      // Tự bật lại khi crash, nhưng có phanh: crash liên tục thì dừng để còn
      // đọc được log, thay vì quay vòng vô tận
      autorestart: true,
      max_restarts: 10,
      min_uptime: '20s',
      restart_delay: 2000,

      // Rò rỉ bộ nhớ thì khởi động lại thay vì để VPS hết RAM
      max_memory_restart: '400M',

      // Log: PM2 gộp về ~/.pm2/logs. Có thời gian cho dễ tra
      time: true,
      merge_logs: true,

      // KHÔNG bật watch ở production: mỗi lần CMS lưu là db.json đổi,
      // watch sẽ khiến app tự khởi động lại liên tục.
      watch: false,
    },
  ],
};
