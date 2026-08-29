/**
 * schemas.js - khai bao cau truc form cho tung nhanh noi dung.
 * Muon them mot o nhap moi tren CMS: them mot dong o day, khong can sua code khac.
 */

import { createSectionView } from '../core/section-view.js';

const ANCHOR_OPTIONS = [
  { value: '#trang-chu', label: 'Trang chủ' },
  { value: '#dich-vu', label: 'Dịch vụ' },
  { value: '#san-pham', label: 'Sản phẩm' },
  { value: '#gioi-thieu', label: 'Giới thiệu' },
  { value: '#hinh-anh', label: 'Hình ảnh thực tế' },
  { value: '#lien-he', label: 'Liên hệ' },
];

/**
 * Bộ biểu tượng có sẵn. Tên phải trùng khóa trong public/assets/js/core/icons.js
 * — có test canh việc này, thêm icon mới mà quên khai báo ở đây sẽ bị báo lỗi.
 */
const ICON_OPTIONS = [
  { value: 'scale', label: 'Cân' },
  { value: 'blueprint', label: 'Bản vẽ' },
  { value: 'build', label: 'Thi công' },
  { value: 'verify', label: 'Kiểm định' },
  { value: 'support', label: 'Hỗ trợ (tai nghe)' },
  { value: 'phone', label: 'Điện thoại' },
  { value: 'mail', label: 'Email' },
  { value: 'pin', label: 'Địa chỉ (ghim bản đồ)' },
  { value: 'clock', label: 'Đồng hồ' },
  { value: 'check', label: 'Dấu tích' },
  { value: 'chat', label: 'Bong bóng chat' },
  { value: 'zalo', label: 'Zalo' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'link', label: 'Liên kết' },
  { value: 'arrow', label: 'Mũi tên' },
];

/** Như trên, thêm lựa chọn "để hệ thống tự chọn" ở đầu danh sách. */
const ICON_OPTIONS_AUTO = [{ value: '', label: '— Mặc định theo loại kênh —' }, ...ICON_OPTIONS];

/**
 * Nhắc về ký tự đại diện, dán vào `hint` của những màn hình nhiều chữ.
 * Xử lý ở public/assets/js/core/tokens.js.
 */
const TOKEN_HINT =
  'Mẹo: gõ {brand} để chèn tên thương hiệu ngắn, {company} cho tên đầy đủ, {year} cho năm hiện tại. ' +
  'Đổi tên ở Cấu hình chung là mọi chỗ đổi theo.';

/**
 * Cặp ô "chọn biểu tượng": một danh sách icon có sẵn + một ô tải ảnh riêng.
 * Có ảnh riêng thì ảnh thắng, dùng khi cần đúng logo thương hiệu (Zalo, Viber…).
 */
const iconPair = (path, label, options = ICON_OPTIONS) => [
  { path, label, type: 'icon', options },
  {
    path: `${path}Image`,
    label: `${label} - ảnh riêng`,
    type: 'image',
    help: 'Có ảnh thì dùng ảnh thay cho biểu tượng bên cạnh. Nên dùng ảnh vuông, nền trong suốt (.svg hoặc .png).',
  },
];

const ctaFields = (prefix, label) => ({
  type: 'group',
  label,
  columns: 2,
  fields: [
    { path: `${prefix}.label`, label: 'Nhãn nút', type: 'text' },
    { path: `${prefix}.target`, label: 'Liên kết đến', type: 'text', placeholder: '#san-pham hoặc https://…' },
  ],
});

