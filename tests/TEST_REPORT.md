# 加密日记应用 - 测试报告

## 概述

| 项目 | 数据 |
|------|------|
| **测试时间** | 2026/6/20 09:58:32 |
| **测试框架** | Jest 29 + jsdom (单元测试) / Playwright (E2E测试) |
| **测试环境** | Node.js v23.11.0 |
| **总测试数** | 161 |
| **通过** | 161 ✅ |
| **失败** | 0 ❌ |
| **通过率** | 100.0% |

---

## 测试汇总

### 单元测试 (Jest + jsdom)

| 指标 | 数值 |
|------|------|
| **测试套件数** | 5 |
| **通过套件** | 5 |
| **失败套件** | 0 |
| **总用例数** | 150 |
| **通过用例** | 150 |
| **失败用例** | 0 |
| **耗时** | 0.29s |

### 端到端测试 (Playwright)

| 指标 | 数值 |
|------|------|
| **总用例数** | 11 |
| **通过用例** | 11 |
| **失败用例** | 0 |
| **跳过用例** | 0 |
| **耗时** | 39.3s |

---

## 测试覆盖模块

### 核心服务模块

| 模块 | 测试文件 | 用例数 | 描述 |
|------|----------|--------|------|
| **DateUtils** | [date.utils.test.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/unit/date.utils.test.js) | 33 | 日期格式化、日期计算、日期判断等工具函数 |
| **StatsService** | [stats.service.test.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/unit/stats.service.test.js) | 38 | 字数统计、日记统计、连续写作、图表数据生成 |
| **CryptoService** | [crypto.service.test.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/unit/crypto.service.test.js) | 26 | AES-GCM加密解密、密钥派生、密钥包装、会话管理 |
| **SentimentService** | [sentiment.service.test.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/unit/sentiment.service.test.js) | 24 | 文本预处理、中文分词、情感分析、情绪标签 |
| **DiaryService** | [diary.service.test.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/unit/diary.service.test.js) | 29 | 日记创建/读取/更新/删除、搜索、排序、草稿 |
| **App E2E** | [app.spec.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/e2e/app.spec.js) | 11 | 页面加载、注册登录、日记创建、统计页面、时间轴、退出 |

---

## 单元测试详细结果


### tests/unit/crypto.service.test.js

**状态**: ✅ 通过 | **用例**: 26/26 通过 | **耗时**: 0.19s

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | should convert between ArrayBuffer and Base64 | 0.001s |
| ✅ | should handle empty buffer | 0.001s |
| ✅ | should generate salt with correct length | 0.000s |
| ✅ | should generate unique salts | 0.000s |
| ✅ | should generate a valid AES-GCM key | 0.002s |
| ✅ | should export and import key correctly | 0.002s |
| ✅ | should encrypt and decrypt string data | 0.000s |
| ✅ | should encrypt and decrypt object data (JSON) | 0.000s |
| ✅ | should produce different ciphertexts for same plaintext | 0.000s |
| ✅ | should produce consistent hash for same input | 0.000s |
| ✅ | should produce different hashes for different inputs | 0.000s |
| ✅ | should produce base64 string output | 0.000s |
| ✅ | should derive key from password and salt | 0.009s |
| ✅ | should derive same key from same password and salt | 0.016s |
| ✅ | should derive different keys from different passwords | 0.017s |
| ✅ | should wrap and unwrap key correctly | 0.001s |
| ✅ | should create key store and unlock it | 0.016s |
| ✅ | should fail to unlock with wrong password | 0.030s |
| ✅ | should set and get master key | 0.000s |
| ✅ | should encrypt and decrypt with master key | 0.000s |
| ✅ | should throw when master key not available | 0.001s |
| ✅ | should save and restore session | 0.002s |
| ✅ | should return false when saving session without master key | 0.000s |
| ✅ | should clear session | 0.001s |
| ✅ | should save and retrieve key store from session | 0.000s |
| ✅ | should return null for invalid key store JSON | 0.000s |

### tests/unit/diary.service.test.js

