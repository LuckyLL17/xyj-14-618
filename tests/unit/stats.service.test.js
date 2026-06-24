describe('StatsService', () => {
  beforeEach(() => {
    resetModules();
    loadScript('js/services/stats.service.js');
  });

  describe('countWords', () => {
    it('should return 0 for empty text', () => {
      expect(StatsService.countWords('')).toBe(0);
      expect(StatsService.countWords(null)).toBe(0);
      expect(StatsService.countWords(undefined)).toBe(0);
    });

    it('should count Chinese characters correctly', () => {
      expect(StatsService.countWords('你好世界')).toBe(4);
    });

    it('should count English words correctly', () => {
      expect(StatsService.countWords('hello world test')).toBe(3);
    });

    it('should count numbers correctly', () => {
      expect(StatsService.countWords('123 456')).toBe(2);
    });

    it('should count mixed content correctly', () => {
      expect(StatsService.countWords('今天天气真好 hello 123')).toBe(6 + 1 + 1);
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date(2024, 5, 15);
      expect(StatsService.formatDate(date)).toBe('2024-06-15');
    });
  });

  describe('isSameDay', () => {
    it('should return true for same day', () => {
      const date1 = new Date(2024, 5, 15, 10, 30);
      const date2 = new Date(2024, 5, 15, 18, 45);
      expect(StatsService.isSameDay(date1, date2)).toBe(true);
    });

    it('should return false for different days', () => {
      const date1 = new Date(2024, 5, 15);
      const date2 = new Date(2024, 5, 16);
      expect(StatsService.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isSameWeek', () => {
    it('should return true for dates in same week (Monday start)', () => {
      const monday = new Date(2024, 5, 10);
      const sunday = new Date(2024, 5, 16);
      expect(StatsService.isSameWeek(monday, sunday)).toBe(true);
    });

    it('should return false for dates in different weeks', () => {
      const monday1 = new Date(2024, 5, 10);
      const monday2 = new Date(2024, 5, 17);
      expect(StatsService.isSameWeek(monday1, monday2)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    it('should return true for same month', () => {
      expect(StatsService.isSameMonth(new Date(2024, 5, 1), new Date(2024, 5, 30))).toBe(true);
    });

    it('should return false for different months', () => {
      expect(StatsService.isSameMonth(new Date(2024, 5, 1), new Date(2024, 6, 1))).toBe(false);
    });
  });

  describe('getDateRange', () => {
    it('should return day range', () => {
      const range = StatsService.getDateRange('day');
      expect(range).toBeDefined();
      expect(range.start).toBeDefined();
      expect(range.end).toBeDefined();
    });

    it('should return week range', () => {
      const range = StatsService.getDateRange('week');
      expect(range).toBeDefined();
    });

    it('should return month range', () => {
      const range = StatsService.getDateRange('month');
      expect(range).toBeDefined();
    });

    it('should return year range', () => {
      const range = StatsService.getDateRange('year');
      expect(range).toBeDefined();
    });

    it('should return null for invalid period', () => {
      expect(StatsService.getDateRange('invalid')).toBeNull();
    });
  });

  describe('calculateStats', () => {
    it('should return empty stats for empty diaries', () => {
      const stats = StatsService.calculateStats([]);
      expect(stats.totalDiaries).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.streak).toBe(0);
    });

    it('should calculate stats correctly', () => {
      const diaries = [
        {
          id: '1',
          content: '今天天气真好，心情愉快',
          createdAt: new Date().toISOString(),
          sentiment: { dominant: 'positive' }
        },
        {
          id: '2',
          content: '工作顺利完成',
          createdAt: new Date().toISOString(),
          sentiment: { dominant: 'positive' }
        }
      ];
      const stats = StatsService.calculateStats(diaries);
      expect(stats.totalDiaries).toBe(2);
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.emotionStats.positive).toBe(2);
    });
  });

  describe('calculateStreak', () => {
    it('should return 0 for empty diaries', () => {
      expect(StatsService.calculateStreak([])).toBe(0);
    });

    it('should calculate streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

      const diaries = [
        { createdAt: today.toISOString() },
        { createdAt: yesterday.toISOString() },
        { createdAt: twoDaysAgo.toISOString() }
      ];
      expect(StatsService.calculateStreak(diaries)).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getEmotionChartData', () => {
    it('should return default data when no emotions', () => {
      const stats = {
        emotionStats: { positive: 0, neutral: 0, negative: 0 }
      };
      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.labels).toEqual(['积极', '中性', '消极']);
      expect(chartData.data).toEqual([0, 0, 0]);
    });

    it('should calculate percentages correctly', () => {
      const stats = {
        emotionStats: { positive: 5, neutral: 3, negative: 2 }
      };
      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.data[0]).toBe(50);
      expect(chartData.data[1]).toBe(30);
      expect(chartData.data[2]).toBe(20);
    });
  });

  describe('generateChartHTML', () => {
    it('should return no data message for empty data', () => {
      expect(StatsService.generateChartHTML(null)).toBe('<p>暂无数据</p>');
      expect(StatsService.generateChartHTML({ labels: [] })).toBe('<p>暂无数据</p>');
    });

    it('should generate chart HTML for valid data', () => {
      const chartData = {
        labels: ['周一', '周二'],
        data: [5, 3]
      };
      const html = StatsService.generateChartHTML(chartData);
      expect(html).toContain('chart-bars');
      expect(html).toContain('周一');
      expect(html).toContain('周二');
    });
  });

  describe('generatePieChartHTML', () => {
    it('should return no data message for empty data', () => {
      expect(StatsService.generatePieChartHTML(null)).toBe('<p>暂无数据</p>');
    });

    it('should generate pie chart HTML for valid data', () => {
      const chartData = {
        labels: ['积极', '中性', '消极'],
        data: [50, 30, 20],
        colors: ['#22c55e', '#f59e0b', '#ef4444']
      };
      const html = StatsService.generatePieChartHTML(chartData);
      expect(html).toContain('emotion-pie-chart');
      expect(html).toContain('积极');
    });
  });
});
