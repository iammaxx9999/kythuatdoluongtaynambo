/**
 * Du lieu khoi tao cho website. Sau khi chay lan dau, moi thay doi
 * deu duoc luu vao server/data/db.json thong qua CMS.
 */

const IMG = '/assets/img';

export const defaultSettings = {
  siteTitle: 'Can Dien Tu Viet Phat',
  siteName: 'VIỆT PHÁT SCALE',

  /**
   * Tên thương hiệu NGẮN, dùng cho những câu đọc thành lời như "Vì sao chọn …".
   * Gõ {brand} vào bất kỳ ô chữ nào trên CMS là chỗ đó tự hiện tên này.
   * Bỏ trống thì lùi về siteName.
   */
  brandName: 'Việt Phát',

  /**
   * Địa chỉ thật của website, ví dụ https://candientutaynambo.com
   * Dùng cho nút "Xem website" trong CMS, thẻ canonical và sitemap.xml.
   * Bỏ trống thì lấy theo host đang mở — chạy được nhưng không tốt cho SEO.
   */
  siteUrl: '',

  /**
   * Chế độ bảo trì.
   *
   * Bật lên thì MỌI khách vào trang web đều thấy trang bảo trì — kể cả bạn.
   * Đường vào CMS vẫn mở bình thường, nếu không thì bật xong không tắt được nữa.
   */
  maintenance: {
    enabled: false,
    title: 'Website đang được bảo trì',
    message:
      'Chúng tôi đang nâng cấp hệ thống để phục vụ bạn tốt hơn. Vui lòng quay lại sau ít phút.',
    showLogo: true,
    showContact: true,
    contactNote: 'Cần hỗ trợ gấp? Liên hệ ngay với chúng tôi:',
  },

  siteTagline: 'Giải pháp cân điện tử công nghiệp trọn gói',
  siteDescription:
    'Việt Phát Scale chuyên cung cấp, thi công lắp đặt, kiểm định và bảo trì cân điện tử công nghiệp: cân ô tô, cân sàn, cân bàn, cân treo, cân băng tải định lượng trên toàn quốc.',
  keywords: 'cân điện tử, cân ô tô, cân sàn, cân bàn, lắp đặt cân, kiểm định cân, sửa chữa cân',
  logo: `${IMG}/logo.svg`,
  logoAlt: 'Logo Việt Phát Scale',
  favicon: `${IMG}/favicon.svg`,
  /** Ảnh dùng khi một mục chưa có hình riêng. */
  placeholderImage: `${IMG}/placeholder.svg`,
  themeColor: '#1428A0',
  accentColor: '#0F172A',
  headerCta: { label: 'Nhận báo giá', target: '#lien-he', enabled: true },
  nav: [
    { id: 'nav_home', label: 'Trang chủ', target: '#trang-chu', enabled: true },
    { id: 'nav_products', label: 'Sản phẩm', target: '#san-pham', enabled: true },
    { id: 'nav_about', label: 'Giới thiệu', target: '#gioi-thieu', enabled: true },
    { id: 'nav_contact', label: 'Liên hệ', target: '#lien-he', enabled: true },
  ],
  /**
   * Toàn bộ chữ cố định của giao diện (nút, nhãn form, thông báo…).
   * Sửa được trong CMS ▸ Cấu hình chung ▸ Nhãn giao diện.
   */
  labels: {
    skipLink: 'Bỏ qua đến nội dung chính',
    loading: 'Đang tải nội dung',
    loadError: 'Không tải được nội dung trang. Vui lòng tải lại.',
    navAria: 'Điều hướng chính',
    menuOpen: 'Mở menu',
    menuClose: 'Đóng menu',
    heroPause: 'Tạm dừng trình chiếu',
    heroPlay: 'Tiếp tục trình chiếu',
    heroEmpty: 'Chưa có nội dung cho khu vực đầu trang.',
    productFilterAria: 'Lọc theo danh mục',
    productDetail: 'Chi tiết',
    productEmpty: 'Chưa có sản phẩm trong danh mục này.',
    productSpecsTitle: 'Thông số kỹ thuật',
    productQuote: 'Yêu cầu báo giá',
    modalClose: 'Đóng',
    contactAddress: 'Địa chỉ',
    contactPhone: 'Điện thoại',
    contactEmail: 'Email',
    contactHours: 'Giờ làm việc',
    mapDirections: 'Chỉ đường',
    formName: 'Họ và tên',
    formPhone: 'Số điện thoại',
    formEmail: 'Email',
    formCompany: 'Công ty',
    formSubject: 'Nhu cầu',
    formContent: 'Nội dung',
    formContentPlaceholder: 'Mô tả loại cân, tải trọng, vị trí lắp đặt…',
    formSubmit: 'Gửi yêu cầu',
    formSubmitting: 'Đang gửi…',
    formNote: 'Thông tin của bạn chỉ dùng để liên hệ tư vấn, không chia sẻ cho bên thứ ba.',
    formSuccessTitle: 'Đã nhận yêu cầu',
    formError: 'Không gửi được, vui lòng thử lại',
    footerTaxPrefix: 'MST:',
  },

  /**
   * Nhận diện của chính trang quản trị (/cms).
   * Để trống logo thì tự dùng favicon / logo chung ở trên.
   */
  cms: {
    logo: '',
    loginLogo: '',
    title: 'CMS',
    tabTitle: 'CMS · Quản trị website',
    loginTitle: 'Đăng nhập quản trị',
    loginSubtitle: 'Quản lý nội dung website',
  },

  /**
   * Chân trang. Mọi thứ đều chỉnh trong CMS ▸ Chân trang & credit.
   * theme: 'dark' = nền đen chữ trắng | 'light' = nền sáng chữ đen
   */
  footer: {
    enabled: true,
    theme: 'dark',
    showLogo: true,
    /** Để trống thì dùng logo chung ở mục Nhận diện thương hiệu. */
    logo: '',
    about:
      'Việt Phát Scale - đơn vị thi công lắp đặt và bảo trì hệ thống cân điện tử công nghiệp cho nhà máy, cảng, mỏ và trạm trung chuyển trên toàn quốc.',

    /** Khối thông tin liên hệ ở cột đầu tiên, lấy dữ liệu từ mục Liên hệ. */
    contact: {
      enabled: true,
      showPhone: true,
      showEmail: true,
      showAddress: true,
    },

    // {year} tự lấy năm hiện tại nên dòng bản quyền không bao giờ bị cũ
    copyright: '© {year} {company}. Bảo lưu mọi quyền.',
    showTaxCode: true,

    /** Liên kết nhỏ ở đáy: chính sách, điều khoản… */
    bottomLinks: [
      { id: 'bl_1', label: 'Chính sách bảo mật', url: '#lien-he' },
      { id: 'bl_2', label: 'Điều khoản sử dụng', url: '#lien-he' },
    ],

    /** Dòng ghi công đơn vị thiết kế. */
    credit: {
      enabled: true,
      text: 'Thiết kế & phát triển bởi',
      name: 'S5 Tech',
      url: '',
    },

    columns: [
      {
        id: 'fc_1',
        title: 'Sản phẩm',
        links: [
          { id: 'fl_1', label: 'Cân ô tô điện tử', url: '#san-pham' },
          { id: 'fl_2', label: 'Cân sàn công nghiệp', url: '#san-pham' },
          { id: 'fl_3', label: 'Cân bàn - cân kỹ thuật', url: '#san-pham' },
          { id: 'fl_4', label: 'Cân băng tải định lượng', url: '#san-pham' },
        ],
      },
      {
        id: 'fc_2',
        title: 'Dịch vụ',
        links: [
          { id: 'fl_5', label: 'Thi công lắp đặt', url: '#dich-vu' },
          { id: 'fl_6', label: 'Kiểm định - hiệu chuẩn', url: '#dich-vu' },
          { id: 'fl_7', label: 'Bảo trì định kỳ', url: '#dich-vu' },
          { id: 'fl_8', label: 'Sửa chữa - nâng cấp', url: '#dich-vu' },
        ],
      },
      {
        id: 'fc_3',
        title: 'Hỗ trợ',
        links: [
          { id: 'fl_9', label: 'Yêu cầu báo giá', url: '#lien-he' },
          { id: 'fl_10', label: 'Hướng dẫn sử dụng', url: '#lien-he' },
          { id: 'fl_11', label: 'Chính sách bảo hành', url: '#lien-he' },
        ],
      },
    ],
  },
};

