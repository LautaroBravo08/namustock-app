#!/usr/bin/env node

/**
 * Script para limpiar APKs antiguos automáticamente
 * Se puede ejecutar manualmente o como parte del proceso de actualización
 */

const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  bright: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Limpiar APKs del directorio de releases
function cleanReleaseApks(keepCount = 3) {
  log('\n🧹 Limpiando APKs del directorio releases...', 'bright');
  
  const releasesDir = 'releases';
  
  if (!fs.existsSync(releasesDir)) {
    log('📁 Directorio releases no existe', 'yellow');
    return;
  }
  
  try {
    const files = fs.readdirSync(releasesDir);
    const apkFiles = files
      .filter(file => file.endsWith('.apk'))
      .map(file => ({
        name: file,
        path: path.join(releasesDir, file),
        stats: fs.statSync(path.join(releasesDir, file))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime); // Más recientes primero
    
    log(`📦 Encontrados ${apkFiles.length} APKs`, 'blue');
    
    if (apkFiles.length <= keepCount) {
      log(`✅ Solo hay ${apkFiles.length} APKs, no es necesario limpiar`, 'green');
      return;
    }
    
    const toDelete = apkFiles.slice(keepCount);
    const toKeep = apkFiles.slice(0, keepCount);
    
    log(`📋 Manteniendo ${keepCount} APKs más recientes:`, 'blue');
    toKeep.forEach(file => {
      const sizeInMB = (file.stats.size / (1024 * 1024)).toFixed(2);
      log(`   ✓ ${file.name} (${sizeInMB} MB)`, 'green');
    });
    
    log(`🗑️  Eliminando ${toDelete.length} APKs antiguos:`, 'yellow');
    let deletedCount = 0;
    let deletedSize = 0;
    
    toDelete.forEach(file => {
      try {
        const sizeInMB = (file.stats.size / (1024 * 1024)).toFixed(2);
        fs.unlinkSync(file.path);
        log(`   ✓ ${file.name} (${sizeInMB} MB)`, 'green');
        deletedCount++;
        deletedSize += file.stats.size;
      } catch (error) {
        log(`   ✗ Error eliminando ${file.name}: ${error.message}`, 'red');
      }
    });
    
    const totalSavedMB = (deletedSize / (1024 * 1024)).toFixed(2);
    log(`\n✅ Limpieza completada: ${deletedCount} archivos eliminados, ${totalSavedMB} MB liberados`, 'green');
    
  } catch (error) {
    log(`❌ Error durante la limpieza: ${error.message}`, 'red');
  }
}

// Limpiar cache de Android
function cleanAndroidCache() {
  log('\n🧹 Limpiando cache de Android...', 'bright');
  
  const cacheDirs = [
    'android/app/build',
    'android/build',
    'android/.gradle/caches'
  ];
  
  cacheDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        // En Windows, usar rmdir /s /q
        const { execSync } = require('child_process');
        execSync(`rmdir /s /q "${dir}"`, { stdio: 'pipe' });
        log(`✓ ${dir} eliminado`, 'green');
      } catch (error) {
        log(`⚠️  No se pudo eliminar ${dir}`, 'yellow');
      }
    }
  });
}

// Limpiar archivos temporales de construcción
function cleanBuildFiles() {
  log('\n🧹 Limpiando archivos de construcción...', 'bright');
  
  const buildDirs = [
    'build',
    'dist',
    'node_modules/.cache'
  ];
  
  buildDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      try {
        const { execSync } = require('child_process');
        execSync(`rmdir /s /q "${dir}"`, { stdio: 'pipe' });
        log(`✓ ${dir} eliminado`, 'green');
      } catch (error) {
        log(`⚠️  No se pudo eliminar ${dir}`, 'yellow');
      }
    }
  });
}

// Mostrar estadísticas de espacio
function showSpaceStats() {
  log('\n📊 Estadísticas de espacio:', 'bright');
  
  const dirsToCheck = [
    { name: 'releases', path: 'releases' },
    { name: 'android/build', path: 'android/app/build' },
    { name: 'node_modules', path: 'node_modules' },
    { name: 'build', path: 'build' }
  ];
  
  dirsToCheck.forEach(({ name, path: dirPath }) => {
    if (fs.existsSync(dirPath)) {
      try {
        const size = getDirSize(dirPath);
        const sizeInMB = (size / (1024 * 1024)).toFixed(2);
        log(`   ${name}: ${sizeInMB} MB`, 'blue');
      } catch (error) {
        log(`   ${name}: Error calculando tamaño`, 'yellow');
      }
    } else {
      log(`   ${name}: No existe`, 'yellow');
    }
  });
}

// Calcular tamaño de directorio
function getDirSize(dirPath) {
  let size = 0;
  
  function calculateSize(currentPath) {
    const stats = fs.statSync(currentPath);
    
    if (stats.isFile()) {
      size += stats.size;
    } else if (stats.isDirectory()) {
      const files = fs.readdirSync(currentPath);
      files.forEach(file => {
        calculateSize(path.join(currentPath, file));
      });
    }
  }
  
  calculateSize(dirPath);
  return size;
}

// Función principal
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'apks';
  
  log('🧹 Iniciando limpieza automática...', 'bright');
  
  switch (command) {
    case 'apks':
      const keepCount = parseInt(args[1]) || 3;
      cleanReleaseApks(keepCount);
      break;
      
    case 'android':
      cleanAndroidCache();
      break;
      
    case 'build':
      cleanBuildFiles();
      break;
      
    case 'all':
      const keepCountAll = parseInt(args[1]) || 3;
      cleanReleaseApks(keepCountAll);
      cleanAndroidCache();
      cleanBuildFiles();
      break;
      
    case 'stats':
      showSpaceStats();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

function showHelp() {
  log('\n📖 Script de limpieza automática', 'bright');
  log('   node cleanup-apks.js [comando] [opciones]');
  log('\n🔧 Comandos disponibles:', 'blue');
  log('   apks [n]  - Limpiar APKs antiguos (mantener n más recientes, default: 3)');
  log('   android   - Limpiar cache de Android');
  log('   build     - Limpiar archivos de construcción');
  log('   all [n]   - Limpiar todo (APKs, cache, build)');
  log('   stats     - Mostrar estadísticas de espacio');
  log('   help      - Mostrar esta ayuda');
  log('\n📝 Ejemplos:', 'yellow');
  log('   node cleanup-apks.js apks 5     # Mantener 5 APKs más recientes');
  log('   node cleanup-apks.js all        # Limpieza completa');
  log('   node cleanup-apks.js stats      # Ver estadísticas');
}

// Ejecutar script
main();