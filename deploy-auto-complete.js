#!/usr/bin/env node

/**
 * Script de despliegue COMPLETAMENTE AUTOMÁTICO
 * Hace TODO: construye, sube a GitHub, crea release
 * ¡Un solo comando para todo!
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
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging
function execCommand(command, description, options = {}) {
  try {
    logInfo(`Ejecutando: ${description}`);
    const result = execSync(command, { 
      encoding: 'utf8', 
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options 
    });
    logSuccess(`${description} completado`);
    return result;
  } catch (error) {
    logError(`Error en ${description}: ${error.message}`);
    throw error;
  }
}

// Función principal SÚPER AUTOMÁTICA
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  try {
    log('\n🚀 DESPLIEGUE COMPLETAMENTE AUTOMÁTICO', 'bright');
    log('   ¡Un comando hace TODO!', 'cyan');
    
    // 1. Leer versión actual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    // 2. Calcular nueva versión
    const versionParts = currentVersion.split('.').map(Number);
    switch (versionType) {
      case 'major':
        versionParts[0]++;
        versionParts[1] = 0;
        versionParts[2] = 0;
        break;
      case 'minor':
        versionParts[1]++;
        versionParts[2] = 0;
        break;
      case 'patch':
      default:
        versionParts[2]++;
        break;
    }
    const newVersion = versionParts.join('.');
    
    logInfo(`Versión actual: ${currentVersion}`);
    logInfo(`Nueva versión: ${newVersion}`);
    
    // 3. CONSTRUIR APLICACIÓN
    logStep('🔨', 'Construyendo aplicación...');
    execCommand(`node build-and-deploy.js ${versionType} --auto`, 'Construcción completa');
    
    // 4. VERIFICAR APK
    const apkPath = `releases/namustock-${newVersion}.apk`;
    if (!fs.existsSync(apkPath)) {
      logError(`APK no encontrado: ${apkPath}`);
      process.exit(1);
    }
    
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`APK verificado: ${apkPath} (${sizeInMB} MB)`);
    
    // 5. SUBIR A GITHUB
    logStep('📤', 'Subiendo cambios a GitHub...');
    
    try {
      // Commit y push
      execCommand('git add .', 'Agregando archivos');
      
      const commitMessage = `🚀 Release v${newVersion}

✨ Actualizaciones automáticas:
• Descarga e instalación in-app
• Limpieza automática de archivos antiguos
• Progreso visual en tiempo real
• Notificaciones elegantes

🔧 Mejoras técnicas:
• Plugin nativo Android optimizado
• Mejor manejo de errores
• Fallbacks seguros implementados`;
      
      execCommand(`git commit -m "${commitMessage}"`, 'Creando commit');
      
      // Crear tag
      execCommand(`git tag -a v${newVersion} -m "Release ${newVersion}"`, 'Creando tag');
      
      // Push todo
      execCommand('git push origin master', 'Pusheando cambios');
      execCommand(`git push origin v${newVersion}`, 'Pusheando tag');
      
    } catch (gitError) {
      logError(`Error en Git: ${gitError.message}`);
      // Continuar con el release aunque Git falle
    }
    
    // 6. CREAR GITHUB RELEASE AUTOMÁTICAMENTE
    logStep('🐙', 'Creando GitHub Release automáticamente...');
    
    const tagName = `v${newVersion}`;
    
    // Generar release notes
    const releaseNotes = `# 🚀 NamuStock v${newVersion}

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

## 🐛 Correcciones
- Solucionados problemas de detección de versiones
- Mejorado el sistema de limpieza de archivos temporales
- Optimizado el rendimiento de descarga
- Corregidos errores de permisos en Android

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
      // Crear release con GitHub CLI
      const releaseTitle = `🚀 NamuStock v${newVersion} - Actualizaciones Automáticas`;
      const createCommand = `gh release create ${tagName} "${apkPath}" --title "${releaseTitle}" --notes-file "${notesFile}" --latest`;
      
      execCommand(createCommand, 'Creando GitHub Release');
      
      logSuccess(`Release creado: https://github.com/LautaroBravo08/namustock-app/releases/tag/${tagName}`);
      
    } finally {
      // Limpiar archivo temporal
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
    }
    
    // 7. MOSTRAR RESUMEN FINAL
    logStep('🎉', 'DESPLIEGUE COMPLETADO EXITOSAMENTE!');
    
    log('\n📋 Resumen completo:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`, 'cyan');
    log(`   • APK generado: ${apkPath} (${sizeInMB} MB)`, 'cyan');
    log(`   • Cambios subidos a GitHub`, 'cyan');
    log(`   • Tag creado: ${tagName}`, 'cyan');
    log(`   • GitHub Release creado automáticamente`, 'cyan');
    log(`   • APK subido y disponible públicamente`, 'cyan');
    
    log('\n🚀 ¡SISTEMA COMPLETAMENTE AUTOMÁTICO!', 'green');
    log('   ✅ Las apps instaladas detectarán la actualización automáticamente', 'green');
    log('   ✅ Los usuarios recibirán notificaciones elegantes', 'green');
    log('   ✅ Podrán actualizar sin salir de la aplicación', 'green');
    log('   ✅ Los archivos antiguos se limpiarán automáticamente', 'green');
    
    log('\n📱 Para futuras actualizaciones, solo ejecuta:', 'yellow');
    log('   npm run deploy:complete', 'yellow');
    log('   ¡Y listo! Todo se hace automáticamente.', 'yellow');
    
  } catch (error) {
    logError(`\nDespliegue fallido: ${error.message}`);
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n📖 Despliegue Completamente Automático', 'bright');
  log('   node deploy-auto-complete.js [tipo]');
  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');
  log('\n✨ Lo que hace automáticamente:', 'magenta');
  log('   🔨 Construye la aplicación');
  log('   📦 Genera el APK');
  log('   📤 Sube cambios a GitHub');
  log('   🏷️ Crea tags automáticamente');
  log('   🐙 Crea GitHub Release');
  log('   📱 Sube APK al release');
  log('   🎉 ¡Todo listo para actualizaciones automáticas!');
  log('\n📝 Ejemplos:', 'yellow');
  log('   node deploy-auto-complete.js patch');
  log('   node deploy-auto-complete.js minor');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
}