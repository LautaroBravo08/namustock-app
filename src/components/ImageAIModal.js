import React, { useState, useRef, useEffect } from 'react';
import { X, Search, Upload, Camera, Image as ImageIcon, RefreshCw } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useRandomGlow } from '../hooks/useRandomGlow';
import { roundUpToMultiple } from '../utils/helpers';

const ImageAIModal = ({ isOpen, onClose, onProductsFound, themeType, profitMargin, roundingMultiple }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [sourceType, setSourceType] = useState('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const { isGlowActive } = useRandomGlow(isOpen && themeType === 'dark');

  useBodyScrollLock(isOpen);

  // Funciones para manejar la lista de revisión
  const handleAddToReview = (items) => {
    setReviewItems(prev => [...prev, ...items]);
  };

  const handleReviewItemUpdate = (id, field, value) => {
    setReviewItems(currentItems =>
      currentItems.map(item => {
        if (item.id !== id) return item;
        
        const updatedItem = { ...item, [field]: value };
        
        // Recalcular precio si cambia quantity o cost
        if (field === 'quantity' || field === 'cost') {
          const quantity = parseFloat(field === 'quantity' ? value : updatedItem.quantity);
          const cost = parseFloat(field === 'cost' ? value : updatedItem.cost);
          if (!isNaN(quantity) && !isNaN(cost) && quantity > 0 && cost > 0) {
            updatedItem.price = roundUpToMultiple(cost * (1 + profitMargin / 100), roundingMultiple);
          }
        }
        
        return updatedItem;
      })
    );
  };

  const handleRemoveReviewItem = (id) => {
    setReviewItems(currentItems => currentItems.filter(item => item.id !== id));
  };

  const handleConfirmReview = () => {
    if (reviewItems.length > 0) {
      onProductsFound(reviewItems);
      setReviewItems([]);
      setImageSrc(null);
      onClose();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      console.log('⚠️ No se seleccionó ningún archivo');
      return;
    }

    console.log('📸 Cargando archivo para IA:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Cargar imagen directamente sin validaciones restrictivas
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const result = event.target.result;
        if (result) {
          setImageSrc(result);
          console.log('✅ Imagen cargada exitosamente para IA');
        } else {
          console.error('❌ No se pudo obtener el resultado de la imagen');
        }
      } catch (error) {
        console.error('❌ Error procesando imagen:', error);
      }
    };
    
    reader.onerror = (error) => {
      console.error('❌ Error leyendo archivo:', error);
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('❌ Error iniciando lectura:', error);
    }
    
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    e.target.value = '';
  };

  const handleUrlProcess = () => {
    if (imageUrl) {
      setImageSrc(imageUrl);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera: ", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
  };

  const takePicture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setImageSrc(canvas.toDataURL('image/png'));
    stopCamera();
  };

  useEffect(() => {
    if (isOpen && sourceType === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [isOpen, sourceType]);

  const processImage = () => {
    setIsLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      const mockProducts = [
        { 
          id: Date.now() + Math.random(),
          name: 'Producto de Imagen 1', 
          quantity: Math.floor(Math.random() * 5) + 1, 
          cost: Math.floor(Math.random() * 50) + 10,
          price: 0 // Se calculará automáticamente
        },
        { 
          id: Date.now() + Math.random() + 1,
          name: 'Producto de Imagen 2', 
          quantity: Math.floor(Math.random() * 3) + 1, 
          cost: Math.floor(Math.random() * 80) + 20,
          price: 0 // Se calculará automáticamente
        },
      ];
      
      // Calcular precios automáticamente
      const productsWithPrices = mockProducts.map(product => ({
        ...product,
        price: roundUpToMultiple(product.cost * (1 + profitMargin / 100), roundingMultiple)
      }));
      
      handleAddToReview(productsWithPrices);
      setIsLoading(false);
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-2xl border border-[var(--color-border)] ${isGlowActive ? 'dark-glow' : ''} ${themeType === 'light' ? 'light-shadow' : ''}`}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Search /> Analizar Imagen de Productos
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex justify-center gap-2 mb-4 border-b border-[var(--color-border)] pb-4">
            <button 
              onClick={() => setSourceType('upload')} 
              className={`px-4 py-2 rounded-lg font-semibold ${
                sourceType === 'upload' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-[var(--color-bg)]'
              }`}
            >
              <Upload className="inline h-5 w-5 mr-2"/>Subir Archivo
            </button>
            <button 
              onClick={() => setSourceType('camera')} 
              className={`px-4 py-2 rounded-lg font-semibold ${
                sourceType === 'camera' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-[var(--color-bg)]'
              }`}
            >
              <Camera className="inline h-5 w-5 mr-2"/>Usar Cámara
            </button>
            <button 
              onClick={() => setSourceType('url')} 
              className={`px-4 py-2 rounded-lg font-semibold ${
                sourceType === 'url' ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]' : 'bg-[var(--color-bg)]'
              }`}
            >
              <ImageIcon className="inline h-5 w-5 mr-2"/>Desde URL
            </button>
          </div>
          


          <div className="bg-[var(--color-bg)] rounded-lg min-h-[300px] flex items-center justify-center flex-col p-4 border-2 border-dashed border-[var(--color-border)]">
            {sourceType === 'upload' && !imageSrc && (
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="text-[var(--color-text-secondary)]"
              >
                <Upload className="h-12 w-12 mx-auto mb-2"/>
                <span className="font-semibold text-[var(--color-text-primary)]">Haz clic para subir</span> o arrastra y suelta
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-2 max-w-xs">
                  📁 Sube imágenes de cualquier tamaño y formato para análisis de IA
                </div>
              </button>
            )}
            
            {sourceType === 'url' && !imageSrc && (
              <div className="flex w-full max-w-md">
                <input 
                  type="text" 
                  value={imageUrl} 
                  onChange={(e) => setImageUrl(e.target.value)} 
                  placeholder="https://ejemplo.com/imagen.jpg" 
                  className="w-full border-[var(--color-border)] rounded-l-md shadow-sm bg-[var(--color-bg)] text-[var(--color-text-primary)] px-3" 
                />
                <button 
                  onClick={handleUrlProcess} 
                  className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-r-md font-semibold"
                >
                  Cargar
                </button>
              </div>
            )}
            
            {sourceType === 'camera' && !imageSrc && (
              <div className="w-full flex flex-col items-center">
                <video ref={videoRef} autoPlay playsInline className="w-full h-auto max-h-[250px] rounded-md bg-black"></video>
                <button 
                  onClick={takePicture} 
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold"
                >
                  Capturar
                </button>
              </div>
            )}
            
            {imageSrc && (
              <div className="relative">
                <img src={imageSrc} alt="Previsualización" className="max-h-[300px] rounded-lg" />
                <button 
                  onClick={() => setImageSrc(null)} 
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"
                >
                  <X className="h-5 w-5"/>
                </button>
              </div>
            )}
          </div>
          
          <div className="mt-6 flex justify-end">
            <button 
              onClick={processImage} 
              disabled={!imageSrc || isLoading} 
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-wait flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin"/> Procesando...
                </>
              ) : (
                'Analizar y Agregar Productos'
              )}
            </button>
          </div>

          {/* Lista de Revisión */}
          {reviewItems.length > 0 && (
            <div className="mt-6 border-t border-[var(--color-border)] pt-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Lista de Revisión ({reviewItems.length})
                </h3>
                <button 
                  onClick={handleConfirmReview}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Confirmar Todo
                </button>
              </div>
              
              <div className="max-h-60 overflow-y-auto space-y-2">
                {reviewItems.map(item => (
                  <div key={item.id} className="bg-[var(--color-bg)] p-3 rounded-lg border border-[var(--color-border)]">
                    <div className="flex justify-between items-start mb-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => handleReviewItemUpdate(item.id, 'name', e.target.value)}
                        className="font-semibold bg-transparent border-none text-[var(--color-text-primary)] flex-grow mr-2"
                      />
                      <button
                        onClick={() => handleRemoveReviewItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Cantidad</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleReviewItemUpdate(item.id, 'quantity', e.target.value)}
                          className="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Costo</label>
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => handleReviewItemUpdate(item.id, 'cost', e.target.value)}
                          className="w-full bg-transparent border border-[var(--color-border)] rounded px-2 py-1 text-[var(--color-text-primary)]"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--color-text-secondary)]">Precio</label>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded px-2 py-1 text-green-600 font-semibold">
                          ${item.price?.toFixed(2) || '0.00'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAIModal;