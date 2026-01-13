// Theme definitions for the application

export const themes = {
  // Temas Claros
  'default-light': { 
    name: 'Claro Moderno', 
    type: 'light', 
    colors: { 
      '--color-bg': '#fafafa', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(255, 255, 255, 0.85)', 
      '--color-text-primary': '#1a1a1a', 
      '--color-text-secondary': '#666666', 
      '--color-border': '#e0e0e0', 
      '--color-primary': '#2563eb', 
      '--color-primary-hover': '#1d4ed8', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#2563eb', 
      '--color-gradient-end': '#7c3aed' 
    } 
  },
  'aurora-light': { 
    name: 'Aurora Boreal', 
    type: 'light', 
    colors: { 
      '--color-bg': '#f0f9ff', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(240, 249, 255, 0.9)', 
      '--color-text-primary': '#0c4a6e', 
      '--color-text-secondary': '#0369a1', 
      '--color-border': '#bae6fd', 
      '--color-primary': '#0ea5e9', 
      '--color-primary-hover': '#0284c7', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#0ea5e9', 
      '--color-gradient-end': '#06b6d4' 
    } 
  },
  'sunset-warm': { 
    name: 'Atardecer Cálido', 
    type: 'light', 
    colors: { 
      '--color-bg': '#fff7ed', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(255, 247, 237, 0.9)', 
      '--color-text-primary': '#9a3412', 
      '--color-text-secondary': '#c2410c', 
      '--color-border': '#fed7aa', 
      '--color-primary': '#ea580c', 
      '--color-primary-hover': '#dc2626', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#ea580c', 
      '--color-gradient-end': '#f59e0b' 
    } 
  },
  'forest-green': { 
    name: 'Bosque Esmeralda', 
    type: 'light', 
    colors: { 
      '--color-bg': '#f0fdf4', 
      '--color-bg-secondary': '#ffffff', 
      '--color-bg-navbar': 'rgba(240, 253, 244, 0.9)', 
      '--color-text-primary': '#14532d', 
      '--color-text-secondary': '#166534', 
      '--color-border': '#bbf7d0', 
      '--color-primary': '#16a34a', 
      '--color-primary-hover': '#15803d', 
      '--color-primary-text': '#ffffff', 
      '--color-gradient-start': '#16a34a', 
      '--color-gradient-end': '#22c55e' 
    } 
  },

  // Temas Oscuros
  'default-dark': { 
    name: 'Noche Profunda', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#0a0a0a', 
      '--color-bg-secondary': '#1a1a1a', 
      '--color-bg-navbar': 'rgba(26, 26, 26, 0.85)', 
      '--color-text-primary': '#ffffff', 
      '--color-text-secondary': '#a3a3a3', 
      '--color-border': '#404040', 
      '--color-primary': '#3b82f6', 
      '--color-primary-hover': '#2563eb', 
      '--color-primary-text': '#ffffff', 
      '--glow-color-rgb': '59, 130, 246', 
      '--color-gradient-start': '#3b82f6', 
      '--color-gradient-end': '#8b5cf6' 
    } 
  },
  'cyberpunk-neon': { 
    name: 'Cyberpunk Neón', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#000000', 
      '--color-bg-secondary': '#0d0d0d', 
      '--color-bg-navbar': 'rgba(13, 13, 13, 0.9)', 
      '--color-text-primary': '#00ff41', 
      '--color-text-secondary': '#00cc33', 
      '--color-border': '#ff0080', 
      '--color-primary': '#ff0080', 
      '--color-primary-hover': '#cc0066', 
      '--color-primary-text': '#000000', 
      '--glow-color-rgb': '255, 0, 128', 
      '--color-gradient-start': '#ff0080', 
      '--color-gradient-end': '#00ff41' 
    } 
  },
  'midnight-purple': { 
    name: 'Medianoche Púrpura', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#0f0a1a', 
      '--color-bg-secondary': '#1a0f2e', 
      '--color-bg-navbar': 'rgba(26, 15, 46, 0.9)', 
      '--color-text-primary': '#e9d5ff', 
      '--color-text-secondary': '#c4b5fd', 
      '--color-border': '#6b46c1', 
      '--color-primary': '#8b5cf6', 
      '--color-primary-hover': '#7c3aed', 
      '--color-primary-text': '#ffffff', 
      '--glow-color-rgb': '139, 92, 246', 
      '--color-gradient-start': '#8b5cf6', 
      '--color-gradient-end': '#a855f7' 
    } 
  },
  'ocean-depths': { 
    name: 'Profundidades Oceánicas', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#0c1821', 
      '--color-bg-secondary': '#1e3a5f', 
      '--color-bg-navbar': 'rgba(30, 58, 95, 0.9)', 
      '--color-text-primary': '#e0f2fe', 
      '--color-text-secondary': '#b3e5fc', 
      '--color-border': '#0891b2', 
      '--color-primary': '#06b6d4', 
      '--color-primary-hover': '#0891b2', 
      '--color-primary-text': '#ffffff', 
      '--glow-color-rgb': '6, 182, 212', 
      '--color-gradient-start': '#06b6d4', 
      '--color-gradient-end': '#0ea5e9' 
    } 
  },
  'volcanic-red': { 
    name: 'Volcán Ardiente', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#1a0a0a', 
      '--color-bg-secondary': '#2d1b1b', 
      '--color-bg-navbar': 'rgba(45, 27, 27, 0.9)', 
      '--color-text-primary': '#fecaca', 
      '--color-text-secondary': '#fca5a5', 
      '--color-border': '#dc2626', 
      '--color-primary': '#ef4444', 
      '--color-primary-hover': '#dc2626', 
      '--color-primary-text': '#ffffff', 
      '--glow-color-rgb': '239, 68, 68', 
      '--color-gradient-start': '#ef4444', 
      '--color-gradient-end': '#f97316' 
    } 
  },
  'matrix-green': { 
    name: 'Matrix Verde', 
    type: 'dark', 
    colors: { 
      '--color-bg': '#000000', 
      '--color-bg-secondary': '#001a00', 
      '--color-bg-navbar': 'rgba(0, 26, 0, 0.9)', 
      '--color-text-primary': '#00ff00', 
      '--color-text-secondary': '#00cc00', 
      '--color-border': '#008000', 
      '--color-primary': '#00ff00', 
      '--color-primary-hover': '#00cc00', 
      '--color-primary-text': '#000000', 
      '--glow-color-rgb': '0, 255, 0', 
      '--color-gradient-start': '#00ff00', 
      '--color-gradient-end': '#32cd32' 
    } 
  },
};

export const cardStyles = {
  'default': { name: 'Defecto' },
  'neon-flicker': { name: 'Neón Parpadeante' },
  'minimalist': { name: 'Minimalista' },
  'holographic': { name: 'Holográfico' },
  'retro': { name: 'Retro' },
};