export const defaultHero = {
  mode: 'slideshow', // 'slideshow' | 'video'
  autoplay: true,
  intervalMs: 6000,
  video: {
    src: '',
    poster: `${IMG}/hero-1.svg`,
    loop: true,
    muted: true,
    showControls: false,
    theme: 'light',
    eyebrow: 'Việt Phát Scale',
    title: 'Cân chính xác. Vận hành yên tâm.',
    subtitle: 'Hệ thống cân ô tô 120 tấn lắp đặt trọn gói trong 7 ngày.',
    primaryCta: { label: 'Xem sản phẩm', target: '#san-pham' },
    secondaryCta: { label: 'Nhận tư vấn', target: '#lien-he' },
  },
  slides: [
    {
      id: 'slide_1',
      image: `${IMG}/hero-1.svg`,
      eyebrow: 'Cân ô tô điện tử',
      title: 'Cân chính xác.\nVận hành yên tâm.',
      subtitle: 'Tải trọng 30 - 150 tấn, sai số ≤ 0,02%, bàn cân thép chịu lực 20 năm.',
      theme: 'light',
      align: 'left',
      primaryCta: { label: 'Khám phá ngay', target: '#san-pham' },
      secondaryCta: { label: 'Nhận báo giá', target: '#lien-he' },
      enabled: true,
    },
    {
      id: 'slide_2',
      image: `${IMG}/hero-2.svg`,
      eyebrow: 'Thi công trọn gói',
      title: 'Từ nền móng\nđến phần mềm.',
      subtitle: 'Đội thi công riêng, bàn giao kèm hồ sơ kiểm định hợp chuẩn Đo lường Việt Nam.',
      theme: 'light',
      align: 'left',
      primaryCta: { label: 'Quy trình thi công', target: '#dich-vu' },
      secondaryCta: { label: 'Liên hệ kỹ sư', target: '#lien-he' },
      enabled: true,
    },
    {
      id: 'slide_3',
      image: `${IMG}/hero-3.svg`,
      eyebrow: 'Bảo trì 24/7',
      title: 'Có mặt trong 24 giờ.\nToàn quốc.',
      subtitle: 'Hợp đồng bảo trì định kỳ, kho linh kiện sẵn sàng tại 3 miền.',
      theme: 'light',
      align: 'left',
      primaryCta: { label: 'Gói bảo trì', target: '#dich-vu' },
      secondaryCta: { label: 'Gọi hotline', target: '#lien-he' },
      enabled: true,
    },
  ],
};

