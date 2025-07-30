import React, { useState } from 'react';
import { Mail, X, RefreshCw } from 'lucide-react';
import { resendEmailVerification } from '../firebase/auth';

const EmailVerificationBanner = ({ user, showNotification }) => {
  const [isResending, setIsResending] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    const { error } = await resendEmailVerification();
    
    if (error) {
      showNotification(`Error al reenviar: ${error}`);
    } else {
      showNotification('Email de verificación reenviado. Revisa tu bandeja de entrada.');
    }
    
    setIsResending(false);
  };

  const handleReload = async () => {
    try {
      await user.reload();
      if (user.emailVerified) {
        showNotification('¡Email verificado exitosamente!');
      } else {
        showNotification('El email aún no ha sido verificado.');
      }
    } catch (error) {
      showNotification(`Error al verificar: ${error.message}`);
    }
  };

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-yellow-600" />
          <div className="text-sm">
            <span className="font-medium text-yellow-800">
              Verifica tu email para acceder a todas las funciones.
            </span>
            <span className="text-yellow-700 ml-2">
              Enviado a: {user.email}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleReload}
            className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-md hover:bg-green-200 transition-colors"
          >
            Ya verifiqué
          </button>
          
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md hover:bg-yellow-200 transition-colors disabled:opacity-50 flex items-center gap-1"
          >
            {isResending ? (
              <>
                <RefreshCw className="h-3 w-3 animate-spin" />
                Enviando...
              </>
            ) : (
              'Reenviar'
            )}
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationBanner;