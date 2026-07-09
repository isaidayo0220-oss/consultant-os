import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Consultant OS',
  description: '毎日の行動を成果につなげるAIアシスタント',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-sans">
        <div className="mx-auto max-w-3xl px-5 py-8 md:py-12">{children}</div>
      </body>
    </html>
  );
}