/* ==================== 1. Cấu hình chung ==================== */
export const generalView = createSectionView({
  section: 'settings',
  title: 'Cấu hình chung',
  description: 'Tên web, logo, màu thương hiệu, menu và nhãn giao diện',
  hint:
    'Trong BẤT KỲ ô chữ nào trên CMS, gõ {brand} để chèn tên thương hiệu ngắn, ' +
    '{company} để chèn tên hiển thị đầy đủ, {year} để chèn năm hiện tại. ' +
    'Ví dụ: "Vì sao chọn {brand}". Đổi tên một lần ở đây là mọi chỗ đổi theo.',
  groups: [
    {
      title: 'Nhận diện thương hiệu',
      columns: 2,
      fields: [
        { path: 'siteName', label: 'Tên hiển thị', type: 'text' },
        {
          path: 'brandName',
          label: 'Tên thương hiệu ngắn',
          type: 'text',
          help: 'Dùng cho những câu đọc thành lời như "Vì sao chọn {brand}". Bỏ trống thì dùng Tên hiển thị.',
        },
        { path: 'siteTagline', label: 'Khẩu hiệu', type: 'text' },
        { path: 'logo', label: 'Logo', type: 'image' },
        { path: 'favicon', label: 'Favicon', type: 'image' },
        {
          path: 'placeholderImage',
          label: 'Ảnh mặc định',
          type: 'image',
          help: 'Dùng khi một mục chưa có hình riêng',
        },
        { path: 'logoAlt', label: 'Mô tả logo (alt)', type: 'text' },
        { path: 'themeColor', label: 'Màu thương hiệu', type: 'color' },
        { path: 'accentColor', label: 'Màu chữ chính', type: 'color' },
      ],
    },
    {
      title: 'SEO',
      columns: 2,
      fields: [
        {
          path: 'siteUrl',
          label: 'Địa chỉ website',
          type: 'text',
          width: 'full',
          placeholder: 'https://tenmiencuaban.com',
          help:
            'Tên miền thật của website. Nút "Xem website" sẽ mở địa chỉ này, và Google dùng nó ' +
            'làm địa chỉ chuẩn (canonical) + sitemap. Bỏ trống thì lấy theo địa chỉ đang mở.',
        },
        { path: 'siteTitle', label: 'Tiêu đề web (title)', type: 'text', width: 'full' },
        { path: 'siteDescription', label: 'Mô tả trang', type: 'textarea', width: 'full', rows: 3 },
        { path: 'keywords', label: 'Từ khóa', type: 'text', width: 'full', help: 'Ngăn cách bằng dấu phẩy' },
      ],
    },
    {
      title: 'Thanh điều hướng',
      fields: [
        {
          type: 'group',
          label: 'Nút kêu gọi trên header',
          columns: 3,
          fields: [
            { path: 'headerCta.enabled', label: 'Hiện nút', type: 'toggle' },
            { path: 'headerCta.label', label: 'Nhãn nút', type: 'text' },
            { path: 'headerCta.target', label: 'Liên kết', type: 'select', options: ANCHOR_OPTIONS },
          ],
        },
        {
          type: 'repeater',
          path: 'nav',
          label: 'Menu chính',
          addLabel: 'Thêm mục menu',
          itemLabelKey: 'label',
          columns: 3,
          defaults: { label: 'Mục mới', target: '#trang-chu', enabled: true },
          fields: [
            { path: 'label', label: 'Nhãn', type: 'text' },
            { path: 'target', label: 'Cuộn tới', type: 'select', options: ANCHOR_OPTIONS },
            { path: 'enabled', label: 'Hiển thị', type: 'toggle' },
          ],
        },
      ],
    },
    {
      title: 'Trang quản trị (CMS)',
      description: 'Nhận diện của chính trang /cms — không hiển thị trên website.',
      columns: 2,
      fields: [
        {
          path: 'cms.logo',
          label: 'Logo thanh bên',
          type: 'image',
          help: 'Để trống thì dùng favicon, rồi tới logo chung',
        },
        {
          path: 'cms.loginLogo',
          label: 'Logo màn đăng nhập',
          type: 'image',
          help: 'Để trống thì dùng logo chung',
        },
        { path: 'cms.title', label: 'Tên hiển thị cạnh logo', type: 'text', placeholder: 'CMS' },
        { path: 'cms.tabTitle', label: 'Tiêu đề tab trình duyệt', type: 'text' },
        { path: 'cms.loginTitle', label: 'Tiêu đề màn đăng nhập', type: 'text' },
        { path: 'cms.loginSubtitle', label: 'Dòng phụ màn đăng nhập', type: 'text' },
      ],
    },
    {
      title: 'Nhãn giao diện',
      description: 'Toàn bộ chữ cố định trên trang: nút, nhãn ô nhập, thông báo. Để trống sẽ dùng lại chữ mặc định.',
      columns: 2,
      fields: [
        { path: 'labels.productDetail', label: 'Nút xem chi tiết sản phẩm', type: 'text' },
        { path: 'labels.productQuote', label: 'Nút yêu cầu báo giá', type: 'text' },
        { path: 'labels.productSpecsTitle', label: 'Tiêu đề bảng thông số', type: 'text' },
        { path: 'labels.productEmpty', label: 'Khi danh mục trống', type: 'text' },
        { path: 'labels.mapDirections', label: 'Liên kết chỉ đường', type: 'text' },
        { path: 'labels.modalClose', label: 'Nút đóng cửa sổ', type: 'text' },
        { path: 'labels.contactAddress', label: 'Nhãn "Địa chỉ"', type: 'text' },
        { path: 'labels.contactPhone', label: 'Nhãn "Điện thoại"', type: 'text' },
        { path: 'labels.contactEmail', label: 'Nhãn "Email"', type: 'text' },
        { path: 'labels.contactHours', label: 'Nhãn "Giờ làm việc"', type: 'text' },
        { path: 'labels.formName', label: 'Ô nhập họ tên', type: 'text' },
        { path: 'labels.formPhone', label: 'Ô nhập điện thoại', type: 'text' },
        { path: 'labels.formEmail', label: 'Ô nhập email', type: 'text' },
        { path: 'labels.formCompany', label: 'Ô nhập công ty', type: 'text' },
        { path: 'labels.formSubject', label: 'Ô chọn nhu cầu', type: 'text' },
        { path: 'labels.formContent', label: 'Ô nhập nội dung', type: 'text' },
        { path: 'labels.formContentPlaceholder', label: 'Gợi ý trong ô nội dung', type: 'text', width: 'full' },
        { path: 'labels.formSubmit', label: 'Nút gửi', type: 'text' },
        { path: 'labels.formSubmitting', label: 'Nút gửi khi đang xử lý', type: 'text' },
        { path: 'labels.formSuccessTitle', label: 'Tiêu đề sau khi gửi', type: 'text' },
        { path: 'labels.formError', label: 'Báo lỗi khi gửi hỏng', type: 'text' },
        { path: 'labels.formNote', label: 'Ghi chú dưới form', type: 'textarea', width: 'full', rows: 2 },
        { path: 'labels.footerTaxPrefix', label: 'Tiền tố mã số thuế', type: 'text' },
        { path: 'labels.heroEmpty', label: 'Khi đầu trang chưa có nội dung', type: 'text' },
        { path: 'labels.loadError', label: 'Báo lỗi khi tải trang hỏng', type: 'text', width: 'full' },
        { path: 'labels.skipLink', label: 'Liên kết bỏ qua (trợ năng)', type: 'text' },
        { path: 'labels.navAria', label: 'Mô tả menu (trợ năng)', type: 'text' },
        { path: 'labels.menuOpen', label: 'Nút mở menu (trợ năng)', type: 'text' },
        { path: 'labels.heroPause', label: 'Nút tạm dừng slide', type: 'text' },
        { path: 'labels.heroPlay', label: 'Nút chạy tiếp slide', type: 'text' },
        { path: 'labels.productFilterAria', label: 'Mô tả thanh lọc (trợ năng)', type: 'text' },
      ],
    },
  ],
});

