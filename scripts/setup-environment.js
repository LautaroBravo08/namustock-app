// Script para configurar el entorno de desarrollo automáticamente
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const config = require('../config/app.config.js');

class EnvironmentSetup {
  constructor() {
    this.rootPath = path.join(__dirname, '..');
  }

  // Verificar dependencias del sistema
  checkSystemDependencies() {
    console.log('🔍 Verificando dependencias del sistema...');
    
    const dependencies = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Java', command: 'java -version', required: true },
      { name: 'Android SDK', command: 'adb --version', required: false },
      { name: 'GitHub CLI', command: 'gh --version', required: false }
    ];

    const results = [];

    dependencies.forEach(dep => {
      try {
        const version = execSync(dep.command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${dep.name}: ${version.split('\n')[0]}`);
        results.push({ ...dep, installed: true, version: version.trim() });
      } catch (error) {
        if (dep.required) {
          console.log(`❌ ${dep.name}: No instalado (REQUERIDO)`);
        } else {
          console.log(`⚠️  ${dep.name}: No instalado (opcional)`);
        }
        results.push({ ...dep, installed: false, version: null });
      }
    });

    return results;
  }

  // Crear archivos de configuración necesarios
  createConfigFiles() {
    console.log('\n📁 Creando archivos de configuración...');

    // Crear .env.local si no existe
    const envLocalPath = path.join(this.rootPath, '.env.local');
    if (!fs.existsSync(envLocalPath)) {
      const envLocalContent = `# Configuración local de desarrollo
REACT_APP_VERSION=${config.app.version}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
REACT_APP_AUTO_UPDATE=false
`;
      fs.writeFileSync(envLocalPath, envLocalContent);
      console.log('✅ .env.local creado');
    }

    // Crear .env.production si no existe
    const envProdPath = path.join(this.rootPath, '.env.production');
    if (!fs.existsSync(envProdPath)) {
      const envProdContent = `# Configuración de producción
REACT_APP_VERSION=${config.app.version}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
REACT_APP_AUTO_UPDATE=true
REACT_APP_REPOSITORY_URL=${config.repository.url}
`;
      fs.writeFileSync(envProdPath, envProdContent);
      console.log('✅ .env.production creado');
    }

    // Crear directorio de scripts si no existe
    const scriptsDir = path.join(this.rootPath, 'scripts');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
      console.log('✅ Directorio scripts/ creado');
    }

    // Crear directorio de configuración si no existe
    const configDir = path.join(this.rootPath, 'config');
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
      console.log('✅ Directorio config/ creado');
    }
  }

  // Configurar Git hooks
  setupGitHooks() {
    console.log('\n🪝 Configurando Git hooks...');

    const hooksDir = path.join(this.rootPath, '.git', 'hooks');
    
    if (!fs.existsSync(hooksDir)) {
      console.log('⚠️  Directorio .git/hooks no encontrado. ¿Está inicializado Git?');
      return;
    }

    // Pre-commit hook para validar antes de commit
    const preCommitHook = `#!/bin/sh
# Pre-commit hook para validar código

echo "🔍 Ejecutando validaciones pre-commit..."

# Ejecutar tests
npm test -- --watchAll=false --passWithNoTests
if [ $? -ne 0 ]; then
  echo "❌ Tests fallaron. Commit cancelado."
  exit 1
fi

# Verificar build
npm run build
if [ $? -ne 0 ]; then
  echo "❌ Build falló. Commit cancelado."
  exit 1
fi

echo "✅ Validaciones completadas. Continuando con commit..."
`;

    const preCommitPath = path.join(hooksDir, 'pre-commit');
    fs.writeFileSync(preCommitPath, preCommitHook);
    
    // Hacer ejecutable en sistemas Unix
    try {
      execSync(`chmod +x "${preCommitPath}"`, { stdio: 'pipe' });
    } catch (error) {
      // Ignorar en Windows
    }

    console.log('✅ Git hooks configurados');
  }

  // Verificar configuración de Capacitor
  checkCapacitorSetup() {
    console.log('\n📱 Verificando configuración de Capacitor...');

    const capacitorConfigPath = path.join(this.rootPath, 'capacitor.config.ts');
    const androidPath = path.join(this.rootPath, 'android');
    const iosPath = path.join(this.rootPath, 'ios');

    if (fs.existsSync(capacitorConfigPath)) {
      console.log('✅ capacitor.config.ts encontrado');
    } else {
      console.log('❌ capacitor.config.ts no encontrado');
    }

    if (fs.existsSync(androidPath)) {
      console.log('✅ Proyecto Android configurado');
    } else {
      console.log('⚠️  Proyecto Android no encontrado. Ejecuta: npx cap add android');
    }

    if (fs.existsSync(iosPath)) {
      console.log('✅ Proyecto iOS configurado');
    } else {
      console.log('⚠️  Proyecto iOS no encontrado. Ejecuta: npx cap add ios');
    }
  }

  // Instalar dependencias faltantes
  installDependencies() {
    console.log('\n📦 Verificando dependencias de npm...');

    try {
      execSync('npm ci', { stdio: 'inherit' });
      console.log('✅ Dependencias instaladas correctamente');
    } catch (error) {
      console.log('❌ Error instalando dependencias:', error.message);
    }
  }

  // Configuración completa del entorno
  async setupEnvironment() {
    console.log('🚀 Configurando entorno de desarrollo...\n');

    // Verificar dependencias del sistema
    const systemDeps = this.checkSystemDependencies();
    const missingRequired = systemDeps.filter(dep => dep.required && !dep.installed);

    if (missingRequired.length > 0) {
      console.log('\n❌ Dependencias requeridas faltantes:');
      missingRequired.forEach(dep => {
        console.log(`   - ${dep.name}`);
      });
      console.log('\nPor favor instala las dependencias faltantes antes de continuar.');
      return false;
    }

    // Crear archivos de configuración
    this.createConfigFiles();

    // Instalar dependencias
    this.installDependencies();

    // Configurar Git hooks
    this.setupGitHooks();

    // Verificar Capacitor
    this.checkCapacitorSetup();

    console.log('\n🎉 ¡Entorno configurado exitosamente!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. npm run dev - Iniciar desarrollo');
    console.log('   2. npm run version:patch - Actualizar versión');
    console.log('   3. npm run release:patch - Crear release');
    console.log('   4. npm run android - Abrir proyecto Android');

    return true;
  }

  // Mostrar información del proyecto
  showProjectInfo() {
    console.log('\n📊 Información del proyecto:');
    console.log(`   Nombre: ${config.app.displayName}`);
    console.log(`   ID: ${config.app.id}`);
    console.log(`   Versión: ${config.app.version}`);
    console.log(`   Repositorio: ${config.repository.url}`);
    console.log(`   Entorno: ${config.getCurrentEnvironment()}`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const setup = new EnvironmentSetup();
  
  if (process.argv.includes('--info')) {
    setup.showProjectInfo();
  } else {
    setup.setupEnvironment();
  }
}

module.exports = EnvironmentSetup;