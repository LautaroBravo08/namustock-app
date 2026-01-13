import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Upload, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { saveProductImage, getMultipleProductImages, deleteProductImage } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { roundToMultiple, formatNumber } from '../utils/helpers';

const EditProductModal = ({ 
  product, 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  profitMargin = 30,
  roundingMultiple = 50,
  roundingDirection = 'up',
  allowDecimals = false,
  themeType = 'dark'
}) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);
  const [user] = useAuthState(auth);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageData, setImageData] = useState([]); // Para almacenar las imágenes cargadas
  const [isProcessingImage, setIsProcessingImage] = useState(false); // Estado de carga para procesamiento de imagen
  const [lastModifiedField, setLastModifiedField] = useState(null); // Para rastrear qué campo se modificó último
  
  // Estados para cámara
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraStatus, setCameraStatus] = useState('');
  const cameraVideoRef = useRef(null);
  const cameraStreamRef = useRef(null);

  useBodyScrollLock(isOpen);

  // Cálculos automáticos - solo cuando se modifica el costo, no el precio
  const calculatedValues = useMemo(() => {
    if (!formData || lastModifiedField === 'price') {
      return {
        calculatedPrice: formData?.price || 0,
        showCalculation: false
      };
    }

    const cost = parseFloat(formData.cost) || 0;
    
    if (cost > 0 && (lastModifiedField === 'cost' || lastModifiedField === null)) {
      const unitPrice = cost * (1 + profitMargin / 100);
      const calculatedPrice = roundToMultiple(unitPrice, roundingMultiple, roundingDirection);
      
      return {
        calculatedPrice,
        showCalculation: lastModifiedField === 'cost'
      };
    }

    return {
      calculatedPrice: formData?.price || 0,
      showCalculation: false
    };
  }, [formData?.cost, formData?.price, profitMargin, roundingMultiple, roundingDirection, lastModifiedField]);

  useEffect(() => {
    const loadProductData = async () => {
      if (isOpen && product && user) {
        console.log('🔍 DEBUG: Cargando producto con imágenes separadas');
        
        // Inicializar datos básicos del producto
        const imageIds = Array.isArray(product.imageIds) ? product.imageIds : [];
        setFormData({
          ...product,
          imageIds: imageIds
        });
        
        // Reset del campo modificado
        setLastModifiedField(null);

        // Cargar imágenes por separado si existen IDs
        if (imageIds.length > 0) {
          setLoadingImages(true);
          console.log('🔍 DEBUG: Cargando imágenes con IDs:', imageIds);
          
          try {
            const { images, error } = await getMultipleProductImages(user.uid, imageIds);
            if (error) {
              console.error('❌ Error cargando imágenes:', error);
              setImageData([]);
            } else {
              console.log('✅ Imágenes cargadas exitosamente:', images.length);
              setImageData(images.filter(img => img.data && !img.error));
            }
          } catch (error) {
            console.error('❌ Error cargando imágenes:', error);
            setImageData([]);
          } finally {
            setLoadingImages(false);
          }
        } else {
          setImageData([]);
        }
      } else {
        setFormData(null);
        setImageData([]);
        setLastModifiedField(null);
      }
    };

    loadProductData();
  }, [isOpen, product, user]);

  if (!isOpen || !formData) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let processedValue = value;

    // Validación para nombres - límite de 40 caracteres y capitalización
    if (name === 'name' || name === 'category') {
      if (value.length > 40) {
        return; // No permitir más de 40 caracteres
      }
      // Capitalizar primera letra de cada palabra
      processedValue = value.replace(/\b\w/g, l => l.toUpperCase());
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

    // Rastrear qué campo se está modificando
    setLastModifiedField(name);

    // Actualizar formData
    setFormData(prev => {
      const newData = { ...prev, [name]: processedValue };
      
      // Si se modifica el costo, calcular automáticamente el precio
      if (name === 'cost' && processedValue && parseFloat(processedValue) > 0) {
        const cost = parseFloat(processedValue);
        const unitPrice = cost * (1 + profitMargin / 100);
        const calculatedPrice = roundToMultiple(unitPrice, roundingMultiple, roundingDirection);
        newData.price = calculatedPrice.toFixed(allowDecimals ? 2 : 0);
      }
      
      return newData;
    });
  };

  // Función de procesamiento de imágenes con compresión robusta
  const processImage = async (file) => {
    try {
      // Importar utilidades de imagen
      const { compressImageWithFallback, validateImageFile } = await import('../utils/imageUtils');
      
      // Validar archivo
      validateImageFile(file);
      
      // Comprimir imagen con fallback automático
      const compressedDataUrl = await compressImageWithFallback(file, 700);
      
      console.log('✅ Imagen procesada exitosamente');
      return compressedDataUrl;
      
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      throw new Error(`${error.message}`);
    }
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
    const file = event.target.files[0];
    if (!file) return;

    // Validación mínima
    if (imageData.length >= 3) {
      alert('Máximo 3 imágenes permitidas por producto');
      return;
    }

    setIsProcessingImage(true);

    try {
      const processedDataUrl = await processImage(file);
      const { imageId, error } = await saveProductImage(user.uid, processedDataUrl);
      
      if (error) {
        alert(`Error guardando imagen: ${error}`);
        return;
      }

      // Actualizar estado local
      const newImageData = [...imageData, { id: imageId, data: processedDataUrl }];
      const newImageIds = [...(formData.imageIds || []), imageId];
      
      setImageData(newImageData);
      setFormData(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen agregada exitosamente');
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      alert(`Error procesando imagen: ${error.message}`);
    } finally {
      setIsProcessingImage(false);
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
      const newImageIds = formData.imageIds.filter((_, i) => i !== index);
      
      setImageData(newImageData);
      setFormData(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  // Función para inicializar cámara
  const initializeCamera = async () => {
    try {
      setCameraError('');
      setCameraStatus('Iniciando cámara...');
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { exact: 'environment' }
          }
        });
      } catch (exactError) {
        console.log('Exact environment not available, trying ideal...');
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' }
            }
          });
        } catch (idealError) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }
      
      cameraStreamRef.current = stream;
      if (cameraVideoRef.current) {
        cameraVideoRef.current.srcObject = stream;
      }
      
      setCameraStatus('Cámara lista');
      setTimeout(() => setCameraStatus(''), 2000);
      
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        setCameraError('Acceso a la cámara denegado. Por favor, permite el acceso.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No se encontró ninguna cámara.');
      } else {
        setCameraError('Error al acceder a la cámara.');
      }
    }
  };

  // Función para tomar foto
  const takePicture = async () => {
    if (!cameraVideoRef.current || cameraError) return;
    
    try {
      setIsProcessingImage(true);
      
      const canvas = document.createElement('canvas');
      const video = cameraVideoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        
        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        try {
          const processedDataUrl = await processImage(file);
          const { imageId, error } = await saveProductImage(user.uid, processedDataUrl);
          
          if (error) {
            alert(`Error guardando imagen: ${error}`);
            return;
          }

          // Actualizar estado local
          const newImageData = [...imageData, { id: imageId, data: processedDataUrl }];
          const newImageIds = [...(formData.imageIds || []), imageId];
          
          setImageData(newImageData);
          setFormData(prev => ({ ...prev, imageIds: newImageIds }));
          
          console.log('✅ Foto tomada y agregada exitosamente');
          cancelCamera();
        } catch (error) {
          console.error('❌ Error procesando foto:', error);
          alert(`Error procesando foto: ${error.message}`);
        } finally {
          setIsProcessingImage(false);
        }
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Error taking picture:', error);
      setIsProcessingImage(false);
    }
  };

  // Función para cancelar cámara
  const cancelCamera = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
    }
    setShowCamera(false);
    setCameraError('');
    setCameraStatus('');
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-2 sm:p-4" onClick={onClose}>
      <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl mx-2 sm:mx-4 border border-[var(--color-border)] max-h-[95vh] overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--color-border)]">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)]">Editar Producto</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
              Nombre del Producto *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              maxLength="40"
              placeholder="Nombre del producto (máx. 40 caracteres)"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Precio</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Costo</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Categoría</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
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
                className="mt-1 block w-full px-3 py-2 border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          {/* Mostrar cálculos automáticos cuando se modifica el costo */}
          {calculatedValues.showCalculation && calculatedValues.calculatedPrice > 0 && (
            <div className="text-center p-4 bg-[var(--color-bg)] rounded-lg border border-green-200">
              <div className="flex justify-around">
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Costo</p>
                  <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                    ${formatNumber(parseFloat(formData.cost) || 0, allowDecimals)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Margen ({profitMargin}%)</p>
                  <p className="text-lg font-semibold text-blue-600">
                    ${formatNumber((parseFloat(formData.cost) || 0) * (profitMargin / 100), allowDecimals)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[var(--color-text-secondary)]">Precio Calculado</p>
                  <p className="text-lg font-semibold text-green-600">
                    ${formatNumber(calculatedValues.calculatedPrice, allowDecimals)}
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                💡 El precio se calcula automáticamente al modificar el costo. Puedes editarlo manualmente si lo deseas.
              </p>
            </div>
          )}

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

            {/* Botones para agregar imágenes */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={imageData.length >= 3 || loadingImages || isProcessingImage}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm flex-1 ${
                  imageData.length >= 3 || loadingImages || isProcessingImage
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                }`}
              >
                <Upload className={`h-4 w-4 ${isProcessingImage ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {isProcessingImage
                    ? 'Procesando...'
                    : loadingImages 
                      ? 'Cargando...'
                      : imageData.length >= 3 
                        ? 'Máximo 3'
                        : `Subir (${imageData.length}/3)`
                  }
                </span>
                <span className="sm:hidden">Subir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (imageData.length >= 3) return;
                  setShowCamera(true);
                  setTimeout(initializeCamera, 100);
                }}
                disabled={imageData.length >= 3 || loadingImages || isProcessingImage}
                className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm flex-1 ${
                  imageData.length >= 3 || loadingImages || isProcessingImage
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Tomar Foto</span>
                <span className="sm:hidden">Foto</span>
              </button>
            </div>

            {/* Interfaz de cámara */}
            {showCamera && (
              <div className="mt-4 p-3 sm:p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]">Tomar Foto</h4>
                  <button
                    type="button"
                    onClick={cancelCamera}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {cameraStatus && (
                  <div className="mb-2 text-sm font-semibold text-blue-600 text-center">
                    {cameraStatus}
                  </div>
                )}

                {cameraError && (
                  <div className="mb-2 text-sm font-semibold text-red-500 text-center">
                    {cameraError}
                    <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
                      💡 <strong>Cómo habilitar:</strong><br />
                      1. Busca el ícono de la cámara 📷 en la barra de direcciones<br />
                      2. Haz clic y selecciona "Permitir"<br />
                      3. O ve a Configuración → Privacidad → Cámara
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center">
                  <video 
                    ref={cameraVideoRef} 
                    autoPlay 
                    playsInline 
                    className="w-full h-auto max-h-[200px] sm:max-h-[250px] rounded-md bg-black mb-3"
                  ></video>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={takePicture}
                      disabled={!!cameraError || isProcessingImage}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                    >
                      <ImageIcon className="h-4 w-4" />
                      {isProcessingImage ? 'Procesando...' : 'Capturar'}
                    </button>
                    
                    <button
                      type="button"
                      onClick={cancelCamera}
                      className="px-3 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Galería de imágenes */}
            {imageData.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {imageData.map((image, index) => (
                  <div key={image.id} className="relative group">
                    <img
                      src={image.data}
                      alt={`Producto ${index + 1}`}
                      className="w-full h-20 sm:h-24 object-cover rounded-lg border border-[var(--color-border)]"
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

            {/* Indicador de carga */}
            {loadingImages && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Cargando imágenes...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-bg)] rounded-b-xl">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Botón eliminar */}
            {onDelete && (
              <button
                onClick={() => {
                  if (window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
                    onDelete(formData.id);
                    onClose();
                  }
                }}
                className="bg-red-500 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors flex items-center justify-center gap-2 flex-1 text-sm sm:text-base"
              >
                <Trash2 className="h-4 w-4" />
                Eliminar
              </button>
            )}
            
            <div className="flex gap-2 sm:gap-3 flex-1">
              {/* Botón cancelar */}
              <button
                onClick={onClose}
                className="bg-[var(--color-bg-secondary)] py-2.5 sm:py-3 px-4 border border-[var(--color-border)] rounded-lg font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] transition-colors flex-1 text-sm sm:text-base"
              >
                Cancelar
              </button>
              
              {/* Botón guardar */}
              <button
                onClick={handleSave}
                className="bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors flex-1 text-sm sm:text-base"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProductModal;