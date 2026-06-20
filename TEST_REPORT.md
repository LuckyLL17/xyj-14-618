# Mercury 加密日记 · 测试报告

> 生成时间：2026-06-20 10:05:45

## 一、测试目标与策略

本次测试体系自下而上分三层：

1. **纯计算单元层** —— `StatsService` / `DateUtils`，无外部依赖，覆盖率优先。
2. **业务服务层** —— `CryptoService`（加解密 / KeyStore / Session）、`DiaryService`（CRUD / 搜索 / 排序）、`SentimentService`（情感分析）。
3. **端到端 UI 层** —— 通过 Playwright 模拟真实浏览器，验证登录 / 注册等关键交互可达性与静态资源完整性。

## 二、技术栈

| 层 | 工具 | 说明 |
| --- | --- | --- |
| 单元 / 集成 | Jest 29 | 测试运行器 + 断言库 |
| DOM 模拟 | jest-environment-jsdom | 提供浏览器 API |
| 加载 IIFE | Node `vm` 沙箱 | 把 `const X = (function(){})()` 形态的源码注入测试上下文 |
| WebCrypto | Node `crypto.webcrypto` | 替换 jsdom 缺失的 `crypto.subtle` |
| E2E | Playwright (Chromium) | 真浏览器驱动 UI |
| 静态服务器 | http-server | 给 Playwright 托管 `index.html` |

## 三、Jest 单元测试

**结果总览**：✅ 全部通过

- 测试套件：5
- 测试用例：76
- 通过：76
- 失败：0
- 跳过：0
- 起始时间：2026-06-20 02:05:39

### 套件汇总

| 状态 | 文件 | 用例数 | 通过 | 失败 | 耗时 |
| --- | --- | --- | --- | --- | --- |
| ✅ | `tests/unit/crypto.service.test.js` | 13 | 13 | 0 | 194 ms |
| ✅ | `tests/unit/diary.service.test.js` | 15 | 15 | 0 | 36 ms |
| ✅ | `tests/unit/stats.service.test.js` | 19 | 19 | 0 | 21 ms |
| ✅ | `tests/unit/sentiment.service.test.js` | 11 | 11 | 0 | 39 ms |
| ✅ | `tests/unit/date.utils.test.js` | 18 | 18 | 0 | 22 ms |

### 用例明细

