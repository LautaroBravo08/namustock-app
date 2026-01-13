import React, { useState } from 'react';
import { Plus, X, Mic, Image as ImageIcon } from 'lucide-react';

const FloatingActionMenu = ({ onAddProduct, onVoiceClick, onImageClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionClick = (callback) => {
    callback();
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50">
      {/* Botones flotantes secundarios */}
      <div className={`flex flex-col gap-3 mb-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Botón de Voz */}
        <button
          onClick={() => handleOptionClick(onVoiceClick)}
          className="bg-blue-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200"
          title="Agregar por Voz"
        >
          <Mic className="h-5 w-5" />
        </button>
        
        {/* Botón de Foto */}
        <button
          onClick={() => handleOptionClick(onImageClick)}
          className="bg-purple-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200"
          title="Agregar por Foto"
        >
          <ImageIcon className="h-5 w-5" />
        </button>
        
        {/* Botón de Agregar Manual */}
        <button
          onClick={() => handleOptionClick(onAddProduct)}
          className="bg-green-500 text-white w-12 h-12 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200"
          title="Agregar Producto Manual"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Botón principal */}
      <button
        onClick={toggleMenu}
        className={`bg-[var(--color-primary)] text-[var(--color-primary-text)] w-16 h-16 rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-all duration-200 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
      >
        {isOpen ? <X className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
      </button>
    </div>
  );
};

export default FloatingActionMenu;