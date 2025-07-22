import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatNumber } from '../utils/helpers';

const EditableReviewItem = ({ item, onUpdate, onRemove, allowDecimals }) => {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Validación para nombres - límite de 40 caracteres
    if (name === 'name') {
      if (value.length > 40) {
        return; // No permitir más de 40 caracteres
      }
    }
    
    // Validación para campos numéricos
    if (name === 'quantity' || name === 'cost') {
      // Solo permitir números, puntos decimales y signos negativos
      const numericRegex = /^-?\d*\.?\d*$/;
      if (!numericRegex.test(value) && value !== '') {
        return; // No actualizar si no es un número válido
      }
      
      // Limitar a máximo 8 dígitos (incluyendo decimales)
      const cleanValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanValue.split('.');
      if (parts[0] && parts[0].length > 8) {
        return; // No permitir más de 8 dígitos en la parte entera
      }
      
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && allowDecimals) {
        // Limitar a máximo 2 decimales
        const limitedValue = Math.round(numValue * 100) / 100;
        onUpdate(item.id, name, limitedValue.toString());
        return;
      }
    }
    
    onUpdate(item.id, name, value);
  };

  const totalCost = (parseFloat(item.cost) * parseFloat(item.quantity)) || 0;
  const finalPrice = item.price;

  return (
    <div className="bg-[var(--color-bg)] p-3 rounded-lg flex flex-col gap-2 shadow-sm border border-[var(--color-border)]">
      <div className="flex items-center gap-2 min-w-0">
        <input 
          type="text" 
          name="name" 
          value={item.name} 
          onChange={handleInputChange}
          className="flex-1 min-w-0 bg-transparent font-bold text-[var(--color-text-primary)] border-none focus:ring-0 p-1 truncate"
          title={item.name}
          placeholder="Nombre del producto (máx. 40 caracteres)"
          style={{ maxWidth: 'calc(100% - 3rem)' }}
          maxLength="40"
        />
        <button 
          onClick={() => onRemove(item.id)} 
          className="flex-shrink-0 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-100 ml-2"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div className="flex flex-col min-w-0">
          <label className="text-xs text-[var(--color-text-secondary)]">Cantidad</label>
          <input 
            type="number" 
            name="quantity" 
            value={formatNumber(item.quantity || 0, allowDecimals, 2)} 
            onChange={handleInputChange} 
            className="w-full bg-transparent border-none focus:ring-0 p-1 min-w-0 text-sm overflow-hidden"
            step={allowDecimals ? "0.01" : "1"}
            max="999999.99"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <label className="text-xs text-[var(--color-text-secondary)]">Costo Unit.</label>
          <input 
            type="number" 
            name="cost" 
            value={formatNumber(item.cost || 0, allowDecimals, 2)} 
            onChange={handleInputChange} 
            className="w-full bg-transparent border-none focus:ring-0 p-1 min-w-0 text-sm overflow-hidden"
            step="0.01"
            max="999999.99"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <label className="text-xs text-[var(--color-text-secondary)]">Costo Total</label>
          <div className="w-full bg-transparent p-1 min-w-0 text-sm text-red-500 font-semibold overflow-hidden truncate">
            ${formatNumber(totalCost, allowDecimals, 2)}
          </div>
        </div>
        <div className="flex flex-col items-center justify-center min-w-0">
          <label className="text-xs text-[var(--color-text-secondary)]">Precio Final</label>
          <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-gradient-start)] to-[var(--color-gradient-end)] animate-gradient-x truncate w-full text-center overflow-hidden" title={`$${formatNumber(finalPrice, allowDecimals, 2)}`}>
            ${formatNumber(finalPrice, allowDecimals, 2)}
          </div>
        </div>
      </div>
      
      {item.expiryDate && (
        <div className="text-xs text-right text-[var(--color-text-secondary)]">
          Vence: {item.expiryDate}
        </div>
      )}
    </div>
  );
};

export default EditableReviewItem;