#!/usr/bin/env node

/**
 * Script para probar actualizaciones en Android
 * Uso: node test-android-updates.js [comando]
 * 
 * Comandos:
 * - test: Ejecutar prueba completa
 * - simulate: Habilitar simulación de actualizaciones
 * - disable: Deshabilitar simulación
 * - version: Mostrar versión actual
 */

const fs = require('fs');
const path = require('path');

const ENV_LOCAL_PATH = '.env.local';
const VERSION_JSON_PATH = 'public/version.json';

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m',   // Red
    bright: '\x1b[1m'    // Bright
  };
  
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function updateEnvFile(simulate = true) {
  const envContent = `# Configuración local para testing de actualizaciones
REACT_APP_VERSION=1.0.0
REACT_APP_SIMULATE_UPDATE=${simulate}
REACT_APP_UPDATE_CHECK_INTERVAL=30000
REACT_APP_GITHUB_REPO=tu-usuario/tu-repo`;

  fs.writeFileSync(ENV_LOCAL_PATH, envContent);
  log(`✅ Archivo ${ENV_LOCAL_PATH} ${simulate ? 'habilitado' : 'deshabilitado'} para simulación`, 'success');
}

function updateVersionJson(newVersion = '1.1.0') {
  const versionData = {
    version: newVersion,
    buildDate: new Date().toISOString(),
    platform: 'android',
    features: [
      'Mejoras en el sistema de actualizaciones',
      'Corrección de errores menores',
      'Optimizaciones de rendimiento para Android'
    ],
    releaseNotes: `Nueva versión ${newVersion} con mejoras importantes para Android`,
    downloads: {
      android: `/downloads/app-release-${newVersion}.apk`,
      ios: `/downloads/app-release-${newVersion}.ipa`
    },
    baseUrl: 'https://tu-dominio.com'
  };

  fs.writeFileSync(VERSION_JSON_PATH, JSON.stringify(versionData, null, 2));
  log(`✅ Archivo ${VERSION_JSON_PATH} actualizado a versión ${newVersion}`, 'success');
}

function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version || '1.0.0';
  } catch (error) {
    return '1.0.0';
  }
}

function testAndroidUpdates() {
  log('\n🧪 Iniciando prueba de actualizaciones para Android...', 'bright');
  
  // 1. Habilitar simulación
  log('\n1️⃣ Habilitando simulación de actualizaciones...', 'info');
  updateEnvFile(true);
  
  // 2. Crear versión simulada
  log('\n2️⃣ Creando versión simulada...', 'info');
  updateVersionJson('1.1.0');
  
  // 3. Instrucciones
  log('\n📱 Instrucciones para probar en Android:', 'bright');
  log('   1. Ejecuta: npm run build', 'info');
  log('   2. Ejecuta: npx cap sync android', 'info');
  log('   3. Ejecuta: npx cap run android', 'info');
  log('   4. En la app, ve al menú de usuario y haz clic en "Comprobar actualizaciones"', 'info');
  log('   5. Deberías ver: "¡Nueva versión 1.1.0 disponible!"', 'success');
  
  log('\n🔧 Para deshabilitar la simulación después de probar:', 'warning');
  log('   node test-android-updates.js disable', 'warning');
}

function disableSimulation() {
  log('\n🔄 Deshabilitando simulación de actualizaciones...', 'info');
  updateEnvFile(false);
  
  // Restaurar versión original
  const currentVersion = getCurrentVersion();
  updateVersionJson(currentVersion);
  
  log('✅ Simulación deshabilitada', 'success');
}

function showVersion() {
  const currentVersion = getCurrentVersion();
  log(`\n📦 Versión actual: ${currentVersion}`, 'bright');
  
  try {
    const versionJson = JSON.parse(fs.readFileSync(VERSION_JSON_PATH, 'utf8'));
    log(`🌐 Versión del servidor: ${versionJson.version}`, 'info');
  } catch (error) {
    log('❌ No se pudo leer version.json', 'error');
  }
  
  try {
    const envLocal = fs.readFileSync(ENV_LOCAL_PATH, 'utf8');
    const simulateMatch = envLocal.match(/REACT_APP_SIMULATE_UPDATE=(.+)/);
    const simulate = simulateMatch ? simulateMatch[1] === 'true' : false;
    log(`🧪 Simulación: ${simulate ? 'HABILITADA' : 'DESHABILITADA'}`, simulate ? 'success' : 'warning');
  } catch (error) {
    log('⚠️  Archivo .env.local no encontrado', 'warning');
  }
}

// Procesar argumentos de línea de comandos
const command = process.argv[2] || 'help';

switch (command) {
  case 'test':
    testAndroidUpdates();
    break;
  case 'simulate':
    updateEnvFile(true);
    updateVersionJson('1.1.0');
    log('✅ Simulación habilitada', 'success');
    break;
  case 'disable':
    disableSimulation();
    break;
  case 'version':
    showVersion();
    break;
  case 'help':
  default:
    log('\n📖 Comandos disponibles:', 'bright');
    log('   node test-android-updates.js test     - Ejecutar prueba completa', 'info');
    log('   node test-android-updates.js simulate - Habilitar simulación', 'info');
    log('   node test-android-updates.js disable  - Deshabilitar simulación', 'info');
    log('   node test-android-updates.js version  - Mostrar versión actual', 'info');
    break;
}