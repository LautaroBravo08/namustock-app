import React, { useState, useEffect } from 'react';
import { X, FolderOpen, Save, Package, Receipt } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const ImportExportModal = ({ 
  isOpen, 
  onClose, 
  saveProductsToFile, 
  loadProductsFromFile, 
  saveSalesToFile, 
  loadSalesFromFile 
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
        className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-border)] transform transition-all duration-300 ease-out ${
          showContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Import/Export</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Inventario Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Inventario</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => { loadProductsFromFile(); onClose(); }} 
                className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <FolderOpen className="h-5 w-5"/>
                Importar Productos
              </button>
              
              <button 
                onClick={() => { saveProductsToFile(); onClose(); }} 
                className="bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
              >
                <Save className="h-5 w-5"/>
                Exportar Productos
              </button>
            </div>
            
            <p className="text-xs text-[var(--color-text-secondary)] text-center">
              Importa o exporta tu inventario completo en formato JSON
            </p>
          </div>

          <hr className="border-[var(--color-border)]" />

          {/* Ventas Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Receipt className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Registro de Ventas</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button 
                onClick={() => { loadSalesFromFile(); onClose(); }} 
                className="bg-green-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition-colors"
              >
                <FolderOpen className="h-5 w-5"/>
                Importar Ventas
              </button>
              
              <button 
                onClick={() => { saveSalesToFile(); onClose(); }} 
                className="bg-indigo-500 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors"
              >
                <Save className="h-5 w-5"/>
                Exportar Ventas
              </button>
            </div>
            
            <p className="text-xs text-[var(--color-text-secondary)] text-center">
              Importa o exporta tu historial de ventas en formato JSON
            </p>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-bg)] rounded-b-xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Nota:</strong> Los archivos se guardan en formato JSON. 
              Asegúrate de mantener copias de seguridad regulares de tus datos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportExportModal;