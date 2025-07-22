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
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n${step}. ${message}`, 'cyan');
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

// Función principal de deployment
async function deploy() {
  try {
    log('\n🚀 Iniciando proceso de deployment...', 'bright');
    
    // Paso 1: Verificar que estamos en la rama correcta
    logStep(1, 'Verificando rama actual');
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      log(`Rama actual: ${currentBranch}`);
      
      if (currentBranch !== 'main' && currentBranch !== 'master') {
        logWarning(`Estás en la rama '${currentBranch}'. ¿Estás seguro de que quieres hacer deployment desde esta rama?`);
      }
    } catch (error) {
      logWarning('No se pudo determinar la rama actual (posible repositorio sin git)');
    }

    // Paso 2: Verificar cambios pendientes
    logStep(2, 'Verificando cambios pendientes');
    try {
      const status = execSync('git status --porcelain', { encoding: 'utf8' });
      if (status.trim()) {
        logWarning('Hay cambios sin commitear:');
        log(status);
        logWarning('Considera hacer commit de estos cambios antes del deployment');
      } else {
        logSuccess('No hay cambios pendientes');
      }
    } catch (error) {
      logWarning('No se pudo verificar el estado de git');
    }

    // Paso 3: Actualizar versión
    logStep(3, 'Actualizando versión');
    const updateType = process.argv[2] || 'patch';
    log(`Tipo de actualización: ${updateType}`);
    
    execSync(`node update-version.js ${updateType}`, { stdio: 'inherit' });
    
    // Leer la nueva versión
    const versionData = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
    const newVersion = versionData.version;
    logSuccess(`Nueva versión: ${newVersion}`);

    // Paso 4: Ejecutar tests (si existen)
    logStep(4, 'Ejecutando tests');
    try {
      execSync('npm test -- --watchAll=false --passWithNoTests', { stdio: 'inherit' });
      logSuccess('Tests pasaron correctamente');
    } catch (error) {
      logError('Los tests fallaron');
      throw error;
    }

    // Paso 5: Build de producción
    logStep(5, 'Creando build de producción');
    try {
      execSync('npm run build', { stdio: 'inherit' });
      logSuccess('Build completado exitosamente');
    } catch (error) {
      logError('Error durante el build');
      throw error;
    }

    // Paso 6: Commit de la nueva versión
    logStep(6, 'Creando commit de la nueva versión');
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "🚀 Release v${newVersion}"`, { stdio: 'inherit' });
      logSuccess(`Commit creado para la versión ${newVersion}`);
    } catch (error) {
      logWarning('No se pudo crear el commit (posible que no haya cambios)');
    }

    // Paso 7: Crear tag
    logStep(7, 'Creando tag de versión');
    try {
      execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`, { stdio: 'inherit' });
      logSuccess(`Tag v${newVersion} creado`);
    } catch (error) {
      logWarning('No se pudo crear el tag');
    }

    // Paso 8: Push a repositorio
    logStep(8, 'Subiendo cambios al repositorio');
    try {
      execSync('git push origin HEAD', { stdio: 'inherit' });
      execSync('git push --tags', { stdio: 'inherit' });
      logSuccess('Cambios subidos al repositorio');
    } catch (error) {
      logWarning('No se pudieron subir los cambios (verifica tu conexión y permisos)');
    }

    // Paso 9: Información de deployment
    logStep(9, 'Información de deployment');
    log('\n📋 Resumen del deployment:', 'bright');
    log(`   Versión: ${newVersion}`);
    log(`   Fecha: ${versionData.buildDate}`);
    log(`   Características:`);
    versionData.features.forEach(feature => {
      log(`     • ${feature}`);
    });

    log('\n🎉 ¡Deployment completado exitosamente!', 'green');
    log('\n📝 Próximos pasos:', 'bright');
    log('   1. Verifica que la aplicación funcione correctamente');
    log('   2. Los usuarios recibirán una notificación de actualización automáticamente');
    log('   3. El service worker se actualizará en segundo plano');
    
  } catch (error) {
    logError(`Error durante el deployment: ${error.message}`);
    process.exit(1);
  }
}

// Ejecutar deployment
deploy();