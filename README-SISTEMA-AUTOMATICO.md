# 🚀 Sistema de Actualizaciones Automático - Sin Hardcode

Este sistema elimina completamente el hardcode y automatiza todo el proceso de releases para tu app Ionic + Capacitor.

## ✨ Características Principales

- 🔧 **Configuración automática** - Detecta tu repositorio y configura todo automáticamente
- 🔐 **Keystore automático** - Genera y configura keystores para Android sin intervención manual
- 📦 **Versioning inteligente** - Actualiza automáticamente todas las versiones en todos los archivos
- 🤖 **GitHub Actions** - CI/CD completamente automatizado
- 🌐 **URLs dinámicas** - Todas las URLs se generan automáticamente basadas en tu repositorio
- 📱 **Multi-plataforma** - Soporte para Android, iOS, Web, Windows, macOS y Linux

## 🚀 Configuración Inicial (Una sola vez)

### 1. Configuración Automática Completa

```bash
# Ejecuta la configuración automática
npm run setup:complete
```

Este comando:
- ✅ Detecta automáticamente tu repositorio de GitHub
- ✅ Configura todas las URLs dinámicamente
- ✅ Genera keystore para Android (si Java está disponible)
- ✅ Crea todos los archivos de configuración necesarios
- ✅ Actualiza scripts de npm

### 2. Configurar GitHub Secrets (Solo para Android firmado)

Si quieres que tus APKs estén firmados automáticamente:

1. Ve a tu repositorio en GitHub
2. **Settings** > **Secrets and variables** > **Actions**
3. Agrega estos secrets:

```
KEYSTORE_FILE: [contenido base64 del keystore]
KEYSTORE_PASSWORD: [contraseña del keystore]
KEY_ALIAS: [alias de la clave]
KEY_PASSWORD: [contraseña de la clave]
```

💡 **Obtener el contenido base64:**
```bash
# Windows
certutil -encode android/app/release-key.keystore keystore.txt

# macOS/Linux
base64 -i android/app/release-key.keystore | pbcopy
```

## 🎯 Uso Diario

### Crear un Release Automático

```bash
# Release patch (1.0.0 → 1.0.1)
npm run release:auto

# Release minor (1.0.0 → 1.1.0)
npm run release:auto minor

# Release major (1.0.0 → 2.0.0)
npm run release:auto major
```

Este comando hace **TODO automáticamente**:
1. 🧪 Ejecuta tests
2. 📦 Actualiza versión en todos los archivos
3. 🏗️ Build de producción
4. 📱 Sincroniza Capacitor
5. 📝 Crea commit y tag
6. ⬆️ Push al repositorio
7. 🤖 GitHub Actions construye APK/AAB automáticamente
8. 📋 Crea release en GitHub con notas automáticas

### Comandos Útiles

```bash
# Verificar estado del sistema
npm run check:system

# Solo actualizar versión (sin release)
npm run version:patch
npm run version:minor
npm run version:major

# Verificar keystore de Android
npm run keystore:check

# Generar nuevo keystore
npm run keystore:generate

# Detectar configuración del entorno
npm run env:detect
```

## 📁 Estructura del Sistema

```
├── config/
│   └── app.config.js          # Configuración centralizada (sin hardcode)
├── scripts/
│   ├── auto-setup.js          # Configuración automática completa
│   ├── environment-detector.js # Detección automática del entorno
│   ├── keystore-manager.js    # Gestión automática de keystores
│   ├── version-manager.js     # Gestión automática de versiones
│   └── release-manager.js     # Gestión automática de releases
├── .github/workflows/
│   └── release.yml            # CI/CD automático
└── public/
    └── version.json           # Información de versión (auto-generado)
```

## 🔧 Configuración Avanzada

### Personalizar la Configuración

Edita `config/app.config.js` para personalizar:

```javascript
const config = {
  app: {
    displayName: "Tu App Name",
    id: "com.tuempresa.tuapp"
  },
  
  features: [
    "Tu característica 1",
    "Tu característica 2"
  ],
  
  // Todo lo demás se configura automáticamente
};
```

### Configuración de Entornos

El sistema detecta automáticamente si estás en desarrollo o producción:

- **Desarrollo**: Auto-actualización deshabilitada, debug habilitado
- **Producción**: Auto-actualización habilitada, debug deshabilitado

## 🤖 GitHub Actions

El workflow se ejecuta automáticamente cuando:
- Haces push de un tag (`v*`)
- Ejecutas manualmente desde GitHub Actions

### Proceso Automático:

1. 🔍 **Detección**: Lee configuración de `app.config.js`
2. 🧪 **Tests**: Ejecuta tests automáticamente
3. 🏗️ **Build**: Construye la app web
4. 🔐 **Firma**: Firma APK/AAB si hay keystore configurado
5. 📦 **Artefactos**: Genera APK y AAB
6. 📋 **Release**: Crea release con notas automáticas
7. 🔄 **Actualización**: Actualiza `version.json` con URLs reales

## 📱 Sistema de Actualizaciones

### Para Usuarios

Los usuarios reciben automáticamente:
- 🔔 Notificaciones de nuevas versiones
- 📥 Descarga automática en segundo plano
- 🔄 Instalación al reiniciar la app

### URLs Dinámicas

Todas las URLs se generan automáticamente:

```javascript
// Se generan automáticamente basadas en tu repositorio
downloads: {
  android: "https://github.com/TU_USUARIO/TU_REPO/releases/download/v1.0.0/app-release.apk",
  ios: "https://github.com/TU_USUARIO/TU_REPO/releases/download/v1.0.0/app-release.ipa",
  // etc...
}
```

## 🐛 Solución de Problemas

### Verificar Sistema
```bash
npm run check:system
```

### Problemas Comunes

**❌ "Git no configurado"**
```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@email.com"
```

**❌ "Java no encontrado"**
- Instala Java JDK 17+
- Verifica: `java -version`

**❌ "Keystore no encontrado"**
```bash
npm run keystore:generate
```

**❌ "GitHub Actions falla"**
- Verifica que los secrets estén configurados
- Revisa los logs en GitHub Actions

## 🎉 Ventajas de Este Sistema

### ✅ Sin Hardcode
- Todas las URLs se generan automáticamente
- Configuración centralizada en un solo archivo
- Detección automática del repositorio

### ✅ Completamente Automático
- Un solo comando para hacer release completo
- GitHub Actions maneja todo el CI/CD
- Usuarios reciben actualizaciones automáticamente

### ✅ Seguro y Confiable
- Keystores generados automáticamente
- Firma automática de APKs
- Secrets manejados por GitHub

### ✅ Escalable
- Soporte multi-plataforma
- Fácil de mantener y extender
- Configuración por entornos

## 📚 Comandos de Referencia Rápida

```bash
# Configuración inicial (una vez)
npm run setup:complete

# Release completo automático
npm run release:auto [patch|minor|major]

# Solo actualizar versión
npm run version:patch

# Verificar todo
npm run check:system

# Gestión de keystore
npm run keystore:check
npm run keystore:generate

# Testing de actualizaciones
npm run test:updates
npm run test:android-updates
```

## 🚀 ¡Listo para Usar!

Con este sistema, crear releases es tan simple como:

```bash
npm run release:auto
```

¡Y todo lo demás se maneja automáticamente! 🎉