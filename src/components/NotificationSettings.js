import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Clock, Package, AlertTriangle } from 'lucide-react';
import notificationService from '../services/notificationService';

const NotificationSettings = ({ products }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    // Aquí podrías verificar si las notificaciones están habilitadas
    // Por simplicidad, asumimos que están habilitadas si se inicializó correctamente
    const initialized = await notificationService.initialize();
    setNotificationsEnabled(initialized);
  };

  const toggleNotifications = async () => {
    setIsLoading(true);
    
    try {
      if (notificationsEnabled) {
        // Desactivar notificaciones
        await notificationService.cancelAllNotifications();
        setNotificationsEnabled(false);
      } else {
        // Activar notificaciones
        const success = await notificationService.initialize();
        if (success) {
          await notificationService.scheduleDailyNotifications();
          setNotificationsEnabled(true);
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    if (!notificationsEnabled) return;
    
    // Simular datos para prueba
    const lowStockCount = products?.filter(p => p.quantity <= (p.minStock || 5)).length || 2;
    const expiringCount = products?.filter(p => {
      if (!p.expirationDate) return false;
      const expDate = new Date(p.expirationDate);
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      return expDate <= weekFromNow;
    }).length || 1;

    await notificationService.scheduleInventoryNotification(lowStockCount, expiringCount);
    alert('Notificación de prueba programada para mañana a las 9:00 AM');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {notificationsEnabled ? (
            <Bell className="w-6 h-6 text-blue-600" />
          ) : (
            <BellOff className="w-6 h-6 text-gray-400" />
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones de Inventario
            </h3>
            <p className="text-sm text-gray-600">
              Recibe alertas diarias sobre productos con bajo stock y próximos a vencer
            </p>
          </div>
        </div>
        
        <button
          onClick={toggleNotifications}
          disabled={isLoading}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            notificationsEnabled ? 'bg-blue-600' : 'bg-gray-200'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {notificationsEnabled && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Horario</p>
                <p className="text-xs text-blue-700">Diario a las 9:00 AM</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Package className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-900">Bajo Stock</p>
                <p className="text-xs text-orange-700">≤ Stock mínimo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-900">Por Vencer</p>
                <p className="text-xs text-red-700">Próximos 7 días</p>
              </div>
            </div>
          </div>

          <button
            onClick={testNotification}
            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Probar Notificación
          </button>
        </div>
      )}

      {!notificationsEnabled && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Las notificaciones están desactivadas. Actívalas para recibir alertas automáticas sobre tu inventario.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettings;