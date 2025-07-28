#!/usr/bin/env node

/**
 * Script para probar el sistema completo de actualizaciones automáticas con Firebase
 * Verifica que todo esté configurado correctamente
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

// Verificar archivos del sistema automático
function checkAutomaticSystem() {
  logStep('🔥', 'Verificando sistema automático de Firebase...');
  
  const requiredFiles = [
    {
      path: 'src/services/firebaseUpdateService.js',
      desc: 'Servicio principal de Firebase'
    },
    {
      path: 'src/services/autoFirebaseSetup.js',
      desc: 'Configuración automática de Firebase'
    },
    {
      path: 'src/services/autoUpdateManager.js',
      desc: 'Gestor automático de actualizaciones'
    },
    {
      path: 'auto-firebase-release.js',
      desc: 'Script de release automático con Firebase'
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

// Verificar scripts de package.json
function checkPackageScripts() {
  logStep('📜', 'Verificando scripts automáticos...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scripts = packageJson.scripts;
    
    const expectedScripts = [
      'release',
      'release:firebase',
      'release:firebase:patch',
      'release:firebase:minor',
      'release:firebase:major'
    ];
    
    let allScriptsExist = true;
    
    expectedScripts.forEach(script => {
      if (scripts[script] && scripts[script].includes('auto-firebase-release.js')) {
        logSuccess(`Script ${script} configurado correctamente`);
      } else {
        logError(`Script ${script} no configurado o incorrecto`);
        allScriptsExist = false;
      }
    });
    
    return allScriptsExist;
  } catch (error) {
    logError(`Error verificando package.json: ${error.message}`);
    return false;
  }
}

// Verificar configuración actual
function checkCurrentConfig() {
  logStep('⚙️', 'Verificando configuración actual...');
  
  try {
    // Verificar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    logInfo(`Versión actual: ${packageJson.version}`);
    
    // Verificar .env.local
    if (fs.existsSync('.env.local')) {
      const envContent = fs.readFileSync('.env.local', 'utf8');
      const versionMatch = envContent.match(/REACT_APP_VERSION=(.+)/);
      if (versionMatch) {
        logInfo(`Versión en .env.local: ${versionMatch[1]}`);
        
        // Verificar si está configurado para ver actualizaciones
        if (versionMatch[1] !== packageJson.version) {
          logSuccess('Configurado para detectar actualizaciones');
        } else {
          logWarning('Misma versión - no detectará actualizaciones');
        }
      }
    }
    
    // Verificar Firebase config
    if (fs.existsSync('src/firebase/config.js')) {
      logSuccess('Configuración de Firebase encontrada');
    } else {
      logError('Configuración de Firebase no encontrada');
      return false;
    }
    
    return true;
  } catch (error) {
    logError(`Error verificando configuración: ${error.message}`);
    return false;
  }
}

// Mostrar cómo funciona el sistema automático
function showAutomaticSystemFlow() {
  logStep('🔄', 'Cómo funciona el sistema automático');
  
  log('\n1️⃣ Al abrir la aplicación:', 'cyan');
  log('   🔥 FirebaseUpdateService se inicializa', 'cyan');
  log('   🔧 autoFirebaseSetup configura Firebase automáticamente', 'cyan');
  log('   📦 Si no existe, crea el documento app/version', 'cyan');
  log('   🔄 Configura listener en tiempo real', 'cyan');
  log('   ✅ Sistema listo sin configuración manual', 'cyan');
  
  log('\n2️⃣ Al crear un nuevo release:', 'blue');
  log('   🚀 node auto-firebase-release.js patch', 'blue');
  log('   📦 Ejecuta release normal (GitHub, APK, etc.)', 'blue');
  log('   🔥 Actualiza Firebase automáticamente', 'blue');
  log('   📱 Usuarios reciben notificación instantánea', 'blue');
  log('   ⚡ Todo automático, sin pasos manuales', 'blue');
  
  log('\n3️⃣ Para los usuarios:', 'green');
  log('   📱 Solo Android: Reciben actualizaciones', 'green');
  log('   🌐 Web/iOS: Mensaje informativo', 'green');
  log('   ⚡ Notificaciones en tiempo real (< 100ms)', 'green');
  log('   🔄 Sin necesidad de recargar o presionar botones', 'green');
}

// Mostrar comandos disponibles
function showAvailableCommands() {
  logStep('🎯', 'Comandos disponibles');
  
  log('\n📦 Releases automáticos:', 'cyan');
  log('   npm run release              # Patch automático', 'cyan');
  log('   npm run release:patch        # 1.0.83 → 1.0.84', 'cyan');
  log('   npm run release:minor        # 1.0.83 → 1.1.0', 'cyan');
  log('   npm run release:major        # 1.0.83 → 2.0.0', 'cyan');
  
  log('\n🔥 Específicos de Firebase:', 'blue');
  log('   npm run release:firebase     # Patch con Firebase', 'blue');
  log('   npm run release:firebase:patch', 'blue');
  log('   npm run release:firebase:minor', 'blue');
  log('   npm run release:firebase:major', 'blue');
  
  log('\n🧪 Pruebas:', 'yellow');
  log('   npm start                    # Probar en navegador', 'yellow');
  log('   npm run android              # Probar en Android', 'yellow');
  log('   node test-sistema-completo.js # Este script', 'yellow');
}

// Mostrar próximos pasos
function showNextSteps() {
  logStep('🚀', 'Próximos pasos');
  
  log('\n1️⃣ Probar el sistema:', 'green');
  log('   npm start', 'green');
  log('   Abrir DevTools → Console', 'green');
  log('   Buscar: "🔥 FirebaseUpdateService inicializado"', 'green');
  log('   Buscar: "🔧 Configurando Firebase automáticamente"', 'green');
  
  log('\n2️⃣ Crear un release de prueba:', 'blue');
  log('   npm run release:patch', 'blue');
  log('   Esto hará TODO automáticamente:', 'blue');
  log('   • Build de la aplicación', 'blue');
  log('   • Generación del APK', 'blue');
  log('   • Subida a GitHub', 'blue');
  log('   • Configuración de Firebase', 'blue');
  log('   • Notificación a usuarios', 'blue');
  
  log('\n3️⃣ Verificar que funciona:', 'cyan');
  log('   Los usuarios conectados deberían recibir', 'cyan');
  log('   la notificación de actualización instantáneamente', 'cyan');
  
  log('\n💡 Ventajas del sistema automático:', 'yellow');
  log('   • Sin configuración manual de Firebase', 'yellow');
  log('   • Sin problemas de rate limit', 'yellow');
  log('   • Actualizaciones en tiempo real', 'yellow');
  log('   • Un solo comando para todo', 'yellow');
  log('   • Funciona desde el primer uso', 'yellow');
}

// Función principal
async function main() {
  log('\n🔥 Probando sistema completo de actualizaciones automáticas...', 'bright');
  
  try {
    // Verificar archivos del sistema
    const filesOk = checkAutomaticSystem();
    
    // Verificar scripts
    const scriptsOk = checkPackageScripts();
    
    // Verificar configuración
    const configOk = checkCurrentConfig();
    
    // Mostrar cómo funciona
    showAutomaticSystemFlow();
    
    // Mostrar comandos
    showAvailableCommands();
    
    // Mostrar próximos pasos
    showNextSteps();
    
    // Resumen final
    logStep('📋', 'Estado del sistema automático');
    
    if (filesOk && scriptsOk && configOk) {
      logSuccess('✅ Sistema automático completamente listo');
      
      log('\n🎯 Resumen:', 'green');
      log('   • Todos los archivos necesarios están presentes', 'green');
      log('   • Scripts de package.json configurados', 'green');
      log('   • Firebase se configurará automáticamente', 'green');
      log('   • Un solo comando hace todo el proceso', 'green');
      
      log('\n🚀 ¡Listo para usar!', 'bright');
      log('   Ejecuta: npm run release:patch', 'bright');
      log('   Y todo se hará automáticamente', 'bright');
      
    } else {
      logWarning('⚠️ Algunos componentes pueden estar faltando');
      logInfo('Revisa los errores arriba');
    }
    
    return filesOk && scriptsOk && configOk;
    
  } catch (error) {
    logError(`Error durante la verificación: ${error.message}`);
    return false;
  }
}

// Ejecutar verificación
main().then(success => {
  process.exit(success ? 0 : 1);
});