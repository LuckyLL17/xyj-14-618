/**
 * 加载 IIFE 风格的源码模块
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

const ROOT = path.resolve(__dirname, '..', '..');

function loadScript(relPath, sandbox) {
    const fullPath = path.join(ROOT, relPath);
    let code = fs.readFileSync(fullPath, 'utf8');
    code = code.replace(/^\s*const\s+/gm, 'var ');
    vm.runInContext(code, sandbox);
}

function createSandbox(extra = {}) {
    const ctx = {
        console,
        crypto: webcrypto,
        TextEncoder: TextEncoder,
        TextDecoder: TextDecoder,
        btoa: (str) => Buffer.from(str, 'binary').toString('base64'),
        atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        Math,
        Date,
        JSON,
        Promise,
        Array,
        Object,
        String,
        Number,
        Boolean,
        Error,
        Map,
        Set,
        Buffer,
        Uint8Array,
        ArrayBuffer,
        sessionStorage: createMemoryStorage(),
        localStorage: createMemoryStorage(),
        ...extra
    };
    return vm.createContext(ctx);
}

function createMemoryStorage() {
    const data = {};
    return {
        getItem(k) { return Object.prototype.hasOwnProperty.call(data, k) ? data[k] : null; },
        setItem(k, v) { data[k] = String(v); },
        removeItem(k) { delete data[k]; },
        clear() { Object.keys(data).forEach(k => delete data[k]); },
        key(i) { return Object.keys(data)[i] || null; },
        get length() { return Object.keys(data).length; }
    };
}

module.exports = {
    loadScript,
    createSandbox,
    createMemoryStorage,
    ROOT
};
