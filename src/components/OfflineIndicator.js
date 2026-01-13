import React from 'react';
import { Wifi, WifiOff, RefreshCw, Clock, AlertCircle } from 'lucide-react';

const OfflineIndicator = ({ 
  isOnline, 
  isSyncing, 
  pendingChanges, 
  lastSyncTime, 
  onSyncClick,
  themeType = 'light' 
}) => {
  const formatLastSync = (date) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Hace un momento';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-500';
    if (isSyncing) return 'text-blue-500';
    if (pendingChanges > 0) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Sin conexión';
    if (isSyncing) return 'Sincronizando...';
    if (pendingChanges > 0) return `${pendingChanges} cambios pendientes`;
    return 'Sincronizado';
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4" />;
    if (isSyncing) return <RefreshCw className="w-4 h-4 animate-spin" />;
    if (pendingChanges > 0) return <AlertCircle className="w-4 h-4" />;
    return <Wifi className="w-4 h-4" />;
  };

  return (
    <div className={`
      fixed top-16 right-4 z-50 
      bg-[var(--color-card)] 
      border border-[var(--color-border)] 
      rounded-lg shadow-lg p-3 
      transition-all duration-300 ease-in-out
      ${themeType === 'dark' ? 'shadow-black/20' : 'shadow-gray-200'}
    `}>
      <div className="flex items-center space-x-2">
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <div className="text-sm">
          <div className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </div>
          {lastSyncTime && (
            <div className="text-xs text-[var(--color-text-secondary)] flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Última sync: {formatLastSync(lastSyncTime)}</span>
            </div>
          )}
        </div>
        
        {/* Botón de sincronización manual */}
        {isOnline && pendingChanges > 0 && !isSyncing && (
          <button
            onClick={onSyncClick}
            className="
              ml-2 p-1 rounded-full 
              bg-[var(--color-primary)] 
              text-white 
              hover:bg-[var(--color-primary-hover)] 
              transition-colors duration-200
            "
            title="Sincronizar ahora"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
      
      {/* Barra de progreso para sincronización */}
      {isSyncing && (
        <div className="mt-2 w-full bg-[var(--color-bg-secondary)] rounded-full h-1">
          <div className="bg-[var(--color-primary)] h-1 rounded-full animate-pulse w-full"></div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;