/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        royal: {
          obsidian: '#08070b',
          velvet: '#0f0c18',
          plum: '#1a1129',
          ember: '#1f1430',
        },
        gold: {
          50: '#fff7e0',
          100: '#ffeab0',
          200: '#ffd76a',
          300: '#f4c542',
          400: '#e0a92a',
          500: '#b88720',
          900: '#6a4d10',
        },
        neon: {
          violet: '#8b5cf6',
          magenta: '#d946ef',
          cyan: '#22d3ee',
        },
        nigeria: {
          green: '#008751',
          white: '#ffffff',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        gold: '0 0 40px -10px rgba(244,197,66,0.5)',
        neon: '0 0 60px -10px rgba(139,92,246,0.6)',
      },
      backgroundImage: {
        'royal-radial': 'radial-gradient(ellipse at top, #1a1129 0%, #08070b 60%)',
      },
      animation: {
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 6s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(244,197,66,0.3)' },
          '50%': { boxShadow: '0 0 50px rgba(244,197,66,0.7)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
