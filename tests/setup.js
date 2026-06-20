const fs = require('fs');
const path = require('path');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

if (!global.crypto) {
  global.crypto = webcrypto;
}
if (!global.crypto.subtle) {
  global.crypto.subtle = webcrypto.subtle;
}

if (!global.TextEncoder) {
  global.TextEncoder = TextEncoder;
}
if (!global.TextDecoder) {
  global.TextDecoder = TextDecoder;
}

if (!global.btoa) {
  global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}
if (!global.atob) {
  global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}

if (!global.sessionStorage) {
  const sessionStore = {};
  global.sessionStorage = {
    getItem: (key) => sessionStore[key] || null,
    setItem: (key, value) => { sessionStore[key] = String(value); },
    removeItem: (key) => { delete sessionStore[key]; },
    clear: () => { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); }
  };
}

if (!global.localStorage) {
  const localStore = {};
  global.localStorage = {
    getItem: (key) => localStore[key] || null,
    setItem: (key, value) => { localStore[key] = String(value); },
    removeItem: (key) => { delete localStore[key]; },
    clear: () => { Object.keys(localStore).forEach(k => delete localStore[k]); }
  };
}

const baseDir = path.resolve(__dirname, '..');

const loadOrder = [
  'js/services/storage.service.js',
  'js/services/crypto.service.js',
  'js/services/mock-api.service.js',
  'js/services/weather.service.js',
  'js/services/sentiment.service.js',
  'js/services/stats.service.js',
  'js/services/diary.service.js',
  'js/services/auth.service.js',
  'js/utils/date.utils.js',
  'js/utils/markdown.utils.js'
];

loadOrder.forEach(relPath => {
  const filePath = path.join(baseDir, relPath);
  const content = fs.readFileSync(filePath, 'utf8');
  const wrappedContent = content
    .replace(/^const (\w+) = \(function\(\) \{/m, 'globalThis.$1 = (function() {')
    + '\n;';
  eval(wrappedContent);
});

if (typeof beforeEach !== 'undefined') {
  beforeEach(() => {
    global.localStorage.clear();
    global.sessionStorage.clear();
    if (global.DiaryService && DiaryService.clearCache) {
      DiaryService.clearCache();
    }
    if (global.CryptoService) {
      CryptoService.setMasterKey(null);
    }
  });
}
