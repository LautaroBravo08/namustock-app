# 📱 NamuStock App

Una aplicación móvil completa para gestión de inventario y ventas, desarrollada con React, Capacitor y Firebase.

## 🚀 Características Principales

- **📦 Gestión de Inventario**: Control completo de productos con imágenes
- **💰 Sistema de Ventas**: Registro y seguimiento de ventas
- **🖼️ Imágenes Optimizadas**: Sistema de chunks sin límites de peso
- **🔄 Actualizaciones Automáticas**: Sistema de updates in-app
- **📱 Multiplataforma**: Android e iOS con Capacitor
- **🔥 Firebase Backend**: Firestore para datos y autenticación
- **🎨 UI Moderna**: Interfaz responsive con Tailwind CSS

## 📋 Versión Actual

**v1.1.0** - [Descargar APK](https://github.com/LautaroBravo08/namustock-app/releases/latest)

## 🛠️ Tecnologías

- **Frontend**: React 18, Tailwind CSS
- **Mobile**: Capacitor 7
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Build**: Gradle, Android SDK
- **Deploy**: GitHub CLI, Automated releases

## ⚡ Inicio Rápido

### Desarrollo Local
```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm start

# Build para producción
npm run build
```

### Deploy Automático
```bash
# Deploy rápido (patch)
npm run quick:deploy

# Deploy minor
npm run quick:deploy:minor

# Deploy major
npm run quick:deploy:major
```

## 📚 Documentación

- **[Deploy Automático](docs/README-DEPLOY-AUTOMATICO.md)** - Guía completa de deploy
- **[Actualizaciones In-App](docs/README-ACTUALIZACIONES-IN-APP.md)** - Sistema de updates
- **[Desarrollo](docs/README-DESARROLLO.md)** - Guía para desarrolladores
- **[Notificaciones](docs/README-NOTIFICACIONES.md)** - Sistema de notificaciones
- **[Historial del Proyecto](HISTORIAL-PROYECTO.md)** - Registro de cambios

## 🔧 Scripts Disponibles

### Desarrollo
- `npm start` - Servidor de desarrollo
- `npm run build` - Build de producción
- `npm run android` - Abrir en Android Studio
- `npm run ios` - Abrir en Xcode

### Deploy y Release
- `npm run quick:deploy` - Deploy automático patch
- `npm run quick:deploy:minor` - Deploy automático minor
- `npm run quick:deploy:major` - Deploy automático major
- `npm run deploy:github:draft` - Deploy como borrador

### Utilidades
- `npm run cleanup` - Limpiar archivos antiguos
- `npm run dev` - Scripts de desarrollo

## 📱 Instalación

### Android
1. Descarga el APK desde [GitHub Releases](https://github.com/LautaroBravo08/namustock-app/releases/latest)
2. Habilita "Fuentes desconocidas" en Configuración → Seguridad
3. Instala el APK descargado

### Actualizaciones Automáticas
La app detecta automáticamente nuevas versiones y se actualiza en segundo plano.

## 🏗️ Estructura del Proyecto

```
namustock-app/
├── src/                    # Código fuente React
│   ├── components/         # Componentes reutilizables
│   ├── pages/             # Páginas principales
│   ├── services/          # Servicios (Firebase, updates)
│   ├── hooks/             # Custom hooks
│   └── utils/             # Utilidades
├── android/               # Proyecto Android (Capacitor)
├── ios/                   # Proyecto iOS (Capacitor)
├── public/                # Archivos públicos
├── docs/                  # Documentación
├── releases/              # APKs generados
├── auto-deploy-github.js  # Script de deploy automático
├── deploy-quick.js        # Script de deploy rápido
└── cleanup-apks.js        # Script de limpieza
```

## 🔥 Firebase Configuración

El proyecto utiliza Firebase para:
- **Firestore**: Base de datos de productos y ventas
- **Authentication**: Sistema de usuarios
- **Storage**: Almacenamiento de imágenes (opcional)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está bajo licencia propietaria.

## 📞 Contacto

- **Desarrollador**: LautaroBravo08
- **GitHub**: [LautaroBravo08](https://github.com/LautaroBravo08)
- **Repositorio**: [namustock-app](https://github.com/LautaroBravo08/namustock-app)

## 🎯 Roadmap

- [ ] Versión iOS
- [ ] Dashboard web
- [ ] Reportes avanzados
- [ ] Integración con APIs de terceros
- [ ] Modo offline mejorado

---

*Última actualización: 30 de julio de 2025*