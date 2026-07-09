'use client';

// 重要度(importance)と緊急度(urgency)、それぞれ1-5の値を受け取り、
// 2x2マトリクス上の位置にドットを打つ。象限ラベルも表示する。
export function TaskMatrix({
  importance,
  urgency,
}: {
  importance: number | null;
  urgency: number | null;
}) {
  const hasValue = importance != null && urgency != null;

  // 1-5 のスケールを 0-100% の座標に変換（5=右/上, 1=左/下）
  const x = hasValue ? ((importance! - 1) / 4) * 100 : 50;
  const y = hasValue ? 100 - ((urgency! - 1) / 4) * 100 : 50;

  const quadLabels = [
    { key: 'schedule', label: '計画する', pos: 'top-2 left-2' },
    { key: 'do_now', label: '今すぐやる', pos: 'top-2 right-2' },
    { key: 'eliminate', label: 'やめる', pos: 'bottom-2 left-2' },
    { key: 'delegate', label: '任せる', pos: 'bottom-2 right-2' },
  ];

  return (
    <div className="relative aspect-square w-full max-w-xs rounded-card border border-border bg-bg dark:border-border-dark dark:bg-bg-dark">
      {/* 十字の軸線 */}
      <div className="absolute left-1/2 top-0 h-full w-px bg-border dark:bg-border-dark" />
      <div className="absolute top-1/2 left-0 h-px w-full bg-border dark:bg-border-dark" />

      {quadLabels.map((q) => (
        <span
          key={q.key}
          className={`absolute ${q.pos} font-mono text-[10px] uppercase tracking-wide text-ink-dim dark:text-ink-dark-dim`}
        >
          {q.label}
        </span>
      ))}

      {hasValue && (
        <div
          className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_4px_theme(colors.accent.soft)] transition-all duration-500 dark:shadow-[0_0_0_4px_rgba(45,212,191,0.25)]"
          style={{ left: `${x}%`, top: `${y}%` }}
        />
      )}

      <span className="absolute bottom-1 right-1/2 translate-y-4 font-mono text-[10px] text-ink-dim dark:text-ink-dark-dim">
        重要度 →
      </span>
    </div>
  );
}
