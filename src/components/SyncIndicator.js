import React from 'react';
import { RefreshCw, Wifi, WifiOff, Check } from 'lucide-react';

const SyncIndicator = ({ 
  isOnline, 
  isSyncing, 
  pendingChanges, 
  themeType = 'light',
  compact = false 
}) => {
  if (!isOnline && pendingChanges === 0) {
    return null; // No mostrar nada si no hay conexión y no hay cambios pendientes
  }

  const getStatusInfo = () => {
    if (!isOnline) {
      return {
        icon: <WifiOff className="w-3 h-3" />,
        text: compact ? 'Offline' : 'Sin conexión',
        color: 'text-red-500',
        bgColor: 'bg-red-50 border-red-200',
        darkBgColor: 'dark:bg-red-900/20 dark:border-red-800'
      };
    }
    
    if (isSyncing) {
      return {
        icon: <RefreshCw className="w-3 h-3 animate-spin" />,
        text: compact ? 'Sync...' : 'Sincronizando...',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50 border-blue-200',
        darkBgColor: 'dark:bg-blue-900/20 dark:border-blue-800'
      };
    }
    
    if (pendingChanges > 0) {
      return {
        icon: <RefreshCw className="w-3 h-3" />,
        text: compact ? `${pendingChanges}` : `${pendingChanges} pendientes`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50 border-yellow-200',
        darkBgColor: 'dark:bg-yellow-900/20 dark:border-yellow-800'
      };
    }
    
    return {
      icon: <Check className="w-3 h-3" />,
      text: compact ? 'OK' : 'Sincronizado',
      color: 'text-green-500',
      bgColor: 'bg-green-50 border-green-200',
      darkBgColor: 'dark:bg-green-900/20 dark:border-green-800'
    };
  };

  const status = getStatusInfo();

  if (compact) {
    return (
      <div className={`
        inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs
        border ${status.bgColor} ${status.darkBgColor} ${status.color}
        transition-all duration-200
      `}>
        {status.icon}
        <span>{status.text}</span>
      </div>
    );
  }

  return (
    <div className={`
      fixed bottom-4 right-4 z-40
      flex items-center space-x-2 px-3 py-2 rounded-lg text-sm
      border ${status.bgColor} ${status.darkBgColor} ${status.color}
      shadow-sm transition-all duration-300 ease-in-out
      ${themeType === 'dark' ? 'shadow-black/10' : 'shadow-gray-200/50'}
    `}>
      {status.icon}
      <span className="font-medium">{status.text}</span>
    </div>
  );
};

export default SyncIndicator;