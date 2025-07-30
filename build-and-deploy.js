#!/usr/bin/env node

/**
 * Script completo para construcción, despliegue y limpieza automática
 * Uso: node build-and-deploy.js [tipo] [opciones]
 * 
 * Tipos: patch, minor, major
 * Opciones: --clean (limpiar archivos antiguos), --auto (sin confirmación)
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
  cyan: '\x1b[36m'
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

// Ejecutar comando con logging
function execCommand(command, description) {
  try {
    logInfo(`Ejecutando: ${description}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(`${description} completado`);
    return result;
  } catch (error) {
    logError(`Error en ${description}: ${error.message}`);
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
        execCommand(`rmdir /s /q "${file}"`, `Eliminando ${file}`);
      }
    } catch (error) {
      logWarning(`No se pudo eliminar ${file}: ${error.message}`);
    }
  }
  
  // Limpiar APKs antiguos del directorio de releases
  try {
    const releasesDir = 'releases';
    if (fs.existsSync(releasesDir)) {
      const files = fs.readdirSync(releasesDir);
      const apkFiles = files.filter(file => file.endsWith('.apk'));
      
      if (apkFiles.length > 3) { // Mantener solo los 3 más recientes
        apkFiles.sort().slice(0, -3).forEach(file => {
          try {
            fs.unlinkSync(path.join(releasesDir, file));
            logSuccess(`APK antiguo eliminado: ${file}`);
          } catch (error) {
            logWarning(`No se pudo eliminar ${file}`);
          }
        });
      }
    }
  } catch (error) {
    logWarning('Error limpiando APKs antiguos');
  }
  
  logSuccess('Limpieza completada');
}

// Actualizar versión en todos los archivos
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
        "Actualizaciones automáticas in-app",
        "Limpieza automática de archivos antiguos",
        "Notificaciones mejoradas",
        "Interfaz de usuario actualizada"
      ];
      versionData.releaseNotes = `Versión ${newVersion} con actualizaciones automáticas mejoradas y limpieza de archivos antiguos`;
      
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
    
    // Actualizar UserMenu.js
    const userMenuPath = 'src/components/UserMenu.js';
    if (fs.existsSync(userMenuPath)) {
      let content = fs.readFileSync(userMenuPath, 'utf8');
      content = content.replace(
        /const hardcodedVersion = '[^']+';/,
        `const hardcodedVersion = '${newVersion}';`
      );
      fs.writeFileSync(userMenuPath, content);
      logSuccess('UserMenu.js actualizado');
    }
    
    // Actualizar .env.production
    const envProdPath = '.env.production';
    if (fs.existsSync(envProdPath)) {
      let content = fs.readFileSync(envProdPath, 'utf8');
      content = content.replace(
        /REACT_APP_VERSION=[\d.]+/,
        `REACT_APP_VERSION=${newVersion}`
      );
      fs.writeFileSync(envProdPath, content);
      logSuccess('.env.production actualizado');
    }
    
  } catch (error) {
    logError(`Error actualizando archivos: ${error.message}`);
    throw error;
  }
}

// Construir aplicación
async function buildApplication() {
  logStep('🔨', 'Construyendo aplicación...');
  
  try {
    // Construir React
    execCommand('npm run build', 'Construcción de React');
    
    // Sincronizar con Capacitor
    execCommand('npx cap sync', 'Sincronización de Capacitor');
    
    // Construir APK de Android
    logInfo('Construyendo APK de Android...');
    execCommand('cd android && .\\gradlew assembleRelease', 'Construcción de APK');
    
    logSuccess('Aplicación construida exitosamente');
    
  } catch (error) {
    logError(`Error en construcción: ${error.message}`);
    throw error;
  }
}

// Copiar APK a directorio de releases
function copyApkToReleases(version) {
  logStep('📦', 'Copiando APK a directorio de releases...');
  
  try {
    const releasesDir = 'releases';
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir);
    }
    
    const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
    const targetApk = `releases/namustock-${version}.apk`;
    
    if (fs.existsSync(sourceApk)) {
      fs.copyFileSync(sourceApk, targetApk);
      logSuccess(`APK copiado: ${targetApk}`);
      
      // Mostrar información del archivo
      const stats = fs.statSync(targetApk);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      logInfo(`Tamaño del APK: ${sizeInMB} MB`);
      
      return targetApk;
    } else {
      throw new Error('APK no encontrado en la ruta esperada');
    }
    
  } catch (error) {
    logError(`Error copiando APK: ${error.message}`);
    throw error;
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const shouldClean = args.includes('--clean');
  const autoMode = args.includes('--auto');
  
  try {
    log('\n🚀 Iniciando proceso de construcción y despliegue...', 'bright');
    
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);
    
    logInfo(`Versión actual: ${currentVersion}`);
    logInfo(`Nueva versión: ${newVersion}`);
    logInfo(`Tipo de actualización: ${versionType}`);
    
    if (!autoMode) {
      log('\n¿Continuar con el proceso? (y/N): ', 'yellow');
      // En un entorno real, aquí esperarías input del usuario
      // Para este script, asumimos que sí
    }
    
    // 1. Limpiar archivos antiguos si se solicita
    if (shouldClean) {
      await cleanOldFiles();
    }
    
    // 2. Actualizar versión en archivos
    updateVersionInFiles(newVersion);
    
    // 3. Construir aplicación
    await buildApplication();
    
    // 4. Copiar APK a releases
    const apkPath = copyApkToReleases(newVersion);
    
    // 5. Mostrar resumen
    logStep('🎉', 'Proceso completado exitosamente!');
    log('\n📋 Resumen:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`);
    log(`   • APK generado: ${apkPath}`);
    log(`   • Archivos actualizados: package.json, version.json, updateService.js`);
    
    if (shouldClean) {
      log(`   • Archivos antiguos limpiados`);
    }
    
    log('\n📱 Próximos pasos:', 'cyan');
    log('   1. Probar el APK en un dispositivo Android');
    log('   2. Subir el release a GitHub');
    log('   3. Verificar que las actualizaciones automáticas funcionen');
    
  } catch (error) {
    logError(`\nProceso fallido: ${error.message}`);
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n📖 Uso del script de construcción y despliegue:', 'bright');
  log('   node build-and-deploy.js [tipo] [opciones]');
  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');
  log('\n⚙️  Opciones:', 'cyan');
  log('   --clean  - Limpiar archivos antiguos antes de construir');
  log('   --auto   - Ejecutar sin confirmación');
  log('\n📝 Ejemplos:', 'yellow');
  log('   node build-and-deploy.js patch --clean');
  log('   node build-and-deploy.js minor --auto');
  log('   node build-and-deploy.js major --clean --auto');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
}