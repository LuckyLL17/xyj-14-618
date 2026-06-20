/**
 * Jest 环境补丁
 * 为 jsdom 注入 Node 中可用的 Web Crypto API、TextEncoder 等
 */

const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');

if (typeof global.crypto === 'undefined') {
    global.crypto = webcrypto;
}

if (typeof global.TextEncoder === 'undefined') {
    global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
    global.TextDecoder = TextDecoder;
}

if (typeof global.btoa === 'undefined') {
    global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
}

if (typeof global.atob === 'undefined') {
    global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');
}
