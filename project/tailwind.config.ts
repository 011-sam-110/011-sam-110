import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        // Self-hosted next/font face first; the bare 'Space Mono' literal was
        // removed because it never matched the hashed family and triggered a
        // runtime fonts.gstatic.com probe.
        mono: ['var(--font-mono)', 'monospace'],
      },
      colors: {
        deep:    '#1a0f35',
        mid:     '#341C67',
        surface: '#472F5B',
        lilac:   '#C4AEF4',
        mauve:   '#CCA4B4',
        citrine: '#DCCE40',
        ink:     '#EDE8F8',
        muted:   '#9B8FBE',
      },
      animation: {
        'gradient-x':  'gradient-x 4s ease infinite',
        'pulse-glow':  'pulse-glow 2.5s ease-in-out infinite',
        'blink':       'blink 1s step-end infinite',
        'spin-slow':   'spin 8s linear infinite',
        'bob':         'bob 1.8s ease-in-out infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%,100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
        'pulse-glow': {
          '0%,100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'blink': {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'bob': {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(6px)' },
        },
      },
      boxShadow: {
        'lilac':    '0 0 20px rgba(196,174,244,0.3)',
        'lilac-lg': '0 0 40px rgba(196,174,244,0.4), 0 0 80px rgba(196,174,244,0.15)',
        'citrine':  '0 0 20px rgba(220,206,64,0.3)',
      },
    },
  },
  plugins: [],
}

export default config
