const path = require('path');

describe('SentimentService', () => {
  beforeAll(() => {
    mockDependentServices();
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'sentiment.service.js'));
  });

  describe('preprocessText', () => {
    test('空文本应该返回空字符串', () => {
      expect(SentimentService.preprocessText('')).toBe('');
      expect(SentimentService.preprocessText(null)).toBe('');
      expect(SentimentService.preprocessText(undefined)).toBe('');
    });

    test('应该转换为小写', () => {
      expect(SentimentService.preprocessText('HELLO WORLD')).toBe('hello world');
    });

    test('应该移除特殊字符', () => {
      expect(SentimentService.preprocessText('Hello! @World# 123')).toBe('hello world 123');
    });

    test('应该规范空白字符', () => {
      expect(SentimentService.preprocessText('hello   world  \n  test')).toBe('hello world test');
    });
  });

  describe('tokenizeChinese', () => {
    test('应该分词中文文本并识别情感词', () => {
      const tokens = SentimentService.tokenizeChinese('今天很开心快乐');
      expect(tokens).toContain('开心');
      expect(tokens).toContain('快乐');
    });

    test('应该正确处理普通字符', () => {
      const tokens = SentimentService.tokenizeChinese('你好世界');
      expect(tokens.length).toBeGreaterThan(0);
    });
  });

  describe('analyze', () => {
    test('空文本应该返回中性结果', async () => {
      const result = await SentimentService.analyze('');
      expect(result).toBeDefined();
      expect(result.dominant).toBe('neutral');
      expect(result.positive).toBeCloseTo(0.33, 1);
      expect(result.neutral).toBeCloseTo(0.34, 1);
      expect(result.negative).toBeCloseTo(0.33, 1);
    });

    test('积极词汇应该返回积极情感', async () => {
      const result = await SentimentService.analyze('今天非常开心快乐幸福，一切都很美好顺利');
      expect(result).toBeDefined();
      expect(result.keywords.some(k => k.sentiment === 'positive')).toBe(true);
    });

    test('消极词汇应该返回消极情感', async () => {
      const result = await SentimentService.analyze('今天很难过伤心失望，感觉非常糟糕痛苦');
      expect(result).toBeDefined();
      expect(result.keywords.some(k => k.sentiment === 'negative')).toBe(true);
    });

    test('应该返回正确的数据结构', async () => {
      const result = await SentimentService.analyze('测试文本');
      expect(result).toHaveProperty('positive');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('negative');
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('keywords');
      
      expect(typeof result.positive).toBe('number');
      expect(typeof result.neutral).toBe('number');
      expect(typeof result.negative).toBe('number');
      expect(['positive', 'neutral', 'negative']).toContain(result.dominant);
      expect(result.positive + result.neutral + result.negative).toBeCloseTo(1, 1);
    });
  });

  describe('getEmotionEmoji', () => {
    test('应该返回积极情感的 emoji', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'positive' });
      expect(emoji).toBeDefined();
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    test('应该返回中性情感的 emoji', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'neutral' });
      expect(emoji).toBeDefined();
    });

    test('应该返回消极情感的 emoji', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'negative' });
      expect(emoji).toBeDefined();
    });

    test('null 输入应该返回默认 emoji', () => {
      const emoji = SentimentService.getEmotionEmoji(null);
      expect(emoji).toBe('😊');
    });
  });

  describe('getEmotionLabel', () => {
    test('应该返回正确的中文标签', () => {
      expect(SentimentService.getEmotionLabel({ dominant: 'positive' })).toBe('积极');
      expect(SentimentService.getEmotionLabel({ dominant: 'neutral' })).toBe('中性');
      expect(SentimentService.getEmotionLabel({ dominant: 'negative' })).toBe('消极');
    });

    test('null 输入应该返回默认标签', () => {
      expect(SentimentService.getEmotionLabel(null)).toBe('中性');
    });
  });

  describe('getEmotionColor', () => {
    test('应该返回正确的颜色代码', () => {
      expect(SentimentService.getEmotionColor({ dominant: 'positive' })).toBe('#22c55e');
      expect(SentimentService.getEmotionColor({ dominant: 'neutral' })).toBe('#f59e0b');
      expect(SentimentService.getEmotionColor({ dominant: 'negative' })).toBe('#ef4444');
    });

    test('null 输入应该返回默认颜色', () => {
      expect(SentimentService.getEmotionColor(null)).toBe('#f59e0b');
    });
  });

  describe('formatAnalysisDisplay', () => {
    test('应该格式化分析结果用于显示', () => {
      const analysis = {
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        dominant: 'positive',
        confidence: 0.6
      };
      
      const display = SentimentService.formatAnalysisDisplay(analysis);
      expect(display).toHaveProperty('label');
      expect(display).toHaveProperty('emoji');
      expect(display).toHaveProperty('color');
      expect(display).toHaveProperty('positive', 60);
      expect(display).toHaveProperty('neutral', 30);
      expect(display).toHaveProperty('negative', 10);
      expect(display.label).toBe('积极');
      expect(display.color).toBe('#22c55e');
    });

    test('null 输入应该返回待分析状态', () => {
      const display = SentimentService.formatAnalysisDisplay(null);
      expect(display.label).toBe('待分析');
      expect(display.emoji).toBe('🤔');
      expect(display.color).toBe('#64748b');
    });
  });

  describe('loadModel', () => {
    test('应该成功加载模型', async () => {
      const result = await SentimentService.loadModel();
      expect(result).toBe(true);
    });

    test('重复加载应该直接返回', async () => {
      const result1 = await SentimentService.loadModel();
      const result2 = await SentimentService.loadModel();
      expect(result1).toBe(true);
      expect(result2).toBe(true);
    });
  });
});
