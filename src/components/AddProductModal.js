import React, { useState, useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  onAddToReview, 
  profitMargin, 
  roundingMultiple, 
  allowDecimals 
}) => {
  const [newItem, setNewItem] = useState({ 
    name: '', 
    quantity: '', 
    totalCost: '', 
    expiryDate: '' 
  });
  
  useBodyScrollLock(isOpen);

  const calculatedValues = useMemo(() => {
    const quantity = parseFloat(newItem.quantity);
    const totalCost = parseFloat(newItem.totalCost);
    
    if (quantity > 0 && totalCost > 0) {
      const unitCost = totalCost / quantity;
      const finalPrice = roundUpToMultiple(unitCost * (1 + profitMargin / 100), roundingMultiple);
      return { unitCost: unitCost, finalPrice };
    }
    return { unitCost: 0, finalPrice: 0 };
  }, [newItem.quantity, newItem.totalCost, profitMargin, roundingMultiple]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (newItem.name && newItem.quantity > 0 && newItem.totalCost > 0) {
      const quantity = parseFloat(newItem.quantity);
      const totalCost = parseFloat(newItem.totalCost);
      const unitCost = totalCost / quantity;
      const price = roundUpToMultiple(unitCost * (1 + profitMargin / 100), roundingMultiple);

      onAddToReview({ 
        id: Date.now(),
        name: newItem.name,
        quantity: newItem.quantity,
        cost: unitCost.toFixed(2),
        price: price,
        expiryDate: newItem.expiryDate || null
      });
      
      setNewItem({ name: '', quantity: '', totalCost: '', expiryDate: '' });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--color-border)]">
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Agregar Producto</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <form onSubmit={handleAdd}>
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Nombre *
              </label>
              <input 
                type="text" 
                id="name" 
                value={newItem.name} 
                onChange={e => {
                  const value = e.target.value;
                  if (value.length <= 40) {
                    setNewItem({...newItem, name: value});
                  }
                }} 
                className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                placeholder='Ej: Smartwatch Pro (máx. 40 caracteres)' 
                maxLength="40"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Cantidad (Stock)
                </label>
                <input 
                  type="number" 
                  id="quantity" 
                  value={newItem.quantity} 
                  onChange={e => {
                    const value = e.target.value;
                    // Solo permitir números, puntos decimales y signos negativos
                    const numericRegex = /^-?\d*\.?\d*$/;
                    if (numericRegex.test(value) || value === '') {
                      // Limitar a máximo 8 dígitos en la parte entera
                      const cleanValue = value.replace(/[^0-9.]/g, '');
                      const parts = cleanValue.split('.');
                      if (parts[0] && parts[0].length > 8) {
                        return; // No permitir más de 8 dígitos en la parte entera
                      }
                      
                      // Limitar decimales a máximo 2
                      if (value.includes('.')) {
                        const parts = value.split('.');
                        if (parts[1] && parts[1].length <= 2) {
                          setNewItem({...newItem, quantity: value});
                        }
                      } else {
                        setNewItem({...newItem, quantity: value});
                      }
                    }
                  }} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                  placeholder='Ej: 50' 
                  step="0.01"
                  max="999999.99"
                />
              </div>
              <div>
                <label htmlFor="totalCost" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Costo Total
                </label>
                <input 
                  type="number" 
                  id="totalCost" 
                  value={newItem.totalCost} 
                  onChange={e => {
                    const value = e.target.value;
                    // Solo permitir números, puntos decimales y signos negativos
                    const numericRegex = /^-?\d*\.?\d*$/;
                    if (numericRegex.test(value) || value === '') {
                      // Limitar a máximo 8 dígitos en la parte entera
                      const cleanValue = value.replace(/[^0-9.]/g, '');
                      const parts = cleanValue.split('.');
                      if (parts[0] && parts[0].length > 8) {
                        return; // No permitir más de 8 dígitos en la parte entera
                      }
                      
                      // Limitar decimales a máximo 2
                      if (value.includes('.')) {
                        const parts = value.split('.');
                        if (parts[1] && parts[1].length <= 2) {
                          setNewItem({...newItem, totalCost: value});
                        }
                      } else {
                        setNewItem({...newItem, totalCost: value});
                      }
                    }
                  }} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                  placeholder='Ej: 7500' 
                  step="0.01"
                  max="999999.99"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="expiryDate" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Fecha de Vencimiento (Opcional)
              </label>
              <input 
                type="date" 
                id="expiryDate" 
                value={newItem.expiryDate} 
                onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} 
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
              />
            </div>
            
            <div className="text-center p-4 bg-[var(--color-bg)] rounded-lg">
              <div className="flex justify-around">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Costo Unitario</p>
                  <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                    ${formatNumber(calculatedValues.unitCost, allowDecimals)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Precio Final</p>
                  <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500 animate-gradient-x">
                    ${formatNumber(calculatedValues.finalPrice, allowDecimals)}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] rounded-b-xl flex justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="mr-3 bg-[var(--color-bg-secondary)] py-2 px-4 border border-[var(--color-border)] rounded-md shadow-sm text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] flex items-center gap-2"
            >
              <Plus className="h-5 w-5" />Añadir a Revisión
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;