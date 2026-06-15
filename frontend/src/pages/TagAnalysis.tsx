import { Tag } from 'antd';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useEffect, useMemo, useState } from 'react';
import { EmptyState } from '../components/common/EmptyState';
import { MoodCard } from '../components/common/MoodCard';
import { MoodTagChart } from '../components/common/MoodTagChart';
import { MOOD_TAG_LABELS, MoodTag } from '../constants/mood';
import { useAuth } from '../hooks/useAuth';
import { useMoodStore } from '../stores/moodStore';
import type { WeeklyTagStats } from '../types';
import { MOOD_TAG_COLORS } from '../utils/moodColor';
import * as moodApi from '../api/mood';

dayjs.extend(isoWeek);

export function TagAnalysis() {
  const { token } = useAuth();
  const { moods, loadMoods } = useMoodStore();
  const [weeklyStats, setWeeklyStats] = useState<WeeklyTagStats[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<MoodTag | null>(null);

  useEffect(() => {
    if (!token) return;
    loadMoods();
    moodApi.getWeeklyTagStats().then(setWeeklyStats).catch(() => setWeeklyStats([]));
  }, [token, loadMoods]);

  const filteredMoods = useMemo(() => {
    if (!selectedWeek && !selectedTag) return moods;
    return moods.filter((mood) => {
      const moodWeek = dayjs(mood.record_date).isoWeekday(1).format('YYYY-MM-DD');
      const weekMatch = !selectedWeek || moodWeek === selectedWeek;
      const tagMatch = !selectedTag || mood.mood_tags.includes(selectedTag);
      return weekMatch && tagMatch;
    });
  }, [moods, selectedWeek, selectedTag]);

  const handleTagClick = (weekStart: string, tag: string) => {
    if (selectedWeek === weekStart && selectedTag === tag) {
      setSelectedWeek(null);
      setSelectedTag(null);
    } else {
      setSelectedWeek(weekStart);
      setSelectedTag(tag as MoodTag);
    }
  };

  const handleFilterClear = () => {
    setSelectedWeek(null);
    setSelectedTag(null);
  };

  const currentWeekStats = weeklyStats.find((w) => w.week_start === selectedWeek);

  return (
    <main className="page">
      <h1 className="page-title">情绪标签分析</h1>
      <p className="page-kicker">按周查看最频繁的情绪标签及其出现天数，点击柱状图中的标签可筛选对应记录。</p>

      <section className="grid two">
        <div className="panel">
          <h2>每周标签分布</h2>
          {weeklyStats.length ? (
            <MoodTagChart data={weeklyStats} onTagClick={handleTagClick} />
          ) : (
            <EmptyState title="暂无数据" description="记录情绪后这里会展示标签分布。" />
          )}
        </div>
        <div className="panel">
          <h2>标签筛选</h2>
          {selectedWeek || selectedTag ? (
            <div className="tag-filter-panel">
              <div className="tag-filter-active">
                <span>当前筛选：</span>
                {selectedWeek && (
                  <Tag color="blue">
                    周：{dayjs(selectedWeek).format('MM月DD日')} 起
                  </Tag>
                )}
                {selectedTag && (
                  <Tag color={MOOD_TAG_COLORS[selectedTag]}>
                    {MOOD_TAG_LABELS[selectedTag]}
                  </Tag>
                )}
                <a className="tag-filter-clear" onClick={handleFilterClear}>
                  清除筛选
                </a>
              </div>
              {currentWeekStats && (
                <div className="tag-filter-tags" style={{ marginTop: 12 }}>
                  <div className="muted" style={{ marginBottom: 6 }}>当周标签排行</div>
                  {currentWeekStats.tags.map((t) => (
                    <Tag
                      key={t.tag}
                      color={MOOD_TAG_COLORS[t.tag as keyof typeof MOOD_TAG_COLORS]}
                      style={{ cursor: 'pointer', opacity: selectedTag === t.tag ? 1 : 0.7 }}
                      onClick={() => setSelectedTag(t.tag as MoodTag)}
                    >
                      {MOOD_TAG_LABELS[t.tag as keyof typeof MOOD_TAG_LABELS]} · {t.days}天
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <EmptyState title="点击图表筛选" description="在左侧柱状图中点击某个标签，即可筛选该周的情绪记录。" />
          )}
        </div>
      </section>

      <section style={{ marginTop: 18 }} className="timeline-list">
        <div className="toolbar">
          <h2>情绪记录</h2>
          <span className="muted">共 {filteredMoods.length} 条</span>
        </div>
        {filteredMoods.length ? (
          filteredMoods.map((mood) => <MoodCard key={mood.id} mood={mood} />)
        ) : (
          <EmptyState title="无匹配记录" description="当前筛选条件下没有情绪记录，试试调整筛选条件。" />
        )}
      </section>
    </main>
  );
}
