import ReactECharts from 'echarts-for-react';
import { MOOD_TAG_LABELS } from '../../constants/mood';
import { THEME_ECHARTS_COLORS } from '../../constants/themes';
import { useTheme } from '../../hooks/useTheme';
import type { WeeklyTagStats } from '../../types';
import { MOOD_TAG_COLORS } from '../../utils/moodColor';

interface Props {
  data: WeeklyTagStats[];
  onTagClick?: (weekStart: string, tag: string) => void;
}

export function MoodTagChart({ data, onTagClick }: Props) {
  const { themeName } = useTheme();
  const colors = THEME_ECHARTS_COLORS[themeName];

  const weeks = data.map((w) => w.week_start);
  const allTags = [...new Set(data.flatMap((w) => w.tags.map((t) => t.tag)))];

  const series = allTags.map((tag) => ({
    name: MOOD_TAG_LABELS[tag as keyof typeof MOOD_TAG_LABELS] || tag,
    type: 'bar' as const,
    stack: 'tags',
    emphasis: { focus: 'series' as const },
    itemStyle: { color: MOOD_TAG_COLORS[tag as keyof typeof MOOD_TAG_COLORS] },
    data: data.map((w) => {
      const found = w.tags.find((t) => t.tag === tag);
      return found ? found.days : 0;
    }),
  }));

  const option = {
    color: colors,
    tooltip: { trigger: 'axis' as const },
    grid: { left: 28, right: 18, top: 30, bottom: 28 },
    xAxis: {
      type: 'category' as const,
      data: weeks,
      axisLine: { lineStyle: { color: 'var(--border)' } },
      axisLabel: { color: 'var(--muted)' },
    },
    yAxis: {
      type: 'value' as const,
      splitLine: { lineStyle: { color: 'rgba(120,120,120,.16)' } },
      axisLabel: { color: 'var(--muted)' },
    },
    series,
  };

  return (
    <ReactECharts
      option={option}
      style={{ height: 300 }}
      onEvents={{
        click: (params: { componentType?: string; seriesName?: string; name?: string }) => {
          if (params.componentType === 'series' && params.name && params.seriesName && onTagClick) {
            const tagKey = Object.entries(MOOD_TAG_LABELS).find(([, v]) => v === params.seriesName)?.[0] || params.seriesName;
            onTagClick(params.name, tagKey);
          }
        },
      }}
    />
  );
}
