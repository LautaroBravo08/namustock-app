/**
 * Script para automatizar el despliegue de actualizaciones a Firebase
 * 
 * Este script:
 * 1. Sube el APK a Firebase Storage
 * 2. Actualiza la información de versión en Firestore
 * 
 * Uso: node auto-deploy-firebase.js <ruta-al-apk> <version> <notas>
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin
const serviceAccount = require('../firebase-credentials.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'namustock-app.appspot.com' // Reemplazar con tu bucket
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Obtener argumentos
const apkPath = process.argv[2];
const version = process.argv[3];
const releaseNotes = process.argv[4] || 'Nueva versión disponible';

if (!apkPath || !version) {
  console.error('Uso: node auto-deploy-firebase.js <ruta-al-apk> <version> <notas>');
  process.exit(1);
}

// Verificar que el archivo existe
if (!fs.existsSync(apkPath)) {
  console.error(`El archivo APK no existe: ${apkPath}`);
  process.exit(1);
}

// Nombre del archivo en Firebase Storage
const apkFileName = `releases/namustock-${version}.apk`;

async function deployUpdate() {
  try {
    console.log('🚀 Iniciando despliegue de actualización a Firebase...');
    
    // 1. Subir APK a Firebase Storage
    console.log(`⬆️ Subiendo APK a Firebase Storage: ${apkFileName}`);
    await bucket.upload(apkPath, {
      destination: apkFileName,
      metadata: {
        contentType: 'application/vnd.android.package-archive',
      }
    });
    console.log('✅ APK subido correctamente');
    
    // 2. Actualizar información de versión en Firestore
    console.log(`📝 Actualizando información de versión en Firestore: ${version}`);
    await db.collection('appConfig').doc('version').set({
      version: version,
      notes: releaseNotes,
      apkPath: apkFileName,
      releaseDate: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Información de versión actualizada correctamente');
    
    console.log('🎉 Despliegue completado con éxito!');
    console.log(`
    Resumen:
    - Versión: ${version}
    - APK: ${apkFileName}
    - Notas: ${releaseNotes}
    `);
    
  } catch (error) {
    console.error('❌ Error durante el despliegue:', error);
    process.exit(1);
  }
}

deployUpdate();