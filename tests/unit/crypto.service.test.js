/**
 * CryptoService 单元测试
 * 重点验证 加密/解密、密钥包装、口令派生、Master Key 流程
 */
const { loadScript, createSandbox, createMemoryStorage } = require('../setup/load-script');

function buildCryptoService() {
    const sandbox = createSandbox({
        sessionStorage: createMemoryStorage()
    });
    loadScript('js/services/crypto.service.js', sandbox);
    return { CryptoService: sandbox.CryptoService, sandbox };
}

describe('CryptoService base64 互转', () => {
    let CryptoService;
    beforeAll(() => { CryptoService = buildCryptoService().CryptoService; });

    test('base64ToArrayBuffer 与 arrayBufferToBase64 可逆', () => {
        const u8 = new Uint8Array([1, 2, 3, 4, 5]);
        const b64 = CryptoService.arrayBufferToBase64(u8);
        const back = CryptoService.base64ToArrayBuffer(b64);
        expect(Array.from(back)).toEqual([1, 2, 3, 4, 5]);
    });
});

describe('CryptoService 加密 / 解密', () => {
    let CryptoService;
    beforeAll(() => { CryptoService = buildCryptoService().CryptoService; });

    test('字符串加密后能解密回原文', async () => {
        const key = await CryptoService.generateKey();
        const cipher = await CryptoService.encrypt('hello world 你好', key);
        const plain = await CryptoService.decrypt(cipher, key);
        expect(plain).toBe('hello world 你好');
    });

    test('对象加密后解密为原对象', async () => {
        const key = await CryptoService.generateKey();
        const obj = { id: 1, name: '日记', tags: ['a', 'b'] };
        const cipher = await CryptoService.encrypt(obj, key);
        const back = await CryptoService.decrypt(cipher, key);
        expect(back).toEqual(obj);
    });

    test('错误密钥解密会抛错', async () => {
        const k1 = await CryptoService.generateKey();
        const k2 = await CryptoService.generateKey();
        const cipher = await CryptoService.encrypt('secret', k1);
        await expect(CryptoService.decrypt(cipher, k2)).rejects.toBeDefined();
    });
});

describe('CryptoService 哈希', () => {
    let CryptoService;
    beforeAll(() => { CryptoService = buildCryptoService().CryptoService; });

    test('相同输入哈希相同', async () => {
        const a = await CryptoService.hash('password');
        const b = await CryptoService.hash('password');
        expect(a).toBe(b);
    });

    test('不同输入哈希不同', async () => {
        const a = await CryptoService.hash('password');
        const b = await CryptoService.hash('Password');
        expect(a).not.toBe(b);
    });
});

describe('CryptoService 密钥包装 / 解包', () => {
    let CryptoService;
    beforeAll(() => { CryptoService = buildCryptoService().CryptoService; });

    test('wrap/unwrap 后可用于解密之前加密的内容', async () => {
        const wrappingKey = await CryptoService.generateKey();
        const dataKey = await CryptoService.generateKey();

        const cipher = await CryptoService.encrypt('payload', dataKey);

        const wrapped = await CryptoService.wrapKey(dataKey, wrappingKey);
        const unwrapped = await CryptoService.unwrapKey(wrapped, wrappingKey);

        const plain = await CryptoService.decrypt(cipher, unwrapped);
        expect(plain).toBe('payload');
    });
});

describe('CryptoService 用户 KeyStore', () => {
    test('createUserKeyStore + unlockUserKeyStore 流程', async () => {
        const { CryptoService } = buildCryptoService();
        const keyStore = await CryptoService.createUserKeyStore('myPassw0rd!');
        expect(keyStore).toHaveProperty('salt');
        expect(keyStore).toHaveProperty('wrappedMasterKey');

        const ok = await CryptoService.unlockUserKeyStore(keyStore, 'myPassw0rd!');
        expect(ok).toBe(true);
        expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    test('错误密码无法解锁', async () => {
        const { CryptoService } = buildCryptoService();
        const keyStore = await CryptoService.createUserKeyStore('correct');
        const ok = await CryptoService.unlockUserKeyStore(keyStore, 'wrong');
        expect(ok).toBe(false);
    });

    test('encryptWithMasterKey 在未解锁时抛错', async () => {
        const { CryptoService } = buildCryptoService();
        await expect(CryptoService.encryptWithMasterKey('abc'))
            .rejects
            .toThrow('Master key not available');
    });

    test('encryptWithMasterKey + decryptWithMasterKey 闭环', async () => {
        const { CryptoService } = buildCryptoService();
        const keyStore = await CryptoService.createUserKeyStore('pass');
        await CryptoService.unlockUserKeyStore(keyStore, 'pass');

        const cipher = await CryptoService.encryptWithMasterKey({ a: 1 });
        const plain = await CryptoService.decryptWithMasterKey(cipher);
        expect(plain).toEqual({ a: 1 });
    });
});

describe('CryptoService session 管理', () => {
    test('saveSession / restoreSession 在同一 sandbox 中可恢复', async () => {
        const { CryptoService } = buildCryptoService();
        const ks = await CryptoService.createUserKeyStore('pwd');
        await CryptoService.unlockUserKeyStore(ks, 'pwd');

        const saved = await CryptoService.saveSession();
        expect(saved).toBe(true);
        expect(CryptoService.hasSession()).toBe(true);

        CryptoService.setMasterKey(null);
        expect(CryptoService.isMasterKeyAvailable()).toBe(false);

        const restored = await CryptoService.restoreSession();
        expect(restored).toBe(true);
        expect(CryptoService.isMasterKeyAvailable()).toBe(true);
    });

    test('clearSession 后无法恢复', async () => {
        const { CryptoService } = buildCryptoService();
        const ks = await CryptoService.createUserKeyStore('pwd');
        await CryptoService.unlockUserKeyStore(ks, 'pwd');
        await CryptoService.saveSession();
        CryptoService.clearSession();
        expect(CryptoService.hasSession()).toBe(false);
        const r = await CryptoService.restoreSession();
        expect(r).toBe(false);
    });
});
