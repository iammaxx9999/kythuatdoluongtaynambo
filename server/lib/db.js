import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DB_FILE, DATA_DIR } from '../config.js';

/**
 * Kho du lieu JSON toi gian.
 * - Doc 1 lan vao bo nho, ghi lai bang atomic write (ghi file tam roi rename).
 * - Hang doi ghi tuan tu de tranh race condition khi nhieu request cung sua.
 * Muon doi sang SQLite/Postgres sau nay: chi can thay file nay, service khong doi.
 */
class JsonStore {
  #cache = null;
  #writeQueue = Promise.resolve();

  constructor(file) {
    this.file = file;
  }

  async #load() {
    if (this.#cache) return this.#cache;
    try {
      const raw = await fs.readFile(this.file, 'utf8');
      this.#cache = JSON.parse(raw);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      this.#cache = {};
    }
    return this.#cache;
  }

  /** Doc du lieu (chi doc - khong sua truc tiep object tra ve). */
  async read() {
    return this.#load();
  }

  /**
   * Sua du lieu an toan: mutator nhan snapshot, tra ve gia tri tuy y.
   * Toan bo db duoc ghi xuong dia sau khi mutator chay xong.
   */
  async update(mutator) {
    const run = async () => {
      const data = await this.#load();
      const result = await mutator(data);
      await this.#persist(data);
      return result;
    };
    this.#writeQueue = this.#writeQueue.then(run, run);
    return this.#writeQueue;
  }

  async #persist(data) {
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const tmp = `${this.file}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    // Quyen 600: chi chu tien trinh doc duoc tep du lieu
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), { encoding: 'utf8', mode: 0o600 });
    await fs.rename(tmp, this.file);
  }

  exists() {
    return fsSync.existsSync(this.file);
  }
}

fsSync.mkdirSync(DATA_DIR, { recursive: true });

export const db = new JsonStore(DB_FILE);
export default db;
