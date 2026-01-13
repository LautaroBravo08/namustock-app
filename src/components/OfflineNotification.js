import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi, AlertTriangle, CheckCircle } from 'lucide-react';

const OfflineNotification = ({ isOnline, pendingChanges }) => {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationType, setNotificationType] = useState('offline');
  const [wasOffline, setWasOffline] = useState(!isOnline);

  useEffect(() => {
    // Mostrar notificación cuando se pierde la conexión
    if (!isOnline && !wasOffline) {
      setNotificationType('offline');
      setShowNotification(true);
      setWasOffline(true);
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => setShowNotification(false), 5000);
    }
    
    // Mostrar notificación cuando se recupera la conexión
    if (isOnline && wasOffline) {
      setNotificationType('online');
      setShowNotification(true);
      setWasOffline(false);
      
      // Auto-ocultar después de 3 segundos
      setTimeout(() => setShowNotification(false), 3000);
    }
  }, [isOnline, wasOffline]);

  // Mostrar notificación de cambios pendientes
  useEffect(() => {
    if (pendingChanges > 0 && isOnline) {
      setNotificationType('pending');
      setShowNotification(true);
      
      // Auto-ocultar después de 4 segundos
      setTimeout(() => setShowNotification(false), 4000);
    }
  }, [pendingChanges, isOnline]);

  const getNotificationConfig = () => {
    switch (notificationType) {
      case 'offline':
        return {
          icon: <WifiOff className="w-5 h-5" />,
          title: 'Sin conexión',
          message: 'Trabajando en modo offline. Los cambios se sincronizarán cuando se restaure la conexión.',
          bgColor: 'bg-red-500',
          textColor: 'text-white'
        };
      case 'online':
        return {
          icon: <Wifi className="w-5 h-5" />,
          title: 'Conexión restaurada',
          message: pendingChanges > 0 
            ? `Sincronizando ${pendingChanges} cambios pendientes...`
            : 'Todos los datos están sincronizados.',
          bgColor: 'bg-green-500',
          textColor: 'text-white'
        };
      case 'pending':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          title: 'Cambios pendientes',
          message: `${pendingChanges} cambios esperando sincronización.`,
          bgColor: 'bg-yellow-500',
          textColor: 'text-white'
        };
      default:
        return null;
    }
  };

  if (!showNotification) return null;

  const config = getNotificationConfig();
  if (!config) return null;

  return (
    <div className={`
      fixed top-4 left-1/2 transform -translate-x-1/2 z-50
      ${config.bgColor} ${config.textColor}
      rounded-lg shadow-lg p-4 max-w-md w-full mx-4
      transition-all duration-300 ease-in-out
      animate-slide-down
    `}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {config.title}
          </p>
          <p className="text-sm opacity-90 mt-1">
            {config.message}
          </p>
        </div>
        <button
          onClick={() => setShowNotification(false)}
          className="flex-shrink-0 ml-2 text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;