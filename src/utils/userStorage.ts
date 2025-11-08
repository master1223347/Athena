
// utils/userStorage.ts
export const userStorage = {
  k: (uid: string, key: string) => `${uid}:${key}`,

  get(uid: string, key: string, fallback: string = "0") {
    return localStorage.getItem(userStorage.k(uid, key)) ?? fallback;
  },

  set(uid: string, key: string, value: string) {
    localStorage.setItem(userStorage.k(uid, key), value);
  },

  inc(uid: string, key: string) {
    const next = String(parseInt(userStorage.get(uid, key), 10) + 1);
    userStorage.set(uid, key, next);
    return next;
  },

  getBoolean(uid: string, key: string, fallback: boolean = false): boolean {
    const val = localStorage.getItem(userStorage.k(uid, key));
    if (val === null) return fallback;
    return val === 'true';
  },

  setBoolean(uid: string, key: string, value: boolean) {
    localStorage.setItem(userStorage.k(uid, key), value ? 'true' : 'false');
  },

  getNumber(uid: string, key: string, fallback: number = 0): number {
    const val = localStorage.getItem(userStorage.k(uid, key));
    if (val === null) return fallback;
    const parsed = parseFloat(val);
    return isNaN(parsed) ? fallback : parsed;
  },

  setNumber(uid: string, key: string, value: number) {
    localStorage.setItem(userStorage.k(uid, key), value.toString());
  },

  getObject<T>(uid: string, key: string, fallback: T): T {
    const val = localStorage.getItem(userStorage.k(uid, key));
    if (val === null) return fallback;
    try {
      return JSON.parse(val) as T;
    } catch (e) {
      return fallback;
    }
  },

  setObject<T>(uid: string, key: string, value: T) {
    localStorage.setItem(userStorage.k(uid, key), JSON.stringify(value));
  },

  clear(uid: string) {
    Object.keys(localStorage)
      .filter(k => k.startsWith(`${uid}:`))
      .forEach(k => localStorage.removeItem(k));
  }
};

export function clearAllUserMetrics(uid: string) {
  // wipe namespaced keys
  userStorage.clear(uid);

  // also nuke any forgotten global keys for good measure
  [
    'assignmentCompleteCount', 'perfectGradeCount',
    'canvasSyncCount', 'loginCount',
    'pageViews', 'visitedPages',
    'hasProfilePicture', 'prefersDarkMode',
    'canvas_credentials'
  ].forEach(k => localStorage.removeItem(k));
}

