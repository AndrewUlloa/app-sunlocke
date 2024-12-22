import type { Config } from "tailwindcss";

const config: Config = {
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
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
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			blobMove1: {
  				'0%': { transform: 'translate(0px, 0px) scale(1)' },
  				'33%': { transform: 'translate(30px, -50px) scale(1.1)' },
  				'66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
  				'100%': { transform: 'translate(0px, 0px) scale(1)' }
  			},
  			blobMove2: {
  				'0%': { transform: 'translate(0px, 0px) scale(1)' },
  				'33%': { transform: 'translate(-50px, 20px) scale(1.1)' },
  				'66%': { transform: 'translate(20px, -30px) scale(0.9)' },
  				'100%': { transform: 'translate(0px, 0px) scale(1)' }
  			},
  			blobMove3: {
  				'0%': { transform: 'translate(0px, 0px) scale(1)' },
  				'33%': { transform: 'translate(20px, 20px) scale(1.1)' },
  				'66%': { transform: 'translate(-20px, -30px) scale(0.9)' },
  				'100%': { transform: 'translate(0px, 0px) scale(1)' }
  			},
        backgroundFade: {
          '0%, 100%': { backgroundColor: '#f8f8ff' },  // Start/end color
          '50%': { backgroundColor: '#f0f0ff' },       // Middle color
        },
  		},
  		animation: {
  			'blobMove1': 'blobMove1 25s infinite',
  			'blobMove2': 'blobMove2 30s infinite',
  			'blobMove3': 'blobMove3 35s infinite',
        'background-fade': 'backgroundFade 15s ease infinite',
  		},
      zIndex: {
        'far-behind': '-2',
        'behind': '-1',
      }
  	}
  },
  plugins: [],
};
export default config;