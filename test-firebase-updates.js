#!/usr/bin/env node

/**
 * Script para probar el sistema de actualizaciones con Firebase
 * No requiere firebase-admin, solo muestra instrucciones
 */

const fs = require('fs');

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

// Verificar archivos del sistema Firebase
function checkFirebaseFiles() {
  logStep('📁', 'Verificando archivos del sistema Firebase...');
  
  const requiredFiles = [
    {
      path: 'src/services/firebaseUpdateService.js',
      desc: 'Servicio de actualización con Firebase'
    },
    {
      path: 'src/firebase/firestore.js',
      desc: 'Funciones de Firebase actualizadas'
    }
  ];
  
  let allExist = true;
  
  requiredFiles.forEach(({ path, desc }) => {
    if (fs.existsSync(path)) {
      logSuccess(`${desc} ✓`);
    } else {
      logError(`${desc} ✗ (${path})`);
      allExist = false;
    }
  });
  
  return allExist;
}

// Verificar que los componentes usen Firebase
function checkComponentUpdates() {
  logStep('🔍', 'Verificando que los componentes usen Firebase...');
  
  const components = [
    'src/components/UpdateNotification.js',
    'src/components/UserMenu.js'
  ];
  
  let allUpdated = true;
  
  components.forEach(component => {
    if (fs.existsSync(component)) {
      const content = fs.readFileSync(component, 'utf8');
      
      if (content.includes('firebaseUpdateService')) {
        logSuccess(`${component} usa FirebaseUpdateService ✓`);
      } else if (content.includes('updateService')) {
        logWarning(`${component} todavía usa updateService (puede estar bien)`);
      } else {
        logError(`${component} no importa ningún updateService ✗`);
        allUpdated = false;
      }
    } else {
      logError(`${component} no encontrado ✗`);
      allUpdated = false;
    }
  });
  
  return allUpdated;
}

// Mostrar configuración actual
function showCurrentConfig() {
  logStep('⚙️', 'Configuración actual del proyecto...');
  
  try {
    // Leer package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    logInfo(`Versión actual: ${packageJson.version}`);
    
    // Leer .env.local
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const versionMatch = envContent.match(/REACT_APP_VERSION=(.+)/);
      if (versionMatch) {
        logInfo(`Versión en .env.local: ${versionMatch[1]}`);
      }
    }
    
    // Verificar Firebase config
    if (fs.existsSync('src/firebase/config.js')) {
      logSuccess('Configuración de Firebase encontrada');
    } else {
      logWarning('Configuración de Firebase no encontrada');
    }
    
  } catch (error) {
    logError(`Error leyendo configuración: ${error.message}`);
  }
}

// Instrucciones simplificadas para Firebase
function showSimpleFirebaseSetup() {
  logStep('🔥', 'Configuración simplificada de Firebase');
  
  log('\n📋 Pasos rápidos:', 'cyan');
  log('   1. Abre Firebase Console: https://console.firebase.google.com/', 'cyan');
  log('   2. Ve a tu proyecto → Firestore Database', 'cyan');
  log('   3. Crea colección "app" → documento "version"', 'cyan');
  log('   4. Agrega estos campos al documento:', 'cyan');
  
  log('\n📝 Campos mínimos requeridos:', 'blue');
  log('   version: "1.0.84"', 'blue');
  log('   buildDate: "2025-07-28T10:00:00.000Z"', 'blue');
  log('   platform: "android"', 'blue');
  log('   releaseNotes: "Nueva versión con Firebase"', 'blue');
  log('   downloads: { android: "https://github.com/LautaroBravo08/namustock-app/releases/download/v1.0.84/namustock-1.0.84.apk" }', 'blue');
  
  log('\n🔒 Reglas de Firestore:', 'yellow');
  log('   • Ve a Firestore → Rules', 'yellow');
  log('   • Permite lectura pública de app/version', 'yellow');
  log('   • Ejemplo: allow read: if resource.id == "version";', 'yellow');
}

// Mostrar cómo probar
function showTestInstructions() {
  logStep('🧪', 'Cómo probar el sistema');
  
  log('\n1️⃣ Probar en Web (debería estar deshabilitado):', 'cyan');
  log('   npm start', 'cyan');
  log('   Abrir DevTools → Console', 'cyan');
  log('   Buscar: "Plataforma web detectada - Actualizaciones deshabilitadas"', 'cyan');
  
  log('\n2️⃣ Probar en Android (debería funcionar):', 'cyan');
  log('   npm run build', 'cyan');
  log('   npx cap sync android', 'cyan');
  log('   npx cap run android', 'cyan');
  log('   Buscar: "FirebaseUpdateService inicializado"', 'cyan');
  
  log('\n🔍 Logs esperados:', 'blue');
  log('   🔥 FirebaseUpdateService inicializado', 'blue');
  log('   🔄 Configurando listener en tiempo real', 'blue');
  log('   🚀 Verificando actualizaciones al iniciar (Android + Firebase)', 'blue');
  log('   🔥 Consultando Firebase para información de versión', 'blue');
  log('   ✅ Información obtenida desde Firebase', 'blue');
}

// Comparar sistemas
function showSystemComparison() {
  logStep('⚡', 'Comparación: GitHub API vs Firebase');
  
  log('\n📊 Rendimiento:', 'bright');
  log('   GitHub API: 2-5 segundos + rate limits', 'red');
  log('   Firebase:   < 100ms + sin límites', 'green');
  
  log('\n🔄 Actualizaciones:', 'bright');
  log('   GitHub API: Manual (botón)', 'yellow');
  log('   Firebase:   Tiempo real automático', 'green');
  
  log('\n🛠️ Mantenimiento:', 'bright');
  log('   GitHub API: Complejo (cache, retry, fallback)', 'red');
  log('   Firebase:   Simple (solo cambiar documento)', 'green');
}

// Función principal
async function main() {
  log('\n🔥 Probando sistema de actualizaciones con Firebase...', 'bright');
  
  try {
    // Verificar archivos
    const filesOk = checkFirebaseFiles();
    const componentsOk = checkComponentUpdates();
    
    // Mostrar configuración
    showCurrentConfig();
    
    // Instrucciones simplificadas
    showSimpleFirebaseSetup();
    
    // Instrucciones de prueba
    showTestInstructions();
    
    // Comparación
    showSystemComparison();
    
    // Resumen final
    logStep('📋', 'Estado del sistema');
    
    if (filesOk && componentsOk) {
      logSuccess('✅ Sistema Firebase listo para usar');
      
      log('\n🎯 Próximos pasos:', 'green');
      log('   1. Configurar Firebase según instrucciones arriba', 'green');
      log('   2. Probar en navegador (debería estar deshabilitado)', 'green');
      log('   3. Probar en Android (debería funcionar)', 'green');
      log('   4. ¡Disfrutar de actualizaciones instantáneas!', 'green');
      
    } else {
      logWarning('⚠️ Algunos archivos pueden estar faltando');
      logInfo('Revisa los errores arriba');
    }
    
    log('\n💡 Nota:', 'blue');
    log('   El script update-firebase-version.js requiere firebase-admin', 'blue');
    log('   Para simplificar, usa Firebase Console directamente', 'blue');
    log('   Es más fácil y no requiere dependencias adicionales', 'blue');
    
    return filesOk && componentsOk;
    
  } catch (error) {
    logError(`Error durante la prueba: ${error.message}`);
    return false;
  }
}

// Ejecutar prueba
main().then(success => {
  process.exit(success ? 0 : 1);
});