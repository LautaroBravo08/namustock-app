# Guía de Actualizaciones para Android

Esta guía te ayudará a configurar y probar el sistema de actualizaciones en dispositivos Android.

## 🚀 Configuración Rápida

### 1. Habilitar modo de prueba
```bash
npm run android:simulate-update
```

### 2. Compilar y sincronizar
```bash
npm run build
npx cap sync android
```

### 3. Ejecutar en Android
```bash
npx cap run android
```

## 📱 Cómo Probar las Actualizaciones

### Método 1: Botón Manual
1. Abre la aplicación en tu dispositivo Android
2. Ve al **menú de usuario** (esquina superior derecha)
3. Haz clic en **"Comprobar actualizaciones"**
4. Deberías ver: "¡Nueva versión 1.1.0 disponible!"

### Método 2: Actualizaciones Automáticas
1. Las actualizaciones se verifican automáticamente cada 30 segundos (en modo prueba)
2. Aparecerá una notificación cuando haya una actualización disponible

## 🛠️ Comandos Disponibles

```bash
# Probar actualizaciones completas
npm run test:android-updates

# Habilitar simulación de actualizaciones
npm run android:simulate-update

# Deshabilitar simulación
npm run android:disable-update

# Ver versión actual
npm run android:update-version
```

## 🔧 Configuración Avanzada

### Variables de Entorno (.env.local)
```env
REACT_APP_VERSION=1.0.0
REACT_APP_SIMULATE_UPDATE=true
REACT_APP_UPDATE_CHECK_INTERVAL=30000
REACT_APP_GITHUB_REPO=tu-usuario/tu-repo
```

### Archivo de Versión (public/version.json)
```json
{
  "version": "1.1.0",
  "buildDate": "2025-01-22T10:00:00Z",
  "platform": "android",
  "features": [
    "Mejoras en el sistema de actualizaciones",
    "Corrección de errores menores"
  ],
  "downloads": {
    "android": "/downloads/app-release-1.1.0.apk"
  }
}
```

## 🐛 Solución de Problemas

### Problema: "No hay actualizaciones disponibles"
**Solución:**
1. Verifica que la simulación esté habilitada:
   ```bash
   npm run android:update-version
   ```
2. Si está deshabilitada, habilítala:
   ```bash
   npm run android:simulate-update
   ```

### Problema: Error de red
**Solución:**
1. Verifica que el archivo `public/version.json` exista
2. Asegúrate de que la aplicación esté compilada:
   ```bash
   npm run build
   npx cap sync android
   ```

### Problema: Actualizaciones no automáticas
**Solución:**
1. Las actualizaciones automáticas solo funcionan cuando la app está en primer plano
2. El intervalo por defecto es 30 segundos en modo prueba
3. Verifica los logs en la consola del dispositivo

## 📊 Logs de Debugging

Para ver los logs de actualizaciones:
1. Abre Chrome DevTools
2. Ve a `chrome://inspect`
3. Selecciona tu dispositivo Android
4. Busca logs que empiecen con:
   - `🚀 UpdateService inicializado`
   - `🔍 Verificando actualizaciones para android`
   - `📱 Versión actual`

## 🔄 Flujo de Actualización

1. **Verificación**: La app verifica si hay nuevas versiones
2. **Comparación**: Compara versión actual vs versión del servidor
3. **Notificación**: Muestra notificación si hay actualización disponible
4. **Descarga**: Redirige al usuario para descargar la nueva versión

## 📝 Notas Importantes

- ⚠️ **Modo Simulación**: Solo para desarrollo y testing
- 🔒 **Producción**: Configura un servidor real o GitHub releases
- 📱 **APK**: Las actualizaciones requieren instalación manual del APK
- 🔄 **Automático**: Las verificaciones automáticas se ejecutan en segundo plano

## 🚀 Despliegue en Producción

Para usar en producción:

1. **Deshabilita la simulación**:
   ```bash
   npm run android:disable-update
   ```

2. **Configura GitHub releases** o tu propio servidor de actualizaciones

3. **Actualiza las variables de entorno**:
   ```env
   REACT_APP_SIMULATE_UPDATE=false
   REACT_APP_GITHUB_REPO=tu-usuario/tu-repo-real
   ```

4. **Compila para producción**:
   ```bash
   npm run build
   npx cap sync android
   npx cap build android
   ```

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en la consola
2. Verifica la configuración de variables de entorno
3. Asegúrate de que los archivos de versión estén actualizados