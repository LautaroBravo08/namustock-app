import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import CameraConfirmationModal from './CameraConfirmationModal';
import { optimizeProductImage, getImageInfo } from '../utils/imageOptimizer';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);
  const [uploadTargetIndex, setUploadTargetIndex] = useState(0);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraTargetIndex, setCameraTargetIndex] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationProgress, setOptimizationProgress] = useState('');

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && product) {
      const urls = Array.isArray(product.imageUrls) ? product.imageUrls : [''];
      while(urls.length < 3) urls.push('');
      setFormData({
        ...product, 
        imageUrls: urls.slice(0,3) 
      });
    } else {
      setFormData(null);
    }
  }, [isOpen, product]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validación para nombres - límite de 40 caracteres
    if (name === 'name' || name === 'category') {
      if (value.length > 40) {
        return; // No permitir más de 40 caracteres
      }
    }
    
    // Validación para campos numéricos
    if (name === 'stock' || name === 'price' || name === 'cost') {
      // Solo permitir números, puntos decimales y signos negativos
      const numericRegex = /^-?\d*\.?\d*$/;
      if (!numericRegex.test(value) && value !== '') {
        return; // No actualizar si no es un número válido
      }
      
      // Limitar a máximo 8 dígitos en la parte entera
      const cleanValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanValue.split('.');
      if (parts[0] && parts[0].length > 8) {
        return; // No permitir más de 8 dígitos en la parte entera
      }
      
      // Limitar decimales a máximo 2
      if (value.includes('.')) {
        const parts = value.split('.');
        if (parts[1] && parts[1].length > 2) {
          return; // No permitir más de 2 decimales
        }
      }
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUrlChange = (index, value) => {
    const newImageUrls = [...formData.imageUrls];
    newImageUrls[index] = value;
    setFormData(prev => ({...prev, imageUrls: newImageUrls}));
  };

  const handleUploadClick = (index) => {
    setUploadTargetIndex(index);
    fileInputRef.current.click();
  };

  const handleCameraClick = (index) => {
    setCameraTargetIndex(index);
    setIsCameraModalOpen(true);
  };

  const handleConfirmPhoto = (photoDataUrl) => {
    handleImageUrlChange(cameraTargetIndex, photoDataUrl);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsOptimizing(true);
    setOptimizationProgress('Analizando imagen...');

    try {
      // Mostrar información de la imagen original
      console.log('📸 Procesando archivo:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
      });
      
      setOptimizationProgress(`Procesando ${file.name}...`);

      // Intentar obtener información de la imagen
      let imageInfo = null;
      try {
        imageInfo = await getImageInfo(file);
        setOptimizationProgress(`Optimizando imagen (${imageInfo.sizeMB} MB)...`);
      } catch (infoError) {
        console.log('⚠️ No se pudo obtener info de imagen, continuando...');
        setOptimizationProgress('Optimizando imagen...');
      }

      // Optimizar la imagen
      const optimizedResult = await optimizeProductImage(file);
      
      setOptimizationProgress('Aplicando optimización...');
      
      // Usar la imagen optimizada
      handleImageUrlChange(uploadTargetIndex, optimizedResult.dataUrl);
      
      setOptimizationProgress('¡Imagen optimizada exitosamente!');
      
      // Mostrar información de éxito
      console.log('✅ Imagen optimizada y cargada exitosamente:', {
        original: `${(optimizedResult.originalSize / 1024 / 1024).toFixed(2)} MB`,
        optimized: `${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)} MB`,
        dimensions: `${optimizedResult.dimensions.width}x${optimizedResult.dimensions.height}`,
        format: optimizedResult.format
      });
      
      // Limpiar estado después de un momento
      setTimeout(() => {
        setIsOptimizing(false);
        setOptimizationProgress('');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error optimizando imagen:', error);
      setOptimizationProgress('Optimización falló, usando imagen original...');
      
      // Fallback mejorado: usar la imagen original
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          handleImageUrlChange(uploadTargetIndex, e.target.result);
          setOptimizationProgress('Imagen cargada sin optimización');
          setTimeout(() => {
            setIsOptimizing(false);
            setOptimizationProgress('');
          }, 1500);
        };
        reader.onerror = () => {
          setOptimizationProgress('Error cargando imagen');
          setTimeout(() => {
            setIsOptimizing(false);
            setOptimizationProgress('');
          }, 1500);
        };
        reader.readAsDataURL(file);
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        setOptimizationProgress('Error procesando imagen');
        setTimeout(() => {
          setIsOptimizing(false);
          setOptimizationProgress('');
        }, 1500);
      }
    }
    
    event.target.value = '';
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <>
      <CameraConfirmationModal 
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onConfirm={handleConfirmPhoto}
      />
      
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
        <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--color-border)]`}>
          <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Editar Producto</h2>
            <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Nombre del Producto *
              </label>
              <input 
                type="text" 
                name="name" 
                value={formData.name} 
                onChange={handleChange} 
                className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                maxLength="40"
                placeholder="Nombre del producto (máx. 40 caracteres)"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Stock</label>
                <input 
                  type="number" 
                  name="stock" 
                  value={formData.stock} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Precio</label>
                <input 
                  type="number" 
                  name="price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Costo</label>
                <input 
                  type="number" 
                  name="cost" 
                  value={formData.cost} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Categoría</label>
                <input 
                  type="text" 
                  name="category" 
                  value={formData.category} 
                  onChange={handleChange} 
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                  maxLength="40"
                  placeholder="Categoría (máx. 40 caracteres)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Fecha de Vencimiento (Opcional)
                </label>
                <input 
                  type="date" 
                  name="expiryDate" 
                  value={formData.expiryDate || ''} 
                  onChange={handleChange} 
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                URLs de Imágenes
              </label>
              
              {/* Indicador de optimización */}
              {isOptimizing && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {optimizationProgress}
                    </span>
                  </div>
                  <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Optimizando imagen para mejor rendimiento...
                  </div>
                </div>
              )}
              
              {formData.imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={url} 
                    onChange={(e) => handleImageUrlChange(index, e.target.value)} 
                    placeholder={`URL o subida de imagen ${index + 1}`} 
                    className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]" 
                    disabled={isOptimizing}
                  />
                  <button 
                    type="button" 
                    onClick={() => handleUploadClick(index)} 
                    disabled={isOptimizing}
                    className="p-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Subir imagen (se optimizará automáticamente)"
                  >
                    <Upload className="h-5 w-5 text-[var(--color-text-secondary)]"/>
                  </button>
                  <button 
                    type="button" 
                    onClick={() => handleCameraClick(index)} 
                    disabled={isOptimizing}
                    className="p-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md hover:bg-[var(--color-border)] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="h-5 w-5 text-[var(--color-text-secondary)]"/>
                  </button>
                </div>
              ))}
              
              <div className="text-xs text-[var(--color-text-secondary)] mt-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-2">
                <strong>✨ Optimización automática:</strong> Las imágenes se redimensionan automáticamente a 800x600px y se comprimen para mejor rendimiento sin perder calidad visual.
              </div>
            </div>
          </div>
          
          <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] rounded-b-xl flex justify-end">
            <button 
              onClick={onClose} 
              className="mr-3 bg-[var(--color-bg-secondary)] py-2 px-4 border border-[var(--color-border)] rounded-md shadow-sm text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave} 
              className="bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)]"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EditProductModal;