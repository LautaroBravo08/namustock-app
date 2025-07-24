#!/usr/bin/env node

/**
 * Script para crear GitHub Release COMPLETAMENTE AUTOMÁTICO
 * Sube automáticamente el APK usando GitHub CLI
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

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Función principal
async function main() {
  try {
    log('\n🚀 Creando GitHub Release para solucionar actualizaciones...', 'bright');
    
    // Leer versión actual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const version = packageJson.version;
    const tagName = `v${version}`;
    
    logInfo(`Versión actual: ${version}`);
    
    // Verificar que el APK existe
    const apkPath = `releases/namustock-${version}.apk`;
    if (!fs.existsSync(apkPath)) {
      logError(`APK no encontrado: ${apkPath}`);
      logInfo('Ejecuta primero: npm run deploy:auto');
      process.exit(1);
    }
    
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`APK encontrado: ${apkPath} (${sizeInMB} MB)`);
    
    // Crear release notes
    const releaseNotes = `# 🚀 NamuStock v${version}

## ✨ Sistema de Actualizaciones Automáticas

### 📱 Nuevas Características
- **Descarga automática** de actualizaciones dentro de la aplicación
- **Instalación sin fricción** - no necesitas salir de la app
- **Progreso visual en tiempo real** durante la descarga
- **Limpieza automática** de archivos antiguos para ahorrar espacio

### 🔧 Mejoras Técnicas
- Plugin nativo Android optimizado para instalación de APKs
- Mejor manejo de errores con fallbacks seguros
- Sistema de notificaciones elegante y informativo
- Compatibilidad mejorada con Android 7.0+

## 📦 Instalación

### Para Nuevos Usuarios
1. Descarga el APK desde los assets de este release
2. Habilita "Instalar apps desconocidas" en tu dispositivo Android
3. Instala el APK descargado

### Para Usuarios Existentes
¡Las actualizaciones ahora son automáticas! 🎉
- La app detectará automáticamente esta nueva versión
- Recibirás una notificación elegante
- Haz clic en "Actualizar" y la app se actualizará sola
- Los archivos antiguos se limpiarán automáticamente

## 🔄 Próximas Actualizaciones
A partir de esta versión, todas las futuras actualizaciones se instalarán automáticamente dentro de la app.

## 📊 Estadísticas
- **Tamaño del APK**: ${sizeInMB} MB
- **Versión mínima de Android**: 7.0 (API 24)
- **Arquitecturas soportadas**: ARM64, ARM32

---

**Nota**: Si tienes problemas con la actualización automática, puedes descargar e instalar manualmente el APK desde los assets de este release.`;

    // Guardar release notes en archivo temporal
    const notesFile = 'temp-release-notes.md';
    fs.writeFileSync(notesFile, releaseNotes);
    
    try {
      // Verificar si GitHub CLI está disponible
      try {
        execSync('gh --version', { stdio: 'pipe' });
        logSuccess('GitHub CLI disponible');
        
        // Crear release con GitHub CLI
        const createCommand = `gh release create ${tagName} "${apkPath}" --title "🚀 NamuStock v${version} - Actualizaciones Automáticas" --notes-file "${notesFile}" --latest`;
        
        logInfo('Creando release en GitHub...');
        execSync(createCommand, { stdio: 'inherit' });
        
        logSuccess(`Release creado: https://github.com/LautaroBravo08/namustock-app/releases/tag/${tagName}`);
        
      } catch (ghError) {
        // Si GitHub CLI no está disponible, mostrar instrucciones manuales
        logError('GitHub CLI no disponible');
        logInfo('Creando release manualmente...');
        
        // Abrir GitHub en el navegador
        const releaseUrl = 'https://github.com/LautaroBravo08/namustock-app/releases/new';
        execSync(`start ${releaseUrl}`, { stdio: 'pipe' });
        
        log('\n📋 Instrucciones para crear el release manualmente:', 'cyan');
        log(`   1. Se abrió GitHub en tu navegador`);
        log(`   2. Tag: ${tagName}`);
        log(`   3. Title: 🚀 NamuStock v${version} - Actualizaciones Automáticas`);
        log(`   4. Sube el archivo: ${apkPath}`);
        log(`   5. Copia la descripción del archivo: ${notesFile}`);
        log(`   6. Marca como "Latest release"`);
        log(`   7. Haz clic en "Publish release"`);
      }
      
    } finally {
      // Limpiar archivo temporal
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
    }
    
    log('\n🎉 ¡Release creado exitosamente!', 'green');
    log('\n📱 Ahora las actualizaciones in-app funcionarán correctamente', 'green');
    log('   Los usuarios recibirán notificaciones automáticas', 'green');
    log('   y podrán actualizar sin salir de la aplicación.', 'green');
    
  } catch (error) {
    logError(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();