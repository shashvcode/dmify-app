/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
        'space': ['Space Grotesk', 'sans-serif'],
        'satoshi': ['Satoshi', 'sans-serif'],
      },
      colors: {
        'off-white': '#FDFDFE',
        'gradient-start': '#F7F8FA',
        'primary-text': '#0F0F0F',
        'secondary-text': '#6C6C6C',
        'electric-blue': '#3B82F6',
        'neon-purple': '#8B5CF6',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FDFDFE 0%, #F7F8FA 100%)',
        'accent-gradient': 'linear-gradient(90deg, #3B82F6, #8B5CF6)',
        'cta-gradient': 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      backdropBlur: {
        'glass': '8px',
      },
      borderRadius: {
        '16': '16px',
        '20': '20px',
        '24': '24px',
      },
      spacing: {
        '18': '72px',
        '24': '96px',
      },
      animation: {
        'fade-up': 'fadeUp 0.8s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'counter': 'counter 2s ease-out',
        'draw-line': 'drawLine 0.6s ease-out',
        'pop-in': 'popIn 0.4s ease-out',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'node-glow': 'nodeGlow 2s ease-in-out infinite alternate',
        'count-up': 'countUp 1s ease-out',
        'pulse-glow': 'pulseGlow 1.5s ease-in-out',
      },
      scale: {
        '101': '1.01',
        '102': '1.02',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' },
        },
        counter: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        drawLine: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 30px rgba(139, 92, 246, 0.4)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)' },
        },
        nodeGlow: {
          '0%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.5)' },
        },
        countUp: {
          '0%': { transform: 'scale(0.9)', opacity: '0.8' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

