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

    console.log('🖼️ Iniciando optimización de imagen:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`
    });

    // Verificar que es un archivo (más permisivo)
    if (!file || !file.type) {
      reject(new Error('Archivo inválido'));
      return;
    }

    // Ser más permisivo con tipos de imagen
    const isImage = file.type.startsWith('image/') || 
                   file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i);
    
    if (!isImage) {
      reject(new Error('El archivo debe ser una imagen (jpg, png, gif, bmp, webp, svg)'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('No se pudo crear el contexto del canvas'));
      return;
    }

    const img = new Image();

    // Configurar CORS para imágenes externas
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        console.log('🖼️ Imagen cargada:', {
          originalWidth: img.width,
          originalHeight: img.height
        });

        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = img;
        
        // Validar dimensiones originales
        if (width <= 0 || height <= 0) {
          reject(new Error('Dimensiones de imagen inválidas'));
          return;
        }
        
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

        // Asegurar que las dimensiones sean enteros positivos
        width = Math.max(1, Math.floor(width));
        height = Math.max(1, Math.floor(height));

        console.log('🖼️ Nuevas dimensiones:', { width, height });

        // Configurar canvas
        canvas.width = width;
        canvas.height = height;

        // Limpiar canvas
        ctx.clearRect(0, 0, width, height);

        // Configurar calidad de renderizado
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Intentar múltiples formatos si falla uno
        const tryFormats = ['jpeg', 'png', 'webp'];
        let currentFormatIndex = tryFormats.indexOf(format);
        if (currentFormatIndex === -1) currentFormatIndex = 0;

        const attemptConversion = (formatToTry, qualityToTry) => {
          try {
            canvas.toBlob(
              (blob) => {
                if (blob && blob.size > 0) {
                  console.log('🖼️ Conversión exitosa:', {
                    format: formatToTry,
                    quality: qualityToTry,
                    size: `${(blob.size / 1024 / 1024).toFixed(2)} MB`
                  });

                  // Crear un nuevo File object con el blob optimizado
                  const optimizedFile = new File([blob], file.name, {
                    type: `image/${formatToTry}`,
                    lastModified: Date.now()
                  });

                  const reduction = file.size > 0 ? (((file.size - blob.size) / file.size) * 100).toFixed(1) : '0';

                  console.log('🖼️ Imagen optimizada exitosamente:', {
                    original: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
                    optimized: `${(blob.size / 1024 / 1024).toFixed(2)} MB`,
                    reduction: `${reduction}%`,
                    dimensions: `${width}x${height}`,
                    format: formatToTry
                  });

                  resolve({
                    file: optimizedFile,
                    dataUrl: canvas.toDataURL(`image/${formatToTry}`, qualityToTry),
                    originalSize: file.size,
                    optimizedSize: blob.size,
                    dimensions: { width, height },
                    format: formatToTry
                  });
                } else {
                  // Intentar con el siguiente formato
                  currentFormatIndex++;
                  if (currentFormatIndex < tryFormats.length) {
                    console.log(`⚠️ Formato ${formatToTry} falló, intentando ${tryFormats[currentFormatIndex]}`);
                    attemptConversion(tryFormats[currentFormatIndex], qualityToTry);
                  } else {
                    // Intentar con menor calidad
                    if (qualityToTry > 0.3) {
                      console.log(`⚠️ Reduciendo calidad a ${qualityToTry - 0.2}`);
                      currentFormatIndex = 0;
                      attemptConversion(tryFormats[0], qualityToTry - 0.2);
                    } else {
                      reject(new Error('No se pudo generar blob optimizado con ningún formato'));
                    }
                  }
                }
              },
              `image/${formatToTry}`,
              qualityToTry
            );
          } catch (blobError) {
            console.error('Error en toBlob:', blobError);
            // Intentar con el siguiente formato
            currentFormatIndex++;
            if (currentFormatIndex < tryFormats.length) {
              attemptConversion(tryFormats[currentFormatIndex], qualityToTry);
            } else {
              reject(new Error(`Error al convertir imagen: ${blobError.message}`));
            }
          }
        };

        // Iniciar conversión
        attemptConversion(tryFormats[currentFormatIndex], quality);

      } catch (error) {
        console.error('Error procesando imagen:', error);
        reject(new Error(`Error procesando la imagen: ${error.message}`));
      }
    };

    img.onerror = (error) => {
      console.error('Error cargando imagen:', error);
      reject(new Error('Error al cargar la imagen. Verifica que el archivo sea una imagen válida.'));
    };

    // Cargar imagen con manejo de errores mejorado
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        if (e.target.result) {
          img.src = e.target.result;
        } else {
          reject(new Error('No se pudo leer el contenido del archivo'));
        }
      } catch (error) {
        reject(new Error(`Error estableciendo fuente de imagen: ${error.message}`));
      }
    };
    
    reader.onerror = (error) => {
      console.error('Error leyendo archivo:', error);
      reject(new Error('Error al leer el archivo. Verifica que no esté corrupto.'));
    };

    try {
      reader.readAsDataURL(file);
    } catch (error) {
      reject(new Error(`Error iniciando lectura del archivo: ${error.message}`));
    }
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