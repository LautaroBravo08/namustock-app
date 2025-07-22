// Servicio de actualización multiplataforma
import { Capacitor } from '@capacitor/core';

class UpdateService {
  constructor() {
    this.currentVersion = process.env.REACT_APP_VERSION || '1.0.0';
    this.updateCheckInterval = parseInt(process.env.REACT_APP_UPDATE_CHECK_INTERVAL) || 300000; // 5 minutos por defecto
    this.isChecking = false;
    this.listeners = [];
    
    // Log de inicialización
    console.log('🚀 UpdateService inicializado:', {
      currentVersion: this.currentVersion,
      platform: this.getPlatform(),
      checkInterval: this.updateCheckInterval,
      simulateUpdate: process.env.REACT_APP_SIMULATE_UPDATE
    });
  }

  // Agregar listener para cambios de estado
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remover listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(l => l !== callback);
  }

  // Notificar a todos los listeners
  notifyListeners(data) {
    this.listeners.forEach(callback => callback(data));
  }

  // Detectar plataforma
  getPlatform() {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform(); // 'ios' o 'android'
    } else if (window.electronAPI) {
      return 'electron';
    } else {
      return 'web';
    }
  }

  // Verificar si hay actualizaciones disponibles
  async checkForUpdates() {
    if (this.isChecking) return null;
    
    this.isChecking = true;
    const platform = this.getPlatform();

    try {
      switch (platform) {
        case 'web':
          return await this.checkWebUpdate();
        case 'electron':
          return await this.checkElectronUpdate();
        case 'android':
        case 'ios':
          return await this.checkMobileUpdate();
        default:
          return null;
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      return null;
    } finally {
      this.isChecking = false;
    }
  }

  // Verificar actualizaciones para web/PWA
  async checkWebUpdate() {
    try {
      // Verificar versión desde el servidor
      const response = await fetch('/version.json?' + Date.now());
      if (response.ok) {
        const serverVersion = await response.json();
        
        // Obtener versión actual desde localStorage o usar la por defecto
        const currentVersion = localStorage.getItem('app-version') || this.currentVersion;
        
        if (this.isNewerVersion(serverVersion.version, currentVersion)) {
          return {
            available: true,
            version: serverVersion.version,
            currentVersion: currentVersion,
            buildDate: serverVersion.buildDate,
            features: serverVersion.features,
            platform: 'web',
            type: 'version-check'
          };
        }
      }

      // Verificar si hay un service worker con actualización pendiente
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Forzar verificación de actualización
          await registration.update();
          
          // Verificar si hay una nueva versión esperando
          if (registration.waiting) {
            return {
              available: true,
              version: 'nueva versión',
              platform: 'web',
              type: 'service-worker'
            };
          }
        }
      }
    } catch (error) {
      console.log('Web update check failed:', error);
    }
    
    return { available: false, platform: 'web' };
  }

  // Verificar actualizaciones para Electron
  async checkElectronUpdate() {
    try {
      if (window.electronAPI && window.electronAPI.checkForUpdates) {
        const updateInfo = await window.electronAPI.checkForUpdates();
        return {
          available: updateInfo.available,
          version: updateInfo.version,
          platform: 'electron',
          downloadProgress: updateInfo.downloadProgress
        };
      }
    } catch (error) {
      console.log('Electron update check failed:', error);
    }
    
    return { available: false, platform: 'electron' };
  }

  // Verificar actualizaciones para móvil
  async checkMobileUpdate() {
    try {
      const platform = Capacitor.getPlatform();
      console.log(`🔍 Verificando actualizaciones para ${platform}...`);
      console.log(`📱 Versión actual: ${this.currentVersion}`);

      // Opción 1: Verificar desde tu propio servidor/API
      try {
        const response = await fetch('/version.json?' + Date.now());
        if (response.ok) {
          const serverVersion = await response.json();
          console.log(`🌐 Versión del servidor: ${serverVersion.version}`);
          
          if (this.isNewerVersion(serverVersion.version, this.currentVersion)) {
            return {
              available: true,
              version: serverVersion.version,
              currentVersion: this.currentVersion,
              platform: platform,
              buildDate: serverVersion.buildDate,
              features: serverVersion.features,
              downloadUrl: this.getMobileDownloadUrlFromServer(serverVersion, platform),
              releaseNotes: serverVersion.releaseNotes || 'Nueva versión disponible'
            };
          }
        }
      } catch (serverError) {
        console.log('📡 Server version check failed, trying GitHub...', serverError);
      }

      // Opción 2: Verificar desde GitHub (si tienes un repositorio configurado)
      const githubRepo = process.env.REACT_APP_GITHUB_REPO; // ej: "usuario/repo"
      if (githubRepo) {
        try {
          const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`);
          if (response.ok) {
            const release = await response.json();
            const latestVersion = release.tag_name.replace('v', '');
            console.log(`🐙 GitHub versión: ${latestVersion}`);
            
            if (this.isNewerVersion(latestVersion, this.currentVersion)) {
              return {
                available: true,
                version: latestVersion,
                currentVersion: this.currentVersion,
                platform: platform,
                downloadUrl: this.getMobileDownloadUrl(release),
                releaseNotes: release.body || 'Nueva versión disponible'
              };
            }
          }
        } catch (githubError) {
          console.log('🐙 GitHub check failed:', githubError);
        }
      }

      // Opción 3: Simulación para desarrollo/testing
      if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_SIMULATE_UPDATE === 'true') {
        console.log('🧪 Modo desarrollo: simulando actualización disponible');
        return {
          available: true,
          version: '2.0.0',
          currentVersion: this.currentVersion,
          platform: platform,
          downloadUrl: 'https://example.com/app-release.apk',
          releaseNotes: 'Versión de prueba para desarrollo',
          isSimulated: true
        };
      }

      console.log('✅ No hay actualizaciones disponibles');
      return { available: false, platform: platform, currentVersion: this.currentVersion };

    } catch (error) {
      console.error('❌ Mobile update check failed:', error);
      return { available: false, platform: Capacitor.getPlatform(), error: error.message };
    }
  }

  // Obtener URL de descarga para móvil desde el servidor
  getMobileDownloadUrlFromServer(serverVersion, platform) {
    if (serverVersion.downloads && serverVersion.downloads[platform]) {
      return serverVersion.downloads[platform];
    }
    
    // URLs por defecto basadas en la plataforma
    const baseUrl = serverVersion.baseUrl || window.location.origin;
    if (platform === 'android') {
      return `${baseUrl}/downloads/app-release-${serverVersion.version}.apk`;
    } else if (platform === 'ios') {
      return `${baseUrl}/downloads/app-release-${serverVersion.version}.ipa`;
    }
    
    return null;
  }

  // Obtener URL de descarga para móvil desde GitHub
  getMobileDownloadUrl(release) {
    const platform = Capacitor.getPlatform();
    const asset = release.assets.find(asset => {
      if (platform === 'android') {
        return asset.name.endsWith('.apk');
      } else if (platform === 'ios') {
        return asset.name.endsWith('.ipa');
      }
      return false;
    });
    
    return asset ? asset.browser_download_url : null;
  }

  // Comparar versiones
  isNewerVersion(newVersion, currentVersion) {
    const newParts = newVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);
    
    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;
      
      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }
    
    return false;
  }

  // Aplicar actualización
  async applyUpdate(updateInfo) {
    const platform = updateInfo.platform;

    try {
      switch (platform) {
        case 'web':
          return await this.applyWebUpdate(updateInfo);
        case 'electron':
          return await this.applyElectronUpdate();
        case 'android':
        case 'ios':
          return await this.applyMobileUpdate(updateInfo);
        default:
          throw new Error('Plataforma no soportada');
      }
    } catch (error) {
      console.error('Error applying update:', error);
      throw error;
    }
  }

  // Aplicar actualización web
  async applyWebUpdate(updateInfo) {
    try {
      if (updateInfo.type === 'service-worker') {
        // Activar service worker en espera
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.getRegistration();
          if (registration && registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
            
            // Esperar a que se active y luego recargar
            return new Promise((resolve) => {
              const handleMessage = (event) => {
                if (event.data && event.data.type === 'NEW_VERSION_ACTIVATED') {
                  navigator.serviceWorker.removeEventListener('message', handleMessage);
                  // Guardar nueva versión en localStorage
                  if (updateInfo.version) {
                    localStorage.setItem('app-version', updateInfo.version);
                  }
                  window.location.reload();
                  resolve(true);
                }
              };
              
              navigator.serviceWorker.addEventListener('message', handleMessage);
              
              // Timeout de seguridad
              setTimeout(() => {
                navigator.serviceWorker.removeEventListener('message', handleMessage);
                window.location.reload();
                resolve(true);
              }, 3000);
            });
          }
        }
      } else {
        // Guardar nueva versión en localStorage
        if (updateInfo.version) {
          localStorage.setItem('app-version', updateInfo.version);
        }
        
        // Limpiar cache del navegador
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }
        
        // Recargar la página para obtener la nueva versión
        window.location.reload(true);
        return true;
      }
    } catch (error) {
      console.error('Error applying web update:', error);
      // Fallback: recargar página
      window.location.reload();
    }
    return false;
  }

  // Aplicar actualización Electron
  async applyElectronUpdate() {
    if (window.electronAPI && window.electronAPI.installUpdate) {
      await window.electronAPI.installUpdate();
      return true;
    }
    return false;
  }

  // Aplicar actualización móvil
  async applyMobileUpdate(updateInfo) {
    if (updateInfo.downloadUrl) {
      // Abrir URL de descarga en el navegador del sistema
      window.open(updateInfo.downloadUrl, '_system');
      return true;
    }
    return false;
  }

  // Iniciar verificación automática
  startAutoCheck() {
    this.stopAutoCheck(); // Detener cualquier verificación anterior
    
    this.autoCheckInterval = setInterval(async () => {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo && updateInfo.available) {
        this.notifyListeners({
          type: 'update-available',
          updateInfo
        });
      }
    }, this.updateCheckInterval);

    // Verificar inmediatamente
    setTimeout(() => this.checkForUpdates(), 1000);
  }

  // Detener verificación automática
  stopAutoCheck() {
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
      this.autoCheckInterval = null;
    }
  }
}

// Instancia singleton
const updateService = new UpdateService();
export default updateService;