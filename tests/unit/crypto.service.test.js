describe('CryptoService', () => {
  const hasWebCrypto = typeof global.crypto !== 'undefined' && 
                       typeof global.crypto.subtle !== 'undefined';

  beforeEach(() => {
    resetModules();
    loadScript('js/services/storage.service.js');
    loadScript('js/services/crypto.service.js');
  });

  describe('arrayBufferToBase64 and base64ToArrayBuffer', () => {
    it('should convert between ArrayBuffer and Base64 correctly', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = CryptoService.arrayBufferToBase64(original.buffer);
      const converted = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(converted)).toEqual(original);
    });

    it('should handle empty buffer', () => {
      const original = new Uint8Array([]);
      const base64 = CryptoService.arrayBufferToBase64(original.buffer);
      const converted = CryptoService.base64ToArrayBuffer(base64);
      expect(converted.byteLength).toBe(0);
    });

    it('should handle binary data with special characters', () => {
      const original = new Uint8Array([0, 1, 255, 128, 64, 32]);
      const base64 = CryptoService.arrayBufferToBase64(original.buffer);
      const converted = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(converted)).toEqual(original);
    });
  });

  describe('generateSalt', () => {
    it('should generate salt with correct length', () => {
      const salt = CryptoService.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    it('should generate different salts each time', () => {
      const salt1 = CryptoService.generateSalt();
      const salt2 = CryptoService.generateSalt();
      expect(salt1).not.toEqual(salt2);
    });
  });

  describe('utility functions', () => {
    it('isMasterKeyAvailable should return false initially', () => {
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
    });

    it('getMasterKey should return null initially', () => {
      expect(CryptoService.getMasterKey()).toBeNull();
    });

    it('setMasterKey and isMasterKeyAvailable should work together', () => {
      CryptoService.setMasterKey({ dummy: true });
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
      expect(CryptoService.getMasterKey()).toEqual({ dummy: true });
    });

    it('encryptWithMasterKey should throw error when master key not available', async () => {
      await expect(CryptoService.encryptWithMasterKey('test'))
        .rejects.toThrow('Master key not available');
      await expect(CryptoService.decryptWithMasterKey('test'))
        .rejects.toThrow('Master key not available');
    });
  });

  describe('session management', () => {
    it('hasSession should return false initially', () => {
      expect(CryptoService.hasSession()).toBe(false);
    });

    it('clearSession should work correctly', () => {
      CryptoService.setMasterKey({ test: true });
      CryptoService.clearSession();
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
      expect(CryptoService.hasSession()).toBe(false);
    });
  });

  (hasWebCrypto ? describe : describe.skip)('hash (requires Web Crypto API)', () => {
    it('should generate consistent hash for same input', async () => {
      const hash1 = await CryptoService.hash('test-password');
      const hash2 = await CryptoService.hash('test-password');
      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different input', async () => {
      const hash1 = await CryptoService.hash('password1');
      const hash2 = await CryptoService.hash('password2');
      expect(hash1).not.toBe(hash2);
    });

    it('should return base64 encoded string', async () => {
      const hash = await CryptoService.hash('test');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  (hasWebCrypto ? describe : describe.skip)('generateKey (requires Web Crypto API)', () => {
    it('should generate a valid CryptoKey', async () => {
      const key = await CryptoService.generateKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });
  });

  (hasWebCrypto ? describe : describe.skip)('encrypt and decrypt (requires Web Crypto API)', () => {
    let testKey;

    beforeEach(async () => {
      testKey = await CryptoService.generateKey();
    });

    it('should encrypt and decrypt string correctly', async () => {
      const original = 'Hello, World! 这是一个测试';
      const encrypted = await CryptoService.encrypt(original, testKey);
      const decrypted = await CryptoService.decrypt(encrypted, testKey);
      expect(decrypted).toBe(original);
    });

    it('should encrypt and decrypt JSON object correctly', async () => {
      const original = { id: 1, name: '测试', data: [1, 2, 3] };
      const encrypted = await CryptoService.encrypt(original, testKey);
      const decrypted = await CryptoService.decrypt(encrypted, testKey);
      expect(decrypted).toEqual(original);
    });

    it('should produce different ciphertext each time (due to IV)', async () => {
      const original = 'Same text';
      const encrypted1 = await CryptoService.encrypt(original, testKey);
      const encrypted2 = await CryptoService.encrypt(original, testKey);
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should produce base64 encoded output', async () => {
      const encrypted = await CryptoService.encrypt('test', testKey);
      expect(typeof encrypted).toBe('string');
    });
  });

  (hasWebCrypto ? describe : describe.skip)('exportKey and importKey (requires Web Crypto API)', () => {
    it('should export and import key correctly', async () => {
      const originalKey = await CryptoService.generateKey();
      const exported = await CryptoService.exportKey(originalKey);
      expect(typeof exported).toBe('string');

      const importedKey = await CryptoService.importKey(exported);
      expect(importedKey).toBeDefined();

      const testData = 'Test encryption';
      const encrypted = await CryptoService.encrypt(testData, originalKey);
      const decrypted = await CryptoService.decrypt(encrypted, importedKey);
      expect(decrypted).toBe(testData);
    });
  });

  (hasWebCrypto ? describe : describe.skip)('createUserKeyStore and unlockUserKeyStore (requires Web Crypto API)', () => {
    it('should create and unlock key store correctly', async () => {
      const password = 'test-password-123';
      const keyStore = await CryptoService.createUserKeyStore(password);
      
      expect(keyStore).toHaveProperty('salt');
      expect(keyStore).toHaveProperty('wrappedMasterKey');
      expect(typeof keyStore.salt).toBe('string');
      expect(typeof keyStore.wrappedMasterKey).toBe('string');

      const unlocked = await CryptoService.unlockUserKeyStore(keyStore, password);
      expect(unlocked).toBe(true);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    it('should fail to unlock with wrong password', async () => {
      const keyStore = await CryptoService.createUserKeyStore('correct-password');
      const unlocked = await CryptoService.unlockUserKeyStore(keyStore, 'wrong-password');
      expect(unlocked).toBe(false);
    });
  });

  (hasWebCrypto ? describe : describe.skip)('encryptWithMasterKey and decryptWithMasterKey (requires Web Crypto API)', () => {
    it('should encrypt and decrypt with master key', async () => {
      const keyStore = await CryptoService.createUserKeyStore('password');
      await CryptoService.unlockUserKeyStore(keyStore, 'password');
      
      const original = 'Secret diary content';
      const encrypted = await CryptoService.encryptWithMasterKey(original);
      const decrypted = await CryptoService.decryptWithMasterKey(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  (hasWebCrypto ? describe : describe.skip)('session management (requires Web Crypto API)', () => {
    it('should save and restore session', async () => {
      const keyStore = await CryptoService.createUserKeyStore('password');
      await CryptoService.unlockUserKeyStore(keyStore, 'password');
      
      expect(CryptoService.hasSession()).toBe(false);
      
      await CryptoService.saveSession();
      expect(CryptoService.hasSession()).toBe(true);
      
      CryptoService.clearSession();
      expect(CryptoService.hasSession()).toBe(false);
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
      
      await CryptoService.restoreSession();
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    it('should restore session correctly after page reload simulation', async () => {
      const keyStore = await CryptoService.createUserKeyStore('password');
      await CryptoService.unlockUserKeyStore(keyStore, 'password');
      
      const original = 'Data before reload';
      const encrypted = await CryptoService.encryptWithMasterKey(original);
      
      await CryptoService.saveSession();
      CryptoService.clearSession();
      
      await CryptoService.restoreSession();
      const decrypted = await CryptoService.decryptWithMasterKey(encrypted);
      expect(decrypted).toBe(original);
    });
  });
});
