const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Función para simular una nueva versión
function simulateNewVersion() {
  const versionPath = path.join(__dirname, 'public', 'version.json');
  
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    
    // Incrementar versión patch
    const versionParts = versionData.version.split('.').map(Number);
    versionParts[2]++;
    const newVersion = versionParts.join('.');
    
    // Crear nueva versión simulada
    const newVersionData = {
      ...versionData,
      version: newVersion,
      buildDate: new Date().toISOString(),
      releaseNotes: `Versión de prueba ${newVersion} - Simulación de actualización automática`,
      features: [
        ...versionData.features,
        "Prueba de sistema de actualizaciones"
      ]
    };
    
    // Guardar nueva versión
    fs.writeFileSync(versionPath, JSON.stringify(newVersionData, null, 2));
    
    logSuccess(`Nueva versión simulada: ${newVersion}`);
    return newVersionData;
    
  } catch (error) {
    logError(`Error simulando nueva versión: ${error.message}`);
    return null;
  }
}

// Función para revertir a versión anterior
function revertVersion() {
  const versionPath = path.join(__dirname, 'public', 'version.json');
  
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    
    // Decrementar versión patch
    const versionParts = versionData.version.split('.').map(Number);
    if (versionParts[2] > 0) {
      versionParts[2]--;
    }
    const oldVersion = versionParts.join('.');
    
    // Revertir versión
    const revertedVersionData = {
      ...versionData,
      version: oldVersion,
      buildDate: new Date().toISOString(),
      releaseNotes: `Versión revertida ${oldVersion}`,
      features: versionData.features.filter(f => f !== "Prueba de sistema de actualizaciones")
    };
    
    // Guardar versión revertida
    fs.writeFileSync(versionPath, JSON.stringify(revertedVersionData, null, 2));
    
    logSuccess(`Versión revertida a: ${oldVersion}`);
    return revertedVersionData;
    
  } catch (error) {
    logError(`Error revirtiendo versión: ${error.message}`);
    return null;
  }
}

// Función para verificar archivos necesarios
function checkRequiredFiles() {
  const requiredFiles = [
    'public/version.json',
    'public/sw.js',
    'src/services/updateService.js',
    'src/components/UpdateNotification.js',
    'update-version.js',
    'deploy.js'
  ];
  
  log('\n🔍 Verificando archivos necesarios...', 'bright');
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`${file} ✓`);
    } else {
      logError(`${file} ✗ (faltante)`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Función para verificar configuración del service worker
function checkServiceWorkerConfig() {
  const swPath = path.join(__dirname, 'public', 'sw.js');
  
  try {
    const swContent = fs.readFileSync(swPath, 'utf8');
    
    log('\n🔧 Verificando configuración del Service Worker...', 'bright');
    
    // Verificar que tenga el nombre de cache correcto
    const cacheNameMatch = swContent.match(/const CACHE_NAME = '([^']+)'/);
    if (cacheNameMatch) {
      logSuccess(`Cache name: ${cacheNameMatch[1]}`);
    } else {
      logError('Cache name no encontrado');
    }
    
    // Verificar que tenga la URL de versión
    const versionUrlMatch = swContent.match(/const VERSION_URL = '([^']+)'/);
    if (versionUrlMatch) {
      logSuccess(`Version URL: ${versionUrlMatch[1]}`);
    } else {
      logError('Version URL no encontrada');
    }
    
    // Verificar que tenga el intervalo de verificación
    const intervalMatch = swContent.match(/setInterval\([^,]+,\s*(\d+)\)/);
    if (intervalMatch) {
      const intervalMs = parseInt(intervalMatch[1]);
      const intervalSec = intervalMs / 1000;
      logSuccess(`Intervalo de verificación: ${intervalSec} segundos`);
    } else {
      logError('Intervalo de verificación no encontrado');
    }
    
    return true;
  } catch (error) {
    logError(`Error verificando service worker: ${error.message}`);
    return false;
  }
}