**状态**: ✅ 通过 | **用例**: 29/29 通过 | **耗时**: 0.04s

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | should set and get diaries array | 0.000s |
| ✅ | should return a copy, not reference | 0.000s |
| ✅ | should handle non-array input | 0.000s |
| ✅ | should generate unique IDs | 0.000s |
| ✅ | should set and get current diary | 0.001s |
| ✅ | should find diary by id | 0.000s |
| ✅ | should return null for non-existent id | 0.001s |
| ✅ | should create a new diary with default values | 0.001s |
| ✅ | should create diary with provided options | 0.001s |
| ✅ | should add new diary to the beginning of array | 0.000s |
| ✅ | should update existing diary | 0.001s |
| ✅ | should return null for non-existent diary | 0.000s |
| ✅ | should update updatedAt timestamp | 0.011s |
| ✅ | should update currentDiary if it matches | 0.001s |
| ✅ | should delete existing diary | 0.000s |
| ✅ | should return false for non-existent diary | 0.000s |
| ✅ | should clear currentDiary if deleted | 0.000s |
| ✅ | should return all diaries for empty query | 0.000s |
| ✅ | should search by title | 0.000s |
| ✅ | should search by content | 0.001s |
| ✅ | should be case insensitive | 0.000s |
| ✅ | should filter diaries by date range | 0.000s |
| ✅ | should sort diaries by date descending by default | 0.000s |
| ✅ | should sort by title | 0.005s |
| ✅ | should sort by word count | 0.001s |
| ✅ | should clear diaries and current diary | 0.000s |
| ✅ | should return stats for diaries | 0.000s |
| ✅ | should return recent diaries sorted by date | 0.000s |
| ✅ | should return only draft diaries | 0.000s |

### tests/unit/date.utils.test.js

**状态**: ✅ 通过 | **用例**: 33/33 通过 | **耗时**: 0.02s

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | should format date with default format | 0.001s |
| ✅ | should format date with custom format YYYY-MM-DD | 0.000s |
| ✅ | should format date with HH:mm:ss | 0.000s |
| ✅ | should pad single digit months and days with zero | 0.001s |
| ✅ | should return "今天" for today | 0.000s |
| ✅ | should return "昨天" for yesterday | 0.000s |
| ✅ | should return day of week for dates within 7 days | 0.000s |
| ✅ | should return MM-DD format for older dates | 0.000s |
| ✅ | should return time in HH:mm format | 0.000s |
| ✅ | should combine date display and time display | 0.000s |
| ✅ | should return current date in Chinese format | 0.000s |
| ✅ | should return current time in HH:mm format | 0.000s |
| ✅ | should return current date and time in Chinese format | 0.000s |
| ✅ | should return true for today | 0.000s |
| ✅ | should return false for yesterday | 0.000s |
| ✅ | should return true for current month | 0.000s |
| ✅ | should return false for last month | 0.001s |
| ✅ | should return true for current year | 0.000s |
| ✅ | should return false for last year | 0.000s |
| ✅ | should return correct day of week in Chinese | 0.000s |
| ✅ | should return 周一 for a Monday | 0.000s |
| ✅ | should return 31 for January | 0.000s |
| ✅ | should return 29 for February leap year | 0.000s |
| ✅ | should return 28 for February non-leap year | 0.000s |
| ✅ | should return 30 for April | 0.000s |
| ✅ | should add specified days to date | 0.000s |
| ✅ | should handle month rollover | 0.000s |
| ✅ | should subtract days with negative value | 0.000s |
| ✅ | should add specified hours to date | 0.000s |
| ✅ | should add specified minutes to date | 0.000s |
| ✅ | should calculate days difference between two dates | 0.000s |
| ✅ | should return absolute difference | 0.000s |
| ✅ | should calculate hours difference between two dates | 0.000s |

### tests/unit/stats.service.test.js

**状态**: ✅ 通过 | **用例**: 38/38 通过 | **耗时**: 0.02s

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | should return 0 for empty text | 0.000s |
| ✅ | should count Chinese characters | 0.000s |
| ✅ | should count English words | 0.000s |
| ✅ | should count numbers | 0.000s |
| ✅ | should count mixed content correctly | 0.000s |
| ✅ | should format date as YYYY-MM-DD | 0.000s |
| ✅ | should pad single digits | 0.000s |
| ✅ | should return true for same day | 0.000s |
| ✅ | should return false for different days | 0.001s |
| ✅ | should return true for same week (Monday to Sunday) | 0.000s |
| ✅ | should return false for different weeks | 0.000s |
| ✅ | should return true for same month | 0.000s |
| ✅ | should return false for different months | 0.000s |
| ✅ | should return true for same year | 0.000s |
| ✅ | should return false for different years | 0.000s |
| ✅ | should return day range | 0.000s |
| ✅ | should return week range | 0.000s |
| ✅ | should return month range | 0.000s |
| ✅ | should return year range | 0.000s |
| ✅ | should return null for invalid period | 0.000s |
| ✅ | should filter diaries by week | 0.001s |
| ✅ | should return all diaries for invalid period | 0.000s |
| ✅ | should return zero stats for empty diaries | 0.000s |
| ✅ | should calculate stats for diaries without sentiment | 0.000s |
| ✅ | should calculate emotion stats from sentiment | 0.000s |
| ✅ | should calculate average words | 0.000s |
| ✅ | should return 0 for empty diaries | 0.000s |
| ✅ | should return 1 for diary written today | 0.000s |
| ✅ | should return empty array for no diaries | 0.000s |
| ✅ | should detect consecutive days | 0.000s |
| ✅ | should return null for empty diaries | 0.000s |
| ✅ | should return the longest streak | 0.000s |
| ✅ | should return zero data for no emotions | 0.000s |
| ✅ | should calculate percentages correctly | 0.000s |
| ✅ | should return no data message for empty data | 0.000s |
| ✅ | should generate chart HTML | 0.000s |
| ✅ | should return no data message for all zeros | 0.000s |
| ✅ | should generate pie chart legend | 0.000s |

