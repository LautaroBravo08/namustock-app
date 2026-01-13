import React, { useState, useEffect } from 'react';
import { X, Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { resendEmailVerification, logoutUser } from '../firebase/auth';

const EmailVerificationModal = ({ isOpen, onClose, user, showNotification }) => {
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  useBodyScrollLock(isOpen);

  // Cooldown para reenvío de email
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    
    setIsResending(true);
    const { error } = await resendEmailVerification();
    
    if (error) {
      showNotification(`Error al reenviar: ${error}`);
    } else {
      showNotification('Email de verificación reenviado. Revisa tu bandeja de entrada.');
      setResendCooldown(60); // 60 segundos de cooldown
    }
    
    setIsResending(false);
  };

  const handleCheckVerification = async () => {
    setIsCheckingVerification(true);
    
    // Recargar el usuario para obtener el estado más reciente
    try {
      await user.reload();
      if (user.emailVerified) {
        showNotification('¡Email verificado exitosamente!');
        onClose();
      } else {
        showNotification('El email aún no ha sido verificado. Por favor, revisa tu correo.');
      }
    } catch (error) {
      showNotification(`Error al verificar: ${error.message}`);
    }
    
    setIsCheckingVerification(false);
  };

  const handleLogout = async () => {
    const { error } = await logoutUser();
    if (error) {
      showNotification(`Error al cerrar sesión: ${error}`);
    } else {
      showNotification('Sesión cerrada. Puedes verificar tu email y volver a iniciar sesión.');
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-2 sm:p-4" onClick={onClose}>
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md mx-2 sm:mx-4 border border-[var(--color-border)] max-h-[95vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[var(--color-border)]">
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-[var(--color-primary)]" />
            <span className="hidden sm:inline">Verificar Email</span>
            <span className="sm:hidden">Verificar</span>
          </h2>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 text-center space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
          </div>
          
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Verifica tu correo electrónico
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-4">
              Hemos enviado un enlace de verificación a:
            </p>
            <p className="font-medium text-[var(--color-text-primary)] bg-[var(--color-bg)] px-3 py-2 rounded-lg text-sm break-all">
              {user.email}
            </p>
          </div>

          <div className="text-left bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 text-sm sm:text-base">Instrucciones:</h4>
            <ol className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>1. Revisa tu bandeja de entrada</li>
              <li>2. Busca el email de verificación</li>
              <li>3. Haz clic en el enlace de verificación</li>
              <li>4. Regresa aquí y haz clic en "Verificar"</li>
            </ol>
          </div>

          {/* Aviso sobre spam */}
          <div className="text-left bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 sm:p-4">
            <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2 text-sm sm:text-base flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              ¿No encuentras el email?
            </h4>
            <ul className="text-xs sm:text-sm text-orange-700 dark:text-orange-300 space-y-1">
              <li>• <strong>Revisa tu carpeta de SPAM/Correo no deseado</strong></li>
              <li>• Busca emails de "noreply" o "firebase"</li>
              <li>• Puede tardar hasta 5 minutos en llegar</li>
              <li>• Si no lo encuentras, puedes reenviarlo</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCheckVerification}
              disabled={isCheckingVerification}
              className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isCheckingVerification ? (
                <>
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="hidden sm:inline">Verificando...</span>
                  <span className="sm:hidden">Verificando...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Ya verifiqué mi email</span>
                  <span className="sm:hidden">Ya verifiqué</span>
                </>
              )}
            </button>

            <button
              onClick={handleResendEmail}
              disabled={isResending || resendCooldown > 0}
              className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 sm:py-2.5 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="hidden sm:inline">Reenviando...</span>
                  <span className="sm:hidden">Enviando...</span>
                </>
              ) : resendCooldown > 0 ? (
                <span className="text-xs sm:text-sm">{`Reenviar en ${resendCooldown}s`}</span>
              ) : (
                <>
                  <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden sm:inline">Reenviar email</span>
                  <span className="sm:hidden">Reenviar</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-3 sm:pt-4 border-t border-[var(--color-border)]">
            <button
              onClick={handleLogout}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs sm:text-sm font-medium"
            >
              Cerrar sesión y verificar después
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationModal;