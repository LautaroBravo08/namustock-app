#!/usr/bin/env node

/**
 * Script para configurar actualizaciones con GitHub Releases
 * Uso: node scripts/setup-github-releases.js
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

function createReleaseScript() {
  const releaseScript = `#!/usr/bin/env node

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
  console.log(\`🔄 Actualizando versión (\${type})...\`);
  execSync(\`npm version \${type}\`, { stdio: 'inherit' });
  return getCurrentVersion();
}

async function createRelease(versionType = 'patch') {
  try {
    console.log('🚀 Iniciando proceso de release...');
    
    // 1. Actualizar versión
    const newVersion = updateVersion(versionType);
    console.log(\`📦 Nueva versión: \${newVersion}\`);
    
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
    
    // 5. Crear tag y push
    console.log('🏷️ Creando tag en Git...');
    execSync(\`git add .\`, { stdio: 'inherit' });
    execSync(\`git commit -m "chore: release v\${newVersion}"\`, { stdio: 'inherit' });
    execSync(\`git tag v\${newVersion}\`, { stdio: 'inherit' });
    execSync(\`git push origin main\`, { stdio: 'inherit' });
    execSync(\`git push origin v\${newVersion}\`, { stdio: 'inherit' });
    
    // 6. Crear release en GitHub usando GitHub CLI
    console.log('🐙 Creando release en GitHub...');
    const releaseNotes = \`## Versión \${newVersion}

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
- La actualización se puede verificar manualmente desde el menú de usuario\`;

    execSync(\`gh release create v\${newVersion} --title "Versión \${newVersion}" --notes "\${releaseNotes}"\`, { stdio: 'inherit' });
    
    // 7. Subir APK al release (si existe)
    const apkPath = 'android/app/build/outputs/apk/release/app-release.apk';
    if (fs.existsSync(apkPath)) {
      console.log('📤 Subiendo APK al release...');
      execSync(\`gh release upload v\${newVersion} \${apkPath}\`, { stdio: 'inherit' });
      console.log('✅ APK subido exitosamente');
    } else {
      console.log('⚠️ APK no encontrado, saltando subida');
    }
    
    console.log(\`\\n🎉 Release v\${newVersion} creado exitosamente!\`);
    console.log(\`🔗 https://github.com/\${process.env.GITHUB_REPOSITORY || 'tu-usuario/tu-repo'}/releases/tag/v\${newVersion}\`);
    
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
`;

  fs.writeFileSync('scripts/create-release.js', releaseScript);
  log('✅ Script de release creado: scripts/create-release.js', 'success');
}

function updatePackageJsonScripts() {
  const packageJsonPath = 'package.json';
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Agregar scripts de release
  packageJson.scripts = {
    ...packageJson.scripts,
    'release': 'node scripts/create-release.js',
    'release:patch': 'node scripts/create-release.js patch',
    'release:minor': 'node scripts/create-release.js minor',
    'release:major': 'node scripts/create-release.js major'
  };
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  log('✅ Scripts agregados al package.json', 'success');
}

function createProductionEnv() {
  const envContent = `# Configuración para producción con GitHub Releases
REACT_APP_SIMULATE_UPDATE=false
REACT_APP_GITHUB_REPO=tu-usuario/tu-repositorio
REACT_APP_UPDATE_CHECK_INTERVAL=1800000
REACT_APP_VERSION=1.0.0
`;

  fs.writeFileSync('.env.production', envContent);
  log('✅ Archivo .env.production creado', 'success');
}

function createGitHubWorkflow() {
  const workflowDir = '.github/workflows';
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }
  
  const workflowContent = `name: Build and Release

on:
  push:
    tags:
      - 'v*'

jobs:
  build-and-release:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web app
      run: npm run build
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Build Android APK
      run: |
        npx cap sync android
        cd android
        ./gradlew assembleRelease
    
    - name: Upload APK to Release
      uses: softprops/action-gh-release@v1
      with:
        files: android/app/build/outputs/apk/release/app-release.apk
      env:
        GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
`;

  fs.writeFileSync(`${workflowDir}/release.yml`, workflowContent);
  log('✅ GitHub Action creado: .github/workflows/release.yml', 'success');
}

function createSetupInstructions() {
  const instructions = `# 🚀 Configuración de GitHub Releases

## Prerrequisitos

1. **GitHub CLI instalado**:
   \`\`\`bash
   # Windows (con Chocolatey)
   choco install gh
   
   # macOS (con Homebrew)
   brew install gh
   
   # Linux
   curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
   \`\`\`

2. **Autenticación con GitHub**:
   \`\`\`bash
   gh auth login
   \`\`\`

3. **Repositorio en GitHub**:
   - Crea un repositorio en GitHub
   - Conecta tu proyecto local: \`git remote add origin https://github.com/tu-usuario/tu-repo.git\`

## Configuración

1. **Actualiza .env.production**:
   \`\`\`env
   REACT_APP_GITHUB_REPO=tu-usuario/tu-repositorio
   \`\`\`

2. **Primer release**:
   \`\`\`bash
   npm run release:patch
   \`\`\`

## Uso

\`\`\`bash
# Crear release patch (1.0.0 -> 1.0.1)
npm run release:patch

# Crear release minor (1.0.0 -> 1.1.0)
npm run release:minor

# Crear release major (1.0.0 -> 2.0.0)
npm run release:major
\`\`\`

## Verificación

1. Ve a tu repositorio en GitHub
2. Verifica que el release se haya creado
3. Descarga el APK para probar
4. Las actualizaciones automáticas deberían funcionar

## Troubleshooting

- **Error "gh not found"**: Instala GitHub CLI
- **Error de autenticación**: Ejecuta \`gh auth login\`
- **APK no se sube**: Verifica que se compile correctamente
`;

  fs.writeFileSync('SETUP-GITHUB-RELEASES.md', instructions);
  log('✅ Instrucciones creadas: SETUP-GITHUB-RELEASES.md', 'success');
}

function main() {
  log('🐙 Configurando actualizaciones con GitHub Releases...', 'bright');
  
  // Crear directorio scripts si no existe
  if (!fs.existsSync('scripts')) {
    fs.mkdirSync('scripts');
  }
  
  createReleaseScript();
  updatePackageJsonScripts();
  createProductionEnv();
  createGitHubWorkflow();
  createSetupInstructions();
  
  log('\n🎉 Configuración de GitHub Releases completada!', 'success');
  log('\n📖 Próximos pasos:', 'bright');
  log('1. Instala GitHub CLI: https://cli.github.com/', 'info');
  log('2. Ejecuta: gh auth login', 'info');
  log('3. Actualiza REACT_APP_GITHUB_REPO en .env.production', 'info');
  log('4. Lee las instrucciones en: SETUP-GITHUB-RELEASES.md', 'info');
  log('5. Crea tu primer release: npm run release:patch', 'info');
  log('\n🔗 Documentación completa en: README-ACTUALIZACIONES-REALES.md', 'warning');
}

main();