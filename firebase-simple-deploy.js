#!/usr/bin/env node

/**
 * Script simplificado para deploy a Firebase Storage
 * Uso: node firebase-simple-deploy.js [tipo]
 * 
 * Tipos: patch, minor, major
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
    log(`ℹ️  Ejecutando: ${description}`, 'blue');
    const result = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
    log(`✅ ${description} completado`, 'green');
    return result;
  } catch (error) {
    log(`❌ Error en ${description}: ${error.message}`, 'red');
    throw error;
  }
}

// Leer versión actual
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
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

// Actualizar versión en archivos
function updateVersionInFiles(newVersion) {
  try {
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
    
    log('✅ Archivos de versión actualizados', 'green');
  } catch (error) {
    log(`❌ Error actualizando archivos: ${error.message}`, 'red');
    throw error;
  }
}

async function main() {
  const versionType = process.argv[2] || 'patch';
  
  try {
    log('\n🔥 Iniciando deploy simplificado a Firebase...', 'bright');
    
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);
    
    log(`📝 Versión: ${currentVersion} → ${newVersion}`, 'blue');
    
    // 1. Actualizar versión
    updateVersionInFiles(newVersion);
    
    // 2. Construir aplicación
    log('\n🔨 Construyendo aplicación...', 'bright');
    execCommand('npm run build', 'Construcción de React');
    execCommand('npx cap sync', 'Sincronización de Capacitor');
    
    // 3. Construir APK (en el directorio android)
    log('\n📱 Construyendo APK...', 'bright');
    execCommand('gradlew.bat clean assembleRelease', 'Construcción de APK', { cwd: 'android' });
    
    // 4. Copiar APK a releases
    const releasesDir = 'releases';
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir);
    }
    
    const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
    const targetApk = `releases/namustock-${newVersion}.apk`;
    
    if (fs.existsSync(sourceApk)) {
      fs.copyFileSync(sourceApk, targetApk);
      const stats = fs.statSync(targetApk);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      log(`✅ APK copiado: ${targetApk} (${sizeInMB} MB)`, 'green');
    } else {
      throw new Error('APK no encontrado');
    }
    
    // 5. Mostrar siguiente paso manual
    log('\n📋 Deploy completado - Siguiente paso MANUAL:', 'bright');
    log('═'.repeat(60), 'yellow');
    log('\n🔥 PASO MANUAL NECESARIO:', 'yellow');
    log(`1. Ve a Firebase Console: https://console.firebase.google.com/project/namu-inv/storage`, 'blue');
    log(`2. Sube manualmente el archivo: ${targetApk}`, 'blue');
    log(`3. Sube a la carpeta: releases/`, 'blue');
    log(`4. Asegúrate de que sea público (readable por todos)`, 'blue');
    log(`\\n5. Ve a Firestore: https://console.firebase.google.com/project/namu-inv/firestore`, 'blue');
    log(`6. Actualiza la colección 'appConfig' documento 'version' con:`, 'blue');
    log(`   {`, 'cyan');
    log(`     version: "${newVersion}",`, 'cyan');
    log(`     storagePath: "releases/namustock-${newVersion}.apk",`, 'cyan');
    log(`     notes: "Nueva versión ${newVersion} disponible",`, 'cyan');
    log(`     fileSize: "${sizeInMB} MB",`, 'cyan');
    log(`     releaseDate: [timestamp actual],`, 'cyan');
    log(`     platform: "android",`, 'cyan');
    log(`     type: "firebase-storage"`, 'cyan');
    log(`   }`, 'cyan');
    
    log('\\n🚀 Una vez completado manualmente, las apps detectarán la actualización automáticamente!', 'green');
    
  } catch (error) {
    log(`\\n❌ Deploy fallido: ${error.message}`, 'red');
    process.exit(1);
  }
}

main();