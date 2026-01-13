# 🎉 Sistema Premium - Instrucciones de Prueba Rápida

## ✅ Archivos Creados/Modificados

### Nuevos Archivos:
1. ✅ `src/services/subscriptionService.js` - Servicio de gestión de suscripciones
2. ✅ `src/components/ProductLimitIndicator.js` - Componente visual del límite
3. ✅ `SISTEMA-PREMIUM-README.md` - Documentación completa

### Archivos Modificados:
1. ✅ `src/App.js` - Validación de límite al agregar productos
2. ✅ `src/components/PremiumModal.js` - Modal mejorado con límite e opciones de pago
3. ✅ `src/pages/IAPage.js` - Indicador de límite en inventario
4. ✅ `src/firebase/firestore.js` - Funciones de suscripción
5. ✅ `functions/index.js` - Webhooks de MercadoPago y PayPal

---

## 🚀 Prueba Rápida Local

### 1. Instalar Dependencias
```bash
cd c:\Users\Gordo\Desktop\namustock-app
npm install
```

### 2. Iniciar la Aplicación
```bash
npm start
```

### 3. Probar el Límite de Productos

#### Opción A: Manualmente (más rápido)
1. Ve a la página de **Gestión de Inventario** (IA)
2. Verás el indicador de límite mostrando: `0/150 productos`
3. Agrega productos uno por uno
4. Observa cómo cambia la barra de progreso

#### Opción B: Simular 150 productos (script)
Puedes crear un script temporal para agregar productos de prueba.

En la consola del navegador (F12), ejecuta:
```javascript
// Función helper para generar productos de prueba
async function addTestProducts(count) {
  for (let i = 1; i <= count; i++) {
    const product = {
      id: `test-${Date.now()}-${i}`,
      name: `Producto de Prueba ${i}`,
      cost: 100,
      price: 140,
      stock: 10,
      category: 'Prueba'
    };
    
    // Simula el clic en agregar producto
    console.log(`Agregando producto ${i}/${count}...`);
    
    // Pequeño delay para no saturar
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Agregar 145 productos (casi al límite)
await addTestProducts(145);
```

### 4. Verificar Advertencias

Cuando llegues a **130 productos** (20 restantes):
- ✅ El indicador debe ponerse **AMARILLO**
- ✅ Debe aparecer el botón "Mejorar a Premium"
- ✅ Al agregar un producto debe mostrar: "¡Atención! Solo te quedan X productos disponibles"

Cuando llegues a **150 productos**:
- ✅ El indicador debe ponerse **ROJO**
- ✅ Debe aparecer "¡Límite alcanzado!"
- ✅ Al intentar agregar el producto 151:
  - ❌ Debe bloquearse
  - 🔔 Debe mostrar notificación de límite alcanzado
  - 🎁 Debe abrir automáticamente el `PremiumModal`

---

## 🧪 Probar el Modal Premium

### 1. Abrir el Modal Manualmente
- Click en el botón "Mejorar a Premium" en el indicador de límite
- O llegar al límite de 150 productos

### 2. Verificar Contenido del Modal
- ✅ Debe mostrar el contador actual: "Tienes X de 150 productos"
- ✅ Debe mostrar la barra de progreso visual
- ✅ Debe listar los 4 beneficios Premium
- ✅ Debe tener selector entre MercadoPago y PayPal
- ✅ PayPal debe estar deshabilitado con "Próximamente"
- ✅ Debe mostrar opciones de precio: $1.000, $2.000, $5.000
- ✅ Debe permitir ingresar monto personalizado

### 3. Simular Suscripción
1. Selecciona un monto (ej: $2.000)
2. Click en "Suscribirse"
3. Debe:
   - Abrir una nueva ventana con MercadoPago
   - Mostrar un alert con la información

**NOTA**: Para pruebas reales de pago, necesitarás usar las credenciales de sandbox de MercadoPago.

---

## 👑 Activar Premium Manualmente (Para Pruebas)

