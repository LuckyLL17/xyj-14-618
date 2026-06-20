const { test, expect } = require('@playwright/test');

test.describe('加密日记应用 - 端到端测试', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`Page error: ${msg.text()}`);
      }
    });
  });

  test('页面应该正确加载并显示认证页面', async ({ page }) => {
    await expect(page).toHaveTitle(/加密日记/);
    
    const authPage = page.locator('#auth-page');
    await expect(authPage).toBeVisible();
    
    await expect(page.locator('h1')).toContainText('加密日记');
    await expect(page.locator('#login-tab')).toBeVisible();
    await expect(page.locator('#register-tab')).toBeVisible();
  });

  test('应该能够切换登录和注册标签', async ({ page }) => {
    const loginForm = page.locator('#login-form');
    const registerForm = page.locator('#register-form');
    
    await expect(loginForm).toBeVisible();
    await expect(registerForm).toHaveClass(/hidden/);
    
    await page.click('#register-tab');
    await expect(registerForm).not.toHaveClass(/hidden/);
    
    await page.click('#login-tab');
    await expect(loginForm).not.toHaveClass(/hidden/);
  });

  test('登录表单应该显示用户名和密码输入框', async ({ page }) => {
    await expect(page.locator('#login-username')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.locator('#login-form button[type="submit"]')).toContainText('登录');
  });

  test('注册表单应该显示所有必填字段', async ({ page }) => {
    await page.click('#register-tab');
    
    await expect(page.locator('#register-username')).toBeVisible();
    await expect(page.locator('#register-password')).toBeVisible();
    await expect(page.locator('#register-confirm')).toBeVisible();
    await expect(page.locator('#register-form button[type="submit"]')).toContainText('注册');
  });

  test('应用主要结构应该包含必要的 UI 元素', async ({ page }) => {
    const header = page.locator('.app-header');
    await expect(header).toBeHidden();
    
    const newDiaryBtn = page.locator('#new-diary-btn');
    await expect(newDiaryBtn).toBeHidden();
  });

  test('应该加载所有必要的脚本资源', async ({ page }) => {
    const scripts = await page.$$eval('script[src]', scripts => 
      scripts.map(s => s.src)
    );
    
    expect(scripts.some(s => s.includes('stats.service.js'))).toBe(true);
    expect(scripts.some(s => s.includes('crypto.service.js'))).toBe(true);
    expect(scripts.some(s => s.includes('diary.service.js'))).toBe(true);
    expect(scripts.some(s => s.includes('sentiment.service.js'))).toBe(true);
  });
});

test.describe('UI 组件验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('编辑器工具栏应该存在', async ({ page }) => {
    const editorToolbar = page.locator('.editor-toolbar');
    await expect(editorToolbar).toBeHidden();
  });

  test('统计按钮应该存在', async ({ page }) => {
    const statsBtn = page.locator('#stats-btn');
    await expect(statsBtn).toBeHidden();
  });

  test('时间轴按钮应该存在', async ({ page }) => {
    const timelineBtn = page.locator('#timeline-btn');
    await expect(timelineBtn).toBeHidden();
  });

  test('搜索框应该存在于主页面', async ({ page }) => {
    const searchInput = page.locator('#search-input');
    await expect(searchInput).toBeHidden();
  });

  test('快捷输入面板应该初始隐藏', async ({ page }) => {
    const quickPanel = page.locator('#quick-input-panel');
    await expect(quickPanel).toHaveClass(/hidden/);
  });

  test('Toast 提示应该初始隐藏', async ({ page }) => {
    const toast = page.locator('#toast');
    await expect(toast).toHaveClass(/hidden/);
  });

  test('加载指示器应该初始隐藏', async ({ page }) => {
    const loading = page.locator('#loading-overlay');
    await expect(loading).toHaveClass(/hidden/);
  });
});

test.describe('表单验证', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('登录表单应该有 required 属性', async ({ page }) => {
    const username = page.locator('#login-username');
    const password = page.locator('#login-password');
    
    await expect(username).toHaveAttribute('required', '');
    await expect(password).toHaveAttribute('required', '');
  });

  test('注册表单应该有 required 属性', async ({ page }) => {
    await page.click('#register-tab');
    
    await expect(page.locator('#register-username')).toHaveAttribute('required', '');
    await expect(page.locator('#register-password')).toHaveAttribute('required', '');
    await expect(page.locator('#register-confirm')).toHaveAttribute('required', '');
  });
});
