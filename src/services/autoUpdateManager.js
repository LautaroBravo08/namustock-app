// Gestor automático de actualizaciones que integra Firebase con releases
import autoFirebaseSetup from './autoFirebaseSetup';

class AutoUpdateManager {
  constructor() {
    this.isInitialized = false;
  }

  // Inicializar el sistema completo automáticamente
  async initialize() {
    if (this.isInitialized) return true;

    try {
      console.log('🚀 Inicializando sistema de actualizaciones automático...');
      
      // Paso 1: Configurar Firebase automáticamente
      const firebaseReady = await autoFirebaseSetup.setupFirebaseUpdates();
      
      if (firebaseReady) {
        console.log('✅ Sistema de actualizaciones listo');
        this.isInitialized = true;
        return true;
      } else {
        console.log('⚠️ Sistema funcionando en modo fallback');
        return false;
      }
    } catch (error) {
      console.error('❌ Error inicializando sistema:', error);
      return false;
    }
  }

  // Crear nueva versión automáticamente (para auto-release.js)
  async createNewVersion(currentVersion, versionType = 'patch') {
    try {
      console.log('📦 Creando nueva versión automáticamente...');
      
      const newVersion = this.incrementVersion(currentVersion, versionType);
      const releaseNotes = this.generateReleaseNotes(newVersion, versionType);
      
      const result = await autoFirebaseSetup.updateVersion(newVersion, releaseNotes);
      
      if (result.success) {
        console.log('✅ Nueva versión creada en Firebase:', newVersion);
        return { success: true, version: newVersion };
      } else {
        console.error('❌ Error creando versión:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error en createNewVersion:', error);
      return { success: false, error: error.message };
    }
  }

  // Incrementar versión según el tipo
  incrementVersion(version, type) {
    const parts = version.split('.').map(Number);
    
    switch (type) {
      case 'major':
        parts[0]++;
        parts[1] = 0;
        parts[2] = 0;
        break;
      case 'minor':
        parts[1]++;
        parts[2] = 0;
        break;
      case 'patch':
      default:
        parts[2]++;
        break;
    }
    
    return parts.join('.');
  }

  // Generar release notes automáticas
  generateReleaseNotes(version, type) {
    const typeMessages = {
      major: `Versión ${version} - ACTUALIZACIÓN MAYOR con nuevas funcionalidades principales`,
      minor: `Versión ${version} - Nuevas características y mejoras significativas`,
      patch: `Versión ${version} - Correcciones y mejoras de estabilidad`
    };

    return typeMessages[type] || typeMessages.patch;
  }

  // Verificar estado del sistema
  async getSystemStatus() {
    try {
      const status = await autoFirebaseSetup.getSetupStatus();
      return {
        firebase: status,
        initialized: this.isInitialized,
        ready: status.configured && this.isInitialized
      };
    } catch (error) {
      return {
        firebase: { configured: false, error: error.message },
        initialized: this.isInitialized,
        ready: false
      };
    }
  }
}

// Instancia singleton
const autoUpdateManager = new AutoUpdateManager();
export default autoUpdateManager;