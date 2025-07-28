// Servicio de actualización basado en Firebase
import { Capacitor } from '@capacitor/core';
import { getLatestAppVersion, onVersionChange, logUpdateAttempt } from '../firebase/firestore';
import autoFirebaseSetup from './autoFirebaseSetup';

class FirebaseUpdateService {
  constructor() {
    this.currentVersion = process.env.REACT_APP_VERSION || '1.0.66';
    this.isChecking = false;
    this.listeners = [];
    this.versionListener = null;
    this.isFirebaseReady = false;
    
    console.log('🔥 FirebaseUpdateService inicializado:', {
      currentVersion: this.currentVersion,
      platform: this.getPlatform()
    });
    
    // Configurar Firebase automáticamente y luego el listener
    this.initializeFirebase();
  }

  // Inicializar Firebase automáticamente
  async initializeFirebase() {
    try {
      console.log('🔧 Configurando Firebase automáticamente...');
      
      // Configurar Firebase automáticamente
      const setupSuccess = await autoFirebaseSetup.setupFirebaseUpdates();
      
      if (setupSuccess) {
        console.log('✅ Firebase configurado automáticamente');
        this.isFirebaseReady = true;
        
        // Ahora configurar el listener en tiempo real
        this.setupRealtimeVersionListener();
      } else {
        console.log('⚠️ Firebase no se pudo configurar automáticamente, usando modo fallback');
        this.isFirebaseReady = false;
      }
    } catch (error) {
      console.error('❌ Error inicializando Firebase:', error);
      this.isFirebaseReady = false;
    }
  }

  // Detectar plataforma
  getPlatform() {
    if (Capacitor.isNativePlatform()) {
      return Capacitor.getPlatform();
    } else if (window.electronAPI) {
      return 'electron';
    } else {
      return 'web';
    }
  }

  // Configurar listener en tiempo real
  setupRealtimeVersionListener() {
    console.log('🔥 Configurando listener en tiempo real para actualizaciones...');
    
    this.versionListener = onVersionChange((versionData) => {
      if (versionData) {
        console.log('🔄 Nueva versión detectada en tiempo real:', versionData.version);
        this.handleVersionChange(versionData);
      }
    });
  }

  // Manejar cambios de versión en tiempo real
  async handleVersionChange(versionData) {
    const platform = this.getPlatform();
    
    // Solo procesar en Android
    if (platform !== 'android') {
      console.log(`📱 Plataforma ${platform} - Ignorando actualización en tiempo real`);
      return;
    }
    
    // Verificar si es una versión más nueva
    if (this.isNewerVersion(versionData.version, this.currentVersion)) {
      console.log('✅ Nueva versión disponible en tiempo real:', versionData.version);
      
      const updateInfo = {
        available: true,
        version: versionData.version,
        currentVersion: this.currentVersion,
        platform: platform,
        downloadUrl: versionData.downloads?.android,
        releaseNotes: versionData.releaseNotes,
        buildDate: versionData.buildDate,
        source: 'firebase-realtime'
      };
      
      // Notificar a los listeners
      this.notifyListeners({
        type: 'update-available',
        updateInfo: updateInfo
      });
    }
  }

