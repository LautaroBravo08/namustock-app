#!/usr/bin/env node

/**
 * Script COMPLETAMENTE AUTOMATIZADO para Firebase Storage
 * Uso: node firebase-auto-deploy.js [patch|minor|major]
 * 
 * Requiere: Firebase CLI instalado y autenticado
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

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
    throw error;
  }
}

// Verificar dependencias
function checkDependencies() {
  logStep('🔍', 'Verificando dependencias...');

  // Verificar Firebase CLI
  try {
    const firebaseVersion = execCommand('firebase --version', 'Verificación de Firebase CLI', { silent: true });
    logSuccess(`Firebase CLI: ${firebaseVersion.trim()}`);
  } catch (error) {
    logError('Firebase CLI no está instalado');
    logInfo('Instala con: npm install -g firebase-tools');
    throw error;
  }

  // Verificar autenticación
  try {
    execCommand('firebase projects:list', 'Verificación de autenticación', { silent: true });
    logSuccess('Firebase CLI autenticado correctamente');
  } catch (error) {
    logError('Firebase CLI no está autenticado');
    logInfo('Autentica con: firebase login');
    throw error;
  }

  // Verificar proyecto
  try {
    const projectInfo = execCommand('firebase use', 'Verificación de proyecto', { silent: true });
    if (!projectInfo.includes('namu-inv')) {
      logError('Proyecto incorrecto');
      logInfo('Configura con: firebase use namu-inv');
      throw new Error('Proyecto Firebase incorrecto');
    }
    logSuccess('Proyecto namu-inv configurado');
  } catch (error) {
    if (!error.message.includes('Proyecto Firebase incorrecto')) {
      logInfo('Configurando proyecto...');
      execCommand('firebase use namu-inv', 'Configuración de proyecto');
    } else {
      throw error;
    }
  }
}

// Leer y actualizar versión
function updateVersion(versionType) {
  logStep('📝', 'Actualizando versión...');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const currentVersion = packageJson.version;
  const parts = currentVersion.split('.').map(Number);

  switch (versionType) {
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

  const newVersion = parts.join('.');
  
  // Actualizar package.json
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

  logInfo(`Versión actualizada: ${currentVersion} → ${newVersion}`);
  return newVersion;
}

// Construir aplicación
function buildApplication() {
  logStep('🔨', 'Construyendo aplicación...');

  // Construir React
  execCommand('npm run build', 'Build de React');

  // Sincronizar Capacitor
  execCommand('npx cap sync', 'Sync de Capacitor');

  // Construir APK de Android
  execCommand('gradlew.bat clean assembleRelease --stacktrace', 'Build de APK Android', { 
    cwd: 'android' 
  });

  logSuccess('Aplicación construida exitosamente');
}

// Preparar APK para subida
function prepareAPK(version) {
  logStep('📦', 'Preparando APK...');

  const releasesDir = 'releases';
  if (!fs.existsSync(releasesDir)) {
    fs.mkdirSync(releasesDir);
  }

  const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
  const targetApk = `releases/namustock-${version}.apk`;

  if (!fs.existsSync(sourceApk)) {
    throw new Error('APK no encontrado en: ' + sourceApk);
  }

  fs.copyFileSync(sourceApk, targetApk);
  
  const stats = fs.statSync(targetApk);
  const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  
  logSuccess(`APK preparado: ${targetApk} (${sizeInMB} MB)`);
  
  return {
    apkPath: targetApk,
    sizeInMB: sizeInMB,
    sizeInBytes: stats.size
  };
}

// Subir APK a Firebase Storage
async function uploadToFirebaseStorage(apkPath, version) {
  logStep('☁️', 'Subiendo APK a Firebase Storage...');

  const storagePath = `releases/namustock-${version}.apk`;
  
  // Verificar si existen credenciales de Firebase
  const credentialsPaths = [
    'firebase-credentials.json',
    path.join(process.env.GOOGLE_APPLICATION_CREDENTIALS || ''),
    path.join(__dirname, 'firebase-credentials.json')
  ].filter(p => p && fs.existsSync(p));
  
  if (credentialsPaths.length > 0) {
    // MODO AUTOMÁTICO CON CREDENCIALES
    logInfo('Credenciales de Firebase encontradas - Subida automática');
    
    const uploadScript = `
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Inicializar Firebase Admin con credenciales
const serviceAccount = require(path.resolve('${credentialsPaths[0].replace(/\\/g, '/')}'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'namu-inv.firebasestorage.app'
});

const bucket = admin.storage().bucket();

async function uploadFile() {
  try {
    const filePath = '${apkPath.replace(/\\/g, '/')}';
    const destination = '${storagePath}';
    
    console.log('📤 Subiendo archivo:', filePath);
    console.log('📁 Destino:', destination);
    
    const [file] = await bucket.upload(filePath, {
      destination: destination,
      metadata: {
        contentType: 'application/vnd.android.package-archive',
        metadata: {
          version: '${version}',
          platform: 'android',
          uploadDate: new Date().toISOString()
        }
      }
    });
    
    // Hacer público
    await file.makePublic();
    
    console.log('✅ Archivo subido y configurado como público');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

uploadFile();
`;

    const scriptPath = 'temp-firebase-upload-auto.js';
    fs.writeFileSync(scriptPath, uploadScript);

    try {
      execCommand(`node ${scriptPath}`, 'Subida automática a Firebase Storage');
      logSuccess(`APK subido automáticamente: ${storagePath}`);
      return storagePath;
    } finally {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }
  }
  
  // MODO MANUAL (sin credenciales)
  // MODO MANUAL (sin credenciales)
  logWarning('No se encontraron credenciales de Firebase - Modo manual activado');
  log('\n🔑 Para habilitar subida automática:', 'yellow');
  log('   1. Ve a: https://console.firebase.google.com/project/namu-inv/settings/serviceaccounts/adminsdk', 'cyan');
  log('   2. Genera nueva clave privada ("Generate New Private Key")', 'cyan');
  log('   3. Renómbrala a: firebase-credentials.json', 'cyan');
  log('   4. Guárdala en: ' + __dirname, 'cyan');
  log('   5. Vuelve a ejecutar este comando', 'cyan');
  
  log('\n📋 SUBIDA MANUAL A FIREBASE STORAGE:', 'yellow');
  log('═'.repeat(70), 'yellow');
  log('\nPaso 1: Abre Firebase Console Storage:', 'bright');
  log('https://console.firebase.google.com/project/namu-inv/storage', 'blue');
  log('\nPaso 2: Navega a la carpeta "releases" (créala si no existe)', 'bright');
  log(`\nPaso 3: Sube este archivo:`, 'bright');
  log(`${path.resolve(apkPath)}`, 'blue');
  log(`\nPaso 4: Renómbralo a: namustock-${version}.apk`, 'bright');
  log('\nPaso 5: Haz el archivo público:', 'bright');
  log('  - Clic en el archivo → Permisos → Agregar entrada', 'cyan');
  log('  - Entity: allUsers', 'cyan');
  log('  - Name: allUsers', 'cyan');
  log('  - Access: Reader', 'cyan');
  log('  - Guardar', 'cyan');
  log('\n═'.repeat(70), 'yellow');
  
  // Esperar confirmación del usuario
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('\n✅ ¿Has terminado de subir el archivo? (s/n): ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        logSuccess('Continuando con actualización de Firestore...');
        resolve(storagePath);
      } else {
        log('\n⚠️ Proceso cancelado.', 'yellow');
        throw new Error('Proceso cancelado por el usuario');
      }
    });
  });
}

// Actualizar información en Firestore
async function updateFirestore(version, storagePath, sizeInMB, sizeInBytes) {
  logStep('🔄', 'Actualizando información en Firestore...');

  // Verificar si existen credenciales de Firebase
  const credentialsPaths = [
    'firebase-credentials.json',
    path.join(process.env.GOOGLE_APPLICATION_CREDENTIALS || ''),
    path.join(__dirname, 'firebase-credentials.json')
  ].filter(p => p && fs.existsSync(p));
  
  if (credentialsPaths.length > 0) {
    // MODO AUTOMÁTICO CON CREDENCIALES
    logInfo('Credenciales encontradas - Actualización automática de Firestore');
    
    const updateScript = `
const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin con credenciales
const serviceAccount = require(path.resolve('${credentialsPaths[0].replace(/\\/g, '/')}'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateVersion() {
  try {
    const versionData = {
      version: '${version}',
      storagePath: '${storagePath}',
      notes: 'Nueva versión ${version} disponible con actualizaciones automáticas desde Firebase Storage',
      fileSize: '${sizeInMB} MB',
      fileSizeBytes: ${sizeInBytes},
      releaseDate: admin.firestore.FieldValue.serverTimestamp(),
      platform: 'android',
      type: 'firebase-storage',
      lastUpdated: new Date().toISOString()
    };
    
    console.log('📝 Actualizando documento appConfig/version...');
    
    await db.collection('appConfig').doc('version').set(versionData);
    
    console.log('✅ Firestore actualizado exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error actualizando Firestore:', error.message);
    process.exit(1);
  }
}

updateVersion();
`;

    const scriptPath = 'temp-firestore-update-auto.js';
    fs.writeFileSync(scriptPath, updateScript);

    try {
      execCommand(`node ${scriptPath}`, 'Actualización automática de Firestore');
      logSuccess('Firestore actualizado automáticamente');
      return;
    } finally {
      if (fs.existsSync(scriptPath)) {
        fs.unlinkSync(scriptPath);
      }
    }
  }
  
  // MODO MANUAL (sin credenciales)
  logWarning('Sin credenciales - Actualización manual de Firestore');
  
  log('\n📋 ACTUALIZACIÓN MANUAL DE FIRESTORE:', 'yellow');
  log('═'.repeat(70), 'yellow');
  log('\nPaso 1: Abre Firestore en Firebase Console:', 'bright');
  log('https://console.firebase.google.com/project/namu-inv/firestore', 'blue');
  log('\nPaso 2: Navega a la colección "appConfig"', 'bright');
  log('\nPaso 3: Abre el documento "version"', 'bright');
  log('\nPaso 4: Actualiza con estos valores:', 'bright');
  log(JSON.stringify({
    version: version,
    storagePath: storagePath,
    notes: `Nueva versión ${version} disponible`,
    fileSize: `${sizeInMB} MB`,
    fileSizeBytes: sizeInBytes,
    releaseDate: '[TIMESTAMP ACTUAL]',
    platform: 'android',
    type: 'firebase-storage',
    lastUpdated: new Date().toISOString()
  }, null, 2), 'cyan');
  log('\n═'.repeat(70), 'yellow');
  
  // Esperar confirmación
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question('\n✅ ¿Has actualizado Firestore? (s/n): ', (answer) => {
      readline.close();
      
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        logSuccess('Firestore actualizado!');
        resolve();
      } else {
        log('\n⚠️ Proceso cancelado.', 'yellow');
        throw new Error('Proceso cancelado por el usuario');
      }
    });
  });
}

// Commit y push cambios
function commitChanges(version) {
  logStep('📤', 'Guardando cambios en Git...');

  try {
    const status = execCommand('git status --porcelain', 'Verificación de cambios', { silent: true });
    
    if (status.trim()) {
      execCommand('git add package.json src/services/updateService.js', 'Git add');
      execCommand(`git commit -m "🔥 Firebase Auto-Deploy v${version}"`, 'Git commit');
      execCommand('git push origin main', 'Git push');
      logSuccess('Cambios guardados en Git');
    } else {
      logInfo('No hay cambios para guardar');
    }
  } catch (error) {
    logInfo('Error con Git (no crítico): ' + error.message);
  }
}

// Función principal
async function main() {
  const versionType = process.argv[2] || 'patch';
  
  try {
    log('\n🔥 DEPLOY AUTOMÁTICO COMPLETO A FIREBASE STORAGE', 'bright');
    log('═'.repeat(60), 'cyan');
    
    // 1. Verificar dependencias
    checkDependencies();
    
    // 2. Actualizar versión
    const newVersion = updateVersion(versionType);
    
    // 3. Construir aplicación
    buildApplication();
    
    // 4. Preparar APK
    const { apkPath, sizeInMB, sizeInBytes } = prepareAPK(newVersion);
    
    // 5. Subir a Firebase Storage
    const storagePath = uploadToFirebaseStorage(apkPath, newVersion);
    
    // 6. Actualizar Firestore
    updateFirestore(newVersion, storagePath, sizeInMB, sizeInBytes);
    
    // 7. Guardar cambios en Git
    commitChanges(newVersion);
    
    // 8. Mostrar resumen
    logStep('🎉', 'DEPLOY COMPLETADO EXITOSAMENTE!');
    log('═'.repeat(60), 'cyan');
    log('\n📋 Resumen del deploy:', 'bright');
    log(`   • Nueva versión: ${newVersion}`, 'green');
    log(`   • APK: ${apkPath} (${sizeInMB} MB)`, 'green');
    log(`   • Firebase Storage: ${storagePath}`, 'green');
    log(`   • Firestore: appConfig/version actualizado`, 'green');
    
    log('\n🔗 Enlaces importantes:', 'cyan');
    log(`   • Firebase Console: https://console.firebase.google.com/project/namu-inv`);
    log(`   • Storage: https://console.firebase.google.com/project/namu-inv/storage`);
    log(`   • Firestore: https://console.firebase.google.com/project/namu-inv/firestore`);
    
    log('\n📱 ¡Las apps detectarán la actualización automáticamente!', 'magenta');
    log('   🔄 Detección cada 5 minutos', 'green');
    log('   📲 Descarga e instalación automática en la app', 'green');
    log('   🚀 Sin salir de la aplicación', 'green');
    
  } catch (error) {
    logError(`\n❌ DEPLOY FALLIDO: ${error.message}`);
    log('\n🔧 Posibles soluciones:', 'yellow');
    log('   • Verificar autenticación: firebase login');
    log('   • Verificar proyecto: firebase use namu-inv');
    log('   • Verificar permisos en Firebase Console');
    log('   • Instalar firebase-admin: npm install firebase-admin');
    process.exit(1);
  }
}

main();