/* ============ 1c. Chế độ bảo trì ============ */
export const maintenanceView = createSectionView({
  section: 'settings',
  title: 'Chế độ bảo trì',
  description: 'Tạm đóng website với khách, giữ nguyên đường vào trang quản trị',
  hint:
    'Bật lên thì MỌI khách vào website đều thấy trang bảo trì — kể cả bạn. ' +
    'Trang quản trị này vẫn vào được bình thường để tắt lại. ' +
    'Thông tin liên hệ lấy từ mục "Liên hệ & bản đồ". ' +
    TOKEN_HINT,
  groups: [
    {
      title: 'Bật / tắt',
      fields: [
        {
          path: 'maintenance.enabled',
          label: 'Bật chế độ bảo trì',
          type: 'toggle',
          help:
            'Khách sẽ thấy trang bảo trì và máy chủ trả mã 503 — Google hiểu là "tạm nghỉ, quay lại sau" ' +
            'nên không bị tụt thứ hạng tìm kiếm.',
        },
      ],
    },
    {
      title: 'Nội dung trang bảo trì',
      columns: 2,
      fields: [
        { path: 'maintenance.title', label: 'Tiêu đề', type: 'text', width: 'full' },
        {
          path: 'maintenance.message',
          label: 'Lời nhắn',
          type: 'textarea',
          width: 'full',
          rows: 3,
        },
        { path: 'maintenance.showLogo', label: 'Hiện logo công ty', type: 'toggle' },
        { path: 'maintenance.showContact', label: 'Hiện cách liên hệ', type: 'toggle' },
        {
          path: 'maintenance.contactNote',
          label: 'Dòng dẫn trước phần liên hệ',
          type: 'text',
          width: 'full',
          help: 'Khách đang cần báo giá vẫn gọi được ngay — không mất khách trong lúc bảo trì.',
        },
      ],
    },
  ],
});

