const fs = require('fs');
const path = require('path');
const vm = require('vm');

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.crypto = require('crypto').webcrypto;

global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

const sessionStore = {};
const localStore = {};

global.sessionStorage = {
  getItem(key) { return sessionStore[key] || null; },
  setItem(key, value) { sessionStore[key] = String(value); },
  removeItem(key) { delete sessionStore[key]; },
  clear() { Object.keys(sessionStore).forEach(k => delete sessionStore[k]); }
};

global.localStorage = {
  getItem(key) { return localStore[key] || null; },
  setItem(key, value) { localStore[key] = String(value); },
  removeItem(key) { delete localStore[key]; },
  clear() { Object.keys(localStore).forEach(k => delete localStore[k]); }
};

if (typeof window !== 'undefined') {
  window.TextEncoder = TextEncoder;
  window.TextDecoder = TextDecoder;
  window.crypto = global.crypto;
  window.btoa = global.btoa;
  window.atob = global.atob;
  window.sessionStorage = global.sessionStorage;
  window.localStorage = global.localStorage;
}

function loadScript(relativePath, sandbox = {}) {
  const filePath = path.join(__dirname, '..', relativePath);
  let content = fs.readFileSync(filePath, 'utf8');
  
  const modulePattern = /const\s+(\w+)\s*=\s*\(function\s*\(\)\s*\{/;
  const match = content.match(modulePattern);
  let moduleName = match ? match[1] : null;
  
  if (!moduleName) {
    const nameMatch = content.match(/const\s+(\w+)\s*=/);
    moduleName = nameMatch ? nameMatch[1] : 'Module';
  }
  
  const context = {
    ...global,
    TextEncoder,
    TextDecoder,
    crypto: global.crypto,
    btoa: global.btoa,
    atob: global.atob,
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage,
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    Promise,
    Date,
    Math,
    JSON,
    Array,
    Object,
    String,
    Number,
    Boolean,
    RegExp,
    Error,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    ArrayBuffer,
    ...sandbox
  };
  
  vm.createContext(context);
  
  const wrappedCode = `
    ${content}
    __moduleResult = typeof ${moduleName} !== 'undefined' ? ${moduleName} : null;
  `;
  
  context.__moduleResult = null;
  vm.runInContext(wrappedCode, context, {
    filename: filePath,
    displayErrors: true
  });
  
  const result = context.__moduleResult;
  if (result) {
    global[moduleName] = result;
    if (typeof window !== 'undefined') {
      window[moduleName] = result;
    }
  }
  
  return result;
}

function resetModules() {
  const modulesToDelete = [
    'StorageService', 'CryptoService', 'MockApiService', 'AuthService',
    'WeatherService', 'SentimentService', 'StatsService', 'DiaryService',
    'DateUtils', 'MarkdownUtils'
  ];
  modulesToDelete.forEach(mod => {
    try {
      delete global[mod];
      if (typeof window !== 'undefined') {
        delete window[mod];
      }
    } catch (e) {}
  });
  global.sessionStorage.clear();
  global.localStorage.clear();
}

global.loadScript = loadScript;
global.resetModules = resetModules;
