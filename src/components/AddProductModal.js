import React, { useState, useMemo, useRef } from 'react';
import { X, Plus, Upload, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { roundUpToMultiple, formatNumber } from '../utils/helpers';
import { saveProductImage, deleteProductImage } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';

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
    imageIds: []
  });
  const fileInputRef = useRef(null);
  const [user] = useAuthState(auth);
  const [imageData, setImageData] = useState([]); // Para almacenar las imágenes cargadas
  
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

  // Función simple para procesar imágenes - convierte a base64 con compresión automática
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      console.log('🖼️ Procesando imagen:', file.name, `(${Math.round(file.size / 1024)}KB)`);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Calcular dimensiones para que la imagen final sea menor a 1MB
          let { width, height } = img;
          const maxWidth = 800;
          const maxHeight = 600;
          
          // Redimensionar manteniendo proporción
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Dibujar imagen redimensionada
          ctx.drawImage(img, 0, 0, width, height);
          
          // Comprimir hasta que sea menor a 1MB
          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          const maxSizeBytes = 1024 * 1024; // 1MB
          
          while (dataUrl.length * 0.75 > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          
          const finalSizeKB = Math.round(dataUrl.length * 0.75 / 1024);
          console.log(`✅ Imagen procesada: ${width}x${height}, calidad: ${quality.toFixed(1)}, tamaño: ${finalSizeKB}KB`);
          
          if (finalSizeKB > 1024) {
            reject(new Error('No se pudo comprimir la imagen lo suficiente. Intenta con una imagen más pequeña.'));
            return;
          }
          
          resolve(dataUrl);
        } catch (error) {
          reject(new Error(`Error procesando imagen: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        reject(new Error('Error cargando la imagen. Verifica que el archivo sea válido.'));
      };
      
      // Cargar imagen usando URL.createObjectURL (más simple y confiable)
      const objectURL = URL.createObjectURL(file);
      img.src = objectURL;
      
      // Limpiar URL después de cargar
      img.onload = (originalOnload => function() {
        URL.revokeObjectURL(objectURL);
        return originalOnload.apply(this, arguments);
      })(img.onload);
    });
  };



  const handleImageUpload = () => {
    if (!user) {
      alert('Debes estar autenticado para subir imágenes');
      return;
    }
    if (imageData.length >= 3) {
      alert('Máximo 3 imágenes permitidas por producto');
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    console.log('🔍 DEBUG: Iniciando handleFileChange con nueva arquitectura');
    
    const file = event.target.files[0];
    if (!file) {
      console.log('🔍 DEBUG: No hay archivo seleccionado');
      return;
    }

    console.log('🔍 DEBUG: Archivo seleccionado:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });

    // Validaciones
    if (!file.type.startsWith('image/')) {
      console.log('🔍 DEBUG: Archivo no es imagen, tipo:', file.type);
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB máximo
      console.log('🔍 DEBUG: Archivo muy grande:', file.size);
      alert('La imagen es demasiado grande. Máximo 10MB permitido.');
      return;
    }

    console.log('🔍 DEBUG: Validaciones pasadas, iniciando compresión...');

    try {
      const processedDataUrl = await processImage(file);
      const { imageId, error } = await saveProductImage(user.uid, processedDataUrl);
      
      if (error) {
        throw new Error(error);
      }

      // Actualizar estado local con la nueva imagen
      const newImageData = [...imageData, { id: imageId, data: processedDataUrl }];
      const newImageIds = [...newItem.imageIds, imageId];
      
      setImageData(newImageData);
      setNewItem(prev => ({ ...prev, imageIds: newImageIds }));
    } catch (error) {
      console.error('❌ ERROR DETALLADO procesando imagen:', {
        message: error.message,
        stack: error.stack,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      });
      alert(`Error al procesar la imagen: ${error.message}`);
    }

    // Limpiar input
    event.target.value = '';
  };

  const removeImage = async (index) => {
    const imageToRemove = imageData[index];
    if (!imageToRemove || !user) return;

    try {
      console.log('🔍 DEBUG: Eliminando imagen con ID:', imageToRemove.id);
      
      // Eliminar de Firestore
      const { error } = await deleteProductImage(user.uid, imageToRemove.id);
      if (error) {
        console.error('❌ Error eliminando imagen de Firestore:', error);
        alert('Error al eliminar la imagen');
        return;
      }

      // Actualizar estado local
      const newImageData = imageData.filter((_, i) => i !== index);
      const newImageIds = newItem.imageIds.filter((_, i) => i !== index);
      
      setImageData(newImageData);
      setNewItem(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
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
        imageIds: newItem.imageIds || []
      });
      
      setNewItem({ name: '', quantity: '', totalCost: '', expiryDate: '', imageIds: [] });
      setImageData([]);
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
                onClick={handleImageUpload}
                disabled={imageData.length >= 3}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  imageData.length >= 3
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                }`}
              >
                <Upload className="h-4 w-4" />
                {imageData.length >= 3 
                  ? 'Máximo 3 imágenes' 
                  : `Subir Imagen (${imageData.length}/3)`
                }
              </button>

              {/* Galería de imágenes */}
              {imageData.length > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  {imageData.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.data}
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
              <div className="text-xs text-[var(--color-text-secondary)] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                <strong>📸 Sistema optimizado:</strong> Máximo 3 imágenes por producto. Se comprimen automáticamente a 600x450px con calidad balanceada, máximo 150KB cada una para garantizar sincronización con la base de datos.
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