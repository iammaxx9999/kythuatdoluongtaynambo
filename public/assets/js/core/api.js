/**
 * api.js - lop giao tiep duy nhat voi backend.
 * Moi component goi qua day, khong tu goi fetch.
 */

const BASE = '/api';

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details ?? null;
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  const isFormData = body instanceof FormData;

  const response = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'same-origin',
    // Nội dung do CMS quản lý thay đổi bất cứ lúc nào -> luôn lấy bản mới nhất,
    // không đụng tới bộ nhớ đệm của trình duyệt.
    cache: 'no-store',
    signal,
    headers: {
      Accept: 'application/json',
      ...(isFormData || body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: isFormData ? body : body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  const data = text ? safeParse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, data?.error || `Lỗi ${response.status}`, data?.details);
  }

  return data;
}

const safeParse = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

export const api = {
  get: (path, options) => request(path, { ...options, method: 'GET' }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  del: (path, options) => request(path, { ...options, method: 'DELETE' }),
};

/* --------- Endpoint co ten ro rang --------- */
export const siteApi = {
  getPublicSite: () => api.get('/site'),
  getAdminSite: () => api.get('/cms/site'),
  patchSection: (section, patch) => api.patch(`/content/${section}`, patch),
  putSection: (section, value) => api.put(`/content/${section}`, value),
};

export const productApi = {
  list: () => api.get('/products'),
  create: (payload) => api.post('/products', payload),
  update: (id, payload) => api.put(`/products/${id}`, payload),
  remove: (id) => api.del(`/products/${id}`),
  reorder: (ids) => api.post('/products/reorder', { ids }),
};

export const mediaApi = {
  list: () => api.get('/media'),
  upload: (files) => {
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));
    return api.post('/media', form);
  },
  remove: (id) => api.del(`/media/${id}`),
};

export const messageApi = {
  list: () => api.get('/messages'),
  send: (payload) => api.post('/messages', payload),
  markRead: (id, read = true) => api.patch(`/messages/${id}`, { read }),
  remove: (id) => api.del(`/messages/${id}`),
};

export const authApi = {
  login: (username, password, remember = false) =>
    api.post('/auth/login', { username, password, remember }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword, newPassword) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
};

export default api;
