describe('DateUtils', () => {
  beforeEach(() => {
    resetModules();
    loadScript('js/utils/date.utils.js');
  });

  describe('format', () => {
    it('should format date with default format', () => {
      const date = new Date(2024, 5, 15, 10, 30, 45);
      const result = DateUtils.format(date);
      expect(result).toBe('2024-06-15 10:30:45');
    });

    it('should format date with custom format', () => {
      const date = new Date(2024, 11, 25, 8, 5, 3);
      const result = DateUtils.format(date, 'YYYY年MM月DD日 HH:mm');
      expect(result).toBe('2024年12月25日 08:05');
    });

    it('should handle single digit values with padding', () => {
      const date = new Date(2024, 0, 1, 0, 0, 0);
      const result = DateUtils.format(date);
      expect(result).toBe('2024-01-01 00:00:00');
    });

    it('should accept ISO string input', () => {
      const result = DateUtils.format('2024-06-15T10:30:45');
      expect(result).toMatch(/^2024-06-15/);
    });
  });

  describe('getDateDisplay', () => {
    it('should return "今天" for today\'s date', () => {
      const today = new Date();
      const result = DateUtils.getDateDisplay(today);
      expect(result).toBe('今天');
    });

    it('should return "昨天" for yesterday\'s date', () => {
      const yesterday = DateUtils.addDays(new Date(), -1);
      const result = DateUtils.getDateDisplay(yesterday);
      expect(result).toBe('昨天');
    });

    it('should return day of week for dates within 7 days', () => {
      const threeDaysAgo = DateUtils.addDays(new Date(), -3);
      const result = DateUtils.getDateDisplay(threeDaysAgo);
      expect(['周日', '周一', '周二', '周三', '周四', '周五', '周六']).toContain(result);
    });
  });

  describe('isToday', () => {
    it('should return true for today', () => {
      expect(DateUtils.isToday(new Date())).toBe(true);
    });

    it('should return false for yesterday', () => {
      expect(DateUtils.isToday(DateUtils.addDays(new Date(), -1))).toBe(false);
    });
  });

  describe('isThisMonth', () => {
    it('should return true for current month', () => {
      expect(DateUtils.isThisMonth(new Date())).toBe(true);
    });
  });

  describe('isThisYear', () => {
    it('should return true for current year', () => {
      expect(DateUtils.isThisYear(new Date())).toBe(true);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return correct day name', () => {
      const date = new Date(2024, 0, 1);
      expect(['周日', '周一', '周二', '周三', '周四', '周五', '周六']).toContain(DateUtils.getDayOfWeek(date));
    });
  });

  describe('getDaysInMonth', () => {
    it('should return 31 for January', () => {
      expect(DateUtils.getDaysInMonth(2024, 0)).toBe(31);
    });

    it('should return 29 for February 2024 (leap year)', () => {
      expect(DateUtils.getDaysInMonth(2024, 1)).toBe(29);
    });

    it('should return 28 for February 2023', () => {
      expect(DateUtils.getDaysInMonth(2023, 1)).toBe(28);
    });

    it('should return 30 for April', () => {
      expect(DateUtils.getDaysInMonth(2024, 3)).toBe(30);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date(2024, 0, 1);
      const result = DateUtils.addDays(date, 5);
      expect(result.getDate()).toBe(6);
    });

    it('should subtract days correctly', () => {
      const date = new Date(2024, 0, 10);
      const result = DateUtils.addDays(date, -5);
      expect(result.getDate()).toBe(5);
    });

    it('should handle month boundary', () => {
      const date = new Date(2024, 0, 31);
      const result = DateUtils.addDays(date, 1);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(1);
    });
  });

  describe('addHours', () => {
    it('should add hours correctly', () => {
      const date = new Date(2024, 0, 1, 10);
      const result = DateUtils.addHours(date, 3);
      expect(result.getHours()).toBe(13);
    });
  });

  describe('addMinutes', () => {
    it('should add minutes correctly', () => {
      const date = new Date(2024, 0, 1, 10, 30);
      const result = DateUtils.addMinutes(date, 15);
      expect(result.getMinutes()).toBe(45);
    });
  });

  describe('diffDays', () => {
    it('should calculate days difference correctly', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 6);
      expect(DateUtils.diffDays(date1, date2)).toBe(5);
    });
  });

  describe('diffHours', () => {
    it('should calculate hours difference correctly', () => {
      const date1 = new Date(2024, 0, 1, 10);
      const date2 = new Date(2024, 0, 1, 15);
      expect(DateUtils.diffHours(date1, date2)).toBe(5);
    });
  });
});
