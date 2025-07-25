import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Camera, Trash2 } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import CameraConfirmationModal from './CameraConfirmationModal';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState(null);
  const fileInputRef = useRef(null);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && product) {
      // Initialize with existing images or empty array
      const images = Array.isArray(product.imageUrls) ? product.imageUrls.filter(url => url) : [];
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

  const compressImage = (file, maxWidth = 800, maxHeight = 600, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
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

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const addImage = (imageDataUrl) => {
    const newImageUrls = [...formData.imageUrls, imageDataUrl];
    setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));
  };

  const removeImage = (index) => {
    const newImageUrls = formData.imageUrls.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, imageUrls: newImageUrls }));
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleCameraClick = () => {
    setIsCameraModalOpen(true);
  };

  const handleConfirmPhoto = async (photoDataUrl) => {
    // Convert data URL back to blob for compression
    const response = await fetch(photoDataUrl);
    const blob = await response.blob();
    const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });

    try {
      const compressedDataUrl = await compressImage(file);
      addImage(compressedDataUrl);
    } catch (error) {
      console.error('Error comprimiendo foto:', error);
      addImage(photoDataUrl); // Fallback to original if compression fails
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona solo archivos de imagen');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('La imagen es demasiado grande. Máximo 10MB permitido.');
      return;
    }

    try {
      const compressedDataUrl = await compressImage(file);
      addImage(compressedDataUrl);
    } catch (error) {
      console.error('Error comprimiendo imagen:', error);
      alert('Error al procesar la imagen');
    }

    // Clear input to allow selecting the same file again
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

            <div className="space-y-4">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                Imágenes del Producto
              </label>

              {/* Add Image Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleUploadClick}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-[var(--color-primary-text)] rounded-lg hover:bg-[var(--color-primary-hover)] transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Subir Imagen
                </button>
                <button
                  type="button"
                  onClick={handleCameraClick}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                  Tomar Foto
                </button>
              </div>

              {/* Image Gallery */}
              {formData.imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formData.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={imageUrl}
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

              <div className="text-xs text-[var(--color-text-secondary)] bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <strong>📸 Solo subida y cámara:</strong> Las imágenes se comprimen automáticamente a 800x600px para optimizar el almacenamiento. Puedes subir archivos o tomar fotos directamente.
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