import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut, Settings, Sun, Download, Upload, RefreshCw, Info, Bug } from 'lucide-react';
import { logoutUser } from '../firebase/auth';
import updateService from '../services/updateService';

const UserMenu = ({ 
  user, 
  onAppearanceClick, 
  onSettingsClick, 
  onImportExportClick, 
  showNotification 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  const menuRef = useRef(null);

  // Obtener versión de la aplicación
  const getAppVersion = () => {
    // HARDCODEAR versión igual que en updateService - NO USAR PROCESS.ENV
    const hardcodedVersion = '1.0.41'; // ← ACTUALIZAR ESTA LÍNEA EN CADA RELEASE
    return `v${hardcodedVersion}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleCheckUpdates = async () => {
    setIsCheckingUpdates(true);
    setIsMenuOpen(false);
    
    try {
      showNotification('Comprobando actualizaciones...');
      const updateInfo = await updateService.checkForUpdates();
      
      if (updateInfo && updateInfo.available) {
        showNotification(`¡Nueva versión ${updateInfo.version} disponible!`);
        // Notificar al servicio para mostrar la notificación de actualización
        updateService.notifyListeners({
          type: 'update-available',
          updateInfo
        });
      } else {
        showNotification('No hay actualizaciones disponibles');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      showNotification('Error al comprobar actualizaciones');
    } finally {
      setIsCheckingUpdates(false);
    }
  };



  const handleShowDebugLogs = () => {
    setIsMenuOpen(false);
    // Disparar evento personalizado para mostrar el DebugLogger
    window.dispatchEvent(new CustomEvent('showDebugLogger'));
  };

  const handleLogout = async () => {
    const { error } = await logoutUser();
    if (error) {
      showNotification(`Error al cerrar sesión: ${error}`);
    } else {
      showNotification('Sesión cerrada exitosamente');
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className="flex items-center gap-2 p-2 rounded-full hover:bg-[var(--color-bg)] transition-colors"
      >
        <div className="w-8 h-8 bg-[var(--color-primary)] rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-[var(--color-primary-text)]"/>
        </div>
        <span className="hidden sm:inline text-sm font-medium text-[var(--color-text-primary)] max-w-32 truncate">
          {user.displayName || user.email}
        </span>
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[var(--color-bg-secondary)] rounded-md shadow-lg py-1 z-50 border border-[var(--color-border)]">
          <div className="px-4 py-2 border-b border-[var(--color-border)]">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {user.displayName || 'Usuario'}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {user.email}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Info className="h-3 w-3 text-[var(--color-text-secondary)]" />
              <p className="text-xs text-[var(--color-text-secondary)] font-mono">
                {getAppVersion()}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { onAppearanceClick(); setIsMenuOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2"
          >
            <Sun className="h-4 w-4" /> Apariencia
          </button>
          
          <button 
            onClick={() => { onSettingsClick(); setIsMenuOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2"
          >
            <Settings className="h-4 w-4" /> Ajustes
          </button>
          
          <button 
            onClick={() => { onImportExportClick(); setIsMenuOpen(false); }}
            className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2"
          >
            <div className="relative h-4 w-4">
              <Upload className="h-3 w-3 absolute -top-0.5 -left-0.5 opacity-70" />
              <Download className="h-3 w-3 absolute top-0.5 left-0.5 opacity-70" />
            </div>
            Import/Export
          </button>
          
          <button 
            onClick={handleCheckUpdates}
            disabled={isCheckingUpdates}
            className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-4 w-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} /> 
            {isCheckingUpdates ? 'Comprobando...' : 'Comprobar actualizaciones'}
          </button>

          <button 
            onClick={handleShowDebugLogs}
            className="w-full text-left px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg)] flex items-center gap-2"
          >
            <Bug className="h-4 w-4" /> 
            Debug Logs
          </button>
          
          <hr className="my-1 border-[var(--color-border)]" />
          
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" /> Cerrar Sesión
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;