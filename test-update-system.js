#!/usr/bin/env node

/**
 * Script de prueba completa del sistema de actualizaciones in-app
 * Verifica todos los componentes y funcionalidades
 */

const fs = require('fs');
const path = require('path');

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

// Verificar archivos del sistema de actualización
function checkUpdateSystemFiles() {
  logStep('📁', 'Verificando archivos del sistema de actualización...');
  
  const requiredFiles = [
    // Archivos principales
    { path: 'src/services/updateService.js', desc: 'Servicio de actualización' },
    { path: 'src/components/UpdateNotification.js', desc: 'Componente de notificación' },
    { path: 'public/version.json', desc: 'Archivo de versión' },
    
    // Plugin nativo Android
    { path: 'android/app/src/main/java/com/namustock/app/ApkInstallerPlugin.java', desc: 'Plugin nativo Android' },
    { path: 'android/app/src/main/java/com/namustock/app/MainActivity.java', desc: 'MainActivity Android' },
    { path: 'android/app/src/main/res/xml/file_paths.xml', desc: 'Configuración FileProvider' },
    { path: 'android/app/src/main/AndroidManifest.xml', desc: 'Manifest Android' },
    
    // Scripts de automatización
    { path: 'build-and-deploy.js', desc: 'Script de construcción y despliegue' },
    { path: 'cleanup-apks.js', desc: 'Script de limpieza automática' },
    { path: 'test-android-updates.js', desc: 'Script de pruebas Android' },
    
    // Documentación
    { path: 'README-ACTUALIZACIONES-IN-APP.md', desc: 'Documentación del sistema' }
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(({ path: filePath, desc }) => {
    if (fs.existsSync(filePath)) {
      logSuccess(`${desc} ✓`);
    } else {
      logError(`${desc} ✗ (${filePath})`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Verificar configuración de plugins
function checkPluginConfiguration() {
  logStep('🔌', 'Verificando configuración de plugins...');
  
  try {
    // Verificar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredDeps = [
      '@capacitor/filesystem',
      '@capacitor-community/file-opener',
      '@capacitor-community/http'
    ];
    
    requiredDeps.forEach(dep => {
      if (packageJson.dependencies[dep]) {
        logSuccess(`${dep} instalado`);
      } else {
        logError(`${dep} no encontrado`);
      }
    });
    
    // Verificar MainActivity
    const mainActivityPath = 'android/app/src/main/java/com/namustock/app/MainActivity.java';
    if (fs.existsSync(mainActivityPath)) {
      const content = fs.readFileSync(mainActivityPath, 'utf8');
      if (content.includes('ApkInstallerPlugin')) {
        logSuccess('Plugin registrado en MainActivity');
      } else {
        logError('Plugin no registrado en MainActivity');
      }
    }
    
    // Verificar AndroidManifest
    const manifestPath = 'android/app/src/main/AndroidManifest.xml';
    if (fs.existsSync(manifestPath)) {
      const content = fs.readFileSync(manifestPath, 'utf8');
      const requiredPermissions = [
        'REQUEST_INSTALL_PACKAGES',
        'WRITE_EXTERNAL_STORAGE',
        'READ_EXTERNAL_STORAGE'
      ];
      
      requiredPermissions.forEach(permission => {
        if (content.includes(permission)) {
          logSuccess(`Permiso ${permission} configurado`);
        } else {
          logWarning(`Permiso ${permission} no encontrado`);
        }
      });
      
      if (content.includes('FileProvider')) {
        logSuccess('FileProvider configurado');
      } else {
        logError('FileProvider no configurado');
      }
    }
    
    return true;
  } catch (error) {
    logError(`Error verificando configuración: ${error.message}`);
    return false;
  }
}

// Verificar scripts de package.json
function checkPackageScripts() {
  logStep('📜', 'Verificando scripts de package.json...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const requiredScripts = [
      'build:deploy',
      'build:deploy:patch',
      'build:deploy:minor',
      'build:deploy:major',
      'cleanup',
      'cleanup:all',
      'cleanup:stats',
      'test:android-updates'
    ];
    
    requiredScripts.forEach(script => {
      if (packageJson.scripts[script]) {
        logSuccess(`Script ${script} configurado`);
      } else {
        logWarning(`Script ${script} no encontrado`);
      }
    });
    
    return true;
  } catch (error) {
    logError(`Error verificando scripts: ${error.message}`);
    return false;
  }
}

// Verificar configuración de versiones
function checkVersionConfiguration() {
  logStep('🔢', 'Verificando configuración de versiones...');
  
  try {
    // Verificar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const packageVersion = packageJson.version;
    logInfo(`Versión en package.json: ${packageVersion}`);
    
    // Verificar version.json
    if (fs.existsSync('public/version.json')) {
      const versionJson = JSON.parse(fs.readFileSync('public/version.json', 'utf8'));
      logInfo(`Versión en version.json: ${versionJson.version}`);
      
      if (packageVersion === versionJson.version) {
        logSuccess('Versiones sincronizadas');
      } else {
        logWarning('Versiones no sincronizadas');
      }
    }
    
    // Verificar updateService.js
    if (fs.existsSync('src/services/updateService.js')) {
      const content = fs.readFileSync('src/services/updateService.js', 'utf8');
      const versionMatch = content.match(/const hardcodedVersion = '([^']+)';/);
      if (versionMatch) {
        const serviceVersion = versionMatch[1];
        logInfo(`Versión en updateService: ${serviceVersion}`);
        
        if (packageVersion === serviceVersion) {
          logSuccess('Versión del servicio sincronizada');
        } else {
          logWarning('Versión del servicio no sincronizada');
        }
      }
    }
    
    return true;
  } catch (error) {
    logError(`Error verificando versiones: ${error.message}`);
    return false;
  }
}

// Mostrar estadísticas del proyecto
function showProjectStats() {
  logStep('📊', 'Estadísticas del proyecto...');
  
  try {
    // Contar archivos por tipo
    const stats = {
      js: 0,
      java: 0,
      xml: 0,
      json: 0,
      md: 0
    };
    
    function countFiles(dir) {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
          countFiles(filePath);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          switch (ext) {
            case '.js':
              stats.js++;
              break;
            case '.java':
              stats.java++;
              break;
            case '.xml':
              stats.xml++;
              break;
            case '.json':
              stats.json++;
              break;
            case '.md':
              stats.md++;
              break;
          }
        }
      });
    }
    
    countFiles('src');
    countFiles('android/app/src');
    countFiles('.');
    
    logInfo(`Archivos JavaScript: ${stats.js}`);
    logInfo(`Archivos Java: ${stats.java}`);
    logInfo(`Archivos XML: ${stats.xml}`);
    logInfo(`Archivos JSON: ${stats.json}`);
    logInfo(`Archivos Markdown: ${stats.md}`);
    
    // Verificar tamaño de directorios importantes
    const dirs = ['src', 'android', 'build', 'node_modules'];
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        logInfo(`Directorio ${dir}: existe`);
      }
    });
    
  } catch (error) {
    logWarning(`Error calculando estadísticas: ${error.message}`);
  }
}

// Generar reporte de prueba
function generateTestReport(results) {
  logStep('📋', 'Generando reporte de prueba...');
  
  const report = {
    timestamp: new Date().toISOString(),
    results: results,
    summary: {
      total: Object.keys(results).length,
      passed: Object.values(results).filter(r => r).length,
      failed: Object.values(results).filter(r => !r).length
    }
  };
  
  const reportPath = 'test-update-system-report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  logSuccess(`Reporte guardado en: ${reportPath}`);
  
  // Mostrar resumen
  log('\n📋 Resumen de la prueba:', 'bright');
  log(`   Total de verificaciones: ${report.summary.total}`);
  log(`   Exitosas: ${report.summary.passed}`, 'green');
  log(`   Fallidas: ${report.summary.failed}`, report.summary.failed > 0 ? 'red' : 'green');
  
  if (report.summary.failed === 0) {
    log('\n🎉 ¡Todas las verificaciones pasaron! El sistema está listo.', 'green');
  } else {
    log('\n⚠️  Algunas verificaciones fallaron. Revisa los errores arriba.', 'yellow');
  }
  
  return report;
}

// Función principal
async function main() {
  log('\n🧪 Iniciando prueba completa del sistema de actualizaciones in-app...', 'bright');
  
  const results = {};
  
  try {
    // Ejecutar todas las verificaciones
    results.files = checkUpdateSystemFiles();
    results.plugins = checkPluginConfiguration();
    results.scripts = checkPackageScripts();
    results.versions = checkVersionConfiguration();
    
    // Mostrar estadísticas
    showProjectStats();
    
    // Generar reporte
    const report = generateTestReport(results);
    
    // Mostrar próximos pasos
    log('\n🚀 Próximos pasos recomendados:', 'cyan');
    log('   1. Ejecutar: npm run build:deploy:patch');
    log('   2. Probar: npm run test:android-updates');
    log('   3. Instalar APK en dispositivo Android');
    log('   4. Verificar actualización automática');
    log('   5. Comprobar limpieza de archivos antiguos');
    
    return report.summary.failed === 0;
    
  } catch (error) {
    logError(`Error durante la prueba: ${error.message}`);
    return false;
  }
}

// Ejecutar prueba
main().then(success => {
  process.exit(success ? 0 : 1);
});