/**
 * DiaryService 单元测试
 * DiaryService 依赖 WeatherService / AuthService / StatsService / SentimentService
 * 所以这里在 sandbox 中先注入对应的 stub。
 */
const { loadScript, createSandbox } = require('../setup/load-script');

function createStubs() {
    const storage = { byUser: {} };

    const WeatherService = {
        getCurrentWeather: jest.fn(async () => ({ text: '晴', temperature: 25 }))
    };

    const SentimentService = {
        analyze: jest.fn(async (text) => ({
            positive: 0.6, neutral: 0.3, negative: 0.1, dominant: 'positive', confidence: 0.6
        }))
    };

    const StatsService = {
        countWords: (text) => (text ? String(text).length : 0),
        calculateStats: jest.fn(() => ({ totalDiaries: 0 }))
    };

    const AuthService = {
        currentUser: { username: 'tester' },
        getCurrentUser() { return this.currentUser; },
        async saveUserDiaries(username, diaries) {
            storage.byUser[username] = diaries;
            return true;
        },
        async loadUserDiaries(username) {
            return storage.byUser[username] || [];
        }
    };

    return { WeatherService, SentimentService, StatsService, AuthService, storage };
}

function buildDiaryService() {
    const stubs = createStubs();
    const sandbox = createSandbox(stubs);
    loadScript('js/services/diary.service.js', sandbox);
    return { DiaryService: sandbox.DiaryService, stubs };
}

describe('DiaryService.generateId', () => {
    test('生成的 ID 以 diary_ 开头并唯一', () => {
        const { DiaryService } = buildDiaryService();
        const a = DiaryService.generateId();
        const b = DiaryService.generateId();
        expect(a.startsWith('diary_')).toBe(true);
        expect(a).not.toBe(b);
    });
});

describe('DiaryService 创建 / 读取 / 更新 / 删除', () => {
    test('createDiary 写入并返回完整结构', async () => {
        const { DiaryService, stubs } = buildDiaryService();
        const d = await DiaryService.createDiary({ title: 'Hello', content: '内容' });
        expect(d.title).toBe('Hello');
        expect(d.content).toBe('内容');
        expect(d.weather).toEqual({ text: '晴', temperature: 25 });
        expect(d.isDraft).toBe(true);
        expect(stubs.WeatherService.getCurrentWeather).toHaveBeenCalled();

        const all = DiaryService.getDiaries();
        expect(all).toHaveLength(1);
        expect(all[0].id).toBe(d.id);
    });

    test('updateDiary 更新内容并触发情感分析', async () => {
        const { DiaryService, stubs } = buildDiaryService();
        const d = await DiaryService.createDiary({ title: 't', content: 'a' });
        const updated = await DiaryService.updateDiary(d.id, { content: 'new content' });
        expect(updated.content).toBe('new content');
        expect(updated.isDraft).toBe(false);
        expect(updated.sentiment).not.toBeNull();
        expect(stubs.SentimentService.analyze).toHaveBeenCalledWith('new content');
        expect(updated.wordCount).toBe('new content'.length);
    });

    test('updateDiary 不存在的 id 返回 null', async () => {
        const { DiaryService } = buildDiaryService();
        expect(await DiaryService.updateDiary('not-exists', { content: 'x' })).toBeNull();
    });

    test('deleteDiary 移除目标项', async () => {
        const { DiaryService } = buildDiaryService();
        const d1 = await DiaryService.createDiary({ title: '1' });
        const d2 = await DiaryService.createDiary({ title: '2' });
        const ok = await DiaryService.deleteDiary(d1.id);
        expect(ok).toBe(true);
        expect(DiaryService.getDiaries()).toHaveLength(1);
        expect(DiaryService.getDiaries()[0].id).toBe(d2.id);
    });

    test('deleteDiary 不存在 id 返回 false', async () => {
        const { DiaryService } = buildDiaryService();
        expect(await DiaryService.deleteDiary('none')).toBe(false);
    });

    test('getDiaryById 命中与未命中', async () => {
        const { DiaryService } = buildDiaryService();
        const d = await DiaryService.createDiary({ title: 'x' });
        expect(DiaryService.getDiaryById(d.id)).not.toBeNull();
        expect(DiaryService.getDiaryById('nope')).toBeNull();
    });
});

