#!/usr/bin/env node

/**
 * Script para actualizar la versión en Firebase automáticamente
 * Se ejecuta después de crear un nuevo release
 */

const admin = require('firebase-admin');

// Configurar Firebase Admin (necesitas el archivo de credenciales)
// const serviceAccount = require('./path/to/serviceAccountKey.json');
// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });

const db = admin.firestore();

async function updateFirebaseVersion() {
  const versionData = {
  "version": "1.0.83",
  "buildDate": "2025-07-28T09:05:09.422Z",
  "platform": "android",
  "versionType": "patch",
  "features": [
    "Sistema de inventario completo",
    "Gestión de ventas optimizada",
    "Actualizaciones inteligentes (solo al iniciar + manual)",
    "Cache optimizado para GitHub API",
    "Limpieza automática de archivos antiguos",
    "Interfaz de usuario mejorada",
    "Correcciones de errores menores",
    "Mejoras de estabilidad",
    "Optimizaciones de rendimiento"
  ],
  "releaseNotes": "Versión 1.0.83 - Correcciones y mejoras de estabilidad",
  "downloads": {
    "android": "https://github.com/LautaroBravo08/namustock-app/releases/download/v1.0.83/namustock-1.0.83.apk",
    "ios": "https://github.com/LautaroBravo08/namustock-app/releases/download/v1.0.83/namustock-1.0.83.ipa"
  },
  "baseUrl": "https://github.com/LautaroBravo08/namustock-app",
  "updateSystem": {
    "source": "firebase",
    "cacheEnabled": false,
    "realTimeUpdates": true,
    "supportedPlatforms": [
      "android"
    ],
    "platformRestriction": "android-only"
  },
  "lastUpdated": "2025-07-28T09:05:09.422Z"
};
  
  try {
    await db.collection('app').doc('version').set(versionData);
    console.log('✅ Versión actualizada en Firebase:', versionData.version);
  } catch (error) {
    console.error('❌ Error actualizando Firebase:', error);
  }
}

updateFirebaseVersion();