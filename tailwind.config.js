/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary - dark text/buttons (ChatGPT style)
        primary: {
          DEFAULT: '#1a1a1a',
          light: '#333333',
          dark: '#000000',
        },
        // Background surfaces
        background: {
          DEFAULT: '#ffffff',
          surface: '#FAFBFC',
          hover: '#F5F5F5',
        },
        // Surface variants
        surface: {
          DEFAULT: '#F7F8F9',
          light: '#FAFBFC',
          card: '#ffffff',
          hover: '#F0F0F0',
        },
        // Text colors
        text: {
          DEFAULT: '#1a1a1a',
          secondary: '#666666',
          muted: '#999999',
          light: '#CCCCCC',
        },
        // Borders
        border: {
          DEFAULT: '#E8E8E8',
          light: '#F0F0F0',
          dark: '#D0D0D0',
        },
        // Pastel accents (ChatGPT tool colors)
        pastel: {
          green: '#E8F5E9',
          'green-dark': '#C8E6C9',
          blue: '#E3F2FD',
          'blue-dark': '#BBDEFB',
          orange: '#FFF3E0',
          'orange-dark': '#FFE0B2',
          purple: '#F3E5F5',
          'purple-dark': '#E1BEE7',
          cyan: '#E0F7FA',
          'cyan-dark': '#B2EBF2',
          peach: '#FBE9E7',
          'peach-dark': '#FFCCBC',
          pink: '#FCE4EC',
          'pink-dark': '#F8BBD9',
          yellow: '#FFFDE7',
          'yellow-dark': '#FFF9C4',
        },
        // Status colors
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        info: '#2196F3',
        // Admin theme (Editorial Beauty)
        admin: {
          cream: '#FAF9F7',
          'warm-white': '#FFFEFA',
          charcoal: '#2D2A26',
          'warm-gray': '#8A857D',
          'light-gray': '#E8E6E3',
          accent: '#B8A88A',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Instrument Serif', 'Georgia', 'Times New Roman', 'serif'],
        body: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'clean': '0 1px 3px rgba(0,0,0,0.06)',
        'soft': '0 2px 8px rgba(0,0,0,0.06)',
        'card': '0 4px 12px rgba(0,0,0,0.05)',
        'elevated': '0 8px 24px rgba(0,0,0,0.08)',
        'input': '0 1px 2px rgba(0,0,0,0.04)',
        'button': '0 2px 4px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing': 'typing 1.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        typing: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        bounceSoft: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-4px)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
