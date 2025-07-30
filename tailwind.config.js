/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'gradient-x': 'gradient-x 3s ease infinite',
        'price-pop': 'price-pop 0.5s ease-out',
        'cart-item-in': 'cart-item-in 0.4s ease-out forwards',
        'card-change': 'card-change 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'slide-in-out': 'slide-in-out 3s ease-in-out forwards',
        'pulse-red': 'pulse-red 1.5s infinite',
        'pulse-orange': 'pulse-orange 1.5s infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        'price-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'cart-item-in': {
          'from': { opacity: '0', transform: 'translateX(-20px)' },
          'to': { opacity: '1', transform: 'translateX(0)' },
        },
        'card-change': {
          'from': { transform: 'scale(0.95) rotateY(-10deg)', opacity: '0' },
          'to': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
        'slide-in-out': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '15%': { transform: 'translateX(0)', opacity: '1' },
          '85%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
        'pulse-red': {
          '0%, 100%': { 
            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
            borderColor: 'rgba(239, 68, 68, 0.4)' 
          },
          '50%': { 
            backgroundColor: 'rgba(239, 68, 68, 0.2)', 
            borderColor: 'rgba(239, 68, 68, 0.8)' 
          },
        },
        'pulse-orange': {
          '0%, 100%': { 
            backgroundColor: 'rgba(249, 115, 22, 0.1)', 
            borderColor: 'rgba(249, 115, 22, 0.4)' 
          },
          '50%': { 
            backgroundColor: 'rgba(249, 115, 22, 0.2)', 
            borderColor: 'rgba(249, 115, 22, 0.8)' 
          },
        },
      },
    },
  },
  plugins: [],
  safelist: [
    // Grid classes for dynamic layouts
    'grid-cols-1', 'grid-cols-2', 'grid-cols-3', 'grid-cols-4', 'grid-cols-5', 
    'grid-cols-6', 'grid-cols-7', 'grid-cols-8', 'grid-cols-9', 'grid-cols-10', 
    'grid-cols-11', 'grid-cols-12',
    'sm:grid-cols-1', 'sm:grid-cols-2', 'sm:grid-cols-3', 'sm:grid-cols-4', 
    'sm:grid-cols-5', 'sm:grid-cols-6',
    'lg:grid-cols-1', 'lg:grid-cols-2', 'lg:grid-cols-3', 'lg:grid-cols-4', 
    'lg:grid-cols-5', 'lg:grid-cols-6', 'lg:grid-cols-7', 'lg:grid-cols-8',
    'xl:grid-cols-1', 'xl:grid-cols-2', 'xl:grid-cols-3', 'xl:grid-cols-4', 
    'xl:grid-cols-5', 'xl:grid-cols-6', 'xl:grid-cols-7', 'xl:grid-cols-8', 
    'xl:grid-cols-9', 'xl:grid-cols-10', 'xl:grid-cols-11', 'xl:grid-cols-12',
    // Animation classes
    'animate-pulse-red', 'animate-pulse-orange', 'animate-gradient-x',
    'animate-price-pop', 'animate-cart-item-in', 'animate-card-change',
    'animate-slide-in-out',
  ]
}