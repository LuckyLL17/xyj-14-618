describe('CryptoService', () => {
  describe('arrayBufferToBase64 and base64ToArrayBuffer', () => {
    test('should convert between ArrayBuffer and Base64', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]);
      const base64 = CryptoService.arrayBufferToBase64(original.buffer);
      const converted = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(converted)).toEqual(original);
    });

    test('should handle empty buffer', () => {
      const original = new Uint8Array([]);
      const base64 = CryptoService.arrayBufferToBase64(original.buffer);
      const converted = CryptoService.base64ToArrayBuffer(base64);
      expect(new Uint8Array(converted).length).toBe(0);
    });
  });

  describe('generateSalt', () => {
    test('should generate salt with correct length', () => {
      const salt = CryptoService.generateSalt();
      expect(salt).toBeInstanceOf(Uint8Array);
      expect(salt.length).toBe(16);
    });

    test('should generate unique salts', () => {
      const salt1 = CryptoService.generateSalt();
      const salt2 = CryptoService.generateSalt();
      expect(Array.from(salt1)).not.toEqual(Array.from(salt2));
    });
  });

  describe('generateKey', () => {
    test('should generate a valid AES-GCM key', async () => {
      const key = await CryptoService.generateKey();
      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('exportKey and importKey', () => {
    test('should export and import key correctly', async () => {
      const key = await CryptoService.generateKey();
      const exported = await CryptoService.exportKey(key);
      expect(typeof exported).toBe('string');

      const imported = await CryptoService.importKey(exported);
      expect(imported.type).toBe('secret');
      expect(imported.algorithm.name).toBe('AES-GCM');
    });
  });

  describe('encrypt and decrypt', () => {
    test('should encrypt and decrypt string data', async () => {
      const key = await CryptoService.generateKey();
      const plaintext = 'Hello, World! 你好世界！';
      const encrypted = await CryptoService.encrypt(plaintext, key);
      expect(typeof encrypted).toBe('string');
      expect(encrypted).not.toBe(plaintext);

      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    test('should encrypt and decrypt object data (JSON)', async () => {
      const key = await CryptoService.generateKey();
      const data = { name: 'test', value: 42, items: [1, 2, 3] };
      const encrypted = await CryptoService.encrypt(data, key);
      const decrypted = await CryptoService.decrypt(encrypted, key);
      expect(decrypted).toEqual(data);
    });

    test('should produce different ciphertexts for same plaintext', async () => {
      const key = await CryptoService.generateKey();
      const plaintext = 'Same text';
      const encrypted1 = await CryptoService.encrypt(plaintext, key);
      const encrypted2 = await CryptoService.encrypt(plaintext, key);
      expect(encrypted1).not.toBe(encrypted2);
    });
  });

  describe('hash', () => {
    test('should produce consistent hash for same input', async () => {
      const hash1 = await CryptoService.hash('test-password');
      const hash2 = await CryptoService.hash('test-password');
      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different inputs', async () => {
      const hash1 = await CryptoService.hash('password1');
      const hash2 = await CryptoService.hash('password2');
      expect(hash1).not.toBe(hash2);
    });

    test('should produce base64 string output', async () => {
      const hash = await CryptoService.hash('test');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });
  });

  describe('deriveKeyFromPassword', () => {
    test('should derive key from password and salt', async () => {
      const salt = CryptoService.generateSalt();
      const key = await CryptoService.deriveKeyFromPassword('mypassword', salt);
      expect(key).toBeDefined();
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    test('should derive same key from same password and salt', async () => {
      const salt = CryptoService.generateSalt();
      const key1 = await CryptoService.deriveKeyFromPassword('mypassword', salt);
      const key2 = await CryptoService.deriveKeyFromPassword('mypassword', salt);
      const exported1 = await CryptoService.exportKey(key1);
      const exported2 = await CryptoService.exportKey(key2);
      expect(exported1).toBe(exported2);
    });

    test('should derive different keys from different passwords', async () => {
      const salt = CryptoService.generateSalt();
      const key1 = await CryptoService.deriveKeyFromPassword('password1', salt);
      const key2 = await CryptoService.deriveKeyFromPassword('password2', salt);
      const exported1 = await CryptoService.exportKey(key1);
      const exported2 = await CryptoService.exportKey(key2);
      expect(exported1).not.toBe(exported2);
    });
  });

  describe('wrapKey and unwrapKey', () => {
    test('should wrap and unwrap key correctly', async () => {
      const wrappingKey = await CryptoService.generateKey();
      const keyToWrap = await CryptoService.generateKey();

      const wrapped = await CryptoService.wrapKey(keyToWrap, wrappingKey);
      expect(typeof wrapped).toBe('string');

      const unwrapped = await CryptoService.unwrapKey(wrapped, wrappingKey);
      expect(unwrapped.type).toBe('secret');

      const originalExported = await CryptoService.exportKey(keyToWrap);
      const unwrappedExported = await CryptoService.exportKey(unwrapped);
      expect(originalExported).toBe(unwrappedExported);
    });
  });

  describe('createUserKeyStore and unlockUserKeyStore', () => {
    test('should create key store and unlock it', async () => {
      const password = 'testpassword123';
      const keyStore = await CryptoService.createUserKeyStore(password);
      expect(keyStore).toHaveProperty('salt');
      expect(keyStore).toHaveProperty('wrappedMasterKey');

      const unlocked = await CryptoService.unlockUserKeyStore(keyStore, password);
      expect(unlocked).toBe(true);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    test('should fail to unlock with wrong password', async () => {
      const keyStore = await CryptoService.createUserKeyStore('correct-password');
      const unlocked = await CryptoService.unlockUserKeyStore(keyStore, 'wrong-password');
      expect(unlocked).toBe(false);
    });
  });

  describe('Master key management', () => {
    test('should set and get master key', async () => {
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
      const key = await CryptoService.generateKey();
      CryptoService.setMasterKey(key);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
      expect(CryptoService.getMasterKey()).toBe(key);
    });

    test('should encrypt and decrypt with master key', async () => {
      const key = await CryptoService.generateKey();
      CryptoService.setMasterKey(key);
      const data = 'secret data';
      const encrypted = await CryptoService.encryptWithMasterKey(data);
      const decrypted = await CryptoService.decryptWithMasterKey(encrypted);
      expect(decrypted).toBe(data);
    });

    test('should throw when master key not available', async () => {
      CryptoService.setMasterKey(null);
      await expect(CryptoService.encryptWithMasterKey('test')).rejects.toThrow('Master key not available');
      await expect(CryptoService.decryptWithMasterKey('test')).rejects.toThrow('Master key not available');
    });
  });

  describe('Session management', () => {
    beforeEach(() => {
      sessionStorage.clear();
      CryptoService.setMasterKey(null);
    });

    test('should save and restore session', async () => {
      const key = await CryptoService.generateKey();
      CryptoService.setMasterKey(key);
      expect(CryptoService.hasSession()).toBe(false);

      const saved = await CryptoService.saveSession();
      expect(saved).toBe(true);
      expect(CryptoService.hasSession()).toBe(true);

      CryptoService.setMasterKey(null);
      const restored = await CryptoService.restoreSession();
      expect(restored).toBe(true);
      expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    test('should return false when saving session without master key', async () => {
      CryptoService.setMasterKey(null);
      const saved = await CryptoService.saveSession();
      expect(saved).toBe(false);
    });

    test('should clear session', async () => {
      const key = await CryptoService.generateKey();
      CryptoService.setMasterKey(key);
      await CryptoService.saveSession();
      expect(CryptoService.hasSession()).toBe(true);

      CryptoService.clearSession();
      expect(CryptoService.hasSession()).toBe(false);
      expect(CryptoService.isMasterKeyAvailable()).toBe(false);
    });

    test('should save and retrieve key store from session', () => {
      const keyStore = { salt: 'abc', wrappedMasterKey: 'xyz' };
      CryptoService.saveKeyStoreToSession(keyStore);
      const retrieved = CryptoService.getKeyStoreFromSession();
      expect(retrieved).toEqual(keyStore);
    });

    test('should return null for invalid key store JSON', () => {
      sessionStorage.setItem('session_keystore', 'invalid-json');
      const retrieved = CryptoService.getKeyStoreFromSession();
      expect(retrieved).toBeNull();
    });
  });
});
