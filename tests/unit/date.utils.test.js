const path = require('path');

describe('DateUtils', () => {
  beforeAll(() => {
    loadScript(path.join(__dirname, '..', '..', 'js', 'utils', 'date.utils.js'));
  });

  describe('format', () => {
    test('应该正确格式化日期为 YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date(2024, 0, 15, 10, 30, 45);
      expect(DateUtils.format(date, 'YYYY-MM-DD HH:mm:ss')).toBe('2024-01-15 10:30:45');
    });

    test('应该正确格式化日期为 YYYY-MM-DD', () => {
      const date = new Date(2024, 5, 20);
      expect(DateUtils.format(date, 'YYYY-MM-DD')).toBe('2024-06-20');
    });

    test('应该正确格式化日期为 HH:mm', () => {
      const date = new Date(2024, 0, 1, 14, 5);
      expect(DateUtils.format(date, 'HH:mm')).toBe('14:05');
    });

    test('应该补全单位数字的月份和日期', () => {
      const date = new Date(2024, 0, 5, 9, 3, 2);
      expect(DateUtils.format(date)).toBe('2024-01-05 09:03:02');
    });
  });

  describe('日期判断函数', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 5, 20, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('isToday 应该正确判断今天的日期', () => {
      const today = new Date(2024, 5, 20, 10, 0, 0);
      const yesterday = new Date(2024, 5, 19, 10, 0, 0);
      expect(DateUtils.isToday(today)).toBe(true);
      expect(DateUtils.isToday(yesterday)).toBe(false);
    });

    test('isThisMonth 应该正确判断本月的日期', () => {
      const thisMonth = new Date(2024, 5, 10);
      const lastMonth = new Date(2024, 4, 10);
      expect(DateUtils.isThisMonth(thisMonth)).toBe(true);
      expect(DateUtils.isThisMonth(lastMonth)).toBe(false);
    });

    test('isThisYear 应该正确判断本年的日期', () => {
      const thisYear = new Date(2024, 0, 1);
      const lastYear = new Date(2023, 0, 1);
      expect(DateUtils.isThisYear(thisYear)).toBe(true);
      expect(DateUtils.isThisYear(lastYear)).toBe(false);
    });
  });

  describe('getDayOfWeek', () => {
    test('应该返回正确的星期几', () => {
      const sunday = new Date(2024, 5, 16);
      const monday = new Date(2024, 5, 17);
      expect(DateUtils.getDayOfWeek(sunday)).toBe('周日');
      expect(DateUtils.getDayOfWeek(monday)).toBe('周一');
    });
  });

  describe('getDaysInMonth', () => {
    test('应该返回正确的月份天数', () => {
      expect(DateUtils.getDaysInMonth(2024, 0)).toBe(31);
      expect(DateUtils.getDaysInMonth(2024, 1)).toBe(29);
      expect(DateUtils.getDaysInMonth(2023, 1)).toBe(28);
      expect(DateUtils.getDaysInMonth(2024, 3)).toBe(30);
    });
  });

  describe('日期加减函数', () => {
    test('addDays 应该正确添加天数', () => {
      const date = new Date(2024, 0, 1);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    test('addHours 应该正确添加小时', () => {
      const date = new Date(2024, 0, 1, 10, 0, 0);
      const result = DateUtils.addHours(date, 3);
      expect(result.getHours()).toBe(13);
    });

    test('addMinutes 应该正确添加分钟', () => {
      const date = new Date(2024, 0, 1, 10, 0, 0);
      const result = DateUtils.addMinutes(date, 30);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('日期差值函数', () => {
    test('diffDays 应该计算正确的天数差', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 6);
      expect(DateUtils.diffDays(date1, date2)).toBe(5);
    });

    test('diffHours 应该计算正确的小时差', () => {
      const date1 = new Date(2024, 0, 1, 10, 0, 0);
      const date2 = new Date(2024, 0, 1, 13, 0, 0);
      expect(DateUtils.diffHours(date1, date2)).toBe(3);
    });
  });

  describe('getDateDisplay', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 5, 20, 12, 0, 0));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('今天应该显示"今天"', () => {
      const today = new Date(2024, 5, 20, 10, 0, 0);
      expect(DateUtils.getDateDisplay(today)).toBe('今天');
    });

    test('昨天应该显示"昨天"', () => {
      const yesterday = new Date(2024, 5, 19, 10, 0, 0);
      expect(DateUtils.getDateDisplay(yesterday)).toBe('昨天');
    });
  });

  describe('getTimeDisplay', () => {
    test('应该正确格式化时间显示', () => {
      const date = new Date(2024, 0, 1, 14, 30, 0);
      expect(DateUtils.getTimeDisplay(date)).toBe('14:30');
    });
  });
});
