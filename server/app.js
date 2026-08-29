import path from 'node:path';
import express from 'express';
import cookieParser from 'cookie-parser';
import config, { PUBLIC_DIR, CMS_DIR } from './config.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { securityHeaders, originGuard, uploadHeaders, apiRateLimit } from './middleware/security.js';
import { resolveSiteUrl, sitemapHandler } from './lib/sitemap.js';
import { optionalAuth } from './middleware/auth.js';
import { maintenanceGuard } from './middleware/maintenance.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.disable('etag');
  // Chi tin X-Forwarded-For khi that su co proxy (xem TRUST_PROXY trong .env).
  // Bat bua bai se cho phep gia mao IP -> vuot gioi han dang nhap.
  app.set('trust proxy', config.trustProxy);
  app.set('query parser', 'simple');

  app.use(securityHeaders);

  // Chi nhan JSON va multipart (multer). Khong bat urlencoded de thu hep be mat
  // tan cong: form HTML tu trang khac khong the gui duoc du lieu doc duoc.
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  // Chan CSRF cho moi request thay doi du lieu
  app.use(originGuard);

  /**
   * Doc cookie phien SOM, truoc cong bao tri.
   * Bao tri can biet "co phai nguoi da dang nhap khong" de con cho CMS goi API;
   * optionalAuth khong bat buoc phai co cookie nen khong anh huong khach vang lai.
   */
  app.use(optionalAuth);

  // Cong bao tri: dat truoc MOI thu phuc vu noi dung, sau xac thuc va tep tinh
  app.use(maintenanceGuard);

  app.use('/api', apiRateLimit);

  app.use('/api', apiRoutes);

  // Tep nguoi dung tai len: phuc vu voi CSP sandbox de vo hieu hoa script (SVG doc hai)
  app.use(
    '/uploads',
    uploadHeaders,
    express.static(path.join(PUBLIC_DIR, 'uploads'), {
      maxAge: config.isProduction ? '30d' : 0,
      index: false,
      dotfiles: 'deny',
      setHeaders: (res) => res.setHeader('Content-Disposition', 'inline'),
    }),
  );

  // Giao dien CMS nam NGOAI thu muc public -> chi truy cap duoc qua dung duong dan cau hinh
  app.use(
    config.cmsPath,
    express.static(CMS_DIR, { index: false, dotfiles: 'deny', maxAge: 0, etag: false }),
  );

  // Khop chinh xac /cms va /cms/... - khong khop /cmsxyz
  app.get([config.cmsPath, `${config.cmsPath}/*`], (_req, res) => {
    res.sendFile(path.join(CMS_DIR, 'index.html'));
  });

  // Cho monitoring / PM2 / Nginx biet ung dung con song. Khong tiet lo gi ben trong.
  app.get('/healthz', (_req, res) => res.type('text/plain').send('ok'));

  app.get('/robots.txt', async (req, res) => {
    const base = await resolveSiteUrl(req);
    res
      .type('text/plain')
      .send(
        `User-agent: *\nDisallow: ${config.cmsPath}/\nDisallow: /api/\n\nSitemap: ${base}/sitemap.xml\n`,
      );
  });

  app.get('/sitemap.xml', sitemapHandler);

  // Trang cong khai
  app.use(
    express.static(PUBLIC_DIR, {
      extensions: ['html'],
      index: 'index.html',
      dotfiles: 'deny',
      maxAge: config.isProduction ? '1h' : 0,
    }),
  );

  app.use(notFoundHandler);

  // Fallback: chi tra index.html cho dieu huong trang, khong tra cho tep tinh thieu
  app.use((req, res, next) => {
    if (req.method !== 'GET' || !req.accepts('html') || path.extname(req.path)) return next();
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
  });

  app.use((_req, res) => res.status(404).send('404 - Khong tim thay trang'));

  app.use(errorHandler);

  return app;
}

export default createApp;