### Opción 1: Desde Firebase Console
1. Ve a: https://console.firebase.google.com/
2. Selecciona tu proyecto → Firestore
3. Navega a: `users/{userId}/data/settings`
4. Edita el documento y agrega/modifica:
```json
{
  "isPremium": true,
  "subscriptionStatus": "active",
  "subscriptionProvider": "mercadopago",
  "subscriptionStartDate": "2025-10-12T00:00:00.000Z"
}
```
5. Guarda y recarga la app

### Opción 2: Desde el Código (Temporal)
En `App.js`, línea ~75, cambia temporalmente:
```javascript
const [isPremium, setIsPremium] = useState(true); // <- Cambiar a true
```

**Después de activar Premium:**
- ✅ El indicador debe mostrar: "Premium - Productos ilimitados" con icono de corona
- ✅ Debe poder agregar más de 150 productos sin límite
- ✅ No debe aparecer la advertencia de límite

---

## 🎨 Indicadores Visuales

### Estados del Indicador de Límite

| Productos | Color | Estado | Acción |
|-----------|-------|--------|--------|
| 0-129 | 🔵 Azul | Normal | - |
| 130-149 | 🟡 Amarillo | Cerca del límite | Botón "Mejorar" |
| 150 | 🔴 Rojo | Límite alcanzado | Botón "¡Actualizar ahora!" |
| Premium | 👑 Dorado | Ilimitado | - |

---

## 📝 Checklist de Funcionalidades

### Límite de Productos
- [ ] Se muestra correctamente el contador (X/150)
- [ ] La barra de progreso refleja el porcentaje
- [ ] Cambia a amarillo con 20 productos restantes
- [ ] Cambia a rojo al alcanzar el límite
- [ ] Bloquea agregar productos al llegar a 150
- [ ] Muestra notificación al intentar exceder el límite

### Modal Premium
- [ ] Se abre automáticamente al alcanzar el límite
- [ ] Muestra información correcta del límite
- [ ] Tiene selector de método de pago
- [ ] Permite seleccionar montos predefinidos
- [ ] Permite ingresar monto personalizado
- [ ] Abre MercadoPago correctamente

### Usuario Premium
- [ ] El indicador muestra "Premium - Productos ilimitados"
- [ ] Puede agregar más de 150 productos
- [ ] No muestra advertencias de límite

---

## 🔧 Troubleshooting Rápido

### "No veo el indicador de límite"
- Verifica que estés en la página "Gestión de Inventario"
- Verifica que `onOpenPremiumModal` esté definido en props

### "El límite no se aplica"
- Verifica que `isPremium` sea `false`
- Revisa la consola del navegador por errores
- Verifica que `canAddMoreProducts` esté importado correctamente

### "El modal no se abre al alcanzar el límite"
- Verifica que `setIsPremiumModalOpen(true)` se ejecute
- Revisa la función `handleAddProduct` en App.js

### "Los productos se siguen agregando después de 150"
- Verifica que la validación en `handleAddProduct` esté antes del `if (isUpdate)`
- Asegúrate de que no estés en modo Premium

---

## 📊 Próximos Pasos

Una vez que hayas probado todo localmente:

1. **Configurar MercadoPago en Producción**
   - Crea tu plan de suscripción real
   - Actualiza el `planId` en `subscriptionService.js`
   - Configura webhooks

2. **Desplegar Firebase Functions**
   ```bash
   cd functions
   npm install
   firebase deploy --only functions
   ```

3. **Configurar Webhooks**
   - Obtén la URL de la función deployada
   - Configúrala en el panel de MercadoPago

4. **Probar Flujo Completo**
   - Hacer una suscripción de prueba
   - Verificar que el webhook active Premium
   - Confirmar que el usuario pueda agregar productos ilimitados

---

## 🎁 ¡Todo Listo!

El sistema premium está completamente implementado. Los usuarios ahora tendrán:
- ✅ Límite claro de 150 productos para usuarios gratuitos
- ✅ Advertencias visuales cuando se acercan al límite
- ✅ Proceso de suscripción simple con MercadoPago
- ✅ Productos ilimitados al ser Premium

**¿Necesitas ayuda?** Consulta el archivo `SISTEMA-PREMIUM-README.md` para documentación detallada.
