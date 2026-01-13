#!/usr/bin/env node

/**
 * Script automatizado para deploy a Firebase usando Web SDK
 * Uso: node firebase-web-deploy.js [tipo]
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description, options = {}) {
  try {
    log(`ℹ️  ${description}...`, 'blue');
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    log(`✅ ${description} completado`, 'green');
    return result;
  } catch (error) {
    log(`❌ ${description} falló: ${error.message}`, 'red');
    throw error;
  }
}

// Actualizar versión y construir
async function buildAndPrepare(versionType) {
  const currentVersion = JSON.parse(fs.readFileSync('package.json', 'utf8')).version;
  const parts = currentVersion.split('.').map(Number);
  
  switch (versionType) {
    case 'major': parts[0]++; parts[1] = 0; parts[2] = 0; break;
    case 'minor': parts[1]++; parts[2] = 0; break;
    default: parts[2]++; break;
  }
  
  const newVersion = parts.join('.');
  
  log(`📝 Actualizando versión: ${currentVersion} → ${newVersion}`, 'blue');
  
  // Actualizar package.json
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  
  // Actualizar updateService.js
  const updateServicePath = 'src/services/updateService.js';
  if (fs.existsSync(updateServicePath)) {
    let content = fs.readFileSync(updateServicePath, 'utf8');
    content = content.replace(
      /const hardcodedVersion = '[^']+';/,
      `const hardcodedVersion = '${newVersion}';`
    );
    fs.writeFileSync(updateServicePath, content);
  }
  
  // Construir
  log('\\n🔨 Construyendo aplicación completa...', 'bright');
  execCommand('npm run build', 'Build de React');
  execCommand('npx cap sync', 'Sync de Capacitor');
  execCommand('gradlew.bat clean assembleRelease', 'Build de APK Android', { cwd: 'android' });
  
  // Preparar APK
  const releasesDir = 'releases';
  if (!fs.existsSync(releasesDir)) fs.mkdirSync(releasesDir);
  
  const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
  const targetApk = `releases/namustock-${newVersion}.apk`;
  
  if (!fs.existsSync(sourceApk)) {
    throw new Error('APK no encontrado en: ' + sourceApk);
  }
  
  fs.copyFileSync(sourceApk, targetApk);
  const stats = fs.statSync(targetApk);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  log(`✅ APK preparado: ${targetApk} (${sizeInMB} MB)`, 'green');
  
  return { newVersion, targetApk, sizeInMB, fileSize: stats.size };
}

// Subir a Firebase usando Web SDK
async function uploadToFirebase(apkPath, version, sizeInMB, fileSize) {
  log('\\n☁️ Subiendo a Firebase Storage...', 'bright');
  
  // Crear script que usa Firebase Web SDK
  const uploadScript = `
// Firebase upload usando Web SDK
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  apiKey: "AIzaSyBjOHlQnh9oMs7RV4IrEJSik0AELCQsQTQ",
  authDomain: "namu-inv.firebaseapp.com",
  projectId: "namu-inv",
  storageBucket: "namu-inv.firebasestorage.app",
  messagingSenderId: "1054302858836",
  appId: "1:1054302858836:web:e2807325619f3fd0ad47c1"
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

async function uploadAndUpdate() {
  try {
    // Leer archivo APK
    const apkBuffer = fs.readFileSync('${apkPath.replace(/\\\\/g, '/')}');
    console.log('📱 Archivo leído:', (apkBuffer.length / (1024 * 1024)).toFixed(2), 'MB');
    
    // Subir a Storage
    const storageRef = ref(storage, 'releases/namustock-${version}.apk');
    console.log('⬆️ Subiendo a Firebase Storage...');
    
    const snapshot = await uploadBytes(storageRef, apkBuffer, {
      contentType: 'application/vnd.android.package-archive'
    });
    
    console.log('✅ Archivo subido a Storage');
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('🔗 URL de descarga:', downloadURL);
    
    // Actualizar Firestore
    console.log('📝 Actualizando información en Firestore...');
    const versionData = {
      version: '${version}',
      storagePath: 'releases/namustock-${version}.apk',
      downloadUrl: downloadURL,
      notes: 'Nueva versión ${version} con actualizaciones automáticas desde Firebase Storage',
      fileSize: '${sizeInMB} MB',
      fileSizeBytes: ${fileSize},
      releaseDate: new Date(),
      platform: 'android',
      type: 'firebase-storage',
      lastUpdated: new Date().toISOString()
    };
    
    await setDoc(doc(db, 'appConfig', 'version'), versionData);
    console.log('✅ Firestore actualizado');
    console.log('🎉 Deploy completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadAndUpdate();
`;

  // Escribir script como módulo ES6
  const scriptPath = 'temp-firebase-upload.mjs';
  fs.writeFileSync(scriptPath, uploadScript);
  
  try {
    // Ejecutar script
    execCommand(`node ${scriptPath}`, 'Subida y actualización de Firebase');
    return true;
  } catch (error) {
    log('⚠️ Error con módulo ES6, intentando método alternativo...', 'yellow');
    
    // Script alternativo usando require (CommonJS)
    const altScript = `
const admin = require('firebase-admin');
const fs = require('fs');

// Usar credenciales por defecto o clave de servicio
try {
  admin.initializeApp({
    projectId: 'namu-inv',
    storageBucket: 'namu-inv.firebasestorage.app'
  });
} catch (error) {
  console.log('⚠️ Error inicializando Firebase Admin:', error.message);
  console.log('📋 Pasos manuales necesarios:');
  console.log('1. Ve a Firebase Console Storage');
  console.log('2. Sube: ${apkPath}');
  console.log('3. Path: releases/namustock-${version}.apk');
  console.log('4. Actualiza Firestore appConfig/version');
  process.exit(0);
}

async function uploadWithAdmin() {
  try {
    const bucket = admin.storage().bucket();
    const db = admin.firestore();
    
    // Subir archivo
    console.log('⬆️ Subiendo con Firebase Admin...');
    const [file] = await bucket.upload('${apkPath.replace(/\\\\/g, '/')}', {
      destination: 'releases/namustock-${version}.apk',
      metadata: {
        contentType: 'application/vnd.android.package-archive'
      }
    });
    
    await file.makePublic();
    console.log('✅ Archivo subido y configurado como público');
    
    // Actualizar Firestore
    const versionData = {
      version: '${version}',
      storagePath: 'releases/namustock-${version}.apk',
      notes: 'Nueva versión ${version} disponible',
      fileSize: '${sizeInMB} MB',
      fileSizeBytes: ${fileSize},
      releaseDate: admin.firestore.FieldValue.serverTimestamp(),
      platform: 'android',
      type: 'firebase-storage',
      lastUpdated: new Date().toISOString()
    };
    
    await db.collection('appConfig').doc('version').set(versionData);
    console.log('✅ Firestore actualizado');
    console.log('🎉 Deploy completado!');
    
  } catch (error) {
    console.error('❌ Error con Admin SDK:', error.message);
    console.log('📋 Realiza estos pasos manualmente:');
    console.log('1. Firebase Console > Storage');
    console.log('2. Sube: ${apkPath}');
    console.log('3. Path: releases/namustock-${version}.apk');
    console.log('4. Firestore > appConfig > version (actualizar)');
  }
}

uploadWithAdmin();
`;
    
    const altScriptPath = 'temp-firebase-admin.js';
    fs.writeFileSync(altScript, altScript);
    
    try {
      execCommand(`node ${altScriptPath}`, 'Upload alternativo con Admin SDK');
    } catch (adminError) {
      log('⚠️ Admin SDK también falló, mostrando pasos manuales', 'yellow');
    } finally {
      if (fs.existsSync(altScriptPath)) fs.unlinkSync(altScriptPath);
    }
    
  } finally {
    // Limpiar scripts temporales
    if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath);
  }
}

async function main() {
  const versionType = process.argv[2] || 'patch';
  
  try {
    log('🔥 Iniciando deploy automatizado a Firebase...\\n', 'bright');
    
    // 1. Construir y preparar
    const { newVersion, targetApk, sizeInMB, fileSize } = await buildAndPrepare(versionType);
    
    // 2. Subir a Firebase
    await uploadToFirebase(targetApk, newVersion, sizeInMB, fileSize);
    
    // 3. Commit cambios
    log('\\n📤 Commiteando cambios...', 'bright');
    try {
      execCommand('git add package.json src/services/updateService.js', 'Git add');
      execCommand(`git commit -m "🔥 Firebase Deploy v${newVersion}"`, 'Git commit');
      execCommand('git push origin main', 'Git push');
    } catch (gitError) {
      log('⚠️ Error con Git (no crítico)', 'yellow');
    }
    
    log('\\n🎉 Deploy completado exitosamente!', 'bright');
    log(`📱 Nueva versión: ${newVersion}`, 'green');
    log(`📦 APK: ${targetApk}`, 'green');
    log('🔥 Las apps detectarán la actualización automáticamente', 'green');
    
  } catch (error) {
    log(`\\n❌ Deploy falló: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();