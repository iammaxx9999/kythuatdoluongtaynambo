/** Doc/ghi gia tri long nhau theo chuoi duong dan: 'contact.map.zoom', 'nav.0.label' */

export const getPath = (obj, path) =>
  String(path)
    .split('.')
    .reduce((acc, key) => (acc === null || acc === undefined ? undefined : acc[key]), obj);

export const setPath = (obj, path, value) => {
  const keys = String(path).split('.');
  const last = keys.pop();
  const target = keys.reduce((acc, key, index) => {
    if (acc[key] === null || typeof acc[key] !== 'object') {
      // Tao mang neu key tiep theo la so, nguoc lai tao object
      const nextKey = keys[index + 1] ?? last;
      acc[key] = /^\d+$/.test(nextKey) ? [] : {};
    }
    return acc[key];
  }, obj);
  target[last] = value;
  return obj;
};

export const clone = (value) =>
  typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));

export const uid = (prefix = 'id') =>
  `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