export const defaultHome = {
  stats: {
    enabled: true,
    title: 'Con số nói thay lời giới thiệu',
    items: [
      { id: 'st_1', value: '18', suffix: '+', label: 'Năm trong ngành cân' },
      { id: 'st_2', value: '2.400', suffix: '+', label: 'Hệ thống đã lắp đặt' },
      { id: 'st_3', value: '63', suffix: '', label: 'Tỉnh thành phủ dịch vụ' },
      { id: 'st_4', value: '24', suffix: 'h', label: 'Cam kết có mặt xử lý' },
    ],
  },
  services: {
    enabled: true,
    anchor: 'dich-vu',
    eyebrow: 'Dịch vụ',
    title: 'Trọn gói từ tư vấn tới bảo trì',
    subtitle:
      'Một đầu mối duy nhất cho toàn bộ vòng đời hệ thống cân của nhà máy bạn - không phải làm việc với nhiều nhà thầu.',
    items: [
      {
        id: 'sv_1',
        icon: 'blueprint',
        title: 'Khảo sát & thiết kế',
        description:
          'Kỹ sư đến tận nơi đo đạc mặt bằng, tính tải trọng, đề xuất cấu hình cân và bản vẽ móng miễn phí.',
      },
      {
        id: 'sv_2',
        icon: 'build',
        title: 'Thi công lắp đặt',
        description:
          'Đội thi công cơ khí - điện riêng, làm móng, lắp bàn cân, đấu nối loadcell và căn chỉnh tại chỗ.',
      },
      {
        id: 'sv_3',
        icon: 'verify',
        title: 'Kiểm định & hiệu chuẩn',
        description:
          'Phối hợp đơn vị đo lường được chỉ định, bàn giao kèm tem và giấy chứng nhận kiểm định hợp lệ.',
      },
      {
        id: 'sv_4',
        icon: 'support',
        title: 'Bảo trì & sửa chữa',
        description:
          'Gói bảo trì định kỳ 3/6/12 tháng, thay loadcell, đầu cân, nâng cấp phần mềm quản lý xe ra vào.',
      },
    ],
  },
  features: {
    enabled: true,
    // {brand} = tên thương hiệu ngắn trong Cấu hình chung — đổi một chỗ, đổi hết mọi nơi
    eyebrow: 'Vì sao chọn {brand}',
    title: 'Chuẩn xác trong từng kilogram',
    items: [
      {
        id: 'ft_1',
        title: 'Thiết bị chính hãng',
        description: 'Loadcell Keli, Mettler Toledo, Zemic - đầy đủ CO/CQ, bảo hành 24 tháng.',
        image: `${IMG}/feature-1.svg`,
      },
      {
        id: 'ft_2',
        title: 'Phần mềm quản lý riêng',
        description: 'Ghi nhận phiếu cân, camera, barrier, xuất báo cáo và kết nối ERP sẵn có.',
        image: `${IMG}/feature-2.svg`,
      },
      {
        id: 'ft_3',
        title: 'Bảo hành tận nơi',
        description: 'Kho linh kiện tại Hà Nội - Đà Nẵng - TP.HCM, xử lý sự cố trong vòng 24 giờ.',
        image: `${IMG}/feature-3.svg`,
      },
    ],
  },
  /** Khối ảnh thi công thực tế, hiển thị dạng slideshow. */
  gallery: {
    enabled: true,
    anchor: 'hinh-anh',
    eyebrow: 'Hình ảnh thực tế',
    title: 'Công trình đã bàn giao',
    subtitle:
      'Ảnh chụp tại công trường: làm móng, lắp bàn cân, đấu nối loadcell và nghiệm thu cùng khách hàng.',
    autoplay: true,
    intervalMs: 5000,
    showThumbs: true,
    showCaption: true,
    items: [
      {
        id: 'ga_1',
        image: `${IMG}/site-1.svg`,
        caption: 'Đổ móng cân ô tô 80 tấn — KCN Vsip 1, Bình Dương',
        enabled: true,
      },
      {
        id: 'ga_2',
        image: `${IMG}/site-2.svg`,
        caption: 'Cẩu và căn chỉnh bàn cân thép 18m',
        enabled: true,
      },
      {
        id: 'ga_3',
        image: `${IMG}/site-3.svg`,
        caption: 'Đấu nối loadcell và hộp nối tín hiệu',
        enabled: true,
      },
      {
        id: 'ga_4',
        image: `${IMG}/site-4.svg`,
        caption: 'Nghiệm thu bằng quả cân chuẩn cùng đơn vị kiểm định',
        enabled: true,
      },
    ],
  },

  cta: {
    enabled: true,
    /** theme: 'light' = nền sáng chữ đen | 'brand' = nền xanh chữ trắng | 'dark' = nền tối chữ trắng */
    theme: 'light',
    title: 'Cần tư vấn cấu hình cân cho nhà máy của bạn?',
    subtitle: 'Gửi yêu cầu, kỹ sư Việt Phát sẽ khảo sát và báo giá trong vòng 24 giờ làm việc.',
    buttonLabel: 'Nhận báo giá miễn phí',
    buttonTarget: '#lien-he',
    image: `${IMG}/cta.svg`,
  },
};

