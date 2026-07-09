export function Card({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-border bg-surface p-5 dark:border-border-dark dark:bg-surface-dark ${className}`}
    >
      {children}
    </div>
  );
}
