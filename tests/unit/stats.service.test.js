describe('StatsService', () => {
  describe('countWords', () => {
    test('should return 0 for empty text', () => {
      expect(StatsService.countWords('')).toBe(0);
      expect(StatsService.countWords(null)).toBe(0);
      expect(StatsService.countWords(undefined)).toBe(0);
    });

    test('should count Chinese characters', () => {
      expect(StatsService.countWords('你好世界')).toBe(4);
    });

    test('should count English words', () => {
      expect(StatsService.countWords('hello world')).toBe(2);
    });

    test('should count numbers', () => {
      expect(StatsService.countWords('123 456')).toBe(2);
    });

    test('should count mixed content correctly', () => {
      expect(StatsService.countWords('你好hello世界123')).toBe(6);
    });
  });

  describe('formatDate', () => {
    test('should format date as YYYY-MM-DD', () => {
      const date = new Date(2024, 0, 15);
      expect(StatsService.formatDate(date)).toBe('2024-01-15');
    });

    test('should pad single digits', () => {
      const date = new Date(2024, 2, 5);
      expect(StatsService.formatDate(date)).toBe('2024-03-05');
    });
  });

  describe('isSameDay', () => {
    test('should return true for same day', () => {
      const date1 = new Date(2024, 0, 15, 10, 30);
      const date2 = new Date(2024, 0, 15, 14, 45);
      expect(StatsService.isSameDay(date1, date2)).toBe(true);
    });

    test('should return false for different days', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 16);
      expect(StatsService.isSameDay(date1, date2)).toBe(false);
    });
  });

  describe('isSameWeek', () => {
    test('should return true for same week (Monday to Sunday)', () => {
      const monday = new Date(2024, 0, 1);
      const wednesday = new Date(2024, 0, 3);
      expect(StatsService.isSameWeek(monday, wednesday)).toBe(true);
    });

    test('should return false for different weeks', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 8);
      expect(StatsService.isSameWeek(date1, date2)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    test('should return true for same month', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 0, 20);
      expect(StatsService.isSameMonth(date1, date2)).toBe(true);
    });

    test('should return false for different months', () => {
      const date1 = new Date(2024, 0, 15);
      const date2 = new Date(2024, 1, 15);
      expect(StatsService.isSameMonth(date1, date2)).toBe(false);
    });
  });

  describe('isSameYear', () => {
    test('should return true for same year', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 11, 31);
      expect(StatsService.isSameYear(date1, date2)).toBe(true);
    });

    test('should return false for different years', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2025, 0, 1);
      expect(StatsService.isSameYear(date1, date2)).toBe(false);
    });
  });

  describe('getDateRange', () => {
    test('should return day range', () => {
      const range = StatsService.getDateRange('day');
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
      expect(range.start.getHours()).toBe(0);
    });

    test('should return week range', () => {
      const range = StatsService.getDateRange('week');
      expect(range).toHaveProperty('start');
      expect(range).toHaveProperty('end');
    });

    test('should return month range', () => {
      const range = StatsService.getDateRange('month');
      expect(range.start.getDate()).toBe(1);
    });

    test('should return year range', () => {
      const range = StatsService.getDateRange('year');
      expect(range.start.getMonth()).toBe(0);
      expect(range.start.getDate()).toBe(1);
    });

    test('should return null for invalid period', () => {
      expect(StatsService.getDateRange('invalid')).toBeNull();
    });
  });

  describe('filterDiariesByPeriod', () => {
    const today = new Date();
    const diaries = [
      { id: '1', createdAt: today.toISOString(), content: '今天' },
      { id: '2', createdAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(), content: '一周前' },
    ];

    test('should filter diaries by week', () => {
      const result = StatsService.filterDiariesByPeriod(diaries, 'week');
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    test('should return all diaries for invalid period', () => {
      const result = StatsService.filterDiariesByPeriod(diaries, 'invalid');
      expect(result.length).toBe(2);
    });
  });

  describe('calculateStats', () => {
    test('should return zero stats for empty diaries', () => {
      const stats = StatsService.calculateStats([]);
      expect(stats.totalDiaries).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.avgWords).toBe(0);
      expect(stats.streak).toBe(0);
    });

    test('should calculate stats for diaries without sentiment', () => {
      const diaries = [
        { id: '1', content: '你好世界', createdAt: new Date().toISOString(), sentiment: null },
        { id: '2', content: '今天很开心', createdAt: new Date().toISOString(), sentiment: null }
      ];
      const stats = StatsService.calculateStats(diaries);
      expect(stats.totalDiaries).toBe(2);
      expect(stats.totalWords).toBeGreaterThan(0);
    });

    test('should calculate emotion stats from sentiment', () => {
      const diaries = [
        { id: '1', content: '开心快乐', createdAt: new Date().toISOString(), sentiment: { dominant: 'positive' } },
        { id: '2', content: '难过伤心', createdAt: new Date().toISOString(), sentiment: { dominant: 'negative' } }
      ];
      const stats = StatsService.calculateStats(diaries);
      expect(stats.emotionStats.positive).toBe(1);
      expect(stats.emotionStats.negative).toBe(1);
    });

    test('should calculate average words', () => {
      const diaries = [
        { id: '1', content: '一二三四', createdAt: new Date().toISOString() },
        { id: '2', content: '五六', createdAt: new Date().toISOString() }
      ];
      const stats = StatsService.calculateStats(diaries);
      expect(stats.avgWords).toBe(3);
    });
  });

  describe('calculateStreak', () => {
    test('should return 0 for empty diaries', () => {
      expect(StatsService.calculateStreak([])).toBe(0);
    });

    test('should return 1 for diary written today', () => {
      const diaries = [
        { createdAt: new Date().toISOString() }
      ];
      expect(StatsService.calculateStreak(diaries)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateAllConsecutiveStreaks', () => {
    test('should return empty array for no diaries', () => {
      expect(StatsService.calculateAllConsecutiveStreaks([])).toEqual([]);
    });

    test('should detect consecutive days', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const diaries = [
        { id: '1', createdAt: today.toISOString() },
        { id: '2', createdAt: yesterday.toISOString() }
      ];
      const streaks = StatsService.calculateAllConsecutiveStreaks(diaries);
      expect(streaks.length).toBe(1);
      expect(streaks[0].days).toBe(2);
    });
  });

  describe('getLongestStreak', () => {
    test('should return null for empty diaries', () => {
      expect(StatsService.getLongestStreak([])).toBeNull();
    });

    test('should return the longest streak', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const d1 = new Date(today);
      const d2 = new Date(today); d2.setDate(d2.getDate() - 1);
      const d3 = new Date(today); d3.setDate(d3.getDate() - 2);

      const diaries = [
        { id: '1', createdAt: d1.toISOString() },
        { id: '2', createdAt: d2.toISOString() },
        { id: '3', createdAt: d3.toISOString() }
      ];
      const longest = StatsService.getLongestStreak(diaries);
      expect(longest.days).toBe(3);
    });
  });

  describe('getEmotionChartData', () => {
    test('should return zero data for no emotions', () => {
      const stats = { emotionStats: { positive: 0, neutral: 0, negative: 0 } };
      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.data).toEqual([0, 0, 0]);
      expect(chartData.labels).toEqual(['积极', '中性', '消极']);
    });

    test('should calculate percentages correctly', () => {
      const stats = { emotionStats: { positive: 5, neutral: 3, negative: 2 } };
      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.data[0]).toBe(50);
      expect(chartData.data[1]).toBe(30);
      expect(chartData.data[2]).toBe(20);
    });
  });

  describe('generateChartHTML', () => {
    test('should return no data message for empty data', () => {
      const html = StatsService.generateChartHTML({ labels: [], data: [] });
      expect(html).toContain('暂无数据');
    });

    test('should generate chart HTML', () => {
      const chartData = { labels: ['一', '二'], data: [10, 20] };
      const html = StatsService.generateChartHTML(chartData);
      expect(html).toContain('chart-bars');
      expect(html).toContain('chart-bar-item');
    });
  });

  describe('generatePieChartHTML', () => {
    test('should return no data message for all zeros', () => {
      const chartData = { labels: ['积极', '中性', '消极'], data: [0, 0, 0], colors: ['#22c55e', '#f59e0b', '#ef4444'] };
      const html = StatsService.generatePieChartHTML(chartData);
      expect(html).toContain('暂无数据');
    });

    test('should generate pie chart legend', () => {
      const chartData = { labels: ['积极', '中性', '消极'], data: [50, 30, 20], colors: ['#22c55e', '#f59e0b', '#ef4444'] };
      const html = StatsService.generatePieChartHTML(chartData);
      expect(html).toContain('emotion-pie-chart');
      expect(html).toContain('emotion-legend-item');
    });
  });
});
