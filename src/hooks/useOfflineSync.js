import { useState, useEffect, useCallback } from 'react';
import { 
  saveProducts, 
  getProducts, 
  saveSale, 
  getSales, 
  saveUserSettings, 
  getUserSettings 
} from '../firebase/firestore';

// Claves para localStorage
const STORAGE_KEYS = {
  PRODUCTS: 'namustock_products_offline',
  SALES: 'namustock_sales_offline',
  SETTINGS: 'namustock_settings_offline',
  PENDING_SYNC: 'namustock_pending_sync',
  LAST_SYNC: 'namustock_last_sync'
};

export const useOfflineSync = (user) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Detectar cambios en la conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Conexión restaurada - iniciando sincronización');
      if (user) {
        syncPendingChanges();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📴 Sin conexión - modo offline activado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  // Cargar datos pendientes al iniciar
  useEffect(() => {
    loadPendingChanges();
    loadLastSyncTime();
  }, []);

  const loadPendingChanges = () => {
    try {
      const pending = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      if (pending) {
        const pendingData = JSON.parse(pending);
        setPendingChanges(Object.keys(pendingData).length);
      }
    } catch (error) {
      console.error('Error cargando cambios pendientes:', error);
    }
  };

  const loadLastSyncTime = () => {
    try {
      const lastSync = localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
      if (lastSync) {
        setLastSyncTime(new Date(lastSync));
      }
    } catch (error) {
      console.error('Error cargando última sincronización:', error);
    }
  };

  // Guardar datos localmente
  const saveToLocal = (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      console.log(`💾 Datos guardados localmente: ${key}`);
    } catch (error) {
      console.error(`Error guardando ${key} localmente:`, error);
    }
  };

  // Cargar datos localmente
  const loadFromLocal = (key, defaultValue = null) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error(`Error cargando ${key} localmente:`, error);
      return defaultValue;
    }
  };

  // Marcar cambio como pendiente de sincronización
  const markPendingSync = (type, data) => {
    try {
      const pending = loadFromLocal(STORAGE_KEYS.PENDING_SYNC, {});
      pending[type] = {
        data,
        timestamp: new Date().toISOString(),
        type
      };
      saveToLocal(STORAGE_KEYS.PENDING_SYNC, pending);
      setPendingChanges(Object.keys(pending).length);
      console.log(`⏳ Marcado para sincronización: ${type}`);
    } catch (error) {
      console.error('Error marcando cambio pendiente:', error);
    }
  };

  // Sincronizar cambios pendientes
  const syncPendingChanges = useCallback(async () => {
    if (!user || !isOnline || isSyncing) return;

    setIsSyncing(true);
    console.log('🔄 Iniciando sincronización...');

    try {
      const pending = loadFromLocal(STORAGE_KEYS.PENDING_SYNC, {});
      const pendingKeys = Object.keys(pending);

      if (pendingKeys.length === 0) {
        console.log('✅ No hay cambios pendientes');
        setIsSyncing(false);
        return;
      }

      let syncedCount = 0;
      const failedSyncs = {};

      // Sincronizar productos
      if (pending.products) {
        try {
          const { error } = await saveProducts(user.uid, pending.products.data);
          if (!error) {
            console.log('✅ Productos sincronizados');
            syncedCount++;
          } else {
            failedSyncs.products = pending.products;
            console.error('❌ Error sincronizando productos:', error);
          }
        } catch (error) {
          failedSyncs.products = pending.products;
          console.error('❌ Error sincronizando productos:', error);
        }
      }

      // Sincronizar ventas pendientes
      if (pending.sales) {
        try {
          const sales = pending.sales.data;
          for (const sale of sales) {
            const { error } = await saveSale(user.uid, sale);
            if (error) {
              console.error('❌ Error sincronizando venta:', error);
              failedSyncs.sales = failedSyncs.sales || [];
              failedSyncs.sales.push(sale);
            }
          }
          if (!failedSyncs.sales) {
            console.log('✅ Ventas sincronizadas');
            syncedCount++;
          }
        } catch (error) {
          failedSyncs.sales = pending.sales;
          console.error('❌ Error sincronizando ventas:', error);
        }
      }

      // Sincronizar configuraciones
      if (pending.settings) {
        try {
          const { error } = await saveUserSettings(user.uid, pending.settings.data);
          if (!error) {
            console.log('✅ Configuraciones sincronizadas');
            syncedCount++;
          } else {
            failedSyncs.settings = pending.settings;
            console.error('❌ Error sincronizando configuraciones:', error);
          }
        } catch (error) {
          failedSyncs.settings = pending.settings;
          console.error('❌ Error sincronizando configuraciones:', error);
        }
      }

      // Actualizar cambios pendientes (solo los que fallaron)
      saveToLocal(STORAGE_KEYS.PENDING_SYNC, failedSyncs);
      setPendingChanges(Object.keys(failedSyncs).length);

      // Actualizar tiempo de última sincronización
      const now = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, now);
      setLastSyncTime(new Date(now));

      console.log(`🎉 Sincronización completada: ${syncedCount} elementos sincronizados`);
      
      if (Object.keys(failedSyncs).length > 0) {
        console.log(`⚠️ ${Object.keys(failedSyncs).length} elementos fallaron en la sincronización`);
      }

    } catch (error) {
      console.error('❌ Error durante la sincronización:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [user, isOnline, isSyncing]);

  // Funciones para manejar datos con soporte offline
  const handleProducts = {
    save: async (products) => {
      // Guardar localmente siempre
      saveToLocal(STORAGE_KEYS.PRODUCTS, products);

      if (user && isOnline) {
        try {
          const { error } = await saveProducts(user.uid, products);
          if (error) {
            markPendingSync('products', products);
            return { error: 'Guardado localmente - se sincronizará cuando haya conexión' };
          }
          return { error: null };
        } catch (error) {
          markPendingSync('products', products);
          return { error: 'Guardado localmente - se sincronizará cuando haya conexión' };
        }
      } else {
        if (user) {
          markPendingSync('products', products);
        }
        return { error: null };
      }
    },

    load: async () => {
      // Intentar cargar de Firebase si hay conexión
      if (user && isOnline) {
        try {
          const { products, error } = await getProducts(user.uid);
          if (!error && products) {
            // Actualizar cache local
            saveToLocal(STORAGE_KEYS.PRODUCTS, products);
            return { products, error: null };
          }
        } catch (error) {
          console.log('Error cargando de Firebase, usando datos locales');
        }
      }

      // Cargar de cache local
      const localProducts = loadFromLocal(STORAGE_KEYS.PRODUCTS, []);
      return { products: localProducts, error: null };
    }
  };

  const handleSales = {
    save: async (sale) => {
      // Guardar en cache local
      const localSales = loadFromLocal(STORAGE_KEYS.SALES, []);
      const newSales = [...localSales, sale];
      saveToLocal(STORAGE_KEYS.SALES, newSales);

      if (user && isOnline) {
        try {
          const { error, id } = await saveSale(user.uid, sale);
          if (error) {
            markPendingSync('sales', [sale]);
            return { error: 'Guardado localmente - se sincronizará cuando haya conexión', id: sale.id };
          }
          return { error: null, id };
        } catch (error) {
          markPendingSync('sales', [sale]);
          return { error: 'Guardado localmente - se sincronizará cuando haya conexión', id: sale.id };
        }
      } else {
        if (user) {
          markPendingSync('sales', [sale]);
        }
        return { error: null, id: sale.id };
      }
    },

    load: async () => {
      // Intentar cargar de Firebase si hay conexión
      if (user && isOnline) {
        try {
          const { sales, error } = await getSales(user.uid);
          if (!error && sales) {
            // Actualizar cache local
            saveToLocal(STORAGE_KEYS.SALES, sales);
            return { sales, error: null };
          }
        } catch (error) {
          console.log('Error cargando ventas de Firebase, usando datos locales');
        }
      }

      // Cargar de cache local
      const localSales = loadFromLocal(STORAGE_KEYS.SALES, []);
      return { sales: localSales, error: null };
    }
  };

  const handleSettings = {
    save: async (settings) => {
      // Guardar localmente siempre
      saveToLocal(STORAGE_KEYS.SETTINGS, settings);

      if (user && isOnline) {
        try {
          const { error } = await saveUserSettings(user.uid, settings);
          if (error) {
            markPendingSync('settings', settings);
          }
          return { error };
        } catch (error) {
          markPendingSync('settings', settings);
          return { error: error.message };
        }
      } else {
        if (user) {
          markPendingSync('settings', settings);
        }
        return { error: null };
      }
    },

    load: async () => {
      // Intentar cargar de Firebase si hay conexión
      if (user && isOnline) {
        try {
          const { settings, error } = await getUserSettings(user.uid);
          if (!error && settings) {
            // Actualizar cache local
            saveToLocal(STORAGE_KEYS.SETTINGS, settings);
            return { settings, error: null };
          }
        } catch (error) {
          console.log('Error cargando configuraciones de Firebase, usando datos locales');
        }
      }

      // Cargar de cache local
      const localSettings = loadFromLocal(STORAGE_KEYS.SETTINGS, null);
      return { settings: localSettings, error: null };
    }
  };

  // Limpiar datos locales (útil al cerrar sesión)
  const clearLocalData = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    setPendingChanges(0);
    setLastSyncTime(null);
    console.log('🧹 Datos locales limpiados');
  };

  return {
    isOnline,
    isSyncing,
    pendingChanges,
    lastSyncTime,
    syncPendingChanges,
    handleProducts,
    handleSales,
    handleSettings,
    clearLocalData
  };
};