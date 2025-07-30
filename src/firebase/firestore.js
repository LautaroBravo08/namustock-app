import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  deleteDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './config';

// Productos
export const saveProducts = async (userId, products) => {
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'products'), {
      products: products,
      lastUpdated: new Date().toISOString()
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getProducts = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'products');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { products: docSnap.data().products || [], error: null };
    } else {
      return { products: [], error: null };
    }
  } catch (error) {
    return { products: [], error: error.message };
  }
};

// Escuchar cambios en productos en tiempo real
export const onProductsChange = (userId, callback) => {
  const docRef = doc(db, 'users', userId, 'data', 'products');
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data().products || []);
    } else {
      callback([]);
    }
  });
};

// Ventas
export const saveSale = async (userId, sale) => {
  try {
    // Excluir el ID temporal antes de guardar en Firebase
    const { id, ...saleWithoutId } = sale;
    
    const docRef = await addDoc(collection(db, 'users', userId, 'sales'), {
      ...saleWithoutId,
      createdAt: new Date().toISOString()
    });
    console.log('🔥 Firebase: Venta guardada con ID:', docRef.id);
    console.log('🔥 Firebase: ID temporal excluido:', id);
    return { error: null, id: docRef.id };
  } catch (error) {
    console.error('🔥 Firebase: Error guardando venta:', error);
    return { error: error.message };
  }
};

export const getSales = async (userId) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'sales'), 
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const sales = [];
    
    querySnapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    
    return { sales, error: null };
  } catch (error) {
    return { sales: [], error: error.message };
  }
};

// Escuchar cambios en ventas en tiempo real
export const onSalesChange = (userId, callback) => {
  const q = query(
    collection(db, 'users', userId, 'sales'), 
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const sales = [];
    querySnapshot.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    callback(sales);
  });
};

// Eliminar ventas
export const deleteSales = async (userId, saleIds) => {
  try {
    console.log('🔥 Firebase: Iniciando eliminación de ventas:', saleIds);
    
    if (!saleIds || saleIds.length === 0) {
      console.log('⚠️ Firebase: No hay ventas para eliminar');
      return { success: true };
    }

    const batch = writeBatch(db);
    
    // Verificar que las ventas existen antes de eliminarlas
    const existingIds = [];
    for (const saleId of saleIds) {
      const saleRef = doc(db, 'users', userId, 'sales', saleId);
      try {
        const saleDoc = await getDoc(saleRef);
        if (saleDoc.exists()) {
          existingIds.push(saleId);
          batch.delete(saleRef);
          console.log(`🗑️ Firebase: Agregando venta ${saleId} al batch para eliminar`);
        } else {
          console.log(`⚠️ Firebase: Venta ${saleId} no existe en Firebase`);
        }
      } catch (docError) {
        console.error(`❌ Firebase: Error verificando venta ${saleId}:`, docError);
      }
    }

    if (existingIds.length === 0) {
      console.log('⚠️ Firebase: Ninguna de las ventas existe en Firebase');
      return { success: true, message: 'No hay ventas válidas para eliminar' };
    }

    console.log(`🔥 Firebase: Ejecutando batch delete para ${existingIds.length} ventas`);
    await batch.commit();
    
    console.log('✅ Firebase: Ventas eliminadas exitosamente:', existingIds);
    return { 
      success: true, 
      deletedIds: existingIds,
      message: `${existingIds.length} venta(s) eliminada(s) de Firebase`
    };
    
  } catch (error) {
    console.error("❌ Firebase: Error eliminando ventas:", error);
    return { 
      error: error.message,
      code: error.code || 'unknown-error'
    };
  }
};

// Función para limpiar TODAS las ventas de Firebase (para resolver el problema de IDs)
export const deleteAllSales = async (userId) => {
  try {
    console.log('🧹 Firebase: Limpiando TODAS las ventas de Firebase...');
    
    const q = query(collection(db, 'users', userId, 'sales'));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('✅ Firebase: No hay ventas para limpiar');
      return { success: true, deletedCount: 0 };
    }
    
    const batch = writeBatch(db);
    let deletedCount = 0;
    
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deletedCount++;
      console.log(`🗑️ Firebase: Agregando venta ${doc.id} al batch para eliminar`);
    });
    
    await batch.commit();
    
    console.log(`✅ Firebase: ${deletedCount} ventas eliminadas completamente de Firebase`);
    return { success: true, deletedCount };
    
  } catch (error) {
    console.error("❌ Firebase: Error limpiando todas las ventas:", error);
    return { error: error.message };
  }
};

// Configuración del usuario
export const saveUserSettings = async (userId, settings) => {
  try {
    await setDoc(doc(db, 'users', userId, 'data', 'settings'), {
      ...settings,
      lastUpdated: new Date().toISOString()
    });
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

export const getUserSettings = async (userId) => {
  try {
    const docRef = doc(db, 'users', userId, 'data', 'settings');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { settings: docSnap.data(), error: null };
    } else {
      return { settings: null, error: null };
    }
  } catch (error) {
    return { settings: null, error: error.message };
  }
};

// Funciones para manejar imágenes de productos por separado con chunks
export const saveProductImage = async (userId, imageData) => {
  try {
    console.log('🔥 Guardando imagen en Firestore con sistema de chunks...');
    
    // Crear ID único para la imagen
    const imageId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Configuración de chunks (900KB por chunk para estar seguros del límite de 1MB)
    const CHUNK_SIZE = 900 * 1024; // 900KB en bytes
    const base64Data = imageData.split(',')[1] || imageData; // Remover prefijo data:image si existe
    
    // Calcular número de chunks necesarios
    const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
    console.log(`📦 Dividiendo imagen en ${totalChunks} chunks de máximo ${CHUNK_SIZE} bytes`);
    
    // Crear documento principal con metadata
    await setDoc(doc(db, 'users', userId, 'productImages', imageId), {
      totalChunks: totalChunks,
      originalSize: base64Data.length,
      createdAt: new Date().toISOString(),
      mimeType: imageData.includes('data:') ? imageData.split(';')[0].split(':')[1] : 'image/jpeg'
    });
    
    // Guardar cada chunk por separado
    const batch = writeBatch(db);
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, base64Data.length);
      const chunkData = base64Data.slice(start, end);
      
      const chunkRef = doc(db, 'users', userId, 'productImages', imageId, 'chunks', `chunk_${i}`);
      batch.set(chunkRef, {
        data: chunkData,
        chunkIndex: i,
        size: chunkData.length
      });
    }
    
    await batch.commit();
    console.log(`✅ Imagen guardada con ID: ${imageId} (${totalChunks} chunks)`);
    return { imageId: imageId, error: null };
  } catch (error) {
    console.error('❌ Error guardando imagen:', error);
    return { imageId: null, error: error.message };
  }
};

export const getProductImage = async (userId, imageId) => {
  try {
    console.log(`🔍 Recuperando imagen ${imageId} con sistema de chunks...`);
    
    // Obtener metadata de la imagen
    const imageRef = doc(db, 'users', userId, 'productImages', imageId);
    const imageSnap = await getDoc(imageRef);
    
    if (!imageSnap.exists()) {
      return { imageData: null, error: 'Imagen no encontrada' };
    }
    
    const metadata = imageSnap.data();
    
    // Si es una imagen antigua (sin chunks), devolver directamente
    if (metadata.imageData) {
      console.log('📷 Imagen antigua encontrada, devolviendo directamente');
      return { imageData: metadata.imageData, error: null };
    }
    
    // Si es una imagen nueva con chunks, reconstruir
    const { totalChunks, mimeType } = metadata;
    console.log(`📦 Reconstruyendo imagen de ${totalChunks} chunks`);
    
    // Obtener todos los chunks
    const chunksQuery = query(
      collection(db, 'users', userId, 'productImages', imageId, 'chunks'),
      orderBy('chunkIndex')
    );
    const chunksSnapshot = await getDocs(chunksQuery);
    
    if (chunksSnapshot.empty) {
      return { imageData: null, error: 'Chunks de imagen no encontrados' };
    }
    
    // Reconstruir la imagen base64
    let reconstructedData = '';
    chunksSnapshot.forEach((chunkDoc) => {
      const chunkData = chunkDoc.data();
      reconstructedData += chunkData.data;
    });
    
    // Agregar prefijo data URL si es necesario
    const fullImageData = reconstructedData.startsWith('data:') 
      ? reconstructedData 
      : `data:${mimeType || 'image/jpeg'};base64,${reconstructedData}`;
    
    console.log(`✅ Imagen reconstruida exitosamente (${reconstructedData.length} caracteres)`);
    return { imageData: fullImageData, error: null };
    
  } catch (error) {
    console.error('❌ Error recuperando imagen:', error);
    return { imageData: null, error: error.message };
  }
};

export const deleteProductImage = async (userId, imageId) => {
  try {
    console.log(`🗑️ Eliminando imagen ${imageId} y sus chunks...`);
    
    // Primero obtener metadata para saber si tiene chunks
    const imageRef = doc(db, 'users', userId, 'productImages', imageId);
    const imageSnap = await getDoc(imageRef);
    
    if (imageSnap.exists()) {
      const metadata = imageSnap.data();
      
      // Si tiene chunks, eliminarlos primero
      if (metadata.totalChunks && metadata.totalChunks > 0) {
        console.log(`🗑️ Eliminando ${metadata.totalChunks} chunks...`);
        
        // Obtener todos los chunks
        const chunksQuery = query(
          collection(db, 'users', userId, 'productImages', imageId, 'chunks')
        );
        const chunksSnapshot = await getDocs(chunksQuery);
        
        // Eliminar chunks en batch
        const batch = writeBatch(db);
        chunksSnapshot.forEach((chunkDoc) => {
          batch.delete(chunkDoc.ref);
        });
        
        await batch.commit();
        console.log(`✅ ${chunksSnapshot.size} chunks eliminados`);
      }
    }
    
    // Eliminar documento principal
    await deleteDoc(imageRef);
    console.log('✅ Imagen eliminada:', imageId);
    return { error: null };
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    return { error: error.message };
  }
};

