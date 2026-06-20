/**
 * StatsService 单元测试
 */
const { loadScript, createSandbox } = require('../setup/load-script');

let StatsService;

beforeAll(() => {
    const sandbox = createSandbox();
    loadScript('js/services/stats.service.js', sandbox);
    StatsService = sandbox.StatsService;
});

describe('StatsService.countWords', () => {
    test('空字符串返回 0', () => {
        expect(StatsService.countWords('')).toBe(0);
        expect(StatsService.countWords(null)).toBe(0);
        expect(StatsService.countWords(undefined)).toBe(0);
    });

    test('正确统计中文字符数', () => {
        expect(StatsService.countWords('你好世界')).toBe(4);
    });

    test('正确统计英文单词数', () => {
        expect(StatsService.countWords('hello world foo')).toBe(3);
    });

    test('正确统计数字组数', () => {
        expect(StatsService.countWords('123 456')).toBe(2);
    });

    test('混合中英文与数字', () => {
        expect(StatsService.countWords('你好 hello 123')).toBe(2 + 1 + 1);
    });
});

describe('StatsService.formatDate', () => {
    test('格式化为 YYYY-MM-DD', () => {
        const d = new Date(2024, 5, 1, 10, 0, 0);
        expect(StatsService.formatDate(d)).toBe('2024-06-01');
    });

    test('补零规则正确', () => {
        const d = new Date(2024, 0, 9);
        expect(StatsService.formatDate(d)).toBe('2024-01-09');
    });
});

describe('StatsService 时间比较函数', () => {
    test('isSameDay 同一天返回 true', () => {
        expect(StatsService.isSameDay('2024-06-01T01:00:00', '2024-06-01T22:00:00')).toBe(true);
    });

    test('isSameDay 不同天返回 false', () => {
        expect(StatsService.isSameDay('2024-06-01', '2024-06-02')).toBe(false);
    });

    test('isSameMonth/Year 工作正常', () => {
        expect(StatsService.isSameMonth('2024-06-01', '2024-06-30')).toBe(true);
        expect(StatsService.isSameMonth('2024-06-01', '2024-07-01')).toBe(false);
        expect(StatsService.isSameYear('2024-01-01', '2024-12-31')).toBe(true);
        expect(StatsService.isSameYear('2023-12-31', '2024-01-01')).toBe(false);
    });

    test('isSameWeek: 周一与周日同一周', () => {
        const monday = new Date(2024, 5, 3);
        const sunday = new Date(2024, 5, 9);
        expect(StatsService.isSameWeek(monday, sunday)).toBe(true);
    });
});

describe('StatsService.calculateStats', () => {
    test('空日记返回零值结构', () => {
        const stats = StatsService.calculateStats([], 'all');
        expect(stats.totalDiaries).toBe(0);
        expect(stats.totalWords).toBe(0);
        expect(stats.avgWords).toBe(0);
        expect(stats.streak).toBe(0);
        expect(stats.emotionStats).toEqual({ positive: 0, neutral: 0, negative: 0 });
    });

    test('累计字数与情感统计正确', () => {
        const today = new Date().toISOString();
        const diaries = [
            { id: '1', content: '你好 hello', createdAt: today, sentiment: { dominant: 'positive' } },
            { id: '2', content: '难过', createdAt: today, sentiment: { dominant: 'negative' } }
        ];
        const stats = StatsService.calculateStats(diaries, 'all');
        expect(stats.totalDiaries).toBe(2);
        expect(stats.totalWords).toBe(2 + 1 + 2);
        expect(stats.emotionStats.positive).toBe(1);
        expect(stats.emotionStats.negative).toBe(1);
    });
});

describe('StatsService.calculateStreak', () => {
    test('无日记 streak 为 0', () => {
        expect(StatsService.calculateStreak([])).toBe(0);
    });

    test('包含今天 +昨天 streak 为 2', () => {
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const diaries = [
            { id: '1', createdAt: today.toISOString() },
            { id: '2', createdAt: yesterday.toISOString() }
        ];
        expect(StatsService.calculateStreak(diaries)).toBe(2);
    });
});

describe('StatsService.getEmotionChartData', () => {
    test('空情感时返回 [0,0,0]', () => {
        const data = StatsService.getEmotionChartData({
            emotionStats: { positive: 0, neutral: 0, negative: 0 }
        });
        expect(data.data).toEqual([0, 0, 0]);
    });

    test('正确换算成百分比', () => {
        const data = StatsService.getEmotionChartData({
            emotionStats: { positive: 1, neutral: 1, negative: 2 }
        });
        expect(data.data.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(99);
        expect(data.data[2]).toBe(50);
    });
});

describe('StatsService.generateChartHTML / generatePieChartHTML', () => {
    test('空数据返回提示文字', () => {
        expect(StatsService.generateChartHTML(null)).toContain('暂无数据');
        expect(StatsService.generatePieChartHTML({ data: [0, 0, 0], labels: [], colors: [] }))
            .toContain('暂无数据');
    });

    test('chart-bars HTML 包含数据', () => {
        const html = StatsService.generateChartHTML({
            labels: ['Mon', 'Tue'],
            data: [1, 2]
        });
        expect(html).toContain('chart-bar-item');
        expect(html).toContain('Mon');
        expect(html).toContain('Tue');
    });
});
