# 🚀 Guía Multiplataforma - NamuStock App

Tu aplicación está configurada para ejecutarse en **todas las plataformas**:

## 📱 Plataformas Soportadas
- ✅ **Web** (navegador)
- ✅ **Android** (nativo)
- ✅ **iOS** (nativo)
- ✅ **Windows** (desktop)
- ✅ **macOS** (desktop)
- ✅ **Linux** (desktop)

## 🛠️ Comandos de Desarrollo

### Web (Desarrollo)
```bash
npm run dev:web          # Servidor de desarrollo web
npm start               # Alias para desarrollo web
```

### Desktop (Electron)
```bash
npm run dev:electron    # Desarrollo con hot reload
npm run preview:electron # Vista previa de producción
```

### Móvil (Capacitor)
```bash
npm run dev:android     # Abrir Android Studio
npm run dev:ios         # Abrir Xcode
npm run build:mobile    # Sincronizar cambios móvil
```

## 📦 Comandos de Construcción

### Desktop
```bash
npm run dist:windows    # Ejecutable Windows (.exe)
npm run dist:mac        # Aplicación macOS (.dmg)
npm run dist:linux      # AppImage Linux
npm run dist:all        # Todas las plataformas desktop
```

### Móvil
```bash
npm run open:android    # Abrir proyecto Android
npm run open:ios        # Abrir proyecto iOS
```

### Todo
```bash
npm run build:all       # Web + sincronizar móvil
npm run test:all        # Construir y probar todo
```

## 🔧 Flujo de Desarrollo Recomendado

### 1. Desarrollo Principal (Web)
```bash
npm run dev:web
```
Desarrolla y prueba todas las funcionalidades en el navegador.

### 2. Prueba Desktop
```bash
npm run dev:electron
```
Verifica que funcione correctamente en desktop.

### 3. Prueba Móvil
```bash
npm run build:mobile
npm run open:android    # o open:ios
```

## 📋 Checklist Pre-Deploy

- [ ] Funciona en web (`npm run dev:web`)
- [ ] Funciona en desktop (`npm run dev:electron`)
- [ ] Build exitoso (`npm run build`)
- [ ] Sincronización móvil (`npm run build:mobile`)
- [ ] Prueba en Android Studio
- [ ] Prueba en Xcode (si tienes Mac)

## 🚨 Solución de Problemas

### Error de sincronización móvil
```bash
npm run clean-install
```

### Error de Electron
```bash
npm run build
npm run preview:electron
```

### Cambios no se reflejan en móvil
```bash
npm run build:mobile
```

## 📁 Estructura de Archivos
```
├── src/                 # Código React compartido
├── public/electron.js   # Proceso principal Electron
├── android/            # Proyecto Android nativo
├── ios/                # Proyecto iOS nativo
├── build/              # Build web (compartido)
└── dist/               # Ejecutables desktop
```

## 🔥 Funcionalidades Multiplataforma
- ✅ Firebase Auth (todas las plataformas)
- ✅ Firestore Database (todas las plataformas)
- ✅ Responsive Design (adaptativo)
- ✅ Notificaciones (web/móvil)
- ✅ Almacenamiento local (todas)
- ✅ Navegación (adaptada por plataforma)

¡Tu app está lista para conquistar todas las plataformas! 🎉