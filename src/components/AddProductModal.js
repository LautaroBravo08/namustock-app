import React, { useState, useMemo } from 'react';
import { X, Plus, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { roundToMultiple, formatNumber } from '../utils/helpers';
import { saveProductImage, deleteProductImage, getMultipleProductImages } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';

const AddProductModal = ({
  isOpen,
  onClose,
  onAddProduct,
  profitMargin,
  roundingMultiple,
  roundingDirection,
  allowDecimals,
  themeType,
  showNotification,
  existingProducts = []
}) => {
  // Estados para formulario manual
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: '',
    totalCost: '',
    unitCost: '',
    expiryDate: '',
    imageIds: []
  });

  // Estados para autocompletado
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Estados para manejo de imágenes
  const [imageData, setImageData] = useState([]);
  const [showManualCamera, setShowManualCamera] = useState(false);
  const [manualCameraError, setManualCameraError] = useState('');
  const [manualCameraStatus, setManualCameraStatus] = useState('');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isLoadingImages, setIsLoadingImages] = useState(false);

  // Referencias para cámara
  const manualCameraVideoRef = React.useRef(null);
  const manualCameraStreamRef = React.useRef(null);

  // Hooks
  const [user] = useAuthState(auth);
  useBodyScrollLock(isOpen);
  const { isGlowActive } = useRandomGlow(isOpen);

  // Filtrar productos para autocompletado
  React.useEffect(() => {
    if (newItem.name.length > 0) {
      const filtered = existingProducts.filter(product =>
        product.name.toLowerCase().includes(newItem.name.toLowerCase())
      );
      setFilteredProducts(filtered);
      setShowSuggestions(filtered.length > 0 && !selectedProduct);
    } else {
      setFilteredProducts([]);
      setShowSuggestions(false);
    }
  }, [newItem.name, existingProducts, selectedProduct]);

  // Cerrar sugerencias cuando se hace clic fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.autocomplete-container')) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

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

  // Función para cargar imágenes existentes
  const loadExistingImages = async (imageIds) => {
    if (!user || !imageIds || imageIds.length === 0) {
      setImageData([]);
      return;
    }

    setIsLoadingImages(true);
    try {
      const { images, error } = await getMultipleProductImages(user.uid, imageIds);
      if (error) {
        console.error("Error cargando imágenes existentes:", error);
        setImageData([]);
        return;
      }
      
      const validImages = images.filter(img => !img.error && img.data);
      setImageData(validImages);

    } catch (error) {
      console.error("Error en loadExistingImages:", error);
      setImageData([]);
    } finally {
      setIsLoadingImages(false);
    }
  };

  // Función para seleccionar un producto existente
  const handleSelectExistingProduct = (product) => {
    setSelectedProduct(product);
    const currentQuantity = parseFloat(newItem.quantity) || 0;
    const productCost = product.cost || product.unitCost || 0;
    const decimals = allowDecimals ? 2 : 0;

    setNewItem({
      ...newItem,
      name: product.name,
      totalCost: currentQuantity > 0 && productCost > 0 ? (productCost * currentQuantity).toFixed(decimals) : '',
      unitCost: productCost > 0 ? productCost.toFixed(decimals) : '',
      expiryDate: '',
      imageIds: product.imageIds || []
    });
    
    // Cargar imágenes existentes
    if (product.imageIds && product.imageIds.length > 0) {
      loadExistingImages(product.imageIds);
    } else {
      setImageData([]);
    }

    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Función para manejar cambios en el nombre
  const handleNameChange = (value) => {
    if (value.length <= 40) {
      // Capitalizar primera letra de cada palabra
      const capitalizedValue = value.replace(/\b\w/g, l => l.toUpperCase());
      setNewItem({ ...newItem, name: capitalizedValue });

      // Reset selected product when typing
      if (selectedProduct && value !== selectedProduct.name) {
        setSelectedProduct(null);
      }

      // Reset highlighted index
      setHighlightedIndex(-1);
    }
  };

  // Función para limpiar selección cuando se modifica costo manualmente
  const handleCostChangeWithReset = (field, value, handler) => {
    // Si hay un producto seleccionado y el usuario está modificando costos manualmente,
    // mantener la selección pero permitir la modificación
    handler(value);
  };

  // Función para manejar navegación con teclado
  const handleKeyDown = (e) => {
    if (!showSuggestions || filteredProducts.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev < filteredProducts.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev =>
          prev > 0 ? prev - 1 : filteredProducts.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0) {
          handleSelectExistingProduct(filteredProducts[highlightedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  // Funciones para manejar cambios en costos
  const handleTotalCostChange = (value) => {
    const quantity = parseFloat(newItem.quantity) || 0;
    const decimals = allowDecimals ? 2 : 0;

    setNewItem(prev => {
      const newState = {
        ...prev,
        totalCost: value
      };

      // Solo calcular unitCost si hay cantidad y valor válido
      if (value && quantity > 0) {
        newState.unitCost = (parseFloat(value) / quantity).toFixed(decimals);
      }

      return newState;
    });
  };

  const handleUnitCostChange = (value) => {
    const quantity = parseFloat(newItem.quantity) || 0;
    const decimals = allowDecimals ? 2 : 0;

    setNewItem(prev => {
      const newState = {
        ...prev,
        unitCost: value
      };

      // SOLO cuando se actualiza un producto existente: calcular totalCost automáticamente
      if (selectedProduct && value && quantity > 0) {
        newState.totalCost = (parseFloat(value) * quantity).toFixed(decimals);
      }
      // Para productos nuevos, mantener la lógica original
      else if (!selectedProduct && value && quantity > 0) {
        newState.totalCost = (parseFloat(value) * quantity).toFixed(decimals);
      }

      return newState;
    });
  };

  const handleQuantityChange = (value) => {
    const decimals = allowDecimals ? 2 : 0;

    setNewItem(prev => {
      const newState = {
        ...prev,
        quantity: value
      };

      // SOLO cuando se actualiza un producto existente: calcular totalCost automáticamente
      if (selectedProduct && prev.unitCost && value && parseFloat(value) > 0) {
        const qty = parseFloat(value);
        const unitCost = parseFloat(prev.unitCost);
        newState.totalCost = (unitCost * qty).toFixed(decimals);
      }
      // Para productos nuevos, mantener la lógica original
      else if (!selectedProduct) {
        const totalCost = parseFloat(prev.totalCost) || 0;
        const unitCost = parseFloat(prev.unitCost) || 0;

        if (value && parseFloat(value) > 0) {
          const qty = parseFloat(value);
          if (totalCost > 0) {
            newState.unitCost = (totalCost / qty).toFixed(decimals);
          } else if (unitCost > 0) {
            newState.totalCost = (unitCost * qty).toFixed(decimals);
          }
        }
      }

      return newState;
    });
  };

  // Cálculos automáticos
  const calculatedValues = useMemo(() => {
    const quantity = parseFloat(newItem.quantity) || 0;
    const totalCost = parseFloat(newItem.totalCost) || 0;
    const unitCost = parseFloat(newItem.unitCost) || 0;

    let finalUnitCost = 0;
    let finalTotalCost = 0;

    // Determinar cuál usar como base para los cálculos
    if (quantity > 0) {
      if (totalCost > 0) {
        finalUnitCost = totalCost / quantity;
        finalTotalCost = totalCost;
      } else if (unitCost > 0) {
        finalUnitCost = unitCost;
        finalTotalCost = unitCost * quantity;
      }
    }

    if (finalUnitCost > 0) {
      const unitPrice = finalUnitCost * (1 + profitMargin / 100);
      const finalPrice = roundToMultiple(unitPrice, roundingMultiple, roundingDirection);
      const totalPrice = finalPrice * quantity;

      return {
        unitCost: finalUnitCost,
        totalCost: finalTotalCost,
        unitPrice,
        finalPrice,
        totalPrice
      };
    }

    return {
      unitCost: 0,
      totalCost: 0,
      unitPrice: 0,
      finalPrice: 0,
      totalPrice: 0
    };
  }, [newItem.quantity, newItem.totalCost, newItem.unitCost, profitMargin, roundingMultiple, roundingDirection]);

  // Función para inicializar cámara manual
  const initializeManualCamera = async () => {
    try {
      setManualCameraError('');
      setManualCameraStatus('Iniciando cámara...');

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

      manualCameraStreamRef.current = stream;
      if (manualCameraVideoRef.current) {
        manualCameraVideoRef.current.srcObject = stream;
      }

      setManualCameraStatus('Cámara lista');
      setTimeout(() => setManualCameraStatus(''), 2000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error.name === 'NotAllowedError') {
        setManualCameraError('Acceso a la cámara denegado. Por favor, permite el acceso.');
      } else if (error.name === 'NotFoundError') {
        setManualCameraError('No se encontró ninguna cámara.');
      } else {
        setManualCameraError('Error al acceder a la cámara.');
      }
    }
  };

  // Función para tomar foto manual
  const takeManualPicture = async () => {
    if (!manualCameraVideoRef.current || manualCameraError) return;

    try {
      setIsProcessingImage(true);

      const canvas = document.createElement('canvas');
      const video = manualCameraVideoRef.current;
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
          const newImageIds = [...newItem.imageIds, imageId];
          
          setImageData(newImageData);
          setNewItem(prev => ({ ...prev, imageIds: newImageIds }));
          
          console.log('✅ Foto tomada y agregada exitosamente');
          cancelManualCamera();
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

  // Función para cancelar cámara manual
  const cancelManualCamera = () => {
    if (manualCameraStreamRef.current) {
      manualCameraStreamRef.current.getTracks().forEach(track => track.stop());
      manualCameraStreamRef.current = null;
    }
    setShowManualCamera(false);
    setManualCameraError('');
    setManualCameraStatus('');
  };

  // Función para manejar subida de imágenes
  const handleImageUpload = async (file) => {
    if (!user) {
      alert('Debes estar autenticado para subir imágenes');
      return;
    }

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
      const newImageIds = [...newItem.imageIds, imageId];
      
      setImageData(newImageData);
      setNewItem(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen agregada exitosamente');
    } catch (error) {
      console.error('❌ Error procesando imagen:', error);
      alert(`Error procesando imagen: ${error.message}`);
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Función para eliminar imagen
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
      const newImageIds = newItem.imageIds.filter(id => id !== imageToRemove.id);
      
      setImageData(newImageData);
      setNewItem(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
  };

  // Función para manejar envío del formulario
  const handleAdd = async (e) => {
    e.preventDefault();

    if (!newItem.name || !newItem.quantity || (!newItem.totalCost && !newItem.unitCost)) return;

    const finalImageIds = newItem.imageIds;

    if (selectedProduct) {
      // Actualizar producto existente
      const updatedProduct = {
        ...selectedProduct,
        stock: selectedProduct.stock + parseFloat(newItem.quantity), // sumar cantidad al stock existente
        cost: calculatedValues.unitCost, // actualizar costo
        price: calculatedValues.finalPrice, // actualizar precio
        expiryDate: newItem.expiryDate || selectedProduct.expiryDate, // actualizar vencimiento si se proporciona
        imageIds: finalImageIds // Usar los imageIds del estado
      };
      onAddProduct(updatedProduct, true); // true indica que es una actualización
    } else {
      // Crear nuevo producto
      const newProduct = {
        id: `product_${Date.now()}`,
        ...newItem,
        description: '',
        stock: parseFloat(newItem.quantity), // quantity se convierte en stock
        quantity: parseFloat(newItem.quantity),
        totalCost: calculatedValues.totalCost || parseFloat(newItem.totalCost),
        unitCost: calculatedValues.unitCost,
        cost: calculatedValues.unitCost, // agregar cost para compatibilidad
        price: calculatedValues.finalPrice,
        category: 'Nuevo',
        imageIds: finalImageIds
      };

      onAddProduct(newProduct, false); // false indica que es un producto nuevo
    }

    // Reset form
    setNewItem({ name: '', quantity: '', totalCost: '', unitCost: '', expiryDate: '', imageIds: [] });
    setImageData([]);
    setSelectedProduct(null);
    setShowSuggestions(false);
    setFilteredProducts([]);
    setHighlightedIndex(-1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4" onClick={onClose}>
      <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Agregar/Actualizar</h2>
          <button
            onClick={() => {
              setNewItem({ name: '', quantity: '', totalCost: '', unitCost: '', expiryDate: '', imageIds: [] });
              setImageData([]);
              setSelectedProduct(null);
              setShowSuggestions(false);
              setFilteredProducts([]);
              setHighlightedIndex(-1);
              onClose();
            }}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenido del formulario manual */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleAdd}>
            <div className="space-y-4">
              <div className="relative autocomplete-container">
                <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Nombre * {selectedProduct && <span className="text-green-600">(Producto existente - se actualizará)</span>}
                </label>
                <input
                  type="text"
                  id="name"
                  value={newItem.name}
                  onChange={e => handleNameChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (filteredProducts.length > 0 && !selectedProduct) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-2"
                  required
                />

                {/* Sugerencias de autocompletado */}
                {showSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleSelectExistingProduct(product)}
                        className={`w-full text-left px-3 py-2 text-[var(--color-text-primary)] border-b border-[var(--color-border)] last:border-b-0 flex justify-between items-center transition-colors ${index === highlightedIndex
                          ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                          : 'hover:bg-[var(--color-bg)]'
                          }`}
                      >
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className={`text-sm ${index === highlightedIndex
                            ? 'text-[var(--color-primary-text)] opacity-80'
                            : 'text-[var(--color-text-secondary)]'
                            }`}>
                            Stock: {product.stock} | Precio: ${formatNumber(product.price, allowDecimals)}
                          </div>
                        </div>
                        <div className={`text-xs ${index === highlightedIndex
                          ? 'text-[var(--color-primary-text)]'
                          : 'text-green-600'
                          }`}>
                          Actualizar
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Cantidad *
                </label>
                <input
                  type="number"
                  id="quantity"
                  value={newItem.quantity}
                  onChange={e => {
                    const value = e.target.value;
                    if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 999999.99)) {
                      handleQuantityChange(value);
                    }
                  }}
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-2"
                  step={allowDecimals ? "0.01" : "1"}
                  min="0"
                  max="999999.99"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="totalCost" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Costo Total *
                  </label>
                  <input
                    type="number"
                    id="totalCost"
                    value={newItem.totalCost}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 99999999.99)) {
                        handleTotalCostChange(value);
                      }
                    }}
                    className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-2"
                    step="0.01"
                    min="0"
                    max="99999999.99"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="unitCost" className="block text-sm font-medium text-[var(--color-text-secondary)]">
                    Costo Unitario *
                  </label>
                  <input
                    type="number"
                    id="unitCost"
                    value={newItem.unitCost}
                    onChange={e => {
                      const value = e.target.value;
                      if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 99999999.99)) {
                        handleUnitCostChange(value);
                      }
                    }}
                    className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-2"
                    step="0.01"
                    min="0"
                    max="99999999.99"
                    required
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
                  onChange={e => setNewItem({ ...newItem, expiryDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full border-[var(--color-border)] rounded-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3 py-2"
                />
              </div>

              {/* Sección de imágenes */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  Imágenes (Opcional) - Máximo 3
                </label>

                <input
                  type="file"
                  ref={React.createRef()}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (imageData.length >= 3) {
                        alert('Máximo 3 imágenes permitidas por producto');
                        return;
                      }
                      handleImageUpload(file);
                    }
                    e.target.value = '';
                  }}
                  className="hidden"
                  accept="image/*"
                  id="file-input-add"
                />

                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (imageData.length >= 3) {
                        alert('Máximo 3 imágenes permitidas por producto');
                        return;
                      }
                      document.getElementById('file-input-add').click();
                    }}
                    disabled={imageData.length >= 3 || isProcessingImage}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm flex-1 ${
                      imageData.length >= 3 || isProcessingImage
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                    }`}
                  >
                    <Upload className={`h-4 w-4 ${isProcessingImage ? 'animate-spin' : ''}`} />
                    <span>
                      {isProcessingImage
                        ? 'Procesando...'
                        : imageData.length >= 3 
                          ? 'Máximo 3'
                          : `Subir (${imageData.length}/3)`
                      }
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (imageData.length >= 3) {
                        alert('Máximo 3 imágenes permitidas por producto');
                        return;
                      }
                      setShowManualCamera(true);
                      setTimeout(initializeManualCamera, 100);
                    }}
                    disabled={imageData.length >= 3 || isProcessingImage}
                    className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm flex-1 ${
                      imageData.length >= 3 || isProcessingImage
                        ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    <span>Tomar Foto</span>
                  </button>
                </div>

                {/* Mostrar imágenes subidas */}
                {imageData.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                    {imageData.map((image, index) => (
                      <div key={image.id} className="relative group">
                        <img
                          src={image.data}
                          alt={`Producto ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-[var(--color-border)]"
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

                {/* Interfaz de cámara para modo manual */}
                {showManualCamera && (
                  <div className="mt-4 p-4 bg-[var(--color-bg)] rounded-lg border border-[var(--color-border)]">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-semibold text-[var(--color-text-primary)]">Tomar Foto</h4>
                      <button
                        type="button"
                        onClick={cancelManualCamera}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    {manualCameraStatus && (
                      <div className="mb-2 text-sm font-semibold text-blue-600 text-center">
                        {manualCameraStatus}
                      </div>
                    )}

                    {manualCameraError && (
                      <div className="mb-2 text-sm font-semibold text-red-500 text-center">
                        {manualCameraError}
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
                        ref={manualCameraVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-auto max-h-[250px] rounded-md bg-black mb-3"
                      ></video>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={takeManualPicture}
                          disabled={!!manualCameraError || isProcessingImage}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                          <ImageIcon className="h-4 w-4" />
                          {isProcessingImage ? 'Procesando...' : 'Capturar'}
                        </button>
                        
                        <button
                          type="button"
                          onClick={cancelManualCamera}
                          className="px-3 py-2 bg-gray-500 text-white rounded-lg font-semibold hover:bg-gray-600 text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mostrar cálculos automáticos */}
              {calculatedValues.unitCost > 0 && (
                <div className="text-center p-4 bg-[var(--color-bg)] rounded-lg">
                  <div className="flex justify-around">
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)]">Costo Unitario</p>
                      <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                        ${formatNumber(calculatedValues.unitCost, allowDecimals)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-[var(--color-text-secondary)]">Precio Final</p>
                      <p className="text-lg font-semibold text-green-600">
                        ${formatNumber(calculatedValues.finalPrice, allowDecimals)}
                      </p>
                    </div>
                  </div>
                </div>
              )}


            </div>

            <div className="pt-4 border-t border-[var(--color-border)] flex justify-end mt-6">
              <button
                type="button"
                onClick={() => {
                  setNewItem({ name: '', quantity: '', totalCost: '', unitCost: '', expiryDate: '', imageIds: [] });
                  setImageData([]);
                  setSelectedProduct(null);
                  setShowSuggestions(false);
                  setFilteredProducts([]);
                  setHighlightedIndex(-1);
                  onClose();
                }}
                className="mr-3 bg-[var(--color-bg-secondary)] py-2 px-4 border border-[var(--color-border)] rounded-md shadow-sm text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-bg)]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!newItem.name || !newItem.quantity || (!newItem.totalCost && !newItem.unitCost)}
                className={`${selectedProduct ? 'bg-orange-600 hover:bg-orange-700' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]'} text-[var(--color-primary-text)] py-2 px-4 rounded-lg font-semibold flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                <Plus className="h-5 w-5" />
                {selectedProduct ? 'Actualizar Producto' : 'Agregar al Inventario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProductModal;