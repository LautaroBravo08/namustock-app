const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Constantes de suscripción
const SUBSCRIPTION_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending',
};

const PAYMENT_PROVIDERS = {
  // MERCADOPAGO: 'mercadopago',
  // PAYPAL: 'paypal',
  // GUMROAD: 'gumroad',
};

/**
 * Webhook de MercadoPago - DESACTIVADO
 */
exports.mercadoPagoWebhook = functions.https.onRequest(async (req, res) => {
  return res.status(200).send('Webhook desactivado - App es gratuita');
});

/**
 * Webhook de PayPal - DESACTIVADO
 */
exports.paypalWebhook = functions.https.onRequest(async (req, res) => {
  return res.status(200).send('Webhook desactivado - App es gratuita');
});

/**
 * Webhook de Gumroad - DESACTIVADO
 */
exports.gumroadWebhook = functions.https.onRequest(async (req, res) => {
  return res.status(200).send('Webhook desactivado - App es gratuita');
});

/**
 * Función programada para verificar suscripciones expiradas
 * Se ejecuta diariamente a medianoche
 */
exports.checkExpiredSubscriptions = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async (context) => {
    try {
      console.log('Verificando suscripciones expiradas...');
      
      const db = admin.firestore();
      const now = new Date();
      
      // Buscar todos los usuarios con suscripciones activas
      const usersSnapshot = await db.collection('users').get();
      
      let expiredCount = 0;
      
      for (const userDoc of usersSnapshot.docs) {
        const settingsDoc = await userDoc.ref.collection('data').doc('settings').get();
        
        if (!settingsDoc.exists) continue;
        
        const settings = settingsDoc.data();
        
        // Solo verificar suscripciones activas con fecha de expiración
        if (settings.isPremium && settings.subscriptionExpiryDate) {
          const expiryDate = new Date(settings.subscriptionExpiryDate);
          
          if (expiryDate <= now) {
            // Suscripción expirada
            await settingsDoc.ref.set({
              isPremium: false,
              subscriptionStatus: SUBSCRIPTION_STATUS.EXPIRED,
              lastUpdated: new Date().toISOString()
            }, { merge: true });
            
            console.log(`Suscripción expirada para usuario ${userDoc.id}`);
            expiredCount++;
          }
        }
      }
      
      console.log(`Verificación completada. ${expiredCount} suscripciones expiradas.`);
      
    } catch (error) {
      console.error('Error verificando suscripciones expiradas:', error);
    }
  });