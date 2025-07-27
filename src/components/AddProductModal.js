import React, { useMemo } from 'react';
import { X, Plus } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFormValidation } from '../hooks/useFormValidation';
import { useImageHandler } from '../hooks/useImageHandler';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import ImageUploader from './ImageUploader';

const AddProductModal = ({ 
  isOpen, 
  onClose, 
  onAddToReview, 
  profitMargin, 
  roundingMultiple, 
  allowDecimals 
}) => {
  const [user] = useAuthState(auth);
  const { formData, handleChange, resetForm } = useFormValidation({ 
    name: '', 
    quantity: '', 
    totalCost: '', 
    expiryDate: ''
  });
  
  const { 
    imageData, 
    loadingImages, 
    addImage, 
    removeImage, 
    clearImages, 
    getImageIds, 
    canAddMore 
  } = useImageHandler(user, 3);
  
  useBodyScrollLock(isOpen);

  const calculatedValues = useMemo(() => {
    const quantity = parseFloat(formData.quantity);
    const totalCost = parseFloat(formData.totalCost);
    
    if (quantity > 0 && totalCost > 0) {
      const unitCost = totalCost / quantity;
      const finalPrice = roundUpToMultiple(unitCost * (1 + profitMargin / 100), roundingMultiple);
      return { unitCost: unitCost, finalPrice };
    }
    return { unitCost: 0, finalPrice: 0 };
  }, [formData.quantity, formData.totalCost, profitMargin, roundingMultiple]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (formData.name && formData.quantity > 0 && formData.totalCost > 0) {
      const quantity = parseFloat(formData.quantity);
      const totalCost = parseFloat(formData.totalCost);
      const unitCost = totalCost / quantity;
      const price = roundUpToMultiple(unitCost * (1 + profitMargin / 100), roundingMultiple);

      onAddToReview({ 
        id: Date.now(),
        name: formData.name,
        quantity: formData.quantity,
        cost: unitCost.toFixed(2),
        price: price,
        expiryDate: formData.expiryDate || null,
        imageIds: getImageIds()
      });
      
      resetForm({ name: '', quantity: '', totalCost: '', expiryDate: '' });
      clearImages();
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
                name="name"
                id="name" 
                value={formData.name} 
                onChange={handleChange}
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
                  name="quantity"
                  id="quantity" 
                  value={formData.quantity} 
                  onChange={handleChange}
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
                  name="totalCost"
                  id="totalCost" 
                  value={formData.totalCost} 
                  onChange={handleChange}
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
                name="expiryDate"
                id="expiryDate" 
                value={formData.expiryDate} 
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
              />
            </div>

            {/* Sección de Imágenes */}
            <ImageUploader
              imageData={imageData}
              onAddImage={addImage}
              onRemoveImage={removeImage}
              maxImages={3}
              loadingImages={loadingImages}
              canAddMore={canAddMore}
            />
            
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