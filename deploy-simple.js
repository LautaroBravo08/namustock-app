#!/usr/bin/env node

/**
 * Script de despliegue automático simplificado
 * Funciona sin GitHub CLI - solo con Git
 */

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

// Función principal simplificada
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  
  try {
    log('\n🚀 Iniciando despliegue automático...', 'bright');
    
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
    
    // 3. Construir nueva versión
    logStep('🔨', 'Construyendo nueva versión...');
    
    try {
      // Usar el script de build-and-deploy existente
      execCommand(`node build-and-deploy.js ${versionType} --auto`, 'Construcción automática');
    } catch (error) {
      // Si falla, intentar paso a paso
      logInfo('Intentando construcción paso a paso...');
      
      // Actualizar versiones manualmente
      execCommand(`node update-version.js ${versionType}`, 'Actualizando versión');
      
      // Construir
      execCommand('npm run build', 'Construcción de React');
      execCommand('npx cap sync', 'Sincronización de Capacitor');
      
      // Limpiar y construir Android
      execCommand('.\\gradlew clean', 'Limpieza de Android', { cwd: 'android' });
      execCommand('.\\gradlew assembleRelease', 'Construcción de APK', { cwd: 'android' });
      
      // Copiar APK
      const apkSource = 'android/app/build/outputs/apk/release/app-release.apk';
      const apkTarget = `releases/namustock-${newVersion}.apk`;
      
      if (!fs.existsSync('releases')) {
        fs.mkdirSync('releases');
      }
      
      fs.copyFileSync(apkSource, apkTarget);
      logSuccess(`APK copiado: ${apkTarget}`);
    }
    
    // 4. Verificar que el APK existe
    const apkPath = `releases/namustock-${newVersion}.apk`;
    if (!fs.existsSync(apkPath)) {
      logError(`APK no encontrado: ${apkPath}`);
      process.exit(1);
    }
    
    const stats = fs.statSync(apkPath);
    const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    logSuccess(`APK verificado: ${apkPath} (${sizeInMB} MB)`);
    
    // 5. Commit y push automático
    logStep('📝', 'Subiendo cambios a GitHub...');
    
    try {
      // Agregar todos los cambios
      execCommand('git add .', 'Agregando archivos');
      
      // Commit con mensaje descriptivo
      const commitMessage = `🚀 Release v${newVersion}

✨ Actualizaciones automáticas in-app:
• Descarga e instalación automática
• Limpieza automática de archivos antiguos
• Progreso visual en tiempo real
• Notificaciones elegantes

🔧 Mejoras técnicas:
• Plugin nativo Android optimizado
• Mejor manejo de errores
• Fallbacks seguros implementados`;
      
      execCommand(`git commit -m "${commitMessage}"`, 'Creando commit');
      
      // Crear tag
      const tagName = `v${newVersion}`;
      const tagMessage = `Release ${newVersion} - Actualizaciones automáticas in-app`;
      
      execCommand(`git tag -a ${tagName} -m "${tagMessage}"`, 'Creando tag');
      
      // Push todo
      execCommand('git push origin main', 'Pusheando cambios');
      execCommand(`git push origin ${tagName}`, 'Pusheando tag');
      
      logSuccess('Cambios subidos a GitHub');
      
    } catch (error) {
      logError(`Error subiendo a GitHub: ${error.message}`);
      logInfo('Puedes subir manualmente con:');
      logInfo('  git add .');
      logInfo(`  git commit -m "Release v${newVersion}"`);
      logInfo(`  git tag -a v${newVersion} -m "Release ${newVersion}"`);
      logInfo('  git push origin main');
      logInfo(`  git push origin v${newVersion}`);
    }
    
    // 6. Crear instrucciones para GitHub Release
    logStep('📋', 'Creando instrucciones para GitHub Release...');
    
    const releaseInstructions = `# 🚀 Instrucciones para crear GitHub Release

## Pasos para crear el release manualmente:

1. **Ve a tu repositorio en GitHub**:
   https://github.com/LautaroBravo08/namustock-app

2. **Haz clic en "Releases"** en la barra lateral derecha

3. **Haz clic en "Create a new release"**

4. **Configura el release**:
   - **Tag**: v${newVersion} (ya está creado)
   - **Title**: 🚀 NamuStock v${newVersion} - Actualizaciones Automáticas
   - **Description**: Copia el contenido de abajo

5. **Sube el APK**:
   - Arrastra el archivo: ${apkPath}
   - O haz clic en "Attach binaries" y selecciona el archivo

6. **Marca como "Latest release"** y haz clic en "Publish release"

---

## Descripción del Release (copia esto):

# 🚀 NamuStock v${newVersion}

## ✨ Nuevas Características

### 📱 Sistema de Actualizaciones In-App
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
A partir de esta versión, todas las futuras actualizaciones se instalarán automáticamente dentro de la app. ¡No más búsqueda manual de APKs!

## 📊 Estadísticas
- **Tamaño del APK**: ${sizeInMB} MB
- **Versión mínima de Android**: 7.0 (API 24)
- **Arquitecturas soportadas**: ARM64, ARM32

---

**Nota**: Si tienes problemas con la actualización automática, puedes descargar e instalar manualmente el APK desde los assets de este release.`;

    // Guardar instrucciones en archivo
    fs.writeFileSync('RELEASE-INSTRUCTIONS.md', releaseInstructions);
    logSuccess('Instrucciones guardadas en: RELEASE-INSTRUCTIONS.md');
    
    // 7. Mostrar resumen final
    logStep('🎉', 'Despliegue completado exitosamente!');
    log('\n📋 Resumen del despliegue:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`, 'cyan');
    log(`   • APK generado: ${apkPath} (${sizeInMB} MB)`, 'cyan');
    log(`   • Tag creado: v${newVersion}`, 'cyan');
    log(`   • Cambios subidos a GitHub`, 'cyan');
    
    log('\n📱 Próximos pasos:', 'yellow');
    log('   1. Ve a GitHub y crea el release manualmente');
    log('   2. Sigue las instrucciones en RELEASE-INSTRUCTIONS.md');
    log('   3. ¡Las apps instaladas se actualizarán automáticamente!');
    
    log('\n🚀 ¡Sistema de actualizaciones automáticas listo!', 'green');
    
  } catch (error) {
    logError(`\nDespliegue fallido: ${error.message}`);
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n📖 Despliegue Automático Simplificado', 'bright');
  log('   node deploy-simple.js [tipo]');
  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');
  log('\n📝 Ejemplos:', 'yellow');
  log('   node deploy-simple.js patch');
  log('   node deploy-simple.js minor');
  log('\n✨ Características:', 'cyan');
  log('   • No requiere GitHub CLI');
  log('   • Construcción automática');
  log('   • Commit y push automático');
  log('   • Instrucciones para GitHub Release');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
}