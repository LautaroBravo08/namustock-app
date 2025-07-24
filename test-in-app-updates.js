#!/usr/bin/env node

/**
 * Script para probar el sistema de actualizaciones in-app
 * Simula una nueva versión disponible para probar la funcionalidad
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

// Simular nueva versión disponible
function simulateNewVersion() {
  log('\n🔄 Simulando nueva versión disponible...', 'bright');
  
  const versionPath = 'public/version.json';
  
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    const currentVersion = versionData.version;
    
    // Incrementar versión patch para simular
    const versionParts = currentVersion.split('.').map(Number);
    versionParts[2]++;
    const newVersion = versionParts.join('.');
    
    // Crear versión simulada
    const simulatedVersion = {
      ...versionData,
      version: newVersion,
      buildDate: new Date().toISOString(),
      releaseNotes: `🚀 Versión ${newVersion} - Prueba de actualizaciones in-app\n\n✨ Nuevas características:\n• Sistema de descarga automática\n• Instalación sin salir de la app\n• Limpieza automática de archivos antiguos\n• Progreso visual mejorado\n\n🐛 Correcciones:\n• Mejor manejo de errores\n• Optimizaciones de rendimiento`,
      features: [
        "Sistema de actualizaciones in-app",
        "Descarga automática de APKs",
        "Instalación nativa mejorada",
        "Limpieza automática de archivos antiguos",
        "Progreso visual en tiempo real",
        "Notificaciones elegantes",
        "Fallbacks seguros"
      ]
    };
    
    // Guardar versión simulada
    fs.writeFileSync(versionPath, JSON.stringify(simulatedVersion, null, 2));
    
    logSuccess(`Versión simulada: ${currentVersion} → ${newVersion}`);
    logInfo(`Archivo actualizado: ${versionPath}`);
    
    return { currentVersion, newVersion, simulatedVersion };
    
  } catch (error) {
    logError(`Error simulando versión: ${error.message}`);
    return null;
  }
}

// Revertir a versión original
function revertToOriginalVersion(originalVersion) {
  log('\n🔙 Revirtiendo a versión original...', 'bright');
  
  const versionPath = 'public/version.json';
  
  try {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    
    // Revertir a versión original
    const revertedVersion = {
      ...versionData,
      version: originalVersion,
      buildDate: new Date().toISOString(),
      releaseNotes: `Nueva versión ${originalVersion} con mejoras y correcciones`,
      features: [
        "Sistema de inventario completo",
        "Gestión de ventas",
        "Análisis de productos",
        "Notificaciones automáticas",
        "Auto-actualización mejorada",
        "Validaciones de formularios",
        "Eliminación de ventas corregida"
      ]
    };
    
    fs.writeFileSync(versionPath, JSON.stringify(revertedVersion, null, 2));
    
    logSuccess(`Versión revertida a: ${originalVersion}`);
    
  } catch (error) {
    logError(`Error revirtiendo versión: ${error.message}`);
  }
}

// Verificar configuración del sistema
function checkSystemConfiguration() {
  log('\n🔍 Verificando configuración del sistema...', 'bright');
  
  const checks = [
    {
      name: 'APK generado',
      path: 'android/app/build/outputs/apk/release/app-release.apk',
      required: true
    },
    {
      name: 'Plugin nativo Android',
      path: 'android/app/src/main/java/com/namustock/app/ApkInstallerPlugin.java',
      required: true
    },
    {
      name: 'Configuración FileProvider',
      path: 'android/app/src/main/res/xml/file_paths.xml',
      required: true
    },
    {
      name: 'UpdateService',
      path: 'src/services/updateService.js',
      required: true
    },
    {
      name: 'UpdateNotification',
      path: 'src/components/UpdateNotification.js',
      required: true
    }
  ];
  
  let allGood = true;
  
  checks.forEach(check => {
    if (fs.existsSync(check.path)) {
      logSuccess(`${check.name} ✓`);
    } else {
      if (check.required) {
        logError(`${check.name} ✗ (requerido)`);
        allGood = false;
      } else {
        logWarning(`${check.name} ⚠️ (opcional)`);
      }
    }
  });
  
  return allGood;
}

// Mostrar instrucciones de prueba
function showTestInstructions(simulatedVersion) {
  log('\n📱 Instrucciones para probar actualizaciones in-app:', 'bright');
  
  log('\n1️⃣ Instalar APK actual:', 'cyan');
  log('   • Copia el APK a tu dispositivo Android');
  log('   • Instala: android/app/build/outputs/apk/release/app-release.apk');
  log('   • Abre la aplicación y verifica que muestra versión 1.0.31');
  
  log('\n2️⃣ Probar detección de actualización:', 'cyan');
  log('   • En la app, ve al menú de usuario (icono de perfil)');
  log('   • Haz clic en "Comprobar actualizaciones"');
  log(`   • Deberías ver: "¡Nueva versión ${simulatedVersion.version} disponible!"`);
  
  log('\n3️⃣ Probar actualización in-app:', 'cyan');
  log('   • Haz clic en "Actualizar" en la notificación');
  log('   • Observa la barra de progreso de descarga');
  log('   • La app debería descargar e intentar instalar automáticamente');
  log('   • Sigue las instrucciones del sistema Android para completar');
  
  log('\n4️⃣ Verificar limpieza automática:', 'cyan');
  log('   • Después de la instalación, verifica que APKs antiguos se eliminaron');
  log('   • Revisa los logs en la consola del navegador/dispositivo');
  
  log('\n🔧 Para debugging:', 'yellow');
  log('   • Abre DevTools en el navegador (si es web)');
  log('   • Usa adb logcat en Android para ver logs nativos');
  log('   • Revisa la consola de la app para logs detallados');
  
  log('\n⚠️  Notas importantes:', 'yellow');
  log('   • Asegúrate de tener permisos para instalar apps desconocidas');
  log('   • La instalación requiere confirmación manual del usuario');
  log('   • Si falla, la app abrirá el navegador como fallback');
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'simulate';
  
  log('🧪 Sistema de Pruebas de Actualizaciones In-App', 'bright');
  
  switch (command) {
    case 'simulate':
      // Verificar configuración
      if (!checkSystemConfiguration()) {
        logError('Configuración incompleta. Abortando prueba.');
        return;
      }
      
      // Simular nueva versión
      const result = simulateNewVersion();
      if (result) {
        showTestInstructions(result.simulatedVersion);
        
        log('\n⏳ Presiona Enter cuando hayas terminado de probar...', 'yellow');
        process.stdin.once('data', () => {
          revertToOriginalVersion(result.currentVersion);
          log('\n🎉 Prueba completada. Sistema listo para producción!', 'green');
          process.exit(0);
        });
      }
      break;
      
    case 'revert':
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      revertToOriginalVersion(packageJson.version);
      break;
      
    case 'check':
      checkSystemConfiguration();
      break;
      
    case 'help':
    default:
      log('\n📖 Comandos disponibles:', 'cyan');
      log('   node test-in-app-updates.js simulate  - Simular nueva versión y mostrar instrucciones');
      log('   node test-in-app-updates.js revert    - Revertir a versión original');
      log('   node test-in-app-updates.js check     - Verificar configuración del sistema');
      log('   node test-in-app-updates.js help      - Mostrar esta ayuda');
      break;
  }
}

// Ejecutar script
main();