// Servicio de actualización multiplataforma
import { Capacitor } from '@capacitor/core';

class UpdateService {
  constructor() {
    // FORZAR versión desde package.json como fallback
    this.currentVersion = this.getCurrentVersionFromPackage();
    this.updateCheckInterval = parseInt(process.env.REACT_APP_UPDATE_CHECK_INTERVAL) || 300000; // 5 minutos por defecto
    this.isChecking = false;
    this.listeners = [];

    // Inicializar versión instalada
    this.initializeInstalledVersion();

    // Log de inicialización
    console.log('🚀 UpdateService inicializado:', {
      currentVersion: this.currentVersion,
      envVersion: process.env.REACT_APP_VERSION,
      installedVersion: localStorage.getItem('installed-app-version'),
      platform: this.getPlatform(),
      checkInterval: this.updateCheckInterval,
      simulateUpdate: process.env.REACT_APP_SIMULATE_UPDATE
    });
  }

  // Obtener versión actual - FORZAR HARDCODEADO
  getCurrentVersionFromPackage() {
    // IGNORAR COMPLETAMENTE PROCESS.ENV - SOLO USAR HARDCODEADO
    const hardcodedVersion = '1.0.30'; // ← ACTUALIZAR ESTA LÍNEA EN CADA RELEASE
    
    console.log('📦 FORZANDO versión hardcodeada:', hardcodedVersion);
    console.log('📦 process.env.REACT_APP_VERSION (IGNORADO):', process.env.REACT_APP_VERSION);
    
    return hardcodedVersion;
  }

