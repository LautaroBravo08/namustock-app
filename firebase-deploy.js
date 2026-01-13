#!/usr/bin/env node

/**
 * Script completo para build, APK y deploy automático a Firebase Storage
 * Uso: node firebase-deploy.js [tipo] [opciones]
 * 
 * Tipos: patch, minor, major
 * Opciones: --clean, --auto
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step} ${message}`, 'bright');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging mejorado
function execCommand(command, description, options = {}) {
  try {
    logInfo(`Ejecutando: ${description}`);
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    logSuccess(`${description} completado`);
    return result;
  } catch (error) {
    logError(`Error en ${description}: ${error.message}`);
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

// Verificar dependencias
function checkDependencies() {
  logStep('🔍', 'Verificando dependencias...');

  // Verificar Node.js y npm
  try {
    const nodeVersion = execCommand('node --version', 'Verificación de Node.js', { silent: true });
    const npmVersion = execCommand('npm --version', 'Verificación de npm', { silent: true });
    logSuccess(`Node.js: ${nodeVersion.trim()}, npm: ${npmVersion.trim()}`);
  } catch (error) {
    logError('Node.js o npm no están instalados');
    throw error;
  }

  // Verificar Firebase CLI
  try {
    const firebaseVersion = execCommand('firebase --version', 'Verificación de Firebase CLI', { silent: true });
    logSuccess(`Firebase CLI: ${firebaseVersion.trim()}`);
  } catch (error) {
    logError('Firebase CLI no está instalado. Instálalo con: npm install -g firebase-tools');
    throw error;
  }

  // Verificar que esté autenticado
  try {
    execCommand('firebase auth:print-access-token', 'Verificación de autenticación Firebase', { silent: true });
    logSuccess('Firebase CLI autenticado correctamente');
  } catch (error) {
    logError('Firebase CLI no está autenticado. Ejecuta: firebase login');
    throw error;
  }
}

// Leer versión actual
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    logError('No se pudo leer package.json');
    return '1.0.0';
  }
}

// Incrementar versión
function incrementVersion(version, type = 'patch') {
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

// Limpiar archivos antiguos
async function cleanOldFiles() {
  logStep('🧹', 'Limpiando archivos antiguos...');

  const filesToClean = [
    'build',
    'android/app/build',
    'android/build',
    'dist'
  ];

  for (const file of filesToClean) {
    try {
      if (fs.existsSync(file)) {
        if (process.platform === 'win32') {
          execCommand(`rmdir /s /q "${file}"`, `Eliminando ${file}`, { throwOnError: false });
        } else {
          execCommand(`rm -rf "${file}"`, `Eliminando ${file}`, { throwOnError: false });
        }
      }
    } catch (error) {
      logWarning(`No se pudo eliminar ${file}: ${error.message}`);
    }
  }

  logSuccess('Limpieza completada');
}

// Actualizar versión en archivos
function updateVersionInFiles(newVersion) {
  logStep('📝', 'Actualizando versión en archivos...');

  try {
    // Actualizar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    logSuccess('package.json actualizado');

    // Actualizar version.json
    const versionPath = 'public/version.json';
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      versionData.version = newVersion;
      versionData.buildDate = new Date().toISOString();
      versionData.features = [
        "Sistema de inventario completo",
        "Gestión de ventas optimizada",
        "Actualizaciones automáticas desde Firebase",
        "Sistema de imágenes optimizado",
        "Instalación directa sin salir de la app",
        "Descargas seguras desde Firebase Storage"
      ];
      versionData.releaseNotes = `Versión ${newVersion} con actualizaciones automáticas desde Firebase Storage`;

      fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      logSuccess('version.json actualizado');
    }

    // Actualizar updateService.js
    const updateServicePath = 'src/services/updateService.js';
    if (fs.existsSync(updateServicePath)) {
      let content = fs.readFileSync(updateServicePath, 'utf8');
      content = content.replace(
        /const hardcodedVersion = '[^']+';/,
        `const hardcodedVersion = '${newVersion}';`
      );
      fs.writeFileSync(updateServicePath, content);
      logSuccess('updateService.js actualizado');
    }

  } catch (error) {
    logError(`Error actualizando archivos: ${error.message}`);
    throw error;
  }
}

// Construir aplicación completa
async function buildApplication() {
  logStep('🔨', 'Construyendo aplicación completa...');

  try {
    // 1. Instalar dependencias si es necesario
    if (!fs.existsSync('node_modules')) {
      execCommand('npm install', 'Instalación de dependencias');
    }

    // 2. Construir React
    execCommand('npm run build', 'Construcción de React');

    // 3. Sincronizar con Capacitor
    execCommand('npx cap sync', 'Sincronización de Capacitor');

    // 4. Limpiar build de Android
    execCommand('gradlew.bat clean', 'Limpieza de Android', { cwd: 'android' });

    // 5. Construir APK de release
    logInfo('Construyendo APK de release...');
    execCommand('gradlew.bat assembleRelease --stacktrace', 'Construcción de APK Release', { cwd: 'android' });

    logSuccess('Aplicación construida exitosamente');

  } catch (error) {
    logError(`Error en construcción: ${error.message}`);
    throw error;
  }
}

// Preparar archivos para Firebase
function prepareReleaseFiles(version) {
  logStep('📦', 'Preparando archivos para Firebase...');

  try {
    const releasesDir = 'releases';
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir);
    }

    // Copiar APK
    const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
    const targetApk = `releases/namustock-${version}.apk`;

    if (fs.existsSync(sourceApk)) {
      fs.copyFileSync(sourceApk, targetApk);
      logSuccess(`APK copiado: ${targetApk}`);

      // Mostrar información del archivo
      const stats = fs.statSync(targetApk);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      logInfo(`Tamaño del APK: ${sizeInMB} MB`);

      return { apkPath: targetApk, apkSize: sizeInMB, fileSize: stats.size };
    } else {
      throw new Error('APK no encontrado en la ruta esperada');
    }

  } catch (error) {
    logError(`Error preparando archivos: ${error.message}`);
    throw error;
  }
}

// Subir APK a Firebase Storage usando REST API
async function uploadToFirebaseStorage(apkPath, version, fileSize) {
  logStep('☁️', 'Subiendo APK a Firebase Storage...');

  try {
    const storagePath = `releases/namustock-${version}.apk`;
    
    // Obtener token de acceso
    const accessToken = execCommand('firebase auth:print-access-token', 'Obteniendo token de acceso', { silent: true }).trim();
    
    // Verificar que el archivo existe
    if (!fs.existsSync(apkPath)) {
      throw new Error(`Archivo APK no encontrado: ${apkPath}`);
    }

    const fileStats = fs.statSync(apkPath);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    logInfo(`Tamaño del archivo: ${fileSizeMB} MB`);
    
    // Crear script de subida usando REST API
    const uploadScript = `
const fs = require('fs');
const https = require('https');

async function uploadFile() {
  try {
    const fileBuffer = fs.readFileSync('${apkPath.replace(/\\/g, '/')}');
    const projectId = 'namu-inv';
    const bucket = 'namu-inv.firebasestorage.app';
    const storagePath = '${storagePath}';
    const accessToken = '${accessToken}';
    
    const uploadUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket}/o?name=\${encodeURIComponent(storagePath)}&uploadType=media\`;
    
    console.log('🔗 Subiendo a:', uploadUrl.replace(accessToken, '[TOKEN]'));
    console.log('📦 Tamaño:', (fileBuffer.length / (1024 * 1024)).toFixed(2), 'MB');
    
    const options = {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Length': fileBuffer.length
      }
    };
    
    const req = https.request(uploadUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Archivo subido exitosamente a Firebase Storage');
          console.log('📁 Path:', storagePath);
          makeFilePublic(projectId, bucket, storagePath, accessToken);
        } else {
          console.error('❌ Error HTTP:', res.statusCode, res.statusMessage);
          console.error('❌ Respuesta:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      process.exit(1);
    });
    
    req.write(fileBuffer);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function makeFilePublic(projectId, bucket, storagePath, accessToken) {
  const publicUrl = \`https://firebasestorage.googleapis.com/v0/b/\${bucket}/o/\${encodeURIComponent(storagePath)}/acl\`;
  
  const postData = JSON.stringify({
    entity: 'allUsers',
    role: 'READER'
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  console.log('🌐 Configurando archivo como público...');
  
  const req = https.request(publicUrl, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Archivo configurado como público');
      } else {
        console.log('⚠️ Advertencia: No se pudo hacer público (puede que ya lo sea)');
      }
      process.exit(0);
    });
  });
  
  req.on('error', (error) => {
    console.log('⚠️ Advertencia al configurar público:', error.message);
    process.exit(0);
  });
  
  req.write(postData);
  req.end();
}

uploadFile();
`;

    // Escribir script temporal
    const scriptPath = 'temp-upload-firebase.js';
    fs.writeFileSync(scriptPath, uploadScript);

    try {
      // Ejecutar script de subida
      execCommand(`node ${scriptPath}`, 'Subida a Firebase Storage');
      logSuccess(`APK subido a Firebase Storage: ${storagePath}`);
      return storagePath;
    } finally {
      // Limpiar script temporal
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }

  } catch (error) {
    logError(`Error subiendo a Firebase Storage: ${error.message}`);
    throw error;
  }
}

// Actualizar información de versión en Firestore usando REST API
async function updateFirestoreVersion(version, storagePath, apkSize, fileSize, releaseNotes) {
  logStep('🔄', 'Actualizando información de versión en Firestore...');

  try {
    // Obtener token de acceso
    const accessToken = execCommand('firebase auth:print-access-token', 'Obteniendo token de acceso', { silent: true }).trim();
    
    // Crear script para actualizar Firestore usando REST API
    const firestoreScript = `
const https = require('https');

async function updateVersion() {
  try {
    const projectId = 'namu-inv';
    const accessToken = '${accessToken}';
    const collection = 'appConfig';
    const document = 'version';
    
    const versionData = {
      fields: {
        version: { stringValue: '${version}' },
        storagePath: { stringValue: '${storagePath}' },
        notes: { stringValue: '${releaseNotes.replace(/'/g, "\\'").replace(/"/g, '\\"')}' },
        fileSize: { stringValue: '${apkSize} MB' },
        fileSizeBytes: { integerValue: '${fileSize}' },
        releaseDate: { timestampValue: new Date().toISOString() },
        platform: { stringValue: 'android' },
        type: { stringValue: 'firebase-storage' },
        lastUpdated: { timestampValue: new Date().toISOString() }
      }
    };
    
    const firestoreUrl = \`https://firestore.googleapis.com/v1/projects/\${projectId}/databases/(default)/documents/\${collection}/\${document}\`;
    const postData = JSON.stringify(versionData);
    
    console.log('🔗 Actualizando Firestore:', firestoreUrl.replace(accessToken, '[TOKEN]'));
    console.log('📝 Datos de versión: v${version}');
    
    const options = {
      method: 'PATCH',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = https.request(firestoreUrl, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Información de versión actualizada en Firestore');
          process.exit(0);
        } else {
          console.error('❌ Error HTTP:', res.statusCode, res.statusMessage);
          console.error('❌ Respuesta:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Error de red:', error.message);
      process.exit(1);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error actualizando Firestore:', error.message);
    process.exit(1);
  }
}

updateVersion();
`;

    // Escribir script temporal
    const scriptPath = 'temp-update-firestore-rest.js';
    fs.writeFileSync(scriptPath, firestoreScript);

    try {
      // Ejecutar script con REST API
      execCommand(`node ${scriptPath}`, 'Actualización de Firestore');
      logSuccess('Versión actualizada en Firestore');
    } finally {
      // Limpiar script temporal
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }

  } catch (error) {
    logError(`Error actualizando Firestore: ${error.message}`);
    throw error;
  }
}

// Commit y push de cambios
async function commitAndPush(version) {
  logStep('📤', 'Commiteando y pusheando cambios...');

  try {
    // Verificar si hay cambios
    const status = execCommand('git status --porcelain', 'Verificación de cambios', { silent: true });

    if (status.trim()) {
      // Agregar archivos modificados
      execCommand('git add package.json public/version.json src/services/updateService.js', 'Agregando archivos modificados');

      // Commit
      execCommand(`git commit -m "🔥 Firebase Deploy v${version} - Actualizaciones automáticas desde Firebase Storage"`, 'Commit de cambios');

      // Push
      execCommand('git push origin main', 'Push a repositorio remoto');

      logSuccess('Cambios commiteados y pusheados');
    } else {
      logInfo('No hay cambios para commitear');
    }

  } catch (error) {
    logWarning(`Error en git operations: ${error.message}`);
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const shouldClean = args.includes('--clean');
  const autoMode = args.includes('--auto');

  try {
    log('\n🔥 Iniciando deploy automático a Firebase Storage...', 'bright');
    log('═'.repeat(60), 'cyan');

    // 1. Verificar dependencias
    checkDependencies();

    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);

    logInfo(`Versión actual: ${currentVersion}`);
    logInfo(`Nueva versión: ${newVersion}`);
    logInfo(`Tipo de actualización: ${versionType}`);

    if (!autoMode) {
      log('\n¿Continuar con el proceso completo? (y/N): ', 'yellow');
      logInfo('Continuando en modo automático...');
    }

    // 2. Limpiar archivos antiguos si se solicita
    if (shouldClean) {
      await cleanOldFiles();
    }

    // 3. Actualizar versión en archivos
    updateVersionInFiles(newVersion);

    // 4. Construir aplicación completa
    await buildApplication();

    // 5. Preparar archivos para Firebase
    const { apkPath, apkSize, fileSize } = prepareReleaseFiles(newVersion);

    // 6. Subir APK a Firebase Storage
    const storagePath = await uploadToFirebaseStorage(apkPath, newVersion, fileSize);

    // 7. Actualizar información en Firestore
    const releaseNotes = `Nueva versión ${newVersion} disponible con actualizaciones automáticas desde Firebase Storage`;
    await updateFirestoreVersion(newVersion, storagePath, apkSize, fileSize, releaseNotes);

    // 8. Commit y push de cambios
    await commitAndPush(newVersion);

    // 9. Mostrar resumen final
    logStep('🎉', 'Deploy a Firebase completado exitosamente!');
    log('═'.repeat(60), 'cyan');
    log('\n📋 Resumen del deploy:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`, 'green');
    log(`   • APK generado: ${apkPath} (${apkSize} MB)`, 'green');
    log(`   • Firebase Storage: ${storagePath}`, 'green');
    log(`   • Firestore actualizado: appConfig/version`, 'green');

    log('\n🔗 Información importante:', 'cyan');
    log(`   • Firebase Project: namu-inv`);
    log(`   • Storage Path: ${storagePath}`);
    log(`   • Las apps detectarán automáticamente la nueva versión`);

    log('\n📱 Próximos pasos:', 'magenta');
    log('   1. ✅ El APK está disponible en Firebase Storage');
    log('   2. ✅ Firestore contiene la información de la nueva versión');
    log('   3. 🔄 Los usuarios recibirán notificación de actualización');
    log('   4. 📱 La instalación será automática dentro de la app');

  } catch (error) {
    logError(`\nDeploy a Firebase fallido: ${error.message}`);
    log('\n🔧 Posibles soluciones:', 'yellow');
    log('   • Verificar que Firebase CLI esté instalado y autenticado');
    log('   • Verificar permisos del proyecto Firebase');
    log('   • Verificar que el build de Android funcione correctamente');
    log('   • Ejecutar con --clean para limpiar archivos antiguos');
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n🔥 Script de Deploy Automático a Firebase Storage', 'bright');
  log('═'.repeat(50), 'cyan');
  log('\n🚀 Uso:', 'bright');
  log('   node firebase-deploy.js [tipo] [opciones]');

  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');

  log('\n⚙️  Opciones:', 'cyan');
  log('   --clean  - Limpiar archivos antiguos antes de construir');
  log('   --auto   - Ejecutar sin confirmación');

  log('\n📝 Ejemplos:', 'yellow');
  log('   node firebase-deploy.js patch --clean');
  log('   node firebase-deploy.js minor --auto');
  log('   node firebase-deploy.js major --clean --auto');

  log('\n📋 Lo que hace este script:', 'green');
  log('   1. ✅ Verifica dependencias (Node, npm, Firebase CLI)');
  log('   2. 🧹 Limpia archivos antiguos (opcional)');
  log('   3. 📝 Actualiza versión en todos los archivos');
  log('   4. 🔨 Construye React + Capacitor + APK');
  log('   5. ☁️  Sube APK a Firebase Storage');
  log('   6. 🔄 Actualiza información en Firestore');
  log('   7. 📤 Commitea y pushea cambios');
  log('   8. 🎉 Muestra resumen y enlaces');

  log('\n⚠️  Requisitos:', 'yellow');
  log('   • Firebase CLI instalado y autenticado (firebase login)');
  log('   • Proyecto Firebase configurado (namu-inv)');
  log('   • Android SDK y Gradle configurados');
  log('   • Permisos de lectura/escritura en Firebase Storage y Firestore');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
  process.exit(0);
} else {
  main();
}