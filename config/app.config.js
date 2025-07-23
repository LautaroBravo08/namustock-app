// Configuración centralizada de la aplicación
// Este archivo elimina el hardcode y centraliza toda la configuración

const fs = require('fs');
const path = require('path');

// Leer package.json para obtener información base
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));

const config = {
  // Información básica de la app
  app: {
    name: packageJson.name,
    displayName: "NamuStock App",
    id: "com.namustock.app",
    version: packageJson.version,
    description: packageJson.description || "Sistema de gestión de inventario y ventas"
  },

  // Configuración de repositorio (auto-detectada)
  repository: (() => {
    // Intentar detectar automáticamente
    try {
      const { execSync } = require('child_process');
      const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
      const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/);
      
      if (match) {
        return {
          owner: match[1],
          name: match[2],
          branch: "main",
          autoDetected: true,
          get url() {
            return `https://github.com/${this.owner}/${this.name}`;
          },
          get apiUrl() {
            return `https://api.github.com/repos/${this.owner}/${this.name}`;
          }
        };
      }
    } catch (error) {
      // Fallback si no se puede detectar
    }
    
    // Fallback manual (actualiza estos valores si la detección automática falla)
    return {
      owner: "LautaroBravo08", // Cambiar por tu usuario de GitHub
      name: "namustock-app",   // Cambiar por el nombre de tu repo
      branch: "main",
      autoDetected: false,
      get url() {
        return `https://github.com/${this.owner}/${this.name}`;
      },
      get apiUrl() {
        return `https://api.github.com/repos/${this.owner}/${this.name}`;
      }
    };
  })(),

  // URLs de descarga dinámicas
  downloads: {
    get android() {
      return `${config.repository.url}/releases/download/v${config.app.version}/app-release.apk`;
    },
    get ios() {
      return `${config.repository.url}/releases/download/v${config.app.version}/app-release.ipa`;
    },
    get windows() {
      return `${config.repository.url}/releases/download/v${config.app.version}/namustock-app-setup.exe`;
    },
    get mac() {
      return `${config.repository.url}/releases/download/v${config.app.version}/namustock-app.dmg`;
    },
    get linux() {
      return `${config.repository.url}/releases/download/v${config.app.version}/namustock-app.AppImage`;
    }
  },

  // Configuración de build
  build: {
    outputDir: "build",
    androidDir: "android",
    iosDir: "ios",
    distDir: "dist"
  },

  // Configuración de versioning
  versioning: {
    types: ['patch', 'minor', 'major'],
    defaultType: 'patch',
    autoIncrement: true
  },

  // Configuración de releases
  release: {
    autoCreate: true,
    includePrereleases: false,
    generateNotes: true,
    assets: [
      {
        name: "app-release.apk",
        path: "android/app/build/outputs/apk/release/app-release.apk",
        platform: "android"
      },
      {
        name: "app-release.aab",
        path: "android/app/build/outputs/bundle/release/app-release.aab",
        platform: "android"
      }
    ]
  },

  // Features de la aplicación (se actualizan automáticamente)
  features: [
    "Sistema de inventario completo",
    "Gestión de ventas",
    "Análisis de productos",
    "Notificaciones automáticas",
    "Auto-actualización mejorada",
    "Validaciones de formularios",
    "Soporte multiplataforma"
  ],

  // Configuración de notificaciones
  notifications: {
    updateAvailable: {
      title: "Nueva actualización disponible",
      body: "Una nueva versión de {appName} está disponible. ¿Deseas actualizar?",
      actions: ["Actualizar", "Más tarde"]
    },
    updateDownloaded: {
      title: "Actualización descargada",
      body: "La nueva versión está lista para instalar. Se aplicará al reiniciar la aplicación.",
      actions: ["Reiniciar ahora", "Más tarde"]
    }
  },

  // Configuración de entornos
  get environments() {
    return {
      development: {
        apiUrl: "http://localhost:3000",
        debug: true,
        autoUpdate: false
      },
      production: {
        apiUrl: this.repository.url,
        debug: false,
        autoUpdate: true
      }
    };
  },

  // Métodos helper
  getCurrentEnvironment() {
    return process.env.NODE_ENV === 'production' ? 'production' : 'development';
  },

  getEnvironmentConfig() {
    return this.environments[this.getCurrentEnvironment()];
  },

  // Generar configuración para Capacitor
  generateCapacitorConfig() {
    return {
      appId: this.app.id,
      appName: this.app.displayName,
      webDir: this.build.outputDir,
      server: {
        androidScheme: 'https'
      }
    };
  },

  // Generar información de versión
  generateVersionInfo() {
    return {
      version: this.app.version,
      buildDate: new Date().toISOString(),
      buildNumber: Date.now(),
      features: this.features,
      releaseNotes: `Nueva versión ${this.app.version} con mejoras y correcciones`,
      downloads: this.downloads,
      repository: this.repository.url,
      environment: this.getCurrentEnvironment()
    };
  }
};

module.exports = config;