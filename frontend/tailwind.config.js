/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        // Glassmorphism colors
        glass: {
          light: 'rgba(255, 255, 255, 0.1)',
          DEFAULT: 'rgba(255, 255, 255, 0.15)',
          medium: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(255, 255, 255, 0.25)',
        },
        'glass-border': {
          light: 'rgba(255, 255, 255, 0.1)',
          DEFAULT: 'rgba(255, 255, 255, 0.2)',
          dark: 'rgba(255, 255, 255, 0.3)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.12)',
        'glass-sm': '0 4px 16px 0 rgba(31, 38, 135, 0.08)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.15)',
        'glass-xl': '0 24px 64px 0 rgba(31, 38, 135, 0.2)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'glow-primary': '0 0 20px -5px hsl(var(--primary) / 0.4)',
        'glow-accent': '0 0 20px -5px hsl(var(--accent) / 0.4)',
        'glow-destructive': '0 0 20px -5px hsl(var(--destructive) / 0.4)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'glass-gradient-dark':
          'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
        'mesh-gradient':
          'radial-gradient(at 40% 20%, hsla(280, 80%, 70%, 0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 70%, 0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 85%, 70%, 0.1) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(220, 80%, 60%, 0.1) 0px, transparent 50%)',
        'mesh-gradient-dark':
          'radial-gradient(at 40% 20%, hsla(280, 80%, 50%, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189, 100%, 50%, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355, 85%, 50%, 0.08) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(220, 80%, 40%, 0.08) 0px, transparent 50%)',
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'pulse-soft': 'pulse-soft 3s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'slide-left': 'slide-left 0.3s ease-out',
        'slide-right': 'slide-right 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'fade-out': 'fade-out 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
        'scale-out': 'scale-out 0.2s ease-out',
        'blur-in': 'blur-in 0.4s ease-out',
        glow: 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-left': {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-right': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-out': {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'scale-out': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        'blur-in': {
          '0%': { backdropFilter: 'blur(0)', opacity: '0' },
          '100%': { backdropFilter: 'blur(16px)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px -5px hsl(var(--primary) / 0.3)' },
          '100%': { boxShadow: '0 0 30px -5px hsl(var(--primary) / 0.5)' },
        },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      transitionDuration: {
        400: '400ms',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    // Custom glassmorphism plugin
    function ({ addUtilities }) {
      addUtilities({
        '.glass': {
          backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.1))',
          backdropFilter: 'blur(var(--glass-blur, 16px))',
          '-webkit-backdrop-filter': 'blur(var(--glass-blur, 16px))',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.2))',
        },
        '.glass-sm': {
          backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.08))',
          backdropFilter: 'blur(8px)',
          '-webkit-backdrop-filter': 'blur(8px)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.15))',
        },
        '.glass-lg': {
          backgroundColor: 'var(--glass-bg, rgba(255, 255, 255, 0.15))',
          backdropFilter: 'blur(24px)',
          '-webkit-backdrop-filter': 'blur(24px)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.25))',
        },
        '.glass-dark': {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(16px)',
          '-webkit-backdrop-filter': 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-solid': {
          backgroundColor: 'var(--glass-bg-solid, rgba(255, 255, 255, 0.8))',
          backdropFilter: 'blur(20px)',
          '-webkit-backdrop-filter': 'blur(20px)',
          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
        },
      });
    },
  ],
};
