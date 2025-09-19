import type { Config } from "tailwindcss";

/**
 * Tailwind CSS Configuration
 * 
 * This configuration centralizes all theme colors for the mini app.
 * To change the app's color scheme, simply update the 'primary' color value below.
 * 
 * Example theme changes:
 * - Blue theme: primary: "#3182CE"
 * - Green theme: primary: "#059669" 
 * - Red theme: primary: "#DC2626"
 * - Orange theme: primary: "#EA580C"
 */
export default {
    darkMode: "media",
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			// Modern brand color scheme inspired by Base blockchain
  			primary: {
  				50: '#eef4ff',
  				100: '#dfe8ff',
  				200: '#c6d5ff',
  				300: '#a4b8ff',
  				400: '#8192ff',
  				500: '#6366f1',
  				600: '#5145e6',
  				700: '#4338ca',
  				800: '#362fa3',
  				900: '#312e81',
  			},

  			// Base-inspired gradient colors
  			accent: {
  				50: '#f0f9ff',
  				100: '#e0f2fe',
  				200: '#bae6fd',
  				300: '#7dd3fc',
  				400: '#38bdf8',
  				500: '#0ea5e9',
  				600: '#0284c7',
  				700: '#0369a1',
  				800: '#075985',
  				900: '#0c4a6e',
  			},

  			// Modern neutral colors
  			neutral: {
  				0: '#ffffff',
  				50: '#f9fafb',
  				100: '#f3f4f6',
  				200: '#e5e7eb',
  				300: '#d1d5db',
  				400: '#9ca3af',
  				500: '#6b7280',
  				600: '#4b5563',
  				700: '#374151',
  				800: '#1f2937',
  				900: '#111827',
  				950: '#030712',
  			},

  			// Success, warning, error colors
  			success: {
  				50: '#f0fdf4',
  				500: '#22c55e',
  				600: '#16a34a',
  			},
  			warning: {
  				50: '#fffbeb',
  				500: '#f59e0b',
  				600: '#d97706',
  			},
  			error: {
  				50: '#fef2f2',
  				500: '#ef4444',
  				600: '#dc2626',
  			},

  			// Legacy aliases for backward compatibility
  			"primary-light": "#a4b8ff",
  			"primary-dark": "#4338ca",
  			secondary: "#f9fafb",
  			"secondary-dark": "#374151",
  			background: 'var(--background)',
  			foreground: 'var(--foreground)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		// Custom spacing for consistent layout
  		spacing: {
  			'18': '4.5rem',
  			'88': '22rem',
  		},
  		// Custom container sizes
  		maxWidth: {
  			'xs': '20rem',
  			'sm': '24rem',
  			'md': '28rem',
  			'lg': '32rem',
  			'xl': '36rem',
  			'2xl': '42rem',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
