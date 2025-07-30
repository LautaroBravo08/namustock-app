import { useEffect } from 'react';

// Custom hook to lock body scroll when modals are open
export const useBodyScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      window.modalOpenCount = (window.modalOpenCount || 0) + 1;
    }
    
    if (window.modalOpenCount > 0) {
      document.body.classList.add('overflow-hidden');
    }
    
    return () => {
      if (isOpen) {
        window.modalOpenCount -= 1;
        if (window.modalOpenCount <= 0) {
          document.body.classList.remove('overflow-hidden');
          window.modalOpenCount = 0;
        }
      }
    };
  }, [isOpen]);
};