/* ============ 1b. Chân trang & credit ============ */
export const footerView = createSectionView({
  section: 'settings',
  title: 'Chân trang & credit',
  description: 'Toàn bộ phần cuối trang: logo, giới thiệu, cột liên kết, bản quyền, dòng credit',
  hint:
    'Thông tin liên hệ ở cột đầu lấy từ mục "Liên hệ & bản đồ" — ở đây chỉ chọn hiện hay ẩn từng dòng. ' +
    TOKEN_HINT,
  groups: [
    {
      title: 'Bố cục chung',
      columns: 2,
      fields: [
        { path: 'footer.enabled', label: 'Hiển thị chân trang', type: 'toggle' },
        {
          path: 'footer.theme',
          label: 'Tông màu',
          type: 'select',
          options: [
            { value: 'dark', label: 'Nền tối — chữ trắng' },
            { value: 'light', label: 'Nền sáng — chữ đen' },
          ],
        },
        { path: 'footer.showLogo', label: 'Hiện logo', type: 'toggle' },
        {
          path: 'footer.logo',
          label: 'Logo riêng cho chân trang',
          type: 'image',
          help: 'Để trống thì dùng logo chung',
        },
        { path: 'footer.about', label: 'Giới thiệu ngắn', type: 'textarea', width: 'full', rows: 3 },
      ],
    },
    {
      title: 'Thông tin liên hệ ở chân trang',
      columns: 2,
      fields: [
        { path: 'footer.contact.enabled', label: 'Hiện khối liên hệ', type: 'toggle' },
        { path: 'footer.contact.showPhone', label: 'Hiện số điện thoại', type: 'toggle' },
        { path: 'footer.contact.showEmail', label: 'Hiện email', type: 'toggle' },
        { path: 'footer.contact.showAddress', label: 'Hiện địa chỉ', type: 'toggle' },
      ],
    },
    {
      title: 'Các cột liên kết',
      fields: [
        {
          type: 'repeater',
          path: 'footer.columns',
          label: 'Danh sách cột',
          addLabel: 'Thêm cột',
          itemLabelKey: 'title',
          defaults: { title: 'Cột mới', links: [] },
          fields: [
            { path: 'title', label: 'Tiêu đề cột', type: 'text' },
            {
              type: 'repeater',
              path: 'links',
              label: 'Liên kết',
              addLabel: 'Thêm liên kết',
              itemLabelKey: 'label',
              columns: 2,
              defaults: { label: 'Liên kết mới', url: '#trang-chu' },
              fields: [
                { path: 'label', label: 'Nhãn', type: 'text' },
                { path: 'url', label: 'URL', type: 'text' },
              ],
            },
          ],
        },
      ],
    },
    {
      title: 'Dòng đáy trang',
      columns: 2,
      fields: [
        { path: 'footer.copyright', label: 'Dòng bản quyền', type: 'text', width: 'full' },
        { path: 'footer.showTaxCode', label: 'Hiện mã số thuế', type: 'toggle' },
        {
          type: 'repeater',
          path: 'footer.bottomLinks',
          label: 'Liên kết nhỏ ở đáy',
          addLabel: 'Thêm liên kết',
          itemLabelKey: 'label',
          columns: 2,
          defaults: { label: 'Liên kết mới', url: '#lien-he' },
          fields: [
            { path: 'label', label: 'Nhãn', type: 'text' },
            { path: 'url', label: 'URL', type: 'text' },
          ],
        },
      ],
    },
    {
      title: 'Credit — đơn vị thiết kế',
      columns: 2,
      fields: [
        { path: 'footer.credit.enabled', label: 'Hiện dòng credit', type: 'toggle' },
        { path: 'footer.credit.text', label: 'Chữ dẫn', type: 'text', placeholder: 'Thiết kế & phát triển bởi' },
        { path: 'footer.credit.name', label: 'Tên đơn vị', type: 'text' },
        {
          path: 'footer.credit.url',
          label: 'Liên kết',
          type: 'text',
          help: 'Để trống thì tên không thành liên kết',
          placeholder: 'https://...',
        },
      ],
    },
  ],
});

