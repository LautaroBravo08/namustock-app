// Theme definitions for the application

export const themes = {
  'default-light': { 
    name: 'Claro (Defecto)', 
    type: 'light', 
    colors: { 
      '--color-bg': '#f9fafb', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(255, 255, 255, 0.7)', 
      '--color-text-primary': '#111827', 
      '--color-text-secondary': '#6b7280', 
      '--color-border': '#e5e7eb', 
      '--color-primary': '#4f46e5', 
      '--color-primary-hover': '#4338ca', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#4f46e5', 
      '--color-gradient-end': '#a855f7' 
    } 
  },
  'solarized-light': { 
    name: 'Solarizado Claro', 
    type: 'light', 
    colors: { 
      '--color-bg': '#fdf6e3', 
      '--color-bg-secondary': '#eee8d5', 
      '--color-bg-navbar': 'rgba(249, 246, 227, 0.7)', 
      '--color-text-primary': '#073642', 
      '--color-text-secondary': '#586e75', 
      '--color-border': '#93a1a1', 
      '--color-primary': '#268bd2', 
      '--color-primary-hover': '#1a6b9e', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#268bd2', 
      '--color-gradient-end': '#2aa198' 
    } 
  },
  'minty-fresh': { 
    name: 'Menta Fresca', 
    type: 'light', 
    colors: { 
      '--color-bg': '#f1f8f5', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(255, 255, 255, 0.7)', 
      '--color-text-primary': '#022c22', 
      '--color-text-secondary': '#3d5245', 
      '--color-border': '#d1e0d9', 
      '--color-primary': '#00796b', 
      '--color-primary-hover': '#004d40', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#00796b', 
      '--color-gradient-end': '#80cbc4' 
    } 
  },
  'default-dark': { 
    name: 'Noche (Oscuro)', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#111827', 
      '--color-bg-secondary': '#1f2937', 
      '--color-bg-navbar': 'rgba(31, 41, 55, 0.7)', 
      '--color-text-primary': '#f9fafb', 
      '--color-text-secondary': '#9ca3af', 
      '--color-border': '#374151', 
      '--color-primary': '#6366f1', 
      '--color-primary-hover': '#4f46e5', 
      '--color-primary-text': '#ffffff', 
      '--glow-color-rgb': '99, 102, 241', 
      '--color-gradient-start': '#6366f1', 
      '--color-gradient-end': '#818cf8' 
    } 
  },
  'midnight-dusk': { 
    name: 'Ocaso', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#0f172a', 
      '--color-bg-secondary': '#1e293b', 
      '--color-bg-navbar': 'rgba(30, 41, 59, 0.7)', 
      '--color-text-primary': '#e2e8f0', 
      '--color-text-secondary': '#94a3b8', 
      '--color-border': '#334155', 
      '--color-primary': '#22d3ee', 
      '--color-primary-hover': '#06b6d4', 
      '--color-primary-text': '#0f172a', 
      '--glow-color-rgb': '34, 211, 238', 
      '--color-gradient-start': '#22d3ee', 
      '--color-gradient-end': '#67e8f9' 
    } 
  },
  'cyberpunk': { 
    name: 'Cyberpunk', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#000000', 
      '--color-bg-secondary': '#1a001a', 
      '--color-bg-navbar': 'rgba(26, 0, 26, 0.7)', 
      '--color-text-primary': '#f0f0f0', 
      '--color-text-secondary': '#a0a0a0', 
      '--color-border': '#ff00ff', 
      '--color-primary': '#00f0ff', 
      '--color-primary-hover': '#00b8c7', 
      '--color-primary-text': '#000000', 
      '--glow-color-rgb': '0, 240, 255', 
      '--color-gradient-start': '#00f0ff', 
      '--color-gradient-end': '#ff00ff' 
    } 
  },
};

export const cardStyles = {
  'default': { name: 'Defecto' },
  'flip-3d': { name: 'Flip 3D' },
  'crystal-3d': { name: 'Cristal 3D' },
  'lava-lamp': { name: 'Lava Ardiente' },
  'laser-beam': { name: 'Rayo Láser' },
  'neon-flicker': { name: 'Neón Parpadeante' },
  'comic-book': { name: 'Libro de Cómics' },
  'spotlight-hover': { name: 'Foco de Luz' },
  'accordion-info': { name: 'Acordeón' },
};