- ✅ **CryptoService base64 互转** › base64ToArrayBuffer 与 arrayBufferToBase64 可逆 _(1 ms)_
- ✅ **CryptoService 加密 / 解密** › 字符串加密后能解密回原文 _(3 ms)_
- ✅ **CryptoService 加密 / 解密** › 对象加密后解密为原对象 _(0 ms)_
- ✅ **CryptoService 加密 / 解密** › 错误密钥解密会抛错 _(1 ms)_
- ✅ **CryptoService 哈希** › 相同输入哈希相同 _(0 ms)_
- ✅ **CryptoService 哈希** › 不同输入哈希不同 _(1 ms)_
- ✅ **CryptoService 密钥包装 / 解包** › wrap/unwrap 后可用于解密之前加密的内容 _(1 ms)_
- ✅ **CryptoService 用户 KeyStore** › createUserKeyStore + unlockUserKeyStore 流程 _(17 ms)_
- ✅ **CryptoService 用户 KeyStore** › 错误密码无法解锁 _(28 ms)_
- ✅ **CryptoService 用户 KeyStore** › encryptWithMasterKey 在未解锁时抛错 _(3 ms)_
- ✅ **CryptoService 用户 KeyStore** › encryptWithMasterKey + decryptWithMasterKey 闭环 _(19 ms)_
- ✅ **CryptoService session 管理** › saveSession / restoreSession 在同一 sandbox 中可恢复 _(18 ms)_
- ✅ **CryptoService session 管理** › clearSession 后无法恢复 _(23 ms)_
- ✅ **DiaryService.generateId** › 生成的 ID 以 diary_ 开头并唯一 _(2 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › createDiary 写入并返回完整结构 _(1 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › updateDiary 更新内容并触发情感分析 _(1 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › updateDiary 不存在的 id 返回 null _(0 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › deleteDiary 移除目标项 _(1 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › deleteDiary 不存在 id 返回 false _(0 ms)_
- ✅ **DiaryService 创建 / 读取 / 更新 / 删除** › getDiaryById 命中与未命中 _(1 ms)_
- ✅ **DiaryService 搜索与排序** › searchDiaries 按 title/content 模糊匹配 _(0 ms)_
- ✅ **DiaryService 搜索与排序** › searchDiaries 空查询返回全部副本 _(1 ms)_
- ✅ **DiaryService 搜索与排序** › sortDiaries 按 title asc/desc _(7 ms)_
- ✅ **DiaryService 搜索与排序** › sortDiaries 按 words 与 date _(0 ms)_
- ✅ **DiaryService 缓存与持久化** › clearCache 清空内存数据 _(1 ms)_
- ✅ **DiaryService 缓存与持久化** › createDiary 后会调用 AuthService.saveUserDiaries _(0 ms)_
- ✅ **DiaryService 缓存与持久化** › getDrafts 仅返回 isDraft=true _(1 ms)_
- ✅ **DiaryService 缓存与持久化** › getRecentDiaries 按时间倒序裁剪 _(0 ms)_
- ✅ **StatsService.countWords** › 空字符串返回 0 _(1 ms)_
- ✅ **StatsService.countWords** › 正确统计中文字符数 _(0 ms)_
- ✅ **StatsService.countWords** › 正确统计英文单词数 _(1 ms)_
- ✅ **StatsService.countWords** › 正确统计数字组数 _(0 ms)_
- ✅ **StatsService.countWords** › 混合中英文与数字 _(0 ms)_
- ✅ **StatsService.formatDate** › 格式化为 YYYY-MM-DD _(0 ms)_
- ✅ **StatsService.formatDate** › 补零规则正确 _(0 ms)_
- ✅ **StatsService 时间比较函数** › isSameDay 同一天返回 true _(0 ms)_
- ✅ **StatsService 时间比较函数** › isSameDay 不同天返回 false _(0 ms)_
- ✅ **StatsService 时间比较函数** › isSameMonth/Year 工作正常 _(1 ms)_
- ✅ **StatsService 时间比较函数** › isSameWeek: 周一与周日同一周 _(0 ms)_
- ✅ **StatsService.calculateStats** › 空日记返回零值结构 _(0 ms)_
- ✅ **StatsService.calculateStats** › 累计字数与情感统计正确 _(2 ms)_
- ✅ **StatsService.calculateStreak** › 无日记 streak 为 0 _(0 ms)_
- ✅ **StatsService.calculateStreak** › 包含今天 +昨天 streak 为 2 _(0 ms)_
- ✅ **StatsService.getEmotionChartData** › 空情感时返回 [0,0,0] _(0 ms)_
- ✅ **StatsService.getEmotionChartData** › 正确换算成百分比 _(0 ms)_
- ✅ **StatsService.generateChartHTML / generatePieChartHTML** › 空数据返回提示文字 _(0 ms)_
- ✅ **StatsService.generateChartHTML / generatePieChartHTML** › chart-bars HTML 包含数据 _(1 ms)_
- ✅ **SentimentService.preprocessText** › 去除标点并 trim _(1 ms)_
- ✅ **SentimentService.preprocessText** › 空输入返回空字符串 _(1 ms)_
- ✅ **SentimentService.tokenizeChinese** › 能识别情感词典中的词 _(0 ms)_
- ✅ **SentimentService.analyze** › 空文本返回中性默认结构 _(3 ms)_
- ✅ **SentimentService.analyze** › 强积极语句应得到 positive 主导 _(0 ms)_
- ✅ **SentimentService.analyze** › 强消极语句应得到 negative 主导 _(0 ms)_
- ✅ **SentimentService.analyze** › 结果三项概率近似归一 _(1 ms)_
- ✅ **SentimentService 显示辅助** › getEmotionLabel/Color/Emoji 默认值 _(0 ms)_
- ✅ **SentimentService 显示辅助** › positive 主导映射对应文案与颜色 _(0 ms)_
- ✅ **SentimentService 显示辅助** › negative 主导映射对应文案与颜色 _(1 ms)_
- ✅ **SentimentService 显示辅助** › formatAnalysisDisplay 返回完整结构 _(0 ms)_
- ✅ **DateUtils.format** › 默认格式 YYYY-MM-DD HH:mm:ss _(0 ms)_
- ✅ **DateUtils.format** › 自定义格式 _(0 ms)_
- ✅ **DateUtils.getDateDisplay** › 今天显示"今天" _(0 ms)_
- ✅ **DateUtils.getDateDisplay** › 昨天显示"昨天" _(0 ms)_
- ✅ **DateUtils.getDateDisplay** › 一周内返回星期 _(0 ms)_
- ✅ **DateUtils.getDateDisplay** › 一周以前返回 MM-DD 格式 _(0 ms)_
- ✅ **DateUtils.isToday/Week/Month/Year** › isToday 当前为 true _(0 ms)_
- ✅ **DateUtils.isToday/Week/Month/Year** › isThisMonth 当前为 true _(0 ms)_
- ✅ **DateUtils.isToday/Week/Month/Year** › isThisYear 当前为 true _(0 ms)_
- ✅ **DateUtils.isToday/Week/Month/Year** › 上一年返回 false _(0 ms)_
- ✅ **DateUtils.addXxx / diffXxx** › addDays 增加 5 天 _(0 ms)_
- ✅ **DateUtils.addXxx / diffXxx** › addHours 跨天 _(0 ms)_
- ✅ **DateUtils.addXxx / diffXxx** › addMinutes 60 分钟等同 +1h _(0 ms)_
- ✅ **DateUtils.addXxx / diffXxx** › diffDays 计算正确 _(0 ms)_
- ✅ **DateUtils.addXxx / diffXxx** › diffHours 计算正确 _(0 ms)_
- ✅ **DateUtils.getDayOfWeek / getDaysInMonth** › getDayOfWeek 返回中文 _(0 ms)_
- ✅ **DateUtils.getDayOfWeek / getDaysInMonth** › getDaysInMonth 二月 28 天 _(0 ms)_
- ✅ **DateUtils.getDayOfWeek / getDaysInMonth** › getDaysInMonth 一月 31 天 _(0 ms)_

## 四、Playwright 端到端测试

**结果总览**：✅ 全部通过

- 期望通过：5
- 异常失败：0
- Flaky：0
- 跳过：0
- 总耗时：4942.594 ms

### 用例明细

- ✅ **auth.spec.js › 鉴权页面** › 默认显示登录页 _(971 ms)_
- ✅ **auth.spec.js › 鉴权页面** › 切换到注册标签后展示注册表单 _(816 ms)_
- ✅ **auth.spec.js › 鉴权页面** › 注册必填项校验 _(749 ms)_
- ✅ **auth.spec.js › 鉴权页面** › 登录页关键交互按钮存在 _(750 ms)_
- ✅ **auth.spec.js › 页面静态资源加载** › 加载关键脚本无 404 _(1153 ms)_

## 五、运行方式

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器（首次）
npx playwright install chromium

# 单元测试
npm test

# E2E 测试
npm run test:e2e

# 一键生成本报告
npm run report
```

## 六、目录结构

```
tests/
├── setup/
│   ├── jest.polyfills.js   # 注入 webcrypto / TextEncoder 等
│   └── load-script.js      # 把 IIFE 源码加载进 vm 沙箱
├── unit/
│   ├── stats.service.test.js
│   ├── date.utils.test.js
│   ├── crypto.service.test.js
│   ├── sentiment.service.test.js
│   └── diary.service.test.js
└── e2e/
    └── auth.spec.js
```
