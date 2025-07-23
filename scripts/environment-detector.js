// Detector automático de entorno y configuración
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class EnvironmentDetector {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
  }

  // Detectar información del repositorio automáticamente
  detectRepositoryInfo() {
    try {
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      
      if (match) {
        return {
          owner: match[1],
          name: match[2],
          url: `https://github.com/${match[1]}/${match[2]}`,
          detected: true
        };
      }
    } catch (error) {
      console.log('⚠️  No se pudo detectar información del repositorio automáticamente');
    }
    
    return {
      owner: null,
      name: null,
      url: null,
      detected: false
    };
  }

  // Detectar plataformas disponibles
  detectAvailablePlatforms() {
    const platforms = {
      android: fs.existsSync(path.join(this.projectRoot, 'android')),
      ios: fs.existsSync(path.join(this.projectRoot, 'ios')),
      electron: this.hasElectronConfig(),
      web: fs.existsSync(path.join(this.projectRoot, 'public'))
    };

    return platforms;
  }

  // Verificar si tiene configuración de Electron
  hasElectronConfig() {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      return packageJson.main && packageJson.main.includes('electron');
    } catch {
      return false;
    }
  }

  // Detectar herramientas de CI/CD disponibles
  detectCITools() {
    return {
      githubActions: fs.existsSync(path.join(this.projectRoot, '.github', 'workflows')),
      gitlab: fs.existsSync(path.join(this.projectRoot, '.gitlab-ci.yml')),
      jenkins: fs.existsSync(path.join(this.projectRoot, 'Jenkinsfile')),
      travis: fs.existsSync(path.join(this.projectRoot, '.travis.yml'))
    };
  }

  // Generar configuración automática
  generateAutoConfig() {
    const repoInfo = this.detectRepositoryInfo();
    const platforms = this.detectAvailablePlatforms();
    const ciTools = this.detectCITools();
    
    const autoConfig = {
      repository: repoInfo.detected ? {
        owner: repoInfo.owner,
        name: repoInfo.name,
        url: repoInfo.url,
        autoDetected: true
      } : {
        owner: "TU_USUARIO", // Placeholder si no se puede detectar
        name: "TU_REPO",
        url: "https://github.com/TU_USUARIO/TU_REPO",
        autoDetected: false
      },
      
      platforms: {
        available: Object.keys(platforms).filter(p => platforms[p]),
        android: platforms.android,
        ios: platforms.ios,
        electron: platforms.electron,
        web: platforms.web
      },
      
      cicd: {
        available: Object.keys(ciTools).filter(t => ciTools[t]),
        primary: ciTools.githubActions ? 'github-actions' : 'manual'
      },
      
      generatedAt: new Date().toISOString()
    };

    return autoConfig;
  }

  // Actualizar configuración existente con datos detectados
  updateConfigWithDetectedData() {
    try {
      const configPath = path.join(this.projectRoot, 'config', 'app.config.js');
      const autoConfig = this.generateAutoConfig();
      
      if (autoConfig.repository.autoDetected) {
        let configContent = fs.readFileSync(configPath, 'utf8');
        
        // Actualizar owner y name si fueron detectados automáticamente
        configContent = configContent.replace(
          /owner:\s*["'][^"']*["']/,
          `owner: "${autoConfig.repository.owner}"`
        );
        
        configContent = configContent.replace(
          /name:\s*["'][^"']*["']/,
          `name: "${autoConfig.repository.name}"`
        );
        
        fs.writeFileSync(configPath, configContent);
        console.log('✅ Configuración actualizada automáticamente con datos del repositorio');
      }
      
      return autoConfig;
    } catch (error) {
      console.error('❌ Error actualizando configuración:', error.message);
      return null;
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const detector = new EnvironmentDetector();
  const config = detector.updateConfigWithDetectedData();
  
  if (config) {
    console.log('\n🔍 Configuración detectada:');
    console.log(JSON.stringify(config, null, 2));
  }
}

module.exports = EnvironmentDetector;