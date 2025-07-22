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
  execSync(`npm version ${type}`, { stdio: 'inherit' });
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
      execSync('npx cap build android --prod', { stdio: 'inherit' });
    } catch (error) {
      console.log('⚠️ Error compilando APK, continuando...');
    }
    
    // 5. Push cambios (npm version ya creó el commit y tag)
    console.log('🏷️ Subiendo cambios a Git...');
    execSync(`git push origin master`, { stdio: 'inherit' });
    execSync(`git push origin v${newVersion}`, { stdio: 'inherit' });
    
    // 6. Crear release en GitHub usando GitHub CLI
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
    
    // 7. Subir APK al release (si existe)
    const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
    if (fs.existsSync(apkPath)) {
      console.log('📤 Subiendo APK al release...');
      execSync(`gh release upload v${newVersion} ${apkPath}`, { stdio: 'inherit' });
      console.log('✅ APK subido exitosamente');
    } else {
      console.log('⚠️ APK no encontrado, saltando subida');
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
