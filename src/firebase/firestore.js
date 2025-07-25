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

export const deleteProductImage = async (imageUrl) => {
  try {
    // Extraer la referencia de la URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    
    console.log('✅ Imagen eliminada exitosamente:', imageUrl);
    return { error: null };
  } catch (error) {
    console.error('❌ Error eliminando imagen:', error);
    return { error: error.message };
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