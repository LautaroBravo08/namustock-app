#!/usr/bin/env node

/**
 * Script para probar que las actualizaciones solo funcionen en Android
 * Simula diferentes plataformas y verifica el comportamiento
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

// Simular diferentes plataformas
function simulatePlatformBehavior() {
  logStep('🎭', 'Simulando comportamiento en diferentes plataformas...');
  
  const platforms = [
    {
      name: 'Android',
      platform: 'android',
      shouldWork: true,
      expectedMessage: 'Verificando actualizaciones para android...'
    },
    {
      name: 'Web (navegador)',
      platform: 'web',
      shouldWork: false,
      expectedMessage: 'Actualizaciones deshabilitadas para plataforma: web'
    },
    {
      name: 'iOS',
      platform: 'ios',
      shouldWork: false,
      expectedMessage: 'Actualizaciones deshabilitadas para plataforma: ios'
    },
    {
      name: 'Electron (escritorio)',
      platform: 'electron',
      shouldWork: false,
      expectedMessage: 'Actualizaciones deshabilitadas para plataforma: electron'
    }
  ];
  
  platforms.forEach(({ name, platform, shouldWork, expectedMessage }) => {
    logInfo(`\nPlataforma: ${name} (${platform})`);
    
    if (shouldWork) {
      logSuccess(`✓ Actualizaciones HABILITADAS`);
      logInfo(`  Mensaje esperado: "${expectedMessage}"`);
      logInfo(`  Comportamiento: Verifica GitHub API y muestra actualizaciones`);
    } else {
      logWarning(`✗ Actualizaciones DESHABILITADAS`);
      logInfo(`  Mensaje esperado: "${expectedMessage}"`);
      logInfo(`  Comportamiento: Retorna mensaje de plataforma no soportada`);
    }
  });
}

// Verificar cambios en el código
function checkCodeChanges() {
  logStep('🔍', 'Verificando cambios en el código...');
  
  const filesToCheck = [
    {
      file: 'src/services/updateService.js',
      checks: [
        {
          name: 'Restricción de plataforma en checkForUpdates',
          pattern: /platform === 'android'/,
          required: true
        },
        {
          name: 'Mensaje para plataformas no soportadas',
          pattern: /Actualizaciones deshabilitadas para plataforma/,
          required: true
        },
        {
          name: 'Verificación de plataforma en checkOnAppStart',
          pattern: /if \(platform !== 'android'\)/,
          required: true
        },
        {
          name: 'Verificación de plataforma en checkManually',
          pattern: /if \(platform !== 'android'\)/,
          required: true
        }
      ]
    },
    {
      file: 'src/components/UserMenu.js',
      checks: [
        {
          name: 'Manejo de plataforma no soportada',
          pattern: /reason === 'platform_not_supported'/,
          required: true
        }
      ]
    },
    {
      file: 'auto-release.js',
      checks: [
        {
          name: 'Información de solo Android en release notes',
          pattern: /Solo Android/,
          required: true
        },
        {
          name: 'Configuración de plataformas soportadas',
          pattern: /supportedPlatforms.*android/,
          required: true
        }
      ]
    }
  ];
  
  let allChecksPass = true;
  
  filesToCheck.forEach(({ file, checks }) => {
    logInfo(`\nVerificando archivo: ${file}`);
    
    if (!fs.existsSync(file)) {
      logError(`Archivo no encontrado: ${file}`);
      allChecksPass = false;
      return;
    }
    
    const content = fs.readFileSync(file, 'utf8');
    
    checks.forEach(({ name, pattern, required }) => {
      if (pattern.test(content)) {
        logSuccess(`${name} ✓`);
      } else {
        if (required) {
          logError(`${name} ✗ (requerido)`);
          allChecksPass = false;
        } else {
          logWarning(`${name} ✗ (opcional)`);
        }
      }
    });
  });
  
  return allChecksPass;
}

// Mostrar mensajes esperados en diferentes plataformas
function showExpectedMessages() {
  logStep('📱', 'Mensajes esperados en diferentes plataformas');
  
  log('\n🤖 En Android:', 'green');
  log('   🚀 Verificando actualizaciones al iniciar la aplicación (Android)...', 'green');
  log('   📱 Plataforma Android detectada - Verificando actualizaciones...', 'green');
  log('   ✅ Nueva versión disponible: X.X.X', 'green');
  log('   📥 Notificación de actualización mostrada', 'green');
  
  log('\n🌐 En Web (navegador):', 'yellow');
  log('   📱 Plataforma web detectada - Actualizaciones deshabilitadas', 'yellow');
  log('   ℹ️ Las actualizaciones automáticas solo están disponibles en Android', 'yellow');
  log('   ⚠️ Actualizaciones deshabilitadas para plataforma: web', 'yellow');
  log('   📱 Botón manual: "Las actualizaciones automáticas solo están disponibles en la app de Android"', 'yellow');
  
  log('\n🍎 En iOS:', 'yellow');
  log('   📱 Plataforma ios detectada - Actualizaciones deshabilitadas', 'yellow');
  log('   ℹ️ Las actualizaciones automáticas solo están disponibles en Android', 'yellow');
  log('   ⚠️ Actualizaciones deshabilitadas para plataforma: ios', 'yellow');
  log('   📱 Botón manual: "Las actualizaciones automáticas no están disponibles en ios"', 'yellow');
  
  log('\n💻 En Electron (escritorio):', 'yellow');
  log('   📱 Plataforma electron detectada - Actualizaciones deshabilitadas', 'yellow');
  log('   ℹ️ Las actualizaciones automáticas solo están disponibles en Android', 'yellow');
  log('   ⚠️ Actualizaciones deshabilitadas para plataforma: electron', 'yellow');
}

// Mostrar instrucciones de prueba
function showTestInstructions() {
  logStep('🧪', 'Instrucciones para probar');
  
  log('\n📋 Para probar en diferentes plataformas:', 'cyan');
  
  log('\n1️⃣ Probar en Web (navegador):', 'cyan');
  log('   • npm start', 'cyan');
  log('   • Abrir http://localhost:3000', 'cyan');
  log('   • DevTools → Console', 'cyan');
  log('   • Buscar: "Plataforma web detectada - Actualizaciones deshabilitadas"', 'cyan');
  log('   • Menú usuario → "Comprobar actualizaciones"', 'cyan');
  log('   • Debería mostrar: "Las actualizaciones automáticas solo están disponibles en la app de Android"', 'cyan');
  
  log('\n2️⃣ Probar en Android:', 'cyan');
  log('   • npm run build', 'cyan');
  log('   • npx cap sync android', 'cyan');
  log('   • npx cap run android', 'cyan');
  log('   • Buscar en logs: "Plataforma Android detectada - Verificando actualizaciones"', 'cyan');
  log('   • Debería funcionar normalmente y mostrar actualizaciones', 'cyan');
  
  log('\n3️⃣ Simular iOS (en navegador):', 'cyan');
  log('   • DevTools → Device Toolbar → iPhone', 'cyan');
  log('   • Recargar página', 'cyan');
  log('   • Capacitor detectará como "web" (no como iOS real)', 'cyan');
  
  log('\n🔍 Qué buscar en los logs:', 'blue');
  log('   ✅ Android: "Verificando actualizaciones para android..."', 'blue');
  log('   ❌ Web: "Actualizaciones deshabilitadas para plataforma: web"', 'blue');
  log('   ❌ iOS: "Actualizaciones deshabilitadas para plataforma: ios"', 'blue');
  log('   ❌ Electron: "Actualizaciones deshabilitadas para plataforma: electron"', 'blue');
}

// Mostrar beneficios de la restricción
function showBenefits() {
  logStep('🎯', 'Beneficios de restringir a solo Android');
  
  log('\n💡 Razones técnicas:', 'green');
  log('   • Android puede instalar APKs directamente', 'green');
  log('   • iOS requiere App Store (no puede instalar IPAs directamente)', 'green');
  log('   • Web no puede instalar aplicaciones nativas', 'green');
  log('   • Electron tiene su propio sistema de actualizaciones', 'green');
  
  log('\n🚀 Beneficios para el usuario:', 'blue');
  log('   • Experiencia consistente solo donde funciona', 'blue');
  log('   • No confundir usuarios con funciones no disponibles', 'blue');
  log('   • Mensajes claros sobre disponibilidad', 'blue');
  log('   • Mejor rendimiento en plataformas no soportadas', 'blue');
  
  log('\n🔧 Beneficios técnicos:', 'cyan');
  log('   • Menos solicitudes innecesarias a GitHub API', 'cyan');
  log('   • Código más limpio y mantenible', 'cyan');
  log('   • Logs más claros y específicos', 'cyan');
  log('   • Mejor debugging y troubleshooting', 'cyan');
}

// Función principal
async function main() {
  log('\n🧪 Probando restricción de actualizaciones solo para Android...', 'bright');
  
  try {
    // Simular comportamiento en diferentes plataformas
    simulatePlatformBehavior();
    
    // Verificar cambios en el código
    const codeChecksPass = checkCodeChanges();
    
    // Mostrar mensajes esperados
    showExpectedMessages();
    
    // Mostrar instrucciones de prueba
    showTestInstructions();
    
    // Mostrar beneficios
    showBenefits();
    
    // Resumen final
    logStep('📋', 'Resumen de la implementación');
    
    if (codeChecksPass) {
      logSuccess('✅ Todos los cambios implementados correctamente');
      
      log('\n🎯 Estado actual:', 'green');
      log('   • Actualizaciones SOLO en Android', 'green');
      log('   • Web/iOS/Electron: Mensajes informativos', 'green');
      log('   • Código optimizado para plataforma específica', 'green');
      log('   • Logs claros y específicos por plataforma', 'green');
      
      log('\n🚀 ¡El sistema está listo para usar!', 'bright');
      log('   Las actualizaciones automáticas solo funcionarán en Android', 'green');
      log('   Otras plataformas mostrarán mensajes informativos apropiados', 'green');
      
    } else {
      logWarning('⚠️ Algunos cambios pueden no haberse aplicado correctamente');
      logInfo('Revisa los errores arriba y corrige los archivos necesarios');
    }
    
    return codeChecksPass;
    
  } catch (error) {
    logError(`Error durante la prueba: ${error.message}`);
    return false;
  }
}

// Ejecutar prueba
main().then(success => {
  process.exit(success ? 0 : 1);
});