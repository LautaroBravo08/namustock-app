import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && product) {
      // Initialize with existing images or empty array (max 3)
      const images = Array.isArray(product.imageUrls) ? product.imageUrls.filter(url => url).slice(0, 3) : [];
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
    if (formData.imageUrls.length >= 3) {
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
      const newImageUrls = [...formData.imageUrls, compressedDataUrl];
      setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));

      console.log('✅ Imagen procesada exitosamente');
    } catch (error) {
      console.error('Error procesando imagen:', error);
      alert('Error al procesar la imagen');
    }

    // Clear input
    event.target.value = '';
  };

  const removeImage = (index) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));
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
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*"
          />

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

            {/* Botón para subir imagen */}
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={formData.imageUrls.length >= 3}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${formData.imageUrls.length >= 3
                ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
                }`}
            >
              <Upload className="h-4 w-4" />
              {formData.imageUrls.length >= 3 ? 'Máximo 3 imágenes' : `Subir Imagen (${formData.imageUrls.length}/3)`}
            </button>

            {/* Galería de imágenes */}
            {formData.imageUrls.length > 0 && (
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
            <div className="text-xs text-[var(--color-text-secondary)] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <strong>📸 Imágenes optimizadas:</strong> Máximo 3 imágenes por producto. Se comprimen inteligentemente a 800x600px con 75% de calidad, máximo 200KB cada una para evitar errores de almacenamiento (máximo 15MB de archivo original).
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