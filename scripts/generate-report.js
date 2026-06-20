#!/usr/bin/env node
/**
 * 自动跑 Jest + Playwright，并把结果汇总成 Markdown 报告。
 * 用法：
 *     node scripts/generate-report.js
 * 产物：
 *     TEST_REPORT.md         可读性优先的测试总结
 *     test-results.json      Jest 原始 JSON
 *     playwright-results.json Playwright 原始 JSON
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const JEST_OUT = path.join(ROOT, 'test-results.json');
const PW_OUT = path.join(ROOT, 'playwright-results.json');
const REPORT = path.join(ROOT, 'TEST_REPORT.md');

function run(label, cmd, args) {
    process.stdout.write(`\n>>> ${label}: ${cmd} ${args.join(' ')}\n`);
    const r = spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', env: process.env });
    return r.status === 0;
}

function safeRead(file) {
    try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch (e) {
        return null;
    }
}

function fmtDate(ms) {
    if (!ms) return '-';
    const d = new Date(ms);
    return d.toISOString().replace('T', ' ').replace(/\..+/, '');
}

function pad(n) { return String(n).padStart(2, '0'); }

function buildJestSection(jest) {
    if (!jest) return '_未生成 Jest 报告_';
    const total = jest.numTotalTests;
    const passed = jest.numPassedTests;
    const failed = jest.numFailedTests;
    const skipped = jest.numPendingTests || 0;
    const suites = jest.numTotalTestSuites;
    const success = jest.success ? '✅ 全部通过' : '❌ 存在失败';

    const rows = jest.testResults.map(s => {
        const file = path.relative(ROOT, s.name);
        const list = s.assertionResults || s.testResults || [];
        const pass = list.filter(t => t.status === 'passed').length;
        const fail = list.filter(t => t.status === 'failed').length;
        const dur = (s.endTime && s.startTime) ? (s.endTime - s.startTime) : 0;
        const status = fail === 0 && s.status !== 'failed' ? '✅' : '❌';
        return `| ${status} | \`${file}\` | ${list.length} | ${pass} | ${fail} | ${dur} ms |`;
    }).join('\n');

    const cases = [];
    jest.testResults.forEach(s => {
        const list = s.assertionResults || s.testResults || [];
        list.forEach(t => {
            const icon = t.status === 'passed' ? '✅' : (t.status === 'failed' ? '❌' : '⚪');
            const ancestors = (t.ancestorTitles || []).join(' › ');
            cases.push(`- ${icon} **${ancestors}** › ${t.title} _(${t.duration || 0} ms)_`);
        });
    });

    return [
        `**结果总览**：${success}`,
        '',
        `- 测试套件：${suites}`,
        `- 测试用例：${total}`,
        `- 通过：${passed}`,
        `- 失败：${failed}`,
        `- 跳过：${skipped}`,
        `- 起始时间：${fmtDate(jest.startTime)}`,
        '',
        '### 套件汇总',
        '',
        '| 状态 | 文件 | 用例数 | 通过 | 失败 | 耗时 |',
        '| --- | --- | --- | --- | --- | --- |',
        rows,
        '',
        '### 用例明细',
        '',
        cases.join('\n')
    ].join('\n');
}

function buildPlaywrightSection(pw) {
    if (!pw) return '_未生成 Playwright 报告_';
    const stats = pw.stats || {};
    const expected = stats.expected || 0;
    const unexpected = stats.unexpected || 0;
    const flaky = stats.flaky || 0;
    const skipped = stats.skipped || 0;
    const duration = stats.duration || 0;
    const success = unexpected === 0 ? '✅ 全部通过' : '❌ 存在失败';

    const cases = [];
    function walk(suite, prefix) {
        const name = suite.title ? `${prefix}${prefix ? ' › ' : ''}${suite.title}` : prefix;
        (suite.specs || []).forEach(spec => {
            const t = (spec.tests && spec.tests[0]) || {};
            const r = (t.results && t.results[0]) || {};
            const ok = r.status === 'passed' || r.status === 'expected';
            const icon = ok ? '✅' : (r.status === 'skipped' ? '⚪' : '❌');
            cases.push(`- ${icon} **${name}** › ${spec.title} _(${r.duration || 0} ms)_`);
        });
        (suite.suites || []).forEach(sub => walk(sub, name));
    }
    (pw.suites || []).forEach(s => walk(s, ''));

    return [
        `**结果总览**：${success}`,
        '',
        `- 期望通过：${expected}`,
        `- 异常失败：${unexpected}`,
        `- Flaky：${flaky}`,
        `- 跳过：${skipped}`,
        `- 总耗时：${duration} ms`,
        '',
        '### 用例明细',
        '',
        cases.join('\n')
    ].join('\n');
}

function main() {
    const jestOk = run('Jest', 'npx', ['jest', '--json', `--outputFile=${JEST_OUT}`]);
    const pwOk = run('Playwright', 'npx', ['playwright', 'test']);
    void pwOk;

    const jest = safeRead(JEST_OUT);
    const pw = safeRead(PW_OUT);

    const now = new Date();
    const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

    const md = [
        '# Mercury 加密日记 · 测试报告',
        '',
        `> 生成时间：${stamp}`,
        '',
        '## 一、测试目标与策略',
        '',
        '本次测试体系自下而上分三层：',
        '',
        '1. **纯计算单元层** —— `StatsService` / `DateUtils`，无外部依赖，覆盖率优先。',
        '2. **业务服务层** —— `CryptoService`（加解密 / KeyStore / Session）、`DiaryService`（CRUD / 搜索 / 排序）、`SentimentService`（情感分析）。',
        '3. **端到端 UI 层** —— 通过 Playwright 模拟真实浏览器，验证登录 / 注册等关键交互可达性与静态资源完整性。',
        '',
        '## 二、技术栈',
        '',
        '| 层 | 工具 | 说明 |',
        '| --- | --- | --- |',
        '| 单元 / 集成 | Jest 29 | 测试运行器 + 断言库 |',
        '| DOM 模拟 | jest-environment-jsdom | 提供浏览器 API |',
        '| 加载 IIFE | Node `vm` 沙箱 | 把 `const X = (function(){})()` 形态的源码注入测试上下文 |',
        '| WebCrypto | Node `crypto.webcrypto` | 替换 jsdom 缺失的 `crypto.subtle` |',
        '| E2E | Playwright (Chromium) | 真浏览器驱动 UI |',
        '| 静态服务器 | http-server | 给 Playwright 托管 `index.html` |',
        '',
        '## 三、Jest 单元测试',
        '',
        buildJestSection(jest),
        '',
        '## 四、Playwright 端到端测试',
        '',
        buildPlaywrightSection(pw),
        '',
        '## 五、运行方式',
        '',
        '```bash',
        '# 安装依赖',
        'npm install',
        '',
        '# 安装 Playwright 浏览器（首次）',
        'npx playwright install chromium',
        '',
        '# 单元测试',
        'npm test',
        '',
        '# E2E 测试',
        'npm run test:e2e',
        '',
        '# 一键生成本报告',
        'npm run report',
        '```',
        '',
        '## 六、目录结构',
        '',
        '```',
        'tests/',
        '├── setup/',
        '│   ├── jest.polyfills.js   # 注入 webcrypto / TextEncoder 等',
        '│   └── load-script.js      # 把 IIFE 源码加载进 vm 沙箱',
        '├── unit/',
        '│   ├── stats.service.test.js',
        '│   ├── date.utils.test.js',
        '│   ├── crypto.service.test.js',
        '│   ├── sentiment.service.test.js',
        '│   └── diary.service.test.js',
        '└── e2e/',
        '    └── auth.spec.js',
        '```',
        ''
    ].join('\n');

    fs.writeFileSync(REPORT, md, 'utf8');
    process.stdout.write(`\n报告已写入：${REPORT}\n`);
    if (!jestOk) process.exitCode = 1;
}

main();
