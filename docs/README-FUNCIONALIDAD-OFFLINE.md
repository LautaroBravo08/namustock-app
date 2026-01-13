# Funcionalidad Offline - NamuStock

## 📱 Descripción General

NamuStock ahora funciona completamente sin conexión a internet. Todos los datos se guardan localmente y se sincronizan automáticamente cuando se restaura la conexión.

## 🔧 Características Principales

### ✅ Funcionalidad Offline Completa
- **Productos**: Agregar, editar, eliminar productos sin internet
- **Ventas**: Realizar ventas y registrar transacciones offline
- **Configuraciones**: Cambiar temas, configuraciones y preferencias
- **Datos persistentes**: Todo se guarda en el navegador localmente

### 🔄 Sincronización Automática
- **Detección automática**: Detecta cuando se restaura la conexión
- **Sincronización inteligente**: Solo sincroniza los cambios pendientes
- **Resolución de conflictos**: Maneja conflictos de datos automáticamente
- **Reintentos automáticos**: Reintenta sincronizar si falla la primera vez

### 📊 Indicadores Visuales
- **Estado de conexión**: Indicador en tiempo real del estado de internet
- **Cambios pendientes**: Contador de elementos esperando sincronización
- **Última sincronización**: Timestamp de la última sincronización exitosa
- **Notificaciones**: Alertas cuando se pierde/recupera la conexión

## 🛠️ Componentes Técnicos

### Hooks Principales

#### `useOfflineSync`
Maneja toda la lógica de sincronización offline:
```javascript
const {
  isOnline,           // Estado de conexión
  isSyncing,          // Si está sincronizando
  pendingChanges,     // Número de cambios pendientes
  lastSyncTime,       // Última sincronización
  syncPendingChanges, // Función para sincronizar manualmente
  handleProducts,     // Funciones para manejar productos
  handleSales,        // Funciones para manejar ventas
  handleSettings,     // Funciones para manejar configuraciones
  clearLocalData      // Limpiar datos locales
} = useOfflineSync(user);
```

#### `useNetworkStatus`
Detecta el estado de la conexión de manera robusta:
```javascript
const { isOnline, connectionType } = useNetworkStatus();
```

### Componentes de UI

#### `OfflineIndicator`
Muestra el estado de conexión y sincronización en la esquina superior derecha.

#### `OfflineNotification`
Notificaciones automáticas cuando cambia el estado de conexión.

## 💾 Almacenamiento Local

### Datos Guardados Localmente
- `namustock_products_offline`: Productos del usuario
- `namustock_sales_offline`: Ventas realizadas
- `namustock_settings_offline`: Configuraciones y preferencias
- `namustock_pending_sync`: Cambios pendientes de sincronización
- `namustock_last_sync`: Timestamp de última sincronización

### Limpieza Automática
- Los datos se limpian automáticamente al cerrar sesión
- Se mantienen solo mientras el usuario está autenticado
- Sincronización automática al iniciar sesión

## 🔄 Flujo de Sincronización

### 1. Modo Offline
```
Usuario realiza cambios → Guardar localmente → Marcar como pendiente
```

### 2. Conexión Restaurada
```
Detectar conexión → Cargar cambios pendientes → Sincronizar con Firebase → Actualizar estado
```

### 3. Resolución de Conflictos
```
Datos locales más recientes → Sobrescribir datos remotos
Datos remotos más recientes → Actualizar datos locales
```

## 🎯 Casos de Uso

### Escenario 1: Sin Internet Inicial
1. Usuario abre la app sin internet
2. Ve productos guardados previamente (si los hay)
3. Puede agregar/editar productos normalmente
4. Todo se guarda localmente
5. Cuando hay internet, todo se sincroniza automáticamente

### Escenario 2: Pérdida de Conexión Durante Uso
1. Usuario está usando la app con internet
2. Se pierde la conexión
3. Aparece notificación "Sin conexión"
4. Usuario continúa trabajando normalmente
5. Los cambios se marcan como pendientes
6. Al restaurarse la conexión, se sincroniza automáticamente

### Escenario 3: Múltiples Dispositivos
1. Usuario hace cambios en dispositivo A (offline)
2. Usuario abre la app en dispositivo B (online)
3. Ve los datos anteriores
4. Dispositivo A se conecta y sincroniza
5. Dispositivo B recibe los cambios automáticamente

## ⚙️ Configuración

### Habilitación Automática
La funcionalidad offline está habilitada automáticamente. No requiere configuración adicional.

### Personalización
Puedes ajustar los siguientes parámetros en `useOfflineSync.js`:
- `retryAttempts`: Número de reintentos (default: 3)
- `retryDelay`: Tiempo entre reintentos (default: 5000ms)
- `syncInterval`: Intervalo de verificación de conectividad (default: 30000ms)

## 🐛 Resolución de Problemas

### Problema: Los datos no se sincronizan
**Solución**: 
1. Verificar conexión a internet
2. Hacer clic en el botón de sincronización manual
3. Revisar la consola del navegador para errores

### Problema: Datos duplicados después de sincronizar
**Solución**: 
1. Los datos se deduplicarán automáticamente
2. Si persiste, cerrar sesión y volver a iniciar

### Problema: Indicador de conexión incorrecto
**Solución**: 
1. Refrescar la página
2. Verificar que no hay extensiones bloqueando la detección de red

## 📈 Beneficios

### Para el Usuario
- ✅ Nunca pierde datos por falta de internet
- ✅ Puede trabajar en cualquier lugar
- ✅ Experiencia fluida sin interrupciones
- ✅ Feedback visual claro del estado

### Para el Negocio
- ✅ Mayor disponibilidad de la aplicación
- ✅ Mejor experiencia de usuario
- ✅ Reducción de pérdida de datos
- ✅ Funcionalidad en áreas con internet limitado

## 🔮 Próximas Mejoras

- [ ] Sincronización selectiva (elegir qué sincronizar)
- [ ] Compresión de datos para sincronización más rápida
- [ ] Sincronización en segundo plano con Service Workers
- [ ] Modo offline avanzado con cache de imágenes
- [ ] Estadísticas de uso offline

---

**Nota**: Esta funcionalidad es compatible con todas las plataformas soportadas (Web, Android, iOS, Desktop).