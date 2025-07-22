import React, { useState } from 'react';
import { X, Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { resetPassword } from '../firebase/auth';

const ForgotPasswordModal = ({ isOpen, onClose, showNotification }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useBodyScrollLock(isOpen);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showNotification('Por favor, ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    const { error } = await resetPassword(email);
    
    if (error) {
      // Manejar errores específicos de Firebase
      let errorMessage = 'Error al enviar el correo de restablecimiento';
      
      if (error.includes('user-not-found')) {
        errorMessage = 'No existe una cuenta con este correo electrónico';
      } else if (error.includes('invalid-email')) {
        errorMessage = 'El formato del correo electrónico no es válido';
      } else if (error.includes('too-many-requests')) {
        errorMessage = 'Demasiados intentos. Espera un momento antes de intentar de nuevo';
      }
      
      showNotification(errorMessage);
    } else {
      setEmailSent(true);
      showNotification(`Correo de restablecimiento enviado a ${email}`);
    }
    
    setLoading(false);
  };

  const handleClose = () => {
    setEmail('');
    setEmailSent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex justify-center items-center p-4">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-border)]">
        <div className="flex justify-between items-center p-5 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-2">
            {emailSent ? (
              <>
                <CheckCircle className="h-6 w-6 text-green-500" />
                Correo Enviado
              </>
            ) : (
              <>
                <Mail className="h-6 w-6 text-[var(--color-primary)]" />
                Restablecer Contraseña
              </>
            )}
          </h2>
          <button onClick={handleClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        {emailSent ? (
          // Pantalla de confirmación
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                ¡Correo enviado exitosamente!
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm mb-4">
                Hemos enviado un enlace para restablecer tu contraseña a:
              </p>
              <p className="font-medium text-[var(--color-text-primary)] bg-[var(--color-bg)] px-3 py-2 rounded-lg">
                {email}
              </p>
            </div>

            <div className="text-left bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Revisa tu bandeja de entrada (y spam)</li>
                <li>2. Haz clic en el enlace del correo</li>
                <li>3. Crea una nueva contraseña</li>
                <li>4. Regresa e inicia sesión</li>
              </ol>
            </div>

            <button
              onClick={handleClose}
              className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              Entendido
            </button>
          </div>
        ) : (
          // Formulario de restablecimiento
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="text-center mb-4">
              <p className="text-[var(--color-text-secondary)] text-sm">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[var(--color-text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-2 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  placeholder="tu@email.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--color-primary)] text-[var(--color-primary-text)] py-2 px-4 rounded-lg font-semibold hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando...' : 'Enviar Correo de Restablecimiento'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="w-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm font-medium flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;