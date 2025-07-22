import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { auth } from './config';

// Registrar usuario
export const registerUser = async (email, password, displayName) => {
  try {
    console.log('Creando usuario con email:', email);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Usuario creado exitosamente:', userCredential.user.uid);
    
    // Actualizar el perfil del usuario con el nombre
    if (displayName) {
      await updateProfile(userCredential.user, {
        displayName: displayName
      });
      console.log('Perfil actualizado con nombre:', displayName);
    }
    
    // Enviar email de verificación con configuración personalizada
    console.log('Enviando email de verificación a:', email);
    const actionCodeSettings = {
      url: `${window.location.origin}/?verified=true`,
      handleCodeInApp: false,
    };
    
    try {
      await sendEmailVerification(userCredential.user, actionCodeSettings);
      console.log('Email de verificación enviado exitosamente');
      console.log('Configuración del email:', actionCodeSettings);
    } catch (emailError) {
      console.error('Error específico al enviar email:', emailError);
      // Intentar sin configuración personalizada como fallback
      await sendEmailVerification(userCredential.user);
      console.log('Email enviado con configuración por defecto');
    }
    
    return { user: userCredential.user, error: null };
  } catch (error) {
    console.error('Error en registerUser:', error);
    return { user: null, error: error.message };
  }
};

// Iniciar sesión
export const loginUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error) {
    return { user: null, error: error.message };
  }
};

// Cerrar sesión
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { error: null };
  } catch (error) {
    return { error: error.message };
  }
};

// Reenviar email de verificación
export const resendEmailVerification = async () => {
  try {
    const user = auth.currentUser;
    console.log('Usuario actual:', user?.email, 'Verificado:', user?.emailVerified);
    
    if (user && !user.emailVerified) {
      console.log('Reenviando email de verificación a:', user.email);
      const actionCodeSettings = {
        url: window.location.origin,
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
      console.log('Email de verificación reenviado exitosamente');
      return { error: null };
    }
    return { error: 'No hay usuario o el email ya está verificado' };
  } catch (error) {
    console.error('Error al reenviar email:', error);
    return { error: error.message };
  }
};

// Restablecer contraseña
export const resetPassword = async (email) => {
  try {
    console.log('Enviando email de restablecimiento a:', email);
    const actionCodeSettings = {
      url: window.location.origin,
      handleCodeInApp: false,
    };
    
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('Email de restablecimiento enviado exitosamente');
    return { error: null };
  } catch (error) {
    console.error('Error al enviar email de restablecimiento:', error);
    return { error: error.message };
  }
};

// Observar cambios en el estado de autenticación
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};