import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import NotificationSettings from './NotificationSettings';

const SettingsModal = ({ 
  isOpen, 
  onClose, 
  profitMargin, 
  setProfitMargin, 
  roundingMultiple, 
  setRoundingMultiple, 
  allowDecimals, 
  setAllowDecimals,
  products 
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
        className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--color-border)] transform transition-all duration-300 ease-out ${
          showContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Configuraciones</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          {/* Sección de Notificaciones */}
          <NotificationSettings products={products} />
          
          {/* Sección de Precios */}
          <div className="border-t border-[var(--color-border)] pt-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Ajustes de Precios</h3>
            <div className="space-y-6">
          <div>
            <label htmlFor="profit-margin" className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Margen de Ganancia (%)
            </label>
            <input 
              type="number" 
              id="profit-margin"
              value={profitMargin}
              onChange={(e) => setProfitMargin(Number(e.target.value))}
              className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] p-2"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Porcentaje añadido al costo para calcular el precio de venta.
            </p>
          </div>

          <div>
            <label htmlFor="rounding-multiple" className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Redondeo de Precios
            </label>
            <input 
              type="number" 
              id="rounding-multiple"
              value={roundingMultiple}
              onChange={(e) => setRoundingMultiple(Number(e.target.value))}
              step="50"
              className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] p-2"
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Redondear precios hacia arriba al múltiplo más cercano (ej: 50, 100).
            </p>
          </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Formato de Números
                </label>
                <button 
                  onClick={() => setAllowDecimals(!allowDecimals)}
                  className={`mt-1 w-full py-2 px-4 rounded-lg font-semibold transition-colors ${
                    allowDecimals ? 'bg-green-600 text-white' : 'bg-gray-400 text-white'
                  }`}
                >
                  {allowDecimals ? 'Decimales Activados' : 'Decimales Desactivados'}
                </button>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Activa o desactiva la visualización de decimales en toda la aplicación.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;