export const defaultAbout = {
  anchor: 'gioi-thieu',
  eyebrow: 'Giới thiệu công ty',
  title: 'Công ty TNHH Cân Điện Tử Việt Phát',
  lead:
    'Thành lập năm 2008, Việt Phát Scale đi lên từ một xưởng cơ khí nhỏ chuyên gia công bàn cân, đến nay trở thành nhà thầu trọn gói cho hệ thống cân công nghiệp tại hơn 2.400 nhà máy, cảng và trạm trung chuyển trên cả nước.',
  body: [
    'Chúng tôi tin rằng một hệ thống cân tốt không chỉ là thiết bị tốt. Nền móng đúng kỹ thuật, đấu nối chuẩn, phần mềm phù hợp quy trình và một đội bảo trì gọi là có mặt - đó mới là thứ giúp doanh nghiệp yên tâm cân hàng nghìn lượt xe mỗi tháng.',
    'Việt Phát sở hữu xưởng cơ khí 3.000m² tại Bình Dương, đội thi công cơ - điện 45 người và ba kho linh kiện đặt tại Hà Nội, Đà Nẵng, TP.HCM. Toàn bộ thiết bị đo lường đều có hồ sơ kiểm định hợp chuẩn theo quy định của Tổng cục Tiêu chuẩn Đo lường Chất lượng.',
  ],
  image: `${IMG}/about.svg`,
  imageCaption: 'Xưởng cơ khí Việt Phát - Bình Dương',
  milestones: [
    { id: 'ms_1', year: '2008', title: 'Thành lập', description: 'Xưởng gia công bàn cân đầu tiên tại Thuận An, Bình Dương.' },
    { id: 'ms_2', year: '2014', title: 'Mở rộng miền Bắc', description: 'Chi nhánh Hà Nội, phủ dịch vụ bảo trì toàn miền Bắc.' },
    { id: 'ms_3', year: '2019', title: 'Phần mềm cân xe', description: 'Ra mắt phần mềm quản lý phiếu cân tích hợp camera và barrier.' },
    { id: 'ms_4', year: '2024', title: '2.400 hệ thống', description: 'Cột mốc 2.400 hệ thống cân bàn giao trên 63 tỉnh thành.' },
  ],
  values: [
    { id: 'vl_1', title: 'Chính xác', description: 'Sai số công bố là sai số thực đo, có biên bản kiểm định đi kèm.' },
    { id: 'vl_2', title: 'Đúng hẹn', description: 'Cam kết tiến độ bằng hợp đồng, chậm ngày nào chịu phạt ngày đó.' },
    { id: 'vl_3', title: 'Bền bỉ', description: 'Bàn cân thép chịu lực thiết kế cho vòng đời tối thiểu 20 năm.' },
  ],
  certificates: {
    enabled: true,
    title: 'Chứng nhận & năng lực',
    items: [
      { id: 'cf_1', label: 'ISO 9001:2015' },
      { id: 'cf_2', label: 'Giấy chứng nhận đủ điều kiện kiểm định' },
      { id: 'cf_3', label: 'Đại lý ủy quyền Keli Việt Nam' },
      { id: 'cf_4', label: 'Chứng chỉ an toàn lao động nhóm 3' },
    ],
  },
};

