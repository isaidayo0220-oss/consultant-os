import type { Config } from 'tailwindcss';

// デザイントークン：
// - bg / surface / ink はグレースケール（Apple/Linear系の余白重視トーンを継承）
// - accent は 1色だけに絞ったディープティール（このアプリ全体で"押す/重要"を示す唯一の色）
// - mono は数値・優先度・タイムスタンプなど「データ」専用（Wire Deskの端末的な精度感を継承）
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#FAFAF9',
          dark: '#0F1110',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#181A19',
        },
        ink: {
          DEFAULT: '#171B1A',
          dim: '#6B7280',
          dark: '#EDEFEE',
          'dark-dim': '#8B938F',
        },
        border: {
          DEFAULT: '#E6E4E1',
          dark: '#262A28',
        },
        accent: {
          DEFAULT: '#0D9488',
          soft: '#CCFBF1',
          dark: '#2DD4BF',
        },
        urgent: '#DC5B4B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        card: '14px',
      },
    },
  },
  plugins: [],
};
export default config;
