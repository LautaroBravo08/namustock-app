import React, { useRef } from 'react';
import { Upload, Trash2 } from 'lucide-react';

const ImageUploader = ({ 
  imageData, 
  onAddImage, 
  onRemoveImage, 
  maxImages = 3, 
  loadingImages = false,
  canAddMore = true 
}) => {
  const fileInputRef = useRef(null);

  const handleImageUpload = () => {
    if (!canAddMore) {
      alert(`Máximo ${maxImages} imágenes permitidas por producto`);
      return;
    }
    fileInputRef.current.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await onAddImage(file);
    } catch (error) {
      alert(`Error al procesar la imagen: ${error.message}`);
    }

    // Limpiar input
    event.target.value = '';
  };

  const handleRemoveImage = async (index) => {
    try {
      await onRemoveImage(index);
    } catch (error) {
      alert('Error al eliminar la imagen');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
        Imágenes del Producto (Máximo {maxImages})
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
        disabled={!canAddMore || loadingImages}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
          !canAddMore || loadingImages
            ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
            : 'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]'
        }`}
      >
        <Upload className="h-4 w-4" />
        {loadingImages 
          ? 'Cargando imágenes...'
          : !canAddMore 
            ? `Máximo ${maxImages} imágenes`
            : `Subir Imagen (${imageData.length}/${maxImages})`
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
                onClick={() => handleRemoveImage(index)}
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

      {/* Información sobre las imágenes */}
      <div className="text-xs text-[var(--color-text-secondary)] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
        <strong>📸 Sistema optimizado:</strong> Máximo {maxImages} imágenes por producto. Se comprimen automáticamente a 600x450px con calidad balanceada, máximo 150KB cada una para garantizar sincronización con la base de datos.
      </div>
    </div>
  );
};

export default ImageUploader;