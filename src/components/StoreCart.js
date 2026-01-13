import React, { useState } from 'react';
import { X, Plus, Minus, Trash2, ShoppingCart, CreditCard, Building2, Truck, MapPin } from 'lucide-react';
import { formatNumber } from '../utils/helpers';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const StoreCart = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  store,
  showNotification
}) => {
  useBodyScrollLock(isOpen);

  const [step, setStep] = useState(1); // 1: Carrito, 2: Datos del cliente, 3: Confirmación
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });
  const [shippingMethod, setShippingMethod] = useState('pickup'); // pickup, delivery
  const [paymentMethod, setPaymentMethod] = useState('mercado_pago'); // mercado_pago, bank_transfer
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPrice = (price) => {
    return formatNumber(price, store?.settings?.allowDecimals !== false);
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = shippingMethod === 'delivery' ? (store?.shipping?.shippingCost || 0) : 0;
  const total = subtotal + shippingCost;

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity < 1) {
      onRemoveItem(productId);
    } else {
      onUpdateQuantity(productId, newQuantity);
    }
  };

  const validateCustomerData = () => {
    const { name, email, phone } = customerData;

    if (!name.trim()) {
      showNotification('Por favor ingresa tu nombre');
      return false;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showNotification('Por favor ingresa un email válido');
      return false;
    }

    if (!phone.trim()) {
      showNotification('Por favor ingresa tu teléfono');
      return false;
    }

    if (shippingMethod === 'delivery' && !customerData.address.trim()) {
      showNotification('Por favor ingresa tu dirección para el envío');
      return false;
    }

    return true;
  };

  const handleCheckout = async () => {
    if (!validateCustomerData()) return;

    setIsSubmitting(true);

    try {
      const orderData = {
        customer: customerData,
        items: cartItems,
        shipping: {
          method: shippingMethod,
          address: shippingMethod === 'delivery' ? customerData.address : store.shipping?.pickupAddress,
          cost: shippingCost
        },
        payment: {
          method: paymentMethod
        },
        totals: {
          subtotal,
          shipping: shippingCost,
          total
        },
        storeId: store.id,
        storeName: store.name
      };

      console.log('Order data:', orderData);

      // Simular delay de procesamiento
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (paymentMethod === 'mercado_pago') {
        showNotification('Redirigiendo a Mercado Pago...');
      } else {
        setStep(3);
      }

    } catch (error) {
      console.error('Error processing checkout:', error);
      showNotification('Error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCart = () => {
    setStep(1);
    setCustomerData({
      name: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    setShippingMethod('pickup');
    setPaymentMethod('mercado_pago');
  };

  const handleClose = () => {
    resetCart();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6" style={{ color: 'var(--primary-color)' }} />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Tu Carrito' : step === 2 ? 'Datos de Entrega' : 'Confirmar Pedido'}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress indicator */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                1
              </div>
              <span>Carrito</span>
            </div>

            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                2
              </div>
              <span>Datos</span>
            </div>

            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                3
              </div>
              <span>Confirmar</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Paso 1: Carrito */}
          {step === 1 && (
            <div className="p-6">
              {cartItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tu carrito está vacío</h3>
                  <p className="text-gray-600">Agrega algunos productos para continuar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ShoppingCart className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
                        <p className="text-sm text-gray-600">${formatPrice(item.price)} c/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Minus className="h-4 w-4 text-gray-600" />
                        </button>

                        <span className="w-8 text-center font-medium">{item.quantity}</span>

                        <button
                          onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <Plus className="h-4 w-4 text-gray-600" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ${formatPrice(item.price * item.quantity)}
                        </p>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1 mt-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Resumen */}
                  <div className="border-t border-gray-200 pt-4 mt-6">
                    <div className="flex justify-between text-lg font-semibold text-gray-900">
                      <span>Subtotal:</span>
                      <span>${formatPrice(subtotal)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 2: Datos del cliente */}
          {step === 2 && (
            <div className="p-6 space-y-6">
              {/* Información del cliente */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Información de contacto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu nombre completo"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      value={customerData.phone}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                </div>
              </div>

              {/* Método de entrega */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Método de entrega</h3>
                <div className="space-y-3">
                  <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="shipping"
                      value="pickup"
                      checked={shippingMethod === 'pickup'}
                      onChange={(e) => setShippingMethod(e.target.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">Retiro en local</span>
                        <span className="text-green-600 text-sm font-medium">Gratis</span>
                      </div>
                      {store.shipping?.pickupAddress && (
                        <p className="text-sm text-gray-600 mt-1">
                          {store.shipping.pickupAddress}
                        </p>
                      )}
                    </div>
                  </label>

                  {store.shipping?.homeDelivery && (
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="shipping"
                        value="delivery"
                        checked={shippingMethod === 'delivery'}
                        onChange={(e) => setShippingMethod(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Envío a domicilio</span>
                          {shippingCost > 0 && (
                            <span className="text-blue-600 text-sm font-medium">
                              +${formatPrice(shippingCost)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Entrega en tu domicilio
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                {shippingMethod === 'delivery' && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dirección de entrega *
                    </label>
                    <input
                      type="text"
                      value={customerData.address}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Calle, número, ciudad, código postal"
                    />
                  </div>
                )}
              </div>

              {/* Método de pago */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Método de pago</h3>
                <div className="space-y-3">
                  {store.payment?.mercadoPago?.enabled && (
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="mercado_pago"
                        checked={paymentMethod === 'mercado_pago'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Mercado Pago</span>
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Recomendado
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Tarjetas de crédito, débito, efectivo y más
                        </p>
                      </div>
                    </label>
                  )}

                  {store.payment?.bankTransfer?.enabled && (
                    <label className="flex items-start gap-3 p-3 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        value="bank_transfer"
                        checked={paymentMethod === 'bank_transfer'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-600" />
                          <span className="font-medium">Transferencia bancaria</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Transferencia o depósito bancario
                        </p>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Resumen del pedido */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Resumen del pedido</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal ({cartItems.length} productos)</span>
                    <span>${formatPrice(subtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span>Envío</span>
                    <span>{shippingCost > 0 ? `$${formatPrice(shippingCost)}` : 'Gratis'}</span>
                  </div>

                  <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {step === 3 && paymentMethod === 'bank_transfer' && (
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Pedido confirmado!
                </h3>
                <p className="text-gray-600">
                  Realiza la transferencia con los siguientes datos
                </p>
              </div>

              {/* Datos bancarios */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h4 className="font-medium text-gray-900 mb-3">Datos para transferencia</h4>
                <div className="space-y-2 text-sm">
                  {store.payment?.bankTransfer?.alias && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Alias:</span>
                      <span className="font-mono font-medium">{store.payment.bankTransfer.alias}</span>
                    </div>
                  )}

                  {store.payment?.bankTransfer?.cbu && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">CBU:</span>
                      <span className="font-mono font-medium">{store.payment.bankTransfer.cbu}</span>
                    </div>
                  )}

                  {store.payment?.bankTransfer?.accountHolder && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Titular:</span>
                      <span className="font-medium">{store.payment.bankTransfer.accountHolder}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold text-lg">
                    <span>Monto a transferir:</span>
                    <span>${formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center justify-between">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Volver
              </button>
            )}

            <div className="flex items-center gap-3 ml-auto">
              {step === 1 && cartItems.length > 0 && (
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-2 text-white rounded-md transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  Continuar
                </button>
              )}

              {step === 2 && (
                <button
                  onClick={handleCheckout}
                  disabled={isSubmitting}
                  className="px-6 py-2 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4" />
                      Confirmar Pedido
                    </>
                  )}
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-white rounded-md transition-colors"
                  style={{ backgroundColor: 'var(--primary-color)' }}
                >
                  Cerrar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreCart;