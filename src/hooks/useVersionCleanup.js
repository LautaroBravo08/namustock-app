// Hook para limpiar versiones al iniciar la app
import { useEffect } from 'react';

export const useVersionCleanup = () => {
  useEffect(() => {
    console.log('🧹 LIMPIEZA FORZADA DE VERSIONES - INICIANDO');
    
    // Obtener versión actual del código
    const currentVersion = process.env.REACT_APP_VERSION || '1.0.0';
    console.log(`📦 Versión actual del código: ${currentVersion}`);
    
    // Verificar si ya se hizo la limpieza para esta versión
    const cleanupVersion = localStorage.getItem('cleanup-version');
    if (cleanupVersion === currentVersion) {
      console.log('✅ Limpieza ya realizada para esta versión');
      return;
    }
    
    console.log('🗑️ Limpiando TODOS los datos de versiones...');
    
    // Limpiar TODOS los datos relacionados con versiones
    const keysToRemove = [
      'installed-app-version',
      'last-checked-version', 
      'app-version',
      'namustock-version',
      'version',
      'update-info',
      'last-update-check'
    ];
    
    keysToRemove.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`🗑️ Eliminando: ${key} = ${value}`);
        localStorage.removeItem(key);
      }
    });
    
    // Marcar que la limpieza se completó para esta versión
    localStorage.setItem('cleanup-version', currentVersion);
    
    console.log('✅ LIMPIEZA COMPLETA TERMINADA');
    console.log(`📌 Versión marcada como limpia: ${currentVersion}`);
  }, []);
};

export default useVersionCleanup;