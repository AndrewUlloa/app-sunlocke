import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      letterSpacing: {
        DEFAULT: '0.125em'
      },
      fontFamily: {
        'tobiasLight': ['var(--font-tobias-light)'],
        'tobiasRegular': ['var(--font-tobias-regular)'],
        'tobiasMedium': ['var(--font-tobias-medium)'],
        'tobiasSemiBold': ['var(--font-tobias-semibold)'],
        'eudoxusSansRegular': ['var(--font-eudoxus-sans-regular)'],
        'eudoxusSansMedium': ['var(--font-eudoxus-sans-medium)'],
        'eudoxusSansBold': ['var(--font-eudoxus-sans-bold)'],
        'geistSans': ['var(--font-geist-sans)'],
        'geistMono': ['var(--font-geist-mono)'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)'
      },
      borderRadius: {
        lg: '40px',
        md: '20px',
        sm: '12px'
      },
      keyframes: {
        blobMove1: {
          '0%, 100%': { transform: 'translate(-10vw, -10vh) scale(0.9)' },
          '50%': { transform: 'translate(110vw, 110vh) scale(1.6)' }
        },
        blobMove2: {
          '0%, 100%': { transform: 'translate(110vw, -10vh) scale(1.6)' },
          '50%': { transform: 'translate(-10vw, 110vh) scale(0.9)' }
        },
        blobMove3: {
          '0%, 100%': { transform: 'translate(50vw, -10vh) scale(1.2)' },
          '50%': { transform: 'translate(50vw, 110vh) scale(1.4)' }
        },
        backgroundFade: {
          '0%': { backgroundColor: '#ce9cf4' },
          '20%': { backgroundColor: '#efc9e9' },
          '40%': { backgroundColor: '#faca97' },
          '60%': { backgroundColor: '#fae59f' },
          '80%': { backgroundColor: '#fae8ea' },
          '100%': { backgroundColor: '#ff808e' }
        }
      },
      animation: {
        'blobMove1': 'blobMove1 20s infinite alternate ease-in-out',
        'blobMove2': 'blobMove2 25s infinite alternate ease-in-out', 
        'blobMove3': 'blobMove3 30s infinite alternate ease-in-out',
        'background-fade': 'backgroundFade 14s infinite alternate ease-in-out'
      },
      zIndex: {
        'far-behind': '-2',
        'behind': '-1',
      },
      boxShadow: {
        'button-inner': '0 0.5px 4px rgba(212, 212, 212, 1)',
        'red-card-default': ['0 4px 16px rgba(220, 68, 53, 0.5)'],
        'red-card-hover': ['0 4px 16px rgba(220, 68, 53, 0.75)']
      }
    }
  },
  plugins: []
};

export default config;