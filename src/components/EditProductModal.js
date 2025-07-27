import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { useFormValidation } from '../hooks/useFormValidation';
import { useImageHandler } from '../hooks/useImageHandler';
import { getMultipleProductImages } from '../firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import ImageUploader from './ImageUploader';

const EditProductModal = ({ product, isOpen, onClose, onSave }) => {
  const [user] = useAuthState(auth);
  const { formData, handleChange, resetForm, setFormData } = useFormValidation({});
  
  const { 
    imageData, 
    loadingImages, 
    setLoadingImages,
    addImage, 
    removeImage, 
    setImages, 
    getImageIds, 
    canAddMore 
  } = useImageHandler(user, 3);

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
              setImages([]);
            } else {
              console.log('✅ Imágenes cargadas exitosamente:', images.length);
              setImages(images.filter(img => img.data && !img.error));
            }
          } catch (error) {
            console.error('❌ Error cargando imágenes:', error);
            setImages([]);
          } finally {
            setLoadingImages(false);
          }
        } else {
          setImages([]);
        }
      } else {
        resetForm({});
        setImages([]);
      }
    };

    loadProductData();
  }, [isOpen, product, user, setFormData, setImages, setLoadingImages, resetForm]);

  if (!isOpen || !formData) return null;

  const handleSave = () => {
    // Actualizar formData con los IDs de imágenes actuales
    const updatedFormData = {
      ...formData,
      imageIds: getImageIds()
    };
    onSave(updatedFormData);
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
          <ImageUploader
            imageData={imageData}
            onAddImage={addImage}
            onRemoveImage={removeImage}
            maxImages={3}
            loadingImages={loadingImages}
            canAddMore={canAddMore}
          />
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