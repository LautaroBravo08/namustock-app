# NamuStock App - Multiplataforma

Tu aplicación React ahora funciona en **todas las plataformas**:
- 🌐 **Web** (navegador)
- 📱 **Android** (nativo)
- 📱 **iOS** (nativo)
- 💻 **Windows** (Electron)
- 💻 **macOS** (Electron)
- 💻 **Linux** (Electron)

## 🚀 Comandos de Desarrollo

### Web (Desarrollo)
```bash
npm start
```
Abre http://localhost:3000

### Desktop (Electron)
```bash
# Desarrollo
npm run electron

# Solo Electron (después de build)
npm run electron-dev
```

### Android
```bash
# Abrir Android Studio
npm run android

# O paso a paso:
npm run cap:build
npx cap open android
```

### iOS (solo en macOS)
```bash
# Abrir Xcode
npm run ios

# O paso a paso:
npm run cap:build
npx cap open ios
```

## 📦 Compilación para Distribución

### Web
```bash
npm run build
```
Los archivos estarán en `/build`

### Desktop (Electron)
```bash
# Crear instaladores para tu plataforma actual
npm run dist

# Los instaladores estarán en /dist
```

### Móvil
1. **Android**: Usar Android Studio para generar APK/AAB
2. **iOS**: Usar Xcode para generar IPA

## 🔧 Configuración Adicional

### Firebase para Móvil
Tu configuración actual de Firebase funciona en todas las plataformas, pero para móvil puedes optimizar:

1. **Android**: Agregar `google-services.json`
2. **iOS**: Agregar `GoogleService-Info.plist`

### Permisos Móviles
Si necesitas permisos especiales (cámara, almacenamiento, etc.), edita:
- **Android**: `android/app/src/main/AndroidManifest.xml`
- **iOS**: `ios/App/App/Info.plist`

## 📱 Funcionalidades Móviles Adicionales

Puedes agregar plugins de Capacitor para funcionalidades nativas:

```bash
# Cámara
npm install @capacitor/camera

# Almacenamiento
npm install @capacitor/preferences

# Notificaciones push
npm install @capacitor/push-notifications

# Después de instalar plugins:
npx cap sync
```

## 🛠️ Solución de Problemas

### Android
- Asegúrate de tener Android Studio instalado
- SDK de Android configurado
- Java 11+ instalado

### iOS (solo macOS)
- Xcode instalado
- CocoaPods instalado: `sudo gem install cocoapods`

### Electron
- Si hay problemas con node-gyp, instala build tools:
  ```bash
  npm install --global windows-build-tools
  ```

## 📂 Estructura del Proyecto

```
namustock-app/
├── src/                    # Código React (compartido)
├── public/
│   └── electron.js        # Configuración Electron
├── android/               # Proyecto Android nativo
├── ios/                   # Proyecto iOS nativo
├── build/                 # Build web
├── dist/                  # Instaladores desktop
└── capacitor.config.ts    # Configuración Capacitor
```

## 🎯 Próximos Pasos

1. **Probar en todas las plataformas**
2. **Personalizar iconos y splash screens**
3. **Configurar notificaciones push**
4. **Optimizar para cada plataforma**
5. **Configurar CI/CD para builds automáticos**

¡Tu app ya está lista para funcionar en cualquier dispositivo! 🎉