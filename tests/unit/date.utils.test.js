describe('DateUtils', () => {
  describe('format', () => {
    test('should format date with default format', () => {
      const date = new Date(2024, 0, 15, 10, 30, 45);
      const result = DateUtils.format(date);
      expect(result).toBe('2024-01-15 10:30:45');
    });

    test('should format date with custom format YYYY-MM-DD', () => {
      const date = new Date(2024, 5, 20);
      const result = DateUtils.format(date, 'YYYY-MM-DD');
      expect(result).toBe('2024-06-20');
    });

    test('should format date with HH:mm:ss', () => {
      const date = new Date(2024, 0, 1, 8, 5, 3);
      const result = DateUtils.format(date, 'HH:mm:ss');
      expect(result).toBe('08:05:03');
    });

    test('should pad single digit months and days with zero', () => {
      const date = new Date(2024, 2, 5, 9, 7, 1);
      const result = DateUtils.format(date);
      expect(result).toContain('2024-03-05');
      expect(result).toContain('09:07:01');
    });
  });

  describe('getDateDisplay', () => {
    test('should return "今天" for today', () => {
      const now = new Date();
      const result = DateUtils.getDateDisplay(now);
      expect(result).toBe('今天');
    });

    test('should return "昨天" for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const result = DateUtils.getDateDisplay(yesterday);
      expect(result).toBe('昨天');
    });

    test('should return day of week for dates within 7 days', () => {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const result = DateUtils.getDateDisplay(threeDaysAgo);
      expect(days).toContain(result);
    });

    test('should return MM-DD format for older dates', () => {
      const oldDate = new Date(2024, 0, 1);
      const result = DateUtils.getDateDisplay(oldDate);
      expect(result).toBe('01-01');
    });
  });

  describe('getTimeDisplay', () => {
    test('should return time in HH:mm format', () => {
      const date = new Date(2024, 0, 1, 14, 30);
      const result = DateUtils.getTimeDisplay(date);
      expect(result).toBe('14:30');
    });
  });

  describe('getDateTimeDisplay', () => {
    test('should combine date display and time display', () => {
      const now = new Date();
      now.setHours(10, 30);
      const result = DateUtils.getDateTimeDisplay(now);
      expect(result).toContain('今天');
      expect(result).toContain('10:30');
    });
  });

  describe('getCurrentDateString', () => {
    test('should return current date in Chinese format', () => {
      const result = DateUtils.getCurrentDateString();
      expect(result).toMatch(/\d{4}年\d{2}月\d{2}日/);
    });
  });

  describe('getCurrentTimeString', () => {
    test('should return current time in HH:mm format', () => {
      const result = DateUtils.getCurrentTimeString();
      expect(result).toMatch(/\d{2}:\d{2}/);
    });
  });

  describe('getCurrentDateTimeString', () => {
    test('should return current date and time in Chinese format', () => {
      const result = DateUtils.getCurrentDateTimeString();
      expect(result).toMatch(/\d{4}年\d{2}月\d{2}日 \d{2}:\d{2}/);
    });
  });

  describe('isToday', () => {
    test('should return true for today', () => {
      expect(DateUtils.isToday(new Date())).toBe(true);
    });

    test('should return false for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(DateUtils.isToday(yesterday)).toBe(false);
    });
  });

  describe('isThisMonth', () => {
    test('should return true for current month', () => {
      expect(DateUtils.isThisMonth(new Date())).toBe(true);
    });

    test('should return false for last month', () => {
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      expect(DateUtils.isThisMonth(lastMonth)).toBe(false);
    });
  });

  describe('isThisYear', () => {
    test('should return true for current year', () => {
      expect(DateUtils.isThisYear(new Date())).toBe(true);
    });

    test('should return false for last year', () => {
      const lastYear = new Date();
      lastYear.setFullYear(lastYear.getFullYear() - 1);
      expect(DateUtils.isThisYear(lastYear)).toBe(false);
    });
  });

  describe('getDayOfWeek', () => {
    test('should return correct day of week in Chinese', () => {
      const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      const date = new Date(2024, 0, 1);
      const result = DateUtils.getDayOfWeek(date);
      expect(days).toContain(result);
    });

    test('should return 周一 for a Monday', () => {
      const monday = new Date(2024, 0, 1);
      expect(DateUtils.getDayOfWeek(monday)).toBe('周一');
    });
  });

  describe('getDaysInMonth', () => {
    test('should return 31 for January', () => {
      expect(DateUtils.getDaysInMonth(2024, 0)).toBe(31);
    });

    test('should return 29 for February leap year', () => {
      expect(DateUtils.getDaysInMonth(2024, 1)).toBe(29);
    });

    test('should return 28 for February non-leap year', () => {
      expect(DateUtils.getDaysInMonth(2023, 1)).toBe(28);
    });

    test('should return 30 for April', () => {
      expect(DateUtils.getDaysInMonth(2024, 3)).toBe(30);
    });
  });

  describe('addDays', () => {
    test('should add specified days to date', () => {
      const date = new Date(2024, 0, 1);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
      expect(result.getMonth()).toBe(0);
    });

    test('should handle month rollover', () => {
      const date = new Date(2024, 0, 30);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(4);
      expect(result.getMonth()).toBe(1);
    });

    test('should subtract days with negative value', () => {
      const date = new Date(2024, 0, 5);
      const result = DateUtils.addDays(date, -3);
      expect(result.getDate()).toBe(2);
    });
  });

  describe('addHours', () => {
    test('should add specified hours to date', () => {
      const date = new Date(2024, 0, 1, 10, 0);
      const result = DateUtils.addHours(date, 3);
      expect(result.getHours()).toBe(13);
    });
  });

  describe('addMinutes', () => {
    test('should add specified minutes to date', () => {
      const date = new Date(2024, 0, 1, 10, 0);
      const result = DateUtils.addMinutes(date, 30);
      expect(result.getMinutes()).toBe(30);
    });
  });

  describe('diffDays', () => {
    test('should calculate days difference between two dates', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 6);
      expect(DateUtils.diffDays(date1, date2)).toBe(5);
    });

    test('should return absolute difference', () => {
      const date1 = new Date(2024, 0, 6);
      const date2 = new Date(2024, 0, 1);
      expect(DateUtils.diffDays(date1, date2)).toBe(5);
    });
  });

  describe('diffHours', () => {
    test('should calculate hours difference between two dates', () => {
      const date1 = new Date(2024, 0, 1, 10, 0);
      const date2 = new Date(2024, 0, 1, 15, 0);
      expect(DateUtils.diffHours(date1, date2)).toBe(5);
    });
  });
});
