const path = require('path');

describe('DiaryService', () => {
  beforeAll(() => {
    mockDependentServices();
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'storage.service.js'));
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'stats.service.js'));
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'sentiment.service.js'));
    loadScript(path.join(__dirname, '..', '..', 'js', 'services', 'diary.service.js'));
  });

  beforeEach(() => {
    DiaryService.clearCache();
    jest.clearAllMocks();
  });

  describe('基础操作', () => {
    test('getDiaries 初始应该返回空数组', () => {
      const diaries = DiaryService.getDiaries();
      expect(diaries).toEqual([]);
    });

    test('setDiaries 应该设置日记列表', () => {
      const testDiaries = [
        { id: '1', title: '测试1', content: '内容1' },
        { id: '2', title: '测试2', content: '内容2' }
      ];
      DiaryService.setDiaries(testDiaries);
      expect(DiaryService.getDiaries().length).toBe(2);
    });

    test('setDiaries 非数组应该设置为空数组', () => {
      DiaryService.setDiaries(null);
      expect(DiaryService.getDiaries()).toEqual([]);
      DiaryService.setDiaries('invalid');
      expect(DiaryService.getDiaries()).toEqual([]);
    });

    test('clearCache 应该清空日记和当前日记', () => {
      DiaryService.setDiaries([{ id: '1', title: '测试' }]);
      DiaryService.setCurrentDiary({ id: '1', title: '测试' });
      DiaryService.clearCache();
      expect(DiaryService.getDiaries()).toEqual([]);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });

  describe('createDiary', () => {
    test('应该创建新日记', async () => {
      const diary = await DiaryService.createDiary({
        title: '新日记标题',
        content: '日记内容'
      });

      expect(diary).toBeDefined();
      expect(diary.id).toBeDefined();
      expect(diary.title).toBe('新日记标题');
      expect(diary.content).toBe('日记内容');
      expect(diary.isDraft).toBe(true);
      expect(diary.createdAt).toBeDefined();
      expect(diary.updatedAt).toBeDefined();
      expect(diary.weather).toBeDefined();
      expect(DiaryService.getDiaries().length).toBe(1);
      expect(DiaryService.getCurrentDiary()).toEqual(diary);
    });

    test('应该使用默认值创建日记', async () => {
      const diary = await DiaryService.createDiary();
      expect(diary.title).toBe('');
      expect(diary.content).toBe('');
      expect(diary.editorMode).toBe('rich');
      expect(diary.emotionTags).toEqual([]);
    });

    test('创建的日记应该添加到列表开头', async () => {
      const diary1 = await DiaryService.createDiary({ title: '第一篇' });
      const diary2 = await DiaryService.createDiary({ title: '第二篇' });
      
      const diaries = DiaryService.getDiaries();
      expect(diaries[0].title).toBe('第二篇');
      expect(diaries[1].title).toBe('第一篇');
    });
  });

  describe('getDiaryById', () => {
    test('应该通过 ID 找到日记', async () => {
      const diary = await DiaryService.createDiary({ title: '查找测试' });
      const found = DiaryService.getDiaryById(diary.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(diary.id);
      expect(found.title).toBe('查找测试');
    });

    test('找不到的 ID 应该返回 null', () => {
      const found = DiaryService.getDiaryById('nonexistent-id');
      expect(found).toBeNull();
    });
  });

  describe('updateDiary', () => {
    test('应该更新已存在的日记', async () => {
      const diary = await DiaryService.createDiary({ title: '原始标题', content: '原始内容' });
      
      const updated = await DiaryService.updateDiary(diary.id, {
        title: '更新后的标题',
        content: '今天很开心，完成了很多工作，感觉非常美好和快乐。'
      });

      expect(updated).toBeDefined();
      expect(updated.title).toBe('更新后的标题');
      expect(updated.isDraft).toBe(false);
      expect(updated.wordCount).toBeGreaterThan(0);
      expect(updated.sentiment).toBeDefined();
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(diary.createdAt).getTime());
    });

    test('更新不存在的日记应该返回 null', async () => {
      const result = await DiaryService.updateDiary('nonexistent-id', { title: '测试' });
      expect(result).toBeNull();
    });

    test('更新当前日记应该同步 currentDiary', async () => {
      const diary = await DiaryService.createDiary({ title: '原始' });
      await DiaryService.updateDiary(diary.id, { title: '更新', content: '更新后的内容很开心' });
      expect(DiaryService.getCurrentDiary().title).toBe('更新');
    });
  });

  describe('deleteDiary', () => {
    test('应该删除已存在的日记', async () => {
      const diary = await DiaryService.createDiary({ title: '要删除的日记' });
      const id = diary.id;
      
      expect(DiaryService.getDiaries().length).toBe(1);
      
      const result = await DiaryService.deleteDiary(id);
      expect(result).toBe(true);
      expect(DiaryService.getDiaries().length).toBe(0);
      expect(DiaryService.getDiaryById(id)).toBeNull();
    });

    test('删除不存在的日记应该返回 false', async () => {
      const result = await DiaryService.deleteDiary('nonexistent-id');
      expect(result).toBe(false);
    });

    test('删除当前日记应该清空 currentDiary', async () => {
      const diary = await DiaryService.createDiary({ title: '测试' });
      expect(DiaryService.getCurrentDiary()).not.toBeNull();
      
      await DiaryService.deleteDiary(diary.id);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });

  describe('searchDiaries', () => {
    beforeEach(async () => {
      await DiaryService.createDiary({ title: '工作记录', content: '今天完成了项目开发，很开心' });
      await DiaryService.createDiary({ title: '生活随笔', content: '天气很好，和朋友聚会' });
      await DiaryService.createDiary({ title: '学习笔记', content: '学习了JavaScript，感觉收获很大' });
    });

    test('空查询应该返回所有日记', () => {
      expect(DiaryService.searchDiaries('').length).toBe(3);
      expect(DiaryService.searchDiaries(null).length).toBe(3);
    });

    test('应该按标题搜索', () => {
      const results = DiaryService.searchDiaries('工作');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('工作记录');
    });

    test('应该按内容搜索', () => {
      const results = DiaryService.searchDiaries('朋友');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('生活随笔');
    });

    test('应该不区分大小写', () => {
      const results = DiaryService.searchDiaries('JAVASCRIPT');
      expect(results.length).toBe(1);
    });

    test('无匹配结果应该返回空数组', () => {
      const results = DiaryService.searchDiaries('不存在的内容xyz');
      expect(results.length).toBe(0);
    });
  });

  describe('sortDiaries', () => {
    test('应该按日期倒序排序', async () => {
      const d1 = await DiaryService.createDiary({ title: '第一天' });
      const d2 = await DiaryService.createDiary({ title: '第二天' });
      
      const sorted = DiaryService.sortDiaries(DiaryService.getDiaries(), 'date', 'desc');
      expect(sorted[0].title).toBe('第二天');
    });

    test('应该按标题排序', () => {
      const diaries = [
        { id: '1', title: 'C标题', createdAt: new Date().toISOString() },
        { id: '2', title: 'A标题', createdAt: new Date().toISOString() },
        { id: '3', title: 'B标题', createdAt: new Date().toISOString() }
      ];
      
      const sorted = DiaryService.sortDiaries(diaries, 'title', 'asc');
      expect(sorted[0].title).toBe('A标题');
      expect(sorted[1].title).toBe('B标题');
      expect(sorted[2].title).toBe('C标题');
    });
  });

  describe('getDrafts', () => {
    test('应该只返回草稿', async () => {
      const draft1 = await DiaryService.createDiary({ title: '草稿1' });
      const draft2 = await DiaryService.createDiary({ title: '草稿2' });
      const published = await DiaryService.createDiary({ title: '已发布', content: '发布内容很开心' });
      await DiaryService.updateDiary(published.id, { content: '更新发布内容，今天很顺利' });
      
      const drafts = DiaryService.getDrafts();
      expect(drafts.length).toBe(2);
      drafts.forEach(d => expect(d.isDraft).toBe(true));
    });
  });

  describe('getRecentDiaries', () => {
    test('应该返回指定数量的最近日记', async () => {
      for (let i = 0; i < 15; i++) {
        await DiaryService.createDiary({ title: `日记${i}` });
      }
      
      const recent = DiaryService.getRecentDiaries(5);
      expect(recent.length).toBe(5);
    });

    test('默认应该返回 10 篇', async () => {
      for (let i = 0; i < 15; i++) {
        await DiaryService.createDiary({ title: `日记${i}` });
      }
      
      const recent = DiaryService.getRecentDiaries();
      expect(recent.length).toBe(10);
    });
  });

  describe('getStats', () => {
    test('应该返回统计数据', async () => {
      await DiaryService.createDiary({ title: '测试', content: '今天天气真好，心情愉快开心' });
      
      const stats = DiaryService.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalDiaries).toBe(1);
      expect(stats.totalWords).toBeGreaterThan(0);
    });
  });

  describe('generateId', () => {
    test('应该生成唯一ID', () => {
      const id1 = DiaryService.generateId();
      const id2 = DiaryService.generateId();
      expect(id1).not.toBe(id2);
      expect(id1.startsWith('diary_')).toBe(true);
    });
  });
});
