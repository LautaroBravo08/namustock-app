import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

class NotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (!Capacitor.isNativePlatform()) {
      console.log('Notificaciones no disponibles en web');
      return false;
    }

    try {
      // Solicitar permisos
      const permission = await LocalNotifications.requestPermissions();
      
      if (permission.display === 'granted') {
        this.isInitialized = true;
        console.log('Permisos de notificación concedidos');
        return true;
      } else {
        console.log('Permisos de notificación denegados');
        return false;
      }
    } catch (error) {
      console.error('Error inicializando notificaciones:', error);
      return false;
    }
  }

  async scheduleInventoryNotification(lowStockCount, expiringCount) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) return;

    try {
      // Cancelar notificaciones anteriores
      await LocalNotifications.cancel({
        notifications: [{ id: 1 }]
      });

      let title = '📦 Revisión de Inventario';
      let body = '';
      
      if (lowStockCount > 0 && expiringCount > 0) {
        body = `Tienes ${lowStockCount} productos con bajo stock y ${expiringCount} productos por vencer`;
      } else if (lowStockCount > 0) {
        body = `Tienes ${lowStockCount} productos con bajo stock`;
      } else if (expiringCount > 0) {
        body = `Tienes ${expiringCount} productos que están por vencer`;
      } else {
        // No programar notificación si no hay problemas
        return;
      }

      // Programar notificación para mañana a las 9 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 1,
            schedule: { at: tomorrow },
            sound: 'default',
            attachments: null,
            actionTypeId: 'INVENTORY_CHECK',
            extra: {
              action: 'open_inventory',
              lowStockCount,
              expiringCount
            }
          }
        ]
      });

      console.log('Notificación programada para:', tomorrow);
    } catch (error) {
      console.error('Error programando notificación:', error);
    }
  }

  async scheduleDailyNotifications() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized) return;

    try {
      // Programar notificación diaria recurrente
      const now = new Date();
      const scheduledTime = new Date();
      scheduledTime.setHours(9, 0, 0, 0); // 9 AM todos los días

      // Si ya pasaron las 9 AM hoy, programar para mañana
      if (now.getTime() > scheduledTime.getTime()) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      await LocalNotifications.schedule({
        notifications: [
          {
            title: '📦 Revisión Diaria de Inventario',
            body: 'Es hora de revisar tu inventario',
            id: 2,
            schedule: {
              at: scheduledTime,
              repeats: true,
              every: 'day'
            },
            sound: 'default',
            actionTypeId: 'DAILY_CHECK',
            extra: {
              action: 'daily_inventory_check'
            }
          }
        ]
      });

      console.log('Notificación diaria programada para las 9:00 AM');
    } catch (error) {
      console.error('Error programando notificación diaria:', error);
    }
  }

  async handleNotificationAction(notification) {
    const extra = notification.extra;
    
    if (extra && extra.action === 'open_inventory') {
      // Aquí puedes navegar al inventario o mostrar una modal
      console.log('Abrir inventario desde notificación');
      return { action: 'open_inventory', data: extra };
    }
    
    if (extra && extra.action === 'daily_inventory_check') {
      console.log('Revisión diaria activada');
      return { action: 'daily_check' };
    }

    return null;
  }

  async cancelAllNotifications() {
    try {
      await LocalNotifications.cancel({
        notifications: [{ id: 1 }, { id: 2 }]
      });
      console.log('Todas las notificaciones canceladas');
    } catch (error) {
      console.error('Error cancelando notificaciones:', error);
    }
  }
}

export default new NotificationService();