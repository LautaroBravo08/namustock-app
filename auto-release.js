#!/usr/bin/env node

/**
 * Script de release automático completo
 * Hace TODO: build, commit, tag, push, GitHub release
 * Uso: node auto-release.js [patch|minor|major]
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

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging
function execCommand(command, description) {
  try {
    logInfo(`Ejecutando: ${description}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    logSuccess(`${description} completado`);
    return result;
  } catch (error) {
    logError(`Error en ${description}: ${error.message}`);
    throw error;
  }
}

// Función principal
async function main() {
  const versionType = process.argv[2] || 'patch';
  
  try {
    log('\n🚀 RELEASE AUTOMÁTICO COMPLETO', 'bright');
    log(`   Tipo de versión: ${versionType}`, 'cyan');
    
    // 1. Deshabilitar simulación por si acaso
    logStep('🔧', 'Deshabilitando simulación...');
    execCommand('node test-android-updates.js disable', 'Deshabilitar simulación');
    
    // 2. Leer versión actual
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const currentVersion = packageJson.version;
    
    // 3. Calcular nueva versión
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
    
    // 4. Build y deploy
    logStep('🔨', 'Construyendo aplicación...');
    execCommand(`node build-and-deploy.js ${versionType} --clean --auto`, 'Build y deploy automático');
    
    // 5. Verificar que el APK se generó
    const apkPath = `releases/namustock-${newVersion}.apk`;
    if (!fs.existsSync(apkPath)) {
      throw new Error(`APK no encontrado: ${apkPath}`);
    }
    
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`APK verificado: ${apkPath} (${sizeInMB} MB)`);
    
    // 6. Git add, commit y tag
    logStep('📝', 'Creando commit y tag...');
    execCommand('git add .', 'Agregando archivos');
    
    const commitMessage = `🚀 Release v${newVersion}

✨ Actualización automática ${versionType}:
• Versión incrementada: ${currentVersion} → ${newVersion}
• APK generado: ${sizeInMB} MB
• Sistema de actualizaciones optimizado
• Limpieza automática de archivos antiguos

🔧 Mejoras técnicas:
• Build automático con limpieza
• Sincronización de versiones
• Detección robusta de actualizaciones`;
    
    execCommand(`git commit -m "${commitMessage}"`, 'Creando commit');
    execCommand(`git tag -a v${newVersion} -m "Release v${newVersion}"`, 'Creando tag');
    
    // 7. Push a GitHub
    logStep('📤', 'Subiendo a GitHub...');
    execCommand('git push origin master', 'Push commits');
    execCommand(`git push origin v${newVersion}`, 'Push tag');
    
    // 8. Crear GitHub Release
    logStep('🐙', 'Creando GitHub Release...');
    
    // Crear release notes
    const releaseNotes = `# 🚀 NamuStock v${newVersion}

## ✨ Actualización ${versionType.toUpperCase()}

### 📱 Nuevas Características
- **Versión actualizada**: ${currentVersion} → ${newVersion}
- **APK optimizado**: ${sizeInMB} MB
- **Sistema de actualizaciones mejorado**
- **Limpieza automática** de archivos antiguos

### 🔧 Mejoras Técnicas
- Build automático con limpieza previa
- Sincronización perfecta de versiones
- Detección robusta de actualizaciones
- Proceso de instalación optimizado

## 📦 Instalación

### Para Nuevos Usuarios
1. Descarga el APK desde los assets de este release
2. Habilita "Instalar apps desconocidas" en Android
3. Instala el APK descargado

### Para Usuarios Existentes
¡Actualización automática disponible! 🎉
- La app detectará esta nueva versión automáticamente
- Proceso de instalación fluido y confiable
- Limpieza automática de archivos antiguos

## 📊 Estadísticas
- **Tamaño del APK**: ${sizeInMB} MB
- **Versión mínima de Android**: 7.0 (API 24)
- **Arquitecturas soportadas**: ARM64, ARM32

---

**Nota**: Actualización generada automáticamente con sistema optimizado.`;

    // Guardar release notes temporalmente
    const notesFile = 'temp-release-notes.md';
    fs.writeFileSync(notesFile, releaseNotes);
    
    try {
      // Crear release con GitHub CLI
      const releaseTitle = `NamuStock v${newVersion} - Actualizacion ${versionType}`;
      execCommand(
        `gh release create v${newVersion} "${apkPath}" --title "${releaseTitle}" --notes-file "${notesFile}" --latest`,
        'Creando GitHub Release'
      );
      
      logSuccess(`Release creado: https://github.com/LautaroBravo08/namustock-app/releases/tag/v${newVersion}`);
      
    } finally {
      // Limpiar archivo temporal
      if (fs.existsSync(notesFile)) {
        fs.unlinkSync(notesFile);
      }
    }
    
    // 9. Verificación final
    logStep('✅', 'Verificación final...');
    execCommand('node test-android-updates.js version', 'Verificar versiones');
    
    // 10. Resumen final
    logStep('🎉', 'RELEASE COMPLETADO EXITOSAMENTE!');
    
    log('\n📋 Resumen completo:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`, 'cyan');
    log(`   • APK: ${apkPath} (${sizeInMB} MB)`, 'cyan');
    log(`   • Commit y tag creados`, 'cyan');
    log(`   • Subido a GitHub`, 'cyan');
    log(`   • Release público creado`, 'cyan');
    log(`   • APK disponible para descarga`, 'cyan');
    
    log('\n🚀 ¡Las apps instaladas detectarán la actualización automáticamente!', 'green');
    log(`🔗 Release: https://github.com/LautaroBravo08/namustock-app/releases/tag/v${newVersion}`, 'green');
    
    log('\n📱 Para futuras actualizaciones:', 'yellow');
    log(`   npm run release:patch   # ${newVersion} → ${versionParts[0]}.${versionParts[1]}.${versionParts[2] + 1}`, 'yellow');
    log(`   npm run release:minor   # ${newVersion} → ${versionParts[0]}.${versionParts[1] + 1}.0`, 'yellow');
    log(`   npm run release:major   # ${newVersion} → ${versionParts[0] + 1}.0.0`, 'yellow');
    
  } catch (error) {
    logError(`\nRelease fallido: ${error.message}`);
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n📖 Release Automático Completo', 'bright');
  log('   node auto-release.js [tipo]');
  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');
  log('\n✨ Lo que hace automáticamente:', 'cyan');
  log('   🔧 Deshabilita simulación');
  log('   🔨 Construye la aplicación');
  log('   📦 Genera el APK');
  log('   📝 Crea commit y tag');
  log('   📤 Sube a GitHub');
  log('   🐙 Crea GitHub Release');
  log('   📱 Sube APK al release');
  log('   ✅ Verifica todo el proceso');
  log('\n📝 Ejemplos:', 'yellow');
  log('   node auto-release.js patch');
  log('   node auto-release.js minor');
  log('   node auto-release.js major');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
}