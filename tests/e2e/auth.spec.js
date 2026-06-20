// @ts-check
const { test, expect } = require('@playwright/test');

test.describe('鉴权页面', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('默认显示登录页', async ({ page }) => {
        await expect(page).toHaveTitle(/加密日记/);
        await expect(page.locator('#auth-page')).toBeVisible();
        await expect(page.locator('#login-form')).toBeVisible();
        await expect(page.locator('#register-form')).toBeHidden();
    });

    test('切换到注册标签后展示注册表单', async ({ page }) => {
        await page.click('#register-tab');
        await expect(page.locator('#register-form')).toBeVisible();
        await expect(page.locator('#login-form')).toBeHidden();
    });

    test('注册必填项校验', async ({ page }) => {
        await page.click('#register-tab');
        const username = page.locator('#register-username');
        const required = await username.evaluate(el => /** @type {HTMLInputElement} */(el).required);
        expect(required).toBe(true);
    });

    test('登录页关键交互按钮存在', async ({ page }) => {
        await expect(page.locator('#login-tab')).toBeVisible();
        await expect(page.locator('#register-tab')).toBeVisible();
        await expect(page.locator('button[type="submit"]').first()).toBeVisible();
    });
});

test.describe('页面静态资源加载', () => {
    test('加载关键脚本无 404', async ({ page }) => {
        const failed = [];
        page.on('response', resp => {
            if (resp.status() >= 400 && /\.(js|css)$/.test(resp.url())) {
                failed.push(`${resp.status()} ${resp.url()}`);
            }
        });
        await page.goto('/');
        await page.waitForLoadState('networkidle').catch(() => {});
        const localFails = failed.filter(u => u.includes('127.0.0.1') || u.includes('localhost'));
        expect(localFails).toEqual([]);
    });
});