export const defaultProductsSection = {
  anchor: 'san-pham',
  eyebrow: 'Sản phẩm',
  title: 'Giải pháp cân cho mọi tải trọng',
  subtitle: 'Từ cân phân tích 0,1mg trong phòng thí nghiệm đến cân ô tô 150 tấn ngoài trời.',
  showFilter: true,
  categories: [
    { id: 'cat_all', slug: 'tat-ca', name: 'Tất cả' },
    { id: 'cat_oto', slug: 'can-o-to', name: 'Cân ô tô' },
    { id: 'cat_san', slug: 'can-san', name: 'Cân sàn - cân bàn' },
    { id: 'cat_treo', slug: 'can-treo', name: 'Cân treo' },
    { id: 'cat_lab', slug: 'can-phan-tich', name: 'Cân phân tích' },
    { id: 'cat_auto', slug: 'he-thong-tu-dong', name: 'Hệ thống tự động' },
  ],
};

export const defaultProducts = [
  {
    id: 'p_oto_80',
    slug: 'can-o-to-dien-tu-80-tan',
    name: 'Cân ô tô điện tử 80 tấn',
    category: 'can-o-to',
    badge: 'Bán chạy',
    shortDescription:
      'Bàn cân thép 18m, 8 loadcell Keli QS, đầu cân A9 kèm phần mềm quản lý phiếu cân.',
    description:
      'Giải pháp tiêu chuẩn cho nhà máy xi măng, cảng và trạm trung chuyển nông sản. Bàn cân kết cấu thép hộp chịu lực, mạ kẽm nhúng nóng hoặc sơn epoxy hai lớp. Hệ thống đi kèm phần mềm ghi nhận phiếu cân, camera nhận diện biển số và barrier tự động.',
    price: 'Liên hệ',
    image: `${IMG}/product-1.svg`,
    gallery: [],
    specs: [
      { id: 'sp_1', key: 'Tải trọng tối đa', value: '80.000 kg' },
      { id: 'sp_2', key: 'Bước nhảy', value: '20 kg' },
      { id: 'sp_3', key: 'Kích thước bàn cân', value: '18.000 x 3.000 mm' },
      { id: 'sp_4', key: 'Loadcell', value: 'Keli QS-30t x 8' },
      { id: 'sp_5', key: 'Đầu cân', value: 'Keli A9 / Mettler Toledo IND231' },
      { id: 'sp_6', key: 'Bảo hành', value: '24 tháng' },
    ],
    featured: true,
    enabled: true,
    order: 1,
  },
  {
    id: 'p_oto_120',
    slug: 'can-o-to-dien-tu-120-tan',
    name: 'Cân ô tô điện tử 120 tấn',
    category: 'can-o-to',
    badge: '',
    shortDescription: 'Bàn cân 24m dành cho xe siêu trường siêu trọng, 12 loadcell hợp kim.',
    description:
      'Phiên bản tải trọng lớn cho mỏ đá, cảng biển và nhà máy thép. Kết cấu dầm chữ I chịu lực, sàn thép 12mm chống trượt, chịu được tần suất trên 300 lượt xe mỗi ngày.',
    price: 'Liên hệ',
    image: `${IMG}/product-2.svg`,
    gallery: [],
    specs: [
      { id: 'sp_7', key: 'Tải trọng tối đa', value: '120.000 kg' },
      { id: 'sp_8', key: 'Bước nhảy', value: '20 kg' },
      { id: 'sp_9', key: 'Kích thước bàn cân', value: '24.000 x 3.400 mm' },
      { id: 'sp_10', key: 'Loadcell', value: 'Zemic HM9B-40t x 12' },
      { id: 'sp_11', key: 'Kiểu lắp', value: 'Nổi hoặc chìm' },
    ],
    featured: true,
    enabled: true,
    order: 2,
  },
  {
    id: 'p_san_3t',
    slug: 'can-san-cong-nghiep-3-tan',
    name: 'Cân sàn công nghiệp 3 tấn',
    category: 'can-san',
    badge: '',
    shortDescription: 'Sàn 1,5 x 2m thép gân chống trượt, 4 loadcell chống nước IP68.',
    description:
      'Dùng cho kho hàng, xưởng sản xuất và khu vực bốc xếp pallet. Có thể lắp âm nền kèm dốc lên hoặc đặt nổi kèm cầu dẫn. Đầu cân hỗ trợ in phiếu và kết nối máy tính qua RS232/USB.',
    price: 'Liên hệ',
    image: `${IMG}/product-3.svg`,
    gallery: [],
    specs: [
      { id: 'sp_12', key: 'Tải trọng tối đa', value: '3.000 kg' },
      { id: 'sp_13', key: 'Bước nhảy', value: '0,5 kg' },
      { id: 'sp_14', key: 'Kích thước sàn', value: '1.500 x 2.000 mm' },
      { id: 'sp_15', key: 'Cấp bảo vệ', value: 'IP68' },
    ],
    featured: true,
    enabled: true,
    order: 3,
  },
  {
    id: 'p_ban_30kg',
    slug: 'can-ban-dien-tu-30kg',
    name: 'Cân bàn điện tử 30kg',
    category: 'can-san',
    badge: '',
    shortDescription: 'Cân đếm số lượng cho xưởng lắp ráp, độ phân giải 1/30.000.',
    description:
      'Mặt cân inox 304, hiển thị LCD ba cửa sổ (khối lượng - đơn trọng - số lượng), pin sạc dùng 60 giờ. Phù hợp kiểm đếm linh kiện, đóng gói và kiểm kho.',
    price: 'Liên hệ',
    image: `${IMG}/product-4.svg`,
    gallery: [],
    specs: [
      { id: 'sp_16', key: 'Tải trọng tối đa', value: '30 kg' },
      { id: 'sp_17', key: 'Bước nhảy', value: '1 g' },
      { id: 'sp_18', key: 'Mặt cân', value: 'Inox 304, 300 x 400 mm' },
      { id: 'sp_19', key: 'Nguồn', value: 'Pin sạc 6V / adapter' },
    ],
    featured: false,
    enabled: true,
    order: 4,
  },
  {
    id: 'p_treo_5t',
    slug: 'can-treo-dien-tu-5-tan',
    name: 'Cân treo điện tử 5 tấn',
    category: 'can-treo',
    badge: '',
    shortDescription: 'Cân móc cẩu OCS 5 tấn, màn hình LED đỏ 55mm, điều khiển từ xa 30m.',
    description:
      'Thiết kế cho nhà xưởng cơ khí, bãi phế liệu và cảng cá. Thân hợp kim nhôm đúc, móc xoay 360 độ có chốt an toàn, chống quá tải 150%.',
    price: 'Liên hệ',
    image: `${IMG}/product-5.svg`,
    gallery: [],
    specs: [
      { id: 'sp_20', key: 'Tải trọng tối đa', value: '5.000 kg' },
      { id: 'sp_21', key: 'Bước nhảy', value: '2 kg' },
      { id: 'sp_22', key: 'Màn hình', value: 'LED đỏ cao 55 mm' },
      { id: 'sp_23', key: 'Điều khiển từ xa', value: '30 m' },
    ],
    featured: false,
    enabled: true,
    order: 5,
  },
  {
    id: 'p_lab_220g',
    slug: 'can-phan-tich-220g',
    name: 'Cân phân tích 220g / 0,1mg',
    category: 'can-phan-tich',
    badge: 'Phòng lab',
    shortDescription: 'Cân bốn số lẻ, buồng chắn gió kính, hiệu chuẩn nội bộ tự động.',
    description:
      'Dành cho phòng thí nghiệm dược, thực phẩm và kiểm nghiệm môi trường. Cảm biến điện từ, tự hiệu chuẩn theo nhiệt độ, cổng RS232 xuất dữ liệu ra máy in hoặc LIMS.',
    price: 'Liên hệ',
    image: `${IMG}/product-6.svg`,
    gallery: [],
    specs: [
      { id: 'sp_24', key: 'Tải trọng tối đa', value: '220 g' },
      { id: 'sp_25', key: 'Độ chính xác', value: '0,1 mg' },
      { id: 'sp_26', key: 'Hiệu chuẩn', value: 'Nội bộ tự động' },
      { id: 'sp_27', key: 'Kết nối', value: 'RS232 / USB' },
    ],
    featured: false,
    enabled: true,
    order: 6,
  },
  {
    id: 'p_bang_tai',
    slug: 'can-bang-tai-dinh-luong',
    name: 'Cân băng tải định lượng',
    category: 'he-thong-tu-dong',
    badge: 'Giải pháp',
    shortDescription: 'Đo lưu lượng liên tục 5 - 500 tấn/giờ, điều khiển PLC và HMI.',
    description:
      'Hệ thống cân băng tải cho nhà máy xi măng, phân bón, thức ăn chăn nuôi. Đo khối lượng liên tục theo lưu lượng, tự điều chỉnh tốc độ băng để đạt định mức cấp liệu, ghi log sản lượng theo ca.',
    price: 'Liên hệ',
    image: `${IMG}/product-7.svg`,
    gallery: [],
    specs: [
      { id: 'sp_28', key: 'Lưu lượng', value: '5 - 500 tấn/giờ' },
      { id: 'sp_29', key: 'Sai số', value: '≤ 0,5%' },
      { id: 'sp_30', key: 'Điều khiển', value: 'PLC Siemens + HMI 10"' },
      { id: 'sp_31', key: 'Bề rộng băng', value: '500 - 1.400 mm' },
    ],
    featured: true,
    enabled: true,
    order: 7,
  },
  {
    id: 'p_dong_bao',
    slug: 'he-thong-can-dong-bao-tu-dong',
    name: 'Hệ thống cân đóng bao tự động',
    category: 'he-thong-tu-dong',
    badge: '',
    shortDescription: 'Năng suất 400 - 600 bao/giờ, cân định lượng kèm máy may bao.',
    description:
      'Dây chuyền cân - đóng bao trọn gói cho gạo, phân bón và hạt nhựa. Gồm phễu định lượng hai tốc độ, kẹp bao khí nén, băng tải may và cân kiểm tra cuối chuyền.',
    price: 'Liên hệ',
    image: `${IMG}/product-8.svg`,
    gallery: [],
    specs: [
      { id: 'sp_32', key: 'Năng suất', value: '400 - 600 bao/giờ' },
      { id: 'sp_33', key: 'Khối lượng bao', value: '10 - 50 kg' },
      { id: 'sp_34', key: 'Sai số', value: '± 50 g' },
      { id: 'sp_35', key: 'Khí nén', value: '0,6 MPa' },
    ],
    featured: false,
    enabled: true,
    order: 8,
  },
];

