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
        'red-card-default': ['0 4px 16px rgba(220, 68, 53, 0.5)'],
        'red-card-hover': ['0 4px 16px rgba(220, 68, 53, 0.75)'],
        'button-inner': 'inset 0 0.5px 4px rgba(212, 212, 212, 1)',
        'button-outer_default': [
          '0px 1.5px 3px 0px rgba(255, 255, 255, 0.5)',
          '0px 1.5px 3px 0px rgba(255, 255, 255, 0.5)',
          '0px 0.75px 2.25px 0px rgba(255, 255, 255, 0.7)', 
          '0px 0px 9px 0px rgba(255, 255, 255, 0.9)',
          '0px 6px 9px 0px rgba(253, 242, 133, 0.7)',
          '0px 5.25px 8.25px 0px rgba(252, 237, 81, 0.6)',
          '0px 4.5px 7.5px 0px rgba(156, 180, 0, 0.5)',
        ],
        'button-outer-hover_default': [
          '0px 3px 6px 0px rgba(255, 255, 255, 0.5)',
          '0px 2.25px 4.5px 0px rgba(255, 255, 255, 0.7)', 
          '0px 0.75px 1.5px 0px rgba(255, 255, 255, 0.9)',
          '0px 0px 18px 0px rgba(255, 255, 255, 0.8)',
          '0px 9px 18px 0px rgba(253, 242, 133, 0.7)',
          '0px 7.5px 15px 0px rgba(252, 237, 81, 0.6)',
          '0px 6px 12px 0px rgba(156, 180, 0, 0.5)',
        ],
        'button-outer-press_default': [
          'inset 0px 0.75px 3px 0px rgba(156, 180, 0, 1)',
          '0px 2.25px 4.5px 0px rgba(255, 255, 255, 0.7)',
          '0px 1.5px 3px 0px rgba(255, 255, 255, 0.8)',
          '0px 0.38px 0.75px 0px rgba(255, 255, 255, 1)',
          '0px 0px 9px 0px rgba(255, 255, 255, 1)',
          '0px 6px 12px 0px rgba(252, 237, 81, 1)',
          '0px 4.5px 9px 0px rgba(176, 165, 57, 1)',
          '0px 3px 6px 0px rgba(126, 119, 41, 1)',
        ],
        'button-outer_default-lg': [
          '0px 2px 4px 0px rgba(255, 255, 255, 0.5)',
          '0px 2px 4px 0px rgba(255, 255, 255, 0.5)',
          '0px 1px 3px 0px rgba(255, 255, 255, 0.7)',
          '0px 0px 12px 0px rgba(255, 255, 255, 0.9)',
          '0px 8px 12px 0px rgba(253, 242, 133, 0.7)',
          '0px 6px 10px 0px rgba(156, 180, 0, 0.5)',
          '0px 7px 11px 0px rgba(252, 237, 81, 0.6)',
        ],
        'button-outer-hover_default-lg': [
          '0px 4px 8px 0px rgba(255, 255, 255, 0.5)',
          '0px 3px 6px 0px rgba(255, 255, 255, 0.7)',
          '0px 1px 2px 0px rgba(255, 255, 255, 0.9)',
          '0px 0px 24px 0px rgba(255, 255, 255, 0.8)',
          '0px 12px 24px 0px rgba(252, 242, 133, 0.7)',
          '0px 8px 16px 0px rgba(252, 237, 81, 0.6)',
          '0px 10px 20px 0px rgba(156, 180, 0, 0.5)',
        ],
        'button-outer-press_default-lg': [
          'inset 0 1px 4px 0 rgba(156, 180, 0, 1)',
          '0px 3px 6px 0px rgba(255, 255, 255, 0.7)',
          '0px 2px 4px 0px rgba(255, 255, 255, 0.8)',
          '0px 0.5px 1px 0px rgba(255, 255, 255, 1.0)',
          '0px 0px 12px 0px rgba(255, 255, 255, 1.0)',
          '0px 8px 16px 0px rgba(252, 237, 81, 1.0)',
          '0px 6px 12px 0px rgba(176, 165, 57, 1.0)',
          '0px 4px 8px 0px rgba(126, 119, 41, 1.0)',
        ],
      }
    }
  },
  plugins: []
};

export default config;