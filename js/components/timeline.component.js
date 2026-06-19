
/**
 * 时间轴组件
 * 提供日记时间轴展示、缩放、下钻、标签管理等功能
 */
const TimelineComponent = (function() {
    let container = null;
    let diaries = [];
    let currentView = 'daily';
    let zoomLevel = 1;
    let centerDate = new Date();
    let selectedDate = null;
    let customTags = [];
    let hoveredDiary = null;
    let currentTooltipDiaryId = null;
    let hideTooltipTimeout = null;
    let isMouseOnTooltip = false;
    let isMouseOnDiaryNode = false;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragStartTime = 0;
    let timelineContainerElement = null;

    function showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;
        
        toast.textContent = message;
        toast.classList.remove('hidden');
        
        toast.style.background = type === 'error' ? '#ef4444' : 
                                 type === 'success' ? '#22c55e' : 
                                 type === 'warning' ? '#f59e0b' : '#6366f1';
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    const tagColors = {
        '工作': '#3b82f6',
        '旅行': '#10b981',
        '日常': '#f59e0b',
        '学习': '#8b5cf6',
        '健康': '#ec4899',
        '其他': '#64748b'
    };

    const specialDateKeywords = [
        { keyword: '生日', icon: '🎂', label: '生日' },
        { keyword: '纪念日', icon: '💝', label: '纪念日' },
        { keyword: '春节', icon: '🧧', label: '春节' },
        { keyword: '元旦', icon: '🎆', label: '元旦' },
        { keyword: '中秋', icon: '🥮', label: '中秋节' },
        { keyword: '国庆', icon: '🇨🇳', label: '国庆节' },
        { keyword: '情人节', icon: '💘', label: '情人节' },
        { keyword: '圣诞节', icon: '🎄', label: '圣诞节' },
        { keyword: '婚礼', icon: '💒', label: '婚礼' },
        { keyword: '毕业', icon: '🎓', label: '毕业' },
        { keyword: '旅行', icon: '✈️', label: '旅行' },
        { keyword: '入职', icon: '💼', label: '入职' },
        { keyword: '离职', icon: '📤', label: '离职' },
        { keyword: '考试', icon: '📝', label: '考试' },
        { keyword: '面试', icon: '🎯', label: '面试' }
    ];

    function init(timelineContainer) {
        container = timelineContainer;
        loadCustomTags();
        bindEvents();
        render();
    }

    function loadCustomTags() {
        const saved = localStorage.getItem('diary_custom_tags');
        if (saved) {
            try {
                customTags = JSON.parse(saved);
            } catch (e) {
                customTags = [];
            }
        }
    }

    function saveCustomTags() {
        localStorage.setItem('diary_custom_tags', JSON.stringify(customTags));
    }

    function setDiaries(diaryList) {
        diaries = [...diaryList];
        render();
    }

    function setView(view) {
        currentView = view;
        render();
    }

    function setZoom(level) {
        zoomLevel = Math.max(0.5, Math.min(3, level));
        render();
    }

    function zoomIn() {
        setZoom(zoomLevel * 1.2);
    }

    function zoomOut() {
        setZoom(zoomLevel * 0.8);
    }

    function setCenterDate(date) {
        centerDate = new Date(date);
        render();
    }

    function goToToday() {
        centerDate = new Date();
        render();
    }

    function goToPrevPeriod() {
        const date = new Date(centerDate);
        switch (currentView) {
            case 'daily':
                date.setDate(date.getDate() - 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() - 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() - 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() - 1);
                break;
        }
        centerDate = date;
        render();
    }

    function goToNextPeriod() {
        const date = new Date(centerDate);
        switch (currentView) {
            case 'daily':
                date.setDate(date.getDate() + 1);
                break;
            case 'weekly':
                date.setDate(date.getDate() + 7);
                break;
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'yearly':
                date.setFullYear(date.getFullYear() + 1);
                break;
        }
        centerDate = date;
        render();
    }

    function getDiariesByDate(date) {
        const dateStr = StatsService.formatDate(date);
        const dayDiaries = diaries.filter(d => StatsService.formatDate(d.createdAt) === dateStr);
        return dayDiaries.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    function getTimePeriod(hour) {
        if (hour >= 0 && hour < 6) return { key: 'night', label: '凌晨', icon: '🌙' };
        if (hour >= 6 && hour < 12) return { key: 'morning', label: '上午', icon: '🌅' };
        if (hour >= 12 && hour < 18) return { key: 'afternoon', label: '下午', icon: '☀️' };
        return { key: 'evening', label: '晚上', icon: '🌆' };
    }

    function groupDiariesByTime(diaries) {
        const groups = {
            morning: { label: '上午', icon: '🌅', diaries: [] },
            afternoon: { label: '下午', icon: '☀️', diaries: [] },
            evening: { label: '晚上', icon: '🌆', diaries: [] },
            night: { label: '凌晨', icon: '🌙', diaries: [] }
        };

        diaries.forEach(diary => {
            const hour = new Date(diary.createdAt).getHours();
            const period = getTimePeriod(hour);
            groups[period.key].diaries.push(diary);
        });

        return groups;
    }

    function getDateRange() {
        const dates = [];
        
        switch (currentView) {
            case 'daily':
                const daysAround = Math.ceil(7 * zoomLevel);
                const baseDaily = new Date(centerDate);
                baseDaily.setHours(0, 0, 0, 0);
                for (let i = -daysAround; i <= daysAround; i++) {
                    const d = new Date(baseDaily);
                    d.setDate(baseDaily.getDate() + i);
                    dates.push(d);
                }
                break;
            case 'weekly':
                const weeksAround = Math.ceil(4 * zoomLevel);
                const baseWeekly = new Date(centerDate);
                baseWeekly.setHours(0, 0, 0, 0);
                const dayOfWeek = baseWeekly.getDay();
                const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                baseWeekly.setDate(baseWeekly.getDate() + mondayDiff);
                for (let i = -weeksAround; i <= weeksAround; i++) {
                    const d = new Date(baseWeekly);
                    d.setDate(baseWeekly.getDate() + i * 7);
                    dates.push(d);
                }
                break;
            case 'monthly':
                const monthsAround = Math.ceil(6 * zoomLevel);
                const baseMonthly = new Date(centerDate);
                baseMonthly.setDate(1);
                baseMonthly.setHours(0, 0, 0, 0);
                for (let i = -monthsAround; i <= monthsAround; i++) {
                    const d = new Date(baseMonthly);
                    d.setMonth(baseMonthly.getMonth() + i);
                    dates.push(d);
                }
                break;
            case 'yearly':
                const yearsAround = Math.ceil(3 * zoomLevel);
                const baseYearly = new Date(centerDate);
                baseYearly.setMonth(0, 1);
                baseYearly.setHours(0, 0, 0, 0);
                for (let i = -yearsAround; i <= yearsAround; i++) {
                    const d = new Date(baseYearly);
                    d.setFullYear(baseYearly.getFullYear() + i);
                    dates.push(d);
                }
                break;
        }
        
        return dates;
    }

    function calculateConsecutiveStreaks() {
        const dateMap = {};
        diaries.forEach(diary => {
            const dateStr = StatsService.formatDate(diary.createdAt);
            if (!dateMap[dateStr]) {
                dateMap[dateStr] = [];
            }
            dateMap[dateStr].push(diary);
        });

        const sortedDates = Object.keys(dateMap).sort();
        const streaks = [];
        let currentStreak = null;

        for (let i = 0; i < sortedDates.length; i++) {
            const date = new Date(sortedDates[i]);
            
            if (!currentStreak) {
                currentStreak = {
                    start: sortedDates[i],
                    end: sortedDates[i],
                    days: 1,
                    diaries: [...dateMap[sortedDates[i]]]
                };
            } else {
                const lastDate = new Date(currentStreak.end);
                const diffDays = (date - lastDate) / (1000 * 60 * 60 * 24);
                
                if (diffDays === 1) {
                    currentStreak.end = sortedDates[i];
                    currentStreak.days++;
                    currentStreak.diaries.push(...dateMap[sortedDates[i]]);
                } else {
                    streaks.push(currentStreak);
                    currentStreak = {
                        start: sortedDates[i],
                        end: sortedDates[i],
                        days: 1,
                        diaries: [...dateMap[sortedDates[i]]]
                    };
                }
            }
        }
        
        if (currentStreak) {
            streaks.push(currentStreak);
        }

        return streaks.sort((a, b) => b.days - a.days);
    }

    function getLongestStreak() {
        const streaks = calculateConsecutiveStreaks();
        return streaks.length > 0 ? streaks[0] : null;
    }

    function getStreaksOfLength(minDays) {
        const streaks = calculateConsecutiveStreaks();
        return streaks.filter(s => s.days >= minDays);
    }

    function isDateInStreak(dateStr, streak) {
        return dateStr >= streak.start && dateStr <= streak.end;
    }

    function detectSpecialDate(diary) {
        if (!diary || !diary.content) return null;
        
        const content = diary.content.toLowerCase();
        const title = (diary.title || '').toLowerCase();
        const fullText = title + ' ' + content;

        for (const item of specialDateKeywords) {
            if (fullText.includes(item.keyword.toLowerCase())) {
                return item;
            }
        }
        
        return null;
    }

    function getDiaryTag(diary) {
        if (diary.customTag) {
            return diary.customTag;
        }
        
        const content = (diary.content || '').toLowerCase();
        const title = (diary.title || '').toLowerCase();
        const fullText = title + ' ' + content;

        if (fullText.includes('工作') || fullText.includes('上班') || fullText.includes('会议') || fullText.includes('项目')) {
            return '工作';
        }
        if (fullText.includes('旅行') || fullText.includes('旅游') || fullText.includes('游玩') || fullText.includes('出发')) {
            return '旅行';
        }
        if (fullText.includes('学习') || fullText.includes('读书') || fullText.includes('上课') || fullText.includes('考试')) {
            return '学习';
        }
        if (fullText.includes('健身') || fullText.includes('运动') || fullText.includes('跑步') || fullText.includes('医院')) {
            return '健康';
        }

        return '日常';
    }

    function getTagColor(tag) {
        return tagColors[tag] || tagColors['其他'];
    }

    function getPreviewContent(content, mode) {
        if (!content) return '';
        
        let text = '';
        if (mode === 'rich') {
            text = MarkdownUtils.getPlainText(content);
        } else {
            text = content.replace(/[#*`\[\]()\-!]/g, ' ').replace(/\s+/g, ' ');
        }
        
        return text.substring(0, 150) + (text.length > 150 ? '...' : '');
    }

    function render() {
        if (!container) return;

        const dates = getDateRange();
        const streaks7days = getStreaksOfLength(7);
        const streaks30days = getStreaksOfLength(30);
        const longestStreak = getLongestStreak();

        let html = `
            <div class="timeline-header">
                <div class="timeline-streak-info">
                    ${longestStreak ? `
                        <div class="streak-badge">
                            <span class="streak-icon">🔥</span>
                            <span class="streak-text">最长连续: ${longestStreak.days}天</span>
                            <span class="streak-range">(${longestStreak.start} ~ ${longestStreak.end})</span>
                        </div>
                    ` : ''}
                </div>
                <div class="timeline-controls">
                    <button class="timeline-btn" id="timeline-prev" title="上一周期">◀</button>
                    <button class="timeline-btn" id="timeline-today" title="今天">今天</button>
                    <button class="timeline-btn" id="timeline-next" title="下一周期">▶</button>
                    <div class="timeline-zoom">
                        <button class="timeline-btn" id="timeline-zoom-out" title="缩小">-</button>
                        <span class="zoom-level">${Math.round(zoomLevel * 100)}%</span>
                        <button class="timeline-btn" id="timeline-zoom-in" title="放大">+</button>
                    </div>
                </div>
            </div>
            <div class="timeline-view-tabs">
                <button class="view-tab ${currentView === 'daily' ? 'active' : ''}" data-view="daily">日视图</button>
                <button class="view-tab ${currentView === 'weekly' ? 'active' : ''}" data-view="weekly">周视图</button>
                <button class="view-tab ${currentView === 'monthly' ? 'active' : ''}" data-view="monthly">月视图</button>
                <button class="view-tab ${currentView === 'yearly' ? 'active' : ''}" data-view="yearly">年视图</button>
            </div>
            <div class="timeline-container">
                <div class="timeline-axis">
                    ${dates.map(date => {
                        const dateStr = StatsService.formatDate(date);
                        const dayDiaries = getDiariesByDate(date);
                        const isToday = DateUtils.isToday(date);
                        const isCenterDate = StatsService.formatDate(date) === StatsService.formatDate(centerDate);
                        
                        let streakClass = '';
                        let streakType = '';
                        for (const streak of streaks30days) {
                            if (isDateInStreak(dateStr, streak)) {
                                streakClass = 'streak-30days';
                                streakType = '30天连续';
                                break;
                            }
                        }
                        if (!streakClass) {
                            for (const streak of streaks7days) {
                                if (isDateInStreak(dateStr, streak)) {
                                    streakClass = 'streak-7days';
                                    streakType = '7天连续';
                                    break;
                                }
                            }
                        }

                        function renderDiaryNode(diary, dateStr) {
                            const tag = getDiaryTag(diary);
                            const tagColor = getTagColor(tag);
                            const specialDate = detectSpecialDate(diary);
                            const emotionEmoji = diary.sentiment ? SentimentService.getEmotionEmoji(diary.sentiment) : '😊';
                            const isCustomTag = !!diary.customTag;
                            
                            return `
                                <div class="diary-node" 
                                     data-diary-id="${diary.id}"
                                     data-date="${dateStr}"
                                     style="border-left-color: ${tagColor}"
                                     title="${diary.title || '无标题'}">
                                    <div class="diary-node-header">
                                        <div class="diary-node-title">${escapeHtml(diary.title || '无标题')}</div>
                                        <button class="diary-tag-btn" data-diary-id="${diary.id}" title="设置标签">
                                            <span class="tag-icon">🏷️</span>
                                        </button>
                                    </div>
                                    <div class="diary-node-meta">
                                        <span class="diary-time">${DateUtils.getTimeDisplay(diary.createdAt)}</span>
                                        <span class="diary-emotion">${emotionEmoji}</span>
                                        ${specialDate ? `<span class="special-date-badge" title="${specialDate.label}">${specialDate.icon}</span>` : ''}
                                        <span class="diary-tag-badge ${isCustomTag ? 'custom-tag' : ''}" style="background: ${tagColor}">
                                            ${isCustomTag ? '✓ ' : ''}${tag}
                                        </span>
                                    </div>
                                </div>
                            `;
                        }

                        let diaryContent = '';
                        if (dayDiaries.length > 0) {
                            if (currentView === 'daily' && dayDiaries.length > 2) {
                                const groups = groupDiariesByTime(dayDiaries);
                                const hasGroups = groups.morning.diaries.length > 0 || 
                                                 groups.afternoon.diaries.length > 0 || 
                                                 groups.evening.diaries.length > 0 || 
                                                 groups.night.diaries.length > 0;
                                
                                if (hasGroups) {
                                    diaryContent = `<div class="diary-nodes-scrollable">`;
                                    
                                    if (groups.morning.diaries.length > 0) {
                                        diaryContent += `
                                            <div class="time-period-group">
                                                <div class="time-period-header">
                                                    <span class="time-period-icon">${groups.morning.icon}</span>
                                                    <span class="time-period-label">${groups.morning.label}</span>
                                                    <span class="time-period-count">(${groups.morning.diaries.length}篇)</span>
                                                </div>
                                                <div class="diary-nodes">
                                                    ${groups.morning.diaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }
                                    
                                    if (groups.afternoon.diaries.length > 0) {
                                        diaryContent += `
                                            <div class="time-period-group">
                                                <div class="time-period-header">
                                                    <span class="time-period-icon">${groups.afternoon.icon}</span>
                                                    <span class="time-period-label">${groups.afternoon.label}</span>
                                                    <span class="time-period-count">(${groups.afternoon.diaries.length}篇)</span>
                                                </div>
                                                <div class="diary-nodes">
                                                    ${groups.afternoon.diaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }
                                    
                                    if (groups.evening.diaries.length > 0) {
                                        diaryContent += `
                                            <div class="time-period-group">
                                                <div class="time-period-header">
                                                    <span class="time-period-icon">${groups.evening.icon}</span>
                                                    <span class="time-period-label">${groups.evening.label}</span>
                                                    <span class="time-period-count">(${groups.evening.diaries.length}篇)</span>
                                                </div>
                                                <div class="diary-nodes">
                                                    ${groups.evening.diaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }
                                    
                                    if (groups.night.diaries.length > 0) {
                                        diaryContent += `
                                            <div class="time-period-group">
                                                <div class="time-period-header">
                                                    <span class="time-period-icon">${groups.night.icon}</span>
                                                    <span class="time-period-label">${groups.night.label}</span>
                                                    <span class="time-period-count">(${groups.night.diaries.length}篇)</span>
                                                </div>
                                                <div class="diary-nodes">
                                                    ${groups.night.diaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                                </div>
                                            </div>
                                        `;
                                    }
                                    
                                    diaryContent += `</div>`;
                                } else {
                                    diaryContent = `
                                        <div class="diary-nodes-scrollable">
                                            <div class="diary-nodes">
                                                ${dayDiaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                            </div>
                                        </div>
                                    `;
                                }
                            } else {
                                diaryContent = `
                                    <div class="diary-nodes">
                                        ${dayDiaries.map(d => renderDiaryNode(d, dateStr)).join('')}
                                    </div>
                                `;
                            }
                        } else {
                            diaryContent = `<div class="empty-date-indicator"></div>`;
                        }

                        return `
                            <div class="timeline-date-node ${isToday ? 'today' : ''} ${isCenterDate ? 'center' : ''} ${streakClass} ${currentView === 'daily' && dayDiaries.length > 2 ? 'has-scrollable' : ''}" 
                                 data-date="${dateStr}"
                                 title="${streakType ? streakType + '记录' : ''}">
                                <div class="date-label">
                                    <div class="date-day">${date.getDate()}</div>
                                    <div class="date-month">${date.getMonth() + 1}月</div>
                                    <div class="date-weekday">${DateUtils.getDayOfWeek(date)}</div>
                                </div>
                                ${diaryContent}
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
            <div class="timeline-footer">
                <button class="btn btn-secondary" id="timeline-export-btn">
                    <span class="icon">📥</span> 导出时间轴
                </button>
                <button class="btn btn-secondary" id="timeline-manage-tags-btn">
                    <span class="icon">🏷️</span> 管理标签
                </button>
            </div>
            <div class="timeline-tooltip hidden" id="timeline-tooltip"></div>
        `;

        container.innerHTML = html;
        bindTimelineEvents();
    }

    function bindEvents() {
        if (!container) return;

        container.addEventListener('click', function(e) {
            const target = e.target;
            
            if (target.id === 'timeline-prev') {
                goToPrevPeriod();
            } else if (target.id === 'timeline-next') {
                goToNextPeriod();
            } else if (target.id === 'timeline-today') {
                goToToday();
            } else if (target.id === 'timeline-zoom-in') {
                zoomIn();
            } else if (target.id === 'timeline-zoom-out') {
                zoomOut();
            } else if (target.classList.contains('view-tab')) {
                const view = target.getAttribute('data-view');
                setView(view);
                updateViewTabs();
            } else if (target.id === 'timeline-export-btn') {
                showExportDialog();
            } else if (target.id === 'timeline-manage-tags-btn') {
                showTagManager();
            }
        });
    }

    function bindTimelineEvents() {
        const diaryNodes = container.querySelectorAll('.diary-node');
        diaryNodes.forEach(node => {
            node.addEventListener('click', function(e) {
                if (e.target.closest('.diary-tag-btn')) {
                    return;
                }
                
                e.stopPropagation();
                const diaryId = this.getAttribute('data-diary-id');
                if (diaryId && typeof onDiaryClick === 'function') {
                    onDiaryClick(diaryId);
                }
            });

            node.addEventListener('mouseenter', function(e) {
                if (e.target.closest('.diary-tag-btn')) {
                    return;
                }
                
                const diaryId = this.getAttribute('data-diary-id');
                isMouseOnDiaryNode = true;
                clearHideTooltipTimeout();
                showTooltip(diaryId, e);
            });

            node.addEventListener('mouseleave', function() {
                isMouseOnDiaryNode = false;
                scheduleHideTooltip();
            });

            node.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                const diaryId = this.getAttribute('data-diary-id');
                showTagMenu(diaryId, e);
            });
        });

        const tagBtns = container.querySelectorAll('.diary-tag-btn');
        tagBtns.forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                hideTooltip();
                const diaryId = this.getAttribute('data-diary-id');
                showTagMenu(diaryId, e);
            });

            btn.addEventListener('mouseenter', function(e) {
                e.stopPropagation();
                hideTooltip();
            });
        });

        const dateNodes = container.querySelectorAll('.timeline-date-node');
        dateNodes.forEach(node => {
            node.addEventListener('click', function(e) {
                if (!e.target.closest('.diary-node')) {
                    const dateStr = this.getAttribute('data-date');
                    if (typeof onDateClick === 'function') {
                        onDateClick(dateStr);
                    }
                }
            });
        });

        bindTooltipEvents();
        bindDragEvents();
    }

    function bindDragEvents() {
        timelineContainerElement = container.querySelector('.timeline-container');
        if (!timelineContainerElement) return;

        timelineContainerElement.style.cursor = 'grab';
        timelineContainerElement.style.userSelect = 'none';

        timelineContainerElement.addEventListener('mousedown', handleDragStart);
        timelineContainerElement.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);

        timelineContainerElement.addEventListener('touchstart', handleTouchStart, { passive: false });
        timelineContainerElement.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd);

        timelineContainerElement.addEventListener('wheel', handleWheelScroll, { passive: false });
    }

    function handleDragStart(e) {
        if (e.target.closest('.diary-node') || e.target.closest('.view-tab') || e.target.closest('.timeline-btn')) {
            return;
        }

        isDragging = true;
        dragStartX = e.pageX || e.touches?.[0]?.pageX;
        dragStartScrollLeft = timelineContainerElement.scrollLeft;
        dragStartTime = Date.now();
        
        timelineContainerElement.style.cursor = 'grabbing';
    }

    function handleDragMove(e) {
        if (!isDragging) return;
        
        e.preventDefault();
        const currentX = e.pageX || e.touches?.[0]?.pageX;
        const diffX = dragStartX - currentX;
        
        timelineContainerElement.scrollLeft = dragStartScrollLeft + diffX;
    }

    function handleDragEnd(e) {
        if (!isDragging) return;
        
        isDragging = false;
        timelineContainerElement.style.cursor = 'grab';
        
        const dragEndTime = Date.now();
        const dragDuration = dragEndTime - dragStartTime;
        const endX = e.pageX || e.changedTouches?.[0]?.pageX;
        
        if (dragDuration < 200 && Math.abs(endX - dragStartX) < 5) {
            const target = e.target;
            if (target.closest('.timeline-date-node') && !target.closest('.diary-node')) {
                const dateNode = target.closest('.timeline-date-node');
                const dateStr = dateNode.getAttribute('data-date');
                if (dateStr && typeof onDateClick === 'function') {
                    onDateClick(dateStr);
                }
            }
        }
    }

    function handleTouchStart(e) {
        if (e.target.closest('.diary-node') || e.target.closest('.view-tab') || e.target.closest('.timeline-btn')) {
            return;
        }
        handleDragStart(e);
    }

    function handleTouchMove(e) {
        if (!isDragging) return;
        handleDragMove(e);
    }

    function handleTouchEnd(e) {
        handleDragEnd(e);
    }

    function handleWheelScroll(e) {
        if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(zoomLevel * delta);
        } else {
            e.preventDefault();
            timelineContainerElement.scrollLeft += e.deltaY || e.deltaX;
        }
    }

    function bindTooltipEvents() {
        const tooltip = document.getElementById('timeline-tooltip');
        if (!tooltip) return;

        tooltip.addEventListener('mouseenter', function() {
            isMouseOnTooltip = true;
            clearHideTooltipTimeout();
        });

        tooltip.addEventListener('mouseleave', function() {
            isMouseOnTooltip = false;
            scheduleHideTooltip();
        });

        tooltip.addEventListener('click', function(e) {
            if (currentTooltipDiaryId && typeof onDiaryClick === 'function') {
                onDiaryClick(currentTooltipDiaryId);
            }
        });
    }

    function clearHideTooltipTimeout() {
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
            hideTooltipTimeout = null;
        }
    }

    function scheduleHideTooltip() {
        clearHideTooltipTimeout();
        hideTooltipTimeout = setTimeout(function() {
            if (!isMouseOnDiaryNode && !isMouseOnTooltip) {
                hideTooltip();
            }
        }, 200);
    }

    function updateViewTabs() {
        const tabs = container.querySelectorAll('.view-tab');
        tabs.forEach(tab => {
            const view = tab.getAttribute('data-view');
            tab.classList.toggle('active', view === currentView);
        });
    }

    function showTooltip(diaryId, event) {
        const diary = diaries.find(d => d.id === diaryId);
        if (!diary) return;

        const tooltip = document.getElementById('timeline-tooltip');
        if (!tooltip) return;

        currentTooltipDiaryId = diaryId;

        const tag = getDiaryTag(diary);
        const tagColor = getTagColor(tag);
        const specialDate = detectSpecialDate(diary);
        const emotionEmoji = diary.sentiment ? SentimentService.getEmotionEmoji(diary.sentiment) : '😊';
        const emotionLabel = diary.sentiment ? SentimentService.getEmotionLabel(diary.sentiment) : '中性';
        const preview = getPreviewContent(diary.content, diary.editorMode);

        tooltip.innerHTML = `
            <div class="tooltip-header">
                <h4 class="tooltip-title">${escapeHtml(diary.title || '无标题')}</h4>
                <div class="tooltip-meta">
                    <span class="tooltip-date">${DateUtils.getDateTimeDisplay(diary.createdAt)}</span>
                    <span class="tooltip-emotion">${emotionEmoji} ${emotionLabel}</span>
                    ${specialDate ? `<span class="tooltip-special">${specialDate.icon} ${specialDate.label}</span>` : ''}
                    <span class="tooltip-tag" style="background: ${tagColor}">${tag}</span>
                </div>
            </div>
            <div class="tooltip-content">
                ${preview ? `<p>${escapeHtml(preview)}</p>` : '<p class="no-content">暂无内容</p>'}
            </div>
            <div class="tooltip-footer">
                <span class="word-count">字数: ${diary.wordCount || 0}</span>
                <span class="click-hint">点击查看详情</span>
            </div>
        `;

        tooltip.classList.remove('hidden');
        tooltip.style.cursor = 'pointer';
        
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = rect.left + 'px';
        tooltip.style.top = (rect.bottom + 10) + 'px';

        const tooltipRect = tooltip.getBoundingClientRect();
        if (tooltipRect.right > window.innerWidth) {
            tooltip.style.left = (window.innerWidth - tooltipRect.width - 20) + 'px';
        }
        if (tooltipRect.bottom > window.innerHeight) {
            tooltip.style.top = (rect.top - tooltipRect.height - 10) + 'px';
        }
    }

    function hideTooltip() {
        const tooltip = document.getElementById('timeline-tooltip');
        if (tooltip) {
            tooltip.classList.add('hidden');
        }
        currentTooltipDiaryId = null;
        isMouseOnTooltip = false;
        isMouseOnDiaryNode = false;
        clearHideTooltipTimeout();
    }

    function showTagMenu(diaryId, event) {
        const diary = diaries.find(d => d.id === diaryId);
        if (!diary) return;

        const existingMenu = document.querySelector('.tag-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'tag-context-menu';
        menu.innerHTML = `
            <div class="menu-title">设置标签</div>
            ${Object.keys(tagColors).map(tag => `
                <div class="menu-item" data-tag="${tag}">
                    <span class="menu-tag-color" style="background: ${tagColors[tag]}"></span>
                    <span>${tag}</span>
                    ${diary.customTag === tag ? '<span class="check-mark">✓</span>' : ''}
                </div>
            `).join('')}
            ${customTags.map(tag => `
                <div class="menu-item" data-tag="${tag}">
                    <span class="menu-tag-color" style="background: #8b5cf6"></span>
                    <span>${tag}</span>
                    ${diary.customTag === tag ? '<span class="check-mark">✓</span>' : ''}
                </div>
            `).join('')}
            <div class="menu-divider"></div>
            <div class="menu-item" data-action="clear">
                <span class="menu-tag-color" style="background: #64748b"></span>
                <span>清除标签</span>
            </div>
        `;

        document.body.appendChild(menu);
        
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';

        const menuItems = menu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', async function() {
                const tag = this.getAttribute('data-tag');
                const action = this.getAttribute('data-action');
                
                let newCustomTag = null;
                if (action === 'clear') {
                    newCustomTag = null;
                } else if (tag) {
                    newCustomTag = tag;
                }
                
                diary.customTag = newCustomTag;
                
                try {
                    await DiaryService.updateDiary(diary.id, { customTag: newCustomTag });
                    showToast('标签设置成功', 'success');
                } catch (error) {
                    console.error('Failed to update diary tag:', error);
                    showToast('标签设置失败', 'error');
                }
                
                render();
                menu.remove();
            });
        });

        const closeMenu = function(e) {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    function showTagManager() {
        const existingDialog = document.querySelector('.tag-manager-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'tag-manager-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>管理自定义标签</h3>
                    <button class="close-btn" id="close-tag-manager">×</button>
                </div>
                <div class="dialog-body">
                    <div class="tag-list-section">
                        <h4>预设标签</h4>
                        <div class="tag-list">
                            ${Object.keys(tagColors).map(tag => `
                                <div class="tag-item preset">
                                    <span class="tag-color" style="background: ${tagColors[tag]}"></span>
                                    <span class="tag-name">${tag}</span>
                                    <span class="tag-type">预设</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="tag-list-section">
                        <h4>自定义标签</h4>
                        <div class="tag-input-group">
                            <input type="text" id="new-tag-input" placeholder="输入新标签名称">
                            <button class="btn btn-primary btn-sm" id="add-tag-btn">添加</button>
                        </div>
                        <div class="tag-list" id="custom-tag-list">
                            ${customTags.length === 0 ? 
                                '<p class="empty-tags">暂无自定义标签</p>' :
                                customTags.map(tag => `
                                    <div class="tag-item">
                                        <span class="tag-color" style="background: #8b5cf6"></span>
                                        <span class="tag-name">${tag}</span>
                                        <button class="delete-tag-btn" data-tag="${tag}">×</button>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const closeBtn = dialog.querySelector('#close-tag-manager');
        const overlay = dialog.querySelector('.dialog-overlay');
        
        closeBtn.addEventListener('click', () => dialog.remove());
        overlay.addEventListener('click', () => dialog.remove());

        const addBtn = dialog.querySelector('#add-tag-btn');
        const newTagInput = dialog.querySelector('#new-tag-input');
        
        addBtn.addEventListener('click', () => {
            const tagName = newTagInput.value.trim();
            if (tagName && !customTags.includes(tagName) && !Object.keys(tagColors).includes(tagName)) {
                customTags.push(tagName);
                saveCustomTags();
                renderTagList(dialog);
                newTagInput.value = '';
            }
        });

        newTagInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                addBtn.click();
            }
        });

        dialog.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-tag-btn')) {
                const tag = e.target.getAttribute('data-tag');
                customTags = customTags.filter(t => t !== tag);
                saveCustomTags();
                renderTagList(dialog);
            }
        });
    }

    function renderTagList(dialog) {
        const tagList = dialog.querySelector('#custom-tag-list');
        if (!tagList) return;

        tagList.innerHTML = customTags.length === 0 ? 
            '<p class="empty-tags">暂无自定义标签</p>' :
            customTags.map(tag => `
                <div class="tag-item">
                    <span class="tag-color" style="background: #8b5cf6"></span>
                    <span class="tag-name">${tag}</span>
                    <button class="delete-tag-btn" data-tag="${tag}">×</button>
                </div>
            `).join('');
    }

    function showExportDialog() {
        const existingDialog = document.querySelector('.export-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }

        const dialog = document.createElement('div');
        dialog.className = 'export-dialog';
        dialog.innerHTML = `
            <div class="dialog-overlay"></div>
            <div class="dialog-content">
                <div class="dialog-header">
                    <h3>导出时间轴</h3>
                    <button class="close-btn" id="close-export-dialog">×</button>
                </div>
                <div class="dialog-body">
                    <div class="export-form">
                        <div class="form-group">
                            <label>选择导出格式</label>
                            <div class="format-options">
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="html" checked>
                                    <span>HTML (含样式)</span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="markdown">
                                    <span>Markdown</span>
                                </label>
                                <label class="format-option">
                                    <input type="radio" name="export-format" value="json">
                                    <span>JSON 数据</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label>选择日期范围 (最多15天)</label>
                            <div class="date-range-inputs">
                                <div class="date-input-group">
                                    <label>开始日期</label>
                                    <input type="date" id="export-start-date" value="${getDefaultStartDate()}">
                                </div>
                                <div class="date-input-group">
                                    <label>结束日期</label>
                                    <input type="date" id="export-end-date" value="${StatsService.formatDate(new Date())}">
                                </div>
                            </div>
                            <p class="date-hint">最多可导出连续15天的数据</p>
                        </div>
                        <div class="form-group">
                            <label>导出选项</label>
                            <div class="export-options">
                                <label class="option-item">
                                    <input type="checkbox" id="export-include-content" checked>
                                    <span>包含日记内容</span>
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" id="export-include-emotion" checked>
                                    <span>包含情绪分析</span>
                                </label>
                                <label class="option-item">
                                    <input type="checkbox" id="export-include-tags" checked>
                                    <span>包含标签</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="dialog-footer">
                    <button class="btn btn-secondary" id="cancel-export">取消</button>
                    <button class="btn btn-primary" id="confirm-export">导出</button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        const closeBtn = dialog.querySelector('#close-export-dialog');
        const overlay = dialog.querySelector('.dialog-overlay');
        const cancelBtn = dialog.querySelector('#cancel-export');
        
        const closeDialog = () => dialog.remove();
        closeBtn.addEventListener('click', closeDialog);
        overlay.addEventListener('click', closeDialog);
        cancelBtn.addEventListener('click', closeDialog);

        const startDateInput = dialog.querySelector('#export-start-date');
        const endDateInput = dialog.querySelector('#export-end-date');

        startDateInput.addEventListener('change', validateDateRange);
        endDateInput.addEventListener('change', validateDateRange);

        function validateDateRange() {
            const start = new Date(startDateInput.value);
            const end = new Date(endDateInput.value);
            const diffDays = (end - start) / (1000 * 60 * 60 * 24);

            if (diffDays > 14) {
                const newEnd = new Date(start);
                newEnd.setDate(start.getDate() + 14);
                endDateInput.value = StatsService.formatDate(newEnd);
                showToast('导出范围最多15天，已自动调整结束日期', 'warning');
            }

            if (end < start) {
                endDateInput.value = startDateInput.value;
            }
        }

        const exportBtn = dialog.querySelector('#confirm-export');
        exportBtn.addEventListener('click', () => {
            const format = dialog.querySelector('input[name="export-format"]:checked').value;
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            const includeContent = dialog.querySelector('#export-include-content').checked;
            const includeEmotion = dialog.querySelector('#export-include-emotion').checked;
            const includeTags = dialog.querySelector('#export-include-tags').checked;

            exportTimeline(format, startDate, endDate, {
                includeContent,
                includeEmotion,
                includeTags
            });

            closeDialog();
        });
    }

    function getDefaultStartDate() {
        const date = new Date();
        date.setDate(date.getDate() - 14);
        return StatsService.formatDate(date);
    }

    function exportTimeline(format, startDate, endDate, options) {
        const filteredDiaries = diaries.filter(diary => {
            const diaryDate = new Date(diary.createdAt);
            return diaryDate >= startDate && diaryDate <= endDate;
        }).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        let content = '';
        let fileName = `timeline_${StatsService.formatDate(startDate)}_${StatsService.formatDate(endDate)}`;
        let mimeType = 'text/plain';

        switch (format) {
            case 'html':
                content = generateHTMLExport(filteredDiaries, options, startDate, endDate);
                fileName += '.html';
                mimeType = 'text/html';
                break;
            case 'markdown':
                content = generateMarkdownExport(filteredDiaries, options, startDate, endDate);
                fileName += '.md';
                mimeType = 'text/markdown';
                break;
            case 'json':
                content = generateJSONExport(filteredDiaries, options, startDate, endDate);
                fileName += '.json';
                mimeType = 'application/json';
                break;
        }

        const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showToast(`时间轴已导出为 ${format.toUpperCase()} 格式`, 'success');
    }

    function generateHTMLExport(diaries, options, startDate, endDate) {
        const streaks = calculateConsecutiveStreaks();
        const longestStreak = getLongestStreak();

        const diariesByDate = {};
        diaries.forEach(diary => {
            const dateStr = StatsService.formatDate(diary.createdAt);
            if (!diariesByDate[dateStr]) {
                diariesByDate[dateStr] = [];
            }
            diariesByDate[dateStr].push(diary);
        });

        const sortedDates = Object.keys(diariesByDate).sort();

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>日记时间轴 - ${StatsService.formatDate(startDate)} 至 ${StatsService.formatDate(endDate)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f8fafc; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
        .header h1 { color: #6366f1; margin-bottom: 10px; }
        .header .date-range { color: #64748b; font-size: 14px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 40px; }
        .stat-card { background: #f8fafc; padding: 20px; border-radius: 8px; text-align: center; }
        .stat-value { font-size: 28px; font-weight: 700; color: #6366f1; }
        .stat-label { font-size: 14px; color: #64748b; margin-top: 5px; }
        .timeline { position: relative; padding-left: 30px; }
        .timeline::before { content: ''; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: #e2e8f0; }
        .date-group { margin-bottom: 40px; position: relative; }
        .date-group::before { content: ''; position: absolute; left: -24px; top: 8px; width: 12px; height: 12px; background: #6366f1; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .date-header { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; }
        .date-badge { background: #6366f1; color: white; padding: 8px 16px; border-radius: 20px; font-weight: 600; }
        .diary-count { color: #64748b; font-size: 14px; }
        .diary-item { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 15px; border-left: 4px solid #6366f1; }
        .diary-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; }
        .diary-title { font-size: 18px; font-weight: 600; color: #1e293b; }
        .diary-meta { display: flex; gap: 10px; align-items: center; }
        .diary-time { color: #64748b; font-size: 13px; }
        .diary-emotion { font-size: 20px; }
        .diary-tag { background: #6366f1; color: white; padding: 4px 10px; border-radius: 12px; font-size: 12px; }
        .diary-content { color: #475569; line-height: 1.8; margin-top: 15px; }
        .empty-state { text-align: center; padding: 60px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📔 日记时间轴</h1>
            <div class="date-range">${StatsService.formatDate(startDate)} 至 ${StatsService.formatDate(endDate)}</div>
        </div>
        
        ${longestStreak ? `
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value">${diaries.length}</div>
                <div class="stat-label">日记总数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${longestStreak.days}</div>
                <div class="stat-label">最长连续天数</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${sortedDates.length}</div>
                <div class="stat-label">记录天数</div>
            </div>
        </div>
        ` : ''}

        ${sortedDates.length > 0 ? `
        <div class="timeline">
            ${sortedDates.map(dateStr => {
                const dateDiaries = diariesByDate[dateStr];
                return `
                <div class="date-group">
                    <div class="date-header">
                        <span class="date-badge">${dateStr}</span>
                        <span class="diary-count">${dateDiaries.length} 篇日记</span>
                    </div>
                    ${dateDiaries.map(diary => {
                        const tag = options.includeTags ? getDiaryTag(diary) : null;
                        const emotionEmoji = options.includeEmotion && diary.sentiment ? SentimentService.getEmotionEmoji(diary.sentiment) : null;
                        const content = options.includeContent ? getPreviewContent(diary.content, diary.editorMode) : null;
                        
                        return `
                        <div class="diary-item">
                            <div class="diary-header">
                                <div class="diary-title">${escapeHtml(diary.title || '无标题')}</div>
                                <div class="diary-meta">
                                    <span class="diary-time">${DateUtils.getTimeDisplay(diary.createdAt)}</span>
                                    ${emotionEmoji ? `<span class="diary-emotion">${emotionEmoji}</span>` : ''}
                                    ${tag ? `<span class="diary-tag" style="background: ${getTagColor(tag)}">${tag}</span>` : ''}
                                </div>
                            </div>
                            ${content ? `<div class="diary-content">${escapeHtml(content)}</div>` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>
                `;
            }).join('')}
        </div>
        ` : `
        <div class="empty-state">
            <h3>该时间段内暂无日记记录</h3>
        </div>
        `}
    </div>
</body>
</html>`;
    }

    function generateMarkdownExport(diaries, options, startDate, endDate) {
        const diariesByDate = {};
        diaries.forEach(diary => {
            const dateStr = StatsService.formatDate(diary.createdAt);
            if (!diariesByDate[dateStr]) {
                diariesByDate[dateStr] = [];
            }
            diariesByDate[dateStr].push(diary);
        });

        const sortedDates = Object.keys(diariesByDate).sort();
        let md = `# 📔 日记时间轴\n\n`;
        md += `> **时间范围**: ${StatsService.formatDate(startDate)} 至 ${StatsService.formatDate(endDate)}\n\n`;
        md += `> **日记总数**: ${diaries.length} 篇\n\n`;
        md += `---\n\n`;

        sortedDates.forEach(dateStr => {
            const dateDiaries = diariesByDate[dateStr];
            md += `## 📅 ${dateStr}\n\n`;

            dateDiaries.forEach(diary => {
                const tag = options.includeTags ? getDiaryTag(diary) : null;
                const emotionEmoji = options.includeEmotion && diary.sentiment ? SentimentService.getEmotionEmoji(diary.sentiment) : null;
                const content = options.includeContent ? getPreviewContent(diary.content, diary.editorMode) : null;

                md += `### ${escapeHtml(diary.title || '无标题')}\n\n`;
                md += `**时间**: ${DateUtils.getDateTimeDisplay(diary.createdAt)}\n`;
                if (emotionEmoji) md += `**情绪**: ${emotionEmoji}\n`;
                if (tag) md += `**标签**: ${tag}\n`;
                md += `\n`;
                if (content) md += `${escapeHtml(content)}\n\n`;
            });
        });

        return md;
    }

    function generateJSONExport(diaries, options, startDate, endDate) {
        const exportData = {
            meta: {
                exportDate: new Date().toISOString(),
                dateRange: {
                    start: StatsService.formatDate(startDate),
                    end: StatsService.formatDate(endDate)
                },
                totalDiaries: diaries.length,
                options: options
            },
            diaries: diaries.map(diary => {
                const result = {
                    id: diary.id,
                    title: diary.title,
                    createdAt: diary.createdAt,
                    updatedAt: diary.updatedAt,
                    wordCount: diary.wordCount || 0
                };

                if (options.includeContent) {
                    result.content = diary.content;
                    result.editorMode = diary.editorMode;
                }

                if (options.includeEmotion && diary.sentiment) {
                    result.sentiment = diary.sentiment;
                    result.emotionEmoji = SentimentService.getEmotionEmoji(diary.sentiment);
                    result.emotionLabel = SentimentService.getEmotionLabel(diary.sentiment);
                }

                if (options.includeTags) {
                    result.tag = getDiaryTag(diary);
                    result.customTag = diary.customTag;
                }

                return result;
            })
        };

        return JSON.stringify(exportData, null, 2);
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    let onDiaryClick = null;
    let onDateClick = null;

    function setOnDiaryClick(callback) {
        onDiaryClick = callback;
    }

    function setOnDateClick(callback) {
        onDateClick = callback;
    }

    return {
        init,
        setDiaries,
        setView,
        setZoom,
        zoomIn,
        zoomOut,
        setCenterDate,
        goToToday,
        goToPrevPeriod,
        goToNextPeriod,
        getLongestStreak,
        getStreaksOfLength,
        calculateConsecutiveStreaks,
        setOnDiaryClick,
        setOnDateClick,
        render
    };
})();
