# 🚀 Sistema de Auto-Actualización

Este documento explica cómo funciona el sistema de auto-actualización de TiendaModerna y cómo usarlo para deployments automáticos.

## 📋 Características

- ✅ **Detección automática** de nuevas versiones cada 30 segundos
- ✅ **Notificaciones visuales** cuando hay actualizaciones disponibles
- ✅ **Actualización en un clic** sin perder datos
- ✅ **Soporte multiplataforma** (Web, Electron, Android, iOS)
- ✅ **Service Worker** para actualizaciones en segundo plano
- ✅ **Versionado semántico** (major.minor.patch)
- ✅ **Scripts automatizados** para deployment

## 🔧 Cómo Funciona

### 1. Detección de Actualizaciones
- El service worker verifica `/version.json` cada 30 segundos
- Compara la versión actual con la del servidor
- Notifica automáticamente cuando hay una nueva versión

### 2. Proceso de Actualización
- Usuario recibe notificación visual
- Hace clic en "Actualizar"
- La app descarga la nueva versión en segundo plano
- Se reinicia automáticamente con la nueva versión

### 3. Plataformas Soportadas
- **Web/PWA**: Service Worker + Cache API
- **Electron**: Auto-updater nativo
- **Android/iOS**: Descarga de APK/IPA desde GitHub Releases

## 🚀 Comandos de Deployment

### Actualización de Versión Solamente
```bash
# Incrementar versión patch (1.0.0 → 1.0.1)
npm run version:patch

# Incrementar versión minor (1.0.1 → 1.1.0)
npm run version:minor

# Incrementar versión major (1.1.0 → 2.0.0)
npm run version:major
```

### Deployment Completo
```bash
# Deployment con incremento patch
npm run deploy:patch

# Deployment con incremento minor
npm run deploy:minor

# Deployment con incremento major
npm run deploy:major

# Deployment sin especificar tipo (usa patch por defecto)
npm run deploy
```

### Verificar Actualizaciones
```bash
# Verificar si hay actualizaciones disponibles
npm run update-check
```

## 📝 Proceso de Deployment Automatizado

Cuando ejecutas `npm run deploy:patch`, el sistema:

1. **Verifica la rama actual** y cambios pendientes
2. **Actualiza la versión** en `version.json` y `package.json`
3. **Ejecuta los tests** para asegurar calidad
4. **Crea el build** de producción
5. **Hace commit** de los cambios con mensaje automático
6. **Crea un tag** de la nueva versión
7. **Sube los cambios** al repositorio remoto
8. **Muestra resumen** del deployment

## 🔄 Flujo de Trabajo Recomendado

### Para Desarrollo Diario
```bash
# 1. Hacer cambios en el código
# 2. Probar localmente
npm start

# 3. Cuando esté listo, hacer deployment patch
npm run deploy:patch
```

### Para Nuevas Características
```bash
# Para nuevas funcionalidades
npm run deploy:minor
```

### Para Cambios Importantes
```bash
# Para cambios que rompen compatibilidad
npm run deploy:major
```

## 📱 Experiencia del Usuario

### Notificación de Actualización
Los usuarios verán una notificación elegante en la esquina inferior derecha con:
- Icono de la plataforma (Web, Móvil, Escritorio)
- Versión nueva disponible
- Notas de la versión (si están disponibles)
- Botones "Más tarde" y "Actualizar"

### Proceso de Actualización
1. Usuario hace clic en "Actualizar"
2. Aparece indicador de progreso
3. La app se actualiza automáticamente
4. Se reinicia con la nueva versión
5. Los datos del usuario se mantienen intactos

## 🛠️ Configuración Técnica

### Archivos Importantes
- `public/version.json` - Información de versión actual
- `public/sw.js` - Service Worker para actualizaciones
- `src/services/updateService.js` - Lógica de actualización
- `src/components/UpdateNotification.js` - UI de notificaciones
- `update-version.js` - Script para actualizar versiones
- `deploy.js` - Script de deployment automatizado

### Variables de Entorno
```bash
REACT_APP_VERSION=1.0.0  # Versión de la aplicación
```

### Service Worker
El service worker se registra automáticamente y:
- Cachea recursos estáticos
- Verifica actualizaciones periódicamente
- Notifica cuando hay nuevas versiones
- Maneja la actualización en segundo plano

## 🔍 Debugging y Troubleshooting

### Verificar Estado del Service Worker
```javascript
// En la consola del navegador
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log('Service Workers:', registrations);
});
```

### Forzar Actualización
```javascript
// En la consola del navegador
navigator.serviceWorker.getRegistration().then(reg => {
  if (reg) reg.update();
});
```

### Limpiar Cache
```javascript
// En la consola del navegador
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Logs del Service Worker
- Abre DevTools → Application → Service Workers
- Verifica que esté activo y funcionando
- Revisa los logs en la consola

## 📊 Monitoreo

### Métricas Importantes
- Tiempo de detección de actualizaciones
- Tasa de adopción de nuevas versiones
- Errores durante el proceso de actualización
- Plataformas más utilizadas

### Logs Útiles
```javascript
// El service worker registra automáticamente:
console.log('SW: Nueva versión detectada');
console.log('SW: Actualización aplicada');
console.log('SW: Cache actualizado');
```

## 🚨 Consideraciones Importantes

### Antes de Hacer Deployment
- ✅ Probar la aplicación localmente
- ✅ Ejecutar todos los tests
- ✅ Verificar que no hay errores en consola
- ✅ Probar en diferentes navegadores/dispositivos
- ✅ Hacer backup de la base de datos si es necesario

### Después del Deployment
- ✅ Verificar que la nueva versión se despliega correctamente
- ✅ Monitorear errores en producción
- ✅ Confirmar que las notificaciones de actualización funcionan
- ✅ Probar el proceso de actualización en diferentes plataformas

## 🎯 Mejores Prácticas

1. **Versionado Semántico**: Usa patch para bugs, minor para features, major para breaking changes
2. **Tests Automáticos**: Siempre ejecuta tests antes del deployment
3. **Commits Descriptivos**: Los commits automáticos incluyen la versión y fecha
4. **Monitoreo Continuo**: Revisa logs y métricas después de cada deployment
5. **Rollback Plan**: Ten un plan para revertir cambios si algo sale mal

## 🔮 Próximas Mejoras

- [ ] Rollback automático en caso de errores
- [ ] A/B testing para nuevas versiones
- [ ] Notificaciones push para actualizaciones críticas
- [ ] Dashboard de métricas de actualización
- [ ] Actualización diferencial (solo cambios)

---

¡Con este sistema, tus usuarios siempre tendrán la versión más reciente de TiendaModerna sin complicaciones! 🎉