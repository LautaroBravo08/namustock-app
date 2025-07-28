// Configuración automática de Firebase para actualizaciones
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class AutoFirebaseSetup {
  constructor() {
    this.isSetup = false;
    this.setupPromise = null;
  }

  // Configurar Firebase automáticamente
  async setupFirebaseUpdates() {
    if (this.isSetup) return true;
    if (this.setupPromise) return this.setupPromise;

    console.log('🔥 Configurando Firebase automáticamente...');
    
    this.setupPromise = this._performSetup();
    return this.setupPromise;
  }

  async _performSetup() {
    try {
      // Verificar si ya existe la configuración
      const versionDoc = await this._checkExistingSetup();
      
      if (versionDoc) {
        console.log('✅ Firebase ya está configurado');
        this.isSetup = true;
        return true;
      }

      // Crear la configuración automáticamente
      await this._createVersionDocument();
      
      console.log('✅ Firebase configurado automáticamente');
      this.isSetup = true;
      return true;
      
    } catch (error) {
      console.error('❌ Error configurando Firebase:', error);
      return false;
    }
  }

  // Verificar si ya existe la configuración
  async _checkExistingSetup() {
    try {
      console.log('🔍 Verificando configuración existente...');
      const docRef = doc(db, 'app', 'version');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('📦 Configuración encontrada:', data.version);
        return data;
      }
      
      console.log('⚠️ No hay configuración existente');
      return null;
    } catch (error) {
      console.log('⚠️ Error verificando configuración:', error.message);
      return null;
    }
  }

  // Crear el documento de versión automáticamente
  async _createVersionDocument() {
    console.log('📝 Creando configuración de versión...');
    
    const currentVersion = process.env.REACT_APP_VERSION || '1.0.83';
    const nextVersion = this._incrementVersion(currentVersion);
    
    const versionData = {
      version: nextVersion,
      buildDate: new Date().toISOString(),
      platform: 'android',
      versionType: 'patch',
      features: [
        'Sistema de inventario completo',
        'Gestión de ventas optimizada',
        'Actualizaciones automáticas con Firebase',
        'Sin problemas de rate limit',
        'Notificaciones en tiempo real',
        'Configuración automática de base de datos',
        'Interfaz de usuario mejorada'
      ],
      releaseNotes: `Versión ${nextVersion} - Sistema de actualizaciones automático con Firebase`,
      downloads: {
        android: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${nextVersion}/namustock-${nextVersion}.apk`,
        ios: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${nextVersion}/namustock-${nextVersion}.ipa`
      },
      baseUrl: 'https://github.com/LautaroBravo08/namustock-app',
      updateSystem: {
        source: 'firebase',
        autoSetup: true,
        cacheEnabled: false,
        realTimeUpdates: true,
        supportedPlatforms: ['android'],
        platformRestriction: 'android-only'
      },
      lastUpdated: new Date().toISOString(),
      autoCreated: true
    };

    const docRef = doc(db, 'app', 'version');
    await setDoc(docRef, versionData);
    
    console.log('✅ Documento de versión creado:', nextVersion);
    return versionData;
  }

  // Incrementar versión automáticamente
  _incrementVersion(version) {
    const parts = version.split('.').map(Number);
    parts[2]++; // Incrementar patch
    return parts.join('.');
  }

  // Actualizar versión (para releases futuros)
  async updateVersion(newVersion, releaseNotes = null) {
    try {
      console.log('🔄 Actualizando versión a:', newVersion);
      
      const versionData = {
        version: newVersion,
        buildDate: new Date().toISOString(),
        platform: 'android',
        versionType: 'patch',
        features: [
          'Sistema de inventario completo',
          'Gestión de ventas optimizada',
          'Actualizaciones automáticas con Firebase',
          'Sin problemas de rate limit',
          'Notificaciones en tiempo real',
          'Configuración automática de base de datos',
          'Interfaz de usuario mejorada'
        ],
        releaseNotes: releaseNotes || `Versión ${newVersion} - Actualización automática`,
        downloads: {
          android: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/namustock-${newVersion}.apk`,
          ios: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/namustock-${newVersion}.ipa`
        },
        baseUrl: 'https://github.com/LautaroBravo08/namustock-app',
        updateSystem: {
          source: 'firebase',
          autoSetup: true,
          cacheEnabled: false,
          realTimeUpdates: true,
          supportedPlatforms: ['android'],
          platformRestriction: 'android-only'
        },
        lastUpdated: new Date().toISOString(),
        autoUpdated: true
      };

      const docRef = doc(db, 'app', 'version');
      await setDoc(docRef, versionData);
      
      console.log('✅ Versión actualizada exitosamente:', newVersion);
      return { success: true, version: newVersion };
      
    } catch (error) {
      console.error('❌ Error actualizando versión:', error);
      return { success: false, error: error.message };
    }
  }

  // Verificar estado de la configuración
  async getSetupStatus() {
    try {
      const docRef = doc(db, 'app', 'version');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          configured: true,
          version: data.version,
          lastUpdated: data.lastUpdated,
          autoCreated: data.autoCreated || false
        };
      }
      
      return { configured: false };
    } catch (error) {
      return { configured: false, error: error.message };
    }
  }
}

// Instancia singleton
const autoFirebaseSetup = new AutoFirebaseSetup();
export default autoFirebaseSetup;