export const defaultContact = {
  anchor: 'lien-he',
  eyebrow: 'Liên hệ',
  title: 'Nói cho chúng tôi biết bạn cần cân gì',
  subtitle: 'Kỹ sư Việt Phát phản hồi trong vòng 24 giờ làm việc, khảo sát tận nơi miễn phí.',
  companyName: 'Công ty TNHH Cân Điện Tử Việt Phát',
  address: '128 Đường số 7, KCN Vsip 1, TP. Thuận An, Bình Dương',
  addressNote: 'Văn phòng & xưởng cơ khí',
  branches: [
    { id: 'br_1', name: 'Chi nhánh Hà Nội', address: 'Lô C12, KCN Quang Minh, Mê Linh, Hà Nội', phone: '024 6295 8899' },
    { id: 'br_2', name: 'Chi nhánh Đà Nẵng', address: '55 Nguyễn Văn Cừ, Liên Chiểu, Đà Nẵng', phone: '0236 3737 456' },
  ],
  phone: '0909 123 456',
  hotline: '1900 6789',
  email: 'kinhdoanh@vietphatscale.vn',
  workingHours: 'Thứ 2 - Thứ 7: 07:30 - 17:30 | Hỗ trợ kỹ thuật 24/7',
  taxCode: '3702xxxxxx',

  /**
   * Hiện các dòng cơ bản (Điện thoại / Hotline / Email) lấy từ những ô ở trên.
   * Tắt đi khi đã khai đủ trong "Danh bạ liên hệ" bên dưới, để khỏi trùng lặp.
   * Địa chỉ và giờ làm việc không nằm trong nhóm này - chúng luôn hiện.
   */
  showBasicRows: true,

  /**
   * Danh bạ liên hệ: mỗi dòng ghi rõ AI phụ trách số nào.
   * Ví dụ "Bộ phận kinh doanh - Anh Tuấn - 0939 292 845".
   * Thêm bao nhiêu dòng cũng được, mỗi dòng chọn biểu tượng riêng.
   */
  directory: [
    {
      id: 'dir_sales',
      label: 'Bộ phận kinh doanh',
      person: '',
      type: 'phone',
      value: '0939 292 845',
      icon: '',
      iconImage: '',
      enabled: true,
    },
    {
      id: 'dir_tech',
      label: 'Hỗ trợ kỹ thuật',
      person: '',
      type: 'phone',
      value: '0909 123 456',
      icon: '',
      iconImage: '',
      enabled: true,
    },
  ],

  /**
   * Biểu tượng cho từng dòng thông tin liên hệ.
   * `<tên>`      - chọn trong bộ icon có sẵn
   * `<tên>Image` - ảnh riêng tải lên; có ảnh thì ảnh thắng, không có thì dùng icon trên
   */
  icons: {
    address: 'pin',
    addressImage: '',
    phone: 'phone',
    phoneImage: '',
    email: 'mail',
    emailImage: '',
    hours: 'clock',
    hoursImage: '',
  },
  map: {
    enabled: true,
    mode: 'address', // 'address' = tu dong tao tu dia chi | 'embed' = dan ma nhung rieng
    query: '128 Đường số 7, KCN Vsip 1, Thuận An, Bình Dương',
    embedUrl: '',
    zoom: 16,
    height: 460,
  },
  form: {
    enabled: true,
    title: 'Gửi yêu cầu báo giá',
    successMessage: 'Cảm ơn bạn! Bộ phận kinh doanh sẽ liên hệ trong vòng 24 giờ làm việc.',
    subjects: ['Mua cân mới', 'Thi công lắp đặt', 'Kiểm định - hiệu chuẩn', 'Bảo trì - sửa chữa', 'Khác'],
  },
};

