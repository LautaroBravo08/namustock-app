// Gestor de configuración centralizado
// Maneja toda la configuración del proyecto de forma dinámica

const fs = require('fs');
const path = require('path');
const DynamicConfig = require('../config/dynamic-config.js');

class ConfigManager {
  constructor() {
    this.dynamicConfig = new DynamicConfig();
    this.projectRoot = path.join(__dirname, '..');
  }

  // Obtener configuración completa
  getConfig() {
    return this.dynamicConfig.generateConfig();
  }

  // Actualizar configuración automáticamente
  updateConfig() {
    const config = this.getConfig();
    
    // Actualizar archivos de configuración
    this.updatePackageJson(config);
    this.updateCapacitorConfig(config);
    this.updateVersionJson(config);
    this.updateEnvironmentFiles(config);
    
    return config;
  }

  // Actualizar package.json con información detectada
  updatePackageJson(config) {
    const packagePath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    let updated = false;

    // Actualizar repository si no existe
    if (!packageJson.repository && config.repository.url) {
      packageJson.repository = {
        type: 'git',
        url: `${config.repository.url}.git`
      };
      updated = true;
    }

    // Actualizar homepage si no existe
    if (!packageJson.homepage && config.repository.url) {
      packageJson.homepage = config.repository.url;
      updated = true;
    }

    // Actualizar description si está vacía
    if (!packageJson.description) {
      packageJson.description = config.app.description;
      updated = true;
    }

    // Actualizar build config para Electron
    if (config.platforms.electron && !packageJson.build) {
      packageJson.build = {
        appId: config.app.id,
        productName: config.app.displayName,
        directories: {
          output: config.build.distDir
        },
        files: [
          `${config.build.outputDir}/**/*`,
          "node_modules/**/*",
          "public/electron.js"
        ]
      };
      updated = true;
    }

    if (updated) {
      fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
      console.log('✅ package.json actualizado automáticamente');
    }
  }

