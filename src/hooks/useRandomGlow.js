import { useState, useEffect, useMemo } from 'react';

// Custom hook for delayed glow effect
export const useRandomGlow = (isDark) => {
  const [isGlowActive, setIsGlowActive] = useState(false);
  const animationDelay = useMemo(() => `${Math.random() * 20}s`, []);

  useEffect(() => {
    let timer;
    if (isDark) {
      setIsGlowActive(false);
      const turnOnDelay = 1000 + Math.random() * 9000;
      timer = setTimeout(() => {
        setIsGlowActive(true);
      }, turnOnDelay);
    } else {
      setIsGlowActive(false);
    }
    return () => clearTimeout(timer);
  }, [isDark]);

  return { isGlowActive, animationDelay };
};