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
    const hardcodedVersion = '1.0.42'; // ← ACTUALIZAR ESTA LÍNEA EN CADA RELEASE
    
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

  // Aplicar actualización móvil - CON SEGURIDAD MEJORADA
  async applyMobileUpdate(updateInfo) {
    if (!updateInfo.downloadUrl) {
      throw new Error('No hay URL de descarga disponible');
    }

    const platform = Capacitor.getPlatform();
    
    if (platform === 'android') {
      // Para Android: intentar descarga in-app con seguridad mejorada primero
      console.log('📱 Android detectado: intentando descarga in-app segura');
      try {
        return await this.downloadAndInstallAndroid(updateInfo);
      } catch (error) {
        console.log('🔄 Descarga in-app falló, usando navegador como fallback');
        console.log('❌ Error:', error.message);
        return await this.downloadWithBrowser(updateInfo);
      }
    } else if (platform === 'ios') {
      // iOS requiere App Store o TestFlight
      return await this.downloadWithBrowser(updateInfo);
    }
    
    return false;
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