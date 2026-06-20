const path = require('path');

describe('StatsService', () => {
  beforeAll(() => {
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'stats.service.js'));
  });

  describe('countWords', () => {
    test('空字符串应该返回 0', () => {
      expect(StatsService.countWords('')).toBe(0);
      expect(StatsService.countWords(null)).toBe(0);
      expect(StatsService.countWords(undefined)).toBe(0);
    });

    test('应该正确统计中文字符数', () => {
      expect(StatsService.countWords('你好世界')).toBe(4);
      expect(StatsService.countWords('今天天气真好')).toBe(6);
    });

    test('应该正确统计英文单词数', () => {
      expect(StatsService.countWords('hello world')).toBe(2);
      expect(StatsService.countWords('Hello World Test')).toBe(3);
    });

    test('应该正确统计数字', () => {
      expect(StatsService.countWords('123 456')).toBe(2);
    });

    test('应该正确统计中英文混合文本', () => {
      expect(StatsService.countWords('你好hello世界world123')).toBe(7);
    });
  });

  describe('formatDate', () => {
    test('应该正确格式化日期', () => {
      const date = new Date(2024, 0, 15);
      expect(StatsService.formatDate(date)).toBe('2024-01-15');
    });

    test('应该补全单位数字', () => {
      const date = new Date(2024, 5, 5);
      expect(StatsService.formatDate(date)).toBe('2024-06-05');
    });
  });

  describe('isSameDay', () => {
    test('应该正确判断同一天', () => {
      const date1 = new Date(2024, 0, 15, 10, 30, 0);
      const date2 = new Date(2024, 0, 15, 23, 59, 59);
      const date3 = new Date(2024, 0, 16, 0, 0, 0);
      expect(StatsService.isSameDay(date1, date2)).toBe(true);
      expect(StatsService.isSameDay(date1, date3)).toBe(false);
    });
  });

  describe('isSameMonth', () => {
    test('应该正确判断同一月', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 31);
      const date3 = new Date(2024, 1, 1);
      expect(StatsService.isSameMonth(date1, date2)).toBe(true);
      expect(StatsService.isSameMonth(date1, date3)).toBe(false);
    });
  });

  describe('isSameYear', () => {
    test('应该正确判断同一年', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 11, 31);
      const date3 = new Date(2025, 0, 1);
      expect(StatsService.isSameYear(date1, date2)).toBe(true);
      expect(StatsService.isSameYear(date1, date3)).toBe(false);
    });
  });

  describe('calculateStats', () => {
    test('空日记数组应该返回零统计', () => {
      const stats = StatsService.calculateStats([]);
      expect(stats.totalDiaries).toBe(0);
      expect(stats.totalWords).toBe(0);
      expect(stats.avgWords).toBe(0);
      expect(stats.streak).toBe(0);
    });

    test('应该正确计算日记统计', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 5, 20, 12, 0, 0));

      const diaries = [
        {
          id: '1',
          content: '今天天气真好，心情愉快。',
          createdAt: new Date(2024, 5, 20, 10, 0, 0).toISOString(),
          sentiment: { dominant: 'positive' }
        },
        {
          id: '2',
          content: '完成了工作任务，感觉很充实。Happy day!',
          createdAt: new Date(2024, 5, 19, 14, 0, 0).toISOString(),
          sentiment: { dominant: 'positive' }
        }
      ];

      const stats = StatsService.calculateStats(diaries);
      expect(stats.totalDiaries).toBe(2);
      expect(stats.totalWords).toBeGreaterThan(0);
      expect(stats.emotionStats.positive).toBe(2);
      expect(stats.streak).toBe(2);

      jest.useRealTimers();
    });
  });

  describe('calculateStreak', () => {
    test('空数组应该返回 0', () => {
      expect(StatsService.calculateStreak([])).toBe(0);
    });

    test('应该正确计算连续天数', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 5, 20, 12, 0, 0));

      const diaries = [
        { createdAt: new Date(2024, 5, 20, 10, 0, 0).toISOString() },
        { createdAt: new Date(2024, 5, 19, 10, 0, 0).toISOString() },
        { createdAt: new Date(2024, 5, 18, 10, 0, 0).toISOString() }
      ];

      expect(StatsService.calculateStreak(diaries)).toBe(3);

      jest.useRealTimers();
    });

    test('中断后应该停止计数', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 5, 20, 12, 0, 0));

      const diaries = [
        { createdAt: new Date(2024, 5, 20, 10, 0, 0).toISOString() },
        { createdAt: new Date(2024, 5, 18, 10, 0, 0).toISOString() }
      ];

      expect(StatsService.calculateStreak(diaries)).toBe(1);

      jest.useRealTimers();
    });
  });

  describe('calculateAllConsecutiveStreaks', () => {
    test('空数组应该返回空数组', () => {
      expect(StatsService.calculateAllConsecutiveStreaks([])).toEqual([]);
    });

    test('应该正确计算所有连续时间段', () => {
      const diaries = [
        { id: '1', createdAt: new Date(2024, 5, 18).toISOString() },
        { id: '2', createdAt: new Date(2024, 5, 19).toISOString() },
        { id: '3', createdAt: new Date(2024, 5, 20).toISOString() },
        { id: '4', createdAt: new Date(2024, 5, 22).toISOString() },
        { id: '5', createdAt: new Date(2024, 5, 23).toISOString() }
      ];

      const streaks = StatsService.calculateAllConsecutiveStreaks(diaries);
      expect(streaks.length).toBe(2);
      expect(streaks[0].days).toBe(3);
      expect(streaks[1].days).toBe(2);
    });
  });

  describe('getLongestStreak', () => {
    test('应该返回最长的连续记录', () => {
      const diaries = [
        { id: '1', createdAt: new Date(2024, 5, 18).toISOString() },
        { id: '2', createdAt: new Date(2024, 5, 19).toISOString() },
        { id: '3', createdAt: new Date(2024, 5, 20).toISOString() },
        { id: '4', createdAt: new Date(2024, 5, 25).toISOString() }
      ];

      const longest = StatsService.getLongestStreak(diaries);
      expect(longest.days).toBe(3);
    });

    test('空数组应该返回 null', () => {
      expect(StatsService.getLongestStreak([])).toBeNull();
    });
  });

  describe('getEmotionChartData', () => {
    test('应该正确生成情绪图表数据', () => {
      const stats = {
        emotionStats: { positive: 5, neutral: 3, negative: 2 }
      };

      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.labels).toEqual(['积极', '中性', '消极']);
      expect(chartData.data.length).toBe(3);
      expect(chartData.colors).toEqual(['#22c55e', '#f59e0b', '#ef4444']);
    });

    test('全零应该返回零百分比', () => {
      const stats = {
        emotionStats: { positive: 0, neutral: 0, negative: 0 }
      };

      const chartData = StatsService.getEmotionChartData(stats);
      expect(chartData.data).toEqual([0, 0, 0]);
    });
  });

  describe('generateChartHTML', () => {
    test('空数据应该返回提示信息', () => {
      expect(StatsService.generateChartHTML(null)).toContain('暂无数据');
      expect(StatsService.generateChartHTML({ labels: [], data: [] })).toContain('暂无数据');
    });

    test('应该生成图表 HTML', () => {
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
    test('全零数据应该返回提示信息', () => {
      const chartData = {
        labels: ['积极', '中性', '消极'],
        data: [0, 0, 0],
        colors: ['#22c55e', '#f59e0b', '#ef4444']
      };
      expect(StatsService.generatePieChartHTML(chartData)).toContain('暂无数据');
    });

    test('应该生成饼图 HTML', () => {
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
