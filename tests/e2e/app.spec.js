const { test, expect } = require('@playwright/test');

async function registerAndLogin(page) {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('/');
  await page.waitForSelector('#auth-page:not(.hidden)', { timeout: 5000 });
  
  const testUsername = 'testuser';
  const testPassword = 'test123';
  
  await page.click('#register-tab');
  await page.waitForSelector('#register-form:not(.hidden)');
  await page.fill('#register-username', testUsername);
  await page.fill('#register-password', testPassword);
  await page.fill('#register-confirm', testPassword);
  await page.click('#register-form button[type="submit"]');
  
  await page.waitForTimeout(500);
  
  await page.fill('#login-username', testUsername);
  await page.fill('#login-password', testPassword);
  await page.click('#login-form button[type="submit"]');
  
  await page.waitForSelector('#main-page:not(.hidden)', { timeout: 5000 });
  await page.waitForTimeout(300);
}

test.describe('登录/注册页面测试 (未登录状态)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('#auth-page:not(.hidden)', { timeout: 5000 });
  });

  test('页面应该正确加载标题', async ({ page }) => {
    await expect(page).toHaveTitle(/加密日记/);
  });

  test('登录页面应该显示用户名和密码输入框', async ({ page }) => {
    await expect(page.locator('#login-form')).toBeVisible();
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-form button[type="submit"]')).toContainText('登录');
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
});

test.describe('主界面功能测试 (已登录状态)', () => {
  test.beforeEach(async ({ page }) => {
    await registerAndLogin(page);
  });

  test('登录成功后应该显示主页面', async ({ page }) => {
    await expect(page.locator('#main-page')).toBeVisible();
    await expect(page.locator('#auth-page')).toHaveClass(/hidden/);
    await expect(page.locator('#user-display')).toContainText('欢迎, testuser');
  });

  test('页面应该包含新日记按钮元素', async ({ page }) => {
    await expect(page.locator('#new-diary-btn')).toBeVisible();
  });

  test('页面应该包含统计和时间轴按钮', async ({ page }) => {
    await expect(page.locator('#stats-btn')).toBeVisible();
    await expect(page.locator('#timeline-btn')).toBeVisible();
    await expect(page.locator('#logout-btn')).toBeVisible();
  });

  test('页面应该包含搜索框', async ({ page }) => {
    await expect(page.locator('#search-input')).toBeVisible();
    await expect(page.locator('#search-input')).toHaveAttribute('placeholder', '搜索日记...');
  });

  test('应该显示欢迎页面和日记列表', async ({ page }) => {
    await expect(page.locator('#welcome-view')).toBeVisible();
    await expect(page.locator('#diary-list')).toBeVisible();
  });

  test('点击新日记按钮应该进入编辑器', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#editor-view')).toBeVisible();
  });

  test('编辑器应该包含标题输入框', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#diary-title')).toBeVisible();
  });

  test('编辑器模式切换应该存在', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#editor-mode')).toBeVisible();
    const options = page.locator('#editor-mode option');
    await expect(options).toHaveCount(2);
  });

  test('富文本编辑器和Markdown编辑器切换', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    
    await expect(page.locator('#rich-editor')).toBeVisible();
    
    await page.selectOption('#editor-mode', 'markdown');
    await expect(page.locator('#markdown-editor')).toBeVisible();
    
    await page.selectOption('#editor-mode', 'rich');
    await expect(page.locator('#rich-editor')).toBeVisible();
  });

  test('应该显示情感分析区域', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#emotion-analysis')).toBeVisible();
    await expect(page.locator('#emotion-analysis .label')).toContainText('情感分析');
    await expect(page.locator('.emotion-bar:has-text("积极")')).toBeVisible();
    await expect(page.locator('.emotion-bar:has-text("中性")')).toBeVisible();
    await expect(page.locator('.emotion-bar:has-text("消极")')).toBeVisible();
  });

  test('应该显示字数统计', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#word-count')).toBeVisible();
    await expect(page.locator('#word-count')).toContainText('字数:');
  });

  test('应该包含保存和取消按钮', async ({ page }) => {
    await page.click('#new-diary-btn');
    await page.waitForSelector('#editor-view:not(.hidden)');
    await expect(page.locator('#save-diary-btn')).toBeVisible();
    await expect(page.locator('#cancel-edit-btn')).toBeVisible();
    await expect(page.locator('#save-diary-btn')).toContainText('保存');
    await expect(page.locator('#cancel-edit-btn')).toContainText('取消');
  });

  test('点击统计按钮应该显示统计页面', async ({ page }) => {
    await page.click('#stats-btn');
    await page.waitForSelector('#stats-view:not(.hidden)');
    await expect(page.locator('#stats-view')).toBeVisible();
    await expect(page.locator('.period-btn[data-period="day"]')).toContainText('今日');
    await expect(page.locator('.period-btn[data-period="week"]')).toContainText('本周');
    await expect(page.locator('.period-btn[data-period="month"]')).toContainText('本月');
    await expect(page.locator('.period-btn[data-period="year"]')).toContainText('本年');
  });

  test('统计页面应该包含统计卡片', async ({ page }) => {
    await page.click('#stats-btn');
    await page.waitForSelector('#stats-view:not(.hidden)');
    await expect(page.locator('#stat-diaries')).toBeVisible();
    await expect(page.locator('#stat-words')).toBeVisible();
    await expect(page.locator('#stat-avg-words')).toBeVisible();
    await expect(page.locator('#stat-streak')).toBeVisible();
  });

  test('点击时间轴按钮应该显示时间轴页面', async ({ page }) => {
    await page.click('#timeline-btn');
    await page.waitForSelector('#timeline-view:not(.hidden)');
    await expect(page.locator('#timeline-view')).toBeVisible();
  });
});
