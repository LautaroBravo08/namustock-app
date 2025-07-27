import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && product) {
      // Inicializar con imágenes existentes o array vacío
      const images = Array.isArray(product.imageUrls) ? product.imageUrls : [];
      setFormData({
        ...product,
        imageUrls: images
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

  // Función simple y robusta para procesar imágenes
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      console.log('🔍 DEBUG processImage: Iniciando procesamiento simple');
      
      try {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        const originalOnLoad = () => {
          console.log('🔍 DEBUG processImage: Imagen cargada:', {
            width: img.width,
            height: img.height
          });

          try {
            // Calcular dimensiones (máximo 600x450)
            let { width, height } = img;
            const maxWidth = 600;
            const maxHeight = 450;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.floor(width * ratio);
              height = Math.floor(height * ratio);
            }

            console.log('🔍 DEBUG processImage: Nuevas dimensiones:', { width, height });

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Dibujar imagen
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a base64 con compresión
            let quality = 0.8;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);

            // Reducir calidad si es muy grande (máximo 200KB)
            const maxSize = 200 * 1024;
            while (dataUrl.length * 0.75 > maxSize && quality > 0.3) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
            }

            console.log('🔍 DEBUG processImage: Procesamiento completado:', {
              finalQuality: quality,
              dataUrlLength: dataUrl.length,
              estimatedSizeKB: Math.round(dataUrl.length * 0.75 / 1024)
            });

            resolve(dataUrl);
          } catch (canvasError) {
            console.error('❌ DEBUG processImage: Error en canvas:', canvasError);
            reject(new Error(`Error procesando imagen: ${canvasError.message}`));
          }
        };

        img.onload = originalOnLoad;
        img.onerror = (error) => {
          console.error('❌ DEBUG processImage: Error cargando imagen:', error);
          reject(new Error('Error al cargar la imagen'));
        };

        // Usar URL.createObjectURL en lugar de FileReader
        console.log('🔍 DEBUG processImage: Creando URL del objeto...');
        const objectUrl = URL.createObjectURL(file);
        img.src = objectUrl;

        // Limpiar URL después de un tiempo
        setTimeout(() => {
          URL.revokeObjectURL(objectUrl);
        }, 1000);

      } catch (error) {
        console.error('❌ DEBUG processImage: Error general:', error);
        reject(new Error(`Error general: ${error.message}`));
      }
    });
  };



  const handleImageUpload = () => {
    if (!formData.imageUrls || formData.imageUrls.length >= 3) {
      alert('Máximo 3 imágenes permitidas por producto');
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    console.log('🔍 DEBUG: Iniciando handleFileChange');
    
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
      console.log('🔍 DEBUG: Llamando a processImage...');
      const processedDataUrl = await processImage(file);
      
      console.log('🔍 DEBUG: Imagen procesada exitosamente:', {
        originalSize: file.size,
        dataUrlLength: processedDataUrl.length,
        estimatedSizeKB: Math.round(processedDataUrl.length * 0.75 / 1024)
      });
      
      const newImages = [...(formData.imageUrls || []), processedDataUrl];
      console.log('🔍 DEBUG: Actualizando estado con nuevas imágenes:', newImages.length);
      
      setFormData(prev => ({ ...prev, imageUrls: newImages }));
      console.log('✅ Imagen agregada exitosamente');
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

  const removeImage = (index) => {
    const newImages = formData.imageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, imageUrls: newImages }));
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex justify-center items-center p-4">
      <div className={`bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-lg border border-[var(--color-border)]`}>
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Editar Producto</h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
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
              disabled={formData.imageUrls && formData.imageUrls.length >= 3}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${formData.imageUrls && formData.imageUrls.length >= 3
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                }`}
            >
              <Upload className="h-4 w-4" />
              {formData.imageUrls && formData.imageUrls.length >= 3
                ? 'Máximo 3 imágenes'
                : `Subir Imagen (${formData.imageUrls ? formData.imageUrls.length : 0}/3)`
              }
            </button>

            {/* Galería de imágenes */}
            {formData.imageUrls && formData.imageUrls.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.imageUrls.map((imageUrl, index) => (
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
            <div className="text-xs text-[var(--color-text-secondary)] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <strong>📸 Sistema optimizado:</strong> Máximo 3 imágenes por producto. Se comprimen automáticamente a 600x450px con calidad balanceada, máximo 150KB cada una para garantizar sincronización con la base de datos.
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
  );
};

export default EditProductModal;