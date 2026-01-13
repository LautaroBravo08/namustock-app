// Configuración de la aplicación para optimización de rendimiento

export const APP_CONFIG = {
  // Configuración de carga
  LOADING: {
    SHOW_LOADING_SCREEN: false, // No mostrar pantalla de carga
    INSTANT_UI: true, // Mostrar UI inmediatamente
    BACKGROUND_SYNC: true, // Sincronizar en segundo plano
    PRELOAD_LOCAL_DATA: true // Precargar datos locales
  },

  // Configuración de sincronización
  SYNC: {
    AUTO_SYNC_ON_CONNECT: true, // Sincronizar automáticamente al conectar
    RETRY_ATTEMPTS: 3, // Número de reintentos
    RETRY_DELAY: 5000, // Delay entre reintentos (ms)
    SYNC_INTERVAL: 30000, // Intervalo de verificación de conectividad (ms)
    BATCH_SYNC: true // Sincronizar en lotes
  },

  // Configuración de UI
  UI: {
    SHOW_SYNC_INDICATOR: true, // Mostrar indicador de sincronización
    SHOW_OFFLINE_NOTIFICATIONS: true, // Mostrar notificaciones offline
    COMPACT_INDICATORS: false, // Usar indicadores compactos
    AUTO_HIDE_NOTIFICATIONS: true, // Auto-ocultar notificaciones
    NOTIFICATION_DURATION: 3000 // Duración de notificaciones (ms)
  },

  // Configuración de almacenamiento
  STORAGE: {
    USE_LOCAL_STORAGE: true, // Usar localStorage
    COMPRESS_DATA: false, // Comprimir datos (futuro)
    CACHE_IMAGES: false, // Cachear imágenes (futuro)
    AUTO_CLEANUP: true // Limpiar datos automáticamente
  },

  // Configuración de rendimiento
  PERFORMANCE: {
    LAZY_LOAD_IMAGES: true, // Carga lazy de imágenes
    VIRTUAL_SCROLLING: false, // Scroll virtual (futuro)
    DEBOUNCE_SEARCH: 300, // Debounce para búsqueda (ms)
    THROTTLE_SYNC: 1000 // Throttle para sincronización (ms)
  }
};

// Configuración específica por plataforma
export const PLATFORM_CONFIG = {
  web: {
    ...APP_CONFIG,
    STORAGE: {
      ...APP_CONFIG.STORAGE,
      USE_INDEXED_DB: false // No usar IndexedDB por ahora
    }
  },
  
  mobile: {
    ...APP_CONFIG,
    UI: {
      ...APP_CONFIG.UI,
      COMPACT_INDICATORS: true // Usar indicadores compactos en móvil
    },
    PERFORMANCE: {
      ...APP_CONFIG.PERFORMANCE,
      LAZY_LOAD_IMAGES: true,
      VIRTUAL_SCROLLING: true // Activar scroll virtual en móvil
    }
  },
  
  desktop: {
    ...APP_CONFIG,
    SYNC: {
      ...APP_CONFIG.SYNC,
      SYNC_INTERVAL: 15000 // Sincronizar más frecuentemente en desktop
    }
  }
};

// Función para obtener configuración según la plataforma
export const getConfig = () => {
  // Detectar plataforma
  const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isElectron = window.electron !== undefined;
  
  if (isElectron) {
    return PLATFORM_CONFIG.desktop;
  } else if (isMobile) {
    return PLATFORM_CONFIG.mobile;
  } else {
    return PLATFORM_CONFIG.web;
  }
};

export default APP_CONFIG;