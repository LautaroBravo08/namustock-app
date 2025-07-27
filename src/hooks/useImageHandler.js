import { useState } from 'react';
import { saveProductImage, deleteProductImage } from '../firebase/firestore';

export const useImageHandler = (user, maxImages = 3) => {
  const [imageData, setImageData] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  // Función optimizada para procesar imágenes
  const processImage = (file) => {
    return new Promise((resolve, reject) => {
      const processImageData = (imageSrc) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('No se pudo crear contexto de canvas'));
          return;
        }

        img.onload = () => {
          try {
            // Validar dimensiones
            if (img.width === 0 || img.height === 0) {
              reject(new Error('La imagen tiene dimensiones inválidas'));
              return;
            }

            // Calcular dimensiones (máximo 600x450)
            let { width, height } = img;
            const maxWidth = 600;
            const maxHeight = 450;

            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.floor(width * ratio);
              height = Math.floor(height * ratio);
            }

            // Asegurar dimensiones mínimas
            width = Math.max(1, width);
            height = Math.max(1, height);

            // Configurar canvas
            canvas.width = width;
            canvas.height = height;

            // Limpiar canvas
            ctx.clearRect(0, 0, width, height);

            // Configurar calidad de renderizado
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';

            // Dibujar imagen
            ctx.drawImage(img, 0, 0, width, height);

            // Convertir a base64 con compresión
            let quality = 0.8;
            let dataUrl = canvas.toDataURL('image/jpeg', quality);

            // Reducir calidad si es muy grande (máximo 200KB)
            const maxSize = 200 * 1024;
            let attempts = 0;
            while (dataUrl.length * 0.75 > maxSize && quality > 0.3 && attempts < 5) {
              quality -= 0.1;
              dataUrl = canvas.toDataURL('image/jpeg', quality);
              attempts++;
            }

            resolve(dataUrl);
          } catch (canvasError) {
            reject(new Error(`Error procesando imagen en canvas: ${canvasError.message}`));
          }
        };

        img.onerror = () => {
          reject(new Error('La imagen no se pudo cargar. Verifica que el archivo no esté corrupto.'));
        };

        img.src = imageSrc;
      };

      // Usar FileReader
      const reader = new FileReader();
      
      reader.onload = (e) => {
        // Validar que el resultado sea un data URL válido
        if (!e.target.result.startsWith('data:image/')) {
          reject(new Error('El archivo no es una imagen válida'));
          return;
        }
        
        processImageData(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Error al leer el archivo de imagen'));
      };
      
      try {
        reader.readAsDataURL(file);
      } catch (error) {
        reject(new Error('Error al iniciar la lectura del archivo'));
      }
    });
  };

  const addImage = async (file) => {
    if (!user) {
      throw new Error('Debes estar autenticado para subir imágenes');
    }
    
    if (imageData.length >= maxImages) {
      throw new Error(`Máximo ${maxImages} imágenes permitidas por producto`);
    }

    // Validaciones
    if (!file.type.startsWith('image/')) {
      throw new Error('Por favor selecciona solo archivos de imagen');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB máximo
      throw new Error('La imagen es demasiado grande. Máximo 10MB permitido.');
    }

    try {
      const processedDataUrl = await processImage(file);
      
      // Guardar imagen en Firestore
      const { imageId, error } = await saveProductImage(user.uid, processedDataUrl);
      
      if (error) {
        throw new Error(`Error guardando imagen: ${error}`);
      }

      // Actualizar estado local
      const newImageData = [...imageData, { id: imageId, data: processedDataUrl }];
      setImageData(newImageData);
      
      return imageId;
    } catch (error) {
      throw error;
    }
  };

  const removeImage = async (index) => {
    const imageToRemove = imageData[index];
    if (!imageToRemove || !user) return;

    try {
      // Eliminar de Firestore
      const { error } = await deleteProductImage(user.uid, imageToRemove.id);
      if (error) {
        throw new Error('Error al eliminar la imagen');
      }

      // Actualizar estado local
      const newImageData = imageData.filter((_, i) => i !== index);
      setImageData(newImageData);
      
      return imageToRemove.id;
    } catch (error) {
      throw error;
    }
  };

  const setImages = (images) => {
    setImageData(images);
  };

  const clearImages = () => {
    setImageData([]);
  };

  const getImageIds = () => {
    return imageData.map(img => img.id);
  };

  return {
    imageData,
    loadingImages,
    setLoadingImages,
    addImage,
    removeImage,
    setImages,
    clearImages,
    getImageIds,
    canAddMore: imageData.length < maxImages
  };
};