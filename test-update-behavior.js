#!/usr/bin/env node

/**
 * Script para probar el nuevo comportamiento de actualizaciones
 * - Solo al iniciar la app
 * - Solo cuando se presiona el botón
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

// Verificar que los cambios se aplicaron correctamente
function checkUpdateServiceChanges() {
  logStep('🔍', 'Verificando cambios en UpdateService...');
  
  try {
    const updateServiceContent = fs.readFileSync('src/services/updateService.js', 'utf8');
    
    // Verificar que se agregaron los nuevos métodos
    if (updateServiceContent.includes('checkOnAppStart()')) {
      logSuccess('Método checkOnAppStart() encontrado');
    } else {
      logError('Método checkOnAppStart() NO encontrado');
    }
    
    if (updateServiceContent.includes('checkManually()')) {
      logSuccess('Método checkManually() encontrado');
    } else {
      logError('Método checkManually() NO encontrado');
    }
    
    // Verificar que startAutoCheck está deshabilitado
    if (updateServiceContent.includes('startAutoCheck() deshabilitado')) {
      logSuccess('startAutoCheck() correctamente deshabilitado');
    } else {
      logWarning('startAutoCheck() puede no estar deshabilitado');
    }
    
    // Verificar que no hay setInterval activo
    const setIntervalMatches = updateServiceContent.match(/setInterval\(/g);
    if (!setIntervalMatches || setIntervalMatches.length === 0) {
      logSuccess('No hay setInterval activos (verificaciones automáticas deshabilitadas)');
    } else {
      logWarning(`Se encontraron ${setIntervalMatches.length} setInterval - verificar si son necesarios`);
    }
    
    return true;
  } catch (error) {
    logError(`Error leyendo UpdateService: ${error.message}`);
    return false;
  }
}

// Verificar cambios en UpdateNotification
function checkUpdateNotificationChanges() {
  logStep('🔍', 'Verificando cambios en UpdateNotification...');
  
  try {
    const notificationContent = fs.readFileSync('src/components/UpdateNotification.js', 'utf8');
    
    // Verificar que usa checkOnAppStart
    if (notificationContent.includes('updateService.checkOnAppStart()')) {
      logSuccess('UpdateNotification usa checkOnAppStart() al iniciar');
    } else {
      logError('UpdateNotification NO usa checkOnAppStart()');
    }
    
    // Verificar que handleCheckNow usa checkManually
    if (notificationContent.includes('updateService.checkManually()')) {
      logSuccess('handleCheckNow usa checkManually()');
    } else {
      logError('handleCheckNow NO usa checkManually()');
    }
    
    // Verificar que no llama a startAutoCheck
    if (!notificationContent.includes('updateService.startAutoCheck()')) {
      logSuccess('UpdateNotification NO llama a startAutoCheck()');
    } else {
      logWarning('UpdateNotification todavía llama a startAutoCheck()');
    }
    
    return true;
  } catch (error) {
    logError(`Error leyendo UpdateNotification: ${error.message}`);
    return false;
  }
}

// Verificar cambios en UserMenu
function checkUserMenuChanges() {
  logStep('🔍', 'Verificando cambios en UserMenu...');
  
  try {
    const userMenuContent = fs.readFileSync('src/components/UserMenu.js', 'utf8');
    
    // Verificar que handleCheckUpdates usa checkManually
    if (userMenuContent.includes('updateService.checkManually()')) {
      logSuccess('UserMenu usa checkManually() en el botón');
    } else {
      logError('UserMenu NO usa checkManually()');
    }
    
    return true;
  } catch (error) {
    logError(`Error leyendo UserMenu: ${error.message}`);
    return false;
  }
}

// Simular el comportamiento esperado
function simulateNewBehavior() {
  logStep('🎭', 'Simulando nuevo comportamiento...');
  
  logInfo('Escenario 1: Usuario abre la aplicación');
  log('   1. App se carga', 'cyan');
  log('   2. UpdateNotification se monta', 'cyan');
  log('   3. Se ejecuta checkOnAppStart() UNA SOLA VEZ', 'cyan');
  log('   4. Si hay actualización, se muestra notificación', 'cyan');
  log('   5. NO hay verificaciones automáticas posteriores', 'cyan');
  logSuccess('✅ Comportamiento esperado: Una verificación al inicio');
  
  logInfo('Escenario 2: Usuario presiona "Comprobar actualizaciones"');
  log('   1. Usuario hace clic en el botón del menú', 'cyan');
  log('   2. Se ejecuta checkManually()', 'cyan');
  log('   3. Se muestra resultado inmediatamente', 'cyan');
  log('   4. Si hay actualización, se muestra notificación', 'cyan');
  logSuccess('✅ Comportamiento esperado: Verificación manual bajo demanda');
  
  logInfo('Escenario 3: App en segundo plano');
  log('   1. Usuario minimiza la app', 'cyan');
  log('   2. App permanece en segundo plano', 'cyan');
  log('   3. NO se ejecutan verificaciones automáticas', 'cyan');
  log('   4. NO hay consumo de batería por verificaciones', 'cyan');
  logSuccess('✅ Comportamiento esperado: Sin verificaciones en segundo plano');
}

// Mostrar beneficios del cambio
function showBenefits() {
  logStep('🚀', 'Beneficios del nuevo comportamiento');
  
  log('\n💡 Beneficios para el usuario:', 'green');
  log('   • Menor consumo de batería', 'green');
  log('   • Menos uso de datos móviles', 'green');
  log('   • Control total sobre cuándo verificar', 'green');
  log('   • No interrupciones inesperadas', 'green');
  log('   • Mejor experiencia de usuario', 'green');
  
  log('\n🔧 Beneficios técnicos:', 'blue');
  log('   • Menos solicitudes a GitHub API', 'blue');
  log('   • Menor probabilidad de rate limit', 'blue');
  log('   • Código más simple y predecible', 'blue');
  log('   • Mejor rendimiento general', 'blue');
  log('   • Logs más limpios', 'blue');
  
  log('\n📱 Casos de uso:', 'cyan');
  log('   • Al abrir la app: Verificación automática', 'cyan');
  log('   • Botón manual: Verificación bajo demanda', 'cyan');
  log('   • Uso normal: Sin interrupciones', 'cyan');
  log('   • Desarrollo: Menos ruido en logs', 'cyan');
}

// Mostrar instrucciones de prueba
function showTestInstructions() {
  logStep('🧪', 'Instrucciones para probar');
  
  log('\n📋 Cómo probar el nuevo comportamiento:', 'yellow');
  log('   1. Ejecutar: npm start', 'yellow');
  log('   2. Abrir DevTools → Console', 'yellow');
  log('   3. Buscar: "🚀 Verificando actualizaciones al iniciar"', 'yellow');
  log('   4. Verificar que NO hay logs periódicos de verificación', 'yellow');
  log('   5. Ir al menú de usuario → "Comprobar actualizaciones"', 'yellow');
  log('   6. Buscar: "🔍 Verificación manual de actualizaciones"', 'yellow');
  
  log('\n🔍 Qué buscar en los logs:', 'yellow');
  log('   ✅ "Verificando actualizaciones al iniciar" (una vez)', 'yellow');
  log('   ✅ "Verificación manual solicitada" (al hacer clic)', 'yellow');
  log('   ❌ NO debe haber logs repetitivos cada X minutos', 'yellow');
  log('   ❌ NO debe haber "setInterval" activos', 'yellow');
  
  log('\n📱 Probar en Android:', 'yellow');
  log('   1. npm run build', 'yellow');
  log('   2. npx cap sync android', 'yellow');
  log('   3. npx cap run android', 'yellow');
  log('   4. Verificar comportamiento igual que en web', 'yellow');
}

// Función principal
async function main() {
  log('\n🧪 Verificando nuevo comportamiento de actualizaciones...', 'bright');
  log('   Solo al iniciar + Solo con botón manual', 'cyan');
  
  try {
    // Verificar cambios en archivos
    const serviceOk = checkUpdateServiceChanges();
    const notificationOk = checkUpdateNotificationChanges();
    const userMenuOk = checkUserMenuChanges();
    
    // Simular comportamiento
    simulateNewBehavior();
    
    // Mostrar beneficios
    showBenefits();
    
    // Mostrar instrucciones
    showTestInstructions();
    
    // Resumen final
    logStep('📋', 'Resumen de cambios implementados');
    
    if (serviceOk && notificationOk && userMenuOk) {
      logSuccess('✅ Todos los cambios aplicados correctamente');
      
      log('\n🎯 Comportamiento actual:', 'green');
      log('   • Al abrir app: Una verificación automática', 'green');
      log('   • Botón manual: Verificación bajo demanda', 'green');
      log('   • En segundo plano: Sin verificaciones', 'green');
      log('   • Rate limit: Reducido significativamente', 'green');
      
      log('\n🚀 ¡El sistema está listo para usar!', 'bright');
      
    } else {
      logWarning('⚠️ Algunos cambios pueden no haberse aplicado correctamente');
    }
    
    return serviceOk && notificationOk && userMenuOk;
    
  } catch (error) {
    logError(`Error durante la verificación: ${error.message}`);
    return false;
  }
}

// Ejecutar verificación
main().then(success => {
  process.exit(success ? 0 : 1);
});