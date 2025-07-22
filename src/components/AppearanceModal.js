import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import ThemeSwitcher from './ThemeSwitcher';
import CardStyleSwitcher from './CardStyleSwitcher';

const AppearanceModal = ({ 
  isOpen, 
  onClose, 
  theme, 
  setTheme, 
  themeType, 
  glowIntensity, 
  setGlowIntensity, 
  shadowIntensity, 
  setShadowIntensity, 
  cardStyle, 
  setCardStyle 
}) => {
  const [showContent, setShowContent] = useState(false);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen && !showContent) return null;

  return (
    <div 
      className={`fixed inset-0 bg-black z-[60] flex justify-center items-center p-4 transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-sm border border-[var(--color-border)] transform transition-all duration-300 ease-out ${
          showContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Apariencia</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 flex flex-col items-center gap-6 max-h-[80vh] overflow-y-auto">
          <div className="w-full flex flex-col items-center">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Tema</h3>
            <ThemeSwitcher 
              theme={theme}
              setTheme={setTheme}
              glowIntensity={glowIntensity}
              setGlowIntensity={setGlowIntensity}
              themeType={themeType}
              shadowIntensity={shadowIntensity}
              setShadowIntensity={setShadowIntensity}
            />
          </div>
          
          <hr className="w-full border-[var(--color-border)]"/>
          
          <div className="w-full flex flex-col items-center">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-3">Diseño de Tarjeta</h3>
            <CardStyleSwitcher cardStyle={cardStyle} setCardStyle={setCardStyle} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceModal;