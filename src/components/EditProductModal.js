import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { saveProductImage, getMultipleProductImages, deleteProductImage } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);
  const [user] = useAuthState(auth);
  const [loadingImages, setLoadingImages] = useState(false);
  const [imageData, setImageData] = useState([]); // Para almacenar las imágenes cargadas

  useBodyScrollLock(isOpen);

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
      }
    };

    loadProductData();
  }, [isOpen, product, user]);

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

  // Función ultra simple - solo convierte a base64 sin procesamiento
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Error leyendo el archivo'));
      };
      
      reader.readAsDataURL(file);
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
      const newImageIds = [...(formData.imageIds || []), imageId];
      
      setImageData(newImageData);
      setFormData(prev => ({ ...prev, imageIds: newImageIds }));
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
      const newImageIds = formData.imageIds.filter((_, i) => i !== index);
      
      setImageData(newImageData);
      setFormData(prev => ({ ...prev, imageIds: newImageIds }));
      
      console.log('✅ Imagen eliminada exitosamente');
    } catch (error) {
      console.error('❌ Error eliminando imagen:', error);
      alert('Error al eliminar la imagen');
    }
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
              disabled={imageData.length >= 3 || loadingImages}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                imageData.length >= 3 || loadingImages
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
              }`}
            >
              <Upload className="h-4 w-4" />
              {loadingImages 
                ? 'Cargando imágenes...'
                : imageData.length >= 3 
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

            {/* Indicador de carga */}
            {loadingImages && (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-primary)]"></div>
                <p className="text-sm text-[var(--color-text-secondary)] mt-2">Cargando imágenes...</p>
              </div>
            )}


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