import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

const InstantSearch = ({ 
  searchTerm, 
  setSearchTerm, 
  placeholder = "Buscar productos...",
  themeType = 'light',
  autoFocus = true,
  debounceMs = 300
}) => {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Auto-focus en el input al cargar
  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      // Pequeño delay para asegurar que el DOM esté listo
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [autoFocus]);

  // Debounce para la búsqueda
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      setSearchTerm(localSearchTerm);
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [localSearchTerm, setSearchTerm, debounceMs]);

  const handleClear = () => {
    setLocalSearchTerm('');
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)] w-5 h-5" />
        
        <input
          ref={searchInputRef}
          type="text"
          value={localSearchTerm}
          onChange={(e) => setLocalSearchTerm(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="
            w-full pl-10 pr-10 py-3 
            bg-[var(--color-card)] 
            border border-[var(--color-border)] 
            rounded-lg 
            text-[var(--color-text-primary)] 
            placeholder-[var(--color-text-secondary)]
            focus:outline-none 
            focus:ring-2 
            focus:ring-[var(--color-primary)] 
            focus:border-transparent
            transition-all duration-200
            shadow-sm
          "
        />
        
        {localSearchTerm && (
          <button
            onClick={handleClear}
            className="
              absolute right-3 top-1/2 transform -translate-y-1/2 
              text-[var(--color-text-secondary)] 
              hover:text-[var(--color-text-primary)]
              transition-colors duration-200
              p-1 rounded-full
              hover:bg-[var(--color-bg-secondary)]
            "
            title="Limpiar búsqueda"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Indicador de búsqueda activa */}
      {localSearchTerm && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary)] rounded-full opacity-50"></div>
      )}
    </div>
  );
};

export default InstantSearch;