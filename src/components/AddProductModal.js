import React, { useState, useMemo, useRef } from 'react';
import { X, Plus, Upload, Trash2 } from 'lucide-react';
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
    expiryDate: '',
    imageUrls: []
  });
  const fileInputRef = useRef(null);
  
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

  // Función de compresión inteligente que mantiene buena calidad
  const compressImageWithQuality = (file, maxWidth = 800, maxHeight = 600, quality = 0.75) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calcular nuevas dimensiones manteniendo proporción
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar imagen con buena calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir con calidad balanceada
        let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Si es muy grande, reducir calidad gradualmente
        const maxSizeBytes = 200 * 1024; // 200KB máximo por imagen
        let currentQuality = quality;
        
        while (compressedDataUrl.length * 0.75 > maxSizeBytes && currentQuality > 0.3) {
          currentQuality -= 0.1;
          compressedDataUrl = canvas.toDataURL('image/jpeg', currentQuality);
        }
        
        resolve(compressedDataUrl);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleUploadClick = () => {
    if (newItem.imageUrls.length >= 3) {
      alert('Máximo 3 imágenes permitidas por producto');
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    // Validate file size (max 15MB)
    const maxSize = 15 * 1024 * 1024; // 15MB
    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. Máximo 15MB permitido.');
      return;
    }

    try {
      // Comprimir imagen manteniendo buena calidad
      const compressedDataUrl = await compressImageWithQuality(file);
      
      // Agregar imagen comprimida al array
      const newImageUrls = [...newItem.imageUrls, compressedDataUrl];
      setNewItem(prev => ({ ...prev, imageUrls: newImageUrls }));
      
      console.log('✅ Imagen procesada exitosamente');
    } catch (error) {
      console.error('Error procesando imagen:', error);
      alert('Error al procesar la imagen');
    }

    // Clear input
    event.target.value = '';
  };

  const removeImage = (index) => {
    const newImageUrls = newItem.imageUrls.filter((_, i) => i !== index);
    setNewItem(prev => ({ ...prev, imageUrls: newImageUrls }));
  };

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
        expiryDate: newItem.expiryDate || null,
        imageUrls: newItem.imageUrls || []
      });
      
      setNewItem({ name: '', quantity: '', totalCost: '', expiryDate: '', imageUrls: [] });
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

            {/* Sección de Imágenes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Imágenes del Producto (Máximo 3)
              </label>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/*" 
              />

              {/* Botón para subir imagen */}
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={newItem.imageUrls.length >= 3}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  newItem.imageUrls.length >= 3
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                }`}
              >
                <Upload className="h-4 w-4" />
                {newItem.imageUrls.length >= 3 ? 'Máximo 3 imágenes' : `Subir Imagen (${newItem.imageUrls.length}/3)`}
              </button>

              {/* Galería de imágenes */}
              {newItem.imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {newItem.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
                        alt={`Producto ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg border border-[var(--color-border)]"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Eliminar imagen"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Información sobre las imágenes */}
              <div className="text-xs text-[var(--color-text-secondary)] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <strong>📸 Imágenes optimizadas:</strong> Máximo 3 imágenes por producto. Se comprimen inteligentemente a 800x600px con 75% de calidad, máximo 200KB cada una para evitar errores de almacenamiento (máximo 15MB de archivo original).
              </div>
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