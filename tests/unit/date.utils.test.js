/**
 * DateUtils 单元测试
 */
const { loadScript, createSandbox } = require('../setup/load-script');

let DateUtils;

beforeAll(() => {
    const sandbox = createSandbox();
    loadScript('js/utils/date.utils.js', sandbox);
    DateUtils = sandbox.DateUtils;
});

describe('DateUtils.format', () => {
    test('默认格式 YYYY-MM-DD HH:mm:ss', () => {
        const d = new Date(2024, 5, 1, 9, 5, 7);
        expect(DateUtils.format(d)).toBe('2024-06-01 09:05:07');
    });

    test('自定义格式', () => {
        const d = new Date(2024, 0, 9);
        expect(DateUtils.format(d, 'YYYY/MM/DD')).toBe('2024/01/09');
    });
});

describe('DateUtils.getDateDisplay', () => {
    test('今天显示"今天"', () => {
        expect(DateUtils.getDateDisplay(new Date())).toBe('今天');
    });

    test('昨天显示"昨天"', () => {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        expect(DateUtils.getDateDisplay(y)).toBe('昨天');
    });

    test('一周内返回星期', () => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        const result = DateUtils.getDateDisplay(d);
        expect(['周一', '周二', '周三', '周四', '周五', '周六', '周日']).toContain(result);
    });

    test('一周以前返回 MM-DD 格式', () => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        expect(DateUtils.getDateDisplay(d)).toMatch(/^\d{2}-\d{2}$/);
    });
});

describe('DateUtils.isToday/Week/Month/Year', () => {
    test('isToday 当前为 true', () => {
        expect(DateUtils.isToday(new Date())).toBe(true);
    });
    test('isThisMonth 当前为 true', () => {
        expect(DateUtils.isThisMonth(new Date())).toBe(true);
    });
    test('isThisYear 当前为 true', () => {
        expect(DateUtils.isThisYear(new Date())).toBe(true);
    });
    test('上一年返回 false', () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 2);
        expect(DateUtils.isThisYear(d)).toBe(false);
    });
});

describe('DateUtils.addXxx / diffXxx', () => {
    test('addDays 增加 5 天', () => {
        const d = new Date(2024, 5, 1);
        expect(DateUtils.addDays(d, 5).getDate()).toBe(6);
    });

    test('addHours 跨天', () => {
        const d = new Date(2024, 5, 1, 23);
        expect(DateUtils.addHours(d, 2).getDate()).toBe(2);
    });

    test('addMinutes 60 分钟等同 +1h', () => {
        const d = new Date(2024, 5, 1, 0, 0);
        expect(DateUtils.addMinutes(d, 60).getHours()).toBe(1);
    });

    test('diffDays 计算正确', () => {
        const a = new Date(2024, 5, 1);
        const b = new Date(2024, 5, 4);
        expect(DateUtils.diffDays(a, b)).toBe(3);
    });

    test('diffHours 计算正确', () => {
        const a = new Date(2024, 5, 1, 0);
        const b = new Date(2024, 5, 1, 5);
        expect(DateUtils.diffHours(a, b)).toBe(5);
    });
});

describe('DateUtils.getDayOfWeek / getDaysInMonth', () => {
    test('getDayOfWeek 返回中文', () => {
        const sunday = new Date(2024, 5, 2);
        expect(DateUtils.getDayOfWeek(sunday)).toBe('周日');
    });

    test('getDaysInMonth 二月 28 天', () => {
        expect(DateUtils.getDaysInMonth(2023, 1)).toBe(28);
    });

    test('getDaysInMonth 一月 31 天', () => {
        expect(DateUtils.getDaysInMonth(2024, 0)).toBe(31);
    });
});
