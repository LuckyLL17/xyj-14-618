const fs = require('fs');
const path = require('path');
const { Crypto } = require('@peculiar/webcrypto');

const crypto = new Crypto();
global.crypto = crypto;

class LocalStorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }
}

const localStorageMock = new LocalStorageMock();
const sessionStorageMock = new LocalStorageMock();

global.localStorage = localStorageMock;
global.sessionStorage = sessionStorageMock;

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true, configurable: true });
  Object.defineProperty(window, 'sessionStorage', { value: sessionStorageMock, writable: true, configurable: true });
}

global.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
global.atob = (b64) => Buffer.from(b64, 'base64').toString('binary');

global.TextEncoder = require('util').TextEncoder;
global.TextDecoder = require('util').TextDecoder;

beforeEach(() => {
  localStorageMock.clear();
  sessionStorageMock.clear();
});

function loadScript(scriptPath) {
  let code = fs.readFileSync(scriptPath, 'utf8');
  
  code = code.replace(/^const\s+(\w+)\s*=\s*\(/gm, 'globalThis.$1 = (');
  
  eval(code);
}

global.loadScript = loadScript;

global.loadService = function(serviceName) {
  const servicePath = path.join(__dirname, '..', 'js', 'services', `${serviceName}.service.js`);
  if (fs.existsSync(servicePath)) {
    loadScript(servicePath);
  } else {
    const utilsPath = path.join(__dirname, '..', 'js', 'utils', `${serviceName}.utils.js`);
    loadScript(utilsPath);
  }
};

global.mockDependentServices = function() {
  global.MockApiService = {
    login: jest.fn().mockResolvedValue({ success: true, data: { username: 'testuser' } }),
    register: jest.fn().mockResolvedValue({ success: true }),
    getWeather: jest.fn().mockResolvedValue({ 
      data: { 
        weather: '晴', 
        emoji: '☀️', 
        temperature: { current: 25, min: 18, max: 30 },
        airQuality: '优',
        description: '阳光明媚'
      } 
    }),
    analyzeSentiment: jest.fn().mockResolvedValue({ data: { positive: 0.5, neutral: 0.3, negative: 0.2 } })
  };

  global.AuthService = {
    getCurrentUser: jest.fn().mockReturnValue({ username: 'testuser' }),
    isLoggedIn: jest.fn().mockReturnValue(true),
    saveUserDiaries: jest.fn().mockResolvedValue(true),
    loadUserDiaries: jest.fn().mockResolvedValue(true),
    logout: jest.fn(),
    login: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn().mockResolvedValue({ success: true })
  };

  global.WeatherService = {
    getCurrentWeather: jest.fn().mockResolvedValue({ 
      weather: '晴', 
      emoji: '☀️', 
      temperature: { current: 25, min: 18, max: 30 },
      airQuality: '优',
      description: '阳光明媚'
    })
  };

  global.StorageService = {
    set: jest.fn().mockReturnValue(true),
    get: jest.fn().mockReturnValue(null),
    remove: jest.fn().mockReturnValue(true),
    clear: jest.fn().mockReturnValue(true),
    setCache: jest.fn().mockReturnValue(true),
    getCache: jest.fn().mockReturnValue(null),
    has: jest.fn().mockReturnValue(false),
    getAll: jest.fn().mockReturnValue({})
  };

  global.StatsService = null;
  global.CryptoService = null;
  global.SentimentService = null;
  global.DiaryService = null;
  global.DateUtils = null;
};
