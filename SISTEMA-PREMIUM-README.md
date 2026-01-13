# 💰 Sistema Premium - NamuStock

> **ACTUALIZACIÓN IMPORTANTE:**
> A partir de la versión actual, **NamuStock es completamente GRATUITA**.
>
> Se han eliminado todos los límites de productos y las restricciones de uso.
> Este documento se mantiene solo como referencia histórica del sistema anterior.

## Estado Actual
- **Límite de Productos:** INFINITO (para todos los usuarios)
- **Funciones Premium:** Disponibles para todos
- **Pasarelas de Pago:** Desactivadas (código comentado/simplificado)
- **Webhooks:** Desactivados

---

# [REFERENCIA HISTÓRICA] Sistema Premium Anterior

El sistema premium permitía monetizar la aplicación mediante suscripciones mensuales.

## 1. Características Premium
- **Productos Ilimitados** (vs 150 en versión gratuita)
- **Sincronización en la Nube** (backup automático)
- **Soporte Prioritario**

## 2. Arquitectura
El estado premium se manejaba en el documento `settings` de cada usuario en Firestore:
```javascript
// users/{uid}/data/settings
{
  isPremium: true, // boolean
  subscriptionStatus: 'active', // 'active', 'cancelled', 'expired'
  subscriptionProvider: 'gumroad', // 'gumroad', 'mercadopago', 'paypal'
  subscriptionId: '...', // ID externo de la suscripción
  subscriptionExpiryDate: null // null para autorenovables
}
```

## 3. Integración con Gumroad (Desactivada)
Se utilizaba Gumroad como pasarela principal por su simplicidad.
- Webhook configurado en: `https://us-central1-namustock-app.cloudfunctions.net/gumroadWebhook`
- Producto: "NamuStock Pro"

## 4. Integración con MercadoPago (Desactivada)
Se utilizaba para cobros en ARS.
- Webhook: `mercadoPagoWebhook`

## 5. Lógica de Límites (Eliminada)
El archivo `src/services/subscriptionService.js` controlaba los límites.
Ahora devuelve siempre `Infinity` para permitir productos ilimitados.
