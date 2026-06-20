const { test, expect } = require('@playwright/test');

test.describe('加密日记应用 E2E 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload();
  });

  test('页面应该正确加载并显示登录页面', async ({ page }) => {
    await expect(page.locator('#auth-page h1')).toContainText('加密日记');
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#register-form')).toBeHidden();
  });

  test('应该能切换到注册标签页', async ({ page }) => {
    await page.click('#register-tab');
    await expect(page.locator('#register-form')).toBeVisible();
    await expect(page.locator('#login-form')).toBeHidden();
  });

  test('登录表单应该验证空输入', async ({ page }) => {
    await page.click('button[type="submit"]');
    await expect(page.locator('#login-error')).toBeVisible();
  });

  test('应该成功注册新用户', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'testuser');
    await page.fill('#register-password', 'password123');
    await page.fill('#register-confirm', 'password123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1000);
    await expect(page.locator('#toast')).toBeVisible();
  });

  test('注册表单应该验证密码长度', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'testuser');
    await page.fill('#register-password', '12345');
    await page.fill('#register-confirm', '12345');
    await page.click('#register-form button[type="submit"]');
    await expect(page.locator('#register-error')).toContainText('密码长度至少为6位');
  });

  test('注册表单应该验证密码匹配', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'testuser');
    await page.fill('#register-password', 'password123');
    await page.fill('#register-confirm', 'password456');
    await page.click('#register-form button[type="submit"]');
    await expect(page.locator('#register-error')).toContainText('两次密码输入不一致');
  });

  test('注册后应该能登录并进入主页面', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'e2euser');
    await page.fill('#register-password', 'testpass123');
    await page.fill('#register-confirm', 'testpass123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.fill('#login-username', 'e2euser');
    await page.fill('#login-password', 'testpass123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    await expect(page.locator('#main-page')).toBeVisible();
    await expect(page.locator('#user-display')).toContainText('e2euser');
  });

  test('登录后应该能创建新日记', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'diaryuser');
    await page.fill('#register-password', 'testpass123');
    await page.fill('#register-confirm', 'testpass123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.fill('#login-username', 'diaryuser');
    await page.fill('#login-password', 'testpass123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.click('#new-diary-btn');
    await page.waitForTimeout(1000);
    await expect(page.locator('#editor-view')).toBeVisible();
  });

  test('应该能访问统计页面', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'statsuser');
    await page.fill('#register-password', 'testpass123');
    await page.fill('#register-confirm', 'testpass123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.fill('#login-username', 'statsuser');
    await page.fill('#login-password', 'testpass123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.click('#stats-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#stats-view')).toBeVisible();
    await expect(page.locator('#stat-diaries')).toBeVisible();
  });

  test('应该能访问时间轴页面', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'timelineuser');
    await page.fill('#register-password', 'testpass123');
    await page.fill('#register-confirm', 'testpass123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.fill('#login-username', 'timelineuser');
    await page.fill('#login-password', 'testpass123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.click('#timeline-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#timeline-view')).toBeVisible();
  });

  test('应该能退出登录', async ({ page }) => {
    await page.click('#register-tab');
    await page.fill('#register-username', 'logoutuser');
    await page.fill('#register-password', 'testpass123');
    await page.fill('#register-confirm', 'testpass123');
    await page.click('#register-form button[type="submit"]');
    await page.waitForTimeout(1500);

    await page.fill('#login-username', 'logoutuser');
    await page.fill('#login-password', 'testpass123');
    await page.click('#login-form button[type="submit"]');
    await page.waitForTimeout(2000);

    page.once('dialog', dialog => dialog.accept());
    await page.click('#logout-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#auth-page')).toBeVisible();
  });
});