export const getMultipleProductImages = async (userId, imageIds) => {
  try {
    if (!imageIds || imageIds.length === 0) {
      return { images: [], error: null };
    }

    const imagePromises = imageIds.map(async (imageId) => {
      const result = await getProductImage(userId, imageId);
      return {
        id: imageId,
        data: result.imageData,
        error: result.error
      };
    });

    const images = await Promise.all(imagePromises);
    return { images, error: null };
  } catch (error) {
    return { images: [], error: error.message };
  }
};

// Función para migrar imágenes existentes al nuevo sistema de chunks
export const migrateExistingImages = async (userId) => {
  try {
    console.log('🔄 Iniciando migración de imágenes existentes...');
    
    // Obtener todas las imágenes existentes
    const imagesQuery = query(collection(db, 'users', userId, 'productImages'));
    const imagesSnapshot = await getDocs(imagesQuery);
    
    if (imagesSnapshot.empty) {
      console.log('✅ No hay imágenes para migrar');
      return { migratedCount: 0, error: null };
    }
    
    let migratedCount = 0;
    const batch = writeBatch(db);
    
    for (const imageDoc of imagesSnapshot.docs) {
      const imageData = imageDoc.data();
      
      // Solo migrar imágenes que tienen imageData directamente (formato antiguo)
      if (imageData.imageData && !imageData.totalChunks) {
        console.log(`🔄 Migrando imagen ${imageDoc.id}...`);
        
        const base64Data = imageData.imageData.split(',')[1] || imageData.imageData;
        const CHUNK_SIZE = 900 * 1024;
        const totalChunks = Math.ceil(base64Data.length / CHUNK_SIZE);
        
        // Actualizar metadata del documento principal
        batch.update(imageDoc.ref, {
          totalChunks: totalChunks,
          originalSize: base64Data.length,
          mimeType: imageData.imageData.includes('data:') 
            ? imageData.imageData.split(';')[0].split(':')[1] 
            : 'image/jpeg',
          // Remover imageData del documento principal
          imageData: null
        });
        
        // Crear chunks
        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, base64Data.length);
          const chunkData = base64Data.slice(start, end);
          
          const chunkRef = doc(db, 'users', userId, 'productImages', imageDoc.id, 'chunks', `chunk_${i}`);
          batch.set(chunkRef, {
            data: chunkData,
            chunkIndex: i,
            size: chunkData.length
          });
        }
        
        migratedCount++;
      }
    }
    
    if (migratedCount > 0) {
      await batch.commit();
      console.log(`✅ ${migratedCount} imágenes migradas exitosamente`);
    }
    
    return { migratedCount, error: null };
  } catch (error) {
    console.error('❌ Error migrando imágenes:', error);
    return { migratedCount: 0, error: error.message };
  }
};

// Función para obtener estadísticas de almacenamiento de imágenes
export const getImageStorageStats = async (userId) => {
  try {
    const imagesQuery = query(collection(db, 'users', userId, 'productImages'));
    const imagesSnapshot = await getDocs(imagesQuery);
    
    let totalImages = 0;
    let totalSize = 0;
    let chunkedImages = 0;
    let legacyImages = 0;
    
    imagesSnapshot.forEach((doc) => {
      const data = doc.data();
      totalImages++;
      
      if (data.totalChunks) {
        chunkedImages++;
        totalSize += data.originalSize || 0;
      } else if (data.imageData) {
        legacyImages++;
        totalSize += data.size || data.imageData.length || 0;
      }
    });
    
    return {
      totalImages,
      totalSize,
      chunkedImages,
      legacyImages,
      averageSize: totalImages > 0 ? Math.round(totalSize / totalImages) : 0,
      error: null
    };
  } catch (error) {
    return { error: error.message };
  }
};

// Funciones para manejar imágenes en Firebase Storage
export const uploadProductImage = async (userId, productId, file, imageIndex) => {
  try {
    // Crear referencia única para la imagen
    const timestamp = Date.now();
    const fileName = `${productId}_${imageIndex}_${timestamp}.jpg`;
    const imageRef = ref(storage, `users/${userId}/products/${fileName}`);
    
    // Subir archivo
    const snapshot = await uploadBytes(imageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Imagen subida exitosamente:', downloadURL);
    return { url: downloadURL, error: null };
  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    return { url: null, error: error.message };
  }
};



// Función helper para convertir File a Blob optimizado
export const optimizeImageFile = (file, maxWidth = 1200, maxHeight = 900, quality = 0.8) => {
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
      
      // Dibujar y comprimir con buena calidad
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
};