  // Inicializar versión instalada - SIMPLIFICADO
  initializeInstalledVersion() {
    console.log('🚀 Inicializando sistema de versiones...');

    // Limpiar TODOS los datos de versiones anteriores
    localStorage.removeItem('installed-app-version');
    localStorage.removeItem('last-checked-version');
    localStorage.removeItem('app-version');

    console.log('✅ Sistema de versiones limpio. Versión actual:', this.currentVersion);
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

      // SOLO verificar desde GitHub (fuente única de verdad)
      const githubRepo = process.env.REACT_APP_GITHUB_REPO;
      if (!githubRepo) {
        console.log('❌ No hay repositorio de GitHub configurado');
        return { available: false, platform: platform };
      }

      const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`);
      if (!response.ok) {
        console.log('❌ Error obteniendo release de GitHub');
        return { available: false, platform: platform };
      }

      const release = await response.json();
      const latestVersion = release.tag_name.replace('v', '');
      console.log(`🐙 Última versión en GitHub: ${latestVersion}`);

      // Comparar SOLO con la versión actual del código
      console.log(`🔍 COMPARANDO VERSIONES:`);
      console.log(`   GitHub: "${latestVersion}"`);
      console.log(`   Actual: "${this.currentVersion}"`);
      console.log(`   ¿Es más nueva?: ${this.isNewerVersion(latestVersion, this.currentVersion)}`);

      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        console.log(`✅ Nueva versión disponible: ${latestVersion}`);
        return {
          available: true,
          version: latestVersion,
          currentVersion: this.currentVersion,
          platform: platform,
          downloadUrl: this.getMobileDownloadUrl(release),
          releaseNotes: release.body || 'Nueva versión disponible'
        };
      }

      console.log('✅ Ya tienes la última versión');
      return { available: false, platform: platform };

    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return { available: false, platform: Capacitor.getPlatform() };
    }
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

  // Aplicar actualización móvil - CON DESCARGA IN-APP
  async applyMobileUpdate(updateInfo) {
    if (!updateInfo.downloadUrl) {
      throw new Error('No hay URL de descarga disponible');
    }

    const platform = Capacitor.getPlatform();
    
    if (platform === 'android') {
      return await this.downloadAndInstallAndroid(updateInfo);
    } else if (platform === 'ios') {
      // iOS requiere App Store o TestFlight
      window.open(updateInfo.downloadUrl, '_system');
      return true;
    }
    
    return false;
  }

  // Descargar e instalar APK en Android
  async downloadAndInstallAndroid(updateInfo) {
    try {
      console.log('📱 Iniciando descarga in-app del APK...');
      
      // Importar plugins de Capacitor necesarios
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { CapacitorHttp } = await import('@capacitor/core');
      const { Device } = await import('@capacitor/device');
      
      // Verificar permisos
      const deviceInfo = await Device.getInfo();
      console.log('📱 Información del dispositivo:', deviceInfo);

      // Limpiar APKs antiguos antes de descargar
      await this.cleanOldApks();

      // Crear nombre único para el APK
      const fileName = `namustock-${updateInfo.version}.apk`;
      const downloadPath = `downloads/${fileName}`;

      console.log('⬇️ Descargando APK:', updateInfo.downloadUrl);
      
      // Notificar progreso de descarga
      this.notifyListeners({
        type: 'download-progress',
        progress: 0,
        message: 'Iniciando descarga...'
      });

      // Descargar archivo usando fetch nativo
      const response = await fetch(updateInfo.downloadUrl);
      if (!response.ok) {
        throw new Error(`Error descargando: ${response.status}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Guardar archivo usando Filesystem
      const result = await Filesystem.writeFile({
        path: `downloads/${fileName}`,
        data: this.arrayBufferToBase64(arrayBuffer),
        directory: Directory.Cache
      });

      console.log('✅ APK descargado:', result.uri);

      // Notificar descarga completada
      this.notifyListeners({
        type: 'download-progress',
        progress: 100,
        message: 'Descarga completada. Preparando instalación...'
      });

      // Instalar APK
      await this.installApk(result.uri, fileName);
      
      return true;
    } catch (error) {
      console.error('❌ Error en descarga/instalación:', error);
      
      // Fallback: abrir en navegador
      console.log('🔄 Fallback: abriendo en navegador del sistema');
      window.open(updateInfo.downloadUrl, '_system');
      
      throw error;
    }
  }

  // Instalar APK usando nuestro plugin personalizado
  async installApk(filePath, fileName) {
    try {
      console.log('📦 Instalando APK:', filePath);

      // Usar nuestro plugin personalizado de Capacitor
      const { registerPlugin } = await import('@capacitor/core');
      const ApkInstaller = registerPlugin('ApkInstaller');
      
      // Llamar al plugin nativo
      const result = await ApkInstaller.installApk({
        filePath: filePath
      });

      console.log('✅ Instalación iniciada:', result);
      
      // Notificar que la instalación ha comenzado
      this.notifyListeners({
        type: 'installation-started',
        message: 'Instalación iniciada. Sigue las instrucciones en pantalla.'
      });

    } catch (error) {
      console.error('❌ Error instalando APK:', error);
      
      // Fallback: usar FileOpener
      try {
        const { FileOpener } = await import('@capacitor-community/file-opener');
        await FileOpener.open({
          filePath: filePath,
          contentType: 'application/vnd.android.package-archive',
        });
        
        this.notifyListeners({
          type: 'installation-started',
          message: 'Instalación iniciada con método alternativo.'
        });
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        throw error;
      }
    }
  }

  // Convertir ArrayBuffer a Base64
  arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // Limpiar APKs antiguos
  async cleanOldApks() {
    try {
      console.log('🧹 Limpiando APKs antiguos...');
      
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      
      // Listar archivos en el directorio de cache
      const files = await Filesystem.readdir({
        path: 'downloads',
        directory: Directory.Cache
      });

      // Filtrar solo APKs de namustock
      const apkFiles = files.files.filter(file => 
        file.name.startsWith('namustock-') && file.name.endsWith('.apk')
      );

      console.log(`🗑️ Encontrados ${apkFiles.length} APKs antiguos`);

      // Eliminar cada APK antiguo
      for (const apkFile of apkFiles) {
        try {
          await Filesystem.deleteFile({
            path: `downloads/${apkFile.name}`,
            directory: Directory.Cache
          });
          console.log(`✅ APK eliminado: ${apkFile.name}`);
        } catch (deleteError) {
          console.log(`⚠️ No se pudo eliminar: ${apkFile.name}`, deleteError);
        }
      }

      console.log('✅ Limpieza de APKs completada');
      
    } catch (error) {
      console.log('⚠️ Error limpiando APKs antiguos:', error);
      // No es crítico, continuar con la descarga
    }
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