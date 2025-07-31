# 🚀 Sistema de Actualizaciones In-App con Limpieza Automática

## 📋 Resumen

Hemos implementado un sistema completo de actualizaciones automáticas dentro de la aplicación que incluye:

- ✅ **Descarga automática** de APKs dentro de la app
- ✅ **Instalación automática** sin salir de la aplicación
- ✅ **Limpieza automática** de APKs antiguos después de cada actualización
- ✅ **Progreso visual** de descarga e instalación
- ✅ **Notificaciones inteligentes** del estado de actualización
- ✅ **Fallback seguro** si algo falla

## 🔧 Componentes del Sistema

### 1. **UpdateService Mejorado** (`src/services/updateService.js`)
- Descarga APKs directamente en el dispositivo
- Limpia automáticamente APKs antiguos antes de descargar
- Maneja la instalación usando plugin nativo personalizado
- Proporciona feedback en tiempo real del progreso

### 2. **Plugin Nativo Android** (`android/app/src/main/java/com/namustock/app/ApkInstallerPlugin.java`)
- Plugin personalizado de Capacitor para instalar APKs
- Compatible con Android 7.0+ usando FileProvider
- Maneja permisos automáticamente

### 3. **Componente de Notificación Mejorado** (`src/components/UpdateNotification.js`)
- Muestra progreso de descarga en tiempo real
- Estados visuales claros (descargando, instalando, completado, error)
- Mensajes informativos sobre la limpieza automática

### 4. **Scripts de Automatización**
- `build-and-deploy.js`: Construcción y despliegue completo
- `cleanup-apks.js`: Limpieza automática de archivos antiguos

## 🚀 Cómo Funciona

### Proceso de Actualización Automática:

1. **Detección**: La app verifica automáticamente nuevas versiones cada 5 minutos
2. **Notificación**: Muestra una notificación elegante cuando hay actualización disponible
3. **Descarga**: Al hacer clic en "Actualizar":
   - Limpia APKs antiguos automáticamente
   - Descarga el nuevo APK en segundo plano
   - Muestra progreso visual en tiempo real
4. **Instalación**: 
   - Usa el plugin nativo para instalar automáticamente
   - Muestra instrucciones claras al usuario
   - Fallback a método tradicional si es necesario
5. **Limpieza**: Elimina archivos temporales y APKs antiguos

### Limpieza Automática:

- **Antes de descargar**: Elimina APKs antiguos para liberar espacio
- **Después de instalar**: Limpia archivos temporales
- **Mantenimiento**: Conserva solo los 3 APKs más recientes
- **Estadísticas**: Muestra cuánto espacio se liberó

## 📱 Comandos Disponibles

### Construcción y Despliegue:
```bash
# Construcción básica con nueva versión patch
npm run build:deploy:patch

# Construcción con versión minor y limpieza
npm run build:deploy:minor

# Construcción con versión major y limpieza
npm run build:deploy:major

# Construcción personalizada
node build-and-deploy.js patch --clean --auto
```

### Limpieza Manual:
```bash
# Limpiar solo APKs (mantener 3 más recientes)
npm run cleanup

# Limpieza completa (APKs, cache, build)
npm run cleanup:all

# Ver estadísticas de espacio
npm run cleanup:stats

# Limpiar manteniendo 5 APKs más recientes
node cleanup-apks.js apks 5
```

### Pruebas de Actualización:
```bash
# Probar sistema de actualizaciones Android
npm run test:android-updates

# Simular actualización disponible
npm run android:simulate-update

# Deshabilitar simulación
npm run android:disable-update
```

## 🔧 Configuración Técnica

### Permisos Android Requeridos:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
```

### FileProvider Configurado:
- Permite acceso seguro a archivos APK
- Compatible con Android 7.0+ (API 24+)
- Configuración en `android/app/src/main/res/xml/file_paths.xml`

### Plugins de Capacitor Instalados:
- `@capacitor/filesystem`: Manejo de archivos
- `@capacitor-community/file-opener`: Abrir archivos
- Plugin personalizado `ApkInstaller`: Instalación nativa

## 📊 Beneficios del Nuevo Sistema

### Para el Usuario:
- ✅ **Sin salir de la app**: Todo sucede dentro de la aplicación
- ✅ **Progreso visual**: Ve exactamente qué está pasando
- ✅ **Automático**: No necesita buscar archivos o limpiar manualmente
- ✅ **Seguro**: Fallbacks automáticos si algo falla
- ✅ **Rápido**: Limpieza automática libera espacio

### Para el Desarrollador:
- ✅ **Automatizado**: Scripts manejan todo el proceso
- ✅ **Mantenible**: Código modular y bien documentado
- ✅ **Escalable**: Fácil agregar nuevas funcionalidades
- ✅ **Debuggeable**: Logs detallados en cada paso
- ✅ **Eficiente**: Limpieza automática evita acumulación de archivos

## 🔄 Flujo de Trabajo Recomendado

### Para Desarrollo:
1. Hacer cambios en el código
2. Ejecutar `npm run build:deploy:patch --clean`
3. El script automáticamente:
   - Incrementa la versión
   - Actualiza todos los archivos necesarios
   - Construye la aplicación
   - Genera el APK
   - Limpia archivos antiguos

### Para Releases:
1. Ejecutar `npm run build:deploy:minor` para versiones con nuevas características
2. Ejecutar `npm run build:deploy:major` para cambios importantes
3. Subir el APK generado a GitHub Releases
4. Las apps instaladas se actualizarán automáticamente

## 🛠️ Troubleshooting

### Si la descarga falla:
- La app automáticamente abre el navegador como fallback
- Los usuarios pueden descargar manualmente desde GitHub

### Si la instalación falla:
- El sistema usa FileOpener como método alternativo
- Logs detallados ayudan a identificar problemas

### Si hay problemas de espacio:
- Ejecutar `npm run cleanup:all` para limpieza completa
- Ver `npm run cleanup:stats` para estadísticas de espacio

## 📝 Próximos Pasos

1. **Probar el sistema completo**:
   ```bash
   npm run build:deploy:patch
   npm run test:android-updates
   ```

2. **Verificar en dispositivo real**:
   - Instalar APK generado
   - Probar actualización automática
   - Verificar limpieza de archivos

3. **Configurar GitHub Releases**:
   - Subir APK a releases
   - Verificar URLs de descarga
   - Probar detección automática

## 🎉 Resultado Final

Con este sistema, tus usuarios tendrán una experiencia de actualización completamente fluida:

- **Notificación elegante** cuando hay actualización
- **Descarga automática** con progreso visual
- **Instalación sin fricción** dentro de la app
- **Limpieza automática** para mantener el dispositivo optimizado
- **Fallbacks seguros** si algo no funciona

¡El sistema está listo para usar! 🚀