export const defaultFloatingContact = {
  enabled: true,
  position: 'right', // 'right' | 'left'
  label: 'Hỗ trợ',
  openLabel: 'Liên hệ với chúng tôi',
  tooltip: 'Cần hỗ trợ? Nhấn để chọn kênh liên hệ',
  showLabels: true,

  /**
   * Bong bóng lời nhắn hiện cạnh nút.
   * display: 'always'   - luôn hiện (chỉ tạm ẩn khi bung danh sách kênh)
   *          'autohide' - hiện rồi tự ẩn sau autoHideMs
   *          'once'     - chỉ hiện một lần mỗi phiên trình duyệt
   * style:   'glass' - nền kính mờ | 'solid' - nền trắng đặc
   */
  bubble: {
    enabled: true,
    message: 'Hãy liên hệ với chúng tôi',
    display: 'always',
    style: 'glass',
    delayMs: 1200,
    autoHideMs: 6000,
    dismissible: false,
  },

  /**
   * Mỗi kênh có thể tự chọn biểu tượng:
   *   icon: ''       - dùng biểu tượng mặc định theo loại kênh
   *   icon: 'chat'   - chọn một biểu tượng khác trong bộ có sẵn
   *   iconImage: '/uploads/zalo.svg' - ảnh riêng tải lên, thắng cả hai cái trên
   */
  channels: [
    {
      id: 'ch_phone',
      type: 'phone',
      icon: '',
      iconImage: '',
      label: 'Gọi hotline',
      value: '0909123456',
      display: '0909 123 456',
      enabled: true,
      order: 1,
    },
    {
      id: 'ch_zalo',
      type: 'zalo',
      label: 'Chat Zalo',
      value: '0909123456',
      display: 'Zalo 0909 123 456',
      enabled: true,
      order: 2,
    },
    {
      id: 'ch_facebook',
      type: 'facebook',
      label: 'Messenger',
      value: 'https://m.me/vietphatscale',
      display: 'fb.com/vietphatscale',
      enabled: true,
      order: 3,
    },
    {
      id: 'ch_email',
      type: 'email',
      label: 'Gửi email',
      value: 'kinhdoanh@vietphatscale.vn',
      display: 'kinhdoanh@vietphatscale.vn',
      enabled: true,
      order: 4,
    },
  ],
};

export const buildDefaultDb = () => ({
  version: 1,
  settings: defaultSettings,
  hero: defaultHero,
  home: defaultHome,
  about: defaultAbout,
  productsSection: defaultProductsSection,
  products: defaultProducts,
  contact: defaultContact,
  floatingContact: defaultFloatingContact,
  media: [],
  messages: [],
});

export default buildDefaultDb;
