#!/usr/bin/env node

/**
 * Script para crear releases automáticos en GitHub
 * Uso: node scripts/create-release.js [patch|minor|major]
 */

const { execSync } = require('child_process');
const fs = require('fs');

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

function updateVersion(type = 'patch') {
  console.log(`🔄 Actualizando versión (${type})...`);
  
  // Usar nuestro script personalizado que actualiza TODOS los archivos
  execSync(`node update-version.js ${type}`, { stdio: 'inherit' });
  
  return getCurrentVersion();
}

async function createRelease(versionType = 'patch') {
  try {
    console.log('🚀 Iniciando proceso de release...');
    
    // 1. Actualizar versión
    const newVersion = updateVersion(versionType);
    console.log(`📦 Nueva versión: ${newVersion}`);
    
    // 2. Compilar aplicación web
    console.log('🔨 Compilando aplicación web...');
    execSync('npm run build', { stdio: 'inherit' });
    
    // 3. Sincronizar con Capacitor
    console.log('🔄 Sincronizando con Capacitor...');
    execSync('npx cap sync', { stdio: 'inherit' });
    
    // 4. Compilar APK para Android
    console.log('📱 Compilando APK para Android...');
    try {
      // Usar gradlew para compilar el APK (Windows usa .bat)
      const gradlewCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
      console.log('🔄 Intentando compilar APK de release...');
      execSync(`cd android && ${gradlewCmd} clean assembleRelease`, { stdio: 'inherit' });
      console.log('✅ APK de release compilado exitosamente');
    } catch (error) {
      console.log('⚠️ Error compilando APK de release, compilando APK de debug...');
      try {
        execSync(`cd android && ${gradlewCmd} clean assembleDebug`, { stdio: 'inherit' });
        console.log('✅ APK de debug compilado exitosamente');
      } catch (debugError) {
        console.log('❌ Error compilando APK de debug también');
      }
    }
    
    // 5. Crear commit y tag manualmente
    console.log('📝 Creando commit y tag...');
    try {
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "🚀 Release v${newVersion}"`, { stdio: 'inherit' });
      execSync(`git tag -a v${newVersion} -m "Release version ${newVersion}"`, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error creando commit/tag, continuando...');
    }
    
    // 6. Push cambios
    console.log('🏷️ Subiendo cambios a Git...');
    try {
      // Detectar la rama principal actual
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      console.log(`📍 Rama actual: ${currentBranch}`);
      execSync(`git push origin ${currentBranch}`, { stdio: 'inherit' });
      execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error subiendo cambios a Git, continuando...');
    }
    
    // 7. Crear release en GitHub usando GitHub CLI
    console.log('🐙 Creando release en GitHub...');
    const releaseNotes = `## Versión ${newVersion}

### ✨ Nuevas funcionalidades
- Mejoras en el sistema de actualizaciones
- Optimizaciones de rendimiento

### 🐛 Correcciones
- Corrección de errores menores
- Mejoras de estabilidad

### 📱 Instalación Android
1. Descarga el archivo APK
2. Habilita "Fuentes desconocidas" en tu dispositivo
3. Instala la aplicación

### 🔄 Actualización
- Los usuarios existentes recibirán una notificación de actualización
- La actualización se puede verificar manualmente desde el menú de usuario`;

    execSync(`gh release create v${newVersion} --title "Versión ${newVersion}" --notes "${releaseNotes}"`, { stdio: 'inherit' });
    
    // 8. Subir APK al release (si existe)
    const apkPaths = [
      'android/app/build/outputs/apk/release/app-release.apk',
      'android/app/build/outputs/apk/release/app-release-unsigned.apk',
      'android/app/build/outputs/apk/debug/app-debug.apk'
    ];
    
    let apkFound = false;
    for (const apkPath of apkPaths) {
      if (fs.existsSync(apkPath)) {
        console.log(`📤 Subiendo APK al release: ${apkPath}`);
        execSync(`gh release upload v${newVersion} "${apkPath}"`, { stdio: 'inherit' });
        console.log('✅ APK subido exitosamente');
        apkFound = true;
        break;
      }
    }
    
    if (!apkFound) {
      console.log('⚠️ APK no encontrado en ninguna ubicación esperada');
      console.log('📍 Ubicaciones verificadas:');
      apkPaths.forEach(path => console.log(`   - ${path}`));
    }
    
    console.log(`\n🎉 Release v${newVersion} creado exitosamente!`);
    console.log(`🔗 https://github.com/${process.env.GITHUB_REPOSITORY || 'tu-usuario/tu-repo'}/releases/tag/v${newVersion}`);
    
  } catch (error) {
    console.error('❌ Error creando release:', error.message);
    process.exit(1);
  }
}

// Procesar argumentos
const versionType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(versionType)) {
  console.error('❌ Tipo de versión inválido. Usa: patch, minor, o major');
  process.exit(1);
}

createRelease(versionType);
