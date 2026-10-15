import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

/**
 * WeshBazar design tokens (master prompt §10–16).
 * Colors are stored as HSL channel triplets in globals.css so Tailwind opacity
 * modifiers (e.g. bg-primary/10) work. Prefer these semantic tokens over raw
 * hex anywhere in the app.
 */
const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem', // 16px mobile page padding (§16)
        md: '1.25rem', // 20px tablet
        lg: '1.5rem', // 24px desktop
      },
      screens: {
        // Constrained centered public container, ~1280px max (§13).
        DEFAULT: '1280px',
      },
    },
    screens: {
      xs: '360px',
      sm: '390px', // canonical mobile reference (§13)
      md: '430px',
      lg: '768px',
      xl: '1024px',
      '2xl': '1280px',
      '3xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border) / <alpha-value>)',
        input: 'hsl(var(--input) / <alpha-value>)',
        ring: 'hsl(var(--ring) / <alpha-value>)',
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          dark: 'hsl(var(--primary-dark) / <alpha-value>)',
          soft: 'hsl(var(--primary-soft) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          dark: 'hsl(var(--accent-dark) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        success: 'hsl(var(--success) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        warning: 'hsl(var(--warning) / <alpha-value>)',
        info: 'hsl(var(--info) / <alpha-value>)',
      },
      borderRadius: {
        // §11 radii: controls 8–10, cards 12, grouped surfaces/dialogs 16.
        control: '8px',
        card: '12px',
        surface: '16px',
      },
      fontSize: {
        // §12 type scale (size/line-height).
        caption: ['12px', { lineHeight: '18px' }],
        meta: ['13px', { lineHeight: '20px' }],
        ui: ['14px', { lineHeight: '20px' }],
        body: ['16px', { lineHeight: '24px' }],
        'card-title': ['18px', { lineHeight: '26px' }],
        section: ['20px', { lineHeight: '28px' }],
        heading: ['24px', { lineHeight: '32px' }],
        'display-mobile': ['28px', { lineHeight: '36px' }],
        display: ['32px', { lineHeight: '40px' }],
      },
      spacing: {
        // §16 density + §14 touch baselines.
        'page-x': '1rem',
        'section-y': '1.75rem', // 28px typical section gap
        'card-gap': '0.75rem', // 12px
        touch: '2.75rem', // 44px minimum hit area
        control: '2.75rem', // 44px
        'control-lg': '3rem', // 48px major mobile control
        header: '3.5rem', // 56px app header
        'bottom-nav': '4rem', // 64px mobile bottom navigation (§103)
      },
      boxShadow: {
        // Layered, brand-tinted depth (teal/green-tinted neutrals) — softer and
        // more intentional than Tailwind's default drop shadows.
        soft: '0 1px 2px hsl(var(--foreground) / 0.04), 0 4px 12px hsl(var(--foreground) / 0.05)',
        card: '0 1px 3px hsl(var(--foreground) / 0.05), 0 8px 24px hsl(var(--foreground) / 0.06)',
        lift: '0 2px 6px hsl(var(--foreground) / 0.06), 0 18px 44px hsl(var(--foreground) / 0.10)',
        glow: '0 0 0 1px hsl(var(--primary) / 0.10), 0 10px 28px hsl(var(--primary) / 0.18)',
      },
      zIndex: {
        header: '40',
        drawer: '50',
        modal: '60',
        toast: '70',
      },
      transitionDuration: {
        // §15 motion durations (+ medium for image/lift zooms).
        micro: '120ms',
        small: '160ms',
        medium: '300ms',
        dialog: '200ms',
      },
      fontFamily: {
        sans: ['var(--font-vazirmatn)', 'Vazirmatn', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 200ms ease-out',
        'accordion-up': 'accordion-up 200ms ease-out',
        'fade-up': 'fade-up 500ms ease-out both',
        'fade-in': 'fade-in 400ms ease-out both',
      },
    },
  },
  plugins: [animate],
};

export default config;
