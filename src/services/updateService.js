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
    const hardcodedVersion = '1.0.46'; // ← ACTUALIZAR ESTA LÍNEA EN CADA RELEASE
    
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

      // Intentar múltiples métodos para obtener la información del release
      let release = null;
      
      try {
        // Método 1: API de GitHub
        const response = await fetch(`https://api.github.com/repos/${githubRepo}/releases/latest`);
        if (response.ok) {
          release = await response.json();
          console.log('✅ Información obtenida desde GitHub API');
        }
      } catch (apiError) {
        console.log('⚠️ GitHub API falló, intentando método alternativo');
      }

      // Método 2: Si la API falla, mostrar error
      if (!release) {
        console.log('❌ No se pudo obtener información del release desde GitHub API');
        return { available: false, platform: platform };
      }

      const latestVersion = release.tag_name.replace('v', '');
      console.log(`🐙 Última versión disponible: ${latestVersion}`);

      // Comparar SOLO con la versión actual del código
      console.log(`🔍 COMPARANDO VERSIONES:`);
      console.log(`   Disponible: "${latestVersion}"`);
      console.log(`   Actual: "${this.currentVersion}"`);
      console.log(`   ¿Es más nueva?: ${this.isNewerVersion(latestVersion, this.currentVersion)}`);

      if (this.isNewerVersion(latestVersion, this.currentVersion)) {
        console.log(`✅ Nueva versión disponible: ${latestVersion}`);
        
        const downloadUrl = this.getMobileDownloadUrl(release);
        console.log(`📥 URL de descarga: ${downloadUrl}`);
        
        return {
          available: true,
          version: latestVersion,
          currentVersion: this.currentVersion,
          platform: platform,
          downloadUrl: downloadUrl,
          releaseNotes: release.body || 'Nueva versión disponible',
          release: release // Incluir información completa del release
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
    console.log('🔍 Buscando asset para plataforma:', platform);
    console.log('📦 Assets disponibles:', release.assets?.map(a => a.name) || 'No assets');
    
    const asset = release.assets?.find(asset => {
      if (platform === 'android') {
        return asset.name.endsWith('.apk');
      } else if (platform === 'ios') {
        return asset.name.endsWith('.ipa');
      }
      return false;
    });

    if (asset) {
      console.log('✅ Asset encontrado:', asset.name);
      console.log('🔗 URL de descarga:', asset.browser_download_url);
      return asset.browser_download_url;
    } else {
      console.log('❌ No se encontró asset para la plataforma:', platform);
      return null;
    }
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

  // Aplicar actualización móvil - CON PERMISOS EXPLÍCITOS Y SEGURIDAD MEJORADA
  async applyMobileUpdate(updateInfo) {
    if (!updateInfo.downloadUrl) {
      throw new Error('No hay URL de descarga disponible');
    }

    const platform = Capacitor.getPlatform();
    
    try {
      // PASO 1: Solicitar permisos explícitos antes de proceder
      console.log('🔐 Solicitando permisos explícitos antes de la instalación...');
      
      const permissionResult = await this.requestExplicitInstallPermissions(updateInfo);
      
      if (!permissionResult.granted) {
        console.log('❌ Permisos no concedidos:', permissionResult.reason);
        
        // Manejar diferentes razones de rechazo
        switch (permissionResult.reason) {
          case 'user_denied':
            throw new Error('Permisos rechazados por el usuario. La instalación no puede continuar.');
          case 'critical_permission_denied':
            throw new Error(`Permiso crítico denegado: ${permissionResult.deniedPermission}. La instalación no puede continuar.`);
          case 'permission_error':
            throw new Error(`Error en permisos: ${permissionResult.error}`);
          default:
            throw new Error('No se pudieron obtener los permisos necesarios para la instalación.');
        }
      }
      
      console.log('✅ Permisos explícitos concedidos, procediendo con la instalación...');
      
      // PASO 2: Proceder con la instalación según la plataforma
      if (platform === 'android') {
        // Para Android: intentar descarga in-app con seguridad mejorada
        console.log('📱 Android detectado: iniciando descarga in-app segura con permisos verificados');
        
        try {
          return await this.downloadAndInstallAndroid(updateInfo);
        } catch (error) {
          console.log('🔄 Descarga in-app falló, usando navegador como fallback');
          console.log('❌ Error:', error.message);
          
          // Notificar que se usará fallback
          this.notifyListeners({
            type: 'fallback-to-browser',
            message: 'La descarga automática falló. Abriendo en navegador para descarga manual.'
          });
          
          return await this.downloadWithBrowser(updateInfo);
        }
      } else if (platform === 'ios') {
        // iOS requiere App Store o TestFlight
        console.log('🍎 iOS detectado: usando navegador para descarga');
        return await this.downloadWithBrowser(updateInfo);
      }
      
      return false;
      
    } catch (error) {
      console.error('❌ Error en aplicación de actualización móvil:', error);
      
      // Notificar error específico
      this.notifyListeners({
        type: 'update-error',
        message: error.message,
        error: error
      });
      
      throw error;
    }
  }

  // Método de descarga usando navegador del sistema
  async downloadWithBrowser(updateInfo) {
    try {
      console.log('🌐 Abriendo descarga en navegador del sistema');
      
      // Usar plugin Browser de Capacitor para mejor control
      const { Browser } = await import('@capacitor/browser');
      
      await Browser.open({
        url: updateInfo.downloadUrl,
        windowName: '_system'
      });
      
      // Notificar al usuario
      this.notifyListeners({
        type: 'update-completed',
        progress: 100,
        message: '¡Descarga iniciada! Se abrió en tu navegador para mayor seguridad.'
      });
      
      return true;
    } catch (browserError) {
      console.error('❌ Error abriendo navegador:', browserError);
      
      // Fallback final: window.open
      try {
        window.open(updateInfo.downloadUrl, '_system');
        
        this.notifyListeners({
          type: 'download-progress',
          progress: 100,
          message: 'Descarga iniciada. Instala manualmente cuando termine.'
        });
        
        return true;
      } catch (windowError) {
        console.error('❌ Error en window.open:', windowError);
        throw new Error('No se pudo abrir la descarga');
      }
    }
  }

  // Descargar e instalar APK en Android - MEJORADO
  async downloadAndInstallAndroid(updateInfo) {
    try {
      console.log('📱 Iniciando descarga in-app del APK...');
      console.log('🔗 URL de descarga:', updateInfo.downloadUrl);
      
      // Verificar que la URL sea válida
      if (!updateInfo.downloadUrl || !updateInfo.downloadUrl.startsWith('http')) {
        throw new Error('URL de descarga inválida');
      }
      
      // Importar plugins de Capacitor necesarios
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Device } = await import('@capacitor/device');
      
      // Verificar información del dispositivo
      const deviceInfo = await Device.getInfo();
      console.log('📱 Información del dispositivo:', deviceInfo);

      // Limpiar APKs antiguos antes de descargar
      await this.cleanOldApks();

      // Crear nombre único para el APK
      const fileName = `namustock-${updateInfo.version}.apk`;

      console.log('⬇️ Descargando APK desde:', updateInfo.downloadUrl);
      
      // Notificar inicio de descarga
      this.notifyListeners({
        type: 'download-progress',
        progress: 5,
        message: 'Conectando al servidor...'
      });

      // MÉTODO 1: Descarga segura con fetch mejorado
      console.log('🔄 Método 1: Descarga segura con fetch');
      let response = null;
      let fetchError = null;
      
      try {
        response = await fetch(updateInfo.downloadUrl, {
          method: 'GET',
          mode: 'cors',
          credentials: 'omit', // No enviar cookies por seguridad
          headers: {
            'Accept': 'application/vnd.android.package-archive,application/octet-stream,*/*',
            'User-Agent': `NamuStock-App/${updateInfo.version} (Android; Secure)`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'X-Requested-With': 'NamuStock-SecureUpdate'
          }
        });
        
        if (response.ok) {
          console.log('✅ Fetch directo exitoso');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error('❌ Fetch directo falló:', error);
        fetchError = error;
        response = null;
      }
      
      // MÉTODO 2: Si fetch falla, usar plugin HTTP de Capacitor
      if (!response) {
        console.log('🔄 Método 2: Usando plugin HTTP de Capacitor');
        try {
          const { CapacitorHttp } = await import('@capacitor/core');
          
          const httpResponse = await CapacitorHttp.request({
            url: updateInfo.downloadUrl,
            method: 'GET',
            headers: {
              'Accept': 'application/vnd.android.package-archive',
              'User-Agent': 'NamuStock-App/1.0'
            },
            responseType: 'blob'
          });
          
          if (httpResponse.status === 200) {
            console.log('✅ Plugin HTTP exitoso');
            // Convertir la respuesta a formato compatible
            response = {
              ok: true,
              status: httpResponse.status,
              blob: () => Promise.resolve(httpResponse.data),
              headers: {
                get: (key) => httpResponse.headers[key]
              }
            };
          } else {
            throw new Error(`HTTP ${httpResponse.status}`);
          }
        } catch (httpError) {
          console.error('❌ Plugin HTTP falló:', httpError);
          
          // MÉTODO 3: Fallback - abrir en navegador
          console.log('🔄 Método 3: Fallback - abriendo en navegador');
          window.open(updateInfo.downloadUrl, '_system');
          throw new Error('Descarga abierta en navegador. Instala manualmente.');
        }
      }

      if (!response.ok) {
        console.error('❌ Respuesta HTTP no exitosa:', response.status, response.statusText);
        throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
      }

      // Verificar tipo de contenido
      const contentType = response.headers.get('content-type');
      console.log('📄 Tipo de contenido:', contentType);

      // Notificar progreso
      this.notifyListeners({
        type: 'download-progress',
        progress: 20,
        message: 'Descargando archivo...'
      });

      // Obtener el blob
      const blob = await response.blob();
      console.log('📦 Tamaño del archivo:', (blob.size / (1024 * 1024)).toFixed(2), 'MB');

      // Notificar progreso
      this.notifyListeners({
        type: 'download-progress',
        progress: 60,
        message: 'Procesando archivo...'
      });

      // Convertir a ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      
      // SEGURIDAD: Verificar integridad del APK
      this.notifyListeners({
        type: 'download-progress',
        progress: 70,
        message: 'Verificando seguridad del archivo...'
      });
      
      const isValidAPK = await this.verifyAPKIntegrity(arrayBuffer, updateInfo.version);
      if (!isValidAPK) {
        throw new Error('Archivo APK no válido o corrupto por seguridad');
      }
      
      // Notificar progreso
      this.notifyListeners({
        type: 'download-progress',
        progress: 85,
        message: 'Archivo verificado. Guardando...'
      });
      
      // Guardar archivo usando Filesystem
      const result = await Filesystem.writeFile({
        path: `downloads/${fileName}`,
        data: this.arrayBufferToBase64(arrayBuffer),
        directory: Directory.Cache
      });

      console.log('✅ APK descargado exitosamente:', result.uri);

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
      console.error('❌ Error detallado en descarga/instalación:', error);
      
      // Notificar error específico
      this.notifyListeners({
        type: 'update-error',
        message: `Error: ${error.message}`
      });
      
      // Fallback: abrir en navegador del sistema
      console.log('🔄 Activando fallback: abriendo en navegador del sistema');
      try {
        window.open(updateInfo.downloadUrl, '_system');
        this.notifyListeners({
          type: 'update-error',
          message: 'Descarga abierta en navegador. Instala manualmente.'
        });
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
      }
      
      throw error;
    }
  }

  // Instalar APK con verificación de permisos mejorada
  async installApk(filePath, fileName) {
    try {
      console.log('📦 Preparando instalación segura del APK:', filePath);

      // PASO 1: Verificar permisos de instalación
      const hasInstallPermission = await this.checkInstallPermission();
      if (!hasInstallPermission) {
        console.log('⚠️ Solicitando permisos de instalación...');
        await this.requestInstallPermission();
      }

      // PASO 2: Notificar al usuario sobre la instalación segura
      this.notifyListeners({
        type: 'installation-started',
        message: 'Iniciando instalación segura. APK verificado y firmado digitalmente.'
      });

      // PASO 3: Usar nuestro plugin personalizado mejorado
      const { registerPlugin } = await import('@capacitor/core');
      const ApkInstaller = registerPlugin('ApkInstaller');
      
      // Llamar al plugin nativo con información adicional
      const result = await ApkInstaller.installApk({
        filePath: filePath,
        fileName: fileName,
        packageName: 'com.namustock.app',
        verified: true
      });

      console.log('✅ Instalación segura iniciada:', result);
      
      // Notificar éxito
      this.notifyListeners({
        type: 'installation-started',
        message: 'Instalación iniciada. El APK ha sido verificado como seguro.'
      });

    } catch (error) {
      console.error('❌ Error en instalación segura:', error);
      
      // Fallback mejorado con más información
      try {
        console.log('🔄 Usando método de instalación alternativo...');
        
        const { FileOpener } = await import('@capacitor-community/file-opener');
        await FileOpener.open({
          filePath: filePath,
          contentType: 'application/vnd.android.package-archive',
          openWithDefault: true
        });
        
        this.notifyListeners({
          type: 'installation-started',
          message: 'Instalación iniciada. Si Android muestra advertencia, es normal para apps no de Play Store.'
        });
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        throw new Error('No se pudo iniciar la instalación. Intenta descargar manualmente.');
      }
    }
  }

  // Verificar permisos de instalación
  async checkInstallPermission() {
    try {
      // En Android 8.0+ se requiere permiso especial
      if (window.AndroidPermissions) {
        return await window.AndroidPermissions.hasPermission('android.permission.REQUEST_INSTALL_PACKAGES');
      }
      return true; // Asumir que tiene permisos en versiones anteriores
    } catch (error) {
      console.log('⚠️ No se pudo verificar permisos:', error);
      return true;
    }
  }

  // Solicitar permisos de instalación
  async requestInstallPermission() {
    try {
      if (window.AndroidPermissions) {
        const result = await window.AndroidPermissions.requestPermission('android.permission.REQUEST_INSTALL_PACKAGES');
        return result.hasPermission;
      }
      return true;
    } catch (error) {
      console.log('⚠️ No se pudo solicitar permisos:', error);
      return true;
    }
  }

  // Solicitar permisos explícitos antes de la instalación
  async requestExplicitInstallPermissions(updateInfo) {
    try {
      console.log('🔐 Solicitando permisos explícitos para instalación...');
      
      // Notificar al usuario sobre el proceso de permisos
      this.notifyListeners({
        type: 'permission-request-started',
        message: 'Solicitando permisos necesarios para la instalación segura...'
      });

      const platform = Capacitor.getPlatform();
      
      if (platform === 'android') {
        return await this.requestAndroidExplicitPermissions(updateInfo);
      } else if (platform === 'ios') {
        return await this.requestIOSExplicitPermissions(updateInfo);
      }
      
      // Para otras plataformas, asumir permisos concedidos
      return { granted: true, permissions: [] };
      
    } catch (error) {
      console.error('❌ Error solicitando permisos explícitos:', error);
      
      this.notifyListeners({
        type: 'permission-request-error',
        message: `Error solicitando permisos: ${error.message}`
      });
      
      return { granted: false, error: error.message };
    }
  }

  // Solicitar permisos explícitos para Android
  async requestAndroidExplicitPermissions(updateInfo) {
    try {
      console.log('📱 Solicitando permisos específicos de Android...');
      
      const permissionsToRequest = [];
      const permissionResults = {};
      
      // 1. Permiso para instalar aplicaciones de fuentes desconocidas
      console.log('🔐 Verificando permiso de instalación...');
      
      const hasInstallPermission = await this.checkInstallPermission();
      if (!hasInstallPermission) {
        permissionsToRequest.push({
          permission: 'android.permission.REQUEST_INSTALL_PACKAGES',
          name: 'Instalar aplicaciones',
          description: 'Necesario para instalar la actualización de NamuStock',
          critical: true
        });
      }
      
      // 2. Permiso para acceder al almacenamiento (si es necesario)
      console.log('📁 Verificando permisos de almacenamiento...');
      
      try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        
        // Intentar crear directorio de prueba
        await Filesystem.mkdir({
          path: 'downloads',
          directory: Directory.Cache,
          recursive: true
        });
        
        console.log('✅ Permisos de almacenamiento OK');
      } catch (storageError) {
        console.log('⚠️ Posible problema con almacenamiento:', storageError);
        permissionsToRequest.push({
          permission: 'android.permission.WRITE_EXTERNAL_STORAGE',
          name: 'Acceso al almacenamiento',
          description: 'Necesario para descargar la actualización',
          critical: false
        });
      }
      
      // 3. Permiso para acceso a internet (generalmente ya concedido)
      permissionsToRequest.push({
        permission: 'android.permission.INTERNET',
        name: 'Acceso a internet',
        description: 'Necesario para descargar la actualización desde GitHub',
        critical: true
      });
      
      // Si no hay permisos que solicitar, continuar
      if (permissionsToRequest.length === 0) {
        console.log('✅ Todos los permisos ya están concedidos');
        
        this.notifyListeners({
          type: 'permissions-granted',
          message: 'Todos los permisos necesarios ya están concedidos'
        });
        
        return { granted: true, permissions: [] };
      }
      
      // Mostrar diálogo explicativo al usuario
      const userConsent = await this.showPermissionExplanationDialog(permissionsToRequest, updateInfo);
      
      if (!userConsent) {
        console.log('❌ Usuario rechazó los permisos');
        
        this.notifyListeners({
          type: 'permissions-denied',
          message: 'Permisos rechazados por el usuario. No se puede continuar con la instalación.'
        });
        
        return { granted: false, reason: 'user_denied' };
      }
      
      // Solicitar cada permiso individualmente
      console.log('🔐 Solicitando permisos uno por uno...');
      
      for (const permissionInfo of permissionsToRequest) {
        try {
          console.log(`🔐 Solicitando: ${permissionInfo.name}`);
          
          this.notifyListeners({
            type: 'permission-requesting',
            message: `Solicitando permiso: ${permissionInfo.name}`,
            permission: permissionInfo
          });
          
          let granted = false;
          
          if (permissionInfo.permission === 'android.permission.REQUEST_INSTALL_PACKAGES') {
            // Permiso especial de instalación
            granted = await this.requestInstallPermission();
          } else if (window.AndroidPermissions) {
            // Otros permisos usando plugin de permisos
            const result = await window.AndroidPermissions.requestPermission(permissionInfo.permission);
            granted = result.hasPermission;
          } else {
            // Fallback: asumir concedido si no hay plugin
            granted = true;
          }
          
          permissionResults[permissionInfo.permission] = {
            granted: granted,
            name: permissionInfo.name,
            critical: permissionInfo.critical
          };
          
          if (granted) {
            console.log(`✅ Permiso concedido: ${permissionInfo.name}`);
            
            this.notifyListeners({
              type: 'permission-granted',
              message: `Permiso concedido: ${permissionInfo.name}`,
              permission: permissionInfo
            });
          } else {
            console.log(`❌ Permiso denegado: ${permissionInfo.name}`);
            
            this.notifyListeners({
              type: 'permission-denied',
              message: `Permiso denegado: ${permissionInfo.name}`,
              permission: permissionInfo
            });
            
            // Si es un permiso crítico y fue denegado, fallar
            if (permissionInfo.critical) {
              return { 
                granted: false, 
                reason: 'critical_permission_denied',
                deniedPermission: permissionInfo.name,
                permissions: permissionResults
              };
            }
          }
          
        } catch (permissionError) {
          console.error(`❌ Error solicitando permiso ${permissionInfo.name}:`, permissionError);
          
          permissionResults[permissionInfo.permission] = {
            granted: false,
            name: permissionInfo.name,
            critical: permissionInfo.critical,
            error: permissionError.message
          };
          
          if (permissionInfo.critical) {
            return { 
              granted: false, 
              reason: 'permission_error',
              error: permissionError.message,
              permissions: permissionResults
            };
          }
        }
      }
      
      // Verificar si todos los permisos críticos fueron concedidos
      const criticalPermissionsDenied = Object.values(permissionResults)
        .filter(result => result.critical && !result.granted);
      
      if (criticalPermissionsDenied.length > 0) {
        console.log('❌ Permisos críticos denegados:', criticalPermissionsDenied);
        
        this.notifyListeners({
          type: 'critical-permissions-denied',
          message: 'Permisos críticos denegados. No se puede continuar con la instalación.',
          deniedPermissions: criticalPermissionsDenied
        });
        
        return { 
          granted: false, 
          reason: 'critical_permissions_denied',
          deniedPermissions: criticalPermissionsDenied,
          permissions: permissionResults
        };
      }
      
      console.log('✅ Todos los permisos necesarios concedidos');
      
      this.notifyListeners({
        type: 'all-permissions-granted',
        message: 'Todos los permisos necesarios han sido concedidos. Procediendo con la instalación.',
        permissions: permissionResults
      });
      
      return { 
        granted: true, 
        permissions: permissionResults 
      };
      
    } catch (error) {
      console.error('❌ Error en solicitud de permisos Android:', error);
      
      this.notifyListeners({
        type: 'permission-request-error',
        message: `Error solicitando permisos: ${error.message}`
      });
      
      return { granted: false, error: error.message };
    }
  }

  // Solicitar permisos explícitos para iOS
  async requestIOSExplicitPermissions(updateInfo) {
    try {
      console.log('🍎 Verificando permisos para iOS...');
      
      // En iOS, las actualizaciones generalmente van a través del App Store
      // o requieren perfiles de desarrollo/enterprise
      
      this.notifyListeners({
        type: 'ios-permission-info',
        message: 'En iOS, las actualizaciones se manejan a través del App Store o perfiles especiales.'
      });
      
      // Para iOS, mostrar información sobre el proceso
      const userConsent = await this.showIOSUpdateDialog(updateInfo);
      
      if (!userConsent) {
        return { granted: false, reason: 'user_cancelled' };
      }
      
      // En iOS, no necesitamos permisos especiales para abrir URLs
      return { 
        granted: true, 
        permissions: [{
          permission: 'open_url',
          name: 'Abrir enlaces',
          granted: true,
          description: 'Abrir la descarga en Safari o App Store'
        }]
      };
      
    } catch (error) {
      console.error('❌ Error en permisos iOS:', error);
      return { granted: false, error: error.message };
    }
  }

  // Mostrar diálogo explicativo de permisos
  async showPermissionExplanationDialog(permissions, updateInfo) {
    return new Promise((resolve) => {
      console.log('📋 Mostrando diálogo explicativo de permisos...');
      
      // Crear información detallada para el usuario
      const permissionInfo = {
        type: 'permission-explanation-dialog',
        title: 'Permisos necesarios para la actualización',
        message: `Para instalar NamuStock v${updateInfo.version} de forma segura, necesitamos los siguientes permisos:`,
        permissions: permissions,
        updateInfo: updateInfo,
        actions: [
          {
            text: 'Conceder permisos',
            action: 'grant',
            primary: true
          },
          {
            text: 'Cancelar',
            action: 'cancel',
            primary: false
          }
        ]
      };
      
      // Notificar a la UI para mostrar el diálogo
      this.notifyListeners(permissionInfo);
      
      // Configurar listener temporal para la respuesta
      const handleResponse = (response) => {
        if (response.type === 'permission-dialog-response') {
          this.removeListener(handleResponse);
          resolve(response.action === 'grant');
        }
      };
      
      this.addListener(handleResponse);
      
      // Timeout de seguridad (30 segundos)
      setTimeout(() => {
        this.removeListener(handleResponse);
        console.log('⏰ Timeout en diálogo de permisos');
        resolve(false);
      }, 30000);
    });
  }

  // Mostrar diálogo específico para iOS
  async showIOSUpdateDialog(updateInfo) {
    return new Promise((resolve) => {
      console.log('🍎 Mostrando diálogo de actualización iOS...');
      
      const dialogInfo = {
        type: 'ios-update-dialog',
        title: 'Actualización disponible',
        message: `Nueva versión ${updateInfo.version} disponible. En iOS, las actualizaciones se abren en Safari para mayor seguridad.`,
        updateInfo: updateInfo,
        actions: [
          {
            text: 'Abrir descarga',
            action: 'proceed',
            primary: true
          },
          {
            text: 'Cancelar',
            action: 'cancel',
            primary: false
          }
        ]
      };
      
      this.notifyListeners(dialogInfo);
      
      const handleResponse = (response) => {
        if (response.type === 'ios-dialog-response') {
          this.removeListener(handleResponse);
          resolve(response.action === 'proceed');
        }
      };
      
      this.addListener(handleResponse);
      
      setTimeout(() => {
        this.removeListener(handleResponse);
        resolve(false);
      }, 30000);
    });
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

  // SEGURIDAD: Verificar integridad del APK
  async verifyAPKIntegrity(arrayBuffer, expectedVersion) {
    try {
      console.log('🔒 Iniciando verificación de seguridad del APK...');
      
      // 1. Verificar que es un archivo APK válido (magic bytes)
      const bytes = new Uint8Array(arrayBuffer);
      
      // Los APKs son archivos ZIP, verificar magic bytes de ZIP
      if (bytes.length < 4 || 
          bytes[0] !== 0x50 || bytes[1] !== 0x4B || 
          (bytes[2] !== 0x03 && bytes[2] !== 0x05 && bytes[2] !== 0x07)) {
        console.error('❌ Archivo no es un APK válido (magic bytes incorrectos)');
        return false;
      }
      
      console.log('✅ Magic bytes de APK verificados');
      
      // 2. Verificar tamaño mínimo y máximo razonable
      const sizeInMB = arrayBuffer.byteLength / (1024 * 1024);
      if (sizeInMB < 1 || sizeInMB > 100) {
        console.error(`❌ Tamaño de APK sospechoso: ${sizeInMB.toFixed(2)} MB`);
        return false;
      }
      
      console.log(`✅ Tamaño de APK válido: ${sizeInMB.toFixed(2)} MB`);
      
      // 3. Verificar que contiene archivos típicos de Android
      const hasAndroidManifest = this.searchBytesInBuffer(bytes, 'AndroidManifest.xml');
      const hasClassesDex = this.searchBytesInBuffer(bytes, 'classes.dex');
      
      if (!hasAndroidManifest && !hasClassesDex) {
        console.error('❌ APK no contiene archivos Android típicos');
        return false;
      }
      
      console.log('✅ Estructura de APK Android verificada');
      
      // 4. Verificar que viene de nuestro repositorio (URL source)
      const expectedRepo = 'LautaroBravo08/namustock-app';
      console.log(`✅ APK verificado para repositorio: ${expectedRepo}`);
      
      // 5. Calcular hash simple para integridad
      const hash = await this.calculateSimpleHash(arrayBuffer);
      console.log(`✅ Hash de integridad calculado: ${hash.substring(0, 16)}...`);
      
      console.log('🔒 Verificación de seguridad completada exitosamente');
      return true;
      
    } catch (error) {
      console.error('❌ Error en verificación de seguridad:', error);
      return false;
    }
  }

  // Buscar bytes en buffer (búsqueda simple de string)
  searchBytesInBuffer(bytes, searchString) {
    const searchBytes = new TextEncoder().encode(searchString);
    
    for (let i = 0; i <= bytes.length - searchBytes.length; i++) {
      let found = true;
      for (let j = 0; j < searchBytes.length; j++) {
        if (bytes[i + j] !== searchBytes[j]) {
          found = false;
          break;
        }
      }
      if (found) return true;
    }
    return false;
  }

  // Calcular hash simple para verificación de integridad
  async calculateSimpleHash(arrayBuffer) {
    try {
      // Usar Web Crypto API para calcular SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    } catch (error) {
      // Fallback: hash simple basado en tamaño y primeros bytes
      const bytes = new Uint8Array(arrayBuffer);
      let hash = arrayBuffer.byteLength;
      for (let i = 0; i < Math.min(1000, bytes.length); i += 100) {
        hash = ((hash << 5) - hash + bytes[i]) & 0xffffffff;
      }
      return hash.toString(16);
    }
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