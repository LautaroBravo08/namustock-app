import React from 'react';
import { ArrowLeft, ArrowRight, Zap, Droplet } from 'lucide-react';
import { themes } from '../data/themes';

const ThemeSwitcher = ({ 
  theme, 
  setTheme, 
  glowIntensity, 
  setGlowIntensity, 
  themeType, 
  shadowIntensity, 
  setShadowIntensity 
}) => {
  const themeKeys = Object.keys(themes);
  const currentTheme = themes[theme];

  const handleThemeChange = (direction) => {
    const currentThemeIndex = themeKeys.indexOf(theme);
    let nextThemeIndex;
    
    if (direction === 'next') {
      nextThemeIndex = (currentThemeIndex + 1) % themeKeys.length;
    } else {
      nextThemeIndex = (currentThemeIndex - 1 + themeKeys.length) % themeKeys.length;
    }
    
    setTheme(themeKeys[nextThemeIndex]);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-2">
        <button 
          onClick={() => handleThemeChange('prev')} 
          className="p-2 rounded-md bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <ArrowLeft className="h-5 w-5"/>
        </button>
        <span className="text-center font-semibold w-40">{currentTheme.name}</span>
        <button 
          onClick={() => handleThemeChange('next')} 
          className="p-2 rounded-md bg-[var(--color-bg)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
        >
          <ArrowRight className="h-5 w-5"/>
        </button>
      </div>
      
      {themeType === 'dark' ? (
        <div className="w-full flex items-center gap-2" title="Intensidad de Brillo">
          <Zap className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <input
            type="range"
            min="0.1"
            max="1"
            step="0.05"
            value={glowIntensity}
            onChange={(e) => setGlowIntensity(parseFloat(e.target.value))}
            className="w-full h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer"
          />
        </div>
      ) : (
        <div className="w-full flex items-center gap-2" title="Intensidad de Sombra">
          <Droplet className="h-4 w-4 text-[var(--color-text-secondary)]" />
          <input 
            type="range" 
            min="0.05" 
            max="0.4" 
            step="0.01" 
            value={shadowIntensity} 
            onChange={(e) => setShadowIntensity(parseFloat(e.target.value))} 
            className="w-full h-1 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer" 
          />
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;