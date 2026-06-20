const { test, expect } = require('@playwright/test');

test.describe('加密日记应用 UI 测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('页面应该正确加载标题', async ({ page }) => {
    await expect(page).toHaveTitle(/加密日记/);
  });

  test('登录页面应该显示用户名和密码输入框', async ({ page }) => {
    const loginForm = page.locator('#login-form');
    await expect(loginForm).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText('登录');
  });

  test('应该能够切换到注册标签页', async ({ page }) => {
    await page.click('#register-tab');
    await expect(page.locator('#register-form')).toBeVisible();
    await expect(page.locator('#login-form')).toHaveClass(/hidden/);
    await expect(page.locator('#register-username')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-confirm')).toBeVisible();
  });

  test('登录和注册标签页应该可以互相切换', async ({ page }) => {
    await page.click('#register-tab');
    await expect(page.locator('#register-form')).toBeVisible();
    
    await page.click('#login-tab');
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#register-form')).toHaveClass(/hidden/);
  });

  test('页面应该包含新日记按钮元素', async ({ page }) => {
    await expect(page.locator('#new-diary-btn')).toBeVisible();
  });

  test('页面应该包含统计和时间轴按钮', async ({ page }) => {
    await expect(page.locator('#stats-btn')).toBeVisible();
    await expect(page.locator('#timeline-btn')).toBeVisible();
  });

  test('页面应该包含搜索框', async ({ page }) => {
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', '搜索日记...');
  });

  test('编辑器应该包含标题输入框', async ({ page }) => {
    await expect(page.locator('#diary-title')).toBeVisible();
  });

  test('编辑器模式切换应该存在', async ({ page }) => {
    await expect(page.locator('#editor-mode')).toBeVisible();
    const options = page.locator('#editor-mode option');
    await expect(options).toHaveCount(2);
  });

  test('富文本编辑器和Markdown编辑器切换', async ({ page }) => {
    await expect(page.locator('#rich-editor')).toBeVisible();
    
    await page.selectOption('#editor-mode', 'markdown');
    await expect(page.locator('#markdown-editor')).toBeVisible();
    
    await page.selectOption('#editor-mode', 'rich');
    await expect(page.locator('#rich-editor')).toBeVisible();
  });

  test('应该显示情感分析区域', async ({ page }) => {
    await expect(page.locator('#emotion-analysis')).toBeVisible();
    await expect(page.locator('#emotion-positive')).toBeVisible();
    await expect(page.locator('#emotion-neutral')).toBeVisible();
    await expect(page.locator('#emotion-negative')).toBeVisible();
  });

  test('应该显示字数统计', async ({ page }) => {
    await expect(page.locator('#word-count')).toBeVisible();
    await expect(page.locator('#word-count')).toContainText('字数: 0');
  });

  test('应该包含保存和取消按钮', async ({ page }) => {
    await expect(page.locator('#save-diary-btn')).toBeVisible();
    await expect(page.locator('#cancel-edit-btn')).toBeVisible();
    await expect(page.locator('#save-diary-btn')).toContainText('保存');
    await expect(page.locator('#cancel-edit-btn')).toContainText('取消');
  });

  test('统计页面应该包含今日、本周、本月、本年按钮', async ({ page }) => {
    await page.click('#stats-btn');
    await expect(page.locator('.period-btn[data-period="day"]')).toContainText('今日');
    await expect(page.locator('.period-btn[data-period="week"]')).toContainText('本周');
    await expect(page.locator('.period-btn[data-period="month"]')).toContainText('本月');
    await expect(page.locator('.period-btn[data-period="year"]')).toContainText('本年');
  });

  test('统计页面应该包含统计卡片', async ({ page }) => {
    await page.click('#stats-btn');
    await expect(page.locator('#stat-diaries')).toBeVisible();
    await expect(page.locator('#stat-words')).toBeVisible();
    await expect(page.locator('#stat-avg-words')).toBeVisible();
    await expect(page.locator('#stat-streak')).toBeVisible();
  });
});
