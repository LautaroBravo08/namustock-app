# 🚀 NamuStock App - Sistema de Inventario Multiplataforma

Una aplicación completa de gestión de inventario con actualizaciones automáticas, desarrollada con React y Capacitor.

## ✨ Características Principales

- 📦 **Gestión completa de inventario** - Agregar, editar, eliminar productos con imágenes
- 💰 **Sistema de ventas** - Registro y seguimiento de ventas con análisis
- 🔔 **Notificaciones automáticas** - Alertas de bajo stock y vencimientos diarias
- 🔄 **Actualizaciones automáticas in-app** - Descarga e instalación sin salir de la app
- 🌐 **Multiplataforma** - Web, Android, iOS, Windows, macOS, Linux
- 🔐 **Autenticación segura** - Firebase Auth con verificación de email
- ☁️ **Sincronización en tiempo real** - Firestore Database
- 📸 **Gestión de imágenes optimizada** - Hasta 3 imágenes por producto, compresión automática
- 🧹 **Limpieza automática** - Eliminación de archivos antiguos para ahorrar espacio

## 📱 Plataformas Soportadas

- ✅ **Web** - React App (localhost:3000)
- ✅ **Android** - APK nativo con Capacitor
- ✅ **iOS** - App nativa con Capacitor
- ✅ **Windows** - Aplicación de escritorio con Electron
- ✅ **macOS** - Aplicación de escritorio con Electron
- ✅ **Linux** - Aplicación de escritorio con Electron

## 🚀 Inicio Rápido

### Desarrollo
```bash
# Instalar dependencias
npm install

# Desarrollo web
npm start

# Desarrollo desktop
npm run dev:electron

# Desarrollo móvil
npm run dev:android
npm run dev:ios

# Script interactivo con todas las opciones
npm run dev
```

### Build y Distribución
```bash
# Build para todas las plataformas
npm run build:all

# Desktop específico
npm run dist:windows    # .exe
npm run dist:mac        # .dmg
npm run dist:linux      # .AppImage

# Móvil
npm run cap:build       # Sincroniza con Android Studio/Xcode
```

## 🔄 Sistema de Actualizaciones Automáticas

### Características del Sistema
- **Descarga automática** de APKs dentro de la aplicación
- **Instalación sin fricción** - no necesitas salir de la app
- **Progreso visual en tiempo real** durante la descarga
- **Limpieza automática** de archivos antiguos para ahorrar espacio
- **Plugin nativo Android** optimizado para instalación de APKs
- **Fallbacks seguros** si algo falla

### Cómo Funciona para los Usuarios
1. **Detección automática** - La app verifica nuevas versiones cada 30 minutos
2. **Notificación elegante** - Muestra cuando hay actualización disponible
3. **Actualización en un clic** - Descarga e instala automáticamente
4. **Limpieza automática** - Elimina archivos antiguos después de actualizar

### Para Desarrolladores
```bash
# Crear nueva versión y desplegar
npm run build:deploy:patch    # 1.0.0 → 1.0.1
npm run build:deploy:minor    # 1.0.0 → 1.1.0
npm run build:deploy:major    # 1.0.0 → 2.0.0

# Limpiar archivos antiguos
npm run cleanup              # Mantener 3 APKs más recientes
npm run cleanup:all          # Limpieza completa
npm run cleanup:stats        # Ver estadísticas de espacio

# Probar actualizaciones
npm run test:android-updates # Probar sistema completo
npm run test:update-system   # Verificar todos los componentes
```

## 🔔 Sistema de Notificaciones

### Funcionalidades
- **Notificación diaria** a las 9:00 AM
- **Alertas de bajo stock** cuando los productos están por debajo del stock mínimo
- **Alertas de vencimiento** para productos que vencen en los próximos 7 días
- **Notificaciones inteligentes** que solo se envían cuando hay problemas

