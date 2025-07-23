// Configuración automática completa del sistema de actualizaciones
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const EnvironmentDetector = require('./environment-detector.js');
const KeystoreManager = require('./keystore-manager.js');

class AutoSetup {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.detector = new EnvironmentDetector();
    this.keystoreManager = new KeystoreManager();
  }

  // Verificar dependencias del sistema
  checkSystemDependencies() {
    const dependencies = {
      node: this.checkCommand('node --version'),
      npm: this.checkCommand('npm --version'),
      git: this.checkCommand('git --version'),
      java: this.checkCommand('java -version'),
      keytool: this.checkCommand('keytool -help')
    };

    console.log('🔍 Verificando dependencias del sistema:');
    Object.entries(dependencies).forEach(([name, available]) => {
      console.log(`   ${name}: ${available ? '✅' : '❌'}`);
    });

    return dependencies;
  }

  checkCommand(command) {
    try {
      execSync(command, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  // Configurar repositorio automáticamente
  async setupRepository() {
    console.log('\n📂 Configurando repositorio...');
    
    const autoConfig = this.detector.updateConfigWithDetectedData();
    
    if (!autoConfig.repository.autoDetected) {
      console.log('⚠️  No se pudo detectar información del repositorio automáticamente');
      console.log('   Actualiza manualmente config/app.config.js con:');
      console.log('   - owner: tu usuario de GitHub');
      console.log('   - name: nombre de tu repositorio');
      return false;
    }

    console.log('✅ Repositorio configurado automáticamente');
    return true;
  }

  // Configurar keystore para Android
  async setupAndroidSigning() {
    console.log('\n🔐 Configurando firma de Android...');
    
    const checks = this.keystoreManager.checkKeystoreSetup();
    
    if (!checks.keystoreExists) {
      console.log('   Generando keystore...');
      const result = this.keystoreManager.generateKeystore({
        dname: 'CN=Release Key, OU=Development, O=Your Company, L=Your City, ST=Your State, C=US'
      });
      
      if (!result.success) {
        console.log('❌ Error generando keystore');
        return false;
      }
    }

    console.log('✅ Keystore configurado');
    return true;
  }

  // Configurar GitHub Secrets
  setupGitHubSecrets() {
    console.log('\n🔑 Configuración de GitHub Secrets:');
    console.log('   Para habilitar la firma automática, configura estos secrets en GitHub:');
    console.log('   1. Ve a: Settings > Secrets and variables > Actions');
    console.log('   2. Agrega los siguientes secrets:');
    
    const keystorePath = path.join(this.projectRoot, 'android', 'app', 'release-key.keystore');
    const propsPath = path.join(this.projectRoot, 'android', 'keystore.properties');
    
    if (fs.existsSync(keystorePath) && fs.existsSync(propsPath)) {
      const props = fs.readFileSync(propsPath, 'utf8');
      const keyAlias = props.match(/keyAlias=(.+)/)?.[1];
      
      console.log('\n   Secrets requeridos:');
      console.log('   - KEYSTORE_FILE: (contenido base64 del keystore)');
      console.log('   - KEYSTORE_PASSWORD: (de keystore.properties)');
      console.log(`   - KEY_ALIAS: ${keyAlias || '(de keystore.properties)'}`);
      console.log('   - KEY_PASSWORD: (de keystore.properties)');
      
      console.log('\n   💡 Para obtener KEYSTORE_FILE:');
      if (process.platform === 'win32') {
        console.log(`   certutil -encode "${keystorePath}" keystore.txt`);
        console.log('   Luego copia el contenido (sin las líneas BEGIN/END)');
      } else {
        console.log(`   base64 -i "${keystorePath}" | pbcopy`);
      }
    }
  }

  // Crear archivos de configuración necesarios
  createConfigFiles() {
    console.log('\n📄 Creando archivos de configuración...');
    
    // Crear public/version.json si no existe
    const versionJsonPath = path.join(this.projectRoot, 'public', 'version.json');
    if (!fs.existsSync(versionJsonPath)) {
      const config = require('../config/app.config.js');
      const versionInfo = config.generateVersionInfo();
      
      const publicDir = path.dirname(versionJsonPath);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      
      fs.writeFileSync(versionJsonPath, JSON.stringify(versionInfo, null, 2));
      console.log('   ✅ public/version.json creado');
    }

    // Crear .env.production si no existe
    const envProdPath = path.join(this.projectRoot, '.env.production');
    if (!fs.existsSync(envProdPath)) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const envContent = `REACT_APP_VERSION=${packageJson.version}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
REACT_APP_ENVIRONMENT=production
`;
      fs.writeFileSync(envProdPath, envContent);
      console.log('   ✅ .env.production creado');
    }

    console.log('✅ Archivos de configuración listos');
  }

  // Configurar scripts de npm
  updatePackageScripts() {
    console.log('\n📦 Verificando scripts de npm...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const requiredScripts = {
      'release:auto': 'node scripts/auto-setup.js release',
      'setup:complete': 'node scripts/auto-setup.js setup',
      'check:system': 'node scripts/auto-setup.js check'
    };

    let updated = false;
    Object.entries(requiredScripts).forEach(([script, command]) => {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
        updated = true;
      }
    });

    if (updated) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Scripts de npm actualizados');
    } else {
      console.log('✅ Scripts de npm ya están configurados');
    }
  }

  // Proceso completo de configuración
  async setupComplete() {
    console.log('🚀 Iniciando configuración automática completa...\n');

    // 1. Verificar dependencias
    const deps = this.checkSystemDependencies();
    const missingDeps = Object.entries(deps).filter(([_, available]) => !available);
    
    if (missingDeps.length > 0) {
      console.log('\n❌ Dependencias faltantes:');
      missingDeps.forEach(([name]) => {
        console.log(`   - ${name}`);
      });
      console.log('\nInstala las dependencias faltantes antes de continuar.');
      return false;
    }

    // 2. Configurar repositorio
    await this.setupRepository();

    // 3. Crear archivos de configuración
    this.createConfigFiles();

    // 4. Actualizar scripts
    this.updatePackageScripts();

    // 5. Configurar Android (opcional)
    if (deps.java && deps.keytool) {
      await this.setupAndroidSigning();
      this.setupGitHubSecrets();
    } else {
      console.log('\n⚠️  Java/keytool no disponible - saltando configuración de Android');
    }

    console.log('\n🎉 ¡Configuración completada!');
    console.log('\n📋 Próximos pasos:');
    console.log('   1. Configura GitHub Secrets (si usas Android)');
    console.log('   2. Ejecuta: npm run release:patch');
    console.log('   3. Haz push de un tag: git tag v1.0.0 && git push --tags');
    console.log('   4. GitHub Actions construirá automáticamente tu app');

    return true;
  }

  // Release automático
  async autoRelease(type = 'patch') {
    console.log(`🚀 Iniciando release automático (${type})...`);
    
    const ReleaseManager = require('./release-manager.js');
    const releaseManager = new ReleaseManager();
    
    const result = await releaseManager.createRelease(type, {
      skipTests: false,
      skipBuild: false,
      skipPush: false
    });

    if (result.success) {
      console.log('\n🎉 Release completado exitosamente!');
      console.log(`   Versión: ${result.newVersion}`);
      console.log(`   URL: ${result.releaseUrl}`);
    } else {
      console.log('\n❌ Error en el release:', result.error);
    }

    return result.success;
  }

  // Verificación del sistema
  checkSystem() {
    console.log('🔍 Verificación completa del sistema:\n');
    
    // Dependencias
    this.checkSystemDependencies();
    
    // Configuración del repositorio
    console.log('\n📂 Configuración del repositorio:');
    const autoConfig = this.detector.generateAutoConfig();
    console.log(`   Detectado automáticamente: ${autoConfig.repository.autoDetected ? '✅' : '❌'}`);
    console.log(`   Owner: ${autoConfig.repository.owner}`);
    console.log(`   Name: ${autoConfig.repository.name}`);
    
    // Plataformas
    console.log('\n📱 Plataformas disponibles:');
    Object.entries(autoConfig.platforms).forEach(([platform, available]) => {
      if (platform !== 'available') {
        console.log(`   ${platform}: ${available ? '✅' : '❌'}`);
      }
    });
    
    // Keystore
    console.log('\n🔐 Configuración de Android:');
    const keystoreChecks = this.keystoreManager.checkKeystoreSetup();
    console.log(`   Keystore: ${keystoreChecks.keystoreExists ? '✅' : '❌'}`);
    console.log(`   Properties: ${keystoreChecks.propertiesExist ? '✅' : '❌'}`);
    console.log(`   Build.gradle: ${keystoreChecks.buildGradleConfigured ? '✅' : '❌'}`);
    
    // CI/CD
    console.log('\n🔄 CI/CD:');
    console.log(`   GitHub Actions: ${autoConfig.cicd.available.includes('github-actions') ? '✅' : '❌'}`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const autoSetup = new AutoSetup();
  const action = process.argv[2] || 'check';
  const type = process.argv[3] || 'patch';

  switch (action) {
    case 'setup':
      autoSetup.setupComplete();
      break;
    case 'release':
      autoSetup.autoRelease(type);
      break;
    case 'check':
    default:
      autoSetup.checkSystem();
      break;
  }
}

module.exports = AutoSetup;