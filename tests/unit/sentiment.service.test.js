/**
 * SentimentService 单元测试
 */
const { loadScript, createSandbox } = require('../setup/load-script');

let SentimentService;

beforeAll(() => {
    const sandbox = createSandbox();
    loadScript('js/services/sentiment.service.js', sandbox);
    SentimentService = sandbox.SentimentService;
});

describe('SentimentService.preprocessText', () => {
    test('去除标点并 trim', () => {
        const out = SentimentService.preprocessText('Hello, World!! 你好。');
        expect(out).toBe('hello world 你好');
    });

    test('空输入返回空字符串', () => {
        expect(SentimentService.preprocessText('')).toBe('');
        expect(SentimentService.preprocessText(null)).toBe('');
    });
});

describe('SentimentService.tokenizeChinese', () => {
    test('能识别情感词典中的词', () => {
        const tokens = SentimentService.tokenizeChinese('开心');
        expect(tokens).toContain('开心');
    });
});

describe('SentimentService.analyze', () => {
    test('空文本返回中性默认结构', async () => {
        const r = await SentimentService.analyze('');
        expect(r.dominant).toBe('neutral');
        expect(r.positive + r.neutral + r.negative).toBeCloseTo(1, 1);
    });

    test('强积极语句应得到 positive 主导', async () => {
        const r = await SentimentService.analyze('今天很开心 很快乐 很幸福 很美好');
        expect(r.dominant).toBe('positive');
        expect(r.keywords.some(k => k.sentiment === 'positive')).toBe(true);
    });

    test('强消极语句应得到 negative 主导', async () => {
        const r = await SentimentService.analyze('我很难过 很伤心 很痛苦 很失望');
        expect(r.dominant).toBe('negative');
        expect(r.keywords.some(k => k.sentiment === 'negative')).toBe(true);
    });

    test('结果三项概率近似归一', async () => {
        const r = await SentimentService.analyze('今天天气还不错 心情平静');
        const sum = r.positive + r.neutral + r.negative;
        expect(sum).toBeGreaterThan(0.95);
        expect(sum).toBeLessThanOrEqual(1.01);
    });
});

describe('SentimentService 显示辅助', () => {
    test('getEmotionLabel/Color/Emoji 默认值', () => {
        expect(SentimentService.getEmotionLabel(null)).toBe('中性');
        expect(SentimentService.getEmotionColor(null)).toBe('#f59e0b');
        expect(typeof SentimentService.getEmotionEmoji(null)).toBe('string');
    });

    test('positive 主导映射对应文案与颜色', () => {
        const r = { dominant: 'positive' };
        expect(SentimentService.getEmotionLabel(r)).toBe('积极');
        expect(SentimentService.getEmotionColor(r)).toBe('#22c55e');
    });

    test('negative 主导映射对应文案与颜色', () => {
        const r = { dominant: 'negative' };
        expect(SentimentService.getEmotionLabel(r)).toBe('消极');
        expect(SentimentService.getEmotionColor(r)).toBe('#ef4444');
    });

    test('formatAnalysisDisplay 返回完整结构', () => {
        const r = SentimentService.formatAnalysisDisplay({
            dominant: 'positive',
            positive: 0.8,
            neutral: 0.1,
            negative: 0.1
        });
        expect(r).toMatchObject({
            label: '积极',
            color: '#22c55e',
            positive: 80,
            neutral: 10,
            negative: 10
        });
    });
});