describe('DiaryService 搜索与排序', () => {
    test('searchDiaries 按 title/content 模糊匹配', async () => {
        const { DiaryService } = buildDiaryService();
        await DiaryService.createDiary({ title: 'Apple Pie', content: 'tasty' });
        await DiaryService.createDiary({ title: 'Banana', content: 'yellow apple' });
        await DiaryService.createDiary({ title: 'Cherry', content: 'red' });

        const result = DiaryService.searchDiaries('apple');
        expect(result).toHaveLength(2);
    });

    test('searchDiaries 空查询返回全部副本', async () => {
        const { DiaryService } = buildDiaryService();
        await DiaryService.createDiary({ title: 'a' });
        const r = DiaryService.searchDiaries('');
        expect(r).toHaveLength(1);
    });

    test('sortDiaries 按 title asc/desc', () => {
        const { DiaryService } = buildDiaryService();
        const data = [
            { title: 'b', wordCount: 1, createdAt: '2024-01-02' },
            { title: 'a', wordCount: 3, createdAt: '2024-01-01' },
            { title: 'c', wordCount: 2, createdAt: '2024-01-03' }
        ];
        const asc = DiaryService.sortDiaries(data, 'title', 'asc');
        expect(asc.map(d => d.title)).toEqual(['a', 'b', 'c']);
        const desc = DiaryService.sortDiaries(data, 'title', 'desc');
        expect(desc.map(d => d.title)).toEqual(['c', 'b', 'a']);
    });

    test('sortDiaries 按 words 与 date', () => {
        const { DiaryService } = buildDiaryService();
        const data = [
            { title: 'b', wordCount: 1, createdAt: '2024-01-02' },
            { title: 'a', wordCount: 3, createdAt: '2024-01-01' }
        ];
        const byWords = DiaryService.sortDiaries(data, 'words', 'desc');
        expect(byWords[0].wordCount).toBe(3);
        const byDate = DiaryService.sortDiaries(data, 'date', 'asc');
        expect(byDate[0].createdAt).toBe('2024-01-01');
    });
});

describe('DiaryService 缓存与持久化', () => {
    test('clearCache 清空内存数据', async () => {
        const { DiaryService } = buildDiaryService();
        await DiaryService.createDiary({ title: 'x' });
        DiaryService.clearCache();
        expect(DiaryService.getDiaries()).toHaveLength(0);
        expect(DiaryService.getCurrentDiary()).toBeNull();
    });

    test('createDiary 后会调用 AuthService.saveUserDiaries', async () => {
        const { DiaryService, stubs } = buildDiaryService();
        await DiaryService.createDiary({ title: 'x' });
        expect(stubs.storage.byUser.tester).toBeDefined();
        expect(stubs.storage.byUser.tester.length).toBe(1);
    });

    test('getDrafts 仅返回 isDraft=true', async () => {
        const { DiaryService } = buildDiaryService();
        const d1 = await DiaryService.createDiary({ title: 'a' });
        await DiaryService.createDiary({ title: 'b' });
        await DiaryService.updateDiary(d1.id, { content: 'no longer draft' });
        const drafts = DiaryService.getDrafts();
        expect(drafts.every(d => d.isDraft === true)).toBe(true);
        expect(drafts.length).toBe(1);
    });

    test('getRecentDiaries 按时间倒序裁剪', async () => {
        const { DiaryService } = buildDiaryService();
        await DiaryService.createDiary({ title: 'a' });
        await DiaryService.createDiary({ title: 'b' });
        await DiaryService.createDiary({ title: 'c' });
        const r = DiaryService.getRecentDiaries(2);
        expect(r).toHaveLength(2);
    });
});
