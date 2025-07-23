// Servicio de actualizaciones automáticas sin hardcode
import config from '../../config/app.config.js';

class UpdateService {
  constructor() {
    this.config = config;
    this.currentVersion = this.config.app.version;
    this.checkInterval = 30 * 60 * 1000; // 30 minutos
    this.intervalId = null;
    this.isChecking = false;
    this.lastCheck = null;
    this.updateAvailable = false;
    this.latestVersion = null;
    this.downloadUrl = null;
  }

  // Obtener información de la versión actual
  getCurrentVersion() {
    return {
      version: this.currentVersion,
      environment: this.config.getCurrentEnvironment(),
      buildDate: new Date().toISOString()
    };
  }

  // Verificar si hay actualizaciones disponibles
  async checkForUpdates(force = false) {
    if (this.isChecking && !force) {
      console.log('🔄 Ya se está verificando actualizaciones...');
      return this.getUpdateStatus();
    }

    // No verificar actualizaciones en desarrollo a menos que se fuerce
    const envConfig = this.config.getEnvironmentConfig();
    if (!envConfig.autoUpdate && !force) {
      console.log('🚫 Actualizaciones automáticas deshabilitadas en este entorno');
      return this.getUpdateStatus();
    }

    this.isChecking = true;
    this.lastCheck = new Date();

    try {
      console.log('🔍 Verificando actualizaciones...');
      
      // Obtener información de la última versión desde GitHub API
      const latestRelease = await this.fetchLatestRelease();
      
      if (!latestRelease) {
        console.log('❌ No se pudo obtener información de la última versión');
        return this.getUpdateStatus();
      }

      this.latestVersion = latestRelease.tag_name.replace('v', '');
      
      // Comparar versiones
      const updateAvailable = this.compareVersions(this.currentVersion, this.latestVersion) < 0;
      
      if (updateAvailable) {
        console.log(`🆕 Nueva versión disponible: ${this.latestVersion} (actual: ${this.currentVersion})`);
        
        // Buscar el APK en los assets
        const apkAsset = latestRelease.assets.find(asset => 
          asset.name.includes('.apk') && asset.name.includes('release')
        );
        
        if (apkAsset) {
          this.downloadUrl = apkAsset.browser_download_url;
          this.updateAvailable = true;
          
          // Notificar sobre la actualización disponible
          await this.notifyUpdateAvailable(this.latestVersion);
        } else {
          console.log('⚠️ No se encontró archivo APK en la release');
        }
      } else {
        console.log('✅ La aplicación está actualizada');
        this.updateAvailable = false;
      }

      return this.getUpdateStatus();

    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return this.getUpdateStatus();
    } finally {
      this.isChecking = false;
    }
  }

  // Obtener información de la última release desde GitHub
  async fetchLatestRelease() {
    try {
      const response = await fetch(`${this.config.repository.apiUrl}/releases/latest`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching latest release:', error);
      
      // Fallback: intentar con version.json local
      try {
        const versionResponse = await fetch('/version.json');
        if (versionResponse.ok) {
          const versionData = await versionResponse.json();
          return {
            tag_name: `v${versionData.version}`,
            assets: [{
              name: 'app-release.apk',
              browser_download_url: versionData.downloads.android
            }]
          };
        }
      } catch (fallbackError) {
        console.error('Fallback también falló:', fallbackError);
      }
      
      return null;
    }
  }

  // Comparar versiones (retorna -1 si v1 < v2, 0 si iguales, 1 si v1 > v2)
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    
    return 0;
  }

  // Obtener estado actual de actualizaciones
  getUpdateStatus() {
    return {
      currentVersion: this.currentVersion,
      latestVersion: this.latestVersion,
      updateAvailable: this.updateAvailable,
      downloadUrl: this.downloadUrl,
      lastCheck: this.lastCheck,
      isChecking: this.isChecking
    };
  }

