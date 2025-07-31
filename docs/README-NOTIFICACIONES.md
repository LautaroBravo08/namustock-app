# 🔔 Sistema de Notificaciones - NamuStock App

Tu aplicación ahora incluye un sistema completo de notificaciones push para mantener tu inventario bajo control.

## ✨ Funcionalidades

### 📱 Notificaciones Automáticas
- **Notificación diaria** a las 9:00 AM
- **Alertas de bajo stock** cuando los productos están por debajo del stock mínimo
- **Alertas de vencimiento** para productos que vencen en los próximos 7 días
- **Notificaciones inteligentes** que solo se envían cuando hay problemas

### 🎯 Ejemplos de Notificaciones

**Bajo Stock:**
```
📦 Revisión de Inventario
Tienes 3 productos con bajo stock
```

**Próximos a Vencer:**
```
📦 Revisión de Inventario  
Tienes 2 productos que están por vencer
```

**Combinado:**
```
📦 Revisión de Inventario
Tienes 3 productos con bajo stock y 2 productos por vencer
```

## ⚙️ Configuración

### Activar Notificaciones
1. Ve a **Configuraciones** (⚙️ en la barra superior)
2. En la sección **"Notificaciones de Inventario"**
3. Activa el interruptor
4. Acepta los permisos cuando te los solicite

### Personalizar Configuración
- **Horario**: Fijo a las 9:00 AM diariamente
- **Stock mínimo**: Configurable por producto (por defecto: 5 unidades)
- **Días de alerta**: 7 días antes del vencimiento

## 🔧 Funciones Técnicas

### Análisis Automático
La app analiza automáticamente tu inventario para:
- Detectar productos con stock ≤ stock mínimo
- Identificar productos que vencen en ≤ 7 días
- Programar notificaciones solo cuando es necesario

### Gestión Inteligente
- **Sin spam**: Solo notifica cuando hay problemas reales
- **Actualización automática**: Se reprograma cuando cambias el inventario
- **Navegación directa**: Toca la notificación para ir al inventario

## 📲 Cómo Usar

### Primera Configuración
1. **Instala la app** desde el APK
2. **Inicia sesión** con tu cuenta
3. **Ve a Configuraciones** → **Notificaciones**
4. **Activa las notificaciones**
5. **Prueba** con el botón "Probar Notificación"

### Uso Diario
1. **Recibe la notificación** a las 9:00 AM
2. **Toca la notificación** para abrir la app
3. **Revisa tu inventario** y toma acciones
4. **La app se actualiza** automáticamente para el día siguiente

## 🛠️ Configuración Avanzada

### Stock Mínimo por Producto
Cuando agregues o edites productos, puedes configurar:
```javascript
{
  name: "Producto X",
  quantity: 10,
  minStock: 5,  // ← Alerta cuando queden ≤ 5 unidades
  // ... otros campos
}
```

### Personalizar Horarios (Desarrolladores)
En `src/services/notificationService.js`:
```javascript
// Cambiar hora de notificación diaria
scheduledTime.setHours(9, 0, 0, 0); // 9:00 AM
```

## 🔍 Solución de Problemas

### No Recibo Notificaciones
1. **Verifica permisos**: Configuración → Apps → NamuStock → Notificaciones
2. **Revisa la configuración**: Asegúrate de que esté activada en la app
3. **Prueba manualmente**: Usa el botón "Probar Notificación"

### Notificaciones Duplicadas
- Las notificaciones se cancelan automáticamente antes de programar nuevas
- Si persiste, desactiva y reactiva las notificaciones

### No Funciona en Web
- Las notificaciones solo funcionan en la **app móvil nativa**
- En navegador web no están disponibles

## 📊 Datos que Analiza

### Productos con Bajo Stock
```javascript
products.filter(product => {
  const minStock = product.minStock || 5;
  return product.quantity <= minStock;
});
```

### Productos por Vencer
```javascript
products.filter(product => {
  if (!product.expirationDate) return false;
  const expirationDate = new Date(product.expirationDate);
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  return expirationDate <= sevenDaysFromNow;
});
```

## 🚀 Próximas Mejoras

- [ ] Notificaciones personalizables por horario
- [ ] Diferentes tipos de alertas (crítico, advertencia, info)
- [ ] Notificaciones por categoría de producto
- [ ] Integración con recordatorios de restock
- [ ] Estadísticas de notificaciones

## 💡 Consejos de Uso

1. **Configura stock mínimo** realista para cada producto
2. **Mantén fechas de vencimiento** actualizadas
3. **Revisa diariamente** las notificaciones para mejor control
4. **Usa la función de prueba** para verificar que funciona

¡Tu inventario ahora está bajo control automático! 📦✨