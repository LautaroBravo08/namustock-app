#!/usr/bin/env node

/**
 * Script para crear releases manuales (sin GitHub CLI)
 * Uso: node scripts/manual-release.js [patch|minor|major]
 */

const fs = require('fs');
const path = require('path');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    warning: '\x1b[33m',
    error: '\x1b[31m',
    bright: '\x1b[1m'
  };
  const reset = '\x1b[0m';
  console.log(`${colors[type]}${message}${reset}`);
}

function getCurrentVersion() {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  return packageJson.version;
}

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

function updatePackageVersion(newVersion) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  log(`📦 Versión actualizada a ${newVersion}`, 'success');
}

function updateVersionJson(newVersion) {
  const versionInfo = {
    version: newVersion,
    buildDate: new Date().toISOString(),
    platform: 'android',
    features: [
      'Mejoras en el sistema de actualizaciones',
      'Corrección de errores menores',
      'Optimizaciones de rendimiento'
    ],
    releaseNotes: `Versión ${newVersion} - Nuevas funcionalidades y mejoras`,
    downloads: {
      android: `https://github.com/tu-usuario/tu-repo/releases/download/v${newVersion}/app-release.apk`,
      ios: `https://github.com/tu-usuario/tu-repo/releases/download/v${newVersion}/app-release.ipa`
    },
    baseUrl: 'https://github.com/tu-usuario/tu-repo'
  };
  
  fs.writeFileSync('public/version.json', JSON.stringify(versionInfo, null, 2));
  log(`📄 version.json actualizado`, 'success');
}

function createReleaseInstructions(version) {
  const instructions = `# 🚀 Instrucciones para Release v${version}

## Pasos a seguir:

### 1. Compilar la aplicación
\`\`\`bash
npm run build
npx cap sync android
npx cap build android --prod
\`\`\`

### 2. Crear repositorio en GitHub (si no existe)
1. Ve a https://github.com/new
2. Crea un repositorio llamado "namustock-app" (o el nombre que prefieras)
3. Sigue las instrucciones para conectar tu proyecto local

### 3. Subir código a GitHub
\`\`\`bash
git add .
git commit -m "chore: release v${version}"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
\`\`\`

### 4. Crear release en GitHub
1. Ve a tu repositorio en GitHub
2. Haz clic en "Releases" (en la barra lateral derecha)
3. Haz clic en "Create a new release"
4. En "Tag version" escribe: \`v${version}\`
5. En "Release title" escribe: \`Versión ${version}\`
6. En "Describe this release" escribe:
   \`\`\`
   ## Versión ${version}
   
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
   \`\`\`

### 5. Subir APK al release
1. En la sección "Attach binaries" del release
2. Arrastra el archivo APK desde: \`android/app/build/outputs/apk/release/app-release.apk\`
3. Haz clic en "Publish release"

### 6. Actualizar configuración
Edita el archivo \`.env.production\` y actualiza:
\`\`\`env
REACT_APP_GITHUB_REPO=TU-USUARIO/TU-REPO
\`\`\`

### 7. Verificar funcionamiento
1. Compila la app con la nueva configuración: \`npm run build\`
2. Sincroniza: \`npx cap sync android\`
3. Ejecuta en Android: \`npx cap run android\`
4. Prueba el botón "Comprobar actualizaciones"

## 🎉 ¡Listo!
Tu aplicación ahora puede verificar actualizaciones desde GitHub Releases.

## Próximas actualizaciones
Para futuras versiones, repite los pasos 1, 3, 4 y 5.
`;

  fs.writeFileSync(`RELEASE-v${version}-INSTRUCTIONS.md`, instructions);
  log(`📋 Instrucciones creadas: RELEASE-v${version}-INSTRUCTIONS.md`, 'success');
}

async function createManualRelease(versionType = 'patch') {
  try {
    log('🚀 Creando release manual...', 'bright');
    
    const currentVersion = getCurrentVersion();
    const newVersion = incrementVersion(currentVersion, versionType);
    
    log(`📦 Versión actual: ${currentVersion}`, 'info');
    log(`📦 Nueva versión: ${newVersion}`, 'info');
    
    // Actualizar package.json
    updatePackageVersion(newVersion);
    
    // Actualizar version.json
    updateVersionJson(newVersion);
    
    // Crear instrucciones
    createReleaseInstructions(newVersion);
    
    log(`\\n🎉 Release v${newVersion} preparado!`, 'success');
    log(`📋 Lee las instrucciones en: RELEASE-v${newVersion}-INSTRUCTIONS.md`, 'warning');
    log(`\\n🔗 Próximos pasos:`, 'bright');
    log(`1. Sigue las instrucciones del archivo creado`, 'info');
    log(`2. Crea el repositorio en GitHub`, 'info');
    log(`3. Sube el código y crea el release`, 'info');
    log(`4. Actualiza .env.production con tu repositorio`, 'info');
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Procesar argumentos
const versionType = process.argv[2] || 'patch';
if (!['patch', 'minor', 'major'].includes(versionType)) {
  log('❌ Tipo de versión inválido. Usa: patch, minor, o major', 'error');
  process.exit(1);
}

createManualRelease(versionType);