// Gestor automático de keystore para Android
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const crypto = require('crypto');

class KeystoreManager {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.androidPath = path.join(this.projectRoot, 'android');
    this.keystorePath = path.join(this.androidPath, 'app', 'release-key.keystore');
    this.keystorePropsPath = path.join(this.androidPath, 'keystore.properties');
    this.buildGradlePath = path.join(this.androidPath, 'app', 'build.gradle');
  }

  // Generar contraseñas seguras
  generateSecurePassword(length = 16) {
    return crypto.randomBytes(length).toString('base64').slice(0, length);
  }

  // Verificar si Java keytool está disponible
  checkKeytoolAvailable() {
    try {
      execSync('keytool -help', { stdio: 'pipe' });
      return true;
    } catch {
      console.error('❌ Java keytool no está disponible. Instala Java JDK.');
      return false;
    }
  }

  // Generar keystore automáticamente
  generateKeystore(config = {}) {
    if (!this.checkKeytoolAvailable()) {
      return false;
    }

    const {
      alias = 'release-key',
      keyPassword = this.generateSecurePassword(),
      storePassword = this.generateSecurePassword(),
      validity = 25000, // días
      keysize = 2048,
      dname = 'CN=App Release, OU=Development, O=Company, L=City, ST=State, C=US'
    } = config;

    try {
      console.log('🔐 Generando keystore para Android...');
      
      // Crear directorio si no existe
      const keystoreDir = path.dirname(this.keystorePath);
      if (!fs.existsSync(keystoreDir)) {
        fs.mkdirSync(keystoreDir, { recursive: true });
      }

      // Comando para generar keystore
      const keytoolCommand = [
        'keytool',
        '-genkeypair',
        '-v',
        `-keystore "${this.keystorePath}"`,
        `-alias ${alias}`,
        `-keyalg RSA`,
        `-keysize ${keysize}`,
        `-validity ${validity}`,
        `-storepass ${storePassword}`,
        `-keypass ${keyPassword}`,
        `-dname "${dname}"`
      ].join(' ');

      execSync(keytoolCommand, { stdio: 'inherit' });

      // Crear archivo de propiedades
      this.createKeystoreProperties({
        alias,
        keyPassword,
        storePassword,
        storeFile: 'release-key.keystore'
      });

      // Configurar build.gradle
      this.configureBuildGradle();

      console.log('✅ Keystore generado exitosamente');
      console.log(`   Ubicación: ${this.keystorePath}`);
      console.log(`   Alias: ${alias}`);
      console.log('⚠️  IMPORTANTE: Guarda las contraseñas en un lugar seguro');

      return {
        success: true,
        keystorePath: this.keystorePath,
        alias,
        storePassword,
        keyPassword
      };

    } catch (error) {
      console.error('❌ Error generando keystore:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Crear archivo keystore.properties
  createKeystoreProperties(config) {
    const properties = `# Configuración del keystore para release
# IMPORTANTE: No subir este archivo al repositorio
storeFile=${config.storeFile}
storePassword=${config.storePassword}
keyAlias=${config.alias}
keyPassword=${config.keyPassword}
`;

    fs.writeFileSync(this.keystorePropsPath, properties);
    console.log('✅ keystore.properties creado');

    // Agregar a .gitignore si no está
    this.addToGitignore();
  }

  // Configurar build.gradle para usar el keystore
  configureBuildGradle() {
    if (!fs.existsSync(this.buildGradlePath)) {
      console.log('⚠️  build.gradle no encontrado');
      return;
    }

    let buildGradleContent = fs.readFileSync(this.buildGradlePath, 'utf8');

    // Verificar si ya está configurado
    if (buildGradleContent.includes('signingConfigs')) {
      console.log('✅ build.gradle ya tiene configuración de firma');
      return;
    }

    // Agregar configuración de firma
    const signingConfig = `
    // Configuración de keystore
    def keystorePropertiesFile = rootProject.file("keystore.properties")
    def keystoreProperties = new Properties()
    if (keystorePropertiesFile.exists()) {
        keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
    }

    android {
        signingConfigs {
            release {
                if (keystorePropertiesFile.exists()) {
                    keyAlias keystoreProperties['keyAlias']
                    keyPassword keystoreProperties['keyPassword']
                    storeFile file(keystoreProperties['storeFile'])
                    storePassword keystoreProperties['storePassword']
                }
            }
        }
        
        buildTypes {
            release {
                signingConfig signingConfigs.release
                minifyEnabled false
                proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
            }
        }
    }`;

    // Insertar después de 'android {'
    buildGradleContent = buildGradleContent.replace(
      /android\s*{/,
      signingConfig
    );

    fs.writeFileSync(this.buildGradlePath, buildGradleContent);
    console.log('✅ build.gradle configurado para firma automática');
  }

  // Agregar archivos sensibles a .gitignore
  addToGitignore() {
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    const keystoreEntries = [
      '# Keystore files',
      'android/keystore.properties',
      'android/app/*.keystore',
      'android/app/*.jks'
    ];

    if (fs.existsSync(gitignorePath)) {
      let gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
      
      // Verificar si ya están las entradas
      if (!gitignoreContent.includes('keystore.properties')) {
        gitignoreContent += '\n\n' + keystoreEntries.join('\n') + '\n';
        fs.writeFileSync(gitignorePath, gitignoreContent);
        console.log('✅ .gitignore actualizado');
      }
    }
  }

  // Verificar configuración existente
  checkKeystoreSetup() {
    const checks = {
      keystoreExists: fs.existsSync(this.keystorePath),
      propertiesExist: fs.existsSync(this.keystorePropsPath),
      buildGradleConfigured: false
    };

    if (fs.existsSync(this.buildGradlePath)) {
      const buildGradleContent = fs.readFileSync(this.buildGradlePath, 'utf8');
      checks.buildGradleConfigured = buildGradleContent.includes('signingConfigs');
    }

    return checks;
  }

  // Configurar para GitHub Actions
  setupForGitHubActions() {
    console.log('🔧 Configurando keystore para GitHub Actions...');
    
    const checks = this.checkKeystoreSetup();
    
    if (!checks.keystoreExists) {
      console.log('⚠️  Keystore no encontrado. Generando uno nuevo...');
      const result = this.generateKeystore();
      if (!result.success) {
        return false;
      }
    }

    // Instrucciones para GitHub Secrets
    console.log('\n📋 Para configurar GitHub Actions:');
    console.log('1. Ve a tu repositorio en GitHub');
    console.log('2. Settings > Secrets and variables > Actions');
    console.log('3. Agrega estos secrets:');
    console.log('   - KEYSTORE_FILE: (contenido base64 del keystore)');
    console.log('   - KEYSTORE_PASSWORD: (contraseña del keystore)');
    console.log('   - KEY_ALIAS: (alias de la clave)');
    console.log('   - KEY_PASSWORD: (contraseña de la clave)');
    
    // Generar comando para obtener base64 del keystore
    if (checks.keystoreExists) {
      console.log('\n💡 Para obtener el contenido base64 del keystore:');
      if (process.platform === 'win32') {
        console.log(`   certutil -encode "${this.keystorePath}" keystore.txt`);
      } else {
        console.log(`   base64 -i "${this.keystorePath}" | pbcopy`);
      }
    }

    return true;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const keystoreManager = new KeystoreManager();
  const action = process.argv[2] || 'check';

  switch (action) {
    case 'generate':
      keystoreManager.generateKeystore();
      break;
    case 'setup-github':
      keystoreManager.setupForGitHubActions();
      break;
    case 'check':
    default:
      const checks = keystoreManager.checkKeystoreSetup();
      console.log('🔍 Estado del keystore:');
      console.log(`   Keystore existe: ${checks.keystoreExists ? '✅' : '❌'}`);
      console.log(`   Properties existen: ${checks.propertiesExist ? '✅' : '❌'}`);
      console.log(`   build.gradle configurado: ${checks.buildGradleConfigured ? '✅' : '❌'}`);
      
      if (!checks.keystoreExists) {
        console.log('\n💡 Ejecuta: npm run keystore:generate');
      }
      break;
  }
}

module.exports = KeystoreManager;