// Función para mostrar información de la versión actual
function showCurrentVersion() {
  const versionPath = path.join(__dirname, 'public', 'version.json');
  
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    
    log('\n📋 Información de la versión actual:', 'bright');
    log(`   Versión: ${versionData.version}`);
    log(`   Fecha de build: ${versionData.buildDate}`);
    log(`   Plataforma: ${versionData.platform}`);
    log(`   Notas: ${versionData.releaseNotes || 'No disponibles'}`);
    log(`   Características:`);
    versionData.features.forEach(feature => {
      log(`     • ${feature}`);
    });
    
    return versionData;
  } catch (error) {
    logError(`Error leyendo versión actual: ${error.message}`);
    return null;
  }
}

// Función principal de prueba
async function testUpdateSystem() {
  log('\n🧪 Iniciando prueba del sistema de actualizaciones...', 'bright');
  
  // 1. Verificar archivos necesarios
  if (!checkRequiredFiles()) {
    logError('Faltan archivos necesarios. Abortando prueba.');
    return;
  }
  
  // 2. Verificar configuración del service worker
  if (!checkServiceWorkerConfig()) {
    logError('Configuración del service worker incorrecta. Abortando prueba.');
    return;
  }
  
  // 3. Mostrar versión actual
  const currentVersion = showCurrentVersion();
  if (!currentVersion) {
    logError('No se pudo leer la versión actual. Abortando prueba.');
    return;
  }
  
  // 4. Simular nueva versión
  log('\n🔄 Simulando nueva versión...', 'bright');
  const newVersion = simulateNewVersion();
  if (!newVersion) {
    logError('No se pudo simular nueva versión. Abortando prueba.');
    return;
  }
  
  // 5. Mostrar instrucciones para prueba manual
  log('\n📝 Instrucciones para prueba manual:', 'bright');
  log('   1. Abre la aplicación en tu navegador');
  log('   2. Abre las DevTools (F12)');
  log('   3. Ve a la pestaña "Application" → "Service Workers"');
  log('   4. Verifica que el service worker esté activo');
  log('   5. En unos 30 segundos deberías ver una notificación de actualización');
  log('   6. Haz clic en "Actualizar" para probar el proceso');
  
  // 6. Esperar input del usuario
  log('\n⏳ Presiona Enter cuando hayas terminado la prueba manual...', 'yellow');
  
  return new Promise((resolve) => {
    process.stdin.once('data', () => {
      // 7. Revertir versión
      log('\n🔙 Revirtiendo a versión anterior...', 'bright');
      const revertedVersion = revertVersion();
      
      if (revertedVersion) {
        logSuccess('Prueba completada exitosamente');
        log('\n📊 Resumen de la prueba:', 'bright');
        log(`   Versión original: ${currentVersion.version}`);
        log(`   Versión simulada: ${newVersion.version}`);
        log(`   Versión final: ${revertedVersion.version}`);
      } else {
        logError('Error revirtiendo versión');
      }
      
      resolve();
    });
  });
}

// Función para mostrar ayuda
function showHelp() {
  log('\n📖 Comandos disponibles:', 'bright');
  log('   node test-updates.js test     - Ejecutar prueba completa');
  log('   node test-updates.js check    - Verificar archivos y configuración');
  log('   node test-updates.js version  - Mostrar versión actual');
  log('   node test-updates.js simulate - Simular nueva versión');
  log('   node test-updates.js revert   - Revertir a versión anterior');
  log('   node test-updates.js help     - Mostrar esta ayuda');
}

// Procesar argumentos de línea de comandos
const command = process.argv[2] || 'help';

switch (command) {
  case 'test':
    testUpdateSystem().then(() => process.exit(0));
    break;
  case 'check':
    checkRequiredFiles();
    checkServiceWorkerConfig();
    break;
  case 'version':
    showCurrentVersion();
    break;
  case 'simulate':
    simulateNewVersion();
    break;
  case 'revert':
    revertVersion();
    break;
  case 'help':
  default:
    showHelp();
    break;
}