import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');

  useEffect(() => {
    // Función para verificar conectividad real
    const checkRealConnectivity = async () => {
      if (!navigator.onLine) {
        setIsOnline(false);
        return;
      }

      try {
        // Intentar hacer una petición pequeña a un servicio confiable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('https://www.google.com/favicon.ico', {
          method: 'HEAD',
          mode: 'no-cors',
          signal: controller.signal,
          cache: 'no-cache'
        });

        clearTimeout(timeoutId);
        setIsOnline(true);
      } catch (error) {
        console.log('Conectividad real no disponible:', error.message);
        setIsOnline(false);
      }
    };

    // Detectar tipo de conexión si está disponible
    const updateConnectionType = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          setConnectionType(connection.effectiveType || connection.type || 'unknown');
        }
      }
    };

    // Event listeners para cambios de conectividad
    const handleOnline = () => {
      console.log('🌐 Evento online detectado');
      checkRealConnectivity();
      updateConnectionType();
    };

    const handleOffline = () => {
      console.log('📴 Evento offline detectado');
      setIsOnline(false);
    };

    // Event listener para cambios en el tipo de conexión
    const handleConnectionChange = () => {
      console.log('🔄 Cambio en la conexión detectado');
      updateConnectionType();
      checkRealConnectivity();
    };

    // Registrar event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listener para cambios en la conexión (si está disponible)
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        connection.addEventListener('change', handleConnectionChange);
      }
    }

    // Verificación inicial
    checkRealConnectivity();
    updateConnectionType();

    // Verificación periódica cada 30 segundos
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        checkRealConnectivity();
      }
    }, 30000);

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (connection) {
          connection.removeEventListener('change', handleConnectionChange);
        }
      }
      
      clearInterval(intervalId);
    };
  }, []);

  return {
    isOnline,
    connectionType
  };
};