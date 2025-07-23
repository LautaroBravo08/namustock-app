# 🚀 Sistema de Actualizaciones Automáticas

Este documento explica el sistema de actualizaciones automáticas implementado para la aplicación NamuStock, completamente **sin hardcode** y totalmente configurable.

## 📋 Características Principales

- ✅ **Sin hardcode**: Toda la configuración está centralizada
- ✅ **Multiplataforma**: Android, iOS, Web, Desktop
- ✅ **Automático**: GitHub Actions maneja todo el proceso
- ✅ **Configurable**: Fácil personalización para cualquier proyecto
- ✅ **Notificaciones**: Los usuarios reciben avisos automáticamente
- ✅ **Rollback**: Posibilidad de revertir cambios si es necesario

## 🏗️ Arquitectura del Sistema

```
config/
├── app.config.js          # Configuración centralizada (SIN HARDCODE)

scripts/
├── version-manager.js     # Gestión automática de versiones
├── release-manager.js     # Creación automática de releases
└── setup-environment.js   # Configuración inicial del entorno

.github/workflows/
└── release.yml           # GitHub Actions para build automático

src/services/
└── updateService.js      # Servicio de actualizaciones en la app

public/
└── version.json          # Información de versión (generado automáticamente)
```

## 🚀 Uso Rápido

### 1. Configuración Inicial

```bash
# Configurar el entorno automáticamente
npm run setup:environment

# O manualmente:
node scripts/setup-environment.js
```

### 2. Actualizar Versión y Crear Release

```bash
# Actualización patch (1.0.0 → 1.0.1)
npm run release:patch

# Actualización minor (1.0.0 → 1.1.0)
npm run release:minor

# Actualización major (1.0.0 → 2.0.0)
npm run release:major

# Modo dry-run (solo simular)
npm run release:dry-run
```

### 3. Solo Actualizar Versión (sin release)

```bash
npm run version:patch
npm run version:minor
npm run version:major
```

## ⚙️ Configuración Personalizada

### Editar `config/app.config.js`

```javascript
const config = {
  // Información de tu aplicación
  app: {
    name: "tu-app-name",
    displayName: "Tu App Display Name",
    id: "com.tudominio.tuapp",
    version: packageJson.version
  },

  // Tu repositorio de GitHub
  repository: {
    owner: "tu-usuario-github",
    name: "tu-repositorio",
    branch: "main"
  },

  // Características de tu app
  features: [
    "Tu característica 1",
    "Tu característica 2",
    // ...
  ]
};
```

## 🔄 Flujo de Trabajo Automático

1. **Desarrollador ejecuta**: `npm run release:patch`
2. **Script automáticamente**:
   - Actualiza versión en todos los archivos
   - Ejecuta tests
   - Crea build de producción
   - Sincroniza Capacitor
   - Crea commit y tag
   - Sube cambios a GitHub
3. **GitHub Actions automáticamente**:
   - Construye APK/AAB para Android
   - Crea release en GitHub
   - Sube archivos de instalación
4. **Usuarios automáticamente**:
   - Reciben notificación de actualización
   - Pueden descargar e instalar nueva versión

## 📱 Integración en la Aplicación

### Importar el servicio de actualizaciones

```javascript
import updateService from './services/updateService';

// Verificar actualizaciones manualmente
const status = await updateService.checkForUpdates();

// Escuchar eventos de actualización
window.addEventListener('updateAvailable', (event) => {
  const { currentVersion, newVersion, downloadUrl } = event.detail;
  // Mostrar UI de actualización
});

// Descargar actualización
await updateService.downloadUpdate();
```

### Configurar notificaciones automáticas

El servicio se inicia automáticamente en producción y verifica actualizaciones cada 30 minutos.

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run setup:environment` | Configuración inicial completa |
| `npm run version:patch` | Actualizar versión patch |
| `npm run version:minor` | Actualizar versión minor |
| `npm run version:major` | Actualizar versión major |
| `npm run release:patch` | Release completo patch |
| `npm run release:minor` | Release completo minor |
| `npm run release:major` | Release completo major |
| `npm run release:dry-run` | Simular release sin ejecutar |

## 🔧 Archivos que se Actualizan Automáticamente

- `package.json` - Versión de npm
- `public/version.json` - Información de versión para la app
- `.env.production` - Variables de entorno
- `capacitor.config.ts` - Configuración de Capacitor
- `android/app/build.gradle` - Versión Android
- `public/sw.js` - Service Worker (si existe)

## 🌍 Variables de Entorno

### `.env.production`
```env
REACT_APP_VERSION=1.0.30
REACT_APP_BUILD_DATE=2025-01-23T00:00:00.000Z
REACT_APP_ENVIRONMENT=production
REACT_APP_AUTO_UPDATE=true
REACT_APP_REPOSITORY_URL=https://github.com/tu-usuario/tu-repo
```

### `.env.local` (desarrollo)
```env
REACT_APP_VERSION=1.0.30
REACT_APP_ENVIRONMENT=development
REACT_APP_AUTO_UPDATE=false
REACT_APP_DEBUG=true
```

## 🔐 Configuración de GitHub

### Secrets necesarios (automáticos)
- `GITHUB_TOKEN` - Se genera automáticamente

### Permisos requeridos
- Contents: Write (para crear releases)
- Actions: Write (para ejecutar workflows)

## 📦 Distribución

### Android
- **APK**: Descarga directa desde GitHub Releases
- **AAB**: Para subir a Google Play Store

### Otras plataformas
- **iOS**: IPA (requiere certificados de Apple)
- **Windows**: Ejecutable .exe
- **macOS**: Archivo .dmg
- **Linux**: AppImage

## 🐛 Solución de Problemas

### Error: "Git no configurado"
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

### Error: "Java no encontrado"
```bash
# Instalar Java 17
# Windows: Descargar desde Oracle o usar Chocolatey
choco install openjdk17

# macOS: Usar Homebrew
brew install openjdk@17

# Linux: Usar package manager
sudo apt install openjdk-17-jdk
```

### Error: "Android SDK no encontrado"
```bash
# Instalar Android Studio o solo SDK
# Configurar ANDROID_HOME en variables de entorno
```

## 🚀 Migración desde Sistema Anterior

Si tienes un sistema de actualizaciones existente:

1. **Respalda** tus archivos actuales
2. **Ejecuta** `npm run setup:environment`
3. **Personaliza** `config/app.config.js`
4. **Prueba** con `npm run release:dry-run`
5. **Ejecuta** tu primer release: `npm run release:patch`

## 📈 Monitoreo y Analytics

El sistema registra automáticamente:
- Versiones instaladas
- Fechas de actualización
- Errores de descarga
- Estadísticas de uso

## 🤝 Contribuir

Para contribuir al sistema de actualizaciones:

1. Fork el repositorio
2. Crea una rama: `git checkout -b feature/mejora`
3. Realiza cambios
4. Ejecuta tests: `npm test`
5. Crea Pull Request

## 📄 Licencia

Este sistema de actualizaciones está incluido bajo la misma licencia del proyecto principal.

---

**¿Necesitas ayuda?** Crea un [issue en GitHub](https://github.com/LautaroBravo08/namustock-app/issues) 🚀