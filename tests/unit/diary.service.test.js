describe('DiaryService', () => {
  beforeEach(() => {
    DiaryService.clearCache();
    jest.spyOn(WeatherService, 'getCurrentWeather').mockResolvedValue({
      weather: '晴',
      emoji: '☀️',
      temperature: { current: 20, min: 15, max: 25 },
      humidity: 50,
      airQuality: '优'
    });
    jest.spyOn(AuthService, 'getCurrentUser').mockReturnValue(null);
    jest.spyOn(AuthService, 'saveUserDiaries').mockResolvedValue(true);
    jest.spyOn(AuthService, 'loadUserDiaries').mockResolvedValue(true);
    jest.spyOn(SentimentService, 'analyze').mockResolvedValue({
      positive: 0.5,
      neutral: 0.3,
      negative: 0.2,
      dominant: 'positive',
      confidence: 0.5,
      tokens: [],
      keywords: []
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('setDiaries and getDiaries', () => {
    test('should set and get diaries array', () => {
      const diaries = [{ id: '1', title: 'Test' }];
      DiaryService.setDiaries(diaries);
      expect(DiaryService.getDiaries()).toEqual(diaries);
    });

    test('should return a copy, not reference', () => {
      const diaries = [{ id: '1', title: 'Test' }];
      DiaryService.setDiaries(diaries);
      const result = DiaryService.getDiaries();
      result.push({ id: '2' });
      expect(DiaryService.getDiaries().length).toBe(1);
    });

    test('should handle non-array input', () => {
      DiaryService.setDiaries('not-array');
      expect(DiaryService.getDiaries()).toEqual([]);
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = DiaryService.generateId();
      const id2 = DiaryService.generateId();
      expect(id1).toMatch(/^diary_/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('setCurrentDiary and getCurrentDiary', () => {
    test('should set and get current diary', () => {
      const diary = { id: '1', title: 'Current' };
      DiaryService.setCurrentDiary(diary);
      expect(DiaryService.getCurrentDiary()).toEqual(diary);
    });
  });

  describe('getDiaryById', () => {
    test('should find diary by id', () => {
      const diaries = [
        { id: '1', title: 'First' },
        { id: '2', title: 'Second' }
      ];
      DiaryService.setDiaries(diaries);
      expect(DiaryService.getDiaryById('1')).toEqual(diaries[0]);
      expect(DiaryService.getDiaryById('2')).toEqual(diaries[1]);
    });

    test('should return null for non-existent id', () => {
      expect(DiaryService.getDiaryById('nonexistent')).toBeNull();
    });
  });

  describe('createDiary', () => {
    test('should create a new diary with default values', async () => {
      const diary = await DiaryService.createDiary();
      expect(diary).toHaveProperty('id');
      expect(diary.id).toMatch(/^diary_/);
      expect(diary.title).toBe('');
      expect(diary.content).toBe('');
      expect(diary.isDraft).toBe(true);
      expect(diary.sentiment).toBeNull();
      expect(diary).toHaveProperty('createdAt');
      expect(diary).toHaveProperty('weather');
      expect(DiaryService.getDiaries().length).toBe(1);
      expect(DiaryService.getCurrentDiary()).toBe(diary);
    });

    test('should create diary with provided options', async () => {
      const options = {
        title: 'My Title',
        content: 'My Content',
        editorMode: 'markdown',
        emotionTags: ['开心']
      };
      const diary = await DiaryService.createDiary(options);
      expect(diary.title).toBe('My Title');
      expect(diary.content).toBe('My Content');
      expect(diary.editorMode).toBe('markdown');
      expect(diary.emotionTags).toEqual(['开心']);
    });

    test('should add new diary to the beginning of array', async () => {
      const diary1 = await DiaryService.createDiary({ title: 'First' });
      const diary2 = await DiaryService.createDiary({ title: 'Second' });
      const diaries = DiaryService.getDiaries();
      expect(diaries[0].id).toBe(diary2.id);
      expect(diaries[1].id).toBe(diary1.id);
    });
  });

  describe('updateDiary', () => {
    test('should update existing diary', async () => {
      const diary = await DiaryService.createDiary({ title: 'Old', content: 'Old content' });
      const updated = await DiaryService.updateDiary(diary.id, {
        title: 'New Title',
        content: 'New content'
      });
      expect(updated).not.toBeNull();
      expect(updated.title).toBe('New Title');
      expect(updated.content).toBe('New content');
      expect(updated.isDraft).toBe(false);
      expect(updated.wordCount).toBeGreaterThan(0);
    });

    test('should return null for non-existent diary', async () => {
      const result = await DiaryService.updateDiary('nonexistent', { title: 'Test' });
      expect(result).toBeNull();
    });

    test('should update updatedAt timestamp', async () => {
      const diary = await DiaryService.createDiary();
      const originalUpdated = diary.updatedAt;
      await new Promise(resolve => setTimeout(resolve, 10));
      const updated = await DiaryService.updateDiary(diary.id, { content: 'Updated' });
      expect(updated.updatedAt).not.toBe(originalUpdated);
    });

    test('should update currentDiary if it matches', async () => {
      const diary = await DiaryService.createDiary({ title: 'Original' });
      await DiaryService.updateDiary(diary.id, { title: 'Updated' });
      expect(DiaryService.getCurrentDiary().title).toBe('Updated');
    });
  });

  describe('deleteDiary', () => {
    test('should delete existing diary', async () => {
      const diary = await DiaryService.createDiary({ title: 'To Delete' });
      expect(DiaryService.getDiaries().length).toBe(1);
      const result = await DiaryService.deleteDiary(diary.id);
      expect(result).toBe(true);
      expect(DiaryService.getDiaries().length).toBe(0);
    });

    test('should return false for non-existent diary', async () => {
      const result = await DiaryService.deleteDiary('nonexistent');
      expect(result).toBe(false);
    });

    test('should clear currentDiary if deleted', async () => {
      const diary = await DiaryService.createDiary();
      await DiaryService.deleteDiary(diary.id);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });

  describe('searchDiaries', () => {
    beforeEach(async () => {
      await DiaryService.createDiary({ title: '工作日记', content: '今天完成了项目任务' });
      await DiaryService.createDiary({ title: '生活随笔', content: '周末和朋友聚会很开心' });
      await DiaryService.createDiary({ title: '学习笔记', content: '学习了JavaScript' });
    });

    test('should return all diaries for empty query', () => {
      expect(DiaryService.searchDiaries('').length).toBe(3);
      expect(DiaryService.searchDiaries(null).length).toBe(3);
    });

    test('should search by title', () => {
      const results = DiaryService.searchDiaries('工作');
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('工作日记');
    });

    test('should search by content', () => {
      const results = DiaryService.searchDiaries('开心');
      expect(results.length).toBe(1);
      expect(results[0].content).toContain('开心');
    });

    test('should be case insensitive', () => {
      const results = DiaryService.searchDiaries('javascript');
      expect(results.length).toBe(1);
    });
  });

  describe('getDiariesByDateRange', () => {
    test('should filter diaries by date range', async () => {
      const now = new Date();
      const diary1 = await DiaryService.createDiary({ title: 'Today' });
      const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const oldDiary = {
        id: 'old',
        title: 'Old',
        content: '',
        createdAt: pastDate.toISOString()
      };
      DiaryService.setDiaries([diary1, oldDiary]);

      const startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const endDate = new Date();
      const results = DiaryService.getDiariesByDateRange(startDate, endDate);
      expect(results.length).toBe(1);
      expect(results[0].title).toBe('Today');
    });
  });

  describe('sortDiaries', () => {
    test('should sort diaries by date descending by default', () => {
      const diaries = [
        { id: '1', title: 'Old', createdAt: new Date(2024, 0, 1).toISOString() },
        { id: '2', title: 'New', createdAt: new Date(2024, 0, 15).toISOString() }
      ];
      const sorted = DiaryService.sortDiaries(diaries);
      expect(sorted[0].title).toBe('New');
      expect(sorted[1].title).toBe('Old');
    });

    test('should sort by title', () => {
      const diaries = [
        { id: '1', title: 'Charlie' },
        { id: '2', title: 'Alpha' },
        { id: '3', title: 'Bravo' }
      ];
      const sorted = DiaryService.sortDiaries(diaries, 'title', 'asc');
      expect(sorted[0].title).toBe('Alpha');
      expect(sorted[2].title).toBe('Charlie');
    });

    test('should sort by word count', () => {
      const diaries = [
        { id: '1', title: 'Short', wordCount: 5 },
        { id: '2', title: 'Long', wordCount: 100 },
        { id: '3', title: 'Medium', wordCount: 50 }
      ];
      const sorted = DiaryService.sortDiaries(diaries, 'words', 'asc');
      expect(sorted[0].wordCount).toBe(5);
      expect(sorted[2].wordCount).toBe(100);
    });
  });

  describe('clearCache', () => {
    test('should clear diaries and current diary', async () => {
      await DiaryService.createDiary({ title: 'Test' });
      expect(DiaryService.getDiaries().length).toBe(1);
      DiaryService.clearCache();
      expect(DiaryService.getDiaries().length).toBe(0);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });

  describe('getStats', () => {
    test('should return stats for diaries', async () => {
      await DiaryService.createDiary({ content: '你好世界测试' });
      await DiaryService.createDiary({ content: '今天很开心' });
      const stats = DiaryService.getStats();
      expect(stats.totalDiaries).toBe(2);
      expect(stats).toHaveProperty('totalWords');
      expect(stats).toHaveProperty('avgWords');
    });
  });

  describe('getRecentDiaries', () => {
    test('should return recent diaries sorted by date', async () => {
      for (let i = 0; i < 5; i++) {
        await DiaryService.createDiary({ title: `Diary ${i}` });
      }
      const recent = DiaryService.getRecentDiaries(3);
      expect(recent.length).toBe(3);
    });
  });

  describe('getDrafts', () => {
    test('should return only draft diaries', async () => {
      const draft = await DiaryService.createDiary({ title: 'Draft' });
      const published = await DiaryService.createDiary({ title: 'Published', content: 'Content' });
      await DiaryService.updateDiary(published.id, { content: 'Updated content' });
      const drafts = DiaryService.getDrafts();
      expect(drafts.length).toBe(1);
      expect(drafts[0].id).toBe(draft.id);
    });
  });
});
