const path = require('path');

describe('CryptoService', () => {
  beforeAll(() => {
    mockDependentServices();
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'storage.service.js'));
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'crypto.service.js'));
  });

  describe('基础编码转换', () => {
    test('arrayBufferToBase64 和 base64ToArrayBuffer 应该互为逆操作', () => {
      const testData = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = CryptoService.arrayBufferToBase64(testData.buffer);
      const restored = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(restored)).toEqual(testData);
    });

    test('应该正确处理空数据', () => {
      const emptyData = new Uint8Array([]);
      const base64 = CryptoService.arrayBufferToBase64(emptyData.buffer);
      const restored = CryptoService.base64ToArrayBuffer(base64);
      expect(restored.byteLength).toBe(0);
    });
  });

  describe('generateSalt', () => {
    test('应该生成指定长度的盐值', () => {
      const salt = CryptoService.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    test('每次生成的盐值应该不同', () => {
      const salt1 = CryptoService.generateSalt();
      const salt2 = CryptoService.generateSalt();
      expect(Array.from(salt1)).not.toEqual(Array.from(salt2));
    });
  });

  describe('密钥生成和导出导入', () => {
    test('generateKey 应该生成有效的 AES-GCM 密钥', async () => {
      const key = await CryptoService.generateKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    test('exportKey 和 importKey 应该互为逆操作', async () => {
      const key = await CryptoService.generateKey();
      const exported = await CryptoService.exportKey(key);
      expect(typeof exported).toBe('string');
      expect(exported.length).toBeGreaterThan(0);
      
      const importedKey = await CryptoService.importKey(exported);
      expect(importedKey).toBeDefined();
      expect(importedKey.type).toBe('secret');
    });
  });

  describe('密钥派生', () => {
    test('deriveKeyFromPassword 应该从密码派生密钥', async () => {
      const password = 'testpassword123';
      const salt = CryptoService.generateSalt();
      const key = await CryptoService.deriveKeyFromPassword(password, salt);
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
    });

    test('相同密码和盐值应该派生相同的密钥', async () => {
      const password = 'testpassword123';
      const salt = CryptoService.generateSalt();
      const key1 = await CryptoService.deriveKeyFromPassword(password, salt);
      const key2 = await CryptoService.deriveKeyFromPassword(password, salt);
      
      const exported1 = await CryptoService.exportKey(key1);
      const exported2 = await CryptoService.exportKey(key2);
      expect(exported1).toBe(exported2);
    });

    test('不同密码应该派生不同的密钥', async () => {
      const salt = CryptoService.generateSalt();
      const key1 = await CryptoService.deriveKeyFromPassword('password1', salt);
      const key2 = await CryptoService.deriveKeyFromPassword('password2', salt);
      
      const exported1 = await CryptoService.exportKey(key1);
      const exported2 = await CryptoService.exportKey(key2);
      expect(exported1).not.toBe(exported2);
    });
  });

  describe('加密解密', () => {
    let testKey;

    beforeAll(async () => {
      testKey = await CryptoService.generateKey();
    });

    test('应该正确加密和解密字符串', async () => {
      const plaintext = '这是一段测试文本 Hello World 123!';
      const encrypted = await CryptoService.encrypt(plaintext, testKey);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);
      
      const decrypted = await CryptoService.decrypt(encrypted, testKey);
      expect(decrypted).toBe(plaintext);
    });

    test('应该正确加密和解密 JSON 对象', async () => {
      const data = { name: '测试', value: 123, nested: { a: 1 } };
      const encrypted = await CryptoService.encrypt(data, testKey);
      const decrypted = await CryptoService.decrypt(encrypted, testKey);
      expect(decrypted).toEqual(data);
    });

    test('应该正确加密和解密空字符串', async () => {
      const encrypted = await CryptoService.encrypt('', testKey);
      const decrypted = await CryptoService.decrypt(encrypted, testKey);
      expect(decrypted).toBe('');
    });

    test('相同明文每次加密应该产生不同的密文', async () => {
      const plaintext = '相同的文本';
      const encrypted1 = await CryptoService.encrypt(plaintext, testKey);
      const encrypted2 = await CryptoService.encrypt(plaintext, testKey);
      expect(encrypted1).not.toBe(encrypted2);
      
      const decrypted1 = await CryptoService.decrypt(encrypted1, testKey);
      const decrypted2 = await CryptoService.decrypt(encrypted2, testKey);
      expect(decrypted1).toBe(plaintext);
      expect(decrypted2).toBe(plaintext);
    });

    test('使用错误密钥解密应该抛出错误', async () => {
      const key1 = await CryptoService.generateKey();
      const key2 = await CryptoService.generateKey();
      const encrypted = await CryptoService.encrypt('秘密数据', key1);
      
      await expect(CryptoService.decrypt(encrypted, key2)).rejects.toBeDefined();
    });
  });

  describe('密钥包装和解包', () => {
    test('wrapKey 和 unwrapKey 应该互为逆操作', async () => {
      const keyToWrap = await CryptoService.generateKey();
      const wrappingKey = await CryptoService.generateKey();
      
      const wrapped = await CryptoService.wrapKey(keyToWrap, wrappingKey);
      expect(typeof wrapped).toBe('string');
      
      const unwrapped = await CryptoService.unwrapKey(wrapped, wrappingKey);
      expect(unwrapped).toBeDefined();
      
      const originalExport = await CryptoService.exportKey(keyToWrap);
      const unwrappedExport = await CryptoService.exportKey(unwrapped);
      expect(originalExport).toBe(unwrappedExport);
    });
  });

  describe('hash', () => {
    test('应该生成一致的哈希值', async () => {
      const data = 'test data';
      const hash1 = await CryptoService.hash(data);
      const hash2 = await CryptoService.hash(data);
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1.length).toBeGreaterThan(0);
    });

    test('不同数据应该产生不同哈希值', async () => {
      const hash1 = await CryptoService.hash('data1');
      const hash2 = await CryptoService.hash('data2');
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('用户密钥库', () => {
    beforeEach(() => {
      CryptoService.clearSession();
    });

    test('createUserKeyStore 应该创建有效的密钥库', async () => {
      const password = 'userpassword';
      const keyStore = await CryptoService.createUserKeyStore(password);
      
      expect(keyStore).toBeDefined();
      expect(keyStore.salt).toBeDefined();
      expect(keyStore.wrappedMasterKey).toBeDefined();
      expect(typeof keyStore.salt).toBe('string');
      expect(typeof keyStore.wrappedMasterKey).toBe('string');
    });

    test('unlockUserKeyStore 应该使用正确密码解锁', async () => {
      const password = 'userpassword';
      const keyStore = await CryptoService.createUserKeyStore(password);
      
      const result = await CryptoService.unlockUserKeyStore(keyStore, password);
      expect(result).toBe(true);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    test('unlockUserKeyStore 使用错误密码应该失败', async () => {
      const password = 'userpassword';
      const keyStore = await CryptoService.createUserKeyStore(password);
      
      const result = await CryptoService.unlockUserKeyStore(keyStore, 'wrongpassword');
      expect(result).toBe(false);
    });

    test('encryptWithMasterKey 和 decryptWithMasterKey 应该工作', async () => {
      const password = 'userpassword';
      const keyStore = await CryptoService.createUserKeyStore(password);
      await CryptoService.unlockUserKeyStore(keyStore, password);
      
      const testData = { message: '使用主密钥加密的秘密数据' };
      const encrypted = await CryptoService.encryptWithMasterKey(testData);
      const decrypted = await CryptoService.decryptWithMasterKey(encrypted);
      
      expect(decrypted).toEqual(testData);
    });

    test('未设置主密钥时 encryptWithMasterKey 应该抛出错误', async () => {
      CryptoService.clearSession();
      await expect(CryptoService.encryptWithMasterKey('data')).rejects.toThrow('Master key not available');
    });
  });

  describe('会话管理', () => {
    beforeEach(async () => {
      CryptoService.clearSession();
      const password = 'sessiontest';
      const keyStore = await CryptoService.createUserKeyStore(password);
      await CryptoService.unlockUserKeyStore(keyStore, password);
    });

    test('saveSession 和 restoreSession 应该保存和恢复会话', async () => {
      const originalKey = CryptoService.getMasterKey();
      const originalExport = await CryptoService.exportKey(originalKey);
      
      const saveResult = await CryptoService.saveSession();
      expect(saveResult).toBe(true);
      expect(CryptoService.hasSession()).toBe(true);
      
      CryptoService.setMasterKey(null);
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
      
      const restoreResult = await CryptoService.restoreSession();
      expect(restoreResult).toBe(true);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
      
      const restoredKey = CryptoService.getMasterKey();
      const restoredExport = await CryptoService.exportKey(restoredKey);
      expect(originalExport).toBe(restoredExport);
    });

    test('clearSession 应该清除会话', async () => {
      await CryptoService.saveSession();
      expect(CryptoService.hasSession()).toBe(true);
      
      CryptoService.clearSession();
      expect(CryptoService.hasSession()).toBe(false);
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
    });
  });
});