  // Notificar sobre actualización disponible
  async notifyUpdateAvailable(newVersion) {
    const notificationConfig = this.config.notifications.updateAvailable;
    
    // Verificar si las notificaciones están disponibles
    if ('Notification' in window) {
      // Solicitar permiso si no lo tenemos
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
      
      if (Notification.permission === 'granted') {
        const notification = new Notification(
          notificationConfig.title,
          {
            body: notificationConfig.body.replace('{appName}', this.config.app.displayName),
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'update-available',
            requireInteraction: true,
            actions: [
              { action: 'update', title: 'Actualizar' },
              { action: 'later', title: 'Más tarde' }
            ]
          }
        );
        
        notification.onclick = () => {
          this.downloadUpdate();
          notification.close();
        };
      }
    }

    // También disparar evento personalizado para que la UI pueda reaccionar
    window.dispatchEvent(new CustomEvent('updateAvailable', {
      detail: {
        currentVersion: this.currentVersion,
        newVersion: newVersion,
        downloadUrl: this.downloadUrl
      }
    }));
  }

  // Descargar e instalar actualización
  async downloadUpdate() {
    if (!this.updateAvailable || !this.downloadUrl) {
      console.log('❌ No hay actualización disponible para descargar');
      return false;
    }

    try {
      console.log('📥 Iniciando descarga de actualización...');
      
      // En un entorno web, redirigir a la descarga
      if (window.location.protocol === 'https:' || window.location.protocol === 'http:') {
        window.open(this.downloadUrl, '_blank');
        return true;
      }
      
      // En Capacitor/Cordova, usar plugins nativos si están disponibles
      if (window.Capacitor) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: this.downloadUrl });
        return true;
      }
      
      // Fallback: abrir en nueva ventana
      window.open(this.downloadUrl, '_blank');
      return true;
      
    } catch (error) {
      console.error('❌ Error descargando actualización:', error);
      return false;
    }
  }

  // Iniciar verificación automática periódica
  startAutoCheck() {
    if (this.intervalId) {
      console.log('🔄 La verificación automática ya está activa');
      return;
    }

    const envConfig = this.config.getEnvironmentConfig();
    if (!envConfig.autoUpdate) {
      console.log('🚫 Verificación automática deshabilitada en este entorno');
      return;
    }

    console.log(`🕐 Iniciando verificación automática cada ${this.checkInterval / 60000} minutos`);
    
    // Verificar inmediatamente
    this.checkForUpdates();
    
    // Configurar intervalo
    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, this.checkInterval);
  }

  // Detener verificación automática
  stopAutoCheck() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('⏹️ Verificación automática detenida');
    }
  }

  // Configurar intervalo de verificación
  setCheckInterval(minutes) {
    this.checkInterval = minutes * 60 * 1000;
    
    if (this.intervalId) {
      this.stopAutoCheck();
      this.startAutoCheck();
    }
    
    console.log(`⏰ Intervalo de verificación actualizado a ${minutes} minutos`);
  }

  // Forzar actualización inmediata
  async forceUpdate() {
    console.log('🚀 Forzando verificación de actualización...');
    return await this.checkForUpdates(true);
  }

  // Obtener historial de versiones
  async getVersionHistory() {
    try {
      const response = await fetch(`${this.config.repository.apiUrl}/releases`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const releases = await response.json();
      
      return releases.map(release => ({
        version: release.tag_name.replace('v', ''),
        date: release.published_at,
        notes: release.body,
        downloadUrl: release.assets.find(asset => asset.name.includes('.apk'))?.browser_download_url
      }));
      
    } catch (error) {
      console.error('Error obteniendo historial de versiones:', error);
      return [];
    }
  }

  // Limpiar recursos
  destroy() {
    this.stopAutoCheck();
    this.isChecking = false;
    this.updateAvailable = false;
    this.latestVersion = null;
    this.downloadUrl = null;
  }
}

// Crear instancia singleton
const updateService = new UpdateService();

// Inicializar automáticamente en producción
if (updateService.config.getCurrentEnvironment() === 'production') {
  // Esperar a que la aplicación esté completamente cargada
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => updateService.startAutoCheck(), 5000); // Esperar 5 segundos
    });
  } else {
    setTimeout(() => updateService.startAutoCheck(), 5000);
  }
}

export default updateService;