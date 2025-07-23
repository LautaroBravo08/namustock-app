// Gestor de versiones - Maneja la sincronización y limpieza de versiones
class VersionManager {
  constructor() {
    this.currentVersion = process.env.REACT_APP_VERSION || '1.0.0';
    this.storageKeys = {
      installed: 'installed-app-version',
      lastChecked: 'last-checked-version',
      legacy: 'app-version' // versión legacy para limpiar
    };
  }

  // Obtener versión instalada
  getInstalledVersion() {
    return localStorage.getItem(this.storageKeys.installed) || this.currentVersion;
  }

  // Obtener versión del código actual
  getCurrentVersion() {
    return this.currentVersion;
  }

  // Verificar si hay inconsistencias en las versiones
  hasVersionInconsistency() {
    const installed = this.getInstalledVersion();
    const current = this.getCurrentVersion();
    
    // Si la versión instalada es muy antigua comparada con la actual, hay inconsistencia
    if (this.isVersionMuchOlder(installed, current)) {
      return true;
    }
    
    return false;
  }

  // Verificar si una versión es mucho más antigua que otra (más de 5 versiones de diferencia)
  isVersionMuchOlder(oldVersion, newVersion) {
    try {
      const oldParts = oldVersion.split('.').map(Number);
      const newParts = newVersion.split('.').map(Number);
      
      // Calcular diferencia en versiones patch
      const oldTotal = (oldParts[0] || 0) * 10000 + (oldParts[1] || 0) * 100 + (oldParts[2] || 0);
      const newTotal = (newParts[0] || 0) * 10000 + (newParts[1] || 0) * 100 + (newParts[2] || 0);
      
      // Si hay más de 5 versiones de diferencia, considerarlo inconsistente
      return (newTotal - oldTotal) > 5;
    } catch (error) {
      console.error('Error comparando versiones:', error);
      return false;
    }
  }

  // Limpiar versiones inconsistentes
  cleanInconsistentVersions() {
    console.log('🧹 Limpiando versiones inconsistentes...');
    
    const beforeState = {
      installed: localStorage.getItem(this.storageKeys.installed),
      lastChecked: localStorage.getItem(this.storageKeys.lastChecked),
      legacy: localStorage.getItem(this.storageKeys.legacy)
    };
    
    console.log('📊 Estado antes de limpiar:', beforeState);
    
    // Limpiar todas las versiones almacenadas
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Establecer la versión actual como instalada
    localStorage.setItem(this.storageKeys.installed, this.currentVersion);
    localStorage.setItem(this.storageKeys.lastChecked, this.currentVersion);
    
    console.log('✅ Versiones limpiadas y sincronizadas con:', this.currentVersion);
    
    return {
      cleaned: true,
      previousState: beforeState,
      newVersion: this.currentVersion
    };
  }

  // Sincronizar versiones automáticamente
  autoSync() {
    console.log('🔄 Iniciando sincronización automática de versiones...');
    
    const installed = this.getInstalledVersion();
    const current = this.getCurrentVersion();
    
    console.log('📊 Estado actual:', {
      instalada: installed,
      codigo: current,
      inconsistencia: this.hasVersionInconsistency()
    });
    
    // Si hay inconsistencia, limpiar automáticamente
    if (this.hasVersionInconsistency()) {
      console.log('⚠️ Inconsistencia detectada, limpiando automáticamente...');
      return this.cleanInconsistentVersions();
    }
    
    // Si no hay versión instalada, inicializar
    if (!installed) {
      console.log('🆕 Inicializando versión por primera vez');
      localStorage.setItem(this.storageKeys.installed, current);
      localStorage.setItem(this.storageKeys.lastChecked, current);
      return { initialized: true, version: current };
    }
    
    // Si las versiones son diferentes pero no inconsistentes, actualizar
    if (installed !== current) {
      console.log('🔄 Actualizando versión instalada');
      localStorage.setItem(this.storageKeys.installed, current);
      localStorage.setItem(this.storageKeys.lastChecked, current);
      return { updated: true, from: installed, to: current };
    }
    
    console.log('✅ Versiones ya sincronizadas');
    return { synced: true, version: current };
  }

  // Obtener información completa de versiones
  getVersionInfo() {
    return {
      current: this.getCurrentVersion(),
      installed: this.getInstalledVersion(),
      lastChecked: localStorage.getItem(this.storageKeys.lastChecked),
      hasInconsistency: this.hasVersionInconsistency(),
      storageKeys: this.storageKeys
    };
  }

  // Reset completo (para debugging)
  reset() {
    console.log('🔄 Reset completo de versiones');
    Object.values(this.storageKeys).forEach(key => {
      localStorage.removeItem(key);
    });
    return this.autoSync();
  }
}

// Instancia singleton
const versionManager = new VersionManager();
export default versionManager;