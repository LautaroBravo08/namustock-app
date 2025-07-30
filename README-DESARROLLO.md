# 🚀 NamuStock App - Desarrollo Multiplataforma

## 📋 Plataformas Soportadas

✅ **Web** - React App (localhost:3000)  
✅ **Desktop** - Electron (Windows, macOS, Linux)  
✅ **Mobile** - Capacitor (Android, iOS)  

## 🛠️ Comandos de Desarrollo

### Desarrollo Rápido
```bash
# Script interactivo con todas las opciones
npm run dev

# Desarrollo web
npm start

# Desarrollo desktop
npm run dev:electron

# Desarrollo móvil
npm run dev:android
npm run dev:ios
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

## 📱 Configuración por Plataforma

### Web
- Puerto: `http://localhost:3000`
- Build: `npm run build` → carpeta `build/`

### Desktop (Electron)
- Configuración: `public/electron.js`
- Distribución: `dist/` folder
- Soporte: Windows (.exe), macOS (.dmg), Linux (.AppImage)

### Mobile (Capacitor)
- Android: `android/` folder
- iOS: `ios/` folder
- Configuración: `capacitor.config.ts`

## 🔧 Estructura del Proyecto

```
namustock-app/
├── src/                    # Código React compartido
├── public/
│   ├── electron.js        # Proceso principal Electron
│   └── index.html         # HTML base
├── android/               # Proyecto Android nativo
├── ios/                   # Proyecto iOS nativo
├── build/                 # Build web (generado)
├── dist/                  # Instaladores desktop (generado)
├── capacitor.config.ts    # Configuración Capacitor
├── package.json           # Scripts y dependencias
└── dev-scripts.js         # Script de desarrollo interactivo
```

## 🚀 Flujo de Desarrollo

1. **Desarrollo**: Usa `npm run dev` para elegir plataforma
2. **Testing**: Prueba en web primero, luego desktop/móvil
3. **Build**: `npm run build:all` para generar todas las versiones
4. **Distribución**: 
   - Desktop: Instaladores en `dist/`
   - Móvil: APK/IPA desde Android Studio/Xcode

## 📦 Dependencias Clave

- **React**: UI compartida
- **Electron**: Desktop wrapper
- **Capacitor**: Mobile wrapper
- **Firebase**: Backend (auth, database)
- **Tailwind**: Estilos responsivos

## 🔄 Sincronización

Cuando cambies código:
1. Los cambios se reflejan automáticamente en web
2. Desktop requiere reiniciar Electron
3. Móvil requiere `npm run cap:build` y rebuild en IDE

## 🐛 Troubleshooting

### Electron no inicia
```bash
npm run clean-install
```

### Capacitor out of sync
```bash
npx cap sync
```

### Build errors
```bash
npm run clean
npm install
npm run build
```

## 📋 Checklist Pre-Release

- [ ] Web funciona en localhost
- [ ] Desktop builds sin errores
- [ ] Android compila en Android Studio
- [ ] iOS compila en Xcode
- [ ] Firebase configurado correctamente
- [ ] Iconos y splash screens actualizados