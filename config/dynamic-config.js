// Sistema de configuración dinámico sin hardcode
// Este archivo detecta automáticamente toda la configuración del proyecto

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DynamicConfig {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.cache = new Map();
    this.packageJson = this.loadPackageJson();
  }

  // Cargar package.json
  loadPackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    return JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  }

  // Detectar información del repositorio automáticamente
  detectRepository() {
    if (this.cache.has('repository')) {
      return this.cache.get('repository');
    }

    let repoInfo = {
      owner: null,
      name: null,
      branch: 'main',
      url: null,
      apiUrl: null,
      autoDetected: false
    };

    try {
      // Intentar desde package.json primero
      if (this.packageJson.repository) {
        const repoUrl = typeof this.packageJson.repository === 'string' 
          ? this.packageJson.repository 
          : this.packageJson.repository.url;
        
        const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
        if (match) {
          repoInfo.owner = match[1];
          repoInfo.name = match[2].replace('.git', '');
          repoInfo.autoDetected = true;
        }
      }

      // Si no se encontró en package.json, intentar con git
      if (!repoInfo.autoDetected) {
        try {
          const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
          const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
          
          if (match) {
            repoInfo.owner = match[1];
            repoInfo.name = match[2].replace('.git', '');
            repoInfo.autoDetected = true;
          }
        } catch (gitError) {
          console.warn('No se pudo detectar repositorio desde git:', gitError.message);
        }
      }

      // Detectar rama actual
      try {
        repoInfo.branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim() || 'main';
      } catch {
        repoInfo.branch = 'main';
      }

    } catch (error) {
      console.warn('Error detectando repositorio:', error.message);
    }

    // Generar URLs si se detectó correctamente
    if (repoInfo.owner && repoInfo.name) {
      repoInfo.url = `https://github.com/${repoInfo.owner}/${repoInfo.name}`;
      repoInfo.apiUrl = `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.name}`;
    }

    this.cache.set('repository', repoInfo);
    return repoInfo;
  }

  // Detectar plataformas disponibles
  detectPlatforms() {
    if (this.cache.has('platforms')) {
      return this.cache.get('platforms');
    }

    const platforms = {
      web: true, // Siempre disponible
      android: fs.existsSync(path.join(this.projectRoot, 'android')),
      ios: fs.existsSync(path.join(this.projectRoot, 'ios')),
      electron: this.packageJson.dependencies?.electron || this.packageJson.devDependencies?.electron,
      capacitor: this.packageJson.dependencies?.['@capacitor/core'] || this.packageJson.devDependencies?.['@capacitor/core']
    };

    this.cache.set('platforms', platforms);
    return platforms;
  }

  // Detectar configuración de Capacitor
  detectCapacitorConfig() {
    if (this.cache.has('capacitor')) {
      return this.cache.get('capacitor');
    }

    let capacitorConfig = null;
    const configPaths = [
      'capacitor.config.ts',
      'capacitor.config.js',
      'capacitor.config.json'
    ];

    for (const configPath of configPaths) {
      const fullPath = path.join(this.projectRoot, configPath);
      if (fs.existsSync(fullPath)) {
        try {
          if (configPath.endsWith('.ts') || configPath.endsWith('.js')) {
            // Para archivos TS/JS, necesitamos evaluar el contenido
            const content = fs.readFileSync(fullPath, 'utf8');
            const appIdMatch = content.match(/appId:\s*['"`]([^'"`]+)['"`]/);
            const appNameMatch = content.match(/appName:\s*['"`]([^'"`]+)['"`]/);
            
            capacitorConfig = {
              appId: appIdMatch ? appIdMatch[1] : null,
              appName: appNameMatch ? appNameMatch[1] : null,
              configFile: configPath
            };
          } else {
            capacitorConfig = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            capacitorConfig.configFile = configPath;
          }
          break;
        } catch (error) {
          console.warn(`Error leyendo ${configPath}:`, error.message);
        }
      }
    }

    this.cache.set('capacitor', capacitorConfig);
    return capacitorConfig;
  }

  // Detectar configuración de Android
  detectAndroidConfig() {
    if (this.cache.has('android')) {
      return this.cache.get('android');
    }

    const androidConfig = {
      available: false,
      buildGradle: null,
      keystore: null,
      applicationId: null
    };

    const androidDir = path.join(this.projectRoot, 'android');
    if (fs.existsSync(androidDir)) {
      androidConfig.available = true;

      // Leer build.gradle
      const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
      if (fs.existsSync(buildGradlePath)) {
        const buildGradleContent = fs.readFileSync(buildGradlePath, 'utf8');
        const appIdMatch = buildGradleContent.match(/applicationId\s*['"`]([^'"`]+)['"`]/);
        
        androidConfig.buildGradle = buildGradlePath;
        androidConfig.applicationId = appIdMatch ? appIdMatch[1] : null;
      }

      // Verificar keystore
      const keystorePaths = [
        path.join(androidDir, 'app', 'release-key.keystore'),
        path.join(androidDir, 'keystore.jks'),
        path.join(androidDir, 'app', 'keystore.jks')
      ];

      for (const keystorePath of keystorePaths) {
        if (fs.existsSync(keystorePath)) {
          androidConfig.keystore = keystorePath;
          break;
        }
      }
    }

    this.cache.set('android', androidConfig);
    return androidConfig;
  }

  // Detectar configuración de CI/CD
  detectCICD() {
    if (this.cache.has('cicd')) {
      return this.cache.get('cicd');
    }

    const cicdConfig = {
      available: [],
      githubActions: null,
      workflows: []
    };

    // GitHub Actions
    const githubDir = path.join(this.projectRoot, '.github', 'workflows');
    if (fs.existsSync(githubDir)) {
      cicdConfig.available.push('github-actions');
      cicdConfig.githubActions = githubDir;
      
      const workflowFiles = fs.readdirSync(githubDir)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));
      
      cicdConfig.workflows = workflowFiles.map(file => ({
        name: file,
        path: path.join(githubDir, file)
      }));
    }

    this.cache.set('cicd', cicdConfig);
    return cicdConfig;
  }

  // Generar configuración completa
  generateConfig() {
    const repository = this.detectRepository();
    const platforms = this.detectPlatforms();
    const capacitor = this.detectCapacitorConfig();
    const android = this.detectAndroidConfig();
    const cicd = this.detectCICD();

    // Información básica de la app
    const appInfo = {
      name: this.packageJson.name,
      displayName: capacitor?.appName || this.packageJson.name,
      id: capacitor?.appId || android?.applicationId || `com.${this.packageJson.name}.app`,
      version: this.packageJson.version,
      description: this.packageJson.description || `Aplicación ${this.packageJson.name}`
    };

    // URLs de descarga dinámicas
    const downloads = this.generateDownloadUrls(repository, appInfo.version);

    // Configuración de build
    const buildConfig = {
      outputDir: this.detectBuildDir(),
      androidDir: platforms.android ? 'android' : null,
      iosDir: platforms.ios ? 'ios' : null,
      distDir: 'dist'
    };

    // Features detectadas automáticamente
    const features = this.detectFeatures();

    return {
      app: appInfo,
      repository,
      platforms,
      capacitor,
      android,
      cicd,
      downloads,
      build: buildConfig,
      features,
      
      // Métodos helper
      getCurrentEnvironment: () => process.env.NODE_ENV === 'production' ? 'production' : 'development',
      
      generateVersionInfo: () => ({
        version: appInfo.version,
        buildDate: new Date().toISOString(),
        buildNumber: Date.now(),
        features,
        releaseNotes: `Nueva versión ${appInfo.version} con mejoras y correcciones`,
        downloads,
        repository: repository.url,
        environment: process.env.NODE_ENV === 'production' ? 'production' : 'development'
      }),

      // Configuración para diferentes herramientas
      generateCapacitorConfig: () => ({
        appId: appInfo.id,
        appName: appInfo.displayName,
        webDir: buildConfig.outputDir
      }),

      // Validar configuración
      validate: () => this.validateConfig(repository, platforms, capacitor, android)
    };
  }

  // Detectar directorio de build
  detectBuildDir() {
    const possibleDirs = ['build', 'dist', 'public'];
    
    // Verificar en package.json scripts
    const buildScript = this.packageJson.scripts?.build;
    if (buildScript) {
      const match = buildScript.match(/--outDir\s+(\w+)|--output-path\s+(\w+)/);
      if (match) {
        return match[1] || match[2];
      }
    }

    // Verificar directorios existentes
    for (const dir of possibleDirs) {
      if (fs.existsSync(path.join(this.projectRoot, dir))) {
        return dir;
      }
    }

    return 'build'; // Default
  }

  // Generar URLs de descarga
  generateDownloadUrls(repository, version) {
    if (!repository.url) {
      return {};
    }

    const baseUrl = `${repository.url}/releases/download/v${version}`;
    
    return {
      android: `${baseUrl}/app-release.apk`,
      androidBundle: `${baseUrl}/app-release.aab`,
      ios: `${baseUrl}/app-release.ipa`,
      windows: `${baseUrl}/${this.packageJson.name}-setup.exe`,
      mac: `${baseUrl}/${this.packageJson.name}.dmg`,
      linux: `${baseUrl}/${this.packageJson.name}.AppImage`
    };
  }

  // Detectar features automáticamente
  detectFeatures() {
    const features = [];
    
    // Analizar dependencias
    const deps = { ...this.packageJson.dependencies, ...this.packageJson.devDependencies };
    
    if (deps.react) features.push('Interfaz React moderna');
    if (deps.firebase) features.push('Integración con Firebase');
    if (deps['@capacitor/local-notifications']) features.push('Notificaciones locales');
    if (deps['@capacitor/push-notifications']) features.push('Notificaciones push');
    if (deps.electron) features.push('Aplicación de escritorio');
    if (deps.tailwindcss) features.push('Diseño con Tailwind CSS');
    
    // Analizar scripts
    const scripts = this.packageJson.scripts || {};
    if (scripts.test) features.push('Suite de tests automatizados');
    if (scripts.build) features.push('Build de producción optimizado');
    
    // Analizar estructura de archivos
    if (fs.existsSync(path.join(this.projectRoot, 'src', 'services'))) {
      features.push('Arquitectura de servicios');
    }
    
    if (fs.existsSync(path.join(this.projectRoot, '.github', 'workflows'))) {
      features.push('CI/CD automatizado');
    }

    // Features por defecto si no se detecta nada
    if (features.length === 0) {
      features.push('Aplicación multiplataforma', 'Interfaz moderna', 'Auto-actualización');
    }

    return features;
  }

  // Validar configuración
  validateConfig(repository, platforms, capacitor, android) {
    const issues = [];
    const warnings = [];

    // Validar repositorio
    if (!repository.autoDetected) {
      issues.push('No se pudo detectar información del repositorio automáticamente');
    }

    // Validar Capacitor
    if (platforms.capacitor && !capacitor) {
      warnings.push('Capacitor está instalado pero no se encontró configuración');
    }

    // Validar Android
    if (platforms.android && !android.applicationId) {
      warnings.push('Directorio Android existe pero no se pudo detectar applicationId');
    }

    return {
      valid: issues.length === 0,
      issues,
      warnings
    };
  }

  // Limpiar cache
  clearCache() {
    this.cache.clear();
  }

  // Actualizar configuración en tiempo real
  refresh() {
    this.clearCache();
    this.packageJson = this.loadPackageJson();
    return this.generateConfig();
  }
}

module.exports = DynamicConfig;