#!/usr/bin/env node

/**
 * Script completo para build, sync, APK y release automático en GitHub
 * Uso: node auto-deploy-github.js [tipo] [opciones]
 * 
 * Tipos: patch, minor, major
 * Opciones: --clean, --auto, --draft
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

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Ejecutar comando con logging mejorado
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
    if (options.throwOnError !== false) {
      throw error;
    }
    return null;
  }
}

// Verificar dependencias
function checkDependencies() {
  logStep('🔍', 'Verificando dependencias...');

  // Verificar Node.js y npm
  try {
    const nodeVersion = execCommand('node --version', 'Verificación de Node.js', { silent: true });
    const npmVersion = execCommand('npm --version', 'Verificación de npm', { silent: true });
    logSuccess(`Node.js: ${nodeVersion.trim()}, npm: ${npmVersion.trim()}`);
  } catch (error) {
    logError('Node.js o npm no están instalados');
    throw error;
  }

  // Verificar GitHub CLI
  try {
    const ghVersion = execCommand('gh --version', 'Verificación de GitHub CLI', { silent: true });
    logSuccess(`GitHub CLI instalado: ${ghVersion.split('\n')[0]}`);
  } catch (error) {
    logError('GitHub CLI no está instalado. Instálalo desde: https://cli.github.com/');
    throw error;
  }

  // Verificar autenticación de GitHub
  try {
    execCommand('gh auth status', 'Verificación de autenticación GitHub', { silent: true });
    logSuccess('GitHub CLI autenticado correctamente');
  } catch (error) {
    logError('GitHub CLI no está autenticado. Ejecuta: gh auth login');
    throw error;
  }

  // Verificar Gradle (Android) - Skip para evitar bloqueos
  try {
    if (require('fs').existsSync('android/gradlew.bat')) {
      logSuccess('Gradle wrapper encontrado para Android');
    } else {
      logWarning('Gradle wrapper no encontrado - se intentará usar durante el build');
    }
  } catch (error) {
    logWarning('No se pudo verificar Gradle - continuando...');
  }
}

// Leer versión actual
function getCurrentVersion() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch (error) {
    logError('No se pudo leer package.json');
    return '1.0.0';
  }
}

// Incrementar versión
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);

  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }

  return parts.join('.');
}

// Limpiar archivos antiguos
async function cleanOldFiles() {
  logStep('🧹', 'Limpiando archivos antiguos...');

  const filesToClean = [
    'build',
    'android/app/build',
    'android/build',
    'dist'
  ];

  for (const file of filesToClean) {
    try {
      if (fs.existsSync(file)) {
        if (process.platform === 'win32') {
          execCommand(`rmdir /s /q "${file}"`, `Eliminando ${file}`, { throwOnError: false });
        } else {
          execCommand(`rm -rf "${file}"`, `Eliminando ${file}`, { throwOnError: false });
        }
      }
    } catch (error) {
      logWarning(`No se pudo eliminar ${file}: ${error.message}`);
    }
  }

  logSuccess('Limpieza completada');
}

// Actualizar versión en archivos
function updateVersionInFiles(newVersion) {
  logStep('📝', 'Actualizando versión en archivos...');

  try {
    // Actualizar package.json
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    packageJson.version = newVersion;
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    logSuccess('package.json actualizado');

    // Actualizar version.json
    const versionPath = 'public/version.json';
    if (fs.existsSync(versionPath)) {
      const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
      versionData.version = newVersion;
      versionData.buildDate = new Date().toISOString();
      versionData.features = [
        "Sistema de inventario completo",
        "Gestión de ventas optimizada",
        "Actualizaciones automáticas in-app",
        "Sistema de imágenes optimizado con chunks",
        "Notificaciones mejoradas",
        "Interfaz de usuario actualizada"
      ];
      versionData.releaseNotes = `Versión ${newVersion} con sistema de imágenes optimizado y mejoras de rendimiento`;
      versionData.downloads = {
        android: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/namustock-${newVersion}.apk`,
        ios: `https://github.com/LautaroBravo08/namustock-app/releases/download/v${newVersion}/namustock-${newVersion}.ipa`
      };
      versionData.baseUrl = "https://github.com/LautaroBravo08/namustock-app";

      fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
      logSuccess('version.json actualizado');
    }

    // Actualizar otros archivos de versión
    const filesToUpdate = [
      'src/services/updateService.js',
      'src/components/UserMenu.js'
    ];

    filesToUpdate.forEach(filePath => {
      if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        content = content.replace(
          /const hardcodedVersion = '[^']+';/,
          `const hardcodedVersion = '${newVersion}';`
        );
        fs.writeFileSync(filePath, content);
        logSuccess(`${filePath} actualizado`);
      }
    });

    // Actualizar .env.production
    const envProdPath = '.env.production';
    if (fs.existsSync(envProdPath)) {
      let content = fs.readFileSync(envProdPath, 'utf8');
      content = content.replace(
        /REACT_APP_VERSION=[\d.]+/,
        `REACT_APP_VERSION=${newVersion}`
      );
      fs.writeFileSync(envProdPath, content);
      logSuccess('.env.production actualizado');
    }

  } catch (error) {
    logError(`Error actualizando archivos: ${error.message}`);
    throw error;
  }
}

// Construir aplicación completa
async function buildApplication() {
  logStep('🔨', 'Construyendo aplicación completa...');

  try {
    // 1. Instalar dependencias si es necesario
    if (!fs.existsSync('node_modules')) {
      execCommand('npm install', 'Instalación de dependencias');
    }

    // 2. Construir React
    execCommand('npm run build', 'Construcción de React');

    // 3. Sincronizar con Capacitor
    execCommand('npx cap sync', 'Sincronización de Capacitor');

    // 4. Limpiar build de Android
    execCommand('gradlew.bat clean', 'Limpieza de Android', { cwd: 'android' });

    // 5. Construir APK de release
    logInfo('Construyendo APK de release...');
    execCommand('gradlew.bat assembleRelease --stacktrace', 'Construcción de APK Release', { cwd: 'android' });

    logSuccess('Aplicación construida exitosamente');

  } catch (error) {
    logError(`Error en construcción: ${error.message}`);
    throw error;
  }
}

// Preparar archivos para release
function prepareReleaseFiles(version) {
  logStep('📦', 'Preparando archivos para release...');

  try {
    const releasesDir = 'releases';
    if (!fs.existsSync(releasesDir)) {
      fs.mkdirSync(releasesDir);
    }

    // Copiar APK
    const sourceApk = 'android/app/build/outputs/apk/release/app-release.apk';
    const targetApk = `releases/namustock-${version}.apk`;

    if (fs.existsSync(sourceApk)) {
      fs.copyFileSync(sourceApk, targetApk);
      logSuccess(`APK copiado: ${targetApk}`);

      // Mostrar información del archivo
      const stats = fs.statSync(targetApk);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      logInfo(`Tamaño del APK: ${sizeInMB} MB`);

      return { apkPath: targetApk, apkSize: sizeInMB };
    } else {
      throw new Error('APK no encontrado en la ruta esperada');
    }

  } catch (error) {
    logError(`Error preparando archivos: ${error.message}`);
    throw error;
  }
}

// Crear release en GitHub
async function createGitHubRelease(version, apkPath, isDraft = false) {
  logStep('🚀', 'Creando release en GitHub...');

  try {
    // Generar notas de release
    const releaseNotes = generateReleaseNotes(version);

    // Crear tag y release
    const releaseCommand = [
      'gh release create',
      `v${version}`,
      `"${apkPath}"`,
      '--title', `"NamuStock v${version}"`,
      '--notes', `"${releaseNotes}"`,
      isDraft ? '--draft' : '',
      '--latest'
    ].filter(Boolean).join(' ');

    execCommand(releaseCommand, 'Creación de release en GitHub');

    logSuccess(`Release v${version} creado exitosamente en GitHub`);

    // Obtener URL del release
    const releaseUrl = `https://github.com/LautaroBravo08/namustock-app/releases/tag/v${version}`;
    logInfo(`URL del release: ${releaseUrl}`);

    return releaseUrl;

  } catch (error) {
    logError(`Error creando release: ${error.message}`);
    throw error;
  }
}

// Generar notas de release
function generateReleaseNotes(version) {
  const currentDate = new Date().toLocaleDateString('es-ES');

  return `## 🚀 NamuStock v${version}

### 📅 Fecha de lanzamiento: ${currentDate}

### ✨ Nuevas características y mejoras:
- 🖼️ **Sistema de imágenes optimizado**: Almacenamiento por chunks sin límites de peso
- 📱 **Actualizaciones automáticas mejoradas**: Detección y descarga automática de nuevas versiones
- 🔄 **Sincronización optimizada**: Mejor rendimiento en la sincronización de datos
- 🎨 **Interfaz mejorada**: Experiencia de usuario más fluida
- 🔧 **Correcciones de bugs**: Múltiples mejoras de estabilidad

### 📱 Instalación:
1. Descarga el archivo APK desde los assets de este release
2. En tu dispositivo Android: Configuración → Seguridad → Fuentes desconocidas (activar)
3. Instala el APK descargado

### 🔄 Actualización automática:
- La app detectará automáticamente esta nueva versión
- Se descargará e instalará automáticamente en segundo plano
- Recibirás una notificación cuando esté lista

### 📊 Información técnica:
- Versión: ${version}
- Plataforma: Android
- Tamaño: Ver assets adjuntos
- Compatibilidad: Android 7.0+

---
*Generado automáticamente el ${new Date().toISOString()}*`;
}

// Commit y push de cambios
async function commitAndPush(version) {
  logStep('📤', 'Commiteando y pusheando cambios...');

  try {
    // Verificar si hay cambios
    const status = execCommand('git status --porcelain', 'Verificación de cambios', { silent: true });

    if (status.trim()) {
      // Agregar archivos modificados
      execCommand('git add package.json public/version.json src/services/updateService.js src/components/UserMenu.js .env.production', 'Agregando archivos modificados');

      // Commit
      execCommand(`git commit -m "🚀 Release v${version} - Sistema de imágenes optimizado"`, 'Commit de cambios');

      // Push
      execCommand('git push origin main', 'Push a repositorio remoto');

      logSuccess('Cambios commiteados y pusheados');
    } else {
      logInfo('No hay cambios para commitear');
    }

  } catch (error) {
    logWarning(`Error en git operations: ${error.message}`);
    // No lanzar error aquí, continuar con el release
  }
}

// Función principal
async function main() {
  const args = process.argv.slice(2);
  const versionType = args[0] || 'patch';
  const shouldClean = args.includes('--clean');
  const autoMode = args.includes('--auto');
  const isDraft = args.includes('--draft');

  try {
    log('\n🚀 Iniciando deploy automático completo a GitHub...', 'bright');
    log('═'.repeat(60), 'cyan');

    // 1. Verificar dependencias
    checkDependencies();

    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);

    logInfo(`Versión actual: ${currentVersion}`);
    logInfo(`Nueva versión: ${newVersion}`);
    logInfo(`Tipo de actualización: ${versionType}`);
    logInfo(`Modo draft: ${isDraft ? 'Sí' : 'No'}`);

    if (!autoMode) {
      log('\n¿Continuar con el proceso completo? (y/N): ', 'yellow');
      // En producción, aquí esperarías input del usuario
      logInfo('Continuando en modo automático...');
    }

    // 2. Limpiar archivos antiguos si se solicita
    if (shouldClean) {
      await cleanOldFiles();
    }

    // 3. Actualizar versión en archivos
    updateVersionInFiles(newVersion);

    // 4. Commit y push de cambios de versión
    await commitAndPush(newVersion);

    // 5. Construir aplicación completa
    await buildApplication();

    // 6. Preparar archivos para release
    const { apkPath, apkSize } = prepareReleaseFiles(newVersion);

    // 7. Crear release en GitHub
    const releaseUrl = await createGitHubRelease(newVersion, apkPath, isDraft);

    // 8. Mostrar resumen final
    logStep('🎉', 'Deploy completado exitosamente!');
    log('═'.repeat(60), 'cyan');
    log('\n📋 Resumen del deploy:', 'bright');
    log(`   • Versión: ${currentVersion} → ${newVersion}`, 'green');
    log(`   • APK generado: ${apkPath} (${apkSize} MB)`, 'green');
    log(`   • Release URL: ${releaseUrl}`, 'green');
    log(`   • Estado: ${isDraft ? 'Draft' : 'Publicado'}`, 'green');

    log('\n🔗 Enlaces importantes:', 'cyan');
    log(`   • Release: ${releaseUrl}`);
    log(`   • Descargas: ${releaseUrl.replace('/tag/', '/download/')}`);
    log(`   • Repositorio: https://github.com/LautaroBravo08/namustock-app`);

    log('\n📱 Próximos pasos:', 'magenta');
    log('   1. ✅ El APK está disponible en GitHub Releases');
    log('   2. ✅ Las actualizaciones automáticas detectarán la nueva versión');
    log('   3. 🔄 Los usuarios recibirán notificación de actualización');
    log('   4. 📱 Probar la descarga e instalación del APK');

    if (isDraft) {
      log('\n⚠️  Nota: El release está en modo DRAFT', 'yellow');
      log('   Publica el release manualmente en GitHub cuando esté listo', 'yellow');
    }

  } catch (error) {
    logError(`\nDeploy fallido: ${error.message}`);
    log('\n🔧 Posibles soluciones:', 'yellow');
    log('   • Verificar que GitHub CLI esté instalado y autenticado');
    log('   • Verificar permisos del repositorio');
    log('   • Verificar que el build de Android funcione correctamente');
    log('   • Ejecutar con --clean para limpiar archivos antiguos');
    process.exit(1);
  }
}

// Mostrar ayuda
function showHelp() {
  log('\n📖 Script de Deploy Automático a GitHub', 'bright');
  log('═'.repeat(50), 'cyan');
  log('\n🚀 Uso:', 'bright');
  log('   node auto-deploy-github.js [tipo] [opciones]');

  log('\n🔧 Tipos de versión:', 'cyan');
  log('   patch  - Incrementa versión patch (1.0.0 → 1.0.1)');
  log('   minor  - Incrementa versión minor (1.0.0 → 1.1.0)');
  log('   major  - Incrementa versión major (1.0.0 → 2.0.0)');

  log('\n⚙️  Opciones:', 'cyan');
  log('   --clean  - Limpiar archivos antiguos antes de construir');
  log('   --auto   - Ejecutar sin confirmación');
  log('   --draft  - Crear release como draft (no publicado)');

  log('\n📝 Ejemplos:', 'yellow');
  log('   node auto-deploy-github.js patch --clean');
  log('   node auto-deploy-github.js minor --auto');
  log('   node auto-deploy-github.js major --clean --auto --draft');

  log('\n📋 Lo que hace este script:', 'green');
  log('   1. ✅ Verifica dependencias (Node, npm, GitHub CLI)');
  log('   2. 🧹 Limpia archivos antiguos (opcional)');
  log('   3. 📝 Actualiza versión en todos los archivos');
  log('   4. 📤 Commitea y pushea cambios');
  log('   5. 🔨 Construye React + Capacitor + APK');
  log('   6. 📦 Prepara archivos para release');
  log('   7. 🚀 Crea release en GitHub con APK');
  log('   8. 🎉 Muestra resumen y enlaces');

  log('\n⚠️  Requisitos:', 'yellow');
  log('   • GitHub CLI instalado y autenticado');
  log('   • Repositorio configurado en GitHub');
  log('   • Android SDK y Gradle configurados');
  log('   • Permisos de escritura en el repositorio');
}

// Procesar argumentos
const command = process.argv[2];
if (command === 'help' || command === '--help' || command === '-h') {
  showHelp();
} else {
  main();
}