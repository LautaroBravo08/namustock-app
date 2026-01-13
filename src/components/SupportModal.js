import React, { useState, useEffect } from 'react';
import { X, Heart } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';

const SupportModal = ({ isOpen, onClose }) => {
  const [showContent, setShowContent] = useState(false);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowContent(true), 10);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  if (!isOpen && !showContent) return null;

  return (
    <div
      className={`fixed inset-0 bg-black z-[70] flex justify-center items-center p-4 transition-opacity duration-300 ${
        isOpen ? 'bg-opacity-60' : 'bg-opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        className={`bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-yellow-500/50 transform transition-all duration-300 ease-out flex flex-col max-h-[90vh] ${
          showContent && isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b border-yellow-500/30 flex-shrink-0">
          <div className="flex items-center gap-3">
            <Heart className="h-6 w-6 text-yellow-400" />
            <h2 className="text-2xl font-bold text-yellow-400">Apoya el Proyecto</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-8 text-center overflow-y-auto">
          <p className="text-gray-200 text-lg mb-6">
            NamuStock se mantiene gratuito con el objetivo de apoyar a los pequeños emprendedores de Argentina.
          </p>
          <p className="text-gray-300 mb-8">
            Tu suscripción voluntaria nos permite seguir mejorando la aplicación y mantenerla accesible para todos.
          </p>
          
          <div className="bg-gray-800/50 border border-dashed border-gray-600 rounded-lg p-4 mb-8">
            <p className="text-yellow-400 font-semibold">¡Tú eliges el precio!</p>
            <p className="text-gray-300 text-sm">Puedes modificar el monto de la suscripción en la página de MercadoPago según lo que creas que vale la aplicación.</p>
          </div>

          <a
            href="https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=96639fd5b065440685decb18feaae48b"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-block bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 font-bold py-4 px-8 rounded-lg shadow-lg hover:scale-105 transform transition-transform duration-300 animate-pulse"
          >
            Suscribirse
          </a>
          
          <p className="text-gray-400 text-sm mt-8">
            ¡Muchas gracias por tu apoyo! ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default SupportModal;