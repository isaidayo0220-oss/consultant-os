'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'ダッシュボード' },
  { href: '/case', label: 'フェルミ推定' },
  { href: '/chat', label: 'AI壁打ち' },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-1 border-b border-border pb-3 dark:border-border-dark">
      {LINKS.map((l) => {
        const active = pathname === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-lg px-3 py-1.5 text-sm transition ${
              active
                ? 'bg-accent-soft font-medium text-accent dark:bg-accent/10 dark:text-accent-dark'
                : 'text-ink-dim hover:bg-border/40 dark:text-ink-dark-dim'
            }`}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