  // Actualizar configuración de Capacitor
  updateCapacitorConfig(config) {
    if (!config.platforms.capacitor) return;

    const configPath = path.join(this.projectRoot, 'capacitor.config.ts');
    
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      let updated = false;

      // Actualizar appId si es diferente
      const currentAppId = content.match(/appId:\s*['"`]([^'"`]+)['"`]/);
      if (currentAppId && currentAppId[1] !== config.app.id) {
        content = content.replace(
          /appId:\s*['"`][^'"`]+['"`]/,
          `appId: '${config.app.id}'`
        );
        updated = true;
      }

      // Actualizar appName si es diferente
      const currentAppName = content.match(/appName:\s*['"`]([^'"`]+)['"`]/);
      if (currentAppName && currentAppName[1] !== config.app.displayName) {
        content = content.replace(
          /appName:\s*['"`][^'"`]+['"`]/,
          `appName: '${config.app.displayName}'`
        );
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(configPath, content);
        console.log('✅ capacitor.config.ts actualizado automáticamente');
      }
    }
  }

  // Actualizar version.json
  updateVersionJson(config) {
    const versionPath = path.join(this.projectRoot, 'public', 'version.json');
    const versionInfo = config.generateVersionInfo();
    
    // Crear directorio si no existe
    const publicDir = path.dirname(versionPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(versionPath, JSON.stringify(versionInfo, null, 2));
    console.log('✅ version.json actualizado');
  }

  // Actualizar archivos de entorno
  updateEnvironmentFiles(config) {
    const envFiles = [
      { name: '.env.production', env: 'production' },
      { name: '.env.development', env: 'development' },
      { name: '.env.local', env: 'local' }
    ];

    envFiles.forEach(({ name, env }) => {
      const envPath = path.join(this.projectRoot, name);
      
      const envContent = `# Configuración automática para ${env}
REACT_APP_VERSION=${config.app.version}
REACT_APP_BUILD_DATE=${new Date().toISOString()}
REACT_APP_ENVIRONMENT=${env}
REACT_APP_APP_NAME=${config.app.displayName}
REACT_APP_APP_ID=${config.app.id}
REACT_APP_REPOSITORY_URL=${config.repository.url || ''}
REACT_APP_UPDATE_URL=${config.repository.url || ''}/releases/latest/download/version.json
`;

      // Solo crear si no existe para no sobrescribir configuraciones personalizadas
      if (!fs.existsSync(envPath)) {
        fs.writeFileSync(envPath, envContent);
        console.log(`✅ ${name} creado automáticamente`);
      }
    });
  }

  // Generar configuración para GitHub Actions
  generateGitHubActionsConfig(config) {
    if (!config.cicd.available.includes('github-actions')) {
      return null;
    }

    const workflowConfig = {
      name: 'Build and Release',
      on: {
        push: {
          tags: ['v*']
        },
        workflow_dispatch: {
          inputs: {
            version_type: {
              description: 'Version type (patch, minor, major)',
              required: false,
              default: 'patch',
              type: 'choice',
              options: ['patch', 'minor', 'major']
            }
          }
        }
      },
      env: {
        NODE_VERSION: '20',
        JAVA_VERSION: '17',
        APP_NAME: config.app.displayName,
        APP_ID: config.app.id
      },
      jobs: {
        'build-and-release': {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              name: 'Checkout repository',
              uses: 'actions/checkout@v4',
              with: {
                'fetch-depth': 0,
                token: '${{ secrets.GITHUB_TOKEN }}'
              }
            },
            {
              name: 'Setup Node.js',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '${{ env.NODE_VERSION }}',
                cache: 'npm'
              }
            },
            {
              name: 'Install dependencies',
              run: 'npm ci'
            },
            {
              name: 'Load dynamic configuration',
              id: 'config',
              run: `node -e "
                const ConfigManager = require('./scripts/config-manager.js');
                const configManager = new ConfigManager();
                const config = configManager.getConfig();
                console.log('APP_NAME=' + config.app.displayName);
                console.log('APP_ID=' + config.app.id);
                console.log('REPO_URL=' + config.repository.url);
                console.log('VERSION=' + config.app.version);
              " >> $GITHUB_OUTPUT`
            }
          ]
        }
      }
    };

    // Agregar pasos específicos según plataformas disponibles
    if (config.platforms.android) {
      workflowConfig.jobs['build-and-release'].steps.push(
        {
          name: 'Setup Java',
          uses: 'actions/setup-java@v4',
          with: {
            distribution: 'temurin',
            'java-version': '${{ env.JAVA_VERSION }}'
          }
        },
        {
          name: 'Setup Android SDK',
          uses: 'android-actions/setup-android@v3'
        },
        {
          name: 'Build Android',
          run: 'npm run build && npx cap sync android && cd android && ./gradlew assembleRelease'
        }
      );
    }

    return workflowConfig;
  }

  // Validar configuración completa
  validateConfiguration() {
    const config = this.getConfig();
    const validation = config.validate();
    
    console.log('\n🔍 Validación de configuración:');
    
    if (validation.valid) {
      console.log('✅ Configuración válida');
    } else {
      console.log('❌ Problemas encontrados:');
      validation.issues.forEach(issue => console.log(`   - ${issue}`));
    }

    if (validation.warnings.length > 0) {
      console.log('\n⚠️  Advertencias:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    return validation;
  }

  // Mostrar información de configuración
  showConfigInfo() {
    const config = this.getConfig();
    
    console.log('\n📋 Información de configuración detectada:');
    console.log('\n📱 Aplicación:');
    console.log(`   Nombre: ${config.app.displayName}`);
    console.log(`   ID: ${config.app.id}`);
    console.log(`   Versión: ${config.app.version}`);
    
    console.log('\n📂 Repositorio:');
    console.log(`   Detectado automáticamente: ${config.repository.autoDetected ? '✅' : '❌'}`);
    console.log(`   Owner: ${config.repository.owner || 'No detectado'}`);
    console.log(`   Name: ${config.repository.name || 'No detectado'}`);
    console.log(`   URL: ${config.repository.url || 'No disponible'}`);
    
    console.log('\n🚀 Plataformas:');
    Object.entries(config.platforms).forEach(([platform, available]) => {
      console.log(`   ${platform}: ${available ? '✅' : '❌'}`);
    });
    
    console.log('\n🔧 CI/CD:');
    console.log(`   Disponible: ${config.cicd.available.join(', ') || 'Ninguno'}`);
    console.log(`   Workflows: ${config.cicd.workflows.length}`);
    
    console.log('\n✨ Features detectadas:');
    config.features.forEach(feature => console.log(`   - ${feature}`));
    
    return config;
  }

  // Configuración automática completa
  autoSetup() {
    console.log('🚀 Iniciando configuración automática...\n');
    
    const config = this.updateConfig();
    const validation = this.validateConfiguration();
    
    if (validation.valid) {
      console.log('\n🎉 Configuración automática completada exitosamente!');
      console.log('\n📋 Próximos pasos:');
      console.log('   1. Revisa los archivos actualizados');
      console.log('   2. Configura GitHub Secrets si usas Android');
      console.log('   3. Ejecuta: npm run release:patch');
      
      return true;
    } else {
      console.log('\n⚠️  Configuración completada con advertencias');
      console.log('   Revisa los problemas reportados arriba');
      
      return false;
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const configManager = new ConfigManager();
  const action = process.argv[2] || 'info';

  switch (action) {
    case 'update':
      configManager.updateConfig();
      break;
    case 'validate':
      configManager.validateConfiguration();
      break;
    case 'setup':
      configManager.autoSetup();
      break;
    case 'info':
    default:
      configManager.showConfigInfo();
      break;
  }
}

module.exports = ConfigManager;