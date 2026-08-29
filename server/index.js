import config, { CREDENTIALS_FILE } from './config.js';
import { createApp } from './app.js';
import { ensureSeed } from './data/seed.js';
import { initCredentials } from './lib/credentials.js';
import { syncFromDisk } from './services/media.service.js';
import { getPublicSite } from './services/content.service.js';
import { normalizeSiteUrl } from './lib/helpers.js';

/**
 * Canh nhung cau hinh sai nguy hiem khi chay that.
 * Chi CANH BAO, khong chan khoi dong - de con vao sua duoc.
 */
function warnProductionConfig(siteUrl) {
  const warnings = [];

  if (!config.isProduction) {
    warnings.push('NODE_ENV chưa phải "production" — cookie phiên sẽ không có cờ Secure.');
  }

  if (config.isProduction && siteUrl && !siteUrl.startsWith('https://')) {
    warnings.push(
      `Địa chỉ website là ${siteUrl} (không phải HTTPS). Ở production cookie phiên có cờ Secure ` +
        'nên trình duyệt sẽ KHÔNG gửi cookie qua HTTP → không đăng nhập được CMS. Hãy bật SSL.',
    );
  }

  if (config.isProduction && !siteUrl) {
    warnings.push('Chưa đặt SITE_URL (hoặc ô "Địa chỉ website" trong CMS) — sitemap và thẻ canonical sẽ đoán theo host.');
  }

  if (config.isProduction && config.trustProxy === false) {
    warnings.push(
      'TRUST_PROXY đang tắt. Nếu app chạy sau Nginx thì mọi request đều mang IP của proxy, ' +
        'giới hạn số lần đăng nhập sai sẽ tính chung cho cả thiên hạ. Chạy sau Nginx thì đặt TRUST_PROXY=1.',
    );
  }

  if (config.isProduction && config.cmsPath === '/cms') {
    warnings.push('Đường dẫn CMS vẫn là /cms — nên đổi CMS_PATH thành chuỗi khó đoán để bot không dò tới.');
  }

  if (!process.env.JWT_SECRET && config.isProduction) {
    warnings.push(
      'JWT_SECRET để trống — server tự sinh khóa và lưu vào tệp. Chạy nhiều tiến trình (PM2 cluster) ' +
        'thì mỗi tiến trình một khóa, người dùng sẽ bị đăng xuất ngẫu nhiên. Đặt JWT_SECRET nếu dùng cluster.',
    );
  }

  return warnings;
}

async function bootstrap() {
  // 1. Noi dung website
  await ensureSeed();

  // 2. Quet lai thu muc uploads: tep co tren o dia ma chua co trong bo suu tap
  //    thi them vao. Nho vay mat db.json van khong mat anh.
  const recovered = await syncFromDisk();

  // 3. Tai khoan CMS: doc tep credentials.json, bam mat khau dang thuong (neu con)
  const { username, rehashed } = await initCredentials({
    defaultUsername: process.env.ADMIN_USERNAME || 'admin',
    defaultPassword: process.env.ADMIN_PASSWORD || '',
  });

  // 4. Dia chi that cua website: uu tien o trong CMS, roi tot bien SITE_URL
  const site = await getPublicSite().catch(() => null);
  const siteUrl = normalizeSiteUrl(site?.settings?.siteUrl) || config.siteUrl;
  const warnings = warnProductionConfig(siteUrl);

  const app = createApp();
  const server = app.listen(config.port, () => {
    // In dia chi that neu co - de biet ngay minh dang phuc vu ten mien nao
    const base = siteUrl || `http://localhost:${config.port}`;
    console.log('');
    console.log('  Website + CMS đã khởi động');
    console.log(`  Trang chủ : ${base}`);
    console.log(`  CMS       : ${base}${config.cmsPath}`);
    if (siteUrl) console.log(`  Cổng nội bộ: ${config.port} (Nginx trỏ vào cổng này)`);
    console.log(`  Tài khoản : ${username}  (mật khẩu lưu dạng băm trong ${CREDENTIALS_FILE})`);
    console.log(`  Môi trường: ${config.env}`);
    if (rehashed) console.log('  → Đã mã hóa mật khẩu trong tệp tài khoản, bản rõ đã bị xóa khỏi ổ đĩa.');
    if (recovered.length) console.log(`  → Đã thêm ${recovered.length} tệp có sẵn trong uploads vào bộ sưu tập.`);

    if (warnings.length) {
      console.log('');
      console.log('  ⚠ Cần lưu ý:');
      for (const warning of warnings) console.log(`    • ${warning}`);
    }
    console.log('');
  });

  const shutdown = (signal) => {
    console.log(`\n${signal} - đang đóng server...`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 5000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('Không khởi động được server:', error.message);
  process.exit(1);
});
