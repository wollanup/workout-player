const KEY = 'wp.sessions.v1';

export const SessionStore = {
  all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  },
  saveAll(list) { localStorage.setItem(KEY, JSON.stringify(list)); },
  get(id) { return this.all().find(s => s.id === id); },
  upsert(session) {
    const list = this.all();
    const i = list.findIndex(s => s.id === session.id);
    if (i >= 0) list[i] = session; else list.push(session);
    this.saveAll(list);
  },
  remove(id) { this.saveAll(this.all().filter(s => s.id !== id)); },
};

/** Local audio files kept as Blobs in IndexedDB so sessions survive reloads / offline. */
export const FileStore = (() => {
  let dbp;
  const open = () => dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open('workout-player', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('files');
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const tx = async (mode, fn) => {
    const db = await open();
    return new Promise((resolve, reject) => {
      const t = db.transaction('files', mode);
      const req = fn(t.objectStore('files'));
      t.oncomplete = () => resolve(req?.result);
      t.onerror = () => reject(t.error);
      t.onabort = () => reject(t.error);
    });
  };
  return {
    put: (id, blob) => tx('readwrite', s => s.put(blob, id)),
    get: id => tx('readonly', s => s.get(id)),
    del: id => tx('readwrite', s => s.delete(id)),
    keys: () => tx('readonly', s => s.getAllKeys()),
  };
})();

/** Deletes stored files no longer referenced by any saved session. */
export async function gcFiles() {
  const used = new Set(SessionStore.all().flatMap(s => s.steps.map(x => x.fileId).filter(Boolean)));
  for (const k of await FileStore.keys()) if (!used.has(k)) await FileStore.del(k);
}
