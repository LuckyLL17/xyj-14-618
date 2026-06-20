describe('SentimentService', () => {
  beforeEach(() => {
    resetModules();
    loadScript('js/services/sentiment.service.js');
  });

  describe('preprocessText', () => {
    it('should return empty string for empty input', () => {
      expect(SentimentService.preprocessText('')).toBe('');
      expect(SentimentService.preprocessText(null)).toBe('');
      expect(SentimentService.preprocessText(undefined)).toBe('');
    });

    it('should convert to lowercase', () => {
      expect(SentimentService.preprocessText('HELLO WORLD')).toBe('hello world');
    });

    it('should remove special characters', () => {
      const result = SentimentService.preprocessText('你好！@#世界');
      expect(result).not.toContain('！');
      expect(result).not.toContain('@');
    });

    it('should normalize whitespace', () => {
      const result = SentimentService.preprocessText('hello    world   ');
      expect(result).toBe('hello world');
    });
  });

  describe('tokenizeChinese', () => {
    it('should tokenize text correctly', () => {
      const tokens = SentimentService.tokenizeChinese('今天开心');
      expect(tokens).toContain('开心');
    });

    it('should find multi-character words', () => {
      const tokens = SentimentService.tokenizeChinese('我今天很快乐');
      expect(tokens).toContain('快乐');
    });
  });

  describe('analyze', () => {
    it('should return neutral result for empty text', async () => {
      const result = await SentimentService.analyze('');
      expect(result.dominant).toBe('neutral');
      expect(result.tokens).toEqual([]);
      expect(result.keywords).toEqual([]);
    });

    it('should detect positive sentiment', async () => {
      const result = await SentimentService.analyze('今天天气真好，我很开心快乐！');
      expect(result.dominant).toBe('positive');
      expect(result.positive).toBeGreaterThan(result.negative);
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should detect negative sentiment', async () => {
      const result = await SentimentService.analyze('今天很难过，伤心失望痛苦');
      expect(result.dominant).toBe('negative');
      expect(result.negative).toBeGreaterThan(result.positive);
    });

    it('should return scores that sum to approximately 1', async () => {
      const result = await SentimentService.analyze('今天心情不错，工作顺利');
      const sum = result.positive + result.neutral + result.negative;
      expect(sum).toBeCloseTo(1, 5);
    });

    it('should return all required fields', async () => {
      const result = await SentimentService.analyze('测试文本');
      expect(result).toHaveProperty('positive');
      expect(result).toHaveProperty('neutral');
      expect(result).toHaveProperty('negative');
      expect(result).toHaveProperty('dominant');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('tokens');
      expect(result).toHaveProperty('keywords');
    });
  });

  describe('getEmotionEmoji', () => {
    it('should return default emoji for null input', () => {
      expect(SentimentService.getEmotionEmoji(null)).toBe('😊');
    });

    it('should return positive emoji for positive sentiment', () => {
      const positiveEmojis = ['😊', '😄', '🥰', '😍', '🤩', '😎', '🥳', '🎉', '✨', '🌟'];
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'positive' });
      expect(positiveEmojis).toContain(emoji);
    });

    it('should return neutral emoji for neutral sentiment', () => {
      const neutralEmojis = ['😐', '😶', '🫤', '😑', '🤔', '😌', '🙂', '😊'];
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'neutral' });
      expect(neutralEmojis).toContain(emoji);
    });

    it('should return negative emoji for negative sentiment', () => {
      const negativeEmojis = ['😢', '😭', '😔', '😞', '😟', '😤', '😠', '😡', '😰', '😨', '💔'];
      const emoji = SentimentService.getEmotionEmoji({ dominant: 'negative' });
      expect(negativeEmojis).toContain(emoji);
    });
  });

  describe('getEmotionLabel', () => {
    it('should return correct Chinese labels', () => {
      expect(SentimentService.getEmotionLabel({ dominant: 'positive' })).toBe('积极');
      expect(SentimentService.getEmotionLabel({ dominant: 'neutral' })).toBe('中性');
      expect(SentimentService.getEmotionLabel({ dominant: 'negative' })).toBe('消极');
      expect(SentimentService.getEmotionLabel(null)).toBe('中性');
    });
  });

  describe('getEmotionColor', () => {
    it('should return correct colors', () => {
      expect(SentimentService.getEmotionColor({ dominant: 'positive' })).toBe('#22c55e');
      expect(SentimentService.getEmotionColor({ dominant: 'neutral' })).toBe('#f59e0b');
      expect(SentimentService.getEmotionColor({ dominant: 'negative' })).toBe('#ef4444');
      expect(SentimentService.getEmotionColor(null)).toBe('#f59e0b');
    });
  });

  describe('formatAnalysisDisplay', () => {
    it('should return pending state for null input', () => {
      const result = SentimentService.formatAnalysisDisplay(null);
      expect(result.label).toBe('待分析');
      expect(result.emoji).toBe('🤔');
      expect(result.color).toBe('#64748b');
    });

    it('should format display correctly', () => {
      const analysis = {
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        dominant: 'positive'
      };
      const result = SentimentService.formatAnalysisDisplay(analysis);
      expect(result.label).toBe('积极');
      expect(result.color).toBe('#22c55e');
      expect(result.positive).toBe(60);
      expect(result.neutral).toBe(30);
      expect(result.negative).toBe(10);
    });
  });
});
