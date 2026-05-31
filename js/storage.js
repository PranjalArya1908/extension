/**
 * storage.js — Chrome storage helpers with localStorage fallback
 * Falls back to localStorage when chrome.storage is unavailable
 * (e.g., when previewing via file:// protocol).
 */

const _chromeStorage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
  ? chrome.storage.local
  : null;

const Storage = {
  get(keys) {
    if (_chromeStorage) {
      return new Promise((resolve) => _chromeStorage.get(keys, (result) => resolve(result)));
    }
    // localStorage fallback
    const keyList = Array.isArray(keys) ? keys : (typeof keys === 'string' ? [keys] : Object.keys(keys));
    const result = {};
    keyList.forEach((k) => {
      const val = localStorage.getItem('nt_' + k);
      if (val !== null) {
        try { result[k] = JSON.parse(val); } catch { result[k] = val; }
      }
    });
    return Promise.resolve(result);
  },

  set(data) {
    if (_chromeStorage) {
      return new Promise((resolve) => _chromeStorage.set(data, () => resolve()));
    }
    Object.entries(data).forEach(([k, v]) => {
      localStorage.setItem('nt_' + k, JSON.stringify(v));
    });
    return Promise.resolve();
  },

  remove(keys) {
    if (_chromeStorage) {
      return new Promise((resolve) => _chromeStorage.remove(keys, () => resolve()));
    }
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach((k) => localStorage.removeItem('nt_' + k));
    return Promise.resolve();
  },

  clear() {
    if (_chromeStorage) {
      return new Promise((resolve) => _chromeStorage.clear(() => resolve()));
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith('nt_'))
      .forEach((k) => localStorage.removeItem(k));
    return Promise.resolve();
  },
};