### Configuración
1. Ve a **Configuraciones** (⚙️ en la barra superior)
2. En la sección **"Notificaciones de Inventario"**
3. Activa el interruptor
4. Acepta los permisos cuando te los solicite

## 🛠️ Configuración Técnica

### Estructura del Proyecto
```
namustock-app/
├── src/                    # Código React compartido
├── public/
│   ├── electron.js        # Proceso principal Electron
│   └── version.json       # Información de versión
├── android/               # Proyecto Android nativo
├── ios/                   # Proyecto iOS nativo
├── build/                 # Build web (generado)
├── dist/                  # Instaladores desktop (generado)
├── releases/              # APKs generados
└── scripts/               # Scripts de automatización
```

### Variables de Entorno
```bash
# .env.local (desarrollo)
REACT_APP_VERSION=1.0.0
REACT_APP_SIMULATE_UPDATE=false
REACT_APP_UPDATE_CHECK_INTERVAL=1800000  # 30 minutos
REACT_APP_GITHUB_REPO=tu-usuario/tu-repo

# .env.production
REACT_APP_SIMULATE_UPDATE=false
REACT_APP_GITHUB_REPO=LautaroBravo08/namustock-app
```

### Dependencias Clave
- **React** - UI compartida
- **Capacitor** - Wrapper nativo para móvil
- **Electron** - Wrapper para desktop
- **Firebase** - Backend (auth, database)
- **Tailwind CSS** - Estilos responsivos

## 📋 Scripts Disponibles

### Desarrollo
- `npm start` - Servidor de desarrollo web
- `npm run dev` - Script interactivo con todas las opciones
- `npm run dev:electron` - Desarrollo con Electron
- `npm run dev:android` - Abrir Android Studio
- `npm run dev:ios` - Abrir Xcode

### Build y Deploy
- `npm run build` - Build de producción
- `npm run build:deploy:patch` - Build + deploy con versión patch
- `npm run build:deploy:minor` - Build + deploy con versión minor
- `npm run build:deploy:major` - Build + deploy con versión major

### Testing y Mantenimiento
- `npm run test:android-updates` - Probar actualizaciones Android
- `npm run test:update-system` - Verificar sistema completo
- `npm run cleanup` - Limpiar archivos antiguos
- `npm run cleanup:all` - Limpieza completa
- `npm run cleanup:stats` - Estadísticas de espacio

### Utilidades
- `npm run version:patch` - Incrementar versión patch
- `npm run version:minor` - Incrementar versión minor
- `npm run version:major` - Incrementar versión major

## 🔧 Solución de Problemas

### Actualizaciones no funcionan
1. Verifica que `REACT_APP_GITHUB_REPO` esté configurado correctamente
2. Asegúrate de que hay un release más nuevo en GitHub
3. Revisa los permisos de "Fuentes desconocidas" en Android

### Error de compilación
```bash
npm run clean-install  # Limpia e instala dependencias
```

### Capacitor out of sync
```bash
npx cap sync
```

### Electron no inicia
```bash
npm run build
npm run preview:electron
```

## 📊 Flujo de Trabajo Recomendado

### Para Desarrollo Diario
1. Hacer cambios en el código
2. Probar localmente con `npm start`
3. Cuando esté listo: `npm run build:deploy:patch`

### Para Nuevas Características
1. Desarrollar la funcionalidad
2. Probar en todas las plataformas
3. Desplegar con `npm run build:deploy:minor`

### Para Cambios Importantes
1. Implementar cambios breaking
2. Actualizar documentación
3. Desplegar con `npm run build:deploy:major`

## 🎯 Próximos Pasos

1. **Probar el sistema completo**: `npm run test:update-system`
2. **Crear primera versión**: `npm run build:deploy:patch`
3. **Instalar en dispositivo**: Usar APK generado en `releases/`
4. **Verificar actualizaciones**: Probar el flujo completo de actualización

## 📝 Contribuir

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crea un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

---

¡Con este sistema, tus usuarios siempre tendrán la versión más reciente de NamuStock sin complicaciones! 🎉