  // Verificar actualizaciones manualmente
  async checkForUpdates() {
    if (this.isChecking) return null;
    
    this.isChecking = true;
    const platform = this.getPlatform();
    
    try {
      // Solo permitir actualizaciones en Android
      if (platform !== 'android') {
        console.log(`⚠️ Actualizaciones deshabilitadas para plataforma: ${platform}`);
        return { 
          available: false, 
          platform: platform,
          message: 'Actualizaciones solo disponibles en Android',
          reason: 'platform_not_supported'
        };
      }
      
      console.log('🔥 Consultando Firebase para información de versión...');
      const { versionInfo, error } = await getLatestAppVersion();
      
      if (error) {
        console.error('❌ Error consultando Firebase:', error);
        return { available: false, platform: platform, error: error };
      }
      
      if (!versionInfo) {
        console.log('⚠️ No se encontró información de versión en Firebase');
        return { available: false, platform: platform, error: 'No version info found' };
      }
      
      console.log('✅ Información obtenida desde Firebase');
      console.log(`📦 Versión encontrada: ${versionInfo.version}`);
      
      // Comparar versiones
      const isNewer = this.isNewerVersion(versionInfo.version, this.currentVersion);
      
      console.log('🔍 COMPARANDO VERSIONES:');
      console.log(`   📱 Versión actual: "${this.currentVersion}"`);
      console.log(`   🔥 Versión disponible (Firebase): "${versionInfo.version}"`);
      console.log(`   🔍 ¿Es más nueva?: ${isNewer}`);
      
      if (isNewer) {
        console.log(`✅ Nueva versión disponible: ${versionInfo.version}`);
        
        return {
          available: true,
          version: versionInfo.version,
          currentVersion: this.currentVersion,
          platform: platform,
          downloadUrl: versionInfo.downloads?.android,
          releaseNotes: versionInfo.releaseNotes,
          buildDate: versionInfo.buildDate,
          source: 'firebase'
        };
      } else {
        console.log('✅ Ya tienes la última versión - No hay actualizaciones disponibles');
        return { available: false, platform: platform, latestVersion: versionInfo.version };
      }
      
    } catch (error) {
      console.error('❌ Error verificando actualizaciones:', error);
      return { available: false, platform: platform, error: error.message };
    } finally {
      this.isChecking = false;
    }
  }

  // Verificar actualizaciones al iniciar la app
  async checkOnAppStart() {
    const platform = this.getPlatform();
    
    if (platform !== 'android') {
      console.log(`📱 Plataforma ${platform} detectada - Actualizaciones deshabilitadas`);
      console.log('ℹ️ Las actualizaciones automáticas solo están disponibles en Android');
      return;
    }
    
    console.log('🚀 Verificando actualizaciones al iniciar la aplicación (Android + Firebase)...');
    
    try {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo && updateInfo.available) {
        console.log('✅ Actualización encontrada al iniciar:', updateInfo.version);
        this.notifyListeners({
          type: 'update-available',
          updateInfo: updateInfo
        });
      } else {
        console.log('✅ No hay actualizaciones disponibles al iniciar');
      }
    } catch (error) {
      console.log('⚠️ Error verificando actualizaciones al iniciar:', error.message);
    }
  }

  // Verificar actualizaciones manualmente (botón)
  async checkManually() {
    const platform = this.getPlatform();
    
    console.log('🔍 Verificación manual de actualizaciones solicitada (Firebase)...');
    
    if (platform !== 'android') {
      console.log(`📱 Plataforma ${platform} detectada - Actualizaciones no disponibles`);
      const message = platform === 'web' 
        ? 'Las actualizaciones automáticas solo están disponibles en la app de Android'
        : `Las actualizaciones automáticas no están disponibles en ${platform}`;
      
      return { 
        available: false, 
        message: message,
        platform: platform,
        reason: 'platform_not_supported'
      };
    }
    
    try {
      const updateInfo = await this.checkForUpdates();
      if (updateInfo && updateInfo.available) {
        console.log('✅ Actualización encontrada manualmente:', updateInfo.version);
        this.notifyListeners({
          type: 'update-available',
          updateInfo: updateInfo
        });
        return updateInfo;
      } else if (updateInfo && updateInfo.reason === 'platform_not_supported') {
        return updateInfo;
      } else {
        console.log('✅ No hay actualizaciones disponibles (verificación manual)');
        return { available: false, message: 'No hay actualizaciones disponibles' };
      }
    } catch (error) {
      console.log('❌ Error en verificación manual:', error.message);
      throw error;
    }
  }

  // Registrar intento de actualización
  async logUpdate(fromVersion, toVersion, success, error = null) {
    try {
      await logUpdateAttempt('anonymous', {
        fromVersion: fromVersion,
        toVersion: toVersion,
        platform: this.getPlatform(),
        success: success,
        error: error
      });
    } catch (logError) {
      console.log('⚠️ Error registrando log de actualización:', logError);
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

  // Agregar listener
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

  // Limpiar listeners
  cleanup() {
    if (this.versionListener) {
      this.versionListener(); // Desconectar listener de Firebase
      this.versionListener = null;
    }
    this.listeners = [];
  }
}

// Instancia singleton
const firebaseUpdateService = new FirebaseUpdateService();
export default firebaseUpdateService;