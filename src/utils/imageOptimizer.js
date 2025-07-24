/**
 * Utilidad para optimizar imágenes antes de subirlas
 * Redimensiona y comprime imágenes automáticamente
 */

export const optimizeImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    const {
      maxWidth = 800,
      maxHeight = 600,
      quality = 0.8,
      format = 'jpeg'
    } = options;

    // Verificar que es un archivo de imagen
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        
        // Redimensionar si excede los límites
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Convertir a blob optimizado
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Crear un nuevo File object con el blob optimizado
              const optimizedFile = new File([blob], file.name, {
                type: `image/${format}`,
                lastModified: Date.now()
              });

              console.log('🖼️ Imagen optimizada:', {
                original: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                optimized: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                reduction: `${(((file.size - blob.size) / file.size) * 100).toFixed(1)}%`,
                dimensions: `${width}x${height}`
              });

              resolve({
                file: optimizedFile,
                dataUrl: canvas.toDataURL(`image/${format}`, quality),
                originalSize: file.size,
                optimizedSize: blob.size,
                dimensions: { width, height }
              });
            } else {
              reject(new Error('Error al optimizar la imagen'));
            }
          },
          `image/${format}`,
          quality
        );
      } catch (error) {
        reject(new Error(`Error procesando la imagen: ${error.message}`));
      }
    };

    img.onerror = () => {
      reject(new Error('Error al cargar la imagen'));
    };

    // Cargar imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Optimizar imagen con configuración específica para productos
 */
export const optimizeProductImage = (file) => {
  return optimizeImage(file, {
    maxWidth: 800,
    maxHeight: 600,
    quality: 0.85,
    format: 'jpeg'
  });
};

/**
 * Optimizar imagen para análisis de IA (más pequeña)
 */
export const optimizeImageForAI = (file) => {
  return optimizeImage(file, {
    maxWidth: 512,
    maxHeight: 512,
    quality: 0.7,
    format: 'jpeg'
  });
};

/**
 * Verificar si una imagen necesita optimización
 */
export const needsOptimization = (file, maxSizeMB = 2) => {
  const fileSizeMB = file.size / 1024 / 1024;
  return fileSizeMB > maxSizeMB;
};

/**
 * Obtener información de una imagen
 */
export const getImageInfo = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
        sizeMB: (file.size / 1024 / 1024).toFixed(2),
        type: file.type,
        name: file.name
      });
    };

    img.onerror = () => {
      reject(new Error('No se pudo cargar la información de la imagen'));
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};