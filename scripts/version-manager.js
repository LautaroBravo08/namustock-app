// Gestor de versiones automático sin hardcode
const fs = require('fs');
const path = require('path');
const config = require('../config/app.config.js');

class VersionManager {
  constructor() {
    this.packagePath = path.join(__dirname, '..', 'package.json');
    this.versionPath = path.join(__dirname, '..', 'public', 'version.json');
    this.envProductionPath = path.join(__dirname, '..', '.env.production');
    this.capacitorConfigPath = path.join(__dirname, '..', 'capacitor.config.ts');
    this.androidManifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
    this.buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  }

  // Incrementar versión según tipo
  incrementVersion(version, type = 'patch') {
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

  // Generar número de build único
  generateBuildNumber() {
    return Math.floor(Date.now() / 1000); // Unix timestamp
  }

  // Actualizar package.json
  updatePackageJson(newVersion) {
    const packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
    packageData.version = newVersion;
    fs.writeFileSync(this.packagePath, JSON.stringify(packageData, null, 2));
    console.log(`✅ package.json actualizado a v${newVersion}`);
  }

  // Actualizar version.json
  updateVersionJson(newVersion) {
    // Actualizar configuración con nueva versión
    config.app.version = newVersion;
    
    const versionData = config.generateVersionInfo();
    
    // Crear directorio public si no existe
    const publicDir = path.dirname(this.versionPath);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    fs.writeFileSync(this.versionPath, JSON.stringify(versionData, null, 2));
    console.log(`✅ version.json actualizado a v${newVersion}`);
  }

  // Actualizar .env.production
  updateEnvProduction(newVersion) {
    if (!fs.existsSync(this.envProductionPath)) {
      // Crear archivo si no existe
      const envContent = `REACT_APP_VERSION=${newVersion}\nREACT_APP_BUILD_DATE=${new Date().toISOString()}\n`;
      fs.writeFileSync(this.envProductionPath, envContent);
    } else {
      let envContent = fs.readFileSync(this.envProductionPath, 'utf8');
      
      // Actualizar o agregar versión
      if (envContent.includes('REACT_APP_VERSION=')) {
        envContent = envContent.replace(
          /REACT_APP_VERSION=[\d.]+/,
          `REACT_APP_VERSION=${newVersion}`
        );
      } else {
        envContent += `\nREACT_APP_VERSION=${newVersion}`;
      }
      
      // Actualizar o agregar fecha de build
      if (envContent.includes('REACT_APP_BUILD_DATE=')) {
        envContent = envContent.replace(
          /REACT_APP_BUILD_DATE=.*/,
          `REACT_APP_BUILD_DATE=${new Date().toISOString()}`
        );
      } else {
        envContent += `\nREACT_APP_BUILD_DATE=${new Date().toISOString()}`;
      }
      
      fs.writeFileSync(this.envProductionPath, envContent);
    }
    console.log(`✅ .env.production actualizado`);
  }

  // Actualizar capacitor.config.ts
  updateCapacitorConfig(newVersion) {
    if (fs.existsSync(this.capacitorConfigPath)) {
      let configContent = fs.readFileSync(this.capacitorConfigPath, 'utf8');
      
      // Actualizar appId y appName si es necesario
      configContent = configContent.replace(
        /appId:\s*['"][^'"]*['"]/,
        `appId: '${config.app.id}'`
      );
      
      configContent = configContent.replace(
        /appName:\s*['"][^'"]*['"]/,
        `appName: '${config.app.displayName}'`
      );
      
      fs.writeFileSync(this.capacitorConfigPath, configContent);
      console.log(`✅ capacitor.config.ts actualizado`);
    }
  }

  // Actualizar Android build.gradle
  updateAndroidBuildGradle(newVersion, buildNumber) {
    if (fs.existsSync(this.buildGradlePath)) {
      let gradleContent = fs.readFileSync(this.buildGradlePath, 'utf8');
      
      // Actualizar versionCode
      gradleContent = gradleContent.replace(
        /versionCode\s+\d+/,
        `versionCode ${buildNumber}`
      );
      
      // Actualizar versionName
      gradleContent = gradleContent.replace(
        /versionName\s+["'][^"']*["']/,
        `versionName "${newVersion}"`
      );
      
      fs.writeFileSync(this.buildGradlePath, gradleContent);
      console.log(`✅ Android build.gradle actualizado (versionCode: ${buildNumber}, versionName: ${newVersion})`);
    }
  }

  // Actualizar service worker
  updateServiceWorker(newVersion) {
    const swPath = path.join(__dirname, '..', 'public', 'sw.js');
    if (fs.existsSync(swPath)) {
      let swContent = fs.readFileSync(swPath, 'utf8');
      
      // Actualizar nombre del cache
      swContent = swContent.replace(
        /const CACHE_NAME = ['"][^'"]*['"];/,
        `const CACHE_NAME = '${config.app.name}-v${newVersion}';`
      );
      
      fs.writeFileSync(swPath, swContent);
      console.log(`✅ Service Worker actualizado`);
    }
  }

  // Método principal para actualizar versión
  async updateVersion(type = 'patch') {
    try {
      console.log(`🚀 Iniciando actualización de versión (${type})...`);
      
      // Leer versión actual
      const packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      const currentVersion = packageData.version;
      
      // Calcular nueva versión
      const newVersion = this.incrementVersion(currentVersion, type);
      const buildNumber = this.generateBuildNumber();
      
      console.log(`📦 Actualizando de v${currentVersion} a v${newVersion}`);
      
      // Actualizar todos los archivos
      this.updatePackageJson(newVersion);
      this.updateVersionJson(newVersion);
      this.updateEnvProduction(newVersion);
      this.updateCapacitorConfig(newVersion);
      this.updateAndroidBuildGradle(newVersion, buildNumber);
      this.updateServiceWorker(newVersion);
      
      console.log(`\n🎉 ¡Versión actualizada exitosamente!`);
      console.log(`   Versión anterior: ${currentVersion}`);
      console.log(`   Nueva versión: ${newVersion}`);
      console.log(`   Build number: ${buildNumber}`);
      console.log(`   Fecha: ${new Date().toISOString()}`);
      
      return {
        oldVersion: currentVersion,
        newVersion: newVersion,
        buildNumber: buildNumber,
        success: true
      };
      
    } catch (error) {
      console.error(`❌ Error actualizando versión: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obtener información de versión actual
  getCurrentVersionInfo() {
    try {
      const packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      const versionData = fs.existsSync(this.versionPath) 
        ? JSON.parse(fs.readFileSync(this.versionPath, 'utf8'))
        : {};
      
      return {
        version: packageData.version,
        buildDate: versionData.buildDate || new Date().toISOString(),
        features: versionData.features || config.features,
        downloads: versionData.downloads || config.downloads
      };
    } catch (error) {
      console.error(`❌ Error obteniendo información de versión: ${error.message}`);
      return null;
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const versionManager = new VersionManager();
  const type = process.argv[2] || 'patch';
  
  versionManager.updateVersion(type);
}

module.exports = VersionManager;