/* ==================== 2. Hero (video / slideshow) ==================== */
export const heroView = createSectionView({
  section: 'hero',
  title: 'Khu vực đầu trang',
  description: 'Chọn hiển thị video nền hoặc slideshow ảnh',
  hint:
    'Đổi "Kiểu hiển thị" để chuyển giữa video và slideshow. Tiêu đề slide hỗ trợ xuống dòng bằng phím Enter. ' +
    TOKEN_HINT,
  groups: [
    {
      title: 'Kiểu hiển thị',
      columns: 3,
      fields: [
        {
          path: 'mode',
          label: 'Kiểu hiển thị',
          type: 'select',
          options: [
            { value: 'slideshow', label: 'Slideshow ảnh' },
            { value: 'video', label: 'Video nền' },
          ],
        },
        { path: 'intervalMs', label: 'Thời gian mỗi slide (ms)', type: 'number', min: 2000 },
        { path: 'autoplay', label: 'Tự động chạy', type: 'toggle' },
      ],
    },
    {
      title: 'Video nền',
      description: 'Chỉ áp dụng khi kiểu hiển thị là Video',
      columns: 2,
      fields: [
        { path: 'video.src', label: 'Tệp video (mp4/webm)', type: 'video', width: 'full' },
        { path: 'video.poster', label: 'Ảnh chờ (poster)', type: 'image' },
        {
          path: 'video.theme',
          label: 'Tông chữ',
          type: 'select',
          options: [
            { value: 'light', label: 'Nền sáng - chữ đen' },
            { value: 'dark', label: 'Nền tối - chữ trắng' },
          ],
        },
        { path: 'video.muted', label: 'Tắt tiếng', type: 'toggle' },
        { path: 'video.loop', label: 'Lặp lại', type: 'toggle' },
        { path: 'video.showControls', label: 'Hiện thanh điều khiển', type: 'toggle' },
        { path: 'video.eyebrow', label: 'Dòng nhỏ phía trên', type: 'text' },
        { path: 'video.title', label: 'Tiêu đề lớn', type: 'textarea', width: 'full', rows: 2 },
        { path: 'video.subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
        ctaFields('video.primaryCta', 'Nút chính'),
        ctaFields('video.secondaryCta', 'Nút phụ'),
      ],
    },
    {
      title: 'Slideshow',
      fields: [
        {
          type: 'repeater',
          path: 'slides',
          label: 'Danh sách slide',
          addLabel: 'Thêm slide',
          itemLabelKey: 'eyebrow',
          columns: 2,
          defaults: {
            image: '/assets/img/hero-1.svg',
            eyebrow: 'Nhãn slide',
            title: 'Tiêu đề slide',
            subtitle: '',
            theme: 'light',
            align: 'left',
            primaryCta: { label: 'Xem thêm', target: '#san-pham' },
            secondaryCta: { label: '', target: '' },
            enabled: true,
          },
          fields: [
            { path: 'image', label: 'Ảnh nền', type: 'image', width: 'full' },
            { path: 'eyebrow', label: 'Dòng nhỏ', type: 'text' },
            { path: 'enabled', label: 'Hiển thị slide', type: 'toggle' },
            { path: 'title', label: 'Tiêu đề (Enter để xuống dòng)', type: 'textarea', width: 'full', rows: 2 },
            { path: 'subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
            {
              path: 'theme',
              label: 'Tông chữ',
              type: 'select',
              options: [
                { value: 'light', label: 'Nền sáng - chữ đen' },
                { value: 'dark', label: 'Nền tối - chữ trắng' },
              ],
            },
            {
              path: 'align',
              label: 'Căn nội dung',
              type: 'select',
              options: [
                { value: 'left', label: 'Trái' },
                { value: 'center', label: 'Giữa' },
              ],
            },
            ctaFields('primaryCta', 'Nút chính'),
            ctaFields('secondaryCta', 'Nút phụ'),
          ],
        },
      ],
    },
  ],
});

/* ==================== 3. Trang chủ ==================== */
export const homeView = createSectionView({
  section: 'home',
  title: 'Nội dung trang chủ',
  description: 'Con số nổi bật, dịch vụ, điểm mạnh và dải kêu gọi hành động',
  hint: TOKEN_HINT,
  groups: [
    {
      title: 'Dải con số',
      fields: [
        { path: 'stats.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        {
          type: 'repeater',
          path: 'stats.items',
          label: 'Các con số',
          addLabel: 'Thêm con số',
          itemLabelKey: 'label',
          columns: 3,
          defaults: { value: '100', suffix: '+', label: 'Nhãn' },
          fields: [
            { path: 'value', label: 'Giá trị', type: 'text' },
            { path: 'suffix', label: 'Hậu tố', type: 'text' },
            { path: 'label', label: 'Nhãn', type: 'text' },
          ],
        },
      ],
    },
    {
      title: 'Dịch vụ',
      columns: 2,
      fields: [
        { path: 'services.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        { path: 'services.anchor', label: 'Mã neo (anchor)', type: 'text', help: 'Dùng cho liên kết #' },
        { path: 'services.eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'services.title', label: 'Tiêu đề', type: 'text' },
        { path: 'services.subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
        {
          type: 'repeater',
          path: 'services.items',
          label: 'Danh sách dịch vụ',
          addLabel: 'Thêm dịch vụ',
          itemLabelKey: 'title',
          columns: 2,
          defaults: { icon: 'scale', title: 'Dịch vụ mới', description: '' },
          fields: [
            { path: 'icon', label: 'Biểu tượng', type: 'icon', options: ICON_OPTIONS },
            { path: 'title', label: 'Tên dịch vụ', type: 'text' },
            { path: 'description', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
          ],
        },
      ],
    },
    {
      title: 'Điểm mạnh',
      columns: 2,
      fields: [
        { path: 'features.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        { path: 'features.eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'features.title', label: 'Tiêu đề', type: 'text', width: 'full' },
        {
          type: 'repeater',
          path: 'features.items',
          label: 'Danh sách điểm mạnh',
          addLabel: 'Thêm mục',
          itemLabelKey: 'title',
          columns: 2,
          defaults: { title: 'Điểm mạnh mới', description: '', image: '/assets/img/feature-1.svg' },
          fields: [
            { path: 'image', label: 'Hình ảnh', type: 'image', width: 'full' },
            { path: 'title', label: 'Tiêu đề', type: 'text' },
            { path: 'description', label: 'Mô tả', type: 'textarea', rows: 2 },
          ],
        },
      ],
    },
    {
      title: 'Hình ảnh thực tế',
      description: 'Slideshow ảnh thi công, công trình đã bàn giao',
      columns: 2,
      fields: [
        { path: 'gallery.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        { path: 'gallery.anchor', label: 'Mã neo (anchor)', type: 'text', help: 'Dùng cho liên kết #' },
        { path: 'gallery.eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'gallery.title', label: 'Tiêu đề', type: 'text' },
        { path: 'gallery.subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
        { path: 'gallery.autoplay', label: 'Tự động chuyển ảnh', type: 'toggle' },
        { path: 'gallery.intervalMs', label: 'Mỗi ảnh hiện (mili giây)', type: 'number', min: 1500 },
        { path: 'gallery.showThumbs', label: 'Hiện dải ảnh nhỏ bên dưới', type: 'toggle' },
        { path: 'gallery.showCaption', label: 'Hiện chú thích trên ảnh', type: 'toggle' },
        {
          type: 'repeater',
          path: 'gallery.items',
          label: 'Danh sách ảnh',
          addLabel: 'Thêm ảnh',
          itemLabelKey: 'caption',
          columns: 2,
          defaults: { image: '', caption: '', enabled: true },
          fields: [
            { path: 'image', label: 'Ảnh', type: 'image', width: 'full' },
            { path: 'caption', label: 'Chú thích', type: 'text' },
            { path: 'enabled', label: 'Hiển thị', type: 'toggle' },
          ],
        },
      ],
    },
    {
      title: 'Dải kêu gọi hành động',
      columns: 2,
      fields: [
        { path: 'cta.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        {
          path: 'cta.theme',
          label: 'Tông màu',
          type: 'select',
          options: [
            { value: 'light', label: 'Nền sáng — chữ đen' },
            { value: 'brand', label: 'Nền xanh thương hiệu — chữ trắng' },
            { value: 'dark', label: 'Nền tối — chữ trắng' },
          ],
        },
        { path: 'cta.image', label: 'Ảnh nền mờ', type: 'image' },
        { path: 'cta.title', label: 'Tiêu đề', type: 'text', width: 'full' },
        { path: 'cta.subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
        { path: 'cta.buttonLabel', label: 'Nhãn nút', type: 'text' },
        { path: 'cta.buttonTarget', label: 'Liên kết', type: 'select', options: ANCHOR_OPTIONS },
      ],
    },
  ],
});

/* ==================== 4. Giới thiệu ==================== */
export const aboutView = createSectionView({
  section: 'about',
  title: 'Giới thiệu công ty',
  description: 'Câu chuyện, giá trị, dấu mốc và chứng nhận',
  hint: TOKEN_HINT,
  groups: [
    {
      title: 'Nội dung chính',
      columns: 2,
      fields: [
        { path: 'eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'title', label: 'Tiêu đề', type: 'text' },
        { path: 'lead', label: 'Đoạn mở đầu', type: 'textarea', width: 'full', rows: 3 },
        {
          path: 'body',
          label: 'Các đoạn nội dung',
          type: 'stringlist',
          width: 'full',
          rows: 8,
          help: 'Mỗi dòng là một đoạn văn riêng.',
        },
        { path: 'image', label: 'Hình ảnh', type: 'image' },
        { path: 'imageCaption', label: 'Chú thích ảnh', type: 'text' },
      ],
    },
    {
      title: 'Giá trị cốt lõi',
      fields: [
        {
          type: 'repeater',
          path: 'values',
          label: 'Giá trị',
          addLabel: 'Thêm giá trị',
          itemLabelKey: 'title',
          columns: 2,
          defaults: { title: 'Giá trị mới', description: '' },
          fields: [
            { path: 'title', label: 'Tiêu đề', type: 'text' },
            { path: 'description', label: 'Mô tả', type: 'text' },
          ],
        },
      ],
    },
    {
      title: 'Dấu mốc phát triển',
      fields: [
        {
          type: 'repeater',
          path: 'milestones',
          label: 'Dấu mốc',
          addLabel: 'Thêm dấu mốc',
          itemLabelKey: 'year',
          columns: 3,
          defaults: { year: '2026', title: 'Sự kiện', description: '' },
          fields: [
            { path: 'year', label: 'Năm', type: 'text' },
            { path: 'title', label: 'Tiêu đề', type: 'text' },
            { path: 'description', label: 'Mô tả', type: 'text' },
          ],
        },
      ],
    },
    {
      title: 'Chứng nhận',
      columns: 2,
      fields: [
        { path: 'certificates.enabled', label: 'Hiển thị khối này', type: 'toggle' },
        { path: 'certificates.title', label: 'Tiêu đề', type: 'text' },
        {
          type: 'repeater',
          path: 'certificates.items',
          label: 'Danh sách chứng nhận',
          addLabel: 'Thêm chứng nhận',
          itemLabelKey: 'label',
          defaults: { label: 'Chứng nhận mới' },
          fields: [{ path: 'label', label: 'Tên chứng nhận', type: 'text' }],
        },
      ],
    },
  ],
});

/* ==================== 5. Liên hệ ==================== */
export const contactView = createSectionView({
  section: 'contact',
  title: 'Thông tin liên hệ',
  description: 'Địa chỉ, hotline, chi nhánh, bản đồ và form báo giá',
  hint: 'Bản đồ mặc định tự sinh từ địa chỉ. Nếu muốn dùng mã nhúng riêng của Google Maps, đổi "Nguồn bản đồ" sang "Mã nhúng" và dán URL trong thẻ iframe src.',
  groups: [
    {
      title: 'Tiêu đề khu vực',
      columns: 2,
      fields: [
        { path: 'eyebrow', label: 'Dòng nhỏ', type: 'text' },
        { path: 'title', label: 'Tiêu đề', type: 'text' },
        { path: 'subtitle', label: 'Mô tả', type: 'textarea', width: 'full', rows: 2 },
      ],
    },
    {
      title: 'Thông tin doanh nghiệp',
      columns: 2,
      fields: [
        { path: 'companyName', label: 'Tên công ty', type: 'text', width: 'full' },
        { path: 'address', label: 'Địa chỉ', type: 'text', width: 'full' },
        { path: 'addressNote', label: 'Ghi chú địa chỉ', type: 'text' },
        { path: 'workingHours', label: 'Giờ làm việc', type: 'text' },
        { path: 'phone', label: 'Điện thoại', type: 'text' },
        { path: 'hotline', label: 'Hotline', type: 'text' },
        { path: 'email', label: 'Email', type: 'text', inputType: 'email' },
        { path: 'taxCode', label: 'Mã số thuế', type: 'text' },
      ],
    },
    {
      title: 'Danh bạ liên hệ',
      description:
        'Mỗi dòng ghi rõ ai phụ trách số nào — ví dụ "Bộ phận kinh doanh · Anh Tuấn · 0939 292 845". ' +
        'Thêm bao nhiêu dòng cũng được.',
      fields: [
        {
          path: 'showBasicRows',
          label: 'Vẫn hiện các dòng Điện thoại / Hotline / Email ở trên',
          type: 'toggle',
          width: 'full',
          help: 'Tắt đi khi đã khai đủ trong danh bạ, để khỏi hiện trùng hai lần. Địa chỉ và giờ làm việc luôn hiện.',
        },
        {
          type: 'repeater',
          path: 'directory',
          label: 'Các đầu mối liên hệ',
          addLabel: 'Thêm đầu mối',
          itemLabelKey: 'label',
          columns: 2,
          defaults: { label: 'Bộ phận mới', person: '', type: 'phone', value: '', icon: '', iconImage: '', enabled: true },
          fields: [
            { path: 'label', label: 'Bộ phận / vai trò', type: 'text', placeholder: 'Bộ phận kinh doanh' },
            { path: 'person', label: 'Người phụ trách', type: 'text', placeholder: 'Anh Tuấn (bỏ trống cũng được)' },
            {
              path: 'type',
              label: 'Loại',
              type: 'select',
              options: [
                { value: 'phone', label: 'Điện thoại' },
                { value: 'email', label: 'Email' },
                { value: 'zalo', label: 'Zalo' },
                { value: 'link', label: 'Liên kết' },
                { value: 'text', label: 'Chỉ hiện chữ (không bấm được)' },
              ],
            },
            { path: 'enabled', label: 'Hiển thị', type: 'toggle' },
            {
              path: 'value',
              label: 'Số / địa chỉ',
              type: 'text',
              width: 'full',
              help: 'Điện thoại → số máy; Email → địa chỉ email; Zalo → số Zalo hoặc link; Liên kết → URL đầy đủ.',
            },
            ...iconPair('icon', 'Biểu tượng', ICON_OPTIONS_AUTO),
          ],
        },
      ],
    },
    {
      title: 'Biểu tượng từng dòng thông tin',
      description: 'Biểu tượng đứng trước Địa chỉ / Điện thoại / Email / Giờ làm việc',
      columns: 2,
      fields: [
        ...iconPair('icons.address', 'Địa chỉ'),
        ...iconPair('icons.phone', 'Điện thoại'),
        ...iconPair('icons.email', 'Email'),
        ...iconPair('icons.hours', 'Giờ làm việc'),
      ],
    },
    {
      title: 'Chi nhánh',
      fields: [
        {
          type: 'repeater',
          path: 'branches',
          label: 'Danh sách chi nhánh',
          addLabel: 'Thêm chi nhánh',
          itemLabelKey: 'name',
          columns: 3,
          defaults: { name: 'Chi nhánh mới', address: '', phone: '' },
          fields: [
            { path: 'name', label: 'Tên chi nhánh', type: 'text' },
            { path: 'address', label: 'Địa chỉ', type: 'text' },
            { path: 'phone', label: 'Điện thoại', type: 'text' },
          ],
        },
      ],
    },
    {
      title: 'Google Maps',
      columns: 2,
      fields: [
        { path: 'map.enabled', label: 'Hiển thị bản đồ', type: 'toggle' },
        {
          path: 'map.mode',
          label: 'Nguồn bản đồ',
          type: 'select',
          options: [
            { value: 'address', label: 'Tự sinh từ địa chỉ' },
            { value: 'embed', label: 'Mã nhúng riêng' },
          ],
        },
        { path: 'map.query', label: 'Địa chỉ tìm trên bản đồ', type: 'text', width: 'full' },
        {
          path: 'map.embedUrl',
          label: 'URL nhúng (iframe src)',
          type: 'text',
          width: 'full',
          placeholder: 'https://www.google.com/maps/embed?pb=…',
        },
        { path: 'map.zoom', label: 'Mức phóng to', type: 'number', min: 1, max: 21 },
        { path: 'map.height', label: 'Chiều cao (px)', type: 'number', min: 200 },
      ],
    },
    {
      title: 'Form nhận yêu cầu',
      columns: 2,
      fields: [
        { path: 'form.enabled', label: 'Hiển thị form', type: 'toggle' },
        { path: 'form.title', label: 'Tiêu đề form', type: 'text' },
        { path: 'form.successMessage', label: 'Thông báo sau khi gửi', type: 'textarea', width: 'full', rows: 2 },
        {
          path: 'form.subjects',
          label: 'Danh sách nhu cầu',
          type: 'stringlist',
          width: 'full',
          rows: 5,
          help: 'Mỗi dòng là một lựa chọn trong ô "Nhu cầu".',
        },
      ],
    },
  ],
});

/* ==================== 6. Nút liên hệ nổi ==================== */
export const floatingView = createSectionView({
  section: 'floatingContact',
  title: 'Nút liên hệ nổi',
  description: 'Nút chăm sóc khách hàng ở góc màn hình',
  hint: 'Giá trị nhập theo loại kênh: Điện thoại → số máy; Zalo → số Zalo hoặc link; Facebook → link m.me/…; Email → địa chỉ email; Tùy chỉnh → URL đầy đủ.',
  groups: [
    {
      title: 'Cấu hình chung',
      columns: 2,
      fields: [
        { path: 'enabled', label: 'Bật nút liên hệ nổi', type: 'toggle' },
        { path: 'showLabels', label: 'Hiện nhãn bên cạnh nút', type: 'toggle' },
        {
          path: 'position',
          label: 'Vị trí',
          type: 'select',
          options: [
            { value: 'right', label: 'Góc phải' },
            { value: 'left', label: 'Góc trái' },
          ],
        },
        { path: 'tooltip', label: 'Chú thích khi rê chuột', type: 'text' },
        { path: 'label', label: 'Nhãn ngắn', type: 'text' },
        { path: 'openLabel', label: 'Nhãn khi mở', type: 'text' },
      ],
    },
    {
      title: 'Bong bóng lời nhắn',
      description: 'Lời nhắn hiện cạnh nút để mời khách bấm vào',
      columns: 2,
      fields: [
        { path: 'bubble.enabled', label: 'Hiện bong bóng', type: 'toggle' },
        { path: 'bubble.dismissible', label: 'Có nút X để tắt', type: 'toggle' },
        { path: 'bubble.message', label: 'Nội dung lời nhắn', type: 'text', width: 'full' },
        {
          path: 'bubble.display',
          label: 'Cách hiển thị',
          type: 'select',
          options: [
            { value: 'always', label: 'Luôn hiện' },
            { value: 'autohide', label: 'Hiện rồi tự ẩn' },
            { value: 'once', label: 'Chỉ hiện một lần mỗi phiên' },
          ],
        },
        {
          path: 'bubble.style',
          label: 'Kiểu nền',
          type: 'select',
          options: [
            { value: 'glass', label: 'Kính mờ (thấy thoáng nội dung phía sau)' },
            { value: 'solid', label: 'Trắng đặc' },
          ],
        },
        { path: 'bubble.delayMs', label: 'Hiện sau (mili giây)', type: 'number', min: 0 },
        {
          path: 'bubble.autoHideMs',
          label: 'Tự ẩn sau (mili giây)',
          type: 'number',
          min: 0,
          help: 'Chỉ áp dụng khi chọn "Hiện rồi tự ẩn"',
        },
      ],
    },
    {
      title: 'Kênh liên hệ',
      fields: [
        {
          type: 'repeater',
          path: 'channels',
          label: 'Danh sách kênh',
          addLabel: 'Thêm kênh',
          itemLabelKey: 'label',
          columns: 2,
          defaults: { type: 'phone', label: 'Kênh mới', value: '', display: '', enabled: true },
          fields: [
            {
              path: 'type',
              label: 'Loại kênh',
              type: 'select',
              options: [
                { value: 'phone', label: 'Điện thoại' },
                { value: 'zalo', label: 'Zalo' },
                { value: 'facebook', label: 'Facebook Messenger' },
                { value: 'email', label: 'Email' },
                { value: 'custom', label: 'Tùy chỉnh' },
              ],
            },
            { path: 'enabled', label: 'Hiển thị', type: 'toggle' },
            ...iconPair('icon', 'Biểu tượng', ICON_OPTIONS_AUTO),
            { path: 'label', label: 'Nhãn (đọc màn hình)', type: 'text' },
            { path: 'display', label: 'Nhãn hiển thị', type: 'text' },
            { path: 'value', label: 'Giá trị / liên kết', type: 'text', width: 'full' },
          ],
        },
      ],
    },
  ],
});
