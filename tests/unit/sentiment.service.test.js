describe('SentimentService', () => {
  beforeAll(async () => {
    await SentimentService.loadModel();
  });

  describe('preprocessText', () => {
    test('should return empty string for null/undefined input', () => {
      expect(SentimentService.preprocessText(null)).toBe('');
      expect(SentimentService.preprocessText(undefined)).toBe('');
      expect(SentimentService.preprocessText('')).toBe('');
    });

    test('should convert text to lowercase', () => {
      expect(SentimentService.preprocessText('HELLO World')).toBe('hello world');
    });

    test('should remove special characters', () => {
      const result = SentimentService.preprocessText('Hello! @World# 你好！');
      expect(result).not.toContain('!');
      expect(result).not.toContain('@');
      expect(result).not.toContain('#');
    });

    test('should normalize whitespace', () => {
      const result = SentimentService.preprocessText('hello    world   test');
      expect(result).toBe('hello world test');
    });
  });

  describe('tokenizeChinese', () => {
    test('should tokenize Chinese text', () => {
      const tokens = SentimentService.tokenizeChinese('今天很开心');
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens).toContain('开心');
    });

    test('should handle empty text', () => {
      const tokens = SentimentService.tokenizeChinese('');
      expect(tokens).toEqual([]);
    });
  });

  describe('analyze', () => {
    test('should return neutral result for empty text', async () => {
      const result = await SentimentService.analyze('');
      expect(result.dominant).toBe('neutral');
      expect(result.positive).toBe(0.33);
      expect(result.neutral).toBe(0.34);
      expect(result.negative).toBe(0.33);
    });

    test('should detect positive sentiment with positive keywords', async () => {
      const result = await SentimentService.analyze('开心快乐幸福美好满足愉快精彩');
      expect(result.keywords.filter(k => k.sentiment === 'positive').length).toBeGreaterThan(0);
      expect(result.dominant).not.toBe('negative');
    });

    test('should detect negative sentiment with negative keywords', async () => {
      const result = await SentimentService.analyze('难过伤心痛苦失望沮丧郁闷烦恼焦虑');
      expect(result.keywords.filter(k => k.sentiment === 'negative').length).toBeGreaterThan(0);
      expect(result.dominant).not.toBe('positive');
    });

    test('should detect neutral sentiment with neutral keywords', async () => {
      const result = await SentimentService.analyze('平静普通日常正常平凡冷静客观');
      expect(result.keywords.filter(k => k.sentiment === 'neutral').length).toBeGreaterThan(0);
    });

    test('should return proper result structure', async () => {
      const result = await SentimentService.analyze('开心快乐高兴幸福美好');
      expect(result).toHaveProperty('positive');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('negative');
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('keywords');
    });

    test('should have scores that sum to approximately 1', async () => {
      const result = await SentimentService.analyze('开心快乐高兴幸福美好');
      const sum = result.positive + result.neutral + result.negative;
      expect(sum).toBeCloseTo(1, 5);
    });

    test('should have scores between 0 and 1', async () => {
      const result = await SentimentService.analyze('开心快乐高兴幸福美好');
      expect(result.positive).toBeGreaterThanOrEqual(0);
      expect(result.positive).toBeLessThanOrEqual(1);
      expect(result.neutral).toBeGreaterThanOrEqual(0);
      expect(result.neutral).toBeLessThanOrEqual(1);
      expect(result.negative).toBeGreaterThanOrEqual(0);
      expect(result.negative).toBeLessThanOrEqual(1);
    });

    test('should load model and analyze text', async () => {
      const result = await SentimentService.analyze('今天很开心');
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('positive');
    });
  });

  describe('getEmotionEmoji', () => {
    test('should return emoji for positive sentiment', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'positive' });
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    test('should return emoji for negative sentiment', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'negative' });
      expect(typeof emoji).toBe('string');
    });

    test('should return emoji for neutral sentiment', () => {
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'neutral' });
      expect(typeof emoji).toBe('string');
    });

    test('should return default emoji for null input', () => {
      const emoji = SentimentService.getEmotionEmoji(null);
      expect(emoji).toBe('😊');
    });
  });

  describe('getEmotionLabel', () => {
    test('should return Chinese labels', () => {
      expect(SentimentService.getEmotionLabel({ dominant: 'positive' })).toBe('积极');
      expect(SentimentService.getEmotionLabel({ dominant: 'neutral' })).toBe('中性');
      expect(SentimentService.getEmotionLabel({ dominant: 'negative' })).toBe('消极');
    });

    test('should return default label for null input', () => {
      expect(SentimentService.getEmotionLabel(null)).toBe('中性');
    });
  });

  describe('getEmotionColor', () => {
    test('should return correct colors', () => {
      expect(SentimentService.getEmotionColor({ dominant: 'positive' })).toBe('#22c55e');
      expect(SentimentService.getEmotionColor({ dominant: 'neutral' })).toBe('#f59e0b');
      expect(SentimentService.getEmotionColor({ dominant: 'negative' })).toBe('#ef4444');
    });

    test('should return default color for null input', () => {
      expect(SentimentService.getEmotionColor(null)).toBe('#f59e0b');
    });
  });

  describe('formatAnalysisDisplay', () => {
    test('should return waiting state for null input', () => {
      const result = SentimentService.formatAnalysisDisplay(null);
      expect(result.label).toBe('待分析');
      expect(result.emoji).toBe('🤔');
      expect(result.color).toBe('#64748b');
    });

    test('should format analysis result correctly', () => {
      const analysis = {
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        dominant: 'positive',
        confidence: 0.6
      };
      const result = SentimentService.formatAnalysisDisplay(analysis);
      expect(result.label).toBe('积极');
      expect(result.positive).toBe(60);
      expect(result.neutral).toBe(30);
      expect(result.negative).toBe(10);
    });
  });
});
