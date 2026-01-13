/**
 * Servicio de gestión de suscripciones Premium
 * Maneja MercadoPago y PayPal
 */

// Configuración de límites
export const SUBSCRIPTION_LIMITS = {
  FREE_PRODUCT_LIMIT: Infinity,
  PREMIUM_PRODUCT_LIMIT: Infinity,
  PREMIUM_MONTHLY_PRICE_ARS: 0, // Precio base en pesos argentinos
  PREMIUM_MONTHLY_PRICE_USD: 0, // Precio base en dólares
};

// Estados de suscripción
export const SUBSCRIPTION_STATUS = {
  NONE: 'none',
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending',
};

// Proveedores de pago
export const PAYMENT_PROVIDERS = {
  MERCADOPAGO: 'mercadopago',
  PAYPAL: 'paypal',
  GUMROAD: 'gumroad',
};

/**
 * Verifica si el usuario puede agregar más productos
 */
export const canAddMoreProducts = (currentProductCount, isPremium) => {
  return {
    canAdd: true,
    limit: SUBSCRIPTION_LIMITS.FREE_PRODUCT_LIMIT,
    remaining: Infinity,
  };
};

/**
 * Genera URL de suscripción de MercadoPago
 */
export const generateMercadoPagoSubscriptionUrl = (userId, amount = SUBSCRIPTION_LIMITS.PREMIUM_MONTHLY_PRICE_ARS) => {
  // IMPORTANTE: Reemplaza este ID con tu plan real de MercadoPago
  const planId = '96639fd5b065440685decb18feaae48b';
  
  return `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}&external_reference=${userId}&back_urls[success]=https://tu-dominio.com/subscription-success&back_urls[failure]=https://tu-dominio.com/subscription-failure`;
};

/**
 * Genera datos para PayPal Subscription
 */
export const generatePayPalSubscriptionData = (userId) => {
  return {
    plan_id: 'TU_PLAN_ID_DE_PAYPAL', // Reemplaza con tu plan real
    subscriber: {
      name: {
        given_name: 'Usuario',
        surname: 'NamuStock'
      },
      email_address: 'usuario@ejemplo.com' // Se actualizará con el email real
    },
    application_context: {
      brand_name: 'NamuStock',
      locale: 'es-AR',
      shipping_preference: 'NO_SHIPPING',
      user_action: 'SUBSCRIBE_NOW',
      payment_method: {
        payer_selected: 'PAYPAL',
        payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
      },
      return_url: `https://tu-dominio.com/subscription-success?user=${userId}`,
      cancel_url: `https://tu-dominio.com/subscription-cancel?user=${userId}`
    },
    custom_id: userId
  };
};

/**
 * Genera URL de suscripción de Gumroad
 */
export const generateGumroadSubscriptionUrl = (userId, email) => {
  // TODO: Reemplaza con el slug real de tu producto en Gumroad
  const productSlug = 'namustock-pro'; 
  const baseUrl = `https://gumroad.com/l/${productSlug}`;
  
  // Parámetros para pre-llenar y seguimiento
  const params = new URLSearchParams();
  if (email) params.append('email', email);
  // Gumroad permite campos personalizados si se configuran en el producto
  if (userId) params.append('user_id', userId); 
  
  return `${baseUrl}?${params.toString()}`;
};

/**
 * Valida el estado de una suscripción
 */
export const validateSubscriptionStatus = (subscription) => {
  if (!subscription) {
    return {
      isValid: false,
      status: SUBSCRIPTION_STATUS.NONE,
      message: 'No hay suscripción activa'
    };
  }

  const now = new Date();
  const expiryDate = subscription.expiryDate ? new Date(subscription.expiryDate) : null;

  // Verificar si la suscripción está activa
  if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) {
    // Verificar si no ha expirado
    if (expiryDate && expiryDate > now) {
      return {
        isValid: true,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        expiryDate: expiryDate,
        daysRemaining: Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24))
      };
    } else if (!expiryDate) {
      // Suscripción recurrente sin fecha de expiración
      return {
        isValid: true,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        isRecurring: true
      };
    }
  }

  return {
    isValid: false,
    status: subscription.status || SUBSCRIPTION_STATUS.EXPIRED,
    message: 'La suscripción ha expirado o fue cancelada'
  };
};

/**
 * Formatea información de suscripción para mostrar
 */
export const formatSubscriptionInfo = (subscription, validation) => {
  if (!validation.isValid) {
    return {
      status: 'Inactiva',
      statusColor: 'text-red-500',
      message: validation.message || 'Sin suscripción activa'
    };
  }

  let statusText = 'Activa';
  let statusColor = 'text-green-500';
  let message = '';

  if (validation.daysRemaining !== undefined) {
    if (validation.daysRemaining <= 7) {
      statusColor = 'text-yellow-500';
      message = `Renueva en ${validation.daysRemaining} días`;
    } else {
      message = `Válida por ${validation.daysRemaining} días más`;
    }
  } else if (validation.isRecurring) {
    message = 'Suscripción mensual activa';
  }

  let providerName = 'Desconocido';
  switch (subscription.provider) {
    case PAYMENT_PROVIDERS.MERCADOPAGO:
      providerName = 'MercadoPago';
      break;
    case PAYMENT_PROVIDERS.PAYPAL:
      providerName = 'PayPal';
      break;
    case PAYMENT_PROVIDERS.GUMROAD:
      providerName = 'Gumroad';
      break;
    default:
      providerName = subscription.provider || 'Desconocido';
  }

  return {
    status: statusText,
    statusColor,
    message,
    provider: providerName,
    startDate: subscription.startDate
  };
};

/**
 * Calcula el precio de suscripción con descuentos opcionales
 */
export const calculateSubscriptionPrice = (basePrice, discountPercentage = 0) => {
  const discount = basePrice * (discountPercentage / 100);
  return Math.round(basePrice - discount);
};

/**
 * Obtiene información de límites para el usuario
 */
export const getUserLimitsInfo = (productCount, isPremium) => {
  const limits = canAddMoreProducts(productCount, isPremium);
  
  return {
    current: productCount,
    limit: limits.limit,
    remaining: limits.remaining,
    percentage: isPremium ? 0 : (productCount / SUBSCRIPTION_LIMITS.FREE_PRODUCT_LIMIT) * 100,
    isNearLimit: !isPremium && limits.remaining <= 20,
    isAtLimit: !limits.canAdd,
  };
};
