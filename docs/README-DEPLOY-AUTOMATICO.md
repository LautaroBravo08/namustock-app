# 🚀 Deploy Automático a GitHub

Este documento explica cómo usar el sistema de deploy automático que construye, sincroniza y sube el APK a GitHub Releases con un solo comando.

## 📋 Requisitos Previos

### 1. GitHub CLI
```bash
# Instalar GitHub CLI
# Windows: https://cli.github.com/
# O usar winget:
winget install GitHub.cli

# Autenticarse
gh auth login
```

### 2. Verificar configuración
```bash
# Verificar que todo esté configurado
gh auth status
node --version
npm --version
```

## 🎯 Comandos Principales

### Deploy Rápido (Recomendado)
```bash
# Deploy patch (1.0.0 → 1.0.1)
npm run quick:deploy

# Deploy minor (1.0.0 → 1.1.0)  
npm run quick:deploy:minor

# Deploy major (1.0.0 → 2.0.0)
npm run quick:deploy:major
```

### Deploy Completo con Opciones
```bash
# Deploy automático con limpieza
npm run deploy:github

# Deploy minor con limpieza
npm run deploy:github:minor

# Deploy major con limpieza
npm run deploy:github:major

# Deploy como draft (no publicado)
npm run deploy:github:draft
```

### Deploy Manual con Control
```bash
# Con confirmación manual
npm run release:github

# Minor con confirmación
npm run release:github:minor

# Major con confirmación
npm run release:github:major
```

## 🔧 Lo que hace cada comando

### `npm run quick:deploy`
1. ✅ Verifica dependencias (Node, npm, GitHub CLI)
2. 🧹 Limpia archivos antiguos automáticamente
3. 📝 Actualiza versión en todos los archivos
4. 📤 Commitea y pushea cambios
5. 🔨 Construye React + Capacitor + APK
6. 📦 Prepara archivos para release
7. 🚀 Crea release en GitHub con APK
8. 🎉 Muestra resumen y enlaces

### Archivos que se actualizan automáticamente:
- `package.json` - Versión principal
- `public/version.json` - Información de versión para actualizaciones
- `src/services/updateService.js` - Versión hardcodeada
- `src/components/UserMenu.js` - Versión en UI
- `.env.production` - Variables de entorno

## 📱 Proceso Completo

```bash
# Ejemplo de uso típico
npm run quick:deploy

# Salida esperada:
🚀 Iniciando deploy automático completo a GitHub...
🔍 Verificando dependencias...
✅ Node.js: v18.x.x, npm: 9.x.x
✅ GitHub CLI instalado
✅ GitHub CLI autenticado correctamente
✅ Gradle disponible para Android

📝 Actualizando versión en archivos...
✅ package.json actualizado
✅ version.json actualizado
✅ updateService.js actualizado

📤 Commiteando y pusheando cambios...
✅ Cambios commiteados y pusheados

🔨 Construyendo aplicación completa...
✅ Construcción de React completado
✅ Sincronización de Capacitor completado
✅ Construcción de APK Release completado

📦 Preparando archivos para release...
✅ APK copiado: releases/namustock-1.0.67.apk
ℹ️ Tamaño del APK: 8.45 MB

🚀 Creando release en GitHub...
✅ Release v1.0.67 creado exitosamente en GitHub

🎉 Deploy completado exitosamente!
```

## 🔗 URLs Generadas

Después del deploy, tendrás acceso a:

- **Release**: `https://github.com/LautaroBravo08/namustock-app/releases/tag/v1.0.67`
- **Descarga directa**: `https://github.com/LautaroBravo08/namustock-app/releases/download/v1.0.67/namustock-1.0.67.apk`
- **Repositorio**: `https://github.com/LautaroBravo08/namustock-app`

## 🎛️ Opciones Avanzadas

### Usar el script directamente
```bash
# Con todas las opciones
node auto-deploy-github.js patch --clean --auto --draft

# Opciones disponibles:
# --clean: Limpia archivos antiguos
# --auto: Sin confirmación manual
# --draft: Crea como draft (no publicado)
```

### Ver ayuda completa
```bash
node auto-deploy-github.js help
```

## 🔄 Actualizaciones Automáticas

Una vez que el release esté publicado:

1. **Las apps existentes** detectarán automáticamente la nueva versión
2. **Se descargará** el APK en segundo plano
3. **Los usuarios recibirán** una notificación para instalar
4. **La instalación** se realizará automáticamente

## 🐛 Solución de Problemas

### Error: GitHub CLI no autenticado
```bash
gh auth login
# Seguir las instrucciones
```

### Error: Gradle no encontrado
```bash
# Verificar que Android SDK esté instalado
cd android
./gradlew --version
```

### Error: APK no generado
```bash
# Limpiar y reconstruir
npm run deploy:github -- --clean
```

### Error: Permisos de repositorio
- Verificar que tengas permisos de escritura en el repositorio
- Verificar que el repositorio remoto esté configurado correctamente

## 📊 Estructura de Archivos

```
proyecto/
├── auto-deploy-github.js     # Script principal de deploy
├── deploy-quick.js           # Script rápido simplificado
├── releases/                 # APKs generados
│   └── namustock-1.0.67.apk
├── android/                  # Proyecto Android
│   └── app/build/outputs/apk/release/
└── public/version.json       # Info de versión para updates
```

## 🎯 Flujo de Trabajo Recomendado

1. **Desarrollo**: Hacer cambios en el código
2. **Testing**: Probar localmente con `npm start`
3. **Deploy**: Ejecutar `npm run quick:deploy`
4. **Verificación**: Comprobar el release en GitHub
5. **Testing móvil**: Descargar e instalar el APK
6. **Monitoreo**: Verificar que las actualizaciones automáticas funcionen

## 🚨 Notas Importantes

- **Siempre hacer backup** antes de un deploy major
- **Probar el APK** en un dispositivo real antes de publicar
- **Los releases draft** no activan actualizaciones automáticas
- **Las versiones se incrementan automáticamente** según el tipo especificado
- **Los commits se hacen automáticamente** con mensajes descriptivos

---

*Última actualización: 29 de julio de 2025*