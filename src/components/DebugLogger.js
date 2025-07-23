import React, { useState, useEffect } from 'react';
import { X, Bug } from 'lucide-react';

const DebugLogger = () => {
  const [logs, setLogs] = useState([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Interceptar console.log para capturar logs
    const originalLog = console.log;
    const originalError = console.error;

    console.log = (...args) => {
      const message = args.join(' ');
      
      // Solo capturar logs relacionados con actualizaciones
      if (message.includes('🔍') || message.includes('📱') || message.includes('🐙') || 
          message.includes('✅') || message.includes('❌') || message.includes('COMPARANDO') ||
          message.includes('📦') || message.includes('FORZANDO')) {
        setLogs(prev => [...prev.slice(-20), {
          id: Date.now(),
          message,
          type: 'log',
          timestamp: new Date().toLocaleTimeString()
        }]);
      }
      
      originalLog.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      setLogs(prev => [...prev.slice(-20), {
        id: Date.now(),
        message,
        type: 'error',
        timestamp: new Date().toLocaleTimeString()
      }]);
      originalError.apply(console, args);
    };

    // Escuchar evento personalizado del UserMenu
    const handleShowDebugLogger = () => {
      setIsVisible(true);
    };

    window.addEventListener('showDebugLogger', handleShowDebugLogger);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      window.removeEventListener('showDebugLogger', handleShowDebugLogger);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  // Solo mostrar si está visible (controlado desde UserMenu)
  if (!isVisible) {
    return null;
  }

  return (
    <>

      {/* Panel de logs */}
      {isVisible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full h-2/3 rounded-t-lg overflow-hidden">
            <div className="bg-gray-800 text-white p-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Bug className="h-5 w-5" />
                <span className="font-semibold">Debug Logs ({logs.length})</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={clearLogs}
                  className="text-gray-300 hover:text-white text-sm px-2 py-1 rounded"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setIsVisible(false)}
                  className="text-gray-300 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            <div className="p-3 h-full overflow-y-auto bg-gray-900 text-green-400 font-mono text-sm">
              {logs.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  No hay logs aún. Prueba "Comprobar actualizaciones" en el menú de usuario.
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`mb-2 ${log.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>
                    <span className="text-gray-500 text-xs">[{log.timestamp}]</span> {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DebugLogger;