### tests/unit/sentiment.service.test.js

**状态**: ✅ 通过 | **用例**: 24/24 通过 | **耗时**: 0.02s

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | should return empty string for null/undefined input | 0.000s |
| ✅ | should convert text to lowercase | 0.000s |
| ✅ | should remove special characters | 0.001s |
| ✅ | should normalize whitespace | 0.000s |
| ✅ | should tokenize Chinese text | 0.000s |
| ✅ | should handle empty text | 0.000s |
| ✅ | should return neutral result for empty text | 0.000s |
| ✅ | should detect positive sentiment with positive keywords | 0.000s |
| ✅ | should detect negative sentiment with negative keywords | 0.000s |
| ✅ | should detect neutral sentiment with neutral keywords | 0.000s |
| ✅ | should return proper result structure | 0.001s |
| ✅ | should have scores that sum to approximately 1 | 0.000s |
| ✅ | should have scores between 0 and 1 | 0.001s |
| ✅ | should load model and analyze text | 0.000s |
| ✅ | should return emoji for positive sentiment | 0.001s |
| ✅ | should return emoji for negative sentiment | 0.000s |
| ✅ | should return emoji for neutral sentiment | 0.000s |
| ✅ | should return default emoji for null input | 0.000s |
| ✅ | should return Chinese labels | 0.000s |
| ✅ | should return default label for null input | 0.000s |
| ✅ | should return correct colors | 0.000s |
| ✅ | should return default color for null input | 0.000s |
| ✅ | should return waiting state for null input | 0.000s |
| ✅ | should format analysis result correctly | 0.000s |

---

## E2E 测试详细结果


### tests/e2e/app.spec.js

**状态**: ✅ 通过 | **用例**: 11/11 通过

| 状态 | 测试用例 | 耗时 |
|------|----------|------|
| ✅ | 页面应该正确加载并显示登录页面 | N/A |
| ✅ | 应该能切换到注册标签页 | N/A |
| ✅ | 登录表单应该验证空输入 | N/A |
| ✅ | 应该成功注册新用户 | N/A |
| ✅ | 注册表单应该验证密码长度 | N/A |
| ✅ | 注册表单应该验证密码匹配 | N/A |
| ✅ | 注册后应该能登录并进入主页面 | N/A |
| ✅ | 登录后应该能创建新日记 | N/A |
| ✅ | 应该能访问统计页面 | N/A |
| ✅ | 应该能访问时间轴页面 | N/A |
| ✅ | 应该能退出登录 | N/A |

---

## 测试基础设施

### 配置文件

| 文件 | 说明 |
|------|------|
| [jest.config.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/jest.config.js) | Jest 配置，使用 jsdom 测试环境 |
| [playwright.config.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/playwright.config.js) | Playwright E2E 测试配置 |
| [tests/setup.js](file:///Volumes/ExMac/traeProject/0617GSB/xyj-14/xyj-14-618_Earth/tests/setup.js) | 测试环境初始化，加载源文件、polyfill Web API |

### NPM 脚本命令

| 命令 | 说明 |
|------|------|
| `npm test` | 运行所有 Jest 单元测试 |
| `npm run test:unit` | 仅运行单元测试 |
| `npm run test:coverage` | 运行单元测试并生成覆盖率报告 |
| `npm run test:e2e` | 运行 Playwright E2E 测试 |
| `npm run test:report` | 生成测试 MD 报告 |

### Polyfills (Node.js 测试环境)

- **Web Crypto API** (`crypto.subtle`) → Node.js `webcrypto`
- **TextEncoder / TextDecoder** → Node.js `util` 模块
- **btoa / atob** → Buffer base64 编码
- **localStorage / sessionStorage** → 内存存储 Mock

---

## 结论

本次测试共执行 **161** 个用例，通过 **161** 个，失败 **0** 个，通过率 **100.0%**。

- ✅ 纯计算模块 (DateUtils, StatsService) 全部测试通过
- ✅ 加密模块 (CryptoService) AES-GCM 加解密、密钥管理、会话存储测试通过
- ✅ 情感分析模块 (SentimentService) 文本分析、情绪标签测试通过
- ✅ 日记 CRUD 服务 (DiaryService) 创建/更新/删除/搜索/排序测试通过
- ✅ UI 端到端测试 (Playwright) 注册、登录、日记创建、统计、时间轴、退出流程全部通过

*报告生成时间: 2026/6/20 09:58:32*
