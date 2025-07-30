import { useState, useEffect } from 'react';

export const useVirtualKeyboard = () => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const initialHeight = window.innerHeight;
    let timeoutId;
    let focusTimeoutId;

    const handleResize = () => {
      // Limpiar timeout anterior
      clearTimeout(timeoutId);
      
      // Esperar un poco para que el viewport se estabilice
      timeoutId = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialHeight - currentHeight;
        
        // Ajustar threshold según el dispositivo
        const isMobile = window.innerWidth <= 768;
        const keyboardThreshold = isMobile ? 120 : 150;
        const keyboardOpen = heightDifference > keyboardThreshold;
        
        setViewportHeight(currentHeight);
        setIsKeyboardOpen(keyboardOpen);
        
        // Debug info solo en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.log('📱 Viewport change:', {
            initialHeight,
            currentHeight,
            heightDifference,
            keyboardOpen,
            isMobile
          });
        }
      }, 80);
    };

    const handleFocusIn = (e) => {
      // Detectar cuando se enfoca un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        clearTimeout(focusTimeoutId);
        
        // Marcar inmediatamente que probablemente el teclado se abrirá
        setIsKeyboardOpen(true);
        
        // Verificar después de que el teclado tenga tiempo de aparecer
        focusTimeoutId = setTimeout(() => {
          handleResize();
        }, 250);
      }
    };

    const handleFocusOut = (e) => {
      // Detectar cuando se desenfoca un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        clearTimeout(focusTimeoutId);
        
        // Dar tiempo para que el teclado desaparezca
        focusTimeoutId = setTimeout(() => {
          // Verificar si no hay otro input enfocado
          const activeElement = document.activeElement;
          const isInputFocused = activeElement && (
            activeElement.tagName === 'INPUT' || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.contentEditable === 'true'
          );
          
          if (!isInputFocused) {
            setIsKeyboardOpen(false);
            handleResize();
          }
        }, 250);
      }
    };

    // Listeners para cambios de viewport
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // Listeners para eventos de focus (más confiables en móviles)
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Visual Viewport API (más precisa si está disponible)
    if (window.visualViewport) {
      const handleVisualViewportChange = () => {
        const visualHeight = window.visualViewport.height;
        const windowHeight = window.innerHeight;
        const heightDifference = windowHeight - visualHeight;
        
        // Threshold más sensible para Visual Viewport
        const keyboardOpen = heightDifference > 30;
        
        setViewportHeight(visualHeight);
        setIsKeyboardOpen(keyboardOpen);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('👁️ Visual viewport change:', {
            windowHeight,
            visualHeight,
            heightDifference,
            keyboardOpen
          });
        }
      };

      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        clearTimeout(timeoutId);
        clearTimeout(focusTimeoutId);
      };
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      clearTimeout(timeoutId);
      clearTimeout(focusTimeoutId);
    };
  }, []);

  return {
    isKeyboardOpen,
    viewportHeight
  };
};