// Utilidades para procesamiento y compresión de imágenes

/**
 * Comprime una imagen para que no exceda el límite de Firestore (1MB)
 * @param {File} file - Archivo de imagen
 * @param {number} maxSizeKB - Tamaño máximo en KB (por defecto 700KB para dejar margen)
 * @param {number} maxWidth - Ancho máximo en píxeles
 * @param {number} maxHeight - Alto máximo en píxeles
 * @returns {Promise<string>} - Data URL de la imagen comprimida
 */
export const compressImage = (file, maxSizeKB = 700, maxWidth = 1024, maxHeight = 1024) => {
  return new Promise((resolve, reject) => {
    // Verificar que sea un archivo de imagen
    if (!file.type.startsWith('image/')) {
      reject(new Error('El archivo debe ser una imagen válida (JPEG, PNG, GIF, WebP)'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calcular nuevas dimensiones manteniendo la proporción
        let { width, height } = calculateDimensions(img.width, img.height, maxWidth, maxHeight);
        
        // Configurar canvas con mejor calidad
        canvas.width = width;
        canvas.height = height;
        
        // Configurar contexto para mejor calidad
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // Dibujar imagen redimensionada
        ctx.drawImage(img, 0, 0, width, height);
        
        // Comprimir iterativamente hasta alcanzar el tamaño deseado
        compressIteratively(canvas, maxSizeKB, resolve, reject);
        
      } catch (error) {
        reject(new Error('Error procesando la imagen: ' + error.message));
      }
    };

    img.onerror = () => {
      reject(new Error('Error cargando la imagen. Verifique que el archivo no esté corrupto.'));
    };

    // Crear URL temporal para cargar la imagen
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.onerror = () => {
      reject(new Error('Error leyendo el archivo de imagen'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Calcula las nuevas dimensiones manteniendo la proporción
 */
const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth;
  let height = originalHeight;

  // Redimensionar si excede el ancho máximo
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  // Redimensionar si excede el alto máximo
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
};

/**
 * Comprime iterativamente hasta alcanzar el tamaño deseado
 */
const compressIteratively = (canvas, maxSizeKB, resolve, reject, quality = 0.8) => {
  try {
    // Intentar primero con JPEG para mejor compresión
    let dataUrl = canvas.toDataURL('image/jpeg', quality);
    let sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
    
    console.log(`🖼️ Imagen procesada (JPEG): ${sizeKB}KB con calidad ${quality}`);
    
    if (sizeKB <= maxSizeKB || quality <= 0.1) {
      resolve(dataUrl);
      return;
    }
    
    // Si JPEG no funciona bien, intentar con WebP si está disponible
    if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
      dataUrl = canvas.toDataURL('image/webp', quality);
      sizeKB = Math.round((dataUrl.length * 3) / 4 / 1024);
      
      console.log(`🖼️ Imagen procesada (WebP): ${sizeKB}KB con calidad ${quality}`);
      
      if (sizeKB <= maxSizeKB || quality <= 0.1) {
        resolve(dataUrl);
        return;
      }
    }
    
    // Reducir calidad y volver a intentar
    const newQuality = Math.max(0.1, quality - 0.15);
    compressIteratively(canvas, maxSizeKB, resolve, reject, newQuality);
    
  } catch (error) {
    reject(new Error('Error comprimiendo la imagen: ' + error.message));
  }
};

/**
 * Función de compresión con fallback automático
 * Intenta diferentes estrategias si la compresión principal falla
 */
export const compressImageWithFallback = async (file, maxSizeKB = 700) => {
  try {
    // Intentar compresión principal
    return await compressImage(file, maxSizeKB, 1024, 1024);
  } catch (error) {
    console.warn('⚠️ Compresión principal falló, intentando fallback:', error.message);
    
    try {
      // Fallback 1: Compresión más agresiva
      return await compressImage(file, maxSizeKB, 800, 800);
    } catch (error2) {
      console.warn('⚠️ Fallback 1 falló, intentando fallback 2:', error2.message);
      
      try {
        // Fallback 2: Compresión muy agresiva
        return await compressImage(file, maxSizeKB, 600, 600);
      } catch (error3) {
        console.warn('⚠️ Fallback 2 falló, usando conversión simple:', error3.message);
        
        // Fallback final: Conversión simple (puede exceder límite)
        const simpleBase64 = await fileToBase64(file);
        const sizeKB = Math.round((simpleBase64.length * 3) / 4 / 1024);
        
        if (sizeKB > 900) { // Si es muy grande, rechazar
          throw new Error(`La imagen es demasiado grande (${sizeKB}KB). Intente con una imagen más pequeña o de menor resolución.`);
        }
        
        console.log(`📸 Usando imagen sin compresión: ${sizeKB}KB`);
        return simpleBase64;
      }
    }
  }
};

/**
 * Función simple para convertir archivo a base64 (fallback)
 */
export const fileToBase64 = (file) => {
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

/**
 * Valida el tipo de archivo de imagen
 */
export const validateImageFile = (file) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB máximo para el archivo original
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Tipo de archivo no válido. Use JPEG, PNG, GIF o WebP.');
  }
  
  if (file.size > maxSize) {
    throw new Error('El archivo es demasiado grande. Máximo 10MB.');
  }
  
  return true;
};