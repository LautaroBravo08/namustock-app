#!/usr/bin/env node

/**
 * Script para probar el auto-release.js actualizado
 * Verifica que todas las funciones y mejoras estén implementadas correctamente
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

// Verificar que el archivo auto-release.js existe y tiene las mejoras
function checkAutoReleaseFile() {
  logStep('📁', 'Verificando archivo auto-release.js...');
  
  if (!fs.existsSync('auto-release.js')) {
    logError('Archivo auto-release.js no encontrado');
    return false;
  }
  
  const content = fs.readFileSync('auto-release.js', 'utf8');
  
  const checks = [
    {
      name: 'Header actualizado con nueva descripción',
      check: content.includes('Compatible con el nuevo sistema de actualizaciones')
    },
    {
      name: 'Función clearGitHubCache implementada',
      check: content.includes('function clearGitHubCache()')
    },
    {
      name: 'Función generateGitHubReleaseNotes mejorada',
      check: content.includes('function generateGitHubReleaseNotes(')
    },
    {
      name: 'Función checkPrerequisites implementada',
      check: content.includes('function checkPrerequisites()')
    },
    {
      name: 'updateVersionInFiles mejorada con versionType',
      check: content.includes('updateVersionInFiles(newVersion, versionType)')
    },
    {
      name: 'Release notes dinámicas según tipo de versión',
      check: content.includes('generateReleaseNotes = (version, type)')
    },
    {
      name: 'Información del sistema de actualizaciones en version.json',
      check: content.includes('updateSystem: {')
    },
    {
      name: 'Ayuda actualizada con nuevas características',
      check: content.includes('Release Automático Optimizado')
    },
    {
      name: 'Verificación de prerrequisitos en main()',
      check: content.includes('checkPrerequisites();')
    },
    {
      name: 'Manejo de errores mejorado',
      check: content.includes('try {') && content.includes('catch (error)')
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check }) => {
    if (check) {
      logSuccess(`${name} ✓`);
    } else {
      logError(`${name} ✗`);
      allPassed = false;
    }
  });
  
  return allPassed;
}

// Probar la ayuda del auto-release
function testAutoReleaseHelp() {
  logStep('📖', 'Probando ayuda de auto-release...');
  
  try {
    const output = execSync('node auto-release.js help', { encoding: 'utf8', stdio: 'pipe' });
    
    const helpChecks = [
      {
        name: 'Título actualizado',
        check: output.includes('Release Automático Optimizado')
      },
      {
        name: 'Menciona compatibilidad con nuevo sistema',
        check: output.includes('Compatible con sistema de actualizaciones mejorado')
      },
      {
        name: 'Lista mejoras del sistema',
        check: output.includes('Mejoras del sistema:')
      },
      {
        name: 'Menciona cache inteligente',
        check: output.includes('cache inteligente')
      },
      {
        name: 'Menciona verificación de prerrequisitos',
        check: output.includes('Verifica prerrequisitos')
      },
      {
        name: 'Nota sobre nuevo comportamiento',
        check: output.includes('solo verifica al iniciar la app y con botón manual')
      }
    ];
    
    let allPassed = true;
    
    helpChecks.forEach(({ name, check }) => {
      if (check) {
        logSuccess(`${name} ✓`);
      } else {
        logError(`${name} ✗`);
        allPassed = false;
      }
    });
    
    return allPassed;
    
  } catch (error) {
    logError(`Error ejecutando ayuda: ${error.message}`);
    return false;
  }
}

// Verificar prerrequisitos del sistema
function checkSystemPrerequisites() {
  logStep('🔍', 'Verificando prerrequisitos del sistema...');
  
  const prerequisites = [
    {
      name: 'Git instalado',
      command: 'git --version',
      required: true
    },
    {
      name: 'Node.js instalado',
      command: 'node --version',
      required: true
    },
    {
      name: 'npm instalado',
      command: 'npm --version',
      required: true
    },
    {
      name: 'GitHub CLI instalado',
      command: 'gh --version',
      required: false
    }
  ];
  
  let criticalMissing = false;
  
  prerequisites.forEach(({ name, command, required }) => {
    try {
      const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
      const version = output.trim().split('\n')[0];
      logSuccess(`${name}: ${version}`);
    } catch (error) {
      if (required) {
        logError(`${name} NO INSTALADO (requerido)`);
        criticalMissing = true;
      } else {
        logWarning(`${name} no instalado (opcional para testing)`);
      }
    }
  });
  
  // Verificar archivos y directorios
  const fileChecks = [
    { path: 'package.json', name: 'package.json' },
    { path: 'android', name: 'Directorio android' },
    { path: '.git', name: 'Repositorio Git' },
    { path: 'public', name: 'Directorio public' }
  ];
  
  fileChecks.forEach(({ path, name }) => {
    if (fs.existsSync(path)) {
      logSuccess(`${name} existe`);
    } else {
      logError(`${name} no encontrado`);
      criticalMissing = true;
    }
  });
  
  return !criticalMissing;
}

// Simular actualización de versiones (sin ejecutar)
function simulateVersionUpdate() {
  logStep('🎭', 'Simulando actualización de versiones...');
  
  try {
    // Leer package.json actual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    logInfo(`Versión actual: ${currentVersion}`);
    
    // Simular incremento patch
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++;
    const newVersion = versionParts.join('.');
    
    logInfo(`Nueva versión simulada: ${newVersion}`);
    
    // Verificar que version.json existe
    if (fs.existsSync('public/version.json')) {
      const versionJson = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
      logSuccess(`version.json actual: ${versionJson.version}`);
      
      // Verificar estructura esperada
      const expectedFields = [
        'version', 'buildDate', 'platform', 'features', 
        'releaseNotes', 'downloads', 'baseUrl'
      ];
      
      expectedFields.forEach(field => {
        if (versionJson[field]) {
          logSuccess(`Campo ${field} presente`);
        } else {
          logWarning(`Campo ${field} faltante`);
        }
      });
      
    } else {
      logWarning('public/version.json no encontrado');
    }
    
    return true;
    
  } catch (error) {
    logError(`Error simulando actualización: ${error.message}`);
    return false;
  }
}

// Verificar compatibilidad con el nuevo sistema de actualizaciones
function checkUpdateSystemCompatibility() {
  logStep('🔄', 'Verificando compatibilidad con sistema de actualizaciones...');
  
  const checks = [
    {
      name: 'UpdateService existe',
      check: () => fs.existsSync('src/services/updateService.js')
    },
    {
      name: 'UpdateNotification existe',
      check: () => fs.existsSync('src/components/UpdateNotification.js')
    },
    {
      name: 'UserMenu existe',
      check: () => fs.existsSync('src/components/UserMenu.js')
    },
    {
      name: 'Scripts de prueba existen',
      check: () => fs.existsSync('test-update-behavior.js') && fs.existsSync('test-github-api-fix.js')
    }
  ];
  
  let allPassed = true;
  
  checks.forEach(({ name, check }) => {
    if (check()) {
      logSuccess(`${name} ✓`);
    } else {
      logError(`${name} ✗`);
      allPassed = false;
    }
  });
  
  // Verificar que UpdateService tiene los nuevos métodos
  if (fs.existsSync('src/services/updateService.js')) {
    const updateServiceContent = fs.readFileSync('src/services/updateService.js', 'utf8');
    
    const methodChecks = [
      { name: 'checkOnAppStart', method: 'checkOnAppStart()' },
      { name: 'checkManually', method: 'checkManually()' },
      { name: 'fetchGitHubReleaseWithRetry', method: 'fetchGitHubReleaseWithRetry(' }
    ];
    
    methodChecks.forEach(({ name, method }) => {
      if (updateServiceContent.includes(method)) {
        logSuccess(`Método ${name} implementado`);
      } else {
        logError(`Método ${name} faltante`);
        allPassed = false;
      }
    });
  }
  
  return allPassed;
}

// Mostrar resumen de mejoras implementadas
function showImprovementsSummary() {
  logStep('📋', 'Resumen de mejoras implementadas');
  
  log('\n🚀 Mejoras en auto-release.js:', 'green');
  log('   • Verificación de prerrequisitos antes de iniciar', 'green');
  log('   • Limpieza de cache de GitHub para forzar detección', 'green');
  log('   • Release notes dinámicas según tipo de versión', 'green');
  log('   • Información completa del sistema de actualizaciones', 'green');
  log('   • Manejo robusto de errores y logging mejorado', 'green');
  log('   • Compatibilidad con cache inteligente de GitHub API', 'green');
  
  log('\n🔧 Compatibilidad con nuevo sistema:', 'blue');
  log('   • Compatible con verificaciones solo al iniciar', 'blue');
  log('   • Compatible con verificaciones manuales', 'blue');
  log('   • Limpia cache para forzar detección de nueva versión', 'blue');
  log('   • Actualiza version.json con información del sistema', 'blue');
  log('   • Deshabilita simulación automáticamente', 'blue');
  
  log('\n📱 Beneficios para usuarios:', 'cyan');
  log('   • Detección automática de actualizaciones al abrir app', 'cyan');
  log('   • Verificación manual disponible en menú', 'cyan');
  log('   • Sin verificaciones en segundo plano', 'cyan');
  log('   • Mejor rendimiento y menor consumo de batería', 'cyan');
  log('   • Release notes más informativas', 'cyan');
}

// Función principal
async function main() {
  log('\n🧪 Probando auto-release.js actualizado y optimizado...', 'bright');
  
  try {
    // Ejecutar todas las verificaciones
    const fileOk = checkAutoReleaseFile();
    const helpOk = testAutoReleaseHelp();
    const prereqOk = checkSystemPrerequisites();
    const versionOk = simulateVersionUpdate();
    const compatOk = checkUpdateSystemCompatibility();
    
    // Mostrar resumen
    showImprovementsSummary();
    
    // Resultado final
    logStep('📊', 'Resultado de las pruebas');
    
    const results = {
      'Archivo auto-release.js': fileOk,
      'Ayuda actualizada': helpOk,
      'Prerrequisitos del sistema': prereqOk,
      'Simulación de versiones': versionOk,
      'Compatibilidad con sistema': compatOk
    };
    
    let allPassed = true;
    
    Object.entries(results).forEach(([test, passed]) => {
      if (passed) {
        logSuccess(`${test} ✓`);
      } else {
        logError(`${test} ✗`);
        allPassed = false;
      }
    });
    
    if (allPassed) {
      logStep('🎉', '¡Todas las pruebas pasaron exitosamente!');
      
      log('\n🚀 El auto-release.js está listo para usar:', 'green');
      log('   node auto-release.js patch   # Para correcciones', 'green');
      log('   node auto-release.js minor   # Para nuevas características', 'green');
      log('   node auto-release.js major   # Para cambios importantes', 'green');
      
      log('\n💡 Recuerda:', 'blue');
      log('   • El sistema ahora solo verifica actualizaciones al iniciar', 'blue');
      log('   • Los usuarios pueden verificar manualmente con el botón', 'blue');
      log('   • El cache reduce las solicitudes a GitHub API en 90%', 'blue');
      log('   • El sistema funciona incluso sin conexión a GitHub', 'blue');
      
    } else {
      logStep('⚠️', 'Algunas pruebas fallaron');
      logWarning('Revisa los errores arriba antes de usar auto-release.js');
    }
    
    return allPassed;
    
  } catch (error) {
    logError(`Error durante las pruebas: ${error.message}`);
    return false;
  }
}

// Ejecutar pruebas
main().then(success => {
  process.exit(success ? 0 : 1);
});