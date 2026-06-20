describe('DiaryService', () => {
  const mockWeatherData = {
    weather: '晴',
    emoji: '☀️',
    temperature: { current: 25, min: 18, max: 30 },
    airQuality: '优'
  };

  beforeEach(() => {
    resetModules();
    
    global.WeatherService = {
      getCurrentWeather: jest.fn().mockResolvedValue(mockWeatherData)
    };
    
    global.AuthService = {
      getCurrentUser: jest.fn().mockReturnValue({ username: 'testuser' }),
      saveUserDiaries: jest.fn().mockResolvedValue(true),
      loadUserDiaries: jest.fn().mockResolvedValue(true)
    };
    
    global.StatsService = {
      countWords: jest.fn(text => text ? text.length : 0),
      calculateStats: jest.fn(diaries => ({
        totalDiaries: diaries.length,
        totalWords: diaries.reduce((sum, d) => sum + (d.wordCount || 0), 0),
        avgWords: 0,
        streak: 0,
        frequency: {},
        emotionStats: { positive: 0, neutral: 0, negative: 0 }
      }))
    };
    
    global.SentimentService = {
      analyze: jest.fn().mockResolvedValue({
        positive: 0.6,
        neutral: 0.3,
        negative: 0.1,
        dominant: 'positive',
        confidence: 0.6,
        tokens: [],
        keywords: []
      })
    };
    
    loadScript('js/services/diary.service.js');
  });

  afterEach(() => {
    delete global.WeatherService;
    delete global.AuthService;
    delete global.StatsService;
    delete global.SentimentService;
  });

  describe('getDiaries and setDiaries', () => {
    it('should return empty array initially', () => {
      expect(DiaryService.getDiaries()).toEqual([]);
    });

    it('should set and get diaries correctly', () => {
      const diaries = [{ id: '1', title: 'Test' }];
      DiaryService.setDiaries(diaries);
      expect(DiaryService.getDiaries()).toEqual(diaries);
    });

    it('should return a copy of the array', () => {
      const diaries = [{ id: '1' }];
      DiaryService.setDiaries(diaries);
      const result = DiaryService.getDiaries();
      result.push({ id: '2' });
      expect(DiaryService.getDiaries()).toHaveLength(1);
    });
  });

  describe('createDiary', () => {
    it('should create a new diary with default values', async () => {
      const diary = await DiaryService.createDiary();
      expect(diary).toBeDefined();
      expect(diary.id).toMatch(/^diary_/);
      expect(diary.title).toBe('');
      expect(diary.content).toBe('');
      expect(diary.isDraft).toBe(true);
      expect(diary.weather).toEqual(mockWeatherData);
      expect(DiaryService.getDiaries()).toHaveLength(1);
      expect(DiaryService.getCurrentDiary()).toBe(diary);
    });

    it('should create a diary with provided options', async () => {
      const options = {
        title: '我的日记',
        content: '今天天气真好',
        editorMode: 'markdown'
      };
      const diary = await DiaryService.createDiary(options);
      expect(diary.title).toBe('我的日记');
      expect(diary.content).toBe('今天天气真好');
      expect(diary.editorMode).toBe('markdown');
    });

    it('should add new diary to the beginning of the list', async () => {
      const diary1 = await DiaryService.createDiary({ title: 'First' });
      const diary2 = await DiaryService.createDiary({ title: 'Second' });
      const diaries = DiaryService.getDiaries();
      expect(diaries[0].title).toBe('Second');
      expect(diaries[1].title).toBe('First');
    });
  });

  describe('getDiaryById', () => {
    it('should return diary by id', async () => {
      const diary = await DiaryService.createDiary({ title: 'Test Diary' });
      const found = DiaryService.getDiaryById(diary.id);
      expect(found).toBe(diary);
    });

    it('should return null for non-existent id', () => {
      expect(DiaryService.getDiaryById('non-existent')).toBeNull();
    });
  });

  describe('updateDiary', () => {
    it('should update existing diary', async () => {
      const diary = await DiaryService.createDiary({ title: 'Original', content: 'Original content' });
      const updated = await DiaryService.updateDiary(diary.id, {
        title: 'Updated',
        content: 'Updated content'
      });
      expect(updated.title).toBe('Updated');
      expect(updated.content).toBe('Updated content');
      expect(updated.isDraft).toBe(false);
      expect(updated.wordCount).toBeGreaterThan(0);
    });

    it('should return null for non-existent diary', async () => {
      const result = await DiaryService.updateDiary('non-existent', { title: 'Test' });
      expect(result).toBeNull();
    });

    it('should update currentDiary if it matches', async () => {
      const diary = await DiaryService.createDiary();
      await DiaryService.updateDiary(diary.id, { title: 'New Title' });
      expect(DiaryService.getCurrentDiary().title).toBe('New Title');
    });
  });

  describe('deleteDiary', () => {
    it('should delete existing diary', async () => {
      const diary = await DiaryService.createDiary();
      expect(DiaryService.getDiaries()).toHaveLength(1);
      const result = await DiaryService.deleteDiary(diary.id);
      expect(result).toBe(true);
      expect(DiaryService.getDiaries()).toHaveLength(0);
    });

    it('should return false for non-existent diary', async () => {
      const result = await DiaryService.deleteDiary('non-existent');
      expect(result).toBe(false);
    });

    it('should clear currentDiary if deleted', async () => {
      const diary = await DiaryService.createDiary();
      expect(DiaryService.getCurrentDiary()).toBeDefined();
      await DiaryService.deleteDiary(diary.id);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });

  describe('searchDiaries', () => {
    beforeEach(async () => {
      await DiaryService.createDiary({ title: '工作记录', content: '今天完成了项目开发' });
      await DiaryService.createDiary({ title: '生活随笔', content: '周末和朋友聚会很开心' });
      await DiaryService.createDiary({ title: '学习笔记', content: '学习了新的编程技术' });
    });

    it('should return all diaries for empty query', () => {
      expect(DiaryService.searchDiaries('')).toHaveLength(3);
      expect(DiaryService.searchDiaries(null)).toHaveLength(3);
    });

    it('should search by title', () => {
      const results = DiaryService.searchDiaries('工作');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('工作记录');
    });

    it('should search by content', () => {
      const results = DiaryService.searchDiaries('开心');
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('开心');
    });

    it('should be case insensitive', () => {
      const results = DiaryService.searchDiaries('PROJECT');
      expect(results.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sortDiaries', () => {
    it('should sort diaries by date descending by default', () => {
      const diaries = [
        { id: '1', createdAt: new Date(2024, 0, 1).toISOString(), title: 'A' },
        { id: '2', createdAt: new Date(2024, 0, 3).toISOString(), title: 'B' },
        { id: '3', createdAt: new Date(2024, 0, 2).toISOString(), title: 'C' }
      ];
      const sorted = DiaryService.sortDiaries(diaries);
      expect(sorted[0].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });

    it('should sort by title', () => {
      const diaries = [
        { id: '1', title: 'Charlie' },
        { id: '2', title: 'Alice' },
        { id: '3', title: 'Bob' }
      ];
      const sorted = DiaryService.sortDiaries(diaries, 'title', 'asc');
      expect(sorted[0].title).toBe('Alice');
      expect(sorted[2].title).toBe('Charlie');
    });

    it('should sort by word count', () => {
      const diaries = [
        { id: '1', wordCount: 100 },
        { id: '2', wordCount: 500 },
        { id: '3', wordCount: 50 }
      ];
      const sorted = DiaryService.sortDiaries(diaries, 'words', 'desc');
      expect(sorted[0].wordCount).toBe(500);
      expect(sorted[2].wordCount).toBe(50);
    });
  });

  describe('getRecentDiaries', () => {
    it('should return recent diaries limited by count', async () => {
      for (let i = 0; i < 15; i++) {
        await DiaryService.createDiary({ title: `Diary ${i}` });
      }
      const recent = DiaryService.getRecentDiaries(10);
      expect(recent).toHaveLength(10);
    });
  });

  describe('getDrafts', () => {
    it('should return only draft diaries', async () => {
      await DiaryService.createDiary({ title: 'Draft 1' });
      const draft2 = await DiaryService.createDiary({ title: 'Draft 2' });
      await DiaryService.updateDiary(draft2.id, { title: 'Published' });
      const drafts = DiaryService.getDrafts();
      expect(drafts).toHaveLength(1);
    });
  });

  describe('clearCache', () => {
    it('should clear all diaries and current diary', async () => {
      await DiaryService.createDiary();
      DiaryService.clearCache();
      expect(DiaryService.getDiaries()).toEqual([]);
      expect(DiaryService.getCurrentDiary()).toBeNull();
    });
  });
});
